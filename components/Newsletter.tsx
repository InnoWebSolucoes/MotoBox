"use client";

import { useState } from "react";
import { Icon } from "./ui";

const INTERESSES = [
  "Campeonato Nacional",
  "Passeios e encontros",
  "Notícias internacionais",
  "Marketplace",
  "Acções solidárias",
];

export function Newsletter({ variante = "faixa" }: { variante?: "faixa" | "cartao" | "rodape" }) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [interesses, setInteresses] = useState<string[]>(["Campeonato Nacional"]);
  const [estado, setEstado] = useState<"idle" | "a-enviar" | "ok" | "erro">("idle");

  const alternar = (i: string) =>
    setInteresses((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setEstado("erro");
      return;
    }
    setEstado("a-enviar");
    await new Promise((r) => setTimeout(r, 800));
    setEstado("ok");
  }

  if (estado === "ok") {
    return (
      <div
        className={
          variante === "rodape"
            ? "flex items-center gap-3 text-sm text-ink-200"
            : "card p-8 text-center"
        }
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ok/20 text-ok">
          <Icon name="check" className="size-5" />
        </span>
        <div className={variante === "rodape" ? "" : "mt-4"}>
          <p className="font-display uppercase tracking-wide text-white">Subscrição confirmada</p>
          <p className="mt-1 text-sm text-ink-400">
            Enviámos um email de confirmação para <span className="text-ink-200">{email}</span>.
          </p>
        </div>
      </div>
    );
  }

  /* ---- Variante de rodapé: compacta ---- */
  if (variante === "rodape") {
    return (
      <form onSubmit={submeter} className="flex flex-col sm:flex-row gap-2">
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
          className="h-11 flex-1 min-w-0 border border-ink-700 bg-ink-950 px-4 text-sm text-white placeholder:text-ink-600 focus:border-mb-red outline-none"
        />
        <button
          type="submit"
          disabled={estado === "a-enviar"}
          className="h-11 shrink-0 bg-mb-red px-6 font-display text-[11px] uppercase tracking-widest text-white hover:bg-mb-red-dark transition-colors disabled:opacity-50"
        >
          {estado === "a-enviar" ? "A enviar…" : "Subscrever"}
        </button>
        {estado === "erro" && (
          <p className="text-xs text-mb-red-light sm:absolute sm:mt-12">Introduza um email válido.</p>
        )}
      </form>
    );
  }

  /* ---- Variante completa ---- */
  const wrapper =
    variante === "faixa"
      ? "relative overflow-hidden border-y border-ink-800 bg-ink-900"
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
            Resultados, calendário, bilhetes e as histórias da comunidade motard angolana — no seu
            email, todas as semanas. Sem spam, e cancela quando quiser.
          </p>
        </div>

        <form onSubmit={submeter} className={variante === "faixa" ? "" : "mt-6"}>
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
                className="h-12 w-full border border-ink-700 bg-ink-950 px-4 text-sm text-white placeholder:text-ink-600 focus:border-mb-red outline-none"
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
                className="h-12 w-full border border-ink-700 bg-ink-950 px-4 text-sm text-white placeholder:text-ink-600 focus:border-mb-red outline-none"
              />
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="eyebrow text-ink-500 mb-2.5">Quero receber sobre</legend>
            <div className="flex flex-wrap gap-2">
              {INTERESSES.map((i) => {
                const on = interesses.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => alternar(i)}
                    aria-pressed={on}
                    className={`px-3 h-8 text-[11px] font-display uppercase tracking-wider transition-colors ${
                      on
                        ? "bg-mb-red text-white"
                        : "border border-ink-700 text-ink-400 hover:border-ink-500 hover:text-ink-200"
                    }`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {estado === "erro" && (
            <p className="mt-3 text-xs text-mb-red-light">Introduza um endereço de email válido.</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={estado === "a-enviar"}
              className="h-12 bg-mb-red px-8 font-display text-xs uppercase tracking-widest text-white hover:bg-mb-red-dark transition-colors disabled:opacity-50"
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
