import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Flag, Landmark, Megaphone, Trophy } from "lucide-react";
import { C } from "@/components/T";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Chamada, Seccao } from "@/components/painel/blocos";
import { Foto, FotoFundo, Seta } from "@/components/painel/kit";
import { formatData } from "@/lib/data";
import { lerTemporada } from "@/lib/conteudo/ler-geral";
import {
  SECCOES_MOTOCROSS, eProva, eventosDaModalidade, instante, preencher, principalDe, type ModalidadeCompleta,
} from "@/lib/desporto";
import type { PaginaDesporto } from "@/lib/conteudo/grupos/desporto";
import { lerCorridas, lerDefinicoes, lerEquipas, lerEventos, lerPilotos } from "@/lib/supabase/publico";
import type { Evento } from "@/lib/types";
import { Campeonato } from "./Campeonato";
import { lerModalidades, lerPaginaDesporto } from "./dados";
import { Etiqueta, TituloBloco } from "./Partes";
import { SubNavDesporto } from "./SubNavDesporto";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

/* Os textos fixos, as federações e as modalidades editam-se no painel
   (Modalidades e Modalidades › Página Desporto); sem nada gravado, são os
   de partida (lib/conteudo/grupos/desporto.ts e lib/desporto.ts). */

export async function generateMetadata(): Promise<Metadata> {
  const { entrada } = await lerPaginaDesporto();
  return { title: entrada.pesquisaTitulo, description: entrada.pesquisaDescricao };
}

/** Rótulos das secções do Motocross, em texto (a página é de servidor). */
const ROTULO_SECCAO: Record<string, string> = {
  "/calendario": "Calendário",
  "/resultados": "Resultados",
  "/classificacao": "Classificação",
  "/pilotos": "Pilotos",
  "/equipas": "Equipas",
};

/** "3 provas" / "1 prova". */
const nProvas = (n: number) => `${n} ${n === 1 ? "prova" : "provas"}`;

/** Ligação de fora (abre noutra janela) ou do site. */
const eExterna = (href: string) => /^https?:\/\//.test(href);

