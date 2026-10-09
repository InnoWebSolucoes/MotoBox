"use client";

/* ============================================================
   MOTOBOX ADMIN — Peças dos editores de páginas
   Usadas pelos editores de Páginas, Entrada e painel e Páginas
   legais:
   - em(): os campos de um objecto dentro do documento, sem a
     caixa à volta (para textos que vivem em "TEXTO", "UI"…);
   - numerosFontes(): lista de números ("1, 2") das fontes;
   - FormularioPorAbas: um formulário longo dividido em abas;
   - inferirEsquema(): formulário automático para documentos
     que ainda não têm um editor próprio.
   ============================================================ */

import { useState, type ReactNode } from "react";
import { Campo, Input, Painel, Seleccao } from "@/components/admin/kit";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";

const eObjecto = (v: unknown): v is Valor => typeof v === "object" && v !== null && !Array.isArray(v);

/** Os campos de um objecto do documento (ex.: "TEXTO"), sem caixa à volta. */
export function em(chave: string, campos: CampoEsquema[]): CampoEsquema {
  return {
    tipo: "personalizado",
    chave,
    etiqueta: "",
    render: (v, mudar) => <Formulario esquema={campos} valor={eObjecto(v) ? v : {}} onChange={mudar} />,
  };
}

/** Os mesmos campos dentro de uma caixa com título (secção do formulário). */
export function caixa(titulo: string, campos: CampoEsquema[], descricao?: string): CampoEsquema {
  return { tipo: "secao", titulo, descricao, campos };
}

/* ---------------- Números das fontes ---------------- */

function CampoNumeros({ etiqueta, ajuda, valor, mudar }: {
  etiqueta: string; ajuda?: string; valor: unknown; mudar: (v: number[]) => void;
}) {
  const lista = Array.isArray(valor) ? valor.filter((n): n is number => typeof n === "number") : [];
  const comoTexto = lista.join(", ");
  const [texto, setTexto] = useState(comoTexto);
  const [anterior, setAnterior] = useState(comoTexto);
  // Valor mudado por fora (desfazer, repor): o campo acompanha.
  if (anterior !== comoTexto) {
    setAnterior(comoTexto);
    setTexto(comoTexto);
  }
  return (
    <Campo etiqueta={etiqueta} ajuda={ajuda}>
      <Input
        value={texto}
        inputMode="numeric"
        placeholder="Ex.: 1, 2"
        onChange={(e) => {
          setTexto(e.target.value);
          const nums = e.target.value.split(/[^\d]+/).filter(Boolean).map(Number);
          setAnterior(nums.join(", "));
          mudar(nums);
        }}
        onBlur={() => setTexto(lista.join(", "))}
      />
    </Campo>
  );
}

export function numerosFontes(chave: string, etiqueta = "Fontes citadas", ajuda?: string): CampoEsquema {
  return {
    tipo: "personalizado",
    chave,
    etiqueta,
    render: (v, mudar) => (
      <CampoNumeros
        etiqueta={etiqueta}
        ajuda={ajuda ?? "Os números das fontes (lista no fim da página), separados por vírgulas. Aparecem como [1] no fim do texto."}
        valor={v}
        mudar={mudar}
      />
    ),
  };
}

/* ---------------- Abas que passam à linha seguinte ---------------- */

