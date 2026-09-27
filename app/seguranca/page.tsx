import type { Metadata } from "next";
import { SegurancaClient } from "./SegurancaClient";

export const metadata: Metadata = {
  title: "Segurança",
  description:
    "Guia de segurança para quem anda de mota em Angola: a importância do capacete, condução à chuva e à noite, equipamento, passageiros, passeios em grupo, o que fazer num acidente e o seguro obrigatório.",
  openGraph: {
    title: "Segurança | Motobox Angola",
    description:
      "Capacete, chuva, equipamento, passageiros e primeiros socorros: o guia da Motobox para andar de mota em Angola com a cabeça no sítio.",
  },
};

export default function SegurancaPage() {
  return <SegurancaClient />;
}
