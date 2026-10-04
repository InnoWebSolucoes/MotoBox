/* O guia de uma modalidade (/desporto/<modalidade>): o que é, classes, a cena
   em Angola, os campeonatos lá fora, como começar e as fontes. Componente de
   servidor; o texto longo passa por <C> para a tradução automática, e os
   títulos fixos ficam em português no JSX (com a versão inglesa em
   lib/i18n/interface-en.ts). O texto vem de lib/desporto-conteudo.ts. */

import type { ReactNode } from "react";
import { C } from "@/components/T";
import { Icon } from "@/components/ui";
import { VERIFICADO_EM, type Bloco, type ConteudoPagina, type Tabela, type Texto } from "@/lib/desporto-conteudo";

/** Secções do guia, pela ordem da página, para o índice "Nesta página". */
export const SECCOES_GUIA: { id: string; nome: string }[] = [
  { id: "o-que-e", nome: "O que é" },
  { id: "classes", nome: "Classes e categorias" },
  { id: "angola", nome: "Em Angola" },
  { id: "internacional", nome: "Lá fora" },
  { id: "comecar", nome: "Como começar" },
  { id: "fontes", nome: "Fontes" },
];

/* ---------------- Peças pequenas ---------------- */

/** Números das fontes, em expoente, a apontar para a lista no fim. */
function Refs({ n }: { n: number[] }) {
  if (n.length === 0) return null;
  return (
    <sup className="ml-0.5 whitespace-nowrap font-ui text-[11px] leading-none">
      {n.map((i, k) => (
        <span key={i}>
          {k > 0 && <span className="text-ink-600">,</span>}
          <a
            href={`#fonte-${i}`}
            aria-label={`Fonte ${i}`}
            className="px-px text-mb-red no-underline transition-colors hover:text-white"
          >
            {i}
          </a>
        </span>
      ))}
    </sup>
  );
}

function Paragrafo({ x, className = "" }: { x: Texto; className?: string }) {
  return (
    <p className={className}>
      <C>{x.texto}</C>
      <Refs n={x.fontes} />
    </p>
  );
}

/** Corpo de texto: letra confortável, coluna de leitura (~70 caracteres). */
const CORPO = "text-[17px] leading-[1.75] text-ink-300";

function TituloSeccao({ id, eyebrow, children }: { id: string; eyebrow: string; children: ReactNode }) {
  return (
    <header id={id} className="scroll-mt-28">
      <p className="eyebrow text-mb-red">{eyebrow}</p>
      <h2 className="title-xl mt-2 text-3xl sm:text-4xl">{children}</h2>
    </header>
  );
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="mt-10 font-display text-xl uppercase leading-tight text-white sm:text-2xl">{children}</h3>;
}

