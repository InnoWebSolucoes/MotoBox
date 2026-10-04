/* ============================================================
   MOTOBOX — Estado da estrada
   O que quem anda de mota conta das estradas, por rota. As
   estradas angolanas mudam depressa (uma é arranjada, outra
   abre buracos), por isso cada relato leva a data e a página
   pede sempre relatos novos. Actualizar aqui ou, mais tarde,
   no painel de gestão.

   Relatos de Outubro de 2026: Sofia Mussungo (MotoBox), na
   reunião de 4 de Outubro de 2026, sobre viagens recentes.
   ============================================================ */

export type Estado = "boa" | "irregular" | "má";

export interface RelatoEstrada {
  troco: string;
  estado: Estado;
  nota: string;
}

export interface EstadoEstrada {
  /** Mês do relato, como se mostra na página. */
  quando: string;
  relatos: RelatoEstrada[];
}

const OUT_2026 = "Outubro de 2026";

const LUANDA_CABO_LEDO: RelatoEstrada = {
  troco: "Luanda → Cabo Ledo (EN100)",
  estado: "irregular",
  nota: "Não está muito boa até Cabo Ledo: atenção aos buracos e às bermas.",
};

const CHEGAR_AO_LUBANGO: RelatoEstrada = {
  troco: "Benguela → Lubango (para chegar à rota)",
  estado: "má",
  nota: "Muito degradada, pior do que há dois anos. Conte com mais tempo e ritmo baixo.",
};

export const ESTADO_ESTRADA: Record<string, EstadoEstrada> = {
  "kalandula-e-pungo-andongo": {
    quando: OUT_2026,
    relatos: [
      {
        troco: "Luanda → Malanje",
        estado: "má",
        nota: "Toda esburacada. Há uns anos dava para ir a Malanje almoçar e voltar no mesmo dia; agora não conte com isso.",
      },
    ],
  },
  "miradouro-da-lua": { quando: OUT_2026, relatos: [LUANDA_CABO_LEDO] },
  "cabo-ledo-e-quicama": { quando: OUT_2026, relatos: [LUANDA_CABO_LEDO] },
  "estrada-da-costa": {
    quando: OUT_2026,
    relatos: [
      LUANDA_CABO_LEDO,
      { troco: "Depois de Cabo Ledo", estado: "boa", nota: "Melhora: estrada boa até perto da Canjala." },
      { troco: "Zona da Canjala", estado: "má", nota: "Volta a estar mal. Depois de passar, a estrada fica boa outra vez." },
    ],
  },
  "serra-da-leba": { quando: OUT_2026, relatos: [CHEGAR_AO_LUBANGO] },
  tundavala: { quando: OUT_2026, relatos: [CHEGAR_AO_LUBANGO] },
};

export const estadoDaEstrada = (slug: string): EstadoEstrada | undefined => ESTADO_ESTRADA[slug];
