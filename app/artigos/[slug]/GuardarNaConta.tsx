"use client";

/* Guardar o artigo na área de membro (/conta → Guardados). Com sessão,
   lê se já está guardado e guarda ou retira com um clique; sem sessão,
   leva a entrar e volta ao artigo. */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/lib/auth/contexto";
import { comBase } from "@/lib/base";

const CLASSE =
  "mt-3 inline-flex h-11 items-center gap-2 rounded-[var(--raio)] px-4 text-sm text-white transition-colors";

export function GuardarNaConta({
  slug, rotulo = "Guardar", botao = "Guardar artigo", guardadoTexto = "Guardado na sua conta",
}: { slug: string; rotulo?: string; botao?: string; guardadoTexto?: string }) {
  const { utilizador, carregando } = useAuth();
  const [guardado, setGuardado] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!utilizador) return;
    let vivo = true;
    fetch(comBase("/api/conta/artigos"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo && j) setGuardado(Array.isArray(j.slugs) && j.slugs.includes(slug)); })
      .catch(() => { /* sem rede: o botão fica no estado por omissão */ });
    return () => { vivo = false; };
  }, [utilizador, slug]);

  const alternar = async () => {
    setOcupado(true);
    setErro(null);
    try {
      const r = await fetch(comBase("/api/conta/artigos"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, guardar: !guardado }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro ?? "Não foi possível guardar.");
      setGuardado(Array.isArray(j.slugs) ? j.slugs.includes(slug) : !guardado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível guardar.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-white/70">{rotulo}</p>
      {!carregando && !utilizador ? (
        <Link
          href={`/entrar?destino=${encodeURIComponent(`/artigos/${slug}`)}`}
          className={`${CLASSE} bg-white/8 hover:bg-white/15`}
        >
          <Bookmark className="size-4" aria-hidden />
          {botao}
        </Link>
      ) : (
        <button
          type="button"
          onClick={alternar}
          disabled={ocupado || carregando || guardado === null}
          aria-pressed={Boolean(guardado)}
          className={`${CLASSE} disabled:opacity-60 ${guardado ? "bg-mb-red hover:bg-mb-red-dark" : "bg-white/8 hover:bg-white/15"}`}
        >
          <Bookmark className="size-4" fill={guardado ? "currentColor" : "none"} aria-hidden />
          <span aria-live="polite">{guardado ? guardadoTexto : botao}</span>
        </button>
      )}
      {erro && <p role="alert" className="mt-2 text-xs text-mb-red-light">{erro}</p>}
    </div>
  );
}
