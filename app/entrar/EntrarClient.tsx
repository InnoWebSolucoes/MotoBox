"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Placeholder } from "@/components/Brand";
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
    <div className="relative overflow-hidden">
      <Placeholder nome="entrar" className="absolute inset-0 opacity-15" tamanhos="100vw" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/92 via-ink-950/80 to-ink-950/92" aria-hidden />
      <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <FormularioSessao
          modoInicial={params.get("modo") === "registar" ? "registar" : params.get("modo") === "recuperar" ? "recuperar" : "entrar"}
          destino={destino}
          aoEntrar={() => router.replace(destino)}
          avisoInicial={avisoInicial}
          erroInicial={erroInicial}
        />
      </div>
    </div>
  );
}
