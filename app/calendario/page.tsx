import type { Metadata } from "next";
import { CalendarioClient } from "./CalendarioClient";
import { lerEventos } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Calendário 2026",
  description:
    "Todas as provas do motociclismo angolano em 2026: motocross, enduro, rally e passeios. Datas, circuitos, horários e bilhetes.",
};

export default async function CalendarioPage() {
  return <CalendarioClient eventos={await lerEventos()} />;
}
