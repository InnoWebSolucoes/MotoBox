"use client";

/* ============================================================
   MOTOBOX ADMIN — Provas › Páginas do campeonato
   Os formulários dos textos fixos de cada página do campeonato
   (os documentos "campeonato.*" de lib/conteudo/grupos/geral.ts):
   calendário, resultados, classificação, pilotos, equipas,
   bilhetes e a compra de bilhetes. Cada documento divide-se em
   partes (abas), pela ordem em que aparecem na página.
   ============================================================ */

import type { CampoEsquema } from "@/components/admin/editor/esquema";
import { METODO_VAZIO } from "@/lib/conteudo/grupos/geral";
import { dentro, type ParteDoc } from "@/app/admin/site/EditorPartes";

type Extra = { placeholder?: string; ajuda?: string; largura?: "meia" | "inteira" };

/** Texto curto, em meia linha. */
const t = (chave: string, etiqueta: string, extra: Extra = {}): CampoEsquema =>
  ({ tipo: "texto", chave, etiqueta, largura: "meia", ...extra });
/** Texto curto, na linha inteira. */
const tl = (chave: string, etiqueta: string, extra: Extra = {}): CampoEsquema =>
  ({ tipo: "texto", chave, etiqueta, ...extra });
/** Texto longo. */
const a = (chave: string, etiqueta: string, linhas = 3, ajuda?: string): CampoEsquema =>
  ({ tipo: "area", chave, etiqueta, linhas, ajuda });
/** Objecto do documento numa caixa com título. */
const caixa = (chave: string, etiqueta: string, campos: CampoEsquema[], ajuda?: string): CampoEsquema =>
  ({ tipo: "objecto", chave, etiqueta, campos, ajuda });
/** Campos do mesmo objecto numa caixa com título. */
const secao = (titulo: string, campos: CampoEsquema[], descricao?: string): CampoEsquema =>
  ({ tipo: "secao", titulo, campos, descricao });
const nota = (texto: string): CampoEsquema => ({ tipo: "nota", texto });
const ligacao = (chave: string, etiqueta: string, ajuda?: string): CampoEsquema => caixa(chave, etiqueta, [
  t("texto", "Texto", { ajuda: "Vazio, a ligação não aparece." }),
  t("href", "Para onde leva", { placeholder: "/eventos" }),
], ajuda);
const pesquisa = (ajuda?: string): CampoEsquema => caixa("pesquisa", "Nas pesquisas do Google e no separador do navegador", [
  tl("titulo", "Título"),
  a("descricao", "Descrição", 2),
], ajuda);
const singularPlural = (um: string, varios: string, etiqueta: string, exemplo: string): CampoEsquema[] => [
  t(um, `${etiqueta} (um)`, { placeholder: `{n} ${exemplo}`, ajuda: "{n} passa a ser o número." }),
  t(varios, `${etiqueta} (vários)`, { placeholder: `{n} ${exemplo}s` }),
];

const ANO = "{ano} passa a ser a temporada em curso (Definições › Temporada).";

/** O topo comum às páginas: fotografia, linha pequena, título e texto. */
const topo = (ajudaSobretitulo?: string): CampoEsquema[] => [
  { tipo: "imagem", chave: "foto", etiqueta: "Fotografia de fundo do topo" },
  t("sobretitulo", "Linha pequena por cima do título", { ajuda: ajudaSobretitulo }),
  t("titulo", "Título"),
  a("texto", "Texto por baixo do título", 3),
];

const ESTADOS: CampoEsquema = caixa("estados", "Etiquetas de estado", [
  t("agendado", "Agendada"),
  t("aVenda", "Bilhetes à venda"),
  t("esgotado", "Esgotada"),
  t("aDecorrer", "A decorrer"),
  t("concluido", "Concluída"),
]);

const TABELA_RESULTADOS: CampoEsquema = caixa("tabela", "Tabelas de resultados", [
  nota("Os cabeçalhos das colunas, no computador. Também servem às tabelas da página de cada prova."),
  t("pos", "Posição"),
  t("piloto", "Piloto"),
  t("equipa", "Equipa"),
  t("voltas", "Voltas"),
  t("tempo", "Tempo"),
  t("pts", "Pontos"),
  t("voltaUm", "\"volta\" (no telemóvel, uma)"),
  t("voltaVarias", "\"voltas\" (no telemóvel, várias)"),
  t("ptsCurto", "\"pts\" a seguir aos pontos (telemóvel)"),
  t("melhorVolta", "Melhor volta (ao passar o rato em MV)"),
  t("naoClassificado", "Não classificado (leitores de ecrã)"),
  { tipo: "lista-texto", chave: "legenda", etiqueta: "Legenda por baixo das tabelas", placeholder: "DNF: não terminou" },
]);

