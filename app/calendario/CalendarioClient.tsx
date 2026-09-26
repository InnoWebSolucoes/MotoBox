"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { Countdown } from "@/components/Countdown";
import { ButtonLink, Icon, PageHero, Tag } from "@/components/ui";
import { TEMPORADA, formatData } from "@/lib/data";
import type { Disciplina, Evento } from "@/lib/types";
import { useIdioma } from "@/lib/i18n/contexto";
import { useConteudo } from "@/lib/i18n/useConteudo";

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

export function CalendarioClient({ eventos: originais }: { eventos: Evento[] }) {
  const eventos = useConteudo(originais, ["titulo", "resumo", "descricao", "circuito"]);
  const { t } = useIdioma();
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
        imagem="calendario"
        eyebrow={`Temporada ${TEMPORADA}`}
        titulo={t("paginas.calendarioTitulo")}
        descricao="Todas as provas do motociclismo angolano: motocross, enduro, rally-raid, passeios e acções solidárias. Clique numa prova para ver horários, circuito e bilhetes."
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
      <div className="sticky top-16 z-30 border-b border-white/6 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 py-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {DISCIPLINAS.map((d) => (
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
                  className={`chip h-7 px-3 text-sm capitalize ${vista === v ? "" : "bg-transparent"}`}
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
          <div className="mb-12 relative overflow-hidden rounded-card">
            <Placeholder nome={[proximo.slug, proximo.imagem]} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/45" />
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
              <div className="border-t border-white/10 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                <p className="eyebrow text-ink-500 mb-4">Começa em</p>
                <Countdown data={proximo.dataInicio} size="md" />
              </div>
            </div>
          </div>
        )}

        {/* Lista de eventos */}
        {vista === "lista" ? (
          <ol>
            {filtrados.map((e) => {
              const passado = new Date(e.dataFim).getTime() < agora;
              return (
                <li key={e.slug} className="border-b border-white/6 last:border-0">
                  <Link
                    href={`/calendario/${e.slug}`}
                    className={`group grid grid-cols-[3.5rem_1fr] sm:grid-cols-[5rem_1fr_9rem] items-start sm:items-center gap-x-5 sm:gap-x-8 gap-y-3 py-6 transition-opacity ${
                      passado ? "opacity-60 hover:opacity-100" : ""
                    }`}
                  >
                    {/* Data: coluna tipográfica, sem caixa */}
                    <div className="text-center">
                      <span className="block font-display text-4xl sm:text-5xl leading-none text-white">
                        {new Date(e.dataInicio).getDate()}
                      </span>
                      <span className="eyebrow mt-1.5 block text-mb-red">
                        {new Date(e.dataInicio)
                          .toLocaleDateString("pt-PT", { month: "short" })
                          .replace(".", "")}
                      </span>
                      <span className="eyebrow mt-0.5 block text-ink-600">
                        {new Date(e.dataInicio).getFullYear()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
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
                          {formatData(e.dataInicio, { day: "2-digit", month: "short" })} {t("comum.ate")}{" "}
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
                    <div className="col-start-2 sm:col-start-auto flex flex-wrap sm:flex-col items-center sm:items-end gap-x-3 gap-y-1 sm:text-right">
                      {e.bilhetes && e.estado !== "concluido" ? (
                        <>
                          <span className="eyebrow text-ink-600">Desde</span>
                          <span className="font-display text-lg text-white">
                            {Math.min(...e.bilhetes.map((b) => b.preco)).toLocaleString("pt-PT")} Kz
                          </span>
                          <span className="sm:mt-1 inline-flex items-center gap-1.5 font-ui text-sm text-mb-red">
                            Bilhetes
                            <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </>
                      ) : passado ? (
                        <span className="inline-flex items-center gap-1.5 font-ui text-sm text-ink-500">
                          Resultados
                          <Icon name="arrow" className="size-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-ui text-sm text-ink-300 group-hover:text-white transition-colors">
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
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((e) => (
              <Link
                key={e.slug}
                href={`/calendario/${e.slug}`}
                className="group block"
              >
                <div className="media relative aspect-[16/10]">
                  <Placeholder nome={[e.slug, e.imagem]} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
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
                <div className="pt-4">
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
