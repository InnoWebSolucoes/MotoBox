/* ============================================================
   MOTOBOX — Rotas de moto-turismo

   Oito rotas prontas a fazer de mota em Angola: paragens com
   coordenadas, troços com distância, tempo, piso e avisos,
   horário sugerido, combustível, onde comer e dormir, hospitais,
   documentos, licenças, perigos e o que levar.

   Informação verificada em Outubro de 2026. Tudo tem fonte; quando
   as fontes discordam, fica o intervalo ou fica de fora. Estradas,
   preços e combustível mudam, por isso o site pede sempre para
   confirmar localmente.

   Como se calcularam distâncias e tempos:
   - As coordenadas das paragens foram verificadas no OpenStreetMap
     (Nominatim), na Wikidata ou nas fontes de cada lugar.
   - A distância e o tempo de carro de cada troço vêm do OSRM (o
     servidor público, sobre o OpenStreetMap), em lib/rotas-tracados.ts,
     gerado a partir das paragens. Comparámos com os tempos publicados
     (Luanda–Lobito, Luanda–Malanje, Luanda–Miradouro) e batem certo.
   - O tempo de mota é o do OSRM com uma margem por piso (MARGEM_MOTA
     em lib/rotas-mapas.ts), sem contar paragens.
   - As altitudes são do modelo SRTM de 30 m (OpenTopoData), ao longo
     do traçado; a subida acumulada é uma estimativa.

   As fotografias são reais, dos próprios lugares, do Wikimedia
   Commons, com o autor e a licença (lib/rotas-fotos.ts).

   Isto é o conteúdo de partida. O site lê as rotas do conteúdo
   editável (grupo "rotas", ver lib/rotas-conteudo.ts), que o painel
   de gestão edita em /admin/rotas; enquanto ninguém gravar, vale o
   que está aqui. O mesmo para os textos de /rotas e o que é comum a
   todas as rotas (documento "paginas.rotas", paginaRotasPadrao()).
   ============================================================ */

import { CLIMA } from "@/lib/rotas-clima";
import { BASE } from "@/lib/rotas-dados";
import { ESTADO_ESTRADA } from "@/lib/rotas-estrada";
import { F, fx } from "@/lib/rotas-fontes";
import { FOTOS, urlCommons } from "@/lib/rotas-fotos";
import { CALCULO, TRACADOS } from "@/lib/rotas-tracados";
import { TEXTOS_PAGINA_ROTAS, type ClimaCidade, type ConteudoPaginaRotas } from "@/lib/rotas-pagina";
import { assinaturaParagens, type Facto, type FonteRota, type Paragem, type Rota, type Troco } from "@/lib/rotas-tipos";

export { CLIMA } from "@/lib/rotas-clima";
// Os tipos vivem em lib/rotas-tipos.ts (leve, para o painel e o browser).
export type {
  DiaHorario, Exigencia, Facto, FonteRota, Foto, Lugar, Paragem, Piso, Ponto, Rota, Troco,
} from "@/lib/rotas-tipos";

/* ---------------- Dados como se escrevem em lib/rotas-dados.ts ---------------- */

export type ParagemBase = Omit<Paragem, "alt">;
export type TrocoBase = Omit<Troco, "de" | "para" | "km" | "minCarro">;
export type RotaBase = Omit<Rota, "imagem" | "fotos" | "paragens" | "trocos" | "altimetria"> & {
  paragens: ParagemBase[];
  trocos: TrocoBase[];
};

/**
 * Junta a cada rota os números do OSRM e do SRTM e as fotografias. Falha no
 * arranque se as paragens não baterem certo com as do cálculo: assim nunca se
 * publica um troço com os quilómetros de outro.
 */
function montar(r: RotaBase): Rota {
  const c = CALCULO[r.slug];
  if (!c) throw new Error(`Rota ${r.slug}: falta o cálculo em lib/rotas-tracados.ts`);
  if (c.paragens.length !== r.paragens.length || c.trocos.length !== r.trocos.length) {
    throw new Error(`Rota ${r.slug}: paragens ou troços não batem com lib/rotas-tracados.ts`);
  }
  r.paragens.forEach((p, i) => {
    const q = c.paragens[i];
    if (Math.abs(p.lat - q.lat) > 1e-4 || Math.abs(p.lng - q.lng) > 1e-4) {
      throw new Error(`Rota ${r.slug}: a paragem ${p.nome} mudou de sítio; volte a gerar lib/rotas-tracados.ts`);
    }
  });
  const fotos = FOTOS[r.slug] ?? [];
  if (!fotos.length) throw new Error(`Rota ${r.slug}: sem fotografias`);
  return {
    ...r,
    paragens: r.paragens.map((p, i) => ({ ...p, alt: c.paragens[i].alt })),
    trocos: r.trocos.map((t, i) => ({ ...t, de: i, para: i + 1, km: c.trocos[i].km, minCarro: c.trocos[i].min })),
    altimetria: c.altimetria,
    fotos,
    imagem: urlCommons(fotos[0], 960),
    estrada: ESTADO_ESTRADA[r.slug] ?? null,
    tracado: TRACADOS[r.slug] ?? "",
    tracadoDe: assinaturaParagens(c.paragens),
  };
}

