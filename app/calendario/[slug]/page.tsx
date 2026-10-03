import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { lerCorridas, lerDefinicoes, lerEvento, lerEventos } from "@/lib/supabase/publico";
import { eComunidade, eProva } from "@/lib/desporto";
import { DetalheEvento } from "../DetalheEvento";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Eventos criados depois do build são gerados no primeiro pedido
// (`dynamicParams` fica no valor por omissão, `true`).
export async function generateStaticParams() {
  const eventos = await lerEventos();
  return eventos.filter((e) => eProva(e.disciplina)).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = await lerEvento(slug);
  if (!e) return { title: "Evento não encontrado" };
  return { title: e.titulo, description: e.resumo };
}

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const evento = await lerEvento(slug);
  if (!evento) notFound();
  // Passeios, encontros e acções solidárias mudaram-se para /eventos. As ligações
  // antigas (emails, bilhetes, partilhas) continuam a funcionar por aqui.
  if (eComunidade(evento.disciplina)) redirect(`/eventos/${evento.slug}`);

  const [corridas, definicoes] = await Promise.all([lerCorridas(), lerDefinicoes()]);
  const resultados = corridas.filter((c) => c.eventoSlug === evento.slug);
  return <DetalheEvento evento={evento} resultados={resultados} bilheteiraAberta={definicoes.bilheteiraAberta} />;
}
