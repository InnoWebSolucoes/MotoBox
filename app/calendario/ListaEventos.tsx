/* Peças da lista de eventos, partilhadas pelo calendário de provas e pelas
   páginas de Desporto (Campeonato e modalidades). Sem hooks nem
   "use client": servem tanto a componentes de servidor como de cliente.
   Quem as usa passa `bilheteiraAberta` (Definições): o que se diz sobre
   bilhetes sai sempre de `vendaBilhetes`, nunca só do estado do evento.

   `LinhaEvento` devolve um <li>: quem a usa põe as linhas dentro de um
   <ol> ou <ul>. O intervalo de 5px entre linhas vem da própria linha.

   Os textos ("Desde", "Bilhetes", os estados…) editam-se no painel
   (Provas › Páginas do campeonato › Calendário); quem não os passa
   fica com os de partida. */

import Link from "next/link";
import { Foto, Seta } from "@/components/painel/kit";
import { formatKz } from "@/lib/data";
import { eComunidade, entradaDoEvento, hrefEvento, vendaBilhetes, type VendaBilhetes } from "@/lib/desporto";
import { diaMes } from "@/lib/motobox";
import type { Evento } from "@/lib/types";
import { LINHA_EVENTO_PADRAO, preencher, type EstadosEvento, type TextosLinhaEvento } from "@/lib/conteudo/grupos/geral";
import { Etiqueta } from "./pecas";
import { fotoDe } from "@/app/eventos/foto";

/**
 * Estado público do evento. "Bilhetes à venda" só quando a MotoBox vende
 * mesmo; um evento marcado "bilhetes abertos" sem venda conta como agendado.
 */
export function EstadoEvento({
  e, venda, vidro = false, textos = LINHA_EVENTO_PADRAO.estados,
}: { e: Evento; venda: VendaBilhetes | null; vidro?: boolean; textos?: EstadosEvento }) {
  const neutro = vidro ? "vidro" : "neutro";
  if (e.estado === "a-decorrer") return <Etiqueta tom="directo">{textos.aDecorrer}</Etiqueta>;
  if (e.estado === "concluido") return <Etiqueta tom={vidro ? "vidro" : "contorno"}>{textos.concluido}</Etiqueta>;
  if (venda === "a-venda") return <Etiqueta tom="vermelho">{textos.aVenda}</Etiqueta>;
  if (venda === "esgotado" || e.estado === "esgotado") return <Etiqueta tom={neutro}>{textos.esgotado}</Etiqueta>;
  return <Etiqueta tom={vidro ? "vidro" : "contorno"}>{textos.agendado}</Etiqueta>;
}

/** "14 Mar a 15 Mar", ou só "18 Out" num evento de um dia. */
function datasCurtas(e: Evento, ate: string) {
  const i = diaMes(e.dataInicio);
  const f = diaMes(e.dataFim || e.dataInicio);
  const mesmoDia = (e.dataFim || e.dataInicio).slice(0, 10) === e.dataInicio.slice(0, 10);
  return mesmoDia ? `${i.dia} ${i.mes}` : `${i.dia} ${i.mes} ${ate} ${f.dia} ${f.mes}`;
}

const precoMinimo = (e: Evento) => Math.min(...(e.bilhetes ?? []).map((b) => b.preco));

