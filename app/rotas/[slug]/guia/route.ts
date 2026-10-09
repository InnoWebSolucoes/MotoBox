/* Guia em PDF de cada rota: tudo o que é preciso para a viagem, para imprimir
   ou levar no telemóvel (ver lib/rotas-pdf). */

import { urlPublica } from "@/lib/base";
import { lerPaginaRotas, lerRotas } from "@/lib/rotas-conteudo";
import { gerarGuiaPdf, nomeGuia } from "@/lib/rotas-pdf";

// Como o GPX: as rotas vivem no conteúdo editável. As do momento do build
// geram-se logo, as que o painel criar depois no primeiro pedido, e o
// ficheiro refaz-se quando a rota ou os textos mudam (o painel manda
// revalidar ao gravar).
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  return (await lerRotas()).map((r) => ({ slug: r.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [rotas, pagina] = await Promise.all([lerRotas(), lerPaginaRotas()]);
  const indice = rotas.findIndex((r) => r.slug === slug);
  if (indice < 0) return new Response("Rota não encontrada", { status: 404 });

  const pdf = await gerarGuiaPdf({ rota: rotas[indice], pagina, indice, site: urlPublica() });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeGuia(slug)}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
