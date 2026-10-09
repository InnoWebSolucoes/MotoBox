import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, CalendarPlus, Users } from "lucide-react";
import { lerEvento, lerEventos } from "@/lib/supabase/publico";
import { eventosFuturos, intervaloDatas, tipoEvento } from "@/lib/motobox";
import { eComunidade, entradaDoEvento } from "@/lib/desporto";
import { lerDoc, lerItem } from "@/lib/conteudo";
import type { ConteudoPaginaEventos, ExtraEvento } from "@/lib/conteudo/grupos/eventos";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Numeros, Seccao } from "@/components/painel/blocos";
import { CartaoEvento } from "@/components/painel/cartoes";
import { Chip, Seta } from "@/components/painel/kit";
import type { Evento } from "@/lib/types";
import { fotoDe } from "../foto";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export async function generateStaticParams() {
  const eventos = await lerEventos();
  return eventos.filter((e) => eComunidade(e.disciplina)).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await lerEvento(slug);
  if (!e) return { title: "Evento não encontrado" };
  return { title: e.titulo, description: e.resumo };
}

/** Ficheiro .ics de dia inteiro, para juntar o evento ao calendário do telemóvel. */
function ficheiroCalendario(e: Evento): string {
  const dia = (iso: string) => iso.slice(0, 10).replace(/-/g, "");
  const fim = new Date(`${(e.dataFim || e.dataInicio).slice(0, 10)}T00:00:00Z`);
  fim.setUTCDate(fim.getUTCDate() + 1);
  const limpar = (t: string) => t.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MotoBox Angola//Eventos//PT",
    "BEGIN:VEVENT",
    `UID:${e.slug}@motobox`,
    `DTSTAMP:${dia(new Date().toISOString())}T000000Z`,
    `DTSTART;VALUE=DATE:${dia(e.dataInicio)}`,
    `DTEND;VALUE=DATE:${fim.toISOString().slice(0, 10).replace(/-/g, "")}`,
    `SUMMARY:${limpar(e.titulo)}`,
    `LOCATION:${limpar(`${e.circuito}, ${e.localidade}, ${e.provincia}`)}`,
    `DESCRIPTION:${limpar(e.resumo)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(linhas.join("\r\n"))}`;
}

export default async function EventoPagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const evento = await lerEvento(slug);
  if (!evento) notFound();
  // Uma prova tem a sua página no calendário do Desporto (bilhetes, horários, resultados).
  if (!eComunidade(evento.disciplina)) redirect(`/calendario/${evento.slug}`);

  const futuro = eventosFuturos([evento]).length > 0;
  const outros = eventosFuturos((await lerEventos()).filter((e) => eComunidade(e.disciplina)))
    .filter((e) => e.slug !== evento.slug).slice(0, 3);
  const quando = intervaloDatas(evento.dataInicio, evento.dataFim);
  // Textos fixos e "Como participar" (a tabela não tem coluna para ele): editáveis no painel, em Eventos.
  const [t, extra] = await Promise.all([
    lerDoc<ConteudoPaginaEventos>("paginas.eventos"),
    lerItem<ExtraEvento>("eventos-extra", evento.slug),
  ]);
  const entrada = (typeof extra?.entrada === "string" ? extra.entrada : entradaDoEvento(evento)).trim();

  return (
    <PaginaInterior icone={<CalendarDays />}>
      <Abertura
        foto={fotoDe(evento.slug, evento.imagem)}
        sobretitulo={`${tipoEvento(evento)} · ${quando}`}
        titulo={evento.titulo}
        tamanho="2"
        texto={evento.resumo}
      >
        {futuro ? (
          <a
            href={ficheiroCalendario(evento)}
            download={`${evento.slug}.ics`}
            className="group inline-flex h-14 w-full max-w-[20.5rem] items-center justify-between gap-6 rounded-[var(--raio)] bg-mb-red px-5 text-[15px] text-white transition-colors hover:bg-mb-red-dark"
          >
            {t.eventoCalendario}
            <CalendarPlus className="size-5" aria-hidden />
          </a>
        ) : (
          <p className="inline-flex rounded-[var(--raio)] bg-black/50 px-4 py-3 text-sm text-white/85 backdrop-blur-md">
            {t.eventoPassado}
          </p>
        )}
      </Abertura>

      <Seccao>
        <Numeros
          colunas={4}
          itens={[
            { valor: <span className="text-2xl lg:text-3xl">{quando.replace(/ de \d{4}$/, "")}</span>, texto: t.eventoRotuloData },
            { valor: <span className="text-2xl lg:text-3xl">{evento.localidade}</span>, texto: `${evento.circuito}, ${evento.provincia}` },
            { valor: <span className="text-2xl lg:text-3xl">{tipoEvento(evento)}</span>, texto: t.eventoRotuloTipo },
            { valor: <span className="text-2xl lg:text-3xl">{evento.organizador.split(",")[0]}</span>, texto: t.eventoRotuloOrganizacao },
          ]}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <h2 className="titulo-3">{t.eventoSobre}</h2>
            <div className="prosa mt-6 max-w-[62ch]">
              {evento.descricao.split(/\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {(evento.horarios.length > 0 || entrada) && (
            <div>
              {/* Como participar: só quando a equipa o escreveu no painel. */}
              {entrada && (
                <div className="painel painel-escuro mb-12 p-6">
                  <Chip><Users /></Chip>
                  <h2 className="titulo-4 mt-6">{t.eventoParticipar}</h2>
                  <p className="mt-3 text-xl font-semibold leading-snug">{entrada}</p>
                </div>
              )}
              {evento.horarios.length > 0 && (
                <>
                  <h2 className="titulo-3">{t.eventoPrograma}</h2>
                  <ol className="mt-6 grid gap-[var(--intervalo)]">
                    {evento.horarios.map((h, i) => (
                      <li key={i} className="painel painel-escuro grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-4 p-4">
                        <span className="rounded-[4px] bg-mb-red px-2 py-2 text-center text-lg font-semibold tabular-nums">
                          {h.hora}
                        </span>
                        <span>
                          <span className="block text-xs text-white/55">{h.dia}</span>
                          <span className="block text-[15px] leading-snug">{h.sessao}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}
        </div>
      </Seccao>

      {t.eventoAvisoMostrar && (
        <Seccao className="!pt-0">
          <div className="painel painel-escuro flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-lg font-semibold">{t.eventoAvisoTitulo}</p>
              {t.eventoAvisoTexto && (
                <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-white/70">{t.eventoAvisoTexto}</p>
              )}
            </div>
            {t.eventoAvisoBotao && t.eventoAvisoLigacao && (
              <BotaoMB href={t.eventoAvisoLigacao} variante="escuro">{t.eventoAvisoBotao}</BotaoMB>
            )}
          </div>
        </Seccao>
      )}

      {outros.length > 0 && (
        <Seccao className="!pt-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="titulo-3">{t.eventoOutros}</h2>
            <Link href="/eventos" className="group inline-flex items-center gap-2 text-sm">
              <span className="sublinhado">{t.eventoTodos}</span>
              <Seta className="size-3" />
            </Link>
          </div>
          <div className="mt-8 grid gap-[var(--intervalo)]">
            {outros.map((e) => (
              <CartaoEvento key={e.slug} evento={e} />
            ))}
          </div>
        </Seccao>
      )}
    </PaginaInterior>
  );
}
