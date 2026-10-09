"use client";

/* ============================================================
   MOTOBOX ADMIN — Peças partilhadas pelas páginas da comunidade
   (marketplace, fórum, moderação, mensagens, utilizadores…).
   ============================================================ */

import type { ReactNode } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { AccaoIcone, Botao, Seta } from "@/components/admin/kit";
import { CampoImagem, previsualizacao } from "@/components/admin/Media";
import { iniciais } from "./formato";

/** Fotografia pequena de uma lista (chave do site, endereço ou caminho). */
export function Miniatura({ valor, className = "size-11" }: { valor?: string; className?: string }) {
  const url = valor ? previsualizacao(valor, 160) : null;
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-[4px] bg-white/[0.07] ${className}`}>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      )}
    </span>
  );
}

/** Quadradinho com iniciais na cor da pessoa (autores, utilizadores). */
export function Avatar({ nome, cor, texto, className = "size-9 text-xs" }: {
  nome?: string; cor?: string; texto?: string; className?: string;
}) {
  return (
    <span aria-hidden
      className={`grid shrink-0 place-items-center rounded-[4px] font-semibold text-white ${className}`}
      style={{ background: cor || "#e10600" }}>
      {texto || iniciais(nome ?? "")}
    </span>
  );
}

/** Várias fotografias, por ordem: a primeira é a capa. */
export function ListaImagens({
  valores, onChange, etiqueta = "Fotografias", ajuda, maximo = 12,
}: {
  valores: string[]; onChange: (v: string[]) => void;
  etiqueta?: string; ajuda?: ReactNode; maximo?: number;
}) {
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= valores.length) return;
    const v = [...valores];
    [v[i], v[j]] = [v[j], v[i]];
    onChange(v);
  };
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-white/75">
          {etiqueta} <span className="ml-1 text-white/40">{valores.length}</span>
        </span>
      </div>
      {ajuda && <p className="mb-3 text-xs leading-relaxed text-white/50">{ajuda}</p>}
      <ol className="grid gap-3 md:grid-cols-2">
        {valores.map((v, i) => (
          <li key={i} className="min-w-0 rounded-[var(--raio)] border border-white/10 bg-black/[0.18] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs text-white/60">
                {i === 0 ? "Capa" : `Fotografia ${i + 1}`}
              </span>
              <span className="flex gap-1">
                <AccaoIcone titulo="Mais para a frente" onClick={() => mover(i, -1)}><Seta para="cima" /></AccaoIcone>
                <AccaoIcone titulo="Mais para trás" onClick={() => mover(i, 1)}><Seta para="baixo" /></AccaoIcone>
                <AccaoIcone titulo="Tirar esta fotografia" tom="perigo" onClick={() => onChange(valores.filter((_, j) => j !== i))}>
                  <Trash2 className="size-3.5" aria-hidden />
                </AccaoIcone>
              </span>
            </div>
            <CampoImagem
              etiqueta={i === 0 ? "Fotografia de capa" : `Fotografia ${i + 1}`}
              valor={v} formato="aspect-[4/3]"
              onChange={(nova) => onChange(valores.map((x, j) => (j === i ? nova : x)))}
            />
          </li>
        ))}
      </ol>
      {valores.length < maximo && (
        <Botao className="mt-3" onClick={() => onChange([...valores, ""])}>
          <ImagePlus className="size-4" aria-hidden />
          Juntar fotografia
        </Botao>
      )}
    </div>
  );
}

/** Escolha de um ícone, mostrando os ícones (em vez de nomes técnicos). */
export function EscolhaIcone({
  etiqueta, valor, onChange, opcoes, ajuda,
}: {
  etiqueta: string; valor: string; onChange: (v: string) => void;
  opcoes: { valor: string; nome: string; icone: ReactNode }[]; ajuda?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-[13px] font-medium text-white/75">{etiqueta}</span>
      <div role="radiogroup" aria-label={etiqueta} className="flex flex-wrap gap-1.5">
        {opcoes.map((o) => (
          <button
            key={o.valor} type="button" role="radio" aria-checked={valor === o.valor}
            title={o.nome} aria-label={o.nome} onClick={() => onChange(o.valor)}
            className={`grid size-10 place-items-center rounded-[var(--raio)] transition-colors [&_svg]:size-[1.15rem] ${
              valor === o.valor ? "bg-mb-red text-white" : "bg-white/[0.07] text-white/70 hover:bg-white/[0.14] hover:text-white"
            }`}
          >
            {o.icone}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-white/50">
        {opcoes.find((o) => o.valor === valor)?.nome ?? "Nenhum escolhido"}
        {ajuda ? <> · {ajuda}</> : null}
      </p>
    </div>
  );
}

/** Linha "rótulo: valor" de uma ficha de leitura dentro da gaveta. */
export function Ficha({ linhas }: { linhas: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-white/[0.07] overflow-hidden rounded-[var(--raio)] border border-white/10 bg-black/[0.15]">
      {linhas.map(([k, v]) => (
        <div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 px-4 py-2.5 text-sm">
          <dt className="text-white/55">{k}</dt>
          <dd className="min-w-0 text-right text-white [overflow-wrap:anywhere]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
