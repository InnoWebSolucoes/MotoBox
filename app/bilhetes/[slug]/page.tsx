import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Checkout } from "./Checkout";
import { ButtonLink, Icon } from "@/components/ui";
import { hrefEvento, instante, vendaBilhetes } from "@/lib/desporto";
import { lerDefinicoes, lerEvento, lerEventos } from "@/lib/supabase/publico";
import type { Evento } from "@/lib/types";

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
  const [evento, { bilheteiraAberta }] = await Promise.all([lerEvento(slug), lerDefinicoes()]);
  if (!evento) notFound();

  // A mesma regra das listas e da página do evento: sem venda, explica-se
  // porquê em vez de abrir um checkout que não pode concluir.
  const venda = vendaBilhetes(evento, bilheteiraAberta, instante());
  if (venda !== "a-venda") {
    const fechada = !bilheteiraAberta && (evento.bilhetes?.length ?? 0) > 0;
    return <SemVenda evento={evento} motivo={venda === "esgotado" ? "esgotado" : fechada ? "fechada" : "sem-venda"} />;
  }
  return <Checkout evento={evento} />;
}

const MOTIVOS = {
  esgotado: {
    titulo: "Bilhetes esgotados",
    texto: "Já não há bilhetes à venda na Motobox para este evento.",
  },
  fechada: {
    titulo: "Bilheteira fechada",
    texto: "A venda de bilhetes online na Motobox está fechada de momento. Volte mais tarde ou veja na página do evento como participar.",
  },
  "sem-venda": {
    titulo: "Sem bilhetes à venda",
    texto: "Este evento não tem venda de bilhetes online na Motobox. Veja na página do evento como participar.",
  },
} as const;

/** Mensagem no lugar do checkout, com o caminho para a página do evento. */
function SemVenda({ evento, motivo }: { evento: Evento; motivo: keyof typeof MOTIVOS }) {
  const m = MOTIVOS[motivo];
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="card p-8 sm:p-10 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-ink-800 text-ink-300">
          <Icon name="ticket" className="size-7" />
        </span>
        <p className="eyebrow mt-5 text-mb-red">{evento.titulo}</p>
        <h1 className="title-xl mt-3 text-2xl sm:text-3xl">{m.titulo}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-ink-400 leading-relaxed">{m.texto}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={hrefEvento(evento)}>Ver o evento</ButtonLink>
          <ButtonLink href="/bilhetes" variant="outline">
            Todos os bilhetes
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
