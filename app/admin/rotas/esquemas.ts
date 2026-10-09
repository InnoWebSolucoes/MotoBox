/* ============================================================
   MOTOBOX ADMIN — Rotas: os campos dos formulários
   Peças repetidas (fonte, facto, lugar) e os esquemas de cada
   parte de uma rota e da página das rotas. As etiquetas dizem o
   que o campo faz no site, para quem não é técnico.
   ============================================================ */

import type { CampoEsquema } from "@/components/admin/editor/esquema";
import { opcoes } from "@/components/admin/editor/esquema";
import { EXIGENCIAS, PISOS } from "@/lib/rotas-tipos";

const s = (v: unknown) => (typeof v === "string" ? v : "");
const curto = (t: unknown, n = 80) => {
  const x = s(t);
  return x.length > n ? `${x.slice(0, n - 1)}…` : x;
};

/* ---------------- Peças ---------------- */

export const camposFonte: CampoEsquema[] = [
  { tipo: "texto", chave: "nome", etiqueta: "Nome da fonte", largura: "meia", placeholder: "Ex.: Jornal de Angola: a serra reabriu (Mai. 2026)" },
  { tipo: "url", chave: "url", etiqueta: "Ligação", largura: "meia", placeholder: "https://…" },
];

/** Uma só fonte (ex.: a de uma paragem). */
export const fonte = (chave: string, etiqueta = "Fonte", ajuda?: string): CampoEsquema => ({
  tipo: "objecto", chave, etiqueta, ajuda, campos: camposFonte,
});

/** Lista de fontes, com o nome e a ligação. */
export const fontes = (chave = "fontes", etiqueta = "Fontes", ajuda?: string): CampoEsquema => ({
  tipo: "lista", chave, etiqueta, ajuda, nomeItem: "fonte",
  resumo: (f) => s(f.nome) || s(f.url),
  novo: () => ({ nome: "", url: "" }),
  campos: camposFonte,
});

const camposFacto = (linhas = 3): CampoEsquema[] => [
  { tipo: "area", chave: "texto", etiqueta: "Texto", linhas },
  fontes("fontes", "Fontes", "Aparecem em letra pequena por baixo do texto."),
];

/** Um facto: um texto e as fontes que o sustentam. */
export const facto = (chave: string, etiqueta: string, ajuda?: string): CampoEsquema => ({
  tipo: "objecto", chave, etiqueta, ajuda, campos: camposFacto(),
});

/** Lista de factos, cada um com as suas fontes. */
export const factos = (chave: string, etiqueta: string, ajuda?: string, nomeItem = "facto"): CampoEsquema => ({
  tipo: "lista", chave, etiqueta, ajuda, nomeItem,
  resumo: (f) => curto(f.texto),
  novo: () => ({ texto: "", fontes: [] }),
  campos: camposFacto(),
});

/** Lista de lugares: restaurantes, alojamento, hospitais. */
export const lugares = (chave: string, etiqueta: string, ajuda?: string): CampoEsquema => ({
  tipo: "lista", chave, etiqueta, ajuda, nomeItem: "lugar",
  resumo: (l) => [s(l.nome), s(l.onde)].filter(Boolean).join(" · "),
  novo: () => ({ nome: "", onde: "", nota: "", fontes: [] }),
  campos: [
    { tipo: "texto", chave: "nome", etiqueta: "Nome", largura: "meia" },
    { tipo: "texto", chave: "onde", etiqueta: "Onde fica", largura: "meia", placeholder: "Ex.: Lubango, Rua do Hospital" },
    { tipo: "area", chave: "nota", etiqueta: "Nota", linhas: 2, ajuda: "Opcional: o que convém saber (horário, se está a funcionar…)." },
    fontes(),
  ],
});

/* ---------------- Rota: apresentação ---------------- */

