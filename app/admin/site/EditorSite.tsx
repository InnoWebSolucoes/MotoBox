"use client";

/* ============================================================
   MOTOBOX ADMIN — Entrada e painel
   Quatro documentos do conteúdo editável, em separadores:
   - "site.entrada": a frase da página inicial e o vídeo de fundo
     de todo o site;
   - "site.contagem": a contagem decrescente do painel Explorar;
   - "site.painel": os textos e as fotografias fixos dos mosaicos
     do painel Explorar;
   - "site.geral": os textos que aparecem em todo o site (rodapé,
     botão de acção, 404, sem acesso, newsletter, aviso de
     cookies e página de manutenção), em partes (ver ./geral.tsx).
   Ficam todos abertos ao mesmo tempo, para nada se perder ao
   trocar de separador antes de gravar.
   ============================================================ */

import { useState } from "react";
import { Globe, House, LayoutGrid, Timer } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import { CabecalhoPagina, Campo, Input, Painel, Seleccao } from "@/components/admin/kit";
import { EditorDoc } from "@/components/admin/editor/EditorDoc";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema } from "@/components/admin/editor/esquema";
import { AbasEmLinhas } from "../paginas/_editor/partes";
import { EditorPartes } from "./EditorPartes";
import { PARTES_GERAL } from "./geral";

export type AbaSite = "entrada" | "contagem" | "painel" | "geral";

const ABAS: { chave: AbaSite; nome: string }[] = [
  { chave: "entrada", nome: "Entrada" },
  { chave: "contagem", nome: "Contagem decrescente" },
  { chave: "painel", nome: "Painel Explorar" },
  { chave: "geral", nome: "Geral" },
];

/* ---------------- Entrada ---------------- */

const ESQUEMA_ENTRADA: CampoEsquema[] = [
  {
    tipo: "secao", titulo: "Texto da entrada",
    descricao: "O que se lê no meio da página inicial, por cima do vídeo.",
    campos: [
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Linha pequena por cima do título", largura: "meia" },
      { tipo: "texto", chave: "titulo", etiqueta: "Título", obrigatorio: true },
      { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 3 },
    ],
  },
  {
    tipo: "secao", titulo: "Artigo mais recente",
    descricao: "Por baixo do texto, uma ligação para o último artigo publicado (o título é o do artigo).",
    campos: [
      { tipo: "booleano", chave: "mostrarArtigo", etiqueta: "Mostrar a ligação para o artigo mais recente" },
      {
        tipo: "texto", chave: "rotuloArtigo", etiqueta: "Etiqueta vermelha", largura: "meia",
        placeholder: "Novo artigo", mostrarSe: (v) => Boolean(v.mostrarArtigo),
      },
    ],
  },
  {
    tipo: "secao", titulo: "Vídeo de fundo",
    descricao: "Passa por trás de todas as páginas do site: nítido na entrada, desfocado nas outras. Não tem som.",
    campos: [
      {
        tipo: "video", chave: "video", etiqueta: "Vídeo",
        ajuda: "MP4 ou WebM, até 50 MB. Prefira um vídeo curto (10 a 30 segundos) que repita bem, com 1920 px de largura. Em branco, fica o vídeo de origem.",
      },
      {
        tipo: "imagem", chave: "poster", etiqueta: "Imagem de espera",
        ajuda: "Aparece enquanto o vídeo carrega e a quem tem o movimento reduzido no telemóvel. Use a primeira imagem do vídeo, para a troca não se notar.",
      },
    ],
  },
];

/* ---------------- Contagem ---------------- */

/** "Para onde leva": endereço escrito à mão, ou um evento escolhido da lista. */
function CampoLigacao({ valor, mudar }: { valor: string; mudar: (v: string) => void }) {
  const { estado } = useAdmin();
  const eventos = [...estado.eventos].sort((a, b) => b.dataInicio.localeCompare(a.dataInicio));
  const escolhido = eventos.find((e) => valor === `/eventos/${e.slug}`)?.slug ?? "";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Campo etiqueta="Ligar a um evento" ajuda="Escolha o evento e o endereço preenche-se sozinho.">
        <Seleccao
          valor={escolhido}
          onChange={(slug) => { if (slug) mudar(`/eventos/${slug}`); }}
          opcoes={[{ valor: "", nome: "Escolher um evento…" }, ...eventos.map((e) => ({ valor: e.slug, nome: `${e.titulo} (${e.dataInicio.slice(0, 10)})` }))]}
        />
      </Campo>
      <Campo etiqueta="Para onde leva o painel" ajuda="Uma página do site (ex.: /eventos/ubuntu-2027) ou um endereço completo.">
        <Input value={valor} onChange={(e) => mudar(e.target.value)} placeholder="/eventos/…" />
      </Campo>
    </div>
  );
}

