/* ============================================================
   MOTOBOX — Clubes: listas e nomes partilhados
   Usado pelas páginas públicas e pelo painel (/admin/clubes).
   ============================================================ */

import type { Clube, TipoClube } from "@/lib/types";

/** Tipos pela ordem em que aparecem nos filtros, com o endereço (?tipo=) de cada um. */
export const TIPOS_CLUBE: { tipo: TipoClube; slug: string; nome: string; descricao: string }[] = [
  { tipo: "Moto-turismo", slug: "moto-turismo", nome: "Moto-turismo", descricao: "Passeios, raides e viagens pelo país e além-fronteiras." },
  { tipo: "Lady Riders", slug: "lady-riders", nome: "Lady Riders", descricao: "Clubes e grupos de mulheres que conduzem." },
  { tipo: "Todo-o-terreno", slug: "todo-o-terreno", nome: "Todo-o-terreno", descricao: "Trilhos, picadas e areia, por gosto e sem cronómetro." },
  { tipo: "Clube de marca", slug: "clube-de-marca", nome: "Clube de marca", descricao: "Donos da mesma marca ou modelo que saem juntos." },
  { tipo: "Clássicas", slug: "classicas", nome: "Clássicas", descricao: "Motas antigas, restauros e encontros de colecção." },
  { tipo: "Scooters e urbano", slug: "scooters-e-urbano", nome: "Scooters e urbano", descricao: "Scooters, Vespas e quem anda de mota na cidade." },
  // "Outro" junta sobretudo clubes de convívio e solidariedade.
  { tipo: "Outro", slug: "outros", nome: "Convívio e solidariedade", descricao: "Clubes que vivem sobretudo do convívio e das acções solidárias." },
];

export const slugTexto = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const tipoPorSlug = (slug?: string) => TIPOS_CLUBE.find((t) => t.slug === slug);
export const nomeTipo = (tipo: TipoClube) => TIPOS_CLUBE.find((t) => t.tipo === tipo)?.nome ?? tipo;
export const slugTipo = (tipo: TipoClube) => TIPOS_CLUBE.find((t) => t.tipo === tipo)?.slug ?? slugTexto(tipo);

/** "Lobito, Benguela"; só a província quando a sede não está publicada. */
export function localClube(c: Pick<Clube, "cidade" | "provincia">): string {
  const cidade = c.cidade?.trim();
  return cidade && cidade !== c.provincia ? `${cidade}, ${c.provincia}` : c.provincia;
}

/** Iniciais para o monograma, sem artigos nem números soltos: "Amigos da Picada" → "AP". */
export function iniciaisClube(nome: string): string {
  const palavras = nome
    .split(/\s+/)
    .filter((p) => p && !/^(da|de|do|das|dos|e|a|o|in|the)$/i.test(p));
  const letras = palavras.map((p) => p[0]).filter((c) => /[\p{L}\d]/u.test(c));
  return letras.slice(0, 2).join("").toUpperCase() || "MC";
}

export type RedeClube = keyof Clube["redes"];

/** Nome e ícone (components/ui Icon) de cada rede. */
export const REDES_CLUBE: { chave: RedeClube; nome: string; icone: string }[] = [
  { chave: "instagram", nome: "Instagram", icone: "instagram" },
  { chave: "facebook", nome: "Facebook", icone: "facebook" },
  { chave: "whatsapp", nome: "WhatsApp", icone: "whatsapp" },
  { chave: "tiktok", nome: "TikTok", icone: "play" },
  { chave: "site", nome: "Site", icone: "share" },
];

/**
 * Endereço seguro para abrir numa nova janela. O painel aceita o que a
 * equipa escrever: "@clube" vira endereço do Instagram, um número vira
 * ligação do WhatsApp e só passam http(s).
 */
export function urlRede(chave: RedeClube, valor?: string): string | null {
  const v = valor?.trim();
  if (!v) return null;
  if (chave === "whatsapp" && /^\+?[\d\s()-]{8,}$/.test(v)) return `https://wa.me/${v.replace(/\D/g, "")}`;
  if (chave === "instagram" && /^@?[\w.]+$/.test(v)) return `https://www.instagram.com/${v.replace(/^@/, "")}/`;
  if (chave === "tiktok" && /^@?[\w.]+$/.test(v)) return `https://www.tiktok.com/@${v.replace(/^@/, "")}`;
  const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Redes preenchidas, pela ordem de REDES_CLUBE. */
export function redesDoClube(c: Pick<Clube, "redes">) {
  return REDES_CLUBE.flatMap((r) => {
    const url = urlRede(r.chave, c.redes?.[r.chave]);
    return url ? [{ ...r, url }] : [];
  });
}
