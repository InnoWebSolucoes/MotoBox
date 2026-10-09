"use client";

/* ============================================================
   MOTOBOX ADMIN — Editor da página Contacto ("paginas.contacto")
   Forma em lib/conteudo/grupos/paginas.ts (ConteudoContacto);
   página em app/contacto. As redes sociais da coluna da direita
   vêm das Definições.
   ============================================================ */

import { caixa, em, type AbaEsquema } from "./partes";

export const ABAS_CONTACTO: AbaEsquema[] = [
  {
    chave: "pagina",
    nome: "Página",
    descricao: "O topo da página e a coluna da direita. As redes sociais da coluna vêm das Definições.",
    esquema: [
      caixa("Topo da página", [
        { tipo: "texto", chave: "sobretitulo", etiqueta: "Linha pequena por cima do título", largura: "meia" },
        { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
        { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
      ]),
      caixa("Coluna da direita", [
        { tipo: "texto", chave: "instagramTitulo", etiqueta: "Texto do quadrado vermelho do Instagram", ajuda: "Só aparece se houver uma ligação de Instagram nas Definições." },
        {
          tipo: "objecto", chave: "local", etiqueta: "Caixa de morada",
          ajuda: "Com os dois campos em branco, a caixa não aparece.",
          campos: [
            { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia", placeholder: "Luanda, Angola" },
            { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 2 },
          ],
        },
      ]),
      {
        tipo: "objecto", chave: "seo", etiqueta: "Nas pesquisas e no separador do navegador",
        campos: [
          { tipo: "texto", chave: "titulo", etiqueta: "Título" },
          { tipo: "area", chave: "descricao", etiqueta: "Descrição", linhas: 2 },
        ],
      },
    ],
  },
  {
    chave: "assuntos",
    nome: "Assuntos",
    descricao:
      "Os botões \"Sobre o que nos escreve?\". O assunto escolhido chega com a mensagem a Gestão › Mensagens. Quem vem da página de um clube ou de um evento já chega com o assunto \"Clubes\" ou \"Divulgar um evento\" escolhido.",
    esquema: [
      em("formulario", [
        { tipo: "texto", chave: "assuntosTitulo", etiqueta: "Pergunta por cima dos assuntos" },
        {
          tipo: "lista", chave: "assuntos", etiqueta: "Assuntos", nomeItem: "assunto",
          resumo: (a) => String(a.nome ?? ""),
          novo: () => ({ id: `assunto-${Date.now().toString(36)}`, nome: "", texto: "" }),
          campos: [
            { tipo: "texto", chave: "nome", etiqueta: "Nome", largura: "meia" },
            { tipo: "texto", chave: "texto", etiqueta: "Explicação curta", largura: "meia" },
          ],
        },
      ]),
    ],
  },
  {
    chave: "formulario",
    nome: "Formulário",
    descricao: "Os nomes dos campos, o botão e os avisos do formulário de contacto.",
    esquema: [
      em("formulario", [
        caixa("Campos", [
          { tipo: "texto", chave: "nome", etiqueta: "Nome", largura: "meia" },
          { tipo: "texto", chave: "email", etiqueta: "Email", largura: "meia" },
          { tipo: "texto", chave: "emailExemplo", etiqueta: "Exemplo dentro do campo de email", largura: "meia" },
          { tipo: "texto", chave: "telefone", etiqueta: "Telefone", largura: "meia" },
          { tipo: "texto", chave: "telefoneExemplo", etiqueta: "Exemplo dentro do campo de telefone", largura: "meia" },
          { tipo: "texto", chave: "organizacao", etiqueta: "Clube ou organização", largura: "meia" },
          { tipo: "texto", chave: "mensagem", etiqueta: "Mensagem", largura: "meia" },
          { tipo: "texto", chave: "opcional", etiqueta: "Marca dos campos opcionais", largura: "meia" },
        ]),
        caixa("Botão", [
          { tipo: "texto", chave: "enviar", etiqueta: "Texto do botão", largura: "meia" },
          { tipo: "texto", chave: "aEnviar", etiqueta: "Enquanto envia", largura: "meia" },
        ]),
        caixa("Avisos de erro", [
          { tipo: "texto", chave: "erroNome", etiqueta: "Sem nome", largura: "meia" },
          { tipo: "texto", chave: "erroEmail", etiqueta: "Email errado", largura: "meia" },
          { tipo: "texto", chave: "erroMensagem", etiqueta: "Mensagem curta de mais" },
          { tipo: "texto", chave: "erroGeral", etiqueta: "Falha ao enviar", largura: "meia" },
          { tipo: "texto", chave: "erroRede", etiqueta: "Sem internet", largura: "meia" },
        ]),
        caixa("Depois de enviar", [
          { tipo: "texto", chave: "sucessoTitulo", etiqueta: "Título" },
          {
            tipo: "area", chave: "sucessoTexto", etiqueta: "Texto", linhas: 2,
            ajuda: "{nome} é trocado pelo primeiro nome de quem escreveu e {email} pelo seu email.",
          },
          { tipo: "texto", chave: "outra", etiqueta: "Botão para escrever outra mensagem" },
        ]),
      ]),
    ],
  },
];
