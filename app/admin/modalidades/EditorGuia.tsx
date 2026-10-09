"use client";

/* ============================================================
   MOTOBOX ADMIN — Modalidade: a ficha e o guia
   O guia de cada modalidade é texto com fontes numeradas: cada
   parágrafo diz que fontes o sustentam, escolhidas pelo nome
   (nunca por número à mão). Ao reordenar ou apagar uma fonte,
   as referências de todo o guia acertam-se sozinhas.
   ============================================================ */

import { createContext, useContext, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  AccaoIcone, Abas, Aviso, Botao, CLASSE_CAMPO, CampoEndereco, Grupo, Input, Seleccao,
} from "@/components/admin/kit";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";
import { DISCIPLINAS_PROVA } from "@/lib/desporto";
import { EscolherVarios, PilulaRemovivel, useConfigDesporto } from "../provas/_desporto/campos";

export const NOMES_GRUPO: Record<string, string> = {
  principal: "Em destaque",
  competicao: "Competição",
  outras: "Outras modalidades",
};

type Fonte = { nome: string; url: string };

/* ---------------- Fontes: contexto e escolha ---------------- */

const ContextoFontes = createContext<Fonte[]>([]);

/** As fontes de um parágrafo: pílulas com o nome, e uma lista para juntar mais. */
function EscolherFontes({ valor, mudar }: { valor: unknown; mudar: (v: number[]) => void }) {
  const fontes = useContext(ContextoFontes);
  const refs = Array.isArray(valor) ? valor.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
  const livres = fontes.map((f, i) => ({ f, n: i + 1 })).filter((x) => !refs.includes(x.n));
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[13px] font-medium text-white/75">Fontes deste texto</p>
      {refs.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {refs.map((n) => {
            const f = fontes[n - 1];
            return (
              <li key={n} className="max-w-full">
                <PilulaRemovivel rotulo={`Tirar a fonte ${f?.nome ?? n}`} aoTirar={() => mudar(refs.filter((x) => x !== n))}>
                  <span className="mr-1 tabular-nums text-mb-red-light">{n}</span>
                  {f ? f.nome : <span className="text-gold">fonte que já não existe</span>}
                </PilulaRemovivel>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mb-2 text-xs text-white/45">Sem fontes. Números, nomes e datas levam sempre fonte.</p>
      )}
      {fontes.length === 0 ? (
        <p className="text-xs text-white/45">Este guia ainda não tem fontes: junte-as no separador Fontes.</p>
      ) : livres.length > 0 && (
        <Seleccao
          valor="" aria-label="Juntar fonte"
          opcoes={[{ valor: "", nome: "Juntar fonte…" }, ...livres.map(({ f, n }) => ({ valor: String(n), nome: `${n} · ${f.nome}` }))]}
          onChange={(v) => { if (v) mudar([...refs, Number(v)]); }}
          className="max-w-xl"
        />
      )}
    </div>
  );
}

/* ---------------- Peças do esquema ---------------- */

const resumoTexto = (o: Valor) => String(o.texto ?? "").slice(0, 110);

const camposTexto = (etiqueta = "Texto", linhas = 4): CampoEsquema[] => [
  { tipo: "area", chave: "texto", etiqueta, linhas },
  { tipo: "personalizado", chave: "fontes", etiqueta: "Fontes", render: (v, m) => <EscolherFontes valor={v} mudar={m} /> },
];

const listaTextos = (chave: string, etiqueta: string, nomeItem: string, ajuda?: string): CampoEsquema => ({
  tipo: "lista", chave, etiqueta, nomeItem, ajuda, resumo: resumoTexto,
  novo: () => ({ texto: "", fontes: [] }), campos: camposTexto(),
});

const listaBlocos = (chave: string, etiqueta: string, ajuda?: string): CampoEsquema => ({
  tipo: "lista", chave, etiqueta, nomeItem: "bloco", ajuda,
  resumo: (b) => String(b.titulo ?? ""),
  novo: () => ({ titulo: "", paragrafos: [{ texto: "", fontes: [] }] }),
  campos: [
    { tipo: "texto", chave: "titulo", etiqueta: "Subtítulo" },
    listaTextos("paragrafos", "Parágrafos", "parágrafo"),
  ],
});

const ESQUEMA_O_QUE_E: CampoEsquema[] = [
  { tipo: "area", chave: "abertura", etiqueta: "Abertura", linhas: 4, ajuda: "O que é a modalidade, numa ou duas frases. Aparece em letra grande no início do guia." },
  {
    tipo: "lista", chave: "factos", etiqueta: "Caixa \"Em resumo\"", nomeItem: "facto",
    ajuda: "Ao lado do texto: pares curtos de rótulo e valor (federação, pista, classes…).",
    resumo: (f) => [f.rotulo, f.valor].filter(Boolean).join(": "),
    novo: () => ({ rotulo: "", valor: "" }),
    campos: [
      { tipo: "texto", chave: "rotulo", etiqueta: "Rótulo", largura: "meia", placeholder: "Federação" },
      { tipo: "texto", chave: "valor", etiqueta: "Valor", largura: "meia" },
    ],
  },
  listaBlocos("formato", "Como funciona", "Blocos com subtítulo: como é uma corrida, a pontuação…"),
];

const ESQUEMA_CLASSES: CampoEsquema[] = [
  {
    tipo: "personalizado", chave: "classes", etiqueta: "Tabelas",
    render: (v, m) => <EditorTabelas valor={Array.isArray(v) ? (v as Valor[]) : []} mudar={m} />,
  },
  listaTextos("maquinas", "Máquinas e custos", "parágrafo", "Máquinas típicas e preços de referência (sempre com fonte). Vazio, a parte não aparece."),
  listaTextos("equipamento", "Equipamento de protecção", "item", "Um cartão por peça de equipamento. Vazio, a parte não aparece."),
];

const ESQUEMA_ANGOLA: CampoEsquema[] = [
  listaTextos("intro", "Introdução", "parágrafo"),
  {
    tipo: "lista", chave: "marcos", etiqueta: "Marcos", nomeItem: "marco",
    ajuda: "Do mais antigo para o mais recente. Vazio, a cronologia não aparece.",
    resumo: (m) => `${m.ano ?? ""} · ${String(m.texto ?? "").slice(0, 90)}`,
    novo: () => ({ ano: "", texto: "", fontes: [] }),
    campos: [{ tipo: "texto", chave: "ano", etiqueta: "Ano", placeholder: "2026", largura: "meia" }, ...camposTexto("O que aconteceu", 3)],
  },
  listaBlocos("blocos", "Blocos", "Onde se corre, quem está a ganhar, a selecção…"),
];

const ESQUEMA_FORA: CampoEsquema[] = [
  {
    tipo: "lista", chave: "internacional", etiqueta: "Campeonatos de referência", nomeItem: "campeonato",
    resumo: (i) => String(i.nome ?? ""),
    novo: () => ({ nome: "", texto: { texto: "", fontes: [] }, seguir: "" }),
    campos: [
      { tipo: "texto", chave: "nome", etiqueta: "Campeonato" },
      { tipo: "objecto", chave: "texto", etiqueta: "Texto", campos: camposTexto("Texto", 3) },
      { tipo: "texto", chave: "seguir", etiqueta: "Como acompanhar", ajuda: "Onde ver as provas. Vazio, a caixa não aparece." },
    ],
  },
  listaTextos("lusofonia", "Ligações lusófonas e africanas", "parágrafo", "Só quando são reais. Vazio, a parte não aparece."),
];

const ESQUEMA_COMECAR: CampoEsquema[] = [
  {
    tipo: "lista", chave: "passos", etiqueta: "Passos", nomeItem: "passo",
    resumo: (p) => String(p.titulo ?? ""),
    novo: () => ({ titulo: "", texto: { texto: "", fontes: [] } }),
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título do passo" },
      { tipo: "objecto", chave: "texto", etiqueta: "Explicação", campos: camposTexto("Texto", 3) },
    ],
  },
  { tipo: "lista-texto", chave: "seguranca", etiqueta: "Segurança primeiro", multilinha: true, placeholder: "Um conselho de segurança",
    ajuda: "Conselhos gerais, sem fonte. Vazio, a caixa não aparece." },
];

/* ---------------- Tabelas de classes ---------------- */

type TabelaGuia = { titulo: string; colunas: string[]; linhas: string[][]; nota?: { texto: string; fontes: number[] } };

function comoTabela(v: Valor): TabelaGuia {
  return {
    ...v,
    titulo: String(v.titulo ?? ""),
    colunas: Array.isArray(v.colunas) ? v.colunas.map(String) : [],
    linhas: Array.isArray(v.linhas) ? v.linhas.map((l) => (Array.isArray(l) ? l.map(String) : [])) : [],
  } as TabelaGuia;
}

/** As tabelas de classes: título, colunas, linhas e uma nota com fontes por baixo. */
function EditorTabelas({ valor, mudar }: { valor: Valor[]; mudar: (v: Valor[]) => void }) {
  const tabelas = valor.map(comoTabela);
  const [aberta, setAberta] = useState<number | null>(tabelas.length === 1 ? 0 : null);
  const definir = (i: number, t: TabelaGuia) => mudar(tabelas.map((x, j) => (j === i ? t : x)) as unknown as Valor[]);
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= tabelas.length) return;
    const v = [...tabelas];
    [v[i], v[j]] = [v[j], v[i]];
    mudar(v as unknown as Valor[]);
    setAberta(j);
  };
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[13px] font-medium text-white/75">Tabelas de classes <span className="ml-1 text-white/40">{tabelas.length}</span></p>
      <p className="mb-2 text-xs leading-relaxed text-white/50">A primeira coluna é o nome da classe, em destaque. Uma tabela por campeonato.</p>
      <ol className="space-y-[var(--intervalo)]">
        {tabelas.map((t, i) => (
          <li key={i} className="rounded-[var(--raio)] border border-white/10 bg-black/[0.18]">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" onClick={() => setAberta(aberta === i ? null : i)} aria-expanded={aberta === i}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                <span className="grid size-6 shrink-0 place-items-center rounded-[4px] bg-white/10 text-xs tabular-nums text-white/70">{i + 1}</span>
                <span className="truncate text-sm text-white">{t.titulo || "Tabela sem título"}</span>
                <span className="shrink-0 text-xs text-white/45">{t.linhas.length} linhas</span>
              </button>
              <span className="flex shrink-0 gap-1">
                <AccaoIcone titulo="Subir" onClick={() => mover(i, -1)}><ArrowUp className="size-3.5" aria-hidden /></AccaoIcone>
                <AccaoIcone titulo="Descer" onClick={() => mover(i, 1)}><ArrowDown className="size-3.5" aria-hidden /></AccaoIcone>
                <AccaoIcone titulo="Duplicar" onClick={() => { const v = [...tabelas]; v.splice(i + 1, 0, structuredClone(t)); mudar(v as unknown as Valor[]); }}>
                  <Copy className="size-3.5" aria-hidden />
                </AccaoIcone>
                <AccaoIcone titulo="Apagar tabela" tom="perigo" onClick={() => { mudar(tabelas.filter((_, j) => j !== i) as unknown as Valor[]); setAberta(null); }}>
                  <Trash2 className="size-3.5" aria-hidden />
                </AccaoIcone>
              </span>
            </div>
            {aberta === i && (
              <div className="border-t border-white/10 p-3 md:p-4">
                <EditorTabela t={t} mudar={(n) => definir(i, n)} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <Botao className="mt-2" onClick={() => {
        mudar([...tabelas, { titulo: "", colunas: ["Classe", "O que é"], linhas: [["", ""]] }] as unknown as Valor[]);
        setAberta(tabelas.length);
      }}>
        <Plus className="size-4" aria-hidden /> Juntar tabela
      </Botao>
    </div>
  );
}

function EditorTabela({ t, mudar }: { t: TabelaGuia; mudar: (t: TabelaGuia) => void }) {
  const n = Math.max(1, t.colunas.length);
  const linha = (l: string[]) => Array.from({ length: n }, (_, k) => l[k] ?? "");
  const linhas = t.linhas.map(linha);
  const setLinhas = (ls: string[][]) => mudar({ ...t, linhas: ls });
  const tirarColuna = (k: number) => mudar({ ...t, colunas: t.colunas.filter((_, j) => j !== k), linhas: linhas.map((l) => l.filter((_, j) => j !== k)) });
  const juntarColuna = () => mudar({ ...t, colunas: [...t.colunas, ""], linhas: linhas.map((l) => [...l, ""]) });
  const moverLinha = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= linhas.length) return;
    const v = [...linhas];
    [v[i], v[j]] = [v[j], v[i]];
    setLinhas(v);
  };
  const grelha = { gridTemplateColumns: `repeat(${n}, minmax(7.5rem, 1fr)) 6.5rem`, minWidth: `calc(${n} * 7.5rem + 6.5rem + ${n} * 0.375rem)` };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-white/75">Título da tabela</span>
        <Input value={t.titulo} onChange={(e) => mudar({ ...t, titulo: e.target.value })} placeholder="Mundial de Motocross (FIM)" />
      </label>

      <div className="-mx-3 overflow-x-auto px-3 md:-mx-4 md:px-4">
        <div className="grid w-full gap-1.5" style={grelha}>
          {t.colunas.map((c, k) => (
            <span key={`c${k}`} className="flex gap-1">
              <input value={c} aria-label={`Coluna ${k + 1}`} placeholder={`Coluna ${k + 1}`}
                onChange={(e) => mudar({ ...t, colunas: t.colunas.map((x, j) => (j === k ? e.target.value : x)) })}
                className={`${CLASSE_CAMPO} py-1.5 text-xs font-semibold text-white/80`} />
              {t.colunas.length > 1 && (
                <button type="button" onClick={() => tirarColuna(k)} aria-label={`Tirar a coluna ${c || k + 1}`} title="Tirar a coluna"
                  className="grid w-7 shrink-0 place-items-center rounded-[4px] text-white/45 hover:bg-mb-red hover:text-white">
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              )}
            </span>
          ))}
          <Botao tamanho="sm" onClick={juntarColuna} className="h-auto"><Plus className="size-3.5" aria-hidden /> Coluna</Botao>

          {linhas.map((l, i) => (
            <div key={`l${i}`} className="contents">
              {l.map((celula, k) => (
                <textarea key={k} value={celula} rows={k === 0 ? 1 : 3}
                  aria-label={`Linha ${i + 1}, ${t.colunas[k] || `coluna ${k + 1}`}`}
                  onChange={(e) => setLinhas(linhas.map((x, a) => (a === i ? x.map((y, b) => (b === k ? e.target.value : y)) : x)))}
                  className={`${CLASSE_CAMPO} resize-y py-1.5 text-sm ${k === 0 ? "font-semibold" : ""}`} />
              ))}
              <span className="flex items-start gap-1">
                <AccaoIcone titulo="Subir linha" onClick={() => moverLinha(i, -1)}><ArrowUp className="size-3.5" aria-hidden /></AccaoIcone>
                <AccaoIcone titulo="Descer linha" onClick={() => moverLinha(i, 1)}><ArrowDown className="size-3.5" aria-hidden /></AccaoIcone>
                <AccaoIcone titulo="Apagar linha" tom="perigo" onClick={() => setLinhas(linhas.filter((_, a) => a !== i))}><Trash2 className="size-3.5" aria-hidden /></AccaoIcone>
              </span>
            </div>
          ))}
        </div>
      </div>
      <Botao tamanho="sm" onClick={() => setLinhas([...linhas, Array.from({ length: n }, () => "")])}>
        <Plus className="size-3.5" aria-hidden /> Juntar linha
      </Botao>

      <Grupo titulo="Nota por baixo da tabela" descricao="Opcional: de onde vêm os dados da tabela. Vazio, não aparece.">
        <Formulario
          esquema={camposTexto("Nota", 2)}
          valor={(t.nota ?? { texto: "", fontes: [] }) as Valor}
          onChange={(v) => mudar({ ...t, nota: v as TabelaGuia["nota"] })}
        />
      </Grupo>
    </div>
  );
}

