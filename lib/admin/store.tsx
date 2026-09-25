"use client";

/* ============================================================
   MOTOBOX ADMIN — Camada de persistência
   Estado global do painel. Com o Supabase ligado, lê tudo de
   /api/admin e cada escrita só fica no ecrã se a base de dados
   a aceitar: em caso de erro a alteração é desfeita e o motivo
   aparece num aviso. Sem base de dados configurada, o painel
   trabalha em localStorage sobre os dados de demonstração.
   ============================================================ */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import {
  eventos as eventosSeed, pilotos as pilotosSeed, equipas as equipasSeed,
  corridas as corridasSeed, noticias as noticiasSeed, videos as videosSeed,
  patrocinadores as patrocinadoresSeed, anuncios as anunciosSeed,
  topicos as topicosSeed, categoriasForum as categoriasForumSeed,
} from "@/lib/data";
import type {
  Evento, Piloto, Equipa, Corrida, Noticia, Video, Patrocinador,
  AnuncioMarketplace, TopicoForum, CategoriaForum,
} from "@/lib/types";
import type {
  Utilizador, Encomenda, Denuncia, Subscritor, Mensagem,
  PaginaLegal, Definicoes, RegistoAtividade,
} from "./types";
import {
  utilizadoresSeed, encomendasSeed, denunciasSeed, subscritoresSeed,
  mensagensSeed, paginasLegaisSeed, definicoesSeed, atividadeSeed,
} from "./seed";
import { useAuth } from "@/lib/auth/contexto";

const CHAVE = "motobox-admin-v1";

/**
 * Apaga do navegador tudo o que o painel lá deixou. Chamado ao
 * terminar sessão, para que num computador partilhado não fique
 * nada da gestão para o utilizador seguinte.
 */
export function limparDadosLocais() {
  try {
    localStorage.removeItem(CHAVE);
    localStorage.removeItem("motobox-organizador-v1");
  } catch { /* indisponível */ }
}

export interface EstadoAdmin {
  eventos: Evento[];
  pilotos: Piloto[];
  equipas: Equipa[];
  corridas: Corrida[];
  noticias: Noticia[];
  videos: Video[];
  patrocinadores: Patrocinador[];
  anuncios: AnuncioMarketplace[];
  topicos: TopicoForum[];
  categoriasForum: CategoriaForum[];
  utilizadores: Utilizador[];
  encomendas: Encomenda[];
  denuncias: Denuncia[];
  subscritores: Subscritor[];
  mensagens: Mensagem[];
  paginasLegais: PaginaLegal[];
  definicoes: Definicoes;
  atividade: RegistoAtividade[];
}

/** Coleções que suportam CRUD genérico */
export type ColeccaoNome = Exclude<keyof EstadoAdmin, "definicoes">;

const estadoInicial = (): EstadoAdmin => ({
  eventos: eventosSeed,
  pilotos: pilotosSeed,
  equipas: equipasSeed,
  corridas: corridasSeed,
  noticias: noticiasSeed,
  videos: videosSeed,
  patrocinadores: patrocinadoresSeed,
  anuncios: anunciosSeed,
  topicos: topicosSeed,
  categoriasForum: categoriasForumSeed,
  utilizadores: utilizadoresSeed,
  encomendas: encomendasSeed,
  denuncias: denunciasSeed,
  subscritores: subscritoresSeed,
  mensagens: mensagensSeed,
  paginasLegais: paginasLegaisSeed,
  definicoes: definicoesSeed,
  atividade: atividadeSeed,
});

/** Chave primária de cada coleção */
const CHAVE_PRIMARIA: Record<ColeccaoNome, string> = {
  eventos: "slug", pilotos: "slug", equipas: "slug", corridas: "slug",
  noticias: "slug", videos: "slug", patrocinadores: "slug",
  paginasLegais: "slug", categoriasForum: "slug",
  anuncios: "id", topicos: "id", utilizadores: "id", encomendas: "id",
  denuncias: "id", subscritores: "id", mensagens: "id", atividade: "id",
};

export function chaveDe(coleccao: ColeccaoNome): string {
  return CHAVE_PRIMARIA[coleccao];
}

/** Resultado de uma escrita: null quando correu bem, senão a mensagem de erro. */
export type ResultadoEscrita = Promise<string | null>;

