import type { Metadata } from "next";
import { PilotosClient } from "./PilotosClient";
import { classificacaoPilotos } from "@/lib/data";
import { lerEquipas, lerPilotos } from "@/lib/supabase/publico";
import { lerPaginaDesporto } from "@/app/desporto/dados";
import { lerTemporada, lerTextosPilotos } from "@/lib/conteudo/ler-geral";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Os textos fixos editam-se no painel: Provas › Páginas do campeonato › Pilotos.
export async function generateMetadata(): Promise<Metadata> {
  const t = await lerTextosPilotos();
  return { title: t.pesquisa.titulo, description: t.pesquisa.descricao };
}

export default async function PilotosPage() {
  const [pilotos, equipas, { campeonato }, textos, ano] = await Promise.all([
    lerPilotos(), lerEquipas(), lerPaginaDesporto(), lerTextosPilotos(), lerTemporada(),
  ]);
  const cores = Object.fromEntries(equipas.map((e) => [e.slug, e.cor]));
  return (
    <PilotosClient
      pilotos={classificacaoPilotos(pilotos)}
      cores={cores}
      ordemCategorias={campeonato.categoriasPiloto}
      textos={textos}
      ano={ano}
    />
  );
}