/* ---------------- Calendário ---------------- */

const CALENDARIO: ParteDoc[] = [
  {
    chave: "topo", nome: "Topo",
    descricao: "O topo de /calendario e o que aparece nas pesquisas.",
    esquema: [
      pesquisa(ANO),
      ...topo(ANO),
      ligacao("ligacaoEventos", "Ligação por baixo do texto"),
    ],
  },
  {
    chave: "lista", nome: "Lista de provas",
    descricao: "Os números, os filtros, a lista e a nota dos bilhetes.",
    esquema: [
      caixa("numeros", "Números por baixo do topo", [
        t("provas", "Provas"), t("provincias", "Províncias"), t("disciplinas", "Disciplinas"), t("porDisputar", "Por disputar"),
      ]),
      caixa("lista", "Lista e filtros", [
        t("titulo", "Título da lista"),
        ...singularPlural("contadorUm", "contadorVarios", "Contagem", "prova"),
        t("todas", "Filtro de todas as modalidades"),
        t("passadas", "Interruptor das provas passadas"),
        t("vistaLista", "Vista em lista"),
        t("vistaGrelha", "Vista em grelha"),
        t("vazioTitulo", "Sem provas no filtro: título"),
        t("vazioTexto", "Sem provas no filtro: texto"),
        t("rotuloDisciplina", "Nome dos filtros (leitores de ecrã)"),
        t("rotuloVista", "Nome da escolha de vista (leitores de ecrã)"),
      ]),
      caixa("notaBilhetes", "Nota dos bilhetes, no fim da lista", [
        t("etiqueta", "Etiqueta vermelha"),
        t("ligacao", "Ligação para os bilhetes"),
        a("texto", "Texto", 2),
      ], "Só aparece com a bilheteira aberta e alguma prova à venda."),
    ],
  },
  {
    chave: "destaque", nome: "Próxima prova",
    descricao: "O cartão grande com a próxima prova e a contagem decrescente.",
    esquema: [
      caixa("destaque", "Cartão da próxima prova", [
        t("etiqueta", "Linha pequena por cima do título"),
        t("comecaEm", "Por cima da contagem"),
        t("comprar", "Botão de compra"),
        t("esgotado", "Quando está esgotada"),
        t("detalhes", "Botão de detalhes"),
      ]),
      caixa("contagem", "Contagem decrescente", [
        t("dias", "Dias"), t("horas", "Horas"), t("minutos", "Minutos"), t("segundos", "Segundos"),
      ], "Também na página de cada prova."),
    ],
  },
  {
    chave: "linhas", nome: "Linhas das provas",
    descricao: "O que se repete em cada prova da lista (e da grelha).",
    esquema: [
      caixa("linha", "Cada prova da lista", [
        t("ronda", "Ronda", { ajuda: "{ronda} passa a ser o número da ronda." }),
        t("ate", "Entre as duas datas", { placeholder: "a", ajuda: "Ex.: 14 Mar a 15 Mar." }),
        t("desde", "Por cima do preço mais baixo"),
        t("bilhetes", "Ligação para os bilhetes"),
        t("detalhes", "Ligação de uma prova futura"),
        t("resultados", "Ligação de uma prova que já passou"),
        t("verEvento", "Ligação de um evento que já passou"),
        ESTADOS,
      ]),
    ],
  },
  {
    chave: "prova", nome: "Página de cada prova",
    descricao: "Os textos fixos de /calendario/<prova>. Os dados (datas, programa, circuito, bilhetes) editam-se na ficha de cada prova.",
    esquema: [
      dentro("prova", [
        secao("Topo", [
          t("comecaEm", "Por cima da contagem"),
          t("comprar", "Botão de compra"),
          t("esgotado", "Quando está esgotada"),
          t("aDecorrer", "Etiqueta \"a decorrer\""),
          t("terminada", "Prova que já terminou"),
          t("terminado", "Evento que já aconteceu"),
          t("verResultados", "Ligação para os resultados"),
          t("naoEncontrada", "Título no separador de um endereço sem prova"),
        ]),
        caixa("numeros", "Números por baixo do topo", [
          t("data", "Por baixo da data", { ajuda: "{temporada} passa a ser o ano da prova." }),
          t("ronda", "Ronda", { ajuda: "{ronda} passa a ser o número da ronda." }),
          t("rondaTexto", "Por baixo da ronda", { ajuda: "{disciplina} e {campeonato} (o nome do campeonato, em Modalidades)." }),
          t("disciplina", "Por baixo da modalidade"),
          t("tipo", "Por baixo do tipo (eventos)"),
          t("organizacao", "Por baixo do organizador"),
        ]),
        secao("Textos", [
          t("sobreProva", "Título \"Sobre a prova\""),
          t("sobreEvento", "Título \"Sobre o evento\""),
          t("programa", "Título do programa"),
        ]),
        caixa("ficha", "Ficha do circuito", [
          t("tituloProva", "Título (provas)"),
          t("tituloEvento", "Título (eventos)"),
          t("circuito", "Circuito"),
          t("localidade", "Localidade"),
          t("distancia", "Distância"),
          t("voltas", "Voltas"),
          t("disciplina", "Disciplina"),
          t("local", "Local (eventos)"),
          t("tipo", "Tipo (eventos)"),
          t("organizador", "Organizador (eventos)"),
          t("organizacao", "Organização (provas)"),
          t("recorde", "Recorde de volta"),
        ]),
        caixa("bilhetes", "Cartão dos bilhetes", [
          t("titulo", "Título"),
          t("disponiveis", "Lugares disponíveis", { ajuda: "{n} passa a ser o número." }),
          t("comprar", "Botão de compra"),
          t("esgotado", "Quando está esgotada"),
        ]),
        caixa("participacao", "Cartão \"Participação\" (sem venda online)", [
          t("titulo", "Título"),
          t("organizador", "Organizador"),
          a("semVenda", "Sem bilhetes na MotoBox", 2),
          a("fechada", "Com a bilheteira fechada (Definições)", 2),
        ]),
        caixa("partilhar", "Cartão \"Partilhar\"", [
          t("titulo", "Título"),
          t("botao", "Botão de partilhar"),
          t("copiado", "Depois de copiar a ligação"),
        ]),
        caixa("resultados", "Resultados (provas que já terminaram)", [
          t("titulo", "Título"),
          t("arquivo", "Ligação para o arquivo"),
          t("vencedor", "Vencedor", { ajuda: "{nome} passa a ser o nome do vencedor." }),
          t("completa", "Ligação para a classificação completa"),
        ]),
      ]),
    ],
  },
];

