import "server-only";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA
   Recebe texto solto (mensagens de WhatsApp, cartazes, listas
   de preços, biografias, pedidos de correcção) e ficheiros
   (imagens, PDF), e pede ao Claude que os arrume em propostas:
   registos novos (eventos com bilhetes, pilotos, equipas,
   resultados, notícias, patrocinadores e vídeos), alterações a
   registos que já existem e remoções. Nada é gravado aqui: as
   propostas voltam ao painel, onde a equipa revê e guarda uma a
   uma. As remoções pedem sempre confirmação própria.
   ============================================================ */

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type {
  Evento, Piloto, Equipa, Corrida, Noticia, Video, Patrocinador,
  TipoBilhete, Provincia, ResultadoCorrida,
} from "@/lib/types";
import { PROVINCIAS as PROVINCIAS_ANGOLA } from "@/lib/provincias";
import { CATEGORIAS_ARTIGO } from "@/lib/types";
import { DISCIPLINAS_COMUNIDADE, DISCIPLINAS_PROVA } from "@/lib/desporto";

export const MODELO = "claude-opus-5";

export const organizadorConfigurado = Boolean(process.env.ANTHROPIC_API_KEY);

/**
 * Tempo máximo de uma análise. A rota tem 300 s no Vercel; parar um
 * pouco antes deixa responder com uma mensagem clara em vez de a
 * função ser cortada a meio.
 */
const TEMPO_MAXIMO_MS = 280_000;

/* ---------------- Valores fixos ---------------- */

// Lista partilhada com o resto do site (lib/provincias.ts): as 21 províncias.
const PROVINCIAS = PROVINCIAS_ANGOLA;
// Provas de cada modalidade de Desporto ("Prova" é uma competição sem
// modalidade) e os tipos de evento da comunidade.
const DISCIPLINAS = [...DISCIPLINAS_PROVA, ...DISCIPLINAS_COMUNIDADE] as const;
const ESTADOS_EVENTO = ["agendado", "bilhetes-abertos", "esgotado", "a-decorrer", "concluido"] as const;
const CATEGORIAS_NOTICIA = CATEGORIAS_ARTIGO;
const CATEGORIAS_VIDEO = ["Highlights", "Entrevista", "Documentário", "Onboard", "Resumo"] as const;
const NIVEIS = ["Principal", "Oficial", "Apoio", "Media"] as const;
const ESTADOS_RESULTADO = ["DNF", "DNS", "DSQ"] as const;

/** Coleções que o Organizador pode criar, alterar e apagar. */
export const COLECCOES_IA = [
  "eventos", "pilotos", "equipas", "corridas", "noticias", "patrocinadores", "videos",
] as const;
export type ColeccaoIA = (typeof COLECCOES_IA)[number];

const NOME_COLECCAO: Record<ColeccaoIA, string> = {
  eventos: "eventos", pilotos: "pilotos", equipas: "equipas", corridas: "resultados",
  noticias: "notícias", patrocinadores: "patrocinadores", videos: "vídeos",
};

/* ---------------- Esquema da resposta ----------------
   Um valor em falta vem vazio ("" ou 0) e nunca null: cada campo
   que aceita null conta como união, e a API recusa esquemas
   estritos com mais de 16 uniões. As listas de opções também não
   são impostas pela API (o SDK passa-as para a descrição), por
   isso lerResposta() acerta-as antes de validar. */

const VAZIO = "Vazio se não for indicado";
const ZERO = "0 se não for indicado";
const PROVINCIA = z.enum(["", ...PROVINCIAS]).describe("Vazio se não for indicada");
const LISTA_COLECCOES = `Uma de: ${COLECCOES_IA.join(", ")}`;

const Bilhete = z.object({
  nome: z.string(),
  descricao: z.string(),
  preco: z.number().describe("Preço em kwanzas (Kz), só o número"),
  disponiveis: z.number().describe(`Lugares disponíveis; ${ZERO}`),
  beneficios: z.array(z.string()),
});

const Esquema = z.object({
  resumo: z.string().describe("Duas ou três frases sobre o que foi encontrado e o que se propõe mudar"),
  pendentes: z.array(z.string()).describe(
    "Tarefas concretas para a equipa: informação em falta, dúvidas a confirmar, fotografias a pedir",
  ),
  eventos: z.array(z.object({
    titulo: z.string(),
    disciplina: z.enum(DISCIPLINAS),
    provincia: PROVINCIA,
    circuito: z.string(),
    localidade: z.string(),
    dataInicio: z.string().describe("AAAA-MM-DD, ou vazio se não houver data"),
    dataFim: z.string().describe("AAAA-MM-DD, ou vazio"),
    ronda: z.number().describe(`Ronda do campeonato; ${ZERO}`),
    resumo: z.string(),
    descricao: z.string(),
    organizador: z.string().describe(VAZIO),
    horarios: z.array(z.object({ dia: z.string(), hora: z.string(), sessao: z.string() })),
    bilhetes: z.array(Bilhete),
  })).describe("Eventos novos"),
  bilhetesParaEventosExistentes: z.array(z.object({
    eventoSlug: z.string().describe("Slug de um evento da lista de eventos existentes"),
    bilhetes: z.array(Bilhete),
  })),
  pilotos: z.array(z.object({
    nome: z.string(),
    apelido: z.string().describe(`Alcunha; ${VAZIO.toLowerCase()}`),
    numero: z.number().describe(`Número de corrida; ${ZERO}`),
    equipaSlug: z.string().describe("Slug de uma equipa existente; vazio se não pertencer a nenhuma da lista"),
    equipaNome: z.string().describe("Nome da equipa quando não existe na lista; vazio nos outros casos"),
    provincia: PROVINCIA,
    nacionalidade: z.string().describe(VAZIO),
    idade: z.number().describe(ZERO),
    mota: z.string(),
    categoria: z.string().describe("Uma de: MX1, MX2, Rally / Enduro, Velocidade, Moto 4, Karting"),
    bio: z.string(),
    estreia: z.number().describe(`Ano de estreia em competição; ${ZERO}`),
    instagram: z.string().describe(`Endereço; ${VAZIO.toLowerCase()}`),
    facebook: z.string().describe(`Endereço; ${VAZIO.toLowerCase()}`),
  })).describe("Pilotos novos"),
  equipas: z.array(z.object({
    nome: z.string(),
    tipo: z.enum(["Equipa", "Clube"]),
    base: z.string(),
    provincia: PROVINCIA,
    fundacao: z.number().describe(`Ano de fundação; ${ZERO}`),
    chefe: z.string(),
    membros: z.number().describe(ZERO),
    descricao: z.string(),
    motas: z.array(z.string()),
    instagram: z.string().describe(`Endereço; ${VAZIO.toLowerCase()}`),
    facebook: z.string().describe(`Endereço; ${VAZIO.toLowerCase()}`),
  })).describe("Equipas novas"),
  corridas: z.array(z.object({
    nome: z.string(),
    eventoSlug: z.string().describe("Slug de um evento existente; vazio se não houver"),
    ronda: z.number().describe(ZERO),
    circuito: z.string(),
    provincia: PROVINCIA,
    data: z.string().describe("AAAA-MM-DD, ou vazio"),
    categoria: z.string(),
    resultados: z.array(z.object({
      posicao: z.number(),
      piloto: z.string(),
      pilotoSlug: z.string().describe("Slug de um piloto existente; vazio se não corresponder a nenhum"),
      equipa: z.string(),
      voltas: z.number().describe(ZERO),
      tempo: z.string(),
      pontos: z.number().describe(ZERO),
      estado: z.enum(["", ...ESTADOS_RESULTADO]).describe("Vazio se o piloto terminou"),
    })),
  })).describe("Resultados novos"),
  noticias: z.array(z.object({
    titulo: z.string(),
    resumo: z.string(),
    corpo: z.array(z.string()).describe("Parágrafos"),
    categoria: z.enum(CATEGORIAS_NOTICIA),
    tags: z.array(z.string()),
    autor: z.string().describe(VAZIO),
    data: z.string().describe("AAAA-MM-DD, ou vazio"),
  })).describe("Notícias novas"),
  patrocinadores: z.array(z.object({
    nome: z.string(),
    nivel: z.enum(NIVEIS),
    setor: z.string(),
    descricao: z.string(),
    website: z.string(),
  })).describe("Patrocinadores novos"),
  videos: z.array(z.object({
    titulo: z.string(),
    descricao: z.string(),
    categoria: z.enum(CATEGORIAS_VIDEO),
    data: z.string().describe("AAAA-MM-DD, ou vazio"),
    youtube: z.string().describe(`Endereço ou ID do vídeo no YouTube; ${VAZIO.toLowerCase()}`),
  })).describe("Vídeos novos"),
  alteracoes: z.array(z.object({
    coleccao: z.string().describe(LISTA_COLECCOES),
    slug: z.string().describe("Slug de um registo que já existe na plataforma"),
    campos: z.array(z.object({
      campo: z.string().describe("Nome exacto do campo, da lista de campos da coleção"),
      valor: z.string().describe('Valor novo em JSON: "texto" entre aspas, 12, true, ["a","b"] ou {"pontos":120}'),
    })),
    motivo: z.string().describe("Frase curta com o que muda e de onde veio a informação"),
  })).describe("Mudanças a registos que já existem"),
  remocoes: z.array(z.object({
    coleccao: z.string().describe(LISTA_COLECCOES),
    slug: z.string().describe("Slug de um registo que já existe na plataforma"),
    motivo: z.string().describe("Frase curta com a razão, tirada do material"),
  })).describe("Registos que o material pede claramente para apagar"),
});

