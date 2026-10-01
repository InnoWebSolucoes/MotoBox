import type {
  Clube,
  AnuncioMarketplace,
  CategoriaForum,
  Corrida,
  Equipa,
  Evento,
  Noticia,
  Patrocinador,
  Piloto,
  TopicoForum,
  Video,
} from "./types";

/* ============================================================
   MOTOBOX — Conteúdo de partida
   Com o Supabase ligado, o site lê as tabelas; estes dados são
   a reserva (sem base de dados) e a semente do painel
   (Dados → Semear).

   Artigos, clubes e rotas usam só factos com fonte pública (ver
   `fonte` nos clubes e lib/rotas.ts). Os eventos futuros e os
   anúncios do marketplace são de demonstração.
   ============================================================ */

export const TEMPORADA = 2026;

/**
 * Redes por omissão. Só o Instagram está confirmado; o resto fica em
 * branco até ser definido no painel (Definições → Redes sociais).
 */
export const SOCIAIS = {
  instagram: "https://www.instagram.com/motobox_angola",
  facebook: "",
  youtube: "",
  linkedin: "",
  googleBusiness: "",
  whatsapp: "",
  email: "",
  telefone: "",
};

/* ============================================================
   EVENTOS
   O Dia do Motard Angolano aconteceu (Julho de 2026). Os
   restantes são de demonstração, organizados pela MotoBox, até
   a equipa carregar o calendário real no painel.
   ============================================================ */

export const eventos: Evento[] = [
  {
    slug: "dia-do-motard-angolano-2026",
    titulo: "Dia do Motard Angolano",
    disciplina: "Concentração",
    temporada: 2026,
    circuito: "Autódromo de Luanda",
    provincia: "Luanda",
    localidade: "Belas",
    dataInicio: "2026-07-11",
    dataFim: "2026-07-12",
    estado: "concluido",
    imagem: "dia-do-motard-angolano-2026",
    resumo:
      "A primeira edição do Dia do Motard Angolano juntou clubes de todo o país no Autódromo de Luanda, num fim-de-semana de encontro.",
    descricao:
      "Dois dias para a comunidade motard angolana se encontrar no mesmo sítio. A programação foi divulgada pelas páginas dos clubes e a MotoBox juntou-se à chamada nas redes. Entre os clubes presentes estiveram os Tuaregs Motard Angola.",
    organizador: "Organização do Dia do Motard Angolano, com os clubes",
    horarios: [],
  },
  {
    slug: "encontro-motobox-marginal",
    titulo: "Encontro MotoBox na Marginal",
    disciplina: "Encontro",
    temporada: 2026,
    circuito: "Marginal de Luanda",
    provincia: "Luanda",
    localidade: "Luanda",
    dataInicio: "2026-10-18",
    dataFim: "2026-10-18",
    estado: "agendado",
    imagem: "encontro-motobox-marginal",
    resumo:
      "Uma manhã de domingo para conhecer quem anda de mota em Luanda: scooters, trails, clássicas e desportivas, todas bem-vindas.",
    descricao:
      "Concentração cedo, uma volta calma à baía e pequeno-almoço no fim. Não é preciso pertencer a um clube nem ter uma mota especial: basta capacete, documentos em ordem e vontade de conversar. Os clubes que quiserem podem trazer a bandeira e apresentar-se a quem está a começar.",
    organizador: "MotoBox Angola",
    horarios: [
      { dia: "Domingo", hora: "07:30", sessao: "Concentração e registo" },
      { dia: "Domingo", hora: "08:30", sessao: "Volta à baía, em grupo e sem pressas" },
      { dia: "Domingo", hora: "09:30", sessao: "Pequeno-almoço e conversa" },
    ],
  },
  {
    slug: "oficina-aberta-mecanica-basica",
    titulo: "Oficina aberta: mecânica básica para quem anda de mota",
    disciplina: "Formação",
    temporada: 2026,
    circuito: "Local a anunciar",
    provincia: "Luanda",
    localidade: "Luanda",
    dataInicio: "2026-10-25",
    dataFim: "2026-10-25",
    estado: "agendado",
    imagem: "oficina-aberta-mecanica-basica",
    resumo:
      "Corrente, pressão dos pneus, óleo e luzes: o que cada motard deve saber verificar sozinho antes de sair.",
    descricao:
      "Uma manhã prática, com motas de vários tipos em cima da bancada. Aprende-se a verificação de dois minutos antes de arrancar, a afinar e lubrificar a corrente, a ler o desgaste dos pneus e a perceber quando é hora de ir ao mecânico. Lugares limitados.",
    organizador: "MotoBox Angola",
    horarios: [
      { dia: "Sábado", hora: "09:00", sessao: "Verificação antes de sair" },
      { dia: "Sábado", hora: "10:30", sessao: "Corrente, pneus e travões" },
      { dia: "Sábado", hora: "12:00", sessao: "Perguntas e respostas" },
    ],
  },
  {
    slug: "passeio-miradouro-da-lua",
    titulo: "Passeio ao Miradouro da Lua e à Barra do Kwanza",
    disciplina: "Passeio",
    temporada: 2026,
    circuito: "Saída de Luanda",
    provincia: "Luanda",
    localidade: "Luanda",
    dataInicio: "2026-11-08",
    dataFim: "2026-11-08",
    estado: "agendado",
    imagem: "passeio-miradouro-da-lua",
    resumo:
      "Uma manhã pela estrada da costa, com paragem nas falésias do Miradouro da Lua e almoço junto à Barra do Kwanza.",
    descricao:
      "Um passeio curto e todo em asfalto, bom para quem está a fazer as primeiras saídas em grupo. Segue as regras de um passeio de clube: reunião antes de arrancar, líder e fecho experientes, formação em ziguezague nas rectas e fila indiana nas curvas.",
    organizador: "MotoBox Angola",
    horarios: [
      { dia: "Domingo", hora: "07:00", sessao: "Concentração e reunião de grupo" },
      { dia: "Domingo", hora: "08:00", sessao: "Partida para o Miradouro da Lua" },
      { dia: "Domingo", hora: "11:30", sessao: "Almoço na Barra do Kwanza" },
    ],
  },
  {
    slug: "raide-serra-da-leba",
    titulo: "Raide à Serra da Leba",
    disciplina: "Raide",
    temporada: 2026,
    circuito: "Lubango e Serra da Leba",
    provincia: "Huíla",
    localidade: "Lubango",
    dataInicio: "2026-11-27",
    dataFim: "2026-11-29",
    estado: "agendado",
    imagem: "raide-serra-da-leba",
    resumo:
      "Três dias no planalto da Huíla, com a descida da Leba, a Fenda da Tundavala e as estradas à volta do Lubango.",
    descricao:
      "Um raide para quem já tem algumas viagens no corpo. A Leba é estreita, tem curvas em gancho seguidas e pouca protecção lateral: desce-se devagar, sem ultrapassar nas curvas e nunca de noite. Inscrições com antecedência, para organizar dormidas e apoio.",
    organizador: "MotoBox Angola",
    horarios: [
      { dia: "Sexta", hora: "15:00", sessao: "Chegada ao Lubango" },
      { dia: "Sábado", hora: "08:00", sessao: "Serra da Leba e miradouro" },
      { dia: "Domingo", hora: "08:00", sessao: "Fenda da Tundavala e regresso" },
    ],
  },
  {
    slug: "passeio-solidario-natal-2026",
    titulo: "Passeio Solidário de Natal",
    disciplina: "Solidária",
    temporada: 2026,
    circuito: "Luanda",
    provincia: "Luanda",
    localidade: "Luanda",
    dataInicio: "2026-12-20",
    dataFim: "2026-12-20",
    estado: "agendado",
    imagem: "passeio-solidario-natal-2026",
    resumo:
      "Motas carregadas de brinquedos e material escolar, para entregar a uma instituição de Luanda antes do Natal.",
    descricao:
      "Cada participante traz um brinquedo ou material escolar novo. O grupo sai junto e faz a entrega no fim do percurso. Os clubes que quiserem juntar-se à organização podem falar connosco pelo formulário de contacto.",
    organizador: "MotoBox Angola",
    horarios: [
      { dia: "Domingo", hora: "08:00", sessao: "Concentração e recolha dos donativos" },
      { dia: "Domingo", hora: "09:30", sessao: "Passeio e entrega" },
    ],
  },
];

