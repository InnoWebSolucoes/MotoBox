"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoLink } from "./Brand";
import { Icon } from "./ui";
import { SOCIAIS } from "@/lib/data";
import { useIdioma } from "@/lib/i18n/contexto";
import { useAuth } from "@/lib/auth/contexto";
import { SelectorIdioma } from "./SelectorIdioma";

type NavItem = { href: string; chave: string; filhos?: { href: string; chave: string; desc: string }[] };

const NAV: NavItem[] = [
  {
    href: "/calendario",
    chave: "nav.calendario",
    filhos: [
      { href: "/calendario", chave: "menu.calendario2026", desc: "menu.calendarioDesc" },
      { href: "/bilhetes", chave: "nav.bilhetes", desc: "menu.bilhetesDesc" },
    ],
  },
  {
    href: "/resultados",
    chave: "nav.resultados",
    filhos: [
      { href: "/resultados", chave: "menu.arquivoResultados", desc: "menu.arquivoDesc" },
      { href: "/classificacao", chave: "nav.classificacao", desc: "menu.classificacaoDesc" },
    ],
  },
  {
    href: "/pilotos",
    chave: "nav.pilotos",
    filhos: [
      { href: "/pilotos", chave: "nav.pilotos", desc: "menu.pilotosDesc" },
      { href: "/equipas", chave: "menu.equipasClubes", desc: "menu.equipasDesc" },
    ],
  },
  {
    href: "/noticias",
    chave: "nav.noticias",
    filhos: [
      { href: "/noticias", chave: "menu.todasNoticias", desc: "menu.noticiasDesc" },
      { href: "/videos", chave: "nav.videos", desc: "menu.videosDesc" },
    ],
  },
  { href: "/marketplace", chave: "nav.marketplace" },
  { href: "/forum", chave: "nav.forum" },
  {
    href: "/sobre",
    chave: "marca.motobox",
    filhos: [
      { href: "/sobre", chave: "menu.sobreMotobox", desc: "menu.sobreDesc" },
      { href: "/patrocinadores", chave: "nav.patrocinadores", desc: "menu.patrocinadoresDesc" },
      { href: "/contacto", chave: "nav.contacto", desc: "menu.contactoDesc" },
    ],
  },
];

