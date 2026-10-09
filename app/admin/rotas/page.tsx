import type { Metadata } from "next";
import { AdminRotas } from "./AdminRotas";

export const metadata: Metadata = { title: "Rotas · Gestão" };

/* /admin/rotas — as rotas; /admin/rotas?aba=pagina — a página Rotas. */
export default async function Pagina({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  return <AdminRotas abaInicial={aba === "pagina" ? "pagina" : "rotas"} />;
}
