import "server-only";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA: propostas de mudança
   Cada ferramenta que muda alguma coisa não muda nada: monta um
   plano (as operações exactas, com o antes e o depois de cada
   campo) que o painel mostra para aprovar. Ao aprovar, o plano
   é montado outra vez a partir dos dados actuais e só corre se
   for igual ao que foi visto (a assinatura).

   A validação é a mesma da API de administração e um pouco
   mais: só campos que existem, valores no formato certo,
   ligações para registos que existem e chaves que não colidem.
   ============================================================ */

import { createHash } from "node:crypto";
import type { ColeccaoNome } from "@/lib/admin/store";
import type { Permissao } from "@/lib/admin/types";
import type { Corrida, Piloto, ResultadoCorrida, TipoBilhete } from "@/lib/types";
import { formatKz } from "@/lib/data";
import { eProva } from "@/lib/desporto";
import { DOCS, GRUPOS } from "@/lib/conteudo/registo";
import { resolverDoc, resolverGrupo } from "@/lib/conteudo/resolver";
import { CHAVE_VALIDA } from "@/lib/conteudo/tipos";
import { CHAVE_TABELA } from "@/lib/supabase/mapeamento";
import type { Ligacao, OperacaoVista, CampoDiff } from "./tipos";
import {
  CAMPOS, CAMPOS_DEFINICOES, NOMES, campoDe, coagir, diasEntre, eObjeto, iguais, mostrar, normal,
  paraData, paraResultados, slugify, somarDias, tituloDe,
  type DefCampo, type Referencias, type Registo,
} from "./campos";
import type { Repositorio } from "./repositorio";
import type { Quem } from "./sessao";

/* ---------------- Tipos ---------------- */

export type Op =
  | { tipo: "inserir"; coleccao: ColeccaoNome; registo: Registo; carimbos?: string[] }
  | { tipo: "actualizar"; coleccao: ColeccaoNome; id: string; campos: Registo; nome: string }
  | { tipo: "apagar"; coleccao: ColeccaoNome; id: string; nome: string }
  | { tipo: "publicado"; coleccao: ColeccaoNome; id: string; publicado: boolean; nome: string }
  | { tipo: "definicoes"; campos: Registo }
  | { tipo: "conteudo-doc"; chave: string; titulo: string; dados: unknown }
  | { tipo: "conteudo-item"; grupo: string; item: string; titulo: string; dados: unknown }
  | { tipo: "conteudo-repor"; chave: string; titulo: string }
  | { tipo: "conteudo-item-repor"; grupo: string; item: string; titulo: string; retirar: boolean }
  | { tipo: "responder"; mensagemId: string; resposta: string; para: string; assunto: string };

export interface Plano {
  titulo: string;
  motivo?: string;
  ops: Op[];
  vista: OperacaoVista[];
  avisos: string[];
  destrutiva: boolean;
  ligacoes: Ligacao[];
  /** Cada entrada: pelo menos uma destas permissões. */
  permissoes: Permissao[][];
}

export interface Contexto {
  repo: Repositorio;
  quem: Quem;
  /** AAAA-MM-DD em Luanda. */
  hoje: string;
  temporada: number;
}

/** Erro que volta ao Claude como resultado da ferramenta, para ele corrigir. */
export class ErroFerramenta extends Error {}

function falhar(m: string): never {
  throw new ErroFerramenta(m);
}

/* ---------------- Permissões por coleção ---------------- */

const CONTEUDO: ColeccaoNome[] = [
  "eventos", "pilotos", "equipas", "corridas", "noticias", "videos", "patrocinadores", "clubes", "paginasLegais",
];
const COMUNIDADE: ColeccaoNome[] = ["anuncios", "topicos", "categoriasForum", "denuncias"];

export function permissaoEscrita(c: ColeccaoNome): Permissao[] {
  if (CONTEUDO.includes(c)) return ["conteudo.escrever"];
  if (COMUNIDADE.includes(c)) return ["comunidade.moderar"];
  if (c === "mensagens" || c === "subscritores") return ["comunidade.moderar", "conteudo.escrever"];
  if (c === "encomendas") return ["comercial.escrever"];
  if (c === "utilizadores") return ["utilizadores.escrever"];
  return [];
}

export function permissaoApagar(c: ColeccaoNome): Permissao[] {
  if (CONTEUDO.includes(c)) return ["conteudo.apagar"];
  if (c === "mensagens" || c === "subscritores") return ["comunidade.moderar", "conteudo.apagar"];
  return permissaoEscrita(c);
}

export function permissaoPublicar(c: ColeccaoNome): Permissao[] {
  if (c === "anuncios" || c === "topicos") return ["comunidade.moderar"];
  return ["conteudo.publicar"];
}

export function permissaoLeitura(c: ColeccaoNome): Permissao[] {
  if (c === "anuncios" || c === "topicos" || c === "categoriasForum") return ["conteudo.ler", "comunidade.ler"];
  if (c === "denuncias" || c === "mensagens" || c === "subscritores") return ["comunidade.ler"];
  if (c === "encomendas") return ["comercial.ler"];
  if (c === "utilizadores") return ["utilizadores.ler"];
  return ["conteudo.ler"];
}

/** Coleções com a coluna `publicado` (o site só mostra o que está publicado). */
export const COM_PUBLICADO: ColeccaoNome[] = [...CONTEUDO, "anuncios", "topicos"];

/** Coleções onde o Organizador pode criar registos. */
const CRIAVEIS = Object.keys(CAMPOS).filter((c) => c !== "mensagens" && c !== "denuncias") as ColeccaoNome[];

/** Campos obrigatórios ao criar. */
const OBRIGATORIOS: Partial<Record<ColeccaoNome, string[]>> = {
  eventos: ["titulo", "disciplina", "dataInicio", "provincia"],
  pilotos: ["nome"],
  equipas: ["nome"],
  corridas: ["nome", "data", "categoria"],
  noticias: ["titulo", "corpo"],
  videos: ["titulo"],
  patrocinadores: ["nome"],
  clubes: ["nome"],
  anuncios: ["titulo", "categoria", "preco"],
  topicos: ["titulo", "categoriaSlug"],
  categoriasForum: ["nome"],
  utilizadores: ["nome", "email"],
  encomendas: ["eventoSlug", "tipoBilheteNome", "quantidade", "comprador"],
  subscritores: ["email"],
  paginasLegais: ["titulo"],
};

/** Prefixo dos identificadores gerados nas coleções sem slug. */
const PREFIXO_ID: Partial<Record<ColeccaoNome, string>> = {
  anuncios: "an", topicos: "t", utilizadores: "u", encomendas: "enc", subscritores: "s",
};

/** Valores de partida de um registo novo. */
function modelo(c: ColeccaoNome, ctx: Contexto): Registo {
  const ano = Number(ctx.hoje.slice(0, 4));
  switch (c) {
    case "eventos": return { estado: "agendado", imagem: "", resumo: "", descricao: "", organizador: "MotoBox Angola", horarios: [], bilhetes: [], circuito: "", localidade: "" };
    case "pilotos": return {
      numero: 0, equipa: "", equipaSlug: "", provincia: "Luanda", nacionalidade: "Angolana", idade: 0, mota: "",
      categoria: "MX1", foto: "", bio: "", estreia: ctx.temporada,
      estatisticas: { pontos: 0, vitorias: 0, podios: 0, poles: 0, corridas: 0, melhorResultado: "" }, redes: {}, campeonatos: 0,
    };
    case "equipas": return {
      tipo: "Equipa", base: "", provincia: "Luanda", fundacao: ano, logo: "", cor: "#e10600", chefe: "", membros: 0,
      pilotos: [], descricao: "", motas: [], estatisticas: { pontos: 0, vitorias: 0, podios: 0, titulos: 0 }, redes: {},
    };
    case "corridas": return { eventoSlug: "", ronda: 0, circuito: "", provincia: "Luanda", vencedor: "", imagem: "", resultados: [] };
    case "noticias": return { resumo: "", corpo: [], categoria: "Comunidade", tags: [], autor: "Redação MotoBox", data: ctx.hoje, imagem: "", leitura: 1, destaque: false };
    case "videos": return { descricao: "", duracao: "0:00", data: ctx.hoje, thumbnail: "", categoria: "Highlights", visualizacoes: 0 };
    case "patrocinadores": return { nivel: "Apoio", setor: "", descricao: "", logo: "", website: "", desde: ano };
    case "clubes": return { tipo: "Outro", provincia: "", cidade: "", descricao: "", actividades: [], logo: "", cor: "#e10600", redes: {}, destaque: false };
    case "anuncios": return {
      negociavel: false, marca: "", estado: "Bom", provincia: "Luanda", descricao: "", imagens: [],
      vendedor: { nome: "MotoBox Angola", verificado: true, desde: ano, anuncios: 1, avaliacao: 5 }, publicado: ctx.hoje, visualizacoes: 0,
    };
    case "topicos": return {
      categoria: "", autor: "Equipa MotoBox", autorAvatar: "", avatarCor: "#e10600", respostas: 0, visualizacoes: 0,
      ultimaResposta: { autor: "", quando: "" }, excerto: "",
    };
    case "categoriasForum": return { descricao: "", icone: "chat", topicos: 0, mensagens: 0, cor: "#e10600" };
    case "utilizadores": return { papel: "leitor", estado: "ativo", avatarCor: "#e10600", registado: ctx.hoje, verificado: false, newsletter: false };
    case "encomendas": return { taxa: 0, estado: "pendente", metodo: "Transferência" };
    case "subscritores": return { origem: "manual", ativo: true };
    case "paginasLegais": return { descricao: "", atualizado: ctx.hoje, publicado: false, seccoes: [] };
    default: return {};
  }
}

