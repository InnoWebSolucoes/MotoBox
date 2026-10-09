import type { Metadata } from "next";
import Link from "next/link";
import { Lock, MessagesSquare } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { FormularioTopico } from "@/components/forum/FormularioTopico";
import { Quadro, QuadroRegras } from "@/components/forum/Lateral";
import { corOu } from "@/components/forum/tipos";
import { lerCategoriasForum, lerDefinicoes } from "@/lib/supabase/publico";
import { lerDoc } from "@/lib/conteudo";
import { comPadrao, FORUM_PADRAO, type ConteudoForum } from "@/lib/conteudo/grupos/comunidade";

/* ============================================================
   MOTOBOX — Criar um tópico (/forum/novo)
   O formulário (título, categoria, mensagem) e, ao lado, as dicas
   e as regras. Com o fórum fechado nas definições, diz isso em vez
   do formulário (e a rota recusa na mesma). A sessão só é pedida
   ao publicar. Textos em Gestão › Fórum › Página Fórum.
   ============================================================ */

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

const lerTextos = async () => comPadrao(await lerDoc<ConteudoForum>("paginas.forum"), FORUM_PADRAO);

export async function generateMetadata(): Promise<Metadata> {
  const { novo } = await lerTextos();
  return { title: novo.seoTitulo, robots: { index: false } };
}

export default async function NovoTopico({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const [categorias, definicoes, textos] = await Promise.all([lerCategoriasForum(), lerDefinicoes(), lerTextos()]);
  const t = textos.novo;
  const inicial = categorias.some((c) => c.slug === categoria) ? categoria : undefined;

  return (
    <PaginaInterior icone={<MessagesSquare />}>
      <div className="coluna pb-20 pt-28 lg:pt-32">
        <Link href="/forum" className="inline-flex items-center gap-2 text-[15px] font-medium text-white hover:underline">
          <span aria-hidden>←</span>
          <span>{textos.topico.voltar}</span>
        </Link>

        <header className="mt-6 max-w-3xl">
          {t.sobretitulo && <p className="sobretitulo text-white">{t.sobretitulo}</p>}
          <h1 className="titulo-2 mt-3 text-white">{t.titulo}</h1>
          {t.texto && <p className="texto-lead mt-4 max-w-[56ch] text-white/95">{t.texto}</p>}
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-8">
          <div className="min-w-0">
            {definicoes.forumAberto ? (
              <FormularioTopico
                categorias={categorias.map((c) => ({ slug: c.slug, nome: c.nome, cor: corOu(c.cor), icone: c.icone, descricao: c.descricao }))}
                categoriaInicial={inicial}
                textos={t}
              />
            ) : (
              <div className="painel painel-escuro flex items-start gap-4 p-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-[4px] bg-white/12 text-white">
                  <Lock className="size-4.5" aria-hidden />
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">{t.fechadoTitulo}</p>
                  <p className="mt-1 text-[15px] text-white/90">{t.fechadoTexto}</p>
                </div>
              </div>
            )}
          </div>

          <aside className="grid content-start gap-[var(--intervalo)]">
            {t.dicas.length > 0 && (
              <Quadro titulo={t.dicasTitulo} id="dicas-topico">
                <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-white/90">
                  {t.dicas.map((d, i) => (
                    <li key={`${i}-${d}`} className="flex gap-3">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-mb-red" />
                      <span>{d}</span>
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
