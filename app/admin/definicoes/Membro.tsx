"use client";

/* ============================================================
   MOTOBOX ADMIN — Definições › Área de membro
   Documento "site.conta": os textos fixos de /conta (o resumo,
   os separadores, os estados vazios, a segurança…), os níveis e
   os pontos de cada acção. As palavras entre chavetas trocam-se
   pelos valores do momento ({n}, {data}, {nivel}…).
   ============================================================ */

import { useState } from "react";
import { Award, LayoutDashboard, MessageSquareText } from "lucide-react";
import {
  ACCOES_PONTOS, CONTA_PADRAO, comPadraoContas, type AbaConta, type AccaoPontos,
} from "@/lib/conteudo/grupos/contas";
import { Painel } from "@/components/admin/kit";
import { EditorDoc } from "@/components/admin/editor/EditorDoc";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";
import { AbasEmLinhas } from "../paginas/_editor/partes";

const t = (chave: string, etiqueta: string, extra: Partial<{ ajuda: string; largura: "meia" | "inteira"; area: boolean; linhas: number }> = {}): CampoEsquema =>
  extra.area
    ? { tipo: "area", chave, etiqueta, linhas: extra.linhas ?? 2, ajuda: extra.ajuda }
    : { tipo: "texto", chave, etiqueta, ajuda: extra.ajuda, largura: extra.largura ?? "meia" };

const NOMES_ABAS: Record<AbaConta, string> = {
  resumo: "Resumo", anuncios: "Anúncios", guardados: "Guardados", garagem: "Garagem",
  preferencias: "Clubes e marcas", notificacoes: "Notificações", seguranca: "Segurança",
};

const NOMES_ACCOES: Record<AccaoPontos, string> = {
  foto: "Fotografia no perfil", provincia: "Província", telefone: "Telefone", clube: "Clube escolhido",
  interesse: "Cada clube ou marca seguida (até 10)", anuncio: "Cada anúncio", resposta: "Cada resposta no fórum",
  topico: "Cada tópico no fórum", mota: "Cada mota na garagem", verificado: "Conta verificada",
};

/* ---------------- Esquemas, por parte ---------------- */

const GERAL: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "seo", etiqueta: "Pesquisa e separador do navegador",
    campos: [t("titulo", "Título"), t("descricao", "Descrição nas pesquisas", { largura: "inteira" })],
  },
  {
    tipo: "objecto", chave: "abas", etiqueta: "Nomes dos separadores",
    campos: (Object.keys(NOMES_ABAS) as AbaConta[]).map((k) => t(k, NOMES_ABAS[k])),
  },
  {
    tipo: "objecto", chave: "cabecalho", etiqueta: "Cabeçalho pessoal",
    ajuda: "O topo da conta: saudação, «membro desde», a província, o nível e o botão de sair.",
    campos: [
      t("bomDia", "Saudação de manhã"), t("boaTarde", "Saudação à tarde"), t("boaNoite", "Saudação à noite"),
      t("membroDesde", "Membro desde", { ajuda: "{data}: o mês e o ano em que a conta foi criada." }),
      t("verificado", "Selo de conta verificada"), t("semProvincia", "Sem província"),
      t("alterarFoto", "Botão do avatar (leitores de ecrã)"),
      t("nivel", "Palavra «Nível»"), t("pontos", "Pontos", { ajuda: "{pontos}" }),
      t("proximoNivel", "Até ao próximo nível", { ajuda: "{faltam} pontos e {nivel}, o nome do próximo." }),
      t("nivelMaximo", "No nível mais alto"), t("comoGanhar", "Ligação «Como ganhar pontos»"),
      t("sair", "Botão Sair"), t("aSair", "Enquanto sai"),
    ],
  },
  {
    tipo: "objecto", chave: "accoes", etiqueta: "Acções rápidas",
    ajuda: "Os quatro botões por baixo do cabeçalho. «Publicar anúncio» só aparece com o marketplace aberto.",
    campos: [
      t("publicar", "Publicar anúncio"), t("perfil", "Editar perfil"),
      t("topico", "Criar tópico no fórum"), { tipo: "texto", chave: "topicoLigacao", etiqueta: "Ligação do fórum", largura: "meia", placeholder: "/forum/novo" },
      t("eventos", "Ver eventos"), { tipo: "texto", chave: "eventosLigacao", etiqueta: "Ligação dos eventos", largura: "meia", placeholder: "/eventos" },
    ],
  },
  {
    tipo: "objecto", chave: "semSessao", etiqueta: "Quem abre /conta sem sessão",
    campos: [
      t("sobretitulo", "Linha pequena"), t("titulo", "Título"),
      t("texto", "Texto", { area: true }),
      t("entrar", "Botão Entrar"), t("criar", "Botão Criar conta"),
      { tipo: "lista-texto", chave: "vantagens", etiqueta: "O que a conta dá (uma por linha)" },
    ],
  },
];

