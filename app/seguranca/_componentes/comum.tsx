/* ============================================================
   MOTOBOX — Segurança: peças comuns (servidor e cliente)
   ============================================================ */

/** Troca {chave} pelos valores ("{n} de {total}" → "2 de 6"). */
export function preencher(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (todo, k: string) => (k in valores ? String(valores[k]) : todo));
}

/** Números de fontes como ligações "[4]" para a lista no fim da página. Ignora números que já não existem. */
export function Refs({ fontes, total, rotulo, className = "" }: {
  fontes?: number[];
  /** Quantas fontes há na lista. */
  total: number;
  /** "Fonte {n}", lido em voz alta. */
  rotulo: string;
  className?: string;
}) {
  const validas = (Array.isArray(fontes) ? fontes : []).filter((n) => Number.isInteger(n) && n >= 1 && n <= total);
  if (!validas.length) return null;
  return (
    <span className={`whitespace-nowrap ${className}`}>
      {validas.map((n) => (
        <a
          key={n}
          href={`#fonte-${n}`}
          aria-label={preencher(rotulo, { n })}
          className="ml-1 rounded-[3px] px-0.5 text-[0.8em] font-medium text-[#ff8a80] underline decoration-[#ff8a80]/50 underline-offset-2 hover:text-white"
        >
          [{n}]
        </a>
      ))}
    </span>
  );
}
