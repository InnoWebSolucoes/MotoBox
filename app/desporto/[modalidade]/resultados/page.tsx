import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Flag, Trophy } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Numeros, Seccao } from "@/components/painel/blocos";
import { TEMPORADA } from "@/lib/data";
import { corridasDaModalidade, preencher, principalDe, seccoesDaModalidade } from "@/lib/desporto";
import { lerCorridas, lerEventos } from "@/lib/supabase/publico";
import { SubNavDesporto } from "../../SubNavDesporto";
import { ArquivoCorridas, Vazio, Voltar } from "../../Partes";
import { lerModalidades, lerPaginaDesporto } from "../../dados";

/* Arquivo de resultados de uma modalidade que não é a principal (Enduro,
   Rally-Raid e as que vierem a ter provas). O Motocross tem o seu em /resultados. */

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

/** Só as modalidades cujas provas entram no calendário (têm disciplina). Uma nova gera-se no primeiro pedido. */
export async function generateStaticParams() {
  const lista = await lerModalidades();
  const principal = principalDe(lista)?.slug;
  return lista.filter((m) => m.slug !== principal && m.disciplinas.length > 0).map((m) => ({ modalidade: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ modalidade: string }> }): Promise<Metadata> {
  const { modalidade } = await params;
  const m = (await lerModalidades()).find((x) => x.slug === modalidade);
  if (!m) return { title: "Resultados" };
  return {
    title: `Resultados de ${m.nome} · Desporto`,
    description: `Arquivo de resultados de ${m.nome}, corrida a corrida: tempos, pontos e desistências.`,
  };
}

export default async function ResultadosModalidadePage({ params }: { params: Promise<{ modalidade: string }> }) {
  const { modalidade } = await params;
  const [lista, t] = await Promise.all([lerModalidades(), lerPaginaDesporto()]);
  const m = lista.find((x) => x.slug === modalidade);
  if (!m || m.slug === principalDe(lista)?.slug) notFound();

  const [eventos, corridas] = await Promise.all([lerEventos(), lerCorridas()]);
  const corridasM = corridasDaModalidade(m, eventos, corridas);
  const a = t.modalidade.arquivo;
  const valores = { ano: TEMPORADA, campeonato: t.campeonato.nome, modalidade: m.nome };

  return (
    <>
      <SubNavDesporto modalidade={m.slug} nome={m.nome} principal={false} seccoes={seccoesDaModalidade(m.slug, true)} />
      <PaginaInterior icone={<Trophy />}>
        <Abertura
          compacta
          foto={m.imagem}
          sobretitulo={preencher(a.sobretitulo, valores)}
          titulo={preencher(a.titulo, valores)}
          texto={preencher(a.texto, valores)}
        />

        <Seccao>
          <Numeros
            colunas={3}
            itens={[
              { valor: corridasM.length, texto: a.corridas },
              { valor: new Set(corridasM.map((c) => c.vencedor)).size, texto: a.vencedores },
              { valor: new Set(corridasM.map((c) => c.temporada)).size, texto: a.temporadas },
            ]}
          />
        </Seccao>

        <Seccao className="!pt-0">
          {corridasM.length === 0 ? (
            <Vazio titulo={t.modalidade.resultados.vazioTitulo} texto={t.modalidade.resultados.vazioTexto} />
          ) : (
            <ArquivoCorridas corridas={corridasM} />
          )}

          {a.legenda && (
            <p className="mt-10 flex items-start gap-2.5 text-sm text-white/55">
              <Flag className="mt-0.5 size-4 shrink-0 text-mb-red-light" aria-hidden />
              {a.legenda}
            </p>
          )}

          <div className="mt-10">
            <Voltar href={`/desporto/${m.slug}`}>{preencher(a.voltar, valores)}</Voltar>
          </div>
        </Seccao>
      </PaginaInterior>
    </>
  );
}