/* ---------------- Resultados ---------------- */

const RESULTADOS: ParteDoc[] = [
  {
    chave: "topo", nome: "Arquivo",
    descricao: "A página /resultados: o topo, os números e as corridas por temporada.",
    esquema: [
      pesquisa(),
      ...topo(),
      caixa("numeros", "Números por baixo do topo", [
        t("corridas", "Corridas"), t("vencedores", "Vencedores"), t("temporada", "Temporada (uma)"), t("temporadas", "Temporadas (várias)"),
      ]),
      t("temporada", "Título de cada temporada", { ajuda: "{temporada} passa a ser o ano." }),
      t("emCurso", "Etiqueta da temporada em curso"),
      t("ronda", "Ronda", { ajuda: "{ronda} passa a ser o número da ronda." }),
      t("vencedor", "Por cima do vencedor"),
      t("verCorrida", "Ligação para a corrida"),
      t("vazioTitulo", "Sem resultados: título"),
      a("vazioTexto", "Sem resultados: texto", 2),
    ],
  },
  {
    chave: "tabela", nome: "Tabelas e legenda",
    esquema: [TABELA_RESULTADOS],
  },
  {
    chave: "corrida", nome: "Página de cada corrida",
    descricao: "Os textos fixos de /resultados/<corrida>.",
    esquema: [
      dentro("corrida", [
        secao("Nas pesquisas e no separador", [
          tl("pesquisaTitulo", "Título", { ajuda: "{nome}, {temporada}, {categoria} e {vencedor} passam a ser os da corrida." }),
          a("pesquisaDescricao", "Descrição", 2),
          t("naoEncontrado", "Título de um endereço sem corrida"),
        ]),
        secao("Página", [
          t("vencedor", "Antes do nome do vencedor"),
          t("podio", "Título do pódio"),
          t("arquivo", "Ligação para o arquivo"),
          t("pts", "\"pts\" no pódio"),
          t("classificacao", "Título da classificação"),
          t("melhorVolta", "Cartão da melhor volta"),
          t("outrasCategorias", "Cartão das outras categorias"),
          t("paginaProva", "Botão para a página da prova"),
        ]),
        caixa("resumo", "Cartão \"Resumo\"", [
          t("titulo", "Título"),
          t("categoria", "Categoria"),
          t("partidas", "Partidas"),
          t("classificados", "Classificados"),
          t("desistencias", "Desistências"),
          t("circuito", "Circuito"),
        ]),
      ]),
    ],
  },
];

