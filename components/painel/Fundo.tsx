"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { caminhoDaPagina, comBase } from "@/lib/base";

/* ============================================================
   MOTOBOX — Fundo em vídeo
   Fica por trás de todas as páginas públicas. Na entrada vê-se
   nítido, sob um véu escuro (para o texto branco se ler); no
   painel e nas páginas interiores desfoca-se, para os painéis se
   lerem por cima.

   O vídeo, a imagem de espera, a velocidade e o quanto se
   escurece escolhem-se em Gestão › Entrada e painel (conteúdo
   "site.entrada"): o layout lê-os e passa o vídeo e a imagem ao
   Cenário, já como endereços prontos a usar, e a velocidade e o
   véu por <AjustesFundo>. Sem nada, o vídeo de demonstração
   (Mixkit, licença livre) em public/videos/fundo.mp4 e fundo.jpg.
   ============================================================ */

/** Endereços finais do vídeo e da imagem de espera. */
export interface FundoVideo {
  video: string;
  poster: string;
}

/** Velocidade do vídeo (1 = a do ficheiro) e véu da entrada, em % de preto. */
export interface AjustesVideo {
  velocidade: number;
  escurecer: number;
}

const AJUSTES_PADRAO: AjustesVideo = { velocidade: 1, escurecer: 45 };
const Ajustes = createContext<AjustesVideo>(AJUSTES_PADRAO);

/** Passa a velocidade e o véu ao fundo (o layout envolve o Cenário com isto). */
export function AjustesFundo({ velocidade, escurecer, children }: AjustesVideo & { children: ReactNode }) {
  return <Ajustes.Provider value={{ velocidade, escurecer }}>{children}</Ajustes.Provider>;
}

const entre = (v: number, min: number, max: number, padrao: number) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : padrao;

export function Fundo({ video: videoUrl, poster }: Partial<FundoVideo> = {}) {
  const caminho = caminhoDaPagina(usePathname());
  const nitido = caminho === "/";
  const video = useRef<HTMLVideoElement>(null);
  const ajustes = useContext(Ajustes);
  const fonte = videoUrl || comBase("/videos/fundo.mp4");
  const imagem = poster || comBase("/videos/fundo.jpg");
  const taxa = entre(ajustes.velocidade, 0.25, 2, 1);
  // Na entrada, o véu que se escolheu; nas outras páginas o vídeo já vai desfocado.
  const veu = nitido ? entre(ajustes.escurecer, 0, 80, 45) / 100 : 0.25;

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

  // A velocidade: alguns navegadores repõem-na ao carregar o vídeo, por isso volta a aplicar-se.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const aplicar = () => {
      v.defaultPlaybackRate = taxa;
      if (v.playbackRate !== taxa) v.playbackRate = taxa;
    };
    aplicar();
    v.addEventListener("loadedmetadata", aplicar);
    v.addEventListener("play", aplicar);
    return () => {
      v.removeEventListener("loadedmetadata", aplicar);
      v.removeEventListener("play", aplicar);
    };
  }, [fonte, taxa]);

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
      <div className="absolute inset-0 transition-colors duration-700" style={{ backgroundColor: `rgb(0 0 0 / ${veu})` }} />
      {/* Na entrada, um pouco mais escuro no meio, onde está o texto. */}
      <div
        className={`absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,rgb(0_0_0/0.28),transparent_75%)] transition-opacity duration-700 ${
          nitido ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
