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
import { fotoDe } from "@/app/eventos/foto";
import { preencher, type TextosBilhetes } from "@/lib/conteudo/grupos/geral";
import { lerTextosBilhetes, lerTextosCompra } from "@/lib/conteudo/ler-geral";

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
  const [e, t] = await Promise.all([lerEvento(slug), lerTextosBilhetes()]);
  return e
    ? { title: preencher(t.compra.pesquisaTitulo, { titulo: e.titulo }), description: e.resumo }
    : { title: t.pesquisa.titulo };
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [evento, { bilheteiraAberta }, t, compra] = await Promise.all([
    lerEvento(slug), lerDefinicoes(), lerTextosBilhetes(), lerTextosCompra(),
  ]);
  if (!evento) notFound();

  // A mesma regra das listas e da página do evento: sem venda, explica-se
  // porquê em vez de abrir um checkout que não pode concluir.
  const venda = vendaBilhetes(evento, bilheteiraAberta, instante());
  const sobretitulo = [
    t.compra.sobretitulo,
    evento.ronda ? preencher(t.compra.ronda, { ronda: evento.ronda }) : null,
    evento.disciplina,
  ].filter(Boolean).join(" · ");

  return (
    <PaginaInterior icone={<Ticket />}>
      <Abertura
        compacta
        foto={fotoDe(evento.slug, evento.imagem)}
        sobretitulo={sobretitulo}
        titulo={evento.titulo}
        tamanho="2"
        texto={`${intervaloDatas(evento.dataInicio, evento.dataFim)} · ${evento.circuito}, ${evento.provincia}`}
      />
      {venda === "a-venda" ? (
        <Checkout evento={evento} textos={compra} />
      ) : (
        <SemVenda
          evento={evento}
          textos={t.semVenda}
          motivo={
            venda === "esgotado" ? "esgotado" : !bilheteiraAberta && (evento.bilhetes?.length ?? 0) > 0 ? "fechada" : "sem-venda"
          }
        />
      )}
    </PaginaInterior>
  );
}

/** Mensagem no lugar do checkout, com o caminho para a página do evento. */
function SemVenda({
  evento, motivo, textos,
}: { evento: Evento; motivo: "esgotado" | "fechada" | "sem-venda"; textos: TextosBilhetes["semVenda"] }) {
  const m = motivo === "esgotado" ? textos.esgotado : motivo === "fechada" ? textos.fechada : textos.semVenda;
  return (
    <Seccao estreita>
      <Aviso titulo={m.titulo} icone={<Ticket />}>
        {m.texto}
      </Aviso>
      <div className="mt-[var(--intervalo)] flex flex-wrap gap-[var(--intervalo)]">
        <BotaoMB href={hrefEvento(evento)}>{textos.verEvento}</BotaoMB>
        <BotaoMB href="/bilhetes" variante="escuro">
          {textos.todos}
        </BotaoMB>
      </div>
    </Seccao>
  );
}
