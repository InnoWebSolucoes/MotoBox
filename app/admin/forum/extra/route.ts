import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabaseAdminConfigurado } from "@/lib/supabase/server";
import { tabelaEmFalta } from "@/lib/forum/respostas";
import { lerTodasAdmin, reporVotos } from "@/app/forum/_servidor/votos";

/* ============================================================
   MOTOBOX ADMIN — Fórum: autores e votos
   O que a API genérica do painel não vê:
   - quem abriu cada tópico dos membros (a conta fica na mensagem
     de abertura, a linha "op-<tópico>" de `respostas_forum`; ver
     app/forum/_servidor/forum.ts), com o nome e o email da conta;
   - os votos de cada tópico e resposta (conteúdo editável, grupo
     "forum-votos"; ver app/forum/_servidor/votos.ts).

   GET                    { votos: { <id>: total }, membros: { <tópico>: { nome, email } } }
   DELETE ?alvo=<id>      tira todos os votos de um tópico ou resposta

   Fica debaixo de /admin: o proxy só deixa passar a equipa.
   ============================================================ */

export const dynamic = "force-dynamic";

const erro = (mensagem: string, codigo = 400) => NextResponse.json({ erro: mensagem }, { status: codigo });

interface AutorMembro {
  nome: string;
  email?: string;
  /** Linha de `utilizadores` (para abrir em Gestão › Utilizadores). */
  utilizadorId?: string;
}

export async function GET() {
  const votos: Record<string, number> = {};
  try {
    for (const linha of (await lerTodasAdmin()).values()) {
      if (linha.total > 0) votos[linha.alvo] = linha.total;
    }
  } catch (e) {
    console.error("[admin/forum/extra] votos:", e instanceof Error ? e.message : e);
  }

  const membros: Record<string, AutorMembro> = {};
  const db = supabaseAdminConfigurado ? supabaseAdmin() : null;
  if (!db) return NextResponse.json({ votos, membros, local: true });

  const { data: aberturas, error } = await db
    .from("respostas_forum").select("topico_id, autor_id, autor_nome")
    .like("id", "op-%").limit(2000);
  if (error) {
    if (!tabelaEmFalta(error)) console.error("[admin/forum/extra]", error.message);
    return NextResponse.json({ votos, membros });
  }
  const ids = [...new Set((aberturas ?? []).map((l) => l.autor_id).filter(Boolean).map(String))];
  const contas = new Map<string, { id: string; email: string; nome: string }>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await db.from("utilizadores").select("id, auth_id, email, nome").in("auth_id", ids.slice(i, i + 200));
    for (const u of data ?? []) contas.set(String(u.auth_id), { id: String(u.id), email: String(u.email ?? ""), nome: String(u.nome ?? "") });
  }
  for (const l of aberturas ?? []) {
    const conta = l.autor_id ? contas.get(String(l.autor_id)) : undefined;
    membros[String(l.topico_id)] = {
      nome: conta?.nome || String(l.autor_nome ?? ""),
      email: conta?.email || undefined,
      utilizadorId: conta?.id,
    };
  }
  return NextResponse.json({ votos, membros });
}

export async function DELETE(req: NextRequest) {
  const alvo = req.nextUrl.searchParams.get("alvo") ?? "";
  if (!/^[\w-]{1,80}$/.test(alvo)) return erro("Falta o tópico ou a resposta.");
  try {
    await reporVotos(alvo);
  } catch (e) {
    return erro(e instanceof Error ? e.message : "Não foi possível tirar os votos.", 500);
  }
  try { revalidatePath("/", "layout"); } catch { /* fora de contexto de pedido */ }
  return NextResponse.json({ ok: true });
}
