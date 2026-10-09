import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Megaphone, Trophy } from "lucide-react";
import { lerEventos } from "@/lib/supabase/publico";
import { TIPOS_EVENTO } from "@/lib/types";
import { eventosFuturos, eventosPassados, tipoEvento } from "@/lib/motobox";
import { eComunidade } from "@/lib/desporto";
import { lerDoc } from "@/lib/conteudo";
import type { ConteudoPaginaEventos } from "@/lib/conteudo/grupos/eventos";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, CartaoNumerado, Pilulas, Seccao } from "@/components/painel/blocos";
import { Chip, Seta } from "@/components/painel/kit";
import { CartaoEvento } from "@/components/painel/cartoes";

// Os textos fixos desta página editam-se no painel: Eventos → Página Eventos.
export async function generateMetadata(): Promise<Metadata> {
  const t = await lerDoc<ConteudoPaginaEventos>("paginas.eventos");
  return { title: "Eventos", description: t.descricaoPesquisa };
}

export default async function Eventos({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  // As provas do campeonato vivem no calendário do Desporto; aqui ficam os eventos da comunidade.
  const [todos, t] = await Promise.all([lerEventos(), lerDoc<ConteudoPaginaEventos>("paginas.eventos")]);
  const eventos = todos.filter((e) => eComunidade(e.disciplina));

  const presentes = TIPOS_EVENTO.filter((t) => eventos.some((e) => tipoEvento(e) === t));
  const activo = presentes.find((t) => t === tipo);
  const filtrar = (lista: typeof eventos) => (activo ? lista.filter((e) => tipoEvento(e) === activo) : lista);

  const futuros = filtrar(eventosFuturos(eventos));
  const passados = filtrar(eventosPassados(eventos));

  return (
    <PaginaInterior icone={<CalendarDays />}>
      <Abertura compacta foto={t.foto} sobretitulo={t.sobretitulo} titulo={t.titulo} texto={t.texto} />

      <Seccao>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="titulo-2">{t.proximos}</h2>
          <p className="text-sm text-white/80">
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
                { chave: "todos", texto: t.todos, href: "/eventos" },
                ...presentes.map((t) => ({ chave: t, texto: t, href: `/eventos?tipo=${encodeURIComponent(t)}` })),
              ]}
            />
          </div>
        )}

        {t.provasMostrar && (
          <Link
            href={t.provasLigacao || "/calendario"}
            className="painel painel-escuro group mt-8 flex items-center gap-4 p-4 transition-colors hover:bg-near-black md:p-5"
          >
            <Chip><Trophy /></Chip>
            <span className="min-w-0 flex-1 text-sm leading-snug text-white/80 md:text-[15px]">
              <span className="text-white">{t.provasTitulo}</span>{t.provasTexto ? `: ${t.provasTexto}` : ""}
            </span>
            <Seta className="size-4 shrink-0" />
          </Link>
        )}

        {futuros.length ? (
          <div className="mt-8 grid gap-[var(--intervalo)]">
            {futuros.map((e) => (
              <CartaoEvento key={e.slug} evento={e} />
            ))}
          </div>
        ) : (
          <p className="painel painel-escuro mt-8 p-10 text-white/70">
            {activo ? t.vazioTipo.replaceAll("{tipo}", activo.toLowerCase()) : t.vazio}
          </p>
        )}
      </Seccao>

      {passados.length > 0 && (
        <Seccao className="!pt-0">
          <h2 className="titulo-3">{t.passados}</h2>
          <div className="mt-8 grid gap-[var(--intervalo)]">
            {passados.map((e) => (
              <CartaoEvento key={e.slug} evento={e} />
            ))}
          </div>
        </Seccao>
      )}

      {t.divulgarMostrar && (
        <Seccao className="!pt-0">
          <CartaoNumerado
            numero={<Megaphone className="size-5" aria-hidden />}
            sobretitulo={t.divulgarSobretitulo}
            titulo={t.divulgarTitulo}
            foto={t.divulgarFoto || undefined}
          >
            {t.divulgarTexto}
            {t.divulgarBotao && t.divulgarLigacao && (
              <span className="mt-6 block">
                <BotaoMB href={t.divulgarLigacao}>{t.divulgarBotao}</BotaoMB>
              </span>
            )}
          </CartaoNumerado>
        </Seccao>
      )}
    </PaginaInterior>
  );
}
