import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { lerEvento, lerEventos } from "@/lib/supabase/publico";
import { eComunidade, eProva } from "@/lib/desporto";
import { DetalheEvento } from "@/app/calendario/DetalheEvento";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Eventos criados depois do build são gerados no primeiro pedido
// (`dynamicParams` fica no valor por omissão, `true`).
export async function generateStaticParams() {
  const eventos = await lerEventos();
  return eventos.filter((e) => eComunidade(e.disciplina)).map((e) => ({ slug: e.slug }));
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

export default async function EventoComunidadePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const evento = await lerEvento(slug);
  if (!evento) notFound();
  // As provas têm a página no calendário de Desporto.
  if (eProva(evento.disciplina)) redirect(`/calendario/${evento.slug}`);

  return <DetalheEvento evento={evento} resultados={[]} />;
}
