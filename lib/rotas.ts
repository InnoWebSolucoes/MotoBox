/* ============================================================
   MOTOBOX — Rotas de moto-turismo
   Destinos para ir de mota em Angola, com o que se sabe de cada
   um: estrada, piso, época, distâncias e cuidados.

   Tudo tem fonte (lista `fontes` de cada rota). Quando as fontes
   discordam, fica o intervalo ou fica de fora: o número de curvas
   da Leba e a altura do Cristo Rei, por exemplo, não se publicam.
   Informação verificada em Setembro de 2026; estradas e preços
   mudam, por isso o site pede sempre para confirmar localmente.

   As fotografias são chaves de lib/imagens.ts (motas em estrada,
   terra, dunas e costa), não dos próprios lugares: o site marca-as
   como ilustrativas.
   ============================================================ */

import type { Provincia } from "@/lib/types";

export type Piso = "Asfalto" | "Asfalto e terra" | "Asfalto e areia";

/** Quanto a rota pede a quem conduz, dito pelas fontes (estrada, piso, isolamento). */
export type Exigencia = "Tranquila" | "Média" | "Exigente" | "Aventura";

export interface FonteRota {
  nome: string;
  url: string;
}

export interface Rota {
  slug: string;
  nome: string;
  /** Uma linha, por baixo do nome. */
  subtitulo: string;
  /** Como aparece no cartão, ex.: "Huíla · Namibe". */
  regiao: string;
  /** Para ligar a rota aos clubes da mesma zona. */
  provincias: Provincia[];
  /** Cidade de onde normalmente se parte. */
  partida: string;
  piso: Piso;
  /** O piso em concreto: estradas, troços de terra, areia. */
  pisoDetalhe: string;
  exigencia: Exigencia;
  /** Porquê esta exigência, numa frase. */
  exigenciaPorque: string;
  melhorEpoca: string;
  resumo: string;
  descricao: string[];
  /** Só distâncias publicadas numa fonte (índice em `fontes`). */
  distancias: { texto: string; fonte: number }[];
  destaques: string[];
  dicas: string[];
  imagem: string;
  fontes: FonteRota[];
}

