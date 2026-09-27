import "server-only";

/* ============================================================
   MOTOBOX — Leitura de conteúdo para o site público
   Cada função lê do Supabase quando está configurado e recorre
   a `lib/data.ts` caso contrário, para o site continuar a
   funcionar sem base de dados (e durante o build inicial).

   Uma tabela vazia NÃO recorre aos dados de demonstração: se o
   administrador apagou tudo, o site mostra que não há conteúdo.
   Só a falta de configuração ou um erro de leitura o fazem.

   As páginas que usam estas funções declaram `revalidate`, pelo
   que continuam servidas como HTML estático em cache.
   ============================================================ */

import { cache } from "react";
import { supabasePublico, supabaseConfigurado } from "./server";
import { listaDaBase, definicoesDaBase, TABELA } from "./mapeamento";
import type { ColeccaoNome } from "@/lib/admin/store";
import {
  eventos as eventosLocais, pilotos as pilotosLocais,
  equipas as equipasLocais, corridas as corridasLocais,
  noticias as noticiasLocais, videos as videosLocais,
  patrocinadores as patrocinadoresLocais, anuncios as anunciosLocais,
  topicos as topicosLocais, categoriasForum as categoriasLocais,
  clubes as clubesLocais,
} from "@/lib/data";
import { paginasLegaisSeed, definicoesSeed } from "@/lib/admin/seed";
import type {
  Evento, Piloto, Equipa, Corrida, Noticia, Video,
  Patrocinador, AnuncioMarketplace, TopicoForum, CategoriaForum, Clube,
} from "@/lib/types";
import type { PaginaLegal } from "@/lib/admin/types";

/** Intervalo de revalidação das páginas públicas, em segundos. */
export const REVALIDAR = 60;

type Linha = Record<string, unknown>;

/**
 * Linhas de uma tabela, ou `null` quando não há como as ler (sem
 * Supabase, ou com erro). Memorizado por pedido: a página, os
 * metadados e os componentes partilham a mesma consulta.
 */
const lerTabela = cache(async (coleccao: ColeccaoNome): Promise<Linha[] | null> => {
  if (!supabaseConfigurado) return null;
  const db = supabasePublico();
  if (!db) return null;

  const { data, error } = await db.from(TABELA[coleccao]).select("*");
  if (error || !data) {
    console.error(`[publico] Falha ao ler "${TABELA[coleccao]}":`, error?.message);
    return null;
  }
  return data;
});

/**
 * Aproxima a linha da base dos tipos da app, onde os campos
 * opcionais faltam em vez de virem a `null`.
 */
function normalizar(coleccao: ColeccaoNome, linha: Linha): Linha {
  const saida: Linha = {};
  for (const [col, valor] of Object.entries(linha)) {
    if (valor !== null) saida[col] = valor;
  }

  // Sem tipos de bilhete, o evento não vende bilhetes: a app espera o
  // campo ausente, não uma lista vazia.
  if (coleccao === "eventos" && Array.isArray(saida.bilhetes) && saida.bilhetes.length === 0) {
    delete saida.bilhetes;
  }

  return saida;
}

async function ler<T>(
  coleccao: ColeccaoNome,
  alternativa: T[],
  ordem?: (a: T, b: T) => number,
): Promise<T[]> {
  const linhas = await lerTabela(coleccao);

  const lista = linhas === null
    ? [...alternativa]
    : listaDaBase<T>(coleccao, linhas.map((l) => normalizar(coleccao, l)));

  return ordem ? lista.sort(ordem) : lista;
}

/* ---------- Ordem de apresentação ---------- */
// A base devolve as linhas por ordem física, que muda a cada edição.

const tempo = (iso: string) => new Date(iso).getTime() || 0;
const recentesPrimeiro = (a: string, b: string) => tempo(b) - tempo(a);

const NIVEL_PATROCINIO: Record<Patrocinador["nivel"], number> = {
  Principal: 0, Oficial: 1, Apoio: 2, Media: 3,
};

/* ---------- Listas ---------- */

export const lerEventos = () =>
  ler<Evento>("eventos", eventosLocais, (a, b) => tempo(a.dataInicio) - tempo(b.dataInicio));

export const lerPilotos = () =>
  ler<Piloto>("pilotos", pilotosLocais, (a, b) =>
    b.estatisticas.pontos - a.estatisticas.pontos || a.nome.localeCompare(b.nome));

export const lerEquipas = () =>
  ler<Equipa>("equipas", equipasLocais, (a, b) =>
    b.estatisticas.pontos - a.estatisticas.pontos || a.nome.localeCompare(b.nome));

export const lerCorridas = () =>
  ler<Corrida>("corridas", corridasLocais, (a, b) =>
    tempo(a.data) - tempo(b.data) || a.ronda - b.ronda || a.categoria.localeCompare(b.categoria));

export const lerNoticias = () =>
  ler<Noticia>("noticias", noticiasLocais, (a, b) => recentesPrimeiro(a.data, b.data));

export const lerVideos = () =>
  ler<Video>("videos", videosLocais, (a, b) => recentesPrimeiro(a.data, b.data));

export const lerPatrocinadores = () =>
  ler<Patrocinador>("patrocinadores", patrocinadoresLocais, (a, b) =>
    (NIVEL_PATROCINIO[a.nivel] ?? 9) - (NIVEL_PATROCINIO[b.nivel] ?? 9) || a.desde - b.desde);

export const lerAnuncios = () =>
  ler<AnuncioMarketplace>("anuncios", anunciosLocais, (a, b) => recentesPrimeiro(a.publicado, b.publicado));

export const lerTopicos = () =>
  ler<TopicoForum>("topicos", topicosLocais, (a, b) => recentesPrimeiro(a.criado, b.criado));

export const lerCategoriasForum = () => ler<CategoriaForum>("categoriasForum", categoriasLocais);

/** Clubes em destaque primeiro, depois por nome. */
export const lerClubes = () =>
  ler<Clube>("clubes", clubesLocais, (a, b) =>
    Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)) || a.nome.localeCompare(b.nome));
export const lerPaginasLegais  = () => ler<PaginaLegal>("paginasLegais", paginasLegaisSeed);

/* ---------- Registos individuais ---------- */
// Procuram na lista já lida, que fica em memória durante o pedido.

export const lerEvento   = async (slug: string) => (await lerEventos()).find((e) => e.slug === slug);
export const lerPiloto   = async (slug: string) => (await lerPilotos()).find((p) => p.slug === slug);
export const lerEquipa   = async (slug: string) => (await lerEquipas()).find((e) => e.slug === slug);
export const lerClube    = async (slug: string) => (await lerClubes()).find((c) => c.slug === slug);
export const lerCorrida  = async (slug: string) => (await lerCorridas()).find((c) => c.slug === slug);
export const lerNoticia  = async (slug: string) => (await lerNoticias()).find((n) => n.slug === slug);
export const lerAnuncio  = async (id: string) => (await lerAnuncios()).find((a) => a.id === id);
export const lerTopico   = async (id: string) => (await lerTopicos()).find((t) => t.id === id);

export async function lerDefinicoes() {
  if (!supabaseConfigurado) return definicoesSeed;
  const db = supabasePublico();
  if (!db) return definicoesSeed;

  const { data, error } = await db.from("definicoes").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return definicoesSeed;

  return { ...definicoesSeed, ...definicoesDaBase(data) };
}