/** Linha da lista: data num quadrado, informação ao centro, acção à direita. */
export function LinhaEvento({
  e,
  agora,
  bilheteiraAberta,
  ate,
  textos = LINHA_EVENTO_PADRAO,
}: {
  e: Evento;
  agora: number;
  bilheteiraAberta: boolean;
  /** "a" entre as duas datas (por omissão, o dos textos). */
  ate?: string;
  textos?: TextosLinhaEvento;
}) {
  const passado = new Date(e.dataFim).getTime() < agora;
  const comunidade = eComunidade(e.disciplina);
  const venda = vendaBilhetes(e, bilheteiraAberta, agora);
  const entrada = entradaDoEvento(e);
  const { dia, mes } = diaMes(e.dataInicio);
  const local = [e.circuito, e.provincia].filter(Boolean).join(", ");

  return (
    <li className="list-none [&+li]:mt-[var(--intervalo)]">
      <Link
        href={hrefEvento(e)}
        className={`painel painel-escuro group grid grid-cols-[4.5rem_minmax(0,1fr)] gap-[var(--intervalo)] p-[var(--intervalo)] transition-opacity sm:grid-cols-[5.5rem_minmax(0,1fr)_11rem] ${
          passado ? "opacity-70 hover:opacity-100" : ""
        }`}
      >
        {/* Data: quadrado vermelho; cinzento quando já passou */}
        <div
          className={`row-span-2 flex flex-col items-center justify-center rounded-[var(--raio)] py-4 text-white sm:row-span-1 ${
            passado ? "bg-white/8" : "bg-mb-red"
          }`}
        >
          <span className="text-3xl font-semibold leading-none tabular-nums">{dia}</span>
          <span className="mt-1 text-sm uppercase tracking-[0.15em]">{mes}</span>
          <span className="mt-1 text-[11px] tabular-nums text-white/70">{e.dataInicio.slice(0, 4)}</span>
        </div>

        {/* Informação */}
        <div className="flex min-w-0 flex-col justify-center px-2 pt-2 sm:px-4 sm:py-3">
          <p className="text-[0.8125rem] text-white/60">
            {e.ronda && !comunidade ? <span className="text-mb-red-light">{preencher(textos.ronda, { ronda: e.ronda })} · </span> : null}
            {e.disciplina}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-snug text-balance md:text-xl">{e.titulo}</h3>
          <p className="mt-1 text-sm text-white/60">
            <span className="tabular-nums">{datasCurtas(e, ate ?? textos.ate)}</span>
            {local && <> · {local}</>}
          </p>
          {e.organizador && <p className="mt-0.5 truncate text-xs text-white/45">{e.organizador}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <EstadoEvento e={e} venda={venda} textos={textos.estados} />
            {entrada && !passado && <Etiqueta>{entrada}</Etiqueta>}
          </div>
          {e.resumo && <p className="mt-3 hidden max-w-2xl text-sm leading-relaxed text-white/60 line-clamp-2 md:block">{e.resumo}</p>}
        </div>

        {/* Acção: preço e bilhetes só com venda aberta; esgotado fica na etiqueta */}
        <div className="flex items-center justify-between gap-3 px-2 pb-2 sm:flex-col sm:items-end sm:justify-center sm:p-4 sm:text-right">
          {venda === "a-venda" ? (
            <>
              <span>
                <span className="block text-xs text-white/50">{textos.desde}</span>
                <span className="block text-lg font-semibold tabular-nums">{formatKz(precoMinimo(e))}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-white sm:mt-2">
                <span className="sublinhado">{textos.bilhetes}</span>
                <Seta className="size-3" />
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm text-white/80 sm:ml-auto">
              <span className="sublinhado">{passado ? (comunidade ? textos.verEvento : textos.resultados) : textos.detalhes}</span>
              <Seta className="size-3" />
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

/** Cartão da vista em grelha: fotografia com os cantos do painel e texto por baixo. */
export function CartaoEvento({
  e, agora, bilheteiraAberta, textos = LINHA_EVENTO_PADRAO,
}: { e: Evento; agora: number; bilheteiraAberta: boolean; textos?: TextosLinhaEvento }) {
  const passado = new Date(e.dataFim).getTime() < agora;
  const comunidade = eComunidade(e.disciplina);
  const venda = vendaBilhetes(e, bilheteiraAberta, agora);
  const entrada = entradaDoEvento(e);
  const { dia, mes } = diaMes(e.dataInicio);
  return (
    <Link
      href={hrefEvento(e)}
      className={`painel painel-escuro group flex flex-col p-[var(--intervalo)] transition-opacity ${
        passado ? "opacity-70 hover:opacity-100" : ""
      }`}
    >
      <div className="relative">
        <Foto nome={fotoDe(e.slug, e.imagem)} className="aspect-[16/10]" largura={800} tamanhos="(max-width: 768px) 100vw, 33vw" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <EstadoEvento e={e} venda={venda} vidro textos={textos.estados} />
        </div>
        <div
          className={`absolute bottom-3 left-3 flex flex-col items-center rounded-[4px] px-3 py-2 text-white ${
            passado ? "bg-black/65" : "bg-mb-red"
          }`}
        >
          <span className="text-2xl font-semibold leading-none tabular-nums">{dia}</span>
          <span className="mt-1 text-xs uppercase tracking-[0.15em]">{mes}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 pt-5 md:p-5">
        <p className="text-[0.8125rem] text-white/60">
          {e.ronda && !comunidade ? <span className="text-mb-red-light">{preencher(textos.ronda, { ronda: e.ronda })} · </span> : null}
          {e.disciplina}
        </p>
        <h3 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-balance line-clamp-2">{e.titulo}</h3>
        <p className="mt-2 text-sm text-white/60">
          {e.circuito ? `${e.circuito}, ` : ""}
          {e.provincia}
        </p>
        {entrada && !passado && (
          <div className="mt-3">
            <Etiqueta>{entrada}</Etiqueta>
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-6 text-sm">
          {venda === "a-venda" ? (
            <span>
              <span className="block text-xs text-white/50">{textos.desde}</span>
              <span className="font-semibold tabular-nums">{formatKz(precoMinimo(e))}</span>
            </span>
          ) : (
            <span className="text-white/55">{passado ? (comunidade ? textos.verEvento : textos.resultados) : textos.detalhes}</span>
          )}
          <Seta className="mb-1 size-3.5" />
        </div>
      </div>
    </Link>
  );
}

/** Linha compacta (páginas das modalidades): dia, título e local. */
export function LinhaEventoCompacta({
  e, bilheteiraAberta, textos = LINHA_EVENTO_PADRAO,
}: { e: Evento; bilheteiraAberta: boolean; textos?: TextosLinhaEvento }) {
  const venda = vendaBilhetes(e, bilheteiraAberta);
  const entrada = entradaDoEvento(e);
  const { dia, mes } = diaMes(e.dataInicio);
  return (
    <li className="list-none [&+li]:mt-[var(--intervalo)]">
      <Link href={hrefEvento(e)} className="painel painel-escuro group flex items-center gap-4 p-[var(--intervalo)] pr-4">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-[4px] bg-mb-red py-2.5 text-white">
          <span className="text-2xl font-semibold leading-none tabular-nums">{dia}</span>
          <span className="mt-1 text-xs uppercase tracking-[0.15em]">{mes}</span>
        </div>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Etiqueta tom="contorno">{e.disciplina}</Etiqueta>
            {venda === "a-venda" ? (
              <Etiqueta tom="vermelho">{textos.bilhetes}</Etiqueta>
            ) : venda === "esgotado" ? (
              <Etiqueta>{textos.estados.esgotado}</Etiqueta>
            ) : entrada ? (
              <Etiqueta>{entrada}</Etiqueta>
            ) : null}
          </div>
          <h3 className="mt-2 font-semibold leading-snug line-clamp-2">{e.titulo}</h3>
          <p className="mt-0.5 text-xs text-white/55">
            {e.localidade ? `${e.localidade}, ` : ""}
            {e.provincia}
          </p>
        </div>
        <Seta className="size-3.5 shrink-0" />
      </Link>
    </li>
  );
}
