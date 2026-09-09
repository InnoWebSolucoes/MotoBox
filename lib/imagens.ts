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
  "kilamba": U("photo-1542550546-88afdd84b64f"),
  "benguela": U("photo-1500578862199-d2872c0781ec"),
  "lubango": U("photo-1602478411948-e28ad9b247b8"),
  "cabinda": U("photo-1749453841347-2cda97af2526"),
  "namibe": U("photo-1546489545-697049cfdc1e"),
  "huambo": U("photo-1715178160659-7cc8ef44ade1"),
  "tundavala": U("photo-1687227394984-a9de8f64fd0d"),
  "gala": U("photo-1761860467031-5175bbc0503e"),
  "natal": U("photo-1489731007795-388eee095ff6"),
  "mxgp": U("photo-1551759390-5c112a9ffef0"),
  "ktm": U("photo-1605121476668-ae388fa8fe27"),
  "dakar": U("photo-1514826863517-464eed44915d"),
  "competicao": U("photo-1626130569162-f90681b6982a"),
  "passeios": U("photo-1556036518-705db5129896"),
  "mecanica": U("photo-1636761358757-0a616eb9e17e"),
  "geral": U("photo-1752778268540-dfc2eb7a10e4"),
  "novatos": U("photo-1687278346516-17a9f85b0252"),
};

/** Retratos de pilotos, por slug. */
export const RETRATOS: Record<string, string> = {
  "nelson-kiala": U("photo-1591037307610-9b7bcdffb72a"),
  "joana-ferraz": U("photo-1559913516-d47b38fab290"),
  "ivandro-cabral": U("photo-1591216105236-5ba45970702a"),
  "carlos-samba": U("photo-1736454327682-a684ef60c3fe"),
  "mario-bengui": U("photo-1582092605221-bf4ddf388587"),
  "rui-katchimba": U("photo-1591124999021-a0b9ebe09b9a"),
  "adilson-mbala": U("photo-1591037240570-58b94467a14b"),
  "eduardo-neto": U("photo-1562402082-05a4e888ca96"),
  "helder-quissanga": U("photo-1606497058128-19b758a3dd88"),
  "paulo-tembo": U("photo-1788421845004-62ba196cf860"),
  "bruno-tchipa": U("photo-1660337294765-2a20770826aa"),
  "silvio-domingos": U("photo-1606927131353-c0ad17d60b56"),
};

