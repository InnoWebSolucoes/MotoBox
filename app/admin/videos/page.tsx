"use client";

import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, Input, Area, Seleccao } from "@/components/admin/kit";
import { slugify, useAdmin } from "@/lib/admin/store";
import { formatDataCurta } from "@/lib/data";
import type { Video } from "@/lib/types";

const CATEGORIAS = ["Highlights", "Entrevista", "Documentário", "Onboard", "Resumo"];
const op = (v: string[]) => v.map((x) => ({ valor: x, nome: x }));

export default function AdminVideos() {
  const { estado } = useAdmin();
  const eventos = estado.eventos.map((e) => ({ valor: e.titulo, nome: e.titulo }));

  return (
    <PaginaRecurso<Video>
      coleccao="videos"
      titulo="Vídeos"
      descricao="Highlights, entrevistas e cobertura em vídeo."
      procuraEm={(v) => `${v.titulo} ${v.descricao} ${v.categoria} ${v.evento ?? ""}`}
      ordenar={(a, b) => b.data.localeCompare(a.data)}
      filtros={[{ chave: "categoria", etiqueta: "Categoria", opcoes: op(CATEGORIAS) }]}
      colunas={[
        {
          cabecalho: "Vídeo",
          celula: (v) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{v.titulo}</p>
              <p className="truncate text-xs text-ink-500">{v.evento ?? "Sem evento associado"}</p>
            </div>
          ),
        },
        { cabecalho: "Categoria", celula: (v) => <span className="text-ink-300">{v.categoria}</span> },
        { cabecalho: "Duração", celula: (v) => <span className="tabular-nums text-ink-400">{v.duracao}</span> },
        { cabecalho: "Data", celula: (v) => <span className="tabular-nums text-ink-400">{formatDataCurta(v.data)}</span> },
        { cabecalho: "Visualizações", celula: (v) => <span className="tabular-nums text-ink-300">{v.visualizacoes.toLocaleString("pt-PT")}</span> },
      ]}
      novoRegisto={() => ({
        slug: "", titulo: "", descricao: "", duracao: "0:00",
        data: new Date().toISOString().slice(0, 10), thumbnail: "",
        categoria: "Highlights", visualizacoes: 0,
      }) as Video}
      formulario={(r, definir) => (
        <>
          <Campo etiqueta="Título" obrigatorio>
            <Input value={r.titulo}
              onChange={(e) => definir({ titulo: e.target.value, slug: r.slug || slugify(e.target.value) } as Partial<Video>)} />
          </Campo>
          <Campo etiqueta="Slug" obrigatorio>
            <Input value={r.slug} onChange={(e) => definir({ slug: slugify(e.target.value) } as Partial<Video>)} />
          </Campo>
          <Campo etiqueta="Descrição">
            <Area rows={3} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value } as Partial<Video>)} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Categoria">
              <Seleccao valor={r.categoria} opcoes={op(CATEGORIAS)}
                onChange={(v) => definir({ categoria: v } as unknown as Partial<Video>)} />
            </Campo>
            <Campo etiqueta="Duração" ajuda="Formato m:ss">
              <Input value={r.duracao} onChange={(e) => definir({ duracao: e.target.value } as Partial<Video>)} />
            </Campo>
            <Campo etiqueta="Data">
              <Input type="date" value={r.data.slice(0, 10)} onChange={(e) => definir({ data: e.target.value } as Partial<Video>)} />
            </Campo>
            <Campo etiqueta="Visualizações">
              <Input type="number" value={r.visualizacoes} onChange={(e) => definir({ visualizacoes: Number(e.target.value) } as Partial<Video>)} />
            </Campo>
          </div>
          <Campo etiqueta="Evento associado">
            <Seleccao valor={r.evento ?? ""} opcoes={[{ valor: "", nome: "Nenhum" }, ...eventos]}
              onChange={(v) => definir({ evento: v || undefined } as Partial<Video>)} />
          </Campo>
        </>
      )}
    />
  );
}
