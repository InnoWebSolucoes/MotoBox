/* ============================================================
   MOTOBOX — Onde o site vive
   A Motobox é servida em innoweb.agency/motobox: o site principal
   da Innoweb encaminha /motobox/* para este projecto, e o Next
   corre com `basePath` (ver next.config.ts).

   <Link>, o router, redirect() e as imagens do Next já levam o
   prefixo sozinhos. Tudo o resto (fetch à própria API, window.location,
   cabeçalhos Location, ligações nos emails) passa por aqui.
   ============================================================ */

export const BASE = "/motobox";

/** "/api/x" → "/motobox/api/x". */
export const comBase = (caminho: string) => `${BASE}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;

/** "/motobox/forum" → "/forum" (para caminhos lidos de window.location). */
export function semBase(caminho: string): string {
  if (caminho === BASE) return "/";
  return caminho.startsWith(`${BASE}/`) ? caminho.slice(BASE.length) : caminho;
}

/**
 * Endereço público completo, sem barra final, para ligações absolutas
 * (emails, retorno do OAuth). Em produção vem de NEXT_PUBLIC_SITE_URL
 * (https://innoweb.agency/motobox).
 */
export function urlPublica(): string {
  const definido = process.env.NEXT_PUBLIC_SITE_URL;
  if (definido) return definido.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}${BASE}`;
  if (typeof window !== "undefined") return `${window.location.origin}${BASE}`;
  return `https://innoweb.agency${BASE}`;
}
