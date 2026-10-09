import type { ReactNode } from "react";
import { Chip, Logotipo } from "./kit";
import { RodapeInterior } from "./RodapeInterior";

/* ============================================================
   MOTOBOX — Página interior
   Ao abrir uma secção do painel, o painel ocupa o ecrã inteiro,
   de margem a margem: sem a moldura à volta, o conteúdo respira.
   O logótipo e o quadrado de ícone da secção flutuam nos cantos
   de cima, e o botão de acção flutua em baixo (BarraAccao). No
   computador o conteúdo rola por dentro do painel; no telemóvel
   a página rola normalmente. O rodapé (direitos e ligações) edita-se
   em Gestão › Entrada e painel › Geral.
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

