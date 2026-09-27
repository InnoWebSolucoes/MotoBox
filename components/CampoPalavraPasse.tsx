"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "./ui";
import { useIdioma } from "@/lib/i18n/contexto";

/**
 * Campo de palavra-passe com um olho para a mostrar ou esconder.
 * Recebe as mesmas propriedades de um <input>; `className` vai para o
 * próprio campo, que ganha espaço à direita para o botão.
 */
export function CampoPalavraPasse({ className = "", ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const { t } = useIdioma();
  const [visivel, setVisivel] = useState(false);
  const rotulo = visivel ? t("auth.esconderPalavra") : t("auth.mostrarPalavra");
  return (
    <div className="relative">
      <input {...rest} type={visivel ? "text" : "password"} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={rotulo}
        aria-pressed={visivel}
        title={rotulo}
        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/8 hover:text-white"
      >
        <Icon name={visivel ? "eye" : "eyeOff"} className="size-4.5" />
      </button>
    </div>
  );
}
