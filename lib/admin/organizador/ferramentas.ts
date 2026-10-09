import "server-only";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA: ferramentas
   Tudo o que um administrador faz no painel, em ferramentas
   para o Claude. As de leitura correm logo e devolvem dados
   compactos (listas resumidas, textos longos cortados) para a
   conversa não crescer sem necessidade. As de escrita nunca
   escrevem: devolvem um plano que o painel mostra para aprovar.
   ============================================================ */

import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import type { ColeccaoNome } from "@/lib/admin/store";
import type { Permissao } from "@/lib/admin/types";
import { TABELA, CHAVE_TABELA } from "@/lib/supabase/mapeamento";
import { DOCS, GRUPOS } from "@/lib/conteudo/registo";
import { resolverDoc, resolverGrupo } from "@/lib/conteudo/resolver";
import { eProva } from "@/lib/desporto";
import { NOMES, eObjeto, normal, tituloDe, type Registo } from "./campos";
import {
  ErroFerramenta, permissaoLeitura, planearApagar, planearAlterar, planearArtigo, planearConteudo,
  planearCriar, planearDefinicoes, planearDestacar, planearEmFoco, planearEvento, planearModeracao, planearPublicar,
  planearRecalcular, planearRepor, planearResposta, planearResultados,
  type Contexto, type Plano,
} from "./planos";
import { emailConfigurado } from "@/lib/email";

/* ---------------- Coleções ---------------- */

export const COLECCOES = Object.keys(TABELA) as ColeccaoNome[];
const zColeccao = z.enum(COLECCOES as [ColeccaoNome, ...ColeccaoNome[]]);
const zEscrevivel = z.enum(COLECCOES.filter((c) => c !== "atividade") as [ColeccaoNome, ...ColeccaoNome[]]);
const zDados = z.record(z.string(), z.unknown());
const zMotivo = z.string().optional().describe("Frase curta para o administrador: o que muda e porquê (de onde veio a informação)");

const pode = (ctx: Contexto, alguma: Permissao[]) => alguma.length === 0 || alguma.some((p) => ctx.quem.permissoes.has(p));

function exigirLeitura(ctx: Contexto, c: ColeccaoNome) {
  if (!pode(ctx, permissaoLeitura(c))) {
    throw new ErroFerramenta(`O papel de quem está a usar o painel (${ctx.quem.papel ?? "sem papel"}) não pode ver ${NOMES[c].varios}.`);
  }
}

/* ---------------- Resumos compactos ---------------- */

const LIMITE_TEXTO = 160;
const corta = (v: unknown, n = LIMITE_TEXTO) => {
  const s = String(v ?? "");
  return s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;
};

/** Os campos que interessam numa lista, por coleção. */
function resumoDe(c: ColeccaoNome, r: Registo): Registo {
  const o = (x: Registo) => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined && v !== "" && v !== null));
  switch (c) {
    case "eventos": {
      const b = Array.isArray(r.bilhetes) ? (r.bilhetes as { preco: number }[]) : [];
      return o({
        slug: r.slug, titulo: r.titulo, tipo: r.disciplina, seccao: eProva(String(r.disciplina ?? "")) ? "Desporto" : "Eventos",
        inicio: String(r.dataInicio ?? "").slice(0, 10), fim: String(r.dataFim ?? "").slice(0, 10), provincia: r.provincia,
        local: r.circuito || r.localidade, estado: r.estado, ronda: r.ronda,
        bilhetes: b.length ? `${b.length} tipo(s), ${Math.min(...b.map((x) => x.preco))}–${Math.max(...b.map((x) => x.preco))} Kz` : undefined,
        entrada: r.entrada, imagem: r.imagem ? "sim" : "não", publicado: r.publicado,
      });
    }
    case "pilotos": {
      const e = eObjeto(r.estatisticas) ? r.estatisticas : {};
      return o({ slug: r.slug, nome: r.nome, numero: r.numero, categoria: r.categoria, equipa: r.equipa, provincia: r.provincia, pontos: e.pontos, vitorias: e.vitorias, foto: r.foto ? "sim" : "não", publicado: r.publicado });
    }
    case "equipas": return o({ slug: r.slug, nome: r.nome, tipo: r.tipo, provincia: r.provincia, pilotos: Array.isArray(r.pilotos) ? r.pilotos.length : 0, pontos: eObjeto(r.estatisticas) ? r.estatisticas.pontos : undefined, publicado: r.publicado });
    case "corridas": return o({ slug: r.slug, nome: r.nome, prova: r.eventoSlug, data: String(r.data ?? "").slice(0, 10), categoria: r.categoria, temporada: r.temporada, ronda: r.ronda, vencedor: r.vencedor, classificados: Array.isArray(r.resultados) ? r.resultados.length : 0, publicado: r.publicado });
    case "noticias": return o({ slug: r.slug, titulo: r.titulo, categoria: r.categoria, data: String(r.data ?? "").slice(0, 10), autor: r.autor, destaque: r.destaque || undefined, imagem: r.imagem ? "sim" : "não", publicado: r.publicado, resumo: corta(r.resumo, 120) });
    case "videos": return o({ slug: r.slug, titulo: r.titulo, data: r.data, categoria: r.categoria, youtube: r.videoId, publicado: r.publicado });
    case "patrocinadores": return o({ slug: r.slug, nome: r.nome, nivel: r.nivel, setor: r.setor, publicado: r.publicado });
    case "clubes": return o({ slug: r.slug, nome: r.nome, tipo: r.tipo, provincia: r.provincia, cidade: r.cidade, destaque: r.destaque || undefined, publicado: r.publicado });
    case "anuncios": return o({ id: r.id, titulo: r.titulo, categoria: r.categoria, preco: r.preco, provincia: r.provincia, vendedor: eObjeto(r.vendedor) ? r.vendedor.nome : undefined, publicado: r.publicado });
    case "topicos": return o({ id: r.id, titulo: r.titulo, categoria: r.categoria, autor: r.autor, criado: String(r.criado ?? "").slice(0, 10), respostas: r.respostas, fixado: r.fixado || undefined, bloqueado: r.bloqueado || undefined });
    case "categoriasForum": return o({ slug: r.slug, nome: r.nome, topicos: r.topicos });
    case "utilizadores": return o({ id: r.id, nome: r.nome, email: r.email, papel: r.papel, estado: r.estado, registado: String(r.registado ?? "").slice(0, 10) });
    case "encomendas": return o({ id: r.id, referencia: r.referencia, evento: r.eventoTitulo, bilhete: r.tipoBilheteNome, quantidade: r.quantidade, total: r.total, estado: r.estado, comprador: eObjeto(r.comprador) ? r.comprador.nome : undefined, criado: String(r.criado ?? "").slice(0, 10) });
    case "denuncias": return o({ id: r.id, tipo: r.tipo, alvo: r.alvoTitulo, alvoId: r.alvoId, motivo: r.motivo, estado: r.estado, criado: String(r.criado ?? "").slice(0, 10) });
    case "subscritores": return o({ id: r.id, email: r.email, nome: r.nome, origem: r.origem, ativo: r.ativo });
    case "mensagens": return o({ id: r.id, nome: r.nome, email: r.email, assunto: r.assunto, recebido: String(r.recebido ?? "").slice(0, 10), lida: r.lida, arquivada: r.arquivada || undefined, respondida: r.respondidaEm ? String(r.respondidaEm).slice(0, 10) : r.resposta ? "sim" : undefined, mensagem: corta(r.mensagem, 200) });
    case "paginasLegais": return o({ slug: r.slug, titulo: r.titulo, atualizado: r.atualizado, publicado: r.publicado });
    case "atividade": return o({ quando: r.quando, utilizador: r.utilizador, accao: r.accao, entidade: r.entidade, detalhe: corta(r.detalhe, 100) });
  }
}

