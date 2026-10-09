"use client";

/* ============================================================
   MOTOBOX ADMIN — Editor da página Sobre ("paginas.sobre")
   A forma do documento está em lib/conteudo/grupos/paginas.ts
   (ConteudoSobre); a página é app/sobre/page.tsx.
   ============================================================ */

import { CampoImagem } from "@/components/admin/Media";
import type { CampoEsquema } from "@/components/admin/editor/esquema";
import type { AbaEsquema } from "./partes";

/** Os ícones dos cartões "Porque existimos" (os mesmos nomes de app/sobre/page.tsx). */
export const ICONES_SOBRE = [
  { valor: "bussola", nome: "Bússola" },
  { valor: "coracao", nome: "Aperto de mão com coração" },
  { valor: "biblioteca", nome: "Livros" },
  { valor: "escudo", nome: "Escudo" },
  { valor: "pessoas", nome: "Pessoas" },
  { valor: "estrada", nome: "Estrada" },
  { valor: "camara", nome: "Máquina fotográfica" },
  { valor: "estrela", nome: "Estrela" },
  { valor: "bandeira", nome: "Bandeira" },
  { valor: "livro", nome: "Livro aberto" },
  { valor: "oficina", nome: "Chave inglesa" },
  { valor: "local", nome: "Marcador de mapa" },
];

const NUMEROS_AUTOMATICOS = [
  { valor: "", nome: "Escrito à mão" },
  { valor: "artigos", nome: "Artigos publicados (conta sozinho)" },
  { valor: "clubes", nome: "Clubes e grupos (conta sozinho)" },
  { valor: "rotas", nome: "Rotas (conta sozinho)" },
  { valor: "eventos", nome: "Eventos no calendário (conta sozinho)" },
];

const SEO: CampoEsquema = {
  tipo: "objecto", chave: "seo", etiqueta: "Nas pesquisas e no separador do navegador",
  ajuda: "O título aparece no separador do navegador e no Google; a descrição, por baixo do título nos resultados do Google.",
  campos: [
    { tipo: "texto", chave: "titulo", etiqueta: "Título" },
    { tipo: "area", chave: "descricao", etiqueta: "Descrição", linhas: 3 },
  ],
};