export const ESQUEMA_APRESENTACAO: CampoEsquema[] = [
  { tipo: "texto", chave: "nome", etiqueta: "Nome da rota", obrigatorio: true, largura: "meia", ajuda: "O título grande da página e dos cartões." },
  { tipo: "texto", chave: "subtitulo", etiqueta: "Subtítulo", largura: "meia", ajuda: "Uma linha por baixo do nome nos cartões, e o título da descrição." },
  { tipo: "texto", chave: "regiao", etiqueta: "Região", largura: "meia", placeholder: "Ex.: Huíla · Namibe", ajuda: "Como aparece por cima do nome nos cartões." },
  { tipo: "texto", chave: "partida", etiqueta: "Partida", largura: "meia", placeholder: "Ex.: Lubango", ajuda: "Cidade de onde normalmente se parte (na ficha da rota)." },
  {
    tipo: "area", chave: "resumo", etiqueta: "Resumo", linhas: 3,
    ajuda: "Duas frases na abertura da página. Também é o texto que aparece no Google e quando se partilha a ligação.",
  },
  {
    tipo: "lista-texto", chave: "descricao", etiqueta: "Descrição", multilinha: true, placeholder: "Novo parágrafo",
    ajuda: "Os parágrafos da apresentação, por baixo dos números.",
  },
  { tipo: "lista-texto", chave: "destaques", etiqueta: "O que ver", placeholder: "Ex.: Miradouro da Leba, com a estrada inteira à vista", ajuda: "Os quadrados de \"O que ver\"." },
  { tipo: "lista-texto", chave: "dicas", etiqueta: "Dicas para quem vai de mota", multilinha: true, placeholder: "Nova dica", ajuda: "Os cartões numerados perto do fim da página." },
  {
    tipo: "secao", titulo: "Piso e exigência", descricao: "Os números do topo da página e a ficha da rota.",
    campos: [
      { tipo: "seleccao", chave: "piso", etiqueta: "Piso", largura: "meia", opcoes: opcoes(PISOS) },
      { tipo: "seleccao", chave: "exigencia", etiqueta: "Exigência", largura: "meia", opcoes: opcoes(EXIGENCIAS), ajuda: "Tranquila a verde, Média a dourado, Exigente e Aventura a vermelho." },
      { tipo: "area", chave: "pisoDetalhe", etiqueta: "O piso, em concreto", linhas: 3, ajuda: "Estradas, troços de terra, areia, buracos." },
      { tipo: "area", chave: "exigenciaPorque", etiqueta: "Porquê esta exigência", linhas: 2, ajuda: "Uma frase, na ficha da rota." },
    ],
  },
  {
    tipo: "secao", titulo: "Melhor época e duração",
    campos: [
      { tipo: "texto", chave: "epocaCurta", etiqueta: "Melhor época, em curto", largura: "meia", placeholder: "Ex.: Jun–Ago", ajuda: "Nos números do topo." },
      { tipo: "numero", chave: "dias", etiqueta: "Quantos dias", largura: "meia", min: 1, passo: 1, ajuda: "Nos números do topo e nos cartões." },
      { tipo: "area", chave: "melhorEpoca", etiqueta: "Melhor época", linhas: 2, ajuda: "O texto completo, no quadro \"Melhor época\"." },
      facto("diasNota", "Quantos dias: a explicação", "O quadro \"Quantos dias\", ao lado da descrição."),
    ],
  },
  {
    tipo: "lista", chave: "distancias", etiqueta: "Distâncias publicadas", nomeItem: "distância",
    ajuda: "O que as fontes dizem das distâncias, para comparar com o cálculo. Fica no quadro \"Distâncias publicadas\".",
    resumo: (d) => curto(d.texto),
    novo: () => ({ texto: "", fonte: { nome: "", url: "" } }),
    campos: [
      { tipo: "texto", chave: "texto", etiqueta: "Texto", placeholder: "Ex.: Miradouro: cerca de 50 km do Lubango" },
      fonte("fonte"),
    ],
  },
];

/* ---------------- Rota: horário ---------------- */

export const ESQUEMA_HORARIO: CampoEsquema[] = [
  {
    tipo: "lista", chave: "horario", etiqueta: "Horário sugerido", nomeItem: "dia",
    ajuda: "Um bloco por dia, pela ordem: o primeiro é o dia 1. O título do dia aparece também no itinerário.",
    resumo: (d, i) => `Dia ${i + 1}${s(d.titulo) ? ` · ${s(d.titulo)}` : ""}`,
    novo: () => ({ titulo: "", passos: [] }),
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título do dia", placeholder: "Ex.: Lubango, Leba e Moçâmedes" },
      {
        tipo: "lista", chave: "passos", etiqueta: "Passos", nomeItem: "passo",
        resumo: (p) => [s(p.hora), curto(p.texto, 70)].filter(Boolean).join(" · "),
        novo: () => ({ hora: "", texto: "" }),
        campos: [
          { tipo: "hora", chave: "hora", etiqueta: "Hora", largura: "meia" },
          { tipo: "area", chave: "texto", etiqueta: "O que acontece", linhas: 2 },
        ],
      },
    ],
  },
];

/* ---------------- Rota: informação prática ---------------- */