/** Data principal de um registo, para ordenar do mais recente para o mais antigo. */
function dataDe(r: Registo): string {
  return String(r.dataInicio ?? r.data ?? r.criado ?? r.recebido ?? r.quando ?? r.registado ?? r.subscrito ?? r.publicado ?? "");
}

/** Corta textos longos e listas compridas de um registo completo. */
function compactar(v: unknown, n = 4000, chave = ""): unknown {
  if (typeof v === "string") return v.length > n ? `${v.slice(0, n)}…[cortado: ${v.length} caracteres]` : v;
  if (Array.isArray(v)) {
    const lista = v.slice(0, 80).map((x) => compactar(x, Math.min(n, 2500), chave));
    return v.length > 80 ? [...lista, `…[mais ${v.length - 80}]`] : lista;
  }
  if (eObjeto(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, compactar(x, n, k)]));
  return v;
}

/** JSON compacto, cortado se passar do limite. */
export function paraTextoResultado(v: unknown, limite = 14000): string {
  const s = JSON.stringify(v);
  return s.length > limite ? `${s.slice(0, limite)}…[resultado cortado: peça menos itens ou filtre melhor]` : s;
}

/* ---------------- Datas ---------------- */

/** AAAA-MM-DD em Luanda. */
export function hojeLuanda(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Luanda", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

/* ---------------- Ferramentas ---------------- */

interface Ferramenta<S extends z.ZodType = z.ZodType> {
  nome: string;
  descricao: string;
  esquema: S;
  /** Muda dados: devolve um plano para aprovar. */
  escrita: boolean;
  rotulo: (e: z.infer<S>) => string;
  ler?: (e: z.infer<S>, ctx: Contexto) => Promise<unknown>;
  planear?: (e: z.infer<S>, ctx: Contexto, idChamada: string) => Promise<Plano>;
}

const def = <S extends z.ZodType>(f: Ferramenta<S>) => f as unknown as Ferramenta;

const listar = async (ctx: Contexto, c: ColeccaoNome) => { exigirLeitura(ctx, c); return ctx.repo.listar(c); };

const FERRAMENTAS: Ferramenta[] = [
  /* ---------- Leitura ---------- */
  def({
    nome: "resumo_painel",
    descricao: "Resumo do que precisa de atenção hoje: mensagens por ler, denúncias pendentes, encomendas por pagar, próximos eventos (e os que não têm bilhetes nem entrada), provas já feitas sem resultados, rascunhos de artigos e novidades da semana. Use quando pedirem um ponto de situação, «o que há para fazer» ou antes de sugerir tarefas.",
    esquema: z.object({}),
    escrita: false,
    rotulo: () => "A ver o que precisa de atenção…",
    ler: async (_e, ctx) => resumoPainel(ctx),
  }),
  def({
    nome: "listar_registos",
    descricao: "Lista registos de uma coleção, já resumidos (só os campos principais), do mais recente para o mais antigo. Filtre por campos exactos (ex.: {\"lida\": false}, {\"estado\": \"pendente\"}, {\"disciplina\": \"Motocross\"}) e/ou por texto. Use para encontrar o que existe antes de propor mudanças. Para ver um registo inteiro use ver_registo.",
    esquema: z.object({
      coleccao: zColeccao,
      filtros: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe("Campo → valor exacto (texto sem distinguir maiúsculas)"),
      texto: z.string().optional().describe("Procura em todos os textos do registo"),
      ordenar: z.string().optional().describe("Campo para ordenar; por omissão a data, do mais recente"),
      crescente: z.boolean().optional(),
      limite: z.number().int().min(1).max(50).optional().describe("Por omissão 20"),
      saltar: z.number().int().min(0).optional().describe("Para ver a página seguinte"),
    }),
    escrita: false,
    rotulo: (e) => `A ver ${NOMES[e.coleccao].varios}…`,
    ler: async (e, ctx) => {
      let lista = await listar(ctx, e.coleccao);
      const total = lista.length;
      for (const [campo, valor] of Object.entries(e.filtros ?? {})) {
        lista = lista.filter((r) => {
          const v = r[campo];
          if (typeof valor === "boolean") return Boolean(v) === valor;
          if (typeof valor === "number") return Number(v) === valor;
          return normal(String(v ?? "")) === normal(valor) || String(v ?? "").slice(0, 10) === valor;
        });
      }
      if (e.texto) {
        const q = normal(e.texto);
        lista = lista.filter((r) => normal(JSON.stringify(r)).includes(q));
      }
      const campo = e.ordenar;
      lista = [...lista].sort((a, b) => {
        const x = campo ? a[campo] : dataDe(a);
        const y = campo ? b[campo] : dataDe(b);
        const r = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
        return e.crescente ? r : -r;
      });
      const saltar = e.saltar ?? 0;
      const limite = e.limite ?? 20;
      const itens = lista.slice(saltar, saltar + limite).map((r) => resumoDe(e.coleccao, r));
      return { coleccao: e.coleccao, total, encontrados: lista.length, mostrados: itens.length, saltados: saltar, itens };
    },
  }),
  def({
    nome: "procurar",
    descricao: "Procura um nome, título, email ou endereço em todas as coleções que pode ver, nos conteúdos do site (rotas, perfis de clubes, páginas) e na biblioteca de imagens. Use quando o pedido nomeia algo («a rota da Serra da Leba», «o Nelson Kiala») e não sabe em que coleção está ou qual é o slug.",
    esquema: z.object({
      texto: z.string().min(2),
      coleccoes: z.array(zColeccao).optional().describe("Restringir a estas coleções"),
    }),
    escrita: false,
    rotulo: (e) => `A procurar «${e.texto}»…`,
    ler: async (e, ctx) => procurar(ctx, e.texto, e.coleccoes),
  }),
  def({
    nome: "ver_registo",
    descricao: "Mostra um registo completo (textos muito longos cortados). Use antes de propor uma alteração, para partir dos valores actuais.",
    esquema: z.object({ coleccao: zColeccao, id: z.string().describe("slug ou id; um nome também serve se for único") }),
    escrita: false,
    rotulo: (e) => `A abrir ${NOMES[e.coleccao].um.toLowerCase()} «${e.id}»…`,
    ler: async (e, ctx) => {
      const lista = await listar(ctx, e.coleccao);
      const k = CHAVE_TABELA[e.coleccao];
      const alvo = normal(e.id);
      const r = lista.find((x) => String(x[k]) === e.id) ?? lista.find((x) => normal(String(x[k])) === alvo)
        ?? (() => { const m = lista.filter((x) => normal(tituloDe(x)) === alvo); return m.length === 1 ? m[0] : undefined; })();
      if (!r) throw new ErroFerramenta(`Não encontrei «${e.id}» em ${NOMES[e.coleccao].varios}. Use procurar ou listar_registos.`);
      const extra = e.coleccao === "anuncios"
        ? { visivelNoSite: await ctx.repo.estaPublicado(e.coleccao, String(r[k])) } : {};
      return { coleccao: e.coleccao, registo: compactar(r), ...extra };
    },
  }),
  def({
    nome: "ler_definicoes",
    descricao: "Lê as Definições do site: nome, contactos, redes, temporada em curso, taxa da bilheteira, interruptores (manutenção, registos, marketplace, fórum, bilheteira, newsletter automática).",
    esquema: z.object({}),
    escrita: false,
    rotulo: () => "A ler as Definições…",
    ler: async (_e, ctx) => ctx.repo.lerDefinicoes(),
  }),
  def({
    nome: "listar_conteudos",
    descricao: "Lista o conteúdo editável do site que não vive em tabelas: documentos (textos da entrada, painel Explorar, páginas Sobre, Contacto, Segurança, secções, campeonato, emails) e grupos de itens (rotas, perfis de clubes, modalidades…), com a chave de cada um e se já foi editado.",
    esquema: z.object({ procura: z.string().optional() }),
    escrita: false,
    rotulo: () => "A ver os conteúdos do site…",
    ler: async (e, ctx) => {
      const linhas = await ctx.repo.conteudoLinhas();
      const q = e.procura ? normal(e.procura) : "";
      const docs = [...DOCS.values()]
        .filter((d) => !q || normal(`${d.chave} ${d.titulo}`).includes(q))
        .map((d) => ({ chave: d.chave, titulo: d.titulo, pagina: d.pagina, editado: resolverDoc(d.chave, linhas).origem === "base" }));
      const grupos = [...GRUPOS.values()].map((g) => {
        const r = resolverGrupo(g.grupo, linhas);
        const itens = r.itens.filter((i) => !q || normal(`${i.chave} ${i.titulo}`).includes(q) || normal(`${g.grupo} ${g.titulo}`).includes(q));
        return { grupo: g.grupo, titulo: g.titulo, total: r.itens.length, itens: itens.slice(0, 40).map((i) => ({ chave: i.chave, titulo: i.titulo, editado: i.origem === "base" })) };
      }).filter((g) => !q || g.itens.length > 0);
      return { docs, grupos };
    },
  }),
  def({
    nome: "ler_conteudo",
    descricao: "Lê um documento editável (chave, ex.: \"site.painel\", \"paginas.sobre\") ou um item de um grupo (grupo + item, ex.: grupo \"rotas\", item \"serra-da-leba\"), já junto com o conteúdo de partida. Com «caminho» (ex.: \"destaque\" ou \"pagamento.metodos\") devolve só essa parte. Use antes de escrever_conteudo para ver a forma exacta.",
    esquema: z.object({
      chave: z.string().optional(),
      grupo: z.string().optional(),
      item: z.string().optional(),
      caminho: z.string().optional(),
    }),
    escrita: false,
    rotulo: (e) => `A ler ${e.grupo ? `${e.grupo}/${e.item ?? ""}` : e.chave ?? "conteúdo"}…`,
    ler: async (e, ctx) => {
      const linhas = await ctx.repo.conteudoLinhas();
      let dados: unknown;
      let info: Registo;
      if (e.grupo) {
        if (!GRUPOS.has(e.grupo)) throw new ErroFerramenta(`Grupo desconhecido: ${e.grupo}.`);
        const r = resolverGrupo(e.grupo, linhas);
        if (!e.item) return { grupo: e.grupo, itens: r.itens.map((i) => ({ chave: i.chave, titulo: i.titulo, editado: i.origem === "base" })) };
        const item = r.itens.find((i) => i.chave === e.item);
        if (!item) throw new ErroFerramenta(`Não existe «${e.item}» no grupo ${e.grupo}.`);
        dados = item.dados;
        info = { grupo: e.grupo, item: item.chave, titulo: item.titulo, editado: item.origem === "base" };
      } else {
        if (!e.chave || !DOCS.has(e.chave)) throw new ErroFerramenta(`Documento desconhecido: «${e.chave ?? ""}». Use listar_conteudos.`);
        const d = resolverDoc(e.chave, linhas);
        dados = d.dados;
        info = { chave: d.chave, titulo: d.titulo, pagina: DOCS.get(e.chave)?.pagina, editado: d.origem === "base" };
      }
      if (e.caminho) {
        for (const parte of e.caminho.split(".")) {
          dados = eObjeto(dados) ? dados[parte] : Array.isArray(dados) ? dados[Number(parte)] : undefined;
        }
        if (dados === undefined) throw new ErroFerramenta(`O caminho «${e.caminho}» não existe neste conteúdo.`);
      }
      return { ...info, caminho: e.caminho, dados: compactar(dados, 2500) };
    },
  }),
  def({
    nome: "listar_media",
    descricao: "Lista a biblioteca de imagens e vídeos (nome, endereço, data), do mais recente para o mais antigo. Use para escolher uma imagem para um evento, artigo, piloto ou conteúdo.",
    esquema: z.object({
      tipo: z.enum(["imagem", "video"]).optional(),
      procura: z.string().optional(),
      limite: z.number().int().min(1).max(60).optional(),
    }),
    escrita: false,
    rotulo: () => "A ver a biblioteca de imagens…",
    ler: async (e, ctx) => {
      let lista = await ctx.repo.media();
      if (e.tipo) lista = lista.filter((f) => f.tipo === e.tipo);
      if (e.procura) { const q = normal(e.procura); lista = lista.filter((f) => normal(f.nome).includes(q)); }
      return { total: lista.length, ficheiros: lista.slice(0, e.limite ?? 25).map((f) => ({ nome: f.nome, url: f.url, tipo: f.tipo, criado: f.criado?.slice(0, 10) })) };
    },
  }),

  /* ---------- Escrita (propostas) ---------- */
  def({
    nome: "criar_registo",
    descricao: "Propõe criar um registo numa coleção (piloto, equipa, clube, artigo, anúncio, categoria do fórum, utilizador, encomenda, subscritor, página legal…). Passe só os campos que sabe; os restantes ficam com os valores de partida. O slug gera-se a partir do nome. Para eventos prefira criar_evento, para resultados publicar_resultados e para artigos rascunho_artigo. Nada é gravado sem aprovação.",
    esquema: z.object({ coleccao: zEscrevivel, dados: zDados.describe("Campo → valor, com os nomes do guia de campos"), motivo: zMotivo }),
    escrita: true,
    rotulo: (e) => `A preparar ${NOMES[e.coleccao].um.toLowerCase()} novo…`,
    planear: (e, ctx, id) => planearCriar(ctx, e.coleccao, e.dados, id, e.motivo),
  }),
  def({
    nome: "alterar_registo",
    descricao: "Propõe mudar campos de um registo que existe. Passe só os campos que mudam. Listas (bilhetes, horários, resultados, parágrafos, etiquetas) levam a lista completa como deve ficar; objectos (estatisticas, redes) podem levar só as chaves que mudam. Mudar a equipa de um piloto acerta sozinho as listas das equipas; mudar a data de início de um evento ajusta a data de fim. Nada é gravado sem aprovação.",
    esquema: z.object({ coleccao: zEscrevivel, id: z.string(), campos: zDados, motivo: zMotivo }),
    escrita: true,
    rotulo: (e) => `A preparar alterações a «${e.id}»…`,
    planear: (e, ctx) => planearAlterar(ctx, e.coleccao, e.id, e.campos, e.motivo),
  }),
  def({
    nome: "apagar_registo",
    descricao: "Propõe apagar um registo. Não se desfaz e pede sempre confirmação explícita do administrador. Só quando o pedido é claro; para tirar algo do site sem o perder prefira publicar com publicado=false.",
    esquema: z.object({ coleccao: zEscrevivel, id: z.string(), motivo: z.string().describe("Porque se apaga") }),
    escrita: true,
    rotulo: (e) => `A preparar a remoção de «${e.id}»…`,
    planear: (e, ctx) => planearApagar(ctx, e.coleccao, e.id, e.motivo),
  }),
  def({
    nome: "publicar",
    descricao: "Propõe publicar (mostrar no site) ou esconder um registo sem o apagar: eventos, pilotos, equipas, resultados, artigos, vídeos, patrocinadores, clubes, páginas legais, anúncios e tópicos.",
    esquema: z.object({ coleccao: zEscrevivel, id: z.string(), publicado: z.boolean(), motivo: zMotivo }),
    escrita: true,
    rotulo: (e) => (e.publicado ? `A preparar a publicação de «${e.id}»…` : `A preparar «${e.id}» para esconder…`),
    planear: (e, ctx) => planearPublicar(ctx, e.coleccao, e.id, e.publicado, e.motivo),
  }),
  def({
    nome: "alterar_definicoes",
    descricao: "Propõe mudar as Definições do site (contactos, redes, temporada em curso, taxa, interruptores como manutenção ou bilheteira). Só papéis com acesso às Definições.",
    esquema: z.object({ campos: zDados, motivo: zMotivo }),
    escrita: true,
    rotulo: () => "A preparar mudanças às Definições…",
    planear: (e, ctx) => planearDefinicoes(ctx, e.campos, e.motivo),
  }),
  def({
    nome: "escrever_conteudo",
    descricao: "Propõe gravar conteúdo editável do site: um documento (chave) ou um item de um grupo (grupo + item, cria-o se não existir). Com modo «juntar» (por omissão) só mudam as chaves que enviar, a todos os níveis; com «substituir» o conteúdo passa a ser exactamente o enviado. Leia antes com ler_conteudo.",
    esquema: z.object({
      chave: z.string().optional().describe("Documento, ex.: site.painel"),
      grupo: z.string().optional().describe("Grupo, ex.: rotas"),
      item: z.string().optional().describe("Item do grupo, ex.: serra-da-leba"),
      dados: z.unknown(),
      modo: z.enum(["juntar", "substituir"]).optional(),
      titulo: z.string().optional(),
      motivo: zMotivo,
    }),
    escrita: true,
    rotulo: (e) => `A preparar mudanças em ${e.grupo ? `${e.grupo}/${e.item ?? ""}` : e.chave ?? "conteúdo"}…`,
    planear: (e, ctx) => planearConteudo(ctx, e as Parameters<typeof planearConteudo>[1], e.motivo),
  }),
  def({
    nome: "repor_conteudo",
    descricao: "Propõe repor um documento ou um item de grupo como no original (apaga as edições gravadas) ou, com retirar=true, tirar um item de um grupo do site. Destrutivo: pede confirmação explícita.",
    esquema: z.object({
      chave: z.string().optional(),
      grupo: z.string().optional(),
      item: z.string().optional(),
      retirar: z.boolean().optional(),
      motivo: zMotivo,
    }),
    escrita: true,
    rotulo: () => "A preparar a reposição do conteúdo…",
    planear: (e, ctx) => planearRepor(ctx, e, e.motivo),
  }),
  def({
    nome: "criar_evento",
    descricao: "Propõe criar um evento (passeio, raide, encontro, concentração, acção solidária, formação, ou uma prova de Desporto) com bilhetes, horários e textos. Sem bilhetes online, indique em «entrada» como se participa. Datas reais AAAA-MM-DD; não invente preços nem horas.",
    esquema: z.object({
      titulo: z.string(),
      disciplina: z.string().describe("Passeio, Raide, Encontro, Concentração, Solidária, Formação, Prova, Motocross, Enduro, Velocidade, Rally, Moto 4 ou Karting"),
      dataInicio: z.string().describe("AAAA-MM-DD"),
      dataFim: z.string().optional(),
      provincia: z.string(),
      localidade: z.string().optional(),
      circuito: z.string().optional().describe("Local, circuito ou ponto de encontro"),
      resumo: z.string().optional(),
      descricao: z.string().optional(),
      organizador: z.string().optional(),
      horarios: z.array(z.object({ dia: z.string(), hora: z.string(), sessao: z.string() })).optional(),
      bilhetes: z.array(z.object({
        nome: z.string(),
        preco: z.union([z.number(), z.string()]).describe("Kz"),
        descricao: z.string().optional(),
        disponiveis: z.number().int().optional(),
        beneficios: z.array(z.string()).optional(),
        destaque: z.boolean().optional(),
      })).optional(),
      entrada: z.string().optional(),
      ronda: z.number().int().optional(),
      estado: z.string().optional(),
      imagem: z.string().optional(),
      publicado: z.boolean().optional(),
      motivo: zMotivo,
    }),
    escrita: true,
    rotulo: (e) => `A preparar o evento «${e.titulo}»…`,
    planear: (e, ctx, id) => { const { motivo, ...resto } = e; return planearEvento(ctx, resto, id, motivo); },
  }),
  def({
    nome: "publicar_resultados",
    descricao: "Propõe publicar os resultados de uma corrida (nova, ligada a uma prova por eventoSlug, ou uma existente pelo slug em «corrida») e somar o contributo dessa corrida às estatísticas dos pilotos e equipas (pontos, vitórias, pódios, corridas). Com pontos=\"mundial\" aplica a tabela 25, 22, 20… Se a prova já terminou, marca-a como concluída.",
    esquema: z.object({
      corrida: z.string().optional().describe("Slug de uma corrida existente, para substituir os resultados"),
      eventoSlug: z.string().optional(),
      nome: z.string().optional(),
      categoria: z.string().optional().describe("MX1, MX2…"),
      data: z.string().optional(),
      ronda: z.number().int().optional(),
      circuito: z.string().optional(),
      provincia: z.string().optional(),
      resultados: z.array(z.object({
        posicao: z.union([z.number(), z.string()]).optional(),
        piloto: z.string().optional(),
        pilotoSlug: z.string().optional(),
        equipa: z.string().optional(),
        voltas: z.union([z.number(), z.string()]).optional(),
        tempo: z.string().optional(),
        pontos: z.union([z.number(), z.string()]).optional(),
        estado: z.string().optional().describe("DNF, DNS ou DSQ"),
        melhorVolta: z.boolean().optional(),
      })).min(1),
      pontos: z.enum(["indicados", "mundial"]).optional(),
      actualizarEstatisticas: z.boolean().optional(),
      concluirEvento: z.boolean().optional(),
      motivo: zMotivo,
    }),
    escrita: true,
    rotulo: () => "A preparar os resultados…",
    planear: (e, ctx, id) => { const { motivo, ...resto } = e; return planearResultados(ctx, resto as Parameters<typeof planearResultados>[1], id, motivo); },
  }),
  def({
    nome: "recalcular_estatisticas",
    descricao: "Propõe recalcular as estatísticas dos pilotos (e os pontos das equipas) a partir de todos os resultados registados numa temporada. Use quando pedirem para acertar a classificação; os pilotos sem resultados registados ficam como estão.",
    esquema: z.object({ temporada: z.number().int().optional(), motivo: zMotivo }),
    escrita: true,
    rotulo: () => "A recalcular a classificação…",
    planear: (e, ctx) => planearRecalcular(ctx, e.temporada, e.motivo),
  }),
  def({
    nome: "destacar_artigo",
    descricao: "Propõe pôr um artigo em destaque (o painel grande do Explorar e a página de artigos), tirando o destaque aos outros; com destaque=false tira-o.",
    esquema: z.object({ slug: z.string(), destaque: z.boolean().optional(), motivo: zMotivo }),
    escrita: true,
    rotulo: () => "A preparar o artigo em destaque…",
    planear: (e, ctx) => planearDestacar(ctx, e.slug, e.destaque ?? true, e.motivo),
  }),
  def({
    nome: "definir_em_foco",
    descricao: "Propõe mudar o que está «Em foco» no painel Explorar (o mosaico com fotografia e, nos eventos e provas, a contagem decrescente). Escolha o tipo (evento, prova, artigo, rota, anuncio, clube, modalidade, seguranca ou personalizado) e o item (slug, ou id do anúncio). Os textos e a fotografia ficam em branco para valerem os do item, a não ser que o administrador peça outros. Use quando pedirem para pôr algo em foco ou em destaque no painel.",
    esquema: z.object({
      tipo: z.string().describe("evento, prova, artigo, rota, anuncio, clube, modalidade, seguranca ou personalizado"),
      item: z.string().optional().describe("Slug do evento, prova, artigo, rota, clube ou modalidade; id do anúncio"),
      titulo: z.string().optional().describe("Só se quiser outro título que não o do item"),
      subtitulo: z.string().optional(),
      sobretitulo: z.string().optional(),
      foto: z.string().optional(),
      textoLigacao: z.string().optional(),
      ligacao: z.string().optional(),
      data: z.string().optional().describe("Data e hora ISO com fuso para a contagem (em branco: o início do evento)"),
      activa: z.boolean().optional().describe("Contagem decrescente ligada"),
      manterTextos: z.boolean().optional().describe("Manter os textos escritos à mão em vez de os limpar"),
      dados: zDados.optional().describe("Só se o documento tiver outra forma: as chaves a mudar"),
      motivo: zMotivo,
    }),
    escrita: true,
    rotulo: (e) => `A preparar «Em foco»${e.item ? `: ${e.item}` : ""}…`,
    planear: (e, ctx) => { const { motivo, ...resto } = e; return planearEmFoco(ctx, resto, motivo); },
  }),
  def({
    nome: "responder_mensagem",
    descricao: "Propõe responder por email a uma mensagem do formulário de contacto. O email segue para quem escreveu, com a mensagem original por baixo; a resposta fica guardada e a mensagem marcada como lida. Escreva só o corpo da resposta (sem saudação nem assinatura, que se juntam sozinhas).",
    esquema: z.object({ id: z.string(), resposta: z.string().min(2) }),
    escrita: true,
    rotulo: () => "A preparar a resposta…",
    planear: (e, ctx) => planearResposta(ctx, e.id, e.resposta, ctx.repo.modo === "demo" ? true : emailConfigurado()),
  }),
  def({
    nome: "moderar_denuncia",
    descricao: "Propõe resolver ou arquivar uma denúncia, com a acção sobre o conteúdo: anúncio (esconder-anuncio, apagar-anuncio), tópico do fórum (fechar-topico, esconder-topico, apagar-topico) ou conta (suspender-conta, banir-conta). Apagar e banir pedem confirmação explícita.",
    esquema: z.object({
      id: z.string(),
      decisao: z.enum(["resolver", "arquivar"]),
      accao: z.enum(["nenhuma", "esconder-anuncio", "apagar-anuncio", "fechar-topico", "esconder-topico", "apagar-topico", "suspender-conta", "banir-conta"]).optional(),
      resolucao: z.string().optional().describe("Nota interna sobre o que se fez"),
    }),
    escrita: true,
    rotulo: () => "A preparar a moderação…",
    planear: (e, ctx) => planearModeracao(ctx, e),
  }),
  def({
    nome: "rascunho_artigo",
    descricao: "Propõe um artigo escrito a partir das notas do administrador, guardado como rascunho (sem aparecer no site) a não ser que peçam para publicar. Escreva em português de Angola, com parágrafos curtos, sem inventar factos que não estejam nas notas.",
    esquema: z.object({
      titulo: z.string(),
      resumo: z.string(),
      corpo: z.array(z.string()).min(1).describe("Parágrafos"),
      categoria: z.string().describe("Comunidade, Clubes, Viagens, Segurança, Guias, Oficina, Entrevista, Desporto ou Mundo"),
      tags: z.array(z.string()).optional(),
      autor: z.string().optional(),
      data: z.string().optional(),
      imagem: z.string().optional(),
      fonte: z.string().optional(),
      fonteUrl: z.string().optional(),
      publicar: z.boolean().optional(),
      motivo: zMotivo,
    }),
    escrita: true,
    rotulo: (e) => `A escrever o artigo «${e.titulo}»…`,
    planear: (e, ctx, id) => { const { motivo, ...resto } = e; return planearArtigo(ctx, resto, id, motivo); },
  }),
];

const PORNOME = new Map(FERRAMENTAS.map((f) => [f.nome, f]));

export const ferramenta = (nome: string) => PORNOME.get(nome);
export const eEscrita = (nome: string) => Boolean(PORNOME.get(nome)?.escrita);
export const NOMES_ESCRITA = FERRAMENTAS.filter((f) => f.escrita).map((f) => f.nome);

/** Rótulo antes de se conhecer a entrada (quando a chamada começa a chegar). */
export function rotuloInicial(nome: string): string {
  const f = PORNOME.get(nome);
  if (!f) return "A trabalhar…";
  return f.escrita ? "A preparar uma proposta…" : "A consultar os dados…";
}

export function rotuloDe(nome: string, entrada: unknown): string {
  const f = PORNOME.get(nome);
  if (!f) return "A trabalhar…";
  const r = f.esquema.safeParse(entrada);
  return r.success ? f.rotulo(r.data) : rotuloInicial(nome);
}

/* ---------------- Definições para a API ---------------- */

/** JSON Schema de uma ferramenta, sem os extras do Zod que a API não precisa. */
function esquemaJson(s: z.ZodType): Anthropic.Beta.BetaTool.InputSchema {
  const limpar = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(limpar);
    if (!eObjeto(v)) return v;
    const o: Registo = {};
    for (const [k, x] of Object.entries(v)) {
      if (k === "$schema" || k === "propertyNames") continue;
      o[k] = k === "additionalProperties" && eObjeto(x) && Object.keys(x).length === 0 ? true : limpar(x);
    }
    return o;
  };
  const j = limpar(z.toJSONSchema(s, { io: "input", unrepresentable: "any" })) as Registo;
  return { ...j, type: "object" } as Anthropic.Beta.BetaTool.InputSchema;
}