export const ABAS_SOBRE: AbaEsquema[] = [
  {
    chave: "abertura",
    nome: "Abertura",
    descricao: "O topo da página, com a fotografia grande.",
    esquema: [
      {
        tipo: "objecto", chave: "abertura", etiqueta: "Abertura",
        campos: [
          { tipo: "imagem", chave: "foto", etiqueta: "Fotografia de fundo", ajuda: "Larga (pelo menos 1920 px). O texto fica por cima, em baixo à esquerda." },
          { tipo: "texto", chave: "sobretitulo", etiqueta: "Linha pequena por cima do título", largura: "meia" },
          { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
          { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
        ],
      },
      SEO,
    ],
  },
  {
    chave: "historia",
    nome: "Feito por motards e história",
    esquema: [
      {
        tipo: "objecto", chave: "feito", etiqueta: "Feito por motards",
        campos: [
          { tipo: "area", chave: "titulo", etiqueta: "Título", linhas: 2, ajuda: "Uma mudança de linha no título só se nota em ecrãs largos." },
          { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
          {
            tipo: "lista", chave: "fotos", etiqueta: "Três fotografias", nomeItem: "fotografia",
            ajuda: "Aparecem lado a lado; a do meio é a maior. Só as três primeiras se mostram.",
            resumo: (f) => String(f.alt || f.foto || ""),
            novo: () => ({ foto: "", alt: "" }),
            campos: [
              { tipo: "imagem", chave: "foto", etiqueta: "Fotografia", formato: "aspect-[4/3]" },
              { tipo: "texto", chave: "alt", etiqueta: "O que mostra a fotografia", ajuda: "Lido em voz alta a quem não vê a imagem." },
            ],
          },
        ],
      },
      {
        tipo: "objecto", chave: "historia", etiqueta: "A nossa história",
        campos: [
          { tipo: "texto", chave: "titulo", etiqueta: "Título" },
          { tipo: "lista-texto", chave: "paragrafos", etiqueta: "Parágrafos", multilinha: true, placeholder: "Escreva um parágrafo novo e carregue em Juntar" },
        ],
      },
    ],
  },
  {
    chave: "numeros",
    nome: "Em números",
    descricao: "A secção \"Tudo num só lugar\", com os números em caixas e uma fotografia ao lado.",
    esquema: [
      {
        tipo: "objecto", chave: "numeros", etiqueta: "Tudo num só lugar",
        campos: [
          { tipo: "texto", chave: "titulo", etiqueta: "Título" },
          { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
          {
            tipo: "lista", chave: "itens", etiqueta: "Números", nomeItem: "número",
            ajuda: "Os números que contam sozinhos acompanham o que está publicado no site.",
            resumo: (n) => `${n.auto ? `(${String(n.auto)})` : String(n.valor ?? "")} ${String(n.texto ?? "")}`.trim(),
            novo: () => ({ auto: "", valor: "", texto: "" }),
            campos: [
              { tipo: "seleccao", chave: "auto", etiqueta: "Número", opcoes: NUMEROS_AUTOMATICOS, largura: "meia" },
              { tipo: "texto", chave: "valor", etiqueta: "Número escrito", largura: "meia", placeholder: "Ex.: 11 ou 0 Kz", mostrarSe: (n) => !n.auto },
              { tipo: "texto", chave: "texto", etiqueta: "Legenda por baixo do número" },
            ],
          },
          { tipo: "imagem", chave: "foto", etiqueta: "Fotografia ao lado", formato: "aspect-[4/3]" },
          { tipo: "texto", chave: "fotoAlt", etiqueta: "O que mostra a fotografia" },
        ],
      },
    ],
  },
  {
    chave: "encontra",
    nome: "O que encontra aqui",
    descricao: "Cartões grandes, numerados, com fotografia; a fotografia troca de lado de um cartão para o outro.",
    esquema: [
      {
        tipo: "objecto", chave: "encontra", etiqueta: "O que encontra aqui",
        campos: [
          { tipo: "texto", chave: "titulo", etiqueta: "Título da secção" },
          {
            tipo: "lista", chave: "cartoes", etiqueta: "Cartões", nomeItem: "cartão",
            resumo: (c) => String(c.titulo ?? ""),
            novo: () => ({ sobretitulo: "", titulo: "", texto: "", foto: "", ligacao: "" }),
            campos: [
              { tipo: "texto", chave: "sobretitulo", etiqueta: "Linha pequena", largura: "meia" },
              { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
              { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
              { tipo: "imagem", chave: "foto", etiqueta: "Fotografia", formato: "aspect-[4/3]" },
              { tipo: "texto", chave: "ligacao", etiqueta: "Para onde leva o cartão", placeholder: "/artigos", ajuda: "Uma página do site (ex.: /clubes). Em branco, o cartão não leva a lado nenhum." },
            ],
          },
        ],
      },
    ],
  },
  {
    chave: "missao",
    nome: "Porque existimos",
    esquema: [
      {
        tipo: "objecto", chave: "missao", etiqueta: "Porque existimos",
        campos: [
          { tipo: "texto", chave: "titulo", etiqueta: "Título da secção" },
          {
            tipo: "lista", chave: "cartoes", etiqueta: "Cartões", nomeItem: "cartão",
            ajuda: "Ficam quatro por linha nos ecrãs largos.",
            resumo: (c) => String(c.titulo ?? ""),
            novo: () => ({ icone: "bussola", titulo: "", texto: "" }),
            campos: [
              { tipo: "seleccao", chave: "icone", etiqueta: "Ícone", opcoes: ICONES_SOBRE, largura: "meia" },
              { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
              { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    chave: "equipa",
    nome: "Equipa",
    esquema: [
      {
        tipo: "objecto", chave: "equipa", etiqueta: "Quem faz a MotoBox",
        campos: [
          { tipo: "texto", chave: "titulo", etiqueta: "Título da secção" },
          { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 2 },
          {
            tipo: "lista", chave: "pessoas", etiqueta: "Pessoas", nomeItem: "pessoa",
            ajuda: "Ficam três por linha nos ecrãs largos.",
            resumo: (p) => [p.nome, p.papel].filter(Boolean).join(" · "),
            novo: () => ({ nome: "", papel: "", texto: "", camara: false }),
            campos: [
              { tipo: "texto", chave: "nome", etiqueta: "Nome", largura: "meia" },
              { tipo: "texto", chave: "papel", etiqueta: "Função", largura: "meia" },
              { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
              { tipo: "booleano", chave: "camara", etiqueta: "Mostrar uma máquina fotográfica em vez das iniciais", descricao: "Por omissão, o cartão mostra as iniciais do nome num quadrado vermelho." },
            ],
          },
        ],
      },
    ],
  },
  {
    chave: "fim",
    nome: "Instagram e fecho",
    esquema: [
      {
        tipo: "objecto", chave: "instagram", etiqueta: "Instagram",
        campos: [
          { tipo: "texto", chave: "titulo", etiqueta: "Texto do quadrado vermelho" },
          { tipo: "url", chave: "ligacao", etiqueta: "Ligação", placeholder: "https://www.instagram.com/…", ajuda: "Em branco, usa a ligação do Instagram das Definições." },
          {
            tipo: "personalizado", chave: "fotos", etiqueta: "Fotografias",
            render: (v, mudar) => {
              const fotos = Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : "")) : [];
              const nomes = ["Fotografia pequena", "Fotografia alta (à direita)", "Fotografia larga (em baixo)"];
              return (
                <div className="grid gap-4 md:grid-cols-3">
                  {nomes.map((nome, i) => (
                    <CampoImagem
                      key={nome}
                      etiqueta={nome}
                      formato="aspect-[4/3]"
                      valor={fotos[i] ?? ""}
                      onChange={(url) => {
                        const nova = [0, 1, 2].map((j) => fotos[j] ?? "");
                        nova[i] = url;
                        mudar(nova);
                      }}
                    />
                  ))}
                </div>
              );
            },
          },
        ],
      },
      {
        tipo: "objecto", chave: "final", etiqueta: "Frase final",
        campos: [
          { tipo: "imagem", chave: "foto", etiqueta: "Fotografia de fundo" },
          { tipo: "area", chave: "frase", etiqueta: "Frase", linhas: 2 },
          {
            tipo: "lista", chave: "botoes", etiqueta: "Botões", nomeItem: "botão",
            ajuda: "O primeiro é vermelho; os seguintes, escuros.",
            resumo: (b) => String(b.texto ?? ""),
            novo: () => ({ texto: "", ligacao: "" }),
            campos: [
              { tipo: "texto", chave: "texto", etiqueta: "Texto", largura: "meia" },
              { tipo: "texto", chave: "ligacao", etiqueta: "Para onde leva", largura: "meia", placeholder: "/clubes" },
            ],
          },
        ],
      },
    ],
  },
];
