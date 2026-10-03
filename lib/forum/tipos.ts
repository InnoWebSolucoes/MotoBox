/* ============================================================
   MOTOBOX — Fórum (partilhado cliente/servidor)
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

/** Resposta vista no painel: também as escondidas. */
export interface RespostaAdmin extends RespostaPublica {
  topicoId: string;
  publicado: boolean;
}

/** "Última resposta" de um tópico. `em` (ISO 8601) só existe quando veio de uma resposta guardada. */
export interface UltimaResposta {
  autor: string;
  quando: string;
  em?: string;
}

/** O que muda num tópico quando uma resposta entra, sai ou volta. */
export interface EstadoTopico {
  respostas: number;
  ultimaResposta: UltimaResposta;
}

export const RESPOSTA_MIN = 2;
export const RESPOSTA_MAX = 5000;

/** Tópico novo: título e mensagem de abertura. */
export const TOPICO_TITULO_MIN = 8;
export const TOPICO_TITULO_MAX = 120;
export const TOPICO_TEXTO_MIN = 20;
export const TOPICO_TEXTO_MAX = 5000;

export const COR_PADRAO = "#e10600";
