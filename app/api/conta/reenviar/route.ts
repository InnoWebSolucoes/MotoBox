import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enviarEmailUnico, modeloSimples } from "@/lib/email";
import { destinoSeguro, ligacaoConfirmacao } from "@/lib/auth/ligacoes";

/* ============================================================
   MOTOBOX — Reenviar a confirmação de conta
   Para quem tenta entrar sem ter confirmado o email. Só segue
   para contas por confirmar; a resposta é a mesma em todos os
   casos, para não revelar que emails estão registados.
   ============================================================ */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 }); }
  const email = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
  const destino = destinoSeguro(corpo.destino);

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ erro: "Indisponível de momento." }, { status: 503 });

  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.user || data.user.email_confirmed_at) return NextResponse.json({ ok: true });

  const nome = typeof data.user.user_metadata?.nome === "string" ? data.user.user_metadata.nome.split(/\s+/)[0] : "";
  const { html, texto } = modeloSimples({
    titulo: "Confirme a sua conta Motobox",
    paragrafos: [
      nome ? `Olá, ${nome}.` : "Olá.",
      "Aqui está de novo a ligação para confirmar o seu email e activar a conta.",
    ],
    botao: {
      texto: "Confirmar o meu email",
      url: ligacaoConfirmacao(data.properties.hashed_token, data.properties.verification_type, destino),
    },
    rodape: "Se não foi você que criou esta conta, ignore esta mensagem.",
  });
  const falha = await enviarEmailUnico({ para: email, assunto: "Confirme a sua conta Motobox", html, texto });
  if (falha) return NextResponse.json({ erro: falha }, { status: 502 });
  return NextResponse.json({ ok: true });
}
