/* ============================================================
   MOTOBOX — Perfis alargados dos clubes
   História, cronologia, encontros e adesão de cada clube, para a
   página /clubes/[slug]. A tabela `clubes` só guarda a ficha curta;
   enquanto não houver colunas para isto, o perfil vive no código,
   indexado pelo slug.

   Tudo tem fonte (lista `fontes` de cada perfil), e cada momento da
   cronologia e cada número aponta para a sua. Só se publicam nomes
   de dirigentes que a imprensa já publicou. Quando as fontes
   discordam, fica a versão mais prudente ou fica de fora: o número
   de países visitados pelos Amigos da Picada (13 ou 14), por
   exemplo, não se publica. Não se publicam notas de falecimento
   nem dados de pessoas que não são figuras públicas.

   Muito do que se sabe vem das páginas dos próprios clubes
   (Facebook, Instagram, site): o texto di-lo quando é o clube a
   falar de si. Informação verificada em Outubro de 2026.

   Excepção: o dono do site pediu as fichas todas preenchidas. O que
   foi inventado para tapar buracos está marcado no código com
   «Placeholder (a confirmar com o clube)» e não tem fonte (`fonte`
   vazio): a página não lhe mostra ligação nenhuma. Substituir pelo
   que os clubes confirmarem.
   ============================================================ */

import type { Clube } from "./types";

export interface FonteClube {
  nome: string;
  url: string;
}

/** Um momento da cronologia: viagem, raide, acção solidária, aniversário. */
export interface MomentoClube {
  /** "2006", "Agosto de 2022"; sem data certa, fica vazio. */
  ano?: string;
  titulo: string;
  texto: string;
  /** Índice em `fontes`. Vazio só nos placeholders, que não têm fonte. */
  fonte?: number;
}

/** Só números publicados numa fonte (ou placeholders, sem `fonte`). */
export interface NumeroClube {
  valor: string;
  rotulo: string;
  fonte?: number;
}

export interface ViagemClube {
  ano: string;
  nome: string;
  percurso: string;
  km?: string;
}

export interface PerfilClube {
  /** Uma linha, para o cartão em /clubes e o cabeçalho da página. */
  resumo: string;
  lema?: string;
  /** Parágrafos; "> citação — autor" sai como citação destacada. */
  historia: string[];
  /** Por ordem cronológica. */
  destaques: MomentoClube[];
  /** Tabela de viagens, quando o clube publicou a lista. */
  viagens?: { titulo: string; nota: string; fonte?: number; lista: ViagemClube[] };
  /** Pormenores que completam o campo `encontros` da base de dados. */
  encontros?: string[];
  comoAderir?: { passos: string[]; fonte?: number };
  estilo?: string;
  motas?: string;
  numeros?: NumeroClube[];
  fontes: FonteClube[];
}

/* Fontes partilhadas por mais de um clube. */
const F = {
  boaHistoria: {
    nome: "Bikers of Africa: a história dos Amigos da Picada, assinada pelo presidente (Julho de 2020)",
    url: "https://bikersofafrica.com/2020/07/08/amigos-da-picada/",
  },
  boaMocambique: {
    nome: "Bikers of Africa: Farewell: Miguel Paulo De Almeida Lopes (Setembro de 2023)",
    url: "https://bikersofafrica.com/2023/09/01/farewell-miguel-paulo-de-almeida-lopes/",
  },
  jaDiaMotard: {
    nome: "Jornal de Angola: Primeira edição do Dia do Motard Angolano acontece em Julho (Junho de 2026)",
    url: "https://www.jornaldeangola.ao/noticias/6/desporto/678170/primeira-edi%C3%A7%C3%A3o-do-dia-do-motard-angolano-acontece-em-julho",
  },
  eliteRaidBenguela: {
    nome: "Instagram (Elite Motard): Raid Benguela (Novembro de 2022)",
    url: "https://www.instagram.com/elite_motard_angola/p/ClE2xbmBYXh/",
  },
  eliteRaidSoyo: {
    nome: "Instagram (Elite Motard): Raid ao Soyo para o aniversário dos 300 km a Norte (Novembro de 2022)",
    url: "https://www.instagram.com/elite_motard_angola/p/ClE1cSDhjKC/",
  },
  // Página que publica as viagens do clube; não se confirmou que seja a página oficial.
  fbPerformance: { nome: "Facebook: publicações sobre o Performance Bikers", url: "https://www.facebook.com/reikatavala/" },
  capimBenguela: {
    nome: "Facebook (Amigos do Capim): Raid Benguela (Março de 2022)",
    url: "https://www.facebook.com/Clubeamigosdocapim/posts/1814783445381953/",
  },
} satisfies Record<string, FonteClube>;

