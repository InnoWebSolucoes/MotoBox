import "server-only";

/* ============================================================
   MOTOBOX — Quem escreve no fórum (servidor)
   As rotas que abrem tópicos e publicam respostas perguntam aqui
   se a conta pode escrever e com que nome, cor e logótipo
   aparece. Tudo vem da conta: nunca do que o navegador diz
   sobre quem escreve.
   ============================================================ */

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { perfilDe } from "@/lib/conta/sessao";
import { avatarDaConta, corValida } from "./respostas";
import { COR_PADRAO } from "./tipos";

export interface AutorForum {
  /** Conta suspensa ou banida: não publica. */
  bloqueada: boolean;
  nome: string;
  cor: string;
  /** Logótipo da conta, ou null. */
  avatar: string | null;
}

/** Para comparar o email com `ilike` sem que "_" ou "%" funcionem como curingas. */
const literal = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function autorDaConta(db: SupabaseClient, user: User): Promise<AutorForum> {
  // A linha procura-se pela conta e também pelo email: uma suspensão feita no
  // painel antes de a conta estar ligada continua a valer.
  const email = (user.email ?? "").trim().toLowerCase();
  const [perfil, porEmail] = await Promise.all([
    perfilDe(user),
    email
      ? db.from("utilizadores").select("estado").ilike("email", literal(email)).limit(5)
      : Promise.resolve({ data: [] as { estado: string }[] }),
  ]);
  const estados = [perfil?.estado, ...((porEmail.data ?? []) as { estado: string }[]).map((l) => l.estado)];

  const nomeMeta = typeof user.user_metadata?.nome === "string" ? user.user_metadata.nome.trim() : "";
  return {
    bloqueada: estados.some((e) => e === "suspenso" || e === "banido"),
    nome: (perfil?.nome?.trim() || nomeMeta || "Membro Motobox").slice(0, 80),
    cor: corValida(perfil?.avatar_cor) ?? corValida(user.user_metadata?.avatarCor) ?? COR_PADRAO,
    avatar: avatarDaConta(user),
  };
}
