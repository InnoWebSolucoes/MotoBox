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

/** Um degrau dos níveis dos membros: a partir de `minimo` pontos. */
export interface NivelForum {
  nome: string;
  minimo: number;
}

/** Ligação da coluna do fórum (clubes, eventos…). */
export interface LigacaoForum {
  texto: string;
  ligacao: string;
}

export interface ConteudoForum {
  seo: Seo;
  abertura: AberturaSeccao;
  /** Os números por baixo do título (tópicos, respostas, membros). */
  numeros: {
    mostrar: boolean;
    topicos: string;
    respostas: string;
    membros: string;
  };
  lista: {
    todas: string;
    fixado: string;
    resolvido: string;
    fechado: string;
    vazioTitulo: string;
    vazioTexto: string;
    vazioBotao: string;
    ordenar: string;
    emAlta: string;
    novos: string;
    maisVotados: string;
    semResposta: string;
    procurar: string;
    procurarBotao: string;
    resultadosPara: string;
    limpar: string;
    destaques: string;
    convite: string;
    criar: string;
    primeiroResponder: string;
    verMais: string;
    votar: string;
    votarResposta: string;
    retirarVoto: string;
    votos: string;
    semRespostaVazioTitulo: string;
    semRespostaVazioTexto: string;
    procuraVaziaTitulo: string;
    procuraVaziaTexto: string;
  };
  lateral: {
    sobreTitulo: string;
    sobreTexto: string;
    criar: string;
    categorias: string;
    contribuidoresTitulo: string;
    contribuidoresTexto: string;
    contribuidoresVazio: string;
    contribuicoes: string;
    meusTitulo: string;
    meusVazio: string;
    meusAguarda: string;
    regrasTitulo: string;
    regras: string[];
    regulamento: string;
    regulamentoLigacao: string;
    ligacoesTitulo: string;
    ligacoes: LigacaoForum[];
  };
  /** Níveis dos membros, pela actividade no fórum. */
  niveis: {
    mostrar: boolean;
    titulo: string;
    texto: string;
    pontos: string;
    lista: NivelForum[];
    /** Marca de quem fala pela MotoBox (tópicos abertos pela equipa no painel). */
    equipa: string;
    nomesEquipa: string[];
    /** Marca do autor do tópico, nas respostas que ele próprio escreve. */
    autor: string;
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
    responder: string;
    partilhar: string;
    resolvidoTitulo: string;
    resolvidoTexto: string;
    primeiroTitulo: string;
    primeiroTexto: string;
    primeiroBotao: string;
    sobreTitulo: string;
    criado: string;
    ultimaActividade: string;
    participantes: string;
    criarTitulo: string;
    criarTexto: string;
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
  /** A página /forum/novo, onde os membros abrem tópicos. */
  novo: {
    seoTitulo: string;
    sobretitulo: string;
    titulo: string;
    texto: string;
    campoTitulo: string;
    tituloPlaceholder: string;
    tituloAjuda: string;
    campoCategoria: string;
    campoCorpo: string;
    corpoPlaceholder: string;
    corpoAjuda: string;
    publicar: string;
    aPublicar: string;
    aPublicarComo: string;
    semSessao: string;
    aguardaTitulo: string;
    aguardaTexto: string;
    dicasTitulo: string;
    dicas: string[];
    fechadoTitulo: string;
    fechadoTexto: string;
  };
  /** Regras de funcionamento dos tópicos abertos pelos membros. */
  moderacao: {
    /** Ligado, os tópicos novos ficam escondidos até a equipa os mostrar no painel. */
    aprovarTopicos: boolean;
    /** Máximo de tópicos que cada membro abre por hora. */
    topicosPorHora: number;
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
    botao: "Criar tópico",
    botaoLigacao: "/forum/novo",
  },
  numeros: {
    mostrar: true,
    topicos: "tópicos",
    respostas: "respostas",
    membros: "membros activos",
  },
  lista: {
    todas: "Todas",
    fixado: "Fixado",
    resolvido: "Resolvido",
    fechado: "Fechado",
    vazioTitulo: "Ainda não há tópicos nesta categoria",
    vazioTexto: "Comece a conversa: o primeiro tópico de uma categoria é o que mais gente lê.",
    vazioBotao: "Abrir o primeiro tópico",
    ordenar: "Ordenar os tópicos",
    emAlta: "Em alta",
    novos: "Novos",
    maisVotados: "Mais votados",
    semResposta: "Sem resposta",
    procurar: "Procurar no fórum…",
    procurarBotao: "Procurar",
    resultadosPara: "Resultados para",
    limpar: "Limpar",
    destaques: "Fixados pela equipa",
    convite: "Tem uma dúvida, um passeio ou uma história? Partilhe com a comunidade.",
    criar: "Criar tópico",
    primeiroResponder: "Seja o primeiro a responder",
    verMais: "Ver mais tópicos",
    votar: "Votar neste tópico",
    votarResposta: "Votar nesta resposta",
    retirarVoto: "Retirar o voto",
    votos: "votos",
    semRespostaVazioTitulo: "Todos os tópicos têm resposta",
    semRespostaVazioTexto: "A comunidade está em dia. Que tal abrir um tópico novo?",
    procuraVaziaTitulo: "Nada encontrado",
    procuraVaziaTexto: "Experimente outras palavras ou abra um tópico com a sua pergunta.",
  },
  lateral: {
    sobreTitulo: "Sobre o fórum",
    sobreTexto:
      "A conversa da comunidade motard angolana. Pergunte, ajude, combine passeios e partilhe o que aprendeu na estrada.",
    criar: "Criar tópico",
    categorias: "Categorias",
    contribuidoresTitulo: "Mais activos do mês",
    contribuidoresTexto: "Quem mais participou nos últimos 30 dias.",
    contribuidoresVazio: "Ainda ninguém este mês. Responda a um tópico e o seu nome aparece aqui.",
    contribuicoes: "contribuições",
    meusTitulo: "Os meus tópicos",
    meusVazio: "Ainda não abriu nenhum tópico.",
    meusAguarda: "À espera de aprovação",
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
    ligacoesTitulo: "Pela comunidade",
    ligacoes: [
      { texto: "Clubes e grupos", ligacao: "/clubes" },
      { texto: "Eventos e passeios", ligacao: "/eventos" },
      { texto: "Rotas por Angola", ligacao: "/rotas" },
      { texto: "Marketplace", ligacao: "/marketplace" },
    ],
  },
  niveis: {
    mostrar: true,
    titulo: "Níveis dos membros",
    texto: "Cada resposta vale 1 ponto, cada tópico 3 e cada voto recebido 1. O nível aparece ao lado do nome.",
    pontos: "pontos",
    lista: [
      { nome: "Novato", minimo: 0 },
      { nome: "Motard", minimo: 5 },
      { nome: "Estradista", minimo: 20 },
      { nome: "Veterano", minimo: 50 },
      { nome: "Lenda", minimo: 120 },
    ],
    equipa: "Equipa",
    nomesEquipa: ["Equipa MotoBox", "Moderação"],
    autor: "Autor",
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
    responder: "Responder",
    partilhar: "Partilhar",
    resolvidoTitulo: "Tópico resolvido",
    resolvidoTexto: "A dúvida já tem resposta. Pode continuar a conversa se tiver algo a acrescentar.",
    primeiroTitulo: "Seja o primeiro a responder",
    primeiroTexto: "Ninguém respondeu ainda. Uma resposta curta já ajuda, e conta para o seu nível.",
    primeiroBotao: "Escrever a primeira resposta",
    sobreTitulo: "Sobre este tópico",
    criado: "Aberto",
    ultimaActividade: "Última actividade",
    participantes: "participantes",
    criarTitulo: "Tem outra dúvida?",
    criarTexto: "Abra um tópico e a comunidade responde.",
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
  novo: {
    seoTitulo: "Criar tópico",
    sobretitulo: "Fórum",
    titulo: "Criar tópico",
    texto: "Uma pergunta clara recebe respostas mais depressa. Escolha a categoria certa e conte o essencial.",
    campoTitulo: "Título",
    tituloPlaceholder: "Ex.: Corrente a fazer barulho depois da chuva, é normal?",
    tituloAjuda: "Uma frase que resuma a conversa.",
    campoCategoria: "Categoria",
    campoCorpo: "Mensagem",
    corpoPlaceholder: "Conte os pormenores: a mota, o sítio, o que já experimentou…",
    corpoAjuda: "As mudanças de linha ficam como as escrever.",
    publicar: "Publicar tópico",
    aPublicar: "A publicar…",
    aPublicarComo: "A publicar como",
    semSessao: "Ao publicar, pedimos que entre ou crie conta. O texto fica guardado.",
    aguardaTitulo: "Tópico enviado",
    aguardaTexto: "A equipa vai rever o tópico antes de aparecer no fórum. Obrigado por participar.",
    dicasTitulo: "Antes de publicar",
    dicas: [
      "Procure primeiro: talvez alguém já tenha perguntado.",
      "Um tópico, um assunto.",
      "Diga a mota e o ano quando for mecânica.",
      "Vendas e compras vão para o Marketplace.",
    ],
    fechadoTitulo: "Fórum fechado",
    fechadoTexto: "De momento não é possível abrir tópicos novos. Volte mais tarde.",
  },
  moderacao: {
    aprovarTopicos: false,
    topicosPorHora: 3,
  },
};

/* ---------------- Registo ---------------- */

export const DOCS: DefDoc[] = [
  { chave: "paginas.marketplace", titulo: "Marketplace (página da secção)", pagina: "/marketplace", padrao: () => MARKETPLACE_PADRAO },
  { chave: "paginas.forum", titulo: "Fórum (página da secção)", pagina: "/forum", padrao: () => FORUM_PADRAO },
];

export const GRUPOS: DefGrupo[] = [];
