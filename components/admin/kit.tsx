"use client";

/* ============================================================
   MOTOBOX ADMIN — Biblioteca de interface
   Os blocos de todas as páginas de gestão, no desenho do site:
   painéis de carvão translúcidos com cantos de 6px, quadrados
   de ícone vermelhos, letra do site em caixa normal, campos
   escuros com contorno subtil e o vermelho da marca só onde
   há acção.
   ============================================================ */

import Link from "next/link";
import {
  useEffect, useId, useMemo, useRef, useState,
  type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes,
} from "react";

/* ---------------- Classes partilhadas ---------------- */

/** Campo de texto, selecção e área: escuro, cantos do painel, contorno vermelho ao focar. */
export const CLASSE_CAMPO =
  "w-full rounded-[var(--raio)] border border-white/10 bg-black/25 px-3 py-2.5 text-[15px] text-white " +
  "placeholder:text-white/35 outline-none transition-colors focus:border-mb-red focus:bg-black/35 disabled:opacity-50";

const BOTAO_BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--raio)] text-sm font-medium " +
  "transition-colors disabled:pointer-events-none disabled:opacity-45";

const VARIANTES = {
  primario: "bg-mb-red text-white hover:bg-mb-red-dark",
  secundario: "bg-white/10 text-white hover:bg-white/[0.16]",
  fantasma: "text-white/75 hover:bg-white/[0.07] hover:text-white",
  perigo: "border border-mb-red/50 text-mb-red-light hover:border-mb-red hover:bg-mb-red hover:text-white",
  ok: "bg-ok text-white hover:brightness-110",
} as const;

const TAMANHOS = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4", lg: "h-12 px-5 text-[15px]" } as const;

export type VarianteBotao = keyof typeof VARIANTES;

/* ---------------- Botões ---------------- */

export function Botao({
  variante = "secundario", tamanho = "md", className = "", children, type = "button", ...rest
}: {
  variante?: VarianteBotao; tamanho?: keyof typeof TAMANHOS; children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`${BOTAO_BASE} ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** Ligação com o aspecto de botão (ex.: "Ver no site", que abre noutra janela). */
export function BotaoLigacao({
  href, variante = "secundario", tamanho = "md", externo = false, className = "", children,
}: {
  href: string; variante?: VarianteBotao; tamanho?: keyof typeof TAMANHOS;
  externo?: boolean; className?: string; children: ReactNode;
}) {
  return (
    <Link
      href={href}
      target={externo ? "_blank" : undefined}
      rel={externo ? "noopener noreferrer" : undefined}
      className={`${BOTAO_BASE} ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${className}`}
    >
      {children}
      {externo && <span className="sr-only"> (abre numa nova janela)</span>}
    </Link>
  );
}

/** Quadrado de ícone vermelho, como no site. */
export function ChipIcone({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden className={`chip-mb ${className}`}>
      {children}
    </span>
  );
}

/* ---------------- Cartão / Painel ---------------- */

export function Painel({
  titulo, descricao, accoes, children, className = "", icone, id,
}: {
  titulo?: string; descricao?: ReactNode; accoes?: ReactNode;
  children: ReactNode; className?: string; icone?: ReactNode; id?: string;
}) {
  return (
    <section id={id} className={`painel painel-escuro scroll-mt-24 ${className}`}>
      {(titulo || accoes) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
          <div className="flex min-w-0 items-start gap-3">
            {icone && <ChipIcone>{icone}</ChipIcone>}
            <div className="min-w-0">
              {titulo && <h2 className="text-lg font-semibold leading-tight text-white">{titulo}</h2>}
              {descricao && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/60">{descricao}</p>}
            </div>
          </div>
          {accoes && <div className="flex flex-wrap items-center gap-2">{accoes}</div>}
        </header>
      )}
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

/* ---------------- Cabeçalho de página ---------------- */

export function CabecalhoPagina({
  titulo, descricao, accoes, icone, sobretitulo,
}: {
  titulo: string; descricao?: ReactNode; accoes?: ReactNode;
  icone?: ReactNode; sobretitulo?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div className="flex min-w-0 items-start gap-4">
        {icone && <ChipIcone className="chip-mb-lg mt-1">{icone}</ChipIcone>}
        <div className="min-w-0">
          {sobretitulo && <p className="text-sm text-white/55">{sobretitulo}</p>}
          <h1 className="titulo-3 text-balance">{titulo}</h1>
          {descricao && <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-white/65">{descricao}</p>}
        </div>
      </div>
      {accoes && <div className="flex flex-wrap items-center gap-2">{accoes}</div>}
    </div>
  );
}

/* ---------------- Estatística ---------------- */

export function Estatistica({
  rotulo, valor, sufixo, variacao, tom = "neutral", icone, href,
}: {
  rotulo: string; valor: string | number; sufixo?: string;
  variacao?: string; tom?: "neutral" | "red" | "ok" | "gold"; icone?: ReactNode; href?: string;
}) {
  const tons = { neutral: "text-white", red: "text-mb-red-light", ok: "text-[#4ade80]", gold: "text-gold" } as const;
  const corpo = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-white/65">{rotulo}</p>
        {icone && <span className="text-white/45 [&_svg]:size-5">{icone}</span>}
      </div>
      <p className={`mt-auto pt-4 text-[2rem] font-semibold leading-none tracking-tight tabular-nums ${tons[tom]}`}>
        {valor}
        {sufixo && <span className="ml-1.5 text-sm font-normal text-white/50">{sufixo}</span>}
      </p>
      {variacao && <p className="mt-2 text-xs text-white/50">{variacao}</p>}
    </>
  );
  const classe = "painel painel-escuro flex min-h-32 flex-col p-5";
  return href ? (
    <Link href={href} className={`${classe} transition-colors hover:bg-white/[0.06]`}>{corpo}</Link>
  ) : (
    <div className={classe}>{corpo}</div>
  );
}

/* ---------------- Campos de formulário ---------------- */

export function Campo({
  etiqueta, ajuda, obrigatorio, children, className = "",
}: {
  etiqueta: string; ajuda?: ReactNode; obrigatorio?: boolean;
  children: ReactNode; className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-white/75">
        {etiqueta}
        {obrigatorio && <span className="ml-1 text-mb-red-light">*</span>}
      </span>
      {children}
      {ajuda && <span className="mt-1.5 block text-xs leading-relaxed text-white/50">{ajuda}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${CLASSE_CAMPO} ${className}`} {...rest} />;
}

