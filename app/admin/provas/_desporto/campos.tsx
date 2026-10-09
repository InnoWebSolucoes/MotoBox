"use client";

/* ============================================================
   MOTOBOX ADMIN — Desporto: campos e utilitários partilhados
   pelas páginas Provas, Resultados, Pilotos, Equipas e
   Modalidades (só as páginas de Desporto os usam).
   ============================================================ */

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { comBase } from "@/lib/base";
import { CLASSE_CAMPO, Campo, Input, Interruptor } from "@/components/admin/kit";
import type { CampoEsquema, Opcao } from "@/components/admin/editor/esquema";
import { CATEGORIAS_CAMPEONATO, CATEGORIAS_PILOTO, MODALIDADES } from "@/lib/desporto";
import { PROVINCIAS } from "@/lib/provincias";

export const OPCOES_PROVINCIAS: Opcao[] = PROVINCIAS.map((p) => ({ valor: p, nome: p }));

/** Estados de uma prova, em linguagem de quem gere o calendário. */
export const ESTADOS_PROVA: Opcao[] = [
  { valor: "agendado", nome: "Agendada" },
  { valor: "bilhetes-abertos", nome: "Bilhetes à venda" },
  { valor: "esgotado", nome: "Esgotada" },
  { valor: "a-decorrer", nome: "A decorrer" },
  { valor: "concluido", nome: "Concluída" },
];

export const nomeEstadoProva = (v: string) => ESTADOS_PROVA.find((e) => e.valor === v)?.nome ?? v;

/** Data curta, ex.: "14 mar 2026". */
export function dataCurta(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mes = new Intl.DateTimeFormat("pt-PT", { month: "short" }).format(d).replace(".", "");
  return `${d.getDate()} ${mes} ${d.getFullYear()}`;
}

/* ---------------- Configuração de Desporto (categorias, modalidades) ---------------- */

export interface ConfigDesporto {
  /** Todas as categorias de piloto, pela ordem do site. */
  categorias: string[];
  /** Categorias que pontuam para o campeonato. */
  campeonato: string[];
  nomeCampeonato: string;
  modalidades: { slug: string; nome: string; disciplinas: string[]; categorias: string[] }[];
}

const CONFIG_PADRAO: ConfigDesporto = {
  categorias: [...CATEGORIAS_PILOTO],
  campeonato: [...CATEGORIAS_CAMPEONATO],
  nomeCampeonato: "Campeonato Nacional",
  modalidades: MODALIDADES.map((m) => ({ slug: m.slug, nome: m.nome, disciplinas: m.disciplinas, categorias: m.categorias })),
};

