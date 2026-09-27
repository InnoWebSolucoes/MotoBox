import "server-only";
import { urlSite } from "@/lib/email";

/* ============================================================
   MOTOBOX — Ligações dos emails de conta
   Confirmação e recuperação levam ao /auth/confirmar do próprio
   site, que troca o token por uma sessão e segue para o destino.
   ============================================================ */

/** Só caminhos do próprio site: nada de "//outro-site" nem endereços completos. */
export function destinoSeguro(v: unknown, omissao = "/conta"): string {
  return typeof v === "string" && /^\/(?!\/)[^\s]*$/.test(v) ? v : omissao;
}

export function ligacaoConfirmacao(hash: string, tipo: string, destino: string): string {
  const q = new URLSearchParams({ token_hash: hash, type: tipo, destino });
  return `${urlSite()}/auth/confirmar?${q}`;
}
