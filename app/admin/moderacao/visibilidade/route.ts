import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabaseAdminConfigurado } from "@/lib/supabase/server";

/* ============================================================
   MOTOBOX ADMIN — Mostrar ou esconder anúncios e tópicos
   As tabelas `anuncios` e `topicos` têm a coluna `publicado`
   (o site só lê as linhas publicadas), mas a API genérica do
   painel não a devolve: em `anuncios`, `publicado` é o nome da
   data de publicação na app. Esta rota lê e muda só essa coluna.

   GET                               { ocultos: { anuncios: [ids], topicos: [ids] } }
   PATCH { tipo, id, publicado }     mostra (true) ou esconde (false)

   Fica debaixo de /admin, por isso o proxy só deixa passar a
   equipa (o mesmo controlo da API de administração).
   ============================================================ */

export const dynamic = "force-dynamic";

const TABELAS = { anuncios: "anuncios", topicos: "topicos" } as const;
type Tipo = keyof typeof TABELAS;

const erro = (mensagem: string, codigo = 400) => NextResponse.json({ erro: mensagem }, { status: codigo });

function base() {
  if (!supabaseAdminConfigurado) return null;
  return supabaseAdmin();
}

export async function GET() {
  const db = base();
  if (!db) return erro("Supabase não configurado.", 503);
  const [a, t] = await Promise.all([
    db.from("anuncios").select("id").eq("publicado", false),
    db.from("topicos").select("id").eq("publicado", false),
  ]);
  if (a.error) return erro(a.error.message, 500);
  if (t.error) return erro(t.error.message, 500);
  return NextResponse.json({
    ocultos: {
      anuncios: (a.data ?? []).map((l) => String(l.id)),
      topicos: (t.data ?? []).map((l) => String(l.id)),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const db = base();
  if (!db) return erro("Supabase não configurado.", 503);
  let corpo: { tipo?: string; id?: string; publicado?: unknown };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }
  const { tipo, id, publicado } = corpo;
  if (!tipo || !(tipo in TABELAS)) return erro("Tipo desconhecido.");
  if (!id || typeof id !== "string") return erro("Falta o identificador.");
  if (typeof publicado !== "boolean") return erro("Indique se fica visível ou não.");

  const { data, error } = await db
    .from(TABELAS[tipo as Tipo]).update({ publicado }).eq("id", id).select("id");
  if (error) return erro(error.message, 500);
  if (!data?.length) return erro("Este registo já não existe. Recarregue a página.", 404);
  try { revalidatePath("/", "layout"); } catch { /* fora de contexto de pedido */ }
  return NextResponse.json({ ok: true });
}
