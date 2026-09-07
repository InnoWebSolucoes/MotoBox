"use client";

import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, Input, Seleccao } from "@/components/admin/kit";
import { slugify, useAdmin } from "@/lib/admin/store";
import { formatDataCurta } from "@/lib/data";
import type { Corrida, ResultadoCorrida } from "@/lib/types";

const PROVINCIAS = ["Luanda", "Benguela", "Huíla", "Huambo", "Namibe", "Cabinda", "Malanje", "Bengo", "Cuanza Sul"];
const op = (v: string[]) => v.map((x) => ({ valor: x, nome: x }));

export default function AdminCorridas() {
  const { estado } = useAdmin();
  const eventos = estado.eventos.map((e) => ({ valor: e.slug, nome: e.titulo }));
  const categorias = [...new Set(estado.corridas.map((c) => c.categoria))];

  return (
    <PaginaRecurso<Corrida>
      coleccao="corridas"
      titulo="Resultados"
      descricao="Arquivo de corridas com classificação, tempos e pontos."
      procuraEm={(c) => `${c.nome} ${c.circuito} ${c.vencedor} ${c.categoria}`}
      ordenar={(a, b) => b.data.localeCompare(a.data)}
      filtros={[
        { chave: "categoria", etiqueta: "Categoria", opcoes: op(categorias) },
        { chave: "provincia", etiqueta: "Província", opcoes: op(PROVINCIAS) },
      ]}
      colunas={[
        {
          cabecalho: "Corrida",
          celula: (c) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{c.nome}</p>
              <p className="truncate text-xs text-ink-500">{c.circuito}, {c.provincia}</p>
            </div>
          ),
        },
        { cabecalho: "Categoria", celula: (c) => <span className="text-ink-300">{c.categoria}</span> },
        { cabecalho: "Ronda", celula: (c) => <span className="tabular-nums text-ink-400">{c.ronda}</span> },
        { cabecalho: "Data", celula: (c) => <span className="tabular-nums text-ink-400">{formatDataCurta(c.data)}</span> },
        { cabecalho: "Vencedor", celula: (c) => <span className="text-gold">{c.vencedor}</span> },
        { cabecalho: "Classificados", celula: (c) => <span className="tabular-nums text-ink-300">{c.resultados.length}</span> },
      ]}
      novoRegisto={() => ({
        slug: "", eventoSlug: "", nome: "", ronda: 1, temporada: 2026,
        circuito: "", provincia: "Luanda", data: new Date().toISOString().slice(0, 10),
        categoria: "MX1", vencedor: "", imagem: "", resultados: [],
      }) as Corrida}
      formulario={(r, definir) => {
        const alterar = (i: number, campos: Partial<ResultadoCorrida>) =>
          definir({ resultados: r.resultados.map((x, j) => (j === i ? { ...x, ...campos } : x)) } as Partial<Corrida>);

        return (
          <>
            <Campo etiqueta="Nome da corrida" obrigatorio>
              <Input value={r.nome}
                onChange={(e) => definir({ nome: e.target.value, slug: r.slug || slugify(e.target.value) } as Partial<Corrida>)} />
            </Campo>
            <Campo etiqueta="Slug" obrigatorio>
              <Input value={r.slug} onChange={(e) => definir({ slug: slugify(e.target.value) } as Partial<Corrida>)} />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Evento">
                <Seleccao valor={r.eventoSlug} opcoes={[{ valor: "", nome: "Sem evento" }, ...eventos]}
                  onChange={(v) => {
                    const ev = estado.eventos.find((x) => x.slug === v);
                    definir({
                      eventoSlug: v,
                      circuito: ev?.circuito ?? r.circuito,
                      provincia: (ev?.provincia ?? r.provincia),
                    } as Partial<Corrida>);
                  }} />
              </Campo>
              <Campo etiqueta="Categoria">
                <Input value={r.categoria} onChange={(e) => definir({ categoria: e.target.value } as Partial<Corrida>)} />
              </Campo>
              <Campo etiqueta="Ronda">
                <Input type="number" value={r.ronda} onChange={(e) => definir({ ronda: Number(e.target.value) } as Partial<Corrida>)} />
              </Campo>
              <Campo etiqueta="Temporada">
                <Input type="number" value={r.temporada} onChange={(e) => definir({ temporada: Number(e.target.value) } as Partial<Corrida>)} />
              </Campo>
              <Campo etiqueta="Data">
                <Input type="date" value={r.data.slice(0, 10)} onChange={(e) => definir({ data: e.target.value } as Partial<Corrida>)} />
              </Campo>
              <Campo etiqueta="Circuito">
                <Input value={r.circuito} onChange={(e) => definir({ circuito: e.target.value } as Partial<Corrida>)} />
              </Campo>
              <Campo etiqueta="Província">
                <Seleccao valor={r.provincia} opcoes={op(PROVINCIAS)}
                  onChange={(v) => definir({ provincia: v } as unknown as Partial<Corrida>)} />
              </Campo>
              <Campo etiqueta="Vencedor">
                <Input value={r.vencedor} onChange={(e) => definir({ vencedor: e.target.value } as Partial<Corrida>)} />
              </Campo>
            </div>

            {/* Classificação */}
            <div className="border border-ink-700/60 p-3">
              <p className="mb-3 text-[11px] font-display uppercase tracking-widest text-ink-300">
                Classificação final
              </p>

              {r.resultados.length === 0 && (
                <p className="mb-3 text-xs text-ink-500">Sem classificados. Junte a primeira posição abaixo.</p>
              )}

              <div className="space-y-2">
                {r.resultados.map((res, i) => (
                  <div key={i} className="border border-ink-800 bg-ink-950 p-2.5">
                    <div className="mb-2 grid grid-cols-[50px_1fr_auto] gap-2">
                      <Input type="number" value={res.posicao} aria-label="Posição"
                        onChange={(e) => alterar(i, { posicao: Number(e.target.value) })} />
                      <Seleccao valor={res.pilotoSlug}
                        opcoes={[{ valor: "", nome: "Escolher piloto" }, ...estado.pilotos.map((p) => ({ valor: p.slug, nome: `#${p.numero} ${p.nome}` }))]}
                        onChange={(v) => {
                          const p = estado.pilotos.find((x) => x.slug === v);
                          alterar(i, { pilotoSlug: v, piloto: p?.nome ?? "", equipa: p?.equipa ?? "" });
                        }} />
                      <button type="button" aria-label="Remover posição"
                        onClick={() => definir({ resultados: r.resultados.filter((_, j) => j !== i) } as Partial<Corrida>)}
                        className="border border-ink-700 px-2 text-ink-400 transition-colors hover:border-mb-red hover:text-white">×</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Input placeholder="Tempo" value={res.tempo} aria-label="Tempo"
                        onChange={(e) => alterar(i, { tempo: e.target.value })} />
                      <Input type="number" placeholder="Voltas" value={res.voltas} aria-label="Voltas"
                        onChange={(e) => alterar(i, { voltas: Number(e.target.value) })} />
                      <Input type="number" placeholder="Pontos" value={res.pontos} aria-label="Pontos"
                        onChange={(e) => alterar(i, { pontos: Number(e.target.value) })} />
                      <Seleccao valor={res.estado ?? ""} aria-label="Estado"
                        opcoes={[{ valor: "", nome: "Classificado" }, { valor: "DNF", nome: "DNF" }, { valor: "DNS", nome: "DNS" }, { valor: "DSQ", nome: "DSQ" }]}
                        onChange={(v) => alterar(i, { estado: (v || undefined) as ResultadoCorrida["estado"] })} />
                    </div>
                    <label className="mt-2 flex items-center gap-2 text-xs text-ink-300">
                      <input type="checkbox" checked={!!res.melhorVolta}
                        onChange={(e) => alterar(i, { melhorVolta: e.target.checked })} />
                      Volta mais rápida
                    </label>
                  </div>
                ))}
              </div>

              <button type="button"
                onClick={() => definir({
                  resultados: [...r.resultados, {
                    posicao: r.resultados.length + 1, pilotoSlug: "", piloto: "", equipa: "",
                    voltas: 0, tempo: "", pontos: 0,
                  }],
                } as Partial<Corrida>)}
                className="mt-3 border border-ink-600 px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-white transition-colors hover:border-mb-red">
                Juntar posição
              </button>
            </div>
          </>
        );
      }}
    />
  );
}