export const ROTAS: Rota[] = BASE.map(montar);

export const lerRota = (slug: string) => ROTAS.find((r) => r.slug === slug);

/** O que é comum a todas as rotas e entra na lista de fontes de cada uma. */
type Comum = Pick<ConteudoPaginaRotas, "DOCUMENTOS" | "EMERGENCIA" | "REDE_GERAL" | "PRECO_COMBUSTIVEL" | "CLIMA">;

/**
 * Todas as fontes citadas na página de uma rota, sem repetições. Os elementos
 * do OpenStreetMap entram como uma só fonte: cada um tem a ligação no sítio
 * onde é citado. `comum` é o que está no conteúdo editável (por omissão, o
 * do código).
 */
export function fontesDaRota(rota: Rota, comum?: Comum): FonteRota[] {
  const c: Comum = comum ?? { DOCUMENTOS, EMERGENCIA, REDE_GERAL, PRECO_COMBUSTIVEL, CLIMA: CLIMA_CIDADES };
  const clima = climaDaRota(rota, c.CLIMA);
  const todas: FonteRota[] = [
    ...rota.fontes,
    ...rota.distancias.map((d) => d.fonte),
    ...rota.trocos.flatMap((t) => t.fontes),
    ...rota.paragens.map((p) => p.fonte),
    ...[rota.diasNota, rota.semCombustivel, rota.agua, rota.grupo].flatMap((f) => f.fontes),
    ...[rota.combustivel, rota.perigos, rota.licencas, rota.rede, rota.motas].flat().flatMap((f) => f.fontes),
    ...[rota.comer, rota.dormir, rota.saude].flat().flatMap((l) => l.fontes),
    ...rota.pontos.flatMap((p) => p.fontes),
    ...c.DOCUMENTOS.flatMap((d) => d.fontes),
    ...c.EMERGENCIA.fontes,
    ...c.REDE_GERAL.fontes,
    ...c.PRECO_COMBUSTIVEL.fontes,
    ...(clima ? [clima.fonte] : []),
    F.osrm,
    F.srtm,
  ];
  const vistas = new Set<string>();
  const lista: FonteRota[] = [];
  let osm = false;
  for (const f of todas) {
    if (!f?.url) continue;
    if (/openstreetmap\.org\/(node|way|relation)\//.test(f.url)) {
      osm = true;
      continue;
    }
    if (vistas.has(f.url)) continue;
    vistas.add(f.url);
    lista.push(f);
  }
  if (osm && !vistas.has(F.osm.url)) lista.push(F.osm);
  return lista;
}

/* ---------------- Comum a todas as rotas ---------------- */

/** Números de emergência: as fontes não batem certo, por isso diz-se o que cada uma diz. */
export const EMERGENCIA: { numeros: { numero: string; servico: string }[]; notas: string[]; fontes: FonteRota[] } = {
  numeros: [
    { numero: "111", servico: "Emergência: polícia, bombeiros e emergência médica" },
    { numero: "112", servico: "Ambulância, segundo os avisos do Reino Unido e dos EUA" },
  ],
  notas: [
    "O 111 é o número de emergência do CISP. Em Novembro de 2024 os bombeiros anunciaram que o 115 foi descontinuado e que se deve ligar para o 111 em emergências médicas, policiais ou de incêndio. Não confirmámos que atenda em todas as províncias.",
    "Os avisos de viagem estrangeiros ainda dão outros números: 113 para a polícia, 112 ou 116 para ambulância e 115 para os bombeiros. O 113 deixou de funcionar em 2020. Guarde também o número do hotel e de alguém do grupo.",
  ],
  fontes: [F.rna111, F.nj113, F.fcdoAjuda, F.eua, F.comunidades, F.canada],
};