/* ============================================================
   CLUBES
   Clubes e grupos de quem anda de mota por gosto. Tudo o que aqui
   está vem das páginas públicas dos próprios clubes ou de
   reportagens (ver `fonte`, que não aparece no site). Onde a sede
   não está publicada, a cidade fica vazia; sem nenhuma província
   documentada, também a província. As fotografias de capa são
   ilustrativas: não se copiam imagens das redes dos clubes.
   ============================================================ */

export const clubes: Clube[] = [
  {
    slug: "amigos-da-picada",
    nome: "Amigos da Picada",
    tipo: "Moto-turismo",
    provincia: "Luanda",
    cidade: "Luanda",
    fundacao: 2006,
    descricao:
      "Grupo de motociclistas de Luanda vocacionado para o turismo e a aventura sobre rodas. Tudo começou em 2006, com a primeira viagem em grupo até à Namíbia, e o nome vem do estado das estradas nessa viagem: as picadas. O programa do clube junta saídas de fim-de-semana a pontos turísticos do país, um raide longo por ano e viagens a outros países africanos. Tem uma forte componente solidária, com distribuição de refeições em hospitais e de material escolar nas comunidades por onde passa, e vai todos os anos à Muxima pedir a bênção para a época. É apontado como o mentor do movimento motard angolano. Lema: «Sunny or Raining».",
    actividades: [
      "Saídas de fim-de-semana a pontos turísticos",
      "Raide anual pelo país",
      "Viagens a outros países africanos",
      "Café da Picada, encontro social mensal",
      "Acções solidárias em hospitais e comunidades",
      "Bênção anual na Muxima",
    ],
    encontros: "Café da Picada: um encontro social por mês, segundo o programa que o clube descreveu em 2020.",
    logo: "",
    imagem: "clube-amigos-da-picada",
    cor: "#c2410c",
    redes: {
      instagram: "https://www.instagram.com/amigosdapicada/",
      facebook: "https://www.facebook.com/groups/amigosdapicada/",
    },
    fonte: [
      "https://www.instagram.com/amigosdapicada/",
      "https://www.facebook.com/groups/amigosdapicada/",
      "https://bikersofafrica.com/2020/07/08/amigos-da-picada/",
      "https://www.euronews.com/2021/03/10/the-bikers-making-angola-the-ride-of-their-lives",
    ].join("\n"),
    destaque: true,
  },
  {
    slug: "ladies-in-2-wheels-angola",
    nome: "Ladies in 2 Wheels in Angola",
    tipo: "Lady Riders",
    provincia: "Luanda",
    cidade: "",
    descricao:
      "Motards femininas angolanas que viajam de mota, fazem turismo e acções filantrópicas, «and lots of fun». No perfil guardam viagens a Malanje e a países vizinhos, da Namíbia ao Botswana, à África do Sul e à RD Congo, e um raide ibérico. Levam a conversa sobre mulheres na estrada também à rádio. Lema: «Life is a ride kinda girls. Whatever we can do, you can too».",
    actividades: [
      "Viagens de mota em grupo",
      "Turismo pelo país",
      "Viagens à Namíbia, Botswana, África do Sul e RD Congo",
      "Acções filantrópicas",
    ],
    logo: "",
    imagem: "clube-ladies-in-2-wheels",
    cor: "#db2777",
    redes: { instagram: "https://www.instagram.com/ladies_riders_ao/" },
    fonte: [
      "https://www.instagram.com/ladies_riders_ao/",
      "https://www.instagram.com/ladies_riders_ao/reel/DWRpks4DKxj/",
    ].join("\n"),
    destaque: true,
  },
  {
    slug: "elite-motard-angola",
    nome: "Elite Motard",
    tipo: "Moto-turismo",
    provincia: "",
    cidade: "",
    descricao:
      "Clube motard angolano que se apresenta como «mais que um clube, uma família». Sai em raide com outros clubes pelo país: esteve no Raid Benguela de 2022 e, nesse mesmo ano, no aniversário do 300 km a Norte, no Soyo. A sede não vem indicada nas páginas públicas do clube.",
    actividades: ["Raides pelo país", "Encontros com outros clubes", "Convívio entre membros"],
    logo: "",
    imagem: "clube-elite-motard",
    cor: "#111827",
    redes: { instagram: "https://www.instagram.com/elite_motard_angola/" },
    fonte: [
      "https://www.instagram.com/elite_motard_angola/",
      "https://www.instagram.com/elite_motard_angola/p/ClE2xbmBYXh/",
      "https://www.instagram.com/elite_motard_angola/p/ClE1cSDhjKC/",
    ].join("\n"),
    destaque: true,
  },
  {
    slug: "300-km-a-norte",
    nome: "300 km a Norte",
    tipo: "Moto-turismo",
    provincia: "Zaire",
    cidade: "Soyo",
    descricao:
      "Motards residentes no Soyo, em Luanda e em Moçambique, unidos pela «paixão sobre duas rodas, adrenalina, aventura e filantropia». O aniversário do clube, no Soyo, já recebeu outros clubes em raide, como o Elite Motard em 2022.",
    actividades: ["Raides", "Aventura", "Filantropia", "Aniversário do clube no Soyo"],
    logo: "",
    imagem: "clube-300-km-a-norte",
    cor: "#15803d",
    redes: { instagram: "https://www.instagram.com/300km_a_norte/" },
    fonte: [
      "https://www.instagram.com/300km_a_norte/",
      "https://www.instagram.com/elite_motard_angola/p/ClE1cSDhjKC/",
    ].join("\n"),
    destaque: true,
  },
  {
    slug: "motards-de-angola",
    nome: "Motards de Angola",
    tipo: "Moto-turismo",
    provincia: "Luanda",
    cidade: "Belas",
    descricao:
      "Grupo de motards de Luanda que tem como objectivo, nas suas palavras, «dar o melhor de si para o engrandecimento do turismo em Angola». Foi pela sua página que se divulgou a programação do Dia Nacional do Motard Angolano, em Luanda, em Julho de 2026.",
    actividades: [
      "Passeios e viagens de turismo",
      "Divulgação de encontros motard",
      "Dia do Motard Angolano",
    ],
    logo: "",
    imagem: "clube-motards-de-angola",
    cor: "#0f766e",
    redes: {
      facebook: "https://www.facebook.com/100079850005166",
      instagram: "https://www.instagram.com/motardsangola/",
    },
    fonte: [
      "https://www.facebook.com/100079850005166",
      "https://www.facebook.com/100079850005166/about_places",
      "https://www.instagram.com/motardsangola/ (mesmo nome; ligação entre as contas por confirmar)",
    ].join("\n"),
  },
  {
    slug: "clube-anjos-bantu",
    nome: "Clube Anjos Bantu",
    tipo: "Moto-turismo",
    provincia: "Luanda",
    cidade: "",
    fundacao: 2018,
    descricao:
      "Clube motard presidido por uma motociclista, que celebrou oito anos de existência em Julho de 2026. Os destaques do perfil guardam raides a Malanje e ao Soyo, e o clube assinala datas como o Dia da Mulher Africana e o Dia da Criança Africana.",
    actividades: ["Raides pelo país", "Convívio entre membros", "Datas solidárias e comemorativas"],
    logo: "",
    imagem: "clube-anjos-bantu",
    cor: "#7c3aed",
    redes: {
      instagram: "https://www.instagram.com/clube.anjos.bantu/",
      facebook: "https://www.facebook.com/clubeanjosbantu/",
    },
    contacto: "clube.anjos.bantu@hotmail.com",
    fonte: [
      "https://www.instagram.com/clube.anjos.bantu/",
      "https://www.instagram.com/clube.anjos.bantu/p/DbBb_fRlVOl/",
      "https://www.instagram.com/clube.anjos.bantu/reel/DZWkL6UitFR/",
      "https://www.facebook.com/clubeanjosbantu/",
    ].join("\n"),
  },
  {
    slug: "tuaregs-motard-angola",
    nome: "Tuaregs Motard Angola",
    tipo: "Moto-turismo",
    provincia: "Luanda",
    cidade: "",
    descricao:
      "Associação de jovens e adultos de várias idades cujo objectivo principal é o «turismo sobre rodas»: explorar pontos naturais e de relevância histórica em Angola e além-fronteiras. Esteve no Dia do Motard Angolano, no Autódromo de Luanda, em Julho de 2026, e junta-se a campanhas como o Outubro Rosa. Lema: «União sem limites».",
    actividades: [
      "Turismo sobre rodas",
      "Visitas a locais naturais e históricos",
      "Viagens além-fronteiras",
      "Campanhas solidárias",
    ],
    logo: "",
    imagem: "clube-tuaregs",
    cor: "#a16207",
    redes: {
      instagram: "https://www.instagram.com/tuaregs_motard_angola/",
      facebook: "https://www.facebook.com/tuaregsmotardangola/",
    },
    contacto: "tuaregs.motardangola@gmail.com",
    fonte: [
      "https://www.facebook.com/tuaregsmotardangola/",
      "https://www.instagram.com/tuaregs_motard_angola/",
      "https://www.instagram.com/tuaregs_motard_angola/p/DavZJwkjAQW/",
    ].join("\n"),
  },
  {
    slug: "performance-bikers-2015",
    nome: "Performance Bikers 2015",
    tipo: "Moto-turismo",
    provincia: "Luanda",
    cidade: "Luanda",
    fundacao: 2015,
    descricao:
      "Nasceu num domingo em Luanda, a 7 de Fevereiro de 2015, quando um grupo de motociclistas descobriu junto «o prazer de andar em grupo». Partilha viagens e momentos na estrada e sai em raide com outros clubes, como no Raid Benguela de 2022.",
    actividades: ["Passeios em grupo", "Viagens pelo país", "Raides com outros clubes"],
    logo: "",
    imagem: "clube-performance-bikers",
    cor: "#1d4ed8",
    redes: { instagram: "https://www.instagram.com/performancebikers2015/" },
    fonte: [
      "https://www.instagram.com/performancebikers2015/",
      "https://www.instagram.com/elite_motard_angola/p/ClE2xbmBYXh/",
    ].join("\n"),
  },
  {
    slug: "african-nomadas",
    nome: "African Nómadas",
    tipo: "Moto-turismo",
    provincia: "Benguela",
    cidade: "Lobito",
    descricao:
      "Clube de motociclistas do Lobito, com o lema «liberdade sobre rodas». Faz saídas em grupo ao longo do ano e vai recebendo novos membros na família.",
    actividades: ["Saídas em grupo", "Convívio entre membros"],
    logo: "",
    imagem: "clube-african-nomadas",
    cor: "#b45309",
    redes: {
      instagram: "https://www.instagram.com/africannomadas/",
      facebook: "https://www.facebook.com/africannomadas/",
    },
    fonte: [
      "https://www.facebook.com/africannomadas/",
      "https://www.instagram.com/africannomadas/",
    ].join("\n"),
  },
  {
    slug: "amigos-do-capim",
    nome: "Amigos do Capim",
    tipo: "Outro",
    provincia: "Luanda",
    cidade: "Luanda",
    descricao:
      "Clube motard de Luanda com vocação solidária: «Mais do que amigos, somos uma família que ajuda outras famílias». Em Agosto de 2020 juntou-se a um grupo filantrópico de oficiais do Ministério do Interior numa campanha de prevenção da Covid-19 no Futungo, em Talatona, com distribuição de máscaras. Lema: «Ser solidário cuia bué».",
    actividades: ["Acções solidárias", "Campanhas de sensibilização", "Passeios solidários"],
    logo: "",
    imagem: "clube-amigos-do-capim",
    cor: "#4d7c0f",
    redes: { instagram: "https://www.instagram.com/amigosdocapim/" },
    fonte: [
      "https://www.instagram.com/amigosdocapim/",
      "https://bikersofafrica.com/2020/08/24/angola-club-amigos-do-capim-charity-run/",
    ].join("\n"),
  },
  {
    slug: "nomadas-angola",
    nome: "Nómadas Angola",
    tipo: "Moto-turismo",
    provincia: "",
    cidade: "",
    fundacao: 2014,
    descricao:
      "Grupo motard angolano fundado a 5 de Janeiro de 2014, segundo o perfil do próprio clube. As páginas públicas não indicam a sede; se é deste clube, fale connosco para completar a ficha.",
    actividades: ["Passeios em grupo", "Convívio entre membros"],
    logo: "",
    imagem: "clube-nomadas-angola",
    cor: "#0e7490",
    redes: { instagram: "https://www.instagram.com/nomadasangola/" },
    fonte: "https://www.instagram.com/nomadasangola/",
  },
  {
    slug: "vespa-club-angola",
    nome: "Vespa Club Angola",
    tipo: "Scooters e urbano",
    provincia: "",
    cidade: "",
    descricao:
      "Grupo dedicado às Vespa, as scooters clássicas italianas, em Angola. A prova de que andar de mota em grupo não é só para motas grandes: também se viaja, se convive e se cuida de uma clássica em duas rodas pequenas. Se é deste clube, fale connosco para completar a ficha.",
    actividades: ["Encontros de scooters clássicas", "Passeios urbanos", "Restauro e manutenção"],
    logo: "",
    imagem: "clube-vespa",
    cor: "#ca8a04",
    redes: { instagram: "https://www.instagram.com/vespa_angola/" },
    fonte: "https://www.instagram.com/vespa_angola/",
  },
];

