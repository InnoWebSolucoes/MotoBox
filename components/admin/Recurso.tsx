"use client";

/* ============================================================
   MOTOBOX ADMIN — Página de recurso genérica
   Encapsula o padrão comum a todas as listagens: procura,
   filtros, tabela, criar/editar em gaveta e apagar com
   confirmação. Cada página fornece apenas as colunas e o
   formulário próprios.
   ============================================================ */

import { useMemo, useState, type ReactNode } from "react";
import { useAdmin, chaveDe, type ColeccaoNome } from "@/lib/admin/store";
import {
  CabecalhoPagina, Painel, Ferramentas, Procura, Seleccao, Tabela, Linha, Cel,
  AccaoIcone, Gaveta, Confirmar, useAviso, usePaginacao,
} from "./kit";

export interface Coluna<T> {
  cabecalho: string;
  celula: (item: T) => ReactNode;
  className?: string;
}

export interface Filtro {
  chave: string;
  etiqueta: string;
  opcoes: { valor: string; nome: string }[];
}

export function PaginaRecurso<T extends object>({
  coleccao, titulo, descricao, colunas, filtros = [],
  procuraEm, formulario, vazio, novoRegisto, accoesExtra, porPagina = 12,
  ordenar,
}: {
  coleccao: ColeccaoNome;
  titulo: string;
  descricao?: string;
  colunas: Coluna<T>[];
  filtros?: Filtro[];
  /** Campos onde a procura textual actua */
  procuraEm: (item: T) => string;
  /** Formulário de criação/edição; recebe o rascunho e um setter */
  formulario: (rascunho: T, definir: (campos: Partial<T>) => void) => ReactNode;
  /** Registo em branco para o botão "Novo" */
  novoRegisto: () => T;
  vazio?: string;
  accoesExtra?: ReactNode;
  porPagina?: number;
  ordenar?: (a: T, b: T) => number;
}) {
  const { estado, criar, atualizar, remover } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const chave = chaveDe(coleccao);

  const dados = estado[coleccao] as unknown as T[];

  const [procura, setProcura] = useState("");
  const [activos, setActivos] = useState<Record<string, string>>({});
  const [rascunho, setRascunho] = useState<T | null>(null);
  const [aEditar, setAEditar] = useState<string | null>(null);
  const [aApagar, setAApagar] = useState<T | null>(null);

  const filtrados = useMemo(() => {
    const q = procura.trim().toLowerCase();
    let lista = dados.filter((it) => {
      if (q && !procuraEm(it).toLowerCase().includes(q)) return false;
      for (const [k, v] of Object.entries(activos)) {
        if (v && String((it as Record<string, unknown>)[k] ?? "") !== v) return false;
      }
      return true;
    });
    if (ordenar) lista = [...lista].sort(ordenar);
    return lista;
  }, [dados, procura, activos, procuraEm, ordenar]);

  const { fatia, controlos } = usePaginacao(filtrados, porPagina);

  const abrirNovo = () => { setAEditar(null); setRascunho(novoRegisto()); };
  const abrirEdicao = (it: T) => { setAEditar(String((it as Record<string, unknown>)[chave])); setRascunho({ ...it }); };
  const fechar = () => { setRascunho(null); setAEditar(null); };

  const definir = (campos: Partial<T>) =>
    setRascunho((r) => (r ? { ...r, ...campos } : r));

  const guardar = () => {
    if (!rascunho) return;
    const id = String((rascunho as Record<string, unknown>)[chave] ?? "").trim();
    if (!id) { mostrar("O identificador não pode ficar vazio.", "erro"); return; }

    if (aEditar) {
      atualizar(coleccao, aEditar, rascunho as Record<string, unknown>);
      mostrar("Alterações guardadas.");
    } else {
      if (dados.some((it) => String((it as Record<string, unknown>)[chave]) === id)) {
        mostrar("Já existe um registo com esse identificador.", "erro");
        return;
      }
      criar(coleccao, rascunho as Record<string, unknown>);
      mostrar("Registo criado.");
    }
    fechar();
  };

  return (
    <>
      <CabecalhoPagina
        titulo={titulo}
        descricao={descricao}
        accoes={
          <>
            {accoesExtra}
            <button
              type="button" onClick={abrirNovo}
              className="inline-flex h-10 items-center gap-2 bg-mb-red px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Novo
            </button>
          </>
        }
      />

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} />
          {filtros.map((f) => (
            <Seleccao
              key={f.chave}
              valor={activos[f.chave] ?? ""}
              onChange={(v) => setActivos((a) => ({ ...a, [f.chave]: v }))}
              opcoes={[{ valor: "", nome: f.etiqueta }, ...f.opcoes]}
              className="w-auto min-w-[150px]"
              aria-label={f.etiqueta}
            />
          ))}
          {(procura || Object.values(activos).some(Boolean)) && (
            <button
              type="button"
              onClick={() => { setProcura(""); setActivos({}); }}
              className="h-10 border border-ink-700 px-3 font-display text-[11px] uppercase tracking-wider text-ink-300 transition-colors hover:border-mb-red hover:text-white"
            >
              Limpar
            </button>
          )}
        </Ferramentas>

        <Tabela
          cabecalhos={[...colunas.map((c) => c.cabecalho), "Ações"]}
          vazio={fatia.length === 0}
        >
          {fatia.map((it) => (
            <Linha key={String((it as Record<string, unknown>)[chave])} onClick={() => abrirEdicao(it)}>
              {colunas.map((c, i) => (
                <Cel key={i} className={c.className}>{c.celula(it)}</Cel>
              ))}
              <Cel className="w-24">
                <div className="flex gap-1.5">
                  <AccaoIcone titulo="Editar" onClick={() => abrirEdicao(it)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
                    </svg>
                  </AccaoIcone>
                  <AccaoIcone titulo="Apagar" tom="perigo" onClick={() => setAApagar(it)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </AccaoIcone>
                </div>
              </Cel>
            </Linha>
          ))}
        </Tabela>
        {controlos}
        {vazio && dados.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-500">{vazio}</p>
        )}
      </Painel>

      <Gaveta
        aberta={rascunho !== null}
        aoFechar={fechar}
        titulo={aEditar ? `Editar ${titulo.toLowerCase()}` : `Novo registo`}
        descricao={aEditar ? String((rascunho as Record<string, unknown> | null)?.[chave] ?? "") : "Preencha os campos e guarde."}
        rodape={
          <>
            <button type="button" onClick={fechar}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-ink-800">
              Cancelar
            </button>
            <button type="button" onClick={guardar}
              className="h-10 bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark">
              Guardar
            </button>
          </>
        }
      >
        {rascunho && <div className="space-y-4">{formulario(rascunho, definir)}</div>}
      </Gaveta>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={() => {
          if (aApagar) {
            remover(coleccao, String((aApagar as Record<string, unknown>)[chave]));
            mostrar("Registo removido.");
          }
        }}
        titulo="Apagar registo"
        mensagem="Esta ação é permanente e remove o registo da plataforma. Pretende continuar?"
        textoConfirmar="Apagar"
        perigo
      />

      {elemento}
    </>
  );
}
