/* ============================================================
   MOTOBOX — Importar do estrangeiro: texto da página (pt e en)

   As regras de importação citadas têm a fonte ao lado. Quando não
   há certeza, o texto manda confirmar com um despachante oficial.
   As lojas em ONDE_PROCURAR NÃO são parceiras: são sítios conhecidos
   onde a comunidade costuma procurar. Cada uma foi confirmada no
   próprio site (fonte no comentário) em Setembro de 2026.
   ============================================================ */

export type Bi = { pt: string; en: string };

const b = (pt: string, en: string): Bi => ({ pt, en });

export const TEXTO = {
  eyebrow: b("Marketplace", "Marketplace"),
  titulo: b("Importar do estrangeiro", "Buy from abroad"),
  sub: b(
    "Peças, equipamento, motas e mais, de lojas e classificados de Portugal, Espanha e do resto da Europa. Envie-nos a ligação e peça um orçamento com tudo incluído até Angola: transporte, alfândega e taxas.",
    "Parts, gear, bikes and more, from shops and classifieds in Portugal, Spain and the rest of Europe. Send us the link and ask for an all-in quote to Angola: shipping, customs and fees included.",
  ),
  pedir: b("Pedir importação", "Request an import"),
  ondeProcurar: b("Onde procurar", "Where to look"),
  voltar: b("Voltar ao Marketplace", "Back to the Marketplace"),

  comoTitulo: b("Como funciona", "How it works"),
  arranque: b("Serviço em arranque", "Just getting started"),
  arranqueTexto: b(
    "O serviço está a começar. Por agora, cada pedido é tratado pela equipa da Motobox, um a um, e ainda estamos a fechar parcerias de importação. Pedir um orçamento não o obriga a comprar.",
    "This service is just starting. For now, every request is handled by the Motobox team one by one, and we're still putting import partnerships in place. Asking for a quote doesn't commit you to buy.",
  ),

  oQueTitulo: b("O que pode importar", "What you can import"),
  regrasTitulo: b("Antes de comprar", "Before you buy"),
  regrasSub: b(
    "O que a lei angolana diz, e o que convém confirmar. Não é aconselhamento jurídico: as regras mudam.",
    "What Angolan law says, and what's worth checking. This isn't legal advice: the rules change.",
  ),
  despachante: b(
    "Para veículos, confirme sempre com um despachante oficial antes de pagar ao vendedor.",
    "For vehicles, always check with a licensed customs broker before paying the seller.",
  ),

  ondeTitulo: b("Onde procurar", "Where to look"),
  ondeSub: b(
    "Sítios conhecidos onde a comunidade encontra peças, equipamento e veículos usados. Não são parceiros da Motobox e não recebemos nada por os mostrar. Confirme sempre o vendedor antes de pagar.",
    "Well-known sites where riders find parts, gear and used vehicles. They are not Motobox partners and we get nothing for listing them. Always check the seller before paying.",
  ),
  naoParceiro: b("Não é parceiro", "Not a partner"),
  classificadosAviso: b(
    "Nos classificados, compra a particulares: veja o veículo pessoalmente, ou através de alguém de confiança, antes de pagar qualquer sinal.",
    "On classifieds you're buying from private sellers: see the vehicle in person, or through someone you trust, before paying any deposit.",
  ),

  pagamentoTitulo: b("Pagamento", "Payment"),
  emKwanzas: b("Em Kwanzas", "In Kwanzas"),
  emKwanzasTexto: b(
    "O orçamento é apresentado em Kwanzas e só paga se o aceitar. A forma de pagamento vem indicada no orçamento.",
    "The quote is in Kwanzas and you only pay if you accept it. The payment method is set out in the quote.",
  ),
  carteiras: b("Carteiras digitais angolanas", "Angolan digital wallets"),
  emEstudo: b("Em estudo", "Under study"),
  // Forbes África Lusófona (16/05/2024): PayPay, da Conectando, autorizada pelo BNA (licença n.º 420).
  carteirasTexto: b(
    "Estamos a estudar o pagamento por carteiras digitais angolanas, como a PayPay África, autorizada pelo Banco Nacional de Angola. Ainda não está disponível.",
    "We're looking into payment through Angolan digital wallets such as PayPay África, which is authorised by the National Bank of Angola. It isn't available yet.",
  ),

  formTitulo: b("Pedir importação", "Request an import"),
  formSub: b(
    "Cole a ligação, diga-nos o que é e para onde vai. A equipa responde por email com um orçamento ou com o que falta saber.",
    "Paste the link, tell us what it is and where it's going. The team replies by email with a quote or with any questions.",
  ),
  formDicas: [
    b("A ligação directa para o artigo, não para a página inicial da loja.", "The direct link to the item, not the shop's home page."),
    b("Tamanho, cor, modelo e ano da mota a que a peça se destina.", "Size, colour, and the model and year of the bike the part is for."),
    b("Numa mota ou carro usado: o ano da primeira matrícula.", "For a used bike or car: the year it was first registered."),
    b("Baterias, aerossóis ou líquidos: diga-nos, porque têm regras de transporte.", "Batteries, aerosols or liquids: tell us, as they have shipping rules."),
  ],
  fontesTitulo: b("Fontes", "Sources"),
  abreNovaJanela: b("abre numa nova janela", "opens in a new window"),
};

