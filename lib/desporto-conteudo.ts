/* ============================================================
   MOTOBOX — Desporto: o guia de cada modalidade

   O texto longo das páginas /desporto/<modalidade>: o que é a
   modalidade, como corre uma prova, as classes, a cena em Angola,
   os campeonatos de referência lá fora e como começar.

   Informação verificada em Outubro de 2026.

   Tudo o que diz respeito a pessoas, organizações, datas e
   resultados reais tem fonte. Escreve-se a chave da fonte (tabela
   F) ao lado da afirmação; a página numera as fontes pela ordem em
   que aparecem e lista-as no fim (`fontes`). Quando as fontes
   discordam, diz-se, ou fica de fora. Quando em Angola há pouco
   (enduro, motos de água), diz-se que a modalidade está por
   organizar e conta-se o que se passa na região e no mundo.
   Conselhos gerais de segurança e descrições do desporto não levam
   fonte; números, nomes e datas levam sempre.

   Os pilotos, equipas e provas do calendário da Motobox são outra
   coisa: vêm da base de dados e não se misturam com este texto.
   ============================================================ */

export interface Fonte {
  nome: string;
  url: string;
}

/* ---------------- Fontes ---------------- */

const F = {
  /* Federações e organização */
  famFim: { nome: "FIM: Federação Angolana de Motociclismo (FAM)", url: "https://www.fim-moto.com/en/fim/continental-unions-national-federations/fim-africa/federations/fam" },
  fimAfricaViegas: { nome: "FIM Africa: visita do presidente da FIM a Angola (Setembro de 2026)", url: "https://fim-africa.com/2026/09/02/fim-president-jorge-viegas-strengthens-ties-during-landmark-african-tour/" },
  fiaMembros: { nome: "FIA: clubes membros em África (Angola: FADM)", url: "https://www.fia.com/members/region/africa-4/member_club/sport-1" },
  fadmDireccao: { nome: "FADM: direcção", url: "https://www.fadm.ao/direccao/" },
  fadmCalendarios: { nome: "FADM: calendários de 2026 (PDF)", url: "https://www.fadm.ao/wp-content/uploads/2026/04/Calendarios-FADM.pdf" },
  fadmRegMx2017: { nome: "FADM: Regulamento do Campeonato Angolano de Motocross 2017 (PDF)", url: "https://www.fadm.ao/wp-content/uploads/2022/05/REGULAMENTO-DO-CAMPEONATO-ANGOLANO-DE-MOTOCROSS-2017-Orlando.pdf" },
  fpakFadm2014: { nome: "Absolute Motors: FPAK apadrinha adesão da FADM à FIA (2014)", url: "https://www.absolute-motors.com/fpak-apadrinha-adesao-da-federacao-angolana-de-desportos-motorizados-fia/" },
  opaisFimMinistro2026: { nome: "O País: Angola e FIM avaliam reforço da cooperação (Agosto de 2026)", url: "https://www.opais.ao/desporto/angola-e-federacao-internacional-de-motociclismo-avaliam-reforco-da-cooperacao/" },

  /* Motocross em Angola */
  opaisJorgeVarela2018: { nome: "O País: circuito de motocross de Luanda à beira do despejo (Março de 2018)", url: "https://www.opais.ao/desporto/circuito-internacional-de-motocross-de-luanda-a-beira-do-despejo/" },
  mxcircuitJV: { nome: "MX Circuit: Circuito Jorge Varela", url: "https://www.mxcircuit.es/circuitos/perfil/circuito-jorge-varela" },
  angonoticiasVarela: { nome: "Angonotícias: morte de Jorge Varela (2005)", url: "https://www.angonoticias.com/Artigos/item/6917/motocross-morte-de-jorge-varela-poe-fim-a-onze-anos-de-carreira-do-piloto" },
  opaisMx2024: { nome: "O País: motocross vive momentos difíceis por falta de apoio (Outubro de 2024)", url: "https://opais.ao/desporto/motocross-vive-momentos-dificeis-por-falta-de-apoio/" },
  abolaJV2026: { nome: "A Bola: Circuito Jorge Varela acelera para a oitava ronda (Setembro de 2026)", url: "https://www.abola.pt/noticias/circuito-jorge-varela-acelera-para-oitava-ronda-2026093020032520615" },
  opaisSumbe2024: { nome: "O País: Orlando e Nilton vencem o GP Cidade do Sumbe (Maio de 2024)", url: "https://opais.ao/desporto/motocross-orlando-e-nilton-vencem-gp-cidade-do-sumbe/" },
  giraCabinda2026: { nome: "Gira Notícias: piloto angolano vence corrida internacional em Cabinda (Fevereiro de 2026)", url: "https://www.giranoticias.com/desporto/2026/02/27735-motocross-piloto-angolano-vence-corrida-internacional-disputada-em-cabinda.html" },
  opaisErikson: { nome: "O País: Erikson Carvalho, «Não existe desporto motorizado em Angola» (Fevereiro de 2026)", url: "https://www.opais.ao/desporto/erikson-carvalhonao-existe-desporto-motorizado-em-angola/" },
  mxoan2026: { nome: "FIM Africa: Motocross of African Nations 2026, classificação por países (PDF)", url: "https://fim-africa.com/wp-content/uploads/2026/09/9805e7bf-d45c-4685-881a-baa36222114c_Overall-Country-Standings.pdf" },
  fimAfricaResultados: { nome: "FIM Africa: resultados e classificações", url: "https://fim-africa.com/sport/results-and-championship-logs/" },
  rnaCaravana2026: { nome: "RNA: caravana angolana no africano de motocross, na Namíbia (Agosto de 2026)", url: "https://rna.ao/rna.ao/2026/08/25/caravana-angolana-que-vai-evoluir-no-final-de-semana-que-vem-no-regional-continental-de-motocrosse-ja-respiram-ares-da-vizinha-namibia/" },
  mxonEquipas: { nome: "MXGP Results: equipas do Motocross das Nações 2026", url: "https://mxgpresults.com/mxon/teams" },

  /* Motocross no mundo */
  wikiMxgp: { nome: "Wikipedia: FIM Motocross World Championship", url: "https://en.wikipedia.org/wiki/FIM_Motocross_World_Championship" },
  wikiMxgp2026: { nome: "Wikipedia: Mundial de Motocross de 2026", url: "https://en.wikipedia.org/wiki/2026_FIM_Motocross_World_Championship" },
  mxgp2023Reg: { nome: "MXGP: regulamentos de 2023 (corrida de qualificação)", url: "https://www.mxgp.com/news/2023-fim-motocross-world-championship-updated-regulations" },
  mxgpPontos: { nome: "MXGP Results: classificações e pontos do MXGP", url: "https://mxgpresults.com/mxgp/" },
  mxgpIdadeMx2: { nome: "MXGP: limite de idade da MX2", url: "http://docs.mxgp.com/?type=News&newsID=831&subsite=27" },
  wikiMxon: { nome: "Wikipedia: Motocross of Nations", url: "https://en.wikipedia.org/wiki/Motocross_of_Nations" },
  ktm450us: { nome: "KTM (EUA): 450 SX-F de 2026", url: "https://www.ktm.com/en-us/models/motocross/4-stroke/2026-ktm-450-sx-f.html" },
  andardemotoKtm: { nome: "Andar de Moto: preços das KTM de motocross em Portugal", url: "https://www.andardemoto.pt/motos-novas/b/ktm/s/mx/" },
  motorcycleGear: { nome: "Motorcycle.com: guia de equipamento de motocross", url: "https://www.motorcycle.com/how-to/motocross-protective-gear-guide-90399.html" },
  fimCapacetes: { nome: "FIM: capacetes homologados FRHPhe-02", url: "https://www.fim-moto.com/en/news/news-detail/article/more-helmets-and-fim-explanations-fim-homologated-helmets-under-frhphe-02" },

  /* Enduro */
  wikiEnduro: { nome: "Wikipedia: Enduro", url: "https://en.wikipedia.org/wiki/Enduro" },
  wikiEnduroGP: { nome: "Wikipedia: FIM Enduro World Championship", url: "https://en.wikipedia.org/wiki/FIM_Enduro_World_Championship" },
  enduroGpPortugal: { nome: "EnduroGP: GP de Portugal de 2025, Fafe", url: "https://www.endurogp.com/r1-2025-gp-of-portugal/" },
  wikiIsde: { nome: "Wikipedia: International Six Days Enduro", url: "https://en.wikipedia.org/wiki/International_Six_Days_Enduro" },
  sixDays2026: { nome: "6Days: 100.ª edição em Portugal, em 2026", url: "https://www.fim-6days.com/one-hundredth-edition-of-6days-fim-enduro-of-nations-set-for-portugal-in-2026/" },
  wikiHardEnduro: { nome: "Wikipedia: FIM Hard Enduro World Championship", url: "https://en.wikipedia.org/wiki/FIM_Hard_Enduro_World_Championship" },

  /* Rali-raid */
  opaisCarr2024: { nome: "O País: Bruno Jorge campeão do Campeonato Angolano de Rali/Raid (Outubro de 2024)", url: "https://www.opais.ao/desporto/bruno-jorge-sagra-se-campeao-do-campeonato-angolano-de-rali-raid/" },
  comercioCarvalho: { nome: "Comércio e Notícias: Hugo Carvalho, o senhor todo-o-terreno em Angola (Setembro de 2026)", url: "https://comercioenoticias.pt/do-pregao-a-luanda-riomaiorense-hugo-carvalho-e-o-senhor-todo-o-terreno-em-angola/" },
  topoi: { nome: "Bittencourt e Melo, «Topoi» n.º 32 (2016): automobilismo e sociedade em Angola", url: "https://www.scielo.br/j/topoi/a/t5bCLJz6dTD9S7g6XMQLvyR/?format=html&lang=pt" },
  wikiDakar1992: { nome: "Wikipedia: Rali Paris–Cidade do Cabo de 1992", url: "https://en.wikipedia.org/wiki/1992_Paris%E2%80%93Cape_Town_Rally" },
  absoluteMadaleno: { nome: "Absolute Motors: o desporto motorizado em Angola, por José Carlos Madaleno (2014)", url: "https://www.absolute-motors.com/o-desporto-motorizado-em-angola/" },
  autosportSrt2026: { nome: "Autosport: Rui Silva e Francisco Albuquerque levam Angola ao Dakar (Janeiro de 2026)", url: "https://www.autosport.pt/todooterreno/dakar/rui-silva-e-francisco-albuquerque-fazem-historia-ao-levar-angola-ao-dakar/" },
  autosportSrt: { nome: "Autosport: SRT Angola no Dakar 2026", url: "https://www.autosport.pt/todooterreno/dakar/rui-silva-e-francisco-albuquerque-srt-angola-no-dakar-2026/" },
  fadmSrt: { nome: "FADM: Soida Rally Team no Rally Dakar 2026", url: "https://www.fadm.ao/soida-rally-team-assina-participacao-historica-no-rally-dakar-2026/" },
  minjudDakar: { nome: "MINJUD: Rally Dakar 2026, Angola no top 20 dos SSV", url: "https://minjud.gov.ao/web/noticias/rally-dakar-2026:-angola-alcanca-top-20-mundial-na-classe-ssv-e-brilha-entre-os-rookies" },
  allafricaSrt: { nome: "AllAfrica: dupla angolana no Dakar (Novembro de 2025)", url: "https://fr.allafrica.com/stories/202511240331.html" },
  wikiDakar: { nome: "Wikipedia: Rali Dakar", url: "https://en.wikipedia.org/wiki/Dakar_Rally" },
  wikiDakar2026: { nome: "Wikipedia: Dakar 2026", url: "https://en.wikipedia.org/wiki/2026_Dakar_Rally" },
  wikiRallyRaid: { nome: "Wikipedia: Rally raid", url: "https://en.wikipedia.org/wiki/Rally_raid" },
  wikiW2rc: { nome: "Wikipedia: World Rally-Raid Championship", url: "https://en.wikipedia.org/wiki/World_Rally-Raid_Championship" },
  wikiW2rc2025: { nome: "Wikipedia: W2RC de 2025", url: "https://en.wikipedia.org/wiki/2025_World_Rally-Raid_Championship" },
  wikiW2rc2026: { nome: "Wikipedia: W2RC de 2026", url: "https://en.wikipedia.org/wiki/2026_World_Rally-Raid_Championship" },
  wikiAfricaEco: { nome: "Wikipedia: Africa Eco Race", url: "https://en.wikipedia.org/wiki/Africa_Eco_Race" },
  wikiAer2026: { nome: "Wikipedia: Africa Eco Race de 2026", url: "https://en.wikipedia.org/wiki/2026_Africa_Eco_Race" },
  africarace: { nome: "Africa Eco Race (site oficial)", url: "https://www.africarace.com/" },
  wikiPauloGoncalves: { nome: "Wikipedia: Paulo Gonçalves", url: "https://en.wikipedia.org/wiki/Paulo_Gon%C3%A7alves_(motorcyclist)" },
  ptHelderRodrigues: { nome: "Wikipédia: Hélder Rodrigues", url: "https://pt.wikipedia.org/wiki/H%C3%A9lder_Rodrigues" },
  wikiDakar2013: { nome: "Wikipedia: Dakar 2013", url: "https://en.wikipedia.org/wiki/2013_Dakar_Rally" },

  /* Velocidade */
  wikiAutodromoLuanda: { nome: "Wikipedia: Autódromo de Luanda", url: "https://en.wikipedia.org/wiki/Aut%C3%B3dromo_de_Luanda" },
  racingcircuitsLuanda: { nome: "Racing Circuits: Luanda", url: "https://www.racingcircuits.info/africa/angola/luanda.html" },
  wikiAutodromoBenguela: { nome: "Wikipedia: Autódromo de Benguela", url: "https://en.wikipedia.org/wiki/Aut%C3%B3dromo_de_Benguela" },
  jornalClassicos1968: { nome: "Jornal dos Clássicos: o Festival Motor de Luanda de 1968 (2022)", url: "https://www.jornaldosclassicos.com/2022/07/15/corridas-de-angola-o-festival-motor-de-luanda-de-1968/" },
  apdmlBlog: { nome: "APDML (blogue): Troféu Motos 600cc 2011", url: "http://apdml.blogspot.com/" },
  voaHuambo2011: { nome: "VOA Português: corridas no antigo circuito de Nova Lisboa (Setembro de 2011)", url: "https://www.voaportugues.com/a/article-09-22-2011-motorracingangola-voanews-130369393/1261216.html" },
  ltiAngola2017: { nome: "LTI Angola: Victor Barros no Autódromo de Luanda (Julho de 2017)", url: "https://ltiangola.com/?lang=en&p=451" },
  motojornalBarros: { nome: "Motojornal: o primeiro angolano no Mundial (Outubro de 2020)", url: "https://motojornal.pt/o-primeiro-angolano-no-mundial/" },
  motosportBarros: { nome: "MotoSport: Victor Barros no Team Target (Abril de 2020)", url: "https://www.motosport.com.pt/velocidade/cnv-2020-victor-barros-no-team-target/" },
  wikiWssp2020: { nome: "Wikipedia: Mundial de Supersport de 2020", url: "https://en.wikipedia.org/wiki/2020_Supersport_World_Championship" },
  verangolaBarros: { nome: "Ver Angola: Victor Barros conquista a Copa Dunlop Motoval 600 (Novembro de 2021)", url: "https://www.verangola.net/va/pt/112021/Desporto/27978/Piloto-angolano-Victor-Barros-conquista-Copa-Dunlop-Motoval-600.htm" },
  opais200kmHuila: { nome: "O País: corrida dos 200 km da Huíla (Agosto de 2025)", url: "https://www.opais.ao/desporto/corrida-de-200-km-da-huila-acontece-hoje/" },
  abolaMalanje2026: { nome: "A Bola: época dos desportos motorizados arranca em Malanje (Fevereiro de 2026)", url: "https://www.abola.pt/noticias/epoca-dos-desportos-motorizados-arranca-em-malanje-com-provas-de-drift-e-drag-2026022321351954328" },
  wikiGP: { nome: "Wikipedia: Grand Prix motorcycle racing", url: "https://en.wikipedia.org/wiki/Grand_Prix_motorcycle_racing" },
  intentsgp: { nome: "Intents GP: o formato de qualificação do MotoGP explicado", url: "https://www.intentsgp.com/motogp-qualifying-format-explained/" },
  wikiMotoE: { nome: "Wikipedia: MotoE World Championship", url: "https://en.wikipedia.org/wiki/MotoE_World_Championship" },
  wikiMotogp2026: { nome: "Wikipedia: Mundial de MotoGP de 2026", url: "https://en.wikipedia.org/wiki/2026_MotoGP_World_Championship" },
  wikiWsbk: { nome: "Wikipedia: Superbike World Championship", url: "https://en.wikipedia.org/wiki/Superbike_World_Championship" },
  wikiWsbk2026: { nome: "Wikipedia: Mundial de Superbike de 2026", url: "https://en.wikipedia.org/wiki/2026_Superbike_World_Championship" },
  wikiSportbike2026: { nome: "Wikipedia: Sportbike World Championship de 2026", url: "https://en.wikipedia.org/wiki/2026_Sportbike_World_Championship" },
  wikiOliveira: { nome: "Wikipedia: Miguel Oliveira", url: "https://en.wikipedia.org/wiki/Miguel_Oliveira" },
  wikiBinder: { nome: "Wikipedia: Brad Binder", url: "https://en.wikipedia.org/wiki/Brad_Binder" },
  wikiDarrynBinder: { nome: "Wikipedia: Darryn Binder", url: "https://en.wikipedia.org/wiki/Darryn_Binder" },
  wikiSaGp: { nome: "Wikipedia: Grande Prémio da África do Sul de motociclismo", url: "https://en.wikipedia.org/wiki/South_African_motorcycle_Grand_Prix" },
  wikiKyalami: { nome: "Wikipedia: Kyalami", url: "https://en.wikipedia.org/wiki/Kyalami" },
  crashAirbag: { nome: "Crash.net: airbags obrigatórios no MotoGP a partir de 2018", url: "https://www.crash.net/motogp/news/888659/1/2018-marks-start-compulsory-airbags" },
  videopass: { nome: "MotoGP VideoPass", url: "https://www.motogp.com/en/videopass" },
  redStar: { nome: "Red Star Raceway (África do Sul)", url: "https://www.redstarraceway.co.za/" },

  /* Moto 4 e quads */
  okwambi: { nome: "Okwambi Rentals: aluguer no Mussulo", url: "https://okwambirentals.com/" },
  angolaTourismMussulo: { nome: "Angola Tourism: Ilha do Mussulo", url: "https://angola-tourism.com/ilha-do-mussulo/" },
  wikiSwakopmund: { nome: "Wikipedia: Swakopmund", url: "https://en.wikipedia.org/wiki/Swakopmund" },
  wikiQuadcross: { nome: "Wikipedia: Quadcross of Nations", url: "https://en.wikipedia.org/wiki/Quadcross_of_Nations" },
  advpulseQuads: { nome: "ADV Pulse: o Dakar acaba com a classe de quads em 2025", url: "https://www.advpulse.com/adv-news/dakar-pulls-the-plug-on-the-quad-class-for-2025/" },
  wikiDakar2024: { nome: "Wikipedia: Dakar 2024", url: "https://en.wikipedia.org/wiki/2024_Dakar_Rally" },
  wikiPatronelli: { nome: "Wikipedia: Marcos Patronelli", url: "https://en.wikipedia.org/wiki/Marcos_Patronelli" },
  wikiCasale: { nome: "Wikipedia: Ignacio Casale", url: "https://en.wikipedia.org/wiki/Ignacio_Casale" },
  wikiSsv: { nome: "Wikipedia: Side-by-side (vehicle)", url: "https://en.wikipedia.org/wiki/Side-by-side_(vehicle)" },

  /* Motos de água */
  e1Luanda: { nome: "E1 Series: Luanda recebe a sua primeira corrida do Mundial E1 (2026)", url: "https://www.e1series.com/news/220_Two-weeks-to-go-until-Luanda-Angola-welcomes-its-first-E1-World-Championship-race" },
  allafricaE1: { nome: "ANGOP/AllAfrica: Team Brady vence o E1 Luanda GP (Setembro de 2026)", url: "https://allafrica.com/stories/202609150426.html" },
  abolaE1: { nome: "A Bola: Mundial de barcos eléctricos corre-se em Luanda (Setembro de 2026)", url: "https://www.abola.pt/noticias/mundial-de-barcos-eletricos-corre-se-domingo-em-luanda-com-will-smith-a-competir-por-angola-2026091112232341915" },
  forbesE1: { nome: "Forbes África Lusófona: Aoki Racing na pole do E1 Luanda GP (2026)", url: "https://forbesafricalusofona.com/aoki-racing-conquista-pole-position-para-o-e1-luanda-gp-2026/" },
  premiumTimesLagos: { nome: "Premium Times: Team Brazil vence o E1 Lagos GP (Outubro de 2025)", url: "https://www.premiumtimesng.com/news/more-news/825982-team-brazil-wins-e1-lagos-gp-as-sanwo-olu-hails-africas-first-electric-powerboat-race.html" },
  lexDecreto69: { nome: "Lex.AO: Decreto Presidencial n.º 69/14, de 21 de Março", url: "https://lex.ao/docs/presidente-da-republica/2014/decreto-presidencial-n-o-69-14-de-21-de-marco/" },
  luandaPraias: { nome: "Governo Provincial de Luanda: zonas balneares (Outubro de 2022)", url: "https://luanda.gov.ao/web/noticias/utilidade-p%C3%BAblicainforma%C3%A7%C3%B5es-%C3%BAteis-sobre-as-zonas-balneares-na-prov%C3%ADncia-de-luanda" },
  ptClubeNaval: { nome: "Wikipédia: Clube Naval de Luanda", url: "https://pt.wikipedia.org/wiki/Clube_Naval_de_Luanda" },
  lojaNautica: { nome: "Loja Náutica Angola: motas de água", url: "https://www.lojanauticaangola.com/categorias/motas-de-agua" },
  wikiAquabike: { nome: "Wikipedia: Aquabike World Championship", url: "https://en.wikipedia.org/wiki/Aquabike_World_Championship" },
  aquabike2026: { nome: "Aquabike: calendário do Mundial de 2026", url: "https://www.aquabike.net/news/2026/aquabike-promotion-announces-2026-world-championship-calendar" },
  aquabikeNet: { nome: "Aquabike World Championship (site oficial)", url: "https://www.aquabike.net/" },
  ijsba: { nome: "IJSBA (International Jet Sports Boating Association)", url: "https://www.ijsba.com/" },
  ijsbaCampeoes: { nome: "IJSBA: campeões do mundo", url: "https://ijsba.com/world-champions/" },
  wikiJetSki: { nome: "Wikipedia: Jet Ski", url: "https://en.wikipedia.org/wiki/Jet_Ski" },
  wikiKillSwitch: { nome: "Wikipedia: Kill switch", url: "https://en.wikipedia.org/wiki/Kill_switch" },
  powerboatSa: { nome: "Wikipedia: Powerboat South Africa", url: "https://en.wikipedia.org/wiki/Powerboat_South_Africa" },

  /* Karting e automobilismo */
  rscLuanda: { nome: "Racing Sports Cars: arquivo de Luanda", url: "https://www.racingsportscars.com/track/archive/Luanda.html" },
  rscLuanda1972: { nome: "Racing Sports Cars: 3 Horas de Luanda de 1972", url: "https://www.racingsportscars.com/results/Luanda-1972-08-15.html" },
  rscNovaLisboa: { nome: "Racing Sports Cars: arquivo de Nova Lisboa", url: "https://www.racingsportscars.com/track/archive/Nova%20Lisboa.html" },
  rscNovaLisboa1972: { nome: "Racing Sports Cars: 6 Horas de Nova Lisboa de 1972", url: "https://www.racingsportscars.com/results/Nova_Lisboa-1972-08-06.html" },
  continentalCircus2008: { nome: "Continental Circus (blogue): o renascer do automobilismo angolano (Novembro de 2008)", url: "https://continental-circus.blogspot.com/2008/11/o-renascer-do-automobilismo-angolano.html" },
  verangolaCaboLedo: { nome: "Ver Angola: país vai ter um novo autódromo (Setembro de 2021)", url: "https://www.verangola.net/va/pt/092021/Desporto/27392/Pa%C3%ADs-vai-ter-um-novo-aut%C3%B3dromo-Infra-estrutura-vai-ser-constru%C3%ADda-numa-extens%C3%A3o-de-4166-hectares.htm" },
  novoJornalCaboLedo: { nome: "Novo Jornal: FADM procura financiamento para o autódromo do Cabo Ledo (Outubro de 2021)", url: "https://novojornal.co.ao/desporto/detalhe/fadm-federacao-caca-milhoes-kz-para-erguer-autodromo-do-cabo-ledo-27538.html" },
  fiaKarting: { nome: "FIA: o desenvolvimento do karting de base em Angola (Abril de 2024)", url: "https://www.fia.com/news/accelerating-angolas-grassroots-karting-development-fias-path-motorsport-growth" },
  prodesportoKarting2017: { nome: "Pró Desporto: 1.ª prova do Nacional de Karting e Supermotos (Março de 2017)", url: "https://prodesporto.com/1a-prova-do-campeonato-nacional-de-karting-e-supermotos-coroa-campeoes/" },
  kartingAfrica: { nome: "Karting Africa", url: "https://kartingafrica.com/" },
  economistNa: { nome: "The Economist (Namíbia): Karting Africa Show Run em Angola (Setembro de 2026)", url: "https://economist.com.na/historic-continental-karting-showrun-in-angola-to-pave-africas-path-to-formula-one/" },
  wikiRuiAndrade: { nome: "Wikipedia: Rui Andrade", url: "https://en.wikipedia.org/wiki/Rui_Andrade_(racing_driver)" },
  kartCoZa: { nome: "Kart.co.za: RMC African Open 2023", url: "https://kart.co.za/international/rmc-african-open-2023-celebrating-african-karting-excellence/" },
  motorsportCoZa: { nome: "Motorsport.co.za: Rotax African Open de 2025", url: "https://www.motorsport.co.za/rotax-african-open-set-for-continental-kart-wars/" },
  wikiFiaKarting: { nome: "Wikipedia: FIA Karting World Championship", url: "https://en.wikipedia.org/wiki/FIA_Karting_World_Championship" },
  rotaxGF: { nome: "Rotax: RMC Grand Finals", url: "https://www.rotax-racing.com/rmc-grand-finals" },
  wikiF4: { nome: "Wikipedia: Formula 4", url: "https://en.wikipedia.org/wiki/Formula_4" },
  wikiArc: { nome: "Wikipedia: African Rally Championship", url: "https://en.wikipedia.org/wiki/African_Rally_Championship" },
  wikiSafari: { nome: "Wikipedia: Safari Rally", url: "https://en.wikipedia.org/wiki/Safari_Rally" },
  wikiFelixDaCosta: { nome: "Wikipedia: António Félix da Costa", url: "https://en.wikipedia.org/wiki/Ant%C3%B3nio_F%C3%A9lix_da_Costa" },
  wikiCampeoesF1: { nome: "Wikipedia: campeões do mundo de Fórmula 1", url: "https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions" },
  wikiBortoleto: { nome: "Wikipedia: Gabriel Bortoleto", url: "https://en.wikipedia.org/wiki/Gabriel_Bortoleto" },
  fiaKartingNormas: { nome: "FIA: normas de equipamento de karting", url: "https://www.fia.com/regulation/category/761" },
  snell: { nome: "Snell Memorial Foundation: normas de capacetes", url: "https://smf.org/stds" },
} satisfies Record<string, Fonte>;

