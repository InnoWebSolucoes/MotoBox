/* ============================================================
   MOTOBOX — Preferências do utilizador
   O que cada pessoa segue e as notificações que quer receber.
   Vivem nos metadados da conta do Supabase Auth
   (`user_metadata.preferencias`), escritos só pelo servidor em
   /api/conta, e são lidos pelo envio de notificações. Os
   interesses seguem também para a linha de subscritor, onde a
   newsletter semanal os lê.
   ============================================================ */

import { eComunidade } from "@/lib/desporto";
import { ehProvincia, type Provincia } from "@/lib/provincias";

export type TipoNotificacao =
  | "resultados" | "calendario" | "bilhetes" | "marketplace" | "newsletter";

export type Canal = "email" | "push" | "whatsapp";

/* ---------------- Interesses ---------------- */

/**
 * Temas que cada pessoa quer acompanhar. A mesma lista serve as
 * preferências da conta e o formulário da newsletter. Os ids ficam
 * guardados (conta e tabela `subscritores`): não mudam. Os nomes
 * podem mudar à vontade.
 */
export const INTERESSES = [
  { id: "desporto", nome: "Campeonato e provas", descricao: "Resultados, classificação e provas de motocross, enduro e rally-raid." },
  { id: "eventos", nome: "Passeios e encontros", descricao: "Passeios, encontros, formações e acções da comunidade." },
  { id: "nacional", nome: "Notícias de Angola", descricao: "O que se passa no motociclismo angolano." },
  { id: "internacional", nome: "Notícias internacionais", descricao: "MotoGP, MXGP, Dakar e o resto do mundo." },
  { id: "marketplace", nome: "Marketplace", descricao: "Anúncios novos de motas, peças e equipamento." },
  { id: "solidaria", nome: "Acções solidárias", descricao: "Passeios solidários e campanhas dos clubes." },
  { id: "seguranca", nome: "Segurança e formação", descricao: "Formações e cursos de condução." },
] as const;

export type Interesse = (typeof INTERESSES)[number]["id"];

/** Nomes antigos dos botões da newsletter, para páginas abertas antes da mudança. */
const NOMES_ANTIGOS: Record<string, Interesse> = { "campeonato nacional": "desporto" };

/**
 * Sem interesses escolhidos, tudo interessa (é o que recebe quem nunca
 * escolheu). Com eles, basta um tema em comum.
 */
export const interessa = (escolhidos: readonly string[], temas: readonly Interesse[]) =>
  escolhidos.length === 0 || temas.some((t) => escolhidos.includes(t));

/** Temas de um evento, pela disciplina. Provas (e disciplinas desconhecidas) são Desporto. */
export function temasDoEvento(disciplina: string): Interesse[] {
  if (disciplina === "Solidária") return ["eventos", "solidaria"];
  if (disciplina === "Formação") return ["eventos", "seguranca"];
  return eComunidade(disciplina) ? ["eventos"] : ["desporto"];
}

/** Temas de uma notícia, pela categoria. Só "Internacional" é de fora. */
export function temasDaNoticia(categoria: string): Interesse[] {
  if (categoria === "Internacional") return ["internacional"];
  if (categoria === "Solidária") return ["nacional", "solidaria"];
  if (categoria === "Comunidade") return ["nacional", "eventos"];
  // "Angola" e "Entrevista": sobretudo o campeonato e os seus pilotos.
  return ["nacional", "desporto"];
}

/* ---------------- Preferências ---------------- */

export interface Preferencias {
  /** Temas (ids de INTERESSES). Vazio: tudo. */
  interesses: Interesse[];
  /** Clubes de lazer seguidos (slugs da tabela `clubes`). */
  clubes: string[];
  /** Províncias de onde quer saber dos eventos novos. */
  provincias: Provincia[];
  pilotos: string[];
  equipas: string[];
  marcas: string[];
  notificacoes: Record<TipoNotificacao, boolean>;
  canais: Record<Canal, boolean>;
}

export const MARCAS = [
  "KTM", "Honda", "Yamaha", "Husqvarna", "Kawasaki", "Suzuki", "BMW", "Royal Enfield",
];

/** Canais que já entregam mensagens. Os restantes aparecem como "brevemente". */
export const CANAIS_ACTIVOS: Canal[] = ["email"];

export const PREFERENCIAS_PADRAO: Preferencias = {
  interesses: [],
  clubes: [],
  provincias: [],
  pilotos: [],
  equipas: [],
  marcas: [],
  notificacoes: {
    resultados: true, calendario: true, bilhetes: true,
    marketplace: false, newsletter: false,
  },
  canais: { email: true, push: false, whatsapp: false },
};

const lista = (v: unknown, max = 200): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, max) : [];

const bools = <K extends string>(v: unknown, base: Record<K, boolean>): Record<K, boolean> => {
  const saida = { ...base };
  if (v && typeof v === "object") {
    for (const k of Object.keys(base) as K[]) {
      const x = (v as Record<string, unknown>)[k];
      if (typeof x === "boolean") saida[k] = x;
    }
  }
  return saida;
};

/**
 * Aceita ids ou nomes (os botões antigos da newsletter mandavam o
 * nome) e devolve ids válidos, sem repetidos, pela ordem de INTERESSES.
 */
export function normalizarInteresses(v: unknown): Interesse[] {
  const pedidos = new Set(
    lista(v, 50).map((x) => {
      const k = x.trim().toLowerCase();
      return NOMES_ANTIGOS[k] ?? INTERESSES.find((i) => i.id === k || i.nome.toLowerCase() === k)?.id;
    }),
  );
  return INTERESSES.map((i) => i.id).filter((id) => pedidos.has(id));
}

/**
 * Aceita qualquer valor guardado e devolve preferências completas e
 * válidas. Preferências antigas, sem interesses, clubes ou províncias,
 * ficam com as listas vazias.
 */
export function normalizarPreferencias(v: unknown): Preferencias {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    interesses: normalizarInteresses(o.interesses),
    clubes: [...new Set(lista(o.clubes))],
    provincias: [...new Set(lista(o.provincias).filter(ehProvincia))],
    pilotos: lista(o.pilotos),
    equipas: lista(o.equipas),
    marcas: lista(o.marcas).filter((m) => MARCAS.includes(m)),
    notificacoes: bools(o.notificacoes, PREFERENCIAS_PADRAO.notificacoes),
    canais: bools(o.canais, PREFERENCIAS_PADRAO.canais),
  };
}
