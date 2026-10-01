"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";
import { CampoPalavraPasse } from "./CampoPalavraPasse";

export type ModoSessao = "entrar" | "registar" | "recuperar";

/**
 * Entrar, criar conta e recuperar acesso. Usado na página /entrar e na
 * janela que aparece quando uma acção precisa de sessão.
 */
export function FormularioSessao({
  modoInicial = "entrar",
  destino,
  aoEntrar,
  compacto = false,
  avisoInicial = null,
  erroInicial = null,
  motivo,
}: {
  modoInicial?: ModoSessao;
  /** Página para onde a ligação de confirmação do email traz a pessoa. */
  destino: string;
  /** Chamado depois de entrar com email e palavra-passe. */
  aoEntrar?: () => void;
  /** Na janela: títulos mais pequenos. */
  compacto?: boolean;
  avisoInicial?: string | null;
  erroInicial?: string | null;
  /** Porque é que a sessão é pedida (só na janela). */
  motivo?: string;
}) {
  const { t } = useIdioma();
  const { entrar, registar, googleActivo, entrarComGoogle, recuperar, reenviarConfirmacao } = useAuth();

  const [modo, setModo] = useState<ModoSessao>(modoInicial);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [palavra, setPalavra] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [erro, setErro] = useState<string | null>(erroInicial);
  const [aviso, setAviso] = useState<string | null>(avisoInicial);
  const [ocupado, setOcupado] = useState(false);
  /** Depois de tentar entrar sem ter confirmado o email. */
  const [porConfirmar, setPorConfirmar] = useState(false);

  const mudar = (m: ModoSessao) => { setModo(m); setErro(null); setAviso(null); setPorConfirmar(false); };

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null); setAviso(null); setPorConfirmar(false); setOcupado(true);

    let falha: string | null = null;
    if (modo === "entrar") {
      falha = await entrar(email, palavra);
      if (!falha) aoEntrar?.();
      else if (/confirme o email/i.test(falha)) setPorConfirmar(true);
    } else if (modo === "registar") {
      if (palavra.length < 8) {
        falha = t("auth.palavraCurta");
      } else {
        falha = await registar({ nome, email, palavra, newsletter, destino });
        if (!falha) setAviso(compacto ? t("auth.verifiqueEmailModal") : t("auth.verifiqueEmail"));
      }
    } else {
      falha = await recuperar(email);
      if (!falha) setAviso(t("auth.recuperacaoEnviada"));
    }

    setErro(falha);
    setOcupado(false);
  };

  const reenviar = async () => {
    setOcupado(true);
    const falha = await reenviarConfirmacao(email, destino);
    setOcupado(false);
    if (falha) { setErro(falha); return; }
    setErro(null); setPorConfirmar(false);
    setAviso(t("auth.confirmacaoReenviada"));
  };

  const google = async () => {
    setErro(null); setOcupado(true);
    const falha = await entrarComGoogle();
    if (falha) { setErro(falha); setOcupado(false); }
  };

  const campo =
    "h-12 w-full rounded-[0.625rem] bg-ink-900 px-4 text-sm text-white ring-1 ring-inset ring-white/10 " +
    "placeholder:text-ink-600 outline-none transition-shadow focus:ring-2 focus:ring-mb-red";
  const etiqueta =
    "mb-1.5 block text-sm text-white/70";

  const titulo =
    modo === "entrar" ? t("auth.entrar")
    : modo === "registar" ? t("auth.criarConta")
    : t("auth.recuperarAcesso");

  return (
    <div>
      <div className={compacto ? "mb-5 pr-10" : "mb-8"}>
        {!compacto && <p className="eyebrow mb-2 text-mb-red">Motobox Angola</p>}
        <h1 className={`title-xl text-white ${compacto ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
          {compacto && modo === "entrar" ? t("auth.entrarParaContinuar") : titulo}
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          {compacto && motivo && modo === "entrar" ? motivo
           : modo === "entrar" ? t("auth.entrarSub")
           : modo === "registar" ? t("auth.registarSub")
           : t("auth.recuperarSub")}
        </p>
      </div>

      {aviso && (
        <p role="status" className="mb-4 rounded-xl bg-ok/12 px-4 py-3 text-sm text-ok">{aviso}</p>
      )}
      {erro && (
        <div role="alert" className="mb-4 rounded-xl bg-mb-red/12 px-4 py-3 text-sm text-mb-red-light">
          <p>{erro}</p>
          {porConfirmar && (
            <button type="button" onClick={reenviar} disabled={ocupado}
              className="mt-2 font-ui text-sm text-white underline hover:no-underline disabled:opacity-50">
              {t("auth.reenviarConfirmacao")}
            </button>
          )}
        </div>
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
            <CampoPalavraPasse className={campo} value={palavra} required
              autoComplete={modo === "registar" ? "new-password" : "current-password"}
              minLength={modo === "registar" ? 8 : undefined}
              onChange={(e) => setPalavra(e.target.value)}
              placeholder={modo === "registar" ? t("auth.minimoCaracteres") : "••••••••"} />
          </label>
        )}

        {modo === "registar" && (
          <label className="flex items-start gap-2.5 text-sm text-ink-300">
            <input type="checkbox" checked={newsletter} className="mt-0.5 accent-mb-red"
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
          className="h-12 w-full rounded-[6px] bg-mb-red text-[15px] text-white transition-colors hover:bg-mb-red-dark disabled:opacity-50">
          {ocupado ? t("auth.aguarde") : titulo}
        </button>
      </form>

      {modo !== "recuperar" && googleActivo && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-widest text-ink-500">{t("auth.ou")}</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <button type="button" onClick={google} disabled={ocupado}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-[6px] bg-white/10 text-[15px] text-white transition-colors hover:bg-white/20 disabled:opacity-50">
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
              <button type="button" onClick={() => mudar("registar")}
                className="text-mb-red hover:underline">{t("auth.criarConta")}</button>
            </p>
            <p>
              <button type="button" onClick={() => mudar("recuperar")}
                className="text-xs text-ink-500 hover:text-white">{t("auth.esqueceuPalavra")}</button>
            </p>
          </>
        )}
        {modo !== "entrar" && (
          <p className="text-ink-400">
            {t("auth.jaTemConta")}{" "}
            <button type="button" onClick={() => mudar("entrar")}
              className="text-mb-red hover:underline">{t("auth.entrar")}</button>
          </p>
        )}
      </div>
    </div>
  );
}
