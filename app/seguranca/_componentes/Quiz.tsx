"use client";

/* ============================================================
   MOTOBOX — Segurança: teste rápido ("Sabe o que fazer?")
   Uma pergunta de cada vez; ao escolher, a resposta certa
   acende e aparece a explicação, com ligação para o capítulo.
   No fim, quantas acertou.
   ============================================================ */

import { useRef, useState } from "react";
import { ArrowDown, Check, RotateCcw, X } from "lucide-react";
import { preencher } from "./comum";
import s from "../seguranca.module.css";

export type Pergunta = { pergunta: string; opcoes: string[]; certa: number; explicacao: string; seccao: string; seccaoNome: string };

export function Quiz({ perguntas, rotulos }: {
  perguntas: Pergunta[];
  rotulos: {
    perguntaDe: string;
    certo: string;
    errado: string;
    seguinte: string;
    verResultado: string;
    resultado: string;
    resultadoTudo: string;
    resultadoParte: string;
    rever: string;
    recomecar: string;
  };
}) {
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<(number | null)[]>(() => perguntas.map(() => null));
  const titulo = useRef<HTMLParagraphElement>(null);
  const proxima = useRef<HTMLButtonElement>(null);
  const total = perguntas.length;
  if (!total) return null;

  const terminou = indice >= total;
  const certas = respostas.filter((r, i) => r !== null && r === perguntas[i]?.certa).length;

  const focar = () => requestAnimationFrame(() => titulo.current?.focus());
  const avancar = () => {
    setIndice((i) => i + 1);
    focar();
  };
  const recomecar = () => {
    setRespostas(perguntas.map(() => null));
    setIndice(0);
    focar();
  };

  if (terminou) {
    const falhadas = perguntas.filter((p, i) => respostas[i] !== p.certa);
    return (
      <div className={`${s.pronto} painel painel-escuro p-6 md:p-10`}>
        <p ref={titulo} tabIndex={-1} className="titulo-2 outline-none">
          {preencher(rotulos.resultado, { certas, total })}
        </p>
        <p className="mt-4 max-w-[52ch] text-lg text-white">{certas === total ? rotulos.resultadoTudo : rotulos.resultadoParte}</p>
        {falhadas.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-[var(--intervalo)]">
            {[...new Map(falhadas.map((p) => [p.seccao, p])).values()].map((p) => (
              <li key={p.seccao}>
                <a href={`#${p.seccao}`} className="pilula h-10 text-[15px] text-white">
                  <ArrowDown aria-hidden className="size-4 rotate-180" />
                  {rotulos.rever}: {p.seccaoNome}
                </a>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={recomecar}
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-[var(--raio)] bg-mb-red px-5 text-[15px] text-white transition-colors hover:bg-mb-red-dark"
        >
          <RotateCcw aria-hidden className="size-4" />
          {rotulos.recomecar}
        </button>
      </div>
    );
  }

  const p = perguntas[indice];
  const escolhida = respostas[indice];
  const respondida = escolhida !== null;
  const acertou = escolhida === p.certa;

  return (
    <div className="painel painel-escuro p-6 md:p-10">
      {/* Progresso: um traço por pergunta */}
      <div aria-hidden className="flex gap-1.5">
        {perguntas.map((q, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < indice ? (respostas[i] === q.certa ? "bg-[#22c55e]" : "bg-mb-red") : i === indice ? "bg-white" : "bg-white/20"
            }`}
          />
        ))}
      </div>
      <p className="mt-6 text-sm text-white/85">{preencher(rotulos.perguntaDe, { n: indice + 1, total })}</p>
      <p ref={titulo} tabIndex={-1} id="seguranca-pergunta" className="titulo-3 mt-3 max-w-[30ch] text-balance outline-none">
        {p.pergunta}
      </p>

      <div role="group" aria-labelledby="seguranca-pergunta" className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-3">
        {p.opcoes.map((o, i) => {
          const estado = !respondida ? undefined : i === p.certa ? "certa" : i === escolhida ? "errada" : undefined;
          return (
            <button
              key={i}
              type="button"
              disabled={respondida}
              aria-pressed={i === escolhida}
              data-estado={estado}
              onClick={() => {
                setRespostas((r) => r.map((x, j) => (j === indice ? i : x)));
                // O botão escolhido fica inactivo: o foco passa para "Pergunta seguinte".
                requestAnimationFrame(() => proxima.current?.focus());
              }}
              className={`${s.opcao} flex min-h-20 items-start gap-3 rounded-[var(--raio)] bg-white/[0.08] p-4 text-left text-[15px] leading-snug text-white enabled:hover:bg-white/[0.15] disabled:cursor-default`}
            >
              <span
                aria-hidden
                className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                  estado === "certa" ? "bg-[#22c55e] text-[#0b2a16]" : estado === "errada" ? "bg-mb-red text-white" : "bg-white/15 text-white"
                }`}
              >
                {estado === "certa" ? <Check className="size-4" strokeWidth={3} /> : estado === "errada" ? <X className="size-4" strokeWidth={3} /> : String.fromCharCode(65 + i)}
              </span>
              <span className="pt-0.5">{o}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {respondida && (
          <div className={`${s.detalhe} mt-6 rounded-[var(--raio)] bg-black/25 p-5 md:p-6`}>
            <p className={`text-lg font-semibold ${acertou ? "text-[#4ade80]" : "text-[#ff8a80]"}`}>{acertou ? rotulos.certo : rotulos.errado}</p>
            <p className="mt-2 max-w-[64ch] text-[15px] leading-relaxed text-white">{p.explicacao}</p>
            <div className="mt-5 flex flex-wrap items-center gap-[var(--intervalo)]">
              <button
                ref={proxima}
                type="button"
                onClick={avancar}
                className="inline-flex h-11 items-center rounded-[var(--raio)] bg-mb-red px-5 text-sm text-white transition-colors hover:bg-mb-red-dark"
              >
                {indice === total - 1 ? rotulos.verResultado : rotulos.seguinte}
              </button>
              {p.seccao && (
                <a href={`#${p.seccao}`} className="inline-flex h-11 items-center rounded-[var(--raio)] bg-white/10 px-4 text-sm text-white transition-colors hover:bg-white/20">
                  {rotulos.rever}: {p.seccaoNome}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