type ChaveFonte = keyof typeof F;

/* ---------------- Tipos ---------------- */

/** Parágrafo ou frase, com as fontes que o sustentam. `R` é a chave (ao escrever) ou o número (na página). */
export interface Texto<R = number> {
  texto: string;
  fontes: R[];
}

export interface Tabela<R = number> {
  titulo: string;
  colunas: string[];
  linhas: string[][];
  nota?: Texto<R>;
}

export interface Bloco<R = number> {
  titulo: string;
  paragrafos: Texto<R>[];
}

export interface ConteudoModalidade<R = number> {
  /** Três números para o cabeçalho, quando a modalidade não tem provas na Motobox. */
  numeros: { valor: string; label: string }[];
  /** Abertura em letra grande: o que é, numa ou duas frases. */
  abertura: string;
  /** Caixa "Em resumo", ao lado do texto. */
  factos: { rotulo: string; valor: string }[];
  /** O que é: formato da prova, o fim-de-semana, a pontuação. */
  formato: Bloco<R>[];
  /** Classes e categorias, em tabelas. */
  classes: Tabela<R>[];
  /** Máquinas típicas e custos (só com fonte). */
  maquinas: Texto<R>[];
  /** Equipamento de protecção essencial. */
  equipamento: Texto<R>[];
  angola: {
    intro: Texto<R>[];
    /** Momentos com data, do mais antigo para o mais recente. */
    marcos: { ano: string; texto: string; fontes: R[] }[];
    blocos: Bloco<R>[];
  };
  /** Campeonatos de referência lá fora. */
  internacional: { nome: string; texto: Texto<R>; seguir?: string }[];
  /** Ligações lusófonas e africanas, quando são reais. */
  lusofonia: Texto<R>[];
  comecar: {
    passos: { titulo: string; texto: Texto<R> }[];
    seguranca: string[];
  };
}