/* ============================================================
   ARTIGOS
   A secção principal do site. Escritos pela redacção a partir de
   factos com fonte (clubes, rotas e segurança).
   ============================================================ */

export const noticias: Noticia[] = [
  {
    slug: "dia-do-motard-angolano-2026",
    titulo: "Dia do Motard Angolano: a primeira edição juntou os clubes no Autódromo de Luanda",
    resumo:
      "A 11 e 12 de Julho, o Autódromo de Luanda recebeu a primeira edição do Dia do Motard Angolano. Um fim-de-semana para os clubes de todo o país se encontrarem no mesmo sítio, à mesma hora.",
    corpo: [
      "Durante anos, o calendário motard angolano viveu de convites cruzados. Um clube faz anos e os outros aparecem; um raide sai de Luanda e junta quem vai pelo caminho. Em Julho de 2026 houve, pela primeira vez, uma data de todos: a 11 e 12 de Julho, o Autódromo de Luanda recebeu a primeira edição do Dia do Motard Angolano.",
      "A programação correu pelas páginas dos próprios clubes, entre elas a dos Motards de Angola, e a MotoBox juntou-se à chamada nas redes: «Venha fazer parte do maior evento motard de Angola». Entre os clubes que marcaram presença estiveram os Tuaregs Motard Angola, que fazem do «turismo sobre rodas» a sua razão de ser.",
      "Mais do que as motas alinhadas, o que fica de um fim-de-semana assim é o retrato de um movimento que cresceu sem pedir licença. Começou no início dos anos 2000, com grupos de amigos que saíam juntos por Luanda. Hoje há clubes do Soyo ao Lobito, grupos de Lady Riders, raides que atravessam o país e viagens que passam a fronteira.",
      "Para quem esteve, ficam as fotografias e os reencontros. Para quem não esteve, fica a vontade de que a data se repita. Se houver nova edição, é na secção Eventos da MotoBox que a vai encontrar primeiro.",
    ],
    categoria: "Comunidade",
    tags: ["Dia do Motard", "Autódromo de Luanda", "Clubes"],
    autor: "Redacção MotoBox",
    data: "2026-07-15",
    imagem: "artigo-dia-do-motard",
    leitura: 3,
    destaque: true,
  },
  {
    slug: "amigos-da-picada-vinte-anos",
    titulo: "Amigos da Picada: vinte anos a conhecer Angola de mota",
    resumo:
      "Em 2006, um grupo de amigos de Luanda pegou nas motas e foi até à Namíbia. As estradas dessa viagem deram nome ao clube que hoje é apontado como o mentor do movimento motard angolano.",
    corpo: [
      "A história conta-se depressa. No início dos anos 2000, um grupo de motociclistas de Luanda começou a sair junto pela cidade, e o gosto de andar em grupo foi crescendo. Em 2006 deram o passo maior: a primeira viagem em grupo para fora do país, até Oshakati, na Namíbia. O estado das estradas dessa viagem, as picadas, ficou no nome.",
      "Vinte anos depois, os Amigos da Picada são apontados como os mentores do movimento motard angolano. O programa mantém o espírito do início: saídas de fim-de-semana a pontos turísticos do país, um raide longo por ano e viagens a outros países africanos. Pelo meio, o Café da Picada, um encontro social por mês.",
      "Há uma parte que não aparece nas fotografias das curvas. Por onde passa, o clube leva refeições a hospitais e material escolar às comunidades, e todos os anos vai à Muxima pedir a bênção para a época. Num perfil publicado em 2020 pela Bikers of Africa, o clube contava já mais de três centenas de membros.",
      "O lema diz o resto: «Sunny or Raining». Faça sol ou faça chuva, há sempre uma picada à espera.",
    ],
    categoria: "Clubes",
    tags: ["Amigos da Picada", "Moto-turismo", "Luanda", "Namíbia"],
    autor: "Redacção MotoBox",
    data: "2026-09-02",
    imagem: "artigo-amigos-da-picada",
    leitura: 4,
    destaque: true,
    fonte: "Bikers of Africa",
    fonteUrl: "https://bikersofafrica.com/2020/07/08/amigos-da-picada/",
  },
  {
    slug: "lady-riders-elas-tambem-conduzem",
    titulo: "Elas também conduzem: as Lady Riders que rodam por Angola e além-fronteiras",
    resumo:
      "Da Namíbia ao Botswana, de Malanje à África do Sul, as motociclistas angolanas viajam juntas e levam a filantropia na bagagem.",
    corpo: [
      "Há quem ainda imagine a mulher no lugar de trás. As Ladies in 2 Wheels in Angola tratam de desfazer a ideia a cada viagem. São motards angolanas que viajam de mota, fazem turismo e acções filantrópicas, «and lots of fun», como escrevem no perfil.",
      "Os destaques que guardam contam a história: viagens a Malanje e a países vizinhos, da Namíbia ao Botswana, à África do Sul e à RD Congo, e um raide ibérico. A conversa sobre mulheres na estrada também já chegou à rádio.",
      "Não estão sozinhas. O Clube Anjos Bantu, de Luanda, é presidido por uma motociclista e celebrou oito anos de existência em Julho de 2026, com raides a Malanje e ao Soyo nos destaques e datas como o Dia da Mulher Africana no calendário.",
      "O lema das Ladies in 2 Wheels serve de convite a quem ainda está a pensar nisso: «Life is a ride kinda girls. Whatever we can do, you can too.» Na secção Clubes da MotoBox encontra os grupos e pode seguir-lhes o caminho.",
    ],
    categoria: "Clubes",
    tags: ["Lady Riders", "Ladies in 2 Wheels", "Anjos Bantu"],
    autor: "Redacção MotoBox",
    data: "2026-08-20",
    imagem: "artigo-lady-riders",
    leitura: 3,
    destaque: true,
  },
  {
    slug: "serra-da-leba-de-mota",
    titulo: "Serra da Leba de mota: o que saber antes de descer as curvas",
    resumo:
      "Cerca de 20 km de ganchos entre o planalto da Huíla e o deserto do Namibe. Uma das estradas mais bonitas de Angola pede calma, luz do dia e piso seco.",
    corpo: [
      "A Serra da Leba fica no limite entre a Huíla e o Namibe, a cerca de 50 km do Lubango, e é conhecida pela estrada em ziguezague que desce do planalto em direcção ao deserto. Faz parte da EN-280 e o troço sinuoso tem cerca de 20 km, todo asfaltado. O desenho em S é obra do engenheiro Edgar Cardoso.",
      "Numa só descida atravessam-se três a quatro zonas de clima: do fresco do planalto ao calor da base, onde pode passar dos 35 °C. Nas manhãs de Junho e Julho o planalto é frio, por isso a regra é roupa por camadas.",
      "A estrada é estreita, tem pouca protecção lateral e já houve muitos acidentes graves. Desça devagar, não ultrapasse nas curvas e evite a serra de noite ou com chuva. A melhor época é de Junho a Agosto, quando no Lubango quase não chove.",
      "Para ver a estrada inteira, pare no Miradouro da Leba, num sítio largo e fora da faixa de rodagem. Na ficha da rota, em Rotas, estão as distâncias, as dicas e as fontes.",
    ],
    categoria: "Viagens",
    tags: ["Serra da Leba", "Huíla", "Namibe", "Rotas"],
    autor: "Redacção MotoBox",
    data: "2026-08-05",
    imagem: "artigo-serra-da-leba",
    leitura: 4,
  },
  {
    slug: "chuva-sete-conselhos",
    titulo: "Primeiras chuvas: sete conselhos para não ser apanhado pelo piso",
    resumo:
      "Com o piso molhado, a distância de travagem é pelo menos o dobro. E as primeiras chuvas depois do cacimbo são as mais traiçoeiras.",
    corpo: [
      "Quando chegam as primeiras chuvas, a água levanta do asfalto o óleo e o pó acumulados durante meses de cacimbo. É nessas semanas que o piso engana mais. Primeiro conselho: dobre a distância para o carro da frente e trave mais cedo, com suavidade, usando os dois travões.",
      "Fuja das zonas lisas: tinta das passadeiras, tampas de esgoto, chapas metálicas e manchas de óleo. Se tiver de passar por cima, passe direito, sem travar nem inclinar. E numa estrada que não conhece, trate cada poça como um buraco até prova em contrário.",
      "Acelerador, travões e inclinação, tudo sem pressas: são as mudanças bruscas que fazem os pneus perder aderência. Ande com as luzes ligadas e roupa clara ou reflectora, porque com chuva e spray os outros condutores vêem-no ainda menos.",
      "Se a chuva for tanta que deixa de ver a estrada, pare num sítio seguro, fora da faixa, e espere que passe. Leve fato de chuva e uma película anti-embaciamento na viseira: molhado e com frio, o corpo reage mais devagar. A secção Segurança tem o guia completo, com as fontes.",
    ],
    categoria: "Segurança",
    tags: ["Chuva", "Segurança", "Condução"],
    autor: "Redacção MotoBox",
    data: "2026-09-22",
    imagem: "artigo-chuva",
    leitura: 3,
  },
  {
    slug: "capacete-escolher-usar-trocar",
    titulo: "Capacete: como escolher, como usar e quando trocar",
    resumo:
      "Bem usado, reduz o risco de morte num acidente mais de seis vezes. Em Angola é obrigatório. Mas um capacete só protege se for o certo e estiver bem apertado.",
    corpo: [
      "A Organização Mundial da Saúde calcula que o capacete, bem usado, reduz o risco de morte num acidente mais de seis vezes e o de lesão cerebral até 74%. E o Código de Estrada, no artigo 81.º, obriga condutores e passageiros de motociclos a usar capacete de modelo oficialmente aprovado, devidamente ajustado e apertado.",
      "Para escolher, procure a etiqueta de homologação. A europeia, ECE 22.06, vem cosida na correia ou no forro; nos Estados Unidos, a marca é DOT. Sem etiqueta, não é um capacete. Tem de ficar justo sem doer: com a correia apertada, puxe-o por trás e empurre-o pela testa. Se sair, é grande de mais. O integral protege também o queixo e a cara.",
      "Para usar: correia sempre apertada, mesmo para ir «só ali», com espaço para um ou dois dedos entre a correia e o queixo. Viseira limpa e sem riscos, e à noite só viseira transparente. Não compre capacetes usados: não sabe se já levaram uma pancada.",
      "Para trocar: depois de qualquer queda com a cabeça lá dentro, porque a espuma interior protege esmagando-se e isso não se vê por fora. A cada cinco anos, mesmo sem quedas. E logo que fique largo, a fivela falhe ou a calota tenha fissuras.",
    ],
    categoria: "Segurança",
    tags: ["Capacete", "Segurança", "Equipamento"],
    autor: "Redacção MotoBox",
    data: "2026-06-18",
    imagem: "artigo-capacete",
    leitura: 4,
  },
  {
    slug: "que-mota-para-comecar",
    titulo: "Scooter, trail, naked ou custom: que mota para começar?",
    resumo:
      "Não há uma primeira mota certa para toda a gente. Há a mota certa para o sítio onde vai andar, para o seu corpo e para o que quer fazer com ela.",
    corpo: [
      "Comece pela pergunta mais simples: onde vai andar a maior parte do tempo? Para o trânsito da cidade, uma scooter ou uma mota de baixa cilindrada resolve quase tudo, gasta pouco e perdoa os erros de quem está a aprender. Para quem quer sair do asfalto, uma trail leve aguenta picada e estrada sem complicar.",
      "As naked e as desportivas pedem mais. São rápidas, leves de frente e respondem a qualquer gesto, o que é óptimo quando se tem experiência e traiçoeiro quando não. As custom e as clássicas são mais baixas e calmas, mas pesadas nas manobras lentas. Experimente sentar-se em várias: os dois pés devem chegar ao chão com conforto.",
      "Guarde parte do orçamento para o equipamento. Capacete homologado, luvas, casaco com protecções e calçado que cubra o tornozelo não são extras: são a parte da mota que o protege a si.",
      "E não aprenda sozinho. Uma formação de condução e as primeiras saídas com um clube ensinam em meses o que se demora anos a aprender por conta própria. Na secção Clubes encontra grupos para todos os tipos de mota, das Vespa às de viagem.",
    ],
    categoria: "Guias",
    tags: ["Primeira mota", "Scooter", "Trail", "Iniciação"],
    autor: "Redacção MotoBox",
    data: "2026-09-10",
    imagem: "artigo-primeira-mota",
    leitura: 4,
  },
  {
    slug: "verificacao-antes-de-sair",
    titulo: "Dois minutos antes de arrancar: a verificação que evita problemas",
    resumo:
      "Pneus, comandos, luzes, óleo, corrente e descanso. Não é preciso ser mecânico: é olhar, apalpar e ouvir.",
    corpo: [
      "A Motorcycle Safety Foundation ensina uma verificação rápida antes de cada saída, conhecida pelas iniciais em inglês: T-CLOCS. Faz-se em dois minutos, à porta de casa, e apanha a maior parte dos problemas antes de eles o apanharem a si.",
      "Pneus e rodas: pressão certa, que vem no manual ou numa etiqueta na mota, piso sem desgaste excessivo, sem cortes nem pregos, raios e jantes sem folgas. Comandos: manetes e pedal de travão firmes, acelerador que volta sozinho, embraiagem e cabos sem prender.",
      "Luzes: médios e máximos, luz de travão com cada um dos travões, piscas e buzina. Óleo e líquidos: nível do óleo, do líquido dos travões e do líquido de refrigeração, e nada a pingar no chão.",
      "Quadro e corrente: corrente com a folga certa e lubrificada, suspensão sem fugas, parafusos apertados. Por fim, o descanso: tem de recolher e ficar preso. Um descanso que desce numa curva deita a mota abaixo.",
    ],
    categoria: "Oficina",
    tags: ["Manutenção", "T-CLOCS", "Segurança"],
    autor: "Redacção MotoBox",
    data: "2026-07-28",
    imagem: "artigo-verificacao",
    leitura: 3,
  },
  {
    slug: "andar-em-grupo-regras",
    titulo: "Andar em grupo: as regras de um passeio que corre bem",
    resumo:
      "Os passeios de clube são das melhores coisas do mundo motard. Com umas regras simples, também são das mais seguras.",
    corpo: [
      "Tudo começa antes de ligar o motor. Uma reunião rápida acerta o percurso, as paragens para combustível e descanso, e os sinais de mão que o grupo vai usar. Escolhe-se um líder para a frente e um fecho para o fim, ambos experientes; os menos experientes vão logo atrás do líder.",
      "Em recta, o grupo anda em ziguezague: o líder no terço esquerdo da faixa, o seguinte no terço direito, pelo menos um segundo atrás, e assim por diante. Em curvas, com mau piso ou pouca visibilidade, passa-se a fila indiana, com pelo menos dois segundos entre motas.",
      "A regra mais importante é a mais fácil de esquecer: cada um anda ao seu ritmo. Ninguém passa dos seus limites para não ficar para trás. O grupo espera, é para isso que existe.",
      "Estas regras são as que a Motorcycle Safety Foundation recomenda, e são as que vai encontrar nos passeios organizados pela MotoBox. Se ainda não tem com quem passear, a secção Clubes é um bom sítio para começar.",
    ],
    categoria: "Guias",
    tags: ["Passeios", "Clubes", "Segurança"],
    autor: "Redacção MotoBox",
    data: "2026-08-12",
    imagem: "artigo-grupo",
    leitura: 3,
  },
  {
    slug: "300-km-a-norte-soyo",
    titulo: "300 km a Norte: o clube que junta o Soyo, Luanda e Moçambique",
    resumo:
      "Motards espalhados por três sítios e unidos por uma ideia: paixão sobre duas rodas, adrenalina, aventura e filantropia.",
    corpo: [
      "O nome já diz a distância. Os 300 km a Norte juntam motards residentes no Soyo, na província do Zaire, em Luanda e em Moçambique, unidos pela «paixão sobre duas rodas, adrenalina, aventura e filantropia», como se apresentam.",
      "O ponto alto do ano é o aniversário do clube, no Soyo, que já recebeu outros clubes em raide. Em 2022, por exemplo, foi o Elite Motard que fez a viagem até lá para a festa.",
      "É um bom exemplo de como o movimento motard angolano se organiza: clubes com vida própria que se visitam uns aos outros, e raides que transformam centenas de quilómetros de estrada num motivo para estar juntos.",
      "Se é de um clube que ainda não está na MotoBox, pode juntá-lo à lista. A página é gratuita e mostra as vossas actividades e redes.",
    ],
    categoria: "Clubes",
    tags: ["300 km a Norte", "Soyo", "Zaire", "Raides"],
    autor: "Redacção MotoBox",
    data: "2026-07-03",
    imagem: "artigo-300-km",
    leitura: 3,
  },
  {
    slug: "kalandula-de-mota",
    titulo: "Kalandula de mota: estrada, terra e as quedas no fim",
    resumo:
      "Quedas de 105 metros no rio Lucala e, no mesmo caminho, as Pedras Negras de Pungo Andongo. Uma viagem longa que pede paciência com os buracos.",
    corpo: [
      "As quedas do rio Lucala, em Calandula, têm 105 m de altura e cerca de 400 m de largura, e são uma das 7 Maravilhas Naturais de Angola. Há um trilho para o cimo e outro para a base, e os miradouros junto à vila são gratuitos.",
      "O caminho clássico sai de Luanda por Catete e segue pela EN230 até N'dalatando e ao Cacuso; daí, a EN322 leva para norte, às quedas, ou a Pungo Andongo. Malanje fica a 380 km de Luanda e as quedas a cerca de 80 km de Malanje.",
      "Há troços cheios de buracos, sobretudo entre Maria Teresa e N'dalatando, por isso não conte com médias altas. De Maio a Setembro, no cacimbo, as estradas estão secas; de Outubro a Abril as quedas têm mais caudal, mas as picadas enchem-se de lama.",
      "Leve os documentos à mão, porque na província de Malanje há muitos controlos policiais. E em Pungo Andongo, terra sagrada, peça licença antes de entrar. A ficha completa, com as fontes, está em Rotas.",
    ],
    categoria: "Viagens",
    tags: ["Kalandula", "Malanje", "Pungo Andongo", "Rotas"],
    autor: "Redacção MotoBox",
    data: "2026-06-30",
    imagem: "artigo-kalandula",
    leitura: 4,
  },
  {
    slug: "comprar-mota-usada",
    titulo: "Comprar mota usada: o que verificar antes de pagar",
    resumo:
      "Documentos em ordem, número de quadro igual ao dos papéis e uma volta de teste. Uma lista curta para não comprar problemas.",
    corpo: [
      "Comece pelos papéis. Peça os documentos da mota e confirme que o número de quadro gravado no chassis é o mesmo que vem nos documentos. Se não coincidir, ou se o vendedor não os tiver à mão, não avance.",
      "Veja a mota a frio, de preferência à luz do dia. Um motor que arranca bem a frio diz muito. Procure fugas de óleo, a folga e o estado da corrente, o desgaste dos pneus e dos discos, e sinais de queda: manetes dobradas, riscos nos lados, carenagens de cores diferentes.",
      "Dê uma volta, se o vendedor deixar, e leve alguém que perceba de mecânica. Atenção a ruídos, a mudanças que saltam e a travões que vibram. Pergunte pelas revisões e pelo historial: uma mota com manutenção feita é uma mota com quem já se preocupou.",
      "Não pague antes de ver a mota e os documentos, e combine o encontro num sítio público. No marketplace da MotoBox, os vendedores com o selo de verificado já passaram pela equipa.",
    ],
    categoria: "Guias",
    tags: ["Marketplace", "Mota usada", "Documentos"],
    autor: "Redacção MotoBox",
    data: "2026-09-16",
    imagem: "artigo-mota-usada",
    leitura: 4,
  },
];

