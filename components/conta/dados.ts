/* ============================================================
   MOTOBOX — Área de membro: dados partilhados
   Os tipos que a API da conta devolve e as regras que limpam o
   que vive no user_metadata da conta (clube, garagem e artigos
   guardados). O user_metadata também pode ser escrito pelo
   próprio utilizador com a chave pública, por isso tudo o que
   de lá vem é sempre limpo antes de ser usado, no servidor e no
   cliente.

   Sem "server-only" e sem nada do servidor: o cliente e as rotas
   de /api/conta usam os mesmos tipos e os mesmos limites.
   ============================================================ */

import type { AnuncioMarketplace } from "@/lib/types";
import type { Encomenda } from "@/lib/admin/types";
import type { Preferencias } from "@/lib/conta/preferencias";
import { comBase } from "@/lib/base";

/* ---------------- Perfil e conta ---------------- */

export interface PerfilConta {
  id: string; nome: string; email: string; telefone: string | null; provincia: string | null;
  avatar_cor: string; registado: string; verificado: boolean; newsletter: boolean; estado: string;
}

/** Cor e logótipo da conta, já resolvidos pelo servidor. */
export interface AvatarDados {
  cor: string;
  url: string | null;
}

/** Um anúncio próprio, com o estado no marketplace (a equipa pode escondê-lo). */
export type AnuncioConta = AnuncioMarketplace & { visivel?: boolean };

/** Participação no fórum: respostas (pela conta) e tópicos (pelo nome do autor). */
export interface ResumoForum {
  respostas: number;
  topicos: number;
  recentes: { tipo: "resposta" | "topico"; topicoId: string; titulo: string; quando: string }[];
}

export interface DadosConta {
  perfil: PerfilConta | null;
  email: string;
  /** Opcional: uma resposta antiga da API ainda não o traz. */
  avatar?: AvatarDados;
  preferencias: Preferencias;
  encomendas: Encomenda[];
  anuncios: AnuncioConta[];
  /** Slug do clube a que a pessoa pertence (user_metadata.clube). */
  clube?: string | null;
  garagem?: MotaGaragem[];
  /** Slugs dos artigos guardados (user_metadata.artigos). */
  artigos?: string[];
  forum?: ResumoForum;
  conta?: { criado: string | null; ultimaEntrada: string | null; provedor: string };
}

/* ---------------- O que a página passa ao cliente ---------------- */

export interface EventoResumo {
  slug: string;
  titulo: string;
  href: string;
  prova: boolean;
  tipo: string;
  dataInicio: string;
  dataFim: string;
  /** Hora da primeira sessão ("07:30"), para a contagem decrescente. */
  hora?: string;
  localidade: string;
  provincia: string;
  foto: (string | undefined)[];
}

export interface ArtigoResumo {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  tags: string[];
  data: string;
  foto: (string | undefined)[];
  leitura: number;
}

export interface ClubeResumo {
  slug: string;
  nome: string;
  tipo: string;
  cor: string;
  local: string;
  provincia: string;
  encontros?: string;
  actividades: string[];
  foto: (string | undefined)[];
}

export interface RotaSemana {
  slug: string;
  nome: string;
  subtitulo: string;
  regiao: string;
  km: number;
  duracao: string;
  dias: number;
  piso: string;
  exigencia: string;
  /** Endereço da fotografia (Commons), ou vazio. */
  foto: string;
  fotoAlt: string;
  /** Verdadeiro quando a rota passa na província do membro. */
  perto: boolean;
}

/**
 * Instante em que o evento começa, em milissegundos. As datas vêm sem hora
 * (AAAA-MM-DD): junta-se a da primeira sessão, ou as 08:00, em hora de Luanda.
 */
export function inicioEvento(e: Pick<EventoResumo, "dataInicio" | "hora">): number {
  if (e.dataInicio.includes("T")) {
    const d = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(e.dataInicio) ? e.dataInicio : `${e.dataInicio}+01:00`);
    if (Number.isFinite(d)) return d;
  }
  const hora = e.hora && /^\d{1,2}[:h]\d{2}$/.test(e.hora) ? e.hora.replace("h", ":").padStart(5, "0") : "08:00";
  return Date.parse(`${e.dataInicio.slice(0, 10)}T${hora}:00+01:00`);
}

/** Fim do último dia do evento (23:59 em Luanda). */
export const fimEvento = (e: Pick<EventoResumo, "dataInicio" | "dataFim">) =>
  Date.parse(`${(e.dataFim || e.dataInicio).slice(0, 10)}T23:59:59+01:00`);

