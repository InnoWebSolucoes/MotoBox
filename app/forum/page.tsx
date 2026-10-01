import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Lock, MessagesSquare, Pin } from "lucide-react";
import { lerCategoriasForum, lerTopicos } from "@/lib/supabase/publico";
import { dataArtigo } from "@/lib/motobox";
import type { TopicoForum } from "@/lib/types";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Pilulas, Seccao } from "@/components/painel/blocos";
import { Seta } from "@/components/painel/kit";
import { Icon } from "@/components/ui";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Fórum",
  description:
    "O fórum da comunidade motard angolana: passeios e viagens, mecânica, equipamento, primeira mota, clubes e conversa geral.",
};

const REGRAS = [
  "Respeito em primeiro lugar. Sem insultos.",
  "Sem publicidade não autorizada.",
  "Vendas só no Marketplace.",
  "Pesquise antes de abrir um tópico novo.",
  "Sem conteúdo fora do tema motard.",
];

export default async function Forum({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const [topicos, categorias] = await Promise.all([lerTopicos(), lerCategoriasForum()]);

  const activa = categorias.find((c) => c.slug === categoria);
  const lista = activa ? topicos.filter((t) => t.categoriaSlug === activa.slug) : topicos;
  const fixados = lista.filter((t) => t.fixado);
  const recentes = lista.filter((t) => !t.fixado);
  const contar = (slug: string) => topicos.filter((t) => t.categoriaSlug === slug).length;

  return (
    <PaginaInterior icone={<MessagesSquare />}>
      <Abertura
        compacta
        foto="banner-forum"
        sobretitulo="Comunidade"
        titulo="Fórum"
        texto="Onde quem anda de mota em Angola conversa: dúvidas de mecânica, passeios por organizar, a primeira mota e tudo o resto."
      >
        <BotaoMB href="/conta">Abrir um tópico</BotaoMB>
      </Abertura>

      <Seccao>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <Pilulas
              rotulo="Categorias do fórum"
              activa={activa?.slug ?? "todas"}
              itens={[
                { chave: "todas", texto: "Todas", href: "/forum" },
                ...categorias.map((c) => ({ chave: c.slug, texto: c.nome, href: `/forum?categoria=${c.slug}` })),
              ]}
            />

            {activa && <p className="mt-6 text-[15px] text-white/70">{activa.descricao}</p>}

            {lista.length ? (
              <ol className="mt-8 grid gap-[var(--intervalo)]">
                {[...fixados, ...recentes].map((t) => (
                  <li key={t.id}>
                    <LinhaTopico topico={t} />
                  </li>
                ))}
              </ol>
            ) : (
              <div className="painel painel-escuro mt-8 p-10">
                <p className="text-lg font-semibold">Ainda não há tópicos nesta categoria</p>
                <p className="mt-2 text-sm text-white/60">Comece a conversa: abra o primeiro.</p>
              </div>
            )}
          </div>

          <aside className="grid content-start gap-[var(--intervalo)]">
            <div className="painel painel-escuro p-6">
              <h2 className="text-lg font-semibold">Categorias</h2>
              <ul className="mt-4 divide-y divide-white/8">
                {categorias.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/forum?categoria=${c.slug}`} className="group flex items-center gap-3 py-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-[4px] bg-white/8 text-white transition-colors group-hover:bg-mb-red">
                        <Icon name={c.icone} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm">{c.nome}</span>
                      <span className="text-xs text-white/45 tabular-nums">{contar(c.slug)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="painel painel-escuro p-6">
              <h2 className="text-lg font-semibold">Regras da casa</h2>
              <ol className="mt-4 space-y-2.5 text-sm text-white/75">
                {REGRAS.map((r, i) => (
                  <li key={r} className="flex gap-3">
                    <span className="text-mb-red-light tabular-nums">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ol>
              <Link href="/regulamento" className="mt-5 inline-flex text-sm">
                <span className="sublinhado">Regulamento da comunidade</span>
              </Link>
            </div>
          </aside>
        </div>
      </Seccao>
    </PaginaInterior>
  );
}

function LinhaTopico({ topico: t }: { topico: TopicoForum }) {
  return (
    <Link href={`/forum/${t.id}`} className="painel painel-escuro group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 md:p-5">
      <span
        aria-hidden
        className="grid size-11 place-items-center rounded-[4px] text-sm font-semibold text-white"
        style={{ background: t.avatarCor || "#e10600" }}
      >
        {t.autorAvatar}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
          <span className="text-mb-red-light">{t.categoria}</span>
          {t.fixado && (
            <span className="inline-flex items-center gap-1"><Pin className="size-3" aria-hidden /> Fixado</span>
          )}
          {t.resolvido && (
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3" aria-hidden /> Resolvido</span>
          )}
          {t.bloqueado && (
            <span className="inline-flex items-center gap-1"><Lock className="size-3" aria-hidden /> Fechado</span>
          )}
        </span>
        <span className="mt-1 block text-[15px] font-medium leading-snug md:text-base">{t.titulo}</span>
        <span className="mt-1 block truncate text-sm text-white/55">
          {t.autor} · {dataArtigo(t.criado)}
        </span>
      </span>
      <Seta className="size-3.5" />
    </Link>
  );
}
