import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { respostaDaLinha, tabelaEmFalta, COLUNAS_PUBLICAS } from "@/lib/forum/respostas";
import { estadoDoTopico, reporTopico } from "@/lib/forum/contagens";
import type { RespostaAdmin } from "@/lib/forum/tipos";

/* ============================================================
   MOTOBOX — Moderar respostas do fórum (painel)
   Lista as respostas de um tópico, também as escondidas, e
   esconde, volta a mostrar ou apaga uma de cada vez. A
   contagem e a última resposta do tópico acompanham, como
   quando um membro responde, e as mensagens da categoria
   também.

   O acesso é verificado no middleware, como no resto de
   /api/admin: só a equipa com papel adequado chega aqui.
   ============================================================ */

export const dynamic = "force-dynamic";

const SEM_TABELA = "As respostas do fórum ficam disponíveis depois de correr no Supabase a migração supabase/migracao-2026-09-27.sql.";

const COLUNAS = `${COLUNAS_PUBLICAS}, topico_id, publicado`;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

function respostaAdmin(l: Record<string, unknown>): RespostaAdmin {
  return { ...respostaDaLinha(l), topicoId: String(l.topico_id ?? ""), publicado: l.publicado !== false };
}

/** A página do tópico e a lista do fórum mostram a contagem: geram-se de novo na visita seguinte. */
function revalidar(topicoId: string) {
  try {
    revalidatePath(`/forum/${topicoId}`);
    revalidatePath("/forum");
  } catch { /* fora de contexto */ }
}

/* ---------------- GET: as respostas de um tópico, ou uma só ---------------- */
// ?topico=<id> devolve todas as do tópico; ?id=<id> devolve uma (para a Moderação).

export async function GET(req: NextRequest) {
  const db = supabaseAdmin();
  if (!db) return erro("Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY.", 503);

  const params = new URL(req.url).searchParams;
  const id = params.get("id");
  const topicoId = params.get("topico");

  if (id) {
    const { data, error } = await db.from("respostas_forum").select(COLUNAS).eq("id", id).maybeSingle();
    if (error) return tabelaEmFalta(error) ? erro(SEM_TABELA, 503) : erro(error.message, 500);
    if (!data) return erro("Esta resposta já não existe.", 404);
    return NextResponse.json({ resposta: respostaAdmin(data as Record<string, unknown>) });
  }

  if (!topicoId) return erro("Falta o tópico (`topico`) ou a resposta (`id`).");

  const [{ data, error }, topico] = await Promise.all([
    db.from("respostas_forum").select(COLUNAS)
      .eq("topico_id", topicoId)
      .order("criado_em", { ascending: true })
      .limit(500),
    estadoDoTopico(db, topicoId),
  ]);
  // Antes da migração de 27/09 a tabela não existe: o painel mostra o aviso e segue.
  if (tabelaEmFalta(error)) return NextResponse.json({ respostas: [], topico, emFalta: true });
  if (error) return erro(error.message, 500);
  return NextResponse.json({
    respostas: (data ?? []).map((l) => respostaAdmin(l as Record<string, unknown>)),
    topico,
  });
}

/* ---------------- PATCH: esconder ou voltar a mostrar ---------------- */

export async function PATCH(req: NextRequest) {
  const db = supabaseAdmin();
  if (!db) return erro("Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY.", 503);

  let corpo: { id?: unknown; publicado?: unknown };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }
  const id = typeof corpo.id === "string" ? corpo.id : "";
  if (!id) return erro("Falta o identificador da resposta.");
  if (typeof corpo.publicado !== "boolean") return erro("Diga se a resposta fica visível ou escondida.");
  const publicado = corpo.publicado;

  const { data: antes, error: erroLer } = await db
    .from("respostas_forum").select("topico_id, publicado").eq("id", id).maybeSingle();
  if (erroLer) return tabelaEmFalta(erroLer) ? erro(SEM_TABELA, 503) : erro(erroLer.message, 500);
  if (!antes) return erro("Esta resposta já não existe. Recarregue a página.", 404);

  const topicoId = String(antes.topico_id);
  if (antes.publicado === publicado) {
    return NextResponse.json({ topico: await estadoDoTopico(db, topicoId) });
  }

  // Só muda se ninguém a mudou entretanto: assim a contagem soma uma vez.
  const { data: feito, error } = await db
    .from("respostas_forum").update({ publicado })
    .eq("id", id).eq("publicado", antes.publicado)
    .select("id");
  if (error) return erro(error.message, 500);
  if (!feito?.length) return erro("A resposta mudou entretanto. Recarregue a página.", 409);

  const topico = await reporTopico(db, topicoId, publicado ? 1 : -1);
  revalidar(topicoId);
  return NextResponse.json({ topico });
}

/* ---------------- DELETE: apagar de vez ---------------- */

export async function DELETE(req: NextRequest) {
  const db = supabaseAdmin();
  if (!db) return erro("Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY.", 503);

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return erro("Falta o parâmetro `id`.");

  // `select` no delete devolve o que saiu: diz o tópico e se a resposta ainda contava.
  const { data: apagadas, error } = await db
    .from("respostas_forum").delete().eq("id", id).select("topico_id, publicado");
  if (error) return tabelaEmFalta(error) ? erro(SEM_TABELA, 503) : erro(error.message, 500);
  const apagada = apagadas?.[0];
  if (!apagada) return erro("Esta resposta já não existe. Recarregue a página.", 404);

  const topicoId = String(apagada.topico_id);
  const topico = apagada.publicado
    ? await reporTopico(db, topicoId, -1)
    : await estadoDoTopico(db, topicoId);
  revalidar(topicoId);
  return NextResponse.json({ topico });
}
