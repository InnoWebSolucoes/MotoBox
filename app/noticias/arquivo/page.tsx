import type { Metadata } from "next";
import { ArquivoClient } from "./ArquivoClient";
import { lerNoticias } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Arquivo de notícias",
  description:
    "Todas as notícias publicadas pela Motobox Angola, organizadas por ano e mês: provas, entrevistas, comunidade e motociclismo internacional.",
};

export default async function ArquivoNoticiasPage() {
  // O arquivo só mostra título, data, categoria e fonte: o corpo das
  // notícias não precisa de ir para o navegador.
  const noticias = (await lerNoticias()).map(({ slug, titulo, categoria, data, fonte }) => ({
    slug, titulo, categoria, data, fonte,
  }));
  return <ArquivoClient noticias={noticias} />;
}
