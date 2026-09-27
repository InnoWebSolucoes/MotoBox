"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoLink } from "./Brand";
import { Icon } from "./ui";
import { useIdioma } from "@/lib/i18n/contexto";
import { useAuth } from "@/lib/auth/contexto";
import { SelectorIdioma } from "./SelectorIdioma";
import type { LigacaoRede } from "@/lib/redes";
import { MODALIDADES, MODALIDADE_PRINCIPAL, ROTAS_DESPORTO, SECCOES_MOTOCROSS } from "@/lib/desporto";

/** `chave` passa por t(); `nome` é um nome próprio que fica igual nas duas línguas. */
type Filho = { href: string; chave?: string; nome?: string; desc?: string };

type NavItem = {
  href: string;
  chave: string;
  /** Rotas que também acendem o item (subpáginas que vivem noutra URL). */
  activoEm?: string[];
  /** No menu móvel, o primeiro filho repete o próprio item e fica de fora. */
  filhos?: Filho[];
  /** Desporto abre um painel largo com as modalidades, em vez da lista simples. */
  mega?: boolean;
};

/** Modalidades já com provas, fora a principal (que tem bloco próprio no painel). */
const OUTRAS_MODALIDADES = MODALIDADES.filter(
  (m) => m.estado === "activo" && m.slug !== MODALIDADE_PRINCIPAL,
);
const DESC_MODALIDADE: Record<string, string> = { enduro: "menu.enduroDesc", rally: "menu.rallyDesc" };
/** Modalidades anunciadas; o nome em lib/desporto.ts está em português, aqui passa pelo dicionário. */
const EM_BREVE = MODALIDADES.filter((m) => m.estado === "em-breve");
const CHAVE_MODALIDADE: Record<string, string> = {
  velocidade: "desporto.velocidade",
  "moto-4": "desporto.moto4",
  "motos-de-agua": "desporto.motosDeAgua",
  automobilismo: "desporto.automobilismo",
};

const NAV: NavItem[] = [
  {
    href: "/sobre",
    chave: "marca.motobox",
    activoEm: ["/sobre", "/seguranca", "/patrocinadores", "/contacto"],
    filhos: [
      { href: "/sobre", chave: "menu.sobreNos", desc: "menu.sobreDesc" },
      { href: "/seguranca", chave: "nav.seguranca", desc: "menu.segurancaDesc" },
      { href: "/patrocinadores", chave: "nav.patrocinadores", desc: "menu.patrocinadoresDesc" },
      { href: "/contacto", chave: "nav.contacto", desc: "menu.contactoDesc" },
    ],
  },
  {
    href: "/noticias",
    chave: "nav.noticias",
    activoEm: ["/noticias", "/videos"],
    filhos: [
      { href: "/noticias", chave: "menu.todasNoticias", desc: "menu.noticiasDesc" },
      { href: "/noticias?cat=Internacional", chave: "menu.internacional", desc: "menu.internacionalDesc" },
      { href: "/videos", chave: "nav.videos", desc: "menu.videosDesc" },
    ],
  },
  {
    href: "/desporto",
    chave: "nav.desporto",
    activoEm: ROTAS_DESPORTO,
    mega: true,
    filhos: [
      { href: "/desporto", chave: "menu.todosDesportos" },
      { href: `/desporto/${MODALIDADE_PRINCIPAL}`, nome: "Motocross" },
      ...SECCOES_MOTOCROSS.slice(1),
      ...OUTRAS_MODALIDADES.map((m) => ({ href: `/desporto/${m.slug}`, nome: m.nome })),
    ],
  },
  { href: "/eventos", chave: "nav.eventos" },
  {
    href: "/clubes",
    chave: "nav.clubes",
    filhos: [
      { href: "/clubes", chave: "menu.todosClubes", desc: "menu.todosClubesDesc" },
      { href: "/clubes?tipo=lady-riders", chave: "menu.ladyRiders", desc: "menu.ladyRidersDesc" },
      { href: "/clubes/rotas", chave: "menu.rotas", desc: "menu.rotasDesc" },
    ],
  },
  {
    href: "/marketplace",
    chave: "nav.marketplace",
    filhos: [
      { href: "/marketplace", chave: "menu.anuncios", desc: "menu.anunciosDesc" },
      { href: "/marketplace/importar", chave: "menu.importar", desc: "menu.importarDesc" },
    ],
  },
  { href: "/forum", chave: "nav.forum" },
];

