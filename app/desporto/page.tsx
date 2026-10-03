import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { EmptyState, Icon, PageHero, SectionHead, Tag } from "@/components/ui";
import { TEMPORADA, formatData } from "@/lib/data";
import {
  MODALIDADES, MODALIDADE_PRINCIPAL, SECCOES_MOTOCROSS,
  eProva, estadoModalidade, eventosDaModalidade, instante,
} from "@/lib/desporto";
import { lerDefinicoes, lerEventos } from "@/lib/supabase/publico";
import { LinhaEventoCompacta } from "@/app/calendario/ListaEventos";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Desporto",
  description:
    "A competição a motor em Angola, modalidade a modalidade: motocross e Campeonato Nacional, enduro e rally-raid. Calendário, resultados, pilotos e equipas.",
};

/** Rótulos das secções do Motocross, em texto (a página é de servidor). */
const ROTULO_SECCAO: Record<string, string> = {
  "/calendario": "Calendário",
  "/resultados": "Resultados",
  "/classificacao": "Classificação",
  "/pilotos": "Pilotos",
  "/equipas": "Equipas",
};

export default async function DesportoPage() {
  const [eventos, { bilheteiraAberta }] = await Promise.all([lerEventos(), lerDefinicoes()]);
  const provas = eventos.filter((e) => eProva(e.disciplina));
  const agora = instante();

  const modalidades = MODALIDADES.map((m) => {
    const lista = eventosDaModalidade(m, provas);
    return {
      m,
      estado: estadoModalidade(m, eventos),
      total: lista.length,
      proxima: lista.find((e) => new Date(e.dataInicio).getTime() > agora),
      ultima: lista.filter((e) => new Date(e.dataFim).getTime() < agora).at(-1),
    };
  });
  const principal = modalidades.find((x) => x.m.slug === MODALIDADE_PRINCIPAL)!;
  const outras = modalidades.filter((x) => x.estado === "activo" && x.m.slug !== MODALIDADE_PRINCIPAL);
  const emBreve = modalidades.filter((x) => x.estado === "em-breve");
  const proximasProvas = provas.filter((e) => new Date(e.dataInicio).getTime() > agora).slice(0, 4);

  return (
    <>
      <PageHero
        imagem="resultados"
        eyebrow={`Temporada ${TEMPORADA}`}
        titulo="Desporto"
        descricao="A competição a motor em Angola, modalidade a modalidade. O Motocross reúne o Campeonato Nacional; o enduro e o rally-raid entram com as suas provas. Outras modalidades chegam em breve."
      >
        <div className="flex flex-wrap gap-6 sm:gap-10">
          {[
            { valor: 1 + outras.length, label: "Modalidades" },
            { valor: provas.length, label: "Provas" },
            { valor: provas.filter((e) => new Date(e.dataInicio).getTime() > agora).length, label: "Por disputar" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl text-white">{s.valor}</p>
              <p className="eyebrow mt-1 text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>
      </PageHero>

      {/* ============ MODALIDADES ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <SectionHead eyebrow="Competição" titulo="Modalidades" />

        <div className="mt-9 grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-[1.35fr_1fr]">
          {/* Motocross: a casa do campeonato, em grande, com atalhos para as secções */}
          <div className="group relative isolate flex min-h-[440px] flex-col justify-end overflow-hidden rounded-card lg:min-h-[520px]">
            <Placeholder
              nome={principal.m.imagem}
              className="absolute inset-0 -z-10 transition-transform duration-700 group-hover:scale-105"
              tamanhos="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
            {/* Ligação que cobre o cartão; os atalhos por cima ficam clicáveis à parte. */}
            <Link href={`/desporto/${principal.m.slug}`} className="absolute inset-0" aria-label={principal.m.nome} />
            <div className="pointer-events-none p-6 sm:p-8">
              <Tag tone="red">Campeonato Nacional</Tag>
              <h3 className="title-xl mt-4 text-5xl sm:text-6xl text-white">{principal.m.nome}</h3>
              <p className="mt-3 max-w-xl text-sm text-ink-300 leading-relaxed">{principal.m.descricao}</p>
              {principal.proxima && (
                <p className="mt-4 flex flex-wrap items-center gap-x-2 text-sm text-ink-200">
                  <span className="eyebrow text-mb-red">Próxima prova</span>
                  <span>{principal.proxima.titulo}</span>
                  <span className="text-ink-500">· {formatData(principal.proxima.dataInicio, { day: "2-digit", month: "short" })}</span>
                </p>
              )}
              <div className="pointer-events-auto relative mt-6 flex flex-wrap gap-2">
                {SECCOES_MOTOCROSS.slice(1).map((s) => (
                  <Link key={s.href} href={s.href} className="chip h-8 bg-ink-950/70 px-3.5 text-sm text-ink-100 backdrop-blur-sm">
                    {ROTULO_SECCAO[s.href]}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Outras modalidades com provas: fotografia arredondada e texto ao lado */}
          <div className="flex flex-col">
            {outras.length === 0 && (
              <EmptyState
                titulo="Sem outras provas"
                descricao="Quando houver provas de enduro ou rally-raid no calendário, a modalidade aparece aqui."
              />
            )}
            {outras.map(({ m, total, proxima, ultima }) => (
              <Link
                key={m.slug}
                href={`/desporto/${m.slug}`}
                className="group grid grid-cols-[9rem_1fr] sm:grid-cols-[12rem_1fr] items-start gap-5 border-b border-white/6 py-6 first:pt-0 last:border-0"
              >
                <Placeholder
                  nome={m.imagem}
                  className="media aspect-[4/3]"
                  tamanhos="(max-width: 640px) 144px, 192px"
                  largura={500}
                />
                <div className="min-w-0">
                  <p className="eyebrow text-ink-500">
                    {total} {total === 1 ? "prova" : "provas"}
                  </p>
                  <h3 className="mt-1.5 font-display text-2xl sm:text-3xl uppercase leading-none text-white transition-colors group-hover:text-mb-red">
                    {m.nome}
                  </h3>
                  <p className="mt-2 text-sm text-ink-400 leading-relaxed line-clamp-2">{m.descricao}</p>
                  {(proxima ?? ultima) && (
                    <p className="mt-3 text-xs text-ink-500">
                      <span className="text-ink-300">{proxima ? "Próxima:" : "Última:"}</span>{" "}
                      {(proxima ?? ultima)!.titulo} · {formatData((proxima ?? ultima)!.dataInicio, { day: "2-digit", month: "short" })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRÓXIMAS PROVAS + EM BREVE ============ */}
      <section className="bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 gap-x-14 gap-y-14 lg:grid-cols-[1.25fr_1fr]">
            <div>
              <SectionHead
                eyebrow="Calendário"
                titulo="Próximas provas"
                acao={{ href: "/calendario", texto: "Ver calendário" }}
              />
              {proximasProvas.length === 0 ? (
                <div className="mt-7">
                  <EmptyState
                    titulo="Sem provas agendadas"
                    descricao="As próximas provas aparecem aqui assim que forem anunciadas."
                  />
                </div>
              ) : (
                <ul className="mt-7">
                  {proximasProvas.map((e) => (
                    <LinhaEventoCompacta key={e.slug} e={e} bilheteiraAberta={bilheteiraAberta} />
                  ))}
                </ul>
              )}
            </div>

            <div>
              <SectionHead eyebrow="A caminho" titulo="Em breve" />
              <p className="mt-3 text-sm text-ink-400 leading-relaxed">
                A Motobox é sobre tudo o que tem motor. Estas modalidades entram no site à medida que houver provas para acompanhar.
              </p>
              <ul className="mt-5">
                {emBreve.map(({ m }) => (
                  <li key={m.slug} className="border-b border-white/6 last:border-0">
                    <Link href={`/desporto/${m.slug}`} className="group flex items-start gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
                          {m.nome}
                        </p>
                        <p className="mt-1 text-sm text-ink-500">{m.descricao}</p>
                      </div>
                      <Tag tone="neutral" className="mt-0.5 shrink-0">Em breve</Tag>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/contacto"
                className="group mt-6 inline-flex items-center gap-2 font-ui text-base text-white transition-colors hover:text-mb-red"
              >
                Organiza provas de outra modalidade? Fale connosco
                <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
