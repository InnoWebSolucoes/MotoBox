import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, Trophy } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Seccao } from "@/components/painel/blocos";
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
import {
  FilaPilotos, HeroModalidade, NotaMotobox, ProximaProva, TituloBloco, UltimosResultados, Vazio, Voltar,
} from "../Partes";
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
      <PaginaInterior icone={<Trophy />}>
        <HeroModalidade
          m={m}
          eyebrow={`Campeonato Nacional ${TEMPORADA}`}
          numeros={[
            { valor: provas.length, label: "Provas" },
            { valor: corridas.length, label: "Corridas disputadas" },
            { valor: pilotos.length, label: "Pilotos" },
            { valor: equipas.filter((e) => e.tipo === "Equipa").length, label: "Equipas" },
          ]}
        >
          <IndicePagina indice={indice} />
        </HeroModalidade>

        <Campeonato provas={provas} corridas={corridas} pilotos={pilotos} equipas={equipas} bilheteiraAberta={bilheteiraAberta} />

        <GuiaModalidade
          c={c}
          indice={indice}
          nota={<NotaMotobox provas={provas.length} ancora="campeonato" />}
          cabecalho={<CabecalhoGuia m={m} />}
        />
        <VoltarDesporto />
      </PaginaInterior>
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
      <PaginaInterior icone={<Trophy />}>
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
          >
            <IndicePagina indice={indice} />
          </HeroModalidade>
        ) : (
          <HeroModalidade m={m} eyebrow="Desporto · Outras modalidades" numeros={c.numeros} conteudo>
            <IndicePagina indice={indice} />
          </HeroModalidade>
        )}

        {comProvas && (
          <>
            {proxima && (
              <Seccao className="!pt-0">
                <ProximaProva e={proxima} bilheteiraAberta={bilheteiraAberta} />
              </Seccao>
            )}

            <Seccao id="provas" className="!pt-0 !scroll-mt-28">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:gap-x-16">
                <div>
                  <TituloBloco
                    sobretitulo={`Temporada ${TEMPORADA}`}
                    titulo="Provas"
                    accao={{ href: "/calendario", texto: "Calendário" }}
                  />
                  {/* As linhas são do calendário e trazem o seu intervalo. */}
                  <ol className="mt-8">
                    {provas.map((e) => (
                      <LinhaEvento key={e.slug} e={e} agora={agora} bilheteiraAberta={bilheteiraAberta} />
                    ))}
                  </ol>
                </div>
                <div>
                  <TituloBloco
                    sobretitulo="Arquivo"
                    titulo="Resultados"
                    accao={resultados.length > 0 ? { href: `/desporto/${m.slug}/resultados`, texto: "Arquivo" } : undefined}
                  />
                  <div className="mt-8">
                    {resultados.length === 0 ? (
                      <Vazio
                        titulo="Sem resultados publicados"
                        texto="Os resultados aparecem aqui assim que a primeira corrida da temporada terminar."
                      />
                    ) : (
                      <UltimosResultados corridas={resultados.slice(0, 3)} />
                    )}
                  </div>
                </div>
              </div>
            </Seccao>

            {seus.length > 0 && (
              <Seccao className="!pt-0">
                <TituloBloco
                  sobretitulo={`Categoria ${m.categorias.join(", ")}`}
                  titulo="Pilotos"
                  accao={{ href: "/pilotos", texto: "Todos os pilotos" }}
                />
                <div className="mt-8">
                  <FilaPilotos pilotos={seus} cores={cores} />
                </div>
              </Seccao>
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
      </PaginaInterior>
    </>
  );
}

/* ---------------- Peças ---------------- */

/** Passagem da competição (dados da MotoBox) para o guia (texto com fontes). */
function CabecalhoGuia({ m }: { m: Modalidade }) {
  return (
    <TituloBloco
      grande
      icone={<BookOpen />}
      sobretitulo={m.nome}
      titulo="Conhecer a modalidade"
      texto="O que é, as classes, a cena em Angola, os campeonatos de referência e como começar. Com fontes."
    />
  );
}

function VoltarDesporto() {
  return (
    <Seccao className="!pt-0">
      <Voltar href="/desporto">Todos os desportos</Voltar>
    </Seccao>
  );
}
