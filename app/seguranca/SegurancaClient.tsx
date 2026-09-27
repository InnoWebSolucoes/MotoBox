"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Placeholder } from "@/components/Brand";
import { ButtonLink, Icon } from "@/components/ui";
import { useIdioma } from "@/lib/i18n/contexto";
import {
  ACIDENTE, CABECA, CAPACETE, CHUVA, EQUIPAMENTO, FONTES, GRUPO, HISTORIAS, NUMEROS,
  PASSAGEIROS, SECCOES, SEGURO, UI, VERIFICACAO, VISIBILIDADE, type Bi,
} from "./conteudo";

/* ============================================================
   MOTOBOX — Segurança
   Página editorial: abertura com os números da OMS, navegação
   por âncoras que acompanha a leitura, secções numeradas e as
   fontes no fim. O texto vive em ./conteudo.ts, nas duas línguas.
   ============================================================ */

/** Botão em pílula para âncoras da própria página (o <Link> não faz falta aqui). */
const pilula =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 font-ui text-base transition-colors";

export function SegurancaClient() {
  const { idioma } = useIdioma();
  const x = (v: Bi | string) => (typeof v === "string" ? v : v[idioma]);

  return (
    <>
      {/* ============ ABERTURA ============ */}
      <section className="relative isolate overflow-hidden">
        <Placeholder
          nome="capacete"
          className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[62%]"
          tamanhos="(max-width: 1024px) 100vw, 62vw"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950 via-ink-950/90 to-ink-950/30" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-ink-950 to-transparent" aria-hidden />
        <div className="stripes absolute inset-0 -z-10" aria-hidden />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-12 sm:pt-24 sm:pb-16">
          <div className="max-w-3xl rise">
            <p className="eyebrow text-mb-red">{x(UI.eyebrow)}</p>
            <h1 className="title-xl mt-4 text-5xl sm:text-6xl lg:text-7xl">
              {x(UI.titulo1)}
              <br />
              <span className="text-mb-red">{x(UI.titulo2)}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg text-ink-300 leading-relaxed">{x(UI.sub)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#capacete" className={`${pilula} bg-mb-red text-white hover:bg-mb-red-dark`}>
                {x(UI.comecar)}
                <Icon name="arrow" className="size-4 rotate-90" />
              </a>
              <a href="#historias" className={`${pilula} border-2 border-ink-500 text-white hover:border-white`}>
                {x(UI.lerHistorias)}
              </a>
            </div>
          </div>

          {/* Os números: grandes, separados por linhas finas, com a fonte por baixo */}
          <dl className="mt-14 grid gap-x-10 gap-y-7 sm:grid-cols-3">
            {NUMEROS.map((n) => (
              <div key={n.valor} className="border-t border-white/12 pt-5">
                <dt className="sr-only">{x(n.texto)}</dt>
                <dd>
                  <span className="block font-display text-5xl sm:text-6xl leading-none text-white tabular-nums">
                    {n.prefixo && <span className="mr-2 align-top font-ui text-lg text-ink-400">{x(n.prefixo)}</span>}
                    {n.valor}
                  </span>
                  <span className="mt-3 block max-w-[16rem] text-sm text-ink-300 leading-snug">{x(n.texto)}</span>
                  <span className="mt-2 block text-[11px] uppercase tracking-widest text-ink-500">
                    {x(UI.fonte)}: {x(n.fonte)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <NavSeccoes rotulo={x(UI.nestaPagina)} itens={SECCOES.map((s) => ({ id: s.id, nome: x(s.nome) }))} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ============ 01 · CAPACETE ============ */}
        <Seccao id="capacete" n={1} nome={x(SECCOES[0].nome)} titulo={x(CAPACETE.titulo)} lead={x(CAPACETE.lead)}>
          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_minmax(0,300px)] md:items-center lg:grid-cols-[1fr_minmax(0,360px)] lg:gap-14">
            <Lei texto={x(CAPACETE.lei)} fonte={x(CAPACETE.leiFonte)} semMargem />
            <figure>
              <Placeholder nome="equipamento" className="media aspect-[4/3] w-full" tamanhos="(max-width: 768px) 100vw, 360px" />
              <figcaption className="mt-3 text-xs text-ink-500 leading-relaxed">{x(CAPACETE.fotoLegenda)}</figcaption>
            </figure>
          </div>

          <div className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-3">
            {CAPACETE.grupos.map((g) => (
              <div key={g.titulo.pt}>
                <h3 className="border-b border-white/10 pb-3 font-display text-2xl uppercase text-white">{x(g.titulo)}</h3>
                <ul>
                  {g.itens.map((i) => (
                    <li key={i.pt} className="border-b border-white/6 py-3.5 text-sm text-ink-300 leading-relaxed last:border-0">
                      {x(i)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Seccao>

        {/* ============ 02 · CHUVA ============ */}
        <Seccao id="chuva" n={2} nome={x(SECCOES[1].nome)} titulo={x(CHUVA.titulo)} lead={x(CHUVA.lead)}>
          <div className="mt-10 grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-14">
            {/* Riscas de chuva por trás do número: textura, não caixa */}
            <div
              className="relative overflow-hidden rounded-card bg-ink-900 p-7 lg:sticky lg:top-36 lg:self-start"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(104deg, transparent 0 18px, rgb(255 255 255 / 0.05) 18px 19px, transparent 19px 41px)",
              }}
            >
              <p className="font-display text-8xl leading-none text-white">{CHUVA.numero}</p>
              <p className="mt-4 text-base text-ink-200 leading-snug">{x(CHUVA.numeroTexto)}</p>
              <p className="mt-3 text-[11px] uppercase tracking-widest text-ink-500">
                {x(UI.fonte)}: {x(CHUVA.numeroFonte)}
              </p>
            </div>
            <ol className="grid gap-x-10 sm:grid-cols-2">
              {CHUVA.dicas.map((d, i) => (
                <li key={d.titulo.pt} className="flex gap-4 border-b border-white/6 py-5">
                  <span className="w-7 shrink-0 font-display text-2xl leading-none text-mb-red tabular-nums">{i + 1}</span>
                  <div>
                    <h3 className="font-display text-lg uppercase leading-tight text-white">{x(d.titulo)}</h3>
                    <p className="mt-1.5 text-sm text-ink-400 leading-relaxed">{x(d.texto)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Seccao>

        {/* ============ 03 · VER E SER VISTO ============ */}
        <Seccao id="visibilidade" n={3} nome={x(SECCOES[2].nome)} titulo={x(VISIBILIDADE.titulo)} lead={x(VISIBILIDADE.lead)}>
          <ListaVisto itens={VISIBILIDADE.dicas.map(x)} />
        </Seccao>

        {/* ============ 04 · EQUIPAMENTO ============ */}
        <Seccao id="equipamento" n={4} nome={x(SECCOES[3].nome)} titulo={x(EQUIPAMENTO.titulo)} lead={x(EQUIPAMENTO.lead)}>
          <dl className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-3">
            {EQUIPAMENTO.numeros.map((n) => (
              <div key={n.valor} className="border-t-2 border-mb-red! pt-4">
                <dt className="sr-only">{x(n.texto)}</dt>
                <dd>
                  <span className="block font-display text-5xl leading-none text-white tabular-nums">{n.valor}</span>
                  <span className="mt-2 block text-sm text-ink-300">{x(n.texto)}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-ink-500">
            {x(UI.fonte)}: {x(EQUIPAMENTO.estudo)}
          </p>

          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {EQUIPAMENTO.pecas.map((p) => (
              <div key={p.nome.pt}>
                <h3 className="font-display text-2xl uppercase text-white">{x(p.nome)}</h3>
                <p className="mt-2 text-sm text-ink-400 leading-relaxed">{x(p.texto)}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 flex items-start gap-3 text-sm text-ink-300 leading-relaxed">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mb-red/12 text-mb-red">
              <Icon name="tag" className="size-4" />
            </span>
            <span className="pt-1.5">{x(EQUIPAMENTO.etiquetas)}</span>
          </p>
        </Seccao>

        {/* ============ 05 · PASSAGEIROS ============ */}
        <Seccao id="passageiros" n={5} nome={x(SECCOES[4].nome)} titulo={x(PASSAGEIROS.titulo)} lead={x(PASSAGEIROS.lead)}>
          <Lei texto={x(PASSAGEIROS.lei)} fonte={x(PASSAGEIROS.leiFonte)} />
          <ListaVisto itens={PASSAGEIROS.dicas.map(x)} />
        </Seccao>

        {/* ============ 06 · CABEÇA FRIA ============ */}
        <Seccao id="cabeca" n={6} nome={x(SECCOES[5].nome)} titulo={x(CABECA.titulo)} lead={x(CABECA.lead)}>
          <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {CABECA.temas.map((t) => (
              <div key={t.titulo.pt}>
                <span className="grid size-12 place-items-center rounded-full bg-mb-red/12 text-mb-red">
                  <Icon name={t.icone} className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-2xl uppercase text-white">{x(t.titulo)}</h3>
                <p className="mt-1 font-display text-lg text-mb-red">{x(t.destaque)}</p>
                <p className="mt-3 text-sm text-ink-400 leading-relaxed">{x(t.texto)}</p>
              </div>
            ))}
          </div>
        </Seccao>

        {/* ============ 07 · ANTES DE SAIR ============ */}
        <Seccao id="verificacao" n={7} nome={x(SECCOES[6].nome)} titulo={x(VERIFICACAO.titulo)} lead={x(VERIFICACAO.lead)}>
          <ol className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {VERIFICACAO.itens.map((v) => (
              <li key={v.nome.pt} className="flex gap-5 border-b border-white/6 py-6">
                <span
                  aria-hidden
                  className="w-10 shrink-0 font-display text-5xl leading-none text-transparent"
                  style={{ WebkitTextStroke: "1.5px var(--color-mb-red)" }}
                >
                  {v.letra}
                </span>
                <div>
                  <h3 className="font-display text-lg uppercase leading-tight text-white">{x(v.nome)}</h3>
                  <p className="mt-1.5 text-sm text-ink-400 leading-relaxed">{x(v.texto)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Seccao>

        {/* ============ 08 · EM GRUPO ============ */}
        <Seccao id="grupo" n={8} nome={x(SECCOES[7].nome)} titulo={x(GRUPO.titulo)} lead={x(GRUPO.lead)}>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-14">
            <div>
              <ListaVisto itens={GRUPO.dicas.map(x)} compacta semMargem />
              <div className="mt-8">
                <ButtonLink href="/clubes" variant="dark">
                  {x(GRUPO.clubes)}
                  <Icon name="arrow" className="size-4" />
                </ButtonLink>
              </div>
            </div>
            <div className="space-y-6">
              <Placeholder nome="passeios" className="media aspect-[16/10] w-full" tamanhos="(max-width: 1024px) 100vw, 420px" />
              <Formacao
                titulo={x(GRUPO.diagramaTitulo)}
                sentido={x(GRUPO.diagramaSentido)}
                lider={x(GRUPO.diagramaLider)}
                fecho={x(GRUPO.diagramaFecho)}
                descricao={x(GRUPO.diagramaDescricao)}
              />
            </div>
          </div>
        </Seccao>

        {/* ============ 09 · EM CASO DE ACIDENTE ============ */}
        <Seccao id="acidente" n={9} nome={x(SECCOES[8].nome)} titulo={x(ACIDENTE.titulo)} lead={x(ACIDENTE.lead)}>
          <div className="mt-10 grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
            <div className="rounded-card bg-mb-red/10 p-7 lg:sticky lg:top-36 lg:self-start">
              <a
                href={`tel:${ACIDENTE.numero}`}
                className="block font-display text-8xl leading-none text-mb-red transition-colors hover:text-mb-red-light"
              >
                {ACIDENTE.numero}
              </a>
              <p className="mt-4 text-sm text-ink-200 leading-relaxed">{x(ACIDENTE.numeroTexto)}</p>
              <p className="mt-4 border-t border-white/10 pt-4 text-sm text-ink-400 leading-relaxed">{x(ACIDENTE.numeroDica)}</p>
            </div>
            <ol className="space-y-8">
              {ACIDENTE.passos.map((p, i) => (
                <li key={p.nome.pt} className="grid gap-3 sm:grid-cols-[150px_1fr] sm:gap-6">
                  <h3 className="flex items-baseline gap-3 font-display text-2xl uppercase text-white">
                    <span className="font-display text-mb-red tabular-nums">{i + 1}</span>
                    {x(p.nome)}
                  </h3>
                  <ul>
                    {p.itens.map((item) => (
                      <li key={item.pt} className="border-b border-white/6 py-3 text-sm text-ink-300 leading-relaxed first:pt-1 last:border-0">
                        {x(item)}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-10 flex items-start gap-3 text-sm text-ink-300 leading-relaxed">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mb-red/12 text-mb-red">
              <Icon name="heart" className="size-4" />
            </span>
            <span className="pt-1.5">{x(ACIDENTE.extra)}</span>
          </p>
        </Seccao>

        {/* ============ 10 · SEGURO ============ */}
        <Seccao id="seguro" n={10} nome={x(SECCOES[9].nome)} titulo={x(SEGURO.titulo)} lead={x(SEGURO.texto)}>
          <ListaVisto itens={SEGURO.itens.map(x)} />
        </Seccao>
      </div>

      {/* ============ 11 · HISTÓRIAS ============ */}
      <section id="historias" className="scroll-mt-32 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
          <CabecaSeccao n={11} nome={x(SECCOES[10].nome)} titulo={x(HISTORIAS.titulo)} />
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink-800 px-4 py-2 text-xs text-ink-200">
            <Icon name="help" className="size-4 shrink-0 text-mb-red" />
            {x(HISTORIAS.aviso)}
          </p>

          <div className="mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-2">
            {HISTORIAS.lista.map((h, i) => (
              <article key={h.titulo.pt} className="border-t border-white/10 pt-6">
                <p className="font-display text-sm text-mb-red tabular-nums">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-display text-3xl uppercase leading-[0.95] text-white">{x(h.titulo)}</h3>
                <p className="mt-4 text-[15px] text-ink-300 leading-relaxed">{x(h.texto)}</p>
                <p className="mt-5 border-l-2 border-mb-red! pl-4 text-sm text-white leading-relaxed">
                  <span className="eyebrow mb-1 block text-mb-red">{x(UI.licao)}</span>
                  {x(h.licao)}
                </p>
              </article>
            ))}
          </div>

          {/* Convite: contar a própria história */}
          <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h3 className="title-xl text-3xl sm:text-4xl">{x(HISTORIAS.convite)}</h3>
              <p className="mt-3 text-sm text-ink-400 leading-relaxed">{x(HISTORIAS.conviteTexto)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/forum">
                <Icon name="chat" className="size-4" />
                {x(HISTORIAS.forum)}
              </ButtonLink>
              <ButtonLink href="/contacto" variant="outline">
                {x(HISTORIAS.contacto)}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FONTES ============ */}
      <section id="fontes" className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="eyebrow accent-bar text-white">{x(UI.fontesTitulo)}</h2>
        <p className="max-w-3xl text-sm text-ink-400 leading-relaxed">{x(UI.fontesSub)}</p>
        <ol className="mt-6 grid gap-x-10 text-xs sm:grid-cols-2">
          {FONTES.map((f, i) => (
            <li key={f.url} className="flex gap-3 border-b border-white/6 py-2.5">
              <span className="w-5 shrink-0 text-right text-ink-600 tabular-nums">{i + 1}</span>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-300 underline decoration-white/15 underline-offset-2 transition-colors hover:text-white hover:decoration-mb-red"
              >
                {x(f.nome)}
                <span className="sr-only"> ({x(UI.abreNovaJanela)})</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-3xl text-xs text-ink-500 leading-relaxed">{x(UI.aviso)}</p>
      </section>
    </>
  );
}

/* ---------------- Peças da página ---------------- */

function CabecaSeccao({ n, nome, titulo, lead }: { n: number; nome: string; titulo: string; lead?: string }) {
  return (
    <header className="grid gap-4 lg:grid-cols-[140px_1fr] lg:gap-8">
      <p
        aria-hidden
        className="font-display text-6xl leading-none text-transparent tabular-nums lg:text-8xl"
        style={{ WebkitTextStroke: "1.5px var(--color-mb-red)" }}
      >
        {String(n).padStart(2, "0")}
      </p>
      <div className="max-w-3xl">
        <p className="eyebrow text-mb-red">{nome}</p>
        <h2 className="title-xl mt-2 text-4xl sm:text-5xl">{titulo}</h2>
        {lead && <p className="mt-5 text-base sm:text-lg text-ink-300 leading-relaxed">{lead}</p>}
      </div>
    </header>
  );
}

function Seccao({
  id, n, nome, titulo, lead, children,
}: { id: string; n: number; nome: string; titulo: string; lead: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 border-t border-white/6 py-16 first:border-0 sm:py-20">
      <CabecaSeccao n={n} nome={nome} titulo={titulo} lead={lead} />
      <div className="lg:pl-[172px]">{children}</div>
    </section>
  );
}

/** Citação da lei: barra vermelha à esquerda, sem caixa. */
function Lei({ texto, fonte, semMargem = false }: { texto: string; fonte: string; semMargem?: boolean }) {
  return (
    <blockquote className={`${semMargem ? "" : "mt-10"} max-w-3xl border-l-4 border-mb-red! pl-5 sm:pl-6`}>
      <p className="text-lg sm:text-xl text-white leading-snug">{texto}</p>
      <footer className="mt-3 text-[11px] uppercase tracking-widest text-ink-500">{fonte}</footer>
    </blockquote>
  );
}

/** Lista de conselhos com um visto em círculo, separada por linhas finas. */
function ListaVisto({
  itens, compacta = false, semMargem = false,
}: { itens: string[]; compacta?: boolean; semMargem?: boolean }) {
  return (
    <ul className={`grid gap-x-10 ${semMargem ? "" : "mt-10"} ${compacta ? "" : "md:grid-cols-2"}`}>
      {itens.map((t) => (
        <li key={t} className="flex gap-4 border-b border-white/6 py-4">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-mb-red/15 text-mb-red">
            <Icon name="check" className="size-3.5" />
          </span>
          <span className="text-sm text-ink-300 leading-relaxed">{t}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Esquema da formação em ziguezague, visto de cima: uma faixa, cinco motas,
 * o líder à frente no terço esquerdo. Trânsito pela direita, como em Angola.
 */
function Formacao({
  titulo, sentido, lider, fecho, descricao,
}: { titulo: string; sentido: string; lider: string; fecho: string; descricao: string }) {
  // Do líder (em cima) ao fecho (em baixo), alternando esquerda e direita.
  const motas = [
    { x: 70, y: 46 }, { x: 150, y: 86 }, { x: 70, y: 126 }, { x: 150, y: 166 }, { x: 70, y: 206 },
  ];
  return (
    <figure className="rounded-card bg-ink-900 p-5">
      <figcaption className="eyebrow text-ink-400">{titulo}</figcaption>
      <svg viewBox="0 0 300 250" role="img" aria-label={descricao} className="mt-3 w-full">
        {/* Faixa de rodagem, com as linhas a tracejado */}
        <rect x="30" y="10" width="160" height="230" rx="10" fill="rgb(255 255 255 / 0.04)" />
        <path d="M30 10v230M190 10v230" stroke="rgb(255 255 255 / 0.25)" strokeWidth="2" strokeDasharray="10 9" />
        <path d="M83 14v222M137 14v222" stroke="rgb(255 255 255 / 0.07)" strokeWidth="1" />
        {motas.map((m, i) => (
          <g key={i}>
            <rect
              x={m.x - 6} y={m.y - 15} width="12" height="30" rx="6"
              fill={i === 0 ? "#e10600" : i === motas.length - 1 ? "#dcdce2" : "#8b8b96"}
            />
            <circle cx={m.x} cy={m.y - 4} r="4.5" fill="#0a0a0c" />
          </g>
        ))}
        <text x="84" y="50" fill="#f2f2f5" fontSize="12" fontFamily="var(--font-display)" fontWeight="700">{lider}</text>
        <text x="84" y="210" fill="#b9b9c2" fontSize="12" fontFamily="var(--font-display)" fontWeight="700">{fecho}</text>
        {/* Sentido de marcha */}
        <path d="M240 200V50m0 0-9 11m9-11 9 11" stroke="#e10600" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text
          x="262" y="125" fill="#8b8b96" fontSize="11" textAnchor="middle"
          transform="rotate(-90 262 125)" fontFamily="var(--font-display)" fontWeight="700"
        >
          {sentido}
        </text>
      </svg>
    </figure>
  );
}

/**
 * Navegação por âncoras, colada por baixo do menu principal. Sublinha a
 * secção que se está a ler e, no telemóvel, desliza para a manter à vista.
 */
function NavSeccoes({ itens, rotulo }: { itens: { id: string; nome: string }[]; rotulo: string }) {
  const [activa, setActiva] = useState<string | null>(null);
  const trilho = useRef<HTMLDivElement>(null);

  // As secções são fixas (SECCOES): observa-se uma vez, seja qual for a língua.
  useEffect(() => {
    const alvos = SECCOES
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => Boolean(e));
    // Conta como "a ler" a secção que atravessa a faixa do meio do ecrã.
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setActiva(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    alvos.forEach((a) => obs.observe(a));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const t = trilho.current;
    const el = activa ? t?.querySelector<HTMLElement>(`[data-id="${activa}"]`) : null;
    if (!t || !el) return;
    // Só mexe na barra, na horizontal: um scrollIntoView podia travar o deslizar da página.
    t.scrollTo({ left: el.offsetLeft - t.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [activa]);

  return (
    <nav aria-label={rotulo} className="sticky top-16 z-30 border-b border-white/6 bg-ink-950/95 backdrop-blur-md">
      <div ref={trilho} className="mx-auto flex max-w-7xl overflow-x-auto no-scrollbar px-2 sm:px-4">
        {itens.map((i) => {
          const ligada = activa === i.id;
          return (
            <a
              key={i.id}
              href={`#${i.id}`}
              data-id={i.id}
              aria-current={ligada ? "location" : undefined}
              className={`relative flex h-12 shrink-0 items-center px-3 font-ui text-[15px] transition-colors hover:text-white ${
                ligada
                  ? "text-white after:absolute after:inset-x-2.5 after:bottom-0 after:h-[3px] after:rounded-t-[3px] after:bg-mb-red"
                  : "text-ink-400"
              }`}
            >
              {i.nome}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
