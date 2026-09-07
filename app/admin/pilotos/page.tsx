"use client";

import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, Input, Area, Seleccao } from "@/components/admin/kit";
import { slugify, useAdmin } from "@/lib/admin/store";
import type { Piloto } from "@/lib/types";

const PROVINCIAS = ["Luanda", "Benguela", "Huíla", "Huambo", "Namibe", "Cabinda", "Malanje", "Bengo", "Cuanza Sul"];
const op = (v: string[]) => v.map((x) => ({ valor: x, nome: x }));

export default function AdminPilotos() {
  const { estado } = useAdmin();
  const equipas = estado.equipas.map((e) => ({ valor: e.slug, nome: e.nome }));
  const categorias = [...new Set(estado.pilotos.map((p) => p.categoria))];

  return (
    <PaginaRecurso<Piloto>
      coleccao="pilotos"
      titulo="Pilotos"
      descricao="Perfis, números de competição, equipas e estatísticas."
      procuraEm={(p) => `${p.nome} ${p.apelido ?? ""} ${p.equipa} ${p.mota} ${p.categoria}`}
      ordenar={(a, b) => b.estatisticas.pontos - a.estatisticas.pontos}
      filtros={[
        { chave: "categoria", etiqueta: "Categoria", opcoes: op(categorias) },
        { chave: "provincia", etiqueta: "Província", opcoes: op(PROVINCIAS) },
        { chave: "equipaSlug", etiqueta: "Equipa", opcoes: equipas },
      ]}
      colunas={[
        {
          cabecalho: "Piloto",
          celula: (p) => (
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center bg-mb-red font-display text-xs text-white">
                {p.numero}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{p.nome}</p>
                <p className="truncate text-xs text-ink-500">{p.equipa}</p>
              </div>
            </div>
          ),
        },
        { cabecalho: "Categoria", celula: (p) => <span className="text-ink-300">{p.categoria}</span> },
        { cabecalho: "Província", celula: (p) => <span className="text-ink-400">{p.provincia}</span> },
        { cabecalho: "Pontos", celula: (p) => <span className="font-display tabular-nums text-white">{p.estatisticas.pontos}</span> },
        { cabecalho: "Vitórias", celula: (p) => <span className="tabular-nums text-ink-300">{p.estatisticas.vitorias}</span> },
        { cabecalho: "Pódios", celula: (p) => <span className="tabular-nums text-ink-400">{p.estatisticas.podios}</span> },
      ]}
      novoRegisto={() => ({
        slug: "", nome: "", numero: 0, equipa: "", equipaSlug: "",
        provincia: "Luanda", nacionalidade: "Angolana", idade: 20,
        mota: "", categoria: "MX1", foto: "", bio: "", estreia: 2026,
        estatisticas: { pontos: 0, vitorias: 0, podios: 0, poles: 0, corridas: 0, melhorResultado: "—" },
        redes: {}, campeonatos: 0,
      }) as Piloto}
      formulario={(r, definir) => {
        const stat = (campos: Partial<Piloto["estatisticas"]>) =>
          definir({ estatisticas: { ...r.estatisticas, ...campos } } as Partial<Piloto>);
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nome" obrigatorio>
                <Input value={r.nome}
                  onChange={(e) => definir({ nome: e.target.value, slug: r.slug || slugify(e.target.value) } as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Slug" obrigatorio>
                <Input value={r.slug} onChange={(e) => definir({ slug: slugify(e.target.value) } as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Alcunha">
                <Input value={r.apelido ?? ""} onChange={(e) => definir({ apelido: e.target.value } as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Número">
                <Input type="number" value={r.numero} onChange={(e) => definir({ numero: Number(e.target.value) } as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Equipa">
                <Seleccao valor={r.equipaSlug} opcoes={[{ valor: "", nome: "Sem equipa" }, ...equipas]}
                  onChange={(v) => {
                    const eq = estado.equipas.find((x) => x.slug === v);
                    definir({ equipaSlug: v, equipa: eq?.nome ?? "" } as Partial<Piloto>);
                  }} />
              </Campo>
              <Campo etiqueta="Categoria">
                <Input value={r.categoria} onChange={(e) => definir({ categoria: e.target.value } as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Província">
                <Seleccao valor={r.provincia} opcoes={op(PROVINCIAS)}
                  onChange={(v) => definir({ provincia: v } as unknown as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Nacionalidade">
                <Input value={r.nacionalidade} onChange={(e) => definir({ nacionalidade: e.target.value } as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Idade">
                <Input type="number" value={r.idade} onChange={(e) => definir({ idade: Number(e.target.value) } as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Mota">
                <Input value={r.mota} onChange={(e) => definir({ mota: e.target.value } as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Ano de estreia">
                <Input type="number" value={r.estreia} onChange={(e) => definir({ estreia: Number(e.target.value) } as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Campeonatos">
                <Input type="number" value={r.campeonatos} onChange={(e) => definir({ campeonatos: Number(e.target.value) } as Partial<Piloto>)} />
              </Campo>
            </div>

            <Campo etiqueta="Biografia">
              <Area rows={4} value={r.bio} onChange={(e) => definir({ bio: e.target.value } as Partial<Piloto>)} />
            </Campo>

            <div className="border border-ink-700/60 p-3">
              <p className="mb-3 text-[11px] font-display uppercase tracking-widest text-ink-300">Estatísticas</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Campo etiqueta="Pontos">
                  <Input type="number" value={r.estatisticas.pontos} onChange={(e) => stat({ pontos: Number(e.target.value) })} />
                </Campo>
                <Campo etiqueta="Vitórias">
                  <Input type="number" value={r.estatisticas.vitorias} onChange={(e) => stat({ vitorias: Number(e.target.value) })} />
                </Campo>
                <Campo etiqueta="Pódios">
                  <Input type="number" value={r.estatisticas.podios} onChange={(e) => stat({ podios: Number(e.target.value) })} />
                </Campo>
                <Campo etiqueta="Poles">
                  <Input type="number" value={r.estatisticas.poles} onChange={(e) => stat({ poles: Number(e.target.value) })} />
                </Campo>
                <Campo etiqueta="Corridas">
                  <Input type="number" value={r.estatisticas.corridas} onChange={(e) => stat({ corridas: Number(e.target.value) })} />
                </Campo>
                <Campo etiqueta="Melhor resultado">
                  <Input value={r.estatisticas.melhorResultado} onChange={(e) => stat({ melhorResultado: e.target.value })} />
                </Campo>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Instagram">
                <Input value={r.redes.instagram ?? ""}
                  onChange={(e) => definir({ redes: { ...r.redes, instagram: e.target.value } } as Partial<Piloto>)} />
              </Campo>
              <Campo etiqueta="Facebook">
                <Input value={r.redes.facebook ?? ""}
                  onChange={(e) => definir({ redes: { ...r.redes, facebook: e.target.value } } as Partial<Piloto>)} />
              </Campo>
            </div>
          </>
        );
      }}
    />
  );
}
