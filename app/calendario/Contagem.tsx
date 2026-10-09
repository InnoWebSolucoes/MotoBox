"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CONTAGEM_PADRAO, type TextosContagem } from "@/lib/conteudo/grupos/geral";

/* Contagem decrescente até ao início de uma prova, em fichas do painel.
   O servidor desenha "--": os números só aparecem no navegador, para não
   haver diferenças entre o HTML do servidor e o do cliente. */

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

export function Contagem({
  data,
  variante = "vidro",
  className = "",
  textos = CONTAGEM_PADRAO,
}: {
  data: string;
  /** Nomes das unidades (Provas › Páginas do campeonato › Calendário). */
  textos?: TextosContagem;
  /** "vidro" sobre fotografia; "painel" dentro de uma ficha escura. */
  variante?: "vidro" | "painel";
  className?: string;
}) {
  const alvo = new Date(data).getTime();
  const noNavegador = useSyncExternalStore(semSubscricao, () => true, () => false);
  const [t, setT] = useState(() => falta(alvo));

  useEffect(() => {
    const id = setInterval(() => setT(falta(alvo)), 1000);
    return () => clearInterval(id);
  }, [alvo]);

  const unidades = [
    { k: "d", v: t.dias, l: textos.dias },
    { k: "h", v: t.horas, l: textos.horas },
    { k: "m", v: t.minutos, l: textos.minutos },
    { k: "s", v: t.segundos, l: textos.segundos },
  ];
  const ficha = variante === "vidro" ? "bg-black/65" : "bg-white/7";

  return (
    <div className={`grid max-w-[22rem] grid-cols-4 gap-[var(--intervalo)] ${className}`} role="timer" aria-live="off">
      {unidades.map((u) => (
        <div key={u.k} className={`rounded-[var(--raio)] px-2 py-3 text-center ${ficha}`}>
          <span className="block text-3xl font-semibold leading-none tabular-nums lg:text-[2.5rem]">
            {noNavegador ? String(u.v).padStart(2, "0") : "--"}
          </span>
          <span className="mt-1.5 block text-xs text-white/60">{u.l}</span>
        </div>
      ))}
    </div>
  );
}
