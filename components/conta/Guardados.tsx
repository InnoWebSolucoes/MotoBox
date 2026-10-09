"use client";

/* ============================================================
   MOTOBOX — Área de membro: guardados
   Os anúncios guardados no marketplace (user_metadata.favoritos)
   e os artigos guardados no resumo (user_metadata.artigos), mais
   o cartão de artigo com o botão de guardar.
   ============================================================ */

import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { SeloVerificado } from "@/components/SeloVerificado";
import { ButtonLink, Icon } from "@/components/ui";
import { Foto, Seta } from "@/components/painel/kit";
import { formatKz } from "@/lib/data";
import type { AnuncioGuardado } from "@/lib/conta/favoritos";
import type { ArtigoResumo } from "./dados";
import { TituloBloco, diaMesLongo, useTextosConta } from "./partes";

/* ---------------- Artigo ---------------- */

/** Botão de guardar um artigo (marcador). */
export function GuardarArtigo({ guardado, ocupado, aoMudar, titulo, className = "" }: {
  guardado: boolean; ocupado?: boolean; aoMudar: () => void; titulo: string; className?: string;
}) {
  const t = useTextosConta().paraSi;
  return (
    <button
      type="button"
      onClick={aoMudar}
      disabled={ocupado}
      aria-pressed={guardado}
      aria-label={`${guardado ? t.artigoGuardado : t.guardarArtigo}: ${titulo}`}
      title={guardado ? t.artigoGuardado : t.guardarArtigo}
      className={`grid size-10 shrink-0 place-items-center rounded-full backdrop-blur-md transition-colors disabled:opacity-60 ${
        guardado ? "bg-mb-red text-white hover:bg-mb-red-dark" : "bg-black/55 text-white hover:bg-black/75"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
        <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.5L5 21V4.5a1 1 0 0 1 1-1Z"
          fill={guardado ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Cartão de artigo do resumo e dos guardados, com o marcador por cima da fotografia. */
export function CartaoArtigoConta({ artigo, guardado, ocupado, aoGuardar, className = "" }: {
  artigo: ArtigoResumo; guardado: boolean; ocupado?: boolean; aoGuardar: () => void; className?: string;
}) {
  return (
    <article className={`painel painel-escuro group relative flex flex-col p-[var(--intervalo)] ${className}`}>
      <Foto nome={artigo.foto} className="aspect-[16/10]" largura={700} tamanhos="(max-width: 768px) 100vw, 25vw" />
      <div className="flex flex-1 flex-col p-4 pt-4">
        <p className="text-sm text-white/75">
          <span className="text-mb-red-light">{artigo.categoria}</span> · {diaMesLongo(artigo.data)}
        </p>
        <h3 className="mt-1.5 line-clamp-3 text-[17px] font-semibold leading-snug text-white">
          {/* A ligação cobre o cartão; o marcador fica por cima dela. */}
          <Link href={`/artigos/${artigo.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {artigo.titulo}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between pt-4 text-sm text-white/75">
          <span>{artigo.leitura} min de leitura</span>
          <Seta className="size-3.5 text-white" />
        </div>
      </div>
      <GuardarArtigo guardado={guardado} ocupado={ocupado} aoMudar={aoGuardar} titulo={artigo.titulo}
        className="absolute right-3 top-3 z-10" />
    </article>
  );
}

/* ---------------- Anúncios guardados ---------------- */

export function ListaAnunciosGuardados({ anuncios, erro, aRemover, aoRemover, aoTentar, limite }: {
  anuncios: AnuncioGuardado[] | null; erro: string | null; aRemover: string[];
  aoRemover: (a: AnuncioGuardado) => void; aoTentar: () => void; limite?: number;
}) {
  const t = useTextosConta().guardados;

  if (!anuncios && !erro) {
    return (
      <div aria-busy="true" aria-label="A carregar anúncios guardados" className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="aspect-[4/3] w-24 shrink-0 animate-pulse rounded-[var(--raio)] bg-white/10 motion-reduce:animate-none" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
              <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!anuncios) {
    return (
      <div>
        <p role="alert" className="text-sm text-mb-red-light">{erro}</p>
        <button type="button" onClick={aoTentar}
          className="mt-3 inline-flex h-9 items-center rounded-[var(--raio)] bg-white/10 px-4 text-sm text-white transition-colors hover:bg-white/20">
          Tentar de novo
        </button>
      </div>
    );
  }

  if (anuncios.length === 0) {
    return (
      <div>
        <p className="text-[15px] leading-relaxed text-white/85">{t.anunciosVazio}</p>
        <ButtonLink href="/marketplace" variant="dark" size="sm" className="mt-4">
          {t.anunciosBotao}
          <Icon name="arrow" className="size-4" />
        </ButtonLink>
      </div>
    );
  }

  const mostrados = limite ? anuncios.slice(0, limite) : anuncios;
  return (
    <>
      {erro && <p role="alert" className="mb-3 text-sm text-mb-red-light">{erro}</p>}
      <ul className="divide-y divide-white/10">
        {mostrados.map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <Link href={`/marketplace/${a.id}`} className="group flex min-w-0 flex-1 items-center gap-3.5">
              <span className="relative block aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-[var(--raio)] sm:w-24">
                <Placeholder nome={a.imagem || a.categoria} className="foto-painel absolute inset-0" tamanhos="96px" largura={300} />
              </span>
              <span className="min-w-0">
                <span className="flex items-start gap-1.5 text-[15px] font-medium leading-snug text-white transition-colors group-hover:text-mb-red-light">
                  <span className="line-clamp-2">{a.titulo}</span>
                  {a.verificado && <SeloVerificado tamanho={14} className="mt-0.5" />}
                </span>
                <span className="mt-1 block text-sm text-white/80">
                  <span className="tabular-nums text-white">{formatKz(a.preco)}</span>
                  {[a.provincia, a.estado].filter(Boolean).map((x) => ` · ${x}`).join("")}
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => aoRemover(a)}
              disabled={aRemover.includes(a.id)}
              aria-label={`${t.remover}: ${a.titulo}`}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--raio)] px-3 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <Icon name="close" className="size-3.5" />
              <span className="hidden sm:inline">{aRemover.includes(a.id) ? "A remover…" : t.remover}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------------- Separador ---------------- */

export function SeparadorGuardados({ anuncios, erroAnuncios, aRemover, aoRemoverAnuncio, aoTentar, artigos, artigosGuardados, aMudarArtigo, aoMudarArtigo }: {
  anuncios: AnuncioGuardado[] | null; erroAnuncios: string | null; aRemover: string[];
  aoRemoverAnuncio: (a: AnuncioGuardado) => void; aoTentar: () => void;
  artigos: ArtigoResumo[]; artigosGuardados: string[]; aMudarArtigo: string[]; aoMudarArtigo: (slug: string) => void;
}) {
  const t = useTextosConta().guardados;
  const porSlug = new Map(artigos.map((a) => [a.slug, a]));
  const guardados = artigosGuardados.map((s) => porSlug.get(s)).filter((a): a is ArtigoResumo => Boolean(a));

  return (
    <div className="space-y-[var(--intervalo)]">
      <div className="painel painel-escuro p-5 md:p-6">
        <h2 className="titulo-4 text-white">{t.titulo}</h2>
        <p className="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-white/80">{t.texto}</p>
      </div>
      <section className="painel painel-escuro p-5 md:p-6">
        <TituloBloco
          titulo={<>{t.anuncios}{anuncios && anuncios.length > 0 && <span className="ml-2 text-white/70">{anuncios.length}</span>}</>}
          className="mb-5"
        />
        <ListaAnunciosGuardados anuncios={anuncios} erro={erroAnuncios} aRemover={aRemover} aoRemover={aoRemoverAnuncio} aoTentar={aoTentar} />
      </section>

      <section>
        <div className="painel painel-escuro p-5 md:p-6">
          <TituloBloco titulo={<>{t.artigos}{guardados.length > 0 && <span className="ml-2 text-white/70">{guardados.length}</span>}</>} />
          {guardados.length === 0 && (
            <>
              <p className="mt-3 text-[15px] leading-relaxed text-white/85">{t.artigosVazio}</p>
              <ButtonLink href="/artigos" variant="dark" size="sm" className="mt-4">
                {t.artigosBotao}
                <Icon name="arrow" className="size-4" />
              </ButtonLink>
            </>
          )}
        </div>
        {guardados.length > 0 && (
          <div className="mt-[var(--intervalo)] grid gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-4">
            {guardados.map((a) => (
              <CartaoArtigoConta key={a.slug} artigo={a} guardado ocupado={aMudarArtigo.includes(a.slug)} aoGuardar={() => aoMudarArtigo(a.slug)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

