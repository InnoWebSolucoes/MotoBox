import type { Metadata } from "next";
import { ContaClient } from "./ContaClient";
import {
  lerAnuncios, lerEquipas, lerEventos, lerNoticias, lerPilotos,
} from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "A minha conta",
  description:
    "Gira o seu perfil Motobox: bilhetes, preferências, pilotos e equipas seguidas, notificações e anúncios do marketplace.",
};

export default async function ContaPage() {
  const [eventos, pilotos, equipas, noticias, anuncios] = await Promise.all([
    lerEventos(), lerPilotos(), lerEquipas(), lerNoticias(), lerAnuncios(),
  ]);
  return (
    <ContaClient
      eventos={eventos}
      pilotos={pilotos}
      equipas={equipas}
      noticias={noticias}
      anuncios={anuncios}
    />
  );
}
