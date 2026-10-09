"use client";

/* Contagem decrescente para a próxima prova, no desenho do painel: quatro
   fichas escuras e desfocadas (dias, horas, minutos, segundos). Antes de
   montar mostra "--", para o servidor e o cliente coincidirem. */

import { useEffect, useState, useSyncExternalStore } from "react";

function falta(alvo: number) {
  const ms = Math.max(0, alvo - Date.now());
  return {
    dias: Math.floor(ms / 86400000),
    horas: Math.floor((ms / 3600000) % 24),
    minutos: Math.floor((ms / 60000) % 60),
    segundos: Math.floor((ms / 1000) % 60),
  };
}

const semSubscricao = () => () => {};

export function Contagem({ data, className = "" }: { data: string; className?: string }) {
  const alvo = new Date(data).getTime();
  const [t, setT] = useState(() => falta(alvo));
  // Só no navegador: no servidor e na hidratação fica "--".
  const montado = useSyncExternalStore(semSubscricao, () => true, () => false);

  useEffect(() => {
    const id = setInterval(() => setT(falta(alvo)), 1000);
    return () => clearInterval(id);
  }, [alvo]);

  const unidades = [
    { v: t.dias, l: "Dias" },
    { v: t.horas, l: "Horas" },
    { v: t.minutos, l: "Min" },
    { v: t.segundos, l: "Seg" },
  ];

  return (
    <div className={`grid grid-cols-4 gap-[var(--intervalo)] ${className}`} aria-live="off">
      {unidades.map((u) => (
        <div key={u.l} className="rounded-[var(--raio)] bg-black/55 px-1 py-4 text-center backdrop-blur-md md:py-5">
          <span className="block text-[2rem] font-semibold leading-none tracking-tight tabular-nums md:text-[2.75rem]">
            {montado ? String(u.v).padStart(2, "0") : "--"}
          </span>
          <span className="mt-2 block text-xs text-white/80">{u.l}</span>
        </div>
      ))}
    </div>
  );
}
