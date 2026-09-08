"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";

export function NovaPalavraClient() {
  const { t } = useIdioma();
  const { definirPalavra } = useAuth();
  const router = useRouter();

  const [palavra, setPalavra] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const campo =
    "w-full border border-ink-700 bg-ink-950 px-3 py-2.5 text-sm text-white " +
    "placeholder:text-ink-600 outline-none transition-colors focus:border-mb-red";
  const etiqueta =
    "mb-1.5 block text-[11px] font-display uppercase tracking-widest text-ink-300";

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (palavra.length < 8) { setErro(t("auth.palavraCurta")); return; }
    if (palavra !== confirmacao) { setErro(t("auth.palavrasDiferentes")); return; }

    setOcupado(true);
    const falha = await definirPalavra(palavra);
    setOcupado(false);

    if (falha) { setErro(falha); return; }
    router.replace("/entrar?confirmado=1");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="title-xl mb-6 text-3xl text-white">{t("auth.novaPalavra")}</h1>

      {erro && (
        <p role="alert" className="mb-4 border border-mb-red/40 bg-mb-red/10 px-3 py-2.5 text-sm text-mb-red">
          {erro}
        </p>
      )}

      <form onSubmit={submeter} className="space-y-4">
        <label className="block">
          <span className={etiqueta}>{t("auth.novaPalavra")}</span>
          <input className={campo} type="password" value={palavra} required minLength={8}
            autoComplete="new-password" placeholder={t("auth.minimoCaracteres")}
            onChange={(e) => setPalavra(e.target.value)} />
        </label>

        <label className="block">
          <span className={etiqueta}>{t("auth.confirmarPalavra")}</span>
          <input className={campo} type="password" value={confirmacao} required
            autoComplete="new-password" placeholder="••••••••"
            onChange={(e) => setConfirmacao(e.target.value)} />
        </label>

        <button type="submit" disabled={ocupado}
          className="h-12 w-full bg-mb-red font-display text-sm uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark disabled:opacity-50">
          {ocupado ? t("auth.aguarde") : t("comum.guardar")}
        </button>
      </form>
    </div>
  );
}
