"use client";

import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, Input, Area, Seleccao, Interruptor } from "@/components/admin/kit";
import { novoId } from "@/lib/admin/store";
import { formatKz, formatDataCurta } from "@/lib/data";
import type { AnuncioMarketplace } from "@/lib/types";

const CATEGORIAS = ["Motas", "Peças", "Equipamento", "Acessórios"];
const ESTADOS_ARTIGO = ["Nova", "Como nova", "Muito bom", "Bom", "Para peças"];
const PROVINCIAS = ["Luanda", "Benguela", "Huíla", "Huambo", "Namibe", "Cabinda", "Malanje", "Bengo", "Cuanza Sul"];
const op = (v: string[]) => v.map((x) => ({ valor: x, nome: x }));

export default function AdminMarketplace() {
  return (
    <PaginaRecurso<AnuncioMarketplace>
      coleccao="anuncios"
      titulo="Marketplace"
      descricao="Anúncios de motas, peças e equipamento; verificação de vendedores."
      procuraEm={(a) => `${a.titulo} ${a.marca} ${a.modelo ?? ""} ${a.vendedor.nome} ${a.descricao}`}
      ordenar={(a, b) => b.publicado.localeCompare(a.publicado)}
      filtros={[
        { chave: "categoria", etiqueta: "Categoria", opcoes: op(CATEGORIAS) },
        { chave: "provincia", etiqueta: "Província", opcoes: op(PROVINCIAS) },
        { chave: "estado", etiqueta: "Estado", opcoes: op(ESTADOS_ARTIGO) },
      ]}
      colunas={[
        {
          cabecalho: "Anúncio",
          celula: (a) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{a.titulo}</p>
              <p className="truncate text-xs text-ink-500">{a.marca} {a.modelo ?? ""}</p>
            </div>
          ),
        },
        { cabecalho: "Categoria", celula: (a) => <span className="text-ink-300">{a.categoria}</span> },
        { cabecalho: "Preço", celula: (a) => <span className="font-display tabular-nums text-white">{formatKz(a.preco)}</span> },
        { cabecalho: "Estado", celula: (a) => <span className="text-ink-400">{a.estado}</span> },
        {
          cabecalho: "Vendedor",
          celula: (a) => (
            <span className="text-ink-300">
              {a.vendedor.nome}
              {a.vendedor.verificado && <span className="ml-1.5 text-ok" title="Verificado">✓</span>}
            </span>
          ),
        },
        { cabecalho: "Publicado", celula: (a) => <span className="tabular-nums text-ink-400">{formatDataCurta(a.publicado)}</span> },
      ]}
      novoRegisto={() => ({
        id: novoId("mkt"), titulo: "", categoria: "Motas", preco: 0, negociavel: false,
        marca: "", estado: "Bom", provincia: "Luanda", descricao: "", imagens: [],
        vendedor: { nome: "", verificado: false, desde: new Date().getFullYear(), anuncios: 1, avaliacao: 5 },
        publicado: new Date().toISOString().slice(0, 10), visualizacoes: 0,
      }) as AnuncioMarketplace}
      formulario={(r, definir) => (
        <>
          <Campo etiqueta="Título" obrigatorio>
            <Input value={r.titulo} onChange={(e) => definir({ titulo: e.target.value } as Partial<AnuncioMarketplace>)} />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Categoria">
              <Seleccao valor={r.categoria} opcoes={op(CATEGORIAS)}
                onChange={(v) => definir({ categoria: v } as unknown as Partial<AnuncioMarketplace>)} />
            </Campo>
            <Campo etiqueta="Estado do artigo">
              <Seleccao valor={r.estado} opcoes={op(ESTADOS_ARTIGO)}
                onChange={(v) => definir({ estado: v } as unknown as Partial<AnuncioMarketplace>)} />
            </Campo>
            <Campo etiqueta="Preço (Kz)">
              <Input type="number" value={r.preco} onChange={(e) => definir({ preco: Number(e.target.value) } as Partial<AnuncioMarketplace>)} />
            </Campo>
            <Campo etiqueta="Província">
              <Seleccao valor={r.provincia} opcoes={op(PROVINCIAS)}
                onChange={(v) => definir({ provincia: v } as unknown as Partial<AnuncioMarketplace>)} />
            </Campo>
            <Campo etiqueta="Marca">
              <Input value={r.marca} onChange={(e) => definir({ marca: e.target.value } as Partial<AnuncioMarketplace>)} />
            </Campo>
            <Campo etiqueta="Modelo">
              <Input value={r.modelo ?? ""} onChange={(e) => definir({ modelo: e.target.value } as Partial<AnuncioMarketplace>)} />
            </Campo>
            <Campo etiqueta="Ano">
              <Input type="number" value={r.ano ?? ""} onChange={(e) => definir({ ano: e.target.value ? Number(e.target.value) : undefined } as Partial<AnuncioMarketplace>)} />
            </Campo>
            <Campo etiqueta="Quilometragem">
              <Input type="number" value={r.quilometragem ?? ""} onChange={(e) => definir({ quilometragem: e.target.value ? Number(e.target.value) : undefined } as Partial<AnuncioMarketplace>)} />
            </Campo>
          </div>

          <Interruptor activo={r.negociavel} etiqueta="Preço negociável"
            onChange={(v) => definir({ negociavel: v } as Partial<AnuncioMarketplace>)} />

          <Campo etiqueta="Descrição">
            <Area rows={4} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value } as Partial<AnuncioMarketplace>)} />
          </Campo>

          <div className="border border-ink-700/60 p-3">
            <p className="mb-3 text-[11px] font-display uppercase tracking-widest text-ink-300">Vendedor</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo etiqueta="Nome">
                <Input value={r.vendedor.nome}
                  onChange={(e) => definir({ vendedor: { ...r.vendedor, nome: e.target.value } } as Partial<AnuncioMarketplace>)} />
              </Campo>
              <Campo etiqueta="Membro desde">
                <Input type="number" value={r.vendedor.desde}
                  onChange={(e) => definir({ vendedor: { ...r.vendedor, desde: Number(e.target.value) } } as Partial<AnuncioMarketplace>)} />
              </Campo>
              <Campo etiqueta="Anúncios">
                <Input type="number" value={r.vendedor.anuncios}
                  onChange={(e) => definir({ vendedor: { ...r.vendedor, anuncios: Number(e.target.value) } } as Partial<AnuncioMarketplace>)} />
              </Campo>
              <Campo etiqueta="Avaliação (0-5)">
                <Input type="number" step={0.1} min={0} max={5} value={r.vendedor.avaliacao}
                  onChange={(e) => definir({ vendedor: { ...r.vendedor, avaliacao: Number(e.target.value) } } as Partial<AnuncioMarketplace>)} />
              </Campo>
            </div>
            <div className="mt-3">
              <Interruptor activo={r.vendedor.verificado} etiqueta="Vendedor verificado"
                descricao="Identidade confirmada pela equipa Motobox."
                onChange={(v) => definir({ vendedor: { ...r.vendedor, verificado: v } } as Partial<AnuncioMarketplace>)} />
            </div>
          </div>
        </>
      )}
    />
  );
}
