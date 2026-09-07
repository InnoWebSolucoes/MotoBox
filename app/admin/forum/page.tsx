"use client";

import { useMemo, useState } from "react";
import { useAdmin, novoId } from "@/lib/admin/store";
import { formatDataCurta } from "@/lib/data";
import {
  CabecalhoPagina, Painel, Ferramentas, Procura, Seleccao, Estatistica,
  Tabela, Linha, Cel, AccaoIcone, useAviso, usePaginacao, Confirmar, Interruptor,
  Gaveta, Campo, Input, Area,
} from "@/components/admin/kit";
import type { TopicoForum } from "@/lib/types";

export default function AdminForum() {
  const { estado, criar, atualizar, remover, guardarDefinicoes } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const [procura, setProcura] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [aApagar, setAApagar] = useState<TopicoForum | null>(null);
  const [rascunho, setRascunho] = useState<TopicoForum | null>(null);
  const [novo, setNovo] = useState(false);

  const categorias = useMemo(
    () => estado.categoriasForum.map((c) => ({ valor: c.slug, nome: c.nome })),
    [estado.categoriasForum],
  );

  const filtrados = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.topicos
      .filter((t) => {
        if (filtroCategoria && t.categoriaSlug !== filtroCategoria) return false;
        if (q && !`${t.titulo} ${t.autor} ${t.excerto}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (Number(b.fixado ?? false) - Number(a.fixado ?? false)) || b.criado.localeCompare(a.criado));
  }, [estado.topicos, procura, filtroCategoria]);

  const { fatia, controlos } = usePaginacao(filtrados, 15);

  const contagem = useMemo(() => ({
    total: estado.topicos.length,
    fixados: estado.topicos.filter((t) => t.fixado).length,
    bloqueados: estado.topicos.filter((t) => t.bloqueado).length,
    respostas: estado.topicos.reduce((s, t) => s + t.respostas, 0),
  }), [estado.topicos]);

  const guardar = () => {
    if (!rascunho) return;
    if (!rascunho.titulo.trim()) { mostrar("O título é obrigatório.", "erro"); return; }
    const cat = estado.categoriasForum.find((c) => c.slug === rascunho.categoriaSlug);
    const completo = { ...rascunho, categoria: cat?.nome ?? rascunho.categoria };
    if (novo) { criar("topicos", completo as unknown as Record<string, unknown>); mostrar("Tópico criado."); }
    else { atualizar("topicos", rascunho.id, completo); mostrar("Tópico atualizado."); }
    setRascunho(null); setNovo(false);
  };

  const abrirNovo = () => {
    const c = estado.categoriasForum[0];
    setNovo(true);
    setRascunho({
      id: novoId("t"), titulo: "", categoria: c?.nome ?? "", categoriaSlug: c?.slug ?? "",
      autor: "Equipa Motobox", autorAvatar: "EM", avatarCor: "#e10600",
      criado: new Date().toISOString().slice(0, 10), respostas: 0, visualizacoes: 0,
      ultimaResposta: { autor: "—", quando: "—" }, excerto: "",
    });
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Fórum"
        descricao="Tópicos da comunidade: fixar, bloquear, marcar resolvido ou remover."
        accoes={
          <button type="button" onClick={abrirNovo}
            className="h-10 bg-mb-red px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark">
            Novo tópico
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Estatistica rotulo="Tópicos" valor={contagem.total} />
        <Estatistica rotulo="Respostas" valor={contagem.respostas} />
        <Estatistica rotulo="Fixados" valor={contagem.fixados} tom="gold" />
        <Estatistica rotulo="Bloqueados" valor={contagem.bloqueados} tom={contagem.bloqueados ? "red" : "neutral"} />
      </div>

      <Painel titulo="Estado do fórum" className="mb-4">
        <Interruptor
          activo={estado.definicoes.forumAberto}
          etiqueta="Fórum aberto à comunidade"
          descricao="Quando desligado, deixa de ser possível criar tópicos e responder."
          onChange={(v) => { guardarDefinicoes({ forumAberto: v }); mostrar(v ? "Fórum aberto." : "Fórum fechado."); }}
        />
      </Painel>

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Título, autor ou excerto…" />
          <Seleccao valor={filtroCategoria} onChange={setFiltroCategoria} aria-label="Categoria"
            opcoes={[{ valor: "", nome: "Todas as categorias" }, ...categorias]}
            className="w-auto min-w-[180px]" />
        </Ferramentas>

        <Tabela cabecalhos={["Tópico", "Categoria", "Autor", "Respostas", "Sinalizações", "Ações"]} vazio={fatia.length === 0}>
          {fatia.map((t) => (
            <Linha key={t.id} onClick={() => { setNovo(false); setRascunho({ ...t }); }}>
              <Cel>
                <p className="truncate font-medium text-white">
                  {t.fixado && <span className="mr-1.5 text-gold" title="Fixado">📌</span>}
                  {t.titulo}
                </p>
                <p className="truncate text-xs text-ink-500">{formatDataCurta(t.criado)}</p>
              </Cel>
              <Cel className="text-ink-300">{t.categoria}</Cel>
              <Cel className="text-ink-400">{t.autor}</Cel>
              <Cel className="tabular-nums text-ink-300">{t.respostas}</Cel>
              <Cel>
                <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                  <button type="button"
                    onClick={() => { atualizar("topicos", t.id, { fixado: !t.fixado }); mostrar(t.fixado ? "Desafixado." : "Fixado."); }}
                    className={`border px-1.5 py-0.5 text-[10px] uppercase tracking-widest transition-colors ${
                      t.fixado ? "border-gold/40 bg-gold/15 text-gold" : "border-ink-700 text-ink-500 hover:text-white"
                    }`}>fixar</button>
                  <button type="button"
                    onClick={() => { atualizar("topicos", t.id, { bloqueado: !t.bloqueado }); mostrar(t.bloqueado ? "Desbloqueado." : "Bloqueado."); }}
                    className={`border px-1.5 py-0.5 text-[10px] uppercase tracking-widest transition-colors ${
                      t.bloqueado ? "border-mb-red/40 bg-mb-red/15 text-mb-red" : "border-ink-700 text-ink-500 hover:text-white"
                    }`}>bloquear</button>
                  <button type="button"
                    onClick={() => { atualizar("topicos", t.id, { resolvido: !t.resolvido }); mostrar(t.resolvido ? "Reaberto." : "Marcado resolvido."); }}
                    className={`border px-1.5 py-0.5 text-[10px] uppercase tracking-widest transition-colors ${
                      t.resolvido ? "border-ok/40 bg-ok/15 text-ok" : "border-ink-700 text-ink-500 hover:text-white"
                    }`}>resolvido</button>
                </div>
              </Cel>
              <Cel className="w-16">
                <AccaoIcone titulo="Apagar" tom="perigo" onClick={() => setAApagar(t)}>
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

      <Gaveta
        aberta={rascunho !== null}
        aoFechar={() => { setRascunho(null); setNovo(false); }}
        titulo={novo ? "Novo tópico" : "Editar tópico"}
        largura="max-w-xl"
        rodape={
          <>
            <button type="button" onClick={() => { setRascunho(null); setNovo(false); }}
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
        {rascunho && (
          <div className="space-y-4">
            <Campo etiqueta="Título" obrigatorio>
              <Input value={rascunho.titulo} onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })} />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Categoria">
                <Seleccao valor={rascunho.categoriaSlug} opcoes={categorias}
                  onChange={(v) => setRascunho({ ...rascunho, categoriaSlug: v })} />
              </Campo>
              <Campo etiqueta="Autor">
                <Input value={rascunho.autor} onChange={(e) => setRascunho({ ...rascunho, autor: e.target.value })} />
              </Campo>
              <Campo etiqueta="Respostas">
                <Input type="number" value={rascunho.respostas}
                  onChange={(e) => setRascunho({ ...rascunho, respostas: Number(e.target.value) })} />
              </Campo>
              <Campo etiqueta="Visualizações">
                <Input type="number" value={rascunho.visualizacoes}
                  onChange={(e) => setRascunho({ ...rascunho, visualizacoes: Number(e.target.value) })} />
              </Campo>
            </div>
            <Campo etiqueta="Excerto">
              <Area rows={3} value={rascunho.excerto}
                onChange={(e) => setRascunho({ ...rascunho, excerto: e.target.value })} />
            </Campo>
            <div className="space-y-2">
              <Interruptor activo={!!rascunho.fixado} etiqueta="Fixado no topo"
                onChange={(v) => setRascunho({ ...rascunho, fixado: v })} />
              <Interruptor activo={!!rascunho.bloqueado} etiqueta="Bloqueado a novas respostas"
                onChange={(v) => setRascunho({ ...rascunho, bloqueado: v })} />
              <Interruptor activo={!!rascunho.resolvido} etiqueta="Marcado como resolvido"
                onChange={(v) => setRascunho({ ...rascunho, resolvido: v })} />
            </div>
          </div>
        )}
      </Gaveta>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={() => { if (aApagar) { remover("topicos", aApagar.id); mostrar("Tópico removido."); } }}
        titulo="Apagar tópico"
        mensagem="O tópico e as suas respostas deixam de estar visíveis no fórum."
        textoConfirmar="Apagar"
        perigo
      />

      {elemento}
    </>
  );
}
