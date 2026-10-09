import "server-only";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA: acesso aos dados
   O mesmo caminho que a API de administração (/api/admin/*):
   as mesmas tabelas e conversões (lib/supabase/mapeamento.ts),
   a mesma rede de segurança para colunas ainda por criar, os
   mesmos avisos por email depois de criar um evento ou um
   resultado, e o site inteiro revalidado depois de cada escrita.
   Nada passa por HTTP: o Organizador chama estas funções
   directamente, no servidor.

   Sem Supabase (só em desenvolvimento) há um repositório de
   demonstração com os dados de exemplo, só de leitura; os
   testes usam-no com escrita em memória.
   ============================================================ */

import { promises as fs } from "node:fs";
import path from "node:path";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin, supabaseAdminConfigurado } from "@/lib/supabase/server";
import {
  TABELA, CHAVE_TABELA, daBase, listaDaBase, paraBase, definicoesDaBase, definicoesParaBase,
} from "@/lib/supabase/mapeamento";
import type { ColeccaoNome } from "@/lib/admin/store";
import type { RegistoAtividade } from "@/lib/admin/types";
import {
  notificarNovoEvento, notificarBilhetesAbertos, notificarNovoResultado, notificarNovoAnuncio,
  temBilhetes, avisarEncomendaNova, avisarEncomendaPaga, type EncomendaEmail,
} from "@/lib/notificacoes";
import { enviarEmail, lerConfigEmails, type ConfigEmails, type EmailUnico, type ResultadoEmail } from "@/lib/email";
import { apagarLinha, gravarLinha, lerLinhasAdmin, type LinhaConteudo } from "@/lib/conteudo/servidor";
import type { FicheiroMedia } from "@/lib/conteudo/tipos";
import { comBase } from "@/lib/base";
import type { AnuncioMarketplace, Corrida, Evento } from "@/lib/types";
import type { Registo } from "./campos";

export class ErroDados extends Error {
  constructor(mensagem: string, public codigo = 500) { super(mensagem); }
}

export interface Repositorio {
  modo: "supabase" | "demo";
  /** Falso no modo de demonstração: as escritas são recusadas. */
  podeGravar: boolean;
  listar(c: ColeccaoNome): Promise<Registo[]>;
  inserir(c: ColeccaoNome, registo: Registo): Promise<Registo>;
  actualizar(c: ColeccaoNome, id: string, campos: Registo): Promise<void>;
  apagar(c: ColeccaoNome, id: string): Promise<void>;
  /** A coluna booleana `publicado` (o site só mostra o que está publicado). */
  definirPublicado(c: ColeccaoNome, id: string, publicado: boolean): Promise<void>;
  estaPublicado(c: ColeccaoNome, id: string): Promise<boolean | null>;
  lerDefinicoes(): Promise<Registo>;
  gravarDefinicoes(campos: Registo): Promise<void>;
  conteudoLinhas(): Promise<Map<string, LinhaConteudo>>;
  conteudoGravar(chave: string, titulo: string, dados: unknown, descricao: string): Promise<string>;
  conteudoApagar(chave: string): Promise<void>;
  media(): Promise<FicheiroMedia[]>;
  registarAtividade(linha: RegistoAtividade): Promise<void>;
  configEmails(): Promise<ConfigEmails>;
  enviarEmail(e: EmailUnico, cfg: ConfigEmails): Promise<ResultadoEmail>;
  /** Revalida o site público (as páginas geram-se de novo na visita seguinte). */
  revalidar(): void;
  /** Trabalho a fazer depois da resposta (avisos por email). */
  depois(tarefa: () => Promise<unknown>): void;
}

/* ---------------- Erros da base de dados ---------------- */

type ErroPg = { code?: string; message: string; details?: string | null };

function tabelaEmFalta(e: { code?: string } | null): boolean {
  return e?.code === "42P01" || e?.code === "PGRST205";
}

