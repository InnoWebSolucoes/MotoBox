import "server-only";

/* ============================================================
   MOTOBOX — Fórum: dados das páginas (servidor)

   De onde vem cada coisa:
   - `topicos` (tabela): título, categoria, autor (nome), contagens,
     fixado/fechado/resolvido e o `excerto` (o resumo da lista).
   - `respostas_forum` (tabela): as respostas dos membros, com a
     conta de quem as escreveu (`autor_id`).
   - A MENSAGEM DE ABERTURA dos tópicos abertos pelos membros é
     também uma linha de `respostas_forum`, com o id fixo
     "op-<id do tópico>" (ver idAbertura). `topicos` não tem coluna
     para o autor nem para o texto completo; assim o texto inteiro e
     a conta de quem abriu o tópico ficam guardados juntos, sem
     tabelas novas, e "os meus tópicos" é uma consulta simples. A
     página do tópico mostra essa linha como a mensagem original e
     não a conta como resposta. Os tópicos abertos pela equipa no
     painel não têm esta linha: a mensagem é o `excerto`.
   - Votos: conteúdo editável, grupo "forum-votos" (./votos.ts).

   Níveis: cada resposta vale 1 ponto, cada tópico 3 e cada voto
   recebido 1. Quem tem conta conta pela conta; os autores sem conta
   (tópicos do painel) contam pelo nome.
   ============================================================ */

import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { respostaDaLinha, tabelaEmFalta, lerRespostas } from "@/lib/forum/respostas";
import type { RespostaPublica } from "@/lib/forum/tipos";
import type { CategoriaForum, TopicoForum } from "@/lib/types";
import type { ConteudoForum } from "@/lib/conteudo/grupos/comunidade";
import {
  corOu, iniciaisDe, nivelPara,
  type AutorForum, type Contribuidor, type Ordem, type RespostaForum, type TopicoCartao,
} from "@/components/forum/tipos";
import { lerContagens, votosDe } from "./votos";

/** Id da linha de `respostas_forum` com a mensagem de abertura de um tópico. */
export const idAbertura = (topicoId: string) => `op-${topicoId}`;
export const eAbertura = (id: string) => id.startsWith("op-");

const PONTOS = { resposta: 1, topico: 3, voto: 1 } as const;
const DIA = 86_400_000;

/* ---------- Actividade (todas as respostas publicadas, sem o texto) ---------- */

interface LinhaActividade {
  id: string;
  topicoId: string;
  autorId: string | null;
  resposta: RespostaPublica;
}

/**
 * Lida com a chave de serviço (o `autor_id` não sai daqui para o navegador).
 * Sem base de dados, ou antes da migração das respostas, vem vazia.
 */
const lerActividade = cache(async (): Promise<LinhaActividade[]> => {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data, error } = await db
    .from("respostas_forum")
    .select("id, topico_id, autor_id, autor_nome, autor_cor, autor_avatar, criado_em")
    .eq("publicado", true)
    .order("criado_em", { ascending: false })
    .limit(5000);
  if (error) {
    if (!tabelaEmFalta(error)) console.error("[forum] Falha ao ler a actividade:", error.message);
    return [];
  }
  return (data ?? []).map((l) => ({
    id: String(l.id),
    topicoId: String(l.topico_id),
    autorId: l.autor_id ? String(l.autor_id) : null,
    resposta: respostaDaLinha({ ...l, corpo: "" }),
  }));
});

/* ---------- Quem é quem ---------- */

const chaveNome = (nome: string) => `nome:${nome.trim().toLowerCase()}`;
const chaveDe = (autorId: string | null, nome: string) => (autorId ? `id:${autorId}` : chaveNome(nome));

interface Ficha {
  nome: string;
  cor: string;
  avatar?: string;
  iniciais?: string;
  respostas: number;
  topicos: number;
  votos: number;
  /** Contribuições nos últimos 30 dias. */
  mes: number;
}

export interface Forum {
  cartoes: TopicoCartao[];
  contribuidores: Contribuidor[];
  totais: { topicos: number; respostas: number; membros: number };
  /** Autor de cada tópico (pela conta, quando o tópico foi aberto por um membro). */
  autorDoTopico: Map<string, string>;
  fichas: Map<string, Ficha>;
  votos: Map<string, number>;
  textos: ConteudoForum;
}

/**
 * Data de uma linha de `topicos`. A coluna `criado` é só a data ("2026-09-27"):
 * fica assim, e o <Tempo> mostra-a ao dia ("ontem", "há 3 dias").
 */
const isoDoTopico = (t: TopicoForum) => String(t.criado ?? "");
const tempo = (iso: string) => new Date(iso).getTime() || 0;

