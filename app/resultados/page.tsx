import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { EmptyState, Icon, PageHero, PosicaoBadge, Tag } from "@/components/ui";
import { TEMPORADA, formatData } from "@/lib/data";
import { lerCorridas } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Arquivo de Resultados",
  description:
    "Arquivo completo de resultados do motociclismo angolano, corrida a corrida, com tempos, pontos e melhores voltas.",
};

export default async function ResultadosPage() {
  const corridas = await lerCorridas();
  const porTemporada = corridas.reduce<Record<number, typeof corridas>>((acc, c) => {
    (acc[c.temporada] ??= []).push(c);
    return acc;
  }, {});
  const temporadas = Object.keys(porTemporada).map(Number).sort((a, b) => b - a);

  return (
    <>
      <PageHero
        imagem="resultados"
        eyebrow="Arquivo histórico"
        titulo="Resultados"
        descricao="Todos os resultados das provas do calendário nacional, corrida a corrida. Tempos, pontos, melhores voltas e desistências."
      >
        <div className="flex flex-wrap gap-8">
          {[
            { v: corridas.length, l: "Corridas registadas" },
            { v: new Set(corridas.map((c) => c.vencedor)).size, l: "Vencedores diferentes" },
            { v: temporadas.length, l: "Temporadas" },
          ].map((s) => (
            <div key={s.l}>
              <p className="font-display text-3xl text-white">{s.v}</p>
              <p className="eyebrow mt-1 text-ink-500">{s.l}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {temporadas.length === 0 && (
          <EmptyState
            titulo="Sem resultados publicados"
            descricao="Os resultados aparecem aqui assim que a primeira corrida da temporada terminar."
          />
        )}
        {temporadas.map((t) => (
          <section key={t} className="mb-14 last:mb-0">
            <div className="mb-6 flex items-center gap-4">
              <h2 className="title-xl text-3xl">Temporada {t}</h2>
              <span className="h-px flex-1 bg-white/6" aria-hidden />
              {t === TEMPORADA && <Tag tone="red">Em curso</Tag>}
            </div>

            <div>
              {porTemporada[t]
                .sort((a, b) => a.ronda - b.ronda || a.categoria.localeCompare(b.categoria))
                .map((c) => (
                  <article
                    key={c.slug}
                    className="grid gap-6 border-b border-white/6 py-8 first:pt-0 last:border-0 last:pb-0 lg:grid-cols-[18rem_1fr] lg:gap-10"
                  >
                    {/* Cabeçalho da corrida: fotografia arredondada, texto sobre o véu */}
                    <div className="relative isolate flex min-h-[15rem] flex-col justify-end overflow-hidden rounded-card p-5 lg:self-start">
                      <Placeholder nome={[c.slug, c.imagem]} className="absolute inset-0 -z-20" tamanhos="(max-width: 1024px) 100vw, 288px" />
                      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/10" aria-hidden />
                      <div className="flex flex-wrap gap-2">
                        <Tag tone="red">Ronda {c.ronda}</Tag>
                        <Tag tone="outline">{c.categoria}</Tag>
                      </div>
                      <h3 className="mt-3 font-display text-xl uppercase leading-tight text-white">
                        {c.nome}
                      </h3>
                      <p className="mt-2 text-xs text-ink-300">
                        {c.circuito}, {c.provincia}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">{formatData(c.data)}</p>

                      <div className="mt-4 border-t border-white/15 pt-4">
                        <p className="eyebrow text-ink-400">Vencedor</p>
                        <p className="mt-1 font-display text-lg uppercase text-mb-red">
                          {c.vencedor}
                        </p>
                      </div>
                    </div>

                    {/* Tabela de resultados: linhas finas, sem caixa */}
                    <div>
                      <div className="hidden sm:grid grid-cols-[3rem_1fr_8rem_6rem_3.5rem] items-center gap-3 border-b border-white/10 pb-3">
                        {["Pos", "Piloto", "Equipa", "Tempo", "Pts"].map((h) => (
                          <span key={h} className="eyebrow text-ink-500">
                            {h}
                          </span>
                        ))}
                      </div>

                      {c.resultados.map((r) => (
                        <Link
                          key={r.pilotoSlug}
                          href={`/pilotos/${r.pilotoSlug}`}
                          className={`group grid grid-cols-[3rem_1fr_3.5rem] sm:grid-cols-[3rem_1fr_8rem_6rem_3.5rem] items-center gap-3 border-b border-white/6 py-3 last:border-0 ${
                            r.estado ? "opacity-55" : ""
                          }`}
                        >
                          <PosicaoBadge posicao={r.posicao} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white group-hover:text-mb-red transition-colors">
                              {r.piloto}
                              {r.melhorVolta && (
                                <span
                                  className="ml-2 inline-block rounded-full bg-mb-red/20 px-1.5 py-px text-[9px] font-display uppercase tracking-wider text-mb-red"
                                  title="Melhor volta"
                                >
                                  MV
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-ink-600 sm:hidden">{r.equipa}</p>
                          </div>
                          <p className="hidden sm:block truncate text-xs text-ink-500">{r.equipa}</p>
                          <p className="hidden sm:block font-mono text-xs text-ink-300 tabular-nums">
                            {r.estado ?? r.tempo}
                          </p>
                          <p className="text-right font-display text-sm text-white tabular-nums">
                            {r.pontos}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}

        <p className="mt-10 flex items-center gap-2 text-xs text-ink-600">
          <Icon name="flag" className="size-4" />
          MV: melhor volta da corrida · DNF: não terminou · DNS: não partiu · DSQ: desclassificado
        </p>
      </div>
    </>
  );
}