const NIVEIS: CampoEsquema[] = [
  {
    tipo: "lista", chave: "niveis", etiqueta: "Níveis", nomeItem: "nível",
    ajuda: "Do mais baixo para o mais alto. O primeiro começa sempre nos 0 pontos.",
    resumo: (v) => `${String(v.nome ?? "")} · ${String(v.pontos ?? 0)} pontos`,
    novo: () => ({ nome: "", pontos: 0 }),
    campos: [
      { tipo: "texto", chave: "nome", etiqueta: "Nome", largura: "meia" },
      { tipo: "numero", chave: "pontos", etiqueta: "Pontos para chegar", min: 0, largura: "meia" },
    ],
  },
  {
    tipo: "objecto", chave: "pontos", etiqueta: "Pontos",
    campos: [
      t("titulo", "Título da janela «Como ganhar pontos»"),
      t("texto", "Texto da janela", { area: true }),
      {
        tipo: "objecto", chave: "valores", etiqueta: "Pontos de cada acção",
        campos: ACCOES_PONTOS.map((a): CampoEsquema => ({ tipo: "numero", chave: a, etiqueta: NOMES_ACCOES[a], min: 0, max: 100, largura: "meia" })),
      },
      {
        tipo: "objecto", chave: "nomes", etiqueta: "Como cada acção aparece na janela",
        campos: ACCOES_PONTOS.map((a) => t(a, NOMES_ACCOES[a])),
      },
    ],
  },
];

const RESUMO: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "numeros", etiqueta: "Números do resumo",
    campos: [
      t("anuncios", "Anúncios"), t("anunciosNota", "Nota dos anúncios", { ajuda: "{n}: visualizações somadas." }),
      t("anunciosZero", "Nota sem anúncios"),
      t("guardados", "Guardados"), t("guardadosNota", "Nota dos guardados", { ajuda: "{anuncios} e {artigos}" }),
      t("guardadosZero", "Nota sem guardados"),
      t("forum", "Fórum"), t("forumNota", "Nota do fórum", { ajuda: "{respostas} e {topicos}" }),
      t("forumZero", "Nota sem participação"),
      t("eventos", "Eventos a chegar"), t("eventosNota", "Dias até ao próximo", { ajuda: "{dias}" }),
      t("eventosHoje", "Quando é hoje"), t("eventosAmanha", "Quando é amanhã"), t("eventosNenhum", "Sem eventos"),
    ],
  },
  {
    tipo: "objecto", chave: "perfil", etiqueta: "Complete o seu perfil",
    ajuda: "A lista aparece enquanto faltar algum passo.",
    campos: [
      t("titulo", "Título"), t("progresso", "Progresso", { ajuda: "{feitos} de {total}" }),
      t("texto", "Texto", { area: true }),
      t("foto", "Fotografia"), t("provincia", "Província"), t("telefone", "Telefone"),
      t("clube", "Clube"), t("garagem", "Garagem"), t("interesses", "Clubes e marcas"),
    ],
  },
  {
    tipo: "objecto", chave: "paraSi", etiqueta: "Para si",
    campos: [
      t("titulo", "Título da secção"),
      { tipo: "secao", titulo: "Próximo evento", campos: [
        t("proximo", "Linha por cima do evento"), t("verEvento", "Botão"),
        t("dias", "dias"), t("horas", "horas"), t("minutos", "minutos"), t("segundos", "segundos"),
        t("aDecorrer", "Quando já começou"), t("agenda", "Título dos seguintes"),
        t("prova", "Etiqueta de prova"), t("evento", "Etiqueta de evento"),
        t("semEventos", "Sem eventos marcados", { area: true }), t("semEventosBotao", "Botão sem eventos"),
      ] },
      { tipo: "secao", titulo: "Rota da semana", campos: [
        t("rota", "Etiqueta"), t("verRota", "Ligação"),
        t("rotaTexto", "Texto", { largura: "inteira" }),
        t("rotaPerto", "Quando passa na província do membro", { ajuda: "{provincia}" }),
      ] },
      { tipo: "secao", titulo: "O seu clube", campos: [
        t("clube", "Título com clube"), t("verClube", "Ligação"), t("mudarClube", "Mudar"),
        t("semClube", "Título sem clube"), t("semClubeTexto", "Texto sem clube", { area: true }),
        t("escolherClube", "Rótulo da escolha"), t("semClubeOpcao", "Opção «sem clube»"), t("conhecerClubes", "Ligação para os clubes"),
      ] },
      { tipo: "secao", titulo: "Artigos", campos: [
        t("artigos", "Título"), t("verArtigos", "Ligação"),
        t("artigosInteresses", "Com interesses"), t("artigosRecentes", "Sem interesses"),
        t("guardarArtigo", "Botão guardar"), t("artigoGuardado", "Já guardado"),
      ] },
      { tipo: "secao", titulo: "Fórum e bilhetes", campos: [
        t("forum", "Título do fórum"), t("forumBotao", "Botão do fórum"),
        t("forumResposta", "Antes de uma resposta"), t("forumTopico", "Antes de um tópico"),
        t("forumVazio", "Sem participação", { area: true }),
        t("bilhetes", "Título dos bilhetes"), t("bilhetesPendente", "Por pagar"),
        t("bilhetesPago", "Pago"), t("bilhetesUsado", "Usado"), t("bilhetesCancelado", "Cancelado"),
      ] },
    ],
  },
];

