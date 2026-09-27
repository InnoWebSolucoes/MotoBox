"use client";

/* ============================================================
   MOTOBOX — Sessão do utilizador
   Expõe a sessão actual, o perfil (com o papel) e as operações
   de entrada, registo e saída.
   ============================================================ */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabaseNavegador, authConfigurada, urlBase } from "./clientes";
import type { Papel } from "@/lib/admin/types";
import { comBase } from "@/lib/base";

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  papel: Papel;
  estado: string;
  provincia?: string;
  avatarCor: string;
  /** Logótipo ou fotografia da conta (pasta pública `avatares`). Sem ele, a inicial sobre a cor. */
  avatarUrl?: string;
  verificado: boolean;
  newsletter: boolean;
}

/**
 * O logótipo vive no user_metadata, que o próprio utilizador também pode
 * escrever com a chave pública. Só se aceita um endereço da sua pasta em
 * `avatares`, que é onde /api/conta/avatar o põe.
 */
function avatarDe(u: User): string | undefined {
  const url = u.user_metadata?.avatarUrl;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!base || typeof url !== "string") return undefined;
  return url.startsWith(`${base}/storage/v1/object/public/avatares/${u.id}/`) ? url : undefined;
}

interface ContextoAuth {
  utilizador: User | null;
  sessao: Session | null;
  perfil: Perfil | null;
  carregando: boolean;
  /** Verdadeiro para quem tem acesso ao painel de gestão. */
  equipa: boolean;
  entrar: (email: string, palavra: string) => Promise<string | null>;
  registar: (dados: {
    nome: string; email: string; palavra: string; newsletter: boolean;
    /** Página para onde a ligação de confirmação traz a pessoa. */
    destino?: string;
  }) => Promise<string | null>;
  /** Verdadeiro só quando o Google está activo no Supabase. */
  googleActivo: boolean;
  entrarComGoogle: () => Promise<string | null>;
  recuperar: (email: string) => Promise<string | null>;
  reenviarConfirmacao: (email: string, destino?: string) => Promise<string | null>;
  definirPalavra: (nova: string) => Promise<string | null>;
  sair: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
}

const Ctx = createContext<ContextoAuth | null>(null);

/** Papéis com acesso ao painel. Quem se regista no site fica "leitor", sem acesso. */
const PAPEIS_EQUIPA = ["admin", "editor", "moderador", "financeiro"];

