import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, Icon, PageHero } from "@/components/ui";
import {
  MODALIDADES, MODALIDADE_PRINCIPAL, corridasDaModalidade, lerModalidade, seccoesDaModalidade,
} from "@/lib/desporto";
import { lerCorridas, lerEventos } from "@/lib/supabase/publico";
import { SubNavDesporto } from "../../SubNavDesporto";
import { ArquivoCorridas } from "../../Partes";

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
      <PageHero imagem="resultados" eyebrow={`${m.nome} · Arquivo`} titulo="Resultados">
        <div className="flex flex-wrap gap-8">
          {[
            { v: lista.length, l: "Corridas registadas" },
            { v: new Set(lista.map((c) => c.vencedor)).size, l: "Vencedores diferentes" },
            { v: new Set(lista.map((c) => c.temporada)).size, l: "Temporadas" },
          ].map((s) => (
            <div key={s.l}>
              <p className="font-display text-3xl text-white">{s.v}</p>
              <p className="eyebrow mt-1 text-ink-500">{s.l}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {lista.length === 0 ? (
          <EmptyState
            titulo="Sem resultados publicados"
            descricao="Os resultados aparecem aqui assim que a primeira corrida da temporada terminar."
          />
        ) : (
          <ArquivoCorridas corridas={lista} />
        )}

        <p className="mt-10 flex items-center gap-2 text-xs text-ink-600">
          <Icon name="flag" className="size-4" />
          DNF: não terminou · DNS: não partiu · DSQ: desclassificado
        </p>

        <Link
          href={`/desporto/${m.slug}`}
          className="group mt-10 inline-flex items-center gap-2 font-ui text-base text-ink-300 transition-colors hover:text-white"
        >
          <span aria-hidden>←</span> {m.nome}
        </Link>
      </div>
    </>
  );
}
