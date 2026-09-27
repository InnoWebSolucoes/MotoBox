/* ============================================================
   MOTOBOX — Selo de vendedor verificado
   Roseta verde com doze recortes à volta, como o selo de um
   certificado, e um visto branco. Desenhada à mão (não é o
   ícone "verified" de contorno) para se ler como selo mesmo a
   16px, em cima de uma fotografia ou ao lado de um nome.
   ============================================================ */

// Doze lóbulos arredondados com o fundo em bico (quadráticas entre vales
// de raio 9,2 com o controlo a 14), dentro do quadro de 24px.
const ROSETA =
  "M12 2.8Q15.62 -1.52 16.6 4.03Q21.9 2.1 19.97 7.4Q25.52 8.38 21.2 12Q25.52 15.62 19.97 16.6" +
  "Q21.9 21.9 16.6 19.97Q15.62 25.52 12 21.2Q8.38 25.52 7.4 19.97Q2.1 21.9 4.03 16.6" +
  "Q-1.52 15.62 2.8 12Q-1.52 8.38 4.03 7.4Q2.1 2.1 7.4 4.03Q8.38 -1.52 12 2.8Z";

export function SeloVerificado({
  tamanho = 16,
  rotulo = "Vendedor verificado",
  decorativo = false,
  className = "",
}: {
  /** Lado em píxeis. 16 a 18 nos cartões e ao lado de nomes. */
  tamanho?: number;
  /** Texto para leitores de ecrã e dica ao passar o rato. */
  rotulo?: string;
  /** Quando o texto ao lado já diz o mesmo: o selo fica escondido dos leitores de ecrã. */
  decorativo?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      className={`inline-block shrink-0 text-ok ${className}`}
      role={decorativo ? undefined : "img"}
      aria-label={decorativo ? undefined : rotulo}
      aria-hidden={decorativo ? true : undefined}
      focusable="false"
    >
      {!decorativo && <title>{rotulo}</title>}
      <path d={ROSETA} fill="currentColor" />
      <path
        d="M7.7 12.3l2.9 2.9 5.8-6"
        fill="none"
        stroke="#fff"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
