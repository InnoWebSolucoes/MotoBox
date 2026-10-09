import "server-only";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA: campos de cada coleção
   O que o Organizador pode escrever em cada tabela, com o tipo
   de cada campo, e a conversão de um valor vindo do Claude
   para a forma que a app guarda (datas AAAA-MM-DD, números,
   listas, bilhetes, resultados…). Um valor que não se deixa
   converter é recusado com uma frase que o Claude percebe.
   ============================================================ */

import type { ColeccaoNome } from "@/lib/admin/store";
import type { ResultadoCorrida, TipoBilhete } from "@/lib/types";
import { CATEGORIAS_ARTIGO, TIPOS_EVENTO } from "@/lib/types";
import { PROVINCIAS } from "@/lib/provincias";
import { DISCIPLINAS_PROVA } from "@/lib/desporto";

export type Registo = Record<string, unknown>;

export type TipoCampo =
  | "texto" | "longo" | "data" | "dataHora" | "numero" | "decimal" | "booleano" | "opcao"
  | "lista" | "paragrafos" | "ligacao" | "ligacoes" | "youtube" | "imagem"
  | "objeto" | "horarios" | "bilhetes" | "resultados" | "json";

export interface DefCampo {
  tipo: TipoCampo;
  etiqueta: string;
  /** Explicação para o Claude, quando o nome não chega. */
  nota?: string;
  opcoes?: readonly string[];
  /** Coleção para onde aponta uma ligação. */
  alvo?: "equipas" | "eventos" | "pilotos" | "categoriasForum";
  /** Chaves de um objecto; "texto?" some quando fica vazia. */
  chaves?: Record<string, "texto" | "numero" | "texto?">;
  /** Pode ficar vazio. */
  opcional?: boolean;
}

/* ---------------- Valores fixos ---------------- */

export const DISCIPLINAS = [...new Set<string>([...TIPOS_EVENTO, ...DISCIPLINAS_PROVA])] as readonly string[];
export const ESTADOS_EVENTO = ["agendado", "bilhetes-abertos", "esgotado", "a-decorrer", "concluido"] as const;
export const ESTADOS_RESULTADO = ["DNF", "DNS", "DSQ"] as const;
const PROVINCIA_OU_VAZIA = ["", ...PROVINCIAS] as const;
const TIPOS_CLUBE = [
  "Moto-turismo", "Lady Riders", "Todo-o-terreno", "Clube de marca", "Clássicas",
  "Scooters e urbano", "Outro", "Movimento",
] as const;
const REDES = { instagram: "texto?", facebook: "texto?" } as const;

/* ---------------- Campos por coleção ---------------- */

