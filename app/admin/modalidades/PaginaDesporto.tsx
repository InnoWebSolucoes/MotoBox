"use client";

/* ============================================================
   MOTOBOX ADMIN — Página Desporto
   O documento "paginas.desporto": os textos fixos de /desporto
   e das páginas das modalidades, as federações e as definições
   do campeonato. Separado em partes, pela ordem da página.
   ============================================================ */

import { useState } from "react";
import { Abas, Aviso, ListaTexto } from "@/components/admin/kit";
import { EditorDoc } from "@/components/admin/editor/EditorDoc";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";
import { EscolherVarios, useConfigDesporto } from "../provas/_desporto/campos";

type Parte = "entrada" | "campeonato" | "modalidades" | "federacoes" | "paginas" | "guias" | "definicoes";

const PARTES: { chave: Parte; nome: string }[] = [
  { chave: "entrada", nome: "Topo e números" },
  { chave: "campeonato", nome: "Blocos do campeonato" },
  { chave: "modalidades", nome: "Cartões das modalidades" },
  { chave: "federacoes", nome: "Quem organiza" },
  { chave: "paginas", nome: "Páginas das modalidades" },
  { chave: "guias", nome: "Títulos dos guias" },
  { chave: "definicoes", nome: "Definições do campeonato" },
];

/** Sobretítulo, título e ligação de um bloco; com `vazio`, também o texto de quando não há nada. */
const bloco = (chave: string, etiqueta: string, ajuda: string, vazio = false): CampoEsquema => ({
  tipo: "objecto", chave, etiqueta, ajuda, campos: [
    { tipo: "texto", chave: "sobretitulo", etiqueta: "Sobretítulo", largura: "meia" },
    { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
    { tipo: "texto", chave: "ligacao", etiqueta: "Texto da ligação (à direita)", largura: "meia" },
    ...(vazio ? [
      { tipo: "texto", chave: "vazioTitulo", etiqueta: "Quando não há nada: título", largura: "meia" },
      { tipo: "area", chave: "vazioTexto", etiqueta: "Quando não há nada: texto", linhas: 2 },
    ] as CampoEsquema[] : []),
  ],
});

const ESQUEMA_ENTRADA: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "entrada", etiqueta: "Topo da página Desporto", campos: [
      { tipo: "imagem", chave: "foto", etiqueta: "Fotografia de fundo" },
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Sobretítulo", largura: "meia", ajuda: "{ano} é o ano da temporada." },
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
      {
        tipo: "objecto", chave: "numeros", etiqueta: "Números da temporada", ajuda: "Os números contam-se sozinhos; aqui muda-se o que se escreve por baixo.",
        campos: [
          { tipo: "texto", chave: "provas", etiqueta: "Provas", largura: "meia" },
          { tipo: "texto", chave: "corridas", etiqueta: "Corridas disputadas", largura: "meia" },
          { tipo: "texto", chave: "pilotos", etiqueta: "Pilotos", largura: "meia" },
          { tipo: "texto", chave: "modalidades", etiqueta: "Modalidades", largura: "meia" },
          { tipo: "texto", chave: "porDisputar", etiqueta: "Por disputar", largura: "meia" },
        ],
      },
      { tipo: "texto", chave: "pesquisaTitulo", etiqueta: "Título nos motores de busca", largura: "meia" },
      { tipo: "area", chave: "pesquisaDescricao", etiqueta: "Descrição nos motores de busca", linhas: 3,
        ajuda: "O resumo que o Google mostra por baixo do título. Não aparece na página." },
    ],
  },
];

const ESQUEMA_CAMPEONATO: CampoEsquema[] = [
  { tipo: "nota", texto: "Os blocos do campeonato aparecem em Desporto e na página da modalidade em destaque (Motocross)." },
  {
    tipo: "objecto", chave: "proximaProva", etiqueta: "Próxima prova em destaque", campos: [
      { tipo: "texto", chave: "etiqueta", etiqueta: "Etiqueta vermelha", largura: "meia" },
      { tipo: "texto", chave: "ronda", etiqueta: "Ronda", largura: "meia", ajuda: "{ronda} é o número da ronda." },
      { tipo: "texto", chave: "bilhetes", etiqueta: "Botão de bilhetes", largura: "meia" },
      { tipo: "texto", chave: "detalhes", etiqueta: "Botão de detalhes", largura: "meia" },
      { tipo: "texto", chave: "comecaEm", etiqueta: "Por cima da contagem", largura: "meia" },
    ],
  },
  bloco("classificacao", "Classificação", "{campeonato} é o nome do campeonato e {ano} o ano.", true),
  bloco("resultados", "Últimos resultados", "", true),
  bloco("calendario", "Calendário", "{ano} é o ano da temporada.", true),
  bloco("pilotos", "Pilotos", ""),
  bloco("equipas", "Equipas", ""),
];

