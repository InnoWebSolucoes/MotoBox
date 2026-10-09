import type { Metadata } from "next";
import { ClassificacaoClient } from "./ClassificacaoClient";
import { classificacaoEquipas, classificacaoPilotos } from "@/lib/data";
import { lerEquipas, lerPilotos } from "@/lib/supabase/publico";
import { lerPaginaDesporto } from "@/app/desporto/dados";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Classificação Nacional",
  description:
    "Tabela de classificação do Campeonato Nacional de Motocross 2026: pilotos e equipas, pontos, vitórias e pódios.",
};

export default async function ClassificacaoPage() {
  const [pilotos, equipas, { campeonato }] = await Promise.all([lerPilotos(), lerEquipas(), lerPaginaDesporto()]);
  return (
    <ClassificacaoClient
      pilotos={classificacaoPilotos(pilotos)}
      equipas={classificacaoEquipas(equipas)}
      campeonato={campeonato}
    />
  );
}
