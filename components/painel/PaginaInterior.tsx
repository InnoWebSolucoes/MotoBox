import Link from "next/link";
import type { ReactNode } from "react";
import { Chip, Logotipo } from "./kit";

/* ============================================================
   MOTOBOX — Página interior
   Ao abrir uma secção do painel, o painel ocupa o ecrã inteiro,
   de margem a margem: sem a moldura à volta, o conteúdo respira.
   O logótipo e o quadrado de ícone da secção flutuam nos cantos
   de cima, e o botão de acção flutua em baixo (BarraAccao). No
   computador o conteúdo rola por dentro do painel; no telemóvel
   a página rola normalmente.
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
    // `isolation-auto`: sem contexto de empilhamento próprio, para as janelas
    // abertas lá dentro poderem ficar por cima do botão flutuante.
    <article className="painel revelar-ecra relative min-h-svh rounded-none isolation-auto lg:h-dvh lg:min-h-0">
      <Logotipo flutuante />
      <span className="absolute right-4 top-4 z-30 md:right-5 md:top-5">
        <Chip>{icone}</Chip>
      </span>
      <div className="rolagem">
        {children}
        {rodape && <RodapeInterior />}
      </div>
    </article>
  );
}

/** Linha final de cada página: direitos, páginas legais e Instagram. */
function RodapeInterior() {
  return (
    <footer className="coluna mt-6 flex flex-col gap-4 border-t border-white/10 pb-24 pt-8 text-[0.8125rem] text-white/50 sm:flex-row sm:items-center sm:justify-between lg:pb-32">
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
