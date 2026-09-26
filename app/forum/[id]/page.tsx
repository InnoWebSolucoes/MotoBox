import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Icon } from "@/components/ui";
import { Denunciar } from "@/components/Denunciar";
import { formatData } from "@/lib/data";
import { lerTopico, lerTopicos } from "@/lib/supabase/publico";

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

/** Respostas de exemplo, para demonstrar o layout da discussão. */
const RESPOSTAS = [
  {
    autor: "MecanicoDoBairro",
    avatar: "MB",
    cor: "#f59e0b",
    quando: "há 3 horas",
    mensagens: 987,
    desde: 2022,
    melhor: true,
    texto:
      "Isso é quase de certeza a bobine a aquecer. Acontece muito nas CRF quando o isolamento está a ceder: a frio faz contacto, a quente dilata e corta. Teste simples: quando começar a falhar, desliga e deixa arrefecer 10 minutos. Se voltar a trabalhar bem, é bobine.",
  },
  {
    autor: "Zeca_Lobito",
    avatar: "ZL",
    cor: "#0ea5e9",
    quando: "há 2 horas",
    mensagens: 143,
    desde: 2025,
    texto:
      "Fiz o teste que disseste. Confirma-se, arrefeceu e voltou ao normal. Vou encomendar bobine nova. Obrigado a todos, isto poupou-me uma ida à oficina.",
  },
  {
    autor: "KilambaWrench",
    avatar: "KW",
    cor: "#e10600",
    quando: "há 1 hora",
    mensagens: 421,
    desde: 2023,
    texto:
      "Aproveita e verifica o cachimbo da vela também. Muitas vezes trocam a bobine e o problema continua porque o cachimbo é que estava com a resistência alterada. São dois minutos a medir.",
  },
];

/*
 * Uma só cor de destaque (o vermelho, no marcador de fixado, no botão de
 * publicar e no hover); estados em texto discreto; só os avatares têm cor.
 * Cada pedaço de texto fica no seu nó para o `TraduzirPagina` o encontrar.
 */

