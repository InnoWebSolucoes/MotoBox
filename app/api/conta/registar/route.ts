import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enviarEmailUnico, modeloSimples } from "@/lib/email";
import { destinoSeguro, ligacaoConfirmacao } from "@/lib/auth/ligacoes";

/* ============================================================
   MOTOBOX — Criar conta
   A conta nasce no servidor e o email de confirmação sai pela
   Resend, com o texto da Motobox. O servidor de email do Supabase
   (3 mensagens por hora, e que não chegava ao Gmail) deixa de
   entrar no registo.

   Quem se registou e não confirmou pode registar-se de novo: a
   ligação volta a seguir e a palavra-passe passa a ser a nova.
   Uma conta já confirmada nunca recebe nada por esta via.
   ============================================================ */

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

export async function POST(req: NextRequest) {
  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const nome = typeof corpo.nome === "string" ? corpo.nome.trim().slice(0, 120) : "";
  const email = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
  const palavra = typeof corpo.palavra === "string" ? corpo.palavra : "";
  const newsletter = corpo.newsletter === true;
  const destino = destinoSeguro(corpo.destino);

  if (nome.length < 2) return erro("Indique o seu nome.");
  if (!EMAIL.test(email)) return erro("Endereço de email inválido.");
  if (palavra.length < 8) return erro("A palavra-passe tem de ter pelo menos 8 caracteres.");

  const db = supabaseAdmin();
  if (!db) return erro("O registo não está disponível de momento.", 503);

  const { data: def } = await db.from("definicoes").select("registos_abertos").eq("id", 1).maybeSingle();
  if (def && def.registos_abertos === false) return erro("Os registos estão fechados de momento.", 403);

  let hash: string;
  let tipo: string;

  const novo = await db.auth.admin.generateLink({
    type: "signup", email, password: palavra,
    options: { data: { nome, newsletter } },
  });

  if (!novo.error) {
    hash = novo.data.properties.hashed_token;
    tipo = novo.data.properties.verification_type;
  } else if (novo.error.code === "email_exists" || /already|registered|exists/i.test(novo.error.message)) {
    // Já existe: só se reenvia a confirmação a quem ainda não confirmou.
    const existente = await db.auth.admin.generateLink({ type: "magiclink", email });
    if (existente.error) return erro("Não foi possível criar a conta. Tente de novo.", 500);
    const u = existente.data.user;
    if (u.email_confirmed_at) {
      return erro("Já existe uma conta com este email. Entre, ou use «Esqueceu-se da palavra-passe?».", 409);
    }
    await db.auth.admin.updateUserById(u.id, {
      password: palavra,
      user_metadata: { ...u.user_metadata, nome, newsletter },
    });
    hash = existente.data.properties.hashed_token;
    tipo = existente.data.properties.verification_type;
  } else if (/password/i.test(novo.error.message)) {
    return erro("Escolha uma palavra-passe mais forte (pelo menos 8 caracteres, com letras e números).");
  } else {
    console.error("[registar]", novo.error.message);
    return erro("Não foi possível criar a conta. Tente de novo.", 500);
  }

  const primeiro = nome.split(/\s+/)[0];
  const { html, texto } = modeloSimples({
    titulo: "Confirme a sua conta Motobox",
    paragrafos: [
      `Olá, ${primeiro}.`,
      "Falta só um passo: confirme o seu email para activar a conta. Depois disso fica com sessão iniciada.",
      "A ligação é válida durante 24 horas.",
    ],
    botao: { texto: "Confirmar o meu email", url: ligacaoConfirmacao(hash, tipo, destino) },
    rodape: "Se não foi você que criou esta conta, ignore esta mensagem: sem confirmação, a conta não fica activa.",
  });

  const falha = await enviarEmailUnico({ para: email, assunto: "Confirme a sua conta Motobox", html, texto });
  if (falha) return erro(`A conta foi criada, mas o email de confirmação não seguiu. ${falha}`, 502);

  return NextResponse.json({ ok: true });
}
