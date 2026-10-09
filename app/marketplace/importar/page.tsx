import type { Metadata } from "next";
import { Globe2 } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { lerDoc } from "@/lib/conteudo";
import { IMPORTAR_PADRAO, type ConteudoImportar } from "@/lib/conteudo/grupos/paginas";
import { fundir } from "@/lib/conteudo/grupos/site";
import { ImportarClient } from "./ImportarClient";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

/* O texto vive no conteúdo editável ("paginas.marketplace-importar",
   editado em Gestão › Páginas); ./conteudo.ts é o texto de partida. */
async function lerImportar(): Promise<ConteudoImportar> {
  return fundir(IMPORTAR_PADRAO, await lerDoc<ConteudoImportar>("paginas.marketplace-importar"));
}

export async function generateMetadata(): Promise<Metadata> {
  const { SEO } = await lerImportar();
  return { title: SEO.titulo, description: SEO.descricao };
}

export default async function ImportarPage() {
  const dados = await lerImportar();
  return (
    <PaginaInterior icone={<Globe2 />}>
      <ImportarClient dados={dados} />
    </PaginaInterior>
  );
}