export const CAMPOS: Partial<Record<ColeccaoNome, Record<string, DefCampo>>> = {
  eventos: {
    titulo: { tipo: "texto", etiqueta: "Título" },
    disciplina: { tipo: "opcao", etiqueta: "Tipo", opcoes: DISCIPLINAS, nota: "Passeio, Raide, Encontro… são da comunidade; Motocross, Enduro… e Prova são do Desporto" },
    ronda: { tipo: "numero", etiqueta: "Ronda", opcional: true, nota: "ronda do Campeonato Nacional" },
    temporada: { tipo: "numero", etiqueta: "Temporada", nota: "ano" },
    circuito: { tipo: "texto", etiqueta: "Local / circuito" },
    provincia: { tipo: "opcao", etiqueta: "Província", opcoes: PROVINCIAS },
    localidade: { tipo: "texto", etiqueta: "Localidade" },
    dataInicio: { tipo: "data", etiqueta: "Início" },
    dataFim: { tipo: "data", etiqueta: "Fim" },
    estado: { tipo: "opcao", etiqueta: "Estado", opcoes: ESTADOS_EVENTO },
    imagem: { tipo: "imagem", etiqueta: "Imagem", opcional: true },
    resumo: { tipo: "longo", etiqueta: "Resumo" },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    organizador: { tipo: "texto", etiqueta: "Organizador" },
    horarios: { tipo: "horarios", etiqueta: "Horários" },
    bilhetes: { tipo: "bilhetes", etiqueta: "Bilhetes" },
    entrada: { tipo: "texto", etiqueta: "Entrada", opcional: true, nota: "quando não há bilhetes online: «Entrada livre», «5.000 Kz pagos no local»" },
    distanciaVolta: { tipo: "texto", etiqueta: "Distância da volta", opcional: true },
    numeroVoltas: { tipo: "numero", etiqueta: "Número de voltas", opcional: true },
    recordeVolta: { tipo: "objeto", etiqueta: "Recorde da volta", opcional: true, chaves: { piloto: "texto", tempo: "texto", ano: "numero" } },
    publicado: { tipo: "booleano", etiqueta: "Publicado" },
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
    foto: { tipo: "imagem", etiqueta: "Fotografia", opcional: true },
    bio: { tipo: "longo", etiqueta: "Biografia" },
    estreia: { tipo: "numero", etiqueta: "Estreia", nota: "ano" },
    estatisticas: {
      tipo: "objeto", etiqueta: "Estatísticas",
      chaves: { pontos: "numero", vitorias: "numero", podios: "numero", poles: "numero", corridas: "numero", melhorResultado: "texto" },
    },
    redes: { tipo: "objeto", etiqueta: "Redes sociais", chaves: REDES, nota: "endereços completos" },
    campeonatos: { tipo: "numero", etiqueta: "Campeonatos", nota: "títulos nacionais" },
    publicado: { tipo: "booleano", etiqueta: "Publicado" },
  },
  equipas: {
    nome: { tipo: "texto", etiqueta: "Nome" },
    tipo: { tipo: "opcao", etiqueta: "Tipo", opcoes: ["Equipa", "Clube"] },
    base: { tipo: "texto", etiqueta: "Base" },
    provincia: { tipo: "opcao", etiqueta: "Província", opcoes: PROVINCIAS },
    fundacao: { tipo: "numero", etiqueta: "Fundação", nota: "ano" },
    logo: { tipo: "imagem", etiqueta: "Logótipo", opcional: true },
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
    publicado: { tipo: "booleano", etiqueta: "Publicado" },
  },
  corridas: {
    nome: { tipo: "texto", etiqueta: "Nome" },
    eventoSlug: { tipo: "ligacao", etiqueta: "Prova (evento)", alvo: "eventos" },
    ronda: { tipo: "numero", etiqueta: "Ronda", nota: "0 fora do campeonato" },
    temporada: { tipo: "numero", etiqueta: "Temporada", nota: "ano" },
    circuito: { tipo: "texto", etiqueta: "Circuito" },
    provincia: { tipo: "opcao", etiqueta: "Província", opcoes: PROVINCIAS },
    data: { tipo: "data", etiqueta: "Data" },
    categoria: { tipo: "texto", etiqueta: "Categoria", nota: "MX1, MX2…" },
    vencedor: { tipo: "texto", etiqueta: "Vencedor", nota: "acerta-se sozinho com os resultados" },
    imagem: { tipo: "imagem", etiqueta: "Imagem", opcional: true },
    resultados: { tipo: "resultados", etiqueta: "Resultados" },
    publicado: { tipo: "booleano", etiqueta: "Publicado" },
  },
  noticias: {
    titulo: { tipo: "texto", etiqueta: "Título" },
    resumo: { tipo: "longo", etiqueta: "Resumo" },
    corpo: { tipo: "paragrafos", etiqueta: "Texto", nota: "lista de parágrafos" },
    categoria: { tipo: "opcao", etiqueta: "Categoria", opcoes: CATEGORIAS_ARTIGO },
    tags: { tipo: "lista", etiqueta: "Etiquetas" },
    autor: { tipo: "texto", etiqueta: "Autor" },
    data: { tipo: "data", etiqueta: "Data" },
    imagem: { tipo: "imagem", etiqueta: "Imagem", opcional: true },
    leitura: { tipo: "numero", etiqueta: "Leitura", nota: "minutos" },
    destaque: { tipo: "booleano", etiqueta: "Em destaque" },
    fonte: { tipo: "texto", etiqueta: "Fonte", opcional: true },
    fonteUrl: { tipo: "texto", etiqueta: "Endereço da fonte", opcional: true },
    publicado: { tipo: "booleano", etiqueta: "Publicado" },
  },
  videos: {
    titulo: { tipo: "texto", etiqueta: "Título" },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    duracao: { tipo: "texto", etiqueta: "Duração", nota: "m:ss" },
    data: { tipo: "data", etiqueta: "Data" },
    thumbnail: { tipo: "imagem", etiqueta: "Miniatura", opcional: true },
    categoria: { tipo: "opcao", etiqueta: "Categoria", opcoes: ["Highlights", "Entrevista", "Documentário", "Onboard", "Resumo"] },
    visualizacoes: { tipo: "numero", etiqueta: "Visualizações" },
    evento: { tipo: "texto", etiqueta: "Evento", opcional: true },
    videoId: { tipo: "youtube", etiqueta: "Vídeo do YouTube", opcional: true, nota: "endereço ou ID" },
    publicado: { tipo: "booleano", etiqueta: "Publicado" },
  },
  patrocinadores: {
    nome: { tipo: "texto", etiqueta: "Nome" },
    nivel: { tipo: "opcao", etiqueta: "Nível", opcoes: ["Principal", "Oficial", "Apoio", "Media"] },
    setor: { tipo: "texto", etiqueta: "Sector" },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    logo: { tipo: "imagem", etiqueta: "Logótipo", opcional: true },
    website: { tipo: "texto", etiqueta: "Website" },
    desde: { tipo: "numero", etiqueta: "Desde", nota: "ano" },
    publicado: { tipo: "booleano", etiqueta: "Publicado" },
  },
  clubes: {
    nome: { tipo: "texto", etiqueta: "Nome" },
    tipo: { tipo: "opcao", etiqueta: "Tipo", opcoes: TIPOS_CLUBE },
    provincia: { tipo: "opcao", etiqueta: "Província", opcoes: PROVINCIA_OU_VAZIA, nota: "vazia se a sede não é pública" },
    cidade: { tipo: "texto", etiqueta: "Cidade" },
    fundacao: { tipo: "numero", etiqueta: "Fundação", opcional: true, nota: "ano" },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    actividades: { tipo: "lista", etiqueta: "Actividades" },
    encontros: { tipo: "texto", etiqueta: "Encontros", opcional: true, nota: "quando e onde se juntam" },
    logo: { tipo: "imagem", etiqueta: "Logótipo", opcional: true },
    imagem: { tipo: "imagem", etiqueta: "Fotografia de capa", opcional: true },
    cor: { tipo: "texto", etiqueta: "Cor", nota: "hexadecimal" },
    redes: {
      tipo: "objeto", etiqueta: "Redes",
      chaves: { instagram: "texto?", facebook: "texto?", whatsapp: "texto?", site: "texto?", tiktok: "texto?" },
    },
    contacto: { tipo: "texto", etiqueta: "Contacto", opcional: true },
    fonte: { tipo: "texto", etiqueta: "Fonte", opcional: true, nota: "de onde veio a informação; não aparece no site" },
    destaque: { tipo: "booleano", etiqueta: "Em destaque" },
    publicado: { tipo: "booleano", etiqueta: "Publicado" },
  },
  anuncios: {
    titulo: { tipo: "texto", etiqueta: "Título" },
    categoria: { tipo: "opcao", etiqueta: "Categoria", opcoes: ["Motas", "Peças", "Equipamento", "Acessórios"] },
    preco: { tipo: "numero", etiqueta: "Preço (Kz)" },
    negociavel: { tipo: "booleano", etiqueta: "Negociável" },
    marca: { tipo: "texto", etiqueta: "Marca" },
    modelo: { tipo: "texto", etiqueta: "Modelo", opcional: true },
    ano: { tipo: "numero", etiqueta: "Ano", opcional: true },
    quilometragem: { tipo: "numero", etiqueta: "Quilómetros", opcional: true },
    estado: { tipo: "opcao", etiqueta: "Estado", opcoes: ["Nova", "Como nova", "Muito bom", "Bom", "Para peças"] },
    provincia: { tipo: "opcao", etiqueta: "Província", opcoes: PROVINCIAS },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    imagens: { tipo: "lista", etiqueta: "Imagens", nota: "endereços" },
    vendedor: { tipo: "json", etiqueta: "Vendedor", nota: "{nome, verificado, desde, anuncios, avaliacao}" },
    publicado: { tipo: "data", etiqueta: "Data de publicação" },
    visualizacoes: { tipo: "numero", etiqueta: "Visualizações" },
  },
  topicos: {
    titulo: { tipo: "texto", etiqueta: "Título" },
    categoria: { tipo: "texto", etiqueta: "Categoria (nome)" },
    categoriaSlug: { tipo: "ligacao", etiqueta: "Categoria", alvo: "categoriasForum" },
    autor: { tipo: "texto", etiqueta: "Autor" },
    excerto: { tipo: "longo", etiqueta: "Texto" },
    fixado: { tipo: "booleano", etiqueta: "Fixado no topo" },
    bloqueado: { tipo: "booleano", etiqueta: "Fechado a respostas" },
    resolvido: { tipo: "booleano", etiqueta: "Resolvido" },
  },
  categoriasForum: {
    nome: { tipo: "texto", etiqueta: "Nome" },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    icone: { tipo: "texto", etiqueta: "Ícone" },
    cor: { tipo: "texto", etiqueta: "Cor", nota: "hexadecimal" },
  },
  utilizadores: {
    nome: { tipo: "texto", etiqueta: "Nome" },
    email: { tipo: "texto", etiqueta: "Email" },
    telefone: { tipo: "texto", etiqueta: "Telefone", opcional: true },
    papel: { tipo: "opcao", etiqueta: "Papel", opcoes: ["admin", "editor", "moderador", "financeiro", "leitor"] },
    estado: { tipo: "opcao", etiqueta: "Estado", opcoes: ["ativo", "suspenso", "pendente", "banido"] },
    provincia: { tipo: "texto", etiqueta: "Província", opcional: true },
    verificado: { tipo: "booleano", etiqueta: "Verificado" },
    notas: { tipo: "longo", etiqueta: "Notas internas", opcional: true },
    newsletter: { tipo: "booleano", etiqueta: "Recebe a newsletter" },
  },
  encomendas: {
    referencia: { tipo: "texto", etiqueta: "Referência" },
    eventoSlug: { tipo: "ligacao", etiqueta: "Evento", alvo: "eventos" },
    eventoTitulo: { tipo: "texto", etiqueta: "Título do evento" },
    tipoBilheteId: { tipo: "texto", etiqueta: "Bilhete (id)" },
    tipoBilheteNome: { tipo: "texto", etiqueta: "Bilhete" },
    quantidade: { tipo: "numero", etiqueta: "Quantidade" },
    precoUnitario: { tipo: "numero", etiqueta: "Preço unitário (Kz)" },
    taxa: { tipo: "numero", etiqueta: "Taxa (Kz)" },
    total: { tipo: "numero", etiqueta: "Total (Kz)" },
    estado: { tipo: "opcao", etiqueta: "Estado", opcoes: ["pendente", "pago", "cancelado", "reembolsado", "usado"] },
    comprador: { tipo: "objeto", etiqueta: "Comprador", chaves: { nome: "texto", email: "texto", telefone: "texto" } },
    metodo: { tipo: "opcao", etiqueta: "Pagamento", opcoes: ["Multicaixa Express", "Transferência", "Cartão", "Numerário"] },
    criado: { tipo: "dataHora", etiqueta: "Criada" },
    pago: { tipo: "dataHora", etiqueta: "Paga", opcional: true },
    codigoQR: { tipo: "texto", etiqueta: "Código QR" },
  },
  denuncias: {
    estado: { tipo: "opcao", etiqueta: "Estado", opcoes: ["pendente", "aprovado", "rejeitado"], nota: "aprovado = resolvida com acção" },
    resolucao: { tipo: "longo", etiqueta: "Resolução", opcional: true },
  },
  subscritores: {
    email: { tipo: "texto", etiqueta: "Email" },
    nome: { tipo: "texto", etiqueta: "Nome", opcional: true },
    origem: { tipo: "opcao", etiqueta: "Origem", opcoes: ["rodapé", "faixa", "cartão", "checkout", "manual", "conta"] },
    subscrito: { tipo: "dataHora", etiqueta: "Subscrito em" },
    ativo: { tipo: "booleano", etiqueta: "Activo" },
  },
  mensagens: {
    lida: { tipo: "booleano", etiqueta: "Lida" },
    arquivada: { tipo: "booleano", etiqueta: "Arquivada" },
    resposta: { tipo: "longo", etiqueta: "Resposta guardada", opcional: true },
  },
  paginasLegais: {
    titulo: { tipo: "texto", etiqueta: "Título" },
    descricao: { tipo: "longo", etiqueta: "Descrição" },
    atualizado: { tipo: "data", etiqueta: "Actualizada em" },
    publicado: { tipo: "booleano", etiqueta: "Publicada" },
    seccoes: { tipo: "json", etiqueta: "Secções", nota: "lista de {titulo, corpo: [parágrafos]}" },
  },
};