/* Fontes que se repetem entre rotas. */
const F = {
  redeLeba: { nome: "Rede Angola: Serra da Leba", url: "https://www.redeangola.info/roteiros/serra-da-leba/" },
  dangerousLeba: { nome: "Dangerous Roads: Serra da Leba Pass", url: "https://www.dangerousroads.org/africa/angola/2730-serra-da-leba-pass.html" },
  visiteLeba: { nome: "Visite Huíla: Miradouro da Leba", url: "https://visitehuila.com/en/turismo/locais-interesse/humpata/miradouro-leba.html" },
  wikiLeba: { nome: "Wikipedia: Serra da Leba", url: "https://en.wikipedia.org/wiki/Serra_da_Leba" },
  wikiEN280: { nome: "Wikipédia: EN-280", url: "https://pt.wikipedia.org/wiki/EN-280" },
  nitLeba: { nome: "NiT: Serra da Leba", url: "https://www.nit.pt/fora-de-casa/viagens/serra-de-leba-uma-das-estradas-mais-emblematicas-e-desafiantes-de-angola-tem-30-curvas" },
  got2Leba: { nome: "Got2Globe: Serra da Leba", url: "https://www.got2globe.com/editorial/serra-leba-estrada-namibe-huila-angola/" },
  t4a: { nome: "Tracks4Africa: bikepacking em Angola (2025)", url: "https://blog.tracks4africa.co.za/what-its-like-bikepacking-angola/" },
  wikiLubango: { nome: "Wikipedia: Lubango (clima)", url: "https://en.wikipedia.org/wiki/Lubango" },
  wikiTundavala: { nome: "Wikipedia: Tundavala Gap", url: "https://en.wikipedia.org/wiki/Tundavala_Gap" },
  ptTundavala: { nome: "Wikipédia: Fenda da Tundavala", url: "https://pt.wikipedia.org/wiki/Fenda_da_Tundavala" },
  redeTundavala: { nome: "Rede Angola: Tundavala", url: "https://www.redeangola.info/roteiros/tundavala/" },
  visiteTundavala: { nome: "Visite Huíla: Zona turística da Tundavala", url: "https://visitehuila.com/en/turismo/locais-interesse/lubango/zona-turistica-tundavala.html" },
  wikivoyageLubango: { nome: "Wikivoyage: Lubango", url: "https://en.wikivoyage.org/wiki/Lubango" },
  maravilhas: { nome: "Novo Jornal: as 7 Maravilhas Naturais de Angola", url: "https://novojornal.co.ao/sociedade/detalhe/ja-sao-conhecidas-as-7-maravilhas-naturais-de-angola-5228.html" },
  cristoRei: { nome: "Wikipédia: Cristo Rei do Lubango", url: "https://pt.wikipedia.org/wiki/Cristo_Rei_do_Lubango" },
  ptKalandula: { nome: "Wikipédia: Quedas de Calandula", url: "https://pt.wikipedia.org/wiki/Quedas_de_Calandula" },
  wikiKalandula: { nome: "Wikipedia: Kalandula Falls", url: "https://en.wikipedia.org/wiki/Kalandula_Falls" },
  landersMalanje: { nome: "African Landers: Malanje, Calandula e Pungo Andongo (2022)", url: "https://africanlanders.com/en/angola-en/angola-the-region-of-malanje-calandula-falls-and-pungo-andongo/" },
  got2Kalandula: { nome: "Got2Globe: Quedas de Calandula", url: "https://www.got2globe.com/editorial/quedas-calandula-angola-malange/" },
  wikiMalanje: { nome: "Wikipedia: Malanje", url: "https://en.wikipedia.org/wiki/Malanje" },
  redePungo: { nome: "Rede Angola: Pungo Andongo", url: "https://www.redeangola.info/roteiros/pungo-andongo/" },
  ptPungo: { nome: "Wikipédia: Pedras Negras de Pungo Andongo", url: "https://pt.wikipedia.org/wiki/Pedras_Negras_de_Pungo_Andongo" },
  musseleje: { nome: "Hotéis Angola: Kalandula e Musseleje", url: "https://www.hoteisangola.com/en/artigo-viajante/kalandula-musseleje.html" },
  ptMiradouro: { nome: "Wikipédia: Miradouro da Lua", url: "https://pt.wikipedia.org/wiki/Miradouro_da_Lua" },
  visiteLuandaLua: { nome: "Visite Luanda: Miradouro da Lua", url: "https://visiteluanda.com/en/locais-interesse/miradouro-lua.html" },
  luandaGuide: { nome: "Luanda Guide: Miradouro da Lua", url: "https://luandaguide.com/miradouro-da-lua-moon-viewpoint/" },
  euronews: { nome: "Euronews: os motards que percorrem Angola (2021)", url: "https://www.euronews.com/2021/03/10/the-bikers-making-angola-the-ride-of-their-lives" },
  landersCosta: { nome: "African Landers: a costa de Angola (2022)", url: "https://africanlanders.com/en/angola-en/angola-the-coast-of-angola-tombua-namibe-praia-do-soba-and-piambo-benguela-and-lobito-sumbe-cabo-ledo-barra-do-kwanza-and-miradouro-da-lua-luanda-praia-do-sarico-and-barra-do-dande/" },
  wikiLuanda: { nome: "Wikipedia: Luanda (clima)", url: "https://en.wikipedia.org/wiki/Luanda" },
  ptCaboLedo: { nome: "Wikipédia: Cabo Ledo", url: "https://pt.wikipedia.org/wiki/Cabo_Ledo" },
  wikiCaboLedo: { nome: "Wikipedia: Cabo Ledo", url: "https://en.wikipedia.org/wiki/Cabo_Ledo" },
  surfCaboLedo: { nome: "Surfer Today: Praia dos Surfistas", url: "https://www.surfertoday.com/surfing/praia-dos-surfistas-cabo-ledo-surf-guide" },
  en100Obras: { nome: "Correio Kianda: duplicação da EN100 (2026)", url: "https://correiokianda.info/estrada-nacional-100-tera-duas-vias-em-cada-sentido-a-partir-de-2027/" },
  wikiQuicama: { nome: "Wikipedia: Parque Nacional da Quiçama", url: "https://en.wikipedia.org/wiki/Qui%C3%A7ama_National_Park" },
  inbacQuicama: { nome: "INBAC: Parque Nacional da Quiçama", url: "https://www.inbac.gov.ao/Site/areasConservacao/parque/18" },
  muxima: { nome: "Wikipédia: Santuário da Muxima", url: "https://pt.wikipedia.org/wiki/Santu%C3%A1rio_de_Nossa_Senhora_da_Concei%C3%A7%C3%A3o_da_Muxima" },
  wikiMocamedes: { nome: "Wikipedia: Moçâmedes (clima)", url: "https://en.wikipedia.org/wiki/Mo%C3%A7%C3%A2medes" },
  ptEN100: { nome: "Wikipédia: EN-100", url: "https://pt.wikipedia.org/wiki/EN-100" },
  wikiEN100: { nome: "Wikipedia: EN-100", url: "https://en.wikipedia.org/wiki/EN-100" },
  arcos: { nome: "Destino Namibe: Lagoa dos Arcos", url: "https://www.destinonamibe.com/en/locais-interesse/tombua/lagoa-dos-arcos.html" },
  arcosVer: { nome: "VerAngola: Lagoa dos Arcos", url: "https://www.verangola.net/va/pt/072020/sugestoes/21077/Lagoa-dos-Arcos-O-que-fazer.htm" },
  wikiIona: { nome: "Wikipedia: Parque Nacional do Iona", url: "https://en.wikipedia.org/wiki/Iona_National_Park" },
  inbacIona: { nome: "INBAC: Parque Nacional do Iona", url: "https://inbac.gov.ao/Site/areasConservacao/parque/7" },
  welwitschia: { nome: "Wikipedia: Welwitschia", url: "https://en.wikipedia.org/wiki/Welwitschia" },
  got2Tigres: { nome: "Got2Globe: Baía dos Tigres", url: "https://www.got2globe.com/editorial/baia-dos-tigres-namibe-angola/" },
  aventuraMoto: { nome: "Hotéis Angola: Uma aventura de mota em Angola (2019)", url: "https://www.hoteisangola.com/en/artigo-viajante/uma-aventura-moto-angola.html" },
  redeBaiaFarta: { nome: "Rede Angola: Baía Farta", url: "https://www.redeangola.info/roteiros/baia-farta/" },
  baiaAzul: { nome: "Destino Benguela: Baía Azul", url: "https://destinobenguela.com/en/turismo/locais-interesse/praias-costa/baia-azul.html" },
  caotinha: { nome: "Welcome to Angola: Praia da Caotinha", url: "https://welcometoangola.co.ao/en/directorio/praia-da-caotinha/" },
  praiasSul: { nome: "Destino Benguela: roteiro Praias do Sul", url: "https://destinobenguela.com/en/roteiros/praias-sul-benguela.html" },
  restinga: { nome: "Destino Benguela: Restinga do Lobito", url: "https://destinobenguela.com/en/turismo/locais-interesse/lobito2/restinga-lobito.html" },
  wikiBenguela: { nome: "Wikipedia: Benguela", url: "https://en.wikipedia.org/wiki/Benguela" },
  wikiLobito: { nome: "Wikipedia: Lobito (clima)", url: "https://en.wikipedia.org/wiki/Lobito" },
  geografia: { nome: "Wikipedia: Geografia de Angola (clima)", url: "https://en.wikipedia.org/wiki/Geography_of_Angola" },
  combustivel: { nome: "Carta de Angola: combustível em Benguela, Huíla e Namibe (Jun. 2026)", url: "https://cartadeangola.com/2026/06/01/sonangol-nega-escassez-de-combustivel-mas-admite-constrangimentos-no-centro-e-sul-do-pais/" },
  combustivel2: { nome: "DNotícias: situação do combustível (Ago. 2026)", url: "https://www.dnoticias.pt/2026/8/6/501595-angola-enfrenta-situacao-preocupante-de-escassez-de-combustivel/" },
  fcdo: { nome: "FCDO (Reino Unido): Angola, segurança", url: "https://www.gov.uk/foreign-travel-advice/angola/safety-and-security" },
  fcdoSaude: { nome: "FCDO (Reino Unido): Angola, saúde", url: "https://www.gov.uk/foreign-travel-advice/angola/health" },
  codigo: { nome: "Código de Estrada de Angola", url: "https://angolex.com/paginas/codigos/codigo-de-estrada.html" },
  cartas: { nome: "Polícia Nacional (DTSER): carta de condução", url: "https://www.dtser.pn.gov.ao/ao/perguntas-frequentes/carta-de-conducao/" },
  minas: { nome: "Landmine Monitor: Angola", url: "https://the-monitor.org/country-profile/angola/impact" },
} satisfies Record<string, FonteRota>;

