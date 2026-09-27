"use client";

/* ============================================================
   MOTOBOX — Recortar o logótipo ou a fotografia da conta
   Palco quadrado com um círculo: o que fica dentro dele é o que
   se guarda. A imagem arrasta-se (rato, toque) e aproxima-se com
   a barra, a roda do rato, dois dedos ou o teclado, e nunca deixa
   espaço vazio dentro do círculo. Ao aplicar, o quadrado do
   círculo é desenhado a 512×512 e sai como WebP (JPEG ou PNG no
   Safari, que não escreve WebP).
   ============================================================ */

import {
  useEffect, useId, useMemo, useRef, useState,
  type CSSProperties, type KeyboardEvent as EventoTecla, type PointerEvent as EventoPonteiro,
} from "react";
import { Button } from "@/components/ui";
import { useIdioma } from "@/lib/i18n/contexto";
import type { Idioma } from "@/lib/i18n/idiomas";

/** Lado da imagem enviada. Aparece no máximo a 96 px; 512 chega para ecrãs densos. */
const LADO_SAIDA = 512;
const ZOOM_MAX = 4;
/** Folga entre o círculo e a borda do palco, em fracção do lado: deixa ver o que fica de fora. */
const FOLGA = 0.07;

/**
 * Enquadramento, independente do tamanho do palco: centro do círculo em
 * píxeis da imagem original e aproximação (1 = a imagem cobre o círculo à justa).
 */
export interface EstadoRecorte { zoom: number; cx: number; cy: number }

/** Tamanho natural da imagem e diâmetro do círculo no ecrã. */
interface Geometria { w: number; h: number; diametro: number }

/* Texto próprio do recorte, nas duas línguas: inclui rótulos para leitores de ecrã,
   que a tradução automática das páginas (só nós de texto) não alcança. */
const TEXTOS: Record<Idioma, Record<
  "titulo" | "ajustar" | "instrucoes" | "teclado" | "area" | "papel" | "aproximacao" | "aproximar"
  | "afastar" | "repor" | "cancelar" | "aplicar" | "aAplicar" | "aAbrir" | "erroAbrir" | "erroPreparar",
  string
>> = {
  pt: {
    titulo: "Ajustar imagem",
    ajustar: "Ajustar",
    instrucoes: "Arraste para escolher o que fica dentro do círculo. Aproxime com a barra, a roda do rato ou dois dedos.",
    teclado: "Com o teclado: as setas movem a imagem (com Shift, mais depressa), + e - aproximam e afastam, 0 repõe.",
    area: "Imagem a recortar",
    papel: "área de recorte",
    aproximacao: "Aproximação",
    aproximar: "Aproximar",
    afastar: "Afastar",
    repor: "Repor",
    cancelar: "Cancelar",
    aplicar: "Aplicar",
    aAplicar: "A preparar…",
    aAbrir: "A abrir a imagem…",
    erroAbrir: "Não foi possível abrir esta imagem. Experimente outra.",
    erroPreparar: "Não foi possível preparar a imagem. Experimente outra.",
  },
  en: {
    titulo: "Adjust image",
    ajustar: "Adjust",
    instrucoes: "Drag to choose what stays inside the circle. Zoom with the slider, the mouse wheel or two fingers.",
    teclado: "With the keyboard: arrow keys move the image (hold Shift to go faster), + and - zoom in and out, 0 resets.",
    area: "Image to crop",
    papel: "crop area",
    aproximacao: "Zoom",
    aproximar: "Zoom in",
    afastar: "Zoom out",
    repor: "Reset",
    cancelar: "Cancel",
    aplicar: "Apply",
    aAplicar: "Preparing…",
    aAbrir: "Opening the image…",
    erroAbrir: "Couldn't open this image. Try another one.",
    erroPreparar: "Couldn't prepare the image. Try another one.",
  },
};

export function useTextosRecorte() {
  return TEXTOS[useIdioma().idioma] ?? TEXTOS.pt;
}

