/* Blocos das páginas de Desporto (/desporto e /desporto/[modalidade]), no
   desenho do painel: fichas escuras translúcidas, cantos de 6px, 5px entre
   peças e o vermelho só nos acentos. Componentes de servidor, sem estado:
   recebem as listas já lidas. */

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { Retrato } from "@/components/Brand";
import { C } from "@/components/T";
import { Abertura, BotaoMB, Numeros, Seccao } from "@/components/painel/blocos";
import { Chip, FotoFundo, Seta } from "@/components/painel/kit";
import { formatData } from "@/lib/data";
import { retratoDe, vendaBilhetes, type Modalidade } from "@/lib/desporto";
import type { PaginaDesporto } from "@/lib/conteudo/grupos/desporto";
import type { Corrida, Evento, Piloto } from "@/lib/types";
import { Contagem } from "./Contagem";
import { fotoDe } from "@/app/eventos/foto";

/**
 * Um texto com um valor no meio ("Ronda {ronda}" → "Ronda " e 1), em nós de
 * texto separados, como estava escrito à mão: a tradução automática da
 * página continua a encontrar a palavra.
 */
export function comValor(modelo: string, chave: string, valor: ReactNode): ReactNode {
  const [antes, ...resto] = modelo.split(`{${chave}}`);
  if (resto.length === 0) return modelo;
  const depois = resto.join(String(valor));
  return <>{antes}{valor}{depois || null}</>;
}

export function iniciais(nome: string) {
  return nome.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

/* ---------------- Peças pequenas ---------------- */

/** Etiqueta curta (ronda, categoria, estado), no quadrado de 4px do painel. */
export function Etiqueta({
  children,
  tom = "escuro",
  className = "",
}: {
  children: ReactNode;
  tom?: "vermelho" | "escuro" | "claro";
  className?: string;
}) {
  const cor = {
    vermelho: "bg-mb-red text-white",
    escuro: "bg-black/55 text-white/90 backdrop-blur-md",
    claro: "bg-white/10 text-white/85",
  }[tom];
  return (
    <span className={`inline-flex h-7 items-center rounded-[4px] px-2.5 text-xs font-medium whitespace-nowrap ${cor} ${className}`}>
      {children}
    </span>
  );
}

/** Posição numa tabela: quadrado com o número, o primeiro a vermelho. */
export function Posicao({ n, pequena = false }: { n: number; pequena?: boolean }) {
  const cor = n === 1 ? "bg-mb-red text-white" : n === 2 || n === 3 ? "bg-white/15 text-white" : "bg-white/[0.06] text-white/75";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[4px] font-semibold tabular-nums ${
        pequena ? "size-7 text-xs" : "size-9 text-sm"
      } ${n === 0 ? "bg-white/[0.06] text-white/75" : cor}`}
    >
      {n === 0 ? "NC" : n}
    </span>
  );
}

/**
 * Cabeçalho de um bloco: sobretítulo, título e a ligação "ver tudo" à direita.
 * `grande`: título de secção (com o quadrado de ícone), para separar grupos.
 */
export function TituloBloco({
  sobretitulo,
  titulo,
  texto,
  accao,
  icone,
  grande = false,
  className = "",
}: {
  sobretitulo?: ReactNode;
  titulo: ReactNode;
  texto?: ReactNode;
  accao?: { href: string; texto: string };
  icone?: ReactNode;
  grande?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${className}`}>
      <div className="max-w-2xl">
        {icone && <Chip grande className="mb-8">{icone}</Chip>}
        {sobretitulo && <p className="text-sm text-white/80">{sobretitulo}</p>}
        <h2 className={`${grande ? "titulo-2" : "titulo-3"} text-balance ${sobretitulo ? "mt-2" : ""}`}>{titulo}</h2>
        {texto && <div className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-white/75">{texto}</div>}
      </div>
      {accao && (
        <Link href={accao.href} className="group inline-flex items-center gap-2 text-sm text-white">
          <span className="sublinhado">{accao.texto}</span>
          <Seta className="size-3" />
        </Link>
      )}
    </div>
  );
}

/** Ficha vazia: o que falta e quando aparece. */
export function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="painel painel-escuro p-6 md:p-8">
      <p className="text-lg font-semibold">{titulo}</p>
      <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-white/80">{texto}</p>
    </div>
  );
}

/** Regresso à página de cima (Desporto, ou a modalidade). */
export function Voltar({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-12 items-center gap-3 rounded-[var(--raio)] bg-white/[0.07] px-5 text-[15px] text-white transition-colors hover:bg-white/15"
    >
      <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
      {children}
    </Link>
  );
}

