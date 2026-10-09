/* ============================================================
   Conteúdo editável — Geral: textos que aparecem em todo o site
   (rodapé, botão de acção, página 404, aviso de cookies,
   página de manutenção…) e as páginas do campeonato que não
   têm documento próprio (calendário, resultados, classificação,
   pilotos, equipas, bilhetes e a compra de bilhetes).

   O texto de partida é o que o site mostrava antes do painel.
   Nos textos, o que está entre chavetas preenche-se sozinho:
   {ano} é a temporada (Definições), {n} um número, {nome} um
   nome, e cada campo diz na ajuda do painel o que aceita.

   Sem dependências do servidor: os tipos e os textos de partida
   também servem aos componentes de cliente.
   ============================================================ */

import type { DefDoc, DefGrupo } from "../registo-tipos";

/* ---------------- Utilitários ---------------- */

const eObjecto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * O gravado por cima do de partida, a todos os níveis dos objectos (as
 * listas gravadas substituem as de partida). Um campo novo no código nunca
 * chega vazio a um documento gravado antes dele, e um valor de tipo errado
 * (ex.: um número onde havia texto) fica com o de partida.
 */
export function fundirTextos<T>(padrao: T, gravado: unknown): T {
  if (gravado === undefined || gravado === null) return padrao;
  if (eObjecto(padrao)) {
    if (!eObjecto(gravado)) return padrao;
    const saida: Record<string, unknown> = { ...padrao };
    for (const [k, v] of Object.entries(gravado)) saida[k] = k in padrao ? fundirTextos(padrao[k], v) : v;
    return saida as T;
  }
  if (Array.isArray(padrao) !== Array.isArray(gravado)) return padrao;
  if (typeof padrao === "string" && typeof gravado !== "string") return padrao;
  if (typeof padrao === "boolean" && typeof gravado !== "boolean") return padrao;
  return gravado as T;
}

/** Troca {chave} pelos valores (ex.: "{n} provas" → "13 provas"). */
export function preencher(texto: string, valores: Record<string, string | number>): string {
  return String(texto ?? "").replace(/\{(\w+)\}/g, (todo, k: string) => (k in valores ? String(valores[k]) : todo));
}

/** "{n} prova" / "{n} provas", conforme o número. */
export const contar = (n: number, um: string, varios: string) => preencher(n === 1 ? um : varios, { n });

/** Uma ligação com texto e endereço. */
export interface Ligacao {
  texto: string;
  href: string;
}

/* ============================================================
   SITE › GERAL
   ============================================================ */

export interface TextosGerais {
  /** Linha final das páginas interiores. */
  rodape: {
    /** {ano} é o ano corrente. */
    direitos: string;
    /** Nome da lista de ligações, para leitores de ecrã. */
    rotulo: string;
    ligacoes: Ligacao[];
  };
  /** O botão vermelho em baixo e a ligação de conta. */
  barra: {
    explorar: string;
    explorarRotulo: string;
    fechar: string;
    fecharRotulo: string;
    voltar: string;
    entrar: string;
    conta: string;
  };
  naoEncontrada: {
    sobretitulo: string;
    titulo: string;
    texto: string;
    botao: Ligacao;
    botaoSecundario: Ligacao;
    nota: string;
    notaLigacao: Ligacao;
  };
  semAcesso: { titulo: string; texto: string; inicio: string; sair: string };
  newsletter: {
    sobretitulo: string;
    canceladaTitulo: string;
    /** {email} é o endereço que deixou de receber. */
    canceladaTexto: string;
    canceladaSemEmail: string;
    canceladaEngano: string;
    voltarSubscrever: string;
    aSubscrever: string;
    resubscrito: string;
    erroEnvio: string;
    linkInvalidoTitulo: string;
    linkInvalidoTexto: string;
    erroCancelarTitulo: string;
    erroCancelarTexto: string;
    tentarDeNovo: string;
    falarConnosco: string;
    inicio: string;
  };
  cookies: {
    titulo: string;
    texto: string;
    politica: string;
    politicaHref: string;
    personalizar: string;
    soEssenciais: string;
    aceitarTudo: string;
    guardarPrefs: string;
    essenciais: string;
    essenciaisDesc: string;
    sempreActivo: string;
    analiticos: string;
    analiticosDesc: string;
    marketing: string;
    marketingDesc: string;
    preferencias: string;
  };
  /** Página que os visitantes vêem com o modo de manutenção ligado (Definições). */
  manutencao: {
    sobretitulo: string;
    titulo: string;
    texto: string;
    /** {email} é o email de contacto das Definições. Vazio, não aparece. */
    nota: string;
    /** Ligação para a equipa entrar (vazio, não aparece). */
    equipa: string;
    /** Faixa que só a equipa com sessão iniciada vê, por cima do site. */
    avisoEquipa: string;
  };
}

