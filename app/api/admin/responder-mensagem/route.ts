import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enviarEmail, escapar, lerConfigEmails, primeiroNome } from "@/lib/email";

/* ============================================================
   MOTOBOX — Responder a uma mensagem de contacto por email
   O painel envia o id da mensagem e o texto da resposta. A
   morada de destino e o assunto lêem-se da base de dados, nunca
   do navegador, para que o painel não sirva para enviar emails
   a quem não escreveu. Quem recebe pode responder directamente:
   o "reply-to" é o de Definições → Emails (ou o email da
   MotoBox). O assunto e a assinatura editam-se no mesmo sítio
   (modelo "Resposta a uma mensagem").
   Guardar a resposta na mensagem fica com o painel, pelo caminho
   normal de escrita, depois de o envio ser confirmado.
   ============================================================ */

export const dynamic = "force-dynamic";

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/** Parágrafos separados por linhas em branco; quebras simples mantêm-se. */
const paragrafos = (texto: string) =>
  texto.trim().split(/\n{2,}/).map((p) => `<p style="margin:0 0 12px">${escapar(p).replace(/\n/g, "<br>")}</p>`).join("\n");

export async function POST(req: NextRequest) {
  let corpo: { id?: unknown; resposta?: unknown };
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const id = typeof corpo.id === "string" ? corpo.id : "";
  const resposta = typeof corpo.resposta === "string" ? corpo.resposta.trim() : "";
  if (!id) return erro("Falta a mensagem a responder.");
  if (resposta.length < 2) return erro("Escreva a resposta antes de enviar.");

  const db = supabaseAdmin();
  if (!db) return erro("Base de dados não configurada: não é possível enviar emails.", 503);
  if (!process.env.RESEND_API_KEY) return erro("Falta a variável RESEND_API_KEY no servidor: o email não pode seguir.", 503);

  const [{ data: m, error: erroMensagem }, cfg] = await Promise.all([
    db.from("mensagens").select("nome, email, assunto, mensagem, recebido").eq("id", id).maybeSingle(),
    lerConfigEmails(),
  ]);
  if (erroMensagem) return erro(erroMensagem.message, 500);
  if (!m) return erro("Esta mensagem já não existe. Recarregue a página.", 404);

  const primeiro = primeiroNome(m.nome);
  const assuntoOriginal = String(m.assunto || "A sua mensagem");
  const t = cfg.modelo("resposta", { assunto: assuntoOriginal });
  // "Re: Re: …" não: se o assunto já começa por "Re:", fica como está.
  const assunto = /^re:/i.test(assuntoOriginal) ? assuntoOriginal : (t.assunto || `Re: ${assuntoOriginal}`);
  const assinatura = t.rodape || cfg.nomeSite;
  const original = String(m.mensagem ?? "");

  const html = `<!doctype html>
<html lang="pt-AO"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:560px;margin:0 auto;padding:24px 20px;font-family:Arial,Helvetica,sans-serif;color:#111111;font-size:15px;line-height:1.55">
<p style="margin:0 0 20px;font-weight:700;letter-spacing:1px">MOTOBOX <span style="color:#e10600">ANGOLA</span></p>
<p style="margin:0 0 12px">${escapar(primeiro ? `Olá, ${primeiro}.` : "Olá.")}</p>
${paragrafos(resposta)}
<p style="margin:20px 0 0">${escapar(assinatura).replace(/\n/g, "<br>")}</p>
<hr style="border:none;border-top:1px solid #dddddd;margin:24px 0 12px">
<p style="margin:0 0 6px;font-size:12px;color:#777777">A sua mensagem:</p>
<div style="font-size:13px;color:#555555;border-left:3px solid #dddddd;padding-left:12px">${paragrafos(original)}</div>
</div>
</body></html>`;

  const texto = [
    primeiro ? `Olá, ${primeiro}.` : "Olá.",
    "",
    resposta,
    "",
    assinatura,
    "",
    "-----",
    "A sua mensagem:",
    original,
  ].join("\n");

  const r = await enviarEmail({ para: String(m.email), assunto, html, texto, tipo: "resposta" }, cfg);
  if (!r.ok) return erro(`${r.erro} A resposta ficou por enviar.`, 502);

  return NextResponse.json({ ok: true, enviadoEm: new Date().toISOString(), para: m.email, id: r.id });
}
