import "server-only";

/* ============================================================
   MOTOBOX — Newsletter semanal
   Monta o resumo da semana a partir da base de dados (notícias,
   eventos, resultados e pilotos) e envia-o a todos os
   subscritores activos. Corre sozinho às segundas-feiras
   (Vercel Cron → /api/cron/newsletter) e pode ser enviado à mão
   no painel.

   Cada envio fica registado na tabela `atividade`; é esse
   registo que impede dois envios na mesma semana.
   ============================================================ */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { daBase } from "@/lib/supabase/mapeamento";
import { classificacaoPilotos } from "@/lib/data";
import { src } from "@/lib/imagens";
import { enviarEmails, type EmailPreparado } from "@/lib/notificacoes";
import type { Corrida, Evento, Noticia, Piloto } from "@/lib/types";

/* ---------------- Constantes ---------------- */

/** Luanda está em UTC+1 todo o ano (sem hora de Verão). */
const FUSO_LUANDA_MS = 60 * 60 * 1000;

/** Um envio nos últimos 6 dias trava o seguinte (salvo se forçado). */
const INTERVALO_MINIMO_MS = 6 * 24 * 60 * 60 * 1000;

const POR_PAGINA = 1000;

export const ENTIDADE_ATIVIDADE = "Newsletter";
export const ACCAO_ATIVIDADE = "enviou";

/** Mesmo critério do formulário público. */
export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* Cores do email: fundo claro para ler bem em qualquer cliente,
   vermelho escuro da marca como acento. */
const COR = {
  fundo: "#eeeef1",
  cartao: "#ffffff",
  topo: "#0a0a0c",
  vermelho: "#e10600",
  vermelhoEscuro: "#b30500",
  texto: "#121216",
  suave: "#5c5c66",
  tenue: "#8a8a94",
  linha: "#e4e4e8",
};
const FONTE = "Arial,Helvetica,sans-serif";

/* ---------------- Utilitários ---------------- */

/** Endereço público do site, como em lib/notificacoes (nunca localhost). */
export function urlBase(): string {
  const definido =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : undefined);
  return (definido ?? "https://moto-box-wc4x.vercel.app").replace(/\/$/, "");
}

export const normalizarEmail = (email: unknown) => String(email ?? "").trim().toLowerCase();

