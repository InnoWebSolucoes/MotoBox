"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { CornerDownRight, MessageSquarePlus } from "lucide-react";
import { Icon } from "@/components/ui";
import { Denunciar } from "@/components/Denunciar";
import { useExigirSessao } from "@/components/SessaoObrigatoria";
import { AvatarForum, MarcaNivel } from "@/components/forum/Autor";
import { Tempo } from "@/components/forum/Tempo";
import { BotaoVoto } from "@/components/forum/Votos";
import type { RespostaForum } from "@/components/forum/tipos";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";
import { interfaceEn } from "@/lib/i18n/interface-en";
import { RESPOSTA_MAX, RESPOSTA_MIN, type RespostaPublica } from "@/lib/forum/tipos";
import { comBase } from "@/lib/base";
import { FORUM_PADRAO, type ConteudoForum } from "@/lib/conteudo/grupos/comunidade";

/* ============================================================
   MOTOBOX — Respostas dos membros e caixa de resposta
   Cada resposta é um cartão: quem escreveu (com o nível e a marca
   de autor do tópico), quando, o texto, o voto, "Responder" (que
   leva à caixa com o @nome já escrito) e "Reportar".
   A caixa pede sessão só quando se carrega em publicar: sem ela,
   abre-se a janela de entrar/criar conta e o texto fica onde
   estava. O rascunho também fica guardado neste navegador, para
   sobreviver ao recarregar que a confirmação da conta provoca.
   A resposta publicada aparece logo; quando a página volta do
   servidor com ela, a cópia local deixa de ser mostrada.
   ============================================================ */

/** Textos das acções de cada resposta (de "paginas.forum"). */
export interface RotulosResposta {
  reportar: string;
  responder: string;
  votar: string;
  retirarVoto: string;
  autor: string;
}

const ROTULOS_PADRAO: RotulosResposta = {
  reportar: FORUM_PADRAO.topico.reportar,
  responder: FORUM_PADRAO.topico.responder,
  votar: "Votar nesta resposta",
  retirarVoto: FORUM_PADRAO.lista.retirarVoto,
  autor: FORUM_PADRAO.niveis.autor,
};

/* ---------- A discussão: respostas acabadas de publicar e a caixa ---------- */

interface Discussao {
  novas: RespostaPublica[];
  adicionar: (r: RespostaPublica) => void;
  /** A caixa de resposta regista aqui o seu campo. */
  registarCampo: (el: HTMLTextAreaElement | null) => void;
  /** Leva à caixa de resposta; com um nome, começa a resposta por "@nome ". */
  irParaCaixa: (nome?: string) => void;
}

const Ctx = createContext<Discussao | null>(null);

