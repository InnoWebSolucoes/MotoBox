"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/* Contagem decrescente do painel (dias, horas, minutos, segundos), em quatro
   fichas à largura do painel. Antes de montar mostra "--", para o servidor e
   o cliente coincidirem. */

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
    <span className="grid grid-cols-4 gap-1" aria-hidden>
      {unidades.map((u, i) => (
        <span
          key={u.l}
          className="flex flex-col items-center rounded-[4px] bg-black/45 px-1 py-2.5 backdrop-blur-md mbaixo:py-1.5"
        >
          <span className="text-2xl font-semibold leading-none tabular-nums baixo:text-xl">
            {montado ? String(u.v).padStart(i === 0 ? 1 : 2, "0") : "--"}
          </span>
          <span className="mt-1.5 text-[11px] leading-none text-white/60">{u.l}</span>
        </span>
      ))}
    </span>
  );
}
