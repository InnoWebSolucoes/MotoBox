"use client";

/* ============================================================
   MOTOBOX — Medição de audiências (Google Analytics / Tag Manager)
   O código vem de Gestão › Definições ("Analytics"): um ID do
   Google Analytics 4 (G-XXXXXXXXXX), do Tag Manager (GTM-XXXXXXX)
   ou de outra etiqueta do Google (AW-…, UA-…).

   Só carrega depois de a pessoa aceitar os cookies analíticos no
   aviso de cookies (CookieBanner), e nunca no painel de gestão.
   Sem consentimento (ou com o aviso desligado), nada é carregado.
   ============================================================ */

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { caminhoDaPagina } from "@/lib/base";
import { lerConsentimento, subscreverConsentimento } from "./CookieBanner";

/** Só IDs: nada de código colado, que iria parar dentro de um <script>. */
const ID_VALIDO = /^(G|GTM|AW|UA|DC)-[A-Z0-9-]{4,24}$/i;

export function idAnalitica(codigo: string | undefined | null): string | null {
  const id = String(codigo ?? "").trim().toUpperCase();
  return ID_VALIDO.test(id) ? id : null;
}

export function Analitica({ codigo }: { codigo?: string }) {
  const caminho = caminhoDaPagina(usePathname());
  const consentiu = useSyncExternalStore(
    subscreverConsentimento,
    () => lerConsentimento()?.analiticos === true,
    () => false,
  );
  const id = idAnalitica(codigo);
  if (!id || !consentiu) return null;
  if (caminho === "/admin" || caminho.startsWith("/admin/")) return null;

  if (id.startsWith("GTM-")) {
    return (
      <Script id="motobox-gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
      </Script>
    );
  }

  return (
    <>
      <Script id="motobox-gtag" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="motobox-gtag-config" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
