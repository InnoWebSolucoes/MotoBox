/* ============================================================
   Conteúdo editável — Clubes
   - "clubes-perfis": o perfil alargado de cada clube (história,
     cronologia, viagens, encontros, como aderir, números,
     fontes). A ficha base do clube (nome, tipo, sede, redes…)
     continua na tabela `clubes`; o perfil é um documento por
     clube, com a chave do slug.
   - "paginas.clubes": todos os textos fixos da secção /clubes
     (abertura, introdução, números, movimentos, primeiros
     passos, rotas, juntar um clube) e da página de cada clube.
     O texto de partida é o que estava escrito no código.

   O documento da página é plano (sem objectos lá dentro): o
   gravado junta-se ao de partida campo a campo.
   ============================================================ */

import { PERFIS_CLUBES } from "@/lib/clubes-perfis";
import { clubes } from "@/lib/data";
import type { DefDoc, DefGrupo } from "../registo-tipos";

const nomeDoClube = (slug: string) => clubes.find((c) => c.slug === slug)?.nome ?? slug;

export const GRUPOS: DefGrupo[] = [
  {
    grupo: "clubes-perfis",
    titulo: "Perfis dos clubes",
    pagina: (chave) => `/clubes/${chave}`,
    padrao: () =>
      Object.entries(PERFIS_CLUBES).map(([slug, perfil]) => ({ chave: slug, titulo: nomeDoClube(slug), dados: perfil })),
  },
];

/** Um dos "primeiros passos" antes do primeiro passeio em grupo. */
export interface PassoClubes {
  titulo: string;
  texto: string;
  /** Ligação no fim do texto (vazia: sem ligação). */
  ligacaoTexto: string;
  ligacao: string;
}

export interface ConteudoPaginaClubes {
  descricaoPesquisa: string;
  /* Abertura */
  foto: string;
  sobretitulo: string;
  titulo: string;
  texto: string;
  botaoLista: string;
  botaoJuntar: string;
  /* Introdução e números */
  introTitulo: string;
  introParagrafos: string[];
  numeroClubes: string;
  numeroProvincias: string;
  numeroMulheres: string;
  numeroFixoValor: string;
  numeroFixoTexto: string;
  /* Lista */
  listaTitulo: string;
  listaTodosTipos: string;
  listaTodoPais: string;
  listaVazio: string;
  listaVazioLigacao: string;
  listaNota: string;
  /* Movimentos */
  movimentosTitulo: string;
  movimentosTexto: string;
  /** Slug do movimento com o cartão grande (vazio: nenhum). */
  movimentoDestaque: string;
  movimentoSobretitulo: string;
  movimentoTitulo: string;
  movimentoFoto: string;
  movimentoTexto: string;
  /* Antes do primeiro passeio */
  passosTitulo: string;
  passosTexto: string;
  passos: PassoClubes[];
  /* Rotas */
  rotasMostrar: boolean;
  rotasTitulo: string;
  rotasTexto: string;
  rotasLigacao: string;
  /** Slugs das rotas mostradas, por ordem (vazio: as três primeiras). */
  rotasEscolhidas: string[];
  /* Juntar um clube */
  juntarTitulo: string;
  juntarVantagens: string[];
  juntarBotao: string;
  juntarNota: string;
  juntarSucesso: string;
  /* Página de cada clube ({termo}: "clube" ou "movimento"; {nome}: o nome do clube) */
  fichaRotuloFundacao: string;
  fichaRotuloFundacaoFalta: string;
  fichaRotuloSedeFalta: string;
  fichaRotuloTipo: string;
  fichaRotuloActividades: string;
  fichaSobre: string;
  fichaHistoria: string;
  fichaPoucasPalavras: string;
  fichaLema: string;
  fichaEstilo: string;
  fichaMotas: string;
  fichaActividades: string;
  fichaPercurso: string;
  fichaPercursoComFontes: string;
  fichaPercursoSemFontes: string;
  fichaSemData: string;
  fichaViagensAno: string;
  fichaViagensNome: string;
  fichaViagensKm: string;
  fichaEncontros: string;
  fichaEncontrosVazio: string;
  fichaAderirClube: string;
  fichaAderirMovimento: string;
  fichaAderirVazio: string;
  fichaFontePrefixo: string;
  fichaFontes: string;
  fichaFontesNota: string;
  fichaErro: string;
  fichaPaginaSobretitulo: string;
  fichaPaginaTitulo: string;
  fichaPaginaTexto: string;
  fichaPaginaBotao: string;
  fichaContactar: string;
  fichaOutros: string;
  fichaTodos: string;
}