/* ============================================================
   CONTEÚDO DE COMPETIÇÃO
   A MotoBox deixou de organizar classificações, pilotos e
   resultados. Os tipos e as tabelas continuam na base de dados,
   vazios, para o painel e para eventos antigos.
   ============================================================ */

export const pilotos: Piloto[] = [];
export const equipas: Equipa[] = [];
export const corridas: Corrida[] = [];
export const videos: Video[] = [];
export const patrocinadores: Patrocinador[] = [];

/* ============================================================
   MARKETPLACE
   ============================================================ */

export const anuncios: AnuncioMarketplace[] = [
  {
    id: "mkt-001",
    titulo: "KTM 250 SX-F 2023, pronta para corrida",
    categoria: "Motas",
    preco: 6800000,
    negociavel: true,
    marca: "KTM",
    modelo: "250 SX-F",
    ano: 2023,
    quilometragem: 78,
    estado: "Muito bom",
    provincia: "Luanda",
    descricao:
      "Mota de corrida usada apenas em duas temporadas do motocross. Motor revisto há 12 horas de utilização, suspensão WP com serviço feito, kit de transmissão novo. Acompanha suporte de box e jogo de plásticos suplente. Documentação em ordem.",
    imagens: ["ktm250"],
    vendedor: { nome: "Carlos Ventura", verificado: true, desde: 2023, anuncios: 7, avaliacao: 4.9 },
    publicado: "2026-09-26",
    visualizacoes: 1240,
  },
  {
    id: "mkt-002",
    titulo: "Capacete Fox V3 RS, tamanho M, como novo",
    categoria: "Equipamento",
    preco: 320000,
    negociavel: false,
    marca: "Fox Racing",
    modelo: "V3 RS",
    estado: "Como nova",
    provincia: "Luanda",
    descricao:
      "Capacete usado em três provas. Sem quedas. Certificação ECE 22.06 e MIPS. Vem com saco original e viseira suplente. Tamanho M (57-58 cm).",
    imagens: ["capacete"],
    vendedor: { nome: "André Fonseca", verificado: true, desde: 2024, anuncios: 3, avaliacao: 5 },
    publicado: "2026-09-28",
    visualizacoes: 486,
  },
  {
    id: "mkt-003",
    titulo: "Honda CRF 450R 2021, trail e enduro",
    categoria: "Motas",
    preco: 5200000,
    negociavel: true,
    marca: "Honda",
    modelo: "CRF 450R",
    ano: 2021,
    quilometragem: 4200,
    estado: "Bom",
    provincia: "Benguela",
    descricao:
      "Usada em passeios e provas de enduro amador. Pneus novos, travões revistos, kit de iluminação instalado para uso em trilho. Alguns riscos nos plásticos, nada de estrutural. Aceito troca por mota de estrada.",
    imagens: ["crf450"],
    vendedor: { nome: "Rui Sebastião", verificado: true, desde: 2022, anuncios: 2, avaliacao: 4.8 },
    publicado: "2026-09-19",
    visualizacoes: 892,
  },
  {
    id: "mkt-004",
    titulo: "Jogo de suspensão WP XACT, revisto",
    categoria: "Peças",
    preco: 890000,
    negociavel: true,
    marca: "WP Suspension",
    modelo: "XACT 48",
    estado: "Muito bom",
    provincia: "Luanda",
    descricao:
      "Forquilha e amortecedor WP XACT retirados de KTM 450 SX-F 2022. Revisão completa feita na MotoCenter há 3 meses, com factura. Molas para piloto de 75-85 kg.",
    imagens: ["suspensao"],
    vendedor: { nome: "Duas Rodas Luanda", verificado: true, desde: 2022, anuncios: 24, avaliacao: 4.7 },
    publicado: "2026-09-21",
    visualizacoes: 341,
  },
  {
    id: "mkt-005",
    titulo: "Yamaha Ténéré 700 2022, pronta para viajar",
    categoria: "Motas",
    preco: 9400000,
    negociavel: false,
    marca: "Yamaha",
    modelo: "Ténéré 700",
    ano: 2022,
    quilometragem: 18500,
    estado: "Muito bom",
    provincia: "Luanda",
    descricao:
      "Trail preparada para viagem: malas laterais Givi, top case, protecção de motor, guiador alto, tomada USB e suporte de GPS. Já fez as viagens de Luanda ao Namibe e de Luanda a Cabinda. Revisões todas na marca.",
    imagens: ["tenere"],
    vendedor: { nome: "Miguel Sousa", verificado: true, desde: 2021, anuncios: 5, avaliacao: 5 },
    publicado: "2026-09-27",
    visualizacoes: 2170,
  },
  {
    id: "mkt-006",
    titulo: "Botas Alpinestars Tech 7, n.º 43",
    categoria: "Equipamento",
    preco: 245000,
    negociavel: true,
    marca: "Alpinestars",
    modelo: "Tech 7",
    estado: "Bom",
    provincia: "Huíla",
    descricao:
      "Botas de motocross tamanho 43, usadas uma temporada. Fivelas todas funcionais, solas com desgaste normal. Confortáveis e ainda com muita vida.",
    imagens: ["botas"],
    vendedor: { nome: "Mário Lopes", verificado: true, desde: 2023, anuncios: 4, avaliacao: 4.6 },
    publicado: "2026-09-12",
    visualizacoes: 298,
  },
  {
    id: "mkt-007",
    titulo: "Escape Akrapovič completo para KTM 450 SX-F",
    categoria: "Peças",
    preco: 620000,
    negociavel: false,
    marca: "Akrapovič",
    estado: "Como nova",
    provincia: "Luanda",
    descricao:
      "Sistema completo em titânio para KTM 450 SX-F (2019-2023). Usado em duas provas. Ganho real de potência e menos 1,4 kg face ao original. Inclui todas as juntas.",
    imagens: ["escape"],
    vendedor: { nome: "Eduardo Matos", verificado: true, desde: 2023, anuncios: 6, avaliacao: 4.9 },
    publicado: "2026-09-24",
    visualizacoes: 512,
  },
  {
    id: "mkt-008",
    titulo: "Suzuki DR 650 1998, projecto",
    categoria: "Motas",
    preco: 1350000,
    negociavel: true,
    marca: "Suzuki",
    modelo: "DR 650",
    ano: 1998,
    quilometragem: 62000,
    estado: "Para peças",
    provincia: "Huambo",
    descricao:
      "Mota a precisar de restauro. Motor arranca e trabalha, mas precisa de revisão. Chassis são, sem corrosão grave. Ideal para quem quer um projecto de inverno. Documentação disponível.",
    imagens: ["dr650"],
    vendedor: { nome: "Nuno Chivela", verificado: true, desde: 2024, anuncios: 2, avaliacao: 4.5 },
    publicado: "2026-09-05",
    visualizacoes: 674,
  },
  {
    id: "mkt-009",
    titulo: "Kit de plásticos Polisport para Honda CRF 250",
    categoria: "Peças",
    preco: 95000,
    negociavel: false,
    marca: "Polisport",
    estado: "Nova",
    provincia: "Cabinda",
    descricao:
      "Kit completo de plásticos novo, na caixa, para Honda CRF 250R 2018-2021. Cor vermelha original. Comprei e vendi a mota antes de montar.",
    imagens: ["plasticos"],
    vendedor: { nome: "Hélder Quintas", verificado: true, desde: 2023, anuncios: 3, avaliacao: 4.8 },
    publicado: "2026-09-27",
    visualizacoes: 187,
  },
  {
    id: "mkt-010",
    titulo: "Equipamento completo Thor: calças 32 + camisola M",
    categoria: "Equipamento",
    preco: 130000,
    negociavel: true,
    marca: "Thor",
    estado: "Bom",
    provincia: "Benguela",
    descricao:
      "Conjunto de calças (tamanho 32) e camisola (M) da Thor, modelo Sector. Usado uma temporada, sem rasgões. Lavado e pronto a usar.",
    imagens: ["equipamento"],
    vendedor: { nome: "Joana Faria", verificado: true, desde: 2022, anuncios: 8, avaliacao: 5 },
    publicado: "2026-09-16",
    visualizacoes: 405,
  },
  {
    id: "mkt-011",
    titulo: "Suporte de box e rampa de carga",
    categoria: "Acessórios",
    preco: 78000,
    negociavel: true,
    marca: "Genérico",
    estado: "Muito bom",
    provincia: "Luanda",
    descricao:
      "Suporte de box em alumínio, regulável em altura, e rampa de carga dobrável para carrinha. Ambos em bom estado, usados numa temporada.",
    imagens: ["suporte"],
    vendedor: { nome: "Lobito Duas Rodas", verificado: true, desde: 2023, anuncios: 11, avaliacao: 4.9 },
    publicado: "2026-09-09",
    visualizacoes: 233,
  },
  {
    id: "mkt-012",
    titulo: "Husqvarna FE 350 2020, enduro",
    categoria: "Motas",
    preco: 4900000,
    negociavel: true,
    marca: "Husqvarna",
    modelo: "FE 350",
    ano: 2020,
    quilometragem: 6800,
    estado: "Bom",
    provincia: "Namibe",
    descricao:
      "Enduro homologada para estrada, usada em provas do calendário nacional. Motor com revisão feita, embraiagem nova. Vendo por mudança de cilindrada. Acompanha jogo de pneus de dunas.",
    imagens: ["fe350"],
    vendedor: { nome: "Paulo Teixeira", verificado: true, desde: 2023, anuncios: 1, avaliacao: 4.7 },
    publicado: "2026-09-02",
    visualizacoes: 1058,
  },
  {
    id: "mkt-013",
    titulo: "Vespa Primavera 125 2022, ideal para a cidade",
    categoria: "Motas",
    preco: 1650000,
    negociavel: true,
    marca: "Vespa",
    modelo: "Primavera 125",
    ano: 2022,
    quilometragem: 6400,
    estado: "Muito bom",
    provincia: "Luanda",
    descricao:
      "Scooter usada no dia-a-dia entre o Kinaxixi e Talatona. Revisões feitas no concessionário, pneus com meio uso, top case incluído. Documentação em ordem e duas chaves.",
    imagens: ["vespa-amarela"],
    vendedor: { nome: "Bela Matias", verificado: true, desde: 2025, anuncios: 1, avaliacao: 5 },
    publicado: "2026-09-29",
    visualizacoes: 312,
  },
  {
    id: "mkt-014",
    titulo: "Honda CB500X 2021, estrada e picada leve",
    categoria: "Motas",
    preco: 4900000,
    negociavel: true,
    marca: "Honda",
    modelo: "CB500X",
    ano: 2021,
    quilometragem: 18500,
    estado: "Muito bom",
    provincia: "Benguela",
    descricao:
      "Trail de média cilindrada, boa para viajar. Fez a estrada da costa até ao Namibe duas vezes. Malas laterais, protecção de cárter e manetes novas. Manutenção com registo.",
    imagens: ["trail-estrada"],
    vendedor: { nome: "Ivo Cardoso", verificado: true, desde: 2024, anuncios: 2, avaliacao: 4.8 },
    publicado: "2026-09-23",
    visualizacoes: 534,
  },
  {
    id: "mkt-015",
    titulo: "Royal Enfield Classic 350, como nova",
    categoria: "Motas",
    preco: 3200000,
    negociavel: false,
    marca: "Royal Enfield",
    modelo: "Classic 350",
    ano: 2023,
    quilometragem: 3100,
    estado: "Como nova",
    provincia: "Luanda",
    descricao:
      "Clássica de linhas antigas e mecânica nova. Sempre guardada em garagem, nunca caiu. Vende-se por mudança de país. Acompanha capa e manual.",
    imagens: ["classica"],
    vendedor: { nome: "Tomás Neto", verificado: false, desde: 2026, anuncios: 1, avaliacao: 0 },
    publicado: "2026-09-30",
    visualizacoes: 128,
  },
];


