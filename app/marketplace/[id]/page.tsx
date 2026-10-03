import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/Brand";
import { Denunciar } from "@/components/Denunciar";
import { SeloVerificado } from "@/components/SeloVerificado";
import { Icon, Tag } from "@/components/ui";
import { formatData, formatKz } from "@/lib/data";
import { lerAnuncio, lerAnuncios } from "@/lib/supabase/publico";
import { AVISO_PAGAMENTO, CONSELHO_SEGURANCA, SLUG_TERMOS_MARKETPLACE } from "@/lib/marketplace";
import { GaleriaAnuncio } from "./GaleriaAnuncio";
import { AccoesAnuncio } from "./AccoesAnuncio";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Anúncios criados depois do build são gerados no primeiro pedido
// (`dynamicParams` fica no valor por omissão, `true`).
export async function generateStaticParams() {
  const anuncios = await lerAnuncios();
  return anuncios.map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const a = await lerAnuncio(id);
  if (!a) return { title: "Anúncio não encontrado" };
  return { title: a.titulo, description: a.descricao.slice(0, 155) };
}

export default async function AnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anuncio = await lerAnuncio(id);
  if (!anuncio) notFound();

  const todos = await lerAnuncios();
  const semelhantes = todos
    .filter((a) => a.id !== anuncio.id && a.categoria === anuncio.categoria)
    .slice(0, 4);
  // Contados agora, entre os que estão à vista; os de demonstração trazem o número escrito.
  const doVendedor = anuncio.vendedor.authId
    ? todos.filter((a) => a.vendedor.authId === anuncio.vendedor.authId).length
    : anuncio.vendedor.anuncios;

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
        className="inline-flex items-center gap-2 font-ui text-base text-ink-400 hover:text-white transition-colors"
      >
        <span aria-hidden>←</span> Marketplace
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* Galeria e descrição */}
        <div>
          <GaleriaAnuncio imagens={anuncio.imagens ?? []} titulo={anuncio.titulo}>
            <Tag tone="neutral">{anuncio.categoria}</Tag>
            <Tag tone="neutral">{anuncio.estado}</Tag>
          </GaleriaAnuncio>

          <section className="mt-10">
            <h2 className="eyebrow accent-bar text-white">Descrição</h2>
            <p className="text-base text-ink-300 leading-relaxed whitespace-pre-line">
              {anuncio.descricao}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="eyebrow accent-bar text-white">Ficha técnica</h2>
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {ficha.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-white/6 py-3.5">
                  <dt className="text-sm text-ink-500">{k}</dt>
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

            <p className="mt-4 font-display text-4xl leading-none text-white tabular-nums">{formatKz(anuncio.preco)}</p>
            <p className="mt-1 text-xs text-ink-500">
              {anuncio.negociavel ? "Preço negociável" : "Preço fixo"}
            </p>

            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/6 pt-4 text-xs text-ink-500">
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

            <AccoesAnuncio
              anuncioId={anuncio.id}
              titulo={anuncio.titulo}
              preco={anuncio.preco}
              vendedorNome={anuncio.vendedor.nome}
              vendedorAuthId={anuncio.vendedor.authId}
            />
          </div>

          {/* Vendedor */}
          <div className="card p-6">
            <h2 className="eyebrow text-mb-red mb-4">Vendedor</h2>
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink-800 font-display text-sm text-white">
                {anuncio.vendedor.nome
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-display text-base uppercase text-white">
                  <span className="truncate">{anuncio.vendedor.nome}</span>
                  {anuncio.vendedor.verificado && <SeloVerificado tamanho={16} />}
                </p>
                <p className="text-xs text-ink-500">
                  Membro desde {anuncio.vendedor.desde}
                </p>
              </div>
            </div>
            {anuncio.vendedor.verificado && (
              <p className="mt-3 text-xs text-ink-400">Identidade confirmada pela equipa Motobox.</p>
            )}

            <dl className="mt-5 border-t border-white/6 pt-4">
              <dd className="font-display text-lg text-white">{doVendedor}</dd>
              <dt className="eyebrow text-ink-600">{doVendedor === 1 ? "Anúncio no marketplace" : "Anúncios no marketplace"}</dt>
            </dl>
          </div>

          {/* Verificação da mota pela equipa */}
          {anuncio.documentosVerificados && (
            <div className="card bg-ok/8 p-5">
              <p className="flex items-center gap-2 font-display text-sm uppercase text-white">
                <Icon name="shield" className="size-4 text-ok" />
                Documentação verificada
              </p>
              <p className="mt-2 text-xs text-ink-400 leading-relaxed">
                A equipa Motobox viu os documentos desta mota e registou o número de quadro antes de a
                publicar. Confirme na mesma, ao vivo, que o número gravado na mota é o dos documentos.
              </p>
            </div>
          )}

          {/* Aviso */}
          <div className="px-1 pt-1">
            <p className="flex gap-2.5 text-xs text-ink-500 leading-relaxed">
              <Icon name="shield" className="size-4 shrink-0 text-ink-600" />
              <span>
                {AVISO_PAGAMENTO} {CONSELHO_SEGURANCA}{" "}
                <Link href={`/${SLUG_TERMOS_MARKETPLACE}`} className="text-ink-300 underline hover:text-white">
                  Termos do Marketplace
                </Link>
              </span>
            </p>
            <div className="mt-3 pl-6.5">
              <Denunciar tipo="marketplace" alvoId={anuncio.id} rotulo="Denunciar este anúncio" />
            </div>
          </div>
        </aside>
      </div>

      {/* Semelhantes */}
      {semelhantes.length > 0 && (
        <section className="mt-16">
          <h2 className="title-xl text-2xl sm:text-3xl">Anúncios semelhantes</h2>
          <div className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {semelhantes.map((a) => (
              <Link key={a.id} href={`/marketplace/${a.id}`} className="group block">
                <div className="media relative aspect-[4/3]">
                  <Placeholder
                    nome={a.imagens[0]}
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                  />
                </div>
                <p className="mt-3.5 font-display text-2xl leading-none text-white tabular-nums">{formatKz(a.preco)}</p>
                <h3 className="mt-2.5 font-display text-base uppercase leading-snug text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                  {a.titulo}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
