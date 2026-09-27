import Link from "next/link";
import Image from "next/image";
import { Placeholder } from "@/components/Brand";
import { Icon } from "@/components/ui";
import { otimizavel, src as fotoSrc } from "@/lib/imagens";
import type { Clube } from "@/lib/types";
import { iniciaisClube, localClube, nomeTipo, redesDoClube } from "./comum";

/* ============================================================
   MOTOBOX — Peças das páginas de clubes
   Capa, logótipo, cartão e ligações às redes. Sem fotografia
   própria, a capa é desenhada com a cor do clube: não se usam
   fotografias de outras pessoas como se fossem do clube.
   ============================================================ */

/** Logótipo redondo; sem imagem, as iniciais sobre a cor do clube. */
export function LogoClube({ clube, className = "size-14 text-lg" }: { clube: Clube; className?: string }) {
  const url = clube.logo ? fotoSrc(clube.logo, { w: 240 }) : null;
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full font-display text-white ring-2 ring-white/70 ${className}`}
      style={{ background: clube.cor }}
    >
      {url ? (
        <Image src={url} alt="" fill sizes="96px" unoptimized={!otimizavel(url)} className="object-cover" />
      ) : (
        iniciaisClube(clube.nome)
      )}
    </span>
  );
}

/**
 * Capa do clube. Com fotografia (campo `imagem`), a fotografia; sem ela,
 * a cor do clube em diagonal, riscas e o monograma em grande.
 */
export function CapaClube({
  clube,
  className = "",
  tamanhos = "(max-width: 768px) 100vw, 33vw",
  monograma = true,
}: {
  clube: Clube;
  className?: string;
  tamanhos?: string;
  monograma?: boolean;
}) {
  if (clube.imagem && fotoSrc(clube.imagem)) {
    return <Placeholder nome={clube.imagem} className={className} tamanhos={tamanhos} />;
  }
  return (
    <div
      className={`@container overflow-hidden ${/(^|\s)(absolute|relative)(\s|$)/.test(className) ? "" : "relative "}${className}`}
      style={{
        background: `linear-gradient(135deg, ${clube.cor} 0%, color-mix(in srgb, ${clube.cor} 45%, #0a0a0c) 55%, #0a0a0c 100%)`,
      }}
      aria-hidden
    >
      <div className="stripes absolute inset-0 opacity-70" />
      {monograma && (
        // Tamanho relativo à largura da capa: serve o cartão grande e a miniatura do telemóvel.
        <span
          className="absolute -bottom-[0.18em] -right-[0.04em] select-none font-display leading-none text-white/12"
          style={{ fontSize: "48cqw" }}
        >
          {iniciaisClube(clube.nome)}
        </span>
      )}
      <Icon name="bike" className="absolute left-5 top-5 size-7 text-white/35 @max-[12rem]:hidden" />
    </div>
  );
}

/** Ícones redondos das redes do clube; abrem numa janela nova. */
export function RedesClube({ clube, tamanho = "md" }: { clube: Clube; tamanho?: "sm" | "md" }) {
  const redes = redesDoClube(clube);
  if (redes.length === 0) return null;
  const dim = tamanho === "sm" ? "size-8" : "size-10";
  return (
    <div className="flex flex-wrap gap-2">
      {redes.map((r) => (
        <a
          key={r.chave}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${r.nome} de ${clube.nome} (abre numa nova janela)`}
          title={r.nome}
          className={`grid ${dim} place-items-center rounded-full bg-ink-800 text-ink-300 transition-colors hover:bg-mb-red hover:text-white`}
        >
          <Icon name={r.icone} className={tamanho === "sm" ? "size-3.5" : "size-4.5"} />
        </a>
      ))}
    </div>
  );
}

/**
 * Cartão de clube: capa arredondada, sem moldura, com o texto por baixo.
 * As redes ficam fora da ligação principal (não se aninham ligações).
 */
export function CartaoClube({ clube, grande = false }: { clube: Clube; grande?: boolean }) {
  // No telemóvel, os cartões pequenos ficam em linha (miniatura à esquerda) para a lista não ser interminável.
  const linha = !grande;
  return (
    <article className={`group ${linha ? "grid grid-cols-[88px_1fr] items-start gap-4 sm:block" : ""}`}>
      <Link href={`/clubes/${clube.slug}`} className="block" aria-label={clube.nome}>
        <div
          className={`relative isolate overflow-hidden rounded-card ${
            grande ? "aspect-[4/3] sm:aspect-[16/10]" : "aspect-square sm:aspect-[16/10]"
          }`}
        >
          <CapaClube
            clube={clube}
            className="absolute inset-0 -z-10 transition-transform duration-700 group-hover:scale-105"
            tamanhos={grande ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 640px) 88px, (max-width: 1024px) 50vw, 33vw"}
          />
          <div className={`absolute inset-x-0 bottom-0 items-end gap-3 p-4 sm:p-5 ${linha ? "hidden sm:flex" : "flex"}`}>
            <LogoClube clube={clube} className={grande ? "size-14 text-lg" : "size-11 text-sm"} />
          </div>
        </div>
      </Link>

      <div className="min-w-0">
        <p className={`eyebrow text-mb-red ${linha ? "sm:mt-4" : "mt-4"}`}>{nomeTipo(clube.tipo)}</p>
        <h3 className={`mt-1.5 font-display uppercase leading-tight text-white ${grande ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>
          <Link href={`/clubes/${clube.slug}`} className="transition-colors group-hover:text-mb-red">
            {clube.nome}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
          <Icon name="pin" className="size-3.5 shrink-0" />
          {localClube(clube)}
          {clube.fundacao ? <span className="text-ink-600">· desde {clube.fundacao}</span> : null}
        </p>

        {grande && <p className="mt-3 text-sm leading-relaxed text-ink-400 line-clamp-3">{clube.descricao}</p>}

        {clube.actividades.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Actividades">
            {clube.actividades.slice(0, grande ? 4 : 3).map((a) => (
              <li key={a} className="rounded-full bg-ink-800 px-2.5 py-1 text-[11px] leading-none text-ink-300">
                {a}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <RedesClube clube={clube} tamanho="sm" />
        </div>
      </div>
    </article>
  );
}
