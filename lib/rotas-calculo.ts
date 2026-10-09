/* ============================================================
   MOTOBOX — Cálculo do traçado de uma rota

   O mesmo método com que se gerou lib/rotas-tracados.ts, para o
   painel de gestão poder recalcular uma rota quando as paragens
   mudam (ver app/api/admin/rotas/tracado):

   - troços: distância e tempo de carro do OSRM (servidor público
     router.project-osrm.org, perfil de carro, com inversão de
     marcha permitida nas paragens), sobre o OpenStreetMap;
   - traçado: a geometria completa do OSRM, simplificada (Douglas-
     Peucker, 12 m) e codificada como polilinha (precisão 5);
   - altitudes: modelo SRTM de 30 m, lido no OpenTopoData, nas
     paragens e ao longo do traçado; a subida e a descida somam-se
     depois de uma mediana móvel de cerca de 2 km e com um limiar de
     10 m, para não contar o ruído do modelo.
   ============================================================ */

import { descodificar } from "@/lib/rotas-mapas";

export type Coord = { lat: number; lng: number };
type Pt = [number, number];

const R = 6371008.8;
const rad = (g: number) => (g * Math.PI) / 180;

/** Distância em metros entre dois pontos [lat, lng]. */
export function distancia(a: Pt, b: Pt): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Codifica uma polilinha (formato do Google, precisão 5). */
export function codificar(pts: Pt[]): string {
  let out = "";
  let pLat = 0;
  let pLng = 0;
  const enc = (v: number) => {
    let x = v < 0 ? ~(v << 1) : v << 1;
    let s = "";
    while (x >= 0x20) {
      s += String.fromCharCode((0x20 | (x & 0x1f)) + 63);
      x >>= 5;
    }
    return s + String.fromCharCode(x + 63);
  };
  for (const [lat, lng] of pts) {
    const a = Math.round(lat * 1e5);
    const b = Math.round(lng * 1e5);
    out += enc(a - pLat) + enc(b - pLng);
    pLat = a;
    pLng = b;
  }
  return out;
}

/** Distância (m) de p ao segmento a–b, numa projecção local plana. */
function distSegmento(p: Pt, a: Pt, b: Pt): number {
  const kx = Math.cos(rad(p[0])) * 111320;
  const ky = 110540;
  const ax = (a[1] - p[1]) * kx, ay = (a[0] - p[0]) * ky;
  const bx = (b[1] - p[1]) * kx, by = (b[0] - p[0]) * ky;
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2)) : 0;
  const x = ax + t * dx, y = ay + t * dy;
  return Math.sqrt(x * x + y * y);
}

/** Simplificação de Douglas-Peucker, com a tolerância em metros (iterativa). */
export function simplificar(pts: Pt[], tolerancia = 12): Pt[] {
  if (pts.length < 3) return pts.slice();
  const manter = new Uint8Array(pts.length);
  manter[0] = 1;
  manter[pts.length - 1] = 1;
  const pilha: [number, number][] = [[0, pts.length - 1]];
  while (pilha.length) {
    const [i, j] = pilha.pop()!;
    let max = 0;
    let k = -1;
    for (let m = i + 1; m < j; m++) {
      const d = distSegmento(pts[m], pts[i], pts[j]);
      if (d > max) { max = d; k = m; }
    }
    if (k >= 0 && max > tolerancia) {
      manter[k] = 1;
      pilha.push([i, k], [k, j]);
    }
  }
  return pts.filter((_, i) => manter[i]);
}

/** Pontos a cada `passo` metros ao longo da linha (com o primeiro e o último). */
export function reamostrar(pts: Pt[], passo: number): Pt[] {
  if (pts.length < 2) return pts.slice();
  const out: Pt[] = [pts[0]];
  let falta = passo;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1];
    const b = pts[i];
    let d = distancia(a, b);
    while (d >= falta && d > 0) {
      const t = falta / d;
      const p: Pt = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      out.push(p);
      a = p;
      d -= falta;
      falta = passo;
    }
    falta -= d;
  }
  const ultimo = pts[pts.length - 1];
  if (out[out.length - 1] !== ultimo) out.push(ultimo);
  return out;
}

const mediana = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Subida e descida acumuladas: mediana móvel e limiar contra o ruído do modelo. */
export function subidaDescida(alts: number[], janela: number, limiar = 10) {
  const meio = Math.max(0, Math.floor(janela / 2));
  const suave = alts.map((_, i) => mediana(alts.slice(Math.max(0, i - meio), i + meio + 1)));
  let subida = 0;
  let descida = 0;
  let ref = suave[0] ?? 0;
  for (const v of suave) {
    if (v - ref >= limiar) { subida += v - ref; ref = v; }
    else if (ref - v >= limiar) { descida += ref - v; ref = v; }
  }
  return { subida: Math.round(subida), descida: Math.round(descida) };
}

/* ---------------- Serviços públicos ---------------- */