export type ConteudoPagina = ConteudoModalidade<number> & {
  /** Fontes numeradas pela ordem em que aparecem na página (a primeira é a 1). */
  fontes: Fonte[];
};

/** Atalho para escrever um texto com fontes. */
const t = (texto: string, ...fontes: ChaveFonte[]): Texto<ChaveFonte> => ({ texto, fontes });

/* ============================================================
   Motocross
   ============================================================ */

const motocross: ConteudoModalidade<ChaveFonte> = {
  numeros: [
    { valor: "1999", label: "O circuito da Gamek passa para a associação de Luanda" },
    { valor: "56", label: "Pilotos inscritos em Luanda em 2024" },
    { valor: "2026", label: "Angola regressa ao africano de selecções" },
  ],
  abertura:
    "Motocross é corrida em circuito fechado de terra, com saltos, valas e curvas apertadas. Todos partem ao mesmo tempo de uma grelha e ganha quem passa primeiro a bandeira de xadrez. As corridas chamam-se mangas: são curtas, físicas e decidem-se muitas vezes na primeira curva.",
  factos: [
    { rotulo: "Federação", valor: "FAM, Federação Angolana de Motociclismo (na FIM desde 2025)" },
    { rotulo: "Pista permanente", valor: "Circuito Jorge Varela, Gamek (Talatona), Luanda" },
    { rotulo: "Classes em Luanda (2026)", valor: "Open, 250, 450, Moto 4, MX 85 e MX 65" },
    { rotulo: "Mundial", valor: "MXGP e MX2, 19 rondas em 2026" },
    { rotulo: "Uma manga no Mundial", valor: "30 minutos mais 2 voltas" },
  ],
  formato: [
    {
      titulo: "Como é uma corrida",
      paragrafos: [
        t("Os pilotos alinham lado a lado atrás de um portão (o gate) que cai ao mesmo tempo para todos. A primeira curva conta muito: quem sai à frente foge à terra levantada e às quedas do pelotão. Depois é uma corrida de voltas a um circuito de terra, com saltos, ondulações e curvas com berma."),
        t("No Mundial (MXGP), cada manga dura 30 minutos mais duas voltas, e cada classe corre duas mangas ao domingo. Ao sábado há uma corrida de qualificação que define a ordem por que os pilotos escolhem o lugar na grelha.", "wikiMxgp"),
        t("Em Angola, o regulamento nacional de 2017 pedia pistas entre 1,4 e 3 km de comprimento e com 6 a 10 metros de largura.", "fadmRegMx2017"),
      ],
    },
    {
      titulo: "Pontuação",
      paragrafos: [
        t("No Mundial, cada manga dá pontos aos 20 primeiros: 25 ao vencedor, depois 22, 20, 18, 16, 15 e um a menos por lugar até 1 ponto ao vigésimo. Desde 2023, a corrida de qualificação de sábado também conta para o campeonato (10 pontos ao primeiro, até 1 ao décimo), mas não entra no resultado do Grande Prémio.", "mxgpPontos", "mxgp2023Reg"),
        t("No Motocross das Nações é ao contrário: cada piloto soma o lugar em que chegou, a equipa descarta o pior resultado e ganha o país com menos pontos.", "wikiMxon"),
      ],
    },
  ],
  classes: [
    {
      titulo: "Mundial de Motocross (FIM)",
      colunas: ["Classe", "Motor", "Quem corre"],
      linhas: [
        ["MXGP", "Até 450 cc a quatro tempos ou 250 cc a dois tempos", "A classe principal do Mundial"],
        ["MX2", "Até 250 cc a quatro tempos ou 125 cc a dois tempos", "Dos 15 anos até ao fim do ano em que o piloto faz 23"],
      ],
      nota: t("Cilindradas e limite de idade da MX2 segundo a FIM.", "wikiMxgp", "mxgpIdadeMx2"),
    },
    {
      titulo: "Provincial de Motocross de Luanda (2026)",
      colunas: ["Classe", "O que é"],
      linhas: [
        ["MX 65", "Formação: motas de 65 cc, para os mais novos"],
        ["MX 85", "O degrau seguinte da formação, com motas de 85 cc"],
        ["250", "Motas de 250 cc"],
        ["450", "Motas de 450 cc"],
        ["Open", "Classe aberta, a dos nomes mais conhecidos"],
        ["Moto 4", "Quads, na mesma pista e no mesmo dia"],
      ],
      nota: t("Classes da oitava ronda de 2026, no Circuito Jorge Varela. O regulamento nacional de 2017 tinha só duas: Moto 4 (450 cc) e 250 cc.", "abolaJV2026", "opaisMx2024", "fadmRegMx2017"),
    },
  ],
  maquinas: [
    t("Uma mota de motocross é leve, tem suspensões de curso longo e pneus de tacos, e não tem luzes nem matrícula: é só para a pista."),
    t("Preço de referência de uma 450 nova: a KTM 450 SX-F de 2026 custa 11 649 dólares nos Estados Unidos, mais 690 de transporte, e a 450 de motocross da KTM está à venda em Portugal por 12 049 euros. Para Angola, junte o frete e a importação.", "ktm450us", "andardemotoKtm"),
    t("Organizar também custa: em 2024, a associação de Luanda estimava cerca de 7,44 milhões de kwanzas por prova.", "opaisMx2024"),
  ],
  equipamento: [
    t("Capacete integral de motocross e óculos próprios. Nos campeonatos da FIM, a partir de 2026, o capacete tem de ter a homologação FRHPhe-02.", "fimCapacetes"),
    t("Botas de motocross, altas e rígidas, joelheiras, cotoveleiras e luvas.", "motorcycleGear"),
    t("Colete de protecção para o peito e as costas e, para muitos pilotos, colar cervical (neck brace).", "motorcycleGear"),
    t("Camisola e calças de motocross, largas e resistentes, por cima das protecções.", "motorcycleGear"),
  ],
  angola: {
    intro: [
      t("O motocross é a modalidade de mota com mais vida organizada em Angola, mas vive quase só em Luanda. Em 2024, o presidente da associação provincial, Osvaldo Gouveia, dizia que o estado da modalidade a nível nacional era crítico «porque só é praticada em Luanda». Havia então 56 pilotos inscritos, em quatro classes.", "opaisMx2024"),
      t("Desde 2024 o motociclismo tem federação própria: a Federação Angolana de Motociclismo (FAM), membro da FIM desde 2025 e presidida por Marcos Fonseca. Antes, as motas estavam na Federação Angolana de Desportos Motorizados (FADM), cujo calendário de 2026 tem velocidade automóvel, rali-raid, karting e drift e drag.", "famFim", "fimAfricaViegas", "fadmCalendarios"),
    ],
    marcos: [
      { ano: "1999", texto: "A associação de Luanda recebe o circuito da Gamek, em Talatona, que substitui o antigo circuito Airton Senna, no Rocha Pinto.", fontes: ["opaisJorgeVarela2018"] },
      { ano: "2005", texto: "Morre num acidente de viação Jorge Varela, «Jorginho», três vezes campeão provincial de Luanda, que correu no Zimbabwe, na Namíbia e nos dois Congos e treinou em Portugal. Nesse mês tinha ganho os 250 cc na República do Congo. A pista permanente de Luanda chama-se hoje Circuito Jorge Varela.", fontes: ["angonoticiasVarela", "mxcircuitJV"] },
      { ano: "2017", texto: "A FADM aprova o regulamento do Campeonato Angolano de Motocross, com as classes Moto 4 (450 cc) e 250 cc.", fontes: ["fadmRegMx2017"] },
      { ano: "2018", texto: "A administração de Talatona dá oito dias à associação para retirar o equipamento do circuito, por falta de regularização do terreno. A pista continua a receber provas em 2026.", fontes: ["opaisJorgeVarela2018", "abolaJV2026"] },
      { ano: "2024", texto: "O motocross volta ao Sumbe: o GP Cidade do Sumbe, no circuito Nuno Canadiano (Quicombo), é a primeira prova ali em quase 22 anos. Ganham Orlando Ribeiro (Open) e Nilton Gomes (Moto 4).", fontes: ["opaisSumbe2024"] },
      { ano: "2026", texto: "Em Fevereiro, corrida internacional na pista João Tomé, em Cabinda, com 19 pilotos, sete deles do Congo. Ricardo Jorge ganha a 450 Open.", fontes: ["giraCabinda2026"] },
      { ano: "2026", texto: "Em Agosto, Angola volta ao Motocross das Nações Africanas, em Windhoek (Namíbia), e acaba em 9.º entre 10 países. Em Setembro, a FAM diz querer organizar a edição de 2027 na pista de Luanda.", fontes: ["mxoan2026", "fimAfricaViegas"] },
    ],
    blocos: [
      {
        titulo: "Onde se corre",
        paragrafos: [
          t("O Circuito Jorge Varela, na Gamek (Estrada Pedro de Castro Van-Dúnem Loy, Talatona), é apontado como o único traçado permanente de motocross do país. É lá que corre o Provincial de Luanda.", "mxcircuitJV", "opaisJorgeVarela2018", "abolaJV2026"),
          t("Fora de Luanda há pistas que ganham vida quando há prova: o Nuno Canadiano, no Quicombo (Sumbe), e a pista João Tomé, em Cabinda. No Lubango, o piloto Erikson Carvalho ajudou a abrir uma pista improvisada no Cristo Rei; o seu desabafo deu título a uma entrevista: «Não existe desporto motorizado em Angola».", "opaisSumbe2024", "giraCabinda2026", "opaisErikson"),
        ],
      },
      {
        titulo: "Quem está a ganhar em Luanda",
        paragrafos: [
          t("Antes da oitava ronda do Provincial de Luanda, no fim de Setembro de 2026, Fernando Baptista, «Fernas», liderava o Open com 230 pontos, à frente de Ricardo Jorge (208), Orlando Ribeiro (189) e Zeferino Fernandes, «Zé Cazenga» (172). Na Moto 4 liderava Fernando Santos (186). Nas classes de formação, Aires Ramos (MX 85) e Gabriel Barros (MX 65) tinham 250 pontos cada.", "abolaJV2026"),
          t("O campeonato é organizado pela Associação Provincial de Motocross de Luanda, que em 2024 era presidida por Osvaldo Gouveia.", "opaisMx2024"),
        ],
      },
      {
        titulo: "A selecção lá fora",
        paragrafos: [
          t("Em Agosto de 2026, a selecção, orientada por Tomás Chabula, viajou por estrada até Windhoek para o Motocross das Nações Africanas da FIM Africa. Zion de Araújo (MX65) e Diego dos Santos (MX125) pontuaram; Angola ficou em 9.º, à frente de Moçambique, e recebeu o primeiro prémio de sustentabilidade da prova.", "rnaCaravana2026", "mxoan2026", "fimAfricaResultados", "fimAfricaViegas"),
          t("No Motocross das Nações mundial, Angola não consta da lista de equipas de 2026.", "mxonEquipas"),
        ],
      },
    ],
  },
  internacional: [
    {
      nome: "MXGP, o Mundial de Motocross",
      texto: t("O campeonato do mundo da FIM tem duas classes, MXGP e MX2. Em 2026 teve 19 rondas, entre elas o Grande Prémio de Portugal, em Águeda, a 28 de Junho.", "wikiMxgp", "wikiMxgp2026"),
      seguir: "No site oficial mxgp.com e no serviço de vídeo MXGP-TV, com as corridas em directo e em diferido.",
    },
    {
      nome: "Motocross das Nações",
      texto: t("Desde 1947, cada país leva três pilotos (MXGP, MX2 e Open) a três corridas. A Austrália ganhou em 2024 e em 2025; a edição de 2026 é em Ernée, em França.", "wikiMxon"),
    },
    {
      nome: "Motocross das Nações Africanas",
      texto: t("A prova de selecções do continente, da FIM Africa. Em 2026 correu-se em Windhoek, na Namíbia, com 10 países, e Angola quer recebê-la em 2027.", "mxoan2026", "fimAfricaViegas"),
    },
  ],
  lusofonia: [
    t("Portugal recebe uma ronda do Mundial (Águeda, em 2026). Foi também em Portugal, em 1995, que Jorge Varela treinou antes de correr pela região.", "wikiMxgp2026", "angonoticiasVarela"),
    t("Em Setembro de 2026, o presidente da FIM, Jorge Viegas, esteve em Luanda com a FAM e com o ministro da Juventude e Desportos e visitou a pista de motocross.", "fimAfricaViegas"),
  ],
  comecar: {
    passos: [
      {
        titulo: "Começar nas classes de formação",
        texto: t("Em Luanda, os mais novos começam na MX 65 e passam à MX 85, as classes de formação do Provincial. As outras classes (250, 450 e Open) separam-se pela cilindrada.", "opaisMx2024", "abolaJV2026"),
      },
      {
        titulo: "Tirar a licença desportiva",
        texto: t("O regulamento de 2017 pedia ficha de inscrição, bilhete de identidade ou cédula, ficha médica carimbada pelo Centro Nacional de Medicina Desportiva ou por um hospital acreditado, autorização dos pais reconhecida no notário (para menores de 18 anos) e duas fotografias. Confirme o processo actual junto da FAM, a federação do motociclismo desde 2024.", "fadmRegMx2017", "famFim"),
      },
      {
        titulo: "Aparecer no Jorge Varela",
        texto: t("A melhor porta de entrada é ir a uma ronda do Provincial de Luanda e falar com a associação e com os pilotos. O contacto público da FAM, segundo a FIM, é famotociclismo.angola@outlook.com.", "famFim"),
      },
      {
        titulo: "Fazer as contas",
        texto: t("Uma 450 nova anda pelos 12 mil euros na Europa, antes de chegar a Angola. Junte o equipamento, pneus, peças e o transporte para as provas. Uma mota usada baixa muito a entrada: confirme sempre o número de quadro e os documentos.", "andardemotoKtm"),
      },
    ],
    seguranca: [
      "Nunca ande sozinho numa pista: tem de haver alguém que possa pedir ajuda.",
      "Faça a primeira volta devagar e conheça os saltos antes de os atacar.",
      "Respeite as bandeiras: a amarela quer dizer perigo, abrandar e não ultrapassar.",
      "Beba água antes, durante e depois. Em Angola corre-se com muito calor.",
      "Antes de cada sessão, veja travões, corrente, pneus e o botão de corte do motor.",
    ],
  },
};

