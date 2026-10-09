/* ============================================================
   MOTOBOX — Segurança: texto da página, em português e inglês

   Cada número e cada regra vêm de uma fonte pública, listada em
   FONTES no fim (e referida aqui ao lado de cada afirmação). As
   histórias são ilustrativas e estão marcadas como tal na página.
   Se uma lei ou um número mudar, é aqui que se actualiza.
   ============================================================ */

export type Bi = { pt: string; en: string };

const b = (pt: string, en: string): Bi => ({ pt, en });

/** Números das fontes citadas (1 = a primeira da lista FONTES, no fim). */
export type Fontes = number[];

/** Partes do desenho do capacete (cada uma tem o seu ponto no desenho). */
export type ParteCapacete = "calota" | "espuma" | "forro" | "viseira" | "correia" | "etiqueta";

/** Zonas do desenho do motard (secção Equipamento). */
export type ZonaCorpo = "casaco" | "luvas" | "calcas" | "botas";

/* ---------------- Fotografias da página ---------------- */

/** Chave de fotografia do site (lib/imagens.ts) ou endereço de uma imagem carregada. */
export const FOTOS = {
  abertura: "banner-seguranca",
  capacete: "artigo-capacete",
  visibilidade: "noite",
};

/* ---------------- Navegação da página ---------------- */

export const SECCOES: { id: string; nome: Bi }[] = [
  { id: "capacete", nome: b("Capacete", "Helmet") },
  { id: "chuva", nome: b("À chuva", "In the rain") },
  { id: "visibilidade", nome: b("Ver e ser visto", "See and be seen") },
  { id: "equipamento", nome: b("Equipamento", "Gear") },
  { id: "passageiros", nome: b("Passageiros", "Passengers") },
  { id: "cabeca", nome: b("Cabeça fria", "Clear head") },
  { id: "verificacao", nome: b("Antes de sair", "Before you ride") },
  { id: "grupo", nome: b("Em grupo", "Group rides") },
  { id: "acidente", nome: b("Em caso de acidente", "If there's a crash") },
  { id: "seguro", nome: b("Seguro", "Insurance") },
  { id: "historias", nome: b("Histórias", "Stories") },
];

export const UI = {
  eyebrow: b("Segurança", "Safety"),
  titulo1: b("Andar de mota é liberdade.", "Riding is freedom."),
  titulo2: b("Chegar a casa também.", "So is getting home."),
  sub: b(
    "Um guia prático para quem anda de mota em Angola: o capacete, a chuva, a noite, o equipamento, os passageiros e o que fazer se alguma coisa correr mal. Com fontes, sem sermões.",
    "A practical guide for anyone who rides in Angola: helmets, rain, night riding, gear, passengers and what to do if something goes wrong. Sourced, no lectures.",
  ),
  comecar: b("Começar pelo capacete", "Start with the helmet"),
  lerHistorias: b("Ler as histórias", "Read the stories"),
  nestaPagina: b("Nesta página", "On this page"),
  fonte: b("Fonte", "Source"),
  licao: b("A lição", "The lesson"),
  fontesTitulo: b("Fontes", "Sources"),
  fontesSub: b(
    "Os números e as regras desta página vêm destes documentos públicos. As citações da lei angolana estão no original; as traduções para inglês são nossas.",
    "The figures and rules on this page come from these public documents. Quotes from Angolan law are in the original Portuguese; the English translations are ours.",
  ),
  aviso: b(
    "Esta página informa, não substitui uma escola de condução, um curso de primeiros socorros nem o conselho de um profissional. As leis mudam: em caso de dúvida, confirme junto das autoridades.",
    "This page is for information. It doesn't replace a riding school, a first aid course or professional advice. Laws change: if in doubt, check with the authorities.",
  ),
  abreNovaJanela: b("abre numa nova janela", "opens in a new window"),
  capitulos: b("Capítulos", "Chapters"),
  capituloDe: b("Capítulo {n} de {total}", "Chapter {n} of {total}"),
  verFonte: b("Fonte {n}", "Source {n}"),
};

/* ---------------- Números de abertura ---------------- */

export const NUMEROS: { valor: string; prefixo?: Bi; texto: Bi; fonte: Bi }[] = [
  {
    // OMS, nota descritiva "Road traffic injuries" (Julho de 2026).
    valor: "6×",
    texto: b(
      "menos risco de morte num acidente, com o capacete bem usado",
      "lower risk of death in a crash with a correctly worn helmet",
    ),
    fonte: b("OMS", "WHO"),
  },
  {
    valor: "74%",
    prefixo: b("até", "up to"),
    texto: b("menos risco de lesão cerebral, com o capacete bem usado", "lower risk of brain injury with a correctly worn helmet"),
    fonte: b("OMS", "WHO"),
  },
  {
    // Direcção de Trânsito e Segurança Rodoviária da Polícia Nacional, via Plataforma Media (20/03/2026).
    valor: "1 200",
    texto: b(
      "mortos nas estradas de Angola entre Setembro de 2025 e Março de 2026",
      "people killed on Angola's roads between September 2025 and March 2026",
    ),
    fonte: b("Polícia Nacional", "National Police"),
  },
];

/* ---------------- 01 · Capacete ---------------- */