/** Campos com a hora da gravação, preenchidos ao executar. */
const CARIMBOS: Partial<Record<ColeccaoNome, string[]>> = {
  topicos: ["criado"], encomendas: ["criado"], subscritores: ["subscrito"],
};

/* ---------------- Utilitários ---------------- */

const curto = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Assinatura de um plano: ao aprovar, o plano é montado outra vez e só
 * corre se for igual ao que o administrador viu (as operações, o antes e
 * o depois, os avisos). Se os dados mudaram entretanto, ou se a mesma
 * aprovação chegar duas vezes, a assinatura já não bate certo e nada corre.
 */
export function assinar(p: Plano): string {
  return curto(JSON.stringify({ ops: p.ops, vista: p.vista, avisos: p.avisos, destrutiva: p.destrutiva })).slice(0, 32);
}

export async function referencias(ctx: Contexto): Promise<Referencias> {
  const [equipas, eventos, pilotos, categorias] = await Promise.all([
    ctx.repo.listar("equipas"), ctx.repo.listar("eventos"), ctx.repo.listar("pilotos"), ctx.repo.listar("categoriasForum"),
  ]);
  return {
    equipas: new Map(equipas.map((r) => [String(r.slug), String(r.nome ?? r.slug)])),
    eventos: new Map(eventos.map((r) => [String(r.slug), String(r.titulo ?? r.slug)])),
    pilotos: new Map(pilotos.map((r) => [String(r.slug), String(r.nome ?? r.slug)])),
    categoriasForum: new Map(categorias.map((r) => [String(r.slug), String(r.nome ?? r.slug)])),
  };
}

/** Encontra um registo pela chave exacta, por uma chave parecida ou pelo nome. */
export async function encontrar(ctx: Contexto, c: ColeccaoNome, pedido: string): Promise<Registo | undefined> {
  const lista = await ctx.repo.listar(c);
  const k = CHAVE_TABELA[c];
  const p = pedido.trim();
  const exacto = lista.find((r) => String(r[k]) === p);
  if (exacto) return exacto;
  const alvo = slugify(p);
  const parecido = lista.find((r) => slugify(String(r[k])) === alvo);
  if (parecido) return parecido;
  const porNome = lista.filter((r) => slugify(tituloDe(r)) === alvo);
  return porNome.length === 1 ? porNome[0] : undefined;
}

async function exigir(ctx: Contexto, c: ColeccaoNome, id: string): Promise<Registo> {
  const r = await encontrar(ctx, c, id);
  if (!r) falhar(`Não existe ${NOMES[c].um.toLowerCase()} com o identificador «${id}». Use listar_registos ou procurar para encontrar o certo.`);
  return r as Registo;
}

/** Texto curto de um valor, conforme o tipo do campo. */
export function resumir(def: DefCampo | undefined, v: unknown): string {
  if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return "vazio";
  switch (def?.tipo) {
    case "booleano": return v ? "sim" : "não";
    case "bilhetes":
      return (v as TipoBilhete[]).map((b) => `${b.nome} ${formatKz(b.preco)}${b.disponiveis ? ` (${b.disponiveis} lugares)` : ""}`).join(" · ");
    case "resultados": {
      const r = v as ResultadoCorrida[];
      return r.slice(0, 6).map((x) => `${x.estado ?? `${x.posicao}.º`} ${x.piloto}${x.pontos ? ` ${x.pontos} pts` : ""}`).join(" · ")
        + (r.length > 6 ? ` e mais ${r.length - 6}` : "");
    }
    case "horarios":
      return (v as { dia: string; hora: string; sessao: string }[])
        .map((h) => [h.dia, h.hora, h.sessao].filter(Boolean).join(" ")).join(" · ");
    case "paragrafos": return mostrar((v as unknown[]).join(" "), 260);
    case "lista":
    case "ligacoes": return mostrar((v as unknown[]).join(", "), 220);
    case "objeto":
      return eObjeto(v) ? Object.entries(v).map(([k, x]) => `${k}: ${x === "" ? "vazio" : String(x)}`).join(" · ") : mostrar(v);
    default: return mostrar(v, 220);
  }
}

function diff(campos: Record<string, DefCampo> | undefined, antes: Registo, depois: Registo): CampoDiff[] {
  return Object.keys(depois).map((campo) => {
    const def = campos?.[campo];
    return {
      campo, etiqueta: def?.etiqueta ?? campo,
      antes: resumir(def, antes[campo]),
      depois: resumir(def, depois[campo]),
    };
  });
}

function camposDeCriacao(c: ColeccaoNome, registo: Registo): CampoDiff[] {
  const defs = CAMPOS[c] ?? {};
  return Object.entries(registo)
    .filter(([k, v]) => k in defs && !(v === "" || v === null || (Array.isArray(v) && v.length === 0)))
    .map(([k, v]) => ({ campo: k, etiqueta: defs[k]?.etiqueta ?? k, depois: resumir(defs[k], v) }));
}

/** Ligação para a página do painel que mostra o registo. */
export function ligacaoRegisto(c: ColeccaoNome, id: string, r?: Registo): Ligacao {
  const nome = r ? tituloDe(r) : id;
  const e = encodeURIComponent(id);
  const href = (() => {
    switch (c) {
      case "pilotos": return `/admin/pilotos?editar=${e}`;
      case "equipas": return `/admin/equipas?editar=${e}`;
      case "corridas": return `/admin/corridas?editar=${e}`;
      case "eventos": return r && eProva(String(r.disciplina ?? "")) ? `/admin/provas?editar=${e}` : "/admin/eventos";
      case "noticias": return "/admin/noticias";
      case "clubes": return "/admin/clubes";
      case "anuncios": return "/admin/marketplace";
      case "topicos": return `/admin/forum?topico=${e}`;
      case "categoriasForum": return "/admin/forum";
      case "utilizadores": return "/admin/utilizadores";
      case "encomendas": return "/admin/encomendas";
      case "denuncias": return "/admin/moderacao";
      case "subscritores": return "/admin/newsletter";
      case "mensagens": return "/admin/mensagens";
      case "paginasLegais": return "/admin/legais";
      case "atividade": return "/admin/atividade";
      default: return "/admin/dados";
    }
  })();
  return { rotulo: `${NOMES[c].um}: ${nome}`, href };
}

export function ligacaoConteudo(chave: string, grupo?: string): Ligacao {
  if (grupo) {
    const href = grupo === "rotas" ? "/admin/rotas"
      : grupo === "clubes-perfis" ? "/admin/clubes"
      : grupo === "modalidades" ? "/admin/modalidades"
      : grupo === "eventos-extra" ? "/admin/eventos"
      : "/admin/paginas";
    return { rotulo: `${GRUPOS.get(grupo)?.titulo ?? grupo}: ${chave}`, href };
  }
  const titulo = DOCS.get(chave)?.titulo ?? chave;
  if (chave.startsWith("site.")) return { rotulo: titulo, href: "/admin/site" };
  return { rotulo: titulo, href: `/admin/paginas?doc=${encodeURIComponent(chave)}` };
}

/** Ligações sem repetições. */
const unicas = (l: Ligacao[]) => l.filter((x, i) => l.findIndex((y) => y.href === x.href && y.rotulo === x.rotulo) === i);

/* ---------------- Conversão de vários campos ---------------- */

interface Convertidos { valores: Registo; avisos: string[] }

async function converter(
  ctx: Contexto, c: ColeccaoNome, brutos: Registo, actual: Registo, criar: boolean,
): Promise<Convertidos> {
  const defs = CAMPOS[c];
  if (!defs) falhar(`A coleção ${c} não se altera por aqui.`);
  const campos = defs as Record<string, DefCampo>;
  const refs = await referencias(ctx);
  const valores: Registo = {};
  const avisos: string[] = [];
  const erros: string[] = [];
  const chave = CHAVE_TABELA[c];

  for (const [bruto, v] of Object.entries(brutos)) {
    if (normal(bruto) === normal(chave) || normal(bruto) === "slug" || normal(bruto) === "id") {
      if (criar && typeof v === "string" && v.trim()) { valores[chave] = slugify(v) || v.trim(); continue; }
      if (!criar) { erros.push("o endereço (slug/id) não se muda por aqui; faça-o na ficha do registo."); continue; }
      continue;
    }
    const [cabeca, ...resto] = bruto.trim().split(".");
    const nome = campoDe(campos, cabeca);
    if (!nome) {
      erros.push(`o campo «${bruto}» não existe em ${c}. Campos válidos: ${Object.keys(campos).join(", ")}.`);
      continue;
    }
    const def = campos[nome];
    let valor = v;
    if (resto.length > 0) {
      if (def.tipo !== "objeto") { erros.push(`o campo «${bruto}» não existe.`); continue; }
      valor = { ...(eObjeto(valores[nome]) ? (valores[nome] as Registo) : {}), [resto.join(".")]: v };
    }
    const r = coagir(def, valor, valores[nome] ?? actual[nome], refs);
    if (!r.ok) { erros.push(`${def.etiqueta}: ${r.erro}`); continue; }
    avisos.push(...r.avisos);
    valores[nome] = r.valor;
  }
  if (erros.length) falhar(`Não foi possível preparar a proposta: ${erros.join(" ")}`);
  return { valores, avisos };
}

/* ---------------- Equipas de um piloto ---------------- */

