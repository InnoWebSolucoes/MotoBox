import type { Metadata } from "next";
import { ClassificacaoClient } from "./ClassificacaoClient";
import { classificacaoEquipas, classificacaoPilotos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Classificação Nacional",
  description:
    "Tabela de classificação do Campeonato Nacional de Motocross 2026 — pilotos e equipas, pontos, vitórias e pódios.",
};

export default function ClassificacaoPage() {
  return (
    <ClassificacaoClient
      pilotos={classificacaoPilotos()}
      equipas={classificacaoEquipas()}
    />
  );
}
