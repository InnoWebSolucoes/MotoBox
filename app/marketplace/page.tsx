import type { Metadata } from "next";
import { Globe2, ShieldCheck, Star, Store, BadgeCheck } from "lucide-react";
import { lerAnuncios } from "@/lib/supabase/publico";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, CartaoIcone, CartaoNumerado, Seccao } from "@/components/painel/blocos";
import { MarketplaceClient } from "./MarketplaceClient";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Compra e venda de motas, peças e equipamento em Angola, entre motards. Vendedores verificados pela MotoBox.",
};

export default async function Marketplace() {
  const anuncios = await lerAnuncios();

  return (
    <PaginaInterior icone={<Store />}>
      <Abertura
        compacta
        foto="banner-marketplace"
        sobretitulo="Entre motards"
        titulo="Marketplace"
        texto="Motas, peças e equipamento de quem anda de mota, para quem anda de mota. Os vendedores com o selo foram verificados pela equipa."
      >
        <BotaoMB href="/conta#anuncios">Publicar um anúncio</BotaoMB>
      </Abertura>

      <Seccao>
        <MarketplaceClient anuncios={anuncios} />
      </Seccao>

      <Seccao className="!pt-0">
        <CartaoNumerado
          numero={<Globe2 className="size-5" aria-hidden />}
          sobretitulo="Novo"
          titulo="Importar do estrangeiro"
          foto="banner-importar"
          href="/marketplace/importar"
        >
          Peças, equipamento ou uma mota que não se encontra em Angola? Diga-nos o que procura e ajudamos a
          trazê-lo de lojas de Portugal, Espanha e de outros países.
        </CartaoNumerado>
      </Seccao>

      <Seccao className="!pt-0">
        <h2 className="titulo-3">Como funciona a verificação</h2>
        <div className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-3">
          <CartaoIcone icone={<BadgeCheck />} titulo="Vendedor verificado">
            A equipa confirma a identidade e o contacto de cada vendedor antes de lhe dar o selo.
          </CartaoIcone>
          <CartaoIcone icone={<Star />} titulo="Histórico e avaliações">
            Cada vendedor tem um histórico público de anúncios e a avaliação de quem já lhe comprou.
          </CartaoIcone>
          <CartaoIcone icone={<ShieldCheck />} titulo="Sem pagamentos na plataforma">
            A MotoBox não intermedeia pagamentos. Veja a mota e os documentos antes de pagar, num sítio público.
          </CartaoIcone>
        </div>
      </Seccao>
    </PaginaInterior>
  );
}
