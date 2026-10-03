"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { Countdown } from "@/components/Countdown";
import { ButtonLink, Icon, PageHero } from "@/components/ui";
import { TEMPORADA } from "@/lib/data";
import { DISCIPLINAS_PROVA, vendaBilhetes } from "@/lib/desporto";
import type { Disciplina, Evento } from "@/lib/types";
import { useIdioma } from "@/lib/i18n/contexto";
import { useConteudo } from "@/lib/i18n/useConteudo";
import { CartaoEvento, LinhaEvento } from "./ListaEventos";

/** Só provas: os passeios, encontros e acções solidárias vivem em /eventos. */
export function CalendarioClient({
  eventos: originais,
  bilheteiraAberta,
}: {
  eventos: Evento[];
  /** Interruptor "Bilheteira aberta" das Definições, lido no servidor. */
  bilheteiraAberta: boolean;
}) {
  const eventos = useConteudo(originais, ["titulo", "resumo", "descricao", "circuito", "entrada"]);
  const { t } = useIdioma();
  const [disciplina, setDisciplina] = useState<Disciplina | "Todas">("Todas");
  const [vista, setVista] = useState<"lista" | "grelha">("lista");
  const [mostrarPassados, setMostrarPassados] = useState(true);

  // Fixo desde a montagem: a lista não muda de ordem a meio da visita.
  const [agora] = useState(() => Date.now());

  // Um filtro sem provas só dava a lista vazia: ficam as disciplinas que existem.
  const disciplinas = useMemo(
    () => ["Todas" as const, ...DISCIPLINAS_PROVA.filter((d) => eventos.some((e) => e.disciplina === d))],
    [eventos],
  );

  const filtrados = useMemo(() => {
    return eventos
      .filter((e) => disciplina === "Todas" || e.disciplina === disciplina)
      .filter((e) => mostrarPassados || new Date(e.dataFim).getTime() >= agora)
      .sort((a, b) => +new Date(a.dataInicio) - +new Date(b.dataInicio));
  }, [eventos, disciplina, mostrarPassados, agora]);

  const proximo = filtrados.find((e) => new Date(e.dataInicio).getTime() > agora);

  return (
    <>
      <PageHero
        imagem="calendario"
        eyebrow={`Temporada ${TEMPORADA}`}
        titulo={t("paginas.calendarioTitulo")}
        descricao="As provas do motociclismo angolano: motocross, enduro, rally-raid e velocidade. Clique numa prova para ver horários, circuito e bilhetes."
      >
        <div className="flex flex-wrap gap-6 sm:gap-10">
          {[
            { valor: eventos.length, label: "Provas" },
            { valor: new Set(eventos.map((e) => e.provincia)).size, label: "Províncias" },
            { valor: new Set(eventos.map((e) => e.disciplina)).size, label: "Disciplinas" },
            {
              valor: eventos.filter((e) => new Date(e.dataInicio).getTime() > agora).length,
              label: "Por disputar",
            },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl text-white">{s.valor}</p>
              <p className="eyebrow mt-1 text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>
        <Link
          href="/eventos"
          className="group mt-7 inline-flex items-center gap-2 font-ui text-base text-ink-300 transition-colors hover:text-white"
        >
          Passeios, encontros e acções solidárias estão em Eventos
          <Icon name="arrow" className="size-4 text-mb-red transition-transform group-hover:translate-x-1" />
        </Link>
      </PageHero>

      {/* Barra de filtros */}
      <div className="sticky top-16 z-30 border-b border-white/6 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 py-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {disciplinas.map((d) => (
              <button
                key={d}
                onClick={() => setDisciplina(d)}
                aria-pressed={disciplina === d}
                className="chip h-8 px-3.5 text-sm"
              >
                {d}
              </button>
            ))}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-400">
              <input
                type="checkbox"
                checked={mostrarPassados}
                onChange={(e) => setMostrarPassados(e.target.checked)}
                className="size-4 accent-[#e10600]"
              />
              Provas passadas
            </label>
            <div className="hidden sm:flex gap-1 rounded-full bg-ink-800 p-1">
              {(["lista", "grelha"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  aria-pressed={vista === v}
                  className={`chip h-7 px-3 text-sm ${vista === v ? "" : "bg-transparent"}`}
                >
                  {t(v === "lista" ? "paginas.vistaLista" : "paginas.vistaGrelha")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {/* Destaque próxima prova */}
        {proximo && (
          <div className="mb-12 relative overflow-hidden rounded-card">
            <Placeholder nome={[proximo.slug, proximo.imagem]} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/45" />
            <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <p className="eyebrow text-mb-red">Próxima prova</p>
                <h2 className="title-xl mt-3 text-3xl sm:text-4xl">{proximo.titulo}</h2>
                <p className="mt-4 max-w-lg text-sm text-ink-300 leading-relaxed">{proximo.resumo}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {vendaBilhetes(proximo, bilheteiraAberta, agora) === "a-venda" && (
                    <ButtonLink href={`/bilhetes/${proximo.slug}`}>
                      <Icon name="ticket" className="size-4" />
                      Bilhetes
                    </ButtonLink>
                  )}
                  <ButtonLink href={`/calendario/${proximo.slug}`} variant="outline">
                    Ver detalhes
                  </ButtonLink>
                </div>
              </div>
              <div className="border-t border-white/10 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                <p className="eyebrow text-ink-500 mb-4">Começa em</p>
                <Countdown data={proximo.dataInicio} size="md" />
              </div>
            </div>
          </div>
        )}

        {/* Lista de provas */}
        {vista === "lista" ? (
          <ol>
            {filtrados.map((e) => (
              <LinhaEvento key={e.slug} e={e} agora={agora} bilheteiraAberta={bilheteiraAberta} ate={t("comum.ate")} />
            ))}
          </ol>
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((e) => (
              <CartaoEvento key={e.slug} e={e} agora={agora} bilheteiraAberta={bilheteiraAberta} />
            ))}
          </div>
        )}

        {filtrados.length === 0 && (
          <div className="card p-14 text-center">
            <p className="font-display text-lg uppercase text-ink-300">Nenhuma prova encontrada</p>
            <p className="mt-2 text-sm text-ink-500">Experimente outro filtro de disciplina.</p>
          </div>
        )}
      </div>
    </>
  );
}
