import type { Metadata } from "next";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { ContaClient } from "./ContaClient";
import { lerConteudoConta, lerTextosConta } from "./dados-servidor";
import { PaginaInterior } from "@/components/painel/PaginaInterior";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Os textos fixos editam-se no painel: Definições → Área de membro.
export async function generateMetadata(): Promise<Metadata> {
  const t = await lerTextosConta();
  return { title: t.seo.titulo, description: t.seo.descricao };
}

export default async function ContaPage() {
  const conteudo = await lerConteudoConta();
  return (
    <PaginaInterior icone={<UserRound />}>
      <div className="coluna pb-10 pt-28 lg:pt-32">
        {/* O separador aberto vem do endereço (?aba=), lido no cliente. */}
        <Suspense fallback={null}>
          <ContaClient {...conteudo} />
        </Suspense>
      </div>
    </PaginaInterior>
  );
}
