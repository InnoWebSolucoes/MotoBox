"use client";

/* ============================================================
   MOTOBOX ADMIN — Página Rotas
   O documento "paginas.rotas": os textos de /rotas, o que é
   comum a todas as rotas (emergência, documentos, rede, preço do
   combustível, o que levar, quando ir, planear, regras), as
   tabelas de clima, os textos fixos da página de cada rota e os
   do guia em PDF.
   ============================================================ */

import { useState } from "react";
import { MESES_CURTOS } from "@/lib/rotas-sol";
import type { ClimaCidade, ConteudoPaginaRotas } from "@/lib/rotas-pagina";
import { CLASSE_CAMPO } from "@/components/admin/kit";
import { EditorDoc } from "@/components/admin/editor/EditorDoc";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";
import {
  ESQUEMA_PAGINA_COMUM, ESQUEMA_PAGINA_DETALHE, ESQUEMA_PAGINA_ENTRADA, ESQUEMA_PAGINA_GUIA, ESQUEMA_PAGINA_PLANEAR,
  ESQUEMA_PAGINA_QUANDO, fonte,
} from "./esquemas";
import { AbasPartes } from "./Partes";

type Parte = "entrada" | "quando" | "planear" | "comum" | "clima" | "detalhe" | "guia";

const PARTES: { chave: Parte; nome: string; descricao: string }[] = [
  { chave: "entrada", nome: "Entrada", descricao: "A abertura de /rotas, a lista das rotas, o quadro \"Melhor em grupo\" e o que aparece no Google." },
  { chave: "quando", nome: "Quando ir", descricao: "A secção \"Quando ir\" de /rotas, com um cartão por região." },
  { chave: "planear", nome: "Planear e regras", descricao: "\"Planear uma viagem de mota\" e \"Regras da estrada\", em /rotas." },
  { chave: "comum", nome: "Comum a todas as rotas", descricao: "Emergência, documentos, rede, preço do combustível e a lista \"Em qualquer viagem\": aparecem em todas as rotas." },
  { chave: "clima", nome: "Clima por cidade", descricao: "As tabelas de clima e luz. Cada rota escolhe uma destas cidades (em Informação prática)." },
  { chave: "detalhe", nome: "Textos da página de cada rota", descricao: "Títulos, botões e notas que se repetem em todas as páginas de rota." },
  { chave: "guia", nome: "Guia em PDF", descricao: "O botão \"Descarregar o guia (PDF)\" de cada rota e os títulos e legendas do documento." },
];

const ESQUEMAS: Partial<Record<Parte, CampoEsquema[]>> = {
  entrada: ESQUEMA_PAGINA_ENTRADA,
  quando: ESQUEMA_PAGINA_QUANDO,
  planear: ESQUEMA_PAGINA_PLANEAR,
  comum: ESQUEMA_PAGINA_COMUM,
  detalhe: ESQUEMA_PAGINA_DETALHE,
  guia: ESQUEMA_PAGINA_GUIA,
};

/* ---------------- Clima: 12 meses ---------------- */

