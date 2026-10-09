/* ============================================================
   Conteúdo editável — Contas e emails: os textos das páginas de
   entrar, registar e recuperar a palavra-passe, e para onde vão
   os emails do site (contacto, marketplace, bilhetes…).

   Dois documentos:
   - "site.emails": remetente, responder-para, para onde vai cada
     tipo de mensagem e o texto de cada email que o site envia;
   - "site.contas": os textos fixos de /entrar, /nova-palavra-passe
     e as frases que o servidor devolve no registo.

   Sem nada gravado, vale o que está aqui (o texto que o site já
   usava). Este ficheiro não tem nada de servidor: o painel também
   o importa, para mostrar os nomes e os valores de partida.
   ============================================================ */

import type { DefDoc, DefGrupo } from "../registo-tipos";

/* ---------------- Emails: remetente e destinos ---------------- */

/** Domínio de envio na Resend. Só endereços deste domínio podem enviar. */
export const DOMINIO_ENVIO = "motobox.innoweb.agency";

/** Endereço de origem por omissão (RESEND_FROM, quando definido, manda). */
export const ENDERECO_ENVIO = `geral@${DOMINIO_ENVIO}`;

export const NOME_REMETENTE = "MotoBox Angola";

/** Para onde vai cada tipo de mensagem que chega à equipa. */
export type ChaveDestino =
  | "contacto" | "clubes" | "importacao" | "marketplace" | "denunciasMarketplace" | "moderacao" | "bilhetes";

export const DESTINOS: { chave: ChaveDestino; nome: string; ajuda: string }[] = [
  { chave: "contacto", nome: "Mensagens de contacto", ajuda: "O formulário da página Contacto." },
  { chave: "clubes", nome: "Pedidos para juntar um clube", ajuda: "O formulário «Tem um clube?» da página Clubes." },
  { chave: "importacao", nome: "Pedidos de importação", ajuda: "Marketplace → Importar do estrangeiro." },
  { chave: "marketplace", nome: "Mensagens para vendedores sem conta", ajuda: "Quando alguém contacta um vendedor que não tem conta no site (anúncios publicados pela equipa). A equipa faz chegar a mensagem." },
  { chave: "denunciasMarketplace", nome: "Denúncias de anúncios", ajuda: "Quando alguém denuncia um anúncio do marketplace." },
  { chave: "moderacao", nome: "Denúncias do fórum", ajuda: "Quando alguém denuncia um tópico do fórum." },
  { chave: "bilhetes", nome: "Encomendas de bilhetes", ajuda: "Quando entra uma encomenda de bilhetes. Pode juntar o email do organizador do evento." },
];

/* ---------------- Emails: modelos ---------------- */

export type ChaveModelo =
  | "contaConfirmar" | "contaRecuperar"
  | "contactoEquipa" | "contactoRecibo"
  | "clubeEquipa" | "clubeRecibo"
  | "importacaoEquipa" | "importacaoRecibo"
  | "vendedor" | "marketplaceEquipa"
  | "denuncia"
  | "resposta"
  | "bilhetesEquipa" | "bilhetesComprador"
  | "forumResposta"
  | "avisoEvento" | "avisoBilhetes" | "avisoResultado" | "avisoAnuncio"
  | "newsletter"
  | "teste";

/** Os textos de um email. Os campos que um modelo não usa ficam vazios. */
export interface ModeloEmail {
  assunto: string;
  /** Título grande, no topo da mensagem. */
  titulo: string;
  /** Primeiro texto da mensagem. Uma linha em branco separa parágrafos. */
  intro: string;
  /** Texto do botão. */
  botao: string;
  /** Nota em letra pequena no fim (ou a assinatura, na resposta às mensagens). */
  rodape: string;
}

export type CampoModelo = keyof ModeloEmail;

/** O que o painel mostra sobre cada modelo. */
export interface InfoModelo {
  chave: ChaveModelo;
  nome: string;
  grupo: "Contas" | "Mensagens para a equipa" | "Recibos" | "Marketplace" | "Bilhetes" | "Fórum e avisos" | "Outros";
  /** Quem recebe. */
  para: string;
  /** Quando sai. */
  quando: string;
  /** Campos que este modelo usa. */
  campos: CampoModelo[];
  /** Palavras entre chavetas que se trocam pelos valores do momento. */
  variaveis: Record<string, string>;
}

const SITE = { site: "O nome do site (Definições → Identidade)" };