/* ---------------- Fontes do guia ---------------- */

/** Troca os números das fontes em todo o guia (menos na própria lista). */
function remapear(guia: Valor, mapa: (n: number) => number | null): Valor {
  const andar = (v: unknown, raiz: boolean): unknown => {
    if (Array.isArray(v)) return v.map((x) => andar(x, false));
    if (v && typeof v === "object") {
      const o: Valor = {};
      for (const [k, x] of Object.entries(v as Valor)) {
        if (k === "fontes" && !raiz && Array.isArray(x) && x.every((n) => typeof n === "number")) {
          o[k] = (x as number[]).map(mapa).filter((n): n is number => n !== null);
        } else {
          o[k] = andar(x, false);
        }
      }
      return o;
    }
    return v;
  };
  return andar(guia, true) as Valor;
}

/** Quantas vezes cada fonte é citada no guia. */
function contarCitacoes(guia: Valor): Map<number, number> {
  const conta = new Map<number, number>();
  const andar = (v: unknown, raiz: boolean) => {
    if (Array.isArray(v)) { v.forEach((x) => andar(x, false)); return; }
    if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v as Valor)) {
        if (k === "fontes" && !raiz && Array.isArray(x)) (x as number[]).forEach((n) => conta.set(n, (conta.get(n) ?? 0) + 1));
        else andar(x, false);
      }
    }
  };
  andar(guia, true);
  return conta;
}

