/* O guia de uma modalidade (/desporto/<modalidade>): o que é, classes, a cena
   em Angola, os campeonatos lá fora, como começar e as fontes, no desenho do
   painel. Componente de servidor; o texto longo passa por <C> para a tradução
   automática, e os títulos fixos ficam em português no JSX (com a versão
   inglesa em lib/i18n/interface-en.ts). O texto vem de lib/desporto-conteudo.ts. */

import type { ReactNode } from "react";
import { Check, PlayCircle, ShieldCheck } from "lucide-react";
import { C } from "@/components/T";
import { Seccao } from "@/components/painel/blocos";
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
    <sup className="ml-0.5 whitespace-nowrap text-[11px] font-medium leading-none">
      {n.map((i, k) => (
        <span key={i}>
          {k > 0 && <span className="text-white/35">,</span>}
          <a
            href={`#fonte-${i}`}
            aria-label={`Fonte ${i}`}
            className="px-px text-mb-red-light no-underline transition-colors hover:text-white"
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
const CORPO = "text-[17px] leading-[1.75] text-white/80";

/** Título de secção do guia: quadrado numerado, sobretítulo e título. */
function TituloSeccao({ id, n, sobretitulo, children }: { id: string; n: number; sobretitulo: string; children: ReactNode }) {
  return (
    <header id={id} className="scroll-mt-28">
      <p className="flex items-center gap-3 text-sm text-white/60">
        <span aria-hidden className="grid size-8 place-items-center rounded-[4px] bg-mb-red text-xs font-semibold text-white">
          {String(n).padStart(2, "0")}
        </span>
        {sobretitulo}
      </p>
      <h2 className="titulo-3 mt-5">{children}</h2>
    </header>
  );
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="mt-12 text-xl font-semibold leading-snug sm:text-2xl">{children}</h3>;
}

function Blocos({ blocos }: { blocos: Bloco[] }) {
  return (
    <>
      {blocos.map((b) => (
        <div key={b.titulo}>
          <Subtitulo>
            <C>{b.titulo}</C>
          </Subtitulo>
          <div className="mt-4 space-y-4">
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
      <figcaption className="text-lg font-semibold leading-snug">
        <C>{tb.titulo}</C>
      </figcaption>
      <div className="painel painel-escuro mt-4 overflow-x-auto">
        <table className={`w-full text-left text-sm ${tb.colunas.length > 2 ? "min-w-[32rem]" : ""}`}>
          <thead>
            <tr>
              {tb.colunas.map((c) => (
                <th key={c} scope="col" className="px-4 py-3.5 text-xs font-normal text-white/50 first:pl-5">
                  <C>{c}</C>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tb.linhas.map((linha) => (
              <tr key={linha.join("|")} className="border-t border-white/10 align-top">
                {linha.map((celula, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="whitespace-nowrap px-4 py-3.5 pl-5 text-[15px] font-semibold text-white">
                      {celula}
                    </th>
                  ) : (
                    <td key={i} className="px-4 py-3.5 leading-relaxed text-white/75">
                      <C>{celula}</C>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tb.nota && <Paragrafo x={tb.nota} className="mt-3 text-xs leading-relaxed text-white/50" />}
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
  /** Caixa "Na MotoBox" da coluna lateral: o que a MotoBox tem desta modalidade. */
  nota: ReactNode;
  /** Índice "Nesta página" (âncoras), já com as secções de competição quando as há. */
  indice: { id: string; nome: string }[];
}) {
  return (
    // Vem sempre depois de outra secção (os números, ou a competição): sem margem de cima.
    <Seccao className="!pt-0">
      {cabecalho && <div className="mb-14 lg:mb-16">{cabecalho}</div>}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16 xl:gap-24">
        {/* ============ COLUNA LATERAL (em cima no telemóvel) ============ */}
        <aside className="lg:order-last">
          <div className="space-y-[var(--intervalo)]">
            <div className="painel painel-escuro p-6">
              <h2 className="text-sm text-mb-red-light">Em resumo</h2>
              <dl className="mt-4">
                {c.factos.map((f) => (
                  <div key={f.rotulo} className="border-b border-white/10 py-3 first:pt-0 last:border-0 last:pb-0">
                    <dt className="text-xs text-white/55">
                      <C>{f.rotulo}</C>
                    </dt>
                    <dd className="mt-1 text-sm leading-snug text-white">
                      <C>{f.valor}</C>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {nota}
          </div>

          {/* O índice acompanha a leitura no computador (o painel rola por dentro). */}
          <nav aria-label="Nesta página" className="mt-10 hidden lg:sticky lg:top-28 lg:block">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Nesta página</p>
            <ul className="mt-4">
              {indice.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block border-l-2 border-white/10 py-1.5 pl-4 text-[15px] text-white/65 transition-colors hover:border-mb-red hover:text-white"
                  >
                    {s.nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* ============ TEXTO ============ */}
        <article className="w-full min-w-0 max-w-[44rem] space-y-24">
          {/* O que é */}
          <section>
            <TituloSeccao id="o-que-e" n={1} sobretitulo="Guia">O que é</TituloSeccao>
            <p className="mt-8 text-xl leading-relaxed text-white sm:text-[22px]">
              <C>{c.abertura}</C>
            </p>
            <Blocos blocos={c.formato} />
          </section>

          {/* Classes */}
          <section>
            <TituloSeccao id="classes" n={2} sobretitulo="Quem corre com quê">Classes e categorias</TituloSeccao>
            {c.classes.map((tb) => (
              <TabelaClasses key={tb.titulo} tb={tb} />
            ))}

            {c.maquinas.length > 0 && (
              <>
                <Subtitulo>Máquinas e custos</Subtitulo>
                <div className="mt-4 space-y-4">
                  {c.maquinas.map((p) => (
                    <Paragrafo key={p.texto.slice(0, 48)} x={p} className={CORPO} />
                  ))}
                </div>
              </>
            )}

            {c.equipamento.length > 0 && (
              <>
                <Subtitulo>Equipamento de protecção</Subtitulo>
                <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)]">
                  {c.equipamento.map((p) => (
                    <li key={p.texto.slice(0, 48)} className="painel painel-escuro flex items-start gap-4 p-4 pr-5">
                      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-mb-red-light" aria-hidden />
                      <Paragrafo x={p} className="text-[15px] leading-relaxed text-white/80" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Angola */}
          <section>
            <TituloSeccao id="angola" n={3} sobretitulo="A cena nacional">Em Angola</TituloSeccao>
            <div className="mt-8 space-y-4">
              {c.angola.intro.map((p) => (
                <Paragrafo key={p.texto.slice(0, 48)} x={p} className={CORPO} />
              ))}
            </div>

            {c.angola.marcos.length > 0 && (
              <>
                <Subtitulo>Marcos</Subtitulo>
                <ol className="mt-6 border-l border-white/15">
                  {c.angola.marcos.map((m) => (
                    <li key={m.ano + m.texto.slice(0, 24)} className="relative pb-7 pl-7 last:pb-0">
                      <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-mb-red" aria-hidden />
                      <p className="text-xl font-semibold leading-none tabular-nums">{m.ano}</p>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/80">
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
            <TituloSeccao id="internacional" n={4} sobretitulo="Campeonatos de referência">Lá fora</TituloSeccao>
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)]">
              {c.internacional.map((i) => (
                <div key={i.nome} className="painel painel-escuro p-6">
                  <h3 className="text-xl font-semibold leading-snug">{i.nome}</h3>
                  <Paragrafo x={i.texto} className="mt-3 text-[15px] leading-relaxed text-white/80 sm:text-base" />
                  {i.seguir && (
                    <p className="mt-4 flex items-start gap-2.5 rounded-[4px] bg-white/[0.05] p-3 text-sm leading-relaxed text-white/70">
                      <PlayCircle className="mt-0.5 size-4 shrink-0 text-mb-red-light" aria-hidden />
                      <span>
                        <span className="text-white">Como acompanhar:</span> <C>{i.seguir}</C>
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            {c.lusofonia.length > 0 && (
              <>
                <Subtitulo>Ligações lusófonas e africanas</Subtitulo>
                <div className="mt-4 space-y-4">
                  {c.lusofonia.map((p) => (
                    <Paragrafo key={p.texto.slice(0, 48)} x={p} className={CORPO} />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Como começar */}
          <section>
            <TituloSeccao id="comecar" n={5} sobretitulo="Primeiros passos">Como começar</TituloSeccao>
            <ol className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)]">
              {c.comecar.passos.map((p, i) => (
                <li key={p.titulo} className="painel painel-escuro flex items-start gap-5 p-5 sm:p-6">
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold leading-snug">
                      <C>{p.titulo}</C>
                    </h3>
                    <Paragrafo x={p.texto} className="mt-2 text-[15px] leading-relaxed text-white/80" />
                  </div>
                </li>
              ))}
            </ol>

            {c.comecar.seguranca.length > 0 && (
              <div className="painel painel-escuro mt-10 p-6 md:p-8">
                <h3 className="flex items-center gap-2.5 text-lg font-semibold">
                  <ShieldCheck className="size-5 text-mb-red-light" aria-hidden />
                  Segurança primeiro
                </h3>
                <ul className="mt-5 space-y-3">
                  {c.comecar.seguranca.map((s) => (
                    <li key={s.slice(0, 48)} className="flex items-start gap-3 text-[15px] leading-relaxed text-white/85">
                      <Check className="mt-1 size-4 shrink-0 text-mb-red-light" aria-hidden />
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
            <TituloSeccao id="fontes" n={6} sobretitulo="De onde vem esta informação">Fontes</TituloSeccao>
            <ol className="mt-8 space-y-2.5">
              {c.fontes.map((f, i) => (
                <li key={f.url} id={`fonte-${i + 1}`} className="flex scroll-mt-28 gap-3 text-sm">
                  <span className="w-6 shrink-0 text-right text-white/40 tabular-nums">{i + 1}</span>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 break-words text-white/75 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white hover:decoration-mb-red-light"
                  >
                    {f.nome}
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-8 rounded-[var(--raio)] bg-white/5 p-5 text-sm leading-relaxed text-white/65">
              {`Informação verificada em ${VERIFICADO_EM}. Regulamentos, preços e calendários mudam: confirme sempre junto da federação, do clube ou do organizador.`}
            </p>
          </section>
        </article>
      </div>
    </Seccao>
  );
}

/**
 * Índice "Nesta página" em pílulas, por baixo dos números da abertura (útil
 * sobretudo no telemóvel, onde o índice lateral não aparece).
 */
export function IndicePagina({ indice }: { indice: { id: string; nome: string }[] }) {
  return (
    <nav aria-label="Nesta página" className="mt-10">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Nesta página</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {indice.map((s, i) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="pilula">
              <span className="text-white/40 tabular-nums">{String(i + 1).padStart(2, "0")}</span> {s.nome}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
