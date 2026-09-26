import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/* ============================================================
   MOTOBOX — Responder a uma mensagem de contacto por email
   O painel envia o id da mensagem e o texto da resposta. A
   morada de destino e o assunto lêem-se da base de dados, nunca
   do navegador, para que o painel não sirva para enviar emails
   a quem não escreveu. Quem recebe pode responder directamente:
   o "reply-to" é o email de contacto das Definições.
   Guardar a resposta na mensagem fica com o painel, pelo caminho
   normal de escrita, depois de o envio ser confirmado.
   ============================================================ */

export const dynamic = "force-dynamic";

const RESEND = "https://api.resend.com/emails";

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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

  const chave = process.env.RESEND_API_KEY;
  if (!chave) return erro("Falta a variável RESEND_API_KEY no servidor: o email não pode seguir.", 503);

  const [{ data: m, error: erroMensagem }, { data: def }] = await Promise.all([
    db.from("mensagens").select("nome, email, assunto, mensagem, recebido").eq("id", id).maybeSingle(),
    db.from("definicoes").select("nome_site, email_contacto").eq("id", 1).maybeSingle(),
  ]);
  if (erroMensagem) return erro(erroMensagem.message, 500);
  if (!m) return erro("Esta mensagem já não existe. Recarregue a página.", 404);

  const nomeSite = (def?.nome_site as string) || "Motobox Angola";
  const responderPara = (def?.email_contacto as string) || undefined;
  const primeiroNome = String(m.nome ?? "").trim().split(/\s+/)[0] ?? "";
  const assunto = /^re:/i.test(String(m.assunto)) ? String(m.assunto) : `Re: ${m.assunto || "A sua mensagem"}`;
  const original = String(m.mensagem ?? "");

  const html = `<!doctype html>
<html lang="pt-AO"><body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:560px;margin:0 auto;padding:24px 20px;font-family:Arial,Helvetica,sans-serif;color:#111111;font-size:15px;line-height:1.55">
<p style="margin:0 0 20px;font-weight:700;letter-spacing:1px">MOTOBOX ANGOLA</p>
<p style="margin:0 0 12px">${escapar(primeiroNome ? `Olá, ${primeiroNome}.` : "Olá.")}</p>
${paragrafos(resposta)}
<p style="margin:20px 0 0">${escapar(nomeSite)}</p>
<hr style="border:none;border-top:1px solid #dddddd;margin:24px 0 12px">
<p style="margin:0 0 6px;font-size:12px;color:#777777">A sua mensagem:</p>
<div style="font-size:13px;color:#555555;border-left:3px solid #dddddd;padding-left:12px">${paragrafos(original)}</div>
</div>
</body></html>`;

  const texto = [
    primeiroNome ? `Olá, ${primeiroNome}.` : "Olá.",
    "",
    resposta,
    "",
    nomeSite,
    "",
    "-----",
    "A sua mensagem:",
    original,
  ].join("\n");

  let r: Response;
  try {
    r = await fetch(RESEND, {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "Motobox Angola <onboarding@resend.dev>",
        to: [m.email],
        subject: assunto,
        html,
        text: texto,
        ...(responderPara ? { reply_to: responderPara } : {}),
      }),
    });
  } catch {
    return erro("Não foi possível contactar o serviço de email. Tente de novo.", 502);
  }

  if (!r.ok) {
    const detalhe = await r.text().catch(() => "");
    console.error(`[responder-mensagem] Resend ${r.status}: ${detalhe}`);
    // Sem domínio verificado, a Resend só entrega na caixa da própria conta.
    if (r.status === 403) {
      return erro(
        "O email não seguiu: o serviço de envio ainda não tem um domínio verificado e só entrega em motoboxweb@gmail.com. A resposta ficou por enviar.",
        502,
      );
    }
    return erro(`O serviço de email recusou o envio (${r.status}). Tente de novo.`, 502);
  }

  return NextResponse.json({ ok: true, enviadoEm: new Date().toISOString(), para: m.email });
}
