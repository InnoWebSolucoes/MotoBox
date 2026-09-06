import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/Brand";
import { Newsletter } from "@/components/Newsletter";
import { Icon, Tag } from "@/components/ui";
import { formatData, getNoticia, noticias } from "@/lib/data";

export function generateStaticParams() {
  return noticias.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const n = getNoticia(slug);
  if (!n) return { title: "Notícia não encontrada" };
  return {
    title: n.titulo,
    description: n.resumo,
    openGraph: { title: n.titulo, description: n.resumo, type: "article", publishedTime: n.data },
  };
}

export default async function NoticiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const noticia = getNoticia(slug);
  if (!noticia) notFound();

  const relacionadas = noticias
    .filter((n) => n.slug !== noticia.slug)
    .map((n) => ({
      n,
      score: n.tags.filter((t) => noticia.tags.includes(t)).length + (n.categoria === noticia.categoria ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.n);

  return (
    <>
      {/* Cabeçalho */}
      <header className="relative overflow-hidden border-b border-ink-800">
        <Placeholder nome={noticia.imagem} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/90 to-ink-950/60" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-20">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 font-display text-[11px] uppercase tracking-widest text-ink-400 hover:text-white transition-colors"
          >
            <span aria-hidden>←</span> Notícias
          </Link>

          <div className="mt-6 flex flex-wrap gap-2">
            <Tag tone="red">{noticia.categoria}</Tag>
            {noticia.fonte && <Tag tone="outline">via {noticia.fonte}</Tag>}
          </div>

          <h1 className="title-xl mt-4 text-3xl sm:text-4xl lg:text-5xl">{noticia.titulo}</h1>

          <p className="mt-5 text-base sm:text-lg text-ink-300 leading-relaxed">{noticia.resumo}</p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-800 pt-5 text-xs text-ink-500">
            <span className="inline-flex items-center gap-2">
              <Icon name="user" className="size-3.5" />
              {noticia.autor}
            </span>
            <span className="inline-flex items-center gap-2">
              <Icon name="calendar" className="size-3.5" />
              {formatData(noticia.data)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Icon name="clock" className="size-3.5" />
              {noticia.leitura} min de leitura
            </span>
          </div>
        </div>
      </header>

      {/* Corpo */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <div className="space-y-5">
          {noticia.corpo.map((p, i) => (
            <p
              key={i}
              className={`leading-relaxed ${
                i === 0
                  ? "text-lg text-ink-200 first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.85] first-letter:text-mb-red"
                  : "text-base text-ink-300"
              }`}
            >
              {p}
            </p>
          ))}
        </div>

        {/* Fonte externa */}
        {noticia.fonte && (
          <div className="mt-8 border-l-2 border-mb-red bg-ink-900 p-5">
            <p className="eyebrow text-mb-red mb-2">Fonte</p>
            <p className="text-sm text-ink-400">
              Conteúdo agregado automaticamente de{" "}
              {noticia.fonteUrl && noticia.fonteUrl !== "#" ? (
                <a
                  href={noticia.fonteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline decoration-mb-red underline-offset-4 hover:text-mb-red"
                >
                  {noticia.fonte}
                </a>
              ) : (
                <span className="text-white">{noticia.fonte}</span>
              )}
              . Tradução e edição da Motobox Angola.
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="mt-8 flex flex-wrap gap-2 border-t border-ink-800 pt-6">
          {noticia.tags.map((t) => (
            <span key={t} className="border border-ink-700 px-3 py-1 text-xs text-ink-400">
              #{t}
            </span>
          ))}
        </div>

        {/* Partilhar */}
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-ink-800 pt-6">
          <span className="eyebrow text-ink-500">Partilhar</span>
          <div className="flex gap-2">
            {(["whatsapp", "facebook", "instagram", "share"] as const).map((r) => (
              <span
                key={r}
                className="grid size-10 cursor-pointer place-items-center border border-ink-700 text-ink-400 transition-colors hover:border-mb-red hover:text-white"
              >
                <Icon name={r} className="size-4.5" />
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* Relacionadas */}
      {relacionadas.length > 0 && (
        <section className="border-t border-ink-800 bg-ink-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
            <h2 className="title-xl text-2xl sm:text-3xl">Leia também</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {relacionadas.map((n) => (
                <Link key={n.slug} href={`/noticias/${n.slug}`} className="group card card-hover overflow-hidden">
                  <div className="relative aspect-[16/10]">
                    <Placeholder
                      nome={n.imagem}
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3">
                      <Tag tone="red">{n.categoria}</Tag>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-base uppercase leading-snug text-white line-clamp-3 group-hover:text-mb-red transition-colors">
                      {n.titulo}
                    </h3>
                    <p className="mt-2 text-xs text-ink-600">
                      {formatData(n.data, { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Newsletter />
    </>
  );
}
