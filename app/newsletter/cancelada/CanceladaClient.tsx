"use client";

import { useState } from "react";
import { ButtonLink, Button, Icon } from "@/components/ui";
import { BASE, comBase } from "@/lib/base";
import { preencher } from "@/lib/conteudo/grupos/geral";
import { useTextosGerais } from "@/components/painel/TextosGerais";

export type EstadoCancelamento = "ok" | "invalido" | "erro";

export function CanceladaClient({
  estado, email, token,
}: { estado: EstadoCancelamento; email: string; token: string }) {
  // Os textos editam-se em Gestão › Entrada e painel › Geral (Newsletter).
  const { newsletter: t } = useTextosGerais();
  // Voltar à lista: o mesmo pedido do formulário público.
  const [regresso, setRegresso] = useState<"idle" | "a-enviar" | "ok" | "erro">("idle");

  async function voltar() {
    setRegresso("a-enviar");
    try {
      const r = await fetch(comBase("/api/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, origem: "rodape" }),
      });
      setRegresso(r.ok ? "ok" : "erro");
    } catch {
      setRegresso("erro");
    }
  }

  const titulo =
    estado === "ok" ? t.canceladaTitulo
    : estado === "erro" ? t.erroCancelarTitulo
    : t.linkInvalidoTitulo;

  const texto =
    estado === "ok"
      ? email ? preencher(t.canceladaTexto, { email }) : t.canceladaSemEmail
      : estado === "erro" ? t.erroCancelarTexto
      : t.linkInvalidoTexto;

  return (
    <div className="relative overflow-hidden">
      <div className="stripes absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-16 text-center">
        <div
          className={`mx-auto mb-6 grid size-16 place-items-center rounded-full ${
            estado === "ok" ? "bg-white/8 text-white" : "bg-mb-red/12 text-mb-red"
          }`}
          aria-hidden
        >
          {estado === "ok" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-7">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-7">
              <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          )}
        </div>

        {t.sobretitulo && <p className="eyebrow text-mb-red">{t.sobretitulo}</p>}
        <h1 className="title-xl mt-3 text-3xl text-white sm:text-4xl">{titulo}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-400">{texto}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="outline">{t.inicio}</ButtonLink>
          {estado === "erro" && email && token && (
            // Rota de API, não página: navegação normal, sem o <Link> do Next.
            <a
              href={`${BASE}/api/newsletter/cancelar?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-mb-red px-6 font-ui text-base text-white transition-colors hover:bg-mb-red-dark"
            >
              {t.tentarDeNovo}
            </a>
          )}
          {estado !== "ok" && (
            <ButtonLink href="/contacto" variant={estado === "erro" ? "dark" : "primary"}>
              {t.falarConnosco}
            </ButtonLink>
          )}
        </div>

        {estado === "ok" && email && (
          <div className="mx-auto mt-10 w-full max-w-sm border-t border-white/6 pt-6" aria-live="polite">
            {regresso === "ok" ? (
              <p className="flex items-center justify-center gap-2 text-sm text-ink-200">
                <span className="grid size-7 place-items-center rounded-full bg-ok/20 text-ok">
                  <Icon name="check" className="size-4" />
                </span>
                {t.resubscrito}
              </p>
            ) : (
              <>
                <p className="text-sm text-ink-400">{t.canceladaEngano}</p>
                <Button
                  type="button"
                  variant="dark"
                  size="sm"
                  className="mt-4"
                  onClick={voltar}
                  disabled={regresso === "a-enviar"}
                >
                  {regresso === "a-enviar" ? t.aSubscrever : t.voltarSubscrever}
                </Button>
                {regresso === "erro" && (
                  <p role="alert" className="mt-3 text-xs text-mb-red-light">{t.erroEnvio}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
