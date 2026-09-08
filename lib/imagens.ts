/**
 * Registo de fotografias.
 *
 * Enquanto o arquivo fotográfico da Motobox não é fornecido, cada chave de
 * imagem usada em `lib/data.ts` aponta para uma fotografia livre do Unsplash,
 * escolhida por tema (motocross, enduro, dunas, oficina, retratos). Para passar
 * a produção basta trocar os URLs por ficheiros do arquivo real — a chave e a
 * assinatura dos componentes `Placeholder` / `Retrato` mantêm-se.
 *
 * Todos os URLs foram verificados (HTTP 200). Os parâmetros de tamanho e
 * recorte são aplicados em `src()`, não guardados aqui.
 */

const U = (id: string) => `https://images.unsplash.com/${id}`;

/** Provas, circuitos, notícias e vídeos — imagens largas. */
export const CENAS: Record<string, string> = {
  // circuitos e provas
  kilamba: U("photo-1558981806-ec527fa84c39"), // motocross em pista de terra
  benguela: U("photo-1449426468159-d96dbf08f19f"), // enduro junto ao litoral
  lubango: U("photo-1591637333184-19aa84b3e01f"), // montanha, curva de altitude
  cabinda: U("photo-1568772585407-9361f9bf3a87"), // passeio em estrada verde
  namibe: U("photo-1547549082-6bc09f2049ae"), // deserto e dunas
  huambo: U("photo-1571068316344-75bc76f77890"), // salto de motocross
  tundavala: U("photo-1580310614729-ccd69652491d"), // serra
  gala: U("photo-1517649763962-0c623066013b"), // palco / celebração
  natal: U("photo-1558618666-fcd25c85cd64"), // concentração de motos
  mxgp: U("photo-1622185135505-2d795003994a"), // grelha internacional
  ktm: U("photo-1615172282427-9a57ef2d142e"), // moto de competição
  dakar: U("photo-1609630875171-b1321377ee65"), // rali no deserto
  // genéricas de reserva
  competicao: U("photo-1558980664-10e7170b5df9"),
  passeios: U("photo-1583121274602-3e2820c69888"),
  mecanica: U("photo-1534073737927-85f1ebff1f5d"),
  geral: U("photo-1600717535275-0b18ede2f7fc"),
  novatos: U("photo-1449965408869-eaa3f722e40d"),
};

/** Retratos de pilotos, por slug. */
export const RETRATOS: Record<string, string> = {
  "nelson-kiala": U("photo-1517672651691-24622a91b550"),
  "joana-ferraz": U("photo-1552642986-ccb41e7059e7"),
  "ivandro-cabral": U("photo-1526726538690-5cbf956ae2fd"),
  "carlos-samba": U("photo-1552053831-71594a27632d"),
  "mario-bengui": U("photo-1507003211169-0a1dd7228f2d"),
  "rui-katchimba": U("photo-1500648767791-00dcc994a43e"),
  "adilson-mbala": U("photo-1519085360753-af0119f7cbe7"),
  "eduardo-neto": U("photo-1506794778202-cad84cf45f1d"),
  "helder-quissanga": U("photo-1492562080023-ab3db95bfbce"),
  "paulo-tembo": U("photo-1463453091185-61582044d556"),
  "bruno-tchipa": U("photo-1568605117036-5fe5e7bab0b7"),
  "silvio-domingos": U("photo-1502877338535-766e1452684a"),
};

/** Anúncios do marketplace. */
export const ARTIGOS: Record<string, string> = {
  crf450: U("photo-1558981806-ec527fa84c39"),
  ktm250: U("photo-1615172282427-9a57ef2d142e"),
  fe350: U("photo-1571068316344-75bc76f77890"),
  tenere: U("photo-1568772585407-9361f9bf3a87"),
  dr650: U("photo-1583121274602-3e2820c69888"),
  capacete: U("photo-1596727147705-61a532a659bd"),
  botas: U("photo-1520975916090-3105956dac38"),
  equipamento: U("photo-1533558701576-23c65e0272fb"),
  escape: U("photo-1611241893603-3c359704e0ee"),
  suspensao: U("photo-1558981359-219d6364c9c8"),
  plasticos: U("photo-1626248801379-51a0748a5f96"),
  suporte: U("photo-1591768575198-88dac53fbd0a"),
};

/** Todas as chaves conhecidas, numa só tabela. */
const TODAS: Record<string, string> = { ...CENAS, ...RETRATOS, ...ARTIGOS };

/**
 * URL da fotografia para uma chave, já dimensionada.
 * Devolve `null` quando a chave não tem fotografia — nesse caso o componente
 * fica com o gradiente gerado, que continua a servir de marcador.
 */
export function src(
  nome: string,
  { w = 1200, q = 70 }: { w?: number; q?: number } = {},
): string | null {
  // chaves derivadas do tipo "capacete-2" (galerias) caem na imagem base
  const base = TODAS[nome] ?? TODAS[nome.replace(/-\d+$/, "")];
  if (!base) return null;
  return `${base}?auto=format&fit=crop&w=${w}&q=${q}`;
}

/**
 * Aliases do campo `foto` de `Piloto` (ex.: "kiala") para o retrato do
 * respectivo slug. `Retrato` é chamado com o slug, por isso este campo não
 * chega a ser renderizado hoje — o alias existe para que passe a resolver
 * caso alguém venha a usar `piloto.foto` directamente.
 */
const ALIAS_FOTO: Record<string, string> = {
  kiala: "nelson-kiala",
  ferraz: "joana-ferraz",
  cabral: "ivandro-cabral",
  samba: "carlos-samba",
  bengui: "mario-bengui",
  katchimba: "rui-katchimba",
  mbala: "adilson-mbala",
  neto: "eduardo-neto",
  quissanga: "helder-quissanga",
  tembo: "paulo-tembo",
  tchipa: "bruno-tchipa",
  domingos: "silvio-domingos",
};

for (const [curto, slug] of Object.entries(ALIAS_FOTO)) {
  if (RETRATOS[slug]) TODAS[curto] = RETRATOS[slug];
}
