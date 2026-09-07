"use client";

/* ============================================================
   MOTOBOX ADMIN — Camada de persistência
   Estado global do painel, guardado em localStorage e semeado
   a partir de `lib/data.ts` e `lib/admin/seed.ts`.

   Para ligar a um backend real, substituir apenas `carregar` e
   `guardar` por chamadas à API — a interface do contexto
   mantém-se inalterada.
   ============================================================ */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
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

const CHAVE = "motobox-admin-v1";

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

interface ContextoAdmin {
  estado: EstadoAdmin;
  pronto: boolean;
  /** Cria um registo no topo da coleção */
  criar: <T extends Record<string, unknown>>(c: ColeccaoNome, item: T) => void;
  /** Atualiza parcialmente o registo identificado por `id` */
  atualizar: <T extends Record<string, unknown>>(c: ColeccaoNome, id: string, campos: Partial<T>) => void;
  /** Remove o registo identificado por `id` */
  remover: (c: ColeccaoNome, id: string) => void;
  /** Substitui a coleção inteira (reordenações, importações) */
  substituir: (c: ColeccaoNome, itens: unknown[]) => void;
  /** Atualiza as definições globais */
  guardarDefinicoes: (d: Partial<Definicoes>) => void;
  /** Escreve uma linha no registo de atividade */
  registar: (accao: string, entidade: string, detalhe: string) => void;
  /** Repõe todos os dados de demonstração */
  reiniciar: () => void;
  /** Exporta o estado completo em JSON */
  exportar: () => string;
  /** Importa um estado previamente exportado */
  importar: (json: string) => boolean;
}

const Ctx = createContext<ContextoAdmin | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAdmin>(estadoInicial);
  const [pronto, setPronto] = useState(false);

  // Hidratação a partir do localStorage — só no cliente, para não
  // divergir do HTML pré-renderizado.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CHAVE);
      if (guardado) {
        const dados = JSON.parse(guardado) as Partial<EstadoAdmin>;
        setEstado((atual) => ({ ...atual, ...dados }));
      }
    } catch {
      /* localStorage indisponível — segue com os dados de demonstração */
    }
    setPronto(true);
  }, []);

  const persistir = useCallback((proximo: EstadoAdmin) => {
    setEstado(proximo);
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
      utilizador: "Gonçalo Bessa",
      accao, entidade, detalhe,
    };
    return { ...base, atividade: [linha, ...base.atividade].slice(0, 200) };
  }, []);

  const criar = useCallback<ContextoAdmin["criar"]>((c, item) => {
    setEstado((atual) => {
      const lista = [item, ...(atual[c] as unknown as unknown[])];
      const nome = String(item.titulo ?? item.nome ?? item.referencia ?? item.email ?? "registo");
      const proximo = registarEm({ ...atual, [c]: lista }, "criou", rotulo(c), nome);
      try { localStorage.setItem(CHAVE, JSON.stringify(proximo)); } catch {}
      return proximo;
    });
  }, [registarEm]);

  const atualizar = useCallback<ContextoAdmin["atualizar"]>((c, id, campos) => {
    setEstado((atual) => {
      const k = chaveDe(c);
      const lista = (atual[c] as unknown as Record<string, unknown>[]).map((it) =>
        it[k] === id ? { ...it, ...campos } : it,
      );
      const alvo = lista.find((it) => it[k] === id);
      const nome = String(alvo?.titulo ?? alvo?.nome ?? alvo?.referencia ?? alvo?.email ?? id);
      const proximo = registarEm({ ...atual, [c]: lista }, "editou", rotulo(c), nome);
      try { localStorage.setItem(CHAVE, JSON.stringify(proximo)); } catch {}
      return proximo;
    });
  }, [registarEm]);

  const remover = useCallback<ContextoAdmin["remover"]>((c, id) => {
    setEstado((atual) => {
      const k = chaveDe(c);
      const alvo = (atual[c] as unknown as Record<string, unknown>[]).find((it) => it[k] === id);
      const nome = String(alvo?.titulo ?? alvo?.nome ?? alvo?.referencia ?? alvo?.email ?? id);
      const lista = (atual[c] as unknown as Record<string, unknown>[]).filter((it) => it[k] !== id);
      const proximo = registarEm({ ...atual, [c]: lista }, "removeu", rotulo(c), nome);
      try { localStorage.setItem(CHAVE, JSON.stringify(proximo)); } catch {}
      return proximo;
    });
  }, [registarEm]);

  const substituir = useCallback<ContextoAdmin["substituir"]>((c, itens) => {
    setEstado((atual) => {
      const proximo = { ...atual, [c]: itens };
      try { localStorage.setItem(CHAVE, JSON.stringify(proximo)); } catch {}
      return proximo;
    });
  }, []);

  const guardarDefinicoes = useCallback<ContextoAdmin["guardarDefinicoes"]>((d) => {
    setEstado((atual) => {
      const proximo = registarEm(
        { ...atual, definicoes: { ...atual.definicoes, ...d } },
        "atualizou", "Definições", Object.keys(d).join(", "),
      );
      try { localStorage.setItem(CHAVE, JSON.stringify(proximo)); } catch {}
      return proximo;
    });
  }, [registarEm]);

  const registar = useCallback<ContextoAdmin["registar"]>((accao, entidade, detalhe) => {
    setEstado((atual) => {
      const proximo = registarEm(atual, accao, entidade, detalhe);
      try { localStorage.setItem(CHAVE, JSON.stringify(proximo)); } catch {}
      return proximo;
    });
  }, [registarEm]);

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
  }), [estado, pronto, criar, atualizar, remover, substituir,
       guardarDefinicoes, registar, reiniciar, exportar, importar]);

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
