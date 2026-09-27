"use client";

import Link from "next/link";
import { ButtonLink, Icon } from "@/components/ui";
import { useIdioma } from "@/lib/i18n/contexto";

/* ============================================================
   MOTOBOX — Destaque da secção Segurança
   Faixa compacta para a página inicial (ou qualquer outra) que
   leva ao guia em /seguranca. Uso: <TeaserSeguranca />.
   O número é o da OMS (ver app/seguranca/conteudo.ts).
   ============================================================ */

const ATALHOS = [
  { id: "capacete", chave: "seguranca.capacete" },
  { id: "chuva", chave: "seguranca.chuva" },
  { id: "grupo", chave: "seguranca.grupo" },
  { id: "acidente", chave: "seguranca.acidente" },
] as const;

export function TeaserSeguranca({ className = "" }: { className?: string }) {
  const { t } = useIdioma();

  return (
    <section aria-labelledby="teaser-seguranca" className={`relative isolate overflow-hidden bg-ink-900 ${className}`}>
      <div className="stripes absolute inset-0 -z-10" aria-hidden />
      <div
        className="absolute -left-32 -bottom-40 -z-10 size-[28rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #e10600 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 py-14 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow text-mb-red">{t("seguranca.eyebrow")}</p>
          <h2 id="teaser-seguranca" className="title-xl mt-2 text-3xl sm:text-5xl">
            {t("seguranca.titulo")}
          </h2>
          <p className="mt-4 max-w-xl text-sm sm:text-base text-ink-300 leading-relaxed">{t("seguranca.texto")}</p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4">
            <ButtonLink href="/seguranca">
              <Icon name="shield" className="size-4" />
              {t("seguranca.cta")}
            </ButtonLink>
            <nav aria-label={t("seguranca.atalhos")} className="flex flex-wrap gap-2">
              {ATALHOS.map((a) => (
                <Link key={a.id} href={`/seguranca#${a.id}`} className="chip h-8 px-3.5 text-sm">
                  {t(a.chave)}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
          <p className="font-display text-7xl sm:text-8xl leading-none text-white tabular-nums">
            {"6×"}
          </p>
          <p className="mt-3 max-w-xs text-sm text-ink-200 leading-snug">{t("seguranca.numeroDesc")}</p>
          <p className="mt-2 text-[11px] uppercase tracking-widest text-ink-500">{t("seguranca.fonte")}</p>
        </div>
      </div>
    </section>
  );
}
