import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Retrato } from "@/components/Brand";
import { ButtonLink, Icon, PosicaoBadge, Tag } from "@/components/ui";
import { classificacaoEquipas, equipas, getEquipa, pilotos } from "@/lib/data";

export function generateStaticParams() {
  return equipas.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getEquipa(slug);
  if (!e) return { title: "Equipa não encontrada" };
  return { title: e.nome, description: e.descricao.slice(0, 155) };
}

function iniciais(n: string) {
  return n.split(" ").map((x) => x[0]).slice(0, 2).join("");
}

export default async function EquipaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const equipa = getEquipa(slug);
  if (!equipa) notFound();

  const seus = pilotos.filter((p) => p.equipaSlug === equipa.slug);
  const posicao = classificacaoEquipas().find((e) => e.slug === equipa.slug)?.posicao;
  const outras = equipas.filter((e) => e.tipo === equipa.tipo && e.slug !== equipa.slug).slice(0, 3);

  return (
    <>
      <header className="relative overflow-hidden border-b border-ink-800">
        <div
          className="absolute inset-0 opacity-25"
          style={{ background: `linear-gradient(115deg, ${equipa.cor} 0%, transparent 62%)` }}
          aria-hidden
        />
        <div className="grid-bg absolute inset-0 opacity-20" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <Link
            href="/equipas"
            className="inline-flex items-center gap-2 font-display text-[11px] uppercase tracking-widest text-ink-400 hover:text-white transition-colors"
          >
            <span aria-hidden>←</span> Equipas e clubes
          </Link>

          <div className="mt-7 flex flex-wrap items-start gap-6">
            <span
              className="grid size-24 shrink-0 place-items-center font-display text-2xl text-white"
              style={{ background: equipa.cor }}
            >
              {equipa.logo}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="outline">{equipa.tipo}</Tag>
                {posicao && <Tag tone={posicao <= 3 ? "red" : "neutral"}>{posicao}.º no campeonato</Tag>}
                {equipa.estatisticas.titulos > 0 && (
                  <Tag tone="gold">
                    <Icon name="trophy" className="size-3" />
                    {equipa.estatisticas.titulos}× Campeã Nacional
                  </Tag>
                )}
              </div>

              <h1 className="title-xl mt-3 text-4xl sm:text-5xl lg:text-6xl">{equipa.nome}</h1>

              <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
                {[
                  ["Base", equipa.base],
                  ["Fundação", String(equipa.fundacao)],
                  ["Responsável", equipa.chefe],
                  ["Membros", String(equipa.membros)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="eyebrow text-ink-600">{k}</dt>
                    <dd className="mt-1 text-sm text-white">{v}</dd>
                  </div>
                ))}
              </dl>

              {(equipa.redes.instagram || equipa.redes.facebook) && (
                <div className="mt-6 flex gap-2">
                  {equipa.redes.instagram && (
                    <a
                      href={equipa.redes.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid size-10 place-items-center border border-ink-700 text-ink-300 transition-colors hover:border-mb-red hover:text-white"
                      aria-label="Instagram"
                    >
                      <Icon name="instagram" className="size-4.5" />
                    </a>
                  )}
                  {equipa.redes.facebook && (
                    <a
                      href={equipa.redes.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid size-10 place-items-center border border-ink-700 text-ink-300 transition-colors hover:border-mb-red hover:text-white"
                      aria-label="Facebook"
                    >
                      <Icon name="facebook" className="size-4.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Estatísticas */}
      {equipa.estatisticas.pontos > 0 && (
        <section className="border-b border-ink-800 bg-ink-900">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-ink-800 px-4 sm:grid-cols-4 sm:px-6">
            {[
              ["Pontos", equipa.estatisticas.pontos],
              ["Vitórias", equipa.estatisticas.vitorias],
              ["Pódios", equipa.estatisticas.podios],
              ["Títulos", equipa.estatisticas.titulos],
            ].map(([k, v]) => (
              <div key={k as string} className="px-4 py-6 text-center">
                <p className="font-display text-3xl text-white tabular-nums">{v}</p>
                <p className="eyebrow mt-1.5 text-ink-500">{k}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-10">
            <section>
              <h2 className="eyebrow accent-bar text-white">Sobre</h2>
              <p className="text-base text-ink-300 leading-relaxed">{equipa.descricao}</p>
            </section>

            {seus.length > 0 && (
              <section>
                <h2 className="eyebrow accent-bar text-white">Pilotos</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {seus.map((p) => (
                    <Link key={p.slug} href={`/pilotos/${p.slug}`} className="group card card-hover overflow-hidden">
                      <div className="relative aspect-[16/10]">
                        <Retrato
                          nome={p.slug}
                          iniciais={iniciais(p.nome)}
                          cor={equipa.cor}
                          className="absolute inset-0 [container-type:size] transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute right-3 top-3 font-display text-4xl leading-none text-white/15">
                          {p.numero}
                        </span>
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <p className="eyebrow text-mb-red">{p.categoria}</p>
                          <p className="mt-1 font-display text-lg uppercase text-white group-hover:text-mb-red transition-colors">
                            {p.nome}
                          </p>
                        </div>
                      </div>
                      <dl className="grid grid-cols-3 divide-x divide-ink-800 border-t border-ink-800">
                        {[
                          ["Pts", p.estatisticas.pontos],
                          ["Vit", p.estatisticas.vitorias],
                          ["Pód", p.estatisticas.podios],
                        ].map(([k, v]) => (
                          <div key={k as string} className="p-2.5 text-center">
                            <dd className="font-display text-base text-white tabular-nums">{v}</dd>
                            <dt className="eyebrow text-ink-600">{k}</dt>
                          </div>
                        ))}
                      </dl>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <div className="card p-5">
              <h3 className="eyebrow text-mb-red mb-4">Ficha</h3>
              <dl className="space-y-3">
                {[
                  ["Tipo", equipa.tipo],
                  ["Província", equipa.provincia],
                  ["Fundação", String(equipa.fundacao)],
                  ["Membros", String(equipa.membros)],
                  ["Material", equipa.motas.join(", ")],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-ink-800 pb-3 last:border-0 last:pb-0">
                    <dt className="shrink-0 text-xs text-ink-500">{k}</dt>
                    <dd className="text-sm text-white text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {posicao && (
              <div className="card p-5">
                <h3 className="eyebrow text-mb-red mb-4">No campeonato</h3>
                <div className="flex items-center gap-4">
                  <PosicaoBadge posicao={posicao} />
                  <div>
                    <p className="font-display text-2xl text-white tabular-nums">
                      {equipa.estatisticas.pontos} <span className="text-sm text-ink-500">pts</span>
                    </p>
                    <p className="text-xs text-ink-500">Classificação de equipas</p>
                  </div>
                </div>
                <ButtonLink href="/classificacao" variant="outline" size="sm" className="mt-4 w-full">
                  Tabela completa
                </ButtonLink>
              </div>
            )}

            {outras.length > 0 && (
              <div className="card p-5">
                <h3 className="eyebrow text-mb-red mb-3">
                  {equipa.tipo === "Equipa" ? "Outras equipas" : "Outros clubes"}
                </h3>
                <div className="space-y-2.5">
                  {outras.map((o) => (
                    <Link key={o.slug} href={`/equipas/${o.slug}`} className="group flex items-center gap-3">
                      <span
                        className="grid size-9 shrink-0 place-items-center font-display text-[10px] text-white"
                        style={{ background: o.cor }}
                      >
                        {o.logo}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-300 group-hover:text-white transition-colors">
                        {o.nome}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