export default async function TopicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topico = await lerTopico(id);
  if (!topico) notFound();

  const relacionados = (await lerTopicos())
    .filter((t) => t.id !== topico.id && t.categoriaSlug === topico.categoriaSlug)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <Link
        href="/forum"
        className="inline-flex items-center gap-2 font-ui text-base text-ink-400 hover:text-white transition-colors"
      >
        <span aria-hidden>←</span> Fórum
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
                    Fixado
                  </span>
                </>
              )}
              {topico.resolvido && (
                <>
                  <Ponto />
                  <span className="inline-flex items-center gap-1 text-ink-200">
                    <Icon name="check" className="size-3.5" />
                    Resolvido
                  </span>
                </>
              )}
              {topico.bloqueado && (
                <>
                  <Ponto />
                  <span className="inline-flex items-center gap-1">
                    <Icon name="lock" className="size-3.5" />
                    Fechado
                  </span>
                </>
              )}
            </p>

            <h1 className="mt-3 font-display text-3xl uppercase leading-[1.05] text-white sm:text-4xl lg:text-[2.75rem]">
              {topico.titulo}
            </h1>

            <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-500">
              <span>{topico.respostas} respostas</span>
              <Ponto />
              <span>{topico.visualizacoes.toLocaleString("pt-PT")} visualizações</span>
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
                  <span>Autor do tópico</span>
                  <Ponto />
                  <span>{formatData(topico.criado, { day: "2-digit", month: "long", year: "numeric" })}</span>
                </p>
              </div>
            </div>
            <div className="mt-4 sm:pl-[4.25rem]">
              <p className="text-lg leading-relaxed text-ink-100">{topico.excerto}</p>
              <Accoes nomes={["Gosto", "Citar", "Partilhar"]} topicoId={topico.id} />
            </div>
          </article>

          {/* Respostas */}
          <section aria-labelledby="respostas" className="mt-14">
            <h2 id="respostas" className="border-b border-white/6 pb-4 font-display text-xl uppercase text-white">
              {topico.respostas} respostas
            </h2>

            <ol>
              {RESPOSTAS.map((r, i) => (
                <li key={i} className="border-b border-white/6 py-8">
                  <div className="flex items-center gap-3 sm:gap-5">
                    <Avatar cor={r.cor} texto={r.avatar} className="size-10 text-xs sm:size-12 sm:text-sm" />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-baseline gap-x-2.5">
                        <span className="truncate font-ui text-lg leading-tight text-white">{r.autor}</span>
                        <span className="text-sm text-ink-500">{r.quando}</span>
                      </p>
                      <p className="mt-0.5 flex flex-wrap gap-x-2 text-sm text-ink-500">
                        <span>{r.mensagens} mensagens</span>
                        <Ponto />
                        <span>desde</span>
                        <span>{r.desde}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 sm:pl-[4.25rem]">
                    {r.melhor && (
                      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/6 px-3 py-1 text-sm text-ink-200">
                        <Icon name="check" className="size-3.5" />
                        Melhor resposta, marcada pelo autor
                      </p>
                    )}
                    <p className="text-base leading-relaxed text-ink-200 sm:text-[17px]">{r.texto}</p>
                    <Accoes nomes={["Gosto", "Citar"]} topicoId={topico.id} />
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Caixa de resposta: sempre a última coisa da discussão */}
          <section className="mt-12">
            {topico.bloqueado ? (
              <div className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-800 text-ink-400">
                  <Icon name="lock" className="size-4.5" />
                </span>
                <div>
                  <p className="font-display text-lg uppercase text-white">Tópico fechado</p>
                  <p className="mt-1 text-[15px] text-ink-400">Este tópico não aceita novas respostas.</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-xl uppercase text-white">Responder</h2>
                <textarea
                  rows={5}
                  placeholder="Escreva a sua resposta…"
                  className="mt-4 w-full resize-y bg-ink-900 p-4 text-base text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 outline-none focus:ring-2 focus:ring-mb-red"
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-ink-500">
                    Precisa de{" "}
                    <Link href="/conta" className="text-white underline underline-offset-2 hover:text-mb-red">
                      iniciar sessão
                    </Link>{" "}
                    para responder.
                  </p>
                  <Button>
                    Publicar resposta
                    <Icon name="arrow" className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Relacionados: coluna ao lado no computador, por baixo no telemóvel */}
        {relacionados.length > 0 && (
          <aside aria-labelledby="relacionados" className="lg:pt-1">
            <h2 id="relacionados" className="eyebrow text-ink-400">
              Tópicos relacionados
            </h2>
            <ul className="mt-3">
              {relacionados.map((t) => (
                <li key={t.id} className="border-b border-white/6 last:border-0">
                  <Link href={`/forum/${t.id}`} className="group block py-4">
                    <span className="block text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-mb-red">
                      {t.titulo}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-x-2 text-sm text-ink-500">
                      <span>{t.autor}</span>
                      <Ponto />
                      <span>{t.respostas} respostas</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}

function Ponto() {
  return (
    <span aria-hidden className="text-ink-600">
      ·
    </span>
  );
}

/** Avatar de quem escreve: a única cor própria da página é a da pessoa. */
function Avatar({ cor, texto, className }: { cor: string; texto: string; className: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-display text-white ${className}`}
      style={{ background: cor }}
      aria-hidden
    >
      {texto}
    </span>
  );
}

/** "Reportar" abre a denúncia real: vai para Moderação, apontada ao tópico. */
function Accoes({ nomes, topicoId }: { nomes: string[]; topicoId: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      {nomes.map((a) => (
        <button key={a} className="font-ui text-sm text-ink-500 transition-colors hover:text-white">
          {a}
        </button>
      ))}
      <Denunciar tipo="forum" alvoId={topicoId} rotulo="Reportar" icone={false}
        classeBotao="font-ui text-sm text-ink-500 transition-colors hover:text-white" />
    </div>
  );
}
