/* ============================================================
   MOTOBOX — Clientes Supabase com sessão
   Três contextos, três clientes:
     · navegador  → componentes de cliente
     · servidor   → Server Components e rotas de API
     · middleware → renova a sessão a cada pedido

   Nenhum destes usa a chave de service role: a autenticação
   funciona com a chave pública e as políticas de RLS.
   ============================================================ */

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const authConfigurada = Boolean(URL && ANON);

/** Cliente para componentes marcados com "use client". */
export function supabaseNavegador() {
  return createBrowserClient(URL, ANON);
}

/**
 * Cliente para Server Components e rotas de API.
 * Recebe o `cookies()` do Next, já resolvido.
 */
export function supabaseServidor(loja: {
  get: (nome: string) => { value: string } | undefined;
  set?: (nome: string, valor: string, opcoes?: Record<string, unknown>) => void;
}) {
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* Em Server Components não é possível escrever cookies;
           a renovação acontece no middleware. */
      },
      get(nome: string) {
        return loja.get(nome)?.value;
      },
      set(nome: string, valor: string, opcoes: Record<string, unknown>) {
        loja.set?.(nome, valor, opcoes);
      },
      remove(nome: string, opcoes: Record<string, unknown>) {
        loja.set?.(nome, "", { ...opcoes, maxAge: 0 });
      },
    } as never,
  });
}

/** Cliente usado no middleware, que pode ler e escrever cookies. */
export function supabaseMiddleware(pedido: NextRequest, resposta: NextResponse) {
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return pedido.cookies.getAll();
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });
}
