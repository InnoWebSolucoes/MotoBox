import "server-only";

/* ============================================================
   MOTOBOX — Guia em PDF de cada rota

   gerarGuiaPdf() devolve o PDF de uma rota, feito com o
   @react-pdf/renderer (que o Next deixa fora do bundle por omissão,
   ver serverExternalPackages). Serve-o app/rotas/[slug]/guia.

   As letras e o lettering do logótipo estão em recursos/ e lêem-se
   do disco; o next.config.ts junta essa pasta à função da rota
   (outputFileTracingIncludes), para funcionar também na Vercel.
   Letras com a SIL Open Font License 1.1 (recursos/OFL-*.txt):
   - Instrument Sans (texto) e Inter (reserva): instâncias estáticas
     das letras variáveis do Google Fonts, só com o alfabeto latino e
     os sinais (fontTools);
   - Barlow Condensed (títulos), do Google Fonts, só com o latino.
   ============================================================ */

import { readFileSync } from "node:fs";
import path from "node:path";
import { Font, renderToBuffer } from "@react-pdf/renderer";
import { prepararGuia, type EntradaGuia } from "./dados";
import { Guia } from "./Guia";

export type { EntradaGuia } from "./dados";

// As letras lê-as o @react-pdf/renderer (fora do bundle); vão com a função
// pelo outputFileTracingIncludes do next.config.ts.
const RECURSOS = path.join(process.cwd(), "lib", "rotas-pdf", "recursos");
const letra = (ficheiro: string) => path.join(RECURSOS, ficheiro);

let registadas = false;
let logo: Buffer | null = null;

function prepararLetras() {
  if (registadas) return;
  Font.register({
    family: "MBTexto",
    fonts: [
      { src: letra("InstrumentSans-Regular.ttf"), fontWeight: 400 },
      { src: letra("InstrumentSans-SemiBold.ttf"), fontWeight: 600 },
      { src: letra("InstrumentSans-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "MBTitulo",
    fonts: [
      { src: letra("BarlowCondensed-Bold.ttf"), fontWeight: 700 },
      { src: letra("BarlowCondensed-ExtraBold.ttf"), fontWeight: 800 },
    ],
  });
  Font.register({
    family: "MBReserva",
    fonts: [
      { src: letra("Inter-Regular.ttf"), fontWeight: 400 },
      { src: letra("Inter-SemiBold.ttf"), fontWeight: 600 },
    ],
  });
  // Sem hifenização: as regras de origem são as do inglês e partiam mal as palavras portuguesas.
  Font.registerHyphenationCallback((palavra) => [palavra]);
  registadas = true;
}

/** O nome do ficheiro descarregado. */
export const nomeGuia = (slug: string) => `motobox-${slug}-guia.pdf`;

/** O PDF do guia de uma rota. */
export async function gerarGuiaPdf(entrada: EntradaGuia): Promise<Buffer> {
  prepararLetras();
  // Caminho escrito por inteiro: assim o rastreio de ficheiros do Next sabe o que levar.
  logo ??= readFileSync(path.join(process.cwd(), "lib", "rotas-pdf", "recursos", "motobox-lettering.png"));
  const dados = prepararGuia(entrada);
  return renderToBuffer(<Guia d={dados} logo={logo} />);
}
