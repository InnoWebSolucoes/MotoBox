"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { comBase } from "@/lib/base";

/* ============================================================
   MOTOBOX — Fundo em vídeo
   Fica por trás de todas as páginas públicas. Na entrada vê-se
   nítido, sob um véu escuro; no painel e nas páginas interiores
   desfoca-se e escurece, para os painéis se lerem por cima.

   Vídeo de demonstração (Mixkit, licença livre). Trocar por
   imagens da MotoBox em public/videos/fundo.mp4 e fundo.jpg.
   ============================================================ */

export function Fundo() {
  const caminho = usePathname();
  const nitido = caminho === "/";
  const video = useRef<HTMLVideoElement>(null);

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
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -left-12 -top-12 -z-10 h-[calc(100lvh+6rem)] w-[calc(100vw+6rem)] bg-near-black"
    >
      <video
        ref={video}
        className={`h-full w-full object-cover transition-[filter,transform] duration-700 ease-[var(--ease-in-circ)] ${
          nitido ? "scale-100" : "scale-105 blur-[18px]"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={comBase("/videos/fundo.jpg")}
      >
        <source src={comBase("/videos/fundo.mp4")} type="video/mp4" />
      </video>
      <div
        className={`absolute inset-0 transition-colors duration-700 ${nitido ? "bg-black/50" : "bg-black/60"}`}
      />
    </div>
  );
}
