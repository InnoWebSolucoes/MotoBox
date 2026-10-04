import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { C } from "@/components/T";
import { ButtonLink, Icon, Tag } from "@/components/ui";
import { comBase } from "@/lib/base";
import {
  CLIMA,
  DOCUMENTOS,
  EMERGENCIA,
  LEVAR_BASE,
  PRECO_COMBUSTIVEL,
  REDE_GERAL,
  ROTAS,
  fontesDaRota,
  lerRota,
  type Facto,
  type Lugar,
} from "@/lib/rotas";
import { MARGEM_MOTA, NOME_PISO, duracao, minMota, paragensDoDia, totais, urlMapaEmbebido, urlNavegacao, urlPonto } from "@/lib/rotas-mapas";
import { urlCommons } from "@/lib/rotas-fotos";
import { FONTE_SOL, solDoAno } from "@/lib/rotas-sol";
import { lerClubes } from "@/lib/supabase/publico";
import { LogoClube } from "../../Partes";
import { localClube } from "../../comum";
import { FotoRota } from "../FotoRota";
import { CreditoFoto, LinksFontes, ListaVisto, TOM_EXIGENCIA } from "../partes";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// As rotas vivem no código: só existem estas páginas.
export const dynamicParams = false;

export function generateStaticParams() {
  return ROTAS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = lerRota(slug);
  if (!r) return { title: "Rota não encontrada" };
  const t = totais(r);
  return {
    title: `${r.nome}: rota de mota`,
    description: `${r.resumo} ${t.km} km, cerca de ${duracao(t.minMota)} a rodar. Mapa, GPX, combustível, onde dormir e cuidados.`,
    openGraph: { images: [{ url: urlCommons(r.fotos[0], 1280), alt: r.fotos[0].alt }] },
  };
}

const pct = (x: number) => Math.round((x - 1) * 100);

/** Texto do método, montado a partir das margens para nunca as contradizer. */
const COMO_CALCULAMOS =
  `Como calculamos: a distância e o tempo de carro de cada troço vêm do OSRM, o motor de rotas sobre o OpenStreetMap. ` +
  `O tempo de mota junta-lhe ${pct(MARGEM_MOTA.asfalto)} % em asfalto, ${pct(MARGEM_MOTA.buracos)} % em asfalto com buracos, ` +
  `${pct(MARGEM_MOTA.terra)} % em terra e ${pct(MARGEM_MOTA.areia)} % em areia, pelo ritmo de grupo, pelos buracos e pelos controlos, ` +
  `e não conta as paragens. As altitudes são do modelo de terreno SRTM (30 m), lidas no OpenTopoData ao longo do traçado: ` +
  `a subida acumulada é uma estimativa.`;

/** Um facto com as fontes por baixo. */
function ListaFactos({ itens }: { itens: Facto[] }) {
  return (
    <ul>
      {itens.map((f) => (
        <li key={f.texto} className="border-b border-white/6 py-3 last:border-0">
          <p className="text-sm leading-relaxed text-ink-200">
            <C>{f.texto}</C>
          </p>
          <LinksFontes fontes={f.fontes} className="mt-1" />
        </li>
      ))}
    </ul>
  );
}

function ListaLugares({ itens }: { itens: Lugar[] }) {
  return (
    <ul>
      {itens.map((l) => (
        <li key={l.nome + l.onde} className="border-b border-white/6 py-3 last:border-0">
          <p className="text-sm text-white">
            {l.nome} <span className="text-ink-500">·</span> <span className="text-ink-400">{l.onde}</span>
          </p>
          {l.nota && (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-400">
              <C>{l.nota}</C>
            </p>
          )}
          <LinksFontes fontes={l.fontes} className="mt-1" />
        </li>
      ))}
    </ul>
  );
}

