/* ============================================================
   MOTOBOX — Núcleo de internacionalização
   Duas línguas: português (predefinida) e inglês.
   ============================================================ */

export const IDIOMAS = ["pt", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_PREDEFINIDO: Idioma = "pt";

export const NOME_IDIOMA: Record<Idioma, string> = {
  pt: "Português",
  en: "English",
};

/** Etiqueta curta para o selector. */
export const CODIGO_IDIOMA: Record<Idioma, string> = {
  pt: "PT",
  en: "EN",
};

/** Locale usado em datas e números. */
export const LOCALE: Record<Idioma, string> = {
  pt: "pt-PT",
  en: "en-GB",
};

export function idiomaValido(v: string | undefined | null): v is Idioma {
  return !!v && (IDIOMAS as readonly string[]).includes(v);
}
