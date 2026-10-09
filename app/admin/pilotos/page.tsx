import { Pilotos } from "./Pilotos";

/* Pilotos de Desporto (a tabela pilotos). ?editar=<slug> abre a ficha de um piloto. */

export default async function PaginaPilotos({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const { editar } = await searchParams;
  return <Pilotos editar={typeof editar === "string" ? editar : undefined} />;
}
