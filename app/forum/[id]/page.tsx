import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CornerDownRight, Eye, Lock, MessageSquare, MessagesSquare } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Denunciar } from "@/components/Denunciar";
import { Partilhar } from "@/components/Partilhar";
import { AvatarForum, MarcaNivel } from "@/components/forum/Autor";
import { ChipCategoria, MarcasEstado } from "@/components/forum/CartaoTopico";
import { BotaoCriar, Quadro, QuadroRegras } from "@/components/forum/Lateral";
import { Tempo } from "@/components/forum/Tempo";
import { BotaoVoto, VotosProvider } from "@/components/forum/Votos";
import { lerCategoriasForum, lerDefinicoes, lerTopico, lerTopicos } from "@/lib/supabase/publico";
import { lerDoc } from "@/lib/conteudo";
import { comPadrao, FORUM_PADRAO, type ConteudoForum } from "@/lib/conteudo/grupos/comunidade";
import { lerDiscussao, montarForum } from "../_servidor/forum";
import {
  BotaoIrResponder, CaixaResposta, DiscussaoProvider, ItemResposta, RespostasNovas, type RotulosResposta,
} from "./Respostas";

/* ============================================================
   MOTOBOX — Página de um tópico
   A mensagem original num cartão (com o voto, a categoria, o
   autor e o seu nível), a marca "Tópico resolvido", as respostas
   em cartões pela ordem de chegada (cada uma com voto e
   "Responder"), o convite para ser o primeiro a responder e a
   caixa de resposta. Ao lado: sobre este tópico, criar outro
   tópico, os relacionados e as regras.
   Cada pedaço de texto fica no seu nó para o `TraduzirPagina` o
   encontrar. Os textos editam-se em Gestão › Fórum › Página Fórum.
   ============================================================ */

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

const numero = (n: number) => n.toLocaleString("pt-PT");