const ESQUEMA_MODALIDADES: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "modalidades", etiqueta: "Bloco Modalidades", campos: [
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Sobretítulo", largura: "meia" },
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      { tipo: "texto", chave: "etiquetaPrincipal", etiqueta: "Etiqueta do cartão em destaque", largura: "meia" },
      { tipo: "texto", chave: "proximaPrincipal", etiqueta: "Cartão em destaque: \"Próxima prova\"", largura: "meia" },
      { tipo: "texto", chave: "pilulaGuia", etiqueta: "Cartão em destaque: atalho para o guia", largura: "meia" },
      { tipo: "texto", chave: "semProvas", etiqueta: "Cartão sem provas", largura: "meia" },
      { tipo: "texto", chave: "proxima", etiqueta: "Antes da próxima prova (cartões ao lado)", largura: "meia" },
      { tipo: "texto", chave: "ultima", etiqueta: "Antes da última prova (cartões ao lado)", largura: "meia" },
      { tipo: "texto", chave: "proximaProva", etiqueta: "\"Próxima prova\" (cartões de baixo)", largura: "meia" },
      { tipo: "texto", chave: "ultimaProva", etiqueta: "\"Última prova\" (cartões de baixo)", largura: "meia" },
      { tipo: "texto", chave: "conhecer", etiqueta: "Ligação dos cartões", largura: "meia" },
    ],
  },
  {
    tipo: "objecto", chave: "outras", etiqueta: "Bloco Outras modalidades",
    ajuda: "Aparece só quando há modalidades no grupo \"Outras modalidades\".", campos: [
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Sobretítulo", largura: "meia" },
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 2 },
    ],
  },
];

const ESQUEMA_PAGINAS: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "modalidade", etiqueta: "Página de cada modalidade",
    ajuda: "{campeonato}, {ano}, {modalidade} e {categorias} trocam-se pelos valores de cada página.",
    campos: [
      { tipo: "texto", chave: "sobretituloPrincipal", etiqueta: "Sobretítulo da modalidade em destaque", largura: "meia" },
      { tipo: "texto", chave: "sobretituloCompeticao", etiqueta: "Sobretítulo das modalidades com provas", largura: "meia" },
      { tipo: "texto", chave: "sobretituloSemProvas", etiqueta: "Sobretítulo das modalidades sem provas", largura: "meia" },
      { tipo: "texto", chave: "notaFoto", etiqueta: "Nota da fotografia", largura: "meia" },
      { tipo: "texto", chave: "indiceCampeonato", etiqueta: "Índice: campeonato", largura: "meia" },
      { tipo: "texto", chave: "indiceCalendario", etiqueta: "Índice: calendário", largura: "meia" },
      { tipo: "texto", chave: "indiceProvas", etiqueta: "Índice: provas", largura: "meia" },
      { tipo: "texto", chave: "voltar", etiqueta: "Botão de regresso a Desporto", largura: "meia" },
      { tipo: "texto", chave: "guiaTitulo", etiqueta: "Título por cima do guia", largura: "meia" },
      { tipo: "area", chave: "guiaTexto", etiqueta: "Texto por cima do guia", linhas: 2 },
      { tipo: "texto", chave: "pesquisaSufixo", etiqueta: "Fim da descrição nos motores de busca",
        ajuda: "Junta-se à descrição de cada modalidade no resumo do Google." },
      bloco("provas", "Bloco Provas", "{ano} é o ano da temporada."),
      bloco("resultados", "Bloco Resultados", "", true),
      bloco("pilotos", "Bloco Pilotos", "{categorias} são as categorias da modalidade."),
      {
        tipo: "objecto", chave: "naMotobox", etiqueta: "Caixa \"Na MotoBox\" (ao lado do guia)", campos: [
          { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
          { tipo: "nota", texto: "Com provas no calendário:" },
          { tipo: "area", chave: "comProvasTexto", etiqueta: "Texto", linhas: 2 },
          { tipo: "texto", chave: "comProvasLigacao", etiqueta: "Ligação", largura: "meia" },
          { tipo: "nota", texto: "Sem provas no calendário:" },
          { tipo: "texto", chave: "semProvasTitulo", etiqueta: "Título" },
          { tipo: "area", chave: "semProvasTexto", etiqueta: "Texto", linhas: 3 },
          { tipo: "texto", chave: "semProvasLigacao", etiqueta: "Ligação (leva a Contacto)", largura: "meia" },
        ],
      },
      {
        tipo: "objecto", chave: "arquivo", etiqueta: "Arquivo de resultados da modalidade", campos: [
          { tipo: "texto", chave: "sobretitulo", etiqueta: "Sobretítulo", largura: "meia" },
          { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
          { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 2 },
          { tipo: "texto", chave: "corridas", etiqueta: "Número: corridas", largura: "meia" },
          { tipo: "texto", chave: "vencedores", etiqueta: "Número: vencedores", largura: "meia" },
          { tipo: "texto", chave: "temporadas", etiqueta: "Número: temporadas", largura: "meia" },
          { tipo: "texto", chave: "voltar", etiqueta: "Botão de regresso", largura: "meia" },
          { tipo: "texto", chave: "legenda", etiqueta: "Legenda das siglas" },
        ],
      },
    ],
  },
];