/* ---------------- Cabeçalho de uma modalidade ---------------- */

/**
 * Abertura de uma modalidade: fotografia a encher o painel, título e, logo a
 * seguir, os números em fichas escuras. Os números são os da MotoBox (provas,
 * pilotos) ou, nas modalidades ainda sem provas no calendário, três números
 * reais do guia (com fonte na página). `children` entra por baixo dos números
 * (o índice "Nesta página").
 */
export function HeroModalidade({
  m,
  eyebrow,
  numeros,
  conteudo = false,
  notaFoto = "Fotografia ilustrativa.",
  children,
}: {
  m: Modalidade;
  eyebrow: string;
  numeros: { valor: number | string; label: string }[];
  /** Números do guia (texto a traduzir), não contagens da base. */
  conteudo?: boolean;
  /** Nota por baixo dos números (Modalidades › Página Desporto). Vazia, não aparece. */
  notaFoto?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <Abertura foto={m.imagem} sobretitulo={eyebrow} titulo={m.nome} texto={<C>{m.descricao}</C>} />
      <Seccao>
        {numeros.length > 0 && (
          <Numeros
            colunas={numeros.length >= 4 ? 4 : 3}
            itens={numeros.map((s) => ({
              valor: conteudo ? <span className="text-[2rem] lg:text-[2.5rem]">{s.valor}</span> : s.valor,
              texto: conteudo ? <C>{s.label}</C> : s.label,
            }))}
          />
        )}
        {children}
        {notaFoto && <p className="mt-6 text-xs text-white/70">{notaFoto}</p>}
      </Seccao>
    </>
  );
}

/* ---------------- Competição ---------------- */

/** Próxima prova em destaque, com contagem decrescente e bilhetes (quando `vendaBilhetes` o diz). */
/** Textos de partida da próxima prova (os editados vêm de paginas.desporto → proximaProva). */
const PROXIMA_PADRAO: PaginaDesporto["proximaProva"] = {
  etiqueta: "Próxima prova", ronda: "Ronda {ronda}", bilhetes: "Bilhetes", detalhes: "Ver detalhes", comecaEm: "Começa em",
};

export function ProximaProva({
  e, bilheteiraAberta, textos = PROXIMA_PADRAO,
}: { e: Evento; bilheteiraAberta: boolean; textos?: PaginaDesporto["proximaProva"] }) {
  return (
    <div className="painel relative isolate overflow-hidden">
      <FotoFundo nome={fotoDe(e.slug, e.imagem)} veu="esquerda" tamanhos="(max-width: 1024px) 100vw, 80vw" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent" aria-hidden />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 p-6 pt-8 md:p-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end lg:p-12">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Etiqueta tom="vermelho">{textos.etiqueta}</Etiqueta>
            {e.ronda ? <Etiqueta>{comValor(textos.ronda, "ronda", e.ronda)}</Etiqueta> : null}
          </div>
          <h2 className="titulo-2 mt-6 max-w-[18ch] text-balance">{e.titulo}</h2>
          <p className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-white/85">
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-mb-red-light" aria-hidden />
              {e.circuito}, {e.provincia}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-mb-red-light" aria-hidden />
              {formatData(e.dataInicio, { day: "2-digit", month: "long" })}
            </span>
          </p>
          <div className="mt-8 flex flex-wrap gap-[var(--intervalo)]">
            {vendaBilhetes(e, bilheteiraAberta) === "a-venda" && (
              <BotaoMB href={`/bilhetes/${e.slug}`} className="sm:w-56">
                {textos.bilhetes}
              </BotaoMB>
            )}
            <BotaoMB href={`/calendario/${e.slug}`} variante="escuro" className="!bg-black/50 backdrop-blur-md hover:!bg-black/70 sm:w-56">
              {textos.detalhes}
            </BotaoMB>
          </div>
        </div>
        <div>
          <p className="text-sm text-white/70">{textos.comecaEm}</p>
          <Contagem data={e.dataInicio} className="mt-3" />
        </div>
      </div>
    </div>
  );
}

