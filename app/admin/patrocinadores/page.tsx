"use client";

import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, Input, Area, Seleccao } from "@/components/admin/kit";
import { slugify } from "@/lib/admin/store";
import type { Patrocinador } from "@/lib/types";

const NIVEIS = ["Principal", "Oficial", "Apoio", "Media"];
const op = (v: string[]) => v.map((x) => ({ valor: x, nome: x }));

const TOM_NIVEL: Record<string, string> = {
  Principal: "text-mb-red",
  Oficial: "text-gold",
  Apoio: "text-ink-200",
  Media: "text-ink-400",
};

export default function AdminPatrocinadores() {
  return (
    <PaginaRecurso<Patrocinador>
      coleccao="patrocinadores"
      titulo="Patrocinadores"
      descricao="Marcas parceiras por nível de patrocínio."
      procuraEm={(p) => `${p.nome} ${p.setor} ${p.descricao}`}
      ordenar={(a, b) => NIVEIS.indexOf(a.nivel) - NIVEIS.indexOf(b.nivel)}
      filtros={[{ chave: "nivel", etiqueta: "Nível", opcoes: op(NIVEIS) }]}
      colunas={[
        {
          cabecalho: "Marca",
          celula: (p) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{p.nome}</p>
              <p className="truncate text-xs text-ink-500">{p.setor}</p>
            </div>
          ),
        },
        {
          cabecalho: "Nível",
          celula: (p) => (
            <span className={`font-display text-xs uppercase tracking-wider ${TOM_NIVEL[p.nivel] ?? "text-ink-300"}`}>
              {p.nivel}
            </span>
          ),
        },
        { cabecalho: "Desde", celula: (p) => <span className="tabular-nums text-ink-400">{p.desde}</span> },
        {
          cabecalho: "Website",
          celula: (p) => (
            <span className="truncate text-xs text-ink-400">{p.website || "—"}</span>
          ),
        },
      ]}
      novoRegisto={() => ({
        slug: "", nome: "", nivel: "Apoio", setor: "", descricao: "",
        logo: "", website: "", desde: new Date().getFullYear(),
      }) as Patrocinador}
      formulario={(r, definir) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nome" obrigatorio>
              <Input value={r.nome}
                onChange={(e) => definir({ nome: e.target.value, slug: r.slug || slugify(e.target.value) } as Partial<Patrocinador>)} />
            </Campo>
            <Campo etiqueta="Slug" obrigatorio>
              <Input value={r.slug} onChange={(e) => definir({ slug: slugify(e.target.value) } as Partial<Patrocinador>)} />
            </Campo>
            <Campo etiqueta="Nível">
              <Seleccao valor={r.nivel} opcoes={op(NIVEIS)}
                onChange={(v) => definir({ nivel: v } as unknown as Partial<Patrocinador>)} />
            </Campo>
            <Campo etiqueta="Setor">
              <Input value={r.setor} onChange={(e) => definir({ setor: e.target.value } as Partial<Patrocinador>)} />
            </Campo>
            <Campo etiqueta="Parceiro desde">
              <Input type="number" value={r.desde} onChange={(e) => definir({ desde: Number(e.target.value) } as Partial<Patrocinador>)} />
            </Campo>
            <Campo etiqueta="Website">
              <Input value={r.website} placeholder="https://" onChange={(e) => definir({ website: e.target.value } as Partial<Patrocinador>)} />
            </Campo>
          </div>
          <Campo etiqueta="Descrição">
            <Area rows={4} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value } as Partial<Patrocinador>)} />
          </Campo>
        </>
      )}
    />
  );
}