/* ============================================================
   Enduro
   ============================================================ */

const enduro: ConteudoModalidade<ChaveFonte> = {
  numeros: [
    { valor: "1913", label: "Primeiros Seis Dias de Enduro" },
    { valor: "100.ª", label: "Edição dos Seis Dias, em Portugal, em 2026" },
    { valor: "350 cc", label: "A mota de enduro do campeão angolano de rali-raid de 2024" },
  ],
  abertura:
    "Enduro é resistência e regularidade fora do circuito fechado. O piloto faz um percurso longo por trilhos, com hora marcada para chegar a cada controlo, e pelo meio há troços cronometrados, as especiais. Ganha quem é mais rápido nas especiais sem perder tempo nos controlos.",
  factos: [
    { rotulo: "Em Angola", valor: "Sem campeonato de enduro documentado; as motas de enduro correm no rali-raid (classe M)" },
    { rotulo: "Mundial", valor: "EnduroGP: 8 provas de dois dias, 16 corridas" },
    { rotulo: "Classes do Mundial", valor: "E1, E2 e E3, mais Júnior, Youth e Feminina" },
    { rotulo: "Seis Dias (ISDE)", valor: "100.ª edição em Grândola, Portugal, de 12 a 17 de Outubro de 2026" },
    { rotulo: "Na região", valor: "Roof of Africa, no Lesoto, ronda do Mundial de Hard Enduro" },
  ],
  formato: [
    {
      titulo: "Como é uma prova",
      paragrafos: [
        t("O objectivo é chegar a cada controlo dentro de um horário rigoroso: chegar cedo ou tarde dá penalização. Ao longo do dia há também tempos marcados para abastecer e tratar da mota, e a ajuda de fora, quando não é permitida, também penaliza.", "wikiEnduro"),
        t("A classificação faz-se nas especiais, troços cronometrados ao segundo. No Mundial EnduroGP, todas as rondas têm três tipos: o Enduro Test, em trilho natural; o Cross Test, num traçado de motocross; e o Extreme Test, curto e muito técnico.", "wikiEnduroGP", "wikiEnduro"),
      ],
    },
    {
      titulo: "O Mundial e os pontos",
      paragrafos: [
        t("O EnduroGP tem oito provas de dois dias, e cada dia conta como uma corrida: 16 ao todo. Pontuam os 20 mais rápidos de cada classe, com 25 pontos ao vencedor, 22 ao segundo e 20 ao terceiro.", "wikiEnduroGP"),
      ],
    },
  ],
  classes: [
    {
      titulo: "Mundial de Enduro (FIM)",
      colunas: ["Classe", "Motor"],
      linhas: [
        ["E1", "Até 250 cc, a dois e a quatro tempos"],
        ["E2", "De 255 a 450 cc, a quatro tempos"],
        ["E3", "Mais de 255 cc a dois tempos e mais de 450 cc a quatro tempos"],
        ["EnduroGP", "A geral: os melhores de E1, E2 e E3 numa só tabela"],
      ],
      nota: t("Há ainda classificações para juniores, jovens (Youth) e senhoras.", "wikiEnduroGP"),
    },
  ],
  maquinas: [
    t("Uma mota de enduro junta a suspensão longa e a potência de uma mota de motocross com o que é preciso para durar horas: os motores andam, em regra, entre 125 e 300 cc a dois tempos ou entre 250 e 650 cc a quatro tempos.", "wikiEnduro"),
    t("Em Angola, a mota do campeão absoluto do rali-raid de 2024, Bruno Jorge, era uma KTM EXC 350, um modelo de enduro.", "opaisCarr2024"),
  ],
  equipamento: [
    t("Capacete homologado (FRHPhe-02 nas provas da FIM desde 2026), óculos e botas de todo-o-terreno.", "fimCapacetes"),
    t("Colete de protecção, joelheiras, cotoveleiras e luvas, como no motocross.", "motorcycleGear"),
    t("Mochila de hidratação, ferramenta básica e material para furos: no enduro, a mota tem de chegar ao fim do dia."),
  ],
  angola: {
    intro: [
      t("Em Angola não encontrámos, em fontes públicas, um campeonato, uma prova ou um clube de enduro. O calendário de 2026 da FADM não tem enduro, e na reunião de Agosto de 2026 entre a FIM e o Governo as disciplinas referidas foram o rali, o motocross e a velocidade.", "fadmCalendarios", "opaisFimMinistro2026"),
      t("As motas de enduro correm, sim, no Campeonato Angolano de Rali/Raid (CARR), na classe M. Em 2024, o campeão absoluto do CARR foi Bruno Jorge, da Interluso Racing Team, numa KTM EXC 350, à frente dos carros, dos SSV e dos quads. A última prova foi em Porto Amboim (Cuanza-Sul), com 23 pilotos.", "opaisCarr2024"),
    ],
    marcos: [
      { ano: "2024", texto: "Bruno Jorge, numa KTM EXC 350, é campeão absoluto do Campeonato Angolano de Rali/Raid.", fontes: ["opaisCarr2024"] },
      { ano: "2026", texto: "O calendário da FADM tem provas de rali TT na Baía Azul (Benguela) e entre Cristalina e Cacuso (Malanje); não tem enduro.", fontes: ["fadmCalendarios"] },
    ],
    blocos: [
      {
        titulo: "Na região",
        paragrafos: [
          t("Para quem quer enduro a sério, a referência na África Austral é o Roof of Africa, no Lesoto, que entrou no Mundial de Hard Enduro em 2023. O sul-africano Wade Young foi 3.º nesse campeonato em 2021 e 2.º em 2024.", "wikiHardEnduro"),
        ],
      },
    ],
  },
  internacional: [
    {
      nome: "EnduroGP, o Mundial de Enduro",
      texto: t("Oito provas de dois dias, com Enduro Test, Cross Test e Extreme Test em todas. Portugal abriu o Mundial de 2025, em Fafe.", "wikiEnduroGP", "enduroGpPortugal"),
      seguir: "No site oficial endurogp.com, com classificações e resumos de cada dia.",
    },
    {
      nome: "Seis Dias de Enduro (ISDE)",
      texto: t("A prova por selecções mais antiga do motociclismo, desde 1913, hoje chamada 6DAYS FIM Enduro of Nations. A 100.ª edição corre-se em Grândola, no Alentejo, de 12 a 17 de Outubro de 2026. O Brasil recebeu-a em 2003.", "wikiIsde", "sixDays2026"),
    },
    {
      nome: "Mundial de Hard Enduro",
      texto: t("O lado extremo do enduro: subidas, pedra e troncos. Começou em 2018 como WESS e é Mundial da FIM desde 2021; Manuel Lettenbichler ganhou de 2022 a 2025.", "wikiHardEnduro"),
    },
  ],
  lusofonia: [
    t("Portugal é casa do enduro: abriu o EnduroGP de 2025 em Fafe, recebe os 100.º Seis Dias em 2026 e já teve uma ronda do Mundial de Hard Enduro, o Extreme XL Lagares.", "enduroGpPortugal", "sixDays2026", "wikiHardEnduro"),
  ],
  comecar: {
    passos: [
      {
        titulo: "Ganhar técnica na pista",
        texto: t("Não encontrámos escola de enduro em Angola. O caminho mais curto é treinar técnica numa pista de motocross, como o Jorge Varela, em Luanda, e somar quilómetros de trilho acompanhado.", "mxcircuitJV"),
      },
      {
        titulo: "Competir no rali-raid",
        texto: t("Hoje, a competição para motas de enduro em Angola é o CARR, na classe M. O calendário sai no site da FADM; fale também com a FAM, a federação do motociclismo, sobre a licença.", "opaisCarr2024", "fadmCalendarios", "famFim"),
      },
      {
        titulo: "Escolher a mota",
        texto: t("Uma mota de enduro com matrícula serve para treinar, passear e competir. Tem de estar legalizada para circular nas ligações por estrada."),
      },
    ],
    seguranca: [
      "Nunca vá sozinho para o trilho e deixe dito o percurso e a hora de regresso.",
      "Leve água, kit de furos, ferramenta e telemóvel carregado.",
      "Abrande nas aldeias e perto de gado: o trilho também é caminho de quem lá vive.",
      "Na areia, peso atrás e acelerador constante; não trave a fundo com a frente.",
    ],
  },
};

/* ============================================================
   Rally-Raid
   ============================================================ */