export function Nav() {
  const { t } = useIdioma();
  const { utilizador, perfil, equipa, sair } = useAuth();
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
      <nav className="stripes relative border-b border-white/5 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            className="lg:hidden -ml-2 grid size-10 place-items-center rounded-full text-white transition-colors hover:bg-white/8"
            onClick={() => setAberto((v) => !v)}
            aria-label={aberto ? t("nav.fecharMenu") : t("nav.abrirMenu")}
            aria-expanded={aberto}
          >
            <Icon name={aberto ? "close" : "menu"} className="size-6" />
          </button>

          <LogoLink height={26} />

          <ul className="ml-2 xl:ml-5 hidden lg:flex items-center">
            {NAV.map((item) => (
              <li
                key={item.chave}
                className="relative"
                onMouseEnter={() => item.filhos && abrir(item.chave)}
                onMouseLeave={fechar}
              >
                <Link
                  href={item.href}
                  aria-current={activo(item.href) ? "page" : undefined}
                  className={`relative flex h-16 items-center px-2.5 xl:px-3.5 font-ui text-base xl:text-[17px] transition-colors ${
                    activo(item.href) ? "text-white" : "text-ink-300 hover:text-white"
                  }`}
                >
                  {t(item.chave)}
                  {activo(item.href) && (
                    <span className="absolute inset-x-2.5 xl:inset-x-3.5 bottom-0 h-[3px] rounded-t-full bg-mb-red" aria-hidden />
                  )}
                </Link>

                {item.filhos && dropdown === item.chave && (
                  <div
                    className="absolute left-0 top-full pt-2"
                    onMouseEnter={() => abrir(item.chave)}
                    onMouseLeave={fechar}
                  >
                    <div className="w-72 rounded-2xl bg-ink-900 p-2 shadow-2xl shadow-black/60 ring-1 ring-white/5">
                      {item.filhos.map((f) => (
                        <Link
                          key={f.href}
                          href={f.href}
                          className="group block rounded-xl px-4 py-3 transition-colors hover:bg-ink-800"
                        >
                          <span className="flex items-center justify-between font-ui text-base text-white">
                            {t(f.chave)}
                            <Icon
                              name="arrow"
                              className="size-4 text-mb-red opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-400">{t(f.desc)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/bilhetes"
              className="hidden sm:inline-flex h-9 items-center gap-2 rounded-full bg-mb-red px-4 font-ui text-[15px] text-white hover:bg-mb-red-dark transition-colors"
            >
              <Icon name="ticket" className="size-4" />
              {t("nav.bilhetes")}
            </Link>
            <SelectorIdioma compacto />
            {utilizador ? (
              <div className="flex items-center gap-1">
                {equipa && (
                  <Link
                    href="/admin"
                    aria-label={t("admin.gestao")}
                    title={t("admin.gestao")}
                    className="hidden size-9 place-items-center rounded-full text-ink-300 transition-colors hover:bg-white/8 hover:text-white lg:grid xl:flex xl:size-auto xl:px-2"
                  >
                    {/* Até 1280px a barra não tem folga para o texto: fica só o ícone. */}
                    <Icon name="settings" className="size-4.5 xl:hidden" />
                    <span className="hidden font-ui text-[15px] xl:inline">{t("admin.gestao")}</span>
                  </Link>
                )}
                <Link
                  href="/conta"
                  className="grid size-9 place-items-center rounded-full font-display text-sm text-white ring-2 ring-white/10 transition-shadow hover:ring-white/40"
                  style={{ background: perfil?.avatarCor ?? "#e10600" }}
                  aria-label={t("auth.aMinhaConta")}
                  title={perfil?.nome ?? undefined}
                >
                  {(perfil?.nome ?? "?").slice(0, 1).toUpperCase()}
                </Link>
                <button
                  type="button"
                  onClick={() => void sair()}
                  aria-label={t("auth.sair")}
                  title={t("auth.sair")}
                  className="grid size-9 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/8 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link
                href="/entrar"
                className="inline-flex h-9 items-center rounded-full bg-white px-4 font-ui text-[15px] text-ink-950 transition-colors hover:bg-ink-200"
              >
                {t("auth.entrar")}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Menu móvel */}
      {aberto && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-ink-950 border-t border-ink-800">
          <ul className="px-5 py-3">
            {NAV.map((item) => (
              <li key={item.chave} className="border-b border-white/6 last:border-0">
                <Link
                  href={item.href}
                  aria-current={activo(item.href) ? "page" : undefined}
                  className={`flex items-center justify-between py-4 font-ui text-2xl ${
                    activo(item.href) ? "text-mb-red" : "text-white"
                  }`}
                >
                  {t(item.chave)}
                  <Icon name="arrow" className="size-5 text-ink-600" />
                </Link>
                {item.filhos && item.filhos.length > 1 && (
                  <ul className="-mt-1 flex flex-wrap gap-x-5 gap-y-1 pb-4">
                    {item.filhos.slice(1).map((f) => (
                      <li key={f.href}>
                        <Link href={f.href} className="text-[15px] text-ink-400 hover:text-white">
                          {t(f.chave)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-3 px-5 pt-2 pb-5">
            <Link
              href="/bilhetes"
              className="flex-1 h-12 grid place-items-center rounded-full bg-mb-red font-ui text-base text-white"
            >
              {t("menu.comprarBilhetes")}
            </Link>
            <Link
              href="/conta"
              className="flex-1 h-12 grid place-items-center rounded-full bg-white font-ui text-base text-ink-950"
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
                className="grid size-11 place-items-center rounded-full bg-ink-800 text-ink-300 transition-colors hover:bg-ink-700 hover:text-white"
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
