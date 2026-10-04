/* ============================================================
   MOTOBOX — Fontes das rotas de moto-turismo

   Cada facto das rotas aponta para uma destas fontes. As datas
   no nome são as da publicação (ou da viagem, nos relatos), para
   quem lê saber se a informação é recente. Os elementos do
   OpenStreetMap (postos, hospitais, pontos) citam-se um a um com
   `osm()`; na lista de fontes de cada rota aparecem juntos.
   ============================================================ */

import type { Facto, FonteRota, Lugar, Ponto } from "@/lib/rotas";

/** Um elemento do OpenStreetMap: "node/123", "way/456". */
export const osm = (id: string): FonteRota => ({ nome: `OpenStreetMap (${id})`, url: `https://www.openstreetmap.org/${id}` });

export const wikidata = (q: string): FonteRota => ({ nome: `Wikidata (${q})`, url: `https://www.wikidata.org/wiki/${q}` });

export const fx = (texto: string, ...fontes: FonteRota[]): Facto => ({ texto, fontes });

export const lugar = (nome: string, onde: string, nota: string, ...fontes: FonteRota[]): Lugar => ({ nome, onde, nota, fontes });

export const ponto = (nome: string, lat: number, lng: number, nota: string, ...fontes: FonteRota[]): Ponto => ({
  nome,
  lat,
  lng,
  nota,
  fontes,
});

