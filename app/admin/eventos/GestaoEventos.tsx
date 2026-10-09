"use client";

/* ============================================================
   MOTOBOX ADMIN — Eventos da comunidade
   Passeios, raides, encontros, concentrações, acções solidárias
   e formações (as provas do campeonato ficam em Desporto →
   Provas). Cada evento: título, tipo, datas, local, estado,
   fotografia, resumo e descrição, organização, programa,
   bilhetes, "Como participar" e publicação.

   "Como participar" não tem coluna na tabela `eventos`: vive no
   conteúdo editável, grupo "eventos-extra", com a chave do slug.
   A aba "Página Eventos" edita os textos fixos de /eventos e da
   página de cada evento (documento "paginas.eventos").
   ============================================================ */

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, Plus } from "lucide-react";
import { useAdmin, slugify } from "@/lib/admin/store";
import type { Evento, EstadoEvento } from "@/lib/types";
import { PROVINCIAS } from "@/lib/provincias";
import { DISCIPLINAS_COMUNIDADE, eComunidade } from "@/lib/desporto";
import { diaMes, eventosFuturos, intervaloDatas } from "@/lib/motobox";
import { formatKz } from "@/lib/data";
import { src as fotoSrc } from "@/lib/imagens";
import {
  Abas, Area, Aviso, Botao, BotaoLigacao, CabecalhoPagina, Campo, CampoEndereco, Confirmar, Estatistica, Etiqueta,
  Input, Interruptor, Painel, Procura, Seleccao, Vazio, useAviso, usePaginacao,
} from "@/components/admin/kit";
import { CampoImagem } from "@/components/admin/Media";
import { EditorDoc, useAvisoSaida } from "@/components/admin/editor/EditorDoc";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";
import type { ExtraEvento } from "@/lib/conteudo/grupos/eventos";
import { fotoDe } from "@/app/eventos/foto";
import {
  BarraEditor, apagarItemConteudo, gravarItemConteudo, hoje, iguais, lerGrupoConteudo, useAbaNoEndereco,
} from "@/app/admin/noticias/_partilhado";

type EventoAdmin = Evento & { publicado?: boolean };
type Aba = "eventos" | "pagina";
type Quando = "proximos" | "passados" | "todos";

const publicado = (e: EventoAdmin) => e.publicado !== false;

/** Os estados com o nome que a equipa entende. */
const ESTADOS: { valor: EstadoEvento; nome: string }[] = [
  { valor: "agendado", nome: "Marcado" },
  { valor: "bilhetes-abertos", nome: "Bilhetes à venda" },
  { valor: "esgotado", nome: "Esgotado" },
  { valor: "a-decorrer", nome: "A decorrer" },
  { valor: "concluido", nome: "Já aconteceu" },
];
const nomeEstado = (v: string) => ESTADOS.find((e) => e.valor === v)?.nome ?? v;

const eventoNovo = (): EventoAdmin => ({
  slug: "", titulo: "", disciplina: "Passeio", temporada: Number(hoje().slice(0, 4)),
  circuito: "", provincia: "Luanda", localidade: "", dataInicio: hoje(), dataFim: hoje(),
  estado: "agendado", imagem: "", resumo: "", descricao: "", organizador: "MotoBox Angola",
  horarios: [], bilhetes: [], publicado: true,
});

/* ---------------- Esquemas ---------------- */

const ESQUEMA_PROGRAMA: CampoEsquema[] = [
  {
    tipo: "lista", chave: "horarios", etiqueta: "Momentos do programa", nomeItem: "momento",
    ajuda: "Cada momento do programa: o dia, a hora e o que acontece. Sem programa, a página não mostra o quadro.",
    resumo: (h) => [h.dia, h.hora, h.sessao].filter(Boolean).join(" · "),
    novo: () => ({ dia: "", hora: "", sessao: "" }),
    campos: [
      { tipo: "texto", chave: "dia", etiqueta: "Dia", placeholder: "Ex.: Domingo", largura: "meia" },
      { tipo: "hora", chave: "hora", etiqueta: "Hora", largura: "meia" },
      { tipo: "texto", chave: "sessao", etiqueta: "O que acontece", placeholder: "Ex.: Concentração e registo" },
    ],
  },
];

const novoIdBilhete = () => `b-${Date.now().toString(36).slice(-5)}`;

