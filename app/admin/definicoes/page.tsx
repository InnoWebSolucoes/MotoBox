import { Definicoes, type AbaDefinicoes } from "./Definicoes";

/* MOTOBOX ADMIN — Definições (?aba=geral | emails | contas). */

const ABAS: AbaDefinicoes[] = ["geral", "emails", "contas"];

export default async function AdminDefinicoes({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const inicial = ABAS.includes(aba as AbaDefinicoes) ? (aba as AbaDefinicoes) : "geral";
  return <Definicoes abaInicial={inicial} />;
}
