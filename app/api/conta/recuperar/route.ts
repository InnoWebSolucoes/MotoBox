import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { EMAIL_VALIDO } from "@/lib/email";
import { enviarRecuperacao, erroPublico } from "@/lib/auth/emails-conta";

/* ============================================================
   MOTOBOX — Recuperar a palavra-passe
   A ligação nasce no Supabase (generateLink "recovery", que não
   cria contas) e sai pela Resend, com o texto do painel. Leva a
   /nova-palavra-passe já com sessão; numa conta por confirmar,
   abrir a ligação também a confirma. A resposta é igual exista ou
   não a conta, para que o formulário não sirva para descobrir quem
   está registado.
   ============================================================ */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 }); }
  const email = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
  if (!EMAIL_VALIDO.test(email)) return NextResponse.json({ erro: "Endereço de email inválido." }, { status: 400 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ erro: "A recuperação não está disponível de momento." }, { status: 503 });

  const { data, error } = await db.auth.admin.generateLink({ type: "recovery", email });
  // Conta inexistente: responde-se como se tivesse seguido.
  if (error || !data?.properties) {
    if (error && !/not.?found/i.test(`${error.code} ${error.message}`)) console.error("[recuperar]", error.message);
    return NextResponse.json({ ok: true });
  }

  const r = await enviarRecuperacao({
    email, hash: data.properties.hashed_token, tipo: data.properties.verification_type,
  });
  if (!r.ok) return NextResponse.json({ erro: erroPublico(r) }, { status: 502 });
  return NextResponse.json({ ok: true });
}
