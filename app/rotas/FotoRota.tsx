"use client";

/*
 * Fotografia do Commons, servida directamente pelo upload.wikimedia.org numa
 * largura-padrão de miniatura (ver lib/rotas-fotos.ts: o optimizador do Next
 * levava 429 do Commons quando pedia várias de seguida).
 *
 * Se o Commons não a entregar, a fotografia esconde-se e fica o fundo escuro
 * do painel, em vez do ícone de imagem partida.
 */

import Image from "next/image";
import { useState } from "react";
import { temImagem, urlCommons, type Foto, type LarguraCommons } from "@/lib/rotas-tipos";

export function FotoRota({
  foto,
  tamanhos,
  largura = 960,
  prioridade = false,
  className = "",
}: {
  foto: Foto;
  tamanhos: string;
  /** Largura da miniatura pedida ao Commons. */
  largura?: LarguraCommons;
  prioridade?: boolean;
  className?: string;
}) {
  const [falhou, setFalhou] = useState(false);
  if (falhou || !temImagem(foto)) return null;
  return (
    <Image
      src={urlCommons(foto, largura)}
      alt={foto.alt}
      fill
      sizes={tamanhos}
      priority={prioridade}
      unoptimized
      onError={() => setFalhou(true)}
      style={foto.foco ? { objectPosition: foto.foco } : undefined}
      className={`foto-painel object-cover ${className}`}
    />
  );
}

/** Fotografia de rota com os cantos do painel (cartões e galeria). Sem fotografia, fica o fundo escuro. */
export function QuadroRota({
  foto,
  tamanhos,
  largura,
  className = "",
}: {
  foto: Foto | undefined;
  tamanhos: string;
  largura?: LarguraCommons;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--raio)] bg-near-black ${className}`}>
      {foto && <FotoRota foto={foto} tamanhos={tamanhos} largura={largura} />}
    </div>
  );
}
