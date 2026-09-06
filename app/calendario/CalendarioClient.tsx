"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { Countdown } from "@/components/Countdown";
import { ButtonLink, Icon, PageHero, Tag } from "@/components/ui";
import { TEMPORADA, formatData } from "@/lib/data";
import type { Disciplina, Evento } from "@/lib/types";

const DISCIPLINAS: (Disciplina | "Todas")[] = [
  "Todas",
  "Motocross",
  "Enduro",
  "Rally",
  "Solidária",
  "Passeio",
];

function estadoTag(e: Evento) {
  switch (e.estado) {
    case "bilhetes-abertos":
      return <Tag tone="red">Bilhetes à venda</Tag>;
    case "esgotado":
      return <Tag tone="neutral">Esgotado</Tag>;
    case "a-decorrer":
      return (
        <Tag tone="live">
          <span className="live-dot size-1.5 rounded-full bg-white" />A decorrer
        </Tag>
      );
    case "concluido":
      return <Tag tone="outline">Concluído</Tag>;
    default:
      return <Tag tone="outline">Agendado</Tag>;
  }
}

export function CalendarioClient({ eventos }: { eventos: Evento[] }) {
  const [disciplina, setDisciplina] = useState<Disciplina | "Todas">("Todas");
  const [vista, setVista] = useState<"lista" | "grelha">("lista");
  const [mostrarPassados, setMostrarPassados] = useState(true);

  const agora = Date.now();

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
        eyebrow={`Temporada ${TEMPORADA}`}
        titulo="Calendário"
        descricao="Todas as provas do motociclismo angolano — motocross, enduro, rally-raid, passeios e acções solidárias. Clique numa prova para ver horários, circuito e bilhetes."
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
      </PageHero>

      {/* Barra de filtros */}
      <div className="sticky top-16 z-30 border-b border-ink-800 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 py-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5">
            {DISCIPLINAS.map((d) => (
              <button
                key={d}
                onClick={() => setDisciplina(d)}
                aria-pressed={disciplina === d}
                className={`h-8 shrink-0 px-3.5 font-display text-[11px] uppercase tracking-wider transition-colors ${
                  disciplina === d
                    ? "bg-mb-red text-white"
                    : "border border-ink-700 text-ink-400 hover:border-ink-500 hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-400">
              <input
                type="checkbox"
                checked={mostrarPassados}
                onChange={(e) => setMostrarPassados(e.target.checked)}
                className="size-4 accent-[#e10600]"
              />
              Provas passadas
            </label>
            <div className="hidden sm:flex border border-ink-700">
              {(["lista", "grelha"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  aria-pressed={vista === v}
                  className={`h-8 px-3 font-display text-[11px] uppercase tracking-wider transition-colors ${
                    vista === v ? "bg-ink-700 text-white" : "text-ink-500 hover:text-white"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {/* Destaque próxima prova */}
        {proximo && (
          <div className="mb-12 relative overflow-hidden border border-ink-700">
            <Placeholder nome={proximo.imagem} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/90 to-ink-950/40" />
            <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <p className="eyebrow text-mb-red">Próxima prova</p>
                <h2 className="title-xl mt-3 text-3xl sm:text-4xl">{proximo.titulo}</h2>
                <p className="mt-4 max-w-lg text-sm text-ink-300 leading-relaxed">{proximo.resumo}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {proximo.bilhetes && (
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
              <div className="border-t border-ink-800 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                <p className="eyebrow text-ink-500 mb-4">Começa em</p>
                <Countdown data={proximo.dataInicio} size="md" />
              </div>
            </div>
          </div>
        )}

        {/* Lista de eventos */}
        {vista === "lista" ? (
          <ol className="space-y-3">
            {filtrados.map((e) => {
              const passado = new Date(e.dataFim).getTime() < agora;
              return (
                <li key={e.slug}>
                  <Link
                    href={`/calendario/${e.slug}`}
                    className={`group card card-hover flex flex-col sm:flex-row overflow-hidden ${
                      passado ? "opacity-60 hover:opacity-100" : ""
                    }`}
                  >
                    {/* Data */}
                    <div className="flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-0 border-b sm:border-b-0 sm:border-r border-ink-800 bg-ink-950 px-5 py-4 sm:w-28 shrink-0">
                      <span className="font-display text-3xl leading-none text-white">
                        {new Date(e.dataInicio).getDate()}
                      </span>
                      <span className="eyebrow sm:mt-1.5 text-mb-red">
                        {new Date(e.dataInicio)
                          .toLocaleDateString("pt-PT", { month: "short" })
                          .replace(".", "")}
                      </span>
                      <span className="eyebrow sm:mt-0.5 text-ink-600">
                        {new Date(e.dataInicio).getFullYear()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {e.ronda && <Tag tone="neutral">Ronda {e.ronda}</Tag>}
                        <Tag tone="outline">{e.disciplina}</Tag>
                        {estadoTag(e)}
                      </div>
                      <h3 className="mt-2.5 font-display text-xl sm:text-2xl uppercase leading-tight text-white group-hover:text-mb-red transition-colors">
                        {e.titulo}
                      </h3>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="pin" className="size-3.5" />
                          {e.circuito}, {e.provincia}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="calendar" className="size-3.5" />
                          {formatData(e.dataInicio, { day: "2-digit", month: "short" })} —{" "}
                          {formatData(e.dataFim, { day: "2-digit", month: "short" })}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="flag" className="size-3.5" />
                          {e.organizador}
                        </span>
                      </p>
                      <p className="mt-3 text-sm text-ink-400 line-clamp-2 sm:max-w-2xl">{e.resumo}</p>
                    </div>

                    {/* Acção */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-ink-800 px-5 py-4 sm:w-40 shrink-0">
                      {e.bilhetes && e.estado !== "concluido" ? (
                        <>
                          <span className="eyebrow text-ink-600">Desde</span>
                          <span className="font-display text-lg text-white">
                            {Math.min(...e.bilhetes.map((b) => b.preco)).toLocaleString("pt-PT")} Kz
                          </span>
                          <span className="mt-1 inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-widest text-mb-red">
                            Bilhetes
                            <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </>
                      ) : passado ? (
                        <span className="inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-widest text-ink-500">
                          Resultados
                          <Icon name="arrow" className="size-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-widest text-ink-400">
                          Detalhes
                          <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((e) => (
              <Link
                key={e.slug}
                href={`/calendario/${e.slug}`}
                className="group card card-hover overflow-hidden"
              >
                <div className="relative aspect-[16/10]">
                  <Placeholder nome={e.imagem} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute left-3 top-3 flex gap-2">{estadoTag(e)}</div>
                  <div className="absolute bottom-3 left-3">
                    <p className="font-display text-2xl text-white leading-none">
                      {new Date(e.dataInicio).getDate()}{" "}
                      {new Date(e.dataInicio)
                        .toLocaleDateString("pt-PT", { month: "short" })
                        .replace(".", "")
                        .toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <Tag tone="outline">{e.disciplina}</Tag>
                  <h3 className="mt-2.5 font-display text-lg uppercase leading-tight text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                    {e.titulo}
                  </h3>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                    <Icon name="pin" className="size-3.5" />
                    {e.circuito}, {e.provincia}
                  </p>
                </div>
              </Link>
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
