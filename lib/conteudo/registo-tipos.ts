/* Tipos do registo de conteúdo editável (sem dados, para poder ser importado em todo o lado). */

/** Um documento solto: uma página ou um bloco do site. */
export interface DefDoc {
  /** Ex.: "paginas.sobre". */
  chave: string;
  titulo: string;
  /** Página do site onde aparece, para o botão "Ver no site". */
  pagina?: string;
  /** O conteúdo de partida, tal como estava no código. */
  padrao: () => unknown;
}

/** Um grupo de itens com a mesma forma: rotas, perfis de clubes, modalidades… */
export interface DefGrupo {
  /** Ex.: "rotas". */
  grupo: string;
  titulo: string;
  pagina?: (chave: string) => string;
  /** Os itens de partida, pela ordem em que aparecem no site. */
  padrao: () => { chave: string; titulo: string; dados: unknown }[];
}
