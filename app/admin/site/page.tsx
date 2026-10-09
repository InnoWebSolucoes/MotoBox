import { EditorSite, type AbaSite } from "./EditorSite";

/* MOTOBOX ADMIN — Entrada e painel (?aba=entrada | contagem | painel | geral). */

const ABAS: AbaSite[] = ["entrada", "contagem", "painel", "geral"];

export default async function AdminSite({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const inicial = ABAS.includes(aba as AbaSite) ? (aba as AbaSite) : "entrada";
  return <EditorSite abaInicial={inicial} />;
}
