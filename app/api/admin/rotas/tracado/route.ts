import { NextResponse, type NextRequest } from "next/server";
import { ErroCalculo, calcularTracado } from "@/lib/rotas-calculo";
import { assinaturaParagens, coordValida } from "@/lib/rotas-tipos";

/* ============================================================
   MOTOBOX — Recalcular o traçado de uma rota (painel de gestão)
   O acesso é verificado no proxy: só a equipa chega aqui.

   POST { paragens: [{ lat, lng }, …] }
     → { pernas: [{ km, min }], altitudes, altimetria, tracado,
         tracadoDe, km, aviso? }

   Uma perna por cada par de paragens seguidas, com a distância e o
   tempo de carro do OSRM; as altitudes do SRTM (OpenTopoData); o
   traçado em polilinha, para o GPX. Nada é gravado aqui: o editor
   junta o resultado à rota e quem edita grava.
   ============================================================ */

export const dynamic = "force-dynamic";
// O serviço de altitudes aceita um pedido por segundo: uma rota longa leva alguns segundos.
export const maxDuration = 60;

const MAX_PARAGENS = 40;

export async function POST(req: NextRequest) {
  let corpo: { paragens?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }
  const lista = Array.isArray(corpo.paragens) ? corpo.paragens : [];
  if (lista.length < 2) {
    return NextResponse.json({ erro: "São precisas pelo menos duas paragens com coordenadas." }, { status: 400 });
  }
  if (lista.length > MAX_PARAGENS) {
    return NextResponse.json({ erro: `No máximo ${MAX_PARAGENS} paragens por rota.` }, { status: 400 });
  }
  const invalida = lista.findIndex((p) => !coordValida(p as { lat?: unknown; lng?: unknown }));
  if (invalida >= 0) {
    return NextResponse.json({ erro: `A paragem ${invalida + 1} não tem coordenadas válidas.` }, { status: 400 });
  }
  const paragens = (lista as { lat: number; lng: number }[]).map((p) => ({ lat: p.lat, lng: p.lng }));

  try {
    const r = await calcularTracado(paragens);
    return NextResponse.json({ ...r, tracadoDe: assinaturaParagens(paragens) });
  } catch (e) {
    const mensagem = e instanceof ErroCalculo ? e.message : "Falha ao calcular o traçado. Tente outra vez.";
    if (!(e instanceof ErroCalculo)) console.error("[rotas] Falha ao calcular o traçado:", e);
    return NextResponse.json({ erro: mensagem }, { status: 502 });
  }
}