/** As mesmas frases da API de administração. */
function erroDaBase(e: ErroPg): ErroDados {
  const m = e.message;
  if (tabelaEmFalta(e)) {
    return new ErroDados("Esta secção precisa de uma actualização da base de dados: corra no Supabase o ficheiro de migração mais recente da pasta supabase/.", 503);
  }
  if (e.code === "23505") return new ErroDados("Já existe um registo com este endereço de página ou este email. Escolha outro.", 409);
  if (e.code === "23503") return new ErroDados("A ligação escolhida (equipa, evento ou categoria) já não existe. Escolha outra.", 409);
  if (e.code === "23502") {
    const coluna = /column "([^"]+)"/.exec(m)?.[1];
    return new ErroDados(coluna ? `Falta preencher o campo obrigatório: ${coluna}.` : "Falta preencher um campo obrigatório.", 400);
  }
  if (e.code === "22007" || e.code === "22008") return new ErroDados("Uma das datas é inválida.", 400);
  if (e.code === "22P02") return new ErroDados("Um dos valores tem o formato errado (número ou data).", 400);
  return new ErroDados(m, 500);
}

/** Colunas que apontam para outra tabela: vazio tem de chegar como null. */
const LIGACOES = new Set(["equipa_slug", "evento_slug", "categoria_slug"]);

function linhaPara(coleccao: ColeccaoNome, item: Registo) {
  const linha = paraBase(coleccao, item);
  for (const col of LIGACOES) if (linha[col] === "") linha[col] = null;
  return linha;
}

/**
 * Executa uma escrita e, se a base de dados ainda não tiver uma
 * coluna que a app já conhece (PGRST204), repete sem esse campo
 * (como a API de administração).
 */
async function escrever<R extends { error: { code?: string; message: string } | null }>(
  linha: Registo,
  operacao: (linha: Registo) => PromiseLike<R>,
): Promise<R> {
  let atual = { ...linha };
  for (let i = 0; i < 5; i++) {
    const r = await operacao(atual);
    const coluna = r.error?.code === "PGRST204" ? /'([^']+)' column/.exec(r.error.message)?.[1] : undefined;
    if (!coluna || !(coluna in atual)) return r;
    console.warn(`[organizador] coluna em falta na base de dados, ignorada: ${coluna}`);
    atual = { ...atual };
    delete atual[coluna];
  }
  return operacao(atual);
}

/* ---------------- Biblioteca de media ---------------- */

const BUCKET = "media";
const PASTA_LOCAL = path.join(process.cwd(), "public", "media-local");

