import type { Metadata } from "next";
import Link from "next/link";
import { lerCategoriasForum, lerDefinicoes } from "@/lib/supabase/publico";
import { Fechado, RegrasForum } from "../Partes";
import { NovoTopico } from "./NovoTopico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Novo tópico",
  description: "Abra uma discussão no fórum da comunidade motard angolana.",
  robots: { index: false },
};

/*
 * O formulário aparece a toda a gente; a sessão só é pedida ao publicar,
 * como nas respostas. Com o fórum fechado nas Definições, fica o aviso.
 */

export default async function NovoTopicoPage() {
  const [categorias, definicoes] = await Promise.all([lerCategoriasForum(), lerDefinicoes()]);

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
          <h1 className="font-display text-3xl uppercase leading-[1.05] text-white sm:text-4xl lg:text-[2.75rem]">
            Novo tópico
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-400 sm:text-base">
            Uma dúvida de mecânica, um passeio para organizar, a análise da última corrida. O tópico fica visível para toda a comunidade assim que o publicar.
          </p>

          <div className="mt-10 border-t border-white/6 pt-8">
            {definicoes.forumAberto ? (
              <NovoTopico
                categorias={categorias.map((c) => ({ slug: c.slug, nome: c.nome, descricao: c.descricao }))}
              />
            ) : (
              <Fechado titulo="Fórum fechado" texto="De momento o fórum não aceita novos tópicos." />
            )}
          </div>
        </div>

        <aside className="lg:pt-1">
          <RegrasForum />
        </aside>
      </div>
    </div>
  );
}
