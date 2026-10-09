/* ============================================================
   MOTOBOX — Guia em PDF: o percurso em esquema

   O traçado do OSRM gravado com a rota (ou, sem ele, linhas
   rectas entre as paragens), com as paragens numeradas como no
   itinerário, a escala e o norte. Desenhado em vector, sem
   pedir mapas a ninguém: funciona sem rede e imprime nítido.
   ============================================================ */

import { Path, Svg, Text, View } from "@react-pdf/renderer";
import { simplificar } from "@/lib/rotas-calculo";
import { descodificar } from "@/lib/rotas-mapas";
import type { Paragem } from "@/lib/rotas-tipos";
import { COR } from "./estilos";

type Pt = [number, number];

const MARCA = 13;
const ESCALAS_KM = [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500];

/** Distância (km) em bom número para a barra de escala, até `max` km. */
const escalaRedonda = (max: number) => ESCALAS_KM.filter((k) => k <= max).pop() ?? ESCALAS_KM[0];

export interface MarcaMapa {
  numero: number;
  paragem: Paragem;
  tipo: "partida" | "meio" | "chegada";
}

export function MapaEsquema({
  tracado, marcas, largura: total, norte, escala: rotuloEscala,
}: {
  tracado: string | undefined;
  marcas: MarcaMapa[];
  largura: number;
  norte: string;
  escala: string;
}) {
  const linha: Pt[] = tracado ? descodificar(tracado) : marcas.map((m) => [m.paragem.lat, m.paragem.lng]);
  const todos: Pt[] = [...linha, ...marcas.map((m): Pt => [m.paragem.lat, m.paragem.lng])];
  if (todos.length < 2) return null;
  // A moldura tem 0,75 pt de cada lado.
  const largura = total - 1.5;

  const lats = todos.map((p) => p[0]);
  const lngs = todos.map((p) => p[1]);
  const latMin = Math.min(...lats), latMax = Math.max(...lats);
  const lngMin = Math.min(...lngs), lngMax = Math.max(...lngs);
  const k = Math.cos((((latMin + latMax) / 2) * Math.PI) / 180);
  // Graus "planos": a longitude encolhida pelo cosseno da latitude.
  const larguraGeo = Math.max((lngMax - lngMin) * k, 0.005);
  const alturaGeo = Math.max(latMax - latMin, 0.005);

  const folga = 26;
  const util = largura - 2 * folga;
  const altura = Math.min(300, Math.max(170, (alturaGeo / larguraGeo) * util + 2 * folga));
  const escala = Math.min(util / larguraGeo, (altura - 2 * folga) / alturaGeo); // pontos por grau
  const ox = (largura - larguraGeo * escala) / 2;
  const oy = (altura - alturaGeo * escala) / 2;
  const x = (lng: number) => ox + (lng - lngMin) * k * escala;
  const y = (lat: number) => oy + (latMax - lat) * escala;

  // Metros por ponto, para simplificar o traçado ao que se vê e para a escala.
  const mpp = 111_320 / escala;
  const pontos = simplificar(linha, mpp * 0.35);
  const d = pontos.map(([la, ln], i) => `${i ? "L" : "M"}${x(ln).toFixed(1)} ${y(la).toFixed(1)}`).join("");

  // Marcas que caiam umas em cima das outras (voltas que acabam onde começaram) afastam-se.
  const postas: { cx: number; cy: number }[] = [];
  const desvios: Pt[] = [[0, 0], [MARCA + 2, 0], [-(MARCA + 2), 0], [0, -(MARCA + 2)], [0, MARCA + 2], [2 * (MARCA + 2), 0]];
  const lugares = marcas.map((m) => {
    const bx = x(m.paragem.lng);
    const by = y(m.paragem.lat);
    let lugar = { cx: bx, cy: by };
    for (const [dx, dy] of desvios) {
      const c = { cx: bx + dx, cy: by + dy };
      if (postas.every((p) => Math.abs(p.cx - c.cx) >= MARCA + 1 || Math.abs(p.cy - c.cy) >= MARCA + 1)) {
        lugar = c;
        break;
      }
    }
    postas.push(lugar);
    return lugar;
  });

  const km = escalaRedonda((80 * mpp) / 1000);
  const barra = (km * 1000) / mpp;

  return (
    <View style={{ width: total, backgroundColor: "#fafafb", borderWidth: 0.75, borderColor: COR.linha, borderRadius: 4 }}>
      <View style={{ width: largura, height: altura, position: "relative" }}>
        <Svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {/* Contorno branco por baixo do vermelho, para a linha se ler onde se cruza. */}
          <Path d={d} stroke={COR.branco} strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Path d={d} stroke={COR.vermelho} strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {/* Linhas finas das marcas que tiveram de se afastar do sítio certo. */}
          {lugares.map((l, i) => {
            const bx = x(marcas[i].paragem.lng);
            const by = y(marcas[i].paragem.lat);
            return l.cx === bx && l.cy === by ? null : (
              <Path key={`l${i}`} d={`M${bx.toFixed(1)} ${by.toFixed(1)}L${l.cx.toFixed(1)} ${l.cy.toFixed(1)}`} stroke={COR.cinzaClaro} strokeWidth={0.6} />
            );
          })}
        </Svg>

        {lugares.map((l, i) => {
          const m = marcas[i];
          const fundo = m.tipo === "partida" ? COR.vermelho : m.tipo === "chegada" ? COR.branco : COR.tinta;
          const cor = m.tipo === "chegada" ? COR.vermelho : COR.branco;
          return (
            <View
              key={`m${i}`}
              style={{
                position: "absolute",
                left: l.cx - MARCA / 2,
                top: l.cy - MARCA / 2,
                width: MARCA,
                height: MARCA,
                borderRadius: 2,
                backgroundColor: fundo,
                borderWidth: m.tipo === "chegada" ? 1.2 : 0.8,
                borderColor: m.tipo === "chegada" ? COR.vermelho : COR.branco,
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 6.5, fontWeight: 600, lineHeight: 1, textAlign: "center", color: cor }}>{m.numero}</Text>
            </View>
          );
        })}
      </View>

      {/* Escala e norte numa faixa por baixo, para nunca taparem o percurso. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          height: 18,
          paddingHorizontal: 10,
          borderTopWidth: 0.5,
          borderTopColor: COR.linha,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {rotuloEscala ? <Text style={{ fontSize: 6.5, lineHeight: 1, color: COR.cinza }}>{rotuloEscala}</Text> : null}
          <Svg width={barra + 2} height={7} viewBox={`0 0 ${barra + 2} 7`}>
            <Path d={`M1 3.5h${barra.toFixed(1)}M1 0.5v6M${(1 + barra).toFixed(1)} 0.5v6`} stroke={COR.tinta} strokeWidth={1} />
          </Svg>
          <Text style={{ fontSize: 6.5, lineHeight: 1, color: COR.tinta }}>{km.toLocaleString("pt-PT")} km</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Svg width={7} height={8} viewBox="0 0 7 8">
            <Path d="M3.5 0L7 8H0z" fill={COR.tinta} />
          </Svg>
          <Text style={{ fontSize: 7, fontWeight: 600, lineHeight: 1, color: COR.tinta }}>{norte}</Text>
        </View>
      </View>
    </View>
  );
}
