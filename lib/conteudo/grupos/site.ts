/* ============================================================
   Conteúdo editável — Site: a entrada, o painel Explorar e a
   contagem decrescente. O texto de partida é o que o site
   mostrava antes de passar a ser editável no painel de gestão.
   ============================================================ */

import { UBUNTU } from "@/lib/ubuntu";
import type { DefDoc, DefGrupo } from "../registo-tipos";

/* ---------------- Utilitários partilhados (também usados em ./paginas.ts) ---------------- */

const eObjecto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Junta o que está gravado com o conteúdo de partida, a todos os níveis
 * dos objectos (as listas gravadas substituem as de partida). Assim, um
 * campo novo no código nunca chega vazio a um documento gravado antes.
 */
export function fundir<T>(padrao: T, gravado: unknown): T {
  if (gravado === undefined || gravado === null) return padrao;
  if (eObjecto(padrao) && eObjecto(gravado)) {
    const saida: Record<string, unknown> = { ...padrao };
    for (const [k, v] of Object.entries(gravado)) saida[k] = k in padrao ? fundir(padrao[k], v) : v;
    return saida as T;
  }
  // Um tipo diferente do de partida (ex.: texto onde havia uma lista) não se aceita.
  if (Array.isArray(padrao) !== Array.isArray(gravado)) return padrao;
  return gravado as T;
}

/** Troca {chave} pelos valores (ex.: "{clubes} clubes" → "11 clubes"). */
export function preencher(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (todo, k: string) => (k in valores ? String(valores[k]) : todo));
}

/* ---------------- Entrada ---------------- */

/** Entrada do site (/): a frase da casa por cima do vídeo. */
export interface ConteudoEntrada {
  sobretitulo: string;
  titulo: string;
  texto: string;
  /** Vídeo de fundo de todo o site (endereço ou caminho em /public). */
  video: string;
  /** Imagem mostrada enquanto o vídeo carrega (e com movimento reduzido). */
  poster: string;
  /** Mostra a ligação para o artigo mais recente por baixo do texto. */
  mostrarArtigo: boolean;
  /** Etiqueta vermelha dessa ligação. */
  rotuloArtigo: string;
}

export const ENTRADA_PADRAO: ConteudoEntrada = {
  sobretitulo: "MotoBox Angola",
  titulo: "A paixão anda sobre duas rodas",
  texto:
    "Histórias, clubes, passeios e segurança para quem anda de mota em Angola. Da scooter de todos os dias à moto de viagem, a comunidade motard num só lugar.",
  // Vídeo da MotoBox no Instagram (8.ª prova do Campeonato de Motocross,
  // instagram.com/p/DeOelO6uUlE), cortado a 21 s: sem som, caras, títulos
  // nem clarões, e escurecido para o texto da entrada se ler por cima (ver
  // lib/imagens-instagram.ts). O de demonstração continua em /videos/fundo.mp4.
  video: "https://sluahnkxfnibximsqcht.supabase.co/storage/v1/object/public/media/videos/instagram-DeOelO6uUlE-fundo.mp4",
  poster: "https://sluahnkxfnibximsqcht.supabase.co/storage/v1/object/public/media/videos/instagram-DeOelO6uUlE-fundo.jpg",
  mostrarArtigo: true,
  rotuloArtigo: "Novo artigo",
};

/* ---------------- Contagem decrescente ---------------- */

/** Contagem decrescente no painel Explorar (hoje: Ubuntu 2027). */
export interface ConteudoContagem {
  /** Desligada, o painel fica com o evento mas sem os números a contar. */
  activa: boolean;
  sobretitulo: string;
  titulo: string;
  subtitulo: string;
  /** Data e hora do arranque, ISO com fuso (ex.: 2027-01-31T08:00:00+01:00). */
  data: string;
  /** Para onde leva o painel (ex.: /eventos/ubuntu-2027). */
  ligacao: string;
  /** Texto da ligação, em baixo. */
  textoLigacao: string;
  foto: string;
}

export const CONTAGEM_PADRAO: ConteudoContagem = {
  activa: true,
  sobretitulo: UBUNTU.nome,
  titulo: "Africa Ubuntu Breakfast Run",
  subtitulo: `31 de Janeiro · ${UBUNTU.percurso}`,
  data: UBUNTU.partida,
  ligacao: `/eventos/${UBUNTU.slug}`,
  textoLigacao: "Ver o evento",
  foto: "passeios",
};

/* ---------------- Painel Explorar ---------------- */

/**
 * Painel Explorar: fotografias e textos fixos dos mosaicos.
 * Os números e os destaques continuam a vir dos dados (artigos, clubes,
 * provas, eventos); nos textos, o que está entre chavetas preenche-se
 * sozinho (ex.: {clubes}, {piloto}, {data}).
 */
export interface ConteudoPainel {
  seo: { titulo: string; descricao: string };
  destaque: {
    /** "Artigo em destaque · Clubes": a categoria junta-se sozinha. */
    rotulo: string;
    maisArtigos: string;
    todosArtigos: string;
    /** Título do painel grande quando ainda não há artigos. */
    semArtigos: string;
  };
  clubes: { titulo: string; foto: string; texto: string; textoSemProvincias: string };
  desporto: { titulo: string; foto: string; textoLider: string; textoProva: string; textoVazio: string };
  eventos: { titulo: string; foto: string; fotoDoEvento: boolean; textoProximo: string; textoVazio: string };
  fichas: { rotas: string; seguranca: string; sobre: string; marketplace: string; forum: string };
}

export const PAINEL_PADRAO: ConteudoPainel = {
  seo: {
    titulo: "Explorar",
    descricao:
      "O painel da MotoBox: artigos, clubes de todo o país, eventos, rotas, segurança, marketplace e fórum, à distância de um toque.",
  },
  destaque: {
    rotulo: "Artigo em destaque",
    maisArtigos: "Mais artigos",
    todosArtigos: "Todos os artigos",
    semArtigos: "Artigos",
  },
  clubes: {
    titulo: "Clubes",
    foto: "painel-clubes",
    texto: "{clubes} clubes em {provincias} províncias, de todos os tipos de mota",
    textoSemProvincias: "{clubes} clubes, de todos os tipos de mota",
  },
  desporto: {
    titulo: "Desporto",
    foto: "competicao",
    textoLider: "Campeonato Nacional: {piloto} lidera com {pontos} pontos",
    textoProva: "Próxima prova: {prova}, {data}",
    textoVazio: "Campeonato Nacional, pilotos e resultados",
  },
  eventos: {
    titulo: "Eventos",
    foto: "painel-eventos",
    fotoDoEvento: true,
    textoProximo: "Próximo: {evento}, {data}",
    textoVazio: "Passeios, encontros e raides",
  },
  fichas: {
    rotas: "Rotas",
    seguranca: "Segurança",
    sobre: "A MotoBox",
    marketplace: "Marketplace",
    forum: "Fórum",
  },
};

export const DOCS: DefDoc[] = [
  { chave: "site.entrada", titulo: "Entrada", pagina: "/", padrao: () => ENTRADA_PADRAO },
  { chave: "site.contagem", titulo: "Contagem decrescente", pagina: "/explorar", padrao: () => CONTAGEM_PADRAO },
  { chave: "site.painel", titulo: "Painel Explorar", pagina: "/explorar", padrao: () => PAINEL_PADRAO },
];

export const GRUPOS: DefGrupo[] = [];
