import Link from "next/link";
import { Placeholder, Retrato } from "@/components/Brand";
import { C, T } from "@/components/T";
import { Countdown } from "@/components/Countdown";
import { Newsletter } from "@/components/Newsletter";
import { ButtonLink, EmptyState, Icon, PosicaoBadge, SectionHead, Tag } from "@/components/ui";
import {
  TEMPORADA,
  classificacaoEquipas,
  classificacaoPilotos,
  formatData,
  proximoEvento,
} from "@/lib/data";
import {
  lerCorridas,
  lerEquipas,
  lerEventos,
  lerNoticias,
  lerPatrocinadores,
  lerPilotos,
  lerVideos,
} from "@/lib/supabase/publico";
import { eComunidade, eProva, instante } from "@/lib/desporto";
import { CartaoEvento, LinhaEventoCompacta } from "@/app/calendario/ListaEventos";

/** Atalhos para as secções novas, logo abaixo do destaque. */
const EXPLORAR = [
  { href: "/desporto", icone: "flag", chave: "nav.desporto", texto: "Motocross, enduro e rally-raid" },
  { href: "/eventos", icone: "calendar", chave: "nav.eventos", texto: "Passeios, encontros e solidariedade" },
  { href: "/clubes", icone: "bike", chave: "nav.clubes", texto: "Lazer, turismo e Lady Riders" },
  { href: "/seguranca", icone: "shield", chave: "nav.seguranca", texto: "Capacete, chuva e boas práticas" },
  { href: "/marketplace/importar", icone: "map", chave: "menu.importarCurto", texto: "Lojas que enviam para Angola" },
];

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

