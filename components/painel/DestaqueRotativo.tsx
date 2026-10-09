"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Newspaper, Pause, Play } from "lucide-react";
import { Chip, FotoFundo, Seta } from "./kit";

/* ============================================================
   MOTOBOX — Artigos em destaque, no painel grande do Explorar
   Com vários artigos marcados como destaque, o painel passa de um
   para o outro sozinho (por omissão, a cada 7 segundos: Gestão ›
   Entrada e painel › Painel Explorar), esbatendo a fotografia e o
   texto. Uma barra no ponto activo mostra quanto falta; os pontos
   escolhem um artigo; o botão ao lado pára e retoma.

   Pára sozinho com o rato por cima ou com o foco do teclado lá
   dentro (para quem lê ou navega assim), e não roda com o movimento
   reduzido: fica o primeiro, e os pontos continuam a escolher.
   O servidor desenha já o primeiro artigo, inteiro.
   ============================================================ */

export interface ArtigoDestaque {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  foto: (string | undefined)[];
}

export interface ArtigoCurto {
  slug: string;
  titulo: string;
  categoria: string;
}

const consultaCalma = "(prefers-reduced-motion: reduce)";
const subscreverCalma = (aviso: () => void) => {
  const m = window.matchMedia(consultaCalma);
  m.addEventListener("change", aviso);
  return () => m.removeEventListener("change", aviso);
};

