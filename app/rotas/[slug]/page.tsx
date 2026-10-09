import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Backpack,
  BedDouble,
  Bike,
  Construction,
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
import { climaDaRota, fontesDaRota } from "@/lib/rotas";
import { lerPaginaRotas, lerRotas } from "@/lib/rotas-conteudo";
import { NOME_PISO, duracao, minMota, paragensDoDia, totais, urlMapaEmbebido, urlNavegacao, urlPonto } from "@/lib/rotas-mapas";
import { preencher, type TextosRota } from "@/lib/rotas-pagina";
import { coordValida, urlCommons, type Paragem, type Rota, type Troco } from "@/lib/rotas-tipos";
import type { Estado } from "@/lib/rotas-estrada";
import { FONTE_SOL, solDoAno } from "@/lib/rotas-sol";
import { lerClubes } from "@/lib/supabase/publico";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Cabecalho, Numeros, Seccao } from "@/components/painel/blocos";
import { Monograma, Seta } from "@/components/painel/kit";
import { QuadroRota } from "../FotoRota";
import { Bloco, CreditoFoto, LinksFontes, ListaFactos, ListaLugares, ListaVisto, TOM_EXIGENCIA } from "../partes";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// As rotas vivem no conteúdo editável: as do momento do build geram-se
// logo, e as que o painel criar depois abrem no primeiro pedido.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await lerRotas()).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [rotas, pagina] = await Promise.all([lerRotas(), lerPaginaRotas()]);
  const r = rotas.find((x) => x.slug === slug);
  if (!r) return { title: "Rota não encontrada" };
  const t = totais(r);
  const valores = { nome: r.nome, resumo: r.resumo, km: t.km, tempo: duracao(t.minMota) };
  const capa = r.fotos[0];
  return {
    title: preencher(pagina.detalhe.seo.titulo, valores),
    description: preencher(pagina.detalhe.seo.descricao, valores).trim(),
    openGraph: capa ? { images: [{ url: urlCommons(capa, 1280), alt: capa.alt }] } : undefined,
  };
}

const km = (n: number) => n.toLocaleString("pt-PT");

/** Estado da estrada: verde, âmbar ou vermelho, com texto (não só cor). */
const NOME_ESTADO: Record<Estado, string> = { boa: "Boa", irregular: "Irregular", má: "Má" };
const COR_ESTADO: Record<Estado, string> = {
  boa: "bg-ok/20 text-[#4ade80]",
  irregular: "bg-gold/20 text-gold",
  má: "bg-mb-red text-white",
};
const metros = (n: number) => `${n.toLocaleString("pt-PT")} m`;

/** Classes do botão largo do painel (como BotaoMB), para as ligações de descarga (GPX e guia em PDF). */
const BOTAO =
  "group inline-flex h-14 w-full max-w-[20.5rem] items-center justify-between gap-6 rounded-[var(--raio)] px-5 text-[15px] text-white transition-colors";

