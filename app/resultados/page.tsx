import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Numeros, Seccao } from "@/components/painel/blocos";
import { FotoFundo } from "@/components/painel/kit";
import { intervaloDatas } from "@/lib/motobox";
import { lerCorridas } from "@/lib/supabase/publico";
import { preencher } from "@/lib/conteudo/grupos/geral";
import { lerTemporada, lerTextosResultados } from "@/lib/conteudo/ler-geral";
import { Aviso, Etiqueta, LegendaResultados, LigacaoSeta } from "@/app/calendario/pecas";
import { TabelaResultados } from "./TabelaResultados";
import { fotoDe } from "@/app/eventos/foto";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Os textos fixos editam-se no painel: Provas › Páginas do campeonato › Resultados.
export async function generateMetadata(): Promise<Metadata> {
  const t = await lerTextosResultados();
  return { title: t.pesquisa.titulo, description: t.pesquisa.descricao };
}

export default async function ResultadosPage() {
  const [corridas, t, temporadaActual] = await Promise.all([lerCorridas(), lerTextosResultados(), lerTemporada()]);
  const porTemporada = corridas.reduce<Record<number, typeof corridas>>((acc, c) => {
    (acc[c.temporada] ??= []).push(c);
    return acc;
  }, {});
  const temporadas = Object.keys(porTemporada).map(Number).sort((a, b) => b - a);

  return (
    <PaginaInterior icone={<Trophy />}>
      <Abertura
        compacta
        foto={t.foto}
        sobretitulo={t.sobretitulo}
        titulo={t.titulo}
        texto={t.texto}
      />

      <Seccao>
        <Numeros
          colunas={3}
          itens={[
            { valor: corridas.length, texto: t.numeros.corridas },
            { valor: new Set(corridas.map((c) => c.vencedor)).size, texto: t.numeros.vencedores },
            { valor: temporadas.length, texto: temporadas.length === 1 ? t.numeros.temporada : t.numeros.temporadas },
          ]}
        />
      </Seccao>

      {temporadas.length === 0 && (
        <Seccao className="!pt-0">
          <Aviso titulo={t.vazioTitulo} icone={<Trophy />}>
            {t.vazioTexto}
          </Aviso>
        </Seccao>
      )}

      {temporadas.map((ano) => (
        <Seccao key={ano} className="!pt-0">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="titulo-2">{preencher(t.temporada, { temporada: ano })}</h2>
            {ano === temporadaActual && <Etiqueta tom="vermelho">{t.emCurso}</Etiqueta>}
          </div>

          <div className="mt-10 space-y-14">
            {porTemporada[ano]
              // Por data: as corridas de fora do campeonato (ronda 0) ficam no seu lugar no ano.
              .sort((a, b) => a.data.localeCompare(b.data) || a.ronda - b.ronda || a.categoria.localeCompare(b.categoria))
              .map((c) => (
                <article key={c.slug} className="grid gap-[var(--intervalo)] lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
                  {/* Cabeçalho da corrida: fotografia do circuito, texto sobre o véu */}
                  <div className="painel relative isolate flex min-h-[16rem] flex-col justify-end p-5 lg:min-h-[20rem] lg:self-start">
                    <FotoFundo nome={fotoDe(c.slug, c.imagem)} veu="baixo" tamanhos="(max-width: 1024px) 100vw, 288px" largura={700} />
                    <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-transparent" />
                    <div className="flex flex-wrap gap-1.5">
                      {c.ronda > 0 && <Etiqueta tom="vermelho">{preencher(t.ronda, { ronda: c.ronda })}</Etiqueta>}
                      <Etiqueta tom={c.ronda > 0 ? "vidro" : "vermelho"}>{c.categoria}</Etiqueta>
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight">{c.nome}</h3>
                    <p className="mt-1.5 text-sm text-white/75">
                      {c.circuito}, {c.provincia}
                    </p>
                    <p className="text-sm text-white/80">{intervaloDatas(c.data)}</p>
                    <div className="mt-4 border-t border-white/15 pt-4">
                      <p className="text-xs text-white/80">{t.vencedor}</p>
                      <p className="mt-0.5 text-lg font-semibold">{c.vencedor}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <TabelaResultados resultados={c.resultados} textos={t.tabela} />
                    <div className="mt-4 flex justify-end">
                      <LigacaoSeta href={`/resultados/${c.slug}`}>{t.verCorrida}</LigacaoSeta>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </Seccao>
      ))}

      <Seccao className="!pt-0">
        <LegendaResultados itens={t.tabela.legenda} />
      </Seccao>
    </PaginaInterior>
  );
}
