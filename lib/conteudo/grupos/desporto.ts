/* ============================================================
   Conteúdo editável — Desporto
   - "modalidades": a ficha de cada modalidade (nome, grupo,
     descrição, fotografia, disciplinas, categorias) e o guia
     completo da sua página (o que é, classes, a cena em Angola,
     campeonatos lá fora, como começar, fontes).
   - "paginas.desporto": todos os textos fixos de /desporto e das
     páginas das modalidades, as federações, e as definições do
     campeonato que estavam escritas no código (categorias que
     pontuam, ordem das categorias, data de verificação).
   - "desporto.equipas": o que as equipas mostram e não tem coluna
     na base de dados (a fotografia de capa).
   O texto de partida é o que o site mostrava antes do painel.
   ============================================================ */

import { CATEGORIAS_CAMPEONATO, CATEGORIAS_PILOTO, MODALIDADES } from "@/lib/desporto";
import { CONTEUDO_MODALIDADE, VERIFICADO_EM } from "@/lib/desporto-conteudo";
import type { DefDoc, DefGrupo } from "../registo-tipos";

/* ---------------- Página Desporto ---------------- */

/** Ligação de uma secção para a página completa ("Tabela completa", "Arquivo"…). */
export interface TituloSeccaoDesporto {
  sobretitulo: string;
  titulo: string;
  /** Texto da ligação à direita do título. */
  ligacao: string;
}

export interface SeccaoComVazio extends TituloSeccaoDesporto {
  vazioTitulo: string;
  vazioTexto: string;
}

/** Uma federação no bloco "Quem organiza". */
export interface FederacaoDesporto {
  sigla: string;
  nome: string;
  texto: string;
  fontes: { nome: string; url: string }[];
  /** Endereços (slugs) das modalidades que organiza: viram pílulas com o nome. */
  modalidades: string[];
}

/**
 * Textos de /desporto, das páginas das modalidades e definições do campeonato.
 * Nos textos, {ano} é o ano da temporada, {campeonato} o nome do campeonato,
 * {modalidade} o nome da modalidade, {categorias} as categorias da modalidade
 * e {data} a data de verificação dos guias.
 */
export interface PaginaDesporto {
  campeonato: {
    /** Nome do campeonato (ex.: "Campeonato Nacional"). */
    nome: string;
    /** Categorias de piloto que pontuam para a classificação geral. */
    categorias: string[];
    /** Todas as categorias de piloto, pela ordem das pílulas em Pilotos e Classificação. */
    categoriasPiloto: string[];
    /** Mês da última verificação dos guias. */
    verificadoEm: string;
  };
  entrada: {
    pesquisaTitulo: string;
    pesquisaDescricao: string;
    foto: string;
    sobretitulo: string;
    titulo: string;
    texto: string;
    numeros: { provas: string; corridas: string; pilotos: string; modalidades: string; porDisputar: string };
  };
  proximaProva: { etiqueta: string; ronda: string; bilhetes: string; detalhes: string; comecaEm: string };
  classificacao: SeccaoComVazio;
  resultados: SeccaoComVazio;
  calendario: SeccaoComVazio;
  pilotos: TituloSeccaoDesporto;
  equipas: TituloSeccaoDesporto;
  modalidades: {
    sobretitulo: string;
    titulo: string;
    etiquetaPrincipal: string;
    proximaPrincipal: string;
    pilulaGuia: string;
    semProvas: string;
    proxima: string;
    ultima: string;
    proximaProva: string;
    ultimaProva: string;
    conhecer: string;
  };
  outras: { sobretitulo: string; titulo: string; texto: string };
  federacoes: { sobretitulo: string; titulo: string; rotuloFontes: string; lista: FederacaoDesporto[] };
  organiza: { titulo: string; href: string };
  modalidade: {
    pesquisaSufixo: string;
    sobretituloPrincipal: string;
    sobretituloCompeticao: string;
    sobretituloSemProvas: string;
    notaFoto: string;
    indiceCampeonato: string;
    indiceCalendario: string;
    indiceProvas: string;
    guiaTitulo: string;
    guiaTexto: string;
    voltar: string;
    provas: TituloSeccaoDesporto;
    resultados: SeccaoComVazio;
    pilotos: TituloSeccaoDesporto;
    naMotobox: {
      titulo: string;
      comProvasTexto: string;
      comProvasLigacao: string;
      semProvasTitulo: string;
      semProvasTexto: string;
      semProvasLigacao: string;
    };
    arquivo: {
      sobretitulo: string;
      titulo: string;
      texto: string;
      corridas: string;
      vencedores: string;
      temporadas: string;
      legenda: string;
      voltar: string;
    };
  };
  guia: {
    seccoes: Record<"oQueE" | "classes" | "angola" | "internacional" | "comecar" | "fontes", { nome: string; sobretitulo: string }>;
    emResumo: string;
    maquinas: string;
    equipamento: string;
    marcos: string;
    lusofonia: string;
    comoAcompanhar: string;
    seguranca: string;
    nestaPagina: string;
    verificacao: string;
  };
}

