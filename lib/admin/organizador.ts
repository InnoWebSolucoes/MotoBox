import "server-only";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA
   Um agente com o Claude que faz, a pedido da equipa, tudo o
   que se faz no painel: consulta os dados, prepara eventos com
   bilhetes, publica resultados e acerta a classificação, edita
   conteúdos do site, responde a mensagens, modera denúncias,
   escreve artigos a partir de notas. Nada muda sem aprovação:
   cada mudança chega ao painel como proposta, com o antes e o
   depois, e só executa depois de o administrador a aprovar.

   Peças (em lib/admin/organizador/):
     tipos.ts        tipos partilhados com o painel
     campos.ts       campos de cada coleção e validação de valores
     repositorio.ts  acesso aos dados (o mesmo caminho da API de administração)
     planos.ts       propostas: operações, antes e depois, permissões
     executar.ts     execução do que foi aprovado e registo de actividade
     ferramentas.ts  as ferramentas que o Claude usa
     sistema.ts      o prompt de sistema e o contexto de cada pedido
     agente.ts       o ciclo com o Claude, em streaming
     sessao.ts       quem pede e com que papel
   ============================================================ */

import { TEMPORADA } from "@/lib/data";
import { repositorio } from "./organizador/repositorio";
import { hojeLuanda } from "./organizador/ferramentas";
import type { Contexto } from "./organizador/planos";
import type { Quem } from "./organizador/sessao";

export * from "./organizador/tipos";
export {
  MODELO, SEM_CHAVE, ErroOrganizador, aCometer, chaveConfigurada, correrAgente, limparFallback,
  prepararAnexos, propostaDe, resolverDecisoes, traduzirErro, usosDe, validarHistorico,
} from "./organizador/agente";
export { contextoDoPedido, promptSistema } from "./organizador/sistema";
export {
  definicoesFerramentas, eEscrita as ferramentaEscrita, hojeLuanda, planearComFerramenta, validarEntrada,
} from "./organizador/ferramentas";
export { podeEscrever, quemPede, quemCom, type Quem } from "./organizador/sessao";
export type { Contexto } from "./organizador/planos";

/** Verdadeiro quando a chave da API do Claude está no servidor. */
export const organizadorConfigurado = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** O contexto de um pedido: dados, quem pede, hoje em Luanda e a temporada. */
export async function criarContexto(quem: Quem): Promise<Contexto> {
  const repo = await repositorio();
  const defs = await repo.lerDefinicoes().catch(() => ({} as Record<string, unknown>));
  const t = Number(defs.temporada);
  return {
    repo, quem,
    hoje: hojeLuanda(),
    temporada: Number.isInteger(t) && t >= 2000 && t <= 2100 ? t : TEMPORADA,
  };
}
