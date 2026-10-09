/* ============================================================
   MOTOBOX — Rotas: tipos e funções leves

   O que tanto o site como o painel de gestão precisam de saber
   sobre uma rota, sem os dados (esses vivem em lib/rotas-dados.ts
   e no conteúdo editável). Pode ser importado em componentes de
   cliente sem arrastar as oito rotas para o browser.
   ============================================================ */

import type { Provincia } from "@/lib/provincias";
import type { EstadoEstrada } from "@/lib/rotas-estrada";
import { src } from "@/lib/imagens";

export type Piso = "Asfalto" | "Asfalto e terra" | "Asfalto e areia";

/** Quanto a rota pede a quem conduz, dito pelas fontes (estrada, piso, isolamento). */
export type Exigencia = "Tranquila" | "Média" | "Exigente" | "Aventura";

export const PISOS: Piso[] = ["Asfalto", "Asfalto e terra", "Asfalto e areia"];
export const EXIGENCIAS: Exigencia[] = ["Tranquila", "Média", "Exigente", "Aventura"];

export interface FonteRota {
  nome: string;
  url: string;
}

/** Um facto e as fontes que o sustentam. */
export interface Facto {
  texto: string;
  fontes: FonteRota[];
}

export interface Lugar {
  nome: string;
  onde: string;
  nota: string;
  fontes: FonteRota[];
}

export interface Ponto {
  nome: string;
  lat: number;
  lng: number;
  nota: string;
  fontes: FonteRota[];
}

export interface Paragem {
  nome: string;
  lat: number;
  lng: number;
  /** Altitude em metros, do modelo SRTM. */
  alt: number;
  /** Onde foi verificada a coordenada. */
  fonte: FonteRota;
  /** Nota curta por baixo do nome, no itinerário (opcional). */
  nota?: string;
}

export type PisoTroco = "asfalto" | "buracos" | "terra" | "areia";
export const PISOS_TROCO: PisoTroco[] = ["asfalto", "buracos", "terra", "areia"];

export interface Troco {
  dia: number;
  /** Índices em `paragens`: normalmente cada troço vai de uma paragem à seguinte. */
  de: number;
  para: number;
  /** Distância e tempo de carro, do OSRM. */
  km: number;
  minCarro: number;
  piso: PisoTroco;
  /** A estrada: número, por onde passa, estado. */
  estrada: string;
  /** O que se vê pelo caminho. */
  ver: string;
  aviso?: string;
  fontes: FonteRota[];
}

export interface DiaHorario {
  titulo: string;
  passos: { hora: string; texto: string }[];
}

/* ---------------- Fotografias ---------------- */

export interface Foto {
  /**
   * Caminho no Wikimedia Commons, ex.: "5/52/Serra_da_Leba-Road.jpg" (já
   * codificado para URL). Vazio quando a fotografia vem de `url`.
   */
  arquivo: string;
  /** Tamanho do original, em píxeis (só conta para as do Commons). */
  largura: number;
  altura: number;
  /** Página do ficheiro (no Commons ou onde foi publicada). */
  pagina: string;
  autor: string;
  licenca: string;
  licencaUrl: string;
  alt: string;
  /** O que a fotografia mostra, para a legenda. */
  local: string;
  /** Ponto de recorte (object-position) quando o centro não serve. */
  foco?: string;
  /**
   * Fotografia carregada no painel, colada por endereço ou escolhida entre as
   * do site. Quando existe, vale em vez de `arquivo`.
   */
  url?: string;
  /** Onde foi publicada, para o crédito (ex.: "Wikimedia Commons"). */
  origem?: string;
}

/** Larguras de miniatura que o upload.wikimedia.org aceita. */
export type LarguraCommons = 960 | 1280 | 1920;

const COMMONS = "https://upload.wikimedia.org/wikipedia/commons";

/**
 * Endereço da fotografia na largura pedida: a miniatura do Commons (ou o
 * original, quando é mais estreito), ou o endereço próprio da fotografia.
 */
