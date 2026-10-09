/* ============================================================
   MOTOBOX — Desporto: as modalidades que o site cobre

   A Motobox é sobre tudo o que tem motor; a competição é só a
   secção Desporto. Aqui fica a lista de modalidades e a divisão
   entre provas (calendário de Desporto) e eventos da comunidade
   (secção Eventos), para o menu, as páginas e o painel usarem a
   mesma regra.
   ============================================================ */

import type { Corrida, Disciplina, Evento } from "@/lib/types";
import type { Bloco, ConteudoPagina, Tabela, Texto } from "@/lib/desporto-conteudo";
import { src as fotoSrc } from "@/lib/imagens";

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

/**
 * Categorias que pontuam para o Campeonato Nacional; as outras correm em taças à parte.
 * É o valor de partida: o painel muda-o em Modalidades › Página Desporto
 * (paginas.desporto → campeonato.categorias), que as páginas lêem no servidor.
 */
export const CATEGORIAS_CAMPEONATO: readonly string[] = ["MX1", "MX2", "Rally / Enduro"];

export const doCampeonato = (p: { categoria: string }) => CATEGORIAS_CAMPEONATO.includes(p.categoria);

/** O mesmo filtro, com as categorias do campeonato gravadas no painel. */
export const doCampeonatoDe = (categorias: readonly string[]) => (p: { categoria: string }) =>
  categorias.includes(p.categoria);

/**
 * "Todas" e as categorias que têm pilotos: as conhecidas pela ordem de
 * `ordem` (por omissão CATEGORIAS_PILOTO; o painel pode mudá-la), as outras a seguir.
 */
export function categoriasComPilotos(pilotos: { categoria: string }[], ordem: readonly string[] = CATEGORIAS_PILOTO): string[] {
  const presentes = new Set(pilotos.map((p) => p.categoria).filter(Boolean));
  const conhecidas: readonly string[] = ordem;
  const outras = [...presentes].filter((c) => !conhecidas.includes(c)).sort((a, b) => a.localeCompare(b));
  return ["Todas", ...conhecidas.filter((c) => presentes.has(c)), ...outras];
}

/**
 * Chave da fotografia de um piloto para o <Retrato>. O retrato de sempre
 * vem do slug; quando o painel grava outra fotografia no campo `foto`
 * (carregada, colada ou escolhida da biblioteca), é essa que aparece.
 * O `foto` de partida ("kiala") é um atalho para o mesmo retrato do slug.
 */
export function retratoDe(p: { slug: string; foto?: string | null }): string {
  const f = typeof p.foto === "string" ? p.foto.trim() : "";
  if (!f) return p.slug;
  const escolhida = fotoSrc(f);
  if (!escolhida || escolhida === fotoSrc(p.slug)) return p.slug;
  return f;
}

/** Corridas que contam para o Campeonato Nacional (as de fora têm ronda 0). */
export function corridasDoCampeonato(corridas: Corrida[]): Corrida[] {
  return corridas.filter((c) => c.ronda > 0);
}

/**
 * Modalidade da lista de partida. As páginas públicas lêem a lista editada
 * no painel (app/desporto/dados.ts → lerModalidades); isto é só o código.
 */
export function lerModalidade(slug: string): Modalidade | undefined {
  return MODALIDADES.find((m) => m.slug === slug);
}

/* ---------- Modalidades editáveis (painel → páginas públicas) ---------- */

/** Troca {chave} pelos valores (ex.: "Temporada {ano}" → "Temporada 2026"). */
export function preencher(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (todo, k: string) => (k in valores ? String(valores[k]) : todo));
}

/** Uma modalidade como o painel a grava: a ficha e o guia da sua página. */
export type ModalidadeCompleta = Modalidade & { guia: ConteudoPagina };

/**
 * A modalidade em destaque (a casa do Campeonato Nacional): a primeira do
 * grupo "principal"; sem nenhuma, o Motocross; sem ele, a primeira da lista.
 */
