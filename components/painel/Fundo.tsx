"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { caminhoDaPagina, comBase } from "@/lib/base";

/* ============================================================
   MOTOBOX — Fundo em vídeo
   Fica por trás de todas as páginas públicas. Na entrada vê-se
   nítido, sob um véu leve; no painel e nas páginas interiores
   desfoca-se, para os painéis se lerem por cima.

   O vídeo e a imagem de espera escolhem-se em Gestão › Entrada e
   painel (conteúdo "site.entrada"): o layout lê-os e passa-os
   já como endereços prontos a usar. Por omissão, o vídeo de
   demonstração (Mixkit, licença livre) em public/videos/fundo.mp4
   e fundo.jpg.
   ============================================================ */

/** Endereços finais do vídeo e da imagem de espera. */
export interface FundoVideo {
  video: string;
  poster: string;
}

export function Fundo({ video: videoUrl, poster }: Partial<FundoVideo> = {}) {
  const caminho = caminhoDaPagina(usePathname());
  const nitido = caminho === "/";
  const video = useRef<HTMLVideoElement>(null);
  const fonte = videoUrl || comBase("/videos/fundo.mp4");
  const imagem = poster || comBase("/videos/fundo.jpg");

  // Com movimento reduzido fica a primeira imagem, parada.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplicar = () => {
      if (consulta.matches) v.pause();
      else v.play().catch(() => { /* o navegador decide; fica a imagem */ });
    };
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, [fonte]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -left-12 -top-12 -z-10 h-[calc(100lvh+6rem)] w-[calc(100vw+6rem)] bg-near-black"
    >
      <video
        key={fonte}
        ref={video}
        className={`h-full w-full object-cover transition-[filter,transform] duration-700 ease-[var(--ease-in-circ)] ${
          nitido ? "scale-100" : "scale-105 blur-[18px]"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={imagem}
      >
        <source src={fonte} type={/\.webm(\?|$)/i.test(fonte) ? "video/webm" : "video/mp4"} />
      </video>
      <div
        className={`absolute inset-0 transition-colors duration-700 ${nitido ? "bg-black/30" : "bg-black/25"}`}
      />
    </div>
  );
}
