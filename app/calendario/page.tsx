import type { Metadata } from "next";
import { CalendarioClient } from "./CalendarioClient";
import { lerDefinicoes, lerEventos } from "@/lib/supabase/publico";
import { eProva } from "@/lib/desporto";
import { preencher } from "@/lib/conteudo/grupos/geral";
import { lerTemporada, lerTextosCalendario } from "@/lib/conteudo/ler-geral";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Os textos fixos editam-se no painel: Provas › Páginas do campeonato › Calendário.
export async function generateMetadata(): Promise<Metadata> {
  const [t, ano] = await Promise.all([lerTextosCalendario(), lerTemporada()]);
  return { title: preencher(t.pesquisa.titulo, { ano }), description: preencher(t.pesquisa.descricao, { ano }) };
}

export default async function CalendarioPage() {
  const [todos, definicoes, textos, ano] = await Promise.all([
    lerEventos(), lerDefinicoes(), lerTextosCalendario(), lerTemporada(),
  ]);
  // Só provas; os eventos da comunidade estão em /eventos.
  const eventos = todos.filter((e) => eProva(e.disciplina));
  return <CalendarioClient eventos={eventos} bilheteiraAberta={definicoes.bilheteiraAberta} textos={textos} ano={ano} />;
}