export function principalDe<M extends Pick<Modalidade, "slug" | "grupo">>(lista: M[]): M | undefined {
  return lista.find((m) => m.grupo === "principal") ?? lista.find((m) => m.slug === MODALIDADE_PRINCIPAL) ?? lista[0];
}

const listaDe = <T,>(v: unknown, f: (x: unknown) => T): T[] => (Array.isArray(v) ? v.map(f) : []);
const texto = (v: unknown) => (typeof v === "string" ? v : v === undefined || v === null ? "" : String(v));
const objecto = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const numeros = (v: unknown) => listaDe(v, Number).filter((n) => Number.isInteger(n) && n > 0);

function textoGuia(v: unknown): Texto {
  const o = objecto(v);
  return { texto: texto(o.texto), fontes: numeros(o.fontes) };
}
function blocoGuia(v: unknown): Bloco {
  const o = objecto(v);
  return { titulo: texto(o.titulo), paragrafos: listaDe(o.paragrafos, textoGuia) };
}
function tabelaGuia(v: unknown): Tabela {
  const o = objecto(v);
  const nota = o.nota ? textoGuia(o.nota) : undefined;
  return {
    titulo: texto(o.titulo),
    colunas: listaDe(o.colunas, texto),
    linhas: listaDe(o.linhas, (l) => listaDe(l, texto)),
    ...(nota && nota.texto.trim() ? { nota } : {}),
  };
}

/**
 * O guia de uma modalidade, completo e com a forma certa, venha de onde vier
 * (o de partida, um gravado antigo ou uma modalidade nova ainda sem guia).
 * O que falta fica vazio, e a página esconde as partes vazias.
 */
export function normalizarGuia(v: unknown): ConteudoPagina {
  const g = objecto(v);
  const angola = objecto(g.angola);
  const comecar = objecto(g.comecar);
  return {
    numeros: listaDe(g.numeros, (n) => ({ valor: texto(objecto(n).valor), label: texto(objecto(n).label) })),
    abertura: texto(g.abertura),
    factos: listaDe(g.factos, (f) => ({ rotulo: texto(objecto(f).rotulo), valor: texto(objecto(f).valor) })),
    formato: listaDe(g.formato, blocoGuia),
    classes: listaDe(g.classes, tabelaGuia),
    maquinas: listaDe(g.maquinas, textoGuia),
    equipamento: listaDe(g.equipamento, textoGuia),
    angola: {
      intro: listaDe(angola.intro, textoGuia),
      marcos: listaDe(angola.marcos, (m) => {
        const o = objecto(m);
        return { ano: texto(o.ano), texto: texto(o.texto), fontes: numeros(o.fontes) };
      }),
      blocos: listaDe(angola.blocos, blocoGuia),
    },
    internacional: listaDe(g.internacional, (i) => {
      const o = objecto(i);
      const seguir = texto(o.seguir);
      return { nome: texto(o.nome), texto: textoGuia(o.texto), ...(seguir ? { seguir } : {}) };
    }),
    lusofonia: listaDe(g.lusofonia, textoGuia),
    comecar: {
      passos: listaDe(comecar.passos, (p) => ({ titulo: texto(objecto(p).titulo), texto: textoGuia(objecto(p).texto) })),
      seguranca: listaDe(comecar.seguranca, texto),
    },
    fontes: listaDe(g.fontes, (f) => ({ nome: texto(objecto(f).nome), url: texto(objecto(f).url) })),
  };
}

/** Uma modalidade gravada no painel, completa (campos em falta ficam vazios). */
export function normalizarModalidade(v: unknown): ModalidadeCompleta {
  const o = objecto(v);
  const grupo = texto(o.grupo);
  return {
    slug: texto(o.slug),
    nome: texto(o.nome),
    disciplinas: listaDe(o.disciplinas, texto) as Disciplina[],
    grupo: grupo === "principal" || grupo === "outras" ? grupo : "competicao",
    descricao: texto(o.descricao),
    imagem: texto(o.imagem),
    categorias: listaDe(o.categorias, texto),
    guia: normalizarGuia(o.guia),
  };
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
