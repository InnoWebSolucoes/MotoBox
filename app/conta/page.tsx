import type { Metadata } from "next";
import { ContaClient } from "./ContaClient";

export const metadata: Metadata = {
  title: "A minha conta",
  description:
    "Gira o seu perfil Motobox: bilhetes, preferências, pilotos e equipas seguidas, notificações e anúncios do marketplace.",
};

export default function ContaPage() {
  return <ContaClient />;
}