export const MODELOS: InfoModelo[] = [
  {
    chave: "contaConfirmar", nome: "Confirmar a conta", grupo: "Contas",
    para: "Quem cria conta", quando: "Ao criar conta, e quando a pessoa pede para reenviar a confirmação.",
    campos: ["assunto", "titulo", "intro", "botao", "rodape"],
    variaveis: { nome: "O primeiro nome da pessoa", ...SITE },
  },
  {
    chave: "contaRecuperar", nome: "Nova palavra-passe", grupo: "Contas",
    para: "Quem pediu", quando: "Em Entrar → «Esqueceu-se da palavra-passe?».",
    campos: ["assunto", "titulo", "intro", "botao", "rodape"],
    variaveis: { ...SITE },
  },
  {
    chave: "contactoEquipa", nome: "Nova mensagem de contacto", grupo: "Mensagens para a equipa",
    para: "A equipa (Mensagens de contacto)", quando: "Quando alguém escreve pela página Contacto. Responder ao email responde a quem escreveu.",
    campos: ["assunto", "titulo", "intro", "botao"],
    variaveis: { nome: "Quem escreveu", email: "O email de quem escreveu", assunto: "O assunto escolhido", ...SITE },
  },
  {
    chave: "clubeEquipa", nome: "Pedido para juntar um clube", grupo: "Mensagens para a equipa",
    para: "A equipa (Pedidos para juntar um clube)", quando: "Quando alguém envia o formulário «Tem um clube?».",
    campos: ["assunto", "titulo", "intro", "botao"],
    variaveis: { clube: "O nome do clube", nome: "Quem pediu", email: "O email de quem pediu", ...SITE },
  },
  {
    chave: "importacaoEquipa", nome: "Pedido de importação", grupo: "Mensagens para a equipa",
    para: "A equipa (Pedidos de importação)", quando: "Quando alguém pede uma importação no marketplace.",
    campos: ["assunto", "titulo", "intro", "botao"],
    variaveis: { titulo: "O que a pessoa quer importar", nome: "Quem pediu", email: "O email de quem pediu", ...SITE },
  },
  {
    chave: "denuncia", nome: "Nova denúncia", grupo: "Mensagens para a equipa",
    para: "A equipa (Denúncias de anúncios ou do fórum)", quando: "Quando alguém denuncia um anúncio ou um tópico.",
    campos: ["assunto", "titulo", "intro", "botao"],
    variaveis: { alvo: "O título do anúncio ou do tópico", tipo: "«anúncio» ou «tópico do fórum»", motivo: "O motivo escolhido", ...SITE },
  },
  {
    chave: "contactoRecibo", nome: "Recibo do contacto", grupo: "Recibos",
    para: "Quem escreveu", quando: "Logo a seguir a uma mensagem pela página Contacto (se os recibos estiverem ligados).",
    campos: ["assunto", "titulo", "intro", "rodape"],
    variaveis: { nome: "O primeiro nome de quem escreveu", ...SITE },
  },
  {
    chave: "clubeRecibo", nome: "Recibo do pedido de clube", grupo: "Recibos",
    para: "Quem pediu", quando: "Logo a seguir ao formulário «Tem um clube?» (se os recibos estiverem ligados).",
    campos: ["assunto", "titulo", "intro", "rodape"],
    variaveis: { nome: "O primeiro nome de quem pediu", clube: "O nome do clube", ...SITE },
  },
  {
    chave: "importacaoRecibo", nome: "Recibo do pedido de importação", grupo: "Recibos",
    para: "Quem pediu", quando: "Logo a seguir a um pedido de importação (se os recibos estiverem ligados).",
    campos: ["assunto", "titulo", "intro", "rodape"],
    variaveis: { nome: "O primeiro nome de quem pediu", titulo: "O que quer importar", referencia: "A referência do pedido", ...SITE },
  },
  {
    chave: "vendedor", nome: "Mensagem para o vendedor", grupo: "Marketplace",
    para: "O vendedor do anúncio", quando: "Quando alguém carrega em «Contactar vendedor». Responder ao email responde a quem escreveu; o email do vendedor não é mostrado.",
    campos: ["assunto", "titulo", "intro", "botao", "rodape"],
    variaveis: { comprador: "O nome de quem escreveu", anuncio: "O título do anúncio", ...SITE },
  },
  {
    chave: "marketplaceEquipa", nome: "Mensagem para um vendedor sem conta", grupo: "Marketplace",
    para: "A equipa (Mensagens para vendedores sem conta)", quando: "Quando o vendedor não tem conta no site, ou o email para ele falhou.",
    campos: ["assunto", "titulo", "intro", "botao"],
    variaveis: { comprador: "O nome de quem escreveu", anuncio: "O título do anúncio", vendedor: "O nome do vendedor", ...SITE },
  },
  {
    chave: "bilhetesEquipa", nome: "Nova encomenda de bilhetes", grupo: "Bilhetes",
    para: "A equipa (Encomendas de bilhetes)", quando: "Quando entra uma encomenda de bilhetes.",
    campos: ["assunto", "titulo", "intro", "botao"],
    variaveis: { referencia: "A referência da encomenda", evento: "O evento", nome: "O comprador", quantidade: "Quantos bilhetes", total: "O total a pagar", ...SITE },
  },
  {
    chave: "bilhetesComprador", nome: "Bilhetes confirmados", grupo: "Bilhetes",
    para: "Quem comprou", quando: "Quando a equipa marca a encomenda como paga, em Encomendas.",
    campos: ["assunto", "titulo", "intro", "botao", "rodape"],
    variaveis: { referencia: "A referência da encomenda", evento: "O evento", nome: "O primeiro nome do comprador", ...SITE },
  },
  {
    chave: "forumResposta", nome: "Resposta no fórum", grupo: "Fórum e avisos",
    para: "Quem já respondeu no tópico e pediu avisos do fórum", quando: "Quando alguém responde a um tópico.",
    campos: ["assunto", "titulo", "intro", "botao"],
    variaveis: { topico: "O título do tópico", autor: "Quem respondeu", ...SITE },
  },
  {
    chave: "avisoEvento", nome: "Novo evento", grupo: "Fórum e avisos",
    para: "Quem segue o calendário", quando: "Quando um evento novo é publicado.",
    campos: ["assunto", "intro"],
    variaveis: { evento: "O nome do evento", ...SITE },
  },
  {
    chave: "avisoBilhetes", nome: "Bilhetes à venda", grupo: "Fórum e avisos",
    para: "Quem segue a bilheteira", quando: "Quando um evento passa a ter bilhetes à venda.",
    campos: ["assunto", "intro"],
    variaveis: { evento: "O nome do evento", ...SITE },
  },
  {
    chave: "avisoResultado", nome: "Novos resultados", grupo: "Fórum e avisos",
    para: "Quem segue os pilotos ou as equipas", quando: "Quando os resultados de uma prova são publicados.",
    campos: ["assunto", "intro"],
    variaveis: { corrida: "O nome da prova", prova: "A prova, com a categoria e a data", ...SITE },
  },
  {
    chave: "avisoAnuncio", nome: "Novo anúncio de uma marca", grupo: "Fórum e avisos",
    para: "Quem segue a marca", quando: "Quando entra um anúncio de uma marca que a pessoa segue.",
    campos: ["assunto", "intro"],
    variaveis: { marca: "A marca", anuncio: "O título do anúncio", ...SITE },
  },
  {
    chave: "newsletter", nome: "Newsletter semanal", grupo: "Fórum e avisos",
    para: "Os subscritores", quando: "Às segundas-feiras (ou com «Enviar agora», em Newsletter).",
    campos: ["assunto", "intro"],
    variaveis: { semana: "A semana, por exemplo «21 a 27 de Setembro»", ...SITE },
  },
  {
    chave: "resposta", nome: "Resposta a uma mensagem", grupo: "Outros",
    para: "Quem escreveu", quando: "Em Mensagens, ao carregar em «Enviar resposta». O texto é o que a equipa escreve.",
    campos: ["assunto", "rodape"],
    variaveis: { assunto: "O assunto da mensagem original", ...SITE },
  },
  {
    chave: "teste", nome: "Email de teste", grupo: "Outros",
    para: "O endereço escrito no painel", quando: "Ao carregar em «Enviar email de teste», aqui.",
    campos: ["assunto", "titulo", "intro"],
    variaveis: { ...SITE },
  },
];

