import type { Metadata } from "next";
import { GestaoClubes } from "./GestaoClubes";

export const metadata: Metadata = { title: "Clubes e movimentos · Gestão" };

/**
 * /admin/clubes — os clubes, os movimentos (?aba=movimentos) e os textos fixos
 * de /clubes e da página de cada clube (?aba=pagina).
 */
export default async function PaginaClubes({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  return <GestaoClubes abaInicial={aba === "pagina" ? "pagina" : aba === "movimentos" ? "movimentos" : "clubes"} />;
}
