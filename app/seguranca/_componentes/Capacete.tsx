"use client";

/* ============================================================
   MOTOBOX — Segurança: o capacete por dentro
   Desenho de um integral de lado, com um corte atrás que mostra
   as camadas. Cada ponto é um botão: mostra o que faz a parte.
   ============================================================ */

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ParteCapacete } from "../conteudo";
import { Refs } from "./comum";
import s from "../seguranca.module.css";

export type Parte = { id: ParteCapacete; nome: string; texto: string; fontes: number[] };

/** Onde fica cada ponto no desenho (em % da caixa 400 × 350). */
const PONTOS: Record<ParteCapacete, [number, number]> = {
  calota: [72, 17],
  espuma: [21.5, 41],
  forro: [36, 28.5],
  viseira: [76, 47],
  correia: [63, 92],
  etiqueta: [47.5, 82],
};

const CENTRO = "translate(212 168)";
const escala = (k: number) => `${CENTRO} scale(${k}) translate(-212 -168)`;

/* A calota vista de lado, virada para a direita. */
const CALOTA =
  "M84 250 C62 196 66 118 122 76 C170 40 262 36 318 78 C350 102 366 134 368 168 L370 236 C371 262 352 280 326 282 L252 286 C226 287 210 276 196 266 L112 266 C98 266 89 260 84 250 Z";
const VISEIRA = "M236 126 C280 110 338 114 362 140 L368 198 C330 208 282 208 244 200 C230 178 229 150 236 126 Z";

