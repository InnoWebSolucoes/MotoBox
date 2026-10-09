/* GPX de cada rota: paragens, pontos de interesse e o traçado do OSRM. */

import { urlPublica } from "@/lib/base";
import { lerRotaPorSlug, lerRotas } from "@/lib/rotas-conteudo";
import { gerarGpx } from "@/lib/rotas-mapas";
import { coordValida } from "@/lib/rotas-tipos";

// As rotas vivem no conteúdo editável: as do momento do build geram-se logo,
// as que o painel criar depois no primeiro pedido, e o ficheiro refaz-se
// quando a rota muda (o painel manda revalidar ao gravar).
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  return (await lerRotas()).map((r) => ({ slug: r.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rota = await lerRotaPorSlug(slug);
  if (!rota) return new Response("Rota não encontrada", { status: 404 });

  // Só entram as paragens e os pontos com coordenadas; o traçado é o gravado
  // com a rota (recalculado no painel quando as paragens mudam).
  const limpa = { ...rota, paragens: rota.paragens.filter(coordValida) };
  const corpo = gerarGpx(limpa, rota.tracado || undefined, `${urlPublica()}/rotas/${rota.slug}`);
  return new Response(corpo, {
    headers: {
      "Content-Type": "application/gpx+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="motobox-${rota.slug}.gpx"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
