/* ============================================================
   MOTOBOX — As oito rotas, como se escrevem

   Cada troço vai de uma paragem à seguinte; os quilómetros, os
   minutos e as altitudes não se escrevem aqui: vêm do cálculo em
   lib/rotas-tracados.ts (OSRM e SRTM), e lib/rotas.ts junta tudo
   e confirma que as paragens batem certo.

   Mudar uma paragem obriga a gerar outra vez o cálculo.
   ============================================================ */

import type { RotaBase, TrocoBase } from "@/lib/rotas";
import { F, fx, lugar, osm, ponto, wikidata } from "@/lib/rotas-fontes";

const troco = (dia: number, piso: TrocoBase["piso"], estrada: string, ver: string, aviso: string | undefined, ...fontes: TrocoBase["fontes"]): TrocoBase => ({
  dia,
  piso,
  estrada,
  ver,
  aviso,
  fontes,
});

/* Lugares que se repetem entre rotas. */
const LUANDA = { nome: "Luanda (Marginal)", lat: -8.81047, lng: 13.23216, fonte: osm("way/616633664") };
const LUBANGO = { nome: "Lubango (Sé Catedral)", lat: -14.91624, lng: 13.49821, fonte: osm("way/423643091") };
const MOCAMEDES = { nome: "Moçâmedes", lat: -15.19506, lng: 12.14581, fonte: osm("node/331386368") };
const MIRADOURO_LUA = { nome: "Miradouro da Lua", lat: -9.22117, lng: 13.08983, fonte: osm("node/4263719035") };
const MIRADOURO_LEBA = { nome: "Miradouro da Leba", lat: -15.07679, lng: 13.23488, fonte: osm("node/2266863069") };

const HOSPITAL_LUBANGO = lugar(
  "Hospital Central do Lubango Dr. António Agostinho Neto",
  "Lubango, Rua do Hospital",
  "O hospital universitário da cidade; recebeu as vítimas do acidente da Leba em 2025.",
  F.ptLubango,
  osm("way/781669957"),
  F.jaLebaAcidente,
);
const HOSPITAL_NAMIBE = lugar(
  "Hospital Provincial Ngola Kimbanda",
  "Moçâmedes, Rua Guerrilheiro Faria",
  "Com urgência, segundo o OpenStreetMap.",
  osm("way/276950649"),
);
const HOSPITAIS_LUANDA_SUL = [
  lugar("Hospital Geral do Ramiros", "Ramiros, junto à EN100", "O hospital mais perto da estrada da costa a sul de Luanda.", osm("way/702554529")),
  lugar("Hospital Geral de Luanda", "Camama, Luanda", "", osm("way/60355326")),
];

const DORMIR_LUBANGO = lugar(
  "Hotel Serra da Chela, Pululukwa Resort, Hotel Chik-Chik e outros",
  "Lubango",
  "O directório oficial da Huíla lista também o Kimbo do Soba, o Mumba Lodge e o Hotel VIP Huíla. O Casper Resort tem site próprio.",
  F.visiteHuilaAlojamento,
  F.casper,
);
const DORMIR_MOCAMEDES = lugar(
  "Hotel Chik Chik, Hotel Yona, Viva Executive, Maweza e Liopa",
  "Moçâmedes",
  "Do directório da Destino Namibe. Na praia Amélia, o Lodge Vila Doroteia (relato de 2022).",
  F.destinoNamibeAlojamento,
  F.landersCosta,
);
const COMER_MOCAMEDES = lugar(
  "Restaurante Liopa, Clube Náutico e Café Girassol",
  "Moçâmedes",
  "Citados em relatos de 2022 e 2025.",
  F.rok,
  F.landersCosta,
);

const REDE_SEM_DADOS = fx(
  "Não encontrámos dados publicados de cobertura ao longo desta estrada. Descarregue o mapa e o GPX antes de sair e combine pontos de encontro.",
);

const PORTAGEM_KWANZA = fx(
  "Portagem na ponte do Kwanza: desde 18 de Setembro de 2026, 250 Kz para motas até 125 cm³ e 500 Kz acima de 125 cm³ (os ligeiros pagam 1.500 Kz), em dinheiro ou por meios automáticos. Leve dinheiro trocado.",
  F.portagens2026,
  F.rnaPortagens,
);

const NOITE = fx(
  "Fora das cidades não se conduz de noite: há buracos, peões e animais na estrada, condutores alcoolizados e veículos sem luzes.",
  F.eua,
  F.fcdo,
);