export const ROTAS: Rota[] = [
  {
    slug: "serra-da-leba",
    nome: "Serra da Leba",
    subtitulo: "A estrada das curvas, do planalto ao deserto",
    regiao: "Huíla · Namibe",
    provincias: ["Huíla", "Namibe"],
    partida: "Lubango",
    piso: "Asfalto",
    pisoDetalhe:
      "O troço da serra é todo asfaltado, na EN-280 entre a Humpata e o Caraculo. É estreito e tem pouca protecção lateral. A EN-280 no seu todo não é pavimentada em toda a extensão.",
    exigencia: "Exigente",
    exigenciaPorque: "Curvas em gancho seguidas, estrada estreita e poucos rails; perigosa com chuva ou de noite.",
    melhorEpoca:
      "Junho a Agosto: no Lubango quase não chove. As chuvas mais fortes caem de Dezembro a Março.",
    resumo:
      "A descida em ziguezague que liga o planalto da Huíla ao deserto do Namibe. Uma das estradas mais fotografadas de Angola.",
    descricao: [
      "A Serra da Leba fica no limite entre a Huíla e o Namibe e é conhecida pela estrada em ziguezague que desce do planalto em direcção ao deserto. Faz parte da EN-280, a ligação entre o Lubango, a Humpata, o Caraculo e Moçâmedes, e o troço sinuoso tem cerca de 20 km.",
      "O troço em S foi desenhado pelo engenheiro Edgar Cardoso. Numa só subida ou descida atravessam-se três a quatro zonas de clima diferentes, do fresco do planalto ao calor da base.",
      "O melhor ponto para ver a estrada inteira é o Miradouro da Leba. Na época das chuvas, um rio subterrâneo termina numa cascata escondida na serra.",
    ],
    distancias: [
      { texto: "Cerca de 50 km do Lubango, a caminho do Namibe", fonte: 0 },
      { texto: "Troço sinuoso: cerca de 20 km", fonte: 0 },
      { texto: "Miradouro da Leba: 20 km da sede da Humpata", fonte: 2 },
    ],
    destaques: [
      "Miradouro da Leba, com a estrada inteira à vista",
      "A descida em ganchos do planalto para o deserto",
      "Cascata escondida, na época das chuvas",
    ],
    dicas: [
      "A estrada é estreita e tem pouca protecção lateral, e já houve muitos acidentes graves. Desça devagar e não ultrapasse nas curvas.",
      "Evite fazer a serra de noite ou com chuva.",
      "No planalto as manhãs de Junho e Julho são frias e na subida pode fazer mais de 35 °C. Leve roupa por camadas.",
      "Nos miradouros há muitas crianças a pedir doces. Pare fora da faixa de rodagem, num sítio largo.",
    ],
    imagem: "equipamento",
    fontes: [F.redeLeba, F.dangerousLeba, F.visiteLeba, F.wikiLeba, F.wikiEN280, F.nitLeba, F.got2Leba, F.t4a, F.wikiLubango],
  },
  {
    slug: "tundavala",
    nome: "Fenda da Tundavala",
    subtitulo: "Onde o planalto acaba de repente",
    regiao: "Huíla",
    provincias: ["Huíla"],
    partida: "Lubango",
    piso: "Asfalto",
    pisoDetalhe:
      "Estrada sem saída a partir do Lubango, reabilitada. Perto do fim o asfalto dá lugar a calçada de pedra.",
    exigencia: "Tranquila",
    exigenciaPorque: "Boa estrada e perto da cidade; o cuidado maior é o nevoeiro.",
    melhorEpoca:
      "Junho a Agosto, a época seca. Mesmo assim, confirme o tempo antes de subir: a névoa esconde muitas vezes o precipício.",
    resumo:
      "Uma escarpa de mais de mil metros no fim do Planalto Central, a cerca de 20 km do Lubango. Uma das 7 Maravilhas Naturais de Angola.",
    descricao: [
      "Na Tundavala o Planalto Central acaba de repente: a escarpa cai de mais de 2.200 m de altitude para cerca de 1.000 m. Foi declarada paisagem cultural em 2012 e é uma das 7 Maravilhas Naturais de Angola, eleitas em 2014.",
      "A estrada a partir do Lubango é sem saída e foi reabilitada, pelo que se faz com facilidade. Não se paga entrada, há estacionamento junto aos miradouros e um restaurante, mas poucos outros serviços e pouca iluminação.",
      "Na mesma saída fica o Cristo Rei do Lubango, inaugurado em 1957 no alto da Serra da Chela.",
    ],
    distancias: [{ texto: "Cerca de 18 a 20 km do Lubango", fonte: 0 }],
    destaques: [
      "Miradouros sobre a escarpa",
      "Miradouro da cascata da Tundavala, junto a uma barragem, uns 5 km antes do fim",
      "Cristo Rei do Lubango, na Serra da Chela",
    ],
    dicas: [
      "A névoa aparece muitas vezes. Com pouca visibilidade, abrande e leve as luzes ligadas.",
      "Em Julho as mínimas no Lubango andam pelos 8 °C e em Junho e Julho pode haver geada. Leve roupa quente para a manhã.",
      "Cuidado na calçada do fim da estrada, sobretudo com humidade.",
      "Há poucos serviços e pouca iluminação: planeie voltar antes de escurecer.",
    ],
    imagem: "moto-clube-luanda",
    fontes: [F.wikiTundavala, F.ptTundavala, F.redeTundavala, F.visiteTundavala, F.wikivoyageLubango, F.maravilhas, F.cristoRei, F.wikiLubango],
  },
  {
    slug: "kalandula-e-pungo-andongo",
    nome: "Quedas de Kalandula e Pungo Andongo",
    subtitulo: "Duas maravilhas de Malanje na mesma viagem",
    regiao: "Malanje",
    provincias: ["Malanje", "Cuanza Norte"],
    partida: "Luanda ou Malanje",
    piso: "Asfalto e terra",
    pisoDetalhe:
      "De Luanda pela EN230 por N'dalatando até ao Cacuso, e daí pela EN322. Há troços com muitos buracos, e as quedas de Musseleje e a Pousada de Calandula têm acesso em terra batida.",
    exigencia: "Média",
    exigenciaPorque: "Viagem longa, com buracos em vários troços e terra no fim; depois de chover, as picadas ficam com lama.",
    melhorEpoca:
      "De Maio a Setembro (cacimbo) as estradas estão secas. De Outubro a Abril chove em Malanje: as quedas têm mais caudal, mas as picadas enchem-se de lama.",
    resumo:
      "Quedas de 105 metros no rio Lucala e as rochas gigantes onde, diz a tradição, ficaram as pegadas da Rainha Ginga.",
    descricao: [
      "As quedas do rio Lucala, em Calandula, têm 105 m de altura e cerca de 400 m de largura, e são uma das 7 Maravilhas Naturais de Angola. Até 1975 chamavam-se Quedas do Duque de Bragança. Há um trilho para o cimo e outro para a base, e os miradouros junto à vila de Calandula são gratuitos.",
      "No mesmo caminho ficam as Pedras Negras de Pungo Andongo, no município do Cacuso: grandes rochas com milhões de anos onde a tradição vê as pegadas da Rainha Ginga, e onde restam ruínas de uma fortaleza de 1671.",
      "O caminho clássico sai de Luanda por Catete e segue pela EN230 até N'dalatando e ao Cacuso. Daí, a EN322 leva para norte, às quedas, ou a Pungo Andongo.",
    ],
    distancias: [
      { texto: "Quedas de Kalandula: cerca de 80 km de Malanje", fonte: 0 },
      { texto: "Malanje fica a 380 km de Luanda", fonte: 4 },
      { texto: "Pungo Andongo: 310 km de Luanda até ao Cacuso, mais 40 km pela EN322", fonte: 5 },
      { texto: "Quedas de Musseleje: 20 km de Kalandula, 15 dos quais de picada", fonte: 7 },
    ],
    destaques: [
      "Miradouros gratuitos junto à vila de Calandula",
      "Trilhos para o cimo e para a base das quedas",
      "Pedras Negras de Pungo Andongo",
      "Quedas de Musseleje",
    ],
    dicas: [
      "Há troços cheios de buracos, sobretudo entre Maria Teresa e N'dalatando (relato de 2022). Não conte com médias altas.",
      "De manhã a névoa pode esconder as quedas; a vista costuma melhorar à tarde.",
      "Na província de Malanje há muitos controlos policiais. Leve os documentos à mão.",
      "Depois de chover, a picada para Musseleje pede 4×4, segundo quem lá foi.",
      "Pungo Andongo é terra sagrada: peça licença antes de entrar.",
    ],
    imagem: "cabinda",
    fontes: [F.ptKalandula, F.wikiKalandula, F.landersMalanje, F.got2Kalandula, F.wikiMalanje, F.redePungo, F.ptPungo, F.musseleje, F.maravilhas],
  },
  {
    slug: "miradouro-da-lua",
    nome: "Miradouro da Lua e Barra do Kwanza",
    subtitulo: "A primeira saída de quem vive em Luanda",
    regiao: "Luanda · Icolo e Bengo",
    provincias: ["Luanda", "Icolo e Bengo"],
    partida: "Luanda",
    piso: "Asfalto",
    pisoDetalhe: "EN100, a estrada da costa, toda em asfalto. Terreno irregular junto ao miradouro.",
    exigencia: "Tranquila",
    exigenciaPorque: "Perto de Luanda e sempre em asfalto; o perigo está na borda da falésia.",
    melhorEpoca: "De Maio a Outubro está seco, muitas vezes com nevoeiro. As chuvas curtas caem em Março e Abril.",
    resumo:
      "Falésias recortadas pelo vento e pela chuva, com ar de paisagem lunar, a menos de uma hora e meia de Luanda.",
    descricao: [
      "O Miradouro da Lua são falésias moldadas pela erosão do vento e da chuva, com uma paisagem que parece lunar, junto à EN100 a sul de Luanda. É paragem habitual a caminho da Barra do Kwanza e de Cabo Ledo, e foi uma das paragens dos Amigos da Picada no passeio que a Euronews acompanhou em 2021.",
      "Tem posto de informação turística, balneários, estacionamento e um observatório com binóculos. Cerca de 15 km mais a sul fica a Barra do Kwanza, a vila na foz do rio.",
    ],
    distancias: [
      { texto: "40 a 60 km a sul de Luanda, conforme o ponto de partida", fonte: 0 },
      { texto: "Cerca de 1h a 1h15 de Luanda", fonte: 2 },
      { texto: "Barra do Kwanza: 75 km de Luanda pela EN100", fonte: 4 },
    ],
    destaques: [
      "O miradouro e o observatório",
      "Barra do Kwanza, na foz do rio",
      "Luz quente ao fim da tarde, horizonte mais limpo de manhã",
    ],
    dicas: [
      "As bordas desfazem-se: mantenha distância da falésia e não pare a mota junto à borda.",
      "A ponte sobre o Kwanza cobrava portagem em dinheiro (relato de 2022). Leve kwanzas.",
      "É uma boa primeira saída em grupo para quem está a começar: curta, em asfalto e com sítios para parar.",
    ],
    imagem: "trail-angola",
    fontes: [F.ptMiradouro, F.visiteLuandaLua, F.luandaGuide, F.euronews, F.landersCosta, F.wikiLuanda],
  },
  {
    slug: "cabo-ledo-e-quicama",
    nome: "Cabo Ledo, Quiçama e Muxima",
    subtitulo: "Praia de surf, parque nacional e a romaria dos motards",
    regiao: "Icolo e Bengo",
    provincias: ["Luanda", "Icolo e Bengo"],
    partida: "Luanda",
    piso: "Asfalto",
    pisoDetalhe: "Sempre pela EN100. O troço Cabo Ledo a Ramiros tem sido palco de acidentes graves.",
    exigencia: "Média",
    exigenciaPorque: "Estrada de trânsito rápido com acidentes graves recentes; pede atenção redobrada.",
    melhorEpoca: "De Maio a Outubro está seco, com nevoeiro frequente. As chuvas curtas caem em Março e Abril.",
    resumo:
      "A enseada de areia branca de Cabo Ledo, a travessia do Parque Nacional da Quiçama e o santuário da Muxima, junto ao Kwanza.",
    descricao: [
      "Cabo Ledo é um cabo que forma uma enseada larga, com falésias e areia branca, conhecido pela pesca e pelo surf: a Praia dos Surfistas tem uma onda de esquerda. Desde 2024 é município da nova província de Icolo e Bengo.",
      "O caminho pela EN100 atravessa o Parque Nacional da Quiçama, criado em 1957 entre os rios Kwanza e Longa e repovoado com animais vindos do Botswana e da África do Sul na Operação Arca de Noé, em 2001. Por ser estrada pública, não se paga para passar (relato de 2022).",
      "A Muxima, vila junto ao Kwanza, tem uma igreja e uma fortaleza de 1599. Os Amigos da Picada vão lá todos os anos pedir a bênção para a época de mota. A romaria acontece no fim de Agosto e início de Setembro.",
    ],
    distancias: [
      { texto: "Cabo Ledo: cerca de 110 a 120 km a sul de Luanda pela EN100, cerca de 2 horas", fonte: 0 },
      { texto: "Parque Nacional da Quiçama: cerca de 70 km de Luanda", fonte: 4 },
      { texto: "Muxima: 125 a 130 km de Luanda", fonte: 6 },
    ],
    destaques: [
      "Praia dos Surfistas, em Cabo Ledo",
      "Parque Nacional da Quiçama",
      "Santuário da Muxima",
      "Miradouro da Lua e Barra do Kwanza pelo caminho",
    ],
    dicas: [
      "Em Março de 2026 foram referidos acidentes recentes no troço Cabo Ledo a Ramiros com mais de 30 mortos. Rode devagar, em grupo compacto e nunca de noite.",
      "Para safaris na Quiçama, confirme antes as condições de entrada junto do INBAC.",
      "Na romaria da Muxima a estrada enche-se de peregrinos a pé: abrande muito.",
    ],
    imagem: "corrida-dunas-namibe-preview",
    fontes: [F.landersCosta, F.ptCaboLedo, F.wikiCaboLedo, F.surfCaboLedo, F.wikiQuicama, F.inbacQuicama, F.muxima, F.euronews, F.en100Obras, F.wikiLuanda],
  },
  {
    slug: "deserto-do-namibe",
    nome: "Deserto do Namibe: Arco, Tômbwa e Iona",
    subtitulo: "Areia, um oásis e as welwitschias",
    regiao: "Namibe",
    provincias: ["Namibe"],
    partida: "Moçâmedes",
    piso: "Asfalto e areia",
    pisoDetalhe:
      "EN100 larga e asfaltada de Moçâmedes ao Tômbwa. Depois do Tômbwa a estrada deixa de ter asfalto; o Arco e o Iona fazem-se em picada e areia.",
    exigencia: "Aventura",
    exigenciaPorque: "Areia, picadas, pouco combustível e nenhuma água no caminho. Só em grupo e bem preparado.",
    melhorEpoca:
      "Quase não chove (cerca de 51 mm por ano) e de Maio a Setembro praticamente nada; a corrente fria de Benguela mantém Julho e Agosto abaixo dos 18 °C. Na passagem pela praia para a Baía dos Tigres, as calemas do cacimbo podem fechar o caminho.",
    resumo:
      "Da cidade de Moçâmedes ao Tômbwa por uma das melhores estradas do país, e depois areia: a Lagoa dos Arcos e o Parque Nacional do Iona.",
    descricao: [
      "Moçâmedes, a antiga cidade do Namibe, é a porta para o deserto. A EN100 até ao Tômbwa, a antiga Porto Alexandre, é larga e asfaltada; depois do Tômbwa a estrada deixa de ter asfalto e, mais perto do Cunene, é terra batida.",
      "Entre as duas cidades, perto do rio Curoca, fica o Arco: um oásis com três lagoas num desfiladeiro de arenito, a do meio com arcos naturais. A água varia com os anos: em 2016 a lagoa estava seca, em 2018 voltou.",
      "Mais a sul fica o Parque Nacional do Iona, o maior e mais antigo de Angola, com 15.150 km² e 180 km de costa, gerido com a African Parks desde 2020. É o habitat principal da Welwitschia mirabilis, uma planta do deserto que pode viver centenas de anos.",
      "Em 2019, uma volta de mota de três dias entre o Lubango, o Namibe, o Iona e o Ruacana fez 1.292 km, 750 dos quais fora de estrada. O conselho do guia: ir preparado para quatro dias, com logística, combustível e material de campismo.",
    ],
    distancias: [
      { texto: "Moçâmedes a Tômbwa: cerca de 93 a 95 km, cerca de 1 hora", fonte: 1 },
      { texto: "Arco: desvio à direita 13 km depois da ponte do rio Curoca, vindo do Tômbwa, e depois picada", fonte: 2 },
      { texto: "Parque Nacional do Iona: cerca de 200 km de Moçâmedes", fonte: 6 },
    ],
    destaques: ["Lagoa dos Arcos", "Tômbwa", "Parque Nacional do Iona", "Welwitschia mirabilis"],
    dicas: [
      "Na areia e na picada do Arco, baixe a pressão dos pneus e não vá sozinho.",
      "Não saia dos trilhos para fotografar welwitschias: ainda há zonas com minas, e as plantas não se pisam nem se tocam.",
      "Para o Iona leve combustível, toda a água e material de campismo, e contacte antes o INBAC ou a African Parks sobre a entrada.",
      "O caminho pela praia até à Baía dos Tigres depende das marés: só com guia local e tabela de marés, nunca a solo.",
      "Em 2026 houve falta de combustível em postos do Namibe. Abasteça em Moçâmedes e no Tômbwa sempre que puder.",
    ],
    imagem: "dakar",
    fontes: [F.wikiMocamedes, F.ptEN100, F.landersCosta, F.arcos, F.arcosVer, F.wikiIona, F.inbacIona, F.welwitschia, F.got2Tigres, F.aventuraMoto, F.combustivel, F.wikiEN100],
  },
  {
    slug: "costa-de-benguela",
    nome: "Costa de Benguela",
    subtitulo: "Baías, morros e a Restinga do Lobito",
    regiao: "Benguela",
    provincias: ["Benguela"],
    partida: "Benguela",
    piso: "Asfalto e terra",
    pisoDetalhe:
      "Estrada do litoral em bom estado até à Baía Farta; o roteiro das praias do sul mistura estrada e picadas, com tracção precisa no Morro da Caotinha.",
    exigencia: "Média",
    exigenciaPorque: "Fácil no asfalto; as picadas para as praias pedem mota alta e alguma experiência em terra.",
    melhorEpoca:
      "Chove pouco (354 mm por ano no Lobito), sobretudo entre Novembro e Fevereiro, a época das chuvas no Sul. Depois de chover, confirme o estado das picadas.",
    resumo:
      "As praias a sul de Benguela, da Caotinha à Baía Farta, e a Restinga do Lobito, a faixa de areia que fecha a baía.",
    descricao: [
      "A sul de Benguela, a estrada do litoral leva às praias da Caotinha, da Caota, da Baía Azul, com 3 km de areia e considerada a mãe das praias de Benguela, e à Baía Farta. O roteiro oficial das praias do sul segue até à Macaca, ao Chamume e ao Chiome e não tem entradas pagas.",
      "A norte fica o Lobito, pela EN100. A Restinga do Lobito é a faixa de areia que fecha a baía, com casas e praias, e chega-se lá por boa estrada.",
    ],
    distancias: [
      { texto: "Baía Farta: cerca de 25 km de Benguela", fonte: 0 },
      { texto: "Caotinha: 10 km de Benguela", fonte: 2 },
      { texto: "Lobito: cerca de 30 km a norte de Benguela", fonte: 5 },
    ],
    destaques: ["Morro do Sombreiro", "Caotinha e Caota", "Baía Azul", "Baía Farta", "Restinga do Lobito"],
    dicas: [
      "O roteiro das praias do sul pede viatura alta, e no Morro da Caotinha é preciso tracção.",
      "Leve água para o dia todo e confirme o tempo e o estado das estradas antes de sair.",
      "Entre Benguela e o Lobito há controlos policiais com radar (relato de 2022).",
      "Em 2026 houve falta de combustível em postos de Benguela. Abasteça na cidade antes de ir para as praias.",
    ],
    imagem: "carlos-samba",
    fontes: [F.redeBaiaFarta, F.baiaAzul, F.caotinha, F.praiasSul, F.restinga, F.landersCosta, F.wikiBenguela, F.wikiLobito, F.geografia, F.combustivel],
  },
  {
    slug: "estrada-da-costa",
    nome: "A estrada da costa: de Luanda ao Sul",
    subtitulo: "A grande viagem pela EN100",
    regiao: "Luanda · Cuanza Sul · Benguela · Namibe",
    provincias: ["Luanda", "Cuanza Sul", "Benguela", "Namibe", "Huíla"],
    partida: "Luanda",
    piso: "Asfalto e terra",
    pisoDetalhe:
      "Luanda a Lobito é asfalto, com vários buracos. Entre Benguela e Moçâmedes, pela Lucira, o estado é incerto: dado como asfaltado entre 2020 e 2021, mas com 85 km de terra batida num relato de 2022. A alternativa é subir ao Lubango e descer pela Serra da Leba.",
    exigencia: "Exigente",
    exigenciaPorque: "Vários dias de estrada, troços com buracos, combustível incerto no Sul e um troço de estado por confirmar.",
    melhorEpoca:
      "De Maio a Setembro, o cacimbo: seco na costa e no Sul, com nevoeiro de manhã no litoral que costuma levantar por volta das 11h.",
    resumo:
      "A viagem de vários dias ao longo do Atlântico: Luanda, Sumbe, Lobito, Benguela e, para quem tiver fôlego, Moçâmedes e o Lubango.",
    descricao: [
      "A EN100 tem 1.858 km, de Massabi, em Cabinda, até à foz do Cunene, e é a espinha dorsal de uma viagem de mota pelo litoral. De Luanda ao Lobito são cerca de 510 km, seis a sete horas em asfalto com vários buracos, passando pelo Sumbe, 180 km a norte do Lobito.",
      "Entre Benguela e Moçâmedes o traçado pela costa passa pela Lucira. As fontes não batem certo sobre o estado do asfalto, por isso confirme antes de ir. A alternativa conhecida é pelo interior: subir ao Lubango e descer ao Namibe pela Serra da Leba.",
      "Em 2025, um ciclista que fez Luanda, Benguela, Lobito, Namibe e a Serra da Leba descreveu muito bom alcatrão na costa, nevoeiro de manhã, vento à tarde e água engarrafada à venda em todo o lado.",
    ],
    distancias: [
      { texto: "Luanda a Lobito: cerca de 510 km, 6 a 7 horas", fonte: 1 },
      { texto: "Sumbe: 180 km a norte do Lobito", fonte: 1 },
      { texto: "Benguela a Moçâmedes pelo Lubango: cerca de 360 km, 5h30 (relato de 2022)", fonte: 1 },
    ],
    destaques: [
      "Miradouro da Lua, Barra do Kwanza e Cabo Ledo no primeiro dia",
      "Sumbe e a costa do Cuanza Sul",
      "Lobito e Benguela",
      "Serra da Leba, na volta pelo interior",
    ],
    dicas: [
      "Em Junho de 2026 a Sonangol admitiu constrangimentos em postos de Benguela, Huíla e Namibe, e em Agosto o ministro falou numa situação de combustível preocupante. Abasteça sempre que puder e leve reserva.",
      "O troço Cabo Ledo a Ramiros teve acidentes graves recentes. Rode de dia e em grupo compacto.",
      "Planeie etapas curtas e chegue antes de escurecer: fora das cidades os socorros demoram e os cuidados de saúde são limitados.",
    ],
    imagem: "gala",
    fontes: [F.ptEN100, F.landersCosta, F.wikiEN100, F.t4a, F.combustivel, F.combustivel2, F.en100Obras, F.fcdo, F.fcdoSaude],
  },
];

