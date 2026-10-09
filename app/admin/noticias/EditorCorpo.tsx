"use client";

/* ============================================================
   MOTOBOX ADMIN — Editor do texto de um artigo, em blocos
   O site guarda o texto como uma lista de parágrafos, com duas
   marcas simples (ver app/artigos/[slug]/CorpoArtigo.tsx):
     "## Subtítulo"                       título de secção
     "> Texto da citação — Nome, função"  citação em destaque
   Aqui cada parágrafo é um bloco com o seu tipo: quem escreve
   escolhe "Parágrafo", "Subtítulo" ou "Citação" e nunca vê as
   marcas. Também serve à história dos clubes (sem subtítulos).
   ============================================================ */

import { useRef, useState } from "react";
import { Heading2, Pilcrow, Plus, Quote, Trash2 } from "lucide-react";
import { AccaoIcone, Botao, CLASSE_CAMPO, Seta } from "@/components/admin/kit";

export type TipoBloco = "paragrafo" | "subtitulo" | "citacao";

export interface Bloco {
  tipo: TipoBloco;
  texto: string;
  /** Só nas citações: quem disse (nome, função). */
  autor: string;
}

type BlocoComId = Bloco & { id: string };

const NOMES: Record<TipoBloco, string> = { paragrafo: "Parágrafo", subtitulo: "Subtítulo", citacao: "Citação" };
const ICONES = { paragrafo: Pilcrow, subtitulo: Heading2, citacao: Quote } as const;

/** Um parágrafo guardado → bloco. */
export function paraBloco(linha: string): Bloco {
  const l = linha.trimStart();
  if (l.startsWith("## ")) return { tipo: "subtitulo", texto: l.slice(3).trim(), autor: "" };
  if (l.startsWith("> ")) {
    // A atribuição vem depois do último travessão: "… — Nome, função" (como no site).
    const [texto, autor] = l.slice(2).split(/\s+—\s+(?=[^—]+$)/);
    return { tipo: "citacao", texto: (texto ?? "").trim(), autor: (autor ?? "").trim() };
  }
  return { tipo: "paragrafo", texto: linha, autor: "" };
}

/** Bloco → parágrafo guardado (o site limpa os espaços a mais de cada linha). */
export function deBloco(b: Bloco): string {
  if (b.tipo === "subtitulo") return `## ${b.texto}`;
  if (b.tipo === "citacao") return `> ${b.texto}${b.autor.trim() ? ` — ${b.autor.trim()}` : ""}`;
  return b.texto;
}

/** Número de palavras do texto (para o tempo de leitura). */
export function palavras(corpo: string[]): number {
  return corpo
    .map((l) => paraBloco(l))
    .reduce((n, b) => n + `${b.texto} ${b.autor}`.split(/\s+/).filter(Boolean).length, 0);
}

