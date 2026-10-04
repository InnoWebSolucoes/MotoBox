"use client";

/* Faixa de navegação dentro de Desporto, por baixo do menu.

   Sem `modalidade`: o nível de Desporto. Mostra "Desporto › Secção" e as
   secções do Campeonato Nacional (visão geral, calendário, resultados,
   classificação, pilotos, equipas), que juntam todas as modalidades. Entra na
   página Desporto e nas páginas de sempre do campeonato.

   Com `modalidade`: "Desporto › Modalidade" e as secções dessa modalidade (as
   do Motocross por omissão; o Enduro e o Rally-Raid ganham a visão geral e o
   seu arquivo quando têm resultados).

   Não é fixa: as barras de filtros dessas páginas já ficam coladas ao menu (top-16). */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdioma } from "@/lib/i18n/contexto";
import { MODALIDADE_PRINCIPAL, SECCOES_DESPORTO, SECCOES_MOTOCROSS, lerModalidade } from "@/lib/desporto";

export function SubNavDesporto({
  modalidade,
  seccoes: proprias,
}: {
  /** Sem ela, a faixa é a de Desporto (campeonato). */
  modalidade?: string;
  /** Secções da modalidade (ver `seccoesDaModalidade`). Por omissão, as do Motocross na principal e nenhuma nas outras. */
  seccoes?: { href: string; chave: string }[];
}) {
  const { t } = useIdioma();
  const pathname = usePathname();

  const m = modalidade ? lerModalidade(modalidade) : undefined;
  const raiz = modalidade ? `/desporto/${modalidade}` : "/desporto";
  const seccoes = !modalidade
    ? SECCOES_DESPORTO
    : (proprias ?? (modalidade === MODALIDADE_PRINCIPAL ? SECCOES_MOTOCROSS : []));

  // A secção acesa: a própria página, ou uma página dentro dela (/pilotos/x acende Pilotos).
  const acesa = (href: string) => pathname === href || (href !== raiz && pathname.startsWith(href + "/"));
  // No nível de Desporto, o segundo elo do caminho é a secção onde se está.
  const seccaoActual = !modalidade ? SECCOES_DESPORTO.find((s) => s.href !== raiz && acesa(s.href)) : undefined;
  const segundo = m
    ? { href: raiz, nome: m.nome }
    : seccaoActual && { href: seccaoActual.href, nome: t(seccaoActual.chave) };

  return (
    <div className="border-b border-white/6 bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-8">
        <nav aria-label={t("desporto.caminho")} className="shrink-0 pt-3 lg:pt-0">
          <ol className="flex h-8 items-center gap-2 font-ui text-[15px] lg:h-12">
            <li>
              <Link
                href="/desporto"
                aria-current={pathname === "/desporto" ? "page" : undefined}
                className={`transition-colors hover:text-white ${segundo ? "text-ink-400" : "text-white"}`}
              >
                {t("nav.desporto")}
              </Link>
            </li>
            {segundo && (
              <>
                <li aria-hidden className="text-mb-red">›</li>
                <li>
                  <Link
                    href={segundo.href}
                    aria-current={pathname === segundo.href ? "page" : undefined}
                    className="text-white transition-colors hover:text-mb-red"
                  >
                    {segundo.nome}
                  </Link>
                </li>
              </>
            )}
          </ol>
        </nav>

        {seccoes.length > 0 && (
          <nav
            aria-label={modalidade ? (modalidade === MODALIDADE_PRINCIPAL ? t("desporto.seccoesMotocross") : m?.nome) : t("nav.desporto")}
            className="-mx-4 flex overflow-x-auto no-scrollbar px-1 sm:-mx-6 sm:px-3 lg:mx-0 lg:ml-auto lg:px-0"
          >
            {seccoes.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                aria-current={acesa(s.href) ? "page" : undefined}
                className="tab h-12"
              >
                {t(s.chave)}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
