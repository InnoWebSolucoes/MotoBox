"use client";

/* ============================================================
   MOTOBOX ADMIN — Resultados
   Uma tabela de classificação por prova e categoria (a tabela
   corridas). A prova liga a tabela à página da prova; a tabela
   de pilotos edita-se linha a linha, com o pódio à vista.
   ============================================================ */

import Link from "next/link";
import { ListOrdered, Trophy } from "lucide-react";
import { useAdmin, slugify } from "@/lib/admin/store";
import { Aviso, BotaoLigacao, CampoEndereco, Campo, Estatistica, Etiqueta, Seleccao } from "@/components/admin/kit";
import type { CampoEsquema } from "@/components/admin/editor/esquema";
import { eProva } from "@/lib/desporto";
import { TEMPORADA } from "@/lib/data";
import type { Corrida, Evento, ResultadoCorrida } from "@/lib/types";
import { OPCOES_PROVINCIAS, campoPublicado, dataCurta, opcoesCategorias, useConfigDesporto } from "../provas/_desporto/campos";
import { AvisoModoLocal, ListaGestao } from "../provas/_desporto/ListaGestao";
import { EditorResultados, vencedorDe } from "./EditorResultados";

/** Campos que a tabela herda da prova escolhida. */
function daProva(e: Evento, r: Corrida): Partial<Corrida> {
  return {
    eventoSlug: e.slug,
    nome: r.nome || e.titulo.split(":")[0].trim(),
    ronda: e.ronda ?? 0,
    temporada: e.temporada,
    circuito: e.circuito,
    provincia: e.provincia,
    data: (e.dataFim || e.dataInicio).slice(0, 10),
    imagem: r.imagem || e.imagem,
  };
}

