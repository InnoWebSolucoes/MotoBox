"use client";

/* ============================================================
   MOTOBOX — Segurança: a formação em grupo
   Uma faixa vista de cima com cinco motas. Em recta, ziguezague
   (um segundo entre motas); em curvas, fila indiana (dois
   segundos). As motas deslizam de uma formação para a outra e a
   estrada corre por baixo enquanto o esquema está no ecrã.
   ============================================================ */

import { useRef, useState } from "react";
import { useEmVista } from "./ganchos";
import s from "../seguranca.module.css";

type Modo = "recta" | "curva";

const MOTAS = [0, 1, 2, 3, 4];
const posicao = (i: number, modo: Modo): [number, number] =>
  modo === "recta" ? [i % 2 === 0 ? 102 : 178, 58 + i * 44] : [102, 44 + i * 84];

export function Grupo({ titulo, sentido, lider, fecho, descricaoRecta, descricaoCurva, modoRecta, modoCurva, legendaRecta, legendaCurva, umSegundo, doisSegundos }: {
  titulo: string;
  sentido: string;
  lider: string;
  fecho: string;
  descricaoRecta: string;
  descricaoCurva: string;
  modoRecta: string;
  modoCurva: string;
  legendaRecta: string;
  legendaCurva: string;
  umSegundo: string;
  doisSegundos: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEmVista(ref);
  const [modo, setModo] = useState<Modo>("recta");
  const recta = modo === "recta";
  const [, ay] = posicao(0, modo);
  const [, by] = posicao(1, modo);

  const botao =
    "h-10 flex-1 rounded-[4px] px-3 text-sm text-white transition-colors hover:bg-white/10 aria-pressed:bg-mb-red aria-pressed:font-semibold";

  return (
    <div ref={ref}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{titulo}</h3>
        <div role="group" aria-label={titulo} className="flex min-w-[15rem] gap-1 rounded-[var(--raio)] bg-black/35 p-1">
          <button type="button" className={botao} aria-pressed={recta} onClick={() => setModo("recta")}>
            {modoRecta}
          </button>
          <button type="button" className={botao} aria-pressed={!recta} onClick={() => setModo("curva")}>
            {modoCurva}
          </button>
        </div>
      </div>

      <svg viewBox="0 0 300 440" role="img" aria-label={recta ? descricaoRecta : descricaoCurva} className="mx-auto mt-6 block w-full max-w-[22rem]">
        {/* A faixa */}
        <rect x="60" y="8" width="160" height="424" rx="6" fill="rgb(255 255 255 / 0.05)" />
        <line x1="60" y1="8" x2="60" y2="432" stroke="rgb(255 255 255 / 0.55)" strokeWidth="2" />
        <line x1="220" y1="8" x2="220" y2="432" stroke="rgb(255 255 255 / 0.55)" strokeWidth="2" />
        {/* Terços da faixa */}
        <g stroke="rgb(255 255 255 / 0.12)" strokeWidth="1">
          <line x1="113" y1="8" x2="113" y2="432" />
          <line x1="167" y1="8" x2="167" y2="432" />
        </g>
        <line x1="140" y1="8" x2="140" y2="432" stroke="rgb(255 255 255 / 0.4)" strokeWidth="2" strokeDasharray="12 12" className={s.faixaCentro} />

        {/* Cota entre a 1.ª e a 2.ª mota */}
        <g className={s.cota} style={{ transform: `translate(0px, ${ay}px)` }}>
          <path d={`M36 0 V${by - ay} M30 0 H42 M30 ${by - ay} H42`} stroke="#fff" strokeWidth="1.5" fill="none" />
          <text x="26" y={(by - ay) / 2 + 4} textAnchor="end" fill="#fff" fontSize="12" fontWeight="600">
            {recta ? umSegundo : doisSegundos}
          </text>
        </g>

        {MOTAS.map((i) => {
          const [x, y] = posicao(i, modo);
          const ponta = i === 0 || i === MOTAS.length - 1;
          return (
            <g key={i} className={s.mota} style={{ transform: `translate(${x}px, ${y}px)` }}>
              <rect x="-8" y="-18" width="16" height="36" rx="8" fill={ponta ? "#e10600" : "#ffffff"} />
              <circle cy="2" r="5" fill={ponta ? "#ffffff" : "#1d1d23"} />
              {i === 0 && (
                <text x="-16" y="5" textAnchor="end" fill="#fff" fontSize="13" fontWeight="600">
                  {lider}
                </text>
              )}
              {i === MOTAS.length - 1 && (
                <text x="-16" y="5" textAnchor="end" fill="#fff" fontSize="13" fontWeight="600">
                  {fecho}
                </text>
              )}
            </g>
          );
        })}

        {/* Sentido de marcha */}
        <g fill="#fff">
          <path d="M256 300 V80 m-8 12 l8 -12 l8 12" stroke="rgb(255 255 255 / 0.8)" strokeWidth="2" fill="none" />
          <text x="272" y="190" transform="rotate(90 272 190)" textAnchor="middle" fontSize="12">
            {sentido}
          </text>
        </g>
      </svg>

      <p aria-live="polite" className="mt-4 text-[15px] leading-relaxed text-white">
        {recta ? legendaRecta : legendaCurva}
      </p>
    </div>
  );
}
