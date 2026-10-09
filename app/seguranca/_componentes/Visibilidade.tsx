"use client";

/* ============================================================
   MOTOBOX — Segurança: ver e ser visto
   Uma estrada vista de dentro de um carro, com um motociclista
   à frente. Muda-se a hora (dia / noite) e a roupa (escura /
   cores vivas e reflector) e vê-se o que o condutor vê.
   ============================================================ */

import { useState } from "react";
import { Moon, Shirt, Sun } from "lucide-react";
import { Refs } from "./comum";
import s from "../seguranca.module.css";

type Hora = "dia" | "noite";
type Roupa = "escura" | "visivel";

export function Visibilidade({ cena, totalFontes, rotuloFonte }: {
  cena: {
    titulo: string;
    dia: string;
    noite: string;
    escuro: string;
    visivel: string;
    diaEscuro: string;
    diaVisivel: string;
    noiteEscuro: string;
    noiteVisivel: string;
    nota: string;
    descricao: string;
    fontes: number[];
  };
  totalFontes: number;
  rotuloFonte: string;
}) {
  const [hora, setHora] = useState<Hora>("noite");
  const [roupa, setRoupa] = useState<Roupa>("escura");
  const noite = hora === "noite";
  const vivo = roupa === "visivel";

  const legenda = { "dia-escura": cena.diaEscuro, "dia-visivel": cena.diaVisivel, "noite-escura": cena.noiteEscuro, "noite-visivel": cena.noiteVisivel }[
    `${hora}-${roupa}` as const
  ];

  // Cores da cena (mudam com transição no CSS).
  const c = {
    ceu: noite ? "#070910" : "#a9bccf",
    montes: noite ? "#0c0f15" : "#3b4a35",
    terra: noite ? "#090b10" : "#8f8a62",
    estrada: noite ? "#121319" : "#5d5e66",
    bordas: noite ? 0.22 : 0.75,
    tracos: noite ? 0.28 : 0.9,
    sombra: noite ? 0 : 0.42,
    feixe: noite ? 0.55 : 0,
    casaco: vivo ? (noite ? "#58631f" : "#d9ff3d") : noite ? "#0d0e12" : "#24252b",
    calcas: noite ? "#0b0c10" : "#202127",
    capacete: vivo ? (noite ? "#2a2a31" : "#f4f4f6") : noite ? "#0d0e12" : "#1b1b20",
    faixas: vivo ? (noite ? "#fffbe8" : "#c9ced6") : "transparent",
    brilho: vivo && noite ? 0.95 : 0,
    farolim: noite ? 0.9 : 0.25,
    painel: noite ? "#17171c" : "#202026",
  };

  const tracos = [
    [158, 4, 1.2],
    [174, 7, 1.8],
    [198, 10, 2.6],
    [232, 15, 3.6],
    [278, 22, 5],
  ];
  const meio = (y: number) => 22 + (y - 150) * (218 / 150);

  const botao =
    "inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-[4px] px-2.5 py-1.5 text-center text-sm leading-tight text-white transition-colors hover:bg-white/10 aria-pressed:bg-mb-red aria-pressed:font-semibold sm:flex-none sm:whitespace-nowrap";

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="titulo-4">{cena.titulo}</h3>
      </div>
      <div className="mt-4 flex flex-wrap gap-[var(--intervalo)]">
        <div role="group" aria-label={`${cena.dia} / ${cena.noite}`} className="flex w-full gap-1 rounded-[var(--raio)] bg-black/35 p-1 sm:w-auto">
          <button type="button" className={botao} aria-pressed={!noite} onClick={() => setHora("dia")}>
            <Sun aria-hidden className="size-4" />
            {cena.dia}
          </button>
          <button type="button" className={botao} aria-pressed={noite} onClick={() => setHora("noite")}>
            <Moon aria-hidden className="size-4" />
            {cena.noite}
          </button>
        </div>
        <div role="group" aria-label={`${cena.escuro} / ${cena.visivel}`} className="flex w-full gap-1 rounded-[var(--raio)] bg-black/35 p-1 sm:w-auto">
          <button type="button" className={botao} aria-pressed={!vivo} onClick={() => setRoupa("escura")}>
            <Shirt aria-hidden className="size-4 shrink-0" />
            {cena.escuro}
          </button>
          <button type="button" className={botao} aria-pressed={vivo} onClick={() => setRoupa("visivel")}>
            <Shirt aria-hidden className="size-4 shrink-0 text-[#d9ff3d]" />
            {cena.visivel}
          </button>
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[var(--raio)] bg-black">
        <svg viewBox="0 0 480 300" role="img" aria-label={`${cena.descricao} ${legenda}`} className={`${s.cena} block w-full`}>
          <defs>
            <linearGradient id="seg-feixe" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#fff6d6" stopOpacity="0.75" />
              <stop offset="1" stopColor="#fff6d6" stopOpacity="0" />
            </linearGradient>
            <filter id="seg-reflexo" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          <rect width="480" height="150" fill={c.ceu} />
          {/* Um monte com árvores atrás da estrada: de dia, é o fundo escuro onde a roupa escura se perde. */}
          <path d="M0 150 L0 112 C50 98 110 104 160 92 C200 80 226 70 262 74 C312 80 356 96 400 92 C440 88 462 100 480 98 L480 150 Z" fill={c.montes} />
          <rect y="150" width="480" height="150" fill={c.terra} />
          <polygon points="0,300 480,300 262,150 218,150" fill={c.estrada} />
          <g stroke="#fff" strokeWidth="2" opacity={c.bordas}>
            <line x1="218" y1="150" x2="24" y2="300" />
            <line x1="262" y1="150" x2="456" y2="300" />
          </g>
          <g fill="#fff" opacity={c.tracos}>
            {tracos.map(([y, h, w]) => (
              <rect key={y} x={240 - w / 2} y={y} width={w} height={h} />
            ))}
          </g>
          {/* Sombra de uma árvore sobre a estrada (de dia) */}
          <polygon points={`${240 - meio(168)},168 ${240 + meio(168)},168 ${240 + meio(270)},270 ${240 - meio(270)},270`} fill="#000" opacity={c.sombra} />
          {/* Feixe dos faróis (de noite) */}
          <polygon points="30,300 206,182 274,182 450,300" fill="url(#seg-feixe)" opacity={c.feixe} />

          {/* Estrelas (de noite) */}
          <g fill="#fff" opacity={noite ? 0.7 : 0}>
            {[[80, 40, 1.2], [130, 70, 0.9], [170, 30, 1.1], [300, 52, 1], [350, 28, 1.3], [410, 66, 0.9], [250, 84, 0.8], [440, 36, 1]].map(([x, y, r]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
            ))}
          </g>

          {/* O motociclista, de costas (ampliado, para se ver bem) */}
          <g transform="translate(240 262) scale(1.5) translate(-240 -252)">
            <rect x="233" y="216" width="14" height="36" rx="6" fill="#0b0b0e" />
            <rect x="228" y="208" width="24" height="9" rx="3" fill="#2a2a30" />
            <rect x="234" y="215" width="12" height="6" rx="1" fill="#d6d6dc" opacity={noite ? 0.25 : 0.9} />
            <ellipse cx="240" cy="208" rx="16" ry="8" fill="#ff2b1f" opacity={noite ? 0.45 : 0} filter="url(#seg-reflexo)" />
            <rect x="233" y="205" width="14" height="5" rx="2" fill="#ff2b1f" opacity={c.farolim} />
            <path d="M222 198 L213 228 L221 230 L231 203 Z M258 198 L267 228 L259 230 L249 203 Z" fill={c.calcas} />
            <line x1="203" y1="184" x2="277" y2="184" stroke="#0b0b0e" strokeWidth="3" strokeLinecap="round" />
            <circle cx="200" cy="175" r="4" fill="#0b0b0e" />
            <circle cx="280" cy="175" r="4" fill="#0b0b0e" />
            <path d="M222 161 L205 184 L211 188 L227 171 Z M258 161 L275 184 L269 188 L253 171 Z" fill={c.casaco} />
            <path d="M223 160 C223 150 257 150 257 160 L262 202 L218 202 Z" fill={c.casaco} />
            {/* Faixas reflectoras: o brilho por trás, a faixa por cima */}
            <g fill={c.faixas === "transparent" ? "#fffbe8" : c.faixas} opacity={c.brilho} filter="url(#seg-reflexo)">
              <rect x="219" y="175" width="42" height="6" />
              <rect x="218" y="189" width="44" height="6" />
              <rect x="229" y="140" width="22" height="5" />
            </g>
            <g fill={c.faixas}>
              <rect x="220" y="176" width="40" height="4" />
              <rect x="219" y="190" width="42" height="4" />
            </g>
            <circle cx="240" cy="146" r="12.5" fill={c.capacete} />
            <rect x="230" y="141" width="20" height="3.5" rx="1.5" fill={c.faixas} />
          </g>

          {/* Por dentro do carro: pilares, tejadilho, espelho e tablier */}
          <g fill={c.painel}>
            <polygon points="0,0 54,0 14,300 0,300" />
            <polygon points="480,0 426,0 466,300 480,300" />
            <rect width="480" height="14" />
            <rect x="208" y="14" width="64" height="18" rx="7" />
            <path d="M0 300 L0 274 C120 258 360 258 480 274 L480 300 Z" />
          </g>
        </svg>
      </div>

      <div aria-live="polite" className="mt-4 min-h-[3.25rem]">
        <p key={`${hora}-${roupa}`} className={`${s.legenda} text-[15px] leading-relaxed text-white`}>
          {legenda}
        </p>
      </div>
      <p className="mt-2 text-xs text-white/80">
        {cena.nota}
        <Refs fontes={cena.fontes} total={totalFontes} rotulo={rotuloFonte} />
      </p>
    </div>
  );
}
