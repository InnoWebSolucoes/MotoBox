"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MOTIVOS_DENUNCIA } from "@/lib/denuncias";
import { Icon } from "./ui";
import { comBase } from "@/lib/base";

/**
 * Botão discreto "Denunciar" com uma janela para escolher o motivo.
 * A denúncia vai para Moderação no painel.
 */
export function Denunciar({
  tipo, alvoId, rotulo = "Denunciar",
  classeBotao = "inline-flex items-center gap-1.5 text-xs text-ink-300 transition-colors hover:text-white",
  icone = true,
}: {
  tipo: "marketplace" | "forum";
  alvoId: string;
  rotulo?: string;
  /** Para o botão se parecer com as acções à sua volta. */
  classeBotao?: string;
  icone?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [site, setSite] = useState("");
  const [estado, setEstado] = useState<"idle" | "a-enviar" | "ok">("idle");
  const [erro, setErro] = useState<string | null>(null);
  const primeiro = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;
    primeiro.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto]);

  const abrir = () => {
    setAberto(true);
    setEstado("idle");
    setErro(null);
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!motivo) { setErro("Escolha um motivo."); return; }
    setEstado("a-enviar");
    setErro(null);
    try {
      const r = await fetch(comBase("/api/denunciar"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, alvoId, motivo, detalhe, site }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(String(j.erro ?? "Não foi possível enviar. Tente mais tarde.")); setEstado("idle"); return; }
      setEstado("ok");
      setMotivo(""); setDetalhe("");
    } catch {
      setErro("Sem ligação. Tente de novo.");
      setEstado("idle");
    }
  }

  return (
    <>
      <button type="button" onClick={abrir} className={classeBotao}>
        {icone && <Icon name="flag" className="size-3.5" />}
        {rotulo}
      </button>

      {/* No <body>: o painel da página isola o empilhamento e a janela ficava por baixo do botão. */}
      {aberto && createPortal(
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAberto(false)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-labelledby="denunciar-titulo"
            className="relative w-full max-w-md rounded-[6px] bg-near-black p-6 shadow-2xl ring-1 ring-white/10">
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-ink-300 transition-colors hover:bg-white/8 hover:text-white">
              <Icon name="close" className="size-4" />
            </button>

            {estado === "ok" ? (
              <div className="py-4 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-ok/15 text-ok">
                  <Icon name="check" className="size-6" />
                </span>
                <h2 id="denunciar-titulo" className="mt-4 font-display text-xl uppercase text-white">Obrigado</h2>
                <p className="mt-2 text-sm text-ink-300">
                  A equipa de moderação vai rever este conteúdo. Não precisa de fazer mais nada.
                </p>
                <button type="button" onClick={() => setAberto(false)}
                  className="mt-6 h-11 rounded-[6px] bg-white px-6 text-[15px] text-ink-950 hover:bg-ink-200">
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={enviar}>
                <h2 id="denunciar-titulo" className="pr-10 font-display text-xl uppercase text-white">Denunciar</h2>
                <p className="mt-1 text-sm text-ink-300">Diga-nos o que se passa. A denúncia é anónima para quem publicou.</p>

                <fieldset className="mt-5">
                  <legend className="eyebrow mb-2.5 text-ink-300">Motivo</legend>
                  <div className="flex flex-wrap gap-2">
                    {MOTIVOS_DENUNCIA.map((m, i) => (
                      <button key={m} ref={i === 0 ? primeiro : undefined} type="button"
                        onClick={() => setMotivo(m)} aria-pressed={motivo === m} className="chip h-9 text-sm">
                        {m}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="mt-5 block">
                  <span className="eyebrow mb-2 block text-ink-300">
                    Detalhes {motivo === "Outro motivo" ? "" : "(opcional)"}
                  </span>
                  <textarea value={detalhe} onChange={(e) => setDetalhe(e.target.value)} rows={3} maxLength={1000}
                    placeholder="O que viu de errado?"
                    className="w-full bg-ink-950 px-4 py-3 text-sm text-white ring-1 ring-inset ring-white/10 outline-none placeholder:text-ink-300 focus:ring-2 focus:ring-mb-red" />
                </label>

                {/* Armadilha para robôs: invisível para pessoas. */}
                <input type="text" tabIndex={-1} autoComplete="off" value={site}
                  onChange={(e) => setSite(e.target.value)} className="hidden" aria-hidden />

                {erro && <p role="alert" className="mt-3 text-sm text-mb-red-light">{erro}</p>}

                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setAberto(false)}
                    className="h-11 rounded-[6px] px-5 text-[15px] text-ink-300 hover:text-white">
                    Cancelar
                  </button>
                  <button type="submit" disabled={estado === "a-enviar"}
                    className="h-11 rounded-[6px] bg-mb-red px-6 text-[15px] text-white transition-colors hover:bg-mb-red-dark disabled:opacity-60">
                    {estado === "a-enviar" ? "A enviar…" : "Enviar denúncia"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
