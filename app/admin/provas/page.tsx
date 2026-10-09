import { Provas } from "./Provas";
import { PaginasCampeonato } from "./PaginasCampeonato";

/* Provas do calendário de Desporto (a tabela eventos, só as disciplinas de
   competição). ?editar=<slug> abre a ficha de uma prova.
   ?aba=paginas: os textos fixos das páginas do campeonato (calendário,
   resultados, classificação, pilotos, equipas, bilhetes e compra);
   ?doc=<id> abre uma delas. */

export default async function PaginaProvas({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const { editar, aba, doc } = await searchParams;
  if (aba === "paginas") return <PaginasCampeonato docInicial={typeof doc === "string" ? doc : undefined} />;
  return <Provas editar={typeof editar === "string" ? editar : undefined} />;
}
