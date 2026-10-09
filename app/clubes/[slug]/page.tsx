import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpen, CalendarDays, Globe, Mail, UserPlus, Users } from "lucide-react";
import { lerClube, lerClubes } from "@/lib/supabase/publico";
import { localClube } from "@/lib/motobox";
import { comResumoDe, normalizarPerfil, type FonteClube, type PerfilClube } from "@/lib/clubes-perfis";
import { lerDoc, lerGrupo } from "@/lib/conteudo";
import { textoClube, type ConteudoPaginaClubes } from "@/lib/conteudo/grupos/clubes";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, CartaoNumerado, Numeros, Seccao } from "@/components/painel/blocos";
import { Chip, Monograma, Seta } from "@/components/painel/kit";
import { Icon } from "@/components/ui";
import { eMovimento, nomeTipo, redesDoClube } from "../comum";
import { CartaoClube, primeiraFrase } from "../Partes";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export async function generateStaticParams() {
  const clubes = await lerClubes();
  return clubes.map((c) => ({ slug: c.slug }));
}

/** Os perfis alargados, já normalizados, por slug (editáveis no painel: Clubes e movimentos). */
async function lerPerfis(): Promise<Map<string, PerfilClube | undefined>> {
  const grupo = await lerGrupo<PerfilClube>("clubes-perfis");
  return new Map(grupo.map((d) => [d.chave, normalizarPerfil(d.dados)]));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await lerClube(slug);
  if (!c) return { title: "Clube não encontrado" };
  const perfil = (await lerPerfis()).get(slug);
  return {
    title: c.nome,
    description: (perfil?.resumo || c.descricao).slice(0, 160),
  };
}

/**
 * Ligação discreta para a fonte de um facto (cronologia, números, viagens).
 * Mostra só quem publicou ("Bikers of Africa", "Instagram"); o título inteiro
 * fica no `title` e na lista de fontes no fim da página.
 */
function LigacaoFonte({ fonte, prefixo }: { fonte?: FonteClube; prefixo: string }) {
  if (!fonte) return null;
  return (
    <a
      href={fonte.url}
      target="_blank"
      rel="noopener noreferrer"
      title={fonte.nome}
      className="text-xs text-white/75 underline decoration-white/25 underline-offset-2 transition-colors hover:text-white"
    >
      {`${prefixo} `}{fonte.nome.split(":")[0]}
      <span className="sr-only"> (abre numa nova janela)</span>
    </a>
  );
}

/** A história em parágrafos de leitura; "> citação — autor" sai como citação destacada. */
function Historia({ paragrafos }: { paragrafos: string[] }) {
  return (
    <div className="prosa mt-8 max-w-[62ch]">
      {paragrafos.map((p, i) => {
        if (p.startsWith("> ")) {
          // A atribuição vem depois do último travessão: "… — Nome, função".
          const [texto, autor] = p.slice(2).split(/\s+—\s+(?=[^—]+$)/);
          return (
            <figure key={i}>
              <blockquote>«{texto.trim()}»</blockquote>
              {autor && <figcaption>{autor.trim()}</figcaption>}
            </figure>
          );
        }
        return <p key={i}>{p}</p>;
      })}
    </div>
  );
}

/** Título de bloco dentro de um painel: quadrado de ícone e título. */
function TituloPainel({ id, icone, children }: { id: string; icone: ReactNode; children: ReactNode }) {
  return (
    <>
      <Chip>{icone}</Chip>
      <h2 id={id} className="titulo-4 mt-8">
        {children}
      </h2>
    </>
  );
}