const ESQUEMA_BILHETES: CampoEsquema[] = [
  {
    tipo: "lista", chave: "bilhetes", etiqueta: "Tipos de bilhete", nomeItem: "tipo de bilhete",
    resumo: (b) => `${String(b.nome || "Bilhete sem nome")} · ${formatKz(Number(b.preco) || 0)}`,
    novo: () => ({ id: novoIdBilhete(), nome: "", descricao: "", preco: 0, disponiveis: 100, beneficios: [], destaque: false }),
    campos: [
      { tipo: "texto", chave: "nome", etiqueta: "Nome", placeholder: "Ex.: Geral", largura: "meia" },
      { tipo: "numero", chave: "preco", etiqueta: "Preço (Kz)", min: 0, passo: 500, largura: "meia" },
      { tipo: "numero", chave: "disponiveis", etiqueta: "Lugares à venda", min: 0, passo: 1, largura: "meia", ajuda: "Com zero em todos, o evento mostra «Esgotado»." },
      { tipo: "booleano", chave: "destaque", etiqueta: "Bilhete recomendado", descricao: "Aparece em destaque na página de compra.", largura: "meia" },
      { tipo: "texto", chave: "descricao", etiqueta: "Descrição curta" },
      { tipo: "lista-texto", chave: "beneficios", etiqueta: "O que inclui", placeholder: "Ex.: Pequeno-almoço" },
    ],
  },
];

const AJUDA_LIGACAO = "Uma página do site (ex.: /calendario) ou um endereço completo (https://…).";