export const PERFIS_CLUBES: Record<string, PerfilClube> = {
  /* ------------------------------------------------------------ */
  "amigos-da-picada": {
    resumo:
      "Desde 2006 na estrada: raides da Namíbia a Zanzibar, um raide anual pelas picadas de Angola e sopa solidária em hospitais de Luanda.",
    lema: "Faça sol ou faça chuva",
    historia: [
      "No início dos anos 2000 já havia motociclistas a passear por Luanda, uns por conta própria, outros no Motoclube de Luanda, quase sempre em passeios curtos e piqueniques de família. Os Amigos da Picada nasceram de quem queria outra coisa: viagens mais independentes, com espírito motard, para «viajar em liberdade». É assim que o clube conta a própria história, num texto assinado em 2020 pelo presidente, Lilio Almeida.",
      "Em Agosto de 2006, o grupo partiu para a primeira viagem além-fronteiras, até Oshakati, na Namíbia. Segundo esse texto, foram doze pessoas, entre motociclistas, acompanhantes e duas viaturas de apoio (o site do clube fala em cerca de quinze), e alguns foram voltando para trás pelo caminho, por falta de tempo. As estradas estavam quase todas destruídas pela guerra, e o grupo ganhou ali o nome. O clube considera essa viagem, o «Desafio ao Sul», o seu início.",
      "Em 2010 nasceu uma comissão de gestão, o grupo legalizou-se como clube, com estatutos homologados pelo Ministério da Juventude e Desportos, e passou de 20 para 48 membros. Em 2017, para cumprir a nova lei das associações privadas, tornou-se Associação Clube dos Amigos da Picada de Angola. Em 2019 contava 364 associados; em 2021, a Euronews falava em mais de 260 membros activos.",
      "O programa anual que a comissão desenhou dá a medida do clube: uma viagem internacional por ano, nove saídas de fim-de-semana a pontos turísticos de Angola, doze «Cafés da Picada» e o Raid Angola, dez dias a atravessar províncias pelas estradas mais difíceis, longe do asfalto, para dar a conhecer localidades e povos que muitos angolanos não conhecem.",
      "Nas viagens longas, de cerca de três semanas, há um Chefe de Caravana, que trata dos documentos e confirma que pessoas e veículos estão em ordem, e um Líder de Caravana, que conduz o grupo em segurança. O clube defende as viagens em grupo, para os mais velhos passarem a experiência aos mais novos, e desaconselha as viagens longas a solo. Quando entrar em Angola era mais difícil, chegou a emitir cartas-convite a viajantes estrangeiros que precisavam de atravessar o país.",
      "> Selecionamos sócios com um nível elevado de disciplina, pessoas com um autêntico espírito de motociclista, onde há uma forte componente social. — Lilio Almeida, presidente, à Euronews (2021)",
      "A solidariedade vem desde a primeira viagem, com comida e material didáctico distribuídos pelo caminho. Desde 2016, os Picadeiros Solidários confeccionam e distribuem sopa e merenda em três hospitais municipais de Luanda e em hospitais das províncias por onde o clube passa. Fora das viagens, os Amigos da Picada asseguram o percurso da Volta a Angola em bicicleta, o que fizeram em 2015, 2023 e 2024.",
      "Em 2021, a Euronews acompanhou o clube numa viagem de Luanda ao Cabiri, com paragens no Miradouro da Lua, na Muxima e no Parque Nacional da Quiçama. Na Muxima, um dos sócios explicou que o clube lá vai todos os anos receber a bênção na abertura do ano do motociclismo. Em Abril de 2026, na visita do Papa ao santuário, foram dois membros do clube que conduziram as motas dos operadores de câmara da TPA.",
    ],
    destaques: [
      {
        ano: "Agosto de 2006",
        titulo: "Desafio ao Sul",
        texto: "A primeira viagem do grupo: de Luanda a Oshakati, na Namíbia, 2655 km. Foi a viagem que deu o nome ao clube.",
        fonte: 0,
      },
      {
        ano: "2010",
        titulo: "De grupo a clube",
        texto: "Órgãos sociais eleitos em assembleia e estatutos homologados pelo Ministério da Juventude e Desportos.",
        fonte: 3,
      },
      {
        ano: "2012",
        titulo: "Raid Angola: 12 províncias em 10 dias",
        texto: "Para saudar os 37 anos da independência, o raide anual atravessou 12 províncias em dez dias.",
        fonte: 5,
      },
      {
        ano: "2015",
        titulo: "Na Volta a Angola em bicicleta",
        texto: "Primeira de três edições (2015, 2023 e 2024) em que o clube assegurou o percurso, a vigiar cruzamentos e desvios para o pelotão passar em segurança.",
        fonte: 6,
      },
      {
        ano: "2016",
        titulo: "Picadeiros Solidários",
        texto: "Começa a distribuição regular de sopa e merenda em três hospitais municipais de Luanda.",
        fonte: 0,
      },
      {
        ano: "Maio de 2017",
        titulo: "Associação",
        texto: "O clube passa a Associação Clube dos Amigos da Picada de Angola, publicada no Diário da República n.º 88, III série, de 11 de Maio de 2017.",
        fonte: 3,
      },
      {
        ano: "Agosto de 2019",
        titulo: "13 anos",
        texto: "A 10 de Agosto, o clube festejou 13 anos de existência no Ginásio da Cidadela.",
        fonte: 8,
      },
      {
        ano: "2021",
        titulo: "Com a Euronews",
        texto: "Reportagem de Luanda ao Cabiri, pelo Miradouro da Lua, a Muxima e a Quiçama.",
        fonte: 1,
      },
      {
        ano: "Agosto de 2022",
        titulo: "16 anos no Sumbe",
        texto: "O aniversário foi no Sumbe, com entrega de donativos, plantação de árvores no cemitério municipal e numa escola, e festa no restaurante Mar Sol.",
        fonte: 9,
      },
      {
        ano: "Setembro de 2023",
        titulo: "A caminho de Moçambique",
        texto: "Membros do clube atravessaram a África do Sul com motards do 3G, dos Performance Bikers e dos Anjos Bantu, rumo ao passeio nacional do Mozambique Adventure Team. Um dos motociclistas do grupo adoeceu e morreu na viagem; motards sul-africanos juntaram-se para apoiar os angolanos.",
        fonte: 10,
      },
      {
        ano: "Abril de 2026",
        titulo: "Na visita do Papa à Muxima",
        texto: "Dois membros conduziram as motas que levavam os operadores de câmara da TPA durante a transmissão em directo.",
        fonte: 11,
      },
      {
        ano: "Agosto de 2026",
        titulo: "20 anos",
        texto: "A 20.ª festa de aniversário juntou vários grupos de motards de Angola.",
        fonte: 12,
      },
    ],
    viagens: {
      titulo: "Raides além-fronteiras",
      nota: "Lista e distâncias publicadas pelo clube em 2020. A versão portuguesa do mesmo texto não inclui a Botswana Bikers Week de 2018.",
      fonte: 0,
      lista: [
        { ano: "2006", nome: "Desafio ao Sul", percurso: "Namíbia", km: "2655" },
        { ano: "2009", nome: "Maputo Grande Desafio", percurso: "Namíbia, Botswana, África do Sul, Moçambique", km: "8718" },
        { ano: "2010", nome: "Grandes Lagos", percurso: "Zâmbia, Namíbia", km: "6753" },
        { ano: "2011", nome: "Atlântico ao Índico", percurso: "Namíbia, Zâmbia, Moçambique, África do Sul", km: "9741" },
        { ano: "2012", nome: "CAN Orange 2012", percurso: "RD Congo, Congo, Gabão, Guiné Equatorial", km: "5047" },
        { ano: "2013", nome: "CAN Orange 2013", percurso: "Namíbia, África do Sul", km: "9583" },
        { ano: "2014", nome: "Ruacaná", percurso: "Namíbia", km: "4126" },
        { ano: "2015", nome: "Rumo a Zanzibar", percurso: "Namíbia, Zâmbia, Tanzânia, Zanzibar, Zimbabwe, Botswana", km: "9654" },
        { ano: "2016", nome: "Kapungo", percurso: "RD Congo", km: "1640" },
        { ano: "2017", nome: "Paz 15 Anos", percurso: "Namíbia, Botswana, África do Sul, Moçambique, Suazilândia", km: "8034" },
        { ano: "2018", nome: "Botswana Bikers Week", percurso: "Namíbia, Botswana", km: "6293" },
        { ano: "2018", nome: "Malawi", percurso: "Namíbia, Zâmbia, Malawi", km: "7714" },
        { ano: "2019", nome: "Skeleton Coast", percurso: "Namíbia", km: "4820" },
      ],
    },
    encontros: [
      "Aniversário em Agosto: os 13 anos festejaram-se a 10 de Agosto de 2019, e a festa dos 20 anos, em 2026, juntou vários grupos de motards.",
    ],
    comoAderir: {
      passos: [
        "Conhecer e aceitar os Estatutos e o Regulamento Interno de Disciplina do clube.",
        "Ser apresentado por sócios efectivos ou honorários, que ficam como padrinhos.",
        "Ter até 60 dias para mostrar que conhece as normas e ser avaliado como apto a sócio.",
        "Depois de aprovado, pagar a jóia de inscrição e as quotas mensais, que não podem atrasar três meses.",
      ],
      fonte: 4,
    },
    estilo: "Moto-turismo e aventura de longo curso, sempre em grupo e com viaturas de apoio. O raide anual foge do asfalto.",
    numeros: [
      { valor: "364", rotulo: "associados em 2019", fonte: 0 },
      { valor: "260+", rotulo: "membros activos em 2021", fonte: 1 },
      { valor: "3", rotulo: "hospitais de Luanda com sopa e merenda", fonte: 0 },
      { valor: "10", rotulo: "dias de Raid Angola, longe do asfalto", fonte: 0 },
    ],
    fontes: [
      F.boaHistoria,
      {
        nome: "Euronews: Uma viagem de mota à descoberta das paisagens de Angola (Março de 2021, conteúdo em parceria com o Governo de Angola)",
        url: "https://pt.euronews.com/2021/03/10/uma-viagem-de-mota-a-descoberta-das-paisagens-de-angola",
      },
      {
        nome: "Euronews: The bikers making Angola the ride of their lives (2021)",
        url: "https://www.euronews.com/2021/03/10/the-bikers-making-angola-the-ride-of-their-lives",
      },
      {
        nome: "Site dos Amigos da Picada: «A nossa história» (página em construção)",
        url: "https://amigosdapicada.com/wp-json/wp/v2/pages/475",
      },
      {
        nome: "Site dos Amigos da Picada: «Seja membro» (página em construção)",
        url: "https://amigosdapicada.com/wp-json/wp/v2/pages/733",
      },
      { nome: "YouTube (Lilio Almeida): Raid Angola 2012", url: "https://www.youtube.com/watch?v=VxfaayLhVh8" },
      {
        nome: "Jornal de Angola: Volta a Angola em bicicleta: Amigos da Picada asseguram corrida (Outubro de 2024)",
        url: "https://www.jornaldeangola.ao/noticias/6/desporto/12381/volta-a-angola-em-bicicleta:-amigos-da-picada-asseguram-corrida",
      },
      { nome: "YouTube (Amigos da Picada): Sopa Solidária 2019", url: "https://www.youtube.com/watch?v=QLbceP31wmU" },
      { nome: "YouTube (Editora Educasat World): 13 anos do clube (Agosto de 2019)", url: "https://www.youtube.com/watch?v=_FqeStg3O9c" },
      { nome: "TV Milcondes: 16.º aniversário no Sumbe (Agosto de 2022)", url: "https://www.youtube.com/watch?v=fAOkwWjWGfE" },
      F.boaMocambique,
      {
        nome: "Jornal de Angola: Peregrinos expõem tamanho da fé no Santuário da Muxima (Abril de 2026)",
        url: "https://www.jornaldeangola.ao/noticias/3/sociedade/674231/peregrinos-exp%C3%B5em-tamanho--da-f%C3%A9-no-santu%C3%A1rio-da-muxima",
      },
      { nome: "YouTube (MotoAventura): nos 20 anos dos Amigos da Picada (Agosto de 2026)", url: "https://www.youtube.com/watch?v=HcstqXFCnzo" },
      { nome: "Instagram @amigosdapicada", url: "https://www.instagram.com/amigosdapicada/" },
    ],
  },

  /* ------------------------------------------------------------ */
  "ladies-in-2-wheels-angola": {
    resumo:
      "Mulheres que conduzem as próprias motas: viagens pela região, filantropia e uma mensagem simples, a lady rider é a motorista.",
    lema: "Whatever we can do, you can too",
    historia: [
      "As Ladies in 2 Wheels in Angola apresentam-se como «motards femininas»: mulheres que conduzem as próprias motas e viajam juntas, com turismo, filantropia «and lots of fun» na bagagem. Na apresentação do perfil, ao lado de «Traveling», estão as bandeiras de Angola, da Namíbia, da RD Congo, do Botswana, da África do Sul, do Zimbabwe e de Moçambique.",
      "Em Março de 2026, o grupo celebrou «o dia em que Luanda presenciou as mulheres em movimento»: «Como se de um furacão se tratasse, depois da passagem das motas, Luanda não foi a mesma.» Dias depois, levou o tema à Rádio NJ, numa conversa sobre esse dia e o seu impacto social.",
      "A mensagem repete-se nas publicações: «a lady rider é a motorista, não a pendura». E o lema do perfil resume o resto: «Life is a ride kinda girls. Whatever we can do, you can too.» Em Agosto de 2026, duas motociclistas próximas do grupo contaram as suas histórias no podcast Pod Room by Turrum, num episódio publicado em conjunto com as Ladies.",
    ],
    destaques: [
      {
        ano: "Março de 2026",
        titulo: "Mulheres em Movimento",
        texto: "«Como se de um furacão se tratasse, depois da passagem das motas, Luanda não foi a mesma.»",
        fonte: 1,
      },
      {
        ano: "Março de 2026",
        titulo: "Na Rádio NJ",
        texto: "Conversa no programa das terças, com Lauriano, sobre o dia das mulheres em movimento e o seu impacto social.",
        fonte: 2,
      },
      {
        ano: "Agosto de 2026",
        titulo: "Lady Rider, no Pod Room",
        texto: "Episódio «Lady Rider: Mulheres, Motas e Histórias», do podcast Pod Room by Turrum, gravado em Luanda.",
        fonte: 4,
      },
    ],
    // Placeholder (a confirmar com o clube)
    comoAderir: {
      passos: [
        "Ter carta de condução de motociclos e mota própria: aqui, a lady rider é a motorista.",
        "Seguir o grupo no Instagram e mandar mensagem a apresentar-se.",
        "Juntar-se a uma saída em Luanda, para conhecer as outras motociclistas e o ritmo do grupo.",
        "Depois das primeiras saídas, entrar no grupo e nas viagens maiores, pelo país e além-fronteiras.",
      ],
    },
    estilo: "Turismo e viagens de mota entre mulheres que conduzem, com acções filantrópicas.",
    fontes: [
      { nome: "Instagram @ladies_riders_ao: apresentação do perfil", url: "https://www.instagram.com/ladies_riders_ao/" },
      { nome: "Instagram: «Mulheres em Movimento» em Luanda (Março de 2026)", url: "https://www.instagram.com/p/DV_SqXsDOru/" },
      { nome: "Instagram: conversa na Rádio NJ (Março de 2026)", url: "https://www.instagram.com/ladies_riders_ao/reel/DWRpks4DKxj/" },
      { nome: "Instagram: «a lady rider é a motorista» (Março de 2026)", url: "https://www.instagram.com/p/DWJgzlgjIKy/" },
      { nome: "Pod Room by Turrum: EP. 02, Lady Rider (Agosto de 2026)", url: "https://www.youtube.com/watch?v=YiWhpFHuTgE" },
    ],
  },

  /* ------------------------------------------------------------ */
  "motards-de-angola": {
    resumo: "Uma das páginas motard mais seguidas de Angola, com um objectivo assumido: ajudar a engrandecer o turismo no país.",
    historia: [
      "A página Motards De Angola, no Facebook, é das mais seguidas do meio motard angolano: passava os 71 mil seguidores em Outubro de 2026. Apresenta-se com um objectivo só: «darem o melhor de si, para o engrandecimento do turismo em Angola».",
      "No Instagram há uma conta com o mesmo nome, @motardsangola, que se diz «juntos e unidos desde 2014» e escreve: «Não viajamos pela natureza, mas sim fazendo parte da natureza!» Não encontrámos nada que ligue oficialmente as duas contas, por isso o que cada uma diz fica atribuído a cada uma.",
      "A conta @motardsangola aparece marcada por outros clubes em saídas de grupo, como no Raid Benguela de Novembro de 2022, publicado pela Elite Motard com os Performance Bikers.",
    ],
    destaques: [
      {
        ano: "Novembro de 2022",
        titulo: "Raid Benguela",
        texto: "A Elite Motard marcou @motardsangola e os Performance Bikers na publicação do raide.",
        fonte: 2,
      },
    ],
    // Placeholder (a confirmar com o clube)
    comoAderir: {
      passos: [
        "Seguir a página no Facebook, onde saem os passeios e os encontros.",
        "Aparecer num passeio aberto em Belas, de capacete e documentos em ordem.",
        "Rodar com o grupo algumas vezes e pedir a inscrição como membro à organização.",
      ],
    },
    estilo: "Turismo de mota pelo país.",
    numeros: [{ valor: "71 mil", rotulo: "seguidores no Facebook, em Outubro de 2026", fonte: 0 }],
    fontes: [
      { nome: "Facebook: Motards De Angola", url: "https://www.facebook.com/p/Motards-De-Angola-100079850005166/" },
      { nome: "Instagram @motardsangola (conta com o mesmo nome)", url: "https://www.instagram.com/motardsangola/" },
      F.eliteRaidBenguela,
    ],
  },

  /* ------------------------------------------------------------ */
  "amigos-do-capim": {
    resumo: "Raides pelo país com uma acção solidária em cada paragem: «ser solidário cuia bué».",
    lema: "Distribuindo esperança por Angola, porque ser solidário cuia bué",
    historia: [
      "Os Amigos do Capim apresentam-se como um «grupo de irmandade, amantes de desportos sobre rodas», e põem a solidariedade à frente de tudo. O lema diz «Distribuindo esperança por Angola, porque ser solidário cuia bué»; o grito de guerra, repetido em quase todas as publicações, é outro: «Arroz, arroz, arroz, carrega e mais nada.»",
      "Em Novembro de 2025, o clube assinalou os dez anos de existência com uma acção solidária no Porto Amboim. Tem núcleos em Luanda e no Cuanza-Sul, que já fizeram almoços de confraternização em simultâneo, e encontros como o «Chá dos AC», num restaurante de Luanda.",
      "Na estrada, os raides atravessam o país. O Raid KK+, em Novembro de 2018, levou oito motas e um carro de Luanda ao Huambo, ao Cuando Cubango, ao Bié e aos dois Cuanzas. O Raid Benguela, em Março de 2022, juntou dez motas e dois carros em cerca de 1322 km, ida e volta, com os Soldados do Asfalto e os 12D, e teve a recepção dos African Nómadas. No fim de 2025, o clube partilhou as imagens do Raid Namíbia e, no fim de Agosto de 2026, fez o Raid Lubango, pela EN100 e pela EN105 até às Terras Altas da Chela: «11 anos depois, o Clube Amigos do Capim volta à Serra da Leba.»",
      "A solidariedade vai em cada saída. Em Agosto de 2020, o Cacimbo Solidário quis «aquecer quem precisa»: mais de 100 crianças da ONG MISFRON, que gere casas de acolhimento de menores no Zango 3. Duas semanas depois, a convite de um grupo filantrópico de efectivos do Ministério do Interior, o clube fez uma campanha de sensibilização e prevenção contra a Covid-19 no Futungo, em Talatona. No Raid Benguela levou cestas básicas a mais de 20 famílias em Mahombulo, e no Raid Lubango parou no Centro Materno Infantil de Quilengues.",
      "Desde 2025, o Projecto Pés Descalços entrega chinelas, roupa e bens alimentares a comunidades carenciadas: em Junho de 2026, pelo segundo ano seguido, foi a Kifangondo, na Paróquia de Santo António, e a Ngola Mussungo, no Cuanza-Sul, com o apoio de empresas e comerciantes locais.",
    ],
    destaques: [
      {
        ano: "Novembro de 2018",
        titulo: "Raid KK+",
        texto: "De 9 a 15 de Novembro, oito membros e cinco convidados, em oito motas e um carro, por Huambo, Cuando Cubango, Bié e os dois Cuanzas.",
        fonte: 3,
      },
      {
        ano: "Agosto de 2020",
        titulo: "Cacimbo Solidário",
        texto: "A 2 de Agosto, para mais de 100 crianças da ONG MISFRON, no Zango 3.",
        fonte: 1,
      },
      {
        ano: "Agosto de 2020",
        titulo: "Contra a Covid-19 no Futungo",
        texto: "A 15 de Agosto, campanha de sensibilização e prevenção no bairro Futungo, em Talatona, com um grupo filantrópico de efectivos do Ministério do Interior.",
        fonte: 2,
      },
      {
        ano: "Março de 2022",
        titulo: "Raid Benguela",
        texto: "Lobito, Benguela e Mahombulo, cerca de 1322 km ida e volta, com cestas básicas para mais de 20 famílias.",
        fonte: 4,
      },
      {
        ano: "Junho de 2022",
        titulo: "Primeiro Trackday",
        texto: "A primeira actividade do clube em pista, a 12 de Junho.",
        fonte: 5,
      },
      {
        ano: "Novembro de 2025",
        titulo: "10 anos",
        texto: "Acção solidária no Porto Amboim, com a doação de uma cadeira de rodas e bens de primeira necessidade a uma família.",
        fonte: 6,
      },
      {
        ano: "Dezembro de 2025",
        titulo: "Raid Namíbia",
        texto: "O clube partilhou as imagens do raide à Namíbia.",
        fonte: 7,
      },
      {
        ano: "Junho de 2026",
        titulo: "Projecto Pés Descalços",
        texto: "A 14 de Junho, entrega de chinelas, roupa e bens alimentares em Kifangondo e em Ngola Mussungo.",
        fonte: 0,
      },
      {
        ano: "Julho de 2026",
        titulo: "Dia do Motard Angolano",
        texto: "O clube esteve na primeira edição do Dia do Motard Angolano.",
        fonte: 0,
      },
      {
        ano: "Agosto de 2026",
        titulo: "Raid Lubango",
        texto: "Pela EN100 e pela EN105 até às Terras Altas da Chela, onze anos depois da primeira ida à Serra da Leba, com paragem solidária em Quilengues.",
        fonte: 0,
      },
    ],
    encontros: [
      "Núcleos em Luanda e no Cuanza-Sul, com almoços de confraternização e o «Chá dos AC» num restaurante de Luanda.",
    ],
    // Placeholder (a confirmar com o clube)
    comoAderir: {
      passos: [
        "Ter mota ou carro de apoio e vontade de ajudar: a solidariedade vai em cada saída.",
        "Participar num raide ou numa acção solidária do clube como convidado.",
        "Entrar num dos núcleos, em Luanda ou no Cuanza-Sul.",
        "Pagar a quota, que ajuda a pagar as acções solidárias do clube.",
      ],
    },
    estilo: "Raides pelo país e acção solidária, com motas e carros de apoio.",
    fontes: [
      { nome: "Facebook: Clube Amigos do Capim", url: "https://www.facebook.com/Clubeamigosdocapim/" },
      { nome: "Bikers of Africa: Cacimbo Solidário (Agosto de 2020)", url: "https://bikersofafrica.com/2020/08/04/angola-clube-amigos-do-capim/" },
      {
        nome: "Bikers of Africa: campanha contra a Covid-19 no Futungo (Agosto de 2020)",
        url: "https://bikersofafrica.com/2020/08/24/angola-club-amigos-do-capim-charity-run/",
      },
      {
        nome: "Facebook: Raid KK+ (Novembro de 2018)",
        url: "https://www.facebook.com/Clubeamigosdocapim/posts/raid-kk-realizou-se-de-09112018-a-15112018-luanda-sul-huambo-cuando-cubando-bi%C3%A9-/905065503020423/",
      },
      F.capimBenguela,
      {
        nome: "Facebook: primeiro Trackday (Junho de 2022)",
        url: "https://www.facebook.com/Clubeamigosdocapim/posts/nota-de-agradecimento-clube-motard-amigos-do-capim%C3%A1-todas-as-pessoas-que-colabor/1891652107695086/",
      },
      {
        nome: "Facebook: acção solidária dos 10 anos no Porto Amboim (Novembro de 2025)",
        url: "https://www.facebook.com/Clubeamigosdocapim/posts/amigos-do-capim-em-ac%C3%A7%C3%A3o-no-%C3%A2mbito-das-competi%C3%A7%C3%B5es-alusivas-aos-10-anos-de-exist/1257583613071593/",
      },
      { nome: "Facebook: Raid Namíbia (Dezembro de 2025)", url: "https://www.facebook.com/photo/?fbid=1277369164426371" },
      {
        nome: "Facebook: o lema do clube (Julho de 2019)",
        url: "https://www.facebook.com/Clubeamigosdocapim/posts/clube-amigos-do-capim-distribuindo-esperan%C3%A7a-por-angola-porque-ser-solid%C3%A1rio-cui/1043685675825071/",
      },
      {
        nome: "Facebook: almoço dos núcleos de Luanda e Cuanza-Sul (Fevereiro de 2021)",
        url: "https://www.facebook.com/Clubeamigosdocapim/posts/momento-acfoi-com-prazer-e-satisfa%C3%A7%C3%A3o-que-o-nosso-clube-motard-amigos-do-capim-r/1517936945066606/",
      },
    ],
  },

  /* ------------------------------------------------------------ */
  "performance-bikers-2015": {
    resumo:
      "Nascido num domingo de 2015 em Luanda: mototurismo, raides pelo país e além-fronteiras e acções solidárias, como a da Quibala.",
    historia: [
      "Os Performance Bikers contam a sua origem numa frase: «Foi num belo Domingo em Luanda 7/2/2015, onde juntos saborearam o prazer de andar em grupo, e viver a pureza da liberdade entre suas motas.» O clube diz dedicar-se ao mototurismo, ao desporto e às causas sociais, e os membros tratam-se por «PBs».",
      "Em 2022, a sede ficava na Maianga, em Luanda. Daí saem raides pelo país, da Serra da Leba ao Huambo e a Malanje, e viagens além-fronteiras: em 2018, o regresso a casa fez-se pelo Botswana e, em Setembro de 2023, membros do clube atravessaram a África do Sul com os Amigos da Picada, o 3G e os Anjos Bantu, a caminho do passeio nacional do Mozambique Adventure Team.",
      "Na parte solidária, o clube levou donativos a cerca de 110 famílias da Quibala, no Cuanza-Sul, mais de 270 crianças, numa saída de Luanda a 30 de Abril de 2022. Em Dezembro de 2024 juntou-se à marcha «Quadra Festiva Segura», promovida pelo Ministério da Saúde, do Largo dos Motoristas ao Largo do Sweto, em Luanda.",
    ],
    destaques: [
      {
        ano: "Fevereiro de 2015",
        titulo: "Um domingo em Luanda",
        texto: "A 7 de Fevereiro de 2015 nasce o clube, de um grupo que descobriu junto o prazer de andar em grupo.",
        fonte: 0,
      },
      {
        ano: "Agosto de 2018",
        titulo: "Regresso pelo Botswana",
        texto: "Uma viagem além-fronteiras com regresso a casa pelo Botswana.",
        fonte: 3,
      },
      {
        ano: "Abril de 2022",
        titulo: "Acção solidária na Quibala",
        texto: "Partida de Luanda a 30 de Abril e regresso a 1 de Maio, com donativos para cerca de 110 famílias, mais de 270 crianças.",
        fonte: 1,
      },
      {
        ano: "Outubro de 2022",
        titulo: "O Boda, com os 300 km a Norte",
        texto: "O clube publicou a 2.ª edição de «O Boda», a festa dos 300 km a Norte, a 8 de Outubro.",
        fonte: 2,
      },
      {
        ano: "Setembro de 2023",
        titulo: "Pela África do Sul rumo a Moçambique",
        texto: "Com motards dos Amigos da Picada, do 3G e dos Anjos Bantu, a caminho do passeio nacional do Mozambique Adventure Team.",
        fonte: 4,
      },
      {
        ano: "Dezembro de 2024",
        titulo: "Quadra Festiva Segura",
        texto: "Marcha de sensibilização rodoviária do Ministério da Saúde, a 21 de Dezembro, do Largo dos Motoristas ao Largo do Sweto (Cine Atlântico).",
        fonte: 2,
      },
      {
        ano: "Abril de 2026",
        titulo: "Raid Malanje",
        texto: "Os PBs foram recebidos pela Administração do Cuale, em Malanje.",
        fonte: 5,
      },
    ],
    encontros: ["Sede na Maianga, em Luanda: Rua Aíres de Menezes, n.º 99, segundo o clube em Abril de 2022."],
    // Placeholder (a confirmar com o clube)
    comoAderir: {
      passos: [
        "Seguir o clube no Instagram e aparecer numa saída de grupo.",
        "Rodar com os PBs como convidado durante uns meses, para conhecer o grupo e as regras da estrada.",
        "Ser apresentado à direcção, na sede da Maianga.",
        "Depois de aceite, pagar a quota e passar a PB.",
      ],
    },
    estilo: "Mototurismo, desporto e causas sociais, nas palavras do clube.",
    numeros: [
      { valor: "110", rotulo: "famílias apoiadas na Quibala, em 2022", fonte: 1 },
      { valor: "270+", rotulo: "crianças nessa acção", fonte: 1 },
    ],
    fontes: [
      { nome: "Instagram @performancebikers2015: apresentação do perfil", url: "https://www.instagram.com/performancebikers2015/" },
      {
        nome: "Facebook (Motobox Angola): convite do clube para a acção solidária na Quibala (Abril de 2022)",
        url: "https://www.facebook.com/motoboxangola/posts/clube-performance-bikersassunto-ac%C3%A7%C3%A3o-solid%C3%A1ria-convitedign%C3%ADssimoo-clube-motard-/1705154806482488/",
      },
      F.fbPerformance,
      {
        nome: "Facebook: de regresso a casa pelo Botswana (Agosto de 2018)",
        url: "https://www.facebook.com/reikatavala/posts/peformance-bikersde-regresso-a-casa-passando-pelo-botswana/884398305090666/",
      },
      F.boaMocambique,
      { nome: "Instagram: recebidos pela Administração do Cuale (Abril de 2026)", url: "https://www.instagram.com/p/DW1Zt26lyG6/" },
    ],
  },

  /* ------------------------------------------------------------ */
  "african-nomadas": {
    resumo: "O clube do Lobito com núcleos de Benguela ao Cuando Cubango: raides ao Lubango e a Kalandula, e sopa solidária no hospital pediátrico.",
    lema: "Liberdade sobre rodas",
    historia: [
      "Os African Nómadas são um clube motard do Lobito que cabe numa frase da sua página: «Club African Nómadas, liberdade sobre rodas». Nas publicações escrevem «Mais que um clube. African Nómadas é uma família», e os vídeos de um dos membros mostram o 3.º aniversário, em 2022, com desfile motard.",
      "O clube organiza-se em núcleos: além de Benguela, apresentou em 2023 delegados e membros dos núcleos de Luanda, do Huambo e do Cuando Cubango. Cada novo membro entra com um «baptismo»: «É desta forma que oficializamos mais um membro na nossa equipe.»",
      "Na estrada, o perfil guarda o Ride Lubango e o Raid Luanda, o Raid São Lubas e, em Outubro de 2023, Malanje e as Quedas de Kalandula: «Missão cumprida.» No mesmo mês, o clube anunciou o seu primeiro raide internacional, à Namíbia, de 1 a 12 de Novembro. Em 2022, recebeu em Benguela os Amigos do Capim no Raid Benguela.",
      "Na parte solidária, os African Nómadas levaram uma Sopa Solidária ao Hospital Pediátrico do Lobito.",
    ],
    destaques: [
      {
        ano: "2022",
        titulo: "3.º aniversário",
        texto: "Festa de aniversário, filmada por um dos membros.",
        fonte: 2,
      },
      {
        ano: "2022",
        titulo: "Ride Lubango",
        texto: "Viagem de mota ao Lubango com o clube.",
        fonte: 3,
      },
      {
        ano: "Março de 2022",
        titulo: "Anfitriões dos Amigos do Capim",
        texto: "Recepção e apoio aos Amigos do Capim no Raid Benguela.",
        fonte: 8,
      },
      {
        ano: "Outubro de 2023",
        titulo: "Quedas de Kalandula",
        texto: "Raide a Malanje até às quedas: «Missão cumprida Quedas de Kalandula.»",
        fonte: 4,
      },
      {
        ano: "Novembro de 2023",
        titulo: "Primeiro raide internacional",
        texto: "Anunciado para 1 a 12 de Novembro, de Angola à Namíbia: o primeiro raide do clube fora do país.",
        fonte: 5,
      },
      {
        // Placeholder (a confirmar com o clube): a data é a do vídeo, publicado em 2024.
        ano: "2024",
        titulo: "Sopa Solidária",
        texto: "No Hospital Pediátrico do Lobito, filmada por um dos membros.",
        fonte: 6,
      },
    ],
    // Placeholder (a confirmar com o clube): só o «baptismo» vem de uma publicação do clube (fonte 7).
    comoAderir: {
      passos: [
        "Falar com o núcleo mais perto: Benguela, Luanda, Huambo ou Cuando Cubango.",
        "Fazer algumas saídas com o clube como convidado, para conhecer a família.",
        "Ser aceite pelos membros do núcleo.",
        "Receber o «baptismo», que torna o novo membro oficialmente African Nómada: «É desta forma que oficializamos mais um membro na nossa equipe.»",
      ],
    },
    motas:
      "Nas apresentações de membros publicadas em 2023 há sobretudo trail e turismo de grande cilindrada (BMW GS 1200, Ducati Multistrada, Honda Transalp, Varadero e Crosstourer), mas também desportivas e custom.",
    estilo: "Moto-turismo e raides pelo país.",
    fontes: [
      { nome: "Facebook: African Nómadas", url: "https://www.facebook.com/africannomadas/" },
      { nome: "Instagram @africannomadas", url: "https://www.instagram.com/africannomadas/" },
      { nome: "YouTube (Belo Carlos Vlog): 3.º aniversário dos African Nómadas (2022)", url: "https://www.youtube.com/watch?v=qsY2Av7AVi4" },
      { nome: "YouTube (Belo Carlos Vlog): Ride Lubango com os African Nómadas (2022)", url: "https://www.youtube.com/watch?v=q_1wanGB39k" },
      { nome: "Instagram: Quedas de Kalandula (Outubro de 2023)", url: "https://www.instagram.com/p/Cx7T96gM9ne/" },
      { nome: "Instagram: anúncio do primeiro raide internacional (Outubro de 2023)", url: "https://www.instagram.com/p/Cyi1p13Nq1q/" },
      {
        nome: "YouTube (Belo Carlos Vlog): Sopa Solidária no Hospital Pediátrico do Lobito (2024)",
        url: "https://www.youtube.com/watch?v=U369iMHk4vg",
      },
      { nome: "Instagram: baptismo de um novo membro (Outubro de 2023)", url: "https://www.instagram.com/p/Cyv2CQXM52J/" },
      F.capimBenguela,
      { nome: "YouTube (Belo Carlos Vlog): Raid Luanda com os African Nómadas (2023)", url: "https://www.youtube.com/watch?v=rI2BFf6SoUs" },
      { nome: "YouTube (Belocarlosvlog): 3.º aniversário com desfile motard (2022)", url: "https://www.youtube.com/watch?v=HU3AbnynH2o" },
    ],
  },

  /* ------------------------------------------------------------ */
  "300-km-a-norte": {
    resumo: "Motards do Soyo, de Luanda e de Moçambique: aventura, filantropia e «O Boda», a festa de aniversário que recebe clubes no Soyo.",
    historia: [
      "Os 300 km a Norte são motards que vivem no Soyo, em Luanda e em Moçambique, unidos, como escrevem, pela «paixão sobre duas rodas, adrenalina, aventura e filantropia». No Instagram assinam «Prazer Sobre Rodas» e resumem o resto numa frase: «Irmandade é o que nos torna fortes.»",
      "O ponto alto do ano é «O Boda», a festa de aniversário, em Outubro, no Soyo. Em 2022, a 2.ª edição, a 8 de Outubro, apareceu nas páginas dos Performance Bikers, e a Elite Motard foi ao Soyo em raide para o aniversário; em 2024, «O Boda» assinalou o 6.º aniversário do clube.",
      "Fora do Soyo, o perfil guarda saídas a Malanje e ao Nzeto, e acções solidárias que o clube resume assim: «Dar o sorriso á quem não tem.»",
    ],
    destaques: [
      {
        ano: "Setembro de 2021",
        titulo: "Dar o sorriso",
        texto: "Acção solidária partilhada no perfil do clube.",
        fonte: 5,
      },
      {
        ano: "Março de 2022",
        titulo: "Malanje",
        texto: "Vídeo da saída do clube a Malanje.",
        fonte: 6,
      },
      {
        ano: "Outubro de 2022",
        titulo: "O Boda, 2.ª edição",
        texto: "A festa do clube, a 8 de Outubro.",
        fonte: 2,
      },
      {
        ano: "Novembro de 2022",
        titulo: "Raid Soyo",
        texto: "A Elite Motard foi em raide ao aniversário do clube, no Soyo.",
        fonte: 1,
      },
      {
        ano: "Junho de 2024",
        titulo: "Passeio ao Nzeto",
        texto: "Passeio ao Nzeto, no Zaire.",
        fonte: 4,
      },
      {
        ano: "Outubro de 2024",
        titulo: "6.º aniversário",
        texto: "«O Boda» assinalou os seis anos do clube, no Soyo.",
        fonte: 3,
      },
    ],
    encontros: ["«O Boda», em Outubro, no Soyo: a festa de aniversário do clube, que já recebeu outros clubes em raide."],
    // Placeholder (a confirmar com o clube)
    comoAderir: {
      passos: [
        "O clube tem membros no Soyo, em Luanda e em Moçambique: fale com quem estiver mais perto, pelo Instagram.",
        "Participar numa saída ou numa acção solidária do clube.",
        "Ser aceite pelos membros e pagar a quota anual.",
      ],
    },
    estilo: "Aventura, raides e filantropia.",
    fontes: [
      { nome: "Instagram @300km_a_norte", url: "https://www.instagram.com/300km_a_norte/" },
      F.eliteRaidSoyo,
      F.fbPerformance,
      { nome: "Instagram: «O Boda», 6.º aniversário (Outubro de 2024)", url: "https://www.instagram.com/p/DAxDmczsgsn/" },
      { nome: "Instagram: passeio ao Nzeto (Junho de 2024)", url: "https://www.instagram.com/p/C71JzvdOAfq/" },
      { nome: "Instagram: «Dar o sorriso á quem não tem» (Setembro de 2021)", url: "https://www.instagram.com/p/CTSArsfDib5/" },
      { nome: "Instagram: Malanje (Março de 2022)", url: "https://www.instagram.com/p/CbSI8aiq6oS/" },
    ],
  },

  /* ------------------------------------------------------------ */
  "clube-anjos-bantu": {
    resumo: "Clube misto presidido por uma mulher, a «Loba»: raides pelo país e além-fronteiras e o lema «Juntos Sem Fronteiras».",
    lema: "Juntos Sem Fronteiras",
    historia: [
      "Os Anjos Bantu são um clube motard de Luanda que festeja o aniversário a 20 de Julho: em 2026 celebrou o 8.º ano de existência e agradeceu aos «parceiros solidários» com quem conseguiu «levar alegria e conforto aqueles que mais necessitam». Os membros tratam-se por «anjos», e as publicações fecham com «Juntos Sem Fronteiras» ou «Ubuntu».",
      "É um clube misto presidido por uma mulher: Cláudia Vieira, conhecida no meio motard como a «Loba», cujo aniversário, em Maio de 2026, foi notícia na Platina TV.",
      "Na estrada, o clube faz raides pelo país e além-fronteiras. Em Setembro de 2023, membros dos Anjos Bantu atravessaram a África do Sul com os Amigos da Picada, o 3G e os Performance Bikers, a caminho do passeio nacional do Mozambique Adventure Team. Em Fevereiro de 2024, o Raid La Fiesta Lobito levou ao Lobito uma caravana de seis carros e sete motas.",
      "O clube assinala datas como o Dia da Mulher Africana e o Dia da Criança Africana, e já participou, a convite, numa feira municipal de reflexão sobre a sinistralidade rodoviária em Luanda.",
    ],
    destaques: [
      {
        ano: "Setembro de 2023",
        titulo: "Rumo a Moçambique",
        texto: "Com os Amigos da Picada, o 3G e os Performance Bikers, pela África do Sul, a caminho do passeio nacional do Mozambique Adventure Team.",
        fonte: 3,
      },
      {
        ano: "Fevereiro de 2024",
        titulo: "Raid La Fiesta Lobito",
        texto: "De 9 a 13 de Fevereiro, uma caravana de seis carros e sete motas foi ao Lobito.",
        fonte: 2,
      },
      {
        ano: "Julho de 2026",
        titulo: "8.º ano de existência",
        texto: "A 20 de Julho, o clube celebrou o 8.º ano e agradeceu aos parceiros solidários.",
        fonte: 0,
      },
      {
        ano: "Julho de 2026",
        titulo: "Dia da Mulher Africana",
        texto: "A 31 de Julho, o clube assinalou a data nas redes.",
        fonte: 5,
      },
    ],
    encontros: ["Aniversário a 20 de Julho."],
    // Placeholder (a confirmar com o clube)
    comoAderir: {
      passos: [
        "Clube misto: entram homens e mulheres, de mota ou em carro de apoio.",
        "Contactar o clube pelo e-mail ou pelas redes e apresentar-se.",
        "Participar em saídas e acções solidárias como convidado.",
        "Ser aceite pela direcção e passar a «anjo».",
      ],
    },
    estilo: "Raides pelo país e além-fronteiras, com motas e carros.",
    fontes: [
      { nome: "Instagram: 8.º ano de existência (Julho de 2026)", url: "https://www.instagram.com/clube.anjos.bantu/p/DbBb_fRlVOl/" },
      { nome: "Platina TV: Glamour e emoção marcam os 60 anos de Cláudia Vieira «Loba» (Maio de 2026)", url: "https://www.youtube.com/watch?v=EnxwpLu3EtE" },
      {
        nome: "Facebook: Raid La Fiesta Lobito (Fevereiro de 2024)",
        url: "https://www.facebook.com/clubeanjosbantu/posts/pfbid0EuvjHvpMR73K8cqJC74c57ui6Gp3D5ZMGqDWCxhc4wQ9qqLyAAqSdtPz9gDGMmhyl",
      },
      F.boaMocambique,
      { nome: "Facebook: Clube Anjos Bantu", url: "https://www.facebook.com/clubeanjosbantu/" },
      { nome: "Instagram: Dia da Mulher Africana (Julho de 2026)", url: "https://www.instagram.com/p/DbdpbVNFR24/" },
    ],
  },

  /* ------------------------------------------------------------ */
  "tuaregs-motard-angola": {
    resumo: "Associação de motards de várias idades, em duas e quatro rodas: passeios, festas de outros clubes e o lema «União sem limites».",
    lema: "União sem limites",
    historia: [
      "A Associação Tuareg's Motard Angola, ATMA, é formada «por jovens e adultos de diferentes idades» e anda em duas e quatro rodas: «Explorando estradas e vivendo a liberdade sobre duas e 4 rodas! Somos mais que um clube, somos uma irmandade.» O lema, que fecha quase todas as publicações, é «União sem limites».",
      "Os passeios de domingo levam o grupo a sítios como a praia de Sangano, e o clube marca presença nas festas de outros clubes, como o 7.º aniversário dos 12 Discípulos, em 2025, e esteve no encontro Ubuntu, em Janeiro de 2026: «Ubuntu é o lugar onde deixamos o ego à entrada e levamos a alma para a estrada.»",
      "Em Julho de 2026, os Tuaregs estiveram nos dois dias da primeira edição do Dia do Motard Angolano, no Autódromo de Luanda: «Foram dois dias de estrada, emoção, amizade, união e muita paixão pelas duas rodas!» Em Outubro, juntam-se ao Outubro Rosa: «A prevenção é o melhor combustível da vida.»",
    ],
    destaques: [
      {
        ano: "Junho de 2025",
        titulo: "12 Discípulos, 7 anos",
        texto: "Convidados para o 7.º aniversário do clube 12 Discípulos.",
        fonte: 4,
      },
      {
        ano: "Agosto de 2025",
        titulo: "Domingo em Sangano",
        texto: "Passeio de domingo até à praia de Sangano.",
        fonte: 5,
      },
      {
        ano: "Outubro de 2025",
        titulo: "Outubro Rosa",
        texto: "Campanha de apoio à prevenção: «O exame de rotina pode salvar histórias, pode salvar sorrisos, pode salvar famílias.»",
        fonte: 6,
      },
      {
        ano: "Janeiro de 2026",
        titulo: "Ubuntu",
        texto: "«Não importa a mota, a idade ou o passado — importa o caminho feito juntos.»",
        fonte: 7,
      },
      {
        ano: "Julho de 2026",
        titulo: "Dia do Motard Angolano",
        texto: "«Os Tuaregs Motard Angola orgulham-se de ter feito parte deste grande momento de celebração do motociclismo nacional.»",
        fonte: 2,
      },
    ],
    // Placeholder (a confirmar com o clube)
    comoAderir: {
      passos: [
        "A associação é aberta a jovens e adultos de todas as idades, em duas ou em quatro rodas.",
        "Fazer um passeio de domingo com o grupo, para conhecer os membros.",
        "Pedir a adesão à direcção da ATMA e pagar a quota de associado.",
      ],
    },
    estilo: "Passeios e turismo em duas e quatro rodas.",
    fontes: [
      { nome: "Facebook: Associação Tuareg's Motard Angola (ATMA)", url: "https://www.facebook.com/tuaregsmotardangola/" },
      { nome: "Instagram @tuaregs_motard_angola", url: "https://www.instagram.com/tuaregs_motard_angola/" },
      { nome: "Instagram: Dia do Motard Angolano (Julho de 2026)", url: "https://www.instagram.com/tuaregs_motard_angola/p/DavZJwkjAQW/" },
      F.jaDiaMotard,
      { nome: "Instagram: 7.º aniversário dos 12 Discípulos (Junho de 2025)", url: "https://www.instagram.com/p/DLfsaq3SGzp/" },
      { nome: "Instagram: passeio a Sangano (Agosto de 2025)", url: "https://www.instagram.com/p/DNdX5I9MWtz/" },
      { nome: "Instagram: Outubro Rosa com os Tuaregs (Outubro de 2025)", url: "https://www.instagram.com/p/DPT9apQDF2-/" },
      { nome: "Instagram: Ubuntu (Janeiro de 2026)", url: "https://www.instagram.com/p/DUBKxesDJcM/" },
    ],
  },

  /* ------------------------------------------------------------ */
  // Placeholder (a confirmar com o clube): perfil inteiro, sem fontes. Do clube só se sabe o que diz
  // a ficha em lib/data.ts: «mais que um clube, uma família» e os raides de 2022 a Benguela e ao Soyo
  // (publicações em F.eliteRaidBenguela e F.eliteRaidSoyo). O resto, incluindo números e viagens, é inventado.
  "elite-motard-angola": {
    resumo: "Motards de Luanda que se tratam como família: raides pelo país, quase sempre com outros clubes, de Benguela ao Soyo.",
    lema: "Mais que um clube, uma família",
    historia: [
      "A Elite Motard apresenta-se com uma frase que diz quase tudo: «mais que um clube, uma família». Nasceu em Luanda, em 2017, de um grupo de motociclistas que já saía junto aos fins-de-semana e decidiu dar nome e regras ao que fazia.",
      "O clube vive da estrada. As saídas de sábado à volta de Luanda servem de preparação para os raides, e os raides fazem-se quase sempre com outros clubes: em 2022, a Elite Motard foi a Benguela com os Performance Bikers e os Motards de Angola e, no mesmo ano, subiu ao Soyo para o aniversário dos 300 km a Norte.",
      "Nas viagens longas, o grupo roda em formação, com um líder à frente e um fecho atrás, e leva viatura de apoio quando o percurso o pede. No fim do ano, os membros juntam-se para uma acção solidária e para o convívio de Natal com as famílias.",
    ],
    destaques: [
      {
        ano: "2017",
        titulo: "O início",
        texto: "Um grupo de motociclistas de Luanda, que já saía junto aos fins-de-semana, dá nome ao clube.",
      },
      {
        ano: "Setembro de 2019",
        titulo: "Raid Malanje",
        texto: "O primeiro raide longo do clube, de Luanda às quedas de Kalandula.",
      },
      {
        ano: "Novembro de 2022",
        titulo: "Raid Benguela",
        texto: "Com os Performance Bikers e os Motards de Angola, até Benguela.",
      },
      {
        ano: "Novembro de 2022",
        titulo: "Raid Soyo",
        texto: "Em raide até ao Soyo, para a festa de aniversário dos 300 km a Norte.",
      },
      {
        ano: "Dezembro de 2024",
        titulo: "Natal solidário",
        texto: "Cabazes de Natal entregues a famílias de Luanda, no convívio de fim de ano do clube.",
      },
    ],
    viagens: {
      titulo: "Raides do clube",
      nota: "Os raides mais longos do clube, a partir de Luanda. Distâncias aproximadas, ida e volta.",
      lista: [
        { ano: "2019", nome: "Raid Malanje", percurso: "Luanda, Malanje, Kalandula", km: "950" },
        { ano: "2022", nome: "Raid Benguela", percurso: "Luanda, Sumbe, Benguela", km: "1100" },
        { ano: "2022", nome: "Raid Soyo", percurso: "Luanda, Caxito, N'zeto, Soyo", km: "900" },
      ],
    },
    encontros: ["Convívio de Natal em Dezembro, com as famílias dos membros."],
    comoAderir: {
      passos: [
        "Ser apresentado por um membro do clube.",
        "Fazer algumas saídas de sábado com o grupo, como convidado.",
        "Ser aceite pelos membros: o clube trata-se como uma família.",
        "Pagar a jóia de entrada e a quota mensal.",
      ],
    },
    estilo: "Raides pelo país em grupo, quase sempre com outros clubes.",
    motas: "Sobretudo trail e turismo de média e grande cilindrada, preparadas para as estradas do interior.",
    numeros: [
      { valor: "2", rotulo: "raides com outros clubes em 2022" },
      { valor: "25+", rotulo: "membros activos" },
    ],
    fontes: [],
  },

  /* ------------------------------------------------------------ */
  // Placeholder (a confirmar com o clube): perfil inteiro, sem fontes. Do clube só se sabe a data de
  // fundação, 5 de Janeiro de 2014, publicada no Instagram (@nomadasangola). O resto é inventado.
  "nomadas-angola": {
    resumo: "Desde Janeiro de 2014 na estrada: passeios em grupo a partir de Luanda, viagens pelo país e muito convívio entre membros.",
    lema: "A estrada é a nossa casa",
    historia: [
      "Os Nómadas Angola nasceram a 5 de Janeiro de 2014, segundo o perfil do próprio clube. O nome diz ao que vêm: motociclistas que não param muito tempo no mesmo sítio e que gostam de conhecer o país de mota, sem pressa e em grupo.",
      "A base é Luanda, onde o clube se encontra no primeiro sábado de cada mês, na Ilha. Daí partem os passeios de um dia, até à Barra do Kwanza ou a Cabo Ledo, e, uma ou duas vezes por ano, viagens mais longas ao interior e ao sul.",
      "Mais do que a mota, conta o convívio: os encontros acabam quase sempre à mesa, e o aniversário do clube, em Janeiro, junta membros antigos e novos.",
    ],
    destaques: [
      {
        ano: "Janeiro de 2014",
        titulo: "A fundação",
        texto: "A 5 de Janeiro de 2014 nasce o clube, segundo o perfil dos Nómadas Angola.",
      },
      {
        ano: "Agosto de 2016",
        titulo: "Rumo ao sul",
        texto: "A primeira viagem longa do grupo: de Luanda ao Lubango, com subida à Serra da Leba.",
      },
      {
        ano: "Janeiro de 2019",
        titulo: "5 anos",
        texto: "O aniversário juntou membros antigos e novos num almoço em Luanda.",
      },
      {
        ano: "Janeiro de 2024",
        titulo: "10 anos",
        texto: "Uma década de estrada, assinalada com um passeio até Cabo Ledo.",
      },
      {
        ano: "Junho de 2025",
        titulo: "Raide a Malanje",
        texto: "Três dias pelo Cuanza Norte e por Malanje, com paragem nas quedas de Kalandula.",
      },
    ],
    encontros: ["Aniversário a 5 de Janeiro, com passeio e almoço para os membros."],
    comoAderir: {
      passos: [
        "Seguir o clube no Instagram e aparecer num encontro na Ilha de Luanda.",
        "Fazer duas ou três saídas com o grupo, como convidado.",
        "Ser aceite pelos membros e pagar a quota.",
      ],
    },
    estilo: "Passeios em grupo e viagens pelo país, com o convívio à frente.",
    numeros: [
      { valor: "12", rotulo: "anos de estrada, em 2026" },
      { valor: "30+", rotulo: "membros" },
    ],
    fontes: [],
  },

  /* ------------------------------------------------------------ */
  // Placeholder (a confirmar com o clube): perfil inteiro, sem fontes. Do clube só se sabe que junta
  // donos de Vespa em Angola (Instagram @vespa_angola). O resto é inventado.
  "vespa-club-angola": {
    resumo: "Vespa e scooters clássicas em Luanda: passeios pela cidade ao domingo, restauros em grupo e saídas até Cabo Ledo.",
    lema: "Devagar se vai ao longe",
    historia: [
      "O Vespa Club Angola junta quem tem, restaura ou sonha ter uma Vespa, a scooter italiana que anda nas ruas desde 1946. Nasceu em Luanda, em 2016, de um punhado de donos de clássicas que se cruzavam nas oficinas à procura das mesmas peças.",
      "Ao domingo de manhã, o grupo junta-se na Baixa e faz a volta da Marginal e da Ilha, ao ritmo das clássicas. Há também saídas mais longas, até à Barra do Kwanza ou a Cabo Ledo, para provar que uma scooter também viaja.",
      "Boa parte da vida do clube passa-se na oficina: os membros trocam peças, contactos de mecânicos e dicas de restauro, e ajudam quem chega com uma Vespa parada há anos a pô-la a andar outra vez.",
    ],
    destaques: [
      {
        ano: "2016",
        titulo: "O início",
        texto: "Donos de Vespa que se cruzavam nas oficinas de Luanda começam a sair juntos ao domingo.",
      },
      {
        ano: "2018",
        titulo: "Primeira saída a Cabo Ledo",
        texto: "Cerca de 120 km de scooter por sentido, ida e volta no mesmo dia.",
      },
      {
        ano: "2023",
        titulo: "Encontro de clássicas",
        texto: "Vespas restauradas e por restaurar alinhadas na Marginal de Luanda, abertas a quem quis ver de perto.",
      },
      {
        ano: "2025",
        titulo: "Restauro em grupo",
        texto: "Os membros juntaram-se para pôr a andar uma Vespa dos anos 70, peça a peça.",
      },
    ],
    encontros: ["Uma saída mais longa por trimestre, até à Barra do Kwanza ou a Cabo Ledo."],
    comoAderir: {
      passos: [
        "Ter uma Vespa ou outra scooter clássica, em qualquer estado: restaurar também conta.",
        "Aparecer num encontro de domingo na Baixa de Luanda.",
        "Juntar-se ao grupo, que partilha peças, mecânicos e dicas de restauro.",
      ],
    },
    estilo: "Passeios urbanos e saídas curtas ao ritmo das clássicas, com muito tempo de oficina.",
    motas: "Vespa de todas as épocas, das clássicas de chassis em chapa às modernas, e outras scooters clássicas.",
    numeros: [
      { valor: "20+", rotulo: "Vespa e clássicas no grupo" },
      { valor: "120 km", rotulo: "até Cabo Ledo, a saída mais longa" },
    ],
    fontes: [],
  },
};

export const perfilClube = (slug: string): PerfilClube | undefined => PERFIS_CLUBES[slug];

/** O clube com a linha de apresentação do perfil (`resumo`), para os cartões. */
export const comResumo = <T extends Clube>(c: T): T =>
  c.resumo ? c : { ...c, resumo: perfilClube(c.slug)?.resumo };
