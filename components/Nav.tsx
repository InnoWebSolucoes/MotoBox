"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoLink } from "./Brand";
import { Icon } from "./ui";
import { SOCIAIS } from "@/lib/data";

type NavItem = { href: string; label: string; filhos?: { href: string; label: string; desc: string }[] };

const NAV: NavItem[] = [
  {
    href: "/calendario",
    label: "Calendário",
    filhos: [
      { href: "/calendario", label: "Calendário 2026", desc: "Todas as provas da temporada" },
      { href: "/bilhetes", label: "Bilhetes", desc: "Comprar entradas para os eventos" },
    ],
  },
  {
    href: "/resultados",
    label: "Resultados",
    filhos: [
      { href: "/resultados", label: "Arquivo de resultados", desc: "Corrida a corrida, época a época" },
      { href: "/classificacao", label: "Classificação", desc: "Tabela nacional de pilotos e equipas" },
    ],
  },
  {
    href: "/pilotos",
    label: "Pilotos",
    filhos: [
      { href: "/pilotos", label: "Pilotos", desc: "Perfis, estatísticas e redes sociais" },
      { href: "/equipas", label: "Equipas e clubes", desc: "As estruturas do motociclismo angolano" },
    ],
  },
  {
    href: "/noticias",
    label: "Notícias",
    filhos: [
      { href: "/noticias", label: "Todas as notícias", desc: "Angola e internacional" },
      { href: "/videos", label: "Vídeos", desc: "Highlights, onboards e documentários" },
    ],
  },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/forum", label: "Fórum" },
  {
    href: "/sobre",
    label: "Motobox",
    filhos: [
      { href: "/sobre", label: "Sobre a Motobox", desc: "História, missão e equipa" },
      { href: "/patrocinadores", label: "Patrocinadores", desc: "Quem apoia o motociclismo nacional" },
      { href: "/contacto", label: "Contacto", desc: "Fale connosco" },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const fecharTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAberto(false);
    setDropdown(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        setDropdown(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activo = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const abrir = (label: string) => {
    if (fecharTimer.current) clearTimeout(fecharTimer.current);
    setDropdown(label);
  };
  const fechar = () => {
    fecharTimer.current = setTimeout(() => setDropdown(null), 120);
  };

  return (
    <header className="sticky top-0 z-50">
      <nav className="border-b border-ink-800 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            className="lg:hidden -ml-2 grid size-10 place-items-center text-white"
            onClick={() => setAberto((v) => !v)}
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
          >
            <Icon name={aberto ? "close" : "menu"} className="size-6" />
          </button>

          <LogoLink height={26} />

          <ul className="ml-6 hidden lg:flex items-center gap-0.5">
            {NAV.map((item) => (
              <li
                key={item.label}
                className="relative"
                onMouseEnter={() => item.filhos && abrir(item.label)}
                onMouseLeave={fechar}
              >
                <Link
                  href={item.href}
                  className={`relative flex h-16 items-center px-3.5 font-display text-[13px] uppercase tracking-wide transition-colors ${
                    activo(item.href) ? "text-white" : "text-ink-300 hover:text-white"
                  }`}
                >
                  {item.label}
                  {activo(item.href) && (
                    <span className="absolute inset-x-2.5 bottom-0 h-[3px] bg-mb-red" aria-hidden />
                  )}
                </Link>

                {item.filhos && dropdown === item.label && (
                  <div
                    className="absolute left-0 top-16 w-72 border border-ink-700 bg-ink-900 shadow-2xl shadow-black/60"
                    onMouseEnter={() => abrir(item.label)}
                    onMouseLeave={fechar}
                  >
                    {item.filhos.map((f) => (
                      <Link
                        key={f.href}
                        href={f.href}
                        className="group block border-b border-ink-800 p-4 last:border-0 hover:bg-ink-850"
                      >
                        <span className="flex items-center justify-between font-display text-sm uppercase tracking-wide text-white">
                          {f.label}
                          <Icon
                            name="arrow"
                            className="size-4 text-mb-red opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </span>
                        <span className="mt-1 block text-xs text-ink-500">{f.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/bilhetes"
              className="hidden sm:inline-flex h-9 items-center gap-2 bg-mb-red px-4 font-display text-[11px] uppercase tracking-widest text-white hover:bg-mb-red-dark transition-colors"
            >
              <Icon name="ticket" className="size-4" />
              Bilhetes
            </Link>
            <Link
              href="/conta"
              className="grid size-10 place-items-center text-ink-300 hover:text-white transition-colors"
              aria-label="A minha conta"
            >
              <Icon name="user" className="size-5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Menu móvel */}
      {aberto && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-ink-950 border-t border-ink-800">
          <ul className="divide-y divide-ink-800">
            {NAV.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-5 py-4 font-display text-base uppercase tracking-wide ${
                    activo(item.href) ? "text-mb-red" : "text-white"
                  }`}
                >
                  {item.label}
                  <Icon name="arrow" className="size-4 text-ink-600" />
                </Link>
                {item.filhos && (
                  <ul className="bg-ink-900/60 pb-1">
                    {item.filhos.slice(1).map((f) => (
                      <li key={f.href}>
                        <Link href={f.href} className="block px-5 py-3 text-sm text-ink-300">
                          {f.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-3 p-5">
            <Link
              href="/bilhetes"
              className="flex-1 h-12 grid place-items-center bg-mb-red font-display text-xs uppercase tracking-widest text-white"
            >
              Comprar bilhetes
            </Link>
            <Link
              href="/conta"
              className="flex-1 h-12 grid place-items-center border border-ink-600 font-display text-xs uppercase tracking-widest text-white"
            >
              A minha conta
            </Link>
          </div>
          <div className="flex gap-2 px-5 pb-10">
            {(["instagram", "facebook", "youtube"] as const).map((r) => (
              <a
                key={r}
                href={SOCIAIS[r]}
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-11 place-items-center border border-ink-700 text-ink-300"
                aria-label={r}
              >
                <Icon name={r} className="size-5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