const m = (assunto: string, titulo: string, intro: string, botao = "", rodape = ""): ModeloEmail =>
  ({ assunto, titulo, intro, botao, rodape });

export const MODELOS_PADRAO: Record<ChaveModelo, ModeloEmail> = {
  contaConfirmar: m(
    "Confirme a sua conta MotoBox",
    "Confirme a sua conta MotoBox",
    "Olá, {nome}.\n\nFalta só um passo: confirme o seu email para activar a conta. Depois disso fica com sessão iniciada.\n\nA ligação é válida durante 24 horas.",
    "Confirmar o meu email",
    "Se não foi você que criou esta conta, ignore esta mensagem: sem confirmação, a conta não fica activa.",
  ),
  contaRecuperar: m(
    "Nova palavra-passe MotoBox",
    "Definir uma nova palavra-passe",
    "Recebemos um pedido para mudar a palavra-passe da sua conta MotoBox.\n\nCarregue no botão e escolha uma nova. A ligação é válida durante 1 hora.",
    "Escolher nova palavra-passe",
    "Se não pediu esta mudança, ignore esta mensagem: a palavra-passe actual continua a valer.",
  ),
  contactoEquipa: m(
    "Nova mensagem pelo site: {assunto}",
    "Nova mensagem de {nome}",
    "Chegou uma mensagem pela página Contacto. Para responder, basta responder a este email: a resposta segue para {nome} ({email}). A mensagem também fica em Mensagens, no painel.",
    "Abrir Mensagens no painel",
  ),
  clubeEquipa: m(
    "Pedido para juntar um clube: {clube}",
    "{clube} quer entrar na MotoBox",
    "Chegou um pedido para juntar um clube ao site. Confirme os dados e crie a página em Clubes, no painel. Para falar com {nome}, basta responder a este email.",
    "Abrir Mensagens no painel",
  ),
  importacaoEquipa: m(
    "Pedido de importação: {titulo}",
    "Novo pedido de importação",
    "{nome} pediu um orçamento de importação. Os detalhes estão em baixo e em Mensagens, no painel. Para responder, basta responder a este email.",
    "Abrir Mensagens no painel",
  ),
  denuncia: m(
    "Denúncia: {alvo}",
    "Nova denúncia de um {tipo}",
    "Alguém denunciou um conteúdo do site. Veja-o e decida o que fazer em Moderação, no painel.",
    "Abrir Moderação no painel",
  ),
  contactoRecibo: m(
    "Recebemos a sua mensagem",
    "Obrigado pelo contacto, {nome}",
    "A sua mensagem chegou à equipa MotoBox. Respondemos para este email, normalmente em poucos dias úteis.",
    "",
    "Recebe este email porque escreveu à MotoBox pelo site. Se não foi você, pode ignorá-lo.",
  ),
  clubeRecibo: m(
    "Recebemos o pedido do {clube}",
    "Pedido recebido",
    "Olá, {nome}. Obrigado. A equipa da MotoBox vai confirmar os dados do {clube} antes de publicar a página, e responde para este email.",
    "",
    "Recebe este email porque pediu para juntar um clube à MotoBox. Se não foi você, pode ignorá-lo.",
  ),
  importacaoRecibo: m(
    "Recebemos o seu pedido de importação",
    "Pedido recebido: {titulo}",
    "Olá, {nome}. A equipa MotoBox vai preparar um orçamento e responde para este email. Nada é cobrado até aceitar o orçamento.\n\nReferência do pedido: {referencia}.",
    "",
    "Recebe este email porque fez um pedido de importação na sua conta MotoBox.",
  ),
  vendedor: m(
    "Mensagem sobre o seu anúncio: {anuncio}",
    "{comprador} tem interesse no seu anúncio",
    "Para responder, basta responder a este email: a resposta segue directamente para {comprador}.",
    "Ver o anúncio",
    "Recebeu este email porque tem um anúncio no marketplace da MotoBox. O seu endereço não foi mostrado a quem escreveu. A MotoBox não intermedeia pagamentos: combine sempre um encontro em local público.",
  ),
  marketplaceEquipa: m(
    "Interesse no anúncio: {anuncio}",
    "Mensagem para o vendedor {vendedor}",
    "{comprador} escreveu sobre um anúncio cujo vendedor não recebe emails pelo site. Faça chegar a mensagem ao vendedor. Para responder a {comprador}, basta responder a este email.",
    "Ver o anúncio",
  ),
  bilhetesEquipa: m(
    "Nova encomenda {referencia}: {evento}",
    "Nova encomenda de bilhetes",
    "{nome} encomendou {quantidade} bilhete(s) para {evento}, no total de {total}. Confirme o pagamento em Encomendas, no painel. Para falar com o comprador, basta responder a este email.",
    "Abrir Encomendas no painel",
  ),
  bilhetesComprador: m(
    "Os seus bilhetes para {evento}",
    "Pagamento confirmado",
    "Olá, {nome}. O pagamento da encomenda {referencia} está confirmado. Mostre o código do bilhete à entrada do evento.",
    "Ver o evento",
    "Guarde este email. Se tiver alguma dúvida, basta responder a esta mensagem.",
  ),
  forumResposta: m(
    "Nova resposta em: {topico}",
    "{autor} respondeu no fórum",
    "Há uma resposta nova num tópico em que participou.",
    "Ver a resposta",
  ),
  avisoEvento: m("Novo evento no calendário: {evento}", "", "Há um novo evento no calendário MotoBox."),
  avisoBilhetes: m("Bilhetes à venda: {evento}", "", "Os bilhetes para este evento já estão à venda."),
  avisoResultado: m("Resultados: {corrida}", "", "Já saíram os resultados de {prova}."),
  avisoAnuncio: m("Novo anúncio {marca}: {anuncio}", "", "Há um novo anúncio da marca {marca} no marketplace MotoBox."),
  newsletter: m("MotoBox: a semana de {semana}", "", "O resumo do motociclismo angolano:"),
  resposta: m("Re: {assunto}", "", "", "", "{site}"),
  teste: m(
    "Email de teste da MotoBox",
    "O envio de emails está a funcionar",
    "Este é um email de teste enviado a partir do painel de gestão da MotoBox.\n\nSe o recebeu, o remetente e o domínio de envio estão bem configurados.",
  ),
};

