"use client";

/* ============================================================
   MOTOBOX ADMIN — Editor do guia de Segurança ("paginas.seguranca")
   O texto é bilingue ({ pt, en }), como app/seguranca/conteudo.ts
   (o texto de partida). A página mostra o português; o inglês
   fica guardado para a versão inglesa.
   ============================================================ */

import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";
import { caixa, em, type AbaEsquema } from "./partes";

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
        em("UI", [bi("nestaPagina", "Título da navegação")]),
        NOMES_SECCOES,
      ], "Os nomes aparecem nos botões da navegação e por cima de cada secção numerada."),
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
      em("CAPACETE", [
        {
          tipo: "lista", chave: "grupos", etiqueta: "Caixas de conselhos", nomeItem: "caixa",
          ajuda: "Três lado a lado nos ecrãs largos (hoje: Escolher, Usar, Trocar).",
          resumo: (g) => pt(g.titulo),
          novo: () => ({ titulo: { pt: "", en: "" }, itens: [] }),
          campos: [bi("titulo", "Título"), listaBi("itens", "Conselhos")],
        },
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
    ],
  },
  {
    chave: "visibilidade",
    nome: "03 Ver e ser visto",
    esquema: [
      em("VISIBILIDADE", [...tituloLead, listaBi("dicas", "Conselhos")]),
      foto("visibilidade", "Fotografia ao lado"),
    ],
  },
  {
    chave: "equipamento",
    nome: "04 Equipamento",
    esquema: [
      em("EQUIPAMENTO", [
        ...tituloLead,
        bi("estudo", "Fonte dos números", false, "Aparece por baixo de cada número."),
        {
          tipo: "lista", chave: "numeros", etiqueta: "Números", nomeItem: "número",
          resumo: (n) => `${String(n.valor ?? "")} ${pt(n.texto)}`.trim(),
          novo: () => ({ valor: "", texto: { pt: "", en: "" } }),
          campos: [{ tipo: "texto", chave: "valor", etiqueta: "Número", largura: "meia" }, bi("texto", "Legenda")],
        },
        {
          tipo: "lista", chave: "pecas", etiqueta: "Peças de equipamento", nomeItem: "peça",
          resumo: (p) => pt(p.nome),
          novo: () => ({ nome: { pt: "", en: "" }, texto: { pt: "", en: "" } }),
          campos: [bi("nome", "Nome"), bi("texto", "Texto", true)],
        },
        bi("etiquetas", "Nota sobre as etiquetas e normas", true),
      ]),
    ],
  },
  {
    chave: "passageiros",
    nome: "05 Passageiros",
    esquema: [em("PASSAGEIROS", [...tituloLead, ...lei, listaBi("dicas", "Conselhos")])],
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
          bi("diagramaDescricao", "Descrição do esquema", true, "Lida em voz alta a quem não vê o desenho."),
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
          bi("numeroTexto", "Texto", true),
          bi("numeroDica", "Dica pequena", true),
        ]),
        {
          tipo: "lista", chave: "passos", etiqueta: "Passos", nomeItem: "passo",
          resumo: (p) => pt(p.nome),
          novo: () => ({ nome: { pt: "", en: "" }, itens: [] }),
          campos: [bi("nome", "Nome do passo"), listaBi("itens", "O que fazer", "conselho")],
        },
        bi("extra", "Nota final", true),
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
    chave: "fontes",
    nome: "Fontes e aviso",
    esquema: [
      em("UI", [
        bi("fontesTitulo", "Título das fontes"),
        bi("fontesSub", "Texto por baixo", true),
        bi("fonte", "Palavra \"Fonte\"", false, "Usada nos números: \"Fonte: OMS\"."),
      ]),
      {
        tipo: "lista", chave: "FONTES", etiqueta: "Fontes", nomeItem: "fonte",
        ajuda: "Numeradas pela ordem da lista.",
        resumo: (f) => pt(f.nome),
        novo: () => ({ nome: { pt: "", en: "" }, url: "" }),
        campos: [bi("nome", "Nome", true), { tipo: "url", chave: "url", etiqueta: "Endereço", placeholder: "https://…" }],
      },
      em("UI", [bi("aviso", "Aviso no fim da página", true)]),
    ],
  },
];