/** Mudanças nas listas de pilotos das equipas quando um piloto entra ou sai. */
async function movimentoEquipa(
  ctx: Contexto, piloto: string, de: string, para: string,
): Promise<{ ops: Op[]; vista: OperacaoVista[] }> {
  const equipas = await ctx.repo.listar("equipas");
  const ops: Op[] = [];
  const vista: OperacaoVista[] = [];
  for (const [slug, entra] of [[de, false], [para, true]] as const) {
    if (!slug || de === para) continue;
    const e = equipas.find((x) => x.slug === slug);
    if (!e) continue;
    const antes = Array.isArray(e.pilotos) ? (e.pilotos as string[]) : [];
    const depois = entra ? (antes.includes(piloto) ? antes : [...antes, piloto]) : antes.filter((p) => p !== piloto);
    if (iguais(undefined, antes, depois)) continue;
    ops.push({ tipo: "actualizar", coleccao: "equipas", id: slug, campos: { pilotos: depois }, nome: String(e.nome) });
    vista.push({
      accao: "alterar", alvo: `Equipa «${String(e.nome)}»`,
      campos: [{ campo: "pilotos", etiqueta: "Pilotos", antes: resumir(CAMPOS.equipas?.pilotos, antes), depois: resumir(CAMPOS.equipas?.pilotos, depois) }],
    });
  }
  return { ops, vista };
}

/* ---------------- Criar ---------------- */

async function chaveLivre(ctx: Contexto, c: ColeccaoNome, base: string): Promise<string> {
  const k = CHAVE_TABELA[c];
  const usados = new Set((await ctx.repo.listar(c)).map((r) => String(r[k])));
  const raiz = slugify(base) || c;
  let s = raiz;
  for (let i = 2; usados.has(s); i++) s = `${raiz}-${i}`;
  return s;
}

export async function planearCriar(
  ctx: Contexto, c: ColeccaoNome, dados: Registo, idChamada: string, motivo?: string,
): Promise<Plano> {
  if (!CRIAVEIS.includes(c)) falhar(`Não se criam ${NOMES[c].varios} pelo Organizador: chegam pelo site.`);
  const { valores, avisos } = await converter(ctx, c, dados, {}, true);
  const registo: Registo = { ...modelo(c, ctx), ...valores };
  const chave = CHAVE_TABELA[c];

  const faltam = (OBRIGATORIOS[c] ?? []).filter((f) => {
    const v = registo[f];
    return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
  });
  if (faltam.length) falhar(`Faltam campos obrigatórios para criar ${NOMES[c].um.toLowerCase()}: ${faltam.join(", ")}. Pergunte ao administrador se não os tiver.`);

  // Chave: slug a partir do nome, ou id gerado a partir da chamada (estável ao aprovar).
  if (chave === "slug") {
    const pedido = typeof registo.slug === "string" && registo.slug ? registo.slug : tituloDe(registo);
    const livre = await chaveLivre(ctx, c, pedido);
    if (typeof registo.slug === "string" && registo.slug && livre !== registo.slug) {
      avisos.push(`O endereço «${registo.slug}» já existe; fica «${livre}».`);
    }
    registo.slug = livre;
  } else {
    registo.id = `${PREFIXO_ID[c] ?? c.slice(0, 2)}-${curto(idChamada).slice(0, 8)}`;
  }

  // Coerências que o painel também faz.
  if (c === "eventos") {
    registo.dataFim = registo.dataFim || registo.dataInicio;
    registo.temporada ??= Number(String(registo.dataInicio).slice(0, 4)) || ctx.temporada;
  }
  if (c === "corridas") {
    registo.temporada ??= Number(String(registo.data).slice(0, 4)) || ctx.temporada;
    const resultados = (registo.resultados as ResultadoCorrida[]) ?? [];
    registo.vencedor ||= resultados.find((r) => r.posicao === 1 && !r.estado)?.piloto ?? "";
  }
  if (c === "noticias") {
    const palavras = (registo.corpo as string[]).join(" ").split(/\s+/).length;
    if (!("leitura" in valores)) registo.leitura = Math.max(1, Math.round(palavras / 200));
  }
  if (c === "encomendas") {
    registo.referencia ||= `MB-${ctx.hoje.slice(0, 4)}-${curto(idChamada).slice(0, 5).toUpperCase()}`;
    registo.codigoQR ||= String(registo.referencia);
    const q = Number(registo.quantidade) || 0;
    const p = Number(registo.precoUnitario) || 0;
    registo.total ??= q * p + (Number(registo.taxa) || 0);
    const ev = await encontrar(ctx, "eventos", String(registo.eventoSlug));
    registo.eventoTitulo ||= ev ? String(ev.titulo) : "";
  }
  if (c === "topicos") {
    const refs = await referencias(ctx);
    registo.categoria ||= refs.categoriasForum.get(String(registo.categoriaSlug)) ?? "";
  }

  const ops: Op[] = [{ tipo: "inserir", coleccao: c, registo, carimbos: CARIMBOS[c] }];
  const vista: OperacaoVista[] = [{ accao: "criar", alvo: `${NOMES[c].um} «${tituloDe(registo)}»`, campos: camposDeCriacao(c, registo) }];

  if (c === "pilotos" && registo.equipaSlug) {
    const refs = await referencias(ctx);
    registo.equipa = refs.equipas.get(String(registo.equipaSlug)) ?? registo.equipa;
    const m = await movimentoEquipa(ctx, String(registo.slug), "", String(registo.equipaSlug));
    ops.push(...m.ops); vista.push(...m.vista);
  }
  if (["pilotos", "equipas", "clubes", "noticias", "eventos"].includes(c)) {
    const img = registo.foto ?? registo.logo ?? registo.imagem;
    if (!img) avisos.push("Sem imagem: pode juntá-la depois (veja listar_media) ou na ficha do registo.");
  }
  // Possível duplicado: mesmo nome já na coleção.
  const iguaisNome = (await ctx.repo.listar(c)).filter((r) => slugify(tituloDe(r)) === slugify(tituloDe(registo)));
  if (iguaisNome.length) avisos.push(`Já existe ${NOMES[c].um.toLowerCase()} com o mesmo nome (${iguaisNome.map((r) => String(r[chave])).join(", ")}). Confirme que não é repetido.`);

  return {
    titulo: `Criar ${NOMES[c].um.toLowerCase()} «${tituloDe(registo)}»`,
    motivo, ops, vista, avisos, destrutiva: false,
    ligacoes: [ligacaoRegisto(c, String(registo[chave]), registo)],
    permissoes: [permissaoEscrita(c)],
  };
}

/* ---------------- Alterar ---------------- */

export async function planearAlterar(
  ctx: Contexto, c: ColeccaoNome, id: string, campos: Registo, motivo?: string,
): Promise<Plano> {
  if (c === "atividade") falhar("O registo de actividade não se altera.");
  const actual = await exigir(ctx, c, id);
  const chave = String(actual[CHAVE_TABELA[c]]);
  if (Object.keys(campos).length === 0) falhar("Indique pelo menos um campo a mudar.");
  const { valores, avisos } = await converter(ctx, c, campos, actual, false);
  const defs = CAMPOS[c] ?? {};

  // Só o que muda de facto.
  const mudancas: Registo = {};
  for (const [k, v] of Object.entries(valores)) {
    if (!iguais(defs[k], actual[k], v)) mudancas[k] = v;
  }

  const ops: Op[] = [];
  const vista: OperacaoVista[] = [];
  const permissoes: Permissao[][] = [permissaoEscrita(c)];
  if ("publicado" in mudancas && COM_PUBLICADO.includes(c) && c !== "anuncios") permissoes.push(permissaoPublicar(c));

  // Consequências que a equipa esperaria sem ter de as pedir.
  if (c === "pilotos" && "equipaSlug" in mudancas) {
    const refs = await referencias(ctx);
    const para = String(mudancas.equipaSlug ?? "");
    mudancas.equipa = para ? refs.equipas.get(para) ?? "" : "";
    const m = await movimentoEquipa(ctx, chave, String(actual.equipaSlug ?? ""), para);
    ops.push(...m.ops); vista.push(...m.vista);
  }
  if (c === "eventos") {
    const inicioAntes = paraData(actual.dataInicio);
    const fimAntes = paraData(actual.dataFim);
    if ("dataInicio" in mudancas && !("dataFim" in mudancas) && inicioAntes && fimAntes) {
      const novoFim = somarDias(String(mudancas.dataInicio), Math.max(0, diasEntre(inicioAntes, fimAntes)));
      if (!iguais(defs.dataFim, actual.dataFim, novoFim)) {
        mudancas.dataFim = novoFim;
        avisos.push("A data de fim foi ajustada para manter a duração do evento.");
      }
    }
    const ini = paraData(mudancas.dataInicio ?? actual.dataInicio);
    const fim = paraData(mudancas.dataFim ?? actual.dataFim);
    if (ini && fim && fim < ini) falhar("A data de fim ficaria antes da data de início.");
    const ano = Number(ini?.slice(0, 4));
    if ("dataInicio" in mudancas && ano && !("temporada" in mudancas) && actual.temporada !== ano
      && actual.temporada === Number(inicioAntes?.slice(0, 4))) {
      mudancas.temporada = ano;
      avisos.push(`A temporada passa para ${ano} por causa da nova data.`);
    }
  }
  if (c === "corridas" && "resultados" in mudancas && !("vencedor" in mudancas)) {
    const primeiro = (mudancas.resultados as ResultadoCorrida[]).find((r) => r.posicao === 1 && !r.estado);
    const vencedor = primeiro?.piloto ?? "";
    if (vencedor !== actual.vencedor) mudancas.vencedor = vencedor;
    avisos.push("As estatísticas dos pilotos não mudam sozinhas: use publicar_resultados ou recalcular_estatisticas para as acertar.");
  }
  for (const [k, v] of Object.entries(mudancas)) {
    const antes = actual[k];
    if (Array.isArray(antes) && Array.isArray(v) && v.length < antes.length) {
      avisos.push(`${defs[k]?.etiqueta ?? k}: a lista nova tem ${v.length} de ${antes.length} elementos. Confirme que nada se perde.`);
    }
  }

  if (Object.keys(mudancas).length === 0) {
    falhar(`Nada a mudar em «${tituloDe(actual)}»: os valores pedidos já são os actuais.`);
  }
  ops.unshift({ tipo: "actualizar", coleccao: c, id: chave, campos: mudancas, nome: tituloDe(actual) });
  vista.unshift({ accao: "alterar", alvo: `${NOMES[c].um} «${tituloDe(actual)}»`, campos: diff(defs, actual, mudancas) });

  return {
    titulo: `Alterar ${NOMES[c].um.toLowerCase()} «${tituloDe(actual)}»`,
    motivo, ops, vista, avisos, destrutiva: false,
    ligacoes: [ligacaoRegisto(c, chave, actual)], permissoes,
  };
}