export interface ConteudoEmails {
  remetente: {
    /** Nome que aparece como remetente ("MotoBox Angola"). */
    nome: string;
    /** Para onde vão as respostas aos emails do site. Em branco: o email da MotoBox (Definições). */
    responderPara: string;
  };
  /** Um ou mais endereços por tipo, separados por vírgulas. Em branco: o email da MotoBox. */
  destinos: Record<ChaveDestino, string>;
  /** Envia um recibo a quem escreve (contacto, clube, importação). */
  recibos: boolean;
  modelos: Record<ChaveModelo, ModeloEmail>;
}

export const EMAILS_PADRAO: ConteudoEmails = {
  remetente: { nome: NOME_REMETENTE, responderPara: "" },
  destinos: {
    contacto: "", clubes: "", importacao: "", marketplace: "", denunciasMarketplace: "", moderacao: "", bilhetes: "",
  },
  recibos: true,
  modelos: MODELOS_PADRAO,
};

/* ---------------- Contas: textos das páginas ---------------- */

export interface ConteudoContas {
  /**
   * Ligado: a conta só entra depois de abrir a ligação do email de confirmação.
   * Desligado: a conta fica pronta logo ao criar (útil enquanto os emails não chegam).
   */
  exigirConfirmacao: boolean;
  entrar: {
    sobretitulo: string;
    titulo: string;
    texto: string;
    seoTitulo: string;
    seoDescricao: string;
    /** Aviso em /entrar quando "Criar conta" está desligado nas Definições. */
    registosFechados: string;
  };
  novaPalavra: {
    titulo: string;
    texto: string;
    /** Quando a ligação já não vale (ou a página é aberta sem ela). */
    semSessao: string;
    sucesso: string;
  };
  /** Frases que o servidor devolve no registo e na recuperação. */
  mensagens: {
    registosFechados: string;
    contaExiste: string;
    emailNaoSeguiu: string;
    servicoIndisponivel: string;
  };
}