export function urlCommons(foto: Foto, largura: LarguraCommons): string {
  if (foto.url) return src(foto.url, { w: largura }) ?? foto.url;
  if (!foto.arquivo) return "";
  if (foto.largura <= largura) return `${COMMONS}/${foto.arquivo}`;
  const nome = foto.arquivo.split("/").pop();
  return `${COMMONS}/thumb/${foto.arquivo}/${largura}px-${nome}`;
}

/** O mesmo que urlCommons, com um nome que diz o que faz. */
export const urlFoto = urlCommons;

/** A fotografia tem imagem (do Commons ou própria). */
export const temImagem = (foto: Foto | undefined): foto is Foto => Boolean(foto && (foto.url || foto.arquivo));

/** Onde a fotografia foi publicada, para o crédito. */
export function origemFoto(foto: Foto): string {
  if (foto.origem !== undefined) return foto.origem;
  if (foto.url) return /wikimedia\.org/.test(foto.url) ? "Wikimedia Commons" : "";
  return foto.arquivo ? "Wikimedia Commons" : "";
}

/* ---------------- A rota ---------------- */

export interface Rota {
  slug: string;
  nome: string;
  /** Uma linha, por baixo do nome. */
  subtitulo: string;
  /** Como aparece no cartão, ex.: "Huíla · Namibe". */
  regiao: string;
  /** Para ligar a rota aos clubes da mesma zona. */
  provincias: Provincia[];
  /** Cidade de onde normalmente se parte. */
  partida: string;
  piso: Piso;
  /** O piso em concreto: estradas, troços de terra, areia. */
  pisoDetalhe: string;
  exigencia: Exigencia;
  /** Porquê esta exigência, numa frase. */
  exigenciaPorque: string;
  melhorEpoca: string;
  /** Para o cabeçalho, ex.: "Jun–Ago". */
  epocaCurta: string;
  resumo: string;
  descricao: string[];
  /** Distâncias como as fontes as publicam, para comparar com o OSRM. */
  distancias: { texto: string; fonte: FonteRota }[];
  destaques: string[];
  dicas: string[];
  /** Miniatura da fotografia de capa (as páginas dos clubes usam-na). */
  imagem: string;
  fotos: Foto[];
  fontes: FonteRota[];

  paragens: Paragem[];
  trocos: Troco[];
  dias: number;
  diasNota: Facto;
  horario: DiaHorario[];
  /** Cidade de referência para o clima e para o nascer e o pôr do sol (chave da tabela de clima). */
  clima: string;
  altimetria: { min: number; max: number; subida: number; descida: number };
  combustivel: Facto[];
  /** O maior intervalo entre postos, dito com números. */
  semCombustivel: Facto;
  comer: Lugar[];
  dormir: Lugar[];
  saude: Lugar[];
  perigos: Facto[];
  licencas: Facto[];
  rede: Facto[];
  motas: Facto[];
  /** Lista de verificação própria desta rota. */
  levar: string[];
  agua: Facto;
  grupo: Facto;
  pontos: Ponto[];

  /** O que os motards contam do estado da estrada (null: a página não mostra o bloco). */
  estrada?: EstadoEstrada | null;
  /** Traçado do OSRM, em polilinha codificada (precisão 5), para o GPX. */
  tracado?: string;
  /** As paragens com que o traçado foi calculado ("lat,lng;lat,lng…"), para saber se ficou desactualizado. */
  tracadoDe?: string;
}

/** Assinatura das paragens, para comparar com a do último cálculo do traçado. */
export const assinaturaParagens = (paragens: { lat: number; lng: number }[]) =>
  paragens.map((p) => `${Number(p.lat).toFixed(5)},${Number(p.lng).toFixed(5)}`).join(";");

/** Coordenadas utilizáveis (número finito, dentro dos limites). */
export const coordValida = (p: { lat?: unknown; lng?: unknown } | undefined): boolean =>
  Boolean(p) &&
  typeof p!.lat === "number" && typeof p!.lng === "number" &&
  Number.isFinite(p!.lat) && Number.isFinite(p!.lng) &&
  Math.abs(p!.lat) <= 90 && Math.abs(p!.lng) <= 180;

const factoVazio = (): Facto => ({ texto: "", fontes: [] });