export type Extraccao = z.infer<typeof Esquema>;

/** Esquema enviado à API: o do SDK, sem a função de leitura automática. */
const FORMATO: Anthropic.Beta.BetaJSONOutputFormat = (() => {
  const { type, schema } = betaZodOutputFormat(Esquema);
  return { type, schema };
})();

/** O mesmo esquema com as listas de opções intactas, para as acertar. */
const ESQUEMA_JSON = z.toJSONSchema(Esquema) as NoEsquema;

/* ---------------- Campos que se podem alterar ----------------
   Tirados de lib/types.ts. Ficam de fora o slug (é a chave), as
   imagens (carregam-se no painel) e o nome da equipa de um piloto,
   que segue sempre a equipa escolhida em equipaSlug. */

export type TipoCampo =
  | "texto" | "longo" | "data" | "numero" | "booleano" | "opcao"
  | "lista" | "paragrafos" | "ligacao" | "ligacoes" | "youtube"
  | "objeto" | "horarios" | "bilhetes" | "resultados";

export interface DefCampo {
  tipo: TipoCampo;
  etiqueta: string;
  /** Explicação para o Claude, quando o nome não chega. */
  nota?: string;
  opcoes?: readonly string[];
  /** Coleção para onde aponta uma ligação. */
  alvo?: "equipas" | "eventos" | "pilotos";
  /** Chaves de um objecto; "texto?" some quando fica vazia. */
  chaves?: Record<string, "texto" | "numero" | "texto?">;
  /** Pode ficar vazio (opcional nos tipos da app). */
  opcional?: boolean;
}

const REDES = { instagram: "texto?", facebook: "texto?" } as const;

const CAMPOS_IA: Record<ColeccaoIA, Record<string, DefCampo>> = {
  eventos: {
    titulo: { tipo: "texto", etiqueta: "Título" },
    disciplina: { tipo: "opcao", etiqueta: "Disciplina", opcoes: DISCIPLINAS },
    ronda: { tipo: "numero", etiqueta: "Ronda", opcional: true },
    temporada: { tipo: "numero", etiqueta: "Temporada", nota: "ano" },
    circuito: { tipo: "texto", etiqueta: "Circuito" },
    provincia: { tipo: "opcao", etiqueta: "Província", opcoes: PROVINCIAS },
    localidade: { tipo: "texto", etiqueta: "Localidade" },
    dataInicio: { tipo: "data", etiqueta: "Início" },
    dataFim: { tipo: "data", etiqueta: "Fim" },
    estado: { tipo: "opcao", etiqueta: "Estado", opcoes: ESTADOS_EVENTO },
    resumo: { tipo: "longo", etiqueta: "Resumo" },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    organizador: { tipo: "texto", etiqueta: "Organizador" },
    horarios: { tipo: "horarios", etiqueta: "Horários" },
    bilhetes: { tipo: "bilhetes", etiqueta: "Bilhetes" },
    distanciaVolta: { tipo: "texto", etiqueta: "Distância da volta", opcional: true },
    numeroVoltas: { tipo: "numero", etiqueta: "Número de voltas", opcional: true },
    recordeVolta: {
      tipo: "objeto", etiqueta: "Recorde da volta", opcional: true,
      chaves: { piloto: "texto", tempo: "texto", ano: "numero" },
    },
  },
  pilotos: {
    nome: { tipo: "texto", etiqueta: "Nome" },
    apelido: { tipo: "texto", etiqueta: "Alcunha", opcional: true },
    numero: { tipo: "numero", etiqueta: "Número", nota: "número de corrida" },
    equipaSlug: { tipo: "ligacao", etiqueta: "Equipa", alvo: "equipas" },
    provincia: { tipo: "opcao", etiqueta: "Província", opcoes: PROVINCIAS },
    nacionalidade: { tipo: "texto", etiqueta: "Nacionalidade" },
    idade: { tipo: "numero", etiqueta: "Idade" },
    mota: { tipo: "texto", etiqueta: "Mota" },
    categoria: { tipo: "texto", etiqueta: "Categoria", nota: "MX1, MX2, Rally / Enduro, Velocidade, Moto 4 ou Karting" },
    bio: { tipo: "longo", etiqueta: "Biografia" },
    estreia: { tipo: "numero", etiqueta: "Estreia", nota: "ano de estreia" },
    estatisticas: {
      tipo: "objeto", etiqueta: "Estatísticas",
      chaves: {
        pontos: "numero", vitorias: "numero", podios: "numero", poles: "numero",
        corridas: "numero", melhorResultado: "texto",
      },
    },
    redes: { tipo: "objeto", etiqueta: "Redes sociais", chaves: REDES, nota: "endereços completos" },
    campeonatos: { tipo: "numero", etiqueta: "Campeonatos", nota: "títulos nacionais" },
  },
  equipas: {
    nome: { tipo: "texto", etiqueta: "Nome" },
    tipo: { tipo: "opcao", etiqueta: "Tipo", opcoes: ["Equipa", "Clube"] },
    base: { tipo: "texto", etiqueta: "Base" },
    provincia: { tipo: "opcao", etiqueta: "Província", opcoes: PROVINCIAS },
    fundacao: { tipo: "numero", etiqueta: "Fundação", nota: "ano" },
    chefe: { tipo: "texto", etiqueta: "Chefe de equipa" },
    membros: { tipo: "numero", etiqueta: "Membros" },
    pilotos: { tipo: "ligacoes", etiqueta: "Pilotos", alvo: "pilotos" },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    motas: { tipo: "lista", etiqueta: "Motas" },
    cor: { tipo: "texto", etiqueta: "Cor", nota: "hexadecimal, ex.: #e10600" },
    estatisticas: {
      tipo: "objeto", etiqueta: "Estatísticas",
      chaves: { pontos: "numero", vitorias: "numero", podios: "numero", titulos: "numero" },
    },
    redes: { tipo: "objeto", etiqueta: "Redes sociais", chaves: REDES, nota: "endereços completos" },
  },
  corridas: {
    nome: { tipo: "texto", etiqueta: "Nome" },
    eventoSlug: { tipo: "ligacao", etiqueta: "Evento", alvo: "eventos" },
    ronda: { tipo: "numero", etiqueta: "Ronda" },
    temporada: { tipo: "numero", etiqueta: "Temporada", nota: "ano" },
    circuito: { tipo: "texto", etiqueta: "Circuito" },
    provincia: { tipo: "opcao", etiqueta: "Província", opcoes: PROVINCIAS },
    data: { tipo: "data", etiqueta: "Data" },
    categoria: { tipo: "texto", etiqueta: "Categoria" },
    vencedor: { tipo: "texto", etiqueta: "Vencedor", nota: "acerta-se sozinho quando mudam os resultados" },
    resultados: { tipo: "resultados", etiqueta: "Resultados" },
  },
  noticias: {
    titulo: { tipo: "texto", etiqueta: "Título" },
    resumo: { tipo: "longo", etiqueta: "Resumo" },
    corpo: { tipo: "paragrafos", etiqueta: "Texto" },
    categoria: { tipo: "opcao", etiqueta: "Categoria", opcoes: CATEGORIAS_NOTICIA },
    tags: { tipo: "lista", etiqueta: "Etiquetas" },
    autor: { tipo: "texto", etiqueta: "Autor" },
    data: { tipo: "data", etiqueta: "Data" },
    leitura: { tipo: "numero", etiqueta: "Leitura", nota: "minutos" },
    destaque: { tipo: "booleano", etiqueta: "Em destaque" },
    fonte: { tipo: "texto", etiqueta: "Fonte", opcional: true },
    fonteUrl: { tipo: "texto", etiqueta: "Endereço da fonte", opcional: true },
  },
  patrocinadores: {
    nome: { tipo: "texto", etiqueta: "Nome" },
    nivel: { tipo: "opcao", etiqueta: "Nível", opcoes: NIVEIS },
    setor: { tipo: "texto", etiqueta: "Setor" },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    website: { tipo: "texto", etiqueta: "Website" },
    desde: { tipo: "numero", etiqueta: "Desde", nota: "ano" },
  },
  videos: {
    titulo: { tipo: "texto", etiqueta: "Título" },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    duracao: { tipo: "texto", etiqueta: "Duração", nota: "m:ss" },
    data: { tipo: "data", etiqueta: "Data" },
    categoria: { tipo: "opcao", etiqueta: "Categoria", opcoes: CATEGORIAS_VIDEO },
    visualizacoes: { tipo: "numero", etiqueta: "Visualizações" },
    evento: { tipo: "texto", etiqueta: "Evento", opcional: true, nota: "título do evento" },
    videoId: { tipo: "youtube", etiqueta: "Vídeo do YouTube", opcional: true, nota: "endereço ou ID do YouTube" },
  },
};

