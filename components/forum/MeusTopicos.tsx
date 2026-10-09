"use client";

/* ============================================================
   MOTOBOX — Fórum: "Os meus tópicos"
   Só aparece com sessão. Os tópicos de cada membro conhecem-se
   pela mensagem de abertura (ver app/forum/_servidor/forum.ts),
   que guarda a conta de quem o abriu; o servidor devolve só os
   desta pessoa.
   ============================================================ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth/contexto";
import { comBase } from "@/lib/base";
import type { MeuTopico } from "./tipos";

type Estado = { uid: string; topicos: MeuTopico[] } | null;

export function MeusTopicos({
  titulo, vazio, aguarda, criar,
}: { titulo: string; vazio: string; aguarda: string; criar: string }) {
  const { utilizador } = useAuth();
  const uid = utilizador?.id ?? null;
  const [estado, setEstado] = useState<Estado>(null);

  useEffect(() => {
    if (!uid) return;
    let vivo = true;
    fetch(comBase("/api/forum/topicos"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (vivo && j && Array.isArray(j.topicos)) setEstado({ uid, topicos: j.topicos as MeuTopico[] });
      })
      .catch(() => { /* sem rede: o quadro não aparece */ });
    return () => { vivo = false; };
  }, [uid]);

  // Só o que foi lido para a conta actual (ao sair, o quadro desaparece logo).
  if (!uid || !estado || estado.uid !== uid) return null;
  const { topicos } = estado;

  return (
    <section className="painel painel-escuro p-5" aria-labelledby="meus-topicos">
      <h2 id="meus-topicos" className="text-lg font-semibold text-white">{titulo}</h2>
      {topicos.length === 0 ? (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-white/85">{vazio}</p>
          <Link href="/forum/novo" className="mt-3 inline-flex text-sm font-semibold text-white">
            <span className="sublinhado">{criar}</span>
          </Link>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-white/10">
          {topicos.slice(0, 6).map((t) => {
            const dentro = (
              <>
                <span className="line-clamp-2 text-[15px] font-medium leading-snug text-white group-hover:underline">{t.titulo}</span>
                <span className="mt-1 flex items-center gap-1.5 text-[13px] text-white/80">
                  <MessageSquare className="size-3.5" aria-hidden />
                  <span className="tabular-nums">{t.respostas}</span>
                  {!t.publicado && <span className="ml-1 rounded-[3px] bg-gold/20 px-1.5 text-[12px] font-semibold text-gold">{aguarda}</span>}
                </span>
              </>
            );
            return (
              <li key={t.id}>
                {/* Escondido (à espera da equipa) ainda não tem página pública. */}
                {t.publicado ? (
                  <Link href={`/forum/${encodeURIComponent(t.id)}`} className="group block py-2.5">{dentro}</Link>
                ) : (
                  <div className="py-2.5">{dentro}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