export const CAPACETE = {
  titulo: b("O capacete não é opcional", "The helmet isn't optional"),
  lead: b(
    "Numa queda, é a cabeça que mais vezes decide se se volta para casa. A OMS calcula que o capacete, bem usado, reduz o risco de morte mais de seis vezes e o de lesão cerebral até 74%. E em Angola é lei.",
    "In a crash, it's usually your head that decides whether you make it home. The WHO estimates that a correctly worn helmet cuts the risk of death more than six times and the risk of brain injury by up to 74%. In Angola, it's also the law.",
  ),
  // Código de Estrada (Decreto-Lei n.º 5/08), artigo 81.º, n.º 2 — citação textual.
  lei: b(
    "«Os condutores e passageiros de ciclomotores, motociclos, com ou sem carro lateral, triciclos e quadriciclos devem proteger a cabeça usando capacete de modelo oficialmente aprovado, devidamente ajustado e apertado.»",
    "\"Riders and passengers of mopeds, motorcycles, with or without a sidecar, tricycles and quadricycles must protect their head with a helmet of an officially approved model, properly adjusted and fastened.\"",
  ),
  leiFonte: b("Código de Estrada de Angola, artigo 81.º", "Angolan Road Code, article 81 (our translation)"),
  grupos: [
    {
      titulo: b("Escolher", "Choosing"),
      itens: [
        // SHARP (DfT, Reino Unido) e Demon Tweeks: etiqueta, 18 pontos, impacto oblíquo, 2024.
        b(
          "Procure a etiqueta de homologação. A europeia, ECE 22.06, vem cosida na correia ou no forro: um «E» dentro de um círculo e o código 06 da norma. Nos Estados Unidos, a marca é DOT (norma FMVSS 218). Sem etiqueta, não é um capacete: é um chapéu.",
          "Look for the approval label. The European one, ECE 22.06, is sewn onto the strap or the lining: an \"E\" inside a circle and the standard's code, 06. In the United States the mark is DOT (standard FMVSS 218). No label, no helmet: it's just a hat.",
        ),
        b(
          "A ECE 22.06, exigida nos capacetes novos à venda na Europa desde 2024, testa impactos em 18 pontos e a várias velocidades, incluindo as pancadas de lado que fazem o cérebro rodar.",
          "ECE 22.06, required on new helmets sold in Europe since 2024, tests impacts at 18 points and several speeds, including the glancing blows that make the brain rotate.",
        ),
        // Snell Memorial Foundation, FAQ: ajuste e teste de puxar/empurrar.
        b(
          "Tem de ficar justo, sem doer. Com a correia apertada, puxe-o por trás para a frente e empurre-o pela testa para trás: se sair, é grande de mais. Use-o 5 a 10 minutos na loja antes de decidir.",
          "It should fit snugly without hurting. With the strap fastened, pull it forward from the back and push it back from the brow: if it comes off, it's too big. Wear it for 5 to 10 minutes in the shop before you decide.",
        ),
        b(
          "O integral protege também o queixo e a cara. Na estrada e no todo-o-terreno, é a escolha mais segura.",
          "A full-face helmet also protects your chin and face. On the road and off it, it's the safest choice.",
        ),
      ],
    },
    {
      titulo: b("Usar", "Wearing"),
      itens: [
        b(
          "Correia sempre apertada, mesmo para ir «só ali». Um capacete desapertado pode sair da cabeça antes de ela bater no chão.",
          "Always fasten the strap, even for a quick trip down the road. An unfastened helmet can come off before your head hits the ground.",
        ),
        b(
          "Entre a correia e o queixo devem caber um ou dois dedos, não mais.",
          "You should fit one or two fingers between the strap and your chin, no more.",
        ),
        b(
          "Viseira limpa e sem riscos. À noite, só viseira transparente.",
          "Keep the visor clean and scratch-free. At night, use a clear visor only.",
        ),
        b(
          "Não compre capacetes usados: não sabe se já levaram uma pancada.",
          "Don't buy second-hand helmets: you can't know whether they've taken a hit.",
        ),
      ],
    },
    {
      titulo: b("Trocar", "Replacing"),
      itens: [
        // Snell: "Even good helmets cannot provide adequate protection the second time."
        b(
          "Depois de qualquer queda com a cabeça lá dentro. A espuma interior protege esmagando-se, e isso não se vê por fora. Um capacete que já protegeu uma vez não protege da mesma forma a segunda.",
          "After any crash with your head inside it. The inner foam protects by crushing, and you can't see that from outside. A helmet that has protected you once won't protect you the same way a second time.",
        ),
        // Snell e SHARP: substituir ao fim de 5 anos.
        b(
          "A cada cinco anos, mesmo sem quedas. O suor, o sol e o uso diário gastam o forro e a espuma.",
          "Every five years, even without a crash. Sweat, sun and daily use wear out the lining and the foam.",
        ),
        b(
          "Logo que fique largo, a fivela falhe ou a calota tenha fissuras.",
          "As soon as it feels loose, the buckle fails or the shell is cracked.",
        ),
      ],
    },
  ],
  fotoLegenda: b(
    "Um capacete integral bem ajustado: justo nas bochechas, sem folga na testa.",
    "A well-fitted full-face helmet: snug on the cheeks, no gap at the brow.",
  ),
  /* Desenho do capacete com pontos para tocar. */
  anatomiaTitulo: b("Por dentro de um capacete", "Inside a helmet"),
  anatomiaTexto: b(
    "Toque nos pontos para ver o que faz cada parte. Cada uma tem um trabalho, e nenhuma protege sozinha.",
    "Tap the points to see what each part does. Each one has a job, and none of them protects on its own.",
  ),
  anatomiaDescricao: b(
    "Desenho de um capacete integral visto de lado, com um corte na parte de trás que mostra as camadas: a calota por fora, a espuma de absorção e o forro de conforto por dentro. À frente, a viseira; em baixo, a correia com a fivela e a etiqueta de homologação.",
    "Drawing of a full-face helmet seen from the side, with a cutaway at the back showing the layers: the shell outside, the impact-absorbing foam and the comfort lining inside. The visor is at the front; underneath, the chin strap with its buckle and the approval label.",
  ),
  anatomiaAnterior: b("Parte anterior", "Previous part"),
  anatomiaSeguinte: b("Parte seguinte", "Next part"),
  anatomia: [
    {
      id: "calota",
      nome: b("Calota", "Shell"),
      // Snell, FAQ: "The hard shell (...) spread the impact to a larger area of the foam".
      texto: b(
        "A casca exterior, rija. Numa pancada, espalha a força por uma área maior da espuma que está por baixo e protege de objectos que a tentem furar. Se tiver fissuras, troque de capacete.",
        "The hard outer casing. In an impact it spreads the force over a larger area of the foam underneath and protects against objects that could pierce it. If it's cracked, replace the helmet.",
      ),
      fontes: [6],
    },
    {
      id: "espuma",
      nome: b("Espuma de absorção (EPS)", "Impact liner (EPS)"),
      // Snell, FAQ: EPS; "the liner exerts a controlled braking force that slows the head much more gently".
      texto: b(
        "Poliestireno expandido: é esta camada que protege o cérebro. Ao esmagar-se, trava a cabeça com muito mais suavidade. Depois de esmagada não volta ao lugar, e isso não se vê por fora. Por isso, depois de uma queda com a cabeça lá dentro, o capacete troca-se.",
        "Expanded polystyrene: this is the layer that protects your brain. By crushing, it slows your head down far more gently. Once crushed it doesn't spring back, and you can't see that from outside. That's why a helmet is replaced after any crash with your head inside it.",
      ),
      fontes: [6],
    },
    {
      id: "forro",
      nome: b("Forro de conforto", "Comfort lining"),
      // Snell, FAQ: ajuste justo; substituir ao fim de cinco anos.
      texto: b(
        "O enchimento macio que encosta à cabeça e dá o ajuste: justo nas bochechas, sem folga na testa. O suor, o sol e o uso diário gastam o forro e a espuma: troque o capacete a cada cinco anos, mesmo sem quedas.",
        "The soft padding that sits against your head and gives the fit: snug on the cheeks, no gap at the brow. Sweat, sun and daily use wear out the lining and the foam: replace the helmet every five years, even without a crash.",
      ),
      fontes: [6],
    },
    {
      id: "viseira",
      nome: b("Viseira", "Visor"),
      texto: b(
        "Limpa e sem riscos. À noite, só viseira transparente. Com chuva, uma película anti-embaciamento ajuda a manter a visão.",
        "Clean and scratch-free. At night, a clear visor only. In the rain, an anti-fog insert helps you keep your vision.",
      ),
      fontes: [],
    },
    {
      id: "correia",
      nome: b("Correia e fivela", "Chin strap and buckle"),
      // Snell, FAQ: "not be too loose to allow more than two fingers".
      texto: b(
        "Sempre apertada, mesmo para ir «só ali»: um capacete desapertado pode sair antes de a cabeça bater no chão. Entre a correia e o queixo cabem um ou dois dedos, não mais.",
        "Always fastened, even for a quick trip: an unfastened helmet can come off before your head hits the ground. One or two fingers between the strap and your chin, no more.",
      ),
      fontes: [6],
    },
    {
      id: "etiqueta",
      nome: b("Etiqueta de homologação", "Approval label"),
      // SHARP e Demon Tweeks: etiqueta ECE 22.06.
      texto: b(
        "Cosida na correia ou no forro: um «E» dentro de um círculo e o código 06 da norma ECE 22.06. Nos Estados Unidos, a marca é DOT. Sem etiqueta, não é um capacete: é um chapéu.",
        "Sewn onto the strap or the lining: an \"E\" inside a circle and the standard's code, 06, for ECE 22.06. In the United States the mark is DOT. No label, no helmet: it's just a hat.",
      ),
      fontes: [4, 5],
    },
  ] as { id: ParteCapacete; nome: Bi; texto: Bi; fontes: Fontes }[],
};

/* ---------------- 02 · Chuva ---------------- */