/* ---------------- Como funciona ---------------- */

export const PASSOS: { titulo: Bi; texto: Bi }[] = [
  {
    titulo: b("Escolha", "Choose"),
    texto: b(
      "Encontre o que quer numa loja ou num site de classificados lá fora. Guarde a ligação.",
      "Find what you want in a shop or on a classifieds site abroad. Keep the link.",
    ),
  },
  {
    titulo: b("Envie a ligação", "Send the link"),
    texto: b(
      "Preencha o pedido com a ligação e os detalhes. Precisa de uma conta Motobox, que é gratuita.",
      "Fill in the request with the link and the details. You need a Motobox account, which is free.",
    ),
  },
  {
    titulo: b("Receba o orçamento", "Get a quote"),
    texto: b(
      "A equipa analisa o pedido e responde com o custo até Angola: artigo, transporte, alfândega e taxas.",
      "The team reviews your request and replies with the cost to Angola: item, shipping, customs and fees.",
    ),
  },
  {
    titulo: b("Pague", "Pay"),
    texto: b(
      "Só se aceitar o orçamento, e em Kwanzas.",
      "Only if you accept the quote, and in Kwanzas.",
    ),
  },
  {
    titulo: b("Receba em Angola", "Receive it in Angola"),
    texto: b(
      "O artigo é despachado na alfândega e entregue. O prazo depende do artigo e do transporte, e vem no orçamento.",
      "The item clears customs and is delivered. Timing depends on the item and the shipping, and is stated in the quote.",
    ),
  },
];

/* ---------------- O que pode importar ---------------- */

export const CATEGORIAS: { nome: Bi; texto: Bi; ligacao?: { href: string; texto: Bi } }[] = [
  {
    nome: b("Peças e acessórios", "Parts and accessories"),
    texto: b(
      "O mais simples de importar. Tenha à mão o modelo e o ano da mota e, se souber, a referência original da peça.",
      "The simplest thing to import. Have your bike's model and year to hand and, if you know it, the part's original reference number.",
    ),
  },
  {
    nome: b("Equipamento", "Riding gear"),
    texto: b(
      "Capacetes, casacos, luvas e botas. Veja a tabela de tamanhos da marca e, no capacete, a homologação ECE 22.06 ou DOT.",
      "Helmets, jackets, gloves and boots. Check the brand's size chart and, for helmets, ECE 22.06 or DOT approval.",
    ),
    ligacao: { href: "/seguranca#capacete", texto: b("Como escolher um capacete", "How to choose a helmet") },
  },
  {
    nome: b("Motas", "Motorcycles"),
    texto: b(
      "Novas ou usadas. As usadas têm idade máxima para entrar em Angola: veja as regras abaixo.",
      "New or used. Used bikes have a maximum age for import into Angola: see the rules below.",
    ),
  },
  {
    nome: b("Moto 4 e buggies", "Quads and buggies"),
    texto: b(
      "Os quadriciclos contam como equipamento rodoviário na lei angolana. Confirme as regras de idade e de registo antes de comprar.",
      "Quadricycles count as road equipment under Angolan law. Check the age and registration rules before you buy.",
    ),
  },
  {
    nome: b("Carros", "Cars"),
    texto: b(
      "Também é possível, com as mesmas regras de idade e de documentos dos outros veículos usados.",
      "Also possible, under the same age and paperwork rules as other used vehicles.",
    ),
  },
];

