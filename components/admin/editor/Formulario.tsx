"use client";

/* ============================================================
   MOTOBOX ADMIN — Formulário a partir de um esquema
   <Formulario esquema={…} valor={obj} onChange={setObj} />
   Ver ./esquema.ts para os tipos de campo.
   ============================================================ */

import { useId, useState } from "react";
import { AccaoIcone, Area, Botao, CLASSE_CAMPO, Campo, CampoCor, Grupo, Input, Interruptor, ListaTexto, Seleccao, Seta } from "../kit";
import { CampoImagem } from "../Media";
import type { CampoEsquema, Valor } from "./esquema";

const eObjecto = (v: unknown): v is Valor => typeof v === "object" && v !== null && !Array.isArray(v);
const texto = (v: unknown) => (typeof v === "string" ? v : v === undefined || v === null ? "" : String(v));

export function Formulario({
  esquema, valor, onChange,
}: {
  esquema: CampoEsquema[];
  valor: Valor;
  onChange: (v: Valor) => void;
}) {
  const mudar = (chave: string, novo: unknown) => onChange({ ...valor, [chave]: novo });
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {esquema.map((c, i) => {
        if (c.mostrarSe && !c.mostrarSe(valor)) return null;
        const largura = c.largura === "meia" ? "md:col-span-1" : "md:col-span-2";
        if (c.tipo === "secao") {
          return (
            <div key={`secao-${i}`} className="md:col-span-2">
              <Grupo titulo={c.titulo} descricao={c.descricao}>
                <Formulario esquema={c.campos} valor={valor} onChange={onChange} />
              </Grupo>
            </div>
          );
        }
        if (c.tipo === "nota") {
          return <div key={`nota-${i}`} className="text-[13px] leading-relaxed text-white/55 md:col-span-2">{c.texto}</div>;
        }
        return (
          <div key={c.chave} className={`min-w-0 ${largura}`}>
            <CampoGenerico campo={c} valor={valor[c.chave]} mudar={(v) => mudar(c.chave, v)} tudo={valor} />
          </div>
        );
      })}
    </div>
  );
}

