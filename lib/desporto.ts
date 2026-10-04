/* ============================================================
   MOTOBOX — Desporto: as modalidades que o site cobre

   A Motobox é sobre tudo o que tem motor; a competição é só a
   secção Desporto. Aqui fica a lista de modalidades e a divisão
   entre provas (calendário de Desporto) e eventos da comunidade
   (secção Eventos), para o menu, as páginas e o painel usarem a
   mesma regra.
   ============================================================ */

import type { Corrida, Disciplina, Evento } from "@/lib/types";

/** Disciplinas que são provas: vão para o calendário de Desporto ("Prova" é uma competição sem modalidade). */
export const DISCIPLINAS_PROVA = [
  "Motocross", "Enduro", "Velocidade", "Rally", "Moto 4", "Karting", "Prova",
] as const satisfies readonly Disciplina[];

/** Disciplinas que são eventos da comunidade: vão para a secção Eventos (os tipos de TIPOS_EVENTO, sem "Prova"). */
export const DISCIPLINAS_COMUNIDADE = [
  "Passeio", "Raide", "Encontro", "Concentração", "Solidária", "Formação",
] as const satisfies readonly Disciplina[];

/**
 * Evento da comunidade (passeio, raide, encontro, concentração, acção solidária, formação).
 * Uma disciplina desconhecida (valor antigo na base) conta como prova,
 * para nunca desaparecer do calendário.
 */
export function eComunidade(disciplina: string): boolean {
  return (DISCIPLINAS_COMUNIDADE as readonly string[]).includes(disciplina);
}

export function eProva(disciplina: string): boolean {
  return !eComunidade(disciplina);
}

/** Página de um evento: provas no calendário, o resto em Eventos. */
export function hrefEvento(e: { slug: string; disciplina: string }): string {
  return eComunidade(e.disciplina) ? `/eventos/${e.slug}` : `/calendario/${e.slug}`;
}

/* ---------- Bilhetes ---------- */

/** Venda online na Motobox: à venda, ou com bilhetes mas já sem lugares. */
export type VendaBilhetes = "a-venda" | "esgotado";

/**
 * A regra única para "este evento vende bilhetes online na Motobox".
 * Vende quando tem tipos de bilhete, não está concluído e a bilheteira
 * está aberta nas Definições (`bilheteira_aberta`). A plataforma não tem
 * estado "cancelado": um evento cancelado apaga-se ou fica concluído.
 * Com `agora`, um evento que já terminou também deixa de vender.
 *
 * Devolve `null` quando não vende (o evento mostra como participar) e
 * "esgotado" quando o estado o diz ou já não há lugares: mostra-se
 * "Esgotado", nunca o botão de compra.
 */
export function vendaBilhetes(
  e: Pick<Evento, "bilhetes" | "estado" | "dataFim">,
  bilheteiraAberta: boolean,
  agora?: number,
): VendaBilhetes | null {
  if (!bilheteiraAberta) return null;
  if (!Array.isArray(e.bilhetes) || e.bilhetes.length === 0) return null;
  if (e.estado === "concluido") return null;
  if (agora !== undefined && new Date(e.dataFim).getTime() < agora) return null;
  const semLugares = e.bilhetes.every((b) => !(Number(b.disponiveis) > 0));
  return e.estado === "esgotado" || semLugares ? "esgotado" : "a-venda";
}

/** Texto de participação do evento, sem espaços a mais; vazio quando não foi indicado. */
export function entradaDoEvento(e: Pick<Evento, "entrada">): string {
  return typeof e.entrada === "string" ? e.entrada.trim() : "";
}

/**
 * Onde a modalidade aparece na entrada de Desporto e no menu:
 * - "principal": o Motocross, casa do Campeonato Nacional;
 * - "competicao": modalidades com provas no calendário da Motobox (hoje,
 *   todas as outras: enduro, rally-raid, velocidade, moto 4 e karting);
 * - "outras": modalidades com página própria (o que é, classes, a cena em
 *   Angola, como começar) mas ainda sem provas no calendário da Motobox.
 * Todas são destinos com conteúdo: nenhuma é "em breve". A entrada de
 * Desporto esconde o grupo "outras" quando fica vazio.
 */
