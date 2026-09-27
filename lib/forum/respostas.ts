import "server-only";

/* ============================================================
   MOTOBOX — Respostas do fórum (servidor)
   Leitura pública das respostas publicadas e as regras que a
   rota /api/forum/responder partilha com a página do tópico.
   Antes de a migração de 27/09 correr, a tabela não existe:
   a página mostra só o que já tinha e a rota avisa com calma.
   ============================================================ */

import type { User } from "@supabase/supabase-js";
import { supabasePublico } from "@/lib/supabase/server";
import { COR_PADRAO, type RespostaPublica } from "./tipos";

const COR_HEX = /^#[0-9a-f]{6}$/i;

const baseSupabase = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");

/** Erro do PostgREST quando a tabela ainda não foi criada. */
export function tabelaEmFalta(erro: { code?: string; message?: string } | null | undefined): boolean {
  if (!erro) return false;
  const msg = erro.message ?? "";
  return erro.code === "PGRST205" || erro.code === "42P01"
    || (msg.includes("respostas_forum") && /schema cache|does not exist/i.test(msg));
}

export const corValida = (v: unknown): string | null =>
  typeof v === "string" && COR_HEX.test(v) ? v.toLowerCase() : null;

/**
 * Logótipo guardado nos metadados, só se estiver na pasta da própria conta.
 * O user_metadata também pode ser escrito pelo próprio utilizador com a chave
 * pública, por isso um endereço qualquer não passa (a mesma regra da conta).
 */
export function avatarDaConta(user: User): string | null {
  const url = user.user_metadata?.avatarUrl;
  const base = baseSupabase();
  if (!base || typeof url !== "string") return null;
  return url.startsWith(`${base}/storage/v1/object/public/avatares/${user.id}/`) ? url : null;
}

/** Só a rota escreve, mas a página confirma na mesma que a imagem é da pasta das contas. */
function avatarPublico(v: unknown): string | undefined {
  const base = baseSupabase();
  return base && typeof v === "string" && v.startsWith(`${base}/storage/v1/object/public/avatares/`)
    ? v : undefined;
}

type Linha = Record<string, unknown>;

export function respostaDaLinha(l: Linha): RespostaPublica {
  return {
    id: String(l.id),
    autorNome: String(l.autor_nome ?? ""),
    autorCor: corValida(l.autor_cor) ?? COR_PADRAO,
    autorAvatar: avatarPublico(l.autor_avatar),
    corpo: String(l.corpo ?? ""),
    criadoEm: String(l.criado_em ?? ""),
  };
}

export const COLUNAS_PUBLICAS = "id, autor_nome, autor_cor, autor_avatar, corpo, criado_em";

/** Respostas publicadas de um tópico, da mais antiga para a mais recente. */
export async function lerRespostas(topicoId: string): Promise<RespostaPublica[]> {
  const db = supabasePublico();
  if (!db) return [];
  const { data, error } = await db
    .from("respostas_forum")
    .select(COLUNAS_PUBLICAS)
    .eq("topico_id", topicoId)
    .eq("publicado", true)
    .order("criado_em", { ascending: true })
    .limit(500);
  if (error) {
    if (!tabelaEmFalta(error)) console.error("[forum] Falha ao ler respostas:", error.message);
    return [];
  }
  return (data ?? []).map((l) => respostaDaLinha(l as Linha));
}
