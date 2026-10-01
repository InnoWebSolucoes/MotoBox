import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { lerNoticias } from "@/lib/supabase/publico";
import { CATEGORIAS_ARTIGO } from "@/lib/types";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Pilulas, Seccao } from "@/components/painel/blocos";
import { CartaoArtigo } from "@/components/painel/cartoes";
import { NewsletterPainel } from "@/components/painel/Newsletter";

export const metadata: Metadata = {
  title: "Artigos",
  description:
    "Histórias da comunidade motard angolana, clubes, viagens, guias e segurança. Os artigos da MotoBox.",
};

export default async function Artigos({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const artigos = await lerNoticias();

  // Só aparecem as categorias que têm artigos, pela ordem oficial.
  const presentes = CATEGORIAS_ARTIGO.filter((c) => artigos.some((a) => a.categoria === c));
  const activa = presentes.find((c) => c === categoria) ?? "todas";
  const lista = activa === "todas" ? artigos : artigos.filter((a) => a.categoria === activa);
  const [primeiro, ...resto] = lista;

  return (
    <PaginaInterior icone={<Newspaper />}>
      <header className="coluna pb-10 pt-28 lg:pt-32">
        <p className="sobretitulo surgir text-white/80">MotoBox · Artigos</p>
        <h1 className="titulo-1 surgir mt-4 max-w-[14ch] text-balance" style={{ ["--i" as string]: 1 }}>
          Histórias de quem anda de mota
        </h1>
        <p className="texto-lead surgir mt-6 max-w-[52ch] text-white/85" style={{ ["--i" as string]: 2 }}>
          Clubes, viagens, guias e segurança: o que se passa na comunidade motard angolana, contado por quem
          lá anda.
        </p>
        <div className="surgir mt-10" style={{ ["--i" as string]: 3 }}>
          <Pilulas
            rotulo="Categorias de artigos"
            activa={activa}
            itens={[
              { chave: "todas", texto: "Todos", href: "/artigos" },
              ...presentes.map((c) => ({ chave: c, texto: c, href: `/artigos?categoria=${encodeURIComponent(c)}` })),
            ]}
          />
        </div>
      </header>

      <Seccao className="!pt-0">
        {primeiro ? (
          <div className="grid gap-[var(--intervalo)]">
            <CartaoArtigo artigo={primeiro} grande />
            {resto.length > 0 && (
              <div className="grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
                {resto.map((a) => (
                  <CartaoArtigo key={a.slug} artigo={a} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="painel painel-escuro p-10 text-white/70">Ainda não há artigos nesta categoria.</p>
        )}
      </Seccao>

      <Seccao className="!pt-0">
        <NewsletterPainel />
      </Seccao>
    </PaginaInterior>
  );
}
