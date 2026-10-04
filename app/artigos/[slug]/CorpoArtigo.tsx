import { Fragment } from "react";

/*
  Corpo de um artigo. `corpo` é uma lista de parágrafos com duas marcas
  simples, escritas no painel como texto:
    "## Subtítulo"                       título de secção
    "> Texto da citação — Nome, função"  citação em destaque
  Tudo o resto é parágrafo. O primeiro parágrafo leva a capitular
  (ver .prosa em globals.css).
*/

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

export function CorpoArtigo({ corpo }: { corpo: string[] }) {
  return (
    <>
      {blocos(corpo).map((b, i) => (
        <Fragment key={i}>
          {b.tipo === "subtitulo" && <h2>{b.texto}</h2>}
          {b.tipo === "citacao" && (
            <figure>
              <blockquote>{b.texto}</blockquote>
              {b.autor && <figcaption>{b.autor}</figcaption>}
            </figure>
          )}
          {b.tipo === "paragrafo" && <p>{b.texto}</p>}
        </Fragment>
      ))}
    </>
  );
}
