import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { lerPaginasLegais } from "@/lib/supabase/publico";
import { formatData } from "@/lib/data";
import { FileText } from "lucide-react";
import { PageHero } from "@/components/ui";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { lerDoc } from "@/lib/conteudo";
import { LEGAIS_PADRAO, type ConteudoLegais } from "@/lib/conteudo/grupos/paginas";
import { fundir } from "@/lib/conteudo/grupos/site";

// O Next exige um literal aqui — não aceita constante importada.
export const revalidate = 60;

export async function generateStaticParams() {
  const paginas = await lerPaginasLegais();
  return paginas.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const paginas = await lerPaginasLegais();
  const pagina = paginas.find((p) => p.slug === slug);
  if (!pagina) return {};
  return {
    title: pagina.titulo,
    description: pagina.descricao,
  };
}

export default async function PaginaLegalPublica(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [paginas, lido] = await Promise.all([lerPaginasLegais(), lerDoc<ConteudoLegais>("paginas.legais")]);
  const pagina = paginas.find((p) => p.slug === slug && p.publicado !== false);
  if (!pagina) notFound();
  // Textos comuns a todas as páginas legais (Gestão › Páginas legais).
  const x = fundir(LEGAIS_PADRAO, lido);

  const outras = paginas.filter((p) => p.slug !== slug && p.publicado !== false);

  return (
    <PaginaInterior icone={<FileText />}>
      <PageHero eyebrow={x.sobretitulo} titulo={pagina.titulo} descricao={pagina.descricao}>
        <p className="text-xs text-white/50">{x.actualizacao}: {formatData(pagina.atualizado)}</p>
      </PageHero>

      <div className="coluna max-w-6xl py-10">
        <nav className="mb-6 text-xs text-ink-500">
          <Link href="/" className="hover:text-white">{x.inicio}</Link>
          <span className="mx-2">/</span>
          <span className="text-ink-300">{pagina.titulo}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_220px]">
          <article className="space-y-8">
            {pagina.seccoes.map((s, i) => (
              <section key={i} id={`s-${i + 1}`} className="scroll-mt-24">
                <h2 className="mb-3 text-xl font-semibold text-white">
                  {s.titulo}
                </h2>
                <div className="space-y-3">
                  {s.corpo.map((p, j) => (
                    <p key={j} className="leading-relaxed text-white/80">{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow mb-3 text-ink-500">{x.nestaPagina}</p>
            <ul className="mb-8 space-y-1.5 border-l-2 border-white/8 pl-3.5">
              {pagina.seccoes.map((s, i) => (
                <li key={i}>
                  <a href={`#s-${i + 1}`} className="text-xs text-ink-400 transition-colors hover:text-white">
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ul>

            <p className="eyebrow mb-3 text-ink-500">{x.outros}</p>
            <ul className="space-y-1.5">
              {outras.map((p) => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}`} className="text-xs text-ink-400 transition-colors hover:text-white">
                    {p.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </PaginaInterior>
  );
}
