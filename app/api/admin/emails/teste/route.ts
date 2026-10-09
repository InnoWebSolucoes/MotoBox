import { NextResponse, type NextRequest } from "next/server";
import { EMAIL_VALIDO, emailDoModelo, enviarEmail, lerConfigEmails, urlSite } from "@/lib/email";

/* ============================================================
   MOTOBOX — Email de teste (Definições → Emails)
   Envia o modelo "Email de teste" para o endereço escrito no
   painel, com o remetente e o responder-para gravados. Serve para
   confirmar que o domínio está verificado e que os emails chegam
   (e não caem no spam). Só a equipa chega aqui.
   ============================================================ */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const corpo = (await req.json().catch(() => ({}))) as { para?: unknown };
  const para = typeof corpo.para === "string" ? corpo.para.trim().toLowerCase() : "";
  if (!EMAIL_VALIDO.test(para)) {
    return NextResponse.json({ erro: "Escreva um endereço de email válido." }, { status: 400 });
  }

  const cfg = await lerConfigEmails();
  const quando = new Date().toLocaleString("pt-PT", { timeZone: "Africa/Luanda", dateStyle: "long", timeStyle: "short" });
  const email = emailDoModelo(cfg, "teste", {}, {
    detalhes: [
      ["Remetente", cfg.remetente],
      ["Responder para", cfg.responderPara.join(", ") || "(ninguém)"],
      ["Enviado", `${quando} (hora de Luanda)`],
      ["Site", urlSite()],
    ],
  });
  const r = await enviarEmail({ para, ...email, tipo: "teste" }, cfg);
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: r.estado === 503 ? 503 : 502 });
  return NextResponse.json({ ok: true, id: r.id, para, remetente: cfg.remetente });
}