/**
 * As ferramentas para a API, sempre pela mesma ordem (o prompt
 * fica em cache). Quem não pode escrever só recebe as de leitura.
 */
export function definicoesFerramentas(escrita: boolean): Anthropic.Beta.BetaTool[] {
  return FERRAMENTAS
    .filter((f) => escrita || !f.escrita)
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((f) => ({
      name: f.nome,
      description: f.descricao,
      input_schema: esquemaJson(f.esquema),
      // Pedidos em streaming: as entradas grandes chegam à medida que são escritas.
      eager_input_streaming: true,
    }));
}

/* ---------------- Execução ---------------- */

export type Validacao = { ok: true; dados: unknown } | { ok: false; erro: string };

/** Valida a entrada de uma ferramenta (a API não valida com eager_input_streaming). */
export function validarEntrada(nome: string, entrada: unknown): Validacao {
  const f = PORNOME.get(nome);
  if (!f) return { ok: false, erro: `Ferramenta desconhecida: ${nome}.` };
  const r = f.esquema.safeParse(entrada ?? {});
  if (r.success) return { ok: true, dados: r.data };
  const problemas = r.error.issues.slice(0, 6).map((i) => `${i.path.join(".") || "(entrada)"}: ${i.message}`).join("; ");
  return { ok: false, erro: `Entrada inválida para ${nome}: ${problemas}.` };
}