export const PAGINA_CLUBES_PADRAO: ConteudoPaginaClubes = {
  descricaoPesquisa:
    "Todos os clubes de motas de Angola: moto-turismo, Lady Riders, scooters, clássicas e convívio. Encontre um clube perto de si ou junte o seu à MotoBox.",
  foto: "banner-clubes",
  sobretitulo: "Clubes de Angola",
  titulo: "Quem anda de mota em grupo",
  texto:
    "Grupos de passeio, scooters e clássicas, raides pelo país e viagens além-fronteiras, e movimentos como as Lady Riders. Os clubes de motas de Angola, todos no mesmo sítio.",
  botaoLista: "Encontrar um clube",
  botaoJuntar: "Juntar o meu clube",
  introTitulo: "Andar de mota por gosto, em Angola",
  introParagrafos: [
    "O movimento motard angolano ganhou forma no início dos anos 2000, com grupos de amigos que saíam juntos por Luanda. Em 2006, os Amigos da Picada atravessaram a fronteira pela primeira vez, numa viagem em grupo até à Namíbia, e abriram caminho a uma ideia simples: conhecer Angola de mota.",
    "Hoje há saídas de domingo à volta das cidades, raides a Malanje, a Benguela ou ao Soyo, viagens além-fronteiras e acções solidárias em hospitais e comunidades. Em Julho de 2026, o primeiro Dia do Motard Angolano juntou os clubes no Autódromo de Luanda.",
  ],
  numeroClubes: "clubes na MotoBox",
  numeroProvincias: "províncias com sede publicada",
  numeroMulheres: "movimentos e clubes de mulheres ou presididos por mulheres",
  numeroFixoValor: "2006",
  numeroFixoTexto: "a primeira viagem em grupo além-fronteiras",
  listaTitulo: "Todos os clubes",
  listaTodosTipos: "Todos os tipos",
  listaTodoPais: "Todo o país",
  listaVazio: "Ainda não há clubes com este filtro.",
  listaVazioLigacao: "Conhece um? Junte-o à MotoBox",
  listaNota: "Informação recolhida nas páginas públicas dos clubes. Fotografias de capa ilustrativas.",
  movimentosTitulo: "Movimentos",
  movimentosTexto: "Não são clubes: juntam motards de vários clubes à volta de uma causa.",
  movimentoDestaque: "ladies-in-2-wheels-angola",
  movimentoSobretitulo: "Lady Riders",
  movimentoTitulo: "Elas também conduzem",
  movimentoFoto: "clube-ladies-in-2-wheels",
  movimentoTexto:
    "As Lady Riders não são um clube: são mulheres que já rodam nos seus clubes, muitas nos Amigos da Picada, e se juntam para levar mais mulheres para a estrada. As Ladies in 2 Wheels in Angola já rodaram até à Namíbia, ao Botswana e à África do Sul, com a filantropia na bagagem. E há clubes mistos presididos por mulheres, como o Clube Anjos Bantu.",
  passosTitulo: "Antes do primeiro passeio em grupo",
  passosTexto: "Entrar num clube é mais fácil do que parece. Estes três passos ajudam.",
  passos: [
    {
      titulo: "Siga e apareça",
      texto:
        "Siga o clube nas redes e vá a um encontro aberto. A maior parte dos clubes recebe bem quem chega com vontade de rodar.",
      ligacaoTexto: "",
      ligacao: "",
    },
    {
      titulo: "Conheça as regras do grupo",
      texto: "Líder à frente, fecho atrás, ziguezague nas rectas e fila indiana nas curvas.",
      ligacaoTexto: "Ler as regras",
      ligacao: "/artigos/andar-em-grupo-regras",
    },
    {
      titulo: "Vá equipado",
      texto: "Capacete homologado e apertado, luvas, casaco e calçado fechado. E a mota verificada antes de sair.",
      ligacaoTexto: "Ver segurança",
      ligacao: "/seguranca",
    },
  ],
  rotasMostrar: true,
  rotasTitulo: "Para onde ir de mota",
  rotasTexto:
    "Da Serra da Leba às quedas de Kalandula: estrada, piso, melhor época e cuidados de cada destino, com as fontes à vista.",
  rotasLigacao: "Todas as rotas",
  rotasEscolhidas: [],
  juntarTitulo: "Tem um clube? Junte-o à MotoBox",
  juntarVantagens: [
    "Página própria do clube, com as redes e o contacto",
    "Os vossos passeios e encontros na secção Eventos",
    "É gratuito, e a equipa confirma os dados antes de publicar",
  ],
  juntarBotao: "Enviar o clube",
  juntarNota: "A equipa confirma os dados antes de publicar a página.",
  juntarSucesso: "Pedido recebido",
  fichaRotuloFundacao: "ano de fundação",
  fichaRotuloFundacaoFalta: "fundação por confirmar",
  fichaRotuloSedeFalta: "sede por confirmar",
  fichaRotuloTipo: "tipo de {termo}",
  fichaRotuloActividades: "actividades conhecidas",
  fichaSobre: "Sobre o {termo}",
  fichaHistoria: "A história",
  fichaPoucasPalavras: "Em poucas palavras",
  fichaLema: "Lema do {termo}",
  fichaEstilo: "Estilo",
  fichaMotas: "Motas",
  fichaActividades: "O que fazem",
  fichaPercurso: "Percurso do {termo}",
  fichaPercursoComFontes: "Os momentos que o {termo} e a imprensa publicaram, por ordem, cada um com a sua fonte.",
  fichaPercursoSemFontes: "Os momentos que marcaram o {termo}, por ordem.",
  fichaSemData: "Sem data certa",
  fichaViagensAno: "Ano",
  fichaViagensNome: "Raide e países",
  fichaViagensKm: "km",
  fichaEncontros: "Onde e quando se encontram",
  fichaEncontrosVazio:
    "O {termo} não publicou um ponto de encontro fixo. As próximas saídas costumam ser anunciadas nas redes do {termo}.",
  fichaAderirClube: "Como entrar no clube",
  fichaAderirMovimento: "Como fazer parte",
  fichaAderirVazio: "O {termo} não publicou regras de adesão. Pergunte directamente nas redes do {termo}.",
  fichaFontePrefixo: "Fonte:",
  fichaFontes: "Fontes",
  fichaFontesNota:
    "Reportagens e páginas públicas do {termo} consultadas em Outubro de 2026. Os dados sem fonte ao lado são indicativos e podem mudar.",
  fichaErro: "Viu um erro? Escreva-nos",
  fichaPaginaSobretitulo: "Esta página é sua?",
  fichaPaginaTitulo: "Ajude-nos a completar a ficha",
  fichaPaginaTexto:
    "A informação vem das páginas públicas do {termo} e a fotografia de capa é ilustrativa. Se faz parte do {nome}, envie-nos o logótipo, fotografias vossas, a sede e as datas dos próximos passeios.",
  fichaPaginaBotao: "Falar com a MotoBox",
  fichaContactar: "Contactar o {termo}",
  fichaOutros: "Outros clubes",
  fichaTodos: "Todos os clubes",
};

/** Troca "{termo}" (clube ou movimento) e "{nome}" (o nome do clube) num texto da página de um clube. */
export function textoClube(texto: string, termo: string, nome = ""): string {
  return texto.replaceAll("{termo}", termo).replaceAll("{nome}", nome);
}

/** Entrada da secção /clubes e textos da página de cada clube. */
export const DOCS: DefDoc[] = [
  { chave: "paginas.clubes", titulo: "Clubes (página da secção)", pagina: "/clubes", padrao: () => ({ ...PAGINA_CLUBES_PADRAO }) },
];
