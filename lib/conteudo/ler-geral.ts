import "server-only";

/* ============================================================
   MOTOBOX — Textos gerais e do campeonato, lidos no servidor
   As páginas do campeonato (calendário, resultados, classificação,
   pilotos, equipas, bilhetes) e o layout lêem daqui os textos que
   o painel edita (Provas › Páginas do campeonato e Entrada e
   painel › Geral), já juntos com os de partida, e a temporada das
   Definições. Sem nada gravado, tudo fica como no código.
   ============================================================ */

import { cache } from "react";
import { lerDoc } from "@/lib/conteudo";
import { TEMPORADA } from "@/lib/data";
import { lerDefinicoes } from "@/lib/supabase/publico";
import {
  BILHETES_PADRAO, CALENDARIO_PADRAO, CLASSIFICACAO_PADRAO, COMPRA_PADRAO, EQUIPAS_PADRAO, GERAL_PADRAO,
  METODO_VAZIO, PILOTOS_PADRAO, RESULTADOS_PADRAO, fundirTextos,
  type TextosBilhetes, type TextosCalendario, type TextosClassificacao, type TextosCompra, type TextosEquipas,
  type TextosGerais, type TextosPilotos, type TextosResultados,
} from "./grupos/geral";

/** Um documento junto com o de partida; uma falha de leitura deixa o de partida. */
async function ler<T>(chave: string, padrao: () => T): Promise<T> {
  const gravado = await lerDoc<unknown>(chave).catch(() => null);
  return fundirTextos(padrao(), gravado);
}

/** As Definições, uma leitura por pedido. */
export const lerDefinicoesSite = cache(lerDefinicoes);

/** A temporada em curso (Definições › Temporada); sem ela, a do código. */
export const lerTemporada = cache(async (): Promise<number> => {
  const d = await lerDefinicoesSite().catch(() => null);
  const t = Number(d?.temporada);
  return Number.isInteger(t) && t >= 2000 && t <= 2100 ? t : TEMPORADA;
});

export const lerTextosGerais = cache((): Promise<TextosGerais> => ler("site.geral", GERAL_PADRAO));
export const lerTextosCalendario = cache((): Promise<TextosCalendario> => ler("campeonato.calendario", CALENDARIO_PADRAO));
export const lerTextosResultados = cache((): Promise<TextosResultados> => ler("campeonato.resultados", RESULTADOS_PADRAO));
export const lerTextosClassificacao = cache((): Promise<TextosClassificacao> => ler("campeonato.classificacao", CLASSIFICACAO_PADRAO));
export const lerTextosPilotos = cache((): Promise<TextosPilotos> => ler("campeonato.pilotos", PILOTOS_PADRAO));
export const lerTextosEquipas = cache((): Promise<TextosEquipas> => ler("campeonato.equipas", EQUIPAS_PADRAO));
export const lerTextosBilhetes = cache((): Promise<TextosBilhetes> => ler("campeonato.bilhetes", BILHETES_PADRAO));

/** Textos da compra, com cada meio de pagamento completo e com endereço próprio. */
export const lerTextosCompra = cache(async (): Promise<TextosCompra> => {
  const t = await ler("campeonato.compra", COMPRA_PADRAO);
  const vistos = new Set<string>();
  t.pagamento.metodos = (Array.isArray(t.pagamento.metodos) ? t.pagamento.metodos : []).map((m, i) => {
    const base = { ...METODO_VAZIO(), ...(m && typeof m === "object" ? m : {}) };
    let id = String(base.id || `metodo-${i + 1}`);
    while (vistos.has(id)) id = `${id}-${i + 1}`;
    vistos.add(id);
    return {
      ...base,
      id,
      activo: base.activo !== false,
      linhas: Array.isArray(base.linhas) ? base.linhas.filter((l) => l && (l.rotulo || l.valor)) : [],
    };
  });
  return t;
});