export async function lerComFerramenta(nome: string, dados: unknown, ctx: Contexto): Promise<unknown> {
  const f = PORNOME.get(nome);
  if (!f?.ler) throw new ErroFerramenta(`${nome} não é uma ferramenta de leitura.`);
  return f.ler(dados, ctx);
}

export async function planearComFerramenta(nome: string, dados: unknown, ctx: Contexto, idChamada: string): Promise<Plano> {
  const f = PORNOME.get(nome);
  if (!f?.planear) throw new ErroFerramenta(`${nome} não é uma ferramenta de escrita.`);
  const plano = await f.planear(dados, ctx, idChamada);
  for (const alguma of plano.permissoes) {
    if (!pode(ctx, alguma)) {
      throw new ErroFerramenta(`O papel de quem está a usar o painel (${ctx.quem.papel ?? "sem papel"}) não permite isto (precisa de ${alguma.join(" ou ")}). Diga-lhe que peça a um administrador.`);
    }
  }
  return plano;
}

/* ---------------- Resumo do painel ---------------- */

async function seguro<T>(ctx: Contexto, c: ColeccaoNome, f: (l: Registo[]) => T): Promise<T | undefined> {
  if (!pode(ctx, permissaoLeitura(c))) return undefined;
  try { return f(await ctx.repo.listar(c)); } catch { return undefined; }
}

