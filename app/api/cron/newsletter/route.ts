import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { enviarNewsletterSemanal } from "@/lib/newsletter";

/* ============================================================
   MOTOBOX — Envio semanal automático da newsletter
   Chamado pelo Vercel Cron (ver vercel.json) às segundas-feiras,
   08:00 UTC (09:00 em Luanda). A Vercel envia
   `Authorization: Bearer <CRON_SECRET>`; sem esse segredo
   configurado a rota recusa tudo, para que ninguém de fora
   dispare envios.

   `?forcar=1` ignora a trava de 6 dias (também exige o segredo).
   ============================================================ */

export const dynamic = "force-dynamic";
/** Tempo para ler a base e enviar os lotes à Resend. */
export const maxDuration = 60;

function autorizado(req: NextRequest): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;
  const recebido = Buffer.from(req.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${segredo}`);
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const forcar = req.nextUrl.searchParams.get("forcar") === "1";
  const resultado = await enviarNewsletterSemanal({ automatico: true, forcar });
  console.info(`[cron/newsletter] ${resultado.estado}: ${resultado.mensagem}`);
  return NextResponse.json(resultado, { status: resultado.estado === "erro" ? 500 : 200 });
}
