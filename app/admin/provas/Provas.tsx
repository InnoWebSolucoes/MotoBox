"use client";

/* ============================================================
   MOTOBOX ADMIN — Provas
   As provas do calendário de Desporto (a tabela eventos, só as
   disciplinas de competição): a ficha completa de cada prova,
   do título aos bilhetes, e a ligação aos seus resultados.
   Os textos fixos das páginas estão na aba "Páginas do
   campeonato" (PaginasCampeonato). A temporada é a das
   Definições.
   ============================================================ */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flag, ListOrdered, Plus } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import { BotaoLigacao, CampoEndereco, Campo, Estado, Estatistica, Etiqueta, Grupo, Input } from "@/components/admin/kit";
import type { CampoEsquema, Opcao } from "@/components/admin/editor/esquema";
import { DISCIPLINAS_PROVA, eProva, instante } from "@/lib/desporto";
import { TEMPORADA } from "@/lib/data";
import type { Corrida, Evento } from "@/lib/types";
import {
  CampoDataComHora, ESTADOS_PROVA, OPCOES_PROVINCIAS, campoPublicado, dataCurta, nomeEstadoProva, previsualizacao,
  useConfigDesporto, type ConfigDesporto,
} from "./_desporto/campos";
import { AvisoModoLocal, ListaGestao } from "./_desporto/ListaGestao";
import { NavProvas } from "./NavProvas";
import { apagarItemConteudo, gravarItemConteudo, lerGrupoConteudo } from "../noticias/_partilhado";

/** Nome da disciplina para quem gere ("Prova" é uma competição sem modalidade). */
const nomeDisciplina = (d: string) => (d === "Prova" ? "Outra competição (sem modalidade)" : d);

function opcoesDisciplinas(config: ConfigDesporto, actuais: string[]): Opcao[] {
  const daModalidade = config.modalidades.flatMap((m) => m.disciplinas);
  const todas = [...new Set([...DISCIPLINAS_PROVA, ...daModalidade, ...actuais])].filter((d) => eProva(d));
  return todas.map((d) => ({ valor: d, nome: nomeDisciplina(d) }));
}

/** Onde a prova aparece no site, conforme a disciplina. */
function ondeAparece(config: ConfigDesporto, disciplina: string): string {
  const m = config.modalidades.find((x) => x.disciplinas.includes(disciplina));
  return m
    ? `Aparece no calendário e na página Desporto › ${m.nome}.`
    : "Aparece no calendário. Nenhuma modalidade tem esta disciplina: junte-a a uma em Modalidades para a prova entrar na página dessa modalidade.";
}

const novoBilhete = () => ({
  id: `b-${Math.random().toString(36).slice(2, 7)}`,
  nome: "", descricao: "", preco: 0, disponiveis: 100, beneficios: [] as string[],
});

