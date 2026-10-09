"use client";

/* ============================================================
   MOTOBOX ADMIN — Entrada e painel › Geral ("site.geral")
   Os textos que aparecem em todo o site: o rodapé das páginas
   interiores, o botão vermelho de baixo, a página 404, a página
   "Sem acesso", as páginas da newsletter, o aviso de cookies e
   a página de manutenção.
   ============================================================ */

import type { CampoEsquema } from "@/components/admin/editor/esquema";
import { dentro, type ParteDoc } from "./EditorPartes";

type Extra = { placeholder?: string; ajuda?: string; largura?: "meia" | "inteira" };
const t = (chave: string, etiqueta: string, extra: Extra = {}): CampoEsquema =>
  ({ tipo: "texto", chave, etiqueta, largura: "meia", ...extra });
const a = (chave: string, etiqueta: string, linhas = 3, ajuda?: string): CampoEsquema =>
  ({ tipo: "area", chave, etiqueta, linhas, ajuda });
const ligacao = (chave: string, etiqueta: string, ajuda?: string): CampoEsquema => ({
  tipo: "objecto", chave, etiqueta, ajuda, campos: [
    t("texto", "Texto"),
    t("href", "Para onde leva", { placeholder: "/explorar", ajuda: "Uma página do site (/artigos) ou um endereço completo (https://…)." }),
  ],
});