/* ============================================================
   FÓRUM
   ============================================================ */

export const categoriasForum: CategoriaForum[] = [
  {
    slug: "passeios",
    nome: "Passeios e viagens",
    descricao: "Organizar saídas, raides, rotas e travessias",
    icone: "map",
    topicos: 0,
    mensagens: 0,
    cor: "#e10600",
  },
  {
    slug: "mecanica",
    nome: "Mecânica e oficina",
    descricao: "Manutenção, avarias, peças e afinações",
    icone: "wrench",
    topicos: 0,
    mensagens: 0,
    cor: "#e10600",
  },
  {
    slug: "equipamento",
    nome: "Equipamento",
    descricao: "Capacetes, protecções, vestuário e recomendações",
    icone: "shield",
    topicos: 0,
    mensagens: 0,
    cor: "#e10600",
  },
  {
    slug: "novatos",
    nome: "Primeira mota",
    descricao: "Carta de condução, primeira compra e dúvidas básicas",
    icone: "help",
    topicos: 0,
    mensagens: 0,
    cor: "#e10600",
  },
  {
    slug: "clubes",
    nome: "Clubes e encontros",
    descricao: "Apresentar um clube, combinar encontros, juntar gente",
    icone: "flag",
    topicos: 0,
    mensagens: 0,
    cor: "#e10600",
  },
  {
    slug: "geral",
    nome: "Conversa geral",
    descricao: "Tudo o resto sobre andar de mota em Angola",
    icone: "chat",
    topicos: 0,
    mensagens: 0,
    cor: "#e10600",
  },
];