const escapar = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Como filtrar a coluna `email` sem distinguir maiúsculas. `_` é
 * curinga no ILIKE e `*` também no PostgREST: com `*`, `%` ou `\`
 * usa-se a igualdade exacta.
 */
export function filtroEmail(email: string): { op: "eq" | "ilike"; valor: string } {
  if (/[*%\\]/.test(email)) return { op: "eq", valor: email };
  return { op: "ilike", valor: email.replace(/_/g, "\\_") };
}

/** Dia de hoje em Luanda, no formato AAAA-MM-DD. */
function diaLuanda(d: Date): string {
  return new Date(d.getTime() + FUSO_LUANDA_MS).toISOString().slice(0, 10);
}

function somarDias(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Meia-noite de Luanda desse dia, em ISO com fuso, para comparar com timestamptz. */
const meiaNoiteLuanda = (iso: string) => `${iso.slice(0, 10)}T00:00:00+01:00`;

function partes(iso: string) {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  return { dia: d.getUTCDate(), mes: d.getUTCMonth(), ano: d.getUTCFullYear(), semana: d.getUTCDay() };
}

/** "21 a 27 de Setembro", "28 de Setembro a 4 de Outubro"… */
export function intervaloDatas(inicio: string, fim: string): string {
  const a = partes(inicio);
  const b = partes(fim);
  if (inicio.slice(0, 10) === fim.slice(0, 10)) return `${a.dia} de ${MESES[a.mes]}`;
  if (a.ano !== b.ano) return `${a.dia} de ${MESES[a.mes]} de ${a.ano} a ${b.dia} de ${MESES[b.mes]} de ${b.ano}`;
  if (a.mes !== b.mes) return `${a.dia} de ${MESES[a.mes]} a ${b.dia} de ${MESES[b.mes]}`;
  return `${a.dia} a ${b.dia} de ${MESES[a.mes]}`;
}

/** "Sáb, 10 de Outubro" ou "10 a 11 de Outubro". */
function quandoEvento(e: Evento): string {
  const fim = e.dataFim || e.dataInicio;
  if (String(fim).slice(0, 10) === String(e.dataInicio).slice(0, 10)) {
    const p = partes(e.dataInicio);
    return `${DIAS_SEMANA[p.semana]}, ${p.dia} de ${MESES[p.mes]}`;
  }
  return intervaloDatas(e.dataInicio, fim);
}

const diaCurto = (iso: string) => {
  const p = partes(iso);
  return `${p.dia} ${MESES_CURTOS[p.mes]}`;
};

// Espaço inseparável antes de "Kz", para o valor não partir ao meio.
const kwanzas = (valor: number) => `${new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(valor)} Kz`;

function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

/** Junta uma lista em português: "a, b e c". */
function juntar(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/* ---------------- Cancelamento assinado ---------------- */

function segredo(): string | null {
  return process.env.NEWSLETTER_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

/**
 * HMAC-SHA256 do email. O prefixo separa estas assinaturas de
 * qualquer outro uso da mesma chave.
 */
export function tokenCancelamento(email: string): string | null {
  const chave = segredo();
  if (!chave) return null;
  return createHmac("sha256", chave)
    .update(`newsletter-cancelar:${normalizarEmail(email)}`)
    .digest("base64url");
}

export function tokenValido(email: string, token: string | null | undefined): boolean {
  const esperado = tokenCancelamento(email);
  if (!esperado || !token) return false;
  const a = Buffer.from(esperado);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function linkCancelamento(email: string): string {
  const e = normalizarEmail(email);
  const token = tokenCancelamento(e) ?? "";
  return `${urlBase()}/api/newsletter/cancelar?email=${encodeURIComponent(e)}&token=${encodeURIComponent(token)}`;
}

/* ---------------- Resumo da semana ---------------- */

export interface EventoResumo {
  evento: Evento;
  /** Bilhetes à venda (e bilheteira aberta). */
  comBilhetes: boolean;
  precoMinimo: number;
}

export interface CorridaResumo {
  corrida: Corrida;
  vencedor: string;
}

export interface PilotoTabela {
  posicao: number;
  slug: string;
  nome: string;
  equipa: string;
  categoria: string;
  pontos: number;
}

export interface ResumoSemanal {
  /** Semana coberta (7 dias até ontem) e o dia do envio, em Luanda. */
  semana: { inicio: string; fim: string; hoje: string; eventosAte: string; rotulo: string };
  assunto: string;
  noticias: Noticia[];
  eventos: EventoResumo[];
  corridas: CorridaResumo[];
  classificacao: PilotoTabela[];
  pilotosNovos: Piloto[];
  /** Sem notícias, eventos, resultados nem pilotos novos. */
  vazio: boolean;
}

export interface ContagemResumo {
  noticias: number;
  eventos: number;
  corridas: number;
  pilotosNovos: number;
}

export const contagem = (r: ResumoSemanal): ContagemResumo => ({
  noticias: r.noticias.length,
  eventos: r.eventos.length,
  corridas: r.corridas.length,
  pilotosNovos: r.pilotosNovos.length,
});

type Linha = Record<string, unknown>;

/** Linha da base → tipo da app, com os campos nulos ausentes (como em publico.ts). */
function paraApp<T>(coleccao: "noticias" | "eventos" | "corridas" | "pilotos", linha: Linha): T {
  const limpa: Linha = {};
  for (const [k, v] of Object.entries(linha)) if (v !== null) limpa[k] = v;
  return daBase<T>(coleccao, limpa);
}

function vencedorDe(c: Corrida): string {
  if (c.vencedor?.trim()) return c.vencedor.trim();
  const primeiro = (Array.isArray(c.resultados) ? c.resultados : [])
    .find((r) => Number(r.posicao) === 1 && !r.estado);
  return primeiro?.piloto || "";
}

/**
 * Lê o conteúdo publicado e monta o resumo. `referencia` é o
 * momento do envio (por omissão, agora): a semana coberta são os
 * 7 dias até à véspera, os eventos são os dos 14 dias seguintes.
 */
export async function construirResumo(
  opcoes: { referencia?: Date; db?: SupabaseClient } = {},
): Promise<ResumoSemanal> {
  const db = opcoes.db ?? supabaseAdmin();
  if (!db) throw new Error("Supabase não configurado (falta SUPABASE_SERVICE_ROLE_KEY).");

  const hoje = diaLuanda(opcoes.referencia ?? new Date());
  const inicio = somarDias(hoje, -7);
  const fim = somarDias(hoje, -1);
  const eventosAte = somarDias(hoje, 13);

  const [rNoticias, rEventos, rCorridas, rPilotos, rDefinicoes] = await Promise.all([
    db.from("noticias").select("*").eq("publicado", true)
      .gte("data", inicio).lte("data", fim).order("data", { ascending: false }).limit(6),
    db.from("eventos").select("*").eq("publicado", true)
      .gte("data_fim", hoje).lte("data_inicio", eventosAte).neq("estado", "concluido")
      .order("data_inicio", { ascending: true }).limit(6),
    db.from("corridas").select("*").eq("publicado", true)
      .gte("data", inicio).lte("data", fim).order("data", { ascending: false }),
    db.from("pilotos").select("*").eq("publicado", true),
    db.from("definicoes").select("*").eq("id", 1).maybeSingle(),
  ]);
  for (const r of [rNoticias, rEventos, rCorridas, rPilotos]) {
    if (r.error) throw new Error(r.error.message);
  }

  const bilheteiraAberta = (rDefinicoes.data as Linha | null)?.bilheteira_aberta !== false;

  const noticias = (rNoticias.data ?? []).map((l) => paraApp<Noticia>("noticias", l));

  const eventos: EventoResumo[] = (rEventos.data ?? []).map((l) => {
    const evento = paraApp<Evento>("eventos", l);
    const bilhetes = Array.isArray(evento.bilhetes) ? evento.bilhetes : [];
    const precos = bilhetes.map((b) => Number(b.preco) || 0).filter((p) => p > 0);
    return {
      evento,
      comBilhetes: bilheteiraAberta && bilhetes.length > 0 && evento.estado !== "esgotado",
      precoMinimo: precos.length ? Math.min(...precos) : 0,
    };
  });

  const corridas: CorridaResumo[] = (rCorridas.data ?? [])
    .map((l) => paraApp<Corrida>("corridas", l))
    .map((corrida) => ({ corrida, vencedor: vencedorDe(corrida) }))
    .filter((c) => c.vencedor);

  // Pilotos: a data de criação só existe na linha da base.
  const linhasPilotos = (rPilotos.data ?? []) as Linha[];
  const desde = new Date(meiaNoiteLuanda(inicio)).getTime();
  const ate = new Date(meiaNoiteLuanda(hoje)).getTime();
  const pilotosNovos = linhasPilotos
    .filter((l) => {
      const t = new Date(String(l.criado_em ?? "")).getTime();
      return t >= desde && t < ate;
    })
    .map((l) => paraApp<Piloto>("pilotos", l));

  const pilotos = linhasPilotos
    .map((l) => paraApp<Piloto>("pilotos", l))
    .map((p) => ({ ...p, estatisticas: { ...p.estatisticas, pontos: Number(p.estatisticas?.pontos) || 0 } }));
  const classificacao: PilotoTabela[] = classificacaoPilotos(pilotos)
    .filter((p) => p.estatisticas.pontos > 0)
    .slice(0, 5)
    .map((p) => ({
      posicao: p.posicao, slug: p.slug, nome: p.nome, equipa: p.equipa ?? "",
      categoria: p.categoria ?? "", pontos: p.estatisticas.pontos,
    }));

  const rotulo = intervaloDatas(inicio, fim);
  return {
    semana: { inicio, fim, hoje, eventosAte, rotulo },
    assunto: `Motobox: a semana de ${rotulo}`,
    noticias,
    eventos,
    corridas,
    classificacao,
    pilotosNovos,
    vazio: noticias.length + eventos.length + corridas.length + pilotosNovos.length === 0,
  };
}

/* ---------------- HTML do email ---------------- */

function eyebrow(texto: string, ligacao?: { texto: string; url: string }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${FONTE};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${COR.vermelhoEscuro};padding:0 0 10px">${escapar(texto)}</td>
${ligacao ? `<td align="right" style="font-family:${FONTE};font-size:13px;padding:0 0 10px"><a href="${escapar(ligacao.url)}" style="color:${COR.vermelhoEscuro};text-decoration:none;font-weight:700">${escapar(ligacao.texto)} &rarr;</a></td>` : ""}
</tr></table>`;
}