export function Provas({ editar }: { editar?: string }) {
  const { estado } = useAdmin();
  const config = useConfigDesporto();
  // A temporada em curso vem das Definições; sem ela (valor estranho), a do código.
  const temporadaDef = Number(estado.definicoes.temporada);
  const temporada = Number.isInteger(temporadaDef) && temporadaDef >= 2000 && temporadaDef <= 2100 ? temporadaDef : TEMPORADA;
  const provas = estado.eventos.filter((e) => eProva(e.disciplina));

  // "Como se participa" não tem coluna na tabela eventos: vive no conteúdo
  // editável (grupo "eventos-extra", chave = endereço da prova), como nos
  // eventos da comunidade.
  const [extras, setExtras] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    let vivo = true;
    lerGrupoConteudo<{ entrada?: string }>("eventos-extra").then(
      (r) => { if (vivo) setExtras(new Map(r.itens.map((i) => [i.chave, String(i.dados?.entrada ?? "")]))); },
      () => { /* sem o conteúdo editável, o campo fica vazio */ },
    );
    return () => { vivo = false; };
  }, []);

  const gravarEntrada = async (r: Evento, original: Evento | null) => {
    const texto = String(r.entrada ?? "").trim();
    const anterior = original?.slug && original.slug !== r.slug ? original.slug : undefined;
    const tinha = extras.has(original?.slug ?? r.slug);
    if (texto) await gravarItemConteudo("eventos-extra", r.slug, { entrada: texto }, r.titulo, tinha ? anterior : undefined);
    else if (tinha) await apagarItemConteudo("eventos-extra", original?.slug ?? r.slug);
    setExtras((m) => {
      const n = new Map(m);
      if (original?.slug) n.delete(original.slug);
      if (texto) n.set(r.slug, texto);
      return n;
    });
  };
  const corridasDe = (slug: string) => estado.corridas.filter((c) => c.eventoSlug === slug);
  const agora = instante();
  const modalidadeDe = (d: string) => config.modalidades.find((m) => m.disciplinas.includes(d))?.nome;
  const temporadas = [...new Set(provas.map((e) => e.temporada))].sort((a, b) => b - a);

  const esquema = (r: Evento, ctx: { novo: boolean }): CampoEsquema[] => [
    {
      tipo: "secao", titulo: "A prova", campos: [
        { tipo: "texto", chave: "titulo", etiqueta: "Título", obrigatorio: true, placeholder: "GP de Luanda: Abertura da Temporada" },
        {
          tipo: "personalizado", chave: "slug", etiqueta: "Endereço",
          render: (v, mudar) => <CampoEndereco prefixo="/calendario" novo={ctx.novo} valor={String(v ?? "")} onChange={mudar} />,
        },
        {
          tipo: "seleccao", chave: "disciplina", etiqueta: "Modalidade", largura: "meia",
          opcoes: opcoesDisciplinas(config, [r.disciplina]), ajuda: ondeAparece(config, r.disciplina),
        },
        { tipo: "seleccao", chave: "estado", etiqueta: "Estado", largura: "meia", opcoes: ESTADOS_PROVA,
          ajuda: "\"Concluída\" fecha a venda de bilhetes e mostra os resultados." },
        {
          tipo: "numero", chave: "ronda", etiqueta: "Ronda do campeonato", min: 0, passo: 1, largura: "meia",
          ajuda: `Número da ronda no ${config.nomeCampeonato}. Vazio (ou 0) numa prova fora do campeonato: não mostra "Ronda".`,
        },
        { tipo: "numero", chave: "temporada", etiqueta: "Temporada", min: 2000, passo: 1, largura: "meia", obrigatorio: true },
        campoPublicado("a prova"),
      ],
    },
    {
      tipo: "secao", titulo: "Quando e onde", campos: [
        {
          tipo: "personalizado", chave: "dataInicio", etiqueta: "Início", largura: "meia",
          render: (v, mudar) => <CampoDataComHora etiqueta="Primeiro dia" valor={v} mudar={mudar} ajuda="A contagem decrescente conta até este dia." />,
        },
        {
          tipo: "personalizado", chave: "dataFim", etiqueta: "Fim", largura: "meia",
          render: (v, mudar) => <CampoDataComHora etiqueta="Último dia" valor={v} mudar={mudar} ajuda="Vazio: a prova é de um só dia." />,
        },
        { tipo: "texto", chave: "circuito", etiqueta: "Circuito ou local", largura: "meia", placeholder: "Circuito do Kilamba" },
        { tipo: "texto", chave: "localidade", etiqueta: "Localidade", largura: "meia", placeholder: "Kilamba Kiaxi" },
        { tipo: "seleccao", chave: "provincia", etiqueta: "Província", largura: "meia", opcoes: OPCOES_PROVINCIAS },
      ],
    },
    {
      tipo: "secao", titulo: "Apresentação", descricao: "O que aparece no calendário e no topo da página da prova.", campos: [
        { tipo: "imagem", chave: "imagem", etiqueta: "Fotografia", ajuda: "Fundo da página da prova e dos cartões do calendário." },
        { tipo: "area", chave: "resumo", etiqueta: "Resumo", linhas: 2, ajuda: "Uma ou duas frases: aparece nos cartões e por baixo do título." },
        { tipo: "area", chave: "descricao", etiqueta: "Sobre a prova", linhas: 7, ajuda: "Texto da página. Cada linha nova começa um parágrafo." },
      ],
    },
    {
      tipo: "secao", titulo: "Organização e participação", campos: [
        { tipo: "texto", chave: "organizador", etiqueta: "Organizador", largura: "meia", placeholder: "Federação Angolana de Motociclismo" },
        {
          tipo: "texto", chave: "entrada", etiqueta: "Como se participa", largura: "meia", placeholder: "Entrada livre",
          ajuda: "Mostra-se quando a MotoBox não vende bilhetes desta prova (ex.: \"5.000 Kz pagos no local\").",
        },
      ],
    },
    {
      tipo: "secao", titulo: "Programa", descricao: "Horário por dia. As sessões juntam-se pelo nome do dia.", campos: [
        {
          tipo: "lista", chave: "horarios", etiqueta: "Sessões", nomeItem: "sessão",
          novo: () => ({ dia: r.horarios?.at(-1)?.dia ?? "Sábado", hora: "", sessao: "" }),
          resumo: (h) => [h.dia, h.hora, h.sessao].filter(Boolean).join(" · "),
          campos: [
            { tipo: "texto", chave: "dia", etiqueta: "Dia", largura: "meia", placeholder: "Sábado" },
            { tipo: "texto", chave: "hora", etiqueta: "Hora", largura: "meia", placeholder: "08:00" },
            { tipo: "texto", chave: "sessao", etiqueta: "Sessão", placeholder: "Treinos livres MX2" },
          ],
        },
      ],
    },
    {
      tipo: "secao", titulo: "Ficha do circuito", campos: [
        { tipo: "texto", chave: "distanciaVolta", etiqueta: "Distância de uma volta", largura: "meia", placeholder: "1,8 km" },
        { tipo: "numero", chave: "numeroVoltas", etiqueta: "Número de voltas", largura: "meia", min: 0, passo: 1 },
        {
          tipo: "personalizado", chave: "recordeVolta", etiqueta: "Recorde de volta",
          render: (v, mudar) => <CampoRecorde valor={v as Evento["recordeVolta"] | null} mudar={mudar} />,
        },
      ],
    },
    {
      tipo: "secao", titulo: "Bilhetes",
      descricao: "Só se vendem com a bilheteira aberta nas Definições e enquanto a prova não estiver concluída. Sem bilhetes, a página mostra \"Como se participa\".",
      campos: [
        {
          tipo: "lista", chave: "bilhetes", etiqueta: "Tipos de bilhete", nomeItem: "tipo de bilhete", novo: novoBilhete,
          resumo: (b) => `${String(b.nome || "Sem nome")} · ${Number(b.preco ?? 0).toLocaleString("pt-PT")} Kz · ${Number(b.disponiveis ?? 0)} lugares`,
          campos: [
            { tipo: "texto", chave: "nome", etiqueta: "Nome", placeholder: "Bancada" },
            { tipo: "numero", chave: "preco", etiqueta: "Preço (Kz)", largura: "meia", min: 0, passo: 100 },
            { tipo: "numero", chave: "disponiveis", etiqueta: "Lugares disponíveis", largura: "meia", min: 0, passo: 1,
              ajuda: "Com 0 em todos os tipos, a prova aparece como esgotada." },
            { tipo: "area", chave: "descricao", etiqueta: "Descrição", linhas: 2 },
            { tipo: "lista-texto", chave: "beneficios", etiqueta: "O que inclui", placeholder: "Acesso ao paddock" },
            { tipo: "booleano", chave: "destaque", etiqueta: "Destacar este bilhete", descricao: "Aparece realçado na página de compra." },
          ],
        },
      ],
    },
  ];

  return (
    <ListaGestao<Evento>
      coleccao="eventos"
      itens={provas}
      titulo="Provas"
      descricao="As provas do calendário de Desporto, de todas as modalidades: datas, local, programa, ficha do circuito e bilhetes. Os resultados de cada prova estão em Resultados."
      icone={<Flag />}
      nomeItem="prova"
      feminino
      campoNome="titulo"
      prefixoPagina="/calendario"
      editarInicial={editar}
      prepararFicha={(e) => ({ ...e, entrada: extras.get(e.slug) ?? e.entrada ?? "" })}
      soNoPainel={["entrada"]}
      depoisDeGravar={gravarEntrada}
      aviso={<><NavProvas activa="provas" /><AvisoModoLocal /></>}
      numeros={
        <div className="grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
          <Estatistica rotulo={`Provas em ${temporada}`} valor={provas.filter((e) => e.temporada === temporada).length} icone={<Flag />} />
          <Estatistica rotulo="Por disputar" valor={provas.filter((e) => new Date(e.dataInicio).getTime() > agora).length} tom="red" />
          <Estatistica rotulo="Concluídas" valor={provas.filter((e) => e.estado === "concluido").length} />
          <Estatistica rotulo="Com bilhetes" valor={provas.filter((e) => (e.bilhetes?.length ?? 0) > 0).length} />
        </div>
      }
      procuraEm={(e) => `${e.titulo} ${e.circuito} ${e.localidade} ${e.provincia} ${e.organizador} ${e.disciplina}`}
      ordenar={(a, b) => a.dataInicio.localeCompare(b.dataInicio)}
      filtros={[
        { chave: "disciplina", etiqueta: "Todas as modalidades", opcoes: opcoesDisciplinas(config, provas.map((e) => e.disciplina)) },
        { chave: "temporada", etiqueta: "Todas as temporadas", opcoes: temporadas.map((t) => ({ valor: String(t), nome: `Temporada ${t}` })) },
        { chave: "estado", etiqueta: "Todos os estados", opcoes: ESTADOS_PROVA },
        { chave: "campeonato", etiqueta: "Dentro e fora do campeonato", valor: (e) => (e.ronda ? "sim" : "nao"),
          opcoes: [{ valor: "sim", nome: "Do campeonato" }, { valor: "nao", nome: "Fora do campeonato" }] },
      ]}
      colunas={[
        {
          cabecalho: "Prova",
          celula: (e) => {
            const foto = previsualizacao(e.imagem, 160);
            return (
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-[4px] bg-white/[0.06]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {foto && <img src={foto} alt="" className="size-full object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="block max-w-[22rem] truncate font-medium text-white">{e.titulo}</span>
                  <span className="block max-w-[22rem] truncate text-xs text-white/75">{[e.circuito, e.provincia].filter(Boolean).join(", ")}</span>
                </span>
              </div>
            );
          },
        },
        { cabecalho: "Modalidade", celula: (e) => <span className="text-white/75">{modalidadeDe(e.disciplina) ?? nomeDisciplina(e.disciplina)}</span> },
        { cabecalho: "Data", celula: (e) => <span className="whitespace-nowrap tabular-nums text-white/75">{dataCurta(e.dataInicio)}</span> },
        { cabecalho: "Ronda", celula: (e) => (e.ronda ? <span className="tabular-nums">{e.ronda}</span> : <span className="text-xs text-white/70">Fora</span>) },
        { cabecalho: "Estado", celula: (e) => <Estado valor={e.estado} rotulo={nomeEstadoProva(e.estado)} /> },
        {
          cabecalho: "Resultados",
          celula: (e) => {
            const n = corridasDe(e.slug).length;
            return (
              <Link
                href={n ? `/admin/corridas?prova=${encodeURIComponent(e.slug)}` : `/admin/corridas?nova=${encodeURIComponent(e.slug)}`}
                onClick={(ev) => ev.stopPropagation()}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] bg-white/[0.06] px-2 py-1 text-xs text-white/80 hover:bg-white/[0.12] hover:text-white"
              >
                {n ? <><ListOrdered className="size-3.5" aria-hidden /> {n} {n === 1 ? "tabela" : "tabelas"}</> : <><Plus className="size-3.5" aria-hidden /> Juntar</>}
              </Link>
            );
          },
        },
      ]}
      novo={() => ({
        slug: "", titulo: "", disciplina: "Motocross", temporada,
        circuito: "", provincia: "Luanda", localidade: "",
        dataInicio: "", dataFim: "", estado: "agendado", imagem: "", resumo: "", descricao: "",
        organizador: "Federação Angolana de Motociclismo", horarios: [], bilhetes: [],
      }) as Evento}
      preparar={(r) => ({
        ...r,
        dataFim: r.dataFim || r.dataInicio,
        ronda: r.ronda ? r.ronda : (null as unknown as undefined),
        horarios: Array.isArray(r.horarios) ? r.horarios : [],
        bilhetes: Array.isArray(r.bilhetes) ? r.bilhetes : [],
      })}
      validar={(r) => {
        if (!r.titulo?.trim()) return "Escreva o título da prova.";
        if (!r.dataInicio) return "Escolha o primeiro dia da prova.";
        if (r.dataFim && r.dataFim.slice(0, 10) < r.dataInicio.slice(0, 10)) return "O último dia não pode ser antes do primeiro.";
        if (!r.temporada) return "Indique a temporada.";
        return null;
      }}
      esquema={esquema}
      extraFicha={(r, ctx) => <ResultadosDaProva prova={r} novo={ctx.novo} corridas={corridasDe(ctx.original?.slug ?? r.slug)} />}
      vazio={{ titulo: "Ainda não há provas", texto: "Crie a primeira prova da temporada: aparece logo no calendário e na página da modalidade." }}
    />
  );
}