export const CHUVA = {
  titulo: b("À chuva, tudo com calma", "In the rain, do everything gently"),
  lead: b(
    "Com o piso molhado, a distância de travagem é pelo menos o dobro. As primeiras chuvas depois do cacimbo são as mais traiçoeiras: a água levanta o óleo e o pó acumulados no asfalto durante meses.",
    "On a wet road, stopping distances at least double. The first rains after the dry season are the most treacherous: the water lifts the oil and dust that have built up on the tarmac for months.",
  ),
  numero: "2×",
  numeroTexto: b(
    "a distância de travagem com piso molhado, no mínimo",
    "your stopping distance on a wet road, at least",
  ),
  // Highway Code (Reino Unido), regra 227.
  numeroFonte: b("Highway Code britânico, regra 227", "UK Highway Code, rule 227"),
  /* Comparação seco / molhado. Os metros são os da tabela "Typical stopping
     distances" do Highway Code (regra 126): reacção + travagem. Molhado = o
     dobro do total, o mínimo da regra 227. */
  travagem: {
    titulo: b("Quanto precisa para parar", "How far you need to stop"),
    texto: b(
      "Escolha uma velocidade e compare o piso seco com o molhado.",
      "Pick a speed and compare a dry road with a wet one.",
    ),
    velocidade: b("Velocidade", "Speed"),
    seco: b("Piso seco", "Dry road"),
    molhado: b("Piso molhado", "Wet road"),
    reaccao: b("a reagir", "thinking"),
    travar: b("a travar", "braking"),
    noMinimo: b("pelo menos", "at least"),
    velocidades: [
      { rotulo: "48 km/h", reaccao: 9, travagem: 14 },
      { rotulo: "80 km/h", reaccao: 15, travagem: 38 },
      { rotulo: "96 km/h", reaccao: 18, travagem: 55 },
    ] as { rotulo: string; reaccao: number; travagem: number }[],
    nota: b(
      "Distâncias típicas de paragem do Highway Code britânico (regra 126). São um guia geral, que depende da atenção, do piso, do tempo e do estado do veículo, e as motas precisam de mais distância para parar. Com piso molhado, pelo menos o dobro (regra 227).",
      "Typical stopping distances from the UK Highway Code (rule 126). They're a general guide that depends on your attention, the road surface, the weather and the condition of the vehicle, and motorcycles need a greater distance to stop. On a wet road, at least double (rule 227).",
    ),
    fontes: [21, 9] as Fontes,
  },
  dicas: [
    {
      titulo: b("Dobre a distância", "Double the gap"),
      texto: b(
        "Deixe o dobro do espaço para o carro da frente e trave mais cedo, com mais suavidade, usando os dois travões.",
        "Leave twice the space to the car in front and brake earlier and more gently, using both brakes.",
      ),
    },
    {
      titulo: b("Fuja das zonas lisas", "Avoid the slippery bits"),
      texto: b(
        "Tinta das passadeiras e das faixas, tampas de esgoto, chapas metálicas e manchas de óleo. Se tiver de passar por cima, passe direito, sem travar nem inclinar.",
        "Painted crossings and lane markings, manhole covers, metal plates and oil patches. If you have to cross them, go straight over, without braking or leaning.",
      ),
    },
    {
      titulo: b("Uma poça pode ser um buraco", "A puddle may hide a pothole"),
      texto: b(
        "Numa estrada que não conhece, trate cada poça como um buraco até prova em contrário.",
        "On a road you don't know, treat every puddle as a pothole until proven otherwise.",
      ),
    },
    {
      titulo: b("Gestos suaves", "Smooth inputs"),
      texto: b(
        "Acelerador, travões e inclinação, tudo sem pressas. São as mudanças bruscas que fazem os pneus perder aderência.",
        "Throttle, brakes and lean, all without rushing. Sudden changes are what make the tyres lose grip.",
      ),
    },
    {
      titulo: b("Seja visto", "Be seen"),
      texto: b(
        "Luzes ligadas e roupa clara ou reflectora. Com chuva e spray, os outros condutores vêem-no ainda menos.",
        "Lights on and bright or reflective clothing. In rain and spray, other drivers see you even less.",
      ),
    },
    {
      titulo: b("Se não vê, pare", "If you can't see, stop"),
      texto: b(
        "Se a chuva for tanta que deixa de ver a estrada, pare num sítio seguro, fora da faixa, e espere que passe. Nenhuma pressa vale o risco.",
        "If the rain is so heavy you can't see the road, stop somewhere safe, off the carriageway, and wait for it to pass. No hurry is worth the risk.",
      ),
    },
    {
      titulo: b("Seco e com visão", "Stay dry, keep your vision"),
      texto: b(
        "Leve fato de chuva e use uma película anti-embaciamento na viseira. Molhado e com frio, o corpo reage mais devagar.",
        "Carry rain gear and use an anti-fog insert on your visor. Wet and cold, your body reacts more slowly.",
      ),
    },
  ],
};

/* ---------------- 03 · Ver e ser visto ---------------- */

export const VISIBILIDADE = {
  titulo: b("Se não o vêem, não o evitam", "If they can't see you, they can't avoid you"),
  // Highway Code (Reino Unido), regras 86 e 87.
  lead: b(
    "Muitos acidentes com motas começam com um «não o vi». O Highway Code britânico recomenda capacete e roupa de cores vivas de dia, e materiais reflectores à noite.",
    "Many motorcycle crashes start with \"I didn't see him\". The UK Highway Code recommends a bright helmet and clothing by day, and reflective materials at night.",
  ),
  dicas: [
    b(
      "Ande com os médios ligados, também de dia. Uma luz acesa destaca-o no trânsito.",
      "Ride with your dipped headlight on, day and night. A lit headlight makes you stand out in traffic.",
    ),
    b(
      "Fuja dos ângulos mortos de camiões, autocarros e candongueiros: se não vê os olhos do condutor no espelho, ele também não o vê a si.",
      "Stay out of the blind spots of lorries, buses and minibus taxis: if you can't see the driver's eyes in their mirror, they can't see you.",
    ),
    b(
      "Nos cruzamentos, conte com o carro que vai virar à sua frente sem o ver. Abrande, afaste-se e tenha sempre uma saída.",
      "At junctions, expect the car that turns across your path without seeing you. Slow down, give yourself room and always keep an escape route.",
    ),
    b(
      "À noite, ande a uma velocidade que lhe permita parar dentro do alcance do farol. Atenção a peões, animais e veículos sem luzes.",
      "At night, ride at a speed that lets you stop within the reach of your headlight. Watch for pedestrians, animals and vehicles without lights.",
    ),
    b(
      "Um colete ou faixas reflectoras quase não pesam e fazem-no aparecer ao longe, à luz dos faróis dos outros.",
      "A reflective vest or strips weigh next to nothing and make you visible from far away in other drivers' headlights.",
    ),
  ],
  /* Cena ilustrativa: o que vê o condutor de trás, de dia e de noite. */
  cena: {
    titulo: b("O que vê quem vem atrás", "What the driver behind you sees"),
    dia: b("Dia", "Day"),
    noite: b("Noite", "Night"),
    escuro: b("Roupa escura", "Dark clothes"),
    visivel: b("Cores vivas e reflector", "Bright and reflective"),
    diaEscuro: b(
      "De dia, roupa escura perde-se no asfalto, nas sombras e no meio do trânsito.",
      "By day, dark clothing disappears against the tarmac, the shadows and the traffic.",
    ),
    diaVisivel: b(
      "Capacete e roupa de cores vivas ou fluorescentes destacam-no à luz do dia.",
      "A bright helmet and bright or fluorescent clothing make you stand out in daylight.",
    ),
    noiteEscuro: b(
      "À noite, de roupa escura, quem vem atrás vê pouco mais do que uma luz pequena.",
      "At night, in dark clothing, the driver behind sees little more than one small light.",
    ),
    noiteVisivel: b(
      "O material reflector devolve a luz dos faróis: aparece ao longe, com a forma de uma pessoa.",
      "Reflective material bounces the headlights back: you show up from far away, in the shape of a person.",
    ),
    nota: b(
      "Desenho ilustrativo. Recomendações do Highway Code britânico, regras 86 e 87.",
      "Illustrative drawing. Recommendations from the UK Highway Code, rules 86 and 87.",
    ),
    descricao: b(
      "Desenho de uma estrada vista de dentro de um carro, com um motociclista à frente, visto de trás.",
      "Drawing of a road seen from inside a car, with a motorcyclist ahead, seen from behind.",
    ),
    fontes: [7] as Fontes,
  },
};

/* ---------------- 04 · Equipamento ---------------- */

