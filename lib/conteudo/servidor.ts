import "server-only";

/* ============================================================
   MOTOBOX — Conteúdo editável: acesso aos dados
   Cada documento é uma linha da tabela `paginas_legais` com o
   slug "conteudo.<chave>" e os dados em `seccoes` (jsonb). A
   tabela já existe e é de leitura pública; as páginas legais
   verdadeiras ignoram estas linhas (ver ePaginaDeConteudo).

   Sem Supabase (só em desenvolvimento), lê e grava num ficheiro
   local, .conteudo-local.json, para o painel poder ser testado
   sem tocar na base de dados verdadeira.
   ============================================================ */

import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  supabaseAdmin, supabaseAdminConfigurado, supabaseConfigurado, supabasePublico,
} from "@/lib/supabase/server";

/** Prefixo dos slugs de conteúdo na tabela `paginas_legais`. */
export const PREFIXO = "conteudo.";

export const ePaginaDeConteudo = (slug: string) => slug.startsWith(PREFIXO);

export interface LinhaConteudo {
  /** A chave, sem o prefixo. */
  chave: string;
  titulo: string;
  dados: unknown;
  atualizado?: string;
}

/** Em desenvolvimento e sem base de dados, grava-se num ficheiro local. */
export const emModoLocal = () => !supabaseAdminConfigurado && process.env.NODE_ENV !== "production";

const FICHEIRO_LOCAL = path.join(process.cwd(), ".conteudo-local.json");

async function lerLocal(): Promise<Record<string, Omit<LinhaConteudo, "chave">>> {
  try {
    return JSON.parse(await fs.readFile(FICHEIRO_LOCAL, "utf8"));
  } catch {
    return {};
  }
}

async function gravarLocal(dados: Record<string, Omit<LinhaConteudo, "chave">>) {
  await fs.writeFile(FICHEIRO_LOCAL, JSON.stringify(dados, null, 1), "utf8");
}

function paraMapa(linhas: { slug: string; titulo: string | null; seccoes: unknown; atualizado_em?: string | null }[]) {
  const mapa = new Map<string, LinhaConteudo>();
  for (const l of linhas) {
    if (!ePaginaDeConteudo(l.slug)) continue;
    const chave = l.slug.slice(PREFIXO.length);
    mapa.set(chave, { chave, titulo: l.titulo ?? chave, dados: l.seccoes, atualizado: l.atualizado_em ?? undefined });
  }
  return mapa;
}

async function lerDoLocal(): Promise<Map<string, LinhaConteudo>> {
  const local = await lerLocal();
  return new Map(Object.entries(local).map(([chave, l]) => [chave, { chave, ...l }]));
}

/**
 * Todas as linhas de conteúdo, para as páginas públicas (chave anónima,
 * uma leitura por pedido). Falhando a base de dados, devolve um mapa vazio
 * e o site mostra o conteúdo de partida.
 */
export const lerLinhasPublicas = cache(async (): Promise<Map<string, LinhaConteudo>> => {
  if (emModoLocal() && !supabaseConfigurado) return lerDoLocal();
  const db = supabasePublico();
  if (!db) return new Map();
  const { data, error } = await db
    .from("paginas_legais")
    .select("slug, titulo, seccoes, atualizado_em")
    .like("slug", `${PREFIXO}%`);
  if (error || !data) {
    console.error("[conteudo] Falha ao ler o conteúdo editável:", error?.message);
    return new Map();
  }
  return paraMapa(data);
});

/** Todas as linhas de conteúdo, para o painel de gestão (service role, sem cache). */
export async function lerLinhasAdmin(): Promise<Map<string, LinhaConteudo>> {
  if (emModoLocal()) return lerDoLocal();
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase não configurado.");
  const { data, error } = await db
    .from("paginas_legais")
    .select("slug, titulo, seccoes, atualizado_em")
    .like("slug", `${PREFIXO}%`);
  if (error) throw new Error(error.message);
  return paraMapa(data ?? []);
}

/** Grava (cria ou substitui) um documento. */
export async function gravarLinha(chave: string, titulo: string, dados: unknown, descricao = ""): Promise<string> {
  const agora = new Date().toISOString();
  if (emModoLocal()) {
    const local = await lerLocal();
    local[chave] = { titulo, dados, atualizado: agora };
    await gravarLocal(local);
    return agora;
  }
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase não configurado.");
  const { error } = await db.from("paginas_legais").upsert(
    {
      slug: PREFIXO + chave,
      titulo,
      descricao,
      seccoes: dados,
      publicado: true,
      atualizado: agora.slice(0, 10),
    },
    { onConflict: "slug" },
  );
  if (error) throw new Error(error.message);
  return agora;
}

/** Apaga um documento (o site volta ao conteúdo de partida, ou deixa de o mostrar). */
export async function apagarLinha(chave: string): Promise<void> {
  if (emModoLocal()) {
    const local = await lerLocal();
    delete local[chave];
    await gravarLocal(local);
    return;
  }
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase não configurado.");
  const { error } = await db.from("paginas_legais").delete().eq("slug", PREFIXO + chave);
  if (error) throw new Error(error.message);
}
