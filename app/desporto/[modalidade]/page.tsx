import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, EmptyState, Icon, PageHero, PosicaoBadge, SectionHead } from "@/components/ui";
import { Retrato } from "@/components/Brand";
import { TEMPORADA, classificacaoEquipas, classificacaoPilotos } from "@/lib/data";
import {
  MODALIDADES, MODALIDADE_PRINCIPAL, eProva, estadoModalidade, eventosDaModalidade, instante, lerModalidade,
  type Modalidade,
} from "@/lib/desporto";
import { lerCorridas, lerEquipas, lerEventos, lerPilotos } from "@/lib/supabase/publico";
import type { Corrida, Equipa, Evento, Piloto } from "@/lib/types";
import { LinhaEvento } from "@/app/calendario/ListaEventos";
import { SubNavDesporto } from "../SubNavDesporto";
import { FilaPilotos, HeroModalidade, ProximaProva, UltimosResultados, iniciais } from "../Partes";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// A lista de modalidades vive no código (lib/desporto.ts): outra URL é 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return MODALIDADES.map((m) => ({ modalidade: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modalidade: string }>;
}): Promise<Metadata> {
  const { modalidade } = await params;
  const m = lerModalidade(modalidade);
  if (!m) return { title: "Desporto" };
  return { title: `${m.nome} · Desporto`, description: m.descricao };
}

export default async function ModalidadePage({ params }: { params: Promise<{ modalidade: string }> }) {
  const { modalidade } = await params;
  const m = lerModalidade(modalidade);
  if (!m) notFound();

  const [eventos, corridas, pilotos, equipas] = await Promise.all([
    lerEventos(), lerCorridas(), lerPilotos(), lerEquipas(),
  ]);

  if (m.slug === MODALIDADE_PRINCIPAL) {
    return <PaginaMotocross m={m} eventos={eventos} corridas={corridas} pilotos={pilotos} equipas={equipas} />;
  }
  if (estadoModalidade(m, eventos) === "activo") {
    return <PaginaModalidade m={m} eventos={eventos} corridas={corridas} pilotos={pilotos} equipas={equipas} />;
  }
  return <PaginaEmBreve m={m} />;
}

type Dados = { m: Modalidade; eventos: Evento[]; corridas: Corrida[]; pilotos: Piloto[]; equipas: Equipa[] };

/* ---------------- Motocross: a casa de tudo o que já existia ---------------- */