/* ---------------- Apagar ---------------- */

async function avisosRemocao(ctx: Contexto, c: ColeccaoNome, slug: string, r: Registo): Promise<string[]> {
  const avisos: string[] = [];
  if (c === "eventos") {
    const corridas = (await ctx.repo.listar("corridas")).filter((x) => x.eventoSlug === slug).length;
    if (corridas) avisos.push(`${corridas} resultado(s) ligado(s) a este evento ficam sem evento.`);
    if (Array.isArray(r.bilhetes) && r.bilhetes.length > 0) avisos.push("O evento tem bilhetes: avise quem já comprou antes de o apagar.");
    const encomendas = (await ctx.repo.listar("encomendas").catch(() => [])).filter((x) => x.eventoSlug === slug).length;
    if (encomendas) avisos.push(`Há ${encomendas} encomenda(s) de bilhetes para este evento.`);
  }
  if (c === "pilotos") {
    const equipas = (await ctx.repo.listar("equipas")).filter((e) => Array.isArray(e.pilotos) && (e.pilotos as string[]).includes(slug));
    if (equipas.length) avisos.push(`Continua na lista de pilotos de ${equipas.map((e) => String(e.nome)).join(", ")}.`);
  }
  if (c === "equipas") {
    const pilotos = (await ctx.repo.listar("pilotos")).filter((p) => p.equipaSlug === slug);
    if (pilotos.length) avisos.push(`${pilotos.map((p) => String(p.nome)).join(", ")} fica(m) sem equipa ligada.`);
  }
  avisos.push("Apagar não se desfaz.");
  return avisos;
}

export async function planearApagar(ctx: Contexto, c: ColeccaoNome, id: string, motivo?: string): Promise<Plano> {
  if (c === "atividade") falhar("O registo de actividade não se apaga.");
  const actual = await exigir(ctx, c, id);
  const chave = String(actual[CHAVE_TABELA[c]]);
  const defs = CAMPOS[c] ?? {};
  const resumo = Object.entries(actual)
    .filter(([k, v]) => k in defs && v !== "" && v !== null && !(Array.isArray(v) && v.length === 0))
    .slice(0, 6)
    .map(([k, v]) => ({ campo: k, etiqueta: defs[k]?.etiqueta ?? k, antes: resumir(defs[k], v) }));
  return {
    titulo: `Apagar ${NOMES[c].um.toLowerCase()} «${tituloDe(actual)}»`,
    motivo,
    ops: [{ tipo: "apagar", coleccao: c, id: chave, nome: tituloDe(actual) }],
    vista: [{ accao: "apagar", alvo: `${NOMES[c].um} «${tituloDe(actual)}»`, detalhe: `Identificador: ${chave}`, campos: resumo }],
    avisos: await avisosRemocao(ctx, c, chave, actual),
    destrutiva: true,
    ligacoes: [ligacaoRegisto(c, chave, actual)],
    permissoes: [permissaoApagar(c)],
  };
}

/* ---------------- Publicar / esconder ---------------- */

export async function planearPublicar(
  ctx: Contexto, c: ColeccaoNome, id: string, publicado: boolean, motivo?: string,
): Promise<Plano> {
  if (!COM_PUBLICADO.includes(c)) falhar(`${NOMES[c].varios} não têm estado de publicação. Coleções com publicação: ${COM_PUBLICADO.join(", ")}.`);
  const actual = await exigir(ctx, c, id);
  const chave = String(actual[CHAVE_TABELA[c]]);
  const agora = await ctx.repo.estaPublicado(c, chave);
  if (agora === publicado) falhar(`«${tituloDe(actual)}» já está ${publicado ? "publicado" : "escondido"}.`);
  return {
    titulo: `${publicado ? "Publicar" : "Esconder do site"} ${NOMES[c].um.toLowerCase()} «${tituloDe(actual)}»`,
    motivo,
    ops: [{ tipo: "publicado", coleccao: c, id: chave, publicado, nome: tituloDe(actual) }],
    vista: [{
      accao: publicado ? "publicar" : "esconder", alvo: `${NOMES[c].um} «${tituloDe(actual)}»`,
      campos: [{ campo: "publicado", etiqueta: "Visível no site", antes: agora === null ? "?" : agora ? "sim" : "não", depois: publicado ? "sim" : "não" }],
    }],
    avisos: publicado ? [] : ["Fica guardado no painel; pode voltar a publicá-lo quando quiser."],
    destrutiva: false,
    ligacoes: [ligacaoRegisto(c, chave, actual)],
    permissoes: [permissaoPublicar(c)],
  };
}

/* ---------------- Destacar artigo ---------------- */

export async function planearDestacar(ctx: Contexto, slug: string, destaque: boolean, motivo?: string): Promise<Plano> {
  const artigo = await exigir(ctx, "noticias", slug);
  const chave = String(artigo.slug);
  const ops: Op[] = [];
  const vista: OperacaoVista[] = [];
  const def = CAMPOS.noticias?.destaque;
  if (Boolean(artigo.destaque) !== destaque) {
    ops.push({ tipo: "actualizar", coleccao: "noticias", id: chave, campos: { destaque }, nome: tituloDe(artigo) });
    vista.push({ accao: "alterar", alvo: `Artigo «${tituloDe(artigo)}»`, campos: [{ campo: "destaque", etiqueta: "Em destaque", antes: resumir(def, Boolean(artigo.destaque)), depois: resumir(def, destaque) }] });
  }
  if (destaque) {
    for (const outro of await ctx.repo.listar("noticias")) {
      if (outro.slug === chave || !outro.destaque) continue;
      ops.push({ tipo: "actualizar", coleccao: "noticias", id: String(outro.slug), campos: { destaque: false }, nome: tituloDe(outro) });
      vista.push({ accao: "alterar", alvo: `Artigo «${tituloDe(outro)}»`, campos: [{ campo: "destaque", etiqueta: "Em destaque", antes: "sim", depois: "não" }] });
    }
  }
  if (ops.length === 0) falhar(`«${tituloDe(artigo)}» já ${destaque ? "é o único artigo em destaque" : "não está em destaque"}.`);
  const avisos: string[] = [];
  if (artigo.publicado === false) avisos.push("Este artigo não está publicado: em destaque só aparece depois de publicado.");
  return {
    titulo: destaque ? `Pôr «${tituloDe(artigo)}» em destaque` : `Tirar «${tituloDe(artigo)}» do destaque`,
    motivo, ops, vista, avisos, destrutiva: false,
    ligacoes: [ligacaoRegisto("noticias", chave, artigo), { rotulo: "Painel Explorar", href: "/admin/site" }],
    permissoes: [["conteudo.publicar"]],
  };
}

/* ---------------- Definições ---------------- */

export async function planearDefinicoes(ctx: Contexto, campos: Registo, motivo?: string): Promise<Plano> {
  const actual = await ctx.repo.lerDefinicoes();
  const valores: Registo = {};
  const erros: string[] = [];
  const refs = await referencias(ctx);
  for (const [k, v] of Object.entries(campos)) {
    const nome = campoDe(CAMPOS_DEFINICOES, k);
    if (!nome) { erros.push(`«${k}» não existe nas Definições (válidos: ${Object.keys(CAMPOS_DEFINICOES).join(", ")}).`); continue; }
    const r = coagir(CAMPOS_DEFINICOES[nome], v, actual[nome], refs);
    if (!r.ok) { erros.push(`${CAMPOS_DEFINICOES[nome].etiqueta}: ${r.erro}`); continue; }
    if (nome === "temporada" && (Number(r.valor) < 2000 || Number(r.valor) > 2100)) { erros.push("A temporada tem de ser um ano entre 2000 e 2100."); continue; }
    if (!iguais(CAMPOS_DEFINICOES[nome], actual[nome], r.valor)) valores[nome] = r.valor;
  }
  if (erros.length) falhar(erros.join(" "));
  if (Object.keys(valores).length === 0) falhar("Nada a mudar: as Definições já têm esses valores.");
  const avisos: string[] = [];
  if (valores.manutencao === true) avisos.push("Com a manutenção ligada, o site público fica fechado aos visitantes.");
  if ("temporada" in valores) avisos.push("A temporada muda o calendário, a classificação e os resultados mostrados no site.");
  return {
    titulo: "Alterar as Definições",
    motivo,
    ops: [{ tipo: "definicoes", campos: valores }],
    vista: [{ accao: "definicoes", alvo: "Definições do site", campos: diff(CAMPOS_DEFINICOES, actual, valores) }],
    avisos, destrutiva: false,
    ligacoes: [{ rotulo: "Definições", href: "/admin/definicoes" }],
    permissoes: [["definicoes.escrever"]],
  };
}

