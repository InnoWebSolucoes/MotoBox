"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/* Contagem decrescente compacta, numa linha (dias, horas, minutos, segundos).
   Antes de montar mostra "--", para o servidor e o cliente coincidirem. */

function falta(alvo: number) {
  const ms = Math.max(0, alvo - Date.now());
  return [
    { v: Math.floor(ms / 86400000), l: "dias" },
    { v: Math.floor((ms / 3600000) % 24), l: "h" },
    { v: Math.floor((ms / 60000) % 60), l: "min" },
    { v: Math.floor((ms / 1000) % 60), l: "s" },
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
    <span className="flex items-stretch gap-1" aria-hidden>
      {unidades.map((u, i) => (
        <span key={u.l} className="flex min-w-[3rem] flex-col items-center rounded-[4px] bg-white/10 px-2 py-1.5">
          <span className="text-lg font-semibold leading-none tabular-nums">
            {montado ? String(u.v).padStart(i === 0 ? 1 : 2, "0") : "--"}
          </span>
          <span className="mt-1 text-[11px] leading-none text-white/60">{u.l}</span>
        </span>
      ))}
    </span>
  );
}
