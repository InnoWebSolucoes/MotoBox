"use client";

/* ============================================================
   MOTOBOX ADMIN — Biblioteca de interface
   Blocos reutilizáveis por todas as páginas de gestão:
   tabelas, formulários, painéis laterais, diálogos e avisos.
   ============================================================ */

import {
  useEffect, useId, useMemo, useRef, useState,
  type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes,
} from "react";

/* ---------------- Cartão / Painel ---------------- */

export function Painel({
  titulo, descricao, accoes, children, className = "",
}: {
  titulo?: string; descricao?: string; accoes?: ReactNode;
  children: ReactNode; className?: string;
}) {
  return (
    <section className={`border border-ink-700/60 bg-ink-900 ${className}`}>
      {(titulo || accoes) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700/60 px-4 py-3">
          <div>
            {titulo && <h2 className="font-display text-sm uppercase tracking-wider text-white">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-xs text-ink-400">{descricao}</p>}
          </div>
          {accoes && <div className="flex flex-wrap items-center gap-2">{accoes}</div>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ---------------- Cabeçalho de página ---------------- */

export function CabecalhoPagina({
  titulo, descricao, accoes,
}: { titulo: string; descricao?: string; accoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-tight text-white sm:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-2xl text-sm text-ink-400">{descricao}</p>}
      </div>
      {accoes && <div className="flex flex-wrap items-center gap-2">{accoes}</div>}
    </div>
  );
}

/* ---------------- Estatística ---------------- */

export function Estatistica({
  rotulo, valor, sufixo, variacao, tom = "neutral", icone,
}: {
  rotulo: string; valor: string | number; sufixo?: string;
  variacao?: string; tom?: "neutral" | "red" | "ok" | "gold"; icone?: ReactNode;
}) {
  const tons = {
    neutral: "text-white",
    red: "text-mb-red",
    ok: "text-ok",
    gold: "text-gold",
  } as const;
  return (
    <div className="border border-ink-700/60 bg-ink-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-display uppercase tracking-widest text-ink-400">{rotulo}</p>
        {icone && <span className="text-ink-500">{icone}</span>}
      </div>
      <p className={`mt-2 font-display text-2xl tabular-nums ${tons[tom]}`}>
        {valor}
        {sufixo && <span className="ml-1 text-sm text-ink-400">{sufixo}</span>}
      </p>
      {variacao && <p className="mt-1 text-[11px] text-ink-400">{variacao}</p>}
    </div>
  );
}

/* ---------------- Campos de formulário ---------------- */

export function Campo({
  etiqueta, ajuda, obrigatorio, children, className = "",
}: {
  etiqueta: string; ajuda?: string; obrigatorio?: boolean;
  children: ReactNode; className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-display uppercase tracking-widest text-ink-300">
        {etiqueta}
        {obrigatorio && <span className="ml-1 text-mb-red">*</span>}
      </span>
      {children}
      {ajuda && <span className="mt-1 block text-[11px] text-ink-500">{ajuda}</span>}
    </label>
  );
}

const inputBase =
  "w-full border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-white placeholder:text-ink-600 " +
  "outline-none transition-colors focus:border-mb-red disabled:opacity-50";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${inputBase} ${className}`} {...rest} />;
}

export function Area(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", rows = 4, ...rest } = props;
  return <textarea rows={rows} className={`${inputBase} resize-y ${className}`} {...rest} />;
}

export function Seleccao({
  valor, onChange, opcoes, className = "", ...rest
}: {
  valor: string; onChange: (v: string) => void;
  opcoes: { valor: string; nome: string }[]; className?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} ${className}`}
      {...rest}
    >
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor} className="bg-ink-900">{o.nome}</option>
      ))}
    </select>
  );
}