/** Traduz os erros do Supabase para mensagens legíveis. */
function mensagem(erro: string): string {
  const m = erro.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou palavra-passe incorretos.";
  if (m.includes("email not confirmed")) return "Confirme o email antes de entrar. Verifique a sua caixa de entrada.";
  if (m.includes("user already registered")) return "Já existe uma conta com este email.";
  if (m.includes("password should be at least")) return "A palavra-passe tem de ter pelo menos 8 caracteres.";
  if (m.includes("unable to validate email")) return "Endereço de email inválido.";
  if (m.includes("over_email_send_rate_limit") || m.includes("email rate limit"))
    return "O limite de emails do servidor foi atingido. Tente daqui a uma hora, ou peça a um administrador para confirmar a conta manualmente.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiadas tentativas. Aguarde um momento.";
  if (m.includes("provider is not enabled")) return "Este método de entrada ainda não está activo.";
  return erro;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  const cliente = useMemo(() => (authConfigurada ? supabaseNavegador() : null), []);

  const lerPerfil = useCallback(async (u: User | null) => {
    if (!cliente || !u) { setPerfil(null); return; }
    const { data } = await cliente
      .from("utilizadores")
      .select("id, nome, email, telefone, papel, estado, provincia, avatar_cor, verificado, newsletter")
      .eq("auth_id", u.id)
      .maybeSingle();

    if (data) {
      setPerfil({
        id: data.id as string,
        nome: data.nome as string,
        email: data.email as string,
        telefone: (data.telefone as string) ?? undefined,
        papel: data.papel as Papel,
        estado: data.estado as string,
        provincia: (data.provincia as string) ?? undefined,
        avatarCor: (data.avatar_cor as string) ?? "#e10600",
        avatarUrl: avatarDe(u),
        verificado: Boolean(data.verificado),
        newsletter: Boolean(data.newsletter),
      });
    } else {
      setPerfil(null);
    }
  }, [cliente]);

  useEffect(() => {
    if (!cliente) { setCarregando(false); return; }

    cliente.auth.getSession().then(async ({ data }) => {
      setSessao(data.session);
      await lerPerfil(data.session?.user ?? null);
      setCarregando(false);
    });

    const { data: sub } = cliente.auth.onAuthStateChange(async (_evento, s) => {
      setSessao(s);
      await lerPerfil(s?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, [cliente, lerPerfil]);

  const semAuth = "A autenticação ainda não está configurada.";

  const entrar = useCallback<ContextoAuth["entrar"]>(async (email, palavra) => {
    if (!cliente) return semAuth;
    const { error } = await cliente.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: palavra,
    });
    return error ? mensagem(error.message) : null;
  }, [cliente]);

  /**
   * O registo e a recuperação passam pelo servidor do site, que envia
   * os emails pela Resend. O servidor de email do Supabase (limitado e
   * que não chegava ao Gmail) deixa de ser usado nestes dois casos.
   */
  const pedirAoServidor = useCallback(async (rota: string, corpo: unknown): Promise<string | null> => {
    try {
      const r = await fetch(comBase(rota), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (r.ok) return null;
      const j = await r.json().catch(() => ({}));
      return String(j.erro ?? `Erro ${r.status}. Tente de novo.`);
    } catch {
      return "Sem ligação à internet. Tente de novo.";
    }
  }, []);

  const registar = useCallback<ContextoAuth["registar"]>(async (d) => {
    if (!cliente) return semAuth;
    return pedirAoServidor("/api/conta/registar", {
      nome: d.nome, email: d.email, palavra: d.palavra, newsletter: d.newsletter,
      destino: d.destino ?? "/conta",
    });
  }, [cliente, pedirAoServidor]);

  const reenviarConfirmacao = useCallback<ContextoAuth["reenviarConfirmacao"]>(async (email, destino) => {
    if (!cliente) return semAuth;
    return pedirAoServidor("/api/conta/reenviar", { email, destino: destino ?? "/conta" });
  }, [cliente, pedirAoServidor]);

  // O botão do Google só aparece quando o fornecedor está activo no Supabase:
  // sem isso, carregar nele devolvia "provider is not enabled".
  const [googleActivo, setGoogleActivo] = useState(false);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !chave) return;
    let vivo = true;
    fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: chave } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivo) setGoogleActivo(Boolean(d?.external?.google)); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  const entrarComGoogle = useCallback<ContextoAuth["entrarComGoogle"]>(async () => {
    if (!cliente) return semAuth;
    const { error } = await cliente.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${urlBase()}/auth/retorno` },
    });
    return error ? mensagem(error.message) : null;
  }, [cliente]);

  const recuperar = useCallback<ContextoAuth["recuperar"]>(async (email) => {
    if (!cliente) return semAuth;
    return pedirAoServidor("/api/conta/recuperar", { email });
  }, [cliente, pedirAoServidor]);

  const definirPalavra = useCallback<ContextoAuth["definirPalavra"]>(async (nova) => {
    if (!cliente) return semAuth;
    const { error } = await cliente.auth.updateUser({ password: nova });
    return error ? mensagem(error.message) : null;
  }, [cliente]);

  const sair = useCallback(async () => {
    if (!cliente) return;
    await cliente.auth.signOut();
    setPerfil(null);
  }, [cliente]);

  const recarregarPerfil = useCallback(async () => {
    if (!cliente || !sessao) { await lerPerfil(sessao?.user ?? null); return; }
    // O servidor muda o user_metadata (o logótipo, por exemplo), mas a sessão
    // guardada no navegador não se actualiza sozinha: um token novo traz o
    // utilizador como está agora.
    const { data } = await cliente.auth.refreshSession();
    if (data.session) setSessao(data.session);
    await lerPerfil(data.session?.user ?? sessao.user);
  }, [cliente, lerPerfil, sessao]);

  const valor = useMemo<ContextoAuth>(() => ({
    utilizador: sessao?.user ?? null,
    sessao,
    perfil,
    carregando,
    equipa: Boolean(
      perfil && PAPEIS_EQUIPA.includes(perfil.papel) &&
      !["suspenso", "banido"].includes(perfil.estado),
    ),
    entrar, registar, googleActivo, entrarComGoogle, recuperar, reenviarConfirmacao,
    definirPalavra, sair, recarregarPerfil,
  }), [sessao, perfil, carregando, entrar, registar, googleActivo, entrarComGoogle,
       recuperar, reenviarConfirmacao, definirPalavra, sair, recarregarPerfil]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth tem de ser usado dentro de <AuthProvider>");
  return ctx;
}
