import "server-only";

/* ============================================================
   MOTOBOX — Notificações por email
   Quando nasce um evento, abrem bilhetes, sai um resultado ou
   entra um anúncio no marketplace, avisa por email quem o pediu
   em /conta (`user_metadata.preferencias`).

   Só o canal de email existe. O envio usa a API da Resend por
   `fetch`, em lotes de até 100 mensagens. Nada aqui lança erros
   para quem chama: uma falha no aviso nunca estraga a escrita
   que o originou.
   ============================================================ */

import { supabaseAdmin } from "@/lib/supabase/server";
import { normalizarPreferencias, type Preferencias } from "@/lib/conta/preferencias";
import type { AnuncioMarketplace, Corrida, Evento, ResultadoCorrida } from "@/lib/types";
import { urlPublica } from "@/lib/base";

/** Uma conta que pode receber avisos por email. */
export interface Destinatario {
  id: string;
  email: string;
  nome?: string;
  preferencias: Preferencias;
}

/** Uma mensagem pronta a seguir para a Resend. */
export interface EmailPreparado {
  para: string;
  assunto: string;
  html: string;
  texto: string;
  /** Cabeçalhos próprios desta mensagem (ex.: List-Unsubscribe da newsletter). */
  cabecalhos?: Record<string, string>;
}

/** Resumo devolvido por cada aviso, útil em testes e registos. */
export interface ResumoEnvio {
  destinatarios: number;
  enviados: number;
}

/** Equipa tal como é lida para cruzar nomes com slugs. */
export interface EquipaResumo {
  slug: string;
  nome: string;
}

const RESEND_LOTE = "https://api.resend.com/emails/batch";
const MAX_LOTE = 100;
const POR_PAGINA = 1000;

const VAZIO: ResumoEnvio = { destinatarios: 0, enviados: 0 };

/* ---------------- Utilitários ---------------- */

/**
 * Endereço público para as ligações. Ao contrário do cliente de
 * autenticação, aqui não há navegador: sem domínio definido usa-se
 * o site publicado, nunca localhost.
 */
function urlBase(): string {
  // O site vive em innoweb.agency/motobox: ver lib/base.ts.
  return urlPublica();
}

/** Verdadeiro quando há pelo menos um tipo de bilhete. */
export function temBilhetes(bilhetes: unknown): boolean {
  return Array.isArray(bilhetes) && bilhetes.length > 0;
}

const escapar = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normal = (s: unknown) => String(s ?? "").trim().toLowerCase();

function data(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-AO", {
      day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Luanda",
    });
  } catch {
    return "";
  }
}

function kwanzas(valor: number): string {
  return `${new Intl.NumberFormat("pt-AO").format(valor)} Kz`;
}

const ordinal = (n: number) => `${n}.º`;

/* ---------------- Modelo do email ---------------- */

interface Conteudo {
  assunto: string;
  titulo: string;
  paragrafos: string[];      // texto simples, escapado aqui
  ligacoes: { texto: string; url: string }[];
}