/** Campos das Definições (linha única). */
export const CAMPOS_DEFINICOES: Record<string, DefCampo> = {
  nomeSite: { tipo: "texto", etiqueta: "Nome do site" },
  descricao: { tipo: "longo", etiqueta: "Descrição" },
  emailContacto: { tipo: "texto", etiqueta: "Email de contacto" },
  telefone: { tipo: "texto", etiqueta: "Telefone" },
  morada: { tipo: "texto", etiqueta: "Morada" },
  temporada: { tipo: "numero", etiqueta: "Temporada", nota: "ano em curso do campeonato" },
  taxaMotobox: { tipo: "decimal", etiqueta: "Taxa sobre bilhetes (%)" },
  moeda: { tipo: "texto", etiqueta: "Moeda" },
  instagram: { tipo: "texto", etiqueta: "Instagram" },
  facebook: { tipo: "texto", etiqueta: "Facebook" },
  youtube: { tipo: "texto", etiqueta: "YouTube" },
  linkedin: { tipo: "texto", etiqueta: "LinkedIn" },
  googleBusiness: { tipo: "texto", etiqueta: "Perfil no Google" },
  manutencao: { tipo: "booleano", etiqueta: "Site em manutenção" },
  registosAbertos: { tipo: "booleano", etiqueta: "Registos abertos" },
  marketplaceAberto: { tipo: "booleano", etiqueta: "Marketplace aberto" },
  forumAberto: { tipo: "booleano", etiqueta: "Fórum aberto" },
  bilheteiraAberta: { tipo: "booleano", etiqueta: "Bilheteira aberta" },
  cookieBanner: { tipo: "booleano", etiqueta: "Aviso de cookies" },
  analytics: { tipo: "texto", etiqueta: "Analytics (ID)" },
  newsletterAutomatica: { tipo: "booleano", etiqueta: "Newsletter semanal automática" },
};

