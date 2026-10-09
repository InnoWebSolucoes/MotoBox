"use client";

/* ============================================================
   MOTOBOX ADMIN — Tabela de resultados de uma corrida
   Uma linha por piloto: posição, piloto (a equipa vem da ficha
   do piloto), voltas, tempo ou diferença, pontos, volta mais
   rápida e DNF/DNS/DSQ. Reordenar, renumerar, pontos automáticos
   e a pré-visualização do pódio, como aparece no site.
   ============================================================ */

import { useMemo } from "react";
import { ArrowDown, ArrowUp, ListOrdered, Plus, Timer, Trash2, Trophy } from "lucide-react";
import { AccaoIcone, Botao, CLASSE_CAMPO, Seleccao } from "@/components/admin/kit";
import type { Equipa, Piloto, ResultadoCorrida } from "@/lib/types";

/** Pontos do Mundial (MXGP): 25, 22, 20, 18, 16, 15 e um a menos por lugar até ao 20.º. */
const PONTOS_MUNDIAL = [25, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const ESTADOS: { valor: string; nome: string }[] = [
  { valor: "", nome: "Terminou" },
  { valor: "DNF", nome: "DNF · não terminou" },
  { valor: "DNS", nome: "DNS · não partiu" },
  { valor: "DSQ", nome: "DSQ · desclassificado" },
];

/** O vencedor: o piloto em 1.º lugar (sem DNF/DNS/DSQ). */
export function vencedorDe(resultados: ResultadoCorrida[]): string {
  return resultados.find((r) => r.posicao === 1 && !r.estado)?.piloto ?? "";
}

const classificados = (lista: ResultadoCorrida[]) => lista.filter((r) => !r.estado);

export function EditorResultados({
  valor, mudar, pilotos, equipas, categoria,
}: {
  valor: ResultadoCorrida[];
  mudar: (v: ResultadoCorrida[]) => void;
  pilotos: Piloto[];
  equipas: Equipa[];
  /** Categoria da corrida: os pilotos dela aparecem primeiro na lista. */
  categoria: string;
}) {
  const linhas = valor;
  const nomeEquipa = useMemo(() => new Map(equipas.map((e) => [e.slug, e.nome])), [equipas]);

  const opcoesPilotos = useMemo(() => {
    const ordenados = [...pilotos].sort((a, b) =>
      Number(b.categoria === categoria) - Number(a.categoria === categoria) || a.nome.localeCompare(b.nome));
    return [
      { valor: "", nome: "Escolher piloto…" },
      ...ordenados.map((p) => ({ valor: p.slug, nome: `#${p.numero} ${p.nome}${p.categoria ? ` · ${p.categoria}` : ""}` })),
      { valor: "__livre", nome: "Piloto sem ficha (escrever o nome)" },
    ];
  }, [pilotos, categoria]);

  const alterar = (i: number, campos: Partial<ResultadoCorrida>) =>
    mudar(linhas.map((r, j) => (j === i ? limpar({ ...r, ...campos }) : r)));

  const escolherPiloto = (i: number, slug: string) => {
    if (slug === "__livre") { alterar(i, { pilotoSlug: "", piloto: linhas[i].piloto || "Novo piloto", equipa: linhas[i].equipa || "" }); return; }
    const p = pilotos.find((x) => x.slug === slug);
    alterar(i, { pilotoSlug: slug, piloto: p?.nome ?? "", equipa: p ? (nomeEquipa.get(p.equipaSlug) ?? p.equipa) : "" });
  };

  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= linhas.length) return;
    const v = [...linhas];
    [v[i], v[j]] = [v[j], v[i]];
    mudar(v);
  };

  /** Posições pela ordem das linhas; quem tem DNF/DNS/DSQ passa para o fim, sem posição. */
  const renumerar = () => {
    const ok = classificados(linhas).map((r, i) => ({ ...r, posicao: i + 1 }));
    const fora = linhas.filter((r) => r.estado).map((r) => ({ ...r, posicao: 0 }));
    mudar([...ok, ...fora]);
  };

  const pontosAutomaticos = () =>
    mudar(linhas.map((r) => ({ ...r, pontos: r.estado || r.posicao < 1 ? 0 : PONTOS_MUNDIAL[r.posicao - 1] ?? 0 })));

  const juntar = () => {
    const ultima = classificados(linhas).reduce((m, r) => Math.max(m, r.posicao), 0);
    const primeiraVoltas = linhas[0]?.voltas ?? 0;
    mudar([...linhas, { posicao: ultima + 1, pilotoSlug: "", piloto: "", equipa: "", voltas: primeiraVoltas, tempo: "", pontos: 0 }]);
  };

  const ordenadas = [...classificados(linhas)].sort((a, b) => a.posicao - b.posicao);
  const podio = [ordenadas[1], ordenadas[0], ordenadas[2]];
  const repetidos = new Set(
    linhas.map((r) => r.pilotoSlug).filter((s, i, a) => s && a.indexOf(s) !== i),
  );
  const posRepetidas = new Set(
    classificados(linhas).map((r) => r.posicao).filter((p, i, a) => p > 0 && a.indexOf(p) !== i),
  );

  return (
    <div className="min-w-0 space-y-4">
      {/* ---------- Pódio ---------- */}
      <div className="rounded-[var(--raio)] border border-white/10 bg-black/20 p-4">
        <p className="mb-3 flex items-center gap-2 text-[13px] font-medium text-white/75">
          <Trophy className="size-4 text-mb-red-light" aria-hidden /> Pódio, como aparece no site
        </p>
        {ordenadas.length === 0 ? (
          <p className="text-sm text-white/75">Junte os pilotos à tabela para ver o pódio.</p>
        ) : (
          <ol className="grid grid-cols-3 items-end gap-[var(--intervalo)]">
            {podio.map((r, k) => {
              const lugar = k === 1 ? 1 : k === 0 ? 2 : 3;
              return (
                <li key={lugar} className={`flex min-w-0 flex-col justify-end rounded-[var(--raio)] p-3 ${
                  lugar === 1 ? "min-h-32 bg-mb-red" : lugar === 2 ? "min-h-24 bg-white/[0.12]" : "min-h-20 bg-white/[0.07]"}`}>
                  <span className="text-2xl font-semibold leading-none tabular-nums">{lugar}</span>
                  <span className="mt-2 truncate text-sm font-medium">{r?.piloto || "—"}</span>
                  <span className="truncate text-xs text-white/70">{r ? r.equipa : ""}</span>
                  <span className="truncate text-xs tabular-nums text-white/70">{r ? `${r.tempo} · ${r.pontos} pts` : ""}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* ---------- Ferramentas ---------- */}
      <div className="flex flex-wrap items-center gap-2">
        <Botao variante="primario" tamanho="sm" onClick={juntar}><Plus className="size-3.5" aria-hidden /> Juntar piloto</Botao>
        <Botao tamanho="sm" onClick={renumerar} disabled={linhas.length === 0}><ListOrdered className="size-3.5" aria-hidden /> Renumerar pela ordem</Botao>
        <Botao tamanho="sm" onClick={pontosAutomaticos} disabled={linhas.length === 0}>Pontos do Mundial (25, 22, 20…)</Botao>
        <span className="text-xs text-white/70">{linhas.length} {linhas.length === 1 ? "piloto" : "pilotos"}</span>
      </div>
      {(repetidos.size > 0 || posRepetidas.size > 0) && (
        <p role="status" className="rounded-[var(--raio)] border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-white/85">
          {repetidos.size > 0 && "Há um piloto repetido na tabela. "}
          {posRepetidas.size > 0 && "Há posições repetidas: use \"Renumerar pela ordem\"."}
        </p>
      )}

      {/* ---------- Linhas ---------- */}
      {linhas.length === 0 ? (
        <p className="rounded-[var(--raio)] border border-dashed border-white/15 px-4 py-8 text-center text-sm text-white/75">
          Sem pilotos. Use &quot;Juntar piloto&quot; para começar pela 1.ª posição.
        </p>
      ) : (
        <ol className="space-y-[var(--intervalo)]">
          {linhas.map((r, i) => {
            const livre = !r.pilotoSlug;
            return (
              <li key={i} className={`rounded-[var(--raio)] border border-white/10 bg-black/[0.18] p-3 ${r.estado ? "opacity-75" : ""}`}>
                <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-2 md:grid-cols-[3.5rem_minmax(0,1.4fr)_minmax(0,1fr)_auto]">
                  <label className="col-start-1 row-start-1 block">
                    <span className="sr-only">Posição</span>
                    <input
                      type="number" min={0} inputMode="numeric" value={r.estado ? "" : r.posicao || ""} disabled={Boolean(r.estado)}
                      placeholder={r.estado ? "NC" : "–"} aria-label={`Posição da linha ${i + 1}`}
                      onChange={(e) => alterar(i, { posicao: Number(e.target.value) || 0 })}
                      className={`${CLASSE_CAMPO} px-2 text-center font-semibold tabular-nums ${r.posicao === 1 && !r.estado ? "!border-mb-red" : ""}`}
                    />
                  </label>
                  <div className="col-start-2 row-start-1 min-w-0 space-y-2">
                    <Seleccao
                      valor={livre ? (r.piloto ? "__livre" : "") : r.pilotoSlug}
                      opcoes={!livre && !pilotos.some((p) => p.slug === r.pilotoSlug)
                        ? [...opcoesPilotos, { valor: r.pilotoSlug, nome: `${r.piloto} (ficha apagada)` }]
                        : opcoesPilotos}
                      aria-label={`Piloto da linha ${i + 1}`}
                      onChange={(v) => escolherPiloto(i, v)}
                    />
                    {livre && Boolean(r.piloto) && (
                      <input value={r.piloto} placeholder="Nome do piloto" aria-label="Nome do piloto"
                        onChange={(e) => alterar(i, { piloto: e.target.value })} className={CLASSE_CAMPO} />
                    )}
                  </div>
                  <input value={r.equipa} placeholder="Equipa" aria-label={`Equipa da linha ${i + 1}`} title="Equipa (vem da ficha do piloto)"
                    onChange={(e) => alterar(i, { equipa: e.target.value })}
                    className={`${CLASSE_CAMPO} col-span-2 col-start-2 row-start-2 text-white/80 md:col-span-1 md:col-start-3 md:row-start-1`} />
                  <span className="col-start-3 row-start-1 flex gap-1 pt-1.5 md:col-start-4">
                    <AccaoIcone titulo="Subir" onClick={() => mover(i, -1)}><ArrowUp className="size-3.5" aria-hidden /></AccaoIcone>
                    <AccaoIcone titulo="Descer" onClick={() => mover(i, 1)}><ArrowDown className="size-3.5" aria-hidden /></AccaoIcone>
                    <AccaoIcone titulo="Tirar da tabela" tom="perigo" onClick={() => mudar(linhas.filter((_, j) => j !== i))}>
                      <Trash2 className="size-3.5" aria-hidden />
                    </AccaoIcone>
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[5rem_minmax(0,1fr)_5rem_minmax(0,1.2fr)_auto]">
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] text-white/75">Voltas</span>
                    <input type="number" min={0} inputMode="numeric" value={r.voltas ?? 0}
                      onChange={(e) => alterar(i, { voltas: Number(e.target.value) || 0 })} className={`${CLASSE_CAMPO} py-1.5 tabular-nums`} />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] text-white/75">{r.posicao === 1 ? "Tempo total" : "Tempo ou diferença"}</span>
                    <input value={r.tempo} placeholder={r.posicao === 1 ? "31:24.118" : "+4.882"}
                      onChange={(e) => alterar(i, { tempo: e.target.value })} className={`${CLASSE_CAMPO} py-1.5 tabular-nums`} />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] text-white/75">Pontos</span>
                    <input type="number" min={0} inputMode="numeric" value={r.pontos ?? 0}
                      onChange={(e) => alterar(i, { pontos: Number(e.target.value) || 0 })} className={`${CLASSE_CAMPO} py-1.5 tabular-nums`} />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] text-white/75">Resultado</span>
                    <select value={r.estado ?? ""} aria-label="Terminou ou não"
                      onChange={(e) => {
                        const est = e.target.value as ResultadoCorrida["estado"] | "";
                        alterar(i, est ? { estado: est, posicao: 0, pontos: 0, tempo: r.tempo && !/^(DNF|DNS|DSQ)$/.test(r.tempo) ? r.tempo : est } : { estado: undefined, tempo: /^(DNF|DNS|DSQ)$/.test(r.tempo) ? "" : r.tempo });
                      }}
                      className={`${CLASSE_CAMPO} cursor-pointer py-1.5`}>
                      {ESTADOS.map((o) => <option key={o.valor} value={o.valor} className="bg-[#2c2c33]">{o.nome}</option>)}
                    </select>
                  </label>
                  <button
                    type="button" aria-pressed={Boolean(r.melhorVolta)}
                    onClick={() => mudar(linhas.map((x, j) => limpar({ ...x, melhorVolta: j === i ? !r.melhorVolta : false })))}
                    title="Volta mais rápida da corrida"
                    className={`col-span-2 mt-auto inline-flex h-[2.4rem] items-center justify-center gap-1.5 rounded-[var(--raio)] px-3 text-xs transition-colors sm:col-span-1 ${
                      r.melhorVolta ? "bg-mb-red text-white" : "bg-white/[0.07] text-white/70 hover:bg-white/[0.12]"}`}
                  >
                    <Timer className="size-3.5" aria-hidden /> Volta mais rápida
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** Sem campos opcionais vazios (melhorVolta falso, estado vazio), como nos dados de origem. */
function limpar(r: ResultadoCorrida): ResultadoCorrida {
  const x = { ...r };
  if (!x.melhorVolta) delete x.melhorVolta;
  if (!x.estado) delete x.estado;
  return x;
}