function seccao(conteudo: string) {
  return `<tr><td style="padding:28px 28px 0">${conteudo}</td></tr>`;
}

/** Linha de lista com coluna de data (dia grande, mês em vermelho). */
function linhaComData(iso: string, corpo: string) {
  const p = partes(iso);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COR.linha}"><tr>
<td width="52" valign="top" style="padding:14px 12px 14px 0;font-family:${FONTE}">
<div style="font-size:24px;line-height:1;font-weight:900;color:${COR.texto}">${p.dia}</div>
<div style="margin-top:3px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${COR.vermelho}">${MESES_CURTOS[p.mes]}</div>
</td>
<td valign="top" style="padding:14px 0;font-family:${FONTE}">${corpo}</td>
</tr></table>`;
}

const titulo = (texto: string, url: string) =>
  `<a href="${escapar(url)}" style="font-family:${FONTE};font-size:16px;line-height:1.3;font-weight:700;color:${COR.texto};text-decoration:none">${escapar(texto)}</a>`;

const meta = (texto: string) =>
  `<div style="margin-top:4px;font-family:${FONTE};font-size:13px;line-height:1.45;color:${COR.suave}">${texto}</div>`;

const botao = (texto: string, url: string) =>
  `<a href="${escapar(url)}" style="display:inline-block;margin-top:10px;background:${COR.vermelho};color:#ffffff;border-radius:999px;padding:9px 18px;font-family:${FONTE};font-size:13px;font-weight:700;text-decoration:none">${escapar(texto)}</a>`;

function blocoNoticias(r: ResumoSemanal, base: string) {
  if (r.noticias.length === 0) return "";
  const [destaque, ...resto] = r.noticias;
  const foto = src([destaque.slug, destaque.imagem], { w: 1088, q: 70 });
  // Nas fotografias do Unsplash pede-se JPEG recortado a 2:1; outros
  // endereços (imagem carregada no painel) seguem tal como estão.
  const imagem = foto?.startsWith("https://images.unsplash.com/") ? `${foto}&h=544&fm=jpg` : foto;
  const urlDestaque = `${base}/noticias/${destaque.slug}`;
  const topo = `${imagem
    ? `<a href="${escapar(urlDestaque)}"><img src="${escapar(imagem)}" width="544" alt="${escapar(destaque.titulo)}" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:10px"></a>`
    : ""}
