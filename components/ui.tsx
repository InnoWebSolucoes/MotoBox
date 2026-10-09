import Link from "next/link";
import type { ReactNode } from "react";

/* ---------------- Botão ---------------- */

type BtnVariant = "primary" | "ghost" | "outline" | "dark" | "light";
type BtnSize = "sm" | "md" | "lg";

// Botões do painel: cantos de 6px, vermelho da marca para a acção principal.
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-[var(--raio)] whitespace-nowrap transition-colors disabled:opacity-45 disabled:pointer-events-none";

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-mb-red text-white hover:bg-mb-red-dark",
  ghost: "text-white/75 hover:text-white hover:bg-white/8",
  outline: "bg-white/8 text-white hover:bg-white/15",
  dark: "bg-white/8 text-white hover:bg-white/15",
  light: "bg-white text-black hover:bg-white/85",
};

const btnSizes: Record<BtnSize, string> = {
  sm: "text-sm px-4 h-9",
  md: "text-[15px] px-5 h-11",
  lg: "text-[15px] px-6 h-14",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: {
  children: ReactNode;
  href: string;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

/* ---------------- Etiquetas ---------------- */

export function Tag({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "red" | "neutral" | "outline" | "gold" | "live" | "ok";
  className?: string;
}) {
  const tones = {
    red: "bg-mb-red text-white",
    neutral: "bg-black/60 text-white/90 backdrop-blur-sm",
    outline: "bg-black/60 text-white/90 backdrop-blur-sm",
    gold: "bg-gold text-black",
    live: "bg-live text-white",
    ok: "bg-ok text-white",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs leading-none ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

/* ---------------- Cabeçalho de secção ---------------- */

export function SectionHead({
  eyebrow,
  titulo,
  descricao,
  acao,
  className = "",
}: {
  eyebrow?: string;
  titulo: string;
  descricao?: string;
  acao?: { href: string; texto: string };
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className="sobretitulo mb-3 text-white/80">{eyebrow}</p>}
        <h2 className="titulo-3">{titulo}</h2>
        {descricao && <p className="mt-3 text-sm leading-relaxed text-white/70">{descricao}</p>}
      </div>
      {acao && (
        <Link href={acao.href} className="sublinhado text-sm text-white">
          {acao.texto}
        </Link>
      )}
    </div>
  );
}

/* ---------------- Cabeçalho de página ---------------- */

/** Cabeçalho simples, para páginas dentro de <PaginaInterior>. */
export function PageHero({
  eyebrow,
  titulo,
  descricao,
  children,
}: {
  eyebrow: string;
  titulo: string;
  descricao?: string;
  children?: ReactNode;
  /** Mantido por compatibilidade; a fotografia vive agora no fundo do painel. */
  imagem?: string;
}) {
  return (
    <header className="coluna pb-8 pt-28 lg:pt-32">
      <p className="sobretitulo surgir text-white/80">{eyebrow}</p>
      <h1 className="titulo-1 surgir mt-4 max-w-[16ch] text-balance">{titulo}</h1>
      {descricao && <p className="texto-lead surgir mt-6 max-w-[52ch] text-white/85">{descricao}</p>}
      {children && <div className="surgir mt-8">{children}</div>}
    </header>
  );
}

/* ---------------- Estado vazio ---------------- */

export function EmptyState({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="painel painel-escuro px-8 py-14 text-center">
      <p className="text-lg font-semibold text-white/85">{titulo}</p>
      <p className="mt-2 text-sm text-white/75">{descricao}</p>
    </div>
  );
}

/* ---------------- Número de posição ---------------- */

export function PosicaoBadge({ posicao, size = "md" }: { posicao: number; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-6 text-lg" : "w-9 text-2xl";
  return (
    <span className={`shrink-0 font-semibold leading-none tabular-nums ${dim} ${posicao === 0 ? "text-sm text-white/75" : "text-white"}`}>
      {posicao === 0 ? "NC" : posicao}
    </span>
  );
}

/* ---------------- Ícones (linha, 24px) ---------------- */

const ic = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function Icon({ name, className = "size-4" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2.5" {...ic} />
        <path d="M3 10h18M8 3v4M16 3v4" {...ic} />
      </>
    ),
    trophy: (
      <>
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" {...ic} />
        <path d="M7 6H4v1a4 4 0 0 0 3 3.9M17 6h3v1a4 4 0 0 1-3 3.9M9 20h6M12 14v6" {...ic} />
      </>
    ),
    ticket: (
      <>
        <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a3 3 0 0 0 0 6v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a3 3 0 0 0 0-6V8Z" {...ic} />
        <path d="M14 6v2M14 11v2M14 16v2" {...ic} strokeDasharray="1 3" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" {...ic} />
        <path d="M4 21a8 8 0 0 1 16 0" {...ic} />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" {...ic} />
        <path d="m20 20-3.5-3.5" {...ic} />
      </>
    ),
    play: <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor" />,
    bell: (
      <>
        <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" {...ic} />
        <path d="M10.5 20a2 2 0 0 0 3 0" {...ic} />
      </>
    ),
    chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" {...ic} />,
    wrench: <path d="M14.5 6.5a4 4 0 0 0 5 5l-8 8a2.8 2.8 0 0 1-4-4l8-8a4 4 0 0 0-1 1Z" {...ic} />,
    map: (
      <>
        <path d="m9 4 6 2 6-2v14l-6 2-6-2-6 2V6l6-2Z" {...ic} />
        <path d="M9 4v14M15 6v14" {...ic} />
      </>
    ),
    shield: <path d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6l-7-3Z" {...ic} />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" {...ic} />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.7.6-.7 1.1v.5" {...ic} />
        <circle cx="12" cy="17" r="0.9" fill="currentColor" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" {...ic} />
        <circle cx="12" cy="10" r="2.5" {...ic} />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" {...ic} />
        <path d="M12 7v5l3.2 2" {...ic} />
      </>
    ),
    check: <path d="m5 12.5 4.5 4.5L19 7" {...ic} />,
    plus: <path d="M12 5v14M5 12h14" {...ic} />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" {...ic} />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" {...ic} />,
    close: <path d="m6 6 12 12M18 6 6 18" {...ic} />,
    filter: <path d="M4 6h16l-6.5 7.5V19l-3 2v-7.5L4 6Z" {...ic} />,
    eye: (
      <>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" {...ic} />
        <circle cx="12" cy="12" r="3" {...ic} />
      </>
    ),
    eyeOff: (
      <>
        <path d="M10.6 5.6A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.6M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.5-.6 4.9-1.5" {...ic} />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" {...ic} />
      </>
    ),
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" {...ic} />
        <circle cx="12" cy="12" r="4" {...ic} />
        <circle cx="17" cy="7" r="1.1" fill="currentColor" />
      </>
    ),
    facebook: (
      <path
        d="M14 8.5V7c0-.8.4-1.2 1.3-1.2H17V3h-2.5C11.9 3 11 4.4 11 6.6v1.9H9V11h2v10h3V11h2.2l.4-2.5H14Z"
        fill="currentColor"
      />
    ),
    youtube: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" {...ic} />
        <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" />
      </>
    ),
    // Formas do Simple Icons (domínio público), no mesmo quadro de 24px.
    linkedin: (
      <path
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z"
        fill="currentColor"
      />
    ),
    google: (
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.05 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05H12.48Z"
        fill="currentColor"
      />
    ),
    whatsapp: (
      <path
        d="M12 3a9 9 0 0 0-7.8 13.4L3 21l4.7-1.2A9 9 0 1 0 12 3Zm4.6 12.3c-.2.6-1.1 1.1-1.6 1.1-.4 0-.9.2-3-.8-2.5-1.1-4.1-3.7-4.2-3.9-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4 0 .5l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.2.1.4 0 .5-.1l.7-.8c.2-.2.3-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.1.1.5 0 .8Z"
        fill="currentColor"
      />
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" {...ic} />
        <path d="m3.5 7 8.5 6 8.5-6" {...ic} />
      </>
    ),
    flag: (
      <>
        <path d="M5 21V4M5 4h13l-2.5 4L18 12H5" {...ic} />
      </>
    ),
    heart: (
      <path
        d="M12 20s-7-4.4-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20Z"
        {...ic}
      />
    ),
    star: (
      <path d="m12 4 2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.8 9.6 9 12 4Z" {...ic} />
    ),
    verified: (
      <>
        <path d="m12 3 2.3 1.7 2.8-.2.9 2.7 2.4 1.6-1 2.7 1 2.7-2.4 1.6-.9 2.7-2.8-.2L12 21l-2.3-1.7-2.8.2-.9-2.7-2.4-1.6 1-2.7-1-2.7 2.4-1.6.9-2.7 2.8.2L12 3Z" {...ic} />
        <path d="m9 12 2 2 4-4" {...ic} />
      </>
    ),
    bike: (
      <>
        <circle cx="5.5" cy="16.5" r="3.5" {...ic} />
        <circle cx="18.5" cy="16.5" r="3.5" {...ic} />
        <path d="M5.5 16.5 9 9h5l2 3h2.5M9 9H7M14 9l1.5-3h2.5" {...ic} />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" {...ic} />
        <rect x="14" y="3" width="7" height="7" {...ic} />
        <rect x="3" y="14" width="7" height="7" {...ic} />
        <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" {...ic} />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" {...ic} />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" {...ic} />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" {...ic} />
        <path d="M12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2m15.1-7.1-1.8 1.8M8.7 15.3l-1.8 1.8m10.2 0-1.8-1.8M8.7 8.7 6.9 6.9" {...ic} />
      </>
    ),
    logout: (
      <>
        <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" {...ic} />
        <path d="M10 8 6 12l4 4M6 12h10" {...ic} />
      </>
    ),
    download: <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" {...ic} />,
    share: (
      <>
        <circle cx="18" cy="6" r="2.5" {...ic} />
        <circle cx="6" cy="12" r="2.5" {...ic} />
        <circle cx="18" cy="18" r="2.5" {...ic} />
        <path d="m8.3 10.8 7.4-3.6M8.3 13.2l7.4 3.6" {...ic} />
      </>
    ),
    trending: <path d="m3 17 5.5-5.5 3.5 3.5L21 6m0 0h-5m5 0v5" {...ic} />,
    fire: (
      <path d="M12 3s1 3-1.5 5.5C8 11 7 12.5 7 15a5 5 0 0 0 10 0c0-2-1-3.5-2-4.5 0 1.5-1 2-1.5 2 .5-3-1.5-6-1.5-9.5Z" {...ic} />
    ),
    tag: (
      <>
        <path d="M3 11.5V4a1 1 0 0 1 1-1h7.5L21 12.5 12.5 21 3 11.5Z" {...ic} />
        <circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[name] ?? paths.help}
    </svg>
  );
}
