/* ============================================================
   MOTOBOX — Moderar respostas do fórum (painel, no navegador)
   Fala com /api/admin/respostas-forum. Usado em Fórum, para ver
   e moderar as respostas de um tópico, e em Moderação, quando a
   denúncia aponta a uma resposta.
   ============================================================ */

import { comBase } from "@/lib/base";
import type { EstadoTopico, RespostaAdmin } from "./tipos";

/** `dados` quando correu bem; senão `erro`, já em frase para a equipa, e o código HTTP. */
export type Resultado<T> = { dados: T; erro?: undefined } | { dados?: undefined; erro: string; codigo: number };

async function pedir<T>(metodo: "GET" | "PATCH" | "DELETE", query: string, corpo?: unknown): Promise<Resultado<T>> {
  try {
    const r = await fetch(comBase(`/api/admin/respostas-forum${query}`), {
      method: metodo,
      cache: "no-store",
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { erro: String(j.erro ?? `HTTP ${r.status}`), codigo: r.status };
    return { dados: j as T };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha de rede", codigo: 0 };
  }
}

/** Todas as respostas do tópico, também as escondidas, e a contagem actual. */
export const lerRespostasDoTopico = (topicoId: string) =>
  pedir<{ respostas: RespostaAdmin[]; topico: EstadoTopico | null; emFalta?: boolean }>(
    "GET", `?topico=${encodeURIComponent(topicoId)}`,
  );

export const lerResposta = (id: string) =>
  pedir<{ resposta: RespostaAdmin }>("GET", `?id=${encodeURIComponent(id)}`);

/** Esconde (`false`) ou volta a mostrar (`true`). Devolve o tópico já com a contagem certa. */
export const mudarVisibilidade = (id: string, publicado: boolean) =>
  pedir<{ topico: EstadoTopico | null }>("PATCH", "", { id, publicado });

export const apagarResposta = (id: string) =>
  pedir<{ topico: EstadoTopico | null }>("DELETE", `?id=${encodeURIComponent(id)}`);