/** Nome legível de cada coleção, no singular e no plural. */
export const NOMES: Record<ColeccaoNome, { um: string; varios: string }> = {
  eventos: { um: "Evento", varios: "eventos" },
  pilotos: { um: "Piloto", varios: "pilotos" },
  equipas: { um: "Equipa", varios: "equipas" },
  corridas: { um: "Resultado", varios: "resultados" },
  noticias: { um: "Artigo", varios: "artigos" },
  videos: { um: "Vídeo", varios: "vídeos" },
  patrocinadores: { um: "Patrocinador", varios: "patrocinadores" },
  anuncios: { um: "Anúncio", varios: "anúncios" },
  topicos: { um: "Tópico", varios: "tópicos" },
  categoriasForum: { um: "Categoria do fórum", varios: "categorias do fórum" },
  clubes: { um: "Clube", varios: "clubes" },
  utilizadores: { um: "Utilizador", varios: "utilizadores" },
  encomendas: { um: "Encomenda", varios: "encomendas" },
  denuncias: { um: "Denúncia", varios: "denúncias" },
  subscritores: { um: "Subscritor", varios: "subscritores" },
  mensagens: { um: "Mensagem", varios: "mensagens" },
  paginasLegais: { um: "Página legal", varios: "páginas legais" },
  atividade: { um: "Actividade", varios: "registos de actividade" },
};

