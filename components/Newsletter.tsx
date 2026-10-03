"use client";

import { useState } from "react";
import { Icon } from "./ui";
import { useT } from "@/lib/i18n/contexto";
import { comBase } from "@/lib/base";
// A mesma lista das preferências da conta: os ids guardados são os mesmos.
import { INTERESSES, type Interesse } from "@/lib/conta/preferencias";

/**
 * Campo-armadilha: fora do ecrã e da ordem de tabulação, escondido
 * dos leitores de ecrã. Só um robô o preenche; a API finge aceitar
 * e não guarda nada.
 */
function Armadilha() {
  return (
    <div className="sr-only" aria-hidden="true">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

export function Newsletter({ variante = "faixa" }: { variante?: "faixa" | "cartao" | "rodape" }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  // Nenhum escolhido: o resumo completo.
  const [interesses, setInteresses] = useState<Interesse[]>([]);
  const [estado, setEstado] = useState<"idle" | "a-enviar" | "ok" | "erro">("idle");
  // "email": endereço recusado; "envio": o servidor ou a rede falharam.
  const [motivo, setMotivo] = useState<"email" | "envio">("email");

  const alternar = (i: Interesse) =>
    setInteresses((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const falhar = (m: "email" | "envio") => {
    setMotivo(m);
    setEstado("erro");
  };

  async function submeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (estado === "a-enviar") return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      falhar("email");
      return;
    }
    const armadilha = new FormData(e.currentTarget).get("website");
    setEstado("a-enviar");
    try {
      const r = await fetch(comBase("/api/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          nome: nome.trim() || undefined,
          // O rodapé não mostra os temas: não manda nenhuns e não mexe nos que havia.
          interesses: variante === "rodape" ? undefined : interesses,
          origem: variante,
          website: typeof armadilha === "string" ? armadilha : "",
        }),
      });
      if (r.ok) setEstado("ok");
      else falhar(r.status === 400 ? "email" : "envio");
    } catch {
      falhar("envio");
    }
  }

  const [antesEmail, depoisEmail = ""] = t("newsletter.confirmacao").split("{email}");

  if (estado === "ok") {
    const confirmacao = (
      <div
        role="status"
        className={
          variante === "rodape"
            ? "flex items-center gap-3 text-sm text-ink-200"
            : variante === "faixa"
              ? "card bg-ink-950 p-8 text-center"
              : "card p-8 text-center"
        }
      >
        <span className={`grid size-10 shrink-0 place-items-center rounded-full bg-ok/20 text-ok ${variante === "rodape" ? "" : "mx-auto"}`}>
          <Icon name="check" className="size-5" />
        </span>
        <div className={variante === "rodape" ? "" : "mt-4"}>
          <p className="font-display uppercase tracking-wide text-white">Subscrição confirmada</p>
          <p className="mt-1 text-sm text-ink-400">
            {antesEmail}<span className="text-ink-200">{email.trim()}</span>{depoisEmail}
          </p>
        </div>
      </div>
    );
    // A faixa mantém a sua banda de fundo; a confirmação fica no lugar do formulário.
    if (variante !== "faixa") return confirmacao;
    return (
      <section className="relative overflow-hidden bg-ink-900">
        <div className="speed-lines absolute inset-0 opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14">{confirmacao}</div>
      </section>
    );
  }

  /* ---- Variante de rodapé: compacta ---- */
  if (variante === "rodape") {
    return (
      <form onSubmit={submeter} className="flex flex-col sm:flex-row gap-2">
        <Armadilha />
        <label className="sr-only" htmlFor="nl-rodape">
          O seu email
        </label>
        <input
          id="nl-rodape"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEstado("idle");
          }}
          placeholder="o.seu@email.ao"
          className="h-12 w-full min-w-0 sm:flex-1 rounded-full bg-ink-950 px-5 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 focus:ring-2 focus:ring-mb-red outline-none"
        />
        <button
          type="submit"
          disabled={estado === "a-enviar"}
          className="h-12 shrink-0 rounded-full bg-mb-red px-7 font-ui text-base text-white hover:bg-mb-red-dark transition-colors disabled:opacity-50"
        >
          {estado === "a-enviar" ? "A enviar…" : "Subscrever"}
        </button>
        {estado === "erro" && (
          <p role="alert" className="text-xs text-mb-red-light sm:absolute sm:mt-12">
            {motivo === "email" ? "Introduza um email válido." : t("newsletter.erroEnvio")}
          </p>
        )}
      </form>
    );
  }

  /* ---- Variante completa ---- */
  const wrapper =
    variante === "faixa"
      ? "relative overflow-hidden bg-ink-900"
      : "card p-6 sm:p-8";

  return (
    <section className={wrapper}>
      {variante === "faixa" && <div className="speed-lines absolute inset-0 opacity-30" aria-hidden />}
      <div
        className={
          variante === "faixa"
            ? "relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 py-14 lg:grid-cols-2 lg:items-center"
            : ""
        }
      >
        <div>
          <p className="eyebrow text-mb-red">Newsletter Motobox</p>
          <h2 className="title-xl mt-3 text-3xl sm:text-4xl">
            Não perca<br />nenhuma prova
          </h2>
          <p className="mt-4 max-w-md text-sm text-ink-400 leading-relaxed">
            Resultados, calendário, bilhetes e as histórias da comunidade motard angolana, no seu
            email, todas as semanas. Sem spam, e cancela quando quiser.
          </p>
        </div>

        <form onSubmit={submeter} className={variante === "faixa" ? "" : "mt-6"}>
          <Armadilha />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="nl-nome" className="eyebrow block text-ink-500 mb-2">
                Nome
              </label>
              <input
                id="nl-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="O seu nome"
                className="h-12 w-full rounded-full bg-ink-950 px-5 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 focus:ring-2 focus:ring-mb-red outline-none"
              />
            </div>
            <div>
              <label htmlFor="nl-email" className="eyebrow block text-ink-500 mb-2">
                Email <span className="text-mb-red">*</span>
              </label>
              <input
                id="nl-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEstado("idle");
                }}
                placeholder="o.seu@email.ao"
                className="h-12 w-full rounded-full bg-ink-950 px-5 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 focus:ring-2 focus:ring-mb-red outline-none"
              />
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="eyebrow text-ink-500 mb-2.5">Quero receber sobre</legend>
            <div className="flex flex-wrap gap-2">
              {INTERESSES.map((i) => {
                const on = interesses.includes(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => alternar(i.id)}
                    aria-pressed={on}
                    className="chip"
                  >
                    {i.nome}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs text-ink-600">Sem nenhum escolhido, recebe o resumo completo.</p>
          </fieldset>

          {estado === "erro" && (
            <p role="alert" className="mt-3 text-xs text-mb-red-light">
              {motivo === "email" ? "Introduza um endereço de email válido." : t("newsletter.erroEnvio")}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={estado === "a-enviar"}
              className="h-12 rounded-full bg-mb-red px-8 font-ui text-base text-white hover:bg-mb-red-dark transition-colors disabled:opacity-50"
            >
              {estado === "a-enviar" ? "A subscrever…" : "Subscrever"}
            </button>
            <p className="text-xs text-ink-600 max-w-xs">
              Ao subscrever aceita receber comunicações da Motobox Angola.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
