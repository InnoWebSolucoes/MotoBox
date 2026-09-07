"use client";

import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, Input, Area, Seleccao, Estado, Interruptor } from "@/components/admin/kit";
import { novoId } from "@/lib/admin/store";
import { corPara } from "@/lib/admin/seed";
import { PAPEIS, PERMISSOES_POR_PAPEL, type Utilizador, type Papel } from "@/lib/admin/types";
import { formatDataCurta } from "@/lib/data";

const PROVINCIAS = ["Luanda", "Benguela", "Huíla", "Huambo", "Namibe", "Cabinda", "Malanje", "Bengo", "Cuanza Sul"];
const ESTADOS = ["ativo", "pendente", "suspenso", "banido"];
const op = (v: string[]) => v.map((x) => ({ valor: x, nome: x }));

export default function AdminUtilizadores() {
  return (
    <PaginaRecurso<Utilizador>
      coleccao="utilizadores"
      titulo="Utilizadores"
      descricao="Contas da equipa e da comunidade, com papéis e permissões."
      procuraEm={(u) => `${u.nome} ${u.email} ${u.telefone ?? ""} ${u.provincia ?? ""}`}
      ordenar={(a, b) => b.registado.localeCompare(a.registado)}
      filtros={[
        { chave: "papel", etiqueta: "Papel", opcoes: PAPEIS.map((p) => ({ valor: p.valor, nome: p.nome })) },
        { chave: "estado", etiqueta: "Estado", opcoes: op(ESTADOS) },
        { chave: "provincia", etiqueta: "Província", opcoes: op(PROVINCIAS) },
      ]}
      colunas={[
        {
          cabecalho: "Conta",
          celula: (u) => (
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center font-display text-xs text-white"
                style={{ background: u.avatarCor }}>
                {u.nome.split(" ").map((x) => x[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-white">
                  {u.nome}
                  {u.verificado && <span className="ml-1.5 text-ok" title="Verificado">✓</span>}
                </p>
                <p className="truncate text-xs text-ink-500">{u.email}</p>
              </div>
            </div>
          ),
        },
        {
          cabecalho: "Papel",
          celula: (u) => (
            <span className="text-ink-300">{PAPEIS.find((p) => p.valor === u.papel)?.nome ?? u.papel}</span>
          ),
        },
        { cabecalho: "Estado", celula: (u) => <Estado valor={u.estado} /> },
        { cabecalho: "Província", celula: (u) => <span className="text-ink-400">{u.provincia ?? "—"}</span> },
        { cabecalho: "Registo", celula: (u) => <span className="tabular-nums text-ink-400">{formatDataCurta(u.registado)}</span> },
        {
          cabecalho: "Último acesso",
          celula: (u) => <span className="tabular-nums text-ink-500">{u.ultimoAcesso ? formatDataCurta(u.ultimoAcesso) : "—"}</span>,
        },
      ]}
      novoRegisto={() => ({
        id: novoId("u"), nome: "", email: "", papel: "leitor", estado: "pendente",
        provincia: "Luanda", avatarCor: corPara(String(Math.random())),
        registado: new Date().toISOString().slice(0, 10),
        verificado: false, newsletter: false,
      }) as Utilizador}
      formulario={(r, definir) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nome" obrigatorio>
              <Input value={r.nome}
                onChange={(e) => definir({ nome: e.target.value, avatarCor: corPara(e.target.value) } as Partial<Utilizador>)} />
            </Campo>
            <Campo etiqueta="Email" obrigatorio>
              <Input type="email" value={r.email} onChange={(e) => definir({ email: e.target.value } as Partial<Utilizador>)} />
            </Campo>
            <Campo etiqueta="Telefone">
              <Input value={r.telefone ?? ""} placeholder="+244 …"
                onChange={(e) => definir({ telefone: e.target.value } as Partial<Utilizador>)} />
            </Campo>
            <Campo etiqueta="Província">
              <Seleccao valor={r.provincia ?? "Luanda"} opcoes={op(PROVINCIAS)}
                onChange={(v) => definir({ provincia: v } as Partial<Utilizador>)} />
            </Campo>
            <Campo etiqueta="Papel">
              <Seleccao valor={r.papel} opcoes={PAPEIS.map((p) => ({ valor: p.valor, nome: p.nome }))}
                onChange={(v) => definir({ papel: v as Papel } as Partial<Utilizador>)} />
            </Campo>
            <Campo etiqueta="Estado">
              <Seleccao valor={r.estado} opcoes={op(ESTADOS)}
                onChange={(v) => definir({ estado: v } as unknown as Partial<Utilizador>)} />
            </Campo>
            <Campo etiqueta="Data de registo">
              <Input type="date" value={r.registado.slice(0, 10)}
                onChange={(e) => definir({ registado: e.target.value } as Partial<Utilizador>)} />
            </Campo>
            <Campo etiqueta="Último acesso">
              <Input type="date" value={r.ultimoAcesso?.slice(0, 10) ?? ""}
                onChange={(e) => definir({ ultimoAcesso: e.target.value } as Partial<Utilizador>)} />
            </Campo>
          </div>

          {/* Permissões do papel escolhido */}
          <div className="border border-ink-700/60 bg-ink-950 p-3">
            <p className="mb-1 text-[11px] font-display uppercase tracking-widest text-ink-300">
              Permissões de {PAPEIS.find((p) => p.valor === r.papel)?.nome}
            </p>
            <p className="mb-2.5 text-xs text-ink-500">
              {PAPEIS.find((p) => p.valor === r.papel)?.descricao}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PERMISSOES_POR_PAPEL[r.papel].map((p) => (
                <span key={p} className="border border-ink-700 px-2 py-0.5 text-[10px] text-ink-300">{p}</span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Interruptor
              activo={r.verificado} etiqueta="Conta verificada"
              descricao="O email foi confirmado pelo utilizador."
              onChange={(v) => definir({ verificado: v } as Partial<Utilizador>)} />
            <Interruptor
              activo={r.newsletter} etiqueta="Subscreve a newsletter"
              descricao="Recebe as comunicações periódicas da Motobox."
              onChange={(v) => definir({ newsletter: v } as Partial<Utilizador>)} />
          </div>

          <Campo etiqueta="Notas internas" ajuda="Visível apenas para administradores.">
            <Area rows={3} value={r.notas ?? ""} onChange={(e) => definir({ notas: e.target.value } as Partial<Utilizador>)} />
          </Campo>
        </>
      )}
    />
  );
}
