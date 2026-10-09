/* ============================================================
   Conteúdo editável — Páginas do site: textos das páginas que
   não vêm de uma tabela (Sobre, Contacto, Segurança, o guia de
   importação e os textos comuns das páginas legais).
   O texto de partida é o que estava escrito no código.
   ============================================================ */

import * as Seguranca from "@/app/seguranca/conteudo";
import * as Importar from "@/app/marketplace/importar/conteudo";
import type { DefDoc, DefGrupo } from "../registo-tipos";

type Seo = { titulo: string; descricao: string };

/* ---------------- Segurança ---------------- */

/** Guia de segurança (bilingue, como a página). */
export const SEGURANCA_PADRAO = {
  SEO: {
    titulo: "Segurança",
    descricao:
      "Guia prático para quem anda de mota em Angola: capacete, chuva, visibilidade, equipamento, passageiros, verificação antes de sair, passeios em grupo e o que fazer num acidente. Com fontes.",
  } as Seo,
  FOTOS: Seguranca.FOTOS,
  SECCOES: Seguranca.SECCOES,
  UI: Seguranca.UI,
  NUMEROS: Seguranca.NUMEROS,
  CAPACETE: Seguranca.CAPACETE,
  CHUVA: Seguranca.CHUVA,
  VISIBILIDADE: Seguranca.VISIBILIDADE,
  EQUIPAMENTO: Seguranca.EQUIPAMENTO,
  PASSAGEIROS: Seguranca.PASSAGEIROS,
  CABECA: Seguranca.CABECA,
  VERIFICACAO: Seguranca.VERIFICACAO,
  GRUPO: Seguranca.GRUPO,
  ACIDENTE: Seguranca.ACIDENTE,
  SEGURO: Seguranca.SEGURO,
  HISTORIAS: Seguranca.HISTORIAS,
  FONTES: Seguranca.FONTES,
};

export type ConteudoSeguranca = typeof SEGURANCA_PADRAO;

/* ---------------- Importar uma mota ---------------- */

/** Guia "Importar do estrangeiro" do Marketplace (bilingue, como a página). */
export const IMPORTAR_PADRAO = {
  SEO: {
    titulo: "Importar do estrangeiro",
    descricao:
      "Peças, equipamento, motas e mais de Portugal, Espanha e do resto da Europa, com orçamento até Angola: como funciona, o que diz a lei, onde procurar e como pedir.",
  } as Seo,
  TEXTO: Importar.TEXTO,
  PASSOS: Importar.PASSOS,
  CATEGORIAS: Importar.CATEGORIAS,
  REGRAS: Importar.REGRAS,
  ONDE_PROCURAR: Importar.ONDE_PROCURAR,
  FONTES: Importar.FONTES,
  FORM: Importar.FORM,
};

export type ConteudoImportar = typeof IMPORTAR_PADRAO;

/* ---------------- Sobre ---------------- */

/** De onde vem cada número da secção "Tudo num só lugar". */
export type NumeroAutomatico = "" | "artigos" | "clubes" | "rotas" | "eventos";

export interface ConteudoSobre {
  seo: Seo;
  abertura: { foto: string; sobretitulo: string; titulo: string; texto: string };
  feito: {
    /** Uma mudança de linha no título só se vê em ecrãs largos. */
    titulo: string;
    texto: string;
    fotos: { foto: string; alt: string }[];
  };
  historia: { titulo: string; paragrafos: string[] };
  numeros: {
    titulo: string;
    texto: string;
    itens: { auto: NumeroAutomatico; valor: string; texto: string }[];
    foto: string;
    fotoAlt: string;
  };
  encontra: {
    titulo: string;
    cartoes: { sobretitulo: string; titulo: string; texto: string; foto: string; ligacao: string }[];
  };
  missao: { titulo: string; cartoes: { icone: string; titulo: string; texto: string }[] };
  equipa: {
    titulo: string;
    texto: string;
    pessoas: { nome: string; papel: string; texto: string; camara: boolean }[];
  };
  instagram: { titulo: string; ligacao: string; fotos: string[] };
  final: { foto: string; frase: string; botoes: { texto: string; ligacao: string }[] };
}

