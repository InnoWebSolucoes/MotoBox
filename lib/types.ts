export type { Provincia } from "./provincias";
import type { Provincia } from "./provincias";

/**
 * As primeiras são provas (vão para o calendário de Desporto); as outras são
 * eventos da comunidade (secção Eventos): passeios, acções solidárias,
 * encontros de clubes, formações.
 */
export type Disciplina =
  | "Motocross" | "Enduro" | "Velocidade" | "Rally"
  | "Passeio" | "Solidária" | "Encontro" | "Formação";

export type TipoClube =
  | "Moto-turismo" | "Lady Riders" | "Todo-o-terreno" | "Clube de marca"
  | "Clássicas" | "Scooters e urbano" | "Outro";

/**
 * Clube de lazer: pessoas que saem juntas, viajam, organizam encontros.
 * Ao contrário das equipas (Desporto), não tem pilotos nem pontos.
 */
export interface Clube {
  slug: string;
  nome: string;
  tipo: TipoClube;
  provincia: Provincia;
  cidade: string;
  fundacao?: number;
  descricao: string;
  /** Ex.: "Passeios de fim-de-semana", "Viagens pelo país", "Acções solidárias". */
  actividades: string[];
  /** Quando e onde se juntam, em texto livre. Ex.: "Domingos às 7h, Marginal de Luanda". */
  encontros?: string;
  /** Endereço do logótipo (ou vazio). */
  logo: string;
  /** Fotografia de capa (endereço ou chave de lib/imagens.ts). */
  imagem?: string;
  cor: string;
  redes: { instagram?: string; facebook?: string; whatsapp?: string; site?: string; tiktok?: string };
  contacto?: string;
  /** De onde veio a informação, para a equipa poder confirmar. Não aparece no site. */
  fonte?: string;
  destaque?: boolean;
}

export type EstadoEvento = "agendado" | "bilhetes-abertos" | "esgotado" | "a-decorrer" | "concluido";

export interface Evento {
  slug: string;
  titulo: string;
  disciplina: Disciplina;
  ronda?: number;
  temporada: number;
  circuito: string;
  provincia: Provincia;
  localidade: string;
  dataInicio: string; // ISO
  dataFim: string; // ISO
  estado: EstadoEvento;
  imagem: string;
  resumo: string;
  descricao: string;
  organizador: string;
  horarios: { dia: string; hora: string; sessao: string }[];
  bilhetes?: TipoBilhete[];
  distanciaVolta?: string;
  numeroVoltas?: number;
  recordeVolta?: { piloto: string; tempo: string; ano: number };
}

export interface TipoBilhete {
  id: string;
  nome: string;
  descricao: string;
  preco: number; // Kz
  disponiveis: number;
  beneficios: string[];
  destaque?: boolean;
}

export interface Piloto {
  slug: string;
  nome: string;
  apelido?: string;
  numero: number;
  equipa: string;
  equipaSlug: string;
  provincia: Provincia;
  nacionalidade: string;
  idade: number;
  mota: string;
  categoria: string;
  foto: string;
  bio: string;
  estreia: number;
  estatisticas: {
    pontos: number;
    vitorias: number;
    podios: number;
    poles: number;
    corridas: number;
    melhorResultado: string;
  };
  redes: { instagram?: string; facebook?: string };
  campeonatos: number;
}

export interface Equipa {
  slug: string;
  nome: string;
  tipo: "Equipa" | "Clube";
  base: string;
  provincia: Provincia;
  fundacao: number;
  logo: string;
  cor: string;
  chefe: string;
  membros: number;
  pilotos: string[];
  descricao: string;
  motas: string[];
  estatisticas: { pontos: number; vitorias: number; podios: number; titulos: number };
  redes: { instagram?: string; facebook?: string };
}

export interface ResultadoCorrida {
  posicao: number;
  pilotoSlug: string;
  piloto: string;
  equipa: string;
  voltas: number;
  tempo: string;
  pontos: number;
  melhorVolta?: boolean;
  estado?: "DNF" | "DNS" | "DSQ";
}

export interface Corrida {
  slug: string;
  eventoSlug: string;
  nome: string;
  ronda: number;
  temporada: number;
  circuito: string;
  provincia: Provincia;
  data: string;
  categoria: string;
  vencedor: string;
  imagem: string;
  resultados: ResultadoCorrida[];
}

export interface Noticia {
  slug: string;
  titulo: string;
  resumo: string;
  corpo: string[];
  categoria: "Angola" | "Internacional" | "Comunidade" | "Entrevista" | "Solidária";
  tags: string[];
  autor: string;
  data: string;
  imagem: string;
  leitura: number;
  destaque?: boolean;
  fonte?: string;
  fonteUrl?: string;
}

export interface Video {
  slug: string;
  titulo: string;
  descricao: string;
  duracao: string;
  data: string;
  thumbnail: string;
  categoria: "Highlights" | "Entrevista" | "Documentário" | "Onboard" | "Resumo";
  visualizacoes: number;
  evento?: string;
  /**
   * ID do vídeo no YouTube. Enquanto não existe arquivo próprio da Motobox,
   * aponta para vídeos reais dos canais oficiais (MXGP-TV, Dakar), para que
   * o leitor funcione de facto. Sem ID, o cartão fica só com a miniatura.
   */
  videoId?: string;
}

export interface Patrocinador {
  slug: string;
  nome: string;
  nivel: "Principal" | "Oficial" | "Apoio" | "Media";
  setor: string;
  descricao: string;
  logo: string;
  website: string;
  desde: number;
}

export interface AnuncioMarketplace {
  id: string;
  titulo: string;
  categoria: "Motas" | "Peças" | "Equipamento" | "Acessórios";
  preco: number;
  negociavel: boolean;
  marca: string;
  modelo?: string;
  ano?: number;
  quilometragem?: number;
  estado: "Nova" | "Como nova" | "Muito bom" | "Bom" | "Para peças";
  provincia: Provincia;
  descricao: string;
  imagens: string[];
  vendedor: {
    nome: string; verificado: boolean; desde: number; anuncios: number; avaliacao: number;
    /** Conta do Supabase Auth de quem publicou, nos anúncios criados no site. */
    authId?: string;
  };
  publicado: string;
  visualizacoes: number;
}

export interface TopicoForum {
  id: string;
  titulo: string;
  categoria: string;
  categoriaSlug: string;
  autor: string;
  autorAvatar: string;
  avatarCor: string;
  criado: string;
  respostas: number;
  visualizacoes: number;
  ultimaResposta: { autor: string; quando: string };
  fixado?: boolean;
  bloqueado?: boolean;
  resolvido?: boolean;
  excerto: string;
}

export interface CategoriaForum {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  topicos: number;
  mensagens: number;
  cor: string;
}