export const CONTAS_PADRAO: ConteudoContas = {
  exigirConfirmacao: true,
  entrar: {
    sobretitulo: "MotoBox Angola",
    titulo: "A comunidade motard, na sua conta",
    texto: "Siga clubes e marcas, publique no marketplace, responda no fórum e receba os artigos da semana.",
    seoTitulo: "Entrar",
    seoDescricao: "Aceda à sua conta MotoBox Angola.",
    registosFechados: "De momento não é possível criar contas novas. Quem já tem conta continua a entrar.",
  },
  novaPalavra: {
    titulo: "Nova palavra-passe",
    texto: "Escolha a nova palavra-passe da sua conta. Depois de a gravar, fica com sessão iniciada.",
    semSessao: "Esta ligação já não é válida (expira ao fim de 1 hora e só pode ser usada uma vez). Peça uma nova em Entrar → «Esqueceu-se da palavra-passe?».",
    sucesso: "Palavra-passe alterada. Já tem sessão iniciada.",
  },
  mensagens: {
    registosFechados: "Os registos estão fechados de momento.",
    contaExiste: "Já existe uma conta com este email. Entre, ou use «Esqueceu-se da palavra-passe?».",
    emailNaoSeguiu: "A conta foi criada, mas o email de confirmação não seguiu.",
    servicoIndisponivel: "O registo não está disponível de momento.",
  },
};

/* ---------------- Junção com o que está gravado ---------------- */

const eObjecto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * O que está gravado por cima do de partida, a todos os níveis: um
 * modelo ou um campo novo no código nunca chega vazio. Só se aceitam
 * valores do mesmo tipo que o de partida.
 */
export function comPadraoContas<T>(padrao: T, gravado: unknown): T {
  if (!eObjecto(padrao) || !eObjecto(gravado)) {
    return gravado !== undefined && gravado !== null && typeof gravado === typeof padrao ? (gravado as T) : padrao;
  }
  const saida: Record<string, unknown> = { ...padrao };
  for (const [k, v] of Object.entries(padrao)) {
    if (k in gravado) saida[k] = comPadraoContas(v, gravado[k]);
  }
  return saida as T;
}

/** Troca {chave} pelos valores; as chaves sem valor ficam como estão. */
export function preencherModelo(texto: string, valores: Record<string, string | number | undefined>): string {
  return texto.replace(/\{(\w+)\}/g, (todo, k: string) => {
    const v = valores[k];
    return v === undefined ? todo : String(v);
  });
}

/* ---------------- Área de membro (/conta) ---------------- */
// Documento "site.conta": os textos fixos da área de membro (resumo,
// anúncios, guardados, garagem, preferências, notificações e
// segurança), os níveis e os pontos de cada acção. Edita-se em
// Definições → Área de membro. As palavras entre chavetas trocam-se
// pelos valores do momento (ver preencherModelo).

/** Um nível da área de membro: chega-se a ele com `pontos` pontos. */
export interface NivelMembro {
  nome: string;
  pontos: number;
}

/** O que dá pontos na área de membro. */
export type AccaoPontos =
  | "foto" | "provincia" | "telefone" | "clube" | "interesse"
  | "anuncio" | "resposta" | "topico" | "mota" | "verificado";

export const ACCOES_PONTOS: AccaoPontos[] = [
  "foto", "provincia", "telefone", "clube", "interesse", "anuncio", "resposta", "topico", "mota", "verificado",
];

export type AbaConta = "resumo" | "anuncios" | "guardados" | "garagem" | "preferencias" | "notificacoes" | "seguranca";