const SEM_RESULTADOS = {
  vazioTitulo: "Sem resultados publicados",
  vazioTexto: "Os resultados aparecem aqui assim que a primeira corrida da temporada terminar.",
};

export const PAGINA_DESPORTO_PADRAO = (): PaginaDesporto => ({
  campeonato: {
    nome: "Campeonato Nacional",
    categorias: [...CATEGORIAS_CAMPEONATO],
    categoriasPiloto: [...CATEGORIAS_PILOTO],
    verificadoEm: VERIFICADO_EM,
  },
  entrada: {
    pesquisaTitulo: "Desporto",
    pesquisaDescricao:
      "A competição a motor em Angola, modalidade a modalidade: motocross e Campeonato Nacional, enduro, rally-raid, velocidade, moto 4 e quads, karting e automobilismo. Calendário, resultados, pilotos, equipas e a cena em Angola.",
    foto: "mxgp",
    sobretitulo: "Temporada {ano}",
    titulo: "Desporto",
    texto:
      "A competição a motor em Angola: o Campeonato Nacional, com o calendário, a classificação, os resultados, os pilotos e as equipas, e cada modalidade com a sua página, do motocross ao karting.",
    numeros: {
      provas: "Provas",
      corridas: "Corridas disputadas",
      pilotos: "Pilotos",
      modalidades: "Modalidades",
      porDisputar: "Por disputar",
    },
  },
  proximaProva: {
    etiqueta: "Próxima prova",
    ronda: "Ronda {ronda}",
    bilhetes: "Bilhetes",
    detalhes: "Ver detalhes",
    comecaEm: "Começa em",
  },
  classificacao: {
    sobretitulo: "{campeonato} {ano}",
    titulo: "Classificação",
    ligacao: "Tabela completa",
    vazioTitulo: "Classificação por publicar",
    vazioTexto: "A tabela aparece depois da primeira prova pontuável da temporada.",
  },
  resultados: { sobretitulo: "Arquivo", titulo: "Últimos resultados", ligacao: "Arquivo", ...SEM_RESULTADOS },
  calendario: {
    sobretitulo: "Temporada {ano}",
    titulo: "Calendário",
    ligacao: "Todas as provas",
    vazioTitulo: "Sem provas agendadas",
    vazioTexto: "As próximas provas aparecem aqui assim que forem anunciadas.",
  },
  pilotos: { sobretitulo: "Grelha", titulo: "Pilotos", ligacao: "Todos os pilotos" },
  equipas: { sobretitulo: "Estruturas", titulo: "Equipas", ligacao: "Todas as equipas" },
  modalidades: {
    sobretitulo: "Competição",
    titulo: "Modalidades",
    etiquetaPrincipal: "Campeonato Nacional",
    proximaPrincipal: "Próxima prova",
    pilulaGuia: "Guia",
    semProvas: "Guia e cena em Angola",
    proxima: "Próxima:",
    ultima: "Última:",
    proximaProva: "Próxima prova",
    ultimaProva: "Última prova",
    conhecer: "Conhecer a modalidade",
  },
  outras: {
    sobretitulo: "Tudo o que tem motor",
    titulo: "Outras modalidades",
    texto:
      "Cada uma tem página própria: o que é, as classes, quem corre em Angola, os campeonatos de referência e como começar. Com fontes.",
  },
  federacoes: {
    sobretitulo: "Federações",
    titulo: "Quem organiza",
    rotuloFontes: "Fontes:",
    lista: [
      {
        sigla: "FAM",
        nome: "Federação Angolana de Motociclismo",
        texto: "Federação das motas desde 2024, membro da FIM desde 2025: motocross, velocidade e o resto do motociclismo.",
        fontes: [{ nome: "FIM", url: "https://www.fim-moto.com/en/fim/continental-unions-national-federations/fim-africa/federations/fam" }],
        modalidades: ["motocross", "velocidade"],
      },
      {
        sigla: "FADM",
        nome: "Federação Angolana de Desportos Motorizados",
        texto: "O membro angolano da FIA. Em 2026 organiza a velocidade automóvel, o rali-raid, o karting e o drift e drag.",
        fontes: [
          { nome: "FIA", url: "https://www.fia.com/members/region/africa-4/member_club/sport-1" },
          { nome: "FADM", url: "https://www.fadm.ao/wp-content/uploads/2026/04/Calendarios-FADM.pdf" },
        ],
        modalidades: ["rally", "automobilismo"],
      },
    ],
  },
  organiza: { titulo: "Organiza provas? Fale connosco", href: "/contacto" },
  modalidade: {
    pesquisaSufixo: "O que é, classes, a cena em Angola, os campeonatos de referência e como começar.",
    sobretituloPrincipal: "{campeonato} {ano}",
    sobretituloCompeticao: "Desporto · Temporada {ano}",
    sobretituloSemProvas: "Desporto · Outras modalidades",
    notaFoto: "Fotografia ilustrativa.",
    indiceCampeonato: "Campeonato",
    indiceCalendario: "Calendário",
    indiceProvas: "Provas",
    guiaTitulo: "Conhecer a modalidade",
    guiaTexto: "O que é, as classes, a cena em Angola, os campeonatos de referência e como começar. Com fontes.",
    voltar: "Todos os desportos",
    provas: { sobretitulo: "Temporada {ano}", titulo: "Provas", ligacao: "Calendário" },
    resultados: { sobretitulo: "Arquivo", titulo: "Resultados", ligacao: "Arquivo", ...SEM_RESULTADOS },
    pilotos: { sobretitulo: "Categoria {categorias}", titulo: "Pilotos", ligacao: "Todos os pilotos" },
    naMotobox: {
      titulo: "Na MotoBox",
      comProvasTexto: "O calendário, os resultados e os pilotos desta modalidade estão no topo da página.",
      comProvasLigacao: "Ver provas e resultados",
      semProvasTitulo: "Sem provas no calendário da MotoBox por agora",
      semProvasTexto:
        "Quando um clube, uma associação ou a federação publicar provas desta modalidade na MotoBox, o calendário, os resultados e os pilotos aparecem nesta página.",
      semProvasLigacao: "Organiza provas? Fale connosco",
    },
    arquivo: {
      sobretitulo: "{modalidade} · Arquivo",
      titulo: "Resultados",
      texto: "Corrida a corrida: classificação completa, tempos, pontos e desistências.",
      corridas: "Corridas registadas",
      vencedores: "Vencedores diferentes",
      temporadas: "Temporadas",
      legenda: "DNF: não terminou · DNS: não partiu · DSQ: desclassificado",
      voltar: "{modalidade}",
    },
  },
  guia: {
    seccoes: {
      oQueE: { nome: "O que é", sobretitulo: "Guia" },
      classes: { nome: "Classes e categorias", sobretitulo: "Quem corre com quê" },
      angola: { nome: "Em Angola", sobretitulo: "A cena nacional" },
      internacional: { nome: "Lá fora", sobretitulo: "Campeonatos de referência" },
      comecar: { nome: "Como começar", sobretitulo: "Primeiros passos" },
      fontes: { nome: "Fontes", sobretitulo: "De onde vem esta informação" },
    },
    emResumo: "Em resumo",
    maquinas: "Máquinas e custos",
    equipamento: "Equipamento de protecção",
    marcos: "Marcos",
    lusofonia: "Ligações lusófonas e africanas",
    comoAcompanhar: "Como acompanhar:",
    seguranca: "Segurança primeiro",
    nestaPagina: "Nesta página",
    verificacao:
      "Informação verificada em {data}. Regulamentos, preços e calendários mudam: confirme sempre junto da federação, do clube ou do organizador.",
  },
});

/* ---------------- Equipas ---------------- */

/** O que as equipas mostram e não tem coluna na tabela `equipas`, por slug da equipa. */
export type ExtrasEquipas = Record<string, { foto?: string }>;

/* ---------------- Registo ---------------- */

export const GRUPOS: DefGrupo[] = [
  {
    grupo: "modalidades",
    titulo: "Modalidades",
    pagina: (chave) => `/desporto/${chave}`,
    padrao: () =>
      MODALIDADES.map((m) => ({
        chave: m.slug,
        titulo: m.nome,
        dados: { ...m, guia: CONTEUDO_MODALIDADE[m.slug] ?? null },
      })),
  },
];

export const DOCS: DefDoc[] = [
  { chave: "paginas.desporto", titulo: "Desporto (página da secção)", pagina: "/desporto", padrao: PAGINA_DESPORTO_PADRAO },
  { chave: "desporto.equipas", titulo: "Equipas: fotografias de capa", pagina: "/equipas", padrao: (): ExtrasEquipas => ({}) },
];