export default async function DesportoPage() {
  const [eventos, corridas, pilotos, equipas, { bilheteiraAberta }, lista, t] = await Promise.all([
    lerEventos(), lerCorridas(), lerPilotos(), lerEquipas(), lerDefinicoes(), lerModalidades(), lerPaginaDesporto(),
  ]);
  const provas = eventos.filter((e) => eProva(e.disciplina));
  const agora = instante();
  const ano = await lerTemporada();
  const valores = { ano, campeonato: t.campeonato.nome };

  const modalidades = lista.map((m) => {
    const listaProvas = eventosDaModalidade(m, provas);
    return {
      m,
      total: listaProvas.length,
      proxima: listaProvas.find((e) => new Date(e.dataInicio).getTime() > agora),
      ultima: listaProvas.filter((e) => new Date(e.dataFim).getTime() < agora).at(-1),
      destaque: m.guia.numeros[0],
    };
  });
  const principalM = principalDe(lista);
  const principal = modalidades.find((x) => x.m.slug === principalM?.slug);
  const competicao = modalidades.filter((x) => x !== principal && x.m.grupo !== "outras");
  // Ao lado do Motocross cabem duas; as restantes descem para uma fila de cartões por baixo.
  const aoLado = competicao.slice(0, 2);
  const fila = competicao.slice(2);
  const outras = modalidades.filter((x) => x !== principal && x.m.grupo === "outras");

  const numeros = [
    { valor: provas.length, texto: t.entrada.numeros.provas },
    { valor: corridas.length, texto: t.entrada.numeros.corridas },
    { valor: pilotos.length, texto: t.entrada.numeros.pilotos },
    { valor: lista.length, texto: t.entrada.numeros.modalidades },
    { valor: provas.filter((e) => new Date(e.dataInicio).getTime() > agora).length, texto: t.entrada.numeros.porDisputar },
  ];

  return (
    <>
      <SubNavDesporto />
      <PaginaInterior icone={<Trophy />}>
        <Abertura
          compacta
          foto={t.entrada.foto}
          sobretitulo={preencher(t.entrada.sobretitulo, valores)}
          titulo={t.entrada.titulo}
          texto={t.entrada.texto}
        />

        {/* ============ NÚMEROS DA TEMPORADA ============ */}
        <Seccao>
          <dl className="grid grid-cols-2 gap-[var(--intervalo)] sm:grid-cols-5">
            {numeros.map((n, i) => (
              <div
                key={`${i}-${n.texto}`}
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
        <Campeonato provas={provas} corridas={corridas} pilotos={pilotos} equipas={equipas} bilheteiraAberta={bilheteiraAberta} textos={t} ano={ano} />

        {/* ============ COMPETIÇÃO: MOTOCROSS EM DESTAQUE, DUAS AO LADO E AS RESTANTES NUMA FILA ============ */}
        <Seccao id="modalidades" className="!pt-0 !scroll-mt-28">
          <TituloBloco grande icone={<Flag />} sobretitulo={t.modalidades.sobretitulo} titulo={t.modalidades.titulo} />

          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)] lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            {/* Motocross: a casa do campeonato, em grande, com atalhos para as secções */}
            {principal && (
              <div className="painel group relative isolate flex min-h-[30rem] flex-col justify-end lg:min-h-[34rem]">
                <FotoFundo nome={principal.m.imagem} veu="baixo" tamanhos="(max-width: 1024px) 100vw, 55vw" />
                {/* Ligação que cobre o cartão; os atalhos por cima ficam clicáveis à parte. */}
                <Link href={`/desporto/${principal.m.slug}`} className="absolute inset-0" aria-label={principal.m.nome} />
                <div className="pointer-events-none relative p-6 md:p-10">
                  {t.modalidades.etiquetaPrincipal && <Etiqueta tom="vermelho">{t.modalidades.etiquetaPrincipal}</Etiqueta>}
                  <h3 className="titulo-2 mt-5">{principal.m.nome}</h3>
                  <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-white/85">
                    <C>{principal.m.descricao}</C>
                  </p>
                  {principal.proxima && (
                    <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-sm text-white/85">
                      <span className="text-mb-red-light">{t.modalidades.proximaPrincipal}</span>
                      <span>{principal.proxima.titulo}</span>
                      <span className="text-white/75">
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
                      {t.modalidades.pilulaGuia}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* As duas primeiras (Enduro e Rally-Raid): fotografia ao lado do texto */}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)]">
              {aoLado.map(({ m, total, proxima, ultima }) => {
                const marco = proxima ?? ultima;
                return (
                  <Link
                    key={m.slug}
                    href={`/desporto/${m.slug}`}
                    className="painel painel-escuro group grid grid-cols-[7.5rem_minmax(0,1fr)] gap-[var(--intervalo)] p-[var(--intervalo)] sm:grid-cols-[12rem_minmax(0,1fr)]"
                  >
                    <Foto nome={m.imagem} className="min-h-40" largura={500} tamanhos="(max-width: 640px) 120px, 192px" />
                    <div className="flex min-w-0 flex-col p-3 sm:p-5">
                      <p className="text-[0.8125rem] text-white/80">
                        {total > 0 ? <span className="text-mb-red-light">{nProvas(total)}</span> : t.modalidades.semProvas}
                      </p>
                      <h3 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight">{m.nome}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/70 sm:line-clamp-2">
                        <C>{m.descricao}</C>
                      </p>
                      {marco && (
                        <p className="mt-3 text-xs leading-snug text-white/75">
                          <span className="text-white/85">{proxima ? t.modalidades.proxima : t.modalidades.ultima}</span> {marco.titulo} ·{" "}
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

          {/* As restantes modalidades com provas (Velocidade, Moto 4, Karting): cartões com a próxima prova */}
          {fila.length > 0 && (
            <div
              className={`mt-[var(--intervalo)] grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)] ${
                fila.length >= 3 ? "md:grid-cols-3" : fila.length === 2 ? "md:grid-cols-2" : ""
              }`}
            >
              {fila.map(({ m, total, proxima, ultima }) => (
                <CartaoModalidade key={m.slug} m={m} total={total} marco={proxima ?? ultima} futura={Boolean(proxima)} t={t} />
              ))}
            </div>
          )}
        </Seccao>

        {/* ============ OUTRAS MODALIDADES (as que ainda não têm provas no calendário) ============ */}
        {outras.length > 0 && (
          <Seccao className="!pt-0">
            <TituloBloco sobretitulo={t.outras.sobretitulo} titulo={t.outras.titulo} texto={t.outras.texto} />
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-4">
              {outras.map(({ m, total, destaque }) => (
                <CartaoModalidade key={m.slug} m={m} total={total} destaque={destaque} t={t} />
              ))}
            </div>
          </Seccao>
        )}

        {/* ============ QUEM ORGANIZA ============ */}
        <Seccao className="!pt-0">
          <TituloBloco grande icone={<Landmark />} sobretitulo={t.federacoes.sobretitulo} titulo={t.federacoes.titulo} />
          <ul className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)] md:grid-cols-2 lg:grid-cols-3">
            {t.federacoes.lista.map((f, i) => (
              <li key={`${i}-${f.sigla}`} className="painel painel-escuro flex flex-col p-6 lg:p-8">
                <p className="text-4xl font-semibold leading-none tracking-tight">{f.sigla}</p>
                <p className="mt-3 text-sm text-white/80">{f.nome}</p>
                <p className="mt-6 text-[15px] leading-relaxed text-white/85">
                  <C>{f.texto}</C>
                </p>
                {f.fontes.length > 0 && (
                  <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/75">
                    <span>{t.federacoes.rotuloFontes}</span>
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
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-8">
                  {f.modalidades.map((slug) => {
                    const m = lista.find((x) => x.slug === slug);
                    return m ? (
                      <Link key={slug} href={`/desporto/${slug}`} className="pilula">
                        {m.nome}
                      </Link>
                    ) : null;
                  })}
                </div>
              </li>
            ))}
            {t.organiza.titulo && (
              <li className="md:col-span-2 lg:col-span-1">
                <Chamada
                  href={t.organiza.href || "/contacto"}
                  externo={eExterna(t.organiza.href)}
                  icone={<Megaphone />}
                  titulo={t.organiza.titulo}
                  className="h-full"
                />
              </li>
            )}
          </ul>
        </Seccao>
      </PaginaInterior>
    </>
  );
}

/**
 * Cartão de uma modalidade com a fotografia em cima: a fila de competição
 * (com a próxima prova ou, sem ela, a última) e as outras modalidades (com
 * um número do guia).
 */
function CartaoModalidade({
  m,
  total,
  marco,
  futura = false,
  destaque,
  t,
}: {
  m: ModalidadeCompleta;
  total: number;
  marco?: Evento;
  /** O marco é a próxima prova (e não a última). */
  futura?: boolean;
  destaque?: { valor: string; label: string };
  t: PaginaDesporto;
}) {
  return (
    <Link href={`/desporto/${m.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
      <div className="relative">
        <Foto
          nome={m.imagem}
          className="aspect-[4/3]"
          largura={700}
          tamanhos="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
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
        {marco ? (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-[0.8125rem] text-mb-red-light">{futura ? t.modalidades.proximaProva : t.modalidades.ultimaProva}</p>
            <p className="mt-1 text-[15px] font-medium leading-snug text-white">{marco.titulo}</p>
            <p className="mt-1 text-xs leading-snug text-white/75">
              {formatData(marco.dataInicio, { day: "2-digit", month: "long" })} · {marco.circuito}, {marco.provincia}
            </p>
          </div>
        ) : destaque ? (
          <p className="mt-5 flex items-baseline gap-3 border-t border-white/10 pt-4">
            <span className="shrink-0 text-xl font-semibold leading-none text-mb-red-light">{destaque.valor}</span>
            <span className="text-xs leading-snug text-white/75">
              <C>{destaque.label}</C>
            </span>
          </p>
        ) : null}
        <span className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm">
          <span className="sublinhado">{t.modalidades.conhecer}</span>
          <Seta className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
