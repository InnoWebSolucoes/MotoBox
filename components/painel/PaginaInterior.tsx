import Link from "next/link";
import type { ReactNode } from "react";
import { Chip, Logotipo, Moldura } from "./kit";

/* ============================================================
   MOTOBOX — Página interior
   Um só painel grande, com o corte do logótipo no canto e o
   quadrado de ícone da secção no canto oposto. No computador o
   conteúdo rola por dentro do painel, que fica preso ao ecrã;
   no telemóvel a página rola normalmente.
   ============================================================ */

export function PaginaInterior({
  icone,
  children,
  rodape = true,
}: {
  icone: ReactNode;
  children: ReactNode;
  rodape?: boolean;
}) {
  return (
    <Moldura>
      <Logotipo />
      <article className="painel recorte revelar min-h-[calc(100svh-var(--gutter)-7rem)] lg:h-full lg:min-h-0">
        <span className="absolute right-4 top-4 z-20 md:right-5 md:top-5">
          <Chip>{icone}</Chip>
        </span>
        <div className="rolagem">
          {children}
          {rodape && <RodapeInterior />}
        </div>
      </article>
    </Moldura>
  );
}

/** Linha final de cada página: direitos, páginas legais e Instagram. */
function RodapeInterior() {
  return (
    <footer className="coluna mt-6 flex flex-col gap-4 border-t border-white/10 pb-24 pt-8 text-[0.8125rem] text-white/50 sm:flex-row sm:items-center sm:justify-between lg:pb-28">
      <p>© {new Date().getFullYear()} MotoBox Angola. Um projecto sem fins lucrativos, feito por motards.</p>
      <nav aria-label="Ligações legais" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/sobre" className="hover:text-white">Sobre</Link>
        <Link href="/contacto" className="hover:text-white">Contacto</Link>
        <Link href="/termos" className="hover:text-white">Termos</Link>
        <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
        <Link href="/cookies" className="hover:text-white">Cookies</Link>
        <a href="https://www.instagram.com/motobox_angola" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          Instagram
        </a>
      </nav>
    </footer>
  );
}
