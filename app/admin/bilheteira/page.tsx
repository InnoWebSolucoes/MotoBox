"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin/store";
import { formatKz, formatDataCurta } from "@/lib/data";
import {
  CabecalhoPagina, Painel, Estatistica, Estado, Campo, Input, useAviso, Interruptor,
} from "@/components/admin/kit";
import type { Evento, TipoBilhete } from "@/lib/types";

export default function AdminBilheteira() {
  const { estado, atualizar, guardarDefinicoes } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const [activo, setActivo] = useState<string>("");

  const comBilhetes = useMemo(
    () => estado.eventos.filter((e) => (e.bilhetes?.length ?? 0) > 0),
    [estado.eventos],
  );

  const evento = comBilhetes.find((e) => e.slug === activo) ?? comBilhetes[0];

  // Vendas por tipo de bilhete, a partir das encomendas confirmadas
  const vendas = useMemo(() => {
    const m = new Map<string, { qtd: number; receita: number }>();
    for (const e of estado.encomendas) {
      if (e.estado !== "pago" && e.estado !== "usado") continue;
      if (evento && e.eventoSlug !== evento.slug) continue;
      const a = m.get(e.tipoBilheteId) ?? { qtd: 0, receita: 0 };
      a.qtd += e.quantidade;
      a.receita += e.total;
      m.set(e.tipoBilheteId, a);
    }
    return m;
  }, [estado.encomendas, evento]);

  const totais = useMemo(() => {
    const pagas = estado.encomendas.filter((e) => e.estado === "pago" || e.estado === "usado");
    return {
      receita: pagas.reduce((s, e) => s + e.total, 0),
      vendidos: pagas.reduce((s, e) => s + e.quantidade, 0),
      eventos: comBilhetes.length,
      capacidade: comBilhetes.reduce(
        (s, e) => s + (e.bilhetes ?? []).reduce((t, b) => t + b.disponiveis, 0), 0),
    };
  }, [estado.encomendas, comBilhetes]);

  const alterarBilhete = (ev: Evento, i: number, campos: Partial<TipoBilhete>) => {
    const lista = (ev.bilhetes ?? []).map((b, j) => (j === i ? { ...b, ...campos } : b));
    atualizar("eventos", ev.slug, { bilhetes: lista });
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Bilheteira"
        descricao="Preços, lotação e vendas por tipo de bilhete."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Estatistica rotulo="Receita total" valor={formatKz(totais.receita)} tom="ok" />
        <Estatistica rotulo="Bilhetes vendidos" valor={totais.vendidos} />
        <Estatistica rotulo="Provas com bilheteira" valor={totais.eventos} />
        <Estatistica rotulo="Lotação total" valor={totais.capacidade.toLocaleString("pt-PT")} />
      </div>

      <Painel titulo="Estado da bilheteira" className="mb-4">
        <Interruptor
          activo={estado.definicoes.bilheteiraAberta}
          etiqueta="Venda de bilhetes online"
          descricao="Quando desligada, o checkout deixa de aceitar novas compras."
          onChange={(v) => {
            guardarDefinicoes({ bilheteiraAberta: v });
            mostrar(v ? "Bilheteira aberta." : "Bilheteira fechada.");
          }}
        />
      </Painel>

      {comBilhetes.length === 0 ? (
        <Painel><p className="py-10 text-center text-sm text-ink-500">
          Nenhuma prova tem tipos de bilhete definidos. Crie-os na página de Eventos.
        </p></Painel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <nav className="border border-ink-700/60 bg-ink-900">
            <ul>
              {comBilhetes.map((e) => (
                <li key={e.slug}>
                  <button type="button" onClick={() => setActivo(e.slug)}
                    className={`w-full border-l-2 px-3 py-2.5 text-left text-sm transition-colors ${
                      e.slug === evento?.slug
                        ? "border-mb-red bg-mb-red/10 text-white"
                        : "border-transparent text-ink-300 hover:bg-ink-850 hover:text-white"
                    }`}>
                    <span className="block truncate">{e.titulo}</span>
                    <span className="block truncate text-xs text-ink-500">{formatDataCurta(e.dataInicio)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {evento && (
            <Painel
              titulo={evento.titulo}
              descricao={`${evento.circuito}, ${evento.provincia}`}
              accoes={<Estado valor={evento.estado} />}
            >
              <div className="space-y-4">
                {(evento.bilhetes ?? []).map((b, i) => {
                  const v = vendas.get(b.id) ?? { qtd: 0, receita: 0 };
                  const pct = b.disponiveis > 0 ? Math.min(100, (v.qtd / b.disponiveis) * 100) : 0;
                  return (
                    <div key={b.id} className="border border-ink-700 bg-ink-950 p-4">
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="font-display text-sm uppercase tracking-wider text-white">
                            {b.nome}
                            {b.destaque && <span className="ml-2 text-mb-red">★</span>}
                          </p>
                          <p className="text-xs text-ink-500">{b.descricao}</p>
                        </div>
                        <p className="font-display text-lg text-white">{formatKz(b.preco)}</p>
                      </div>

                      <div className="mb-3">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-ink-400">{v.qtd} de {b.disponiveis} vendidos</span>
                          <span className="text-ok">{formatKz(v.receita)}</span>
                        </div>
                        <div className="h-2 bg-ink-800">
                          <div className="h-full bg-mb-red" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Campo etiqueta="Preço (Kz)">
                          <Input type="number" value={b.preco}
                            onChange={(e) => alterarBilhete(evento, i, { preco: Number(e.target.value) })} />
                        </Campo>
                        <Campo etiqueta="Lotação">
                          <Input type="number" value={b.disponiveis}
                            onChange={(e) => alterarBilhete(evento, i, { disponiveis: Number(e.target.value) })} />
                        </Campo>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 text-sm text-ink-300">
                            <input type="checkbox" checked={!!b.destaque}
                              onChange={(e) => alterarBilhete(evento, i, { destaque: e.target.checked })} />
                            Destacar
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Painel>
          )}
        </div>
      )}

      {elemento}
    </>
  );
}