export const GERAL_PADRAO = (): TextosGerais => ({
  rodape: {
    direitos: "© {ano} MotoBox Angola. Um projecto sem fins lucrativos, feito por motards.",
    rotulo: "Ligações legais",
    ligacoes: [
      { texto: "Sobre", href: "/sobre" },
      { texto: "Contacto", href: "/contacto" },
      { texto: "Termos", href: "/termos" },
      { texto: "Privacidade", href: "/privacidade" },
      { texto: "Cookies", href: "/cookies" },
      { texto: "Instagram", href: "https://www.instagram.com/motobox_angola" },
    ],
  },
  barra: {
    explorar: "Explorar",
    explorarRotulo: "Explorar a MotoBox",
    fechar: "Fechar",
    fecharRotulo: "Fechar o painel",
    voltar: "Voltar ao painel",
    entrar: "Entrar",
    conta: "A minha conta",
  },
  naoEncontrada: {
    sobretitulo: "Erro 404",
    titulo: "Esta estrada não leva a lado nenhum",
    texto: "A página que procura não existe ou mudou de sítio. Volte ao painel e escolha outro caminho.",
    botao: { texto: "Ir para o painel", href: "/explorar" },
    botaoSecundario: { texto: "Ler os artigos", href: "/artigos" },
    nota: "Procura uma página antiga de corridas ou classificações?",
    notaLigacao: { texto: "Os eventos estão aqui", href: "/eventos" },
  },
  semAcesso: {
    titulo: "Sem acesso",
    texto: "A sua conta não tem permissão para o painel de gestão. Fale com um administrador da Motobox.",
    inicio: "Início",
    sair: "Sair",
  },
  newsletter: {
    sobretitulo: "Newsletter Motobox",
    canceladaTitulo: "Subscrição cancelada",
    canceladaTexto: "Deixou de receber a newsletter semanal da Motobox em {email}.",
    canceladaSemEmail: "Deixou de receber a newsletter semanal da Motobox.",
    canceladaEngano: "Foi engano? Pode voltar à lista com um clique.",
    voltarSubscrever: "Voltar a subscrever",
    aSubscrever: "A subscrever…",
    resubscrito: "Está de novo na lista. Até segunda-feira!",
    erroEnvio: "Não foi possível subscrever agora. Tente de novo dentro de momentos.",
    linkInvalidoTitulo: "Ligação inválida",
    linkInvalidoTexto:
      "Esta ligação de cancelamento está incompleta ou já não é válida. Use a ligação no fim do último email que recebeu, ou fale connosco.",
    erroCancelarTitulo: "Não foi possível cancelar",
    erroCancelarTexto: "Houve um problema do nosso lado. Tente de novo dentro de momentos.",
    tentarDeNovo: "Tentar de novo",
    falarConnosco: "Falar connosco",
    inicio: "Início",
  },
  cookies: {
    titulo: "Cookies nesta plataforma",
    texto:
      "Usamos cookies essenciais para o funcionamento do site. Com o seu consentimento, usamos também cookies analíticos para perceber como a plataforma é utilizada.",
    politica: "Política de Cookies",
    politicaHref: "/cookies",
    personalizar: "Personalizar",
    soEssenciais: "Só essenciais",
    aceitarTudo: "Aceitar tudo",
    guardarPrefs: "Guardar preferências",
    essenciais: "Essenciais",
    essenciaisDesc: "Sessão, carrinho de bilhetes e preferências.",
    sempreActivo: "Sempre activo",
    analiticos: "Analíticos",
    analiticosDesc: "Estatísticas agregadas de utilização.",
    marketing: "Marketing",
    marketingDesc: "Campanhas e conteúdo personalizado.",
    preferencias: "Preferências de cookies",
  },
  manutencao: {
    sobretitulo: "Em manutenção",
    titulo: "Estamos a afinar a máquina",
    texto:
      "A MotoBox está parada por pouco tempo para manutenção. Volte dentro de momentos: as provas, os clubes e os artigos estão à sua espera.",
    nota: "Precisa de falar connosco? Escreva para {email}.",
    equipa: "É da equipa? Entrar",
    avisoEquipa: "Modo de manutenção ligado: os visitantes vêem a página de manutenção. Desligue-o em Definições.",
  },
});

/* ============================================================
   CAMPEONATO › CALENDÁRIO (/calendario e /calendario/[slug])
   ============================================================ */

export interface EstadosEvento {
  aDecorrer: string;
  concluido: string;
  aVenda: string;
  esgotado: string;
  agendado: string;
}

/** Textos das linhas e dos cartões de prova (lista e grelha). */
export interface TextosLinhaEvento {
  /** {ronda} é o número da ronda. */
  ronda: string;
  /** Entre as duas datas ("14 Mar a 15 Mar"). */
  ate: string;
  desde: string;
  bilhetes: string;
  detalhes: string;
  resultados: string;
  verEvento: string;
  estados: EstadosEvento;
}

export interface TextosContagem {
  dias: string;
  horas: string;
  minutos: string;
  segundos: string;
}

export interface TextosCalendario {
  pesquisa: { titulo: string; descricao: string };
  foto: string;
  sobretitulo: string;
  titulo: string;
  texto: string;
  /** Ligação por baixo do texto (vazia, não aparece). */
  ligacaoEventos: Ligacao;
  numeros: { provas: string; provincias: string; disciplinas: string; porDisputar: string };
  lista: {
    titulo: string;
    contadorUm: string;
    contadorVarios: string;
    todas: string;
    rotuloDisciplina: string;
    passadas: string;
    rotuloVista: string;
    vistaLista: string;
    vistaGrelha: string;
    vazioTitulo: string;
    vazioTexto: string;
  };
  destaque: { etiqueta: string; comprar: string; esgotado: string; detalhes: string; comecaEm: string };
  notaBilhetes: { etiqueta: string; texto: string; ligacao: string };
  linha: TextosLinhaEvento;
  contagem: TextosContagem;
  /** A página de cada prova. */
  prova: {
    naoEncontrada: string;
    comecaEm: string;
    comprar: string;
    esgotado: string;
    terminada: string;
    terminado: string;
    verResultados: string;
    aDecorrer: string;
    numeros: {
      /** {temporada} é o ano da prova. */
      data: string;
      ronda: string;
      /** {disciplina} e {campeonato}. */
      rondaTexto: string;
      disciplina: string;
      tipo: string;
      organizacao: string;
    };
    sobreProva: string;
    sobreEvento: string;
    programa: string;
    ficha: {
      tituloProva: string;
      tituloEvento: string;
      circuito: string;
      localidade: string;
      distancia: string;
      voltas: string;
      disciplina: string;
      local: string;
      tipo: string;
      organizador: string;
      organizacao: string;
      recorde: string;
    };
    bilhetes: { titulo: string; disponiveis: string; comprar: string; esgotado: string };
    participacao: { titulo: string; fechada: string; semVenda: string; organizador: string };
    partilhar: { titulo: string; botao: string; copiado: string };
    resultados: { titulo: string; arquivo: string; vencedor: string; completa: string };
  };
}

