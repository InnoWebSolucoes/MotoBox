"use client";

/* ============================================================
   MOTOBOX ADMIN — Entrada e painel › Em foco ("site.contagem")
   O mosaico à direita do painel Explorar. Escolhe-se o tipo (um
   evento, uma prova, um artigo, uma rota, um anúncio, um clube,
   uma modalidade, uma secção do guia de segurança, ou algo escrito
   à mão) e o item; o site vai buscar a fotografia, o título, uma
   linha e a ligação ao próprio item. Por baixo, o que se escrever
   manda sobre o que vem do item.

   As listas de escolha vêm dos dados do painel (eventos, artigos,
   anúncios, clubes) e do conteúdo editável (rotas, modalidades e
   secções da segurança).
   ============================================================ */

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Newspaper, Route, ShieldCheck, Sparkles, Store, Trophy, Users, Flag, Eraser,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import { comBase } from "@/lib/base";
import { eComunidade, eProva } from "@/lib/desporto";
import { Botao, Campo, Grupo, Input, Interruptor, Seleccao } from "@/components/admin/kit";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";
import {
  EM_FOCO_PADRAO, FOCO_COM_DATA, NOMES_FOCO, TIPOS_FOCO, type TipoFoco,
} from "@/lib/conteudo/grupos/site";

const ICONES: Record<TipoFoco, React.ReactNode> = {
  evento: <CalendarDays />,
  prova: <Flag />,
  artigo: <Newspaper />,
  rota: <Route />,
  anuncio: <Store />,
  clube: <Users />,
  modalidade: <Trophy />,
  seguranca: <ShieldCheck />,
  personalizado: <Sparkles />,
};

/** Campos que se escrevem por cima do item (limpam-se ao trocar de item). */
const POR_CIMA = ["sobretitulo", "titulo", "subtitulo", "foto", "textoLigacao", "ligacao", "data"] as const;

/** Uma opção de item, com o que o site vai mostrar dele (para os exemplos dos campos). */
interface Opcao { valor: string; nome: string; titulo: string; linha: string }

const kz = (v: number) => `${new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(v)} Kz`;
const pt = (v: unknown) => (typeof v === "string" ? v : v && typeof v === "object" && "pt" in v ? String((v as { pt: unknown }).pt ?? "") : "");

