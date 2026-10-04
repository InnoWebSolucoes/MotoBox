import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Backpack,
  BedDouble,
  Bike,
  Camera,
  Clock,
  CloudSun,
  Compass,
  Download,
  Droplets,
  FileText,
  Fuel,
  Hospital,
  Lightbulb,
  Map as IconeMapa,
  MapPin,
  Route,
  Siren,
  Signal,
  Ticket,
  TriangleAlert,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { comBase } from "@/lib/base";
import { localClube } from "@/lib/motobox";
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
  type Paragem,
  type Rota,
  type Troco,
} from "@/lib/rotas";
import { MARGEM_MOTA, NOME_PISO, duracao, minMota, paragensDoDia, totais, urlMapaEmbebido, urlNavegacao, urlPonto } from "@/lib/rotas-mapas";
import { urlCommons } from "@/lib/rotas-fotos";
import { FONTE_SOL, solDoAno } from "@/lib/rotas-sol";
import { lerClubes } from "@/lib/supabase/publico";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Cabecalho, Numeros, Seccao } from "@/components/painel/blocos";
import { Monograma, Seta } from "@/components/painel/kit";
import { QuadroRota } from "../FotoRota";
import { Bloco, CreditoFoto, LinksFontes, ListaFactos, ListaLugares, ListaVisto, TOM_EXIGENCIA } from "../partes";

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

const km = (n: number) => n.toLocaleString("pt-PT");
const metros = (n: number) => `${n.toLocaleString("pt-PT")} m`;

/** Classes do botão largo do painel (como BotaoMB), para a ligação de descarga. */
const BOTAO =
  "group inline-flex h-14 w-full max-w-[20.5rem] items-center justify-between gap-6 rounded-[var(--raio)] px-5 text-[15px] text-white transition-colors";

function BotaoGpx({ href, ficheiro, className = "" }: { href: string; ficheiro: string; className?: string }) {
  return (
    <a href={href} download={ficheiro} className={`${BOTAO} bg-white/10 hover:bg-white/20 ${className}`}>
      <span>Descarregar GPX</span>
      <Download className="size-4" aria-hidden />
    </a>
  );
}