/** Uma rota nova, em branco (o painel começa daqui). */
export function rotaVazia(): Rota {
  return {
    slug: "",
    nome: "",
    subtitulo: "",
    regiao: "",
    provincias: [],
    partida: "",
    piso: "Asfalto",
    pisoDetalhe: "",
    exigencia: "Média",
    exigenciaPorque: "",
    melhorEpoca: "",
    epocaCurta: "",
    resumo: "",
    descricao: [],
    distancias: [],
    destaques: [],
    dicas: [],
    imagem: "",
    fotos: [],
    fontes: [],
    paragens: [],
    trocos: [],
    dias: 1,
    diasNota: factoVazio(),
    horario: [],
    clima: "luanda",
    altimetria: { min: 0, max: 0, subida: 0, descida: 0 },
    combustivel: [],
    semCombustivel: factoVazio(),
    comer: [],
    dormir: [],
    saude: [],
    perigos: [],
    licencas: [],
    rede: [],
    motas: [],
    levar: [],
    agua: factoVazio(),
    grupo: factoVazio(),
    pontos: [],
    estrada: null,
    tracado: "",
    tracadoDe: "",
  };
}

/* ---------------- Ler com segurança o que vem do painel ---------------- */

const eObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const txt = (v: unknown) => (typeof v === "string" ? v : v === undefined || v === null ? "" : String(v));
const num = (v: unknown, padrao = 0) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : padrao;
};
const lista = <T>(v: unknown, f: (x: unknown) => T): T[] => (Array.isArray(v) ? v.map(f) : []);

const fonte = (v: unknown): FonteRota => (eObj(v) ? { nome: txt(v.nome), url: txt(v.url) } : { nome: "", url: "" });
const fontes = (v: unknown) => lista(v, fonte).filter((f) => f.nome || f.url);
const facto = (v: unknown): Facto => (eObj(v) ? { texto: txt(v.texto), fontes: fontes(v.fontes) } : factoVazio());
const lugar = (v: unknown): Lugar =>
  eObj(v) ? { nome: txt(v.nome), onde: txt(v.onde), nota: txt(v.nota), fontes: fontes(v.fontes) } : { nome: "", onde: "", nota: "", fontes: [] };

/**
 * Garante a forma de uma rota vinda do conteúdo editável: o que faltar fica
 * em branco (e a página esconde o que estiver vazio). O que já está certo
 * passa tal e qual, por isso as rotas de origem não mudam em nada.
 */
