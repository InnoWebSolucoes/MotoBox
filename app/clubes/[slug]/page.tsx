import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/Brand";
import { C } from "@/components/T";
import { ButtonLink, Icon, Tag } from "@/components/ui";
import { perfilClube } from "@/lib/clubes-perfis";
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
  return { title: c.nome, description: (perfilClube(slug)?.resumo ?? c.descricao).slice(0, 155) };
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

/** Tamanho e entrelinha de leitura, como nas notícias: ~70 caracteres por linha. */
const PARAGRAFO = "font-serif text-[1.1875rem] leading-[1.8] text-ink-200 sm:text-[1.25rem]";
const CAPITULAR =
  "first-letter:float-left first-letter:mr-3 first-letter:mt-1.5 first-letter:font-serif first-letter:text-[5.25rem] first-letter:font-bold first-letter:leading-[0.78] first-letter:text-white sm:first-letter:text-[6rem]";

/** A história do clube em parágrafos de leitura; "> texto — autor" sai como citação. */
function Historia({ paragrafos }: { paragrafos: string[] }) {
  return (
    <div className="space-y-7">
      {paragrafos.map((p, i) => {
        if (p.startsWith("> ")) {
          // A atribuição vem depois do último travessão: "… — Nome, função".
          const [texto, autor] = p.slice(2).split(/\s+—\s+(?=[^—]+$)/);
          return (
            <figure key={p.slice(0, 40)} className="my-10 border-y border-white/10 py-8 text-center">
              <blockquote className="font-serif text-2xl italic leading-snug text-white sm:text-[1.75rem]">
                <span aria-hidden className="text-mb-red">“</span>
                <C>{texto.trim()}</C>
                <span aria-hidden className="text-mb-red">”</span>
              </blockquote>
              {autor && (
                <figcaption className="mt-4 font-ui text-sm uppercase tracking-widest text-ink-400">
                  <C>{autor.trim()}</C>
                </figcaption>
              )}
            </figure>
          );
        }
        return (
          <p key={p.slice(0, 40)} className={`${PARAGRAFO} ${i === 0 ? CAPITULAR : ""}`}>
            <C>{p}</C>
          </p>
        );
      })}
    </div>
  );
}

/**
 * Ligação discreta para a fonte de um facto (cronologia, números, viagens).
 * Mostra só quem publicou ("Jornal de Angola", "Instagram"); o título completo
 * fica no `title` e na lista de fontes no fim da página.
 */
function LigacaoFonte({ fonte }: { fonte?: { nome: string; url: string } }) {
  if (!fonte) return null;
  return (
    <a
      href={fonte.url}
      target="_blank"
      rel="noopener noreferrer"
      title={fonte.nome}
      className="text-[11px] text-ink-500 underline decoration-white/15 underline-offset-2 transition-colors hover:text-ink-300"
    >
      {fonte.nome.split(":")[0]}
    </a>
  );
}

