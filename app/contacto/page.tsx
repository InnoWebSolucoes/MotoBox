import type { Metadata } from "next";
import { ContactoClient } from "./ContactoClient";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Fale com a Motobox Angola — pedidos de informação, divulgação de eventos, parcerias, patrocínios e imprensa.",
};

export default function ContactoPage() {
  return <ContactoClient />;
}