const ESQUEMA_PAGINA: CampoEsquema[] = [
  {
    tipo: "secao", titulo: "Abertura de /eventos", descricao: "O topo da página com a lista dos eventos.",
    campos: [
      { tipo: "imagem", chave: "foto", etiqueta: "Fotografia de fundo" },
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Sobretítulo", ajuda: "A linha pequena em maiúsculas, por cima do título.", largura: "meia" },
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      { tipo: "area", chave: "texto", etiqueta: "Texto de apresentação", linhas: 3 },
    ],
  },
  {
    tipo: "secao", titulo: "Lista de eventos",
    campos: [
      { tipo: "texto", chave: "proximos", etiqueta: "Título dos próximos eventos", largura: "meia" },
      { tipo: "texto", chave: "passados", etiqueta: "Título dos que já aconteceram", largura: "meia" },
      { tipo: "texto", chave: "todos", etiqueta: "Primeira pílula dos tipos", ajuda: "A que mostra os eventos de todos os tipos.", largura: "meia" },
      { tipo: "texto", chave: "vazio", etiqueta: "Aviso quando não há eventos marcados" },
      { tipo: "texto", chave: "vazioTipo", etiqueta: "Aviso quando não há eventos de um tipo", ajuda: "«{tipo}» passa ao tipo escolhido na pílula, ex.: passeio." },
    ],
  },
  {
    tipo: "secao", titulo: "Ligação para as provas", descricao: "O quadro que leva ao calendário do Desporto.",
    campos: [
      { tipo: "booleano", chave: "provasMostrar", etiqueta: "Mostrar o quadro" },
      { tipo: "texto", chave: "provasTitulo", etiqueta: "Começo em destaque", ajuda: "A parte em branco, antes dos dois pontos.", mostrarSe: (v) => v.provasMostrar !== false },
      { tipo: "area", chave: "provasTexto", etiqueta: "Resto do texto", linhas: 2, mostrarSe: (v) => v.provasMostrar !== false },
      { tipo: "texto", chave: "provasLigacao", etiqueta: "Para onde leva", ajuda: AJUDA_LIGACAO, mostrarSe: (v) => v.provasMostrar !== false },
    ],
  },
  {
    tipo: "secao", titulo: "Quadro «Divulgue o seu evento»", descricao: "O convite, no fim da página, para quem organiza eventos.",
    campos: [
      { tipo: "booleano", chave: "divulgarMostrar", etiqueta: "Mostrar o quadro" },
      { tipo: "texto", chave: "divulgarSobretitulo", etiqueta: "Pergunta por cima do título", mostrarSe: (v) => v.divulgarMostrar !== false },
      { tipo: "texto", chave: "divulgarTitulo", etiqueta: "Título", mostrarSe: (v) => v.divulgarMostrar !== false },
      { tipo: "area", chave: "divulgarTexto", etiqueta: "Texto", linhas: 3, mostrarSe: (v) => v.divulgarMostrar !== false },
      { tipo: "texto", chave: "divulgarBotao", etiqueta: "Texto do botão", largura: "meia", mostrarSe: (v) => v.divulgarMostrar !== false },
      { tipo: "texto", chave: "divulgarLigacao", etiqueta: "Para onde leva o botão", ajuda: AJUDA_LIGACAO, largura: "meia", mostrarSe: (v) => v.divulgarMostrar !== false },
      { tipo: "imagem", chave: "divulgarFoto", etiqueta: "Fotografia ao lado", mostrarSe: (v) => v.divulgarMostrar !== false },
    ],
  },
  {
    tipo: "secao", titulo: "Página de cada evento", descricao: "Textos fixos que se repetem em todos os eventos.",
    campos: [
      { tipo: "texto", chave: "eventoCalendario", etiqueta: "Botão para o calendário do telemóvel", largura: "meia" },
      { tipo: "texto", chave: "eventoPassado", etiqueta: "Aviso de evento passado", largura: "meia" },
      { tipo: "texto", chave: "eventoRotuloData", etiqueta: "Legenda da data", largura: "meia" },
      { tipo: "texto", chave: "eventoRotuloTipo", etiqueta: "Legenda do tipo", largura: "meia" },
      { tipo: "texto", chave: "eventoRotuloOrganizacao", etiqueta: "Legenda da organização", largura: "meia" },
      { tipo: "texto", chave: "eventoSobre", etiqueta: "Título da descrição", largura: "meia" },
      { tipo: "texto", chave: "eventoPrograma", etiqueta: "Título do programa", largura: "meia" },
      { tipo: "texto", chave: "eventoParticipar", etiqueta: "Título de «Como participar»", largura: "meia" },
      { tipo: "texto", chave: "eventoOutros", etiqueta: "Título dos outros eventos", largura: "meia" },
      { tipo: "texto", chave: "eventoTodos", etiqueta: "Ligação para a lista", largura: "meia" },
    ],
  },
  {
    tipo: "secao", titulo: "Quadro de segurança", descricao: "O lembrete que aparece em todos os eventos.",
    campos: [
      { tipo: "booleano", chave: "eventoAvisoMostrar", etiqueta: "Mostrar o quadro" },
      { tipo: "texto", chave: "eventoAvisoTitulo", etiqueta: "Título", mostrarSe: (v) => v.eventoAvisoMostrar !== false },
      { tipo: "area", chave: "eventoAvisoTexto", etiqueta: "Texto", linhas: 2, mostrarSe: (v) => v.eventoAvisoMostrar !== false },
      { tipo: "texto", chave: "eventoAvisoBotao", etiqueta: "Texto do botão", largura: "meia", mostrarSe: (v) => v.eventoAvisoMostrar !== false },
      { tipo: "texto", chave: "eventoAvisoLigacao", etiqueta: "Para onde leva o botão", ajuda: AJUDA_LIGACAO, largura: "meia", mostrarSe: (v) => v.eventoAvisoMostrar !== false },
    ],
  },
  {
    tipo: "secao", titulo: "Pesquisa e partilhas",
    campos: [
      {
        tipo: "area", chave: "descricaoPesquisa", etiqueta: "Descrição da secção", linhas: 2,
        ajuda: "O texto que o Google e as redes sociais mostram por baixo do nome da página. Até cerca de 160 caracteres.",
      },
    ],
  },
];

/* ---------------- Página ---------------- */