export function DestaqueRotativo({
  artigos, outros, textos, intervalo,
}: {
  /** Os artigos em destaque, pela ordem em que passam (pelo menos um). */
  artigos: ArtigoDestaque[];
  /** Para a caixa "Mais artigos": os três primeiros que não estão à vista. */
  outros: ArtigoCurto[];
  textos: { rotulo: string; maisArtigos: string; todosArtigos: string };
  /** Segundos de cada artigo; 0 desliga a passagem automática. */
  intervalo: number;
}) {
  const n = artigos.length;
  const [activo, setActivo] = useState(0);
  const [pausaManual, setPausaManual] = useState(false);
  const [sobre, setSobre] = useState(false);
  const [foco, setFoco] = useState(false);
  const calmo = useSyncExternalStore(subscreverCalma, () => window.matchMedia(consultaCalma).matches, () => false);
  const barra = useRef<HTMLSpanElement>(null);
  const animacao = useRef<Animation | null>(null);

  const roda = n > 1 && intervalo > 0 && !calmo;
  const parado = pausaManual || sobre || foco;
  const actual = artigos[Math.min(activo, n - 1)];

  // A barra do ponto activo enche durante o intervalo; quando acaba, passa ao seguinte.
  useEffect(() => {
    const el = barra.current;
    if (!roda || !el || typeof el.animate !== "function") return;
    const a = el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      duration: intervalo * 1000, easing: "linear", fill: "forwards",
    });
    a.onfinish = () => setActivo((i) => (i + 1) % n);
    animacao.current = a;
    return () => { a.onfinish = null; a.cancel(); animacao.current = null; };
  }, [activo, roda, intervalo, n]);

  useEffect(() => {
    const a = animacao.current;
    if (!a) return;
    if (parado) a.pause();
    else if (a.playState === "paused") a.play();
  }, [parado, activo, roda]);

  const escolher = useCallback((i: number) => setActivo(i), []);
  const mais = outros.filter((a) => a.slug !== actual.slug).slice(0, 3);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      // Só o foco do teclado pára a passagem: um clique num ponto escolhe e deixa continuar.
      onFocus={(e) => { if (e.target.matches(":focus-visible")) setFoco(true); }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFoco(false); }}
    >
      {/* Fotografias, umas por cima das outras: só a activa se vê. */}
      {artigos.map((a, i) => (
        <div
          key={a.slug}
          aria-hidden
          className="absolute inset-0 -z-10 transition-opacity duration-[1200ms] ease-in-out motion-reduce:transition-none"
          style={{ opacity: i === activo ? 1 : 0 }}
        >
          <FotoFundo nome={a.foto} veu="esquerda" prioridade={i === 0} tamanhos="(max-width: 1024px) 100vw, 70vw" />
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden />

      <Link
        href={`/artigos/${actual.slug}`}
        aria-label={`Ler o artigo: ${actual.titulo}`}
        className="absolute inset-0 z-10"
      />
      <span className="absolute right-4 top-4 z-20 md:right-5 md:top-5">
        <Chip><Newspaper /></Chip>
      </span>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-6 md:p-8 xl:pr-[21rem] baixo:p-6 baixo:xl:pr-[19rem]">
        {/* Os textos ocupam a mesma célula: a altura é a do maior e a troca não salta. */}
        <div className="grid items-end">
          {artigos.map((a, i) => (
            <div
              key={a.slug}
              aria-hidden={i !== activo}
              className="[grid-area:1/1] transition-opacity duration-700 ease-in-out motion-reduce:transition-none"
              style={{ opacity: i === activo ? 1 : 0 }}
            >
              <p className="text-sm text-white/85">{textos.rotulo} · {a.categoria}</p>
              <h2 className="titulo-3 mt-3 line-clamp-3 max-w-[20ch] text-balance baixo:mt-2 baixo:line-clamp-2 baixo:text-[1.75rem]">{a.titulo}</h2>
              <p className="mt-3 line-clamp-3 max-w-[50ch] text-sm leading-relaxed text-white/90 md:text-[15px] baixo:line-clamp-2 mbaixo:hidden">
                {a.resumo}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-5 baixo:mt-3">
          <Seta className="size-5" />
          {n > 1 && (
            <div className="pointer-events-auto flex items-center gap-1" role="group" aria-label="Artigos em destaque">
              {artigos.map((a, i) => (
                <button
                  key={a.slug}
                  type="button"
                  onClick={() => escolher(i)}
                  aria-label={`Artigo ${i + 1} de ${n}: ${a.titulo}`}
                  aria-current={i === activo ? "true" : undefined}
                  className="group/ponto flex h-6 min-w-6 items-center justify-center rounded-full"
                >
                  <span
                    className={`relative block h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
                      i === activo ? "w-8 bg-white/35" : "w-2 bg-white/60 group-hover/ponto:bg-white"
                    }`}
                  >
                    {i === activo && (
                      <span
                        ref={barra}
                        className="absolute inset-0 origin-left bg-white"
                        // Sem passagem automática, a barra fica cheia.
                        style={roda ? { transform: "scaleX(0)" } : undefined}
                      />
                    )}
                  </span>
                </button>
              ))}
              {roda && (
                <button
                  type="button"
                  onClick={() => setPausaManual((p) => !p)}
                  aria-label={pausaManual ? "Retomar a passagem dos destaques" : "Parar a passagem dos destaques"}
                  className="ml-1 grid size-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                >
                  {pausaManual ? <Play className="size-3.5" fill="currentColor" aria-hidden /> : <Pause className="size-3.5" fill="currentColor" aria-hidden />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mais artigos, por cima da fotografia */}
      <aside className="absolute bottom-0 right-0 z-20 hidden w-[20rem] p-5 xl:block baixo:w-[18rem] baixo:p-4">
        <div className="rounded-[var(--raio)] bg-black/60 p-4 backdrop-blur-md baixo:p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/75">{textos.maisArtigos}</p>
          <ul className="mt-3 divide-y divide-white/10">
            {mais.map((a, i) => (
              // Num ecrã baixo ficam dois artigos; num muito baixo, um.
              <li key={a.slug} className={i === 2 ? "baixo:hidden" : i === 1 ? "mbaixo:hidden" : ""}>
                <Link href={`/artigos/${a.slug}`} className="group/item block py-2.5 baixo:py-2">
                  <span className="block text-xs text-mb-red-light">{a.categoria}</span>
                  <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-white/90 transition-colors group-hover/item:text-white">
                    {a.titulo}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/artigos" className="mt-2 inline-flex items-center gap-2 text-sm text-white">
            <span className="sublinhado">{textos.todosArtigos}</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
