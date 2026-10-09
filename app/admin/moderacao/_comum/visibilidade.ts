"use client";

/* ============================================================
   MOTOBOX ADMIN — Visibilidade de anúncios e tópicos (cliente)
   Lê quais estão escondidos do site e muda-os, através de
   /admin/moderacao/visibilidade. Sem base de dados (modo de
   demonstração local), guarda a escolha neste navegador para o
   painel poder ser experimentado.
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { comBase } from "@/lib/base";

export type TipoVisivel = "anuncios" | "topicos";
type Ocultos = Record<TipoVisivel, string[]>;

const CHAVE_LOCAL = "motobox-admin-ocultos";
const VAZIO: Ocultos = { anuncios: [], topicos: [] };

function lerLocal(): Ocultos {
  try {
    const j = JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? "null") as Partial<Ocultos> | null;
    return { anuncios: j?.anuncios ?? [], topicos: j?.topicos ?? [] };
  } catch {
    return VAZIO;
  }
}

async function lerServidor(): Promise<{ ocultos: Ocultos; local: boolean }> {
  const r = await fetch(comBase("/admin/moderacao/visibilidade"), { cache: "no-store" });
  if (r.status === 503) return { ocultos: lerLocal(), local: true };
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.ocultos) throw new Error(String(j?.erro ?? "Não foi possível ler o que está escondido."));
  return { ocultos: j.ocultos as Ocultos, local: false };
}

export function useVisibilidade() {
  const [ocultos, setOcultos] = useState<Ocultos | null>(null);
  const [local, setLocal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    lerServidor().then(
      (r) => { if (vivo) { setOcultos(r.ocultos); setLocal(r.local); } },
      (e) => { if (vivo) { setErro(e instanceof Error ? e.message : "Falha ao ler."); setOcultos(VAZIO); } },
    );
    return () => { vivo = false; };
  }, []);

  const visivel = useCallback(
    (tipo: TipoVisivel, id: string) => !(ocultos?.[tipo] ?? []).includes(id),
    [ocultos],
  );

  /** Mostra ou esconde. Devolve null quando correu bem, senão o motivo. */
  const mudar = useCallback(async (tipo: TipoVisivel, id: string, mostrar: boolean): Promise<string | null> => {
    const aplicar = (o: Ocultos | null): Ocultos => {
      const base = o ?? VAZIO;
      const lista = base[tipo].filter((x) => x !== id);
      return { ...base, [tipo]: mostrar ? lista : [...lista, id] };
    };
    const antes = ocultos;
    setOcultos(aplicar);
    if (local) {
      try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify(aplicar(antes))); } catch { /* indisponível */ }
      return null;
    }
    try {
      const r = await fetch(comBase("/admin/moderacao/visibilidade"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, id, publicado: mostrar }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(String(j.erro ?? `Erro ${r.status}`));
      return null;
    } catch (e) {
      setOcultos(antes);
      return e instanceof Error ? e.message : "Falha de rede.";
    }
  }, [ocultos, local]);

  return { pronto: ocultos !== null, ocultos: ocultos ?? VAZIO, visivel, mudar, local, erro };
}
