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
import { supabaseNavegador, authConfigurada } from "./clientes";
import type { Papel } from "@/lib/admin/types";

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  papel: Papel;
  estado: string;
  provincia?: string;
  avatarCor: string;
  verificado: boolean;
  newsletter: boolean;
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
  }) => Promise<string | null>;
  entrarComGoogle: () => Promise<string | null>;
  recuperar: (email: string) => Promise<string | null>;
  definirPalavra: (nova: string) => Promise<string | null>;
  sair: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
}

const Ctx = createContext<ContextoAuth | null>(null);

const PAPEIS_EQUIPA = ["admin", "editor", "moderador", "financeiro", "leitor"];

/** Traduz os erros do Supabase para mensagens legíveis. */
function mensagem(erro: string): string {
  const m = erro.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou palavra-passe incorretos.";
  if (m.includes("email not confirmed")) return "Confirme o email antes de entrar. Verifique a sua caixa de entrada.";
  if (m.includes("user already registered")) return "Já existe uma conta com este email.";
  if (m.includes("password should be at least")) return "A palavra-passe tem de ter pelo menos 8 caracteres.";
  if (m.includes("unable to validate email")) return "Endereço de email inválido.";
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

  const registar = useCallback<ContextoAuth["registar"]>(async (d) => {
    if (!cliente) return semAuth;
    const { error } = await cliente.auth.signUp({
      email: d.email.trim().toLowerCase(),
      password: d.palavra,
      options: {
        data: { nome: d.nome.trim(), newsletter: d.newsletter },
        emailRedirectTo: `${window.location.origin}/entrar?confirmado=1`,
      },
    });
    return error ? mensagem(error.message) : null;
  }, [cliente]);

  const entrarComGoogle = useCallback<ContextoAuth["entrarComGoogle"]>(async () => {
    if (!cliente) return semAuth;
    const { error } = await cliente.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/retorno` },
    });
    return error ? mensagem(error.message) : null;
  }, [cliente]);

  const recuperar = useCallback<ContextoAuth["recuperar"]>(async (email) => {
    if (!cliente) return semAuth;
    const { error } = await cliente.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/nova-palavra-passe` },
    );
    return error ? mensagem(error.message) : null;
  }, [cliente]);

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
    await lerPerfil(sessao?.user ?? null);
  }, [lerPerfil, sessao]);

  const valor = useMemo<ContextoAuth>(() => ({
    utilizador: sessao?.user ?? null,
    sessao,
    perfil,
    carregando,
    equipa: Boolean(
      perfil && PAPEIS_EQUIPA.includes(perfil.papel) &&
      !["suspenso", "banido"].includes(perfil.estado),
    ),
    entrar, registar, entrarComGoogle, recuperar, definirPalavra, sair,
    recarregarPerfil,
  }), [sessao, perfil, carregando, entrar, registar, entrarComGoogle,
       recuperar, definirPalavra, sair, recarregarPerfil]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth tem de ser usado dentro de <AuthProvider>");
  return ctx;
}