/** Monta o HTML e o texto simples de uma mensagem. */
function montar(d: Destinatario, c: Conteudo): EmailPreparado {
  const base = urlBase();
  const preferencias = `${base}/conta?aba=notificacoes`;
  const saudacao = d.nome ? `Olá, ${d.nome}.` : "Olá.";

  const botoes = c.ligacoes
    .map(
      (l) =>
        `<p style="margin:0 0 12px"><a href="${escapar(l.url)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">${escapar(l.texto)}</a></p>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="pt-AO"><body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:560px;margin:0 auto;padding:24px 20px;font-family:Arial,Helvetica,sans-serif;color:#111111;font-size:15px;line-height:1.5">
<p style="margin:0 0 20px;font-weight:700;letter-spacing:1px">MOTOBOX ANGOLA</p>
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3">${escapar(c.titulo)}</h1>
<p style="margin:0 0 12px">${escapar(saudacao)}</p>
${c.paragrafos.map((p) => `<p style="margin:0 0 12px">${escapar(p)}</p>`).join("\n")}
<div style="margin:20px 0">${botoes}</div>
<hr style="border:none;border-top:1px solid #dddddd;margin:24px 0 12px">
<p style="margin:0;font-size:12px;color:#555555">Recebe este email porque o pediu na sua conta Motobox. <a href="${escapar(preferencias)}" style="color:#555555">Alterar preferências de notificação</a></p>
</div>
</body></html>`;

  const texto = [
    c.titulo,
    "",
    saudacao,
    ...c.paragrafos,
    "",
    ...c.ligacoes.map((l) => `${l.texto}: ${l.url}`),
    "",
    `Alterar preferências de notificação: ${preferencias}`,
  ].join("\n");

  return { para: d.email, assunto: c.assunto, html, texto };
}

/* ---------------- Planeamento (sem envio) ---------------- */

/**
 * Evento novo: quem segue o calendário recebe o aviso do evento;
 * se já houver bilhetes, quem segue a bilheteira também. Uma só
 * mensagem por pessoa, mesmo que as duas coisas se apliquem.
 */
export function planearNovoEvento(evento: Evento, destinatarios: Destinatario[]): EmailPreparado[] {
  if (!evento?.slug || !evento.titulo || evento.estado === "concluido") return [];
  const base = urlBase();
  const comBilhetes = temBilhetes(evento.bilhetes);
  const quando = data(evento.dataInicio);
  const onde = [evento.circuito, evento.localidade, evento.provincia].filter(Boolean).join(", ");
  const detalhe = [quando && `Data: ${quando}`, onde && `Local: ${onde}`].filter(Boolean).join(". ");
  const precoMin = comBilhetes
    ? Math.min(...(evento.bilhetes ?? []).map((b) => Number(b.preco) || 0))
    : 0;

  const saida: EmailPreparado[] = [];
  for (const d of destinatarios) {
    const calendario = d.preferencias.notificacoes.calendario;
    const bilhetes = comBilhetes && d.preferencias.notificacoes.bilhetes;
    if (!calendario && !bilhetes) continue;

    const ligacoes: Conteudo["ligacoes"] = [];
    const paragrafos: string[] = [];
    let assunto: string;

    if (calendario) {
      assunto = bilhetes
        ? `Novo evento com bilhetes à venda: ${evento.titulo}`
        : `Novo evento no calendário: ${evento.titulo}`;
      paragrafos.push(
        bilhetes
          ? "Há um novo evento no calendário Motobox e os bilhetes já estão à venda."
          : "Há um novo evento no calendário Motobox.",
      );
      ligacoes.push({ texto: "Ver evento", url: `${base}/calendario/${evento.slug}` });
    } else {
      assunto = `Bilhetes à venda: ${evento.titulo}`;
      paragrafos.push("Os bilhetes para este evento já estão à venda.");
    }
    if (detalhe) paragrafos.push(`${detalhe}.`);
    if (evento.resumo) paragrafos.push(evento.resumo);
    if (bilhetes) {
      if (precoMin > 0) paragrafos.push(`Bilhetes a partir de ${kwanzas(precoMin)}.`);
      ligacoes.push({ texto: "Comprar bilhetes", url: `${base}/bilhetes/${evento.slug}` });
    }

    saida.push(montar(d, { assunto, titulo: evento.titulo, paragrafos, ligacoes }));
  }
  return saida;
}

/** Bilhetes abertos num evento que já existia. */
export function planearBilhetesAbertos(evento: Evento, destinatarios: Destinatario[]): EmailPreparado[] {
  if (!evento?.slug || !evento.titulo || !temBilhetes(evento.bilhetes) || evento.estado === "concluido") {
    return [];
  }
  const base = urlBase();
  const quando = data(evento.dataInicio);
  const precoMin = Math.min(...(evento.bilhetes ?? []).map((b) => Number(b.preco) || 0));

  return destinatarios
    .filter((d) => d.preferencias.notificacoes.bilhetes)
    .map((d) =>
      montar(d, {
        assunto: `Bilhetes à venda: ${evento.titulo}`,
        titulo: evento.titulo,
        paragrafos: [
          "Os bilhetes para este evento já estão à venda.",
          ...(quando ? [`Data: ${quando}.`] : []),
          ...(precoMin > 0 ? [`Bilhetes a partir de ${kwanzas(precoMin)}.`] : []),
        ],
        ligacoes: [{ texto: "Comprar bilhetes", url: `${base}/bilhetes/${evento.slug}` }],
      }),
    );
}

function linhaResultado(r: ResultadoCorrida): string {
  const nome = r.piloto || r.pilotoSlug;
  if (r.estado === "DNF") return `${nome}: não terminou (DNF).`;
  if (r.estado === "DNS") return `${nome}: não partiu (DNS).`;
  if (r.estado === "DSQ") return `${nome}: desclassificado (DSQ).`;
  const pontos = r.pontos ? `, ${r.pontos} pts` : "";
  return `${nome}: ${ordinal(r.posicao)} lugar${pontos}.`;
}

/**
 * Resultado novo: só para quem segue um dos pilotos classificados
 * ou a equipa de um deles. A mensagem lista apenas quem a pessoa
 * segue, pela ordem da classificação.
 */
export function planearNovoResultado(
  corrida: Corrida,
  destinatarios: Destinatario[],
  equipas: EquipaResumo[],
): EmailPreparado[] {
  const resultados = Array.isArray(corrida?.resultados) ? corrida.resultados : [];
  if (!corrida?.slug || !corrida.nome || resultados.length === 0) return [];
  const base = urlBase();

  // Nome (ou slug) da equipa no resultado → slug da equipa
  const slugPorNome = new Map<string, string>();
  for (const e of equipas) {
    slugPorNome.set(normal(e.nome), e.slug);
    slugPorNome.set(normal(e.slug), e.slug);
  }
  const ordenados = [...resultados].sort(
    (a, b) => (Number(a.posicao) || 999) - (Number(b.posicao) || 999),
  );

  const saida: EmailPreparado[] = [];
  for (const d of destinatarios) {
    if (!d.preferencias.notificacoes.resultados) continue;
    const pilotos = new Set(d.preferencias.pilotos);
    const equipasSeguidas = new Set(d.preferencias.equipas);
    if (pilotos.size === 0 && equipasSeguidas.size === 0) continue;

    const seguidos = ordenados.filter((r) => {
      if (pilotos.has(r.pilotoSlug)) return true;
      const slug = slugPorNome.get(normal(r.equipa));
      return slug !== undefined && equipasSeguidas.has(slug);
    });
    if (seguidos.length === 0) continue;

    const quando = data(corrida.data);
    saida.push(
      montar(d, {
        assunto: `Resultados: ${corrida.nome}`,
        titulo: `Resultados: ${corrida.nome}`,
        paragrafos: [
          `Já saíram os resultados de ${corrida.nome}${corrida.categoria ? ` (${corrida.categoria})` : ""}${quando ? `, ${quando}` : ""}.`,
          ...(corrida.vencedor ? [`Vencedor: ${corrida.vencedor}.`] : []),
          "Quem segue:",
          ...seguidos.slice(0, 20).map(linhaResultado),
        ],
        ligacoes: [{ texto: "Ver classificação completa", url: `${base}/resultados/${corrida.slug}` }],
      }),
    );
  }
  return saida;
}

/** Id da conta do vendedor, quando o anúncio foi publicado por um utilizador. */
function autorDoAnuncio(anuncio: AnuncioMarketplace): string | undefined {
  const id = anuncio.vendedor?.authId;
  return typeof id === "string" && id ? id : undefined;
}

/**
 * Anúncio novo: para quem segue a marca, sem distinguir
 * maiúsculas. O próprio vendedor nunca é avisado.
 */
export function planearNovoAnuncio(anuncio: AnuncioMarketplace, destinatarios: Destinatario[]): EmailPreparado[] {
  if (!anuncio?.id || !anuncio.titulo || !anuncio.marca) return [];
  const base = urlBase();
  const marca = normal(anuncio.marca);
  const autor = autorDoAnuncio(anuncio);
  const detalhes = [
    anuncio.modelo && `Modelo: ${anuncio.modelo}`,
    anuncio.ano && `Ano: ${anuncio.ano}`,
    anuncio.estado && `Estado: ${anuncio.estado}`,
    anuncio.provincia && `Província: ${anuncio.provincia}`,
  ].filter(Boolean).join(". ");
  const preco = Number(anuncio.preco) > 0
    ? `Preço: ${kwanzas(Number(anuncio.preco))}${anuncio.negociavel ? " (negociável)" : ""}.`
    : "";

  return destinatarios
    .filter((d) => d.id !== autor)
    .filter((d) => d.preferencias.notificacoes.marketplace)
    .filter((d) => d.preferencias.marcas.some((m) => normal(m) === marca))
    .map((d) =>
      montar(d, {
        assunto: `Novo anúncio ${anuncio.marca}: ${anuncio.titulo}`,
        titulo: anuncio.titulo,
        paragrafos: [
          `Há um novo anúncio da marca ${anuncio.marca} no marketplace Motobox.`,
          ...(detalhes ? [`${detalhes}.`] : []),
          ...(preco ? [preco] : []),
        ],
        ligacoes: [{ texto: "Ver anúncio", url: `${base}/marketplace/${encodeURIComponent(anuncio.id)}` }],
      }),
    );
}

/* ---------------- Destinatários ---------------- */

/**
 * Todas as contas com email confirmado e o canal de email ligado.
 * Lê o Supabase Auth página a página com a chave de service role.
 */
export async function listarDestinatarios(): Promise<Destinatario[]> {
  const db = supabaseAdmin();
  if (!db) {
    console.error("[notificacoes] Supabase não configurado; sem destinatários.");
    return [];
  }

  const saida: Destinatario[] = [];
  for (let pagina = 1; pagina <= 1000; pagina++) {
    const { data, error } = await db.auth.admin.listUsers({ page: pagina, perPage: POR_PAGINA });
    if (error) throw error;
    const contas = data?.users ?? [];
    for (const u of contas) {
      if (!u.email || !u.email_confirmed_at) continue;
      const preferencias = normalizarPreferencias(u.user_metadata?.preferencias);
      if (!preferencias.canais.email) continue;
      const nome = typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome.trim() : "";
      saida.push({ id: u.id, email: u.email, nome: nome || undefined, preferencias });
    }
    if (contas.length < POR_PAGINA) break;
  }
  return saida;
}

async function lerEquipas(): Promise<EquipaResumo[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data, error } = await db.from("equipas").select("slug, nome");
  if (error) throw error;
  return (data ?? []) as EquipaResumo[];
}

