/* ============================================================
   MOTOBOX — Conteúdo editável: tipos partilhados
   Usados pelo servidor (leitura e API) e pelo painel de gestão.
   ============================================================ */

/** De onde vem o conteúdo que se está a ver. */
export type Origem = "base" | "codigo";

/** Um documento: uma página ou um item de um grupo (uma rota, um perfil de clube…). */
export interface Documento<T = unknown> {
  /** Chave do item dentro do grupo, ou chave completa de um documento solto. */
  chave: string;
  titulo: string;
  dados: T;
  origem: Origem;
  /** Data da última gravação na base de dados (ISO), quando a houver. */
  atualizado?: string;
}

/** Resposta da API para um grupo (rotas, perfis de clubes, modalidades…). */
export interface RespostaGrupo<T = unknown> {
  grupo: string;
  itens: Documento<T>[];
  /** Verdadeiro quando a lista já vive na base de dados (com ordem própria). */
  materializado: boolean;
  /** Verdadeiro quando não há base de dados e as gravações vão para um ficheiro local. */
  local?: boolean;
}

export interface RespostaDoc<T = unknown> extends Documento<T> {
  local?: boolean;
}

/** Ficheiro carregado na biblioteca de imagens e vídeos. */
export interface FicheiroMedia {
  caminho: string;
  url: string;
  nome: string;
  tipo: "imagem" | "video";
  tamanho?: number;
  criado?: string;
}

/** Chave válida: letras minúsculas, números, hífen e ponto. */
export const CHAVE_VALIDA = /^[a-z0-9][a-z0-9.-]*$/;
