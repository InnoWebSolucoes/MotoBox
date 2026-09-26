/* ============================================================
   MOTOBOX — Motivos de denúncia
   Partilhado entre o botão "Denunciar" e a rota que regista.
   ============================================================ */

export const MOTIVOS_DENUNCIA = [
  "Possível fraude", "Spam ou publicidade", "Linguagem ofensiva",
  "Conteúdo falso ou enganador", "Fora de tópico", "Outro motivo",
] as const;

export type MotivoDenuncia = (typeof MOTIVOS_DENUNCIA)[number];