function EditorFontes({ guia, mudar }: { guia: Valor; mudar: (g: Valor) => void }) {
  const fontes = (Array.isArray(guia.fontes) ? guia.fontes : []) as Fonte[];
  const citacoes = contarCitacoes(guia);
  const [nova, setNova] = useState<Fonte>({ nome: "", url: "" });

  const mudarFonte = (i: number, f: Fonte) => mudar({ ...guia, fontes: fontes.map((x, j) => (j === i ? f : x)) });
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= fontes.length) return;
    const lista = [...fontes];
    [lista[i], lista[j]] = [lista[j], lista[i]];
    const a = i + 1, b = j + 1;
    mudar({ ...remapear(guia, (n) => (n === a ? b : n === b ? a : n)), fontes: lista });
  };
  const apagar = (i: number) => {
    const alvo = i + 1;
    mudar({ ...remapear(guia, (n) => (n === alvo ? null : n > alvo ? n - 1 : n)), fontes: fontes.filter((_, j) => j !== i) });
  };
  const juntar = () => {
    if (!nova.nome.trim() || !nova.url.trim()) return;
    mudar({ ...guia, fontes: [...fontes, { nome: nova.nome.trim(), url: nova.url.trim() }] });
    setNova({ nome: "", url: "" });
  };

  return (
    <div className="space-y-4">
      <Aviso>
        A lista numerada do fim da página. Os textos citam as fontes pelo nome, e o site mostra o número. Ao mudar a ordem
        ou apagar uma fonte, os números em todo o guia acertam-se sozinhos (apagar tira-a dos textos que a citavam).
      </Aviso>
      {fontes.length === 0 && <p className="text-sm text-white/55">Ainda sem fontes.</p>}
      <ol className="space-y-[var(--intervalo)]">
        {fontes.map((f, i) => {
          const n = citacoes.get(i + 1) ?? 0;
          return (
            <li key={i} className="rounded-[var(--raio)] border border-white/10 bg-black/[0.18] p-3">
              <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-2">
                <span className="grid h-[2.875rem] place-items-center rounded-[4px] bg-mb-red/80 text-sm font-semibold tabular-nums">{i + 1}</span>
                <div className="min-w-0 space-y-2">
                  <input value={f.nome} aria-label={`Nome da fonte ${i + 1}`} placeholder="Quem publicou e o quê (ex.: O País: …)"
                    onChange={(e) => mudarFonte(i, { ...f, nome: e.target.value })} className={CLASSE_CAMPO} />
                  <div className="flex gap-2">
                    <input value={f.url} type="url" aria-label={`Endereço da fonte ${i + 1}`} placeholder="https://…"
                      onChange={(e) => mudarFonte(i, { ...f, url: e.target.value })} className={`${CLASSE_CAMPO} py-1.5 text-sm text-white/75`} />
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" title="Abrir a fonte" aria-label={`Abrir ${f.nome}`}
                        className="grid w-9 shrink-0 place-items-center rounded-[var(--raio)] bg-white/[0.06] text-white/60 hover:text-white">
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    )}
                  </div>
                  <p className={`text-xs ${n ? "text-white/45" : "text-gold"}`}>
                    {n ? `Citada ${n} ${n === 1 ? "vez" : "vezes"} no guia.` : "Não é citada em nenhum texto (aparece na lista na mesma)."}
                  </p>
                </div>
                <span className="flex gap-1">
                  <AccaoIcone titulo="Subir" onClick={() => mover(i, -1)}><ArrowUp className="size-3.5" aria-hidden /></AccaoIcone>
                  <AccaoIcone titulo="Descer" onClick={() => mover(i, 1)}><ArrowDown className="size-3.5" aria-hidden /></AccaoIcone>
                  <AccaoIcone titulo="Apagar fonte" tom="perigo" onClick={() => apagar(i)}><Trash2 className="size-3.5" aria-hidden /></AccaoIcone>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <Grupo titulo="Nova fonte">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Input value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} placeholder="Nome (ex.: FIM: Federação Angolana…)" aria-label="Nome da nova fonte" />
          <Input value={nova.url} type="url" onChange={(e) => setNova({ ...nova, url: e.target.value })} placeholder="https://…" aria-label="Endereço da nova fonte" />
          <Botao variante="primario" onClick={juntar} disabled={!nova.nome.trim() || !nova.url.trim()}><Plus className="size-4" aria-hidden /> Juntar</Botao>
        </div>
      </Grupo>
    </div>
  );
}