export const lerRota = (slug: string) => ROTAS.find((r) => r.slug === slug);

/** Quando ir, por região, para a tabela da página das rotas. */
export const CLIMA_POR_REGIAO: { regiao: string; seco: string; chuva: string; nota: string; fonte: FonteRota }[] = [
  {
    regiao: "Luanda e costa norte",
    seco: "Maio a Outubro",
    chuva: "Março e Abril",
    nota: "Nevoeiro frequente no cacimbo.",
    fonte: F.wikiLuanda,
  },
  {
    regiao: "Huíla (Leba, Tundavala)",
    seco: "Junho a Agosto",
    chuva: "Dezembro a Março",
    nota: "Mínimas perto dos 8 °C em Julho; geada rara.",
    fonte: F.wikiLubango,
  },
  {
    regiao: "Malanje (Kalandula)",
    seco: "Maio a Setembro",
    chuva: "Outubro a Abril",
    nota: "Mais caudal nas quedas quando chove.",
    fonte: F.wikiMalanje,
  },
  {
    regiao: "Namibe",
    seco: "Quase todo o ano",
    chuva: "Muito pouca (cerca de 51 mm/ano)",
    nota: "Julho e Agosto abaixo dos 18 °C.",
    fonte: F.wikiMocamedes,
  },
  {
    regiao: "Sul em geral",
    seco: "Maio a Outubro",
    chuva: "Novembro a cerca de Fevereiro",
    nota: "No norte, a chuva vai de Setembro a Abril.",
    fonte: F.geografia,
  },
];

