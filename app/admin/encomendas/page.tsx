"use client";

/* ============================================================
   MOTOBOX ADMIN — Encomendas
   As compras de bilhetes: confirmar o pagamento, validar a
   entrada no dia, cancelar ou reembolsar, e exportar a lista.
   ============================================================ */

import { useMemo, useState } from "react";
import { CheckCircle2, Download, QrCode, Receipt, ScanLine, Trash2 } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import { formatKz } from "@/lib/data";
import {
  Abas, AccaoIcone, Botao, CabecalhoPagina, Cel, Confirmar, Estado, Estatistica, Ferramentas, Gaveta, Linha,
  Painel, Procura, Seleccao, Tabela, useAviso, usePaginacao,
} from "@/components/admin/kit";
import type { Encomenda, EstadoEncomenda } from "@/lib/admin/types";
import { dataCurta } from "../moderacao/_comum/formato";
import { Ficha } from "../moderacao/_comum/partes";

const ESTADOS: { valor: EstadoEncomenda; nome: string; accao: string; descricao: string }[] = [
  { valor: "pendente", nome: "Por confirmar", accao: "Voltar a «por confirmar»", descricao: "À espera do pagamento." },
  { valor: "pago", nome: "Paga", accao: "Confirmar o pagamento", descricao: "O dinheiro entrou: o bilhete é válido." },
  { valor: "usado", nome: "Usada", accao: "Validar a entrada", descricao: "O bilhete já foi lido à entrada." },
  { valor: "cancelado", nome: "Cancelada", accao: "Cancelar", descricao: "Sem pagamento: o bilhete deixa de valer." },
  { valor: "reembolsado", nome: "Reembolsada", accao: "Marcar como reembolsada", descricao: "O dinheiro foi devolvido." },
];
const nomeEstado = (e: string) => ESTADOS.find((x) => x.valor === e)?.nome ?? e;

type Vista = "" | EstadoEncomenda;

