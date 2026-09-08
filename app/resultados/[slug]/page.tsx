import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/Brand";
import { ButtonLink, Icon, PosicaoBadge, Tag } from "@/components/ui";
import { corridas, formatData, getEvento } from "@/lib/data";

export function generateStaticParams() {
  return corridas.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = corridas.find((x) => x.slug === slug);
  if (!c) return { title: "Resultado não encontrado" };
  return {
    title: `${c.nome} ${c.temporada} — ${c.categoria}`,
    description: `Resultado completo do ${c.nome} de ${c.temporada}, categoria ${c.categoria}. Vencedor: ${c.vencedor}.`,
  };
}

export default async function ResultadoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const corrida = corridas.find((c) => c.slug === slug);
  if (!corrida) notFound();

  const evento = getEvento(corrida.eventoSlug);
  const outrasCategorias = corridas.filter(
    (c) => c.eventoSlug === corrida.eventoSlug && c.slug !== corrida.slug,
  );
  const classificados = corrida.resultados.filter((r) => !r.estado);
  const melhorVolta = corrida.resultados.find((r) => r.melhorVolta);

  return (
    <>
      <header className="relative overflow-hidden border-b border-ink-800">
        <Placeholder nome={[corrida.slug, corrida.imagem]} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <Link
            href="/resultados"
            className="inline-flex items-center gap-2 font-display text-[11px] uppercase tracking-widest text-ink-400 hover:text-white transition-colors"
          >
            <span aria-hidden>←</span> Arquivo de resultados
          </Link>

          <div className="mt-6 flex flex-wrap gap-2">
            <Tag tone="red">Ronda {corrida.ronda}</Tag>
            <Tag tone="outline">{corrida.categoria}</Tag>
            <Tag tone="neutral">{corrida.temporada}</Tag>
          </div>

          <h1 className="title-xl mt-4 text-4xl sm:text-5xl">{corrida.nome}</h1>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-300">
            <span className="inline-flex items-center gap-2">
              <Icon name="pin" className="size-4 text-mb-red" />
              {corrida.circuito}, {corrida.provincia}
            </span>
            <span className="inline-flex items-center gap-2">
              <Icon name="calendar" className="size-4 text-mb-red" />
              {formatData(corrida.data)}
            </span>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {/* Pódio */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {classificados.slice(0, 3).map((r) => (
            <Link
              key={r.pilotoSlug}
              href={`/pilotos/${r.pilotoSlug}`}
              className={`group card card-hover p-6 ${r.posicao === 1 ? "border-gold/40" : ""}`}
            >
              <div className="flex items-center gap-4">
                <PosicaoBadge posicao={r.posicao} />
                <div className="min-w-0">
                  <p className="truncate font-display text-xl uppercase text-white group-hover:text-mb-red transition-colors">
                    {r.piloto}
                  </p>
                  <p className="truncate text-xs text-ink-500">{r.equipa}</p>
                </div>
              </div>
              <p className="mt-4 border-t border-ink-800 pt-4 font-mono text-lg text-white tabular-nums">
                {r.tempo}
              </p>
            </Link>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          {/* Tabela completa */}
          <div>
            <h2 className="eyebrow accent-bar text-white">Classificação da corrida</h2>
            <div className="card overflow-hidden">
              <div className="hidden sm:grid grid-cols-[3.5rem_1fr_9rem_4rem_7rem_3.5rem] items-center gap-3 border-b border-ink-800 bg-ink-950 px-5 py-2.5">
                {["Pos", "Piloto", "Equipa", "Voltas", "Tempo", "Pts"].map((h) => (
                  <span key={h} className="eyebrow text-ink-600">
                    {h}
                  </span>
                ))}
              </div>
              {corrida.resultados.map((r) => (
                <Link
                  key={r.pilotoSlug}
                  href={`/pilotos/${r.pilotoSlug}`}
                  className={`group grid grid-cols-[3.5rem_1fr_3.5rem] sm:grid-cols-[3.5rem_1fr_9rem_4rem_7rem_3.5rem] items-center gap-3 border-b border-ink-800 px-5 py-3.5 last:border-0 hover:bg-ink-850 transition-colors ${
                    r.estado ? "opacity-55" : ""
                  }`}
                >
                  <PosicaoBadge posicao={r.posicao} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white group-hover:text-mb-red transition-colors">
                      {r.piloto}
                      {r.melhorVolta && (
                        <span className="ml-2 bg-mb-red/20 px-1.5 text-[9px] font-display uppercase tracking-wider text-mb-red">
                          MV
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-600 sm:hidden">{r.equipa}</p>
                  </div>
                  <p className="hidden sm:block truncate text-xs text-ink-500">{r.equipa}</p>
                  <p className="hidden sm:block font-mono text-xs text-ink-400 tabular-nums">{r.voltas}</p>
                  <p className="hidden sm:block font-mono text-xs text-ink-300 tabular-nums">
                    {r.estado ?? r.tempo}
                  </p>
                  <p className="text-right font-display text-sm text-white tabular-nums">{r.pontos}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Barra lateral */}
          <aside className="space-y-5">
            {melhorVolta && (
              <div className="card border-mb-red/30 bg-mb-red/5 p-5">
                <p className="eyebrow text-mb-red">Melhor volta da corrida</p>
                <p className="mt-2 font-display text-xl uppercase text-white">{melhorVolta.piloto}</p>
                <p className="text-xs text-ink-400">{melhorVolta.equipa}</p>
              </div>
            )}

            <div className="card p-5">
              <h3 className="eyebrow text-mb-red mb-4">Resumo</h3>
              <dl className="space-y-3">
                {[
                  ["Categoria", corrida.categoria],
                  ["Partidas", String(corrida.resultados.length)],
                  ["Classificados", String(classificados.length)],
                  ["Desistências", String(corrida.resultados.length - classificados.length)],
                  ["Circuito", corrida.circuito],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-ink-800 pb-3 last:border-0 last:pb-0">
                    <dt className="text-xs text-ink-500">{k}</dt>
                    <dd className="text-sm text-white text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {outrasCategorias.length > 0 && (
              <div className="card p-5">
                <h3 className="eyebrow text-mb-red mb-3">Outras categorias</h3>
                <div className="space-y-2">
                  {outrasCategorias.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/resultados/${c.slug}`}
                      className="group flex items-center justify-between gap-3 border-b border-ink-800 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-ink-300 group-hover:text-white transition-colors">
                        {c.categoria}
                      </span>
                      <span className="text-xs text-ink-600">{c.vencedor}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {evento && (
              <ButtonLink href={`/calendario/${evento.slug}`} variant="outline" className="w-full">
                Página do evento
              </ButtonLink>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
