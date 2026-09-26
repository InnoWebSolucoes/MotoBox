import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/* ============================================================
   MOTOBOX — Formulário de contacto
   Guarda a mensagem na tabela `mensagens`, que a equipa lê e
   responde em Mensagens no painel. A resposta segue depois por
   email para quem escreveu.
   ============================================================ */

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

export async function POST(req: NextRequest) {
  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  // Campo escondido: só um robô o preenche. Finge que correu bem.
  if (texto(corpo.site, 200)) return NextResponse.json({ ok: true });

  const nome = texto(corpo.nome, 120);
  const email = texto(corpo.email, 200).toLowerCase();
  const telefone = texto(corpo.telefone, 40);
  const organizacao = texto(corpo.organizacao, 120);
  const assunto = texto(corpo.assunto, 120) || "Contacto pelo site";
  const mensagem = texto(corpo.mensagem, 5000);

  if (nome.length < 3) return erro("Indique o seu nome.");
  if (!EMAIL.test(email)) return erro("Email inválido.");
  if (mensagem.length < 10) return erro("Escreva a sua mensagem (mín. 10 caracteres).");

  const db = supabaseAdmin();
  if (!db) return erro("De momento não é possível enviar mensagens. Use o email ou o WhatsApp.", 503);

  const { error } = await db.from("mensagens").insert({
    id: `m-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    nome,
    email,
    telefone: telefone || null,
    assunto,
    mensagem: organizacao ? `${mensagem}\n\nOrganização: ${organizacao}` : mensagem,
  });
  if (error) {
    console.error("[contacto]", error.message);
    return erro("Não foi possível enviar a mensagem. Tente de novo ou use o email.", 500);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
