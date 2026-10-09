"use client";

/* ============================================================
   MOTOBOX — Segurança: vista o motard
   Um motard de frente; cada peça (casaco, luvas, calças, botas)
   é uma zona do desenho. Ao escolher uma peça, a zona acende a
   vermelho e aparece o que protege e a norma a procurar.
   ============================================================ */

import { useState } from "react";
import type { ZonaCorpo } from "../conteudo";
import s from "../seguranca.module.css";

export type Peca = { nome: string; texto: string; zona: ZonaCorpo; norma: string };

const ZONAS: ZonaCorpo[] = ["casaco", "luvas", "calcas", "botas"];

/* Desenho 220 × 400: as formas de cada zona. */
const FORMAS: Record<ZonaCorpo, string[]> = {
  casaco: [
    "M76 96 Q110 86 144 96 L150 204 L70 204 Z",
    "M76 96 C60 100 52 112 50 126 L40 196 L60 200 L70 132 Z",
    "M144 96 C160 100 168 112 170 126 L180 196 L160 200 L150 132 Z",
  ],
  luvas: ["M36 198 h26 v22 q0 12 -13 12 q-13 0 -13 -12 Z", "M158 198 h26 v22 q0 12 -13 12 q-13 0 -13 -12 Z"],
  calcas: ["M70 204 L150 204 L148 334 L116 334 L110 240 L104 334 L72 334 Z"],
  botas: ["M72 334 L104 334 L106 372 L64 372 Q62 356 72 350 Z", "M116 334 L148 334 L148 350 Q158 356 156 372 L114 372 Z"],
};

/* Protecções desenhadas por cima (ombros, cotovelos, joelhos). */
const PROTECCOES: Record<ZonaCorpo, string[]> = {
  casaco: ["M78 100 q-14 4 -18 18 l12 4 q4 -10 10 -12 Z", "M142 100 q14 4 18 18 l-12 4 q-4 -10 -10 -12 Z", "M46 150 l14 2 l-2 16 l-14 -2 Z", "M174 150 l-14 2 l2 16 l14 -2 Z"],
  luvas: ["M40 204 h18 v6 h-18 Z", "M162 204 h18 v6 h-18 Z"],
  calcas: ["M78 262 h22 v22 h-22 Z", "M120 262 h22 v22 h-22 Z"],
  botas: ["M76 342 h24 v6 h-24 Z", "M120 342 h24 v6 h-24 Z"],
};

export function Equipamento({ pecas, titulo, texto, descricao, normaRotulo }: {
  pecas: Peca[];
  titulo: string;
  texto: string;
  descricao: string;
  normaRotulo: string;
}) {
  const [activa, setActiva] = useState(0);
  const peca = pecas[activa] ?? pecas[0];
  if (!peca) return null;
  const indiceDe = (z: ZonaCorpo) => pecas.findIndex((p) => p.zona === z);

  return (
    <div className="grid gap-8 p-5 md:grid-cols-[minmax(0,15rem)_1fr] md:items-center md:p-8 lg:gap-12 lg:p-10">
      <svg viewBox="0 0 220 400" role="img" aria-label={descricao} className="mx-auto w-full max-w-[10.5rem] md:max-w-none">
        {/* Cabeça com capacete */}
        <circle cx="110" cy="52" r="32" fill="#2a2a31" stroke="rgb(255 255 255 / 0.55)" strokeWidth="1.5" />
        <path d="M86 50 q24 -14 48 0 v10 q-24 8 -48 0 Z" fill="#14151a" />
        <rect x="100" y="82" width="20" height="14" fill="#2a2a31" />
        {ZONAS.map((z, iz) => {
          const i = indiceDe(z);
          if (i < 0) return null;
          return (
            <g
              key={z}
              className={s.vestir}
              style={{ "--i": iz } as React.CSSProperties}
              onClick={() => setActiva(i)}
              aria-hidden
            >
              {FORMAS[z].map((d) => (
                <path key={d} d={d} className={s.zona} data-activa={i === activa ? "" : undefined} />
              ))}
              {PROTECCOES[z].map((d) => (
                <path key={d} d={d} fill="rgb(0 0 0 / 0.28)" pointerEvents="none" />
              ))}
            </g>
          );
        })}
      </svg>

      <div>
        <h3 className="titulo-4">{titulo}</h3>
        <p className="mt-2 text-[15px] text-white/90">{texto}</p>
        <div role="group" aria-label={titulo} className="mt-5 flex flex-wrap gap-[var(--intervalo)]">
          {pecas.map((p, i) => (
            <button
              key={`${p.nome}-${i}`}
              type="button"
              aria-pressed={i === activa}
              onClick={() => setActiva(i)}
              className="pilula h-10 text-[15px] text-white"
            >
              {p.nome}
            </button>
          ))}
        </div>
        <div aria-live="polite" className="mt-5">
          <div key={activa} className={`${s.detalhe} rounded-[var(--raio)] bg-black/25 p-5 md:p-6`}>
            <p className="text-2xl font-semibold leading-tight text-white">{peca.nome}</p>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-white/90">{peca.texto}</p>
            {peca.norma && (
              <p className="mt-5 inline-flex flex-wrap items-center gap-2 text-sm text-white">
                <span className="text-white/85">{normaRotulo}</span>
                <span className="rounded-[4px] bg-white px-2 py-0.5 font-semibold tabular-nums text-[#1d1d23]">{peca.norma}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
