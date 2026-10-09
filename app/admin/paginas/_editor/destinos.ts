/* ============================================================
   MOTOBOX ADMIN — Onde se edita cada documento do site
   As páginas do site editam-se em Páginas; a entrada e o painel
   Explorar em Entrada e painel; os textos comuns das páginas
   legais em Páginas legais; e a página de cada secção (Clubes,
   Eventos, Artigos…) dentro da própria secção, no separador
   "Página".
   ============================================================ */

export interface Destino {
  /** Endereço da gestão onde o documento se edita. */
  href: string;
  /** Onde fica, em palavras (para a lista de páginas). */
  onde: string;
  /** O que o documento contém, em poucas palavras. */
  resumo: string;
}

export const DESTINOS: Record<string, Destino> = {
  "site.entrada": { href: "/admin/site?aba=entrada", onde: "Entrada e painel", resumo: "A frase da página inicial e o vídeo de fundo de todo o site." },
  "site.contagem": { href: "/admin/site?aba=contagem", onde: "Entrada e painel", resumo: "A contagem decrescente do painel Explorar." },
  "site.painel": { href: "/admin/site?aba=painel", onde: "Entrada e painel", resumo: "Os textos e as fotografias fixos dos mosaicos do painel Explorar." },
  "paginas.sobre": { href: "/admin/paginas?doc=paginas.sobre", onde: "Páginas", resumo: "História, números, equipa e o que o site oferece." },
  "paginas.contacto": { href: "/admin/paginas?doc=paginas.contacto", onde: "Páginas", resumo: "O texto da página e os textos do formulário de contacto." },
  "paginas.seguranca": { href: "/admin/paginas?doc=paginas.seguranca", onde: "Páginas", resumo: "O guia de segurança, nas 11 secções, com fontes." },
  "paginas.marketplace-importar": { href: "/admin/paginas?doc=paginas.marketplace-importar", onde: "Páginas", resumo: "O guia de importação e o formulário de pedido." },
  "paginas.legais": { href: "/admin/legais?aba=textos", onde: "Páginas legais", resumo: "Os textos que se repetem em todas as páginas legais." },
  "paginas.clubes": { href: "/admin/clubes?aba=pagina", onde: "Clubes e movimentos", resumo: "O topo e os textos fixos da página Clubes." },
  "paginas.eventos": { href: "/admin/eventos?aba=pagina", onde: "Eventos", resumo: "O topo e os textos fixos da página Eventos." },
  "paginas.artigos": { href: "/admin/noticias?aba=pagina", onde: "Artigos", resumo: "O topo e os textos fixos da página Artigos." },
  "paginas.rotas": { href: "/admin/rotas?aba=pagina", onde: "Rotas", resumo: "O topo da página Rotas e o que é comum a todas as rotas." },
  "paginas.desporto": { href: "/admin/modalidades?aba=pagina", onde: "Modalidades", resumo: "O topo e os textos fixos da página Desporto." },
  "paginas.marketplace": { href: "/admin/marketplace?aba=pagina", onde: "Marketplace", resumo: "O topo e os textos fixos da página Marketplace." },
  "paginas.forum": { href: "/admin/forum?aba=pagina", onde: "Fórum", resumo: "O topo e os textos fixos da página Fórum." },
  "desporto.equipas": { href: "/admin/equipas", onde: "Equipas", resumo: "As fotografias de capa das equipas." },
  "site.geral": { href: "/admin/site?aba=geral", onde: "Entrada e painel", resumo: "Rodapé, botão de acção, página 404, aviso de cookies, manutenção e newsletter." },
  "site.emails": { href: "/admin/definicoes?aba=emails", onde: "Definições", resumo: "Para onde vão os emails do site, o remetente e o texto de cada email." },
  "site.contas": { href: "/admin/definicoes?aba=contas", onde: "Definições", resumo: "Os textos de entrar, criar conta e recuperar a palavra-passe." },
  "campeonato.calendario": { href: "/admin/provas?aba=paginas&doc=calendario", onde: "Provas", resumo: "Os textos fixos do calendário e da página de cada prova." },
  "campeonato.resultados": { href: "/admin/provas?aba=paginas&doc=resultados", onde: "Provas", resumo: "Os textos fixos dos resultados." },
  "campeonato.classificacao": { href: "/admin/provas?aba=paginas&doc=classificacao", onde: "Provas", resumo: "Os textos fixos da classificação." },
  "campeonato.pilotos": { href: "/admin/provas?aba=paginas&doc=pilotos", onde: "Provas", resumo: "Os textos fixos da lista e da ficha de cada piloto." },
  "campeonato.equipas": { href: "/admin/provas?aba=paginas&doc=equipas", onde: "Provas", resumo: "Os textos fixos da lista e da página de cada equipa." },
  "campeonato.bilhetes": { href: "/admin/provas?aba=paginas&doc=bilhetes", onde: "Provas", resumo: "Os textos fixos da bilheteira." },
  "campeonato.compra": { href: "/admin/provas?aba=paginas&doc=compra", onde: "Provas", resumo: "A compra de bilhetes e os meios de pagamento." },
};

/** Listas de itens (grupos) e a secção onde se editam. */
export const DESTINOS_GRUPOS: Record<string, { href: string; onde: string }> = {
  rotas: { href: "/admin/rotas", onde: "Rotas" },
  modalidades: { href: "/admin/modalidades", onde: "Modalidades" },
  "clubes-perfis": { href: "/admin/clubes", onde: "Clubes e movimentos" },
  "eventos-extra": { href: "/admin/eventos", onde: "Eventos" },
};

/** Onde se edita um documento: o destino conhecido, ou o formulário automático em Páginas. */
export const destinoDe = (chave: string): Destino =>
  DESTINOS[chave] ?? { href: `/admin/paginas?doc=${encodeURIComponent(chave)}`, onde: "Páginas", resumo: "" };