/** Recorde de volta: piloto, tempo e ano. Tudo vazio tira o recorde da página. */
function CampoRecorde({ valor, mudar }: { valor: Evento["recordeVolta"] | null; mudar: (v: unknown) => void }) {
  const r = valor ?? { piloto: "", tempo: "", ano: 0 };
  const definir = (campos: Partial<NonNullable<Evento["recordeVolta"]>>) => {
    const novo = { ...r, ...campos };
    mudar(!novo.piloto && !novo.tempo && !novo.ano ? null : novo);
  };
  return (
    <Grupo titulo="Recorde de volta" descricao="Aparece na ficha do circuito. Deixe tudo vazio se não houver recorde.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Piloto"><Input value={r.piloto} onChange={(e) => definir({ piloto: e.target.value })} placeholder="Nelson Kiala" /></Campo>
        <Campo etiqueta="Tempo"><Input value={r.tempo} onChange={(e) => definir({ tempo: e.target.value })} placeholder="1:52.340" /></Campo>
        <Campo etiqueta="Ano">
          <Input type="number" inputMode="numeric" value={r.ano || ""} onChange={(e) => definir({ ano: e.target.value ? Number(e.target.value) : 0 })} placeholder="2025" />
        </Campo>
      </div>
    </Grupo>
  );
}