export const EQUIPAMENTO = {
  titulo: b("Vista-se para a queda, não para o passeio", "Dress for the slide, not the ride"),
  // de Rome et al. (2011), Accident Analysis & Prevention: RR de internamento
  // luvas 0,41 · calças 0,49 · casaco 0,79; botas (não de mota) vs sapatos RR 0,46.
  lead: b(
    "Um estudo australiano com 212 motociclistas acidentados concluiu que quem caiu com equipamento de mota foi internado com muito menos frequência. E até botas comuns protegeram mais os pés do que ténis ou sapatos.",
    "An Australian study of 212 riders who had crashed found that those wearing motorcycle gear were admitted to hospital far less often. Even ordinary boots protected feet better than trainers or shoes.",
  ),
  estudo: b("de Rome et al., 2011", "de Rome et al., 2011"),
  fontes: [11] as Fontes,
  numeros: [
    { valor: "−59%", texto: b("de risco de internamento com luvas de mota", "risk of hospital admission with motorcycle gloves") },
    { valor: "−51%", texto: b("com calças de mota", "with motorcycle trousers") },
    { valor: "−21%", texto: b("com casaco de mota", "with a motorcycle jacket") },
  ],
  numerosTitulo: b(
    "Quanto baixa o risco de ser internado",
    "How much lower the risk of hospital admission is",
  ),
  figuraTitulo: b("Vista o motard", "Gear up the rider"),
  figuraTexto: b("Escolha uma peça para ver o que protege.", "Pick a piece to see what it protects."),
  figuraDescricao: b(
    "Desenho de um motard de frente, com casaco, luvas, calças e botas. A peça escolhida fica a vermelho.",
    "Drawing of a rider from the front, wearing a jacket, gloves, trousers and boots. The chosen piece is shown in red.",
  ),
  normaRotulo: b("Norma a procurar", "Standard to look for"),
  pecas: [
    {
      nome: b("Casaco", "Jacket"),
      zona: "casaco",
      norma: "EN 17092",
      texto: b(
        "Com protecções nos ombros e nos cotovelos. Para o calor de Angola, há casacos de rede com protecções: arejados e seguros.",
        "With shoulder and elbow armour. For Angola's heat, there are mesh jackets with armour: airy and safe.",
      ),
    },
    {
      nome: b("Luvas", "Gloves"),
      zona: "luvas",
      norma: "EN 13594",
      texto: b(
        "As mãos são a primeira coisa a tocar no chão. Luvas de mota, com reforço na palma.",
        "Your hands are the first thing to hit the ground. Motorcycle gloves with reinforced palms.",
      ),
    },
    {
      nome: b("Calças", "Trousers"),
      zona: "calcas",
      norma: "EN 17092",
      texto: b(
        "De mota, com protecções nos joelhos. A ganga comum rasga-se depressa no asfalto.",
        "Motorcycle trousers with knee armour. Ordinary denim wears through quickly on tarmac.",
      ),
    },
    {
      nome: b("Botas", "Boots"),
      zona: "botas",
      norma: "EN 13634",
      texto: b(
        "Acima do tornozelo e com sola firme. Chinelos e ténis quase não protegem.",
        "Above the ankle with a firm sole. Flip-flops and trainers offer almost no protection.",
      ),
    },
  ] as { nome: Bi; texto: Bi; zona?: ZonaCorpo; norma?: string }[],
  etiquetas: b(
    "Ao comprar, procure a marcação CE e a norma: EN 17092 na roupa, EN 13594 nas luvas, EN 13634 nas botas e EN 1621 nas protecções.",
    "When buying, look for the CE mark and the standard: EN 17092 for clothing, EN 13594 for gloves, EN 13634 for boots and EN 1621 for armour.",
  ),
};

/* ---------------- 05 · Passageiros ---------------- */

export const PASSAGEIROS = {
  titulo: b("Quem vai atrás também conta", "Whoever rides pillion counts too"),
  lead: b(
    "A lei vale para os dois: o passageiro também tem de usar capacete homologado, ajustado e apertado. E há uma idade mínima para ir de mota.",
    "The law applies to both of you: the passenger must also wear an approved helmet, adjusted and fastened. And there's a minimum age for riding pillion.",
  ),
  // Código de Estrada (Decreto-Lei n.º 5/08), artigo 90.º — citação textual.
  lei: b(
    "«Nos motociclos e ciclomotores é proibido o transporte de passageiros de idade inferior a sete anos, salvo tratando-se de veículos providos de caixa rígida não destinada apenas ao transporte de carga.»",
    "\"Carrying passengers under the age of seven on motorcycles and mopeds is prohibited, except on vehicles fitted with a rigid body not intended solely for carrying goods.\"",
  ),
  leiFonte: b("Código de Estrada de Angola, artigo 90.º", "Angolan Road Code, article 90 (our translation)"),
  destaque: {
    valor: "7",
    unidade: b("anos", "years"),
    texto: b(
      "a idade mínima para ir atrás numa mota ou num ciclomotor. Abaixo disso, a lei proíbe, salvo em veículos com caixa rígida.",
      "the minimum age to ride pillion on a motorcycle or moped. Below it, the law forbids it, except on vehicles with a rigid body.",
    ),
  },
  dicas: [
    b(
      "O capacete tem de servir a quem o usa. Um capacete de adulto numa cabeça pequena abana, roda e não protege.",
      "The helmet has to fit whoever wears it. An adult helmet on a small head wobbles, twists and doesn't protect.",
    ),
    b(
      "Combine as regras antes de arrancar: pés sempre nos poisa-pés, mãos na sua cintura ou nas pegas, inclinar com a mota nas curvas e nada de movimentos bruscos.",
      "Agree the rules before you set off: feet always on the footpegs, hands on your waist or the grab rails, lean with the bike in corners and no sudden movements.",
    ),
    b(
      "Com passageiro, a mota trava mais tarde e curva de outra forma. Mais distância, menos velocidade.",
      "With a passenger, the bike takes longer to stop and handles differently. More distance, less speed.",
    ),
    b(
      "Um passageiro de cada vez, e só se a mota tiver banco e poisa-pés para ele.",
      "One passenger at a time, and only if the bike has a seat and footpegs for them.",
    ),
    b(
      "Vai de mototáxi? Exija capacete. A lei obriga o passageiro a usá-lo, e a cabeça é sua.",
      "Taking a motorbike taxi? Ask for a helmet. The law requires passengers to wear one, and it's your head.",
    ),
  ],
};

/* ---------------- 06 · Cabeça fria ---------------- */

export const CABECA = {
  titulo: b("Cabeça fria, corpo em forma", "Clear head, fit body"),
  lead: b(
    "Numa mota, o condutor é o sistema de segurança. Álcool, pressa, sono e calor tiram-lhe precisamente o que mais precisa: tempo para reagir.",
    "On a motorcycle, you are the safety system. Alcohol, speed, tiredness and heat take away exactly what you need most: time to react.",
  ),
  temas: [
    {
      icone: "eyeOff",
      titulo: b("Álcool", "Alcohol"),
      destaque: "0,0 g/l",
      // Código de Estrada, artigo 80.º (TAS superior a 0,6 g/l); OMS: risco sobe muito a partir de 0,04 g/dl.
      texto: b(
        "O Código de Estrada considera sob influência quem tem mais de 0,6 g/l de álcool no sangue (artigo 80.º). Mas a OMS avisa que o risco de acidente começa bem antes e sobe muito a partir de 0,4 g/l. Em cima de uma mota, a única taxa segura é zero.",
        "Angola's Road Code treats anyone above 0.6 g/l of blood alcohol as under the influence (article 80). But the WHO warns that crash risk starts well below that and rises sharply from 0.4 g/l. On a motorcycle, the only safe level is zero.",
      ),
    },
    {
      icone: "trending",
      titulo: b("Velocidade", "Speed"),
      destaque: "+1% → +4%",
      // OMS: cada 1% a mais na velocidade média, +4% de risco de acidente mortal.
      texto: b(
        "Segundo a OMS, cada 1% a mais na velocidade média aumenta 4% o risco de acidente mortal. Numa mota, não há carroçaria para absorver a diferença.",
        "According to the WHO, every 1% increase in average speed raises the risk of a fatal crash by 4%. On a motorcycle, there's no bodywork to absorb the difference.",
      ),
    },
    {
      icone: "clock",
      titulo: b("Cansaço", "Tiredness"),
      destaque: "15 min / 2 h",
      // Highway Code (Reino Unido), regra 91.
      texto: b(
        "Pare pelo menos 15 minutos a cada duas horas de condução. Bocejos, olhos pesados ou não se lembrar dos últimos quilómetros são sinais para parar já. Medicamentos que dão sono também contam.",
        "Stop for at least 15 minutes every two hours. Yawning, heavy eyes or not remembering the last few kilometres are signs to stop right away. Medicines that make you drowsy count too.",
      ),
    },
    {
      icone: "fire",
      titulo: b("Calor", "Heat"),
      destaque: b("Água antes da sede", "Drink before you're thirsty"),
      // NHS: sinais de exaustão pelo calor e o que fazer; sinais de golpe de calor.
      texto: b(
        "Com sol e equipamento, desidrata-se sem dar por isso. Beba em cada paragem. Dor de cabeça, tonturas, náuseas ou cãibras são sinais de exaustão pelo calor: pare à sombra, tire o casaco, beba e molhe a pele. Pele quente e seca, confusão ou desmaio é emergência.",
        "With sun and riding gear, you dehydrate without noticing. Drink at every stop. Headache, dizziness, nausea or cramps are signs of heat exhaustion: stop in the shade, take off your jacket, drink and cool your skin. Hot dry skin, confusion or fainting is an emergency.",
      ),
    },
  ],
};