export const LINHA_EVENTO_PADRAO: TextosLinhaEvento = {
  ronda: "Ronda {ronda}",
  ate: "a",
  desde: "Desde",
  bilhetes: "Bilhetes",
  detalhes: "Detalhes",
  resultados: "Resultados",
  verEvento: "Ver evento",
  estados: {
    aDecorrer: "A decorrer",
    concluido: "Concluído",
    aVenda: "Bilhetes à venda",
    esgotado: "Esgotado",
    agendado: "Agendado",
  },
};

export const CONTAGEM_PADRAO: TextosContagem = { dias: "Dias", horas: "Horas", minutos: "Min", segundos: "Seg" };

export const CALENDARIO_PADRAO = (): TextosCalendario => ({
  pesquisa: {
    titulo: "Calendário de provas {ano}",
    descricao:
      "As provas de Desporto em Angola em {ano}: motocross, enduro, rally-raid, velocidade, moto 4 e karting. Datas, circuitos, horários e bilhetes.",
  },
  foto: "trail",
  sobretitulo: "Temporada {ano}",
  titulo: "Calendário",
  texto:
    "As provas de Desporto em Angola: motocross, enduro, rally-raid, velocidade, moto 4 e karting. Clique numa prova para ver horários, circuito e bilhetes.",
  ligacaoEventos: { texto: "Passeios, encontros e acções solidárias estão em Eventos", href: "/eventos" },
  numeros: { provas: "Provas", provincias: "Províncias", disciplinas: "Disciplinas", porDisputar: "Por disputar" },
  lista: {
    titulo: "Provas",
    contadorUm: "{n} prova",
    contadorVarios: "{n} provas",
    todas: "Todas",
    rotuloDisciplina: "Disciplina",
    passadas: "Provas passadas",
    rotuloVista: "Vista",
    vistaLista: "Lista",
    vistaGrelha: "Grelha",
    vazioTitulo: "Nenhuma prova encontrada",
    vazioTexto: "Experimente outro filtro de disciplina.",
  },
  destaque: {
    etiqueta: "Próxima prova",
    comprar: "Comprar bilhetes",
    esgotado: "Esgotado",
    detalhes: "Ver detalhes",
    comecaEm: "Começa em",
  },
  notaBilhetes: {
    etiqueta: "Bilhetes à venda",
    texto: "Compre online e guarde o bilhete com código QR no telemóvel.",
    ligacao: "Todos os bilhetes",
  },
  linha: structuredClone(LINHA_EVENTO_PADRAO),
  contagem: { ...CONTAGEM_PADRAO },
  prova: {
    naoEncontrada: "Evento não encontrado",
    comecaEm: "Começa em",
    comprar: "Comprar bilhetes",
    esgotado: "Esgotado",
    terminada: "Esta prova já terminou.",
    terminado: "Este evento já aconteceu.",
    verResultados: "Ver resultados",
    aDecorrer: "A decorrer",
    numeros: {
      data: "data · {temporada}",
      ronda: "Ronda {ronda}",
      rondaTexto: "{disciplina} · {campeonato}",
      disciplina: "disciplina",
      tipo: "tipo de evento",
      organizacao: "organização",
    },
    sobreProva: "Sobre a prova",
    sobreEvento: "Sobre o evento",
    programa: "Programa",
    ficha: {
      tituloProva: "Ficha do circuito",
      tituloEvento: "Local e organização",
      circuito: "Circuito",
      localidade: "Localidade",
      distancia: "Distância",
      voltas: "Voltas",
      disciplina: "Disciplina",
      local: "Local",
      tipo: "Tipo",
      organizador: "Organizador",
      organizacao: "Organização:",
      recorde: "Recorde de volta",
    },
    bilhetes: { titulo: "Bilhetes", disponiveis: "{n} disponíveis", comprar: "Comprar bilhetes", esgotado: "Esgotado" },
    participacao: {
      titulo: "Participação",
      fechada:
        "A venda de bilhetes online na MotoBox está fechada de momento. Confirme as condições de participação com o organizador.",
      semVenda:
        "Este evento não tem venda de bilhetes online na MotoBox. Confirme as condições de participação com o organizador.",
      organizador: "Organizador",
    },
    partilhar: { titulo: "Partilhar", botao: "Partilhar", copiado: "Ligação copiada" },
    resultados: {
      titulo: "Resultados",
      arquivo: "Arquivo de resultados",
      vencedor: "Vencedor: {nome}",
      completa: "Classificação completa",
    },
  },
});

/* ============================================================
   CAMPEONATO › RESULTADOS (/resultados e /resultados/[slug])
   ============================================================ */

/** Cabeçalhos e legenda das tabelas de resultados (também na página de cada prova). */
export interface TextosTabelaResultados {
  pos: string;
  piloto: string;
  equipa: string;
  voltas: string;
  tempo: string;
  pts: string;
  /** "volta"/"voltas" no telemóvel, por baixo do nome. */
  voltaUm: string;
  voltaVarias: string;
  /** "pts" a seguir aos pontos, no telemóvel. */
  ptsCurto: string;
  melhorVolta: string;
  naoClassificado: string;
  legenda: string[];
}

