import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  BadgeCheck, FileCheck, Globe2, Handshake, Phone, ShieldCheck, Star, Store, UserCheck,
} from "lucide-react";
import { lerAnuncios } from "@/lib/supabase/publico";
import { lerDoc } from "@/lib/conteudo";
import { comPadrao, MARKETPLACE_PADRAO, type ConteudoMarketplace } from "@/lib/conteudo/grupos/comunidade";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, CartaoIcone, CartaoNumerado, Seccao } from "@/components/painel/blocos";
import { MarketplaceClient } from "./MarketplaceClient";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

/** Os textos da página, editáveis no painel (Marketplace → Página Marketplace). */
const lerTextos = async () =>
  comPadrao(await lerDoc<ConteudoMarketplace>("paginas.marketplace"), MARKETPLACE_PADRAO);

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await lerTextos();
  return { title: seo.titulo, description: seo.descricao };
}

const ICONES: Record<string, ReactNode> = {
  selo: <BadgeCheck />,
  estrela: <Star />,
  escudo: <ShieldCheck />,
  utilizador: <UserCheck />,
  telefone: <Phone />,
  documento: <FileCheck />,
  aperto: <Handshake />,
};

export default async function Marketplace() {
  const [anuncios, t] = await Promise.all([lerAnuncios(), lerTextos()]);
  const { abertura, importar, verificacao } = t;

  return (
    <PaginaInterior icone={<Store />}>
      <Abertura
        compacta
        foto={abertura.foto}
        sobretitulo={abertura.sobretitulo || undefined}
        titulo={abertura.titulo}
        texto={abertura.texto || undefined}
      >
        {abertura.botao && <BotaoMB href={abertura.botaoLigacao || "/conta#anuncios"}>{abertura.botao}</BotaoMB>}
      </Abertura>

      <Seccao>
        <MarketplaceClient anuncios={anuncios} textos={t.lista} />
      </Seccao>

      {importar.mostrar && (
        <Seccao className="!pt-0">
          <CartaoNumerado
            numero={<Globe2 className="size-5" aria-hidden />}
            sobretitulo={importar.sobretitulo || undefined}
            titulo={importar.titulo}
            foto={importar.foto || undefined}
            href={importar.ligacao || undefined}
          >
            {importar.texto}
          </CartaoNumerado>
        </Seccao>
      )}

      {verificacao.mostrar && verificacao.cartoes.length > 0 && (
        <Seccao className="!pt-0">
          <h2 className="titulo-3">{verificacao.titulo}</h2>
          <div className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-3">
            {verificacao.cartoes.map((c, i) => (
              <CartaoIcone key={i} icone={ICONES[c.icone] ?? <BadgeCheck />} titulo={c.titulo}>
                {c.texto}
              </CartaoIcone>
            ))}
          </div>
        </Seccao>
      )}
    </PaginaInterior>
  );
}
