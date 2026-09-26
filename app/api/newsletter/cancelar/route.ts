import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { filtroEmail, normalizarEmail, tokenValido } from "@/lib/newsletter";

/* ============================================================
   MOTOBOX — Cancelar a newsletter
   GET  ?email&token → desactiva e leva à página de confirmação.
   POST ?email&token → cancelamento de um clique (RFC 8058), o
        pedido que o Gmail e o Outlook fazem a partir do
        cabeçalho List-Unsubscribe.

   O token é um HMAC do email (ver lib/newsletter.ts): sem ele
   ninguém consegue cancelar a subscrição de outra pessoa.
   ============================================================ */

export const dynamic = "force-dynamic";

type Estado = "ok" | "invalido" | "erro";

function lerParametros(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  return { email: normalizarEmail(p.get("email")), token: p.get("token") ?? "" };
}

async function cancelar(email: string, token: string): Promise<Estado> {
  if (!email || !tokenValido(email, token)) return "invalido";
  const db = supabaseAdmin();
  if (!db) return "erro";

  const { op, valor } = filtroEmail(email);
  const q = db.from("subscritores").update({ ativo: false });
  const { error } = await (op === "eq" ? q.eq("email", valor) : q.ilike("email", valor));
  if (error) {
    console.error("[newsletter] falha ao cancelar subscrição:", error.message);
    return "erro";
  }
  // Um email que já não está na lista também conta como cancelado.
  return "ok";
}

export async function GET(req: NextRequest) {
  const { email, token } = lerParametros(req);
  const estado = await cancelar(email, token);

  const destino = req.nextUrl.clone();
  destino.pathname = "/newsletter/cancelada";
  destino.search = "";
  destino.searchParams.set("estado", estado);
  if (estado !== "invalido") destino.searchParams.set("email", email);
  // Com erro, a página oferece "tentar de novo" com o mesmo token.
  if (estado === "erro") destino.searchParams.set("token", token);
  return NextResponse.redirect(destino, 303);
}

export async function POST(req: NextRequest) {
  const { email, token } = lerParametros(req);
  const estado = await cancelar(email, token);
  const codigo = estado === "ok" ? 200 : estado === "invalido" ? 400 : 500;
  return NextResponse.json({ estado }, { status: codigo });
}
