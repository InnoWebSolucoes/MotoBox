"use client";

/* ============================================================
   MOTOBOX — Segurança: em caso de acidente, passo a passo
   Separadores (Proteger → Alertar → Socorrer) com uma linha que
   avança, e botões para o passo anterior e o seguinte. Todos os
   passos estão no HTML; só o activo se mostra.
   ============================================================ */

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { preencher } from "./comum";
import s from "../seguranca.module.css";

export function Acidente({ passos, rotulos }: {
  passos: { nome: string; itens: string[] }[];
  rotulos: { passoDe: string; anterior: string; seguinte: string; titulo: string };
}) {
  const [activo, setActivo] = useState(0);
  const base = useId();
  const separadores = useRef<(HTMLButtonElement | null)[]>([]);
  const total = passos.length;
  if (!total) return null;

  const ir = (i: number, focar = false) => {
    const novo = Math.max(0, Math.min(total - 1, i));
    setActivo(novo);
    if (focar) separadores.current[novo]?.focus();
  };
  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const mapa: Record<string, number> = { ArrowRight: activo + 1, ArrowLeft: activo - 1, Home: 0, End: total - 1 };
    if (!(e.key in mapa)) return;
    e.preventDefault();
    ir(mapa[e.key], true);
  };

  return (
    <div className="painel painel-escuro p-5 md:p-8">
      <div role="tablist" aria-label={rotulos.titulo} onKeyDown={teclas} className="relative grid" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {/* Linha que liga os passos */}
        <span aria-hidden className="absolute left-5 right-5 top-5 h-[3px] -translate-y-1/2 bg-white/15 md:left-6 md:right-6 md:top-6">
          <span
            className={`${s.passoLinha} absolute inset-0 bg-mb-red`}
            style={{ transform: `scaleX(${total > 1 ? activo / (total - 1) : 1})` }}
          />
        </span>
        {passos.map((p, i) => (
          <button
            key={i}
            ref={(el) => {
              separadores.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-sep-${i}`}
            aria-selected={i === activo}
            aria-controls={`${base}-passo-${i}`}
            tabIndex={i === activo ? 0 : -1}
            onClick={() => ir(i)}
            className={`group relative flex flex-col gap-2 rounded-[4px] text-left ${i === total - 1 && total > 1 ? "items-end text-right" : i > 0 ? "items-center text-center" : "items-start"}`}
          >
            <span
              className={`grid size-10 place-items-center rounded-full text-base font-semibold transition-colors md:size-12 md:text-lg ${
                i <= activo ? "bg-mb-red text-white" : "bg-[#3a3a43] text-white ring-2 ring-white/40"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-[15px] md:text-lg ${i === activo ? "font-semibold text-white" : "text-white/85 group-hover:text-white"}`}>{p.nome}</span>
          </button>
        ))}
      </div>

      {passos.map((p, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${base}-passo-${i}`}
          aria-labelledby={`${base}-sep-${i}`}
          hidden={i !== activo}
          className="mt-8"
        >
          <p className="text-sm text-white/85">{preencher(rotulos.passoDe, { n: i + 1, total })}</p>
          <p className="titulo-3 mt-2">{p.nome}</p>
          <ul className={`${s.detalhe} mt-6 space-y-4`}>
            {p.itens.map((item, j) => (
              <li key={j} className="flex gap-4 text-base leading-relaxed text-white md:text-[17px]">
                <span aria-hidden className="mt-1 grid size-6 shrink-0 place-items-center rounded-[4px] bg-white/10 text-xs font-semibold text-white">
                  {j + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-8 flex items-center gap-[var(--intervalo)]">
        <button
          type="button"
          onClick={() => ir(activo - 1)}
          disabled={activo === 0}
          aria-label={rotulos.anterior}
          className="grid size-11 place-items-center rounded-[var(--raio)] bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => ir(activo + 1)}
          disabled={activo === total - 1}
          className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-[var(--raio)] bg-mb-red px-4 text-sm text-white transition-colors hover:bg-mb-red-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {rotulos.seguinte}
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
