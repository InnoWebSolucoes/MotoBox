"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";

type Modo = "entrar" | "registar" | "recuperar";

export function EntrarClient() {
  const { t } = useIdioma();
  const { entrar, registar, entrarComGoogle, recuperar, utilizador, carregando } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const destino = params.get("destino") ?? "/conta";

  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [palavra, setPalavra] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Quem já tem sessão não precisa desta página.
  useEffect(() => {
    if (!carregando && utilizador) router.replace(destino);
  }, [carregando, utilizador, destino, router]);

  useEffect(() => {
    if (params.get("confirmado")) setAviso(t("auth.emailConfirmado"));
  }, [params, t]);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null); setAviso(null); setOcupado(true);

    let falha: string | null = null;

    if (modo === "entrar") {
      falha = await entrar(email, palavra);
      if (!falha) router.replace(destino);
    } else if (modo === "registar") {
      if (palavra.length < 8) {
        falha = t("auth.palavraCurta");
      } else {
        falha = await registar({ nome, email, palavra, newsletter });
        if (!falha) setAviso(t("auth.verifiqueEmail"));
      }
    } else {
      falha = await recuperar(email);
      if (!falha) setAviso(t("auth.recuperacaoEnviada"));
    }

    setErro(falha);
    setOcupado(false);
  };

  const google = async () => {
    setErro(null); setOcupado(true);
    const falha = await entrarComGoogle();
    if (falha) { setErro(falha); setOcupado(false); }
  };

  const campo =
    "w-full border border-ink-700 bg-ink-950 px-3 py-2.5 text-sm text-white " +
    "placeholder:text-ink-600 outline-none transition-colors focus:border-mb-red";
  const etiqueta =
    "mb-1.5 block text-[11px] font-display uppercase tracking-widest text-ink-300";

  const titulo =
    modo === "entrar" ? t("auth.entrar")
    : modo === "registar" ? t("auth.criarConta")
    : t("auth.recuperarAcesso");

  return (
    <div className="relative overflow-hidden">
      <Placeholder nome="entrar" className="absolute inset-0 opacity-15" tamanhos="100vw" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/95 to-ink-950" aria-hidden />
      <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8">
        <p className="eyebrow mb-2 text-mb-red">Motobox Angola</p>
        <h1 className="title-xl text-3xl text-white sm:text-4xl">{titulo}</h1>
        <p className="mt-2 text-sm text-ink-400">
          {modo === "entrar" ? t("auth.entrarSub")
           : modo === "registar" ? t("auth.registarSub")
           : t("auth.recuperarSub")}
        </p>
      </div>

      {aviso && (
        <p role="status" className="mb-4 border border-ok/40 bg-ok/10 px-3 py-2.5 text-sm text-ok">
          {aviso}
        </p>
      )}
      {erro && (
        <p role="alert" className="mb-4 border border-mb-red/40 bg-mb-red/10 px-3 py-2.5 text-sm text-mb-red">
          {erro}
        </p>
      )}

      <form onSubmit={submeter} className="space-y-4">
        {modo === "registar" && (
          <label className="block">
            <span className={etiqueta}>{t("auth.nome")}</span>
            <input className={campo} value={nome} required autoComplete="name"
              onChange={(e) => setNome(e.target.value)} placeholder={t("auth.nomePlaceholder")} />
          </label>
        )}

        <label className="block">
          <span className={etiqueta}>{t("comum.email")}</span>
          <input className={campo} type="email" value={email} required autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} />
        </label>

        {modo !== "recuperar" && (
          <label className="block">
            <span className={etiqueta}>{t("auth.palavraPasse")}</span>
            <input className={campo} type="password" value={palavra} required
              autoComplete={modo === "registar" ? "new-password" : "current-password"}
              minLength={modo === "registar" ? 8 : undefined}
              onChange={(e) => setPalavra(e.target.value)}
              placeholder={modo === "registar" ? t("auth.minimoCaracteres") : "••••••••"} />
          </label>
        )}

        {modo === "registar" && (
          <label className="flex items-start gap-2.5 text-sm text-ink-300">
            <input type="checkbox" checked={newsletter} className="mt-0.5"
              onChange={(e) => setNewsletter(e.target.checked)} />
            {t("auth.aceitoNewsletter")}
          </label>
        )}

        {modo === "registar" && (
          <p className="text-xs text-ink-500">
            {t("auth.aoRegistarAceita")}{" "}
            <Link href="/termos" className="text-mb-red hover:underline">{t("rodape.termos")}</Link>
            {" "}{t("auth.eA")}{" "}
            <Link href="/privacidade" className="text-mb-red hover:underline">{t("rodape.privacidade")}</Link>.
          </p>
        )}

        <button type="submit" disabled={ocupado}
          className="h-12 w-full bg-mb-red font-display text-sm uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark disabled:opacity-50">
          {ocupado ? t("auth.aguarde") : titulo}
        </button>
      </form>

      {modo !== "recuperar" && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-700" />
            <span className="text-[11px] uppercase tracking-widest text-ink-500">{t("auth.ou")}</span>
            <span className="h-px flex-1 bg-ink-700" />
          </div>

          <button type="button" onClick={google} disabled={ocupado}
            className="flex h-12 w-full items-center justify-center gap-3 border border-ink-600 font-display text-sm uppercase tracking-wider text-white transition-colors hover:border-ink-400 disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.4-.2-2.1H12v3.9h6c-.1 1-.8 2.5-2.2 3.5l3.4 2.6c2-1.8 3.4-4.6 3.4-7.9Z"/>
              <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.4-2.6c-.9.6-2.1 1.1-3.8 1.1-2.9 0-5.3-1.9-6.2-4.5l-3.5 2.7C4.1 20.6 7.8 23 12 23Z"/>
              <path fill="#FBBC05" d="M5.8 14.4a6.8 6.8 0 0 1 0-4.3L2.3 7.4a11 11 0 0 0 0 9.7l3.5-2.7Z"/>
              <path fill="#EA4335" d="M12 5.4c2 0 3.4.9 4.2 1.6l3.1-3C17.4 2.2 14.9 1 12 1 7.8 1 4.1 3.4 2.3 7.4l3.5 2.7C6.7 7.5 9.1 5.4 12 5.4Z"/>
            </svg>
            {t("auth.continuarGoogle")}
          </button>
        </>
      )}

      <div className="mt-6 space-y-2 text-center text-sm">
        {modo === "entrar" && (
          <>
            <p className="text-ink-400">
              {t("auth.semConta")}{" "}
              <button type="button" onClick={() => { setModo("registar"); setErro(null); }}
                className="text-mb-red hover:underline">{t("auth.criarConta")}</button>
            </p>
            <p>
              <button type="button" onClick={() => { setModo("recuperar"); setErro(null); }}
                className="text-xs text-ink-500 hover:text-white">{t("auth.esqueceuPalavra")}</button>
            </p>
          </>
        )}
        {modo !== "entrar" && (
          <p className="text-ink-400">
            {t("auth.jaTemConta")}{" "}
            <button type="button" onClick={() => { setModo("entrar"); setErro(null); setAviso(null); }}
              className="text-mb-red hover:underline">{t("auth.entrar")}</button>
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