export default async function ClubePagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clube = await lerClube(slug);
  if (!clube) notFound();

  const [perfis, textos] = await Promise.all([lerPerfis(), lerDoc<ConteudoPaginaClubes>("paginas.clubes")]);
  const perfil = perfis.get(clube.slug);
  const redes = redesDoClube(clube);
  const tipo = nomeTipo(clube.tipo);
  // Um movimento (ex.: Lady Riders) não é um clube: os textos dizem "movimento".
  const termo = eMovimento(clube) ? "movimento" : "clube";
  // Os textos fixos da página (editáveis no painel), com o termo e o nome do clube.
  const t = (texto: string) => textoClube(texto, termo, clube.nome);
  // O mesmo, como pedaços de texto lado a lado (o termo e o nome à parte), para os textos dentro de parágrafos.
  const tp = (texto: string) =>
    texto.split(/(\{termo\}|\{nome\})/).filter(Boolean).map((p) => (p === "{termo}" ? termo : p === "{nome}" ? clube.nome : p));
  const outros = (await lerClubes())
    .filter((c) => c.slug !== clube.slug)
    .sort((a, b) => Number(b.tipo === clube.tipo) - Number(a.tipo === clube.tipo))
    .slice(0, 3)
    .map(comResumoDe(perfis));

  // Os placeholders (lib/clubes-perfis.ts) não têm fonte: sem índice, não há ligação.
  const fonte = (i?: number) => (i === undefined ? undefined : perfil?.fontes[i]);
  const cronologiaComFontes = Boolean(perfil?.destaques.every((d) => fonte(d.fonte)));
  // Sem perfil alargado, a história é a descrição da base de dados (e a abertura, a primeira frase).
  const historia = perfil?.historia.length ? perfil.historia : [clube.descricao];
  const abertura = perfil?.resumo || primeiraFrase(clube.descricao);
  // O perfil completa o campo `encontros` da base de dados; o mesmo texto sai uma vez só.
  const encontros = [
    ...new Set([clube.encontros?.trim(), ...(perfil?.encontros ?? [])].filter((e): e is string => Boolean(e))),
  ];
  const aderir = perfil?.comoAderir;
  const viagens = perfil?.viagens;
  const prefixoFonte = textos.fichaFontePrefixo;

  return (
    <PaginaInterior icone={<Users />}>
      <Abertura foto={[clube.imagem, clube.slug]} sobretitulo={`${tipo} · ${localClube(clube)}`} titulo={clube.nome} texto={abertura}>
        <div className="flex flex-wrap items-center gap-3">
          {redes.map((r) => (
            <a
              key={r.chave}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2.5 rounded-[var(--raio)] bg-black/50 px-4 text-sm text-white backdrop-blur-md transition-colors hover:bg-mb-red"
            >
              <Icon name={r.icone} className="size-4" />
              {r.nome}
              <span className="sr-only"> (abre numa nova janela)</span>
            </a>
          ))}
        </div>
      </Abertura>

      {/* ---------- Ficha e história ---------- */}
      <Seccao>
        <Numeros
          colunas={4}
          itens={[
            { valor: clube.fundacao ?? "?", texto: clube.fundacao ? t(textos.fichaRotuloFundacao) : t(textos.fichaRotuloFundacaoFalta) },
            {
              valor: <span className="block text-xl hyphens-auto break-words md:text-2xl lg:text-3xl">{clube.provincia || "Angola"}</span>,
              texto: clube.cidade || t(textos.fichaRotuloSedeFalta),
            },
            {
              valor: <span className="block text-xl hyphens-auto break-words md:text-2xl lg:text-3xl">{tipo}</span>,
              texto: t(textos.fichaRotuloTipo),
            },
            { valor: clube.actividades.length, texto: t(textos.fichaRotuloActividades) },
          ]}
        />

        <div className={`mt-14 grid gap-12 ${perfil ? "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16" : ""}`}>
          <div>
            <div className="flex items-center gap-4">
              <Monograma nome={clube.nome} cor={clube.cor} className="size-16 text-xl" />
              <div className="min-w-0">
                <p className="text-sm text-white/80">{tp(textos.fichaSobre)}</p>
                <h2 className={perfil ? "titulo-3 mt-1" : "titulo-4 mt-1"}>{perfil ? t(textos.fichaHistoria) : clube.nome}</h2>
              </div>
            </div>
            <Historia paragrafos={historia} />
          </div>

          {perfil && (
            <aside aria-label={`O ${termo} em resumo`} className="space-y-[var(--intervalo)] self-start">
              {/* A ficha curta da base de dados, que o perfil alargado não repete por inteiro. */}
              <div className="painel painel-escuro p-6">
                <p className="text-sm text-mb-red-light">{t(textos.fichaPoucasPalavras)}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-white/85">{clube.descricao}</p>
              </div>

              {perfil.lema && (
                <figure className="flex min-h-48 flex-col rounded-[var(--raio)] bg-mb-red p-6 lg:p-8">
                  <figcaption className="text-sm text-white/85">{tp(textos.fichaLema)}</figcaption>
                  <blockquote className="titulo-4 mt-auto pt-10 text-balance">«{perfil.lema}»</blockquote>
                </figure>
              )}

              {perfil.numeros && perfil.numeros.length > 0 && (
                <Numeros
                  itens={perfil.numeros.map((n) => ({
                    valor: n.valor,
                    texto: n.rotulo,
                    nota: fonte(n.fonte) && <LigacaoFonte fonte={fonte(n.fonte)} prefixo={prefixoFonte} />,
                  }))}
                />
              )}

              {(perfil.estilo || perfil.motas) && (
                <dl className="painel painel-escuro space-y-5 p-6">
                  {perfil.estilo && (
                    <div>
                      <dt className="text-sm text-mb-red-light">{t(textos.fichaEstilo)}</dt>
                      <dd className="mt-1.5 text-[15px] leading-relaxed text-white/85">{perfil.estilo}</dd>
                    </div>
                  )}
                  {perfil.motas && (
                    <div>
                      <dt className="text-sm text-mb-red-light">{t(textos.fichaMotas)}</dt>
                      <dd className="mt-1.5 text-[15px] leading-relaxed text-white/85">{perfil.motas}</dd>
                    </div>
                  )}
                </dl>
              )}
            </aside>
          )}
        </div>
      </Seccao>

      {/* ---------- O que fazem ---------- */}
      {clube.actividades.length > 0 && (
        <Seccao className="!pt-0">
          <h2 className="titulo-3">{t(textos.fichaActividades)}</h2>
          <ol className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
            {clube.actividades.map((a, i) => (
              <li key={a} className="painel painel-escuro flex min-h-36 flex-col p-5">
                <span aria-hidden className="grid size-9 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                  {i + 1}
                </span>
                <span className="mt-auto pt-8 text-lg leading-snug">{a}</span>
              </li>
            ))}
          </ol>
        </Seccao>
      )}

      {/* ---------- Percurso (cronologia) ---------- */}
      {perfil && perfil.destaques.length > 0 && (
        <Seccao className="!pt-0">
          <h2 className="titulo-3">{tp(textos.fichaPercurso)}</h2>
          <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-white/80">
            {cronologiaComFontes ? t(textos.fichaPercursoComFontes) : t(textos.fichaPercursoSemFontes)}
          </p>
          <ol className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
            {perfil.destaques.map((d, i) => (
              <li key={i} className="painel painel-escuro flex flex-col p-6">
                <span
                  className={`self-start rounded-[4px] px-2.5 py-1.5 text-sm font-semibold ${
                    d.ano ? "bg-mb-red text-white" : "bg-white/10 text-white/70"
                  }`}
                >
                  {d.ano ?? t(textos.fichaSemData)}
                </span>
                <h3 className="mt-8 text-lg font-semibold leading-snug">{d.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{d.texto}</p>
                {fonte(d.fonte) && (
                  <p className="mt-auto pt-5">
                    <LigacaoFonte fonte={fonte(d.fonte)} prefixo={prefixoFonte} />
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Seccao>
      )}

      {/* ---------- Viagens publicadas pelo clube ---------- */}
      {viagens && viagens.lista.length > 0 && (
        <Seccao className="!pt-0">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] lg:gap-16">
            <div>
              <Chip grande>
                <Globe />
              </Chip>
              <h2 className="titulo-3 mt-8">{viagens.titulo}</h2>
              <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-white/70">{viagens.nota}</p>
              {fonte(viagens.fonte) && (
                <p className="mt-4">
                  <LigacaoFonte fonte={fonte(viagens.fonte)} prefixo={prefixoFonte} />
                </p>
              )}
            </div>
            <div className="painel painel-escuro self-start p-2 md:p-4">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{viagens.titulo}</caption>
                <thead>
                  <tr className="text-xs text-white/75">
                    <th scope="col" className="px-3 py-3 font-normal">{t(textos.fichaViagensAno)}</th>
                    <th scope="col" className="px-3 py-3 font-normal">{t(textos.fichaViagensNome)}</th>
                    <th scope="col" className="px-3 py-3 text-right font-normal">{t(textos.fichaViagensKm)}</th>
                  </tr>
                </thead>
                <tbody>
                  {viagens.lista.map((v, i) => (
                    <tr key={`${i}-${v.ano}-${v.nome}`} className="border-t border-white/10 align-top">
                      <td className="px-3 py-3.5">
                        <span className="inline-block rounded-[4px] bg-mb-red px-2 py-1 text-xs font-semibold tabular-nums">
                          {v.ano}
                        </span>
                      </td>
                      <th scope="row" className="px-3 py-3.5 font-normal">
                        <span className="block text-[15px] font-semibold leading-snug text-white">{v.nome}</span>
                        <span className="mt-1 block leading-snug text-white/80">{v.percurso}</span>
                      </th>
                      <td className="px-3 py-3.5 text-right tabular-nums text-white/85">{v.km ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Seccao>
      )}

      {/* ---------- Encontros e adesão ---------- */}
      <Seccao className="!pt-0">
        <div className="grid gap-[var(--intervalo)] lg:grid-cols-2">
          <section aria-labelledby="encontros" className="painel painel-escuro p-6 lg:p-10">
            <TituloPainel id="encontros" icone={<CalendarDays />}>
              {t(textos.fichaEncontros)}
            </TituloPainel>
            {encontros.length > 0 ? (
              <ul className="mt-6 divide-y divide-white/10">
                {encontros.map((e) => (
                  <li key={e} className="py-4 text-[15px] leading-relaxed text-white/85 first:pt-0 last:pb-0">
                    {e}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-[15px] leading-relaxed text-white/70">{tp(textos.fichaEncontrosVazio)}</p>
            )}
          </section>

          <section aria-labelledby="aderir" className="painel painel-escuro p-6 lg:p-10">
            <TituloPainel id="aderir" icone={<UserPlus />}>
              {eMovimento(clube) ? t(textos.fichaAderirMovimento) : t(textos.fichaAderirClube)}
            </TituloPainel>
            {aderir && aderir.passos.length > 1 ? (
              <ol className="mt-6 space-y-4">
                {aderir.passos.map((p, i) => (
                  <li key={i} className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-4">
                    <span aria-hidden className="grid size-9 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                      {i + 1}
                    </span>
                    <span className="pt-1.5 text-[15px] leading-relaxed text-white/85">{p}</span>
                  </li>
                ))}
              </ol>
            ) : aderir?.passos.length === 1 ? (
              <p className="mt-6 text-[15px] leading-relaxed text-white/85">{aderir.passos[0]}</p>
            ) : (
              <p className="mt-6 text-[15px] leading-relaxed text-white/70">{tp(textos.fichaAderirVazio)}</p>
            )}
            {fonte(aderir?.fonte) && (
              <p className="mt-6">
                <LigacaoFonte fonte={fonte(aderir?.fonte)} prefixo={prefixoFonte} />
              </p>
            )}
          </section>
        </div>
      </Seccao>

      {/* ---------- Fontes ---------- */}
      {perfil && perfil.fontes.length > 0 && (
        <Seccao className="!pt-0">
          <section
            aria-labelledby="fontes"
            className="painel painel-escuro grid gap-10 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] lg:gap-16 lg:p-10"
          >
            <div>
              <TituloPainel id="fontes" icone={<BookOpen />}>
                {t(textos.fichaFontes)}
              </TituloPainel>
              <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-white/80">{tp(textos.fichaFontesNota)}</p>
              <Link
                href={`/contacto?assunto=${encodeURIComponent(`Correcção ao ${termo} ${clube.nome}`)}`}
                className="group mt-5 inline-flex items-center gap-2 text-sm"
              >
                <span className="sublinhado">{t(textos.fichaErro)}</span>
                <Seta className="size-3" />
              </Link>
            </div>
            <ol className="self-start">
              {perfil.fontes.map((f, i) => (
                <li key={`${i}-${f.url}`} className="border-t border-white/10 first:border-t-0">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-start gap-3 py-3 text-sm"
                  >
                    <span className="tabular-nums text-white/70">{i + 1}</span>
                    <span className="leading-relaxed text-white/80 transition-colors [overflow-wrap:anywhere] group-hover:text-white">
                      {f.nome}
                      <span className="sr-only"> (abre numa nova janela)</span>
                    </span>
                    <Seta className="mt-1 size-3 text-white/75" />
                  </a>
                </li>
              ))}
            </ol>
          </section>
        </Seccao>
      )}

      <Seccao className="!pt-0">
        <CartaoNumerado
          numero={<Mail className="size-5" aria-hidden />}
          sobretitulo={t(textos.fichaPaginaSobretitulo)}
          titulo={t(textos.fichaPaginaTitulo)}
        >
          {tp(textos.fichaPaginaTexto)}
          <span className="mt-6 flex flex-wrap gap-[var(--intervalo)]">
            <BotaoMB href={`/contacto?assunto=${encodeURIComponent(`Actualizar o ${termo} ${clube.nome}`)}`}>
              {t(textos.fichaPaginaBotao)}
            </BotaoMB>
            {clube.contacto && (
              <BotaoMB href={`mailto:${clube.contacto}`} externo variante="escuro">
                {tp(textos.fichaContactar)}
              </BotaoMB>
            )}
          </span>
        </CartaoNumerado>
      </Seccao>

      {outros.length > 0 && (
        <Seccao className="!pt-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="titulo-3">{t(textos.fichaOutros)}</h2>
            <Link href="/clubes" className="group inline-flex items-center gap-2 text-sm">
              <span className="sublinhado">{t(textos.fichaTodos)}</span>
              <Seta className="size-3" />
            </Link>
          </div>
          <div className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
            {outros.map((c) => (
              <CartaoClube key={c.slug} clube={c} />
            ))}
          </div>
        </Seccao>
      )}
    </PaginaInterior>
  );
}
