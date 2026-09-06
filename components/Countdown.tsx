"use client";

import { useEffect, useState } from "react";

function diff(alvo: number) {
  const ms = Math.max(0, alvo - Date.now());
  return {
    dias: Math.floor(ms / 86400000),
    horas: Math.floor((ms / 3600000) % 24),
    minutos: Math.floor((ms / 60000) % 60),
    segundos: Math.floor((ms / 1000) % 60),
    terminado: ms === 0,
  };
}

export function Countdown({
  data,
  size = "md",
  className = "",
}: {
  data: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const alvo = new Date(data).getTime();
  const [t, setT] = useState(() => diff(alvo));
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    const id = setInterval(() => setT(diff(alvo)), 1000);
    return () => clearInterval(id);
  }, [alvo]);

  const dims = {
    sm: { num: "text-lg", lab: "text-[9px]", gap: "gap-3" },
    md: { num: "text-3xl", lab: "text-[10px]", gap: "gap-5" },
    lg: { num: "text-4xl sm:text-5xl", lab: "text-[11px]", gap: "gap-6 sm:gap-8" },
  }[size];

  const unidades = [
    { v: t.dias, l: "Dias" },
    { v: t.horas, l: "Horas" },
    { v: t.minutos, l: "Min" },
    { v: t.segundos, l: "Seg" },
  ];

  return (
    <div className={`flex ${dims.gap} ${className}`} aria-live="off">
      {unidades.map((u) => (
        <div key={u.l} className="text-center tabular-nums">
          <div className={`font-display ${dims.num} leading-none text-white`}>
            {montado ? String(u.v).padStart(2, "0") : "--"}
          </div>
          <div className={`mt-1.5 eyebrow ${dims.lab} text-ink-500`}>{u.l}</div>
        </div>
      ))}
    </div>
  );
}
