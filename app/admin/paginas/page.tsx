"use client";

import { useState } from "react";
import { useAdmin, slugify } from "@/lib/admin/store";
import { formatDataCurta } from "@/lib/data";
import {
  CabecalhoPagina, Painel, Campo, Input, Area, Estado, Interruptor,
  useAviso, Confirmar,
} from "@/components/admin/kit";
import type { PaginaLegal } from "@/lib/admin/types";

export default function AdminPaginas() {
  const { estado, criar, atualizar, remover } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const [activa, setActiva] = useState<string>(estado.paginasLegais[0]?.slug ?? "");
  const [aApagar, setAApagar] = useState<PaginaLegal | null>(null);

  const pagina = estado.paginasLegais.find((p) => p.slug === activa);

  const definir = (campos: Partial<PaginaLegal>) => {
    if (!pagina) return;
    atualizar("paginasLegais", pagina.slug, {
      ...campos,
      atualizado: new Date().toISOString().slice(0, 10),
    });
  };

  const novaPagina = () => {
    const slug = `pagina-${Date.now().toString(36).slice(-4)}`;
    criar("paginasLegais", {
      slug, titulo: "Nova página", descricao: "",
      atualizado: new Date().toISOString().slice(0, 10),
      publicado: false,
      seccoes: [{ titulo: "1. Secção", corpo: ["Texto da secção."] }],
    } as unknown as Record<string, unknown>);
    setActiva(slug);
    mostrar("Página criada.");
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Páginas legais"
        descricao="Termos e condições, privacidade, cookies e regulamento da comunidade."
        accoes={
          <button type="button" onClick={novaPagina}
            className="h-10 bg-mb-red px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark">
            Nova página
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Lista de páginas */}
        <nav className="border border-ink-700/60 bg-ink-900">
          <ul>
            {estado.paginasLegais.map((p) => (
              <li key={p.slug}>
                <button type="button" onClick={() => setActiva(p.slug)}
                  className={`flex w-full items-center gap-2 border-l-2 px-3 py-2.5 text-left text-sm transition-colors ${
                    p.slug === activa
                      ? "border-mb-red bg-mb-red/10 text-white"
                      : "border-transparent text-ink-300 hover:bg-ink-850 hover:text-white"
                  }`}>
                  <span className="min-w-0 flex-1 truncate">{p.titulo}</span>
                  <span className={`size-1.5 shrink-0 rounded-full ${p.publicado ? "bg-ok" : "bg-ink-600"}`}
                    title={p.publicado ? "Publicada" : "Rascunho"} />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Editor */}
        {pagina ? (
          <div className="space-y-4">
            <Painel
              titulo={pagina.titulo}
              descricao={`/${pagina.slug} · atualizada em ${formatDataCurta(pagina.atualizado)}`}
              accoes={
                <>
                  <a href={`/${pagina.slug}`} target="_blank" rel="noreferrer"
                    className="border border-ink-600 px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-white transition-colors hover:border-mb-red">
                    Pré-visualizar
                  </a>
                  <button type="button" onClick={() => setAApagar(pagina)}
                    className="border border-ink-700 px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-ink-400 transition-colors hover:border-mb-red hover:text-white">
                    Apagar
                  </button>
                </>
              }
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo etiqueta="Título">
                    <Input value={pagina.titulo} onChange={(e) => definir({ titulo: e.target.value })} />
                  </Campo>
                  <Campo etiqueta="Slug (URL)">
                    <Input value={pagina.slug} disabled />
                  </Campo>
                </div>
                <Campo etiqueta="Descrição" ajuda="Usada nos metadados e no cabeçalho da página.">
                  <Area rows={2} value={pagina.descricao} onChange={(e) => definir({ descricao: e.target.value })} />
                </Campo>
                <Interruptor
                  activo={pagina.publicado}
                  etiqueta="Página publicada"
                  descricao="Quando desligada, a página deixa de estar acessível no site público."
                  onChange={(v) => { definir({ publicado: v }); mostrar(v ? "Página publicada." : "Página despublicada."); }}
                />
              </div>
            </Painel>

            <Painel titulo="Secções" descricao="Cada secção é um bloco com título e parágrafos.">
              <div className="space-y-4">
                {pagina.seccoes.map((s, i) => (
                  <div key={i} className="border border-ink-700 bg-ink-950 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Input value={s.titulo} aria-label={`Título da secção ${i + 1}`}
                        onChange={(e) => definir({
                          seccoes: pagina.seccoes.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x),
                        })} />
                      <button type="button" aria-label="Mover para cima" disabled={i === 0}
                        onClick={() => {
                          const l = [...pagina.seccoes];
                          [l[i - 1], l[i]] = [l[i], l[i - 1]];
                          definir({ seccoes: l });
                        }}
                        className="border border-ink-700 px-2 py-2 text-ink-400 transition-colors hover:text-white disabled:opacity-30">↑</button>
                      <button type="button" aria-label="Mover para baixo" disabled={i === pagina.seccoes.length - 1}
                        onClick={() => {
                          const l = [...pagina.seccoes];
                          [l[i], l[i + 1]] = [l[i + 1], l[i]];
                          definir({ seccoes: l });
                        }}
                        className="border border-ink-700 px-2 py-2 text-ink-400 transition-colors hover:text-white disabled:opacity-30">↓</button>
                      <button type="button" aria-label="Remover secção"
                        onClick={() => definir({ seccoes: pagina.seccoes.filter((_, j) => j !== i) })}
                        className="border border-ink-700 px-2 py-2 text-ink-400 transition-colors hover:border-mb-red hover:text-white">×</button>
                    </div>
                    <Area rows={4} value={s.corpo.join("\n\n")}
                      aria-label={`Corpo da secção ${i + 1}`}
                      placeholder="Um parágrafo por linha em branco."
                      onChange={(e) => definir({
                        seccoes: pagina.seccoes.map((x, j) => j === i ? { ...x, corpo: e.target.value.split(/\n\s*\n/) } : x),
                      })} />
                  </div>
                ))}
                <button type="button"
                  onClick={() => definir({ seccoes: [...pagina.seccoes, { titulo: `${pagina.seccoes.length + 1}. Nova secção`, corpo: [""] }] })}
                  className="border border-ink-600 px-4 py-2 font-display text-[11px] uppercase tracking-wider text-white transition-colors hover:border-mb-red">
                  Juntar secção
                </button>
              </div>
            </Painel>
          </div>
        ) : (
          <Painel><p className="py-10 text-center text-sm text-ink-500">Selecione uma página.</p></Painel>
        )}
      </div>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={() => {
          if (aApagar) {
            remover("paginasLegais", aApagar.slug);
            setActiva(estado.paginasLegais.find((p) => p.slug !== aApagar.slug)?.slug ?? "");
            mostrar("Página apagada.");
          }
        }}
        titulo="Apagar página"
        mensagem="A página legal será removida e deixará de estar acessível no site."
        textoConfirmar="Apagar"
        perigo
      />

      {elemento}
    </>
  );
}