export interface ConteudoConta {
  seo: { titulo: string; descricao: string };
  /** Quem abre /conta sem sessão. */
  semSessao: {
    sobretitulo: string;
    titulo: string;
    texto: string;
    entrar: string;
    criar: string;
    vantagens: string[];
  };
  abas: Record<AbaConta, string>;
  cabecalho: {
    bomDia: string;
    boaTarde: string;
    boaNoite: string;
    membroDesde: string;
    verificado: string;
    semProvincia: string;
    alterarFoto: string;
    nivel: string;
    pontos: string;
    proximoNivel: string;
    nivelMaximo: string;
    comoGanhar: string;
    sair: string;
    aSair: string;
  };
  accoes: {
    publicar: string;
    topico: string;
    topicoLigacao: string;
    eventos: string;
    eventosLigacao: string;
    perfil: string;
  };
  niveis: NivelMembro[];
  pontos: {
    titulo: string;
    texto: string;
    valores: Record<AccaoPontos, number>;
    nomes: Record<AccaoPontos, string>;
  };
  numeros: {
    anuncios: string;
    anunciosNota: string;
    anunciosZero: string;
    guardados: string;
    guardadosNota: string;
    guardadosZero: string;
    forum: string;
    forumNota: string;
    forumZero: string;
    eventos: string;
    eventosNota: string;
    eventosHoje: string;
    eventosAmanha: string;
    eventosNenhum: string;
  };
  perfil: {
    titulo: string;
    texto: string;
    progresso: string;
    foto: string;
    provincia: string;
    telefone: string;
    clube: string;
    garagem: string;
    interesses: string;
  };
  paraSi: {
    titulo: string;
    proximo: string;
    dias: string;
    horas: string;
    minutos: string;
    segundos: string;
    aDecorrer: string;
    verEvento: string;
    agenda: string;
    prova: string;
    evento: string;
    semEventos: string;
    semEventosBotao: string;
    rota: string;
    rotaTexto: string;
    rotaPerto: string;
    verRota: string;
    clube: string;
    verClube: string;
    mudarClube: string;
    semClube: string;
    semClubeTexto: string;
    escolherClube: string;
    semClubeOpcao: string;
    conhecerClubes: string;
    artigos: string;
    artigosInteresses: string;
    artigosRecentes: string;
    guardarArtigo: string;
    artigoGuardado: string;
    verArtigos: string;
    forum: string;
    forumResposta: string;
    forumTopico: string;
    forumVazio: string;
    forumBotao: string;
    bilhetes: string;
    bilhetesPendente: string;
    bilhetesPago: string;
    bilhetesUsado: string;
    bilhetesCancelado: string;
  };
  anuncios: {
    titulo: string;
    texto: string;
    publicar: string;
    activo: string;
    oculto: string;
    ocultoNota: string;
    visualizacoes: string;
    publicado: string;
    editar: string;
    partilhar: string;
    terminar: string;
    verTodos: string;
    vazioTitulo: string;
    vazioTexto: string;
    verificado: string;
  };
  guardados: {
    titulo: string;
    texto: string;
    anuncios: string;
    anunciosVazio: string;
    anunciosBotao: string;
    artigos: string;
    artigosVazio: string;
    artigosBotao: string;
    remover: string;
    verTodos: string;
  };
  garagem: {
    titulo: string;
    texto: string;
    juntar: string;
    vazioTitulo: string;
    vazioTexto: string;
    editar: string;
    remover: string;
    formNova: string;
    formEditar: string;
    marca: string;
    modelo: string;
    ano: string;
    apelido: string;
    apelidoAjuda: string;
    foto: string;
    fotoAjuda: string;
    maximo: string;
    confirmarRemover: string;
  };
  preferencias: {
    texto: string;
    meuClube: string;
    meuClubeTexto: string;
    clubes: string;
    clubesTexto: string;
    marcas: string;
    marcasTexto: string;
  };
  notificacoes: {
    titulo: string;
    texto: string;
    calendario: string;
    calendarioTexto: string;
    bilhetes: string;
    bilhetesTexto: string;
    marketplace: string;
    marketplaceTexto: string;
    forum: string;
    forumTexto: string;
    newsletter: string;
    newsletterTexto: string;
    canais: string;
    email: string;
    push: string;
    whatsapp: string;
    brevemente: string;
    enviadasPara: string;
    automatico: string;
  };
  seguranca: {
    palavraTitulo: string;
    palavraTexto: string;
    actual: string;
    nova: string;
    confirmar: string;
    guardar: string;
    sucesso: string;
    naoCoincide: string;
    curta: string;
    actualErrada: string;
    google: string;
    sessoesTitulo: string;
    sessoesTexto: string;
    ultimaEntrada: string;
    outras: string;
    outrasFeito: string;
    todas: string;
    emailTitulo: string;
    emailTexto: string;
  };
}