export interface TextosResultados {
  pesquisa: { titulo: string; descricao: string };
  foto: string;
  sobretitulo: string;
  titulo: string;
  texto: string;
  numeros: { corridas: string; vencedores: string; temporada: string; temporadas: string };
  vazioTitulo: string;
  vazioTexto: string;
  /** {temporada} é o ano. */
  temporada: string;
  emCurso: string;
  ronda: string;
  vencedor: string;
  verCorrida: string;
  tabela: TextosTabelaResultados;
  corrida: {
    /** {nome}, {temporada}, {categoria} e {vencedor}. */
    pesquisaTitulo: string;
    pesquisaDescricao: string;
    naoEncontrado: string;
    vencedor: string;
    podio: string;
    arquivo: string;
    pts: string;
    classificacao: string;
    melhorVolta: string;
    resumo: {
      titulo: string;
      categoria: string;
      partidas: string;
      classificados: string;
      desistencias: string;
      circuito: string;
    };
    outrasCategorias: string;
    paginaProva: string;
  };
}

export const TABELA_RESULTADOS_PADRAO: TextosTabelaResultados = {
  pos: "Pos",
  piloto: "Piloto",
  equipa: "Equipa",
  voltas: "Voltas",
  tempo: "Tempo",
  pts: "Pts",
  voltaUm: "volta",
  voltaVarias: "voltas",
  ptsCurto: "pts",
  melhorVolta: "Melhor volta",
  naoClassificado: "Não classificado",
  legenda: [
    "MV: melhor volta da corrida",
    "DNF: não terminou",
    "DNS: não partiu",
    "DSQ: desclassificado",
    "NC: não classificado",
  ],
};

export const RESULTADOS_PADRAO = (): TextosResultados => ({
  pesquisa: {
    titulo: "Arquivo de Resultados",
    descricao:
      "Arquivo completo de resultados do motociclismo angolano, corrida a corrida, com tempos, pontos e melhores voltas.",
  },
  foto: "mxgp",
  sobretitulo: "Arquivo histórico",
  titulo: "Resultados",
  texto:
    "Todos os resultados das provas do calendário nacional, corrida a corrida. Tempos, pontos, melhores voltas e desistências.",
  numeros: {
    corridas: "Corridas registadas",
    vencedores: "Vencedores diferentes",
    temporada: "Temporada",
    temporadas: "Temporadas",
  },
  vazioTitulo: "Sem resultados publicados",
  vazioTexto: "Os resultados aparecem aqui assim que a primeira corrida da temporada terminar.",
  temporada: "Temporada {temporada}",
  emCurso: "Em curso",
  ronda: "Ronda {ronda}",
  vencedor: "Vencedor",
  verCorrida: "Ver a corrida",
  tabela: structuredClone(TABELA_RESULTADOS_PADRAO),
  corrida: {
    pesquisaTitulo: "{nome} {temporada}, {categoria}",
    pesquisaDescricao: "Resultado completo do {nome} de {temporada}, categoria {categoria}. Vencedor: {vencedor}.",
    naoEncontrado: "Resultado não encontrado",
    vencedor: "Vencedor:",
    podio: "Pódio",
    arquivo: "Arquivo de resultados",
    pts: "pts",
    classificacao: "Classificação da corrida",
    melhorVolta: "Melhor volta da corrida",
    resumo: {
      titulo: "Resumo",
      categoria: "Categoria",
      partidas: "Partidas",
      classificados: "Classificados",
      desistencias: "Desistências",
      circuito: "Circuito",
    },
    outrasCategorias: "Outras categorias",
    paginaProva: "Página da prova",
  },
});

/* ============================================================
   CAMPEONATO › CLASSIFICAÇÃO (/classificacao)
   ============================================================ */

export interface TextosClassificacao {
  pesquisa: { titulo: string; descricao: string };
  foto: string;
  /** {campeonato} e {ano}. */
  sobretitulo: string;
  titulo: string;
  texto: string;
  abas: { rotulo: string; pilotos: string; equipas: string };
  rotuloCategoria: string;
  geral: string;
  pts: string;
  /** Linha do pódio: {vitorias} e {podios}. */
  podioLinha: string;
  colunas: {
    pos: string;
    piloto: string;
    equipa: string;
    base: string;
    vit: string;
    pod: string;
    pole: string;
    tit: string;
    pontos: string;
  };
  /** Linhas do telemóvel: {vitorias}, {podios}, {poles} / {titulos}. */
  linhaPiloto: string;
  linhaEquipa: string;
  pilotoUm: string;
  pilotoVarios: string;
  vazioPilotos: { titulo: string; texto: string };
  vazioEquipas: { titulo: string; texto: string };
  legenda: { vit: string; pod: string; pole: string; tit: string; actualizado: string };
}

export const CLASSIFICACAO_PADRAO = (): TextosClassificacao => ({
  pesquisa: {
    titulo: "Classificação Nacional",
    descricao:
      "Tabela de classificação do Campeonato Nacional de Motocross {ano}: pilotos e equipas, pontos, vitórias e pódios.",
  },
  foto: "geral",
  sobretitulo: "{campeonato} {ano}",
  titulo: "Classificação",
  texto: "Pontuação do campeonato nacional de motociclismo, actualizada após cada prova. Pontuação a dobrar na ronda final.",
  abas: { rotulo: "Tabela", pilotos: "Pilotos", equipas: "Equipas e clubes" },
  rotuloCategoria: "Categoria",
  geral: "Geral",
  pts: "pts",
  podioLinha: "{vitorias} Vit · {podios} Pód",
  colunas: {
    pos: "Pos",
    piloto: "Piloto",
    equipa: "Equipa",
    base: "Base",
    vit: "Vit",
    pod: "Pód",
    pole: "Pole",
    tit: "Tít",
    pontos: "Pontos",
  },
  linhaPiloto: "{vitorias} Vit · {podios} Pód · {poles} Pole",
  linhaEquipa: "{vitorias} Vit · {podios} Pód · {titulos} Tít",
  pilotoUm: "{n} piloto",
  pilotoVarios: "{n} pilotos",
  vazioPilotos: {
    titulo: "Sem pilotos nesta categoria",
    texto: "A tabela enche-se assim que houver pontos atribuídos.",
  },
  vazioEquipas: {
    titulo: "Sem equipas pontuadas",
    texto: "A tabela de equipas enche-se assim que houver pontos atribuídos.",
  },
  legenda: {
    vit: "Vit: vitórias",
    pod: "Pód: pódios",
    pole: "Pole: melhores qualificações",
    tit: "Tít: títulos nacionais",
    actualizado: "Actualizado após cada prova",
  },
});