export const esquemaPratico = (cidades: { valor: string; nome: string }[]): CampoEsquema[] => [
  {
    tipo: "secao", titulo: "Combustível",
    campos: [
      facto("semCombustivel", "Maior troço sem combustível", "A caixa vermelha no topo do quadro Combustível."),
      factos("combustivel", "Postos e avisos", "Por baixo, vem sempre o preço do combustível (comum a todas as rotas, em \"Página Rotas\")."),
    ],
  },
  {
    tipo: "secao", titulo: "Comer, dormir e saúde",
    campos: [
      lugares("comer", "Onde comer"),
      lugares("dormir", "Onde dormir"),
      lugares("saude", "Hospital mais próximo"),
    ],
  },
  {
    tipo: "secao", titulo: "Estrada e documentos",
    descricao: "Os números de emergência e os documentos são comuns a todas as rotas: editam-se em \"Página Rotas\".",
    campos: [
      factos("perigos", "Perigos na estrada", undefined, "perigo"),
      factos("rede", "Rede móvel", "Por baixo, vem sempre o texto geral sobre as operadoras (em \"Página Rotas\")."),
      factos("licencas", "Licenças e entradas", undefined, "licença"),
      factos("motas", "A mota certa"),
    ],
  },
  {
    tipo: "secao", titulo: "A lista antes de sair",
    campos: [
      facto("agua", "Água e comida"),
      facto("grupo", "Sozinho ou em grupo"),
      {
        tipo: "lista-texto", chave: "levar", etiqueta: "Para esta rota", placeholder: "Ex.: Roupa por camadas",
        ajuda: "A lista \"Para esta rota\". Ao lado aparece sempre \"Em qualquer viagem\" (em \"Página Rotas\").",
      },
    ],
  },
  {
    tipo: "secao", titulo: "Clima e luz",
    campos: [
      {
        tipo: "seleccao", chave: "clima", etiqueta: "Cidade de referência", opcoes: cidades,
        ajuda: "A tabela de clima e o nascer e o pôr do sol desta cidade aparecem na página. As tabelas editam-se em \"Página Rotas\" › Clima por cidade.",
      },
    ],
  },
];

/* ---------------- Rota: pontos de interesse ---------------- */

export const ESQUEMA_PONTO: CampoEsquema[] = [
  { tipo: "texto", chave: "nome", etiqueta: "Nome", obrigatorio: true },
  { tipo: "coordenadas", chave: "_coord", etiqueta: "Onde fica" },
  { tipo: "area", chave: "nota", etiqueta: "Nota", linhas: 2, ajuda: "O que tem de especial. Vai também no ficheiro GPX." },
  fontes(),
];

/* ---------------- Rota: estado da estrada ---------------- */

export const ESQUEMA_ESTRADA: CampoEsquema[] = [
  { tipo: "texto", chave: "quando", etiqueta: "Quando foram os relatos", placeholder: "Ex.: Outubro de 2026", ajuda: "Aparece no texto: \"O que contam os motards que passaram por lá (…)\"." },
  {
    tipo: "lista", chave: "relatos", etiqueta: "Relatos", nomeItem: "relato",
    resumo: (r) => [s(r.troco), s(r.estado) ? NOME_ESTADO[s(r.estado)] ?? s(r.estado) : ""].filter(Boolean).join(" · "),
    novo: () => ({ troco: "", estado: "irregular", nota: "" }),
    campos: [
      { tipo: "texto", chave: "troco", etiqueta: "Troço", largura: "meia", placeholder: "Ex.: Luanda → Cabo Ledo (EN100)" },
      {
        tipo: "seleccao", chave: "estado", etiqueta: "Estado", largura: "meia",
        opcoes: [{ valor: "boa", nome: "Boa (verde)" }, { valor: "irregular", nome: "Irregular (dourado)" }, { valor: "má", nome: "Má (vermelho)" }],
      },
      { tipo: "area", chave: "nota", etiqueta: "O que contam", linhas: 2 },
    ],
  },
];

const NOME_ESTADO: Record<string, string> = { boa: "Boa", irregular: "Irregular", má: "Má" };

/* ---------------- Rota: fontes ---------------- */

export const ESQUEMA_FONTES: CampoEsquema[] = [
  {
    tipo: "nota",
    texto:
      "A lista \"Fontes\" no fim da página junta estas fontes gerais com todas as que estão citadas nos outros campos (troços, combustível, lugares, pontos…), sem repetir. As do OpenStreetMap aparecem juntas numa só linha.",
  },
  fontes("fontes", "Fontes gerais da rota"),
];

/* ---------------- Página Rotas ---------------- */