/* ---------------- Conteúdo editável ---------------- */

/** Junta a todos os níveis dos objectos; as listas novas substituem as antigas. */
export function fundirProfundo(base: unknown, novo: unknown): unknown {
  if (eObjeto(base) && eObjeto(novo)) {
    const saida: Registo = { ...base };
    for (const [k, v] of Object.entries(novo)) saida[k] = k in base ? fundirProfundo(base[k], v) : v;
    return saida;
  }
  return novo;
}

function tipoDe(v: unknown): string {
  return Array.isArray(v) ? "lista" : v === null ? "vazio" : typeof v === "object" ? "objecto" : typeof v;
}

/** Diferenças no primeiro (e segundo) nível de dois documentos. */
function diffDocumento(antes: unknown, depois: unknown, prefixo = "", nivel = 0): CampoDiff[] {
  if (!eObjeto(antes) || !eObjeto(depois)) {
    return JSON.stringify(antes) === JSON.stringify(depois) ? [] : [{ campo: prefixo || "dados", etiqueta: prefixo || "Conteúdo", antes: mostrar(antes, 220), depois: mostrar(depois, 220) }];
  }
  const saida: CampoDiff[] = [];
  for (const k of new Set([...Object.keys(antes), ...Object.keys(depois)])) {
    const a = antes[k];
    const d = depois[k];
    if (JSON.stringify(a) === JSON.stringify(d)) continue;
    const nome = prefixo ? `${prefixo}.${k}` : k;
    if (nivel < 1 && eObjeto(a) && eObjeto(d)) saida.push(...diffDocumento(a, d, nome, nivel + 1));
    else saida.push({ campo: nome, etiqueta: nome, antes: mostrar(a, 220), depois: mostrar(d, 220) });
  }
  return saida;
}

/** Compara a forma com a de partida: tipos diferentes no primeiro nível não se aceitam. */
function verificarForma(padrao: unknown, novo: unknown, avisos: string[]) {
  if (!eObjeto(padrao)) return;
  if (!eObjeto(novo)) falhar(`O conteúdo tem de ser um objecto com as chaves ${Object.keys(padrao).join(", ")}.`);
  for (const [k, v] of Object.entries(novo as Registo)) {
    if (!(k in padrao)) { avisos.push(`«${k}» não existe neste conteúdo e o site pode ignorá-lo.`); continue; }
    const p = padrao[k];
    if (p !== null && v !== null && tipoDe(p) !== tipoDe(v)) {
      falhar(`«${k}» tem de ser ${tipoDe(p)} (veio ${tipoDe(v)}). Leia o conteúdo com ler_conteudo para ver a forma.`);
    }
  }
}

export async function planearConteudo(
  ctx: Contexto,
  e: { chave?: string; grupo?: string; item?: string; dados: unknown; modo?: "juntar" | "substituir"; titulo?: string },
  motivo?: string,
): Promise<Plano> {
  const linhas = await ctx.repo.conteudoLinhas();
  const modo = e.modo ?? "juntar";
  const avisos: string[] = [];

  if (e.grupo) {
    const def = GRUPOS.get(e.grupo);
    if (!def) falhar(`Grupo desconhecido: ${e.grupo}. Use listar_conteudos.`);
    const item = (e.item ?? e.chave ?? "").trim();
    if (!item || !CHAVE_VALIDA.test(item)) falhar("O item precisa de um endereço só com letras minúsculas, números e hífenes (ex.: serra-da-leba).");
    const grupo = resolverGrupo(e.grupo, linhas);
    const existente = grupo.itens.find((i) => i.chave === item);
    const base = existente?.dados ?? grupo.itens[0]?.dados;
    if (!existente) avisos.push(`«${item}» é um item novo em ${def!.titulo}. Confirme que tem todos os campos que o site precisa.`);
    const dados = modo === "juntar" ? fundirProfundo(existente?.dados ?? {}, e.dados) : e.dados;
    verificarForma(base, dados, avisos);
    const mudancas = diffDocumento(existente?.dados ?? {}, dados);
    if (mudancas.length === 0) falhar("Nada a mudar: o conteúdo já é este.");
    const titulo = e.titulo || (eObjeto(dados) ? String(dados.nome ?? dados.titulo ?? existente?.titulo ?? item) : existente?.titulo ?? item);
    return {
      titulo: `${existente ? "Alterar" : "Criar"} «${titulo}» em ${def!.titulo}`,
      motivo,
      ops: [{ tipo: "conteudo-item", grupo: e.grupo, item, titulo, dados }],
      vista: [{ accao: "conteudo", alvo: `${def!.titulo} · ${titulo}`, campos: mudancas.slice(0, 30) }],
      avisos, destrutiva: false,
      ligacoes: [ligacaoConteudo(item, e.grupo)],
      permissoes: [["conteudo.escrever"]],
    };
  }

  const chave = (e.chave ?? "").trim();
  const def = DOCS.get(chave);
  if (!def) falhar(`Documento desconhecido: «${chave}». Use listar_conteudos para ver as chaves.`);
  const actual = resolverDoc(chave, linhas);
  const dados = modo === "juntar" ? fundirProfundo(actual.dados, e.dados) : e.dados;
  verificarForma(def!.padrao(), dados, avisos);
  const mudancas = diffDocumento(actual.dados, dados);
  if (mudancas.length === 0) falhar("Nada a mudar: o documento já tem este conteúdo.");
  return {
    titulo: `Alterar «${def!.titulo}»`,
    motivo,
    ops: [{ tipo: "conteudo-doc", chave, titulo: e.titulo || actual.titulo || def!.titulo, dados }],
    vista: [{ accao: "conteudo", alvo: def!.titulo, detalhe: def!.pagina ? `Página: ${def!.pagina}` : undefined, campos: mudancas.slice(0, 30) }],
    avisos, destrutiva: false,
    ligacoes: [ligacaoConteudo(chave)],
    permissoes: [["conteudo.escrever"]],
  };
}

export async function planearRepor(
  ctx: Contexto, e: { chave?: string; grupo?: string; item?: string; retirar?: boolean }, motivo?: string,
): Promise<Plano> {
  const linhas = await ctx.repo.conteudoLinhas();
  if (e.grupo) {
    const def = GRUPOS.get(e.grupo);
    if (!def) falhar(`Grupo desconhecido: ${e.grupo}.`);
    const item = (e.item ?? e.chave ?? "").trim();
    const actual = resolverGrupo(e.grupo, linhas).itens.find((i) => i.chave === item);
    if (!actual) falhar(`Não existe «${item}» em ${def!.titulo}.`);
    const original = def!.padrao().some((p) => p.chave === item);
    if (!e.retirar && actual!.origem !== "base") falhar(`«${actual!.titulo}» já está como no original.`);
    const retirar = Boolean(e.retirar);
    return {
      titulo: retirar ? `Retirar «${actual!.titulo}» de ${def!.titulo}` : `Repor «${actual!.titulo}» como no original`,
      motivo,
      ops: [{ tipo: "conteudo-item-repor", grupo: e.grupo, item, titulo: actual!.titulo, retirar }],
      vista: [{
        accao: retirar ? "apagar" : "repor", alvo: `${def!.titulo} · ${actual!.titulo}`,
        detalhe: retirar ? "Sai do site (e da lista do grupo)." : original ? "Volta ao texto de partida; as edições perdem-se." : "Não tem versão de partida: deixa de aparecer no site.",
      }],
      avisos: ["Não se desfaz: as edições gravadas perdem-se."],
      destrutiva: true,
      ligacoes: [ligacaoConteudo(item, e.grupo)],
      permissoes: [["conteudo.escrever"]],
    };
  }
  const chave = (e.chave ?? "").trim();
  const def = DOCS.get(chave);
  if (!def) falhar(`Documento desconhecido: «${chave}».`);
  const actual = resolverDoc(chave, linhas);
  if (actual.origem !== "base") falhar(`«${def!.titulo}» já está como no original.`);
  return {
    titulo: `Repor «${def!.titulo}» como no original`,
    motivo,
    ops: [{ tipo: "conteudo-repor", chave, titulo: def!.titulo }],
    vista: [{ accao: "repor", alvo: def!.titulo, detalhe: "Volta ao conteúdo de partida; as edições gravadas perdem-se." }],
    avisos: ["Não se desfaz."],
    destrutiva: true,
    ligacoes: [ligacaoConteudo(chave)],
    permissoes: [["conteudo.escrever"]],
  };
}

/* ---------------- Em foco (painel da entrada) ---------------- */

/** Onde vive o mosaico «Em foco»: um documento próprio ou uma chave de outro. */
export function localEmFoco(): { chave: string; subchave?: string } | null {
  for (const d of DOCS.values()) {
    if (/foco/i.test(d.chave) || /em foco/i.test(d.titulo)) return { chave: d.chave };
  }
  for (const d of DOCS.values()) {
    const padrao = d.padrao();
    if (eObjeto(padrao)) {
      const k = Object.keys(padrao).find((x) => /foco/i.test(x));
      if (k) return { chave: d.chave, subchave: k };
    }
  }
  return null;
}

export interface EntradaEmFoco {
  tipo?: string;
  item?: string;
  sobretitulo?: string; titulo?: string; subtitulo?: string; foto?: string;
  textoLigacao?: string; ligacao?: string; data?: string;
  activa?: boolean;
  /** Mantém os textos escritos à mão em vez de os limpar ao mudar de item. */
  manterTextos?: boolean;
  /** Para uma forma de documento diferente: as chaves a juntar. */
  dados?: Registo;
}

