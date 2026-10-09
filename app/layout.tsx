import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { urlPublica } from "@/lib/base";
import CookieBanner from "@/components/CookieBanner";
import { Analitica } from "@/components/Analitica";
import { TextosGeraisProvider } from "@/components/painel/TextosGerais";
import { lerDefinicoesSite, lerTextosGerais } from "@/lib/conteudo/ler-geral";
import { GERAL_PADRAO } from "@/lib/conteudo/grupos/geral";
import { definicoesSeed } from "@/lib/admin/seed";
import { IdiomaProvider } from "@/lib/i18n/contexto";
import { AuthProvider } from "@/lib/auth/contexto";
import { SessaoObrigatoriaProvider } from "@/components/SessaoObrigatoria";
import { IntroCapacete } from "@/components/IntroCapacete";
import { Cenario } from "@/components/painel/Cenario";
import { lerDoc } from "@/lib/conteudo";
import { ENTRADA_PADRAO, type ConteudoEntrada } from "@/lib/conteudo/grupos/site";
import { src as fotoSrc, urlLocal } from "@/lib/imagens";

const letra = Instrument_Sans({
  variable: "--font-mb",
  subsets: ["latin"],
  display: "swap",
});

// Só para o lettering do logótipo e para o painel de gestão.
const logo = Barlow_Condensed({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(`${urlPublica()}/`),
  title: {
    default: "MotoBox Angola | A casa de quem anda de mota",
    template: "%s | MotoBox Angola",
  },
  description:
    "Histórias, clubes, passeios, eventos e segurança para quem anda de mota em Angola. Da scooter de todos os dias à moto de viagem, a comunidade motard angolana num só lugar.",
  keywords: [
    "motas Angola",
    "motard Angola",
    "clubes de motas Angola",
    "moto-turismo Angola",
    "Lady Riders Angola",
    "segurança rodoviária motas",
    "MotoBox",
  ],
  openGraph: {
    type: "website",
    locale: "pt_AO",
    siteName: "MotoBox Angola",
    title: "MotoBox Angola | A casa de quem anda de mota",
    description:
      "Histórias, clubes, passeios, eventos e segurança para quem anda de mota em Angola.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // O vídeo de fundo de todo o site (Gestão › Entrada e painel), já em endereços prontos a usar.
  // Os textos gerais (rodapé, botão de acção, cookies, manutenção…) vêm de Entrada e painel › Geral;
  // o modo de manutenção, o aviso de cookies e a medição de audiências, das Definições.
  const [entrada, geral, definicoes] = await Promise.all([
    lerDoc<ConteudoEntrada>("site.entrada").catch(() => ENTRADA_PADRAO),
    lerTextosGerais().catch(() => GERAL_PADRAO()),
    lerDefinicoesSite().catch(() => definicoesSeed),
  ]);
  const video = entrada?.video || ENTRADA_PADRAO.video;
  const fundo = {
    video: video.startsWith("/") ? urlLocal(video) : video,
    poster: fotoSrc([entrada?.poster, ENTRADA_PADRAO.poster], { w: 1920 }) ?? urlLocal(ENTRADA_PADRAO.poster),
  };

  return (
    <html lang="pt-AO" className={`${letra.variable} ${logo.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-mb-red focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Saltar para o conteúdo
        </a>
        <IdiomaProvider>
          <AuthProvider>
            <TextosGeraisProvider textos={geral}>
              <SessaoObrigatoriaProvider>
                <Cenario
                  fundo={fundo}
                  manutencao={{ activa: definicoes.manutencao === true, email: definicoes.emailContacto }}
                >
                  {children}
                </Cenario>
                <CookieBanner activo={definicoes.cookieBanner !== false} />
                <IntroCapacete />
              </SessaoObrigatoriaProvider>
              <Analitica codigo={definicoes.analytics} />
            </TextosGeraisProvider>
          </AuthProvider>
        </IdiomaProvider>
      </body>
    </html>
  );
}
