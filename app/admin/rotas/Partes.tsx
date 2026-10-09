"use client";

/* Separadores das partes de uma rota (ou da página Rotas): as mesmas pílulas
   do site, mas a passar para a linha seguinte em ecrãs largos, para se verem
   todas de uma vez; no telemóvel, deslizam de lado. */

export function AbasPartes<K extends string>({
  abas, activa, onChange, rotulo,
}: {
  abas: { chave: K; nome: string; contador?: number }[];
  activa: K;
  onChange: (k: K) => void;
  rotulo: string;
}) {
  return (
    <div
      role="tablist" aria-label={rotulo}
      className="no-scrollbar -mx-1 flex max-w-full gap-[var(--intervalo)] overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible"
    >
      {abas.map((a) => (
        <button
          key={a.chave} type="button" role="tab" aria-selected={activa === a.chave}
          onClick={() => onChange(a.chave)}
          className="pilula shrink-0 aria-selected:bg-mb-red aria-selected:text-white"
        >
          {a.nome}
          {a.contador !== undefined && <span className="tabular-nums text-white/80">{a.contador}</span>}
        </button>
      ))}
    </div>
  );
}