/** Tipos com data, onde a contagem decrescente faz sentido. */
const FOCO_COM_DATA = ["evento", "prova", "personalizado"];
const TEXTOS_FOCO = ["sobretitulo", "titulo", "subtitulo", "foto", "textoLigacao", "ligacao", "data"] as const;

/** Confirma que o item escolhido existe (e acerta evento/prova). */
async function itemEmFoco(ctx: Contexto, tipo: string, item: string): Promise<{ tipo: string; item: string; nome: string; avisos: string[] }> {
  const avisos: string[] = [];
  const linhas = () => ctx.repo.conteudoLinhas();
  if (tipo === "evento" || tipo === "prova") {
    const ev = await exigir(ctx, "eventos", item);
    const certo = eProva(String(ev.disciplina ?? "")) ? "prova" : "evento";
    if (certo !== tipo) avisos.push(`«${tituloDe(ev)}» é ${certo === "prova" ? "uma prova de Desporto" : "um evento da comunidade"}: fica em foco como ${certo}.`);
    if (String(ev.dataFim || ev.dataInicio).slice(0, 10) < ctx.hoje) avisos.push("Este evento já passou: o painel passa sozinho ao próximo.");
    if (ev.publicado === false) avisos.push("Este evento não está publicado: o painel não o mostra.");
    return { tipo: certo, item: String(ev.slug), nome: tituloDe(ev), avisos };
  }
  if (tipo === "artigo") { const n = await exigir(ctx, "noticias", item); return { tipo, item: String(n.slug), nome: tituloDe(n), avisos }; }
  if (tipo === "clube") { const c = await exigir(ctx, "clubes", item); return { tipo, item: String(c.slug), nome: tituloDe(c), avisos }; }
  if (tipo === "anuncio") { const a = await exigir(ctx, "anuncios", item); return { tipo, item: String(a.id), nome: tituloDe(a), avisos }; }
  if (tipo === "rota" || tipo === "modalidade") {
    const grupo = tipo === "rota" ? "rotas" : "modalidades";
    const itens = resolverGrupo(grupo, await linhas()).itens;
    const alvo = slugify(item);
    const r = itens.find((i) => i.chave === item) ?? itens.find((i) => i.chave === alvo)
      ?? itens.find((i) => slugify(i.titulo) === alvo || slugify(i.titulo).includes(alvo));
    if (!r) falhar(`Não existe ${tipo === "rota" ? "a rota" : "a modalidade"} «${item}». Opções: ${itens.map((i) => i.chave).join(", ")}.`);
    return { tipo, item: r!.chave, nome: r!.titulo, avisos };
  }
  return { tipo, item, nome: item, avisos };
}

export async function planearEmFoco(ctx: Contexto, e: EntradaEmFoco, motivo?: string): Promise<Plano> {
  const local = localEmFoco();
  if (!local) falhar("Esta versão do site ainda não tem o mosaico «Em foco» editável. Diga ao administrador; como alternativa, use destacar_artigo para o artigo em destaque.");
  const padrao = DOCS.get(local!.chave)?.padrao();
  const base = local!.subchave && eObjeto(padrao) ? padrao[local!.subchave] : padrao;

  // Forma conhecida: { tipo, item, textos que mandam sobre os do item, automaticos }.
  if (eObjeto(base) && "tipo" in base && "item" in base && eObjeto(base.automaticos) && e.tipo) {
    const tipos = Object.keys(base.automaticos);
    const pedido = normal(e.tipo);
    const tipo = tipos.find((t) => normal(t) === pedido) ?? falhar(`Tipo desconhecido: «${e.tipo}». Tipos: ${tipos.join(", ")}.`);
    if (!e.item && tipo !== "personalizado") falhar("Indique o item (slug do evento, da rota, do artigo, do clube…) que fica em foco.");
    const escolhido = e.item ? await itemEmFoco(ctx, tipo, e.item) : { tipo, item: "", nome: e.titulo ?? "Personalizado", avisos: [] as string[] };
    const dados: Registo = { tipo: escolhido.tipo, item: escolhido.item };
    for (const k of TEXTOS_FOCO) {
      // Ao mudar de item, os textos antigos (de outro item) saem, para valerem os do item novo.
      if (e[k] !== undefined) dados[k] = e[k];
      else if (!e.manterTextos) dados[k] = "";
    }
    dados.activa = e.activa ?? FOCO_COM_DATA.includes(escolhido.tipo);
    const conteudo = local!.subchave ? { [local!.subchave]: dados } : dados;
    const plano = await planearConteudo(ctx, { chave: local!.chave, dados: conteudo, modo: "juntar" }, motivo);
    if (tipo === "personalizado" && !e.titulo) plano.avisos.push("Num foco personalizado convém escrever o título, a linha e a ligação.");
    return {
      ...plano,
      titulo: `Pôr em foco: ${escolhido.nome}`,
      avisos: [...escolhido.avisos, ...plano.avisos],
      ligacoes: [{ rotulo: "Em foco (Entrada e painel)", href: "/admin/site?aba=contagem" }],
    };
  }

  // Outra forma: junta as chaves pedidas.
  if (!e.dados) falhar("Leia o conteúdo «Em foco» com ler_conteudo e passe em «dados» as chaves a mudar.");
  const dados = local!.subchave ? { [local!.subchave]: e.dados } : e.dados;
  const plano = await planearConteudo(ctx, { chave: local!.chave, dados, modo: "juntar" }, motivo);
  return { ...plano, titulo: `Mudar o que está «Em foco» (${plano.titulo.replace(/^Alterar /, "")})` };
}

/* ---------------- Evento com bilhetes ---------------- */

export interface EntradaEvento {
  titulo: string; disciplina: string; dataInicio: string; dataFim?: string; provincia: string;
  localidade?: string; circuito?: string; resumo?: string; descricao?: string; organizador?: string;
  horarios?: { dia: string; hora: string; sessao: string }[];
  bilhetes?: { nome: string; preco: number | string; descricao?: string; disponiveis?: number; beneficios?: string[]; destaque?: boolean }[];
  entrada?: string; ronda?: number; estado?: string; imagem?: string; publicado?: boolean;
}

export async function planearEvento(ctx: Contexto, e: EntradaEvento, idChamada: string, motivo?: string): Promise<Plano> {
  const dados: Registo = { ...e };
  delete dados.publicado;
  if (e.bilhetes?.length) dados.bilhetes = e.bilhetes;
  if (!dados.estado) dados.estado = e.bilhetes?.length ? "bilhetes-abertos" : "agendado";
  if (e.publicado === false) dados.publicado = false;
  const plano = await planearCriar(ctx, "eventos", dados, idChamada, motivo);
  const registo = (plano.ops[0] as Extract<Op, { tipo: "inserir" }>).registo;

  const inicio = String(registo.dataInicio);
  if (inicio < ctx.hoje) plano.avisos.push(`A data de início (${inicio}) já passou.`);
  if (!(registo.bilhetes as TipoBilhete[]).length && !registo.entrada) {
    plano.avisos.push("Sem bilhetes nem indicação de entrada: diga como se participa (ex.: «Entrada livre»).");
  }
  const mesmoDia = (await ctx.repo.listar("eventos")).filter((x) => String(x.dataInicio).slice(0, 10) === inicio && x.slug !== registo.slug);
  if (mesmoDia.length) plano.avisos.push(`No mesmo dia já há: ${mesmoDia.map((x) => String(x.titulo)).join(", ")}.`);
  const bilheteira = await ctx.repo.lerDefinicoes().catch(() => ({} as Registo));
  if ((registo.bilhetes as TipoBilhete[]).length && bilheteira.bilheteiraAberta === false) {
    plano.avisos.push("A bilheteira está fechada nas Definições: os bilhetes só se vendem depois de a abrir.");
  }
  plano.titulo = `Criar o evento «${String(registo.titulo)}»`;
  plano.ligacoes.push({ rotulo: "Bilheteira", href: "/admin/bilheteira" });
  return plano;
}

/* ---------------- Resultados e estatísticas ---------------- */