/* ---------------- Antes de comprar ---------------- */

export const REGRAS: { titulo: Bi; texto: Bi; fonte?: number[] }[] = [
  {
    titulo: b("Alfândega e impostos", "Customs and taxes"),
    // AGT/MINFIN: Pauta Aduaneira aprovada pelo Decreto Legislativo Presidencial n.º 1/24;
    // Portal do Contribuinte: IVA de 14%, 2% na importação em Cabinda.
    texto: b(
      "O que entra paga direitos aduaneiros conforme a Pauta Aduaneira em vigor (Decreto Legislativo Presidencial n.º 1/24), mais IVA de 14% (2% em Cabinda) e outras imposições. O valor depende da classificação de cada artigo, por isso é calculado no orçamento.",
      "Imports pay customs duties under the current Customs Tariff (Presidential Legislative Decree 1/24), plus 14% VAT (2% in Cabinda) and other charges. The amount depends on how each item is classified, so it's worked out in the quote.",
    ),
    fonte: [1, 2],
  },
  {
    titulo: b("Veículos usados: idade máxima", "Used vehicles: maximum age"),
    // Decreto Presidencial n.º 155/20, artigo 17.º, n.º 2.
    texto: b(
      "O Decreto Presidencial n.º 155/20 fixou limites de idade para importar veículos usados, contados desde o primeiro registo: 3 anos para motociclos, 5 para ligeiros e 8 para pesados. Estes limites já mudaram no passado.",
      "Presidential Decree 155/20 set age limits for importing used vehicles, counted from first registration: 3 years for motorcycles, 5 for light vehicles and 8 for heavy vehicles. These limits have changed before.",
    ),
    fonte: [3],
  },
  {
    titulo: b("Documentos do veículo", "Vehicle paperwork"),
    // Decreto Presidencial n.º 155/20, artigos 17.º, n.º 3, e 19.º.
    texto: b(
      "A lei pede o comprovativo de propriedade, o da primeira matrícula e o do último registo, e as chapas de identificação com o número de série e o ano de fabrico. Antes do registo em Angola, o veículo tem de passar uma inspecção técnica.",
      "The law requires proof of ownership, of first registration and of the latest registration, plus the identification plates showing the serial number and year of manufacture. Before it can be registered in Angola, the vehicle must pass a technical inspection.",
    ),
    fonte: [3],
  },
  {
    titulo: b("Número de quadro e origem", "Chassis number and origin"),
    texto: b(
      "Confirme que o número de quadro (VIN) gravado no veículo é o mesmo dos documentos e que quem vende é o dono. Desconfie de preços bons de mais e nunca pague sinal a quem não mostra os documentos.",
      "Check that the chassis number (VIN) stamped on the vehicle matches the documents and that the seller is the owner. Be wary of prices that look too good, and never pay a deposit to someone who won't show the paperwork.",
    ),
  },
  {
    titulo: b("Compatibilidade e garantia", "Fit and warranty"),
    texto: b(
      "Numa peça, confirme que a referência serve o seu modelo e ano. A garantia de uma loja estrangeira pode obrigar a devolver o artigo ao país de origem.",
      "For parts, make sure the reference fits your model and year. A foreign shop's warranty may mean sending the item back to its country of origin.",
    ),
  },
  {
    titulo: b("Transporte", "Shipping"),
    texto: b(
      "Baterias de lítio, aerossóis, combustível e outros líquidos inflamáveis têm restrições no transporte, sobretudo por avião. Indique-os no pedido.",
      "Lithium batteries, aerosols, fuel and other flammable liquids have shipping restrictions, especially by air. Mention them in your request.",
    ),
  },
];

/* ---------------- Onde procurar (não são parceiros) ---------------- */

export interface Sitio {
  nome: string;
  url: string;
  pais: Bi;
  texto: Bi;
}