const texto = (
  chave: string, etiqueta: string, extra: { largura?: "meia" | "inteira"; ajuda?: string; placeholder?: string } = {},
): CampoEsquema => ({
  tipo: "texto", chave, etiqueta, ...extra,
});
const area = (chave: string, etiqueta: string, linhas = 3, ajuda?: string): CampoEsquema => ({ tipo: "area", chave, etiqueta, linhas, ajuda });

const AJUDA_N = "Escreva {n} onde quer o número de rotas: é contado sozinho.";

export const ESQUEMA_PAGINA_ENTRADA: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "abertura", etiqueta: "Abertura", ajuda: "A fotografia grande e o texto do topo de /rotas.",
    campos: [
      { tipo: "imagem", chave: "foto", etiqueta: "Fotografia de fundo" },
      texto("sobretitulo", "Sobretítulo", { largura: "meia" }),
      texto("titulo", "Título", { largura: "meia" }),
      area("texto", "Texto", 3, AJUDA_N),
    ],
  },
  {
    tipo: "objecto", chave: "lista", etiqueta: "Lista das rotas",
    campos: [
      texto("titulo", "Título", { ajuda: AJUDA_N }),
      area("nota", "Nota por baixo dos cartões", 3),
    ],
  },
  {
    tipo: "objecto", chave: "emGrupo", etiqueta: "Quadro \"Melhor em grupo\"", ajuda: "Perto do fim da página, com o botão para os clubes.",
    campos: [
      texto("titulo", "Título", { largura: "meia" }),
      texto("botao", "Texto do botão", { largura: "meia" }),
      area("texto", "Texto", 2),
      texto("ligacao", "O botão leva a", { ajuda: "Uma página do site (ex.: /clubes?tipo=moto-turismo) ou um endereço completo." }),
    ],
  },
  area("notaFinal", "Nota final", 2, "A frase em letra pequena no fim de /rotas."),
  {
    tipo: "objecto", chave: "seo", etiqueta: "No Google e nas partilhas",
    campos: [texto("titulo", "Título da página"), area("descricao", "Descrição", 3)],
  },
];

export const ESQUEMA_PAGINA_QUANDO: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "quandoIr", etiqueta: "Quando ir",
    campos: [
      texto("titulo", "Título"),
      area("texto", "Texto", 4),
      texto("seco", "Etiqueta \"Seco\"", { largura: "meia" }),
      texto("chuva", "Etiqueta \"Chuva\"", { largura: "meia" }),
    ],
  },
  {
    tipo: "lista", chave: "CLIMA_POR_REGIAO", etiqueta: "Regiões", nomeItem: "região",
    ajuda: "Um cartão por região, na secção \"Quando ir\" de /rotas.",
    resumo: (r) => s(r.regiao),
    novo: () => ({ regiao: "", seco: "", chuva: "", nota: "", fonte: { nome: "", url: "" } }),
    campos: [
      texto("regiao", "Região"),
      texto("seco", "Época seca", { largura: "meia" }),
      texto("chuva", "Época das chuvas", { largura: "meia" }),
      area("nota", "Nota", 2),
      fonte("fonte"),
    ],
  },
];

export const ESQUEMA_PAGINA_PLANEAR: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "planear", etiqueta: "Planear uma viagem de mota",
    campos: [texto("titulo", "Título"), area("texto", "Texto", 3), texto("emergencia", "Título do cartão dos números de emergência")],
  },
  {
    tipo: "lista", chave: "CHECKLIST_VIAGEM", etiqueta: "Grupos da lista", nomeItem: "grupo",
    ajuda: "Os cartões numerados de \"Planear uma viagem de mota\".",
    resumo: (g) => s(g.grupo),
    novo: () => ({ grupo: "", itens: [], fontes: [] }),
    campos: [
      texto("grupo", "Título do grupo"),
      { tipo: "lista-texto", chave: "itens", etiqueta: "Pontos da lista", multilinha: true, placeholder: "Novo ponto" },
      fontes(),
    ],
  },
  {
    tipo: "objecto", chave: "regras", etiqueta: "Regras da estrada",
    campos: [texto("titulo", "Título"), area("texto", "Texto", 2)],
  },
  {
    tipo: "lista", chave: "REGRAS_ESTRADA", etiqueta: "Regras", nomeItem: "regra",
    ajuda: "Os cartões numerados de \"Regras da estrada\".",
    resumo: (r) => curto(r.texto),
    novo: () => ({ texto: "", fonte: { nome: "", url: "" } }),
    campos: [area("texto", "Regra", 2), fonte("fonte")],
  },
];

