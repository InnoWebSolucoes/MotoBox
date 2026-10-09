/* ============================================================
   MOTOBOX — Cor do texto sobre as cores de clubes e equipas
   As cores vêm da base de dados e algumas são claras (amarelo,
   verde-lima, laranja): o branco por cima não se lê. Escolhe a
   tinta que se lê e, se nenhuma chega, escurece o fundo.
   ============================================================ */

const TINTA_ESCURA = "#1d1d23";

function paraRgb(cor: string): [number, number, number] | null {
  const h = cor.trim().replace(/^#/, "");
  const cheio = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  if (!/^[0-9a-f]{6}$/i.test(cheio)) return null;
  const n = parseInt(cheio, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminancia([r, g, b]: [number, number, number]) {
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

const contraste = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const paraHex = (rgb: [number, number, number]) =>
  "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** Fundo e tinta legíveis (contraste de pelo menos 4,5:1) para uma cor de marca. */
export function tintaSobre(cor: string): { fundo: string; texto: string } {
  const rgb = paraRgb(cor);
  if (!rgb) return { fundo: cor, texto: "#fff" };
  const l = luminancia(rgb);
  if (contraste(1, l) >= 4.5) return { fundo: cor, texto: "#fff" };
  if (contraste(luminancia(paraRgb(TINTA_ESCURA)!), l) >= 4.5) return { fundo: cor, texto: TINTA_ESCURA };
  // Nem uma nem outra: escurece a cor aos poucos até o branco se ler.
  let escuro = rgb;
  for (let f = 0.92; f > 0.3; f -= 0.06) {
    escuro = [rgb[0] * f, rgb[1] * f, rgb[2] * f];
    if (contraste(1, luminancia(escuro)) >= 4.5) break;
  }
  return { fundo: paraHex(escuro), texto: "#fff" };
}
