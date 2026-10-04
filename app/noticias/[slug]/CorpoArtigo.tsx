import { Fragment } from "react";
import { C } from "@/components/T";

/* ============================================================
   MOTOBOX — Corpo de um artigo
   `corpo` é uma lista de parágrafos com duas marcas simples,
   escritas no painel como texto:
     "## Subtítulo"                       título de secção
     "> Texto da citação — Nome, função"  citação em destaque
   Tudo o resto é parágrafo. O primeiro parágrafo de texto leva
   a capitular; o último fecha com o marcador de fim.
   ============================================================ */

type Bloco =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "citacao"; texto: string; autor?: string };

function blocos(corpo: string[]): Bloco[] {
  return corpo
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha): Bloco => {
      if (linha.startsWith("## ")) return { tipo: "subtitulo", texto: linha.slice(3).trim() };
      if (linha.startsWith("> ")) {
        // A atribuição vem depois do último travessão: "… — Nome, função".
        const [texto, autor] = linha.slice(2).split(/\s+—\s+(?=[^—]+$)/);
        return { tipo: "citacao", texto: texto.trim(), autor: autor?.trim() };
      }
      return { tipo: "paragrafo", texto: linha };
    });
}

/** Tamanho e entrelinha de leitura, como num jornal: ~70 caracteres por linha. */
const PARAGRAFO = "font-serif text-[1.1875rem] leading-[1.8] text-ink-200 sm:text-[1.25rem]";

export function CorpoArtigo({ corpo }: { corpo: string[] }) {
  const lista = blocos(corpo);
  const primeiro = lista.findIndex((b) => b.tipo === "paragrafo");
  const ultimo = lista.findLastIndex((b) => b.tipo === "paragrafo");

  return (
    <div className="space-y-7">
      {lista.map((b, i) => (
        <Fragment key={i}>
          {b.tipo === "subtitulo" && (
            <h2 className="pt-6 font-serif text-2xl font-bold leading-snug text-white sm:text-[1.75rem]">
              <C>{b.texto}</C>
            </h2>
          )}

          {b.tipo === "citacao" && (
            <figure className="my-12 border-y border-white/10 py-9 text-center">
              <blockquote className="font-serif text-2xl italic leading-snug text-white sm:text-[1.875rem]">
                <span aria-hidden className="text-mb-red">“</span>
                <C>{b.texto}</C>
                <span aria-hidden className="text-mb-red">”</span>
              </blockquote>
              {b.autor && (
                <figcaption className="mt-4 font-ui text-sm uppercase tracking-widest text-ink-400">
                  <C>{b.autor}</C>
                </figcaption>
              )}
            </figure>
          )}

          {b.tipo === "paragrafo" && (
            <p
              className={i === primeiro ? `${PARAGRAFO} capitular` : PARAGRAFO}
            >
              <C>{b.texto}</C>
              {/* Marcador de fim, como nos jornais */}
              {i === ultimo && <span aria-hidden className="ml-2 inline-block size-2.5 translate-y-[-1px] bg-mb-red" />}
            </p>
          )}
        </Fragment>
      ))}
    </div>
  );
}
