import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, Trophy } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Seccao } from "@/components/painel/blocos";
import { TEMPORADA, classificacaoPilotos } from "@/lib/data";
import {
  corridasDaModalidade, corridasDoCampeonato, eProva, eventosDaModalidade, instante, preencher, principalDe,
  seccoesDaModalidade, type ModalidadeCompleta,
} from "@/lib/desporto";
import type { PaginaDesporto } from "@/lib/conteudo/grupos/desporto";
import { lerCorridas, lerDefinicoes, lerEquipas, lerEventos, lerPilotos } from "@/lib/supabase/publico";
import type { Corrida, Equipa, Evento, Piloto } from "@/lib/types";
import { LinhaEvento } from "@/app/calendario/ListaEventos";
import { SubNavDesporto } from "../SubNavDesporto";
import { Campeonato } from "../Campeonato";
import { lerModalidades, lerPaginaDesporto } from "../dados";
import {
  FilaPilotos, HeroModalidade, NotaMotobox, ProximaProva, TituloBloco, UltimosResultados, Vazio, Voltar,
} from "../Partes";
import { GuiaModalidade, IndicePagina, seccoesGuia } from "../Guia";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// As modalidades editam-se no painel (Modalidades): uma criada depois do build
// gera-se no primeiro pedido (`dynamicParams` no valor por omissão, `true`);
// um endereço que não é de nenhuma modalidade dá 404.
export async function generateStaticParams() {
  return (await lerModalidades()).map((m) => ({ modalidade: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modalidade: string }>;
}): Promise<Metadata> {
  const { modalidade } = await params;
  const [lista, t] = await Promise.all([lerModalidades(), lerPaginaDesporto()]);
  const m = lista.find((x) => x.slug === modalidade);
  if (!m) return { title: "Desporto" };
  return {
    title: `${m.nome} · Desporto`,
    description: [m.descricao, t.modalidade.pesquisaSufixo].filter(Boolean).join(" "),
  };
}

export default async function ModalidadePage({ params }: { params: Promise<{ modalidade: string }> }) {
  const { modalidade } = await params;
  const [lista, t] = await Promise.all([lerModalidades(), lerPaginaDesporto()]);
  const m = lista.find((x) => x.slug === modalidade);
  if (!m) notFound();

  const [eventos, corridas, pilotos, equipas, { bilheteiraAberta }] = await Promise.all([
    lerEventos(), lerCorridas(), lerPilotos(), lerEquipas(), lerDefinicoes(),
  ]);
  const dados = { m, c: m.guia, t, eventos, corridas, pilotos, equipas, bilheteiraAberta };

  if (m.slug === principalDe(lista)?.slug) {
    return <PaginaMotocross {...dados} />;
  }
  return <PaginaModalidade {...dados} />;
}

type Dados = {
  m: ModalidadeCompleta; c: ModalidadeCompleta["guia"]; t: PaginaDesporto;
  eventos: Evento[]; corridas: Corrida[]; pilotos: Piloto[]; equipas: Equipa[];
  /** Interruptor "Bilheteira aberta" das Definições. */
  bilheteiraAberta: boolean;
};

/* ---------------- Motocross: o Campeonato Nacional e o guia ---------------- */

function PaginaMotocross({ m, c, t, eventos, corridas: todas, pilotos, equipas, bilheteiraAberta }: Dados) {
  const provas = eventosDaModalidade(m, eventos);
  // Só as corridas do Campeonato Nacional: as de fora (velocidade, karting...) ficam nas suas modalidades.
  const corridas = corridasDoCampeonato(todas);
  const indice = [
    { id: "campeonato", nome: t.modalidade.indiceCampeonato },
    { id: "calendario", nome: t.modalidade.indiceCalendario },
    ...seccoesGuia(c, t.guia),
  ];
  const valores = { ano: TEMPORADA, campeonato: t.campeonato.nome, modalidade: m.nome };

  return (
    <>
      <SubNavDesporto modalidade={m.slug} nome={m.nome} principal />
      <PaginaInterior icone={<Trophy />}>
        <HeroModalidade
          m={m}
          eyebrow={preencher(t.modalidade.sobretituloPrincipal, valores)}
          notaFoto={t.modalidade.notaFoto}
          numeros={[
            { valor: provas.length, label: "Provas" },
            { valor: corridas.length, label: "Corridas disputadas" },
            { valor: pilotos.length, label: "Pilotos" },
            { valor: equipas.filter((e) => e.tipo === "Equipa").length, label: "Equipas" },
          ]}
        >
          <IndicePagina indice={indice} rotulo={t.guia.nestaPagina} />
        </HeroModalidade>

        <Campeonato provas={provas} corridas={corridas} pilotos={pilotos} equipas={equipas} bilheteiraAberta={bilheteiraAberta} textos={t} />

        <GuiaModalidade
          c={c}
          indice={indice}
          textos={t.guia}
          verificadoEm={t.campeonato.verificadoEm}
          nota={<NotaMotobox provas={provas.length} ancora="campeonato" textos={t.modalidade.naMotobox} />}
          cabecalho={<CabecalhoGuia m={m} t={t} />}
        />
        <VoltarDesporto t={t} />
      </PaginaInterior>
    </>
  );
}

/* ---------------- As outras: guia completo, e a competição quando a há ---------------- */

function PaginaModalidade({ m, c, t, eventos, corridas, pilotos, equipas, bilheteiraAberta }: Dados) {
  const agora = instante();
  const provas = eventosDaModalidade(m, eventos).filter((e) => eProva(e.disciplina));
  const proxima = provas.find((e) => new Date(e.dataInicio).getTime() > agora);
  // Mais recentes primeiro.
  const resultados = corridasDaModalidade(m, eventos, corridas).reverse();
  const seus = classificacaoPilotos(pilotos).filter((p) => m.categorias.includes(p.categoria));
  const cores = new Map(equipas.map((e) => [e.slug, e.cor]));
  const comProvas = provas.length > 0;
  const guia = seccoesGuia(c, t.guia);
  const indice = comProvas ? [{ id: "provas", nome: t.modalidade.indiceProvas }, ...guia] : guia;
  const porDisputar = provas.filter((e) => new Date(e.dataInicio).getTime() > agora).length;
  const provincias = new Set(provas.map((e) => e.provincia)).size;
  const valores = {
    ano: TEMPORADA, campeonato: t.campeonato.nome, modalidade: m.nome, categorias: m.categorias.join(", "),
  };
  const tm = t.modalidade;

  return (
    <>
      <SubNavDesporto modalidade={m.slug} nome={m.nome} principal={false} seccoes={seccoesDaModalidade(m.slug, resultados.length > 0)} />
      <PaginaInterior icone={<Trophy />}>
        {comProvas ? (
          <HeroModalidade
            m={m}
            eyebrow={preencher(tm.sobretituloCompeticao, valores)}
            notaFoto={tm.notaFoto}
            numeros={[
              { valor: provas.length, label: provas.length === 1 ? "Prova" : "Provas" },
              { valor: porDisputar, label: "Por disputar" },
              { valor: resultados.length, label: resultados.length === 1 ? "Corrida disputada" : "Corridas disputadas" },
              { valor: provincias, label: provincias === 1 ? "Província" : "Províncias" },
            ]}
          >
            <IndicePagina indice={indice} rotulo={t.guia.nestaPagina} />
          </HeroModalidade>
        ) : (
          <HeroModalidade m={m} eyebrow={preencher(tm.sobretituloSemProvas, valores)} notaFoto={tm.notaFoto} numeros={c.numeros} conteudo>
            <IndicePagina indice={indice} rotulo={t.guia.nestaPagina} />
          </HeroModalidade>
        )}

        {comProvas && (
          <>
            {proxima && (
              <Seccao className="!pt-0">
                <ProximaProva e={proxima} bilheteiraAberta={bilheteiraAberta} textos={t.proximaProva} />
              </Seccao>
            )}

            <Seccao id="provas" className="!pt-0 !scroll-mt-28">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:gap-x-16">
                <div>
                  <TituloBloco
                    sobretitulo={preencher(tm.provas.sobretitulo, valores)}
                    titulo={tm.provas.titulo}
                    accao={{ href: "/calendario", texto: tm.provas.ligacao }}
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
                    sobretitulo={preencher(tm.resultados.sobretitulo, valores)}
                    titulo={tm.resultados.titulo}
                    accao={resultados.length > 0 ? { href: `/desporto/${m.slug}/resultados`, texto: tm.resultados.ligacao } : undefined}
                  />
                  <div className="mt-8">
                    {resultados.length === 0 ? (
                      <Vazio titulo={tm.resultados.vazioTitulo} texto={tm.resultados.vazioTexto} />
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
                  sobretitulo={preencher(tm.pilotos.sobretitulo, valores)}
                  titulo={tm.pilotos.titulo}
                  accao={{ href: "/pilotos", texto: tm.pilotos.ligacao }}
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
          textos={t.guia}
          verificadoEm={t.campeonato.verificadoEm}
          nota={<NotaMotobox provas={provas.length} textos={tm.naMotobox} />}
          cabecalho={comProvas ? <CabecalhoGuia m={m} t={t} /> : undefined}
        />
        <VoltarDesporto t={t} />
      </PaginaInterior>
    </>
  );
}

/* ---------------- Peças ---------------- */

/** Passagem da competição (dados da MotoBox) para o guia (texto com fontes). */
function CabecalhoGuia({ m, t }: { m: ModalidadeCompleta; t: PaginaDesporto }) {
  return (
    <TituloBloco
      grande
      icone={<BookOpen />}
      sobretitulo={m.nome}
      titulo={t.modalidade.guiaTitulo}
      texto={t.modalidade.guiaTexto}
    />
  );
}

function VoltarDesporto({ t }: { t: PaginaDesporto }) {
  return (
    <Seccao className="!pt-0">
      <Voltar href="/desporto">{t.modalidade.voltar}</Voltar>
    </Seccao>
  );
}
