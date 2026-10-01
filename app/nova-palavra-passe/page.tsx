import { KeyRound } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import type { Metadata } from "next";
import { NovaPalavraClient } from "./NovaPalavraClient";

export const metadata: Metadata = {
  title: "Nova palavra-passe",
  robots: { index: false, follow: false },
};

export default function PaginaNovaPalavra() {
  return (
    <PaginaInterior icone={<KeyRound />}>
      <div className="coluna pt-20">
        <NovaPalavraClient />
      </div>
    </PaginaInterior>
  );
}
