import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/Brand";
import { ButtonLink, Icon, Tag } from "@/components/ui";
import { formatData } from "@/lib/data";
import { eComunidade, hrefEvento } from "@/lib/desporto";
import { ROTAS } from "@/lib/rotas";
import { lerClube, lerClubes, lerEventos } from "@/lib/supabase/publico";
import type { Evento } from "@/lib/types";
import { CapaClube, CartaoClube, LogoClube, RedesClube } from "../Partes";
import { localClube, nomeTipo, redesDoClube, slugTipo } from "../comum";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Clubes criados depois do build são gerados no primeiro pedido.
export async function generateStaticParams() {
  const clubes = await lerClubes();
  return clubes.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await lerClube(slug);
  if (!c) return { title: "Clube não encontrado" };
  return { title: c.nome, description: c.descricao.slice(0, 155) };
}

/** Sem acentos nem maiúsculas, para procurar o nome do clube nos eventos. */
const normal = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Eventos da comunidade que ainda não passaram e falam do clube (organizador, título ou texto). */
function eventosDoClube(eventos: Evento[], nomeClube: string): Evento[] {
  const nome = normal(nomeClube);
  const agora = Date.now();
  return eventos
    .filter((e) => eComunidade(e.disciplina) && new Date(e.dataFim).getTime() >= agora)
    .filter((e) => normal(`${e.organizador} ${e.titulo} ${e.resumo} ${e.descricao}`).includes(nome))
    .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
    .slice(0, 3);
}