export default function AdminEncomendas() {
  const { estado, atualizar, remover, registar } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const [procura, setProcura] = useState("");
  const [vista, setVista] = useState<Vista>("");
  const [filtroEvento, setFiltroEvento] = useState("");
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [aApagar, setAApagar] = useState<Encomenda | null>(null);

  const aberta = estado.encomendas.find((e) => e.id === abertaId) ?? null;

  const eventos = useMemo(
    () => [...new Set(estado.encomendas.map((e) => e.eventoTitulo))].map((t) => ({ valor: t, nome: t })),
    [estado.encomendas],
  );

  const filtradas = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.encomendas
      .filter((e) => {
        if (vista && e.estado !== vista) return false;
        if (filtroEvento && e.eventoTitulo !== filtroEvento) return false;
        if (q && !`${e.referencia} ${e.comprador.nome} ${e.comprador.email} ${e.comprador.telefone} ${e.codigoQR}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.criado.localeCompare(a.criado));
  }, [estado.encomendas, procura, vista, filtroEvento]);

  const { fatia, controlos } = usePaginacao(filtradas, 15);

  const totais = useMemo(() => {
    const pagas = estado.encomendas.filter((e) => e.estado === "pago" || e.estado === "usado");
    return {
      receita: pagas.reduce((s, e) => s + e.total, 0),
      comissao: pagas.reduce((s, e) => s + e.taxa, 0),
      bilhetes: pagas.reduce((s, e) => s + e.quantidade, 0),
      pendentes: estado.encomendas.filter((e) => e.estado === "pendente").length,
    };
  }, [estado.encomendas]);

  const contar = (v: EstadoEncomenda) => estado.encomendas.filter((e) => e.estado === v).length;

  const mudarEstado = async (e: Encomenda, novo: EstadoEncomenda) => {
    const campos: Partial<Encomenda> = { estado: novo };
    if (novo === "pago" && !e.pago) campos.pago = new Date().toISOString().slice(0, 10);
    const falha = await atualizar("encomendas", e.id, campos);
    if (falha) { mostrar(falha, "erro"); return; }
    registar("alterou estado", "Encomenda", `${e.referencia} → ${nomeEstado(novo)}`);
    mostrar(`Encomenda ${e.referencia}: ${nomeEstado(novo).toLowerCase()}.`);
  };

  const exportarCSV = () => {
    const linhas = [
      ["Referência", "Evento", "Bilhete", "Qtd", "Total", "Taxa", "Estado", "Comprador", "Email", "Telefone", "Método", "Criada", "Paga"],
      ...filtradas.map((e) => [
        e.referencia, e.eventoTitulo, e.tipoBilheteNome, e.quantidade, e.total, e.taxa,
        nomeEstado(e.estado), e.comprador.nome, e.comprador.email, e.comprador.telefone, e.metodo, e.criado, e.pago ?? "",
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
        sobretitulo="Bilheteira"
        icone={<Receipt />}
        descricao="As compras de bilhetes feitas no site: confirmar pagamentos, validar entradas, cancelar ou reembolsar."
        accoes={<Botao onClick={exportarCSV}><Download className="size-4" aria-hidden />Exportar (CSV)</Botao>}
      />

      <div className="mb-[var(--intervalo)] grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
        <Estatistica rotulo="Receita confirmada" valor={formatKz(totais.receita)} tom="ok" />
        <Estatistica rotulo="Comissão MotoBox" valor={formatKz(totais.comissao)} tom="gold" variacao={`Taxa de ${estado.definicoes.taxaMotobox}%`} />
        <Estatistica rotulo="Bilhetes vendidos" valor={totais.bilhetes} />
        <Estatistica rotulo="Por confirmar" valor={totais.pendentes} tom={totais.pendentes ? "red" : "neutral"} />
      </div>

      <Painel>
        <div className="mb-4">
          <Abas<Vista>
            rotulo="Estado das encomendas"
            activa={vista}
            onChange={setVista}
            abas={[
              { chave: "", nome: "Todas", contador: estado.encomendas.length },
              ...ESTADOS.map((s) => ({ chave: s.valor as Vista, nome: s.nome, contador: contar(s.valor) })),
            ]}
          />
        </div>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Referência, comprador, telefone ou código…" />
          <Seleccao valor={filtroEvento} onChange={setFiltroEvento} aria-label="Evento"
            opcoes={[{ valor: "", nome: "Todos os eventos" }, ...eventos]}
            className="sm:w-64" />
        </Ferramentas>

        {/* Telemóvel (por exemplo, à entrada do evento): um cartão por encomenda. */}
        <ul className="space-y-[var(--intervalo)] md:hidden">
          {fatia.length === 0 && <li className="py-10 text-center text-sm text-white/50">Nenhuma encomenda corresponde aos filtros.</li>}
          {fatia.map((e) => (
            <li key={e.id} className="rounded-[var(--raio)] border border-white/[0.08] bg-black/[0.15] p-3.5">
              <button type="button" onClick={() => setAbertaId(e.id)} className="block w-full text-left">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-medium tabular-nums text-white">{e.referencia}</span>
                    <span className="block truncate text-sm text-white/75">{e.comprador.nome}</span>
                    <span className="block truncate text-xs text-white/45">{e.eventoTitulo} · {e.quantidade} × {e.tipoBilheteNome}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block tabular-nums text-white">{formatKz(e.total)}</span>
                    <span className="mt-1 block"><Estado valor={e.estado} rotulo={nomeEstado(e.estado)} /></span>
                  </span>
                </span>
              </button>
              {(e.estado === "pendente" || e.estado === "pago") && (
                <div className="mt-3 flex justify-end border-t border-white/[0.07] pt-3">
                  {e.estado === "pendente"
                    ? <Botao tamanho="sm" variante="ok" onClick={() => void mudarEstado(e, "pago")}><CheckCircle2 className="size-4" aria-hidden />Confirmar o pagamento</Botao>
                    : <Botao tamanho="sm" onClick={() => void mudarEstado(e, "usado")}><ScanLine className="size-4" aria-hidden />Validar a entrada</Botao>}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
        <Tabela cabecalhos={["Referência", "Evento", "Comprador", "Qtd", "Total", "Estado", "Acções"]} vazio={fatia.length === 0}>
          {fatia.map((e) => (
            <Linha key={e.id} onClick={() => setAbertaId(e.id)}>
              <Cel>
                <p className="font-medium tabular-nums text-white">{e.referencia}</p>
                <p className="text-xs text-white/45">{dataCurta(e.criado)}</p>
              </Cel>
              <Cel>
                <p className="max-w-60 truncate text-white/85">{e.eventoTitulo}</p>
                <p className="truncate text-xs text-white/45">{e.tipoBilheteNome}</p>
              </Cel>
              <Cel>
                <p className="max-w-48 truncate text-white/85">{e.comprador.nome}</p>
                <p className="truncate text-xs text-white/45">{e.metodo}</p>
              </Cel>
              <Cel className="tabular-nums text-white/70">{e.quantidade}</Cel>
              <Cel className="whitespace-nowrap tabular-nums text-white">{formatKz(e.total)}</Cel>
              <Cel><Estado valor={e.estado} rotulo={nomeEstado(e.estado)} /></Cel>
              <Cel className="w-px">
                <div className="flex justify-end gap-1.5">
                  {e.estado === "pendente" && (
                    <AccaoIcone titulo="Confirmar o pagamento" tom="ok" onClick={() => void mudarEstado(e, "pago")}>
                      <CheckCircle2 className="size-3.5" aria-hidden />
                    </AccaoIcone>
                  )}
                  {e.estado === "pago" && (
                    <AccaoIcone titulo="Validar a entrada" onClick={() => void mudarEstado(e, "usado")}>
                      <ScanLine className="size-3.5" aria-hidden />
                    </AccaoIcone>
                  )}
                  <AccaoIcone titulo="Apagar" tom="perigo" onClick={() => setAApagar(e)}>
                    <Trash2 className="size-3.5" aria-hidden />
                  </AccaoIcone>
                </div>
              </Cel>
            </Linha>
          ))}
        </Tabela>
        </div>
        {controlos}
      </Painel>

      <Gaveta
        aberta={aberta !== null}
        aoFechar={() => setAbertaId(null)}
        titulo={aberta ? `Encomenda ${aberta.referencia}` : ""}
        descricao={aberta ? `${aberta.eventoTitulo} · ${aberta.comprador.nome}` : undefined}
        largura="max-w-xl"
        rodape={aberta && (
          <>
            <Botao variante="perigo" className="mr-auto" onClick={() => setAApagar(aberta)}><Trash2 className="size-4" aria-hidden />Apagar</Botao>
            <Botao variante="fantasma" onClick={() => setAbertaId(null)}>Fechar</Botao>
          </>
        )}
      >
        {aberta && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-[var(--raio)] border border-white/10 bg-black/[0.18] p-4">
              <div>
                <p className="text-xs text-white/50">Estado</p>
                <div className="mt-1"><Estado valor={aberta.estado} rotulo={nomeEstado(aberta.estado)} /></div>
                <p className="mt-1.5 text-xs text-white/50">{ESTADOS.find((s) => s.valor === aberta.estado)?.descricao}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">Total</p>
                <p className="text-2xl font-semibold tabular-nums">{formatKz(aberta.total)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-medium text-white/75">Mudar o estado</p>
              <div className="flex flex-wrap gap-2">
                {ESTADOS.filter((s) => s.valor !== aberta.estado).map((s) => (
                  <Botao key={s.valor} tamanho="sm" variante={s.valor === "pago" && aberta.estado === "pendente" ? "ok" : "secundario"}
                    onClick={() => void mudarEstado(aberta, s.valor)}>
                    {s.accao}
                  </Botao>
                ))}
              </div>
            </div>

            <Ficha linhas={[
              ["Evento", aberta.eventoTitulo],
              ["Tipo de bilhete", aberta.tipoBilheteNome],
              ["Quantidade", String(aberta.quantidade)],
              ["Preço de cada bilhete", formatKz(aberta.precoUnitario)],
              ["Taxa MotoBox", formatKz(aberta.taxa)],
              ["Pagamento", aberta.metodo],
              ["Criada", dataCurta(aberta.criado, true)],
              ["Paga", aberta.pago ? dataCurta(aberta.pago, true) : "Ainda não"],
              ["Código do bilhete", <span key="qr" className="inline-flex items-center gap-1.5 tabular-nums"><QrCode className="size-3.5" aria-hidden />{aberta.codigoQR}</span>],
            ]} />

            <div>
              <p className="mb-2 text-[13px] font-medium text-white/75">Comprador</p>
              <Ficha linhas={[
                ["Nome", aberta.comprador.nome],
                ["Email", <a key="e" className="sublinhado" href={`mailto:${aberta.comprador.email}`}>{aberta.comprador.email}</a>],
                ["Telefone", <a key="t" className="sublinhado" href={`tel:${aberta.comprador.telefone.replace(/\s+/g, "")}`}>{aberta.comprador.telefone}</a>],
              ]} />
            </div>
          </div>
        )}
      </Gaveta>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={async () => {
          if (!aApagar) return;
          const falha = await remover("encomendas", aApagar.id);
          if (!falha && abertaId === aApagar.id) setAbertaId(null);
          mostrar(falha ?? "Encomenda apagada.", falha ? "erro" : "ok");
        }}
        titulo="Apagar encomenda"
        mensagem="A encomenda sai do histórico de vez e o bilhete deixa de poder ser validado. Para anular uma compra, é melhor cancelar."
        textoConfirmar="Apagar"
        perigo
      />

      {elemento}
    </>
  );
}
