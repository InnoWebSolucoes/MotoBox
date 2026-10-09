/**
 * Registo de fotografias.
 *
 * Cada chave de imagem usada em `lib/data.ts`, na base de dados e nas páginas
 * aponta para uma fotografia real, publicada no Instagram da MotoBox
 * (@motobox_angola) ou no do próprio clube. As fotografias foram escolhidas por
 * tema (motocross, Dia do Motard, passeios, clubes) e copiadas para o Supabase
 * Storage (bucket "media", pasta imagens/), com o nome
 * `instagram-<código da publicação>-<n.º da imagem no carrossel>.jpg`.
 *
 * A lista com a publicação de origem, a data e o que cada fotografia mostra
 * está em `lib/imagens-instagram.ts`.
 *
 * Os retratos de pilotos (RETRATOS) são fotografias de corrida com o capacete
 * posto: os pilotos do site são fictícios e ninguém é reconhecível.
 *
 * A largura pedida a `src()` só se aplica a fotografias do Unsplash (por
 * exemplo, um endereço antigo colado no painel); as do Storage seguem tal como
 * estão e é o optimizador do Next que as dimensiona.
 */

import { BASE, comBase } from "@/lib/base";

/** Ficheiros públicos do bucket "media" (projecto Supabase da MotoBox). */
const MEDIA = "https://sluahnkxfnibximsqcht.supabase.co/storage/v1/object/public/media";

/** Fotografia do Instagram copiada para o Storage: "DbfmkCCDm2b-1" → …/imagens/instagram-DbfmkCCDm2b-1.jpg */
const IG = (ref: string) => `${MEDIA}/imagens/instagram-${ref}.jpg`;

/** Caminho de um ficheiro do próprio site, com o prefixo /motobox. */
export const urlLocal = (caminho: string) => (caminho.startsWith(`${BASE}/`) ? caminho : comBase(caminho));

/** Provas, circuitos, notícias e vídeos — imagens largas. */
export const CENAS: Record<string, string> = {
  "kilamba": IG("DSKHLvuDGe4-3"),
  "benguela": IG("DCe7tpetE5C-6"),
  "lubango": IG("DdjRu2YjDrX-17"),
  "cabinda": IG("DW3R3ozjQcx-4"),
  "namibe": IG("DBvc8neIInk-1"),
  "huambo": IG("DSKHLvuDGe4-8"),
  "tundavala": IG("DdjRu2YjDrX-20"),
  "gala": IG("Dby44iSnCiV-7"),
  "natal": IG("DavYPd7jBW8-12"),
  "mxgp": IG("DXOgXAkjGzU-2"),
  "ktm": IG("DdjRu2YjDrX-14"),
  "dakar": IG("DTcnUPYDgQk-1"),
  "competicao": IG("DdjRu2YjDrX-19"),
  "passeios": IG("DT-_0YuETLc-1"),
  "mecanica": IG("DcEhdn5DghP-1"),
  "geral": IG("DbfmkCCDm2b-3"),
  "novatos": IG("DX1mrF1DDPg-2"),
};

/** Retratos de pilotos, por slug: pilotos em prova, de capacete posto. */
export const RETRATOS: Record<string, string> = {
  "nelson-kiala": IG("DeG034qDmZW-3"),
  "joana-ferraz": IG("DXFD2QqDNf8-2"),
  "ivandro-cabral": IG("DdjRu2YjDrX-15"),
  "carlos-samba": IG("DKsU0buNEJu-3"),
  "mario-bengui": IG("DeG034qDmZW-5"),
  "rui-katchimba": IG("DdjRu2YjDrX-11"),
  "adilson-mbala": IG("DXFD2QqDNf8-3"),
  "eduardo-neto": IG("DeG034qDmZW-2"),
  "helder-quissanga": IG("DdjRu2YjDrX-18"),
  "paulo-tembo": IG("DdjRu2YjDrX-12"),
  "bruno-tchipa": IG("DeG034qDmZW-4"),
  "silvio-domingos": IG("DX1mrF1DDPg-4"),
};

