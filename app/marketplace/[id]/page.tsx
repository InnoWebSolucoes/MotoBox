import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Eye, MapPin, ShieldCheck, Star, Store } from "lucide-react";
import { Denunciar } from "@/components/Denunciar";
import { SeloVerificado } from "@/components/SeloVerificado";
import { Tag } from "@/components/ui";
import { formatKz } from "@/lib/data";
import { dataArtigo } from "@/lib/motobox";
import { lerAnuncio, lerAnuncios } from "@/lib/supabase/publico";
import { lerDoc } from "@/lib/conteudo";
import { comPadrao, MARKETPLACE_PADRAO, type ConteudoMarketplace } from "@/lib/conteudo/grupos/comunidade";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Seccao } from "@/components/painel/blocos";
import { Foto, Monograma, Seta } from "@/components/painel/kit";
import { GaleriaAnuncio } from "./GaleriaAnuncio";
import { AccoesAnuncio } from "./AccoesAnuncio";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Anúncios criados depois do build são gerados no primeiro pedido.
export async function generateStaticParams() {
  const anuncios = await lerAnuncios();
  return anuncios.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = await lerAnuncio(id);
  if (!a) return { title: "Anúncio não encontrado" };
  return { title: a.titulo, description: a.descricao.slice(0, 155) };
}

export default async function AnuncioPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anuncio = await lerAnuncio(id);
  if (!anuncio) notFound();

  // Textos fixos da página, editáveis no painel (Marketplace → Página Marketplace).
  const t = comPadrao(await lerDoc<ConteudoMarketplace>("paginas.marketplace"), MARKETPLACE_PADRAO).anuncio;

  const semelhantes = (await lerAnuncios())
    .filter((a) => a.id !== anuncio.id && a.categoria === anuncio.categoria)
    .slice(0, 4);

  const ficha = [
    ["Categoria", anuncio.categoria],
    ["Marca", anuncio.marca],
    anuncio.modelo && ["Modelo", anuncio.modelo],
    anuncio.ano && ["Ano", String(anuncio.ano)],
    anuncio.quilometragem !== undefined && ["Quilometragem", `${anuncio.quilometragem.toLocaleString("pt-PT")} km`],
    ["Estado", anuncio.estado],
    ["Localização", anuncio.provincia],
  ].filter((x): x is [string, string] => Boolean(x));

  return (
    <PaginaInterior icone={<Store />}>
      <div className="coluna pb-6 pt-28 lg:pt-32">
        <Link href="/marketplace" className="group inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
          <Seta para="direita" className="size-3 rotate-180" />
          {t.voltar}
        </Link>
      </div>

      <Seccao className="!pt-0">
        <div className="grid gap-[var(--intervalo)] lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="painel painel-escuro p-[var(--intervalo)]">
            <GaleriaAnuncio imagens={anuncio.imagens ?? []} titulo={anuncio.titulo}>
              <Tag>{anuncio.categoria}</Tag>
              <Tag>{anuncio.estado}</Tag>
            </GaleriaAnuncio>

            <div className="p-5 md:p-8">
              <h2 className="text-lg font-semibold">{t.descricao}</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-white/80">{anuncio.descricao}</p>

              <h2 className="mt-10 text-lg font-semibold">{t.ficha}</h2>
              <dl className="mt-3 grid gap-x-10 sm:grid-cols-2">
                {ficha.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-white/8 py-3">
                    <dt className="text-sm text-white/75">{k}</dt>
                    <dd className="text-right text-sm">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <aside className="grid gap-[var(--intervalo)] lg:sticky lg:top-6">
            <div className="painel painel-escuro p-6">
              <h1 className="text-xl font-semibold leading-snug md:text-2xl">{anuncio.titulo}</h1>
              <p className="mt-5 text-4xl font-semibold tabular-nums tracking-tight">{formatKz(anuncio.preco)}</p>
              <p className="mt-1 text-xs text-white/75">{anuncio.negociavel ? t.precoNegociavel : t.precoFixo}</p>

              <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/8 pt-4 text-xs text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden /> {anuncio.provincia}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-3.5" aria-hidden /> {anuncio.visualizacoes.toLocaleString("pt-PT")}{` ${t.visualizacoes}`}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden /> {dataArtigo(anuncio.publicado)}
                </span>
              </p>

              <AccoesAnuncio
                anuncioId={anuncio.id}
                titulo={anuncio.titulo}
                preco={anuncio.preco}
                vendedorNome={anuncio.vendedor.nome}
                vendedorAuthId={anuncio.vendedor.authId}
                mensagemInicial={t.mensagemContacto}
              />
            </div>

            <div className="painel painel-escuro p-6">
              <p className="text-sm text-white/75">{t.vendedor}</p>
              <div className="mt-3 flex items-center gap-3">
                <Monograma nome={anuncio.vendedor.nome} cor="#2a2a2a" className="size-12 text-sm" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium">
                    <span className="truncate">{anuncio.vendedor.nome}</span>
                    {anuncio.vendedor.verificado && <SeloVerificado tamanho={16} />}
                  </p>
                  <p className="text-xs text-white/75">{`${t.membroDesde} `}{anuncio.vendedor.desde}</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/8 pt-4">
                <div>
                  <dd className="text-lg font-semibold">{anuncio.vendedor.anuncios}</dd>
                  <dt className="text-xs text-white/75">{t.anuncios}</dt>
                </div>
                <div>
                  <dd className="flex items-center gap-1.5 text-lg font-semibold">
                    {anuncio.vendedor.avaliacao ? anuncio.vendedor.avaliacao.toFixed(1) : t.semAvaliacoes}
                    {anuncio.vendedor.avaliacao > 0 && <Star className="size-4 fill-gold text-gold" aria-hidden />}
                  </dd>
                  <dt className="text-xs text-white/75">{t.avaliacao}</dt>
                </div>
              </dl>
            </div>

            <div className="painel painel-escuro p-5">
              <p className="flex gap-2.5 text-xs leading-relaxed text-white/80">
                <ShieldCheck className="size-4 shrink-0 text-mb-red-light" aria-hidden />
                {t.aviso}
              </p>
              <div className="mt-3 pl-6.5">
                <Denunciar tipo="marketplace" alvoId={anuncio.id} rotulo={t.denunciar} />
              </div>
            </div>
          </aside>
        </div>
      </Seccao>

      {semelhantes.length > 0 && (
        <Seccao className="!pt-0">
          <h2 className="titulo-3">{t.semelhantes}</h2>
          <div className="mt-8 grid gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-4">
            {semelhantes.map((a) => (
              <Link key={a.id} href={`/marketplace/${a.id}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
                <Foto nome={a.imagens[0] ?? ""} className="aspect-[4/3]" largura={600} tamanhos="(max-width: 640px) 100vw, 25vw" />
                <div className="p-4">
                  <p className="text-xl font-semibold tabular-nums">{formatKz(a.preco)}</p>
                  <h3 className="mt-2 line-clamp-2 text-sm leading-snug text-white/85">{a.titulo}</h3>
                </div>
              </Link>
            ))}
          </div>
        </Seccao>
      )}
    </PaginaInterior>
  );
}
