"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";

export function SemAcessoClient() {
  const { t } = useIdioma();
  const { perfil, sair } = useAuth();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-16 text-center">
      <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-mb-red/12">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          className="size-7 text-mb-red" aria-hidden>
          <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>

      <h1 className="title-xl text-3xl text-white">{t("auth.semAcesso")}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-ink-400">{t("auth.semAcessoTexto")}</p>

      {perfil && (
        <p className="mt-4 text-xs text-ink-500">
          {perfil.email} · {perfil.papel}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/"
          className="inline-flex h-11 items-center rounded-full border-2 border-ink-500 px-6 font-ui text-base text-white transition-colors hover:border-white">
          {t("comum.inicio")}
        </Link>
        <button type="button" onClick={() => void sair()}
          className="inline-flex h-11 items-center rounded-full bg-mb-red px-6 font-ui text-base text-white transition-colors hover:bg-mb-red-dark">
          {t("auth.sair")}
        </button>
      </div>
    </div>
  );
}
