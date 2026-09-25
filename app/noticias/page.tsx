import type { Metadata } from "next";
import { NoticiasClient } from "./NoticiasClient";
import { lerNoticias } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Notícias",
  description:
    "Notícias do motociclismo angolano e internacional: cobertura de provas, entrevistas, comunidade e agregação de fontes internacionais.",
};

export default async function NoticiasPage() {
  return <NoticiasClient noticias={await lerNoticias()} />;
}
