"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin/store";
import { formatKz, formatDataCurta } from "@/lib/data";
import {
  CabecalhoPagina, Painel, Ferramentas, Procura, Seleccao, Tabela, Linha, Cel,
  Estado, Estatistica, Gaveta, Campo, Input, useAviso, usePaginacao, Confirmar,
} from "@/components/admin/kit";
import type { Encomenda, EstadoEncomenda } from "@/lib/admin/types";

const ESTADOS: EstadoEncomenda[] = ["pendente", "pago", "usado", "cancelado", "reembolsado"];

export default function AdminEncomendas() {
  const { estado, atualizar, remover, registar } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const [procura, setProcura] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("");
  const [aberta, setAberta] = useState<Encomenda | null>(null);
  const [aApagar, setAApagar] = useState<Encomenda | null>(null);

  const eventos = useMemo(
    () => [...new Set(estado.encomendas.map((e) => e.eventoTitulo))].map((t) => ({ valor: t, nome: t })),
    [estado.encomendas],
  );

  const filtradas = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.encomendas
      .filter((e) => {
        if (filtroEstado && e.estado !== filtroEstado) return false;
        if (filtroEvento && e.eventoTitulo !== filtroEvento) return false;
        if (q && !`${e.referencia} ${e.comprador.nome} ${e.comprador.email} ${e.codigoQR}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.criado.localeCompare(a.criado));
  }, [estado.encomendas, procura, filtroEstado, filtroEvento]);

  const { fatia, controlos } = usePaginacao(filtradas, 12);

  const totais = useMemo(() => {
    const pagas = estado.encomendas.filter((e) => e.estado === "pago" || e.estado === "usado");
    return {
      receita: pagas.reduce((s, e) => s + e.total, 0),
      comissao: pagas.reduce((s, e) => s + e.taxa, 0),
      bilhetes: pagas.reduce((s, e) => s + e.quantidade, 0),
      pendentes: estado.encomendas.filter((e) => e.estado === "pendente").length,
    };
  }, [estado.encomendas]);

  const mudarEstado = (e: Encomenda, novo: EstadoEncomenda) => {
    const campos: Partial<Encomenda> = { estado: novo };
    if (novo === "pago" && !e.pago) campos.pago = new Date().toISOString().slice(0, 10);
    atualizar("encomendas", e.id, campos);
    registar("alterou estado", "Encomenda", `${e.referencia} → ${novo}`);
    mostrar(`Encomenda ${e.referencia} marcada como ${novo}.`);
    setAberta((a) => (a && a.id === e.id ? { ...a, ...campos } : a));
  };

  const exportarCSV = () => {
    const linhas = [
      ["Referência", "Evento", "Bilhete", "Qtd", "Total", "Taxa", "Estado", "Comprador", "Email", "Método", "Criado"],
      ...filtradas.map((e) => [
        e.referencia, e.eventoTitulo, e.tipoBilheteNome, e.quantidade, e.total, e.taxa,
        e.estado, e.comprador.nome, e.comprador.email, e.metodo, e.criado,
      ]),
    ];
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `encomendas-motobox-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrar(`${filtradas.length} encomendas exportadas.`);
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Encomendas"
        descricao="Compras de bilhetes, estado de pagamento e comissões."
        accoes={
          <button type="button" onClick={exportarCSV}
            className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red">
            Exportar CSV
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Estatistica rotulo="Receita confirmada" valor={formatKz(totais.receita)} tom="ok" />
        <Estatistica rotulo="Comissão Motobox" valor={formatKz(totais.comissao)} tom="gold" />
        <Estatistica rotulo="Bilhetes vendidos" valor={totais.bilhetes} />
        <Estatistica rotulo="Por confirmar" valor={totais.pendentes} tom={totais.pendentes ? "red" : "neutral"} />
      </div>

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Referência, comprador ou código QR…" />
          <Seleccao valor={filtroEstado} onChange={setFiltroEstado} aria-label="Estado"
            opcoes={[{ valor: "", nome: "Todos os estados" }, ...ESTADOS.map((e) => ({ valor: e, nome: e }))]}
            className="w-auto min-w-[150px]" />
          <Seleccao valor={filtroEvento} onChange={setFiltroEvento} aria-label="Evento"
            opcoes={[{ valor: "", nome: "Todos os eventos" }, ...eventos]}
            className="w-auto min-w-[180px]" />
        </Ferramentas>

        <Tabela
          cabecalhos={["Referência", "Evento", "Comprador", "Qtd", "Total", "Estado", "Ações"]}
          vazio={fatia.length === 0}
        >
          {fatia.map((e) => (
            <Linha key={e.id} onClick={() => setAberta(e)}>
              <Cel>
                <p className="font-display text-xs tracking-wider text-white">{e.referencia}</p>
                <p className="text-xs text-ink-500">{formatDataCurta(e.criado)}</p>
              </Cel>
              <Cel>
                <p className="truncate text-ink-200">{e.eventoTitulo}</p>
                <p className="truncate text-xs text-ink-500">{e.tipoBilheteNome}</p>
              </Cel>
              <Cel>
                <p className="truncate text-ink-200">{e.comprador.nome}</p>
                <p className="truncate text-xs text-ink-500">{e.metodo}</p>
              </Cel>
              <Cel className="tabular-nums text-ink-300">{e.quantidade}</Cel>
              <Cel className="font-display tabular-nums text-white">{formatKz(e.total)}</Cel>
              <Cel><Estado valor={e.estado} /></Cel>
              <Cel className="w-32">
                <div className="flex gap-1.5" onClick={(ev) => ev.stopPropagation()}>
                  {e.estado === "pendente" && (
                    <button type="button" onClick={() => mudarEstado(e, "pago")}
                      className="border border-ok/40 px-2 py-1 text-[10px] font-display uppercase tracking-wider text-ok transition-colors hover:bg-ok hover:text-white">
                      Confirmar
                    </button>
                  )}
                  {e.estado === "pago" && (
                    <button type="button" onClick={() => mudarEstado(e, "usado")}
                      className="border border-ink-600 px-2 py-1 text-[10px] font-display uppercase tracking-wider text-ink-300 transition-colors hover:border-white hover:text-white">
                      Validar
                    </button>
                  )}
                  <button type="button" onClick={() => setAApagar(e)}
                    className="border border-ink-700 px-2 py-1 text-[10px] font-display uppercase tracking-wider text-ink-400 transition-colors hover:border-mb-red hover:text-white">
                    ×
                  </button>
                </div>
              </Cel>
            </Linha>
          ))}
        </Tabela>
        {controlos}
      </Painel>

      {/* Detalhe da encomenda */}
      <Gaveta
        aberta={aberta !== null}
        aoFechar={() => setAberta(null)}
        titulo={aberta?.referencia ?? ""}
        descricao="Detalhe da encomenda e ações de pagamento."
        largura="max-w-xl"
      >
        {aberta && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 border border-ink-700 bg-ink-950 p-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-500">Estado atual</p>
                <div className="mt-1"><Estado valor={aberta.estado} /></div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-ink-500">Total</p>
                <p className="font-display text-xl text-white">{formatKz(aberta.total)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {ESTADOS.filter((s) => s !== aberta.estado).map((s) => (
                <button key={s} type="button" onClick={() => mudarEstado(aberta, s)}
                  className="border border-ink-600 px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-ink-200 transition-colors hover:border-mb-red hover:text-white">
                  Marcar {s}
                </button>
              ))}
            </div>

            <dl className="divide-y divide-ink-800 border border-ink-700">
              {[
                ["Evento", aberta.eventoTitulo],
                ["Tipo de bilhete", aberta.tipoBilheteNome],
                ["Quantidade", String(aberta.quantidade)],
                ["Preço unitário", formatKz(aberta.precoUnitario)],
                ["Taxa Motobox", formatKz(aberta.taxa)],
                ["Método", aberta.metodo],
                ["Criado", formatDataCurta(aberta.criado)],
                ["Pago", aberta.pago ? formatDataCurta(aberta.pago) : "—"],
                ["Código QR", aberta.codigoQR],
                ["Comprador", aberta.comprador.nome],
                ["Email", aberta.comprador.email],
                ["Telefone", aberta.comprador.telefone],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-3 py-2 text-sm">
                  <dt className="text-ink-400">{k}</dt>
                  <dd className="text-right text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Gaveta>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={() => {
          if (aApagar) { remover("encomendas", aApagar.id); mostrar("Encomenda removida."); }
        }}
        titulo="Apagar encomenda"
        mensagem="A encomenda será removida do histórico. Esta ação é permanente."
        textoConfirmar="Apagar"
        perigo
      />

      {elemento}
    </>
  );
}
