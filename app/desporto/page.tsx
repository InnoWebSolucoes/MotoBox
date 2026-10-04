import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { C } from "@/components/T";
import { Icon, PageHero, SectionHead, Tag } from "@/components/ui";
import { TEMPORADA, formatData } from "@/lib/data";
import {
  MODALIDADES, MODALIDADE_PRINCIPAL, SECCOES_MOTOCROSS, eProva, eventosDaModalidade, instante,
} from "@/lib/desporto";
import { lerConteudo } from "@/lib/desporto-conteudo";
import { lerCorridas, lerDefinicoes, lerEquipas, lerEventos, lerPilotos } from "@/lib/supabase/publico";
import { Campeonato } from "./Campeonato";
import { SubNavDesporto } from "./SubNavDesporto";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Desporto",
  description:
    "A competição a motor em Angola, modalidade a modalidade: motocross e Campeonato Nacional, enduro, rally-raid, velocidade, moto 4 e quads, motos de água, karting e automobilismo. Calendário, resultados, pilotos, equipas e a cena em Angola.",
};

/** Rótulos das secções do Motocross, em texto (a página é de servidor). */
const ROTULO_SECCAO: Record<string, string> = {
  "/calendario": "Calendário",
  "/resultados": "Resultados",
  "/classificacao": "Classificação",
  "/pilotos": "Pilotos",
  "/equipas": "Equipas",
};

/** Quem organiza, com fonte (o detalhe está nos guias de cada modalidade). */
const FEDERACOES = [
  {
    sigla: "FAM",
    nome: "Federação Angolana de Motociclismo",
    texto: "Federação das motas desde 2024, membro da FIM desde 2025: motocross, velocidade e o resto do motociclismo.",
    fontes: [{ nome: "FIM", url: "https://www.fim-moto.com/en/fim/continental-unions-national-federations/fim-africa/federations/fam" }],
    modalidades: ["motocross", "velocidade"],
  },
  {
    sigla: "FADM",
    nome: "Federação Angolana de Desportos Motorizados",
    texto: "O membro angolano da FIA. Em 2026 organiza a velocidade automóvel, o rali-raid, o karting e o drift e drag.",
    fontes: [
      { nome: "FIA", url: "https://www.fia.com/members/region/africa-4/member_club/sport-1" },
      { nome: "FADM", url: "https://www.fadm.ao/wp-content/uploads/2026/04/Calendarios-FADM.pdf" },
    ],
    modalidades: ["rally", "automobilismo"],
  },
];