export function GestaoEventos({ abaInicial }: { abaInicial: Aba }) {
  const { estado } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const [aba, setAba] = useAbaNoEndereco<Aba>(abaInicial, "eventos");
  const [aberto, setAberto] = useState<{ original: string | null; inicial: EventoAdmin } | null>(null);
  /** "Como participar" de cada evento (slug → texto), lido do conteúdo editável. */
  const [extras, setExtras] = useState<Map<string, string> | null>(null);
  const [erroExtras, setErroExtras] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    lerGrupoConteudo<ExtraEvento>("eventos-extra").then(
      (r) => { if (vivo) setExtras(new Map(r.itens.map((i) => [i.chave, String(i.dados?.entrada ?? "")]))); },
      (e) => { if (vivo) { setErroExtras(e instanceof Error ? e.message : "Falha ao ler."); setExtras(new Map()); } },
    );
    return () => { vivo = false; };
  }, []);

  const eventos = (estado.eventos as EventoAdmin[]).filter((e) => eComunidade(e.disciplina));

  if (aberto) {
    return (
      <>
        <EditorEvento
          key={aberto.original ?? "novo"}
          original={aberto.original}
          inicial={aberto.inicial}
          extras={extras}
          aoMudarExtras={setExtras}
          mostrar={mostrar}
          aoFechar={() => setAberto(null)}
          aoMudarOriginal={(slug, e) => setAberto({ original: slug, inicial: e })}
        />
        {elemento}
      </>
    );
  }

  return (
    <>
      <CabecalhoPagina
        icone={<CalendarDays />}
        sobretitulo="Conteúdo"
        titulo="Eventos"
        descricao="Passeios, raides, encontros, concentrações, acções solidárias e formações. As provas do campeonato ficam em Desporto → Provas."
        accoes={
          <>
            <BotaoLigacao href="/eventos" externo variante="fantasma">
              <ExternalLink className="size-4" aria-hidden /> Ver no site
            </BotaoLigacao>
            {aba === "eventos" && (
              <Botao variante="primario" onClick={() => setAberto({ original: null, inicial: eventoNovo() })}>
                <Plus className="size-4" aria-hidden /> Novo evento
              </Botao>
            )}
          </>
        }
      />
      <div className="mb-5">
        <Abas
          rotulo="Secções de Eventos"
          abas={[
            { chave: "eventos", nome: "Eventos", contador: eventos.length },
            { chave: "pagina", nome: "Página Eventos" },
          ]}
          activa={aba}
          onChange={setAba}
        />
      </div>

      {aba === "eventos" ? (
        <>
          {erroExtras && (
            <div className="mb-[var(--intervalo)]">
              <Aviso tom="atencao" titulo="Não foi possível ler «Como participar»">{erroExtras}</Aviso>
            </div>
          )}
          <ListaEventos eventos={eventos} extras={extras} aoAbrir={(e) => setAberto({ original: e.slug, inicial: e })} />
        </>
      ) : (
        <EditorDoc chave="paginas.eventos" pagina="/eventos" titulo="Eventos (página da secção)" esquema={ESQUEMA_PAGINA} />
      )}
      {elemento}
    </>
  );
}

/* ---------------- Lista ---------------- */

