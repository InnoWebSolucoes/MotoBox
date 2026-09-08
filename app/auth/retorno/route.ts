import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/* Recebe o retorno do OAuth e troca o código pela sessão. */
export async function GET(pedido: NextRequest) {
  const { searchParams, origin } = new URL(pedido.url);
  const codigo = searchParams.get("code");
  const destino = searchParams.get("destino") ?? "/conta";

  if (!codigo) return NextResponse.redirect(`${origin}/entrar`);

  const resposta = NextResponse.redirect(`${origin}${destino}`);

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
  if (error) return NextResponse.redirect(`${origin}/entrar?erro=oauth`);

  return resposta;
}