const rally: ConteudoModalidade<ChaveFonte> = {
  numeros: [
    { valor: "1992", label: "O Dakar atravessa Angola, do Lobito ao Namibe" },
    { valor: "16.º", label: "Soida Rally Team nos SSV do Dakar 2026" },
    { valor: "7", label: "Provas do Campeonato Angolano de Rali/Raid" },
  ],
  abertura:
    "Rally-raid é uma corrida de vários dias por terreno aberto: deserto, savana e pistas de terra, com etapas que podem ter centenas de quilómetros. Não há traçado marcado: o piloto navega com um roadbook, o livro de bordo com o percurso desenhado, e um conta-quilómetros.",
  factos: [
    { rotulo: "Em Angola", valor: "Campeonato Angolano de Rali/Raid (CARR), da FADM" },
    { rotulo: "Classes no CARR", valor: "M (motas), Q (quads), SSV E1 e E2, TT (carros)" },
    { rotulo: "Referência mundial", valor: "Rali Dakar (Arábia Saudita) e Mundial W2RC" },
    { rotulo: "Navegação", valor: "Roadbook e conta-quilómetros; GPS de navegação proibido" },
    { rotulo: "Angola no Dakar", valor: "1992 (passagem), 2006 (Madaleno), 2026 (Soida Rally Team)" },
  ],
  formato: [
    {
      titulo: "Como é uma etapa",
      paragrafos: [
        t("Cada dia tem ligações, feitas a velocidade de estrada, e uma especial cronometrada. Os tempos das especiais somam-se dia após dia, com as penalizações, e ganha quem tiver menos tempo no fim."),
        t("A navegação faz parte da prova: o roadbook, em papel ou digital, mostra o percurso em casas com distâncias e desenhos, e os aparelhos de GPS para navegar não são permitidos.", "wikiRallyRaid"),
      ],
    },
    {
      titulo: "O Dakar",
      paragrafos: [
        t("O Dakar correu em África até 2007, foi cancelado em 2008, passou à América do Sul de 2009 a 2019 e desde 2020 corre-se na Arábia Saudita. A edição de 2026 foi de 3 a 17 de Janeiro.", "wikiDakar", "wikiDakar2026"),
      ],
    },
  ],
  classes: [
    {
      titulo: "Rali Dakar (2026)",
      colunas: ["Categoria", "O que corre"],
      linhas: [
        ["Motas", "RallyGP, Rally2 e Original by Motul (sem assistência)"],
        ["Ultimate", "Carros T1+ e T1, os mais rápidos"],
        ["Stock", "Carros de série"],
        ["Challenger", "T3, protótipos ligeiros"],
        ["SSV", "T4, de base de série"],
        ["Camiões", "T5"],
        ["Classic", "Carros clássicos, à parte da geral"],
      ],
      nota: t("Os quads deixaram de correr no Dakar em 2025.", "wikiDakar2026", "wikiSsv", "advpulseQuads"),
    },
    {
      titulo: "Campeonato Angolano de Rali/Raid: campeões de 2024",
      colunas: ["Classe", "Campeão"],
      linhas: [
        ["M (motas)", "Bruno Jorge, KTM EXC 350, campeão absoluto"],
        ["Q (moto 4)", "Sérgio Pereira, Suzuki LTR450"],
        ["SSV E1", "Francisco e Miguel Albuquerque, Can-Am Maverick X3"],
        ["SSV E2", "Sueli Martins e Roxana Ferraz, Polaris RZR XP 900"],
        ["TT", "Ricardo Sequeira e Jorge Monteiro, Mitsubishi Pajero Evo Proto"],
      ],
      nota: t("Resultados finais de 2024, em Porto Amboim.", "opaisCarr2024"),
    },
  ],
  maquinas: [
    t("Em Angola o rali-raid junta motas de enduro, quads, SSV e jipes. Hugo Carvalho ganhou a SSV1, a classe principal do CARR, no primeiro ano na classe, com um Can-Am Maverick R de cerca de 300 cavalos e perto de 30 adversários.", "comercioCarvalho"),
    t("A primeira dupla angolana no Dakar correu em 2026 num Polaris RZR Pro R Sport, na classe SSV.", "autosportSrt2026"),
  ],
  equipamento: [
    t("Capacete homologado (nas motas, FRHPhe-02 nas provas da FIM desde 2026), colete de protecção, botas e luvas.", "fimCapacetes"),
    t("Água em quantidade, kit de primeiros socorros e forma de pedir ajuda: nas especiais, o socorro pode estar longe."),
    t("Nos SSV e nos carros: fato ignífugo, bacquet e cintos de competição, e rede nas janelas."),
  ],
  angola: {
    intro: [
      t("O rali tem raízes antigas em Angola: o I Rally de Angola foi organizado em 1957 pelo Automóvel e Touring Clube de Angola (ATCA) e atravessava o território.", "topoi"),
      t("Hoje a competição é o Campeonato Angolano de Rali/Raid (CARR), da Federação Angolana de Desportos Motorizados (FADM). Em 2024 teve sete provas, por províncias como o Namibe, Benguela, o Bengo, o Huambo e o Cuanza-Sul, e é das poucas competições que juntam motas, quads, SSV e carros.", "opaisCarr2024", "fadmCalendarios"),
    ],
    marcos: [
      { ano: "1957", texto: "O ATCA organiza o I Rally de Angola.", fontes: ["topoi"] },
      { ano: "1992", texto: "O Paris–Cidade do Cabo, uma edição do Dakar, atravessa Angola: os concorrentes chegam de barco de Pointe-Noire ao Lobito e fazem Lobito–Namibe (500 km, 150 de especial) e Namibe–Ruacana, já na Namíbia. Peterhansel ganha nas motas e Auriol nos carros.", fontes: ["wikiDakar1992"] },
      { ano: "2006", texto: "José Carlos Madaleno termina o Dakar como navegador, num Land Rover Defender 110. Escreveu mais tarde que foram dois angolanos em prova e que foi o único a chegar ao fim.", fontes: ["absoluteMadaleno", "autosportSrt2026"] },
      { ano: "2022", texto: "Nasce a Soida Rally Team (SRT) para correr o CARR; ganha a classe TT no primeiro ano, com uma Nissan Navara.", fontes: ["autosportSrt"] },
      { ano: "2024", texto: "Bruno Jorge (KTM EXC 350) é campeão absoluto do CARR; Francisco e Miguel Albuquerque ganham a classe SSV E1.", fontes: ["opaisCarr2024"] },
      { ano: "2026", texto: "Rui Silva e Francisco Albuquerque, da SRT, correm o Dakar num Polaris RZR: 16.º nos SSV e 2.º entre os estreantes, com 41 equipas à partida e 32 à chegada. É a primeira dupla angolana no Dakar.", fontes: ["autosportSrt2026", "fadmSrt", "minjudDakar", "allafricaSrt"] },
    ],
    blocos: [
      {
        titulo: "Quem organiza",
        paragrafos: [
          t("O CARR é da FADM, que tem uma vice-presidência própria para o rali-raid. A página da direcção da federação indica como presidente António dos Santos.", "fadmDireccao"),
        ],
      },
      {
        titulo: "O caminho até ao Dakar",
        paragrafos: [
          t("A SRT levou três anos a preparar a estreia no Dakar, com o apoio da equipa portuguesa JB Racing. «Pela primeira vez, o país terá uma dupla nacional em prova», dizia Francisco Albuquerque antes da partida.", "allafricaSrt", "autosportSrt2026"),
        ],
      },
    ],
  },
  internacional: [
    {
      nome: "Rali Dakar",
      texto: t("O rali-raid mais famoso do mundo. Em 2026 ganharam o argentino Luciano Benavides (KTM) nas motas e Nasser Al-Attiyah (Dacia) nos carros.", "wikiDakar2026"),
      seguir: "No site oficial dakar.com, com resumos diários e classificações em directo.",
    },
    {
      nome: "W2RC, o Mundial de Rally-Raid",
      texto: t("Campeonato da FIA e da FIM desde 2022, promovido pela organização do Dakar. Em 2025 teve uma ronda na África do Sul (South Africa Safari Rally), e o Rally-Raid Portugal faz parte do calendário em 2025 e 2026.", "wikiW2rc", "wikiW2rc2025", "wikiW2rc2026"),
    },
    {
      nome: "Africa Eco Race",
      texto: t("Nasceu em 2009, quando o Dakar saiu de África, e mantém o percurso clássico: de Tânger, por Marrocos e pela Mauritânia, até Dakar. A edição de 2027 está marcada de 24 de Janeiro a 6 de Fevereiro.", "wikiAfricaEco", "wikiAer2026", "africarace"),
    },
  ],
  lusofonia: [
    t("Portugal tem uma longa história no Dakar: Paulo Gonçalves foi 2.º em 2015 e campeão do mundo de todo-o-terreno em 2013, e morreu no Dakar de 2020; Hélder Rodrigues foi 3.º em 2011 e 2012; Rúben Faria foi 2.º em 2013.", "wikiPauloGoncalves", "ptHelderRodrigues", "wikiDakar2013"),
    t("No W2RC de 2025, os campeões foram o brasileiro Lucas Moraes, nos Ultimate, e o português Alexandre Pinto, nos SSV.", "wikiW2rc2025"),
  ],
  comecar: {
    passos: [
      {
        titulo: "Entrar no CARR",
        texto: t("O Campeonato Angolano de Rali/Raid tem classes para motas, quads, SSV e carros, e é a porta de entrada no rali-raid em Angola. O calendário sai no site da FADM.", "opaisCarr2024", "fadmCalendarios"),
      },
      {
        titulo: "Aprender a navegar",
        texto: t("Treine a leitura do roadbook e dos rumos antes da primeira prova. No rali-raid perde-se muito tempo por erros de navegação, não só de condução."),
      },
      {
        titulo: "Pensar em equipa",
        texto: t("Mesmo nas motas, ninguém faz um raid sozinho: assistência, peças e logística contam tanto como a condução. Ir ao Dakar é um projecto de anos, como mostrou a SRT.", "allafricaSrt"),
      },
      {
        titulo: "Fazer o orçamento",
        texto: t("Não há números públicos do custo de uma época no CARR. Conte com a máquina, as peças, o combustível, as deslocações às províncias e a assistência."),
      },
    ],
    seguranca: [
      "Nunca saia do percurso marcado no roadbook para «cortar caminho».",
      "Leve sempre mais água do que pensa precisar.",
      "Se parar numa especial, saia da trajectória e sinalize o veículo.",
      "Pare para ajudar quem caiu: no rali-raid, o socorro pode demorar.",
    ],
  },
};

/* ============================================================
   Velocidade
   ============================================================ */

