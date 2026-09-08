import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { Icon, PageHero, PosicaoBadge, Tag } from "@/components/ui";
import { TEMPORADA, corridas, formatData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Arquivo de Resultados",
  description:
    "Arquivo completo de resultados do motociclismo angolano — corrida a corrida, com tempos, pontos e melhores voltas.",
};

export default function ResultadosPage() {
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
        {temporadas.map((t) => (
          <section key={t} className="mb-14 last:mb-0">
            <div className="mb-6 flex items-center gap-4">
              <h2 className="title-xl text-3xl">Temporada {t}</h2>
              <span className="h-px flex-1 bg-ink-800" aria-hidden />
              {t === TEMPORADA && <Tag tone="red">Em curso</Tag>}
            </div>

            <div className="space-y-4">
              {porTemporada[t]
                .sort((a, b) => a.ronda - b.ronda || a.categoria.localeCompare(b.categoria))
                .map((c) => (
                  <article key={c.slug} className="card overflow-hidden">
                    <div className="grid lg:grid-cols-[16rem_1fr]">
                      {/* Cabeçalho da corrida */}
                      <div className="relative border-b lg:border-b-0 lg:border-r border-ink-800 p-5">
                        <Placeholder nome={[c.slug, c.imagem]} className="absolute inset-0 opacity-40" />
                        <div className="relative">
                          <div className="flex flex-wrap gap-2">
                            <Tag tone="red">Ronda {c.ronda}</Tag>
                            <Tag tone="outline">{c.categoria}</Tag>
                          </div>
                          <h3 className="mt-3 font-display text-xl uppercase leading-tight text-white">
                            {c.nome}
                          </h3>
                          <p className="mt-2 text-xs text-ink-400">
                            {c.circuito}, {c.provincia}
                          </p>
                          <p className="mt-1 text-xs text-ink-500">{formatData(c.data)}</p>

                          <div className="mt-4 border-t border-ink-800 pt-4">
                            <p className="eyebrow text-ink-600">Vencedor</p>
                            <p className="mt-1 font-display text-lg uppercase text-mb-red">
                              {c.vencedor}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tabela de resultados */}
                      <div>
                        <div className="hidden sm:grid grid-cols-[3rem_1fr_8rem_6rem_3.5rem] items-center gap-3 border-b border-ink-800 bg-ink-950 px-5 py-2.5">
                          {["Pos", "Piloto", "Equipa", "Tempo", "Pts"].map((h) => (
                            <span key={h} className="eyebrow text-ink-600">
                              {h}
                            </span>
                          ))}
                        </div>

                        {c.resultados.map((r) => (
                          <Link
                            key={r.pilotoSlug}
                            href={`/pilotos/${r.pilotoSlug}`}
                            className={`group grid grid-cols-[3rem_1fr_3.5rem] sm:grid-cols-[3rem_1fr_8rem_6rem_3.5rem] items-center gap-3 border-b border-ink-800 px-5 py-3 last:border-0 hover:bg-ink-850 transition-colors ${
                              r.estado ? "opacity-55" : ""
                            }`}
                          >
                            <PosicaoBadge posicao={r.posicao} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white group-hover:text-mb-red transition-colors">
                                {r.piloto}
                                {r.melhorVolta && (
                                  <span
                                    className="ml-2 inline-block bg-mb-red/20 px-1.5 text-[9px] font-display uppercase tracking-wider text-mb-red"
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
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}

        <p className="mt-10 flex items-center gap-2 text-xs text-ink-600">
          <Icon name="flag" className="size-4" />
          MV — melhor volta da corrida · DNF — não terminou · DNS — não partiu · DSQ — desclassificado
        </p>
      </div>
    </>
  );
}
