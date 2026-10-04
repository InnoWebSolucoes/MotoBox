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
import { diaMes } from "@/lib/motobox";
import { lerCorridas, lerEquipa, lerPiloto, lerPilotos } from "@/lib/supabase/publico";
import { EmblemaEquipa, Ficha, LigacaoSeta, Posicao, iniciais } from "@/app/calendario/pecas";

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
  const p = await lerPiloto(slug);
  if (!p) return { title: "Piloto não encontrado" };
  return {
    title: `${p.nome} #${p.numero}`,
    description: `${p.nome}, piloto ${p.categoria} da ${p.equipa}. ${p.estatisticas.vitorias} vitórias e ${p.estatisticas.podios} pódios no motociclismo angolano.`,
  };
}

export default async function PilotoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const piloto = await lerPiloto(slug);
  if (!piloto) notFound();

  const [pilotos, corridas, equipa] = await Promise.all([lerPilotos(), lerCorridas(), lerEquipa(piloto.equipaSlug)]);
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
        foto={piloto.slug}
        posicaoFoto="center 30%"
        sobretitulo={`${piloto.categoria} · #${piloto.numero} · ${piloto.equipa}`}
        titulo={piloto.nome}
        texto={piloto.apelido ? `“${piloto.apelido}”` : undefined}
      >
        <div className="flex flex-wrap items-center gap-3">
          {piloto.campeonatos > 0 && (
            <span className="inline-flex h-12 items-center gap-2.5 rounded-[var(--raio)] bg-mb-red px-4 text-sm">
              <Trophy className="size-4" aria-hidden />
              {piloto.campeonatos}× Campeão Nacional
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
            { valor: posicao > 0 ? `${posicao}.º` : "NC", texto: "Posição no campeonato" },
            { valor: piloto.estatisticas.pontos, texto: "Pontos" },
            { valor: piloto.estatisticas.vitorias, texto: "Vitórias" },
            { valor: piloto.estatisticas.podios, texto: "Pódios" },
            { valor: piloto.estatisticas.poles, texto: "Poles" },
            { valor: piloto.estatisticas.corridas, texto: "Corridas" },
          ].map((n) => ({ ...n, valor: <span className="tabular-nums">{n.valor}</span> }))}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <Retrato
                nome={piloto.slug}
                iniciais={iniciais(piloto.nome)}
                cor={equipa?.cor}
                className="size-16 shrink-0 rounded-[var(--raio)] [container-type:size]"
                largura={200}
                tamanhos="64px"
              />
              <div>
                <p className="text-sm text-white/60">Perfil</p>
                <h2 className="titulo-4 mt-1">{piloto.nome}</h2>
              </div>
            </div>
            <div className="prosa mt-8 max-w-[62ch]">
              <p>{piloto.bio}</p>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-[var(--intervalo)] sm:grid-cols-4">
              {(
                [
                  ["Equipa", piloto.equipa],
                  ["Província", piloto.provincia],
                  ["Idade", `${piloto.idade} anos`],
                  [piloto.categoria === "Karting" ? "Kart" : "Mota", piloto.mota],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex flex-col-reverse rounded-[var(--raio)] bg-white/5 p-4">
                  <dt className="mt-1 text-xs text-white/55">{k}</dt>
                  <dd className="text-[15px] font-medium leading-snug">{v}</dd>
                </div>
              ))}
            </dl>

            {/* Histórico */}
            {historico.length > 0 && (
              <div className="mt-14">
                <h2 className="flex items-center gap-3 titulo-3">
                  Histórico de corridas
                  <History className="size-6 text-mb-red-light" aria-hidden />
                </h2>
                <div aria-hidden className="mt-8 hidden items-end gap-x-4 px-4 pb-3 text-xs text-white/50 sm:grid sm:grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_2.5rem_3rem]">
                  <span>Prova</span>
                  <span>Data</span>
                  <span>Categoria</span>
                  <span>Pos</span>
                  <span className="text-right">Pts</span>
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
                            <span className="block truncate text-xs text-white/55">
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
            <Ficha titulo="No campeonato" icone={<ListOrdered />}>
              <div className="mt-4 flex items-center gap-4">
                <Posicao posicao={posicao} className="size-14 text-2xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-semibold tabular-nums">
                    {piloto.estatisticas.pontos} <span className="text-sm font-normal text-white/55">pts</span>
                  </p>
                  {lider && posicao > 1 && (
                    <p className="text-sm text-white/55">
                      <span className="tabular-nums">{lider.estatisticas.pontos - piloto.estatisticas.pontos}</span> pontos do líder
                    </p>
                  )}
                  {posicao === 1 && <p className="text-sm text-mb-red-light">Líder do campeonato</p>}
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
                Ver classificação
              </LigacaoSeta>
            </Ficha>

            {/* Números */}
            <Ficha
              titulo="Números da carreira"
              icone={<Gauge />}
              linhas={[
                ["Estreia", String(piloto.estreia)],
                ["Temporadas", String(new Date().getFullYear() - piloto.estreia + 1)],
                ["Melhor resultado", piloto.estatisticas.melhorResultado],
                ["Taxa de pódio", `${taxaPodio}%`],
                ["Títulos nacionais", String(piloto.campeonatos)],
                ["Nacionalidade", piloto.nacionalidade],
              ]}
            />

            {/* Equipa */}
            {equipa && (
              <Ficha titulo="Equipa" icone={<Shield />}>
                <Link href={`/equipas/${equipa.slug}`} className="group mt-4 flex items-center gap-3">
                  <EmblemaEquipa logo={equipa.logo} cor={equipa.cor} className="size-12 text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium transition-colors group-hover:text-mb-red-light">{equipa.nome}</span>
                    <span className="block truncate text-sm text-white/55">{equipa.base}</span>
                  </span>
                  <Seta className="size-3.5" />
                </Link>

                {colegas.length > 0 && (
                  <>
                    <p className="mb-3 mt-6 text-sm text-white/55">Colegas de equipa</p>
                    <ul className="space-y-[var(--intervalo)]">
                      {colegas.map((c) => (
                        <li key={c.slug}>
                          <Link href={`/pilotos/${c.slug}`} className="group flex items-center gap-3 rounded-[var(--raio)] bg-white/5 p-[var(--intervalo)] pr-3 transition-colors hover:bg-white/10">
                            <Retrato
                              nome={c.slug}
                              iniciais={iniciais(c.nome)}
                              className="size-9 shrink-0 rounded-[4px] [container-type:size]"
                              largura={120}
                              tamanhos="36px"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm">{c.nome}</span>
                            <span className="text-sm tabular-nums text-white/55">{c.estatisticas.pontos} pts</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Ficha>
            )}

            {/* Seguir */}
            <Ficha titulo="Seguir este piloto" icone={<Bell />}>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Receba uma notificação sempre que {piloto.nome.split(" ")[0]} corre, pontua ou sobe ao pódio.
              </p>
              <BotaoMB href="/conta" className="mt-5 !max-w-none">
                Seguir
              </BotaoMB>
            </Ficha>
          </aside>
        </div>
      </Seccao>
    </PaginaInterior>
  );
}