interface ContextoAdmin {
  estado: EstadoAdmin;
  pronto: boolean;
  /** Cria um registo no topo da coleção */
  criar: <T extends Record<string, unknown>>(c: ColeccaoNome, item: T) => ResultadoEscrita;
  /** Atualiza parcialmente o registo identificado por `id` */
  atualizar: <T extends Record<string, unknown>>(c: ColeccaoNome, id: string, campos: Partial<T>) => ResultadoEscrita;
  /** Remove o registo identificado por `id` */
  remover: (c: ColeccaoNome, id: string) => ResultadoEscrita;
  /** Substitui a coleção inteira (reordenações, importações) */
  substituir: (c: ColeccaoNome, itens: unknown[]) => void;
  /** Atualiza as definições globais */
  guardarDefinicoes: (d: Partial<Definicoes>) => ResultadoEscrita;
  /** Escreve uma linha no registo de atividade */
  registar: (accao: string, entidade: string, detalhe: string) => void;
  /** Repõe todos os dados de demonstração */
  reiniciar: () => void;
  /** Exporta o estado completo em JSON */
  exportar: () => string;
  /** Importa um estado previamente exportado */
  importar: (json: string) => boolean;
  /** "supabase" quando a base de dados está ligada; "local" caso contrário */
  origem: Origem;
  /** Recarrega tudo a partir do Supabase */
  recarregar: () => Promise<void>;
  /** Último erro de sincronização, se existir */
  erroSync: string | null;
  /** Esconde o aviso de erro */
  limparErro: () => void;
}

export type Origem = "supabase" | "local" | "a-verificar";

