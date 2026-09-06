import type { Metadata } from "next";
import { PilotosClient } from "./PilotosClient";
import { classificacaoPilotos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pilotos",
  description:
    "Perfis dos pilotos do motociclismo angolano — estatísticas, equipas, motas e redes sociais.",
};

export default function PilotosPage() {
  return <PilotosClient pilotos={classificacaoPilotos()} />;
}