/** Interruptor booleano */
export function Interruptor({
  activo, onChange, etiqueta, descricao, disabled,
}: {
  activo: boolean; onChange: (v: boolean) => void;
  etiqueta: string; descricao?: string; disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border border-ink-700/60 bg-ink-950 px-3 py-3">
      <div className="min-w-0">
        <p className="text-sm text-white">{etiqueta}</p>
        {descricao && <p className="mt-0.5 text-xs text-ink-400">{descricao}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={etiqueta}
        disabled={disabled}
        onClick={() => onChange(!activo)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
          activo ? "bg-ok" : "bg-ink-700"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
            activo ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/* ---------------- Etiqueta de estado ---------------- */

const TONS_ESTADO: Record<string, string> = {
  ativo: "bg-ok/15 text-ok border-ok/30",
  pago: "bg-ok/15 text-ok border-ok/30",
  aprovado: "bg-ok/15 text-ok border-ok/30",
  publicado: "bg-ok/15 text-ok border-ok/30",
  concluido: "bg-ok/15 text-ok border-ok/30",
  usado: "bg-ink-700/40 text-ink-300 border-ink-600",
  pendente: "bg-gold/15 text-gold border-gold/30",
  rascunho: "bg-ink-700/40 text-ink-300 border-ink-600",
  suspenso: "bg-gold/15 text-gold border-gold/30",
  agendado: "bg-ink-700/40 text-ink-300 border-ink-600",
  "bilhetes-abertos": "bg-mb-red/15 text-mb-red border-mb-red/30",
  "a-decorrer": "bg-live/15 text-live border-live/30",
  esgotado: "bg-ink-700/40 text-ink-400 border-ink-600",
  banido: "bg-mb-red/15 text-mb-red border-mb-red/30",
  cancelado: "bg-mb-red/15 text-mb-red border-mb-red/30",
  rejeitado: "bg-mb-red/15 text-mb-red border-mb-red/30",
  reembolsado: "bg-ink-700/40 text-ink-300 border-ink-600",
};

export function Estado({ valor }: { valor: string }) {
  const tom = TONS_ESTADO[valor] ?? "bg-ink-700/40 text-ink-300 border-ink-600";
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-display uppercase tracking-widest ${tom}`}>
      {valor.replace(/-/g, " ")}
    </span>
  );
}

/* ---------------- Barra de ferramentas ---------------- */

export function Ferramentas({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}

export function Procura({
  valor, onChange, placeholder = "Procurar…",
}: { valor: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${inputBase} pl-9`}
      />
    </div>
  );
}

/* ---------------- Tabela ---------------- */

export function Tabela({ cabecalhos, children, vazio }: {
  cabecalhos: string[]; children: ReactNode; vazio?: boolean;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink-700">
            {cabecalhos.map((h) => (
              <th key={h} className="px-3 py-2 text-left text-[10px] font-display uppercase tracking-widest text-ink-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {vazio && (
        <p className="py-10 text-center text-sm text-ink-500">Nenhum registo corresponde aos filtros.</p>
      )}
    </div>
  );
}

export function Linha({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-ink-800 transition-colors hover:bg-ink-850 ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </tr>
  );
}

export function Cel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}

/* ---------------- Botões de ação de linha ---------------- */

export function AccaoIcone({
  titulo, onClick, tom = "neutral", children,
}: {
  titulo: string; onClick: () => void;
  tom?: "neutral" | "perigo" | "ok"; children: ReactNode;
}) {
  const tons = {
    neutral: "text-ink-400 hover:text-white hover:bg-ink-700",
    perigo: "text-ink-400 hover:text-white hover:bg-mb-red",
    ok: "text-ink-400 hover:text-white hover:bg-ok",
  } as const;
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`inline-flex size-8 items-center justify-center border border-ink-700 transition-colors ${tons[tom]}`}
    >
      {children}
    </button>
  );
}

/* ---------------- Painel lateral (formulários) ---------------- */

export function Gaveta({
  aberta, aoFechar, titulo, descricao, children, rodape, largura = "max-w-2xl",
}: {
  aberta: boolean; aoFechar: () => void; titulo: string; descricao?: string;
  children: ReactNode; rodape?: ReactNode; largura?: string;
}) {
  useEffect(() => {
    if (!aberta) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [aberta, aoFechar]);

  if (!aberta) return null;

  return (
    <div className="fixed inset-0 z-100 flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={aoFechar} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`relative flex h-full w-full ${largura} flex-col border-l border-ink-700 bg-ink-900 shadow-2xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-700 px-5 py-4">
          <div>
            <h2 className="font-display text-lg uppercase tracking-tight text-white">{titulo}</h2>
            {descricao && <p className="mt-0.5 text-xs text-ink-400">{descricao}</p>}
          </div>
          <button
            type="button" onClick={aoFechar} aria-label="Fechar"
            className="shrink-0 border border-ink-700 p-1.5 text-ink-400 transition-colors hover:border-mb-red hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {rodape && (
          <footer className="flex items-center justify-end gap-2 border-t border-ink-700 px-5 py-4">{rodape}</footer>
        )}
      </div>
    </div>
  );
}

/* ---------------- Confirmação ---------------- */

