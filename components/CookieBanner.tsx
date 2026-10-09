"use client";

/* ============================================================
   Banner de consentimento de cookies
   Guarda a escolha em localStorage. As categorias analítica e
   de marketing ficam desligadas até haver consentimento
   expresso, conforme a Política de Cookies.

   - Desliga-se em Gestão › Definições ("Aviso de cookies").
   - Nunca aparece dentro do painel de gestão.
   - Os textos editam-se em Gestão › Entrada e painel › Geral.
   - Ao gravar a escolha, avisa a página (EVENTO_CONSENTIMENTO):
     a medição de audiências (Analitica) só arranca depois disso.
   ============================================================ */

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { caminhoDaPagina } from "@/lib/base";
import { useTextosGerais } from "@/components/painel/TextosGerais";

const CHAVE = "motobox-cookies-v1";

/** Disparado na janela quando a escolha muda (o evento "storage" só chega aos outros separadores). */
export const EVENTO_CONSENTIMENTO = "motobox:consentimento";

export interface Consentimento {
  essenciais: true;
  analiticos: boolean;
  marketing: boolean;
  decidido: string;
}

/** Escolha feita nesta visita quando o navegador não deixa guardar (modo privado). */
let escolhaDaSessao: Consentimento | null = null;

export function lerConsentimento(): Consentimento | null {
  try {
    const g = localStorage.getItem(CHAVE);
    return g ? (JSON.parse(g) as Consentimento) : escolhaDaSessao;
  } catch {
    return escolhaDaSessao;
  }
}

/** Para quem quer saber quando a escolha muda (nesta página ou noutro separador). */
export function subscreverConsentimento(aviso: () => void): () => void {
  const noutro = (e: StorageEvent) => { if (e.key === CHAVE) aviso(); };
  window.addEventListener(EVENTO_CONSENTIMENTO, aviso);
  window.addEventListener("storage", noutro);
  return () => {
    window.removeEventListener(EVENTO_CONSENTIMENTO, aviso);
    window.removeEventListener("storage", noutro);
  };
}

export default function CookieBanner({ activo = true }: { activo?: boolean }) {
  const { cookies: t } = useTextosGerais();
  const caminho = caminhoDaPagina(usePathname());
  // Só no navegador se sabe se a pessoa já escolheu: no servidor o aviso não se desenha.
  const visivel = useSyncExternalStore(subscreverConsentimento, () => lerConsentimento() === null, () => false);
  const [detalhe, setDetalhe] = useState(false);
  const [analiticos, setAnaliticos] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const guardar = (a: boolean, m: boolean) => {
    const escolha: Consentimento = {
      essenciais: true, analiticos: a, marketing: m,
      decidido: new Date().toISOString(),
    };
    escolhaDaSessao = escolha;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(escolha));
    } catch {
      /* modo privado — a escolha vale só para esta sessão */
    }
    window.dispatchEvent(new Event(EVENTO_CONSENTIMENTO));
  };

  const noPainel = caminho === "/admin" || caminho.startsWith("/admin/");
  if (!activo || noPainel || !visivel) return null;

  return (
    <div
      role="dialog"
      aria-label={t.preferencias}
      className="fixed inset-x-[var(--gutter)] bottom-24 z-90 rounded-[6px] bg-near-black/95 shadow-2xl shadow-black/60 ring-1 ring-white/8 backdrop-blur-md lg:inset-x-auto lg:bottom-[var(--gutter)] lg:left-[var(--gutter)] lg:w-[26rem]"
    >
      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="max-w-2xl">
            <p className="text-[15px] font-semibold text-white">
              {t.titulo}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
              {t.texto}{" "}
              {t.politica && t.politicaHref && (
                <Link href={t.politicaHref} className="text-white underline underline-offset-2 hover:text-mb-red-light">
                  {t.politica}
                </Link>
              )}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDetalhe((d) => !d)}
              className="h-10 flex-auto rounded-[6px] px-3 text-sm text-white/75 transition-colors hover:bg-white/8 hover:text-white"
            >
              {t.personalizar}
            </button>
            <button
              type="button"
              onClick={() => guardar(false, false)}
              className="h-10 flex-auto rounded-[6px] bg-white/10 px-4 text-sm text-white transition-colors hover:bg-white/20"
            >
              {t.soEssenciais}
            </button>
            <button
              type="button"
              onClick={() => guardar(true, true)}
              className="h-10 flex-auto rounded-[6px] bg-mb-red px-4 text-sm text-white transition-colors hover:bg-mb-red-dark"
            >
              {t.aceitarTudo}
            </button>
          </div>
        </div>

        {detalhe && (
          <div className="mt-5 grid gap-2 border-t border-white/8 pt-5">
            <div className="rounded-[6px] bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-white">{t.essenciais}</p>
                <span className="text-[10px] uppercase tracking-widest text-ok">{t.sempreActivo}</span>
              </div>
              <p className="mt-1 text-xs text-ink-300">{t.essenciaisDesc}</p>
            </div>

            <label className="flex cursor-pointer items-start justify-between gap-2 rounded-[6px] bg-white/5 p-4 transition-colors hover:bg-white/8">
              <span>
                <span className="block text-sm text-white">{t.analiticos}</span>
                <span className="mt-1 block text-xs text-ink-300">{t.analiticosDesc}</span>
              </span>
              <input type="checkbox" checked={analiticos} onChange={(e) => setAnaliticos(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#e10600]" />
            </label>

            <label className="flex cursor-pointer items-start justify-between gap-2 rounded-[6px] bg-white/5 p-4 transition-colors hover:bg-white/8">
              <span>
                <span className="block text-sm text-white">{t.marketing}</span>
                <span className="mt-1 block text-xs text-ink-300">{t.marketingDesc}</span>
              </span>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#e10600]" />
            </label>

            <div>
              <button
                type="button"
                onClick={() => guardar(analiticos, marketing)}
                className="h-10 w-full rounded-[6px] bg-white px-5 text-sm text-black transition-colors hover:bg-white/85"
              >
                {t.guardarPrefs}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
