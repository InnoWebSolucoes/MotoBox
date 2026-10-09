"use client";

/* ============================================================
   MOTOBOX — Segurança: antes de sair (T-CLOCS)
   Uma lista para marcar, com um anel que enche à medida que se
   verifica. As marcas ficam neste aparelho até ao fim do dia
   (localStorage; se não houver, ficam só enquanto a página
   estiver aberta).
   ============================================================ */

import { useSyncExternalStore } from "react";
import { Check, RotateCcw } from "lucide-react";
import { preencher } from "./comum";
import s from "../seguranca.module.css";

/* ---------------- Memória das marcas ---------------- */

const CHAVE = "motobox.seguranca.antes-de-sair";
const VAZIO: number[] = [];
const ouvintes = new Set<() => void>();
let marcas: number[] = VAZIO;
let lido = false;

const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

function ler(): number[] {
  if (!lido) {
    lido = true;
    try {
      const e = JSON.parse(window.localStorage.getItem(CHAVE) ?? "null") as { dia?: string; marcas?: unknown } | null;
      if (e && e.dia === hoje() && Array.isArray(e.marcas)) {
        marcas = e.marcas.filter((n): n is number => Number.isInteger(n));
      }
    } catch {
      // Sem acesso ao armazenamento: as marcas vivem só em memória.
    }
  }
  return marcas;
}

function gravar(novas: number[]) {
  marcas = novas;
  try {
    if (novas.length) window.localStorage.setItem(CHAVE, JSON.stringify({ dia: hoje(), marcas: novas }));
    else window.localStorage.removeItem(CHAVE);
  } catch {
    // Idem: continua a funcionar sem guardar.
  }
  ouvintes.forEach((f) => f());
}

function subscrever(f: () => void) {
  ouvintes.add(f);
  const outraJanela = (e: StorageEvent) => {
    if (e.key !== CHAVE) return;
    lido = false;
    f();
  };
  window.addEventListener("storage", outraJanela);
  return () => {
    ouvintes.delete(f);
    window.removeEventListener("storage", outraJanela);
  };
}

/* ---------------- Lista ---------------- */

export function Verificacao({ itens, rotulos }: {
  itens: { letra: string; nome: string; texto: string }[];
  rotulos: { progresso: string; falta: string; pronto: string; prontoTexto: string; recomecar: string; memoria: string };
}) {
  const feitas = useSyncExternalStore(subscrever, ler, () => VAZIO);
  const total = itens.length;
  const marcadas = feitas.filter((i) => i < total);
  const n = marcadas.length;
  const tudo = total > 0 && n === total;
  const raio = 52;
  const volta = 2 * Math.PI * raio;

  const alternar = (i: number) =>
    gravar(marcadas.includes(i) ? marcadas.filter((x) => x !== i) : [...marcadas, i].sort((a, b) => a - b));

  return (
    <div className="grid gap-[var(--intervalo)] lg:grid-cols-[minmax(0,19rem)_1fr]">
      {/* Anel e estado */}
      <div className="painel painel-escuro flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left lg:sticky lg:top-6 lg:flex-col lg:self-start lg:p-8 lg:text-center">
        <div className="relative size-36 shrink-0">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={raio} fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth="9" />
            <circle
              cx="60"
              cy="60"
              r={raio}
              fill="none"
              stroke={tudo ? "#22c55e" : "#e10600"}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={volta}
              strokeDashoffset={volta * (1 - (total ? n / total : 0))}
              className={s.anel}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center">
            {tudo ? (
              <Check aria-hidden className="size-14 text-white" strokeWidth={2.5} />
            ) : (
              <span className="text-3xl font-semibold tabular-nums text-white">
                {n}
                <span className="text-lg font-normal text-white/80">/{total}</span>
              </span>
            )}
          </span>
        </div>
        <div aria-live="polite" className="min-w-0">
          {tudo ? (
            <div className={s.pronto}>
              <p className="titulo-4">{rotulos.pronto}</p>
              <p className="mt-2 text-[15px] text-white/90">{rotulos.prontoTexto}</p>
            </div>
          ) : (
            <>
              <p className="text-lg font-semibold text-white">{preencher(rotulos.progresso, { feitos: n, total })}</p>
              <p className="mt-1 text-sm text-white/85">{rotulos.falta}</p>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-3 sm:items-start lg:items-center">
          {n > 0 && (
            <button
              type="button"
              onClick={() => gravar([])}
              className="inline-flex h-10 items-center gap-2 rounded-[var(--raio)] bg-white/10 px-4 text-sm text-white transition-colors hover:bg-white/20"
            >
              <RotateCcw aria-hidden className="size-4" />
              {rotulos.recomecar}
            </button>
          )}
          <p className="max-w-[30ch] text-xs leading-relaxed text-white/80">{rotulos.memoria}</p>
        </div>
      </div>

      {/* Os pontos a verificar */}
      <ol className="grid gap-[var(--intervalo)] md:grid-cols-2">
        {itens.map((item, i) => {
          const feito = marcadas.includes(i);
          return (
            <li key={i}>
              <label
                className={`${s.verificacao} painel painel-escuro flex h-full cursor-pointer gap-4 p-5 md:p-6`}
                data-feito={feito ? "" : undefined}
              >
                <input type="checkbox" className="sr-only" checked={feito} onChange={() => alternar(i)} />
                <span className="flex flex-col items-center gap-3">
                  <span
                    aria-hidden
                    className={`grid size-12 place-items-center rounded-[4px] text-2xl font-semibold transition-colors ${
                      feito ? "bg-mb-red text-white" : "bg-white/10 text-mb-red-light"
                    }`}
                  >
                    {item.letra}
                  </span>
                  <span
                    aria-hidden
                    className={`grid size-7 place-items-center rounded-full border-2 transition-colors ${
                      feito ? "border-white bg-white" : "border-white/60"
                    }`}
                  >
                    <svg viewBox="0 0 20 20" className="size-4">
                      <path d="M4 10.5 L8.5 15 L16 6" fill="none" stroke="#e10600" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={s.visto} />
                    </svg>
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-semibold leading-snug text-white">{item.nome}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-white/90">{item.texto}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ol>

      {/* No telemóvel o anel fica lá em cima: repete-se o estado no fim da lista. */}
      <p
        aria-hidden
        className={`flex items-center gap-3 rounded-[var(--raio)] p-4 text-[15px] lg:hidden ${tudo ? "bg-[#16a34a]/25 text-white" : "bg-black/25 text-white"}`}
      >
        <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums ${tudo ? "bg-[#22c55e] text-[#0b2a16]" : "bg-white/10"}`}>
          {tudo ? <Check className="size-5" strokeWidth={3} /> : `${n}/${total}`}
        </span>
        <span className="font-semibold">{tudo ? rotulos.pronto : preencher(rotulos.progresso, { feitos: n, total })}</span>
      </p>
    </div>
  );
}
