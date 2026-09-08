/**
 * Extrai as cadeias de texto visíveis ao utilizador dos ficheiros
 * .tsx, para inventário durante a migração para i18n.
 *
 *   node scripts/extrair-strings.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { globSync } from "node:fs";
import { join } from "node:path";

const ficheiros = globSync("{app,components}/**/*.tsx");

const PADROES = [
  // Texto entre tags JSX
  [/>\s*([A-Za-zÀ-ÿ][^<>{}\n]{1,100}?)\s*</g, 2],
  // Atributos visíveis
  [/(?:placeholder|title|aria-label|etiqueta|descricao|titulo|rotulo|ajuda|mensagem|textoConfirmar|label|eyebrow|nome)\s*=\s*"([^"]{1,140})"/g, 1],
  // Avisos
  [/mostrar\(\s*"([^"]{1,140})"/g, 1],
];

const total = {};
let contador = 0;

for (const f of ficheiros) {
  const s = readFileSync(f, "utf8");
  const encontrados = new Set();

  for (const [re] of PADROES) {
    for (const m of s.matchAll(re)) {
      const t = (m[1] ?? "").trim();
      if (t.length < 2) continue;
      if (!/[A-Za-zÀ-ÿ]/.test(t)) continue;
      if (/^(https?:|\/|#|[A-Za-z-]+\/)/.test(t)) continue;
      encontrados.add(t);
    }
  }

  if (encontrados.size) {
    total[f.replaceAll("\\", "/")] = [...encontrados].sort();
    contador += encontrados.size;
  }
}

mkdirSync(".tmp", { recursive: true });
writeFileSync(".tmp/strings.json", JSON.stringify(total, null, 1), "utf8");

console.log(`ficheiros: ${Object.keys(total).length}`);
console.log(`strings:   ${contador}`);
