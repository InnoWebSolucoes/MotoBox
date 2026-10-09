"use client";

/* ============================================================
   MOTOBOX — Área de membro: peças comuns
   Os textos (documento "site.conta", por contexto), a janela,
   os campos e os pequenos blocos que os separadores partilham.
   ============================================================ */

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui";
import { Seta } from "@/components/painel/kit";
import { CONTA_PADRAO, preencherModelo, type ConteudoConta } from "@/lib/conteudo/grupos/contas";

/* ---------------- Textos ---------------- */

const Ctx = createContext<ConteudoConta>(CONTA_PADRAO);

export function TextosConta({ textos, children }: { textos: ConteudoConta; children: ReactNode }) {
  return <Ctx.Provider value={textos}>{children}</Ctx.Provider>;
}

export const useTextosConta = () => useContext(Ctx);

/** Troca {chave} pelos valores (números já formatados à portuguesa). */
export function f(texto: string, valores: Record<string, string | number | undefined>): string {
  const formatados: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(valores)) {
    formatados[k] = typeof v === "number" ? v.toLocaleString("pt-PT") : v;
  }
  return preencherModelo(texto, formatados);
}

/* ---------------- Relógio ---------------- */

const subscreverRelogio = (aviso: () => void) => {
  const id = window.setInterval(aviso, 1000);
  return () => window.clearInterval(id);
};
const segundoActual = () => Math.floor(Date.now() / 1000);

/**
 * Hora actual em segundos, a andar a cada segundo. No servidor (e no
 * primeiro desenho) vale 0: quem a usa mostra um traço até o navegador chegar.
 */
export function useAgora(): number {
  return useSyncExternalStore(subscreverRelogio, segundoActual, () => 0);
}

const subscreverMinuto = (aviso: () => void) => {
  const id = window.setInterval(aviso, 30_000);
  return () => window.clearInterval(id);
};
const minutoActual = () => Math.floor(Date.now() / 60_000) * 60_000;

/** Hora actual em milissegundos, ao minuto (0 no servidor). Para contas de dias. */
export function useAgoraMinuto(): number {
  return useSyncExternalStore(subscreverMinuto, minutoActual, () => 0);
}

/* ---------------- Datas ---------------- */

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** "Março de 2025". */
export function mesAno(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "18 de Outubro". */
export function diaMesLongo(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  return m && d ? `${d} de ${MESES[m - 1]}` : "";
}

/* ---------------- Avatar ---------------- */

export function iniciais(n: string) {
  return n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/** Círculo da conta: o logótipo por cima da cor escolhida, ou as iniciais sobre ela. */
export function AvatarConta({ url, cor, nome, className = "" }: {
  url: string | null; cor: string; nome: string; className?: string;
}) {
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white ${className}`}
      style={{ backgroundColor: cor }}>
      {url ? (
        <Image src={url} alt="" fill sizes="128px" unoptimized={url.startsWith("blob:")} className="object-cover" />
      ) : (
        iniciais(nome)
      )}
    </span>
  );
}

/* ---------------- Janela ---------------- */

export function Janela({ titulo, aoFechar, children, larga = false }: {
  titulo: string; aoFechar: () => void; children: ReactNode; larga?: boolean;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = antes; };
  }, [aoFechar]);
  // No <body>: o painel da página isola o empilhamento e a janela ficava por baixo do botão.
  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={aoFechar} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={titulo}
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-ink-900 p-6 shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:rounded-[var(--raio)] ${larga ? "max-w-2xl" : "max-w-xl"}`}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-white">{titulo}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar"
            className="-mr-2 grid size-10 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            <Icon name="close" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Formulários ---------------- */

export const campo =
  "h-11 w-full bg-ink-950 px-3.5 text-[15px] text-white ring-1 ring-inset ring-white/15 placeholder:text-white/55 outline-none transition-shadow focus:ring-2 focus:ring-mb-red";

export function Rotulo({ texto, ajuda, children }: { texto: string; ajuda?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-white/85">{texto}</span>
      {children}
      {ajuda && <span className="mt-1.5 block text-xs text-white/80">{ajuda}</span>}
    </label>
  );
}

export type EstadoGravacao = "parado" | "a-guardar" | "guardado" | "erro";

export function EstadoGuardar({ estado, parado }: { estado: EstadoGravacao; parado: string }) {
  if (estado === "parado") return <span className="text-sm text-white/70">{parado}</span>;
  const tom = estado === "erro" ? "text-mb-red-light" : estado === "guardado" ? "text-[#4ade80]" : "text-white/80";
  const texto = estado === "erro" ? "Não foi possível guardar. Tente de novo." : estado === "guardado" ? "Guardado" : "A guardar…";
  return <span role="status" className={`text-sm ${tom}`}>{texto}</span>;
}

/* ---------------- Blocos ---------------- */

/** Título de bloco: o pequeno título espaçado e, à direita, uma ligação ou um botão. */
export function TituloBloco({ titulo, texto, accao, className = "" }: {
  titulo: ReactNode; texto?: ReactNode; accao?: ReactNode; className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-2 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-tight text-white">{titulo}</h2>
        {texto && <p className="mt-1 text-sm leading-relaxed text-white/75">{texto}</p>}
      </div>
      {accao}
    </div>
  );
}

/** Ligação com seta, à direita dos títulos de bloco. */
export function LigacaoSeta({ href, children, onClick }: { href?: string; children: ReactNode; onClick?: () => void }) {
  const corpo = (
    <>
      <span className="sublinhado">{children}</span>
      <Seta className="size-3" />
    </>
  );
  const classes = "group inline-flex shrink-0 items-center gap-2 text-sm text-white";
  return href ? (
    <Link href={href} className={classes}>{corpo}</Link>
  ) : (
    <button type="button" onClick={onClick} className={classes}>{corpo}</button>
  );
}

/** Estado vazio com um próximo passo claro. */
export function Vazio({ icone, titulo, texto, children, className = "" }: {
  icone: ReactNode; titulo: string; texto: string; children?: ReactNode; className?: string;
}) {
  return (
    <div className={`painel painel-escuro flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:p-7 ${className}`}>
      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-[var(--raio)] bg-white/10 text-white [&_svg]:size-6">
        {icone}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-white">{titulo}</p>
        <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-white/80">{texto}</p>
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  );
}