async function lerJson(url: string) {
  const r = await fetch(comBase(url), { cache: "no-store" });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

/**
 * As categorias e as modalidades como estão gravadas em Modalidades (para as
 * listas de escolha das outras páginas). Enquanto lê, usa as do código.
 */
export function useConfigDesporto(): ConfigDesporto {
  const [config, setConfig] = useState<ConfigDesporto>(CONFIG_PADRAO);
  useEffect(() => {
    let vivo = true;
    Promise.all([
      lerJson("/api/admin/conteudo?chave=paginas.desporto").catch(() => null),
      lerJson("/api/admin/conteudo?grupo=modalidades").catch(() => null),
    ]).then(([doc, grupo]) => {
      if (!vivo) return;
      const c = doc?.dados?.campeonato ?? {};
      const itens: { chave: string; dados: Record<string, unknown> }[] = Array.isArray(grupo?.itens) ? grupo.itens : [];
      setConfig({
        categorias: Array.isArray(c.categoriasPiloto) && c.categoriasPiloto.length ? c.categoriasPiloto : CONFIG_PADRAO.categorias,
        campeonato: Array.isArray(c.categorias) ? c.categorias : CONFIG_PADRAO.campeonato,
        nomeCampeonato: typeof c.nome === "string" && c.nome ? c.nome : CONFIG_PADRAO.nomeCampeonato,
        modalidades: itens.length
          ? itens.map((i) => ({
              slug: i.chave,
              nome: String(i.dados?.nome ?? i.chave),
              disciplinas: Array.isArray(i.dados?.disciplinas) ? (i.dados.disciplinas as string[]) : [],
              categorias: Array.isArray(i.dados?.categorias) ? (i.dados.categorias as string[]) : [],
            }))
          : CONFIG_PADRAO.modalidades,
      });
    });
    return () => { vivo = false; };
  }, []);
  return config;
}

/** Opções de categoria: as do site e, no fim, as que já existem nos dados. */
export function opcoesCategorias(config: ConfigDesporto, existentes: string[] = []): Opcao[] {
  const todas = [...config.categorias, ...existentes.filter((c) => c && !config.categorias.includes(c))];
  return [...new Set(todas)].map((c) => ({ valor: c, nome: config.campeonato.includes(c) ? `${c} (pontua para o campeonato)` : c }));
}

/* ---------------- Campos ---------------- */

/**
 * Data de uma prova. Grava "AAAA-MM-DD"; se a data já trazia hora (ex.:
 * "2026-03-14T08:00:00+01:00"), a hora mantém-se ao mudar o dia.
 */
export function CampoDataComHora({
  etiqueta, valor, mudar, ajuda,
}: { etiqueta: string; valor: unknown; mudar: (v: string) => void; ajuda?: string }) {
  const actual = typeof valor === "string" ? valor : "";
  const resto = actual.length > 10 && actual[10] === "T" ? actual.slice(10) : "";
  return (
    <Campo etiqueta={etiqueta} ajuda={ajuda}>
      <Input type="date" value={actual.slice(0, 10)} onChange={(e) => mudar(e.target.value ? e.target.value + resto : "")} />
    </Campo>
  );
}

/** "Publicado no site": ligado por omissão (um registo sem o campo está publicado). */
export const campoPublicado = (o: string): CampoEsquema => ({
  tipo: "personalizado",
  chave: "publicado",
  etiqueta: "Publicado",
  render: (v, mudar) => (
    <Interruptor
      etiqueta="Publicado no site"
      descricao={`Desligado, ${o} deixa de aparecer no site mas continua aqui, para editar e voltar a publicar.`}
      activo={v !== false}
      onChange={(x) => mudar(x)}
    />
  ),
});

/**
 * Escolha de vários valores (disciplinas, categorias, modalidades): pílulas
 * que se ligam e desligam; com `livre`, junta-se também um valor escrito à mão.
 */
export function EscolherVarios({
  etiqueta, ajuda, opcoes, valor, mudar, livre = false, placeholder = "Outro valor",
}: {
  etiqueta: string; ajuda?: ReactNode; opcoes: Opcao[]; valor: unknown; mudar: (v: string[]) => void;
  livre?: boolean; placeholder?: string;
}) {
  const escolhidos = Array.isArray(valor) ? valor.map(String) : [];
  const [novo, setNovo] = useState("");
  const todas = [...opcoes, ...escolhidos.filter((e) => !opcoes.some((o) => o.valor === e)).map((e) => ({ valor: e, nome: e }))];
  const alternar = (v: string) => mudar(escolhidos.includes(v) ? escolhidos.filter((x) => x !== v) : [...escolhidos, v]);
  const juntar = () => {
    const t = novo.trim();
    if (t && !escolhidos.includes(t)) mudar([...escolhidos, t]);
    setNovo("");
  };
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[13px] font-medium text-white/75">{etiqueta}</p>
      <div role="group" aria-label={etiqueta} className="flex flex-wrap gap-1.5">
        {todas.map((o) => {
          const sel = escolhidos.includes(o.valor);
          return (
            <button
              key={o.valor} type="button" aria-pressed={sel} onClick={() => alternar(o.valor)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-[var(--raio)] px-3 text-sm transition-colors ${
                sel ? "bg-mb-red text-white hover:bg-mb-red-dark" : "bg-white/[0.07] text-white/75 hover:bg-white/[0.12] hover:text-white"
              }`}
            >
              {sel && <span aria-hidden>✓</span>}
              {o.nome}
            </button>
          );
        })}
      </div>
      {livre && (
        <div className="mt-2 flex max-w-sm gap-2">
          <input
            value={novo} onChange={(e) => setNovo(e.target.value)} placeholder={placeholder} aria-label={`${etiqueta}: ${placeholder}`}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); juntar(); } }}
            className={CLASSE_CAMPO}
          />
          <button type="button" onClick={juntar} className="h-[2.875rem] shrink-0 rounded-[var(--raio)] bg-white/10 px-4 text-sm text-white hover:bg-white/[0.16]">
            Juntar
          </button>
        </div>
      )}
      {ajuda && <p className="mt-1.5 text-xs leading-relaxed text-white/50">{ajuda}</p>}
    </div>
  );
}

/** Pílula com botão de tirar (fontes escolhidas, pilotos de uma equipa…). */
export function PilulaRemovivel({ children, aoTirar, rotulo }: { children: ReactNode; aoTirar: () => void; rotulo: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-[var(--raio)] bg-white/[0.08] py-1 pl-2.5 pr-1 text-[13px] text-white/85">
      <span className="min-w-0 truncate">{children}</span>
      <button type="button" onClick={aoTirar} aria-label={rotulo} title={rotulo}
        className="grid size-6 shrink-0 place-items-center rounded-[4px] text-white/55 hover:bg-mb-red hover:text-white">
        <X className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}

/** Miniatura de uma imagem (chave do site, endereço ou ficheiro carregado). */
export { previsualizacao } from "@/components/admin/Media";
