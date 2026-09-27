"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAuth } from "@/lib/auth/contexto";
import { useExigirSessao } from "@/components/SessaoObrigatoria";
import { Button, ButtonLink, Icon } from "@/components/ui";
import { formatKz } from "@/lib/data";
import { comBase } from "@/lib/base";

const MENSAGEM_INICIAL = "Olá, ainda tem este anúncio disponível?";
const MINIMO = 10;
const MAXIMO = 2000;

interface Anuncio {
  anuncioId: string;
  titulo: string;
  preco: number;
  vendedorNome: string;
  /** Conta de quem publicou, quando o anúncio foi criado no site. */
  vendedorAuthId?: string;
}

/**
 * "Contactar vendedor": pede sessão e abre uma janela com a mensagem.
 * O envio passa por /api/marketplace/contactar, que nunca mostra o email
 * do vendedor a quem escreve. No próprio anúncio, leva à gestão na conta.
 */
export function ContactarVendedor(props: Anuncio) {
  const { utilizador } = useAuth();
  const exigirSessao = useExigirSessao();
  const [aberto, setAberto] = useState(false);
  const fechar = useCallback(() => setAberto(false), []);

  if (props.vendedorAuthId && utilizador?.id === props.vendedorAuthId) {
    return (
      <ButtonLink href="/conta#anuncios" variant="outline" className="w-full">
        <Icon name="settings" className="size-4" />
        Este anúncio é seu: gerir na conta
      </ButtonLink>
    );
  }

  return (
    <>
      <Button
        className="w-full"
        size="lg"
        aria-haspopup="dialog"
        onClick={() =>
          exigirSessao(() => setAberto(true), {
            continuar: true,
            motivo: "Para contactar o vendedor precisa de sessão.",
          })
        }
      >
        <Icon name="chat" className="size-4" />
        Contactar vendedor
      </Button>

      {aberto && <JanelaContacto {...props} email={utilizador?.email ?? ""} aoFechar={fechar} />}
    </>
  );
}

function JanelaContacto({
  anuncioId, titulo, preco, vendedorNome, email, aoFechar,
}: Anuncio & { email: string; aoFechar: () => void }) {
  const [mensagem, setMensagem] = useState(MENSAGEM_INICIAL);
  const [estado, setEstado] = useState<"idle" | "a-enviar" | "email" | "equipa">("idle");
  const [erro, setErro] = useState<string | null>(null);
  const janela = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const enviado = estado === "email" || estado === "equipa";

  // Ao abrir: cursor no fim da mensagem, Escape fecha, a página não desliza por trás.
  // Ao fechar: o foco volta ao botão que abriu a janela.
  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    const el = campo.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = overflow;
      antes?.focus?.();
    };
  }, [aoFechar]);

  useEffect(() => {
    if (enviado) botaoFechar.current?.focus();
  }, [enviado]);

  // O Tab não sai da janela enquanto está aberta.
  function prenderFoco(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !janela.current) return;
    const focaveis = janela.current.querySelectorAll<HTMLElement>(
      "button:not([disabled]), textarea, a[href], input:not([type=hidden])",
    );
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (!primeiro || !ultimo) return;
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const texto = mensagem.trim();
    if (texto.length < MINIMO) { setErro(`Escreva a sua mensagem (mín. ${MINIMO} caracteres).`); return; }
    setEstado("a-enviar");
    setErro(null);
    try {
      const r = await fetch(comBase("/api/marketplace/contactar"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anuncioId, mensagem: texto }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(String(j.erro ?? `Não foi possível enviar (erro ${r.status}). Tente de novo.`));
        setEstado("idle");
        return;
      }
      setEstado(j.via === "email" ? "email" : "equipa");
    } catch {
      setErro("Sem ligação à internet. Tente de novo.");
      setEstado("idle");
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={aoFechar} aria-hidden />
      <div
        ref={janela}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contactar-titulo"
        onKeyDown={prenderFoco}
        className="relative my-auto w-full max-w-md rounded-2xl bg-ink-900 p-6 shadow-2xl ring-1 ring-white/10 sm:p-7"
      >
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/8 hover:text-white"
        >
          <Icon name="close" className="size-4" />
        </button>

        {enviado ? (
          <div className="py-4 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-ok/15 text-ok">
              <Icon name="check" className="size-6" />
            </span>
            <h2 id="contactar-titulo" className="mt-4 font-display text-xl uppercase text-white">
              Mensagem enviada
            </h2>
            <p className="mt-2 text-sm text-ink-400 leading-relaxed">
              {estado === "email"
                ? `${vendedorNome} recebeu a sua mensagem por email. Quando responder, a resposta chega a ${email}.`
                : `A equipa Motobox vai fazer chegar a sua mensagem ao vendedor. A resposta chega ao seu email, ${email}.`}
            </p>
            <button
              ref={botaoFechar}
              type="button"
              onClick={aoFechar}
              className="mt-6 h-11 rounded-full bg-white px-6 font-ui text-base text-ink-950 transition-colors hover:bg-ink-200"
            >
              Fechar
            </button>
          </div>
        ) : (
          // Sem validação do navegador: as mensagens ficam em português, como as do servidor.
          <form onSubmit={enviar} noValidate>
            <h2 id="contactar-titulo" className="pr-10 font-display text-xl uppercase text-white">
              Contactar vendedor
            </h2>
            <p className="mt-1.5 pr-6 text-sm text-ink-400 line-clamp-2">{titulo}</p>
            <p className="mt-1 font-display text-lg leading-none text-white tabular-nums">{formatKz(preco)}</p>

            <label className="mt-5 block">
              <span className="eyebrow mb-2 block text-ink-500">Mensagem para {vendedorNome}</span>
              <textarea
                ref={campo}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={5}
                maxLength={MAXIMO}
                required
                className="w-full resize-y bg-ink-950 px-4 py-3 text-sm text-white ring-1 ring-inset ring-white/10 outline-none placeholder:text-ink-600 focus:ring-2 focus:ring-mb-red"
              />
            </label>
            <div className="mt-2 flex items-start justify-between gap-4 text-xs text-ink-500">
              <p>
                A resposta chega ao seu email
                {email && <>, <span className="text-ink-300 break-all">{email}</span></>}.
              </p>
              <span aria-hidden className="shrink-0 tabular-nums">
                {mensagem.length}/{MAXIMO}
              </span>
            </div>

            {erro && <p role="alert" className="mt-3 text-sm text-mb-red-light">{erro}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={aoFechar}
                className="h-11 rounded-full px-5 font-ui text-base text-ink-300 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={estado === "a-enviar"}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-mb-red px-6 font-ui text-base text-white transition-colors hover:bg-mb-red-dark disabled:opacity-60"
              >
                <Icon name="mail" className="size-4" />
                {estado === "a-enviar" ? "A enviar…" : "Enviar mensagem"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