/* ---------------- Classificação ---------------- */

const CLASSIFICACAO: ParteDoc[] = [
  {
    chave: "topo", nome: "Topo",
    esquema: [
      pesquisa(`${ANO} {campeonato} passa a ser o nome do campeonato (Modalidades).`),
      ...topo(`{campeonato} passa a ser o nome do campeonato (Modalidades) e ${ANO}`),
    ],
  },
  {
    chave: "tabelas", nome: "Tabelas",
    descricao: "As abas, o pódio, as colunas e a legenda.",
    esquema: [
      caixa("abas", "Abas", [
        t("pilotos", "Pilotos"), t("equipas", "Equipas"), t("rotulo", "Nome das abas (leitores de ecrã)"),
      ]),
      t("geral", "Filtro da classificação geral"),
      t("rotuloCategoria", "Nome dos filtros (leitores de ecrã)"),
      t("pts", "\"pts\" no pódio"),
      t("podioLinha", "Linha do pódio", { ajuda: "{vitorias} e {podios} passam a ser os números do piloto." }),
      caixa("colunas", "Cabeçalhos das colunas", [
        t("pos", "Posição"), t("piloto", "Piloto"), t("equipa", "Equipa"), t("base", "Base (equipas)"),
        t("vit", "Vitórias"), t("pod", "Pódios"), t("pole", "Poles"), t("tit", "Títulos"), t("pontos", "Pontos"),
      ]),
      t("linhaPiloto", "Linha de cada piloto (telemóvel)", { ajuda: "{vitorias}, {podios} e {poles}." }),
      t("linhaEquipa", "Linha de cada equipa (telemóvel)", { ajuda: "{vitorias}, {podios} e {titulos}." }),
      ...singularPlural("pilotoUm", "pilotoVarios", "Pilotos de cada equipa", "piloto"),
      caixa("vazioPilotos", "Sem pilotos na categoria", [t("titulo", "Título"), a("texto", "Texto", 2)]),
      caixa("vazioEquipas", "Sem equipas pontuadas", [t("titulo", "Título"), a("texto", "Texto", 2)]),
      caixa("legenda", "Legenda por baixo da tabela", [
        t("vit", "Vitórias"), t("pod", "Pódios"), t("pole", "Poles (pilotos)"), t("tit", "Títulos (equipas)"),
        t("actualizado", "Nota da actualização"),
      ], "Uma linha vazia não aparece."),
    ],
  },
];

/* ---------------- Pilotos ---------------- */

const PILOTOS: ParteDoc[] = [
  {
    chave: "topo", nome: "Lista de pilotos",
    descricao: "O topo de /pilotos, os filtros e os cartões.",
    esquema: [
      pesquisa(),
      ...topo(ANO),
      caixa("filtros", "Filtros", [
        t("todas", "Todas as categorias"),
        t("todasProvincias", "Todas as províncias"),
        t("procurar", "Caixa de procura"),
        t("rotuloCategoria", "Nome dos filtros (leitores de ecrã)"),
        t("rotuloProvincia", "Nome da escolha de província (leitores de ecrã)"),
      ]),
      ...singularPlural("contadorUm", "contadorVarios", "Contagem", "piloto"),
      t("vazioTitulo", "Sem pilotos: título"),
      t("vazioTexto", "Sem pilotos: texto"),
      caixa("cartao", "Cartão de cada piloto", [
        t("campeao", "Títulos", { ajuda: "{n} passa a ser o número de títulos." }),
        t("pts", "Pontos"), t("vit", "Vitórias"), t("pod", "Pódios"),
        t("posicao", "Posição (leitores de ecrã)"),
      ], "Também no plantel de cada equipa."),
    ],
  },
  {
    chave: "piloto", nome: "Página de cada piloto",
    descricao: "Os textos fixos de /pilotos/<piloto>. Os dados (biografia, números, redes) editam-se na ficha de cada piloto.",
    esquema: [
      dentro("piloto", [
        secao("Nas pesquisas e no separador", [
          tl("pesquisaTitulo", "Título", { ajuda: "{nome}, {numero}, {categoria}, {equipa}, {vitorias} e {podios} passam a ser os do piloto." }),
          a("pesquisaDescricao", "Descrição", 2),
          t("naoEncontrado", "Título de um endereço sem piloto"),
        ]),
        secao("Topo", [
          t("campeao", "Títulos", { ajuda: "{n} passa a ser o número de títulos." }),
          t("perfil", "Por cima do nome"),
        ]),
        caixa("numeros", "Números", [
          t("posicao", "Posição"), t("pontos", "Pontos"), t("vitorias", "Vitórias"),
          t("podios", "Pódios"), t("poles", "Poles"), t("corridas", "Corridas"),
          t("naoClassificado", "Sem posição", { placeholder: "NC" }),
        ]),
        caixa("dados", "Dados por baixo da biografia", [
          t("equipa", "Equipa"), t("provincia", "Província"), t("idade", "Idade"),
          t("idadeValor", "Valor da idade", { ajuda: "{n} passa a ser a idade." }),
          t("mota", "Mota"), t("kart", "Kart (karting)"),
        ]),
        caixa("historico", "Histórico de corridas", [
          t("titulo", "Título"), t("prova", "Prova"), t("data", "Data"), t("categoria", "Categoria"),
          t("pos", "Posição"), t("pts", "Pontos"),
        ]),
        caixa("campeonato", "Cartão \"No campeonato\"", [
          t("titulo", "Título"), t("pts", "\"pts\""),
          t("doLider", "Distância ao líder", { ajuda: "{n} passa a ser a diferença de pontos." }),
          t("lider", "Quando é o líder"), t("ligacao", "Ligação para a classificação"),
        ]),
        caixa("carreira", "Cartão \"Números da carreira\"", [
          t("titulo", "Título"), t("estreia", "Estreia"), t("temporadas", "Temporadas"),
          t("melhor", "Melhor resultado"), t("taxa", "Taxa de pódio"), t("titulos", "Títulos"),
          t("nacionalidade", "Nacionalidade"),
        ]),
        caixa("equipa", "Cartão da equipa", [
          t("titulo", "Título"), t("colegas", "Colegas de equipa"), t("pts", "\"pts\""),
        ]),
        caixa("seguir", "Cartão \"Seguir\"", [
          { tipo: "booleano", chave: "mostrar", etiqueta: "Mostrar o cartão" },
          t("titulo", "Título"),
          a("texto", "Texto", 2, "{nome} passa a ser o primeiro nome do piloto."),
          t("botao", "Botão"),
          t("ligacao", "Para onde leva o botão", { placeholder: "/conta" }),
        ]),
      ]),
    ],
  },
];

