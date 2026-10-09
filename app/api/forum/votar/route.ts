import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual } from "@/lib/conta/sessao";
import { tabelaEmFalta } from "@/lib/forum/respostas";
import { eAbertura, idAbertura } from "@/app/forum/_servidor/forum";
import { votadosPor, votar } from "@/app/forum/_servidor/votos";
import { devagar, erro, verificarConta } from "../_comum";

/* ============================================================
   MOTOBOX — Votos no fórum

   POST { alvoId, votar? }   dá (votar: true) ou retira (false) o
                             voto num tópico ou numa resposta; sem
                             `votar`, troca. Devolve { total, votado }.
   GET  ?ids=a,b,c           em quais destes a pessoa já votou.

   Um voto por conta e por alvo, guardado no conteúdo editável
   (grupo "forum-votos", ver app/forum/_servidor/votos.ts). Só
   tópicos e respostas publicados; ninguém vota no que escreveu
   (os votos recebidos contam para o nível).
   ============================================================ */

export const dynamic = "force-dynamic";

const ID = /^[\w-]{1,80}$/;

export async function POST(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Entre na sua conta para votar.", 401);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }
  const alvoId = typeof corpo.alvoId === "string" ? corpo.alvoId.trim() : "";
  const querVotar = typeof corpo.votar === "boolean" ? corpo.votar : undefined;
  if (!ID.test(alvoId) || eAbertura(alvoId)) return erro("Não é possível votar aqui.");

  if (devagar(`voto:${user.id}`, 40, 60_000)) return erro("Está a votar muito depressa. Aguarde um momento.", 429);

  const db = supabaseAdmin();
  if (!db) return erro("De momento não é possível votar. Tente mais tarde.", 503);

  const { bloqueada } = await verificarConta(db, user);
  if (bloqueada) return erro("A sua conta não pode votar no fórum. Contacte a Motobox.", 403);

  /* ---------- Que alvo é, e de quem? ---------- */
  let topicoId: string;
  let autorId: string | null = null;
  const { data: topico, error: erroTopico } = await db
    .from("topicos").select("id, publicado").eq("id", alvoId).maybeSingle();
  if (erroTopico) return erro("Não foi possível confirmar o tópico. Tente mais tarde.", 500);
  if (topico) {
    if (topico.publicado === false) return erro("Este tópico já não existe.", 404);
    topicoId = alvoId;
    const { data: op } = await db.from("respostas_forum").select("autor_id").eq("id", idAbertura(alvoId)).maybeSingle();
    autorId = op?.autor_id ? String(op.autor_id) : null;
  } else {
    const { data: resposta, error: erroResposta } = await db
      .from("respostas_forum").select("topico_id, autor_id, publicado").eq("id", alvoId).maybeSingle();
    if (erroResposta) {
      if (tabelaEmFalta(erroResposta)) return erro("Esta resposta já não existe.", 404);
      return erro("Não foi possível confirmar a resposta. Tente mais tarde.", 500);
    }
    if (!resposta || resposta.publicado === false) return erro("Esta resposta já não existe.", 404);
    topicoId = String(resposta.topico_id);
    autorId = resposta.autor_id ? String(resposta.autor_id) : null;
  }
  if (autorId && autorId === user.id) return erro("Não pode votar no que escreveu.", 403);

  try {
    const r = await votar(alvoId, user.id, querVotar);
    try {
      revalidatePath(`/forum/${topicoId}`);
      revalidatePath("/forum");
    } catch { /* fora de contexto */ }
    return NextResponse.json(r);
  } catch (e) {
    console.error("[forum/votar]", e instanceof Error ? e.message : e);
    return erro("Não foi possível guardar o voto. Tente de novo.", 500);
  }
}

export async function GET(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return NextResponse.json({ meus: [] });
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",").map((s) => s.trim()).filter((s) => ID.test(s)).slice(0, 300);
  const meus = await votadosPor(user.id, ids);
  return NextResponse.json({ meus }, { headers: { "Cache-Control": "private, no-store" } });
}
