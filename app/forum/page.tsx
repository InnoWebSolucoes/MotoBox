import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import type { ReactNode } from "react";
import {
  Flame, HelpCircle, MessagesSquare, PenSquare, Search, Sparkles, Trophy, X,
} from "lucide-react";
import { lerCategoriasForum, lerTopicos } from "@/lib/supabase/publico";
import { lerDoc } from "@/lib/conteudo";
import { comPadrao, FORUM_PADRAO, type ConteudoForum } from "@/lib/conteudo/grupos/comunidade";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { FotoFundo, ordem as ordemAnim } from "@/components/painel/kit";
import { Pilulas } from "@/components/painel/blocos";
import { CartaoDestaque, CartaoTopico } from "@/components/forum/CartaoTopico";
import {
  BotaoCriar, QuadroCategorias, QuadroContribuidores, QuadroLigacoes, QuadroNiveis, QuadroRegras, QuadroSobre,
} from "@/components/forum/Lateral";
import { MeusTopicos } from "@/components/forum/MeusTopicos";
import { VotosProvider } from "@/components/forum/Votos";
import { corOu, eOrdem, type CategoriaCartao, type Ordem } from "@/components/forum/tipos";
import { montarForum, ordenar } from "./_servidor/forum";

/* ============================================================
   MOTOBOX — Fórum
   Uma comunidade como as do Reddit, no desenho do painel: os
   tópicos fixados pela equipa no topo, e a lista com votos, por
   ordem de "Em alta", "Novos", "Mais votados" ou "Sem resposta",
   filtrada por categoria e pela procura. Ao lado: sobre o fórum,
   os meus tópicos, os mais activos do mês, as categorias, os
   níveis, as regras e as ligações para o resto da comunidade.
   Os textos editam-se em Gestão › Fórum › Página Fórum.
   ============================================================ */

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

const POR_PAGINA = 20;

/** Os textos da página, editáveis no painel (Fórum → Página Fórum). */
const lerTextos = async () => comPadrao(await lerDoc<ConteudoForum>("paginas.forum"), FORUM_PADRAO);

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await lerTextos();
  return { title: seo.titulo, description: seo.descricao };
}

type Params = { categoria?: string; ordem?: string; q?: string; mais?: string };

/** Endereço da lista com estes filtros (a ordem "Em alta" é a de partida e não aparece). */
function endereco(p: { categoria?: string; ordem?: Ordem; q?: string; mais?: number }) {
  const u = new URLSearchParams();
  if (p.categoria) u.set("categoria", p.categoria);
  if (p.ordem && p.ordem !== "alta") u.set("ordem", p.ordem);
  if (p.q) u.set("q", p.q);
  if (p.mais) u.set("mais", String(p.mais));
  const s = u.toString();
  return s ? `/forum?${s}` : "/forum";
}

const semAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default async function Forum({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const [topicos, categoriasBase, t] = await Promise.all([lerTopicos(), lerCategoriasForum(), lerTextos()]);
  const { abertura, lista: tl, lateral } = t;
  const forum = await montarForum(topicos, categoriasBase, t);

  const categorias: CategoriaCartao[] = categoriasBase.map((c) => ({ slug: c.slug, nome: c.nome, cor: corOu(c.cor), icone: c.icone }));
  const activa = categoriasBase.find((c) => c.slug === params.categoria);
  const ordem: Ordem = eOrdem(params.ordem) ? params.ordem : "alta";
  const q = (params.q ?? "").trim().slice(0, 80);
  const mais = Math.min(9, Math.max(0, Number.parseInt(params.mais ?? "0", 10) || 0));

  let escolhidos = activa ? forum.cartoes.filter((c) => c.categoria?.slug === activa.slug) : forum.cartoes;
  if (q) {
    const termos = semAcentos(q).split(/\s+/).filter(Boolean);
    escolhidos = escolhidos.filter((c) => {
      const texto = semAcentos(`${c.titulo} ${c.excerto} ${c.autor.nome} ${c.categoria?.nome ?? ""}`);
      return termos.every((x) => texto.includes(x));
    });
  }
  // Os fixados ficam no topo, em destaque (menos numa procura, onde entram na lista).
  const destaques = q ? [] : escolhidos.filter((c) => c.fixado);
  const ordenados = ordenar(q ? escolhidos : escolhidos.filter((c) => !c.fixado), ordem);
  const visiveis = ordenados.slice(0, POR_PAGINA * (mais + 1));
  const haMais = ordenados.length > visiveis.length;
  const contar = (slug: string) => forum.cartoes.filter((c) => c.categoria?.slug === slug).length;
  // O botão da abertura levava a /conta antes de haver "Criar tópico".
  const ligacaoBotao = !abertura.botaoLigacao || abertura.botaoLigacao === "/conta" ? "/forum/novo" : abertura.botaoLigacao;

  const ordens: { chave: Ordem; texto: string; icone: ReactNode }[] = [
    { chave: "alta", texto: tl.emAlta, icone: <Flame className="size-4" aria-hidden /> },
    { chave: "novos", texto: tl.novos, icone: <Sparkles className="size-4" aria-hidden /> },
    { chave: "votados", texto: tl.maisVotados, icone: <Trophy className="size-4" aria-hidden /> },
    { chave: "sem-resposta", texto: tl.semResposta, icone: <HelpCircle className="size-4" aria-hidden /> },
  ];

  return (
    <PaginaInterior icone={<MessagesSquare />}>
      {/* Abertura curta: o fórum começa logo por baixo, sem rolar muito. */}
      <header className="relative isolate overflow-hidden">
        <FotoFundo nome={abertura.foto} veu="esquerda" prioridade tamanhos="100vw" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/25 to-black/10" aria-hidden />
        <div className="coluna pb-8 pt-28 [text-shadow:0_1px_14px_rgb(0_0_0/0.5)] lg:pb-10 lg:pt-32">
          {abertura.sobretitulo && <p className="sobretitulo surgir text-white" style={ordemAnim(0)}>{abertura.sobretitulo}</p>}
          <h1 className="titulo-1 surgir mt-3 text-white" style={ordemAnim(1)}>{abertura.titulo}</h1>
          {abertura.texto && <p className="texto-lead surgir mt-4 max-w-[52ch] text-white" style={ordemAnim(2)}>{abertura.texto}</p>}
          <div className="surgir mt-6 flex flex-wrap items-center gap-x-6 gap-y-4" style={ordemAnim(3)}>
            {abertura.botao && (
              <Link
                href={ligacaoBotao}
                className="inline-flex h-12 items-center gap-2.5 rounded-[var(--raio)] bg-mb-red px-5 text-[15px] font-semibold text-white [text-shadow:none] transition-colors hover:bg-mb-red-dark"
              >
                <PenSquare className="size-[18px]" aria-hidden />
                <span>{abertura.botao}</span>
              </Link>
            )}
            {t.numeros.mostrar && (
              <dl className="flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-white">
                {[
                  [forum.totais.topicos, t.numeros.topicos],
                  [forum.totais.respostas, t.numeros.respostas],
                  [forum.totais.membros, t.numeros.membros],
                ].map(([n, rotulo]) => (
                  <div key={String(rotulo)} className="flex flex-row-reverse items-baseline gap-1.5">
                    <dt>{rotulo}</dt>
                    <dd className="text-lg font-semibold tabular-nums">{Number(n).toLocaleString("pt-PT")}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </header>

      <div className="coluna pb-20 pt-6 lg:pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-8">
          <div className="flex min-w-0 flex-col gap-[var(--intervalo)]">
            {/* Convite a participar, como a caixa "criar publicação" do Reddit. */}
            <Link
              href={activa ? `/forum/novo?categoria=${encodeURIComponent(activa.slug)}` : "/forum/novo"}
              className="painel painel-escuro group flex items-center gap-3 p-3 transition-shadow hover:ring-1 hover:ring-white/25 sm:p-4"
            >
              <span aria-hidden className="chip-mb"><PenSquare /></span>
              <span className="min-w-0 flex-1 rounded-[4px] bg-white/[0.08] px-3 py-2.5 text-[15px] leading-snug text-white/90 ring-1 ring-inset ring-white/10 group-hover:bg-white/[0.12]">
                {tl.convite}
              </span>
              <span className="hidden h-10 shrink-0 items-center rounded-[4px] bg-mb-red px-4 text-sm font-semibold text-white transition-colors group-hover:bg-mb-red-dark sm:inline-flex">
                {tl.criar}
              </span>
            </Link>

            {/* Ordem e procura */}
            <div className="painel painel-escuro flex flex-col gap-3 p-2 sm:p-2.5 md:flex-row md:items-center md:justify-between">
              <nav aria-label={tl.ordenar} className="grid grid-cols-2 gap-1 sm:flex">
                {ordens.map((o) => (
                  <Link
                    key={o.chave}
                    href={endereco({ categoria: activa?.slug, ordem: o.chave, q })}
                    scroll={false}
                    aria-current={o.chave === ordem ? "page" : undefined}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[4px] bg-white/[0.06] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/12 aria-[current=page]:bg-mb-red sm:bg-transparent"
                  >
                    {o.icone}
                    <span>{o.texto}</span>
                  </Link>
                ))}
              </nav>
              <Form action="/forum" scroll={false} role="search" className="flex min-w-0 gap-1 md:w-72">
                {activa && <input type="hidden" name="categoria" value={activa.slug} />}
                {ordem !== "alta" && <input type="hidden" name="ordem" value={ordem} />}
                <label htmlFor="procurar-forum" className="sr-only">{tl.procurar}</label>
                <input
                  id="procurar-forum"
                  name="q"
                  type="search"
                  defaultValue={q}
                  placeholder={tl.procurar}
                  className="h-10 min-w-0 flex-1 rounded-[4px] bg-white/[0.08] px-3 text-[15px] text-white ring-1 ring-inset ring-white/12 placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-mb-red-light"
                />
                <button type="submit" className="grid size-10 shrink-0 place-items-center rounded-[4px] bg-white/12 text-white transition-colors hover:bg-white/20" aria-label={tl.procurarBotao}>
                  <Search className="size-4" aria-hidden />
                </button>
              </Form>
            </div>

            <div className="min-w-0 py-2">
              <Pilulas
                rotulo="Categorias do fórum"
                activa={activa?.slug ?? "todas"}
                itens={[
                  { chave: "todas", texto: tl.todas, href: endereco({ ordem, q }) },
                  ...categorias.map((c) => ({ chave: c.slug, texto: c.nome, href: endereco({ categoria: c.slug, ordem, q }) })),
                ]}
              />
            </div>

            {activa?.descricao && (
              <p className="px-1 pb-2 text-[15px] leading-relaxed text-white">{activa.descricao}</p>
            )}

            {q && (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-2 text-[15px] text-white">
                <span>
                  <span>{tl.resultadosPara}</span>{" "}
                  <strong className="font-semibold">«{q}»</strong>
                  <span className="text-white/85">{` · ${ordenados.length}`}</span>
                </span>
                <Link href={endereco({ categoria: activa?.slug, ordem })} scroll={false} className="inline-flex items-center gap-1 rounded-[4px] bg-white/10 px-2 py-1 text-sm font-medium text-white hover:bg-white/20">
                  <X className="size-3.5" aria-hidden />
                  <span>{tl.limpar}</span>
                </Link>
              </p>
            )}

            <VotosProvider ids={[...destaques, ...visiveis].map((c) => c.id)}>
              {destaques.length > 0 && (
                <section aria-labelledby="destaques" className="pb-3">
                  <h2 id="destaques" className="px-1 pb-2 text-sm font-semibold uppercase tracking-[0.14em] text-white">{tl.destaques}</h2>
                  <ul className={`grid gap-[var(--intervalo)] ${destaques.length > 1 ? "sm:grid-cols-2" : ""}`}>
                    {destaques.map((c) => (
                      <li key={c.id}><CartaoDestaque topico={c} textos={t} /></li>
                    ))}
                  </ul>
                </section>
              )}

              {visiveis.length > 0 ? (
                <ol className="grid gap-[var(--intervalo)]">
                  {visiveis.map((c) => (
                    <li key={c.id}><CartaoTopico topico={c} textos={t} /></li>
                  ))}
                </ol>
              ) : (
                <Vazio
                  titulo={q ? tl.procuraVaziaTitulo : ordem === "sem-resposta" && escolhidos.length ? tl.semRespostaVazioTitulo : tl.vazioTitulo}
                  texto={q ? tl.procuraVaziaTexto : ordem === "sem-resposta" && escolhidos.length ? tl.semRespostaVazioTexto : tl.vazioTexto}
                  botao={escolhidos.length || q ? tl.criar : tl.vazioBotao}
                  categoria={activa?.slug}
                  icone={ordem === "sem-resposta" && !q ? "check" : "chat"}
                />
              )}
            </VotosProvider>

            {haMais && (
              <Link
                href={endereco({ categoria: activa?.slug, ordem, q, mais: mais + 1 })}
                scroll={false}
                className="painel painel-escuro mt-1 flex h-12 items-center justify-center text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                {tl.verMais}
              </Link>
            )}
          </div>

          <aside className="grid content-start gap-[var(--intervalo)]">
            <QuadroSobre textos={t} totais={forum.totais} categoria={activa?.slug} />
            <MeusTopicos titulo={lateral.meusTitulo} vazio={lateral.meusVazio} aguarda={lateral.meusAguarda} criar={lateral.criar} />
            <QuadroContribuidores textos={t} lista={forum.contribuidores} />
            <QuadroCategorias titulo={lateral.categorias} categorias={categorias} contar={contar} activa={activa?.slug} />
            <QuadroNiveis textos={t} />
            <QuadroRegras textos={t} />
            <QuadroLigacoes textos={t} />
          </aside>
        </div>
      </div>
    </PaginaInterior>
  );
}

/** Lista vazia: um convite claro a participar, com o botão de criar tópico. */
function Vazio({
  titulo, texto, botao, categoria, icone,
}: { titulo: string; texto: string; botao: string; categoria?: string; icone: string }) {
  return (
    <div className="painel painel-escuro flex flex-col items-start gap-4 p-6 sm:p-8">
      <span aria-hidden className="chip-mb chip-mb-lg">
        {icone === "check" ? <Sparkles /> : <MessagesSquare />}
      </span>
      <div>
        <p className="titulo-4 text-white">{titulo}</p>
        <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-white/90">{texto}</p>
      </div>
      <BotaoCriar texto={botao} categoria={categoria} className="max-w-xs" />
    </div>
  );
}
