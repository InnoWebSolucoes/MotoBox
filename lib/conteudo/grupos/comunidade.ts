/* ============================================================
   Conteúdo editável — Comunidade: as entradas das secções
   Marketplace e Fórum (textos fixos das páginas). Os anúncios,
   tópicos, respostas e categorias vivem nas suas tabelas.

   O texto de partida é exactamente o que as páginas mostravam
   antes de passarem a ser editáveis: sem nada gravado no painel,
   o site fica igual.
   ============================================================ */

import type { DefDoc, DefGrupo } from "../registo-tipos";

/* ---------------- Ajuda ---------------- */

const eObjecto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * O documento gravado por cima do de partida, com dois níveis: cada bloco
 * (abertura, lista, anúncio…) também fica completo. Assim, um campo novo
 * acrescentado ao código aparece mesmo num documento gravado antes dele.
 */
export function comPadrao<T>(gravado: unknown, padrao: T): T {
  if (!eObjecto(gravado)) return padrao;
  const saida: Record<string, unknown> = { ...(padrao as Record<string, unknown>) };
  for (const [k, v] of Object.entries(gravado)) {
    if (v === undefined || v === null) continue;
    const p = saida[k];
    saida[k] = eObjecto(p) && eObjecto(v) ? { ...p, ...v } : v;
  }
  return saida as T;
}

/** Abertura em fotografia de uma secção (sobretítulo, título, texto e botão). */
export interface AberturaSeccao {
  sobretitulo: string;
  titulo: string;
  texto: string;
  /** Fotografia de fundo: chave das fotografias do site ou endereço. */
  foto: string;
  botao: string;
  botaoLigacao: string;
}

/** Título e descrição para o Google e para as partilhas. */
export interface Seo {
  titulo: string;
  descricao: string;
}

/* ---------------- Marketplace ---------------- */

/** Ícones possíveis nos cartões de "Como funciona a verificação". */
export const ICONES_VERIFICACAO = ["selo", "estrela", "escudo", "utilizador", "telefone", "documento", "aperto"] as const;
export type IconeVerificacao = (typeof ICONES_VERIFICACAO)[number];

export interface ConteudoMarketplace {
  seo: Seo;
  abertura: AberturaSeccao;
  lista: {
    todas: string;
    todasProvincias: string;
    recentes: string;
    precoMenor: string;
    precoMaior: string;
    maisVistos: string;
    procurar: string;
    umAnuncio: string;
    variosAnuncios: string;
    negociavel: string;
    precoFixo: string;
    vazioTitulo: string;
    vazioTexto: string;
  };
  importar: {
    mostrar: boolean;
    sobretitulo: string;
    titulo: string;
    texto: string;
    foto: string;
    ligacao: string;
  };
  verificacao: {
    mostrar: boolean;
    titulo: string;
    cartoes: { icone: IconeVerificacao | string; titulo: string; texto: string }[];
  };
  anuncio: {
    voltar: string;
    descricao: string;
    ficha: string;
    precoNegociavel: string;
    precoFixo: string;
    visualizacoes: string;
    vendedor: string;
    membroDesde: string;
    anuncios: string;
    avaliacao: string;
    semAvaliacoes: string;
    aviso: string;
    denunciar: string;
    semelhantes: string;
    mensagemContacto: string;
  };
}

export const MARKETPLACE_PADRAO: ConteudoMarketplace = {
  seo: {
    titulo: "Marketplace",
    descricao:
      "Compra e venda de motas, peças e equipamento em Angola, entre motards. Vendedores verificados pela MotoBox.",
  },
  abertura: {
    sobretitulo: "Entre motards",
    titulo: "Marketplace",
    texto:
      "Motas, peças e equipamento de quem anda de mota, para quem anda de mota. Os vendedores com o selo foram verificados pela equipa.",
    foto: "banner-marketplace",
    botao: "Publicar um anúncio",
    botaoLigacao: "/conta#anuncios",
  },
  lista: {
    todas: "Todas",
    todasProvincias: "Todas as províncias",
    recentes: "Mais recentes",
    precoMenor: "Preço: menor primeiro",
    precoMaior: "Preço: maior primeiro",
    maisVistos: "Mais vistos",
    procurar: "Marca, modelo...",
    umAnuncio: "anúncio",
    variosAnuncios: "anúncios",
    negociavel: "Negociável",
    precoFixo: "Preço fixo",
    vazioTitulo: "Nenhum anúncio encontrado",
    vazioTexto: "Alargue os filtros ou tente outra pesquisa.",
  },
  importar: {
    mostrar: true,
    sobretitulo: "Novo",
    titulo: "Importar do estrangeiro",
    texto:
      "Peças, equipamento ou uma mota que não se encontra em Angola? Diga-nos o que procura e ajudamos a trazê-lo de lojas de Portugal, Espanha e de outros países.",
    foto: "banner-importar",
    ligacao: "/marketplace/importar",
  },
  verificacao: {
    mostrar: true,
    titulo: "Como funciona a verificação",
    cartoes: [
      {
        icone: "selo",
        titulo: "Vendedor verificado",
        texto: "A equipa confirma a identidade e o contacto de cada vendedor antes de lhe dar o selo.",
      },
      {
        icone: "estrela",
        titulo: "Histórico e avaliações",
        texto: "Cada vendedor tem um histórico público de anúncios e a avaliação de quem já lhe comprou.",
      },
      {
        icone: "escudo",
        titulo: "Sem pagamentos na plataforma",
        texto: "A MotoBox não intermedeia pagamentos. Veja a mota e os documentos antes de pagar, num sítio público.",
      },
    ],
  },
  anuncio: {
    voltar: "Marketplace",
    descricao: "Descrição",
    ficha: "Ficha técnica",
    precoNegociavel: "Preço negociável",
    precoFixo: "Preço fixo",
    visualizacoes: "visualizações",
    vendedor: "Vendedor",
    membroDesde: "Membro desde",
    anuncios: "Anúncios",
    avaliacao: "Avaliação",
    semAvaliacoes: "Sem avaliações",
    aviso:
      "A MotoBox não intermedeia pagamentos. Veja a mota e os documentos antes de pagar, combine o encontro num sítio público e desconfie de preços muito abaixo do mercado.",
    denunciar: "Denunciar este anúncio",
    semelhantes: "Anúncios semelhantes",
    mensagemContacto: "Olá, ainda tem este anúncio disponível?",
  },
};

