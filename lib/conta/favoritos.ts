/* ============================================================
   MOTOBOX — Anúncios guardados
   A lista vive em `user_metadata.favoritos` da conta (ids de
   anúncios, os mais recentes primeiro), escrita por
   /api/conta/favoritos. O user_metadata também pode ser escrito
   pelo próprio utilizador com a chave pública, por isso a lista
   é sempre limpa antes de ser usada.

   Sem "server-only": o cliente usa os mesmos tipos e limites.
   ============================================================ */

/**
 * Máximo de anúncios guardados. O user_metadata viaja no token de
 * sessão e no cookie em cada pedido; 100 ids mantêm o cabeçalho
 * bem abaixo dos limites dos servidores.
 */
export const MAXIMO_FAVORITOS = 100;

/** Forma dos ids de anúncio (ex.: "mkt-001", "mkt-lz3k9a1b"). */
export const ID_ANUNCIO = /^[\w-]{1,64}$/;

/** Ids guardados na conta, sem repetidos nem lixo. */
export function favoritosDe(metadados: unknown): string[] {
  const lista = (metadados as { favoritos?: unknown } | null | undefined)?.favoritos;
  if (!Array.isArray(lista)) return [];
  const ids = lista.filter((x): x is string => typeof x === "string" && ID_ANUNCIO.test(x));
  return [...new Set(ids)].slice(0, MAXIMO_FAVORITOS);
}

/** O essencial de um anúncio guardado, para a lista na conta. */
export interface AnuncioGuardado {
  id: string;
  titulo: string;
  preco: number;
  negociavel: boolean;
  /** Chave ou endereço da primeira fotografia (vazio: gradiente de reserva). */
  imagem: string;
  categoria: string;
  estado: string;
  provincia: string;
  verificado: boolean;
}
