import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder, Retrato } from "@/components/Brand";
import { ButtonLink, Icon, PosicaoBadge, Tag } from "@/components/ui";
import {
  classificacaoPilotos,
  corridas,
  formatData,
  getEquipa,
  getPiloto,
  pilotos,
} from "@/lib/data";

export function generateStaticParams() {
  return pilotos.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPiloto(slug);
  if (!p) return { title: "Piloto não encontrado" };
  return {
    title: `${p.nome} — #${p.numero}`,
    description: `${p.nome}, piloto ${p.categoria} da ${p.equipa}. ${p.estatisticas.vitorias} vitórias e ${p.estatisticas.podios} pódios no motociclismo angolano.`,
  };
}

function iniciais(n: string) {
  return n.split(" ").map((x) => x[0]).slice(0, 2).join("");
}

export default async function PilotoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const piloto = getPiloto(slug);
  if (!piloto) notFound();

  const equipa = getEquipa(piloto.equipaSlug);
  const classificacao = classificacaoPilotos();
  const posicao = classificacao.find((p) => p.slug === piloto.slug)?.posicao ?? 0;
  const lider = classificacao[0];

  const historico = corridas
    .map((c) => ({ corrida: c, resultado: c.resultados.find((r) => r.pilotoSlug === piloto.slug) }))
    .filter((x): x is { corrida: (typeof corridas)[0]; resultado: NonNullable<typeof x.resultado> } =>
      Boolean(x.resultado),
    )
    .reverse();

  const colegas = pilotos.filter((p) => p.equipaSlug === piloto.equipaSlug && p.slug !== piloto.slug);
  const taxaPodio = piloto.estatisticas.corridas
    ? Math.round((piloto.estatisticas.podios / piloto.estatisticas.corridas) * 100)
    : 0;

  return (
    <>
      {/* Hero do piloto */}
      <header className="relative overflow-hidden border-b border-ink-800">
        {/* Fundo: a fotografia do piloto, muito esbatida atrás da ficha */}
        <Placeholder nome={piloto.slug} className="absolute inset-0 opacity-20" tamanhos="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/70 to-ink-950/35" aria-hidden />
        <div className="grid-bg absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <Link
            href="/pilotos"
            className="inline-flex items-center gap-2 font-display text-[11px] uppercase tracking-widest text-ink-500 hover:text-white transition-colors"
          >
            <span aria-hidden>←</span> Todos os pilotos
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[22rem_1fr] lg:items-end">
            {/* Retrato */}
            <div className="relative aspect-[4/5] max-w-xs overflow-hidden border border-ink-700">
              <Retrato
                nome={piloto.slug}
                iniciais={iniciais(piloto.nome)}
                className="absolute inset-0 [container-type:size]"
                cor={equipa?.cor}
              />
              <span className="absolute right-4 top-4 font-display text-7xl leading-none text-white/15">
                {piloto.numero}
              </span>
            </div>

            {/* Identificação */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="red">{piloto.categoria}</Tag>
                <Tag tone="outline">#{piloto.numero}</Tag>
                {piloto.campeonatos > 0 && (
                  <Tag tone="gold">
                    <Icon name="trophy" className="size-3" />
                    {piloto.campeonatos}× Campeão Nacional
                  </Tag>
                )}
              </div>

              <h1 className="title-xl mt-4 text-4xl sm:text-5xl lg:text-6xl">{piloto.nome}</h1>
              {piloto.apelido && (
                <p className="mt-2 font-display text-lg uppercase tracking-wide text-mb-red">
                  “{piloto.apelido}”
                </p>
              )}

              <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
                {[
                  ["Equipa", piloto.equipa],
                  ["Província", piloto.provincia],
                  ["Idade", `${piloto.idade} anos`],
                  ["Mota", piloto.mota],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="eyebrow text-ink-600">{k}</dt>
                    <dd className="mt-1 text-sm text-white">{v}</dd>
                  </div>
                ))}
              </dl>

              {/* Redes sociais */}
              {(piloto.redes.instagram || piloto.redes.facebook) && (
                <div className="mt-7 flex gap-2">
                  {piloto.redes.instagram && (
                    <a
                      href={piloto.redes.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 border border-ink-700 px-4 font-display text-[11px] uppercase tracking-widest text-ink-300 transition-colors hover:border-mb-red hover:text-white"
                    >
                      <Icon name="instagram" className="size-4" />
                      Instagram
                    </a>
                  )}
                  {piloto.redes.facebook && (
                    <a
                      href={piloto.redes.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 border border-ink-700 px-4 font-display text-[11px] uppercase tracking-widest text-ink-300 transition-colors hover:border-mb-red hover:text-white"
                    >
                      <Icon name="facebook" className="size-4" />
                      Facebook
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Faixa de estatísticas */}
      <section className="border-b border-ink-800 bg-ink-900">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-ink-800 px-4 sm:grid-cols-3 lg:grid-cols-6 sm:px-6">
          {[
            ["Posição", posicao > 0 ? `${posicao}.º` : "—"],
            ["Pontos", piloto.estatisticas.pontos],
            ["Vitórias", piloto.estatisticas.vitorias],
            ["Pódios", piloto.estatisticas.podios],
            ["Poles", piloto.estatisticas.poles],
            ["Corridas", piloto.estatisticas.corridas],
          ].map(([k, v]) => (
            <div key={k as string} className="px-4 py-6 text-center">
              <p className="font-display text-3xl text-white tabular-nums">{v}</p>
              <p className="eyebrow mt-1.5 text-ink-500">{k}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-10">
            {/* Biografia */}
            <section>
              <h2 className="eyebrow accent-bar text-white">Perfil</h2>
              <p className="text-base text-ink-300 leading-relaxed">{piloto.bio}</p>
            </section>

            {/* Histórico */}
            {historico.length > 0 && (
              <section>
                <h2 className="eyebrow accent-bar text-white">Histórico de corridas</h2>
                <div className="card overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr_7rem_7rem_3.5rem_3.5rem] items-center gap-3 border-b border-ink-800 bg-ink-950 px-5 py-2.5">
                    {["Prova", "Data", "Categoria", "Pos", "Pts"].map((h) => (
                      <span key={h} className="eyebrow text-ink-600">
                        {h}
                      </span>
                    ))}
                  </div>
                  {historico.map(({ corrida, resultado }) => (
                    <Link
                      key={corrida.slug}
                      href={`/resultados/${corrida.slug}`}
                      className="group grid grid-cols-[1fr_3.5rem_3.5rem] sm:grid-cols-[1fr_7rem_7rem_3.5rem_3.5rem] items-center gap-3 border-b border-ink-800 px-5 py-3.5 last:border-0 hover:bg-ink-850 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white group-hover:text-mb-red transition-colors">
                          {corrida.nome}
                        </p>
                        <p className="truncate text-xs text-ink-600">
                          {corrida.circuito}
                          <span className="sm:hidden"> · {formatData(corrida.data, { day: "2-digit", month: "short" })}</span>
                        </p>
                      </div>
                      <p className="hidden sm:block text-xs text-ink-500">
                        {formatData(corrida.data, { day: "2-digit", month: "short", year: "2-digit" })}
                      </p>
                      <p className="hidden sm:block text-xs text-ink-500">{corrida.categoria}</p>
                      <PosicaoBadge posicao={resultado.posicao} size="sm" />
                      <p className="text-right font-display text-sm text-white tabular-nums">
                        {resultado.pontos}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Barra lateral */}
          <aside className="space-y-5">
            {/* Campeonato */}
            <div className="card p-5">
              <h3 className="eyebrow text-mb-red mb-4">No campeonato</h3>
              <div className="flex items-center gap-4">
                <PosicaoBadge posicao={posicao} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl text-white tabular-nums">
                    {piloto.estatisticas.pontos} <span className="text-sm text-ink-500">pts</span>
                  </p>
                  {lider && posicao > 1 && (
                    <p className="text-xs text-ink-500">
                      {lider.estatisticas.pontos - piloto.estatisticas.pontos} pontos do líder
                    </p>
                  )}
                  {posicao === 1 && <p className="text-xs text-gold">Líder do campeonato</p>}
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full bg-ink-800">
                <div
                  className="h-full bg-mb-red"
                  style={{
                    width: `${lider ? (piloto.estatisticas.pontos / lider.estatisticas.pontos) * 100 : 0}%`,
                  }}
                />
              </div>
              <ButtonLink href="/classificacao" variant="outline" size="sm" className="mt-4 w-full">
                Ver classificação
              </ButtonLink>
            </div>

            {/* Números */}
            <div className="card p-5">
              <h3 className="eyebrow text-mb-red mb-4">Números da carreira</h3>
              <dl className="space-y-3">
                {[
                  ["Estreia", String(piloto.estreia)],
                  ["Temporadas", String(new Date().getFullYear() - piloto.estreia + 1)],
                  ["Melhor resultado", piloto.estatisticas.melhorResultado],
                  ["Taxa de pódio", `${taxaPodio}%`],
                  ["Títulos nacionais", String(piloto.campeonatos)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-ink-800 pb-3 last:border-0 last:pb-0">
                    <dt className="text-xs text-ink-500">{k}</dt>
                    <dd className="text-sm text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Equipa */}
            {equipa && (
              <div className="card p-5">
                <h3 className="eyebrow text-mb-red mb-4">Equipa</h3>
                <Link href={`/equipas/${equipa.slug}`} className="group flex items-center gap-3">
                  <span
                    className="grid size-12 shrink-0 place-items-center font-display text-sm text-white"
                    style={{ background: equipa.cor }}
                  >
                    {equipa.logo}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base uppercase text-white group-hover:text-mb-red transition-colors">
                      {equipa.nome}
                    </p>
                    <p className="truncate text-xs text-ink-500">{equipa.base}</p>
                  </div>
                </Link>

                {colegas.length > 0 && (
                  <>
                    <p className="eyebrow mt-5 mb-2.5 text-ink-600">Colegas de equipa</p>
                    <div className="space-y-2">
                      {colegas.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/pilotos/${c.slug}`}
                          className="group flex items-center gap-2.5"
                        >
                          <Retrato
                            nome={c.slug}
                            iniciais={iniciais(c.nome)}
                            className="size-8 shrink-0 rounded-full [container-type:size]"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm text-ink-300 group-hover:text-white transition-colors">
                            {c.nome}
                          </span>
                          <span className="text-xs text-ink-600 tabular-nums">
                            {c.estatisticas.pontos}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Seguir */}
            <div className="card p-5">
              <h3 className="eyebrow text-mb-red mb-2">Seguir este piloto</h3>
              <p className="text-sm text-ink-400 leading-relaxed">
                Receba uma notificação sempre que {piloto.nome.split(" ")[0]} corre, pontua ou sobe ao
                pódio.
              </p>
              <ButtonLink href="/conta" className="mt-4 w-full">
                <Icon name="bell" className="size-4" />
                Seguir
              </ButtonLink>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