/* ============================================================
   CAMPEONATO › PILOTOS (/pilotos e /pilotos/[slug])
   ============================================================ */

/** Cartão de piloto (grelha de pilotos e plantel de cada equipa). */
export interface TextosCartaoPiloto {
  /** {n} é o número de títulos. */
  campeao: string;
  posicao: string;
  pts: string;
  vit: string;
  pod: string;
}

export interface TextosPilotos {
  pesquisa: { titulo: string; descricao: string };
  foto: string;
  sobretitulo: string;
  titulo: string;
  texto: string;
  filtros: {
    todas: string;
    rotuloCategoria: string;
    todasProvincias: string;
    rotuloProvincia: string;
    procurar: string;
  };
  contadorUm: string;
  contadorVarios: string;
  vazioTitulo: string;
  vazioTexto: string;
  cartao: TextosCartaoPiloto;
  piloto: {
    /** {nome}, {numero}, {categoria}, {equipa}, {vitorias}, {podios}. */
    pesquisaTitulo: string;
    pesquisaDescricao: string;
    naoEncontrado: string;
    campeao: string;
    numeros: {
      posicao: string;
      pontos: string;
      vitorias: string;
      podios: string;
      poles: string;
      corridas: string;
      naoClassificado: string;
    };
    perfil: string;
    dados: { equipa: string; provincia: string; idade: string; idadeValor: string; mota: string; kart: string };
    historico: { titulo: string; prova: string; data: string; categoria: string; pos: string; pts: string };
    campeonato: { titulo: string; pts: string; doLider: string; lider: string; ligacao: string };
    carreira: {
      titulo: string;
      estreia: string;
      temporadas: string;
      melhor: string;
      taxa: string;
      titulos: string;
      nacionalidade: string;
    };
    equipa: { titulo: string; colegas: string; pts: string };
    seguir: { mostrar: boolean; titulo: string; texto: string; botao: string; ligacao: string };
  };
}

export const CARTAO_PILOTO_PADRAO: TextosCartaoPiloto = {
  campeao: "{n}× campeão nacional",
  posicao: "Posição na classificação:",
  pts: "Pts",
  vit: "Vit",
  pod: "Pód",
};

export const PILOTOS_PADRAO = (): TextosPilotos => ({
  pesquisa: {
    titulo: "Pilotos",
    descricao: "Perfis dos pilotos do motociclismo angolano: estatísticas, equipas, motas e redes sociais.",
  },
  foto: "competicao",
  sobretitulo: "Temporada {ano}",
  titulo: "Pilotos",
  texto: "Quem corre no motociclismo angolano. Estatísticas, histórico, equipas e onde os seguir.",
  filtros: {
    todas: "Todas",
    rotuloCategoria: "Categoria",
    todasProvincias: "Todas as províncias",
    rotuloProvincia: "Filtrar por província",
    procurar: "Procurar piloto…",
  },
  contadorUm: "{n} piloto",
  contadorVarios: "{n} pilotos",
  vazioTitulo: "Nenhum piloto encontrado",
  vazioTexto: "Experimente outros filtros ou outra pesquisa.",
  cartao: { ...CARTAO_PILOTO_PADRAO },
  piloto: {
    pesquisaTitulo: "{nome} #{numero}",
    pesquisaDescricao:
      "{nome}, piloto {categoria} da {equipa}. {vitorias} vitórias e {podios} pódios no motociclismo angolano.",
    naoEncontrado: "Piloto não encontrado",
    campeao: "{n}× Campeão Nacional",
    numeros: {
      posicao: "Posição no campeonato",
      pontos: "Pontos",
      vitorias: "Vitórias",
      podios: "Pódios",
      poles: "Poles",
      corridas: "Corridas",
      naoClassificado: "NC",
    },
    perfil: "Perfil",
    dados: {
      equipa: "Equipa",
      provincia: "Província",
      idade: "Idade",
      idadeValor: "{n} anos",
      mota: "Mota",
      kart: "Kart",
    },
    historico: {
      titulo: "Histórico de corridas",
      prova: "Prova",
      data: "Data",
      categoria: "Categoria",
      pos: "Pos",
      pts: "Pts",
    },
    campeonato: {
      titulo: "No campeonato",
      pts: "pts",
      doLider: "{n} pontos do líder",
      lider: "Líder do campeonato",
      ligacao: "Ver classificação",
    },
    carreira: {
      titulo: "Números da carreira",
      estreia: "Estreia",
      temporadas: "Temporadas",
      melhor: "Melhor resultado",
      taxa: "Taxa de pódio",
      titulos: "Títulos nacionais",
      nacionalidade: "Nacionalidade",
    },
    equipa: { titulo: "Equipa", colegas: "Colegas de equipa", pts: "pts" },
    seguir: {
      mostrar: true,
      titulo: "Seguir este piloto",
      texto: "Receba uma notificação sempre que {nome} corre, pontua ou sobe ao pódio.",
      botao: "Seguir",
      ligacao: "/conta",
    },
  },
});

/* ============================================================
   CAMPEONATO › EQUIPAS (/equipas e /equipas/[slug])
   ============================================================ */

