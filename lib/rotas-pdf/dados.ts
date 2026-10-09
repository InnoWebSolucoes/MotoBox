/* ============================================================
   MOTOBOX — Guia em PDF: o que o documento precisa, já contado

   Tudo vem do conteúdo editável (a rota e o documento
   "paginas.rotas"), por isso o guia serve também as rotas que o
   painel criar. Aqui junta-se e conta-se; o desenho fica em
   Guia.tsx.
   ============================================================ */

import { climaDaRota, fontesDaRota } from "@/lib/rotas";
import { F } from "@/lib/rotas-fontes";
import { totais, urlNavegacao } from "@/lib/rotas-mapas";
import { TEXTOS_GUIA, preencher, type ClimaCidade, type ConteudoPaginaRotas, type TextosGuia } from "@/lib/rotas-pagina";
import { MESES_CURTOS, solDoAno } from "@/lib/rotas-sol";
import { coordValida, type FonteRota, type Paragem, type Rota, type Troco } from "@/lib/rotas-tipos";
import { limparTudo } from "./texto";

export interface EntradaGuia {
  rota: Rota;
  pagina: ConteudoPaginaRotas;
  /** Posição da rota na lista do site (0 é a primeira), para "Rota 01". */
  indice: number;
  /** Endereço público do site, sem barra final (urlPublica()). */
  site: string;
  agora?: Date;
}

export interface DiaGuia {
  dia: number;
  titulo: string;
  trocos: Troco[];
  km: number;
  minMota: number;
  /** Navegação do dia no Google Maps (vazio sem duas paragens com coordenadas). */
  navegacao: string;
}

export interface DadosGuia {
  rota: Rota;
  pagina: ConteudoPaginaRotas;
  tx: TextosGuia;
  numero: string;
  totais: ReturnType<typeof totais>;
  dias: DiaGuia[];
  multiDia: boolean;
  noMapa: Paragem[];
  urlRota: string;
  urlGpx: string;
  urlMapa: string;
  clima?: ClimaCidade;
  sol: ReturnType<typeof solDoAno>;
  meses: string[];
  fontes: FonteRota[];
  /** Os números, na lista de fontes, de um conjunto de fontes (para as citações). */
  cita: (fontes: FonteRota[] | FonteRota | undefined) => number[];
  /** Rodapé já preenchido. */
  rodape: string;
  /** "innoweb.agency/motobox/…", sem o protocolo. */
  curto: (url: string) => string;
}

const OSM_ELEMENTO = /openstreetmap\.org\/(node|way|relation)\//;

/** Data de hoje em Angola, ex.: "09/10/2026". */
const dataDeHoje = (agora: Date) =>
  new Intl.DateTimeFormat("pt-PT", { timeZone: "Africa/Luanda", day: "2-digit", month: "2-digit", year: "numeric" }).format(agora);

export function prepararGuia(entrada: EntradaGuia): DadosGuia {
  // Só caracteres que as letras desenham (ver texto.ts).
  const rota = limparTudo(entrada.rota);
  const pagina = limparTudo(entrada.pagina);
  const tx = limparTudo(pagina.guia ?? TEXTOS_GUIA);
  const site = entrada.site.replace(/\/$/, "");
  const curto = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Um troço só entra se as duas paragens existirem (como na página).
  const trocos = rota.trocos.filter((t) => rota.paragens[t.de] && rota.paragens[t.para]);
  const rotaLimpa = { ...rota, trocos };
  const t = totais(rotaLimpa);
  const numerosDias = [...new Set(trocos.map((x) => x.dia))].sort((a, b) => a - b);
  const dias: DiaGuia[] = numerosDias.map((dia) => {
    const doDia = trocos.filter((x) => x.dia === dia);
    const paragensDia = [rota.paragens[doDia[0].de], ...doDia.map((x) => rota.paragens[x.para])].filter(coordValida);
    return {
      dia,
      titulo: rota.horario[dia - 1]?.titulo ?? "",
      trocos: doDia,
      km: Math.round(doDia.reduce((s, x) => s + x.km, 0)),
      minMota: totais({ ...rota, trocos: doDia }).minMota,
      navegacao: paragensDia.length >= 2 ? urlNavegacao(paragensDia) : "",
    };
  });

  const noMapa = rota.paragens.filter(coordValida);
  const clima = climaDaRota(rota, pagina.CLIMA);
  const sol = clima && coordValida(clima) ? solDoAno(clima.lat, clima.lng) : [];
  const meses = Array.isArray(tx.clima?.meses) && tx.clima.meses.length === 12 ? tx.clima.meses : MESES_CURTOS;

  const fontes = fontesDaRota(rota, pagina);
  const posicao = new Map(fontes.map((f, i) => [f.url, i + 1]));
  const cita = (lista: FonteRota[] | FonteRota | undefined) => {
    const todas = Array.isArray(lista) ? lista : lista ? [lista] : [];
    const ns = todas
      .map((f) => (f?.url ? posicao.get(OSM_ELEMENTO.test(f.url) ? F.osm.url : f.url) : undefined))
      .filter((n): n is number => typeof n === "number");
    return [...new Set(ns)].sort((a, b) => a - b);
  };

  return {
    rota: rotaLimpa,
    pagina,
    tx,
    numero: preencher(tx.capa.rota, { n: String(entrada.indice + 1).padStart(2, "0") }),
    totais: t,
    dias,
    multiDia: dias.length > 1,
    noMapa,
    urlRota: `${site}/rotas/${rota.slug}`,
    urlGpx: `${site}/rotas/${rota.slug}/gpx`,
    urlMapa: noMapa.length >= 2 ? urlNavegacao(noMapa) : "",
    clima,
    sol,
    meses,
    fontes,
    cita,
    rodape: preencher(tx.rodape, { site: curto(site), data: dataDeHoje(entrada.agora ?? new Date()) }),
    curto,
  };
}
