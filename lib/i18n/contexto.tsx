"use client";

/* ============================================================
   MOTOBOX — Contexto de idioma
   Guarda a escolha em localStorage e num cookie (para o
   servidor poder pré-renderizar na língua certa).
   ============================================================ */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { traducoes } from "./traducoes";
import {
  IDIOMA_PREDEFINIDO, LOCALE, idiomaValido, type Idioma,
} from "./idiomas";

const CHAVE = "motobox-idioma";

type Caminho = string;

interface ContextoIdioma {
  idioma: Idioma;
  definirIdioma: (i: Idioma) => void;
  /** Traduz uma chave "seccao.chave". Aceita substituições {n}. */
  t: (caminho: Caminho, vars?: Record<string, string | number>) => string;
  /** Locale para Intl (datas, números). */
  locale: string;
}

const Ctx = createContext<ContextoIdioma | null>(null);

function resolver(caminho: Caminho, idioma: Idioma): string {
  const [seccao, chave] = caminho.split(".");
  const grupo = (traducoes as Record<string, Record<string, Record<string, string>>>)[seccao];
  const entrada = grupo?.[chave];

  if (!entrada) {
    // Em desenvolvimento, torna a falha visível em vez de silenciosa.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] chave em falta: ${caminho}`);
    }
    return caminho;
  }

  return entrada[idioma] ?? entrada[IDIOMA_PREDEFINIDO] ?? caminho;
}

export function IdiomaProvider({
  children, inicial,
}: { children: ReactNode; inicial?: Idioma }) {
  const [idioma, setIdioma] = useState<Idioma>(inicial ?? IDIOMA_PREDEFINIDO);

  // Lê a preferência guardada no cliente.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CHAVE);
      if (idiomaValido(guardado)) setIdioma(guardado);
    } catch { /* indisponível */ }
  }, []);

  // Mantém o atributo lang do documento em sintonia.
  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  const definirIdioma = useCallback((i: Idioma) => {
    setIdioma(i);
    try { localStorage.setItem(CHAVE, i); } catch { /* indisponível */ }
    // Cookie para o servidor poder escolher a língua no próximo pedido.
    document.cookie = `${CHAVE}=${i}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const t = useCallback((caminho: Caminho, vars?: Record<string, string | number>) => {
    let texto = resolver(caminho, idioma);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        texto = texto.replaceAll(`{${k}}`, String(v));
      }
    }
    return texto;
  }, [idioma]);

  const valor = useMemo<ContextoIdioma>(
    () => ({ idioma, definirIdioma, t, locale: LOCALE[idioma] }),
    [idioma, definirIdioma, t],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useIdioma() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIdioma tem de ser usado dentro de <IdiomaProvider>");
  return ctx;
}

/** Atalho para componentes que só precisam de traduzir. */
export function useT() {
  return useIdioma().t;
}
