import { Lock } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import type { Metadata } from "next";
import { SemAcessoClient } from "./SemAcessoClient";

export const metadata: Metadata = {
  title: "Sem acesso",
  robots: { index: false, follow: false },
};

export default function PaginaSemAcesso() {
  return (
    <PaginaInterior icone={<Lock />}>
      <div className="coluna pt-20">
        <SemAcessoClient />
      </div>
    </PaginaInterior>
  );
}