const SEPARADORES: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "anuncios", etiqueta: "Anúncios",
    campos: [
      t("titulo", "Título"), t("publicar", "Botão publicar"),
      t("texto", "Texto", { area: true }),
      t("activo", "Estado activo"), t("oculto", "Estado escondido pela equipa"),
      t("ocultoNota", "Nota no anúncio escondido", { area: true }),
      t("visualizacoes", "Visualizações", { ajuda: "{n}" }), t("publicado", "Data", { ajuda: "{data}" }),
      t("editar", "Editar"), t("partilhar", "Partilhar"), t("terminar", "Terminar"),
      t("verTodos", "Ver todos", { ajuda: "{n}" }),
      t("vazioTitulo", "Sem anúncios: título"), t("vazioTexto", "Sem anúncios: texto", { area: true }),
      t("verificado", "Nota de conta verificada", { area: true }),
    ],
  },
  {
    tipo: "objecto", chave: "guardados", etiqueta: "Guardados",
    campos: [
      t("titulo", "Título"), t("texto", "Texto"),
      t("anuncios", "Anúncios guardados"), t("anunciosBotao", "Botão sem anúncios"),
      t("anunciosVazio", "Sem anúncios guardados", { area: true }),
      t("artigos", "Artigos guardados"), t("artigosBotao", "Botão sem artigos"),
      t("artigosVazio", "Sem artigos guardados", { area: true }),
      t("remover", "Remover"), t("verTodos", "Ver tudo"),
    ],
  },
  {
    tipo: "objecto", chave: "garagem", etiqueta: "Garagem",
    campos: [
      t("titulo", "Título"), t("juntar", "Botão juntar"),
      t("texto", "Texto", { area: true }),
      t("vazioTitulo", "Vazia: título"), t("vazioTexto", "Vazia: texto"),
      t("editar", "Editar"), t("remover", "Remover"),
      t("formNova", "Janela nova"), t("formEditar", "Janela editar"),
      t("marca", "Marca"), t("modelo", "Modelo"), t("ano", "Ano"),
      t("apelido", "Nome da mota"), t("apelidoAjuda", "Ajuda do nome"),
      t("foto", "Fotografia"), t("fotoAjuda", "Ajuda da fotografia"),
      t("maximo", "Limite", { ajuda: "{n}" }), t("confirmarRemover", "Confirmar remover", { ajuda: "{mota}" }),
    ],
  },
  {
    tipo: "objecto", chave: "preferencias", etiqueta: "Clubes e marcas",
    campos: [
      t("texto", "Texto", { area: true }),
      t("meuClube", "O meu clube"), t("meuClubeTexto", "Texto do meu clube"),
      t("clubes", "Clubes que segue"), t("clubesTexto", "Texto dos clubes"),
      t("marcas", "Marcas"), t("marcasTexto", "Texto das marcas"),
    ],
  },
  {
    tipo: "objecto", chave: "notificacoes", etiqueta: "Notificações",
    campos: [
      t("titulo", "Título"), t("texto", "Texto"),
      t("calendario", "Eventos"), t("calendarioTexto", "Eventos: texto"),
      t("bilhetes", "Bilhetes"), t("bilhetesTexto", "Bilhetes: texto"),
      t("marketplace", "Marketplace"), t("marketplaceTexto", "Marketplace: texto"),
      t("forum", "Fórum"), t("forumTexto", "Fórum: texto"),
      t("newsletter", "Newsletter"), t("newsletterTexto", "Newsletter: texto"),
      t("canais", "Título dos canais"), t("brevemente", "Canal ainda por abrir"),
      t("email", "Email"), t("push", "Telemóvel"), t("whatsapp", "WhatsApp"),
      t("enviadasPara", "Para onde vão", { ajuda: "{email}" }),
      t("automatico", "Guardam-se sozinhas"),
    ],
  },
  {
    tipo: "objecto", chave: "seguranca", etiqueta: "Segurança",
    campos: [
      t("palavraTitulo", "Título"), t("guardar", "Botão"),
      t("palavraTexto", "Texto", { area: true }),
      t("actual", "Palavra-passe actual"), t("nova", "Nova"), t("confirmar", "Repetir"),
      t("sucesso", "Mudou"), t("naoCoincide", "Não coincidem"), t("curta", "Curta de mais"), t("actualErrada", "Actual errada"),
      t("google", "Conta do Google", { area: true }),
      t("sessoesTitulo", "Sessões: título"), t("ultimaEntrada", "Última entrada", { ajuda: "{data}" }),
      t("sessoesTexto", "Sessões: texto", { area: true }),
      t("outras", "Terminar as outras"), t("outrasFeito", "Outras terminadas"), t("todas", "Sair em todos"),
      t("emailTitulo", "Email: título"), t("emailTexto", "Email: texto", { area: true }),
    ],
  },
];

