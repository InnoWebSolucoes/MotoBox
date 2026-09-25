import type { Metadata } from "next";
import { MarketplaceClient } from "./MarketplaceClient";
import { lerAnuncios } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Compra e venda de motas, peças e equipamento em Angola. Anúncios de vendedores verificados da comunidade Motobox.",
};

export default async function MarketplacePage() {
  return <MarketplaceClient anuncios={await lerAnuncios()} />;
}
