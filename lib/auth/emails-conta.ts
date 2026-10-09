import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lerDoc } from "@/lib/conteudo";
import { CONTAS_PADRAO, comPadraoContas, type ConteudoContas } from "@/lib/conteudo/grupos/contas";
import {
  emailDoModelo, enviarEmail, lerConfigEmails, primeiroNome,
  type ConfigEmails, type ResultadoEmail,
} from "@/lib/email";
import { ligacaoConfirmacao } from "./ligacoes";

/* ============================================================
   MOTOBOX — Emails da conta (registo, confirmação, recuperação)
   As ligações nascem no Supabase (auth.admin.generateLink) e o
   email sai pela Resend, com os textos do painel. O servidor de
   email do Supabase nunca é usado: não entrega fora da equipa.
   ============================================================ */

/** Os textos de /entrar e das respostas do registo, com os de partida por baixo. */
export async function textosContas(): Promise<ConteudoContas> {
  return comPadraoContas(CONTAS_PADRAO, await lerDoc<unknown>("site.contas").catch(() => null));
}

/**
 * Frase para quem está no site público. Os erros de configuração
 * (chave, domínio por verificar) ficam no registo do servidor e no
 * painel; aqui diz-se o essencial, sem termos técnicos.
 */
export function erroPublico(r: Extract<ResultadoEmail, { ok: false }>): string {
  if (r.estado === 422) return "O endereço de email foi recusado. Confirme se está bem escrito.";
  if (r.estado === 429) return "Foram pedidos demasiados emails seguidos. Tente de novo daqui a um minuto.";
  if (r.estado === 401 || r.estado === 403 || r.estado === 503) {
    return "De momento o site não consegue enviar emails. Tente de novo mais tarde ou fale com a equipa MotoBox.";
  }
  return "O email não seguiu. Tente de novo dentro de momentos.";
}

/** Envia a ligação de confirmação da conta. */
export async function enviarConfirmacao(c: {
  email: string; nome?: string; hash: string; tipo: string; destino: string; cfg?: ConfigEmails;
}): Promise<ResultadoEmail> {
  const cfg = c.cfg ?? (await lerConfigEmails());
  const primeiro = primeiroNome(c.nome);
  const corpo = emailDoModelo(cfg, "contaConfirmar", { nome: primeiro || "" }, {
    url: ligacaoConfirmacao(c.hash, c.tipo, c.destino),
  });
  // "Olá, ." quando não há nome: tira-se a vírgula sozinha.
  const limpar = (s: string) => s.replace(/Olá, \./g, "Olá.");
  return enviarEmail({
    para: c.email,
    assunto: corpo.assunto,
    html: limpar(corpo.html),
    texto: limpar(corpo.texto),
    tipo: "contaConfirmar",
  }, cfg);
}

/** Envia a ligação para escolher uma nova palavra-passe. */
export async function enviarRecuperacao(c: { email: string; hash: string; tipo: string; cfg?: ConfigEmails }): Promise<ResultadoEmail> {
  const cfg = c.cfg ?? (await lerConfigEmails());
  const corpo = emailDoModelo(cfg, "contaRecuperar", {}, {
    url: ligacaoConfirmacao(c.hash, c.tipo, "/nova-palavra-passe"),
  });
  return enviarEmail({ para: c.email, assunto: corpo.assunto, html: corpo.html, texto: corpo.texto, tipo: "contaRecuperar" }, cfg);
}

/** Para comparar o email com `ilike` sem que "_" ou "%" funcionem como curingas. */
const literal = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * A conta (Supabase Auth) de um email, sem a criar. Procura-se na
 * tabela `utilizadores`, que um gatilho preenche a cada conta nova:
 * o generateLink do tipo "magiclink" criava uma conta para um email
 * desconhecido, e não pode servir para perguntar se ela existe.
 */
export async function contaPorEmail(db: SupabaseClient, email: string): Promise<{ id: string; confirmada: boolean; nome: string } | null> {
  const { data: linhas } = await db
    .from("utilizadores").select("auth_id").ilike("email", literal(email)).not("auth_id", "is", null).limit(3);
  for (const l of (linhas ?? []) as { auth_id: string | null }[]) {
    if (!l.auth_id) continue;
    const { data } = await db.auth.admin.getUserById(l.auth_id);
    const u = data?.user;
    if (u && (u.email ?? "").toLowerCase() === email) {
      const nome = typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome : "";
      return { id: u.id, confirmada: Boolean(u.email_confirmed_at), nome };
    }
  }
  return null;
}
