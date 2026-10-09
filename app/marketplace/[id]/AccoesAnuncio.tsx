"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/contexto";
import { useExigirSessao } from "@/components/SessaoObrigatoria";
import { Partilhar } from "@/components/Partilhar";
import { Button, Icon } from "@/components/ui";
import { formatKz } from "@/lib/data";
import { ContactarVendedor } from "./ContactarVendedor";
import { comBase } from "@/lib/base";

interface Aviso {
  texto: string;
  tipo: "ok" | "erro";
}

/** Coração do botão Guardar: cheio quando o anúncio está guardado. */
function Coracao({ cheio }: { cheio: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-4 ${cheio ? "text-mb-red" : ""}`} aria-hidden="true">
      <path
        d="M12 20s-7-4.4-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20Z"
        fill={cheio ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Acções da coluna de compra: contactar o vendedor, guardar o anúncio
 * na conta (user_metadata.favoritos, via /api/conta/favoritos) e partilhar
 * (WhatsApp, Facebook, Instagram, X, Telegram, email, copiar a ligação;
 * ver components/Partilhar.tsx).
 */
export function AccoesAnuncio({
  anuncioId, titulo, preco, vendedorNome, vendedorAuthId, mensagemInicial,
}: {
  anuncioId: string;
  titulo: string;
  preco: number;
  vendedorNome: string;
  vendedorAuthId?: string;
  /** Mensagem já escrita ao abrir "Contactar vendedor" (editável no painel). */
  mensagemInicial?: string;
}) {
  const { utilizador } = useAuth();
  const exigirSessao = useExigirSessao();
  const uid = utilizador?.id;

  // Aviso curto no fundo do ecrã (erros ao guardar).
  const [aviso, setAviso] = useState<Aviso | null>(null);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 5000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  /* ---------- Guardar ---------- */
  // A lista fica marcada com a conta a que pertence: ao trocar de conta, a
  // antiga deixa de contar sem ser preciso limpá-la num efeito.
  const [favoritos, setFavoritos] = useState<{ dono: string; ids: string[] } | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const guardado = Boolean(uid && favoritos?.dono === uid && favoritos.ids.includes(anuncioId));
  // Cada escrita incrementa: uma leitura que chegue depois de uma escrita já não manda.
  const operacao = useRef(0);
  const uidRef = useRef(uid);
  useEffect(() => { uidRef.current = uid; }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const versao = operacao.current;
    let vivo = true;
    fetch(comBase("/api/conta/favoritos"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (vivo && versao === operacao.current && Array.isArray(j?.ids)) setFavoritos({ dono: uid, ids: j.ids });
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, [uid]);

  const aplicar = (ids: string[], guardar: boolean) =>
    guardar ? [anuncioId, ...ids.filter((x) => x !== anuncioId)] : ids.filter((x) => x !== anuncioId);

  async function gravar(guardar: boolean) {
    const versao = ++operacao.current;
    const dono = uidRef.current ?? "";
    // Mostra já o resultado; se o servidor recusar, volta atrás.
    setFavoritos((f) => ({ dono, ids: aplicar(f?.dono === dono ? f.ids : [], guardar) }));
    setAGuardar(true);
    try {
      const r = await fetch(comBase("/api/conta/favoritos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: anuncioId, guardar }),
      });
      const j = await r.json().catch(() => ({}));
      if (versao !== operacao.current) return;
      if (!r.ok) {
        setFavoritos((f) => ({ dono, ids: aplicar(f?.ids ?? [], !guardar) }));
        setAviso({ tipo: "erro", texto: String(j.erro ?? "Não foi possível guardar. Tente de novo.") });
        return;
      }
      setFavoritos({ dono: uidRef.current ?? dono, ids: Array.isArray(j.ids) ? j.ids : [] });
    } catch {
      if (versao !== operacao.current) return;
      setFavoritos((f) => ({ dono, ids: aplicar(f?.ids ?? [], !guardar) }));
      setAviso({ tipo: "erro", texto: "Sem ligação à internet. Tente de novo." });
    } finally {
      if (versao === operacao.current) setAGuardar(false);
    }
  }

  function carregarGuardar() {
    if (aGuardar) return;
    const guardar = !guardado;
    exigirSessao(() => gravar(guardar), {
      continuar: true,
      motivo: "Para guardar anúncios precisa de sessão.",
    });
  }

  return (
    <>
      <div className="mt-6 space-y-2">
        <ContactarVendedor
          anuncioId={anuncioId}
          titulo={titulo}
          preco={preco}
          vendedorNome={vendedorNome}
          vendedorAuthId={vendedorAuthId}
          mensagemInicial={mensagemInicial}
        />
        <div className="flex gap-2">
          <Button
            variant="dark"
            className="flex-1"
            onClick={carregarGuardar}
            aria-pressed={guardado}
            aria-busy={aGuardar || undefined}
          >
            <Coracao cheio={guardado} />
            {guardado ? "Guardado" : "Guardar"}
          </Button>
          <Partilhar
            caminho={`/marketplace/${encodeURIComponent(anuncioId)}`}
            titulo={titulo}
            texto={`${titulo} · ${formatKz(preco)}`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--raio)] bg-white/8 px-5 text-[15px] text-white transition-colors hover:bg-white/15 aria-expanded:bg-white/15"
          />
        </div>
      </div>

      {/* Aviso curto no fundo do ecrã. A região existe sempre, para ser anunciada. */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4">
        {aviso && (
          <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-sm text-ink-950 shadow-2xl shadow-black/40">
            <Icon
              name={aviso.tipo === "ok" ? "check" : "help"}
              className={`size-4 shrink-0 ${aviso.tipo === "ok" ? "text-ok" : "text-mb-red"}`}
            />
            <span className="font-ui text-base leading-tight">{aviso.texto}</span>
            <button
              type="button"
              onClick={() => setAviso(null)}
              aria-label="Fechar aviso"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-600 transition-colors hover:bg-ink-950/8 hover:text-ink-950"
            >
              <Icon name="close" className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
