/**
 * Fotografia de um evento ou de um artigo, por ordem de preferência.
 *
 * Por omissão, a fotografia própria do endereço da página (lib/imagens.ts,
 * POR_SLUG) vem primeiro e o campo `imagem` serve de reserva, como sempre foi.
 * Uma fotografia carregada ou colada no painel (https://… ou /…) passa à
 * frente: é a escolha explícita da equipa para aquela página.
 */
export function fotoDe(slug: string, imagem?: string): (string | undefined)[] {
  return imagem && /^(https:\/\/|\/)/.test(imagem) ? [imagem, slug] : [slug, imagem];
}
