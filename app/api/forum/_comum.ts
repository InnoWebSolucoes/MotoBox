import "server-only";

/* ============================================================
   MOTOBOX — Fórum: regras partilhadas pelas rotas de membros
   (criar tópico, votar). A mesma verificação de conta que
   /api/forum/responder faz: suspensa ou banida não escreve.
   ============================================================ */

import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { perfilDe, type PerfilConta } from "@/lib/conta/sessao";
import { corValida } from "@/lib/forum/respostas";
import { COR_PADRAO } from "@/lib/forum/tipos";

export function erro(mensagem: string, codigo = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ erro: mensagem, ...extra }, { status: codigo });
}

/** Para comparar o email com `ilike` sem que "_" ou "%" funcionem como curingas. */
const literal = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * O perfil da conta e se pode publicar. A linha procura-se pela conta e
 * também pelo email: uma suspensão feita no painel antes de a conta estar
 * ligada continua a valer.
 */
export async function verificarConta(db: SupabaseClient, user: User): Promise<{ perfil: PerfilConta | null; bloqueada: boolean }> {
  const email = (user.email ?? "").trim().toLowerCase();
  const [perfil, porEmail] = await Promise.all([
    perfilDe(user),
    email
      ? db.from("utilizadores").select("estado").ilike("email", literal(email)).limit(5)
      : Promise.resolve({ data: [] as { estado: string }[] }),
  ]);
  const estados = [perfil?.estado, ...((porEmail.data ?? []) as { estado: string }[]).map((l) => l.estado)];
  return { perfil, bloqueada: estados.some((e) => e === "suspenso" || e === "banido") };
}

/** Nome e cor de quem publica: sempre da conta, nunca do que o navegador diz. */
export function identidade(user: User, perfil: PerfilConta | null) {
  const nomeMeta = typeof user.user_metadata?.nome === "string" ? user.user_metadata.nome.trim() : "";
  const nome = (perfil?.nome?.trim() || nomeMeta || "Membro Motobox").slice(0, 80);
  const cor = corValida(perfil?.avatar_cor) ?? corValida(user.user_metadata?.avatarCor) ?? COR_PADRAO;
  return { nome, cor };
}

/*
 * Travão simples em memória (por instância do servidor), para quem carrega
 * muitas vezes seguidas no mesmo botão.
 */
const pedidos = new Map<string, number[]>();
export function devagar(chave: string, maximo: number, janelaMs: number): boolean {
  const agora = Date.now();
  const lista = (pedidos.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  if (lista.length >= maximo) {
    pedidos.set(chave, lista);
    return true;
  }
  lista.push(agora);
  pedidos.set(chave, lista);
  if (pedidos.size > 5000) pedidos.clear();
  return false;
}