/** Nome da equipa de um piloto: só muda em conjunto com equipaSlug. */
const DEF_NOME_EQUIPA: DefCampo = { tipo: "texto", etiqueta: "Nome da equipa" };

/** Outros nomes que o Claude possa usar para um campo. */
const SINONIMOS: Partial<Record<ColeccaoIA, Record<string, string>>> = {
  pilotos: { equipa: "equipaSlug" },
  corridas: { evento: "eventoSlug" },
  videos: { youtube: "videoId", video: "videoId" },
};

function formaDoCampo(d: DefCampo): string {
  switch (d.tipo) {
    case "data": return "AAAA-MM-DD";
    case "numero": return "número inteiro";
    case "booleano": return "true ou false";
    case "opcao": return `uma de: ${d.opcoes?.join(", ")}`;
    case "lista": return "lista de textos";
    case "paragrafos": return "lista de parágrafos";
    case "ligacao": return `slug de ${d.alvo}, ou "" para nenhum`;
    case "ligacoes": return `lista de slugs de ${d.alvo}`;
    case "youtube": return "texto";
    case "objeto": return `objecto {${Object.entries(d.chaves ?? {}).map(([k, t]) => `${k}: ${t === "numero" ? "número" : "texto"}`).join(", ")}}`;
    case "horarios": return 'lista de {"dia","hora","sessao"}';
    case "bilhetes": return 'lista de {"id","nome","descricao","preco","disponiveis","beneficios"}';
    case "resultados": return 'lista de {"posicao","piloto","pilotoSlug","equipa","voltas","tempo","pontos","estado"}';
    default: return "texto";
  }
}

const GUIA_CAMPOS = COLECCOES_IA.map((c) => {
  const campos = Object.entries(CAMPOS_IA[c]).map(([nome, d]) => {
    const extra = [formaDoCampo(d), d.nota, d.opcional ? "pode ficar vazio" : ""].filter(Boolean).join("; ");
    return `${nome} (${extra})`;
  });
  return `- ${c}: ${campos.join(", ")}`;
}).join("\n");

const SISTEMA = `És o assistente de organização da Motobox Angola, a plataforma do motociclismo angolano.
A equipa cola material em bruto (mensagens de WhatsApp, texto de cartazes, listas de preços, biografias, resultados, fotografias, PDF) ou pede mudanças ao que já está publicado, e tu arrumas tudo em propostas prontas a rever. Nada é gravado sem a equipa confirmar.

O que podes propor:
- Registos novos em eventos, pilotos, equipas, corridas (resultados), noticias, patrocinadores e videos.
- Bilhetes novos para um evento que já existe, em "bilhetesParaEventosExistentes".
- Alterações a registos que já existem, em "alteracoes".
- Remoções de registos que já existem, em "remocoes".

Regras gerais:
- Usa só o que está no material. Não inventes datas, preços, números nem nomes. O que faltar fica vazio ("" ou 0) e vai para "pendentes".
- Antes de criar algo, compara com os registos existentes que te são dados. Se o evento, piloto ou equipa já existir, não o repitas: liga-o pelo slug (equipaSlug, eventoSlug, pilotoSlug), acrescenta bilhetes em "bilhetesParaEventosExistentes" ou altera-o em "alteracoes".
- Preços em kwanzas (Kz). "5 mil" é 5000.
- Datas no formato AAAA-MM-DD. Se o ano não for dito, assume a temporada indicada.
- Escreve em português de Angola, frases claras e curtas. Nunca uses travessões (— ou –) nos textos.
- "pendentes" são tarefas concretas para a equipa, por exemplo "Confirmar a hora de abertura das portas do GP do Namibe" ou "Pedir fotografia do piloto Nelson Kiala".
- Se o material não tiver nada útil, devolve listas vazias e explica no resumo.

Alterações ("alteracoes"):
- Uma entrada por registo, com o slug exacto que aparece nos registos existentes e só os campos que mudam. O slug nunca muda.
- "valor" é o valor novo escrito em JSON: texto entre aspas ("Tundavala MX"), números sem aspas (12), true ou false, listas e objectos em JSON. Datas como texto ("2026-10-12").
- Listas (bilhetes, horarios, resultados, corpo, tags, motas, pilotos de uma equipa) levam a lista completa como deve ficar: parte da lista actual e aplica a mudança. Nos bilhetes, mantém o "id" dos que já existem.
- Objectos (estatisticas, redes, recordeVolta) podem levar só as chaves que mudam, por exemplo campo "estatisticas" com valor {"pontos": 120}.
- Piloto que muda de equipa: altera só "equipaSlug". O nome da equipa e as listas de pilotos das equipas acertam-se sozinhos. Se a equipa nova ainda não existir, cria-a em "equipas" e usa o nome dela como valor.
- Evento com novas datas: altera "dataInicio" e "dataFim".
- Nos registos existentes, os textos longos vêm cortados e terminam em "…", e o corpo das notícias mostra só os primeiros parágrafos. Para mudar um texto desses, escreve o texto novo completo; se não o tiveres, deixa a tarefa em "pendentes".
- imagem, foto, logo e thumbnail aparecem só como true ou false (se existe) e não se alteram aqui: as imagens carregam-se no painel.

Remoções ("remocoes"):
- Só quando o material pede claramente para apagar ou retirar algo, ou quando um evento foi cancelado (a plataforma não tem estado "cancelado"). Num evento cancelado, junta em "pendentes" a tarefa de avisar quem já comprou bilhetes.
- Um evento adiado para outra data não se apaga: alteram-se as datas.
- A suspeita de um registo duplicado não é motivo para apagar: deixa a dúvida em "pendentes".

Campos de cada coleção (usa estes nomes em "alteracoes"):
${GUIA_CAMPOS}`;

/* ---------------- Contexto e resultado ---------------- */

/** Registos que já existem, lidos da base de dados antes de cada análise. */
export interface Contexto {
  temporada: number;
  eventos: Evento[];
  pilotos: Piloto[];
  equipas: Equipa[];
  corridas: Corrida[];
  noticias: Noticia[];
  patrocinadores: Patrocinador[];
  videos: Video[];
}

export interface Ficheiro { nome: string; tipo: string; dados: string }

/** Um campo a alterar, com o valor actual e o proposto. */
export interface CampoAlterado extends Omit<DefCampo, "nota"> {
  campo: string;
  antes: unknown;
  depois: unknown;
}