/* ---------------- 07 · Antes de sair ---------------- */

export const VERIFICACAO = {
  titulo: b("Dois minutos antes de arrancar", "Two minutes before you set off"),
  // Motorcycle Safety Foundation, lista T-CLOCS.
  lead: b(
    "A Motorcycle Safety Foundation ensina uma verificação rápida chamada T-CLOCS, pelas iniciais em inglês. Não é preciso ser mecânico: é olhar, apalpar e ouvir.",
    "The Motorcycle Safety Foundation teaches a quick check called T-CLOCS. You don't need to be a mechanic: just look, feel and listen.",
  ),
  itens: [
    {
      letra: "T",
      nome: b("Pneus e rodas", "Tyres and wheels"),
      texto: b(
        "Pressão certa (vem no manual ou numa etiqueta na mota), piso sem desgaste excessivo, sem cortes nem pregos. Raios e jantes sem folgas.",
        "Correct pressure (it's in the manual or on a label on the bike), tread not worn down, no cuts or nails. Spokes and rims without play.",
      ),
    },
    {
      letra: "C",
      nome: b("Comandos", "Controls"),
      texto: b(
        "Manetes e pedal de travão firmes, acelerador que volta sozinho, embraiagem e cabos sem prender.",
        "Brake levers and pedal firm, throttle snaps back on its own, clutch and cables don't stick.",
      ),
    },
    {
      letra: "L",
      nome: b("Luzes", "Lights"),
      texto: b(
        "Médios e máximos, luz de travão com cada um dos travões, piscas e buzina.",
        "Dipped and main beam, brake light with each brake, indicators and horn.",
      ),
    },
    {
      letra: "O",
      nome: b("Óleo e líquidos", "Oil and fluids"),
      texto: b(
        "Nível do óleo, do líquido dos travões e do líquido de refrigeração. Nada a pingar no chão.",
        "Oil, brake fluid and coolant levels. Nothing dripping on the ground.",
      ),
    },
    {
      letra: "C",
      nome: b("Quadro e corrente", "Chassis and chain"),
      texto: b(
        "Corrente com a folga certa e lubrificada, suspensão sem fugas, parafusos apertados.",
        "Chain correctly adjusted and lubricated, suspension not leaking, bolts tight.",
      ),
    },
    {
      letra: "S",
      nome: b("Descanso", "Stands"),
      texto: b(
        "O descanso lateral recolhe e fica preso. Um descanso que desce numa curva deita a mota abaixo.",
        "The side stand folds up and stays up. A stand that drops in a corner can bring the bike down.",
      ),
    },
  ],
  /* A lista para marcar. {feitos} e {total} trocam-se pelos números. */
  progresso: b("{feitos} de {total} verificados", "{feitos} of {total} checked"),
  falta: b("Marque cada ponto à medida que verifica.", "Tick each point as you check it."),
  pronto: b("Pronto para sair", "Ready to ride"),
  prontoTexto: b("Tudo verificado. Boa viagem, e correia apertada.", "All checked. Ride safe, strap fastened."),
  recomecar: b("Limpar as marcas", "Clear the ticks"),
  memoria: b(
    "As marcas ficam guardadas só neste aparelho, até ao fim do dia.",
    "Ticks are saved on this device only, until the end of the day.",
  ),
};

/* ---------------- 08 · Em grupo ---------------- */

export const GRUPO = {
  titulo: b("Passeio em grupo, com regras", "Group rides, with rules"),
  // Motorcycle Safety Foundation, guia de passeios em grupo.
  lead: b(
    "Os passeios de clube são das melhores coisas do mundo motard. Com umas regras simples, recomendadas pela Motorcycle Safety Foundation, também são das mais seguras.",
    "Club rides are one of the best things about motorcycling. With a few simple rules, recommended by the Motorcycle Safety Foundation, they're also among the safest.",
  ),
  dicas: [
    b(
      "Reunião antes de arrancar: percurso, paragens para combustível e descanso, e os sinais de mão que o grupo vai usar.",
      "A briefing before you set off: the route, fuel and rest stops, and the hand signals the group will use.",
    ),
    b(
      "Um líder à frente e um fecho no fim, ambos experientes. Os menos experientes vão logo atrás do líder.",
      "An experienced leader at the front and an experienced sweep at the back. Less experienced riders go right behind the leader.",
    ),
    b(
      "Em recta, formação em ziguezague: o líder no terço esquerdo da faixa, o seguinte no terço direito, pelo menos um segundo atrás, e assim por diante.",
      "On straights, ride staggered: the leader in the left third of the lane, the next rider in the right third at least one second behind, and so on.",
    ),
    b(
      "Em curvas, com mau piso ou pouca visibilidade, passe a fila indiana, com pelo menos dois segundos entre motas.",
      "On bends, bad surfaces or in poor visibility, switch to single file with at least two seconds between bikes.",
    ),
    b(
      "Cada um anda ao seu ritmo. Ninguém passa dos seus limites para não ficar para trás: o grupo espera.",
      "Everyone rides at their own pace. Nobody pushes past their limits to keep up: the group waits.",
    ),
  ],
  diagramaTitulo: b("Como vai o grupo", "How the group rides"),
  diagramaSentido: b("Sentido de marcha", "Direction of travel"),
  diagramaLider: b("Líder", "Leader"),
  diagramaFecho: b("Fecho", "Sweep"),
  diagramaDescricao: b(
    "Esquema de uma faixa de rodagem vista de cima, com cinco motas em ziguezague: o líder à frente no lado esquerdo da faixa, a seguinte atrás no lado direito, e assim sucessivamente até ao fecho.",
    "Diagram of one lane seen from above with five motorcycles in a staggered line: the leader in front on the left of the lane, the next behind on the right, and so on down to the sweep.",
  ),
  clubes: b("Procurar um clube para passear", "Find a club to ride with"),
  modoRecta: b("Em recta", "On straights"),
  modoCurva: b("Em curvas", "On bends"),
  legendaRecta: b(
    "Ziguezague: o líder no terço esquerdo da faixa, o seguinte no terço direito, pelo menos um segundo atrás.",
    "Staggered: the leader in the left third of the lane, the next rider in the right third, at least one second behind.",
  ),
  legendaCurva: b(
    "Fila indiana, com pelo menos dois segundos entre motas.",
    "Single file, with at least two seconds between bikes.",
  ),
  diagramaDescricaoCurva: b(
    "Esquema da mesma faixa com as cinco motas em fila indiana, mais afastadas umas das outras: o líder à frente e o fecho no fim.",
    "Diagram of the same lane with the five motorcycles in single file, further apart: the leader in front and the sweep at the back.",
  ),
  diagramaFonte: b("Motorcycle Safety Foundation", "Motorcycle Safety Foundation"),
  fontes: [13] as Fontes,
  umSegundo: b("1 s", "1 s"),
  doisSegundos: b("2 s", "2 s"),
};