/** Anúncios do marketplace. */
export const ARTIGOS: Record<string, string> = {
  "crf450": IG("DeG034qDmZW-9"),
  "ktm250": IG("DdjRu2YjDrX-16"),
  "fe350": IG("DCe7tpetE5C-6"),
  "tenere": IG("DZMsNT5tpvd-1"),
  "dr650": IG("DLem_f1sYAq-1"),
  "capacete": IG("DXFD2QqDNf8-1"),
  "botas": IG("DeG034qDmZW-11"),
  "equipamento": IG("DX1mrF1DDPg-3"),
  "escape": IG("DcEhdn5DghP-6"),
  "suspensao": IG("DcEhdn5DghP-8"),
  "plasticos": IG("DcEhdn5DghP-7"),
  "suporte": IG("DcEhdn5DghP-1"),
};

/**
 * Imagens por slug: cada artigo, clube, evento e rota tem a sua.
 * Os clubes usam fotografias das suas próprias contas de Instagram.
 */
export const POR_SLUG: Record<string, string> = {
  /* Artigos */
  "artigo-dia-do-motard": IG("DaqgievjrnF-4"),
  "artigo-amigos-da-picada": IG("DLPZ6uHMcCx-1"),
  "artigo-lady-riders": IG("DVp--SuDFU5-1"),
  "artigo-serra-da-leba": IG("B_pMzdugT2Z-1"),
  "artigo-chuva": IG("DW1Zt26lyG6-5"),
  "artigo-capacete": IG("DXFD2QqDNf8-1"),
  "artigo-primeira-mota": IG("DXOgXAkjGzU-4"),
  "artigo-verificacao": IG("DNdX5I9MWtz-1"),
  "artigo-grupo": IG("DavYPd7jBW8-9"),
  "artigo-300-km": IG("ClE15vph_gI-2"),
  "artigo-kalandula": IG("DW1Zt26lyG6-1"),
  "artigo-mota-usada": IG("DaKjfkWsfFU-1"),

  /* Clubes (fotografias das contas dos próprios clubes) */
  "clube-amigos-da-picada": IG("Dby44iSnCiV-1"),
  "clube-ladies-in-2-wheels": IG("DF-TKRPIq-4-1"),
  "clube-elite-motard": IG("ClE3S7FBb1l-4"),
  "clube-300-km-a-norte": IG("CoLjbIvsalB-1"),
  "clube-motards-de-angola": IG("DKsU0buNEJu-1"),
  "clube-anjos-bantu": IG("DWPOelXjkL8-8"),
  "clube-tuaregs": IG("DavZJwkjAQW-1"),
  "clube-performance-bikers": IG("DGzya6bM8j_-1"),
  "clube-african-nomadas": IG("C2PgSGss_XY-4"),
  // A conta do clube só tem uma imagem pequena: esta é dos Motards de Angola, «Amigo capim».
  "clube-amigos-do-capim": IG("C65x4Z0sNAj-3"),
  "clube-nomadas-angola": IG("B_b6bwuAYfF-1"),
  "clube-vespa": IG("C3qHQEnMJyW-1"),

  /* Eventos */
  "dia-do-motard-angolano-2026": IG("DbfmkCCDm2b-2"),
  "encontro-motobox-marginal": IG("DaqgievjrnF-1"),
  "oficina-aberta-mecanica-basica": IG("DcEhdn5DghP-8"),
  "passeio-miradouro-da-lua": IG("ClE3S7FBb1l-3"),
  "raide-serra-da-leba": IG("B_pMzdugT2Z-1"),
  "passeio-solidario-natal-2026": IG("DW3R3ozjQcx-12"),
  "moto-4-kilamba": IG("DXFD2QqDNf8-4"),
  "moto-4-kilamba-2026": IG("DXFD2QqDNf8-4"),

  /* Rotas (as páginas das rotas usam as fotografias do Commons, em lib/rotas-fotos.ts) */
  "serra-da-leba": IG("B_pMzdugT2Z-1"),
  "tundavala": IG("DdjRu2YjDrX-20"),
  "kalandula-e-pungo-andongo": IG("DW1Zt26lyG6-1"),
  "miradouro-da-lua": IG("ClE3S7FBb1l-3"),
  "cabo-ledo-e-quicama": IG("C14RJZzspq9-1"),
  "deserto-do-namibe": IG("DBvc8neIInk-1"),
  "costa-de-benguela": IG("ClE2xbmBYXh-5"),
  "estrada-da-costa": IG("ClE3S7FBb1l-3"),

  /* Marketplace (novos tipos de mota) */
  "vespa-amarela": IG("C14RJZzspq9-2"),
  "trail-estrada": IG("DNdX5I9MWtz-2"),
  "classica": IG("DaqgievjrnF-1"),

  /* Desporto */
  "moto-4": IG("DYALZYxDJIZ-1"),

  /* Painel e secções */
  "painel-clubes": IG("C2IbIXLIvYx-3"),
  "painel-eventos": IG("DavYPd7jBW8-10"),
  "painel-sobre": IG("C2PgSGss_XY-6"),
  "scooters": IG("C_kY30liZyR-2"),
  "custom": IG("DXl9OEsjPYs-1"),
  "classicas": IG("DaqgievjrnF-1"),
  "desportivas": IG("DUFnyinjlp1-1"),
  "trail": IG("ClE1sQJBcQo-1"),
  "cidade": IG("DbfmkCCDm2b-4"),
  "chuva": IG("DW1Zt26lyG6-5"),
  "noite": IG("Dby44iSnCiV-6"),
};

