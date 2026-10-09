/* ============================================================
   MOTOBOX — Fórum: formas partilhadas (servidor e navegador)
   O que as páginas do fórum passam aos componentes: cartões de
   tópico já com votos, nível do autor e datas em ISO. Nada daqui
   leva o identificador da conta de ninguém para o navegador.
   ============================================================ */

import type { RespostaPublica } from "@/lib/forum/tipos";
import type { NivelForum } from "@/lib/conteudo/grupos/comunidade";

/** Ordens da lista de tópicos (o `?ordem=` do endereço). */
export const ORDENS = ["alta", "novos", "votados", "sem-resposta"] as const;
export type Ordem = (typeof ORDENS)[number];

export const eOrdem = (v: unknown): v is Ordem => typeof v === "string" && (ORDENS as readonly string[]).includes(v);

/** Quem escreve: nome, a cor e as iniciais do quadradinho, e a marca de nível. */
export interface AutorForum {
  nome: string;
  iniciais: string;
  cor: string;
  /** Logótipo da conta (pasta pública `avatares`), quando o houver. */
  avatar?: string;
  /** Nome do nível ("Motard"), ou a marca da equipa. */
  nivel?: string;
  equipa?: boolean;
  pontos?: number;
}

export interface CategoriaCartao {
  slug: string;
  nome: string;
  cor: string;
  icone: string;
}

/** Um tópico tal como aparece na lista. */
export interface TopicoCartao {
  id: string;
  titulo: string;
  excerto: string;
  categoria?: CategoriaCartao;
  autor: AutorForum;
  /** ISO; só a data ("2026-09-27") nos tópicos abertos no painel. */
  criado: string;
  /** ISO da última resposta (ou da abertura). */
  actividade: string;
  respostas: number;
  visualizacoes: number;
  votos: number;
  fixado: boolean;
  resolvido: boolean;
  bloqueado: boolean;
}

/** Uma resposta na página do tópico, com votos e a marca de quem a escreveu. */
export interface RespostaForum extends RespostaPublica {
  votos: number;
  nivel?: string;
  equipa?: boolean;
  /** Escrita por quem abriu o tópico. */
  eAutor?: boolean;
}

/** Linha de "Mais activos do mês". */
export interface Contribuidor {
  chave: string;
  autor: AutorForum;
  contagem: number;
}

/** Tópico de "Os meus tópicos" (só para quem o abriu). */
export interface MeuTopico {
  id: string;
  titulo: string;
  respostas: number;
  publicado: boolean;
}

/* ---------- Limites de um tópico novo (o formulário e a rota usam os mesmos) ---------- */

export const TITULO_MIN = 8;
export const TITULO_MAX = 140;
export const CORPO_MIN = 10;
/** O mesmo máximo de uma resposta: a mensagem de abertura é uma linha de `respostas_forum`. */
export const CORPO_MAX = 5000;

/* ---------- Ajudas ---------- */

/** Nível para um número de pontos: o degrau mais alto que já alcançou. */
export function nivelPara(pontos: number, lista: NivelForum[]): string | undefined {
  const ordenada = [...lista]
    .filter((n) => n && typeof n.nome === "string" && n.nome.trim())
    .sort((a, b) => (Number(a.minimo) || 0) - (Number(b.minimo) || 0));
  let nivel: string | undefined;
  for (const n of ordenada) if (pontos >= (Number(n.minimo) || 0)) nivel = n.nome.trim();
  return nivel;
}

/** Iniciais para o quadradinho do autor (até duas letras). */
export function iniciaisDe(nome: string): string {
  const partes = nome.replace(/[_.\-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const HEX = /^#([0-9a-f]{6})$/i;

/** Cor válida, ou a de partida. */
export const corOu = (cor: unknown, padrao = "#e10600") =>
  typeof cor === "string" && HEX.test(cor.trim()) ? cor.trim() : padrao;

/**
 * Texto legível sobre uma cor: branco nas cores escuras e médias (o vermelho
 * da marca incluído), quase preto nas muito claras (um amarelo, um branco).
 */
export function textoSobre(cor: string): string {
  const m = HEX.exec(cor.trim());
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
  // Contraste com branco vs. com quase preto (#141418, luminância ~0.007).
  return (1.05 / (l + 0.05)) >= ((l + 0.05) / 0.057) ? "#fff" : "#141418";
}