function Bloco({ titulo, icone, children, className = "" }: { titulo: string; icone: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card p-5 sm:p-6 ${className}`}>
      <h3 className="flex items-center gap-2.5 font-display text-lg uppercase text-white">
        <Icon name={icone} className="size-4 text-mb-red" />
        {titulo}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default async function RotaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rota = lerRota(slug);
  if (!rota) notFound();

  const clubes = (await lerClubes()).filter((c) => rota.provincias.includes(c.provincia)).slice(0, 4);
  const indice = ROTAS.findIndex((r) => r.slug === rota.slug);
  const outras = [...ROTAS.slice(indice + 1), ...ROTAS.slice(0, indice)].slice(0, 3);

  const t = totais(rota);
  const capa = rota.fotos[0];
  const galeria = rota.fotos.slice(1);
  const clima = CLIMA[rota.clima];
  const sol = solDoAno(clima.lat, clima.lng);
  const dias = [...new Set(rota.trocos.map((x) => x.dia))];
  const multiDia = dias.length > 1;
  const fontes = fontesDaRota(rota);
  const gpx = comBase(`/clubes/rotas/${rota.slug}/gpx`);

  const numeros: [string, React.ReactNode][] = [
    ["Distância", `${t.km} km`],
    ["A rodar", duracao(t.minMota)],
    [
      "Duração",
      <>
        {rota.dias} <span>{rota.dias > 1 ? "dias" : "dia"}</span>
      </>,
    ],
    [
      "Exigência",
      <>
        <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${TOM_EXIGENCIA[rota.exigencia]}`} />
        {rota.exigencia}
      </>,
    ],
    ["Piso", rota.piso],
    ["Melhor época", <C key="epoca">{rota.epocaCurta}</C>],
  ];

  return (
    <>
      {/* ============ CABEÇALHO ============ */}
      <header className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <FotoRota foto={capa} tamanhos="100vw" largura={1920} prioridade />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/65 to-ink-950/15" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/70 via-transparent to-transparent" aria-hidden />
        <div className="mx-auto flex min-h-[520px] max-w-7xl flex-col justify-between px-4 pb-8 pt-10 sm:min-h-[600px] sm:px-6 sm:pt-12">
          <Link href="/clubes/rotas" className="inline-flex items-center gap-2 self-start font-ui text-sm text-ink-200 transition-colors hover:text-white">
            <span aria-hidden>←</span> Rotas de moto-turismo
          </Link>
          <div className="mt-16">
            <div className="flex flex-wrap gap-2">
              <Tag tone="red">{String(indice + 1).padStart(2, "0")}</Tag>
              <Tag tone="outline">{rota.regiao}</Tag>
            </div>
            <h1 className="title-xl mt-4 max-w-4xl text-4xl sm:text-5xl lg:text-7xl">{rota.nome}</h1>
            <p className="mt-3 max-w-2xl font-ui text-xl text-ink-100">
              <C>{rota.subtitulo}</C>
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
              {numeros.map(([k, v]) => (
                <div key={k} className="bg-ink-950/80 px-4 py-3.5 backdrop-blur-sm">
                  <dt className="eyebrow text-ink-400">{k}</dt>
                  <dd className="mt-1 flex items-center gap-2 font-display text-xl uppercase leading-tight text-white sm:text-2xl">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-right text-[11px] text-ink-400">
              <C>{capa.local}</C>. <CreditoFoto foto={capa} />
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Nesta página">
          <a href="#mapa" className="chip h-9 px-4 text-sm">Mapa</a>
          <a href="#itinerario" className="chip h-9 px-4 text-sm">Itinerário</a>
          <a href="#horario" className="chip h-9 px-4 text-sm">Horário</a>
          <a href="#pratico" className="chip h-9 px-4 text-sm">Informação prática</a>
          <a href="#levar" className="chip h-9 px-4 text-sm">O que levar</a>
          <a href="#fotografias" className="chip h-9 px-4 text-sm">Fotografias</a>
          <a href="#fontes" className="chip h-9 px-4 text-sm">Fontes</a>
        </nav>

        {/* ============ INTRODUÇÃO ============ */}
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <section>
            <p className="max-w-2xl text-lg leading-relaxed text-white">
              <C>{rota.resumo}</C>
            </p>
            <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-ink-300">
              {rota.descricao.map((p) => (
                <p key={p.slice(0, 40)}>
                  <C>{p}</C>
                </p>
              ))}
            </div>
            <h2 className="eyebrow accent-bar mt-10 text-white">O que ver</h2>
            <ul className="grid max-w-2xl gap-x-8 sm:grid-cols-2">
              {rota.destaques.map((d) => (
                <li key={d} className="flex items-start gap-3 border-b border-white/6 py-3 text-sm text-ink-200">
                  <Icon name="star" className="mt-0.5 size-4 shrink-0 text-mb-red" />
                  <C>{d}</C>
                </li>
              ))}
            </ul>
          </section>

          <aside className="space-y-5">
            <div className="card p-5">
              <h2 className="eyebrow mb-4 text-mb-red">Ficha da rota</h2>
              <dl>
                {(
                  [
                    ["Região", rota.regiao],
                    ["Partida", rota.partida],
                    ["Piso", rota.piso],
                    ["Exigência", rota.exigencia],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-white/6 py-2.5 first:pt-0 last:border-0 last:pb-0">
                    <dt className="shrink-0 text-xs text-ink-500">{k}</dt>
                    <dd className="text-right text-sm text-white">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-white/6 pt-4 text-xs leading-relaxed text-ink-400">
                <C>{rota.exigenciaPorque}</C>
              </p>
            </div>

            <div className="card p-5">
              <h2 className="eyebrow mb-3 text-mb-red">Melhor época</h2>
              <p className="flex items-start gap-3 text-sm leading-relaxed text-ink-300">
                <Icon name="calendar" className="mt-0.5 size-4 shrink-0 text-ink-500" />
                <C>{rota.melhorEpoca}</C>
              </p>
            </div>

            <div className="card p-5">
              <h2 className="eyebrow mb-3 text-mb-red">Quantos dias</h2>
              <p className="text-sm leading-relaxed text-ink-300">
                <C>{rota.diasNota.texto}</C>
              </p>
              <LinksFontes fontes={rota.diasNota.fontes} className="mt-2" />
            </div>

            {clubes.length > 0 && (
              <div className="card p-5">
                <h2 className="eyebrow mb-3 text-mb-red">Clubes na região</h2>
                <ul>
                  {clubes.map((c) => (
                    <li key={c.slug} className="border-b border-white/6 last:border-0">
                      <Link href={`/clubes/${c.slug}`} className="group flex items-center gap-3 py-2.5">
                        <LogoClube clube={c} className="size-9 text-[11px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-white transition-colors group-hover:text-mb-red">{c.nome}</span>
                          <span className="block text-xs text-ink-500">{localClube(c)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        {/* ============ MAPA ============ */}
        <section id="mapa" className="mt-16 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow mb-2 text-mb-red">Mapa e navegação</p>
              <h2 className="title-xl text-3xl sm:text-4xl">O caminho, pronto a seguir</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                O trajecto passa por todas as paragens desta rota. No telemóvel, o botão abre a navegação passo a passo
                do Google Maps.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-card bg-ink-900">
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/9]">
              <iframe
                src={urlMapaEmbebido(rota.paragens)}
                title={`Mapa da rota ${rota.nome}, com o trajecto no Google Maps`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 size-full border-0"
                allowFullScreen
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-white/6 p-4 sm:p-5">
              <a
                href={urlNavegacao(rota.paragens)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 items-center gap-2.5 rounded-full bg-mb-red px-7 font-ui text-lg text-white transition-colors hover:bg-mb-red-dark"
              >
                <Icon name="map" className="size-5" />
                Abrir no Google Maps
              </a>
              <a
                href={gpx}
                download={`motobox-${rota.slug}.gpx`}
                className="inline-flex h-13 items-center gap-2.5 rounded-full bg-ink-800 px-7 font-ui text-lg text-white transition-colors hover:bg-ink-700"
              >
                <Icon name="pin" className="size-5" />
                Descarregar GPX
              </a>
              {multiDia &&
                dias.map((d) => (
                  <a
                    key={d}
                    href={urlNavegacao(paragensDoDia(rota, d))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chip h-10 px-4 text-sm"
                  >
                    <span>Dia</span> {d}
                    <Icon name="arrow" className="size-3.5" />
                  </a>
                ))}
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-ink-500">
            O GPX traz as paragens, os pontos de interesse e o traçado completo, e abre em aplicações como o OsmAnd, o
            Organic Maps ou um GPS de mota. No browser do telemóvel sem a aplicação do Google Maps, o Google só aceita
            três paragens intermédias: nas viagens de vários dias, use os botões de cada dia. No mapa, o Google dá a cada
            paragem o nome do sítio mais próximo que conhece; os nomes certos estão no itinerário. O tempo que o Google
            mostra é o dele; os desta página são calculados como se explica abaixo.
          </p>

          {/* Totais */}
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card bg-white/8 sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                ["Total", `${t.km} km`],
                ["A rodar de mota", duracao(t.minMota)],
                ["De carro (OSRM)", duracao(t.minCarro)],
                ["Subida acumulada", `${rota.altimetria.subida.toLocaleString("pt-PT")} m`],
                ["Altitude máxima", `${rota.altimetria.max.toLocaleString("pt-PT")} m`],
                ["Altitude mínima", `${rota.altimetria.min.toLocaleString("pt-PT")} m`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="bg-ink-900 px-4 py-4">
                <dt className="eyebrow text-ink-500">{k}</dt>
                <dd className="mt-1 font-display text-2xl text-white tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-ink-500">
            {COMO_CALCULAMOS}
          </p>
        </section>

        {/* ============ ITINERÁRIO ============ */}
        <section id="itinerario" className="mt-16 scroll-mt-24 border-t border-white/6 pt-12">
          <p className="eyebrow mb-2 text-mb-red">Itinerário</p>
          <h2 className="title-xl text-3xl sm:text-4xl">Troço a troço</h2>

          <div className="mt-8 space-y-12">
            {dias.map((d) => {
              const trocos = rota.trocos.filter((x) => x.dia === d);
              const kmDia = Math.round(trocos.reduce((s, x) => s + x.km, 0));
              const minDia = trocos.reduce((s, x) => s + minMota(x), 0);
              const titulo = rota.horario[d - 1]?.titulo;
              return (
                <div key={d}>
                  {multiDia && (
                    <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h3 className="font-display text-2xl uppercase text-white">
                        <span>Dia</span> {d}
                      </h3>
                      {titulo && (
                        <span className="text-sm text-ink-300">
                          <C>{titulo}</C>
                        </span>
                      )}
                      <span className="text-sm text-ink-500 tabular-nums">
                        {kmDia} km · {duracao(minDia)}
                      </span>
                    </div>
                  )}
                  <ol className="relative">
                    {trocos.map((x, i) => {
                      const de = rota.paragens[x.de];
                      const para = rota.paragens[x.para];
                      return (
                        <li key={`${x.de}-${x.para}`} className="relative grid grid-cols-[1.75rem_1fr] gap-x-4">
                          {/* Linha vertical */}
                          <span aria-hidden className="absolute bottom-0 left-[0.8125rem] top-7 w-0.5 bg-white/10" />
                          {i === 0 && (
                            <>
                              <span aria-hidden className="relative z-10 mt-1 grid size-7 place-items-center rounded-full bg-mb-red">
                                <span className="size-2 rounded-full bg-white" />
                              </span>
                              <p className="pb-4 pt-1">
                                <a href={urlPonto(de)} target="_blank" rel="noopener noreferrer" className="font-display text-lg uppercase text-white hover:text-mb-red">
                                  {de.nome}
                                </a>
                                <span className="ml-2 text-xs text-ink-500 tabular-nums">{de.alt.toLocaleString("pt-PT")} m</span>
                              </p>
                            </>
                          )}
                          <span aria-hidden />
                          <div className="mb-4 rounded-card bg-ink-900 p-4 sm:p-5">
                            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-sm uppercase tracking-wide text-ink-200 tabular-nums">
                              <span className="text-white">{x.km.toLocaleString("pt-PT")} km</span>
                              <span className="text-ink-600">/</span>
                              <span className="inline-flex items-center gap-1.5 text-white">
                                <Icon name="clock" className="size-3.5 text-ink-500" />
                                {duracao(minMota(x))}
                              </span>
                              <span className="text-ink-600">/</span>
                              <span>{NOME_PISO[x.piso]}</span>
                            </p>
                            <p className="mt-2 text-sm text-ink-300">
                              <C>{x.estrada}</C>
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-ink-200">
                              <span className="eyebrow mr-2 text-ink-500">Pelo caminho</span>
                              <C>{x.ver}</C>
                            </p>
                            {x.aviso && (
                              <p className="mt-3 flex items-start gap-2 rounded-lg bg-mb-red/10 px-3 py-2 text-sm leading-relaxed text-ink-100">
                                <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-mb-red" />
                                <span>
                                  <C>{x.aviso}</C>
                                </span>
                              </p>
                            )}
                            <LinksFontes fontes={x.fontes} className="mt-3" />
                          </div>
                          <span aria-hidden className={`relative z-10 mt-1 grid size-7 place-items-center rounded-full ${i === trocos.length - 1 ? "bg-white" : "bg-ink-700"}`}>
                            <span className={`size-2 rounded-full ${i === trocos.length - 1 ? "bg-mb-red" : "bg-white"}`} />
                          </span>
                          <p className="pb-4 pt-1">
                            <a href={urlPonto(para)} target="_blank" rel="noopener noreferrer" className="font-display text-lg uppercase text-white hover:text-mb-red">
                              {para.nome}
                            </a>
                            <span className="ml-2 text-xs text-ink-500 tabular-nums">{para.alt.toLocaleString("pt-PT")} m</span>
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>

          {/* Paragens com coordenadas */}
          <details className="mt-6 rounded-card bg-ink-900/60 p-5">
            <summary className="cursor-pointer font-ui text-sm text-white">Coordenadas das paragens</summary>
            <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
              {rota.paragens.map((p, i) => (
                <li key={p.nome + i} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-white/6 py-2 text-xs last:border-0">
                  <span className="text-ink-200">{p.nome}</span>
                  <span className="font-mono text-ink-400">
                    {p.lat.toFixed(5)}, {p.lng.toFixed(5)}{" "}
                    <a href={p.fonte.url} target="_blank" rel="noopener noreferrer" className="font-sans text-ink-500 underline decoration-white/15 underline-offset-2 hover:text-white">
                      {p.fonte.nome}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </section>

        {/* ============ HORÁRIO ============ */}
        <section id="horario" className="mt-16 scroll-mt-24 border-t border-white/6 pt-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="eyebrow mb-2 text-mb-red">Horário sugerido</p>
              <h2 className="title-xl text-3xl sm:text-4xl">Chegar antes de escurecer</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-400">
                Fora das cidades não se conduz de noite: há buracos sem aviso, gado e peões na estrada, e camiões e motas
                sem luzes. O horário conta com as paragens e deixa margem para chegar com luz.
              </p>
              <div className="mt-6 rounded-card bg-ink-900 p-5">
                <p className="eyebrow text-ink-500">
                  <span>Luz do dia</span> · {clima.cidade}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-4">
                  {[sol[5], sol[11]].map((s) => (
                    <div key={s.mes}>
                      <dt className="text-xs text-ink-400">{s.mes}</dt>
                      <dd className="mt-1 font-display text-xl text-white tabular-nums">
                        {s.nascer} – {s.por}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[11px] text-ink-500">
                  <span>Dia 15 de cada mês, hora de Angola. Tabela completa em</span>{" "}
                  <a href="#clima" className="underline decoration-white/15 underline-offset-2 hover:text-white">
                    Clima e luz
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {rota.horario.map((h, i) => (
                <div key={h.titulo}>
                  {multiDia && (
                    <h3 className="font-display text-lg uppercase text-white">
                      <span>Dia</span> {i + 1} <span className="text-ink-600">·</span> <C>{h.titulo}</C>
                    </h3>
                  )}
                  <ol className="mt-2">
                    {h.passos.map((p) => (
                      <li key={p.hora + p.texto} className="grid grid-cols-[4rem_1fr] gap-4 border-b border-white/6 py-3 last:border-0">
                        <span className="font-display text-lg leading-6 text-mb-red tabular-nums">{p.hora}</span>
                        <span className="text-sm leading-6 text-ink-200">
                          <C>{p.texto}</C>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ INFORMAÇÃO PRÁTICA ============ */}
        <section id="pratico" className="mt-16 scroll-mt-24 border-t border-white/6 pt-12">
          <p className="eyebrow mb-2 text-mb-red">Informação prática</p>
          <h2 className="title-xl text-3xl sm:text-4xl">Tudo o que precisa de saber</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Bloco titulo="Combustível" icone="flag" className="lg:col-span-2">
              <div className="rounded-lg bg-mb-red/10 px-4 py-3">
                <p className="eyebrow text-mb-red">Maior troço sem combustível</p>
                <p className="mt-1 text-sm leading-relaxed text-white">
                  <C>{rota.semCombustivel.texto}</C>
                </p>
                <LinksFontes fontes={rota.semCombustivel.fontes} className="mt-1" />
              </div>
              <ListaFactos itens={[...rota.combustivel, PRECO_COMBUSTIVEL]} />
            </Bloco>

            <Bloco titulo="Emergência" icone="bell">
              <ul className="grid grid-cols-2 gap-3">
                {EMERGENCIA.numeros.map((n) => (
                  <li key={n.numero} className="rounded-lg bg-ink-800 px-3 py-2.5">
                    <a href={`tel:${n.numero}`} className="font-display text-2xl text-white tabular-nums hover:text-mb-red">
                      {n.numero}
                    </a>
                    <p className="text-xs text-ink-400">
                      <C>{n.servico}</C>
                    </p>
                  </li>
                ))}
              </ul>
              {EMERGENCIA.notas.map((n) => (
                <p key={n} className="mt-3 text-xs leading-relaxed text-ink-400">
                  <C>{n}</C>
                </p>
              ))}
              <LinksFontes fontes={EMERGENCIA.fontes} className="mt-2" />
            </Bloco>

            <Bloco titulo="Onde comer" icone="heart">
              <ListaLugares itens={rota.comer} />
            </Bloco>

            <Bloco titulo="Onde dormir" icone="calendar">
              <ListaLugares itens={rota.dormir} />
            </Bloco>

            <Bloco titulo="Hospital mais próximo" icone="plus">
              <ListaLugares itens={rota.saude} />
            </Bloco>

            <Bloco titulo="Perigos na estrada" icone="shield" className="lg:col-span-2">
              <ListaFactos itens={rota.perigos} />
            </Bloco>

            <Bloco titulo="Rede móvel" icone="chat">
              <ListaFactos itens={[...rota.rede, REDE_GERAL]} />
            </Bloco>

            <Bloco titulo="Documentos" icone="lock">
              <ListaFactos itens={DOCUMENTOS} />
            </Bloco>

            <Bloco titulo="Licenças e entradas" icone="ticket">
              <ListaFactos itens={rota.licencas} />
            </Bloco>

            <Bloco titulo="A mota certa" icone="bike">
              <ListaFactos itens={rota.motas} />
            </Bloco>
          </div>

          {/* Clima e luz */}
          <div id="clima" className="mt-10 scroll-mt-24">
            <h3 className="font-display text-xl uppercase text-white">
              <span>Clima e luz</span> · {clima.cidade}
            </h3>
            <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[720px] text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="eyebrow py-2.5 pr-3 font-normal text-ink-500" scope="col">
                      <span className="sr-only">Mês</span>
                    </th>
                    {sol.map((s) => (
                      <th key={s.mes} scope="col" className="eyebrow py-2.5 text-center font-normal text-ink-400">
                        {s.mes}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["Máxima (°C)", (i: number) => clima.meses[i].max],
                      ["Mínima (°C)", (i: number) => clima.meses[i].min],
                      ["Chuva (mm)", (i: number) => clima.meses[i].chuva],
                      ["Nascer do sol", (i: number) => sol[i].nascer],
                      ["Pôr do sol", (i: number) => sol[i].por],
                    ] as const
                  ).map(([rotulo, valor]) => (
                    <tr key={rotulo} className="border-b border-white/6 last:border-0">
                      <th scope="row" className="whitespace-nowrap py-2.5 pr-3 text-left text-xs font-normal text-ink-400">
                        {rotulo}
                      </th>
                      {sol.map((s, i) => {
                        const v = valor(i);
                        const chuvoso = rotulo === "Chuva (mm)" && typeof v === "number" && v >= 50;
                        return (
                          <td key={s.mes} className={`py-2.5 text-center ${chuvoso ? "text-mb-red" : "text-ink-200"}`}>
                            {typeof v === "number" ? v.toLocaleString("pt-PT") : v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LinksFontes fontes={[clima.fonte, FONTE_SOL]} className="mt-2" />
            <p className="mt-1 text-[11px] leading-relaxed text-ink-600">
              <C>{clima.nota}</C> O nascer e o pôr do sol foram calculados para o dia 15 de cada mês, em hora de Angola
              (UTC+1). A vermelho, os meses com 50 mm de chuva ou mais.
            </p>
          </div>

          {/* Pontos de interesse */}
          <div className="mt-12">
            <h3 className="font-display text-xl uppercase text-white">Pontos de interesse</h3>
            <ul className="mt-4 grid gap-x-8 md:grid-cols-2">
              {rota.pontos.map((p) => (
                <li key={p.nome} className="border-b border-white/6 py-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-medium text-white">{p.nome}</span>
                    <a
                      href={urlPonto(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-400 underline decoration-white/15 underline-offset-2 hover:text-white"
                    >
                      <Icon name="pin" className="size-3" />
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </a>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-400">
                    <C>{p.nota}</C>
                  </p>
                  <LinksFontes fontes={p.fontes} className="mt-1" />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ O QUE LEVAR ============ */}
        <section id="levar" className="mt-16 scroll-mt-24 border-t border-white/6 pt-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="eyebrow mb-2 text-mb-red">O que levar</p>
              <h2 className="title-xl text-3xl sm:text-4xl">A lista antes de sair</h2>
              <div className="mt-6 card p-5">
                <h3 className="font-display text-lg uppercase text-white">Água e comida</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">
                  <C>{rota.agua.texto}</C>
                </p>
                <LinksFontes fontes={rota.agua.fontes} className="mt-2" />
              </div>
              <div className="mt-5 card p-5">
                <h3 className="font-display text-lg uppercase text-white">Sozinho ou em grupo</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">
                  <C>{rota.grupo.texto}</C>
                </p>
                <LinksFontes fontes={rota.grupo.fontes} className="mt-2" />
              </div>
            </div>
            <div className="grid gap-x-10 sm:grid-cols-2">
              <div>
                <h3 className="font-display text-lg uppercase text-white">Para esta rota</h3>
                <ListaVisto itens={rota.levar} />
              </div>
              <div>
                <h3 className="font-display text-lg uppercase text-white">Em qualquer viagem</h3>
                <ListaVisto itens={LEVAR_BASE} />
              </div>
            </div>
          </div>
        </section>

        {/* ============ FOTOGRAFIAS ============ */}
        {galeria.length > 0 && (
          <section id="fotografias" className="mt-16 scroll-mt-24 border-t border-white/6 pt-12">
            <p className="eyebrow mb-2 text-mb-red">Fotografias</p>
            <h2 className="title-xl text-3xl sm:text-4xl">Como é, ao vivo</h2>
            <div className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {galeria.map((f) => (
                <figure key={f.arquivo}>
                  <div className="media relative aspect-[4/3] bg-ink-900">
                    <FotoRota foto={f} tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  </div>
                  <figcaption className="mt-2.5">
                    <p className="text-sm text-ink-200">
                      <C>{f.local}</C>
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      <CreditoFoto foto={f} />
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* ============ DICAS E FONTES ============ */}
        <section className="mt-16 border-t border-white/6 pt-12">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="eyebrow accent-bar text-white">Dicas para quem vai de mota</h2>
              <ol>
                {rota.dicas.map((d, i) => (
                  <li key={d} className="flex items-start gap-4 border-b border-white/6 py-4 last:border-0">
                    <span className="w-6 shrink-0 font-display text-xl leading-none text-mb-red tabular-nums">{i + 1}</span>
                    <span className="text-sm leading-relaxed text-ink-300 sm:text-base">
                      <C>{d}</C>
                    </span>
                  </li>
                ))}
              </ol>

              {rota.distancias.length > 0 && (
                <>
                  <h2 className="eyebrow accent-bar mt-12 text-white">Distâncias publicadas</h2>
                  <ul>
                    {rota.distancias.map((d) => (
                      <li key={d.texto} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-white/6 py-3 last:border-0">
                        <span className="text-sm text-white">
                          <C>{d.texto}</C>
                        </span>
                        <a href={d.fonte.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-ink-500 underline decoration-white/15 underline-offset-2 hover:text-ink-300">
                          {d.fonte.nome}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-ink-600">
                    O que as fontes dizem, para comparar com o cálculo do OSRM. Quando discordam, damos o intervalo.
                  </p>
                </>
              )}
            </div>

            <div id="fontes" className="scroll-mt-24">
              <h2 className="eyebrow accent-bar text-white">Fontes</h2>
              <ul className="space-y-1.5">
                {fontes.map((f) => (
                  <li key={f.url} className="text-xs">
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-ink-400 underline decoration-white/15 underline-offset-2 hover:text-white">
                      {f.nome}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] leading-relaxed text-ink-600">
                Informação verificada em Outubro de 2026. Estradas, preços e combustível mudam: confirme localmente antes
                de partir. Mapas e traçado: © contribuidores do OpenStreetMap (ODbL), calculado com o OSRM.
              </p>
              <div className="mt-6 rounded-card bg-ink-900/60 p-5">
                <p className="text-sm font-medium text-white">Viu alguma coisa diferente na estrada?</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">
                  Um posto fechado, um troço novo, um hotel que mudou: diga-nos e actualizamos a rota.
                </p>
                <ButtonLink href="/contacto" variant="dark" size="sm" className="mt-4">
                  Enviar uma correcção
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        {/* ============ OUTRAS ROTAS ============ */}
        <section className="mt-20 border-t border-white/6 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="title-xl text-3xl">Outras rotas</h2>
            <Link href="/clubes/rotas" className="font-ui text-base text-ink-300 transition-colors hover:text-white">
              Todas as rotas →
            </Link>
          </div>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-3">
            {outras.map((r) => {
              const tr = totais(r);
              return (
                <Link key={r.slug} href={`/clubes/rotas/${r.slug}`} className="group block">
                  <div className="media relative aspect-[16/10] bg-ink-900">
                    <FotoRota foto={r.fotos[0]} tamanhos="(max-width: 640px) 100vw, 33vw" className="transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <p className="eyebrow mt-3 text-mb-red">{r.regiao}</p>
                  <h3 className="mt-1.5 font-display text-xl uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
                    {r.nome}
                  </h3>
                  <p className="mt-1 text-xs text-ink-400 tabular-nums">
                    {tr.km} km · {duracao(tr.minMota)} · {r.exigencia}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