const secaoGuia = (chave: string, etiqueta: string): CampoEsquema => ({
  tipo: "objecto", chave, etiqueta, campos: [
    { tipo: "texto", chave: "nome", etiqueta: "Título (e nome no índice)", largura: "meia" },
    { tipo: "texto", chave: "sobretitulo", etiqueta: "Sobretítulo", largura: "meia" },
  ],
});

const ESQUEMA_GUIAS: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "guia", etiqueta: "Títulos fixos dos guias", ajuda: "Iguais em todas as modalidades. O texto de cada guia edita-se na modalidade.",
    campos: [
      {
        tipo: "objecto", chave: "seccoes", etiqueta: "As seis partes", campos: [
          secaoGuia("oQueE", "1. O que é"),
          secaoGuia("classes", "2. Classes"),
          secaoGuia("angola", "3. Em Angola"),
          secaoGuia("internacional", "4. Lá fora"),
          secaoGuia("comecar", "5. Como começar"),
          secaoGuia("fontes", "6. Fontes"),
        ],
      },
      { tipo: "texto", chave: "emResumo", etiqueta: "Caixa \"Em resumo\"", largura: "meia" },
      { tipo: "texto", chave: "nestaPagina", etiqueta: "Índice \"Nesta página\"", largura: "meia" },
      { tipo: "texto", chave: "maquinas", etiqueta: "Subtítulo das máquinas", largura: "meia" },
      { tipo: "texto", chave: "equipamento", etiqueta: "Subtítulo do equipamento", largura: "meia" },
      { tipo: "texto", chave: "marcos", etiqueta: "Subtítulo dos marcos", largura: "meia" },
      { tipo: "texto", chave: "lusofonia", etiqueta: "Subtítulo das ligações lusófonas", largura: "meia" },
      { tipo: "texto", chave: "comoAcompanhar", etiqueta: "Antes de \"como acompanhar\"", largura: "meia" },
      { tipo: "texto", chave: "seguranca", etiqueta: "Caixa de segurança", largura: "meia" },
      { tipo: "area", chave: "verificacao", etiqueta: "Nota no fim das fontes", linhas: 2, ajuda: "{data} é a data de verificação (em Definições do campeonato)." },
    ],
  },
];

const objecto = (v: unknown): Valor => (v && typeof v === "object" && !Array.isArray(v) ? (v as Valor) : {});
const textos = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

