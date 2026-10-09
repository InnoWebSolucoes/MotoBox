"use client";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA: a conversa no navegador
   O histórico (o que a API do Claude recebe) e o que o painel
   mostra (mensagens, ferramentas, propostas) vivem na sessão do
   separador (sessionStorage), uma conversa por conta. Fechar o
   separador apaga-a. Lê-se com useSyncExternalStore: nada de
   setState dentro de efeitos.
   ============================================================ */

import { useMemo, useSyncExternalStore } from "react";
import type { Decisao, Ligacao, MensagemHistorico, Proposta } from "@/lib/admin/organizador/tipos";

export type EstadoProposta = "pendente" | "decidida" | "a-executar" | "executada" | "falhou" | "rejeitada" | "sem-decisao";

export type Item =
  | { tipo: "pedido"; id: string; texto: string; anexos?: string[] }
  | { tipo: "resposta"; id: string; texto: string }
  | { tipo: "progresso"; id: string; texto: string }
  | { tipo: "ferramenta"; id: string; rotulo: string; estado: "a-correr" | "ok" | "erro"; resumo?: string }
  | {
      tipo: "proposta"; id: string; proposta: Proposta; estado: EstadoProposta;
      decisao?: Decisao; editada?: boolean; resultado?: { ok: boolean; titulo: string; resumo: string; ligacoes: Ligacao[] };
    }
  | { tipo: "aviso"; id: string; texto: string; tom: "info" | "erro" };

export interface Conversa {
  historico: MensagemHistorico[];
  itens: Item[];
}

const VAZIA: Conversa = { historico: [], itens: [] };

interface Loja {
  ler: () => Conversa;
  mudar: (f: (c: Conversa) => Conversa) => void;
  subscrever: (cb: () => void) => () => void;
}

const lojas = new Map<string, Loja>();

function criarLoja(chave: string): Loja {
  let actual: Conversa | null = null;
  const ouvintes = new Set<() => void>();
  const carregar = (): Conversa => {
    if (actual) return actual;
    try {
      const guardado = sessionStorage.getItem(chave);
      actual = guardado ? { ...VAZIA, ...(JSON.parse(guardado) as Conversa) } : VAZIA;
    } catch {
      actual = VAZIA;
    }
    return actual;
  };
  return {
    ler: carregar,
    mudar: (f) => {
      actual = f(carregar());
      try {
        if (actual.itens.length === 0 && actual.historico.length === 0) sessionStorage.removeItem(chave);
        else sessionStorage.setItem(chave, JSON.stringify(actual));
      } catch { /* quota cheia ou modo privado: fica só em memória */ }
      for (const o of ouvintes) o();
    },
    subscrever: (cb) => {
      ouvintes.add(cb);
      return () => { ouvintes.delete(cb); };
    },
  };
}

export function lojaDe(chave: string): Loja {
  let l = lojas.get(chave);
  if (!l) { l = criarLoja(chave); lojas.set(chave, l); }
  return l;
}

const lerServidor = () => VAZIA;

/** A conversa desta conta, e a função para a mudar. */
export function useConversa(chave: string): [Conversa, Loja["mudar"]] {
  const loja = useMemo(() => lojaDe(`motobox-organizador:${chave}`), [chave]);
  const conversa = useSyncExternalStore(loja.subscrever, loja.ler, lerServidor);
  return [conversa, loja.mudar];
}

let contador = 0;
export const novoIdItem = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}-${(contador++).toString(36)}`;