export interface TextosEquipas {
  pesquisa: { titulo: string; descricao: string };
  foto: string;
  sobretitulo: string;
  titulo: string;
  texto: string;
  ligacaoClubes: Ligacao;
  numeros: { equipas: string; clubes: string; membros: string; provincias: string };
  vazioTitulo: string;
  vazioTexto: string;
  competicao: { titulo: string; texto: string };
  clubes: { titulo: string; texto: string };
  registar: {
    mostrar: boolean;
    sobretitulo: string;
    titulo: string;
    texto: string;
    foto: string;
    botao: string;
    ligacao: string;
  };
  cartao: {
    /** {n} é o número de títulos. */
    campea: string;
    /** {base} e {ano} (fundação). */
    desde: string;
    membros: string;
    pontos: string;
    vitorias: string;
    podios: string;
  };
  equipa: {
    naoEncontrada: string;
    noCampeonato: string;
    campea: string;
    numeros: { pontos: string; vitorias: string; podios: string; titulos: string };
    sobreEquipa: string;
    sobreClube: string;
    dados: { base: string; fundacao: string; responsavel: string; membros: string };
    pilotos: string;
    ficha: { titulo: string; tipo: string; provincia: string; fundacao: string; membros: string; material: string };
    campeonato: { titulo: string; pts: string; texto: string; ligacao: string };
    outrasEquipas: string;
    outrosClubes: string;
  };
}

export const EQUIPAS_PADRAO = (): TextosEquipas => ({
  pesquisa: {
    titulo: "Equipas e Clubes",
    descricao: "As equipas de competição e os clubes motard de Angola: história, base, pilotos e palmarés.",
  },
  foto: "gala",
  sobretitulo: "Motociclismo angolano",
  titulo: "Equipas e clubes",
  texto:
    "Quem move o motociclismo em Angola, das equipas de competição aos clubes que juntam centenas de motards todos os meses.",
  ligacaoClubes: {
    texto: "Anda de mota por lazer? Os clubes de passeio, moto-turismo e Lady Riders estão em Clubes",
    href: "/clubes",
  },
  numeros: { equipas: "Equipas", clubes: "Clubes", membros: "Membros", provincias: "Províncias" },
  vazioTitulo: "Sem equipas registadas",
  vazioTexto: "As equipas e os clubes aparecem aqui assim que forem registados.",
  competicao: { titulo: "Equipas de competição", texto: "As estruturas que disputam o Campeonato Nacional." },
  clubes: { titulo: "Clubes motard", texto: "Comunidades de passeio, convívio e acção social por todo o país." },
  registar: {
    mostrar: true,
    sobretitulo: "Falta o seu clube?",
    titulo: "Registe o seu clube na MotoBox",
    texto:
      "Se organiza passeios, treina pilotos ou junta motards na sua província, queremos o seu clube aqui. O registo é gratuito e dá direito a página própria, divulgação de eventos no calendário nacional e venda de bilhetes através da plataforma.",
    foto: "painel-clubes",
    botao: "Registar clube",
    ligacao: "/contacto#parcerias",
  },
  cartao: {
    campea: "{n}× Campeã",
    desde: "{base} · desde {ano}",
    membros: "Membros",
    pontos: "Pontos",
    vitorias: "Vitórias",
    podios: "Pódios",
  },
  equipa: {
    naoEncontrada: "Equipa não encontrada",
    noCampeonato: "{n}.º no campeonato",
    campea: "{n}× Campeã Nacional",
    numeros: { pontos: "Pontos", vitorias: "Vitórias", podios: "Pódios", titulos: "Títulos" },
    sobreEquipa: "Sobre a equipa",
    sobreClube: "Sobre o clube",
    dados: { base: "Base", fundacao: "Fundação", responsavel: "Responsável", membros: "Membros" },
    pilotos: "Pilotos",
    ficha: {
      titulo: "Ficha",
      tipo: "Tipo",
      provincia: "Província",
      fundacao: "Fundação",
      membros: "Membros",
      material: "Material",
    },
    campeonato: { titulo: "No campeonato", pts: "pts", texto: "Classificação de equipas", ligacao: "Tabela completa" },
    outrasEquipas: "Outras equipas",
    outrosClubes: "Outros clubes",
  },
});

/* ============================================================
   CAMPEONATO › BILHETES (/bilhetes e as mensagens sem venda)
   ============================================================ */

export type IconeBilhetes = "bilhete" | "qr" | "verificado" | "telemovel" | "banco" | "seguro";

export interface TextosBilhetes {
  pesquisa: { titulo: string; descricao: string };
  foto: string;
  sobretitulo: string;
  titulo: string;
  texto: string;
  vantagens: { icone: IconeBilhetes; titulo: string; texto: string }[];
  aVenda: string;
  contadorUm: string;
  contadorVarios: string;
  fechada: { titulo: string; texto: string };
  semBilhetes: { titulo: string; texto: string };
  cartao: {
    ronda: string;
    esgotado: string;
    popular: string;
    disponiveis: string;
    aPartirDe: string;
    totalDisponiveis: string;
    detalhes: string;
    comprar: string;
  };
  comoFunciona: { titulo: string; passos: { titulo: string; texto: string }[] };
  organizadores: {
    mostrar: boolean;
    sobretitulo: string;
    titulo: string;
    texto: string;
    foto: string;
    botao: string;
    ligacao: string;
    nota: string;
  };
  /** A página de compra de um evento sem venda aberta. */
  semVenda: {
    esgotado: { titulo: string; texto: string };
    fechada: { titulo: string; texto: string };
    semVenda: { titulo: string; texto: string };
    verEvento: string;
    todos: string;
  };
  /** Topo da página de compra: {titulo} é o nome do evento. */
  compra: { pesquisaTitulo: string; sobretitulo: string; ronda: string };
}

