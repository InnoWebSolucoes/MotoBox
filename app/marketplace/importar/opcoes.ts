/* ============================================================
   MOTOBOX — Pedido de importação: opções e validação
   Partilhado pelo formulário (erros na hora, nas duas línguas)
   e por /api/importacao (a validação que conta, no servidor).
   ============================================================ */

export const CATEGORIAS_IMPORTACAO = [
  { id: "peca", pt: "Peça ou acessório", en: "Part or accessory" },
  { id: "equipamento", pt: "Equipamento (capacete, roupa, botas)", en: "Riding gear (helmet, clothing, boots)" },
  { id: "mota", pt: "Mota", en: "Motorcycle" },
  { id: "moto4", pt: "Moto 4 (quad) ou buggy", en: "Quad or buggy" },
  { id: "mota-agua", pt: "Mota de água", en: "Jet ski" },
  { id: "carro", pt: "Carro", en: "Car" },
  { id: "outro", pt: "Outro", en: "Other" },
] as const;

export type CategoriaImportacao = (typeof CATEGORIAS_IMPORTACAO)[number]["id"];

/**
 * As 21 províncias em vigor desde 1 de Janeiro de 2025 (nova divisão
 * político-administrativa: Icolo e Bengo, Cuando, Cubango e Moxico Leste).
 * Fonte: https://www.vaticannews.va/pt/africa/news/2025-01/angola-nova-divisao-politica-administrativa.html
 * O tipo `Provincia` de lib/types.ts ainda tem as 18 antigas; aqui só serve
 * para a morada de entrega, que segue como texto na mensagem.
 */
export const PROVINCIAS_ANGOLA = [
  "Bengo", "Benguela", "Bié", "Cabinda", "Cuando", "Cuanza Norte", "Cuanza Sul", "Cubango",
  "Cunene", "Huambo", "Huíla", "Icolo e Bengo", "Luanda", "Lunda Norte", "Lunda Sul",
  "Malanje", "Moxico", "Moxico Leste", "Namibe", "Uíge", "Zaire",
] as const;

export interface PedidoImportacao {
  ligacao: string;
  titulo: string;
  categoria: CategoriaImportacao;
  quantidade: number;
  nome: string;
  email: string;
  telefone: string;
  provincia: string;
  notas: string;
}

export type CampoPedido = keyof PedidoImportacao;

export type CodigoErro =
  | "ligacao" | "titulo" | "categoria" | "quantidade" | "nome" | "email" | "telefone" | "provincia" | "notas";

/** Mensagens de erro por campo. O servidor responde em português. */
export const MENSAGENS_ERRO: Record<CodigoErro, { pt: string; en: string }> = {
  ligacao: {
    pt: "Cole a ligação completa para o produto (começa por https://).",
    en: "Paste the full link to the product (starting with https://).",
  },
  titulo: { pt: "Diga-nos o que é (mín. 3 caracteres).", en: "Tell us what it is (at least 3 characters)." },
  categoria: { pt: "Escolha o tipo de artigo.", en: "Choose the type of item." },
  quantidade: { pt: "A quantidade vai de 1 a 50.", en: "Quantity must be between 1 and 50." },
  nome: { pt: "Indique o seu nome.", en: "Please enter your name." },
  email: { pt: "Email inválido.", en: "Invalid email." },
  telefone: { pt: "Número de telefone inválido.", en: "Invalid phone number." },
  provincia: { pt: "Escolha a província de entrega.", en: "Choose the delivery province." },
  notas: { pt: "As notas são demasiado longas (máx. 2000 caracteres).", en: "Notes are too long (max. 2000 characters)." },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Uma linha: sem quebras nem espaços repetidos. */
const linha = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

function ligacaoValida(v: string): boolean {
  if (v.length > 600) return false;
  try {
    const u = new URL(v);
    return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Normaliza o que chegou (do formulário ou do corpo do pedido) e diz o que
 * está mal. Sem erros, `pedido` está pronto a guardar.
 */
export function validarPedido(dados: Record<string, unknown>): {
  pedido: PedidoImportacao;
  erros: Partial<Record<CampoPedido, CodigoErro>>;
} {
  const quantidadeBruta = typeof dados.quantidade === "number" ? dados.quantidade : Number(dados.quantidade);
  const notas = typeof dados.notas === "string"
    ? dados.notas.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : "";

  const pedido: PedidoImportacao = {
    ligacao: linha(dados.ligacao, 1000),
    titulo: linha(dados.titulo, 160),
    categoria: linha(dados.categoria, 40) as CategoriaImportacao,
    quantidade: quantidadeBruta,
    nome: linha(dados.nome, 120),
    email: linha(dados.email, 200).toLowerCase(),
    telefone: linha(dados.telefone, 40),
    provincia: linha(dados.provincia, 60),
    notas,
  };

  const erros: Partial<Record<CampoPedido, CodigoErro>> = {};
  if (!ligacaoValida(pedido.ligacao)) erros.ligacao = "ligacao";
  if (pedido.titulo.length < 3 || pedido.titulo.length > 120) erros.titulo = "titulo";
  if (!CATEGORIAS_IMPORTACAO.some((c) => c.id === pedido.categoria)) erros.categoria = "categoria";
  if (!Number.isInteger(pedido.quantidade) || pedido.quantidade < 1 || pedido.quantidade > 50) erros.quantidade = "quantidade";
  if (pedido.nome.length < 3) erros.nome = "nome";
  if (!EMAIL.test(pedido.email)) erros.email = "email";
  if (pedido.telefone && (pedido.telefone.replace(/\D/g, "").length < 7 || !/^[\d\s+().-]+$/.test(pedido.telefone))) {
    erros.telefone = "telefone";
  }
  if (!(PROVINCIAS_ANGOLA as readonly string[]).includes(pedido.provincia)) erros.provincia = "provincia";
  if (pedido.notas.length > 2000) erros.notas = "notas";

  return { pedido, erros };
}
