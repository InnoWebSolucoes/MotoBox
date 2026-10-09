import { EditorSite, type AbaSite } from "./EditorSite";

/* MOTOBOX ADMIN — Entrada e painel (?aba=entrada | abertura | contagem (Em foco) | painel | geral). */

const ABAS: AbaSite[] = ["entrada", "abertura", "contagem", "painel", "geral"];

export default async function AdminSite({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const inicial = ABAS.includes(aba as AbaSite) ? (aba as AbaSite) : "entrada";
  return <EditorSite abaInicial={inicial} />;
}