/** Documentos e equipamento obrigatório, para todas as rotas. */
export const DOCUMENTOS: Facto[] = [
  fx(
    "BI ou passaporte, carta de condução e certificado do seguro, obrigatórios em qualquer veículo (Código de Estrada, art. 84.º). Na mota, também o título de registo de propriedade e o livrete.",
    F.codigoDnvt,
  ),
  fx(
    "Desde 2023 o Título do Veículo junta o livrete e o título de propriedade; os documentos antigos continuam válidos.",
    F.tituloVeiculo,
  ),
  fx("Carta da categoria A para motas de mais de 125 cm³; a A1 chega até 125 cm³ (art. 121.º).", F.codigoDnvt, F.cartas),
  fx(
    "O seguro de responsabilidade civil é obrigatório para todos os veículos a motor, motas incluídas. Sem prova de seguro em 8 dias, o veículo é apreendido. Motas estrangeiras sem Carta Amarela compram o seguro na fronteira.",
    F.seguro,
  ),
  fx(
    "Capacete homologado, ajustado e apertado, para condutor e passageiro (art. 81.º). Triângulo e colete reflector são obrigatórios nos veículos a motor (art. 87.º); não encontrámos excepção para motas.",
    F.codigoDnvt,
  ),
  fx(
    "Estrangeiros: Licença Internacional de Condução junto com a carta do país. A carta portuguesa vale 180 dias; a britânica, 30.",
    F.comunidades,
    F.fcdoAjuda,
    F.codigoDnvt,
  ),
  fx(
    "Nos controlos, mostre os originais e leve cópias a cores à parte. Se lhe pedirem dinheiro, peça a multa por escrito ou o nome e o número do agente: o Ministério do Interior admitiu em 2025 que há extorsão por agentes de trânsito.",
    F.eua,
    F.gasosa,
  ),
];

/** Rede móvel no país, antes do que se sabe de cada rota. */
export const REDE_GERAL: Facto = fx(
  "Há três operadoras: Unitel, Africell e Movicel. A Africell ainda está a alargar a rede a mais províncias, e em Julho de 2026 um ataque informático deixou a Unitel sem rede em todo o país durante dias: leve cartões de duas operadoras.",
  F.africell,
  F.unitel,
  F.canada,
);

export const PRECO_COMBUSTIVEL: Facto = fx(
  "Preço tabelado em todo o país: gasolina a 300 Kz o litro e gasóleo a 420 Kz desde Junho de 2026. Os cartões estrangeiros raramente são aceites: leve dinheiro.",
  F.precoGasolina,
  F.precoGasoleo,
  F.eua,
);

/** O que levar em qualquer viagem. Conselhos práticos, não regras. */
export const LEVAR_BASE: string[] = [
  "Documentos originais e cópias a cores noutro bolso.",
  "Capacete homologado, casaco e calças com protecções, luvas e botas.",
  "Triângulo e colete reflector.",
  "Kit de furos, bomba ou compressor de 12 V e manómetro.",
  "Ferramentas da mota, abraçadeiras, fita adesiva forte e fusíveis.",
  "Óleo para a corrente e um pano.",
  "Telemóvel com o mapa descarregado e o GPX desta rota, bateria externa e carregador na mota.",
  "Cartões SIM de duas operadoras.",
  "Estojo de primeiros socorros, protector solar e repelente.",
  "Kwanzas em notas pequenas.",
  "Fato de chuva, de Outubro a Abril.",
];

/** Quando ir, por região, para a tabela da página das rotas. */
export const CLIMA_POR_REGIAO: { regiao: string; seco: string; chuva: string; nota: string; fonte: FonteRota }[] = [
  { regiao: "Luanda e costa norte", seco: "Maio a Outubro", chuva: "Março e Abril", nota: "Nevoeiro frequente no cacimbo.", fonte: F.wikiLuanda },
  { regiao: "Huíla (Leba, Tundavala)", seco: "Junho a Agosto", chuva: "Dezembro a Março", nota: "Mínimas perto dos 8 °C em Julho; geada rara.", fonte: F.wikiLubango },
  { regiao: "Malanje (Kalandula)", seco: "Maio a Setembro", chuva: "Outubro a Abril", nota: "Mais caudal nas quedas quando chove.", fonte: F.wikiMalanje },
  { regiao: "Namibe", seco: "Quase todo o ano", chuva: "Muito pouca (cerca de 51 mm/ano)", nota: "Julho e Agosto abaixo dos 18 °C.", fonte: F.wikiMocamedes },
  { regiao: "Sul em geral", seco: "Maio a Outubro", chuva: "Novembro a cerca de Fevereiro", nota: "No norte, a chuva vai de Setembro a Abril.", fonte: F.geografia },
];

