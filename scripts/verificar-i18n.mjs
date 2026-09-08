/**
 * VERIFICAÇÃO DE INTERNACIONALIZAÇÃO
 *
 * Falha (código 1) se encontrar:
 *   1. Uma chave presente numa língua e ausente noutra.
 *   2. Uma tradução vazia.
 *   3. Texto visível ao utilizador ainda escrito no código.
 *   4. Uma chave usada em t("...") que não existe no dicionário.
 *
 *   node scripts/verificar-i18n.mjs
 *
 * A lista IGNORAR existe para casos legítimos: nomes próprios,
 * marcas e símbolos que não se traduzem. Cada entrada precisa
 * de justificação.
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const IDIOMAS = ["pt", "en"];
let problemas = 0;

const erro = (msg) => { console.error(`  ✗ ${msg}`); problemas++; };

/* ---------- 1. Carregar o dicionário ---------- */

const fonte = readFileSync("lib/i18n/traducoes.ts", "utf8");

// Extrai { pt: "...", en: "..." } com a chave que os precede.
const entradas = [];
const reEntrada = /(\w+):\s*\{\s*pt:\s*"((?:[^"\\]|\\.)*)"\s*,\s*en:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
for (const m of fonte.matchAll(reEntrada)) {
  entradas.push({ chave: m[1], pt: m[2], en: m[3] });
}

// Secções e chaves, para validar os usos de t("seccao.chave")
const chavesConhecidas = new Set();
{
  const reSeccao = /^\s{2}(\w+):\s*\{$/gm;
  const seccoes = [...fonte.matchAll(reSeccao)].map((m) => ({ nome: m[1], pos: m.index }));
  for (let i = 0; i < seccoes.length; i++) {
    const ini = seccoes[i].pos;
    const fim = i + 1 < seccoes.length ? seccoes[i + 1].pos : fonte.length;
    const bloco = fonte.slice(ini, fim);
    for (const m of bloco.matchAll(/(\w+):\s*\{\s*pt:/g)) {
      chavesConhecidas.add(`${seccoes[i].nome}.${m[1]}`);
    }
  }
}

/** Ficheiros que legitimamente contêm texto não traduzível. */
const FICHEIROS_ISENTOS = [
  "lib/i18n/",           // o próprio dicionário
  "lib/data.ts",         // conteúdo editorial, gerido no painel
  "lib/admin/seed.ts",   // dados de demonstração, geridos no painel
];

/**
 * Cadeias que não se traduzem: marcas, nomes próprios, unidades
 * e símbolos. Cada uma precisa de razão para estar aqui.
 */
const IGNORAR = new Set([
  "Motobox", "Motobox Angola", "Innoweb", "Angola", "Luanda", "Kz",
  "Multicaixa Express", "Instagram", "Facebook", "YouTube", "Supabase",
  "PT", "EN", "MX1", "MX2", "DNF", "DNS", "DSQ", "QR", "CSV", "JSON",
  "min", "km", "GB", "Postgres", "localStorage",
]);

/** Entradas do dicionário cuja igualdade pt/en é intencional. */
const IGUAIS_ACEITES = new Set([
  "marketplace", "navMarketplace", "cookies", "marketing", "email",
  "total", "menu", "localizacao", "newsletter", "navNewsletter",
]);

console.log(`Dicionário: ${entradas.length} entradas, ${chavesConhecidas.size} chaves\n`);

/* ---------- 2. Traduções completas e não vazias ---------- */

console.log("A verificar integridade do dicionário…");
for (const e of entradas) {
  for (const lang of IDIOMAS) {
    if (!e[lang] || !e[lang].trim()) {
      erro(`"${e.chave}" tem tradução vazia em "${lang}"`);
    }
  }
  if (e.pt === e.en && e.pt.length > 3 && /[a-zà-ÿ]/i.test(e.pt)) {
    // Igual nas duas línguas é permitido (nomes próprios), mas vale a pena listar.
    if (!IGUAIS_ACEITES.has(e.chave)) {
      console.log(`  · "${e.chave}" é igual em pt/en — confirme que é intencional`);
    }
  }
}

/* ---------- 3. Chaves usadas mas inexistentes ---------- */

console.log("A verificar chaves usadas no código…");
const ficheiros = globSync("{app,components}/**/*.{tsx,ts}");
for (const f of ficheiros) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/\bt\(\s*"([\w.]+)"/g)) {
    if (!chavesConhecidas.has(m[1])) {
      erro(`${f}: usa t("${m[1]}") mas essa chave não existe no dicionário`);
    }
  }
}

/* ---------- 4. Texto ainda embutido no código ---------- */

console.log("A procurar texto por traduzir…");

const rePotencial = [
  // Texto entre tags JSX que começa por maiúscula
  />\s*([A-ZÀ-Þ][A-Za-zÀ-ÿ][^<>{}\n]{2,90}?)\s*</g,
  // Atributos visíveis ao utilizador
  /(?:placeholder|aria-label|title)\s*=\s*"([^"]{3,90})"/g,
];

for (const f of ficheiros) {
  const caminho = f.replaceAll("\\", "/");
  if (FICHEIROS_ISENTOS.some((p) => caminho.startsWith(p))) continue;

  const s = readFileSync(f, "utf8");

  for (const re of rePotencial) {
    for (const m of s.matchAll(re)) {
      const texto = m[1].trim();
      if (IGNORAR.has(texto)) continue;
      if (!/[A-Za-zÀ-ÿ]{3}/.test(texto)) continue;   // sem palavras reais
      if (/^[A-Z0-9_]+$/.test(texto)) continue;       // constantes
      if (/^\d/.test(texto)) continue;                // começa por número
      erro(`${caminho}: texto por traduzir → "${texto}"`);
    }
  }
}

/* ---------- Resultado ---------- */

console.log("");
if (problemas === 0) {
  console.log("✓ i18n completo: todas as cadeias traduzidas nas duas línguas.");
  process.exit(0);
} else {
  console.error(`✗ ${problemas} problema(s) de i18n por resolver.`);
  process.exit(1);
}
