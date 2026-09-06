import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Checkout } from "./Checkout";
import { eventos, getEvento } from "@/lib/data";

export function generateStaticParams() {
  return eventos.filter((e) => e.bilhetes?.length).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getEvento(slug);
  return e ? { title: `Bilhetes — ${e.titulo}`, description: e.resumo } : { title: "Bilhetes" };
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const evento = getEvento(slug);
  if (!evento || !evento.bilhetes?.length) notFound();
  return <Checkout evento={evento} />;
}
