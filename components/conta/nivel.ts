/* ============================================================
   MOTOBOX — Área de membro: pontos e nível
   Os pontos saem do que a pessoa já fez no site (perfil, anúncios,
   fórum, garagem, clubes e marcas). Os valores de cada acção e os
   nomes dos níveis editam-se em Definições → Área de membro.
   ============================================================ */

import {
  ACCOES_PONTOS, CONTA_PADRAO, type AccaoPontos, type ConteudoConta, type NivelMembro,
} from "@/lib/conteudo/grupos/contas";

export type Contagens = Record<AccaoPontos, number>;

export interface Nivel {
  pontos: number;
  actual: NivelMembro;
  indice: number;
  proximo: NivelMembro | null;
  /** 0 a 1, do nível actual até ao próximo. */
  progresso: number;
}

/** Níveis válidos, do mais baixo para o mais alto; sem nenhum, os de partida. */
export function niveisDe(t: ConteudoConta): NivelMembro[] {
  const lista = (Array.isArray(t.niveis) ? t.niveis : [])
    .filter((n) => n && typeof n.nome === "string" && n.nome.trim() && Number.isFinite(Number(n.pontos)))
    .map((n) => ({ nome: n.nome.trim(), pontos: Math.max(0, Number(n.pontos)) }))
    .sort((a, b) => a.pontos - b.pontos);
  if (!lista.length) return CONTA_PADRAO.niveis;
  // O primeiro nível começa sempre no zero.
  return [{ ...lista[0], pontos: 0 }, ...lista.slice(1)];
}

export function valorDe(t: ConteudoConta, accao: AccaoPontos): number {
  const v = Number(t.pontos?.valores?.[accao]);
  return Number.isFinite(v) && v >= 0 ? v : CONTA_PADRAO.pontos.valores[accao];
}

export function calcularNivel(t: ConteudoConta, c: Contagens): Nivel {
  const pontos = ACCOES_PONTOS.reduce((soma, a) => soma + valorDe(t, a) * (c[a] ?? 0), 0);
  const niveis = niveisDe(t);
  let indice = 0;
  niveis.forEach((n, i) => { if (pontos >= n.pontos) indice = i; });
  const actual = niveis[indice];
  const proximo = niveis[indice + 1] ?? null;
  const progresso = proximo ? Math.min(1, (pontos - actual.pontos) / Math.max(1, proximo.pontos - actual.pontos)) : 1;
  return { pontos, actual, indice, proximo, progresso };
}