/* ---------------- Equipas ---------------- */

const EQUIPAS: ParteDoc[] = [
  {
    chave: "topo", nome: "Lista de equipas",
    descricao: "O topo de /equipas, os grupos e os cartões.",
    esquema: [
      pesquisa(),
      ...topo(),
      ligacao("ligacaoClubes", "Ligação por baixo do texto"),
      caixa("numeros", "Números por baixo do topo", [
        t("equipas", "Equipas"), t("clubes", "Clubes"), t("membros", "Membros"), t("provincias", "Províncias"),
      ]),
      caixa("competicao", "Grupo das equipas de competição", [t("titulo", "Título"), a("texto", "Texto", 2)]),
      caixa("clubes", "Grupo dos clubes", [t("titulo", "Título"), a("texto", "Texto", 2)]),
      t("vazioTitulo", "Sem equipas: título"),
      t("vazioTexto", "Sem equipas: texto"),
      caixa("cartao", "Cartão de cada equipa", [
        t("campea", "Títulos", { ajuda: "{n} passa a ser o número de títulos." }),
        t("desde", "Base e fundação", { ajuda: "{base} e {ano} (da fundação)." }),
        t("membros", "Membros"), t("pontos", "Pontos"), t("vitorias", "Vitórias"), t("podios", "Pódios"),
      ]),
      caixa("registar", "Cartão \"Registe o seu clube\"", [
        { tipo: "booleano", chave: "mostrar", etiqueta: "Mostrar o cartão" },
        t("sobretitulo", "Linha pequena por cima do título"),
        t("titulo", "Título"),
        a("texto", "Texto", 3),
        { tipo: "imagem", chave: "foto", etiqueta: "Fotografia" },
        t("botao", "Botão"),
        t("ligacao", "Para onde leva o botão", { placeholder: "/contacto#parcerias" }),
      ]),
    ],
  },
  {
    chave: "equipa", nome: "Página de cada equipa",
    descricao: "Os textos fixos de /equipas/<equipa>. Os dados (descrição, base, plantel) editam-se na ficha de cada equipa.",
    esquema: [
      dentro("equipa", [
        secao("Topo", [
          t("noCampeonato", "Posição no campeonato", { ajuda: "{n} passa a ser a posição." }),
          t("campea", "Títulos", { ajuda: "{n} passa a ser o número de títulos." }),
          t("sobreEquipa", "Por cima do nome (equipas)"),
          t("sobreClube", "Por cima do nome (clubes)"),
          t("pilotos", "Título do plantel"),
          t("naoEncontrada", "Título de um endereço sem equipa"),
        ]),
        caixa("numeros", "Números", [
          t("pontos", "Pontos"), t("vitorias", "Vitórias"), t("podios", "Pódios"), t("titulos", "Títulos"),
        ]),
        caixa("dados", "Dados por baixo da descrição", [
          t("base", "Base"), t("fundacao", "Fundação"), t("responsavel", "Responsável"), t("membros", "Membros"),
        ]),
        caixa("ficha", "Cartão \"Ficha\"", [
          t("titulo", "Título"), t("tipo", "Tipo"), t("provincia", "Província"), t("fundacao", "Fundação"),
          t("membros", "Membros"), t("material", "Material"),
        ]),
        caixa("campeonato", "Cartão \"No campeonato\"", [
          t("titulo", "Título"), t("pts", "\"pts\""), t("texto", "Texto"), t("ligacao", "Ligação para a tabela"),
        ]),
        secao("Outras equipas", [
          t("outrasEquipas", "Título (equipas)"),
          t("outrosClubes", "Título (clubes)"),
        ]),
      ]),
    ],
  },
];

