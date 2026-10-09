"use client";

/* ============================================================
   MOTOBOX ADMIN — Editor do guia "Importar do estrangeiro"
   ("paginas.marketplace-importar"). Bilingue ({ pt, en }), como
   app/marketplace/importar/conteudo.ts (o texto de partida): o
   site mostra a língua que o visitante escolheu.
   ============================================================ */

import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";
import { caixa, em, numerosFontes, type AbaEsquema } from "./partes";

const pt = (v: unknown) => (typeof v === "object" && v ? String((v as Valor).pt ?? "") : typeof v === "string" ? v : "");

const bi = (chave: string, etiqueta: string, area = false, ajuda?: string): CampoEsquema =>
  ({ tipo: "bi", chave, etiqueta, area, ajuda });

const vazioBi = () => ({ pt: "", en: "" });

export const ABAS_IMPORTAR: AbaEsquema[] = [
  {
    chave: "abertura",
    nome: "Abertura",
    descricao: "O topo da página. O português e o inglês aparecem conforme a língua escolhida por quem visita.",
    esquema: [
      em("TEXTO", [
        bi("eyebrow", "Linha pequena por cima do título"),
        bi("titulo", "Título"),
        bi("sub", "Texto", true),
        bi("pedir", "Botão vermelho", false, "Leva ao formulário do pedido, no fim da página."),
        bi("ondeProcurar", "Segundo botão", false, "Leva à secção \"Onde procurar\"."),
        bi("voltar", "Ligação de volta ao Marketplace"),
      ]),
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
    chave: "como",
    nome: "Como funciona",
    esquema: [
      em("TEXTO", [bi("comoTitulo", "Título da secção")]),
      {
        tipo: "lista", chave: "PASSOS", etiqueta: "Passos", nomeItem: "passo",
        ajuda: "Numerados pela ordem; cinco cabem numa linha nos ecrãs largos.",
        resumo: (p) => pt(p.titulo),
        novo: () => ({ titulo: vazioBi(), texto: vazioBi() }),
        campos: [bi("titulo", "Título"), bi("texto", "Texto", true)],
      },
      caixa("Aviso em vermelho claro", [em("TEXTO", [bi("arranque", "Título"), bi("arranqueTexto", "Texto", true)])]),
    ],
  },
  {
    chave: "oque",
    nome: "O que pode importar",
    esquema: [
      em("TEXTO", [bi("oQueTitulo", "Título da secção")]),
      {
        tipo: "lista", chave: "CATEGORIAS", etiqueta: "Categorias", nomeItem: "categoria",
        resumo: (c) => pt(c.nome),
        novo: () => ({ nome: vazioBi(), texto: vazioBi() }),
        campos: [
          bi("nome", "Nome"),
          bi("texto", "Texto", true),
          {
            tipo: "objecto", chave: "ligacao", etiqueta: "Ligação (opcional)",
            ajuda: "Uma ligação a vermelho por baixo do texto. Sem endereço, não aparece.",
            campos: [
              { tipo: "texto", chave: "href", etiqueta: "Para onde leva", placeholder: "/seguranca#capacete" },
              bi("texto", "Texto da ligação"),
            ],
          },
        ],
      },
    ],
  },
  {
    chave: "regras",
    nome: "Antes de comprar",
    esquema: [
      em("TEXTO", [bi("regrasTitulo", "Título da secção"), bi("regrasSub", "Texto por baixo", true)]),
      {
        tipo: "lista", chave: "REGRAS", etiqueta: "Regras", nomeItem: "regra",
        resumo: (r) => pt(r.titulo),
        novo: () => ({ titulo: vazioBi(), texto: vazioBi() }),
        campos: [bi("titulo", "Título"), bi("texto", "Texto", true), numerosFontes("fonte")],
      },
      em("TEXTO", [bi("despachante", "Nota final, com o escudo", true)]),
    ],
  },
  {
    chave: "onde",
    nome: "Onde procurar",
    descricao: "Sítios onde a comunidade procura. Não são parceiros: a página diz isso mesmo.",
    esquema: [
      em("TEXTO", [
        bi("ondeTitulo", "Título da secção"),
        bi("ondeSub", "Texto por baixo", true),
        bi("classificadosAviso", "Aviso dos classificados", true, "Aparece por baixo dos grupos marcados como classificados."),
      ]),
      {
        tipo: "lista", chave: "ONDE_PROCURAR", etiqueta: "Grupos de sítios", nomeItem: "grupo",
        resumo: (g) => pt(g.grupo),
        novo: () => ({ grupo: vazioBi(), classificados: false, sitios: [] }),
        campos: [
          bi("grupo", "Nome do grupo"),
          { tipo: "booleano", chave: "classificados", etiqueta: "São classificados entre particulares", descricao: "Mostra o aviso dos classificados por baixo do nome do grupo." },
          {
            tipo: "lista", chave: "sitios", etiqueta: "Sítios", nomeItem: "sítio",
            resumo: (s) => String(s.nome ?? ""),
            novo: () => ({ nome: "", url: "", pais: vazioBi(), texto: vazioBi() }),
            campos: [
              { tipo: "texto", chave: "nome", etiqueta: "Nome", largura: "meia" },
              { tipo: "url", chave: "url", etiqueta: "Endereço", largura: "meia", placeholder: "https://…" },
              bi("pais", "País"),
              bi("texto", "Texto", true),
            ],
          },
        ],
      },
    ],
  },
  {
    chave: "pagamento",
    nome: "Pagamento",
    esquema: [
      em("TEXTO", [
        bi("pagamentoTitulo", "Título da secção"),
        caixa("Primeira coluna", [bi("emKwanzas", "Título"), bi("emKwanzasTexto", "Texto", true)]),
        caixa("Segunda coluna", [
          bi("carteiras", "Título"),
          bi("emEstudo", "Etiqueta ao lado do título"),
          bi("carteirasTexto", "Texto", true),
          numerosFontes("carteirasFontes"),
        ]),
      ]),
    ],
  },
  {
    chave: "pedido",
    nome: "Pedido",
    descricao: "A caixa do formulário \"Pedir importação\". Os tipos de artigo e as províncias da lista são fixos, porque o pedido é verificado com eles.",
    esquema: [
      em("TEXTO", [
        bi("formTitulo", "Título"),
        bi("formSub", "Texto", true),
        { tipo: "lista-bi", chave: "formDicas", etiqueta: "Dicas com visto", nomeItem: "dica", area: true },
      ]),
      em("FORM", [
        caixa("Campos", [
          bi("ligacao", "Ligação para o artigo"), bi("ligacaoPh", "Exemplo dentro do campo"),
          bi("titulo", "O que é"), bi("tituloPh", "Exemplo dentro do campo"),
          bi("categoria", "Tipo"), bi("quantidade", "Quantidade"),
          bi("nome", "Nome"), bi("nomePh", "Exemplo dentro do campo"),
          bi("email", "Email"), bi("emailPh", "Exemplo dentro do campo"),
          bi("telefone", "Telemóvel"), bi("telefonePh", "Exemplo dentro do campo"),
          bi("provincia", "Província de entrega"), bi("escolha", "Primeira opção da lista"),
          bi("notas", "Notas"), bi("notasPh", "Exemplo dentro do campo", true),
          bi("opcional", "Marca dos campos opcionais"),
        ]),
        caixa("Botão e avisos", [
          bi("enviar", "Botão"), bi("aEnviar", "Enquanto envia"),
          bi("sessaoNota", "Nota para quem não entrou na conta", true),
          bi("motivo", "Texto da janela \"Entre para continuar\"", true),
          bi("privacidade", "Nota para quem já entrou", true),
          bi("erroGeral", "Falha ao enviar"), bi("semLigacao", "Sem internet"),
        ]),
        caixa("Depois de enviar", [
          bi("sucessoTitulo", "Título"),
          bi("sucessoTexto", "Texto", true, "{nome} é trocado pelo primeiro nome de quem pediu e {email} pelo seu email."),
          bi("outro", "Botão para fazer outro pedido"),
        ]),
      ]),
    ],
  },
  {
    chave: "fontes",
    nome: "Fontes",
    esquema: [
      em("TEXTO", [bi("fontesTitulo", "Título das fontes")]),
      {
        tipo: "lista", chave: "FONTES", etiqueta: "Fontes", nomeItem: "fonte",
        ajuda: "O número é o que as regras citam entre parênteses rectos, ex.: [3].",
        resumo: (f) => `[${String(f.n ?? "")}] ${pt(f.nome)}`,
        novo: () => ({ n: null, nome: vazioBi(), url: "" }),
        campos: [
          { tipo: "numero", chave: "n", etiqueta: "Número", largura: "meia", min: 1, passo: 1 },
          { tipo: "url", chave: "url", etiqueta: "Endereço", largura: "meia", placeholder: "https://…" },
          bi("nome", "Nome", true),
        ],
      },
    ],
  },
];
