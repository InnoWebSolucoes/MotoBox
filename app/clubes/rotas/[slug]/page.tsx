import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/Brand";
import { ButtonLink, Icon, Tag } from "@/components/ui";
import { ROTAS, lerRota } from "@/lib/rotas";
import { lerClubes } from "@/lib/supabase/publico";
import { LogoClube } from "../../Partes";
import { localClube } from "../../comum";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// As rotas vivem no código: só existem estas páginas.
export const dynamicParams = false;

export function generateStaticParams() {
  return ROTAS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = lerRota(slug);
  if (!r) return { title: "Rota não encontrada" };
  return { title: `${r.nome}: rota de mota`, description: r.resumo };
}

export default async function RotaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rota = lerRota(slug);
  if (!rota) notFound();

  const clubes = (await lerClubes()).filter((c) => rota.provincias.includes(c.provincia)).slice(0, 4);
  const indice = ROTAS.findIndex((r) => r.slug === rota.slug);
  const outras = [...ROTAS.slice(indice + 1), ...ROTAS.slice(0, indice)].slice(0, 3);

  const ficha: [string, string][] = [
    ["Região", rota.regiao],
    ["Partida", rota.partida],
    ["Piso", rota.piso],
    ["Exigência", rota.exigencia],
  ];

  return (
    <>
      {/* ============ CABEÇALHO ============ */}
      <header className="relative isolate overflow-hidden">
        <Placeholder nome={rota.imagem} className="absolute inset-0 -z-10" tamanhos="100vw" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/20" aria-hidden />
        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col justify-between px-4 py-10 sm:min-h-[500px] sm:px-6 sm:py-12">
          <Link href="/clubes/rotas" className="inline-flex items-center gap-2 self-start font-ui text-sm text-ink-300 transition-colors hover:text-white">
            <span aria-hidden>←</span> Rotas de moto-turismo
          </Link>
          <div className="mt-16 max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Tag tone="red">{String(indice + 1).padStart(2, "0")}</Tag>
              <Tag tone="outline">{rota.regiao}</Tag>
              <Tag tone="outline">{rota.piso}</Tag>
            </div>
            <h1 className="title-xl mt-4 text-4xl sm:text-5xl lg:text-6xl">{rota.nome}</h1>
            <p className="mt-3 font-ui text-xl text-ink-200">{rota.subtitulo}</p>
            <p className="mt-4 text-[11px] text-ink-500">Fotografia ilustrativa.</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-12">
            <section>
              <p className="max-w-2xl text-lg leading-relaxed text-white">{rota.resumo}</p>
              <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-ink-300">
                {rota.descricao.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </section>

            <section>
              <h2 className="eyebrow accent-bar text-white">A estrada</h2>
              <p className="max-w-2xl text-base leading-relaxed text-ink-300">{rota.pisoDetalhe}</p>
            </section>

            {rota.distancias.length > 0 && (
              <section>
                <h2 className="eyebrow accent-bar text-white">Distâncias</h2>
                <ul className="max-w-2xl">
                  {rota.distancias.map((d) => {
                    const fonte = rota.fontes[d.fonte];
                    return (
                      <li key={d.texto} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-white/6 py-3.5 last:border-0">
                        <span className="text-sm text-white sm:text-base">{d.texto}</span>
                        {fonte && (
                          <a href={fonte.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-ink-500 underline decoration-white/15 underline-offset-2 hover:text-ink-300">
                            {fonte.nome}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[11px] text-ink-600">Só publicamos distâncias que vêm numa fonte. Quando as fontes discordam, damos o intervalo.</p>
              </section>
            )}

            <section>
              <h2 className="eyebrow accent-bar text-white">O que ver</h2>
              <ul className="grid max-w-2xl gap-x-8 sm:grid-cols-2">
                {rota.destaques.map((d) => (
                  <li key={d} className="flex items-start gap-3 border-b border-white/6 py-3 text-sm text-ink-200">
                    <Icon name="star" className="mt-0.5 size-4 shrink-0 text-mb-red" />
                    {d}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="eyebrow accent-bar text-white">Dicas para quem vai de mota</h2>
              <ol className="max-w-2xl">
                {rota.dicas.map((d, i) => (
                  <li key={d} className="flex items-start gap-4 border-b border-white/6 py-4 last:border-0">
                    <span className="w-6 shrink-0 font-display text-xl leading-none text-mb-red tabular-nums">{i + 1}</span>
                    <span className="text-sm leading-relaxed text-ink-300 sm:text-base">{d}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="eyebrow accent-bar text-white">Fontes</h2>
              <ul className="max-w-2xl space-y-1.5">
                {rota.fontes.map((f) => (
                  <li key={f.url} className="text-xs">
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-ink-400 underline decoration-white/15 underline-offset-2 hover:text-white">
                      {f.nome}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-600">
                Informação verificada em Setembro de 2026. Estradas, preços e combustível mudam: confirme localmente
                antes de partir.
              </p>
            </section>
          </div>

          {/* ============ LATERAL ============ */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="card p-5">
              <h2 className="eyebrow mb-4 text-mb-red">Ficha da rota</h2>
              <dl>
                {ficha.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-white/6 py-2.5 first:pt-0 last:border-0 last:pb-0">
                    <dt className="shrink-0 text-xs text-ink-500">{k}</dt>
                    <dd className="text-right text-sm text-white">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-white/6 pt-4 text-xs leading-relaxed text-ink-400">{rota.exigenciaPorque}</p>
            </div>

            <div className="card p-5">
              <h2 className="eyebrow mb-3 text-mb-red">Melhor época</h2>
              <p className="flex items-start gap-3 text-sm leading-relaxed text-ink-300">
                <Icon name="calendar" className="mt-0.5 size-4 shrink-0 text-ink-500" />
                {rota.melhorEpoca}
              </p>
            </div>

            {clubes.length > 0 && (
              <div className="card p-5">
                <h2 className="eyebrow mb-3 text-mb-red">Clubes na região</h2>
                <ul>
                  {clubes.map((c) => (
                    <li key={c.slug} className="border-b border-white/6 last:border-0">
                      <Link href={`/clubes/${c.slug}`} className="group flex items-center gap-3 py-2.5">
                        <LogoClube clube={c} className="size-9 text-[11px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-white transition-colors group-hover:text-mb-red">{c.nome}</span>
                          <span className="block text-xs text-ink-500">{localClube(c)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-card bg-ink-900/60 p-5">
              <p className="text-sm font-medium text-white">Vai partir?</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                Documentos, combustível, água e segurança: a lista para não esquecer nada.
              </p>
              <ButtonLink href="/clubes/rotas#planear" variant="dark" size="sm" className="mt-4">
                Planear a viagem
              </ButtonLink>
            </div>
          </aside>
        </div>

        {/* ============ OUTRAS ROTAS ============ */}
        <section className="mt-20 border-t border-white/6 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="title-xl text-3xl">Outras rotas</h2>
            <Link href="/clubes/rotas" className="font-ui text-base text-ink-300 transition-colors hover:text-white">
              Todas as rotas →
            </Link>
          </div>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-3">
            {outras.map((r) => (
              <Link key={r.slug} href={`/clubes/rotas/${r.slug}`} className="group block">
                <Placeholder nome={r.imagem} className="media aspect-[16/10]" tamanhos="(max-width: 640px) 100vw, 33vw" largura={800} />
                <p className="eyebrow mt-3 text-mb-red">{r.regiao}</p>
                <h3 className="mt-1.5 font-display text-xl uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
                  {r.nome}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
