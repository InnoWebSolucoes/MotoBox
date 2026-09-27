/* Peças da lista de eventos, partilhadas pelo calendário de provas, pela
   secção Eventos e pelas páginas de cada modalidade. Sem hooks nem
   "use client": servem tanto a componentes de servidor como de cliente. */

import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { Icon, Tag } from "@/components/ui";
import { formatData } from "@/lib/data";
import { eComunidade, hrefEvento } from "@/lib/desporto";
import type { Evento } from "@/lib/types";

export function EstadoEvento({ e }: { e: Evento }) {
  switch (e.estado) {
    case "bilhetes-abertos":
      return <Tag tone="red">Bilhetes à venda</Tag>;
    case "esgotado":
      return <Tag tone="neutral">Esgotado</Tag>;
    case "a-decorrer":
      return (
        <Tag tone="live">
          <span className="live-dot size-1.5 rounded-full bg-white" />A decorrer
        </Tag>
      );
    case "concluido":
      return <Tag tone="outline">Concluído</Tag>;
    default:
      return <Tag tone="outline">Agendado</Tag>;
  }
}

const mesCurto = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-PT", { month: "short" }).replace(".", "");

/** Linha da lista: data em coluna tipográfica, informação ao centro, acção à direita. */
export function LinhaEvento({
  e,
  agora,
  ate = "a",
}: {
  e: Evento;
  agora: number;
  /** "a" entre as duas datas; o cliente passa a tradução. */
  ate?: string;
}) {
  const passado = new Date(e.dataFim).getTime() < agora;
  const comunidade = eComunidade(e.disciplina);
  return (
    <li className="border-b border-white/6 last:border-0">
      <Link
        href={hrefEvento(e)}
        className={`group grid grid-cols-[3.5rem_1fr] sm:grid-cols-[5rem_1fr_9rem] items-start sm:items-center gap-x-5 sm:gap-x-8 gap-y-3 py-6 transition-opacity ${
          passado ? "opacity-60 hover:opacity-100" : ""
        }`}
      >
        {/* Data: coluna tipográfica, sem caixa */}
        <div className="text-center">
          <span className="block font-display text-4xl sm:text-5xl leading-none text-white">
            {new Date(e.dataInicio).getDate()}
          </span>
          <span className="eyebrow mt-1.5 block text-mb-red">{mesCurto(e.dataInicio)}</span>
          <span className="eyebrow mt-0.5 block text-ink-600">{new Date(e.dataInicio).getFullYear()}</span>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {e.ronda && !comunidade ? <Tag tone="neutral">Ronda {e.ronda}</Tag> : null}
            <Tag tone="outline">{e.disciplina}</Tag>
            <EstadoEvento e={e} />
          </div>
          <h3 className="mt-2.5 font-display text-xl sm:text-2xl uppercase leading-tight text-white group-hover:text-mb-red transition-colors">
            {e.titulo}
          </h3>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="pin" className="size-3.5" />
              {e.circuito ? `${e.circuito}, ` : ""}{e.provincia}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" className="size-3.5" />
              {formatData(e.dataInicio, { day: "2-digit", month: "short" })} {ate}{" "}
              {formatData(e.dataFim, { day: "2-digit", month: "short" })}
            </span>
            {e.organizador && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="flag" className="size-3.5" />
                {e.organizador}
              </span>
            )}
          </p>
          {e.resumo && <p className="mt-3 text-sm text-ink-400 line-clamp-2 sm:max-w-2xl">{e.resumo}</p>}
        </div>

        {/* Acção */}
        <div className="col-start-2 sm:col-start-auto flex flex-wrap sm:flex-col items-center sm:items-end gap-x-3 gap-y-1 sm:text-right">
          {e.bilhetes && e.bilhetes.length > 0 && e.estado !== "concluido" && !passado ? (
            <>
              <span className="eyebrow text-ink-600">Desde</span>
              <span className="font-display text-lg text-white">
                {Math.min(...e.bilhetes.map((b) => b.preco)).toLocaleString("pt-PT")} Kz
              </span>
              <span className="sm:mt-1 inline-flex items-center gap-1.5 font-ui text-sm text-mb-red">
                Bilhetes
                <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </>
          ) : passado ? (
            <span className="inline-flex items-center gap-1.5 font-ui text-sm text-ink-500">
              {comunidade ? "Ver evento" : "Resultados"}
              <Icon name="arrow" className="size-3.5" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-ui text-sm text-ink-300 group-hover:text-white transition-colors">
              Detalhes
              <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

/** Cartão da vista em grelha: fotografia arredondada e texto por baixo. */
export function CartaoEvento({ e, agora }: { e: Evento; agora: number }) {
  const passado = new Date(e.dataFim).getTime() < agora;
  return (
    <Link
      href={hrefEvento(e)}
      className={`group block transition-opacity ${passado ? "opacity-60 hover:opacity-100" : ""}`}
    >
      <div className="media relative aspect-[16/10]">
        <Placeholder
          nome={[e.slug, e.imagem]}
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
          tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
        <div className="absolute left-3 top-3 flex gap-2"><EstadoEvento e={e} /></div>
        <div className="absolute bottom-3 left-3">
          <p className="font-display text-2xl text-white leading-none">
            {new Date(e.dataInicio).getDate()} {mesCurto(e.dataInicio).toUpperCase()}
          </p>
        </div>
      </div>
      <div className="pt-4">
        <Tag tone="outline">{e.disciplina}</Tag>
        <h3 className="mt-2.5 font-display text-lg uppercase leading-tight text-white line-clamp-2 group-hover:text-mb-red transition-colors">
          {e.titulo}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
          <Icon name="pin" className="size-3.5" />
          {e.circuito ? `${e.circuito}, ` : ""}{e.provincia}
        </p>
      </div>
    </Link>
  );
}

/** Linha compacta (início, páginas das modalidades): dia, título e local. */
export function LinhaEventoCompacta({ e }: { e: Evento }) {
  return (
    <li className="border-b border-white/6 last:border-0">
      <Link href={hrefEvento(e)} className="group flex items-center gap-5 py-4">
        <div className="w-14 shrink-0 text-center">
          <span className="block font-display text-3xl leading-none text-white">
            {new Date(e.dataInicio).getDate()}
          </span>
          <span className="eyebrow mt-1.5 block text-mb-red">{mesCurto(e.dataInicio)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Tag tone="outline" className="!text-[9px]">{e.disciplina}</Tag>
            {e.estado === "bilhetes-abertos" && <Tag tone="red" className="!text-[9px]">Bilhetes</Tag>}
          </div>
          <h3 className="mt-2 font-display text-lg uppercase leading-tight text-white line-clamp-2 transition-colors group-hover:text-mb-red">
            {e.titulo}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
            <Icon name="pin" className="size-3.5" />
            {e.localidade ? `${e.localidade}, ` : ""}{e.provincia}
          </p>
        </div>
        <Icon
          name="arrow"
          className="size-5 shrink-0 text-ink-600 transition-all group-hover:translate-x-1 group-hover:text-white"
        />
      </Link>
    </li>
  );
}
