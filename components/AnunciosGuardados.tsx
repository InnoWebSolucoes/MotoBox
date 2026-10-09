"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Placeholder } from "@/components/Brand";
import { SeloVerificado } from "@/components/SeloVerificado";
import { ButtonLink, Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth/contexto";
import { formatKz } from "@/lib/data";
import type { AnuncioGuardado } from "@/lib/conta/favoritos";
import { comBase } from "@/lib/base";

/**
 * Anúncios que a pessoa com sessão guardou no marketplace (botão "Guardar"
 * de cada anúncio), com ligação para cada um e "Remover". Lê e escreve em
 * /api/conta/favoritos; os anúncios que deixaram de estar publicados não
 * aparecem. Sem sessão não mostra nada.
 */
export function AnunciosGuardados({
  className = "",
  aoContar,
}: {
  className?: string;
  /** Chamado com o número de anúncios mostrados, sempre que muda (ex.: contador num separador). */
  aoContar?: (total: number) => void;
}) {
  const { utilizador } = useAuth();
  const uid = utilizador?.id;
  // A lista fica marcada com a conta: ao trocar de conta, a antiga deixa de valer.
  const [lista, setLista] = useState<{ dono: string; anuncios: AnuncioGuardado[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [aRemover, setARemover] = useState<string[]>([]);

  const aoContarRef = useRef(aoContar);
  useEffect(() => { aoContarRef.current = aoContar; }, [aoContar]);

  const anuncios = lista && lista.dono === uid ? lista.anuncios : null;
  const total = anuncios?.length;
  useEffect(() => { if (total !== undefined) aoContarRef.current?.(total); }, [total]);

  useEffect(() => {
    if (!uid) return;
    let vivo = true;
    fetch(comBase("/api/conta/favoritos?anuncios=1"), { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!vivo) return;
        if (!r.ok) {
          setErro(String(j.erro ?? "Não foi possível ler os anúncios guardados."));
          return;
        }
        const recebidos: AnuncioGuardado[] = Array.isArray(j.anuncios) ? j.anuncios : [];
        setErro(null);
        setLista({ dono: uid, anuncios: recebidos });
      })
      .catch(() => { if (vivo) setErro("Sem ligação à internet. Tente de novo."); });
    return () => { vivo = false; };
  }, [uid, tentativa]);

  async function remover(a: AnuncioGuardado) {
    if (!uid || aRemover.includes(a.id)) return;
    setARemover((r) => [...r, a.id]);
    setErro(null);
    try {
      const r = await fetch(comBase("/api/conta/favoritos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, guardar: false }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(String(j.erro ?? "Não foi possível remover o anúncio. Tente de novo."));
        return;
      }
      setLista((l) => (l ? { ...l, anuncios: l.anuncios.filter((x) => x.id !== a.id) } : l));
    } catch {
      setErro("Sem ligação à internet. Tente de novo.");
    } finally {
      setARemover((r) => r.filter((x) => x !== a.id));
    }
  }

  if (!uid) return null;

  // A carregar: três linhas a pulsar, com a forma da lista.
  if (!anuncios && !erro) {
    return (
      <div className={className} aria-busy="true" aria-label="A carregar anúncios guardados">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/6 py-4 last:border-0">
            <div className="aspect-[4/3] w-24 shrink-0 animate-pulse rounded-media bg-ink-800 sm:w-32" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded-full bg-ink-800" />
              <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-ink-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!anuncios) {
    return (
      <div className={className}>
        <p role="alert" className="text-sm text-mb-red-light">{erro}</p>
        <button
          type="button"
          onClick={() => { setErro(null); setTentativa((t) => t + 1); }}
          className="mt-3 inline-flex h-9 items-center rounded-full bg-ink-800 px-4 font-ui text-sm text-white transition-colors hover:bg-ink-700"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (anuncios.length === 0) {
    return (
      <div className={className}>
        <p className="font-display text-lg uppercase text-ink-300">Ainda não guardou anúncios</p>
        <p className="mt-1.5 text-sm text-ink-300">
          Carregue em Guardar num anúncio do marketplace para o encontrar aqui mais tarde.
        </p>
        <ButtonLink href="/marketplace" variant="dark" size="sm" className="mt-5">
          Ver o marketplace
          <Icon name="arrow" className="size-4" />
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className={className}>
      {erro && <p role="alert" className="mb-3 text-sm text-mb-red-light">{erro}</p>}
      <ul>
        {anuncios.map((a) => (
          <li key={a.id} className="flex items-center gap-3 border-b border-white/6 py-4 last:border-0 sm:gap-4">
            <Link href={`/marketplace/${a.id}`} className="group flex min-w-0 flex-1 items-center gap-4">
              <div className="media relative aspect-[4/3] w-24 shrink-0 sm:w-32">
                <Placeholder
                  nome={a.imagem}
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                  tamanhos="128px"
                  largura={400}
                />
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg leading-none text-white tabular-nums">{formatKz(a.preco)}</p>
                <p className="mt-2 flex items-start gap-1.5 font-display text-sm uppercase leading-snug text-white transition-colors group-hover:text-mb-red-light">
                  <span className="line-clamp-2">{a.titulo}</span>
                  {a.verificado && <SeloVerificado tamanho={14} className="mt-0.5" />}
                </p>
                <p className="mt-1.5 text-xs text-ink-300">
                  {[a.provincia, a.estado, a.negociavel ? "Negociável" : ""].filter(Boolean).join(" · ")}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => remover(a)}
              disabled={aRemover.includes(a.id)}
              aria-label={`Remover dos guardados: ${a.titulo}`}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 font-ui text-sm text-ink-300 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-50"
            >
              <Icon name="close" className="size-3.5" />
              <span className="hidden sm:inline">{aRemover.includes(a.id) ? "A remover…" : "Remover"}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
