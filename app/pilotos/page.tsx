import type { Metadata } from "next";
import { PilotosClient } from "./PilotosClient";
import { classificacaoPilotos } from "@/lib/data";
import { lerEquipas, lerPilotos } from "@/lib/supabase/publico";
import { lerPaginaDesporto } from "@/app/desporto/dados";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Pilotos",
  description:
    "Perfis dos pilotos do motociclismo angolano: estatísticas, equipas, motas e redes sociais.",
};

export default async function PilotosPage() {
  const [pilotos, equipas, { campeonato }] = await Promise.all([lerPilotos(), lerEquipas(), lerPaginaDesporto()]);
  const cores = Object.fromEntries(equipas.map((e) => [e.slug, e.cor]));
  return <PilotosClient pilotos={classificacaoPilotos(pilotos)} cores={cores} ordemCategorias={campeonato.categoriasPiloto} />;
}