/** As tabelas de resultados ligadas a esta prova, com atalhos para Resultados. */
function ResultadosDaProva({ prova, novo, corridas }: { prova: Evento; novo: boolean; corridas: Corrida[] }) {
  return (
    <Grupo
      titulo="Resultados desta prova"
      descricao="Uma tabela por categoria (MX1, MX2…). Editam-se em Resultados; aparecem na página da prova quando ela termina."
      accoes={!novo ? (
        <BotaoLigacao href={`/admin/corridas?nova=${encodeURIComponent(prova.slug)}`} tamanho="sm" variante="secundario">
          <Plus className="size-3.5" aria-hidden /> Juntar resultados
        </BotaoLigacao>
      ) : undefined}
    >
      {novo ? (
        <p className="text-sm text-white/75">Grave a prova primeiro; depois pode juntar-lhe os resultados.</p>
      ) : corridas.length === 0 ? (
        <p className="text-sm text-white/75">Ainda sem resultados.</p>
      ) : (
        <ul className="space-y-1.5">
          {corridas.map((c) => (
            <li key={c.slug}>
              <Link href={`/admin/corridas?editar=${encodeURIComponent(c.slug)}`}
                className="flex items-center justify-between gap-3 rounded-[var(--raio)] bg-white/[0.05] px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.1]">
                <span className="flex min-w-0 items-center gap-2">
                  <Etiqueta tom="vermelho">{c.categoria || "Sem categoria"}</Etiqueta>
                  <span className="truncate text-white">{c.nome}</span>
                </span>
                <span className="shrink-0 text-xs text-white/75">
                  {c.resultados.length} classificados{c.vencedor ? ` · ${c.vencedor}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Grupo>
  );
}