/* ---------------- Fórum ---------------- */

export interface ConteudoForum {
  seo: Seo;
  abertura: AberturaSeccao;
  lista: {
    todas: string;
    fixado: string;
    resolvido: string;
    fechado: string;
    vazioTitulo: string;
    vazioTexto: string;
  };
  lateral: {
    categorias: string;
    regrasTitulo: string;
    regras: string[];
    regulamento: string;
    regulamentoLigacao: string;
  };
  topico: {
    voltar: string;
    autorDoTopico: string;
    visualizacoes: string;
    respostaSingular: string;
    respostaPlural: string;
    semRespostas: string;
    reportar: string;
    fechadoTitulo: string;
    fechadoTexto: string;
    forumFechadoTitulo: string;
    forumFechadoTexto: string;
    relacionados: string;
  };
  resposta: {
    titulo: string;
    placeholder: string;
    publicar: string;
    aPublicar: string;
    publicada: string;
    aResponderComo: string;
    semSessao: string;
  };
}

export const FORUM_PADRAO: ConteudoForum = {
  seo: {
    titulo: "Fórum",
    descricao:
      "O fórum da comunidade motard angolana: passeios e viagens, mecânica, equipamento, primeira mota, clubes e conversa geral.",
  },
  abertura: {
    sobretitulo: "Comunidade",
    titulo: "Fórum",
    texto:
      "Onde quem anda de mota em Angola conversa: dúvidas de mecânica, passeios por organizar, a primeira mota e tudo o resto.",
    foto: "banner-forum",
    botao: "Abrir um tópico",
    botaoLigacao: "/conta",
  },
  lista: {
    todas: "Todas",
    fixado: "Fixado",
    resolvido: "Resolvido",
    fechado: "Fechado",
    vazioTitulo: "Ainda não há tópicos nesta categoria",
    vazioTexto: "Comece a conversa: abra o primeiro.",
  },
  lateral: {
    categorias: "Categorias",
    regrasTitulo: "Regras da casa",
    regras: [
      "Respeito em primeiro lugar. Sem insultos.",
      "Sem publicidade não autorizada.",
      "Vendas só no Marketplace.",
      "Pesquise antes de abrir um tópico novo.",
      "Sem conteúdo fora do tema motard.",
    ],
    regulamento: "Regulamento da comunidade",
    regulamentoLigacao: "/regulamento",
  },
  topico: {
    voltar: "Fórum",
    autorDoTopico: "Autor do tópico",
    visualizacoes: "visualizações",
    respostaSingular: "resposta",
    respostaPlural: "respostas",
    semRespostas: "Ainda sem respostas. Seja o primeiro a ajudar.",
    reportar: "Reportar",
    fechadoTitulo: "Tópico fechado",
    fechadoTexto: "Este tópico não aceita novas respostas.",
    forumFechadoTitulo: "Fórum fechado",
    forumFechadoTexto: "De momento o fórum não aceita novas respostas.",
    relacionados: "Tópicos relacionados",
  },
  resposta: {
    titulo: "Responder",
    placeholder: "Escreva a sua resposta…",
    publicar: "Publicar resposta",
    aPublicar: "A publicar…",
    publicada: "Resposta publicada.",
    aResponderComo: "A responder como",
    semSessao: "Ao publicar, pedimos que entre ou crie conta.",
  },
};

/* ---------------- Registo ---------------- */

export const DOCS: DefDoc[] = [
  { chave: "paginas.marketplace", titulo: "Marketplace (página da secção)", pagina: "/marketplace", padrao: () => MARKETPLACE_PADRAO },
  { chave: "paginas.forum", titulo: "Fórum (página da secção)", pagina: "/forum", padrao: () => FORUM_PADRAO },
];

export const GRUPOS: DefGrupo[] = [];
