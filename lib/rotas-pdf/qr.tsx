/* Código QR desenhado em vector (nítido em qualquer impressora). */

import { Path, Svg } from "@react-pdf/renderer";
import QR from "qrcode";
import { COR } from "./estilos";

/** Um quadrado por módulo escuro, juntos em tiras por linha, num só caminho. */
function caminho(texto: string, nivel: "L" | "M"): { d: string; n: number } {
  const { modules } = QR.create(texto, { errorCorrectionLevel: nivel });
  const n = modules.size;
  let d = "";
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (!modules.get(y, x)) {
        x++;
        continue;
      }
      let fim = x;
      while (fim < n && modules.get(y, fim)) fim++;
      d += `M${x} ${y}h${fim - x}v1h${x - fim}z`;
      x = fim;
    }
  }
  return { d, n };
}

/**
 * QR com a margem branca de quatro módulos que os leitores pedem.
 * `nivel` L para endereços longos (o da navegação), M para os curtos.
 */
export function Qr({ texto, tamanho, nivel = "M" }: { texto: string; tamanho: number; nivel?: "L" | "M" }) {
  const { d, n } = caminho(texto, nivel);
  const m = 4;
  return (
    <Svg width={tamanho} height={tamanho} viewBox={`${-m} ${-m} ${n + 2 * m} ${n + 2 * m}`}>
      <Path d={d} fill={COR.tinta} />
    </Svg>
  );
}
