import { NextResponse, type NextRequest } from "next/server";
import { supabaseMiddleware, authConfigurada } from "@/lib/auth/clientes";

/* ============================================================
   MOTOBOX — Proteção de rotas
   Renova a sessão a cada pedido e barra o acesso ao painel de
   gestão e à API de administração a quem não tenha sessão com
   papel adequado.
   ============================================================ */

/** Papéis autorizados a entrar no painel. */
const PAPEIS_PAINEL = ["admin", "editor", "moderador", "financeiro", "leitor"];

export async function middleware(pedido: NextRequest) {
  const resposta = NextResponse.next({ request: pedido });
  const caminho = pedido.nextUrl.pathname;

  const protegido =
    caminho.startsWith("/admin") || caminho.startsWith("/api/admin");
  const areaConta = caminho.startsWith("/conta");

  if (!protegido && !areaConta) return resposta;

  // Sem Supabase configurado o site corre em demonstração; barrar
  // aqui deixaria o painel inacessível sem alternativa.
  if (!authConfigurada) return resposta;

  const supabase = supabaseMiddleware(pedido, resposta);
  const { data: { user } } = await supabase.auth.getUser();

  /* ---------- Área de conta do visitante ---------- */
  if (areaConta) {
    if (!user) {
      const url = pedido.nextUrl.clone();
      url.pathname = "/entrar";
      url.searchParams.set("destino", caminho);
      return NextResponse.redirect(url);
    }
    return resposta;
  }

  /* ---------- Painel de gestão ---------- */
  if (!user) {
    // A API responde em JSON; as páginas redirecionam para o login.
    if (caminho.startsWith("/api/")) {
      return NextResponse.json(
        { erro: "Sessão necessária." },
        { status: 401 },
      );
    }
    const url = pedido.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("destino", caminho);
    return NextResponse.redirect(url);
  }

  // O papel vive na tabela `utilizadores`, indexada pelo email.
  const { data: perfil } = await supabase
    .from("utilizadores")
    .select("papel, estado")
    .eq("email", user.email ?? "")
    .maybeSingle();

  const papel = perfil?.papel as string | undefined;
  const estado = perfil?.estado as string | undefined;

  const autorizado =
    papel !== undefined &&
    PAPEIS_PAINEL.includes(papel) &&
    estado !== "suspenso" &&
    estado !== "banido";

  if (!autorizado) {
    if (caminho.startsWith("/api/")) {
      return NextResponse.json(
        { erro: "Sem permissão para esta área." },
        { status: 403 },
      );
    }
    const url = pedido.nextUrl.clone();
    url.pathname = "/sem-acesso";
    return NextResponse.redirect(url);
  }

  // Escrita exige mais do que o papel de leitor.
  const escrita = ["POST", "PATCH", "PUT", "DELETE"].includes(pedido.method);
  if (escrita && caminho.startsWith("/api/admin") && papel === "leitor") {
    return NextResponse.json(
      { erro: "O seu papel permite apenas consulta." },
      { status: 403 },
    );
  }

  return resposta;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/conta/:path*",
  ],
};
