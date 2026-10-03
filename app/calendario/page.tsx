import type { Metadata } from "next";
import { CalendarioClient } from "./CalendarioClient";
import { lerDefinicoes, lerEventos } from "@/lib/supabase/publico";
import { eProva } from "@/lib/desporto";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Calendário de provas 2026",
  description:
    "As provas do motociclismo angolano em 2026: motocross, enduro e rally-raid. Datas, circuitos, horários e bilhetes.",
};

export default async function CalendarioPage() {
  const [todos, definicoes] = await Promise.all([lerEventos(), lerDefinicoes()]);
  // Só provas; os eventos da comunidade estão em /eventos.
  const eventos = todos.filter((e) => eProva(e.disciplina));
  return <CalendarioClient eventos={eventos} bilheteiraAberta={definicoes.bilheteiraAberta} />;
}
