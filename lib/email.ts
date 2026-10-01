import "server-only";
import { urlPublica } from "@/lib/base";

/* ============================================================
   MOTOBOX — Emails de uma só mensagem
   Confirmação de conta, recuperação de palavra-passe, resposta a
   uma mensagem de contacto. Enviados pela API da Resend, com o
   remetente de RESEND_FROM. Os envios em massa (avisos e
   newsletter) estão em lib/notificacoes.ts.
   ============================================================ */

const RESEND = "https://api.resend.com/emails";

export interface EmailUnico {
  para: string;
  assunto: string;
  html: string;
  texto: string;
  responderPara?: string;
}

/** `null` quando a Resend aceitou; senão a frase a mostrar a quem pediu. */
export async function enviarEmailUnico(e: EmailUnico): Promise<string | null> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return "O envio de emails não está configurado (falta RESEND_API_KEY).";

  let r: Response;
  try {
    r = await fetch(RESEND, {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "MotoBox Angola <onboarding@resend.dev>",
        to: [e.para],
        subject: e.assunto,
        html: e.html,
        text: e.texto,
        ...(e.responderPara ? { reply_to: e.responderPara } : {}),
      }),
    });
  } catch {
    return "Não foi possível contactar o serviço de email. Tente de novo.";
  }
  if (r.ok) return null;

  console.error(`[email] Resend ${r.status}: ${await r.text().catch(() => "")}`);
  // Sem domínio verificado, a Resend só entrega na caixa da própria conta.
  if (r.status === 403) {
    return "O email não seguiu: o serviço de envio ainda não tem um domínio verificado. Fale com a equipa MotoBox.";
  }
  return `O serviço de email recusou o envio (${r.status}). Tente de novo.`;
}

export const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Endereço público do site para as ligações dos emails (nunca localhost). */
export function urlSite(): string {
  // O site vive em innoweb.agency/motobox: ver lib/base.ts.
  return urlPublica();
}

/** Mensagem curta com a marca, um título, parágrafos e um botão. */
export function modeloSimples(c: {
  titulo: string;
  paragrafos: string[];
  botao?: { texto: string; url: string };
  rodape?: string;
}): { html: string; texto: string } {
  const botao = c.botao
    ? `<p style="margin:24px 0"><a href="${escapar(c.botao.url)}" style="display:inline-block;background:#e10600;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700">${escapar(c.botao.texto)}</a></p>`
    : "";
  const html = `<!doctype html>
<html lang="pt-AO"><body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:560px;margin:0 auto;padding:24px 20px;font-family:Arial,Helvetica,sans-serif;color:#111111;font-size:15px;line-height:1.55">
<p style="margin:0 0 20px;font-weight:700;letter-spacing:1px">MOTOBOX <span style="color:#e10600">ANGOLA</span></p>
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3">${escapar(c.titulo)}</h1>
${c.paragrafos.map((p) => `<p style="margin:0 0 12px">${escapar(p)}</p>`).join("\n")}
${botao}
${c.botao ? `<p style="margin:0 0 12px;font-size:12px;color:#777777">Se o botão não funcionar, copie esta ligação para o navegador:<br><span style="word-break:break-all">${escapar(c.botao.url)}</span></p>` : ""}
${c.rodape ? `<hr style="border:none;border-top:1px solid #dddddd;margin:24px 0 12px"><p style="margin:0;font-size:12px;color:#777777">${escapar(c.rodape)}</p>` : ""}
</div>
</body></html>`;
  const texto = [
    c.titulo, "", ...c.paragrafos, "",
    ...(c.botao ? [`${c.botao.texto}: ${c.botao.url}`, ""] : []),
    ...(c.rodape ? [c.rodape] : []),
  ].join("\n");
  return { html, texto };
}
