/* ============================================================
   MOTOBOX — Nascer e pôr do sol nas rotas

   Calculado, não copiado: o algoritmo é o da NOAA (método do
   "ano fraccionário", com o sol a 90,833° do zénite, que inclui a
   refracção e o raio do disco). Angola está em UTC+1 todo o ano,
   sem hora de Verão. Para o dia 15 de cada mês o erro em relação
   às tabelas publicadas é de um a dois minutos.
   ============================================================ */

import type { FonteRota } from "@/lib/rotas";

export const FONTE_SOL: FonteRota = {
  nome: "NOAA: equações do nascer e pôr do sol",
  url: "https://gml.noaa.gov/grad/solcalc/solareqns.PDF",
};

const RAD = Math.PI / 180;

/** Hora local (WAT, UTC+1) em minutos desde a meia-noite. */
function nascerPor(lat: number, lng: number, mes: number, dia = 15): [number, number] {
  // Ano comum: o dia do ano chega para a precisão que interessa aqui.
  const inicioMes = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const doy = inicioMes[mes - 1] + dia;
  const g = ((2 * Math.PI) / 365) * (doy - 1);
  const eqt =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  const ha =
    Math.acos(Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) - Math.tan(lat * RAD) * Math.tan(decl)) / RAD;
  const fuso = 60;
  return [720 - 4 * (lng + ha) - eqt + fuso, 720 - 4 * (lng - ha) - eqt + fuso];
}

export const hhmm = (min: number) => {
  const m = Math.round(min);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Nascer e pôr do sol a 15 de cada mês, no ponto dado. */
export function solDoAno(lat: number, lng: number) {
  return MESES_CURTOS.map((mes, i) => {
    const [n, p] = nascerPor(lat, lng, i + 1);
    return { mes, nascer: hhmm(n), por: hhmm(p), luzMin: Math.round(p - n) };
  });
}