/** Lista para "Planear uma viagem de mota". Cada grupo diz de onde vem. */
export const CHECKLIST_VIAGEM: { grupo: string; itens: string[]; fontes: FonteRota[] }[] = [
  {
    grupo: "Documentos",
    itens: [
      "Carta de condução da categoria certa: A para mais de 125 cm³ (a partir dos 18 anos), A1 até 125 cm³ (a partir dos 16).",
      "BI ou passaporte, título de propriedade e livrete (ou o Título do Veículo) e seguro, sempre à mão: os controlos policiais são frequentes.",
      "Estrangeiros: passaporte válido e Licença Internacional de Condução junto com a carta do seu país.",
    ],
    fontes: [F.cartas, F.codigoDnvt, F.tituloVeiculo, F.fcdo],
  },
  {
    grupo: "Mota e equipamento",
    itens: [
      "Capacete homologado e apertado, para condutor e passageiro: é obrigatório.",
      "Triângulo e colete reflector: o Código pede-os a todos os veículos a motor.",
      "Revisão antes de sair: pneus, travões, corrente, óleo e luzes.",
      "Kit de furos, ferramentas básicas e cintas para a bagagem.",
      "Na areia, baixe a pressão dos pneus e volte a enchê-los antes do asfalto.",
    ],
    fontes: [F.codigo, F.codigoDnvt, F.landersCosta, F.metzeler],
  },
  {
    grupo: "Combustível e água",
    itens: [
      "Abasteça sempre que puder: em 2026 houve falta de combustível em postos de Benguela, Huíla e Namibe, e em Agosto o Governo admitiu uma crise em todo o país.",
      "Leve reserva de combustível para troços isolados, como o Iona ou o deserto.",
      "Água para o dia todo. Nas estradas principais há água engarrafada à venda; no deserto não há.",
    ],
    fontes: [F.combustivel, F.criseCombustivel, F.aventuraMoto, F.t4a],
  },
  {
    grupo: "Segurança",
    itens: [
      "Não conduza de noite fora das cidades.",
      "Fique em estradas e trilhos bem marcados: ainda há minas em algumas zonas, e as cheias podem deslocá-las.",
      "Diga a alguém o percurso e a hora prevista de chegada.",
      "Emergência: 111. Fora de Luanda os cuidados de saúde são limitados; faça um seguro que cubra repatriamento.",
      "Repelente: há risco de malária em todo o país.",
    ],
    fontes: [F.fcdo, F.fcdoSaude, F.rna111, F.minas, F.cdc],
  },
  {
    grupo: "Em grupo",
    itens: [
      "Combine antes o ritmo, as paragens e quem abre e quem fecha o grupo.",
      "Fora dos grandes centros, viaje com pelo menos mais uma mota ou viatura.",
      "Guarde distância de segurança e não ultrapasse em curva nem em lomba.",
    ],
    fontes: [F.fcdo, F.eua],
  },
];

/** Regras da estrada que interessam a quem viaja de mota. */
export const REGRAS_ESTRADA: { texto: string; fonte: FonteRota }[] = [
  { texto: "Conduz-se pela direita.", fonte: F.codigo },
  { texto: "Capacete obrigatório para condutor e passageiro (art. 81.º).", fonte: F.codigo },
  {
    texto:
      "Limites para motociclos acima de 50 cm³: 60 km/h nas localidades, 90 km/h nas restantes vias, 100 km/h nas vias reservadas e 120 km/h nas auto-estradas (art. 27.º).",
    fonte: F.codigo,
  },
  { texto: "Luzes acesas do anoitecer ao amanhecer e com pouca visibilidade (art. 59.º).", fonte: F.codigoDnvt },
  { texto: "Não se levam passageiros com menos de 7 anos na mota (art. 90.º).", fonte: F.codigoDnvt },
];

/* ---------------- Clima e página das rotas (conteúdo editável) ---------------- */

/** As tabelas de clima do código, em lista (como ficam no conteúdo editável). */
export const CLIMA_CIDADES: ClimaCidade[] = Object.entries(CLIMA).map(([chave, c]) => ({
  chave,
  cidade: c.cidade,
  lat: c.lat,
  lng: c.lng,
  fonte: c.fonte,
  nota: c.nota,
  meses: c.meses,
}));

/** A cidade de clima de uma rota (ou a primeira da lista, se a dela já não existir). */
export const climaDaRota = (rota: Pick<Rota, "clima">, cidades: ClimaCidade[]): ClimaCidade | undefined =>
  cidades.find((c) => c.chave === rota.clima) ?? cidades[0];

/** O documento "paginas.rotas" como estava no código: textos de /rotas e o comum a todas as rotas. */
export function paginaRotasPadrao(): ConteudoPaginaRotas {
  return {
    ...TEXTOS_PAGINA_ROTAS,
    EMERGENCIA,
    DOCUMENTOS,
    REDE_GERAL,
    PRECO_COMBUSTIVEL,
    LEVAR_BASE,
    CLIMA_POR_REGIAO,
    CHECKLIST_VIAGEM,
    REGRAS_ESTRADA,
    CLIMA: CLIMA_CIDADES,
  };
}
