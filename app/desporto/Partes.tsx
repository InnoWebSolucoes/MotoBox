/* Blocos das páginas de Desporto (/desporto e /desporto/[modalidade]).
   Componentes de servidor, sem estado: recebem as listas já lidas. */

import Link from "next/link";
import { Placeholder, Retrato } from "@/components/Brand";
import { Countdown } from "@/components/Countdown";
import { ButtonLink, Icon, PosicaoBadge, Tag } from "@/components/ui";
import { formatData } from "@/lib/data";
import { vendaBilhetes, type Modalidade } from "@/lib/desporto";
import type { Corrida, Evento, Piloto } from "@/lib/types";

export function iniciais(nome: string) {
  return nome.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

/** Cabeçalho de uma modalidade: fotografia a toda a largura, título e números. */
export function HeroModalidade({
  m,
  eyebrow,
  numeros,
}: {
  m: Modalidade;
  eyebrow: string;
  numeros: { valor: number; label: string }[];
}) {
  return (
    <header className="relative overflow-hidden">
      <Placeholder nome={m.imagem} className="absolute inset-0" tamanhos="100vw" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/30" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
        <p className="eyebrow text-mb-red">{eyebrow}</p>
        <h1 className="title-xl mt-3 text-5xl sm:text-6xl lg:text-7xl">{m.nome}</h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base text-ink-300 leading-relaxed">{m.descricao}</p>
        {numeros.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-6 sm:gap-10">
            {numeros.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl text-white">{s.valor}</p>
                <p className="eyebrow mt-1 text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
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
