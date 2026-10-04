import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListChecks, Timer, Trophy } from "lucide-react";
import { Retrato } from "@/components/Brand";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Seccao } from "@/components/painel/blocos";
import { Seta } from "@/components/painel/kit";
import { intervaloDatas } from "@/lib/motobox";
import { lerCorrida, lerCorridas, lerEvento } from "@/lib/supabase/publico";
import { Ficha, LegendaResultados, TituloSeccao, iniciais } from "@/app/calendario/pecas";
import { TabelaResultados } from "../TabelaResultados";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Corridas criadas depois do build são geradas no primeiro pedido
// (`dynamicParams` fica no valor por omissão, `true`).
export async function generateStaticParams() {
  const corridas = await lerCorridas();
  return corridas.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await lerCorrida(slug);
  if (!c) return { title: "Resultado não encontrado" };
  return {
    title: `${c.nome} ${c.temporada}, ${c.categoria}`,
    description: `Resultado completo do ${c.nome} de ${c.temporada}, categoria ${c.categoria}. Vencedor: ${c.vencedor}.`,
  };
}

export default async function ResultadoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const corrida = await lerCorrida(slug);
  if (!corrida) notFound();

  const evento = await lerEvento(corrida.eventoSlug);
  const outrasCategorias = (await lerCorridas()).filter(
    (c) => c.eventoSlug === corrida.eventoSlug && c.slug !== corrida.slug,
  );
  const classificados = corrida.resultados.filter((r) => !r.estado);
  const melhorVolta = corrida.resultados.find((r) => r.melhorVolta);

  return (
    <PaginaInterior icone={<Trophy />}>
      <Abertura
        compacta
        foto={[corrida.slug, corrida.imagem]}
        sobretitulo={[corrida.ronda > 0 ? `Ronda ${corrida.ronda}` : null, corrida.categoria, String(corrida.temporada)]
          .filter(Boolean)
          .join(" · ")}
        titulo={corrida.nome}
        texto={`${corrida.circuito}, ${corrida.provincia} · ${intervaloDatas(corrida.data)}`}
      >
        <p className="text-[15px] text-white/85">
          Vencedor: <span className="font-semibold text-white">{corrida.vencedor}</span>
        </p>
      </Abertura>

      {/* Pódio: o retrato de cada piloto, posição grande e o tempo */}
      {classificados.length > 0 && (
        <Seccao>
          <TituloSeccao titulo="Pódio" accao={{ href: "/resultados", texto: "Arquivo de resultados" }} />
          <ol className="mt-8 grid gap-[var(--intervalo)] sm:grid-cols-3">
            {classificados.slice(0, 3).map((r) => (
              <li key={r.pilotoSlug}>
                <Link
                  href={`/pilotos/${r.pilotoSlug}`}
                  className="painel group relative isolate flex aspect-[4/3] flex-col justify-between p-5 sm:aspect-[4/5] lg:aspect-[4/3] lg:p-6"
                >
                  <Retrato
                    nome={r.pilotoSlug}
                    iniciais={iniciais(r.piloto)}
                    className="foto-painel absolute inset-0 -z-20 [container-type:size]"
                    tamanhos="(max-width: 640px) 100vw, 33vw"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/10"
                  />
                  <span
                    className={`grid size-12 place-items-center rounded-[4px] text-2xl font-semibold tabular-nums ${
                      r.posicao === 1 ? "bg-mb-red" : "bg-black/65"
                    }`}
                  >
                    <span className="sr-only">Posição </span>
                    {r.posicao}
                  </span>
                  <div>
                    <p className="truncate text-2xl font-semibold leading-tight">{r.piloto}</p>
                    <p className="truncate text-sm text-white/75">{r.equipa}</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <p className="text-lg tabular-nums">{r.tempo}</p>
                      <p className="text-sm tabular-nums text-white/75">{r.pontos} pts</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </Seccao>
      )}

      <Seccao className={classificados.length > 0 ? "!pt-0" : ""}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          {/* Classificação completa */}
          <div className="min-w-0">
            <h2 className="titulo-3">Classificação da corrida</h2>
            <TabelaResultados resultados={corrida.resultados} className="mt-8" />
            <LegendaResultados className="mt-6" />
          </div>

          {/* Barra lateral */}
          <aside className="space-y-[var(--intervalo)]">
            {melhorVolta && (
              <div className="flex items-center gap-4 rounded-[var(--raio)] bg-mb-red p-6">
                <Timer className="size-8 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm text-white/85">Melhor volta da corrida</p>
                  <p className="mt-1 truncate text-xl font-semibold">{melhorVolta.piloto}</p>
                  <p className="truncate text-sm text-white/80">{melhorVolta.equipa}</p>
                </div>
              </div>
            )}

            <Ficha
              titulo="Resumo"
              icone={<ListChecks />}
              linhas={[
                ["Categoria", corrida.categoria],
                ["Partidas", String(corrida.resultados.length)],
                ["Classificados", String(classificados.length)],
                ["Desistências", String(corrida.resultados.length - classificados.length)],
                ["Circuito", corrida.circuito],
              ]}
            />

            {outrasCategorias.length > 0 && (
              <Ficha titulo="Outras categorias" icone={<Trophy />}>
                <ul className="mt-4 divide-y divide-white/8">
                  {outrasCategorias.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/resultados/${c.slug}`}
                        className="group flex items-center justify-between gap-3 py-3 first:pt-0"
                      >
                        <span className="text-sm font-medium transition-colors group-hover:text-mb-red-light">{c.categoria}</span>
                        <span className="flex min-w-0 items-center gap-3 text-sm text-white/60">
                          <span className="truncate">{c.vencedor}</span>
                          <Seta className="size-3 text-white" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Ficha>
            )}

            {evento && (
              <BotaoMB href={`/calendario/${evento.slug}`} variante="escuro" className="!max-w-none">
                Página da prova
              </BotaoMB>
            )}
          </aside>
        </div>
      </Seccao>
    </PaginaInterior>
  );
}
