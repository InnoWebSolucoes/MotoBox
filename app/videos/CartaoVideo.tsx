import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { Icon } from "@/components/ui";
import { formatData } from "@/lib/data";
import type { Video } from "@/lib/types";

/* ============================================================
   Cartão de vídeo, partilhado pela grelha de /videos e pela
   faixa de vídeos de /noticias.
   ============================================================ */

/**
 * "24 800 visualizações". Não mostra nada quando o número não foi indicado
 * no painel (fica a 0). `curto` abrevia os milhares ("24,8k"), para a lista
 * lateral do leitor. O número e a palavra ficam em nós de texto separados,
 * que é o que `TraduzirPagina` espera para trocar a palavra.
 */
export function Vistas({ n, curto = false }: { n: number; curto?: boolean }) {
  if (!(n > 0)) return null;
  const numero = curto && n >= 1000
    ? `${(n / 1000).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}k`
    : n.toLocaleString("pt-PT");
  return <>{numero} {n === 1 ? "visualização" : "visualizações"}</>;
}

/**
 * Miniatura com o botão de reprodução e a duração, categoria, título e data.
 * Com `href` é uma ligação (a faixa de /noticias leva a /videos#slug, que
 * abre o vídeo no leitor); sem ela é um botão e `aoEscolher` trata do clique.
 */
export function CartaoVideo({ v, tamanhos, href, aoEscolher, id }: {
  v: Video;
  /** `sizes` da miniatura, conforme a grelha onde o cartão está. */
  tamanhos: string;
  href?: string;
  aoEscolher?: () => void;
  /** Âncora do cartão na grelha de /videos. */
  id?: string;
}) {
  const conteudo = (
    <>
      <div className="media relative aspect-video">
        <Placeholder
          nome={[v.slug, v.thumbnail]}
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
          tamanhos={tamanhos}
        />
        <span className="absolute bottom-3 left-3 grid size-10 place-items-center rounded-full bg-white/15 text-white ring-2 ring-white/80 backdrop-blur-sm transition-colors group-hover:bg-mb-red group-hover:ring-mb-red">
          <Icon name="play" className="size-4 translate-x-px" />
        </span>
        {/* "0:00" é o valor de um vídeo novo antes de importar do YouTube. */}
        {v.duracao && v.duracao !== "0:00" && (
          <span className="absolute bottom-3.5 right-3 font-mono text-xs text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.8)]">
            {v.duracao}
          </span>
        )}
      </div>
      <p className="eyebrow mt-3 text-mb-red">{v.categoria}</p>
      <h3 className="mt-1.5 font-display text-lg uppercase leading-tight text-white line-clamp-2 group-hover:text-mb-red transition-colors">
        {v.titulo}
      </h3>
      <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-500">
        {v.visualizacoes > 0 && (
          <>
            <span><Vistas n={v.visualizacoes} /></span>
            <span className="size-1 rounded-full bg-ink-600" />
          </>
        )}
        <span>{formatData(v.data, { day: "2-digit", month: "short" })}</span>
      </p>
    </>
  );

  const classe = "group flex w-full flex-col self-start text-left";
  return href ? (
    <Link href={href} className={classe}>{conteudo}</Link>
  ) : (
    <button type="button" id={id} onClick={aoEscolher} className={classe}>{conteudo}</button>
  );
}