const ESQUEMA_CONTAGEM: CampoEsquema[] = [
  {
    tipo: "booleano", chave: "activa", etiqueta: "Mostrar a contagem decrescente",
    descricao: "Desligada, o painel continua lá, com o evento e a fotografia, mas sem os números a contar.",
  },
  {
    tipo: "secao", titulo: "Textos do painel",
    campos: [
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Linha de cima", largura: "meia", placeholder: "Ubuntu 2027" },
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      { tipo: "texto", chave: "subtitulo", etiqueta: "Linha por baixo do título", ajuda: "Por exemplo, o dia e o percurso." },
      { tipo: "texto", chave: "textoLigacao", etiqueta: "Texto da ligação, em baixo", largura: "meia", placeholder: "Ver o evento" },
    ],
  },
  {
    tipo: "secao", titulo: "Quando e para onde",
    campos: [
      {
        tipo: "datahora", chave: "data", etiqueta: "Data e hora do arranque", largura: "meia",
        ajuda: "Hora de Luanda. Os números chegam a zero a esta hora e ficam em zero.",
      },
      {
        tipo: "personalizado", chave: "ligacao", etiqueta: "Para onde leva",
        render: (v, mudar) => <CampoLigacao valor={typeof v === "string" ? v : ""} mudar={mudar} />,
      },
    ],
  },
  { tipo: "imagem", chave: "foto", etiqueta: "Fotografia de fundo do painel", formato: "aspect-[4/3]" },
];

/* ---------------- Painel Explorar ---------------- */

const AJUDA_CHAVETAS = "As palavras entre chavetas são trocadas pelos valores do momento.";

const ESQUEMA_PAINEL: CampoEsquema[] = [
  {
    tipo: "nota",
    texto: "O artigo em destaque, o número de clubes, o líder do campeonato e o próximo evento escolhem-se sozinhos a partir do que está publicado. Aqui ficam os textos e as fotografias à volta.",
  },
  {
    tipo: "objecto", chave: "destaque", etiqueta: "Artigo em destaque (o painel grande)",
    ajuda: "Mostra o artigo marcado como destaque em Artigos, ou o mais recente.",
    campos: [
      { tipo: "texto", chave: "rotulo", etiqueta: "Antes da categoria", largura: "meia", ajuda: "Lê-se \"Artigo em destaque · Clubes\"; a categoria junta-se sozinha." },
      { tipo: "texto", chave: "semArtigos", etiqueta: "Título quando ainda não há artigos", largura: "meia" },
      { tipo: "texto", chave: "maisArtigos", etiqueta: "Título da caixa \"Mais artigos\"", largura: "meia", ajuda: "Só nos ecrãs largos." },
      { tipo: "texto", chave: "todosArtigos", etiqueta: "Ligação para todos os artigos", largura: "meia" },
    ],
  },
  {
    tipo: "objecto", chave: "clubes", etiqueta: "Mosaico Clubes",
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      { tipo: "imagem", chave: "foto", etiqueta: "Fotografia", formato: "aspect-[4/3]" },
      { tipo: "texto", chave: "texto", etiqueta: "Texto", ajuda: `${AJUDA_CHAVETAS} {clubes}: quantos clubes há; {provincias}: em quantas províncias.` },
      { tipo: "texto", chave: "textoSemProvincias", etiqueta: "Texto quando nenhum clube tem província", ajuda: "{clubes}: quantos clubes há." },
    ],
  },
  {
    tipo: "objecto", chave: "desporto", etiqueta: "Mosaico Desporto",
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      { tipo: "imagem", chave: "foto", etiqueta: "Fotografia", formato: "aspect-[4/3]" },
      { tipo: "texto", chave: "textoLider", etiqueta: "Quem lidera o campeonato", ajuda: `${AJUDA_CHAVETAS} {piloto}: o nome do líder; {pontos}: os pontos.` },
      { tipo: "texto", chave: "textoProva", etiqueta: "A próxima prova", ajuda: "{prova}: o nome da prova; {data}: o dia e o mês. Junta-se ao texto anterior." },
      { tipo: "texto", chave: "textoVazio", etiqueta: "Texto quando ainda não há classificação" },
    ],
  },
  {
    tipo: "objecto", chave: "eventos", etiqueta: "Mosaico Eventos",
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      {
        tipo: "booleano", chave: "fotoDoEvento", etiqueta: "Usar a fotografia do próximo evento",
        descricao: "Desligado, o mosaico mostra sempre a fotografia de baixo.",
      },
      { tipo: "imagem", chave: "foto", etiqueta: "Fotografia", formato: "aspect-[4/3]", ajuda: "Usada quando não há evento marcado (ou sempre, se desligar a opção de cima)." },
      { tipo: "texto", chave: "textoProximo", etiqueta: "O próximo evento", ajuda: `${AJUDA_CHAVETAS} {evento}: o nome; {data}: o dia e o mês.` },
      { tipo: "texto", chave: "textoVazio", etiqueta: "Texto quando não há evento marcado" },
    ],
  },
  {
    tipo: "objecto", chave: "fichas", etiqueta: "Mosaicos pequenos",
    ajuda: "Os nomes dos cinco mosaicos escuros do canto. Cada um leva sempre à mesma secção.",
    campos: [
      { tipo: "texto", chave: "rotas", etiqueta: "Rotas", largura: "meia" },
      { tipo: "texto", chave: "seguranca", etiqueta: "Segurança", largura: "meia" },
      { tipo: "texto", chave: "sobre", etiqueta: "Sobre a MotoBox", largura: "meia" },
      { tipo: "texto", chave: "marketplace", etiqueta: "Marketplace", largura: "meia" },
      { tipo: "texto", chave: "forum", etiqueta: "Fórum", largura: "meia" },
    ],
  },
  {
    tipo: "objecto", chave: "seo", etiqueta: "Nas pesquisas e no separador do navegador",
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título" },
      { tipo: "area", chave: "descricao", etiqueta: "Descrição", linhas: 2 },
    ],
  },
];

