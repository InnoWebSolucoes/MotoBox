import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual, perfilDe } from "@/lib/conta/sessao";
import {
  CATEGORIAS_IMPORTACAO, MENSAGENS_ERRO, validarPedido,
} from "@/app/marketplace/importar/opcoes";

/* ============================================================
   MOTOBOX — Pedido de importação (Marketplace → Importar)
   Só com sessão. O pedido entra em `mensagens`, como o contacto,
   com o assunto "Pedido de importação: …" e todos os detalhes no
   corpo: a equipa lê-o e responde por email em Mensagens, no
   painel. Nada é cobrado nem prometido aqui: a resposta é um
   orçamento feito à mão.
   ============================================================ */

export const dynamic = "force-dynamic";

function erro(mensagem: string, codigo = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ erro: mensagem, ...extra }, { status: codigo });
}

export async function POST(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Entre na sua conta para pedir uma importação.", 401);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }
  if (!corpo || typeof corpo !== "object") return erro("Pedido inválido.");

  // Campo escondido: só um robô o preenche. Finge que correu bem.
  if (typeof corpo.site === "string" && corpo.site.trim()) return NextResponse.json({ ok: true });

  const { pedido, erros } = validarPedido(corpo);
  const campos = Object.keys(erros);
  if (campos.length > 0) {
    const primeiro = erros[campos[0] as keyof typeof erros]!;
    return erro(MENSAGENS_ERRO[primeiro].pt, 400, { campos });
  }

  const db = supabaseAdmin();
  if (!db) return erro("De momento não é possível enviar pedidos. Use o contacto por email ou WhatsApp.", 503);

  const perfil = await perfilDe(user);
  if (perfil && ["suspenso", "banido"].includes(perfil.estado)) {
    return erro("A sua conta não pode fazer pedidos. Fale com a equipa Motobox.", 403);
  }

  const categoria = CATEGORIAS_IMPORTACAO.find((c) => c.id === pedido.categoria)?.pt ?? pedido.categoria;
  const id = `m-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const mensagem = [
    "Pedido de importação feito no site (Marketplace, Importar do estrangeiro).",
    "",
    `O que é: ${pedido.titulo}`,
    `Tipo: ${categoria}`,
    `Quantidade: ${pedido.quantidade}`,
    `Ligação: ${pedido.ligacao}`,
    `Província de entrega: ${pedido.provincia}`,
    "",
    "Notas:",
    pedido.notas || "(sem notas)",
    "",
    `Contacto: ${pedido.nome} · ${pedido.email} · ${pedido.telefone || "sem telefone"}`,
    `Conta Motobox: ${user.email ?? "sem email"} (${user.id})`,
  ].join("\n");

  const { error } = await db.from("mensagens").insert({
    id,
    nome: pedido.nome,
    email: pedido.email,
    telefone: pedido.telefone || null,
    assunto: `Pedido de importação: ${pedido.titulo}`.slice(0, 200),
    mensagem,
  });
  if (error) {
    console.error("[importacao]", error.message);
    return erro("Não foi possível enviar o pedido. Tente de novo dentro de momentos.", 500);
  }

  return NextResponse.json({ ok: true, referencia: id }, { status: 201 });
}