export type Proposta =
  | { tipo: "criar"; coleccao: "eventos"; registo: Evento; avisos: string[] }
  | { tipo: "criar"; coleccao: "pilotos"; registo: Piloto; avisos: string[] }
  | { tipo: "criar"; coleccao: "equipas"; registo: Equipa; avisos: string[] }
  | { tipo: "criar"; coleccao: "corridas"; registo: Corrida; avisos: string[] }
  | { tipo: "criar"; coleccao: "noticias"; registo: Noticia; avisos: string[] }
  | { tipo: "criar"; coleccao: "patrocinadores"; registo: Patrocinador; avisos: string[] }
  | { tipo: "criar"; coleccao: "videos"; registo: Video; avisos: string[] }
  | { tipo: "bilhetes"; coleccao: "eventos"; eventoSlug: string; eventoTitulo: string; bilhetes: TipoBilhete[]; avisos: string[] }
  | {
      tipo: "alterar"; coleccao: ColeccaoIA; slug: string; titulo: string;
      motivo: string; campos: CampoAlterado[]; avisos: string[];
    }
  | { tipo: "apagar"; coleccao: ColeccaoIA; slug: string; titulo: string; motivo: string; avisos: string[] };

export type PropostaAlterar = Extract<Proposta, { tipo: "alterar" }>;

export interface ResultadoOrganizador {
  resumo: string;
  pendentes: string[];
  propostas: Proposta[];
}

type Registo = Record<string, unknown>;

const registosDe = (ctx: Contexto, c: ColeccaoIA) => ctx[c] as unknown as Registo[];

/* ---------------- Registos existentes para o Claude ---------------- */

const IMAGENS = new Set(["imagem", "foto", "logo", "thumbnail"]);
const CORTE = 240;
const MAXIMO_POR_COLECCAO = 150;

const cortar = (s: string) => (s.length > CORTE ? `${s.slice(0, CORTE).trimEnd()}…` : s);

function compactar(valor: unknown, chave = ""): unknown {
  if (IMAGENS.has(chave)) return Boolean(valor);
  if (typeof valor === "string") return cortar(valor);
  if (Array.isArray(valor)) {
    if (chave === "corpo") {
      const paragrafos = valor.map((p) => cortar(String(p)));
      return paragrafos.length > 2
        ? [...paragrafos.slice(0, 2), `… (mais ${paragrafos.length - 2} parágrafos)`]
        : paragrafos;
    }
    return valor.map((v) => compactar(v));
  }
  if (eObjeto(valor)) {
    return Object.fromEntries(
      Object.entries(valor)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, compactar(v, k)]),
    );
  }
  return valor;
}

const dataDe = (r: Registo) => String(r.dataInicio ?? r.data ?? "");

/**
 * Registos completos mas compactos: textos longos cortados, imagens
 * reduzidas a true/false e, nas coleções grandes, só os mais recentes.
 */
export function registosParaClaude(ctx: Contexto): Record<string, unknown> {
  const saida: Record<string, unknown> = {};
  for (const c of COLECCOES_IA) {
    const lista = [...registosDe(ctx, c)].sort((a, b) => dataDe(b).localeCompare(dataDe(a)));
    saida[c] = lista.slice(0, MAXIMO_POR_COLECCAO).map((r) => compactar(r));
    if (lista.length > MAXIMO_POR_COLECCAO) {
      saida[`${c}Omitidos`] = lista.length - MAXIMO_POR_COLECCAO;
    }
  }
  return saida;
}

/* ---------------- Chamada ao Claude ---------------- */

export class ErroOrganizador extends Error {
  constructor(mensagem: string, public codigo = 500) { super(mensagem); }
}

function traduzirErro(e: unknown): never {
  if (e instanceof Anthropic.APIUserAbortError || e instanceof Anthropic.APIConnectionTimeoutError
    || (e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError"))) {
    throw new ErroOrganizador("A análise demorou demasiado. Divida o material em partes mais pequenas e tente de novo.", 504);
  }
  if (e instanceof Anthropic.AuthenticationError) {
    throw new ErroOrganizador(
      "A chave ANTHROPIC_API_KEY foi recusada. Crie uma chave nova em console.anthropic.com, substitua-a no Vercel (Settings → Environment Variables) e faça Redeploy.",
      503,
    );
  }
  if (e instanceof Anthropic.PermissionDeniedError) {
    throw new ErroOrganizador("A chave da API não tem acesso ao modelo do Claude. Verifique a conta em console.anthropic.com.", 503);
  }
  if (e instanceof Anthropic.RateLimitError) throw new ErroOrganizador("Demasiados pedidos ao Claude. Tente daqui a um minuto.", 429);
  if (e instanceof Anthropic.BadRequestError) throw new ErroOrganizador(`O pedido foi recusado: ${e.message}`, 400);
  if (e instanceof Anthropic.APIConnectionError) throw new ErroOrganizador("Não foi possível contactar o serviço do Claude. Tente de novo.", 502);
  if (e instanceof Anthropic.APIError) throw new ErroOrganizador(`O serviço do Claude falhou (${e.status}). Tente de novo.`, 502);
  throw e;
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
    ...registosParaClaude(contexto),
  };

  conteudo.push({
    type: "text",
    text: `Registos que já existem na plataforma:\n${JSON.stringify(existentes)}\n\nMaterial a organizar:\n${texto || "(ver ficheiros anexos)"}`,
  });

  // Em streaming, para que uma resposta longa não esbarre nos limites
  // de tempo do HTTP; só interessa a mensagem final.
  let resposta: Anthropic.Beta.BetaMessage;
  try {
    const stream = client.beta.messages.stream(
      {
        model: MODELO,
        max_tokens: 64000,
        betas: ["server-side-fallback-2026-07-01", "structured-outputs-2025-12-15"],
        fallbacks: "default",
        system: SISTEMA,
        messages: [{ role: "user", content: conteudo }],
        output_config: { format: FORMATO },
      },
      { signal: AbortSignal.timeout(TEMPO_MAXIMO_MS) },
    );
    resposta = await stream.finalMessage();
  } catch (e) {
    traduzirErro(e);
  }

  // Primeiro o motivo de paragem: numa recusa ou num corte o texto
  // não é JSON completo e lê-lo daria um erro sem explicação.
  if (resposta.stop_reason === "refusal") {
    throw new ErroOrganizador("O Claude recusou analisar este material.", 422);
  }
  if (resposta.stop_reason === "max_tokens") {
    throw new ErroOrganizador("O material é demasiado extenso para uma só análise. Divida-o em partes.", 413);
  }

  const { dados, notas } = lerResposta(resposta.content);
  const resultado = propostasDe(dados, contexto);
  resultado.pendentes.push(...notas);
  return resultado;
}

/* ---------------- Leitura da resposta ---------------- */

interface NoEsquema {
  enum?: unknown[];
  properties?: Record<string, NoEsquema>;
  items?: NoEsquema;
}