/* ---------------- Bilhetes ---------------- */

const OPCOES_ICONE = [
  { valor: "bilhete", nome: "Bilhete" },
  { valor: "qr", nome: "Código QR" },
  { valor: "verificado", nome: "Visto de verificado" },
  { valor: "telemovel", nome: "Telemóvel" },
  { valor: "banco", nome: "Banco" },
  { valor: "seguro", nome: "Cadeado" },
];

const BILHETES: ParteDoc[] = [
  {
    chave: "topo", nome: "Topo",
    descricao: "O topo de /bilhetes e os cartões das vantagens.",
    esquema: [
      pesquisa(),
      ...topo(),
      {
        tipo: "lista", chave: "vantagens", etiqueta: "Cartões por baixo do topo", nomeItem: "cartão",
        novo: () => ({ icone: "bilhete", titulo: "", texto: "" }),
        resumo: (v) => String(v.titulo ?? ""),
        campos: [
          { tipo: "seleccao", chave: "icone", etiqueta: "Ícone", opcoes: OPCOES_ICONE, largura: "meia" },
          t("titulo", "Título"),
          tl("texto", "Texto"),
        ],
      },
    ],
  },
  {
    chave: "venda", nome: "Lista à venda",
    descricao: "A lista de eventos com bilhetes e as mensagens quando não há nenhum.",
    esquema: [
      t("aVenda", "Título da lista"),
      ...singularPlural("contadorUm", "contadorVarios", "Contagem", "evento"),
      caixa("fechada", "Com a bilheteira fechada (Definições)", [t("titulo", "Título"), a("texto", "Texto", 2)]),
      caixa("semBilhetes", "Sem bilhetes à venda", [t("titulo", "Título"), a("texto", "Texto", 2)]),
      caixa("cartao", "Cartão de cada evento", [
        t("ronda", "Ronda", { ajuda: "{ronda} passa a ser o número da ronda." }),
        t("esgotado", "Esgotado"),
        t("popular", "Etiqueta do bilhete em destaque"),
        t("disponiveis", "Lugares de cada bilhete", { ajuda: "{n} passa a ser o número." }),
        t("aPartirDe", "Por cima do preço mais baixo"),
        t("totalDisponiveis", "Total de lugares", { ajuda: "{n} passa a ser o número." }),
        t("detalhes", "Botão de detalhes"),
        t("comprar", "Botão de compra"),
      ]),
    ],
  },
  {
    chave: "como", nome: "Como funciona e organizadores",
    esquema: [
      caixa("comoFunciona", "Como funciona", [
        tl("titulo", "Título"),
        {
          tipo: "lista", chave: "passos", etiqueta: "Passos", nomeItem: "passo",
          ajuda: "Numerados pela ordem da lista.",
          novo: () => ({ titulo: "", texto: "" }),
          resumo: (p) => String(p.titulo ?? ""),
          campos: [tl("titulo", "Título"), a("texto", "Texto", 2)],
        },
      ]),
      caixa("organizadores", "Cartão para clubes e organizadores", [
        { tipo: "booleano", chave: "mostrar", etiqueta: "Mostrar o cartão" },
        t("sobretitulo", "Linha pequena por cima do título"),
        t("titulo", "Título"),
        a("texto", "Texto", 3),
        { tipo: "imagem", chave: "foto", etiqueta: "Fotografia" },
        t("botao", "Botão"),
        t("ligacao", "Para onde leva o botão", { placeholder: "/contacto#parcerias" }),
        tl("nota", "Nota por baixo do botão"),
      ]),
    ],
  },
  {
    chave: "semVenda", nome: "Compra sem venda",
    descricao: "O que aparece em /bilhetes/<evento> quando não se pode comprar (e o topo dessa página).",
    esquema: [
      caixa("compra", "Topo da página de compra", [
        t("pesquisaTitulo", "Título no separador", { ajuda: "{titulo} passa a ser o nome do evento." }),
        t("sobretitulo", "Linha pequena por cima do título"),
        t("ronda", "Ronda", { ajuda: "{ronda} passa a ser o número da ronda." }),
      ]),
      dentro("semVenda", [
        caixa("esgotado", "Bilhetes esgotados", [t("titulo", "Título"), a("texto", "Texto", 2)]),
        caixa("fechada", "Bilheteira fechada (Definições)", [t("titulo", "Título"), a("texto", "Texto", 2)]),
        caixa("semVenda", "Evento sem venda na MotoBox", [t("titulo", "Título"), a("texto", "Texto", 2)]),
        t("verEvento", "Botão para o evento"),
        t("todos", "Botão para todos os bilhetes"),
      ]),
    ],
  },
];