export const SOBRE_PADRAO: ConteudoSobre = {
  seo: {
    titulo: "Sobre a MotoBox",
    descricao:
      "A MotoBox é a casa de quem anda de mota em Angola: um projecto sem fins lucrativos, criado por Sofia Mussungo, que junta histórias, clubes, passeios e segurança num só lugar.",
  },
  abertura: {
    foto: "banner-sobre",
    sobretitulo: "MotoBox Angola",
    titulo: "O que é a MotoBox?",
    texto:
      "A casa de quem anda de mota em Angola. Um projecto sem fins lucrativos que junta num só lugar o que andava espalhado: histórias, clubes, passeios, eventos e conselhos de segurança.",
  },
  feito: {
    titulo: "Feito por motards,\npara motards",
    texto:
      "Para quem vê na mota uma forma de liberdade, e na estrada um sítio para fazer amigos. Da scooter de todos os dias à moto de viagem.",
    fotos: [
      { foto: "classicas", alt: "Mota clássica estacionada junto a um muro" },
      { foto: "painel-clubes", alt: "Grupo de motards numa estrada de montanha junto ao mar" },
      { foto: "scooters", alt: "Scooter azul numa rua calcetada" },
    ],
  },
  historia: {
    titulo: "A nossa história",
    paragrafos: [
      "A MotoBox começou como a ideia de uma revista digital sobre o mundo motard angolano. A fundadora, Sofia Mussungo, queria juntar num só lugar o que andava disperso: os passeios, os encontros, as corridas e as histórias das pessoas que fazem a comunidade.",
      "A revista nunca chegou a sair como estava pensada. O designer que lhe dava forma faleceu num acidente, e o projecto ficou suspenso. Mas o trabalho não parou: mudou de forma e passou a viver no Instagram e no Facebook, com fotografias, divulgação e a cobertura do que ia acontecendo.",
      "Faltava um sítio fixo. A informação perdia-se no feed e as perguntas chegavam ao telefone pessoal da fundadora. Este site existe para isso: ser a referência de quem anda de mota em Angola, e a casa de tudo o que a MotoBox faz.",
    ],
  },
  numeros: {
    titulo: "Tudo num só lugar",
    texto:
      "Artigos escritos com fontes, os clubes de todo o país, rotas para viajar, um guia de segurança, um marketplace e um fórum. Sem publicidade escondida e sem fins lucrativos.",
    itens: [
      { auto: "artigos", valor: "", texto: "artigos publicados" },
      { auto: "clubes", valor: "", texto: "clubes e grupos" },
      { auto: "rotas", valor: "", texto: "rotas, com fontes" },
      { auto: "eventos", valor: "", texto: "eventos no calendário" },
      { auto: "", valor: "11", texto: "temas de segurança" },
      { auto: "", valor: "0 Kz", texto: "de lucro: é um projecto da comunidade" },
    ],
    foto: "painel-sobre",
    fotoAlt: "Motards à conversa junto a uma mota clássica",
  },
  encontra: {
    titulo: "O que encontra aqui",
    cartoes: [
      {
        sobretitulo: "A secção principal",
        titulo: "Artigos",
        texto:
          "Histórias da comunidade, perfis de clubes, viagens pelo país e guias práticos, escritos pela redacção a partir de fontes públicas.",
        foto: "artigo-lady-riders",
        ligacao: "/artigos",
      },
      {
        sobretitulo: "De norte a sul",
        titulo: "Clubes",
        texto:
          "Os clubes de motas de Angola, de todos os tipos: moto-turismo, Lady Riders, scooters, clássicas e convívio. Cada um com a sua página, as redes e o que faz.",
        foto: "painel-clubes",
        ligacao: "/clubes",
      },
      {
        sobretitulo: "Passeios, encontros e raides",
        titulo: "Eventos e rotas",
        texto:
          "O calendário da comunidade e as rotas para viajar de mota, com a estrada, o piso, a melhor época e os cuidados de cada destino.",
        foto: "painel-eventos",
        ligacao: "/eventos",
      },
      {
        sobretitulo: "Chegar a casa",
        titulo: "Segurança",
        texto:
          "Um guia prático sobre o capacete, a chuva, o equipamento, os passageiros e o que fazer num acidente. Com fontes, sem sermões.",
        foto: "artigo-capacete",
        ligacao: "/seguranca",
      },
    ],
  },
  missao: {
    titulo: "Porque existimos",
    cartoes: [
      {
        icone: "bussola",
        titulo: "Ser a referência",
        texto: "O sítio onde qualquer pessoa encontra o que se passa no mundo das motas em Angola.",
      },
      {
        icone: "coracao",
        titulo: "Comunidade primeiro",
        texto: "Nasceu de dentro da comunidade motard e é para ela que trabalha. Sem fins lucrativos.",
      },
      {
        icone: "biblioteca",
        titulo: "Guardar a memória",
        texto: "Histórias, fotografias e encontros que se perdiam no feed ficam aqui, arrumados.",
      },
      {
        icone: "escudo",
        titulo: "Andar com segurança",
        texto: "Mais motas na estrada pede mais cuidado. A informação certa ajuda a voltar a casa.",
      },
    ],
  },
  equipa: {
    titulo: "Quem faz a MotoBox",
    texto: "Um projecto pequeno, feito por poucas pessoas e por uma comunidade que colabora.",
    pessoas: [
      {
        nome: "Sofia Mussungo",
        papel: "Fundadora e directora",
        texto: "Criou a MotoBox para dar à comunidade motard angolana um sítio de referência, e é quem lidera o projecto.",
        camara: false,
      },
      {
        nome: "Gonçalo",
        papel: "Fotografia",
        texto: "Vai aos eventos, fotografa e cuida das redes sociais. É o olhar por detrás das imagens da MotoBox.",
        camara: true,
      },
      {
        nome: "Comunidade MotoBox",
        papel: "Colaboradores",
        texto: "Motards, clubes e mecânicos que enviam histórias, fotografias e correcções. Sem eles, metade disto não existia.",
        camara: false,
      },
    ],
  },
  instagram: {
    titulo: "Acompanhe a MotoBox no Instagram",
    ligacao: "https://www.instagram.com/motobox_angola",
    fotos: ["artigo-primeira-mota", "artigo-grupo", "clube-vespa"],
  },
  final: {
    foto: "painel-clubes",
    frase: "Andar de mota é mais do que chegar ao destino. É o caminho que se faz em conjunto.",
    botoes: [
      { texto: "Encontrar um clube", ligacao: "/clubes" },
      { texto: "Falar connosco", ligacao: "/contacto" },
    ],
  },
};

