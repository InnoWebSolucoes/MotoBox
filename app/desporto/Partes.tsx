/* Blocos das páginas de Desporto (/desporto e /desporto/[modalidade]).
   Componentes de servidor, sem estado: recebem as listas já lidas. */

import Link from "next/link";
import { Placeholder, Retrato } from "@/components/Brand";
import { C } from "@/components/T";
import { Countdown } from "@/components/Countdown";
import { ButtonLink, Icon, PosicaoBadge, Tag } from "@/components/ui";
import { formatData } from "@/lib/data";
import { vendaBilhetes, type Modalidade } from "@/lib/desporto";
import type { Corrida, Evento, Piloto } from "@/lib/types";

export function iniciais(nome: string) {
  return nome.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

/**
 * Cabeçalho de uma modalidade: fotografia a toda a largura, título e números.
 * Os números são os da Motobox (provas, pilotos) ou, nas modalidades ainda sem
 * provas no calendário, três números reais do guia (com fonte na página).
 */
export function HeroModalidade({
  m,
  eyebrow,
  numeros,
  conteudo = false,
}: {
  m: Modalidade;
  eyebrow: string;
  numeros: { valor: number | string; label: string }[];
  /** Números do guia (texto a traduzir), não contagens da base. */
  conteudo?: boolean;
}) {
  return (
    <header className="relative overflow-hidden">
      <Placeholder nome={m.imagem} className="absolute inset-0" tamanhos="100vw" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/30" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
        <p className="eyebrow text-mb-red">{eyebrow}</p>
        <h1 className="title-xl mt-3 text-5xl sm:text-6xl lg:text-7xl">{m.nome}</h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base text-ink-300 leading-relaxed">
          <C>{m.descricao}</C>
        </p>
        {numeros.length > 0 && conteudo && (
          // Números do guia: no telemóvel, valor e legenda lado a lado, para não empilhar alto.
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-10">
            {numeros.map((s) => (
              <div key={s.label} className="flex items-baseline gap-3 sm:block sm:max-w-[11rem]">
                <p className="w-24 shrink-0 font-display text-2xl text-white sm:w-auto sm:text-3xl">{s.valor}</p>
                <p className="eyebrow text-ink-400 leading-snug sm:mt-1">
                  <C>{s.label}</C>
                </p>
              </div>
            ))}
          </div>
        )}
        {numeros.length > 0 && !conteudo && (
          <div className="mt-8 flex flex-wrap gap-6 sm:gap-10">
            {numeros.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl text-white">{s.valor}</p>
                <p className="eyebrow mt-1 text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-8 text-[11px] text-ink-600">Fotografia ilustrativa.</p>
      </div>
    </header>
  );
}

/**
 * Caixa "Na Motobox" do guia: o que o calendário da Motobox tem da modalidade.
 * Sem provas, fica a nota (e o convite a organizadores) dentro de uma página
 * com conteúdo, nunca a página inteira.
 */
export function NotaMotobox({ provas, ancora = "provas" }: { provas: number; ancora?: string }) {
  if (provas > 0) {
    return (
      <div className="rounded-card bg-ink-900/60 p-5">
        <p className="eyebrow text-mb-red">Na Motobox</p>
        <p className="mt-2 font-display text-2xl leading-none text-white">
          {provas} <span className="eyebrow text-ink-500">{provas === 1 ? "prova" : "provas"}</span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-400">
          O calendário, os resultados e os pilotos desta modalidade estão no topo da página.
        </p>
        <a href={`#${ancora}`} className="mt-3 inline-flex items-center gap-2 font-ui text-sm text-white transition-colors hover:text-mb-red">
          Ver provas e resultados
          <Icon name="arrow" className="size-3.5" />
        </a>
      </div>
    );
  }
  return (
    <div className="rounded-card bg-ink-900/60 p-5">
      <p className="eyebrow text-mb-red">Na Motobox</p>
      <p className="mt-2 text-sm font-medium leading-snug text-white">Sem provas no calendário da Motobox por agora</p>
      <p className="mt-2 text-xs leading-relaxed text-ink-400">
        Quando um clube, uma associação ou a federação publicar provas desta modalidade na Motobox, o calendário, os
        resultados e os pilotos aparecem nesta página.
      </p>
      <ButtonLink href="/contacto" variant="dark" size="sm" className="mt-4">
        <Icon name="mail" className="size-4" />
        Organiza provas? Fale connosco
      </ButtonLink>
    </div>
  );
}

/**
 * Arquivo de resultados (tabela completa por corrida), agrupado por temporada.
 * O mesmo desenho de /resultados, para as modalidades com arquivo próprio.
 */
export function ArquivoCorridas({ corridas }: { corridas: Corrida[] }) {
  const porTemporada = corridas.reduce<Record<number, Corrida[]>>((acc, c) => {
    (acc[c.temporada] ??= []).push(c);
    return acc;
  }, {});
  const temporadas = Object.keys(porTemporada).map(Number).sort((a, b) => b - a);

  return (
    <>
      {temporadas.map((t) => (
        <section key={t} className="mb-14 last:mb-0">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="title-xl text-3xl">Temporada {t}</h2>
            <span className="h-px flex-1 bg-white/6" aria-hidden />
          </div>
          {[...porTemporada[t]]
            .sort((a, b) => a.ronda - b.ronda || a.categoria.localeCompare(b.categoria))
            .map((c) => (
              <article
                key={c.slug}
                className="grid gap-6 border-b border-white/6 py-8 first:pt-0 last:border-0 last:pb-0 lg:grid-cols-[18rem_1fr] lg:gap-10"
              >
                <div className="relative isolate flex min-h-[14rem] flex-col justify-end overflow-hidden rounded-card p-5 lg:self-start">
                  <Placeholder nome={[c.slug, c.imagem]} className="absolute inset-0 -z-20" tamanhos="(max-width: 1024px) 100vw, 288px" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/10" aria-hidden />
                  <div className="flex flex-wrap gap-2">
                    <Tag tone="red">Ronda {c.ronda}</Tag>
                    <Tag tone="outline">{c.categoria}</Tag>
                  </div>
                  <h3 className="mt-3 font-display text-xl uppercase leading-tight text-white">
                    <Link href={`/resultados/${c.slug}`} className="transition-colors hover:text-mb-red">
                      {c.nome}
                    </Link>
                  </h3>
                  <p className="mt-2 text-xs text-ink-300">
                    {c.circuito}, {c.provincia}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">{formatData(c.data)}</p>
                  <div className="mt-4 border-t border-white/15 pt-4">
                    <p className="eyebrow text-ink-400">Vencedor</p>
                    <p className="mt-1 font-display text-lg uppercase text-mb-red">{c.vencedor}</p>
                  </div>
                </div>

                <div>
                  <div className="hidden sm:grid grid-cols-[3rem_1fr_8rem_6rem_3.5rem] items-center gap-3 border-b border-white/10 pb-3">
                    {["Pos", "Piloto", "Equipa", "Tempo", "Pts"].map((h) => (
                      <span key={h} className="eyebrow text-ink-500">
                        {h}
                      </span>
                    ))}
                  </div>
                  {c.resultados.map((r) => (
                    <Link
                      key={r.pilotoSlug + r.posicao}
                      href={`/pilotos/${r.pilotoSlug}`}
                      className={`group grid grid-cols-[3rem_1fr_3.5rem] sm:grid-cols-[3rem_1fr_8rem_6rem_3.5rem] items-center gap-3 border-b border-white/6 py-3 last:border-0 ${
                        r.estado ? "opacity-55" : ""
                      }`}
                    >
                      <PosicaoBadge posicao={r.posicao} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white transition-colors group-hover:text-mb-red">{r.piloto}</p>
                        <p className="truncate text-xs text-ink-600 sm:hidden">{r.equipa}</p>
                      </div>
                      <p className="hidden sm:block truncate text-xs text-ink-500">{r.equipa}</p>
                      <p className="hidden sm:block font-mono text-xs text-ink-300 tabular-nums">{r.estado ?? r.tempo}</p>
                      <p className="text-right font-display text-sm text-white tabular-nums">{r.pontos}</p>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
        </section>
      ))}
    </>
  );
}

/** Próxima prova em destaque, com contagem decrescente e bilhetes (quando `vendaBilhetes` o diz). */
export function ProximaProva({ e, bilheteiraAberta }: { e: Evento; bilheteiraAberta: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-card">
      <Placeholder nome={[e.slug, e.imagem]} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/45" />
      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="red">Próxima prova</Tag>
            {e.ronda ? <Tag tone="outline">Ronda {e.ronda}</Tag> : null}
          </div>
          <h2 className="title-xl mt-4 text-3xl sm:text-4xl">{e.titulo}</h2>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="pin" className="size-4 text-mb-red" />
              {e.circuito}, {e.provincia}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" className="size-4 text-mb-red" />
              {formatData(e.dataInicio, { day: "2-digit", month: "long" })}
            </span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {vendaBilhetes(e, bilheteiraAberta) === "a-venda" && (
              <ButtonLink href={`/bilhetes/${e.slug}`}>
                <Icon name="ticket" className="size-4" />
                Bilhetes
              </ButtonLink>
            )}
            <ButtonLink href={`/calendario/${e.slug}`} variant="outline">
              Ver detalhes
            </ButtonLink>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
          <p className="eyebrow text-ink-500 mb-4">Começa em</p>
          <Countdown data={e.dataInicio} size="md" />
        </div>
      </div>
    </div>
  );
}

/** Pódio das últimas corridas: três primeiros, tempo e ligação ao detalhe. */
export function UltimosResultados({ corridas }: { corridas: Corrida[] }) {
  return (
    <div className="space-y-8">
      {corridas.map((c) => (
        <div key={c.slug}>
          <Link href={`/resultados/${c.slug}`} className="group flex items-baseline justify-between gap-4">
            <p className="font-display text-lg uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
              {c.nome} · {c.categoria}
            </p>
            <span className="shrink-0 text-xs text-ink-500">
              {formatData(c.data, { day: "2-digit", month: "short" })}
            </span>
          </Link>
          <div className="mt-2">
            {c.resultados.slice(0, 3).map((r) => (
              <div key={r.pilotoSlug + r.posicao} className="flex items-center gap-3 border-b border-white/6 py-2.5 last:border-0">
                <PosicaoBadge posicao={r.posicao} size="sm" />
                <Link href={`/pilotos/${r.pilotoSlug}`} className="min-w-0 flex-1 truncate text-sm text-ink-200 hover:text-white">
                  {r.piloto}
                </Link>
                <span className="font-mono text-xs text-ink-500 tabular-nums">{r.estado ?? r.tempo}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Fila de retratos de pilotos, a deslizar na horizontal em ecrãs estreitos. */
export function FilaPilotos({ pilotos, cores }: { pilotos: (Piloto & { posicao?: number })[]; cores: Map<string, string> }) {
  return (
    <div className="-mx-4 sm:-mx-6 overflow-x-auto no-scrollbar">
      <div className="flex gap-5 px-4 sm:px-6 pb-2">
        {pilotos.map((p) => (
          <Link key={p.slug} href={`/pilotos/${p.slug}`} className="group w-40 sm:w-44 shrink-0">
            <div className="media relative aspect-[3/4]">
              <Retrato
                nome={p.slug}
                iniciais={iniciais(p.nome)}
                cor={cores.get(p.equipaSlug)}
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                tamanhos="176px"
                largura={400}
              />
              <span className="absolute left-3 top-2.5 font-display text-3xl text-white/90 [text-shadow:0_1px_8px_rgb(0_0_0/0.6)]">
                {p.numero}
              </span>
            </div>
            <p className="mt-3 font-display text-base uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
              {p.nome}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
              <span className="h-3 w-0.5 rounded-full" style={{ background: cores.get(p.equipaSlug) ?? "#3d3d47" }} aria-hidden />
              <span className="truncate">{p.equipa}</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