const velocidade: ConteudoModalidade<ChaveFonte> = {
  numeros: [
    { valor: "1972", label: "Inauguração do Autódromo de Luanda, em Belas" },
    { valor: "2020", label: "Victor Barros, primeiro angolano no Mundial de Supersport" },
    { valor: "600 cc", label: "A classe das motas no Nacional de Velocidade" },
  ],
  abertura:
    "Velocidade é a corrida de motas em pista de asfalto: circuito fechado, partida parada e curvas tomadas com o joelho no chão. Em Angola corre-se no Autódromo de Luanda e em circuitos de rua, sobretudo com motas de 600 cc.",
  factos: [
    { rotulo: "Em Angola", valor: "Nacional de Velocidade, com a classe 600 à cabeça" },
    { rotulo: "Pistas", valor: "Autódromo de Luanda (Belas) e circuitos citadinos" },
    { rotulo: "Federações", valor: "FAM (motas) e FADM (automóveis)" },
    { rotulo: "Mundial", valor: "MotoGP, Moto2 e Moto3; Mundial de Superbike" },
    { rotulo: "Pontos num Grande Prémio", valor: "25, 20, 16, 13, 11… até 1 ponto ao 15.º" },
  ],
  formato: [
    {
      titulo: "Como é uma corrida",
      paragrafos: [
        t("Os pilotos partem parados de uma grelha ordenada pela qualificação e fazem um número fixo de voltas. Ganha quem cruza primeiro a meta."),
        t("No MotoGP, a sexta-feira tem treinos e os dez mais rápidos passam directamente à Q2. No sábado há a qualificação em duas partes de 15 minutos (Q1 e Q2) e uma corrida sprint à tarde; no domingo, o Grande Prémio.", "intentsgp"),
        t("Em Angola, em Julho de 2017, a classe EVO600 correu duas corridas no Autódromo de Luanda: Victor Barros ganhou ambas, à frente de Marcos Fonseca e Hélder Coelho, «Vuty».", "ltiAngola2017"),
      ],
    },
    {
      titulo: "Pontuação",
      paragrafos: [
        t("No Grande Prémio pontuam os 15 primeiros: 25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 e 1. A sprint, que existe desde 2023, dá 12, 9, 7, 6, 5, 4, 3, 2 e 1 aos nove primeiros.", "wikiGP"),
        t("No Mundial de Superbike há três corridas por fim-de-semana: a Corrida 1 ao sábado, e ao domingo a Superpole Race, de 10 voltas, e a Corrida 2.", "wikiWsbk"),
      ],
    },
  ],
  classes: [
    {
      titulo: "Mundial de Motociclismo",
      colunas: ["Classe", "Motor", "Nota"],
      linhas: [
        ["MotoGP", "1000 cc; 850 cc a partir de 2027", "A classe principal"],
        ["Moto2", "Triumph de 765 cc e três cilindros", "Motor igual para todos"],
        ["Moto3", "250 cc, um cilindro", "Pilotos com menos de 28 anos"],
        ["MotoE", "Eléctrica", "Em pausa depois de 2025"],
      ],
      nota: t("Motores e regras segundo a Wikipedia.", "wikiGP", "wikiMotoE"),
    },
    {
      titulo: "Mundial de Superbike e classes de apoio",
      colunas: ["Classe", "Motas"],
      linhas: [
        ["WorldSBK", "Motas derivadas de série: 1000 cc de quatro cilindros ou até 1200 cc bicilíndricas"],
        ["WorldSSP", "Supersport, motas médias; a classe em que Victor Barros correu em 2020"],
        ["Sportbike", "Nova em 2026, substitui a WorldSSP300"],
      ],
      nota: t("Classes e motores segundo a Wikipedia.", "wikiWsbk", "wikiSportbike2026", "wikiWssp2020"),
    },
    {
      titulo: "Em Angola",
      colunas: ["Classe", "O que se sabe"],
      linhas: [
        ["600", "A classe principal; Victor Barros foi campeão nacional em 2015, 2017 e 2018"],
        ["DT", "Motas pequenas; 27 inscritas nos 200 km da Huíla de 2025"],
        ["FZ", "18 inscritas nos 200 km da Huíla de 2025"],
        ["Supermoto", "Também no drag: abriram a época de 2026, em Malanje"],
      ],
      nota: t("Fontes: imprensa angolana e portuguesa; não há regulamento público da classe.", "motosportBarros", "opais200kmHuila", "abolaMalanje2026"),
    },
  ],
  maquinas: [
    t("A classe principal em Angola é a das 600 desportivas, como a Yamaha YZF-R6 com que Victor Barros correu no Mundial de Supersport.", "wikiWssp2020"),
    t("Não encontrámos preços publicados em Angola de motas de pista ou de uma época de competição."),
  ],
  equipamento: [
    t("Fato de cabedal inteiro, com protecções e, cada vez mais, airbag: no MotoGP o airbag é obrigatório desde 2018 e tem de cobrir pelo menos os ombros e as clavículas.", "crashAirbag"),
    t("Capacete integral homologado; nas provas da FIM, FRHPhe-02 a partir de 2026.", "fimCapacetes"),
    t("Botas e luvas de pista, com protecção de tornozelo e de palma, e protector de costas."),
  ],
  angola: {
    intro: [
      t("A velocidade em Angola tem duas vidas. A primeira é a dos anos 60 e 70, quando Luanda tinha corridas de rua no Circuito da Fortaleza e, a partir de 1972, um autódromo em Belas. Os registos dessa época são quase todos de automóveis, mas houve motas: o II Festival Motor de Luanda, em Maio de 1968, abriu com uma corrida de motorizadas.", "topoi", "wikiAutodromoLuanda", "jornalClassicos1968"),
      t("A segunda é a de hoje: um Nacional de Velocidade em que as motas de 600 cc correm no Autódromo de Luanda e em circuitos de rua, como os 200 km da Huíla, no Lubango.", "ltiAngola2017", "opais200kmHuila"),
    ],
    marcos: [
      { ano: "1968", texto: "O II Festival Motor de Luanda, no Circuito da Fortaleza, abre com uma corrida de motorizadas.", fontes: ["jornalClassicos1968"] },
      { ano: "1972", texto: "Abrem o Autódromo de Benguela (21 de Maio) e o de Luanda (28 de Maio), em Belas, perto do Mussulo.", fontes: ["wikiAutodromoBenguela", "wikiAutodromoLuanda"] },
      { ano: "2011", texto: "No Troféu Motos 600cc da associação de Luanda, com 26 pilotos, Hélder Coelho comanda à frente de Daniel Afonso e Victor Barros. No Huambo, o antigo circuito das 6 Horas de Nova Lisboa recebe um Grande Prémio para motas de 600 cc.", fontes: ["apdmlBlog", "voaHuambo2011"] },
      { ano: "2018", texto: "Victor Barros é campeão nacional de velocidade pela terceira vez (depois de 2015 e 2017).", fontes: ["motosportBarros"] },
      { ano: "2020", texto: "Barros estreia-se no Mundial de Supersport, no Estoril, numa Yamaha YZF-R6: é o primeiro angolano no campeonato.", fontes: ["motojornalBarros", "wikiWssp2020"] },
      { ano: "2021", texto: "Barros ganha a Copa Dunlop Motoval 600, no Estoril.", fontes: ["verangolaBarros"] },
      { ano: "2025", texto: "Os 200 km da Huíla, no circuito de rua da Nossa Senhora do Monte (Lubango), juntam 13 motas de 600, 27 DT e 18 FZ.", fontes: ["opais200kmHuila"] },
      { ano: "2026", texto: "A época abre em Malanje (28 de Fevereiro e 1 de Março) com velocidade, drift e drag; as supermotos correm na recta de 400 m. Em Setembro, a FIM Africa refere planos do Governo para um novo circuito no sul do país, pensado para receber Fórmula 1 e MotoGP.", fontes: ["abolaMalanje2026", "fimAfricaViegas"] },
    ],
    blocos: [
      {
        titulo: "Victor Barros, o nome a conhecer",
        paragrafos: [
          t("Natural do Sumbe, começou a andar de mota aos 16 anos, nas motas-táxi (as kupapas), e a correr em 2008, na classe DT 50. Foi campeão nacional de velocidade em 2015, 2017 e 2018, com a Team Kwanza Sul. Em 2020 mudou-se para o campeonato português e, nesse ano, aos 36, foi o primeiro angolano no Mundial de Supersport, no Estoril. Em 2021 ganhou a Copa Dunlop Motoval 600.", "motojornalBarros", "motosportBarros", "wikiWssp2020", "verangolaBarros"),
        ],
      },
      {
        titulo: "O Autódromo de Luanda",
        paragrafos: [
          t("Fica em Belas, perto do Mussulo, a cerca de 25 km do centro de Luanda, e tem cinco configurações, de 3,208 a 6,280 km. Depois de 1975 foi base militar e policial; voltou às corridas e tem provas de novo desde Julho de 2021. O de Benguela, aberto uma semana antes, está degradado desde pelo menos 2005.", "wikiAutodromoLuanda", "racingcircuitsLuanda", "wikiAutodromoBenguela"),
        ],
      },
    ],
  },
  internacional: [
    {
      nome: "MotoGP, o Mundial de Motociclismo",
      texto: t("Três classes: MotoGP, Moto2 e Moto3. Em 2026, o Grande Prémio de Portugal é em Portimão, a 22 de Novembro, e o do Brasil voltou ao calendário, em Goiânia.", "wikiGP", "wikiMotogp2026"),
      seguir: "No site motogp.com e no serviço VideoPass, com todas as sessões em directo e em diferido.",
    },
    {
      nome: "WorldSBK, o Mundial de Superbike",
      texto: t("O campeonato das motas derivadas de série. Em 2026 tem duas provas em Portugal: Portimão, em Março, e Estoril, a 10 e 11 de Outubro.", "wikiWsbk", "wikiWsbk2026"),
      seguir: "No site oficial worldsbk.com.",
    },
    {
      nome: "África do Sul",
      texto: t("O Grande Prémio da África do Sul correu-se em Kyalami (1983 a 1985 e 1992) e em Welkom, no Phakisa Freeway, de 1999 a 2004. Kyalami recebeu também o Mundial de Superbike.", "wikiSaGp", "wikiKyalami"),
    },
  ],
  lusofonia: [
    t("Miguel Oliveira foi o primeiro português a ganhar um Grande Prémio (Moto3, 2015) e venceu cinco vezes no MotoGP, incluindo Portimão em 2020. Em 2026 corre no Mundial de Superbike, pela BMW.", "wikiOliveira"),
    t("Brad Binder, sul-africano, foi campeão de Moto3 em 2016 e é o único sul-africano a ganhar no MotoGP (Brno, 2020); o irmão, Darryn, chegou ao MotoGP em 2022.", "wikiBinder", "wikiDarrynBinder"),
  ],
  comecar: {
    passos: [
      {
        titulo: "Rodar em pista antes de correr",
        texto: t("O primeiro passo é rodar em circuito fechado, sem trânsito nem buracos, e aprender as trajectórias. Na África do Sul há circuitos com dias de pista abertos a particulares, como o Red Star Raceway, em Delmas.", "redStar"),
      },
      {
        titulo: "Tirar a licença",
        texto: t("A licença desportiva de motociclismo é da FAM. Fale com a federação antes de comprar a mota: ela diz em que classe pode começar e que exames e documentos são precisos.", "famFim"),
      },
      {
        titulo: "Começar pequeno",
        texto: t("Em Angola há classes para motas pequenas: Victor Barros começou na DT 50, e nos 200 km da Huíla de 2025 correram 27 DT e 18 FZ, além das 600.", "motosportBarros", "opais200kmHuila"),
      },
      {
        titulo: "Nunca na estrada",
        texto: t("A estrada pública não é pista. Velocidade faz-se em circuito fechado, com comissários, ambulância e escapatórias."),
      },
    ],
    seguranca: [
      "Corridas na Marginal ou em avenidas abertas matam: a velocidade é só em circuito fechado.",
      "Pneus frios não agarram: as primeiras voltas são para os aquecer.",
      "Respeite as bandeiras: amarela é perigo e proibido ultrapassar; vermelha é parar.",
      "Fato, botas, luvas e capacete homologados em todas as sessões, mesmo em treino.",
    ],
  },
};

/* ============================================================
   Moto 4 e quads
   ============================================================ */

const moto4: ConteudoModalidade<ChaveFonte> = {
  numeros: [
    { valor: "2024", label: "Sérgio Pereira, campeão de moto 4 no rali-raid angolano" },
    { valor: "186", label: "Pontos do líder da Moto 4 em Luanda (Setembro de 2026)" },
    { valor: "2025", label: "O Dakar deixa de ter quads" },
  ],
  abertura:
    "Moto 4 é o nome que em Angola se dá aos quads: motas de quatro rodas, com guiador e selim, que correm em pistas de motocross, no rali-raid e nas dunas. Ao lado delas cresceram os SSV, buggies de dois lugares lado a lado, com volante e cintos.",
  factos: [
    { rotulo: "Em Angola", valor: "Classe Moto 4 no motocross e classe Q no rali-raid (CARR)" },
    { rotulo: "SSV no CARR", valor: "Classes E1 e E2; a SSV1 é a classe principal" },
    { rotulo: "Quad de corrida típico", valor: "450 cc, como o Suzuki LTR450" },
    { rotulo: "Dakar", valor: "Sem quads desde 2025; SSV na categoria T4" },
    { rotulo: "Para experimentar", valor: "Aluguer no Mussulo, a partir de 30 000 Kz por meia hora" },
  ],
  formato: [
    {
      titulo: "Na pista de motocross",
      paragrafos: [
        t("Nas pistas de motocross, os quads correm mangas como as motas, com partida em grelha. Em Luanda, a Moto 4 é uma das seis classes do Provincial e corre no mesmo dia que as motas, no Circuito Jorge Varela.", "abolaJV2026"),
      ],
    },
    {
      titulo: "No rali-raid",
      paragrafos: [
        t("No rali-raid, os quads fazem as mesmas especiais que as motas e os carros, com navegação por roadbook. No Campeonato Angolano de Rali/Raid têm classe própria (Q), e os SSV têm duas (E1 e E2).", "opaisCarr2024", "wikiRallyRaid"),
      ],
    },
  ],
  classes: [
    {
      titulo: "Em Angola",
      colunas: ["Classe", "Onde", "Quem ganha"],
      linhas: [
        ["Moto 4", "Provincial de Motocross de Luanda", "Fernando Santos lidera em 2026 (186 pontos), à frente de Edson Miranda, «Roquinho» (180), e Edson Sebastião (169)"],
        ["Q", "Rali-raid (CARR)", "Sérgio Pereira, campeão de 2024 num Suzuki LTR450"],
        ["SSV E1", "Rali-raid (CARR)", "Francisco e Miguel Albuquerque, Can-Am Maverick X3 (2024)"],
        ["SSV E2", "Rali-raid (CARR)", "Sueli Martins e Roxana Ferraz, Polaris RZR XP 900 (2024)"],
      ],
      nota: t("Classificação de Luanda antes da oitava ronda de 2026 e campeões do CARR de 2024.", "abolaJV2026", "opaisCarr2024"),
    },
    {
      titulo: "Lá fora",
      colunas: ["Classe", "Onde corre"],
      linhas: [
        ["T3 (Challenger)", "Dakar e W2RC: protótipos ligeiros"],
        ["T4 (SSV)", "Dakar e W2RC: SSV de base de série"],
        ["Quad", "W2RC (classe FIM Quad) e Africa Eco Race; já não no Dakar"],
        ["Quadcross", "Quadcross das Nações, em pista de motocross"],
      ],
      nota: t("Categorias segundo a Wikipedia.", "wikiSsv", "wikiW2rc2025", "wikiAer2026", "wikiQuadcross"),
    },
  ],
  maquinas: [
    t("O quad de corrida típico é um desportivo de 450 cc, como o Suzuki LTR450 do campeão do CARR de 2024. Nos SSV, os campeões angolanos de 2024 correram com Can-Am Maverick e Polaris RZR.", "opaisCarr2024"),
    t("Para experimentar sem comprar: no Mussulo, a Okwambi Rentals anuncia moto 4 a 30 000 Kz e UTV a 45 000 Kz por 30 minutos.", "okwambi"),
  ],
  equipamento: [
    t("Nos quads, o mesmo que no motocross: capacete integral, óculos, colete, botas, luvas, joelheiras e cotoveleiras.", "motorcycleGear"),
    t("Nos SSV: capacete, cintos de competição bem apertados e rede nas janelas; braços e mãos sempre dentro do habitáculo."),
  ],
  angola: {
    intro: [
      t("Os quads têm lugar na competição angolana há anos. O regulamento nacional de motocross de 2017 tinha só duas classes, e uma era a Moto 4 (450 cc). José Carlos Madaleno conta que correu o campeonato nacional de todo-o-terreno numa moto 4, na classe de quatro tempos.", "fadmRegMx2017", "absoluteMadaleno"),
      t("Hoje há moto 4 nas pistas de motocross de Luanda, do Sumbe e de Cabinda, e no rali-raid. Os SSV são já a classe principal do CARR e levaram Angola ao Dakar em 2026.", "abolaJV2026", "opaisSumbe2024", "giraCabinda2026", "comercioCarvalho", "autosportSrt2026"),
    ],
    marcos: [
      { ano: "2014", texto: "Madaleno descreve a Polaris Cup, integrada no Campeonato Nacional de Ralis.", fontes: ["absoluteMadaleno"] },
      { ano: "2017", texto: "O regulamento nacional de motocross da FADM tem a classe Moto 4 (450 cc).", fontes: ["fadmRegMx2017"] },
      { ano: "2024", texto: "Nilton Gomes ganha a Moto 4 no GP Cidade do Sumbe; Sérgio Pereira é campeão da classe Q do CARR.", fontes: ["opaisSumbe2024", "opaisCarr2024"] },
      { ano: "2026", texto: "Em Janeiro, a Soida Rally Team acaba o Dakar em 16.º nos SSV. Em Fevereiro, Edson Sebastião ganha a Moto 4 na corrida internacional de Cabinda.", fontes: ["autosportSrt2026", "giraCabinda2026"] },
    ],
    blocos: [
      {
        titulo: "Passeio e turismo",
        paragrafos: [
          t("No Mussulo, o aluguer de moto 4 e de jet ski faz parte da oferta turística. Na Namíbia, Swakopmund é conhecida pelos passeios de quad nas dunas perto de Langstrand.", "angolaTourismMussulo", "okwambi", "wikiSwakopmund"),
        ],
      },
    ],
  },
  internacional: [
    {
      nome: "Os quads no Dakar",
      texto: t("Os quads correram o Dakar até 2024. O argentino Marcos Patronelli ganhou em 2010, 2013 e 2016, o chileno Ignacio Casale em 2014, 2018 e 2020, e o último vencedor foi o argentino Manuel Andújar, em 2024. Desde 2025 a categoria deixou de existir.", "wikiPatronelli", "wikiCasale", "wikiDakar2024", "advpulseQuads"),
    },
    {
      nome: "W2RC e Africa Eco Race",
      texto: t("Os quads continuam no Mundial de Rally-Raid, na classe FIM Quad, e na Africa Eco Race, onde em 2026 correu o senegalês Alexis Varagne.", "wikiW2rc2025", "wikiAer2026"),
    },
    {
      nome: "Quadcross das Nações",
      texto: t("Desde 2009, as selecções levam três pilotos a três mangas numa pista de motocross. Os Países Baixos ganharam em 2025 e os Estados Unidos em 2023 e 2024.", "wikiQuadcross"),
    },
  ],
  lusofonia: [
    t("Portugal foi 2.º na primeira edição do Quadcross das Nações, em 2009.", "wikiQuadcross"),
    t("O português Alexandre Pinto foi campeão do mundo de SSV no W2RC de 2025, e a dupla angolana no Dakar de 2026 teve a assistência da portuguesa JB Racing.", "wikiW2rc2025", "autosportSrt2026"),
  ],
  comecar: {
    passos: [
      {
        titulo: "Experimentar primeiro",
        texto: t("O aluguer no Mussulo é a forma mais simples de saber se gosta. Peça uma explicação antes de sair e fique na zona indicada.", "okwambi"),
      },
      {
        titulo: "Começar na pista",
        texto: t("A classe Moto 4 do Provincial de Luanda corre no Circuito Jorge Varela, com as motas. A licença é da FAM, a federação do motociclismo.", "abolaJV2026", "famFim"),
      },
      {
        titulo: "Ou no rali-raid",
        texto: t("No CARR, os quads correm na classe Q e os SSV nas classes E1 e E2. O calendário sai no site da FADM.", "opaisCarr2024", "fadmCalendarios"),
      },
    ],
    seguranca: [
      "Os quads capotam: nunca leve passageiro num quad de um lugar.",
      "Capacete e protecções sempre, mesmo num passeio curto.",
      "Nas dunas, suba de frente e nunca atravesse uma crista de lado.",
      "Crianças só em quads da sua medida e sempre com um adulto por perto.",
    ],
  },
};

