"use client";

/* ============================================================
   MOTOBOX — Segurança: histórias em carrossel
   Rola de lado com o dedo (encaixa em cada história) ou com os
   botões; os traços em baixo mostram em que história se está.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calmo } from "./ganchos";

export function Historias({ lista, rotulos }: {
  lista: { titulo: string; texto: string; licao: string }[];
  rotulos: { titulo: string; licao: string; anterior: string; seguinte: string };
}) {
  const fita = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const [fim, setFim] = useState(false);
  const total = lista.length;

  // Em que história se está: mede-se ao rolar (uma vez por fotograma).
  useEffect(() => {
    const el = fita.current;
    if (!el) return;
    let raf = 0;
    const medir = () => {
      raf = 0;
      const primeiro = el.children[0] as HTMLElement | undefined;
      if (!primeiro) return;
      const passo = primeiro.offsetWidth + 5;
      const noFim = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      setFim(noFim);
      setActual(noFim ? total - 1 : Math.min(total - 1, Math.round(el.scrollLeft / passo)));
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };
    el.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    pedir();
    return () => {
      el.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      cancelAnimationFrame(raf);
    };
  }, [total]);

  const ir = (i: number) => {
    const el = fita.current;
    const alvo = el?.children[Math.max(0, Math.min(total - 1, i))] as HTMLElement | undefined;
    if (!el || !alvo) return;
    el.scrollTo({ left: alvo.offsetLeft - el.offsetLeft, behavior: calmo() ? "auto" : "smooth" });
  };

  return (
    <div role="region" aria-roledescription="carrossel" aria-label={rotulos.titulo}>
      <div
        ref={fita}
        tabIndex={0}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-[var(--intervalo)] overflow-x-auto scroll-smooth px-1 pb-1 motion-reduce:scroll-auto"
      >
        {lista.map((h, i) => (
          <article
            key={i}
            role="group"
            aria-roledescription="história"
            aria-label={`${i + 1} / ${total}`}
            className="painel painel-escuro flex w-[86%] shrink-0 snap-start flex-col p-6 md:w-[62%] md:p-8 xl:w-[46%]"
          >
            <p aria-hidden className="text-sm tabular-nums text-white/80">
              {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
            <h3 className="titulo-3 mt-6 text-balance">{h.titulo}</h3>
            <p className="mt-5 text-[15px] leading-relaxed text-white/90 md:text-base">{h.texto}</p>
            <p className="mt-auto pt-8">
              <span className="block rounded-[4px] border-l-4 border-mb-red bg-black/25 py-3 pl-4 pr-3 text-[15px] leading-snug text-white">
                <span className="font-semibold text-[#ff8a80]">{rotulos.licao}:</span> {h.licao}
              </span>
            </p>
          </article>
        ))}
      </div>

      {total > 1 && (
        <div className="mt-4 flex items-center gap-4">
          <div className="flex gap-[var(--intervalo)]">
            <button
              type="button"
              onClick={() => ir(actual - 1)}
              disabled={actual === 0}
              aria-label={rotulos.anterior}
              className="grid size-11 place-items-center rounded-[var(--raio)] bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => ir(actual + 1)}
              disabled={fim}
              aria-label={rotulos.seguinte}
              className="grid size-11 place-items-center rounded-[var(--raio)] bg-mb-red text-white transition-colors hover:bg-mb-red-dark disabled:opacity-40"
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
          </div>
          <div aria-hidden className="flex flex-1 gap-1.5">
            {lista.map((_, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                onClick={() => ir(i)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i === actual ? "bg-mb-red" : "bg-white/25 hover:bg-white/45"}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
