import type { Metadata } from "next";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { EntrarClient } from "./EntrarClient";
import { PaginaInterior } from "@/components/painel/PaginaInterior";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Aceda à sua conta MotoBox Angola.",
  robots: { index: false, follow: false },
};

export default function PaginaEntrar() {
  return (
    <PaginaInterior icone={<UserRound />} rodape={false}>
      <Suspense fallback={null}>
        <EntrarClient />
      </Suspense>
    </PaginaInterior>
  );
}