export const ONDE_PROCURAR: { grupo: Bi; classificados?: boolean; sitios: Sitio[] }[] = [
  {
    grupo: b("Equipamento e peças", "Gear and parts"),
    sitios: [
      {
        // motocard.com/blog: primeira loja em Portugal (Lisboa); lojas em Espanha, Andorra, Portugal e Itália.
        nome: "Motocard",
        url: "https://www.motocard.com/pt",
        pais: b("Andorra e Espanha", "Andorra and Spain"),
        texto: b(
          "Rede de lojas de equipamento, acessórios e peças, com lojas em Espanha e em Portugal e loja online em português.",
          "A chain of gear, accessories and parts shops, with stores in Spain and Portugal and an online shop in Portuguese.",
        ),
      },
      {
        // Tradeinn Retail Services, Celrà (Girona); Motardinn é a loja de mota do grupo.
        nome: "Motardinn",
        url: "https://www.tradeinn.com/motardinn/pt",
        pais: b("Espanha", "Spain"),
        texto: b(
          "Loja online de equipamento de mota do grupo Tradeinn, de Girona, que envia para muitos países.",
          "Online motorcycle gear shop from the Tradeinn group in Girona, shipping to many countries.",
        ),
      },
      {
        // fc-moto.com/pt-pt: "fundada em Aachen em 1996".
        nome: "FC-Moto",
        url: "https://www.fc-moto.com/pt-pt/",
        pais: b("Alemanha", "Germany"),
        texto: b(
          "Loja de Aachen, fundada em 1996: capacetes, roupa, peças e acessórios, com site em português.",
          "Aachen-based shop founded in 1996: helmets, clothing, parts and accessories, with a Portuguese site.",
        ),
      },
      {
        // Motoblouz: criada em 2004, sede em Carvin (Pas-de-Calais).
        nome: "Motoblouz",
        url: "https://www.motoblouz.com",
        pais: b("França", "France"),
        texto: b(
          "Loja online francesa de equipamento e acessórios para motociclistas, criada em 2004.",
          "French online shop for riding gear and accessories, founded in 2004.",
        ),
      },
      {
        // Pierce Group (Estocolmo): 24MX para motocross e enduro.
        nome: "24MX",
        url: "https://www.24mx.pt",
        pais: b("Suécia", "Sweden"),
        texto: b(
          "Especialista online em motocross e enduro: equipamento, peças e acessórios.",
          "Online motocross and enduro specialist: gear, parts and accessories.",
        ),
      },
      {
        // cmsnl.com: Lelystad, peças originais Honda, Yamaha, Suzuki, Kawasaki, BMW, Ducati; "Delivering into 60 countries".
        nome: "CMSNL",
        url: "https://www.cmsnl.com",
        pais: b("Países Baixos", "Netherlands"),
        texto: b(
          "Peças originais para motas japonesas e europeias, pesquisadas por modelo e ano. Diz entregar em 60 países.",
          "Original parts for Japanese and European bikes, searchable by model and year. Says it delivers to 60 countries.",
        ),
      },
    ],
  },
  {
    grupo: b("Motas, moto 4 e carros usados", "Used bikes, quads and cars"),
    classificados: true,
    sitios: [
      {
        // Standvirtual (grupo OLX): carros e motas em Portugal.
        nome: "Standvirtual",
        url: "https://www.standvirtual.com/motos",
        pais: b("Portugal", "Portugal"),
        texto: b(
          "Classificados de carros e motas, de particulares e de stands.",
          "Car and motorcycle classifieds from private sellers and dealers.",
        ),
      },
      {
        nome: "OLX Portugal",
        url: "https://www.olx.pt/carros-motos-e-barcos/motociclos-scooters/",
        pais: b("Portugal", "Portugal"),
        texto: b(
          "Classificados gerais, com uma secção de motociclos e scooters.",
          "General classifieds, with a motorcycles and scooters section.",
        ),
      },
      {
        // motos.coches.net (Adevinta): motas novas e usadas, quads, minimotas e buggies.
        nome: "Motos.net",
        url: "https://motos.coches.net",
        pais: b("Espanha", "Spain"),
        texto: b(
          "Portal espanhol de motas novas e usadas, com quads e buggies.",
          "Spanish portal for new and used motorcycles, including quads and buggies.",
        ),
      },
      {
        nome: "Wallapop",
        url: "https://es.wallapop.com",
        pais: b("Espanha", "Spain"),
        texto: b(
          "Classificados entre particulares, com motas, peças e equipamento.",
          "Classifieds between private sellers, with bikes, parts and gear.",
        ),
      },
      {
        nome: "AutoScout24",
        url: "https://www.autoscout24.com",
        pais: b("Europa", "Europe"),
        texto: b(
          "Classificados de carros e motas de vários países europeus.",
          "Car and motorcycle classifieds from several European countries.",
        ),
      },
      {
        nome: "mobile.de",
        url: "https://www.mobile.de",
        pais: b("Alemanha", "Germany"),
        texto: b(
          "Portal alemão de carros e motas, novos e usados.",
          "German portal for new and used cars and motorcycles.",
        ),
      },
    ],
  },
];