/** Seta pequena do item Motobox: o único acento vermelho fixo da barra. */
function Seta({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Nav({ redes = [] }: { redes?: LigacaoRede[] }) {
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

  const emRota = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const activo = (item: NavItem) => (item.activoEm ?? [item.href]).some(emRota);
  const rotulo = (f: Filho) => f.nome ?? t(f.chave ?? "");

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

          <ul className="ml-1 xl:ml-4 hidden lg:flex items-center">
            {NAV.map((item, i) => {
              const aceso = activo(item);
              // O primeiro item (Motobox) destaca-se: letra um pouco maior, sempre branca,
              // seta vermelha e um traço fino a separá-lo das secções.
              const marca = i === 0;
              return (
                <li
                  key={item.chave}
                  className={`relative flex items-center ${marca ? "mr-1 xl:mr-2" : ""}`}
                  onMouseEnter={() => item.filhos && abrir(item.chave)}
                  onMouseLeave={fechar}
                  onFocus={() => item.filhos && abrir(item.chave)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) fechar();
                  }}
                >
                  <Link
                    href={item.href}
                    aria-current={aceso ? "page" : undefined}
                    className={`relative flex h-16 items-center transition-colors ${
                      marca
                        ? "gap-1 px-2.5 xl:px-3.5 font-display text-[18px] xl:text-[19px] text-white"
                        : `px-2 xl:px-3.5 font-ui text-base xl:text-[17px] ${aceso ? "text-white" : "text-ink-300 hover:text-white"}`
                    }`}
                  >
                    {t(item.chave)}
                    {marca && (
                      <Seta
                        className={`size-3.5 text-mb-red transition-transform ${dropdown === item.chave ? "rotate-180" : ""}`}
                      />
                    )}
                    {aceso && (
                      <span
                        className={`absolute bottom-0 h-[3px] rounded-t-full bg-mb-red ${
                          marca ? "inset-x-2.5 xl:inset-x-3.5" : "inset-x-2 xl:inset-x-3.5"
                        }`}
                        aria-hidden
                      />
                    )}
                  </Link>
                  {marca && <span className="ml-1 xl:ml-2 h-5 w-px bg-white/15" aria-hidden />}

                  {item.filhos && dropdown === item.chave && (
                    <div
                      className="absolute left-0 top-full pt-2"
                      onMouseEnter={() => abrir(item.chave)}
                      onMouseLeave={fechar}
                    >
                      {item.mega ? (
                        <PainelDesporto />
                      ) : (
                        <div className="w-72 rounded-2xl bg-ink-900 p-2 shadow-2xl shadow-black/60 ring-1 ring-white/5">
                          {item.filhos.map((f) => (
                            <Link
                              key={f.href}
                              href={f.href}
                              className="group block rounded-xl px-4 py-3 transition-colors hover:bg-ink-800"
                            >
                              <span className="flex items-center justify-between font-ui text-base text-white">
                                {rotulo(f)}
                                <Icon
                                  name="arrow"
                                  className="size-4 text-mb-red opacity-0 transition-opacity group-hover:opacity-100"
                                />
                              </span>
                              {f.desc && <span className="mt-0.5 block text-xs text-ink-400">{t(f.desc)}</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
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
                  className="grid size-9 place-items-center overflow-hidden rounded-full font-display text-sm text-white ring-2 ring-white/10 transition-shadow hover:ring-white/40"
                  style={{ background: perfil?.avatarCor ?? "#e10600" }}
                  aria-label={t("auth.aMinhaConta")}
                  title={perfil?.nome ?? undefined}
                >
                  {perfil?.avatarUrl ? (
                    // A imagem já vem reduzida do envio (máx. 512 px); a cor fica por trás de um PNG transparente.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={perfil.avatarUrl} alt="" className="size-full object-cover" decoding="async" />
                  ) : (
                    (perfil?.nome ?? "?").slice(0, 1).toUpperCase()
                  )}
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
            {NAV.map((item, i) => (
              <li key={item.chave} className="border-b border-white/6 last:border-0">
                <Link
                  href={item.href}
                  aria-current={activo(item) ? "page" : undefined}
                  className={`flex items-center justify-between py-4 ${
                    i === 0 ? "font-display text-[28px]" : "font-ui text-2xl"
                  } ${activo(item) ? "text-mb-red" : "text-white"}`}
                >
                  <span className="flex items-center gap-2">
                    {t(item.chave)}
                    {i === 0 && <span className="size-2 rounded-full bg-mb-red" aria-hidden />}
                  </span>
                  <Icon name="arrow" className="size-5 text-ink-600" />
                </Link>
                {item.filhos && item.filhos.length > 1 && (
                  <ul className="-mt-1 flex flex-wrap gap-x-5 gap-y-1.5 pb-4">
                    {item.filhos.slice(1).map((f) => (
                      <li key={f.href}>
                        <Link
                          href={f.href}
                          className={`hover:text-white ${f.nome ? "font-ui text-base text-ink-100" : "text-[15px] text-ink-400"}`}
                        >
                          {rotulo(f)}
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
              {t("menu.minhaConta")}
            </Link>
          </div>
          <div className="flex gap-2 px-5 pb-10">
            {redes.map((r) => (
              <a
                key={r.rede}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-11 place-items-center rounded-full bg-ink-800 text-ink-300 transition-colors hover:bg-ink-700 hover:text-white"
                aria-label={r.nome}
              >
                <Icon name={r.rede} className="size-5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Painel de Desporto: o Motocross à esquerda com as suas secções (é onde vive
 * todo o campeonato), as outras modalidades à direita e a ligação para todas.
 */
function PainelDesporto() {
  const { t } = useIdioma();
  return (
    <div className="grid w-[34rem] grid-cols-[1.1fr_1fr] gap-1 rounded-2xl bg-ink-900 p-2 shadow-2xl shadow-black/60 ring-1 ring-white/5">
      <div className="rounded-xl bg-ink-950/60 px-4 pt-4 pb-2">
        <Link href={`/desporto/${MODALIDADE_PRINCIPAL}`} className="group block">
          <span className="eyebrow block text-mb-red">{t("menu.motocrossDesc")}</span>
          <span className="mt-1 flex items-center justify-between font-display text-2xl uppercase leading-none text-white transition-colors group-hover:text-mb-red">
            Motocross
            <Icon name="arrow" className="size-4 text-mb-red" />
          </span>
        </Link>
        <ul className="mt-3">
          {SECCOES_MOTOCROSS.slice(1).map((s) => (
            <li key={s.href} className="border-t border-white/6">
              <Link href={s.href} className="block py-2 font-ui text-[15px] text-ink-300 transition-colors hover:text-white">
                {t(s.chave)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col">
        {OUTRAS_MODALIDADES.map((m) => (
          <Link
            key={m.slug}
            href={`/desporto/${m.slug}`}
            className="group block rounded-xl px-4 py-3 transition-colors hover:bg-ink-800"
          >
            <span className="flex items-center justify-between font-ui text-base text-white">
              {m.nome}
              <Icon name="arrow" className="size-4 text-mb-red opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            {DESC_MODALIDADE[m.slug] && (
              <span className="mt-0.5 block text-xs text-ink-400">{t(DESC_MODALIDADE[m.slug])}</span>
            )}
          </Link>
        ))}
        {/* O que vem a seguir: a Motobox é sobre tudo o que tem motor, não só corridas. */}
        <div className="mx-4 mt-2 border-t border-white/6 pt-3">
          <p className="eyebrow text-ink-500">{t("menu.emBreve")}</p>
          <ul className="mt-2 space-y-1">
            {EM_BREVE.map((m) => (
              <li key={m.slug} className="text-[13px] text-ink-400">
                {CHAVE_MODALIDADE[m.slug] ? t(CHAVE_MODALIDADE[m.slug]) : m.nome}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/desporto"
          className="group mt-auto block rounded-xl px-4 py-3 transition-colors hover:bg-ink-800"
        >
          <span className="flex items-center gap-2 font-ui text-base text-white">
            {t("menu.todosDesportos")}
            <Icon name="arrow" className="size-4 text-mb-red transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </div>
  );
}
