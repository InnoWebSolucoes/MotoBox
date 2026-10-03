/* Página de um evento, partilhada por /calendario/[slug] (provas) e
   /eventos/[slug] (passeios, encontros, acções solidárias, formações).
   Muda só o que não faz sentido fora da pista: ronda, ficha do circuito,
   resultados e o caminho de volta. Os bilhetes funcionam nos dois.

   Só há compra quando `vendaBilhetes` o diz. Sem venda, o cartão
   "Participação" diz como se participa (o campo `entrada`) ou, sem ele,
   manda confirmar com o organizador: nunca se dá o evento por gratuito. */

import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { Countdown } from "@/components/Countdown";
import { ButtonLink, Icon, PosicaoBadge, Tag } from "@/components/ui";
import { formatData, formatKz } from "@/lib/data";
import { eComunidade, entradaDoEvento, instante, vendaBilhetes } from "@/lib/desporto";
import type { Corrida, Evento } from "@/lib/types";

export function DetalheEvento({
  evento,
  resultados,
  bilheteiraAberta,
}: {
  evento: Evento;
  resultados: Corrida[];
  bilheteiraAberta: boolean;
}) {
  const comunidade = eComunidade(evento.disciplina);
  const agora = instante();
  const futuro = new Date(evento.dataInicio).getTime() > agora;
  const terminado = evento.estado === "concluido" || new Date(evento.dataFim).getTime() < agora;
  const venda = vendaBilhetes(evento, bilheteiraAberta, agora);
  const entrada = entradaDoEvento(evento);
  // Tem bilhetes mas a bilheteira está fechada nas Definições.
  const vendaFechada = !bilheteiraAberta && (evento.bilhetes?.length ?? 0) > 0;
  const dias = [...new Set(evento.horarios.map((h) => h.dia))];
  const local = [evento.circuito, evento.localidade, evento.provincia].filter(Boolean).join(", ");

  const ficha: [string, string][] = comunidade
    ? [
        ["Local", evento.circuito],
        ["Localidade", [evento.localidade, evento.provincia].filter(Boolean).join(", ")],
        ["Tipo", evento.disciplina],
        ["Organizador", evento.organizador],
      ]
    : ([
        ["Circuito", evento.circuito],
        ["Localidade", `${evento.localidade}, ${evento.provincia}`],
        evento.distanciaVolta && ["Distância", evento.distanciaVolta],
        evento.numeroVoltas && ["Voltas", String(evento.numeroVoltas)],
        ["Disciplina", evento.disciplina],
      ].filter((x): x is [string, string] => Boolean(x)));

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden">
        <Placeholder nome={[evento.slug, evento.imagem]} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/60 to-ink-950/25" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <Link
            href={comunidade ? "/eventos" : "/calendario"}
            className="inline-flex items-center gap-2 font-ui text-sm text-ink-200 [text-shadow:0_1px_6px_rgb(0_0_0/0.6)] hover:text-white transition-colors"
          >
            <span aria-hidden>←</span> {comunidade ? "Eventos" : "Calendário"}
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {!comunidade && evento.ronda ? <Tag tone="red">Ronda {evento.ronda}</Tag> : null}
            <Tag tone={comunidade ? "red" : "outline"}>{evento.disciplina}</Tag>
            <Tag tone="neutral">{evento.temporada}</Tag>
          </div>

          <h1 className="title-xl mt-4 max-w-4xl text-4xl sm:text-5xl lg:text-6xl">{evento.titulo}</h1>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-300">
            <span className="inline-flex items-center gap-2">
              <Icon name="pin" className="size-4 text-mb-red" />
              {local}
            </span>
            <span className="inline-flex items-center gap-2">
              <Icon name="calendar" className="size-4 text-mb-red" />
              {formatData(evento.dataInicio)} a {formatData(evento.dataFim)}
            </span>
            {evento.organizador && (
              <span className="inline-flex items-center gap-2">
                <Icon name="flag" className="size-4 text-mb-red" />
                {evento.organizador}
              </span>
            )}
            {!venda && entrada && !terminado && (
              <span className="inline-flex items-center gap-2">
                <Icon name="ticket" className="size-4 text-mb-red" />
                {entrada}
              </span>
            )}
          </div>

          {futuro && (
            <div className="mt-9 flex flex-wrap items-end gap-8">
              <div>
                <p className="eyebrow text-ink-500 mb-3">Começa em</p>
                <Countdown data={evento.dataInicio} size="lg" />
              </div>
              {venda === "a-venda" && (
                <ButtonLink href={`/bilhetes/${evento.slug}`} size="lg">
                  <Icon name="ticket" className="size-5" />
                  Comprar bilhetes
                </ButtonLink>
              )}
              {venda === "esgotado" && (
                <span className="inline-flex h-13 items-center gap-2 rounded-full bg-ink-800 px-8 font-ui text-lg text-ink-300">
                  <Icon name="ticket" className="size-5" />
                  Esgotado
                </span>
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
              <h2 className="eyebrow accent-bar text-white">{comunidade ? "Sobre o evento" : "Sobre a prova"}</h2>
              <p className="text-base text-ink-300 leading-relaxed">{evento.descricao}</p>
            </section>

            {/* Horários, se o organizador já os publicou */}
            {dias.length > 0 && (
              <section>
                <h2 className="eyebrow accent-bar text-white">Programa</h2>
                <div className="space-y-6">
                  {dias.map((dia) => (
                    <div key={dia}>
                      <p className="font-display text-lg uppercase text-mb-red mb-3">{dia}</p>
                      <div>
                        {evento.horarios
                          .filter((h) => h.dia === dia)
                          .map((h, i) => (
                            <div key={i} className="flex items-center gap-5 border-b border-white/6 py-3.5 last:border-0">
                              <span className="font-mono text-sm text-white tabular-nums w-14 shrink-0">
                                {h.hora}
                              </span>
                              <span className="h-5 w-0.5 rounded-full bg-mb-red/60 shrink-0" />
                              <span className="text-sm text-ink-300">{h.sessao}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                          className="font-ui text-sm text-mb-red hover:text-mb-red-light transition-colors"
                        >
                          Detalhe →
                        </Link>
                      </div>
                      <div>
                        <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-4 border-b border-white/10 pb-2.5">
                          {["Pos", "Piloto", "Tempo", "Pts"].map((h) => (
                            <span key={h} className="eyebrow text-ink-500">
                              {h}
                            </span>
                          ))}
                        </div>
                        {c.resultados.map((r) => (
                          <div
                            key={r.pilotoSlug}
                            className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b border-white/6 py-3 last:border-0"
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
            {/* Ficha do circuito, ou do local no caso de um evento da comunidade */}
            <div className="card p-5">
              <h3 className="eyebrow text-mb-red mb-4">{comunidade ? "Local e organização" : "Ficha do circuito"}</h3>
              <dl className="space-y-3.5">
                {ficha
                  .filter(([, v]) => Boolean(v))
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-white/6 pb-3 last:border-0 last:pb-0">
                      <dt className="text-xs text-ink-500">{k}</dt>
                      <dd className="text-sm text-white text-right">{v}</dd>
                    </div>
                  ))}
              </dl>

              {!comunidade && evento.recordeVolta && (
                <div className="mt-5 rounded-xl bg-mb-red/10 p-4">
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

            {/* Bilhetes, quando a Motobox os vende; senão, como participar */}
            {venda ? (
              <div className="card p-5">
                <h3 className="eyebrow text-mb-red mb-4">Bilhetes</h3>
                <div className="space-y-2.5">
                  {(evento.bilhetes ?? []).map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 border-b border-white/6 pb-2.5 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{b.nome}</p>
                        {venda === "a-venda" && <p className="text-xs text-ink-600">{b.disponiveis} disponíveis</p>}
                      </div>
                      <span className="font-display text-sm text-white shrink-0">{formatKz(b.preco)}</span>
                    </div>
                  ))}
                </div>
                {venda === "a-venda" ? (
                  <ButtonLink href={`/bilhetes/${evento.slug}`} className="mt-5 w-full">
                    <Icon name="ticket" className="size-4" />
                    Comprar
                  </ButtonLink>
                ) : (
                  <p className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-ink-800 font-ui text-base text-ink-300">
                    <Icon name="ticket" className="size-4" />
                    Esgotado
                  </p>
                )}
              </div>
            ) : !terminado ? (
              <div className="card p-5">
                <h3 className="eyebrow text-mb-red mb-4">Participação</h3>
                {entrada ? (
                  <p className="font-display text-lg uppercase leading-snug text-white">{entrada}</p>
                ) : (
                  <p className="text-sm text-ink-300 leading-relaxed">
                    {vendaFechada
                      ? "A venda de bilhetes online na Motobox está fechada de momento. Confirme as condições de participação com o organizador."
                      : "Este evento não tem venda de bilhetes online na Motobox. Confirme as condições de participação com o organizador."}
                  </p>
                )}
                {evento.organizador && (
                  <div className="mt-4 flex justify-between gap-4 border-t border-white/6 pt-3.5">
                    <span className="text-xs text-ink-500">Organizador</span>
                    <span className="text-sm text-white text-right">{evento.organizador}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Partilhar */}
            <div className="card p-5">
              <h3 className="eyebrow text-mb-red mb-3">Partilhar</h3>
              <div className="flex gap-2">
                {(["whatsapp", "facebook", "instagram", "share"] as const).map((r) => (
                  <span
                    key={r}
                    className="grid size-10 cursor-pointer place-items-center rounded-full bg-ink-800 text-ink-300 transition-colors hover:bg-mb-red hover:text-white"
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
