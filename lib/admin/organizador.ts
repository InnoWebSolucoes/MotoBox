import "server-only";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA
   Recebe texto solto (mensagens de WhatsApp, cartazes, listas
   de preços, biografias) e ficheiros (imagens, PDF), e pede ao
   Claude que os arrume em propostas de registos: eventos com
   bilhetes, pilotos, equipas, resultados, notícias,
   patrocinadores e vídeos. Nada é gravado aqui: as propostas
   voltam ao painel, onde a equipa revê e guarda uma a uma.
   ============================================================ */

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type {
  Evento, Piloto, Equipa, Corrida, Noticia, Video, Patrocinador,
  TipoBilhete, Provincia,
} from "@/lib/types";

export const MODELO = "claude-opus-5";

export const organizadorConfigurado = Boolean(process.env.ANTHROPIC_API_KEY);

/* ---------------- Esquema da resposta ---------------- */

const PROVINCIAS = [
  "Luanda", "Benguela", "Huíla", "Huambo", "Namibe",
  "Cabinda", "Malanje", "Bengo", "Cuanza Sul",
] as const;

const Bilhete = z.object({
  nome: z.string(),
  descricao: z.string(),
  preco: z.number().describe("Preço em kwanzas (Kz), só o número"),
  disponiveis: z.number().nullable().describe("Lugares disponíveis, se indicado"),
  beneficios: z.array(z.string()),
});

const Esquema = z.object({
  resumo: z.string().describe("Duas ou três frases sobre o que foi encontrado no material"),
  pendentes: z.array(z.string()).describe(
    "Tarefas concretas para a equipa: informação em falta, dúvidas a confirmar, fotografias a pedir",
  ),
  eventos: z.array(z.object({
    titulo: z.string(),
    disciplina: z.enum(["Motocross", "Enduro", "Velocidade", "Passeio", "Solidária", "Rally"]),
    provincia: z.enum(PROVINCIAS).nullable(),
    circuito: z.string(),
    localidade: z.string(),
    dataInicio: z.string().describe("AAAA-MM-DD, ou vazio se não houver data"),
    dataFim: z.string().describe("AAAA-MM-DD, ou vazio"),
    ronda: z.number().nullable(),
    resumo: z.string(),
    descricao: z.string(),
    organizador: z.string().nullable(),
    horarios: z.array(z.object({ dia: z.string(), hora: z.string(), sessao: z.string() })),
    bilhetes: z.array(Bilhete),
  })),
  bilhetesParaEventosExistentes: z.array(z.object({
    eventoSlug: z.string().describe("Slug de um evento da lista de eventos existentes"),
    bilhetes: z.array(Bilhete),
  })),
  pilotos: z.array(z.object({
    nome: z.string(),
    apelido: z.string().nullable(),
    numero: z.number().nullable(),
    equipaSlug: z.string().nullable().describe("Slug de uma equipa existente, se o piloto pertencer a uma"),
    equipaNome: z.string().nullable().describe("Nome da equipa quando não existe na lista"),
    provincia: z.enum(PROVINCIAS).nullable(),
    nacionalidade: z.string().nullable(),
    idade: z.number().nullable(),
    mota: z.string(),
    categoria: z.string().describe("Ex.: MX1, MX2, Enduro, Quad"),
    bio: z.string(),
    estreia: z.number().nullable().describe("Ano de estreia em competição"),
    instagram: z.string().nullable(),
    facebook: z.string().nullable(),
  })),
  equipas: z.array(z.object({
    nome: z.string(),
    tipo: z.enum(["Equipa", "Clube"]),
    base: z.string(),
    provincia: z.enum(PROVINCIAS).nullable(),
    fundacao: z.number().nullable(),
    chefe: z.string(),
    membros: z.number().nullable(),
    descricao: z.string(),
    motas: z.array(z.string()),
    instagram: z.string().nullable(),
    facebook: z.string().nullable(),
  })),
  corridas: z.array(z.object({
    nome: z.string(),
    eventoSlug: z.string().nullable().describe("Slug de um evento existente, se for o caso"),
    ronda: z.number().nullable(),
    circuito: z.string(),
    provincia: z.enum(PROVINCIAS).nullable(),
    data: z.string().describe("AAAA-MM-DD, ou vazio"),
    categoria: z.string(),
    resultados: z.array(z.object({
      posicao: z.number(),
      piloto: z.string(),
      pilotoSlug: z.string().nullable().describe("Slug de um piloto existente, se corresponder"),
      equipa: z.string(),
      voltas: z.number().nullable(),
      tempo: z.string(),
      pontos: z.number().nullable(),
      estado: z.enum(["DNF", "DNS", "DSQ"]).nullable(),
    })),
  })),
  noticias: z.array(z.object({
    titulo: z.string(),
    resumo: z.string(),
    corpo: z.array(z.string()).describe("Parágrafos"),
    categoria: z.enum(["Angola", "Internacional", "Comunidade", "Entrevista", "Solidária"]),
    tags: z.array(z.string()),
    autor: z.string().nullable(),
    data: z.string().describe("AAAA-MM-DD, ou vazio"),
  })),
  patrocinadores: z.array(z.object({
    nome: z.string(),
    nivel: z.enum(["Principal", "Oficial", "Apoio", "Media"]),
    setor: z.string(),
    descricao: z.string(),
    website: z.string(),
  })),
  videos: z.array(z.object({
    titulo: z.string(),
    descricao: z.string(),
    categoria: z.enum(["Highlights", "Entrevista", "Documentário", "Onboard", "Resumo"]),
    data: z.string().describe("AAAA-MM-DD, ou vazio"),
    youtube: z.string().nullable().describe("Endereço ou ID do vídeo no YouTube"),
  })),
});

