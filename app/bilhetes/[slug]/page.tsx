import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Checkout } from "./Checkout";
import { lerEvento, lerEventos } from "@/lib/supabase/publico";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Eventos criados depois do build são gerados no primeiro pedido
// (`dynamicParams` fica no valor por omissão, `true`).
export async function generateStaticParams() {
  const eventos = await lerEventos();
  return eventos.filter((e) => e.bilhetes?.length).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = await lerEvento(slug);
  return e ? { title: `Bilhetes para ${e.titulo}`, description: e.resumo } : { title: "Bilhetes" };
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const evento = await lerEvento(slug);
  if (!evento || !evento.bilhetes?.length) notFound();
  return <Checkout evento={evento} />;
}