function Partes({ dados, mudar }: { dados: Valor; mudar: (d: Valor) => void }) {
  const [parte, setParte] = useState<Parte>("entrada");
  const config = useConfigDesporto();
  const opcoesModalidades = config.modalidades.map((m) => ({ valor: m.slug, nome: m.nome }));
  const campeonato = objecto(dados.campeonato);
  const categoriasPiloto = textos(campeonato.categoriasPiloto);

  const esquemaFederacoes: CampoEsquema[] = [
    {
      tipo: "objecto", chave: "federacoes", etiqueta: "Bloco Quem organiza", campos: [
        { tipo: "texto", chave: "sobretitulo", etiqueta: "Sobretítulo", largura: "meia" },
        { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
        { tipo: "texto", chave: "rotuloFontes", etiqueta: "Antes das fontes", largura: "meia" },
        {
          tipo: "lista", chave: "lista", etiqueta: "Federações", nomeItem: "federação",
          resumo: (f) => [f.sigla, f.nome].filter(Boolean).join(" · "),
          novo: () => ({ sigla: "", nome: "", texto: "", fontes: [], modalidades: [] }),
          campos: [
            { tipo: "texto", chave: "sigla", etiqueta: "Sigla", largura: "meia", placeholder: "FAM" },
            { tipo: "texto", chave: "nome", etiqueta: "Nome completo", largura: "meia" },
            { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
            {
              tipo: "lista", chave: "fontes", etiqueta: "Fontes", nomeItem: "fonte",
              resumo: (f) => String(f.nome ?? ""), novo: () => ({ nome: "", url: "" }),
              campos: [
                { tipo: "texto", chave: "nome", etiqueta: "Nome", largura: "meia", placeholder: "FIM" },
                { tipo: "url", chave: "url", etiqueta: "Endereço", largura: "meia", placeholder: "https://…" },
              ],
            },
            {
              tipo: "personalizado", chave: "modalidades", etiqueta: "Modalidades",
              render: (v, m) => (
                <EscolherVarios etiqueta="Modalidades que organiza" valor={v} mudar={m} opcoes={opcoesModalidades}
                  ajuda="Aparecem como atalhos para a página de cada uma." />
              ),
            },
          ],
        },
      ],
    },
    {
      tipo: "objecto", chave: "organiza", etiqueta: "Cartão vermelho \"Organiza provas?\"", campos: [
        { tipo: "texto", chave: "titulo", etiqueta: "Texto", largura: "meia" },
        { tipo: "texto", chave: "href", etiqueta: "Para onde leva", largura: "meia", placeholder: "/contacto",
          ajuda: "Uma página do site (ex.: /contacto) ou um endereço completo." },
      ],
    },
  ];

  let corpo;
  if (parte === "definicoes") {
    const mudarCampeonato = (c: Valor) => mudar({ ...dados, campeonato: { ...campeonato, ...c } });
    corpo = (
      <div className="space-y-5">
        <Formulario
          esquema={[
            { tipo: "texto", chave: "nome", etiqueta: "Nome do campeonato", largura: "meia",
              ajuda: "Onde aparecer {campeonato} nos textos (ex.: \"Campeonato Nacional\")." },
            { tipo: "texto", chave: "verificadoEm", etiqueta: "Guias verificados em", largura: "meia", placeholder: "Outubro de 2026",
              ajuda: "Mês da última verificação dos guias, no fim de cada página de modalidade." },
          ]}
          valor={campeonato}
          onChange={mudarCampeonato}
        />
        <ListaTexto
          etiqueta="Categorias de piloto"
          ajuda="Pela ordem das pílulas em Pilotos e Classificação. Mudar o nome aqui não muda a categoria dos pilotos já gravados: acerte também as fichas."
          valores={categoriasPiloto}
          placeholder="Nova categoria (ex.: MX 85)"
          onChange={(v) => mudarCampeonato({ categoriasPiloto: v, categorias: textos(campeonato.categorias).filter((c) => v.includes(c)) })}
        />
        <EscolherVarios
          etiqueta="Categorias que pontuam para o campeonato"
          valor={campeonato.categorias}
          mudar={(v) => mudarCampeonato({ categorias: v })}
          opcoes={categoriasPiloto.map((c) => ({ valor: c, nome: c }))}
          ajuda={"A classificação geral (\"Todas\") e os blocos do campeonato só contam os pilotos destas categorias; as outras correm em taças à parte."}
        />
      </div>
    );
  } else {
    const esquema = {
      entrada: ESQUEMA_ENTRADA, campeonato: ESQUEMA_CAMPEONATO, modalidades: ESQUEMA_MODALIDADES,
      federacoes: esquemaFederacoes, paginas: ESQUEMA_PAGINAS, guias: ESQUEMA_GUIAS,
    }[parte];
    corpo = <Formulario esquema={esquema} valor={dados} onChange={mudar} />;
  }

  return (
    <div className="space-y-5">
      <Abas rotulo="Partes da página" abas={PARTES} activa={parte} onChange={setParte} />
      {parte !== "definicoes" && (
        <Aviso>
          Nos textos, <strong>{"{ano}"}</strong> é trocado pelo ano da temporada e <strong>{"{campeonato}"}</strong> pelo nome do
          campeonato. Escreva-os assim mesmo, com as chavetas.
        </Aviso>
      )}
      <div className="painel painel-escuro p-5 md:p-6">{corpo}</div>
    </div>
  );
}

export function PaginaDesportoEditor() {
  return (
    <EditorDoc chave="paginas.desporto" pagina="/desporto" titulo="Desporto (página da secção)">
      {(dados, mudar) => <Partes dados={dados} mudar={mudar} />}
    </EditorDoc>
  );
}
