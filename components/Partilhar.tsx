"use client";

/* ============================================================
   MOTOBOX — Partilhar
   Botão que abre um menu para partilhar uma página: WhatsApp,
   Facebook, Instagram, X, Telegram, email, copiar a ligação e,
   no telemóvel, a folha de partilha do sistema.

   - O Instagram não tem ligação de partilha na web: copia-se a
     ligação e abre-se o Instagram (no telemóvel, a folha do
     sistema mostra o Instagram se estiver instalado), com o aviso
     "Ligação copiada: cole-a no Instagram".
   - Teclado: Enter/Espaço abre, setas e Home/End andam entre as
     opções, Escape fecha e devolve o foco ao botão, Tab fecha.
   - Num ecrã estreito abre como folha em baixo; num largo, como
     menu junto ao botão. Vive no <body> (portal), para não ser
     cortado pelos painéis com overflow escondido.

     <Partilhar caminho={`/marketplace/${id}`} titulo={titulo} texto={`${titulo} · ${preco}`} />
   ============================================================ */

import {
  useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore,
  type KeyboardEvent as TecladoReact, type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, Link2, Share2, X as Fechar } from "lucide-react";
import { Icon } from "@/components/ui";
import { urlPublica } from "@/lib/base";

type Rede = "whatsapp" | "facebook" | "instagram" | "x" | "telegram" | "email" | "copiar" | "sistema";

interface Opcao {
  rede: Rede;
  nome: string;
  /** Endereço a abrir (as opções sem ele fazem uma acção). */
  href?: string;
  icone: ReactNode;
  cor: string;
}

/* Logótipos que o conjunto de ícones do site não tem. */
function LogoX() {
  return (
    <svg viewBox="0 0 24 24" className="size-[15px]" aria-hidden fill="currentColor">
      <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
    </svg>
  );
}

function LogoTelegram() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="currentColor">
      <path d="M21.4 4.2 18.3 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.5-1 .5l.4-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2L6.6 13 2.1 11.6c-1-.3-1-1 .2-1.5l17.7-6.8c.8-.3 1.6.2 1.4 1Z" />
    </svg>
  );
}

/** Copia sem esperar (dentro do clique), para não falhar quando a seguir se abre outro separador. */
function copiarJa(texto: string): boolean {
  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

async function copiar(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch { /* sem permissão: tenta o outro caminho */ }
  return copiarJa(texto);
}

const eTelemovel = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 639px), (pointer: coarse)").matches;

/* No servidor não há navegador: sem portal e sem folha de partilha do sistema. */
const nenhum = () => () => {};
const temPartilhaNativa = () => typeof navigator.share === "function";

