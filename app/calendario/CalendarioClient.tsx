"use client";

import { useMemo, useState } from "react";
import { Calendar, LayoutGrid, List, Ticket } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Numeros, Seccao } from "@/components/painel/blocos";
import { FotoFundo } from "@/components/painel/kit";
import { DISCIPLINAS_PROVA, vendaBilhetes } from "@/lib/desporto";
import { intervaloDatas } from "@/lib/motobox";
import type { Disciplina, Evento } from "@/lib/types";
import { useConteudo } from "@/lib/i18n/useConteudo";
import { contar, preencher, type TextosCalendario } from "@/lib/conteudo/grupos/geral";
import { Contagem } from "./Contagem";
import { CartaoEvento, LinhaEvento } from "./ListaEventos";
import { Aviso, Etiqueta, LigacaoSeta } from "./pecas";
import { fotoDe } from "@/app/eventos/foto";

/**
 * Só provas: os passeios, encontros e acções solidárias vivem em /eventos.
 * Os textos fixos vêm do painel (Provas › Páginas do campeonato › Calendário).
 */
export function CalendarioClient({
  eventos: originais,
  bilheteiraAberta,
  textos: t,
  ano,
}: {
  eventos: Evento[];
  /** Interruptor "Bilheteira aberta" das Definições, lido no servidor. */
  bilheteiraAberta: boolean;
  textos: TextosCalendario;
  /** Temporada em curso (Definições). */
  ano: number;
}) {
  const eventos = useConteudo(originais, ["titulo", "resumo", "descricao", "circuito", "entrada"]);
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
  const vendaProximo = proximo ? vendaBilhetes(proximo, bilheteiraAberta, agora) : null;

  return (
    <PaginaInterior icone={<Calendar />}>
      <Abertura
        compacta
        foto={t.foto}
        sobretitulo={preencher(t.sobretitulo, { ano })}
        titulo={t.titulo}
        texto={t.texto}
      >
        {t.ligacaoEventos.texto && t.ligacaoEventos.href && (
          <LigacaoSeta href={t.ligacaoEventos.href} className="text-[15px]">
            {t.ligacaoEventos.texto}
          </LigacaoSeta>
        )}
      </Abertura>

      <Seccao>
        <Numeros
          colunas={4}
          itens={[
            { valor: eventos.length, texto: t.numeros.provas },
            { valor: new Set(eventos.map((e) => e.provincia)).size, texto: t.numeros.provincias },
            { valor: new Set(eventos.map((e) => e.disciplina)).size, texto: t.numeros.disciplinas },
            { valor: eventos.filter((e) => new Date(e.dataInicio).getTime() > agora).length, texto: t.numeros.porDisputar },
          ]}
        />
      </Seccao>

      <Seccao className="!pt-0">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 className="titulo-2">{t.lista.titulo}</h2>
          <p className="text-sm text-white/80" aria-live="polite">
            {contar(filtrados.length, t.lista.contadorUm, t.lista.contadorVarios)}
            {disciplina !== "Todas" ? ` · ${disciplina}` : ""}
          </p>
        </div>

        {/* Filtros: disciplina, provas passadas e vista */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label={t.lista.rotuloDisciplina} className="no-scrollbar -mx-1 flex max-w-full gap-2 overflow-x-auto px-1">
            {disciplinas.map((d) => (
              <button key={d} type="button" onClick={() => setDisciplina(d)} aria-pressed={disciplina === d} className="pilula">
                {d === "Todas" ? t.lista.todas : d}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="pilula cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarPassados}
                onChange={(e) => setMostrarPassados(e.target.checked)}
                className="size-4 accent-[#e10600]"
              />
              {t.lista.passadas}
            </label>
            <div role="group" aria-label={t.lista.rotuloVista} className="flex h-9 items-center gap-1 rounded-[4px] bg-white/7 p-1">
              {(["lista", "grelha"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVista(v)}
                  aria-pressed={vista === v}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-[3px] px-2.5 text-sm transition-colors ${
                    vista === v ? "bg-white text-black" : "text-white/70 hover:text-white"
                  }`}
                >
                  {v === "lista" ? <List className="size-4" aria-hidden /> : <LayoutGrid className="size-4" aria-hidden />}
                  {v === "lista" ? t.lista.vistaLista : t.lista.vistaGrelha}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Destaque: a próxima prova, com a contagem decrescente */}
        {proximo && (
          <div className="painel relative isolate mt-8 grid min-h-[24rem] gap-10 p-6 md:p-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
            <FotoFundo nome={fotoDe(proximo.slug, proximo.imagem)} veu="esquerda" tamanhos="(max-width: 1024px) 100vw, 80vw" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 to-transparent" aria-hidden />
            <div>
              <p className="sobretitulo text-white/85">{t.destaque.etiqueta}</p>
              <h3 className="titulo-3 mt-4 max-w-[22ch] text-balance">{proximo.titulo}</h3>
              <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-white/85">{proximo.resumo}</p>
              <p className="mt-3 text-sm text-white/70">
                {intervaloDatas(proximo.dataInicio, proximo.dataFim)} · {proximo.circuito}, {proximo.provincia}
              </p>
              <div className="mt-8 flex flex-wrap gap-[var(--intervalo)]">
                {vendaProximo === "a-venda" && <BotaoMB href={`/bilhetes/${proximo.slug}`}>{t.destaque.comprar}</BotaoMB>}
                {vendaProximo === "esgotado" && (
                  <span className="inline-flex h-14 items-center gap-2 rounded-[var(--raio)] bg-black/65 px-5 text-[15px] text-white/80">
                    <Ticket className="size-4" aria-hidden />
                    {t.destaque.esgotado}
                  </span>
                )}
                <BotaoMB href={`/calendario/${proximo.slug}`} variante="escuro" className="!bg-black/60 hover:!bg-black/75">
                  {t.destaque.detalhes}
                </BotaoMB>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm text-white/75">{t.destaque.comecaEm}</p>
              <Contagem data={proximo.dataInicio} textos={t.contagem} />
            </div>
          </div>
        )}

        {/* Lista de provas */}
        {filtrados.length > 0 &&
          (vista === "lista" ? (
            <ol className="mt-8">
              {filtrados.map((e) => (
                <LinhaEvento key={e.slug} e={e} agora={agora} bilheteiraAberta={bilheteiraAberta} textos={t.linha} />
              ))}
            </ol>
          ) : (
            <div className="mt-8 grid gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-3">
              {filtrados.map((e) => (
                <CartaoEvento key={e.slug} e={e} agora={agora} bilheteiraAberta={bilheteiraAberta} textos={t.linha} />
              ))}
            </div>
          ))}

        {filtrados.length === 0 && (
          <Aviso className="mt-8" titulo={t.lista.vazioTitulo} icone={<Calendar />}>
            {t.lista.vazioTexto}
          </Aviso>
        )}

        {bilheteiraAberta && eventos.some((e) => vendaBilhetes(e, bilheteiraAberta, agora) === "a-venda") && (
          <p className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <Etiqueta tom="vermelho">{t.notaBilhetes.etiqueta}</Etiqueta>
            <span>{t.notaBilhetes.texto}</span>
            <LigacaoSeta href="/bilhetes">{t.notaBilhetes.ligacao}</LigacaoSeta>
          </p>
        )}
      </Seccao>
    </PaginaInterior>
  );
}
