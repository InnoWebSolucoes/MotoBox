import "server-only";

/* ============================================================
   MOTOBOX — Leitura de conteúdo para o site público
   Cada função lê do Supabase quando está configurado e recorre
   a `lib/data.ts` caso contrário, para o site continuar a
   funcionar sem base de dados (e durante o build inicial).

   As páginas que usam estas funções declaram `revalidate`, pelo
   que continuam servidas como HTML estático em cache.
   ============================================================ */

import { supabasePublico, supabaseConfigurado } from "./server";
import { listaDaBase, definicoesDaBase, TABELA } from "./mapeamento";
import type { ColeccaoNome } from "@/lib/admin/store";
import {
  eventos as eventosLocais, pilotos as pilotosLocais,
  equipas as equipasLocais, corridas as corridasLocais,
  noticias as noticiasLocais, videos as videosLocais,
  patrocinadores as patrocinadoresLocais, anuncios as anunciosLocais,
  topicos as topicosLocais, categoriasForum as categoriasLocais,
} from "@/lib/data";
import { paginasLegaisSeed, definicoesSeed } from "@/lib/admin/seed";
import type {
  Evento, Piloto, Equipa, Corrida, Noticia, Video,
  Patrocinador, AnuncioMarketplace, TopicoForum, CategoriaForum,
} from "@/lib/types";
import type { PaginaLegal } from "@/lib/admin/types";

/** Intervalo de revalidação das páginas públicas, em segundos. */
export const REVALIDAR = 60;

async function ler<T>(coleccao: ColeccaoNome, alternativa: T[]): Promise<T[]> {
  if (!supabaseConfigurado) return alternativa;
  const db = supabasePublico();
  if (!db) return alternativa;

  const { data, error } = await db.from(TABELA[coleccao]).select("*");

  // Sem ligação, ou tabela ainda por semear: mantém o conteúdo local
  // para o site nunca aparecer vazio.
  if (error || !data || data.length === 0) return alternativa;

  return listaDaBase<T>(coleccao, data);
}

export const lerEventos        = () => ler<Evento>("eventos", eventosLocais);
export const lerPilotos        = () => ler<Piloto>("pilotos", pilotosLocais);
export const lerEquipas        = () => ler<Equipa>("equipas", equipasLocais);
export const lerCorridas       = () => ler<Corrida>("corridas", corridasLocais);
export const lerNoticias       = () => ler<Noticia>("noticias", noticiasLocais);
export const lerVideos         = () => ler<Video>("videos", videosLocais);
export const lerPatrocinadores = () => ler<Patrocinador>("patrocinadores", patrocinadoresLocais);
export const lerAnuncios       = () => ler<AnuncioMarketplace>("anuncios", anunciosLocais);
export const lerTopicos        = () => ler<TopicoForum>("topicos", topicosLocais);
export const lerCategoriasForum = () => ler<CategoriaForum>("categoriasForum", categoriasLocais);
export const lerPaginasLegais  = () => ler<PaginaLegal>("paginasLegais", paginasLegaisSeed);

export async function lerDefinicoes() {
  if (!supabaseConfigurado) return definicoesSeed;
  const db = supabasePublico();
  if (!db) return definicoesSeed;

  const { data, error } = await db.from("definicoes").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return definicoesSeed;

  return { ...definicoesSeed, ...definicoesDaBase(data) };
}