/** Como as Abas do kit, mas sem rolar para o lado: as que não cabem passam à linha seguinte. */
export function AbasEmLinhas<K extends string>({ abas, activa, onChange, rotulo }: {
  abas: { chave: K; nome: string; contador?: number }[]; activa: K; onChange: (k: K) => void; rotulo: string;
}) {
  return (
    <div role="tablist" aria-label={rotulo} className="flex flex-wrap gap-[var(--intervalo)]">
      {abas.map((a) => (
        <button
          key={a.chave}
          type="button"
          role="tab"
          aria-selected={a.chave === activa}
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

/* ---------------- Formulário dividido em abas ---------------- */

export interface AbaEsquema {
  chave: string;
  nome: string;
  descricao?: ReactNode;
  esquema: CampoEsquema[];
}

export function FormularioPorAbas({ abas, valor, mudar, rotulo = "Partes da página" }: {
  abas: AbaEsquema[]; valor: Valor; mudar: (v: Valor) => void; rotulo?: string;
}) {
  const [aba, setAba] = useState(abas[0]?.chave ?? "");
  const actual = abas.find((a) => a.chave === aba) ?? abas[0];
  if (!actual) return null;
  return (
    <div className="space-y-[var(--intervalo)]">
      {/* No telemóvel, uma lista para escolher; nos ecrãs largos, todas as abas à vista (em várias linhas se for preciso). */}
      <div className="md:hidden">
        <Campo etiqueta={rotulo}>
          <Seleccao valor={actual.chave} onChange={setAba} opcoes={abas.map((a) => ({ valor: a.chave, nome: a.nome }))} />
        </Campo>
      </div>
      <div className="hidden md:block">
        <AbasEmLinhas abas={abas.map((a) => ({ chave: a.chave, nome: a.nome }))} activa={actual.chave} onChange={setAba} rotulo={rotulo} />
      </div>
      <Painel titulo={actual.nome} descricao={actual.descricao}>
        <Formulario esquema={actual.esquema} valor={valor} onChange={mudar} />
      </Painel>
    </div>
  );
}

/* ---------------- Formulário automático ---------------- */

/** "corpoTexto" → "Corpo texto". */
const rotulo = (chave: string) => {
  const t = chave.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const eBi = (v: unknown): boolean =>
  eObjecto(v) && Object.keys(v).length === 2 && typeof v.pt === "string" && typeof v.en === "string";

const pareceImagem = (chave: string, v: string) =>
  /foto|imagem|poster|capa|logo/i.test(chave) || /\.(jpe?g|png|webp|avif)(\?|$)/i.test(v);

/** Um campo a partir do valor que lá está (para documentos sem editor próprio). */
function inferirCampo(chave: string, v: unknown): CampoEsquema {
  const etiqueta = rotulo(chave);
  if (typeof v === "boolean") return { tipo: "booleano", chave, etiqueta };
  if (typeof v === "number") return { tipo: "numero", chave, etiqueta, largura: "meia" };
  if (typeof v === "string") {
    if (pareceImagem(chave, v)) return { tipo: "imagem", chave, etiqueta };
    if (/video/i.test(chave)) return { tipo: "video", chave, etiqueta };
    return v.length > 90 ? { tipo: "area", chave, etiqueta, linhas: 4 } : { tipo: "texto", chave, etiqueta };
  }
  if (eBi(v)) {
    const o = v as Valor;
    return { tipo: "bi", chave, etiqueta, area: String(o.pt).length > 90 };
  }
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === "string")) {
      return { tipo: "lista-texto", chave, etiqueta, multilinha: v.some((x) => String(x).length > 90) };
    }
    if (v.every(eBi)) return { tipo: "lista-bi", chave, etiqueta, area: v.some((x) => String((x as Valor).pt).length > 90) };
    if (v.every(eObjecto) && v.length > 0) {
      const modelo: Valor = Object.assign({}, ...(v as Valor[]));
      const campos = inferirEsquema(modelo);
      const primeiroTexto = Object.keys(modelo).find((k) => typeof modelo[k] === "string" || eBi(modelo[k]));
      return {
        tipo: "lista", chave, etiqueta, campos,
        resumo: (item) => {
          const x = primeiroTexto ? item[primeiroTexto] : "";
          return typeof x === "string" ? x : eBi(x) ? String((x as Valor).pt) : "";
        },
      };
    }
    return { tipo: "json", chave, etiqueta };
  }
  if (eObjecto(v)) return { tipo: "objecto", chave, etiqueta, campos: inferirEsquema(v) };
  return { tipo: "json", chave, etiqueta };
}

export function inferirEsquema(valor: unknown): CampoEsquema[] {
  if (!eObjecto(valor)) return [];
  return Object.entries(valor).map(([k, v]) => inferirCampo(k, v));
}
