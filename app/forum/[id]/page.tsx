import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Icon, Tag } from "@/components/ui";
import { formatData, getTopico, topicos } from "@/lib/data";

export function generateStaticParams() {
  return topicos.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = getTopico(id);
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
      "Isso é quase de certeza a bobine a aquecer. Acontece muito nas CRF quando o isolamento está a ceder — a frio faz contacto, a quente dilata e corta. Teste simples: quando começar a falhar, desliga e deixa arrefecer 10 minutos. Se voltar a trabalhar bem, é bobine.",
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

export default async function TopicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topico = getTopico(id);
  if (!topico) notFound();

  const relacionados = topicos
    .filter((t) => t.id !== topico.id && t.categoriaSlug === topico.categoriaSlug)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Link
        href="/forum"
        className="inline-flex items-center gap-2 font-display text-[11px] uppercase tracking-widest text-ink-500 hover:text-white transition-colors"
      >
        <span aria-hidden>←</span> Fórum
      </Link>

      {/* Cabeçalho do tópico */}
      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="neutral">{topico.categoria}</Tag>
          {topico.fixado && <Tag tone="red">Fixado</Tag>}
          {topico.resolvido && (
            <Tag tone="ok">
              <Icon name="check" className="size-3" />
              Resolvido
            </Tag>
          )}
          {topico.bloqueado && (
            <Tag tone="outline">
              <Icon name="lock" className="size-3" />
              Fechado
            </Tag>
          )}
        </div>

        <h1 className="title-xl mt-4 text-2xl sm:text-3xl lg:text-4xl">{topico.titulo}</h1>

        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-ink-800 py-3.5 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="chat" className="size-3.5" />
            {topico.respostas} respostas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="eye" className="size-3.5" />
            {topico.visualizacoes.toLocaleString("pt-PT")} visualizações
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" className="size-3.5" />
            {formatData(topico.criado)}
          </span>
        </p>
      </header>

      {/* Mensagem original */}
      <article className="mt-6 card overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="flex sm:flex-col items-center gap-3 sm:gap-0 border-b sm:border-b-0 sm:border-r border-ink-800 bg-ink-950 p-5 sm:w-40 sm:text-center">
            <span
              className="grid size-12 shrink-0 place-items-center font-display text-sm text-white"
              style={{ background: topico.avatarCor }}
            >
              {topico.autorAvatar}
            </span>
            <div className="min-w-0 sm:mt-3">
              <p className="truncate font-display text-sm uppercase text-white">{topico.autor}</p>
              <p className="text-[11px] text-ink-600">Autor do tópico</p>
            </div>
          </div>

          <div className="min-w-0 flex-1 p-6">
            <p className="text-[11px] text-ink-600">
              {formatData(topico.criado, { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <p className="mt-3 text-base text-ink-200 leading-relaxed">{topico.excerto}</p>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-800 pt-4">
              {["Gosto", "Citar", "Partilhar", "Reportar"].map((a) => (
                <button
                  key={a}
                  className="font-display text-[11px] uppercase tracking-wider text-ink-500 transition-colors hover:text-mb-red"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </article>

      {/* Respostas */}
      <section className="mt-8">
        <h2 className="eyebrow accent-bar text-white">{topico.respostas} respostas</h2>

        <div className="space-y-3">
          {RESPOSTAS.map((r, i) => (
            <article
              key={i}
              className={`card overflow-hidden ${r.melhor ? "border-ok/40" : ""}`}
            >
              {r.melhor && (
                <p className="flex items-center gap-2 border-b border-ok/25 bg-ok/10 px-5 py-2 eyebrow text-ok">
                  <Icon name="check" className="size-3.5" />
                  Melhor resposta — marcada pelo autor
                </p>
              )}
              <div className="flex flex-col sm:flex-row">
                <div className="flex sm:flex-col items-center gap-3 sm:gap-0 border-b sm:border-b-0 sm:border-r border-ink-800 bg-ink-950 p-5 sm:w-40 sm:text-center">
                  <span
                    className="grid size-11 shrink-0 place-items-center font-display text-xs text-white"
                    style={{ background: r.cor }}
                  >
                    {r.avatar}
                  </span>
                  <div className="min-w-0 sm:mt-3">
                    <p className="truncate font-display text-sm uppercase text-white">{r.autor}</p>
                    <p className="text-[11px] text-ink-600">{r.mensagens} mensagens</p>
                    <p className="text-[11px] text-ink-700">desde {r.desde}</p>
                  </div>
                </div>

                <div className="min-w-0 flex-1 p-6">
                  <p className="text-[11px] text-ink-600">{r.quando}</p>
                  <p className="mt-3 text-base text-ink-300 leading-relaxed">{r.texto}</p>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-800 pt-4">
                    {["Gosto", "Citar", "Reportar"].map((a) => (
                      <button
                        key={a}
                        className="font-display text-[11px] uppercase tracking-wider text-ink-500 transition-colors hover:text-mb-red"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Caixa de resposta */}
      <section className="mt-8">
        {topico.bloqueado ? (
          <div className="card p-8 text-center">
            <Icon name="lock" className="mx-auto size-6 text-ink-600" />
            <p className="mt-3 font-display text-base uppercase text-ink-300">Tópico fechado</p>
            <p className="mt-1.5 text-sm text-ink-500">
              Este tópico não aceita novas respostas.
            </p>
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="eyebrow text-mb-red mb-4">Responder</h2>
            <textarea
              rows={5}
              placeholder="Escreva a sua resposta…"
              className="w-full resize-y border border-ink-700 bg-ink-950 p-4 text-sm text-white placeholder:text-ink-600 outline-none focus:border-mb-red"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-ink-600">
                Precisa de <Link href="/conta" className="text-mb-red hover:underline">iniciar sessão</Link> para responder.
              </p>
              <Button>
                Publicar resposta
                <Icon name="arrow" className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <section className="mt-12">
          <h2 className="eyebrow accent-bar text-white">Tópicos relacionados</h2>
          <div className="card divide-y divide-ink-800">
            {relacionados.map((t) => (
              <Link key={t.id} href={`/forum/${t.id}`} className="group flex items-center gap-4 p-4 hover:bg-ink-850 transition-colors">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white group-hover:text-mb-red transition-colors">
                    {t.titulo}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-ink-600">
                    {t.autor} · {t.respostas} respostas
                  </span>
                </span>
                <Icon name="arrow" className="size-4 shrink-0 text-ink-700 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
