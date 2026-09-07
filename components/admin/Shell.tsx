"use client";

/* ============================================================
   MOTOBOX ADMIN — Estrutura da área de gestão
   Barra lateral com navegação agrupada, cabeçalho com procura
   global e indicadores, e área de conteúdo.
   ============================================================ */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAdmin } from "@/lib/admin/store";

interface ItemNav {
  href: string;
  nome: string;
  icone: string;
  /** Nome do contador no estado, para o crachá */
  contador?: "mensagens" | "denuncias" | "encomendas" | "moderacao";
}

interface GrupoNav {
  grupo: string;
  itens: ItemNav[];
}

export const NAVEGACAO: GrupoNav[] = [
  {
    grupo: "Visão geral",
    itens: [
      { href: "/admin", nome: "Painel", icone: "grid" },
      { href: "/admin/atividade", nome: "Atividade", icone: "clock" },
    ],
  },
  {
    grupo: "Desporto",
    itens: [
      { href: "/admin/eventos", nome: "Eventos", icone: "calendar" },
      { href: "/admin/corridas", nome: "Resultados", icone: "flag" },
      { href: "/admin/pilotos", nome: "Pilotos", icone: "user" },
      { href: "/admin/equipas", nome: "Equipas", icone: "shield" },
    ],
  },
  {
    grupo: "Conteúdo",
    itens: [
      { href: "/admin/noticias", nome: "Notícias", icone: "news" },
      { href: "/admin/videos", nome: "Vídeos", icone: "play" },
      { href: "/admin/paginas", nome: "Páginas legais", icone: "doc" },
    ],
  },
  {
    grupo: "Comercial",
    itens: [
      { href: "/admin/bilheteira", nome: "Bilheteira", icone: "ticket" },
      { href: "/admin/encomendas", nome: "Encomendas", icone: "cart", contador: "encomendas" },
      { href: "/admin/patrocinadores", nome: "Patrocinadores", icone: "star" },
    ],
  },
  {
    grupo: "Comunidade",
    itens: [
      { href: "/admin/marketplace", nome: "Marketplace", icone: "tag" },
      { href: "/admin/forum", nome: "Fórum", icone: "chat" },
      { href: "/admin/moderacao", nome: "Moderação", icone: "alert", contador: "denuncias" },
    ],
  },
  {
    grupo: "Pessoas",
    itens: [
      { href: "/admin/utilizadores", nome: "Utilizadores", icone: "users" },
      { href: "/admin/mensagens", nome: "Mensagens", icone: "mail", contador: "mensagens" },
      { href: "/admin/newsletter", nome: "Newsletter", icone: "send" },
    ],
  },
  {
    grupo: "Sistema",
    itens: [
      { href: "/admin/definicoes", nome: "Definições", icone: "cog" },
      { href: "/admin/dados", nome: "Dados", icone: "database" },
    ],
  },
];

const CAMINHOS: Record<string, string> = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  news: "M4 4h13a2 2 0 0 1 2 2v13a2 2 0 0 0 2-2V8M4 4v14a2 2 0 0 0 2 2h13M8 8h7M8 12h7M8 16h4",
  play: "m10 8 6 4-6 4V8ZM3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6",
  ticket: "M3 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zM13 5v14",
  cart: "M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM19 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L23 6H6",
  star: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  tag: "M20.6 13.4 12 22l-9-9V3h10zM7.5 7.5h.01",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 2-10 7L2 6",
  send: "m22 2-7 20-4-9-9-4z",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z",
  database: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3ZM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M18 6 6 18M6 6l12 12",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
};

export function IconeNav({ nome, className = "size-4" }: { nome: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={CAMINHOS[nome] ?? CAMINHOS.grid} />
    </svg>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  const { estado, pronto } = useAdmin();
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu móvel ao mudar de página
  useEffect(() => { setMenuAberto(false); }, [caminho]);

  const contadores = {
    mensagens: estado.mensagens.filter((m) => !m.lida && !m.arquivada).length,
    denuncias: estado.denuncias.filter((d) => d.estado === "pendente").length,
    encomendas: estado.encomendas.filter((e) => e.estado === "pendente").length,
    moderacao: estado.denuncias.filter((d) => d.estado === "pendente").length,
  };

  const activo = (href: string) =>
    href === "/admin" ? caminho === "/admin" : caminho.startsWith(href);

  const lateral = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-700/60 px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center bg-mb-red font-display text-sm text-white">M</span>
          <span>
            <span className="block font-display text-sm uppercase leading-none tracking-tight text-white">Motobox</span>
            <span className="block text-[10px] uppercase tracking-widest text-ink-500">Gestão</span>
          </span>
        </Link>
        <button
          type="button" onClick={() => setMenuAberto(false)}
          aria-label="Fechar menu"
          className="border border-ink-700 p-1.5 text-ink-400 lg:hidden"
        >
          <IconeNav nome="close" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {NAVEGACAO.map((g) => (
          <div key={g.grupo} className="mb-4">
            <p className="px-4 pb-1.5 text-[10px] font-display uppercase tracking-widest text-ink-600">
              {g.grupo}
            </p>
            <ul>
              {g.itens.map((it) => {
                const n = it.contador ? contadores[it.contador] : 0;
                const sel = activo(it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={sel ? "page" : undefined}
                      className={`flex items-center gap-3 border-l-2 px-4 py-2 text-sm transition-colors ${
                        sel
                          ? "border-mb-red bg-mb-red/10 text-white"
                          : "border-transparent text-ink-300 hover:border-ink-600 hover:bg-ink-850 hover:text-white"
                      }`}
                    >
                      <IconeNav nome={it.icone} />
                      <span className="flex-1">{it.nome}</span>
                      {pronto && n > 0 && (
                        <span className="grid min-w-5 place-items-center bg-mb-red px-1.5 py-0.5 text-[10px] font-display text-white">
                          {n}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-700/60 p-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-1 py-1.5 text-xs text-ink-400 transition-colors hover:text-white"
        >
          <IconeNav nome="external" className="size-3.5" />
          Ver o site público
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Barra lateral fixa em ecrãs grandes */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-ink-700/60 bg-ink-900 lg:block">
        {lateral}
      </aside>

      {/* Barra lateral deslizante em telemóvel */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMenuAberto(false)} aria-hidden />
          <aside className="relative h-full w-72 border-r border-ink-700 bg-ink-900">{lateral}</aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-700/60 bg-ink-950/95 px-4 py-3 backdrop-blur">
          <button
            type="button" onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            className="border border-ink-700 p-2 text-ink-300 transition-colors hover:text-white lg:hidden"
          >
            <IconeNav nome="menu" />
          </button>

          <p className="flex-1 truncate font-display text-xs uppercase tracking-widest text-ink-500">
            {estado.definicoes.nomeSite} · Temporada {estado.definicoes.temporada}
          </p>

          {estado.definicoes.manutencao && (
            <span className="hidden border border-gold/40 bg-gold/15 px-2 py-1 text-[10px] font-display uppercase tracking-widest text-gold sm:inline">
              Manutenção activa
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center bg-mb-red font-display text-xs text-white">GB</span>
            <span className="hidden text-xs leading-tight sm:block">
              <span className="block text-white">Gonçalo Bessa</span>
              <span className="block text-ink-500">Administrador</span>
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
