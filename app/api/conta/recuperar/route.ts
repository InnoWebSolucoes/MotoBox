import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enviarEmailUnico, modeloSimples } from "@/lib/email";
import { ligacaoConfirmacao } from "@/lib/auth/ligacoes";

/* ============================================================
   MOTOBOX — Recuperar a palavra-passe
   A ligação sai pela Resend e leva a /nova-palavra-passe já com
   sessão. A resposta é igual exista ou não a conta, para que o
   formulário não sirva para descobrir quem está registado.
   ============================================================ */

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 }); }
  const email = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email)) return NextResponse.json({ erro: "Endereço de email inválido." }, { status: 400 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ erro: "A recuperação não está disponível de momento." }, { status: 503 });

  const { data, error } = await db.auth.admin.generateLink({ type: "recovery", email });
  // Conta inexistente: responde-se como se tivesse seguido.
  if (error || !data?.properties) return NextResponse.json({ ok: true });

  const { html, texto } = modeloSimples({
    titulo: "Definir uma nova palavra-passe",
    paragrafos: [
      "Recebemos um pedido para mudar a palavra-passe da sua conta Motobox.",
      "Carregue no botão e escolha uma nova. A ligação é válida durante 1 hora.",
    ],
    botao: {
      texto: "Escolher nova palavra-passe",
      url: ligacaoConfirmacao(data.properties.hashed_token, data.properties.verification_type, "/nova-palavra-passe"),
    },
    rodape: "Se não pediu esta mudança, ignore esta mensagem: a palavra-passe actual continua a valer.",
  });

  const falha = await enviarEmailUnico({ para: email, assunto: "Nova palavra-passe Motobox", html, texto });
  if (falha) return NextResponse.json({ erro: falha }, { status: 502 });
  return NextResponse.json({ ok: true });
}
