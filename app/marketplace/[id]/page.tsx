import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/Brand";
import { Button, Icon, Tag } from "@/components/ui";
import { anuncios, formatData, formatKz, getAnuncio } from "@/lib/data";

export function generateStaticParams() {
  return anuncios.map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const a = getAnuncio(id);
  if (!a) return { title: "Anúncio não encontrado" };
  return { title: a.titulo, description: a.descricao.slice(0, 155) };
}

export default async function AnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anuncio = getAnuncio(id);
  if (!anuncio) notFound();

  const semelhantes = anuncios
    .filter((a) => a.id !== anuncio.id && a.categoria === anuncio.categoria)
    .slice(0, 4);

  const ficha = [
    ["Categoria", anuncio.categoria],
    ["Marca", anuncio.marca],
    anuncio.modelo && ["Modelo", anuncio.modelo],
    anuncio.ano && ["Ano", String(anuncio.ano)],
    anuncio.quilometragem !== undefined && [
      "Quilometragem",
      `${anuncio.quilometragem.toLocaleString("pt-PT")} km`,
    ],
    ["Estado", anuncio.estado],
    ["Localização", anuncio.provincia],
  ].filter((x): x is [string, string] => Boolean(x));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 font-display text-[11px] uppercase tracking-widest text-ink-500 hover:text-white transition-colors"
      >
        <span aria-hidden>←</span> Marketplace
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* Galeria e descrição */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden border border-ink-700">
            <Placeholder nome={anuncio.imagens[0]} className="absolute inset-0" />
            <div className="absolute left-4 top-4 flex gap-2">
              <Tag tone="neutral">{anuncio.categoria}</Tag>
              <Tag tone="outline">{anuncio.estado}</Tag>
            </div>
          </div>

          {/* Miniaturas */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`relative aspect-[4/3] cursor-pointer border ${
                  i === 0 ? "border-mb-red" : "border-ink-800 opacity-50 hover:opacity-100"
                }`}
              >
                <Placeholder nome={`${anuncio.imagens[0]}-${i}`} className="absolute inset-0" />
              </div>
            ))}
          </div>

          <section className="mt-9">
            <h2 className="eyebrow accent-bar text-white">Descrição</h2>
            <p className="text-base text-ink-300 leading-relaxed whitespace-pre-line">
              {anuncio.descricao}
            </p>
          </section>

          <section className="mt-9">
            <h2 className="eyebrow accent-bar text-white">Ficha técnica</h2>
            <dl className="card grid gap-px overflow-hidden bg-ink-800 sm:grid-cols-2">
              {ficha.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 bg-ink-900 px-4 py-3.5">
                  <dt className="text-xs text-ink-500">{k}</dt>
                  <dd className="text-sm text-white text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Coluna de compra */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="card p-6">
            <h1 className="font-display text-xl sm:text-2xl uppercase leading-tight text-white">
              {anuncio.titulo}
            </h1>

            <p className="mt-4 font-display text-3xl text-white">{formatKz(anuncio.preco)}</p>
            <p className="mt-1 text-xs text-ink-500">
              {anuncio.negociavel ? "Preço negociável" : "Preço fixo"}
            </p>

            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink-800 pt-4 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="pin" className="size-3.5" />
                {anuncio.provincia}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="eye" className="size-3.5" />
                {anuncio.visualizacoes.toLocaleString("pt-PT")} visualizações
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" className="size-3.5" />
                {formatData(anuncio.publicado, { day: "2-digit", month: "short" })}
              </span>
            </p>

            <div className="mt-6 space-y-2">
              <Button className="w-full" size="lg">
                <Icon name="whatsapp" className="size-4" />
                Contactar vendedor
              </Button>
              <Button variant="outline" className="w-full">
                <Icon name="mail" className="size-4" />
                Enviar mensagem
              </Button>
              <div className="flex gap-2">
                <Button variant="dark" className="flex-1">
                  <Icon name="heart" className="size-4" />
                  Guardar
                </Button>
                <Button variant="dark" className="flex-1">
                  <Icon name="share" className="size-4" />
                  Partilhar
                </Button>
              </div>
            </div>
          </div>

          {/* Vendedor */}
          <div className="card p-6">
            <h2 className="eyebrow text-mb-red mb-4">Vendedor</h2>
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center bg-ink-800 font-display text-sm text-white">
                {anuncio.vendedor.nome
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-display text-base uppercase text-white">
                  <span className="truncate">{anuncio.vendedor.nome}</span>
                  {anuncio.vendedor.verificado && (
                    <Icon name="verified" className="size-4 shrink-0 text-ok" />
                  )}
                </p>
                <p className="text-xs text-ink-500">
                  Membro desde {anuncio.vendedor.desde}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-800 pt-4">
              <div>
                <dd className="font-display text-lg text-white">{anuncio.vendedor.anuncios}</dd>
                <dt className="eyebrow text-ink-600">Anúncios</dt>
              </div>
              <div>
                <dd className="flex items-center gap-1.5 font-display text-lg text-white">
                  {anuncio.vendedor.avaliacao.toFixed(1)}
                  <Icon name="star" className="size-4 text-gold" />
                </dd>
                <dt className="eyebrow text-ink-600">Avaliação</dt>
              </div>
            </dl>
          </div>

          {/* Aviso */}
          <div className="card border-ink-700 p-5">
            <p className="flex gap-2.5 text-xs text-ink-500 leading-relaxed">
              <Icon name="shield" className="size-4 shrink-0 text-ink-600" />
              A Motobox não intermedeia pagamentos. Combine sempre um encontro em local público,
              verifique a documentação e desconfie de preços muito abaixo do mercado.
            </p>
          </div>
        </aside>
      </div>

      {/* Semelhantes */}
      {semelhantes.length > 0 && (
        <section className="mt-16">
          <h2 className="title-xl text-2xl sm:text-3xl">Anúncios semelhantes</h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {semelhantes.map((a) => (
              <Link key={a.id} href={`/marketplace/${a.id}`} className="group card card-hover overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <Placeholder
                    nome={a.imagens[0]}
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-sm uppercase leading-snug text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                    {a.titulo}
                  </h3>
                  <p className="mt-2 font-display text-base text-white">{formatKz(a.preco)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
