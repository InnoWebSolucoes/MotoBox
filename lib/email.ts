import "server-only";
import { urlPublica } from "@/lib/base";
import { lerDoc } from "@/lib/conteudo";
import { lerDefinicoes } from "@/lib/supabase/publico";
import {
  DOMINIO_ENVIO, EMAILS_PADRAO, ENDERECO_ENVIO, NOME_REMETENTE,
  comPadraoContas, preencherModelo,
  type ChaveDestino, type ChaveModelo, type ConteudoEmails,
} from "@/lib/conteudo/grupos/contas";

/* ============================================================
   MOTOBOX — Envio de emails
   Todos os emails do site saem daqui, pela API da Resend:
   confirmação de conta, recuperação de palavra-passe, contacto,
   marketplace, denúncias, importação, bilhetes, respostas da
   equipa e o email de teste. Os envios em massa (avisos e
   newsletter) usam o lote de lib/notificacoes.ts, com o mesmo
   remetente.

   - Remetente: "<nome> <geral@motobox.innoweb.agency>". O nome
     edita-se no painel (Definições → Emails); RESEND_FROM, quando
     definido, troca o endereço (e o nome, se o painel o deixar
     em branco).
   - Responder-para: o do painel ou, em branco, o email da MotoBox
     (Definições → Contactos).
   - Os textos de cada email e os destinos de cada tipo de
     mensagem vivem no documento "site.emails".
   ============================================================ */

const RESEND = "https://api.resend.com";

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Endereço público do site para as ligações dos emails (nunca localhost). */
export function urlSite(): string {
  // O site vive em innoweb.agency/motobox: ver lib/base.ts.
  return urlPublica();
}

/** "a@x.ao, b@y.ao; c@z.ao" → endereços válidos, sem repetidos. */
export function listaEnderecos(v: unknown): string[] {
  if (typeof v !== "string") return [];
  const vistos = new Set<string>();
  for (const parte of v.split(/[,;\s]+/)) {
    const e = parte.trim().toLowerCase();
    if (EMAIL_VALIDO.test(e)) vistos.add(e);
  }
  return [...vistos];
}

/** O primeiro nome, para as saudações. */
export const primeiroNome = (nome: unknown) => String(nome ?? "").trim().split(/\s+/)[0] ?? "";

/* ---------------- Configuração (painel + ambiente) ---------------- */

