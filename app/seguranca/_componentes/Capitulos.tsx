"use client";

/* ============================================================
   MOTOBOX — Segurança: o percurso pelos capítulos
   - Marca cada capítulo com data-visto quando entra no ecrã (as
     entradas animadas vivem no CSS e só se ligam com data-anim).
   - Sabe em que capítulo se está: no computador, um trilho com
     uma paragem por capítulo, preso à esquerda; no telemóvel,
     uma barra em cima com "03/11", o nome e a lista.
   ============================================================ */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { calmo } from "./ganchos";
import s from "../seguranca.module.css";

const dois = (n: number) => String(n).padStart(2, "0");

export function Capitulos({ seccoes, rotulos, children }: {
  seccoes: { id: string; nome: string }[];
  rotulos: { nav: string; capitulos: string; capituloDe: string };
  children: ReactNode;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(-1);
  const [dentro, setDentro] = useState(false);
  const [aberto, setAberto] = useState(false);
  const total = seccoes.length;
  const ids = seccoes.map((c) => c.id).join(",");

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const capitulos = ids
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((c): c is HTMLElement => !!c);
    const marcar = (c: HTMLElement) => (c.dataset.visto = "");

    if (!("IntersectionObserver" in window)) {
      capitulos.forEach(marcar);
      return;
    }

    // Entradas: só com movimento e só para o que ainda não está no ecrã.
    let revelar: IntersectionObserver | null = null;
    if (calmo()) {
      capitulos.forEach(marcar);
    } else {
      const alto = window.innerHeight;
      capitulos.forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.top < alto && r.bottom > 0) marcar(c);
      });
      el.dataset.anim = "";
      revelar = new IntersectionObserver(
        (entradas) => {
          for (const e of entradas) {
            if (!e.isIntersecting) continue;
            marcar(e.target as HTMLElement);
            revelar?.unobserve(e.target);
          }
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      capitulos.forEach((c) => revelar?.observe(c));
    }

    // O capítulo activo é o que cruza uma faixa fina a meio do ecrã.
    const faixa = { rootMargin: "-42% 0px -56% 0px" };
    const activar = new IntersectionObserver((entradas) => {
      for (const e of entradas) if (e.isIntersecting) setActivo(capitulos.indexOf(e.target as HTMLElement));
    }, faixa);
    capitulos.forEach((c) => activar.observe(c));
    const regiao = new IntersectionObserver(([e]) => {
      setDentro(e.isIntersecting);
      if (!e.isIntersecting) setAberto(false);
    }, faixa);
    regiao.observe(el);

    return () => {
      revelar?.disconnect();
      activar.disconnect();
      regiao.disconnect();
      delete el.dataset.anim;
    };
  }, [ids]);

  // A lista do telemóvel fecha com Escape.
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto]);

  const progresso = activo < 0 ? 0 : total > 1 ? activo / (total - 1) : 1;
  const actual = activo >= 0 ? seccoes[activo] : undefined;

  return (
    <div ref={raiz} className={s.trilho}>
      {/* ---------- Computador: trilho na margem esquerda ---------- */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 lg:block">
        <nav aria-label={rotulos.nav} className={`${s.rail} pointer-events-auto`}>
          <p className={s.railContador} aria-hidden>
            <span className="text-2xl font-semibold leading-none">{activo >= 0 ? dois(activo + 1) : "00"}</span>
            <span className="text-sm text-white/80">/{dois(total)}</span>
          </p>
          <div className="relative">
          <span aria-hidden className={s.railLinha}>
            <span className={s.railFeito} style={{ "--p": progresso } as CSSProperties} />
          </span>
          <ol className={s.railLista}>
            {seccoes.map((c, i) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className={s.paragem}
                  aria-current={i === activo ? "step" : undefined}
                  data-feito={i < activo ? "" : undefined}
                >
                  <span className={s.paragemNome}>
                    <span className="mr-1.5 text-white/75">{dois(i + 1)}</span>
                    {c.nome}
                  </span>
                </a>
              </li>
            ))}
          </ol>
          </div>
        </nav>
      </div>

      {/* ---------- Telemóvel e tablet: barra em cima ---------- */}
      <div className={s.barraTopo} data-visivel={dentro && activo >= 0 ? "" : undefined}>
        <div className="flex h-14 items-center gap-3 px-4">
          <span aria-hidden className="text-lg font-semibold tabular-nums leading-none text-white">
            {dois(Math.max(activo, 0) + 1)}
            <span className="text-sm font-normal text-white/80">/{dois(total)}</span>
          </span>
          <span className="sr-only">
            {rotulos.capituloDe.replace("{n}", String(Math.max(activo, 0) + 1)).replace("{total}", String(total))}
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] text-white">{actual?.nome}</span>
          <button
            type="button"
            aria-expanded={aberto}
            aria-controls="seguranca-capitulos"
            onClick={() => setAberto((a) => !a)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[4px] bg-white/10 px-3 text-sm text-white transition-colors hover:bg-white/20"
          >
            {rotulos.capitulos}
            <ChevronDown aria-hidden className={`size-4 transition-transform ${aberto ? "rotate-180" : ""}`} />
          </button>
        </div>
        <nav id="seguranca-capitulos" aria-label={rotulos.nav} hidden={!aberto} className="max-h-[60svh] overflow-y-auto border-t border-white/10 px-2 pb-3 pt-2">
          <ol className="grid gap-0.5 sm:grid-cols-2">
            {seccoes.map((c, i) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  onClick={() => setAberto(false)}
                  aria-current={i === activo ? "step" : undefined}
                  className="flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-[15px] text-white hover:bg-white/10 aria-[current=step]:bg-mb-red"
                >
                  <span className="w-6 tabular-nums text-white/80">{dois(i + 1)}</span>
                  {c.nome}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <span aria-hidden className={s.barraProgresso} style={{ "--p": progresso } as CSSProperties} />
      </div>

      {children}
    </div>
  );
}