/** Lista para "Planear uma viagem de mota". Cada grupo diz de onde vem. */
export const CHECKLIST_VIAGEM: { grupo: string; itens: string[]; fontes: FonteRota[] }[] = [
  {
    grupo: "Documentos",
    itens: [
      "Carta de condução da categoria certa: A para mais de 125 cm³ (a partir dos 18 anos), A1 até 125 cm³ (a partir dos 16).",
      "Documentos da mota e seguro, sempre à mão: os controlos policiais são frequentes.",
      "Estrangeiros: passaporte válido e Licença Internacional de Condução junto com a carta do seu país.",
    ],
    fontes: [F.cartas, F.fcdo],
  },
  {
    grupo: "Mota e equipamento",
    itens: [
      "Capacete homologado e apertado, para condutor e passageiro: é obrigatório.",
      "Revisão antes de sair: pneus, travões, corrente, óleo e luzes.",
      "Kit de furos, ferramentas básicas e cintas para a bagagem.",
      "Na areia, baixe a pressão dos pneus e volte a enchê-los antes do asfalto.",
    ],
    fontes: [F.codigo, F.landersCosta],
  },
  {
    grupo: "Combustível e água",
    itens: [
      "Abasteça sempre que puder: em 2026 houve falta de combustível em postos de Benguela, Huíla e Namibe.",
      "Leve reserva de combustível para troços isolados, como o Iona ou o deserto.",
      "Água para o dia todo. Nas estradas principais há água engarrafada à venda; no deserto não há.",
    ],
    fontes: [F.combustivel, F.aventuraMoto, F.t4a],
  },
  {
    grupo: "Segurança",
    itens: [
      "Não conduza de noite fora das cidades.",
      "Fique em estradas e trilhos bem marcados: ainda há minas em algumas zonas, e as cheias podem deslocá-las.",
      "Diga a alguém o percurso e a hora prevista de chegada.",
      "Emergência: 112. Fora de Luanda os cuidados de saúde são limitados; faça um seguro que cubra repatriamento.",
      "Repelente: há risco de malária e dengue.",
    ],
    fontes: [F.fcdo, F.fcdoSaude, F.minas],
  },
  {
    grupo: "Em grupo",
    itens: [
      "Combine antes o ritmo, as paragens e quem abre e quem fecha o grupo.",
      "Fora dos grandes centros, viaje com pelo menos mais uma mota ou viatura.",
      "Guarde distância de segurança e não ultrapasse em curva nem em lomba.",
    ],
    fontes: [F.fcdo],
  },
];

/** Regras da estrada que interessam a quem viaja de mota. */
export const REGRAS_ESTRADA: { texto: string; fonte: FonteRota }[] = [
  { texto: "Conduz-se pela direita.", fonte: F.codigo },
  { texto: "Capacete obrigatório para condutor e passageiro (art. 81.º).", fonte: F.codigo },
  {
    texto:
      "Limites para motociclos acima de 50 cm³: 60 km/h nas localidades, 90 km/h nas restantes vias, 100 km/h nas vias reservadas e 120 km/h nas auto-estradas (art. 27.º).",
    fonte: F.codigo,
  },
];
