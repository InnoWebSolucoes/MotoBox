import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { paginasLegaisSeed } from "@/lib/admin/seed";
import { formatData } from "@/lib/data";

export function generateStaticParams() {
  return paginasLegaisSeed.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const pagina = paginasLegaisSeed.find((p) => p.slug === slug);
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
  const pagina = paginasLegaisSeed.find((p) => p.slug === slug);
  if (!pagina) notFound();

  const outras = paginasLegaisSeed.filter((p) => p.slug !== slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <nav className="mb-6 text-xs text-ink-500">
        <Link href="/" className="hover:text-white">Início</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-300">{pagina.titulo}</span>
      </nav>

      <header className="mb-10 border-b border-ink-700 pb-8">
        <p className="eyebrow mb-3 text-mb-red">Documento legal</p>
        <h1 className="title-xl text-4xl text-white sm:text-5xl">{pagina.titulo}</h1>
        <p className="mt-3 max-w-2xl text-ink-300">{pagina.descricao}</p>
        <p className="mt-4 text-xs text-ink-500">
          Última atualização: {formatData(pagina.atualizado)}
        </p>
      </header>

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
  );
}