export function Area(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", rows = 4, ...rest } = props;
  return <textarea rows={rows} className={`${CLASSE_CAMPO} resize-y leading-relaxed ${className}`} {...rest} />;
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
      className={`${CLASSE_CAMPO} cursor-pointer ${className}`}
      {...rest}
    >
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor} className="bg-[#2c2c33]">{o.nome}</option>
      ))}
    </select>
  );
}

/** Cor: o seletor e o código lado a lado. */
export function CampoCor({ valor, onChange, etiqueta = "Cor", ajuda }: {
  valor: string; onChange: (v: string) => void; etiqueta?: string; ajuda?: ReactNode;
}) {
  return (
    <Campo etiqueta={etiqueta} ajuda={ajuda}>
      <span className="flex gap-2">
        <input
          type="color" value={/^#[0-9a-f]{6}$/i.test(valor) ? valor : "#e10600"} aria-label={etiqueta}
          onChange={(e) => onChange(e.target.value)}
          className="h-[2.875rem] w-14 shrink-0 cursor-pointer rounded-[var(--raio)] border border-white/10 bg-black/25 p-1"
        />
        <Input value={valor} onChange={(e) => onChange(e.target.value)} placeholder="#e10600" />
      </span>
    </Campo>
  );
}

/**
 * Endereço da página (o "slug"): a parte final do URL, por exemplo
 * /artigos/campeonato-decide-se-no-huambo. Nasce do título ao criar e
 * pode ser afinado; mostra o endereço completo para não parecer um
 * campo técnico por preencher.
 */
export function CampoEndereco({
  valor, onChange, prefixo, novo,
}: {
  valor: string; onChange: (slug: string) => void;
  /** Secção do site onde a página vive, ex. "/artigos". Vazio para a raiz. */
  prefixo: string;
  novo: boolean;
}) {
  const limpar = (texto: string) =>
    texto
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "");
  return (
    <Campo
      etiqueta="Endereço da página"
      ajuda={novo
        ? "Preenche-se sozinho a partir do título. Só precisa de mexer se quiser um endereço mais curto."
        : "Mudar o endereço de uma página já publicada parte as ligações que alguém tenha partilhado."}
    >
      <span className="flex items-center rounded-[var(--raio)] border border-white/10 bg-black/25 transition-colors focus-within:border-mb-red">
        <span className="shrink-0 select-none pl-3 text-[15px] text-white/40">{prefixo}/</span>
        <input
          value={valor}
          onChange={(e) => onChange(limpar(e.target.value))}
          onBlur={() => onChange(valor.replace(/-+$/, ""))}
          placeholder="gerado-a-partir-do-titulo"
          className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 text-[15px] text-white outline-none placeholder:text-white/35"
        />
      </span>
    </Campo>
  );
}