async function listarMedia(db: SupabaseClient | null): Promise<FicheiroMedia[]> {
  const ficheiros: FicheiroMedia[] = [];
  for (const pasta of ["imagens", "videos"] as const) {
    const tipo: FicheiroMedia["tipo"] = pasta === "videos" ? "video" : "imagem";
    if (!db) {
      const dir = path.join(PASTA_LOCAL, pasta);
      const nomes = await fs.readdir(dir).catch(() => [] as string[]);
      for (const n of nomes) {
        const st = await fs.stat(path.join(dir, n)).catch(() => null);
        const caminho = `${pasta}/${n}`;
        ficheiros.push({ caminho, url: comBase(`/media-local/${caminho}`), nome: n, tipo, tamanho: st?.size, criado: st?.mtime.toISOString() });
      }
      continue;
    }
    const { data, error } = await db.storage.from(BUCKET).list(pasta, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw new ErroDados(error.message);
    for (const f of data ?? []) {
      if (!f.name || f.name.startsWith(".")) continue;
      const caminho = `${pasta}/${f.name}`;
      ficheiros.push({
        caminho,
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${caminho}`,
        nome: f.name, tipo,
        tamanho: (f.metadata as { size?: number } | null)?.size,
        criado: f.created_at ?? undefined,
      });
    }
  }
  return ficheiros.sort((a, b) => (b.criado ?? "").localeCompare(a.criado ?? ""));
}

/* ---------------- Supabase ---------------- */

function revalidarSite() {
  try { revalidatePath("/", "layout"); } catch { /* fora de contexto de pedido */ }
}

function agendar(tarefa: () => Promise<unknown>) {
  try {
    after(tarefa);
  } catch {
    void tarefa().catch((e) => console.error("[organizador] aviso falhou", e));
  }
}

class RepositorioSupabase implements Repositorio {
  modo = "supabase" as const;
  podeGravar = true;
  private cache = new Map<ColeccaoNome, Promise<Registo[]>>();

  constructor(private db: SupabaseClient) {}

  listar(c: ColeccaoNome): Promise<Registo[]> {
    let p = this.cache.get(c);
    if (!p) {
      p = (async () => {
        let consulta = this.db.from(TABELA[c]).select("*");
        if (c === "paginasLegais") consulta = consulta.not("slug", "like", "conteudo.%");
        const { data, error } = await consulta;
        if (tabelaEmFalta(error)) return [];
        if (error) throw erroDaBase(error);
        return listaDaBase<Registo>(c, data);
      })();
      this.cache.set(c, p);
      p.catch(() => this.cache.delete(c));
    }
    return p;
  }

  async inserir(c: ColeccaoNome, registo: Registo): Promise<Registo> {
    this.cache.delete(c);
    const { data, error } = await escrever(linhaPara(c, registo), (linha) =>
      this.db.from(TABELA[c]).insert(linha).select().single(),
    );
    if (error) throw erroDaBase(error);
    const gravado = { ...registo, ...(data ? daBase<Registo>(c, data as Registo) : {}) };
    // Os mesmos avisos que a API de administração manda depois de criar.
    if (c === "eventos") this.depois(() => notificarNovoEvento(gravado as unknown as Evento));
    else if (c === "corridas") this.depois(() => notificarNovoResultado(gravado as unknown as Corrida));
    else if (c === "anuncios") this.depois(() => notificarNovoAnuncio(gravado as unknown as AnuncioMarketplace));
    else if (c === "encomendas") {
      this.depois(() => avisarEncomendaNova(gravado as EncomendaEmail));
      if (gravado.estado === "pago") this.depois(() => avisarEncomendaPaga(gravado as EncomendaEmail));
    }
    return gravado;
  }

  async actualizar(c: ColeccaoNome, id: string, campos: Registo): Promise<void> {
    this.cache.delete(c);
    const chave = CHAVE_TABELA[c];
    let antes: Registo | null = null;
    if ((c === "eventos" && "bilhetes" in campos) || (c === "encomendas" && campos.estado === "pago")) {
      const { data } = await this.db.from(TABELA[c]).select("*").eq(chave, id).maybeSingle();
      antes = (data as Registo | null) ?? null;
    }
    const { data, error } = await escrever(linhaPara(c, campos), (linha) =>
      this.db.from(TABELA[c]).update(linha).eq(chave, id).select(chave),
    );
    if (error) throw erroDaBase(error);
    if (!data || data.length === 0) throw new ErroDados("Este registo já não existe na base de dados.", 404);
    if (antes && c === "eventos" && !temBilhetes(antes.bilhetes) && temBilhetes(campos.bilhetes)) {
      const evento = { ...daBase<Registo>("eventos", antes), ...campos };
      this.depois(() => notificarBilhetesAbertos(evento as unknown as Evento));
    }
    if (antes && c === "encomendas" && antes.estado !== "pago") {
      const encomenda = { ...daBase<Registo>("encomendas", antes), ...campos };
      this.depois(() => avisarEncomendaPaga(encomenda as EncomendaEmail));
    }
  }

  async apagar(c: ColeccaoNome, id: string): Promise<void> {
    this.cache.delete(c);
    const { error } = await this.db.from(TABELA[c]).delete().eq(CHAVE_TABELA[c], id);
    if (error) throw erroDaBase(error);
  }

  async definirPublicado(c: ColeccaoNome, id: string, publicado: boolean): Promise<void> {
    this.cache.delete(c);
    const chave = CHAVE_TABELA[c];
    const { data, error } = await this.db.from(TABELA[c]).update({ publicado }).eq(chave, id).select(chave);
    if (error) throw erroDaBase(error);
    if (!data || data.length === 0) throw new ErroDados("Este registo já não existe na base de dados.", 404);
  }

  async estaPublicado(c: ColeccaoNome, id: string): Promise<boolean | null> {
    const { data, error } = await this.db.from(TABELA[c]).select("publicado").eq(CHAVE_TABELA[c], id).maybeSingle();
    if (error || !data) return null;
    const v = (data as Registo).publicado;
    return typeof v === "boolean" ? v : null;
  }

  async lerDefinicoes(): Promise<Registo> {
    const { data, error } = await this.db.from("definicoes").select("*").eq("id", 1).maybeSingle();
    if (error) throw erroDaBase(error);
    return data ? definicoesDaBase(data as Registo) : {};
  }

  async gravarDefinicoes(campos: Registo): Promise<void> {
    const { error } = await escrever(definicoesParaBase(campos), (linha) =>
      this.db.from("definicoes").update(linha).eq("id", 1),
    );
    if (error) throw erroDaBase(error);
  }

  conteudoLinhas() { return lerLinhasAdmin(); }
  conteudoGravar(chave: string, titulo: string, dados: unknown, descricao: string) { return gravarLinha(chave, titulo, dados, descricao); }
  conteudoApagar(chave: string) { return apagarLinha(chave); }
  media() { return listarMedia(this.db); }

  async registarAtividade(linha: RegistoAtividade): Promise<void> {
    const { error } = await escrever(linha as unknown as Registo, (l) => this.db.from("atividade").insert(l));
    if (error) console.error("[organizador] não foi possível registar a actividade:", error.message);
  }

  configEmails() { return lerConfigEmails(); }
  enviarEmail(e: EmailUnico, cfg: ConfigEmails) { return enviarEmail(e, cfg); }
  revalidar() { revalidarSite(); }
  depois(tarefa: () => Promise<unknown>) { agendar(tarefa); }
}

/* ---------------- Demonstração (sem base de dados) ---------------- */

export interface OpcoesDemo {
  /** Escritas em memória (testes). Por omissão, recusadas. */
  escrita?: boolean;
  dados?: Partial<Record<ColeccaoNome, Registo[]>>;
  definicoes?: Registo;
  /** Conteúdo editável em memória (testes); sem isto usa o ficheiro local do painel. */
  conteudo?: Map<string, LinhaConteudo>;
  emails?: { enviados: EmailUnico[]; falhar?: string };
}

const CHAVE_DEMO: Record<ColeccaoNome, string> = CHAVE_TABELA;

export class RepositorioDemo implements Repositorio {
  modo = "demo" as const;
  podeGravar: boolean;
  atividade: RegistoAtividade[] = [];
  revalidacoes = 0;
  tarefas: (() => Promise<unknown>)[] = [];
  private dados: Partial<Record<ColeccaoNome, Registo[]>>;
  private defs: Registo;
  private publicados = new Map<string, boolean>();

  constructor(private opcoes: OpcoesDemo = {}) {
    this.podeGravar = Boolean(opcoes.escrita);
    this.dados = structuredClone(opcoes.dados ?? {});
    this.defs = { ...(opcoes.definicoes ?? {}) };
  }

  private recusar(): never {
    throw new ErroDados("Sem base de dados ligada (modo de demonstração): nada foi gravado.", 503);
  }

  private lista(c: ColeccaoNome): Registo[] {
    this.dados[c] ??= [];
    return this.dados[c]!;
  }

  async listar(c: ColeccaoNome) { return structuredClone(this.lista(c)); }

  async inserir(c: ColeccaoNome, registo: Registo) {
    if (!this.podeGravar) this.recusar();
    const k = CHAVE_DEMO[c];
    if (this.lista(c).some((r) => r[k] === registo[k])) throw new ErroDados("Já existe um registo com este endereço de página ou este email. Escolha outro.", 409);
    this.lista(c).unshift(structuredClone(registo));
    return registo;
  }

  async actualizar(c: ColeccaoNome, id: string, campos: Registo) {
    if (!this.podeGravar) this.recusar();
    const k = CHAVE_DEMO[c];
    const i = this.lista(c).findIndex((r) => r[k] === id);
    if (i < 0) throw new ErroDados("Este registo já não existe na base de dados.", 404);
    this.lista(c)[i] = { ...this.lista(c)[i], ...structuredClone(campos) };
  }

  async apagar(c: ColeccaoNome, id: string) {
    if (!this.podeGravar) this.recusar();
    const k = CHAVE_DEMO[c];
    this.dados[c] = this.lista(c).filter((r) => r[k] !== id);
  }

  async definirPublicado(c: ColeccaoNome, id: string, publicado: boolean) {
    if (!this.podeGravar) this.recusar();
    const k = CHAVE_DEMO[c];
    const r = this.lista(c).find((x) => x[k] === id);
    if (!r) throw new ErroDados("Este registo já não existe na base de dados.", 404);
    this.publicados.set(`${c}/${id}`, publicado);
    if (c !== "anuncios") r.publicado = publicado;
  }

  async estaPublicado(c: ColeccaoNome, id: string) {
    const v = this.publicados.get(`${c}/${id}`);
    if (v !== undefined) return v;
    const r = this.lista(c).find((x) => x[CHAVE_DEMO[c]] === id);
    if (!r) return null;
    return typeof r.publicado === "boolean" ? r.publicado : true;
  }

  async lerDefinicoes() { return { ...this.defs }; }
  async gravarDefinicoes(campos: Registo) {
    if (!this.podeGravar) this.recusar();
    this.defs = { ...this.defs, ...campos };
  }

  async conteudoLinhas() {
    return this.opcoes.conteudo ? new Map(this.opcoes.conteudo) : lerLinhasAdmin();
  }
  async conteudoGravar(chave: string, titulo: string, dados: unknown) {
    if (!this.opcoes.conteudo) return gravarLinha(chave, titulo, dados, "conteudo");
    const agora = new Date().toISOString();
    this.opcoes.conteudo.set(chave, { chave, titulo, dados: structuredClone(dados), atualizado: agora });
    return agora;
  }
  async conteudoApagar(chave: string) {
    if (!this.opcoes.conteudo) return apagarLinha(chave);
    this.opcoes.conteudo.delete(chave);
  }

  media() { return listarMedia(null); }

  async registarAtividade(linha: RegistoAtividade) { this.atividade.unshift(linha); }

  async configEmails() { return lerConfigEmails(); }
  async enviarEmail(e: EmailUnico, cfg: ConfigEmails): Promise<ResultadoEmail> {
    if (!this.opcoes.emails) return enviarEmail(e, cfg);
    if (this.opcoes.emails.falhar) return { ok: false, erro: this.opcoes.emails.falhar };
    this.opcoes.emails.enviados.push(e);
    return { ok: true, id: `teste-${this.opcoes.emails.enviados.length}` };
  }

  revalidar() { this.revalidacoes++; }
  depois(tarefa: () => Promise<unknown>) { this.tarefas.push(tarefa); }
}

/** Dados de exemplo (os mesmos do painel sem base de dados). */
export async function dadosDemo(): Promise<{ dados: Partial<Record<ColeccaoNome, Registo[]>>; definicoes: Registo }> {
  const d = await import("@/lib/data");
  const s = await import("@/lib/admin/seed");
  const r = (x: unknown) => x as Registo[];
  return {
    dados: {
      eventos: r(d.eventos), pilotos: r(d.pilotos), equipas: r(d.equipas), corridas: r(d.corridas),
      noticias: r(d.noticias), videos: r(d.videos), patrocinadores: r(d.patrocinadores),
      anuncios: r(d.anuncios), topicos: r(d.topicos), categoriasForum: r(d.categoriasForum), clubes: r(d.clubes),
      utilizadores: r(s.utilizadoresSeed), encomendas: r(s.encomendasSeed), denuncias: r(s.denunciasSeed),
      subscritores: r(s.subscritoresSeed), mensagens: r(s.mensagensSeed), paginasLegais: r(s.paginasLegaisSeed),
      atividade: r(s.atividadeSeed),
    },
    definicoes: s.definicoesSeed as unknown as Registo,
  };
}

/** O repositório deste pedido: Supabase quando ligado, senão a demonstração (só leitura). */
export async function repositorio(): Promise<Repositorio> {
  const db = supabaseAdminConfigurado ? supabaseAdmin() : null;
  if (db) return new RepositorioSupabase(db);
  return new RepositorioDemo(await dadosDemo());
}
