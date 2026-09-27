import { SubNavDesporto } from "@/app/desporto/SubNavDesporto";

// Esta secção vive dentro de Desporto › Motocross: a faixa mostra o caminho e as secções irmãs.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SubNavDesporto />
      {children}
    </>
  );
}