async function lerJson(url: string) {
  const r = await fetch(comBase(url), { cache: "no-store" });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

/** Rotas, modalidades e secções da segurança, do conteúdo editável. */
function useConteudoFoco() {
  const [c, setC] = useState<{ rota: Opcao[]; modalidade: Opcao[]; seguranca: Opcao[] }>({ rota: [], modalidade: [], seguranca: [] });
  useEffect(() => {
    let vivo = true;
    Promise.all([
      lerJson("/api/admin/conteudo?grupo=rotas").catch(() => null),
      lerJson("/api/admin/conteudo?grupo=modalidades").catch(() => null),
      lerJson("/api/admin/conteudo?chave=paginas.seguranca").catch(() => null),
    ]).then(([rotas, modalidades, seg]) => {
      if (!vivo) return;
      type Item = { chave: string; titulo?: string; dados?: Record<string, unknown> };
      const itens = (g: unknown): Item[] => (g && typeof g === "object" && Array.isArray((g as { itens?: unknown }).itens) ? (g as { itens: Item[] }).itens : []);
      const d = (seg?.dados ?? {}) as Record<string, unknown>;
      const seccoes = Array.isArray(d.SECCOES) ? (d.SECCOES as { id: string; nome: unknown }[]) : [];
      setC({
        rota: itens(rotas).map((r) => {
          const nome = String(r.dados?.nome ?? r.titulo ?? r.chave);
          return { valor: r.chave, nome, titulo: nome, linha: String(r.dados?.subtitulo ?? r.dados?.regiao ?? "") };
        }),
        modalidade: itens(modalidades).map((m) => {
          const nome = String(m.dados?.nome ?? m.titulo ?? m.chave);
          return { valor: m.chave, nome, titulo: nome, linha: String(m.dados?.descricao ?? "") };
        }),
        seguranca: seccoes.map((s) => {
          const bloco = d[s.id.toUpperCase()] as Record<string, unknown> | undefined;
          return {
            valor: s.id,
            nome: pt(s.nome) || s.id,
            titulo: pt(bloco?.titulo) || pt(s.nome),
            linha: pt(bloco?.lead) || pt(bloco?.texto),
          };
        }),
      });
    });
    return () => { vivo = false; };
  }, []);
  return c;
}

export function EditorFoco({ dados, mudar }: { dados: Valor; mudar: (d: Valor) => void }) {
  const { estado } = useAdmin();
  const conteudo = useConteudoFoco();
  const tipo: TipoFoco = TIPOS_FOCO.includes(dados.tipo as TipoFoco) ? (dados.tipo as TipoFoco) : EM_FOCO_PADRAO.tipo;
  const item = typeof dados.item === "string" ? dados.item : "";
  const comData = FOCO_COM_DATA.includes(tipo);

  const opcoes = useMemo((): Opcao[] => {
    const eventos = (filtro: (d: string) => boolean) =>
      estado.eventos
        .filter((e) => filtro(e.disciplina))
        .sort((a, b) => b.dataInicio.localeCompare(a.dataInicio))
        .map((e) => ({
          valor: e.slug,
          nome: `${e.titulo} (${e.dataInicio.slice(0, 10)})`,
          titulo: e.titulo,
          linha: [e.dataInicio.slice(0, 10), e.circuito || e.localidade].filter(Boolean).join(" · "),
        }));
    switch (tipo) {
      case "evento": return eventos(eComunidade);
      case "prova": return eventos(eProva);
      case "artigo":
        return [...estado.noticias]
          .sort((a, b) => b.data.localeCompare(a.data))
          .map((a) => ({ valor: a.slug, nome: `${a.titulo}${a.destaque ? " (em destaque)" : ""}`, titulo: a.titulo, linha: a.resumo }));
      case "anuncio":
        return estado.anuncios.map((a) => ({
          valor: a.id, nome: `${a.titulo} · ${kz(a.preco)}`, titulo: a.titulo, linha: [a.estado, a.provincia].filter(Boolean).join(" · "),
        }));
      case "clube":
        return [...estado.clubes]
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map((c) => ({ valor: c.slug, nome: c.nome, titulo: c.nome, linha: c.resumo || c.tipo }));
      case "rota": return conteudo.rota;
      case "modalidade": return conteudo.modalidade;
      case "seguranca": return conteudo.seguranca;
      default: return [];
    }
  }, [tipo, estado.eventos, estado.noticias, estado.anuncios, estado.clubes, conteudo]);

  const escolhido = opcoes.find((o) => o.valor === item);
  const AUTOMATICO: Partial<Record<TipoFoco, string>> = {
    evento: "Automático: o próximo evento",
    prova: "Automática: a próxima prova",
  };

  /** Troca o tipo ou o item: o que estava escrito por cima era do item anterior, por isso limpa-se. */
  const escolher = (novoTipo: TipoFoco, novoItem: string) => {
    const limpo: Valor = { ...dados, tipo: novoTipo, item: novoItem };
    for (const k of POR_CIMA) limpo[k] = "";
    if (novoTipo !== tipo) limpo.activa = FOCO_COM_DATA.includes(novoTipo);
    mudar(limpo);
  };
  const limparPorCima = () => {
    const limpo: Valor = { ...dados };
    for (const k of POR_CIMA) limpo[k] = "";
    mudar(limpo);
  };
  const temPorCima = POR_CIMA.some((k) => typeof dados[k] === "string" && dados[k]);

  const personalizado = tipo === "personalizado";
  const auto = (dados.automaticos as Record<string, { sobretitulo?: string; ligacao?: string }> | undefined)?.[tipo];

  const ESQUEMA_TEXTOS: CampoEsquema[] = [
    {
      tipo: "texto", chave: "sobretitulo", etiqueta: "Linha de cima", largura: "meia",
      placeholder: auto?.sobretitulo || EM_FOCO_PADRAO.automaticos[tipo].sobretitulo,
      ajuda: "Em branco: a linha de cada tipo (lá em baixo).",
    },
    {
      tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia", obrigatorio: personalizado,
      placeholder: personalizado ? "" : escolhido?.titulo ?? "O título do item",
    },
    {
      tipo: "area", chave: "subtitulo", etiqueta: "Linha por baixo do título", linhas: 2,
      placeholder: personalizado ? "Por exemplo, o dia e o sítio." : (escolhido?.linha ?? "A linha do item").slice(0, 160),
    },
    {
      tipo: "texto", chave: "textoLigacao", etiqueta: "Texto da ligação, em baixo", largura: "meia",
      placeholder: auto?.ligacao || EM_FOCO_PADRAO.automaticos[tipo].ligacao,
    },
    {
      tipo: "texto", chave: "ligacao", etiqueta: "Para onde leva", largura: "meia",
      placeholder: personalizado ? "/eventos ou https://…" : "A página do item",
      ajuda: "Uma página do site (ex.: /marketplace) ou um endereço completo, que abre noutro separador.",
    },
    {
      tipo: "imagem", chave: "foto", etiqueta: "Fotografia", formato: "aspect-[4/3]",
      ajuda: personalizado ? "Sem fotografia, fica a de passeios." : "Em branco: a fotografia do item.",
    },
  ];

  const ESQUEMA_TIPOS: CampoEsquema[] = [
    {
      tipo: "personalizado", chave: "automaticos", etiqueta: "Linha de cima e ligação de cada tipo",
      render: (v, mudarAuto) => <TextosPorTipo valor={v} mudar={mudarAuto} />,
    },
    {
      tipo: "objecto", chave: "unidades", etiqueta: "Nomes das unidades da contagem",
      campos: [
        { tipo: "texto", chave: "dias", etiqueta: "Dias", largura: "meia" },
        { tipo: "texto", chave: "horas", etiqueta: "Horas", largura: "meia" },
        { tipo: "texto", chave: "minutos", etiqueta: "Minutos", largura: "meia" },
        { tipo: "texto", chave: "segundos", etiqueta: "Segundos", largura: "meia" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <Grupo titulo="O que está em foco" descricao="Escolha o tipo e o item. O mosaico vai buscar sozinho a fotografia, o título, uma linha e a ligação.">
        <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 gap-[var(--intervalo)] sm:grid-cols-3 xl:grid-cols-5">
          {TIPOS_FOCO.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={t === tipo}
              onClick={() => { if (t !== tipo) escolher(t, ""); }}
              className={`flex items-center gap-2.5 rounded-[var(--raio)] px-3 py-2.5 text-left text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0 ${
                t === tipo ? "bg-mb-red text-white" : "bg-white/[0.07] text-white hover:bg-white/[0.12]"
              }`}
            >
              {ICONES[t]}
              {NOMES_FOCO[t]}
            </button>
          ))}
        </div>

        {!personalizado && (
          <Campo
            etiqueta={NOMES_FOCO[tipo]}
            ajuda={opcoes.length ? undefined : "A carregar a lista…"}
          >
            <Seleccao
              valor={item}
              onChange={(v) => escolher(tipo, v)}
              opcoes={[
                { valor: "", nome: AUTOMATICO[tipo] ?? "Automático: o primeiro da lista" },
                ...opcoes.map((o) => ({ valor: o.valor, nome: o.nome })),
                ...(item && !escolhido && opcoes.length ? [{ valor: item, nome: `${item} (já não existe)` }] : []),
              ]}
            />
          </Campo>
        )}
        <p className="text-[13px] leading-relaxed text-white/70">
          {personalizado
            ? "Escreva o título, a linha, a fotografia e a ligação aqui por baixo. Com uma data, pode mostrar a contagem decrescente."
            : "Ao trocar de tipo ou de item, o que estava escrito por cima limpa-se, para ficarem os textos do novo item."}
        </p>
      </Grupo>

      {comData && (
        <Grupo titulo="Contagem decrescente" descricao="Os números chegam a zero à hora marcada e ficam em zero.">
          <Interruptor
            etiqueta="Mostrar a contagem decrescente"
            descricao={tipo === "personalizado" ? "Precisa da data aqui por baixo." : "Desligada, o mosaico mostra só a fotografia, os textos e a ligação."}
            activo={Boolean(dados.activa)}
            onChange={(v) => mudar({ ...dados, activa: v })}
          />
          {Boolean(dados.activa) && (
            <Formulario
              esquema={[{
                tipo: "datahora", chave: "data", etiqueta: "Data e hora do arranque", largura: "meia",
                ajuda: tipo === "personalizado" ? "Hora de Luanda." : "Hora de Luanda. Em branco: o início do evento (com a hora da primeira sessão, se houver).",
              }]}
              valor={dados}
              onChange={mudar}
            />
          )}
        </Grupo>
      )}

      <Grupo
        titulo={personalizado ? "O mosaico" : "Escrever por cima (opcional)"}
        descricao={personalizado ? undefined : "Em branco, fica o que vem do item (aparece a cinzento em cada campo)."}
        accoes={temPorCima && !personalizado ? (
          <Botao variante="secundario" onClick={limparPorCima}><Eraser className="size-4" aria-hidden /> Limpar</Botao>
        ) : undefined}
      >
        <Formulario esquema={ESQUEMA_TEXTOS} valor={dados} onChange={mudar} />
      </Grupo>

      <Formulario esquema={ESQUEMA_TIPOS} valor={dados} onChange={mudar} />
    </div>
  );
}

/** A linha de cima e o texto da ligação de cada tipo, numa tabela compacta. */
function TextosPorTipo({ valor, mudar }: { valor: unknown; mudar: (v: unknown) => void }) {
  const actual = (valor && typeof valor === "object" ? valor : {}) as Record<string, { sobretitulo?: string; ligacao?: string }>;
  const mudarCampo = (t: TipoFoco, k: "sobretitulo" | "ligacao", texto: string) =>
    mudar({ ...actual, [t]: { ...EM_FOCO_PADRAO.automaticos[t], ...actual[t], [k]: texto } });
  return (
    <Grupo
      titulo="Linha de cima e ligação de cada tipo"
      descricao='Usadas quando não se escreve outra coisa em "Escrever por cima".'
    >
      <div className="hidden grid-cols-[10rem_1fr_1fr] gap-3 text-[13px] font-medium text-white/75 md:grid">
        <span>Tipo</span><span>Linha de cima</span><span>Texto da ligação</span>
      </div>
      {TIPOS_FOCO.map((t) => (
        <div key={t} className="grid gap-2 md:grid-cols-[10rem_1fr_1fr] md:items-center md:gap-3">
          <span className="text-sm text-white">{NOMES_FOCO[t]}</span>
          <Input
            aria-label={`${NOMES_FOCO[t]}: linha de cima`}
            value={actual[t]?.sobretitulo ?? EM_FOCO_PADRAO.automaticos[t].sobretitulo}
            onChange={(e) => mudarCampo(t, "sobretitulo", e.target.value)}
          />
          <Input
            aria-label={`${NOMES_FOCO[t]}: texto da ligação`}
            value={actual[t]?.ligacao ?? EM_FOCO_PADRAO.automaticos[t].ligacao}
            onChange={(e) => mudarCampo(t, "ligacao", e.target.value)}
          />
        </div>
      ))}
    </Grupo>
  );
}