export default async function TopicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topico = await lerTopico(id);
  if (!topico) notFound();

  const [todos, categorias, definicoes, textos] = await Promise.all([
    lerTopicos(), lerCategoriasForum(), lerDefinicoes(),
    // Textos fixos da página, editáveis no painel (Fórum → Página Fórum).
    lerDoc<ConteudoForum>("paginas.forum").then((d) => comPadrao(d, FORUM_PADRAO)),
  ]);
  const forum = await montarForum(todos, categorias, textos);
  const { abertura, respostas, participantes } = await lerDiscussao(topico, forum);
  const cartao = forum.cartoes.find((c) => c.id === topico.id);
  const tt = textos.topico;
  const tl = textos.lista;

  const relacionados = forum.cartoes
    .filter((c) => c.id !== topico.id && c.categoria?.slug === topico.categoriaSlug)
    .slice(0, 5);
  const rotulos: RotulosResposta = {
    reportar: tt.reportar, responder: tt.responder, votar: tl.votarResposta, retirarVoto: tl.retirarVoto, autor: textos.niveis.autor,
  };
  const podeResponder = !topico.bloqueado && definicoes.forumAberto;
  const nRespostas = Math.max(respostas.length, cartao?.respostas ?? 0);
  const accao = "inline-flex h-9 items-center gap-1.5 rounded-[4px] px-2.5 text-sm font-medium text-white transition-colors hover:bg-white/12";

  return (
    <PaginaInterior icone={<MessagesSquare />}>
      <div className="coluna pb-20 pt-28 lg:pt-32">
        <nav aria-label="Caminho" className="flex flex-wrap items-center gap-2 text-[15px] text-white">
          <Link href="/forum" className="inline-flex items-center gap-2 font-medium hover:underline">
            <span aria-hidden>←</span>
            <span>{tt.voltar}</span>
          </Link>
          {cartao?.categoria && (
            <>
              <span aria-hidden className="text-white/80">/</span>
              <ChipCategoria categoria={cartao.categoria} />
            </>
          )}
        </nav>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-8">
          <div className="min-w-0">
            <VotosProvider ids={[topico.id, ...respostas.map((r) => r.id)]}>
              <DiscussaoProvider>
                {/* Mensagem original */}
                <article className="painel painel-escuro flex gap-3 p-4 sm:gap-5 sm:p-6">
                  {/* No telemóvel o voto vai para a linha das acções, para o texto ter a largura toda. */}
                  <div className="hidden shrink-0 self-start sm:block">
                    <BotaoVoto id={topico.id} total={cartao?.votos ?? 0} rotulo={tl.votar} rotuloRetirar={tl.retirarVoto} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {(topico.fixado || topico.resolvido || topico.bloqueado) && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        <MarcasEstado topico={{ fixado: Boolean(topico.fixado), resolvido: Boolean(topico.resolvido), bloqueado: Boolean(topico.bloqueado) }} textos={tl} />
                      </div>
                    )}
                    <h1 className="titulo-3 text-balance text-white">{topico.titulo}</h1>

                    <div className="mt-4 flex items-center gap-3">
                      <AvatarForum nome={abertura.autor.nome} iniciais={abertura.autor.iniciais} cor={abertura.autor.cor} avatar={abertura.autor.avatar} className="size-10 text-sm" />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="truncate text-[16px] font-semibold leading-tight text-white">{abertura.autor.nome}</span>
                          <MarcaNivel texto={abertura.autor.nivel} tom={abertura.autor.equipa ? "equipa" : "nivel"} />
                        </p>
                        <p className="mt-0.5 flex flex-wrap gap-x-2 text-[13px] text-white/85">
                          <span>{tt.autorDoTopico}</span>
                          <span aria-hidden>·</span>
                          <Tempo iso={abertura.criado} />
                        </p>
                      </div>
                    </div>

                    {/* O texto vem tal como foi escrito: as mudanças de linha contam, nada é HTML. */}
                    <p className="mt-5 whitespace-pre-line text-[17px] leading-relaxed text-white [overflow-wrap:anywhere]">
                      {abertura.corpo}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-4">
                      <BotaoVoto id={topico.id} total={cartao?.votos ?? 0} rotulo={tl.votar} rotuloRetirar={tl.retirarVoto} forma="linha" className="sm:hidden" />
                      <span className="inline-flex h-9 items-center gap-1.5 px-1.5 text-sm text-white">
                        <MessageSquare className="size-4" aria-hidden />
                        <span className="font-semibold tabular-nums">{numero(nRespostas)}</span>
                        <span>{nRespostas === 1 ? tt.respostaSingular : tt.respostaPlural}</span>
                      </span>
                      <span className="inline-flex h-9 items-center gap-1.5 px-1.5 text-sm text-white">
                        <Eye className="size-4" aria-hidden />
                        <span className="tabular-nums">{numero(topico.visualizacoes)}</span>
                        <span>{tt.visualizacoes}</span>
                      </span>
                      {podeResponder && (
                        <BotaoIrResponder className={accao}>
                          <CornerDownRight className="size-4" aria-hidden />
                          <span>{tt.responder}</span>
                        </BotaoIrResponder>
                      )}
                      <Partilhar
                        caminho={`/forum/${topico.id}`}
                        titulo={topico.titulo}
                        texto={`${topico.titulo} · Fórum MotoBox`}
                        rotulo={tt.partilhar}
                        className={accao}
                      />
                      <Denunciar tipo="forum" alvoId={topico.id} rotulo={tt.reportar} icone={false} classeBotao={accao} />
                    </div>
                  </div>
                </article>

                {topico.resolvido && (
                  <div className="mt-[var(--intervalo)] flex items-start gap-3 rounded-[var(--raio)] bg-[#14532d]/70 p-4 ring-1 ring-inset ring-[#4ade80]/45 sm:p-5">
                    <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-[#4ade80]" aria-hidden />
                    <div>
                      <p className="text-[16px] font-semibold text-white">{tt.resolvidoTitulo}</p>
                      <p className="mt-1 text-[15px] leading-relaxed text-white/95">{tt.resolvidoTexto}</p>
                    </div>
                  </div>
                )}

                {/* Respostas: as dos membros e as acabadas de publicar */}
                <section aria-labelledby="respostas" className="mt-8">
                  <h2 id="respostas" className="px-1 pb-3 text-xl font-semibold text-white">
                    <span className="tabular-nums">{respostas.length}</span>{" "}
                    <span>{respostas.length === 1 ? tt.respostaSingular : tt.respostaPlural}</span>
                  </h2>

                  {respostas.length === 0 && podeResponder && (
                    <div className="painel painel-escuro mb-[var(--intervalo)] flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                      <div className="flex items-start gap-4">
                        <span aria-hidden className="chip-mb"><MessagesSquare /></span>
                        <div>
                          <p className="text-lg font-semibold text-white">{tt.primeiroTitulo}</p>
                          <p className="mt-1 max-w-[46ch] text-[15px] leading-relaxed text-white/90">{tt.primeiroTexto}</p>
                        </div>
                      </div>
                      <BotaoIrResponder className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--raio)] bg-white px-4 text-[15px] font-semibold text-[#141418] transition-colors hover:bg-mb-red hover:text-white">
                        <CornerDownRight className="size-4" aria-hidden />
                        <span>{tt.primeiroBotao}</span>
                      </BotaoIrResponder>
                    </div>
                  )}
                  {respostas.length === 0 && !podeResponder && (
                    <p className="painel painel-escuro mb-[var(--intervalo)] p-5 text-[15px] text-white">{tt.semRespostas}</p>
                  )}

                  {respostas.length > 0 && (
                    <ol className="grid gap-[var(--intervalo)]">
                      {respostas.map((r) => (
                        <ItemResposta key={r.id} resposta={r} topicoId={topico.id} rotulos={rotulos} />
                      ))}
                    </ol>
                  )}
                  <div className={respostas.length ? "mt-[var(--intervalo)]" : ""}>
                    <RespostasNovas idsServidor={respostas.map((r) => r.id)} topicoId={topico.id} rotulos={rotulos} />
                  </div>
                </section>

                {/* Caixa de resposta: sempre a última coisa da discussão */}
                <section className="mt-[var(--intervalo)] scroll-mt-24">
                  {topico.bloqueado ? (
                    <Fechado titulo={tt.fechadoTitulo} texto={tt.fechadoTexto} />
                  ) : !definicoes.forumAberto ? (
                    <Fechado titulo={tt.forumFechadoTitulo} texto={tt.forumFechadoTexto} />
                  ) : (
                    <CaixaResposta topicoId={topico.id} textos={textos.resposta} />
                  )}
                </section>
              </DiscussaoProvider>
            </VotosProvider>
          </div>

          <aside className="grid content-start gap-[var(--intervalo)]">
            <Quadro titulo={tt.sobreTitulo} id="sobre-topico">
              <dl className="mt-3 grid grid-cols-2 gap-[var(--intervalo)]">
                {[
                  [cartao?.votos ?? 0, tl.votos],
                  [nRespostas, nRespostas === 1 ? tt.respostaSingular : tt.respostaPlural],
                  [topico.visualizacoes, tt.visualizacoes],
                  [participantes, tt.participantes],
                ].map(([n, rotulo]) => (
                  <div key={String(rotulo)} className="flex flex-col-reverse rounded-[4px] bg-white/[0.07] px-3 py-2.5">
                    <dt className="mt-1 text-[12px] text-white/85">{rotulo}</dt>
                    <dd className="text-xl font-semibold leading-none tabular-nums text-white">{numero(Number(n))}</dd>
                  </div>
                ))}
              </dl>
              <dl className="mt-3 grid gap-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/85">{tt.criado}</dt>
                  <dd className="text-right text-white"><Tempo iso={abertura.criado} /></dd>
                </div>
                {cartao && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/85">{tt.ultimaActividade}</dt>
                    <dd className="text-right text-white"><Tempo iso={cartao.actividade} /></dd>
                  </div>
                )}
              </dl>
            </Quadro>

            <Quadro titulo={tt.criarTitulo} id="criar-topico">
              <p className="mt-1.5 text-[15px] leading-relaxed text-white/90">{tt.criarTexto}</p>
              <BotaoCriar texto={textos.lateral.criar} categoria={topico.categoriaSlug || undefined} className="mt-4" />
            </Quadro>

            {relacionados.length > 0 && (
              <Quadro titulo={tt.relacionados} id="relacionados">
                <ul className="mt-2 divide-y divide-white/10">
                  {relacionados.map((t) => (
                    <li key={t.id}>
                      <Link href={`/forum/${encodeURIComponent(t.id)}`} className="group block py-3">
                        <span className="block text-[15px] font-semibold leading-snug text-white group-hover:underline">{t.titulo}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-white/85">
                          <span>{t.autor.nome}</span>
                          <span aria-hidden>·</span>
                          <span className="tabular-nums">{t.respostas}</span>
                          <span>{t.respostas === 1 ? tt.respostaSingular : tt.respostaPlural}</span>
                          {t.votos > 0 && (
                            <>
                              <span aria-hidden>·</span>
                              <span className="tabular-nums">{t.votos}</span>
                              <span>{tl.votos}</span>
                            </>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Quadro>
            )}

            <QuadroRegras textos={textos} />
          </aside>
        </div>
      </div>
    </PaginaInterior>
  );
}

function Fechado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="painel painel-escuro flex items-start gap-4 p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-[4px] bg-white/12 text-white">
        <Lock className="size-4.5" aria-hidden />
      </span>
      <div>
        <p className="text-lg font-semibold text-white">{titulo}</p>
        <p className="mt-1 text-[15px] text-white/90">{texto}</p>
      </div>
    </div>
  );
}