/** Compara textos sem maiúsculas nem acentos. */
function normal(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function eObjeto(v: unknown): v is Registo {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Acerta valores de listas de opções (a API não as impõe e pode mudar
 * maiúsculas). Um valor desconhecido passa a vazio ou à primeira
 * opção, com uma nota para a equipa, em vez de deitar tudo fora.
 */
function normalizarOpcoes(valor: unknown, no: NoEsquema, caminho: string, notas: string[]): unknown {
  if (Array.isArray(no.enum) && typeof valor === "string") {
    const opcoes = no.enum.filter((o): o is string => typeof o === "string");
    if (opcoes.includes(valor)) return valor;
    const igual = opcoes.find((o) => normal(o) === normal(valor));
    if (igual !== undefined) return igual;
    const recurso = opcoes.includes("") ? "" : opcoes[0];
    notas.push(`O Claude devolveu "${valor}" em ${caminho}, fora das opções. Ficou "${recurso || "vazio"}": confirme.`);
    return recurso;
  }
  if (Array.isArray(valor) && no.items) {
    const itens = no.items;
    return valor.map((v, i) => normalizarOpcoes(v, itens, `${caminho} ${i + 1}`, notas));
  }
  if (eObjeto(valor) && no.properties) {
    const saida: Registo = { ...valor };
    for (const [k, filho] of Object.entries(no.properties)) {
      if (k in saida) saida[k] = normalizarOpcoes(saida[k], filho, caminho ? `${caminho}, ${k}` : k, notas);
    }
    return saida;
  }
  return valor;
}

/**
 * Lê o JSON da resposta. Com o fallback do servidor, uma resposta
 * pode vir em mais de um bloco de texto (o parcial do primeiro
 * modelo e a continuação do segundo), por isso tenta-se o texto
 * todo junto e depois só o último bloco.
 */
export function lerResposta(blocos: readonly { type: string; text?: string }[]): { dados: Extraccao; notas: string[] } {
  const textos = blocos.filter((b) => b.type === "text").map((b) => b.text ?? "");
  for (const t of [textos.join(""), textos.at(-1) ?? ""]) {
    let bruto: unknown;
    try { bruto = JSON.parse(t); } catch { continue; }
    const notas: string[] = [];
    const r = Esquema.safeParse(normalizarOpcoes(bruto, ESQUEMA_JSON, "", notas));
    if (r.success) return { dados: r.data, notas };
    console.error("[organizador] resposta fora do esquema", r.error.issues.slice(0, 5));
  }
  throw new ErroOrganizador("Não foi possível ler a resposta do Claude. Tente de novo.", 502);
}

/* ---------------- Valores ---------------- */

function slugify(texto: string): string {
  return texto
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const hoje = () => new Date().toISOString().slice(0, 10);

function idYoutube(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined;
  const m = /(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/.exec(valor);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(valor.trim()) ? valor.trim() : undefined;
}

/** O valor chega como JSON; se não for JSON válido, fica o texto tal qual. */
function lerValor(bruto: string): unknown {
  const t = bruto.trim();
  if (t === "") return "";
  try { return JSON.parse(t); } catch { return t; }
}

const mostrar = (v: unknown) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
};

function paraTexto(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

function paraNumero(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v !== "string") return undefined;
  let t = v.replace(/kz|kwanzas?/gi, "").replace(/\s/g, "");
  const mil = /^(\d+(?:[.,]\d+)?)mil$/i.exec(t);
  if (mil) return Number(mil[1].replace(",", ".")) * 1000;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, "");
  t = t.replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : undefined;
}

function paraBooleano(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  const t = paraTexto(v);
  if (t === undefined) return undefined;
  if (["true", "sim", "verdadeiro", "1"].includes(normal(t))) return true;
  if (["false", "nao", "falso", "0"].includes(normal(t))) return false;
  return undefined;
}

/** AAAA-MM-DD a partir de uma data ISO (com ou sem hora) ou DD/MM/AAAA. */
function paraData(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  let iso: string | undefined;
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  const b = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  if (a) iso = `${a[1]}-${a[2]}-${a[3]}`;
  else if (b) iso = `${b[3]}-${b[2].padStart(2, "0")}-${b[1].padStart(2, "0")}`;
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso ? iso : undefined;
}

function paraLista(v: unknown, separador = /\n|,|;/): string[] {
  const itens = Array.isArray(v) ? v.map(paraTexto) : (paraTexto(v) ?? "").split(separador);
  return itens.map((s) => (s ?? "").trim()).filter(Boolean);
}

function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

const diasEntre = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Slug de um registo a partir do slug, de algo parecido ou do nome. */
function resolverLigacao(valor: string, mapa: Map<string, string>): string | undefined {
  const v = valor.trim();
  if (!v) return undefined;
  if (mapa.has(v)) return v;
  const alvo = slugify(v);
  if (mapa.has(alvo)) return alvo;
  const porNome = [...mapa].filter(([, nome]) => slugify(nome) === alvo);
  return porNome.length === 1 ? porNome[0][0] : undefined;
}

/* ---------------- Validação de um campo alterado ---------------- */

type Coagido = { ok: true; valor: unknown; avisos: string[] } | { ok: false; erro: string };
const aceite = (valor: unknown, avisos: string[] = []): Coagido => ({ ok: true, valor, avisos });
const recusado = (erro: string): Coagido => ({ ok: false, erro });

interface Referencias {
  equipas: Map<string, string>;
  eventos: Map<string, string>;
  pilotos: Map<string, string>;
}

function paraObjeto(def: DefCampo, v: unknown, antes: unknown): Coagido {
  if (v === null && def.opcional) return aceite(null);
  if (!eObjeto(v)) return recusado('Esperava um objecto, por exemplo {"pontos": 120}.');
  const chaves = def.chaves ?? {};
  // Parte do valor actual: mudar os pontos não apaga as vitórias.
  const saida: Registo = eObjeto(antes) ? { ...antes } : {};
  const avisos: string[] = [];
  for (const [k, bruto] of Object.entries(v)) {
    const chave = Object.keys(chaves).find((c) => normal(c) === normal(k));
    if (!chave) { avisos.push(`${def.etiqueta}: "${k}" não existe e foi ignorado.`); continue; }
    if (chaves[chave] === "numero") {
      const n = paraNumero(bruto);
      if (n === undefined || n < 0) { avisos.push(`${def.etiqueta}: "${mostrar(bruto)}" não é um número válido para ${chave}.`); continue; }
      saida[chave] = Math.round(n);
    } else {
      const s = bruto === null ? "" : paraTexto(bruto);
      if (s === undefined) { avisos.push(`${def.etiqueta}: ${chave} tem de ser texto.`); continue; }
      if (s === "" && chaves[chave] === "texto?") delete saida[chave];
      else saida[chave] = s;
    }
  }
  for (const [chave, tipo] of Object.entries(chaves)) {
    if (saida[chave] === undefined && tipo !== "texto?") saida[chave] = tipo === "numero" ? 0 : "";
  }
  return aceite(saida, avisos);
}

function paraHorarios(v: unknown): Coagido {
  if (!Array.isArray(v)) return recusado('Esperava uma lista de {"dia","hora","sessao"}.');
  return aceite(v.map((h) => (eObjeto(h)
    ? { dia: paraTexto(h.dia) ?? "", hora: paraTexto(h.hora) ?? "", sessao: paraTexto(h.sessao) ?? "" }
    : { dia: "", hora: "", sessao: paraTexto(h) ?? "" })));
}

/**
 * Bilhetes: cada um liga-se ao existente pelo id ou pelo nome, para
 * manter o id (as encomendas apontam para ele) e o que não foi dito.
 */
function paraBilhetes(v: unknown, antes: TipoBilhete[]): Coagido {
  if (!Array.isArray(v)) return recusado("Esperava a lista completa de bilhetes.");
  const porId = new Map(antes.map((b) => [b.id, b]));
  const porNome = new Map(antes.map((b) => [slugify(b.nome), b]));
  const ids = new Set<string>();
  const lista: TipoBilhete[] = [];
  for (const [i, item] of v.entries()) {
    if (!eObjeto(item)) return recusado(`O bilhete ${i + 1} não está no formato certo.`);
    const nome = paraTexto(item.nome) ?? "";
    const anterior = (typeof item.id === "string" ? porId.get(item.id) : undefined) ?? porNome.get(slugify(nome));
    const nomeFinal = nome || anterior?.nome || "";
    if (!nomeFinal) return recusado(`O bilhete ${i + 1} não tem nome.`);
    const preco = item.preco === undefined ? anterior?.preco : paraNumero(item.preco);
    if (preco === undefined || preco < 0) return recusado(`O bilhete ${nomeFinal} não tem um preço válido.`);
    const raiz = anterior?.id ?? (slugify(nomeFinal) || "bilhete");
    let id = raiz;
    for (let n = 2; ids.has(id); n++) id = `${raiz}-${n}`;
    ids.add(id);
    const destaque = item.destaque === undefined ? anterior?.destaque : paraBooleano(item.destaque);
    lista.push({
      id, nome: nomeFinal,
      descricao: paraTexto(item.descricao) ?? anterior?.descricao ?? "",
      preco: Math.round(preco),
      disponiveis: Math.max(0, Math.round(paraNumero(item.disponiveis) ?? anterior?.disponiveis ?? 0)),
      beneficios: item.beneficios === undefined ? anterior?.beneficios ?? [] : paraLista(item.beneficios, /\n|;/),
      ...(destaque ? { destaque: true } : {}),
    });
  }
  return aceite(lista);
}

function paraResultados(v: unknown, pilotos: Map<string, string>): Coagido {
  if (!Array.isArray(v)) return recusado("Esperava a lista completa de resultados.");
  const lista: ResultadoCorrida[] = [];
  const semFicha: string[] = [];
  for (const [i, item] of v.entries()) {
    if (!eObjeto(item)) return recusado(`O resultado ${i + 1} não está no formato certo.`);
    const piloto = paraTexto(item.piloto) ?? "";
    if (!piloto) return recusado(`O resultado ${i + 1} não tem piloto.`);
    const pedido = paraTexto(item.pilotoSlug) ?? "";
    const slug = (pedido && pilotos.has(pedido) ? pedido : undefined) ?? resolverLigacao(piloto, pilotos);
    if (!slug) semFicha.push(piloto);
    const estado = ESTADOS_RESULTADO.find((e) => e === (paraTexto(item.estado) ?? "").toUpperCase());
    lista.push({
      posicao: Math.round(paraNumero(item.posicao) ?? i + 1),
      pilotoSlug: slug ?? slugify(piloto),
      piloto,
      equipa: paraTexto(item.equipa) ?? "",
      voltas: Math.round(paraNumero(item.voltas) ?? 0),
      tempo: paraTexto(item.tempo) ?? "",
      pontos: Math.round(paraNumero(item.pontos) ?? 0),
      ...(paraBooleano(item.melhorVolta) ? { melhorVolta: true } : {}),
      ...(estado ? { estado } : {}),
    });
  }
  return aceite(lista, semFicha.length ? [`Pilotos sem ficha na plataforma: ${semFicha.join(", ")}.`] : []);
}

/** Valida e converte um valor novo para a forma do campo. */
function coagir(def: DefCampo, v: unknown, antes: unknown, refs: Referencias): Coagido {
  const vazio = v === null || v === "";
  switch (def.tipo) {
    case "texto":
    case "longo": {
      if (vazio) return aceite(def.opcional ? null : "");
      const s = paraTexto(v);
      return s === undefined ? recusado("Esperava texto.") : aceite(s);
    }
    case "data": {
      const d = paraData(v);
      return d ? aceite(d) : recusado(`"${mostrar(v)}" não é uma data válida (AAAA-MM-DD).`);
    }
    case "numero": {
      if (vazio && def.opcional) return aceite(null);
      const n = paraNumero(v);
      if (n === undefined || n < 0) return recusado(`"${mostrar(v)}" não é um número válido.`);
      const inteiro = Math.round(n);
      return aceite(inteiro, inteiro !== n ? [`${def.etiqueta}: ${n} foi arredondado para ${inteiro}.`] : []);
    }
    case "booleano": {
      const b = paraBooleano(v);
      return b === undefined ? recusado("Esperava sim ou não (true ou false).") : aceite(b);
    }
    case "opcao": {
      const s = paraTexto(v) ?? "";
      const opcao = def.opcoes?.find((o) => normal(o) === normal(s));
      return opcao ? aceite(opcao) : recusado(`"${mostrar(v)}" não é uma das opções (${def.opcoes?.join(", ")}).`);
    }
    case "lista":
      return Array.isArray(v) || typeof v === "string" ? aceite(paraLista(v)) : recusado("Esperava uma lista.");
    case "paragrafos":
      return Array.isArray(v) || typeof v === "string"
        ? aceite(paraLista(v, /\n\s*\n/))
        : recusado("Esperava uma lista de parágrafos.");
    case "ligacao": {
      if (vazio) return aceite("");
      const mapa = refs[def.alvo ?? "equipas"];
      const s = paraTexto(v);
      const slug = s === undefined ? undefined : resolverLigacao(s, mapa);
      return slug ? aceite(slug) : recusado(`"${mostrar(v)}" não corresponde a nenhum registo de ${def.alvo}.`);
    }
    case "ligacoes": {
      if (!Array.isArray(v) && typeof v !== "string") return recusado("Esperava uma lista de slugs.");
      const mapa = refs[def.alvo ?? "pilotos"];
      const slugs: string[] = [];
      const avisos: string[] = [];
      for (const item of paraLista(v)) {
        const s = resolverLigacao(item, mapa);
        if (!s) avisos.push(`${def.etiqueta}: "${item}" não existe na plataforma e ficou de fora.`);
        else if (!slugs.includes(s)) slugs.push(s);
      }
      return aceite(slugs, avisos);
    }
    case "youtube": {
      if (vazio) return aceite(null);
      const id = idYoutube(paraTexto(v));
      return id ? aceite(id) : recusado(`"${mostrar(v)}" não é um endereço nem um ID do YouTube.`);
    }
    case "objeto": return paraObjeto(def, v, antes);
    case "horarios": return paraHorarios(v);
    case "bilhetes": return paraBilhetes(v, Array.isArray(antes) ? (antes as TipoBilhete[]) : []);
    case "resultados": return paraResultados(v, refs.pilotos);
  }
}

/** Vazio, null e ausente contam como o mesmo valor; datas só pelo dia. */
function iguais(def: DefCampo, a: unknown, b: unknown): boolean {
  const n = (v: unknown) => (v === undefined || v === "" ? null : v);
  if (def.tipo === "data" && typeof a === "string" && typeof b === "string") return a.slice(0, 10) === b.slice(0, 10);
  return JSON.stringify(n(a)) === JSON.stringify(n(b));
}

function semNota(def: DefCampo): Omit<DefCampo, "nota"> {
  const { nota: _nota, ...resto } = def;
  void _nota;
  return resto;
}

function coleccaoDe(nome: string): ColeccaoIA | undefined {
  const n = normal(nome);
  const sinonimos: Record<string, ColeccaoIA> = {
    resultado: "corridas", resultados: "corridas", corrida: "corridas",
    patrocinador: "patrocinadores", evento: "eventos", piloto: "pilotos",
    equipa: "equipas", noticia: "noticias", video: "videos",
  };
  return COLECCOES_IA.find((c) => c === n) ?? sinonimos[n];
}

function campoDe(coleccao: ColeccaoIA, nome: string): string | undefined {
  const chave = normal(nome).replace(/[\s_-]/g, "");
  return Object.keys(CAMPOS_IA[coleccao]).find((c) => c.toLowerCase() === chave)
    ?? SINONIMOS[coleccao]?.[chave];
}

const tituloDe = (r: Registo) => String(r.titulo ?? r.nome ?? r.slug ?? "");

/** Encontra o registo pelo slug exacto, por um slug parecido ou pelo nome. */
function encontrar(ctx: Contexto, coleccao: ColeccaoIA, pedido: string): Registo | undefined {
  const lista = registosDe(ctx, coleccao);
  const alvo = slugify(pedido);
  const exacto = lista.find((r) => r.slug === pedido.trim()) ?? lista.find((r) => slugify(String(r.slug)) === alvo);
  if (exacto) return exacto;
  const porNome = lista.filter((r) => slugify(tituloDe(r)) === alvo);
  return porNome.length === 1 ? porNome[0] : undefined;
}

function avisosRemocao(ctx: Contexto, coleccao: ColeccaoIA, slug: string, registo: Registo): string[] {
  const avisos: string[] = [];
  if (coleccao === "eventos") {
    const corridas = ctx.corridas.filter((c) => c.eventoSlug === slug).length;
    if (corridas) avisos.push(`${plural(corridas, "resultado ligado", "resultados ligados")} a este evento ${corridas === 1 ? "fica" : "ficam"} sem evento.`);
    if (Array.isArray(registo.bilhetes) && registo.bilhetes.length > 0) {
      avisos.push("O evento tem bilhetes à venda: avise quem já comprou antes de o apagar.");
    }
  }
  if (coleccao === "pilotos") {
    const equipas = ctx.equipas.filter((e) => e.pilotos?.includes(slug)).map((e) => e.nome);
    if (equipas.length) avisos.push(`Continua na lista de pilotos de ${equipas.join(", ")}: retire-o lá também.`);
    const corridas = ctx.corridas.filter((c) => c.resultados?.some((r) => r.pilotoSlug === slug)).length;
    if (corridas) avisos.push(`Aparece em ${plural(corridas, "resultado", "resultados")} de corridas, que ficam como estão.`);
  }
  if (coleccao === "equipas") {
    const pilotos = ctx.pilotos.filter((p) => p.equipaSlug === slug).map((p) => p.nome);
    if (pilotos.length) avisos.push(`${pilotos.join(", ")} ${pilotos.length === 1 ? "fica" : "ficam"} sem equipa ligada.`);
  }
  return avisos;
}

/* ---------------- Da extracção às propostas ---------------- */

export function propostasDe(x: Extraccao, ctx: Contexto): ResultadoOrganizador {
  const pendentes = [...x.pendentes];
  const ocupados = new Map<string, Set<string>>(
    COLECCOES_IA.map((c) => [c, new Set(registosDe(ctx, c).map((r) => String(r.slug)))]),
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
  const provincia = (p: Provincia | "", avisos: string[]): Provincia => {
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
        disponiveis: Math.max(0, b.disponiveis), beneficios: b.beneficios,
      };
    });
  };

  const equipasExistentes = new Map(ctx.equipas.map((e) => [e.slug, e.nome]));
  const eventosExistentes = new Map(ctx.eventos.map((e) => [e.slug, e]));
  const pilotosExistentes = new Set(ctx.pilotos.map((p) => p.slug));
  const propostas: Proposta[] = [];

  /** Entradas e saídas de pilotos nas equipas, para acertar as listas no fim. */
  const movimentos: { piloto: string; de: string; para: string }[] = [];

  // Equipas primeiro: os pilotos novos podem ligar-se a elas.
  const equipasNovas = new Map<string, Equipa>();
  for (const e of x.equipas) {
    const avisos: string[] = [];
    const registo: Equipa = {
      slug: slugLivre("equipas", e.nome), nome: e.nome, tipo: e.tipo, base: e.base,
      provincia: provincia(e.provincia, avisos),
      fundacao: e.fundacao || new Date().getFullYear(), logo: "", cor: "#e10600",
      chefe: e.chefe, membros: e.membros, pilotos: [], descricao: e.descricao, motas: e.motas,
      estatisticas: { pontos: 0, vitorias: 0, podios: 0, titulos: 0 },
      redes: { ...(e.instagram ? { instagram: e.instagram } : {}), ...(e.facebook ? { facebook: e.facebook } : {}) },
    };
    equipasNovas.set(registo.slug, registo);
    propostas.push({ tipo: "criar", coleccao: "equipas", avisos, registo });
  }
  const novaPorNome = (nome: string) =>
    [...equipasNovas.values()].find((e) => normal(e.nome) === normal(nome));

  const pilotosNovos = new Map<string, string>();
  for (const p of x.pilotos) {
    const avisos: string[] = [];
    let equipaSlug = "";
    let equipa = p.equipaNome;
    if (p.equipaSlug && equipasExistentes.has(p.equipaSlug)) {
      equipaSlug = p.equipaSlug;
      equipa = equipasExistentes.get(p.equipaSlug) ?? equipa;
    } else if (p.equipaNome) {
      const nova = novaPorNome(p.equipaNome);
      if (nova) {
        equipaSlug = nova.slug;
        equipa = nova.nome;
        avisos.push(`Guarde primeiro a equipa ${nova.nome}.`);
      } else {
        avisos.push(`A equipa ${p.equipaNome} não existe na plataforma. O piloto fica sem equipa ligada.`);
      }
    }
    if (!p.numero) avisos.push("Número de corrida em falta.");
    avisos.push("Sem fotografia. Acrescente-a depois na ficha do piloto.");
    const slug = slugLivre("pilotos", p.nome);
    pilotosNovos.set(slug, p.nome);
    if (equipaSlug) movimentos.push({ piloto: slug, de: "", para: equipaSlug });
    propostas.push({
      tipo: "criar", coleccao: "pilotos", avisos,
      registo: {
        slug, nome: p.nome, ...(p.apelido ? { apelido: p.apelido } : {}),
        numero: p.numero, equipa, equipaSlug,
        provincia: provincia(p.provincia, avisos), nacionalidade: p.nacionalidade || "Angolana",
        idade: p.idade, mota: p.mota, categoria: p.categoria || "MX1", foto: "", bio: p.bio,
        estreia: p.estreia || ctx.temporada,
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
        ...(e.ronda > 0 ? { ronda: e.ronda } : {}),
        temporada: Number(inicio.slice(0, 4)) || ctx.temporada,
        circuito: e.circuito, provincia: provincia(e.provincia, avisos), localidade: e.localidade,
        dataInicio: inicio, dataFim: fim,
        estado: lista.length > 0 ? "bilhetes-abertos" : "agendado",
        imagem: "", resumo: e.resumo, descricao: e.descricao,
        organizador: e.organizador || "Motobox Angola", horarios: e.horarios, bilhetes: lista,
      },
    });
  }

  for (const b of x.bilhetesParaEventosExistentes) {
    const evento = eventosExistentes.get(b.eventoSlug);
    if (!evento) {
      pendentes.push(`Bilhetes para "${b.eventoSlug}" ignorados: o evento não existe na plataforma.`);
      continue;
    }
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
      equipa: r.equipa, voltas: r.voltas, tempo: r.tempo, pontos: r.pontos,
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
        ronda: c.ronda || 1, temporada: Number(d.slice(0, 4)) || ctx.temporada,
        circuito: c.circuito, provincia: provincia(c.provincia, avisos), data: d,
        categoria: c.categoria, vencedor, imagem: "", resultados,
      },
    });
  }

  for (const n of x.noticias) {
    const palavras = n.corpo.join(" ").split(/\s+/).length;
    propostas.push({
      tipo: "criar", coleccao: "noticias", avisos: [],
      registo: {
        slug: slugLivre("noticias", n.titulo), titulo: n.titulo, resumo: n.resumo, corpo: n.corpo,
        categoria: n.categoria, tags: n.tags, autor: n.autor || "Redação Motobox",
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

  /* ---------- Alterações ---------- */

  const refs: Referencias = {
    equipas: new Map([...equipasExistentes, ...[...equipasNovas.values()].map((e) => [e.slug, e.nome] as const)]),
    eventos: new Map(ctx.eventos.map((e) => [e.slug, e.titulo])),
    pilotos: new Map([...ctx.pilotos.map((p) => [p.slug, p.nome] as const), ...pilotosNovos]),
  };

  // Junta os pedidos por registo: o Claude pode partir a mesma mudança
  // em várias entradas, ou usar "estatisticas.pontos" em vez do objecto.
  interface Pedido { coleccao: ColeccaoIA; registo: Registo; valores: Map<string, unknown>; motivos: string[]; avisos: string[] }
  const pedidos = new Map<string, Pedido>();
  for (const a of x.alteracoes) {
    const coleccao = coleccaoDe(a.coleccao);
    if (!coleccao) {
      pendentes.push(`Alteração ignorada: "${a.coleccao}" não é uma coleção que o Organizador possa mudar.`);
      continue;
    }
    const registo = encontrar(ctx, coleccao, a.slug);
    if (!registo) {
      pendentes.push(
        `Não foi possível alterar "${a.slug}" em ${NOME_COLECCAO[coleccao]}: não existe na plataforma.${a.motivo ? ` Pedido: ${a.motivo}` : ""}`,
      );
      continue;
    }
    const chave = `${coleccao}/${String(registo.slug)}`;
    const pedido: Pedido = pedidos.get(chave) ?? { coleccao, registo, valores: new Map(), motivos: [], avisos: [] };
    pedidos.set(chave, pedido);
    if (a.motivo.trim()) pedido.motivos.push(a.motivo.trim());
    for (const { campo, valor } of a.campos) {
      const [cabeca, ...resto] = campo.trim().split(".");
      const nome = campoDe(coleccao, cabeca);
      if (!nome) {
        pedido.avisos.push(normal(cabeca) === "slug"
          ? "O endereço (slug) não se muda pelo Organizador; faça-o na ficha do registo."
          : `O campo "${campo}" não existe ou não se altera por aqui; foi ignorado.`);
        continue;
      }
      const novo = lerValor(valor);
      const objeto = CAMPOS_IA[coleccao][nome].tipo === "objeto";
      const anterior = pedido.valores.get(nome);
      if (resto.length > 0 && !objeto) {
        pedido.avisos.push(`O campo "${campo}" não existe; foi ignorado.`);
      } else if (resto.length > 0) {
        pedido.valores.set(nome, { ...(eObjeto(anterior) ? anterior : {}), [resto.join(".")]: novo });
      } else if (objeto && eObjeto(anterior) && eObjeto(novo)) {
        pedido.valores.set(nome, { ...anterior, ...novo });
      } else {
        pedido.valores.set(nome, novo);
      }
    }
  }

  const alteracoes = new Map<string, PropostaAlterar>();
  /** Acrescenta (ou substitui) um campo, sem repetir o que já lá está. */
  const definir = (campos: CampoAlterado[], def: DefCampo, campo: string, antes: unknown, depois: unknown, depoisDe?: string) => {
    const existente = campos.find((c) => c.campo === campo);
    if (existente) { existente.depois = depois; return true; }
    if (iguais(def, antes, depois)) return false;
    const novo: CampoAlterado = { campo, ...semNota(def), antes: antes ?? null, depois };
    const i = depoisDe ? campos.findIndex((c) => c.campo === depoisDe) : -1;
    if (i >= 0) campos.splice(i + 1, 0, novo); else campos.push(novo);
    return true;
  };

  for (const pedido of pedidos.values()) {
    const { coleccao, registo } = pedido;
    const slug = String(registo.slug);
    const avisos = [...pedido.avisos];
    const campos: CampoAlterado[] = [];

    for (const [nome, bruto] of pedido.valores) {
      const def = CAMPOS_IA[coleccao][nome];
      const r = coagir(def, bruto, registo[nome], refs);
      if (!r.ok) { avisos.push(`${def.etiqueta}: ${r.erro} Ficou como estava.`); continue; }
      avisos.push(...r.avisos);
      const antes = registo[nome];
      if (Array.isArray(antes) && Array.isArray(r.valor) && r.valor.length < antes.length) {
        avisos.push(`${def.etiqueta}: a lista nova tem ${r.valor.length} de ${antes.length} elementos. Confirme que nada se perdeu.`);
      }
      definir(campos, def, nome, antes, r.valor);
    }

    // Consequências que a equipa esperaria sem ter de as pedir.
    if (coleccao === "pilotos") {
      const mudanca = campos.find((c) => c.campo === "equipaSlug");
      if (mudanca) {
        const para = String(mudanca.depois ?? "");
        definir(campos, DEF_NOME_EQUIPA, "equipa", registo.equipa, para ? refs.equipas.get(para) ?? "" : "", "equipaSlug");
        movimentos.push({ piloto: slug, de: String(registo.equipaSlug ?? ""), para });
        const nova = equipasNovas.get(para);
        if (nova) avisos.push(`Guarde primeiro a equipa ${nova.nome}.`);
      }
    }
    if (coleccao === "eventos") {
      const inicio = campos.find((c) => c.campo === "dataInicio");
      const inicioAntes = paraData(registo.dataInicio);
      const fimAntes = paraData(registo.dataFim);
      if (inicio && !campos.some((c) => c.campo === "dataFim") && inicioAntes && fimAntes) {
        const novoFim = somarDias(String(inicio.depois), Math.max(0, diasEntre(inicioAntes, fimAntes)));
        if (definir(campos, CAMPOS_IA.eventos.dataFim, "dataFim", registo.dataFim, novoFim, "dataInicio")) {
          avisos.push("A data de fim foi ajustada para manter a duração do evento. Confirme.");
        }
      }
      const inicioFinal = paraData(inicio?.depois ?? registo.dataInicio);
      const fimFinal = paraData(campos.find((c) => c.campo === "dataFim")?.depois ?? registo.dataFim);
      if (inicioFinal && fimFinal && fimFinal < inicioFinal) avisos.push("A data de fim fica antes da data de início.");
      const ano = Number(inicioFinal?.slice(0, 4));
      if (inicio && ano && !campos.some((c) => c.campo === "temporada")
        && registo.temporada === Number(inicioAntes?.slice(0, 4)) && registo.temporada !== ano) {
        definir(campos, CAMPOS_IA.eventos.temporada, "temporada", registo.temporada, ano);
        avisos.push(`A temporada passou para ${ano} por causa da nova data.`);
      }
    }
    if (coleccao === "corridas") {
      const resultados = campos.find((c) => c.campo === "resultados");
      if (resultados && !campos.some((c) => c.campo === "vencedor")) {
        const primeiro = (resultados.depois as ResultadoCorrida[]).find((r) => r.posicao === 1 && !r.estado);
        definir(campos, CAMPOS_IA.corridas.vencedor, "vencedor", registo.vencedor, primeiro?.piloto ?? "");
      }
    }

    if (campos.length === 0) {
      pendentes.push(`Nada a alterar em ${tituloDe(registo)}: ${avisos.length ? avisos.join(" ") : "os valores pedidos já estão na plataforma."}`);
      continue;
    }
    alteracoes.set(`${coleccao}/${slug}`, {
      tipo: "alterar", coleccao, slug, titulo: tituloDe(registo),
      motivo: pedido.motivos.join(" "), campos, avisos,
    });
  }

  // Listas de pilotos das equipas: quem entra e quem sai, por piloto
  // novo ou mudança de equipa, sem pisar o que o Claude já pediu.
  const listas = new Map<string, string[]>();
  const listaDe = (equipa: string) => {
    let lista = listas.get(equipa);
    if (!lista) {
      const pedida = alteracoes.get(`equipas/${equipa}`)?.campos.find((c) => c.campo === "pilotos")?.depois;
      const base = Array.isArray(pedida)
        ? pedida
        : equipasNovas.get(equipa)?.pilotos ?? ctx.equipas.find((e) => e.slug === equipa)?.pilotos ?? [];
      lista = [...(base as string[])];
      listas.set(equipa, lista);
    }
    return lista;
  };
  const conhecida = (equipa: string) => equipasNovas.has(equipa) || equipasExistentes.has(equipa);
  for (const m of movimentos) {
    if (m.de && m.de !== m.para && conhecida(m.de)) {
      const lista = listaDe(m.de);
      const i = lista.indexOf(m.piloto);
      if (i >= 0) lista.splice(i, 1);
    }
    if (m.para && conhecida(m.para)) {
      const lista = listaDe(m.para);
      if (!lista.includes(m.piloto)) lista.push(m.piloto);
    }
  }
  for (const [equipa, lista] of listas) {
    const nova = equipasNovas.get(equipa);
    if (nova) { nova.pilotos = lista; continue; }
    const registo = ctx.equipas.find((e) => e.slug === equipa) as unknown as Registo;
    const def = CAMPOS_IA.equipas.pilotos;
    const proposta = alteracoes.get(`equipas/${equipa}`);
    if (proposta) {
      definir(proposta.campos, def, "pilotos", registo.pilotos, lista);
    } else if (!iguais(def, registo.pilotos, lista)) {
      alteracoes.set(`equipas/${equipa}`, {
        tipo: "alterar", coleccao: "equipas", slug: equipa, titulo: tituloDe(registo),
        motivo: "Acertar a lista de pilotos da equipa com as mudanças acima.",
        campos: [{ campo: "pilotos", ...semNota(def), antes: registo.pilotos ?? [], depois: lista }],
        avisos: [],
      });
    }
  }

  /* ---------- Remoções: nunca se aplicam sem confirmação ---------- */

  const remocoes: Proposta[] = [];
  const apagados = new Set<string>();
  for (const r of x.remocoes) {
    const coleccao = coleccaoDe(r.coleccao);
    if (!coleccao) {
      pendentes.push(`Remoção ignorada: "${r.coleccao}" não é uma coleção que o Organizador possa mudar.`);
      continue;
    }
    const registo = encontrar(ctx, coleccao, r.slug);
    if (!registo) {
      pendentes.push(`Não foi possível apagar "${r.slug}" em ${NOME_COLECCAO[coleccao]}: não existe na plataforma.`);
      continue;
    }
    const slug = String(registo.slug);
    if (apagados.has(`${coleccao}/${slug}`)) continue;
    apagados.add(`${coleccao}/${slug}`);
    remocoes.push({
      tipo: "apagar", coleccao, slug, titulo: tituloDe(registo), motivo: r.motivo.trim(),
      avisos: avisosRemocao(ctx, coleccao, slug, registo),
    });
  }

  return { resumo: x.resumo, pendentes, propostas: [...propostas, ...alteracoes.values(), ...remocoes] };
}
