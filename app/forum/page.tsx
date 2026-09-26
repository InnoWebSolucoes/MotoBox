import type { Metadata } from "next";
import Link from "next/link";
import { Button, ButtonLink, EmptyState, Icon, PageHero, Tag } from "@/components/ui";
import { formatData } from "@/lib/data";
import { lerCategoriasForum, lerTopicos } from "@/lib/supabase/publico";
import type { TopicoForum } from "@/lib/types";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Fórum",
  description:
    "O fórum da comunidade motard angolana: competição, mecânica, passeios, equipamento e conversa geral.",
};

export default async function ForumPage() {
  const [topicos, categoriasForum] = await Promise.all([lerTopicos(), lerCategoriasForum()]);
  const fixados = topicos.filter((t) => t.fixado);
  const recentes = topicos.filter((t) => !t.fixado);
  const totalMensagens = categoriasForum.reduce((s, c) => s + c.mensagens, 0);
  const totalTopicos = categoriasForum.reduce((s, c) => s + c.topicos, 0);

  return (
    <>
      <PageHero
        imagem="forum"
        eyebrow="Comunidade"
        titulo="Fórum"
        descricao="O sítio onde a comunidade motard angolana fala. Dúvidas de mecânica, organização de passeios, análise das corridas e tudo o resto."
      >
        <div className="flex flex-wrap items-center gap-6">
          <ButtonLink href="/conta" size="lg">
            <Icon name="plus" className="size-4" />
            Novo tópico
          </ButtonLink>
          <div className="flex gap-8">
            {[
              { v: totalTopicos.toLocaleString("pt-PT"), l: "Tópicos" },
              { v: totalMensagens.toLocaleString("pt-PT"), l: "Mensagens" },
              { v: "2.847", l: "Membros" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-2xl text-white">{s.v}</p>
                <p className="eyebrow mt-0.5 text-ink-500">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div className="space-y-10">
            {/* Categorias */}
            <section>
              <h2 className="eyebrow accent-bar text-white">Categorias</h2>
              <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                {categoriasForum.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/forum#${c.slug}`}
                    className="group flex items-start gap-4"
                  >
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-full text-white"
                      style={{ background: c.cor }}
                    >
                      <Icon name={c.icone} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg uppercase leading-tight text-white group-hover:text-mb-red transition-colors">
                        {c.nome}
                      </h3>
                      <p className="mt-1 text-sm text-ink-400 leading-relaxed">{c.descricao}</p>
                      <p className="mt-2 flex gap-4 text-xs text-ink-500">
                        <span>{c.topicos.toLocaleString("pt-PT")} tópicos</span>
                        <span>{c.mensagens.toLocaleString("pt-PT")} mensagens</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Tópicos fixados */}
            {fixados.length > 0 && (
              <section>
                <h2 className="eyebrow accent-bar text-white">Fixados</h2>
                <div>
                  {fixados.map((t) => (
                    <TopicoLinha key={t.id} topico={t} />
                  ))}
                </div>
              </section>
            )}

            {/* Tópicos recentes */}
            <section>
              <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
                <h2 className="eyebrow accent-bar mb-0 text-white after:hidden">Discussões recentes</h2>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {["Recentes", "Populares", "Sem resposta"].map((f, i) => (
                    <button key={f} aria-pressed={i === 0} className="chip h-8 px-3.5 text-sm">
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {recentes.length === 0 ? (
                <EmptyState
                  titulo="Sem discussões recentes"
                  descricao="As conversas mais recentes da comunidade aparecem aqui."
                />
              ) : (
                <div>
                  {recentes.map((t) => (
                    <TopicoLinha key={t.id} topico={t} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Barra lateral */}
          <aside className="space-y-10">
            <div className="card p-6">
              <h2 className="eyebrow text-mb-red mb-3">Participar</h2>
              <p className="text-sm text-ink-400 leading-relaxed">
                Para publicar e responder precisa de uma conta Motobox. É gratuita e leva um minuto.
              </p>
              <ButtonLink href="/conta" className="mt-4 w-full">
                Criar conta
              </ButtonLink>
              <Button variant="ghost" className="mt-2 w-full">
                Já tenho conta
              </Button>
            </div>

            <div>
              <h2 className="eyebrow text-mb-red mb-4">Regras do fórum</h2>
              <ul className="space-y-3">
                {[
                  "Respeito em primeiro lugar. Sem insultos.",
                  "Sem publicidade não autorizada.",
                  "Vendas só no Marketplace.",
                  "Pesquise antes de abrir um tópico novo.",
                  "Sem conteúdo fora do tema motard.",
                ].map((r) => (
                  <li key={r} className="flex gap-2.5 text-sm text-ink-400 leading-relaxed">
                    <Icon name="check" className="size-4 shrink-0 text-mb-red mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="eyebrow text-mb-red mb-2">Membros activos</h2>
              <div>
                {[
                  { n: "Bruno_T12", c: "#e10600", m: 1284 },
                  { n: "MecanicoDoBairro", c: "#f59e0b", m: 987 },
                  { n: "MiguelTrail", c: "#22c55e", m: 762 },
                  { n: "Bino_MX", c: "#0ea5e9", m: 645 },
                  { n: "AnalistaMX", c: "#a855f7", m: 519 },
                ].map((m) => (
                  <div key={m.n} className="flex items-center gap-3 border-b border-white/6 py-3 last:border-0">
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-full font-display text-[10px] text-white"
                      style={{ background: m.c }}
                    >
                      {m.n.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-300">{m.n}</span>
                    <span className="font-display text-sm text-ink-400 tabular-nums">{m.m}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function TopicoLinha({ topico: t }: { topico: TopicoForum }) {
  return (
    <Link
      href={`/forum/${t.id}`}
      className="group flex gap-4 border-b border-white/6 py-5 last:border-0"
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full font-display text-xs text-white"
        style={{ background: t.avatarCor }}
      >
        {t.autorAvatar}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {t.fixado && <Tag tone="red" className="!text-[9px] !px-1.5 !py-0.5">Fixado</Tag>}
          {t.resolvido && (
            <Tag tone="ok" className="!text-[9px] !px-1.5 !py-0.5">
              <Icon name="check" className="size-2.5" />
              Resolvido
            </Tag>
          )}
          {t.bloqueado && (
            <Tag tone="neutral" className="!text-[9px] !px-1.5 !py-0.5">
              <Icon name="lock" className="size-2.5" />
              Fechado
            </Tag>
          )}
          <span className="text-[11px] text-ink-600">{t.categoria}</span>
        </div>

        <h3 className="mt-1.5 font-display text-base uppercase leading-snug text-white group-hover:text-mb-red transition-colors">
          {t.titulo}
        </h3>
        <p className="mt-1.5 text-xs text-ink-500 leading-relaxed line-clamp-2">{t.excerto}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-600">
          <span>{t.autor}</span>
          <span className="size-1 rounded-full bg-ink-700" />
          <span>{formatData(t.criado, { day: "2-digit", month: "short" })}</span>
          {t.ultimaResposta.quando && (
            <>
              <span className="size-1 rounded-full bg-ink-700" />
              <span>última resposta {t.ultimaResposta.quando}</span>
            </>
          )}
        </p>
      </div>

      <div className="hidden shrink-0 sm:flex flex-col items-end justify-center gap-1 pl-2">
        <span className="inline-flex items-center gap-1.5 font-display text-base text-white tabular-nums">
          <Icon name="chat" className="size-3.5 text-ink-600" />
          {t.respostas}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-600 tabular-nums">
          <Icon name="eye" className="size-3" />
          {t.visualizacoes.toLocaleString("pt-PT")}
        </span>
      </div>
    </Link>
  );
}