/** Nome sem caracteres que estragam o cabeçalho "From". */
const limparNome = (s: string) => s.replace(/[<>"\r\n]/g, "").trim().slice(0, 70);

/** Endereço e nome de RESEND_FROM ("Nome <endereco>" ou só o endereço). */
function remetenteDoAmbiente(): { nome: string; endereco: string } | null {
  const v = process.env.RESEND_FROM?.trim();
  if (!v) return null;
  const m = /^(.*)<\s*([^>\s]+)\s*>\s*$/.exec(v);
  if (m && EMAIL_VALIDO.test(m[2])) return { nome: limparNome(m[1].replace(/^"|"$/g, "")), endereco: m[2] };
  if (EMAIL_VALIDO.test(v)) return { nome: "", endereco: v };
  return null;
}

export interface ConfigEmails {
  conteudo: ConteudoEmails;
  nomeSite: string;
  /** Email da MotoBox nas Definições (Contactos). */
  emailContacto: string;
  /** Cabeçalho "From" completo. */
  remetente: string;
  /** Endereço de envio (sem o nome). */
  enderecoEnvio: string;
  /** Verdadeiro quando RESEND_FROM troca o endereço de partida. */
  remetenteDoAmbiente: boolean;
  /** Para onde vão as respostas, por omissão. */
  responderPara: string[];
  /** Endereços da equipa para um tipo de mensagem (com o email da MotoBox como recurso). */
  destino: (chave: ChaveDestino) => string[];
  /** Textos de um modelo, já com as {variáveis} trocadas. */
  modelo: (chave: ChaveModelo, valores?: Record<string, string | number | undefined>) => {
    assunto: string; titulo: string; paragrafos: string[]; botao: string; rodape: string;
  };
}

/** Lê o que o painel gravou ("site.emails" e Definições), sempre com valores de partida. */
export async function lerConfigEmails(): Promise<ConfigEmails> {
  const [gravado, definicoes] = await Promise.all([
    lerDoc<unknown>("site.emails").catch(() => null),
    lerDefinicoes().catch(() => null),
  ]);
  const conteudo = comPadraoContas(EMAILS_PADRAO, gravado);
  const nomeSite = (definicoes?.nomeSite ?? "").trim() || NOME_REMETENTE;
  const emailContacto = listaEnderecos(definicoes?.emailContacto)[0] ?? "";

  const ambiente = remetenteDoAmbiente();
  const enderecoEnvio = ambiente?.endereco ?? ENDERECO_ENVIO;
  const nome = limparNome(conteudo.remetente.nome) || ambiente?.nome || NOME_REMETENTE;
  const responderPara = listaEnderecos(conteudo.remetente.responderPara);
  const recurso = emailContacto ? [emailContacto] : [];

  return {
    conteudo,
    nomeSite,
    emailContacto,
    remetente: `${nome} <${enderecoEnvio}>`,
    enderecoEnvio,
    remetenteDoAmbiente: Boolean(ambiente),
    responderPara: responderPara.length ? responderPara : recurso,
    destino: (chave) => {
      const lista = listaEnderecos(conteudo.destinos[chave]);
      return lista.length ? lista : recurso;
    },
    modelo: modeloDe(conteudo, nomeSite),
  };
}

/** Os textos de um modelo com as {variáveis} trocadas (também sem ler a configuração). */
export function modeloDe(conteudo: ConteudoEmails = EMAILS_PADRAO, nomeSite = NOME_REMETENTE): ConfigEmails["modelo"] {
  return (chave, valores = {}) => {
    const t = conteudo.modelos[chave];
    const v = { site: nomeSite, ...valores };
    const p = (s: string) => preencherModelo(s, v).trim();
    return {
      assunto: p(t.assunto).replace(/\s+/g, " ").slice(0, 200),
      titulo: p(t.titulo),
      paragrafos: p(t.intro).split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean),
      botao: p(t.botao),
      rodape: p(t.rodape),
    };
  };
}

/* ---------------- Envio ---------------- */

export interface EmailUnico {
  para: string | string[];
  assunto: string;
  html: string;
  texto: string;
  /** Endereço(s) para onde vão as respostas. Omitido: o do painel. `null`: nenhum. */
  responderPara?: string | string[] | null;
  cabecalhos?: Record<string, string>;
  /** Tipo de email, para filtrar na Resend (só letras). */
  tipo?: ChaveModelo;
}

export type ResultadoEmail = { ok: true; id?: string } | { ok: false; erro: string; estado?: number };

/** Frase legível para uma recusa da Resend. */
export function erroDaResend(estado: number, corpo: string, endereco = ENDERECO_ENVIO): string {
  let mensagem = corpo;
  try {
    const j = JSON.parse(corpo) as { message?: string };
    if (j?.message) mensagem = j.message;
  } catch { /* não é JSON */ }
  const m = mensagem.toLowerCase();
  const dominio = endereco.split("@")[1] ?? DOMINIO_ENVIO;

  if (estado === 401 || m.includes("api key is invalid")) {
    return "A chave da Resend (RESEND_API_KEY) não é válida. Confirme-a nas variáveis do servidor.";
  }
  if (m.includes("restricted") && m.includes("key")) {
    return "A chave da Resend só tem permissão para enviar: para ver os emails enviados é precisa uma chave com acesso total.";
  }
  if (estado === 403 && (m.includes("testing emails") || m.includes("own email"))) {
    return "O email não seguiu: a Resend está em modo de teste e só entrega na caixa do dono da conta. Falta verificar o domínio de envio.";
  }
  if (estado === 403 && m.includes("domain")) {
    return `O email não seguiu: o domínio de envio (${dominio}) ainda não está verificado na Resend. Faltam os registos DNS do domínio.`;
  }
  if (estado === 422) return `A Resend recusou o email: ${mensagem}`;
  if (estado === 429) return "Foram enviados demasiados emails seguidos. Tente de novo daqui a um minuto.";
  if (estado >= 500) return `O serviço de email (Resend) está com problemas (${estado}). Tente de novo dentro de momentos.`;
  return `O serviço de email recusou o envio (${estado})${mensagem ? `: ${mensagem}` : "."}`;
}

const SEM_CHAVE = "O envio de emails não está configurado neste servidor (falta RESEND_API_KEY).";

export const emailConfigurado = () => Boolean(process.env.RESEND_API_KEY);

const comoLista = (v: string | string[] | null | undefined): string[] =>
  v == null ? [] : (Array.isArray(v) ? v : [v]).map((x) => x.trim()).filter(Boolean);

/** Envia um email. Nunca lança: devolve o id da Resend, ou a frase do erro. */
export async function enviarEmail(e: EmailUnico, config?: ConfigEmails): Promise<ResultadoEmail> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    console.warn(`[email] ${SEM_CHAVE} Por enviar: «${e.assunto}» para ${comoLista(e.para).join(", ")}.`);
    return { ok: false, erro: SEM_CHAVE, estado: 503 };
  }
  const para = comoLista(e.para);
  if (para.length === 0) return { ok: false, erro: "Não há destinatário para este email.", estado: 400 };

  const cfg = config ?? (await lerConfigEmails());
  const responder = e.responderPara === undefined ? cfg.responderPara : comoLista(e.responderPara);

  let r: Response;
  try {
    r = await fetch(`${RESEND}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: cfg.remetente,
        to: para,
        subject: e.assunto,
        html: e.html,
        text: e.texto,
        ...(responder.length ? { reply_to: responder } : {}),
        ...(e.cabecalhos ? { headers: e.cabecalhos } : {}),
        ...(e.tipo ? { tags: [{ name: "tipo", value: e.tipo }] } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return { ok: false, erro: "Não foi possível contactar o serviço de email (Resend). Tente de novo.", estado: 502 };
  }
  if (r.ok) {
    const j = (await r.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, id: j?.id };
  }
  const corpo = await r.text().catch(() => "");
  console.error(`[email] Resend ${r.status} («${e.assunto}»): ${corpo}`);
  return { ok: false, erro: erroDaResend(r.status, corpo, cfg.enderecoEnvio), estado: r.status };
}

/** `null` quando a Resend aceitou; senão a frase a mostrar a quem pediu. */
export async function enviarEmailUnico(e: EmailUnico, config?: ConfigEmails): Promise<string | null> {
  const r = await enviarEmail(e, config);
  return r.ok ? null : r.erro;
}

/* ---------------- Modelo HTML ---------------- */

/** Parágrafo com as mudanças de linha mantidas. */
const paragrafoHtml = (p: string, estilo = "margin:0 0 12px") =>
  `<p style="${estilo}">${escapar(p).replace(/\n/g, "<br>")}</p>`;

export interface CorpoEmail {
  titulo: string;
  paragrafos: string[];
  /** Texto citado (a mensagem de quem escreveu), com um rótulo por cima. */
  citacao?: { rotulo: string; texto: string };
  /** Lista de dados ("Clube: …", "Província: …"). */
  detalhes?: [string, string][];
  botao?: { texto: string; url: string };
  rodape?: string;
}

/** Mensagem curta com a marca: título, parágrafos, citação, dados, botão e rodapé. */
export function modeloSimples(c: CorpoEmail): { html: string; texto: string } {
  const botao = c.botao?.texto && c.botao.url
    ? `<p style="margin:24px 0"><a href="${escapar(c.botao.url)}" style="display:inline-block;background:#e10600;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700">${escapar(c.botao.texto)}</a></p>
<p style="margin:0 0 12px;font-size:12px;color:#777777">Se o botão não funcionar, copie esta ligação para o navegador:<br><span style="word-break:break-all">${escapar(c.botao.url)}</span></p>`
    : "";
  const citacao = c.citacao?.texto
    ? `<p style="margin:16px 0 6px;font-size:13px;color:#555555">${escapar(c.citacao.rotulo)}</p>
<div style="margin:0 0 16px;font-size:14px;color:#222222;border-left:3px solid #e10600;padding:2px 0 2px 12px">${c.citacao.texto.trim().split(/\n{2,}/).map((p) => paragrafoHtml(p, "margin:0 0 10px")).join("")}</div>`
    : "";
  const detalhes = c.detalhes?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;font-size:14px;border-collapse:collapse">${c.detalhes
        .map(([k, v]) => `<tr><td style="padding:4px 14px 4px 0;color:#666666;vertical-align:top;white-space:nowrap">${escapar(k)}</td><td style="padding:4px 0;color:#111111">${escapar(v).replace(/\n/g, "<br>")}</td></tr>`)
        .join("")}</table>`
    : "";

  const html = `<!doctype html>
<html lang="pt-AO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:560px;margin:0 auto;padding:24px 20px;font-family:Arial,Helvetica,sans-serif;color:#111111;font-size:15px;line-height:1.55">
<p style="margin:0 0 20px;font-weight:700;letter-spacing:1px">MOTOBOX <span style="color:#e10600">ANGOLA</span></p>
${c.titulo ? `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3">${escapar(c.titulo)}</h1>` : ""}
${c.paragrafos.map((p) => paragrafoHtml(p)).join("\n")}
${citacao}
${detalhes}
${botao}
${c.rodape ? `<hr style="border:none;border-top:1px solid #dddddd;margin:24px 0 12px">${paragrafoHtml(c.rodape, "margin:0;font-size:12px;color:#777777")}` : ""}
</div>
</body></html>`;

  const texto = [
    ...(c.titulo ? [c.titulo, ""] : []),
    ...c.paragrafos.flatMap((p) => [p, ""]),
    ...(c.citacao?.texto ? [c.citacao.rotulo, ...c.citacao.texto.trim().split("\n").map((l) => `> ${l}`), ""] : []),
    ...(c.detalhes?.length ? [...c.detalhes.map(([k, v]) => `${k}: ${v}`), ""] : []),
    ...(c.botao?.texto && c.botao.url ? [`${c.botao.texto}: ${c.botao.url}`, ""] : []),
    ...(c.rodape ? ["--", c.rodape] : []),
  ].join("\n").trim();
  return { html, texto };
}

/**
 * Monta um email a partir de um modelo do painel: os textos vêm de
 * "site.emails", o resto (citação, dados, ligação do botão) do código.
 */
export function emailDoModelo(
  cfg: ConfigEmails,
  chave: ChaveModelo,
  valores: Record<string, string | number | undefined>,
  extra: { url?: string; citacao?: CorpoEmail["citacao"]; detalhes?: CorpoEmail["detalhes"]; semRodape?: boolean } = {},
): { assunto: string; html: string; texto: string } {
  const t = cfg.modelo(chave, valores);
  const { html, texto } = modeloSimples({
    titulo: t.titulo,
    paragrafos: t.paragrafos,
    citacao: extra.citacao,
    detalhes: extra.detalhes,
    botao: extra.url && t.botao ? { texto: t.botao, url: extra.url } : undefined,
    rodape: extra.semRodape ? undefined : t.rodape || undefined,
  });
  return { assunto: t.assunto || cfg.nomeSite, html, texto };
}

/**
 * Avisa a equipa (um destino do painel). Devolve null quando seguiu, ou
 * a frase do erro. Sem destino configurado não envia nada e diz porquê.
 */
export async function avisarEquipa(
  cfg: ConfigEmails,
  destino: ChaveDestino,
  email: { assunto: string; html: string; texto: string; responderPara?: string | null; tipo?: ChaveModelo },
): Promise<string | null> {
  const para = cfg.destino(destino);
  if (para.length === 0) {
    const falta = "Não há endereço da equipa para este tipo de mensagem (Definições → Emails, ou o email da MotoBox em Contactos).";
    console.warn(`[email] ${falta} (${destino})`);
    return falta;
  }
  return enviarEmailUnico({ ...email, para }, cfg);
}

/* ---------------- Resend: leitura (painel) ---------------- */

export interface EmailEnviado {
  id: string;
  para: string[];
  de: string;
  assunto: string;
  criado: string;
  /** Último estado na Resend: sent, delivered, bounced, complained, delivery_delayed, opened, clicked, queued, failed… */
  estado: string;
}

/** Os últimos emails que a Resend aceitou (precisa de uma chave com acesso total). */
export async function listarEmailsEnviados(limite = 30): Promise<{ emails: EmailEnviado[] } | { erro: string }> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { erro: SEM_CHAVE };
  try {
    const r = await fetch(`${RESEND}/emails?limit=${Math.min(100, Math.max(1, limite))}`, {
      headers: { Authorization: `Bearer ${chave}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const corpo = await r.text();
    if (!r.ok) return { erro: erroDaResend(r.status, corpo) };
    const j = JSON.parse(corpo) as { data?: Record<string, unknown>[] };
    const emails = (j.data ?? []).map((e) => ({
      id: String(e.id ?? ""),
      para: Array.isArray(e.to) ? e.to.map(String) : [String(e.to ?? "")],
      de: String(e.from ?? ""),
      assunto: String(e.subject ?? ""),
      criado: String(e.created_at ?? ""),
      estado: String(e.last_event ?? "sent"),
    }));
    return { emails };
  } catch {
    return { erro: "Não foi possível contactar a Resend para ler os emails enviados." };
  }
}

export interface EstadoDominio {
  nome: string;
  /** not_started, pending, verified, failed, temporary_failure, ou "em-falta" se não existir na conta. */
  estado: string;
}

/** O estado do domínio de envio na Resend (verificado ou não). */
export async function estadoDoDominio(endereco = ENDERECO_ENVIO): Promise<EstadoDominio | { erro: string }> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { erro: SEM_CHAVE };
  const nome = endereco.split("@")[1] ?? DOMINIO_ENVIO;
  if (nome === "resend.dev") return { nome, estado: "teste" };
  try {
    const r = await fetch(`${RESEND}/domains`, {
      headers: { Authorization: `Bearer ${chave}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const corpo = await r.text();
    if (!r.ok) return { erro: erroDaResend(r.status, corpo) };
    const j = JSON.parse(corpo) as { data?: { name?: string; status?: string }[] };
    const d = (j.data ?? []).find((x) => x.name === nome);
    return { nome, estado: d?.status ?? "em-falta" };
  } catch {
    return { erro: "Não foi possível contactar a Resend para ver o domínio." };
  }
}
