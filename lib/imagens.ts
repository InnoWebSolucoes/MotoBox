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

/**
 * Imagens por slug, para que cada item tenha a sua fotografia.
 *
 * As chaves genéricas de `CENAS` (o local da prova) repetem-se entre itens —
 * oito vídeos partilhavam sete chaves, e as cinco corridas do arquivo só
 * tinham três. Estas entradas têm prioridade sobre a chave genérica, pelo que
 * cada vídeo, notícia, corrida e equipa passa a ter imagem própria.
 */
export const POR_SLUG: Record<string, string> = {
  // --- vídeos ---
  "highlights-gp-huila-2026": U("photo-1558981285-6f0c94958bb6"),
  "onboard-kiala-kilamba": U("photo-1610647752706-3bb12232b3ab"),
  "documentario-elas-de-capacete": U("photo-1547937414-009abc449011"),
  "resumo-enduro-litoral": U("photo-1485965120184-e220f721d03e"),
  "entrevista-carlos-samba": U("photo-1524712245354-2c4e5e7121c0"),
  "passeio-cabinda-2026": U("photo-1558980394-4c7c9299fe96"),
  "highlights-gp-luanda-2026": U("photo-1517927033932-b3d18e61fb3a"),
  "top10-saltos-2026": U("photo-1541443131876-44b03de101c5"),

  // --- provas do calendário ---
  "gp-luanda-abertura": U("photo-1610647752706-3bb12232b3ab"),
  "enduro-benguela": U("photo-1512909006721-3d6018887383"),
  "gp-huila-lubango": U("photo-1518655048521-f130df041f66"),
  "passeio-solidario-cabinda": U("photo-1502161254066-6c74afbf07aa"),
  "gp-namibe-dunas": U("photo-1476514525535-07fb3b4ae5f1"),
  "gp-huambo-final": U("photo-1533929736458-ca588d08c8be"),
  "gala-motobox-2026": U("photo-1506947411487-a56738267384"),
  "passeio-natal-luanda": U("photo-1543941869-11da6518d88f"),

  // --- notícias ---
  "campeonato-decide-se-no-huambo": U("photo-1559839914-17aae19cec71"),
  "joana-ferraz-entrevista": U("photo-1552642986-ccb41e7059e7"),
  "corrida-dunas-namibe-preview": U("photo-1508973379184-7517410fb0bc"),
  "passeio-cabinda-material-escolar": U("photo-1502161254066-6c74afbf07aa"),
  "ivandro-cabral-revelacao": U("photo-1526726538690-5cbf956ae2fd"),
  "mxgp-calendario-2027": U("photo-1533106418989-88406c7cc8ca"),
  "ktm-nova-450-2027": U("photo-1493225457124-a3eb161ffa5f"),
  "dakar-2027-inscricoes": U("photo-1516450360452-9312f5e86fc7"),
  "concentracao-motard-lubango": U("photo-1571019613454-1cb2f99b2d8b"),

  // --- corridas do arquivo (duas mangas por prova, imagens distintas) ---
  "gp-luanda-2026-mx1": U("photo-1558981806-ec527fa84c39"),
  "gp-luanda-2026-mx2": U("photo-1517927033932-b3d18e61fb3a"),
  "enduro-benguela-2026": U("photo-1485965120184-e220f721d03e"),
  "gp-huila-2026-mx1": U("photo-1591637333184-19aa84b3e01f"),
  "gp-huila-2026-mx2": U("photo-1558981285-6f0c94958bb6"),

  // --- equipas e clubes ---
  "kilamba-racing": U("photo-1594736797933-d0501ba2fe65"),
  "tundavala-mx": U("photo-1580310614729-ccd69652491d"),
  "lobito-motorsport": U("photo-1546484475-7f7bd55792da"),
  "caala-racing-club": U("photo-1449158743715-0a90ebb6d2d8"),
  "namibe-dunas-team": U("photo-1547549082-6bc09f2049ae"),
  "cabinda-bikers": U("photo-1558980394-4c7c9299fe96"),
  "moto-clube-luanda": U("photo-1461896836934-ffe607ba8211"),
  "trail-angola": U("photo-1568772585407-9361f9bf3a87"),
};

/**
 * Fotografia de fundo dos cabeçalhos de página (`PageHero`), por rota.
 * Entram muito esbatidas, atrás da grelha e do halo vermelho.
 */
export const BANNERS: Record<string, string> = {
  pilotos: U("photo-1622185135505-2d795003994a"),
  calendario: U("photo-1571068316344-75bc76f77890"),
  classificacao: U("photo-1517649763962-0c623066013b"),
  videos: U("photo-1541443131876-44b03de101c5"),
  noticias: U("photo-1559839914-17aae19cec71"),
  equipas: U("photo-1594736797933-d0501ba2fe65"),
  resultados: U("photo-1558981806-ec527fa84c39"),
  bilhetes: U("photo-1552674605-db6ffd4facb5"),
  marketplace: U("photo-1560472354-b33ff0c44a43"),
  forum: U("photo-1558618666-fcd25c85cd64"),
  patrocinadores: U("photo-1486401899868-0e435ed85128"),
  contacto: U("photo-1568605117036-5fe5e7bab0b7"),
  sobre: U("photo-1583121274602-3e2820c69888"),
};

/** URL do banner de uma rota, já dimensionado. */
export function banner(chave: string, { w = 1920, q = 60 } = {}): string | null {
  const base = BANNERS[chave];
  return base ? `${base}?auto=format&fit=crop&w=${w}&q=${q}` : null;
}

/** Todas as chaves conhecidas, numa só tabela. */
const TODAS: Record<string, string> = { ...CENAS, ...RETRATOS, ...ARTIGOS, ...POR_SLUG };

/**
 * URL da fotografia para uma chave, já dimensionada.
 * Devolve `null` quando a chave não tem fotografia — nesse caso o componente
 * fica com o gradiente gerado, que continua a servir de marcador.
 */
export function src(
  nome: string | (string | undefined)[],
  { w = 1200, q = 70 }: { w?: number; q?: number } = {},
): string | null {
  // Aceita uma lista por ordem de preferência: normalmente [slug, chaveGenérica].
  // O slug tem imagem própria; a chave genérica (o local da prova) repete-se
  // entre itens e serve de reserva.
  const chaves = (Array.isArray(nome) ? nome : [nome]).filter(Boolean) as string[];
  for (const c of chaves) {
    // chaves derivadas do tipo "capacete-2" (galerias) caem na imagem base
    const base = TODAS[c] ?? TODAS[c.replace(/-\d+$/, "")];
    if (base) return `${base}?auto=format&fit=crop&w=${w}&q=${q}`;
  }
  return null;
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