export function Capacete({ partes, titulo, texto, descricao, anterior, seguinte, totalFontes, rotuloFonte }: {
  partes: Parte[];
  titulo: string;
  texto: string;
  descricao: string;
  anterior: string;
  seguinte: string;
  totalFontes: number;
  rotuloFonte: string;
}) {
  const [activa, setActiva] = useState(0);
  const [tocado, setTocado] = useState(false);
  const parte = partes[activa] ?? partes[0];
  if (!parte) return null;
  const escolher = (i: number) => {
    setActiva((i + partes.length) % partes.length);
    setTocado(true);
  };
  const parteDe = (id: ParteCapacete) => ({
    className: s.parte,
    "data-activa": parte.id === id ? "" : undefined,
  });

  return (
    <div className="grid gap-8 p-5 md:p-8 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-12 lg:p-10">
      <div
        className={`${s.desenhoCapacete} relative mx-auto aspect-[400/350] w-full max-w-[34rem]`}
        data-activa={tocado ? "" : undefined}
        data-tocado={tocado ? "" : undefined}
      >
        <svg viewBox="0 0 400 350" role="img" aria-label={descricao} className="absolute inset-0 size-full overflow-visible">
          <defs>
            <linearGradient id="seg-calota" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stopColor="#ff3b2f" />
              <stop offset="1" stopColor="#a80400" />
            </linearGradient>
            <linearGradient id="seg-viseira" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4a5262" />
              <stop offset="1" stopColor="#13151b" />
            </linearGradient>
            <pattern id="seg-eps" width="7" height="7" patternUnits="userSpaceOnUse">
              <rect width="7" height="7" fill="#e7e1d4" />
              <circle cx="2" cy="2" r="1.4" fill="#cfc6b3" />
              <circle cx="5.5" cy="5.5" r="1.1" fill="#d8d0bf" />
            </pattern>
            <pattern id="seg-forro" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#6b6b78" />
              <path d="M0 6 L6 0" stroke="#7d7d8a" strokeWidth="1.2" />
            </pattern>
            <clipPath id="seg-corte">
              <polygon points="212,168 20,262 20,10 168,10" />
            </clipPath>
            <clipPath id="seg-dentro">
              <path d={CALOTA} />
            </clipPath>
          </defs>

          {/* Calota */}
          <g {...parteDe("calota")}>
            <path d={CALOTA} fill="url(#seg-calota)" />
            <path d="M128 84 C178 50 258 46 312 84" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" />
            <path d="M150 74 C190 52 240 50 280 62" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="14" strokeLinecap="round" />
            {/* respiros e queixo */}
            <path d="M330 236 h22 M330 246 h22 M330 256 h20" stroke="#5a0200" strokeWidth="3" strokeLinecap="round" />
            <path d="M112 266 L196 266 C210 276 226 287 252 286 L326 282" fill="none" stroke="#1d1d23" strokeWidth="6" strokeLinecap="round" />
          </g>

          {/* Corte: espuma, forro e o vazio onde vai a cabeça */}
          <g clipPath="url(#seg-corte)">
            <g clipPath="url(#seg-dentro)">
              <g {...parteDe("espuma")}>
                <path d={CALOTA} transform={escala(0.95)} fill="url(#seg-eps)" />
              </g>
              <g {...parteDe("forro")}>
                <path d={CALOTA} transform={escala(0.79)} fill="url(#seg-forro)" />
              </g>
              <path d={CALOTA} transform={escala(0.73)} fill="#26262d" />
            </g>
          </g>
          {/* Arestas do corte */}
          <g clipPath="url(#seg-dentro)" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5">
            <line x1="212" y1="168" x2="20" y2="262" />
            <line x1="212" y1="168" x2="168" y2="10" />
          </g>

          {/* Viseira */}
          <g {...parteDe("viseira")}>
            <path d={VISEIRA} fill="url(#seg-viseira)" stroke="#0d0d10" strokeWidth="3" />
            <path d="M262 132 C292 124 324 126 346 140" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="5" strokeLinecap="round" />
            <circle cx="226" cy="162" r="10" fill="#1d1d23" stroke="#3c3c46" strokeWidth="3" />
          </g>

          {/* Correia e fivela */}
          <g {...parteDe("correia")}>
            <path d="M200 268 C192 300 206 326 236 328 C262 330 276 312 274 286" fill="none" stroke="#24242b" strokeWidth="8" strokeLinecap="round" />
            <path d="M200 268 C192 300 206 326 236 328 C262 330 276 312 274 286" fill="none" stroke="#4b4b56" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="244" y="318" width="10" height="16" rx="5" fill="none" stroke="#dcdce2" strokeWidth="3" />
            <rect x="252" y="318" width="10" height="16" rx="5" fill="none" stroke="#dcdce2" strokeWidth="3" />
          </g>

          {/* Etiqueta de homologação */}
          <g {...parteDe("etiqueta")}>
            <rect x="184" y="280" width="26" height="18" rx="2" fill="#fff" transform="rotate(-14 197 289)" />
            <circle cx="193" cy="290" r="5.5" fill="none" stroke="#1d1d23" strokeWidth="1.4" transform="rotate(-14 197 289)" />
            <text x="193" y="292.5" fontSize="7" fontWeight="700" textAnchor="middle" fill="#1d1d23" transform="rotate(-14 197 289)">E</text>
            <path d="M201 287 h6 M201 291 h5" stroke="#1d1d23" strokeWidth="1.2" transform="rotate(-14 197 289)" />
          </g>
        </svg>

        {/* Os pontos (botões por cima do desenho) */}
        <div role="group" aria-label={titulo}>
          {partes.map((p, i) => {
            const [x, y] = PONTOS[p.id] ?? [50, 50];
            return (
              <button
                key={`${p.id}-${i}`}
                type="button"
                className={s.ponto}
                style={{ left: `${x}%`, top: `${y}%`, "--i": i } as React.CSSProperties}
                aria-pressed={i === activa}
                aria-label={`${i + 1}. ${p.nome}`}
                onClick={() => escolher(i)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="titulo-4">{titulo}</h3>
        <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-white/90">{texto}</p>
        <div aria-live="polite" className="mt-6">
        <div key={activa} className={`${s.detalhe} rounded-[var(--raio)] bg-black/25 p-5 md:p-6`}>
          <p className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mb-red text-sm font-semibold text-white">{activa + 1}</span>
            <span className="text-xl font-semibold leading-tight text-white">{parte.nome}</span>
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-white/90">
            {parte.texto}
            <Refs fontes={parte.fontes} total={totalFontes} rotulo={rotuloFonte} />
          </p>
        </div>
        </div>
        <div className="mt-4 flex items-center gap-[var(--intervalo)]">
          <button
            type="button"
            onClick={() => escolher(activa - 1)}
            aria-label={anterior}
            className="grid size-11 place-items-center rounded-[var(--raio)] bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => escolher(activa + 1)}
            className="inline-flex h-11 items-center gap-2 rounded-[var(--raio)] bg-white/10 px-4 text-sm text-white transition-colors hover:bg-white/20"
          >
            {seguinte}
            <ChevronRight aria-hidden className="size-4" />
          </button>
          <span className="ml-auto text-sm tabular-nums text-white/80" aria-hidden>
            {activa + 1}/{partes.length}
          </span>
        </div>
      </div>
    </div>
  );
}