/** Interruptor booleano */
export function Interruptor({
  activo, onChange, etiqueta, descricao, disabled,
}: {
  activo: boolean; onChange: (v: boolean) => void;
  etiqueta: string; descricao?: ReactNode; disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[var(--raio)] bg-black/20 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[15px] text-white">{etiqueta}</p>
        {descricao && <p className="mt-0.5 text-[13px] leading-relaxed text-white/55">{descricao}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={etiqueta}
        disabled={disabled}
        onClick={() => onChange(!activo)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
          activo ? "bg-mb-red" : "bg-white/15"
        }`}
      >
        {/* Âncora explícita à esquerda: sem `left`, o círculo ficava na posição
            centrada do texto do botão e saía da pista ao ligar. */}
        <span
          className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            activo ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/** Caixa que agrupa campos dentro de um formulário, com título. */
export function Grupo({
  titulo, descricao, children, accoes, className = "",
}: {
  titulo: string; descricao?: ReactNode; children: ReactNode; accoes?: ReactNode; className?: string;
}) {
  return (
    <fieldset className={`min-w-0 rounded-[var(--raio)] border border-white/10 bg-black/[0.12] p-4 md:p-5 ${className}`}>
      <legend className="sr-only">{titulo}</legend>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p aria-hidden className="text-[15px] font-semibold text-white">{titulo}</p>
          {descricao && <p className="mt-0.5 text-[13px] leading-relaxed text-white/55">{descricao}</p>}
        </div>
        {accoes && <div className="flex flex-wrap gap-2">{accoes}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

/* ---------------- Etiqueta de estado ---------------- */

const OK = "bg-ok/20 text-[#4ade80]";
const OURO = "bg-gold/15 text-gold";
const VERMELHO = "bg-mb-red/20 text-mb-red-light";
const NEUTRO = "bg-white/10 text-white/70";

const TONS_ESTADO: Record<string, string> = {
  ativo: OK, pago: OK, aprovado: OK, publicado: OK, concluido: OK, respondida: OK, resolvida: OK,
  usado: NEUTRO, rascunho: NEUTRO, agendado: NEUTRO, reembolsado: NEUTRO, arquivada: NEUTRO, esgotado: NEUTRO,
  pendente: OURO, suspenso: OURO, codigo: OURO,
  "bilhetes-abertos": VERMELHO, "a-decorrer": VERMELHO, banido: VERMELHO, cancelado: VERMELHO, rejeitado: VERMELHO,
};

/** `rotulo` troca o texto quando o valor guardado não diz nada a quem lê. */
export function Estado({ valor, rotulo }: { valor: string; rotulo?: string }) {
  const tom = TONS_ESTADO[valor] ?? NEUTRO;
  const texto = rotulo ?? valor.replace(/-/g, " ");
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-[4px] px-2 py-0.5 text-xs font-medium ${tom}`}>
      {texto.charAt(0).toUpperCase() + texto.slice(1)}
    </span>
  );
}

/** Pílula neutra para contagens e marcas pequenas. */
export function Etiqueta({ children, tom = "neutro" }: { children: ReactNode; tom?: "neutro" | "ok" | "ouro" | "vermelho" }) {
  const t = { neutro: NEUTRO, ok: OK, ouro: OURO, vermelho: VERMELHO }[tom];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] px-2 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

/** Aviso dentro da página (falta de dados, modo local, erro). */
export function Aviso({
  tom = "info", titulo, children, accoes,
}: { tom?: "info" | "ok" | "atencao" | "erro"; titulo?: string; children?: ReactNode; accoes?: ReactNode }) {
  const tons = {
    info: "border-white/15 bg-white/[0.06]",
    ok: "border-ok/40 bg-ok/10",
    atencao: "border-gold/40 bg-gold/10",
    erro: "border-mb-red/50 bg-mb-red/15",
  } as const;
  return (
    <div role={tom === "erro" ? "alert" : "status"} className={`flex flex-wrap items-start justify-between gap-3 rounded-[var(--raio)] border px-4 py-3.5 ${tons[tom]}`}>
      <div className="min-w-0 text-sm leading-relaxed text-white/85">
        {titulo && <p className="font-semibold text-white">{titulo}</p>}
        {children && <div className={titulo ? "mt-1" : ""}>{children}</div>}
      </div>
      {accoes && <div className="flex flex-wrap gap-2">{accoes}</div>}
    </div>
  );
}