/* ---------------- Clube ---------------- */

export const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;

/** Clube guardado na conta, se tiver a forma de um slug. */
export function clubeDe(metadados: unknown): string | null {
  const v = (metadados as { clube?: unknown } | null | undefined)?.clube;
  return typeof v === "string" && SLUG.test(v) ? v : null;
}

/* ---------------- Artigos guardados ---------------- */

/** O user_metadata viaja no token de sessão: 50 slugs chegam e mantêm-no leve. */
export const MAXIMO_ARTIGOS = 50;

export function artigosDe(metadados: unknown): string[] {
  const lista = (metadados as { artigos?: unknown } | null | undefined)?.artigos;
  if (!Array.isArray(lista)) return [];
  const slugs = lista.filter((x): x is string => typeof x === "string" && SLUG.test(x));
  return [...new Set(slugs)].slice(0, MAXIMO_ARTIGOS);
}

/* ---------------- Garagem ---------------- */

export interface MotaGaragem {
  id: string;
  marca: string;
  modelo: string;
  ano?: number;
  /** Nome que a pessoa dá à mota ("A Branquinha"). */
  apelido?: string;
  /** Fotografia na pasta pública `avatares`, em garagem/<conta>/. */
  foto?: string;
}

export const MAXIMO_MOTAS = 6;
export const ID_MOTA = /^m-[a-z0-9]{4,24}$/;
export const ANO_MINIMO = 1950;
export const anoMaximo = () => new Date().getFullYear() + 1;

const texto = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";

/** Pasta das fotografias da garagem de uma conta (dentro do balde `avatares`). */
export const pastaGaragem = (uid: string) => `garagem/${uid}`;

/** Prefixo público das fotografias da garagem de uma conta. */
export function prefixoFotosGaragem(uid: string): string | null {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/storage/v1/object/public/avatares/${pastaGaragem(uid)}/` : null;
}

/** Uma mota, limpa; null quando não tem o mínimo (id, marca e modelo). */
export function motaLimpa(v: unknown, uid: string): MotaGaragem | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const id = typeof o.id === "string" && ID_MOTA.test(o.id) ? o.id : "";
  const marca = texto(o.marca, 40);
  const modelo = texto(o.modelo, 60);
  if (!id || !marca || !modelo) return null;
  const ano = Number(o.ano);
  const apelido = texto(o.apelido, 40);
  const prefixo = prefixoFotosGaragem(uid);
  const foto = typeof o.foto === "string" && prefixo && o.foto.startsWith(prefixo) ? o.foto : undefined;
  return {
    id, marca, modelo,
    ...(Number.isInteger(ano) && ano >= ANO_MINIMO && ano <= anoMaximo() ? { ano } : {}),
    ...(apelido ? { apelido } : {}),
    ...(foto ? { foto } : {}),
  };
}

/** A garagem guardada na conta, sem lixo nem repetidos. */
export function garagemDe(metadados: unknown, uid: string): MotaGaragem[] {
  const lista = (metadados as { garagem?: unknown } | null | undefined)?.garagem;
  if (!Array.isArray(lista)) return [];
  const vistos = new Set<string>();
  const saida: MotaGaragem[] = [];
  for (const item of lista) {
    const m = motaLimpa(item, uid);
    if (!m || vistos.has(m.id)) continue;
    vistos.add(m.id);
    saida.push(m);
    if (saida.length >= MAXIMO_MOTAS) break;
  }
  return saida;
}

export const nomeMota = (m: Pick<MotaGaragem, "marca" | "modelo" | "apelido">) =>
  m.apelido ? `${m.apelido} (${m.marca} ${m.modelo})` : `${m.marca} ${m.modelo}`;

/* ---------------- Pedidos ---------------- */

/** Envia JSON para uma rota do site; devolve a mensagem de erro, ou null. */
export async function pedir(url: string, metodo: string, corpo?: unknown): Promise<{ erro: string | null; json: Record<string, unknown> }> {
  try {
    const r = await fetch(comBase(url), {
      method: metodo,
      cache: "no-store",
      headers: corpo === undefined || corpo instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : corpo instanceof FormData ? corpo : JSON.stringify(corpo),
    });
    const json = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return { erro: r.ok ? null : String(json.erro ?? `Erro ${r.status}`), json };
  } catch {
    return { erro: "Não foi possível contactar o servidor. Verifique a ligação.", json: {} };
  }
}
