import { NextResponse, type NextRequest } from "next/server";
import { comBase } from "@/lib/base";

/**
 * Redirecção com um Location relativo ("/motobox/…").
 *
 * Os pedidos chegam por proxy de innoweb.agency, por isso o endereço do
 * próprio pedido é o *.vercel.app deste projecto. Um Location absoluto
 * construído a partir dele tirava a pessoa do domínio da Innoweb (e dos
 * cookies de sessão, que ficam em innoweb.agency). Relativo, o navegador
 * resolve-o no domínio onde está.
 */
export function redireccionar(caminho: string, estado = 307): NextResponse {
  return new NextResponse(null, { status: estado, headers: { Location: comBase(caminho) } });
}

/**
 * Versão para o middleware, que não aceita Location relativo: monta o
 * endereço completo a partir do domínio público (NEXT_PUBLIC_SITE_URL,
 * innoweb.agency em produção) e, sem ele, do próprio pedido (desenvolvimento).
 */
export function redireccionarAbsoluto(pedido: NextRequest, caminho: string): NextResponse {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const origem = site ? new URL(site).origin : pedido.nextUrl.origin;
  return NextResponse.redirect(new URL(comBase(caminho), origem));
}
