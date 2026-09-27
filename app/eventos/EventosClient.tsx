"use client";

import { useMemo, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { Countdown } from "@/components/Countdown";
import { ButtonLink, Icon, PageHero } from "@/components/ui";
import { DISCIPLINAS_COMUNIDADE, eComunidade, hrefEvento } from "@/lib/desporto";
import type { Evento } from "@/lib/types";
import { useIdioma } from "@/lib/i18n/contexto";
import { useConteudo } from "@/lib/i18n/useConteudo";
import { CartaoEvento, LinhaEvento } from "@/app/calendario/ListaEventos";

type Tipo = (typeof DISCIPLINAS_COMUNIDADE)[number] | "Todos";
const TIPOS: Tipo[] = ["Todos", ...DISCIPLINAS_COMUNIDADE];

/**
 * Tudo o que junta a comunidade fora das pistas. Recebe o calendário inteiro:
 * as provas ficam escondidas até se ligar "Provas", para quem quer ver tudo.
 */
export function EventosClient({ eventos: originais }: { eventos: Evento[] }) {
  const eventos = useConteudo(originais, ["titulo", "resumo", "descricao", "circuito"]);
  const { t } = useIdioma();
  const [tipo, setTipo] = useState<Tipo>("Todos");
  const [provincia, setProvincia] = useState("Todas");
  const [comProvas, setComProvas] = useState(false);
  const [vista, setVista] = useState<"lista" | "grelha">("lista");

  // Fixo desde a montagem: a lista não muda de ordem a meio da visita.
  const [agora] = useState(() => Date.now());
  const daComunidade = useMemo(() => eventos.filter((e) => eComunidade(e.disciplina)), [eventos]);

  // Os tipos escolhem entre os eventos da comunidade; "Provas" junta as corridas por cima.
  const visiveis = useMemo(
    () =>
      eventos.filter((e) =>
        eComunidade(e.disciplina) ? tipo === "Todos" || e.disciplina === tipo : comProvas,
      ),
    [eventos, tipo, comProvas],
  );

  const provincias = useMemo(
    () => ["Todas", ...[...new Set(visiveis.map((e) => e.provincia))].sort((a, b) => a.localeCompare(b))],
    [visiveis],
  );
  // Uma província que deixou de ter eventos com o novo filtro volta a "Todas".
  const provinciaActiva = provincias.includes(provincia) ? provincia : "Todas";

  const { proximos, passados } = useMemo(() => {
    const lista = visiveis.filter((e) => provinciaActiva === "Todas" || e.provincia === provinciaActiva);
    return {
      // Os próximos primeiro, do mais perto para o mais longe; depois os que já passaram, do mais recente.
      proximos: lista
        .filter((e) => new Date(e.dataFim).getTime() >= agora)
        .sort((a, b) => +new Date(a.dataInicio) - +new Date(b.dataInicio)),
      passados: lista
        .filter((e) => new Date(e.dataFim).getTime() < agora)
        .sort((a, b) => +new Date(b.dataInicio) - +new Date(a.dataInicio)),
    };
  }, [visiveis, provinciaActiva, agora]);

  const destaque = proximos.find((e) => eComunidade(e.disciplina) && new Date(e.dataInicio).getTime() > agora);

  const grupos = [
    { titulo: "A seguir", lista: proximos },
    { titulo: "Já aconteceram", lista: passados },
  ].filter((g) => g.lista.length > 0);

  return (
    <>
      <PageHero
        imagem="forum"
        eyebrow="Comunidade"
        titulo={t("nav.eventos")}
        descricao="Passeios, encontros de clubes, acções solidárias e formações. Tudo o que junta a comunidade motard fora das pistas, com data, local e bilhetes quando os há."
      >
        <div className="flex flex-wrap gap-6 sm:gap-10">
          {[
            { valor: daComunidade.length, label: "Eventos" },
            {
              valor: daComunidade.filter((e) => new Date(e.dataInicio).getTime() > agora).length,
              label: "Por acontecer",
            },
            { valor: new Set(daComunidade.map((e) => e.provincia)).size, label: "Províncias" },
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
            {TIPOS.map((d) => (
              <button
                key={d}
                onClick={() => setTipo(d)}
                aria-pressed={tipo === d}
                className="chip h-8 px-3.5 text-sm"
              >
                {d}
              </button>
            ))}
          </div>

          <span className="h-5 w-px shrink-0 bg-white/10" aria-hidden />

          <button
            onClick={() => setComProvas((v) => !v)}
            aria-pressed={comProvas}
            className="chip h-8 px-3.5 text-sm"
          >
            <Icon name="flag" className="size-3.5" />
            Provas
          </button>

          <select
            value={provinciaActiva}
            onChange={(e) => setProvincia(e.target.value)}
            aria-label="Filtrar por província"
            className="h-8 shrink-0 rounded-full bg-ink-800 px-3.5 font-ui text-sm text-ink-300 outline-none transition-colors hover:bg-ink-700 hover:text-white focus:ring-2 focus:ring-mb-red"
          >
            {provincias.map((p) => (
              <option key={p} value={p}>
                {p === "Todas" ? "Província" : p}
              </option>
            ))}
          </select>

          <div className="ml-auto hidden shrink-0 sm:flex gap-1 rounded-full bg-ink-800 p-1">
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {/* Destaque: o próximo evento da comunidade */}
        {destaque && (
          <div className="mb-12 relative overflow-hidden rounded-card">
            <Placeholder nome={[destaque.slug, destaque.imagem]} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/45" />
            <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <p className="eyebrow text-mb-red">Próximo evento</p>
                <h2 className="title-xl mt-3 text-3xl sm:text-4xl">{destaque.titulo}</h2>
                <p className="mt-4 max-w-lg text-sm text-ink-300 leading-relaxed">{destaque.resumo}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {destaque.bilhetes && (
                    <ButtonLink href={`/bilhetes/${destaque.slug}`}>
                      <Icon name="ticket" className="size-4" />
                      Bilhetes
                    </ButtonLink>
                  )}
                  <ButtonLink href={hrefEvento(destaque)} variant="outline">
                    Ver detalhes
                  </ButtonLink>
                </div>
              </div>
              <div className="border-t border-white/10 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                <p className="eyebrow text-ink-500 mb-4">Começa em</p>
                <Countdown data={destaque.dataInicio} size="md" />
              </div>
            </div>
          </div>
        )}

        {grupos.map((g) => (
          <section key={g.titulo} className="mb-12 last:mb-0">
            <div className="mb-2 flex items-center gap-4">
              <h2 className="eyebrow text-ink-400">{g.titulo}</h2>
              <span className="h-px flex-1 bg-white/6" aria-hidden />
            </div>
            {vista === "lista" ? (
              <ol>
                {g.lista.map((e) => (
                  <LinhaEvento key={e.slug} e={e} agora={agora} ate={t("comum.ate")} />
                ))}
              </ol>
            ) : (
              <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {g.lista.map((e) => (
                  <CartaoEvento key={e.slug} e={e} agora={agora} />
                ))}
              </div>
            )}
          </section>
        ))}

        {grupos.length === 0 && (
          <div className="card p-14 text-center">
            <p className="font-display text-lg uppercase text-ink-300">Nenhum evento encontrado</p>
            <p className="mt-2 text-sm text-ink-500">Experimente outro tipo ou outra província.</p>
          </div>
        )}

        {/* Convite a quem organiza */}
        <div className="mt-16 flex flex-col gap-5 border-t border-white/6 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl uppercase leading-tight text-white">
              Organiza um passeio, encontro ou acção solidária?
            </p>
            <p className="mt-2 text-sm text-ink-400">
              Envie-nos a data, o local e o contacto e publicamos o evento aqui.
            </p>
          </div>
          <ButtonLink href="/contacto" variant="light" className="shrink-0">
            Divulgar um evento
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