/* ---------------- 09 · Em caso de acidente ---------------- */

export const ACIDENTE = {
  titulo: b("Se vir um acidente", "If you come across a crash"),
  lead: b(
    "Os primeiros minutos contam. Não precisa de ser médico para ajudar, mas precisa de saber o que não fazer.",
    "The first few minutes count. You don't need to be a doctor to help, but you do need to know what not to do.",
  ),
  numero: "111",
  // RNA (28/11/2024): o 111 é o contacto para qualquer emergência e o 115 foi descontinuado.
  // Novo Jornal (07/05/2020): o 113 deixou de funcionar. Governo Provincial de Cabinda:
  // CISP de Cabinda, 5.ª província com o serviço (Dezembro de 2025).
  numeroTexto: b(
    "Número de emergência para polícia, bombeiros e emergência médica. Substituiu os antigos 113 e 115 e chega a cada província à medida que abre o respectivo Centro Integrado de Segurança Pública.",
    "Emergency number for police, fire and medical emergencies. It replaced the old 113 and 115 and reaches each province as its Integrated Public Security Centre opens.",
  ),
  numeroDica: b(
    "Antes de uma viagem, guarde no telemóvel o contacto do comando da Polícia da província para onde vai.",
    "Before a trip, save the number of the police command in the province you're heading to.",
  ),
  passos: [
    {
      nome: b("Proteger", "Protect"),
      // Highway Code, anexo 7.
      itens: [
        b(
          "Pare em segurança, ligue os quatro piscas e avise o trânsito que vem atrás.",
          "Stop safely, switch on your hazard lights and warn the traffic behind.",
        ),
        b(
          "Desligue os motores. Ninguém fuma perto do acidente.",
          "Switch off the engines. Nobody smokes near the crash.",
        ),
      ],
    },
    {
      nome: b("Alertar", "Alert"),
      itens: [
        b(
          "Ligue 111. Diga onde está, com pontos de referência, quantas vítimas há e se alguém está inconsciente ou preso.",
          "Call 111. Say where you are, with landmarks, how many people are hurt and whether anyone is unconscious or trapped.",
        ),
      ],
    },
    {
      nome: b("Socorrer", "Assist"),
      // NSW Government / St John; Highway Code, anexo 7.
      itens: [
        b(
          "Não tire o capacete a um motociclista ferido. Só se ele não respirar e não houver outra forma de lhe abrir as vias respiratórias, e sempre a dois: um segura a cabeça e o pescoço, o outro tira o capacete.",
          "Don't remove an injured rider's helmet. Only if they aren't breathing and there's no other way to open their airway, and always with two people: one holds the head and neck, the other removes the helmet.",
        ),
        b(
          "Não mexa na vítima, a não ser que haja um perigo maior, como fogo ou trânsito. Mantenha-a quieta e agasalhada.",
          "Don't move the casualty unless there's a greater danger, such as fire or traffic. Keep them still and warm.",
        ),
        b(
          "Veja se respira. Se sangrar muito, faça pressão directa sobre a ferida com um pano limpo, sem tirar nada que esteja espetado.",
          "Check they're breathing. If they're bleeding heavily, press directly on the wound with a clean cloth, without removing anything stuck in it.",
        ),
        b(
          "Não lhe dê de comer nem de beber.",
          "Don't give them anything to eat or drink.",
        ),
      ],
    },
  ],
  extra: b(
    "Faça um curso de primeiros socorros. Num passeio de grupo, basta uma pessoa que saiba para fazer a diferença. E guarde no telemóvel um contacto «em caso de emergência».",
    "Take a first aid course. On a group ride, one person who knows what to do can make all the difference. And save an \"in case of emergency\" contact on your phone.",
  ),
  ligar: b("Ligar", "Call"),
  passoDe: b("Passo {n} de {total}", "Step {n} of {total}"),
  anterior: b("Passo anterior", "Previous step"),
  seguinte: b("Passo seguinte", "Next step"),
  fontes: [10, 14, 16] as Fontes,
};

/* ---------------- 10 · Seguro ---------------- */

export const SEGURO = {
  titulo: b("Seguro: o mínimo é obrigatório", "Insurance: the minimum is mandatory"),
  // ARSEG, seguros obrigatórios (Lei n.º 20/03); Decreto n.º 35/09 (regulamento).
  texto: b(
    "Em Angola, o seguro de responsabilidade civil automóvel é obrigatório para quem circula com um veículo a motor, e as motas contam. Está previsto na Lei de Bases dos Transportes Terrestres (Lei n.º 20/03) e regulado pelo Decreto n.º 35/09, sob supervisão da ARSEG.",
    "In Angola, motor third-party liability insurance is mandatory for anyone driving a motor vehicle, and motorcycles count. It's set out in the Land Transport Framework Law (Law 20/03), regulated by Decree 35/09 and supervised by ARSEG, the insurance regulator.",
  ),
  itens: [
    b(
      "O seguro obrigatório cobre os danos que causar a terceiros. Para a sua mota e para si próprio, pergunte à seguradora por coberturas facultativas, como danos próprios e acidentes pessoais.",
      "Mandatory insurance covers the damage you cause to others. For your own bike and yourself, ask your insurer about optional cover, such as own damage and personal accident.",
    ),
    b(
      "Ande sempre com a carta de condução, os documentos da mota e o comprovativo do seguro.",
      "Always carry your driving licence, the bike's documents and proof of insurance.",
    ),
  ],
};

/* ---------------- 11 · Histórias ---------------- */

