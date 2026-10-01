"use client";

import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth/contexto";
import { FormularioSessao } from "./FormularioSessao";
import { Icon } from "./ui";
import { semBase } from "@/lib/base";

/* ============================================================
   MOTOBOX — Janela "Entre para continuar"
   Qualquer botão que precise de sessão chama `exigirSessao`. Com
   sessão, a acção corre logo. Sem sessão, abre-se esta janela na
   própria página: nada do que a pessoa escreveu se perde. Ao entrar,
   a janela fecha e, se foi pedido, a acção corre a seguir.
   ============================================================ */

interface Pedido {
  motivo?: string;
  /** Corre depois de entrar. Omitir quando a pessoa deve voltar a carregar no botão. */
  depois?: () => void;
  modo?: "entrar" | "registar";
}

type Exigir = (acao?: () => void, opcoes?: { motivo?: string; continuar?: boolean; modo?: "entrar" | "registar" }) => boolean;

const Ctx = createContext<Exigir | null>(null);

export function SessaoObrigatoriaProvider({ children }: { children: ReactNode }) {
  const { utilizador } = useAuth();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const pedidoRef = useRef<Pedido | null>(null);
  useEffect(() => { pedidoRef.current = pedido; }, [pedido]);

  /**
   * Devolve verdadeiro se já havia sessão (e a acção correu).
   * `continuar: true` faz a acção correr também depois de entrar.
   */
  const exigir = useCallback<Exigir>((acao, opcoes = {}) => {
    if (utilizador) { acao?.(); return true; }
    setPedido({ motivo: opcoes.motivo, depois: opcoes.continuar ? acao : undefined, modo: opcoes.modo });
    return false;
  }, [utilizador]);

  const fechar = useCallback(() => setPedido(null), []);

  // A sessão chegou com a janela aberta: fecha e segue com o que ficou pedido.
  useEffect(() => {
    if (!utilizador || !pedidoRef.current) return;
    const depois = pedidoRef.current.depois;
    setPedido(null);
    depois?.();
  }, [utilizador]);

  return (
    <Ctx.Provider value={exigir}>
      {children}
      {pedido && <JanelaSessao pedido={pedido} aoFechar={fechar} />}
    </Ctx.Provider>
  );
}

/** `exigirSessao(acao, { motivo, continuar })` — ver SessaoObrigatoriaProvider. */
export function useExigirSessao(): Exigir {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExigirSessao tem de ser usado dentro de <SessaoObrigatoriaProvider>");
  return ctx;
}

function JanelaSessao({ pedido, aoFechar }: { pedido: Pedido; aoFechar: () => void }) {
  // A janela só abre no navegador, depois de um clique: o endereço actual
  // diz para onde a ligação de confirmação do email deve trazer a pessoa.
  const [destino] = useState(() => `${semBase(window.location.pathname)}${window.location.search}`);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = antes;
    };
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center overflow-y-auto p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={aoFechar} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Entrar na Motobox"
        className="relative my-auto w-full max-w-md rounded-[6px] bg-near-black p-6 shadow-2xl ring-1 ring-white/10 sm:p-8">
        <button type="button" onClick={aoFechar} aria-label="Fechar"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/8 hover:text-white">
          <Icon name="close" className="size-4" />
        </button>
        <FormularioSessao compacto destino={destino} motivo={pedido.motivo} modoInicial={pedido.modo} />
      </div>
    </div>
  );
}