function CampoGenerico({
  campo: c, valor, mudar, tudo,
}: {
  campo: Exclude<CampoEsquema, { tipo: "secao" } | { tipo: "nota" }>;
  valor: unknown;
  mudar: (v: unknown) => void;
  tudo: Valor;
}) {
  switch (c.tipo) {
    case "texto":
    case "url":
    case "email":
    case "telefone":
      return (
        <Campo etiqueta={c.etiqueta} ajuda={c.ajuda} obrigatorio={c.obrigatorio}>
          <Input
            type={c.tipo === "texto" ? "text" : c.tipo === "telefone" ? "tel" : c.tipo}
            value={texto(valor)} placeholder={c.placeholder}
            onChange={(e) => mudar(e.target.value)}
          />
        </Campo>
      );
    case "area":
      return (
        <Campo etiqueta={c.etiqueta} ajuda={c.ajuda} obrigatorio={c.obrigatorio}>
          <Area rows={c.linhas ?? 4} value={texto(valor)} placeholder={c.placeholder} onChange={(e) => mudar(e.target.value)} />
        </Campo>
      );
    case "numero":
      return (
        <Campo etiqueta={c.etiqueta} ajuda={c.ajuda} obrigatorio={c.obrigatorio}>
          <Input
            type="number" inputMode="decimal" min={c.min} max={c.max} step={c.passo ?? "any"} placeholder={c.placeholder}
            value={typeof valor === "number" && Number.isFinite(valor) ? valor : valor === undefined || valor === null ? "" : texto(valor)}
            // Vazio grava null (e não 0), para o site saber que não há valor.
            onChange={(e) => mudar(e.target.value === "" ? null : Number(e.target.value))}
          />
        </Campo>
      );
    case "booleano":
      return <Interruptor etiqueta={c.etiqueta} descricao={c.descricao ?? c.ajuda} activo={Boolean(valor)} onChange={mudar} />;
    case "seleccao": {
      const ops = typeof c.opcoes === "function" ? c.opcoes() : c.opcoes;
      const actual = texto(valor);
      const lista = [
        ...(c.vazio !== undefined || !actual ? [{ valor: "", nome: c.vazio ?? "—" }] : []),
        ...ops,
        // Um valor gravado que já não está nas opções não desaparece do formulário.
        ...(actual && !ops.some((o) => o.valor === actual) ? [{ valor: actual, nome: actual }] : []),
      ];
      return (
        <Campo etiqueta={c.etiqueta} ajuda={c.ajuda} obrigatorio={c.obrigatorio}>
          <Seleccao valor={actual} opcoes={lista} onChange={mudar} />
        </Campo>
      );
    }
    case "data":
      return (
        <Campo etiqueta={c.etiqueta} ajuda={c.ajuda} obrigatorio={c.obrigatorio}>
          <Input type="date" value={texto(valor).slice(0, 10)} onChange={(e) => mudar(e.target.value)} />
        </Campo>
      );
    case "hora":
      return (
        <Campo etiqueta={c.etiqueta} ajuda={c.ajuda} obrigatorio={c.obrigatorio}>
          <Input type="time" value={texto(valor).slice(0, 5)} onChange={(e) => mudar(e.target.value)} />
        </Campo>
      );
    case "datahora":
      return (
        <Campo etiqueta={c.etiqueta} ajuda={c.ajuda ?? "Hora de Luanda."} obrigatorio={c.obrigatorio}>
          <Input
            type="datetime-local" value={texto(valor).slice(0, 16)}
            onChange={(e) => mudar(e.target.value ? `${e.target.value}:00+01:00` : "")}
          />
        </Campo>
      );
    case "imagem":
    case "video":
      return (
        <CampoImagem
          etiqueta={c.etiqueta} ajuda={c.ajuda} obrigatorio={c.obrigatorio} tipo={c.tipo}
          formato={c.formato} valor={texto(valor)} onChange={mudar}
        />
      );
    case "cor":
      return <CampoCor etiqueta={c.etiqueta} ajuda={c.ajuda} valor={texto(valor)} onChange={mudar} />;
    case "lista-texto":
      return (
        <ListaTexto
          etiqueta={c.etiqueta} ajuda={c.ajuda} placeholder={c.placeholder} multilinha={c.multilinha}
          valores={Array.isArray(valor) ? valor.map(texto) : []}
          onChange={mudar}
        />
      );
    case "lista":
      return <ListaObjectos campo={c} valor={Array.isArray(valor) ? valor : []} mudar={mudar} />;
    case "objecto":
      return (
        <Grupo titulo={c.etiqueta} descricao={c.ajuda}>
          <Formulario esquema={c.campos} valor={eObjecto(valor) ? valor : {}} onChange={mudar} />
        </Grupo>
      );
    case "bi":
      return <CampoBi etiqueta={c.etiqueta} ajuda={c.ajuda} area={c.area} linhas={c.linhas} valor={valor} mudar={mudar} />;
    case "lista-bi":
      return <ListaBi etiqueta={c.etiqueta} ajuda={c.ajuda} area={c.area} nomeItem={c.nomeItem} valor={Array.isArray(valor) ? valor : []} mudar={mudar} />;
    case "coordenadas":
      return <CampoCoordenadas etiqueta={c.etiqueta} ajuda={c.ajuda} valor={valor} mudar={mudar} />;
    case "json":
      return <CampoJson etiqueta={c.etiqueta} ajuda={c.ajuda} linhas={c.linhas} valor={valor} mudar={mudar} />;
    case "personalizado":
      return <>{c.render(valor, mudar, tudo)}</>;
  }
}

/* ---------------- Lista de objectos ---------------- */

