import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O site é servido em innoweb.agency/motobox: o projecto principal da
  // Innoweb encaminha /motobox/* para aqui. Tem de coincidir com BASE em
  // lib/base.ts (o fetch à própria API e os redireccionamentos usam-no).
  basePath: "/motobox",
  // Há um package-lock.json na pasta pessoal; a raiz do projecto é esta.
  turbopack: { root: path.join(__dirname) },
  // O guia em PDF de cada rota lê as letras e o logótipo do disco
  // (lib/rotas-pdf/recursos): têm de ir com a função na Vercel.
  outputFileTracingIncludes: {
    "/rotas/*/guia": ["./lib/rotas-pdf/recursos/**/*"],
  },
  images: {
    // Fotografias de demonstração (ver lib/imagens.ts). Quando o arquivo
    // fotográfico da MotoBox entrar, este padrão deixa de ser necessário.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/photo-**",
      },
      // Miniaturas dos vídeos importados do YouTube.
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/vi/**" },
      // Ficheiros públicos do Supabase Storage (logótipos das contas).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  // Endereços da versão anterior que mudaram de sítio (notícias, rotas) ou
  // saíram (vídeos, patrocinadores) levam à secção mais próxima. O Desporto
  // (calendário, resultados, classificação, pilotos, equipas, bilhetes)
  // continua nos endereços de sempre.
  async redirects() {
    return [
      { source: "/noticias", destination: "/artigos", permanent: false },
      { source: "/noticias/:slug", destination: "/artigos/:slug", permanent: false },
      { source: "/clubes/rotas", destination: "/rotas", permanent: false },
      { source: "/clubes/rotas/:slug", destination: "/rotas/:slug", permanent: false },
      { source: "/videos", destination: "/artigos", permanent: false },
      { source: "/patrocinadores", destination: "/sobre", permanent: false },
    ];
  },
};

export default nextConfig;