let contador = 0;
const comId = (b: Bloco): BlocoComId => ({ ...b, id: `b${++contador}` });
const iguaisListas = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export function EditorCorpo({
  valor, onChange, tipos = ["paragrafo", "subtitulo", "citacao"],
}: {
  valor: string[];
  onChange: (corpo: string[]) => void;
  /** Tipos de bloco permitidos (a história dos clubes não tem subtítulos). */
  tipos?: TipoBloco[];
}) {
  // Os blocos vivem aqui enquanto se escreve (com identificadores estáveis, para o
  // cursor não saltar ao reordenar); o texto guardado é a lista de parágrafos.
  const [blocos, setBlocos] = useState<BlocoComId[]>(() => valor.map((l) => comId(paraBloco(l))));
  const [ultimo, setUltimo] = useState(valor);
  // A lista mudou de fora (Desfazer, outro artigo): os blocos voltam a nascer dela.
  if (valor !== ultimo) {
    setUltimo(valor);
    if (!iguaisListas(valor, blocos.map(deBloco))) setBlocos(valor.map((l) => comId(paraBloco(l))));
  }
  const [colar, setColar] = useState<string | null>(null);
  const aFocar = useRef<string | null>(null);

  const emitir = (novos: BlocoComId[]) => {
    const v = novos.map(deBloco);
    setBlocos(novos);
    setUltimo(v);
    onChange(v);
  };

  const mudarBloco = (i: number, b: Partial<Bloco>) => emitir(blocos.map((x, j) => (j === i ? { ...x, ...b } : x)));

  const inserir = (pos: number, novos: Bloco[]) => {
    const comIds = novos.map(comId);
    aFocar.current = comIds[0]?.id ?? null;
    emitir([...blocos.slice(0, pos), ...comIds, ...blocos.slice(pos)]);
  };

  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= blocos.length) return;
    const v = [...blocos];
    [v[i], v[j]] = [v[j], v[i]];
    emitir(v);
  };

  const juntarColado = () => {
    const linhas = (colar ?? "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (linhas.length) inserir(blocos.length, linhas.map(paraBloco));
    setColar(null);
  };

  /** Põe o cursor no bloco acabado de criar. */
  const focar = (id: string) => (el: HTMLTextAreaElement | HTMLInputElement | null) => {
    if (el && aFocar.current === id) {
      aFocar.current = null;
      el.focus();
    }
  };

  return (
    <div className="min-w-0">
      {blocos.length === 0 && (
        <p className="rounded-[var(--raio)] border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/75">
          Ainda sem texto. Junte o primeiro parágrafo, ou cole o texto inteiro de uma vez.
        </p>
      )}

      <ol className="space-y-[var(--intervalo)]">
        {blocos.map((b, i) => {
          const Icone = ICONES[b.tipo];
          return (
            <li key={b.id} className="rounded-[var(--raio)] border border-white/10 bg-black/[0.18] p-2.5 md:p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-[4px] bg-mb-red text-white">
                    <Icone className="size-3.5" />
                  </span>
                  <div role="radiogroup" aria-label={`Tipo do bloco ${i + 1}`} className="flex flex-wrap gap-1">
                    {tipos.map((t) => (
                      <button
                        key={t} type="button" role="radio" aria-checked={b.tipo === t}
                        onClick={() => mudarBloco(i, { tipo: t })}
                        className={`rounded-[4px] px-2 py-1 text-xs transition-colors ${
                          b.tipo === t ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/[0.07] hover:text-white"
                        }`}
                      >
                        {NOMES[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="flex gap-1">
                  <AccaoIcone titulo="Juntar um parágrafo a seguir" onClick={() => inserir(i + 1, [{ tipo: "paragrafo", texto: "", autor: "" }])}>
                    <Plus className="size-4" aria-hidden />
                  </AccaoIcone>
                  <AccaoIcone titulo="Subir" onClick={() => mover(i, -1)}><Seta para="cima" /></AccaoIcone>
                  <AccaoIcone titulo="Descer" onClick={() => mover(i, 1)}><Seta para="baixo" /></AccaoIcone>
                  <AccaoIcone titulo="Apagar bloco" tom="perigo" onClick={() => emitir(blocos.filter((_, j) => j !== i))}>
                    <Trash2 className="size-4" aria-hidden />
                  </AccaoIcone>
                </span>
              </div>

              {b.tipo === "subtitulo" ? (
                <input
                  ref={focar(b.id)}
                  value={b.texto}
                  onChange={(e) => mudarBloco(i, { texto: e.target.value })}
                  placeholder="Título da secção"
                  aria-label={`Subtítulo ${i + 1}`}
                  className={`${CLASSE_CAMPO} text-lg font-semibold`}
                />
              ) : b.tipo === "citacao" ? (
                <div className="grid gap-2 border-l-2 border-mb-red pl-3">
                  <textarea
                    ref={focar(b.id)}
                    value={b.texto} rows={Math.max(2, Math.ceil(b.texto.length / 55))}
                    onChange={(e) => mudarBloco(i, { texto: e.target.value.replace(/\n+/g, " ") })}
                    placeholder="O que foi dito, sem aspas"
                    aria-label={`Citação ${i + 1}`}
                    className={`${CLASSE_CAMPO} resize-y text-[17px] font-medium leading-snug`}
                  />
                  <input
                    value={b.autor}
                    onChange={(e) => mudarBloco(i, { autor: e.target.value })}
                    placeholder="Quem disse, e quando (ex.: Lilio Almeida, presidente, à Euronews)"
                    aria-label={`Autor da citação ${i + 1}`}
                    className={`${CLASSE_CAMPO} text-[13px]`}
                  />
                </div>
              ) : (
                <textarea
                  ref={focar(b.id)}
                  value={b.texto}
                  rows={Math.min(14, Math.max(3, Math.ceil(b.texto.length / 58) + 1))}
                  onChange={(e) => mudarBloco(i, { texto: e.target.value.replace(/\n+/g, " ") })}
                  placeholder="Escreva o parágrafo…"
                  aria-label={`Parágrafo ${i + 1}`}
                  className={`${CLASSE_CAMPO} resize-y leading-relaxed`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-white/75">Juntar:</span>
        {tipos.map((t) => {
          const Icone = ICONES[t];
          return (
            <Botao key={t} tamanho="sm" onClick={() => inserir(blocos.length, [{ tipo: t, texto: "", autor: "" }])}>
              <Icone className="size-3.5" aria-hidden /> {NOMES[t]}
            </Botao>
          );
        })}
        <Botao tamanho="sm" variante="fantasma" onClick={() => setColar(colar === null ? "" : null)} aria-expanded={colar !== null}>
          Colar texto corrido
        </Botao>
      </div>

      {colar !== null && (
        <div className="mt-3 rounded-[var(--raio)] border border-white/10 bg-black/20 p-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-white/75">Cole aqui o texto</span>
            <textarea
              value={colar} rows={8} autoFocus
              onChange={(e) => setColar(e.target.value)}
              placeholder="Cada linha passa a ser um parágrafo, no fim do texto."
              className={`${CLASSE_CAMPO} resize-y leading-relaxed`}
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <Botao variante="fantasma" tamanho="sm" onClick={() => setColar(null)}>Cancelar</Botao>
            <Botao variante="primario" tamanho="sm" onClick={juntarColado} disabled={!colar.trim()}>Juntar ao texto</Botao>
          </div>
        </div>
      )}
    </div>
  );
}
