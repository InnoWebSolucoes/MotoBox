import "server-only";

/* ============================================================
   MOTOBOX — Contagens do fórum (servidor)
   O número de respostas e a última resposta de cada tópico, os
   contadores das categorias e o número de membros.
   As contagens mudam por somas, nunca por recontagem: os tópicos
   e as categorias de partida trazem números que não correspondem
   a respostas guardadas, e recontar apagava-os. Cada soma só
   escreve se ninguém mexeu no número entretanto; senão relê e
   repete.
   ============================================================ */

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { EstadoTopico, UltimaResposta } from "./tipos";

const TENTATIVAS = 3;

/**
 * "Última resposta" no formato da lista do fórum, que mostra `quando` tal
 * como está: por isso vai por extenso ("27 de setembro"); `em` guarda o
 * instante exacto.
 */
export function ultimaResposta(autor: string, iso: string): UltimaResposta {
  const instante = new Date(iso || Date.now());
  return {
    autor,
    quando: instante.toLocaleDateString("pt-PT", { day: "numeric", month: "long", timeZone: "Africa/Luanda" }),
    em: instante.toISOString(),
  };
}

/** A coluna `ultima_resposta` tal como está (jsonb), no formato da app. */
function ultimaDaLinha(v: unknown): UltimaResposta {
  const u = (v ?? {}) as Partial<UltimaResposta>;
  return { autor: String(u.autor ?? ""), quando: String(u.quando ?? ""), ...(u.em ? { em: String(u.em) } : {}) };
}

/** Contagem e última resposta do tópico tal como estão agora, ou null se o tópico não existe. */
export async function estadoDoTopico(db: SupabaseClient, topicoId: string): Promise<EstadoTopico | null> {
  const { data } = await db.from("topicos").select("respostas, ultima_resposta").eq("id", topicoId).maybeSingle();
  if (!data) return null;
  return { respostas: Number(data.respostas) || 0, ultimaResposta: ultimaDaLinha(data.ultima_resposta) };
}

/**
 * Soma `delta` às respostas do tópico (nunca abaixo de zero) e, se vier,
 * troca a última resposta. `lida` poupa a primeira leitura a quem já tem
 * a contagem. Devolve a contagem final, ou null se não ficou escrita.
 */
export async function ajustarTopico(
  db: SupabaseClient,
  topicoId: string,
  { delta, ultima, lida }: { delta: number; ultima?: UltimaResposta; lida?: number },
): Promise<number | null> {
  let contagem = lida;
  for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
    if (contagem === undefined) {
      const { data: actual } = await db.from("topicos").select("respostas").eq("id", topicoId).maybeSingle();
      if (!actual) return null;
      contagem = Number(actual.respostas) || 0;
    }
    const nova = Math.max(0, contagem + delta);
    const { data: feito, error } = await db
      .from("topicos")
      .update(ultima ? { respostas: nova, ultima_resposta: ultima } : { respostas: nova })
      .eq("id", topicoId).eq("respostas", contagem)
      .select("id");
    if (error) { console.error("[forum] contagem do tópico:", error.message); return null; }
    if (feito?.length) return nova;
    contagem = undefined;
  }
  return null;
}

/** Soma aos contadores de uma categoria (tópicos e mensagens). Falhar aqui não desfaz nada. */
export async function ajustarCategoria(
  db: SupabaseClient,
  slug: string | null | undefined,
  delta: { topicos?: number; mensagens?: number },
): Promise<void> {
  if (!slug) return;
  for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
    const { data: c, error } = await db
      .from("categorias_forum").select("topicos, mensagens").eq("slug", slug).maybeSingle();
    if (error) { console.error("[forum] contadores da categoria:", error.message); return; }
    if (!c) return;
    const antes = { topicos: Number(c.topicos) || 0, mensagens: Number(c.mensagens) || 0 };
    const { data: feito, error: erroEscrita } = await db
      .from("categorias_forum")
      .update({
        topicos: Math.max(0, antes.topicos + (delta.topicos ?? 0)),
        mensagens: Math.max(0, antes.mensagens + (delta.mensagens ?? 0)),
      })
      .eq("slug", slug).eq("topicos", antes.topicos).eq("mensagens", antes.mensagens)
      .select("slug");
    if (erroEscrita) { console.error("[forum] contadores da categoria:", erroEscrita.message); return; }
    if (feito?.length) return;
  }
}

/**
 * Depois de esconder, mostrar ou apagar uma resposta: soma `delta` à
 * contagem do tópico e às mensagens da categoria, e volta a apontar a
 * última resposta à publicada mais recente. Se já não houver nenhuma e
 * a última vinha de uma resposta guardada (tem `em`), fica vazia; a
 * de um tópico de partida fica como estava.
 */
export async function reporTopico(
  db: SupabaseClient,
  topicoId: string,
  delta: number,
): Promise<EstadoTopico | null> {
  const [{ data: topico }, { data: recentes, error }] = await Promise.all([
    db.from("topicos").select("respostas, ultima_resposta, categoria_slug").eq("id", topicoId).maybeSingle(),
    db.from("respostas_forum").select("autor_nome, criado_em")
      .eq("topico_id", topicoId).eq("publicado", true)
      .order("criado_em", { ascending: false }).limit(1),
  ]);
  if (!topico) return null;
  if (error) console.error("[forum] última resposta:", error.message);

  const antes = ultimaDaLinha(topico.ultima_resposta);
  const r = error ? undefined : recentes?.[0];
  const ultima = r
    ? ultimaResposta(String(r.autor_nome ?? ""), String(r.criado_em ?? ""))
    : !error && antes.em ? { autor: "", quando: "" } : undefined;

  const respostas = await ajustarTopico(db, topicoId, { delta, ultima, lida: Number(topico.respostas) || 0 });
  if (delta) await ajustarCategoria(db, topico.categoria_slug as string | null, { mensagens: delta });
  if (respostas === null) return null;
  return { respostas, ultimaResposta: ultima ?? antes };
}

/**
 * Membros do fórum: contas criadas no site (ligadas ao Auth), com o email
 * confirmado e não banidas. A tabela não tem leitura pública, por isso conta
 * no servidor. Null quando não dá para contar: a página não mostra número.
 */
export async function contarMembros(): Promise<number | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { count, error } = await db
    .from("utilizadores")
    .select("id", { count: "exact", head: true })
    .not("auth_id", "is", null)
    .not("estado", "in", "(pendente,banido)");
  if (error) {
    console.error("[forum] Falha ao contar membros:", error.message);
    return null;
  }
  return count ?? null;
}
