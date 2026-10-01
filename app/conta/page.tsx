import type { Metadata } from "next";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { ContaClient } from "./ContaClient";
import { lerClubes, lerNoticias } from "@/lib/supabase/publico";
import { PaginaInterior } from "@/components/painel/PaginaInterior";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "A minha conta",
  description: "O seu perfil MotoBox: clubes e marcas que segue, notificações e anúncios do marketplace.",
};

export default async function ContaPage() {
  const [clubes, noticias] = await Promise.all([lerClubes(), lerNoticias()]);
  // O separador aberto vem do endereço (?aba=), lido no cliente.
  return (
    <PaginaInterior icone={<UserRound />}>
      <div className="coluna pb-10 pt-28 lg:pt-32">
        <Suspense fallback={null}>
          <ContaClient clubes={clubes} noticias={noticias} />
        </Suspense>
      </div>
    </PaginaInterior>
  );
}
