import type { Metadata } from "next";
import { EventosClient } from "./EventosClient";
import { lerEventos } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Eventos",
  description:
    "Passeios, encontros de clubes, acções solidárias e formações da comunidade motard angolana. Datas, locais e bilhetes.",
};

export default async function EventosPage() {
  // Vai a lista inteira: o filtro "Provas" junta as corridas sem novo pedido.
  return <EventosClient eventos={await lerEventos()} />;
}
