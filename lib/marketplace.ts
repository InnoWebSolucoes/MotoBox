/* ============================================================
   MOTOBOX — Regras do marketplace
   O que se pode anunciar, o que passa por verificação antes de
   aparecer e o texto sobre pagamentos. Partilhado pelo formulário
   da conta, pela API, pelo painel e pelas páginas públicas, para
   que mudar uma regra seja mudar um sítio.
   ============================================================ */

import type { AnuncioMarketplace, VerificacaoAnuncio } from "./types";

/** Uma linha da fila de verificação do painel (/api/admin/verificacoes). */
export interface ItemVerificacao {
  anuncio: AnuncioMarketplace;
  verificacao: VerificacaoAnuncio | null;
  /** Outros anúncios com o mesmo número de quadro: sinal de fraude. */
  repetidos: { id: string; titulo: string; vendedor: string }[];
  contacto: { email: string; telefone: string | null } | null;
}

export const CATEGORIAS_ANUNCIO = ["Motas", "Peças", "Equipamento", "Acessórios"] as const;
export const ESTADOS_ARTIGO = ["Nova", "Como nova", "Muito bom", "Bom", "Para peças"] as const;

/** Novo ou usado, a partir da escala de estado do anúncio. */
export const ehNovo = (estado: AnuncioMarketplace["estado"]) => estado === "Nova";

/**
 * Categorias que só aparecem depois de a equipa as rever. As motas
 * são o que se rouba e se vende sem papéis; peças e equipamento
 * publicam logo e ficam sujeitos a denúncia.
 */
const COM_REVISAO = new Set<string>(["Motas"]);
export const precisaRevisao = (categoria: string) => COM_REVISAO.has(categoria);

/** Um anúncio sem estado de moderação é anterior à verificação: está aprovado. */
export const moderacaoDe = (a: Pick<AnuncioMarketplace, "moderacao">) => a.moderacao ?? "aprovado";

/**
 * Documentos que o vendedor de uma mota diz ter. Não se carregam
 * ficheiros: a equipa combina com o vendedor como os ver, até haver
 * regras para guardar documentos pessoais.
 */
export const DOCUMENTOS_MOTA = [
  { id: "titulo", nome: "Título de propriedade" },
  { id: "livrete", nome: "Livrete" },
  { id: "factura", nome: "Factura de compra" },
  { id: "importacao", nome: "Documentos de importação (alfândega)" },
] as const;

export type DocumentoMota = (typeof DOCUMENTOS_MOTA)[number]["id"];
export const ehDocumentoMota = (v: unknown): v is DocumentoMota =>
  DOCUMENTOS_MOTA.some((d) => d.id === v);

/** Número de quadro (VIN/chassi) normalizado: maiúsculas, sem espaços nem traços. */
export const normalizarQuadro = (v: string) => v.toUpperCase().replace(/[\s.-]/g, "");
export const QUADRO_VALIDO = /^[A-Z0-9]{6,25}$/;

/** Página legal com as regras do marketplace, editável em Páginas legais. */
export const SLUG_TERMOS_MARKETPLACE = "termos-marketplace";

/*
 * O modelo de pagamento ainda não está decidido: falou-se de a Motobox
 * guardar o dinheiro do comprador até à entrega. Enquanto não houver
 * decisão, o texto diz só o que acontece hoje. Mudar aqui muda o site,
 * o email ao vendedor e o formulário.
 */
export const AVISO_PAGAMENTO =
  "Por agora, o pagamento é combinado directamente entre comprador e vendedor.";
export const CONSELHO_SEGURANCA =
  "Encontre-se num local público, veja a mota e os documentos antes de pagar e desconfie de preços muito abaixo do mercado.";