export default async function ClubePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clube = await lerClube(slug);
  if (!clube) notFound();

  const [clubes, eventos] = await Promise.all([lerClubes(), lerEventos()]);

  const proximos = eventosDoClube(eventos, clube.nome);

  // Relacionados: primeiro o mesmo tipo, depois a mesma província.
  const outros = clubes.filter((c) => c.slug !== clube.slug);
  const relacionados = [
    ...outros.filter((c) => c.tipo === clube.tipo),
    ...outros.filter((c) => c.tipo !== clube.tipo && c.provincia === clube.provincia),
  ].slice(0, 3);

  const rotasPerto = ROTAS.filter((r) => r.provincias.includes(clube.provincia)).slice(0, 3);
  const redes = redesDoClube(clube);

  const ficha: [string, string][] = [
    ["Tipo", nomeTipo(clube.tipo)],
    ["Província", clube.provincia],
    ...(clube.cidade?.trim() ? ([["Cidade", clube.cidade.trim()]] as [string, string][]) : []),
    ...(clube.fundacao ? ([["Desde", String(clube.fundacao)]] as [string, string][]) : []),
  ];

  return (
    <>
      {/* ============ CABEÇALHO ============ */}
      <header className="relative overflow-hidden">
        <CapaClube clube={clube} className="absolute inset-0 opacity-60" tamanhos="100vw" monograma={false} />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/70 to-ink-950/20" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <Link href="/clubes" className="inline-flex items-center gap-2 font-ui text-sm text-ink-400 transition-colors hover:text-white">
            <span aria-hidden>←</span> Clubes
          </Link>

          <div className="mt-8 flex flex-wrap items-end gap-6">
            <LogoClube clube={clube} className="size-24 text-3xl sm:size-28" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/clubes?tipo=${slugTipo(clube.tipo)}`}>
                  <Tag tone="outline">{nomeTipo(clube.tipo)}</Tag>
                </Link>
                {clube.fundacao ? <Tag tone="outline">Desde {clube.fundacao}</Tag> : null}
              </div>
              <h1 className="title-xl mt-3 text-4xl sm:text-5xl lg:text-6xl">{clube.nome}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-300">
                <Icon name="pin" className="size-4 text-mb-red" />
                {localClube(clube)}
              </p>
            </div>
          </div>

          {redes.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2.5">
              {redes.map((r, i) => (
                <a
                  key={r.chave}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-11 items-center gap-2 rounded-full px-5 font-ui text-base transition-colors ${
                    i === 0 ? "bg-mb-red text-white hover:bg-mb-red-dark" : "bg-ink-800 text-white hover:bg-ink-700"
                  }`}
                >
                  <Icon name={r.icone} className="size-4" />
                  {r.nome}
                  <span className="sr-only">(abre numa nova janela)</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-12">
            <section>
              <h2 className="eyebrow accent-bar text-white">Sobre o clube</h2>
              <p className="max-w-2xl text-base leading-relaxed text-ink-300">{clube.descricao}</p>
            </section>

            {clube.actividades.length > 0 && (
              <section>
                <h2 className="eyebrow accent-bar text-white">O que fazem</h2>
                <ul className="max-w-2xl">
                  {clube.actividades.map((a) => (
                    <li key={a} className="flex items-center gap-3 border-b border-white/6 py-3.5 last:border-0">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mb-red/12 text-mb-red">
                        <Icon name="check" className="size-3.5" />
                      </span>
                      <span className="text-sm text-white sm:text-base">{a}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="eyebrow accent-bar text-white">Onde e quando se encontram</h2>
              {clube.encontros?.trim() ? (
                <p className="flex max-w-2xl items-start gap-3 text-base leading-relaxed text-ink-300">
                  <Icon name="clock" className="mt-1 size-4 shrink-0 text-mb-red" />
                  {clube.encontros}
                </p>
              ) : (
                <p className="max-w-2xl text-sm leading-relaxed text-ink-400">
                  O clube não publicou um ponto de encontro fixo. As próximas saídas costumam ser anunciadas nas
                  redes do clube.
                </p>
              )}
            </section>

            <section>
              <h2 className="eyebrow accent-bar text-white">Próximos eventos</h2>
              {proximos.length > 0 ? (
                <ul>
                  {proximos.map((e) => (
                    <li key={e.slug} className="border-b border-white/6 last:border-0">
                      <Link href={hrefEvento(e)} className="group flex items-center gap-5 py-4">
                        <span className="w-12 shrink-0 text-center">
                          <span className="block font-display text-2xl leading-none text-white tabular-nums">
                            {new Date(e.dataInicio).getDate()}
                          </span>
                          <span className="eyebrow mt-1 block text-mb-red">
                            {formatData(e.dataInicio, { month: "short" }).replace(".", "")}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-lg uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
                            {e.titulo}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-500">
                            {e.disciplina} · {e.localidade || e.circuito}, {e.provincia}
                          </span>
                        </span>
                        <Icon name="arrow" className="size-4 shrink-0 text-ink-500 group-hover:text-white" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="max-w-2xl text-sm leading-relaxed text-ink-400">
                  Sem eventos do clube anunciados na Motobox.{" "}
                  <Link href="/eventos" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-mb-red">
                    Ver todos os eventos da comunidade
                  </Link>
                  .
                </p>
              )}
            </section>

            {rotasPerto.length > 0 && (
              <section>
                <h2 className="eyebrow accent-bar text-white">Rotas na mesma região</h2>
                <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3">
                  {rotasPerto.map((r, i) => (
                    // A terceira só a partir do tablet: no telemóvel ficava sozinha numa linha.
                    <Link key={r.slug} href={`/clubes/rotas/${r.slug}`} className={`group ${i === 2 ? "hidden sm:block" : "block"}`}>
                      <Placeholder nome={r.imagem} className="media aspect-[4/3]" tamanhos="(max-width: 640px) 50vw, 240px" largura={600} />
                      <p className="eyebrow mt-3 text-mb-red">{r.regiao}</p>
                      <h3 className="mt-1 font-display text-base uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
                        {r.nome}
                      </h3>
                    </Link>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-ink-600">Fotografias ilustrativas.</p>
              </section>
            )}
          </div>

          {/* ============ LATERAL ============ */}
          <aside className="space-y-5">
            <div className="card p-5">
              <h2 className="eyebrow mb-4 text-mb-red">Ficha</h2>
              <dl>
                {ficha.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-white/6 py-2.5 first:pt-0 last:border-0 last:pb-0">
                    <dt className="shrink-0 text-xs text-ink-500">{k}</dt>
                    <dd className="text-right text-sm text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card p-5">
              <h2 className="eyebrow mb-3 text-mb-red">Contactar o clube</h2>
              {redes.length > 0 || clube.contacto ? (
                <>
                  <p className="text-xs leading-relaxed text-ink-500">
                    Os contactos são os que o clube publica. A Motobox não gere o clube: fale directamente com eles.
                  </p>
                  <div className="mt-4 space-y-2">
                    {clube.contacto?.includes("@") && (
                      <a
                        href={`mailto:${clube.contacto.trim()}`}
                        className="flex items-center gap-3 rounded-full bg-ink-800 px-4 py-2.5 text-sm text-white transition-colors hover:bg-ink-700"
                      >
                        <Icon name="mail" className="size-4 text-mb-red" />
                        <span className="truncate">{clube.contacto.trim()}</span>
                      </a>
                    )}
                    {clube.contacto && !clube.contacto.includes("@") && (
                      <p className="rounded-full bg-ink-800 px-4 py-2.5 text-sm text-white">{clube.contacto}</p>
                    )}
                  </div>
                  <div className="mt-4">
                    <RedesClube clube={clube} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-400">O clube ainda não publicou contactos.</p>
              )}
            </div>

            <div className="rounded-card bg-ink-900/60 p-5">
              <p className="text-sm font-medium text-white">É deste clube?</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                Envie-nos o logótipo, fotografias vossas e as datas dos próximos passeios para completarmos a página.
              </p>
              <ButtonLink href="/clubes#juntar" variant="dark" size="sm" className="mt-4">
                Falar com a Motobox
              </ButtonLink>
            </div>
          </aside>
        </div>

        {/* ============ OUTROS CLUBES ============ */}
        {relacionados.length > 0 && (
          <section className="mt-20 border-t border-white/6 pt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="title-xl text-3xl">Outros clubes</h2>
              <Link href="/clubes" className="font-ui text-base text-ink-300 transition-colors hover:text-white">
                Todos os clubes →
              </Link>
            </div>
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((c) => (
                <CartaoClube key={c.slug} clube={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
