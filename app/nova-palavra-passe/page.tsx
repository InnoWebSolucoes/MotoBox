import { KeyRound } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import type { Metadata } from "next";
import { NovaPalavraClient } from "./NovaPalavraClient";
import { textosContas } from "@/lib/auth/emails-conta";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = (await textosContas()).novaPalavra;
  return { title: t.titulo, robots: { index: false, follow: false } };
}

export default async function PaginaNovaPalavra() {
  // Textos editáveis em Definições → Contas.
  const textos = (await textosContas()).novaPalavra;
  return (
    <PaginaInterior icone={<KeyRound />}>
      <div className="coluna pt-20">
        <NovaPalavraClient textos={textos} />
      </div>
    </PaginaInterior>
  );
}
