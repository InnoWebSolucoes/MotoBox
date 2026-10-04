/* GPX de cada rota: paragens, pontos de interesse e o traçado do OSRM. */

import { urlPublica } from "@/lib/base";
import { ROTAS, lerRota } from "@/lib/rotas";
import { gerarGpx } from "@/lib/rotas-mapas";
import { TRACADOS } from "@/lib/rotas-tracados";

// As rotas vivem no código: o ficheiro de cada uma gera-se no build.
export const dynamicParams = false;

export function generateStaticParams() {
  return ROTAS.map((r) => ({ slug: r.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rota = lerRota(slug);
  if (!rota) return new Response("Rota não encontrada", { status: 404 });

  const corpo = gerarGpx(rota, TRACADOS[rota.slug], `${urlPublica()}/clubes/rotas/${rota.slug}`);
  return new Response(corpo, {
    headers: {
      "Content-Type": "application/gpx+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="motobox-${rota.slug}.gpx"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