function BotaoDescarregar({ href, ficheiro, texto, className = "" }: { href: string; ficheiro: string; texto: string; className?: string }) {
  return (
    <a href={href} download={ficheiro} className={`${BOTAO} bg-white/10 hover:bg-white/20 ${className}`}>
      <span>{texto}</span>
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
  const noMapa = coordValida(paragem);
  return (
    <>
      <span className="flex flex-col items-center">
        <Marca tipo={tipo} />
        {continua && <span aria-hidden className="w-0.5 flex-1 bg-white/12" />}
      </span>
      <p className="flex flex-wrap items-baseline gap-x-3 pb-5 pt-1">
        {noMapa ? (
          <a
            href={urlPonto(paragem)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold leading-snug transition-colors hover:text-mb-red-light"
          >
            {paragem.nome}
          </a>
        ) : (
          <span className="text-lg font-semibold leading-snug">{paragem.nome}</span>
        )}
        <span className="text-[0.8125rem] text-white/75 tabular-nums">{metros(paragem.alt)}</span>
        {paragem.nota && <span className="mt-1 basis-full text-sm leading-relaxed text-white/80">{paragem.nota}</span>}
      </p>
    </>
  );
}

/** Um troço: quilómetros, tempo de mota, piso, estrada, o que se vê e o aviso. */
function CartaoTroco({ troco, peloCaminho }: { troco: Troco; peloCaminho: string }) {
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
        {troco.estrada && <p className="mt-3 text-sm leading-relaxed text-white/80">{troco.estrada}</p>}
        {troco.ver && (
          <p className="mt-3 text-[15px] leading-relaxed text-white/85">
            <span className="mr-2 text-xs uppercase tracking-[0.15em] text-white/70">{peloCaminho}</span>
            {troco.ver}
          </p>
        )}
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
  const [rotas, pagina] = await Promise.all([lerRotas(), lerPaginaRotas()]);
  const rota = rotas.find((r) => r.slug === slug);
  if (!rota) notFound();
  const tx: TextosRota = pagina.detalhe;

  const clubes = (await lerClubes()).filter((c) => (rota.provincias as string[]).includes(c.provincia)).slice(0, 4);
  const indice = rotas.findIndex((r) => r.slug === rota.slug);
  const outras = [...rotas.slice(indice + 1), ...rotas.slice(0, indice)].slice(0, 3);

  const t = totais(rota);
  const estrada = rota.estrada;
  const capa = rota.fotos[0];
  const galeria = rota.fotos.slice(1);
  const clima = climaDaRota(rota, pagina.CLIMA);
  const sol = clima ? solDoAno(clima.lat, clima.lng) : [];
  // Um troço só entra no itinerário se as duas paragens existirem.
  const trocos = rota.trocos.filter((x) => rota.paragens[x.de] && rota.paragens[x.para]);
  const dias = [...new Set(trocos.map((x) => x.dia))];
  const multiDia = dias.length > 1;
  const fontes = fontesDaRota(rota, pagina);
  const gpx = comBase(`/rotas/${rota.slug}/gpx`);
  const ficheiroGpx = `motobox-${rota.slug}.gpx`;
  // O guia em PDF (app/rotas/[slug]/guia): tudo o que é preciso para a viagem, para imprimir.
  const guia = comBase(`/rotas/${rota.slug}/guia`);
  const ficheiroGuia = `motobox-${rota.slug}-guia.pdf`;
  const noMapa = rota.paragens.filter(coordValida);
  const temMapa = noMapa.length >= 2;
  const navegacao = temMapa ? urlNavegacao(noMapa) : "";
  const valorTexto = "text-2xl lg:text-3xl";
  const menu = (
    [
      ["#mapa", tx.menu.mapa, temMapa],
      ["#itinerario", tx.menu.itinerario, trocos.length > 0],
      ["#horario", tx.menu.horario, true],
      ["#pratico", tx.menu.pratico, true],
      ["#clima", tx.menu.clima, Boolean(clima) || rota.pontos.length > 0],
      ["#levar", tx.menu.levar, true],
      ["#fotografias", tx.menu.fotografias, galeria.length > 0],
      ["#fontes", tx.menu.fontes, true],
    ] as [string, string, boolean][]
  ).filter(([, texto, ha]) => ha && texto);

  return (
    <PaginaInterior icone={<Route />}>
      <Abertura
        foto={capa ? urlCommons(capa, 1920) : [pagina.abertura.foto, "banner-rotas"]}
        posicaoFoto={capa?.foco}
        sobretitulo={`${String(indice + 1).padStart(2, "0")} · ${rota.regiao}`}
        titulo={rota.nome}
        tamanho={rota.nome.length > 26 ? "2" : "1"}
        texto={rota.resumo || undefined}
      >
        <div className="flex flex-wrap gap-[var(--intervalo)]">
          {temMapa && (
            <BotaoMB href={navegacao} externo>
              {tx.botaoMapa}
            </BotaoMB>
          )}
          <BotaoDescarregar href={gpx} ficheiro={ficheiroGpx} texto={tx.botaoGpx} className="bg-black/50 backdrop-blur-md hover:bg-black/70" />
          {pagina.guia.botao && (
            <BotaoDescarregar
              href={guia}
              ficheiro={ficheiroGuia}
              texto={pagina.guia.botao}
              className="bg-black/50 backdrop-blur-md hover:bg-black/70"
            />
          )}
        </div>
        {capa && (
          <p className="mt-6 max-w-[60ch] text-xs leading-relaxed text-white/80">
            {capa.local && <>{capa.local}. </>}
            <CreditoFoto foto={capa} />
          </p>
        )}
      </Abertura>

      {/* ============ RESUMO ============ */}
      <Seccao>
        <nav aria-label="Nesta página" className="no-scrollbar -mx-1 mb-10 flex gap-2 overflow-x-auto px-1 pb-1">
          {menu.map(([href, texto]) => (
            <a key={href} href={href} className="pilula">
              {texto}
            </a>
          ))}
        </nav>

        <Numeros
          colunas={3}
          itens={[
            { valor: `${t.km} km`, texto: tx.numeros.distancia },
            { valor: duracao(t.minMota), texto: tx.numeros.rodar },
            { valor: rota.dias, texto: rota.dias > 1 ? tx.numeros.dias : tx.numeros.dia },
            {
              valor: (
                <span className={`inline-flex items-center gap-3 ${valorTexto}`}>
                  <span aria-hidden className={`size-3 shrink-0 rounded-full ${TOM_EXIGENCIA[rota.exigencia]}`} />
                  {rota.exigencia}
                </span>
              ),
              texto: tx.numeros.exigencia,
            },
            { valor: <span className={valorTexto}>{rota.piso}</span>, texto: tx.numeros.piso },
            { valor: <span className={valorTexto}>{rota.epocaCurta}</span>, texto: tx.numeros.epoca },
          ]}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div>
            <h2 className="titulo-3">{rota.subtitulo}</h2>
            <div className="prosa mt-6 max-w-[64ch]">
              {rota.descricao.map((p, i) => (
                <p key={`${i}-${p.slice(0, 40)}`}>{p}</p>
              ))}
            </div>

            {rota.destaques.length > 0 && (
              <>
                <h3 className="titulo-4 mt-12">{tx.ficha.oQueVer}</h3>
                <ul className="mt-5 grid gap-[var(--intervalo)] sm:grid-cols-2">
                  {rota.destaques.map((d, i) => (
                    <li key={`${i}-${d}`} className="painel painel-escuro flex gap-3 p-4 text-[15px] leading-snug text-white/85">
                      <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mb-red" />
                      {d}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className="space-y-[var(--intervalo)]">
            <div className="painel painel-escuro p-6">
              <h2 className="text-lg font-semibold">{tx.ficha.titulo}</h2>
              <dl className="mt-4">
                {(
                  [
                    [tx.ficha.regiao, rota.regiao],
                    [tx.ficha.partida, rota.partida],
                    [tx.ficha.piso, rota.piso],
                    [tx.ficha.exigencia, rota.exigencia],
                  ] as const
                )
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-white/8 py-2.5 first:pt-0">
                      <dt className="shrink-0 text-sm text-white/75">{k}</dt>
                      <dd className="text-right text-sm">{v}</dd>
                    </div>
                  ))}
              </dl>
              {rota.exigenciaPorque && <p className="mt-4 text-sm leading-relaxed text-white/75">{rota.exigenciaPorque}</p>}
              {rota.pisoDetalhe && (
                <>
                  <p className="mt-5 text-sm font-semibold">{tx.ficha.oPiso}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{rota.pisoDetalhe}</p>
                </>
              )}
            </div>

            {rota.melhorEpoca && (
              <div className="painel painel-escuro p-6">
                <h2 className="text-lg font-semibold">{tx.ficha.melhorEpoca}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{rota.melhorEpoca}</p>
              </div>
            )}

            {rota.diasNota.texto && (
              <div className="painel painel-escuro p-6">
                <h2 className="text-lg font-semibold">{tx.ficha.quantosDias}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{rota.diasNota.texto}</p>
                <LinksFontes fontes={rota.diasNota.fontes} className="mt-3" />
              </div>
            )}

            {clubes.length > 0 && (
              <div className="painel painel-escuro p-6">
                <h2 className="text-lg font-semibold">{tx.ficha.clubes}</h2>
                <ul className="mt-3">
                  {clubes.map((c) => (
                    <li key={c.slug} className="border-b border-white/8 last:border-0">
                      <Link href={`/clubes/${c.slug}`} className="group flex items-center gap-3 py-3">
                        <Monograma nome={c.nome} cor={c.cor} className="size-10 text-xs" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] transition-colors group-hover:text-mb-red-light">{c.nome}</span>
                          <span className="block text-[0.8125rem] text-white/75">{localClube(c)}</span>
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
      {temMapa && (
        <Seccao id="mapa" className="!pt-0">
          <Cabecalho icone={<IconeMapa />} titulo={tx.mapa.titulo} texto={tx.mapa.texto || undefined} />

          <div className="painel painel-escuro mt-10 p-[var(--intervalo)]">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--raio)] bg-near-black sm:aspect-[16/9]">
              <iframe
                src={urlMapaEmbebido(noMapa)}
                title={`Mapa da rota ${rota.nome}, com o trajecto no Google Maps`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 size-full border-0"
                allowFullScreen
              />
            </div>
            <div className="flex flex-wrap items-center gap-[var(--intervalo)] p-3 pt-[var(--intervalo)] sm:p-4 sm:pt-[var(--intervalo)]">
              <BotaoMB href={navegacao} externo>
                {tx.botaoMapa}
              </BotaoMB>
              <BotaoDescarregar href={gpx} ficheiro={ficheiroGpx} texto={tx.botaoGpx} />
              {pagina.guia.botao && <BotaoDescarregar href={guia} ficheiro={ficheiroGuia} texto={pagina.guia.botao} />}
              {multiDia && (
                <div className="flex flex-wrap gap-2 sm:ml-3">
                  {dias.map((d) => {
                    const doDia = paragensDoDia({ ...rota, trocos }, d).filter(coordValida);
                    if (doDia.length < 2) return null;
                    return (
                      <a
                        key={d}
                        href={urlNavegacao(doDia)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pilula group gap-2"
                      >
                        {tx.itinerario.dia} {d}
                        <Seta className="size-2.5" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {tx.mapa.nota && <p className="mt-4 max-w-[90ch] text-xs leading-relaxed text-white/70">{tx.mapa.nota}</p>}

          <Numeros
            className="mt-10"
            colunas={3}
            itens={[
              { valor: `${t.km} km`, texto: tx.mapa.total },
              { valor: duracao(t.minMota), texto: tx.mapa.rodar },
              { valor: duracao(t.minCarro), texto: tx.mapa.carro },
              { valor: metros(rota.altimetria.subida), texto: tx.mapa.subida },
              { valor: metros(rota.altimetria.max), texto: tx.mapa.maxima },
              { valor: metros(rota.altimetria.min), texto: tx.mapa.minima },
            ]}
          />
          {tx.mapa.metodo && <p className="mt-4 max-w-[90ch] text-xs leading-relaxed text-white/70">{tx.mapa.metodo}</p>}
        </Seccao>
      )}

      {/* ============ ESTADO DA ESTRADA ============ */}
      {estrada && (
        <Seccao id="estrada" className="!pt-0">
          <div className="painel painel-escuro grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-14 lg:p-10">
            <div>
              <Cabecalho icone={<Construction />} titulo={tx.estrada.titulo} />
              <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-white/70">
                {preencher(tx.estrada.texto, { quando: estrada.quando })}
              </p>
              <Link
                href={`/contacto?assunto=${encodeURIComponent(`Estado da estrada: ${rota.nome}`)}`}
                className="group mt-5 inline-flex items-center gap-2 text-sm"
              >
                <span className="sublinhado">{tx.estrada.ligacao}</span>
                <Seta className="size-3" />
              </Link>
            </div>
            <ul className="space-y-[var(--intervalo)]">
              {estrada.relatos.map((r, i) => (
                <li key={`${i}-${r.troco}`} className="rounded-[var(--raio)] bg-white/5 p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <p className="font-semibold">{r.troco}</p>
                    <span className={`rounded-[4px] px-2.5 py-1 text-xs font-medium ${COR_ESTADO[r.estado]}`}>
                      {NOME_ESTADO[r.estado]}
                    </span>
                  </div>
                  {r.nota && <p className="mt-2 text-[15px] leading-relaxed text-white/75">{r.nota}</p>}
                </li>
              ))}
            </ul>
          </div>
        </Seccao>
      )}

      {/* ============ ITINERÁRIO ============ */}
      {trocos.length > 0 && (
        <Seccao id="itinerario" className="!pt-0">
          <Cabecalho icone={<Route />} titulo={tx.itinerario.titulo} />

          <div className="mt-10 max-w-4xl space-y-12">
            {dias.map((d) => {
              const doDia = trocos.filter((x) => x.dia === d);
              const kmDia = Math.round(doDia.reduce((s, x) => s + x.km, 0));
              const minDia = doDia.reduce((s, x) => s + minMota(x), 0);
              const titulo = rota.horario[d - 1]?.titulo;
              return (
                <div key={d}>
                  {multiDia && (
                    <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h3 className="titulo-4">
                        {tx.itinerario.dia} {d}
                      </h3>
                      {titulo && <span className="text-[15px] text-white/75">{titulo}</span>}
                      <span className="text-sm text-white/75 tabular-nums">
                        {kmDia} km · {duracao(minDia)}
                      </span>
                    </div>
                  )}
                  <ol>
                    {doDia.map((x, i) => {
                      const ultimo = i === doDia.length - 1;
                      return (
                        <li key={`${x.de}-${x.para}-${i}`} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4">
                          {i === 0 && <LinhaParagem paragem={rota.paragens[x.de]} tipo="partida" continua />}
                          <CartaoTroco troco={x} peloCaminho={tx.itinerario.peloCaminho} />
                          <LinhaParagem paragem={rota.paragens[x.para]} tipo={ultimo ? "chegada" : "meio"} continua={!ultimo} />
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>

          {noMapa.length > 0 && (
            <details className="painel painel-escuro group/coord mt-8 max-w-4xl p-5 md:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                {tx.itinerario.coordenadas}
                <span aria-hidden className="text-xl leading-none text-white/80 transition-transform group-open/coord:rotate-45">
                  +
                </span>
              </summary>
              <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {noMapa.map((p, i) => (
                  <li key={p.nome + i} className="border-b border-white/8 py-2.5 text-[0.8125rem] last:border-0">
                    <span className="block text-white/85">{p.nome}</span>
                    <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-white/75">
                      <span className="font-mono tabular-nums">
                        {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                      </span>
                      {p.fonte.url && (
                        <a
                          href={p.fonte.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white/70 underline decoration-white/15 underline-offset-2 hover:text-white"
                        >
                          {p.fonte.nome}
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Seccao>
      )}

      {/* ============ HORÁRIO ============ */}
      <Seccao id="horario" className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <Cabecalho icone={<Clock />} titulo={tx.horario.titulo} texto={tx.horario.texto || undefined} />
            {clima && (
              <div className="painel painel-escuro mt-8 p-6">
                <p className="text-sm text-white/80">
                  {tx.horario.luz} · {clima.cidade}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  {[sol[5], sol[11]].map((s) => (
                    <div key={s.mes}>
                      <dt className="text-sm text-white/75">{s.mes}</dt>
                      <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                        {s.nascer} – {s.por}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-xs text-white/70">
                  {tx.horario.nota}{" "}
                  <a href="#clima" className="underline decoration-white/15 underline-offset-2 hover:text-white">
                    {tx.menu.clima}
                  </a>
                  .
                </p>
              </div>
            )}
          </div>

          <div className="space-y-10">
            {rota.horario.map((h, i) => (
              <div key={`${i}-${h.titulo}`}>
                <h3 className="text-lg font-semibold">
                  {multiDia && (
                    <span className="text-mb-red-light">
                      {tx.itinerario.dia} {i + 1} ·{" "}
                    </span>
                  )}
                  {h.titulo}
                </h3>
                <ol className="mt-4 grid gap-[var(--intervalo)]">
                  {h.passos.map((p, j) => (
                    <li key={`${j}-${p.hora}${p.texto}`} className="painel painel-escuro grid grid-cols-[4.25rem_minmax(0,1fr)] items-start gap-4 p-4">
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
        <Cabecalho icone={<Compass />} titulo={tx.pratico.titulo} />

        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 lg:grid-cols-3">
          <Bloco titulo={tx.pratico.combustivel} icone={<Fuel />} className="md:col-span-2">
            {rota.semCombustivel.texto && (
              <div className="mb-5 rounded-[var(--raio)] bg-mb-red/15 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-mb-red-light">{tx.pratico.semCombustivel}</p>
                <p className="mt-1.5 text-[15px] leading-relaxed">{rota.semCombustivel.texto}</p>
                <LinksFontes fontes={rota.semCombustivel.fontes} className="mt-1.5" />
              </div>
            )}
            <ListaFactos itens={[...rota.combustivel, pagina.PRECO_COMBUSTIVEL].filter((f) => f.texto)} />
          </Bloco>

          <Bloco titulo={tx.pratico.emergencia} icone={<Siren />}>
            <ul className="grid grid-cols-2 gap-[var(--intervalo)]">
              {pagina.EMERGENCIA.numeros.map((n, i) => (
                <li key={`${n.numero}-${i}`} className="rounded-[var(--raio)] bg-white/6 p-3">
                  <a href={`tel:${n.numero}`} className="text-3xl font-semibold tabular-nums tracking-tight hover:text-mb-red-light">
                    {n.numero}
                  </a>
                  <p className="mt-1 text-xs leading-snug text-white/80">{n.servico}</p>
                </li>
              ))}
            </ul>
            {pagina.EMERGENCIA.notas.map((n, i) => (
              <p key={`${i}-${n.slice(0, 40)}`} className="mt-4 text-sm leading-relaxed text-white/75">
                {n}
              </p>
            ))}
            <LinksFontes fontes={pagina.EMERGENCIA.fontes} className="mt-3" />
          </Bloco>

          {rota.comer.length > 0 && (
            <Bloco titulo={tx.pratico.comer} icone={<UtensilsCrossed />}>
              <ListaLugares itens={rota.comer} />
            </Bloco>
          )}

          {rota.dormir.length > 0 && (
            <Bloco titulo={tx.pratico.dormir} icone={<BedDouble />}>
              <ListaLugares itens={rota.dormir} />
            </Bloco>
          )}

          {rota.saude.length > 0 && (
            <Bloco titulo={tx.pratico.saude} icone={<Hospital />}>
              <ListaLugares itens={rota.saude} />
            </Bloco>
          )}

          {rota.perigos.length > 0 && (
            <Bloco titulo={tx.pratico.perigos} icone={<TriangleAlert />} className="md:col-span-2">
              <ListaFactos itens={rota.perigos} />
            </Bloco>
          )}

          <Bloco titulo={tx.pratico.rede} icone={<Signal />}>
            <ListaFactos itens={[...rota.rede, pagina.REDE_GERAL].filter((f) => f.texto)} />
          </Bloco>

          {pagina.DOCUMENTOS.length > 0 && (
            <Bloco titulo={tx.pratico.documentos} icone={<FileText />} className="md:col-span-2 lg:col-span-1">
              <ListaFactos itens={pagina.DOCUMENTOS} />
            </Bloco>
          )}

          {rota.licencas.length > 0 && (
            <Bloco titulo={tx.pratico.licencas} icone={<Ticket />}>
              <ListaFactos itens={rota.licencas} />
            </Bloco>
          )}

          {rota.motas.length > 0 && (
            <Bloco titulo={tx.pratico.motas} icone={<Bike />}>
              <ListaFactos itens={rota.motas} />
            </Bloco>
          )}
        </div>
      </Seccao>

      {/* ============ CLIMA E LUZ ============ */}
      {(clima || rota.pontos.length > 0) && (
        <Seccao id="clima" className="!pt-0">
          {clima && (
            <>
              <Cabecalho
                icone={<CloudSun />}
                titulo={`${tx.clima.titulo} · ${clima.cidade}`}
                texto={tx.clima.texto || undefined}
              />
              <div className="painel painel-escuro mt-10 overflow-x-auto p-5 md:p-6">
                <table className="w-full min-w-[720px] text-sm tabular-nums">
                  <thead>
                    <tr className="border-b border-white/12 text-left">
                      <th className="py-2.5 pr-3 font-normal" scope="col">
                        <span className="sr-only">Mês</span>
                      </th>
                      {sol.map((s) => (
                        <th key={s.mes} scope="col" className="py-2.5 text-center text-xs font-normal uppercase tracking-[0.12em] text-white/75">
                          {s.mes}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        [tx.clima.maxima, (i: number) => clima.meses[i]?.max, false],
                        [tx.clima.minima, (i: number) => clima.meses[i]?.min, false],
                        [tx.clima.chuva, (i: number) => clima.meses[i]?.chuva, true],
                        [tx.clima.nascer, (i: number) => sol[i].nascer, false],
                        [tx.clima.por, (i: number) => sol[i].por, false],
                      ] as [string, (i: number) => number | string | null | undefined, boolean][]
                    ).map(([rotulo, valor, eChuva], linha) => (
                      <tr key={`${linha}-${rotulo}`} className="border-b border-white/8 last:border-0">
                        <th scope="row" className="whitespace-nowrap py-3 pr-4 text-left text-xs font-normal text-white/80">
                          {rotulo}
                        </th>
                        {sol.map((s, i) => {
                          const v = valor(i);
                          const chuvoso = eChuva && typeof v === "number" && v >= 50;
                          return (
                            <td key={s.mes} className={`py-3 text-center ${chuvoso ? "font-semibold text-mb-red-light" : "text-white/85"}`}>
                              {typeof v === "number" ? v.toLocaleString("pt-PT") : (v ?? "–")}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <LinksFontes fontes={[clima.fonte, FONTE_SOL].filter((f) => f?.url)} className="mt-4" />
              <p className="mt-1 max-w-[90ch] text-xs leading-relaxed text-white/70">
                {[clima.nota, tx.clima.nota].filter(Boolean).join(" ")}
              </p>
            </>
          )}

          {/* Pontos de interesse */}
          {rota.pontos.length > 0 && (
            <>
              <h3 className={`titulo-4${clima ? " mt-16" : ""}`}>{tx.clima.pontos}</h3>
              <ul className="mt-6 grid gap-[var(--intervalo)] md:grid-cols-2">
                {rota.pontos.map((p, i) => (
                  <li key={`${i}-${p.nome}`} className="painel painel-escuro flex flex-col p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="text-[15px] font-semibold">{p.nome}</span>
                      <a
                        href={urlPonto(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-white/75 underline decoration-white/15 underline-offset-2 hover:text-white"
                      >
                        <MapPin className="size-3" aria-hidden />
                        {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                      </a>
                    </div>
                    {p.nota && <p className="mt-2 text-sm leading-relaxed text-white/75">{p.nota}</p>}
                    <LinksFontes fontes={p.fontes} className="mt-auto pt-3" />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Seccao>
      )}

      {/* ============ O QUE LEVAR ============ */}
      <Seccao id="levar" className="!pt-0">
        <Cabecalho icone={<Backpack />} titulo={tx.levar.titulo} />
        <div className="mt-10 grid gap-[var(--intervalo)] lg:grid-cols-[1fr_1.6fr]">
          <div className="grid gap-[var(--intervalo)] content-start">
            {rota.agua.texto && (
              <Bloco titulo={tx.levar.agua} icone={<Droplets />}>
                <p className="text-[15px] leading-relaxed text-white/85">{rota.agua.texto}</p>
                <LinksFontes fontes={rota.agua.fontes} className="mt-3" />
              </Bloco>
            )}
            {rota.grupo.texto && (
              <Bloco titulo={tx.levar.grupo} icone={<Users />}>
                <p className="text-[15px] leading-relaxed text-white/85">{rota.grupo.texto}</p>
                <LinksFontes fontes={rota.grupo.fontes} className="mt-3" />
              </Bloco>
            )}
          </div>
          <div className="grid content-start gap-[var(--intervalo)] sm:grid-cols-2">
            {rota.levar.length > 0 && (
              <div className="painel painel-escuro p-6">
                <h3 className="text-lg font-semibold">{tx.levar.rota}</h3>
                <div className="mt-3">
                  <ListaVisto itens={rota.levar} />
                </div>
              </div>
            )}
            {pagina.LEVAR_BASE.length > 0 && (
              <div className="painel painel-escuro p-6">
                <h3 className="text-lg font-semibold">{tx.levar.sempre}</h3>
                <div className="mt-3">
                  <ListaVisto itens={pagina.LEVAR_BASE} />
                </div>
              </div>
            )}
          </div>
        </div>
      </Seccao>

      {/* ============ FOTOGRAFIAS ============ */}
      {galeria.length > 0 && (
        <Seccao id="fotografias" className="!pt-0">
          <Cabecalho icone={<Camera />} titulo={tx.fotografias.titulo} texto={tx.fotografias.texto || undefined} />
          <div className="mt-10 grid gap-[var(--intervalo)] sm:grid-cols-2 lg:grid-cols-3">
            {galeria.map((f, i) => (
              <figure key={`${i}-${f.url || f.arquivo}`} className="painel painel-escuro flex flex-col p-[var(--intervalo)]">
                <QuadroRota foto={f} className="aspect-[4/3]" tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                <figcaption className="p-3 pt-4">
                  {f.local && <p className="text-[15px] leading-snug">{f.local}</p>}
                  <p className="mt-1.5 text-xs leading-relaxed text-white/75">
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
        {rota.dicas.length > 0 && (
          <>
            <Cabecalho icone={<Lightbulb />} titulo={tx.dicas.titulo} />
            <ol className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2">
              {rota.dicas.map((d, i) => (
                <li key={`${i}-${d}`} className="painel painel-escuro flex gap-5 p-6">
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                    {i + 1}
                  </span>
                  <p className="text-[15px] leading-relaxed text-white/85">{d}</p>
                </li>
              ))}
            </ol>
          </>
        )}

        <div className={`${rota.dicas.length > 0 ? "mt-[var(--intervalo)] " : ""}grid gap-[var(--intervalo)] lg:grid-cols-[1.4fr_1fr]`}>
          {rota.distancias.length > 0 && (
            <div className="painel painel-escuro p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="size-5 text-mb-red-light" aria-hidden /> {tx.dicas.distancias}
              </h3>
              <ul className="mt-4">
                {rota.distancias.map((d, i) => (
                  <li key={`${i}-${d.texto}`} className="border-b border-white/8 py-3 last:border-0">
                    <p className="text-[15px] leading-relaxed text-white/85">{d.texto}</p>
                    {d.fonte.url && (
                      <a
                        href={d.fonte.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-block text-xs text-white/70 underline decoration-white/15 underline-offset-2 hover:text-white"
                      >
                        {d.fonte.nome}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              {tx.dicas.distanciasNota && <p className="mt-3 text-xs text-white/70">{tx.dicas.distanciasNota}</p>}
            </div>
          )}
          <div className="painel painel-escuro flex flex-col p-6">
            <p className="text-lg font-semibold">{tx.correccao.titulo}</p>
            {tx.correccao.texto && <p className="mt-2 text-sm leading-relaxed text-white/70">{tx.correccao.texto}</p>}
            <div className="mt-auto pt-6">
              <BotaoMB href={`/contacto?assunto=${encodeURIComponent(`Correcção à rota ${rota.nome}`)}`} variante="escuro">
                {tx.correccao.botao}
              </BotaoMB>
            </div>
          </div>
        </div>
      </Seccao>

      {/* ============ FONTES ============ */}
      <Seccao id="fontes" className="!pt-0">
        <h2 className="titulo-4">{tx.fontes.titulo}</h2>
        <ol className="mt-5 grid gap-x-10 gap-y-2 text-sm text-white/80 md:grid-cols-2">
          {fontes.map((f, i) => (
            <li key={f.url} className="break-words">
              <span className="text-white/70">[{i + 1}]</span>{" "}
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {f.nome}
              </a>
            </li>
          ))}
        </ol>
        {tx.fontes.nota && <p className="mt-6 max-w-[90ch] text-xs leading-relaxed text-white/70">{tx.fontes.nota}</p>}
      </Seccao>

      {/* ============ OUTRAS ROTAS ============ */}
      {outras.length > 0 && (
        <Seccao className="!pt-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="titulo-3">{tx.outras.titulo}</h2>
            <Link href="/rotas" className="group inline-flex items-center gap-2 text-sm">
              <span className="sublinhado">{tx.outras.todas}</span>
              <Seta className="size-3" />
            </Link>
          </div>
          <div className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-3">
            {outras.map((r) => (
              <CartaoOutraRota key={r.slug} rota={r} />
            ))}
          </div>
        </Seccao>
      )}
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
          <p className="text-[0.8125rem] text-white/80">{rota.regiao}</p>
          <h3 className="mt-1 text-lg font-semibold leading-snug">{rota.nome}</h3>
          <p className="mt-2 text-[0.8125rem] text-white/75 tabular-nums">
            {t.km} km · {duracao(t.minMota)} · <span className="text-mb-red-light">{rota.exigencia}</span>
          </p>
        </div>
        <Seta className="mb-1 size-3.5" />
      </div>
    </Link>
  );
}