type Parte = "geral" | "niveis" | "resumo" | "separadores";

const PARTES: { chave: Parte; nome: string; descricao: string; icone: React.ReactNode; esquema: CampoEsquema[] }[] = [
  { chave: "geral", nome: "Cabeçalho e separadores", icone: <LayoutDashboard />, esquema: GERAL,
    descricao: "O topo da conta, os botões rápidos, os nomes dos separadores e o que vê quem não tem sessão." },
  { chave: "niveis", nome: "Níveis e pontos", icone: <Award />, esquema: NIVEIS,
    descricao: "Os níveis dos membros e quantos pontos vale cada acção. Os pontos contam-se sozinhos a partir do que cada pessoa faz no site." },
  { chave: "resumo", nome: "Resumo e Para si", icone: <LayoutDashboard />, esquema: RESUMO,
    descricao: "Os números, a lista «Complete o seu perfil», o próximo evento, a rota da semana, o clube, os artigos, o fórum e os bilhetes." },
  { chave: "separadores", nome: "Restantes separadores", icone: <MessageSquareText />, esquema: SEPARADORES,
    descricao: "Anúncios, guardados, garagem, clubes e marcas, notificações e segurança." },
];

export function DefinicoesMembro() {
  const [parte, setParte] = useState<Parte>("geral");
  const actual = PARTES.find((p) => p.chave === parte) ?? PARTES[0];
  return (
    <EditorDoc chave="site.conta" titulo="Área de membro (a minha conta)" pagina="/conta">
      {(dados, mudar) => (
        <div className="space-y-[var(--intervalo)]">
          <AbasEmLinhas abas={PARTES.map((p) => ({ chave: p.chave, nome: p.nome }))} activa={parte} onChange={setParte} rotulo="Partes da área de membro" />
          <Painel titulo={actual.nome} icone={actual.icone} descricao={<>{actual.descricao} As palavras entre chavetas, como <code className="text-white/85">{"{n}"}</code>, trocam-se pelos valores de cada membro.</>}>
            <Formulario esquema={actual.esquema} valor={comPadraoContas(CONTA_PADRAO, dados) as unknown as Valor} onChange={mudar} />
          </Painel>
        </div>
      )}
    </EditorDoc>
  );
}