export const BILHETES_PADRAO = (): TextosBilhetes => ({
  pesquisa: {
    titulo: "Bilhetes",
    descricao:
      "Compre bilhetes para as provas do motociclismo angolano. Pagamento por Multicaixa Express ou transferência bancária. Bilhete digital com QR code no telemóvel.",
  },
  foto: "kilamba",
  sobretitulo: "Bilhética oficial",
  titulo: "Bilhetes",
  texto:
    "Compre online e guarde o bilhete digital com código QR no telemóvel. Sem filas, sem dinheiro em mão, sem intermediários.",
  vantagens: [
    { icone: "bilhete", titulo: "Compra online", texto: "Multicaixa Express ou transferência bancária." },
    { icone: "qr", titulo: "QR no telemóvel", texto: "Bilhete digital validado à entrada." },
    { icone: "verificado", titulo: "Verificação automática", texto: "Pagamento confirmado em segundos." },
  ],
  aVenda: "À venda",
  contadorUm: "{n} evento",
  contadorVarios: "{n} eventos",
  fechada: {
    titulo: "Bilheteira fechada",
    texto:
      "A venda de bilhetes online na MotoBox está fechada de momento. Consulte o calendário e a página de cada evento para saber como participar.",
  },
  semBilhetes: {
    titulo: "Sem bilhetes à venda",
    texto: "De momento não há provas com bilhetes à venda. Consulte o calendário para ver o que vem a seguir.",
  },
  cartao: {
    ronda: "Ronda {ronda}",
    esgotado: "Esgotado",
    popular: "Popular",
    disponiveis: "{n} disponíveis",
    aPartirDe: "A partir de",
    totalDisponiveis: "{n} bilhetes disponíveis",
    detalhes: "Detalhes",
    comprar: "Comprar",
  },
  comoFunciona: {
    titulo: "Como funciona",
    passos: [
      { titulo: "Escolha a prova", texto: "Selecione o evento e o tipo de bilhete que quer." },
      { titulo: "Pague online", texto: "Multicaixa Express ou transferência bancária." },
      {
        titulo: "Guarde o QR",
        texto: "O bilhete digital aparece no fim da compra. Guarde-o no telemóvel ou imprima-o.",
      },
      { titulo: "Entre na prova", texto: "Mostre o QR à entrada. Validação em segundos." },
    ],
  },
  organizadores: {
    mostrar: true,
    sobretitulo: "Para clubes e organizadores",
    titulo: "Venda os bilhetes da sua prova connosco",
    texto:
      "A MotoBox trata da venda online, do pagamento e da validação à entrada. O clube recebe a receita e nós retemos uma comissão sobre cada bilhete vendido. Sem custos iniciais, sem pulseiras, sem dinheiro em mão.",
    foto: "huambo",
    botao: "Falar com a MotoBox",
    ligacao: "/contacto#parcerias",
    nota: "Resposta em 48 horas úteis.",
  },
  semVenda: {
    esgotado: {
      titulo: "Bilhetes esgotados",
      texto: "Já não há bilhetes à venda na MotoBox para este evento.",
    },
    fechada: {
      titulo: "Bilheteira fechada",
      texto:
        "A venda de bilhetes online na MotoBox está fechada de momento. Volte mais tarde ou veja na página do evento como participar.",
    },
    semVenda: {
      titulo: "Sem bilhetes à venda",
      texto: "Este evento não tem venda de bilhetes online na MotoBox. Veja na página do evento como participar.",
    },
    verEvento: "Ver o evento",
    todos: "Todos os bilhetes",
  },
  compra: { pesquisaTitulo: "Bilhetes para {titulo}", sobretitulo: "Bilhetes", ronda: "Ronda {ronda}" },
});

/* ============================================================
   CAMPEONATO › COMPRA DE BILHETES (/bilhetes/[slug])
   ============================================================ */

/**
 * Um meio de pagamento do passo "Pagamento". O tipo escolhe o ícone; o
 * detalhe aparece por baixo da lista quando o meio está escolhido.
 * No texto do detalhe, {telefone} é o telemóvel que o comprador indicou;
 * nos valores das linhas, {referencia} é a referência da prova.
 *
 * O pagamento por cartão saiu da compra por agora: não há meio de
 * pagamento com cartão até se decidir como o integrar.
 */
export interface MetodoPagamento {
  id: string;
  activo: boolean;
  tipo: "telemovel" | "transferencia" | "outro";
  nome: string;
  descricao: string;
  detalheTitulo: string;
  detalheTexto: string;
  linhas: { rotulo: string; valor: string }[];
  nota: string;
}

export interface TextosCompra {
  todos: string;
  passos: { rotulo: string; bilhetes: string; dados: string; pagamento: string; bilhete: string; concluido: string };
  escolha: {
    titulo: string;
    maisProcurado: string;
    disponiveis: string;
    menos: string;
    mais: string;
  };
  dados: {
    titulo: string;
    nome: { rotulo: string; exemplo: string };
    email: { rotulo: string; exemplo: string };
    telefone: { rotulo: string; exemplo: string };
    bi: { rotulo: string; exemplo: string };
    sessao: string;
    privacidade: string;
    /** Na janela que pede para entrar ou criar conta. */
    motivoSessao: string;
    erros: { nome: string; email: string; telefone: string };
  };
  pagamento: {
    titulo: string;
    /** Em {telefone}, quando o comprador ainda não o escreveu. */
    semTelefone: string;
    semMetodos: string;
    metodos: MetodoPagamento[];
  };
  emitidos: {
    titulo: string;
    emitimosUm: string;
    emitimosVarios: string;
    guardar: string;
    data: string;
    local: string;
    portador: string;
    codigo: string;
    imprimir: string;
    voltarEventos: string;
    voltarCalendario: string;
    entrada: string;
  };
  resumo: {
    titulo: string;
    vazio: string;
    subtotal: string;
    taxa: string;
    total: string;
    notaTaxa: string;
    continuar: string;
    irPagamento: string;
    voltar: string;
    aVerificar: string;
    /** {valor} é o total a pagar. */
    pagar: string;
    seguro: string;
  };
}

