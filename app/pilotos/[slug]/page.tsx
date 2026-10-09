import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, Gauge, History, ListOrdered, Shield, Trophy, UserRound } from "lucide-react";
import { Retrato } from "@/components/Brand";
import { Icon } from "@/components/ui";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Numeros, Seccao } from "@/components/painel/blocos";
import { Seta } from "@/components/painel/kit";
import { classificacaoPilotos } from "@/lib/data";
import { retratoDe } from "@/lib/desporto";
import { diaMes } from "@/lib/motobox";
import { lerCorridas, lerEquipa, lerPiloto, lerPilotos } from "@/lib/supabase/publico";
import { EmblemaEquipa, Ficha, LigacaoSeta, Posicao, iniciais } from "@/app/calendario/pecas";
import { preencher } from "@/lib/conteudo/grupos/geral";
import { lerTemporada, lerTextosPilotos } from "@/lib/conteudo/ler-geral";
import { comValores } from "@/lib/textos";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Pilotos criados depois do build são gerados no primeiro pedido
// (`dynamicParams` fica no valor por omissão, `true`).
export async function generateStaticParams() {
  const pilotos = await lerPilotos();
  return pilotos.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [p, { piloto: t }] = await Promise.all([lerPiloto(slug), lerTextosPilotos()]);
  if (!p) return { title: t.naoEncontrado };
  const valores = {
    nome: p.nome, numero: p.numero, categoria: p.categoria, equipa: p.equipa,
    vitorias: p.estatisticas.vitorias, podios: p.estatisticas.podios,
  };
  return { title: preencher(t.pesquisaTitulo, valores), description: preencher(t.pesquisaDescricao, valores) };
}

