"use client";

/* ============================================================
   MOTOBOX ADMIN — Bilheteira
   A venda de bilhetes online: abrir ou fechar a bilheteira e,
   em cada evento com bilhetes, os preços, a lotação e o bilhete
   em destaque, com as vendas de cada tipo. Os tipos de bilhete
   criam-se na ficha do evento (Eventos ou Provas).
   ============================================================ */

import { useMemo, useState } from "react";
import { Star, Ticket } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import { formatKz } from "@/lib/data";
import { eComunidade, hrefEvento } from "@/lib/desporto";
import {
  Aviso, Botao, BotaoLigacao, CabecalhoPagina, Campo, Estado, Estatistica, Etiqueta, Input, Interruptor,
  Painel, Vazio, useAviso,
} from "@/components/admin/kit";
import type { TipoBilhete } from "@/lib/types";
import { dataCurta } from "../moderacao/_comum/formato";

export default function AdminBilheteira() {
  const { estado, atualizar, guardarDefinicoes } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const [activo, setActivo] = useState<string>("");
  /** Preços e lotações em edição, por evento, até carregar em Guardar. */
  const [rascunhos, setRascunhos] = useState<Record<string, TipoBilhete[]>>({});
  const [aGuardar, setAGuardar] = useState(false);

  const comBilhetes = useMemo(
    () => estado.eventos
      .filter((e) => (e.bilhetes?.length ?? 0) > 0)
      .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)),
    [estado.eventos],
  );

  const evento = comBilhetes.find((e) => e.slug === activo) ?? comBilhetes[0];
  const bilhetes = evento ? rascunhos[evento.slug] ?? evento.bilhetes ?? [] : [];
  const sujo = evento ? JSON.stringify(bilhetes) !== JSON.stringify(evento.bilhetes ?? []) : false;

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

  const alterarBilhete = (i: number, campos: Partial<TipoBilhete>) => {
    if (!evento) return;
    setRascunhos((r) => ({
      ...r,
      [evento.slug]: bilhetes.map((b, j) => {
        if (j === i) return { ...b, ...campos };
        // Só um bilhete em destaque de cada vez.
        return campos.destaque ? { ...b, destaque: false } : b;
      }),
    }));
  };

  const guardar = async () => {
    if (!evento || !sujo) return;
    setAGuardar(true);
    const falha = await atualizar("eventos", evento.slug, { bilhetes });
    setAGuardar(false);
    if (falha) { mostrar(falha, "erro"); return; }
    setRascunhos((r) => { const n = { ...r }; delete n[evento.slug]; return n; });
    mostrar("Bilhetes guardados. O site já mostra os preços novos.");
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Bilheteira"
        sobretitulo="Venda de bilhetes"
        icone={<Ticket />}
        descricao="Os bilhetes à venda no site: preços, lotação e vendas de cada tipo. Os tipos de bilhete criam-se na ficha de cada evento ou prova."
      />

      <div className="mb-[var(--intervalo)] grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
        <Estatistica rotulo="Receita confirmada" valor={formatKz(totais.receita)} tom="ok" />
        <Estatistica rotulo="Bilhetes vendidos" valor={totais.vendidos} />
        <Estatistica rotulo="Eventos com bilheteira" valor={totais.eventos} />
        <Estatistica rotulo="Lugares postos à venda" valor={totais.capacidade.toLocaleString("pt-PT")} />
      </div>

      <div className="painel painel-escuro mb-[var(--intervalo)] p-4">
        <Interruptor
          activo={estado.definicoes.bilheteiraAberta}
          etiqueta="Venda de bilhetes no site"
          descricao="Desligada, o site deixa de aceitar compras novas. As encomendas já feitas continuam válidas."
          onChange={async (v) => {
            const falha = await guardarDefinicoes({ bilheteiraAberta: v });
            mostrar(falha ?? (v ? "Bilheteira aberta." : "Bilheteira fechada."), falha ? "erro" : "ok");
          }}
        />
      </div>

      {comBilhetes.length === 0 ? (
        <Painel>
          <Vazio titulo="Nenhum evento tem bilhetes à venda"
            accao={<div className="flex flex-wrap justify-center gap-2"><BotaoLigacao href="/admin/eventos">Eventos</BotaoLigacao><BotaoLigacao href="/admin/provas">Provas</BotaoLigacao></div>}>
            Junte tipos de bilhete na ficha de um evento ou de uma prova para começar a vender.
          </Vazio>
        </Painel>
      ) : (
        <div className="grid gap-[var(--intervalo)] lg:grid-cols-[17rem_minmax(0,1fr)]">
          <nav aria-label="Eventos com bilheteira" className="painel painel-escuro p-2 lg:self-start">
            <ul className="no-scrollbar flex gap-1 overflow-x-auto lg:block lg:space-y-0.5">
              {comBilhetes.map((e) => {
                const sel = e.slug === evento?.slug;
                return (
                  <li key={e.slug} className="shrink-0">
                    <button type="button" onClick={() => setActivo(e.slug)} aria-current={sel ? "true" : undefined}
                      className={`w-full rounded-[var(--raio)] px-3 py-2.5 text-left text-sm transition-colors ${
                        sel ? "bg-mb-red text-white" : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                      }`}>
                      <span className="block max-w-56 truncate">{e.titulo}</span>
                      <span className={`block text-xs ${sel ? "text-white/80" : "text-white/45"}`}>
                        {dataCurta(e.dataInicio, true)}{rascunhos[e.slug] ? " · por guardar" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {evento && (
            <Painel
              titulo={evento.titulo}
              descricao={`${[evento.circuito, evento.localidade || evento.provincia].filter(Boolean).join(", ")} · ${dataCurta(evento.dataInicio, true)}`}
              accoes={
                <>
                  <Estado valor={evento.estado} />
                  <BotaoLigacao href={eComunidade(evento.disciplina) ? "/admin/eventos" : "/admin/provas"} variante="fantasma" tamanho="sm">Ficha do evento</BotaoLigacao>
                  <BotaoLigacao href={hrefEvento(evento)} externo variante="fantasma" tamanho="sm">Ver no site</BotaoLigacao>
                </>
              }
            >
              <div className="space-y-[var(--intervalo)]">
                {bilhetes.map((b, i) => {
                  const v = vendas.get(b.id) ?? { qtd: 0, receita: 0 };
                  const pct = b.disponiveis > 0 ? Math.min(100, (v.qtd / b.disponiveis) * 100) : 0;
                  return (
                    <div key={b.id} className={`rounded-[var(--raio)] border p-4 ${b.destaque ? "border-mb-red/50 bg-mb-red/[0.08]" : "border-white/10 bg-black/[0.15]"}`}>
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-white">
                            {b.nome}
                            {b.destaque && <Etiqueta tom="vermelho"><Star className="size-3" aria-hidden />Em destaque</Etiqueta>}
                          </p>
                          {b.descricao && <p className="mt-0.5 text-[13px] text-white/55">{b.descricao}</p>}
                        </div>
                        <p className="text-xl font-semibold tabular-nums">{formatKz(b.preco)}</p>
                      </div>

                      <div className="mb-4">
                        <div className="mb-1.5 flex justify-between gap-3 text-xs">
                          <span className="text-white/60">{v.qtd} de {b.disponiveis} vendidos</span>
                          <span className="text-[#4ade80]">{formatKz(v.receita)}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-mb-red" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <Campo etiqueta="Preço (Kz)">
                          <Input type="number" min={0} value={b.preco}
                            onChange={(e) => alterarBilhete(i, { preco: Number(e.target.value) || 0 })} />
                        </Campo>
                        <Campo etiqueta="Lugares à venda">
                          <Input type="number" min={0} value={b.disponiveis}
                            onChange={(e) => alterarBilhete(i, { disponiveis: Number(e.target.value) || 0 })} />
                        </Campo>
                        <Botao variante={b.destaque ? "primario" : "secundario"} aria-pressed={Boolean(b.destaque)}
                          onClick={() => alterarBilhete(i, { destaque: !b.destaque })}>
                          <Star className="size-4" aria-hidden />
                          {b.destaque ? "Em destaque" : "Destacar"}
                        </Botao>
                      </div>
                    </div>
                  );
                })}

                {sujo && (
                  <Aviso tom="atencao" titulo="Alterações por guardar"
                    accoes={
                      <>
                        <Botao variante="fantasma" onClick={() => setRascunhos((r) => { const n = { ...r }; delete n[evento.slug]; return n; })}>Desfazer</Botao>
                        <Botao variante="primario" disabled={aGuardar} onClick={() => void guardar()}>{aGuardar ? "A guardar…" : "Guardar"}</Botao>
                      </>
                    }>
                    Os preços e as lotações só mudam no site depois de guardar.
                  </Aviso>
                )}
              </div>
            </Painel>
          )}
        </div>
      )}

      {elemento}
    </>
  );
}