/* ---------- Geometria ---------- */

/** Píxeis de ecrã por píxel da imagem. */
const escala = (e: EstadoRecorte, g: Geometria) => (e.zoom * g.diametro) / Math.min(g.w, g.h);

/** Mantém a aproximação no intervalo e o círculo sempre coberto pela imagem. */
function limitar(e: EstadoRecorte, g: Pick<Geometria, "w" | "h">): EstadoRecorte {
  const zoom = Math.min(ZOOM_MAX, Math.max(1, e.zoom));
  // Meio lado do quadrado do círculo, em píxeis da imagem. Cobrir o círculo é
  // o mesmo que cobrir este quadrado: os quatro pontos extremos do círculo tocam-lhe.
  const meio = Math.min(g.w, g.h) / 2 / zoom;
  return {
    zoom,
    cx: Math.min(g.w - meio, Math.max(meio, e.cx)),
    cy: Math.min(g.h - meio, Math.max(meio, e.cy)),
  };
}

/** Arrastar (dx, dy) píxeis de ecrã: a imagem acompanha o dedo. */
function mover(e: EstadoRecorte, g: Geometria, dx: number, dy: number): EstadoRecorte {
  const k = escala(e, g);
  return limitar({ ...e, cx: e.cx - dx / k, cy: e.cy - dy / k }, g);
}

/** Aproxima mantendo parado o ponto (ux, uy), medido do centro do palco. */
function aproximar(e: EstadoRecorte, g: Geometria, zoom: number, ux = 0, uy = 0): EstadoRecorte {
  const z = Math.min(ZOOM_MAX, Math.max(1, zoom));
  const k = escala(e, g);
  const k2 = escala({ ...e, zoom: z }, g);
  return limitar({ zoom: z, cx: e.cx + ux / k - ux / k2, cy: e.cy + uy / k - uy / k2 }, g);
}

const inicio = (g: Pick<Geometria, "w" | "h">): EstadoRecorte => ({ zoom: 1, cx: g.w / 2, cy: g.h / 2 });

/* ---------- Saída ---------- */

function tela(lado: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = lado;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

const paraBlob = (c: HTMLCanvasElement, tipo: string, qualidade?: number) =>
  new Promise<Blob | null>((ok) => c.toBlob(ok, tipo, qualidade));

/** Desenha o quadrado do círculo a 512×512 e devolve-o comprimido. */
async function recortar(img: HTMLImageElement, e: EstadoRecorte, g: Pick<Geometria, "w" | "h">): Promise<Blob | null> {
  let lado = Math.min(g.w, g.h) / e.zoom;
  let sx = Math.min(Math.max(0, e.cx - lado / 2), g.w - lado);
  let sy = Math.min(Math.max(0, e.cy - lado / 2), g.h - lado);
  let fonte: CanvasImageSource = img;
  // Uma redução grande de uma só vez serrilha (sobretudo no Firefox): desce em metades.
  while (lado > LADO_SAIDA * 2) {
    const passo = Math.ceil(lado / 2);
    const meia = tela(passo);
    if (!meia) return null;
    meia.ctx.drawImage(fonte, sx, sy, lado, lado, 0, 0, passo, passo);
    fonte = meia.canvas;
    sx = 0; sy = 0; lado = passo;
  }
  const final = tela(LADO_SAIDA);
  if (!final) return null;
  final.ctx.drawImage(fonte, sx, sy, lado, lado, 0, 0, LADO_SAIDA, LADO_SAIDA);

  // O WebP guarda a transparência de um logótipo PNG e fica leve.
  const webp = await paraBlob(final.canvas, "image/webp", 0.9);
  if (webp?.type === "image/webp") return webp;
  // O Safari não escreve WebP: PNG se houver transparência, JPEG no resto.
  const px = final.ctx.getImageData(0, 0, LADO_SAIDA, LADO_SAIDA).data;
  let transparente = false;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 255) { transparente = true; break; }
  return transparente ? paraBlob(final.canvas, "image/png") : paraBlob(final.canvas, "image/jpeg", 0.9);
}