export const HISTORIAS = {
  titulo: b("Histórias para não esquecer", "Stories worth remembering"),
  aviso: b(
    "Histórias ilustrativas, baseadas em situações comuns. Não são casos reais e as pessoas não existem.",
    "Illustrative stories based on common situations. They are not real cases and the people are not real.",
  ),
  lista: [
    {
      titulo: b("«É só ali à bomba»", "\"Just popping to the petrol station\""),
      texto: b(
        "Sábado de manhã, em Luanda. Ele pegou na mota para ir à bomba, a três ruas de casa. O capacete foi, mas com a correia solta: era só ali. Um carro saiu de um parque sem olhar e ele travou a fundo. Na queda, o capacete saltou antes de a cabeça bater no lancil. Passou semanas no hospital e meses a reaprender coisas simples. Hoje aperta a correia até para tirar a mota da garagem.",
        "Saturday morning in Luanda. He took the bike to the petrol station, three streets from home. The helmet went too, but with the strap undone: it was only round the corner. A car pulled out of a car park without looking and he braked hard. As he fell, the helmet flew off before his head hit the kerb. He spent weeks in hospital and months relearning simple things. Now he fastens the strap even to wheel the bike out of the garage.",
      ),
      licao: b(
        "A correia apertada é metade do capacete. Os percursos curtos também contam.",
        "A fastened strap is half the helmet. Short trips count too.",
      ),
    },
    {
      titulo: b("A primeira chuva", "The first rain"),
      texto: b(
        "Depois de meses de cacimbo, caiu a primeira chuvada a sério. Ela ia para o trabalho como todos os dias e travou no sítio de sempre, em cima da tinta de uma passadeira. A roda da frente fugiu. Levantou-se com o casaco raspado, as luvas desfeitas e as mãos intactas. A mota ficou com um pisca partido. Nesse dia percebeu duas coisas: que o piso muda com a primeira chuva e que umas luvas se pagam num só dia.",
        "After months of dry season, the first real downpour came. She was riding to work as usual and braked in the usual spot, right on the paint of a zebra crossing. The front wheel slid away. She got up with a scuffed jacket, shredded gloves and unhurt hands. The bike lost an indicator. That day she learned two things: the road changes with the first rain, and gloves pay for themselves in a single day.",
      ),
      licao: b(
        "Com chuva, dobre as distâncias e trave com suavidade, longe da tinta e das tampas de esgoto.",
        "In the rain, double your distances and brake gently, away from paint and manhole covers.",
      ),
    },
    {
      titulo: b("O capacete emprestado", "The borrowed helmet"),
      texto: b(
        "Um rapaz de 15 anos ia à boleia na mota do tio, com um capacete de adulto emprestado, vários números acima. Num buraco escondido por uma poça, a mota abanou e ele bateu com a cabeça no ombro do tio. O capacete rodou e tapou-lhe os olhos. Por sorte, não caíram. Na semana seguinte, o tio comprou-lhe um capacete à medida.",
        "A 15-year-old was riding pillion on his uncle's bike, wearing a borrowed adult helmet several sizes too big. A pothole hidden by a puddle jolted the bike and his head knocked against his uncle's shoulder. The helmet twisted round and covered his eyes. Luckily, they didn't fall. The next week, his uncle bought him a helmet that fitted.",
      ),
      licao: b(
        "O capacete tem de servir a quem o usa. Largo, não protege.",
        "A helmet has to fit whoever wears it. Too big, it doesn't protect.",
      ),
    },
    {
      titulo: b("O fecho que reparou", "The sweep who noticed"),
      texto: b(
        "Passeio de clube do Namibe ao Lubango, pela Serra da Leba, com calor desde manhã cedo. A meio da subida, quem fechava o grupo reparou que um dos motards abria as curvas e perdia o ritmo. Fez sinal ao líder e o grupo parou na primeira sombra. O motard estava tonto e com dores de cabeça: não bebia água desde o pequeno-almoço. Descansou, bebeu, arrefeceu e chegou ao Lubango com os outros, uma hora mais tarde. Ninguém se lembra da hora de chegada. Todos se lembram de que chegaram.",
        "A club ride from Namibe to Lubango over the Serra da Leba, hot from early morning. Halfway up the climb, the rider at the back noticed that one of the group was running wide in the bends and losing pace. He signalled to the leader and the group stopped at the first patch of shade. The rider was dizzy with a headache: he hadn't drunk any water since breakfast. He rested, drank, cooled down and reached Lubango with the others, an hour late. Nobody remembers what time they arrived. Everybody remembers that they did.",
      ),
      licao: b(
        "Em grupo, alguém tem de olhar para trás. E água em cada paragem, antes de ter sede.",
        "In a group, someone has to look back. And water at every stop, before you're thirsty.",
      ),
    },
  ],
  convite: b(
    "Tem uma história que possa ajudar alguém a chegar a casa?",
    "Do you have a story that could help someone get home safely?",
  ),
  conviteTexto: b(
    "Uma quase-queda, uma lição aprendida, um gesto que salvou o dia. Conte-a no Fórum ou escreva-nos: com a sua autorização, podemos publicá-la aqui.",
    "A near miss, a lesson learned, something that saved the day. Share it on the Forum or write to us: with your permission, we may publish it here.",
  ),
  forum: b("Contar no Fórum", "Share on the Forum"),
  contacto: b("Escrever à MotoBox", "Write to MotoBox"),
  anterior: b("História anterior", "Previous story"),
  seguinte: b("História seguinte", "Next story"),
};

/* ---------------- Teste rápido ---------------- */

/** Perguntas sobre o que está na página. "certa" conta a partir de 1 (1 = a primeira opção). */
export const QUIZ = {
  titulo: b("Sabe o que fazer?", "Do you know what to do?"),
  texto: b(
    "Seis perguntas rápidas sobre o que leu. A resposta aparece logo, com a explicação.",
    "Six quick questions about what you've read. The answer shows straight away, with the explanation.",
  ),
  perguntaDe: b("Pergunta {n} de {total}", "Question {n} of {total}"),
  certo: b("Certo.", "Correct."),
  errado: b("Não é bem assim.", "Not quite."),
  seguinte: b("Pergunta seguinte", "Next question"),
  verResultado: b("Ver o resultado", "See your score"),
  resultado: b("{certas} de {total} certas", "{certas} of {total} correct"),
  resultadoTudo: b("Sabe o que fazer. Partilhe com quem anda consigo.", "You know what to do. Share it with the people you ride with."),
  resultadoParte: b("Reveja os capítulos das perguntas que falharam: vale a pena.", "Go back over the chapters for the questions you missed: it's worth it."),
  rever: b("Rever", "Review"),
  recomecar: b("Responder de novo", "Try again"),
  perguntas: [
    {
      pergunta: b(
        "Um motociclista caiu. Está no chão, consciente e a respirar. Tira-lhe o capacete?",
        "A rider has crashed. They're on the ground, conscious and breathing. Do you take their helmet off?",
      ),
      opcoes: [
        b("Sim, para ele respirar melhor", "Yes, so they can breathe more easily"),
        b("Não. Deixo-o quieto e ligo 111", "No. I keep them still and call 111"),
        b("Sim, desde que seja com cuidado", "Yes, as long as I'm careful"),
      ],
      certa: 2,
      explicacao: b(
        "Não se tira o capacete a um motociclista ferido. Só se ele não respirar e não houver outra forma de lhe abrir as vias respiratórias, e sempre a dois.",
        "Don't remove an injured rider's helmet. Only if they aren't breathing and there's no other way to open their airway, and always with two people.",
      ),
      seccao: "acidente",
    },
    {
      pergunta: b("Começou a chover. A distância de que precisa para parar…", "It's started to rain. The distance you need to stop…"),
      opcoes: [
        b("Fica igual, se os pneus forem bons", "Stays the same, if your tyres are good"),
        b("Aumenta um pouco", "Goes up a little"),
        b("Fica pelo menos no dobro", "At least doubles"),
      ],
      certa: 3,
      explicacao: b(
        "Com piso molhado, a distância de paragem é pelo menos o dobro. Deixe o dobro do espaço e trave mais cedo, com suavidade.",
        "On a wet road, your stopping distance at least doubles. Leave twice the gap and brake earlier and more gently.",
      ),
      seccao: "chuva",
    },
    {
      pergunta: b(
        "Quanto espaço deve ficar entre a correia do capacete e o queixo?",
        "How much room should there be between the helmet strap and your chin?",
      ),
      opcoes: [
        b("Nenhum: tem de apertar até doer", "None: it should be tight enough to hurt"),
        b("Um ou dois dedos", "One or two fingers"),
        b("Uma mão inteira, para respirar", "A whole hand, so you can breathe"),
      ],
      certa: 2,
      explicacao: b(
        "Um ou dois dedos, não mais. Justo, mas sem doer. Mais largo do que isso, o capacete pode sair numa queda.",
        "One or two fingers, no more. Snug, but it shouldn't hurt. Any looser and the helmet can come off in a crash.",
      ),
      seccao: "capacete",
    },
    {
      pergunta: b(
        "Caiu com o capacete posto. Por fora, parece intacto. E agora?",
        "You crashed with your helmet on. From the outside, it looks fine. Now what?",
      ),
      opcoes: [
        b("Continua a servir", "It's still good"),
        b("Troca-se: a espuma pode estar esmagada por dentro", "Replace it: the foam may be crushed inside"),
        b("Basta trocar a viseira", "Just replace the visor"),
      ],
      certa: 2,
      explicacao: b(
        "A espuma interior protege esmagando-se, e isso não se vê por fora. Um capacete que já protegeu uma vez não protege da mesma forma a segunda.",
        "The inner foam protects by crushing, and you can't see that from outside. A helmet that has protected you once won't protect you the same way a second time.",
      ),
      seccao: "capacete",
    },
    {
      pergunta: b(
        "Passeio de clube numa estrada de serra, cheia de curvas. Como vai o grupo?",
        "A club ride on a mountain road full of bends. How does the group ride?",
      ),
      opcoes: [
        b("Em ziguezague, a um segundo", "Staggered, one second apart"),
        b("Em fila indiana, com pelo menos dois segundos entre motas", "Single file, at least two seconds apart"),
        b("Lado a lado, para não se perder ninguém", "Side by side, so nobody gets lost"),
      ],
      certa: 2,
      explicacao: b(
        "Em curvas, com mau piso ou pouca visibilidade, passa-se a fila indiana, com pelo menos dois segundos entre motas.",
        "On bends, bad surfaces or in poor visibility, switch to single file with at least two seconds between bikes.",
      ),
      seccao: "grupo",
    },
    {
      pergunta: b(
        "Qual é a taxa de álcool no sangue segura para andar de mota?",
        "What's a safe blood alcohol level for riding a motorcycle?",
      ),
      opcoes: [
        b("Até 0,6 g/l, o limite do Código de Estrada", "Up to 0.6 g/l, the Road Code limit"),
        b("Até 0,4 g/l", "Up to 0.4 g/l"),
        b("Zero", "Zero"),
      ],
      certa: 3,
      explicacao: b(
        "A lei considera sob influência quem passa de 0,6 g/l, mas a OMS avisa que o risco começa bem antes. Em cima de uma mota, a única taxa segura é zero.",
        "The law treats anyone above 0.6 g/l as under the influence, but the WHO warns that the risk starts well before that. On a motorcycle, the only safe level is zero.",
      ),
      seccao: "cabeca",
    },
  ] as { pergunta: Bi; opcoes: Bi[]; certa: number; explicacao: Bi; seccao: string }[],
};

