import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpen, CalendarDays, Globe, Mail, UserPlus, Users } from "lucide-react";
import { lerClube, lerClubes } from "@/lib/supabase/publico";
import { localClube } from "@/lib/motobox";
import { comResumo, perfilClube, type FonteClube } from "@/lib/clubes-perfis";
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await lerClube(slug);
  if (!c) return { title: "Clube não encontrado" };
  return {
    title: c.nome,
    description: (perfilClube(slug)?.resumo ?? c.descricao).slice(0, 160),
  };
}

/**
 * Ligação discreta para a fonte de um facto (cronologia, números, viagens).
 * Mostra só quem publicou ("Bikers of Africa", "Instagram"); o título inteiro
 * fica no `title` e na lista de fontes no fim da página.
 */
function LigacaoFonte({ fonte }: { fonte?: FonteClube }) {
  if (!fonte) return null;
  return (
    <a
      href={fonte.url}
      target="_blank"
      rel="noopener noreferrer"
      title={fonte.nome}
      className="text-xs text-white/50 underline decoration-white/25 underline-offset-2 transition-colors hover:text-white"
    >
      Fonte: {fonte.nome.split(":")[0]}
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

  const perfil = perfilClube(clube.slug);
  const redes = redesDoClube(clube);
  const tipo = nomeTipo(clube.tipo);
  // Um movimento (ex.: Lady Riders) não é um clube: os textos dizem "movimento".
  const termo = eMovimento(clube) ? "movimento" : "clube";
  const outros = (await lerClubes())
    .filter((c) => c.slug !== clube.slug)
    .sort((a, b) => Number(b.tipo === clube.tipo) - Number(a.tipo === clube.tipo))
    .slice(0, 3)
    .map(comResumo);

  // Os placeholders (lib/clubes-perfis.ts) não têm fonte: sem índice, não há ligação.
  const fonte = (i?: number) => (i === undefined ? undefined : perfil?.fontes[i]);
  const cronologiaComFontes = Boolean(perfil?.destaques.every((d) => fonte(d.fonte)));
  // Sem perfil alargado, a história é a descrição da base de dados (e a abertura, a primeira frase).
  const historia = perfil?.historia.length ? perfil.historia : [clube.descricao];
  const abertura = perfil?.resumo ?? primeiraFrase(clube.descricao);
  // O perfil completa o campo `encontros` da base de dados; o mesmo texto sai uma vez só.
  const encontros = [
    ...new Set([clube.encontros?.trim(), ...(perfil?.encontros ?? [])].filter((e): e is string => Boolean(e))),
  ];
  const aderir = perfil?.comoAderir;
  const viagens = perfil?.viagens;

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
            { valor: clube.fundacao ?? "?", texto: clube.fundacao ? "ano de fundação" : "fundação por confirmar" },
            {
              valor: <span className="block text-xl hyphens-auto break-words md:text-2xl lg:text-3xl">{clube.provincia || "Angola"}</span>,
              texto: clube.cidade || "sede por confirmar",
            },
            {
              valor: <span className="block text-xl hyphens-auto break-words md:text-2xl lg:text-3xl">{tipo}</span>,
              texto: `tipo de ${termo}`,
            },
            { valor: clube.actividades.length, texto: "actividades conhecidas" },
          ]}
        />

        <div className={`mt-14 grid gap-12 ${perfil ? "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16" : ""}`}>
          <div>
            <div className="flex items-center gap-4">
              <Monograma nome={clube.nome} cor={clube.cor} className="size-16 text-xl" />
              <div className="min-w-0">
                <p className="text-sm text-white/60">Sobre o {termo}</p>
                <h2 className={perfil ? "titulo-3 mt-1" : "titulo-4 mt-1"}>{perfil ? "A história" : clube.nome}</h2>
              </div>
            </div>
            <Historia paragrafos={historia} />
          </div>

          {perfil && (
            <aside aria-label={`O ${termo} em resumo`} className="space-y-[var(--intervalo)] self-start">
              {/* A ficha curta da base de dados, que o perfil alargado não repete por inteiro. */}
              <div className="painel painel-escuro p-6">
                <p className="text-sm text-mb-red-light">Em poucas palavras</p>
                <p className="mt-3 text-[15px] leading-relaxed text-white/85">{clube.descricao}</p>
              </div>

              {perfil.lema && (
                <figure className="flex min-h-48 flex-col rounded-[var(--raio)] bg-mb-red p-6 lg:p-8">
                  <figcaption className="text-sm text-white/85">Lema do {termo}</figcaption>
                  <blockquote className="titulo-4 mt-auto pt-10 text-balance">«{perfil.lema}»</blockquote>
                </figure>
              )}

              {perfil.numeros && perfil.numeros.length > 0 && (
                <Numeros
                  itens={perfil.numeros.map((n) => ({
                    valor: n.valor,
                    texto: n.rotulo,
                    nota: fonte(n.fonte) && <LigacaoFonte fonte={fonte(n.fonte)} />,
                  }))}
                />
              )}

              {(perfil.estilo || perfil.motas) && (
                <dl className="painel painel-escuro space-y-5 p-6">
                  {perfil.estilo && (
                    <div>
                      <dt className="text-sm text-mb-red-light">Estilo</dt>
                      <dd className="mt-1.5 text-[15px] leading-relaxed text-white/85">{perfil.estilo}</dd>
                    </div>
                  )}
                  {perfil.motas && (
                    <div>
                      <dt className="text-sm text-mb-red-light">Motas</dt>
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
          <h2 className="titulo-3">O que fazem</h2>
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
          <h2 className="titulo-3">Percurso do {termo}</h2>
          <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-white/65">
            {cronologiaComFontes
              ? `Os momentos que o ${termo} e a imprensa publicaram, por ordem, cada um com a sua fonte.`
              : `Os momentos que marcaram o ${termo}, por ordem.`}
          </p>
          <ol className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
            {perfil.destaques.map((d, i) => (
              <li key={i} className="painel painel-escuro flex flex-col p-6">
                <span
                  className={`self-start rounded-[4px] px-2.5 py-1.5 text-sm font-semibold ${
                    d.ano ? "bg-mb-red text-white" : "bg-white/10 text-white/70"
                  }`}
                >
                  {d.ano ?? "Sem data certa"}
                </span>
                <h3 className="mt-8 text-lg font-semibold leading-snug">{d.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{d.texto}</p>
                {fonte(d.fonte) && (
                  <p className="mt-auto pt-5">
                    <LigacaoFonte fonte={fonte(d.fonte)} />
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
                  <LigacaoFonte fonte={fonte(viagens.fonte)} />
                </p>
              )}
            </div>
            <div className="painel painel-escuro self-start p-2 md:p-4">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{viagens.titulo}</caption>
                <thead>
                  <tr className="text-xs text-white/50">
                    <th scope="col" className="px-3 py-3 font-normal">Ano</th>
                    <th scope="col" className="px-3 py-3 font-normal">Raide e países</th>
                    <th scope="col" className="px-3 py-3 text-right font-normal">km</th>
                  </tr>
                </thead>
                <tbody>
                  {viagens.lista.map((v) => (
                    <tr key={`${v.ano}-${v.nome}`} className="border-t border-white/10 align-top">
                      <td className="px-3 py-3.5">
                        <span className="inline-block rounded-[4px] bg-mb-red px-2 py-1 text-xs font-semibold tabular-nums">
                          {v.ano}
                        </span>
                      </td>
                      <th scope="row" className="px-3 py-3.5 font-normal">
                        <span className="block text-[15px] font-semibold leading-snug text-white">{v.nome}</span>
                        <span className="mt-1 block leading-snug text-white/60">{v.percurso}</span>
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
              Onde e quando se encontram
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
              <p className="mt-6 text-[15px] leading-relaxed text-white/70">
                O {termo} não publicou um ponto de encontro fixo. As próximas saídas costumam ser anunciadas nas redes do{" "}
                {termo}.
              </p>
            )}
          </section>

          <section aria-labelledby="aderir" className="painel painel-escuro p-6 lg:p-10">
            <TituloPainel id="aderir" icone={<UserPlus />}>
              {eMovimento(clube) ? "Como fazer parte" : "Como entrar no clube"}
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
              <p className="mt-6 text-[15px] leading-relaxed text-white/70">
                O {termo} não publicou regras de adesão. Pergunte directamente nas redes do {termo}.
              </p>
            )}
            {fonte(aderir?.fonte) && (
              <p className="mt-6">
                <LigacaoFonte fonte={fonte(aderir?.fonte)} />
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
                Fontes
              </TituloPainel>
              <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-white/65">
                Reportagens e páginas públicas do {termo} consultadas em Outubro de 2026. Os dados sem fonte ao lado
                são indicativos e podem mudar.
              </p>
              <Link
                href={`/contacto?assunto=${encodeURIComponent(`Correcção ao ${termo} ${clube.nome}`)}`}
                className="group mt-5 inline-flex items-center gap-2 text-sm"
              >
                <span className="sublinhado">Viu um erro? Escreva-nos</span>
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
                    <span className="tabular-nums text-white/40">{i + 1}</span>
                    <span className="leading-relaxed text-white/80 transition-colors [overflow-wrap:anywhere] group-hover:text-white">
                      {f.nome}
                      <span className="sr-only"> (abre numa nova janela)</span>
                    </span>
                    <Seta className="mt-1 size-3 text-white/50" />
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
          sobretitulo="Esta página é sua?"
          titulo="Ajude-nos a completar a ficha"
        >
          A informação vem das páginas públicas do {termo} e a fotografia de capa é ilustrativa. Se faz parte do{" "}
          {clube.nome}, envie-nos o logótipo, fotografias vossas, a sede e as datas dos próximos passeios.
          <span className="mt-6 flex flex-wrap gap-[var(--intervalo)]">
            <BotaoMB href={`/contacto?assunto=${encodeURIComponent(`Actualizar o ${termo} ${clube.nome}`)}`}>
              Falar com a MotoBox
            </BotaoMB>
            {clube.contacto && (
              <BotaoMB href={`mailto:${clube.contacto}`} externo variante="escuro">
                Contactar o {termo}
              </BotaoMB>
            )}
          </span>
        </CartaoNumerado>
      </Seccao>

      {outros.length > 0 && (
        <Seccao className="!pt-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="titulo-3">Outros clubes</h2>
            <Link href="/clubes" className="group inline-flex items-center gap-2 text-sm">
              <span className="sublinhado">Todos os clubes</span>
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
