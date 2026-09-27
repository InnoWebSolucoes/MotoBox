import { type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { redireccionar } from "@/lib/redireccionar";

/* ============================================================
   MOTOBOX — Ligações dos emails de conta
   Confirmação de conta e recuperação de palavra-passe chegam aqui
   com um token. Trocado pela sessão, a pessoa segue já com sessão
   iniciada para onde estava (ou para definir a nova palavra-passe).
   ============================================================ */

const TIPOS: EmailOtpType[] = ["signup", "magiclink", "recovery", "email", "invite", "email_change"];

export async function GET(pedido: NextRequest) {
  const { searchParams } = new URL(pedido.url);
  const hash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const pedidoDestino = searchParams.get("destino") ?? "/conta";
  const destino = /^\/(?!\/)/.test(pedidoDestino) ? pedidoDestino : "/conta";

  if (!hash || !tipo || !TIPOS.includes(tipo)) {
    return redireccionar("/entrar?erro=ligacao");
  }

  const final = tipo === "recovery"
    ? "/nova-palavra-passe"
    : `${destino}${destino.includes("?") ? "&" : "?"}confirmado=1`;
  const resposta = redireccionar(final);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => pedido.cookies.getAll(),
        setAll: (cookies) => {
          for (const { name, value, options } of cookies) resposta.cookies.set(name, value, options);
        },
      },
    },
  );

  const { error } = await supabase.auth.verifyOtp({ token_hash: hash, type: tipo });
  if (error) return redireccionar("/entrar?erro=ligacao");
  return resposta;
}