/** Envia uma escrita para a API de administração. */
async function enviar(
  metodo: "POST" | "PATCH" | "DELETE",
  coleccao: string,
  corpo?: unknown,
  query = "",
): Promise<string | null> {
  try {
    const r = await fetch(`/api/admin/${coleccao}${query}`, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (r.ok) return null;
    const j = await r.json().catch(() => ({ erro: `HTTP ${r.status}` }));
    return String(j.erro ?? `HTTP ${r.status}`);
  } catch (e) {
    return e instanceof Error ? e.message : "Falha de rede";
  }
}

const Ctx = createContext<ContextoAdmin | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAdmin>(estadoInicial);
  const [pronto, setPronto] = useState(false);
  const [origem, setOrigem] = useState<Origem>("a-verificar");
  const [erroSync, setErroSync] = useState<string | null>(null);

  /** Estado mais recente, para desfazer uma escrita que falhou. */
  const estadoRef = useRef(estado);
  useEffect(() => { estadoRef.current = estado; }, [estado]);

  /** Verdadeiro só quando o servidor diz que não há Supabase (503). */
  const semBase = useRef(false);

  /** Nome de quem está a usar o painel, para o registo de atividade. */
  const { perfil } = useAuth();
  const nomeRef = useRef("");
  useEffect(() => { nomeRef.current = perfil?.nome ?? ""; }, [perfil]);

  /**
   * Carrega tudo a partir do Supabase. Se a base de dados não
   * estiver configurada, recorre ao localStorage e mantém o
   * painel funcional com os dados de demonstração.
   */
  const carregarTudo = useCallback(async () => {
    const coleccoes: ColeccaoNome[] = [
      "eventos", "pilotos", "equipas", "corridas", "noticias", "videos",
      "patrocinadores", "anuncios", "topicos", "categoriasForum",
      "utilizadores", "encomendas", "denuncias", "subscritores",
      "mensagens", "paginasLegais", "atividade",
    ];

    try {
      const respostas = await Promise.all(
        [...coleccoes, "definicoes" as const].map(async (c) => {
          const r = await fetch(`/api/admin/${c}`, { cache: "no-store" });
          return { c, ok: r.ok, estado: r.status, json: await r.json().catch(() => null) };
        }),
      );

      // 503 significa Supabase não configurado — modo local.
      if (respostas.some((r) => r.estado === 503)) {
        semBase.current = true;
        setOrigem("local");
        try {
          const guardado = localStorage.getItem(CHAVE);
          if (guardado) {
            const dados = JSON.parse(guardado) as Partial<EstadoAdmin>;
            setEstado((atual) => ({ ...atual, ...dados }));
          }
        } catch { /* indisponível */ }
        setPronto(true);
        return;
      }

      const falha = respostas.find((r) => !r.ok);
      if (falha) {
        setErroSync(String(falha.json?.erro ?? `Falha ao ler ${falha.c}`));
        setOrigem("local");
        setPronto(true);
        return;
      }

      const novo: Partial<EstadoAdmin> = {};
      for (const r of respostas) {
        if (r.c === "definicoes") {
          if (r.json?.dados) novo.definicoes = { ...definicoesSeed, ...r.json.dados };
        } else {
          // A base de dados manda: uma tabela vazia fica vazia, para
          // que apagar tudo não traga de volta a demonstração.
          const lista = r.json?.dados;
          if (Array.isArray(lista)) {
            (novo as Record<string, unknown>)[r.c] = lista;
          }
        }
      }

      setEstado((atual) => ({ ...atual, ...novo }));
      // Cópias antigas guardadas no navegador deixam de ser necessárias.
      try { localStorage.removeItem(CHAVE); } catch { /* indisponível */ }
      setOrigem("supabase");
      setErroSync(null);
    } catch (e) {
      setErroSync(e instanceof Error ? e.message : "Falha ao contactar a API");
      setOrigem("local");
    } finally {
      setPronto(true);
    }
  }, []);

  useEffect(() => { void carregarTudo(); }, [carregarTudo]);

  const persistir = useCallback((proximo: EstadoAdmin) => {
    setEstado(proximo);
    if (!semBase.current) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(proximo));
    } catch {
      /* quota excedida ou modo privado — o estado vive só nesta sessão */
    }
  }, []);

  const registarEm = useCallback((base: EstadoAdmin, accao: string, entidade: string, detalhe: string): EstadoAdmin => {
    const linha: RegistoAtividade = {
      id: `a-${Date.now()}`,
      quando: new Date().toISOString(),
      utilizador: nomeRef.current || "Equipa Motobox",
      accao, entidade, detalhe,
    };
    return { ...base, atividade: [linha, ...base.atividade].slice(0, 200) };
  }, []);

  // Com a base de dados ligada, o navegador não guarda cópia: os
  // dados (emails, encomendas) vivem só no Supabase e na memória.
  const guardarLocal = (proximo: EstadoAdmin) => {
    if (!semBase.current) return;
    try { localStorage.setItem(CHAVE, JSON.stringify(proximo)); } catch {}
  };

  /**
   * Envia uma escrita à API. Sem base de dados configurada, fica só
   * no localStorage. Se falhar, `desfazer` repõe o ecrã e o erro
   * fica visível em `erroSync`.
   */
  const confirmar = useCallback(async (
    pedido: () => Promise<string | null>,
    desfazer: () => void,
  ): Promise<string | null> => {
    if (semBase.current) return null;
    const e = await pedido();
    if (e) {
      desfazer();
      setErroSync(`Não foi guardado: ${e}`);
    } else {
      setErroSync(null);
    }
    return e;
  }, []);

  const criar = useCallback<ContextoAdmin["criar"]>((c, item) => {
    const k = chaveDe(c);
    setEstado((atual) => {
      const lista = [item, ...(atual[c] as unknown as unknown[])];
      const nome = String(item.titulo ?? item.nome ?? item.referencia ?? item.email ?? "registo");
      const proximo = registarEm({ ...atual, [c]: lista }, "criou", rotulo(c), nome);
      guardarLocal(proximo);
      return proximo;
    });
    return confirmar(
      () => enviar("POST", c, item),
      () => setEstado((atual) => ({
        ...atual,
        [c]: (atual[c] as unknown as Record<string, unknown>[]).filter((it) => it[k] !== item[k]),
      })),
    );
  }, [registarEm, confirmar]);

  const atualizar = useCallback<ContextoAdmin["atualizar"]>((c, id, campos) => {
    const k = chaveDe(c);
    const antes = (estadoRef.current[c] as unknown as Record<string, unknown>[]).find((it) => it[k] === id);
    setEstado((atual) => {
      const lista = (atual[c] as unknown as Record<string, unknown>[]).map((it) =>
        it[k] === id ? { ...it, ...campos } : it,
      );
      const alvo = lista.find((it) => it[k] === id);
      const nome = String(alvo?.titulo ?? alvo?.nome ?? alvo?.referencia ?? alvo?.email ?? id);
      const proximo = registarEm({ ...atual, [c]: lista }, "editou", rotulo(c), nome);
      guardarLocal(proximo);
      return proximo;
    });
    // Se a chave mudou (slug editado), o registo tem outro id no ecrã.
    const novaChave = (campos as Record<string, unknown>)[k] ?? id;
    return confirmar(
      () => enviar("PATCH", c, { id, campos }),
      () => {
        if (!antes) return;
        setEstado((atual) => ({
          ...atual,
          [c]: (atual[c] as unknown as Record<string, unknown>[]).map((it) =>
            it[k] === novaChave ? antes : it,
          ),
        }));
      },
    );
  }, [registarEm, confirmar]);

  const remover = useCallback<ContextoAdmin["remover"]>((c, id) => {
    const k = chaveDe(c);
    const lista0 = estadoRef.current[c] as unknown as Record<string, unknown>[];
    const posicao = lista0.findIndex((it) => it[k] === id);
    const antes = lista0[posicao];
    setEstado((atual) => {
      const alvo = (atual[c] as unknown as Record<string, unknown>[]).find((it) => it[k] === id);
      const nome = String(alvo?.titulo ?? alvo?.nome ?? alvo?.referencia ?? alvo?.email ?? id);
      const lista = (atual[c] as unknown as Record<string, unknown>[]).filter((it) => it[k] !== id);
      const proximo = registarEm({ ...atual, [c]: lista }, "removeu", rotulo(c), nome);
      guardarLocal(proximo);
      return proximo;
    });
    return confirmar(
      () => enviar("DELETE", c, undefined, `?id=${encodeURIComponent(id)}`),
      () => {
        if (!antes) return;
        setEstado((atual) => {
          const lista = [...(atual[c] as unknown as Record<string, unknown>[])];
          lista.splice(Math.max(0, posicao), 0, antes);
          return { ...atual, [c]: lista };
        });
      },
    );
  }, [registarEm, confirmar]);

  const substituir = useCallback<ContextoAdmin["substituir"]>((c, itens) => {
    setEstado((atual) => {
      const proximo = { ...atual, [c]: itens };
      try { localStorage.setItem(CHAVE, JSON.stringify(proximo)); } catch {}
      return proximo;
    });
  }, []);

  const guardarDefinicoes = useCallback<ContextoAdmin["guardarDefinicoes"]>((d) => {
    const antes = estadoRef.current.definicoes;
    setEstado((atual) => {
      const proximo = registarEm(
        { ...atual, definicoes: { ...atual.definicoes, ...d } },
        "atualizou", "Definições", Object.keys(d).join(", "),
      );
      guardarLocal(proximo);
      return proximo;
    });
    return confirmar(
      () => enviar("PATCH", "definicoes", { campos: d }),
      () => setEstado((atual) => ({ ...atual, definicoes: antes })),
    );
  }, [registarEm, confirmar]);

  const registar = useCallback<ContextoAdmin["registar"]>((accao, entidade, detalhe) => {
    setEstado((atual) => {
      const proximo = registarEm(atual, accao, entidade, detalhe);
      guardarLocal(proximo);
      return proximo;
    });
  }, [registarEm]);

  const limparErro = useCallback(() => setErroSync(null), []);

  const reiniciar = useCallback(() => {
    const novo = estadoInicial();
    persistir(novo);
  }, [persistir]);

  const exportar = useCallback(() => JSON.stringify(estado, null, 2), [estado]);

  const importar = useCallback((json: string) => {
    try {
      const dados = JSON.parse(json) as Partial<EstadoAdmin>;
      if (typeof dados !== "object" || dados === null) return false;
      persistir({ ...estadoInicial(), ...dados });
      return true;
    } catch {
      return false;
    }
  }, [persistir]);

  const valor = useMemo<ContextoAdmin>(() => ({
    estado, pronto, criar, atualizar, remover, substituir,
    guardarDefinicoes, registar, reiniciar, exportar, importar,
    origem, recarregar: carregarTudo, erroSync, limparErro,
  }), [estado, pronto, criar, atualizar, remover, substituir,
       guardarDefinicoes, registar, reiniciar, exportar, importar,
       origem, carregarTudo, erroSync, limparErro]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdmin tem de ser usado dentro de <AdminProvider>");
  return ctx;
}

function rotulo(c: ColeccaoNome): string {
  const rotulos: Record<ColeccaoNome, string> = {
    eventos: "Evento", pilotos: "Piloto", equipas: "Equipa", corridas: "Corrida",
    noticias: "Notícia", videos: "Vídeo", patrocinadores: "Patrocinador",
    anuncios: "Anúncio", topicos: "Tópico", categoriasForum: "Categoria",
    utilizadores: "Utilizador", encomendas: "Encomenda", denuncias: "Denúncia",
    subscritores: "Subscritor", mensagens: "Mensagem", paginasLegais: "Página legal",
    atividade: "Atividade",
  };
  return rotulos[c];
}

/** Gera um identificador curto e legível para novos registos. */
export function novoId(prefixo: string): string {
  return `${prefixo}-${Date.now().toString(36).slice(-6)}`;
}

/** Converte um texto em slug utilizável em URL. */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