export type Extraccao = z.infer<typeof Esquema>;

const SISTEMA = `És o assistente de organização da Motobox Angola, a plataforma do motociclismo angolano.
A equipa cola material em bruto (mensagens de WhatsApp, texto de cartazes, listas de preços, biografias, resultados, fotografias, PDF) e tu arrumas tudo em registos prontos a rever.

Regras:
- Usa só o que está no material. Não inventes datas, preços, números nem nomes. O que faltar fica vazio ou null e vai para "pendentes".
- Antes de criar algo, compara com os registos existentes que te são dados. Se o evento, piloto ou equipa já existir, não o repitas: liga-o pelo slug (equipaSlug, eventoSlug, pilotoSlug) ou, no caso de bilhetes novos para um evento que já existe, usa "bilhetesParaEventosExistentes".
- Preços em kwanzas (Kz). "5 mil" é 5000.
- Datas no formato AAAA-MM-DD. Se o ano não for dito, assume a temporada indicada.
- Escreve em português de Angola, frases claras e curtas. Nunca uses travessões (— ou –) nos textos.
- "pendentes" são tarefas concretas para a equipa, por exemplo "Confirmar a hora de abertura das portas do GP do Namibe" ou "Pedir fotografia do piloto Nelson Kiala".
- Se o material não tiver nada útil, devolve listas vazias e explica no resumo.`;

/* ---------------- Contexto e resultado ---------------- */

export interface Contexto {
  temporada: number;
  equipas: { slug: string; nome: string }[];
  eventos: { slug: string; titulo: string; dataInicio: string; bilhetes?: TipoBilhete[] }[];
  pilotos: { slug: string; nome: string; equipaSlug?: string }[];
  /** Slugs já ocupados por coleção, para gerar endereços únicos. */
  ocupados: Record<string, string[]>;
}

export interface Ficheiro { nome: string; tipo: string; dados: string }

export type Proposta =
  | { tipo: "criar"; coleccao: "eventos"; registo: Evento; avisos: string[] }
  | { tipo: "criar"; coleccao: "pilotos"; registo: Piloto; avisos: string[] }
  | { tipo: "criar"; coleccao: "equipas"; registo: Equipa; avisos: string[] }
  | { tipo: "criar"; coleccao: "corridas"; registo: Corrida; avisos: string[] }
  | { tipo: "criar"; coleccao: "noticias"; registo: Noticia; avisos: string[] }
  | { tipo: "criar"; coleccao: "patrocinadores"; registo: Patrocinador; avisos: string[] }
  | { tipo: "criar"; coleccao: "videos"; registo: Video; avisos: string[] }
  | { tipo: "bilhetes"; coleccao: "eventos"; eventoSlug: string; eventoTitulo: string; bilhetes: TipoBilhete[]; avisos: string[] };

export interface ResultadoOrganizador {
  resumo: string;
  pendentes: string[];
  propostas: Proposta[];
}