/* ---------- Componente ---------- */

interface Carregada { url: string; img: HTMLImageElement; w: number; h: number }

const distancia = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/* Barra de aproximação redonda, ao estilo das pílulas do site: pista fina, botão branco. */
const barra =
  "h-9 min-w-0 flex-1 cursor-pointer appearance-none bg-transparent " +
  "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:[background:var(--pista)] " +
  "[&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:size-4.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md " +
  "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:[background:var(--pista)] " +
  "[&::-moz-range-thumb]:size-4.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white";

export function RecortarAvatar({ fonte, inicial, cor, aoAplicar, aoCancelar }: {
  /** Ficheiro escolhido (já validado em tipo e tamanho). */
  fonte: Blob;
  /** Enquadramento anterior, ao voltar a ajustar a mesma imagem. */
  inicial?: EstadoRecorte;
  /** Cor da conta: aparece por trás das partes transparentes, como no círculo final. */
  cor: string;
  aoAplicar: (imagem: Blob, estado: EstadoRecorte) => void;
  aoCancelar: () => void;
}) {
  const tx = useTextosRecorte();
  const idInstrucoes = useId();
  const idTeclado = useId();
  const palco = useRef<HTMLDivElement>(null);
  const ponteiros = useRef(new Map<number, { x: number; y: number }>());

  const [carregada, setCarregada] = useState<Carregada | null>(null);
  const [estado, setEstado] = useState<EstadoRecorte | null>(null);
  const [lado, setLado] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [aArrastar, setAArrastar] = useState(false);
  const [aAplicar, setAAplicar] = useState(false);
  const [anuncio, setAnuncio] = useState("");

  // Abre a imagem; o endereço temporário morre com o componente.
  useEffect(() => {
    let vivo = true;
    const url = URL.createObjectURL(fonte);
    const img = new Image();
    img.onload = () => {
      if (!vivo) return;
      const d = { w: img.naturalWidth, h: img.naturalHeight };
      if (!d.w || !d.h) { setErro(tx.erroAbrir); return; }
      setCarregada({ url, img, ...d });
      setEstado(limitar(inicial ?? inicio(d), d));
    };
    img.onerror = () => { if (vivo) setErro(tx.erroAbrir); };
    img.src = url;
    return () => { vivo = false; URL.revokeObjectURL(url); };
    // `inicial` e o texto só contam na abertura: mudar de imagem é que reabre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fonte]);

  // Tamanho do palco no ecrã (muda ao rodar o telemóvel).
  useEffect(() => {
    const el = palco.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setLado(e.contentRect.width));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Foco no palco ao abrir: as setas e o +/- funcionam logo.
  useEffect(() => { palco.current?.focus({ preventScroll: true }); }, []);

  const geo = useMemo<Geometria | null>(
    () => (carregada && lado ? { w: carregada.w, h: carregada.h, diametro: lado * (1 - 2 * FOLGA) } : null),
    [carregada, lado],
  );

  // Roda do rato: tem de ser um ouvinte nativo não passivo, senão a janela desliza em vez de aproximar.
  useEffect(() => {
    const el = palco.current;
    if (!el || !geo) return;
    const roda = (ev: WheelEvent) => {
      ev.preventDefault();
      const r = el.getBoundingClientRect();
      const delta = ev.deltaY * (ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? r.height : 1);
      const ux = ev.clientX - r.left - r.width / 2;
      const uy = ev.clientY - r.top - r.height / 2;
      setEstado((e) => e && aproximar(e, geo, e.zoom * Math.exp(-delta * 0.0012), ux, uy));
    };
    el.addEventListener("wheel", roda, { passive: false });
    return () => el.removeEventListener("wheel", roda);
  }, [geo]);

  /* ----- Ponteiros: um arrasta, dois aproximam (e arrastam pelo meio) ----- */
  const premir = (ev: EventoPonteiro<HTMLDivElement>) => {
    if (!geo || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    ponteiros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    setAArrastar(true);
  };

  const arrastar = (ev: EventoPonteiro<HTMLDivElement>) => {
    const mapa = ponteiros.current;
    const antes = mapa.get(ev.pointerId);
    if (!antes || !geo) return;
    const agora = { x: ev.clientX, y: ev.clientY };
    const outro = [...mapa].find(([id]) => id !== ev.pointerId)?.[1];
    mapa.set(ev.pointerId, agora);
    if (!outro) {
      setEstado((e) => e && mover(e, geo, agora.x - antes.x, agora.y - antes.y));
      return;
    }
    const d0 = distancia(antes, outro);
    if (d0 < 1) return;
    const fator = distancia(agora, outro) / d0;
    const r = ev.currentTarget.getBoundingClientRect();
    const m0 = { x: (antes.x + outro.x) / 2, y: (antes.y + outro.y) / 2 };
    const m1 = { x: (agora.x + outro.x) / 2, y: (agora.y + outro.y) / 2 };
    const ux = m0.x - r.left - r.width / 2;
    const uy = m0.y - r.top - r.height / 2;
    setEstado((e) => e && mover(aproximar(e, geo, e.zoom * fator, ux, uy), geo, m1.x - m0.x, m1.y - m0.y));
  };

  const largar = (ev: EventoPonteiro<HTMLDivElement>) => {
    ponteiros.current.delete(ev.pointerId);
    if (ponteiros.current.size === 0) setAArrastar(false);
  };

  /* ----- Teclado ----- */
  const anunciarZoom = (e: EstadoRecorte) => setAnuncio(`${tx.aproximacao} ${Math.round(e.zoom * 100)}%`);

  const teclar = (ev: EventoTecla<HTMLDivElement>) => {
    if (!geo || !estado || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const passo = ev.shiftKey ? 40 : 10;
    const accoes: Record<string, () => EstadoRecorte> = {
      ArrowLeft: () => mover(estado, geo, -passo, 0),
      ArrowRight: () => mover(estado, geo, passo, 0),
      ArrowUp: () => mover(estado, geo, 0, -passo),
      ArrowDown: () => mover(estado, geo, 0, passo),
      "+": () => aproximar(estado, geo, estado.zoom * 1.1),
      "=": () => aproximar(estado, geo, estado.zoom * 1.1),
      "-": () => aproximar(estado, geo, estado.zoom / 1.1),
      "_": () => aproximar(estado, geo, estado.zoom / 1.1),
      "0": () => inicio(geo),
    };
    const accao = accoes[ev.key];
    if (!accao) return;
    ev.preventDefault();
    const novo = accao();
    setEstado(novo);
    if (novo.zoom !== estado.zoom) anunciarZoom(novo);
  };

  const zoomPara = (z: number) => setEstado((e) => (e && geo ? aproximar(e, geo, z) : e));

  const repor = () => {
    if (!geo) return;
    setEstado(inicio(geo));
    anunciarZoom(inicio(geo));
  };

  const aplicar = async () => {
    if (!carregada || !estado) return;
    setAAplicar(true);
    setErro(null);
    const blob = await recortar(carregada.img, estado, carregada).catch(() => null);
    setAAplicar(false);
    if (!blob) { setErro(tx.erroPreparar); return; }
    aoAplicar(blob, estado);
  };

  // Posição da imagem no palco: o centro do círculo coincide com o centro do palco.
  const k = geo && estado ? escala(estado, geo) : 0;
  const pronto = !!(carregada && estado && geo);
  const percentagem = estado ? ((estado.zoom - 1) / (ZOOM_MAX - 1)) * 100 : 0;

  return (
    <div>
      <p id={idInstrucoes} className="text-sm leading-relaxed text-ink-400">{tx.instrucoes}</p>
      <p id={idTeclado} className="sr-only">{tx.teclado}</p>

      <div
        ref={palco}
        tabIndex={0}
        role="application"
        aria-roledescription={tx.papel}
        aria-label={tx.area}
        aria-describedby={`${idInstrucoes} ${idTeclado}`}
        onPointerDown={premir}
        onPointerMove={arrastar}
        onPointerUp={largar}
        onPointerCancel={largar}
        onKeyDown={teclar}
        className={`relative mx-auto mt-4 aspect-square w-full max-w-[24rem] touch-none select-none overflow-hidden rounded-card bg-ink-950 ${
          pronto ? (aArrastar ? "cursor-grabbing" : "cursor-grab") : ""
        }`}
      >
        {pronto && carregada && estado && (
          <>
            {/* A cor da conta por trás, como no círculo final (vê-se nas partes transparentes). */}
            <div aria-hidden className="absolute rounded-full" style={{ inset: `${FOLGA * 100}%`, backgroundColor: cor }} />
            {/* Imagem local (blob:) posicionada ao píxel: o next/image não serve aqui. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={carregada.url}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
              style={{
                width: carregada.w * k,
                height: carregada.h * k,
                transform: `translate(${lado / 2 - estado.cx * k}px, ${lado / 2 - estado.cy * k}px)`,
              }}
            />
          </>
        )}
        {/* Máscara: escurece o que fica de fora e contorna o círculo. */}
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            inset: `${FOLGA * 100}%`,
            boxShadow: "0 0 0 1.5px rgba(255,255,255,0.85), 0 0 0 100vmax rgba(10,10,12,0.66)",
          }}
        />
        {!pronto && !erro && (
          <p className="absolute inset-0 grid place-items-center text-sm text-ink-400">
            <span className="animate-pulse">{tx.aAbrir}</span>
          </p>
        )}
      </div>

      {/* Aproximação */}
      <div className="mx-auto mt-4 flex max-w-[24rem] items-center gap-2">
        <button type="button" onClick={() => estado && zoomPara(estado.zoom / 1.2)} disabled={!pronto || !estado || estado.zoom <= 1}
          aria-label={tx.afastar} title={tx.afastar}
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-300 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-40">
          <IconeZoom mais={false} />
        </button>
        <input
          type="range" min={1} max={ZOOM_MAX} step={0.02}
          value={estado?.zoom ?? 1}
          onChange={(e) => zoomPara(Number(e.target.value))}
          disabled={!pronto}
          aria-label={tx.aproximacao}
          aria-valuetext={`${Math.round((estado?.zoom ?? 1) * 100)}%`}
          className={barra}
          style={{
            "--pista": `linear-gradient(to right, var(--color-mb-red) ${percentagem}%, var(--color-ink-700) ${percentagem}%)`,
          } as CSSProperties}
        />
        <button type="button" onClick={() => estado && zoomPara(estado.zoom * 1.2)} disabled={!pronto || !estado || estado.zoom >= ZOOM_MAX}
          aria-label={tx.aproximar} title={tx.aproximar}
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-300 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-40">
          <IconeZoom mais />
        </button>
      </div>
      <p role="status" className="sr-only">{anuncio}</p>

      {erro && <p role="alert" className="mt-3 text-center text-sm text-mb-red">{erro}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={repor} disabled={!pronto}>
          {tx.repor}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={aoCancelar}>{tx.cancelar}</Button>
          <Button type="button" onClick={aplicar} disabled={!pronto || aAplicar}>
            {aAplicar ? tx.aAplicar : tx.aplicar}
          </Button>
        </div>
      </div>
    </div>
  );
}

function IconeZoom({ mais }: { mais: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" aria-hidden="true">
      <path d={mais ? "M12 5v14M5 12h14" : "M5 12h14"} />
    </svg>
  );
}
