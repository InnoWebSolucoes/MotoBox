"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { comBase } from "@/lib/base";
import { Icon } from "@/components/ui";
import type { Clube } from "@/lib/types";
import { CartaoClube } from "./Partes";
import { TIPOS_CLUBE, slugTexto, tipoPorSlug } from "./comum";

/* ============================================================
   Filtros e lista de clubes.
   O filtro vive no endereço (?tipo=lady-riders&provincia=luanda),
   para se poder partilhar e para o menu apontar directamente para
   as Lady Riders. A lista já vem toda do servidor; filtrar aqui
   mantém a página em cache.
   ============================================================ */

/** Lê o filtro do endereço. Separado da lista para servir de reserva no Suspense. */
export function ClubesFiltrados(props: { clubes: Clube[]; ladyRiders: ReactNode }) {
  const params = useSearchParams();
  return <ListaClubes {...props} tipo={params.get("tipo")} provincia={params.get("provincia")} />;
}

export function ListaClubes({
  clubes,
  tipo,
  provincia,
  ladyRiders,
}: {
  clubes: Clube[];
  tipo: string | null;
  provincia: string | null;
  ladyRiders: ReactNode;
}) {
  const caminho = usePathname();

  const tipoActivo = tipoPorSlug(tipo ?? undefined);
  // Só aparecem os tipos com clubes; Lady Riders fica sempre, porque o menu aponta para lá.
  const tipos = TIPOS_CLUBE.filter(
    (t) => t.tipo === "Lady Riders" || t.tipo === tipoActivo?.tipo || clubes.some((c) => c.tipo === t.tipo),
  );
  const provincias = useMemo(
    () => [...new Set(clubes.map((c) => c.provincia))].sort((a, b) => a.localeCompare(b)),
    [clubes],
  );
  const provinciaActiva = provincias.find((p) => slugTexto(p) === provincia) ?? null;

  const filtrados = clubes.filter(
    (c) => (!tipoActivo || c.tipo === tipoActivo.tipo) && (!provinciaActiva || c.provincia === provinciaActiva),
  );
  const semFiltro = !tipoActivo && !provinciaActiva;
  const destaques = semFiltro ? filtrados.filter((c) => c.destaque).slice(0, 3) : [];
  const restantes = semFiltro ? filtrados.filter((c) => !destaques.includes(c)) : filtrados;

  // history.replaceState integra-se no router do Next (useSearchParams acompanha) e não pede nada
  // ao servidor. Lê o endereço no momento do clique, para dois cliques seguidos não se atropelarem.
  function filtrar(chave: "tipo" | "provincia", valor: string | null) {
    const p = new URLSearchParams(window.location.search);
    if (valor) p.set(chave, valor);
    else p.delete(chave);
    const qs = p.toString();
    window.history.replaceState(null, "", comBase(qs ? `${caminho}?${qs}` : caminho));
  }

  return (
    <>
      {/* Filtros */}
      <div id="lista" className="scroll-mt-24 space-y-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar por tipo">
          <button type="button" className="chip shrink-0" aria-pressed={!tipoActivo} onClick={() => filtrar("tipo", null)}>
            Todos os clubes
          </button>
          {tipos.map((t) => (
            <button
              key={t.slug}
              type="button"
              className="chip shrink-0"
              aria-pressed={tipoActivo?.slug === t.slug}
              onClick={() => filtrar("tipo", t.slug)}
            >
              {t.nome}
            </button>
          ))}
        </div>
        {provincias.length > 1 && (
          <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar por província">
            <span className="eyebrow mr-1 shrink-0 text-ink-500">Província</span>
            <button type="button" className="chip h-8 shrink-0 px-3.5 text-sm" aria-pressed={!provinciaActiva} onClick={() => filtrar("provincia", null)}>
              Todas
            </button>
            {provincias.map((p) => (
              <button
                key={p}
                type="button"
                className="chip h-8 shrink-0 px-3.5 text-sm"
                aria-pressed={provinciaActiva === p}
                onClick={() => filtrar("provincia", slugTexto(p))}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cabeçalho do filtro activo */}
      {tipoActivo && (
        <div className="mt-10 max-w-2xl">
          <h2 className="title-xl text-3xl sm:text-4xl">{tipoActivo.nome}</h2>
          <p className="mt-2 text-sm text-ink-400">{tipoActivo.descricao}</p>
        </div>
      )}

      {/* Em destaque */}
      {destaques.length > 0 && (
        <section className="mt-12" aria-labelledby="destaque">
          <h2 id="destaque" className="eyebrow accent-bar text-white">Em destaque</h2>
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {destaques.map((c) => (
              <CartaoClube key={c.slug} clube={c} grande />
            ))}
          </div>
        </section>
      )}

      {/* Lady Riders: um apontamento, não uma secção inteira */}
      {semFiltro && ladyRiders}

      {/* Lista */}
      {restantes.length > 0 ? (
        <section className={semFiltro ? "mt-14" : "mt-10"} aria-label="Clubes">
          {semFiltro && <h2 className="eyebrow accent-bar text-white">Todos os clubes</h2>}
          <p className="sr-only" aria-live="polite">
            {filtrados.length} {filtrados.length === 1 ? "clube" : "clubes"}
          </p>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {restantes.map((c) => (
              <CartaoClube key={c.slug} clube={c} />
            ))}
          </div>
          {tipoActivo?.tipo === "Lady Riders" && (
            <p className="mt-12 border-t border-white/6 pt-6 text-sm text-ink-400">
              Faz parte de um grupo de mulheres motociclistas, ou conhece algum?{" "}
              <a href="#juntar" className="font-ui text-base text-white transition-colors hover:text-mb-red">
                Junte-o à Motobox →
              </a>
            </p>
          )}
        </section>
      ) : (
        filtrados.length === 0 && (
          <div className="mt-12 max-w-xl border-t border-white/6 pt-8">
            <p className="font-display text-xl uppercase text-white">Ainda não há clubes aqui</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">
              {tipoActivo?.tipo === "Lady Riders"
                ? "Estamos a juntar os grupos de mulheres motociclistas de Angola. Conhece algum, ou faz parte de um?"
                : "Não encontrámos clubes com este filtro. Conhece algum que devia estar na Motobox?"}
            </p>
            <a href="#juntar"
              className="mt-5 inline-flex items-center gap-2 font-ui text-base text-white transition-colors hover:text-mb-red"
            >
              Juntar um clube <Icon name="arrow" className="size-4" />
            </a>
          </div>
        )
      )}
    </>
  );
}
