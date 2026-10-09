"use client";

/* ============================================================
   MOTOBOX ADMIN — Editor do guia de Segurança ("paginas.seguranca")
   O texto é bilingue ({ pt, en }), como app/seguranca/conteudo.ts
   (o texto de partida). A página mostra o português; o inglês
   fica guardado para a versão inglesa.
   ============================================================ */

import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";
import { caixa, em, numerosFontes, type AbaEsquema } from "./partes";

const pt = (v: unknown) => (typeof v === "string" ? v : typeof v === "object" && v ? String((v as Valor).pt ?? "") : "");

/** Os nomes de partida das 11 secções, pela ordem da página (a ordem e as âncoras não mudam). */
const SECCOES_FIXAS: [string, string][] = [
  ["capacete", "Capacete"], ["chuva", "À chuva"], ["visibilidade", "Ver e ser visto"],
  ["equipamento", "Equipamento"], ["passageiros", "Passageiros"], ["cabeca", "Cabeça fria"],
  ["verificacao", "Antes de sair"], ["grupo", "Em grupo"], ["acidente", "Em caso de acidente"],
  ["seguro", "Seguro"], ["historias", "Histórias"],
];

/** Nomes das secções: um campo por secção, sem poder juntar nem tirar (a página tem uma por número). */
const NOMES_SECCOES: CampoEsquema = {
  tipo: "personalizado", chave: "SECCOES", etiqueta: "Nomes das secções",
  render: (v, mudar) => {
    const lista = Array.isArray(v) ? (v as Valor[]) : [];
    const porId: Valor = Object.fromEntries(SECCOES_FIXAS.map(([id]) => [id, lista.find((s) => s.id === id)?.nome ?? { pt: "", en: "" }]));
    return (
      <Formulario
        esquema={SECCOES_FIXAS.map(([id, nome], i) => ({
          tipo: "bi", chave: id, etiqueta: `${String(i + 1).padStart(2, "0")} · ${nome}`,
        }))}
        valor={porId}
        onChange={(o) => mudar(SECCOES_FIXAS.map(([id]) => ({ id, nome: o[id] })))}
      />
    );
  },
};

const bi = (chave: string, etiqueta: string, area = false, ajuda?: string): CampoEsquema =>
  ({ tipo: "bi", chave, etiqueta, area, ajuda });

const listaBi = (chave: string, etiqueta: string, nomeItem = "conselho", ajuda?: string): CampoEsquema =>
  ({ tipo: "lista-bi", chave, etiqueta, area: true, nomeItem, ajuda });

const tituloLead = [bi("titulo", "Título"), bi("lead", "Texto de abertura", true)];

const fontesDe = (ajuda?: string) => numerosFontes("fontes", "Fontes citadas", ajuda);

/** As partes do desenho do capacete (cada uma tem o seu ponto no desenho). */
const PARTES_CAPACETE = [
  { valor: "calota", nome: "Calota (por fora, em cima)" },
  { valor: "espuma", nome: "Espuma de absorção (no corte, atrás)" },
  { valor: "forro", nome: "Forro de conforto (no corte, por dentro)" },
  { valor: "viseira", nome: "Viseira (à frente)" },
  { valor: "correia", nome: "Correia e fivela (em baixo)" },
  { valor: "etiqueta", nome: "Etiqueta (na correia)" },
];

const ZONAS_CORPO = [
  { valor: "casaco", nome: "Tronco e braços (casaco)" },
  { valor: "luvas", nome: "Mãos (luvas)" },
  { valor: "calcas", nome: "Pernas (calças)" },
  { valor: "botas", nome: "Pés (botas)" },
];

const lei = [
  bi("lei", "Citação da lei", true, "Aparece em destaque, com uma barra vermelha à esquerda."),
  bi("leiFonte", "De onde vem a citação"),
];

const foto = (chave: string, etiqueta: string): CampoEsquema =>
  em("FOTOS", [{ tipo: "imagem", chave, etiqueta, formato: "aspect-[4/3]" }]);