/** Estado vazio de uma lista. */
export function Vazio({ titulo, children, accao }: { titulo: string; children?: ReactNode; accao?: ReactNode }) {
  return (
    <div className="rounded-[var(--raio)] border border-dashed border-white/15 px-6 py-12 text-center">
      <p className="text-[15px] font-medium text-white">{titulo}</p>
      {children && <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-white/55">{children}</p>}
      {accao && <div className="mt-5 flex justify-center">{accao}</div>}
    </div>
  );
}

/** Indicador de carregamento. */
export function Carregando({ texto = "A carregar…" }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 px-1 py-10 text-sm text-white/60">
      <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-mb-red" />
      {texto}
    </div>
  );
}

/** Separadores (abas) de uma página ou formulário. */
export function Abas<K extends string>({
  abas, activa, onChange, rotulo = "Secções",
}: {
  abas: { chave: K; nome: string; contador?: number }[]; activa: K; onChange: (k: K) => void; rotulo?: string;
}) {
  return (
    <div role="tablist" aria-label={rotulo} className="no-scrollbar -mx-1 flex max-w-full gap-[var(--intervalo)] overflow-x-auto px-1 pb-1">
      {abas.map((a) => (
        <button
          key={a.chave}
          type="button"
          role="tab"
          aria-selected={activa === a.chave}
          onClick={() => onChange(a.chave)}
          className="pilula aria-selected:bg-mb-red aria-selected:text-white"
        >
          {a.nome}
          {a.contador !== undefined && <span className="tabular-nums text-white/60">{a.contador}</span>}
        </button>
      ))}
    </div>
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
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" aria-hidden>
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${CLASSE_CAMPO} pl-9`}
      />
    </div>
  );
}

/* ---------------- Tabela ---------------- */

export function Tabela({ cabecalhos, children, vazio }: {
  cabecalhos: string[]; children: ReactNode; vazio?: boolean;
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 md:-mx-6 md:px-6">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {cabecalhos.map((h) => (
              <th key={h} className="px-3 pb-2.5 text-left text-xs font-medium text-white/50">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {vazio && (
        <p className="py-10 text-center text-sm text-white/50">Nenhum registo corresponde aos filtros.</p>
      )}
    </div>
  );
}

export function Linha({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-white/[0.06] transition-colors hover:bg-white/[0.04] ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </tr>
  );
}

export function Cel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle text-white/85 ${className}`}>{children}</td>;
}

/* ---------------- Botões de ação de linha ---------------- */

export function AccaoIcone({
  titulo, onClick, tom = "neutral", children,
}: {
  titulo: string; onClick: () => void;
  tom?: "neutral" | "perigo" | "ok"; children: ReactNode;
}) {
  const tons = {
    neutral: "text-white/60 hover:bg-white/10 hover:text-white",
    perigo: "text-white/60 hover:bg-mb-red hover:text-white",
    ok: "text-white/60 hover:bg-ok hover:text-white",
  } as const;
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`inline-flex size-8 items-center justify-center rounded-[var(--raio)] bg-white/[0.06] transition-colors ${tons[tom]}`}
    >
      {children}
    </button>
  );
}

/* ---------------- Painel lateral (formulários) ---------------- */

