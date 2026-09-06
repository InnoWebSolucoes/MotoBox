import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/Brand";
import { Countdown } from "@/components/Countdown";
import { ButtonLink, Icon, PosicaoBadge, Tag } from "@/components/ui";
import { corridas, eventos, formatData, formatKz, getEvento } from "@/lib/data";

export function generateStaticParams() {
  return eventos.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getEvento(slug);
  if (!e) return { title: "Evento não encontrado" };
  return { title: e.titulo, description: e.resumo };
}

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const evento = getEvento(slug);
  if (!evento) notFound();

  const futuro = new Date(evento.dataInicio).getTime() > Date.now();
  const resultados = corridas.filter((c) => c.eventoSlug === evento.slug);
  const dias = [...new Set(evento.horarios.map((h) => h.dia))];

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-ink-800">
        <Placeholder nome={evento.imagem} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <Link
            href="/calendario"
            className="inline-flex items-center gap-2 font-display text-[11px] uppercase tracking-widest text-ink-400 hover:text-white transition-colors"
          >
            <span aria-hidden>←</span> Calendário
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {evento.ronda && <Tag tone="red">Ronda {evento.ronda}</Tag>}
            <Tag tone="outline">{evento.disciplina}</Tag>
            <Tag tone="neutral">{evento.temporada}</Tag>
          </div>

          <h1 className="title-xl mt-4 max-w-4xl text-4xl sm:text-5xl lg:text-6xl">{evento.titulo}</h1>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-300">
            <span className="inline-flex items-center gap-2">
              <Icon name="pin" className="size-4 text-mb-red" />
              {evento.circuito}, {evento.localidade} — {evento.provincia}
            </span>
            <span className="inline-flex items-center gap-2">
              <Icon name="calendar" className="size-4 text-mb-red" />
              {formatData(evento.dataInicio)} a {formatData(evento.dataFim)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Icon name="flag" className="size-4 text-mb-red" />
              {evento.organizador}
            </span>
          </div>

          {futuro && (
            <div className="mt-9 flex flex-wrap items-end gap-8">
              <div>
                <p className="eyebrow text-ink-500 mb-3">Começa em</p>
                <Countdown data={evento.dataInicio} size="lg" />
              </div>
              {evento.bilhetes && (
                <ButtonLink href={`/bilhetes/${evento.slug}`} size="lg">
                  <Icon name="ticket" className="size-5" />
                  Comprar bilhetes
                </ButtonLink>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          {/* Coluna principal */}
          <div className="space-y-10">
            <section>
              <h2 className="eyebrow accent-bar text-white">Sobre a prova</h2>
              <p className="text-base text-ink-300 leading-relaxed">{evento.descricao}</p>
            </section>

            {/* Horários */}
            <section>
              <h2 className="eyebrow accent-bar text-white">Programa</h2>
              <div className="space-y-6">
                {dias.map((dia) => (
                  <div key={dia}>
                    <p className="font-display text-lg uppercase text-mb-red mb-3">{dia}</p>
                    <div className="card divide-y divide-ink-800">
                      {evento.horarios
                        .filter((h) => h.dia === dia)
                        .map((h, i) => (
                          <div key={i} className="flex items-center gap-5 p-4">
                            <span className="font-mono text-sm text-white tabular-nums w-14 shrink-0">
                              {h.hora}
                            </span>
                            <span className="h-8 w-px bg-ink-700 shrink-0" />
                            <span className="text-sm text-ink-300">{h.sessao}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Resultados, se já disputado */}
            {resultados.length > 0 && (
              <section>
                <h2 className="eyebrow accent-bar text-white">Resultados</h2>
                <div className="space-y-6">
                  {resultados.map((c) => (
                    <div key={c.slug}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-display text-lg uppercase text-white">{c.categoria}</p>
                        <Link
                          href={`/resultados/${c.slug}`}
                          className="eyebrow text-mb-red hover:text-mb-red-light"
                        >
                          Detalhe →
                        </Link>
                      </div>
                      <div className="card overflow-hidden">
                        <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-4 border-b border-ink-800 bg-ink-950 px-4 py-2.5">
                          {["Pos", "Piloto", "Tempo", "Pts"].map((h) => (
                            <span key={h} className="eyebrow text-ink-600">
                              {h}
                            </span>
                          ))}
                        </div>
                        {c.resultados.map((r) => (
                          <div
                            key={r.pilotoSlug}
                            className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b border-ink-800 px-4 py-3 last:border-0"
                          >
                            <PosicaoBadge posicao={r.posicao} size="sm" />
                            <Link href={`/pilotos/${r.pilotoSlug}`} className="min-w-0 group">
                              <p className="truncate text-sm text-white group-hover:text-mb-red transition-colors">
                                {r.piloto}
                                {r.melhorVolta && (
                                  <span className="ml-2 text-[10px] text-mb-red">MV</span>
                                )}
                              </p>
                              <p className="truncate text-xs text-ink-600">{r.equipa}</p>
                            </Link>
                            <span className="hidden sm:block font-mono text-xs text-ink-400 tabular-nums">
                              {r.estado ?? r.tempo}
                            </span>
                            <span className="font-display text-sm text-white tabular-nums">{r.pontos}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Barra lateral */}
          <aside className="space-y-5">
            {/* Ficha do circuito */}
            <div className="card p-5">
              <h3 className="eyebrow text-mb-red mb-4">Ficha do circuito</h3>
              <dl className="space-y-3.5">
                {[
                  ["Circuito", evento.circuito],
                  ["Localidade", `${evento.localidade}, ${evento.provincia}`],
                  evento.distanciaVolta && ["Distância", evento.distanciaVolta],
                  evento.numeroVoltas && ["Voltas", String(evento.numeroVoltas)],
                  ["Disciplina", evento.disciplina],
                ]
                  .filter((x): x is [string, string] => Boolean(x))
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-ink-800 pb-3 last:border-0 last:pb-0">
                      <dt className="text-xs text-ink-500">{k}</dt>
                      <dd className="text-sm text-white text-right">{v}</dd>
                    </div>
                  ))}
              </dl>

              {evento.recordeVolta && (
                <div className="mt-5 border border-mb-red/30 bg-mb-red/5 p-4">
                  <p className="eyebrow text-mb-red">Recorde de volta</p>
                  <p className="mt-1.5 font-mono text-xl text-white tabular-nums">
                    {evento.recordeVolta.tempo}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {evento.recordeVolta.piloto} · {evento.recordeVolta.ano}
                  </p>
                </div>
              )}
            </div>

            {/* Bilhetes */}
            {evento.bilhetes && (
              <div className="card p-5">
                <h3 className="eyebrow text-mb-red mb-4">Bilhetes</h3>
                <div className="space-y-2.5">
                  {evento.bilhetes.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 border-b border-ink-800 pb-2.5 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{b.nome}</p>
                        <p className="text-xs text-ink-600">{b.disponiveis} disponíveis</p>
                      </div>
                      <span className="font-display text-sm text-white shrink-0">{formatKz(b.preco)}</span>
                    </div>
                  ))}
                </div>
                <ButtonLink href={`/bilhetes/${evento.slug}`} className="mt-5 w-full">
                  <Icon name="ticket" className="size-4" />
                  Comprar
                </ButtonLink>
              </div>
            )}

            {/* Partilhar */}
            <div className="card p-5">
              <h3 className="eyebrow text-mb-red mb-3">Partilhar</h3>
              <div className="flex gap-2">
                {(["whatsapp", "facebook", "instagram", "share"] as const).map((r) => (
                  <span
                    key={r}
                    className="grid size-10 cursor-pointer place-items-center border border-ink-700 text-ink-400 transition-colors hover:border-mb-red hover:text-white"
                  >
                    <Icon name={r} className="size-4.5" />
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
