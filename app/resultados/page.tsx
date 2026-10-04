import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Numeros, Seccao } from "@/components/painel/blocos";
import { FotoFundo } from "@/components/painel/kit";
import { TEMPORADA } from "@/lib/data";
import { intervaloDatas } from "@/lib/motobox";
import { lerCorridas } from "@/lib/supabase/publico";
import { Aviso, Etiqueta, LegendaResultados, LigacaoSeta } from "@/app/calendario/pecas";
import { TabelaResultados } from "./TabelaResultados";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Arquivo de Resultados",
  description:
    "Arquivo completo de resultados do motociclismo angolano, corrida a corrida, com tempos, pontos e melhores voltas.",
};

export default async function ResultadosPage() {
  const corridas = await lerCorridas();
  const porTemporada = corridas.reduce<Record<number, typeof corridas>>((acc, c) => {
    (acc[c.temporada] ??= []).push(c);
    return acc;
  }, {});
  const temporadas = Object.keys(porTemporada).map(Number).sort((a, b) => b - a);

  return (
    <PaginaInterior icone={<Trophy />}>
      <Abertura
        compacta
        foto="mxgp"
        sobretitulo="Arquivo histórico"
        titulo="Resultados"
        texto="Todos os resultados das provas do calendário nacional, corrida a corrida. Tempos, pontos, melhores voltas e desistências."
      />

      <Seccao>
        <Numeros
          colunas={3}
          itens={[
            { valor: corridas.length, texto: "Corridas registadas" },
            { valor: new Set(corridas.map((c) => c.vencedor)).size, texto: "Vencedores diferentes" },
            { valor: temporadas.length, texto: temporadas.length === 1 ? "Temporada" : "Temporadas" },
          ]}
        />
      </Seccao>

      {temporadas.length === 0 && (
        <Seccao className="!pt-0">
          <Aviso titulo="Sem resultados publicados" icone={<Trophy />}>
            Os resultados aparecem aqui assim que a primeira corrida da temporada terminar.
          </Aviso>
        </Seccao>
      )}

      {temporadas.map((t) => (
        <Seccao key={t} className="!pt-0">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="titulo-2">Temporada {t}</h2>
            {t === TEMPORADA && <Etiqueta tom="vermelho">Em curso</Etiqueta>}
          </div>

          <div className="mt-10 space-y-14">
            {porTemporada[t]
              .sort((a, b) => a.ronda - b.ronda || a.categoria.localeCompare(b.categoria))
              .map((c) => (
                <article key={c.slug} className="grid gap-[var(--intervalo)] lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
                  {/* Cabeçalho da corrida: fotografia do circuito, texto sobre o véu */}
                  <div className="painel relative isolate flex min-h-[16rem] flex-col justify-end p-5 lg:min-h-[20rem] lg:self-start">
                    <FotoFundo nome={[c.slug, c.imagem]} veu="baixo" tamanhos="(max-width: 1024px) 100vw, 288px" largura={700} />
                    <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-transparent" />
                    <div className="flex flex-wrap gap-1.5">
                      <Etiqueta tom="vermelho">Ronda {c.ronda}</Etiqueta>
                      <Etiqueta tom="vidro">{c.categoria}</Etiqueta>
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight">{c.nome}</h3>
                    <p className="mt-1.5 text-sm text-white/75">
                      {c.circuito}, {c.provincia}
                    </p>
                    <p className="text-sm text-white/60">{intervaloDatas(c.data)}</p>
                    <div className="mt-4 border-t border-white/15 pt-4">
                      <p className="text-xs text-white/60">Vencedor</p>
                      <p className="mt-0.5 text-lg font-semibold">{c.vencedor}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <TabelaResultados resultados={c.resultados} />
                    <div className="mt-4 flex justify-end">
                      <LigacaoSeta href={`/resultados/${c.slug}`}>Ver a corrida</LigacaoSeta>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </Seccao>
      ))}

      <Seccao className="!pt-0">
        <LegendaResultados />
      </Seccao>
    </PaginaInterior>
  );
}
