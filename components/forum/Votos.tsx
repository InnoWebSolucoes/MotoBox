"use client";

/* ============================================================
   MOTOBOX — Fórum: votos
   <VotosProvider ids={[…]}> pergunta uma vez ao servidor em quais
   destes tópicos e respostas a pessoa já votou (só com sessão).
   <BotaoVoto> mostra a contagem e dá ou retira o voto, logo no
   ecrã; se o servidor recusar, volta atrás e diz porquê. Sem
   sessão, abre a janela de entrar e o voto segue depois.
   ============================================================ */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { ArrowBigUp } from "lucide-react";
import { useAuth } from "@/lib/auth/contexto";
import { useExigirSessao } from "@/components/SessaoObrigatoria";
import { comBase } from "@/lib/base";

interface Ctx {
  votado: (id: string) => boolean;
  total: (id: string, base: number) => number;
  alternar: (id: string, base: number) => void;
}

const Contexto = createContext<Ctx | null>(null);

export function VotosProvider({ ids, children }: { ids: string[]; children: ReactNode }) {
  const { utilizador } = useAuth();
  const exigirSessao = useExigirSessao();
  const [meus, setMeus] = useState<Set<string>>(() => new Set());
  /** Diferença ao total do servidor, por voto dado ou retirado neste ecrã. */
  const [delta, setDelta] = useState<Record<string, number>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const uid = utilizador?.id ?? null;
  const chaveIds = ids.join(",");

  // Em quais destes já votou (pedido depois de pintar, com a sessão).
  useEffect(() => {
    if (!uid || !chaveIds) return;
    let vivo = true;
    fetch(comBase(`/api/forum/votar?ids=${encodeURIComponent(chaveIds)}`), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (vivo && j && Array.isArray(j.meus)) setMeus(new Set(j.meus.filter((x: unknown) => typeof x === "string")));
      })
      .catch(() => { /* sem rede: os botões ficam como estão */ });
    return () => { vivo = false; };
  }, [uid, chaveIds]);

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 4000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const enviar = useCallback(async (id: string, querVotar: boolean, base: number) => {
    const aplicar = (votar: boolean) => {
      setMeus((m) => {
        const n = new Set(m);
        if (votar) n.add(id); else n.delete(id);
        return n;
      });
    };
    aplicar(querVotar);
    setDelta((d) => ({ ...d, [id]: (d[id] ?? 0) + (querVotar ? 1 : -1) }));
    try {
      const r = await fetch(comBase("/api/forum/votar"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alvoId: id, votar: querVotar }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(String(j.erro ?? `Erro ${r.status}.`));
      // O servidor manda o total certo: acerta a diferença a partir dele.
      if (typeof j.total === "number") setDelta((d) => ({ ...d, [id]: j.total - base }));
      aplicar(Boolean(j.votado));
    } catch (e) {
      aplicar(!querVotar);
      setDelta((d) => ({ ...d, [id]: (d[id] ?? 0) - (querVotar ? 1 : -1) }));
      setAviso(e instanceof Error ? e.message : "Não foi possível votar. Tente de novo.");
    }
  }, []);

  const valor = useMemo<Ctx>(() => ({
    votado: (id) => meus.has(id),
    total: (id, base) => Math.max(0, base + (delta[id] ?? 0)),
    alternar: (id, base) => {
      const querVotar = !meus.has(id);
      // Sem sessão: entra primeiro e o voto segue (dar o voto é sempre o pedido).
      exigirSessao(() => void enviar(id, querVotar, base), { motivo: "Para votar no fórum precisa de sessão.", continuar: true });
    },
  }), [meus, delta, exigirSessao, enviar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <p
        role="status"
        aria-live="polite"
        className={aviso
          ? "fixed bottom-24 left-1/2 z-[90] w-[min(92vw,26rem)] -translate-x-1/2 rounded-[var(--raio)] bg-near-black px-4 py-3 text-center text-sm text-white shadow-2xl ring-1 ring-white/15 lg:bottom-28"
          : "sr-only"}
      >
        {aviso ?? ""}
      </p>
    </Contexto.Provider>
  );
}

/**
 * Seta de voto com a contagem. `vertical` na coluna dos cartões de tópico,
 * `linha` nas respostas.
 */
export function BotaoVoto({
  id, total: base, rotulo, rotuloRetirar, forma = "vertical", className = "",
}: {
  id: string;
  total: number;
  rotulo: string;
  rotuloRetirar: string;
  forma?: "vertical" | "linha";
  className?: string;
}) {
  const ctx = useContext(Contexto);
  const votado = ctx?.votado(id) ?? false;
  const total = ctx ? ctx.total(id, base) : base;
  const nome = `${votado ? rotuloRetirar : rotulo} (${total})`;

  const seta = (
    <ArrowBigUp
      aria-hidden
      className={`size-5 transition-transform motion-safe:group-active/voto:-translate-y-0.5 ${votado ? "fill-current" : ""}`}
    />
  );

  if (forma === "linha") {
    return (
      <button
        type="button"
        onClick={() => ctx?.alternar(id, base)}
        aria-pressed={votado}
        aria-label={nome}
        title={votado ? rotuloRetirar : rotulo}
        className={`group/voto relative z-10 inline-flex h-9 items-center gap-1.5 rounded-[4px] px-2.5 text-sm font-semibold tabular-nums transition-colors ${
          votado ? "bg-mb-red text-white hover:bg-mb-red-dark" : "bg-white/8 text-white hover:bg-white/15"
        } ${className}`}
      >
        {seta}
        <span>{total}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => ctx?.alternar(id, base)}
      aria-pressed={votado}
      aria-label={nome}
      title={votado ? rotuloRetirar : rotulo}
      className={`group/voto relative z-10 flex w-12 flex-col items-center gap-0.5 rounded-[4px] py-2 text-[15px] font-semibold tabular-nums transition-colors ${
        votado ? "bg-mb-red text-white hover:bg-mb-red-dark" : "bg-white/8 text-white hover:bg-white/15"
      } ${className}`}
    >
      {seta}
      <span>{total}</span>
    </button>
  );
}
