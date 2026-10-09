"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { FotoFundo } from "@/components/painel/kit";
import { FormularioSessao } from "@/components/FormularioSessao";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";
import type { ConteudoContas } from "@/lib/conteudo/grupos/contas";

/** Só caminhos do próprio site: um "?destino=//outro-site" ou "https://…" levava a pessoa para fora. */
const destinoSeguro = (v: string | null) => (v && /^\/(?!\/)[^\s\\]*$/.test(v) ? v : "/conta");

export function EntrarClient({
  textos, registosAbertos = true,
}: {
  textos: ConteudoContas["entrar"];
  /** "Criar conta" nas Definições. Desligado, o formulário abre em "entrar" com um aviso. */
  registosAbertos?: boolean;
}) {
  const { t } = useIdioma();
  const { utilizador, carregando } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const destino = destinoSeguro(params.get("destino"));

  // Quem já tem sessão não precisa desta página.
  useEffect(() => {
    if (!carregando && utilizador) router.replace(destino);
  }, [carregando, utilizador, destino, router]);

  const pedido = params.get("modo");
  const modoInicial =
    pedido === "registar" && registosAbertos ? "registar" : pedido === "recuperar" ? "recuperar" : "entrar";

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
        {textos.sobretitulo && <p className="sobretitulo text-white/80">{textos.sobretitulo}</p>}
        <h1 className="titulo-2 mt-4 max-w-[14ch]">{textos.titulo}</h1>
        {textos.texto && <p className="texto-lead mt-5 max-w-[40ch] text-white/85">{textos.texto}</p>}
      </div>
      <div className="flex flex-col justify-center px-5 pb-12 pt-28 md:px-12 lg:py-16 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          {!registosAbertos && textos.registosFechados && (
            <p role="status" className="mb-6 rounded-xl bg-gold/12 px-4 py-3 text-sm leading-relaxed text-gold">
              {textos.registosFechados}
            </p>
          )}
          <FormularioSessao
            modoInicial={modoInicial}
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
