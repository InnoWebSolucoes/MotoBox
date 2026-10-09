import { Equipas } from "./Equipas";

/* Equipas e clubes de Desporto (a tabela equipas). ?editar=<slug> abre a ficha de uma equipa. */

export default async function PaginaEquipas({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const { editar } = await searchParams;
  return <Equipas editar={typeof editar === "string" ? editar : undefined} />;
}
