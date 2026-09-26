import type { Metadata } from "next";
import { Suspense } from "react";
import { ContaClient } from "./ContaClient";
import {
  lerEquipas, lerEventos, lerNoticias, lerPilotos,
} from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "A minha conta",
  description:
    "Gira o seu perfil Motobox: bilhetes, preferências, pilotos e equipas seguidas, notificações e anúncios do marketplace.",
};

export default async function ContaPage() {
  const [eventos, pilotos, equipas, noticias] = await Promise.all([
    lerEventos(), lerPilotos(), lerEquipas(), lerNoticias(),
  ]);
  // O separador aberto vem do endereço (?aba=), lido no cliente.
  return (
    <Suspense fallback={null}>
      <ContaClient eventos={eventos} pilotos={pilotos} equipas={equipas} noticias={noticias} />
    </Suspense>
  );
}
