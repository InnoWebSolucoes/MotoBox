import type { Metadata } from "next";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { EntrarClient } from "./EntrarClient";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { textosContas } from "@/lib/auth/emails-conta";
import { lerDefinicoes } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = (await textosContas()).entrar;
  return {
    title: t.seoTitulo,
    description: t.seoDescricao,
    robots: { index: false, follow: false },
  };
}

export default async function PaginaEntrar() {
  // Textos editáveis em Definições → Contas; "Criar conta" em Definições → Geral.
  const [textos, definicoes] = await Promise.all([textosContas(), lerDefinicoes()]);
  return (
    <PaginaInterior icone={<UserRound />} rodape={false}>
      <Suspense fallback={null}>
        <EntrarClient textos={textos.entrar} registosAbertos={definicoes.registosAbertos !== false} />
      </Suspense>
    </PaginaInterior>
  );
}