export const topicos: TopicoForum[] = [
  {
    id: "t-001",
    titulo: "[OFICIAL] Regras do fórum MotoBox: ler antes de publicar",
    categoria: "Conversa geral",
    categoriaSlug: "geral",
    autor: "Equipa MotoBox",
    autorAvatar: "MB",
    avatarCor: "#e10600",
    criado: "2026-09-01",
    respostas: 0,
    visualizacoes: 1240,
    ultimaResposta: { autor: "Moderação", quando: "há 2 semanas" },
    fixado: true,
    bloqueado: true,
    excerto:
      "Bem-vindos ao fórum da MotoBox. Um espaço para toda a comunidade motard angolana, da scooter à moto de viagem. Respeito acima de tudo, sem publicidade não autorizada e sem conteúdo fora do tema.",
  },
  {
    id: "t-002",
    titulo: "Passeio ao Miradouro da Lua em Novembro: quem vem pela primeira vez?",
    categoria: "Passeios e viagens",
    categoriaSlug: "passeios",
    autor: "Kiesse_R",
    autorAvatar: "KR",
    avatarCor: "#e10600",
    criado: "2026-09-27",
    respostas: 0,
    visualizacoes: 640,
    ultimaResposta: { autor: "Nzinga125", quando: "há 3 horas" },
    excerto:
      "Vi o passeio na secção Eventos e queria ir, mas nunca andei em grupo. Alguém que também se estreia? Que distância se costuma deixar entre motas?",
  },
  {
    id: "t-003",
    titulo: "Corrente a fazer barulho depois da chuva, é normal?",
    categoria: "Mecânica e oficina",
    categoriaSlug: "mecanica",
    autor: "Zeca_Lobito",
    autorAvatar: "ZL",
    avatarCor: "#e10600",
    criado: "2026-09-25",
    respostas: 0,
    visualizacoes: 410,
    ultimaResposta: { autor: "OficinaDoBairro", quando: "há 6 horas" },
    resolvido: true,
    excerto:
      "Desde as primeiras chuvas a corrente da minha trail faz um chiar estranho a baixa velocidade. Limpo e lubrifico ou é sinal de que está gasta?",
  },
  {
    id: "t-004",
    titulo: "Primeira mota: scooter de 125 para o trabalho ou trail para o fim-de-semana?",
    categoria: "Primeira mota",
    categoriaSlug: "novatos",
    autor: "JoaoPrimeiraMota",
    autorAvatar: "JP",
    avatarCor: "#e10600",
    criado: "2026-09-24",
    respostas: 0,
    visualizacoes: 1180,
    ultimaResposta: { autor: "VeteranaDaEstrada", quando: "há 1 dia" },
    excerto:
      "Trabalho em Talatona e quero fugir ao trânsito, mas ao fim-de-semana gostava de sair da cidade. Uma mota dá para as duas coisas ou é melhor escolher?",
  },
  {
    id: "t-005",
    titulo: "Capacetes com homologação ECE 22.06: onde comprar em Luanda?",
    categoria: "Equipamento",
    categoriaSlug: "equipamento",
    autor: "SegurancaPrimeiro",
    autorAvatar: "SP",
    avatarCor: "#e10600",
    criado: "2026-09-20",
    respostas: 0,
    visualizacoes: 720,
    ultimaResposta: { autor: "Malu_Rides", quando: "há 2 dias" },
    excerto:
      "Ando à procura de um capacete com a homologação nova e não quero comprar cópia. Que lojas têm stock com etiqueta verificável?",
  },
  {
    id: "t-006",
    titulo: "Somos um grupo de Vespa no Lobito: há mais gente de scooters clássicas?",
    categoria: "Clubes e encontros",
    categoriaSlug: "clubes",
    autor: "Vespista_Lobito",
    autorAvatar: "VL",
    avatarCor: "#e10600",
    criado: "2026-09-18",
    respostas: 0,
    visualizacoes: 330,
    ultimaResposta: { autor: "Bela_Scooter", quando: "há 3 dias" },
    excerto:
      "Juntamo-nos aos sábados de manhã junto à restinga. Somos cinco e gostávamos de conhecer outros grupos de scooters pelo país.",
  },
  {
    id: "t-007",
    titulo: "Raide a Malanje no cacimbo: Kalandula e Pungo Andongo num fim-de-semana dá?",
    categoria: "Passeios e viagens",
    categoriaSlug: "passeios",
    autor: "MiguelTrail",
    autorAvatar: "MT",
    avatarCor: "#e10600",
    criado: "2026-09-12",
    respostas: 0,
    visualizacoes: 880,
    ultimaResposta: { autor: "AnaOnTwo", quando: "há 4 dias" },
    excerto:
      "Saída de Luanda na sexta à tarde, dormida em Malanje e regresso domingo. Com os buracos entre Maria Teresa e N'dalatando, é demasiado apertado?",
  },
  {
    id: "t-008",
    titulo: "Como funciona o selo de verificado no marketplace?",
    categoria: "Conversa geral",
    categoriaSlug: "geral",
    autor: "Vendedor_Novo",
    autorAvatar: "VN",
    avatarCor: "#e10600",
    criado: "2026-09-08",
    respostas: 0,
    visualizacoes: 290,
    ultimaResposta: { autor: "Moderação", quando: "há 1 semana" },
    resolvido: true,
    excerto:
      "Tenho uma mota e equipamento para vender e queria fazê-lo pela MotoBox em vez do grupo de WhatsApp. O que preciso para ficar verificado?",
  },
];

