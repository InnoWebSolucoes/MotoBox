import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { EMAIL_VALIDO, emailConfigurado } from "@/lib/email";
import { destinoSeguro } from "@/lib/auth/ligacoes";
import { enviarConfirmacao, erroPublico, textosContas } from "@/lib/auth/emails-conta";

/* ============================================================
   MOTOBOX — Criar conta
   A conta nasce no servidor (auth.admin.generateLink) e o email
   de confirmação sai pela Resend, com o texto do painel
   (Definições → Emails → Confirmar a conta). O servidor de email
   do Supabase não entra no registo.

   Quem se registou e não confirmou pode registar-se de novo: a
   ligação volta a seguir e a palavra-passe passa a ser a nova.
   Uma conta já confirmada nunca recebe nada por esta via.
   "Criar conta" desligado nas Definições fecha o registo.
   ============================================================ */

export const dynamic = "force-dynamic";

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/** Conta criada há mais de um minuto: já existia antes deste pedido. */
const jaExistia = (criada?: string) => Boolean(criada) && Date.now() - Date.parse(String(criada)) > 60_000;

export async function POST(req: NextRequest) {
  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const nome = typeof corpo.nome === "string" ? corpo.nome.trim().slice(0, 120) : "";
  const email = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
  const palavra = typeof corpo.palavra === "string" ? corpo.palavra : "";
  const newsletter = corpo.newsletter === true;
  const destino = destinoSeguro(corpo.destino);

  if (nome.length < 2) return erro("Indique o seu nome.");
  if (!EMAIL_VALIDO.test(email)) return erro("Endereço de email inválido.");
  if (palavra.length < 8) return erro("A palavra-passe tem de ter pelo menos 8 caracteres.");

  const textos = (await textosContas()).mensagens;
  const db = supabaseAdmin();
  if (!db) return erro(textos.servicoIndisponivel, 503);

  const { data: def } = await db.from("definicoes").select("registos_abertos").eq("id", 1).maybeSingle();
  if (def && def.registos_abertos === false) return erro(textos.registosFechados, 403);

  // Sem envio de emails, a conta ficaria por confirmar para sempre.
  if (!emailConfigurado()) {
    console.error("[registar] RESEND_API_KEY em falta: o registo não pode enviar a confirmação.");
    return erro(`${textos.servicoIndisponivel} O envio de emails não está configurado.`, 503);
  }

  let hash: string;
  let tipo: string;

  const novo = await db.auth.admin.generateLink({
    type: "signup", email, password: palavra,
    options: { data: { nome, newsletter } },
  });

  if (!novo.error) {
    hash = novo.data.properties.hashed_token;
    tipo = novo.data.properties.verification_type;
    // Conta por confirmar que já existia: o Supabase devolve a ligação, mas
    // não troca a palavra-passe. Sem isto, a pessoa confirmava e não entrava.
    const u = novo.data.user;
    if (u && !u.email_confirmed_at && jaExistia(u.created_at)) {
      await db.auth.admin.updateUserById(u.id, {
        password: palavra,
        user_metadata: { ...u.user_metadata, nome, newsletter },
      });
    }
  } else if (novo.error.code === "email_exists" || /already|registered|exists/i.test(novo.error.message)) {
    // Já existe: só se reenvia a confirmação a quem ainda não confirmou.
    // (O "magiclink" de uma conta existente não cria nada.)
    const existente = await db.auth.admin.generateLink({ type: "magiclink", email });
    if (existente.error) {
      console.error("[registar] magiclink:", existente.error.message);
      return erro("Não foi possível criar a conta. Tente de novo.", 500);
    }
    const u = existente.data.user;
    if (u.email_confirmed_at) return erro(textos.contaExiste, 409);
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

  const r = await enviarConfirmacao({ email, nome, hash, tipo, destino });
  if (!r.ok) {
    console.error(`[registar] confirmação para ${email} não seguiu: ${r.erro}`);
    return erro(`${textos.emailNaoSeguiu} ${erroPublico(r)}`, 502);
  }

  return NextResponse.json({ ok: true });
}