/** Quadrado de paragem na linha do itinerário. */
function Marca({ tipo }: { tipo: "partida" | "meio" | "chegada" }) {
  const fundo = { partida: "bg-mb-red", meio: "bg-white/15", chegada: "bg-white" }[tipo];
  const miolo = tipo === "chegada" ? "bg-mb-red" : "bg-white";
  return (
    <span aria-hidden className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-[4px] ${fundo}`}>
      <span className={`size-2 rounded-[2px] ${miolo}`} />
    </span>
  );
}

/** Uma paragem: marca, nome (abre no Google Maps) e altitude. */
function LinhaParagem({ paragem, tipo, continua }: { paragem: Paragem; tipo: "partida" | "meio" | "chegada"; continua: boolean }) {
  return (
    <>
      <span className="flex flex-col items-center">
        <Marca tipo={tipo} />
        {continua && <span aria-hidden className="w-0.5 flex-1 bg-white/12" />}
      </span>
      <p className="flex flex-wrap items-baseline gap-x-3 pb-5 pt-1">
        <a
          href={urlPonto(paragem)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold leading-snug transition-colors hover:text-mb-red-light"
        >
          {paragem.nome}
        </a>
        <span className="text-[0.8125rem] text-white/50 tabular-nums">{metros(paragem.alt)}</span>
      </p>
    </>
  );
}

/** Um troço: quilómetros, tempo de mota, piso, estrada, o que se vê e o aviso. */
function CartaoTroco({ troco }: { troco: Troco }) {
  return (
    <>
      <span aria-hidden className="flex justify-center">
        <span className="w-0.5 bg-white/12" />
      </span>
      <div className="painel painel-escuro mb-5 p-5 md:p-6">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2 tabular-nums">
          <span className="text-2xl font-semibold leading-none tracking-tight">{km(troco.km)} km</span>
          <span className="inline-flex items-center gap-1.5 text-lg leading-none text-white/90">
            <Clock className="size-4 text-mb-red-light" aria-hidden />
            {duracao(minMota(troco))}
          </span>
          <span className="rounded-[4px] bg-white/8 px-2 py-1 text-xs text-white/75">{NOME_PISO[troco.piso]}</span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/65">{troco.estrada}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-white/85">
          <span className="mr-2 text-xs uppercase tracking-[0.15em] text-white/45">Pelo caminho</span>
          {troco.ver}
        </p>
        {troco.aviso && (
          <p className="mt-4 flex items-start gap-2.5 rounded-[var(--raio)] bg-mb-red/15 px-3.5 py-3 text-sm leading-relaxed text-white/90">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-mb-red-light" aria-hidden />
            <span>{troco.aviso}</span>
          </p>
        )}
        <LinksFontes fontes={troco.fontes} className="mt-4" />
      </div>
    </>
  );
}

export default async function RotaPagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rota = lerRota(slug);
  if (!rota) notFound();

  const clubes = (await lerClubes()).filter((c) => (rota.provincias as string[]).includes(c.provincia)).slice(0, 4);
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
  const gpx = comBase(`/rotas/${rota.slug}/gpx`);
  const ficheiroGpx = `motobox-${rota.slug}.gpx`;
  const navegacao = urlNavegacao(rota.paragens);
  const valorTexto = "text-2xl lg:text-3xl";

  return (
    <PaginaInterior icone={<Route />}>
      <Abertura
        foto={urlCommons(capa, 1920)}
        posicaoFoto={capa.foco}
        sobretitulo={`${String(indice + 1).padStart(2, "0")} · ${rota.regiao}`}
        titulo={rota.nome}
        tamanho={rota.nome.length > 26 ? "2" : "1"}
        texto={rota.resumo}
      >
        <div className="flex flex-wrap gap-[var(--intervalo)]">
          <BotaoMB href={navegacao} externo>
            Abrir no Google Maps
          </BotaoMB>
          <BotaoGpx href={gpx} ficheiro={ficheiroGpx} className="bg-black/50 backdrop-blur-md hover:bg-black/70" />
        </div>
        <p className="mt-6 max-w-[60ch] text-xs leading-relaxed text-white/60">
          {capa.local}. <CreditoFoto foto={capa} />
        </p>
      </Abertura>

      {/* ============ RESUMO ============ */}
      <Seccao>
        <nav aria-label="Nesta página" className="no-scrollbar -mx-1 mb-10 flex gap-2 overflow-x-auto px-1 pb-1">
          {[
            ["#mapa", "Mapa"],
            ["#itinerario", "Itinerário"],
            ["#horario", "Horário"],
            ["#pratico", "Informação prática"],
            ["#clima", "Clima e luz"],
            ["#levar", "O que levar"],
            ["#fotografias", "Fotografias"],
            ["#fontes", "Fontes"],
          ].map(([href, texto]) => (
            <a key={href} href={href} className="pilula">
              {texto}
            </a>
          ))}
        </nav>

        <Numeros
          colunas={3}
          itens={[
            { valor: `${t.km} km`, texto: "de distância" },
            { valor: duracao(t.minMota), texto: "a rodar de mota, sem paragens" },
            { valor: rota.dias, texto: rota.dias > 1 ? "dias" : "dia" },
            {
              valor: (
                <span className={`inline-flex items-center gap-3 ${valorTexto}`}>
                  <span aria-hidden className={`size-3 shrink-0 rounded-full ${TOM_EXIGENCIA[rota.exigencia]}`} />
                  {rota.exigencia}
                </span>
              ),
              texto: "exigência",
            },
            { valor: <span className={valorTexto}>{rota.piso}</span>, texto: "piso" },
            { valor: <span className={valorTexto}>{rota.epocaCurta}</span>, texto: "melhor época" },
          ]}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div>
            <h2 className="titulo-3">{rota.subtitulo}</h2>
            <div className="prosa mt-6 max-w-[64ch]">
              {rota.descricao.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>

            <h3 className="titulo-4 mt-12">O que ver</h3>
            <ul className="mt-5 grid gap-[var(--intervalo)] sm:grid-cols-2">
              {rota.destaques.map((d) => (
                <li key={d} className="painel painel-escuro flex gap-3 p-4 text-[15px] leading-snug text-white/85">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mb-red" />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-[var(--intervalo)]">
            <div className="painel painel-escuro p-6">
              <h2 className="text-lg font-semibold">Ficha da rota</h2>
              <dl className="mt-4">
                {(
                  [
                    ["Região", rota.regiao],
                    ["Partida", rota.partida],
                    ["Piso", rota.piso],
                    ["Exigência", rota.exigencia],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-white/8 py-2.5 first:pt-0">
                    <dt className="shrink-0 text-sm text-white/55">{k}</dt>
                    <dd className="text-right text-sm">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-white/75">{rota.exigenciaPorque}</p>
              <p className="mt-5 text-sm font-semibold">O piso</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{rota.pisoDetalhe}</p>
            </div>

            <div className="painel painel-escuro p-6">
              <h2 className="text-lg font-semibold">Melhor época</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">{rota.melhorEpoca}</p>
            </div>

            <div className="painel painel-escuro p-6">
              <h2 className="text-lg font-semibold">Quantos dias</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">{rota.diasNota.texto}</p>
              <LinksFontes fontes={rota.diasNota.fontes} className="mt-3" />
            </div>

            {clubes.length > 0 && (
              <div className="painel painel-escuro p-6">
                <h2 className="text-lg font-semibold">Clubes na região</h2>
                <ul className="mt-3">
                  {clubes.map((c) => (
                    <li key={c.slug} className="border-b border-white/8 last:border-0">
                      <Link href={`/clubes/${c.slug}`} className="group flex items-center gap-3 py-3">
                        <Monograma nome={c.nome} cor={c.cor} className="size-10 text-xs" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] transition-colors group-hover:text-mb-red-light">{c.nome}</span>
                          <span className="block text-[0.8125rem] text-white/50">{localClube(c)}</span>
                        </span>
                        <Seta className="size-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </Seccao>

      {/* ============ MAPA ============ */}
      <Seccao id="mapa" className="!pt-0">
        <Cabecalho
          icone={<IconeMapa />}
          titulo="O caminho, pronto a seguir"
          texto="O trajecto passa por todas as paragens desta rota. No telemóvel, o botão abre a navegação passo a passo do Google Maps."
        />

        <div className="painel painel-escuro mt-10 p-[var(--intervalo)]">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--raio)] bg-near-black sm:aspect-[16/9]">
            <iframe
              src={urlMapaEmbebido(rota.paragens)}
              title={`Mapa da rota ${rota.nome}, com o trajecto no Google Maps`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 size-full border-0"
              allowFullScreen
            />
          </div>
          <div className="flex flex-wrap items-center gap-[var(--intervalo)] p-3 pt-[var(--intervalo)] sm:p-4 sm:pt-[var(--intervalo)]">
            <BotaoMB href={navegacao} externo>
              Abrir no Google Maps
            </BotaoMB>
            <BotaoGpx href={gpx} ficheiro={ficheiroGpx} />
            {multiDia && (
              <div className="flex flex-wrap gap-2 sm:ml-3">
                {dias.map((d) => (
                  <a
                    key={d}
                    href={urlNavegacao(paragensDoDia(rota, d))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pilula group gap-2"
                  >
                    Dia {d}
                    <Seta className="size-2.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 max-w-[90ch] text-xs leading-relaxed text-white/45">
          O GPX traz as paragens, os pontos de interesse e o traçado completo, e abre em aplicações como o OsmAnd, o Organic
          Maps ou um GPS de mota. No browser do telemóvel sem a aplicação do Google Maps, o Google só aceita três paragens
          intermédias: nas viagens de vários dias, use os botões de cada dia. No mapa, o Google dá a cada paragem o nome do
          sítio mais próximo que conhece; os nomes certos estão no itinerário. O tempo que o Google mostra é o dele; os desta
          página são calculados como se explica abaixo.
        </p>

        <Numeros
          className="mt-10"
          colunas={3}
          itens={[
            { valor: `${t.km} km`, texto: "no total" },
            { valor: duracao(t.minMota), texto: "a rodar de mota" },
            { valor: duracao(t.minCarro), texto: "de carro (OSRM)" },
            { valor: metros(rota.altimetria.subida), texto: "de subida acumulada" },
            { valor: metros(rota.altimetria.max), texto: "de altitude máxima" },
            { valor: metros(rota.altimetria.min), texto: "de altitude mínima" },
          ]}
        />
        <p className="mt-4 max-w-[90ch] text-xs leading-relaxed text-white/45">{COMO_CALCULAMOS}</p>
      </Seccao>

      {/* ============ ITINERÁRIO ============ */}
      <Seccao id="itinerario" className="!pt-0">
        <Cabecalho icone={<Route />} titulo="Troço a troço" />

        <div className="mt-10 max-w-4xl space-y-12">
          {dias.map((d) => {
            const trocos = rota.trocos.filter((x) => x.dia === d);
            const kmDia = Math.round(trocos.reduce((s, x) => s + x.km, 0));
            const minDia = trocos.reduce((s, x) => s + minMota(x), 0);
            const titulo = rota.horario[d - 1]?.titulo;
            return (
              <div key={d}>
                {multiDia && (
                  <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="titulo-4">Dia {d}</h3>
                    {titulo && <span className="text-[15px] text-white/75">{titulo}</span>}
                    <span className="text-sm text-white/50 tabular-nums">
                      {kmDia} km · {duracao(minDia)}
                    </span>
                  </div>
                )}
                <ol>
                  {trocos.map((x, i) => {
                    const ultimo = i === trocos.length - 1;
                    return (
                      <li key={`${x.de}-${x.para}`} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4">
                        {i === 0 && <LinhaParagem paragem={rota.paragens[x.de]} tipo="partida" continua />}
                        <CartaoTroco troco={x} />
                        <LinhaParagem paragem={rota.paragens[x.para]} tipo={ultimo ? "chegada" : "meio"} continua={!ultimo} />
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>

        <details className="painel painel-escuro group/coord mt-8 max-w-4xl p-5 md:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
            Coordenadas das paragens
            <span aria-hidden className="text-xl leading-none text-white/60 transition-transform group-open/coord:rotate-45">
              +
            </span>
          </summary>
          <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
            {rota.paragens.map((p, i) => (
              <li key={p.nome + i} className="border-b border-white/8 py-2.5 text-[0.8125rem] last:border-0">
                <span className="block text-white/85">{p.nome}</span>
                <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-white/50">
                  <span className="font-mono tabular-nums">
                    {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                  </span>
                  <a
                    href={p.fonte.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/45 underline decoration-white/15 underline-offset-2 hover:text-white"
                  >
                    {p.fonte.nome}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </details>
      </Seccao>

      {/* ============ HORÁRIO ============ */}
      <Seccao id="horario" className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <Cabecalho
              icone={<Clock />}
              titulo="Chegar antes de escurecer"
              texto="Fora das cidades não se conduz de noite: há buracos sem aviso, gado e peões na estrada, e camiões e motas sem luzes. O horário conta com as paragens e deixa margem para chegar com luz."
            />
            <div className="painel painel-escuro mt-8 p-6">
              <p className="text-sm text-white/60">Luz do dia · {clima.cidade}</p>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                {[sol[5], sol[11]].map((s) => (
                  <div key={s.mes}>
                    <dt className="text-sm text-white/55">{s.mes}</dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                      {s.nascer} – {s.por}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-white/45">
                Dia 15 de cada mês, hora de Angola. Tabela completa em{" "}
                <a href="#clima" className="underline decoration-white/15 underline-offset-2 hover:text-white">
                  Clima e luz
                </a>
                .
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {rota.horario.map((h, i) => (
              <div key={h.titulo}>
                <h3 className="text-lg font-semibold">
                  {multiDia && <span className="text-mb-red-light">Dia {i + 1} · </span>}
                  {h.titulo}
                </h3>
                <ol className="mt-4 grid gap-[var(--intervalo)]">
                  {h.passos.map((p) => (
                    <li key={p.hora + p.texto} className="painel painel-escuro grid grid-cols-[4.25rem_minmax(0,1fr)] items-start gap-4 p-4">
                      <span className="rounded-[4px] bg-mb-red px-2 py-1.5 text-center text-[15px] font-semibold tabular-nums">{p.hora}</span>
                      <span className="pt-1 text-[15px] leading-relaxed text-white/85">{p.texto}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </Seccao>

      {/* ============ INFORMAÇÃO PRÁTICA ============ */}
      <Seccao id="pratico" className="!pt-0">
        <Cabecalho icone={<Compass />} titulo="Tudo o que precisa de saber" />

        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 lg:grid-cols-3">
          <Bloco titulo="Combustível" icone={<Fuel />} className="md:col-span-2">
            <div className="mb-5 rounded-[var(--raio)] bg-mb-red/15 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-mb-red-light">Maior troço sem combustível</p>
              <p className="mt-1.5 text-[15px] leading-relaxed">{rota.semCombustivel.texto}</p>
              <LinksFontes fontes={rota.semCombustivel.fontes} className="mt-1.5" />
            </div>
            <ListaFactos itens={[...rota.combustivel, PRECO_COMBUSTIVEL]} />
          </Bloco>

          <Bloco titulo="Emergência" icone={<Siren />}>
            <ul className="grid grid-cols-2 gap-[var(--intervalo)]">
              {EMERGENCIA.numeros.map((n) => (
                <li key={n.numero} className="rounded-[var(--raio)] bg-white/6 p-3">
                  <a href={`tel:${n.numero}`} className="text-3xl font-semibold tabular-nums tracking-tight hover:text-mb-red-light">
                    {n.numero}
                  </a>
                  <p className="mt-1 text-xs leading-snug text-white/65">{n.servico}</p>
                </li>
              ))}
            </ul>
            {EMERGENCIA.notas.map((n) => (
              <p key={n} className="mt-4 text-sm leading-relaxed text-white/75">
                {n}
              </p>
            ))}
            <LinksFontes fontes={EMERGENCIA.fontes} className="mt-3" />
          </Bloco>

          <Bloco titulo="Onde comer" icone={<UtensilsCrossed />}>
            <ListaLugares itens={rota.comer} />
          </Bloco>

          <Bloco titulo="Onde dormir" icone={<BedDouble />}>
            <ListaLugares itens={rota.dormir} />
          </Bloco>

          <Bloco titulo="Hospital mais próximo" icone={<Hospital />}>
            <ListaLugares itens={rota.saude} />
          </Bloco>

          <Bloco titulo="Perigos na estrada" icone={<TriangleAlert />} className="md:col-span-2">
            <ListaFactos itens={rota.perigos} />
          </Bloco>

          <Bloco titulo="Rede móvel" icone={<Signal />}>
            <ListaFactos itens={[...rota.rede, REDE_GERAL]} />
          </Bloco>

          <Bloco titulo="Documentos" icone={<FileText />} className="md:col-span-2 lg:col-span-1">
            <ListaFactos itens={DOCUMENTOS} />
          </Bloco>

          <Bloco titulo="Licenças e entradas" icone={<Ticket />}>
            <ListaFactos itens={rota.licencas} />
          </Bloco>

          <Bloco titulo="A mota certa" icone={<Bike />}>
            <ListaFactos itens={rota.motas} />
          </Bloco>
        </div>
      </Seccao>

      {/* ============ CLIMA E LUZ ============ */}
      <Seccao id="clima" className="!pt-0">
        <Cabecalho
          icone={<CloudSun />}
          titulo={`Clima e luz · ${clima.cidade}`}
          texto="Temperaturas e chuva de cada mês, e a hora a que o sol nasce e se põe."
        />
        <div className="painel painel-escuro mt-10 overflow-x-auto p-5 md:p-6">
          <table className="w-full min-w-[720px] text-sm tabular-nums">
            <thead>
              <tr className="border-b border-white/12 text-left">
                <th className="py-2.5 pr-3 font-normal" scope="col">
                  <span className="sr-only">Mês</span>
                </th>
                {sol.map((s) => (
                  <th key={s.mes} scope="col" className="py-2.5 text-center text-xs font-normal uppercase tracking-[0.12em] text-white/55">
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
                <tr key={rotulo} className="border-b border-white/8 last:border-0">
                  <th scope="row" className="whitespace-nowrap py-3 pr-4 text-left text-xs font-normal text-white/60">
                    {rotulo}
                  </th>
                  {sol.map((s, i) => {
                    const v = valor(i);
                    const chuvoso = rotulo === "Chuva (mm)" && typeof v === "number" && v >= 50;
                    return (
                      <td key={s.mes} className={`py-3 text-center ${chuvoso ? "font-semibold text-mb-red-light" : "text-white/85"}`}>
                        {typeof v === "number" ? v.toLocaleString("pt-PT") : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LinksFontes fontes={[clima.fonte, FONTE_SOL]} className="mt-4" />
        <p className="mt-1 max-w-[90ch] text-xs leading-relaxed text-white/45">
          {clima.nota} O nascer e o pôr do sol foram calculados para o dia 15 de cada mês, em hora de Angola (UTC+1). A
          vermelho, os meses com 50 mm de chuva ou mais.
        </p>

        {/* Pontos de interesse */}
        <h3 className="titulo-4 mt-16">Pontos de interesse</h3>
        <ul className="mt-6 grid gap-[var(--intervalo)] md:grid-cols-2">
          {rota.pontos.map((p) => (
            <li key={p.nome} className="painel painel-escuro flex flex-col p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-[15px] font-semibold">{p.nome}</span>
                <a
                  href={urlPonto(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-white/50 underline decoration-white/15 underline-offset-2 hover:text-white"
                >
                  <MapPin className="size-3" aria-hidden />
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                </a>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{p.nota}</p>
              <LinksFontes fontes={p.fontes} className="mt-auto pt-3" />
            </li>
          ))}
        </ul>
      </Seccao>

      {/* ============ O QUE LEVAR ============ */}
      <Seccao id="levar" className="!pt-0">
        <Cabecalho icone={<Backpack />} titulo="A lista antes de sair" />
        <div className="mt-10 grid gap-[var(--intervalo)] lg:grid-cols-[1fr_1.6fr]">
          <div className="grid gap-[var(--intervalo)] content-start">
            <Bloco titulo="Água e comida" icone={<Droplets />}>
              <p className="text-[15px] leading-relaxed text-white/85">{rota.agua.texto}</p>
              <LinksFontes fontes={rota.agua.fontes} className="mt-3" />
            </Bloco>
            <Bloco titulo="Sozinho ou em grupo" icone={<Users />}>
              <p className="text-[15px] leading-relaxed text-white/85">{rota.grupo.texto}</p>
              <LinksFontes fontes={rota.grupo.fontes} className="mt-3" />
            </Bloco>
          </div>
          <div className="grid content-start gap-[var(--intervalo)] sm:grid-cols-2">
            <div className="painel painel-escuro p-6">
              <h3 className="text-lg font-semibold">Para esta rota</h3>
              <div className="mt-3">
                <ListaVisto itens={rota.levar} />
              </div>
            </div>
            <div className="painel painel-escuro p-6">
              <h3 className="text-lg font-semibold">Em qualquer viagem</h3>
              <div className="mt-3">
                <ListaVisto itens={LEVAR_BASE} />
              </div>
            </div>
          </div>
        </div>
      </Seccao>

      {/* ============ FOTOGRAFIAS ============ */}
      {galeria.length > 0 && (
        <Seccao id="fotografias" className="!pt-0">
          <Cabecalho
            icone={<Camera />}
            titulo="Como é, ao vivo"
            texto="Fotografias reais dos lugares desta rota, com licença livre, do Wikimedia Commons."
          />
          <div className="mt-10 grid gap-[var(--intervalo)] sm:grid-cols-2 lg:grid-cols-3">
            {galeria.map((f) => (
              <figure key={f.arquivo} className="painel painel-escuro flex flex-col p-[var(--intervalo)]">
                <QuadroRota foto={f} className="aspect-[4/3]" tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                <figcaption className="p-3 pt-4">
                  <p className="text-[15px] leading-snug">{f.local}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                    <CreditoFoto foto={f} />
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Seccao>
      )}

      {/* ============ DICAS ============ */}
      <Seccao className="!pt-0">
        <Cabecalho icone={<Lightbulb />} titulo="Dicas para quem vai de mota" />
        <ol className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2">
          {rota.dicas.map((d, i) => (
            <li key={d} className="painel painel-escuro flex gap-5 p-6">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                {i + 1}
              </span>
              <p className="text-[15px] leading-relaxed text-white/85">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-[var(--intervalo)] grid gap-[var(--intervalo)] lg:grid-cols-[1.4fr_1fr]">
          {rota.distancias.length > 0 && (
            <div className="painel painel-escuro p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="size-5 text-mb-red-light" aria-hidden /> Distâncias publicadas
              </h3>
              <ul className="mt-4">
                {rota.distancias.map((d) => (
                  <li key={d.texto} className="border-b border-white/8 py-3 last:border-0">
                    <p className="text-[15px] leading-relaxed text-white/85">{d.texto}</p>
                    <a
                      href={d.fonte.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-block text-xs text-white/45 underline decoration-white/15 underline-offset-2 hover:text-white"
                    >
                      {d.fonte.nome}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-white/45">
                O que as fontes dizem, para comparar com o cálculo do OSRM. Quando discordam, damos o intervalo.
              </p>
            </div>
          )}
          <div className="painel painel-escuro flex flex-col p-6">
            <p className="text-lg font-semibold">Viu alguma coisa diferente na estrada?</p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Um posto fechado, um troço novo, um hotel que mudou: diga-nos e actualizamos a rota.
            </p>
            <div className="mt-auto pt-6">
              <BotaoMB href={`/contacto?assunto=${encodeURIComponent(`Correcção à rota ${rota.nome}`)}`} variante="escuro">
                Enviar uma correcção
              </BotaoMB>
            </div>
          </div>
        </div>
      </Seccao>

      {/* ============ FONTES ============ */}
      <Seccao id="fontes" className="!pt-0">
        <h2 className="titulo-4">Fontes</h2>
        <ol className="mt-5 grid gap-x-10 gap-y-2 text-sm text-white/65 md:grid-cols-2">
          {fontes.map((f, i) => (
            <li key={f.url} className="break-words">
              <span className="text-white/40">[{i + 1}]</span>{" "}
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {f.nome}
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-[90ch] text-xs leading-relaxed text-white/45">
          Informação verificada em Outubro de 2026. Estradas, preços e combustível mudam: confirme localmente antes de
          partir. Mapas e traçado: © contribuidores do OpenStreetMap (ODbL), calculado com o OSRM. Fotografias do Wikimedia
          Commons, com o autor e a licença por baixo de cada uma.
        </p>
      </Seccao>

      {/* ============ OUTRAS ROTAS ============ */}
      <Seccao className="!pt-0">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="titulo-3">Outras rotas</h2>
          <Link href="/rotas" className="group inline-flex items-center gap-2 text-sm">
            <span className="sublinhado">Todas as rotas</span>
            <Seta className="size-3" />
          </Link>
        </div>
        <div className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-3">
          {outras.map((r) => (
            <CartaoOutraRota key={r.slug} rota={r} />
          ))}
        </div>
      </Seccao>
    </PaginaInterior>
  );
}

function CartaoOutraRota({ rota }: { rota: Rota }) {
  const t = totais(rota);
  return (
    <Link href={`/rotas/${rota.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
      <QuadroRota foto={rota.fotos[0]} className="aspect-[4/3]" tamanhos="(max-width: 768px) 100vw, 33vw" />
      <div className="flex flex-1 items-end justify-between gap-4 p-4 md:p-5">
        <div>
          <p className="text-[0.8125rem] text-white/60">{rota.regiao}</p>
          <h3 className="mt-1 text-lg font-semibold leading-snug">{rota.nome}</h3>
          <p className="mt-2 text-[0.8125rem] text-white/55 tabular-nums">
            {t.km} km · {duracao(t.minMota)} · <span className="text-mb-red-light">{rota.exigencia}</span>
          </p>
        </div>
        <Seta className="mb-1 size-3.5" />
      </div>
    </Link>
  );
}
