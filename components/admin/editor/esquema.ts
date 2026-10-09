/* ============================================================
   MOTOBOX ADMIN — Esquema dos formulários
   Cada página de gestão descreve os campos de um documento e o
   <Formulario> constrói o formulário. Os campos que o esquema
   não conhece mantêm-se como estão (nada se perde ao gravar).

   Exemplo:
     const ESQUEMA: CampoEsquema[] = [
       { tipo: "texto", chave: "titulo", etiqueta: "Título", obrigatorio: true },
       { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 4 },
       { tipo: "imagem", chave: "foto", etiqueta: "Fotografia" },
       { tipo: "lista", chave: "passos", etiqueta: "Passos", nomeItem: "passo",
         resumo: (p) => String(p.titulo ?? ""), campos: [
           { tipo: "texto", chave: "titulo", etiqueta: "Título" },
           { tipo: "area", chave: "texto", etiqueta: "Texto" },
         ] },
     ];
   ============================================================ */

import type { ReactNode } from "react";

export type Valor = Record<string, unknown>;
export type Opcao = { valor: string; nome: string };

interface Base {
  /** Nome do campo no objecto. */
  chave: string;
  etiqueta: string;
  ajuda?: string;
  obrigatorio?: boolean;
  /** Largura na grelha de duas colunas (por omissão, a linha inteira). */
  largura?: "meia" | "inteira";
  /** Só aparece quando a função devolve verdadeiro (recebe o objecto inteiro). */
  mostrarSe?: (v: Valor) => boolean;
}

export type CampoEsquema =
  | (Base & { tipo: "texto" | "url" | "email" | "telefone"; placeholder?: string })
  | (Base & { tipo: "area"; linhas?: number; placeholder?: string })
  | (Base & { tipo: "numero"; min?: number; max?: number; passo?: number; placeholder?: string })
  | (Base & { tipo: "booleano"; descricao?: string })
  | (Base & { tipo: "seleccao"; opcoes: Opcao[] | (() => Opcao[]); vazio?: string })
  /** "data": AAAA-MM-DD. "datahora": ISO com o fuso de Luanda (+01:00). "hora": HH:MM. */
  | (Base & { tipo: "data" | "datahora" | "hora" })
  | (Base & { tipo: "imagem" | "video"; formato?: string })
  | (Base & { tipo: "cor" })
  /** Lista de textos curtos (ou parágrafos, com multilinha). */
  | (Base & { tipo: "lista-texto"; placeholder?: string; multilinha?: boolean })
  /** Lista de objectos, cada um com os seus campos; pode reordenar, duplicar e apagar. */
  | (Base & {
      tipo: "lista";
      campos: CampoEsquema[];
      /** Texto da linha recolhida de cada item. */
      resumo?: (item: Valor, indice: number) => string;
      /** Item novo em branco. */
      novo?: () => Valor;
      /** Ex.: "paragem" → "Juntar paragem". */
      nomeItem?: string;
    })
  /** Objecto dentro do objecto (ex.: redes: { instagram, facebook }). */
  | (Base & { tipo: "objecto"; campos: CampoEsquema[] })
  /** Texto em português e em inglês: { pt, en }. */
  | (Base & { tipo: "bi"; area?: boolean; linhas?: number })
  /** Lista de textos bilingues: [{ pt, en }, …]. */
  | (Base & { tipo: "lista-bi"; area?: boolean; nomeItem?: string })
  /** { lat, lng } (graus decimais), com ligação para ver no mapa. */
  | (Base & { tipo: "coordenadas" })
  /** Qualquer valor, em JSON (para estruturas raras). */
  | (Base & { tipo: "json"; linhas?: number })
  /** Campo com interface própria. */
  | (Base & {
      tipo: "personalizado";
      render: (valor: unknown, mudar: (v: unknown) => void, tudo: Valor) => ReactNode;
    })
  /** Caixa com título que agrupa campos do mesmo objecto (não cria um nível novo). */
  | { tipo: "secao"; titulo: string; descricao?: string; campos: CampoEsquema[]; chave?: undefined; mostrarSe?: (v: Valor) => boolean; largura?: undefined }
  /** Texto de ajuda solto no meio do formulário. */
  | { tipo: "nota"; texto: ReactNode; chave?: undefined; mostrarSe?: (v: Valor) => boolean; largura?: undefined };

/** Opções a partir de uma lista de textos. */
export const opcoes = (valores: readonly string[]): Opcao[] => valores.map((v) => ({ valor: v, nome: v }));