export default async function DesportoPage() {
  const [eventos, corridas, pilotos, equipas, { bilheteiraAberta }] = await Promise.all([
    lerEventos(), lerCorridas(), lerPilotos(), lerEquipas(), lerDefinicoes(),
  ]);
  const provas = eventos.filter((e) => eProva(e.disciplina));
  const agora = instante();

  const modalidades = MODALIDADES.map((m) => {
    const lista = eventosDaModalidade(m, provas);
    return {
      m,
      total: lista.length,
      proxima: lista.find((e) => new Date(e.dataInicio).getTime() > agora),
      ultima: lista.filter((e) => new Date(e.dataFim).getTime() < agora).at(-1),
      destaque: lerConteudo(m.slug)?.numeros[0],
    };
  });
  const principal = modalidades.find((x) => x.m.slug === MODALIDADE_PRINCIPAL)!;
  const competicao = modalidades.filter((x) => x.m.grupo === "competicao");
  const outras = modalidades.filter((x) => x.m.grupo === "outras");

  return (
    <>
      <SubNavDesporto />
      <PageHero
        imagem="resultados"
        eyebrow={`Temporada ${TEMPORADA}`}
        titulo="Desporto"
        descricao="A competição a motor em Angola: o Campeonato Nacional, com o calendário, a classificação, os resultados, os pilotos e as equipas, e cada modalidade com a sua página, do motocross ao karting."
      >
        <div className="flex flex-wrap gap-6 sm:gap-10">
          {[
            { valor: provas.length, label: "Provas" },
            { valor: corridas.length, label: "Corridas disputadas" },
            { valor: pilotos.length, label: "Pilotos" },
            { valor: MODALIDADES.length, label: "Modalidades" },
            { valor: provas.filter((e) => new Date(e.dataInicio).getTime() > agora).length, label: "Por disputar" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl text-white">{s.valor}</p>
              <p className="eyebrow mt-1 text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>
      </PageHero>

      {/* ============ CAMPEONATO NACIONAL: o que estava nas antigas secções Calendário, Resultados e Pilotos ============ */}
      <Campeonato provas={provas} corridas={corridas} pilotos={pilotos} equipas={equipas} bilheteiraAberta={bilheteiraAberta} />

      {/* ============ COMPETIÇÃO: MOTOCROSS EM DESTAQUE + ENDURO E RALLY-RAID ============ */}
      <section id="modalidades" className="mx-auto max-w-7xl scroll-mt-28 border-t border-white/6 px-4 sm:px-6 py-16">
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
              <p className="mt-3 max-w-xl text-sm text-ink-300 leading-relaxed">
                <C>{principal.m.descricao}</C>
              </p>
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
                <Link
                  href={`/desporto/${principal.m.slug}#o-que-e`}
                  className="chip h-8 bg-ink-950/70 px-3.5 text-sm text-ink-100 backdrop-blur-sm"
                >
                  Guia
                </Link>
              </div>
            </div>
          </div>

          {/* Enduro e Rally-Raid: fotografia arredondada e texto ao lado */}
          <div className="flex flex-col">
            {competicao.map(({ m, total, proxima, ultima }) => (
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
                    {total > 0 ? `${total} ${total === 1 ? "prova" : "provas"}` : "Guia e cena em Angola"}
                  </p>
                  <h3 className="mt-1.5 font-display text-2xl sm:text-3xl uppercase leading-none text-white transition-colors group-hover:text-mb-red">
                    {m.nome}
                  </h3>
                  <p className="mt-2 text-sm text-ink-400 leading-relaxed line-clamp-2">
                    <C>{m.descricao}</C>
                  </p>
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

      {/* ============ OUTRAS MODALIDADES ============ */}
      <section className="border-t border-white/6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <SectionHead
            eyebrow="Tudo o que tem motor"
            titulo="Outras modalidades"
            descricao="Cada uma tem página própria: o que é, as classes, quem corre em Angola, os campeonatos de referência e como começar. Com fontes."
          />
          <div className="mt-9 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {outras.map(({ m, total, destaque }) => (
              <Link key={m.slug} href={`/desporto/${m.slug}`} className="group flex flex-col">
                <div className="relative">
                  <Placeholder
                    nome={m.imagem}
                    className="media aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.02]"
                    tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    largura={700}
                  />
                  {total > 0 && (
                    <Tag tone="red" className="absolute left-3 top-3">
                      {`${total} ${total === 1 ? "prova" : "provas"}`}
                    </Tag>
                  )}
                </div>
                <h3 className="mt-4 font-display text-2xl uppercase leading-none text-white transition-colors group-hover:text-mb-red">
                  {m.nome}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">
                  <C>{m.descricao}</C>
                </p>
                {destaque && (
                  <p className="mt-4 flex items-baseline gap-3 border-t border-white/6 pt-3">
                    <span className="shrink-0 font-display text-xl leading-none text-mb-red">{destaque.valor}</span>
                    <span className="text-xs leading-snug text-ink-500">
                      <C>{destaque.label}</C>
                    </span>
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-2 font-ui text-sm text-white">
                  Conhecer a modalidade
                  <Icon name="arrow" className="size-3.5 text-mb-red transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ QUEM ORGANIZA ============ */}
      <section className="bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="max-w-3xl">
            <SectionHead eyebrow="Federações" titulo="Quem organiza" />
            <ul className="mt-6">
              {FEDERACOES.map((f) => (
                <li key={f.sigla} className="border-b border-white/6 py-5 first:pt-0 last:border-0">
                  <p className="flex items-baseline gap-3">
                    <span className="font-display text-2xl leading-none text-white">{f.sigla}</span>
                    <span className="text-sm text-ink-300">{f.nome}</span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">
                    <C>{f.texto}</C>
                    {f.fontes.map((fonte) => (
                      <a
                        key={fonte.url}
                        href={fonte.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 whitespace-nowrap text-xs text-ink-500 underline decoration-white/15 underline-offset-2 hover:text-white"
                      >
                        {fonte.nome}
                      </a>
                    ))}
                  </p>
                  <p className="mt-3 flex flex-wrap gap-2">
                    {f.modalidades.map((slug) => {
                      const m = MODALIDADES.find((x) => x.slug === slug);
                      return m ? (
                        <Link key={slug} href={`/desporto/${slug}`} className="chip h-7 px-3 text-[13px]">
                          {m.nome}
                        </Link>
                      ) : null;
                    })}
                  </p>
                </li>
              ))}
            </ul>
            <Link
              href="/contacto"
              className="group mt-6 inline-flex items-center gap-2 font-ui text-base text-white transition-colors hover:text-mb-red"
            >
              Organiza provas? Fale connosco
              <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