export const ESQUEMA_PAGINA_COMUM: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "EMERGENCIA", etiqueta: "Números de emergência",
    ajuda: "Em /rotas e no quadro \"Emergência\" de cada rota.",
    campos: [
      {
        tipo: "lista", chave: "numeros", etiqueta: "Números", nomeItem: "número",
        resumo: (n) => [s(n.numero), curto(n.servico, 60)].filter(Boolean).join(" · "),
        novo: () => ({ numero: "", servico: "" }),
        campos: [
          { tipo: "telefone", chave: "numero", etiqueta: "Número", largura: "meia", ajuda: "Carregar no número liga para ele no telemóvel." },
          texto("servico", "Para quê", { largura: "meia" }),
        ],
      },
      { tipo: "lista-texto", chave: "notas", etiqueta: "Notas", multilinha: true, placeholder: "Nova nota", ajuda: "Só nas páginas de cada rota, por baixo dos números." },
      fontes(),
    ],
  },
  factos("DOCUMENTOS", "Documentos", "O quadro \"Documentos\" de todas as rotas.", "documento"),
  facto("REDE_GERAL", "Rede móvel no país", "Vem no fim do quadro \"Rede móvel\" de todas as rotas."),
  facto("PRECO_COMBUSTIVEL", "Preço do combustível", "Vem no fim do quadro \"Combustível\" de todas as rotas."),
  {
    tipo: "lista-texto", chave: "LEVAR_BASE", etiqueta: "Em qualquer viagem", placeholder: "Novo ponto",
    ajuda: "A lista \"Em qualquer viagem\" de todas as rotas.",
  },
];

