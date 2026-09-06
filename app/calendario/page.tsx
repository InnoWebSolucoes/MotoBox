import type { Metadata } from "next";
import { CalendarioClient } from "./CalendarioClient";
import { eventos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Calendário 2026",
  description:
    "Todas as provas do motociclismo angolano em 2026: motocross, enduro, rally e passeios. Datas, circuitos, horários e bilhetes.",
};

export default function CalendarioPage() {
  return <CalendarioClient eventos={eventos} />;
}