/* ---------------- Fontes (numeradas como em REGRAS.fonte) ---------------- */

export const FONTES: { n: number; nome: Bi; url: string }[] = [
  {
    n: 1,
    nome: b(
      "AGT: Pauta Aduaneira, versão 2022 do Sistema Harmonizado (Decreto Legislativo Presidencial n.º 1/24)",
      "AGT: Customs Tariff, 2022 Harmonized System (Presidential Legislative Decree 1/24)",
    ),
    url: "https://portaldocontribuinte.minfin.gov.ao/noticia?id=866603",
  },
  {
    n: 2,
    nome: b("Portal do Contribuinte: Imposto sobre o Valor Acrescentado", "Taxpayer Portal: Value Added Tax"),
    url: "https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-valor-acrescentado",
  },
  {
    n: 3,
    nome: b(
      "Decreto Presidencial n.º 155/20, de 1 de Junho (importação e comércio de equipamentos rodoviários)",
      "Presidential Decree 155/20 of 1 June (import and sale of road equipment)",
    ),
    url: "https://lex.ao/docs/presidente-da-republica/2020/decreto-presidencial-n-o-155-20-de-01-de-junho/",
  },
  {
    n: 4,
    nome: b(
      "Forbes África Lusófona: PayPay autorizada pelo BNA (16/05/2024)",
      "Forbes África Lusófona: PayPay authorised by the BNA (16/05/2024)",
    ),
    url: "https://forbesafricalusofona.com/paypay-adere-ao-sistema-de-transferencia-instantanea-e-pagamento-do-bna/",
  },
];

/* ---------------- Formulário ---------------- */

export const FORM = {
  ligacao: b("Ligação para o artigo", "Link to the item"),
  ligacaoPh: b("https://…", "https://…"),
  titulo: b("O que é", "What it is"),
  tituloPh: b("Ex.: Capacete integral, tamanho M, preto", "E.g. Full-face helmet, size M, black"),
  categoria: b("Tipo", "Type"),
  quantidade: b("Quantidade", "Quantity"),
  nome: b("Nome", "Name"),
  nomePh: b("O seu nome completo", "Your full name"),
  email: b("Email", "Email"),
  emailPh: b("o.seu@email.ao", "your@email.com"),
  telefone: b("Telemóvel", "Mobile"),
  telefonePh: b("+244 9xx xxx xxx", "+244 9xx xxx xxx"),
  provincia: b("Província de entrega", "Delivery province"),
  escolha: b("Escolha…", "Choose…"),
  notas: b("Notas", "Notes"),
  notasPh: b(
    "Tamanho, cor, referência da peça, ano da mota, valor máximo que quer gastar…",
    "Size, colour, part number, year of the bike, the most you want to spend…",
  ),
  opcional: b("opcional", "optional"),
  enviar: b("Pedir orçamento", "Ask for a quote"),
  aEnviar: b("A enviar…", "Sending…"),
  sessaoNota: b(
    "Para enviar precisa de uma conta Motobox. É gratuita e leva um minuto.",
    "You need a Motobox account to send this. It's free and takes a minute.",
  ),
  motivo: b(
    "Para pedir uma importação precisa de uma conta Motobox. É gratuita e leva um minuto.",
    "To request an import you need a Motobox account. It's free and takes a minute.",
  ),
  privacidade: b(
    "Os seus dados servem apenas para responder a este pedido.",
    "Your details are used only to reply to this request.",
  ),
  erroGeral: b("Não foi possível enviar. Tente de novo.", "We couldn't send it. Please try again."),
  semLigacao: b("Sem ligação à internet. Tente de novo.", "No internet connection. Please try again."),
  sucessoTitulo: b("Pedido enviado", "Request sent"),
  sucessoTexto: b(
    "Obrigado, {nome}. A equipa da Motobox vai analisar o pedido e responder para {email}.",
    "Thank you, {nome}. The Motobox team will review your request and reply to {email}.",
  ),
  outro: b("Fazer outro pedido", "Make another request"),
};
