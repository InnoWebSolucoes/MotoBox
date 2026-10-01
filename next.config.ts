import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O site é servido em innoweb.agency/motobox: o projecto principal da
  // Innoweb encaminha /motobox/* para aqui. Tem de coincidir com BASE em
  // lib/base.ts (o fetch à própria API e os redireccionamentos usam-no).
  basePath: "/motobox",
  // Há um package-lock.json na pasta pessoal; a raiz do projecto é esta.
  turbopack: { root: path.join(__dirname) },
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
  // Endereços da versão anterior (calendário de provas, notícias...) levam
  // à secção nova mais próxima, para não partir ligações de emails e redes.
  async redirects() {
    return [
      { source: "/noticias", destination: "/artigos", permanent: false },
      { source: "/noticias/:slug", destination: "/artigos/:slug", permanent: false },
      { source: "/clubes/rotas", destination: "/rotas", permanent: false },
      { source: "/clubes/rotas/:slug", destination: "/rotas/:slug", permanent: false },
      { source: "/calendario", destination: "/eventos", permanent: false },
      { source: "/calendario/:slug", destination: "/eventos/:slug", permanent: false },
      { source: "/bilhetes", destination: "/eventos", permanent: false },
      { source: "/bilhetes/:slug", destination: "/eventos/:slug", permanent: false },
      { source: "/desporto/:path*", destination: "/eventos", permanent: false },
      { source: "/classificacao", destination: "/eventos", permanent: false },
      { source: "/resultados/:path*", destination: "/eventos", permanent: false },
      { source: "/pilotos/:path*", destination: "/artigos", permanent: false },
      { source: "/equipas/:path*", destination: "/clubes", permanent: false },
      { source: "/videos", destination: "/artigos", permanent: false },
      { source: "/patrocinadores", destination: "/sobre", permanent: false },
    ];
  },
};

export default nextConfig;
