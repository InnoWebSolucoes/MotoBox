"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useIdioma } from "@/lib/i18n/contexto";
import { Logo } from "./Brand";

/* ============================================================
   MOTOBOX — Abertura "Capacete posto?"
   Uma vez por sessão do navegador, ao entrar no site: as cinco
   luzes de partida acendem, apagam e a cortina sobe como uma
   viseira. Dura pouco mais de dois segundos e salta-se com um
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
      // 0,35 s a 1,35 s acendem; às 1,75 s apagam ("lights out") e a cortina sobe: ~2,3 s no total.
      for (let i = 1; i <= 5; i++) relogios.push(window.setTimeout(() => setAcesas(i), 100 + i * 250));
      relogios.push(window.setTimeout(() => setAcesas(0), 1750));
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("intro.rotulo")}
      onClick={sair}
      className="fixed inset-0 z-[98] flex cursor-pointer items-center justify-center overflow-hidden bg-ink-950 px-6"
      style={estiloSaida}
    >
      <div className="stripes absolute inset-0" aria-hidden />
      <div
        className="absolute left-1/2 top-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #e10600 0%, transparent 65%)" }}
        aria-hidden
      />
      {/* Linhas de velocidade do logótipo, ao fundo */}
      <div className="speed-lines absolute inset-x-0 bottom-0 h-1/3 opacity-40" aria-hidden />

      <div className="relative flex max-w-3xl flex-col items-center text-center">
        <Logo height={30} className="text-white" />

        {/* Luzes de partida: cinco colunas de duas luzes, como na grelha */}
        <div className="mt-10 flex gap-2.5 sm:gap-4" aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => {
            const acesa = calmo || n <= acesas;
            return (
              <span key={n} className="flex flex-col gap-2 rounded-full bg-ink-900 p-1.5 ring-1 ring-white/10 sm:gap-2.5 sm:p-2">
                {[0, 1].map((l) => (
                  <span
                    key={l}
                    className={`block size-6 rounded-full transition-[background-color,box-shadow] duration-150 sm:size-9 ${
                      acesa ? "bg-mb-red shadow-[0_0_22px_4px_rgb(225_6_0/0.65)]" : "bg-ink-800"
                    }`}
                  />
                ))}
              </span>
            );
          })}
        </div>

        <h2 className="title-xl mt-10 text-5xl sm:text-7xl lg:text-8xl">{t("intro.titulo")}</h2>
        <p className="mt-4 max-w-xl font-ui text-xl sm:text-2xl text-ink-200">{t("intro.sub")}</p>

        <button
          ref={botao}
          type="button"
          onClick={(e) => { e.stopPropagation(); sair(); }}
          className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-mb-red px-8 focus-visible:outline-offset-4 font-ui text-lg text-white transition-colors hover:bg-mb-red-dark"
        >
          {t("intro.entrar")}
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="mt-4 text-xs text-ink-500">{t("intro.dica")}</p>
      </div>
    </div>
  );
}
