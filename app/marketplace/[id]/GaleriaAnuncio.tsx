"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Placeholder } from "@/components/Brand";
import { Icon } from "@/components/ui";

/**
 * Fotografias a mostrar. Com várias, são essas. Os anúncios de demonstração
 * têm uma só chave: "chave-1", "chave-2"… mantêm as quatro miniaturas e caem
 * na mesma fotografia enquanto não houver variantes (ver lib/imagens.ts).
 * Um endereço completo não tem variantes, e sem fotografia fica o gradiente.
 */
function fotografias(imagens: string[]): string[] {
  const lista = imagens.filter((i) => typeof i === "string" && i.trim() !== "");
  if (lista.length > 1) return lista.slice(0, 12);
  const [unica] = lista;
  if (unica && !/^https?:\/\//.test(unica)) return [unica, `${unica}-1`, `${unica}-2`, `${unica}-3`];
  return [unica ?? ""];
}

/**
 * Fotografia principal com miniaturas. Carregar numa miniatura troca a
 * fotografia; as setas (no ecrã ou no teclado) e o deslizar do dedo
 * passam à seguinte. `children` fica sobre a fotografia (etiquetas).
 */
export function GaleriaAnuncio({
  imagens,
  titulo,
  children,
}: {
  imagens: string[];
  titulo: string;
  children?: ReactNode;
}) {
  const fotos = fotografias(imagens);
  const total = fotos.length;
  const [activa, setActiva] = useState(0);
  // Só se montam as fotografias já vistas: as outras não gastam dados até serem pedidas.
  const [vistas, setVistas] = useState<number[]>([0]);
  const miniaturas = useRef<(HTMLButtonElement | null)[]>([]);
  const toque = useRef<{ x: number; y: number } | null>(null);

  function mostrar(indice: number, focar = false) {
    const i = (indice + total) % total;
    setActiva(i);
    setVistas((v) => (v.includes(i) ? v : [...v, i]));
    if (focar) miniaturas.current[i]?.focus();
  }

  function teclas(e: KeyboardEvent) {
    if (total < 2 || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
    e.preventDefault();
    // Com o foco numa miniatura, o foco acompanha a fotografia escolhida.
    const naMiniatura = miniaturas.current.some((b) => b === document.activeElement);
    mostrar(activa + (e.key === "ArrowRight" ? 1 : -1), naMiniatura);
  }

  return (
    <div onKeyDown={teclas}>
      <div
        className="media relative aspect-[4/3] select-none"
        onTouchStart={(e) => {
          toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          const inicio = toque.current;
          toque.current = null;
          if (!inicio || total < 2) return;
          const dx = e.changedTouches[0].clientX - inicio.x;
          const dy = e.changedTouches[0].clientY - inicio.y;
          // Só um gesto claramente horizontal: deslizar a página na vertical não troca a fotografia.
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) mostrar(activa + (dx < 0 ? 1 : -1));
        }}
      >
        {vistas.map((i) => (
          <Placeholder
            key={i}
            nome={fotos[i]}
            // A nova entra por cima, a esvanecer; a anterior só se esconde depois.
            className={`absolute inset-0 transition-opacity motion-reduce:transition-none ${
              i === activa
                ? `z-10 opacity-100 duration-300 ${i === 0 ? "" : "starting:opacity-0"}`
                : "opacity-0 duration-0 delay-300"
            }`}
            tamanhos="(max-width: 1024px) 100vw, 760px"
          />
        ))}

        {children && <div className="absolute left-4 top-4 z-20 flex gap-2">{children}</div>}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => mostrar(activa - 1)}
              aria-label="Fotografia anterior"
              className="absolute left-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-[var(--raio)] bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-ink-950/90"
            >
              <Icon name="arrow" className="size-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => mostrar(activa + 1)}
              aria-label="Fotografia seguinte"
              className="absolute right-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-[var(--raio)] bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-ink-950/90"
            >
              <Icon name="arrow" className="size-4" />
            </button>
            <span
              aria-hidden
              className="absolute bottom-3 right-3 z-20 rounded-[4px] bg-black/65 px-2.5 py-1 font-ui text-xs leading-none text-white tabular-nums backdrop-blur-sm"
            >
              {activa + 1} / {total}
            </span>
            <p className="sr-only" aria-live="polite">
              Fotografia {activa + 1} de {total}
            </p>
          </>
        )}
      </div>

      {total > 1 && (
        <div
          role="group"
          aria-label={`Fotografias de ${titulo}`}
          className={`mt-3 grid gap-2 sm:gap-3 ${total > 4 ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-4"}`}
        >
          {fotos.map((foto, i) => (
            <button
              key={i}
              type="button"
              ref={(el) => {
                miniaturas.current[i] = el;
              }}
              onClick={() => mostrar(i)}
              aria-pressed={i === activa}
              aria-label={`Ver fotografia ${i + 1} de ${total}`}
              className={`media relative aspect-[4/3] transition-opacity ${
                i === activa
                  ? "ring-2 ring-mb-red ring-offset-2 ring-offset-ink-950"
                  : "opacity-50 hover:opacity-100 focus-visible:opacity-100"
              }`}
            >
              <Placeholder nome={foto} className="absolute inset-0" tamanhos="200px" largura={480} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
