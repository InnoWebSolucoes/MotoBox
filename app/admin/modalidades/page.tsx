import { Modalidades } from "./Modalidades";

/* Modalidades de Desporto (a ficha e o guia de cada uma) e, em
   ?aba=pagina, os textos da página /desporto e as definições do campeonato. */

export default async function PaginaModalidades({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const { aba } = await searchParams;
  return <Modalidades aba={aba === "pagina" ? "pagina" : "modalidades"} />;
}
