import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { EMAIL_VALIDO } from "@/lib/email";
import { destinoSeguro } from "@/lib/auth/ligacoes";
import { contaPorEmail, enviarConfirmacao, erroPublico } from "@/lib/auth/emails-conta";

/* ============================================================
   MOTOBOX — Reenviar a confirmação de conta
   Para quem tenta entrar sem ter confirmado o email. Só segue
   para contas que existem e estão por confirmar; a resposta é a
   mesma nos outros casos, para não revelar que emails estão
   registados. A conta procura-se primeiro sem a criar: o
   generateLink "magiclink" de um email desconhecido criava uma.
   ============================================================ */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 }); }
  const email = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
  const destino = destinoSeguro(corpo.destino);
  if (!EMAIL_VALIDO.test(email)) return NextResponse.json({ erro: "Endereço de email inválido." }, { status: 400 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ erro: "Indisponível de momento." }, { status: 503 });

  const conta = await contaPorEmail(db, email);
  if (!conta || conta.confirmada) return NextResponse.json({ ok: true });

  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.user || data.user.id !== conta.id) {
    if (error) console.error("[reenviar]", error.message);
    return NextResponse.json({ ok: true });
  }

  const r = await enviarConfirmacao({
    email, nome: conta.nome, destino,
    hash: data.properties.hashed_token, tipo: data.properties.verification_type,
  });
  if (!r.ok) return NextResponse.json({ erro: erroPublico(r) }, { status: 502 });
  return NextResponse.json({ ok: true });
}
