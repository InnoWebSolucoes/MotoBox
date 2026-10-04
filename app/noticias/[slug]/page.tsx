import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/Brand";
import { C } from "@/components/T";
import { Icon } from "@/components/ui";
import { formatData } from "@/lib/data";
import { urlPublica } from "@/lib/base";
import { lerNoticia, lerNoticias } from "@/lib/supabase/publico";
import { CorpoArtigo } from "./CorpoArtigo";

/* ============================================================
   MOTOBOX — Página de um artigo
   Lida como num jornal: uma coluna central de ~70 caracteres,
   título, entrada e assinatura centrados, fotografia mais larga
   do que o texto, serifa de leitura e capitular no primeiro
   parágrafo. O corpo e as suas marcas estão em CorpoArtigo.
   ============================================================ */

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Notícias criadas depois do build são geradas no primeiro pedido
// (`dynamicParams` fica no valor por omissão, `true`).
export async function generateStaticParams() {
  const noticias = await lerNoticias();
  return noticias.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const n = await lerNoticia(slug);
  if (!n) return { title: "Notícia não encontrada" };
  return {
    title: n.titulo,
    description: n.resumo,
    openGraph: { title: n.titulo, description: n.resumo, type: "article", publishedTime: n.data },
  };
}

/** Minutos de leitura contados no texto, a ~200 palavras por minuto. */
function minutosDeLeitura(corpo: string[]): number {
  const palavras = corpo.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palavras / 200));
}

export default async function NoticiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const noticia = await lerNoticia(slug);
  if (!noticia) notFound();

  const relacionadas = (await lerNoticias())
    .filter((n) => n.slug !== noticia.slug)
    .map((n) => ({
      n,
      score: n.tags.filter((t) => noticia.tags.includes(t)).length + (n.categoria === noticia.categoria ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.n);

  // Só se liga à fonte com um endereço a sério (há registos com "#").
  const ligacaoFonte = /^https?:\/\//i.test(noticia.fonteUrl?.trim() ?? "") ? noticia.fonteUrl?.trim() : undefined;

  const endereco = `${urlPublica()}/noticias/${noticia.slug}`;
  const partilhar = [
    { rede: "whatsapp", nome: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${noticia.titulo} ${endereco}`)}` },
    { rede: "facebook", nome: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(endereco)}` },
    { rede: "mail", nome: "Email", href: `mailto:?subject=${encodeURIComponent(noticia.titulo)}&body=${encodeURIComponent(endereco)}` },
  ];

  return (
    <>
      <article>
        {/* Cabeçalho: tudo centrado, como na primeira página de um jornal */}
        <header className="mx-auto max-w-3xl px-5 pt-10 text-center sm:px-6 sm:pt-14">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 font-ui text-sm text-ink-400 transition-colors hover:text-white"
          >
            <span aria-hidden>←</span> Notícias
          </Link>

          <p className="mt-8 font-ui text-sm uppercase tracking-[0.2em] text-mb-red">
            {noticia.categoria}
            {noticia.fonte && <span className="text-ink-500"> · via {noticia.fonte}</span>}
          </p>

          <h1 className="mt-4 font-serif text-[2.125rem] font-bold leading-[1.15] tracking-tight text-white text-balance sm:text-5xl lg:text-[3.5rem]">
            <C>{noticia.titulo}</C>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl font-serif text-xl leading-relaxed text-ink-300 text-pretty sm:text-[1.375rem]">
            <C>{noticia.resumo}</C>
          </p>

          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-ui text-sm text-ink-400">
            <span>
              Por <span className="text-white">{noticia.autor}</span>
            </span>
            <span aria-hidden className="text-ink-600">·</span>
            <time dateTime={noticia.data}>{formatData(noticia.data)}</time>
            <span aria-hidden className="text-ink-600">·</span>
            <span>{minutosDeLeitura(noticia.corpo)} min de leitura</span>
          </p>
        </header>

        {/* Fotografia: mais larga do que a coluna de texto */}
        <figure className="mx-auto mt-10 max-w-5xl sm:px-6">
          <div className="media relative aspect-[16/9] sm:aspect-[2/1]">
            <Placeholder
              nome={[noticia.slug, noticia.imagem]}
              className="absolute inset-0"
              tamanhos="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </figure>

        {/* Corpo: uma coluna central, para ler sem procurar o início da linha */}
        <div className="mx-auto max-w-[42rem] px-5 py-12 sm:px-6 sm:py-16">
          <CorpoArtigo corpo={noticia.corpo} />

          {/* Fonte externa: a redacção escolhe e edita a notícia a partir de outro meio */}
          {noticia.fonte && (
            <aside className="mt-14 border-t border-white/10 pt-6">
              <p className="eyebrow mb-2 text-mb-red">Fonte</p>
              <p className="text-sm leading-relaxed text-ink-400">
                Notícia escolhida e editada pela redacção da Motobox Angola a partir de{" "}
                {ligacaoFonte ? (
                  <a
                    href={ligacaoFonte}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline decoration-mb-red underline-offset-4 hover:text-mb-red"
                  >
                    {noticia.fonte}
                  </a>
                ) : (
                  <span className="text-white">{noticia.fonte}</span>
                )}
                .
              </p>
            </aside>
          )}

          {/* Etiquetas e partilha */}
          <footer className="mt-10 border-t border-white/10 pt-6">
            {noticia.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {noticia.tags.map((t) => (
                  <li key={t} className="rounded-full bg-ink-800 px-3.5 py-1.5 font-ui text-sm text-ink-300">
                    #{t}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="eyebrow text-ink-500">Partilhar</span>
              <div className="flex gap-2">
                {partilhar.map((p) => (
                  <a
                    key={p.rede}
                    href={p.href}
                    target={p.rede === "mail" ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={`Partilhar por ${p.nome}`}
                    className="grid size-10 place-items-center rounded-full bg-ink-800 text-ink-300 transition-colors hover:bg-mb-red hover:text-white"
                  >
                    <Icon name={p.rede} className="size-4.5" />
                  </a>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </article>

      {/* Relacionadas */}
      {relacionadas.length > 0 && (
        <section className="bg-ink-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
            <h2 className="title-xl text-2xl sm:text-3xl">Leia também</h2>
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-3">
              {relacionadas.map((n) => (
                <Link key={n.slug} href={`/noticias/${n.slug}`} className="group block">
                  <div className="media relative aspect-[16/10]">
                    <Placeholder
                      nome={[n.slug, n.imagem]}
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      tamanhos="(max-width: 640px) 100vw, 400px"
                    />
                  </div>
                  <p className="eyebrow mt-4 text-mb-red">{n.categoria}</p>
                  <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-white line-clamp-3 group-hover:text-mb-red transition-colors">
                    <C>{n.titulo}</C>
                  </h3>
                  <p className="mt-2 text-xs text-ink-500">
                    {formatData(n.data, { day: "2-digit", month: "short" })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </>
  );
}
