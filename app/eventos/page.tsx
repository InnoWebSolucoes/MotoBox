import type { Metadata } from "next";
import { CalendarDays, Megaphone } from "lucide-react";
import { lerEventos } from "@/lib/supabase/publico";
import { TIPOS_EVENTO } from "@/lib/types";
import { eventosFuturos, eventosPassados, tipoEvento } from "@/lib/motobox";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, CartaoNumerado, Pilulas, Seccao } from "@/components/painel/blocos";
import { CartaoEvento } from "@/components/painel/cartoes";

export const metadata: Metadata = {
  title: "Eventos",
  description:
    "Passeios, raides, encontros, concentrações, acções solidárias e formações para quem anda de mota em Angola.",
};

export default async function Eventos({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const eventos = await lerEventos();

  const presentes = TIPOS_EVENTO.filter((t) => eventos.some((e) => tipoEvento(e) === t));
  const activo = presentes.find((t) => t === tipo);
  const filtrar = (lista: typeof eventos) => (activo ? lista.filter((e) => tipoEvento(e) === activo) : lista);

  const futuros = filtrar(eventosFuturos(eventos));
  const passados = filtrar(eventosPassados(eventos));

  return (
    <PaginaInterior icone={<CalendarDays />}>
      <Abertura
        compacta
        foto="banner-eventos"
        sobretitulo="Eventos"
        titulo="Passeios, encontros e raides"
        texto="Onde a comunidade se junta: saídas de domingo, raides pelo país, concentrações, acções solidárias e formações. Para todos os tipos de mota."
      />

      <Seccao>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="titulo-2">Próximos eventos</h2>
          <p className="text-sm text-white/60">
            {futuros.length} {futuros.length === 1 ? "evento" : "eventos"}
            {activo ? ` · ${activo}` : ""}
          </p>
        </div>
        {presentes.length > 1 && (
          <div className="mt-8">
            <Pilulas
              rotulo="Tipo de evento"
              activa={activo ?? "todos"}
              itens={[
                { chave: "todos", texto: "Todos", href: "/eventos" },
                ...presentes.map((t) => ({ chave: t, texto: t, href: `/eventos?tipo=${encodeURIComponent(t)}` })),
              ]}
            />
          </div>
        )}

        {futuros.length ? (
          <div className="mt-8 grid gap-[var(--intervalo)]">
            {futuros.map((e) => (
              <CartaoEvento key={e.slug} evento={e} />
            ))}
          </div>
        ) : (
          <p className="painel painel-escuro mt-8 p-10 text-white/70">
            Não há eventos marcados{activo ? ` do tipo ${activo.toLowerCase()}` : ""} de momento. Volte em breve, ou
            divulgue o seu.
          </p>
        )}
      </Seccao>

      {passados.length > 0 && (
        <Seccao className="!pt-0">
          <h2 className="titulo-3">Já aconteceu</h2>
          <div className="mt-8 grid gap-[var(--intervalo)]">
            {passados.map((e) => (
              <CartaoEvento key={e.slug} evento={e} />
            ))}
          </div>
        </Seccao>
      )}

      <Seccao className="!pt-0">
        <CartaoNumerado
          numero={<Megaphone className="size-5" aria-hidden />}
          sobretitulo="Organiza um passeio, um encontro ou um raide?"
          titulo="Divulgue o seu evento na MotoBox"
          foto="painel-eventos"
        >
          Clubes, oficinas, escolas de condução e grupos de amigos: se o evento é para quem anda de mota, tem
          lugar aqui. Envie-nos a data, o local e o programa, e a equipa publica-o depois de confirmar.
          <span className="mt-6 block">
            <BotaoMB href={`/contacto?assunto=${encodeURIComponent("Divulgar um evento")}`}>Enviar um evento</BotaoMB>
          </span>
        </CartaoNumerado>
      </Seccao>
    </PaginaInterior>
  );
}