function iniciais(nome: string) {
  return nome.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export default async function Home() {
  const [eventos, noticias, pilotos, equipas, corridas, videos, patrocinadores] = await Promise.all([
    lerEventos(), lerNoticias(), lerPilotos(), lerEquipas(),
    lerCorridas(), lerVideos(), lerPatrocinadores(),
  ]);

  // Cada secção tolera a sua lista vazia: o painel pode apagar tudo.
  // O destaque e "A seguir" são provas; os eventos da comunidade têm bloco próprio.
  const provas = eventos.filter((e) => eProva(e.disciplina));
  const proximo = proximoEvento(provas);
  const destaques = noticias.filter((n) => n.destaque);
  const principal = destaques[0] ?? noticias[0];
  const secundarias = noticias.filter((n) => n.slug !== principal?.slug).slice(0, 4);
  const topPilotos = classificacaoPilotos(pilotos).slice(0, 5);
  const topEquipas = classificacaoEquipas(equipas).slice(0, 3);
  const corEquipa = new Map(equipas.map((e) => [e.slug, e.cor]));
  const ultimaCorrida = corridas.at(-1);
  const proximasProvas = provas
    .filter((e) => new Date(e.dataInicio).getTime() > instante())
    .slice(0, 3);
  const proximosEventos = eventos
    .filter((e) => eComunidade(e.disciplina) && new Date(e.dataFim).getTime() >= instante())
    .slice(0, 3);
  const videosDestaque = videos.slice(0, 5);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <Placeholder nome={[proximo?.slug, proximo?.imagem ?? "namibe"]} className="absolute inset-0" tamanhos="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/70 to-ink-950/25" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl rise">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="red"><T k="paginas.temporada" /> {TEMPORADA}</Tag>
              {proximo && <Tag tone="outline">{proximo.ronda && <><T k="paginas.ronda" /> {proximo.ronda} · </>}{proximo.disciplina}</Tag>}
            </div>

            <h1 className="title-xl mt-6 text-5xl sm:text-6xl lg:text-7xl">
              <T k="paginas.inicioTitulo1" /><br />
              <span className="text-mb-red"><T k="paginas.inicioTitulo2" /></span><br />
              <T k="paginas.inicioTitulo3" />
            </h1>

            <p className="mt-6 max-w-xl text-base sm:text-lg text-ink-300 leading-relaxed">
              <T k="paginas.inicioSub" />
            </p>

            {proximo && (
              <div className="mt-10 max-w-xl rounded-card bg-ink-950/60 p-6 sm:p-7 backdrop-blur-md">
                <p className="eyebrow text-mb-red"><T k="paginas.proximaProva" /></p>
                <h2 className="font-display mt-2 text-2xl sm:text-3xl uppercase leading-tight text-white">
                  <C>{proximo.titulo}</C>
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="pin" className="size-4 text-mb-red" />
                    {proximo.circuito}, {proximo.provincia}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="calendar" className="size-4 text-mb-red" />
                    {formatData(proximo.dataInicio, { day: "2-digit", month: "long" })}
                  </span>
                </p>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <Countdown data={proximo.dataInicio} size="md" />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {proximo.bilhetes && (
                    <ButtonLink href={`/bilhetes/${proximo.slug}`} size="md">
                      <Icon name="ticket" className="size-4" />
                      Comprar bilhetes
                    </ButtonLink>
                  )}
                  <ButtonLink href={`/calendario/${proximo.slug}`} variant="outline" size="md">
                    Detalhes do evento
                  </ButtonLink>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ EXPLORAR ============ */}
      <nav aria-label="Explorar" className="mx-auto max-w-7xl px-4 sm:px-6 pt-2 pb-6">
        <p className="eyebrow mb-4 text-ink-500">Explorar</p>
        <ul className="-mx-4 flex gap-2 overflow-x-auto no-scrollbar px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:gap-6">
          {EXPLORAR.map((x) => (
            <li key={x.href} className="shrink-0">
              <Link
                href={x.href}
                className="group flex items-center gap-3 rounded-full bg-ink-900 py-1.5 pl-1.5 pr-5 transition-colors hover:bg-ink-800 lg:rounded-none lg:bg-transparent lg:p-0 lg:hover:bg-transparent"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mb-red/12 text-mb-red transition-colors group-hover:bg-mb-red group-hover:text-white lg:size-11">
                  <Icon name={x.icone} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-ui text-base text-white transition-colors lg:text-lg lg:group-hover:text-mb-red">
                    <T k={x.chave} />
                  </span>
                  <span className="hidden text-xs text-ink-500 lg:block">{x.texto}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ============ FAIXA DE PATROCINADORES ============ */}
      {patrocinadores.length > 0 && (
        <section className="py-6 overflow-hidden" aria-label="Patrocinadores oficiais">
          <div className="flex w-max marquee-track">
            {[0, 1].map((rep) => (
              <div key={rep} className="flex items-center gap-12 px-6" aria-hidden={rep === 1}>
                <span className="eyebrow shrink-0 text-ink-600">Parceiros oficiais</span>
                {patrocinadores.map((p) => (
                  <span
                    key={p.slug}
                    className="font-display shrink-0 text-lg uppercase tracking-wide text-ink-600 transition-colors hover:text-ink-300"
                  >
                    {p.nome}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ ÚLTIMAS NOTÍCIAS ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <SectionHead
          eyebrow="Últimas"
          titulo="Notícias"
          acao={{ href: "/noticias", texto: "Todas as notícias" }}
        />

        {!principal ? (
          <div className="mt-9">
            <EmptyState
              titulo="Sem notícias publicadas"
              descricao="As próximas notícias do motociclismo angolano aparecem aqui."
            />
          </div>
        ) : (
          <div className="mt-9 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-[1.35fr_1fr]">
            {/* Notícia principal: título sobre a fotografia, como a manchete da F1 */}
            <Link
              href={`/noticias/${principal.slug}`}
              className="group relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden rounded-card lg:min-h-[520px]"
            >
              <Placeholder
                nome={principal.imagem}
                className="absolute inset-0 -z-10 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />
              <div className="p-6 sm:p-8">
                <Tag tone="red">{principal.categoria}</Tag>
                <h3 className="mt-4 font-display text-3xl sm:text-4xl uppercase leading-[0.95] text-white">
                  {principal.titulo}
                </h3>
                <p className="mt-3 max-w-xl text-sm text-ink-300 leading-relaxed line-clamp-2">{principal.resumo}</p>
                <p className="mt-4 flex items-center gap-3 text-xs text-ink-400">
                  <span>{formatData(principal.data)}</span>
                  <span className="size-1 rounded-full bg-ink-500" />
                  <span>{principal.leitura} min de leitura</span>
                </p>
              </div>
            </Link>

            {/* Secundárias: fotografia arredondada e título por baixo, sem moldura */}
            <div className="grid grid-cols-2 content-start gap-x-5 gap-y-7">
              {secundarias.map((n) => (
                <Link key={n.slug} href={`/noticias/${n.slug}`} className="group block">
                  <Placeholder
                    nome={[n.slug, n.imagem]}
                    className="media aspect-[16/10]"
                    tamanhos="(max-width: 1024px) 50vw, 260px"
                  />
                  <p className="eyebrow mt-3 text-mb-red">{n.categoria}</p>
                  <h3 className="mt-1.5 font-display text-base sm:text-lg uppercase leading-tight text-white line-clamp-3 transition-colors group-hover:text-mb-red">
                    {n.titulo}
                  </h3>
                  <p className="mt-1.5 text-xs text-ink-500">{formatData(n.data, { day: "2-digit", month: "short" })}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ============ CLASSIFICAÇÃO + PRÓXIMAS PROVAS ============ */}
      <section className="bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 gap-x-14 gap-y-14 lg:grid-cols-[1.25fr_1fr]">
            {/* Classificação */}
            <div>
              <SectionHead
                eyebrow={`Campeonato Nacional ${TEMPORADA}`}
                titulo="Classificação"
                acao={{ href: "/classificacao", texto: "Tabela completa" }}
              />
              {topPilotos.length === 0 ? (
                <div className="mt-7">
                  <EmptyState
                    titulo="Classificação por publicar"
                    descricao="A tabela aparece depois da primeira prova pontuável da temporada."
                  />
                </div>
              ) : (
                <ol className="mt-7">
                  {topPilotos.map((p) => (
                    <li key={p.slug} className="border-b border-white/6 last:border-0">
                      <Link
                        href={`/pilotos/${p.slug}`}
                        className="group flex items-center gap-4 py-3.5"
                      >
                        <PosicaoBadge posicao={p.posicao} />
                        <span
                          className="h-10 w-1 shrink-0 rounded-full bg-ink-700"
                          style={{ background: corEquipa.get(p.equipaSlug) }}
                          aria-hidden
                        />
                        <Retrato
                          nome={p.slug}
                          iniciais={iniciais(p.nome)}
                          className="size-11 shrink-0 rounded-full"
                          tamanhos="44px"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-lg uppercase leading-tight text-white truncate transition-colors group-hover:text-mb-red">
                            {p.nome}
                          </p>
                          <p className="text-xs text-ink-500 truncate">
                            {p.equipa} · {p.categoria}
                          </p>
                        </div>
                        <p className="shrink-0 font-display text-xl text-white tabular-nums">
                          {p.estatisticas.pontos}
                          <span className="ml-1 text-xs text-ink-500">PTS</span>
                        </p>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}

              {/* Mini tabela de equipas */}
              {topEquipas.length > 0 && (
                <div className="mt-8">
                  <p className="eyebrow text-ink-500 mb-4">Equipas</p>
                  <div className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
                    {topEquipas.map((e) => (
                      <Link
                        key={e.slug}
                        href={`/equipas/${e.slug}`}
                        className="group flex items-center gap-3"
                      >
                        <span className="font-display text-base text-ink-500 tabular-nums w-4">{e.posicao}</span>
                        <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: e.cor }} />
                        <span className="min-w-0 flex-1 truncate text-sm text-ink-300 group-hover:text-white transition-colors">
                          {e.nome}
                        </span>
                        <span className="font-display text-base text-white tabular-nums">
                          {e.estatisticas.pontos}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Próximas provas */}
            <div>
              <SectionHead
                eyebrow="Calendário"
                titulo="A seguir"
                acao={{ href: "/calendario", texto: "Ver calendário" }}
              />
              {proximasProvas.length === 0 ? (
                <div className="mt-7">
                  <EmptyState
                    titulo="Sem provas agendadas"
                    descricao="As próximas provas aparecem aqui assim que forem anunciadas."
                  />
                </div>
              ) : (
                <ul className="mt-7">
                  {proximasProvas.map((e) => (
                    <LinhaEventoCompacta key={e.slug} e={e} />
                  ))}
                </ul>
              )}

              {/* Último resultado */}
              {ultimaCorrida && (
                <div className="mt-8 rounded-card bg-ink-950 p-6">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow text-ink-500">Último resultado</p>
                    <Link href="/resultados" className="font-ui text-sm text-white hover:text-mb-red transition-colors">
                      Arquivo →
                    </Link>
                  </div>
                  <p className="mt-2.5 font-display text-xl uppercase text-white">
                    {ultimaCorrida.nome} · {ultimaCorrida.categoria}
                  </p>
                  <div className="mt-4">
                    {ultimaCorrida.resultados.slice(0, 3).map((r) => (
                      <div key={r.posicao} className="flex items-center gap-3 border-b border-white/6 py-2.5 last:border-0">
                        <PosicaoBadge posicao={r.posicao} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-sm text-ink-200">{r.piloto}</span>
                        <span className="font-mono text-xs text-ink-500 tabular-nums">{r.tempo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ VÍDEOS ============ */}
      {videosDestaque.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <SectionHead
            eyebrow="Motobox TV"
            titulo="Vídeos e highlights"
            acao={{ href: "/videos", texto: "Todos os vídeos" }}
          />
          <div className="mt-9 -mx-4 sm:-mx-6 overflow-x-auto no-scrollbar">
            <div className="flex gap-4 px-4 sm:px-6 pb-2">
              {videosDestaque.map((v) => (
                <Link
                  key={v.slug}
                  href={`/videos#${v.slug}`}
                  className="group w-[280px] sm:w-[320px] shrink-0"
                >
                  <div className="media relative aspect-video">
                    <Placeholder nome={[v.slug, v.thumbnail]} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute bottom-3 left-3 grid size-10 place-items-center rounded-full bg-white/15 text-white ring-2 ring-white/80 backdrop-blur-sm transition-colors group-hover:bg-mb-red group-hover:ring-mb-red">
                      <Icon name="play" className="size-4 translate-x-px" />
                    </span>
                    <span className="absolute bottom-3.5 right-3 font-mono text-xs text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.8)]">
                      {v.duracao}
                    </span>
                  </div>
                  <p className="eyebrow mt-3 text-mb-red">{v.categoria}</p>
                  <h3 className="mt-1.5 font-display text-lg uppercase leading-tight text-white line-clamp-2 transition-colors group-hover:text-mb-red">
                    {v.titulo}
                  </h3>
                  <p className="mt-1.5 text-xs text-ink-500">
                    {v.visualizacoes.toLocaleString("pt-PT")} visualizações
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ PRÓXIMOS EVENTOS (COMUNIDADE) ============ */}
      {proximosEventos.length > 0 && (
        <section className={`mx-auto max-w-7xl px-4 sm:px-6 pb-16 ${videosDestaque.length > 0 ? "" : "pt-16"}`}>
          <SectionHead
            eyebrow="Comunidade"
            titulo="Próximos eventos"
            acao={{ href: "/eventos", texto: "Todos os eventos" }}
          />
          <div className="mt-9 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {proximosEventos.map((e) => (
              // Já vêm filtrados aos que ainda não acabaram: nenhum fica esbatido.
              <CartaoEvento key={e.slug} e={e} agora={0} />
            ))}
          </div>
        </section>
      )}

      {/* ============ ACESSOS RÁPIDOS ============ */}
      <section className="bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/bilhetes",
                icone: "ticket",
                titulo: "Bilhetes",
                texto: "Compre online, receba o QR no telemóvel e entre sem filas.",
              },
              {
                href: "/marketplace",
                icone: "tag",
                titulo: "Marketplace",
                texto: "Motas e peças de vendedores verificados da comunidade.",
              },
              {
                href: "/forum",
                icone: "chat",
                titulo: "Fórum",
                texto: "Mecânica, passeios, dúvidas: fale com quem já passou por isso.",
              },
              {
                href: "/conta",
                icone: "bell",
                titulo: "Alertas",
                texto: "Siga pilotos e equipas e receba aviso quando houver novidades.",
              },
            ].map((c) => (
              <Link key={c.href} href={c.href} className="group block">
                <span className="grid size-12 place-items-center rounded-full bg-mb-red/12 text-mb-red transition-colors group-hover:bg-mb-red group-hover:text-white">
                  <Icon name={c.icone} className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-2xl uppercase text-white">{c.titulo}</h3>
                <p className="mt-2 text-sm text-ink-400 leading-relaxed">{c.texto}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-ui text-base text-white transition-colors group-hover:text-mb-red">
                  Aceder
                  <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