export function Gaveta({
  aberta, aoFechar, titulo, descricao, children, rodape, largura = "max-w-2xl",
}: {
  aberta: boolean; aoFechar: () => void; titulo: string; descricao?: ReactNode;
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
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={aoFechar} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`relative flex h-full w-full ${largura} flex-col border-l border-white/10 bg-[#2c2c33]/95 shadow-2xl backdrop-blur-xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold leading-tight text-white">{titulo}</h2>
            {descricao && <p className="mt-1 text-[13px] text-white/55">{descricao}</p>}
          </div>
          <button
            type="button" onClick={aoFechar} aria-label="Fechar"
            className="shrink-0 rounded-[var(--raio)] bg-white/[0.07] p-2 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 md:px-6">{children}</div>
        {rodape && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-4 md:px-6">{rodape}</footer>
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
  titulo: string; mensagem: ReactNode; textoConfirmar?: string; perigo?: boolean;
}) {
  useEffect(() => {
    if (!aberta) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberta, aoFechar]);
  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={aoFechar} aria-hidden />
      <div role="alertdialog" aria-modal="true" aria-label={titulo}
        className="painel relative w-full max-w-md border border-white/10 !bg-[#2c2c33]/95 p-6 shadow-2xl backdrop-blur-xl">
        <h2 className="text-xl font-semibold text-white">{titulo}</h2>
        <div className="mt-2 text-[15px] leading-relaxed text-white/70">{mensagem}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante={perigo ? "primario" : "ok"} onClick={() => { aoConfirmar(); aoFechar(); }} autoFocus>
            {textoConfirmar}
          </Botao>
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
    timer.current = setTimeout(() => setAviso(null), tom === "erro" ? 6000 : 3200);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const elemento = aviso ? (
    <div
      role={aviso.tom === "erro" ? "alert" : "status"}
      className={`fixed bottom-6 left-1/2 z-120 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2.5 rounded-[var(--raio)] px-4 py-3 text-sm font-medium text-white shadow-2xl ${
        aviso.tom === "ok" ? "bg-[#1f7a3d]" : "bg-mb-red"
      }`}
    >
      <span aria-hidden>{aviso.tom === "ok" ? "✓" : "!"}</span>
      {aviso.texto}
    </div>
  ) : null;

  return { mostrar, elemento };
}

/* ---------------- Editor de lista de texto ---------------- */

export function ListaTexto({
  valores, onChange, etiqueta, placeholder = "Novo item", ajuda, multilinha = false,
}: {
  valores: string[]; onChange: (v: string[]) => void;
  etiqueta: string; placeholder?: string; ajuda?: ReactNode;
  /** Itens longos (parágrafos): cada um numa área de texto. */
  multilinha?: boolean;
}) {
  const [novo, setNovo] = useState("");
  const id = useId();

  const adicionar = () => {
    const t = novo.trim();
    if (!t) return;
    onChange([...valores, t]);
    setNovo("");
  };
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= valores.length) return;
    const v = [...valores];
    [v[i], v[j]] = [v[j], v[i]];
    onChange(v);
  };

  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-[13px] font-medium text-white/75">{etiqueta}</span>
      {ajuda && <span className="-mt-0.5 mb-2 block text-xs leading-relaxed text-white/50">{ajuda}</span>}
      {valores.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {valores.map((v, i) => (
            <li key={`${id}-${i}`} className="flex items-start gap-1.5">
              {multilinha ? (
                <textarea
                  value={v} rows={3}
                  onChange={(e) => onChange(valores.map((x, j) => (j === i ? e.target.value : x)))}
                  className={`${CLASSE_CAMPO} resize-y leading-relaxed`}
                  aria-label={`${etiqueta} ${i + 1}`}
                />
              ) : (
                <input
                  value={v}
                  onChange={(e) => onChange(valores.map((x, j) => (j === i ? e.target.value : x)))}
                  className={CLASSE_CAMPO}
                  aria-label={`${etiqueta} ${i + 1}`}
                />
              )}
              <span className="flex shrink-0 gap-1">
                <AccaoIcone titulo="Subir" onClick={() => mover(i, -1)}><Seta para="cima" /></AccaoIcone>
                <AccaoIcone titulo="Descer" onClick={() => mover(i, 1)}><Seta para="baixo" /></AccaoIcone>
                <AccaoIcone titulo="Remover" tom="perigo" onClick={() => onChange(valores.filter((_, j) => j !== i))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </AccaoIcone>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } }}
          placeholder={placeholder}
          aria-label={`${etiqueta}: ${placeholder}`}
          className={CLASSE_CAMPO}
        />
        <Botao onClick={adicionar}>Juntar</Botao>
      </div>
    </div>
  );
}

/** Pequena seta (para subir/descer itens). */
export function Seta({ para }: { para: "cima" | "baixo" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden>
      <path d={para === "cima" ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
    </svg>
  );
}

/* ---------------- Paginação ---------------- */

export function usePaginacao<T>(itens: T[], porPagina = 12) {
  const [pagina, setPagina] = useState(1);
  const [tamanho, setTamanho] = useState(itens.length);
  // Lista com outro tamanho (filtro, procura): volta à primeira página.
  if (tamanho !== itens.length) {
    setTamanho(itens.length);
    setPagina(1);
  }
  const total = Math.max(1, Math.ceil(itens.length / porPagina));
  const paginaSegura = Math.min(pagina, total);

  const fatia = useMemo(
    () => itens.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina),
    [itens, paginaSegura, porPagina],
  );

  const controlos = total > 1 ? (
    <div className="mt-5 flex items-center justify-between gap-3">
      <p className="text-[13px] text-white/50">
        Página {paginaSegura} de {total} · {itens.length} registos
      </p>
      <div className="flex gap-2">
        <Botao tamanho="sm" disabled={paginaSegura <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))}>
          Anterior
        </Botao>
        <Botao tamanho="sm" disabled={paginaSegura >= total} onClick={() => setPagina((p) => Math.min(total, p + 1))}>
          Seguinte
        </Botao>
      </div>
    </div>
  ) : null;

  return { fatia, controlos, total: itens.length };
}
