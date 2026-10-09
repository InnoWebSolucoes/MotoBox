import "server-only";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA: quem está a pedir
   O proxy já barra quem não é da equipa. Aqui lê-se o papel
   (tabela `utilizadores`, como no proxy) para saber o que o
   Organizador pode fazer em nome de quem pede: os papéis sem
   permissão de escrita só recebem as ferramentas de leitura,
   e cada mudança é verificada outra vez antes de executar.
   ============================================================ */

import { utilizadorActual } from "@/lib/conta/sessao";
import { supabaseAdmin } from "@/lib/supabase/server";
import { authConfigurada } from "@/lib/auth/clientes";
import { PERMISSOES_POR_PAPEL, type Papel, type Permissao } from "@/lib/admin/types";

export interface Quem {
  nome: string;
  email: string;
  papel: Papel | null;
  permissoes: Set<Permissao>;
}

const PAPEIS_PAINEL: Papel[] = ["admin", "editor", "moderador", "financeiro"];

/** Permissões de escrita: sem nenhuma, o Organizador só lê. */
const ESCRITA: Permissao[] = [
  "conteudo.escrever", "conteudo.publicar", "conteudo.apagar", "comunidade.moderar",
  "comercial.escrever", "utilizadores.escrever", "definicoes.escrever",
];

export const podeEscrever = (q: Quem) => ESCRITA.some((p) => q.permissoes.has(p));

export function quemCom(papel: Papel | null, nome = "", email = ""): Quem {
  return { nome, email, papel, permissoes: new Set(papel ? PERMISSOES_POR_PAPEL[papel] ?? [] : []) };
}

/**
 * Quem faz o pedido, ou null se não tiver acesso ao painel.
 * Sem autenticação configurada (só em desenvolvimento), o painel
 * abre em demonstração e conta como administrador, como no proxy.
 */
export async function quemPede(): Promise<Quem | null> {
  if (!authConfigurada) {
    return process.env.NODE_ENV === "production" ? null : quemCom("admin", "Demonstração");
  }
  const user = await utilizadorActual();
  if (!user) return null;
  const db = supabaseAdmin();
  if (!db) return null;
  const { data } = await db
    .from("utilizadores")
    .select("nome, email, papel, estado")
    .eq("email", user.email ?? "")
    .maybeSingle();
  const papel = data?.papel as Papel | undefined;
  const estado = data?.estado as string | undefined;
  if (!papel || !PAPEIS_PAINEL.includes(papel) || estado === "suspenso" || estado === "banido") return null;
  return quemCom(papel, String(data?.nome ?? user.email ?? ""), String(data?.email ?? user.email ?? ""));
}
