"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { EmptyState, Icon, PageHero } from "@/components/ui";
import type { Noticia } from "@/lib/types";
import { useIdioma } from "@/lib/i18n/contexto";
import { useConteudo } from "@/lib/i18n/useConteudo";
import { CATEGORIAS, CategoriaDoEndereco } from "../NoticiasClient";

/** O que o arquivo mostra de cada notícia. */
export type NoticiaArquivo = Pick<Noticia, "slug" | "titulo" | "categoria" | "data" | "fonte">;

const CAMPOS: (keyof NoticiaArquivo)[] = ["titulo"];

interface Ano {
  ano: number;
  total: number;
  meses: { mes: number; noticias: NoticiaArquivo[] }[];
}

/**
 * Agrupa por ano e depois por mês, do mais recente para o mais antigo.
 * O ano e o mês saem do texto da data ("2019-05-12…") e não de um Date,
 * para o fuso horário não passar uma notícia do dia 1 para o mês anterior.
 */
function agrupar(noticias: NoticiaArquivo[]): Ano[] {
  const porAno = new Map<number, Map<number, NoticiaArquivo[]>>();
  const ordenadas = [...noticias].sort((a, b) => b.data.localeCompare(a.data));

  for (const n of ordenadas) {
    const m = /^(\d{4})-(\d{2})/.exec(n.data);
    if (!m) continue; // sem data válida não há onde a arrumar
    const ano = Number(m[1]);
    const mes = Number(m[2]);
    const meses = porAno.get(ano) ?? new Map<number, NoticiaArquivo[]>();
    porAno.set(ano, meses);
    const lista = meses.get(mes) ?? [];
    meses.set(mes, lista);
    lista.push(n);
  }

  // Os Map guardam a ordem de inserção, que já é do mais recente para o mais antigo.
  return [...porAno].map(([ano, meses]) => ({
    ano,
    total: [...meses.values()].reduce((s, l) => s + l.length, 0),
    meses: [...meses].map(([mes, lista]) => ({ mes, noticias: lista })),
  }));
}

export function ArquivoClient({ noticias: originais }: { noticias: NoticiaArquivo[] }) {
  const { t, locale } = useIdioma();
  const noticias = useConteudo(originais, CAMPOS);
  const [categoria, setCategoria] = useState("Todas");

  const anos = useMemo(
    () => agrupar(noticias.filter((n) => categoria === "Todas" || n.categoria === categoria)),
    [noticias, categoria],
  );

  // "novembro" → "Novembro"; em inglês já vem "November".
  const nomeMes = (mes: number) => {
    const nome = new Date(Date.UTC(2000, mes - 1, 1)).toLocaleDateString(locale, { month: "long", timeZone: "UTC" });
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  };

  return (
    <>
      <Suspense fallback={null}>
        <CategoriaDoEndereco aoLer={setCategoria} />
      </Suspense>
      <PageHero
        imagem="noticias"
        eyebrow={t("nav.noticias")}
        titulo={t("menu.arquivoNoticias")}
        descricao="Tudo o que a Motobox publicou, da notícia mais recente à mais antiga, arrumado por ano e mês."
      />

      {/* Filtros, e atalhos para cada ano quando há mais do que um */}
      {originais.length > 0 && (
        <div className="sticky top-16 z-30 border-b border-white/6 bg-ink-950/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  aria-pressed={categoria === c}
                  className="chip h-8 px-3.5 text-sm"
                >
                  {c}
                </button>
              ))}
            </div>

            {anos.length > 1 && (
              <div className="flex gap-1 overflow-x-auto no-scrollbar sm:ml-auto">
                {anos.map((a) => (
                  <a
                    key={a.ano}
                    href={`#ano-${a.ano}`}
                    className="rounded-full px-2.5 py-1 font-ui text-sm tabular-nums text-ink-400 transition-colors hover:bg-ink-800 hover:text-white"
                  >
                    {a.ano}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {originais.length === 0 ? (
          <EmptyState
            titulo="Sem notícias publicadas"
            descricao="As próximas notícias do motociclismo angolano aparecem aqui."
          />
        ) : anos.length === 0 ? (
          <EmptyState titulo="Nada encontrado" descricao="Experimente outra categoria." />
        ) : (
          anos.map((a) => (
            <section key={a.ano} id={`ano-${a.ano}`} className="mb-16 scroll-mt-36 last:mb-0">
              <div className="mb-6 flex items-center gap-4">
                <h2 className="title-xl text-3xl sm:text-4xl tabular-nums">{a.ano}</h2>
                <span className="h-px flex-1 bg-white/6" aria-hidden />
                <span className="text-xs text-ink-500">
                  {a.total} {a.total === 1 ? "notícia" : "notícias"}
                </span>
              </div>

              <div className="space-y-10">
                {a.meses.map((m) => (
                  <div key={m.mes} className="grid gap-2 lg:grid-cols-[12rem_1fr] lg:gap-10">
                    <h3 className="eyebrow text-mb-red lg:pt-5">{nomeMes(m.mes)}</h3>
                    <ul>
                      {m.noticias.map((n) => (
                        <li key={n.slug} className="border-b border-white/6 last:border-0">
                          <Link href={`/noticias/${n.slug}`} className="group flex items-start gap-4 py-4">
                            <time
                              dateTime={n.data.slice(0, 10)}
                              className="w-7 shrink-0 pt-0.5 font-display text-lg leading-none tabular-nums text-ink-500"
                            >
                              {n.data.slice(8, 10)}
                            </time>
                            <span className="min-w-0 flex-1">
                              <span className="block font-display text-base sm:text-lg uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
                                {n.titulo}
                              </span>
                              <span className="mt-1 block text-xs text-ink-500">
                                {n.categoria}
                                {n.fonte && <> · via {n.fonte}</>}
                              </span>
                            </span>
                            <Icon
                              name="arrow"
                              className="mt-0.5 size-5 shrink-0 text-ink-600 transition-all group-hover:translate-x-1 group-hover:text-white"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
