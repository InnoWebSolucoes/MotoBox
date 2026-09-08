import "server-only";

/* ============================================================
   MOTOBOX — Tradução automática de conteúdo
   Traduz o conteúdo introduzido no painel (notícias, eventos,
   biografias, páginas legais) de português para inglês.

   As traduções são guardadas na tabela `traducoes` do Supabase,
   pelo que cada texto só é traduzido uma vez. Sem chave de API
   configurada, devolve o original — o site continua a funcionar,
   em português.

   Fornecedor: DeepL (melhor qualidade para PT→EN) com recurso
   ao Google Cloud Translation.
   ============================================================ */

import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

const DEEPL = process.env.DEEPL_API_KEY;
const GOOGLE = process.env.GOOGLE_TRANSLATE_API_KEY;

export const traducaoAutomaticaActiva = Boolean(DEEPL || GOOGLE);

/** Identificador estável de um texto, para servir de chave de cache. */
function impressao(texto: string, destino: string): string {
  return createHash("sha256").update(`${destino}:${texto}`).digest("hex").slice(0, 32);
}

/* ---------------- Fornecedores ---------------- */

async function viaDeepL(textos: string[]): Promise<string[] | null> {
  if (!DEEPL) return null;
  // As chaves gratuitas terminam em ":fx" e usam outro domínio.
  const base = DEEPL.endsWith(":fx")
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";

  try {
    const r = await fetch(`${base}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: textos,
        source_lang: "PT",
        target_lang: "EN-GB",
        // Preserva marcação simples que apareça no conteúdo.
        tag_handling: "html",
      }),
    });
    if (!r.ok) return null;
    const j = await r.json() as { translations?: { text: string }[] };
    return j.translations?.map((x) => x.text) ?? null;
  } catch {
    return null;
  }
}

async function viaGoogle(textos: string[]): Promise<string[] | null> {
  if (!GOOGLE) return null;
  try {
    const r = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: textos, source: "pt", target: "en", format: "text" }),
      },
    );
    if (!r.ok) return null;
    const j = await r.json() as { data?: { translations?: { translatedText: string }[] } };
    return j.data?.translations?.map((x) => x.translatedText) ?? null;
  } catch {
    return null;
  }
}

/* ---------------- Cache no Supabase ---------------- */

async function lerCache(chaves: string[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  const db = supabaseAdmin();
  if (!db || chaves.length === 0) return mapa;

  const { data } = await db
    .from("traducoes")
    .select("impressao, traduzido")
    .in("impressao", chaves);

  for (const linha of data ?? []) {
    mapa.set(linha.impressao as string, linha.traduzido as string);
  }
  return mapa;
}

async function escreverCache(
  linhas: { impressao: string; original: string; traduzido: string; idioma: string }[],
) {
  const db = supabaseAdmin();
  if (!db || linhas.length === 0) return;
  await db.from("traducoes").upsert(linhas, { onConflict: "impressao" });
}

/* ---------------- API pública ---------------- */

/**
 * Traduz um conjunto de textos para inglês.
 * Devolve os originais quando não há fornecedor configurado ou
 * quando a chamada falha — nunca lança.
 */
export async function traduzirLote(
  textos: string[],
  destino = "en",
): Promise<string[]> {
  if (textos.length === 0) return [];
  if (!traducaoAutomaticaActiva) return textos;

  const chaves = textos.map((t) => impressao(t, destino));
  const cache = await lerCache(chaves);

  const emFalta: { indice: number; texto: string }[] = [];
  textos.forEach((texto, i) => {
    if (!cache.has(chaves[i]) && texto.trim()) emFalta.push({ indice: i, texto });
  });

  if (emFalta.length > 0) {
    const brutos = emFalta.map((x) => x.texto);
    const traduzidos = (await viaDeepL(brutos)) ?? (await viaGoogle(brutos));

    if (traduzidos && traduzidos.length === brutos.length) {
      const novas = emFalta.map((x, k) => ({
        impressao: chaves[x.indice],
        original: x.texto,
        traduzido: traduzidos[k],
        idioma: destino,
      }));
      await escreverCache(novas);
      for (const n of novas) cache.set(n.impressao, n.traduzido);
    }
  }

  return textos.map((texto, i) => cache.get(chaves[i]) ?? texto);
}

/** Traduz um único texto. */
export async function traduzirTexto(texto: string, destino = "en"): Promise<string> {
  const [r] = await traduzirLote([texto], destino);
  return r ?? texto;
}

/**
 * Traduz os campos indicados de uma lista de registos,
 * numa só chamada ao fornecedor.
 */
export async function traduzirRegistos<T extends Record<string, unknown>>(
  registos: T[],
  campos: (keyof T)[],
  destino = "en",
): Promise<T[]> {
  if (!traducaoAutomaticaActiva || registos.length === 0) return registos;

  // Achata todos os textos (incluindo arrays de parágrafos) num só lote.
  const plano: string[] = [];
  const mapa: { reg: number; campo: keyof T; idx: number | null }[] = [];

  registos.forEach((r, i) => {
    for (const campo of campos) {
      const v = r[campo];
      if (typeof v === "string" && v.trim()) {
        plano.push(v);
        mapa.push({ reg: i, campo, idx: null });
      } else if (Array.isArray(v)) {
        v.forEach((item, j) => {
          if (typeof item === "string" && item.trim()) {
            plano.push(item);
            mapa.push({ reg: i, campo, idx: j });
          }
        });
      }
    }
  });

  const traduzidos = await traduzirLote(plano, destino);

  const saida = registos.map((r) => ({ ...r }));
  mapa.forEach((m, k) => {
    const alvo = saida[m.reg] as Record<string, unknown>;
    if (m.idx === null) {
      alvo[m.campo as string] = traduzidos[k];
    } else {
      const lista = [...(alvo[m.campo as string] as unknown[])];
      lista[m.idx] = traduzidos[k];
      alvo[m.campo as string] = lista;
    }
  });

  return saida;
}