/** Textos fixos da página de cada rota (o objecto "detalhe"). */
export const ESQUEMA_PAGINA_DETALHE: CampoEsquema[] = [
  {
    tipo: "nota",
    texto: "Estes textos são iguais em todas as páginas de rota. O que é de cada rota edita-se no separador \"Rotas\".",
  },
  {
    tipo: "objecto", chave: "detalhe", etiqueta: "Página de cada rota",
    campos: [
      {
        tipo: "objecto", chave: "seo", etiqueta: "No Google e nas partilhas",
        ajuda: "Pode usar {nome}, {resumo}, {km} e {tempo}: trocam-se pelos de cada rota.",
        campos: [texto("titulo", "Título"), area("descricao", "Descrição", 2)],
      },
      {
        tipo: "objecto", chave: "menu", etiqueta: "Menu do topo",
        campos: [
          texto("mapa", "Mapa", { largura: "meia" }), texto("itinerario", "Itinerário", { largura: "meia" }),
          texto("horario", "Horário", { largura: "meia" }), texto("pratico", "Informação prática", { largura: "meia" }),
          texto("clima", "Clima e luz", { largura: "meia" }), texto("levar", "O que levar", { largura: "meia" }),
          texto("fotografias", "Fotografias", { largura: "meia" }), texto("fontes", "Fontes", { largura: "meia" }),
        ],
      },
      texto("botaoMapa", "Botão do Google Maps", { largura: "meia" }),
      texto("botaoGpx", "Botão do GPX", { largura: "meia" }),
      {
        tipo: "objecto", chave: "numeros", etiqueta: "Números do topo",
        campos: [
          texto("distancia", "Por baixo da distância", { largura: "meia" }), texto("rodar", "Por baixo do tempo", { largura: "meia" }),
          texto("dia", "Por baixo de 1 dia", { largura: "meia" }), texto("dias", "Por baixo de vários dias", { largura: "meia" }),
          texto("exigencia", "Por baixo da exigência", { largura: "meia" }), texto("piso", "Por baixo do piso", { largura: "meia" }),
          texto("epoca", "Por baixo da melhor época", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "ficha", etiqueta: "Ficha da rota e quadros ao lado",
        campos: [
          texto("titulo", "Título da ficha", { largura: "meia" }), texto("regiao", "Região", { largura: "meia" }),
          texto("partida", "Partida", { largura: "meia" }), texto("piso", "Piso", { largura: "meia" }),
          texto("exigencia", "Exigência", { largura: "meia" }), texto("oPiso", "O piso", { largura: "meia" }),
          texto("melhorEpoca", "Melhor época", { largura: "meia" }), texto("quantosDias", "Quantos dias", { largura: "meia" }),
          texto("clubes", "Clubes na região", { largura: "meia" }), texto("oQueVer", "O que ver", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "mapa", etiqueta: "Mapa",
        campos: [
          texto("titulo", "Título"), area("texto", "Texto", 2), area("nota", "Nota por baixo do mapa", 4),
          texto("total", "Por baixo da distância", { largura: "meia" }), texto("rodar", "Por baixo do tempo de mota", { largura: "meia" }),
          texto("carro", "Por baixo do tempo de carro", { largura: "meia" }), texto("subida", "Por baixo da subida", { largura: "meia" }),
          texto("maxima", "Por baixo da altitude máxima", { largura: "meia" }), texto("minima", "Por baixo da altitude mínima", { largura: "meia" }),
          area("metodo", "Como calculamos", 4, "Explica de onde vêm as distâncias, os tempos e as altitudes."),
        ],
      },
      {
        tipo: "objecto", chave: "estrada", etiqueta: "Estado da estrada",
        campos: [
          texto("titulo", "Título"),
          area("texto", "Texto", 2, "{quando} troca-se pela data dos relatos de cada rota."),
          texto("ligacao", "Ligação para contar como está"),
        ],
      },
      {
        tipo: "objecto", chave: "itinerario", etiqueta: "Itinerário",
        campos: [
          texto("titulo", "Título", { largura: "meia" }), texto("dia", "\"Dia\" (antes do número)", { largura: "meia" }),
          texto("peloCaminho", "\"Pelo caminho\"", { largura: "meia" }), texto("coordenadas", "Coordenadas das paragens", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "horario", etiqueta: "Horário",
        campos: [
          texto("titulo", "Título"), area("texto", "Texto", 3), texto("luz", "\"Luz do dia\"", { largura: "meia" }),
          texto("nota", "Nota (antes da ligação para Clima e luz)", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "pratico", etiqueta: "Informação prática",
        campos: [
          texto("titulo", "Título"),
          texto("combustivel", "Combustível", { largura: "meia" }), texto("semCombustivel", "Maior troço sem combustível", { largura: "meia" }),
          texto("emergencia", "Emergência", { largura: "meia" }), texto("comer", "Onde comer", { largura: "meia" }),
          texto("dormir", "Onde dormir", { largura: "meia" }), texto("saude", "Hospital mais próximo", { largura: "meia" }),
          texto("perigos", "Perigos na estrada", { largura: "meia" }), texto("rede", "Rede móvel", { largura: "meia" }),
          texto("documentos", "Documentos", { largura: "meia" }), texto("licencas", "Licenças e entradas", { largura: "meia" }),
          texto("motas", "A mota certa", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "clima", etiqueta: "Clima e luz",
        campos: [
          texto("titulo", "Título", { ajuda: "Segue-se o nome da cidade." }), area("texto", "Texto", 2),
          area("nota", "Nota por baixo da tabela", 3, "Vem a seguir à nota da cidade."),
          texto("maxima", "Linha da máxima", { largura: "meia" }), texto("minima", "Linha da mínima", { largura: "meia" }),
          texto("chuva", "Linha da chuva", { largura: "meia" }), texto("nascer", "Linha do nascer do sol", { largura: "meia" }),
          texto("por", "Linha do pôr do sol", { largura: "meia" }), texto("pontos", "Título dos pontos de interesse", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "levar", etiqueta: "O que levar",
        campos: [
          texto("titulo", "Título"), texto("agua", "Água e comida", { largura: "meia" }), texto("grupo", "Sozinho ou em grupo", { largura: "meia" }),
          texto("rota", "Para esta rota", { largura: "meia" }), texto("sempre", "Em qualquer viagem", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "fotografias", etiqueta: "Fotografias",
        campos: [texto("titulo", "Título"), area("texto", "Texto", 2)],
      },
      {
        tipo: "objecto", chave: "dicas", etiqueta: "Dicas e distâncias",
        campos: [
          texto("titulo", "Título das dicas"), texto("distancias", "Título das distâncias publicadas"),
          area("distanciasNota", "Nota das distâncias", 2),
        ],
      },
      {
        tipo: "objecto", chave: "correccao", etiqueta: "Quadro \"Enviar uma correcção\"",
        campos: [texto("titulo", "Título"), area("texto", "Texto", 2), texto("botao", "Texto do botão")],
      },
      {
        tipo: "objecto", chave: "fontes", etiqueta: "Fontes",
        campos: [texto("titulo", "Título"), area("nota", "Nota final", 4)],
      },
      {
        tipo: "objecto", chave: "outras", etiqueta: "Outras rotas",
        campos: [texto("titulo", "Título", { largura: "meia" }), texto("todas", "Ligação para todas", { largura: "meia" })],
      },
    ],
  },
];

/** Textos fixos do guia em PDF de cada rota (o objecto "guia"). */
export const ESQUEMA_PAGINA_GUIA: CampoEsquema[] = [
  {
    tipo: "nota",
    texto:
      "Cada rota tem um guia em PDF, para imprimir ou levar no telemóvel: capa com os números e os códigos QR, estado da estrada, percurso, itinerário, paragens com coordenadas, horário, informação prática, o que levar (com quadrados para marcar), clima, regras, dicas e fontes. O que é de cada rota vem do separador \"Rotas\" e o comum (emergência, documentos, regras, clima) das outras partes desta página; aqui ficam os títulos e as legendas, iguais em todos os guias.",
  },
  {
    tipo: "objecto", chave: "guia", etiqueta: "Guia em PDF",
    campos: [
      texto("botao", "Botão na página da rota", { largura: "meia", ajuda: "Ao lado de \"Descarregar GPX\". Em branco, o botão não aparece." }),
      texto("titulo", "Nome do documento", { largura: "meia", ajuda: "No topo da capa e no cabeçalho de cada página." }),
      texto("rodape", "Rodapé", { ajuda: "Em todas as páginas. {site} troca-se pelo endereço do site e {data} pelo dia em que o guia foi gerado." }),
      texto("pagina", "Número da página", { largura: "meia", ajuda: "{n} é a página e {total} o número de páginas." }),
      {
        tipo: "objecto", chave: "capa", etiqueta: "Capa",
        campos: [
          texto("rota", "Número da rota", { largura: "meia", ajuda: "{n} troca-se pela posição da rota (01, 02…)." }),
          texto("emergencia", "Faixa da emergência", { largura: "meia" }),
          texto("distancia", "Por baixo da distância", { largura: "meia" }), texto("rodar", "Por baixo do tempo", { largura: "meia" }),
          texto("dia", "Por baixo de 1 dia", { largura: "meia" }), texto("dias", "Por baixo de vários dias", { largura: "meia" }),
          texto("exigencia", "Por baixo da exigência", { largura: "meia" }), texto("piso", "Por baixo do piso", { largura: "meia" }),
          texto("epoca", "Por baixo da melhor época", { largura: "meia" }), texto("partida", "Partida", { largura: "meia" }),
          texto("oPiso", "O piso", { largura: "meia" }), texto("porque", "Porquê esta exigência", { largura: "meia" }),
          texto("melhorEpoca", "Melhor época", { largura: "meia" }), texto("quantosDias", "Quantos dias", { largura: "meia" }),
          texto("qrPagina", "Código QR da página: título", { largura: "meia" }),
          texto("qrMapa", "Código QR da navegação: título", { largura: "meia" }),
          area("qrPaginaTexto", "Código QR da página: texto", 2),
          area("qrMapaTexto", "Código QR da navegação: texto", 2),
          texto("mapa", "Ligação do Google Maps", { largura: "meia" }), texto("gpx", "Ligação do GPX", { largura: "meia" }),
          area("gpxTexto", "Texto do GPX", 2),
          area("offline", "Nota no fim da capa", 2),
        ],
      },
      {
        tipo: "objecto", chave: "estrada", etiqueta: "Estado da estrada",
        campos: [
          texto("titulo", "Título"),
          area("texto", "Texto", 2, "{quando} troca-se pela data dos relatos de cada rota."),
          texto("boa", "Estado \"Boa\"", { largura: "meia" }), texto("irregular", "Estado \"Irregular\"", { largura: "meia" }),
          texto("ma", "Estado \"Má\"", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "mapa", etiqueta: "O percurso (esquema)",
        campos: [
          texto("titulo", "Título"),
          texto("norte", "Letra do norte", { largura: "meia" }), texto("escala", "\"Escala\"", { largura: "meia" }),
          area("nota", "Nota por baixo do esquema", 2),
        ],
      },
      {
        tipo: "objecto", chave: "itinerario", etiqueta: "Itinerário",
        campos: [
          texto("titulo", "Título", { largura: "meia" }), texto("dia", "\"Dia\" (antes do número)", { largura: "meia" }),
          texto("estrada", "\"Estrada\"", { largura: "meia" }), texto("peloCaminho", "\"Pelo caminho\"", { largura: "meia" }),
          texto("aviso", "Antes de cada aviso", { largura: "meia" }),
          texto("abrirDia", "Ligação de cada dia", { largura: "meia", ajuda: "{n} é o número do dia." }),
          texto("total", "Por baixo da distância", { largura: "meia" }), texto("rodar", "Por baixo do tempo de mota", { largura: "meia" }),
          texto("carro", "Por baixo do tempo de carro", { largura: "meia" }), texto("subida", "Por baixo da subida", { largura: "meia" }),
          texto("maxima", "Por baixo da altitude máxima", { largura: "meia" }), texto("minima", "Por baixo da altitude mínima", { largura: "meia" }),
          area("metodo", "Como calculamos", 4),
        ],
      },
      {
        tipo: "objecto", chave: "pisos", etiqueta: "Nomes do piso de cada troço",
        campos: [
          texto("asfalto", "Asfalto", { largura: "meia" }), texto("buracos", "Asfalto com buracos", { largura: "meia" }),
          texto("terra", "Terra", { largura: "meia" }), texto("areia", "Areia", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "paragens", etiqueta: "Paragens e coordenadas",
        campos: [
          texto("titulo", "Título"), area("texto", "Texto", 2),
          texto("paragem", "Coluna do nome", { largura: "meia" }), texto("coordenadas", "Coluna das coordenadas", { largura: "meia" }),
          texto("altitude", "Coluna da altitude", { largura: "meia" }), texto("nota", "Coluna da nota", { largura: "meia" }),
          texto("pontos", "Título dos pontos de interesse", { largura: "meia" }),
          texto("lugar", "Coluna do nome do ponto de interesse", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "horario", etiqueta: "Horário",
        campos: [
          texto("titulo", "Título"), area("texto", "Texto", 3),
          texto("luz", "Luz do dia", { largura: "meia", ajuda: "{cidade} troca-se pela cidade do clima da rota." }),
          texto("luzNota", "Nota da luz do dia", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "pratico", etiqueta: "Informação prática",
        campos: [
          texto("titulo", "Título"),
          texto("combustivel", "Combustível", { largura: "meia" }), texto("semCombustivel", "Maior troço sem combustível", { largura: "meia" }),
          texto("emergencia", "Emergência", { largura: "meia" }),
          texto("contactos", "Quadro para escrever contactos", { largura: "meia", ajuda: "Em branco, o quadro não aparece." }),
          texto("contactosTexto", "Texto do quadro dos contactos"),
          texto("comer", "Onde comer", { largura: "meia" }), texto("dormir", "Onde dormir", { largura: "meia" }),
          texto("saude", "Hospital mais próximo", { largura: "meia" }), texto("perigos", "Perigos na estrada", { largura: "meia" }),
          texto("rede", "Rede móvel", { largura: "meia" }), texto("documentos", "Documentos", { largura: "meia" }),
          texto("licencas", "Licenças e entradas", { largura: "meia" }), texto("motas", "A mota certa", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "levar", etiqueta: "O que levar",
        campos: [
          texto("titulo", "Título", { largura: "meia" }), texto("texto", "Texto", { largura: "meia" }),
          texto("rota", "Para esta rota", { largura: "meia" }), texto("sempre", "Em qualquer viagem", { largura: "meia" }),
          texto("agua", "Água e comida", { largura: "meia" }), texto("grupo", "Sozinho ou em grupo", { largura: "meia" }),
        ],
      },
      {
        tipo: "objecto", chave: "clima", etiqueta: "Clima e luz",
        campos: [
          texto("titulo", "Título", { ajuda: "{cidade} troca-se pela cidade do clima da rota." }),
          area("nota", "Nota por baixo da tabela", 3, "Vem a seguir à nota da cidade."),
          texto("maxima", "Linha da máxima", { largura: "meia" }), texto("minima", "Linha da mínima", { largura: "meia" }),
          texto("chuva", "Linha da chuva", { largura: "meia" }), texto("nascer", "Linha do nascer do sol", { largura: "meia" }),
          texto("por", "Linha do pôr do sol", { largura: "meia" }),
          {
            tipo: "lista-texto", chave: "meses", etiqueta: "Meses", placeholder: "Ex.: Jan",
            ajuda: "Os doze meses, em curto, de Janeiro a Dezembro. Com outro número de linhas, valem os de origem.",
          },
        ],
      },
      {
        tipo: "objecto", chave: "regras", etiqueta: "Regras da estrada", ajuda: "As regras são as de \"Planear e regras\".",
        campos: [texto("titulo", "Título")],
      },
      { tipo: "objecto", chave: "dicas", etiqueta: "Dicas", campos: [texto("titulo", "Título")] },
      {
        tipo: "objecto", chave: "fontes", etiqueta: "Fontes",
        campos: [texto("titulo", "Título"), area("texto", "Texto", 2), area("nota", "Nota final", 3)],
      },
    ],
  },
];