const OSRM = "https://router.project-osrm.org/route/v1/driving";
const TOPO = "https://api.opentopodata.org/v1/srtm30m";
const AGENTE = "MotoBox Angola (painel de gestão)";

export class ErroCalculo extends Error {}

/** Caminho de carro do OSRM pelas paragens, pela ordem. */
export async function pedirOsrm(paragens: Coord[]) {
  const coords = paragens.map((p) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
  const url = `${OSRM}/${coords}?overview=full&geometries=polyline&steps=false&continue_straight=false`;
  let r: Response;
  try {
    r = await fetch(url, { headers: { "User-Agent": AGENTE }, cache: "no-store", signal: AbortSignal.timeout(30000) });
  } catch {
    throw new ErroCalculo("O serviço de rotas (OSRM) não respondeu. Tente outra vez dentro de um minuto.");
  }
  const j = (await r.json().catch(() => null)) as
    | { code?: string; message?: string; routes?: { geometry: string; legs: { distance: number; duration: number }[] }[] }
    | null;
  if (!j || j.code !== "Ok" || !j.routes?.length) {
    if (j?.code === "NoRoute") throw new ErroCalculo("Não há caminho de estrada entre estas paragens. Confirme as coordenadas.");
    if (j?.code === "NoSegment") throw new ErroCalculo("Uma das paragens está longe de qualquer estrada. Confirme as coordenadas.");
    throw new ErroCalculo(`O serviço de rotas (OSRM) recusou o pedido${j?.message ? `: ${j.message}` : "."}`);
  }
  const rota = j.routes[0];
  return { pontos: descodificar(rota.geometry), pernas: rota.legs.map((l) => ({ distancia: l.distance, duracao: l.duration })) };
}

const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

/** Altitudes do SRTM (30 m) no OpenTopoData: 100 pontos por pedido, um pedido por segundo. */
export async function pedirAltitudes(pts: Pt[]): Promise<number[]> {
  const alts: number[] = [];
  for (let i = 0; i < pts.length; i += 100) {
    if (i > 0) await espera(1100);
    const lote = pts.slice(i, i + 100);
    const locais = lote.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join("|");
    const r = await fetch(TOPO, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": AGENTE },
      body: JSON.stringify({ locations: locais }),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    const j = (await r.json().catch(() => null)) as { status?: string; results?: { elevation: number | null }[] } | null;
    if (!j || j.status !== "OK" || !j.results) throw new ErroCalculo("O serviço de altitudes não respondeu.");
    for (const x of j.results) alts.push(typeof x.elevation === "number" ? x.elevation : NaN);
  }
  return alts;
}

/* ---------------- O cálculo inteiro ---------------- */

export interface ResultadoCalculo {
  /** Uma perna por cada par de paragens seguidas. */
  pernas: { km: number; min: number }[];
  /** Altitude de cada paragem, em metros (null se o serviço de altitudes falhar). */
  altitudes: (number | null)[];
  altimetria: { min: number; max: number; subida: number; descida: number } | null;
  tracado: string;
  /** Distância total, em km. */
  km: number;
  /** Aviso quando só parte do cálculo correu bem. */
  aviso?: string;
}

export async function calcularTracado(paragens: Coord[]): Promise<ResultadoCalculo> {
  const { pontos, pernas } = await pedirOsrm(paragens);
  const tracado = codificar(simplificar(pontos, 12));
  const pernasKm = pernas.map((l) => ({ km: Math.round(l.distancia / 100) / 10, min: Math.round(l.duracao / 60) }));
  const km = Math.round(pernas.reduce((s, l) => s + l.distancia, 0) / 100) / 10;

  // Amostras ao longo do traçado: no máximo umas 500, para não abusar do serviço público.
  const comprimento = pernas.reduce((s, l) => s + l.distancia, 0);
  const passo = Math.max(250, comprimento / 500);
  const amostras = reamostrar(pontos, passo);
  const locais: Pt[] = [...paragens.map((p) => [p.lat, p.lng] as Pt), ...amostras];

  try {
    const alts = await pedirAltitudes(locais);
    const nasParagens = alts.slice(0, paragens.length).map((a) => (Number.isFinite(a) ? Math.round(a) : null));
    const aoLongo = alts.slice(paragens.length).filter(Number.isFinite);
    const todas = [...aoLongo, ...nasParagens.filter((a): a is number => a !== null)];
    const janela = Math.max(1, Math.round(2000 / passo));
    const { subida, descida } = subidaDescida(aoLongo, janela);
    return {
      pernas: pernasKm,
      altitudes: nasParagens,
      altimetria: todas.length
        ? { min: Math.round(Math.min(...todas)), max: Math.round(Math.max(...todas)), subida, descida }
        : null,
      tracado,
      km,
    };
  } catch {
    return {
      pernas: pernasKm,
      altitudes: paragens.map(() => null),
      altimetria: null,
      tracado,
      km,
      aviso: "O traçado e as distâncias foram calculados, mas o serviço de altitudes não respondeu: as altitudes ficaram como estavam.",
    };
  }
}