/**
 * Fotografia de fundo das aberturas de página, por rota.
 */
export const BANNERS: Record<string, string> = {
  "artigos": IG("DdjRu2YjDrX-6"),
  "clubes": IG("C2PgSGss_XY-5"),
  "eventos": IG("DbfmkCCDm2b-1"),
  "rotas": IG("DKsU0buNEJu-2"),
  "seguranca": IG("DbfmkCCDm2b-5"),
  "marketplace": IG("C2PgSGss_XY-3"),
  "importar": IG("DMxwIL9NTkr-5"),
  "forum": IG("DEKpBl3NKLp-4"),
  "sobre": IG("DW_LM6gDJlC-1"),
  "contacto": IG("DYwhrpGuYR0-1"),
  "legal": IG("Co8KkeJM9XI-4"),
  "entrar": IG("DFYkDtpM3Y2-5"),
  "conta": IG("DGzya6bM8j_-1"),
};

/**
 * Endereço de uma fotografia na largura pedida. Só o Unsplash recebe os
 * parâmetros de tamanho e recorte; os ficheiros do Storage não os entendem
 * e seguem tal como estão.
 */
function dimensionar(base: string, w: number, q: number): string {
  return base.startsWith("https://images.unsplash.com/") ? `${base}?auto=format&fit=crop&w=${w}&q=${q}` : base;
}

/** URL do banner de uma rota, já dimensionado. */
export function banner(chave: string, { w = 1920, q = 60 } = {}): string | null {
  const base = BANNERS[chave];
  return base ? dimensionar(base, w, q) : null;
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
    // Um caminho local ("/videos/fundo.jpg", ou um ficheiro do painel em
    // desenvolvimento) leva o prefixo do site, se ainda não o tiver.
    if (c.startsWith("/")) return urlLocal(c);
    // chaves derivadas do tipo "capacete-2" (galerias) caem na imagem base
    const base = TODAS[c] ?? TODAS[c.replace(/-\d+$/, "")];
    if (base) return dimensionar(base, w, q);
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
