"use client";

import Link from "next/link";
import { Icon, PageHero, Tag } from "@/components/ui";
import { useIdioma } from "@/lib/i18n/contexto";
import { FormularioImportacao } from "./FormularioImportacao";
import {
  CATEGORIAS, FONTES, ONDE_PROCURAR, PASSOS, REGRAS, TEXTO, type Bi,
} from "./conteudo";

/* ============================================================
   MOTOBOX — Marketplace: importar do estrangeiro
   Explica o processo, o que a lei pede, onde procurar (sem
   parceiros inventados) e recebe o pedido. O texto vive em
   ./conteudo.ts, nas duas línguas.
   ============================================================ */

const pilula =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 font-ui text-base transition-colors";

/** Domínio sem "www.", para mostrar por baixo do nome de cada sítio. */
const dominio = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export function ImportarClient() {
  const { idioma } = useIdioma();
  const x = (v: Bi) => v[idioma];

  return (
    <>
      <PageHero imagem="marketplace" eyebrow={x(TEXTO.eyebrow)} titulo={x(TEXTO.titulo)} descricao={x(TEXTO.sub)}>
        <div className="flex flex-wrap items-center gap-3">
          <a href="#pedido" className={`${pilula} bg-mb-red text-white hover:bg-mb-red-dark`}>
            <Icon name="plus" className="size-4" />
            {x(TEXTO.pedir)}
          </a>
          <a href="#onde-procurar" className={`${pilula} border-2 border-ink-500 text-white hover:border-white`}>
            {x(TEXTO.ondeProcurar)}
          </a>
          <Link
            href="/marketplace"
            className="ml-1 inline-flex items-center gap-2 font-ui text-base text-ink-300 transition-colors hover:text-white"
          >
            <Icon name="arrow" className="size-4 rotate-180" />
            {x(TEXTO.voltar)}
          </Link>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ============ COMO FUNCIONA ============ */}
        <section aria-labelledby="como" className="py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="como" className="title-xl text-3xl sm:text-4xl">{x(TEXTO.comoTitulo)}</h2>
          </div>
          <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {PASSOS.map((p, i) => (
              <li key={p.titulo.pt} className="border-t-2 border-white/10 pt-5 first:border-mb-red!">
                <span className="font-display text-5xl leading-none text-mb-red tabular-nums">{i + 1}</span>
                <h3 className="mt-3 font-display text-xl uppercase leading-tight text-white">{x(p.titulo)}</h3>
                <p className="mt-2 text-sm text-ink-400 leading-relaxed">{x(p.texto)}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex items-start gap-4 rounded-card bg-mb-red/8 p-5 sm:p-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mb-red/15 text-mb-red">
              <Icon name="flag" className="size-4.5" />
            </span>
            <div>
              <p className="font-display text-base uppercase text-white">{x(TEXTO.arranque)}</p>
              <p className="mt-1 text-sm text-ink-300 leading-relaxed">{x(TEXTO.arranqueTexto)}</p>
            </div>
          </div>
        </section>

        {/* ============ O QUE PODE IMPORTAR ============ */}
        <section aria-labelledby="o-que" className="border-t border-white/6 py-16">
          <h2 id="o-que" className="title-xl text-3xl sm:text-4xl">{x(TEXTO.oQueTitulo)}</h2>
          <div className="mt-8 grid gap-x-10 md:grid-cols-2">
            {CATEGORIAS.map((c) => (
              <div key={c.nome.pt} className="border-b border-white/6 py-5">
                <h3 className="font-display text-xl uppercase text-white">{x(c.nome)}</h3>
                <p className="mt-1.5 text-sm text-ink-400 leading-relaxed">{x(c.texto)}</p>
                {c.ligacao && (
                  <Link
                    href={c.ligacao.href}
                    className="mt-2 inline-flex items-center gap-1.5 font-ui text-sm text-mb-red transition-colors hover:text-mb-red-light"
                  >
                    {x(c.ligacao.texto)}
                    <Icon name="arrow" className="size-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ============ ANTES DE COMPRAR ============ */}
        <section id="regras" aria-labelledby="regras-titulo" className="scroll-mt-24 border-t border-white/6 py-16">
          <div className="max-w-3xl">
            <h2 id="regras-titulo" className="title-xl text-3xl sm:text-4xl">{x(TEXTO.regrasTitulo)}</h2>
            <p className="mt-3 text-sm text-ink-400 leading-relaxed">{x(TEXTO.regrasSub)}</p>
          </div>
          <ol className="mt-8 grid gap-x-10 md:grid-cols-2">
            {REGRAS.map((r, i) => (
              <li key={r.titulo.pt} className="flex gap-4 border-b border-white/6 py-5">
                <span className="w-6 shrink-0 font-display text-2xl leading-none text-mb-red tabular-nums">{i + 1}</span>
                <div>
                  <h3 className="font-display text-lg uppercase leading-tight text-white">{x(r.titulo)}</h3>
                  <p className="mt-1.5 text-sm text-ink-400 leading-relaxed">
                    {x(r.texto)}
                    {r.fonte?.map((n) => (
                      <a
                        key={n}
                        href={`#fonte-${n}`}
                        className="ml-1 align-super text-[10px] text-mb-red hover:underline"
                        aria-label={`${x(TEXTO.fontesTitulo)} ${n}`}
                      >
                        [{n}]
                      </a>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 flex items-start gap-3 text-sm text-white leading-relaxed">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mb-red/12 text-mb-red">
              <Icon name="shield" className="size-4" />
            </span>
            <span className="pt-1.5">{x(TEXTO.despachante)}</span>
          </p>
        </section>

        {/* ============ ONDE PROCURAR ============ */}
        <section id="onde-procurar" aria-labelledby="onde-titulo" className="scroll-mt-24 border-t border-white/6 py-16">
          <div className="max-w-3xl">
            <h2 id="onde-titulo" className="title-xl text-3xl sm:text-4xl">{x(TEXTO.ondeTitulo)}</h2>
            <p className="mt-3 text-sm text-ink-400 leading-relaxed">{x(TEXTO.ondeSub)}</p>
          </div>

          <div className="mt-10 space-y-12">
            {ONDE_PROCURAR.map((g) => (
              <div key={g.grupo.pt}>
                <h3 className="eyebrow text-mb-red">{x(g.grupo)}</h3>
                {g.classificados && (
                  <p className="mt-2 max-w-3xl text-xs text-ink-500 leading-relaxed">{x(TEXTO.classificadosAviso)}</p>
                )}
                <ul className="mt-4 grid gap-x-10 md:grid-cols-2">
                  {g.sitios.map((s) => (
                    <li key={s.url} className="border-b border-white/6">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-4 py-4"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="font-display text-xl uppercase text-white transition-colors group-hover:text-mb-red">
                              {s.nome}
                            </span>
                            <span className="text-xs text-ink-500">{x(s.pais)}</span>
                          </span>
                          <span className="mt-1 block text-sm text-ink-400 leading-relaxed">{x(s.texto)}</span>
                          <span className="mt-1.5 block text-xs text-ink-600">{dominio(s.url)}</span>
                        </span>
                        <span
                          aria-hidden
                          className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-ink-800 text-ink-300 transition-colors group-hover:bg-mb-red group-hover:text-white"
                        >
                          <Icon name="arrow" className="size-4 -rotate-45" />
                        </span>
                        <span className="sr-only">({x(TEXTO.abreNovaJanela)})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ============ PAGAMENTO ============ */}
        <section aria-labelledby="pagamento" className="border-t border-white/6 py-16">
          <h2 id="pagamento" className="title-xl text-3xl sm:text-4xl">{x(TEXTO.pagamentoTitulo)}</h2>
          <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            <div className="border-t-2 border-mb-red! pt-5">
              <h3 className="font-display text-xl uppercase text-white">{x(TEXTO.emKwanzas)}</h3>
              <p className="mt-2 text-sm text-ink-400 leading-relaxed">{x(TEXTO.emKwanzasTexto)}</p>
            </div>
            <div className="border-t-2 border-white/10 pt-5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-xl uppercase text-white">{x(TEXTO.carteiras)}</h3>
                <Tag tone="neutral">{x(TEXTO.emEstudo)}</Tag>
              </div>
              <p className="mt-2 text-sm text-ink-400 leading-relaxed">
                {x(TEXTO.carteirasTexto)}
                <a href="#fonte-4" className="ml-1 align-super text-[10px] text-mb-red hover:underline" aria-label={`${x(TEXTO.fontesTitulo)} 4`}>
                  [4]
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ============ PEDIDO ============ */}
      <section id="pedido" aria-labelledby="pedido-titulo" className="scroll-mt-20 bg-ink-900">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 py-16 lg:grid-cols-[1fr_1.35fr] lg:gap-14">
          <div>
            <p className="eyebrow text-mb-red">{x(TEXTO.titulo)}</p>
            <h2 id="pedido-titulo" className="title-xl mt-2 text-4xl sm:text-5xl">{x(TEXTO.formTitulo)}</h2>
            <p className="mt-4 text-base text-ink-300 leading-relaxed">{x(TEXTO.formSub)}</p>
            <ul className="mt-8">
              {TEXTO.formDicas.map((d) => (
                <li key={d.pt} className="flex gap-3 border-b border-white/6 py-3.5 last:border-0">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-mb-red/15 text-mb-red">
                    <Icon name="check" className="size-3.5" />
                  </span>
                  <span className="text-sm text-ink-300 leading-relaxed">{x(d)}</span>
                </li>
              ))}
            </ul>
          </div>
          <FormularioImportacao />
        </div>
      </section>

      {/* ============ FONTES ============ */}
      <section aria-labelledby="fontes-importar" className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <h2 id="fontes-importar" className="eyebrow accent-bar text-white">{x(TEXTO.fontesTitulo)}</h2>
        <ol className="grid gap-x-10 text-xs sm:grid-cols-2">
          {FONTES.map((f) => (
            <li key={f.n} id={`fonte-${f.n}`} className="flex scroll-mt-24 gap-3 border-b border-white/6 py-2.5">
              <span className="w-5 shrink-0 text-right text-ink-600 tabular-nums">{f.n}</span>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-300 underline decoration-white/15 underline-offset-2 transition-colors hover:text-white hover:decoration-mb-red"
              >
                {x(f.nome)}
                <span className="sr-only"> ({x(TEXTO.abreNovaJanela)})</span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
