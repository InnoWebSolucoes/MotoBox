/* ============================================================
   MOTOBOX — Províncias de Angola
   21 desde 1 de Janeiro de 2025 (Lei 14/24 da Divisão
   Político-Administrativa): o Cuando Cubango deu o Cuando e o
   Cubango, o Moxico deu também o Moxico Leste, e Luanda deu
   Icolo e Bengo. Luanda primeiro (é onde está quase tudo), as
   restantes por ordem alfabética.
   ============================================================ */

export const PROVINCIAS = [
  "Luanda",
  "Bengo", "Benguela", "Bié", "Cabinda", "Cuando", "Cuanza Norte", "Cuanza Sul",
  "Cubango", "Cunene", "Huambo", "Huíla", "Icolo e Bengo", "Lunda Norte", "Lunda Sul",
  "Malanje", "Moxico", "Moxico Leste", "Namibe", "Uíge", "Zaire",
] as const;

export type Provincia = (typeof PROVINCIAS)[number];

export const ehProvincia = (v: unknown): v is Provincia =>
  typeof v === "string" && (PROVINCIAS as readonly string[]).includes(v);
