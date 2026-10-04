import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Flag, Landmark, Megaphone, Trophy } from "lucide-react";
import { C } from "@/components/T";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Chamada, Seccao } from "@/components/painel/blocos";
import { Foto, FotoFundo, Seta } from "@/components/painel/kit";
import { TEMPORADA, formatData } from "@/lib/data";
import {
  MODALIDADES, MODALIDADE_PRINCIPAL, SECCOES_MOTOCROSS, eProva, eventosDaModalidade, instante,
} from "@/lib/desporto";
import { lerConteudo } from "@/lib/desporto-conteudo";
import { lerCorridas, lerDefinicoes, lerEquipas, lerEventos, lerPilotos } from "@/lib/supabase/publico";
import { Campeonato } from "./Campeonato";
import { Etiqueta, TituloBloco } from "./Partes";
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

/** "3 provas" / "1 prova". */
const nProvas = (n: number) => `${n} ${n === 1 ? "prova" : "provas"}`;

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

  const numeros = [
    { valor: provas.length, texto: "Provas" },
    { valor: corridas.length, texto: "Corridas disputadas" },
    { valor: pilotos.length, texto: "Pilotos" },
    { valor: MODALIDADES.length, texto: "Modalidades" },
    { valor: provas.filter((e) => new Date(e.dataInicio).getTime() > agora).length, texto: "Por disputar" },
  ];

  return (
    <>
      <SubNavDesporto />
      <PaginaInterior icone={<Trophy />}>
        <Abertura
          compacta
          foto="mxgp"
          sobretitulo={`Temporada ${TEMPORADA}`}
          titulo="Desporto"
          texto="A competição a motor em Angola: o Campeonato Nacional, com o calendário, a classificação, os resultados, os pilotos e as equipas, e cada modalidade com a sua página, do motocross ao karting."
        />

        {/* ============ NÚMEROS DA TEMPORADA ============ */}
        <Seccao>
          <dl className="grid grid-cols-2 gap-[var(--intervalo)] sm:grid-cols-5">
            {numeros.map((n, i) => (
              <div
                key={n.texto}
                className={`painel painel-escuro flex min-h-32 flex-col-reverse justify-start p-5 lg:min-h-40 ${
                  i === 0 ? "col-span-2 sm:col-span-1" : ""
                }`}
              >
                <dt className="mt-2 text-sm leading-snug text-white/85">{n.texto}</dt>
                <dd className="mt-auto text-[2.5rem] leading-none tracking-tight tabular-nums lg:text-5xl">{n.valor}</dd>
              </div>
            ))}
          </dl>
        </Seccao>

        {/* ============ CAMPEONATO NACIONAL: o que estava nas antigas secções Calendário, Resultados e Pilotos ============ */}
        <Campeonato provas={provas} corridas={corridas} pilotos={pilotos} equipas={equipas} bilheteiraAberta={bilheteiraAberta} />

        {/* ============ COMPETIÇÃO: MOTOCROSS EM DESTAQUE + ENDURO E RALLY-RAID ============ */}
        <Seccao id="modalidades" className="!pt-0 !scroll-mt-28">
          <TituloBloco grande icone={<Flag />} sobretitulo="Competição" titulo="Modalidades" />

          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)] lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            {/* Motocross: a casa do campeonato, em grande, com atalhos para as secções */}
            <div className="painel group relative isolate flex min-h-[30rem] flex-col justify-end lg:min-h-[34rem]">
              <FotoFundo nome={principal.m.imagem} veu="baixo" tamanhos="(max-width: 1024px) 100vw, 55vw" />
              {/* Ligação que cobre o cartão; os atalhos por cima ficam clicáveis à parte. */}
              <Link href={`/desporto/${principal.m.slug}`} className="absolute inset-0" aria-label={principal.m.nome} />
              <div className="pointer-events-none relative p-6 md:p-10">
                <Etiqueta tom="vermelho">Campeonato Nacional</Etiqueta>
                <h3 className="titulo-2 mt-5">{principal.m.nome}</h3>
                <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-white/85">
                  <C>{principal.m.descricao}</C>
                </p>
                {principal.proxima && (
                  <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-sm text-white/85">
                    <span className="text-mb-red-light">Próxima prova</span>
                    <span>{principal.proxima.titulo}</span>
                    <span className="text-white/55">
                      · {formatData(principal.proxima.dataInicio, { day: "2-digit", month: "short" })}
                    </span>
                  </p>
                )}
                <div className="pointer-events-auto mt-7 flex flex-wrap gap-2">
                  {SECCOES_MOTOCROSS.slice(1).map((s) => (
                    <Link key={s.href} href={s.href} className="pilula bg-black/50 backdrop-blur-md hover:bg-black/75">
                      {ROTULO_SECCAO[s.href]}
                    </Link>
                  ))}
                  <Link
                    href={`/desporto/${principal.m.slug}#o-que-e`}
                    className="pilula bg-black/50 backdrop-blur-md hover:bg-black/75"
                  >
                    Guia
                  </Link>
                </div>
              </div>
            </div>

            {/* Enduro e Rally-Raid: fotografia ao lado do texto */}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)]">
              {competicao.map(({ m, total, proxima, ultima }) => {
                const marco = proxima ?? ultima;
                return (
                  <Link
                    key={m.slug}
                    href={`/desporto/${m.slug}`}
                    className="painel painel-escuro group grid grid-cols-[7.5rem_minmax(0,1fr)] gap-[var(--intervalo)] p-[var(--intervalo)] sm:grid-cols-[12rem_minmax(0,1fr)]"
                  >
                    <Foto nome={m.imagem} className="min-h-40" largura={500} tamanhos="(max-width: 640px) 120px, 192px" />
                    <div className="flex min-w-0 flex-col p-3 sm:p-5">
                      <p className="text-[0.8125rem] text-white/60">
                        {total > 0 ? <span className="text-mb-red-light">{nProvas(total)}</span> : "Guia e cena em Angola"}
                      </p>
                      <h3 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight">{m.nome}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/70 sm:line-clamp-2">
                        <C>{m.descricao}</C>
                      </p>
                      {marco && (
                        <p className="mt-3 text-xs leading-snug text-white/55">
                          <span className="text-white/85">{proxima ? "Próxima:" : "Última:"}</span> {marco.titulo} ·{" "}
                          {formatData(marco.dataInicio, { day: "2-digit", month: "short" })}
                        </p>
                      )}
                      <Seta className="mt-auto ml-auto size-3.5 translate-y-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Seccao>

        {/* ============ OUTRAS MODALIDADES ============ */}
        <Seccao className="!pt-0">
          <TituloBloco
            sobretitulo="Tudo o que tem motor"
            titulo="Outras modalidades"
            texto="Cada uma tem página própria: o que é, as classes, quem corre em Angola, os campeonatos de referência e como começar. Com fontes."
          />
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-4">
            {outras.map(({ m, total, destaque }) => (
              <Link key={m.slug} href={`/desporto/${m.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
                <div className="relative">
                  <Foto
                    nome={m.imagem}
                    className="aspect-[4/3]"
                    largura={700}
                    tamanhos="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                  {total > 0 && (
                    <Etiqueta tom="vermelho" className="absolute left-3 top-3">
                      {nProvas(total)}
                    </Etiqueta>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4 pt-5">
                  <h3 className="text-xl font-semibold leading-snug tracking-tight">{m.nome}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    <C>{m.descricao}</C>
                  </p>
                  {destaque && (
                    <p className="mt-5 flex items-baseline gap-3 border-t border-white/10 pt-4">
                      <span className="shrink-0 text-xl font-semibold leading-none text-mb-red-light">{destaque.valor}</span>
                      <span className="text-xs leading-snug text-white/55">
                        <C>{destaque.label}</C>
                      </span>
                    </p>
                  )}
                  <span className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm">
                    <span className="sublinhado">Conhecer a modalidade</span>
                    <Seta className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Seccao>

        {/* ============ QUEM ORGANIZA ============ */}
        <Seccao className="!pt-0">
          <TituloBloco grande icone={<Landmark />} sobretitulo="Federações" titulo="Quem organiza" />
          <ul className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)] md:grid-cols-2 lg:grid-cols-3">
            {FEDERACOES.map((f) => (
              <li key={f.sigla} className="painel painel-escuro flex flex-col p-6 lg:p-8">
                <p className="text-4xl font-semibold leading-none tracking-tight">{f.sigla}</p>
                <p className="mt-3 text-sm text-white/65">{f.nome}</p>
                <p className="mt-6 text-[15px] leading-relaxed text-white/85">
                  <C>{f.texto}</C>
                </p>
                <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
                  <span>Fontes:</span>
                  {f.fontes.map((fonte) => (
                    <a
                      key={fonte.url}
                      href={fonte.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-white/70 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
                    >
                      {fonte.nome}
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  ))}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-8">
                  {f.modalidades.map((slug) => {
                    const m = MODALIDADES.find((x) => x.slug === slug);
                    return m ? (
                      <Link key={slug} href={`/desporto/${slug}`} className="pilula">
                        {m.nome}
                      </Link>
                    ) : null;
                  })}
                </div>
              </li>
            ))}
            <li className="md:col-span-2 lg:col-span-1">
              <Chamada href="/contacto" icone={<Megaphone />} titulo="Organiza provas? Fale connosco" className="h-full" />
            </li>
          </ul>
        </Seccao>
      </PaginaInterior>
    </>
  );
}
