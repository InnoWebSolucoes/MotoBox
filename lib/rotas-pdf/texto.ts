/* ============================================================
   MOTOBOX — Guia em PDF: só caracteres que as letras desenham

   As letras do guia (recursos/) são a Instrument Sans e a Barlow
   Condensed do site, com a Inter como reserva para o que lhes
   falta (≈, ², ³, setas, ✓). Um carácter que nenhuma tenha (um
   emoji, outro alfabeto) sairia como um quadrado ou lixo: troca-se
   por um parecido ou sai.

   FAIXAS é a união dos caracteres da Instrument Sans e da Inter
   (recursos/), lida das próprias letras com o fontTools. Se as
   letras mudarem, gere-a outra vez.
   ============================================================ */

/** Pontos de código que as letras do guia desenham (início e fim, inclusive). */
const FAIXAS: [number, number][] = [
  [0x20, 0x7e], [0xa0, 0xac], [0xae, 0x148], [0x14a, 0x1c3], [0x1c5, 0x24f], [0x2b0, 0x304], [0x306, 0x30c],
  [0x30f, 0x30f], [0x312, 0x313], [0x315, 0x315], [0x31b, 0x31b], [0x323, 0x323], [0x326, 0x328], [0x32c, 0x32c],
  [0x337, 0x338], [0x342, 0x343], [0x346, 0x36f], [0x1e00, 0x1e9b], [0x1e9d, 0x1eff], [0x2000, 0x200b],
  [0x2010, 0x2027], [0x202f, 0x2055], [0x2057, 0x2057], [0x205f, 0x205f], [0x2070, 0x2071], [0x2074, 0x208e],
  [0x2090, 0x209c], [0x20a0, 0x20af], [0x20b1, 0x20b5], [0x20b8, 0x20ba], [0x20bc, 0x20bf], [0x2100, 0x2101],
  [0x2103, 0x2103], [0x2105, 0x2106], [0x2109, 0x2109], [0x2113, 0x2113], [0x2116, 0x2117], [0x211e, 0x2122],
  [0x2126, 0x2126], [0x212a, 0x212b], [0x212e, 0x212e], [0x2132, 0x2132], [0x213b, 0x213b], [0x214d, 0x214d],
  [0x2150, 0x217f], [0x2183, 0x2186], [0x2189, 0x2189], [0x2190, 0x2199], [0x21a9, 0x21aa], [0x21b0, 0x21b1],
  [0x21b3, 0x21b5], [0x21ba, 0x21bb], [0x21d0, 0x21d0], [0x21d2, 0x21d2], [0x21d4, 0x21d4], [0x21de, 0x21df],
  [0x21e4, 0x21e5], [0x21e7, 0x21e7], [0x21ea, 0x21ea], [0x2202, 0x2202], [0x2205, 0x2206], [0x220f, 0x220f],
  [0x2211, 0x2212], [0x221a, 0x221a], [0x221e, 0x221e], [0x222b, 0x222b], [0x2236, 0x2236], [0x2248, 0x2248],
  [0x2260, 0x2260], [0x2264, 0x2265], [0x2295, 0x2298], [0x2303, 0x2305], [0x2318, 0x2318], [0x2325, 0x2327],
  [0x232b, 0x232b], [0x2380, 0x2380], [0x2387, 0x2387], [0x238b, 0x238b], [0x23ce, 0x23cf], [0x2460, 0x2468],
  [0x24b6, 0x24cf], [0x24ea, 0x24ea], [0x25a0, 0x25a2], [0x25aa, 0x25aa], [0x25b2, 0x25b3], [0x25b6, 0x25b7],
  [0x25ba, 0x25bd], [0x25c0, 0x25c1], [0x25c4, 0x25c7], [0x25ca, 0x25cb], [0x25cf, 0x25cf], [0x25e6, 0x25e6],
  [0x25ef, 0x25ef], [0x2600, 0x2600], [0x2605, 0x2606], [0x263c, 0x263c], [0x2661, 0x2661], [0x2665, 0x2665],
  [0x26a0, 0x26a0], [0x2713, 0x2713], [0x2717, 0x2717], [0x2756, 0x2756], [0x2764, 0x2764], [0x2780, 0x2788]
];

const coberto = (cp: number): boolean => {
  let a = 0;
  let b = FAIXAS.length - 1;
  while (a <= b) {
    const m = (a + b) >> 1;
    if (cp < FAIXAS[m][0]) b = m - 1;
    else if (cp > FAIXAS[m][1]) a = m + 1;
    else return true;
  }
  return false;
};

/** Parecidos para o que as letras não têm. */
const PARECIDOS: Record<string, string> = {
  "\u2714": "\u2713", // ✔ → ✓
  "\u2705": "\u2713",
  "\u2611": "\u2713",
  "\u274c": "\u2717", // ❌ → ✗
  "\u2716": "\u2717",
  "\u27a1": "\u2192", // ➡ → →
  "\u2b05": "\u2190",
  "\u2b06": "\u2191",
  "\u2b07": "\u2193",
  "\u00ad": "", // hífen invisível
  "\t": " ",
};

/**
 * O texto só com caracteres que as letras desenham: normaliza (NFC), troca
 * os parecidos, tira os acentos que não existam em composição e larga o
 * resto (emoji, outros alfabetos, caracteres de controlo).
 */
export function limpar(texto: string): string {
  let r = "";
  let largou = false;
  for (const ch of texto.normalize("NFC")) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === "\n" || coberto(cp)) {
      r += ch;
      continue;
    }
    const parecido = PARECIDOS[ch];
    if (parecido !== undefined) {
      r += parecido;
      continue;
    }
    const base = ch.normalize("NFD").replace(/\p{M}/gu, "");
    if (base && base !== ch && [...base].every((c) => coberto(c.codePointAt(0) ?? 0))) r += base;
    else largou = true;
  }
  // Onde saiu um emoji ficam dois espa\u00e7os, ou um espa\u00e7o antes da pontua\u00e7\u00e3o.
  return largou ? r.replace(/ {2,}/g, " ").replace(/ +([.,;:!?])/g, "$1").trim() : r;
}

/** O mesmo, em todos os textos de um objecto (as ligações ficam como estão). */
export function limparTudo<T>(valor: T): T {
  if (typeof valor === "string") return limpar(valor) as T;
  if (Array.isArray(valor)) return valor.map((v) => limparTudo(v)) as T;
  if (valor && typeof valor === "object") {
    const r: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor)) r[k] = k === "url" || k === "tracado" || k === "tracadoDe" ? v : limparTudo(v);
    return r as T;
  }
  return valor;
}