export function autorPublico(
  ficha: Ficha | undefined, nome: string, textos: ConteudoForum, extra?: Partial<AutorForum>,
): AutorForum {
  const equipa = textos.niveis.nomesEquipa.some((n) => n.trim().toLowerCase() === nome.trim().toLowerCase());
  const pontos = ficha ? ficha.respostas * PONTOS.resposta + ficha.topicos * PONTOS.topico + ficha.votos * PONTOS.voto : 0;
  return {
    nome,
    iniciais: (extra?.iniciais || ficha?.iniciais || iniciaisDe(nome)).slice(0, 3),
    cor: corOu(extra?.cor ?? ficha?.cor),
    avatar: extra?.avatar ?? ficha?.avatar,
    equipa,
    pontos,
    nivel: !textos.niveis.mostrar ? undefined
      : equipa ? textos.niveis.equipa || undefined
      : nivelPara(pontos, textos.niveis.lista),
  };
}

/**
 * Tudo o que a lista e a coluna do fórum precisam: os cartões (com votos e
 * o nível do autor), os mais activos do mês e os números do cabeçalho.
 */
export async function montarForum(
  topicos: TopicoForum[], categorias: CategoriaForum[], textos: ConteudoForum,
): Promise<Forum> {
  const [actividade, votos] = await Promise.all([lerActividade(), lerContagens()]);
  const agora = Date.now();
  const desde = agora - 30 * DIA;
  const fichas = new Map<string, Ficha>();
  const ficha = (chave: string, nome: string, cor: string, avatar?: string): Ficha => {
    let f = fichas.get(chave);
    if (!f) {
      f = { nome, cor, avatar, respostas: 0, topicos: 0, votos: 0, mes: 0 };
      fichas.set(chave, f);
    }
    return f;
  };

  const visiveis = new Set(topicos.map((t) => t.id));
  const autorDoTopico = new Map<string, string>();
  const aberturas = new Map<string, LinhaActividade>();

  // A actividade vem da mais recente para a mais antiga: o primeiro nome
  // e a primeira cor de cada conta são os actuais.
  for (const l of actividade) {
    if (!visiveis.has(l.topicoId)) continue;
    const r = l.resposta;
    const chave = chaveDe(l.autorId, r.autorNome);
    const f = ficha(chave, r.autorNome, r.autorCor, r.autorAvatar);
    const quando = tempo(r.criadoEm);
    if (eAbertura(l.id)) {
      f.topicos += 1;
      aberturas.set(l.topicoId, l);
      autorDoTopico.set(l.topicoId, chave);
    } else {
      f.respostas += 1;
    }
    if (quando >= desde) f.mes += 1;
    f.votos += votosDe(votos, l.id);
  }

  // Tópicos sem mensagem de abertura (abertos no painel): contam pelo nome.
  for (const t of topicos) {
    if (aberturas.has(t.id)) continue;
    const chave = chaveNome(t.autor || "MotoBox");
    const f = ficha(chave, t.autor || "MotoBox", corOu(t.avatarCor));
    if (!f.iniciais && t.autorAvatar) f.iniciais = t.autorAvatar;
    f.topicos += 1;
    if (tempo(isoDoTopico(t)) >= desde) f.mes += 1;
    autorDoTopico.set(t.id, chave);
  }
  // Votos recebidos nos tópicos.
  for (const t of topicos) {
    const chave = autorDoTopico.get(t.id);
    const f = chave ? fichas.get(chave) : undefined;
    if (f) f.votos += votosDe(votos, t.id);
  }

  const porSlug = new Map(categorias.map((c) => [c.slug, c]));
  const cartoes: TopicoCartao[] = topicos.map((t) => {
    const abertura = aberturas.get(t.id);
    const chave = autorDoTopico.get(t.id);
    const f = chave ? fichas.get(chave) : undefined;
    const criado = abertura?.resposta.criadoEm || isoDoTopico(t);
    const ultima = (t.ultimaResposta as { em?: unknown } | undefined)?.em;
    const actividadeIso = typeof ultima === "string" && tempo(ultima) > tempo(criado) ? ultima : criado;
    const cat = porSlug.get(t.categoriaSlug);
    return {
      id: t.id,
      titulo: t.titulo,
      excerto: t.excerto,
      categoria: cat
        ? { slug: cat.slug, nome: cat.nome, cor: corOu(cat.cor), icone: cat.icone }
        : t.categoria ? { slug: t.categoriaSlug, nome: t.categoria, cor: "#e10600", icone: "chat" } : undefined,
      autor: autorPublico(f, t.autor || f?.nome || "MotoBox", textos, {
        iniciais: abertura ? undefined : t.autorAvatar,
        cor: abertura ? abertura.resposta.autorCor : t.avatarCor,
        avatar: abertura?.resposta.autorAvatar,
      }),
      criado,
      actividade: actividadeIso,
      respostas: Math.max(0, Number(t.respostas) || 0),
      visualizacoes: Math.max(0, Number(t.visualizacoes) || 0),
      votos: votosDe(votos, t.id),
      fixado: Boolean(t.fixado),
      resolvido: Boolean(t.resolvido),
      bloqueado: Boolean(t.bloqueado),
    };
  });

  const contribuidores: Contribuidor[] = [...fichas.entries()]
    .map(([chave, f]) => ({ chave, f, autor: autorPublico(f, f.nome, textos) }))
    .filter((x) => x.f.mes > 0 && !x.autor.equipa)
    .sort((a, b) => b.f.mes - a.f.mes || (b.autor.pontos ?? 0) - (a.autor.pontos ?? 0) || a.f.nome.localeCompare(b.f.nome))
    .slice(0, 5)
    // A chave vai para o navegador: nunca o id da conta.
    .map((x, i) => ({ chave: `c-${i}`, autor: x.autor, contagem: x.f.mes }));

  const membros = [...fichas.values()].filter((f) => !textos.niveis.nomesEquipa
    .some((n) => n.trim().toLowerCase() === f.nome.trim().toLowerCase())).length;

  return {
    cartoes,
    contribuidores,
    totais: {
      topicos: topicos.length,
      respostas: cartoes.reduce((s, c) => s + c.respostas, 0),
      membros,
    },
    autorDoTopico,
    fichas,
    votos,
    textos,
  };
}

