import "server-only";

/* ============================================================
   MOTOBOX — Sessão nas rotas de API da conta
   Lê o utilizador a partir dos cookies do pedido. As rotas de
   /api/conta usam depois o cliente de service role, mas só
   depois de saberem quem é e apenas sobre os dados dessa pessoa.
   ============================================================ */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";

export interface PerfilConta {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  provincia: string | null;
  avatar_cor: string;
  registado: string;
  verificado: boolean;
  newsletter: boolean;
  estado: string;
}

/** Utilizador com sessão iniciada, ou null. */
export async function utilizadorActual(): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const loja = await cookies();
  const sb = createServerClient(url, anon, {
    cookies: {
      getAll: () => loja.getAll(),
      setAll: (lista) => {
        // Renovar o token aqui é opcional; o middleware também o faz.
        try { for (const { name, value, options } of lista) loja.set(name, value, options); } catch { /* só leitura */ }
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/** Linha de `utilizadores` ligada à conta. */
export async function perfilDe(user: User): Promise<PerfilConta | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data } = await db
    .from("utilizadores")
    .select("id, nome, email, telefone, provincia, avatar_cor, registado, verificado, newsletter, estado")
    .eq("auth_id", user.id)
    .maybeSingle();
  return (data as PerfilConta | null) ?? null;
}
