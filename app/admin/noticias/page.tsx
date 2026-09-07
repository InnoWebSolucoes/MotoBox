"use client";

import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, Input, Area, Seleccao, ListaTexto } from "@/components/admin/kit";
import { slugify } from "@/lib/admin/store";
import { formatDataCurta } from "@/lib/data";
import type { Noticia } from "@/lib/types";

const CATEGORIAS = ["Angola", "Internacional", "Comunidade", "Entrevista", "Solidária"];
const op = (v: string[]) => v.map((x) => ({ valor: x, nome: x }));

export default function AdminNoticias() {
  return (
    <PaginaRecurso<Noticia>
      coleccao="noticias"
      titulo="Notícias"
      descricao="Artigos editoriais, entrevistas e agregação internacional."
      procuraEm={(n) => `${n.titulo} ${n.resumo} ${n.autor} ${n.tags.join(" ")}`}
      ordenar={(a, b) => b.data.localeCompare(a.data)}
      filtros={[{ chave: "categoria", etiqueta: "Categoria", opcoes: op(CATEGORIAS) }]}
      colunas={[
        {
          cabecalho: "Artigo",
          celula: (n) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-white">
                {n.destaque && <span className="mr-1.5 text-mb-red">★</span>}
                {n.titulo}
              </p>
              <p className="truncate text-xs text-ink-500">{n.resumo}</p>
            </div>
          ),
        },
        { cabecalho: "Categoria", celula: (n) => <span className="text-ink-300">{n.categoria}</span> },
        { cabecalho: "Autor", celula: (n) => <span className="text-ink-400">{n.autor}</span> },
        { cabecalho: "Data", celula: (n) => <span className="tabular-nums text-ink-400">{formatDataCurta(n.data)}</span> },
        { cabecalho: "Leitura", celula: (n) => <span className="tabular-nums text-ink-500">{n.leitura} min</span> },
      ]}
      novoRegisto={() => ({
        slug: "", titulo: "", resumo: "", corpo: [""], categoria: "Angola",
        tags: [], autor: "Redação Motobox", data: new Date().toISOString().slice(0, 10),
        imagem: "", leitura: 3, destaque: false,
      }) as Noticia}
      formulario={(r, definir) => (
        <>
          <Campo etiqueta="Título" obrigatorio>
            <Input value={r.titulo}
              onChange={(e) => definir({ titulo: e.target.value, slug: r.slug || slugify(e.target.value) } as Partial<Noticia>)} />
          </Campo>
          <Campo etiqueta="Slug" obrigatorio>
            <Input value={r.slug} onChange={(e) => definir({ slug: slugify(e.target.value) } as Partial<Noticia>)} />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Categoria">
              <Seleccao valor={r.categoria} opcoes={op(CATEGORIAS)}
                onChange={(v) => definir({ categoria: v } as unknown as Partial<Noticia>)} />
            </Campo>
            <Campo etiqueta="Autor">
              <Input value={r.autor} onChange={(e) => definir({ autor: e.target.value } as Partial<Noticia>)} />
            </Campo>
            <Campo etiqueta="Data">
              <Input type="date" value={r.data.slice(0, 10)} onChange={(e) => definir({ data: e.target.value } as Partial<Noticia>)} />
            </Campo>
            <Campo etiqueta="Tempo de leitura (min)">
              <Input type="number" value={r.leitura} onChange={(e) => definir({ leitura: Number(e.target.value) } as Partial<Noticia>)} />
            </Campo>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-200">
            <input type="checkbox" checked={!!r.destaque}
              onChange={(e) => definir({ destaque: e.target.checked } as Partial<Noticia>)} />
            Artigo em destaque na página inicial
          </label>

          <Campo etiqueta="Resumo" ajuda="Aparece nos cartões e nas partilhas.">
            <Area rows={2} value={r.resumo} onChange={(e) => definir({ resumo: e.target.value } as Partial<Noticia>)} />
          </Campo>

          <Campo etiqueta="Corpo do artigo" ajuda="Um parágrafo por linha em branco.">
            <Area rows={12} value={r.corpo.join("\n\n")}
              onChange={(e) => definir({ corpo: e.target.value.split(/\n\s*\n/) } as Partial<Noticia>)} />
          </Campo>

          <ListaTexto etiqueta="Etiquetas" valores={r.tags} placeholder="Ex.: Motocross"
            onChange={(v) => definir({ tags: v } as Partial<Noticia>)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Fonte" ajuda="Para notícias internacionais.">
              <Input value={r.fonte ?? ""} onChange={(e) => definir({ fonte: e.target.value } as Partial<Noticia>)} />
            </Campo>
            <Campo etiqueta="Ligação da fonte">
              <Input value={r.fonteUrl ?? ""} onChange={(e) => definir({ fonteUrl: e.target.value } as Partial<Noticia>)} />
            </Campo>
          </div>
        </>
      )}
    />
  );
}
