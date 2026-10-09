"use client";

/* ============================================================
   MOTOBOX — Área de membro: clubes, marcas e notificações
   As preferências guardam-se sozinhas a cada clique (o
   contentor espera meio segundo e grava em /api/conta). O clube
   a que a pessoa pertence grava-se à parte, no mesmo sítio.
   ============================================================ */

import type { ReactNode } from "react";
import { Icon } from "@/components/ui";
import { Monograma } from "@/components/painel/kit";
import {
  CANAIS_ACTIVOS, MARCAS, type Canal, type Preferencias, type TipoNotificacao,
} from "@/lib/conta/preferencias";
import type { ClubeResumo } from "./dados";
import { EstadoGuardar, TituloBloco, campo, f, useTextosConta, type EstadoGravacao } from "./partes";

function Escolha({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`flex items-center gap-3 rounded-[var(--raio)] p-1.5 pr-3.5 text-left transition-colors ${
        on ? "bg-mb-red/20 ring-1 ring-inset ring-mb-red" : "bg-white/6 hover:bg-white/12"
      }`}>
      {children}
      <span className={`grid size-5 shrink-0 place-items-center rounded-full ${on ? "bg-mb-red text-white" : "border border-white/40"}`}>
        {on && <Icon name="check" className="size-3" />}
      </span>
    </button>
  );
}

export function SeparadorPreferencias({ prefs, clubes, clube, gravacao, gravacaoClube, aoMudar, aoMudarClube }: {
  prefs: Preferencias; clubes: ClubeResumo[]; clube: string | null;
  gravacao: EstadoGravacao; gravacaoClube: EstadoGravacao;
  aoMudar: (p: Preferencias) => void; aoMudarClube: (slug: string) => void;
}) {
  const t = useTextosConta();
  const tp = t.preferencias;
  const alternar = (chave: "clubes" | "marcas", valor: string) => {
    const lista = prefs[chave];
    aoMudar({ ...prefs, [chave]: lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor] });
  };

  return (
    <div className="space-y-[var(--intervalo)]">
      <div className="painel painel-escuro flex flex-wrap items-center justify-between gap-3 p-5 md:p-6">
        <p className="max-w-[70ch] text-[15px] leading-relaxed text-white/85">{tp.texto}</p>
        <EstadoGuardar estado={gravacao === "parado" ? gravacaoClube : gravacao} parado={t.notificacoes.automatico} />
      </div>

      <section className="painel painel-escuro p-5 md:p-6">
        <TituloBloco titulo={tp.meuClube} texto={tp.meuClubeTexto} className="mb-4" />
        <label className="block max-w-md">
          <span className="sr-only">{tp.meuClube}</span>
          <select className={campo} value={clube ?? ""} onChange={(e) => aoMudarClube(e.target.value)}>
            <option value="">{t.paraSi.semClubeOpcao}</option>
            {clubes.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
          </select>
        </label>
      </section>

      <section className="painel painel-escuro p-5 md:p-6">
        <TituloBloco titulo={tp.clubes} texto={tp.clubesTexto} className="mb-5" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {clubes.map((c) => (
            <Escolha key={c.slug} on={prefs.clubes.includes(c.slug)} onClick={() => alternar("clubes", c.slug)}>
              <Monograma nome={c.nome} cor={c.cor} className="size-10 text-xs" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-white">{c.nome}</span>
                <span className="block truncate text-sm text-white/70">{c.tipo}</span>
              </span>
            </Escolha>
          ))}
        </div>
      </section>

      <section className="painel painel-escuro p-5 md:p-6">
        <TituloBloco titulo={tp.marcas} texto={tp.marcasTexto} className="mb-5" />
        <div className="flex flex-wrap gap-2">
          {MARCAS.map((m) => (
            <button key={m} type="button" onClick={() => alternar("marcas", m)} aria-pressed={prefs.marcas.includes(m)} className="pilula">
              {prefs.marcas.includes(m) && <Icon name="check" className="size-3.5" />}
              {m}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SeparadorNotificacoes({ prefs, email, gravacao, aoMudar }: {
  prefs: Preferencias; email: string; gravacao: EstadoGravacao; aoMudar: (p: Preferencias) => void;
}) {
  const t = useTextosConta().notificacoes;
  const tipos: [TipoNotificacao, string, string][] = [
    ["calendario", t.calendario, t.calendarioTexto],
    ["bilhetes", t.bilhetes, t.bilhetesTexto],
    ["marketplace", t.marketplace, t.marketplaceTexto],
    ["forum", t.forum, t.forumTexto],
    ["newsletter", t.newsletter, t.newsletterTexto],
  ];
  const canais: [Canal, string, string][] = [
    ["email", t.email, "mail"],
    ["push", t.push, "bell"],
    ["whatsapp", t.whatsapp, "whatsapp"],
  ];

  return (
    <div className="grid gap-[var(--intervalo)] lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <section className="painel painel-escuro p-5 md:p-6">
        <TituloBloco titulo={t.titulo} texto={t.texto} accao={<EstadoGuardar estado={gravacao} parado={t.automatico} />} />
        <div className="mt-4 divide-y divide-white/10">
          {tipos.map(([k, titulo, desc]) => (
            <label key={k} className="flex cursor-pointer items-center gap-4 py-4">
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-white">{titulo}</span>
                <span className="mt-0.5 block text-sm text-white/75">{desc}</span>
              </span>
              {/* Interruptor: a caixa verdadeira fica por baixo, para o teclado e os leitores de ecrã. */}
              <span className="relative inline-flex shrink-0">
                <input type="checkbox" checked={prefs.notificacoes[k]}
                  onChange={(e) => aoMudar({ ...prefs, notificacoes: { ...prefs.notificacoes, [k]: e.target.checked } })}
                  className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0" />
                <span aria-hidden className="h-7 w-12 rounded-full bg-white/20 transition-colors peer-checked:bg-mb-red peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-mb-red-light" />
                <span aria-hidden className="absolute left-1 top-1 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 motion-reduce:transition-none" />
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="painel painel-escuro p-5 md:p-6">
        <TituloBloco titulo={t.canais} />
        <div className="mt-5 grid grid-cols-3 gap-[var(--intervalo)]">
          {canais.map(([k, label, icone]) => {
            const activo = CANAIS_ACTIVOS.includes(k);
            const on = activo && prefs.canais[k];
            return (
              <button key={k} type="button" disabled={!activo}
                onClick={() => aoMudar({ ...prefs, canais: { ...prefs.canais, [k]: !prefs.canais[k] } })}
                aria-pressed={on}
                className={`flex flex-col items-center gap-2.5 rounded-[var(--raio)] p-4 transition-colors disabled:cursor-not-allowed ${
                  on ? "bg-mb-red/20 ring-2 ring-inset ring-mb-red" : "bg-white/6 hover:bg-white/12"
                }`}>
                <span className={`grid size-11 place-items-center rounded-full ${on ? "bg-mb-red text-white" : "bg-white/10 text-white/80"}`}>
                  <Icon name={icone} className="size-5" />
                </span>
                <span className="text-center text-sm leading-tight text-white">{label}</span>
                {!activo && <span className="text-xs text-white/70">{t.brevemente}</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-white/75 break-words">{f(t.enviadasPara, { email })}</p>
      </section>
    </div>
  );
}
