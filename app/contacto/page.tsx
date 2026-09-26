import type { Metadata } from "next";
import { ContactoClient } from "./ContactoClient";
import { lerRedes } from "@/lib/redes";

// As redes vêm das Definições; o Next exige aqui um literal.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Fale com a Motobox Angola: pedidos de informação, divulgação de eventos, parcerias, patrocínios e imprensa.",
};

export default async function ContactoPage() {
  const redes = (await lerRedes()).filter((r) => r.rede !== "whatsapp");
  return <ContactoClient redes={redes} />;
}
