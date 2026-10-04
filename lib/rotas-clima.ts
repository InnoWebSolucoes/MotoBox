/* ============================================================
   MOTOBOX — Clima por mês, nas cidades de referência das rotas

   Valores copiados das caixas de clima da Wikipedia (em linha a
   3 de Outubro de 2026), com a fonte primária que cada caixa
   indica. Benguela, Sumbe, N'dalatando e Tômbwa não têm caixa
   de clima: para a costa de Benguela usa-se o Lobito, a 30 km.
   ============================================================ */

import type { FonteRota } from "@/lib/rotas";

export type CidadeClima = "luanda" | "lubango" | "malanje" | "mocamedes" | "lobito";

export interface Clima {
  cidade: string;
  /** Ponto para o cálculo do nascer e do pôr do sol. */
  lat: number;
  lng: number;
  fonte: FonteRota;
  /** De onde vêm os números e de que período. */
  nota: string;
  meses: { max: number; min: number; chuva: number }[];
}

const m = (max: number[], min: number[], chuva: number[]) => max.map((x, i) => ({ max: x, min: min[i], chuva: chuva[i] }));

export const CLIMA: Record<CidadeClima, Clima> = {
  luanda: {
    cidade: "Luanda",
    lat: -8.8383,
    lng: 13.2344,
    fonte: { nome: "Wikipedia: Luanda (clima)", url: "https://en.wikipedia.org/wiki/Luanda#Climate" },
    nota: "Temperaturas de 2001 a 2025 (aeroporto de Luanda, Iowa Environmental Mesonet) e chuva de 1961 a 1990 (Deutscher Wetterdienst).",
    meses: m(
      [30.0, 30.6, 31.0, 30.6, 29.1, 26.1, 24.6, 24.6, 26.0, 27.7, 29.0, 29.3],
      [24.6, 25.1, 25.3, 24.9, 24.0, 21.1, 19.4, 19.4, 20.9, 22.9, 24.2, 24.6],
      [30, 36, 114, 136, 16, 0, 0, 1, 2, 7, 32, 31],
    ),
  },
  lubango: {
    cidade: "Lubango",
    lat: -14.9167,
    lng: 13.5,
    fonte: { nome: "Wikipedia: Lubango (clima)", url: "https://en.wikipedia.org/wiki/Lubango#Climate" },
    nota: "Médias de 1931 a 1960, do Deutscher Wetterdienst.",
    meses: m(
      [25.0, 24.6, 24.6, 24.9, 24.8, 23.6, 24.2, 26.2, 28.2, 28.0, 26.3, 25.3],
      [13.1, 12.9, 13.0, 12.5, 9.8, 7.9, 8.3, 11.0, 13.4, 13.4, 13.2, 13.2],
      [140, 153, 172, 94, 6, 0, 0, 0, 4, 70, 118, 153],
    ),
  },
  malanje: {
    cidade: "Malanje",
    lat: -9.5333,
    lng: 16.35,
    fonte: { nome: "Wikipedia: Malanje (clima)", url: "https://en.wikipedia.org/wiki/Malanje#Climate" },
    nota: "Valores arredondados do Weatherbase, citados pela Wikipedia; o período não é indicado.",
    meses: m(
      [27, 27, 28, 27, 29, 28, 29, 30, 29, 28, 27, 27],
      [16, 16, 16, 16, 13, 9, 9, 12, 15, 16, 16, 16],
      [80, 130, 190, 160, 10, 0, 0, 0, 50, 120, 200, 140],
    ),
  },
  mocamedes: {
    cidade: "Moçâmedes",
    lat: -15.1953,
    lng: 12.1508,
    fonte: { nome: "Wikipedia: Moçâmedes (clima)", url: "https://en.wikipedia.org/wiki/Mo%C3%A7%C3%A2medes#Climate" },
    nota: "Médias de 1961 a 1990, do Deutscher Wetterdienst.",
    meses: m(
      [27.0, 28.0, 28.9, 27.9, 25.8, 22.4, 20.6, 20.9, 22.4, 23.6, 25.3, 25.9],
      [19.1, 19.8, 20.7, 18.7, 14.7, 12.8, 13.0, 13.8, 14.9, 15.9, 17.1, 17.7],
      [7, 10, 17, 10, 0, 0, 0, 0, 0, 1, 2, 3],
    ),
  },
  lobito: {
    cidade: "Lobito",
    lat: -12.35,
    lng: 13.5464,
    fonte: { nome: "Wikipedia: Lobito (clima)", url: "https://en.wikipedia.org/wiki/Lobito#Climate" },
    nota: "Valores do Sistema de Clasificación Bioclimática Mundial, citados pela Wikipedia; o período não é indicado. Benguela, a 30 km, não tem tabela própria.",
    meses: m(
      [28.3, 29.4, 30.6, 30.0, 28.3, 25.6, 23.3, 23.3, 24.4, 26.1, 28.3, 28.3],
      [22.2, 23.3, 23.9, 23.9, 21.6, 18.9, 17.2, 16.7, 18.3, 20.6, 22.2, 22.2],
      [20, 38, 119, 53, 3, 0, 0, 1, 3, 31, 25, 61],
    ),
  },
};