/* ---------------- Contacto ---------------- */

export interface AssuntoContacto {
  /** Identificador interno (não aparece no site). */
  id: string;
  nome: string;
  texto: string;
}

export interface ConteudoContacto {
  seo: Seo;
  sobretitulo: string;
  titulo: string;
  texto: string;
  instagramTitulo: string;
  local: { titulo: string; texto: string };
  formulario: {
    assuntosTitulo: string;
    assuntos: AssuntoContacto[];
    nome: string;
    email: string;
    emailExemplo: string;
    telefone: string;
    telefoneExemplo: string;
    organizacao: string;
    mensagem: string;
    opcional: string;
    enviar: string;
    aEnviar: string;
    erroNome: string;
    erroEmail: string;
    erroMensagem: string;
    erroGeral: string;
    erroRede: string;
    sucessoTitulo: string;
    /** {nome} é o primeiro nome de quem escreveu e {email} o seu endereço. */
    sucessoTexto: string;
    outra: string;
  };
}

export const CONTACTO_PADRAO: ConteudoContacto = {
  seo: {
    titulo: "Contacto",
    descricao: "Fale com a MotoBox Angola: registar um clube, divulgar um evento, enviar uma história ou propor uma parceria.",
  },
  sobretitulo: "Fale connosco",
  titulo: "Contacto",
  texto:
    "Tem um clube para registar, um evento para divulgar ou uma história para contar? Escreva-nos. Lemos todas as mensagens.",
  instagramTitulo: "Fale connosco também no Instagram",
  local: {
    titulo: "Luanda, Angola",
    texto: "A MotoBox é um projecto sem fins lucrativos, feito por e para a comunidade motard.",
  },
  formulario: {
    assuntosTitulo: "Sobre o que nos escreve?",
    assuntos: [
      { id: "informacao", nome: "Pedido de informação", texto: "Dúvidas sobre o site, um clube ou um evento." },
      { id: "clube", nome: "Clubes", texto: "Registar ou actualizar a página de um clube." },
      { id: "evento", nome: "Divulgar um evento", texto: "Um passeio, encontro, raide ou formação." },
      { id: "conteudo", nome: "Enviar uma história", texto: "Fotografias, uma viagem ou um tema para artigo." },
      { id: "parcerias", nome: "Parcerias", texto: "Marcas, lojas, oficinas e apoios." },
      { id: "outro", nome: "Outro assunto", texto: "Tudo o resto." },
    ],
    nome: "Nome",
    email: "Email",
    emailExemplo: "o.seu@email.ao",
    telefone: "Telefone",
    telefoneExemplo: "+244",
    organizacao: "Clube ou organização",
    mensagem: "Mensagem",
    opcional: "(opcional)",
    enviar: "Enviar mensagem",
    aEnviar: "A enviar...",
    erroNome: "Indique o seu nome.",
    erroEmail: "Email inválido.",
    erroMensagem: "Escreva a sua mensagem (mínimo 10 caracteres).",
    erroGeral: "Não foi possível enviar. Tente de novo.",
    erroRede: "Sem ligação à internet. Tente de novo.",
    sucessoTitulo: "Mensagem enviada",
    sucessoTexto: "Obrigado, {nome}. Recebemos a sua mensagem e respondemos para {email}.",
    outra: "Enviar outra mensagem",
  },
};

