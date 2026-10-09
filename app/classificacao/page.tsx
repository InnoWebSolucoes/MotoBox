import type { Metadata } from "next";
import { ClassificacaoClient } from "./ClassificacaoClient";
import { classificacaoEquipas, classificacaoPilotos } from "@/lib/data";
import { lerEquipas, lerPilotos } from "@/lib/supabase/publico";
import { lerPaginaDesporto } from "@/app/desporto/dados";
import { preencher } from "@/lib/conteudo/grupos/geral";
import { lerTemporada, lerTextosClassificacao } from "@/lib/conteudo/ler-geral";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Os textos fixos editam-se no painel: Provas › Páginas do campeonato › Classificação.
export async function generateMetadata(): Promise<Metadata> {
  const [t, ano, { campeonato }] = await Promise.all([lerTextosClassificacao(), lerTemporada(), lerPaginaDesporto()]);
  const valores = { ano, campeonato: campeonato.nome };
  return { title: preencher(t.pesquisa.titulo, valores), description: preencher(t.pesquisa.descricao, valores) };
}

export default async function ClassificacaoPage() {
  const [pilotos, equipas, { campeonato }, textos, ano] = await Promise.all([
    lerPilotos(), lerEquipas(), lerPaginaDesporto(), lerTextosClassificacao(), lerTemporada(),
  ]);
  return (
    <ClassificacaoClient
      pilotos={classificacaoPilotos(pilotos)}
      equipas={classificacaoEquipas(equipas)}
      campeonato={campeonato}
      textos={textos}
      ano={ano}
    />
  );
}
