"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { FotoFundo } from "@/components/painel/kit";
import { FormularioSessao } from "@/components/FormularioSessao";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";

export function EntrarClient() {
  const { t } = useIdioma();
  const { utilizador, carregando } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const destino = params.get("destino") ?? "/conta";

  // Quem já tem sessão não precisa desta página.
  useEffect(() => {
    if (!carregando && utilizador) router.replace(destino);
  }, [carregando, utilizador, destino, router]);

  const avisoInicial = params.get("confirmado") ? t("auth.emailConfirmado") : null;
  const erroInicial =
    params.get("erro") === "ligacao" ? t("auth.ligacaoInvalida")
    : params.get("erro") === "oauth" ? "Não foi possível entrar com o Google. Tente de novo."
    : null;

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      <div className="relative isolate hidden flex-col justify-end overflow-hidden p-10 lg:flex xl:p-16">
        <FotoFundo nome="banner-entrar" veu="esquerda" tamanhos="50vw" prioridade />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
        <p className="sobretitulo text-white/80">MotoBox Angola</p>
        <h1 className="titulo-2 mt-4 max-w-[14ch]">A comunidade motard, na sua conta</h1>
        <p className="texto-lead mt-5 max-w-[40ch] text-white/85">
          Siga clubes e marcas, publique no marketplace, responda no fórum e receba os artigos da semana.
        </p>
      </div>
      <div className="flex flex-col justify-center px-5 pb-12 pt-28 md:px-12 lg:py-16 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <FormularioSessao
            modoInicial={params.get("modo") === "registar" ? "registar" : params.get("modo") === "recuperar" ? "recuperar" : "entrar"}
            destino={destino}
            aoEntrar={() => router.replace(destino)}
            avisoInicial={avisoInicial}
            erroInicial={erroInicial}
          />
        </div>
      </div>
    </div>
  );
}