export const PARTES_GERAL: ParteDoc[] = [
  {
    chave: "rodape",
    nome: "Rodapé",
    descricao: "A linha final de todas as páginas interiores (calendário, artigos, clubes…).",
    esquema: [
      dentro("rodape", [
        { tipo: "texto", chave: "direitos", etiqueta: "Linha dos direitos", ajuda: "{ano} passa a ser o ano corrente." },
        {
          tipo: "lista", chave: "ligacoes", etiqueta: "Ligações", nomeItem: "ligação",
          ajuda: "Pela ordem em que aparecem. Endereços começados por https:// abrem noutro separador.",
          novo: () => ({ texto: "", href: "" }),
          resumo: (l) => [l.texto, l.href].filter(Boolean).join(" · "),
          campos: [
            t("texto", "Texto"),
            t("href", "Para onde leva", { placeholder: "/sobre" }),
          ],
        },
        t("rotulo", "Nome da lista (para leitores de ecrã)"),
      ]),
    ],
  },
  {
    chave: "barra",
    nome: "Botão de acção",
    descricao: "O botão vermelho em baixo, que abre e fecha o painel, e a ligação para entrar na conta.",
    esquema: [
      dentro("barra", [
        { tipo: "secao", titulo: "Na entrada (página inicial)", campos: [
          t("explorar", "Texto do botão"),
          t("explorarRotulo", "Descrição para leitores de ecrã"),
        ] },
        { tipo: "secao", titulo: "No painel Explorar", campos: [
          t("fechar", "Texto do botão"),
          t("fecharRotulo", "Descrição para leitores de ecrã"),
        ] },
        { tipo: "secao", titulo: "Nas outras páginas", campos: [
          t("voltar", "Texto do botão"),
        ] },
        { tipo: "secao", titulo: "Ligação de conta", descricao: "Ao lado do botão, no computador; por cima dele, no telemóvel.", campos: [
          t("entrar", "Sem sessão iniciada"),
          t("conta", "Com sessão iniciada"),
        ] },
      ]),
    ],
  },
  {
    chave: "erro404",
    nome: "Página 404",
    descricao: "O que aparece quando alguém abre um endereço que não existe.",
    esquema: [
      dentro("naoEncontrada", [
        t("sobretitulo", "Linha pequena por cima do título"),
        { tipo: "texto", chave: "titulo", etiqueta: "Título" },
        a("texto", "Texto", 2),
        ligacao("botao", "Botão vermelho"),
        ligacao("botaoSecundario", "Botão escuro"),
        a("nota", "Nota no fim", 2, "Fica antes da ligação abaixo. Vazia, não aparece."),
        ligacao("notaLigacao", "Ligação da nota"),
      ]),
    ],
  },
  {
    chave: "semAcesso",
    nome: "Sem acesso",
    descricao: "A página para onde vai quem entra com uma conta sem permissão para o painel de gestão.",
    esquema: [
      dentro("semAcesso", [
        { tipo: "texto", chave: "titulo", etiqueta: "Título" },
        a("texto", "Texto", 2),
        t("inicio", "Botão para a página inicial"),
        t("sair", "Botão para sair da conta"),
      ]),
    ],
  },
  {
    chave: "newsletter",
    nome: "Newsletter",
    descricao: "A página que abre depois de carregar em \"Cancelar subscrição\" no fim de um email da newsletter.",
    esquema: [
      dentro("newsletter", [
        t("sobretitulo", "Linha vermelha por cima do título"),
        { tipo: "secao", titulo: "Subscrição cancelada", campos: [
          t("canceladaTitulo", "Título"),
          a("canceladaTexto", "Texto", 2, "{email} passa a ser o email que deixou de receber."),
          a("canceladaSemEmail", "Texto quando não se sabe o email", 2),
          t("canceladaEngano", "Pergunta para voltar à lista"),
          t("voltarSubscrever", "Botão para voltar a subscrever"),
          t("aSubscrever", "Botão enquanto subscreve"),
          t("resubscrito", "Mensagem depois de voltar à lista"),
          a("erroEnvio", "Mensagem se falhar", 2),
        ] },
        { tipo: "secao", titulo: "Ligação inválida", campos: [
          t("linkInvalidoTitulo", "Título"),
          a("linkInvalidoTexto", "Texto", 2),
        ] },
        { tipo: "secao", titulo: "Erro ao cancelar", campos: [
          t("erroCancelarTitulo", "Título"),
          a("erroCancelarTexto", "Texto", 2),
          t("tentarDeNovo", "Botão para tentar outra vez"),
        ] },
        { tipo: "secao", titulo: "Botões", campos: [
          t("inicio", "Botão para a página inicial"),
          t("falarConnosco", "Botão para o contacto"),
        ] },
      ]),
    ],
  },
  {
    chave: "cookies",
    nome: "Aviso de cookies",
    descricao: "A caixa que aparece no canto a quem ainda não escolheu. Liga-se e desliga-se em Definições.",
    esquema: [
      dentro("cookies", [
        { tipo: "texto", chave: "titulo", etiqueta: "Título" },
        a("texto", "Texto", 3),
        t("politica", "Ligação para a política"),
        t("politicaHref", "Para onde leva", { placeholder: "/cookies" }),
        { tipo: "secao", titulo: "Botões", campos: [
          t("personalizar", "Personalizar"),
          t("soEssenciais", "Só essenciais"),
          t("aceitarTudo", "Aceitar tudo"),
          t("guardarPrefs", "Guardar as escolhas"),
        ] },
        { tipo: "secao", titulo: "Categorias (em Personalizar)", campos: [
          t("essenciais", "Essenciais"),
          t("sempreActivo", "Etiqueta \"sempre activo\""),
          { tipo: "texto", chave: "essenciaisDesc", etiqueta: "Descrição dos essenciais" },
          t("analiticos", "Analíticos"),
          { tipo: "texto", chave: "analiticosDesc", etiqueta: "Descrição dos analíticos", ajuda: "A medição de audiências (Definições › Analytics) só arranca a quem aceitar esta categoria." },
          t("marketing", "Marketing"),
          { tipo: "texto", chave: "marketingDesc", etiqueta: "Descrição do marketing" },
        ] },
        t("preferencias", "Nome da caixa (para leitores de ecrã)"),
      ]),
    ],
  },
  {
    chave: "manutencao",
    nome: "Manutenção",
    descricao: "A página que os visitantes vêem com o modo de manutenção ligado (Definições). A equipa com sessão iniciada continua a ver o site.",
    esquema: [
      dentro("manutencao", [
        t("sobretitulo", "Linha pequena por cima do título"),
        { tipo: "texto", chave: "titulo", etiqueta: "Título" },
        a("texto", "Texto", 3),
        a("nota", "Nota de contacto", 2, "{email} passa a ser o email de contacto das Definições. Vazia, não aparece."),
        t("equipa", "Ligação para a equipa entrar", { ajuda: "Leva à página de entrada e, depois, ao painel de gestão. Vazia, não aparece." }),
        a("avisoEquipa", "Faixa que a equipa vê por cima do site", 2, "Só aparece a quem entrou com uma conta da equipa, enquanto o modo de manutenção estiver ligado."),
      ]),
    ],
  },
];