function TabelaMeses({ valor, mudar }: { valor: unknown; mudar: (v: unknown) => void }) {
  const meses = Array.from({ length: 12 }, (_, i) => {
    const m = Array.isArray(valor) ? (valor[i] as Record<string, unknown> | undefined) : undefined;
    return { max: m?.max, min: m?.min, chuva: m?.chuva } as Record<string, unknown>;
  });
  const definir = (i: number, campo: "max" | "min" | "chuva", texto: string) => {
    const x = texto === "" ? null : Number(texto.replace(",", "."));
    mudar(meses.map((m, j) => (j === i ? { ...m, [campo]: Number.isFinite(x) ? x : null } : m)));
  };
  const caixa = `${CLASSE_CAMPO} !px-2 !py-1.5 text-center tabular-nums`;
  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-[13px] font-medium text-white/75">Mês a mês</span>
      <span className="-mt-0.5 mb-2 block text-xs leading-relaxed text-white/50">
        Temperatura máxima e mínima médias (°C) e chuva (mm). Os meses com 50 mm ou mais ficam a vermelho na página.
      </span>
      <div className="grid grid-cols-[2.75rem_repeat(3,minmax(0,1fr))] items-center gap-1.5 text-sm">
        <span />
        <span className="text-center text-xs text-white/55">Máx. °C</span>
        <span className="text-center text-xs text-white/55">Mín. °C</span>
        <span className="text-center text-xs text-white/55">Chuva mm</span>
        {meses.map((m, i) => (
          <div key={i} className="contents">
            <span className="text-xs text-white/60">{MESES_CURTOS[i]}</span>
            {(["max", "min", "chuva"] as const).map((c) => (
              <input
                key={c} type="number" step="any" inputMode="decimal" aria-label={`${MESES_CURTOS[i]}: ${c === "max" ? "máxima" : c === "min" ? "mínima" : "chuva"}`}
                value={typeof m[c] === "number" ? (m[c] as number) : ""} onChange={(e) => definir(i, c, e.target.value)}
                className={caixa}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const ESQUEMA_CIDADE: CampoEsquema[] = [
  { tipo: "texto", chave: "cidade", etiqueta: "Cidade", obrigatorio: true, ajuda: "Aparece no título: \"Clima e luz · Lubango\"." },
  { tipo: "coordenadas", chave: "_coord", etiqueta: "Onde fica", ajuda: "Para calcular o nascer e o pôr do sol. No Google Maps: clique com o botão direito na cidade e copie os dois números." },
  { tipo: "area", chave: "nota", etiqueta: "De onde vêm os números", linhas: 2, ajuda: "Por baixo da tabela, ex.: \"Médias de 1961 a 1990, do Deutscher Wetterdienst.\"" },
  fonte("fonte"),
  { tipo: "personalizado", chave: "meses", etiqueta: "Mês a mês", render: (v, m) => <TabelaMeses valor={v} mudar={m} /> },
];

function EditorClima({ dados, mudar }: { dados: ConteudoPaginaRotas; mudar: (d: ConteudoPaginaRotas) => void }) {
  const lista = Array.isArray(dados.CLIMA) ? dados.CLIMA : [];
  return (
    <Formulario
      esquema={[{
        tipo: "lista", chave: "CLIMA", etiqueta: "Cidades", nomeItem: "cidade",
        ajuda: "Apagar uma cidade que uma rota use faz essa rota mostrar a primeira cidade da lista.",
        resumo: (c) => String(c.cidade ?? ""),
        novo: () => ({
          chave: `cidade-${Date.now().toString(36)}`, cidade: "", _coord: {}, nota: "", fonte: { nome: "", url: "" },
          meses: Array.from({ length: 12 }, () => ({ max: null, min: null, chuva: null })),
        }),
        campos: ESQUEMA_CIDADE,
      }]}
      valor={{ CLIMA: lista.map((c) => ({ ...c, _coord: { lat: c.lat, lng: c.lng } })) }}
      onChange={(v) => {
        const novas = (Array.isArray(v.CLIMA) ? v.CLIMA : []) as Valor[];
        const vistas = new Set<string>();
        mudar({
          ...dados,
          CLIMA: novas.map(({ _coord, ...resto }, i) => {
            const c = (_coord ?? {}) as { lat?: number; lng?: number };
            const cidade = { ...(resto as unknown as ClimaCidade), lat: c.lat as number, lng: c.lng as number };
            // Uma cidade duplicada leva um código novo: cada rota aponta para uma só.
            if (!cidade.chave || vistas.has(cidade.chave)) cidade.chave = `cidade-${Date.now().toString(36)}-${i}`;
            vistas.add(cidade.chave);
            return cidade;
          }),
        });
      }}
    />
  );
}

/* ---------------- Página ---------------- */

export function PaginaRotas({ aoGravar }: { aoGravar?: (d: ConteudoPaginaRotas) => void }) {
  const [parte, setParte] = useState<Parte>("entrada");
  const info = PARTES.find((p) => p.chave === parte)!;
  return (
    <EditorDoc<ConteudoPaginaRotas & Valor> chave="paginas.rotas" pagina="/rotas" titulo="Rotas (página da secção)" aoGravar={aoGravar}>
      {(dados, mudar) => (
        <div className="space-y-5">
          <AbasPartes abas={PARTES.map(({ chave, nome }) => ({ chave, nome }))} activa={parte} onChange={setParte} rotulo="Partes da página" />
          <div className="painel painel-escuro space-y-5 p-5 md:p-6">
            <p className="text-[13px] leading-relaxed text-white/55">{info.descricao}</p>
            {parte === "clima" ? (
              <EditorClima dados={dados} mudar={(d) => mudar(d as ConteudoPaginaRotas & Valor)} />
            ) : (
              <Formulario esquema={ESQUEMAS[parte]!} valor={dados} onChange={(v) => mudar(v as ConteudoPaginaRotas & Valor)} />
            )}
          </div>
        </div>
      )}
    </EditorDoc>
  );
}