export function Partilhar({
  caminho, url: urlDada, titulo, texto, rotulo = "Partilhar", className = "", conteudo,
}: {
  /** Caminho da página no site (ex.: "/marketplace/abc"). O endereço completo junta o domínio e /motobox. */
  caminho?: string;
  /** Ou o endereço completo. Sem nenhum dos dois, partilha a página aberta. */
  url?: string;
  titulo: string;
  /** Texto que acompanha a ligação (WhatsApp, X, Telegram, email). Por omissão, o título. */
  texto?: string;
  rotulo?: string;
  /** Classes do botão (o aspecto do sítio onde vive). */
  className?: string;
  /** Conteúdo do botão, em vez do ícone e do rótulo. */
  conteudo?: ReactNode;
}) {
  const id = useId();
  const idMenu = `partilhar-${id.replace(/:/g, "")}`;
  const botao = useRef<HTMLButtonElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [folha, setFolha] = useState(false);
  const [posicao, setPosicao] = useState<{ top: number; left: number; acima: boolean } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Pedido para devolver o foco ao botão, depois de o menu fechar. */
  const [focar, setFocar] = useState(0);
  const montado = useSyncExternalStore(nenhum, () => true, () => false);
  const nativo = useSyncExternalStore(nenhum, temPartilhaNativa, () => false);

  const endereco = useCallback(() => {
    if (urlDada) return urlDada;
    if (caminho) return `${urlPublica()}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
    return window.location.href;
  }, [urlDada, caminho]);

  const frase = texto?.trim() || titulo;

  const opcoes = useCallback((): Opcao[] => {
    const u = endereco();
    const e = encodeURIComponent;
    const lista: Opcao[] = [
      { rede: "whatsapp", nome: "WhatsApp", href: `https://wa.me/?text=${e(`${frase}\n${u}`)}`, icone: <Icon name="whatsapp" className="size-[18px]" />, cor: "bg-[#25d366] text-white" },
      { rede: "facebook", nome: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${e(u)}`, icone: <Icon name="facebook" className="size-[18px]" />, cor: "bg-[#1877f2] text-white" },
      { rede: "instagram", nome: "Instagram", icone: <Icon name="instagram" className="size-4" />, cor: "bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white" },
      { rede: "x", nome: "X (Twitter)", href: `https://x.com/intent/tweet?text=${e(frase)}&url=${e(u)}`, icone: <LogoX />, cor: "bg-black text-white ring-1 ring-inset ring-white/20" },
      { rede: "telegram", nome: "Telegram", href: `https://t.me/share/url?url=${e(u)}&text=${e(frase)}`, icone: <LogoTelegram />, cor: "bg-[#229ed9] text-white" },
      { rede: "email", nome: "Email", href: `mailto:?subject=${e(titulo)}&body=${e(`${frase}\n\n${u}`)}`, icone: <Icon name="mail" className="size-4" />, cor: "bg-white/12 text-white" },
      { rede: "copiar", nome: "Copiar ligação", icone: <Link2 className="size-4" aria-hidden />, cor: "bg-white/12 text-white" },
    ];
    if (nativo) lista.push({ rede: "sistema", nome: "Mais aplicações…", icone: <Share2 className="size-4" aria-hidden />, cor: "bg-white/12 text-white" });
    return lista;
  }, [endereco, frase, titulo, nativo]);

  /* ---------- Abrir, fechar e posição ---------- */

  const calcular = useCallback(() => {
    const b = botao.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const largura = 288;
    const altura = caixa.current?.offsetHeight ?? 420;
    const margem = 8;
    const left = Math.min(Math.max(margem, r.right - largura), window.innerWidth - largura - margem);
    const cabeAbaixo = r.bottom + margem + altura <= window.innerHeight;
    const acima = !cabeAbaixo && r.top - margem - altura >= 0;
    setPosicao({ top: acima ? r.top - margem - altura : r.bottom + margem, left, acima });
  }, []);

  const fechar = useCallback((devolverFoco = true) => {
    setAberto(false);
    setPosicao(null);
    setAviso(null);
    setCopiado(false);
    if (devolverFoco) setFocar((n) => n + 1);
  }, []);

  useEffect(() => {
    if (focar) botao.current?.focus();
  }, [focar]);

  const abrir = () => {
    setFolha(eTelemovel());
    setAberto(true);
  };

  // O menu nasce invisível para ser medido: a posição fica certa antes de
  // pintar (sem saltos), e o foco vai para a primeira opção.
  useLayoutEffect(() => {
    if (!aberto || !montado) return;
    if (!folha) calcular();
    const primeiro = menu.current?.querySelector<HTMLElement>("[role=menuitem]");
    primeiro?.focus({ preventScroll: true });
  }, [aberto, folha, montado, calcular]);

  // O aviso ("Ligação copiada…") faz o menu crescer: volta a caber no ecrã.
  useLayoutEffect(() => {
    if (aberto && !folha && aviso) calcular();
  }, [aviso, aberto, folha, calcular]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (caixa.current?.contains(alvo) || botao.current?.contains(alvo)) return;
      fechar(false);
    };
    const mexer = () => { if (!folha) calcular(); };
    document.addEventListener("pointerdown", fora);
    window.addEventListener("resize", mexer);
    window.addEventListener("scroll", mexer, true);
    return () => {
      document.removeEventListener("pointerdown", fora);
      window.removeEventListener("resize", mexer);
      window.removeEventListener("scroll", mexer, true);
    };
  }, [aberto, folha, calcular, fechar]);

  // O "Copiado" volta ao normal ao fim de uns segundos.
  useEffect(() => {
    if (!copiado) return;
    const t = window.setTimeout(() => setCopiado(false), 2500);
    return () => window.clearTimeout(t);
  }, [copiado]);

  /* ---------- Acções ---------- */

  async function partilharNoSistema(u: string) {
    try {
      await navigator.share({ title: titulo, text: frase, url: u });
      fechar();
    } catch (e) {
      // Fechar a folha sem escolher não é um erro.
      if ((e as DOMException)?.name !== "AbortError") setAviso("Não foi possível abrir a partilha do telemóvel. Copie a ligação.");
    }
  }

  async function escolher(o: Opcao) {
    const u = endereco();
    if (o.rede === "copiar") {
      const ok = await copiar(u);
      setCopiado(ok);
      setAviso(ok ? "Ligação copiada." : "Não foi possível copiar. Seleccione e copie o endereço da página.");
      return;
    }
    if (o.rede === "instagram") {
      // Copia já (dentro do clique) e só depois sai da página.
      const ok = copiarJa(u);
      setCopiado(ok);
      setAviso(ok ? "Ligação copiada: cole-a no Instagram." : "Abra o Instagram e cole a ligação da página.");
      if (nativo && eTelemovel()) {
        void partilharNoSistema(u);
      } else {
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      }
      return;
    }
    if (o.rede === "sistema") {
      void partilharNoSistema(u);
    }
  }

  /* ---------- Teclado ---------- */

  function teclado(e: TecladoReact<HTMLDivElement>) {
    const itens = Array.from(menu.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
    const i = itens.indexOf(document.activeElement as HTMLElement);
    const ir = (n: number) => { e.preventDefault(); itens[(n + itens.length) % itens.length]?.focus(); };
    switch (e.key) {
      case "ArrowDown": case "ArrowRight": ir(i + 1); break;
      case "ArrowUp": case "ArrowLeft": ir(i - 1); break;
      case "Home": ir(0); break;
      case "End": ir(itens.length - 1); break;
      case "Escape": e.preventDefault(); e.stopPropagation(); fechar(); break;
      case "Tab": e.preventDefault(); fechar(); break;
    }
  }

  /* ---------- Desenho ---------- */

  const item =
    "group flex w-full items-center gap-3 rounded-[var(--raio)] px-2.5 py-2 text-left text-[15px] text-white/90 outline-none transition-colors " +
    "hover:bg-white/8 hover:text-white focus-visible:bg-white/10 focus-visible:text-white focus-visible:ring-2 focus-visible:ring-mb-red";

  const lista = !aberto || !montado ? null : opcoes().map((o) => {
    const feito = o.rede === "copiar" && copiado;
    const corpo = (
      <>
        <span aria-hidden className={`grid size-8 shrink-0 place-items-center rounded-[var(--raio)] ${feito ? "bg-ok text-white" : o.cor}`}>
          {feito ? <Check className="size-4" /> : o.icone}
        </span>
        <span className="min-w-0 flex-1 truncate">{feito ? "Copiado" : o.nome}</span>
        {o.href && <span className="sr-only"> (abre noutra janela)</span>}
      </>
    );
    return o.href ? (
      <a
        key={o.rede}
        role="menuitem"
        href={o.href}
        target={o.rede === "email" ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={item}
        onClick={() => fechar()}
      >
        {corpo}
      </a>
    ) : (
      <button key={o.rede} type="button" role="menuitem" className={item} onClick={() => void escolher(o)}>
        {corpo}
      </button>
    );
  });

  const painel = aberto && montado ? createPortal(
    <>
      {folha && <div className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-sm" aria-hidden onClick={() => fechar(false)} />}
      <div
        ref={caixa}
        onKeyDown={teclado}
        className={
          folha
            ? "fixed inset-x-0 bottom-0 z-[96] max-h-[85vh] overflow-y-auto rounded-t-[14px] bg-near-black px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl ring-1 ring-white/10"
            : "fixed z-[96] w-72 rounded-[var(--raio)] bg-near-black/95 p-1.5 shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-xl"
        }
        // Antes de medir: transparente, mas não escondido (um elemento escondido não recebe o foco).
        style={folha ? undefined : posicao ? { top: posicao.top, left: posicao.left } : { top: 0, left: 0, opacity: 0, pointerEvents: "none" }}
      >
        {folha ? (
          <div className="mb-2 flex items-center justify-between gap-3 px-2.5">
            <div className="min-w-0">
              <p className="text-base font-semibold text-white">{rotulo}</p>
              <p className="truncate text-xs text-white/55">{titulo}</p>
            </div>
            <button
              type="button"
              onClick={() => fechar()}
              aria-label="Fechar"
              className="grid size-9 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Fechar className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <p className="px-2.5 pb-1 pt-1.5 text-xs text-white/50" aria-hidden>{rotulo}</p>
        )}
        <div ref={menu} id={idMenu} role="menu" aria-label={`${rotulo}: ${titulo}`} className="grid gap-0.5">
          {lista}
        </div>
        <p
          role="status"
          aria-live="polite"
          className={aviso ? "mx-1 mt-1.5 rounded-[var(--raio)] bg-ok/15 px-2.5 py-2 text-[13px] leading-snug text-[#4ade80]" : "sr-only"}
        >
          {aviso ?? ""}
        </p>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={botao}
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idMenu : undefined}
        onClick={() => (aberto ? fechar(false) : abrir())}
        onKeyDown={(e) => {
          if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !aberto) { e.preventDefault(); abrir(); }
        }}
        className={className}
      >
        {conteudo ?? (
          <>
            <Icon name="share" className="size-4" />
            {rotulo}
          </>
        )}
      </button>
      {painel}
    </>
  );
}