/** Pódio das últimas corridas: três primeiros, tempo e ligação ao detalhe. */
export function UltimosResultados({ corridas }: { corridas: Corrida[] }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)]">
      {corridas.map((c) => (
        <div key={c.slug} className="painel painel-escuro p-5 md:p-6">
          <Link href={`/resultados/${c.slug}`} className="group flex items-start justify-between gap-4">
            <span className="min-w-0">
              <span className="block text-[0.8125rem] text-white/80">
                <span className="text-mb-red-light">{c.categoria}</span> ·{" "}
                {formatData(c.data, { day: "2-digit", month: "short" })}
              </span>
              <span className="mt-1 block text-lg font-semibold leading-snug transition-colors group-hover:text-mb-red-light">
                {c.nome}
              </span>
            </span>
            <Seta className="mt-1.5 size-3.5" />
          </Link>
          <ol className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-1">
            {c.resultados.slice(0, 3).map((r) => (
              <li key={r.pilotoSlug + r.posicao} className="flex items-center gap-3 rounded-[4px] bg-white/[0.04] p-1.5 pr-3">
                <Posicao n={r.posicao} pequena />
                <Link href={`/pilotos/${r.pilotoSlug}`} className="min-w-0 flex-1 truncate text-[15px] text-white/90 hover:text-white">
                  {r.piloto}
                </Link>
                <span className="shrink-0 text-sm text-white/80 tabular-nums">{r.estado ?? r.tempo}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

/**
 * Fila de retratos de pilotos, a deslizar na horizontal. Sai da coluna até às
 * margens do painel (as mesmas medidas de `.coluna`), para o deslizar se ver.
 */
export function FilaPilotos({ pilotos, cores }: { pilotos: (Piloto & { posicao?: number })[]; cores: Map<string, string> }) {
  return (
    <div className="no-scrollbar -mx-5 overflow-x-auto md:-mx-12 lg:-mx-24">
      <ul className="flex w-max gap-[var(--intervalo)] px-5 md:px-12 lg:px-24">
        {pilotos.map((p) => (
          <li key={p.slug} className="w-44 shrink-0 sm:w-48">
            <Link href={`/pilotos/${p.slug}`} className="painel painel-escuro group flex h-full flex-col p-[var(--intervalo)]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--raio)]">
                <Retrato
                  nome={retratoDe(p)}
                  pessoa={p.nome}
                  iniciais={iniciais(p.nome)}
                  cor={cores.get(p.equipaSlug)}
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  tamanhos="192px"
                  largura={400}
                />
                <span className="absolute left-2 top-2 grid h-8 min-w-8 place-items-center rounded-[4px] bg-black/55 px-1.5 text-sm font-semibold tabular-nums backdrop-blur-md">
                  {p.numero}
                </span>
              </div>
              <div className="p-3 pb-2">
                <p className="text-[15px] font-semibold leading-snug transition-colors group-hover:text-mb-red-light">{p.nome}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-white/80">
                  <span className="h-3 w-1 shrink-0 rounded-full" style={{ background: cores.get(p.equipaSlug) ?? "#3d3d47" }} aria-hidden />
                  <span className="truncate">{p.equipa}</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Arquivo de resultados (tabela completa por corrida), agrupado por temporada.
 * Para as modalidades com arquivo próprio.
 */
export function ArquivoCorridas({ corridas }: { corridas: Corrida[] }) {
  const porTemporada = corridas.reduce<Record<number, Corrida[]>>((acc, c) => {
    (acc[c.temporada] ??= []).push(c);
    return acc;
  }, {});
  const temporadas = Object.keys(porTemporada).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-16">
      {temporadas.map((t) => (
        <section key={t}>
          <div className="mb-8 flex items-center gap-5">
            <h2 className="titulo-3 shrink-0">Temporada {t}</h2>
            <span className="h-px flex-1 bg-white/10" aria-hidden />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)]">
            {[...porTemporada[t]]
              // Por data: as corridas de fora do campeonato (ronda 0) ficam no seu lugar no ano.
              .sort((a, b) => a.data.localeCompare(b.data) || a.ronda - b.ronda || a.categoria.localeCompare(b.categoria))
              .map((c) => (
                <article
                  key={c.slug}
                  className="painel painel-escuro grid grid-cols-[minmax(0,1fr)] gap-[var(--intervalo)] p-[var(--intervalo)] lg:grid-cols-[19rem_minmax(0,1fr)]"
                >
                  <div className="group relative isolate flex min-h-[15rem] flex-col justify-end overflow-hidden rounded-[var(--raio)] p-5">
                    <FotoFundo nome={fotoDe(c.slug, c.imagem)} veu="baixo" largura={800} tamanhos="(max-width: 1024px) 100vw, 304px" />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/45 to-black/0" aria-hidden />
                    <div className="flex flex-wrap gap-2">
                      {c.ronda > 0 && <Etiqueta tom="vermelho">Ronda {c.ronda}</Etiqueta>}
                      <Etiqueta tom={c.ronda > 0 ? "escuro" : "vermelho"}>{c.categoria}</Etiqueta>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold leading-snug">
                      <Link href={`/resultados/${c.slug}`} className="transition-colors hover:text-mb-red-light">
                        {c.nome}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm text-white/80">
                      {c.circuito}, {c.provincia}
                    </p>
                    <p className="mt-0.5 text-sm text-white/80">{formatData(c.data)}</p>
                    <div className="mt-4 border-t border-white/15 pt-4">
                      <p className="text-xs text-white/80">Vencedor</p>
                      <p className="mt-1 text-lg font-semibold text-mb-red-light">{c.vencedor}</p>
                    </div>
                  </div>

                  <div className="p-2 md:p-4">
                    <div className="hidden grid-cols-[2.25rem_minmax(0,1fr)_9rem_6.5rem_3rem] items-center gap-4 px-2 pb-3 text-xs text-white/75 sm:grid">
                      {["Pos", "Piloto", "Equipa", "Tempo", "Pts"].map((h) => (
                        <span key={h} className={h === "Pts" ? "text-right" : ""}>
                          {h}
                        </span>
                      ))}
                    </div>
                    <ol className="grid grid-cols-[minmax(0,1fr)] gap-1">
                      {c.resultados.map((r) => (
                        <li key={r.pilotoSlug + r.posicao}>
                          <Link
                            href={`/pilotos/${r.pilotoSlug}`}
                            className={`group grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 rounded-[4px] bg-white/[0.04] px-2 py-2 transition-colors hover:bg-white/[0.09] sm:grid-cols-[2.25rem_minmax(0,1fr)_9rem_6.5rem_3rem] ${
                              r.estado ? "opacity-55" : ""
                            }`}
                          >
                            <Posicao n={r.posicao} />
                            <span className="min-w-0">
                              <span className="block truncate text-[15px] transition-colors group-hover:text-mb-red-light">{r.piloto}</span>
                              <span className="block truncate text-xs text-white/75 sm:hidden">
                                {r.equipa} · <span className="tabular-nums">{r.estado ?? r.tempo}</span>
                              </span>
                            </span>
                            <span className="hidden truncate text-sm text-white/80 sm:block">{r.equipa}</span>
                            <span className="hidden text-sm text-white/75 tabular-nums sm:block">{r.estado ?? r.tempo}</span>
                            <span className="text-right text-[15px] font-semibold tabular-nums">{r.pontos}</span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Caixa "Na MotoBox" do guia: o que o calendário da MotoBox tem da modalidade.
 * Sem provas, fica a nota (e o convite a organizadores) dentro de uma página
 * com conteúdo, nunca a página inteira.
 */
export function NotaMotobox({
  provas, ancora = "provas", textos = NOTA_PADRAO,
}: {
  provas: number;
  ancora?: string;
  /** Textos da caixa (paginas.desporto → modalidade.naMotobox). */
  textos?: PaginaDesporto["modalidade"]["naMotobox"];
}) {
  if (provas > 0) {
    return (
      <div className="painel painel-escuro p-6">
        <p className="text-sm text-mb-red-light">{textos.titulo}</p>
        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-semibold leading-none tabular-nums">{provas}</span>
          <span className="text-sm text-white/80">{provas === 1 ? "prova" : "provas"}</span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          {textos.comProvasTexto}
        </p>
        <a href={`#${ancora}`} className="group mt-5 inline-flex items-center gap-2 text-sm text-white">
          <span className="sublinhado">{textos.comProvasLigacao}</span>
          <Seta className="size-3" />
        </a>
      </div>
    );
  }
  return (
    <div className="painel painel-escuro p-6">
      <p className="text-sm text-mb-red-light">{textos.titulo}</p>
      <p className="mt-3 text-[15px] font-semibold leading-snug">{textos.semProvasTitulo}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/70">
        {textos.semProvasTexto}
      </p>
      <Link href="/contacto" className="group mt-5 inline-flex items-center gap-2 text-sm text-white">
        <span className="sublinhado">{textos.semProvasLigacao}</span>
        <Seta className="size-3" />
      </Link>
    </div>
  );
}

const NOTA_PADRAO: PaginaDesporto["modalidade"]["naMotobox"] = {
  titulo: "Na MotoBox",
  comProvasTexto: "O calendário, os resultados e os pilotos desta modalidade estão no topo da página.",
  comProvasLigacao: "Ver provas e resultados",
  semProvasTitulo: "Sem provas no calendário da MotoBox por agora",
  semProvasTexto:
    "Quando um clube, uma associação ou a federação publicar provas desta modalidade na MotoBox, o calendário, os resultados e os pilotos aparecem nesta página.",
  semProvasLigacao: "Organiza provas? Fale connosco",
};