/* ---------------- Compra de bilhetes ---------------- */

const OPCOES_TIPO_METODO = [
  { valor: "telemovel", nome: "Pagamento no telemóvel (ícone de telemóvel)" },
  { valor: "transferencia", nome: "Transferência bancária (ícone de banco)" },
  { valor: "outro", nome: "Outro (ícone de carteira)" },
];

const COMPRA: ParteDoc[] = [
  {
    chave: "pagamento", nome: "Meios de pagamento",
    descricao: "Os meios que aparecem no passo \"Pagamento\", pela ordem da lista. O pagamento com cartão saiu da compra por agora.",
    esquema: [
      dentro("pagamento", [
        nota("Atenção: o pagamento na MotoBox ainda é simulado. Nenhum meio está ligado a um banco: a compra emite os bilhetes sem cobrar nada."),
        {
          tipo: "lista", chave: "metodos", etiqueta: "Meios de pagamento", nomeItem: "meio de pagamento",
          novo: () => ({ ...METODO_VAZIO(), id: `metodo-${Math.random().toString(36).slice(2, 7)}` }),
          resumo: (m) => `${String(m.nome || "Sem nome")}${m.activo === false ? " (escondido)" : ""}`,
          campos: [
            { tipo: "booleano", chave: "activo", etiqueta: "Mostrar na compra", descricao: "Desligado, o meio fica guardado mas não aparece." },
            { tipo: "seleccao", chave: "tipo", etiqueta: "Tipo", opcoes: OPCOES_TIPO_METODO, largura: "meia" },
            t("nome", "Nome"),
            tl("descricao", "Descrição curta (na lista)"),
            secao("Detalhe (aparece quando o meio está escolhido)", [
              t("detalheTitulo", "Título"),
              a("detalheTexto", "Texto", 3, "{telefone} passa a ser o telemóvel que o comprador indicou."),
              {
                tipo: "lista", chave: "linhas", etiqueta: "Dados (ex.: IBAN)", nomeItem: "linha",
                ajuda: "{referencia} passa a ser a referência da prova (ex.: MBX-GP-HUA).",
                novo: () => ({ rotulo: "", valor: "" }),
                resumo: (l) => [l.rotulo, l.valor].filter(Boolean).join(": "),
                campos: [t("rotulo", "Nome"), t("valor", "Valor")],
              },
              a("nota", "Nota no fim", 2),
            ]),
          ],
        },
        t("semTelefone", "Em {telefone}, sem telemóvel indicado"),
        a("semMetodos", "Sem nenhum meio activo", 2),
        t("titulo", "Título do passo"),
      ]),
    ],
  },
  {
    chave: "passos", nome: "Bilhetes e dados",
    descricao: "Os dois primeiros passos: escolher os bilhetes e os dados de quem compra.",
    esquema: [
      t("todos", "Ligação para todos os bilhetes"),
      caixa("passos", "Nomes dos passos", [
        t("bilhetes", "1"), t("dados", "2"), t("pagamento", "3"), t("bilhete", "4"),
        t("concluido", "Passo feito (leitores de ecrã)"), t("rotulo", "Nome dos passos (leitores de ecrã)"),
      ]),
      caixa("escolha", "Escolher os bilhetes", [
        t("titulo", "Título"),
        t("maisProcurado", "Etiqueta do bilhete em destaque"),
        tl("disponiveis", "Lugares disponíveis", { ajuda: "{n} passa a ser o número." }),
        t("menos", "Botão \"menos\" (leitores de ecrã)", { ajuda: "{nome} passa a ser o tipo de bilhete." }),
        t("mais", "Botão \"mais\" (leitores de ecrã)"),
      ]),
      dentro("dados", [
        secao("Os dados de quem compra", [
          t("titulo", "Título"),
          caixa("nome", "Nome", [t("rotulo", "Etiqueta"), t("exemplo", "Exemplo dentro da caixa")]),
          caixa("email", "Email", [t("rotulo", "Etiqueta"), t("exemplo", "Exemplo dentro da caixa")]),
          caixa("telefone", "Telemóvel", [t("rotulo", "Etiqueta"), t("exemplo", "Exemplo dentro da caixa")]),
          caixa("bi", "BI", [t("rotulo", "Etiqueta"), t("exemplo", "Exemplo dentro da caixa")]),
          t("sessao", "Antes do email da conta"),
          a("privacidade", "Nota de privacidade", 2),
          a("motivoSessao", "Pedido para entrar ou criar conta", 2),
          caixa("erros", "Mensagens de erro", [t("nome", "Nome"), t("email", "Email"), t("telefone", "Telemóvel")]),
        ]),
      ]),
    ],
  },
  {
    chave: "resumo", nome: "Resumo e botões",
    descricao: "A caixa do resumo, à direita (ou por baixo, no telemóvel).",
    esquema: [
      dentro("resumo", [
        t("titulo", "Título"),
        t("vazio", "Sem bilhetes escolhidos"),
        t("subtotal", "Subtotal"),
        t("taxa", "Taxa de serviço"),
        t("total", "Total"),
        a("notaTaxa", "Nota da taxa", 2),
        t("continuar", "Botão do passo 1"),
        t("irPagamento", "Botão do passo 2"),
        t("pagar", "Botão de pagar", { ajuda: "{valor} passa a ser o total." }),
        t("aVerificar", "Enquanto paga"),
        t("voltar", "Botão de voltar"),
        tl("seguro", "Nota no fim da caixa"),
      ]),
    ],
  },
  {
    chave: "emitidos", nome: "Bilhetes emitidos",
    descricao: "O último passo: os bilhetes com o código QR.",
    esquema: [
      dentro("emitidos", [
        t("titulo", "Título"),
        ...singularPlural("emitimosUm", "emitimosVarios", "Bilhetes emitidos", "bilhete"),
        tl("guardar", "Aviso para guardar"),
        t("data", "Data"), t("local", "Local"), t("portador", "Portador"), t("codigo", "Código"),
        t("imprimir", "Botão de imprimir"),
        t("voltarCalendario", "Voltar (provas)"),
        t("voltarEventos", "Voltar (eventos)"),
        a("entrada", "Nota sobre a entrada", 2),
      ]),
    ],
  },
];