export const ABAS_SEGURANCA: AbaEsquema[] = [
  {
    chave: "abertura",
    nome: "Abertura",
    descricao: "O topo da página, os três números grandes e a navegação \"Nesta página\". O texto em português é o que aparece no site; o inglês fica guardado para a versão inglesa.",
    esquema: [
      caixa("Topo da página", [
        foto("abertura", "Fotografia de fundo"),
        em("UI", [
          bi("eyebrow", "Linha pequena por cima do título"),
          bi("titulo1", "Título, parte branca"),
          bi("titulo2", "Título, parte vermelha"),
          bi("sub", "Texto", true),
          bi("comecar", "Botão vermelho", false, "Leva à secção do capacete."),
        ]),
      ]),
      {
        tipo: "lista", chave: "NUMEROS", etiqueta: "Números grandes", nomeItem: "número",
        ajuda: "Três por linha nos ecrãs largos.",
        resumo: (n) => `${String(n.valor ?? "")} ${pt(n.texto)}`.trim(),
        novo: () => ({ valor: "", texto: { pt: "", en: "" }, fonte: { pt: "", en: "" } }),
        campos: [
          { tipo: "texto", chave: "valor", etiqueta: "Número", largura: "meia", placeholder: "Ex.: 74%" },
          bi("prefixo", "Palavra pequena antes do número (opcional)", false, "Ex.: \"até\"."),
          bi("texto", "Legenda", true),
          bi("fonte", "Fonte", false, "Aparece por baixo como \"Fonte: …\"."),
        ],
      },
      caixa("Navegação \"Nesta página\"", [
        em("UI", [
          bi("nestaPagina", "Título da navegação"),
          bi("capitulos", "Botão da lista de capítulos", false, "Na barra que aparece em cima no telemóvel, ao percorrer a página."),
          bi("capituloDe", "Capítulo, lido em voz alta", false, "{n} é o número do capítulo e {total} quantos há. Ex.: \"Capítulo {n} de {total}\"."),
        ]),
        NOMES_SECCOES,
      ], "Os nomes aparecem nos botões da navegação, no trilho lateral e por cima de cada capítulo."),
      {
        tipo: "objecto", chave: "SEO", etiqueta: "Nas pesquisas e no separador do navegador",
        campos: [
          { tipo: "texto", chave: "titulo", etiqueta: "Título" },
          { tipo: "area", chave: "descricao", etiqueta: "Descrição", linhas: 3 },
        ],
      },
    ],
  },
  {
    chave: "capacete",
    nome: "01 Capacete",
    esquema: [
      em("CAPACETE", [...tituloLead, ...lei]),
      caixa("Fotografia", [
        foto("capacete", "Fotografia do capacete"),
        em("CAPACETE", [bi("fotoLegenda", "Legenda da fotografia", true)]),
      ]),
      caixa("Desenho do capacete", [
        em("CAPACETE", [
          bi("anatomiaTitulo", "Título"),
          bi("anatomiaTexto", "Texto por baixo do título", true),
          bi("anatomiaDescricao", "Descrição do desenho", true, "Lida em voz alta a quem não vê o desenho."),
          bi("anatomiaAnterior", "Botão \"parte anterior\" (lido em voz alta)"),
          bi("anatomiaSeguinte", "Botão \"parte seguinte\""),
          {
            tipo: "lista", chave: "anatomia", etiqueta: "Partes (pontos no desenho)", nomeItem: "parte",
            ajuda: "Cada parte é um ponto numerado no desenho, pela ordem da lista. Use cada parte do desenho uma só vez.",
            resumo: (p) => pt(p.nome),
            novo: () => ({ id: "calota", nome: { pt: "", en: "" }, texto: { pt: "", en: "" }, fontes: [] }),
            campos: [
              { tipo: "seleccao", chave: "id", etiqueta: "Ponto do desenho", opcoes: PARTES_CAPACETE },
              bi("nome", "Nome"),
              bi("texto", "O que faz", true),
              fontesDe(),
            ],
          },
        ]),
      ], "Um capacete visto de lado, com um corte que mostra as camadas. Tocar num ponto mostra o texto dessa parte."),
      // Numa caixa: dois em("CAPACETE") seguidos teriam a mesma chave no formulário.
      caixa("Conselhos por baixo do desenho", [
        em("CAPACETE", [
          {
            tipo: "lista", chave: "grupos", etiqueta: "Separadores de conselhos", nomeItem: "separador",
            ajuda: "Um separador por caixa (hoje: Escolher, Usar, Trocar).",
            resumo: (g) => pt(g.titulo),
            novo: () => ({ titulo: { pt: "", en: "" }, itens: [] }),
            campos: [bi("titulo", "Título"), listaBi("itens", "Conselhos")],
          },
        ]),
      ]),
    ],
  },
  {
    chave: "chuva",
    nome: "02 Chuva",
    esquema: [
      em("CHUVA", [
        ...tituloLead,
        caixa("Caixa vermelha", [
          { tipo: "texto", chave: "numero", etiqueta: "Número grande", largura: "meia", placeholder: "2×" },
          bi("numeroTexto", "Texto"),
          bi("numeroFonte", "Fonte"),
        ]),
        {
          tipo: "lista", chave: "dicas", etiqueta: "Dicas numeradas", nomeItem: "dica",
          resumo: (d) => pt(d.titulo),
          novo: () => ({ titulo: { pt: "", en: "" }, texto: { pt: "", en: "" } }),
          campos: [bi("titulo", "Título"), bi("texto", "Texto", true)],
        },
      ]),
      caixa("Comparação seco / molhado", [
        em("CHUVA", [
          em("travagem", [
            bi("titulo", "Título"),
            bi("texto", "Texto por baixo"),
            bi("velocidade", "Nome do grupo de botões das velocidades (lido em voz alta)"),
            bi("seco", "Barra do piso seco"),
            bi("molhado", "Barra do piso molhado"),
            bi("reaccao", "Parte da barra \"a reagir\""),
            bi("travar", "Parte da barra \"a travar\""),
            bi("noMinimo", "Palavra antes dos metros com chuva", false, "Ex.: \"pelo menos\"."),
            {
              tipo: "lista", chave: "velocidades", etiqueta: "Velocidades", nomeItem: "velocidade",
              ajuda: "Metros da tabela de distâncias típicas do Highway Code (regra 126). Com chuva, a página mostra o dobro do total (o mínimo da regra 227).",
              resumo: (v) => `${String(v.rotulo ?? "")}: ${Number(v.reaccao ?? 0) + Number(v.travagem ?? 0)} m`,
              novo: () => ({ rotulo: "", reaccao: 0, travagem: 0 }),
              campos: [
                { tipo: "texto", chave: "rotulo", etiqueta: "Botão", largura: "meia", placeholder: "Ex.: 80 km/h" },
                { tipo: "numero", chave: "reaccao", etiqueta: "Metros a reagir", largura: "meia", min: 0 },
                { tipo: "numero", chave: "travagem", etiqueta: "Metros a travar", largura: "meia", min: 0 },
              ],
            },
            bi("nota", "Nota sobre os números", true),
            fontesDe(),
          ]),
        ]),
      ], "Escolhe-se uma velocidade e as barras mostram a distância de paragem com o piso seco e com o piso molhado."),
    ],
  },
  {
    chave: "visibilidade",
    nome: "03 Ver e ser visto",
    esquema: [
      em("VISIBILIDADE", [...tituloLead, listaBi("dicas", "Conselhos")]),
      caixa("Cena: o que vê quem vem atrás", [
        em("VISIBILIDADE", [
          em("cena", [
            bi("titulo", "Título"),
            bi("dia", "Botão \"Dia\""),
            bi("noite", "Botão \"Noite\""),
            bi("escuro", "Botão da roupa escura"),
            bi("visivel", "Botão da roupa visível"),
            bi("diaEscuro", "Legenda: dia, roupa escura", true),
            bi("diaVisivel", "Legenda: dia, roupa visível", true),
            bi("noiteEscuro", "Legenda: noite, roupa escura", true),
            bi("noiteVisivel", "Legenda: noite, roupa visível", true),
            bi("nota", "Nota por baixo", true),
            bi("descricao", "Descrição do desenho", true, "Lida em voz alta, antes da legenda."),
            fontesDe(),
          ]),
        ]),
      ], "Um desenho de uma estrada vista de dentro de um carro. Muda-se a hora e a roupa do motociclista e a legenda acompanha."),
    ],
  },
  {
    chave: "equipamento",
    nome: "04 Equipamento",
    esquema: [
      em("EQUIPAMENTO", [
        ...tituloLead,
        caixa("O motard (desenho)", [
          bi("figuraTitulo", "Título"),
          bi("figuraTexto", "Texto por baixo"),
          bi("figuraDescricao", "Descrição do desenho", true, "Lida em voz alta a quem não vê o desenho."),
          bi("normaRotulo", "Texto antes da norma", false, "Ex.: \"Norma a procurar\"."),
        ]),
        bi("numerosTitulo", "Título dos números"),
        bi("estudo", "Fonte dos números", false, "Aparece por baixo dos números, como \"Fonte: …\"."),
        fontesDe(),
        {
          tipo: "lista", chave: "numeros", etiqueta: "Números", nomeItem: "número",
          ajuda: "A barra de cada número enche até à percentagem (\"−59%\" enche 59%).",
          resumo: (n) => `${String(n.valor ?? "")} ${pt(n.texto)}`.trim(),
          novo: () => ({ valor: "", texto: { pt: "", en: "" } }),
          campos: [{ tipo: "texto", chave: "valor", etiqueta: "Número", largura: "meia" }, bi("texto", "Legenda")],
        },
        {
          tipo: "lista", chave: "pecas", etiqueta: "Peças de equipamento", nomeItem: "peça",
          resumo: (p) => pt(p.nome),
          ajuda: "Cada peça acende a sua zona do desenho.",
          novo: () => ({ nome: { pt: "", en: "" }, zona: "casaco", norma: "", texto: { pt: "", en: "" } }),
          campos: [
            bi("nome", "Nome"),
            { tipo: "seleccao", chave: "zona", etiqueta: "Zona do desenho", largura: "meia", opcoes: ZONAS_CORPO },
            { tipo: "texto", chave: "norma", etiqueta: "Norma (opcional)", largura: "meia", placeholder: "Ex.: EN 13594" },
            bi("texto", "Texto", true),
          ],
        },
        bi("etiquetas", "Nota sobre as etiquetas e normas", true),
      ]),
    ],
  },
  {
    chave: "passageiros",
    nome: "05 Passageiros",
    esquema: [
      em("PASSAGEIROS", [
        ...tituloLead,
        ...lei,
        caixa("Caixa vermelha", [
          em("destaque", [
            { tipo: "texto", chave: "valor", etiqueta: "Número grande", largura: "meia", placeholder: "7", ajuda: "Vazio, a caixa não aparece." },
            bi("unidade", "Palavra ao lado do número"),
            bi("texto", "Texto", true),
          ]),
        ]),
        listaBi("dicas", "Conselhos"),
      ]),
    ],
  },
  {
    chave: "cabeca",
    nome: "06 Cabeça fria",
    esquema: [
      em("CABECA", [
        ...tituloLead,
        {
          tipo: "lista", chave: "temas", etiqueta: "Temas", nomeItem: "tema",
          resumo: (t) => pt(t.titulo),
          novo: () => ({ icone: "eyeOff", titulo: { pt: "", en: "" }, destaque: { pt: "", en: "" }, texto: { pt: "", en: "" } }),
          campos: [
            {
              tipo: "seleccao", chave: "icone", etiqueta: "Ícone", largura: "meia",
              opcoes: [
                { valor: "eyeOff", nome: "Olho riscado" },
                { valor: "trending", nome: "Seta a subir" },
                { valor: "clock", nome: "Relógio" },
                { valor: "fire", nome: "Chama" },
              ],
            },
            bi("titulo", "Título"),
            bi("destaque", "Etiqueta vermelha", false, "Ex.: 0,0 g/l."),
            bi("texto", "Texto", true),
          ],
        },
      ]),
    ],
  },
  {
    chave: "verificacao",
    nome: "07 Antes de sair",
    esquema: [
      em("VERIFICACAO", [
        ...tituloLead,
        {
          tipo: "lista", chave: "itens", etiqueta: "Verificações", nomeItem: "verificação",
          resumo: (i) => `${String(i.letra ?? "")} · ${pt(i.nome)}`,
          novo: () => ({ letra: "", nome: { pt: "", en: "" }, texto: { pt: "", en: "" } }),
          campos: [
            { tipo: "texto", chave: "letra", etiqueta: "Letra grande", largura: "meia", placeholder: "T" },
            bi("nome", "Nome"),
            bi("texto", "Texto", true),
          ],
        },
        caixa("Lista para marcar", [
          bi("progresso", "Progresso", false, "{feitos} e {total} trocam-se pelos números. Ex.: \"{feitos} de {total} verificados\"."),
          bi("falta", "Texto enquanto falta marcar"),
          bi("pronto", "Título quando está tudo marcado"),
          bi("prontoTexto", "Texto quando está tudo marcado"),
          bi("recomecar", "Botão para limpar as marcas"),
          bi("memoria", "Nota sobre onde ficam as marcas", true),
        ], "Cada verificação marca-se com um toque; um anel enche até estar tudo verificado."),
      ]),
    ],
  },
  {
    chave: "grupo",
    nome: "08 Em grupo",
    esquema: [
      em("GRUPO", [
        ...tituloLead,
        listaBi("dicas", "Conselhos"),
        bi("clubes", "Botão para os clubes"),
        caixa("Esquema do ziguezague", [
          bi("diagramaTitulo", "Título"),
          bi("diagramaLider", "Nome da primeira mota"),
          bi("diagramaFecho", "Nome da última mota"),
          bi("diagramaSentido", "Seta do sentido de marcha"),
          bi("modoRecta", "Botão da recta"),
          bi("modoCurva", "Botão das curvas"),
          bi("legendaRecta", "Legenda em recta", true),
          bi("legendaCurva", "Legenda em curvas", true),
          bi("umSegundo", "Distância em recta", false, "Ex.: \"1 s\"."),
          bi("doisSegundos", "Distância em curvas", false, "Ex.: \"2 s\"."),
          bi("diagramaDescricao", "Descrição do esquema em recta", true, "Lida em voz alta a quem não vê o desenho."),
          bi("diagramaDescricaoCurva", "Descrição do esquema em curvas", true, "Lida em voz alta a quem não vê o desenho."),
          bi("diagramaFonte", "Fonte, por baixo do esquema"),
          fontesDe(),
        ]),
      ]),
    ],
  },
  {
    chave: "acidente",
    nome: "09 Acidente",
    esquema: [
      em("ACIDENTE", [
        ...tituloLead,
        caixa("Número de emergência", [
          { tipo: "texto", chave: "numero", etiqueta: "Número", largura: "meia", placeholder: "111", ajuda: "No telemóvel, carregar na caixa liga para este número." },
          bi("ligar", "Botão branco", false, "Ex.: \"Ligar\"."),
          bi("numeroTexto", "Texto", true),
          bi("numeroDica", "Dica pequena", true),
        ]),
        {
          tipo: "lista", chave: "passos", etiqueta: "Passos", nomeItem: "passo",
          resumo: (p) => pt(p.nome),
          novo: () => ({ nome: { pt: "", en: "" }, itens: [] }),
          campos: [bi("nome", "Nome do passo"), listaBi("itens", "O que fazer", "conselho")],
        },
        caixa("Botões dos passos", [
          bi("passoDe", "Passo", false, "{n} e {total} trocam-se pelos números. Ex.: \"Passo {n} de {total}\"."),
          bi("anterior", "Botão do passo anterior"),
          bi("seguinte", "Botão do passo seguinte"),
        ]),
        bi("extra", "Nota final", true),
        fontesDe("Aparecem no fim da nota final."),
      ]),
    ],
  },
  {
    chave: "seguro",
    nome: "10 Seguro",
    esquema: [em("SEGURO", [bi("titulo", "Título"), bi("texto", "Texto", true), listaBi("itens", "Pontos")])],
  },
  {
    chave: "historias",
    nome: "11 Histórias",
    esquema: [
      em("HISTORIAS", [
        bi("titulo", "Título"),
        bi("aviso", "Aviso por baixo do título", true),
        {
          tipo: "lista", chave: "lista", etiqueta: "Histórias", nomeItem: "história",
          resumo: (h) => pt(h.titulo),
          novo: () => ({ titulo: { pt: "", en: "" }, texto: { pt: "", en: "" }, licao: { pt: "", en: "" } }),
          campos: [bi("titulo", "Título"), bi("texto", "História", true), bi("licao", "A lição", true)],
        },
        bi("anterior", "Botão da história anterior (lido em voz alta)"),
        bi("seguinte", "Botão da história seguinte (lido em voz alta)"),
      ]),
      em("UI", [bi("licao", "Palavra antes da lição", false, "Aparece a vermelho: \"A lição: …\".")]),
      caixa("Convite em vermelho", [
        em("HISTORIAS", [
          bi("convite", "Pergunta"),
          bi("conviteTexto", "Texto", true),
          bi("forum", "Botão para o Fórum"),
          bi("contacto", "Botão para escrever à MotoBox"),
        ]),
      ]),
    ],
  },
  {
    chave: "teste",
    nome: "Teste rápido",
    descricao: "\"Sabe o que fazer?\": perguntas sobre a página, uma de cada vez, com a resposta logo a seguir. Fica depois das histórias.",
    esquema: [
      em("QUIZ", [
        bi("titulo", "Título"),
        bi("texto", "Texto por baixo", true),
        {
          tipo: "lista", chave: "perguntas", etiqueta: "Perguntas", nomeItem: "pergunta",
          resumo: (p) => pt(p.pergunta),
          novo: () => ({ pergunta: { pt: "", en: "" }, opcoes: [], certa: 1, explicacao: { pt: "", en: "" }, seccao: "" }),
          campos: [
            bi("pergunta", "Pergunta", true),
            listaBi("opcoes", "Respostas possíveis", "resposta", "Duas a quatro. Aparecem como A, B, C…"),
            { tipo: "numero", chave: "certa", etiqueta: "Resposta certa", largura: "meia", min: 1, max: 6, ajuda: "O número da resposta na lista: 1 é a primeira." },
            {
              tipo: "seleccao", chave: "seccao", etiqueta: "Capítulo para rever", largura: "meia", vazio: "Nenhum",
              opcoes: SECCOES_FIXAS.map(([valor, nome]) => ({ valor, nome })),
            },
            bi("explicacao", "Explicação (aparece depois de responder)", true),
          ],
        },
        caixa("Textos do teste", [
          bi("perguntaDe", "Pergunta", false, "{n} e {total} trocam-se pelos números."),
          bi("certo", "Quando acerta"),
          bi("errado", "Quando falha"),
          bi("seguinte", "Botão da pergunta seguinte"),
          bi("verResultado", "Botão na última pergunta"),
          bi("resultado", "Resultado", false, "{certas} e {total} trocam-se pelos números."),
          bi("resultadoTudo", "Texto quando acerta tudo", true),
          bi("resultadoParte", "Texto quando falha alguma", true),
          bi("rever", "Palavra antes do capítulo a rever", false, "Ex.: \"Rever\" dá \"Rever: Capacete\"."),
          bi("recomecar", "Botão para responder de novo"),
        ]),
      ]),
    ],
  },
  {
    chave: "fontes",
    nome: "Fontes e aviso",
    esquema: [
      em("UI", [
        bi("fontesTitulo", "Título das fontes"),
        bi("fontesSub", "Texto por baixo", true),
        bi("fonte", "Palavra \"Fonte\"", false, "Usada nos números: \"Fonte: OMS\"."),
        bi("verFonte", "Ligação para uma fonte, lida em voz alta", false, "{n} é o número da fonte. Os números aparecem como [4] no texto."),
        bi("abreNovaJanela", "Aviso de que a fonte abre noutra janela (lido em voz alta)"),
      ]),
      {
        tipo: "lista", chave: "FONTES", etiqueta: "Fontes", nomeItem: "fonte",
        ajuda: "Numeradas pela ordem da lista. O texto da página cita-as pelo número (\"Fontes citadas\"): se mudar a ordem, confira esses números.",
        resumo: (f) => pt(f.nome),
        novo: () => ({ nome: { pt: "", en: "" }, url: "" }),
        campos: [bi("nome", "Nome", true), { tipo: "url", chave: "url", etiqueta: "Endereço", placeholder: "https://…" }],
      },
      caixa("Aviso no fim da página", [em("UI", [bi("aviso", "Texto do aviso", true)])]),
    ],
  },
];