/* ---------- Ordem da lista ---------- */

/** "Em alta": votos e respostas, a perder peso com o tempo desde a última actividade. */
export function calor(t: TopicoCartao, agora = Date.now()): number {
  const horas = Math.max(0, (agora - tempo(t.actividade)) / 3_600_000);
  return (t.votos + t.respostas * 1.5 + 1) / Math.pow(horas + 2, 1.3);
}

export function ordenar(lista: TopicoCartao[], ordem: Ordem): TopicoCartao[] {
  const agora = Date.now();
  const novos = (a: TopicoCartao, b: TopicoCartao) => tempo(b.criado) - tempo(a.criado);
  switch (ordem) {
    case "novos":
      return [...lista].sort(novos);
    case "votados":
      return [...lista].sort((a, b) => b.votos - a.votos || b.respostas - a.respostas || novos(a, b));
    case "sem-resposta":
      return lista.filter((t) => t.respostas === 0 && !t.bloqueado).sort(novos);
    default:
      return [...lista].sort((a, b) => calor(b, agora) - calor(a, agora) || novos(a, b));
  }
}

/* ---------- Página de um tópico ---------- */

export interface Discussao {
  /** A mensagem original: o texto completo (ou o excerto, nos tópicos do painel). */
  abertura: { corpo: string; criado: string; autor: AutorForum };
  respostas: RespostaForum[];
  participantes: number;
}

/**
 * A mensagem de abertura e as respostas de um tópico, com votos e o nível de
 * quem escreveu. As respostas vêm por ordem de chegada.
 */
export async function lerDiscussao(topico: TopicoForum, forum: Forum): Promise<Discussao> {
  const { textos, fichas, votos } = forum;
  const db = supabaseAdmin();
  let linhas: { id: string; autorId: string | null; resposta: RespostaPublica }[] = [];
  if (db) {
    const { data, error } = await db
      .from("respostas_forum")
      .select("id, autor_id, autor_nome, autor_cor, autor_avatar, corpo, criado_em")
      .eq("topico_id", topico.id)
      .eq("publicado", true)
      .order("criado_em", { ascending: true })
      .limit(500);
    if (error) {
      if (!tabelaEmFalta(error)) console.error("[forum] Falha ao ler as respostas:", error.message);
    } else {
      linhas = (data ?? []).map((l) => ({
        id: String(l.id), autorId: l.autor_id ? String(l.autor_id) : null, resposta: respostaDaLinha(l),
      }));
    }
  } else {
    // Sem a chave de serviço: a leitura pública (sem a conta de cada autor).
    linhas = (await lerRespostas(topico.id)).map((r) => ({ id: r.id, autorId: null, resposta: r }));
  }

  const op = linhas.find((l) => l.id === idAbertura(topico.id));
  const chaveAutor = forum.autorDoTopico.get(topico.id);
  const fichaAutor = chaveAutor ? fichas.get(chaveAutor) : undefined;
  const cartao = forum.cartoes.find((c) => c.id === topico.id);

  const abertura = {
    corpo: op?.resposta.corpo || topico.excerto,
    criado: op?.resposta.criadoEm || cartao?.criado || topico.criado,
    autor: cartao?.autor ?? autorPublico(fichaAutor, topico.autor, textos),
  };

  const respostas: RespostaForum[] = linhas
    .filter((l) => !eAbertura(l.id))
    .map((l) => {
      const chave = chaveDe(l.autorId, l.resposta.autorNome);
      const a = autorPublico(fichas.get(chave), l.resposta.autorNome, textos);
      return {
        ...l.resposta,
        votos: votosDe(votos, l.id),
        nivel: a.nivel,
        equipa: a.equipa,
        eAutor: Boolean(chaveAutor && chave === chaveAutor),
      };
    });

  const participantes = new Set([chaveAutor ?? `nome:${topico.autor}`, ...linhas.map((l) => chaveDe(l.autorId, l.resposta.autorNome))]).size;
  return { abertura, respostas, participantes };
}