function ListaObjectos({
  campo: c, valor, mudar,
}: {
  campo: Extract<CampoEsquema, { tipo: "lista" }>;
  valor: unknown[];
  mudar: (v: unknown[]) => void;
}) {
  const id = useId();
  const [abertos, setAbertos] = useState<Set<number>>(() => new Set(valor.length <= 1 ? [0] : []));
  const nome = c.nomeItem ?? "item";

  const alternar = (i: number) =>
    setAbertos((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= valor.length) return;
    const v = [...valor];
    [v[i], v[j]] = [v[j], v[i]];
    mudar(v);
    setAbertos((s) => {
      const n = new Set<number>();
      for (const k of s) n.add(k === i ? j : k === j ? i : k);
      return n;
    });
  };

  const juntar = () => {
    mudar([...valor, c.novo ? c.novo() : {}]);
    setAbertos((s) => new Set(s).add(valor.length));
  };

  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-white/75">
          {c.etiqueta}
          {c.obrigatorio && <span className="ml-1 text-mb-red-light">*</span>}
          <span className="ml-2 text-white/40">{valor.length}</span>
        </span>
        {valor.length > 1 && (
          <span className="flex gap-2 text-xs">
            <button type="button" className="text-white/55 hover:text-white" onClick={() => setAbertos(new Set(valor.map((_, i) => i)))}>Abrir todos</button>
            <button type="button" className="text-white/55 hover:text-white" onClick={() => setAbertos(new Set())}>Fechar todos</button>
          </span>
        )}
      </div>
      {c.ajuda && <p className="-mt-1 mb-2 text-xs leading-relaxed text-white/50">{c.ajuda}</p>}
      <ol className="space-y-[var(--intervalo)]">
        {valor.map((item, i) => {
          const obj = eObjecto(item) ? item : {};
          const aberto = abertos.has(i);
          const resumo = c.resumo?.(obj, i) || `${nome.charAt(0).toUpperCase() + nome.slice(1)} ${i + 1}`;
          return (
            <li key={`${id}-${i}`} className="rounded-[var(--raio)] border border-white/10 bg-black/[0.18]">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button" onClick={() => alternar(i)} aria-expanded={aberto}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-[4px] bg-white/10 text-xs tabular-nums text-white/70">{i + 1}</span>
                  <span className="truncate text-sm text-white">{resumo}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden
                    className={`ml-auto size-4 shrink-0 text-white/50 transition-transform ${aberto ? "rotate-180" : ""}`}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <span className="flex shrink-0 gap-1">
                  <AccaoIcone titulo="Subir" onClick={() => mover(i, -1)}><Seta para="cima" /></AccaoIcone>
                  <AccaoIcone titulo="Descer" onClick={() => mover(i, 1)}><Seta para="baixo" /></AccaoIcone>
                  <AccaoIcone titulo="Duplicar" onClick={() => { const v = [...valor]; v.splice(i + 1, 0, structuredClone(item)); mudar(v); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden>
                      <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
                    </svg>
                  </AccaoIcone>
                  <AccaoIcone titulo="Apagar" tom="perigo" onClick={() => {
                    mudar(valor.filter((_, j) => j !== i));
                    setAbertos((s) => new Set([...s].filter((k) => k !== i).map((k) => (k > i ? k - 1 : k))));
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden>
                      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                    </svg>
                  </AccaoIcone>
                </span>
              </div>
              {aberto && (
                <div className="border-t border-white/10 p-3 md:p-4">
                  <Formulario
                    esquema={c.campos}
                    valor={obj}
                    onChange={(novo) => mudar(valor.map((x, j) => (j === i ? novo : x)))}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <Botao className="mt-2" onClick={juntar}>
        <span aria-hidden>+</span> Juntar {nome}
      </Botao>
    </div>
  );
}

/* ---------------- Bilingue ---------------- */

function CampoBi({
  etiqueta, ajuda, area, linhas, valor, mudar,
}: { etiqueta: string; ajuda?: string; area?: boolean; linhas?: number; valor: unknown; mudar: (v: unknown) => void }) {
  const v = eObjecto(valor) ? valor : { pt: texto(valor), en: "" };
  const lado = (lingua: "pt" | "en", nome: string) => (
    <Campo etiqueta={`${etiqueta} · ${nome}`}>
      {area ? (
        <Area rows={linhas ?? 3} value={texto(v[lingua])} onChange={(e) => mudar({ ...v, [lingua]: e.target.value })} />
      ) : (
        <Input value={texto(v[lingua])} onChange={(e) => mudar({ ...v, [lingua]: e.target.value })} />
      )}
    </Campo>
  );
  return (
    <div className="min-w-0">
      <div className="grid gap-3 md:grid-cols-2">
        {lado("pt", "Português")}
        {lado("en", "English")}
      </div>
      {ajuda && <p className="mt-1.5 text-xs leading-relaxed text-white/50">{ajuda}</p>}
    </div>
  );
}

function ListaBi({
  etiqueta, ajuda, area, nomeItem = "texto", valor, mudar,
}: { etiqueta: string; ajuda?: string; area?: boolean; nomeItem?: string; valor: unknown[]; mudar: (v: unknown[]) => void }) {
  return (
    <ListaObjectos
      campo={{
        tipo: "lista", chave: "_", etiqueta, ajuda, nomeItem,
        resumo: (o) => texto(o.pt).slice(0, 90),
        novo: () => ({ pt: "", en: "" }),
        campos: [{ tipo: "bi", chave: "_bi", etiqueta: "Texto", area }],
      }}
      // Cada item é { pt, en }: o formulário interno guarda-o em "_bi" e desfaz-se aqui.
      valor={valor.map((x) => ({ _bi: x }))}
      mudar={(v) => mudar(v.map((x) => (eObjecto(x) && "_bi" in x ? x._bi : x)))}
    />
  );
}

/* ---------------- Coordenadas ---------------- */

function CampoCoordenadas({
  etiqueta, ajuda, valor, mudar,
}: { etiqueta: string; ajuda?: string; valor: unknown; mudar: (v: unknown) => void }) {
  const v = eObjecto(valor) ? valor : {};
  const lat = typeof v.lat === "number" ? v.lat : undefined;
  const lng = typeof v.lng === "number" ? v.lng : undefined;
  const num = (s: string) => (s === "" ? undefined : Number(s));
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta={`${etiqueta} · latitude`}>
          <Input type="number" step="any" value={lat ?? ""} onChange={(e) => mudar({ ...v, lat: num(e.target.value) })} placeholder="-8.8383" />
        </Campo>
        <Campo etiqueta="longitude">
          <Input type="number" step="any" value={lng ?? ""} onChange={(e) => mudar({ ...v, lng: num(e.target.value) })} placeholder="13.2344" />
        </Campo>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-white/50">
        {ajuda ?? "Graus decimais. No Google Maps: clique com o botão direito no sítio e copie os dois números."}
        {lat !== undefined && lng !== undefined && (
          <>
            {" "}
            <a className="sublinhado text-white/80" target="_blank" rel="noopener noreferrer"
              href={`https://www.google.com/maps?q=${lat},${lng}`}>Ver no mapa</a>
          </>
        )}
      </p>
    </div>
  );
}

/* ---------------- JSON ---------------- */

function CampoJson({
  etiqueta, ajuda, linhas, valor, mudar,
}: { etiqueta: string; ajuda?: string; linhas?: number; valor: unknown; mudar: (v: unknown) => void }) {
  const [textoJson, setTextoJson] = useState(() => JSON.stringify(valor ?? null, null, 2));
  const [erro, setErro] = useState<string | null>(null);
  const [anterior, setAnterior] = useState(valor);
  if (anterior !== valor) {
    setAnterior(valor);
    setTextoJson(JSON.stringify(valor ?? null, null, 2));
  }
  return (
    <Campo etiqueta={etiqueta} ajuda={erro ?? ajuda ?? "Em formato JSON. Grava ao sair do campo."}>
      <textarea
        rows={linhas ?? 8} value={textoJson} spellCheck={false}
        onChange={(e) => setTextoJson(e.target.value)}
        onBlur={() => {
          try { mudar(JSON.parse(textoJson)); setErro(null); } catch { setErro("JSON inválido: corrija antes de gravar."); }
        }}
        className={`${CLASSE_CAMPO} font-mono text-[13px] ${erro ? "!border-mb-red" : ""}`}
      />
    </Campo>
  );
}