/* ============================================================
   Motos de água
   ============================================================ */

const motosDeAgua: ConteudoModalidade<ChaveFonte> = {
  numeros: [
    { valor: "1 milha", label: "Distância máxima da costa para motas de água (Decreto 69/14)" },
    { valor: "2026", label: "Luanda recebe o E1, Mundial de barcos eléctricos" },
    { valor: "1992", label: "Nasce o Mundial de Aquabike" },
  ],
  abertura:
    "Motos de água (jet ski) são embarcações pequenas, movidas a jacto de água, em que se vai de pé ou sentado como numa mota. Em competição corre-se num percurso marcado por bóias, com partida em grupo; há também slalom, resistência e freestyle, de saltos e acrobacias.",
  factos: [
    { rotulo: "Em Angola", valor: "Lazer e turismo; sem campeonato de jet ski documentado" },
    { rotulo: "Regras de navegação", valor: "Decreto Presidencial n.º 69/14: até 1 milha da costa, do nascer do sol até uma hora antes do pôr-do-sol" },
    { rotulo: "Onde", valor: "Mussulo e Ilha de Luanda" },
    { rotulo: "Mundial", valor: "UIM-ABP Aquabike, desde 1992" },
    { rotulo: "Em 2026", valor: "Luanda recebeu o E1, Mundial de barcos eléctricos" },
  ],
  formato: [
    {
      titulo: "Ski e Runabout",
      paragrafos: [
        t("Há dois tipos de mota de água: a Ski, em que se vai de pé, e a Runabout, em que se vai sentado e que é a maior. No Mundial de Aquabike, as classes principais são a Runabout GP1, a Ski GP1, a Ski Ladies GP1 e o Freestyle.", "wikiAquabike", "aquabikeNet"),
      ],
    },
    {
      titulo: "Como é uma prova",
      paragrafos: [
        t("As corridas fazem-se em mangas num circuito fechado de bóias. O Mundial tem também slalom, resistência, offshore, o jet raid (só para Runabout) e o freestyle (só para Ski), em que conta a qualidade das manobras.", "wikiAquabike"),
      ],
    },
  ],
  classes: [
    {
      titulo: "Mundial de Aquabike (UIM-ABP)",
      colunas: ["Classe", "Mota"],
      linhas: [
        ["Runabout GP1", "Sentado, as motas maiores"],
        ["Ski GP1", "De pé"],
        ["Ski Ladies GP1", "De pé, feminina"],
        ["Freestyle", "De pé (Ski), manobras e saltos"],
      ],
      nota: t("Em cada tipo há vários escalões técnicos (GP1, GP2, GP3 e Stock).", "wikiAquabike"),
    },
  ],
  maquinas: [
    t("Em Angola há motas de água à venda em lojas náuticas: a Loja Náutica Angola anunciava uma Sea-Doo XP130 nova por 8 317 000 Kz e uma usada, de 2003, por 6 600 000 Kz.", "lojaNautica"),
    t("Para experimentar, a Okwambi Rentals anuncia 30 minutos de jet ski no Mussulo por 35 000 Kz.", "okwambi"),
  ],
  equipamento: [
    t("Colete salva-vidas, sempre vestido."),
    t("Corta-corrente (kill cord) preso ao pulso ou ao colete: se cair, o motor pára e a mota não foge.", "wikiKillSwitch"),
    t("Fato de neoprene ou lycra, luvas, calçado de água e óculos; em competição, capacete e protector de costas."),
  ],
  angola: {
    intro: [
      t("Em Angola, as motas de água são sobretudo lazer. O Mussulo e a Ilha de Luanda são os sítios clássicos, e o aluguer de moto 4 e jet ski faz parte da oferta turística do Mussulo.", "angolaTourismMussulo", "okwambi"),
      t("Não encontrámos um campeonato, uma taça ou uma federação de jet ski em Angola, nem a filiação do país na UIM, a federação internacional da motonáutica. Como competição, a modalidade está por organizar."),
      t("O desporto náutico a motor teve, mesmo assim, um marco em 2026: a 12 e 13 de Setembro, Luanda recebeu a quinta ronda do E1, o Mundial de barcos eléctricos da UIM, a primeira visita do campeonato à África Austral. Ganhou a Team Brady (Emma Kimiläinen e Sam Coleman), e a equipa de Will Smith correu com as cores do «Visit Angola».", "e1Luanda", "allafricaE1", "abolaE1"),
    ],
    marcos: [
      { ano: "1883", texto: "É fundado o Clube Naval de Luanda, na Ilha do Cabo desde os anos 50. A sua actividade é a vela, não a motonáutica.", fontes: ["ptClubeNaval"] },
      { ano: "2014", texto: "O Decreto Presidencial n.º 69/14 aprova o regulamento da náutica de recreio e desportiva, com regras para as motas de água.", fontes: ["lexDecreto69"] },
      { ano: "2022", texto: "O Governo Provincial de Luanda publica a lista das 54 praias da província: 27 autorizadas a banhos, 27 proibidas, 12 com nadadores-salvadores.", fontes: ["luandaPraias"] },
      { ano: "2026", texto: "Luanda recebe o E1 Luanda GP, quinta ronda do Mundial de barcos eléctricos, com pole da Aoki Racing e vitória da Team Brady.", fontes: ["e1Luanda", "forbesE1", "allafricaE1"] },
    ],
    blocos: [
      {
        titulo: "As regras na água",
        paragrafos: [
          t("O Decreto Presidencial n.º 69/14, de 21 de Março de 2014, põe as motas de água na categoria 5: só podem navegar até uma milha da costa e entre o nascer do sol e uma hora antes do pôr-do-sol. Cabe aos governos provinciais separar, nas praias, as zonas de banhistas das de desportos náuticos.", "lexDecreto69"),
          t("Em Luanda, das 54 praias da província, 27 são proibidas a banhos e só 12 têm nadadores-salvadores. Antes de sair, confirme junto da Capitania do Porto e respeite as zonas de banho.", "luandaPraias"),
        ],
      },
      {
        titulo: "Na região",
        paragrafos: [
          t("Na África do Sul, a motonáutica tem uma entidade reconhecida pela UIM, a Powerboat South Africa, e campeões do mundo de jet ski: Dustin Motzouris ganhou títulos da IJSBA em 1995, 1996, 2002 e 2005, e Jared Moore em 2013.", "powerboatSa", "ijsbaCampeoes"),
        ],
      },
    ],
  },
  internacional: [
    {
      nome: "Mundial de Aquabike (UIM-ABP)",
      texto: t("Criado em 1992 e organizado pela H2O Racing para a UIM. O calendário de 2026 passa por Xangai, Olbia (Itália), Doha e uma ronda no Médio Oriente; não há prova em África.", "wikiAquabike", "aquabike2026"),
      seguir: "No site aquabike.net, com resultados e vídeo das mangas.",
    },
    {
      nome: "IJSBA World Finals",
      texto: t("A IJSBA é o organismo mundial das corridas de jet ski, e as suas finais mundiais correm-se em Lake Havasu, no Arizona, tradicionalmente no início de Outubro.", "ijsba", "wikiJetSki"),
    },
    {
      nome: "E1, o Mundial de barcos eléctricos",
      texto: t("Não é jet ski, mas é motonáutica: barcos eléctricos com dois pilotos por equipa. África recebeu a primeira prova em Lagos (Nigéria), em Outubro de 2025, e Luanda a segunda, em Setembro de 2026.", "abolaE1", "premiumTimesLagos", "e1Luanda"),
    },
  ],
  lusofonia: [
    t("Portugal tem pódios no Mundial de Aquabike: Lino Araújo foi 3.º em Runabout GP1 em 2020, 2021 e 2024, Tiago Sousa 2.º em Ski GP1 em 2013 e 2014, e Beatriz Curtinhal 3.ª em Ski Ladies em 2015 e 2016.", "wikiAquabike"),
  ],
  comecar: {
    passos: [
      {
        titulo: "Experimentar com quem sabe",
        texto: t("O aluguer no Mussulo é a forma mais simples de começar. Peça uma explicação antes de sair, use o colete e fique na zona indicada.", "okwambi"),
      },
      {
        titulo: "Tratar dos documentos",
        texto: t("O Decreto 69/14 regula a náutica de recreio. Para ter mota de água própria, confirme na Capitania do Porto o registo da embarcação e o que se exige a quem a conduz.", "lexDecreto69"),
      },
      {
        titulo: "Procurar competição",
        texto: t("Como em Angola não há campeonato, a competição mais próxima é na África do Sul, sob a Powerboat South Africa.", "powerboatSa"),
      },
    ],
    seguranca: [
      "Colete sempre vestido e corta-corrente preso ao corpo.",
      "Longe dos banhistas: respeite as zonas de banho e a distância à costa.",
      "Nunca à noite: a lei só permite navegar até uma hora antes do pôr-do-sol.",
      "Não siga outra mota de água de perto: a esteira esconde quem caiu.",
      "Álcool e água não combinam.",
    ],
  },
};

/* ============================================================
   Karting e automobilismo
   ============================================================ */