/* ---------------- Chamada ao Claude ---------------- */

export class ErroOrganizador extends Error {
  constructor(mensagem: string, public codigo = 500) { super(mensagem); }
}

export async function organizar(
  texto: string,
  ficheiros: Ficheiro[],
  contexto: Contexto,
): Promise<ResultadoOrganizador> {
  const client = new Anthropic();

  const conteudo: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const f of ficheiros) {
    if (f.tipo === "application/pdf") {
      conteudo.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.dados } });
    } else if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(f.tipo)) {
      conteudo.push({
        type: "image",
        source: { type: "base64", media_type: f.tipo as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: f.dados },
      });
    }
  }

  const existentes = {
    temporada: contexto.temporada,
    hoje: new Date().toISOString().slice(0, 10),
    equipas: contexto.equipas,
    eventos: contexto.eventos.map(({ slug, titulo, dataInicio, bilhetes }) => ({
      slug, titulo, dataInicio, bilhetes: (bilhetes ?? []).map((b) => b.nome),
    })),
    pilotos: contexto.pilotos,
  };

  conteudo.push({
    type: "text",
    text: `Registos que já existem na plataforma:\n${JSON.stringify(existentes)}\n\nMaterial a organizar:\n${texto || "(ver ficheiros anexos)"}`,
  });

  let resposta;
  try {
    resposta = await client.beta.messages.parse({
      model: MODELO,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SISTEMA,
      messages: [{ role: "user", content: conteudo }],
      output_config: { format: betaZodOutputFormat(Esquema) },
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new ErroOrganizador("A chave da API do Claude é inválida. Verifique ANTHROPIC_API_KEY.", 503);
    if (e instanceof Anthropic.RateLimitError) throw new ErroOrganizador("Demasiados pedidos ao Claude. Tente daqui a um minuto.", 429);
    if (e instanceof Anthropic.BadRequestError) throw new ErroOrganizador(`O pedido foi recusado: ${e.message}`, 400);
    if (e instanceof Anthropic.APIError) throw new ErroOrganizador(`O serviço do Claude falhou (${e.status}). Tente de novo.`, 502);
    throw e;
  }

  if (resposta.stop_reason === "refusal") {
    throw new ErroOrganizador("O Claude recusou analisar este material.", 422);
  }
  if (resposta.stop_reason === "max_tokens") {
    throw new ErroOrganizador("O material é demasiado extenso para uma só análise. Divida-o em partes.", 413);
  }
  const dados = resposta.parsed_output;
  if (!dados) throw new ErroOrganizador("Não foi possível ler a resposta do Claude. Tente de novo.", 502);

  return propostasDe(dados, contexto);
}

/* ---------------- Da extracção aos registos ---------------- */

function slugify(texto: string): string {
  return texto
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const hoje = () => new Date().toISOString().slice(0, 10);

function idYoutube(valor: string | null): string | undefined {
  if (!valor) return undefined;
  const m = /(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/.exec(valor);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(valor.trim()) ? valor.trim() : undefined;
}

export function propostasDe(x: Extraccao, ctx: Contexto): ResultadoOrganizador {
  const ocupados = new Map<string, Set<string>>(
    Object.entries(ctx.ocupados).map(([c, l]) => [c, new Set(l)]),
  );
  /** Slug livre na coleção; reserva-o para as propostas seguintes. */
  const slugLivre = (coleccao: string, base: string) => {
    const usados = ocupados.get(coleccao) ?? new Set<string>();
    ocupados.set(coleccao, usados);
    const raiz = slugify(base) || coleccao;
    let s = raiz;
    for (let i = 2; usados.has(s); i++) s = `${raiz}-${i}`;
    usados.add(s);
    return s;
  };
  const data = (v: string, avisos: string[], rotulo: string) => {
    if (DATA.test(v)) return v;
    avisos.push(`${rotulo} em falta. Ficou a data de hoje; corrija antes de guardar.`);
    return hoje();
  };
  const provincia = (p: Provincia | null, avisos: string[]): Provincia => {
    if (p) return p;
    avisos.push("Província não indicada. Ficou Luanda.");
    return "Luanda";
  };
  const bilhetes = (lista: z.infer<typeof Bilhete>[], existentes: TipoBilhete[] = []): TipoBilhete[] => {
    const ids = new Set(existentes.map((b) => b.id));
    return lista.map((b) => {
      let id = slugify(b.nome) || "bilhete";
      for (let i = 2; ids.has(id); i++) id = `${slugify(b.nome) || "bilhete"}-${i}`;
      ids.add(id);
      return {
        id, nome: b.nome, descricao: b.descricao, preco: b.preco,
        disponiveis: b.disponiveis ?? 0, beneficios: b.beneficios,
      };
    });
  };

  const equipasExistentes = new Map(ctx.equipas.map((e) => [e.slug, e.nome]));
  const eventosExistentes = new Map(ctx.eventos.map((e) => [e.slug, e]));
  const pilotosExistentes = new Set(ctx.pilotos.map((p) => p.slug));
  const propostas: Proposta[] = [];

  // Equipas primeiro: os pilotos novos podem ligar-se a elas.
  const equipasNovas = new Map<string, { slug: string; nome: string }>();
  for (const e of x.equipas) {
    const avisos: string[] = [];
    const slug = slugLivre("equipas", e.nome);
    equipasNovas.set(e.nome.trim().toLowerCase(), { slug, nome: e.nome });
    propostas.push({
      tipo: "criar", coleccao: "equipas", avisos,
      registo: {
        slug, nome: e.nome, tipo: e.tipo, base: e.base, provincia: provincia(e.provincia, avisos),
        fundacao: e.fundacao ?? new Date().getFullYear(), logo: "", cor: "#e10600",
        chefe: e.chefe, membros: e.membros ?? 0, pilotos: [], descricao: e.descricao, motas: e.motas,
        estatisticas: { pontos: 0, vitorias: 0, podios: 0, titulos: 0 },
        redes: { ...(e.instagram ? { instagram: e.instagram } : {}), ...(e.facebook ? { facebook: e.facebook } : {}) },
      },
    });
  }

  for (const p of x.pilotos) {
    const avisos: string[] = [];
    let equipaSlug = "";
    let equipa = p.equipaNome ?? "";
    if (p.equipaSlug && equipasExistentes.has(p.equipaSlug)) {
      equipaSlug = p.equipaSlug;
      equipa = equipasExistentes.get(p.equipaSlug) ?? equipa;
    } else if (p.equipaNome) {
      const nova = equipasNovas.get(p.equipaNome.trim().toLowerCase());
      if (nova) {
        equipaSlug = nova.slug;
        equipa = nova.nome;
        avisos.push(`Guarde primeiro a equipa ${nova.nome}.`);
      } else {
        avisos.push(`A equipa ${p.equipaNome} não existe na plataforma. O piloto fica sem equipa ligada.`);
      }
    }
    if (p.numero === null) avisos.push("Número de corrida em falta.");
    avisos.push("Sem fotografia. Acrescente-a depois na ficha do piloto.");
    propostas.push({
      tipo: "criar", coleccao: "pilotos", avisos,
      registo: {
        slug: slugLivre("pilotos", p.nome), nome: p.nome, ...(p.apelido ? { apelido: p.apelido } : {}),
        numero: p.numero ?? 0, equipa, equipaSlug,
        provincia: provincia(p.provincia, avisos), nacionalidade: p.nacionalidade ?? "Angolana",
        idade: p.idade ?? 0, mota: p.mota, categoria: p.categoria || "MX1", foto: "", bio: p.bio,
        estreia: p.estreia ?? ctx.temporada,
        estatisticas: { pontos: 0, vitorias: 0, podios: 0, poles: 0, corridas: 0, melhorResultado: "" },
        redes: { ...(p.instagram ? { instagram: p.instagram } : {}), ...(p.facebook ? { facebook: p.facebook } : {}) },
        campeonatos: 0,
      },
    });
  }

  for (const e of x.eventos) {
    const avisos: string[] = [];
    const inicio = data(e.dataInicio, avisos, "Data de início");
    const fim = DATA.test(e.dataFim) ? e.dataFim : inicio;
    const lista = bilhetes(e.bilhetes);
    if (lista.length === 0) avisos.push("Sem bilhetes. Acrescente-os na Bilheteira se o evento for pago.");
    propostas.push({
      tipo: "criar", coleccao: "eventos", avisos,
      registo: {
        slug: slugLivre("eventos", e.titulo), titulo: e.titulo, disciplina: e.disciplina,
        ...(e.ronda !== null ? { ronda: e.ronda } : {}),
        temporada: Number(inicio.slice(0, 4)) || ctx.temporada,
        circuito: e.circuito, provincia: provincia(e.provincia, avisos), localidade: e.localidade,
        dataInicio: inicio, dataFim: fim,
        estado: lista.length > 0 ? "bilhetes-abertos" : "agendado",
        imagem: "", resumo: e.resumo, descricao: e.descricao,
        organizador: e.organizador ?? "Motobox Angola", horarios: e.horarios, bilhetes: lista,
      },
    });
  }

  for (const b of x.bilhetesParaEventosExistentes) {
    const evento = eventosExistentes.get(b.eventoSlug);
    if (!evento) continue;
    propostas.push({
      tipo: "bilhetes", coleccao: "eventos", eventoSlug: evento.slug, eventoTitulo: evento.titulo,
      bilhetes: bilhetes(b.bilhetes, evento.bilhetes), avisos: [],
    });
  }

  for (const c of x.corridas) {
    const avisos: string[] = [];
    const eventoSlug = c.eventoSlug && eventosExistentes.has(c.eventoSlug) ? c.eventoSlug : "";
    const d = data(c.data, avisos, "Data da corrida");
    const resultados = c.resultados.map((r) => ({
      posicao: r.posicao, piloto: r.piloto,
      pilotoSlug: r.pilotoSlug && pilotosExistentes.has(r.pilotoSlug) ? r.pilotoSlug : slugify(r.piloto),
      equipa: r.equipa, voltas: r.voltas ?? 0, tempo: r.tempo, pontos: r.pontos ?? 0,
      ...(r.estado ? { estado: r.estado } : {}),
    }));
    const desconhecidos = c.resultados.filter((r) => !(r.pilotoSlug && pilotosExistentes.has(r.pilotoSlug)));
    if (desconhecidos.length > 0) {
      avisos.push(`Pilotos sem ficha na plataforma: ${desconhecidos.map((r) => r.piloto).join(", ")}.`);
    }
    const vencedor = resultados.find((r) => r.posicao === 1)?.piloto ?? "";
    propostas.push({
      tipo: "criar", coleccao: "corridas", avisos,
      registo: {
        slug: slugLivre("corridas", `${c.nome} ${c.categoria}`), eventoSlug, nome: c.nome,
        ronda: c.ronda ?? 1, temporada: Number(d.slice(0, 4)) || ctx.temporada,
        circuito: c.circuito, provincia: provincia(c.provincia, avisos), data: d,
        categoria: c.categoria, vencedor, imagem: "", resultados,
      },
    });
  }

  for (const n of x.noticias) {
    const avisos: string[] = [];
    const palavras = n.corpo.join(" ").split(/\s+/).length;
    propostas.push({
      tipo: "criar", coleccao: "noticias", avisos,
      registo: {
        slug: slugLivre("noticias", n.titulo), titulo: n.titulo, resumo: n.resumo, corpo: n.corpo,
        categoria: n.categoria, tags: n.tags, autor: n.autor ?? "Redação Motobox",
        data: DATA.test(n.data) ? n.data : hoje(), imagem: "",
        leitura: Math.max(1, Math.round(palavras / 200)), destaque: false,
      },
    });
  }

  for (const p of x.patrocinadores) {
    propostas.push({
      tipo: "criar", coleccao: "patrocinadores", avisos: ["Sem logótipo. Acrescente-o depois."],
      registo: {
        slug: slugLivre("patrocinadores", p.nome), nome: p.nome, nivel: p.nivel, setor: p.setor,
        descricao: p.descricao, logo: "", website: p.website, desde: new Date().getFullYear(),
      },
    });
  }

  for (const v of x.videos) {
    const avisos: string[] = [];
    const videoId = idYoutube(v.youtube);
    if (!videoId) avisos.push("Sem ligação do YouTube: o vídeo não vai poder ser reproduzido.");
    propostas.push({
      tipo: "criar", coleccao: "videos", avisos,
      registo: {
        slug: slugLivre("videos", v.titulo), titulo: v.titulo, descricao: v.descricao, duracao: "0:00",
        data: DATA.test(v.data) ? v.data : hoje(), thumbnail: "", categoria: v.categoria,
        visualizacoes: 0, ...(videoId ? { videoId } : {}),
      },
    });
  }

  return { resumo: x.resumo, pendentes: x.pendentes, propostas };
}