export default async function PilotoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const piloto = await lerPiloto(slug);
  if (!piloto) notFound();

  const [pilotos, corridas, equipa, textos, temporada] = await Promise.all([
    lerPilotos(), lerCorridas(), lerEquipa(piloto.equipaSlug), lerTextosPilotos(), lerTemporada(),
  ]);
  const t = textos.piloto;
  const classificacao = classificacaoPilotos(pilotos);
  const posicao = classificacao.find((p) => p.slug === piloto.slug)?.posicao ?? 0;
  const lider = classificacao[0];

  const historico = corridas
    .map((c) => ({ corrida: c, resultado: c.resultados.find((r) => r.pilotoSlug === piloto.slug) }))
    .filter((x): x is { corrida: (typeof corridas)[0]; resultado: NonNullable<typeof x.resultado> } => Boolean(x.resultado))
    .reverse();

  const colegas = pilotos.filter((p) => p.equipaSlug === piloto.equipaSlug && p.slug !== piloto.slug);
  const taxaPodio = piloto.estatisticas.corridas
    ? Math.round((piloto.estatisticas.podios / piloto.estatisticas.corridas) * 100)
    : 0;
  const redes = [
    piloto.redes.instagram && { nome: "Instagram", icone: "instagram", url: piloto.redes.instagram },
    piloto.redes.facebook && { nome: "Facebook", icone: "facebook", url: piloto.redes.facebook },
  ].filter((r): r is { nome: string; icone: string; url: string } => Boolean(r));

  return (
    <PaginaInterior icone={<UserRound />}>
      <Abertura
        foto={retratoDe(piloto)}
        posicaoFoto="center 30%"
        sobretitulo={`${piloto.categoria} · #${piloto.numero} · ${piloto.equipa}`}
        titulo={piloto.nome}
        texto={piloto.apelido ? `“${piloto.apelido}”` : undefined}
      >
        <div className="flex flex-wrap items-center gap-3">
          {piloto.campeonatos > 0 && (
            <span className="inline-flex h-12 items-center gap-2.5 rounded-[var(--raio)] bg-mb-red px-4 text-sm">
              <Trophy className="size-4" aria-hidden />
              {preencher(t.campeao, { n: piloto.campeonatos })}
            </span>
          )}
          {redes.map((r) => (
            <a
              key={r.nome}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2.5 rounded-[var(--raio)] bg-black/65 px-4 text-sm text-white transition-colors hover:bg-mb-red"
            >
              <Icon name={r.icone} className="size-4" />
              {r.nome}
            </a>
          ))}
        </div>
      </Abertura>

      <Seccao>
        <Numeros
          colunas={3}
          itens={[
            { valor: posicao > 0 ? `${posicao}.º` : t.numeros.naoClassificado, texto: t.numeros.posicao },
            { valor: piloto.estatisticas.pontos, texto: t.numeros.pontos },
            { valor: piloto.estatisticas.vitorias, texto: t.numeros.vitorias },
            { valor: piloto.estatisticas.podios, texto: t.numeros.podios },
            { valor: piloto.estatisticas.poles, texto: t.numeros.poles },
            { valor: piloto.estatisticas.corridas, texto: t.numeros.corridas },
          ].map((n) => ({ ...n, valor: <span className="tabular-nums">{n.valor}</span> }))}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <Retrato
                nome={retratoDe(piloto)}
                pessoa={piloto.nome}
                iniciais={iniciais(piloto.nome)}
                cor={equipa?.cor}
                className="size-16 shrink-0 rounded-[var(--raio)] [container-type:size]"
                largura={200}
                tamanhos="64px"
              />
              <div>
                <p className="text-sm text-white/80">{t.perfil}</p>
                <h2 className="titulo-4 mt-1">{piloto.nome}</h2>
              </div>
            </div>
            <div className="prosa mt-8 max-w-[62ch]">
              <p>{piloto.bio}</p>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-[var(--intervalo)] sm:grid-cols-4">
              {(
                [
                  ["equipa", t.dados.equipa, piloto.equipa],
                  ["provincia", t.dados.provincia, piloto.provincia],
                  ["idade", t.dados.idade, preencher(t.dados.idadeValor, { n: piloto.idade })],
                  ["mota", piloto.categoria === "Karting" ? t.dados.kart : t.dados.mota, piloto.mota],
                ] as const
              ).map(([id, k, v]) => (
                <div key={id} className="flex flex-col-reverse rounded-[var(--raio)] bg-white/5 p-4">
                  <dt className="mt-1 text-xs text-white/75">{k}</dt>
                  <dd className="text-[15px] font-medium leading-snug">{v}</dd>
                </div>
              ))}
            </dl>

            {/* Histórico */}
            {historico.length > 0 && (
              <div className="mt-14">
                <h2 className="flex items-center gap-3 titulo-3">
                  {t.historico.titulo}
                  <History className="size-6 text-mb-red-light" aria-hidden />
                </h2>
                <div aria-hidden className="mt-8 hidden items-end gap-x-4 px-4 pb-3 text-xs text-white/75 sm:grid sm:grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_2.5rem_3rem]">
                  <span>{t.historico.prova}</span>
                  <span>{t.historico.data}</span>
                  <span>{t.historico.categoria}</span>
                  <span>{t.historico.pos}</span>
                  <span className="text-right">{t.historico.pts}</span>
                </div>
                <ol className="mt-4 grid gap-[var(--intervalo)] sm:mt-0">
                  {historico.map(({ corrida, resultado }) => {
                    const d = diaMes(corrida.data);
                    return (
                      <li key={corrida.slug}>
                        <Link
                          href={`/resultados/${corrida.slug}`}
                          className="painel painel-escuro group grid grid-cols-[minmax(0,1fr)_2rem_2.5rem] items-center gap-x-3 px-3 py-3 transition-colors hover:bg-white/5 sm:grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_2.5rem_3rem] sm:gap-x-4 sm:px-4"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium transition-colors group-hover:text-mb-red-light">{corrida.nome}</span>
                            <span className="block truncate text-xs text-white/75">
                              {corrida.circuito}
                              <span className="sm:hidden">
                                {" "}
                                · {d.dia} {d.mes} · {corrida.categoria}
                              </span>
                              {resultado.estado && <> · {resultado.estado}</>}
                            </span>
                          </span>
                          <span className="hidden text-sm tabular-nums text-white/70 sm:block">
                            {d.dia} {d.mes} {corrida.data.slice(2, 4)}
                          </span>
                          <span className="hidden truncate text-sm text-white/70 sm:block">{corrida.categoria}</span>
                          <Posicao posicao={resultado.posicao} />
                          <span className="text-right font-semibold tabular-nums">
                            {resultado.pontos}
                            <span className="sr-only"> pontos</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>

          {/* Barra lateral */}
          <aside className="space-y-[var(--intervalo)] self-start">
            {/* Campeonato */}
            <Ficha titulo={t.campeonato.titulo} icone={<ListOrdered />}>
              <div className="mt-4 flex items-center gap-4">
                <Posicao posicao={posicao} className="size-14 text-2xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-semibold tabular-nums">
                    {piloto.estatisticas.pontos} <span className="text-sm font-normal text-white/75">{t.campeonato.pts}</span>
                  </p>
                  {lider && posicao > 1 && (
                    <p className="text-sm text-white/75">
                      {comValores(t.campeonato.doLider, {
                        n: <span className="tabular-nums">{lider.estatisticas.pontos - piloto.estatisticas.pontos}</span>,
                      })}
                    </p>
                  )}
                  {posicao === 1 && <p className="text-sm text-mb-red-light">{t.campeonato.lider}</p>}
                </div>
              </div>
              <div aria-hidden className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-mb-red"
                  style={{
                    width: `${lider?.estatisticas.pontos ? (piloto.estatisticas.pontos / lider.estatisticas.pontos) * 100 : 0}%`,
                  }}
                />
              </div>
              <LigacaoSeta href="/classificacao" className="mt-5">
                {t.campeonato.ligacao}
              </LigacaoSeta>
            </Ficha>

            {/* Números */}
            <Ficha
              titulo={t.carreira.titulo}
              icone={<Gauge />}
              linhas={[
                [t.carreira.estreia, String(piloto.estreia)],
                // Contadas até à temporada em curso (Definições), e não até ao ano do relógio.
                [t.carreira.temporadas, String(Math.max(1, temporada - piloto.estreia + 1))],
                [t.carreira.melhor, piloto.estatisticas.melhorResultado],
                [t.carreira.taxa, `${taxaPodio}%`],
                [t.carreira.titulos, String(piloto.campeonatos)],
                [t.carreira.nacionalidade, piloto.nacionalidade],
              ]}
            />

            {/* Equipa */}
            {equipa && (
              <Ficha titulo={t.equipa.titulo} icone={<Shield />}>
                <Link href={`/equipas/${equipa.slug}`} className="group mt-4 flex items-center gap-3">
                  <EmblemaEquipa logo={equipa.logo} cor={equipa.cor} className="size-12 text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium transition-colors group-hover:text-mb-red-light">{equipa.nome}</span>
                    <span className="block truncate text-sm text-white/75">{equipa.base}</span>
                  </span>
                  <Seta className="size-3.5" />
                </Link>

                {colegas.length > 0 && (
                  <>
                    <p className="mb-3 mt-6 text-sm text-white/75">{t.equipa.colegas}</p>
                    <ul className="space-y-[var(--intervalo)]">
                      {colegas.map((c) => (
                        <li key={c.slug}>
                          <Link href={`/pilotos/${c.slug}`} className="group flex items-center gap-3 rounded-[var(--raio)] bg-white/5 p-[var(--intervalo)] pr-3 transition-colors hover:bg-white/10">
                            <Retrato
                              nome={retratoDe(c)}
                              pessoa={c.nome}
                              iniciais={iniciais(c.nome)}
                              className="size-9 shrink-0 rounded-[4px] [container-type:size]"
                              largura={120}
                              tamanhos="36px"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm">{c.nome}</span>
                            <span className="text-sm tabular-nums text-white/75">{c.estatisticas.pontos} {t.equipa.pts}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Ficha>
            )}

            {/* Seguir */}
            {t.seguir.mostrar && (
              <Ficha titulo={t.seguir.titulo} icone={<Bell />}>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  {preencher(t.seguir.texto, { nome: piloto.nome.split(" ")[0] })}
                </p>
                {t.seguir.botao && (
                  <BotaoMB href={t.seguir.ligacao || "/conta"} className="mt-5 !max-w-none">
                    {t.seguir.botao}
                  </BotaoMB>
                )}
              </Ficha>
            )}
          </aside>
        </div>
      </Seccao>
    </PaginaInterior>
  );
}
