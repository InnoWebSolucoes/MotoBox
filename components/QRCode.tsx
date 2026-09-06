"use client";

import { useEffect, useState } from "react";
import QR from "qrcode";

/**
 * Código QR do bilhete. Gerado no cliente a partir do código de validação,
 * de forma a que a imagem exista mesmo sem ligação ao servidor — o bilhete
 * tem de funcionar à entrada do recinto, onde a rede é sempre má.
 */
export function QRCode({
  valor,
  size = 176,
  className = "",
}: {
  valor: string;
  size?: number;
  className?: string;
}) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    QR.toString(valor, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 0,
      color: { dark: "#0a0a0c", light: "#ffffff" },
    })
      .then((s) => vivo && setSvg(s))
      .catch(() => vivo && setSvg(null));
    return () => {
      vivo = false;
    };
  }, [valor]);

  return (
    <div
      className={`grid place-items-center bg-white p-3 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Código QR do bilhete ${valor}`}
    >
      {svg ? (
        <div className="size-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="size-full animate-pulse bg-ink-200" />
      )}
    </div>
  );
}
