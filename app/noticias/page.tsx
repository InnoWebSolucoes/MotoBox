import type { Metadata } from "next";
import { NoticiasClient } from "./NoticiasClient";
import { noticias } from "@/lib/data";

export const metadata: Metadata = {
  title: "Notícias",
  description:
    "Notícias do motociclismo angolano e internacional — cobertura de provas, entrevistas, comunidade e agregação de fontes internacionais.",
};

export default function NoticiasPage() {
  return <NoticiasClient noticias={noticias} />;
}
