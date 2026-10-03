import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Icon, PageHero } from "@/components/ui";
import { formatData } from "@/lib/data";
import { lerCategoriasForum, lerTopicos } from "@/lib/supabase/publico";
import { contarMembros } from "@/lib/forum/contagens";
import type { TopicoForum } from "@/lib/types";
import { Discussoes } from "./Discussoes";
import { RegrasForum } from "./Partes";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Fórum",
  description:
    "O fórum da comunidade motard angolana: competição, mecânica, passeios, equipamento e conversa geral.",
};

/*
 * Cor só no vermelho da marca, e pouco: o botão "Novo tópico", o marcador de
 * fixado e o hover. As categorias têm um campo `cor` na base, mas aqui ficam
 * todas neutras; só os avatares mantêm a cor de cada pessoa.
 *
 * Cada pedaço de texto fica no seu próprio nó (separadores à parte): é assim
 * que o `TraduzirPagina` o encontra em `interface-en.ts`.
 */

/** Milissegundos de uma data, ou 0. */
const tempo = (iso: string | undefined) => (iso ? new Date(iso).getTime() || 0 : 0);

export default async function ForumPage() {
  const [topicos, categoriasForum, membros] = await Promise.all([
    lerTopicos(), lerCategoriasForum(), contarMembros(),
  ]);

  // Números contados nos tópicos publicados, não nos contadores guardados nas
  // categorias (que vieram dos dados de demonstração). Cada tópico conta como
  // uma mensagem, mais as respostas.
  const porCategoria = new Map<string, { topicos: number; mensagens: number }>();
  for (const t of topicos) {
    const c = porCategoria.get(t.categoriaSlug) ?? { topicos: 0, mensagens: 0 };
    porCategoria.set(t.categoriaSlug, { topicos: c.topicos + 1, mensagens: c.mensagens + t.respostas + 1 });
  }
  const totalTopicos = topicos.length;
  const totalMensagens = topicos.reduce((s, t) => s + t.respostas + 1, 0);

  // Quem abriu mais tópicos, entre os que estão à vista.
  const activos = [...topicos.reduce((m, t) => m.set(t.autor, {
    n: t.autor, c: t.avatarCor, m: (m.get(t.autor)?.m ?? 0) + 1,
  }), new Map<string, { n: string; c: string; m: number }>()).values()]
    .filter((a) => a.n)
    .sort((a, b) => b.m - a.m || a.n.localeCompare(b.n))
    .slice(0, 5);

  // Os filtros correm no navegador; a linha de cada tópico já vai desenhada daqui.
  // A actividade é a última resposta guardada (`em`) ou, sem ela, o dia em que abriu.
  const discussoes = topicos.map((t) => ({
    id: t.id,
    categoria: t.categoriaSlug,
    fixado: Boolean(t.fixado),
    respostas: t.respostas,
    visualizacoes: t.visualizacoes,
    actividade: Math.max(tempo((t.ultimaResposta as { em?: string }).em), tempo(t.criado)),
    linha: <TopicoLinha topico={t} />,
  }));

  return (
    <>
      <PageHero
        imagem="forum"
        eyebrow="Comunidade"
        titulo="Fórum"
        descricao="O sítio onde a comunidade motard angolana fala. Dúvidas de mecânica, organização de passeios, análise das corridas e tudo o resto."
      >
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
          <ButtonLink href="/forum/novo" size="lg">
            <Icon name="plus" className="size-4" />
            Novo tópico
          </ButtonLink>
          <p className="flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-ink-400">
            <span>
              <strong className="font-ui text-lg text-white">{totalTopicos.toLocaleString("pt-PT")}</strong>{" "}
              {totalTopicos === 1 ? "tópico" : "tópicos"}
            </span>
            <span>
              <strong className="font-ui text-lg text-white">{totalMensagens.toLocaleString("pt-PT")}</strong>{" "}
              {totalMensagens === 1 ? "mensagem" : "mensagens"}
            </span>
            {/* Contas confirmadas no site; sem base de dados não há número a mostrar. */}
            {membros !== null && (
              <span>
                <strong className="font-ui text-lg text-white">{membros.toLocaleString("pt-PT")}</strong>{" "}
                {membros === 1 ? "membro" : "membros"}
              </span>
            )}
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-20 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-20">
            {/* Categorias */}
            <section aria-labelledby="forum-categorias">
              <h2 id="forum-categorias" className="font-display text-2xl uppercase text-white">
                Categorias
              </h2>
              <ul className="mt-6 grid gap-x-12 sm:grid-cols-2">
                {categoriasForum.map((c) => {
                  const n = porCategoria.get(c.slug) ?? { topicos: 0, mensagens: 0 };
                  return (
                  <li key={c.slug} className="border-t border-white/6">
                    {/* Âncora simples, não Link: muda o hash e a lista de discussões filtra por ele. */}
                    <a href={`#${c.slug}`} className="group flex items-start gap-4 py-5 sm:py-6">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-800 text-ink-200">
                        <Icon name={c.icone} className="size-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-ui text-lg leading-tight text-white transition-colors group-hover:text-mb-red">
                          {c.nome}
                        </span>
                        <span className="mt-1.5 block text-[15px] leading-relaxed text-ink-400">{c.descricao}</span>
                        <span className="mt-2 flex flex-wrap gap-x-2 text-sm text-ink-500">
                          <span>{n.topicos.toLocaleString("pt-PT")} {n.topicos === 1 ? "tópico" : "tópicos"}</span>
                          <Ponto />
                          <span>{n.mensagens.toLocaleString("pt-PT")} {n.mensagens === 1 ? "mensagem" : "mensagens"}</span>
                        </span>
                      </span>
                    </a>
                  </li>
                  );
                })}
              </ul>
            </section>

            {/* Discussões: recentes (as fixadas primeiro), populares ou sem resposta */}
            <section aria-labelledby="forum-discussoes">
              <Discussoes itens={discussoes} categorias={categoriasForum.map((c) => ({ slug: c.slug, nome: c.nome }))} />
            </section>
          </div>

          {/* Barra lateral: por baixo da lista em ecrãs pequenos */}
          <aside className="space-y-14">
            <section className="card p-6">
              <h2 className="font-display text-lg uppercase text-white">Participar</h2>
              <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
                Para publicar e responder precisa de uma conta Motobox. É gratuita e leva um minuto.
              </p>
              <div className="mt-5 flex flex-col gap-1.5">
                <ButtonLink href="/conta" variant="light" className="w-full">
                  Criar conta
                </ButtonLink>
                <ButtonLink href="/entrar?destino=/forum" variant="ghost" className="w-full">
                  Já tenho conta
                </ButtonLink>
              </div>
            </section>

            <RegrasForum />

            {activos.length > 0 && (
            <section>
              <h2 className="eyebrow text-ink-400">Membros activos</h2>
              <p className="mt-1 text-xs text-ink-600">Tópicos abertos</p>
              <ul className="mt-3">
                {activos.map((m) => (
                  <li key={m.n} className="flex items-center gap-3 border-b border-white/6 py-3 last:border-0">
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-full font-display text-[10px] text-white"
                      style={{ background: m.c }}
                      aria-hidden
                    >
                      {m.n.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] text-ink-200">{m.n}</span>
                    <span className="text-sm text-ink-500 tabular-nums">{m.m}</span>
                  </li>
                ))}
              </ul>
            </section>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

/** Separador discreto entre pedaços de uma linha de metadados. */
function Ponto() {
  return (
    <span aria-hidden className="text-ink-600">
      ·
    </span>
  );
}

function TopicoLinha({ topico: t }: { topico: TopicoForum }) {
  return (
    <li className="border-b border-white/6">
      <Link href={`/forum/${t.id}`} className="group flex items-start gap-4 py-6 sm:gap-5 sm:py-7">
        <span
          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full font-display text-[11px] text-white sm:size-10 sm:text-xs"
          style={{ background: t.avatarCor }}
          aria-hidden
        >
          {t.autorAvatar}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold leading-snug text-white transition-colors group-hover:text-mb-red sm:text-lg">
            {t.titulo}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-ink-400">{t.excerto}</p>

          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500">
            {t.fixado && (
              <>
                <span className="inline-flex items-center gap-1 text-mb-red">
                  <Icon name="pin" className="size-3.5" />
                  Fixado
                </span>
                <Ponto />
              </>
            )}
            {t.resolvido && (
              <>
                <span className="inline-flex items-center gap-1 text-ink-300">
                  <Icon name="check" className="size-3.5" />
                  Resolvido
                </span>
                <Ponto />
              </>
            )}
            {t.bloqueado && (
              <>
                <span className="inline-flex items-center gap-1">
                  <Icon name="lock" className="size-3.5" />
                  Fechado
                </span>
                <Ponto />
              </>
            )}
            <span className="text-ink-300">{t.categoria}</span>
            <Ponto />
            <span>{t.autor}</span>
            <Ponto />
            <span>{formatData(t.criado, { day: "2-digit", month: "short" })}</span>
            {t.ultimaResposta.quando && (
              <span className="hidden sm:contents">
                <Ponto />
                <span>última resposta</span>
                <span>{t.ultimaResposta.quando}</span>
              </span>
            )}
            {/* Em ecrã pequeno a contagem de respostas não tem coluna própria. */}
            <span className="contents sm:hidden">
              <Ponto />
              <span>{t.respostas} respostas</span>
            </span>
          </p>
        </div>

        <div className="hidden w-20 shrink-0 pt-0.5 text-right sm:block">
          <p className="font-display text-2xl leading-none text-white tabular-nums">{t.respostas}</p>
          <p className="mt-1.5 text-xs text-ink-500">respostas</p>
        </div>
      </Link>
    </li>
  );
}
