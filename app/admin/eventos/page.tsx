import type { Metadata } from "next";
import { GestaoEventos } from "./GestaoEventos";

export const metadata: Metadata = { title: "Eventos · Gestão" };

/** /admin/eventos — os eventos da comunidade e, em ?aba=pagina, os textos fixos de /eventos. */
export default async function PaginaEventos({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  return <GestaoEventos abaInicial={aba === "pagina" ? "pagina" : "eventos"} />;
}
