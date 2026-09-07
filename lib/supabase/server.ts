import "server-only";

/* ============================================================
   MOTOBOX — Clientes Supabase do lado do servidor
   `server-only` faz falhar a compilação se este ficheiro for
   importado por um componente de cliente, o que impede a chave
   de service role de chegar ao navegador.
   ============================================================ */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Verdadeiro quando as variáveis mínimas de leitura existem. */
export const supabaseConfigurado = Boolean(url && anon);

/** Verdadeiro quando a escrita administrativa está disponível. */
export const supabaseAdminConfigurado = Boolean(url && service);

/**
 * Cliente de leitura pública (chave anónima, sujeito a RLS).
 * Usado pelas páginas públicas para ler conteúdo publicado.
 */
export function supabasePublico(): SupabaseClient | null {
  if (!url || !anon) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente administrativo (service role, ignora RLS).
 *
 * NUNCA importar a partir de um componente de cliente. Só deve
 * ser usado em rotas de API e Server Components.
 */
export function supabaseAdmin(): SupabaseClient | null {
  if (!url || !service) return null;
  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
