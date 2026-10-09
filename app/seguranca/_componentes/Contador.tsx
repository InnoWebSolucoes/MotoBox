"use client";

/* Número que conta de zero até ao valor quando aparece no ecrã
   ("1 200", "74%", "−59%", "6×"). Sem JavaScript ou com movimento
   reduzido, mostra logo o valor final. */

import { useEffect, useRef } from "react";
import { calmo } from "./ganchos";
import s from "../seguranca.module.css";

type Partes = { antes: string; depois: string; alvo: number; decimais: number; sepDec: string; sepMil: string };

function partir(valor: string): Partes | null {
  const m = /^(\D*?)(\d(?:[\d\s.,]*\d)?)(.*)$/.exec(valor);
  if (!m) return null;
  const [, antes, corpo, depois] = m;
  let inteiro = corpo;
  let decimais = 0;
  let sepDec = "";
  let fraccao = "";
  const dec = /[.,](\d{1,2})$/.exec(corpo);
  // "1.200" é milhar, "2,5" é decimal.
  if (dec && !/^\d{1,3}([.,\s]\d{3})+$/.test(corpo)) {
    decimais = dec[1].length;
    fraccao = dec[1];
    sepDec = corpo[corpo.length - decimais - 1];
    inteiro = corpo.slice(0, -(decimais + 1));
  }
  const sepMil = /\d([\s.,])\d{3}/.exec(inteiro)?.[1] ?? "";
  const alvo = Number(inteiro.replace(/\D/g, "") + (decimais ? `.${fraccao}` : ""));
  return Number.isFinite(alvo) ? { antes, depois, alvo, decimais, sepDec, sepMil } : null;
}

function formatar(v: number, p: Partes): string {
  const [i, d] = v.toFixed(p.decimais).split(".");
  const inteiro = p.sepMil ? i.replace(/\B(?=(\d{3})+(?!\d))/g, p.sepMil) : i;
  return p.antes + inteiro + (d ? p.sepDec + d : "") + p.depois;
}

export function Contador({ valor, className = "" }: { valor: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const p = partir(valor);
    if (!el || !p || p.alvo === 0 || calmo() || !("IntersectionObserver" in window)) return;
    // Só conta o que ainda está por baixo do ecrã: o que já está à vista
    // (ou já ficou para trás, se a página demorou a arrancar) fica como está.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.textContent = formatar(0, p);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const inicio = performance.now();
        const duracao = 1500;
        const passo = (agora: number) => {
          const k = Math.min(1, (agora - inicio) / duracao);
          el.textContent = formatar(p.alvo * (1 - Math.pow(1 - k, 4)), p);
          if (k < 1) raf = requestAnimationFrame(passo);
        };
        raf = requestAnimationFrame(passo);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = valor;
    };
  }, [valor]);

  return (
    <>
      <span ref={ref} aria-hidden className={`${s.contador} ${className}`}>
        {valor}
      </span>
      <span className="sr-only">{valor}</span>
    </>
  );
}