export const CONTA_PADRAO: ConteudoConta = {
  seo: {
    titulo: "A minha conta",
    descricao: "A sua área de membro MotoBox: o próximo evento, a rota da semana, os seus anúncios, a sua garagem e as suas preferências.",
  },
  semSessao: {
    sobretitulo: "Área de membro",
    titulo: "A sua garagem, os seus eventos, a sua comunidade",
    texto: "Entre na sua conta para ver o próximo evento, a rota da semana, os anúncios que publicou e o que guardou.",
    entrar: "Entrar",
    criar: "Criar conta grátis",
    vantagens: [
      "Contagem decrescente para o próximo passeio ou prova",
      "Publicar e gerir anúncios no marketplace",
      "Guardar anúncios e artigos para mais tarde",
      "Mostrar as suas motas na garagem",
    ],
  },
  abas: {
    resumo: "Resumo",
    anuncios: "Anúncios",
    guardados: "Guardados",
    garagem: "Garagem",
    preferencias: "Clubes e marcas",
    notificacoes: "Notificações",
    seguranca: "Segurança",
  },
  cabecalho: {
    bomDia: "Bom dia",
    boaTarde: "Boa tarde",
    boaNoite: "Boa noite",
    membroDesde: "Membro desde {data}",
    verificado: "Conta verificada",
    semProvincia: "Província por indicar",
    alterarFoto: "Alterar fotografia e cor",
    nivel: "Nível",
    pontos: "{pontos} pontos",
    proximoNivel: "Faltam {faltam} pontos para {nivel}",
    nivelMaximo: "Chegou ao nível mais alto. Respeito.",
    comoGanhar: "Como ganhar pontos",
    sair: "Sair",
    aSair: "A sair…",
  },
  accoes: {
    publicar: "Publicar anúncio",
    topico: "Criar tópico no fórum",
    topicoLigacao: "/forum/novo",
    eventos: "Ver eventos",
    eventosLigacao: "/eventos",
    perfil: "Editar perfil",
  },
  niveis: [
    { nome: "Recruta", pontos: 0 },
    { nome: "Motard", pontos: 15 },
    { nome: "Estradeiro", pontos: 40 },
    { nome: "Veterano", pontos: 80 },
    { nome: "Lenda da estrada", pontos: 150 },
  ],
  pontos: {
    titulo: "Como ganhar pontos",
    texto: "Os pontos sobem consigo à medida que participa na comunidade. Não se trocam por nada: são só o seu quilómetro na MotoBox.",
    valores: {
      foto: 5, provincia: 3, telefone: 2, clube: 5, interesse: 1,
      anuncio: 5, resposta: 3, topico: 5, mota: 4, verificado: 10,
    },
    nomes: {
      foto: "Fotografia ou logótipo no perfil",
      provincia: "Província indicada",
      telefone: "Telefone indicado",
      clube: "Dizer de que clube é",
      interesse: "Cada clube ou marca que segue (até 10)",
      anuncio: "Cada anúncio publicado",
      resposta: "Cada resposta no fórum",
      topico: "Cada tópico no fórum",
      mota: "Cada mota na garagem",
      verificado: "Conta verificada pela equipa",
    },
  },
  numeros: {
    anuncios: "Anúncios",
    anunciosNota: "{n} visualizações",
    anunciosZero: "Publique o primeiro",
    guardados: "Guardados",
    guardadosNota: "{anuncios} anúncios · {artigos} artigos",
    guardadosZero: "Guarde o que lhe interessa",
    forum: "No fórum",
    forumNota: "{respostas} respostas · {topicos} tópicos",
    forumZero: "Faça a primeira pergunta",
    eventos: "Eventos a chegar",
    eventosNota: "O próximo é daqui a {dias} dias",
    eventosHoje: "O próximo é hoje",
    eventosAmanha: "O próximo é amanhã",
    eventosNenhum: "Sem datas marcadas",
  },
  perfil: {
    titulo: "Complete o seu perfil",
    texto: "Um perfil completo dá confiança a quem compra e vende consigo, e ajuda-nos a mostrar-lhe o que interessa.",
    progresso: "{feitos} de {total}",
    foto: "Pôr uma fotografia ou logótipo",
    provincia: "Indicar a sua província",
    telefone: "Juntar um telefone",
    clube: "Dizer de que clube é",
    garagem: "Mostrar a sua mota na garagem",
    interesses: "Seguir clubes ou marcas",
  },
  paraSi: {
    titulo: "Para si",
    proximo: "Próximo na estrada",
    dias: "dias",
    horas: "horas",
    minutos: "min",
    segundos: "seg",
    aDecorrer: "A decorrer agora",
    verEvento: "Ver evento",
    agenda: "Também a chegar",
    prova: "Prova",
    evento: "Evento",
    semEventos: "Ainda não há datas marcadas. Veja o que já aconteceu ou proponha um passeio à equipa.",
    semEventosBotao: "Ver eventos",
    rota: "Rota da semana",
    rotaTexto: "Uma sugestão nova todas as semanas, para o próximo fim-de-semana.",
    rotaPerto: "Perto de si, em {provincia}.",
    verRota: "Ver a rota",
    clube: "O seu clube",
    verClube: "Ver o clube",
    mudarClube: "Mudar",
    semClube: "Pertence a um clube?",
    semClubeTexto: "Escolha-o e acompanhe daqui os passeios e os encontros do seu clube.",
    escolherClube: "Escolha o seu clube",
    semClubeOpcao: "Ainda não tenho clube",
    conhecerClubes: "Conhecer os clubes",
    artigos: "Artigos para si",
    artigosInteresses: "Com base nos clubes, nas marcas e nas motas que segue.",
    artigosRecentes: "Os mais recentes. Siga clubes e marcas para personalizar.",
    guardarArtigo: "Guardar para ler mais tarde",
    artigoGuardado: "Guardado",
    verArtigos: "Ver todos os artigos",
    forum: "No fórum",
    forumResposta: "Respondeu em",
    forumTopico: "Abriu o tópico",
    forumVazio: "Ainda não participou no fórum. Há sempre alguém com uma dúvida que sabe responder.",
    forumBotao: "Ir para o fórum",
    bilhetes: "Os meus bilhetes",
    bilhetesPendente: "A aguardar pagamento",
    bilhetesPago: "Pago",
    bilhetesUsado: "Usado",
    bilhetesCancelado: "Cancelado",
  },
  anuncios: {
    titulo: "Os meus anúncios",
    texto: "Gira o que tem à venda no marketplace: edite, partilhe ou termine cada anúncio.",
    publicar: "Publicar anúncio",
    activo: "Activo",
    oculto: "Em revisão",
    ocultoNota: "A equipa tirou este anúncio do marketplace. Escreva-nos pela página Contacto se tiver dúvidas.",
    visualizacoes: "{n} visualizações",
    publicado: "Publicado a {data}",
    editar: "Editar",
    partilhar: "Partilhar",
    terminar: "Terminar",
    verTodos: "Ver todos ({n})",
    vazioTitulo: "Tem alguma coisa para vender?",
    vazioTexto: "Uma mota, um capacete, peças paradas na garagem: publique em dois minutos e chegue a motards de todo o país.",
    verificado: "Conta verificada. Os seus anúncios aparecem com o selo de vendedor verificado.",
  },
  guardados: {
    titulo: "Guardados",
    texto: "Os anúncios e os artigos que guardou para ver mais tarde.",
    anuncios: "Anúncios guardados",
    anunciosVazio: "Carregue em Guardar num anúncio do marketplace para o encontrar aqui.",
    anunciosBotao: "Ver o marketplace",
    artigos: "Artigos guardados",
    artigosVazio: "Guarde artigos em «Para si», no Resumo, para os ler com calma.",
    artigosBotao: "Ver artigos",
    remover: "Remover",
    verTodos: "Ver tudo",
  },
  garagem: {
    titulo: "A minha garagem",
    texto: "As motas que tem. Usamos as marcas para lhe mostrar artigos e anúncios que interessam.",
    juntar: "Juntar mota",
    vazioTitulo: "A garagem está vazia",
    vazioTexto: "Mostre a sua mota à comunidade: marca, modelo, ano e uma fotografia.",
    editar: "Editar",
    remover: "Remover",
    formNova: "Juntar mota à garagem",
    formEditar: "Editar mota",
    marca: "Marca",
    modelo: "Modelo",
    ano: "Ano",
    apelido: "Nome da mota (opcional)",
    apelidoAjuda: "Ex.: «A Branquinha»",
    foto: "Fotografia",
    fotoAjuda: "JPG, PNG ou WebP. Fica reduzida para carregar depressa.",
    maximo: "Pode ter até {n} motas na garagem.",
    confirmarRemover: "Tirar {mota} da garagem? A fotografia também é apagada.",
  },
  preferencias: {
    texto: "Escolha o que quer seguir. Usamos estas preferências para personalizar o resumo, a newsletter e as notificações que recebe.",
    meuClube: "O meu clube",
    meuClubeTexto: "O clube a que pertence. Aparece no seu resumo, com os encontros do clube.",
    clubes: "Clubes que segue",
    clubesTexto: "Artigos, passeios e encontros dos clubes que segue, primeiro.",
    marcas: "Marcas de interesse",
    marcasTexto: "Avisamos quando surgirem anúncios ou artigos destas marcas.",
  },
  notificacoes: {
    titulo: "O que quer receber",
    texto: "Notificações personalizadas com base nas suas preferências.",
    calendario: "Eventos",
    calendarioTexto: "Novos passeios, encontros e raides no calendário.",
    bilhetes: "Bilhetes",
    bilhetesTexto: "Quando abrem os bilhetes de um evento.",
    marketplace: "Marketplace",
    marketplaceTexto: "Novos anúncios das marcas que segue.",
    forum: "Fórum",
    forumTexto: "Respostas novas nos tópicos em que participou.",
    newsletter: "Newsletter semanal",
    newsletterTexto: "Os artigos da semana, às segundas-feiras.",
    canais: "Como quer receber",
    email: "Email",
    push: "Notificação no telemóvel",
    whatsapp: "WhatsApp",
    brevemente: "Brevemente",
    enviadasPara: "As notificações por email são enviadas para {email}.",
    automatico: "As alterações guardam-se automaticamente.",
  },
  seguranca: {
    palavraTitulo: "Palavra-passe",
    palavraTexto: "Use pelo menos 8 caracteres. Uma frase curta é mais fácil de lembrar e mais difícil de adivinhar.",
    actual: "Palavra-passe actual",
    nova: "Nova palavra-passe",
    confirmar: "Repita a nova palavra-passe",
    guardar: "Mudar a palavra-passe",
    sucesso: "Palavra-passe alterada.",
    naoCoincide: "As duas palavras-passe novas não são iguais.",
    curta: "A nova palavra-passe tem de ter pelo menos 8 caracteres.",
    actualErrada: "A palavra-passe actual não está certa.",
    google: "Entrou com o Google. Pode definir uma palavra-passe para entrar também com o email.",
    sessoesTitulo: "Sessões",
    sessoesTexto: "Perdeu o telemóvel ou entrou num computador que não é seu? Termine as sessões abertas noutros sítios.",
    ultimaEntrada: "Última entrada: {data}",
    outras: "Terminar as outras sessões",
    outrasFeito: "As outras sessões foram terminadas. Esta continua aberta.",
    todas: "Sair em todos os dispositivos",
    emailTitulo: "Email da conta",
    emailTexto: "Para mudar o email da conta, escreva-nos pela página Contacto.",
  },
};

/* ---------------- Registo ---------------- */

export const DOCS: DefDoc[] = [
  { chave: "site.emails", titulo: "Emails do site", padrao: () => EMAILS_PADRAO },
  { chave: "site.contas", titulo: "Contas (entrar e registar)", pagina: "/entrar", padrao: () => CONTAS_PADRAO },
  { chave: "site.conta", titulo: "Área de membro (a minha conta)", pagina: "/conta", padrao: () => CONTA_PADRAO },
];

export const GRUPOS: DefGrupo[] = [];
