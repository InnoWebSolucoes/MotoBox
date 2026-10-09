"use client";

/* Separadores simples (Escolher · Usar · Trocar): setas para mudar,
   todos os painéis no HTML e só o activo à vista. */

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import s from "../seguranca.module.css";

export function Separadores({ abas, rotulo }: { abas: { titulo: string; conteudo: ReactNode }[]; rotulo: string }) {
  const [activa, setActiva] = useState(0);
  const base = useId();
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);
  const total = abas.length;

  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const mapa: Record<string, number> = {
      ArrowRight: (activa + 1) % total,
      ArrowLeft: (activa - 1 + total) % total,
      Home: 0,
      End: total - 1,
    };
    if (!(e.key in mapa)) return;
    e.preventDefault();
    setActiva(mapa[e.key]);
    botoes.current[mapa[e.key]]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={rotulo} onKeyDown={teclas} className="flex flex-wrap gap-[var(--intervalo)]">
        {abas.map((a, i) => (
          <button
            key={i}
            ref={(el) => {
              botoes.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-aba-${i}`}
            aria-selected={i === activa}
            aria-controls={`${base}-painel-${i}`}
            tabIndex={i === activa ? 0 : -1}
            onClick={() => setActiva(i)}
            className="inline-flex h-11 items-center rounded-[var(--raio)] bg-white/10 px-5 text-[15px] text-white transition-colors hover:bg-white/20 aria-selected:bg-mb-red aria-selected:font-semibold"
          >
            {a.titulo}
          </button>
        ))}
      </div>
      {abas.map((a, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${base}-painel-${i}`}
          aria-labelledby={`${base}-aba-${i}`}
          hidden={i !== activa}
          className={`${s.detalhe} mt-[var(--intervalo)]`}
        >
          {a.conteudo}
        </div>
      ))}
    </div>
  );
}
