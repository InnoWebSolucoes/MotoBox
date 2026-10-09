import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { Icon } from "@/components/ui";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Denunciar } from "@/components/Denunciar";
import { formatData } from "@/lib/data";
import { lerDefinicoes, lerTopico, lerTopicos } from "@/lib/supabase/publico";
import { lerRespostas } from "@/lib/forum/respostas";
import { lerDoc } from "@/lib/conteudo";
import { comPadrao, FORUM_PADRAO, type ConteudoForum } from "@/lib/conteudo/grupos/comunidade";
import { CaixaResposta, DiscussaoProvider, ItemResposta, RespostasNovas } from "./Respostas";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Tópicos criados depois do build são gerados no primeiro pedido
// (`dynamicParams` fica no valor por omissão, `true`).
export async function generateStaticParams() {
  const topicos = await lerTopicos();
  return topicos.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await lerTopico(id);
  if (!t) return { title: "Tópico não encontrado" };
  return { title: t.titulo, description: t.excerto };
}

/*
 * Uma só cor de destaque (o vermelho, no marcador de fixado, no botão de
 * publicar e no hover); estados em texto discreto; só os avatares têm cor.
 * Cada pedaço de texto fica no seu nó para o `TraduzirPagina` o encontrar.
 */

export default async function TopicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topico = await lerTopico(id);
  if (!topico) notFound();

  const [todos, respostas, definicoes, textos] = await Promise.all([
    lerTopicos(), lerRespostas(topico.id), lerDefinicoes(),
    // Textos fixos da página, editáveis no painel (Fórum → Página Fórum).
    lerDoc<ConteudoForum>("paginas.forum").then((d) => comPadrao(d, FORUM_PADRAO)),
  ]);
  const tt = textos.topico;
  const tl = textos.lista;
  const relacionados = todos
    .filter((t) => t.id !== topico.id && t.categoriaSlug === topico.categoriaSlug)
    .slice(0, 4);

  return (
    <PaginaInterior icone={<MessagesSquare />}>
    <div className="coluna pb-16 pt-28 lg:pt-32">
      <Link
        href="/forum"
        className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white transition-colors"
      >
        <span aria-hidden>←</span> {tt.voltar}
      </Link>

      <div className="mt-8 grid gap-16 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-20">
        <div className="min-w-0">
          {/* Cabeçalho do tópico */}
          <header>
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-400">
              <span className="font-ui text-base text-ink-200">{topico.categoria}</span>
              {topico.fixado && (
                <>
                  <Ponto />
                  <span className="inline-flex items-center gap-1 text-mb-red">
                    <Icon name="pin" className="size-3.5" />
                    {tl.fixado}
                  </span>
                </>
              )}
              {topico.resolvido && (
                <>
                  <Ponto />
                  <span className="inline-flex items-center gap-1 text-ink-200">
                    <Icon name="check" className="size-3.5" />
                    {tl.resolvido}
                  </span>
                </>
              )}
              {topico.bloqueado && (
                <>
                  <Ponto />
                  <span className="inline-flex items-center gap-1">
                    <Icon name="lock" className="size-3.5" />
                    {tl.fechado}
                  </span>
                </>
              )}
            </p>

            <h1 className="mt-3 font-display text-3xl uppercase leading-[1.05] text-white sm:text-4xl lg:text-[2.75rem]">
              {topico.titulo}
            </h1>

            <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-500">
                            <span>{topico.visualizacoes.toLocaleString("pt-PT")}{` ${tt.visualizacoes}`}</span>
              <Ponto />
              <span>{formatData(topico.criado)}</span>
            </p>
          </header>

          {/* Mensagem original */}
          {/* No telemóvel o texto ocupa a largura toda; no computador alinha com o nome. */}
          <article className="mt-10 border-t border-white/6 pt-8">
            <div className="flex items-center gap-3 sm:gap-5">
              <Avatar cor={topico.avatarCor} texto={topico.autorAvatar} className="size-10 text-xs sm:size-12 sm:text-sm" />
              <div className="min-w-0">
                <p className="truncate font-ui text-lg leading-tight text-white">{topico.autor}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-2 text-sm text-ink-500">
                  <span>{tt.autorDoTopico}</span>
                  <Ponto />
                  <span>{formatData(topico.criado, { day: "2-digit", month: "long", year: "numeric" })}</span>
                </p>
              </div>
            </div>
            <div className="mt-4 sm:pl-[4.25rem]">
              <p className="text-lg leading-relaxed text-ink-100">{topico.excerto}</p>
              <Accoes nomes={["Gosto", "Citar", "Partilhar"]} topicoId={topico.id} reportar={tt.reportar} />
            </div>
          </article>

          {/* Respostas: as de exemplo, as dos membros e as acabadas de publicar */}
          <DiscussaoProvider>
            <section aria-labelledby="respostas" className="mt-14">
              <h2 id="respostas" className="border-b border-white/8 pb-4 text-xl font-semibold text-white">
                {`${respostas.length} ${respostas.length === 1 ? tt.respostaSingular : tt.respostaPlural}`}
              </h2>
              {respostas.length === 0 && (
                <p className="py-8 text-[15px] text-white/60">{tt.semRespostas}</p>
              )}

              <ol>
                {respostas.map((r) => (
                  <ItemResposta key={r.id} resposta={r} topicoId={topico.id} reportar={tt.reportar} />
                ))}
              </ol>
              <RespostasNovas idsServidor={respostas.map((r) => r.id)} topicoId={topico.id} reportar={tt.reportar} />
            </section>

            {/* Caixa de resposta: sempre a última coisa da discussão */}
            <section className="mt-12">
              {topico.bloqueado ? (
                <Fechado titulo={tt.fechadoTitulo} texto={tt.fechadoTexto} />
              ) : !definicoes.forumAberto ? (
                <Fechado titulo={tt.forumFechadoTitulo} texto={tt.forumFechadoTexto} />
              ) : (
                <CaixaResposta topicoId={topico.id} textos={textos.resposta} />
              )}
            </section>
          </DiscussaoProvider>
        </div>

        {/* Relacionados: coluna ao lado no computador, por baixo no telemóvel */}
        {relacionados.length > 0 && (
          <aside aria-labelledby="relacionados" className="lg:pt-1">
            <h2 id="relacionados" className="eyebrow text-ink-400">
              {tt.relacionados}
            </h2>
            <ul className="mt-3">
              {relacionados.map((t) => (
                <li key={t.id} className="border-b border-white/6 last:border-0">
                  <Link href={`/forum/${t.id}`} className="group block py-4">
                    <span className="block text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-mb-red-light">
                      {t.titulo}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-x-2 text-sm text-ink-500">
                      <span>{t.autor}</span>
                      <Ponto />
                      <span>{t.respostas}{` ${tt.respostaPlural}`}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
    </PaginaInterior>
  );
}

function Ponto() {
  return (
    <span aria-hidden className="text-ink-600">
      ·
    </span>
  );
}

function Fechado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-800 text-ink-400">
        <Icon name="lock" className="size-4.5" />
      </span>
      <div>
        <p className="font-display text-lg uppercase text-white">{titulo}</p>
        <p className="mt-1 text-[15px] text-ink-400">{texto}</p>
      </div>
    </div>
  );
}

/** Avatar de quem escreve: a única cor própria da página é a da pessoa. */
function Avatar({ cor, texto, className }: { cor: string; texto: string; className: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[4px] font-semibold text-white ${className}`}
      style={{ background: cor }}
      aria-hidden
    >
      {texto}
    </span>
  );
}

/** "Reportar" abre a denúncia real: vai para Moderação, apontada ao tópico. */
function Accoes({ nomes, topicoId, reportar }: { nomes: string[]; topicoId: string; reportar: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      {nomes.map((a) => (
        <button key={a} className="font-ui text-sm text-ink-500 transition-colors hover:text-white">
          {a}
        </button>
      ))}
      <Denunciar tipo="forum" alvoId={topicoId} rotulo={reportar} icone={false}
        classeBotao="font-ui text-sm text-ink-500 transition-colors hover:text-white" />
    </div>
  );
}
