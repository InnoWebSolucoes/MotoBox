import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotografias de demonstração (ver lib/imagens.ts). Quando o arquivo
    // fotográfico da Motobox entrar, este padrão deixa de ser necessário.
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
};

export default nextConfig;
