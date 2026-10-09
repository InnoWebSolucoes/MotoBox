import { Provas } from "./Provas";

/* Provas do calendário de Desporto (a tabela eventos, só as disciplinas de
   competição). ?editar=<slug> abre a ficha de uma prova. */

export default async function PaginaProvas({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const { editar } = await searchParams;
  return <Provas editar={typeof editar === "string" ? editar : undefined} />;
}