<div style="padding:${imagem ? "14px" : "0"} 0 16px">
<div style="font-family:${FONTE};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${COR.tenue}">${escapar(destaque.categoria)} · ${escapar(diaCurto(destaque.data))}</div>
<div style="margin-top:6px"><a href="${escapar(urlDestaque)}" style="font-family:${FONTE};font-size:20px;line-height:1.25;font-weight:900;color:${COR.texto};text-decoration:none">${escapar(destaque.titulo)}</a></div>
${destaque.resumo ? meta(escapar(destaque.resumo)) : ""}
</div>`;
  const lista = resto
    .map((n) => linhaComData(n.data, `${titulo(n.titulo, `${base}/noticias/${n.slug}`)}${n.resumo ? meta(escapar(n.resumo)) : ""}`))
    .join("\n");
  return seccao(`${eyebrow("Notícias da semana", { texto: "Todas", url: `${base}/noticias` })}${topo}${lista}`);
}

function blocoEventos(r: ResumoSemanal, base: string) {
  if (r.eventos.length === 0) return "";
  const lista = r.eventos
    .map(({ evento: e, comBilhetes, precoMinimo }) => {
      const onde = [e.circuito, e.localidade || e.provincia].filter(Boolean).join(", ");
      const detalhe = [quandoEvento(e), onde].filter(Boolean).map(escapar).join(" · ");
      const preco = comBilhetes && precoMinimo > 0
        ? meta(`Bilhetes à venda, desde <strong style="color:${COR.texto}">${escapar(kwanzas(precoMinimo))}</strong>`)
        : "";
      const bilhetes = comBilhetes ? botao("Comprar bilhetes", `${base}/bilhetes/${e.slug}`) : "";
      return linhaComData(e.dataInicio, `${titulo(e.titulo, `${base}/calendario/${e.slug}`)}${meta(detalhe)}${preco}${bilhetes}`);
    })
    .join("\n");
  return seccao(`${eyebrow("Próximos eventos", { texto: "Calendário", url: `${base}/calendario` })}${lista}`);
}

function blocoResultados(r: ResumoSemanal, base: string) {
  if (r.corridas.length === 0) return "";
  const lista = r.corridas
    .map(({ corrida: c, vencedor }) => {
      const nome = c.categoria ? `${c.nome} · ${c.categoria}` : c.nome;
      return linhaComData(
        c.data,
        `${titulo(nome, `${base}/resultados/${c.slug}`)}${meta(`Vencedor: <strong style="color:${COR.texto}">${escapar(vencedor)}</strong>`)}`,
      );
    })
    .join("\n");
  return seccao(`${eyebrow("Resultados", { texto: "Classificação", url: `${base}/classificacao` })}${lista}`);
}

function blocoPilotos(r: ResumoSemanal, base: string) {
  if (r.classificacao.length === 0 && r.pilotosNovos.length === 0) return "";
  const tabela = r.classificacao.length
    ? `<div style="font-family:${FONTE};font-size:14px;font-weight:700;color:${COR.texto};padding:0 0 4px">Classificação geral</div>
