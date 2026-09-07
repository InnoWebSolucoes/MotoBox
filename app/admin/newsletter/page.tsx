"use client";

import { useMemo, useState } from "react";
import { useAdmin, novoId } from "@/lib/admin/store";
import { formatDataCurta } from "@/lib/data";
import {
  CabecalhoPagina, Painel, Ferramentas, Procura, Seleccao, Estatistica,
  Tabela, Linha, Cel, AccaoIcone, Campo, Input, useAviso, usePaginacao, Confirmar,
} from "@/components/admin/kit";
import type { Subscritor } from "@/lib/admin/types";

const ORIGENS = ["rodapé", "faixa", "cartão", "checkout", "manual"];

export default function AdminNewsletter() {
  const { estado, criar, atualizar, remover } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const [procura, setProcura] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [aApagar, setAApagar] = useState<Subscritor | null>(null);

  const filtrados = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.subscritores
      .filter((s) => {
        if (filtroOrigem && s.origem !== filtroOrigem) return false;
        if (q && !`${s.email} ${s.nome ?? ""}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.subscrito.localeCompare(a.subscrito));
  }, [estado.subscritores, procura, filtroOrigem]);

  const { fatia, controlos } = usePaginacao(filtrados, 15);

  const activos = estado.subscritores.filter((s) => s.ativo).length;

  const adicionar = () => {
    const email = novoEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) { mostrar("Introduza um email válido.", "erro"); return; }
    if (estado.subscritores.some((s) => s.email.toLowerCase() === email)) {
      mostrar("Esse email já está subscrito.", "erro"); return;
    }
    criar("subscritores", {
      id: novoId("s"), email, nome: novoNome.trim() || undefined,
      origem: "manual", subscrito: new Date().toISOString().slice(0, 10), ativo: true,
    } as unknown as Record<string, unknown>);
    setNovoEmail(""); setNovoNome("");
    mostrar("Subscritor adicionado.");
  };

  const exportar = () => {
    const csv = [
      ["Email", "Nome", "Origem", "Subscrito", "Ativo"],
      ...filtrados.map((s) => [s.email, s.nome ?? "", s.origem, s.subscrito, s.ativo ? "Sim" : "Não"]),
    ].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-motobox-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrar(`${filtrados.length} contactos exportados.`);
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Newsletter"
        descricao="Lista de subscritores e origem da subscrição."
        accoes={
          <button type="button" onClick={exportar}
            className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red">
            Exportar CSV
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Estatistica rotulo="Subscritores activos" valor={activos} tom="ok" />
        <Estatistica rotulo="Total de registos" valor={estado.subscritores.length} />
        <Estatistica rotulo="Cancelaram" valor={estado.subscritores.length - activos} />
      </div>

      <Painel titulo="Juntar subscritor" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-[2fr_2fr_auto]">
          <Campo etiqueta="Email">
            <Input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="nome@exemplo.com"
              onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }} />
          </Campo>
          <Campo etiqueta="Nome (opcional)">
            <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do subscritor" />
          </Campo>
          <div className="flex items-end">
            <button type="button" onClick={adicionar}
              className="h-10 w-full bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark sm:w-auto">
              Juntar
            </button>
          </div>
        </div>
      </Painel>

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Email ou nome…" />
          <Seleccao valor={filtroOrigem} onChange={setFiltroOrigem} aria-label="Origem"
            opcoes={[{ valor: "", nome: "Todas as origens" }, ...ORIGENS.map((o) => ({ valor: o, nome: o }))]}
            className="w-auto min-w-[160px]" />
        </Ferramentas>

        <Tabela cabecalhos={["Email", "Nome", "Origem", "Subscrito", "Estado", "Ações"]} vazio={fatia.length === 0}>
          {fatia.map((s) => (
            <Linha key={s.id}>
              <Cel className="text-white">{s.email}</Cel>
              <Cel className="text-ink-300">{s.nome ?? "—"}</Cel>
              <Cel className="text-ink-400">{s.origem}</Cel>
              <Cel className="tabular-nums text-ink-400">{formatDataCurta(s.subscrito)}</Cel>
              <Cel>
                <button type="button"
                  onClick={() => atualizar("subscritores", s.id, { ativo: !s.ativo })}
                  className={`border px-2 py-0.5 text-[10px] font-display uppercase tracking-widest transition-colors ${
                    s.ativo
                      ? "border-ok/30 bg-ok/15 text-ok hover:bg-ok hover:text-white"
                      : "border-ink-600 text-ink-400 hover:border-ok hover:text-ok"
                  }`}>
                  {s.ativo ? "Activo" : "Cancelado"}
                </button>
              </Cel>
              <Cel className="w-16">
                <AccaoIcone titulo="Apagar" tom="perigo" onClick={() => setAApagar(s)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </AccaoIcone>
              </Cel>
            </Linha>
          ))}
        </Tabela>
        {controlos}
      </Painel>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={() => {
          if (aApagar) { remover("subscritores", aApagar.id); mostrar("Subscritor removido."); }
        }}
        titulo="Remover subscritor"
        mensagem="O contacto será apagado da lista de newsletter."
        textoConfirmar="Remover"
        perigo
      />

      {elemento}
    </>
  );
}