async function resumoPainel(ctx: Contexto): Promise<unknown> {
  const hoje = ctx.hoje;
  const ha7 = new Date(Date.parse(`${hoje}T00:00:00Z`) - 7 * 86_400_000).toISOString().slice(0, 10);
  const em45 = new Date(Date.parse(`${hoje}T00:00:00Z`) + 45 * 86_400_000).toISOString().slice(0, 10);
  const dia = (v: unknown) => String(v ?? "").slice(0, 10);

  const [mensagens, denuncias, encomendas, eventos, corridas, noticias, anuncios, topicos, subscritores, definicoes] = await Promise.all([
    seguro(ctx, "mensagens", (l) => {
      const porLer = l.filter((m) => !m.lida && !m.arquivada).sort((a, b) => dia(b.recebido).localeCompare(dia(a.recebido)));
      return { porLer: porLer.length, recentes: porLer.slice(0, 6).map((m) => resumoDe("mensagens", m)) };
    }),
    seguro(ctx, "denuncias", (l) => {
      const p = l.filter((d) => d.estado === "pendente");
      return { pendentes: p.length, lista: p.slice(0, 6).map((d) => resumoDe("denuncias", d)) };
    }),
    seguro(ctx, "encomendas", (l) => {
      const p = l.filter((e) => e.estado === "pendente");
      return { pendentes: p.length, valorPendente: p.reduce((s, e) => s + (Number(e.total) || 0), 0), ultimasSemana: l.filter((e) => dia(e.criado) >= ha7).length };
    }),
    seguro(ctx, "eventos", (l) => {
      const proximos = l.filter((e) => dia(e.dataFim || e.dataInicio) >= hoje && dia(e.dataInicio) <= em45)
        .sort((a, b) => dia(a.dataInicio).localeCompare(dia(b.dataInicio)));
      const semBilhetesNemEntrada = proximos.filter((e) => !(Array.isArray(e.bilhetes) && e.bilhetes.length) && !e.entrada).map((e) => e.slug);
      const semImagem = proximos.filter((e) => !e.imagem).map((e) => e.slug);
      const passadosPorConcluir = l.filter((e) => dia(e.dataFim || e.dataInicio) < hoje && e.estado !== "concluido").map((e) => e.slug);
      return { proximos45Dias: proximos.map((e) => resumoDe("eventos", e)), semBilhetesNemEntrada, semImagem, passadosPorConcluir };
    }),
    seguro(ctx, "corridas", (l) => l),
    seguro(ctx, "noticias", (l) => {
      const ordenadas = [...l].sort((a, b) => dia(b.data).localeCompare(dia(a.data)));
      return {
        ultimo: ordenadas[0] ? { titulo: ordenadas[0].titulo, data: dia(ordenadas[0].data) } : null,
        rascunhos: l.filter((n) => n.publicado === false).map((n) => ({ slug: n.slug, titulo: n.titulo })),
        emDestaque: l.filter((n) => n.destaque).map((n) => n.slug),
      };
    }),
    seguro(ctx, "anuncios", (l) => ({ novosSemana: l.filter((a) => dia(a.publicado) >= ha7).length, total: l.length })),
    seguro(ctx, "topicos", (l) => ({ novosSemana: l.filter((t) => dia(t.criado) >= ha7).length })),
    seguro(ctx, "subscritores", (l) => ({ novosSemana: l.filter((s) => dia(s.subscrito) >= ha7).length, activos: l.filter((s) => s.ativo !== false).length })),
    ctx.repo.lerDefinicoes().catch(() => undefined),
  ]);

  // Provas de Desporto já feitas sem nenhum resultado registado.
  let provasSemResultados: unknown;
  if (Array.isArray(corridas)) {
    const comResultados = new Set(corridas.map((c) => String(c.eventoSlug ?? "")));
    provasSemResultados = await seguro(ctx, "eventos", (l) => l
      .filter((e) => eProva(String(e.disciplina ?? "")) && dia(e.dataFim || e.dataInicio) < hoje && Number(e.temporada) === ctx.temporada && !comResultados.has(String(e.slug)))
      .map((e) => ({ slug: e.slug, titulo: e.titulo, data: dia(e.dataInicio) })));
  }

  return {
    hoje, temporada: ctx.temporada, baseDados: ctx.repo.modo === "supabase" ? "ligada" : "demonstração (só leitura)",
    mensagens, denuncias, encomendas, eventos, provasSemResultados, artigos: noticias, anuncios, forum: topicos, newsletter: subscritores,
    site: definicoes ? {
      manutencao: definicoes.manutencao, bilheteiraAberta: definicoes.bilheteiraAberta,
      marketplaceAberto: definicoes.marketplaceAberto, forumAberto: definicoes.forumAberto, registosAbertos: definicoes.registosAbertos,
    } : undefined,
  };
}

