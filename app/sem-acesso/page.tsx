import type { Metadata } from "next";
import { SemAcessoClient } from "./SemAcessoClient";

export const metadata: Metadata = {
  title: "Sem acesso",
  robots: { index: false, follow: false },
};

export default function PaginaSemAcesso() {
  return <SemAcessoClient />;
}