export function Resultados({ prova, editar, nova }: { prova?: string; editar?: string; nova?: string }) {
  const { estado } = useAdmin();
  // A temporada em curso vem das Definições; sem ela (valor estranho), a do código.
  const temporadaDef = Number(estado.definicoes.temporada);
  const temporada = Number.isInteger(temporadaDef) && temporadaDef >= 2000 && temporadaDef <= 2100 ? temporadaDef : TEMPORADA;
  const config = useConfigDesporto();
  const provas = estado.eventos.filter((e) => eProva(e.disciplina)).sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
  const provaDe = (slug: string) => estado.eventos.find((e) => e.slug === slug);
  const corridas = estado.corridas;
  const categorias = opcoesCategorias(config, corridas.map((c) => c.categoria));
  const temporadas = [...new Set(corridas.map((c) => c.temporada))].sort((a, b) => b - a);
  const provaNova = nova ? provaDe(nova) : undefined;

  const opcoesProvas = [
    { valor: "", nome: "Sem prova ligada" },
    ...provas.map((e) => ({ valor: e.slug, nome: `${dataCurta(e.dataInicio)} · ${e.titulo}` })),
  ];

  const esquema = (r: Corrida, ctx: { novo: boolean; mudar: (c: Partial<Corrida>) => void }): CampoEsquema[] => [
    {
      tipo: "secao", titulo: "A corrida", campos: [
        {
          tipo: "personalizado", chave: "eventoSlug", etiqueta: "Prova",
          render: (v) => (
            <Campo etiqueta="Prova" ajuda="A tabela aparece na página desta prova. Ao escolher, o local, a data e a ronda vêm da prova.">
              <span className="flex gap-2">
                <Seleccao
                  valor={String(v ?? "")}
                  opcoes={v && !provaDe(String(v)) ? [...opcoesProvas, { valor: String(v), nome: `${v} (prova apagada)` }] : opcoesProvas}
                  onChange={(slug) => {
                    const e = provaDe(slug);
                    ctx.mudar(e ? daProva(e, r) : { eventoSlug: "" });
                  }}
                />
                {v && provaDe(String(v)) ? (
                  <BotaoLigacao href={`/admin/provas?editar=${encodeURIComponent(String(v))}`} variante="fantasma">Abrir</BotaoLigacao>
                ) : null}
              </span>
            </Campo>
          ),
        },
        { tipo: "texto", chave: "nome", etiqueta: "Nome da corrida", obrigatorio: true, placeholder: "GP de Luanda", largura: "meia" },
        {
          tipo: "seleccao", chave: "categoria", etiqueta: "Categoria", largura: "meia", opcoes: categorias,
          ajuda: "As categorias editam-se em Modalidades › Página Desporto.",
        },
        {
          tipo: "personalizado", chave: "slug", etiqueta: "Endereço",
          render: (v, mudar) => <CampoEndereco prefixo="/resultados" novo={ctx.novo} valor={String(v ?? "")} onChange={mudar} />,
        },
        {
          tipo: "numero", chave: "ronda", etiqueta: "Ronda do campeonato", min: 0, passo: 1, largura: "meia",
          ajuda: `0 numa corrida fora do ${config.nomeCampeonato}: não conta para o arquivo do campeonato.`,
        },
        { tipo: "numero", chave: "temporada", etiqueta: "Temporada", min: 2000, passo: 1, largura: "meia" },
        { tipo: "data", chave: "data", etiqueta: "Data da corrida", largura: "meia" },
        { tipo: "texto", chave: "vencedor", etiqueta: "Vencedor", largura: "meia",
          ajuda: "Preenche-se sozinho com o 1.º da tabela. Pode escrevê-lo à mão." },
        { tipo: "texto", chave: "circuito", etiqueta: "Circuito", largura: "meia" },
        { tipo: "seleccao", chave: "provincia", etiqueta: "Província", largura: "meia", opcoes: OPCOES_PROVINCIAS },
        { tipo: "imagem", chave: "imagem", etiqueta: "Fotografia", ajuda: "Fundo do cartão no arquivo de resultados e da página da corrida." },
        campoPublicado("a tabela"),
      ],
    },
    {
      tipo: "secao", titulo: "Classificação",
      descricao: "Pela ordem de chegada. A equipa vem da ficha do piloto; os pontos somam-se à mão (ou com o botão do Mundial).",
      campos: [
        {
          tipo: "personalizado", chave: "resultados", etiqueta: "Classificação",
          render: (v) => (
            <EditorResultados
              valor={Array.isArray(v) ? (v as ResultadoCorrida[]) : []}
              pilotos={estado.pilotos}
              equipas={estado.equipas}
              categoria={r.categoria}
              mudar={(lista) => {
                // O vencedor acompanha o 1.º lugar enquanto não for escrito à mão.
                const antes = vencedorDe(r.resultados ?? []);
                const depois = vencedorDe(lista);
                const automatico = !r.vencedor || r.vencedor === antes;
                ctx.mudar({ resultados: lista, ...(automatico ? { vencedor: depois } : {}) });
              }}
            />
          ),
        },
      ],
    },
  ];

  const filtrosIniciais = prova ? { eventoSlug: prova } : undefined;
  const provaFiltrada = prova ? provaDe(prova) : undefined;

  return (
    <ListaGestao<Corrida>
      coleccao="corridas"
      itens={corridas}
      titulo="Resultados"
      descricao="A classificação de cada corrida, por prova e categoria: posições, tempos, pontos, volta mais rápida e desistências. Aparece na página da prova, no arquivo de resultados e na página da modalidade."
      icone={<ListOrdered />}
      nomeItem="tabela de resultados"
      feminino
      campoNome="nome"
      prefixoPagina="/resultados"
      larguraGaveta="max-w-4xl"
      endereco={(r) => slugify([r.nome, r.temporada, r.categoria].filter(Boolean).join(" "))}
      editarInicial={editar}
      novoInicial={provaNova ? { ...daProva(provaNova, { nome: "", imagem: "" } as Corrida) } : undefined}
      filtrosIniciais={filtrosIniciais}
      aviso={
        <div className="space-y-[var(--intervalo)]">
          <AvisoModoLocal />
          {provaFiltrada && (
            <Aviso
              titulo={`Resultados de ${provaFiltrada.titulo}`}
              accoes={<>
                <BotaoLigacao href={`/admin/provas?editar=${encodeURIComponent(provaFiltrada.slug)}`} variante="fantasma" tamanho="sm">Abrir a prova</BotaoLigacao>
                <BotaoLigacao href="/admin/corridas" tamanho="sm">Ver todas</BotaoLigacao>
              </>}
            >
              A lista mostra só as tabelas desta prova (pode mudar o filtro &quot;Prova&quot;).
            </Aviso>
          )}
        </div>
      }
      numeros={
        <div className="grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
          <Estatistica rotulo={`Tabelas em ${temporada}`} valor={corridas.filter((c) => c.temporada === temporada).length} icone={<ListOrdered />} />
          <Estatistica rotulo="Do campeonato" valor={corridas.filter((c) => c.ronda > 0).length} />
          <Estatistica rotulo="Vencedores diferentes" valor={new Set(corridas.map((c) => c.vencedor).filter(Boolean)).size} icone={<Trophy />} />
          <Estatistica rotulo="Sem prova ligada" valor={corridas.filter((c) => !c.eventoSlug || !provaDe(c.eventoSlug)).length}
            tom={corridas.some((c) => !c.eventoSlug || !provaDe(c.eventoSlug)) ? "gold" : "neutral"} />
        </div>
      }
      procuraEm={(c) => `${c.nome} ${c.circuito} ${c.vencedor} ${c.categoria} ${c.resultados.map((r) => r.piloto).join(" ")}`}
      ordenar={(a, b) => b.data.localeCompare(a.data) || a.categoria.localeCompare(b.categoria)}
      filtros={[
        {
          chave: "eventoSlug", etiqueta: "Todas as provas",
          opcoes: provas.map((e) => ({ valor: e.slug, nome: e.titulo })),
        },
        { chave: "categoria", etiqueta: "Todas as categorias", opcoes: categorias },
        { chave: "temporada", etiqueta: "Todas as temporadas", opcoes: temporadas.map((t) => ({ valor: String(t), nome: `Temporada ${t}` })) },
      ]}
      colunas={[
        {
          cabecalho: "Corrida",
          celula: (c) => (
            <div className="min-w-0">
              <p className="max-w-[18rem] truncate font-medium text-white">{c.nome}</p>
              <p className="max-w-[18rem] truncate text-xs text-white/75">{[c.circuito, c.provincia].filter(Boolean).join(", ")}</p>
            </div>
          ),
        },
        { cabecalho: "Categoria", celula: (c) => <Etiqueta tom={config.campeonato.includes(c.categoria) ? "vermelho" : "neutro"}>{c.categoria || "—"}</Etiqueta> },
        {
          cabecalho: "Prova",
          celula: (c) => {
            const e = c.eventoSlug ? provaDe(c.eventoSlug) : undefined;
            return e ? (
              <Link href={`/admin/provas?editar=${encodeURIComponent(e.slug)}`} onClick={(ev) => ev.stopPropagation()}
                className="block max-w-[14rem] truncate text-white/75 underline decoration-white/20 underline-offset-2 hover:text-white">
                {e.titulo}
              </Link>
            ) : <Etiqueta tom="ouro">Sem prova</Etiqueta>;
          },
        },
        { cabecalho: "Data", celula: (c) => <span className="whitespace-nowrap tabular-nums text-white/75">{dataCurta(c.data)}</span> },
        { cabecalho: "Ronda", celula: (c) => (c.ronda > 0 ? <span className="tabular-nums">{c.ronda}</span> : <span className="text-xs text-white/70">Fora</span>) },
        { cabecalho: "Vencedor", celula: (c) => <span className="text-white">{c.vencedor || "—"}</span> },
        { cabecalho: "Pilotos", celula: (c) => <span className="tabular-nums text-white/70">{c.resultados.length}</span> },
      ]}
      novo={() => ({
        slug: "", eventoSlug: "", nome: "", ronda: 0, temporada: temporada, circuito: "", provincia: "Luanda",
        data: new Date().toISOString().slice(0, 10), categoria: config.categorias[0] ?? "", vencedor: "", imagem: "", resultados: [],
      }) as unknown as Corrida}
      preparar={(r) => ({
        ...r,
        ronda: Number(r.ronda) || 0,
        resultados: Array.isArray(r.resultados) ? r.resultados : [],
        vencedor: r.vencedor || vencedorDe(r.resultados ?? []),
      })}
      validar={(r) => {
        if (!r.nome?.trim()) return "Escreva o nome da corrida.";
        if (!r.data) return "Escolha a data da corrida.";
        if (!r.temporada) return "Indique a temporada.";
        if (r.resultados.some((x) => !x.piloto?.trim())) return "Há linhas sem piloto na classificação. Escolha o piloto ou tire a linha.";
        return null;
      }}
      esquema={esquema}
      extraFicha={(r, ctx) => (!ctx.novo && r.resultados.length === 0 ? (
        <p className="text-sm text-white/75">Esta tabela ainda não tem pilotos: o site mostra-a sem classificação.</p>
      ) : null)}
      vazio={{ titulo: "Ainda não há resultados", texto: "Quando uma prova terminar, junte aqui a classificação de cada categoria." }}
    />
  );
}
