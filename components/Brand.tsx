import Link from "next/link";
import Image from "next/image";
import { src as fotoSrc } from "@/lib/imagens";

/** Logótipo Motobox — reprodução em SVG do lettering com linhas de velocidade. */
export function Logo({ className = "", height = 28 }: { className?: string; height?: number }) {
  return (
    <svg
      viewBox="0 0 260 56"
      height={height}
      className={className}
      role="img"
      aria-label="Motobox Angola"
    >
      {/* linhas de velocidade superiores */}
      <g fill="none" strokeLinecap="round">
        <path d="M28 8 H232" stroke="#3d3d47" strokeWidth="1.5" />
        <path d="M44 13 H216" stroke="#e10600" strokeWidth="1.5" />
      </g>
      <text
        x="130"
        y="40"
        textAnchor="middle"
        fontFamily="var(--font-display), Arial Black, sans-serif"
        fontSize="30"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="-0.5"
      >
        <tspan fill="#e10600">MOTO</tspan>
        <tspan fill="currentColor">BOX</tspan>
      </text>
      <g fill="none" strokeLinecap="round">
        <path d="M44 48 H216" stroke="#e10600" strokeWidth="1.5" />
        <path d="M28 53 H232" stroke="#3d3d47" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

export function LogoLink({ height = 28 }: { height?: number }) {
  return (
    <Link href="/" aria-label="Motobox Angola — página inicial" className="shrink-0">
      <Logo height={height} className="text-white" />
    </Link>
  );
}

/**
 * Imagem de cena. Procura em `lib/imagens.ts` a fotografia da chave `nome`;
 * quando existe, entra por baixo das linhas de velocidade e do gradiente de
 * leitura. Sem fotografia, fica o gradiente determinístico por nome, que
 * continua a servir de marcador.
 */
const PALETAS: Record<string, [string, string]> = {
  kilamba: ["#7f1d1d", "#1c1917"],
  benguela: ["#0c4a6e", "#0a0a0c"],
  lubango: ["#14532d", "#0a0a0c"],
  cabinda: ["#134e4a", "#0a0a0c"],
  namibe: ["#78350f", "#1c1917"],
  huambo: ["#581c87", "#0a0a0c"],
  gala: ["#1e1b4b", "#0a0a0c"],
  natal: ["#7f1d1d", "#0a0a0c"],
  mxgp: ["#1e3a8a", "#0a0a0c"],
  ktm: ["#9a3412", "#0a0a0c"],
  dakar: ["#a16207", "#1c1917"],
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Placeholder({
  nome,
  className = "",
  label,
  rounded = false,
  largura = 1600,
  tamanhos = "(max-width: 768px) 100vw, 50vw",
}: {
  nome: string | (string | undefined)[];
  className?: string;
  label?: string;
  rounded?: boolean;
  /** Largura pedida ao CDN de origem. Baixar nas miniaturas. */
  largura?: number;
  /** `sizes` do next/image — afina o srcset ao espaço real ocupado. */
  tamanhos?: string;
}) {
  // Para o gradiente de reserva conta a última chave (a genérica do local).
  const chave = Array.isArray(nome) ? (nome.filter(Boolean).at(-1) ?? "") : nome;
  const paleta = PALETAS[chave];
  const h = hash(chave);
  const [c1, c2] = paleta ?? [`hsl(${h % 360} 45% 22%)`, "#0a0a0c"];
  const ang = 100 + (h % 60);

  const foto = fotoSrc(nome, { w: largura });

  return (
    <div
      className={`relative overflow-hidden bg-ink-900 ${rounded ? "rounded-full" : ""} ${className}`}
      style={{ background: `linear-gradient(${ang}deg, ${c1} 0%, ${c2} 78%)` }}
      aria-hidden={!label}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {foto && (
        <Image
          src={foto}
          alt={label ?? ""}
          fill
          sizes={tamanhos}
          className="object-cover"
        />
      )}
      <div className="speed-lines absolute inset-0 opacity-50" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 9px)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
    </div>
  );
}

/** Retrato de piloto: gradiente + iniciais grandes, ao estilo dos cartões F1. */
export function Retrato({
  nome,
  iniciais,
  className = "",
  cor,
  largura = 900,
  tamanhos = "(max-width: 768px) 50vw, 25vw",
}: {
  nome: string;
  iniciais: string;
  className?: string;
  cor?: string;
  /** Largura pedida ao CDN de origem. Baixar nos avatares pequenos. */
  largura?: number;
  /** `sizes` do next/image — afina o srcset ao espaço real ocupado. */
  tamanhos?: string;
}) {
  const h = hash(nome);
  const base = cor ?? `hsl(${h % 360} 40% 26%)`;
  const foto = fotoSrc(nome, { w: largura });
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(160deg, ${base} 0%, #0a0a0c 82%)` }}
    >
      {foto && (
        <Image
          src={foto}
          alt={iniciais ? `Retrato de ${nome}` : ""}
          fill
          sizes={tamanhos}
          className="object-cover"
        />
      )}
      <div className="speed-lines absolute inset-0 opacity-40" />
      {/* Iniciais só quando não há fotografia — de outro modo sujavam o retrato. */}
      {!foto && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-white/12 leading-none select-none" style={{ fontSize: "clamp(3rem, 34cqw, 12rem)" }}>
            {iniciais}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent" />
    </div>
  );
}