/* ============================================================
   HELPERS
   ============================================================ */

export function formatKz(valor: number): string {
  return new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(valor) + " Kz";
}

/*
 * As datas saem sempre em português: são formatadas no servidor, onde o
 * idioma escolhido pelo visitante ainda não é conhecido. A tradução para
 * inglês é feita no cliente, em components/TraduzirPagina.tsx.
 */
const localeData = "pt-PT";

export function formatData(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString(localeData, opts ?? { day: "2-digit", month: "long", year: "numeric" });
}

export function formatDataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString(localeData, { day: "2-digit", month: "short" }).toUpperCase().replace(".", "");
}

/*
 * Os helpers abaixo recebem a lista em vez de usarem os arrays deste
 * ficheiro: o site público lê o conteúdo do Supabase (ver
 * lib/supabase/publico.ts), e estes arrays são só demonstração e semente.
 */

export function classificacaoPilotos(pilotos: Piloto[], categoria?: string) {
  return [...pilotos]
    .filter((p) => !categoria || categoria === "Todas" || p.categoria === categoria)
    .sort((a, b) => b.estatisticas.pontos - a.estatisticas.pontos)
    .map((p, i) => ({ ...p, posicao: i + 1 }));
}

export function classificacaoEquipas(equipas: Equipa[]) {
  return [...equipas]
    .filter((e) => e.estatisticas.pontos > 0)
    .sort((a, b) => b.estatisticas.pontos - a.estatisticas.pontos)
    .map((e, i) => ({ ...e, posicao: i + 1 }));
}

export function proximoEvento(eventos: Evento[]): Evento | undefined {
  const agora = Date.now();
  return eventos
    .filter((e) => new Date(e.dataInicio).getTime() > agora)
    .sort((a, b) => +new Date(a.dataInicio) - +new Date(b.dataInicio))[0];
}

export function eventosComBilhetes(eventos: Evento[]): Evento[] {
  return eventos.filter((e) => e.bilhetes && e.bilhetes.length > 0 && e.estado !== "concluido");
}
