/* ============================================================
   MOTOBOX — Preferências do utilizador
   O que cada pessoa segue e as notificações que quer receber.
   Vivem nos metadados da conta do Supabase Auth
   (`user_metadata.preferencias`), escritos só pelo servidor em
   /api/conta, e são lidos pelo envio de notificações.
   ============================================================ */

export type TipoNotificacao =
  | "resultados" | "calendario" | "bilhetes" | "marketplace" | "forum" | "newsletter";

export type Canal = "email" | "push" | "whatsapp";

export interface Preferencias {
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
  pilotos: [],
  equipas: [],
  marcas: [],
  notificacoes: {
    resultados: true, calendario: true, bilhetes: true,
    marketplace: false, forum: true, newsletter: false,
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

/** Aceita qualquer valor guardado e devolve preferências completas e válidas. */
export function normalizarPreferencias(v: unknown): Preferencias {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    pilotos: lista(o.pilotos),
    equipas: lista(o.equipas),
    marcas: lista(o.marcas).filter((m) => MARCAS.includes(m)),
    notificacoes: bools(o.notificacoes, PREFERENCIAS_PADRAO.notificacoes),
    canais: bools(o.canais, PREFERENCIAS_PADRAO.canais),
  };
}
