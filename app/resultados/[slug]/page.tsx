import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder, Retrato } from "@/components/Brand";
import { ButtonLink, Icon, PosicaoBadge, Tag } from "@/components/ui";
import { formatData } from "@/lib/data";
import { lerCorrida, lerCorridas, lerEvento } from "@/lib/supabase/publico";

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

function iniciais(n: string) {
  return n.split(" ").map((x) => x[0]).slice(0, 2).join("");
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
    <>
      <header className="relative overflow-hidden">
        <Placeholder nome={[corrida.slug, corrida.imagem]} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/60 to-ink-950/25" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <Link
            href="/resultados"
            className="inline-flex items-center gap-2 font-ui text-sm text-ink-200 [text-shadow:0_1px_6px_rgb(0_0_0/0.6)] hover:text-white transition-colors"
          >
            <span aria-hidden>←</span> Arquivo de resultados
          </Link>

          <div className="mt-6 flex flex-wrap gap-2">
            <Tag tone="red">Ronda {corrida.ronda}</Tag>
            <Tag tone="outline">{corrida.categoria}</Tag>
            <Tag tone="neutral">{corrida.temporada}</Tag>
          </div>

          <h1 className="title-xl mt-4 text-4xl sm:text-5xl">{corrida.nome}</h1>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-300">
            <span className="inline-flex items-center gap-2">
              <Icon name="pin" className="size-4 text-mb-red" />
              {corrida.circuito}, {corrida.provincia}
            </span>
            <span className="inline-flex items-center gap-2">
              <Icon name="calendar" className="size-4 text-mb-red" />
              {formatData(corrida.data)}
            </span>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {/* Pódio: fotografias arredondadas sem moldura, posição só em número (como na classificação) */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {classificados.slice(0, 3).map((r) => (
            <Link
              key={r.pilotoSlug}
              href={`/pilotos/${r.pilotoSlug}`}
              className="group relative isolate flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-card p-5 sm:p-6"
            >
              <Retrato
                nome={r.pilotoSlug}
                iniciais={iniciais(r.piloto)}
                className="absolute inset-0 -z-20 [container-type:size] transition-transform duration-700 group-hover:scale-105"
                tamanhos="(max-width: 640px) 100vw, 33vw"
              />
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    "linear-gradient(to top, rgb(10 10 12 / 0.95) 0%, rgb(10 10 12 / 0.6) 35%, transparent 65%), linear-gradient(to bottom, rgb(0 0 0 / 0.45), transparent 30%)",
                }}
                aria-hidden
              />
              <p className="font-display text-5xl leading-none text-white tabular-nums [text-shadow:0_2px_12px_rgb(0_0_0/0.45)]">
                {r.posicao}
              </p>
              <div>
                <p className="truncate font-display text-2xl uppercase leading-tight text-white group-hover:text-mb-red transition-colors">
                  {r.piloto}
                </p>
                <p className="truncate text-sm text-white/75">{r.equipa}</p>
                <p className="mt-3 font-mono text-lg text-white tabular-nums">
                  {r.tempo}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          {/* Tabela completa */}
          <div>
            <h2 className="eyebrow accent-bar text-white">Classificação da corrida</h2>
            <div>
              <div className="hidden sm:grid grid-cols-[3.5rem_1fr_9rem_4rem_7rem_3.5rem] items-center gap-3 border-b border-white/10 pb-3">
                {["Pos", "Piloto", "Equipa", "Voltas", "Tempo", "Pts"].map((h) => (
                  <span key={h} className="eyebrow text-ink-500">
                    {h}
                  </span>
                ))}
              </div>
              {corrida.resultados.map((r) => (
                <Link
                  key={r.pilotoSlug}
                  href={`/pilotos/${r.pilotoSlug}`}
                  className={`group grid grid-cols-[3.5rem_1fr_3.5rem] sm:grid-cols-[3.5rem_1fr_9rem_4rem_7rem_3.5rem] items-center gap-3 border-b border-white/6 py-3.5 last:border-0 ${
                    r.estado ? "opacity-55" : ""
                  }`}
                >
                  <PosicaoBadge posicao={r.posicao} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white group-hover:text-mb-red transition-colors">
                      {r.piloto}
                      {r.melhorVolta && (
                        <span className="ml-2 rounded-full bg-mb-red/20 px-1.5 py-px text-[9px] font-display uppercase tracking-wider text-mb-red">
                          MV
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-600 sm:hidden">{r.equipa}</p>
                  </div>
                  <p className="hidden sm:block truncate text-xs text-ink-500">{r.equipa}</p>
                  <p className="hidden sm:block font-mono text-xs text-ink-400 tabular-nums">{r.voltas}</p>
                  <p className="hidden sm:block font-mono text-xs text-ink-300 tabular-nums">
                    {r.estado ?? r.tempo}
                  </p>
                  <p className="text-right font-display text-sm text-white tabular-nums">{r.pontos}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Barra lateral */}
          <aside className="space-y-5">
            {melhorVolta && (
              <div className="rounded-card bg-mb-red/10 p-5">
                <p className="eyebrow text-mb-red">Melhor volta da corrida</p>
                <p className="mt-2 font-display text-xl uppercase text-white">{melhorVolta.piloto}</p>
                <p className="text-xs text-ink-400">{melhorVolta.equipa}</p>
              </div>
            )}

            <div className="card p-5">
              <h3 className="eyebrow text-mb-red mb-4">Resumo</h3>
              <dl className="space-y-3">
                {[
                  ["Categoria", corrida.categoria],
                  ["Partidas", String(corrida.resultados.length)],
                  ["Classificados", String(classificados.length)],
                  ["Desistências", String(corrida.resultados.length - classificados.length)],
                  ["Circuito", corrida.circuito],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-white/6 pb-3 last:border-0 last:pb-0">
                    <dt className="text-xs text-ink-500">{k}</dt>
                    <dd className="text-sm text-white text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {outrasCategorias.length > 0 && (
              <div className="card p-5">
                <h3 className="eyebrow text-mb-red mb-3">Outras categorias</h3>
                <div className="space-y-2">
                  {outrasCategorias.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/resultados/${c.slug}`}
                      className="group flex items-center justify-between gap-3 border-b border-white/6 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-ink-300 group-hover:text-white transition-colors">
                        {c.categoria}
                      </span>
                      <span className="text-xs text-ink-600">{c.vencedor}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {evento && (
              <ButtonLink href={`/calendario/${evento.slug}`} variant="outline" className="w-full">
                Página do evento
              </ButtonLink>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
