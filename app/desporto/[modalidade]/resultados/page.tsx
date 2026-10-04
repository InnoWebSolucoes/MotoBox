import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Flag, Trophy } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Numeros, Seccao } from "@/components/painel/blocos";
import {
  MODALIDADES, MODALIDADE_PRINCIPAL, corridasDaModalidade, lerModalidade, seccoesDaModalidade,
} from "@/lib/desporto";
import { lerCorridas, lerEventos } from "@/lib/supabase/publico";
import { SubNavDesporto } from "../../SubNavDesporto";
import { ArquivoCorridas, Vazio, Voltar } from "../../Partes";

/* Arquivo de resultados de uma modalidade que não é a principal (Enduro,
   Rally-Raid e as que vierem a ter provas). O Motocross tem o seu em /resultados. */

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const dynamicParams = false;

/** Só as modalidades cujas provas entram no calendário (têm disciplina). */
export function generateStaticParams() {
  return MODALIDADES.filter((m) => m.slug !== MODALIDADE_PRINCIPAL && m.disciplinas.length > 0).map((m) => ({
    modalidade: m.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ modalidade: string }> }): Promise<Metadata> {
  const { modalidade } = await params;
  const m = lerModalidade(modalidade);
  if (!m) return { title: "Resultados" };
  return {
    title: `Resultados de ${m.nome} · Desporto`,
    description: `Arquivo de resultados de ${m.nome}, corrida a corrida: tempos, pontos e desistências.`,
  };
}

export default async function ResultadosModalidadePage({ params }: { params: Promise<{ modalidade: string }> }) {
  const { modalidade } = await params;
  const m = lerModalidade(modalidade);
  if (!m || m.slug === MODALIDADE_PRINCIPAL) notFound();

  const [eventos, corridas] = await Promise.all([lerEventos(), lerCorridas()]);
  const lista = corridasDaModalidade(m, eventos, corridas);

  return (
    <>
      <SubNavDesporto modalidade={m.slug} seccoes={seccoesDaModalidade(m.slug, true)} />
      <PaginaInterior icone={<Trophy />}>
        <Abertura
          compacta
          foto={m.imagem}
          sobretitulo={`${m.nome} · Arquivo`}
          titulo="Resultados"
          texto="Corrida a corrida: classificação completa, tempos, pontos e desistências."
        />

        <Seccao>
          <Numeros
            colunas={3}
            itens={[
              { valor: lista.length, texto: "Corridas registadas" },
              { valor: new Set(lista.map((c) => c.vencedor)).size, texto: "Vencedores diferentes" },
              { valor: new Set(lista.map((c) => c.temporada)).size, texto: "Temporadas" },
            ]}
          />
        </Seccao>

        <Seccao className="!pt-0">
          {lista.length === 0 ? (
            <Vazio
              titulo="Sem resultados publicados"
              texto="Os resultados aparecem aqui assim que a primeira corrida da temporada terminar."
            />
          ) : (
            <ArquivoCorridas corridas={lista} />
          )}

          <p className="mt-10 flex items-start gap-2.5 text-sm text-white/55">
            <Flag className="mt-0.5 size-4 shrink-0 text-mb-red-light" aria-hidden />
            DNF: não terminou · DNS: não partiu · DSQ: desclassificado
          </p>

          <div className="mt-10">
            <Voltar href={`/desporto/${m.slug}`}>{m.nome}</Voltar>
          </div>
        </Seccao>
      </PaginaInterior>
    </>
  );
}