/* ---------------- Envio ---------------- */

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Envia as mensagens em lotes de 100. Cada pessoa recebe a sua,
 * nunca com outros endereços à vista. Devolve quantas a Resend
 * aceitou.
 */
export async function enviarEmails(emails: EmailPreparado[]): Promise<number> {
  if (emails.length === 0) return 0;
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    console.warn(`[notificacoes] RESEND_API_KEY em falta; ${emails.length} email(s) por enviar.`);
    return 0;
  }
  const de = process.env.RESEND_FROM ?? "Motobox Angola <onboarding@resend.dev>";

  let enviados = 0;
  for (let i = 0; i < emails.length; i += MAX_LOTE) {
    const lote = emails.slice(i, i + MAX_LOTE).map((e) => ({
      from: de, to: [e.para], subject: e.assunto, html: e.html, text: e.texto,
      ...(e.cabecalhos ? { headers: e.cabecalhos } : {}),
    }));
    try {
      // A Resend limita os pedidos por segundo: espaça os lotes e
      // repete uma vez se for travada.
      if (i > 0) await pausa(600);
      let r = await fetch(RESEND_LOTE, {
        method: "POST",
        headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
        body: JSON.stringify(lote),
      });
      if (r.status === 429) {
        await pausa(1500);
        r = await fetch(RESEND_LOTE, {
          method: "POST",
          headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
          body: JSON.stringify(lote),
        });
      }
      if (!r.ok) {
        console.error(`[notificacoes] a Resend recusou um lote (${r.status}): ${await r.text()}`);
        continue;
      }
      const corpo = (await r.json().catch(() => null)) as { data?: unknown[] } | null;
      enviados += Array.isArray(corpo?.data) ? corpo.data.length : lote.length;
    } catch (e) {
      console.error("[notificacoes] falha ao contactar a Resend:", e);
    }
  }
  return enviados;
}

