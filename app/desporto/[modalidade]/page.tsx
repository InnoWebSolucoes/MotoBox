import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, SectionHead } from "@/components/ui";
import { TEMPORADA, classificacaoPilotos } from "@/lib/data";
import {
  MODALIDADES, MODALIDADE_PRINCIPAL, corridasDaModalidade, eProva, eventosDaModalidade, instante, lerModalidade,
  seccoesDaModalidade, type Modalidade,
} from "@/lib/desporto";
import { lerConteudo, type ConteudoPagina } from "@/lib/desporto-conteudo";
import { lerCorridas, lerDefinicoes, lerEquipas, lerEventos, lerPilotos } from "@/lib/supabase/publico";
import type { Corrida, Equipa, Evento, Piloto } from "@/lib/types";
import { LinhaEvento } from "@/app/calendario/ListaEventos";
import { SubNavDesporto } from "../SubNavDesporto";
import { Campeonato } from "../Campeonato";
import { FilaPilotos, HeroModalidade, NotaMotobox, ProximaProva, UltimosResultados } from "../Partes";
import { GuiaModalidade, IndicePagina, SECCOES_GUIA } from "../Guia";

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
  return {
    title: `${m.nome} · Desporto`,
    description: `${m.descricao} O que é, classes, a cena em Angola, os campeonatos de referência e como começar.`,
  };
}

export default async function ModalidadePage({ params }: { params: Promise<{ modalidade: string }> }) {
  const { modalidade } = await params;
  const m = lerModalidade(modalidade);
  const c = lerConteudo(modalidade);
  if (!m || !c) notFound();

  const [eventos, corridas, pilotos, equipas, { bilheteiraAberta }] = await Promise.all([
    lerEventos(), lerCorridas(), lerPilotos(), lerEquipas(), lerDefinicoes(),
  ]);
  const dados = { m, c, eventos, corridas, pilotos, equipas, bilheteiraAberta };

  if (m.slug === MODALIDADE_PRINCIPAL) {
    return <PaginaMotocross {...dados} />;
  }
  return <PaginaModalidade {...dados} />;
}

type Dados = {
  m: Modalidade; c: ConteudoPagina;
  eventos: Evento[]; corridas: Corrida[]; pilotos: Piloto[]; equipas: Equipa[];
  /** Interruptor "Bilheteira aberta" das Definições. */
  bilheteiraAberta: boolean;
};

/* ---------------- Motocross: o Campeonato Nacional e o guia ---------------- */

function PaginaMotocross({ m, c, eventos, corridas, pilotos, equipas, bilheteiraAberta }: Dados) {
  const provas = eventosDaModalidade(m, eventos);
  const indice = [
    { id: "campeonato", nome: "Campeonato" },
    { id: "calendario", nome: "Calendário" },
    ...SECCOES_GUIA,
  ];

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
      <IndicePagina indice={indice} />

      <Campeonato provas={provas} corridas={corridas} pilotos={pilotos} equipas={equipas} bilheteiraAberta={bilheteiraAberta} />

      <GuiaModalidade
        c={c}
        indice={indice}
        nota={<NotaMotobox provas={provas.length} ancora="campeonato" />}
        cabecalho={<CabecalhoGuia m={m} />}
      />
      <VoltarDesporto />
    </>
  );
}

/* ---------------- As outras seis: guia completo, e a competição quando a há ---------------- */

function PaginaModalidade({ m, c, eventos, corridas, pilotos, equipas, bilheteiraAberta }: Dados) {
  const agora = instante();
  const provas = eventosDaModalidade(m, eventos).filter((e) => eProva(e.disciplina));
  const proxima = provas.find((e) => new Date(e.dataInicio).getTime() > agora);
  // Mais recentes primeiro.
  const resultados = corridasDaModalidade(m, eventos, corridas).reverse();
  const seus = classificacaoPilotos(pilotos).filter((p) => m.categorias.includes(p.categoria));
  const cores = new Map(equipas.map((e) => [e.slug, e.cor]));
  const comProvas = provas.length > 0;
  const indice = comProvas ? [{ id: "provas", nome: "Provas" }, ...SECCOES_GUIA] : SECCOES_GUIA;

  return (
    <>
      <SubNavDesporto modalidade={m.slug} seccoes={seccoesDaModalidade(m.slug, resultados.length > 0)} />
      {comProvas ? (
        <HeroModalidade
          m={m}
          eyebrow={`Desporto · Temporada ${TEMPORADA}`}
          numeros={[
            { valor: provas.length, label: "Provas" },
            { valor: provas.filter((e) => new Date(e.dataInicio).getTime() > agora).length, label: "Por disputar" },
            { valor: resultados.length, label: "Corridas disputadas" },
            { valor: new Set(provas.map((e) => e.provincia)).size, label: "Províncias" },
          ]}
        />
      ) : (
        <HeroModalidade m={m} eyebrow="Desporto · Outras modalidades" numeros={c.numeros} conteudo />
      )}
      <IndicePagina indice={indice} />

      {comProvas && (
        <>
          {proxima && (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-4">
              <ProximaProva e={proxima} bilheteiraAberta={bilheteiraAberta} />
            </section>
          )}

          <section id="provas" className="mx-auto max-w-7xl scroll-mt-28 px-4 sm:px-6 py-14">
            <div className="grid grid-cols-1 gap-x-14 gap-y-14 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <SectionHead eyebrow={`Temporada ${TEMPORADA}`} titulo="Provas" acao={{ href: "/calendario", texto: "Calendário" }} />
                <ol className="mt-4">
                  {provas.map((e) => (
                    <LinhaEvento key={e.slug} e={e} agora={agora} bilheteiraAberta={bilheteiraAberta} />
                  ))}
                </ol>
              </div>
              <div>
                <SectionHead
                  eyebrow="Arquivo"
                  titulo="Resultados"
                  acao={resultados.length > 0 ? { href: `/desporto/${m.slug}/resultados`, texto: "Arquivo" } : undefined}
                />
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
        </>
      )}

      <GuiaModalidade
        c={c}
        indice={indice}
        nota={<NotaMotobox provas={provas.length} />}
        cabecalho={comProvas ? <CabecalhoGuia m={m} /> : undefined}
      />
      <VoltarDesporto />
    </>
  );
}

/* ---------------- Peças ---------------- */

/** Passagem da competição (dados da Motobox) para o guia (texto com fontes). */
function CabecalhoGuia({ m }: { m: Modalidade }) {
  return (
    <>
      <p className="eyebrow text-mb-red">{m.nome}</p>
      <h2 className="title-xl mt-2 text-4xl sm:text-5xl">Conhecer a modalidade</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-400">
        O que é, as classes, a cena em Angola, os campeonatos de referência e como começar. Com fontes.
      </p>
    </>
  );
}

function VoltarDesporto() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
      <Link href="/desporto" className="group inline-flex items-center gap-2 font-ui text-base text-ink-300 transition-colors hover:text-white">
        <span aria-hidden>←</span> Todos os desportos
      </Link>
    </div>
  );
}
