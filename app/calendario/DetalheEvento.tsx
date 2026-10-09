/* Página de uma prova (/calendario/[slug]). Também sabe desenhar um evento
   da comunidade (passeio, encontro, acção solidária, formação), para as
   ligações antigas: muda só o que não faz sentido fora da pista (ronda,
   ficha do circuito, resultados). Os bilhetes funcionam nos dois.

   Só há compra quando `vendaBilhetes` o diz. Sem venda, o cartão
   "Participação" diz como se participa (o campo `entrada`) ou, sem ele,
   manda confirmar com o organizador: nunca se dá o evento por gratuito. */

import { CalendarDays, Calendar, Clock, MapPin, Share2, Ticket, Timer, Users } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Numeros, Seccao } from "@/components/painel/blocos";
import { formatKz } from "@/lib/data";
import { eComunidade, entradaDoEvento, instante, vendaBilhetes } from "@/lib/desporto";
import { intervaloDatas } from "@/lib/motobox";
import type { Corrida, Evento } from "@/lib/types";
import { TabelaResultados } from "@/app/resultados/TabelaResultados";
import { Contagem } from "./Contagem";
import { Partilhar } from "./Partilhar";
import { Etiqueta, Ficha, LegendaResultados, LigacaoSeta, TituloSeccao } from "./pecas";
import { fotoDe } from "@/app/eventos/foto";

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
  const quando = intervaloDatas(evento.dataInicio, evento.dataFim);

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

  const sobretitulo = [
    !comunidade && evento.ronda ? `Ronda ${evento.ronda}` : null,
    evento.disciplina,
    String(evento.temporada),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PaginaInterior icone={comunidade ? <CalendarDays /> : <Calendar />}>
      <Abertura foto={fotoDe(evento.slug, evento.imagem)} sobretitulo={sobretitulo} titulo={evento.titulo} tamanho="2" texto={evento.resumo}>
        {futuro ? (
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-3 text-sm text-white/75">Começa em</p>
              <Contagem data={evento.dataInicio} />
            </div>
            {venda === "a-venda" && <BotaoMB href={`/bilhetes/${evento.slug}`}>Comprar bilhetes</BotaoMB>}
            {venda === "esgotado" && (
              <span className="inline-flex h-14 w-full max-w-[20.5rem] items-center gap-3 rounded-[var(--raio)] bg-black/65 px-5 text-[15px] text-white/80">
                <Ticket className="size-4" aria-hidden />
                Esgotado
              </span>
            )}
          </div>
        ) : terminado ? (
          <p className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--raio)] bg-black/50 px-4 py-3 text-sm text-white/85">
            {comunidade ? "Este evento já aconteceu." : "Esta prova já terminou."}
            {resultados.length > 0 && <LigacaoSeta href="#resultados">Ver resultados</LigacaoSeta>}
          </p>
        ) : (
          <Etiqueta tom="directo" className="h-8 px-3 text-sm">
            A decorrer
          </Etiqueta>
        )}
      </Abertura>

      <Seccao>
        <Numeros
          colunas={4}
          itens={[
            { valor: <span className="text-xl sm:text-2xl lg:text-3xl">{quando.replace(/ de \d{4}$/, "")}</span>, texto: `data · ${evento.temporada}` },
            {
              valor: <span className="text-xl sm:text-2xl lg:text-3xl">{evento.localidade || evento.provincia}</span>,
              texto: [evento.circuito, evento.provincia].filter(Boolean).join(", "),
            },
            comunidade || !evento.ronda
              ? { valor: <span className="text-xl sm:text-2xl lg:text-3xl">{evento.disciplina}</span>, texto: comunidade ? "tipo de evento" : "disciplina" }
              : { valor: <span className="text-xl sm:text-2xl lg:text-3xl">Ronda {evento.ronda}</span>, texto: `${evento.disciplina} · Campeonato Nacional` },
            { valor: <span className="text-xl sm:text-2xl lg:text-3xl">{evento.organizador.split(",")[0]}</span>, texto: "organização" },
          ]}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="titulo-3">{comunidade ? "Sobre o evento" : "Sobre a prova"}</h2>
            <div className="prosa mt-6 max-w-[62ch]">
              {evento.descricao.split(/\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Horários, se o organizador já os publicou */}
            {dias.length > 0 && (
              <div className="mt-14">
                <h2 className="flex items-center gap-3 titulo-3">
                  Programa
                  <Clock className="size-6 text-mb-red-light" aria-hidden />
                </h2>
                <div className="mt-6 space-y-8">
                  {dias.map((dia) => (
                    <div key={dia}>
                      <h3 className="text-sm text-white/60">{dia}</h3>
                      <ol className="mt-3 grid gap-[var(--intervalo)]">
                        {evento.horarios
                          .filter((h) => h.dia === dia)
                          .map((h, i) => (
                            <li key={i} className="painel painel-escuro grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-4 p-[var(--intervalo)] pr-4">
                              <span className="rounded-[4px] bg-mb-red px-2 py-2 text-center text-lg font-semibold tabular-nums">
                                {h.hora}
                              </span>
                              <span className="text-[15px] leading-snug">{h.sessao}</span>
                            </li>
                          ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Barra lateral */}
          <aside className="space-y-[var(--intervalo)] self-start">
            {/* Ficha do circuito, ou do local no caso de um evento da comunidade */}
            <Ficha titulo={comunidade ? "Local e organização" : "Ficha do circuito"} icone={<MapPin />} linhas={ficha}>
              {!comunidade && evento.organizador && (
                <p className="mt-4 border-t border-white/8 pt-4 text-sm text-white/55">
                  Organização: <span className="text-white">{evento.organizador}</span>
                </p>
              )}
              {!comunidade && evento.recordeVolta && (
                <div className="mt-5 flex items-center gap-4 rounded-[var(--raio)] bg-mb-red/15 p-4">
                  <Timer className="size-7 shrink-0 text-mb-red-light" aria-hidden />
                  <div>
                    <p className="text-sm text-white/70">Recorde de volta</p>
                    <p className="mt-0.5 text-2xl font-semibold leading-none tabular-nums">{evento.recordeVolta.tempo}</p>
                    <p className="mt-1.5 text-xs text-white/60">
                      {evento.recordeVolta.piloto} · {evento.recordeVolta.ano}
                    </p>
                  </div>
                </div>
              )}
            </Ficha>

            {/* Bilhetes, quando a MotoBox os vende; senão, como participar */}
            {venda ? (
              <Ficha titulo="Bilhetes" icone={<Ticket />}>
                <ul className="mt-4 divide-y divide-white/8">
                  {(evento.bilhetes ?? []).map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{b.nome}</span>
                        {venda === "a-venda" && (
                          <span className="block text-xs text-white/50">
                            <span className="tabular-nums">{b.disponiveis.toLocaleString("pt-PT")}</span> disponíveis
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{formatKz(b.preco)}</span>
                    </li>
                  ))}
                </ul>
                {venda === "a-venda" ? (
                  <BotaoMB href={`/bilhetes/${evento.slug}`} className="mt-6 !max-w-none">
                    Comprar bilhetes
                  </BotaoMB>
                ) : (
                  <p className="mt-6 flex h-14 items-center gap-3 rounded-[var(--raio)] bg-white/8 px-5 text-[15px] text-white/75">
                    <Ticket className="size-4" aria-hidden />
                    Esgotado
                  </p>
                )}
              </Ficha>
            ) : !terminado ? (
              <Ficha titulo="Participação" icone={<Users />}>
                {entrada ? (
                  <p className="mt-4 text-xl font-semibold leading-snug">{entrada}</p>
                ) : (
                  <p className="mt-4 text-sm leading-relaxed text-white/75">
                    {vendaFechada
                      ? "A venda de bilhetes online na MotoBox está fechada de momento. Confirme as condições de participação com o organizador."
                      : "Este evento não tem venda de bilhetes online na MotoBox. Confirme as condições de participação com o organizador."}
                  </p>
                )}
                {evento.organizador && (
                  <div className="mt-4 flex justify-between gap-4 border-t border-white/8 pt-3.5">
                    <span className="text-sm text-white/55">Organizador</span>
                    <span className="text-right text-sm">{evento.organizador}</span>
                  </div>
                )}
              </Ficha>
            ) : null}

            <Ficha titulo="Partilhar" icone={<Share2 />}>
              <div className="mt-4">
                <Partilhar titulo={evento.titulo} />
              </div>
            </Ficha>
          </aside>
        </div>
      </Seccao>

      {/* Resultados, se já disputada */}
      {resultados.length > 0 && (
        <Seccao id="resultados" className="!pt-0">
          <TituloSeccao titulo="Resultados" accao={{ href: "/resultados", texto: "Arquivo de resultados" }} />
          <div className="mt-8 space-y-12">
            {resultados.map((c) => (
              <div key={c.slug}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-3 text-xl font-semibold">
                    <Etiqueta tom="vermelho">{c.categoria}</Etiqueta>
                    Vencedor: {c.vencedor}
                  </h3>
                  <LigacaoSeta href={`/resultados/${c.slug}`}>Classificação completa</LigacaoSeta>
                </div>
                <TabelaResultados resultados={c.resultados} />
              </div>
            ))}
          </div>
          <LegendaResultados className="mt-6" />
        </Seccao>
      )}
    </PaginaInterior>
  );
}
