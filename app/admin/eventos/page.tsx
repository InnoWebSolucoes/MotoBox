"use client";

import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, Input, Area, Seleccao, Estado, ListaTexto } from "@/components/admin/kit";
import { slugify } from "@/lib/admin/store";
import { formatDataCurta } from "@/lib/data";
import type { Evento } from "@/lib/types";

const DISCIPLINAS = ["Motocross", "Enduro", "Velocidade", "Passeio", "Solidária", "Rally"];
const PROVINCIAS = ["Luanda", "Benguela", "Huíla", "Huambo", "Namibe", "Cabinda", "Malanje", "Bengo", "Cuanza Sul"];
const ESTADOS = ["agendado", "bilhetes-abertos", "esgotado", "a-decorrer", "concluido"];
const op = (v: string[]) => v.map((x) => ({ valor: x, nome: x.replace(/-/g, " ") }));

export default function AdminEventos() {
  return (
    <PaginaRecurso<Evento>
      coleccao="eventos"
      titulo="Eventos"
      descricao="Provas do calendário: datas, circuito, estado e horários."
      procuraEm={(e) => `${e.titulo} ${e.circuito} ${e.provincia} ${e.organizador}`}
      ordenar={(a, b) => a.dataInicio.localeCompare(b.dataInicio)}
      filtros={[
        { chave: "disciplina", etiqueta: "Disciplina", opcoes: op(DISCIPLINAS) },
        { chave: "provincia", etiqueta: "Província", opcoes: op(PROVINCIAS) },
        { chave: "estado", etiqueta: "Estado", opcoes: op(ESTADOS) },
      ]}
      colunas={[
        {
          cabecalho: "Prova",
          celula: (e) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{e.titulo}</p>
              <p className="truncate text-xs text-ink-500">{e.circuito}, {e.provincia}</p>
            </div>
          ),
        },
        { cabecalho: "Disciplina", celula: (e) => <span className="text-ink-300">{e.disciplina}</span> },
        { cabecalho: "Data", celula: (e) => <span className="tabular-nums text-ink-300">{formatDataCurta(e.dataInicio)}</span> },
        { cabecalho: "Ronda", celula: (e) => <span className="tabular-nums text-ink-400">{e.ronda ?? "—"}</span> },
        { cabecalho: "Bilhetes", celula: (e) => <span className="tabular-nums text-ink-400">{e.bilhetes?.length ?? 0}</span> },
        { cabecalho: "Estado", celula: (e) => <Estado valor={e.estado} /> },
      ]}
      novoRegisto={() => ({
        slug: "", titulo: "", disciplina: "Motocross", temporada: 2026,
        circuito: "", provincia: "Luanda", localidade: "",
        dataInicio: new Date().toISOString().slice(0, 10),
        dataFim: new Date().toISOString().slice(0, 10),
        estado: "agendado", imagem: "", resumo: "", descricao: "",
        organizador: "Motobox Angola", horarios: [], bilhetes: [],
      }) as Evento}
      formulario={(r, definir) => (
        <>
          <Campo etiqueta="Título" obrigatorio>
            <Input value={r.titulo}
              onChange={(e) => definir({ titulo: e.target.value, slug: r.slug || slugify(e.target.value) } as Partial<Evento>)} />
          </Campo>
          <Campo etiqueta="Slug (URL)" obrigatorio ajuda="Identificador único usado no endereço da página.">
            <Input value={r.slug} onChange={(e) => definir({ slug: slugify(e.target.value) } as Partial<Evento>)} />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Disciplina">
              <Seleccao valor={r.disciplina} opcoes={op(DISCIPLINAS)}
                onChange={(v) => definir({ disciplina: v } as unknown as Partial<Evento>)} />
            </Campo>
            <Campo etiqueta="Estado">
              <Seleccao valor={r.estado} opcoes={op(ESTADOS)}
                onChange={(v) => definir({ estado: v } as unknown as Partial<Evento>)} />
            </Campo>
            <Campo etiqueta="Data de início">
              <Input type="date" value={r.dataInicio.slice(0, 10)}
                onChange={(e) => definir({ dataInicio: e.target.value } as Partial<Evento>)} />
            </Campo>
            <Campo etiqueta="Data de fim">
              <Input type="date" value={r.dataFim.slice(0, 10)}
                onChange={(e) => definir({ dataFim: e.target.value } as Partial<Evento>)} />
            </Campo>
            <Campo etiqueta="Circuito">
              <Input value={r.circuito} onChange={(e) => definir({ circuito: e.target.value } as Partial<Evento>)} />
            </Campo>
            <Campo etiqueta="Província">
              <Seleccao valor={r.provincia} opcoes={op(PROVINCIAS)}
                onChange={(v) => definir({ provincia: v } as unknown as Partial<Evento>)} />
            </Campo>
            <Campo etiqueta="Localidade">
              <Input value={r.localidade} onChange={(e) => definir({ localidade: e.target.value } as Partial<Evento>)} />
            </Campo>
            <Campo etiqueta="Organizador">
              <Input value={r.organizador} onChange={(e) => definir({ organizador: e.target.value } as Partial<Evento>)} />
            </Campo>
            <Campo etiqueta="Ronda">
              <Input type="number" value={r.ronda ?? ""} onChange={(e) => definir({ ronda: e.target.value ? Number(e.target.value) : undefined } as Partial<Evento>)} />
            </Campo>
            <Campo etiqueta="Temporada">
              <Input type="number" value={r.temporada} onChange={(e) => definir({ temporada: Number(e.target.value) } as Partial<Evento>)} />
            </Campo>
          </div>

          <Campo etiqueta="Resumo" ajuda="Frase curta apresentada nos cartões do calendário.">
            <Area rows={2} value={r.resumo} onChange={(e) => definir({ resumo: e.target.value } as Partial<Evento>)} />
          </Campo>
          <Campo etiqueta="Descrição">
            <Area rows={5} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value } as Partial<Evento>)} />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Distância por volta">
              <Input value={r.distanciaVolta ?? ""} onChange={(e) => definir({ distanciaVolta: e.target.value } as Partial<Evento>)} />
            </Campo>
            <Campo etiqueta="Número de voltas">
              <Input type="number" value={r.numeroVoltas ?? ""} onChange={(e) => definir({ numeroVoltas: e.target.value ? Number(e.target.value) : undefined } as Partial<Evento>)} />
            </Campo>
          </div>

          {/* Horários */}
          <div className="border border-ink-700/60 p-3">
            <p className="mb-2 text-[11px] font-display uppercase tracking-widest text-ink-300">Horários</p>
            {r.horarios.map((h, i) => (
              <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_1.5fr_auto] gap-2">
                <Input placeholder="Dia" value={h.dia} aria-label="Dia"
                  onChange={(e) => definir({ horarios: r.horarios.map((x, j) => j === i ? { ...x, dia: e.target.value } : x) } as Partial<Evento>)} />
                <Input placeholder="Hora" value={h.hora} aria-label="Hora"
                  onChange={(e) => definir({ horarios: r.horarios.map((x, j) => j === i ? { ...x, hora: e.target.value } : x) } as Partial<Evento>)} />
                <Input placeholder="Sessão" value={h.sessao} aria-label="Sessão"
                  onChange={(e) => definir({ horarios: r.horarios.map((x, j) => j === i ? { ...x, sessao: e.target.value } : x) } as Partial<Evento>)} />
                <button type="button" aria-label="Remover horário"
                  onClick={() => definir({ horarios: r.horarios.filter((_, j) => j !== i) } as Partial<Evento>)}
                  className="border border-ink-700 px-2 text-ink-400 hover:border-mb-red hover:text-white">×</button>
              </div>
            ))}
            <button type="button"
              onClick={() => definir({ horarios: [...r.horarios, { dia: "", hora: "", sessao: "" }] } as Partial<Evento>)}
              className="border border-ink-600 px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-white hover:border-mb-red">
              Juntar horário
            </button>
          </div>

          {/* Tipos de bilhete */}
          <div className="border border-ink-700/60 p-3">
            <p className="mb-2 text-[11px] font-display uppercase tracking-widest text-ink-300">Tipos de bilhete</p>
            {(r.bilhetes ?? []).map((b, i) => {
              const set = (campos: Partial<typeof b>) =>
                definir({ bilhetes: (r.bilhetes ?? []).map((x, j) => j === i ? { ...x, ...campos } : x) } as Partial<Evento>);
              return (
                <div key={i} className="mb-3 border border-ink-800 p-2.5">
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <Input placeholder="Nome" value={b.nome} aria-label="Nome do bilhete" onChange={(e) => set({ nome: e.target.value })} />
                    <Input placeholder="ID" value={b.id} aria-label="ID do bilhete" onChange={(e) => set({ id: e.target.value })} />
                    <Input type="number" placeholder="Preço (Kz)" value={b.preco} aria-label="Preço" onChange={(e) => set({ preco: Number(e.target.value) })} />
                    <Input type="number" placeholder="Disponíveis" value={b.disponiveis} aria-label="Disponíveis" onChange={(e) => set({ disponiveis: Number(e.target.value) })} />
                  </div>
                  <Input placeholder="Descrição" value={b.descricao} aria-label="Descrição do bilhete" onChange={(e) => set({ descricao: e.target.value })} />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs text-ink-300">
                      <input type="checkbox" checked={!!b.destaque} onChange={(e) => set({ destaque: e.target.checked })} />
                      Destacar
                    </label>
                    <button type="button"
                      onClick={() => definir({ bilhetes: (r.bilhetes ?? []).filter((_, j) => j !== i) } as Partial<Evento>)}
                      className="border border-ink-700 px-2 py-1 text-xs text-ink-400 hover:border-mb-red hover:text-white">
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
            <button type="button"
              onClick={() => definir({ bilhetes: [...(r.bilhetes ?? []), { id: `b-${Date.now().toString(36).slice(-4)}`, nome: "", descricao: "", preco: 0, disponiveis: 100, beneficios: [] }] } as Partial<Evento>)}
              className="border border-ink-600 px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-white hover:border-mb-red">
              Juntar tipo de bilhete
            </button>
          </div>
        </>
      )}
    />
  );
}