function ListaEventos({
  eventos, extras, aoAbrir,
}: { eventos: EventoAdmin[]; extras: Map<string, string> | null; aoAbrir: (e: EventoAdmin) => void }) {
  const [procura, setProcura] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [quando, setQuando] = useState<Quando>("proximos");

  const futuros = useMemo(() => new Set(eventosFuturos(eventos).map((e) => e.slug)), [eventos]);

  const filtrados = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return eventos
      .filter((e) => {
        if (tipo !== "todos" && e.disciplina !== tipo) return false;
        if (quando === "proximos" && !futuros.has(e.slug)) return false;
        if (quando === "passados" && futuros.has(e.slug)) return false;
        if (!q) return true;
        return `${e.titulo} ${e.circuito} ${e.localidade} ${e.provincia} ${e.organizador} ${e.slug}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (quando === "passados" ? b.dataInicio.localeCompare(a.dataInicio) : a.dataInicio.localeCompare(b.dataInicio)));
  }, [eventos, procura, tipo, quando, futuros]);

  const { fatia, controlos } = usePaginacao(filtrados, 12);
  const proximo = eventosFuturos(eventos.filter(publicado))[0];

  return (
    <div className="space-y-[var(--intervalo)]">
      <div className="grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
        <Estatistica rotulo="Próximos" valor={futuros.size} sufixo={futuros.size === 1 ? "evento" : "eventos"} tom="red" />
        <Estatistica rotulo="Já aconteceram" valor={eventos.length - futuros.size} />
        <Estatistica rotulo="Rascunhos" valor={eventos.filter((e) => !publicado(e)).length} variacao="Guardados, mas fora do site" />
        <Estatistica
          rotulo="O próximo"
          valor={proximo ? `${diaMes(proximo.dataInicio).dia} ${diaMes(proximo.dataInicio).mes}` : "—"}
          variacao={proximo?.titulo}
        />
      </div>

      <Painel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Procura valor={procura} onChange={setProcura} placeholder="Procurar por título, local ou organização…" />
          <Seleccao
            aria-label="Quando"
            className="sm:!w-auto sm:min-w-[11rem]"
            valor={quando}
            onChange={(v) => setQuando(v as Quando)}
            opcoes={[
              { valor: "proximos", nome: "Próximos" },
              { valor: "passados", nome: "Já aconteceram" },
              { valor: "todos", nome: "Todos" },
            ]}
          />
        </div>
        <div className="mb-5">
          <Abas
            rotulo="Tipo de evento"
            activa={tipo}
            onChange={setTipo}
            abas={[
              { chave: "todos", nome: "Todos", contador: eventos.length },
              ...DISCIPLINAS_COMUNIDADE.map((d) => ({ chave: d as string, nome: d, contador: eventos.filter((e) => e.disciplina === d).length })),
            ]}
          />
        </div>

        {fatia.length === 0 ? (
          <Vazio titulo={eventos.length ? "Nenhum evento corresponde aos filtros" : "Ainda não há eventos"}>
            {eventos.length
              ? quando === "proximos" ? "Não há eventos marcados com estes filtros. Veja os que já aconteceram." : "Mude a procura ou o tipo."
              : "Carregue em «Novo evento» para juntar o primeiro."}
          </Vazio>
        ) : (
          <ul className="space-y-[var(--intervalo)]">
            {fatia.map((e) => (
              <li key={e.slug}>
                <LinhaEvento evento={e} futuro={futuros.has(e.slug)} participar={extras?.get(e.slug)} aoAbrir={() => aoAbrir(e)} />
              </li>
            ))}
          </ul>
        )}
        {controlos}
      </Painel>
    </div>
  );
}

function LinhaEvento({
  evento: e, futuro, participar, aoAbrir,
}: { evento: EventoAdmin; futuro: boolean; participar?: string; aoAbrir: () => void }) {
  const { dia, mes } = diaMes(e.dataInicio);
  const foto = fotoSrc(fotoDe(e.slug, e.imagem), { w: 400 });
  return (
    <button
      type="button" onClick={aoAbrir}
      className="grid w-full grid-cols-[4.5rem_minmax(0,1fr)] gap-[var(--intervalo)] rounded-[var(--raio)] bg-black/[0.18] p-[var(--intervalo)] text-left transition-colors hover:bg-white/[0.06] md:grid-cols-[4.5rem_minmax(0,1fr)_10rem]"
    >
      <span className={`flex flex-col items-center justify-center rounded-[var(--raio)] py-3 text-white ${futuro ? "bg-mb-red" : "bg-white/10"}`}>
        <span className="text-2xl font-semibold leading-none">{dia}</span>
        <span className="mt-1 text-xs uppercase tracking-[0.15em]">{mes}</span>
      </span>
      <span className="min-w-0 px-2 py-1.5 md:px-3">
        <span className="block text-[13px] text-white/75">
          <span className="text-mb-red-light">{e.disciplina}</span> · {[e.localidade, e.provincia].filter(Boolean).join(", ")}
        </span>
        <span className="mt-0.5 block truncate text-[15px] font-semibold text-white md:text-base">{e.titulo || "Sem título"}</span>
        <span className="mt-0.5 block text-[13px] text-white/75">{intervaloDatas(e.dataInicio, e.dataFim)}</span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          {!publicado(e) && <Etiqueta>Rascunho</Etiqueta>}
          {e.estado !== "agendado" && <Etiqueta tom={e.estado === "concluido" ? "neutro" : "vermelho"}>{nomeEstado(e.estado)}</Etiqueta>}
          {(e.bilhetes?.length ?? 0) > 0 && <Etiqueta tom="ouro">{e.bilhetes!.length} {e.bilhetes!.length === 1 ? "bilhete" : "bilhetes"}</Etiqueta>}
          {participar && <Etiqueta tom="ok">Como participar</Etiqueta>}
        </span>
      </span>
      <span className="relative hidden overflow-hidden rounded-[var(--raio)] bg-black/30 md:block">
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        )}
      </span>
    </button>
  );
}

/* ---------------- Editor ---------------- */

function EditorEvento({
  original, inicial, extras, aoMudarExtras, mostrar, aoFechar, aoMudarOriginal,
}: {
  original: string | null;
  inicial: EventoAdmin;
  extras: Map<string, string> | null;
  aoMudarExtras: (m: Map<string, string>) => void;
  mostrar: (texto: string, tom?: "ok" | "erro") => void;
  aoFechar: () => void;
  aoMudarOriginal: (slug: string, e: EventoAdmin) => void;
}) {
  const { estado, criar, atualizar, remover } = useAdmin();
  const novo = original === null;
  const [base, setBase] = useState<EventoAdmin>(() => normalizar(inicial));
  const [r, setR] = useState<EventoAdmin>(() => normalizar(inicial));
  const entradaGravada = (original && extras?.get(original)) || "";
  const [entradaBase, setEntradaBase] = useState(entradaGravada);
  const [entrada, setEntrada] = useState(entradaGravada);
  // Os extras chegam depois de abrir o editor: o campo acompanha-os enquanto ninguém lhe mexer.
  const [extrasVistos, setExtrasVistos] = useState(extras);
  if (extras !== extrasVistos) {
    setExtrasVistos(extras);
    if (entrada === entradaBase) { setEntrada(entradaGravada); setEntradaBase(entradaGravada); }
  }
  const [aGravar, setAGravar] = useState(false);
  const [aApagar, setAApagar] = useState(false);

  const sujo = novo || !iguais(r, base) || entrada !== entradaBase;
  const comTrabalho = sujo && (!novo || Boolean(r.titulo.trim() || r.descricao.trim()));
  useAvisoSaida(comTrabalho);

  const definir = (campos: Partial<EventoAdmin>) => setR((e) => ({ ...e, ...campos }));
  const mudarTitulo = (titulo: string) =>
    definir({ titulo, slug: novo && (r.slug === "" || r.slug === slugify(r.titulo)) ? slugify(titulo) : r.slug });

  const voltar = () => {
    if (comTrabalho && !window.confirm("Há alterações por gravar neste evento. Sair sem gravar?")) return;
    aoFechar();
  };

  const gravar = async () => {
    const final: EventoAdmin = {
      ...r,
      titulo: r.titulo.trim(),
      slug: (r.slug || slugify(r.titulo)).replace(/-+$/, ""),
      resumo: r.resumo.trim(),
      descricao: r.descricao.trim(),
      dataFim: r.dataFim || r.dataInicio,
      temporada: Number(r.dataInicio.slice(0, 4)) || r.temporada,
      horarios: r.horarios.filter((h) => h.dia || h.hora || h.sessao),
      bilhetes: (r.bilhetes ?? []).map((b) => ({ ...b, id: b.id || novoIdBilhete(), preco: Number(b.preco) || 0, disponiveis: Number(b.disponiveis) || 0 })),
    };
    if (!final.titulo) return mostrar("Escreva o título do evento.", "erro");
    if (!final.slug) return mostrar("Falta o endereço da página.", "erro");
    if (!final.dataInicio) return mostrar("Escolha a data do evento.", "erro");
    if (final.dataFim < final.dataInicio) return mostrar("A data de fim não pode ser antes da data de início.", "erro");
    if (final.slug !== original && estado.eventos.some((e) => e.slug === final.slug)) {
      return mostrar(`Já existe um evento ou uma prova com o endereço «${final.slug}». Mude o endereço.`, "erro");
    }

    setAGravar(true);
    const registo = final as unknown as Record<string, unknown>;
    const falha = original === null ? await criar("eventos", registo) : await atualizar("eventos", original, registo);
    if (falha) { setAGravar(false); return mostrar(falha, "erro"); }

    // "Como participar" (conteúdo editável): grava, muda de endereço com o evento, ou sai.
    const texto = entrada.trim();
    const mudouEndereco = original !== null && original !== final.slug;
    const tinha = original !== null && Boolean(extras?.has(original));
    let falhaExtra: string | null = null;
    if (texto !== entradaBase.trim() || (mudouEndereco && tinha)) {
      try {
        const mapa = new Map(extras ?? []);
        if (texto) {
          await gravarItemConteudo("eventos-extra", final.slug, { entrada: texto }, final.titulo, mudouEndereco && tinha ? original : undefined);
          if (original) mapa.delete(original);
          mapa.set(final.slug, texto);
        } else if (tinha && original) {
          await apagarItemConteudo("eventos-extra", original);
          mapa.delete(original);
        }
        aoMudarExtras(mapa);
      } catch (e) {
        falhaExtra = e instanceof Error ? e.message : "Falha ao gravar.";
      }
    }
    setAGravar(false);

    if (falhaExtra) mostrar(`O evento foi gravado, mas «Como participar» não: ${falhaExtra}`, "erro");
    else mostrar(novo ? "Evento criado." : "Gravado. O site já mostra as alterações.");
    if (novo || mudouEndereco) aoMudarOriginal(final.slug, final);
    else {
      setBase(final); setR(final);
      if (!falhaExtra) { setEntrada(texto); setEntradaBase(texto); }
    }
  };

  const apagar = async () => {
    if (!original) return;
    const falha = await remover("eventos", original);
    if (falha) return mostrar(falha, "erro");
    if (extras?.has(original)) {
      try {
        await apagarItemConteudo("eventos-extra", original);
        const mapa = new Map(extras);
        mapa.delete(original);
        aoMudarExtras(mapa);
      } catch { /* o texto fica órfão, sem evento que o mostre */ }
    }
    mostrar("Evento apagado.");
    aoFechar();
  };

  const vende = (r.bilhetes?.length ?? 0) > 0;
  const bilheteiraAberta = estado.definicoes.bilheteiraAberta;

  return (
    <div className="space-y-[var(--intervalo)]">
      <BarraEditor
        aoVoltar={voltar}
        voltar="Eventos"
        titulo={r.titulo || (novo ? "Novo evento" : "Sem título")}
        etiquetas={
          <>
            {novo ? <Etiqueta tom="ouro">Por gravar</Etiqueta> : publicado(base) ? <Etiqueta tom="ok">No site</Etiqueta> : <Etiqueta>Rascunho</Etiqueta>}
            {!novo && <Etiqueta>{nomeEstado(base.estado)}</Etiqueta>}
            {!novo && sujo && <Etiqueta tom="ouro">Alterações por gravar</Etiqueta>}
          </>
        }
        accoes={
          <>
            {!novo && publicado(base) && <BotaoLigacao href={`/eventos/${original}`} externo variante="fantasma">Ver no site</BotaoLigacao>}
            {!novo && <Botao variante="fantasma" onClick={() => setAApagar(true)}>Apagar</Botao>}
            {!novo && (
              <Botao variante="fantasma" disabled={!sujo} onClick={() => { setR(base); setEntrada(entradaBase); }}>Desfazer</Botao>
            )}
            <Botao variante="primario" disabled={!sujo || aGravar} onClick={gravar}>
              {aGravar ? "A gravar…" : novo ? "Criar evento" : "Gravar"}
            </Botao>
          </>
        }
      />

      <div className="grid items-start gap-[var(--intervalo)] xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-[var(--intervalo)]">
          <Painel titulo="O evento" descricao="O que aparece no topo da página do evento e no cartão da lista.">
            <div className="space-y-4">
              <Campo etiqueta="Título" obrigatorio>
                <Input value={r.titulo} onChange={(e) => mudarTitulo(e.target.value)} className="text-lg font-semibold" placeholder="Ex.: Passeio ao Miradouro da Lua" />
              </Campo>
              <CampoEndereco prefixo="/eventos" novo={novo} valor={r.slug} onChange={(slug) => definir({ slug })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Tipo de evento" ajuda="Decide em que pílula aparece em /eventos.">
                  <Seleccao
                    valor={r.disciplina}
                    opcoes={DISCIPLINAS_COMUNIDADE.map((d) => ({ valor: d, nome: d === "Solidária" ? "Solidária (acção solidária)" : d }))}
                    onChange={(v) => definir({ disciplina: v as Evento["disciplina"] })}
                  />
                </Campo>
                <Campo etiqueta="Estado" ajuda="«Já aconteceu» passa o evento para a lista de baixo, mesmo antes da data.">
                  <Seleccao valor={r.estado} opcoes={ESTADOS} onChange={(v) => definir({ estado: v as EstadoEvento })} />
                </Campo>
              </div>
              <Campo etiqueta="Resumo" ajuda="Uma frase, por baixo do título na página do evento.">
                <Area rows={2} value={r.resumo} onChange={(e) => definir({ resumo: e.target.value })} />
              </Campo>
              <Campo etiqueta="Descrição" ajuda="O texto de «Sobre o evento». Cada linha passa a um parágrafo.">
                <Area rows={7} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value })} />
              </Campo>
            </div>
          </Painel>

          <Painel titulo="Programa">
            <Formulario esquema={ESQUEMA_PROGRAMA} valor={r as unknown as Valor} onChange={(v) => setR(v as unknown as EventoAdmin)} />
          </Painel>

          <Painel
            titulo="Bilhetes"
            descricao="Só para eventos com venda de bilhetes na MotoBox. Sem bilhetes, a página mostra «Como participar»."
          >
            {vende && !bilheteiraAberta && (
              <div className="mb-4">
                <Aviso tom="atencao">
                  A bilheteira está fechada em Definições: estes bilhetes ficam guardados mas não se vendem até a abrir.
                </Aviso>
              </div>
            )}
            <Formulario esquema={ESQUEMA_BILHETES} valor={r as unknown as Valor} onChange={(v) => setR(v as unknown as EventoAdmin)} />
          </Painel>
        </div>

        <div className="space-y-[var(--intervalo)]">
          <Painel titulo="Quando e onde">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Começa a" obrigatorio>
                <Input
                  type="date" value={r.dataInicio.slice(0, 10)}
                  onChange={(e) => definir({ dataInicio: e.target.value, dataFim: !r.dataFim || r.dataFim < e.target.value ? e.target.value : r.dataFim })}
                />
              </Campo>
              <Campo etiqueta="Acaba a" ajuda="Igual à de início num evento de um dia.">
                <Input type="date" value={(r.dataFim || "").slice(0, 10)} min={r.dataInicio.slice(0, 10)} onChange={(e) => definir({ dataFim: e.target.value })} />
              </Campo>
              <Campo etiqueta="Local" className="sm:col-span-2" ajuda="O sítio do encontro ou da partida. Ex.: Marginal de Luanda.">
                <Input value={r.circuito} onChange={(e) => definir({ circuito: e.target.value })} />
              </Campo>
              <Campo etiqueta="Localidade">
                <Input value={r.localidade} onChange={(e) => definir({ localidade: e.target.value })} />
              </Campo>
              <Campo etiqueta="Província">
                <Seleccao valor={r.provincia} opcoes={PROVINCIAS.map((p) => ({ valor: p, nome: p }))} onChange={(v) => definir({ provincia: v as Evento["provincia"] })} />
              </Campo>
            </div>
          </Painel>

          <Painel titulo="Como participar" descricao="Aparece na página do evento, num quadro próprio, quando não há bilhetes à venda.">
            <Campo etiqueta="Como se participa" ajuda="Ex.: «Entrada livre», «5.000 Kz pagos no local», «Inscrição através do clube». Vazio: o quadro não aparece.">
              <Area rows={3} value={entrada} onChange={(e) => setEntrada(e.target.value)} disabled={extras === null} placeholder={extras === null ? "A carregar…" : ""} />
            </Campo>
          </Painel>

          <Painel titulo="Organização">
            <Campo etiqueta="Quem organiza" ajuda="A primeira parte, até à vírgula, aparece em grande na página do evento.">
              <Input value={r.organizador} onChange={(e) => definir({ organizador: e.target.value })} />
            </Campo>
          </Painel>

          <Painel titulo="Fotografia">
            <CampoImagem
              etiqueta="Fotografia do evento"
              valor={r.imagem}
              onChange={(imagem) => definir({ imagem })}
              ajuda={
                r.slug && fotoSrc(r.slug) && !/^(https:\/\/|\/)/.test(r.imagem) && fotoSrc(r.slug) !== fotoSrc(r.imagem)
                  ? "Este endereço já tem uma fotografia própria do site. Para a trocar, carregue outra ou cole o endereço de uma imagem."
                  : "Aparece em fundo no topo da página do evento e no cartão da lista."
              }
            />
          </Painel>

          <Painel>
            <Interruptor
              etiqueta="Publicado no site"
              descricao="Desligado, o evento fica guardado como rascunho e não aparece a ninguém."
              activo={publicado(r)}
              onChange={(v) => definir({ publicado: v })}
            />
          </Painel>
        </div>
      </div>

      <Confirmar
        aberta={aApagar} aoFechar={() => setAApagar(false)} aoConfirmar={apagar} perigo textoConfirmar="Apagar"
        titulo={`Apagar «${base.titulo}»?`}
        mensagem="O evento sai do site e da lista, com o seu «Como participar». Se só o quer esconder, desligue «Publicado no site»."
      />
    </div>
  );
}

function normalizar(e: EventoAdmin): EventoAdmin {
  return {
    ...e,
    resumo: e.resumo ?? "", descricao: e.descricao ?? "", organizador: e.organizador ?? "", imagem: e.imagem ?? "",
    circuito: e.circuito ?? "", localidade: e.localidade ?? "",
    horarios: e.horarios ?? [], bilhetes: e.bilhetes ?? [], publicado: e.publicado !== false,
  };
}