export function DiscussaoProvider({ children }: { children: ReactNode }) {
  const [novas, setNovas] = useState<RespostaPublica[]>([]);
  const campo = useRef<HTMLTextAreaElement | null>(null);
  const registarCampo = useCallback((el: HTMLTextAreaElement | null) => { campo.current = el; }, []);
  const adicionar = useCallback((r: RespostaPublica) => {
    setNovas((l) => (l.some((x) => x.id === r.id) ? l : [...l, r]));
  }, []);
  const irParaCaixa = useCallback((nome?: string) => {
    const el = campo.current;
    if (!el) return;
    if (nome) {
      const mencao = `@${nome.replace(/\s+/g, "_")} `;
      if (!el.value.startsWith(mencao)) el.value = `${mencao}${el.value}`;
    }
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduzir ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  const valor = useMemo(() => ({ novas, adicionar, registarCampo, irParaCaixa }), [novas, adicionar, registarCampo, irParaCaixa]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

function useDiscussao(): Discussao {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDiscussao tem de ser usado dentro de <DiscussaoProvider>");
  return ctx;
}

/** Botão que leva à caixa de resposta (o convite "Seja o primeiro a responder", "Responder"). */
export function BotaoIrResponder({ children, className, nome }: { children: ReactNode; className: string; nome?: string }) {
  const { irParaCaixa } = useDiscussao();
  return (
    <button type="button" onClick={() => irParaCaixa(nome)} className={className}>
      {children}
    </button>
  );
}

/** As que o servidor ainda não trouxe (o `router.refresh()` demora um instante). */
export function RespostasNovas({
  idsServidor, topicoId, rotulos,
}: { idsServidor: string[]; topicoId: string; rotulos?: RotulosResposta }) {
  const { novas } = useDiscussao();
  const porMostrar = novas.filter((r) => !idsServidor.includes(r.id));
  if (porMostrar.length === 0) return null;
  return (
    <ol className="grid gap-[var(--intervalo)]">
      {porMostrar.map((r) => (
        <ItemResposta key={r.id} resposta={{ ...r, votos: 0 }} topicoId={topicoId} rotulos={rotulos} />
      ))}
    </ol>
  );
}

/* ---------- Uma resposta ---------- */

export function ItemResposta({
  resposta: r, topicoId, rotulos = ROTULOS_PADRAO,
}: { resposta: RespostaForum; topicoId: string; rotulos?: RotulosResposta }) {
  const accao = "inline-flex h-9 items-center gap-1.5 rounded-[4px] px-2.5 text-sm font-medium text-white transition-colors hover:bg-white/12";
  return (
    <li id={`resposta-${r.id}`} className="painel painel-escuro scroll-mt-24 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <AvatarForum nome={r.autorNome} cor={r.autorCor} avatar={r.autorAvatar} className="size-10 text-sm" />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[16px] font-semibold leading-tight text-white">{r.autorNome}</span>
            {r.eAutor && <MarcaNivel texto={rotulos.autor} tom="autor" />}
            <MarcaNivel texto={r.nivel} tom={r.equipa ? "equipa" : "nivel"} />
          </p>
          <Tempo iso={r.criadoEm} className="mt-0.5 block text-[13px] text-white/80" />
        </div>
      </div>

      {/* O texto vem tal como foi escrito: as mudanças de linha contam, nada é HTML. */}
      <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-white/95 [overflow-wrap:anywhere] sm:pl-[3.25rem] sm:text-[17px]">
        {r.corpo}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:pl-[3.25rem]">
        <BotaoVoto id={r.id} total={r.votos} rotulo={rotulos.votar} rotuloRetirar={rotulos.retirarVoto} forma="linha" />
        <BotaoIrResponder nome={r.autorNome} className={accao}>
          <CornerDownRight className="size-4" aria-hidden />
          <span>{rotulos.responder}</span>
        </BotaoIrResponder>
        {/* A denúncia aponta ao tópico: a moderação vê a discussão inteira. */}
        <Denunciar tipo="forum" alvoId={topicoId} rotulo={rotulos.reportar} icone={false} classeBotao={accao} />
      </div>
    </li>
  );
}

/* ---------- Caixa de resposta ---------- */

const chaveRascunho = (topicoId: string) => `motobox-resposta-${topicoId}`;

export function CaixaResposta({
  topicoId, textos: t = FORUM_PADRAO.resposta,
}: {
  topicoId: string;
  /** Textos da caixa, editáveis no painel (paginas.forum). */
  textos?: ConteudoForum["resposta"];
}) {
  const exigirSessao = useExigirSessao();
  const { utilizador, perfil } = useAuth();
  const { idioma } = useIdioma();
  const { adicionar, registarCampo } = useDiscussao();
  const campo = useRef<HTMLTextAreaElement | null>(null);
  const router = useRouter();
  const [, iniciarTransicao] = useTransition();
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [publicada, setPublicada] = useState(false);

  // Atributos não passam pelo TraduzirPagina (só texto): traduz-se aqui.
  const tr = (pt: string) => (idioma === "en" && interfaceEn[pt]) || pt;

  // O campo não é controlado: o rascunho entra directamente, sem desenhar duas vezes.
  useEffect(() => {
    const el = campo.current;
    if (!el || el.value) return;
    try {
      const guardado = localStorage.getItem(chaveRascunho(topicoId));
      if (guardado) el.value = guardado;
    } catch { /* indisponível */ }
  }, [topicoId]);

  const guardarRascunho = () => {
    try {
      const v = campo.current?.value ?? "";
      if (v.trim()) localStorage.setItem(chaveRascunho(topicoId), v);
      else localStorage.removeItem(chaveRascunho(topicoId));
    } catch { /* indisponível */ }
  };

  async function enviar(texto: string) {
    setAEnviar(true);
    setErro(null);
    try {
      const r = await fetch(comBase("/api/forum/responder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicoId, corpo: texto }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.resposta) {
        setErro(r.status === 401
          ? "A sua sessão terminou. Entre de novo para publicar."
          : String(j.erro ?? `Erro ${r.status}. Tente de novo.`));
        return;
      }
      adicionar(j.resposta as RespostaPublica);
      if (campo.current) campo.current.value = "";
      try { localStorage.removeItem(chaveRascunho(topicoId)); } catch { /* indisponível */ }
      setPublicada(true);
      // Traz a contagem e a resposta já guardada; a cópia local sai nessa altura.
      iniciarTransicao(() => router.refresh());
    } catch {
      setErro("Sem ligação à internet. Tente de novo.");
    } finally {
      setAEnviar(false);
    }
  }

  const publicar = (e: React.FormEvent) => {
    e.preventDefault();
    if (aEnviar) return;
    const texto = campo.current?.value.trim() ?? "";
    setPublicada(false);
    if (texto.length < RESPOSTA_MIN) {
      setErro("Escreva a sua resposta antes de publicar.");
      campo.current?.focus();
      return;
    }
    setErro(null);
    guardarRascunho();
    // Sem sessão abre a janela; depois de entrar, a pessoa volta a carregar em publicar.
    exigirSessao(() => void enviar(texto), { motivo: "Para responder no fórum precisa de sessão." });
  };

  const nomeMeta = utilizador?.user_metadata?.nome;
  const nome = perfil?.nome || (typeof nomeMeta === "string" ? nomeMeta : "") || utilizador?.email || "";

  return (
    <form onSubmit={publicar} noValidate className="painel painel-escuro p-4 sm:p-5">
      <h2 id="responder" className="flex items-center gap-2.5 text-lg font-semibold text-white">
        <MessageSquarePlus className="size-5" aria-hidden />
        <span>{t.titulo}</span>
      </h2>
      <textarea
        ref={(el) => { campo.current = el; registarCampo(el); }}
        rows={5}
        maxLength={RESPOSTA_MAX}
        aria-labelledby="responder"
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? "responder-erro" : undefined}
        placeholder={tr(t.placeholder)}
        onInput={() => { guardarRascunho(); if (erro) setErro(null); setPublicada(false); }}
        className="campo mt-3 resize-y text-base placeholder:text-white/70"
      />

      {erro && (
        <p id="responder-erro" role="alert" className="mt-2 text-sm font-medium text-[#ff8a80]">{erro}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-white/85" aria-live="polite">
          {publicada ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-[#bbf7d0]">
              <Icon name="check" className="size-4" />
              <span>{t.publicada}</span>
            </span>
          ) : utilizador ? (
            <>
              <span>{t.aResponderComo}</span>{" "}
              <span className="font-semibold text-white">{nome}</span>
            </>
          ) : (
            <span>{t.semSessao}</span>
          )}
        </p>
        <button
          type="submit"
          disabled={aEnviar}
          className="inline-flex h-11 items-center gap-2 rounded-[var(--raio)] bg-mb-red px-5 text-[15px] font-semibold text-white transition-colors hover:bg-mb-red-dark disabled:opacity-70"
        >
          {aEnviar ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" aria-hidden />
              <span>{t.aPublicar}</span>
            </>
          ) : (
            <>
              <span>{t.publicar}</span>
              <Icon name="arrow" className="size-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