/** Anúncios do marketplace. */
export const ARTIGOS: Record<string, string> = {
  "crf450": U("photo-1542550546-88afdd84b64f"),
  "ktm250": U("photo-1605121476668-ae388fa8fe27"),
  "fe350": U("photo-1582092722992-b2f960bafbfb"),
  "tenere": U("photo-1514826863517-464eed44915d"),
  "dr650": U("photo-1687227394984-a9de8f64fd0d"),
  "capacete": U("photo-1611004061856-ccc3cbe944b2"),
  "botas": U("photo-1725387023639-28e9a42a83b1"),
  "equipamento": U("photo-1611004060674-7e8864bcb4e4"),
  "escape": U("photo-1771252297207-eca148228341"),
  "suspensao": U("photo-1762012507780-060fe0bcc783"),
  "plasticos": U("photo-1769537754889-8d731b83547f"),
  "suporte": U("photo-1774902410486-648614277f1f"),
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
  "gp-luanda-abertura": U("photo-1542550546-88afdd84b64f"),
  "enduro-benguela": U("photo-1500578862199-d2872c0781ec"),
  "gp-huila-lubango": U("photo-1602478411948-e28ad9b247b8"),
  "passeio-solidario-cabinda": U("photo-1749453841347-2cda97af2526"),
  "gp-namibe-dunas": U("photo-1546489545-697049cfdc1e"),
  "gp-huambo-final": U("photo-1715178160659-7cc8ef44ade1"),
  "gala-motobox-2026": U("photo-1761860467031-5175bbc0503e"),
  "passeio-natal-luanda": U("photo-1489731007795-388eee095ff6"),
  "highlights-gp-huila-2026": U("photo-1562424292-1fa536217c58"),
  "onboard-kiala-kilamba": U("photo-1752778268540-dfc2eb7a10e4"),
  "documentario-elas-de-capacete": U("photo-1559913516-d47b38fab290"),
  "resumo-enduro-litoral": U("photo-1580053002916-07df563231be"),
  "entrevista-carlos-samba": U("photo-1736454327682-a684ef60c3fe"),
  "passeio-cabinda-2026": U("photo-1580357703484-4bbb329b83a7"),
  "highlights-gp-luanda-2026": U("photo-1626130569162-f90681b6982a"),
  "top10-saltos-2026": U("photo-1549524362-47d913ec9a0e"),
  "campeonato-decide-se-no-huambo": U("photo-1715178160659-7cc8ef44ade1"),
  "joana-ferraz-entrevista": U("photo-1559913516-d47b38fab290"),
  "corrida-dunas-namibe-preview": U("photo-1573826688141-c0caf0e14081"),
  "passeio-cabinda-material-escolar": U("photo-1556036518-705db5129896"),
  "ivandro-cabral-revelacao": U("photo-1591216105236-5ba45970702a"),
  "mxgp-calendario-2027": U("photo-1551759390-5c112a9ffef0"),
  "ktm-nova-450-2027": U("photo-1605121476668-ae388fa8fe27"),
  "dakar-2027-inscricoes": U("photo-1514826863517-464eed44915d"),
  "concentracao-motard-lubango": U("photo-1489731007795-388eee095ff6"),
  "gp-luanda-2026-mx1": U("photo-1542550546-88afdd84b64f"),
  "gp-luanda-2026-mx2": U("photo-1626130569162-f90681b6982a"),
  "enduro-benguela-2026": U("photo-1500578862199-d2872c0781ec"),
  "gp-huila-2026-mx1": U("photo-1602478411948-e28ad9b247b8"),
  "gp-huila-2026-mx2": U("photo-1562424292-1fa536217c58"),
  "kilamba-racing": U("photo-1591037307610-9b7bcdffb72a"),
  "tundavala-mx": U("photo-1687227394984-a9de8f64fd0d"),
  "lobito-motorsport": U("photo-1580053002916-07df563231be"),
  "caala-racing-club": U("photo-1687278346516-17a9f85b0252"),
  "namibe-dunas-team": U("photo-1546489545-697049cfdc1e"),
  "cabinda-bikers": U("photo-1749453841347-2cda97af2526"),
  "moto-clube-luanda": U("photo-1674829198252-589ed0f49716"),
  "trail-angola": U("photo-1582092605221-bf4ddf388587"),
};

/**
 * Fotografia de fundo dos cabeçalhos de página (`PageHero`), por rota.
 * Entram muito esbatidas, atrás da grelha e do halo vermelho.
 */
export const BANNERS: Record<string, string> = {
  "pilotos": U("photo-1591037307610-9b7bcdffb72a"),
  "calendario": U("photo-1715178160659-7cc8ef44ade1"),
  "classificacao": U("photo-1752778268540-dfc2eb7a10e4"),
  "videos": U("photo-1549524362-47d913ec9a0e"),
  "noticias": U("photo-1626130569162-f90681b6982a"),
  "equipas": U("photo-1551759390-5c112a9ffef0"),
  "resultados": U("photo-1542550546-88afdd84b64f"),
  "bilhetes": U("photo-1580357703484-4bbb329b83a7"),
  "marketplace": U("photo-1771252297207-eca148228341"),
  "forum": U("photo-1556036518-705db5129896"),
  "patrocinadores": U("photo-1761860467031-5175bbc0503e"),
  "contacto": U("photo-1582092605221-bf4ddf388587"),
  "sobre": U("photo-1687227394984-a9de8f64fd0d"),
  "legal": U("photo-1582092722992-b2f960bafbfb"),
  "topico": U("photo-1749453841347-2cda97af2526"),
  "entrar": U("photo-1591216105236-5ba45970702a"),
  "conta": U("photo-1602478411948-e28ad9b247b8"),
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
