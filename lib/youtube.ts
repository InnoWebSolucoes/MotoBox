/* ============================================================
   MOTOBOX — Ligações do YouTube
   Funções puras, usadas no painel e no servidor.
   ============================================================ */

/**
 * Identificador de 11 caracteres a partir de qualquer forma de ligação
 * (watch?v=, youtu.be/, shorts/, embed/, live/) ou do próprio id.
 */
export function idYoutube(valor: string | null | undefined): string | null {
  const v = (valor ?? "").trim();
  if (!v) return null;
  const m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/.exec(v);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(v) ? v : null;
}

/** Miniatura que existe sempre (480×360). */
export const miniaturaYoutube = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Duração em segundos para o formato do site: m:ss ou h:mm:ss. */
export function formatarDuracao(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