function PaginaMotocross({ m, eventos, corridas, pilotos, equipas }: Dados) {
  const agora = instante();
  const provas = eventosDaModalidade(m, eventos);
  const proxima = provas.find((e) => new Date(e.dataInicio).getTime() > agora);
  const classificacao = classificacaoPilotos(pilotos);
  const topPilotos = classificacao.slice(0, 5);
  const topEquipas = classificacaoEquipas(equipas.filter((e) => e.tipo === "Equipa")).slice(0, 6);
  const cores = new Map(equipas.map((e) => [e.slug, e.cor]));
  // Mais recentes primeiro: a lista vem por data crescente.
  const ultimas = [...corridas].reverse().slice(0, 2);

  return (
    <>
      <SubNavDesporto modalidade={m.slug} />
      <HeroModalidade
        m={m}
        eyebrow={`Campeonato Nacional ${TEMPORADA}`}
        numeros={[
          { valor: provas.length, label: "Provas" },
          { valor: corridas.length, label: "Corridas disputadas" },
          { valor: pilotos.length, label: "Pilotos" },
          { valor: equipas.filter((e) => e.tipo === "Equipa").length, label: "Equipas" },
        ]}
      />

      {proxima && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-4">
          <ProximaProva e={proxima} />
        </section>
      )}

      {/* ============ CLASSIFICAÇÃO + RESULTADOS ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 gap-x-14 gap-y-14 lg:grid-cols-[1.25fr_1fr]">
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
                    <Link href={`/pilotos/${p.slug}`} className="group flex items-center gap-4 py-3.5">
                      <PosicaoBadge posicao={p.posicao} />
                      <span
                        className="h-10 w-1 shrink-0 rounded-full bg-ink-700"
                        style={{ background: cores.get(p.equipaSlug) }}
                        aria-hidden
                      />
                      <Retrato nome={p.slug} iniciais={iniciais(p.nome)} className="size-11 shrink-0 rounded-full" tamanhos="44px" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg uppercase leading-tight text-white truncate transition-colors group-hover:text-mb-red">
                          {p.nome}
                        </p>
                        <p className="text-xs text-ink-500 truncate">{p.equipa} · {p.categoria}</p>
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
          </div>

          <div>
            <SectionHead eyebrow="Arquivo" titulo="Últimos resultados" acao={{ href: "/resultados", texto: "Arquivo" }} />
            <div className="mt-7">
              {ultimas.length === 0 ? (
                <EmptyState
                  titulo="Sem resultados publicados"
                  descricao="Os resultados aparecem aqui assim que a primeira corrida da temporada terminar."
                />
              ) : (
                <UltimosResultados corridas={ultimas} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CALENDÁRIO ============ */}
      <section className="bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <SectionHead
            eyebrow={`Temporada ${TEMPORADA}`}
            titulo="Calendário"
            acao={{ href: "/calendario", texto: "Todas as provas" }}
          />
          {provas.length === 0 ? (
            <div className="mt-7">
              <EmptyState titulo="Sem provas agendadas" descricao="As próximas provas aparecem aqui assim que forem anunciadas." />
            </div>
          ) : (
            <ol className="mt-4">
              {provas.map((e) => (
                <LinhaEvento key={e.slug} e={e} agora={agora} />
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ============ PILOTOS ============ */}
      {classificacao.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <SectionHead eyebrow="Grelha" titulo="Pilotos" acao={{ href: "/pilotos", texto: "Todos os pilotos" }} />
          <div className="mt-8">
            <FilaPilotos pilotos={classificacao.slice(0, 8)} cores={cores} />
          </div>
        </section>
      )}

      {/* ============ EQUIPAS ============ */}
      {topEquipas.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
          <SectionHead eyebrow="Estruturas" titulo="Equipas" acao={{ href: "/equipas", texto: "Todas as equipas" }} />
          <div className="mt-7 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {topEquipas.map((e) => (
              <Link
                key={e.slug}
                href={`/equipas/${e.slug}`}
                className="group flex items-center gap-4 border-b border-white/6 py-4"
              >
                <span className="font-display text-xl text-ink-500 tabular-nums w-5">{e.posicao}</span>
                <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: e.cor }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
                    {e.nome}
                  </span>
                  <span className="block truncate text-xs text-ink-500">{e.base}, {e.provincia}</span>
                </span>
                <span className="font-display text-lg text-white tabular-nums">
                  {e.estatisticas.pontos}
                  <span className="ml-1 text-xs text-ink-500">PTS</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ---------------- Enduro, Rally-Raid (e o que acender com provas) ---------------- */

function PaginaModalidade({ m, eventos, corridas, pilotos, equipas }: Dados) {
  const agora = instante();
  const provas = eventosDaModalidade(m, eventos).filter((e) => eProva(e.disciplina));
  const slugs = new Set(provas.map((e) => e.slug));
  const proxima = provas.find((e) => new Date(e.dataInicio).getTime() > agora);
  const resultados = corridas.filter((c) => slugs.has(c.eventoSlug)).reverse();
  const seus = classificacaoPilotos(pilotos).filter((p) => m.categorias.includes(p.categoria));
  const cores = new Map(equipas.map((e) => [e.slug, e.cor]));

  return (
    <>
      <SubNavDesporto modalidade={m.slug} />
      <HeroModalidade
        m={m}
        eyebrow="Desporto"
        numeros={[
          { valor: provas.length, label: "Provas" },
          { valor: provas.filter((e) => new Date(e.dataInicio).getTime() > agora).length, label: "Por disputar" },
          { valor: new Set(provas.map((e) => e.provincia)).size, label: "Províncias" },
        ]}
      />

      {proxima && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-4">
          <ProximaProva e={proxima} />
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 gap-x-14 gap-y-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHead eyebrow={`Temporada ${TEMPORADA}`} titulo="Provas" acao={{ href: "/calendario", texto: "Calendário" }} />
            <ol className="mt-4">
              {provas.map((e) => (
                <LinhaEvento key={e.slug} e={e} agora={agora} />
              ))}
            </ol>
          </div>
          <div>
            <SectionHead eyebrow="Arquivo" titulo="Resultados" />
            <div className="mt-7">
              {resultados.length === 0 ? (
                <EmptyState
                  titulo="Sem resultados publicados"
                  descricao="Os resultados aparecem aqui assim que a primeira corrida da temporada terminar."
                />
              ) : (
                <UltimosResultados corridas={resultados.slice(0, 3)} />
              )}
            </div>
          </div>
        </div>
      </section>

      {seus.length > 0 && (
        <section className="bg-ink-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
            <SectionHead
              eyebrow={`Categoria ${m.categorias.join(", ")}`}
              titulo="Pilotos"
              acao={{ href: "/pilotos", texto: "Todos os pilotos" }}
            />
            <div className="mt-8">
              <FilaPilotos pilotos={seus} cores={cores} />
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <Link href="/desporto" className="group inline-flex items-center gap-2 font-ui text-base text-ink-300 transition-colors hover:text-white">
          <span aria-hidden>←</span> Todos os desportos
        </Link>
      </div>
    </>
  );
}

/* ---------------- Modalidades anunciadas, ainda sem provas ---------------- */

function PaginaEmBreve({ m }: { m: Modalidade }) {
  return (
    <>
      <SubNavDesporto modalidade={m.slug} />
      <PageHero eyebrow="Em breve" titulo={m.nome} descricao={m.descricao}>
        <p className="max-w-2xl text-sm text-ink-400 leading-relaxed">
          Ainda não há provas desta modalidade no calendário da Motobox. Quando houver, o calendário, os resultados e
          os pilotos aparecem aqui.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink href="/desporto" variant="light">
            Todos os desportos
          </ButtonLink>
          <ButtonLink href="/contacto" variant="outline">
            <Icon name="mail" className="size-4" />
            Organiza provas? Fale connosco
          </ButtonLink>
        </div>
      </PageHero>
    </>
  );
}
