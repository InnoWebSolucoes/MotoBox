import type { Metadata } from "next";
import { MarketplaceClient } from "./MarketplaceClient";
import { anuncios } from "@/lib/data";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Compra e venda de motas, peças e equipamento em Angola. Anúncios de vendedores verificados da comunidade Motobox.",
};

export default function MarketplacePage() {
  return <MarketplaceClient anuncios={anuncios} />;
}