/* ---------------- A modalidade ---------------- */

type Separador = "ficha" | "oque" | "classes" | "angola" | "fora" | "comecar" | "fontes";

const SEPARADORES: { chave: Separador; nome: string }[] = [
  { chave: "ficha", nome: "Ficha" },
  { chave: "oque", nome: "O que é" },
  { chave: "classes", nome: "Classes" },
  { chave: "angola", nome: "Em Angola" },
  { chave: "fora", nome: "Lá fora" },
  { chave: "comecar", nome: "Como começar" },
  { chave: "fontes", nome: "Fontes" },
];

const objecto = (v: unknown): Valor => (v && typeof v === "object" && !Array.isArray(v) ? (v as Valor) : {});

export function EditorModalidade({ dados, mudar }: { dados: Valor; mudar: (d: Valor) => void }) {
  const [sep, setSep] = useState<Separador>("ficha");
  const config = useConfigDesporto();
  const guia = objecto(dados.guia);
  const fontes = (Array.isArray(guia.fontes) ? guia.fontes : []) as Fonte[];
  const mudarGuia = (g: Valor) => mudar({ ...dados, guia: g });

  const esquemaFicha: CampoEsquema[] = [
    {
      tipo: "secao", titulo: "A modalidade", campos: [
        { tipo: "texto", chave: "nome", etiqueta: "Nome", obrigatorio: true, largura: "meia" },
        {
          tipo: "seleccao", chave: "grupo", etiqueta: "Onde aparece em Desporto", largura: "meia",
          opcoes: [
            { valor: "principal", nome: "Em destaque (a casa do campeonato)" },
            { valor: "competicao", nome: "Competição (cartão com as provas)" },
            { valor: "outras", nome: "Outras modalidades (só o guia)" },
          ],
          ajuda: "Só uma modalidade fica em destaque: a primeira com esta escolha. É a que reúne o campeonato.",
        },
        {
          tipo: "personalizado", chave: "slug", etiqueta: "Endereço",
          render: (v, m) => <CampoEndereco prefixo="/desporto" novo={!v} valor={String(v ?? "")} onChange={m} />,
        },
        { tipo: "area", chave: "descricao", etiqueta: "Descrição", linhas: 2,
          ajuda: "Uma linha que dá vontade de entrar: aparece no cartão em Desporto e no topo da página." },
        { tipo: "imagem", chave: "imagem", etiqueta: "Fotografia", ajuda: "Fundo do topo da página e do cartão. Ilustrativa." },
      ],
    },
    {
      tipo: "secao", titulo: "Competição na MotoBox", descricao: "O que liga a modalidade às provas, aos resultados e aos pilotos do site.", campos: [
        {
          tipo: "personalizado", chave: "disciplinas", etiqueta: "Disciplinas do calendário",
          render: (v, m) => (
            <EscolherVarios etiqueta="Disciplinas do calendário" valor={v} mudar={m} livre placeholder="Outra disciplina"
              opcoes={DISCIPLINAS_PROVA.filter((d) => d !== "Prova").map((d) => ({ valor: d, nome: d }))}
              ajuda="As provas destas disciplinas (em Provas) entram na página da modalidade. Sem nenhuma, a página fica só com o guia." />
          ),
        },
        {
          tipo: "personalizado", chave: "categorias", etiqueta: "Categorias de piloto",
          render: (v, m) => (
            <EscolherVarios etiqueta="Categorias de piloto" valor={v} mudar={m} livre placeholder="Outra categoria"
              opcoes={config.categorias.map((c) => ({ valor: c, nome: c }))}
              ajuda="Os pilotos destas categorias aparecem na página da modalidade." />
          ),
        },
      ],
    },
    {
      tipo: "objecto", chave: "guia", etiqueta: "Números do topo (sem provas)",
      ajuda: "Quando a modalidade não tem provas no calendário, o topo da página mostra estes números do guia em vez das contagens; o primeiro aparece também no cartão em Desporto.",
      campos: [
        {
          tipo: "lista", chave: "numeros", etiqueta: "Números", nomeItem: "número",
          resumo: (n) => [n.valor, n.label].filter(Boolean).join(" · "),
          novo: () => ({ valor: "", label: "" }),
          campos: [
            { tipo: "texto", chave: "valor", etiqueta: "Número", largura: "meia", placeholder: "2026" },
            { tipo: "texto", chave: "label", etiqueta: "O que conta", largura: "meia" },
          ],
        },
      ],
    },
  ];

  const parte = (esquema: CampoEsquema[], valor: Valor, aoMudar: (v: Valor) => void) => (
    <Formulario esquema={esquema} valor={valor} onChange={aoMudar} />
  );

  let corpo: ReactNode;
  switch (sep) {
    case "ficha": corpo = parte(esquemaFicha, dados, mudar); break;
    case "oque": corpo = parte(ESQUEMA_O_QUE_E, guia, mudarGuia); break;
    case "classes": corpo = parte(ESQUEMA_CLASSES, guia, mudarGuia); break;
    case "angola": corpo = parte(ESQUEMA_ANGOLA, objecto(guia.angola), (a) => mudarGuia({ ...guia, angola: a })); break;
    case "fora": corpo = parte(ESQUEMA_FORA, guia, mudarGuia); break;
    case "comecar": corpo = parte(ESQUEMA_COMECAR, objecto(guia.comecar), (c) => mudarGuia({ ...guia, comecar: c })); break;
    case "fontes": corpo = <EditorFontes guia={guia} mudar={mudarGuia} />; break;
  }

  return (
    <ContextoFontes.Provider value={fontes}>
      <div className="space-y-5">
        <Abas
          rotulo="Partes da modalidade"
          abas={SEPARADORES.map((s) => ({ ...s, contador: s.chave === "fontes" ? fontes.length : undefined }))}
          activa={sep}
          onChange={setSep}
        />
        {sep !== "ficha" && sep !== "fontes" && (
          <p className="text-[13px] leading-relaxed text-white/55">
            Partes vazias não aparecem na página. As fontes de cada texto escolhem-se pelo nome; a lista edita-se em Fontes.
          </p>
        )}
        {corpo}
      </div>
    </ContextoFontes.Provider>
  );
}
