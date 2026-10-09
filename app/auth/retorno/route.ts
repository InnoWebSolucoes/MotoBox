import { type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { redireccionar } from "@/lib/redireccionar";

/* Recebe o retorno do OAuth e troca o código pela sessão. */
export async function GET(pedido: NextRequest) {
  const { searchParams } = new URL(pedido.url);
  const codigo = searchParams.get("code");
  const pedidoDestino = searchParams.get("destino") ?? "/conta";
  const destino = /^\/(?!\/)[^\s\\]*$/.test(pedidoDestino) ? pedidoDestino : "/conta";

  if (!codigo) return redireccionar("/entrar");

  const resposta = redireccionar(destino);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => pedido.cookies.getAll(),
        setAll: (cookies) => {
          for (const { name, value, options } of cookies) {
            resposta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(codigo);
  if (error) return redireccionar("/entrar?erro=oauth");

  return resposta;
}