${r.classificacao
  .map(
    (p) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COR.linha}"><tr>
<td width="32" style="padding:11px 0;font-family:${FONTE};font-size:18px;font-weight:900;color:${p.posicao === 1 ? COR.vermelho : COR.texto}">${p.posicao}</td>
<td style="padding:11px 8px 11px 0;font-family:${FONTE}"><a href="${escapar(`${base}/pilotos/${p.slug}`)}" style="font-size:15px;font-weight:700;color:${COR.texto};text-decoration:none">${escapar(p.nome)}</a>${p.equipa || p.categoria ? `<div style="font-size:12px;color:${COR.tenue};margin-top:2px">${escapar([p.equipa, p.categoria].filter(Boolean).join(" · "))}</div>` : ""}</td>
<td align="right" style="padding:11px 0;font-family:${FONTE};font-size:15px;font-weight:700;color:${COR.texto};white-space:nowrap">${p.pontos} <span style="font-size:12px;font-weight:400;color:${COR.tenue}">pts</span></td>
</tr></table>`,
  )
  .join("\n")}`
    : "";
  const novos = r.pilotosNovos.length
    ? `<div style="font-family:${FONTE};font-size:14px;font-weight:700;color:${COR.texto};padding:${tabela ? "20px" : "0"} 0 4px">Novos no campeonato</div>
${r.pilotosNovos
  .map((p) => {
    const detalhe = [p.categoria, p.equipa, p.provincia].filter(Boolean).join(" · ");
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COR.linha}"><tr>
<td style="padding:11px 0;font-family:${FONTE}"><a href="${escapar(`${base}/pilotos/${p.slug}`)}" style="font-size:15px;font-weight:700;color:${COR.texto};text-decoration:none">${escapar(p.nome)}${p.numero ? ` <span style="color:${COR.vermelho}">#${escapar(p.numero)}</span>` : ""}</a>${detalhe ? `<div style="font-size:12px;color:${COR.tenue};margin-top:2px">${escapar(detalhe)}</div>` : ""}</td>
</tr></table>`;
  })
  .join("\n")}`
    : "";
  return seccao(`${eyebrow("Pilotos", { texto: "Todos os pilotos", url: `${base}/pilotos` })}${tabela}${novos}`);
}

/** Frase curta com o que o email traz, para o pré-cabeçalho e a introdução. */
function sumario(r: ResumoSemanal): string {
  const partesTexto = [
    r.noticias.length ? plural(r.noticias.length, "notícia", "notícias") : "",
    r.corridas.length ? plural(r.corridas.length, "resultado", "resultados") : "",
    r.eventos.length ? plural(r.eventos.length, "evento a caminho", "eventos a caminho") : "",
    r.pilotosNovos.length ? plural(r.pilotosNovos.length, "piloto novo", "pilotos novos") : "",
  ].filter(Boolean);
  return partesTexto.length ? `${juntar(partesTexto)}.` : "A classificação do campeonato.";
}

export interface DestinatarioNewsletter {
  email: string;
  nome?: string | null;
}

