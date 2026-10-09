import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual, perfilDe } from "@/lib/conta/sessao";
import {
  avisarEquipa, emailConfigurado, emailDoModelo, enviarEmail, lerConfigEmails, primeiroNome, urlSite,
} from "@/lib/email";
import {
  CATEGORIAS_IMPORTACAO, MENSAGENS_ERRO, validarPedido,
} from "@/app/marketplace/importar/opcoes";

/* ============================================================
   MOTOBOX — Pedido de importação (Marketplace → Importar)
   Só com sessão. O pedido entra em `mensagens`, como o contacto,
   com o assunto "Pedido de importação: …" e todos os detalhes no
   corpo: a equipa lê-o e responde por email em Mensagens, no
   painel. Segue também um email para a equipa (Definições →
   Emails → Pedidos de importação), com "responder para" quem
   pediu, e um recibo para quem pediu (se os recibos estiverem
   ligados). Nada é cobrado nem prometido aqui: a resposta é um
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
  /* ---------- Email para a equipa (e recibo para quem pediu) ---------- */
  const cfg = await lerConfigEmails();
  const paraEquipa = emailDoModelo(cfg, "importacaoEquipa", { titulo: pedido.titulo, nome: pedido.nome, email: pedido.email }, {
    url: `${urlSite()}/admin/mensagens`,
    detalhes: [
      ["O que é", pedido.titulo],
      ["Tipo", categoria],
      ["Quantidade", String(pedido.quantidade)],
      ["Ligação", pedido.ligacao],
      ["Entrega em", pedido.provincia],
      ["Contacto", [pedido.nome, pedido.email, pedido.telefone].filter(Boolean).join(" · ")],
      ["Referência", id],
    ],
    citacao: pedido.notas ? { rotulo: "Notas:", texto: pedido.notas } : undefined,
  });
  const falhaEquipa = await avisarEquipa(cfg, "importacao", { ...paraEquipa, responderPara: pedido.email, tipo: "importacaoEquipa" });
  if (falhaEquipa) console.error(`[importacao] aviso à equipa não seguiu: ${falhaEquipa}`);

  if (error) {
    console.error("[importacao]", error.message);
    // Sem registo e sem email, o pedido perdia-se: só aí se diz que falhou.
    if (falhaEquipa) return erro("Não foi possível enviar o pedido. Tente de novo dentro de momentos.", 500);
  }

  let recibo = false;
  if (cfg.conteudo.recibos && emailConfigurado()) {
    const r = emailDoModelo(cfg, "importacaoRecibo", { nome: primeiroNome(pedido.nome), titulo: pedido.titulo, referencia: id });
    const enviado = await enviarEmail({ para: pedido.email, ...r, tipo: "importacaoRecibo" }, cfg);
    recibo = enviado.ok;
    if (!enviado.ok) console.error(`[importacao] recibo para ${pedido.email} não seguiu: ${enviado.erro}`);
  }

  return NextResponse.json({ ok: true, referencia: id, equipaAvisada: !falhaEquipa, recibo }, { status: 201 });
}