export function normalizarRota(dados: unknown): Rota {
  const d = eObj(dados) ? dados : {};
  const r = { ...rotaVazia(), ...d } as Rota;
  const textos: (keyof Rota)[] = [
    "slug", "nome", "subtitulo", "regiao", "partida", "pisoDetalhe", "exigenciaPorque", "melhorEpoca",
    "epocaCurta", "resumo", "imagem", "clima",
  ];
  for (const k of textos) (r as unknown as Record<string, unknown>)[k] = txt(r[k]);
  if (!r.clima) r.clima = "luanda";
  if (!PISOS.includes(r.piso)) r.piso = "Asfalto";
  if (!EXIGENCIAS.includes(r.exigencia)) r.exigencia = "Média";
  r.provincias = lista(d.provincias, txt).filter(Boolean) as Provincia[];
  r.descricao = lista(d.descricao, txt).filter(Boolean);
  r.destaques = lista(d.destaques, txt).filter(Boolean);
  r.dicas = lista(d.dicas, txt).filter(Boolean);
  r.levar = lista(d.levar, txt).filter(Boolean);
  r.distancias = lista(d.distancias, (x) => (eObj(x) ? { texto: txt(x.texto), fonte: fonte(x.fonte) } : { texto: "", fonte: fonte(null) }))
    .filter((x) => x.texto);
  r.fontes = fontes(d.fontes);
  r.fotos = lista(d.fotos, (x) => {
    const f = (eObj(x) ? x : {}) as Partial<Foto>;
    const foto: Foto = {
      ...(f as Foto),
      arquivo: txt(f.arquivo),
      largura: num(f.largura),
      altura: num(f.altura),
      pagina: txt(f.pagina),
      autor: txt(f.autor),
      licenca: txt(f.licenca),
      licencaUrl: txt(f.licencaUrl),
      alt: txt(f.alt),
      local: txt(f.local),
    };
    if (!foto.url) delete foto.url;
    if (!foto.foco) delete foto.foco;
    return foto;
  }).filter(temImagem);
  r.paragens = lista(d.paragens, (x) => {
    const p = eObj(x) ? x : {};
    const paragem: Paragem = { ...(p as unknown as Paragem), nome: txt(p.nome), lat: num(p.lat, NaN), lng: num(p.lng, NaN), alt: num(p.alt), fonte: fonte(p.fonte) };
    if (!paragem.nota) delete paragem.nota;
    return paragem;
  });
  const n = r.paragens.length;
  const indice = (v: unknown) => Math.round(num(v, -1));
  r.trocos = lista(d.trocos, (x) => {
    const t = eObj(x) ? x : {};
    const troco: Troco = {
      ...(t as unknown as Troco),
      dia: Math.max(1, Math.round(num(t.dia, 1))),
      de: indice(t.de),
      para: indice(t.para),
      km: num(t.km),
      minCarro: num(t.minCarro),
      piso: PISOS_TROCO.includes(t.piso as PisoTroco) ? (t.piso as PisoTroco) : "asfalto",
      estrada: txt(t.estrada),
      ver: txt(t.ver),
      fontes: fontes(t.fontes),
    };
    if (t.aviso === undefined) delete troco.aviso;
    else troco.aviso = txt(t.aviso);
    return troco;
  }).filter((t) => t.de >= 0 && t.de < n && t.para >= 0 && t.para < n && t.de !== t.para);
  r.dias = Math.max(1, Math.round(num(d.dias, 1)));
  r.diasNota = facto(d.diasNota);
  r.horario = lista(d.horario, (x) => {
    const h = eObj(x) ? x : {};
    return {
      titulo: txt(h.titulo),
      passos: lista(h.passos, (y) => (eObj(y) ? { hora: txt(y.hora), texto: txt(y.texto) } : { hora: "", texto: "" })).filter((p) => p.hora || p.texto),
    };
  });
  const a = eObj(d.altimetria) ? d.altimetria : {};
  r.altimetria = { min: num(a.min), max: num(a.max), subida: num(a.subida), descida: num(a.descida) };
  r.combustivel = lista(d.combustivel, facto).filter((f) => f.texto);
  r.semCombustivel = facto(d.semCombustivel);
  r.comer = lista(d.comer, lugar).filter((l) => l.nome);
  r.dormir = lista(d.dormir, lugar).filter((l) => l.nome);
  r.saude = lista(d.saude, lugar).filter((l) => l.nome);
  r.perigos = lista(d.perigos, facto).filter((f) => f.texto);
  r.licencas = lista(d.licencas, facto).filter((f) => f.texto);
  r.rede = lista(d.rede, facto).filter((f) => f.texto);
  r.motas = lista(d.motas, facto).filter((f) => f.texto);
  r.agua = facto(d.agua);
  r.grupo = facto(d.grupo);
  r.pontos = lista(d.pontos, (x) => {
    const p = eObj(x) ? x : {};
    return { nome: txt(p.nome), lat: num(p.lat, NaN), lng: num(p.lng, NaN), nota: txt(p.nota), fontes: fontes(p.fontes) };
  }).filter((p) => p.nome && coordValida(p));
  if (eObj(d.estrada)) {
    const e = d.estrada;
    const relatos = lista(e.relatos, (x) => {
      const rel = eObj(x) ? x : {};
      const estado = rel.estado === "boa" || rel.estado === "irregular" || rel.estado === "má" ? rel.estado : "irregular";
      return { troco: txt(rel.troco), estado, nota: txt(rel.nota) } as EstadoEstrada["relatos"][number];
    }).filter((x) => x.troco || x.nota);
    r.estrada = relatos.length ? { quando: txt(e.quando), relatos } : null;
  } else {
    r.estrada = null;
  }
  r.tracado = txt(d.tracado);
  r.tracadoDe = txt(d.tracadoDe);
  return r;
}