/* ---------------- Os documentos ---------------- */

export interface DocCampeonato {
  /** Parte final da chave, também usada no endereço (?doc=…). */
  id: string;
  chave: string;
  nome: string;
  pagina: string;
  descricao: string;
  partes: ParteDoc[];
}

export const DOCS_CAMPEONATO: DocCampeonato[] = [
  { id: "calendario", chave: "campeonato.calendario", nome: "Calendário", pagina: "/calendario",
    descricao: "A página /calendario e a página de cada prova.", partes: CALENDARIO },
  { id: "resultados", chave: "campeonato.resultados", nome: "Resultados", pagina: "/resultados",
    descricao: "O arquivo de resultados e a página de cada corrida.", partes: RESULTADOS },
  { id: "classificacao", chave: "campeonato.classificacao", nome: "Classificação", pagina: "/classificacao",
    descricao: "A tabela do campeonato, de pilotos e de equipas.", partes: CLASSIFICACAO },
  { id: "pilotos", chave: "campeonato.pilotos", nome: "Pilotos", pagina: "/pilotos",
    descricao: "A lista de pilotos e a página de cada piloto.", partes: PILOTOS },
  { id: "equipas", chave: "campeonato.equipas", nome: "Equipas", pagina: "/equipas",
    descricao: "A lista de equipas e clubes e a página de cada um.", partes: EQUIPAS },
  { id: "bilhetes", chave: "campeonato.bilhetes", nome: "Bilhetes", pagina: "/bilhetes",
    descricao: "A página /bilhetes e as mensagens quando um evento não tem venda.", partes: BILHETES },
  { id: "compra", chave: "campeonato.compra", nome: "Compra de bilhetes", pagina: "/bilhetes",
    descricao: "Os passos da compra, os meios de pagamento e os bilhetes emitidos.", partes: COMPRA },
];