function Blocos({ blocos }: { blocos: Bloco[] }) {
  return (
    <>
      {blocos.map((b) => (
        <div key={b.titulo}>
          <Subtitulo>
            <C>{b.titulo}</C>
          </Subtitulo>
          <div className="mt-3 space-y-4">
            {b.paragrafos.map((p) => (
              <Paragrafo key={p.texto.slice(0, 48)} x={p} className={CORPO} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function TabelaClasses({ tb }: { tb: Tabela }) {
  return (
    <figure className="mt-8">
      <figcaption className="font-display text-lg uppercase leading-tight text-white">
        <C>{tb.titulo}</C>
      </figcaption>
      <div className="mt-3 overflow-x-auto rounded-card bg-ink-900">
        <table className={`w-full text-left text-sm ${tb.colunas.length > 2 ? "min-w-[30rem]" : ""}`}>
          <thead>
            <tr>
              {tb.colunas.map((c) => (
                <th key={c} scope="col" className="eyebrow px-4 py-3 font-normal text-ink-500 first:pl-5">
                  <C>{c}</C>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tb.linhas.map((linha) => (
              <tr key={linha.join("|")} className="border-t border-white/6 align-top">
                {linha.map((celula, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="whitespace-nowrap px-4 py-3 pl-5 font-display text-base uppercase text-white">
                      {celula}
                    </th>
                  ) : (
                    <td key={i} className="px-4 py-3 leading-relaxed text-ink-300">
                      <C>{celula}</C>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tb.nota && <Paragrafo x={tb.nota} className="mt-2 text-xs leading-relaxed text-ink-500" />}
    </figure>
  );
}

/* ---------------- O guia ---------------- */

export function GuiaModalidade({
  c,
  nota,
  indice,
  cabecalho,
}: {
  c: ConteudoPagina;
  /** Título por cima do guia, alinhado com o texto (nas páginas com competição antes do guia). */
  cabecalho?: ReactNode;
  /** Caixa "Na Motobox" da coluna lateral: o que a Motobox tem desta modalidade. */
  nota: ReactNode;
  /** Índice "Nesta página" (âncoras), já com as secções de competição quando as há. */
  indice: { id: string; nome: string }[];
}) {
  return (
    <div className={cabecalho ? "border-t border-white/6" : undefined}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {cabecalho && (
          <div className="mb-14 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            <div className="w-full max-w-[40rem] lg:mx-auto">{cabecalho}</div>
          </div>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
          {/* ============ COLUNA LATERAL (em cima no telemóvel) ============ */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:order-last lg:self-start">
            <div className="card p-5">
              <h2 className="eyebrow mb-4 text-mb-red">Em resumo</h2>
              <dl>
                {c.factos.map((f) => (
                  <div key={f.rotulo} className="border-b border-white/6 py-2.5 first:pt-0 last:border-0 last:pb-0">
                    <dt className="text-xs text-ink-500">
                      <C>{f.rotulo}</C>
                    </dt>
                    <dd className="mt-0.5 text-sm leading-snug text-white">
                      <C>{f.valor}</C>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {nota}

            <nav aria-label="Nesta página" className="hidden lg:block">
              <p className="eyebrow mb-2 text-ink-500">Nesta página</p>
              <ul>
                {indice.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block border-l-2 border-white/6 py-1.5 pl-3 font-ui text-[15px] text-ink-400 transition-colors hover:border-mb-red hover:text-white"
                    >
                      {s.nome}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ============ TEXTO ============ */}
          <article className="w-full min-w-0 max-w-[40rem] space-y-20 lg:mx-auto">
            {/* O que é */}
            <section>
              <TituloSeccao id="o-que-e" eyebrow="Guia">O que é</TituloSeccao>
              <p className="mt-6 text-xl leading-relaxed text-white sm:text-[22px]">
                <C>{c.abertura}</C>
              </p>
              <Blocos blocos={c.formato} />
            </section>

            {/* Classes */}
            <section>
              <TituloSeccao id="classes" eyebrow="Quem corre com quê">Classes e categorias</TituloSeccao>
              {c.classes.map((tb) => (
                <TabelaClasses key={tb.titulo} tb={tb} />
              ))}

              {c.maquinas.length > 0 && (
                <>
                  <Subtitulo>Máquinas e custos</Subtitulo>
                  <div className="mt-3 space-y-4">
                    {c.maquinas.map((p) => (
                      <Paragrafo key={p.texto.slice(0, 48)} x={p} className={CORPO} />
                    ))}
                  </div>
                </>
              )}

              {c.equipamento.length > 0 && (
                <>
                  <Subtitulo>Equipamento de protecção</Subtitulo>
                  <ul className="mt-4">
                    {c.equipamento.map((p) => (
                      <li key={p.texto.slice(0, 48)} className="flex items-start gap-3 border-b border-white/6 py-3 last:border-0">
                        <Icon name="shield" className="mt-1 size-4 shrink-0 text-mb-red" />
                        <Paragrafo x={p} className="text-[15px] leading-relaxed text-ink-300" />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            {/* Angola */}
            <section>
              <TituloSeccao id="angola" eyebrow="A cena nacional">Em Angola</TituloSeccao>
              <div className="mt-6 space-y-4">
                {c.angola.intro.map((p) => (
                  <Paragrafo key={p.texto.slice(0, 48)} x={p} className={CORPO} />
                ))}
              </div>

              {c.angola.marcos.length > 0 && (
                <>
                  <Subtitulo>Marcos</Subtitulo>
                  <ol className="mt-5 border-l border-white/10">
                    {c.angola.marcos.map((m) => (
                      <li key={m.ano + m.texto.slice(0, 24)} className="relative pb-6 pl-6 last:pb-0">
                        <span className="absolute -left-[5px] top-2 size-2.5 rounded-full bg-mb-red" aria-hidden />
                        <p className="font-display text-xl leading-none text-white tabular-nums">{m.ano}</p>
                        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-300">
                          <C>{m.texto}</C>
                          <Refs n={m.fontes} />
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              <Blocos blocos={c.angola.blocos} />
            </section>

            {/* Lá fora */}
            <section>
              <TituloSeccao id="internacional" eyebrow="Campeonatos de referência">Lá fora</TituloSeccao>
              <div className="mt-6">
                {c.internacional.map((i) => (
                  <div key={i.nome} className="border-t border-white/6 py-6 first:border-0 first:pt-0">
                    <h3 className="font-display text-xl uppercase leading-tight text-white">{i.nome}</h3>
                    <Paragrafo x={i.texto} className={`mt-2 ${CORPO}`} />
                    {i.seguir && (
                      <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-ink-400">
                        <Icon name="play" className="mt-1 size-3.5 shrink-0 text-mb-red" />
                        <span>
                          <span className="text-ink-200">Como acompanhar:</span> <C>{i.seguir}</C>
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {c.lusofonia.length > 0 && (
                <>
                  <Subtitulo>Ligações lusófonas e africanas</Subtitulo>
                  <div className="mt-3 space-y-4">
                    {c.lusofonia.map((p) => (
                      <Paragrafo key={p.texto.slice(0, 48)} x={p} className={CORPO} />
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* Como começar */}
            <section>
              <TituloSeccao id="comecar" eyebrow="Primeiros passos">Como começar</TituloSeccao>
              <ol className="mt-6">
                {c.comecar.passos.map((p, i) => (
                  <li key={p.titulo} className="flex items-start gap-5 border-b border-white/6 py-5 first:pt-0 last:border-0">
                    <span className="w-7 shrink-0 font-display text-3xl leading-none text-mb-red tabular-nums">{i + 1}</span>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg uppercase leading-tight text-white">
                        <C>{p.titulo}</C>
                      </h3>
                      <Paragrafo x={p.texto} className="mt-1.5 text-[15px] leading-relaxed text-ink-300 sm:text-base" />
                    </div>
                  </li>
                ))}
              </ol>

              {c.comecar.seguranca.length > 0 && (
                <div className="mt-8 rounded-card bg-ink-900 p-6">
                  <h3 className="flex items-center gap-2 font-display text-lg uppercase text-white">
                    <Icon name="shield" className="size-5 text-mb-red" />
                    Segurança primeiro
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {c.comecar.seguranca.map((s) => (
                      <li key={s.slice(0, 48)} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-300">
                        <Icon name="check" className="mt-1 size-4 shrink-0 text-ok" />
                        <span>
                          <C>{s}</C>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Fontes */}
            <section>
              <TituloSeccao id="fontes" eyebrow="De onde vem esta informação">Fontes</TituloSeccao>
              <ol className="mt-6 space-y-2">
                {c.fontes.map((f, i) => (
                  <li key={f.url} id={`fonte-${i + 1}`} className="flex scroll-mt-28 gap-3 text-sm">
                    <span className="w-6 shrink-0 text-right font-ui text-ink-500 tabular-nums">{i + 1}</span>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 break-words text-ink-300 underline decoration-white/15 underline-offset-2 hover:text-white"
                    >
                      {f.nome}
                    </a>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-xs leading-relaxed text-ink-500">
                {`Informação verificada em ${VERIFICADO_EM}. Regulamentos, preços e calendários mudam: confirme sempre junto da federação, do clube ou do organizador.`}
              </p>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}

/** Índice "Nesta página" em pílulas, por baixo do cabeçalho (útil sobretudo no telemóvel). */
export function IndicePagina({ indice }: { indice: { id: string; nome: string }[] }) {
  return (
    <nav aria-label="Nesta página" className="border-b border-white/6 bg-ink-950">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto no-scrollbar px-4 py-3 sm:px-6">
        <span className="eyebrow mr-2 shrink-0 text-ink-500">Nesta página</span>
        {indice.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip h-8 px-3.5 text-sm">
            {s.nome}
          </a>
        ))}
      </div>
    </nav>
  );
}
