import type { Metadata } from "next";
import { PilotosClient } from "./PilotosClient";
import { classificacaoPilotos } from "@/lib/data";
import { lerEquipas, lerPilotos } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Pilotos",
  description:
    "Perfis dos pilotos do motociclismo angolano: estatísticas, equipas, motas e redes sociais.",
};

export default async function PilotosPage() {
  const [pilotos, equipas] = await Promise.all([lerPilotos(), lerEquipas()]);
  const cores = Object.fromEntries(equipas.map((e) => [e.slug, e.cor]));
  return <PilotosClient pilotos={classificacaoPilotos(pilotos)} cores={cores} />;
}
