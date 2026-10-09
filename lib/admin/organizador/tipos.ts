/* ============================================================
   MOTOBOX ADMIN — Organizador IA: tipos partilhados
   Usados pelo servidor (agente e API) e pela página do painel.
   Sem nada do servidor: pode ser importado por componentes de
   cliente.
   ============================================================ */

import type Anthropic from "@anthropic-ai/sdk";

/** Uma mensagem da conversa, tal como a API do Claude a recebe e devolve. */
export type MensagemHistorico = Anthropic.Beta.BetaMessageParam;

/** Um campo numa operação proposta: o valor actual e o novo, já em texto curto. */
export interface CampoDiff {
  campo: string;
  etiqueta: string;
  antes?: string;
  depois?: string;
}

export type AccaoOperacao =
  | "criar" | "alterar" | "apagar" | "publicar" | "esconder"
  | "definicoes" | "conteudo" | "repor" | "email";

/** Uma operação de uma proposta, pronta a mostrar. */
export interface OperacaoVista {
  accao: AccaoOperacao;
  /** Ex.: "Evento «GP do Lubango»". */
  alvo: string;
  detalhe?: string;
  campos?: CampoDiff[];
}

/** Ligação para uma página do painel (sem o prefixo /motobox). */
export interface Ligacao {
  rotulo: string;
  href: string;
}

/**
 * Uma mudança que o Organizador quer fazer. Nada acontece até o
 * administrador a aprovar; a aprovação volta ao servidor com a
 * `assinatura`, para que só se execute exactamente o que foi visto.
 */
export interface Proposta {
  /** O id da chamada à ferramenta (tool_use). */
  id: string;
  ferramenta: string;
  /** Os dados da chamada; o painel pode editá-los antes de aprovar. */
  entrada: Record<string, unknown>;
  titulo: string;
  motivo?: string;
  operacoes: OperacaoVista[];
  avisos: string[];
  /** Apagar, repor ou banir: pede confirmação explícita. */
  destrutiva: boolean;
  ligacoes: Ligacao[];
  assinatura: string;
}

export interface Decisao {
  id: string;
  decisao: "aprovar" | "rejeitar";
  /** Obrigatório nas propostas destrutivas. */
  confirmado?: boolean;
  /** Nota do administrador ao rejeitar. */
  nota?: string;
  /** Entrada editada no painel (já revista pelo servidor). */
  entrada?: Record<string, unknown>;
  /** Assinatura da proposta que o administrador viu. */
  assinatura?: string;
}

export type MotivoFim =
  | "concluido"
  | "aguarda-aprovacao"
  | "limite"
  | "recusa"
  | "cortado"
  | "erro";

/** Eventos que a API envia ao painel, um por linha (NDJSON). */
export type EventoOrganizador =
  | { tipo: "texto"; texto: string }
  | { tipo: "progresso"; texto: string; novo?: boolean }
  | { tipo: "ferramenta"; id: string; nome: string; rotulo: string }
  | { tipo: "ferramenta-fim"; id: string; ok: boolean; resumo: string }
  | { tipo: "proposta"; proposta: Proposta }
  | { tipo: "executado"; id: string; ok: boolean; titulo: string; resumo: string; ligacoes: Ligacao[] }
  | { tipo: "historico"; mensagens: MensagemHistorico[] }
  | { tipo: "fim"; motivo: MotivoFim }
  | { tipo: "erro"; mensagem: string };

/** Resposta do GET: se está ligado e o que quem pede pode fazer. */
export interface EstadoOrganizador {
  configurado: boolean;
  papel: string | null;
  podeEscrever: boolean;
  baseDados: boolean;
  modelo: string;
}

export interface Anexo {
  nome: string;
  tipo: string;
  /** Base64, sem o prefixo data:. */
  dados: string;
}

/** Pedidos aceites pelo POST de /api/admin/organizador. */
export type PedidoOrganizador =
  | {
      accao: "conversar";
      historico: MensagemHistorico[];
      texto?: string;
      anexos?: Anexo[];
      decisoes?: Decisao[];
    }
  | { accao: "rever"; id: string; ferramenta: string; entrada: Record<string, unknown> };

/** Pedidos de partida, para as tarefas mais comuns. */
export const SUGESTOES: { titulo: string; texto: string }[] = [
  {
    titulo: "Cria o evento…",
    texto: "Cria o evento «Passeio ao Miradouro da Lua» no sábado 25 de Outubro, saída às 8h da Marginal de Luanda, entrada livre. Mostra-me a proposta antes de gravar.",
  },
  {
    titulo: "Publica os resultados da prova…",
    texto: "Publica os resultados da última prova do campeonato e actualiza a classificação dos pilotos. Pergunta-me o que faltar.",
  },
  {
    titulo: "Põe a rota em foco",
    texto: "Põe a rota da Serra da Leba em foco no painel da entrada.",
  },
  {
    titulo: "Responde às mensagens por ler",
    texto: "Lê as mensagens de contacto por ler e prepara uma resposta para cada uma. Mostra-me as respostas antes de enviar.",
  },
  {
    titulo: "Resume o que precisa de atenção hoje",
    texto: "Resume o que precisa de atenção hoje no painel: mensagens, denúncias, encomendas, eventos próximos e resultados em falta.",
  },
];

/** Como ligar o Organizador (mostrado quando falta a chave). */
export const PASSOS_LIGAR: string[] = [
  "Entre em console.anthropic.com com a conta da MotoBox, abra Settings → API Keys e carregue em Create Key. Copie a chave (começa por sk-ant-); só é mostrada uma vez.",
  "No Vercel, abra o projecto moto-box-wc4x → Settings → Environment Variables. Acrescente a variável ANTHROPIC_API_KEY com a chave copiada, para Production e Preview, e guarde.",
  "Em Deployments, abra o menu do último deployment e escolha Redeploy, para a chave passar a valer.",
  "Volte a esta página: o Organizador fica pronto a usar. Em desenvolvimento, ponha a mesma linha no ficheiro .env.local e reinicie o servidor.",
];
