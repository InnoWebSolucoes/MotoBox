import { SubNavDesporto } from "@/app/desporto/SubNavDesporto";

// Secção do Campeonato Nacional, dentro de Desporto: a faixa mostra o caminho e as secções irmãs.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SubNavDesporto />
      {children}
    </>
  );
}