export const F = {
  /* ---------------- Ferramentas e dados abertos ---------------- */
  osm: { nome: "OpenStreetMap: postos, hospitais e pontos mapeados (Out. 2026)", url: "https://www.openstreetmap.org/copyright" },
  osrm: { nome: "OSRM: distâncias e tempos de carro sobre o OpenStreetMap", url: "https://project-osrm.org/" },
  srtm: { nome: "OpenTopoData: altitudes do modelo SRTM de 30 m", url: "https://www.opentopodata.org/datasets/srtm/" },
  googleUrls: { nome: "Google: Maps URLs (Set. 2026)", url: "https://developers.google.com/maps/documentation/urls/get-started" },

  /* ---------------- Avisos de viagem e emergência ---------------- */
  fcdo: { nome: "FCDO (Reino Unido): Angola, segurança", url: "https://www.gov.uk/foreign-travel-advice/angola/safety-and-security" },
  fcdoSaude: { nome: "FCDO (Reino Unido): Angola, saúde", url: "https://www.gov.uk/foreign-travel-advice/angola/health" },
  fcdoAjuda: { nome: "FCDO (Reino Unido): Angola, ajuda e números de emergência (Mai. 2026)", url: "https://www.gov.uk/foreign-travel-advice/angola/getting-help" },
  eua: {
    nome: "Departamento de Estado dos EUA: aviso de viagem para Angola (Mar. 2026)",
    url: "https://web.archive.org/web/20260709012534/https://travel.state.gov/en/international-travel/travel-advisories/angola.html",
  },
  canada: { nome: "Governo do Canadá: viajar para Angola (Mai. 2026)", url: "https://travel.gc.ca/destinations/angola" },
  comunidades: {
    nome: "Portal das Comunidades (Portugal): conselhos para Angola (Abr. 2026)",
    url: "https://portaldascomunidades.mne.gov.pt/pt/vai-viajar/conselhos-aos-viajantes/africa/angola",
  },
  rna111: {
    nome: "RNA: em emergência, ligar para o 111 (Nov. 2024)",
    url: "https://rna.ao/rna.ao/2024/11/28/servico-de-proteccao-civil-e-bombeiros-alerta-que-em-caso-de-emergencias-medicas-policiais-ou-de-incendio-os-cidadaos-devem-ligar-para-o-111/",
  },
  nj113: {
    nome: "Novo Jornal: o 113 deixou de funcionar, o 111 é o novo número (2020)",
    url: "https://www.novojornal.co.ao/sociedade/detalhe/terminal-113-deixou-de-estar-ao-servico-do-cidadao---111-e-o-novo-numero-de-emergencia-policial-23093.html",
  },
  cdc: { nome: "CDC: Angola, saúde do viajante (Ago. 2026)", url: "https://wwwnc.cdc.gov/travel/destinations/traveler/none/angola" },

  /* ---------------- Leis, documentos e estrada ---------------- */
  codigo: { nome: "Código de Estrada de Angola", url: "https://angolex.com/paginas/codigos/codigo-de-estrada.html" },
  codigoDnvt: {
    nome: "Código de Estrada (Decreto-Lei 5/08), edição da DNVT",
    url: "https://web.archive.org/web/20170809085412/http://www.dnvt.gov.ao:80/wp-content/uploads/2016/04/codigoestrada.pdf",
  },
  cartas: { nome: "Polícia Nacional (DTSER): carta de condução", url: "https://www.dtser.pn.gov.ao/ao/perguntas-frequentes/carta-de-conducao/" },
  tituloVeiculo: {
    nome: "Angola24horas: Título do Veículo junta livrete e título de propriedade (Set. 2023)",
    url: "https://www.angola24horas.com/sociedade/item/27971-angola-lanca-titulo-do-veiculo-em-sete-provincias",
  },
  seguro: {
    nome: "Decreto n.º 35/09: seguro automóvel obrigatório (ARSEG)",
    url: "https://web.archive.org/web/20180716100324/http://www.arseg.ao/images/stories/Decreto_n35-09.pdf",
  },
  gasosa: {
    nome: "Angola24horas: o MININT admite extorsão por agentes (Set. 2025)",
    url: "https://www.angola24horas.com/sociedade/item/32805-minint-admite-que-extorsao-e-corrupcao-praticadas-por-agentes",
  },
  sinistralidade: {
    nome: "Angola24horas: nove mortos por dia na estrada (Set. 2025)",
    url: "https://www.angola24horas.com/sociedade/item/32770-nove-angolanos-morrem-por-dia-na-estrada-governo-fala-em-crise-de-seguranca",
  },
  minas: { nome: "Landmine Monitor: Angola (Fev. 2026)", url: "https://the-monitor.org/country-profile/angola/impact" },
  halo: { nome: "HALO Trust: Angola", url: "https://www.halotrust.org/where-we-work/africa/angola/" },
  metzeler: { nome: "Metzeler: pressão e segurança dos pneus", url: "https://www.metzeler.com/en-gb/tech-and-tips/pressure-safety-maintenance" },

  /* ---------------- Combustível e rede móvel ---------------- */
  combustivel: {
    nome: "Mercado: Sonangol admite constrangimentos em Benguela, Huíla e Namibe (Mai. 2026)",
    url: "https://mercado.co.ao/sonangol-garante-que-nao-ha-escassez-de-combustivel-mas-admite-constrangimentos-no-centro-e-sul-do-pais/",
  },
  combustivel2: { nome: "DNotícias: situação do combustível (Ago. 2026)", url: "https://www.dnoticias.pt/2026/8/6/501595-angola-enfrenta-situacao-preocupante-de-escassez-de-combustivel/" },
  criseCombustivel: {
    nome: "Forbes África Lusófona: Governo admite crise de combustível em todo o país (Ago. 2026)",
    url: "https://forbesafricalusofona.com/governo-angolano-admite-crise-de-combustivel-em-todo-o-pais-com-a-sonangol-a-enfrentar-dificuldades-financeiras-para-o-abastecimento/",
  },
  filasHuila: {
    nome: "Correio da Kianda: filas de combustível na Huíla (Ago. 2026)",
    url: "https://correiokianda.info/escassez-de-combustivel-faz-disparar-precos-dos-transportes-na-huila/",
  },
  precoGasoleo: {
    nome: "Mercado: gasóleo sobe para 420 Kz (Jun. 2026)",
    url: "https://mercado.co.ao/governo-aumenta-preco-do-gasoleo-para-420-kwanzas-taxistas-garantem-que-preco-das-corridas-nao-sobe/",
  },
  precoGasolina: {
    nome: "Mercado: gasolina a 300 Kz (Set. 2026)",
    url: "https://mercado.co.ao/angola-entre-os-paises-com-combustivel-mais-barato-malawi-continua-no-topo-dos-mais-caros/",
  },
  africell: {
    nome: "Mercado: Africell passa os sete milhões de clientes (Jul. 2026)",
    url: "https://mercado.co.ao/africell-angola-ultrapassa-sete-milhoes-de-clientes-menos-de-cinco-anos-apos-entrada-no-mercado/",
  },
  unitel: { nome: "Mercado: os sete dias que abalaram a Unitel (2026)", url: "https://mercado.co.ao/do-ataque-a-normalizacao-os-sete-dias-que-abalaram-a-unitel/" },

  /* ---------------- Relatos de viagem ---------------- */
  t4a: { nome: "Tracks4Africa: bikepacking em Angola (2025)", url: "https://blog.tracks4africa.co.za/what-its-like-bikepacking-angola/" },
  landersCosta: {
    nome: "African Landers: a costa de Angola (viagem de Jan. 2022)",
    url: "https://africanlanders.com/en/angola-en/angola-the-coast-of-angola-tombua-namibe-praia-do-soba-and-piambo-benguela-and-lobito-sumbe-cabo-ledo-barra-do-kwanza-and-miradouro-da-lua-luanda-praia-do-sarico-and-barra-do-dande/",
  },
  landersMalanje: {
    nome: "African Landers: Malanje, Calandula e Pungo Andongo (viagem de Jan. 2022)",
    url: "https://africanlanders.com/en/angola-en/angola-the-region-of-malanje-calandula-falls-and-pungo-andongo/",
  },
  landersDicas: { nome: "African Landers: dicas para conduzir em Angola (Jun. 2022)", url: "https://africanlanders.com/en/info-en/angola-driving-tips/" },
  landersInfo: {
    nome: "African Landers: informação prática sobre Angola (Jun. 2022)",
    url: "https://africanlanders.com/en/angola-en/angola-practical-information-and-its-essentials/",
  },
  euronews: { nome: "Euronews: os motards que percorrem Angola (2021)", url: "https://www.euronews.com/2021/03/10/the-bikers-making-angola-the-ride-of-their-lives" },
  aventuraMoto: { nome: "Hotéis Angola: uma aventura de mota em Angola (2019)", url: "https://www.hoteisangola.com/en/artigo-viajante/uma-aventura-moto-angola.html" },
  rogue: { nome: "Rogue Wanderers: Angola (2023)", url: "https://www.roguewanderers.com/blog/angola" },
  rok: { nome: "Rok Around The World: sul de Angola (Jul. 2025)", url: "https://rokaroundtheworld.com/southern-angola/" },
  goneBike: { nome: "Gone Bike About: Angola de bicicleta (2022)", url: "https://gonebikeabout.com/angola/" },
  wildImages: { nome: "Wild Images: relatório da viagem ao sul de Angola (2024)", url: "https://www.wildimages-phototours.com/reports/angola-hidden-tribes-of-the-south-tour-report-2024/" },
  soulTonic6: { nome: "Soul Tonic Life (YouTube): episódio 6, Iona (Set. 2025)", url: "https://www.youtube.com/watch?v=cp_l9EAco-Q" },
  soulTonic8: { nome: "Soul Tonic Life (YouTube): episódio 8, Tômbwa (2025)", url: "https://www.youtube.com/watch?v=4WybYYtXDcg" },
  soulTonic9: { nome: "Soul Tonic Life (YouTube): episódio 9, Namibe e Leba (Nov. 2025)", url: "https://www.youtube.com/watch?v=_yVrtkRXoIM" },
  soulTonic10: { nome: "Soul Tonic Life (YouTube): episódio 10, Tundavala (Nov. 2025)", url: "https://www.youtube.com/watch?v=-QzeoBHijnM" },
  africa4x4ep4: { nome: "Africa 4x4 Adventures (YouTube): episódio 4, Iona (Jul. 2025)", url: "https://www.youtube.com/watch?v=O4Mi79oM6bU" },
  africa4x4ep5: { nome: "Africa 4x4 Adventures (YouTube): episódio 5 (Jul. 2025)", url: "https://www.youtube.com/watch?v=TYAU_dAhMRg" },
  africa4x4ep6: { nome: "Africa 4x4 Adventures (YouTube): episódio 6, Lubango e Leba (Ago. 2025)", url: "https://www.youtube.com/watch?v=DzO7l8afxl8" },
  rideMeFive: { nome: "Ride Me Five (YouTube): E80, Caraculo (Set. 2026)", url: "https://www.youtube.com/watch?v=G1dybhTZv3E" },
  dosRuedas: { nome: "2RuedasXelmundo (YouTube): sul de Angola de mota (Jun. 2023)", url: "https://www.youtube.com/watch?v=-ihOwjj0E2g" },
  flyingFlags: { nome: "Flying Flags (YouTube): Lubango (Out. 2024)", url: "https://www.youtube.com/watch?v=pR9PEn6wdyU" },
  mozAdventure: { nome: "Mozambique Adventure Team (YouTube): Tundavala, Leba e Namibe num dia (Jul. 2024)", url: "https://www.youtube.com/watch?v=VJhOCq-V8KA" },
  tripLeba: {
    nome: "Tripadvisor: Serra da Leba, comentários (Mar. 2024)",
    url: "https://www.tripadvisor.com/Attraction_Review-g670166-d6922713-Reviews-Serra_da_Leba-Lubango_Huila_Province.html",
  },

  /* ---------------- Jornal de Angola ---------------- */
  jaLebaFechada: {
    nome: "Jornal de Angola: circulação na Serra da Leba temporariamente interdita (Abr. 2026)",
    url: "https://www.jornaldeangola.ao/noticias/2/regi%C3%B5es/673311/circula%C3%A7%C3%A3o-rodovi%C3%A1ria-na-serra-da-leba-temporariamente-interdita",
  },
  jaLebaPolicia: {
    nome: "Jornal de Angola: a polícia apela à prudência na Serra da Leba (Jul. 2025)",
    url: "https://www.jornaldeangola.ao/noticias/2/regi%C3%B5es/642753/circula%C3%A7%C3%A3o-na-serra-da-leba--pn-apela-%C3%A0-prud%C3%AAncia-aos-automibilistas-locais",
  },
  jaLebaAcidente: {
    nome: "Jornal de Angola: acidente na estrada da Serra da Leba (Jul. 2025)",
    url: "https://www.jornaldeangola.ao/noticias/3/sociedade/642487/acidente-mata-15-pessoas-e-fere-23-na-estrada-da-serra-da-leba",
  },
  jaLebaNevoeiro: {
    nome: "Jornal de Angola: circulação reposta na Serra da Leba (Nov. 2024)",
    url: "https://www.jornaldeangola.ao/noticias/3/sociedade/622360/circula%C3%A7%C3%A3o-de-ve%C3%ADculos--reposta-na-serra-da-leba",
  },
  jaMiradouros: {
    nome: "Jornal de Angola: Tundavala e Leba vão ganhar miradouros (Jun. 2026)",
    url: "https://www.jornaldeangola.ao/noticias/1/pol%C3%ADtica/679503/fenda-da-tundavala-e-serra-da-leba-v%C3%A3o-ganhar-miradouros-panor%C3%A2micos",
  },
  jaTundavalaHotel: {
    nome: "Jornal de Angola: a Fenda da Tundavala ganha unidade hoteleira (Ago. 2026)",
    url: "https://www.jornaldeangola.ao/noticias/4/economia/682496/fenda-da-tundavala--ganha-unidade-hoteleira",
  },
  jaHumpata: {
    nome: "Jornal de Angola: um passeio pela Humpata e pelo Lubango (Jul. 2025)",
    url: "https://www.jornaldeangola.ao/noticias/2/regi%C3%B5es/643358/um-passeio-pelas-belezas-naturais--da-humpata-e-do-lubango",
  },
  jaFilasLubango: {
    nome: "Jornal de Angola: Huíla e Uíge com escassez de combustível (Set. 2025)",
    url: "https://www.jornaldeangola.ao/noticias/3/sociedade/646273/prov%C3%ADncias-da-hu%C3%ADla-e-do-u%C3%ADge-registam-escassez-de-combust%C3%ADvel",
  },
  jaTombwaChuva: {
    nome: "Jornal de Angola: chuvas condicionam o troço Moçâmedes–Tômbwa (Mar. 2026)",
    url: "https://www.jornaldeangola.ao/noticias/2/regi%C3%B5es/672782/chuvas-condicionam-circula%C3%A7%C3%A3o-no-tro%C3%A7o-mo%C3%A7%C3%A2medes-t%C3%B4mbwa",
  },
  jaArco: {
    nome: "Jornal de Angola: soba pede atenção à zona do Arco (Jan. 2026)",
    url: "https://www.jornaldeangola.ao/noticias/2/regi%C3%B5es/656555/soba-defende-maior-aten%C3%A7%C3%A3o-%C3%A0-zona-do-arco-do-t%C3%B4mbwa",
  },
  jaVirei: {
    nome: "Jornal de Angola: carência de combustível no Virei (Nov. 2025)",
    url: "https://www.jornaldeangola.ao/noticias/4/economia/651236/car%C3%AAncia-de-combust%C3%ADvel-afecta-produ%C3%A7%C3%A3o-agr%C3%ADcola",
  },
  jaIona: {
    nome: "Jornal de Angola: o Parque Nacional do Iona atrai turistas (Jan. 2025)",
    url: "https://www.jornaldeangola.ao/noticias/2/regi%C3%B5es/626058/parque-nacional-do-iona--atrai-turistas-para-o-pa%C3%ADs",
  },
  jaLebaRavinas: {
    nome: "Jornal de Angola: obras de emergência nas ravinas da Serra da Leba (Mai. 2026)",
    url: "https://www.jornaldeangola.ao/noticias/3/sociedade/675691/presidente-da-rep%C3%BAblica-autoriza-reabilita%C3%A7%C3%A3o-da-estrada-entre-sacomar-e-mo%C3%A7%C3%A2medes",
  },
  jaPescadores: {
    nome: "Jornal de Angola: escassez de combustível em Benguela (Ago. 2026)",
    url: "https://www.jornaldeangola.ao/noticias/4/economia/683267/pescadores-paralisados-por-falta-de-combust%C3%ADvel",
  },
  jaCaboLedoNevoeiro: {
    nome: "Jornal de Angola: acidente em Cabo Ledo com nevoeiro (Ago. 2026)",
    url: "https://jornaldeangola.ao/noticias/3/sociedade/682796/acidente-de-via%C3%A7%C3%A3o-em-cabo-ledo-causa-v%C3%A1rios-feridos-",
  },
  jaPortoAmboim: {
    nome: "Jornal de Angola: acidente em Porto Amboim com neblina (Ago. 2025)",
    url: "https://www.jornaldeangola.ao/noticias/3/sociedade/646099/acidente-de-via%C3%A7%C3%A3o--causa-tr%C3%AAs-mortes",
  },
  jaHospitalTombwa: {
    nome: "Jornal de Angola: primeira pedra do Hospital do Tômbwa (Mai. 2026)",
    url: "https://www.jornaldeangola.ao/noticias/2/regi%C3%B5es/676707/colocada-primeira-pedra-para-constru%C3%A7%C3%A3o-do-hospital-do-t%C3%B4mbwa",
  },

  /* ---------------- Serra da Leba e Tundavala ---------------- */
  redeLeba: { nome: "Rede Angola: Serra da Leba", url: "https://www.redeangola.info/roteiros/serra-da-leba/" },
  dangerousLeba: { nome: "Dangerous Roads: Serra da Leba Pass", url: "https://www.dangerousroads.org/africa/angola/2730-serra-da-leba-pass.html" },
  visiteLeba: { nome: "Visite Huíla: Miradouro da Leba", url: "https://visitehuila.com/en/turismo/locais-interesse/humpata/miradouro-leba.html" },
  wikiLeba: { nome: "Wikipedia: Serra da Leba", url: "https://en.wikipedia.org/wiki/Serra_da_Leba" },
  wikiEN280: { nome: "Wikipédia: EN-280", url: "https://pt.wikipedia.org/wiki/EN-280" },
  nitLeba: {
    nome: "NiT: Serra da Leba (Mar. 2025)",
    url: "https://www.nit.pt/fora-de-casa/viagens/serra-de-leba-uma-das-estradas-mais-emblematicas-e-desafiantes-de-angola-tem-30-curvas",
  },
  got2Leba: { nome: "Got2Globe: Serra da Leba", url: "https://www.got2globe.com/editorial/serra-leba-estrada-namibe-huila-angola/" },
  coimbraLeba: { nome: "Universidade de Coimbra: estudo da estrada da Leba (2016)", url: "https://estudogeral.uc.pt/handle/10316/98882" },
  ptHumpata: { nome: "Wikipédia: Humpata", url: "https://pt.wikipedia.org/wiki/Humpata" },
  wikiLubango: { nome: "Wikipedia: Lubango (clima)", url: "https://en.wikipedia.org/wiki/Lubango" },
  ptLubango: { nome: "Wikipédia: Lubango", url: "https://pt.wikipedia.org/wiki/Lubango" },
  visiteHuilaAlojamento: { nome: "Visite Huíla: directório de alojamento", url: "https://visitehuila.com/directorio/alojamento/" },
  zoomsLodge: { nome: "Visite Huíla: Zoom's Lodge (Humpata)", url: "https://visitehuila.com/directorio/alojamento/zooms-lodge.html" },
  casper: { nome: "Casper Resort, Lubango", url: "https://www.casperresort.com/" },
  sagradaLubango: { nome: "Clínica Sagrada Esperança: Lubango", url: "https://clinicasagradaesperanca.co.ao/unidade/lubango" },
  wikiTundavala: { nome: "Wikipedia: Tundavala Gap", url: "https://en.wikipedia.org/wiki/Tundavala_Gap" },
  ptTundavala: { nome: "Wikipédia: Fenda da Tundavala", url: "https://pt.wikipedia.org/wiki/Fenda_da_Tundavala" },
  redeTundavala: { nome: "Rede Angola: Tundavala", url: "https://www.redeangola.info/roteiros/tundavala/" },
  visiteTundavala: {
    nome: "Visite Huíla: Zona turística da Tundavala",
    url: "https://visitehuila.com/en/turismo/locais-interesse/lubango/zona-turistica-tundavala.html",
  },
  visiteCascata: {
    nome: "Visite Huíla: Cascata da Tundavala",
    url: "https://visitehuila.com/turismo/locais-interesse/lubango/cascata-tundavala-cachoeira-lubango.html",
  },
  visiteCascataX: { nome: "Visite Huíla: Cascata do X", url: "https://visitehuila.com/turismo/locais-interesse/lubango/cascata-do-x-tundavala.html" },
  guiaRestTundavala: { nome: "Guia LNL: Restaurante Tundavala (2017)", url: "https://guialnl.com/2017/09/26/restaurante-tundavala/" },
  wikivoyageLubango: { nome: "Wikivoyage: Lubango", url: "https://en.wikivoyage.org/wiki/Lubango" },
  maravilhas: {
    nome: "Novo Jornal: as 7 Maravilhas Naturais de Angola",
    url: "https://novojornal.co.ao/sociedade/detalhe/ja-sao-conhecidas-as-7-maravilhas-naturais-de-angola-5228.html",
  },
  cristoRei: { nome: "Wikipédia: Cristo Rei do Lubango", url: "https://pt.wikipedia.org/wiki/Cristo_Rei_do_Lubango" },
  cristoReiEn: { nome: "Wikipedia: Christ the King (Lubango)", url: "https://en.wikipedia.org/wiki/Christ_the_King_(Lubango)" },

  /* ---------------- Malanje ---------------- */
  ptKalandula: { nome: "Wikipédia: Quedas de Calandula", url: "https://pt.wikipedia.org/wiki/Quedas_de_Calandula" },
  wikiKalandula: { nome: "Wikipedia: Kalandula Falls", url: "https://en.wikipedia.org/wiki/Kalandula_Falls" },
  got2Kalandula: { nome: "Got2Globe: Quedas de Calandula (Jul. 2023)", url: "https://www.got2globe.com/editorial/quedas-calandula-angola-malange/" },
  wikiMalanje: { nome: "Wikipedia: Malanje", url: "https://en.wikipedia.org/wiki/Malanje" },
  redePungo: { nome: "Rede Angola: Pungo Andongo", url: "https://www.redeangola.info/roteiros/pungo-andongo/" },
  ptPungo: { nome: "Wikipédia: Pedras Negras de Pungo Andongo", url: "https://pt.wikipedia.org/wiki/Pedras_Negras_de_Pungo_Andongo" },
  musseleje: { nome: "Hotéis Angola: Kalandula e Musseleje (2016)", url: "https://www.hoteisangola.com/en/artigo-viajante/kalandula-musseleje.html" },
  musselejeHa: { nome: "Hotéis Angola: Quedas de Musseleje", url: "https://www.hoteisangola.com/nao-perder/malanje/quedas-musseleje.html" },
  kiandaEN230: {
    nome: "Correio da Kianda: a EN230 de Luanda ao Lucapa (Fev. 2026)",
    url: "https://correiokianda.info/en230-os-mais-de-mil-quilometros-da-viagem-de-luanda-as-terras-dos-diamantes-do-lucapa/",
  },
  terminusNdala: {
    nome: "Hotéis Angola: Hotel Terminus N'dalatando",
    url: "https://www.hoteisangola.com/alojamento/hotels/ndalatando/hotel-terminus-ndalatando.html",
  },
  pousadaCalandula: {
    nome: "Hotéis Angola: Pousada Quedas Duque de Bragança",
    url: "https://www.hoteisangola.com/alojamento/hotels/kalandula/pousada-quedas-duque-braganca-kalandula.html",
  },
  pousadaRestaurante: {
    nome: "Hotéis Angola: refúgio de charme nas encostas de Calandula (2025)",
    url: "https://www.hoteisangola.com/destaques/noticias/refugio-charme-nas-encostas-calandula.html",
  },
  caminhadaQuedas: {
    nome: "Hotéis Angola: uma caminhada nas margens das quedas (2025)",
    url: "https://www.hoteisangola.com/destaques/artigo-viajante/uma-caminhada-nas-margens-das-quedas.html",
  },
  palancaNegra: { nome: "Hotéis Angola: Malanje ganha hotel de quatro estrelas (2018)", url: "https://www.hoteisangola.com/destaques/noticias/malanje-ganha-hotel-quatro-estrelas.html" },
  portvgalia: { nome: "Hotel Portvgalia, Malanje", url: "https://www.hotelportugalia.com/" },
  kahombo: { nome: "Hotéis Angola: Kahombo Rural (Cacuso)", url: "https://www.hoteisangola.com/alojamento/hotels/cacuso/hotel-kahombo-rural-malanje.html" },
  ptCacuso: { nome: "Wikipédia: Cacuso", url: "https://pt.wikipedia.org/wiki/Cacuso" },
  roteiroMalanje: {
    nome: "Hotéis Angola: roteiro Maravilhas de Malanje (2026)",
    url: "https://www.hoteisangola.com/roteiros-individuais-grupos/roteiros/rindividual-malanje/roteiro-maravilhas-malanje.html",
  },
  quilombo: { nome: "Hotéis Angola: Centro Botânico do Quilombo", url: "https://www.hoteisangola.com/nao-perder/kwanza-norte/centro-botanico-quilombo.html" },

  /* ---------------- Luanda, Kwanza, Quiçama, Cabo Ledo ---------------- */
  ptMiradouro: { nome: "Wikipédia: Miradouro da Lua", url: "https://pt.wikipedia.org/wiki/Miradouro_da_Lua" },
  visiteLuandaLua: { nome: "Visite Luanda: Miradouro da Lua", url: "https://visiteluanda.com/en/locais-interesse/miradouro-lua.html" },
  miradouroFecho: {
    nome: "Visite Luanda: o Ministério do Turismo vai encerrar o Miradouro da Lua (2026)",
    url: "https://visiteluanda.com/noticias-destaques/ministerio-turismo-ira-encerrar-miradouro.html",
  },
  haMiradouro: { nome: "Hotéis Angola: Miradouro da Lua (2026)", url: "https://www.hoteisangola.com/nao-perder/luanda/miradouro-lua.html" },
  luandaGuide: { nome: "Luanda Guide: Miradouro da Lua", url: "https://luandaguide.com/miradouro-da-lua-moon-viewpoint/" },
  wikiLuanda: { nome: "Wikipedia: Luanda (clima)", url: "https://en.wikipedia.org/wiki/Luanda" },
  portagemDecreto: {
    nome: "Decreto Presidencial 111/16: portagem da ponte do Kwanza",
    url: "https://lex.ao/docs/presidente-da-republica/2016/decreto-presidencial-n-o-111-16-de-27-de-maio/",
  },
  portagens2026: {
    nome: "Novo Jornal: novas taxas nas portagens a partir de 18 de Setembro (Set. 2026)",
    url: "https://www.novojornal.co.ao/sociedade/detalhe/novas-taxas-de-cobranca-nos-postos-de-portagem-entram-em-vigor-a-18-deste-mes-74628.html",
  },
  rnaPortagens: {
    nome: "RNA: cobrança arranca na Barra do Kwanza, no Luvo e no Nóqui (Set. 2026)",
    url: "https://rna.ao/rna.ao/2026/09/18/cobranca-de-portagens-arranca-hoje-na-barra-do-kwanza-luvo-e-noqui/",
  },
  angopPortagem: {
    nome: "ANGOP: portagem do Luvo e novas taxas (Out. 2026)",
    url: "https://angop.ao/noticias/economia/portagem-do-luvo-preve-arrecadar-80-milhoes-de-kwanzas-por-mes/",
  },
  ponteKwanza: { nome: "Arito: a nova ponte da Barra do Kwanza", url: "https://www.arito.com.pt/en/projectos/barra-do-kwanza-new-bridge/" },
  kwanzaLodge: {
    nome: "Hotéis Angola: Kwanza Lodge (2020)",
    url: "https://www.hoteisangola.com/destaques/noticias/kwanza-lodge-mais-recente-unidade-hoteleira.html",
  },
  barraKwanza: { nome: "Hotéis Angola: Barra do Cuanza (2026)", url: "https://www.hoteisangola.com/nao-perder/luanda/barra-cuanza-luanda.html" },
  ptCaboLedo: { nome: "Wikipédia: Cabo Ledo", url: "https://pt.wikipedia.org/wiki/Cabo_Ledo" },
  wikiCaboLedo: { nome: "Wikipedia: Cabo Ledo", url: "https://en.wikipedia.org/wiki/Cabo_Ledo" },
  surfCaboLedo: { nome: "Surfer Today: Praia dos Surfistas", url: "https://www.surfertoday.com/surfing/praia-dos-surfistas-cabo-ledo-surf-guide" },
  got2CaboLedo: { nome: "Got2Globe: Cabo Ledo e a Praia dos Surfistas (Nov. 2023)", url: "https://www.got2globe.com/editorial/cabo-ledo-angola-praia-surfistas/" },
  doceMar: { nome: "Hotéis Angola: Complexo Turístico Doce Mar", url: "https://www.hoteisangola.com/alojamento/hotels/cabo-ledo/complexo-turistico-doce-mar.html" },
  queirozPoint: { nome: "Hotéis Angola: Queiroz Point Eco Resort", url: "https://www.hoteisangola.com/alojamento/hotels/cabo-ledo/queiroz-point-eco-resort.html" },
  grutaCaboLedo: { nome: "Hotéis Angola: Gruta do Cabo Ledo (2026)", url: "https://www.hoteisangola.com/nao-perder/icolo-bengo/gruta-cabo-ledo.html" },
  en100Obras: {
    nome: "Correio Kianda: duplicação da EN100 (2026)",
    url: "https://correiokianda.info/estrada-nacional-100-tera-duas-vias-em-cada-sentido-a-partir-de-2027/",
  },
  en100Degradada: {
    nome: "O País: reabilitação do troço Barra do Kwanza–Cabo Ledo (Fev. 2025)",
    url: "https://www.opais.ao/economia/disponibilizados-mais-de-50-mil-milhoes-de-kwanzas-para-reabilitacao-do-troco-barra-do-kwanza-cabo-ledo/",
  },
  wikiQuicama: { nome: "Wikipedia: Parque Nacional da Quiçama", url: "https://en.wikipedia.org/wiki/Qui%C3%A7ama_National_Park" },
  inbacQuicama: { nome: "INBAC: Parque Nacional da Quiçama", url: "https://www.inbac.gov.ao/Site/areasConservacao/parque/18" },
  angopQuicama: {
    nome: "ANGOP: Parque da Quiçama com presença considerável de turistas (Jun. 2024)",
    url: "https://angop.ao/noticias/turismo/parque-da-quicama-com-presenca-consideravel-de-turistas",
  },
  taxasParques: {
    nome: "O País: taxas das áreas de conservação, Decreto 110/24 (Mai. 2024)",
    url: "https://www.opais.ao/manchete/utilizacao-de-areas-de-conservacao-ambiental-podera-custar-ate-8-mil-kwanzas/",
  },
  taxasExpansao: {
    nome: "Expansão: a tabela de preços das áreas de conservação (Mai. 2024)",
    url: "https://expansao.co.ao/angola/detalhe/tabela-de-precos-cria-duvidas-no-seio-dos-ambientalistas-61924.html",
  },
  muxima: {
    nome: "Wikipédia: Santuário da Muxima",
    url: "https://pt.wikipedia.org/wiki/Santu%C3%A1rio_de_Nossa_Senhora_da_Concei%C3%A7%C3%A3o_da_Muxima",
  },
  ecclesia: { nome: "Agência Ecclesia: Muxima, a Fátima de Angola (2009)", url: "https://agencia.ecclesia.pt/portal/muxima-a-fatima-de-angola/" },

  /* ---------------- Namibe ---------------- */
  wikiMocamedes: { nome: "Wikipedia: Moçâmedes (clima)", url: "https://en.wikipedia.org/wiki/Mo%C3%A7%C3%A2medes" },
  ptEN100: { nome: "Wikipédia: EN-100", url: "https://pt.wikipedia.org/wiki/EN-100" },
  wikiEN100: { nome: "Wikipedia: EN-100", url: "https://en.wikipedia.org/wiki/EN-100" },
  arcos: { nome: "Destino Namibe: Lagoa dos Arcos", url: "https://www.destinonamibe.com/en/locais-interesse/tombua/lagoa-dos-arcos.html" },
  arcosVer: {
    nome: "VerAngola: Lagoa dos Arcos",
    url: "https://www.verangola.net/va/pt/072020/sugestoes/21077/Lagoa-dos-Arcos-O-que-fazer.htm",
  },
  roteiroDeserto: { nome: "Destino Namibe: roteiro Maravilhas do Deserto", url: "https://www.destinonamibe.com/roteiros/roteiro-maravilhas-deserto.html" },
  destinoNamibeAlojamento: { nome: "Destino Namibe: directório de alojamento", url: "https://www.destinonamibe.com/directorio/alojamento/" },
  ptTombwa: { nome: "Wikipédia: Tômbwa", url: "https://pt.wikipedia.org/wiki/T%C3%B4mbua" },
  wikiIona: { nome: "Wikipedia: Parque Nacional do Iona", url: "https://en.wikipedia.org/wiki/Iona_National_Park" },
  inbacIona: { nome: "INBAC: Parque Nacional do Iona", url: "https://inbac.gov.ao/Site/areasConservacao/parque/7" },
  ionaRegras: {
    nome: "Parque Nacional do Iona: informação ao visitante (Mai. 2024)",
    url: "https://media.tracks4africa.co.za/users/files/w186203_2039.pdf",
  },
  ionaTaxas: {
    nome: "Parque Nacional do Iona: tabela de taxas (Mai. 2024)",
    url: "https://media.tracks4africa.co.za/users/files/w186203_2037.pdf",
  },
  ionaMapa: { nome: "Parque Nacional do Iona: mapa do parque", url: "https://media.tracks4africa.co.za/users/files/w186203_2041.pdf" },
  ionaContacto: {
    nome: "African Parks: contactos do Iona (arquivo de Set. 2025)",
    url: "https://web.archive.org/web/20250929092911/https://www.africanparks.org/the-parks/iona/contact",
  },
  ionaCosta: {
    nome: "African Parks: a costa do Iona (Jul. 2025)",
    url: "https://www.africanparks.org/coastal-drive-experience-through-iona-national-park",
  },
  welwitschia: { nome: "Wikipedia: Welwitschia", url: "https://en.wikipedia.org/wiki/Welwitschia" },
  got2Tigres: { nome: "Got2Globe: Baía dos Tigres", url: "https://www.got2globe.com/editorial/baia-dos-tigres-namibe-angola/" },

  /* ---------------- Benguela e costa ---------------- */
  redeBaiaFarta: { nome: "Rede Angola: Baía Farta", url: "https://www.redeangola.info/roteiros/baia-farta/" },
  baiaAzul: { nome: "Destino Benguela: Baía Azul", url: "https://destinobenguela.com/en/turismo/locais-interesse/praias-costa/baia-azul.html" },
  caotinha: { nome: "Welcome to Angola: Praia da Caotinha", url: "https://welcometoangola.co.ao/en/directorio/praia-da-caotinha/" },
  praiasSul: { nome: "Destino Benguela: roteiro Praias do Sul", url: "https://destinobenguela.com/en/roteiros/praias-sul-benguela.html" },
  restinga: { nome: "Destino Benguela: Restinga do Lobito", url: "https://destinobenguela.com/en/turismo/locais-interesse/lobito2/restinga-lobito.html" },
  wikiBenguela: { nome: "Wikipedia: Benguela", url: "https://en.wikipedia.org/wiki/Benguela" },
  wikiLobito: { nome: "Wikipedia: Lobito (clima)", url: "https://en.wikipedia.org/wiki/Lobito" },
  geografia: { nome: "Wikipedia: Geografia de Angola (clima)", url: "https://en.wikipedia.org/wiki/Geography_of_Angola" },
  guiaBenguela: { nome: "Guia LNL: Benguela (Out. 2023, act. Mai. 2025)", url: "https://guialnl.com/2023/10/11/guia-lnl-benguela/" },
  guiaPortoAmboim: { nome: "Guia LNL: acampar em Porto Amboim (2022)", url: "https://guialnl.com/2022/04/06/como-acampar-em-porto-amboim/" },
  guiaLubango: {
    nome: "Guia LNL: onde ficar e comer no Lubango (Dez. 2023)",
    url: "https://guialnl.com/2023/12/13/guia-lnl-onde-ficar-onde-comer-e-o-que-fazer-no-lubango-e-arredores/",
  },
  sombreiro: { nome: "Hotéis Angola: Morro do Sombreiro", url: "https://www.hoteisangola.com/en/nao-perder/benguela/navegantes/morro-sombreiro.html" },
  caotinhaDB: { nome: "Destino Benguela: Caotinha", url: "https://destinobenguela.com/turismo/locais-interesse/navegantes/caotinha.html" },
  caotaDB: { nome: "Destino Benguela: Caota", url: "https://destinobenguela.com/turismo/locais-interesse/navegantes/caota-praia-anao-perder-benguela.html" },
  macaca: { nome: "Hotéis Angola: Praia da Macaca", url: "https://www.hoteisangola.com/en/nao-perder/benguela/baia-farta/praia-macaca.html" },
  chamume: { nome: "Destino Benguela: Praia do Chamume", url: "https://destinobenguela.com/turismo/locais-interesse/baia-farta4/praia-chamume-anao-perder-benguela.html" },
  redeMacaca: { nome: "Rede Angola: Praia da Macaca (2015)", url: "http://m.redeangola.info/roteiros/praia-da-macaca/" },
  restingaHa: { nome: "Hotéis Angola: Restinga do Lobito", url: "https://www.hoteisangola.com/en/nao-perder/benguela/lobito/restinga-lobito.html" },
  duasFaces: { nome: "Hotéis Angola: Hotel Duas Faces (Baía Azul)", url: "https://www.hoteisangola.com/en/alojamento/hotels/baia-azul/hotel-duas-faces.html" },
  praiaMorena: { nome: "Hotéis Angola: Hotel Praia Morena", url: "https://www.hoteisangola.com/en/alojamento/hotels/benguela-municipio/hotel-praia-morena.html" },
  cheiasBenguela: {
    nome: "Expansão: reparar os danos das cheias em Benguela (Mai. 2026)",
    url: "https://www.expansao.co.ao/angola/detalhe/aprovados-3568-mil-milhoes-kz-para-reparar-danos-das-cheias-em-benguela-71855.html",
  },
  chuvasBenguela: {
    nome: "Novo Jornal: chuvas acima do normal em Benguela até Dezembro (Out. 2026)",
    url: "https://novojornal.co.ao/politica/detalhe/benguela-na-iminencia-de-uma-nova-tragedia-de-12-de-abril---medidas-do-pr-podem-ser-arrastadas-pelas-chuvas-75112.html",
  },
  hospitalBenguela: {
    nome: "RNA: Hospital Geral de Benguela (Abr. 2026)",
    url: "https://rna.ao/rna.ao/2026/04/11/hospital-geral-de-benguela-conta-com-um-complexo-de-producao-de-oxigenio/",
  },
  hospitalLobito: {
    nome: "RNA: Hospital Regional do Lobito (Jul. 2026)",
    url: "https://rna.ao/rna.ao/2026/07/11/hospital-regional-do-lobito-ganha-fabrica-de-producao-de-oxigenio/",
  },
  hospitalBaiaFarta: {
    nome: "RNA: novo Hospital da Baía Farta (2021)",
    url: "https://rna.ao/rna.ao/2021/02/19/novo-hospital-da-baia-farta-entra-em-funcionamento-este-fim-de-semana/",
  },
  hospitalSumbe: {
    nome: "RNA: Hospital Geral do Cuanza Sul inaugurado (Out. 2024)",
    url: "https://rna.ao/rna.ao/2024/10/21/hospital-geral-do-cuanza-sul-inaugurado-hoje-pelo-presidente-da-republica-esta-equipada-com-aparelhos-de-ultima-geracao/",
  },
  ritzSumbe: { nome: "Hotéis Angola: Hotel Ritz Sumbe", url: "https://www.hoteisangola.com/en/alojamento/hotels/sumbe/hotel-ritz-sumbe.html" },
  kalundaSumbe: { nome: "Hotéis Angola: Hotel Kalunda (Sumbe)", url: "https://www.hoteisangola.com/en/alojamento/hotels/sumbe/hotel-kalunda-sumbe.html" },
  kicombo: { nome: "Hotéis Angola: Praia do Kicombo", url: "https://www.hoteisangola.com/en/nao-perder/kwanza-sul/praia-kicombo.html" },
  en100Costa: {
    nome: "RNA: população exige conclusão da EN100 Benguela–Namibe (Ago. 2026)",
    url: "https://rna.ao/rna.ao/2026/08/17/populacao-do-namibe-e-benguela-exige-conclusao-das-obras-na-en-100/",
  },
  en100CostaPontes: {
    nome: "RNA: pontes por ligar no troço Benguela–Namibe (Nov. 2025)",
    url: "https://rna.ao/rna.ao/2025/11/15/automobilistas-reclamam-da-morosidade-para-a-conclusao-das-obras-de-reabilitacao-na-estrada-nacional-100-no-troco-benguela-namibe/",
  },
  lucira2021: { nome: "Destino Benguela: as estradas da Lucira (c. 2021)", url: "https://destinobenguela.com/historia/estradas-lucira-tem-historias-arrepiar.html" },
  en105: {
    nome: "ANGOP: reabilitação da estrada Huíla–Benguela a 53 % (Jul. 2026)",
    url: "https://angop.ao/noticias/sociedade/reabilitacao-da-estrada-nacional-huila-benguela-atinge-53-de-execucao/",
  },
  duplicacaoEN100: {
    nome: "ANGOP: obras na Estrada Nacional 100 a partir de 2027 (Mar. 2026)",
    url: "https://angop.ao/noticias/economia/ministro-carlos-dos-santos-anuncia-obras-na-estrada-nacional-100/",
  },
  caboLedoMarco: {
    nome: "Plataforma Media: 12 mortos no acidente de Cabo Ledo (Mar. 2026)",
    url: "https://www.plataformamedia.com/2026/03/16/subiu-para-12-o-numero-de-vitimas-mortais-do-acidente-em-cabo-ledo/",
  },
  quibaula: {
    nome: "Correio da Kianda: o acidente com uma mota carregada de combustível no Cuanza Sul (Ago. 2026)",
    url: "https://correiokianda.info/fiscalizacao-deficiente-e-incumprimento-das-regras-apontados-como-causas-da-sinistralidade-rodoviaria/",
  },
  gadoEN100: {
    nome: "RNA: acidentes com gado na EN100 (Jul. 2025)",
    url: "https://rna.ao/rna.ao/2025/07/12/aumenta-o-numero-de-acidentes-de-viacao-envolvendo-gado-bovino-na-estrada-nacional-numero-100/",
  },
  assaltosEN100: {
    nome: "Imparcial Press: assaltos na Estrada Nacional 100 (Fev. 2024)",
    url: "https://imparcialpress.net/vandalizacoes-e-assaltos-na-estrada-nacional-100-preocupa-transportadoras-e-camionistas/",
  },
} satisfies Record<string, FonteRota>;