export type GrupoModalidade = "principal" | "competicao" | "outras";

export interface Modalidade {
  slug: string;
  nome: string;
  /** Disciplinas do calendário que pertencem a esta modalidade (vazio: o calendário ainda não tem esta disciplina). */
  disciplinas: Disciplina[];
  grupo: GrupoModalidade;
  /** Uma linha que dá vontade de entrar: o cartão da entrada, o cabeçalho e a descrição da página. */
  descricao: string;
  /**
   * Fotografia: chave de lib/imagens.ts ou endereço completo do Unsplash
   * (o `Placeholder` usa um endereço https tal como está). Ilustrativa.
   */
  imagem: string;
  /** Categorias de `Piloto.categoria` que correm nesta modalidade. */
  categorias: string[];
}

/** A modalidade que reúne o calendário, resultados, classificação, pilotos e equipas. */
export const MODALIDADE_PRINCIPAL = "motocross";

/** Fotografia do Unsplash já dimensionada (para as modalidades sem chave em lib/imagens.ts). */
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`;

export const MODALIDADES: Modalidade[] = [
  {
    slug: "motocross",
    nome: "Motocross",
    disciplinas: ["Motocross"],
    grupo: "principal",
    descricao: "Corridas em circuito de terra, com saltos e curvas fechadas. É aqui que vive o Campeonato Nacional.",
    imagem: "competicao",
    categorias: ["MX1", "MX2"],
  },
  {
    slug: "enduro",
    nome: "Enduro",
    disciplinas: ["Enduro"],
    grupo: "competicao",
    descricao: "Resistência fora do circuito: trilhos, areia e pedra, com troços cronometrados e horas marcadas.",
    imagem: "benguela",
    categorias: ["Rally / Enduro"],
  },
  {
    slug: "rally",
    nome: "Rally-Raid",
    disciplinas: ["Rally"],
    grupo: "competicao",
    descricao: "Etapas longas de navegação em terreno aberto, do deserto do Namibe ao Dakar.",
    imagem: "namibe",
    categorias: ["Rally / Enduro"],
  },
  {
    slug: "velocidade",
    nome: "Velocidade",
    disciplinas: ["Velocidade"],
    grupo: "competicao",
    descricao: "Motas em pista de asfalto, joelho no chão: do Autódromo de Luanda ao MotoGP.",
    imagem: unsplash("photo-1713205136828-c3a69cfb6d7c"),
    categorias: ["Velocidade"],
  },
  {
    slug: "moto-4",
    nome: "Moto 4 e quads",
    disciplinas: ["Moto 4"],
    grupo: "competicao",
    descricao: "Todo-o-terreno sobre quatro rodas: quads e SSV, com campeões no rali-raid angolano.",
    imagem: unsplash("photo-1553966012-4dce025d8e03"),
    categorias: ["Moto 4"],
  },
  {
    slug: "automobilismo",
    nome: "Karting e automobilismo",
    disciplinas: ["Karting"],
    grupo: "competicao",
    descricao: "Do kart em Benguela às 24 Horas de Le Mans: a escada do automobilismo, com pilotos angolanos.",
    imagem: unsplash("photo-1505570554449-69ce7d4fa36b"),
    categorias: ["Karting"],
  },
];

/**
 * Categorias de piloto (`Piloto.categoria`), pela ordem das pílulas em
 * Pilotos e Classificação. Uma categoria nova vinda da base aparece no fim.
 */
export const CATEGORIAS_PILOTO = ["MX1", "MX2", "Rally / Enduro", "Velocidade", "Moto 4", "Karting"] as const;

/** Categorias que pontuam para o Campeonato Nacional; as outras correm em taças à parte. */
export const CATEGORIAS_CAMPEONATO: readonly string[] = ["MX1", "MX2", "Rally / Enduro"];

export const doCampeonato = (p: { categoria: string }) => CATEGORIAS_CAMPEONATO.includes(p.categoria);

/** "Todas" e as categorias que têm pilotos: as conhecidas pela ordem de CATEGORIAS_PILOTO, as outras a seguir. */
export function categoriasComPilotos(pilotos: { categoria: string }[]): string[] {
  const presentes = new Set(pilotos.map((p) => p.categoria).filter(Boolean));
  const conhecidas: readonly string[] = CATEGORIAS_PILOTO;
  const outras = [...presentes].filter((c) => !conhecidas.includes(c)).sort((a, b) => a.localeCompare(b));
  return ["Todas", ...conhecidas.filter((c) => presentes.has(c)), ...outras];
}

/** Corridas que contam para o Campeonato Nacional (as de fora têm ronda 0). */
export function corridasDoCampeonato(corridas: Corrida[]): Corrida[] {
  return corridas.filter((c) => c.ronda > 0);
}

export function lerModalidade(slug: string): Modalidade | undefined {
  return MODALIDADES.find((m) => m.slug === slug);
}

/** Eventos do calendário que pertencem à modalidade. */
export function eventosDaModalidade(m: Modalidade, eventos: Evento[]): Evento[] {
  return eventos.filter((e) => (m.disciplinas as string[]).includes(e.disciplina));
}

/** Corridas (resultados) das provas da modalidade, pela ordem em que vêm. */
export function corridasDaModalidade(m: Modalidade, eventos: Evento[], corridas: Corrida[]): Corrida[] {
  const slugs = new Set(eventosDaModalidade(m, eventos).map((e) => e.slug));
  return corridas.filter((c) => slugs.has(c.eventoSlug));
}

/**
 * A modalidade tem provas no calendário da Motobox? A principal conta
 * sempre como tendo (é a casa do campeonato, mesmo entre temporadas).
 */
export function temProvas(m: Modalidade, eventos: Evento[]): boolean {
  if (m.slug === MODALIDADE_PRINCIPAL) return true;
  return eventosDaModalidade(m, eventos).length > 0;
}

/**
 * Secções de uma modalidade que não é a principal: a visão geral e, quando
 * há resultados publicados, o arquivo próprio em /desporto/<slug>/resultados.
 */
export function seccoesDaModalidade(slug: string, comResultados: boolean): { href: string; chave: string }[] {
  if (!comResultados) return [];
  return [
    { href: `/desporto/${slug}`, chave: "desporto.visaoGeral" },
    { href: `/desporto/${slug}/resultados`, chave: "nav.resultados" },
  ];
}

/** Sub-navegação do Motocross: as páginas de sempre, agora arrumadas dentro de Desporto. */
export const SECCOES_MOTOCROSS: { href: string; chave: string }[] = [
  { href: "/desporto/motocross", chave: "desporto.visaoGeral" },
  { href: "/calendario", chave: "nav.calendario" },
  { href: "/resultados", chave: "nav.resultados" },
  { href: "/classificacao", chave: "nav.classificacao" },
  { href: "/pilotos", chave: "nav.pilotos" },
  { href: "/equipas", chave: "nav.equipas" },
];

/**
 * As secções do Campeonato Nacional ao nível de Desporto. Calendário, resultados,
 * classificação, pilotos e equipas juntam todas as modalidades, por isso vivem
 * directamente em Desporto, e não dentro de uma modalidade.
 */
export const SECCOES_DESPORTO: { href: string; chave: string }[] = [
  { href: "/desporto", chave: "desporto.visaoGeral" },
  { href: "/calendario", chave: "nav.calendario" },
  { href: "/resultados", chave: "nav.resultados" },
  { href: "/classificacao", chave: "nav.classificacao" },
  { href: "/pilotos", chave: "nav.pilotos" },
  { href: "/equipas", chave: "nav.equipas" },
];

/** Rotas que acendem "Desporto" no menu. */
export const ROTAS_DESPORTO = ["/desporto", "/calendario", "/resultados", "/classificacao", "/pilotos", "/equipas"];

/**
 * Instante em que a página é gerada, para separar o que já passou do que aí vem.
 * Só para componentes de servidor: com `revalidate`, a página refaz-se a cada minuto.
 */
export function instante(): number {
  return Date.now();
}
