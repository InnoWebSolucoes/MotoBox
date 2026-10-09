import { EditorLegais, type AbaLegais } from "./EditorLegais";

/* MOTOBOX ADMIN — Páginas legais (?aba=documentos | textos). */

export default async function AdminLegais({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const inicial: AbaLegais = aba === "textos" ? "textos" : "documentos";
  return <EditorLegais abaInicial={inicial} />;
}
