import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { IdiomaProvider } from "@/lib/i18n/contexto";
import { AuthProvider } from "@/lib/auth/contexto";

const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://motobox.ao"),
  title: {
    default: "Motobox Angola — A casa do motociclismo angolano",
    template: "%s | Motobox Angola",
  },
  description:
    "Calendário, resultados, classificações, pilotos, notícias, bilhetes e marketplace do motociclismo em Angola. A referência digital do mundo motard angolano.",
  keywords: [
    "motocross Angola",
    "motard Angola",
    "campeonato nacional motocross",
    "enduro Angola",
    "Motobox",
    "motas Angola",
  ],
  openGraph: {
    type: "website",
    locale: "pt_AO",
    siteName: "Motobox Angola",
    title: "Motobox Angola — A casa do motociclismo angolano",
    description:
      "Calendário, resultados, pilotos, bilhetes e marketplace do motociclismo em Angola.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-mb-red focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:uppercase focus:text-white"
        >
          Saltar para o conteúdo
        </a>
        <IdiomaProvider>
        <AuthProvider>
        <Nav />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Footer />
        <CookieBanner />
        </AuthProvider>
        </IdiomaProvider>
      </body>
    </html>
  );
}
