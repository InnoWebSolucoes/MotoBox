import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabaseAdminConfigurado } from "@/lib/supabase/server";
import { tabelaEmFalta } from "@/lib/forum/respostas";

/* ============================================================
   MOTOBOX ADMIN — Respostas do fórum (moderação)
   As respostas dos membros vivem na tabela `respostas_forum`,
   que a API genérica do painel não conhece. Aqui a equipa lê
   todas (as escondidas também), esconde, volta a mostrar ou
   apaga. A contagem do tópico acompanha as respostas visíveis.

   A linha "op-<tópico>" é a mensagem de abertura de um tópico
   aberto por um membro (ver app/forum/_servidor/forum.ts): vem
   marcada com `abertura: true` e não conta como resposta.
   Escondida, a página do tópico mostra o resumo (`excerto`).

   GET    ?topico=<id>          respostas (as mais recentes primeiro)
   PATCH  { id, publicado }     mostra ou esconde uma resposta
   DELETE ?id=<id>              apaga uma resposta

   Fica debaixo de /admin: o proxy só deixa passar a equipa.
   ============================================================ */

export const dynamic = "force-dynamic";

const erro = (mensagem: string, codigo = 400) => NextResponse.json({ erro: mensagem }, { status: codigo });

const SEM_TABELA =
  "As respostas do fórum precisam da migração supabase/migracao-2026-09-27.sql. Corra-a no Supabase.";

function base() {
  if (!supabaseAdminConfigurado) return null;
  return supabaseAdmin();
}

type Db = NonNullable<ReturnType<typeof base>>;

function revalidar() {
  try { revalidatePath("/", "layout"); } catch { /* fora de contexto de pedido */ }
}

/** Soma (ou tira) uma resposta à contagem do tópico, sem descer abaixo de zero. */
async function acertarContagem(db: Db, topicoId: string, delta: number) {
  const { data } = await db.from("topicos").select("respostas").eq("id", topicoId).maybeSingle();
  if (!data) return;
  const n = Math.max(0, (Number(data.respostas) || 0) + delta);
  await db.from("topicos").update({ respostas: n }).eq("id", topicoId);
}

export async function GET(req: NextRequest) {
  const db = base();
  if (!db) return erro("Supabase não configurado.", 503);
  const topico = req.nextUrl.searchParams.get("topico");
  let consulta = db
    .from("respostas_forum")
    .select("id, topico_id, autor_nome, autor_cor, corpo, criado_em, publicado")
    .order("criado_em", { ascending: false })
    .limit(500);
  if (topico) consulta = consulta.eq("topico_id", topico);
  const { data, error } = await consulta;
  if (error) {
    if (tabelaEmFalta(error)) return NextResponse.json({ respostas: [], emFalta: true, aviso: SEM_TABELA });
    return erro(error.message, 500);
  }
  return NextResponse.json({
    respostas: (data ?? []).map((l) => ({
      id: String(l.id),
      topicoId: String(l.topico_id),
      autorNome: String(l.autor_nome ?? ""),
      autorCor: typeof l.autor_cor === "string" ? l.autor_cor : "#e10600",
      corpo: String(l.corpo ?? ""),
      criadoEm: String(l.criado_em ?? ""),
      publicado: l.publicado !== false,
      abertura: String(l.id).startsWith("op-"),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const db = base();
  if (!db) return erro("Supabase não configurado.", 503);
  let corpo: { id?: unknown; publicado?: unknown };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }
  const { id, publicado } = corpo;
  if (typeof id !== "string" || !id) return erro("Falta o identificador da resposta.");
  if (typeof publicado !== "boolean") return erro("Indique se a resposta fica visível ou não.");

  const { data: antes, error: erroLer } = await db
    .from("respostas_forum").select("topico_id, publicado").eq("id", id).maybeSingle();
  if (erroLer) return erro(tabelaEmFalta(erroLer) ? SEM_TABELA : erroLer.message, tabelaEmFalta(erroLer) ? 503 : 500);
  if (!antes) return erro("Esta resposta já não existe. Recarregue a página.", 404);

  const { error } = await db.from("respostas_forum").update({ publicado }).eq("id", id);
  if (error) return erro(error.message, 500);
  if ((antes.publicado !== false) !== publicado && !id.startsWith("op-")) {
    await acertarContagem(db, String(antes.topico_id), publicado ? 1 : -1);
  }
  revalidar();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const db = base();
  if (!db) return erro("Supabase não configurado.", 503);
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return erro("Falta o identificador da resposta.");

  const { data: antes, error: erroLer } = await db
    .from("respostas_forum").select("topico_id, publicado").eq("id", id).maybeSingle();
  if (erroLer) return erro(tabelaEmFalta(erroLer) ? SEM_TABELA : erroLer.message, tabelaEmFalta(erroLer) ? 503 : 500);
  if (!antes) return NextResponse.json({ ok: true });

  const { error } = await db.from("respostas_forum").delete().eq("id", id);
  if (error) return erro(error.message, 500);
  if (antes.publicado !== false && !id.startsWith("op-")) await acertarContagem(db, String(antes.topico_id), -1);
  revalidar();
  return NextResponse.json({ ok: true });
}
