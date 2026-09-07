"use client";

import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, Input, Area, Seleccao, ListaTexto } from "@/components/admin/kit";
import { slugify, useAdmin } from "@/lib/admin/store";
import type { Equipa } from "@/lib/types";

const PROVINCIAS = ["Luanda", "Benguela", "Huíla", "Huambo", "Namibe", "Cabinda", "Malanje", "Bengo", "Cuanza Sul"];
const op = (v: string[]) => v.map((x) => ({ valor: x, nome: x }));

export default function AdminEquipas() {
  const { estado } = useAdmin();

  return (
    <PaginaRecurso<Equipa>
      coleccao="equipas"
      titulo="Equipas"
      descricao="Equipas e clubes, com base, pilotos e palmarés."
      procuraEm={(e) => `${e.nome} ${e.base} ${e.chefe} ${e.provincia}`}
      ordenar={(a, b) => b.estatisticas.pontos - a.estatisticas.pontos}
      filtros={[
        { chave: "tipo", etiqueta: "Tipo", opcoes: op(["Equipa", "Clube"]) },
        { chave: "provincia", etiqueta: "Província", opcoes: op(PROVINCIAS) },
      ]}
      colunas={[
        {
          cabecalho: "Equipa",
          celula: (e) => (
            <div className="flex items-center gap-2.5">
              <span className="size-8 shrink-0 border border-ink-700" style={{ background: e.cor }} />
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{e.nome}</p>
                <p className="truncate text-xs text-ink-500">{e.base}, {e.provincia}</p>
              </div>
            </div>
          ),
        },
        { cabecalho: "Tipo", celula: (e) => <span className="text-ink-300">{e.tipo}</span> },
        { cabecalho: "Chefe", celula: (e) => <span className="text-ink-400">{e.chefe}</span> },
        { cabecalho: "Pilotos", celula: (e) => <span className="tabular-nums text-ink-300">{e.pilotos.length}</span> },
        { cabecalho: "Pontos", celula: (e) => <span className="font-display tabular-nums text-white">{e.estatisticas.pontos}</span> },
        { cabecalho: "Títulos", celula: (e) => <span className="tabular-nums text-gold">{e.estatisticas.titulos}</span> },
      ]}
      novoRegisto={() => ({
        slug: "", nome: "", tipo: "Equipa", base: "", provincia: "Luanda",
        fundacao: 2020, logo: "", cor: "#e10600", chefe: "", membros: 0,
        pilotos: [], descricao: "", motas: [],
        estatisticas: { pontos: 0, vitorias: 0, podios: 0, titulos: 0 },
        redes: {},
      }) as Equipa}
      formulario={(r, definir) => {
        const stat = (campos: Partial<Equipa["estatisticas"]>) =>
          definir({ estatisticas: { ...r.estatisticas, ...campos } } as Partial<Equipa>);
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nome" obrigatorio>
                <Input value={r.nome}
                  onChange={(e) => definir({ nome: e.target.value, slug: r.slug || slugify(e.target.value) } as Partial<Equipa>)} />
              </Campo>
              <Campo etiqueta="Slug" obrigatorio>
                <Input value={r.slug} onChange={(e) => definir({ slug: slugify(e.target.value) } as Partial<Equipa>)} />
              </Campo>
              <Campo etiqueta="Tipo">
                <Seleccao valor={r.tipo} opcoes={op(["Equipa", "Clube"])}
                  onChange={(v) => definir({ tipo: v } as unknown as Partial<Equipa>)} />
              </Campo>
              <Campo etiqueta="Província">
                <Seleccao valor={r.provincia} opcoes={op(PROVINCIAS)}
                  onChange={(v) => definir({ provincia: v } as unknown as Partial<Equipa>)} />
              </Campo>
              <Campo etiqueta="Base">
                <Input value={r.base} onChange={(e) => definir({ base: e.target.value } as Partial<Equipa>)} />
              </Campo>
              <Campo etiqueta="Chefe de equipa">
                <Input value={r.chefe} onChange={(e) => definir({ chefe: e.target.value } as Partial<Equipa>)} />
              </Campo>
              <Campo etiqueta="Ano de fundação">
                <Input type="number" value={r.fundacao} onChange={(e) => definir({ fundacao: Number(e.target.value) } as Partial<Equipa>)} />
              </Campo>
              <Campo etiqueta="Membros">
                <Input type="number" value={r.membros} onChange={(e) => definir({ membros: Number(e.target.value) } as Partial<Equipa>)} />
              </Campo>
              <Campo etiqueta="Cor da equipa" ajuda="Usada nos cartões e gráficos.">
                <div className="flex gap-2">
                  <input type="color" value={r.cor} aria-label="Cor"
                    onChange={(e) => definir({ cor: e.target.value } as Partial<Equipa>)}
                    className="h-10 w-14 border border-ink-700 bg-ink-950" />
                  <Input value={r.cor} onChange={(e) => definir({ cor: e.target.value } as Partial<Equipa>)} />
                </div>
              </Campo>
            </div>

            <Campo etiqueta="Descrição">
              <Area rows={4} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value } as Partial<Equipa>)} />
            </Campo>

            <ListaTexto etiqueta="Motas" valores={r.motas} placeholder="Ex.: KTM 450 SX-F"
              onChange={(v) => definir({ motas: v } as Partial<Equipa>)} />

            <div>
              <span className="mb-1.5 block text-[11px] font-display uppercase tracking-widest text-ink-300">Pilotos</span>
              <div className="max-h-48 space-y-1 overflow-y-auto border border-ink-700 p-2">
                {estado.pilotos.map((p) => (
                  <label key={p.slug} className="flex items-center gap-2 px-1 py-1 text-sm text-ink-200">
                    <input
                      type="checkbox"
                      checked={r.pilotos.includes(p.slug)}
                      onChange={(e) => definir({
                        pilotos: e.target.checked
                          ? [...r.pilotos, p.slug]
                          : r.pilotos.filter((x) => x !== p.slug),
                      } as Partial<Equipa>)}
                    />
                    <span className="tabular-nums text-ink-500">#{p.numero}</span>
                    {p.nome}
                  </label>
                ))}
              </div>
            </div>

            <div className="border border-ink-700/60 p-3">
              <p className="mb-3 text-[11px] font-display uppercase tracking-widest text-ink-300">Palmarés</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Campo etiqueta="Pontos">
                  <Input type="number" value={r.estatisticas.pontos} onChange={(e) => stat({ pontos: Number(e.target.value) })} />
                </Campo>
                <Campo etiqueta="Vitórias">
                  <Input type="number" value={r.estatisticas.vitorias} onChange={(e) => stat({ vitorias: Number(e.target.value) })} />
                </Campo>
                <Campo etiqueta="Pódios">
                  <Input type="number" value={r.estatisticas.podios} onChange={(e) => stat({ podios: Number(e.target.value) })} />
                </Campo>
                <Campo etiqueta="Títulos">
                  <Input type="number" value={r.estatisticas.titulos} onChange={(e) => stat({ titulos: Number(e.target.value) })} />
                </Campo>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Instagram">
                <Input value={r.redes.instagram ?? ""}
                  onChange={(e) => definir({ redes: { ...r.redes, instagram: e.target.value } } as Partial<Equipa>)} />
              </Campo>
              <Campo etiqueta="Facebook">
                <Input value={r.redes.facebook ?? ""}
                  onChange={(e) => definir({ redes: { ...r.redes, facebook: e.target.value } } as Partial<Equipa>)} />
              </Campo>
            </div>
          </>
        );
      }}
    />
  );
}