/** Mensagem pronta para um subscritor (HTML, texto e cabeçalhos de cancelamento). */
export function emailDaNewsletter(r: ResumoSemanal, d: DestinatarioNewsletter): EmailPreparado {
  const base = urlBase();
  const cancelar = linkCancelamento(d.email);
  const nome = d.nome?.trim();
  const saudacao = nome ? `Olá, ${nome}.` : "Olá.";
  const resumoCurto = sumario(r);

  const html = `<!doctype html>
<html lang="pt-AO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${escapar(r.assunto)}</title>
</head>
<body style="margin:0;padding:0;background:${COR.fundo}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapar(resumoCurto)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COR.fundo}">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${COR.cartao};border-radius:14px">
<tr><td style="background:${COR.topo};padding:22px 28px;border-radius:14px 14px 0 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${FONTE};font-size:20px;font-weight:900;letter-spacing:2px;color:#ffffff"><a href="${escapar(base)}" style="color:#ffffff;text-decoration:none">MOTOBOX <span style="color:${COR.vermelho}">ANGOLA</span></a></td>
<td align="right" style="font-family:${FONTE};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9a9aa6">Newsletter semanal</td>
</tr></table>
</td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:${COR.vermelho}">&nbsp;</td></tr>
<tr><td style="padding:28px 28px 0;font-family:${FONTE}">
<div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${COR.vermelhoEscuro}">A semana</div>
<h1 style="margin:6px 0 0;font-family:${FONTE};font-size:26px;line-height:1.15;font-weight:900;text-transform:uppercase;color:${COR.texto}">${escapar(r.semana.rotulo)}</h1>
<p style="margin:14px 0 0;font-size:15px;line-height:1.5;color:#3a3a44">${escapar(saudacao)} O resumo do motociclismo angolano: ${escapar(resumoCurto.charAt(0).toLowerCase() + resumoCurto.slice(1))}</p>
</td></tr>
${blocoNoticias(r, base)}
${blocoResultados(r, base)}
${blocoEventos(r, base)}
${blocoPilotos(r, base)}
<tr><td align="center" style="padding:32px 28px 30px">
<a href="${escapar(base)}" style="display:inline-block;background:${COR.topo};color:#ffffff;border-radius:999px;padding:12px 26px;font-family:${FONTE};font-size:14px;font-weight:700;text-decoration:none">Ir para o site Motobox</a>
</td></tr>
<tr><td style="padding:20px 28px 24px;border-top:1px solid ${COR.linha};font-family:${FONTE};font-size:12px;line-height:1.6;color:${COR.tenue};border-radius:0 0 14px 14px">
Recebe este email porque subscreveu a newsletter da Motobox Angola.<br>
<a href="${escapar(cancelar)}" style="color:${COR.suave};text-decoration:underline">Cancelar subscrição</a> · <a href="${escapar(base)}" style="color:${COR.suave};text-decoration:underline">${escapar(base.replace(/^https?:\/\//, ""))}</a><br>
Motobox Angola · Luanda, Angola
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return {
    para: d.email,
    assunto: r.assunto,
    html,
    texto: textoDaNewsletter(r, { saudacao, cancelar, base, resumoCurto }),
    cabecalhos: {
      // Gmail e Outlook mostram "Cancelar subscrição" junto ao remetente
      // e fazem o POST de um clique (RFC 8058) para o mesmo endereço.
      "List-Unsubscribe": `<${cancelar}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

function textoDaNewsletter(
  r: ResumoSemanal,
  x: { saudacao: string; cancelar: string; base: string; resumoCurto: string },
): string {
  const l: string[] = [
    `MOTOBOX ANGOLA · A semana de ${r.semana.rotulo}`,
    "",
    `${x.saudacao} O resumo do motociclismo angolano: ${x.resumoCurto.charAt(0).toLowerCase()}${x.resumoCurto.slice(1)}`,
  ];

  if (r.noticias.length) {
    l.push("", "NOTÍCIAS DA SEMANA");
    for (const n of r.noticias) {
      l.push("", `* ${n.titulo} (${diaCurto(n.data)})`);
      if (n.resumo) l.push(`  ${n.resumo}`);
      l.push(`  ${x.base}/noticias/${n.slug}`);
    }
    l.push("", `Todas as notícias: ${x.base}/noticias`);
  }

  if (r.corridas.length) {
    l.push("", "RESULTADOS");
    for (const { corrida: c, vencedor } of r.corridas) {
      l.push("", `* ${c.nome}${c.categoria ? ` · ${c.categoria}` : ""} (${diaCurto(c.data)})`);
      l.push(`  Vencedor: ${vencedor}`);
      l.push(`  ${x.base}/resultados/${c.slug}`);
    }
  }

  if (r.eventos.length) {
    l.push("", "PRÓXIMOS EVENTOS");
    for (const { evento: e, comBilhetes, precoMinimo } of r.eventos) {
      const onde = [e.circuito, e.localidade || e.provincia].filter(Boolean).join(", ");
      l.push("", `* ${e.titulo}`, `  ${[quandoEvento(e), onde].filter(Boolean).join(" · ")}`);
      l.push(`  ${x.base}/calendario/${e.slug}`);
      if (comBilhetes) {
        l.push(`  Bilhetes${precoMinimo > 0 ? ` desde ${kwanzas(precoMinimo)}` : ""}: ${x.base}/bilhetes/${e.slug}`);
      }
    }
    l.push("", `Calendário: ${x.base}/calendario`);
  }

  if (r.classificacao.length || r.pilotosNovos.length) {
    l.push("", "PILOTOS");
    if (r.classificacao.length) {
      l.push("", "Classificação geral:");
      for (const p of r.classificacao) l.push(`${p.posicao}. ${p.nome}${p.equipa ? ` (${p.equipa})` : ""}: ${p.pontos} pts`);
      l.push(`${x.base}/classificacao`);
    }
    if (r.pilotosNovos.length) {
      l.push("", "Novos no campeonato:");
      for (const p of r.pilotosNovos) {
        l.push(`* ${p.nome}${p.categoria ? ` (${p.categoria})` : ""}: ${x.base}/pilotos/${p.slug}`);
      }
    }
  }

  l.push(
    "",
    "--",
    "Recebe este email porque subscreveu a newsletter da Motobox Angola.",
    `Cancelar subscrição: ${x.cancelar}`,
    x.base,
  );
  return l.join("\n");
}

/* ---------------- Envio ---------------- */

export type EstadoEnvio =
  | "enviada" | "desligada" | "ja-enviada" | "sem-novidades" | "sem-subscritores" | "erro";

export interface ResultadoEnvio {
  estado: EstadoEnvio;
  mensagem: string;
  semana?: string;
  destinatarios: number;
  enviados: number;
  seccoes?: ContagemResumo;
  /** Quando saiu o último envio registado (ISO), se existir. */
  ultimoEnvio?: string;
}

interface Subscritor {
  email: string;
  nome: string | null;
}

/** Subscritores activos, página a página, sem emails repetidos. */
export async function lerSubscritoresActivos(db: SupabaseClient): Promise<Subscritor[]> {
  const vistos = new Set<string>();
  const saida: Subscritor[] = [];
  for (let de = 0; ; de += POR_PAGINA) {
    const { data, error } = await db
      .from("subscritores").select("id, email, nome").eq("ativo", true)
      .order("id").range(de, de + POR_PAGINA - 1);
    if (error) throw new Error(error.message);
    for (const s of data ?? []) {
      const email = normalizarEmail(s.email);
      if (!EMAIL_VALIDO.test(email) || vistos.has(email)) continue;
      vistos.add(email);
      saida.push({ email, nome: (s.nome as string | null) ?? null });
    }
    if ((data ?? []).length < POR_PAGINA) break;
  }
  return saida;
}

/**
 * Quem pediu a newsletter ao criar conta (ou em /conta antes de a
 * lista existir) fica só com `utilizadores.newsletter = true`. Antes de
 * cada envio, essas contas entram na lista com origem "conta". Quem já
 * está na lista, activo ou não, não é tocado: um cancelamento manda.
 */
export async function juntarContasComNewsletter(db: SupabaseClient): Promise<number> {
  const [{ data: contas, error: e1 }, { data: lista, error: e2 }] = await Promise.all([
    db.from("utilizadores").select("email, nome, estado").eq("newsletter", true),
    db.from("subscritores").select("email"),
  ]);
  if (e1 || e2) throw new Error((e1 ?? e2)!.message);
  const naLista = new Set((lista ?? []).map((l) => normalizarEmail(l.email)));
  const novos = (contas ?? [])
    .filter((c) => c.estado !== "banido" && c.estado !== "suspenso")
    .map((c) => ({ email: normalizarEmail(c.email), nome: (c.nome as string | null) ?? null }))
    .filter((c) => EMAIL_VALIDO.test(c.email) && !naLista.has(c.email))
    .filter((c, i, todos) => todos.findIndex((x) => x.email === c.email) === i)
    .map((c, i) => ({
      id: `s-${Date.now().toString(36)}${i.toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      email: c.email, nome: c.nome, origem: "conta", ativo: true,
    }));
  if (novos.length === 0) return 0;
  const { error } = await db.from("subscritores").insert(novos);
  if (error) throw new Error(error.message);
  return novos.length;
}

/** Contagem rápida de subscritores activos (para o painel). */
export async function contarSubscritoresActivos(db: SupabaseClient): Promise<number> {
  const { count, error } = await db
    .from("subscritores").select("id", { count: "exact", head: true }).eq("ativo", true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Último envio registado na atividade, se houver. */
export async function ultimoEnvio(db: SupabaseClient): Promise<{ quando: string; detalhe: string; utilizador: string } | null> {
  const { data } = await db
    .from("atividade").select("quando, detalhe, utilizador")
    .eq("entidade", ENTIDADE_ATIVIDADE).eq("accao", ACCAO_ATIVIDADE)
    .order("quando", { ascending: false }).limit(1).maybeSingle();
  return (data as { quando: string; detalhe: string; utilizador: string } | null) ?? null;
}

/**
 * Lê o interruptor das definições. Uma coluna ainda inexistente
 * (migração por correr) conta como ligado.
 */
export async function envioAutomaticoLigado(db: SupabaseClient): Promise<{ ligado: boolean; colunaExiste: boolean }> {
  const { data } = await db.from("definicoes").select("*").eq("id", 1).maybeSingle();
  const linha = (data ?? {}) as Linha;
  const colunaExiste = "newsletter_automatica" in linha;
  return { ligado: linha.newsletter_automatica !== false, colunaExiste };
}

const vazio = (estado: EstadoEnvio, mensagem: string, extra: Partial<ResultadoEnvio> = {}): ResultadoEnvio =>
  ({ estado, mensagem, destinatarios: 0, enviados: 0, ...extra });

/**
 * Envia o resumo da semana a todos os subscritores activos.
 *
 * - `automatico`: chamada do cron; respeita o interruptor das definições.
 * - `forcar`: ignora a trava de 6 dias (o botão "Enviar agora").
 *
 * Antes de enviar, grava a linha de atividade: é ela que trava um
 * segundo envio em paralelo. Se nada sair, a linha é apagada para
 * que a próxima tentativa possa correr.
 */
export async function enviarNewsletterSemanal(opcoes: {
  automatico?: boolean;
  forcar?: boolean;
  utilizador?: string;
  referencia?: Date;
} = {}): Promise<ResultadoEnvio> {
  const db = supabaseAdmin();
  if (!db) return vazio("erro", "Supabase não configurado (falta SUPABASE_SERVICE_ROLE_KEY).");

  try {
    if (opcoes.automatico) {
      const { ligado } = await envioAutomaticoLigado(db);
      if (!ligado) return vazio("desligada", "O envio automático está desligado nas definições.");
    }

    const anterior = await ultimoEnvio(db);
    if (!opcoes.forcar && anterior) {
      const passou = Date.now() - new Date(anterior.quando).getTime();
      if (passou < INTERVALO_MINIMO_MS) {
        return vazio("ja-enviada", "Já saiu uma newsletter nos últimos 6 dias.", { ultimoEnvio: anterior.quando });
      }
    }

    const resumo = await construirResumo({ db, referencia: opcoes.referencia });
    const seccoes = contagem(resumo);
    if (resumo.vazio) {
      return vazio("sem-novidades", "Sem novidades esta semana: nada a enviar.", {
        semana: resumo.semana.rotulo, seccoes, ultimoEnvio: anterior?.quando,
      });
    }

    await juntarContasComNewsletter(db).catch((e) =>
      console.error("[newsletter] não foi possível juntar as contas à lista:", e));
    const subscritores = await lerSubscritoresActivos(db);
    if (subscritores.length === 0) {
      return vazio("sem-subscritores", "Não há subscritores activos.", {
        semana: resumo.semana.rotulo, seccoes, ultimoEnvio: anterior?.quando,
      });
    }

    // Trava: o envio automático tem um id por semana, por isso um
    // segundo disparo do cron na mesma semana falha aqui (23505).
    const id = opcoes.automatico && !opcoes.forcar
      ? `a-newsletter-${resumo.semana.inicio}`
      : `a-newsletter-${Date.now().toString(36)}`;
    const utilizador = opcoes.utilizador?.trim() || (opcoes.automatico ? "Envio automático" : "Equipa Motobox");
    const rotulo = `Semana de ${resumo.semana.rotulo}`;
    const { error: erroTrava } = await db.from("atividade").insert({
      id, utilizador, accao: ACCAO_ATIVIDADE, entidade: ENTIDADE_ATIVIDADE,
      detalhe: `${rotulo}: a enviar a ${subscritores.length} subscritor(es)`,
    });
    if (erroTrava) {
      if (erroTrava.code === "23505") {
        return vazio("ja-enviada", "A newsletter desta semana já foi enviada.", { semana: resumo.semana.rotulo });
      }
      return vazio("erro", `Não foi possível registar o envio: ${erroTrava.message}`);
    }

    const emails = subscritores.map((s) => emailDaNewsletter(resumo, s));
    const enviados = await enviarEmails(emails);

    if (enviados === 0) {
      await db.from("atividade").delete().eq("id", id);
      return vazio("erro", "A Resend não aceitou nenhum email. Confirme RESEND_API_KEY e o domínio de envio.", {
        semana: resumo.semana.rotulo, destinatarios: emails.length, seccoes,
      });
    }

    const detalhe = `${rotulo}: ${enviados} de ${emails.length} email(s) enviados`;
    await db.from("atividade").update({ detalhe }).eq("id", id);
    console.info(`[newsletter] ${detalhe}.`);

    return {
      estado: "enviada",
      mensagem: detalhe,
      semana: resumo.semana.rotulo,
      destinatarios: emails.length,
      enviados,
      seccoes,
      ultimoEnvio: new Date().toISOString(),
    };
  } catch (e) {
    console.error("[newsletter] envio falhou:", e);
    return vazio("erro", e instanceof Error ? e.message : "Falha inesperada no envio.");
  }
}