export function Confirmar({
  aberta, aoFechar, aoConfirmar, titulo, mensagem, textoConfirmar = "Confirmar", perigo,
}: {
  aberta: boolean; aoFechar: () => void; aoConfirmar: () => void;
  titulo: string; mensagem: string; textoConfirmar?: string; perigo?: boolean;
}) {
  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75" onClick={aoFechar} aria-hidden />
      <div role="alertdialog" aria-modal="true" aria-label={titulo}
        className="relative w-full max-w-md border border-ink-700 bg-ink-900 p-5">
        <h2 className="font-display text-lg uppercase tracking-tight text-white">{titulo}</h2>
        <p className="mt-2 text-sm text-ink-300">{mensagem}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={aoFechar}
            className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-ink-800">
            Cancelar
          </button>
          <button type="button" onClick={() => { aoConfirmar(); aoFechar(); }}
            className={`h-10 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors ${
              perigo ? "bg-mb-red hover:bg-mb-red-dark" : "bg-ok hover:brightness-110"
            }`}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Aviso temporário ---------------- */

export function useAviso() {
  const [aviso, setAviso] = useState<{ texto: string; tom: "ok" | "erro" } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = (texto: string, tom: "ok" | "erro" = "ok") => {
    setAviso({ texto, tom });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAviso(null), 3200);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const elemento = aviso ? (
    <div
      role="status"
      className={`fixed bottom-5 left-1/2 z-100 -translate-x-1/2 border px-4 py-2.5 text-sm shadow-xl ${
        aviso.tom === "ok"
          ? "border-ok/40 bg-ok/15 text-ok"
          : "border-mb-red/40 bg-mb-red/15 text-mb-red"
      }`}
    >
      {aviso.texto}
    </div>
  ) : null;

  return { mostrar, elemento };
}

/* ---------------- Editor de lista de texto ---------------- */

export function ListaTexto({
  valores, onChange, etiqueta, placeholder = "Novo item",
}: {
  valores: string[]; onChange: (v: string[]) => void;
  etiqueta: string; placeholder?: string;
}) {
  const [novo, setNovo] = useState("");
  const id = useId();

  const adicionar = () => {
    const t = novo.trim();
    if (!t) return;
    onChange([...valores, t]);
    setNovo("");
  };

  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-display uppercase tracking-widest text-ink-300">{etiqueta}</span>
      <ul className="mb-2 space-y-1.5">
        {valores.map((v, i) => (
          <li key={`${id}-${i}`} className="flex items-center gap-2">
            <input
              value={v}
              onChange={(e) => onChange(valores.map((x, j) => (j === i ? e.target.value : x)))}
              className={inputBase}
              aria-label={`${etiqueta} ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => onChange(valores.filter((_, j) => j !== i))}
              aria-label="Remover"
              className="shrink-0 border border-ink-700 p-2 text-ink-400 transition-colors hover:border-mb-red hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } }}
          placeholder={placeholder}
          aria-label={placeholder}
          className={inputBase}
        />
        <button
          type="button" onClick={adicionar}
          className="shrink-0 border border-ink-600 px-3 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red hover:bg-mb-red/10"
        >
          Juntar
        </button>
      </div>
    </div>
  );
}

/* ---------------- Paginação ---------------- */

export function usePaginacao<T>(itens: T[], porPagina = 12) {
  const [pagina, setPagina] = useState(1);
  const total = Math.max(1, Math.ceil(itens.length / porPagina));
  const paginaSegura = Math.min(pagina, total);

  useEffect(() => { setPagina(1); }, [itens.length]);

  const fatia = useMemo(
    () => itens.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina),
    [itens, paginaSegura, porPagina],
  );

  const controlos = total > 1 ? (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-xs text-ink-500">
        Página {paginaSegura} de {total} · {itens.length} registos
      </p>
      <div className="flex gap-2">
        <button
          type="button" disabled={paginaSegura <= 1}
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          className="h-8 border border-ink-700 px-3 font-display text-[11px] uppercase tracking-wider text-white transition-colors hover:border-mb-red disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button" disabled={paginaSegura >= total}
          onClick={() => setPagina((p) => Math.min(total, p + 1))}
          className="h-8 border border-ink-700 px-3 font-display text-[11px] uppercase tracking-wider text-white transition-colors hover:border-mb-red disabled:opacity-40"
        >
          Seguinte
        </button>
      </div>
    </div>
  ) : null;

  return { fatia, controlos, total: itens.length };
}
