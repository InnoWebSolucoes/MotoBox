import "server-only";

/* ============================================================
   MOTOBOX — Fórum: votos (servidor)
   A base de dados não tem coluna de votos, e não se criam tabelas
   novas: os votos vivem no conteúdo editável (lib/conteudo), num
   grupo "forum-votos" com uma linha por tópico ou resposta votada:

     chave  "forum-votos.<id do tópico ou da resposta>"
     dados  { alvo, total, quem: [assinaturas] }

   `quem` não guarda o identificador das contas: guarda uma
   assinatura (HMAC com a chave de serviço) de cada conta. Chega
   para saber se a pessoa já votou, e quem lê a linha pública não
   fica a saber quem votou em quê. Um voto por conta e por alvo;
   votar outra vez retira o voto.

   Só as rotas de membro (/api/forum/votar) e a de moderação
   (/admin/forum/extra) escrevem, sempre do lado do servidor.
   O grupo não aparece no editor de conteúdo: não é texto do site.
   ============================================================ */

import { createHmac } from "node:crypto";
import {
  apagarLinha, emModoLocal, gravarLinha, lerLinhasAdmin, lerLinhasPublicas, PREFIXO,
} from "@/lib/conteudo/servidor";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GRUPO_VOTOS = "forum-votos";

export interface LinhaVotos {
  alvo: string;
  total: number;
  quem: string[];
}

/** Parte da chave para um id (as chaves do conteúdo só têm minúsculas, números e hífenes). */
export const chaveAlvo = (alvoId: string) => alvoId.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 120);

export const chaveVotos = (alvoId: string) => `${GRUPO_VOTOS}.${chaveAlvo(alvoId)}`;

/** Assinatura de uma conta: igual sempre para a mesma conta, sem revelar qual é. */
export function assinatura(userId: string): string {
  const segredo = process.env.SUPABASE_SERVICE_ROLE_KEY || "motobox-local";
  return createHmac("sha256", segredo).update(`forum-voto:${userId}`).digest("hex").slice(0, 24);
}

function normalizar(dados: unknown, alvo: string): LinhaVotos {
  const d = (dados && typeof dados === "object" ? dados : {}) as Record<string, unknown>;
  const quem = Array.isArray(d.quem) ? [...new Set(d.quem.filter((q): q is string => typeof q === "string"))] : [];
  return { alvo: typeof d.alvo === "string" ? d.alvo : alvo, total: quem.length, quem };
}

/**
 * Contagem de votos de todos os alvos, para as páginas públicas (a mesma
 * leitura do conteúdo editável que a página já faz: sem pedido extra).
 * A chave do mapa é `chaveAlvo(id)`.
 */
export async function lerContagens(): Promise<Map<string, number>> {
  const linhas = await lerLinhasPublicas();
  const mapa = new Map<string, number>();
  const prefixo = `${GRUPO_VOTOS}.`;
  for (const [chave, linha] of linhas) {
    if (!chave.startsWith(prefixo)) continue;
    const n = normalizar(linha.dados, "").total;
    if (n > 0) mapa.set(chave.slice(prefixo.length), n);
  }
  return mapa;
}

/** Votos de um alvo no mapa de `lerContagens`. */
export const votosDe = (mapa: Map<string, number>, alvoId: string) => mapa.get(chaveAlvo(alvoId)) ?? 0;

/** Todas as linhas de votos, frescas (painel de gestão e rotas). */
export async function lerTodasAdmin(): Promise<Map<string, LinhaVotos>> {
  const linhas = await lerLinhasAdmin();
  const mapa = new Map<string, LinhaVotos>();
  const prefixo = `${GRUPO_VOTOS}.`;
  for (const [chave, linha] of linhas) {
    if (chave.startsWith(prefixo)) mapa.set(chave.slice(prefixo.length), normalizar(linha.dados, chave.slice(prefixo.length)));
  }
  return mapa;
}

/** Uma linha lida agora mesmo da base (sem a cache do pedido). */
async function lerFresca(alvoId: string): Promise<LinhaVotos> {
  const chave = chaveVotos(alvoId);
  if (emModoLocal()) return normalizar((await lerLinhasAdmin()).get(chave)?.dados, alvoId);
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase não configurado.");
  const { data, error } = await db.from("paginas_legais").select("seccoes").eq("slug", PREFIXO + chave).maybeSingle();
  if (error) throw new Error(error.message);
  return normalizar(data?.seccoes, alvoId);
}

/*
 * Ler-mudar-gravar em fila por alvo, para dois votos seguidos no mesmo
 * tópico (na mesma instância do servidor) não se apagarem um ao outro.
 */
const filas = new Map<string, Promise<unknown>>();
function emFila<T>(chave: string, tarefa: () => Promise<T>): Promise<T> {
  const antes = filas.get(chave) ?? Promise.resolve();
  const agora = antes.catch(() => undefined).then(tarefa);
  filas.set(chave, agora);
  void agora.finally(() => { if (filas.get(chave) === agora) filas.delete(chave); }).catch(() => undefined);
  return agora;
}

/**
 * Dá ou retira o voto de uma conta. Sem `querVotar`, troca o estado.
 * Devolve o total e se a conta fica a votar.
 */
export function votar(alvoId: string, userId: string, querVotar?: boolean): Promise<{ total: number; votado: boolean }> {
  const chave = chaveVotos(alvoId);
  return emFila(chave, async () => {
    const linha = await lerFresca(alvoId);
    const eu = assinatura(userId);
    const tinha = linha.quem.includes(eu);
    const fica = querVotar ?? !tinha;
    if (fica === tinha) return { total: linha.quem.length, votado: tinha };
    const quem = fica ? [...linha.quem, eu] : linha.quem.filter((q) => q !== eu);
    if (quem.length === 0) {
      await apagarLinha(chave);
    } else {
      await gravarLinha(chave, `Votos do fórum: ${alvoId}`, { alvo: alvoId, total: quem.length, quem }, GRUPO_VOTOS);
    }
    return { total: quem.length, votado: fica };
  });
}

/** Quais destes alvos já têm o voto da conta. */
export async function votadosPor(userId: string, alvos: string[]): Promise<string[]> {
  if (alvos.length === 0) return [];
  const eu = assinatura(userId);
  const linhas = await lerLinhasPublicas();
  return alvos.filter((id) => {
    const dados = linhas.get(chaveVotos(id))?.dados;
    return normalizar(dados, id).quem.includes(eu);
  });
}

/** Moderação: tira todos os votos de um alvo. */
export async function reporVotos(alvoId: string): Promise<void> {
  await emFila(chaveVotos(alvoId), () => apagarLinha(chaveVotos(alvoId)));
}