export default async function ClubePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clube = await lerClube(slug);
  if (!clube) notFound();

  const [clubes, eventos] = await Promise.all([lerClubes(), lerEventos()]);
  const perfil = perfilClube(clube.slug);

  const proximos = eventosDoClube(eventos, clube.nome);

  // Relacionados: primeiro o mesmo tipo, depois a mesma província.
  const outros = clubes.filter((c) => c.slug !== clube.slug);
  const relacionados = [
    ...outros.filter((c) => c.tipo === clube.tipo),
    ...outros.filter((c) => c.tipo !== clube.tipo && c.provincia === clube.provincia),
  ]
    .slice(0, 3)
    .map((c) => ({ ...c, resumo: perfilClube(c.slug)?.resumo }));

  const rotasPerto = ROTAS.filter((r) => r.provincias.includes(clube.provincia)).slice(0, 3);
  const redes = redesDoClube(clube);

  // Sem perfil alargado, a história é a descrição curta da base de dados.
  const historia = perfil?.historia.length ? perfil.historia : [clube.descricao];
  const fonte = (i: number) => perfil?.fontes[i];
  const aderir = perfil?.comoAderir;
  const viagens = perfil?.viagens;
  // O perfil repete o texto da base de dados quando esta ainda não foi actualizada: sai uma vez só.
  const encontros = [...new Set([...(clube.encontros?.trim() ? [clube.encontros.trim()] : []), ...(perfil?.encontros ?? [])])];

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

          {perfil?.resumo && (
            <p className="mt-6 max-w-2xl font-ui text-lg leading-snug text-ink-200 sm:text-xl">
              <C>{perfil.resumo}</C>
            </p>
          )}

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
        {/* ============ A HISTÓRIA ============
            Coluna de leitura ao centro, como nas notícias. */}
        <section aria-labelledby="historia" className="mx-auto max-w-2xl">
          <h2 id="historia" className="eyebrow accent-bar text-white">
            A história
          </h2>
          <Historia paragrafos={historia} />

          {perfil?.lema && (
            <figure className="mt-12 border-y border-white/10 py-8 text-center">
              <blockquote className="font-serif text-2xl italic leading-snug text-white sm:text-[1.75rem]">
                <span aria-hidden className="text-mb-red">«</span>
                <C>{perfil.lema}</C>
                <span aria-hidden className="text-mb-red">»</span>
              </blockquote>
              <figcaption className="mt-3 font-ui text-sm uppercase tracking-widest text-ink-400">Lema do clube</figcaption>
            </figure>
          )}
        </section>

        {/* ============ NÚMEROS ============ */}
        {perfil?.numeros && perfil.numeros.length > 0 && (
          <section aria-label="Em números" className="mx-auto mt-14 max-w-3xl">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-white/6 py-8 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
              {perfil.numeros.map((n) => (
                // O valor aparece por cima, mas no documento o rótulo (dt) vem primeiro.
                <div key={n.rotulo} className="flex flex-col">
                  <dt className="order-2 mt-2 text-xs leading-snug text-ink-400">
                    <C>{n.rotulo}</C>
                  </dt>
                  <dd className="order-1 font-display text-3xl leading-none text-white tabular-nums sm:text-4xl">{n.valor}</dd>
                  <dd className="order-3 mt-1.5">
                    <LigacaoFonte fonte={fonte(n.fonte)} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-14">
            {/* ============ CRONOLOGIA ============ */}
            {perfil && perfil.destaques.length > 0 && (
              <section aria-labelledby="percurso">
                <h2 id="percurso" className="eyebrow accent-bar text-white">
                  Percurso do clube
                </h2>
                <ol className="max-w-2xl border-l border-white/10">
                  {perfil.destaques.map((d) => (
                    <li key={`${d.ano ?? ""}-${d.titulo}`} className="relative pb-9 pl-7 last:pb-0">
                      <span aria-hidden className="absolute -left-[5px] top-1.5 size-[9px] rounded-full bg-mb-red ring-4 ring-ink-950" />
                      {d.ano && (
                        <p className="eyebrow text-mb-red">
                          <C>{d.ano}</C>
                        </p>
                      )}
                      <h3 className="mt-1 font-display text-lg uppercase leading-tight text-white sm:text-xl">
                        <C>{d.titulo}</C>
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-300 sm:text-base">
                        <C>{d.texto}</C>
                      </p>
                      <p className="mt-2">
                        <LigacaoFonte fonte={fonte(d.fonte)} />
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* ============ VIAGENS ============ */}
            {viagens && viagens.lista.length > 0 && (
              <section aria-labelledby="viagens">
                <h2 id="viagens" className="eyebrow accent-bar text-white">
                  <C>{viagens.titulo}</C>
                </h2>
                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[30rem] max-w-2xl text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-ink-500">
                        <th scope="col" className="py-2.5 pr-4 font-normal">Ano</th>
                        <th scope="col" className="py-2.5 pr-4 font-normal">Raide</th>
                        <th scope="col" className="py-2.5 pr-4 font-normal">Países</th>
                        <th scope="col" className="py-2.5 text-right font-normal">km</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viagens.lista.map((v) => (
                        <tr key={`${v.ano}-${v.nome}`} className="border-b border-white/6 align-top last:border-0">
                          <td className="py-3 pr-4 font-display text-base text-mb-red tabular-nums">{v.ano}</td>
                          <td className="py-3 pr-4 text-white">{v.nome}</td>
                          <td className="py-3 pr-4 text-ink-400">
                            <C>{v.percurso}</C>
                          </td>
                          <td className="py-3 text-right text-ink-300 tabular-nums">{v.km ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-ink-600">
                  <C>{viagens.nota}</C>{" "}
                  <LigacaoFonte fonte={fonte(viagens.fonte)} />
                </p>
              </section>
            )}

            {clube.actividades.length > 0 && (
              <section aria-labelledby="actividades">
                <h2 id="actividades" className="eyebrow accent-bar text-white">
                  O que fazem
                </h2>
                <ul className="grid max-w-2xl gap-x-8 sm:grid-cols-2">
                  {clube.actividades.map((a) => (
                    <li key={a} className="flex items-start gap-3 border-b border-white/6 py-3.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mb-red/12 text-mb-red">
                        <Icon name="check" className="size-3" />
                      </span>
                      <span className="text-sm text-white">
                        <C>{a}</C>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="encontros">
              <h2 id="encontros" className="eyebrow accent-bar text-white">
                Onde e quando se encontram
              </h2>
              {encontros.length > 0 ? (
                <ul className="max-w-2xl space-y-4">
                  {encontros.map((e) => (
                    <li key={e} className="flex items-start gap-3 text-base leading-relaxed text-ink-300">
                      <Icon name="clock" className="mt-1 size-4 shrink-0 text-mb-red" />
                      <span>
                        <C>{e}</C>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="max-w-2xl text-sm leading-relaxed text-ink-400">
                  O clube não publicou um ponto de encontro fixo. As próximas saídas costumam ser anunciadas nas
                  redes do clube.
                </p>
              )}
            </section>

            <section aria-labelledby="aderir">
              <h2 id="aderir" className="eyebrow accent-bar text-white">
                Como entrar no clube
              </h2>
              {aderir?.passos.length ? (
                <>
                  <ol className="max-w-2xl">
                    {aderir.passos.map((p, i) => (
                      <li key={p} className="flex items-start gap-4 border-b border-white/6 py-4 last:border-0">
                        {aderir.passos.length > 1 && (
                          <span className="w-6 shrink-0 font-display text-xl leading-none text-mb-red tabular-nums">{i + 1}</span>
                        )}
                        <span className="text-sm leading-relaxed text-ink-300 sm:text-base">
                          <C>{p}</C>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2">
                    <LigacaoFonte fonte={fonte(aderir.fonte)} />
                  </p>
                </>
              ) : (
                <p className="max-w-2xl text-sm leading-relaxed text-ink-400">
                  O clube não publicou regras de adesão. Pergunte directamente nas redes do clube.
                </p>
              )}
            </section>

            <section aria-labelledby="eventos">
              <h2 id="eventos" className="eyebrow accent-bar text-white">
                Próximos eventos
              </h2>
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
                            <C>{e.titulo}</C>
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
              <section aria-labelledby="rotas">
                <h2 id="rotas" className="eyebrow accent-bar text-white">
                  Rotas na mesma região
                </h2>
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

            {perfil && perfil.fontes.length > 0 && (
              <section aria-labelledby="fontes">
                <h2 id="fontes" className="eyebrow accent-bar text-white">
                  Fontes
                </h2>
                <ul className="max-w-2xl space-y-1.5">
                  {perfil.fontes.map((f) => (
                    <li key={f.url} className="text-xs">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-ink-400 underline decoration-white/15 underline-offset-2 hover:text-white">
                        {f.nome}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] leading-relaxed text-ink-600">
                  Informação verificada em Outubro de 2026, a partir de reportagens e das páginas públicas do clube.
                  Só publicamos o que vem numa fonte.{" "}
                  <Link href="/contacto" className="underline decoration-white/15 underline-offset-2 hover:text-ink-300">
                    Viu um erro? Escreva-nos
                  </Link>
                  .
                </p>
              </section>
            )}
          </div>

          {/* ============ LATERAL ============ */}
          <aside className="space-y-5 lg:sticky lg:top-24">
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
              {(perfil?.estilo || perfil?.motas) && (
                <div className="mt-4 space-y-3 border-t border-white/6 pt-4">
                  {perfil.estilo && (
                    <div>
                      <p className="text-xs text-ink-500">Estilo</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-200">
                        <C>{perfil.estilo}</C>
                      </p>
                    </div>
                  )}
                  {perfil.motas && (
                    <div>
                      <p className="text-xs text-ink-500">Motas</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-200">
                        <C>{perfil.motas}</C>
                      </p>
                    </div>
                  )}
                </div>
              )}
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