const automobilismo: ConteudoModalidade<ChaveFonte> = {
  numeros: [
    { valor: "1957", label: "I Grande Prémio de Angola, nas ruas de Luanda" },
    { valor: "30+", label: "Pilotos no Nacional de Karting, em Benguela (2024)" },
    { valor: "2023", label: "Rui Andrade, campeão do mundo de resistência (LMP2)" },
  ],
  abertura:
    "Karting é a corrida em karts, carros pequenos sem carroçaria nem suspensão, em pistas curtas e sinuosas. É a escola habitual de quem chega aos automóveis, da Fórmula 4 às 24 Horas de Le Mans. O automobilismo inclui depois as corridas de carros em circuito, os ralis e o drift e drag.",
  factos: [
    { rotulo: "Federação", valor: "FADM, Federação Angolana de Desportos Motorizados (membro da FIA)" },
    { rotulo: "Campeonatos de 2026", valor: "Velocidade (CAV), rali-raid (CARR), karting (CAK) e drift e drag (CADD)" },
    { rotulo: "Karting", valor: "Circuito Santos Peras, Benguela" },
    { rotulo: "Autódromo", valor: "Luanda (Belas), inaugurado em 1972" },
    { rotulo: "Em Outubro de 2026", valor: "Karting Africa Show Run, Benguela, 10 e 11 de Outubro" },
  ],
  formato: [
    {
      titulo: "Uma prova de karting",
      paragrafos: [
        t("Um fim-de-semana de karting tem treinos livres, treino cronometrado e corridas curtas por classe. No Mundial da FIA, as classes principais são a OK e a OK-Júnior, sem caixa de velocidades, e a KZ, com caixa.", "wikiFiaKarting"),
      ],
    },
    {
      titulo: "Velocidade, ralis, drift e drag",
      paragrafos: [
        t("O calendário de 2026 da FADM tem quatro campeonatos: velocidade (CAV), rali-raid (CARR), karting (CAK) e drift e drag (CADD). A época abriu em Malanje, a 28 de Fevereiro e 1 de Março, com velocidade, drift e drag.", "fadmCalendarios", "abolaMalanje2026"),
      ],
    },
  ],
  classes: [
    {
      titulo: "Classes de karting",
      colunas: ["Classe", "Onde se corre", "O que é"],
      linhas: [
        ["Cadetes", "Nacional angolano", "Classe de iniciação, para crianças"],
        ["Micro e Mini", "Nacional angolano; Rotax", "Classes Rotax para os mais novos"],
        ["Júnior e Júnior Max", "Nacional angolano; Rotax", "O degrau seguinte"],
        ["DD2", "Nacional angolano; Rotax", "Rotax com duas velocidades, para adultos"],
        ["KZ", "Nacional angolano; Mundial da FIA", "Karts com caixa de velocidades"],
        ["OK e OK-Júnior", "Mundial e Europeu da FIA", "Sem caixa; a OK é a partir dos 14 anos"],
      ],
      nota: t("Classes do Nacional de 2024 segundo a FIA; classes internacionais da FIA e da Rotax.", "fiaKarting", "wikiFiaKarting", "rotaxGF"),
    },
  ],
  maquinas: [
    t("Não encontrámos preços publicados de karts ou de uma época de karting em Angola. Peça orçamento à escola ou ao clube antes de comprar: o kart, os pneus, o motor e as deslocações fazem a conta."),
  ],
  equipamento: [
    t("Capacete de karting homologado: FIA 8878-2024 ou Snell K2020 e K2025.", "fiaKartingNormas", "snell"),
    t("Fato de karting homologado (FIA 8877-2022) e protecção do corpo e das costelas (norma FIA 8870-2018).", "fiaKartingNormas"),
    t("Luvas e botas de karting; cabelo comprido preso dentro do capacete."),
  ],
  angola: {
    intro: [
      t("Angola tem uma das histórias de automobilismo mais ricas de África. Em 1957 correu-se em Luanda o I Grande Prémio de Angola, no circuito de rua da Fortaleza, ao longo da Marginal, e houve edições até 1965 (sem prova em 1961). Em 1962 ganhou o belga Lucien Bianchi.", "topoi"),
      t("Em 1972 abriram dois autódromos: o de Benguela, a 21 de Maio, e o de Luanda, em Belas, a 28 de Maio, desenhado pelo arquitecto brasileiro Ayrton Cornelsen. No Huambo, então Nova Lisboa, as 6 Horas correram-se até 1974; a primeira edição foi em 1968 ou 1969, conforme a fonte.", "wikiAutodromoBenguela", "wikiAutodromoLuanda", "topoi", "rscNovaLisboa", "voaHuambo2011"),
      t("Hoje o automobilismo e o karting são da Federação Angolana de Desportos Motorizados (FADM), o membro angolano da FIA.", "fiaMembros"),
    ],
    marcos: [
      { ano: "1936", texto: "É fundado o Automóvel e Touring Clube de Angola (ATCA), que em 1957 organiza o I Rally de Angola.", fontes: ["topoi"] },
      { ano: "1957", texto: "I Grande Prémio de Angola, no Circuito da Fortaleza, em Luanda.", fontes: ["topoi"] },
      { ano: "1969", texto: "Treze pessoas morrem num acidente no Troféu Palanca Negra, em Luanda, e as corridas de rua são proibidas.", fontes: ["topoi", "rscLuanda"] },
      { ano: "1972", texto: "Abrem os autódromos de Benguela e de Luanda. Roger Heavens (Chevron B21) ganha as 3 Horas de Luanda, e a dupla Santos e Heavens as 6 Horas de Nova Lisboa.", fontes: ["wikiAutodromoLuanda", "rscLuanda1972", "rscNovaLisboa1972"] },
      { ano: "1974", texto: "Jaime do Carmo Guinapo ganha uma corrida em Luanda; o estudo da revista «Topoi» aponta-o como o primeiro vencedor negro documentado.", fontes: ["topoi"] },
      { ano: "2014", texto: "A federação portuguesa (FPAK) apadrinha a adesão da FADM à FIA.", fontes: ["fpakFadm2014"] },
      { ano: "2017", texto: "A 1.ª prova do Nacional de Karting corre-se em Moçâmedes (Namibe), a 19 de Março. Ganham Nuno Diogo (Max), Marco Barreira (DD2) e Élcio Lacerda (KZ).", fontes: ["prodesportoKarting2017"] },
      { ano: "2021", texto: "O presidente da FIA, Jean Todt, lança a primeira pedra de um autódromo no Cabo Ledo (Quiçama), com 41,66 hectares e pistas de karting e de motocross. Não havia prazo para as obras.", fontes: ["verangolaCaboLedo", "novoJornalCaboLedo"] },
      { ano: "2024", texto: "A FIA destaca o karting de base em Angola: mais de 30 pilotos, sobretudo crianças, de Luanda, Benguela, Lubango e Huambo, no Nacional do circuito Santos Peras.", fontes: ["fiaKarting"] },
      { ano: "2026", texto: "Benguela recebe o Karting Africa Show Run, a 10 e 11 de Outubro, com a FADM: 39 pilotos esperados de 14 países, para lançar um campeonato africano em 2027.", fontes: ["kartingAfrica", "economistNa"] },
    ],
    blocos: [
      {
        titulo: "Rui Andrade, de Luanda a Le Mans",
        paragrafos: [
          t("Nascido em Luanda em 1999, começou no karting angolano. Em 2021 foi campeão do European Le Mans Series na LMP2 Pro-Am, o primeiro angolano a ganhar um título internacional no desporto motorizado. Em 2023 foi campeão do mundo de resistência (WEC) na LMP2, com Robert Kubica e Louis Delétraz, e 2.º da classe em Le Mans. Em 2025 ganhou o European Le Mans Series na LMGT3 e foi 3.º da classe em Le Mans.", "wikiRuiAndrade"),
        ],
      },
      {
        titulo: "O karting hoje",
        paragrafos: [
          t("O Nacional de karting é organizado pela escola EK3R, no circuito Santos Peras, em Benguela, com classes Cadetes, Micro, Júnior, Júnior Max, DD2 e KZ; em 2024 corriam nele 12 pilotos formados pela escola.", "fiaKarting"),
          t("Há angolanos no karting da região: no Rotax African Open de 2023, em Zwartkops (Pretória), correram Cleusio Serrão (DD2 Masters), Lucas Campos (Mini Max) e Kiamy Guedes (Micro Max). Os vencedores desta prova africana ganham lugar nas Rotax Grand Finals.", "kartCoZa", "motorsportCoZa"),
        ],
      },
    ],
  },
  internacional: [
    {
      nome: "Mundial de Karting da FIA",
      texto: t("O Mundial e o Europeu da FIA têm as classes OK, OK-Júnior, OK-N, KZ, KZ2 e KZ2-Masters. Ayrton Senna foi vice-campeão do mundo de karting em 1979 e em 1980.", "wikiFiaKarting"),
      seguir: "No site fiakarting.com, com as provas em directo.",
    },
    {
      nome: "Rotax Max Challenge Grand Finals",
      texto: t("A final mundial da Rotax junta todos os anos as classes Micro, Mini, Júnior, Sénior, DD2 e DD2 Masters, além das eléctricas.", "rotaxGF"),
    },
    {
      nome: "Do kart aos carros",
      texto: t("Do karting passa-se à Fórmula 4, o primeiro degrau dos monolugares antes da Fórmula 3; há F4 no Brasil, desde 2022, e em Espanha.", "wikiF4"),
    },
    {
      nome: "Ralis em África",
      texto: t("O Campeonato Africano de Ralis da FIA existe desde 1981, com provas no Quénia, no Uganda, na Tanzânia, no Ruanda, na Zâmbia e no Burundi. O Safari Rally, no Quénia, voltou ao Mundial (WRC) em 2021.", "wikiArc", "wikiSafari"),
    },
  ],
  lusofonia: [
    t("António Félix da Costa começou no karting aos 9 anos, foi campeão português em 2002 e chegou a campeão de Fórmula E em 2019–20.", "wikiFelixDaCosta"),
    t("O Brasil tem oito títulos de Fórmula 1: Emerson Fittipaldi (1972 e 1974), Nelson Piquet (1981, 1983 e 1987) e Ayrton Senna (1988, 1990 e 1991). Gabriel Bortoleto, campeão de F3 em 2023 e de F2 em 2024, chegou à F1 em 2025.", "wikiCampeoesF1", "wikiBortoleto"),
  ],
  comecar: {
    passos: [
      {
        titulo: "Experimentar num kart de aluguer",
        texto: t("É a forma barata de saber se gosta e de aprender as trajectórias antes de investir."),
      },
      {
        titulo: "Entrar numa escola",
        texto: t("Em Benguela, a escola EK3R organiza o Nacional de karting e já formou pilotos que nele correm.", "fiaKarting"),
      },
      {
        titulo: "Tirar a licença",
        texto: t("A licença de karting e de automobilismo é da FADM. Fale com a federação e com a escola sobre a classe certa para a idade.", "fiaMembros", "fadmDireccao"),
      },
      {
        titulo: "Subir de degrau",
        texto: t("Do karting para os carros: em Angola, velocidade e ralis no calendário da FADM; lá fora, a Fórmula 4.", "fadmCalendarios", "wikiF4"),
      },
    ],
    seguranca: [
      "Cabelo comprido preso e nada solto ao pescoço: pode enrolar-se no eixo.",
      "Capacete e fato homologados, mesmo no aluguer.",
      "Respeite as bandeiras e nunca pare na trajectória depois de um pião.",
      "Crianças só em karts da classe e da medida certas.",
    ],
  },
};

/* ---------------- Montagem ---------------- */

/**
 * Troca as chaves das fontes por números (1, 2, 3…) pela ordem em que
 * aparecem na página, e junta a lista `fontes` correspondente.
 */
function montar(c: ConteudoModalidade<ChaveFonte>): ConteudoPagina {
  const ordem: ChaveFonte[] = [];
  const n = (k: ChaveFonte) => {
    let i = ordem.indexOf(k);
    if (i < 0) i = ordem.push(k) - 1;
    return i + 1;
  };
  const tx = (x: Texto<ChaveFonte>): Texto => ({ texto: x.texto, fontes: x.fontes.map(n) });
  const bl = (b: Bloco<ChaveFonte>): Bloco => ({ titulo: b.titulo, paragrafos: b.paragrafos.map(tx) });

  // A ordem das chamadas é a ordem da página: formato, classes, Angola, lá fora, começar.
  const formato = c.formato.map(bl);
  const classes = c.classes.map((tb) => ({ ...tb, nota: tb.nota ? tx(tb.nota) : undefined }));
  const maquinas = c.maquinas.map(tx);
  const equipamento = c.equipamento.map(tx);
  const angola = {
    intro: c.angola.intro.map(tx),
    marcos: c.angola.marcos.map((m) => ({ ...m, fontes: m.fontes.map(n) })),
    blocos: c.angola.blocos.map(bl),
  };
  const internacional = c.internacional.map((i) => ({ ...i, texto: tx(i.texto) }));
  const lusofonia = c.lusofonia.map(tx);
  const comecar = {
    passos: c.comecar.passos.map((p) => ({ titulo: p.titulo, texto: tx(p.texto) })),
    seguranca: c.comecar.seguranca,
  };

  return {
    numeros: c.numeros,
    abertura: c.abertura,
    factos: c.factos,
    formato, classes, maquinas, equipamento, angola, internacional, lusofonia, comecar,
    fontes: ordem.map((k) => F[k]),
  };
}

/** Guia de cada modalidade, por slug (o de lib/desporto.ts). */
export const CONTEUDO_MODALIDADE: Record<string, ConteudoPagina> = {
  motocross: montar(motocross),
  enduro: montar(enduro),
  rally: montar(rally),
  velocidade: montar(velocidade),
  "moto-4": montar(moto4),
  "motos-de-agua": montar(motosDeAgua),
  automobilismo: montar(automobilismo),
};

export function lerConteudo(slug: string): ConteudoPagina | undefined {
  return CONTEUDO_MODALIDADE[slug];
}

/** Mês da última verificação, mostrado no fim de cada página. */
export const VERIFICADO_EM = "Outubro de 2026";
