/* ============================================================
   MOTOBOX — Desporto: as modalidades que o site cobre

   A Motobox é sobre tudo o que tem motor; a competição é só a
   secção Desporto. Aqui fica a lista de modalidades e a divisão
   entre provas (calendário de Desporto) e eventos da comunidade
   (secção Eventos), para o menu, as páginas e o painel usarem a
   mesma regra.
   ============================================================ */

import type { Disciplina, Evento } from "@/lib/types";

/** Disciplinas que são provas: vão para o calendário de Desporto. */
export const DISCIPLINAS_PROVA = ["Motocross", "Enduro", "Velocidade", "Rally"] as const satisfies readonly Disciplina[];

/** Disciplinas que são eventos da comunidade: vão para a secção Eventos. */
export const DISCIPLINAS_COMUNIDADE = ["Passeio", "Solidária", "Encontro", "Formação"] as const satisfies readonly Disciplina[];

/**
 * Evento da comunidade (passeio, acção solidária, encontro, formação).
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

export type EstadoModalidade = "activo" | "em-breve";

export interface Modalidade {
  slug: string;
  nome: string;
  /** Disciplinas do calendário que pertencem a esta modalidade (vazio: ainda sem provas no site). */
  disciplinas: Disciplina[];
  /**
   * Estado previsto, usado onde não se conhecem as provas (o menu).
   * Nas páginas manda `estadoModalidade()`, que olha para o calendário.
   */
  estado: EstadoModalidade;
  /** Frase curta, sem campeonatos nem datas: só o que a modalidade é. */
  descricao: string;
  /** Chave de fotografia em lib/imagens.ts; vazio fica o gradiente. */
  imagem: string;
  /** Categorias de `Piloto.categoria` que correm nesta modalidade. */
  categorias: string[];
}

/** A modalidade que reúne o calendário, resultados, classificação, pilotos e equipas. */
export const MODALIDADE_PRINCIPAL = "motocross";

export const MODALIDADES: Modalidade[] = [
  {
    slug: "motocross",
    nome: "Motocross",
    disciplinas: ["Motocross"],
    estado: "activo",
    descricao: "Corridas em circuito de terra, com saltos e curvas fechadas. É aqui que vive o Campeonato Nacional.",
    imagem: "competicao",
    categorias: ["MX1", "MX2"],
  },
  {
    slug: "enduro",
    nome: "Enduro",
    disciplinas: ["Enduro"],
    estado: "activo",
    descricao: "Provas de resistência fora do circuito fechado: trilhos, areia, pedra e troços cronometrados.",
    imagem: "benguela",
    categorias: ["Rally / Enduro"],
  },
  {
    slug: "rally",
    nome: "Rally-Raid",
    disciplinas: ["Rally"],
    estado: "activo",
    descricao: "Etapas longas de navegação em terreno aberto, do deserto ao mato.",
    imagem: "namibe",
    categorias: ["Rally / Enduro"],
  },
  {
    slug: "velocidade",
    nome: "Velocidade",
    disciplinas: ["Velocidade"],
    estado: "em-breve",
    descricao: "Corridas de motas em pista de asfalto.",
    imagem: "",
    categorias: [],
  },
  {
    slug: "moto-4",
    nome: "Moto 4 e quads",
    disciplinas: [],
    estado: "em-breve",
    descricao: "Todo-o-terreno sobre quatro rodas: moto 4, quads e buggies.",
    imagem: "",
    categorias: [],
  },
  {
    slug: "motos-de-agua",
    nome: "Motos de água",
    disciplinas: [],
    estado: "em-breve",
    descricao: "Jet ski e motos de água, no mar e nos rios.",
    imagem: "",
    categorias: [],
  },
  {
    slug: "automobilismo",
    nome: "Karting e automobilismo",
    disciplinas: [],
    estado: "em-breve",
    descricao: "Karts, carros de competição e ralis de automóveis.",
    imagem: "",
    categorias: [],
  },
];

export function lerModalidade(slug: string): Modalidade | undefined {
  return MODALIDADES.find((m) => m.slug === slug);
}

/** Eventos do calendário que pertencem à modalidade. */
export function eventosDaModalidade(m: Modalidade, eventos: Evento[]): Evento[] {
  return eventos.filter((e) => (m.disciplinas as string[]).includes(e.disciplina));
}

/**
 * Estado real, a partir do calendário: a principal está sempre activa; as
 * outras acendem quando há provas da sua disciplina e apagam quando não há.
 */
export function estadoModalidade(m: Modalidade, eventos: Evento[]): EstadoModalidade {
  if (m.slug === MODALIDADE_PRINCIPAL) return "activo";
  return eventosDaModalidade(m, eventos).length > 0 ? "activo" : "em-breve";
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

/** Rotas que acendem "Desporto" no menu. */
export const ROTAS_DESPORTO = ["/desporto", "/calendario", "/resultados", "/classificacao", "/pilotos", "/equipas"];

/**
 * Instante em que a página é gerada, para separar o que já passou do que aí vem.
 * Só para componentes de servidor: com `revalidate`, a página refaz-se a cada minuto.
 */
export function instante(): number {
  return Date.now();
}
