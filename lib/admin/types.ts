/* ============================================================
   MOTOBOX ADMIN — Modelos de dados da área de gestão
   Entidades que não existem no site público e que o painel
   de administração precisa de gerir.
   ============================================================ */

export type Papel = "admin" | "editor" | "moderador" | "financeiro" | "leitor";

export const PAPEIS: { valor: Papel; nome: string; descricao: string }[] = [
  { valor: "admin", nome: "Administrador", descricao: "Acesso total, incluindo utilizadores e definições" },
  { valor: "editor", nome: "Editor", descricao: "Conteúdo: notícias, eventos, vídeos, pilotos, equipas" },
  { valor: "moderador", nome: "Moderador", descricao: "Fórum, marketplace, comentários e denúncias" },
  { valor: "financeiro", nome: "Financeiro", descricao: "Bilhetes, pagamentos, comissões e relatórios" },
  { valor: "leitor", nome: "Leitor", descricao: "Conta do site público, sem acesso ao painel" },
];

export type Permissao =
  | "conteudo.ler" | "conteudo.escrever" | "conteudo.publicar" | "conteudo.apagar"
  | "comunidade.ler" | "comunidade.moderar"
  | "comercial.ler" | "comercial.escrever"
  | "utilizadores.ler" | "utilizadores.escrever"
  | "definicoes.ler" | "definicoes.escrever";

export const PERMISSOES_POR_PAPEL: Record<Papel, Permissao[]> = {
  admin: [
    "conteudo.ler", "conteudo.escrever", "conteudo.publicar", "conteudo.apagar",
    "comunidade.ler", "comunidade.moderar",
    "comercial.ler", "comercial.escrever",
    "utilizadores.ler", "utilizadores.escrever",
    "definicoes.ler", "definicoes.escrever",
  ],
  editor: ["conteudo.ler", "conteudo.escrever", "conteudo.publicar", "comunidade.ler"],
  moderador: ["conteudo.ler", "comunidade.ler", "comunidade.moderar", "utilizadores.ler"],
  financeiro: ["conteudo.ler", "comercial.ler", "comercial.escrever", "utilizadores.ler"],
  leitor: [],
};

export type EstadoUtilizador = "ativo" | "suspenso" | "pendente" | "banido";

export interface Utilizador {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  papel: Papel;
  estado: EstadoUtilizador;
  provincia?: string;
  avatarCor: string;
  registado: string;   // ISO
  ultimoAcesso?: string;
  verificado: boolean;
  notas?: string;
  /** Subscritor da newsletter */
  newsletter: boolean;
}

export type EstadoEncomenda = "pendente" | "pago" | "cancelado" | "reembolsado" | "usado";

export interface Encomenda {
  id: string;
  referencia: string;
  eventoSlug: string;
  eventoTitulo: string;
  tipoBilheteId: string;
  tipoBilheteNome: string;
  quantidade: number;
  precoUnitario: number;
  taxa: number;
  total: number;
  estado: EstadoEncomenda;
  comprador: { nome: string; email: string; telefone: string };
  metodo: "Multicaixa Express" | "Transferência" | "Cartão" | "Numerário";
  criado: string;
  pago?: string;
  codigoQR: string;
}

export type EstadoModeracao = "pendente" | "aprovado" | "rejeitado";

export interface Denuncia {
  id: string;
  tipo: "forum" | "marketplace" | "comentario" | "perfil";
  alvoId: string;
  alvoTitulo: string;
  /** Fórum: a resposta denunciada, quando não é o tópico inteiro. */
  respostaId?: string | null;
  motivo: string;
  detalhe: string;
  denunciante: string;
  criado: string;
  estado: EstadoModeracao;
  resolucao?: string;
}

export interface Subscritor {
  id: string;
  email: string;
  nome?: string;
  origem: "rodapé" | "faixa" | "cartão" | "checkout" | "manual" | "conta";
  subscrito: string;
  ativo: boolean;
}

export interface Mensagem {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  assunto: string;
  mensagem: string;
  recebido: string;
  lida: boolean;
  arquivada: boolean;
  resposta?: string;
  /** ISO. Quando a resposta seguiu por email para quem escreveu. */
  respondidaEm?: string;
}

export interface PaginaLegal {
  slug: string;
  titulo: string;
  descricao: string;
  atualizado: string;
  publicado: boolean;
  seccoes: { titulo: string; corpo: string[] }[];
}

export interface Definicoes {
  nomeSite: string;
  descricao: string;
  emailContacto: string;
  telefone: string;
  morada: string;
  temporada: number;
  taxaMotobox: number;      // percentagem sobre bilhetes
  moeda: string;
  instagram: string;
  facebook: string;
  youtube: string;
  linkedin: string;
  /** Perfil da empresa no Google (Google Business / Maps). */
  googleBusiness: string;
  manutencao: boolean;
  registosAbertos: boolean;
  marketplaceAberto: boolean;
  forumAberto: boolean;
  bilheteiraAberta: boolean;
  cookieBanner: boolean;
  analytics: string;
  /** Envio semanal automático da newsletter. */
  newsletterAutomatica: boolean;
}

export interface RegistoAtividade {
  id: string;
  quando: string;
  utilizador: string;
  accao: string;
  entidade: string;
  detalhe: string;
}
