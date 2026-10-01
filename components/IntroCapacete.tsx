"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useIdioma } from "@/lib/i18n/contexto";
import { comBase } from "@/lib/base";

/* ============================================================
   MOTOBOX — Abertura "Capacete posto?"
   Uma vez por sessão do navegador, ao entrar no site: o MB, uma
   linha vermelha que enche como um conta-rotações e a cortina
   sobe como uma viseira. Dura pouco mais de dois segundos e salta-se com um
   clique, com Esc ou com o botão.

   O servidor nunca a desenha: a página está sempre por baixo,
   inteira, para quem a lê sem JavaScript (motores de pesquisa).
   Fica por cima do banner de cookies e da janela de sessão, e
   não aparece no painel de gestão.
   ============================================================ */

/** "1" = já foi mostrada nesta sessão. Os testes no Playwright usam-na para a saltar. */
const CHAVE = "motobox-capacete-v1";
const ROBOS = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|lighthouse|headless/i;

const semSubscricao = () => () => {};

export function IntroCapacete() {
  // Só no navegador: no servidor e na hidratação não há abertura nenhuma.
  const noNavegador = useSyncExternalStore(semSubscricao, () => true, () => false);
  return noNavegador ? <Abertura /> : null;
}

function deveMostrar(caminho: string): boolean {
  if (caminho === "/admin" || caminho.startsWith("/admin/")) return false;
  if (ROBOS.test(navigator.userAgent)) return false;
  try {
    return sessionStorage.getItem(CHAVE) !== "1";
  } catch {
    // Sem sessionStorage não há como lembrar: melhor não a mostrar em cada página.
    return false;
  }
}

type Fase = "luzes" | "saida" | "fim";

function Abertura() {
  const caminho = usePathname();
  const { t } = useIdioma();
  const [mostrar] = useState(() => deveMostrar(caminho));
  const [calmo] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [acesas, setAcesas] = useState(0);
  const [fase, setFase] = useState<Fase>(mostrar ? "luzes" : "fim");
  const botao = useRef<HTMLButtonElement>(null);
  const saidaMs = calmo ? 250 : 500;

  // Marca como vista logo à entrada: um recarregamento a meio já não a repete.
  useEffect(() => {
    if (!mostrar) return;
    try { sessionStorage.setItem(CHAVE, "1"); } catch { /* indisponível */ }
    botao.current?.focus({ preventScroll: true });
  }, [mostrar]);

  const sair = useCallback(() => setFase((f) => (f === "luzes" ? "saida" : f)), []);

  // Sequência: cinco luzes, uma a uma; apagam todas; a cortina sobe.
  useEffect(() => {
    if (fase !== "luzes") return;
    const relogios: number[] = [];
    if (calmo) {
      relogios.push(window.setTimeout(sair, 1500));
    } else {
      // A linha enche entre 0,35 s e 1,35 s; a cortina sobe às 1,85 s: ~2,3 s no total.
      for (let i = 1; i <= 5; i++) relogios.push(window.setTimeout(() => setAcesas(i), 100 + i * 250));
      relogios.push(window.setTimeout(sair, 1850));
    }
    return () => relogios.forEach(clearTimeout);
  }, [fase, calmo, sair]);

  useEffect(() => {
    if (fase !== "saida") return;
    const r = window.setTimeout(() => setFase("fim"), saidaMs);
    return () => clearTimeout(r);
  }, [fase, saidaMs]);

  useEffect(() => {
    if (fase !== "luzes") return;
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") sair(); };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [fase, sair]);

  if (fase === "fim") return null;

  const aSair = fase === "saida";
  // Com movimento reduzido só há um esbatido; sem ele, a cortina sobe como uma viseira.
  const estiloSaida = calmo
    ? { opacity: aSair ? 0 : 1, transition: `opacity ${saidaMs}ms ease` }
    : {
        transform: aSair ? "translateY(-100%)" : "none",
        transition: `transform ${saidaMs}ms cubic-bezier(0.7, 0, 0.84, 0)`,
      };

  // A linha vermelha enche como um conta-rotações, ao ritmo das cinco fases.
  const progresso = calmo ? 100 : aSair ? 100 : Math.min(100, acesas * 20);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("intro.rotulo")}
      onClick={sair}
      className="fixed inset-0 z-[98] flex cursor-pointer items-center justify-center overflow-hidden bg-black px-6"
      style={estiloSaida}
    >
      <div className="relative flex w-full max-w-xl flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={comBase("/marca/mb-marca-480.png")} alt="" className="w-24" />

        <div className="mt-10 h-[3px] w-full max-w-xs overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div
            className="h-full bg-mb-red transition-[width] duration-200 ease-out"
            style={{ width: `${progresso}%` }}
          />
        </div>

        <h2 className="titulo-1 mt-10">{t("intro.titulo")}</h2>
        <p className="texto-lead mt-4 max-w-md text-white/80">{t("intro.sub")}</p>

        <button
          ref={botao}
          type="button"
          onClick={(e) => { e.stopPropagation(); sair(); }}
          className="mt-9 inline-flex h-[50px] w-[13rem] items-center justify-between rounded-[6px] bg-mb-red px-5 text-[15px] text-white transition-colors hover:bg-mb-red-dark focus-visible:outline-offset-4"
        >
          {t("intro.entrar")}
          <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden="true">
            <path fill="currentColor" d="M0 11.6 9.6 2H1V0h12v12h-2V3.4L1.4 13z" />
          </svg>
        </button>
        <p className="mt-4 text-xs text-white/45">{t("intro.dica")}</p>
      </div>
    </div>
  );
}
