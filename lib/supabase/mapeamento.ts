/* ============================================================
   MOTOBOX — Tradução entre a base de dados e os tipos da app
   O Postgres usa snake_case; a aplicação usa camelCase. Estas
   funções convertem nos dois sentidos, por coleção.
   ============================================================ */

import type { ColeccaoNome } from "@/lib/admin/store";

/** Nome da tabela para cada coleção do painel. */
export const TABELA: Record<ColeccaoNome, string> = {
  eventos: "eventos",
  pilotos: "pilotos",
  equipas: "equipas",
  corridas: "corridas",
  noticias: "noticias",
  videos: "videos",
  patrocinadores: "patrocinadores",
  anuncios: "anuncios",
  topicos: "topicos",
  categoriasForum: "categorias_forum",
  utilizadores: "utilizadores",
  encomendas: "encomendas",
  denuncias: "denuncias",
  subscritores: "subscritores",
  mensagens: "mensagens",
  paginasLegais: "paginas_legais",
  atividade: "atividade",
};

/** Chave primária de cada tabela. */
export const CHAVE_TABELA: Record<ColeccaoNome, string> = {
  eventos: "slug", pilotos: "slug", equipas: "slug", corridas: "slug",
  noticias: "slug", videos: "slug", patrocinadores: "slug",
  paginasLegais: "slug", categoriasForum: "slug",
  anuncios: "id", topicos: "id", utilizadores: "id", encomendas: "id",
  denuncias: "id", subscritores: "id", mensagens: "id", atividade: "id",
};

/**
 * Campos cujo nome difere entre a app e a base de dados.
 * Chave = nome na app, valor = coluna no Postgres.
 */
const RENOMES: Partial<Record<ColeccaoNome, Record<string, string>>> = {
  eventos: {
    dataInicio: "data_inicio", dataFim: "data_fim",
    distanciaVolta: "distancia_volta", numeroVoltas: "numero_voltas",
    recordeVolta: "recorde_volta",
  },
  pilotos: { equipaSlug: "equipa_slug" },
  corridas: { eventoSlug: "evento_slug" },
  noticias: { fonteUrl: "fonte_url" },
  topicos: {
    categoriaSlug: "categoria_slug", autorAvatar: "autor_avatar",
    avatarCor: "avatar_cor", ultimaResposta: "ultima_resposta",
  },
  anuncios: { publicado: "publicado_em" },
  utilizadores: { avatarCor: "avatar_cor", ultimoAcesso: "ultimo_acesso" },
  encomendas: {
    eventoSlug: "evento_slug", eventoTitulo: "evento_titulo",
    tipoBilheteId: "tipo_bilhete_id", tipoBilheteNome: "tipo_bilhete_nome",
    precoUnitario: "preco_unitario", codigoQR: "codigo_qr",
  },
  denuncias: { alvoId: "alvo_id", alvoTitulo: "alvo_titulo" },
};

/** Colunas geridas pela base de dados, nunca escritas pela app. */
const COLUNAS_INTERNAS = new Set(["criado_em", "atualizado_em"]);

function inverso(mapa: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(mapa).map(([k, v]) => [v, k]));
}

/** Converte uma linha da base de dados num objecto da aplicação. */
export function daBase<T>(coleccao: ColeccaoNome, linha: Record<string, unknown>): T {
  const mapa = inverso(RENOMES[coleccao] ?? {});
  const saida: Record<string, unknown> = {};

  for (const [col, valor] of Object.entries(linha)) {
    if (COLUNAS_INTERNAS.has(col)) continue;
    // `anuncios.publicado_em` volta a chamar-se `publicado` na app,
    // onde representa a data de publicação do anúncio.
    const nome = mapa[col] ?? col;
    saida[nome] = valor;
  }

  // O campo booleano `publicado` das outras tabelas não existe nos
  // tipos públicos da app — é usado só para filtrar leituras.
  if (coleccao !== "anuncios" && coleccao !== "paginasLegais") {
    delete saida.publicado;
  }

  return saida as T;
}

/** Converte um objecto da aplicação numa linha para a base de dados. */
export function paraBase(
  coleccao: ColeccaoNome,
  item: Record<string, unknown>,
): Record<string, unknown> {
  const mapa = RENOMES[coleccao] ?? {};
  const saida: Record<string, unknown> = {};

  for (const [campo, valor] of Object.entries(item)) {
    if (valor === undefined) continue;
    saida[mapa[campo] ?? campo] = valor;
  }

  return saida;
}

/** Converte uma lista inteira. */
export function listaDaBase<T>(
  coleccao: ColeccaoNome,
  linhas: Record<string, unknown>[] | null,
): T[] {
  return (linhas ?? []).map((l) => daBase<T>(coleccao, l));
}

/* ---------- Definições (linha única, nomes próprios) ---------- */

const DEFINICOES_COLUNAS: Record<string, string> = {
  nomeSite: "nome_site",
  emailContacto: "email_contacto",
  taxaMotobox: "taxa_motobox",
  registosAbertos: "registos_abertos",
  marketplaceAberto: "marketplace_aberto",
  forumAberto: "forum_aberto",
  bilheteiraAberta: "bilheteira_aberta",
  cookieBanner: "cookie_banner",
};

export function definicoesDaBase(linha: Record<string, unknown>) {
  const mapa = inverso(DEFINICOES_COLUNAS);
  const saida: Record<string, unknown> = {};
  for (const [col, valor] of Object.entries(linha)) {
    if (col === "id" || COLUNAS_INTERNAS.has(col)) continue;
    saida[mapa[col] ?? col] = valor;
  }
  return saida;
}

export function definicoesParaBase(d: Record<string, unknown>) {
  const saida: Record<string, unknown> = {};
  for (const [campo, valor] of Object.entries(d)) {
    if (valor === undefined) continue;
    saida[DEFINICOES_COLUNAS[campo] ?? campo] = valor;
  }
  return saida;
}
