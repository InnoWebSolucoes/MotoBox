import type { Metadata } from "next";
import { Globe2 } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { ImportarClient } from "./ImportarClient";

export const metadata: Metadata = {
  title: "Importar do estrangeiro",
  description:
    "Peças, equipamento, motas e mais de Portugal, Espanha e do resto da Europa, com orçamento até Angola: como funciona, o que diz a lei, onde procurar e como pedir.",
};

export default function ImportarPage() {
  return (
    <PaginaInterior icone={<Globe2 />}>
      <ImportarClient />
    </PaginaInterior>
  );
}
