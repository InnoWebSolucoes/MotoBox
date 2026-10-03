"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  useSyncExternalStore, useTransition, type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@/components/ui";
import { Denunciar } from "@/components/Denunciar";
import { useExigirSessao } from "@/components/SessaoObrigatoria";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";
import { interfaceEn } from "@/lib/i18n/interface-en";
import { RESPOSTA_MAX, RESPOSTA_MIN, type RespostaPublica } from "@/lib/forum/tipos";
import { comBase } from "@/lib/base";

/* ============================================================
   MOTOBOX — Respostas dos membros e caixa de resposta
   A caixa pede sessão só quando se carrega em publicar: sem ela,
   abre-se a janela de entrar/criar conta e o texto fica onde
   estava. O rascunho também fica guardado neste navegador, para
   sobreviver ao recarregar que a confirmação da conta provoca.
   A resposta publicada aparece logo; quando a página volta do
   servidor com ela, a cópia local deixa de ser mostrada.
   ============================================================ */

/* ---------- Respostas acabadas de publicar ---------- */

interface Discussao {
  novas: RespostaPublica[];
  adicionar: (r: RespostaPublica) => void;
}

const Ctx = createContext<Discussao | null>(null);

export function DiscussaoProvider({ children }: { children: ReactNode }) {
  const [novas, setNovas] = useState<RespostaPublica[]>([]);
  const adicionar = useCallback((r: RespostaPublica) => {
    setNovas((l) => (l.some((x) => x.id === r.id) ? l : [...l, r]));
  }, []);
  const valor = useMemo(() => ({ novas, adicionar }), [novas, adicionar]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

function useDiscussao(): Discussao {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDiscussao tem de ser usado dentro de <DiscussaoProvider>");
  return ctx;
}

/** As que o servidor ainda não trouxe (o `router.refresh()` demora um instante). */
export function RespostasNovas({ idsServidor, topicoId }: { idsServidor: string[]; topicoId: string }) {
  const { novas } = useDiscussao();
  const porMostrar = novas.filter((r) => !idsServidor.includes(r.id));
  if (porMostrar.length === 0) return null;
  return (
    <ol>
      {porMostrar.map((r) => <ItemResposta key={r.id} resposta={r} topicoId={topicoId} />)}
    </ol>
  );
}

/* ---------- Uma resposta ---------- */

/** Mesmo desenho das respostas de exemplo: avatar com a cor da pessoa, nome, quando, texto. */
export function ItemResposta({ resposta: r, topicoId }: { resposta: RespostaPublica; topicoId: string }) {
  return (
    <li className="border-b border-white/6 py-8">
      <div className="flex items-center gap-3 sm:gap-5">
        <span
          className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full font-display text-xs text-white sm:size-12 sm:text-sm"
          style={{ background: r.autorCor }}
          aria-hidden
        >
          {r.autorAvatar ? (
            // A imagem já vem reduzida do envio (máx. 512 px); a cor fica por trás de um PNG transparente.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.autorAvatar} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
          ) : (
            (r.autorNome.trim()[0] ?? "?").toUpperCase()
          )}
        </span>
        <p className="flex min-w-0 flex-wrap items-baseline gap-x-2.5">
          <span className="truncate font-ui text-lg leading-tight text-white">{r.autorNome}</span>
          <TempoRelativo iso={r.criadoEm} className="text-sm text-ink-500" />
        </p>
      </div>

      <div className="mt-4 sm:pl-[4.25rem]">
        {/* O texto vem tal como foi escrito: as mudanças de linha contam, nada é HTML. */}
        <p className="whitespace-pre-line text-base leading-relaxed text-ink-200 [overflow-wrap:anywhere] sm:text-[17px]">
          {r.corpo}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {/* A denúncia aponta a esta resposta, dentro do tópico: a moderação vê as duas. */}
          <Denunciar tipo="forum" alvoId={topicoId} respostaId={r.id} rotulo="Reportar" icone={false}
            classeBotao="font-ui text-sm text-ink-500 transition-colors hover:text-white" />
        </div>
      </div>
    </li>
  );
}

/* ---------- "há 5 minutos" ---------- */

// O servidor não sabe a que horas a página vai ser vista (fica em cache), por
// isso desenha a data e o navegador troca-a pelo tempo relativo, minuto a minuto.
const subscreverMinuto = (aviso: () => void) => {
  const id = window.setInterval(aviso, 30_000);
  return () => window.clearInterval(id);
};
const minutoActual = () => Math.floor(Date.now() / 60_000);
const semMinuto = () => null;

function relativo(data: Date, agora: number, locale: string): string | null {
  const segundos = Math.max(0, Math.round((agora - data.getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (segundos < 60) return rtf.format(0, "second");
  if (segundos < 3600) return rtf.format(-Math.floor(segundos / 60), "minute");
  if (segundos < 86_400) return rtf.format(-Math.floor(segundos / 3600), "hour");
  if (segundos < 7 * 86_400) return rtf.format(-Math.floor(segundos / 86_400), "day");
  return null;
}

function TempoRelativo({ iso, className }: { iso: string; className?: string }) {
  const { locale } = useIdioma();
  const minuto = useSyncExternalStore(subscreverMinuto, minutoActual, semMinuto);
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  const absoluto = data.toLocaleDateString(locale, {
    day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Luanda",
  });
  const texto = (minuto !== null && relativo(data, minuto * 60_000, locale)) || absoluto;
  return <time dateTime={iso} title={absoluto} className={className}>{texto}</time>;
}

/* ---------- Caixa de resposta ---------- */

const chaveRascunho = (topicoId: string) => `motobox-resposta-${topicoId}`;

export function CaixaResposta({ topicoId }: { topicoId: string }) {
  const exigirSessao = useExigirSessao();
  const { utilizador, perfil } = useAuth();
  const { idioma } = useIdioma();
  const { adicionar } = useDiscussao();
  const router = useRouter();
  const [, iniciarTransicao] = useTransition();
  const campo = useRef<HTMLTextAreaElement>(null);
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
    <form onSubmit={publicar} noValidate>
      <h2 id="responder" className="font-display text-xl uppercase text-white">Responder</h2>
      <textarea
        ref={campo}
        rows={5}
        maxLength={RESPOSTA_MAX}
        aria-labelledby="responder"
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? "responder-erro" : undefined}
        placeholder={tr("Escreva a sua resposta…")}
        onInput={() => { guardarRascunho(); if (erro) setErro(null); setPublicada(false); }}
        className="mt-4 w-full resize-y bg-ink-900 p-4 text-base text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 outline-none focus:ring-2 focus:ring-mb-red"
      />

      {erro && (
        <p id="responder-erro" role="alert" className="mt-2 text-sm text-mb-red-light">{erro}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-500" aria-live="polite">
          {publicada ? (
            <span className="inline-flex items-center gap-1.5 text-ink-200">
              <Icon name="check" className="size-4" />
              <span>Resposta publicada.</span>
            </span>
          ) : utilizador ? (
            <>
              <span>A responder como</span>{" "}
              <span className="text-white">{nome}</span>
            </>
          ) : (
            <span>Ao publicar, pedimos que entre ou crie conta.</span>
          )}
        </p>
        <Button type="submit" disabled={aEnviar}>
          {aEnviar ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
              <span>A publicar…</span>
            </>
          ) : (
            <>
              <span>Publicar resposta</span>
              <Icon name="arrow" className="size-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
