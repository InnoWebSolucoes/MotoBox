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
    ],
  },
};

export default nextConfig;