const DOCS: Record<Exclude<AbaSite, "geral">, { chave: string; pagina: string; esquema: CampoEsquema[]; titulo: string; descricao: string }> = {
  entrada: {
    chave: "site.entrada", pagina: "/", esquema: ESQUEMA_ENTRADA,
    titulo: "Entrada", descricao: "A página inicial do site e o vídeo de fundo que todas as páginas partilham.",
  },
  contagem: {
    chave: "site.contagem", pagina: "/explorar", esquema: ESQUEMA_CONTAGEM,
    titulo: "Contagem decrescente", descricao: "O painel à direita, no Explorar, que conta os dias até um evento.",
  },
  painel: {
    chave: "site.painel", pagina: "/explorar", esquema: ESQUEMA_PAINEL,
    titulo: "Painel Explorar", descricao: "Os mosaicos do painel Explorar: títulos, fotografias e textos fixos.",
  },
};

const ICONES: Record<AbaSite, React.ReactNode> = {
  entrada: <House />, contagem: <Timer />, painel: <LayoutGrid />, geral: <Globe />,
};

export function EditorSite({ abaInicial }: { abaInicial: AbaSite }) {
  const [aba, setAba] = useState<AbaSite>(abaInicial);
  // Uma ligação para outro separador (?aba=…) com a página já aberta.
  const [pedida, setPedida] = useState(abaInicial);
  if (pedida !== abaInicial) {
    setPedida(abaInicial);
    setAba(abaInicial);
  }

  const mudarAba = (k: AbaSite) => {
    setAba(k);
    // O endereço acompanha o separador (para partilhar ou voltar a ele).
    try { window.history.replaceState(null, "", `?aba=${k}`); } catch { /* indisponível */ }
  };

  return (
    <>
      <CabecalhoPagina
        sobretitulo="Site"
        titulo="Entrada e painel"
        icone={ICONES[aba]}
        descricao={aba === "geral"
          ? "Os textos que aparecem em todo o site: o rodapé, o botão vermelho de baixo, a página 404, a página \"Sem acesso\", as páginas da newsletter, o aviso de cookies e a página de manutenção."
          : "A primeira coisa que se vê do site: a página inicial com o vídeo de fundo e o painel Explorar."}
      />

      <div className="mb-5">
        <AbasEmLinhas abas={ABAS} activa={aba} onChange={mudarAba} rotulo="Partes do site" />
      </div>

      {(Object.keys(DOCS) as Exclude<AbaSite, "geral">[]).map((k) => {
        const d = DOCS[k];
        return (
          <div key={k} hidden={k !== aba}>
            <EditorDoc chave={d.chave} pagina={d.pagina}>
              {(dados, mudar) => (
                <Painel titulo={d.titulo} descricao={d.descricao} icone={ICONES[k]}>
                  <Formulario esquema={d.esquema} valor={dados} onChange={mudar} />
                </Painel>
              )}
            </EditorDoc>
          </div>
        );
      })}

      <div hidden={aba !== "geral"}>
        <EditorPartes chave="site.geral" pagina="/calendario" partes={PARTES_GERAL} icone={ICONES.geral} rotulo="Textos gerais" />
      </div>
    </>
  );
}
