import Link from "next/link";
import { Placeholder, Retrato } from "@/components/Brand";
import { C, T } from "@/components/T";
import { Countdown } from "@/components/Countdown";
import { Newsletter } from "@/components/Newsletter";
import { ButtonLink, Icon, PosicaoBadge, SectionHead, Tag } from "@/components/ui";
import {
  TEMPORADA,
  classificacaoEquipas,
  classificacaoPilotos,
  corridas,
  eventos,
  formatData,
  formatDataCurta,
  noticias,
  patrocinadores,
  proximoEvento,
  videos,
} from "@/lib/data";

function iniciais(nome: string) {
  return nome.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export default function Home() {
  const proximo = proximoEvento();
  const destaques = noticias.filter((n) => n.destaque);
  const principal = destaques[0] ?? noticias[0];
  const secundarias = noticias.filter((n) => n.slug !== principal.slug).slice(0, 4);
  const topPilotos = classificacaoPilotos().slice(0, 5);
  const topEquipas = classificacaoEquipas().slice(0, 3);
  const ultimaCorrida = corridas[corridas.length - 1];
  const proximasProvas = eventos
    .filter((e) => new Date(e.dataInicio).getTime() > Date.now())
    .slice(0, 3);
  const videosDestaque = videos.slice(0, 5);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-ink-800">
        <Placeholder nome={[proximo?.slug, proximo?.imagem ?? "namibe"]} className="absolute inset-0" tamanhos="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/70 to-ink-950/25" />
        <div className="grid-bg absolute inset-0 opacity-20" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl rise">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="red"><T k="paginas.temporada" /> {TEMPORADA}</Tag>
              {proximo && <Tag tone="outline"><T k="paginas.ronda" /> {proximo.ronda ?? "—"} · {proximo.disciplina}</Tag>}
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
              <div className="mt-10 border border-ink-700 bg-ink-950/80 backdrop-blur-sm p-6 sm:p-7 max-w-xl">
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

                <div className="mt-6 border-t border-ink-800 pt-5">
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

      {/* ============ FAIXA DE PATROCINADORES ============ */}
      <section className="border-b border-ink-800 bg-ink-900 py-5 overflow-hidden" aria-label="Patrocinadores oficiais">
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

      {/* ============ ÚLTIMAS NOTÍCIAS ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <SectionHead
          eyebrow="Últimas"
          titulo="Notícias"
          acao={{ href: "/noticias", texto: "Todas as notícias" }}
        />

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* Notícia principal */}
          <Link
            href={`/noticias/${principal.slug}`}
            className="group card card-hover overflow-hidden flex flex-col"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <Placeholder nome={principal.imagem} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute left-4 top-4">
                <Tag tone="red">{principal.categoria}</Tag>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display text-2xl sm:text-3xl uppercase leading-tight text-white group-hover:text-mb-red transition-colors">
                {principal.titulo}
              </h3>
              <p className="mt-3 text-sm text-ink-400 leading-relaxed line-clamp-3">{principal.resumo}</p>
              <p className="mt-4 flex items-center gap-3 text-xs text-ink-600">
                <span>{formatData(principal.data)}</span>
                <span className="size-1 rounded-full bg-ink-700" />
                <span>{principal.leitura} min de leitura</span>
              </p>
            </div>
          </Link>

          {/* Lista lateral */}
          <div className="grid gap-3 content-start">
            {secundarias.map((n) => (
              <Link
                key={n.slug}
                href={`/noticias/${n.slug}`}
                className="group card card-hover flex gap-4 overflow-hidden"
              >
                <Placeholder nome={[n.slug, n.imagem]} className="w-28 sm:w-32 shrink-0" tamanhos="128px" />
                <div className="min-w-0 flex-1 py-3.5 pr-4">
                  <p className="eyebrow text-mb-red">{n.categoria}</p>
                  <h3 className="mt-1.5 font-display text-base uppercase leading-snug text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                    {n.titulo}
                  </h3>
                  <p className="mt-1.5 text-xs text-ink-600">{formatData(n.data, { day: "2-digit", month: "short" })}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLASSIFICAÇÃO + PRÓXIMAS PROVAS ============ */}
      <section className="border-y border-ink-800 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
            {/* Classificação */}
            <div>
              <SectionHead
                eyebrow={`Campeonato Nacional ${TEMPORADA}`}
                titulo="Classificação"
                acao={{ href: "/classificacao", texto: "Tabela completa" }}
              />
              <div className="mt-7 card overflow-hidden">
                {topPilotos.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/pilotos/${p.slug}`}
                    className="group flex items-center gap-4 border-b border-ink-800 p-4 last:border-0 hover:bg-ink-850 transition-colors"
                  >
                    <PosicaoBadge posicao={p.posicao} />
                    <div
                      className="h-11 w-1 shrink-0"
                      style={{ background: p.equipaSlug === "kilamba-racing" ? "#e10600" : undefined }}
                    />
                    <Retrato
                      nome={p.slug}
                      iniciais={iniciais(p.nome)}
                      className="size-11 shrink-0 rounded-full"
                      tamanhos="44px"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base uppercase text-white truncate group-hover:text-mb-red transition-colors">
                        {p.nome}
                      </p>
                      <p className="text-xs text-ink-500 truncate">
                        {p.equipa} · {p.categoria}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-xl text-white tabular-nums">{p.estatisticas.pontos}</p>
                      <p className="eyebrow text-ink-600">Pts</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mini tabela de equipas */}
              <div className="mt-4 card p-4">
                <p className="eyebrow text-ink-500 mb-3">Equipas</p>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {topEquipas.map((e) => (
                    <Link
                      key={e.slug}
                      href={`/equipas/${e.slug}`}
                      className="group flex items-center gap-2.5"
                    >
                      <span className="font-display text-xs text-ink-600 tabular-nums w-4">{e.posicao}</span>
                      <span className="h-6 w-1 shrink-0" style={{ background: e.cor }} />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-300 group-hover:text-white transition-colors">
                        {e.nome}
                      </span>
                      <span className="font-display text-sm text-white tabular-nums">
                        {e.estatisticas.pontos}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Próximas provas */}
            <div>
              <SectionHead
                eyebrow="Calendário"
                titulo="A seguir"
                acao={{ href: "/calendario", texto: "Ver calendário" }}
              />
              <div className="mt-7 grid gap-3">
                {proximasProvas.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/calendario/${e.slug}`}
                    className="group card card-hover flex items-stretch overflow-hidden"
                  >
                    <div className="grid w-20 shrink-0 place-content-center border-r border-ink-800 bg-ink-950 px-2 py-4 text-center">
                      <span className="font-display text-2xl leading-none text-white">
                        {new Date(e.dataInicio).getDate()}
                      </span>
                      <span className="eyebrow mt-1 text-mb-red">
                        {new Date(e.dataInicio).toLocaleDateString("pt-PT", { month: "short" }).replace(".", "")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-center gap-2">
                        <Tag tone="outline" className="!text-[9px]">{e.disciplina}</Tag>
                        {e.estado === "bilhetes-abertos" && <Tag tone="red" className="!text-[9px]">Bilhetes</Tag>}
                      </div>
                      <h3 className="mt-2 font-display text-base uppercase leading-snug text-white line-clamp-2 group-hover:text-mb-red transition-colors">
                        {e.titulo}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                        <Icon name="pin" className="size-3.5" />
                        {e.localidade}, {e.provincia}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Último resultado */}
              <div className="mt-4 card p-5">
                <div className="flex items-center justify-between">
                  <p className="eyebrow text-ink-500">Último resultado</p>
                  <Link href="/resultados" className="eyebrow text-mb-red hover:text-mb-red-light">
                    Arquivo →
                  </Link>
                </div>
                <p className="mt-2.5 font-display text-lg uppercase text-white">
                  {ultimaCorrida.nome} · {ultimaCorrida.categoria}
                </p>
                <div className="mt-4 space-y-2">
                  {ultimaCorrida.resultados.slice(0, 3).map((r) => (
                    <div key={r.posicao} className="flex items-center gap-3">
                      <PosicaoBadge posicao={r.posicao} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-200">{r.piloto}</span>
                      <span className="font-mono text-xs text-ink-500 tabular-nums">{r.tempo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ VÍDEOS ============ */}
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
                className="group card card-hover w-[280px] sm:w-[320px] shrink-0 overflow-hidden"
              >
                <div className="relative aspect-video">
                  <Placeholder nome={[v.slug, v.thumbnail]} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid size-14 place-items-center rounded-full bg-mb-red/90 text-white transition-transform group-hover:scale-110">
                      <Icon name="play" className="size-5 translate-x-0.5" />
                    </span>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-ink-950/90 px-2 py-0.5 font-mono text-[11px] text-white">
                    {v.duracao}
                  </span>
                </div>
                <div className="p-4">
                  <p className="eyebrow text-mb-red">{v.categoria}</p>
                  <h3 className="mt-1.5 font-display text-sm uppercase leading-snug text-white line-clamp-2">
                    {v.titulo}
                  </h3>
                  <p className="mt-2 text-xs text-ink-600">
                    {v.visualizacoes.toLocaleString("pt-PT")} visualizações
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ACESSOS RÁPIDOS ============ */}
      <section className="border-t border-ink-800 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                texto: "Mecânica, passeios, dúvidas — fale com quem já passou por isso.",
              },
              {
                href: "/conta",
                icone: "bell",
                titulo: "Alertas",
                texto: "Siga pilotos e equipas e receba aviso quando houver novidades.",
              },
            ].map((c) => (
              <Link key={c.href} href={c.href} className="group card card-hover p-6">
                <span className="grid size-11 place-items-center bg-mb-red/10 text-mb-red transition-colors group-hover:bg-mb-red group-hover:text-white">
                  <Icon name={c.icone} className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg uppercase text-white">{c.titulo}</h3>
                <p className="mt-2 text-sm text-ink-500 leading-relaxed">{c.texto}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-widest text-mb-red">
                  Aceder
                  <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-1" />
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