export const BASE: RotaBase[] = [
  /* ================================================================
     1. SERRA DA LEBA
     ================================================================ */
  {
    slug: "serra-da-leba",
    nome: "Serra da Leba",
    subtitulo: "A estrada das curvas, do planalto ao deserto",
    regiao: "Huíla · Namibe",
    provincias: ["Huíla", "Namibe"],
    partida: "Lubango",
    piso: "Asfalto",
    pisoDetalhe:
      "Tudo em asfalto pela EN-280, mas com buracos entre o Caraculo e a serra (2025), marcas apagadas e rails danificados na descida. O troço da serra é estreito e tem pouca protecção lateral.",
    exigencia: "Exigente",
    exigenciaPorque: "Ganchos seguidos, estrada estreita com poucos rails e camiões a subir e a descer; perigosa com nevoeiro, chuva ou de noite.",
    melhorEpoca: "Junho a Agosto: no Lubango quase não chove. As chuvas mais fortes caem de Dezembro a Março, e em Novembro já há nevoeiro intenso na serra.",
    epocaCurta: "Jun–Ago",
    resumo:
      "A descida em ziguezague que liga o planalto da Huíla ao deserto do Namibe, do Lubango a Moçâmedes. Uma das estradas mais fotografadas de Angola.",
    descricao: [
      "A Serra da Leba fica no limite entre a Huíla e o Namibe e é conhecida pela estrada em ziguezague que desce do planalto em direcção ao deserto. Faz parte da EN-280, a ligação entre o Lubango, a Humpata, o Caraculo e Moçâmedes, e o troço sinuoso tem cerca de 20 km.",
      "O troço em S foi desenhado pelo engenheiro Edgar Cardoso. Numa só subida ou descida atravessam-se três a quatro zonas de clima diferentes, do fresco do planalto ao calor da base, e desce-se cerca de 1.000 m.",
      "O melhor ponto para ver a estrada inteira é o Miradouro da Leba. Na época das chuvas, um rio subterrâneo termina numa cascata escondida na serra.",
      "A rota faz-se num dia: sobe-se do Lubango ao planalto da Humpata, passa-se o miradouro, desce-se a serra e atravessa-se a planície do Caraculo até ao mar, em Moçâmedes. Dali segue-se para o deserto do Namibe.",
    ],
    distancias: [
      { texto: "Miradouro: cerca de 50 km do Lubango", fonte: F.redeLeba },
      { texto: "Troço sinuoso: cerca de 20 km e 1.000 m de desnível", fonte: F.redeLeba },
      { texto: "Miradouro da Leba: 20 km da sede da Humpata", fonte: F.visiteLeba },
      { texto: "Lubango–Namibe: 186 km no GPS de um viajante (2022)", fonte: F.soulTonic9 },
    ],
    destaques: [
      "Miradouro da Leba, com a estrada inteira à vista",
      "A descida em ganchos do planalto para o deserto",
      "O planalto da Humpata, a quase 2.000 m",
      "Cascata escondida, na época das chuvas",
    ],
    dicas: [
      "A estrada é estreita e tem pouca protecção lateral, e já houve muitos acidentes graves. Desça devagar, em mudança baixa, e não ultrapasse nas curvas.",
      "Evite fazer a serra de noite, com chuva ou com nevoeiro.",
      "No planalto as manhãs de Junho e Julho são frias e na descida pode fazer mais de 35 °C. Leve roupa por camadas.",
      "Nos miradouros há muitas crianças a pedir doces. Pare fora da faixa de rodagem, num sítio largo.",
    ],
    fontes: [F.redeLeba, F.dangerousLeba, F.visiteLeba, F.wikiLeba, F.wikiEN280, F.nitLeba, F.got2Leba, F.t4a, F.wikiLubango],

    paragens: [
      LUBANGO,
      { nome: "Humpata", lat: -15.01036, lng: 13.37661, fonte: osm("node/1088741202") },
      MIRADOURO_LEBA,
      { nome: "Caraculo", lat: -15.0216, lng: 12.65749, fonte: osm("node/8979828364") },
      MOCAMEDES,
    ],
    trocos: [
      troco(
        1,
        "asfalto",
        "EN-280 a sair do Lubango, a subir a Serra da Chela até ao planalto da Humpata.",
        "O Miradouro da Boca da Humpata, sobre o Lubango, e o ponto mais alto da estrada, perto dos 2.040 m.",
        "Há controlo policial à saída do Lubango (relatos de 2022 e 2025): documentos à mão.",
        osm("node/2266863070"),
        F.srtm,
        F.africa4x4ep6,
      ),
      troco(
        1,
        "asfalto",
        "EN-280 pelo planalto da Humpata até ao alto da serra.",
        "O planalto da Humpata, a cerca de 1.940 m, e o miradouro da Leba no fim.",
        "Abasteça na Humpata: é o último posto mapeado antes da descida, e o seguinte, no Caraculo, fica a cerca de 99 km e não confirmámos que funcione.",
        F.ptHumpata,
        osm("way/944907361"),
        osm("way/645245523"),
      ),
      troco(
        1,
        "buracos",
        "A descida da Leba: cerca de 20 km de ganchos estreitos e 1.000 m de desnível, até perto dos 700 m; depois, estrada direita pela planície até ao Caraculo.",
        "O ziguezague visto de cima, três a quatro zonas de clima na mesma descida e, em baixo, o princípio do deserto.",
        "Em 7 de Abril de 2026 a Administração da Bibala interditou temporariamente a circulação na serra depois de um incidente, e não encontrámos notícia da reabertura: confirme antes de sair. Em Julho de 2025 a polícia avisou que faltam marcas na estrada e há rails danificados; há camiões a subir e a descer o dia todo e queda de pedras.",
        F.jaLebaFechada,
        F.jaLebaPolicia,
        F.redeLeba,
        F.coimbraLeba,
        F.soulTonic9,
        F.srtm,
      ),
      troco(
        1,
        "asfalto",
        "EN-280 pela planície do deserto, do Caraculo a Moçâmedes, em bom estado (2025).",
        "Planície pedregosa e mesas de rocha; o mar aparece à chegada a Moçâmedes.",
        "No Caraculo não saia do asfalto em direcção ao Virei: é areia funda, e de noite é pior (relato de Setembro de 2026).",
        F.soulTonic9,
        F.rideMeFive,
      ),
    ],
    dias: 1,
    diasNota: fx(
      "Um dia, com tempo para o miradouro e para almoçar em Moçâmedes. Há quem faça ida e volta no mesmo dia (em 2024 um grupo de motas fez Tundavala, Leba e almoço no Namibe em 460 km), mas o melhor é dormir em Moçâmedes e seguir para o deserto do Namibe.",
      F.mozAdventure,
    ),
    horario: [
      {
        titulo: "Lubango, Leba e Moçâmedes",
        passos: [
          { hora: "07:30", texto: "Saída do Lubango, de depósito cheio e com roupa quente: no planalto as manhãs são frias." },
          { hora: "08:00", texto: "Miradouro da Boca da Humpata, sobre a cidade." },
          { hora: "08:30", texto: "Humpata: último posto mapeado antes da descida. Abasteça." },
          { hora: "09:00", texto: "Miradouro da Leba. Na época seca pode haver um mar de nevoeiro no vale ao nascer do dia (relato de 2022)." },
          { hora: "09:45", texto: "Descida da serra, devagar, com paragens só em sítios largos." },
          { hora: "11:30", texto: "Caraculo." },
          { hora: "12:30", texto: "Chegada a Moçâmedes e almoço. Tarde livre na cidade e na marginal." },
        ],
      },
    ],
    clima: "lubango",
    combustivel: [
      fx(
        "Lubango: vários postos mapeados, entre eles a Sonangol da Rua 1.º de Agosto, a Sonangol da Praça 1.º de Maio, junto à Sé, e a Pumangol do Cristo Rei.",
        osm("node/2489117237"),
        osm("way/820001159"),
        osm("way/778522119"),
      ),
      fx("A caminho da Humpata, ao km 9: Pumangol.", osm("way/943141079")),
      fx("Humpata, ao km 23: Sonangol, o último posto mapeado antes da descida.", osm("way/944907361")),
      fx("Caraculo, ao km 122: as Bombas do Caraculo, da Sonangol. Não confirmámos que estejam a funcionar.", osm("way/645245523")),
      fx(
        "Moçâmedes: Sonangol no Tambor e junto ao Shoprite, TotalEnergies do Cainde e Pumangol, esta marcada como aberta 24 horas.",
        osm("way/1004417259"),
        osm("way/761952380"),
        osm("node/10621497302"),
        osm("way/1005782675"),
      ),
      fx(
        "Em Setembro de 2025 as filas no Lubango passavam dos dois quilómetros, em Abril de 2026 a Huíla esteve vários dias sem combustível e em Agosto de 2026 voltou a haver filas. Em 2025 houve quem abastecesse em Moçâmedes por causa das filas no Lubango.",
        F.jaFilasLubango,
        F.filasHuila,
        F.africa4x4ep6,
      ),
    ],
    semCombustivel: fx(
      "Cerca de 99 km entre a Humpata e o Caraculo. Se o posto do Caraculo estiver fechado, são cerca de 158 km até Moçâmedes.",
      osm("way/944907361"),
      osm("way/645245523"),
      F.osrm,
    ),
    comer: [
      lugar("Mercado municipal", "Humpata", "Churrasco no mercado, segundo uma reportagem de 2025.", F.jaHumpata),
      lugar(
        "Miradouro da Leba",
        "No alto da serra",
        "Há uma pousada com restaurante mapeada no miradouro, mas em Março de 2024 não havia café aberto: não conte com comida aqui. Em 2025 havia vendedores de fruta no controlo da Leba.",
        osm("node/2266863071"),
        F.tripLeba,
        F.jaLebaAcidente,
      ),
      COMER_MOCAMEDES,
    ],
    dormir: [
      DORMIR_LUBANGO,
      lugar("Zoom's Lodge", "Humpata, na EN-280", "Do directório oficial da Huíla.", F.zoomsLodge),
      DORMIR_MOCAMEDES,
    ],
    saude: [
      HOSPITAL_LUBANGO,
      lugar(
        "Hospital Municipal da Humpata",
        "Humpata",
        "As ambulâncias acudiram ao acidente da Leba em 2025. Não encontrámos a localização exacta.",
        F.jaLebaAcidente,
      ),
      HOSPITAL_NAMIBE,
    ],
    perigos: [
      fx(
        "A serra fecha quando há acidentes: em Abril de 2026 foi interditada temporariamente, em Novembro de 2024 esteve cerca de 8 horas fechada depois de um camião tombar com nevoeiro intenso, e em Julho de 2025 um autocarro chocou com um camião na descida, com pelo menos 15 mortos.",
        F.jaLebaFechada,
        F.jaLebaNevoeiro,
        F.jaLebaAcidente,
      ),
      fx(
        "No Namibe, de Janeiro a Junho de 2025, o tipo de acidente mais frequente foi a colisão entre carro e mota (84 de 176).",
        F.jaLebaPolicia,
      ),
      fx(
        "A instabilidade mais frequente na serra é a queda de pedras, sobretudo na época das chuvas, de Outubro a Abril.",
        F.coimbraLeba,
        F.tripLeba,
      ),
      fx(
        "Há posto de controlo à entrada da Leba. Gado solto na estrada: cabras, vacas e porcos, segundo quem lá passou de mota em 2023.",
        F.jaLebaAcidente,
        F.dosRuedas,
      ),
      NOITE,
    ],
    licencas: [
      fx("Não encontrámos taxa no miradouro da Leba (relato de Março de 2024).", F.tripLeba),
      fx(
        "Em Maio de 2026 foram autorizadas obras de emergência para conter ravinas em progressão na Serra da Leba, e em Junho mais de 49 milhões de dólares para miradouros, estacionamento e casas de banho na Leba, na Tundavala e em Calandula: conte com obras e desvios.",
        F.jaLebaRavinas,
        F.jaMiradouros,
      ),
      fx(
        "Em 2022 pagava-se uma portagem de 150 Kz na Serra da Leba. O novo regime de portagens de 2026 começou só na Barra do Kwanza, no Luvo e no Nóqui: leve trocos de qualquer forma.",
        F.landersDicas,
        F.rnaPortagens,
      ),
    ],
    rede: [fx("Não encontrámos relatos de cobertura na descida da Leba. Descarregue o mapa e o GPX antes de sair.")],
    motas: [
      fx(
        "Qualquer mota de estrada em bom estado: é tudo asfalto, mas com buracos entre o Caraculo e a serra. Travões e pneus em dia: são 1.000 m de descida em 20 km.",
        F.redeLeba,
        F.soulTonic9,
      ),
      fx("Quem quiser seguir para o Arco ou para o Iona precisa de uma trail com pneus mistos.", F.arcos),
    ],
    levar: [
      "Roupa por camadas: frio no planalto, calor no deserto.",
      "Viseira limpa e luzes a funcionar, para o nevoeiro.",
      "Água para a descida e para o troço do Caraculo.",
    ],
    agua: fx(
      "1,5 a 2 litros por pessoa. No planalto faz fresco de manhã, mas na descida e no deserto pode passar dos 35 °C, e no miradouro não há onde comprar.",
      F.got2Leba,
      F.tripLeba,
    ),
    grupo: fx(
      "Faz-se de dia sem grande isolamento: há postos e povoações. Em grupo, desçam espaçados, sem ultrapassar, e reagrupem em baixo, num sítio largo.",
      F.redeLeba,
    ),
    pontos: [
      ponto("Miradouro da Boca da Humpata", -14.9446, 13.48159, "Vista sobre o Lubango, na subida para a Humpata.", osm("node/2266863070")),
      ponto("Miradouro da Leba", -15.07679, 13.23488, "O ponto clássico para ver o ziguezague inteiro.", osm("node/2266863069"), F.visiteLeba),
      ponto(
        "Fim dos ganchos",
        -15.0406,
        13.1986,
        "Aqui acabam as curvas apertadas, a cerca de 720 m de altitude (estimativa pelo modelo SRTM).",
        F.srtm,
      ),
      ponto("Bombas do Caraculo", -15.02139, 12.65692, "Posto da Sonangol junto ao Posto Experimental do Caraculo.", osm("way/645245523")),
    ],
  },

  /* ================================================================
     2. TUNDAVALA
     ================================================================ */
  {
    slug: "tundavala",
    nome: "Fenda da Tundavala",
    subtitulo: "Onde o planalto acaba de repente",
    regiao: "Huíla",
    provincias: ["Huíla"],
    partida: "Lubango",
    piso: "Asfalto",
    pisoDetalhe:
      "Asfalto pela EN 280-5, a estrada sem saída da Tundavala, reabilitada. Perto do fim o asfalto dá lugar a calçada de pedra, e o desvio para a cascata é de terra.",
    exigencia: "Tranquila",
    exigenciaPorque: "Boa estrada e perto da cidade; o cuidado maior é o nevoeiro e a borda da escarpa.",
    melhorEpoca:
      "Junho a Agosto, a época seca. Na época das chuvas vá de manhã: ao almoço as nuvens costumam tapar a fenda. Na época seca há neblina de manhã e o fim da tarde é mais limpo.",
    epocaCurta: "Jun–Ago",
    resumo:
      "Uma escarpa de mais de mil metros no fim do Planalto Central, a cerca de 20 km do Lubango, com o Cristo Rei e a Senhora do Monte pelo caminho. Uma das 7 Maravilhas Naturais de Angola.",
    descricao: [
      "Na Tundavala o Planalto Central acaba de repente: a escarpa cai de mais de 2.200 m de altitude para cerca de 1.000 m. Foi declarada paisagem cultural em 2012 e é uma das 7 Maravilhas Naturais de Angola, eleitas em 2014.",
      "A estrada a partir do Lubango é sem saída e foi reabilitada, pelo que se faz com facilidade. Não se paga entrada, há estacionamento junto aos miradouros e um restaurante junto à cascata, mas poucos outros serviços e pouca iluminação.",
      "No alto da Serra da Chela fica o Cristo Rei do Lubango, uma estátua de 30 m inaugurada em 1957, a 2.130 m. A volta junta-o à capela da Senhora do Monte, sobre a cidade, e à cascata da Tundavala.",
    ],
    distancias: [
      { texto: "Cerca de 18 a 20 km do Lubango", fonte: F.redeTundavala },
      { texto: "18 km do Lubango", fonte: F.visiteTundavala },
    ],
    destaques: [
      "Os dois miradouros sobre a escarpa",
      "Cristo Rei do Lubango, na Serra da Chela",
      "Capela e parque da Senhora do Monte",
      "Cascata da Tundavala, com cerca de 22 m, junto à barragem",
    ],
    dicas: [
      "A névoa aparece muitas vezes. Com pouca visibilidade, abrande e leve as luzes ligadas.",
      "Em Julho as mínimas no Lubango andam pelos 8 °C e em Junho e Julho pode haver geada. Leve roupa quente para a manhã.",
      "Cuidado na calçada do fim da estrada, sobretudo com humidade.",
      "Há poucos serviços e pouca iluminação: planeie voltar antes de escurecer.",
      "Não acampe sozinho na borda: houve assaltos a campistas em 2023, e em 2025 um grupo de viajantes achou que não era seguro.",
    ],
    fontes: [F.wikiTundavala, F.ptTundavala, F.redeTundavala, F.visiteTundavala, F.wikivoyageLubango, F.maravilhas, F.cristoRei, F.cristoReiEn, F.wikiLubango],

    paragens: [
      LUBANGO,
      { nome: "Cristo Rei", lat: -14.94017, lng: 13.51166, fonte: osm("node/7848166501") },
      { nome: "Senhora do Monte", lat: -14.9401, lng: 13.46528, fonte: osm("way/456053822") },
      { nome: "Miradouro da Tundavala", lat: -14.81709, lng: 13.38196, fonte: osm("node/2266863076") },
      { nome: "Cascata da Tundavala", lat: -14.84373, lng: 13.40586, fonte: osm("node/7188061667") },
      LUBANGO,
    ],
    trocos: [
      troco(
        1,
        "asfalto",
        "Sai-se pela estrada da Humpata e, no alto da Chela, vira-se para leste até ao Cristo Rei.",
        "O Cristo Rei, de 1957, a 2.130 m, com o Lubango lá em baixo.",
        undefined,
        F.cristoReiEn,
        F.cristoRei,
      ),
      troco(1, "asfalto", "De volta à cidade até ao parque da Senhora do Monte.", "A capela e o parque da Senhora do Monte, sobre a cidade.", undefined, osm("way/456053822")),
      troco(
        1,
        "asfalto",
        "EN 280-5, a estrada sem saída da Tundavala, reabilitada e em bom estado; perto do fim, calçada.",
        "O planalto a subir até mais de 2.200 m e, no fim, os dois miradouros sobre a escarpa.",
        "O nevoeiro aparece muitas vezes e esconde o precipício: com pouca visibilidade, abrande e ligue as luzes. Não encontrámos informação sobre protecções na borda: não se aproxime dela.",
        F.redeTundavala,
        F.wikiTundavala,
      ),
      troco(
        1,
        "terra",
        "De volta pela EN 280-5 e, uns 4 km antes do fim, o desvio de terra para a cascata.",
        "A cascata da Tundavala, com cerca de 22 m, junto à barragem e ao restaurante.",
        undefined,
        F.visiteCascata,
        osm("way/217418601"),
      ),
      troco(1, "asfalto", "Regresso ao Lubango pela EN 280-5.", "A descida do planalto para a cidade.", undefined, osm("way/369456363")),
    ],
    dias: 1,
    diasNota: fx("Meio dia chega: são cerca de 73 km. Junte-lhe a Serra da Leba no dia seguinte, ou no mesmo dia, como fez um grupo de motas em 2024.", F.mozAdventure),
    horario: [
      {
        titulo: "Cristo Rei, Senhora do Monte e Tundavala",
        passos: [
          { hora: "09:00", texto: "Saída do Lubango." },
          { hora: "09:30", texto: "Cristo Rei e o miradouro sobre a cidade." },
          { hora: "10:30", texto: "Senhora do Monte." },
          { hora: "11:30", texto: "Tundavala: os dois miradouros. Na época das chuvas não deixe para mais tarde: ao almoço as nuvens costumam fechar a fenda." },
          { hora: "13:00", texto: "Almoço no Restaurante Tundavala, junto à cascata (buffet a partir das 13h em 2017)." },
          { hora: "14:45", texto: "Regresso ao Lubango." },
        ],
      },
    ],
    clima: "lubango",
    combustivel: [
      fx(
        "Só no Lubango: o mais perto da saída é a Pumangol do Cristo Rei; na Avenida do Estádio Nacional da Tundavala há mais dois postos mapeados. Na estrada da Tundavala não há posto.",
        osm("way/778522119"),
        osm("node/10931319820"),
        osm("way/957559668"),
      ),
      fx(
        "Em 2025 e 2026 houve filas e falta de combustível no Lubango: abasteça na véspera.",
        F.jaFilasLubango,
        F.filasHuila,
      ),
    ],
    semCombustivel: fx("Nenhum problema: a volta tem cerca de 73 km e começa e acaba no Lubango.", F.osrm),
    comer: [
      lugar(
        "Restaurante Tundavala",
        "Junto à cascata, uns 4 km antes da borda",
        "Edifício de 1963, reaberto em 2012, com cerca de 100 lugares e esplanada. Buffet ao almoço a partir das 13h (4.000 Kz em 2017). Telefone +244 923 928 811.",
        F.guiaRestTundavala,
        F.visiteTundavala,
        osm("node/7188061667"),
      ),
      lugar("Nos miradouros", "Borda da escarpa", "Não há onde comer: leve o que comer e água. Há vendedoras de artesanato no alto.", F.redeTundavala, F.wikivoyageLubango),
    ],
    dormir: [
      DORMIR_LUBANGO,
      lugar(
        "Parque de Campismo da Tundavala",
        "Tundavala",
        "Gerido pela EPAS, telefone +244 941 901 100. Houve assaltos a campistas em 2023: não acampe isolado.",
        osm("node/4792946826"),
        F.rogue,
      ),
      lugar(
        "Hotel novo junto à fenda",
        "Tundavala",
        "Em Agosto de 2026 estava em fase de conclusão um hotel de 46 quartos, com restaurante panorâmico. Não encontrámos o nome nem a data de abertura.",
        F.jaTundavalaHotel,
      ),
    ],
    saude: [
      HOSPITAL_LUBANGO,
      lugar("Clínica Sagrada Esperança", "Lubango", "Clínica privada.", F.sagradaLubango, osm("node/7683838576")),
    ],
    perigos: [
      fx("Nevoeiro frequente, que esconde o precipício. A escarpa cai cerca de 1.000 m.", F.redeTundavala, F.ptTundavala),
      fx("Pouca iluminação e poucos serviços, sem posto de primeiros socorros.", F.visiteTundavala),
      fx(
        "Houve assaltos à mão armada a campistas, de dia (relatos citados em 2023); há guardas no parque de estacionamento principal.",
        F.rogue,
        F.soulTonic10,
      ),
      fx("Frio: em Julho as mínimas no Lubango andam pelos 8 °C, e pode haver geada.", F.wikiLubango),
    ],
    licencas: [
      fx("A Tundavala é gratuita, sem portão nem portagem.", F.visiteTundavala, F.redeTundavala),
      fx("Cristo Rei: não encontrámos horário nem taxa; em 2024 a entrada da estátua estava fechada.", F.flyingFlags),
      fx(
        "Há obras previstas: miradouros, trilhos e casas de banho (Junho de 2026) e um hotel a acabar (Agosto de 2026).",
        F.jaMiradouros,
        F.jaTundavalaHotel,
      ),
    ],
    rede: [fx("Não encontrámos relatos de cobertura na Tundavala. Estando a 20 km do Lubango, descarregue de qualquer forma o mapa antes.")],
    motas: [fx("Qualquer mota: asfalto até aos miradouros. O desvio para a cascata é de terra, curto.", F.redeTundavala, osm("way/217418601"))],
    levar: [
      "Casaco quente: em Julho as mínimas andam pelos 8 °C.",
      "Luzes a funcionar e viseira limpa, para o nevoeiro.",
      "Merenda e água, se não almoçar no restaurante.",
    ],
    agua: fx("1 litro por pessoa chega para meio dia; nos miradouros não se vende nada.", F.redeTundavala),
    grupo: fx("Rota curta e perto da cidade: faz-se a solo, de dia. Não fique sozinho na borda nem a acampar.", F.rogue, F.soulTonic10),
    pontos: [
      ponto("Cristo Rei do Lubango", -14.94017, 13.51166, "Estátua de mármore de 30 m, de 1957, a 2.130 m.", osm("node/7848166501"), F.cristoReiEn),
      ponto("Capela da Senhora do Monte", -14.9401, 13.46528, "Capela e parque sobre a cidade, a cerca de 1.960 m.", osm("way/456053822"), F.srtm),
      ponto("Miradouro da Tundavala", -14.81709, 13.38196, "O miradouro principal sobre a escarpa.", osm("node/2266863076")),
      ponto("Segundo miradouro", -14.81605, 13.38065, "Ao lado do primeiro, também sobre a fenda.", osm("node/1738270245")),
      ponto("Cascata da Tundavala", -14.84228, 13.40619, "Queda de cerca de 22 m, junto ao restaurante.", osm("node/7146226878"), F.visiteCascata),
      ponto("Cascata do X", -14.84041, 13.41014, "Outra cascata, perto da primeira.", osm("node/8817843196"), F.visiteCascataX),
      ponto("Barragem da Tundavala", -14.84292, 13.43435, "Barragem do perímetro da Mapunda-Tundavala.", osm("way/369456363")),
    ],
  },

  /* ================================================================
     3. KALANDULA E PUNGO ANDONGO
     ================================================================ */
  {
    slug: "kalandula-e-pungo-andongo",
    nome: "Quedas de Kalandula e Pungo Andongo",
    subtitulo: "Duas maravilhas de Malanje na mesma viagem",
    regiao: "Malanje · Cuanza Norte",
    provincias: ["Malanje", "Cuanza Norte"],
    partida: "Luanda",
    piso: "Asfalto e terra",
    pisoDetalhe:
      "De Luanda pela EN230 por N'dalatando e Cacuso até Malanje, com muitos buracos ainda em 2026. As quedas têm acesso por estradas com buracos dos dois lados do rio; a Pousada, Musseleje e os últimos quilómetros de Pungo Andongo são de terra.",
    exigencia: "Média",
    exigenciaPorque: "Viagem longa, com buracos e camiões em vários troços e terra no fim; depois de chover, as picadas ficam com lama.",
    melhorEpoca:
      "De Maio a Setembro (cacimbo) as estradas estão secas. De Outubro a Abril chove em Malanje: as quedas têm mais caudal, mas as picadas enchem-se de lama.",
    epocaCurta: "Mai–Set",
    resumo:
      "Quedas de 105 metros no rio Lucala e as rochas gigantes onde, diz a tradição, ficaram as pegadas da Rainha Ginga. Quatro dias de Luanda a Luanda.",
    descricao: [
      "As quedas do rio Lucala, em Calandula, têm 105 m de altura e 400 a 410 m de largura, e são uma das 7 Maravilhas Naturais de Angola. Até 1975 chamavam-se Quedas do Duque de Bragança. Há um trilho para o cimo e outro para a base, e o miradouro junto à vila de Calandula é gratuito.",
      "No mesmo caminho ficam as Pedras Negras de Pungo Andongo, no município do Cacuso: grandes rochas com milhões de anos onde a tradição vê as pegadas da Rainha Ginga, e onde restam ruínas de uma fortaleza de 1671.",
      "A viagem sai de Luanda pela EN230, por Catete e Maria Teresa, sobe ao Cuanza Norte por N'dalatando e chega a Malanje pelo Cacuso. Das quedas desce-se pela EN322 ao Cacuso e daí a Pungo Andongo, antes de voltar.",
    ],
    distancias: [
      { texto: "Quedas de Kalandula: cerca de 80 km de Malanje", fonte: F.ptKalandula },
      { texto: "Malanje fica a 380 km de Luanda", fonte: F.wikiMalanje },
      { texto: "Pungo Andongo: 310 km de Luanda até ao Cacuso, mais 40 km pela EN322", fonte: F.redePungo },
      { texto: "Quedas de Musseleje: 20 km de Kalandula, 15 dos quais de picada", fonte: F.musseleje },
      { texto: "N'dalatando: 248 km de Luanda e 175 km de Malanje", fonte: F.terminusNdala },
      { texto: "Quedas–Luanda: 360 km, 420 km ou 450 km, conforme a fonte", fonte: F.wikiKalandula },
    ],
    destaques: [
      "Miradouro gratuito junto à vila de Calandula",
      "Trilhos para o cimo e para a base das quedas",
      "Pedras Negras de Pungo Andongo",
      "Quedas de Musseleje, com mais de 30 m",
      "Centro Botânico do Quilombo, em N'dalatando",
    ],
    dicas: [
      "Há troços cheios de buracos, sobretudo entre Maria Teresa e N'dalatando. Não conte com médias altas.",
      "De manhã cedo a névoa pode esconder as quedas; a meio da manhã já costuma ter levantado.",
      "Na província de Malanje há muitos controlos policiais. Leve os documentos à mão.",
      "Depois de chover, a picada para Musseleje pede 4×4, segundo quem lá foi.",
      "Pungo Andongo é terra sagrada: peça licença antes de entrar.",
    ],
    fontes: [F.ptKalandula, F.wikiKalandula, F.landersMalanje, F.got2Kalandula, F.wikiMalanje, F.redePungo, F.ptPungo, F.musseleje, F.maravilhas, F.kiandaEN230],

    paragens: [
      LUANDA,
      { nome: "Catete", lat: -9.10999, lng: 13.68955, fonte: osm("node/1417840848") },
      { nome: "N'dalatando", lat: -9.29848, lng: 14.9145, fonte: osm("node/669059480") },
      { nome: "Cacuso", lat: -9.42203, lng: 15.74067, fonte: osm("node/2204297745") },
      { nome: "Malanje", lat: -9.5484, lng: 16.34753, fonte: osm("node/279010432") },
      { nome: "Quedas de Calandula (miradouro)", lat: -9.0742, lng: 15.9993, fonte: osm("way/210412230") },
      { nome: "Pungo Andongo", lat: -9.66943, lng: 15.58918, fonte: osm("node/2123967335") },
      { nome: "N'dalatando", lat: -9.29848, lng: 14.9145, fonte: osm("node/669059480") },
      LUANDA,
    ],
    trocos: [
      troco(
        1,
        "buracos",
        "EN230, a estrada de Catete, a sair de Luanda por Viana.",
        "A saída de Luanda por Viana, com postos de combustível até ao km 39.",
        "Em 2022 o troço Luanda–Catete estava em muito mau estado, e em Fevereiro de 2026 os buracos da EN230 ainda obrigavam a andar devagar.",
        F.landersMalanje,
        F.kiandaEN230,
      ),
      troco(
        1,
        "buracos",
        "EN230 por Maria Teresa e Cambondo. Logo depois do controlo policial a seguir a Maria Teresa, fique à esquerda na EN230, para N'dalatando, e não vá para o Alto Dondo pela EN321.",
        "A subida da planície de Catete, a cerca de 40 m, até N'dalatando, entre 670 e 780 m conforme a fonte.",
        "Maria Teresa–N'dalatando é o pior troço: cerca de 100 km cheios de buracos e de camiões, que saem da faixa para fugir aos buracos (2022).",
        F.landersMalanje,
        F.srtm,
        F.wikiMalanje,
      ),
      troco(1, "asfalto", "EN230 por Lucala e Quizenga até ao Cacuso; depois de N'dalatando a estrada melhorava (2022).", "Lucala e Quizenga, ambas com posto da Sonangol.", undefined, F.landersMalanje, osm("node/6466143493"), osm("node/4799080650")),
      troco(1, "asfalto", "EN230 do Cacuso a Malanje.", "Malanje, a cerca de 1.150 m de altitude.", undefined, F.wikiMalanje),
      troco(
        2,
        "buracos",
        "EN230 para oeste até Lombe e EN225-3 para norte, por Cota, até Calandula; daí 5 km até ao miradouro da vila.",
        "As quedas do Lucala, com 105 m de altura e 400 a 410 m de largura, vistas do miradouro da vila.",
        "Estradas com buracos dos dois lados do rio (2023). Da vila à Pousada, do outro lado, os últimos quilómetros são de terra, estreitos e com falhas.",
        F.got2Kalandula,
        F.ptKalandula,
        F.wikiKalandula,
      ),
      troco(
        3,
        "buracos",
        "EN322 para sul até ao Cacuso e daí cerca de 40 km pela estrada do Alto Dondo, por M'Banza N'Dongo; vira-se à esquerda para os últimos 6 km até à aldeia.",
        "As Pedras Negras, com 200 a 250 m de altura sobre a planície (estimativa pelo modelo SRTM), e as ruínas da fortaleza de 1671.",
        "Em 2022 a estrada Cacuso–Pungo Andongo estava cheia de buracos e em muito mau estado.",
        F.landersMalanje,
        F.ptPungo,
        F.srtm,
      ),
      troco(3, "buracos", "De volta ao Cacuso pela mesma estrada e EN230 para oeste até N'dalatando.", "A estrada da manhã, ao contrário, e depois a EN230 do primeiro dia.", undefined, F.landersMalanje),
      troco(
        4,
        "buracos",
        "EN230 por Maria Teresa e Catete até Luanda.",
        "A descida do Cuanza Norte para a planície de Luanda.",
        "Saia cedo: são mais de 200 km de EN230 com buracos e camiões, e a entrada em Luanda por Viana é lenta. Em 2022 a estrada má à saída de Luanda impediu um grupo de chegar a N'dalatando antes de escurecer.",
        F.landersMalanje,
        F.kiandaEN230,
      ),
    ],
    dias: 4,
    diasNota: fx(
      "Quatro dias, a dormir em Malanje, em Calandula e em N'dalatando. Há quem faça Luanda–Malanje num dia (em Fevereiro de 2026, de Talatona a Malanje, foram 7 horas com almoço e uma paragem para abastecer), mas as estradas não deixam ganhar muito tempo.",
      F.kiandaEN230,
    ),
    horario: [
      {
        titulo: "Luanda–Malanje",
        passos: [
          { hora: "06:30", texto: "Saída de Luanda, de depósito cheio." },
          { hora: "07:50", texto: "Catete: pausa curta." },
          { hora: "08:50", texto: "Anduri, antes de Maria Teresa: Sonangol e TotalEnergies. Abasteça." },
          { hora: "10:45", texto: "N'dalatando: almoço cedo." },
          { hora: "13:00", texto: "Cacuso: abasteça outra vez." },
          { hora: "14:30", texto: "Chegada a Malanje." },
        ],
      },
      {
        titulo: "As Quedas de Calandula",
        passos: [
          { hora: "08:30", texto: "Saída de Malanje, de depósito cheio: em Calandula não há posto mapeado." },
          { hora: "10:15", texto: "Miradouro da vila. A meio da manhã a névoa costuma já ter levantado." },
          { hora: "11:00", texto: "Descida à base com um guia local (gorjeta), se o chão estiver seco." },
          { hora: "13:30", texto: "Almoço na Pousada, do outro lado do rio: moamba e peixe grelhado." },
          { hora: "15:00", texto: "Opcional: Quedas de Musseleje, 5 km de asfalto e 15 a 20 de picada. Só com tempo seco." },
          { hora: "17:00", texto: "Pousada de Calandula, para dormir (reserve antes)." },
        ],
      },
      {
        titulo: "Pungo Andongo",
        passos: [
          { hora: "08:00", texto: "Saída de Calandula pela EN322." },
          { hora: "09:30", texto: "Cacuso: abasteça." },
          { hora: "10:30", texto: "Pedras Negras de Pungo Andongo. Peça licença na aldeia antes de subir." },
          { hora: "12:30", texto: "Saída de Pungo Andongo." },
          { hora: "13:30", texto: "Almoço no Cacuso." },
          { hora: "15:30", texto: "Chegada a N'dalatando." },
        ],
      },
      {
        titulo: "N'dalatando–Luanda",
        passos: [
          { hora: "07:30", texto: "Saída de N'dalatando." },
          { hora: "09:30", texto: "Anduri: abasteça." },
          { hora: "10:30", texto: "Catete." },
          { hora: "11:30", texto: "Chegada a Luanda." },
        ],
      },
    ],
    clima: "malanje",
    combustivel: [
      fx("Luanda–Catete: Pumangol e Sonangalp em Viana (km 33 a 39) e um posto em Catete (km 61).", osm("way/638023485"), osm("way/532517020"), osm("way/744958362")),
      fx(
        "Anduri, uns 10 km antes de Maria Teresa (km 103): Sonangol e TotalEnergies. Foi aí que uma reportagem de 2026 parou para abastecer. O posto junto a Maria Teresa está marcado como desactivado.",
        osm("way/498520357"),
        osm("way/498520358"),
        osm("way/746217391"),
        F.kiandaEN230,
      ),
      fx(
        "Cambondo (km 177): TotalEnergies. N'dalatando: Pumangol e três Sonangol. Lucala e Quizenga: Sonangol. Cacuso: Sonangol.",
        osm("node/10621498288"),
        osm("way/705953854"),
        osm("node/6466143493"),
        osm("node/4799080650"),
        osm("way/210358401"),
      ),
      fx("Malanje: duas Sonangol, Pumangol e TotalEnergies.", osm("way/209282535"), osm("way/1053977573"), osm("way/1130680422")),
      fx(
        "Em Calandula e em Pungo Andongo não há posto mapeado. Quem fez a viagem aconselha um jerricã extra para a zona das quedas e de Pungo Andongo, e avisa que há postos sem combustível e com filas.",
        F.landersDicas,
      ),
    ],
    semCombustivel: fx(
      "De Malanje ao Cacuso pelas quedas: cerca de 140 km sem posto mapeado, e 190 a 260 km com os desvios à Pousada e a Musseleje. Saia de Malanje de depósito cheio.",
      F.osrm,
      F.landersDicas,
    ),
    comer: [
      lugar("Casas de pasto da estrada", "Catete", "Uma reportagem de Fevereiro de 2026 almoçou funge de carne em Catete.", F.kiandaEN230),
      lugar("Restaurante da Pousada", "Calandula, do outro lado do rio", "Moamba e peixe grelhado.", F.pousadaRestaurante),
      lugar("Restaurante Kurral, no Kahombo Rural", "Soqueco, cerca de 38 km do Cacuso", "Na fazenda Terras de Koló, junto ao Lucala.", F.kahombo),
      lugar("Pungo Andongo", "Aldeia", "Não encontrámos onde comer: leve merenda.", F.landersMalanje),
    ],
    dormir: [
      lugar(
        "Hotel Palanca Negra",
        "Malanje",
        "Quatro estrelas, 140 quartos. Quarto duplo a 27.000 Kz em 2022; telefone +244 928 908 036.",
        F.palancaNegra,
        F.landersMalanje,
      ),
      lugar("Hotel Portvgalia", "Malanje, Av. Miguel Bombarda", "De 65.000 a 130.000 Kz por noite; telefone +244 935 714 668.", F.portvgalia),
      lugar(
        "Pousada de Calandula (Pousada Quedas Duque de Bragança)",
        "Calandula, em frente às quedas",
        "Reaberta em 2017; 13 quartos, 10 com vista para as quedas. Duplo a 250.000 Kz e tendas a 65.000–95.000 Kz, com pequeno-almoço (preços anunciados em Outubro de 2026). WhatsApp +244 923 300 543.",
        F.pousadaCalandula,
        F.got2Kalandula,
        F.landersMalanje,
      ),
      lugar("Hotel Terminus", "N'dalatando, Rua Cazengo", "Quatro estrelas, 50 quartos e piscina. Individual a 75.000 Kz, duplo a 95.000 Kz, com pequeno-almoço.", F.terminusNdala),
      lugar("Kahombo Rural", "Soqueco, perto do Cacuso", "Duplo em meia pensão de 177.440 a 185.000 Kz. No Cacuso há também dois hotéis à beira da estrada.", F.kahombo, F.ptCacuso),
      lugar("Pungo Andongo", "Aldeia", "Não encontrámos alojamento; em 2022 houve quem acampasse junto às pedras.", F.landersMalanje),
    ],
    saude: [
      lugar("Hospital Provincial de Malanje", "Malanje", "O mais perto das quedas: em Calandula não há unidade de saúde mapeada.", osm("way/208899482")),
      lugar("Hospital Geral do Cuanza Norte Mário Pinto de Andrade", "Na EN230, cerca de 15 km a leste de N'dalatando", "", osm("way/1381082837")),
      lugar("Hospital do Cacuso", "Cacuso", "O mais perto de Pungo Andongo.", osm("way/210358393")),
    ],
    perigos: [
      fx(
        "Malanje tem mais controlos policiais do que o resto do país, e há quem peça dinheiro ('água'); já em 2018 o excesso de postos de controlo afastava turistas.",
        F.landersMalanje,
        F.palancaNegra,
      ),
      fx("Camiões saem da faixa para fugir aos buracos, sobretudo entre Maria Teresa e N'dalatando.", F.landersMalanje),
      fx(
        "Depois de chover, a picada de Musseleje pede 4×4 e o trilho para a base das quedas tem lama funda e declives acima dos 50 %.",
        F.landersMalanje,
        F.caminhadaQuedas,
      ),
      NOITE,
    ],
    licencas: [
      fx(
        "O miradouro da vila é gratuito. Do lado da Pousada pagavam-se 500 Kz por pessoa e 1.000 Kz por veículo (2022). O roteiro oficial de Malanje diz que não há custos de entrada nos locais (2026).",
        F.landersMalanje,
        F.roteiroMalanje,
      ),
      fx("No parque de estacionamento das quedas há guias locais que levam à base, a troco de gorjeta (2023).", F.got2Kalandula),
      fx("Não encontrámos taxa em Pungo Andongo.", F.ptPungo),
      fx("Em Junho de 2026 foi autorizada a construção de miradouros e casas de banho nas Quedas de Calandula: pode haver obras.", F.jaMiradouros),
    ],
    rede: [REDE_SEM_DADOS],
    motas: [
      fx(
        "Uma mota de estrada faz o asfalto, mas os buracos da EN230 pedem suspensão e pneus em bom estado; uma trail é mais confortável. Para Musseleje e o lado da Pousada, trail, e só com o chão seco.",
        F.landersMalanje,
        F.kiandaEN230,
      ),
    ],
    levar: [
      "Jerricã de combustível para a zona das quedas e de Pungo Andongo.",
      "Calçado que aguente lama, para o trilho da base das quedas.",
      "Documentos à mão: Malanje tem muitos controlos.",
      "Merenda para Pungo Andongo.",
    ],
    agua: fx("2 litros por pessoa por dia e merenda: em Pungo Andongo e na picada de Musseleje não há onde comprar.", F.landersMalanje),
    grupo: fx(
      "Em grupo, sobretudo nas picadas (Musseleje, Pousada) e em Pungo Andongo, onde não há alojamento nem posto. Fora das cidades os socorros demoram.",
      F.landersMalanje,
      F.fcdoSaude,
    ),
    pontos: [
      ponto("Miradouro da vila (Parque das Quedas)", -9.0742, 15.9993, "Gratuito, com zona de merendas.", osm("way/210412230")),
      ponto("Quedas de Calandula", -9.07583, 16.00333, "105 m de altura no rio Lucala.", wikidata("Q940305")),
      ponto("Pousada de Calandula", -9.0785, 16.0018, "Do outro lado do rio, de frente para as quedas.", osm("way/1315147505")),
      ponto("Quedas de Musseleje", -9.080215, 15.796967, "Mais de 30 m; 5 km de asfalto e 15 a 20 de picada desde Calandula.", F.musselejeHa),
      ponto("Pedras Negras de Pungo Andongo", -9.6625, 15.5839, "Rochas gigantes e ruínas da fortaleza de 1671.", wikidata("Q7260173")),
      ponto("Miradouro das Pedras Negras", -9.65942, 15.5766, "Na estrada para as Pedras Negras.", osm("node/4406768091")),
      ponto("Centro Botânico do Quilombo", -9.3335, 14.8994, "Antigo Jardim Botânico do Cazengo, a 5 km do centro de N'dalatando.", F.quilombo),
    ],
  },

  /* ================================================================
     4. MIRADOURO DA LUA E BARRA DO KWANZA
     ================================================================ */
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
    exigenciaPorque: "Perto de Luanda e sempre em asfalto; o perigo está na borda da falésia e no trânsito à saída da cidade.",
    melhorEpoca: "De Maio a Outubro está seco, muitas vezes com nevoeiro. As chuvas curtas caem em Março e Abril.",
    epocaCurta: "Mai–Out",
    resumo:
      "Falésias recortadas pelo vento e pela chuva, com ar de paisagem lunar, a pouco mais de uma hora de Luanda, e almoço na foz do Kwanza.",
    descricao: [
      "O Miradouro da Lua são falésias moldadas pela erosão do vento e da chuva, com uma paisagem que parece lunar, junto à EN100 a sul de Luanda. É paragem habitual a caminho da Barra do Kwanza e de Cabo Ledo, e foi uma das paragens dos Amigos da Picada no passeio que a Euronews acompanhou em 2021.",
      "Tem posto de informação turística, balneários, estacionamento e um observatório com binóculos. Em 2026, porém, o Ministério do Turismo anunciou que o fechava por seis meses para obras de estabilização da ravina.",
      "Cerca de 15 km mais a sul fica a Barra do Kwanza, na foz do rio, com a ponte de tirantes de 622 m e restaurantes à beira-rio.",
    ],
    distancias: [
      { texto: "40 a 60 km a sul de Luanda, conforme o ponto de partida", fonte: F.ptMiradouro },
      { texto: "Cerca de 1h a 1h15 de Luanda", fonte: F.luandaGuide },
      { texto: "Barra do Kwanza: 75 km de Luanda pela EN100", fonte: F.barraKwanza },
    ],
    destaques: [
      "O miradouro e o observatório",
      "A ponte de tirantes sobre o Kwanza",
      "Almoço na Barra do Kwanza, à beira-rio",
      "Luz quente ao fim da tarde, horizonte mais limpo de manhã",
    ],
    dicas: [
      "As bordas desfazem-se: mantenha distância da falésia e não pare a mota junto à borda.",
      "Confirme antes de sair se o miradouro já reabriu depois das obras anunciadas em 2026.",
      "Leve kwanzas em dinheiro para a portagem da ponte.",
      "É uma boa primeira saída em grupo para quem está a começar: curta, em asfalto e com sítios para parar.",
    ],
    fontes: [F.ptMiradouro, F.visiteLuandaLua, F.luandaGuide, F.euronews, F.landersCosta, F.wikiLuanda, F.haMiradouro, F.miradouroFecho],

    paragens: [LUANDA, MIRADOURO_LUA, { nome: "Barra do Kwanza (Kwanza Lodge)", lat: -9.3422, lng: 13.1537, fonte: osm("node/4826762931") }, LUANDA],
    trocos: [
      troco(
        1,
        "asfalto",
        "Saída de Luanda para sul pela EN100, por Benfica, Ramiros e Palmeirinhas.",
        "A cidade a ficar para trás e, perto do miradouro, as falésias de terra vermelha.",
        "Até sair da cidade há trânsito, vendedores, motas e peões a atravessar.",
        F.comunidades,
      ),
      troco(
        1,
        "asfalto",
        "EN100 até à ponte sobre o Kwanza, com a portagem na entrada norte; logo depois da ponte, o desvio para a foz.",
        "A ponte de tirantes, com 622 m e um vão de 300 m, e o rio Kwanza a chegar ao mar.",
        "Portagem à entrada da ponte: tenha kwanzas em dinheiro à mão. Há posto policial junto à ponte.",
        F.ponteKwanza,
        F.angopPortagem,
        osm("way/744236355"),
      ),
      troco(1, "asfalto", "Regresso a Luanda pela EN100.", "A mesma costa, com o sol da tarde.", undefined, F.ptEN100),
    ],
    dias: 1,
    diasNota: fx("Um dia, ou só uma manhã: são cerca de 160 km ida e volta pela EN100.", F.osrm),
    horario: [
      {
        titulo: "Miradouro da Lua e Barra do Kwanza",
        passos: [
          { hora: "08:00", texto: "Saída da Marginal de Luanda, de depósito cheio." },
          { hora: "09:20", texto: "Miradouro da Lua, se estiver aberto. De manhã o horizonte está mais limpo." },
          { hora: "10:15", texto: "Ponte do Kwanza (portagem) e Barra do Kwanza." },
          { hora: "10:45", texto: "Manhã na foz do rio." },
          { hora: "12:30", texto: "Almoço à beira-rio: Kwanza Lodge ou Restaurante Imbondeiro." },
          { hora: "14:30", texto: "Regresso a Luanda pela EN100." },
          { hora: "16:30", texto: "Chegada a Luanda, com luz até perto das 18h." },
        ],
      },
    ],
    clima: "luanda",
    combustivel: [
      fx(
        "Benfica (km 20): Pumangol. Ramiros (km 32): Pumangol. Palmeirinhas (km 42): Sonangol. Barra do Kwanza, antes da ponte (km 76): Sonangalp.",
        osm("node/2022705768"),
        osm("node/4245044891"),
        osm("way/534026100"),
        osm("way/305030429"),
      ),
    ],
    semCombustivel: fx("Cerca de 34 km entre postos mapeados. A volta tem cerca de 160 km.", F.osrm, osm("way/305030429")),
    comer: [
      lugar(
        "Kwanza Lodge",
        "Barra do Kwanza, na foz do rio",
        "A 74 km de Luanda; conhecido pela pesca desportiva.",
        F.kwanzaLodge,
        osm("node/4826762931"),
      ),
      lugar("Restaurante Imbondeiro", "Barra do Kwanza", "Marisco, junto ao rio. Mapeado no OpenStreetMap.", osm("node/2016846793")),
      lugar("Miradouro da Lua", "Junto ao miradouro", "Não encontrámos restaurante: leve água.", F.haMiradouro),
    ],
    dormir: [lugar("Kwanza Lodge", "Barra do Kwanza", "Para quem quiser ficar na foz do rio.", F.kwanzaLodge)],
    saude: [...HOSPITAIS_LUANDA_SUL, lugar("Barra do Kwanza", "Foz do rio", "Não há unidade de saúde mapeada.", F.osm)],
    perigos: [
      fx("As bordas do miradouro desfazem-se: mantenha distância da falésia.", F.ptMiradouro),
      fx(
        "À saída de Luanda, vendedores ambulantes, motas e peões; mais a sul, animais a atravessar.",
        F.comunidades,
      ),
      NOITE,
    ],
    licencas: [
      fx(
        "Miradouro da Lua: em 2026 o Ministério do Turismo anunciou o encerramento temporário por seis meses, para obras de contenção e estabilização da ravina. O comunicado não tem data: confirme se já reabriu. Não encontrámos taxa de entrada nem horário.",
        F.miradouroFecho,
        F.haMiradouro,
      ),
      PORTAGEM_KWANZA,
    ],
    rede: [REDE_SEM_DADOS],
    motas: [fx("Qualquer mota em bom estado serve: é asfalto do princípio ao fim. No miradouro, estacione em terreno firme.", F.ptEN100, F.ptMiradouro)],
    levar: ["Kwanzas em dinheiro para a portagem.", "Calçado para andar no terreno irregular do miradouro.", "Protector solar e chapéu para as paragens."],
    agua: fx(
      "1,5 litros por pessoa: no miradouro não encontrámos onde comprar, e em Luanda as máximas andam entre 25 e 31 °C todo o ano.",
      F.haMiradouro,
      F.wikiLuanda,
    ),
    grupo: fx(
      "Rota curta e em asfalto: boa primeira saída em grupo, e foi paragem dos Amigos da Picada em 2021. Combinem antes quem abre e quem fecha.",
      F.euronews,
    ),
    pontos: [
      ponto("Miradouro da Lua", -9.22111, 13.08972, "As falésias erodidas e o observatório.", wikidata("Q10330512")),
      ponto("Portagem da ponte do Kwanza", -9.3186, 13.1564, "Na entrada norte da ponte.", osm("way/744236355")),
      ponto("Ponte sobre o rio Kwanza", -9.3236, 13.1637, "Ponte de tirantes, 622 m.", osm("way/79585868"), F.ponteKwanza),
      ponto("Kwanza Lodge", -9.3422, 13.1537, "Na foz do rio.", osm("node/4826762931")),
      ponto("Restaurante Imbondeiro", -9.3379, 13.158, "Marisco, junto ao rio.", osm("node/2016846793")),
    ],
  },

  /* ================================================================
     5. CABO LEDO, QUIÇAMA E MUXIMA
     ================================================================ */
  {
    slug: "cabo-ledo-e-quicama",
    nome: "Cabo Ledo, Quiçama e Muxima",
    subtitulo: "Praia de surf, parque nacional e a romaria dos motards",
    regiao: "Luanda · Icolo e Bengo",
    provincias: ["Luanda", "Icolo e Bengo"],
    partida: "Luanda",
    piso: "Asfalto",
    pisoDetalhe:
      "EN100 até Cabo Ledo, muito degradada entre a ponte do Kwanza e Cabo Ledo (2025). A volta pela EN110, de Cabo Ledo à Muxima e a Catete, era de bom asfalto em 2022. O acesso à Praia dos Surfistas é de terra.",
    exigencia: "Média",
    exigenciaPorque: "EN100 rápida, degradada e com acidentes graves; 112 km sem combustível pela Quiçama.",
    melhorEpoca: "De Maio a Outubro está seco, com nevoeiro frequente. As chuvas curtas caem em Março e Abril.",
    epocaCurta: "Mai–Out",
    resumo:
      "A enseada de Cabo Ledo, a travessia do Parque Nacional da Quiçama e o santuário da Muxima, junto ao Kwanza: uma volta de dois dias pela costa e pelo interior.",
    descricao: [
      "Cabo Ledo é um cabo que forma uma enseada larga, com falésias e areia branca, conhecido pela pesca e pelo surf: a Praia dos Surfistas tem uma onda de esquerda. Desde 2024 é município da nova província de Icolo e Bengo.",
      "O caminho pela EN100 atravessa o Parque Nacional da Quiçama, criado em 1957 entre os rios Kwanza e Longa e repovoado com animais vindos do Botswana e da África do Sul na Operação Arca de Noé, em 2001. Por ser estrada pública, não se paga para passar.",
      "A volta faz-se pela EN110, que corta a Quiçama por dentro até à Muxima, vila junto ao Kwanza com uma igreja e uma fortaleza de 1599. Os Amigos da Picada vão lá todos os anos pedir a bênção para a época de mota.",
    ],
    distancias: [
      { texto: "Cabo Ledo: cerca de 110 a 120 km a sul de Luanda pela EN100, cerca de 2 horas", fonte: F.landersCosta },
      { texto: "Cabo Ledo: 120 km a sul de Luanda", fonte: F.ptCaboLedo },
      { texto: "Muxima: 125 a 130 km de Luanda", fonte: F.muxima },
      { texto: "Catete–Muxima–Cabo Ledo pela EN110: 173 km, quase 3 horas (2022)", fonte: F.landersCosta },
    ],
    destaques: [
      "Praia dos Surfistas, em Cabo Ledo",
      "Parque Nacional da Quiçama",
      "Santuário e fortaleza da Muxima",
      "Miradouro da Lua e Barra do Kwanza pelo caminho",
    ],
    dicas: [
      "Em Março de 2026 foram referidos acidentes recentes no troço Cabo Ledo–Ramiros com mais de 30 mortos. Rode devagar, em grupo compacto e nunca de noite.",
      "Para safaris na Quiçama, confirme antes as condições de entrada junto do INBAC.",
      "Na romaria da Muxima a estrada enche-se de peregrinos a pé: abrande muito.",
      "Saia de Cabo Ledo de depósito cheio: até à Muxima não há posto mapeado.",
    ],
    fontes: [F.landersCosta, F.ptCaboLedo, F.wikiCaboLedo, F.surfCaboLedo, F.wikiQuicama, F.inbacQuicama, F.muxima, F.euronews, F.en100Obras, F.wikiLuanda],

    paragens: [
      LUANDA,
      MIRADOURO_LUA,
      { nome: "Ponte do Kwanza", lat: -9.32376, lng: 13.1638, fonte: osm("way/79585868") },
      { nome: "Cabo Ledo (Praia dos Surfistas)", lat: -9.67775, lng: 13.1986, fonte: osm("way/669647658") },
      { nome: "Muxima", lat: -9.52067, lng: 13.959657, fonte: wikidata("Q5116934") },
      { nome: "Catete", lat: -9.10999, lng: 13.68955, fonte: osm("node/1417840848") },
      LUANDA,
    ],
    trocos: [
      troco(1, "asfalto", "Saída de Luanda pela EN100, por Benfica e Ramiros.", "As falésias do Miradouro da Lua, junto à estrada.", "À saída de Luanda, trânsito, vendedores e peões.", F.comunidades),
      troco(1, "asfalto", "EN100 até à ponte do Kwanza, com portagem na entrada norte.", "A ponte de tirantes e a foz do Kwanza.", "Tenha kwanzas em dinheiro para a portagem.", F.angopPortagem, F.ponteKwanza),
      troco(
        1,
        "buracos",
        "EN100 pela Quiçama e por Sangano até Cabo Ledo; o acesso à Praia dos Surfistas é um desvio de terra mal batida, com ganchos.",
        "A savana da Quiçama, entre o Kwanza e o Longa, e a enseada de Cabo Ledo lá em baixo.",
        "O Portal das Comunidades dá a EN100 como especialmente perigosa entre a ponte e Cabo Ledo. Em Fevereiro de 2025 o troço estava em degradação acentuada, com ravinas, e a reabilitação tinha acabado de ser aprovada; em 2026 houve acidentes graves mais a sul. Rode de dia e em grupo compacto.",
        F.comunidades,
        F.en100Degradada,
        F.en100Obras,
        F.got2CaboLedo,
      ),
      troco(
        2,
        "asfalto",
        "EN100 para norte uns 10 km e EN110 para leste, por dentro da Quiçama, até à Muxima. Era 'bom asfalto' em 2022.",
        "O interior do parque, longe da costa, e o Kwanza à chegada à Muxima.",
        "Cerca de 112 km sem posto mapeado: saia de Cabo Ledo de depósito cheio.",
        F.landersCosta,
        F.inbacQuicama,
      ),
      troco(2, "asfalto", "EN110 pela Cabala até Catete.", "O vale do Kwanza.", undefined, F.landersCosta),
      troco(
        2,
        "buracos",
        "EN230 de Catete a Luanda, por Viana.",
        "A entrada em Luanda pelo lado de Viana.",
        "Em Fevereiro de 2026 a EN230 ainda tinha muitos buracos, e a entrada em Luanda é lenta.",
        F.kiandaEN230,
      ),
    ],
    dias: 2,
    diasNota: fx(
      "Dois dias: Luanda–Cabo Ledo com a tarde na praia, e a volta pela Quiçama e pela Muxima. Num só dia são cerca de 380 km e mais de 7 horas a rodar, e chega-se a Luanda no limite da luz.",
      F.osrm,
    ),
    horario: [
      {
        titulo: "Luanda–Cabo Ledo",
        passos: [
          { hora: "08:00", texto: "Saída de Luanda, de depósito cheio." },
          { hora: "09:20", texto: "Miradouro da Lua, se estiver aberto." },
          { hora: "10:00", texto: "Ponte do Kwanza (portagem). Opcional: a estrada de visita à Quiçama sai da EN100 4 a 5 km depois da ponte." },
          { hora: "11:30", texto: "Cabo Ledo: abasteça no posto à entrada e desça à Praia dos Surfistas." },
          { hora: "13:00", texto: "Almoço e tarde na praia." },
        ],
      },
      {
        titulo: "Quiçama, Muxima e Luanda",
        passos: [
          { hora: "08:00", texto: "Saída de Cabo Ledo, de depósito cheio e com água e merenda." },
          { hora: "10:30", texto: "Muxima: o santuário e a fortaleza sobre o Kwanza." },
          { hora: "11:45", texto: "Saída da Muxima pela Cabala." },
          { hora: "13:00", texto: "Catete: almoço." },
          { hora: "15:00", texto: "Chegada a Luanda." },
        ],
      },
    ],
    clima: "luanda",
    combustivel: [
      fx("EN100 até à ponte: Pumangol em Benfica e em Ramiros, Sonangol em Palmeirinhas e Sonangalp junto à ponte.", osm("node/2022705768"), osm("node/4245044891"), osm("way/305030429")),
      fx(
        "Sangano, 30 km depois da ponte: TotalEnergies. Cerca de 3 km antes de Cabo Ledo há um posto sem nome, mapeado em Maio de 2026.",
        osm("way/1130639509"),
        osm("way/496339360"),
      ),
      fx("Muxima: um posto sem nome, mapeado em 2019. Catete: um posto; Viana: Pumangol e Sonangalp.", osm("way/741808858"), osm("way/744958362")),
    ],
    semCombustivel: fx("Cerca de 112 km sem posto mapeado entre Cabo Ledo e a Muxima, pela EN110 dentro da Quiçama.", osm("way/496339360"), osm("way/741808858"), F.osrm),
    comer: [
      lugar("Carpe Diem", "Cabo Ledo, Praia dos Surfistas", "Lodge e surf camp com restaurante (2022 e 2023).", F.landersCosta, F.got2CaboLedo, osm("way/304776144")),
      lugar("Restaurantes da estrada", "Catete", "Uma reportagem de 2026 almoçou funge de carne em Catete.", F.kiandaEN230),
      lugar("Muxima", "Vila", "Não encontrámos restaurante: leve merenda.", F.muxima),
    ],
    dormir: [
      lugar("Carpe Diem", "Cabo Ledo", "Bungalows, campismo e piscina.", F.landersCosta, F.got2CaboLedo),
      lugar("Complexo Turístico Doce Mar", "Cabo Ledo", "Bungalow duplo a 92.500 Kz com pequeno-almoço.", F.doceMar),
      lugar("Queiroz Point Eco Resort", "Cabo Ledo", "De 90.000 a 226.000 Kz, com parque de campismo e trilhos de mota.", F.queirozPoint),
      lugar(
        "Bungalows do Parque Nacional da Quiçama",
        "Dentro do parque",
        "40.000 Kz por noite com pequeno-almoço; refeições de 10.000 a 15.000 Kz; só com reserva (Junho de 2024).",
        F.angopQuicama,
      ),
    ],
    saude: [
      ...HOSPITAIS_LUANDA_SUL,
      lugar(
        "Cabo Ledo, Muxima e Catete",
        "Ao longo da rota",
        "Não encontrámos unidade de saúde mapeada. Em Agosto de 2026 os feridos graves de um acidente em Cabo Ledo foram levados para o Hospital Pedalé, em Luanda.",
        F.osm,
        F.jaCaboLedoNevoeiro,
      ),
    ],
    perigos: [
      fx(
        "EN100 especialmente perigosa entre a ponte do Kwanza e Cabo Ledo e muito degradada em 2025. Em Março de 2026 um autocarro despistou-se em Cabo Ledo (12 mortos), e em Agosto outro, de madrugada, com o asfalto escorregadio do nevoeiro. A duplicação do troço Cabo Ledo–Ramiros está anunciada para 2027.",
        F.comunidades,
        F.en100Degradada,
        F.caboLedoMarco,
        F.jaCaboLedoNevoeiro,
        F.duplicacaoEN100,
      ),
      fx(
        "Na romaria da Muxima a estrada enche-se de peregrinos a pé. As datas variam conforme a fonte: fim de Agosto e início de Setembro, dia 8 de Setembro, e a festa de 8 de Dezembro.",
        F.muxima,
        F.landersCosta,
        F.ecclesia,
      ),
      NOITE,
    ],
    licencas: [
      fx("Atravessar a Quiçama pela EN100 não paga entrada: é estrada pública (2022).", F.landersCosta),
      fx(
        "Para entrar no parque: acesso a 5.000 Kz (a partir dos 13 anos) e safari a 8.000 Kz pela tabela oficial de 2024; em Junho de 2024 a ANGOP noticiou safaris a 10.000 Kz. A estrada de visita sai da EN100 4 a 5 km depois da ponte. Não confirmámos se as motas podem entrar: pergunte ao INBAC (+244 923 266 405).",
        F.taxasParques,
        F.taxasExpansao,
        F.angopQuicama,
        F.inbacQuicama,
      ),
      PORTAGEM_KWANZA,
      fx("Gruta do Cabo Ledo, a cerca de 7 km da praia: só com guia.", F.grutaCaboLedo),
    ],
    rede: [REDE_SEM_DADOS],
    motas: [
      fx(
        "Asfalto em quase tudo, mas com buracos e ravinas no troço Kwanza–Cabo Ledo: uma trail ou uma maxi-trail é mais confortável. O acesso à Praia dos Surfistas é de terra com ganchos.",
        F.en100Degradada,
        F.got2CaboLedo,
      ),
    ],
    levar: [
      "Kwanzas em dinheiro para a portagem e para as taxas do parque.",
      "Fato de banho e toalha para Cabo Ledo.",
      "Merenda para o segundo dia: na Muxima não encontrámos onde comer.",
    ],
    agua: fx("1,5 a 2 litros por pessoa por dia; no segundo dia, leve-os de Cabo Ledo.", F.muxima),
    grupo: fx("Em grupo compacto e de dia, sobretudo no troço Kwanza–Cabo Ledo e nos 112 km sem combustível da EN110.", F.comunidades, F.en100Obras),
    pontos: [
      ponto("Miradouro da Lua", -9.22111, 13.08972, "Paragem a caminho do Kwanza.", wikidata("Q10330512")),
      ponto("Portagem da ponte do Kwanza", -9.3186, 13.1564, "Na entrada norte da ponte.", osm("way/744236355")),
      ponto("Entrada da estrada da Quiçama", -9.3615, 13.1775, "Portão da estrada de visita ao parque.", osm("node/287546429")),
      ponto("Praia dos Surfistas", -9.6778, 13.2013, "A onda de esquerda de Cabo Ledo.", osm("way/669647658"), F.surfCaboLedo),
      ponto("Santuário da Muxima", -9.52067, 13.959657, "Igreja de Nossa Senhora da Conceição.", wikidata("Q5116934")),
      ponto("Fortaleza da Muxima", -9.521964, 13.95989, "Fortaleza de 1599 sobre o Kwanza.", wikidata("Q5472749")),
    ],
  },

  /* ================================================================
     6. DESERTO DO NAMIBE
     ================================================================ */
  {
    slug: "deserto-do-namibe",
    nome: "Deserto do Namibe: Arco, Tômbwa e Iona",
    subtitulo: "Areia, um oásis e as welwitschias",
    regiao: "Namibe",
    provincias: ["Namibe"],
    partida: "Moçâmedes",
    piso: "Asfalto e areia",
    pisoDetalhe:
      "EN100 larga e asfaltada de Moçâmedes ao Tômbwa. Os 4,5 km até ao Arco são de picada de areia, e o Parque Nacional do Iona é areia, pedra e trilhos.",
    exigencia: "Aventura",
    exigenciaPorque: "Areia, picadas, pouco combustível e nenhuma água no caminho; o Iona só com autorização e apoio de 4×4.",
    melhorEpoca:
      "Quase não chove (cerca de 51 mm por ano) e de Maio a Setembro praticamente nada; a corrente fria de Benguela mantém Julho e Agosto abaixo dos 18 °C. De manhã há nevoeiro na costa, que levanta por volta das 11h; à tarde sobe o vento.",
    epocaCurta: "Mai–Set",
    resumo:
      "De Moçâmedes ao Tômbwa por uma das melhores estradas do país, com welwitschias à beira da estrada e o oásis do Arco a 4,5 km de areia. O Parque Nacional do Iona fica para quem tiver autorização.",
    descricao: [
      "Moçâmedes, a antiga cidade do Namibe, é a porta para o deserto. A EN100 até ao Tômbwa, a antiga Porto Alexandre, é larga e asfaltada, com welwitschias ao longo do caminho.",
      "Entre as duas cidades, perto do rio Curoca, fica o Arco: um oásis com três lagoas num desfiladeiro de arenito, a do meio com arcos naturais. A água varia com os anos: em 2016 a lagoa estava seca, em 2018 voltou, e em 2024 e 2025 estava outra vez seca.",
      "Mais a sul fica o Parque Nacional do Iona, o maior e mais antigo de Angola, com 15.150 km² e 180 km de costa, gerido com a African Parks desde 2020. É o habitat principal da Welwitschia mirabilis, uma planta do deserto que pode viver centenas de anos.",
      "As regras do Iona proíbem motas não autorizadas e pedem 4×4 bem equipados, de preferência mais de um. Em 2019, uma volta de mota de três dias entre o Lubango, o Namibe, o Iona e o Ruacana fez 1.292 km, 750 dos quais fora de estrada; o guia aconselhava ir preparado para quatro dias.",
    ],
    distancias: [
      { texto: "Moçâmedes–Tômbwa: 93 a 95 km, cerca de 1 hora", fonte: F.landersCosta },
      { texto: "Arco: desvio a 13 km da ponte do rio Curoca e depois picada", fonte: F.arcos },
      { texto: "Parque Nacional do Iona: cerca de 200 km de Moçâmedes", fonte: F.wikiIona },
    ],
    destaques: ["Welwitschias junto à EN100", "Lagoa dos Arcos", "Tômbwa e a ponte do Curoca", "Parque Nacional do Iona, com autorização"],
    dicas: [
      "Na areia da picada do Arco, baixe a pressão dos pneus e não vá sozinho.",
      "Não saia dos trilhos para fotografar welwitschias: ainda há zonas com minas, e as plantas não se pisam nem se tocam.",
      "Para o Iona, peça autorização para a mota à gestão do parque, leve combustível, toda a água e material de campismo.",
      "O caminho pela praia até à Baía dos Tigres depende das marés: só com guia local, em lua cheia e maré baixa, nunca a solo.",
      "Abasteça em Moçâmedes e no Tômbwa sempre que puder.",
    ],
    fontes: [F.wikiMocamedes, F.ptEN100, F.landersCosta, F.arcos, F.arcosVer, F.wikiIona, F.inbacIona, F.welwitschia, F.got2Tigres, F.aventuraMoto, F.combustivel, F.wikiEN100, F.ionaRegras],

    paragens: [
      MOCAMEDES,
      { nome: "Welwitschias junto à EN100", lat: -15.55557, lng: 12.20266, fonte: osm("node/12747482001") },
      { nome: "Desvio do Arco", lat: -15.74164, lng: 12.03734, fonte: osm("node/6081199686") },
      { nome: "Arco (Lagoa dos Arcos)", lat: -15.76555, lng: 12.06555, fonte: osm("way/647260715") },
      { nome: "Desvio do Arco", lat: -15.74164, lng: 12.03734, fonte: osm("node/6081199686") },
      { nome: "Tômbwa", lat: -15.80206, lng: 11.85401, fonte: osm("node/352755148") },
      MOCAMEDES,
    ],
    trocos: [
      troco(
        1,
        "asfalto",
        "EN100 para sul, larga e asfaltada, 'uma das melhores estradas do país' (2022).",
        "Um jardim de welwitschias a 87 m da estrada, mapeado em 2025; ao longo do caminho há mais.",
        "Em 31 de Março de 2026 a chuva cobriu a estrada perto do km 50 e a administração do Tômbwa emitiu um alerta: depois de chover, confirme.",
        F.landersCosta,
        F.roteiroDeserto,
        F.jaTombwaChuva,
      ),
      troco(
        1,
        "asfalto",
        "EN100 e a estrada do Tômbwa para oeste; o desvio do Arco fica cerca de 13 km antes da ponte do Curoca.",
        "As colinas do Tômbwa e o deserto a abrir-se para o mar.",
        undefined,
        F.arcos,
        osm("node/5809486853"),
      ),
      troco(
        1,
        "areia",
        "Cerca de 4,5 km de picada de areia, com marcas ténues no chão. A Destino Namibe recomenda 4×4.",
        "O desfiladeiro de arenito a aparecer no meio do deserto.",
        "Não encontrámos relato de motas de estrada nesta picada: conte com areia. Baixe a pressão dos pneus, vá em grupo e nunca sozinho.",
        F.arcos,
        F.rogue,
      ),
      troco(
        1,
        "areia",
        "A mesma picada, de volta ao asfalto.",
        "O Arco: três lagoas num desfiladeiro de arenito, a do meio com arcos naturais. Em 2024 e em Julho de 2025 estavam secas.",
        undefined,
        F.arcos,
        F.wildImages,
        F.rok,
      ),
      troco(1, "asfalto", "Estrada do Tômbwa para oeste: a ponte do rio Curoca e a vila.", "O rio Curoca e o Tômbwa, a antiga Porto Alexandre.", undefined, F.ptTombwa, osm("way/208046421")),
      troco(1, "asfalto", "Regresso a Moçâmedes pela EN100.", "O deserto com a luz da tarde.", "À tarde sobe o vento na costa.", F.t4a),
    ],
    dias: 1,
    diasNota: fx(
      "Um dia de ida e volta a Moçâmedes, cerca de 200 km. O Parque Nacional do Iona é outra viagem: três a quatro dias, só com autorização do parque para as motas e com apoio de 4×4. Em 2025 um grupo de 4×4 fez 130 km em 11 horas dentro do parque.",
      F.ionaRegras,
      F.aventuraMoto,
      F.africa4x4ep4,
    ),
    horario: [
      {
        titulo: "Welwitschias, Arco e Tômbwa",
        passos: [
          { hora: "07:30", texto: "Saída de Moçâmedes, de depósito cheio e com toda a água do dia." },
          { hora: "08:15", texto: "Welwitschias junto à EN100. Veja-as do trilho, sem lhes tocar." },
          { hora: "08:50", texto: "Desvio do Arco: baixe a pressão dos pneus antes da picada." },
          { hora: "09:30", texto: "Arco. Um guia da aldeia acompanha a visita." },
          { hora: "11:15", texto: "De volta ao asfalto: volte a encher os pneus." },
          { hora: "12:00", texto: "Tômbwa: abasteça e almoce peixe no Virei." },
          { hora: "14:00", texto: "Regresso a Moçâmedes, antes que o vento aperte." },
          { hora: "15:30", texto: "Chegada a Moçâmedes." },
        ],
      },
    ],
    clima: "mocamedes",
    combustivel: [
      fx(
        "Moçâmedes: Sonangol no Tambor e junto ao Shoprite, TotalEnergies do Cainde e Pumangol aberta 24 horas.",
        osm("way/1004417259"),
        osm("way/761952380"),
        osm("node/10621497302"),
        osm("way/1005782675"),
      ),
      fx(
        "Tômbwa: há postos de combustível (2022) e em 2025 quem lá passou comprou gasóleo. Estão mapeados dois postos, sem marca.",
        F.landersCosta,
        F.soulTonic8,
        osm("node/4634526889"),
        osm("way/675117984"),
      ),
      fx("No Parque Nacional do Iona não há combustível nem água à venda; também não há posto no Virei.", F.ionaRegras, F.jaVirei),
      fx("Em Maio de 2026 a Sonangol admitiu constrangimentos em postos do Namibe.", F.combustivel),
    ],
    semCombustivel: fx(
      "Cerca de 100 km entre Moçâmedes e o Tômbwa, com a picada do Arco pelo meio. Para o Iona, uma volta por Salondjamba, Espinheira e Iona são 360 a 400 km sem combustível, e mais de 500 pela costa.",
      F.osrm,
      F.ionaMapa,
    ),
    comer: [
      lugar("Restaurante Virei", "Tômbwa, centro da vila", "Peixe fresco e marisco; telefone +244 923 356 372 (2022).", F.landersCosta),
      lugar("Restaurante Margolf", "Tômbwa", "Num edifício português antigo (2024).", F.wildImages),
      lugar("Arco", "Lagoas", "Não há bar nem restaurante: leve comida e água.", F.landersCosta),
      COMER_MOCAMEDES,
    ],
    dormir: [
      DORMIR_MOCAMEDES,
      lugar(
        "Flamingo Lodge",
        "Costa a norte do Curoca",
        "Bungalows, bar, restaurante e campismo. O acesso é de areia funda: em 2022 e 2025 diziam que um 4×4 é essencial.",
        F.landersCosta,
        F.soulTonic9,
        osm("node/3272414778"),
      ),
      lugar(
        "Campismo no Iona",
        "Locais designados do parque",
        "Sem instalações nem água, a 4.000 Kz por noite. Ainda não há lodges.",
        F.ionaRegras,
        F.ionaTaxas,
      ),
    ],
    saude: [
      HOSPITAL_NAMIBE,
      lugar(
        "Hospital Municipal do Tômbwa",
        "Tômbwa",
        "Os casos mais graves são transferidos para Moçâmedes. Está a ser construído um hospital novo, previsto para Março de 2027.",
        osm("way/828466585"),
        F.ptTombwa,
        F.jaHospitalTombwa,
      ),
      lugar("Iona", "Dentro do parque", "A assistência prestada pelo parque é paga pelo visitante.", F.ionaRegras),
    ],
    perigos: [
      fx("Areia na picada do Arco e em todo o Iona: baixe a pressão dos pneus e volte a enchê-los antes do asfalto.", F.arcos, F.metzeler),
      fx(
        "Ainda há minas em zonas do país e as cheias podem deslocá-las. No Iona, em 2025, havia trilhos mapeados por desminar: fique nos trilhos principais.",
        F.minas,
        F.fcdo,
        F.soulTonic6,
      ),
      fx("Nevoeiro na costa de manhã, até perto das 11h, e vento forte à tarde (2025).", F.t4a),
      fx(
        "No Iona é proibido conduzir entre o pôr e o nascer do sol, sem autorização. Pedras afiadas e erosão: quem lá foi em 2025 furou três pneus e aconselha dois pneus sobresselentes.",
        F.ionaRegras,
        F.soulTonic6,
      ),
      fx("O caminho pela praia até à Baía dos Tigres só se faz em lua cheia e maré baixa, com guia local.", F.landersCosta, F.ionaCosta),
    ],
    licencas: [
      fx(
        "Arco: sem custos de entrada segundo a Destino Namibe, mas um guia da aldeia acompanha a visita e pede alguns dólares por pessoa (2023) ou um donativo (2022).",
        F.arcos,
        F.rogue,
        F.landersCosta,
      ),
      fx(
        "Iona: entrada a 5.000 Kz por pessoa por dia (maiores de 12), 4.000 Kz por veículo e 4.000 Kz de campismo, em dinheiro na portaria ou por transferência (tabela de Maio de 2024).",
        F.ionaTaxas,
      ),
      fx(
        "As regras do Iona proíbem motas não autorizadas: peça autorização à gestão do parque (info.iona@africanparks.org, +244 937 921 693). Só entram 4×4 bem equipados, e não se recomenda um só veículo.",
        F.ionaRegras,
        F.ionaContacto,
      ),
      fx(
        "Entradas só pelas portarias de Ponta Albina, Salondjamba e Pediva, das 06:00 às 17:00 (Pediva até às 15:30). Em 2025 a portaria do lado do Tômbwa estava sem ninguém.",
        F.ionaRegras,
        F.soulTonic6,
      ),
    ],
    rede: [
      fx("No Parque Nacional do Iona não há rede de telemóvel.", F.ionaRegras),
      fx("No Tômbwa compra-se cartão SIM e dados (2025). Entre as cidades e no Arco não encontrámos dados de cobertura.", F.soulTonic8),
    ],
    motas: [
      fx(
        "Até ao Tômbwa, qualquer mota. Para o Arco, uma trail com pneus mistos. Para o Iona, só com autorização, numa mota de aventura preparada para areia, pedra e muitos quilómetros sem apoio.",
        F.arcos,
        F.ionaRegras,
        F.aventuraMoto,
      ),
      fx("A Metzeler lembra que a pressão mudada para fora de estrada tem de voltar ao valor certo antes de voltar ao asfalto.", F.metzeler),
    ],
    levar: [
      "Manómetro e compressor: baixar a pressão na areia e voltar a encher antes do asfalto.",
      "Toda a água e a comida do dia.",
      "Cinta de reboque e uma pá pequena para a areia.",
      "Lenço ou buff contra o pó e o vento.",
      "Para o Iona: autorização escrita, combustível extra, GPS com o mapa do parque e dois pneus ou câmaras de reserva.",
    ],
    agua: fx(
      "Pelo menos 3 litros por pessoa para o dia. No Iona leve toda a água: não há água potável à venda no parque, e em 2025 um grupo ficou sem água e teve de a pedir na aldeia do Iona.",
      F.ionaRegras,
      F.africa4x4ep4,
    ),
    grupo: fx(
      "Para o Arco, nunca sozinho. No Iona as regras desaconselham ir com um só veículo, e quem lá foi em 2025 recomenda dois ou três.",
      F.ionaRegras,
      F.soulTonic6,
    ),
    pontos: [
      ponto("Welwitschias junto à EN100", -15.55557, 12.20266, "A 87 m da estrada, cerca de 42 km de Moçâmedes.", osm("node/12747482001")),
      ponto("Colinas do Tômbwa", -15.74298, 12.12775, "Colinas junto à estrada do Tômbwa.", osm("node/5809486853")),
      ponto("Arco", -15.7669, 12.06668, "O arco natural e o miradouro sobre as lagoas.", F.arcos, osm("node/6986921585")),
      ponto("Lagoa dos Arcos", -15.77005, 12.06862, "A lagoa do meio, com os arcos.", osm("way/198075877")),
      ponto("Ponte do rio Curoca", -15.73078, 11.92431, "Na estrada do Tômbwa.", osm("way/208046421")),
      ponto("Portaria de Ponta Albina", -15.90427, 11.8269, "Entrada do Iona pelo lado do Tômbwa.", osm("node/13580260624"), F.ionaRegras),
      ponto("Portaria de Salondjamba", -16.30223, 12.41669, "Entrada do Iona pela EN100.", osm("node/2521932803"), F.ionaRegras),
      ponto("Pediva, sede do parque", -16.28444, 12.56089, "Inaugurada em 2024.", osm("node/8615986314")),
      ponto("Baía dos Tigres", -16.60094, 11.7227, "Ruínas da antiga vila, só com guia.", osm("node/8993609623"), F.got2Tigres),
    ],
  },

  /* ================================================================
     7. COSTA DE BENGUELA
     ================================================================ */
  {
    slug: "costa-de-benguela",
    nome: "Costa de Benguela",
    subtitulo: "Baías, morros e a Restinga do Lobito",
    regiao: "Benguela",
    provincias: ["Benguela"],
    partida: "Benguela",
    piso: "Asfalto e terra",
    pisoDetalhe:
      "Asfalto de Benguela à Baía Azul e à Baía Farta, e pela EN100 até ao Lobito. O Sombreiro, a Caota e a Caotinha só se alcançam por picadas, e no Morro da Caotinha é preciso tracção.",
    exigencia: "Média",
    exigenciaPorque: "Fácil no asfalto; as picadas para as praias pedem mota alta e alguma experiência em terra.",
    melhorEpoca:
      "Chove pouco (354 mm por ano no Lobito), sobretudo entre Novembro e Fevereiro, a época das chuvas no Sul. Depois de chover, confirme o estado das picadas: em Outubro de 2026 avisava-se de chuvas acima do normal até Dezembro.",
    epocaCurta: "Mai–Out",
    resumo:
      "As praias a sul de Benguela, do Morro do Sombreiro à Baía Farta, e a Restinga do Lobito, a faixa de areia que fecha a baía. Um dia, com banho de mar pelo meio.",
    descricao: [
      "A sul de Benguela, a estrada do litoral leva às praias da Caotinha, da Caota, da Baía Azul, com 3 km de areia e considerada a mãe das praias de Benguela, e à Baía Farta. O roteiro oficial das praias do sul começa no Morro do Sombreiro e segue até à Macaca, ao Chamume e ao Chiome, e não tem entradas pagas.",
      "À Caotinha desce-se a pé, degrau a degrau, até à pequena praia no fundo da falésia. Na Baía Azul há restaurantes de peixe grelhado e o único hotel junto à areia.",
      "A norte fica o Lobito, pela EN100 e pela ponte da Catumbela. A Restinga do Lobito é a faixa de areia que fecha a baía, com casas e praias, e chega-se lá por boa estrada.",
    ],
    distancias: [
      { texto: "Baía Farta: cerca de 25 km de Benguela", fonte: F.redeBaiaFarta },
      { texto: "Caotinha: 10 km de Benguela", fonte: F.caotinha },
      { texto: "Lobito: cerca de 30 minutos de Benguela", fonte: F.guiaBenguela },
      { texto: "Desvio para a Caotinha, a Baía Azul e a Baía Farta: cerca de 17 km a sul de Benguela", fonte: F.landersCosta },
    ],
    destaques: ["Morro do Sombreiro", "Caotinha e Caota", "Baía Azul", "Baía Farta", "Restinga do Lobito"],
    dicas: [
      "O roteiro das praias do sul pede viatura alta, e no Morro da Caotinha é preciso tracção.",
      "Leve água e alguma coisa para comer, e confirme o tempo e o estado das estradas antes de sair.",
      "Entre Benguela e o Lobito há controlos policiais com radar (relato de 2022).",
      "Em Agosto de 2026 havia escassez de combustível em toda a província. Abasteça na cidade antes de ir para as praias.",
    ],
    fontes: [F.redeBaiaFarta, F.baiaAzul, F.caotinha, F.praiasSul, F.restinga, F.landersCosta, F.wikiBenguela, F.wikiLobito, F.geografia, F.guiaBenguela],

    paragens: [
      { nome: "Benguela", lat: -12.579, lng: 13.40371, fonte: osm("node/331385969") },
      { nome: "Acesso ao Morro do Sombreiro", lat: -12.59269, lng: 13.29504, fonte: F.osrm },
      { nome: "Praia da Caotinha", lat: -12.60232, lng: 13.26689, fonte: osm("node/1844880626") },
      { nome: "Baía Azul", lat: -12.62449, lng: 13.23419, fonte: osm("node/1844114263") },
      { nome: "Baía Farta", lat: -12.61195, lng: 13.19871, fonte: osm("node/3011127339") },
      { nome: "Benguela", lat: -12.579, lng: 13.40371, fonte: osm("node/331385969") },
      { nome: "Ponta da Restinga (Lobito)", lat: -12.31572, lng: 13.58492, fonte: osm("node/3348957662") },
    ],
    trocos: [
      troco(
        1,
        "terra",
        "Sai-se de Benguela para sul; a estrada acaba a cerca de 1 km do morro, e daí só há trilhos.",
        "O Morro do Sombreiro, o chapéu de pedra que se vê da Praia Morena.",
        "São 'trilhos no meio do nada', e à praia do Sombreiro só se chega de barco.",
        F.sombreiro,
        osm("way/173566874"),
        F.redeMacaca,
      ),
      troco(
        1,
        "terra",
        "Picada até à Caotinha: a Caota e a Caotinha só têm acesso por estradas de terra.",
        "O miradouro da Caotinha e a praia no fundo da falésia, a que se desce a pé, degrau a degrau.",
        "No Morro da Caotinha é preciso tracção.",
        F.praiasSul,
        osm("way/203452944"),
        F.redeMacaca,
      ),
      troco(1, "terra", "Picada da Caota até à estrada da Baía Azul.", "A Caota e a Baía Azul, com 3 km de areia.", undefined, F.caotaDB, F.baiaAzul),
      troco(1, "asfalto", "Estrada asfaltada da Baía Azul à Baía Farta.", "A Baía Farta, vila de pescadores, com as salinas a sul.", undefined, F.redeBaiaFarta, F.redeMacaca),
      troco(1, "asfalto", "De volta a Benguela pela estrada asfaltada e pela EN100.", "A costa com a luz do meio da tarde.", undefined, F.landersCosta),
      troco(
        1,
        "asfalto",
        "EN100 para norte, pela ponte da Catumbela, até ao Lobito e à ponta da Restinga.",
        "A Restinga, a faixa de areia que fecha a baía do Lobito, e o farol na ponta.",
        "Há controlos policiais com radar entre Benguela e o Lobito (2022).",
        F.landersCosta,
        F.restinga,
      ),
    ],
    dias: 1,
    diasNota: fx(
      "Um dia, como diz o roteiro oficial. São cerca de 110 km, mas as picadas e as paragens na praia é que gastam o tempo. Durma no Lobito ou volte a Benguela, a 30 minutos, antes de escurecer.",
      F.praiasSul,
      F.guiaBenguela,
    ),
    horario: [
      {
        titulo: "Praias do sul e Restinga",
        passos: [
          { hora: "08:00", texto: "Saída de Benguela, de depósito cheio. De manhã há neblina na costa, que costuma levantar por volta das 11h." },
          { hora: "08:45", texto: "Morro do Sombreiro, a pé no fim." },
          { hora: "09:45", texto: "Caotinha: o miradouro e a descida a pé à praia." },
          { hora: "11:15", texto: "Caota e Baía Azul: banho de mar." },
          { hora: "12:45", texto: "Baía Farta: almoço de peixe na vila." },
          { hora: "14:30", texto: "Regresso a Benguela e EN100 para o Lobito." },
          { hora: "15:45", texto: "Restinga do Lobito, até ao farol na ponta." },
          { hora: "17:00", texto: "Jantar e dormida no Lobito, ou regresso a Benguela antes do pôr do sol." },
        ],
      },
    ],
    clima: "lobito",
    combustivel: [
      fx("Benguela: Sonangol na Av. Dr. António Agostinho Neto e Pumangol na EN 260, à saída para sul.", osm("way/1158465899"), osm("way/1180394455")),
      fx("No desvio da Baía Azul: TotalEnergies P.A. Atila, na EN100. Na Baía Farta há um posto sem marca, mapeado em 2017.", osm("way/305523049"), osm("way/299059935")),
      fx(
        "Catumbela: Pumangol e Sonangol. Lobito: Sonangol na Restinga e TotalEnergies na Av. Paulo Dias de Novais.",
        osm("way/235497384"),
        osm("way/235497287"),
        osm("way/284448575"),
        osm("way/284450662"),
      ),
      fx(
        "Em Agosto de 2026 havia escassez generalizada de combustível na província de Benguela: as bombas limitavam a venda e na rua o litro de gasolina custava 800 a 1.000 Kz.",
        F.jaPescadores,
        F.combustivel,
      ),
    ],
    semCombustivel: fx("Menos de 30 km entre postos mapeados: o problema aqui é a escassez, não a distância.", F.osrm, F.jaPescadores),
    comer: [
      lugar("Tudo na Brasa", "Benguela, cerca de 3 km a caminho das praias", "Grelhados (2022 e 2023).", F.landersCosta, F.guiaBenguela),
      lugar("Sal e Brasa", "Benguela, na EN100, à saída para as praias", "", F.guiaBenguela),
      lugar(
        "Restaurantes de peixe",
        "Baía Azul e Baía Farta",
        "Muitos restaurantes de peixe grelhado na Baía Azul (2022) e na vila da Baía Farta (2015).",
        F.landersCosta,
        F.redeMacaca,
      ),
      lugar("Luna Ocean Club, Batuk e D. Bina", "Lobito", "", F.guiaBenguela),
    ],
    dormir: [
      lugar(
        "Hotel Praia Morena, Hotel Luso, Aparthotel Mil Cidades e Hotel Misinga",
        "Benguela",
        "Hotel Praia Morena: Rua José Estevão, 25, telefone +244 949 437 464.",
        F.guiaBenguela,
        F.praiaMorena,
      ),
      lugar("Hotel Duas Faces", "Baía Azul", "O único hotel a poucos metros da praia; telefone +244 922 508 508.", F.guiaBenguela, F.duasFaces),
      lugar("Hotel Terminus e Hotel Turimar", "Lobito, na Restinga", "", F.guiaBenguela),
    ],
    saude: [
      lugar("Hospital Geral de Benguela", "Benguela, Rua 31 de Janeiro", "Em funcionamento em 2026.", F.hospitalBenguela, osm("way/234883654")),
      lugar("Hospital Regional do Lobito", "Lobito", "No OpenStreetMap aparece como Hospital Central do Lobito.", F.hospitalLobito, osm("way/235587551")),
      lugar("Hospital da Baía Farta", "Baía Farta", "120 camas, aberto em 2021.", F.hospitalBaiaFarta),
    ],
    perigos: [
      fx("Picadas para as praias, com tracção precisa no Morro da Caotinha; as praias mais remotas exigem 4×4 e não têm qualquer apoio.", F.praiasSul, F.guiaBenguela),
      fx("Neblina na costa de manhã, até perto das 11h, e vento à tarde (2025).", F.t4a),
      fx(
        "Em Abril de 2026 as cheias do rio Cavaco danificaram a EN100 e a EN260, e em Outubro avisava-se de chuvas acima do normal até Dezembro: confirme o estado das estradas.",
        F.cheiasBenguela,
        F.chuvasBenguela,
      ),
      fx("Controlos policiais com radar entre Benguela e o Lobito, e pedidos de 'água' nos controlos (2022).", F.landersCosta, F.landersDicas),
      NOITE,
    ],
    licencas: [fx("As praias do roteiro oficial não têm entradas pagas, e não há portagens nesta rota.", F.praiasSul)],
    rede: [fx("Em 2022, a internet só se encontrava nas cidades grandes, como Benguela; não encontrámos relatos de cobertura nas praias a sul.", F.landersInfo)],
    motas: [
      fx(
        "Uma mota de estrada faz Benguela, Baía Azul, Baía Farta e Lobito em asfalto. Para o Sombreiro, a Caota e a Caotinha, uma trail com pneus mistos.",
        F.praiasSul,
        osm("way/203452944"),
      ),
    ],
    levar: ["Fato de banho e toalha.", "Calçado para descer a pé à Caotinha.", "Documentos à mão para os controlos Benguela–Lobito."],
    agua: fx("1,5 a 2 litros por pessoa e alguma coisa para comer, como pede o roteiro oficial; nas praias com restaurante compra-se mais.", F.praiasSul),
    grupo: fx(
      "No asfalto faz-se a solo. Nas picadas e nas praias mais remotas (Macaca, Chamume, Chiome), que não têm qualquer apoio, só em grupo.",
      F.guiaBenguela,
    ),
    pontos: [
      ponto("Morro do Sombreiro", -12.58401, 13.299514, "O morro em forma de chapéu; à praia só se chega de barco.", F.sombreiro),
      ponto("Miradouro da Caotinha", -12.597908, 13.275356, "No alto da falésia.", F.caotinhaDB),
      ponto("Caota", -12.603647, 13.265833, "Praia e centro de mergulho.", F.caotaDB),
      ponto("Baía Azul", -12.622648, 13.233142, "3 km de areia.", F.baiaAzul),
      ponto("Praia da Macaca", -12.678787, 13.124337, "A sul da Baía Farta, por picada; só com 4×4.", F.macaca),
      ponto("Praia do Chamume", -12.715043, 13.092322, "Pela picada da Macaca e das salinas.", F.chamume),
      ponto("Praia Morena", -12.58528, 13.39028, "A praia da cidade, com vista para o Sombreiro.", wikidata("Q9060630")),
      ponto("Farol do Lobito", -12.32104, 13.59556, "Na ponta da Restinga.", osm("node/6148579245")),
    ],
  },

  /* ================================================================
     8. A ESTRADA DA COSTA
     ================================================================ */
  {
    slug: "estrada-da-costa",
    nome: "A estrada da costa: de Luanda ao Sul",
    subtitulo: "A grande viagem pela EN100, de Luanda a Moçâmedes",
    regiao: "Luanda · Cuanza Sul · Benguela · Huíla · Namibe",
    provincias: ["Luanda", "Icolo e Bengo", "Cuanza Sul", "Benguela", "Huíla", "Namibe"],
    partida: "Luanda",
    piso: "Asfalto e terra",
    pisoDetalhe:
      "Luanda–Lobito é asfalto, com buracos e um troço muito degradado entre o Kwanza e Cabo Ledo. De Benguela ao Lubango, a EN105 está em obras, com desvios. Pela costa, entre Benguela e Moçâmedes, ainda faltam 46 a 55 km de terra e pedra entre o Cimo e o Catara.",
    exigencia: "Exigente",
    exigenciaPorque: "Quatro dias de estrada, troços degradados e em obras, acidentes graves de madrugada na EN100 e combustível incerto no Sul.",
    melhorEpoca:
      "De Maio a Setembro, o cacimbo: seco na costa e no Sul, com nevoeiro de manhã no litoral que costuma levantar por volta das 11h. Na época das chuvas, os rios do troço costeiro enchem e as pontes por ligar tornam-se um risco.",
    epocaCurta: "Mai–Set",
    resumo:
      "Quatro dias de Luanda a Moçâmedes: a EN100 pela costa até ao Sumbe, ao Lobito e a Benguela, a subida ao planalto pelo Lubango e a descida da Serra da Leba até ao deserto.",
    descricao: [
      "A EN100 tem 1.858 km, de Massabi, em Cabinda, até à foz do Cunene, e é a espinha dorsal de uma viagem de mota pelo litoral. De Luanda ao Lobito são cerca de 510 km, seis a sete horas de carro em asfalto com vários buracos, passando por Cabo Ledo, Porto Amboim e o Sumbe.",
      "Entre Benguela e Moçâmedes a EN100 costeira, pelo Dombe Grande e pela Lucira, ainda não está toda asfaltada: em Agosto de 2026 faltavam cerca de 55 km de terra, com oito pontes por acabar e as obras paradas há anos. Por isso a rota sobe pelo interior: EN105 até ao Lubango e Serra da Leba até ao Namibe.",
      "Em 2025, um ciclista que fez Luanda, Benguela, Lobito, Namibe e a Serra da Leba achou as estradas da costa melhores do que esperava, com nevoeiro de manhã, vento à tarde e água engarrafada à venda sempre a menos de 60 km.",
    ],
    distancias: [
      { texto: "Luanda–Lobito: cerca de 510 km, 6 a 7 horas", fonte: F.landersCosta },
      { texto: "Luanda–Sumbe: 330 km, 4 a 5 horas", fonte: F.landersCosta },
      { texto: "Sumbe: 180 km a norte do Lobito", fonte: F.landersCosta },
      { texto: "Lubango–Benguela: cerca de 360 km, 5h30, com buracos (2022)", fonte: F.landersCosta },
      { texto: "Moçâmedes–Benguela: cerca de 6 horas pela Lucira ou 5h30 pelo Lubango (2022)", fonte: F.landersCosta },
    ],
    destaques: [
      "Miradouro da Lua, ponte do Kwanza e Cabo Ledo no primeiro dia",
      "Porto Amboim, o Sumbe e as Grutas da Sassa",
      "Lobito, Catumbela e Benguela",
      "A subida ao Lubango e a descida da Serra da Leba",
    ],
    dicas: [
      "Abasteça sempre que puder e leve reserva: em 2026 houve falta de combustível em Benguela, na Huíla e no Namibe, e em Agosto o Governo admitiu uma crise em todo o país.",
      "Não rode de madrugada nem de noite: os acidentes graves de 2025 e 2026 na EN100 foram ao amanhecer, com nevoeiro, e há assaltos nocturnos perto do Sumbe.",
      "Planeie etapas curtas e chegue antes de escurecer: fora das cidades os socorros demoram e os cuidados de saúde são limitados.",
      "Pela costa Benguela–Lucira–Moçâmedes, só com trail, experiência em terra, tempo seco e combustível para mais de 300 km.",
    ],
    fontes: [F.ptEN100, F.landersCosta, F.wikiEN100, F.t4a, F.combustivel, F.combustivel2, F.en100Obras, F.fcdo, F.fcdoSaude, F.en100Costa],

    paragens: [
      LUANDA,
      { nome: "Cabo Ledo", lat: -9.65567, lng: 13.23889, fonte: osm("node/2007727658") },
      { nome: "Porto Amboim", lat: -10.72791, lng: 13.7579, fonte: osm("node/352680227") },
      { nome: "Sumbe", lat: -11.20194, lng: 13.83968, fonte: osm("node/331385964") },
      { nome: "Lobito", lat: -12.35069, lng: 13.54643, fonte: osm("node/279010461") },
      { nome: "Benguela", lat: -12.579, lng: 13.40371, fonte: osm("node/331385969") },
      { nome: "Quilengues", lat: -14.07307, lng: 14.07217, fonte: osm("way/1092178229") },
      LUBANGO,
      MIRADOURO_LEBA,
      MOCAMEDES,
    ],
    trocos: [
      troco(
        1,
        "buracos",
        "EN100 para sul, pelo Miradouro da Lua, pela ponte do Kwanza (portagem) e pela Quiçama até Cabo Ledo.",
        "O Miradouro da Lua, a foz do Kwanza e a savana da Quiçama.",
        "Entre a ponte e Cabo Ledo a EN100 é especialmente perigosa e estava muito degradada em 2025. Em 2026 houve acidentes graves em Cabo Ledo, um deles de madrugada com nevoeiro.",
        F.comunidades,
        F.en100Degradada,
        F.caboLedoMarco,
        F.jaCaboLedoNevoeiro,
      ),
      troco(
        1,
        "asfalto",
        "EN100 pela ponte do rio Longa até Porto Amboim.",
        "A costa do Cuanza Sul e a foz do Longa.",
        "Cerca de 110 km sem posto mapeado entre Cabo Ledo e a Sonangol do Longa. Em Agosto de 2025 houve um acidente mortal junto a Porto Amboim, de madrugada, com neblina.",
        osm("way/747913780"),
        osm("way/173258206"),
        F.jaPortoAmboim,
      ),
      troco(
        1,
        "asfalto",
        "EN100 pela ponte do rio Queve (Cuvo) até ao Sumbe.",
        "A ponte do Queve e a chegada ao Sumbe pelo Morro do Chingo.",
        "Houve assaltos nocturnos a autocarros entre a ponte do Keve e a Pumangol de Porto Amboim e no Morro do Chingo, a norte do Sumbe (2024): não ande aqui de noite.",
        osm("way/79585750"),
        F.assaltosEN100,
      ),
      troco(
        2,
        "asfalto",
        "EN100 pelo Quicombo, pelo rio Dui e pela Canjala até ao Lobito.",
        "A Praia do Kicombo e a costa a sul do Sumbe.",
        "Gado na estrada: em 2025 aumentaram os acidentes com gado no troço Sumbe–Lobito. Em Agosto de 2026 um autocarro chocou com uma mota carregada de combustível perto do Sumbe, de madrugada. Assaltos nocturnos no Morro da Comarca, a sul do Sumbe (2024).",
        F.gadoEN100,
        F.quibaula,
        F.assaltosEN100,
        F.kicombo,
      ),
      troco(2, "asfalto", "EN100 pela ponte da Catumbela até Benguela.", "O Lobito, a Catumbela e Benguela.", "Controlos policiais com radar entre o Lobito e Benguela (2022).", F.landersCosta),
      troco(
        3,
        "buracos",
        "EN105 por Catengue e Chongoroi até Quilengues.",
        "A subida da costa para o interior, longe do mar.",
        "A EN105 está em obras de reabilitação (53 % em Julho de 2026): conte com desvios e troços de terra.",
        F.en105,
      ),
      troco(
        3,
        "buracos",
        "EN105 por Cacula até ao Lubango; o troço da Huíla é o mais degradado e tem conclusão prevista para Dezembro de 2026.",
        "A chegada ao planalto e ao Lubango, a cerca de 1.750 m.",
        "Cerca de 90 km sem posto mapeado entre Cacula e o Lubango.",
        F.en105,
        osm("node/2266863113"),
      ),
      troco(4, "asfalto", "EN-280 pela Humpata até ao alto da serra.", "O planalto da Humpata e o miradouro da Leba.", "Abasteça na Humpata: é o último posto mapeado antes da descida.", osm("way/944907361")),
      troco(
        4,
        "buracos",
        "A descida da Leba e a EN-280 pelo Caraculo até Moçâmedes.",
        "O ziguezague da Leba e o deserto até ao mar.",
        "Em Abril de 2026 a serra foi interditada temporariamente depois de um incidente, e em Maio foram autorizadas obras de emergência nas ravinas: confirme antes de sair.",
        F.jaLebaFechada,
        F.jaLebaRavinas,
        F.redeLeba,
      ),
    ],
    dias: 4,
    diasNota: fx(
      "Quatro dias, a dormir no Sumbe, em Benguela e no Lubango. Quem tiver mais tempo junta um dia em Benguela para as praias e outro no Namibe para o deserto.",
      F.landersCosta,
    ),
    horario: [
      {
        titulo: "Luanda–Sumbe",
        passos: [
          { hora: "07:00", texto: "Saída de Luanda, já com luz e de depósito cheio." },
          { hora: "09:15", texto: "Cabo Ledo: abasteça no posto à entrada." },
          { hora: "11:30", texto: "Sonangol do Longa: abasteça." },
          { hora: "12:30", texto: "Porto Amboim: almoço no Restaurante Farol, na marginal." },
          { hora: "14:30", texto: "Saída para o Sumbe." },
          { hora: "15:45", texto: "Sumbe. Se houver tempo, as Grutas da Sassa." },
        ],
      },
      {
        titulo: "Sumbe–Benguela",
        passos: [
          { hora: "08:00", texto: "Saída do Sumbe, depois de a neblina levantar um pouco." },
          { hora: "10:00", texto: "Canjala: abasteça." },
          { hora: "11:45", texto: "Lobito: almoço e a Restinga." },
          { hora: "15:00", texto: "EN100 pela Catumbela." },
          { hora: "15:45", texto: "Benguela: fim de tarde na Praia Morena." },
        ],
      },
      {
        titulo: "Benguela–Lubango",
        passos: [
          { hora: "07:00", texto: "Saída de Benguela, de depósito cheio." },
          { hora: "08:45", texto: "Catengue: abasteça." },
          { hora: "11:00", texto: "Quilengues: abasteça e almoce." },
          { hora: "12:00", texto: "EN105 para a Cacula e o Lubango, com obras." },
          { hora: "14:45", texto: "Lubango." },
        ],
      },
      {
        titulo: "Lubango–Moçâmedes pela Leba",
        passos: [
          { hora: "07:30", texto: "Saída do Lubango." },
          { hora: "08:15", texto: "Humpata: abasteça." },
          { hora: "08:45", texto: "Miradouro da Leba e descida da serra." },
          { hora: "11:30", texto: "Caraculo." },
          { hora: "12:30", texto: "Moçâmedes." },
        ],
      },
    ],
    clima: "lobito",
    combustivel: [
      fx(
        "Luanda–Cabo Ledo: Pumangol em Ramiros, Sonangalp na ponte do Kwanza, TotalEnergies em Sangano e um posto à entrada de Cabo Ledo.",
        osm("node/4245044891"),
        osm("way/305030429"),
        osm("way/1130639509"),
        osm("way/496339360"),
      ),
      fx(
        "Sonangol entre o Longa e Porto Amboim; Pumangol e Sonangalp em Porto Amboim; Pumangol e TotalEnergies no Sumbe; TotalEnergies na Canjala.",
        osm("way/747913780"),
        osm("way/1053081551"),
        osm("way/1052730719"),
        osm("way/910282359"),
        osm("node/2018012124"),
      ),
      fx(
        "Interior: TotalEnergies em Catengue, Sonangol em Chongoroi e em Quilengues, um posto em Cacula, muitos no Lubango e a Sonangol da Humpata.",
        osm("way/705440155"),
        osm("way/954452772"),
        osm("way/1092178229"),
        osm("node/2266863113"),
        osm("way/944907361"),
      ),
      fx(
        "Pela costa: postos no Dombe Grande e uma Pumangol 5 km a sul da Lucira, que não confirmámos estar a funcionar. Entre os dois, nenhum.",
        osm("node/4347552702"),
        osm("way/682372422"),
        F.guiaBenguela,
      ),
      fx("Em 2026 houve falta de combustível na Huíla em Abril e em Benguela, na Huíla e no Namibe de Maio a Agosto.", F.combustivel, F.jaPescadores, F.filasHuila),
    ],
    semCombustivel: fx(
      "Cerca de 110 km entre Cabo Ledo e a Sonangol do Longa; no interior, cerca de 94 km entre a Humpata e o Caraculo. Pela costa, se a Pumangol da Lucira não funcionar, são cerca de 334 km do Dombe Grande a Moçâmedes.",
      F.osrm,
      osm("way/747913780"),
      osm("way/682372422"),
    ),
    comer: [
      lugar("Restaurante Farol e Restaurante Mindelo", "Porto Amboim, na marginal", "Farol: telefone +244 933 221 405 (2022).", F.guiaPortoAmboim),
      lugar("Luna Ocean Club, Batuk e D. Bina", "Lobito", "", F.guiaBenguela),
      lugar("Tudo na Brasa e Sal e Brasa", "Benguela", "", F.guiaBenguela),
      lugar("Água e comida pelo caminho", "Toda a costa", "Em 2025 havia água engarrafada à venda sempre a menos de 60 km.", F.t4a),
    ],
    dormir: [
      lugar("Carpe Diem, Doce Mar ou Queiroz Point", "Cabo Ledo", "Para quem quiser parar mais cedo no primeiro dia.", F.got2CaboLedo, F.doceMar, F.queirozPoint),
      lugar("Hotel Ritz Sumbe e Hotel Kalunda", "Sumbe", "", F.ritzSumbe, F.kalundaSumbe),
      lugar("Hotel Praia Morena, Hotel Luso e outros", "Benguela", "", F.guiaBenguela),
      lugar("Pululukwa, Casper Resort, Serra da Chela e Kimbo do Soba", "Lubango", "", F.guiaLubango, F.visiteHuilaAlojamento),
      DORMIR_MOCAMEDES,
    ],
    saude: [
      lugar("Cabo Ledo", "Primeiro dia", "Sem hospital: em Agosto de 2026 os feridos graves de um acidente foram levados para o Hospital Pedalé, em Luanda.", F.jaCaboLedoNevoeiro),
      lugar("Hospital Geral do Cuanza Sul Raúl Díaz Argüelles", "Sumbe", "Inaugurado em 2024, com urgência e cuidados intensivos.", F.hospitalSumbe, osm("way/1441673118")),
      lugar("Hospital Geral de Benguela", "Benguela", "", F.hospitalBenguela, osm("way/234883654")),
      lugar("Hospital Municipal de Quilengues", "Quilengues", "", osm("node/13273488585")),
      HOSPITAL_LUBANGO,
      HOSPITAL_NAMIBE,
    ],
    perigos: [
      fx(
        "Os acidentes graves na EN100 de 2025 e 2026 foram de madrugada, com nevoeiro e asfalto escorregadio. O troço Cabo Ledo–Ramiros vai ser duplicado a partir de 2027.",
        F.jaCaboLedoNevoeiro,
        F.jaPortoAmboim,
        F.duplicacaoEN100,
      ),
      fx("Gado na estrada entre o Sumbe e o Lobito, e motas carregadas de bidões de combustível.", F.gadoEN100, F.quibaula),
      fx("Assaltos nocturnos no Morro da Comarca e no Morro do Chingo, perto do Sumbe, e em Porto Amboim (2024).", F.assaltosEN100),
      fx("Obras na EN105 entre Benguela e o Lubango, com desvios (2026).", F.en105),
      fx(
        "Pela costa, entre o Cimo e o Catara: 46 a 55 km de terra e pedra, pontes por ligar ao asfalto e rios que enchem na época das chuvas; em 2021 um 4×4 levou 4h30 a fazer o troço de 109 km e só se cruzou com três carros.",
        F.en100Costa,
        F.en100CostaPontes,
        F.lucira2021,
      ),
      NOITE,
    ],
    licencas: [
      PORTAGEM_KWANZA,
      fx("Atravessar a Quiçama pela EN100 não paga entrada: é estrada pública (2022).", F.landersCosta),
      fx("Quedas do Binga, perto do Sumbe: 250 Kz por pessoa (2022).", F.landersCosta),
    ],
    rede: [
      fx(
        "Em 2022, a internet só se encontrava nas cidades grandes. Não encontrámos dados para o troço costeiro Dombe Grande–Lucira: conte com zonas sem rede.",
        F.landersInfo,
        F.lucira2021,
      ),
    ],
    motas: [
      fx(
        "Pelo interior, uma mota de estrada faz o percurso com cuidado nos buracos e nas obras; uma trail ou uma maxi-trail é mais confortável em quatro dias. Pela costa, Dombe Grande–Lucira, só trail e com experiência em terra.",
        F.en105,
        F.en100Costa,
      ),
    ],
    levar: [
      "Jerricã de combustível.",
      "Roupa quente para o planalto do Lubango e roupa leve para a costa.",
      "Kwanzas trocados para a portagem do Kwanza.",
      "Documentos à mão: há controlos em todas as províncias.",
    ],
    agua: fx("2 litros por pessoa por dia; na costa há água engarrafada à venda sempre a menos de 60 km (2025).", F.t4a),
    grupo: fx("Viagem longa: em grupo, com alguém a fechar, e sempre de dia. Pelo troço costeiro da Lucira, nunca sozinho.", F.fcdo, F.lucira2021),
    pontos: [
      ponto("Ponte do rio Longa", -10.19823, 13.52097, "Na EN100, a sul de Cabo Ledo.", osm("way/173258206")),
      ponto("Ponte do rio Queve (Cuvo)", -10.87402, 13.8402, "Entre Porto Amboim e o Sumbe.", osm("way/79585750")),
      ponto("Quedas do Binga", -10.98705, 14.09336, "Pela EN240, a norte do Sumbe; 250 Kz em 2022.", osm("node/6997961559"), F.landersCosta),
      ponto("Grutas da Sassa", -11.25861, 13.89209, "Descida de cerca de 100 m num caminho de 2 km.", osm("node/5410320961"), F.landersCosta),
      ponto("Praia do Kicombo", -11.318358, 13.810867, "A sul do Sumbe.", F.kicombo),
      ponto("Restinga do Lobito", -12.316125, 13.58397, "A faixa de areia que fecha a baía.", F.restingaHa),
      ponto("Cimo", -13.33424, 12.93513, "Início do troço de terra na costa.", osm("node/6344752925")),
      ponto("Catara", -13.55792, 12.642, "Fim do troço de terra na costa.", osm("node/6344693866")),
      ponto("Miradouro da Leba", -15.07679, 13.23488, "O ziguezague inteiro.", osm("node/2266863069")),
    ],
  },
];
