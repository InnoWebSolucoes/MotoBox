"use client";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA: texto das respostas
   Um subconjunto pequeno de Markdown (parágrafos, listas,
   negrito, código e ligações), sem HTML: o React escapa tudo.
   As ligações para o painel (/admin/…) abrem no mesmo
   separador; as externas, noutro.
   ============================================================ */

import Link from "next/link";
import type { ReactNode } from "react";

function emLinha(texto: string, chave: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    const k = `${chave}-${i++}`;
    if (m[1] !== undefined) partes.push(<strong key={k} className="font-semibold text-white">{m[1]}</strong>);
    else if (m[2] !== undefined) partes.push(<code key={k} className="rounded-[4px] bg-black/30 px-1 py-0.5 text-[0.85em]">{m[2]}</code>);
    else {
      const href = m[4];
      const classe = "text-mb-red-light underline decoration-mb-red-light/40 underline-offset-2 hover:decoration-mb-red-light";
      if (href.startsWith("/")) partes.push(<Link key={k} href={href} className={classe}>{m[3]}</Link>);
      else if (/^https?:\/\//.test(href)) partes.push(<a key={k} href={href} target="_blank" rel="noopener noreferrer" className={classe}>{m[3]}</a>);
      else partes.push(m[0]);
    }
    ultimo = re.lastIndex;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

export function Texto({ texto }: { texto: string }) {
  const blocos: ReactNode[] = [];
  const linhas = texto.replace(/\r/g, "").split("\n");
  let lista: { ordenada: boolean; itens: string[] } | null = null;
  let paragrafo: string[] = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) {
      const k = `p${blocos.length}`;
      blocos.push(<p key={k}>{emLinha(paragrafo.join(" "), k)}</p>);
      paragrafo = [];
    }
  };
  const fecharLista = () => {
    if (lista) {
      const k = `l${blocos.length}`;
      const itens = lista.itens.map((t, i) => <li key={i}>{emLinha(t, `${k}-${i}`)}</li>);
      blocos.push(lista.ordenada
        ? <ol key={k} className="list-decimal space-y-1 pl-5 marker:text-white/70">{itens}</ol>
        : <ul key={k} className="list-disc space-y-1 pl-5 marker:text-mb-red-light">{itens}</ul>);
      lista = null;
    }
  };

  for (const bruta of linhas) {
    const linha = bruta.trimEnd();
    const item = /^\s*(?:[-*•]|(\d+)[.)])\s+(.*)$/.exec(linha);
    const titulo = /^#{1,4}\s+(.*)$/.exec(linha);
    if (item) {
      fecharParagrafo();
      const ordenada = Boolean(item[1]);
      if (!lista || lista.ordenada !== ordenada) { fecharLista(); lista = { ordenada, itens: [] }; }
      lista.itens.push(item[2]);
    } else if (titulo) {
      fecharParagrafo(); fecharLista();
      const k = `t${blocos.length}`;
      blocos.push(<p key={k} className="font-semibold text-white">{emLinha(titulo[1], k)}</p>);
    } else if (linha.trim() === "") {
      fecharParagrafo(); fecharLista();
    } else {
      fecharLista();
      paragrafo.push(linha.trim());
    }
  }
  fecharParagrafo(); fecharLista();

  return <div className="space-y-2.5 break-words text-[15px] leading-relaxed text-white/85">{blocos}</div>;
}
