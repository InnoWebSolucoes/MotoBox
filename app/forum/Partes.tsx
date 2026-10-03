import { Icon } from "@/components/ui";

/* ============================================================
   MOTOBOX — Peças das páginas do fórum
   As regras (na lista do fórum e ao abrir um tópico) e o aviso
   de fórum ou tópico fechado. Cada pedaço de texto fica no seu
   nó, para o `TraduzirPagina` o encontrar em `interface-en.ts`.
   ============================================================ */

const REGRAS = [
  "Respeito em primeiro lugar. Sem insultos.",
  "Sem publicidade não autorizada.",
  "Vendas só no Marketplace.",
  "Pesquise antes de abrir um tópico novo.",
  "Sem conteúdo fora do tema motard.",
];

export function RegrasForum() {
  return (
    <section>
      <h2 className="eyebrow text-ink-400">Regras do fórum</h2>
      <ol className="mt-3">
        {REGRAS.map((r, i) => (
          <li
            key={r}
            className="flex gap-3 border-b border-white/6 py-3.5 text-[15px] leading-relaxed text-ink-300 last:border-0"
          >
            <span className="w-4 shrink-0 font-display text-ink-500 tabular-nums">{i + 1}</span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Em vez da caixa de escrever, quando o fórum ou o tópico não aceitam mensagens. */
export function Fechado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-800 text-ink-400">
        <Icon name="lock" className="size-4.5" />
      </span>
      <div>
        <p className="font-display text-lg uppercase text-white">{titulo}</p>
        <p className="mt-1 text-[15px] text-ink-400">{texto}</p>
      </div>
    </div>
  );
}
