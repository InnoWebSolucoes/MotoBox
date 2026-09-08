import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { lerPaginasLegais } from "@/lib/supabase/publico";
import { paginasLegaisSeed } from "@/lib/admin/seed";
import { formatData } from "@/lib/data";
import { PageHero } from "@/components/ui";

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
    title: `${pagina.titulo} · Motobox Angola`,
    description: pagina.descricao,
  };
}

export default async function PaginaLegalPublica(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const paginas = await lerPaginasLegais();
  const pagina = paginas.find((p) => p.slug === slug && p.publicado !== false);
  if (!pagina) notFound();

  const outras = paginas.filter((p) => p.slug !== slug && p.publicado !== false);

  return (
    <>
      <PageHero imagem="legal" eyebrow="Documento legal" titulo={pagina.titulo} descricao={pagina.descricao}>
        <p className="text-xs text-ink-500">Última atualização: {formatData(pagina.atualizado)}</p>
      </PageHero>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <nav className="mb-6 text-xs text-ink-500">
          <Link href="/" className="hover:text-white">Início</Link>
          <span className="mx-2">/</span>
          <span className="text-ink-300">{pagina.titulo}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_220px]">
          <article className="space-y-8">
            {pagina.seccoes.map((s, i) => (
              <section key={i} id={`s-${i + 1}`} className="scroll-mt-24">
                <h2 className="font-display mb-3 text-lg uppercase tracking-tight text-white">
                  {s.titulo}
                </h2>
                <div className="space-y-3">
                  {s.corpo.map((p, j) => (
                    <p key={j} className="leading-relaxed text-ink-300">{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow mb-3 text-ink-500">Nesta página</p>
            <ul className="mb-8 space-y-1.5 border-l border-ink-700 pl-3">
              {pagina.seccoes.map((s, i) => (
                <li key={i}>
                  <a href={`#s-${i + 1}`} className="text-xs text-ink-400 transition-colors hover:text-mb-red">
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ul>

            <p className="eyebrow mb-3 text-ink-500">Outros documentos</p>
            <ul className="space-y-1.5">
              {outras.map((p) => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}`} className="text-xs text-ink-400 transition-colors hover:text-mb-red">
                    {p.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </>
  );
}