/* ---------------- Utilitários ---------------- */

/** Compara textos sem maiúsculas nem acentos. */
export function normal(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function eObjeto(v: unknown): v is Registo {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function slugify(texto: string): string {
  return texto
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const tituloDe = (r: Registo) =>
  String(r.titulo ?? r.nome ?? r.referencia ?? r.assunto ?? r.alvoTitulo ?? r.email ?? r.slug ?? r.id ?? "");

export function idYoutube(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined;
  const m = /(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/.exec(valor);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(valor.trim()) ? valor.trim() : undefined;
}

/** Texto curto de um valor, para os resumos e diferenças. */
export function mostrar(v: unknown, n = 140): string {
  if (v === null || v === undefined || v === "") return "vazio";
  if (typeof v === "boolean") return v ? "sim" : "não";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;
}

export function paraTexto(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

export function paraNumero(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v !== "string") return undefined;
  let t = v.replace(/kz|kwanzas?/gi, "").replace(/\s/g, "");
  const mil = /^(\d+(?:[.,]\d+)?)mil$/i.exec(t);
  if (mil) return Number(mil[1].replace(",", ".")) * 1000;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, "");
  t = t.replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : undefined;
}

export function paraBooleano(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  const t = paraTexto(v);
  if (t === undefined) return undefined;
  if (["true", "sim", "verdadeiro", "1"].includes(normal(t))) return true;
  if (["false", "nao", "falso", "0"].includes(normal(t))) return false;
  return undefined;
}

/** AAAA-MM-DD a partir de uma data ISO (com ou sem hora) ou DD/MM/AAAA. */
export function paraData(v: unknown): string | undefined {
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

export function paraLista(v: unknown, separador = /\n|,|;/): string[] {
  const itens = Array.isArray(v) ? v.map(paraTexto) : (paraTexto(v) ?? "").split(separador);
  return itens.map((s) => (s ?? "").trim()).filter(Boolean);
}

export function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export const diasEntre = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Slug de um registo a partir do slug, de algo parecido ou do nome. */
export function resolverLigacao(valor: string, mapa: Map<string, string>): string | undefined {
  const v = valor.trim();
  if (!v) return undefined;
  if (mapa.has(v)) return v;
  const alvo = slugify(v);
  if (mapa.has(alvo)) return alvo;
  const porNome = [...mapa].filter(([, nome]) => slugify(nome) === alvo);
  return porNome.length === 1 ? porNome[0][0] : undefined;
}

/* ---------------- Conversão de um valor ---------------- */

export type Coagido = { ok: true; valor: unknown; avisos: string[] } | { ok: false; erro: string };
const aceite = (valor: unknown, avisos: string[] = []): Coagido => ({ ok: true, valor, avisos });
const recusado = (erro: string): Coagido => ({ ok: false, erro });

/** Nome → slug das ligações possíveis (equipas, eventos, pilotos, categorias). */
export type Referencias = Record<NonNullable<DefCampo["alvo"]>, Map<string, string>>;

function paraObjeto(def: DefCampo, v: unknown, antes: unknown): Coagido {
  if (v === null && def.opcional) return aceite(null);
  if (!eObjeto(v)) return recusado('esperava um objecto, por exemplo {"pontos": 120}.');
  const chaves = def.chaves ?? {};
  // Parte do valor actual: mudar os pontos não apaga as vitórias.
  const saida: Registo = eObjeto(antes) ? { ...antes } : {};
  const avisos: string[] = [];
  for (const [k, bruto] of Object.entries(v)) {
    const chave = Object.keys(chaves).find((c) => normal(c) === normal(k));
    if (!chave) { avisos.push(`${def.etiqueta}: "${k}" não existe e foi ignorado.`); continue; }
    if (chaves[chave] === "numero") {
      const n = paraNumero(bruto);
      if (n === undefined || n < 0) return recusado(`"${mostrar(bruto)}" não é um número válido para ${chave}.`);
      saida[chave] = Math.round(n);
    } else {
      const s = bruto === null ? "" : paraTexto(bruto);
      if (s === undefined) return recusado(`${chave} tem de ser texto.`);
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
  if (!Array.isArray(v)) return recusado('esperava uma lista de {"dia","hora","sessao"}.');
  return aceite(v.map((h) => (eObjeto(h)
    ? { dia: paraTexto(h.dia) ?? "", hora: paraTexto(h.hora) ?? "", sessao: paraTexto(h.sessao) ?? "" }
    : { dia: "", hora: "", sessao: paraTexto(h) ?? "" })));
}

/**
 * Bilhetes: cada um liga-se ao existente pelo id ou pelo nome, para
 * manter o id (as encomendas apontam para ele) e o que não foi dito.
 */
export function paraBilhetes(v: unknown, antes: TipoBilhete[]): Coagido {
  if (!Array.isArray(v)) return recusado("esperava a lista completa de bilhetes.");
  const porId = new Map(antes.map((b) => [b.id, b]));
  const porNome = new Map(antes.map((b) => [slugify(b.nome), b]));
  const ids = new Set<string>();
  const lista: TipoBilhete[] = [];
  for (const [i, item] of v.entries()) {
    if (!eObjeto(item)) return recusado(`o bilhete ${i + 1} não está no formato certo.`);
    const nome = paraTexto(item.nome) ?? "";
    const anterior = (typeof item.id === "string" ? porId.get(item.id) : undefined) ?? porNome.get(slugify(nome));
    const nomeFinal = nome || anterior?.nome || "";
    if (!nomeFinal) return recusado(`o bilhete ${i + 1} não tem nome.`);
    const preco = item.preco === undefined ? anterior?.preco : paraNumero(item.preco);
    if (preco === undefined || preco < 0) return recusado(`o bilhete ${nomeFinal} não tem um preço válido.`);
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

export function paraResultados(v: unknown, pilotos: Map<string, string>): Coagido {
  if (!Array.isArray(v)) return recusado("esperava a lista completa de resultados.");
  const lista: ResultadoCorrida[] = [];
  const semFicha: string[] = [];
  for (const [i, item] of v.entries()) {
    if (!eObjeto(item)) return recusado(`o resultado ${i + 1} não está no formato certo.`);
    const piloto = paraTexto(item.piloto) ?? "";
    const pedido = paraTexto(item.pilotoSlug) ?? "";
    const slug = (pedido && pilotos.has(pedido) ? pedido : undefined) ?? (piloto ? resolverLigacao(piloto, pilotos) : undefined)
      ?? (pedido ? resolverLigacao(pedido, pilotos) : undefined);
    const nome = piloto || (slug ? pilotos.get(slug) ?? "" : "");
    if (!nome) return recusado(`o resultado ${i + 1} não tem piloto.`);
    if (!slug) semFicha.push(nome);
    const estado = ESTADOS_RESULTADO.find((e) => e === (paraTexto(item.estado) ?? "").toUpperCase());
    lista.push({
      posicao: estado ? 0 : Math.round(paraNumero(item.posicao) ?? i + 1),
      pilotoSlug: slug ?? slugify(nome),
      piloto: nome,
      equipa: paraTexto(item.equipa) ?? "",
      voltas: Math.round(paraNumero(item.voltas) ?? 0),
      tempo: paraTexto(item.tempo) ?? (estado ?? ""),
      pontos: estado ? 0 : Math.round(paraNumero(item.pontos) ?? 0),
      ...(paraBooleano(item.melhorVolta) ? { melhorVolta: true } : {}),
      ...(estado ? { estado } : {}),
    });
  }
  return aceite(lista, semFicha.length ? [`Pilotos sem ficha na plataforma: ${semFicha.join(", ")}.`] : []);
}

/** Valida e converte um valor novo para a forma do campo. */
export function coagir(def: DefCampo, v: unknown, antes: unknown, refs: Referencias): Coagido {
  const vazio = v === null || v === "";
  switch (def.tipo) {
    case "texto":
    case "longo": {
      if (vazio) return aceite(def.opcional ? null : "");
      const s = paraTexto(v);
      return s === undefined ? recusado("esperava texto.") : aceite(s);
    }
    case "imagem": {
      if (vazio) return aceite("");
      const s = paraTexto(v);
      return s === undefined ? recusado("esperava o endereço da imagem.") : aceite(s);
    }
    case "data": {
      if (vazio && def.opcional) return aceite(null);
      const d = paraData(v);
      return d ? aceite(d) : recusado(`"${mostrar(v)}" não é uma data válida (AAAA-MM-DD).`);
    }
    case "dataHora": {
      if (vazio && def.opcional) return aceite(null);
      const s = paraTexto(v) ?? "";
      const t = Date.parse(s);
      return Number.isNaN(t) ? recusado(`"${mostrar(v)}" não é uma data válida.`) : aceite(new Date(t).toISOString());
    }
    case "numero":
    case "decimal": {
      if (vazio && def.opcional) return aceite(null);
      const n = paraNumero(v);
      if (n === undefined || n < 0) return recusado(`"${mostrar(v)}" não é um número válido.`);
      if (def.tipo === "decimal") return aceite(n);
      const inteiro = Math.round(n);
      return aceite(inteiro, inteiro !== n ? [`${def.etiqueta}: ${n} foi arredondado para ${inteiro}.`] : []);
    }
    case "booleano": {
      const b = paraBooleano(v);
      return b === undefined ? recusado("esperava sim ou não (true ou false).") : aceite(b);
    }
    case "opcao": {
      const s = paraTexto(v) ?? "";
      const opcao = def.opcoes?.find((o) => normal(o) === normal(s));
      return opcao !== undefined ? aceite(opcao) : recusado(`"${mostrar(v)}" não é uma das opções (${def.opcoes?.filter(Boolean).join(", ")}).`);
    }
    case "lista":
      return Array.isArray(v) || typeof v === "string" ? aceite(paraLista(v)) : recusado("esperava uma lista.");
    case "paragrafos":
      return Array.isArray(v) || typeof v === "string"
        ? aceite(paraLista(v, /\n\s*\n/))
        : recusado("esperava uma lista de parágrafos.");
    case "ligacao": {
      if (vazio) return aceite("");
      const mapa = refs[def.alvo ?? "equipas"];
      const s = paraTexto(v);
      const slug = s === undefined ? undefined : resolverLigacao(s, mapa);
      return slug ? aceite(slug) : recusado(`"${mostrar(v)}" não corresponde a nenhum registo de ${def.alvo}.`);
    }
    case "ligacoes": {
      if (!Array.isArray(v) && typeof v !== "string") return recusado("esperava uma lista de slugs.");
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
    case "json":
      return v === undefined ? recusado("falta o valor.") : aceite(v);
  }
}

/** Vazio, null e ausente contam como o mesmo valor; datas só pelo dia. */
export function iguais(def: DefCampo | undefined, a: unknown, b: unknown): boolean {
  const n = (v: unknown) => (v === undefined || v === "" ? null : v);
  if (def?.tipo === "data" && typeof a === "string" && typeof b === "string") return a.slice(0, 10) === b.slice(0, 10);
  return JSON.stringify(n(a)) === JSON.stringify(n(b));
}

/** Nome exacto de um campo a partir do que o Claude escreveu. */
export function campoDe(campos: Record<string, DefCampo>, nome: string): string | undefined {
  const chave = normal(nome).replace(/[\s_-]/g, "");
  const sinonimos: Record<string, string> = { equipa: "equipaSlug", evento: "eventoSlug", youtube: "videoId", video: "videoId" };
  const exacto = Object.keys(campos).find((c) => c.toLowerCase() === chave);
  if (exacto) return exacto;
  const s = sinonimos[chave];
  return s && s in campos ? s : undefined;
}

/** Descrição curta da forma de um campo, para o Claude. */
export function formaDoCampo(d: DefCampo): string {
  switch (d.tipo) {
    case "data": return "AAAA-MM-DD";
    case "dataHora": return "data e hora ISO";
    case "numero": return "inteiro";
    case "decimal": return "número";
    case "booleano": return "true/false";
    case "opcao": return `uma de: ${d.opcoes?.map((o) => o || "(vazio)").join(", ")}`;
    case "lista": return "lista de textos";
    case "paragrafos": return "lista de parágrafos";
    case "ligacao": return `slug de ${d.alvo}`;
    case "ligacoes": return `lista de slugs de ${d.alvo}`;
    case "imagem": return "endereço de imagem (da biblioteca)";
    case "objeto": return `{${Object.entries(d.chaves ?? {}).map(([k, t]) => `${k}: ${t === "numero" ? "número" : "texto"}`).join(", ")}}`;
    case "horarios": return '[{"dia","hora","sessao"}]';
    case "bilhetes": return '[{"id","nome","descricao","preco","disponiveis","beneficios"}]';
    case "resultados": return '[{"posicao","piloto","pilotoSlug","equipa","voltas","tempo","pontos","estado"}]';
    case "json": return "JSON";
    default: return "texto";
  }
}

/** Guia compacto dos campos de cada coleção, para o prompt de sistema. */
export function guiaCampos(): string {
  return (Object.entries(CAMPOS) as [ColeccaoNome, Record<string, DefCampo>][])
    .map(([c, campos]) => {
      const lista = Object.entries(campos).map(([nome, d]) => {
        const extra = [formaDoCampo(d), d.nota, d.opcional ? "opcional" : ""].filter(Boolean).join("; ");
        return `${nome} (${extra})`;
      });
      return `- ${c}: ${lista.join(", ")}`;
    })
    .join("\n");
}
