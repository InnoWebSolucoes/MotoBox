import type { Metadata } from "next";
import { GestaoArtigos } from "./GestaoArtigos";

export const metadata: Metadata = { title: "Artigos · Gestão" };

/** /admin/noticias — os artigos do site e, em ?aba=pagina, os textos fixos de /artigos. */
export default async function PaginaArtigos({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  return <GestaoArtigos abaInicial={aba === "pagina" ? "pagina" : "artigos"} />;
}
