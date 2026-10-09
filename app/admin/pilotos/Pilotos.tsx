"use client";

/* ============================================================
   MOTOBOX ADMIN — Pilotos
   A ficha completa de cada piloto: identidade, equipa,
   categoria, fotografia, biografia, estatísticas, títulos e
   redes. Ao mudar de equipa, o plantel das equipas acerta-se.
   ============================================================ */

import { Calculator, UserRound } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import { Botao, CampoEndereco, Campo, Estatistica, Etiqueta, Grupo, Seleccao } from "@/components/admin/kit";
import type { CampoEsquema } from "@/components/admin/editor/esquema";
import { TEMPORADA } from "@/lib/data";
import { retratoDe } from "@/lib/desporto";
import type { Piloto } from "@/lib/types";
import { OPCOES_PROVINCIAS, campoPublicado, opcoesCategorias, previsualizacao, useConfigDesporto } from "../provas/_desporto/campos";
import { AvisoModoLocal, ListaGestao } from "../provas/_desporto/ListaGestao";

function iniciais(nome: string) {
  return nome.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/** Miniatura do retrato, como o site o escolhe (a fotografia do painel ou a de origem). */
export function MiniRetrato({ p, cor, tamanho = "size-10" }: { p: Pick<Piloto, "slug" | "foto" | "nome">; cor?: string; tamanho?: string }) {
  const url = previsualizacao(retratoDe(p), 120);
  return (
    <span className={`relative grid ${tamanho} shrink-0 place-items-center overflow-hidden rounded-[4px] text-xs font-semibold text-white/80`}
      style={{ background: cor ?? "#3d3d47" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt="" className="absolute inset-0 size-full object-cover" /> : iniciais(p.nome)}
    </span>
  );
}

export function Pilotos({ editar }: { editar?: string }) {
  const { estado, atualizar } = useAdmin();
  const config = useConfigDesporto();
  const pilotos = estado.pilotos;
  const equipas = estado.equipas;
  const corDe = (slug: string) => equipas.find((e) => e.slug === slug)?.cor;
  const categorias = opcoesCategorias(config, pilotos.map((p) => p.categoria));

  /** Estatísticas da temporada contadas nas tabelas de resultados. */
  const contar = (slug: string) => {
    const linhas = estado.corridas
      .filter((c) => c.temporada === TEMPORADA)
      .flatMap((c) => c.resultados.filter((r) => r.pilotoSlug === slug));
    const pos = linhas.filter((r) => !r.estado && r.posicao > 0).map((r) => r.posicao);
    const melhor = pos.length ? Math.min(...pos) : 0;
    return {
      pontos: linhas.reduce((s, r) => s + (Number(r.pontos) || 0), 0),
      vitorias: pos.filter((p) => p === 1).length,
      podios: pos.filter((p) => p <= 3).length,
      corridas: linhas.length,
      melhorResultado: melhor ? `${melhor}.º` : "",
    };
  };

  const esquema = (r: Piloto, ctx: { novo: boolean; mudar: (c: Partial<Piloto>) => void }): CampoEsquema[] => [
    {
      tipo: "secao", titulo: "Identidade", campos: [
        { tipo: "texto", chave: "nome", etiqueta: "Nome", obrigatorio: true, largura: "meia" },
        { tipo: "texto", chave: "apelido", etiqueta: "Alcunha", largura: "meia", ajuda: "Aparece entre aspas por baixo do nome. Vazio, não aparece." },
        {
          tipo: "personalizado", chave: "slug", etiqueta: "Endereço",
          render: (v, mudar) => <CampoEndereco prefixo="/pilotos" novo={ctx.novo} valor={String(v ?? "")} onChange={mudar} />,
        },
        { tipo: "numero", chave: "numero", etiqueta: "Número de corrida", min: 0, passo: 1, largura: "meia" },
        {
          tipo: "seleccao", chave: "categoria", etiqueta: "Categoria", largura: "meia", opcoes: categorias,
          ajuda: "Liga o piloto à modalidade e à classificação. As categorias editam-se em Modalidades › Página Desporto.",
        },
        {
          tipo: "personalizado", chave: "equipaSlug", etiqueta: "Equipa",
          render: (v) => (
            <Campo etiqueta="Equipa" ajuda="O plantel da equipa acerta-se sozinho ao gravar.">
              <Seleccao
                valor={String(v ?? "")}
                opcoes={[{ valor: "", nome: "Sem equipa" }, ...equipas.map((e) => ({ valor: e.slug, nome: `${e.nome} (${e.tipo})` }))]}
                onChange={(slug) => ctx.mudar({ equipaSlug: slug, equipa: equipas.find((e) => e.slug === slug)?.nome ?? "" })}
              />
            </Campo>
          ),
          largura: "meia",
        },
        { tipo: "texto", chave: "mota", etiqueta: r.categoria === "Karting" ? "Kart" : "Mota", largura: "meia", placeholder: "KTM 450 SX-F" },
        { tipo: "seleccao", chave: "provincia", etiqueta: "Província", largura: "meia", opcoes: OPCOES_PROVINCIAS },
        { tipo: "texto", chave: "nacionalidade", etiqueta: "Nacionalidade", largura: "meia" },
        { tipo: "numero", chave: "idade", etiqueta: "Idade", min: 0, passo: 1, largura: "meia" },
        { tipo: "numero", chave: "estreia", etiqueta: "Ano de estreia", min: 1950, passo: 1, largura: "meia",
          ajuda: "Conta as temporadas na ficha do piloto." },
        campoPublicado("o piloto"),
      ],
    },
    {
      tipo: "secao", titulo: "Fotografia e biografia", campos: [
        {
          tipo: "imagem", chave: "foto", etiqueta: "Retrato", formato: "aspect-[4/5] max-w-[14rem]",
          ajuda: "Vertical, de preferência. Vazio, aparece o retrato de origem ou as iniciais sobre a cor da equipa.",
        },
        { tipo: "area", chave: "bio", etiqueta: "Biografia", linhas: 6 },
      ],
    },
    {
      tipo: "secao", titulo: "Estatísticas",
      descricao: "Os pontos ordenam a classificação e as listas de pilotos.",
      campos: [
        {
          tipo: "personalizado", chave: "_contar", etiqueta: "Contar",
          render: () => (
            <div className="flex flex-wrap items-center gap-3 rounded-[var(--raio)] bg-black/20 px-4 py-3">
              <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-white/60">
                Pode somar os pontos, vitórias, pódios e corridas das tabelas de Resultados de {TEMPORADA}. Revê antes de gravar.
              </p>
              <Botao tamanho="sm" onClick={() => {
                const c = contar(r.slug);
                ctx.mudar({ estatisticas: { ...r.estatisticas, ...c, melhorResultado: c.melhorResultado || r.estatisticas?.melhorResultado || "" } });
              }}>
                <Calculator className="size-3.5" aria-hidden /> Contar dos resultados
              </Botao>
            </div>
          ),
        },
        {
          tipo: "objecto", chave: "estatisticas", etiqueta: "Números da temporada", campos: [
            { tipo: "numero", chave: "pontos", etiqueta: "Pontos", min: 0, largura: "meia" },
            { tipo: "numero", chave: "vitorias", etiqueta: "Vitórias", min: 0, passo: 1, largura: "meia" },
            { tipo: "numero", chave: "podios", etiqueta: "Pódios", min: 0, passo: 1, largura: "meia" },
            { tipo: "numero", chave: "poles", etiqueta: "Poles", min: 0, passo: 1, largura: "meia" },
            { tipo: "numero", chave: "corridas", etiqueta: "Corridas", min: 0, passo: 1, largura: "meia" },
            { tipo: "texto", chave: "melhorResultado", etiqueta: "Melhor resultado", largura: "meia", placeholder: "1.º" },
          ],
        },
        { tipo: "numero", chave: "campeonatos", etiqueta: "Títulos nacionais", min: 0, passo: 1, largura: "meia",
          ajuda: "Com 1 ou mais, a ficha mostra \"Campeão Nacional\"." },
      ],
    },
    {
      tipo: "objecto", chave: "redes", etiqueta: "Redes sociais", ajuda: "Endereços completos. Vazio, o botão não aparece.", campos: [
        { tipo: "url", chave: "instagram", etiqueta: "Instagram", largura: "meia", placeholder: "https://instagram.com/…" },
        { tipo: "url", chave: "facebook", etiqueta: "Facebook", largura: "meia", placeholder: "https://facebook.com/…" },
      ],
    },
  ];

  return (
    <ListaGestao<Piloto>
      coleccao="pilotos"
      itens={pilotos}
      titulo="Pilotos"
      descricao="As fichas dos pilotos: número, categoria, equipa, retrato, biografia, estatísticas e redes. Os pontos ordenam a classificação."
      icone={<UserRound />}
      nomeItem="piloto"
      campoNome="nome"
      prefixoPagina="/pilotos"
      editarInicial={editar}
      aviso={<AvisoModoLocal />}
      soNoPainel={["_contar"]}
      numeros={
        <div className="grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
          <Estatistica rotulo="Pilotos" valor={pilotos.length} icone={<UserRound />} />
          <Estatistica rotulo={`No ${config.nomeCampeonato}`} valor={pilotos.filter((p) => config.campeonato.includes(p.categoria)).length} tom="red" />
          <Estatistica rotulo="Categorias" valor={new Set(pilotos.map((p) => p.categoria).filter(Boolean)).size} />
          <Estatistica rotulo="Sem equipa" valor={pilotos.filter((p) => !p.equipaSlug).length} />
        </div>
      }
      procuraEm={(p) => `${p.nome} ${p.apelido ?? ""} ${p.equipa} ${p.mota} ${p.categoria} ${p.numero}`}
      ordenar={(a, b) => (b.estatisticas?.pontos ?? 0) - (a.estatisticas?.pontos ?? 0) || a.nome.localeCompare(b.nome)}
      filtros={[
        { chave: "categoria", etiqueta: "Todas as categorias", opcoes: categorias },
        { chave: "equipaSlug", etiqueta: "Todas as equipas", opcoes: equipas.map((e) => ({ valor: e.slug, nome: e.nome })) },
        { chave: "provincia", etiqueta: "Todas as províncias", opcoes: OPCOES_PROVINCIAS.filter((o) => pilotos.some((p) => p.provincia === o.valor)) },
      ]}
      colunas={[
        {
          cabecalho: "Piloto",
          celula: (p) => (
            <div className="flex min-w-0 items-center gap-3">
              <MiniRetrato p={p} cor={corDe(p.equipaSlug)} />
              <span className="min-w-0">
                <span className="block max-w-[16rem] truncate font-medium text-white">
                  <span className="mr-1.5 tabular-nums text-white/45">#{p.numero}</span>{p.nome}
                </span>
                <span className="block max-w-[16rem] truncate text-xs text-white/50">{p.equipa || "Sem equipa"}</span>
              </span>
            </div>
          ),
        },
        { cabecalho: "Categoria", celula: (p) => <Etiqueta tom={config.campeonato.includes(p.categoria) ? "vermelho" : "neutro"}>{p.categoria || "—"}</Etiqueta> },
        { cabecalho: "Província", celula: (p) => <span className="text-white/70">{p.provincia}</span> },
        { cabecalho: "Pontos", celula: (p) => <span className="font-semibold tabular-nums">{p.estatisticas?.pontos ?? 0}</span> },
        { cabecalho: "Vitórias", celula: (p) => <span className="tabular-nums text-white/70">{p.estatisticas?.vitorias ?? 0}</span> },
        { cabecalho: "Pódios", celula: (p) => <span className="tabular-nums text-white/70">{p.estatisticas?.podios ?? 0}</span> },
      ]}
      novo={() => ({
        slug: "", nome: "", numero: 0, equipa: "", equipaSlug: "",
        provincia: "Luanda", nacionalidade: "Angolana", idade: 20,
        mota: "", categoria: config.categorias[0] ?? "", foto: "", bio: "", estreia: TEMPORADA,
        estatisticas: { pontos: 0, vitorias: 0, podios: 0, poles: 0, corridas: 0, melhorResultado: "" },
        redes: {}, campeonatos: 0,
      }) as Piloto}
      preparar={(r) => ({
        ...r,
        numero: Number(r.numero) || 0,
        idade: Number(r.idade) || 0,
        estreia: Number(r.estreia) || TEMPORADA,
        campeonatos: Number(r.campeonatos) || 0,
        estatisticas: {
          pontos: Number(r.estatisticas?.pontos) || 0,
          vitorias: Number(r.estatisticas?.vitorias) || 0,
          podios: Number(r.estatisticas?.podios) || 0,
          poles: Number(r.estatisticas?.poles) || 0,
          corridas: Number(r.estatisticas?.corridas) || 0,
          melhorResultado: r.estatisticas?.melhorResultado ?? "",
        },
        redes: r.redes ?? {},
      })}
      validar={(r) => {
        if (!r.nome?.trim()) return "Escreva o nome do piloto.";
        const repetido = pilotos.find((p) => p.slug !== r.slug && p.numero === r.numero && r.numero > 0 && p.categoria === r.categoria);
        return repetido ? `O número ${r.numero} já é de ${repetido.nome} em ${r.categoria}. Escolha outro.` : null;
      }}
      depoisDeGravar={async (r, original) => {
        // O plantel guardado nas equipas acompanha a equipa do piloto.
        const antigo = original?.slug ?? r.slug;
        for (const e of equipas) {
          const lista = Array.isArray(e.pilotos) ? e.pilotos : [];
          let nova: string[];
          if (e.slug === r.equipaSlug) {
            const trocada = [...new Set(lista.map((s) => (s === antigo ? r.slug : s)))];
            nova = trocada.includes(r.slug) ? trocada : [...trocada, r.slug];
          } else {
            nova = lista.filter((s) => s !== antigo && s !== r.slug);
          }
          if (JSON.stringify(nova) !== JSON.stringify(lista)) await atualizar("equipas", e.slug, { pilotos: nova });
        }
      }}
      esquema={esquema}
      vazio={{ titulo: "Ainda não há pilotos", texto: "Crie a ficha do primeiro piloto: aparece em Pilotos, na classificação e na sua equipa." }}
      extraFicha={(r) => (
        <Grupo titulo="Pré-visualização" descricao="O cartão do piloto, como aparece em Pilotos.">
          <div className="flex items-center gap-4">
            <MiniRetrato p={r} cor={corDe(r.equipaSlug)} tamanho="size-20" />
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight"><span className="mr-2 tabular-nums text-white/45">{r.numero}</span>{r.nome || "Nome do piloto"}</p>
              <p className="mt-1 text-sm text-white/60">{[r.equipa || "Sem equipa", r.categoria].filter(Boolean).join(" · ")}</p>
              {(r.campeonatos ?? 0) > 0 && <p className="mt-1 text-xs text-mb-red-light">{r.campeonatos}× campeão nacional</p>}
            </div>
          </div>
        </Grupo>
      )}
    />
  );
}