/* ---------------- Fontes ---------------- */

export const FONTES: { nome: Bi; url: string }[] = [
  {
    nome: b("OMS: Road traffic injuries, nota descritiva (Julho de 2026)", "WHO: Road traffic injuries, fact sheet (July 2026)"),
    url: "https://www.who.int/news-room/fact-sheets/detail/road-traffic-injuries",
  },
  {
    nome: b(
      "Código de Estrada de Angola, Decreto-Lei n.º 5/08 (artigos 80.º, 81.º e 90.º)",
      "Angolan Road Code, Decree-Law 5/08 (articles 80, 81 and 90)",
    ),
    url: "https://angolex.com/paginas/codigos/codigo-de-estrada.html",
  },
  {
    nome: b(
      "Plataforma Media: acidentes de viação entre Setembro de 2025 e Março de 2026, segundo a Polícia Nacional (20/03/2026)",
      "Plataforma Media: road crashes between September 2025 and March 2026, according to the National Police (20/03/2026)",
    ),
    url: "https://www.plataformamedia.com/2026/03/20/entre-setembro-de-2025-e-marco-deste-ano-acidentes-de-viacao-matam-1200-pessoas-e-causam-8-mil-feridos-no-pais/",
  },
  {
    nome: b("SHARP (Departamento de Transportes do Reino Unido): ECE R22-06", "SHARP (UK Department for Transport): ECE R22-06"),
    url: "https://sharp.dft.gov.uk/2024/09/04/ece-r22-06-what-you-need-to-know-about-the-new-helmet-standard/",
  },
  {
    nome: b("Demon Tweeks: a norma ECE 22.06 explicada", "Demon Tweeks: the ECE 22.06 helmet standard explained"),
    url: "https://blog.demon-tweeks.com/motorcycle/the-ece-22-06-helmet-standard-explained/",
  },
  {
    nome: b("Snell Memorial Foundation: perguntas frequentes", "Snell Memorial Foundation: FAQ"),
    url: "https://smf.org/faq",
  },
  {
    nome: b("Highway Code (Reino Unido): regras para motociclistas, 83 a 88", "UK Highway Code: rules for motorcyclists, 83 to 88"),
    url: "https://www.gov.uk/guidance/the-highway-code/rules-for-motorcyclists-83-to-88",
  },
  {
    nome: b("Highway Code (Reino Unido): condutores e motociclistas, 89 a 102", "UK Highway Code: drivers and motorcyclists, 89 to 102"),
    url: "https://www.gov.uk/guidance/the-highway-code/rules-for-drivers-and-motorcyclists-89-to-102",
  },
  {
    nome: b("Highway Code (Reino Unido): mau tempo, 226 a 237", "UK Highway Code: adverse weather, 226 to 237"),
    url: "https://www.gov.uk/guidance/the-highway-code/driving-in-adverse-weather-conditions-226-to-237",
  },
  {
    nome: b("Highway Code (Reino Unido): anexo 7, primeiros socorros na estrada", "UK Highway Code: annex 7, first aid on the road"),
    url: "https://www.gov.uk/guidance/the-highway-code/annex-7-first-aid-on-the-road",
  },
  {
    nome: b(
      "de Rome L. et al. (2011), Motorcycle protective clothing: protection from injury or just the weather?, Accident Analysis & Prevention",
      "de Rome L. et al. (2011), Motorcycle protective clothing: protection from injury or just the weather?, Accident Analysis & Prevention",
    ),
    url: "https://eprints.qut.edu.au/45624/",
  },
  {
    nome: b("Motorcycle Safety Foundation: lista T-CLOCS", "Motorcycle Safety Foundation: T-CLOCS checklist"),
    url: "https://msf-usa.org/documents/library/t-clocs-pre-ride-inspection-checklist/",
  },
  {
    nome: b("Motorcycle Safety Foundation: passeios em grupo", "Motorcycle Safety Foundation: group riding"),
    url: "https://msf-usa.org/documents/library/group-riding/",
  },
  {
    nome: b(
      "Governo de Nova Gales do Sul: primeiros socorros em acidentes de mota",
      "NSW Government: emergency first aid for motorcycle accidents",
    ),
    url: "https://www.nsw.gov.au/driving-boating-and-transport/roads-safety-and-rules/motorcycles-and-scooters/emergency-first-aid-for-motorcycle-accidents",
  },
  {
    nome: b("NHS (Reino Unido): exaustão pelo calor e golpe de calor", "NHS: heat exhaustion and heatstroke"),
    url: "https://www.nhs.uk/conditions/heat-exhaustion-heatstroke/",
  },
  {
    nome: b(
      "RNA: em caso de emergência, os cidadãos devem ligar para o 111 (28/11/2024)",
      "RNA (Angolan National Radio): in an emergency, call 111 (28/11/2024)",
    ),
    url: "https://rna.ao/rna.ao/2024/11/28/servico-de-proteccao-civil-e-bombeiros-alerta-que-em-caso-de-emergencias-medicas-policiais-ou-de-incendio-os-cidadaos-devem-ligar-para-o-111/",
  },
  {
    nome: b(
      "Novo Jornal: o 113 deixou de funcionar e o 111 é o novo número de emergência (07/05/2020)",
      "Novo Jornal: 113 discontinued, 111 is the new emergency number (07/05/2020)",
    ),
    url: "https://www.novojornal.co.ao/sociedade/detalhe/terminal-113-deixou-de-estar-ao-servico-do-cidadao---111-e-o-novo-numero-de-emergencia-policial-23093.html",
  },
  {
    nome: b(
      "Governo Provincial de Cabinda: inauguração do CISP de Cabinda (Dezembro de 2025)",
      "Cabinda Provincial Government: Cabinda CISP opens (December 2025)",
    ),
    url: "https://cabinda.gov.ao/web/noticias/cisp-or-centro-integrado-de-seguranca-publica-de-cabinda-inaugurado-pelo-ministro-do-interior",
  },
  {
    nome: b("ARSEG: seguros obrigatórios", "ARSEG: mandatory insurance"),
    url: "https://www.arseg.ao/consumidor/mercado/seguros/tipos-de-seguros/seguros-obrigatorios/",
  },
  {
    nome: b("Decreto n.º 35/09, de 11 de Agosto (seguro automóvel obrigatório)", "Decree 35/09 of 11 August (mandatory motor insurance)"),
    url: "https://lex.ao/docs/conselho-de-ministros/2009/decreto-n-o-35-09-de-11-de-agosto/",
  },
  {
    nome: b(
      "Highway Code (Reino Unido): regras gerais, 103 a 158 (distâncias típicas de paragem, regra 126)",
      "UK Highway Code: general rules, 103 to 158 (typical stopping distances, rule 126)",
    ),
    url: "https://www.gov.uk/guidance/the-highway-code/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158",
  },
];
