/**
 * Registo de fotografias.
 *
 * Enquanto o arquivo fotográfico da MotoBox não é fornecido, cada chave de
 * imagem usada em `lib/data.ts` aponta para uma fotografia livre do Unsplash,
 * escolhida por tema (estrada, clubes, scooters, clássicas, oficina). Para passar
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
 * Imagens por slug: cada artigo, clube, evento e rota tem a sua.
 * Fotografias ilustrativas do Unsplash, até chegar o arquivo da MotoBox.
 */
export const POR_SLUG: Record<string, string> = {
  /* Artigos */
  "artigo-dia-do-motard": U("photo-1653058489330-b6ede759022e"),
  "artigo-amigos-da-picada": U("photo-1680473930033-008346c88cf4"),
  "artigo-lady-riders": U("photo-1598683308075-3ec9bc7e54e0"),
  "artigo-serra-da-leba": U("photo-1574417462817-a4e1aa71cc78"),
  "artigo-chuva": U("photo-1761252986972-7915b9f79cc3"),
  "artigo-capacete": U("photo-1611004061856-ccc3cbe944b2"),
  "artigo-primeira-mota": U("photo-1519750292352-c9fc17322ed7"),
  "artigo-verificacao": U("photo-1636761358757-0a616eb9e17e"),
  "artigo-grupo": U("photo-1698306757353-441cccd70e4f"),
  "artigo-300-km": U("photo-1623044933416-81d33fb60378"),
  "artigo-kalandula": U("photo-1749453841347-2cda97af2526"),
  "artigo-mota-usada": U("photo-1564410979892-38e38dda0b2f"),

  /* Clubes (capas ilustrativas) */
  "clube-amigos-da-picada": U("photo-1680473930033-008346c88cf4"),
  "clube-ladies-in-2-wheels": U("photo-1598683308075-3ec9bc7e54e0"),
  "clube-elite-motard": U("photo-1674829198252-589ed0f49716"),
  "clube-300-km-a-norte": U("photo-1623044933416-81d33fb60378"),
  "clube-motards-de-angola": U("photo-1698306757353-441cccd70e4f"),
  "clube-anjos-bantu": U("photo-1578719434213-4b2632627d99"),
  "clube-tuaregs": U("photo-1582092605221-bf4ddf388587"),
  "clube-performance-bikers": U("photo-1687181493462-0ca5d5627285"),
  "clube-african-nomadas": U("photo-1574417462817-a4e1aa71cc78"),
  "clube-amigos-do-capim": U("photo-1556036518-705db5129896"),
  "clube-nomadas-angola": U("photo-1609204276470-d22da7d40a3c"),
  "clube-vespa": U("photo-1747831127542-34be7e80d16b"),

  /* Eventos */
  "dia-do-motard-angolano-2026": U("photo-1687181493462-0ca5d5627285"),
  "encontro-motobox-marginal": U("photo-1674829198252-589ed0f49716"),
  "oficina-aberta-mecanica-basica": U("photo-1636761358757-0a616eb9e17e"),
  "passeio-miradouro-da-lua": U("photo-1582092605221-bf4ddf388587"),
  "raide-serra-da-leba": U("photo-1574417462817-a4e1aa71cc78"),
  "passeio-solidario-natal-2026": U("photo-1556036518-705db5129896"),

  /* Rotas */
  "serra-da-leba": U("photo-1574417462817-a4e1aa71cc78"),
  "tundavala": U("photo-1687227394984-a9de8f64fd0d"),
  "kalandula-e-pungo-andongo": U("photo-1749453841347-2cda97af2526"),
  "miradouro-da-lua": U("photo-1582092722992-b2f960bafbfb"),
  "cabo-ledo-e-quicama": U("photo-1573826688141-c0caf0e14081"),
  "deserto-do-namibe": U("photo-1514826863517-464eed44915d"),
  "costa-de-benguela": U("photo-1736454327682-a684ef60c3fe"),
  "estrada-da-costa": U("photo-1680473930033-008346c88cf4"),

  /* Marketplace (novos tipos de mota) */
  "vespa-amarela": U("photo-1747831127542-34be7e80d16b"),
  "trail-estrada": U("photo-1514826863517-464eed44915d"),
  "classica": U("photo-1564410979892-38e38dda0b2f"),

  /* Painel e secções */
  "painel-clubes": U("photo-1574417462817-a4e1aa71cc78"),
  "painel-eventos": U("photo-1687181493462-0ca5d5627285"),
  "painel-sobre": U("photo-1446446765936-ffb206d1c0f2"),
  "scooters": U("photo-1666275898271-451725695d92"),
  "custom": U("photo-1558980664-ce6960be307d"),
  "classicas": U("photo-1568708167256-1f385e6485f5"),
  "desportivas": U("photo-1653058489330-b6ede759022e"),
  "trail": U("photo-1667684446493-b5f5550c05ea"),
  "cidade": U("photo-1710297008210-4acfbc2bf550"),
  "chuva": U("photo-1693935963214-ce2feacbc7f8"),
  "noite": U("photo-1702231945323-6e3d2153ab92"),
};