export const PONTOS_MUNDIAL = [25, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

interface Contributo { pontos: number; vitorias: number; podios: number; corridas: number; melhor: number | null }
const ZERO = (): Contributo => ({ pontos: 0, vitorias: 0, podios: 0, corridas: 0, melhor: null });

/** O que uma lista de resultados soma às estatísticas de cada piloto. */
function contributos(resultados: ResultadoCorrida[]): Map<string, Contributo> {
  const m = new Map<string, Contributo>();
  for (const r of resultados) {
    if (!r.pilotoSlug) continue;
    const c = m.get(r.pilotoSlug) ?? ZERO();
    if (r.estado !== "DNS") c.corridas += 1;
    c.pontos += Number(r.pontos) || 0;
    if (!r.estado && r.posicao >= 1) {
      if (r.posicao === 1) c.vitorias += 1;
      if (r.posicao <= 3) c.podios += 1;
      c.melhor = c.melhor === null ? r.posicao : Math.min(c.melhor, r.posicao);
    }
    m.set(r.pilotoSlug, c);
  }
  return m;
}

const melhorDe = (s: unknown): number | null => {
  const n = parseInt(String(s ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

interface Estat { pontos: number; vitorias: number; podios: number; poles: number; corridas: number; melhorResultado: string }

function estatDe(p: Registo): Estat {
  const e = eObjeto(p.estatisticas) ? p.estatisticas : {};
  return {
    pontos: Number(e.pontos) || 0, vitorias: Number(e.vitorias) || 0, podios: Number(e.podios) || 0,
    poles: Number(e.poles) || 0, corridas: Number(e.corridas) || 0, melhorResultado: String(e.melhorResultado ?? ""),
  };
}

/** Operações para levar as estatísticas de pilotos e equipas aos valores novos. */
async function opsEstatisticas(
  ctx: Contexto, novas: Map<string, Estat>,
): Promise<{ ops: Op[]; vista: OperacaoVista[]; avisos: string[] }> {
  const pilotos = await ctx.repo.listar("pilotos");
  const equipas = await ctx.repo.listar("equipas");
  const ops: Op[] = [];
  const vista: OperacaoVista[] = [];
  const avisos: string[] = [];
  const deltaEquipa = new Map<string, { pontos: number; vitorias: number; podios: number }>();
  const def = CAMPOS.pilotos?.estatisticas;

  for (const [slug, depois] of novas) {
    const p = pilotos.find((x) => x.slug === slug);
    if (!p) continue;
    const antes = estatDe(p);
    if (iguais(def, antes, depois)) continue;
    ops.push({ tipo: "actualizar", coleccao: "pilotos", id: slug, campos: { estatisticas: depois }, nome: String(p.nome) });
    vista.push({
      accao: "alterar", alvo: `Piloto «${String(p.nome)}»`,
      campos: [{ campo: "estatisticas", etiqueta: "Estatísticas", antes: `${antes.pontos} pts, ${antes.vitorias} vit., ${antes.podios} pód., ${antes.corridas} corr.`, depois: `${depois.pontos} pts, ${depois.vitorias} vit., ${depois.podios} pód., ${depois.corridas} corr.` }],
    });
    const eq = String(p.equipaSlug ?? "");
    if (eq) {
      const d = deltaEquipa.get(eq) ?? { pontos: 0, vitorias: 0, podios: 0 };
      d.pontos += depois.pontos - antes.pontos;
      d.vitorias += depois.vitorias - antes.vitorias;
      d.podios += depois.podios - antes.podios;
      deltaEquipa.set(eq, d);
    }
    if (depois.pontos < antes.pontos) avisos.push(`${String(p.nome)} desce de ${antes.pontos} para ${depois.pontos} pontos.`);
  }
  for (const [slug, d] of deltaEquipa) {
    const e = equipas.find((x) => x.slug === slug);
    if (!e || (d.pontos === 0 && d.vitorias === 0 && d.podios === 0)) continue;
    const antes = eObjeto(e.estatisticas) ? e.estatisticas : {};
    const depois = {
      pontos: Math.max(0, (Number(antes.pontos) || 0) + d.pontos),
      vitorias: Math.max(0, (Number(antes.vitorias) || 0) + d.vitorias),
      podios: Math.max(0, (Number(antes.podios) || 0) + d.podios),
      titulos: Number(antes.titulos) || 0,
    };
    ops.push({ tipo: "actualizar", coleccao: "equipas", id: slug, campos: { estatisticas: depois }, nome: String(e.nome) });
    vista.push({
      accao: "alterar", alvo: `Equipa «${String(e.nome)}»`,
      campos: [{ campo: "estatisticas", etiqueta: "Estatísticas", antes: `${Number(antes.pontos) || 0} pts`, depois: `${depois.pontos} pts` }],
    });
  }
  return { ops, vista, avisos };
}

export interface EntradaResultados {
  corrida?: string;
  eventoSlug?: string; nome?: string; categoria?: string; data?: string; ronda?: number;
  circuito?: string; provincia?: string;
  resultados: Registo[];
  pontos?: "indicados" | "mundial";
  actualizarEstatisticas?: boolean;
  concluirEvento?: boolean;
}

export async function planearResultados(ctx: Contexto, e: EntradaResultados, idChamada: string, motivo?: string): Promise<Plano> {
  const refs = await referencias(ctx);
  const conv = paraResultados(e.resultados, refs.pilotos);
  if (!conv.ok) falhar(`Resultados: ${conv.erro}`);
  let resultados = (conv as { valor: ResultadoCorrida[] }).valor;
  const avisos = [...(conv as { avisos: string[] }).avisos];
  if (resultados.length === 0) falhar("Faltam os resultados.");
  if (e.pontos === "mundial") {
    resultados = resultados.map((r) => ({ ...r, pontos: r.estado || r.posicao < 1 ? 0 : PONTOS_MUNDIAL[r.posicao - 1] ?? 0 }));
  } else if (resultados.every((r) => !r.pontos)) {
    avisos.push("Nenhum resultado traz pontos. Se o campeonato usa a tabela do Mundial (25, 22, 20…), peça pontos «mundial».");
  }
  const posicoes = resultados.filter((r) => !r.estado).map((r) => r.posicao);
  if (new Set(posicoes).size !== posicoes.length) avisos.push("Há posições repetidas nos resultados.");
  // Equipa: a da ficha do piloto, quando não vem.
  const pilotos = await ctx.repo.listar("pilotos");
  resultados = resultados.map((r) => (r.equipa ? r : { ...r, equipa: String(pilotos.find((p) => p.slug === r.pilotoSlug)?.equipa ?? "") }));

  const ops: Op[] = [];
  const vista: OperacaoVista[] = [];
  const ligacoes: Ligacao[] = [];
  let antigos: ResultadoCorrida[] = [];
  let titulo: string;

  if (e.corrida) {
    const actual = await exigir(ctx, "corridas", e.corrida);
    antigos = (actual.resultados as ResultadoCorrida[]) ?? [];
    const campos: Registo = { resultados };
    for (const k of ["nome", "categoria", "data", "ronda", "circuito", "provincia", "eventoSlug"] as const) {
      if (e[k] !== undefined && e[k] !== "") campos[k] = e[k];
    }
    const plano = await planearAlterar(ctx, "corridas", String(actual.slug), campos);
    ops.push(...plano.ops); vista.push(...plano.vista);
    avisos.push(...plano.avisos.filter((a) => !a.startsWith("As estatísticas")));
    titulo = `Actualizar os resultados de «${tituloDe(actual)}»`;
    ligacoes.push(...plano.ligacoes);
  } else {
    const evento = e.eventoSlug ? await exigir(ctx, "eventos", e.eventoSlug) : undefined;
    const dados: Registo = {
      nome: e.nome || (evento ? String(evento.titulo) : ""),
      categoria: e.categoria ?? "",
      data: e.data || (evento ? String(evento.dataFim || evento.dataInicio).slice(0, 10) : ""),
      eventoSlug: evento ? String(evento.slug) : "",
      ronda: e.ronda ?? (evento && evento.ronda ? Number(evento.ronda) : 0),
      circuito: e.circuito || (evento ? String(evento.circuito ?? "") : ""),
      provincia: e.provincia || (evento ? String(evento.provincia ?? "Luanda") : "Luanda"),
      resultados,
    };
    const existentes = (await ctx.repo.listar("corridas")).filter((c) =>
      c.eventoSlug && c.eventoSlug === dados.eventoSlug && normal(String(c.categoria)) === normal(String(dados.categoria)));
    if (existentes.length) {
      falhar(`Esta prova já tem resultados de ${String(dados.categoria)} (${existentes.map((c) => String(c.slug)).join(", ")}). Use «corrida» com esse slug para os substituir.`);
    }
    const plano = await planearCriar(ctx, "corridas", dados, idChamada);
    ops.push(...plano.ops); vista.push(...plano.vista); avisos.push(...plano.avisos.filter((a) => !a.startsWith("Sem imagem")));
    titulo = `Publicar os resultados de «${String(dados.nome)}» (${String(dados.categoria)})`;
    ligacoes.push(...plano.ligacoes);
    if (evento && e.concluirEvento !== false && evento.estado !== "concluido" && String(evento.dataFim || evento.dataInicio).slice(0, 10) <= ctx.hoje) {
      ops.push({ tipo: "actualizar", coleccao: "eventos", id: String(evento.slug), campos: { estado: "concluido" }, nome: String(evento.titulo) });
      vista.push({ accao: "alterar", alvo: `Evento «${String(evento.titulo)}»`, campos: [{ campo: "estado", etiqueta: "Estado", antes: String(evento.estado), depois: "concluido" }] });
    }
  }

  if (e.actualizarEstatisticas !== false) {
    // Soma o contributo desta corrida (e tira o da versão anterior, se havia).
    const novo = contributos(resultados);
    const velho = contributos(antigos);
    const novas = new Map<string, Estat>();
    for (const slug of new Set([...novo.keys(), ...velho.keys()])) {
      const p = pilotos.find((x) => x.slug === slug);
      if (!p) continue;
      const a = estatDe(p);
      const n = novo.get(slug) ?? ZERO();
      const v = velho.get(slug) ?? ZERO();
      const melhorAgora = melhorDe(a.melhorResultado);
      const melhor = n.melhor !== null && (melhorAgora === null || n.melhor < melhorAgora) ? `${n.melhor}.º` : a.melhorResultado;
      novas.set(slug, {
        ...a,
        pontos: Math.max(0, a.pontos + n.pontos - v.pontos),
        vitorias: Math.max(0, a.vitorias + n.vitorias - v.vitorias),
        podios: Math.max(0, a.podios + n.podios - v.podios),
        corridas: Math.max(0, a.corridas + n.corridas - v.corridas),
        melhorResultado: melhor,
      });
    }
    const est = await opsEstatisticas(ctx, novas);
    ops.push(...est.ops); vista.push(...est.vista); avisos.push(...est.avisos);
    if (est.ops.length) ligacoes.push({ rotulo: "Pilotos", href: "/admin/pilotos" });
  }

  return {
    titulo, motivo, ops, vista, avisos, destrutiva: false, ligacoes: unicas(ligacoes),
    permissoes: [["conteudo.escrever"]],
  };
}

export async function planearRecalcular(ctx: Contexto, temporada: number | undefined, motivo?: string): Promise<Plano> {
  const t = temporada ?? ctx.temporada;
  const corridas = (await ctx.repo.listar("corridas")).filter((c) => Number(c.temporada) === t) as unknown as Corrida[];
  if (corridas.length === 0) falhar(`Não há resultados da temporada ${t} para calcular.`);
  const pilotos = (await ctx.repo.listar("pilotos")) as unknown as Piloto[];
  const total = contributos(corridas.flatMap((c) => c.resultados ?? []));
  const novas = new Map<string, Estat>();
  for (const p of pilotos) {
    const c = total.get(p.slug);
    if (!c) continue;
    const a = estatDe(p as unknown as Registo);
    novas.set(p.slug, {
      ...a, pontos: c.pontos, vitorias: c.vitorias, podios: c.podios, corridas: c.corridas,
      melhorResultado: c.melhor !== null ? `${c.melhor}.º` : a.melhorResultado,
    });
  }
  const est = await opsEstatisticas(ctx, novas);
  if (est.ops.length === 0) falhar(`As estatísticas já batem certo com os ${corridas.length} resultados da temporada ${t}.`);
  const semResultados = pilotos.filter((p) => !total.has(p.slug) && (p.estatisticas?.pontos ?? 0) > 0).map((p) => p.nome);
  const avisos = [
    `Calculado a partir de ${corridas.length} corrida(s) da temporada ${t}. Os pilotos sem resultados registados ficam como estão.`,
    ...(semResultados.length ? [`Têm pontos mas nenhum resultado registado em ${t}: ${semResultados.slice(0, 8).join(", ")}${semResultados.length > 8 ? "…" : ""}.`] : []),
    ...est.avisos,
  ];
  return {
    titulo: `Recalcular as estatísticas da temporada ${t}`,
    motivo, ops: est.ops, vista: est.vista, avisos, destrutiva: false,
    ligacoes: [{ rotulo: "Pilotos", href: "/admin/pilotos" }, { rotulo: "Equipas", href: "/admin/equipas" }],
    permissoes: [["conteudo.escrever"]],
  };
}

/* ---------------- Rascunho de artigo ---------------- */

export interface EntradaArtigo {
  titulo: string; resumo: string; corpo: string[]; categoria: string; tags?: string[]; autor?: string;
  data?: string; imagem?: string; fonte?: string; fonteUrl?: string; publicar?: boolean;
}

export async function planearArtigo(ctx: Contexto, e: EntradaArtigo, idChamada: string, motivo?: string): Promise<Plano> {
  const { publicar, ...resto } = e;
  const plano = await planearCriar(ctx, "noticias", { ...resto, publicado: Boolean(publicar) }, idChamada, motivo);
  plano.titulo = `${publicar ? "Publicar" : "Guardar como rascunho"} o artigo «${e.titulo}»`;
  if (!publicar) plano.avisos.unshift("Fica guardado sem aparecer no site (rascunho). Publique-o depois de rever.");
  if (publicar) plano.permissoes.push(["conteudo.publicar"]);
  return plano;
}

/* ---------------- Mensagens e denúncias ---------------- */

export async function planearResposta(ctx: Contexto, id: string, resposta: string, emailDisponivel: boolean): Promise<Plano> {
  const m = await exigir(ctx, "mensagens", id);
  const texto = resposta.trim();
  if (texto.length < 2) falhar("Escreva a resposta antes de enviar.");
  if (!emailDisponivel) falhar("O envio de emails não está configurado (falta RESEND_API_KEY no servidor). Guarde a resposta com alterar_registo (campo resposta) e responda por outro meio.");
  const assunto = String(m.assunto || "A sua mensagem");
  const avisos: string[] = [];
  if (m.respondidaEm) avisos.push(`Esta mensagem já foi respondida em ${String(m.respondidaEm).slice(0, 10)}.`);
  return {
    titulo: `Responder a ${String(m.nome)} por email`,
    ops: [{ tipo: "responder", mensagemId: String(m.id), resposta: texto, para: String(m.email), assunto }],
    vista: [{
      accao: "email", alvo: `Email para ${String(m.nome)} <${String(m.email)}>`,
      detalhe: `Assunto: Re: ${assunto}`,
      campos: [
        { campo: "mensagem", etiqueta: "Mensagem recebida", antes: mostrar(m.mensagem, 300) },
        { campo: "resposta", etiqueta: "Resposta", depois: texto },
      ],
    }],
    avisos, destrutiva: false,
    ligacoes: [{ rotulo: "Mensagens", href: "/admin/mensagens" }],
    permissoes: [permissaoEscrita("mensagens")],
  };
}

export type AccaoModeracao =
  | "nenhuma" | "esconder-anuncio" | "apagar-anuncio" | "fechar-topico" | "esconder-topico" | "apagar-topico"
  | "suspender-conta" | "banir-conta";

export async function planearModeracao(
  ctx: Contexto, e: { id: string; decisao: "resolver" | "arquivar"; accao?: AccaoModeracao; resolucao?: string },
): Promise<Plano> {
  const d = await exigir(ctx, "denuncias", e.id);
  const accao = e.decisao === "arquivar" ? "nenhuma" : e.accao ?? "nenhuma";
  const ops: Op[] = [];
  const vista: OperacaoVista[] = [];
  const permissoes: Permissao[][] = [["comunidade.moderar"]];
  let destrutiva = false;
  let nota = "";
  const tipo = String(d.tipo);
  const alvoId = String(d.alvoId);

  const exigeTipo = (t: string) => { if (tipo !== t) falhar(`A acção «${accao}» não serve para uma denúncia de ${tipo}.`); };
  if (accao !== "nenhuma") {
    if (accao.endsWith("-anuncio")) {
      exigeTipo("marketplace");
      const a = await exigir(ctx, "anuncios", alvoId);
      if (accao === "esconder-anuncio") {
        ops.push({ tipo: "publicado", coleccao: "anuncios", id: alvoId, publicado: false, nome: tituloDe(a) });
        vista.push({ accao: "esconder", alvo: `Anúncio «${tituloDe(a)}»` });
        nota = "Anúncio escondido do marketplace.";
      } else {
        ops.push({ tipo: "apagar", coleccao: "anuncios", id: alvoId, nome: tituloDe(a) });
        vista.push({ accao: "apagar", alvo: `Anúncio «${tituloDe(a)}»` });
        nota = "Anúncio apagado do marketplace."; destrutiva = true;
      }
    } else if (accao.endsWith("-topico")) {
      exigeTipo("forum");
      const t = await exigir(ctx, "topicos", alvoId);
      if (accao === "fechar-topico") {
        ops.push({ tipo: "actualizar", coleccao: "topicos", id: alvoId, campos: { bloqueado: true }, nome: tituloDe(t) });
        vista.push({ accao: "alterar", alvo: `Tópico «${tituloDe(t)}»`, campos: [{ campo: "bloqueado", etiqueta: "Fechado a respostas", antes: t.bloqueado ? "sim" : "não", depois: "sim" }] });
        nota = "Tópico fechado a novas respostas.";
      } else if (accao === "esconder-topico") {
        ops.push({ tipo: "publicado", coleccao: "topicos", id: alvoId, publicado: false, nome: tituloDe(t) });
        vista.push({ accao: "esconder", alvo: `Tópico «${tituloDe(t)}»` });
        nota = "Tópico escondido do fórum.";
      } else {
        ops.push({ tipo: "apagar", coleccao: "topicos", id: alvoId, nome: tituloDe(t) });
        vista.push({ accao: "apagar", alvo: `Tópico «${tituloDe(t)}»`, detalhe: "Com todas as respostas." });
        nota = "Tópico apagado do fórum."; destrutiva = true;
      }
    } else {
      exigeTipo("perfil");
      const u = await exigir(ctx, "utilizadores", alvoId);
      const estado = accao === "banir-conta" ? "banido" : "suspenso";
      ops.push({ tipo: "actualizar", coleccao: "utilizadores", id: alvoId, campos: { estado }, nome: tituloDe(u) });
      vista.push({ accao: "alterar", alvo: `Conta de ${tituloDe(u)}`, campos: [{ campo: "estado", etiqueta: "Estado", antes: String(u.estado), depois: estado }] });
      nota = estado === "banido" ? "Conta banida." : "Conta suspensa.";
      destrutiva = estado === "banido";
    }
  }
  const estado = e.decisao === "resolver" ? "aprovado" : "rejeitado";
  const resolucao = (e.resolucao ?? "").trim() || nota || (estado === "rejeitado" ? "Sem violação das regras." : "Resolvida.");
  ops.push({ tipo: "actualizar", coleccao: "denuncias", id: String(d.id), campos: { estado, resolucao }, nome: String(d.alvoTitulo ?? d.id) });
  vista.push({
    accao: "alterar", alvo: `Denúncia sobre «${String(d.alvoTitulo ?? "")}»`,
    detalhe: `Motivo: ${String(d.motivo ?? "")}`,
    campos: [
      { campo: "estado", etiqueta: "Estado", antes: String(d.estado), depois: estado },
      { campo: "resolucao", etiqueta: "Resolução", antes: mostrar(d.resolucao), depois: resolucao },
    ],
  });
  return {
    titulo: e.decisao === "resolver" ? `Resolver a denúncia sobre «${String(d.alvoTitulo ?? "")}»` : `Arquivar a denúncia sobre «${String(d.alvoTitulo ?? "")}»`,
    ops, vista, avisos: destrutiva ? ["Esta acção não se desfaz."] : [], destrutiva,
    ligacoes: [{ rotulo: "Moderação", href: "/admin/moderacao" }],
    permissoes,
  };
}
