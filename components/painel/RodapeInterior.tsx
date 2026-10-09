"use client";

import Link from "next/link";
import { preencher } from "@/lib/conteudo/grupos/geral";
import { eExterno, useTextosGerais } from "./TextosGerais";

/**
 * Linha final de cada página interior: direitos, páginas legais e redes.
 * Os textos e as ligações editam-se em Gestão › Entrada e painel › Geral.
 */
export function RodapeInterior() {
  const { rodape } = useTextosGerais();
  const ligacoes = rodape.ligacoes.filter((l) => l?.texto && l?.href);
  return (
    <footer className="coluna mt-6 flex flex-col gap-4 border-t border-white/10 pb-24 pt-8 text-[0.8125rem] text-white/50 sm:flex-row sm:items-center sm:justify-between lg:pb-32">
      <p>{preencher(rodape.direitos, { ano: new Date().getFullYear() })}</p>
      {ligacoes.length > 0 && (
        <nav aria-label={rodape.rotulo} className="flex flex-wrap gap-x-5 gap-y-2">
          {ligacoes.map((l, i) =>
            eExterno(l.href) ? (
              <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {l.texto}
              </a>
            ) : (
              <Link key={i} href={l.href} className="hover:text-white">
                {l.texto}
              </Link>
            ),
          )}
        </nav>
      )}
    </footer>
  );
}
