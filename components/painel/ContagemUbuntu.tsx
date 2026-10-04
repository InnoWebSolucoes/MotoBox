"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/* Contagem decrescente do painel (dias, horas, minutos, segundos), em quatro
   fichas à largura do painel. Os números crescem com a largura do painel
   (unidades cqw), para se verem bem de longe; num ecrã baixo encolhem um
   pouco para o painel caber. Antes de montar mostra "--", para o servidor
   e o cliente coincidirem. */

function falta(alvo: number) {
  const ms = Math.max(0, alvo - Date.now());
  return [
    { v: Math.floor(ms / 86400000), l: "dias" },
    { v: Math.floor((ms / 3600000) % 24), l: "horas" },
    { v: Math.floor((ms / 60000) % 60), l: "min" },
    { v: Math.floor((ms / 1000) % 60), l: "seg" },
  ];
}

const semSubscricao = () => () => {};

export function ContagemUbuntu({ data }: { data: string }) {
  const alvo = new Date(data).getTime();
  const [unidades, setUnidades] = useState(() => falta(alvo));
  const montado = useSyncExternalStore(semSubscricao, () => true, () => false);

  useEffect(() => {
    const id = setInterval(() => setUnidades(falta(alvo)), 1000);
    return () => clearInterval(id);
  }, [alvo]);

  return (
    <span className="block @container" aria-hidden>
      <span className="grid grid-cols-4 gap-1">
        {unidades.map((u, i) => (
          <span
            key={u.l}
            className="flex flex-col items-center rounded-[4px] bg-black/55 px-1 py-3 backdrop-blur-md baixo:py-2 mbaixo:py-1.5"
          >
            <span className="text-[clamp(2rem,12cqw,3.75rem)] font-bold leading-none tracking-tight tabular-nums baixo:text-[clamp(1.75rem,10cqw,3rem)] mbaixo:text-[clamp(1.5rem,8cqw,2.25rem)]">
              {montado ? String(u.v).padStart(i === 0 ? 1 : 2, "0") : "--"}
            </span>
            <span className="mt-1.5 text-xs leading-none text-white/70">{u.l}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
