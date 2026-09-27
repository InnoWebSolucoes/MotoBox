"use client";

/* Faixa "Desporto › Motocross" com as secções da modalidade. Entra por cima do
   cabeçalho de /desporto/motocross e das páginas de sempre (calendário,
   resultados, classificação, pilotos, equipas), para se perceber que vivem
   dentro do Motocross. Não é fixa: as barras de filtros dessas páginas já
   ficam coladas ao menu (top-16). */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdioma } from "@/lib/i18n/contexto";
import { MODALIDADE_PRINCIPAL, SECCOES_MOTOCROSS, lerModalidade } from "@/lib/desporto";

export function SubNavDesporto({ modalidade = MODALIDADE_PRINCIPAL }: { modalidade?: string }) {
  const { t } = useIdioma();
  const pathname = usePathname();
  const m = lerModalidade(modalidade);
  // Só o Motocross tem secções próprias; as outras modalidades ficam com o caminho.
  const seccoes = modalidade === MODALIDADE_PRINCIPAL ? SECCOES_MOTOCROSS : [];
  const naModalidade = pathname === `/desporto/${modalidade}`;

  return (
    <div className="border-b border-white/6 bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-8">
        <nav aria-label={t("desporto.caminho")} className="shrink-0 pt-3 lg:pt-0">
          <ol className="flex h-8 items-center gap-2 font-ui text-[15px] lg:h-12">
            <li>
              <Link href="/desporto" className="text-ink-400 transition-colors hover:text-white">
                {t("nav.desporto")}
              </Link>
            </li>
            <li aria-hidden className="text-mb-red">›</li>
            <li>
              <Link
                href={`/desporto/${modalidade}`}
                aria-current={naModalidade ? "page" : undefined}
                className="text-white transition-colors hover:text-mb-red"
              >
                {m?.nome ?? modalidade}
              </Link>
            </li>
          </ol>
        </nav>

        {seccoes.length > 0 && (
          <nav
            aria-label={t("desporto.seccoesMotocross")}
            className="-mx-4 flex overflow-x-auto no-scrollbar px-1 sm:-mx-6 sm:px-3 lg:mx-0 lg:ml-auto lg:px-0"
          >
            {seccoes.map((s) => {
              const aceso = pathname === s.href || (s.href !== `/desporto/${modalidade}` && pathname.startsWith(s.href + "/"));
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  aria-current={aceso ? "page" : undefined}
                  className="tab h-12"
                >
                  {t(s.chave)}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
