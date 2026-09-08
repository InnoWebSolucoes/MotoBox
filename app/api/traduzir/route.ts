import { NextResponse, type NextRequest } from "next/server";
import { traduzirLote, traducaoAutomaticaActiva } from "@/lib/i18n/traduzir";

/* ============================================================
   MOTOBOX — Tradução de conteúdo a pedido
   O cliente envia os textos que precisa em inglês; a resposta
   vem do cache sempre que possível.

   Sem fornecedor configurado devolve os originais, para o site
   continuar a funcionar em português.
   ============================================================ */

export const dynamic = "force-dynamic";

/** Limite por pedido, para não estourar as quotas do fornecedor. */
const MAX_TEXTOS = 200;
const MAX_CARACTERES = 40_000;

export async function POST(req: NextRequest) {
  let corpo: { textos?: unknown; idioma?: string };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const textos = Array.isArray(corpo.textos)
    ? corpo.textos.filter((t): t is string => typeof t === "string")
    : null;

  if (!textos) {
    return NextResponse.json({ erro: "Falta a lista `textos`." }, { status: 400 });
  }
  if (textos.length > MAX_TEXTOS) {
    return NextResponse.json(
      { erro: `Máximo de ${MAX_TEXTOS} textos por pedido.` },
      { status: 413 },
    );
  }
  if (textos.reduce((s, t) => s + t.length, 0) > MAX_CARACTERES) {
    return NextResponse.json(
      { erro: `Máximo de ${MAX_CARACTERES} caracteres por pedido.` },
      { status: 413 },
    );
  }

  const idioma = corpo.idioma === "en" ? "en" : "en";

  // Português é a língua de origem: devolve tal e qual.
  if (corpo.idioma === "pt") {
    return NextResponse.json({ textos, activo: traducaoAutomaticaActiva });
  }

  const traduzidos = await traduzirLote(textos, idioma);

  return NextResponse.json({
    textos: traduzidos,
    activo: traducaoAutomaticaActiva,
  });
}

export async function GET() {
  return NextResponse.json({ activo: traducaoAutomaticaActiva });
}
