/* ============================================================
   MOTOBOX — Respostas do fórum (partilhado cliente/servidor)
   ============================================================ */

/** Resposta tal como aparece na página do tópico. */
export interface RespostaPublica {
  id: string;
  autorNome: string;
  autorCor: string;
  /** Logótipo da conta (pasta pública `avatares`). Sem ele, a inicial sobre a cor. */
  autorAvatar?: string;
  corpo: string;
  /** ISO 8601. */
  criadoEm: string;
}

export const RESPOSTA_MIN = 2;
export const RESPOSTA_MAX = 5000;

export const COR_PADRAO = "#e10600";