/** Lê os destinatários, prepara as mensagens e envia, sem nunca lançar. */
async function avisar(
  motivo: string,
  planear: (destinatarios: Destinatario[]) => EmailPreparado[] | Promise<EmailPreparado[]>,
): Promise<ResumoEnvio> {
  try {
    const destinatarios = await listarDestinatarios();
    if (destinatarios.length === 0) return VAZIO;
    const emails = await planear(destinatarios);
    const enviados = await enviarEmails(emails);
    if (emails.length > 0) {
      console.info(`[notificacoes] ${motivo}: ${enviados}/${emails.length} email(s) enviados.`);
    }
    return { destinatarios: emails.length, enviados };
  } catch (e) {
    console.error(`[notificacoes] ${motivo}: falhou.`, e);
    return VAZIO;
  }
}

/* ---------------- Avisos públicos ---------------- */

/** Evento criado: calendário e, se já tiver bilhetes, bilheteira. */
export function notificarNovoEvento(evento: Evento): Promise<ResumoEnvio> {
  return avisar(`novo evento ${evento?.slug}`, (d) => planearNovoEvento(evento, d));
}

/** Evento existente que passou a ter bilhetes. */
export function notificarBilhetesAbertos(evento: Evento): Promise<ResumoEnvio> {
  return avisar(`bilhetes abertos ${evento?.slug}`, (d) => planearBilhetesAbertos(evento, d));
}

/** Resultado de corrida criado: quem segue os pilotos ou as equipas. */
export function notificarNovoResultado(corrida: Corrida): Promise<ResumoEnvio> {
  return avisar(`resultado ${corrida?.slug}`, async (d) =>
    planearNovoResultado(corrida, d, await lerEquipas()),
  );
}

/** Anúncio publicado (pelo painel ou pelo próprio vendedor). */
export function notificarNovoAnuncio(anuncio: AnuncioMarketplace): Promise<ResumoEnvio> {
  return avisar(`anúncio ${anuncio?.id}`, (d) => planearNovoAnuncio(anuncio, d));
}
