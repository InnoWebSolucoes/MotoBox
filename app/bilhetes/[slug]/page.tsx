import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Ticket } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Seccao } from "@/components/painel/blocos";
import { hrefEvento, instante, vendaBilhetes } from "@/lib/desporto";
import { intervaloDatas } from "@/lib/motobox";
import { lerDefinicoes, lerEvento, lerEventos } from "@/lib/supabase/publico";
import type { Evento } from "@/lib/types";
import { Aviso } from "@/app/calendario/pecas";
import { Checkout } from "./Checkout";

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
  const sobretitulo = ["Bilhetes", evento.ronda ? `Ronda ${evento.ronda}` : null, evento.disciplina].filter(Boolean).join(" · ");

  return (
    <PaginaInterior icone={<Ticket />}>
      <Abertura
        compacta
        foto={[evento.slug, evento.imagem]}
        sobretitulo={sobretitulo}
        titulo={evento.titulo}
        tamanho="2"
        texto={`${intervaloDatas(evento.dataInicio, evento.dataFim)} · ${evento.circuito}, ${evento.provincia}`}
      />
      {venda === "a-venda" ? (
        <Checkout evento={evento} />
      ) : (
        <SemVenda
          evento={evento}
          motivo={
            venda === "esgotado" ? "esgotado" : !bilheteiraAberta && (evento.bilhetes?.length ?? 0) > 0 ? "fechada" : "sem-venda"
          }
        />
      )}
    </PaginaInterior>
  );
}

const MOTIVOS = {
  esgotado: {
    titulo: "Bilhetes esgotados",
    texto: "Já não há bilhetes à venda na MotoBox para este evento.",
  },
  fechada: {
    titulo: "Bilheteira fechada",
    texto: "A venda de bilhetes online na MotoBox está fechada de momento. Volte mais tarde ou veja na página do evento como participar.",
  },
  "sem-venda": {
    titulo: "Sem bilhetes à venda",
    texto: "Este evento não tem venda de bilhetes online na MotoBox. Veja na página do evento como participar.",
  },
} as const;

/** Mensagem no lugar do checkout, com o caminho para a página do evento. */
function SemVenda({ evento, motivo }: { evento: Evento; motivo: keyof typeof MOTIVOS }) {
  const m = MOTIVOS[motivo];
  return (
    <Seccao estreita>
      <Aviso titulo={m.titulo} icone={<Ticket />}>
        {m.texto}
      </Aviso>
      <div className="mt-[var(--intervalo)] flex flex-wrap gap-[var(--intervalo)]">
        <BotaoMB href={hrefEvento(evento)}>Ver o evento</BotaoMB>
        <BotaoMB href="/bilhetes" variante="escuro">
          Todos os bilhetes
        </BotaoMB>
      </div>
    </Seccao>
  );
}