export const METODO_VAZIO = (): MetodoPagamento => ({
  id: "",
  activo: true,
  tipo: "outro",
  nome: "",
  descricao: "",
  detalheTitulo: "",
  detalheTexto: "",
  linhas: [],
  nota: "",
});

export const COMPRA_PADRAO = (): TextosCompra => ({
  todos: "Todos os bilhetes",
  passos: {
    rotulo: "Progresso da compra",
    bilhetes: "Bilhetes",
    dados: "Dados",
    pagamento: "Pagamento",
    bilhete: "Bilhete",
    concluido: "Concluído",
  },
  escolha: {
    titulo: "Escolha os seus bilhetes",
    maisProcurado: "Mais procurado",
    disponiveis: "{n} disponíveis · máx. 10 por compra",
    menos: "Menos um bilhete {nome}",
    mais: "Mais um bilhete {nome}",
  },
  dados: {
    titulo: "Os seus dados",
    nome: { rotulo: "Nome completo", exemplo: "Como aparece no seu BI" },
    email: { rotulo: "Email", exemplo: "nome@exemplo.com" },
    telefone: { rotulo: "Telemóvel", exemplo: "+244 9xx xxx xxx" },
    bi: { rotulo: "Nº do BI (opcional)", exemplo: "para validação à entrada" },
    sessao: "Sessão iniciada como",
    privacidade: "Os seus dados servem apenas para emitir e validar o bilhete. Não são partilhados com terceiros.",
    motivoSessao: "Entre ou crie conta para concluir a compra. O que escolheu e escreveu fica tudo como está.",
    erros: { nome: "Indique o nome completo.", email: "Email inválido.", telefone: "Telefone inválido." },
  },
  pagamento: {
    titulo: "Método de pagamento",
    semTelefone: "que indicou",
    semMetodos: "De momento não há meios de pagamento disponíveis. Volte mais tarde ou fale connosco.",
    metodos: [
      {
        id: "multicaixa",
        activo: true,
        tipo: "telemovel",
        nome: "Multicaixa Express",
        descricao: "Confirme no telemóvel. Pagamento verificado automaticamente.",
        detalheTitulo: "Multicaixa Express",
        detalheTexto:
          "Ao confirmar, enviamos um pedido de pagamento para o número {telefone}. Aprove no telemóvel e o bilhete é emitido automaticamente.",
        linhas: [],
        nota: "",
      },
      {
        id: "transferencia",
        activo: true,
        tipo: "transferencia",
        nome: "Transferência bancária",
        descricao: "Receba o IBAN e a referência. Confirmação até 24 horas.",
        detalheTitulo: "Dados para transferência",
        detalheTexto: "",
        linhas: [
          { rotulo: "Beneficiário", valor: "MotoBox Angola" },
          { rotulo: "IBAN", valor: "AO06 0000 0000 0000 0000 0000 0" },
          { rotulo: "Banco", valor: "Banco Atlântico" },
          { rotulo: "Referência", valor: "{referencia}" },
        ],
        nota: "Envie o comprovativo para geral@motobox.ao. O bilhete é emitido após confirmação.",
      },
    ],
  },
  emitidos: {
    titulo: "Pagamento confirmado",
    emitimosUm: "Emitimos {n} bilhete.",
    emitimosVarios: "Emitimos {n} bilhetes.",
    guardar: "Guarde ou imprima esta página agora: é a sua única cópia.",
    data: "Data",
    local: "Local",
    portador: "Portador",
    codigo: "Código",
    imprimir: "Guardar / imprimir",
    voltarEventos: "Voltar aos eventos",
    voltarCalendario: "Voltar ao calendário",
    entrada: "Apresente o código QR à entrada, no telemóvel ou impresso. Cada código só pode ser validado uma vez.",
  },
  resumo: {
    titulo: "Resumo",
    vazio: "Ainda não escolheu bilhetes.",
    subtotal: "Subtotal",
    taxa: "Taxa de serviço",
    total: "Total",
    notaTaxa:
      "A taxa de serviço sustenta a plataforma e é retida pela MotoBox. O restante reverte para o organizador da prova.",
    continuar: "Continuar",
    irPagamento: "Ir para pagamento",
    voltar: "Voltar",
    aVerificar: "A verificar pagamento…",
    pagar: "Pagar {valor}",
    seguro: "Pagamento seguro · Bilhete digital imediato",
  },
});

/* ---------------- Registo ---------------- */

export const DOCS: DefDoc[] = [
  { chave: "site.geral", titulo: "Textos gerais do site", pagina: "/calendario", padrao: GERAL_PADRAO },
  { chave: "campeonato.calendario", titulo: "Calendário (página e provas)", pagina: "/calendario", padrao: CALENDARIO_PADRAO },
  { chave: "campeonato.resultados", titulo: "Resultados (arquivo e corridas)", pagina: "/resultados", padrao: RESULTADOS_PADRAO },
  { chave: "campeonato.classificacao", titulo: "Classificação", pagina: "/classificacao", padrao: CLASSIFICACAO_PADRAO },
  { chave: "campeonato.pilotos", titulo: "Pilotos (lista e fichas)", pagina: "/pilotos", padrao: PILOTOS_PADRAO },
  { chave: "campeonato.equipas", titulo: "Equipas (lista e fichas)", pagina: "/equipas", padrao: EQUIPAS_PADRAO },
  { chave: "campeonato.bilhetes", titulo: "Bilhetes", pagina: "/bilhetes", padrao: BILHETES_PADRAO },
  { chave: "campeonato.compra", titulo: "Compra de bilhetes", pagina: "/bilhetes", padrao: COMPRA_PADRAO },
];

export const GRUPOS: DefGrupo[] = [];
