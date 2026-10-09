import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  EMAIL_VALIDO, avisarEquipa, emailConfigurado, emailDoModelo, enviarEmail, lerConfigEmails, primeiroNome, urlSite,
} from "@/lib/email";

/* ============================================================
   MOTOBOX — Formulário de contacto (e "Tem um clube?")
   1. Guarda a mensagem na tabela `mensagens` (Mensagens, no painel).
   2. Avisa a equipa por email, com "responder para" quem escreveu:
      a equipa responde directamente do seu email. O endereço da
      equipa é o de Definições → Emails (contacto, ou clubes para
      os pedidos de clube), ou o email da MotoBox.
   3. Com os recibos ligados, confirma a quem escreveu que a
      mensagem chegou (sem repetir o que escreveu).
   Chegou à equipa se ficou guardada OU se o email seguiu; só
   falha quando nenhuma das duas coisas aconteceu.
   ============================================================ */

export const dynamic = "force-dynamic";

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** O formulário de clubes (app/clubes/JuntarClube.tsx) usa este assunto. */
const ASSUNTO_CLUBE = "Registar um clube";

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
  const eClube = assunto === ASSUNTO_CLUBE;

  if (nome.length < 3) return erro("Indique o seu nome.");
  if (!EMAIL_VALIDO.test(email)) return erro("Email inválido.");
  if (mensagem.length < 10) return erro("Escreva a sua mensagem (mín. 10 caracteres).");

  const db = supabaseAdmin();
  if (!db && !emailConfigurado()) {
    return erro("De momento não é possível enviar mensagens. Use o email ou o WhatsApp.", 503);
  }

  /* ---------- 1. Guardar em Mensagens ---------- */
  const corpoGuardado = organizacao && !eClube ? `${mensagem}\n\nOrganização: ${organizacao}` : mensagem;
  let guardada = false;
  if (db) {
    const { error } = await db.from("mensagens").insert({
      id: `m-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      nome,
      email,
      telefone: telefone || null,
      assunto: eClube && organizacao ? `${ASSUNTO_CLUBE}: ${organizacao}`.slice(0, 200) : assunto,
      mensagem: corpoGuardado,
    });
    if (error) console.error("[contacto]", error.message);
    else guardada = true;
  }

  /* ---------- 2. Avisar a equipa ---------- */
  const cfg = await lerConfigEmails();
  const painel = `${urlSite()}/admin/mensagens`;
  const detalhes: [string, string][] = [
    ["Nome", nome],
    ["Email", email],
    ...(telefone ? [["Telefone", telefone] as [string, string]] : []),
    ...(organizacao && !eClube ? [["Organização", organizacao] as [string, string]] : []),
  ];
  const paraEquipa = eClube
    ? emailDoModelo(cfg, "clubeEquipa", { clube: organizacao || "Um clube", nome, email }, {
        url: painel, detalhes, citacao: { rotulo: "O pedido:", texto: mensagem },
      })
    : emailDoModelo(cfg, "contactoEquipa", { nome, email, assunto }, {
        url: painel, detalhes, citacao: { rotulo: `Assunto: ${assunto}`, texto: mensagem },
      });
  const falhaEquipa = await avisarEquipa(cfg, eClube ? "clubes" : "contacto", {
    ...paraEquipa, responderPara: email, tipo: eClube ? "clubeEquipa" : "contactoEquipa",
  });
  if (falhaEquipa) console.error(`[contacto] aviso à equipa não seguiu: ${falhaEquipa}`);

  if (!guardada && falhaEquipa) {
    return erro("Não foi possível enviar a mensagem. Tente de novo ou use o email.", 502);
  }

  /* ---------- 3. Recibo a quem escreveu ---------- */
  let recibo = false;
  if (cfg.conteudo.recibos && emailConfigurado()) {
    const r = eClube
      ? emailDoModelo(cfg, "clubeRecibo", { nome: primeiroNome(nome), clube: organizacao || "clube" })
      : emailDoModelo(cfg, "contactoRecibo", { nome: primeiroNome(nome) });
    const enviado = await enviarEmail({ para: email, ...r, tipo: eClube ? "clubeRecibo" : "contactoRecibo" }, cfg);
    recibo = enviado.ok;
    if (!enviado.ok) console.error(`[contacto] recibo para ${email} não seguiu: ${enviado.erro}`);
  }

  return NextResponse.json({ ok: true, guardada, equipaAvisada: !falhaEquipa, recibo }, { status: 201 });
}
