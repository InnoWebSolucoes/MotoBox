import type { Metadata } from "next";
import { NovaPalavraClient } from "./NovaPalavraClient";

export const metadata: Metadata = {
  title: "Nova palavra-passe",
  robots: { index: false, follow: false },
};

export default function PaginaNovaPalavra() {
  return <NovaPalavraClient />;
}