/* ---------------- Páginas legais: textos comuns ---------------- */

/** O que é igual em todas as páginas legais (o texto de cada uma vive na tabela paginas_legais). */
export interface ConteudoLegais {
  sobretitulo: string;
  actualizacao: string;
  inicio: string;
  nestaPagina: string;
  outros: string;
}

export const LEGAIS_PADRAO: ConteudoLegais = {
  sobretitulo: "Documento legal",
  actualizacao: "Última atualização",
  inicio: "Início",
  nestaPagina: "Nesta página",
  outros: "Outros documentos",
};

/*
  As entradas das secções (Clubes, Rotas, Desporto, Eventos, Artigos,
  Marketplace, Fórum) vivem no ficheiro de cada secção (clubes.ts,
  rotas.ts, desporto.ts, eventos.ts, comunidade.ts).
*/
export const DOCS: DefDoc[] = [
  { chave: "paginas.sobre", titulo: "Sobre", pagina: "/sobre", padrao: () => SOBRE_PADRAO },
  { chave: "paginas.contacto", titulo: "Contacto", pagina: "/contacto", padrao: () => CONTACTO_PADRAO },
  { chave: "paginas.seguranca", titulo: "Segurança", pagina: "/seguranca", padrao: () => SEGURANCA_PADRAO },
  {
    chave: "paginas.marketplace-importar",
    titulo: "Importar do estrangeiro",
    pagina: "/marketplace/importar",
    padrao: () => IMPORTAR_PADRAO,
  },
  { chave: "paginas.legais", titulo: "Páginas legais (textos comuns)", pagina: "/termos", padrao: () => LEGAIS_PADRAO },
];

export const GRUPOS: DefGrupo[] = [];