/* ---------------- Procura geral ---------------- */

const CAMPOS_PROCURA = ["slug", "id", "titulo", "nome", "email", "referencia", "assunto", "alvoTitulo", "apelido", "marca", "cidade"];

async function procurar(ctx: Contexto, texto: string, coleccoes?: ColeccaoNome[]): Promise<unknown> {
  const q = normal(texto);
  const alvo = (coleccoes?.length ? coleccoes : COLECCOES.filter((c) => c !== "atividade"))
    .filter((c) => pode(ctx, permissaoLeitura(c)));
  const encontrados: { coleccao: string; item: Registo }[] = [];
  await Promise.all(alvo.map(async (c) => {
    const lista = await ctx.repo.listar(c).catch(() => [] as Registo[]);
    for (const r of lista) {
      if (CAMPOS_PROCURA.some((k) => r[k] !== undefined && normal(String(r[k])).includes(q))) {
        encontrados.push({ coleccao: c, item: resumoDe(c, r) });
      }
    }
  }));
  const linhas = await ctx.repo.conteudoLinhas().catch(() => new Map());
  const conteudos: Registo[] = [];
  for (const d of DOCS.values()) {
    if (normal(`${d.chave} ${d.titulo}`).includes(q)) conteudos.push({ chave: d.chave, titulo: d.titulo, pagina: d.pagina });
  }
  for (const g of GRUPOS.values()) {
    for (const i of resolverGrupo(g.grupo, linhas).itens) {
      if (normal(`${i.chave} ${i.titulo}`).includes(q)) conteudos.push({ grupo: g.grupo, item: i.chave, titulo: i.titulo });
    }
  }
  const media = (await ctx.repo.media().catch(() => [])).filter((f) => normal(f.nome).includes(q)).slice(0, 8)
    .map((f) => ({ nome: f.nome, url: f.url, tipo: f.tipo }));
  return {
    registos: encontrados.slice(0, 30), totalRegistos: encontrados.length,
    conteudos: conteudos.slice(0, 15), media,
  };
}