/**
 * Fotografia de fundo das aberturas de página, por rota.
 */
export const BANNERS: Record<string, string> = {
  "artigos": U("photo-1653058489330-b6ede759022e"),
  "clubes": U("photo-1574417462817-a4e1aa71cc78"),
  "eventos": U("photo-1687181493462-0ca5d5627285"),
  "rotas": U("photo-1582092605221-bf4ddf388587"),
  "seguranca": U("photo-1611004061856-ccc3cbe944b2"),
  "marketplace": U("photo-1564410979892-38e38dda0b2f"),
  "importar": U("photo-1771252297207-eca148228341"),
  "forum": U("photo-1556036518-705db5129896"),
  "sobre": U("photo-1446446765936-ffb206d1c0f2"),
  "contacto": U("photo-1609204276470-d22da7d40a3c"),
  "legal": U("photo-1582092722992-b2f960bafbfb"),
  "entrar": U("photo-1598683308075-3ec9bc7e54e0"),
  "conta": U("photo-1602478411948-e28ad9b247b8"),
};

/** URL do banner de uma rota, já dimensionado. */
export function banner(chave: string, { w = 1920, q = 60 } = {}): string | null {
  const base = BANNERS[chave];
  return base ? `${base}?auto=format&fit=crop&w=${w}&q=${q}` : null;
}

/** Todas as chaves conhecidas, numa só tabela. */
const TODAS: Record<string, string> = {
  ...CENAS, ...RETRATOS, ...ARTIGOS, ...POR_SLUG,
  ...Object.fromEntries(Object.entries(BANNERS).map(([k, v]) => [`banner-${k}`, v])),
};

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
    // Um endereço completo (miniatura do YouTube, imagem colada no painel,
    // logótipo carregado) usa-se tal como está.
    if (/^https:\/\//.test(c)) return c;
    // chaves derivadas do tipo "capacete-2" (galerias) caem na imagem base
    const base = TODAS[c] ?? TODAS[c.replace(/-\d+$/, "")];
    if (base) return `${base}?auto=format&fit=crop&w=${w}&q=${q}`;
  }
  return null;
}

/** Servidores de imagem que o optimizador do Next conhece (ver next.config.ts). */
const OTIMIZAVEIS = [/^images\.unsplash\.com$/, /^i\.ytimg\.com$/, /^img\.youtube\.com$/, /\.supabase\.co$/];

/**
 * Verdadeiro quando o optimizador de imagens pode servir o endereço. Uma
 * imagem de outro servidor mostra-se sem optimização em vez de partir a página.
 */
export function otimizavel(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return OTIMIZAVEIS.some((r) => r.test(hostname));
  } catch {
    return false;
  }
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
