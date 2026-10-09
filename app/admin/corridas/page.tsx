import { Resultados } from "./Resultados";

/* Resultados (a tabela corridas): uma tabela de classificação por prova e
   categoria. ?prova=<slug> mostra só as de uma prova, ?editar=<slug> abre
   uma tabela e ?nova=<slug da prova> abre uma tabela nova dessa prova. */

export default async function PaginaResultados({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const p = await searchParams;
  const texto = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);
  return <Resultados prova={texto(p.prova)} editar={texto(p.editar)} nova={texto(p.nova)} />;
}
