"use client";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA: cartão de uma proposta
   O que o Organizador quer mudar, com o antes e o depois de
   cada campo, os avisos e as páginas afectadas. Aprovar,
   Rejeitar ou Editar (os valores voltam ao servidor para serem
   validados de novo antes de aprovar). As propostas destrutivas
   pedem confirmação explícita.
   ============================================================ */

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle, ArrowRight, Check, ExternalLink, Mail, Pencil, Trash2, Undo2, X,
} from "lucide-react";
import { Area, Botao, Campo, Confirmar, Input } from "@/components/admin/kit";
import type { OperacaoVista, Proposta } from "@/lib/admin/organizador/tipos";
import type { EstadoProposta } from "./conversa";

const ACCOES: Record<OperacaoVista["accao"], string> = {
  criar: "Criar", alterar: "Alterar", apagar: "Apagar", publicar: "Publicar", esconder: "Esconder",
  definicoes: "Definições", conteudo: "Conteúdo", repor: "Repor", email: "Email",
};

const ROTULO_ESTADO: Partial<Record<EstadoProposta, { texto: string; classe: string }>> = {
  decidida: { texto: "Decidida", classe: "bg-white/10 text-white/80" },
  "a-executar": { texto: "A executar…", classe: "bg-white/10 text-white/80" },
  executada: { texto: "Executada", classe: "bg-ok/20 text-[#4ade80]" },
  falhou: { texto: "Não executada", classe: "bg-mb-red/20 text-mb-red-light" },
  rejeitada: { texto: "Rejeitada", classe: "bg-white/10 text-white/80" },
  "sem-decisao": { texto: "Ficou por decidir", classe: "bg-white/10 text-white/80" },
};

/** Campos simples da entrada que se editam com uma caixa. */
type Caminho = string[];
interface CampoEditavel { caminho: Caminho; rotulo: string; valor: string | number | boolean; longo: boolean }

function camposEditaveis(entrada: Record<string, unknown>): CampoEditavel[] {
  const saida: CampoEditavel[] = [];
  const visitar = (obj: Record<string, unknown>, caminho: Caminho) => {
    for (const [k, v] of Object.entries(obj)) {
      if (["coleccao", "id", "slug", "chave", "grupo", "item", "corrida"].includes(k) && caminho.length === 0) continue;
      const c = [...caminho, k];
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        saida.push({ caminho: c, rotulo: c.join(" › "), valor: v, longo: typeof v === "string" && (v.length > 80 || v.includes("\n")) });
      } else if (v && typeof v === "object" && !Array.isArray(v) && caminho.length === 0) {
        visitar(v as Record<string, unknown>, c);
      }
    }
  };
  visitar(entrada, []);
  return saida;
}

function comValor(entrada: Record<string, unknown>, caminho: Caminho, valor: unknown): Record<string, unknown> {
  const copia = structuredClone(entrada);
  let alvo: Record<string, unknown> = copia;
  for (const k of caminho.slice(0, -1)) alvo = alvo[k] as Record<string, unknown>;
  alvo[caminho[caminho.length - 1]] = valor;
  return copia;
}

function IconeAccao({ accao }: { accao: OperacaoVista["accao"] }) {
  const classe = "size-3.5";
  if (accao === "apagar") return <Trash2 className={classe} aria-hidden />;
  if (accao === "repor") return <Undo2 className={classe} aria-hidden />;
  if (accao === "email") return <Mail className={classe} aria-hidden />;
  return <Pencil className={classe} aria-hidden />;
}

function Operacao({ op }: { op: OperacaoVista }) {
  const perigo = op.accao === "apagar";
  return (
    <li className="rounded-[var(--raio)] border border-white/10 bg-black/[0.18]">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <span className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${perigo ? "bg-mb-red text-white" : "bg-white/10 text-white/80"}`}>
          <IconeAccao accao={op.accao} />{ACCOES[op.accao]}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{op.alvo}</span>
      </div>
      {op.detalhe && <p className="px-3 pb-2 text-xs text-white/75">{op.detalhe}</p>}
      {op.campos && op.campos.length > 0 && (
        <dl className="divide-y divide-white/[0.06] border-t border-white/[0.07]">
          {op.campos.map((c) => (
            <div key={c.campo} className="grid gap-1 px-3 py-2 text-[13px] sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
              <dt className="text-white/75">{c.etiqueta}</dt>
              <dd className="min-w-0 break-words">
                {c.antes !== undefined && c.depois !== undefined ? (
                  <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <span className="text-white/70 line-through decoration-white/25">{c.antes}</span>
                    <ArrowRight className="size-3 shrink-0 self-center text-white/70" aria-label="passa a" />
                    <span className="text-white">{c.depois}</span>
                  </span>
                ) : c.depois !== undefined ? (
                  <span className="whitespace-pre-line text-white">{c.depois}</span>
                ) : (
                  <span className="text-white/70">{c.antes}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

export function CartaoProposta({
  proposta, estado, editada, resultado, bloqueado, varias, decisaoLocal, aoDecidir, aoRever,
}: {
  proposta: Proposta;
  estado: EstadoProposta;
  editada?: boolean;
  resultado?: { ok: boolean; titulo: string; resumo: string; ligacoes: { rotulo: string; href: string }[] };
  /** A conversa está a correr: os botões ficam parados. */
  bloqueado: boolean;
  /** Há mais propostas à espera: as decisões juntam-se e enviam-se de uma vez. */
  varias: boolean;
  decisaoLocal?: "aprovar" | "rejeitar";
  aoDecidir: (d: { decisao: "aprovar" | "rejeitar"; confirmado?: boolean; nota?: string }) => void;
  aoRever: (entrada: Record<string, unknown>) => Promise<string | null>;
}) {
  const [aConfirmar, setAConfirmar] = useState(false);
  const [aEditar, setAEditar] = useState(false);
  const [rascunho, setRascunho] = useState<Record<string, unknown>>(proposta.entrada);
  const [json, setJson] = useState<string | null>(null);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);
  const [aRever, setARever] = useState(false);
  const [aRejeitar, setARejeitar] = useState(false);
  const [nota, setNota] = useState("");

  const aberta = estado === "pendente" || estado === "decidida";
  const campos = camposEditaveis(rascunho);

  const abrirEdicao = () => {
    setRascunho(proposta.entrada);
    setJson(null);
    setErroEdicao(null);
    setAEditar(true);
  };

  const rever = async () => {
    let entrada = rascunho;
    if (json !== null) {
      try { entrada = JSON.parse(json) as Record<string, unknown>; } catch {
        setErroEdicao("O JSON tem um erro: verifique aspas, vírgulas e chavetas.");
        return;
      }
    }
    setARever(true);
    const erro = await aoRever(entrada);
    setARever(false);
    if (erro) setErroEdicao(erro);
    else setAEditar(false);
  };

  const aprovar = () => {
    if (proposta.destrutiva) setAConfirmar(true);
    else aoDecidir({ decisao: "aprovar" });
  };

  const estadoVisivel = ROTULO_ESTADO[estado];

  return (
    <section
      aria-label={`Proposta: ${proposta.titulo}`}
      className={`overflow-hidden rounded-[var(--raio)] border ${proposta.destrutiva && aberta ? "border-mb-red/50" : "border-white/12"} bg-[rgb(40_40_47/0.85)]`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.08] px-4 py-3">
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-xs font-medium text-mb-red-light">
            {proposta.destrutiva ? "Proposta destrutiva" : "Proposta"}{editada ? " · editada" : ""}
          </p>
          <h3 className="mt-0.5 text-[15px] font-semibold leading-snug text-white">{proposta.titulo}</h3>
          {proposta.motivo && <p className="mt-1 text-sm text-white/80">{proposta.motivo}</p>}
        </div>
        {estadoVisivel && !(estado === "decidida" && decisaoLocal) && (
          <span className={`rounded-[4px] px-2 py-0.5 text-xs font-medium ${estadoVisivel.classe}`}>{estadoVisivel.texto}</span>
        )}
        {estado === "decidida" && decisaoLocal && (
          <span className={`rounded-[4px] px-2 py-0.5 text-xs font-medium ${decisaoLocal === "aprovar" ? "bg-ok/20 text-[#4ade80]" : "bg-white/10 text-white/70"}`}>
            {decisaoLocal === "aprovar" ? "Aprovada (por enviar)" : "Rejeitada (por enviar)"}
          </span>
        )}
      </header>

      <div className="space-y-3 px-4 py-3">
        <ul className="space-y-2">
          {proposta.operacoes.map((op, i) => <Operacao key={i} op={op} />)}
        </ul>

        {proposta.avisos.length > 0 && aberta && (
          <ul className="space-y-1 border-l-2 border-gold/60 pl-3 text-xs leading-relaxed text-gold">
            {proposta.avisos.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}

        {resultado && (
          <div role="status" className={`rounded-[var(--raio)] border px-3 py-2.5 text-sm ${resultado.ok ? "border-ok/40 bg-ok/10 text-white/85" : "border-mb-red/50 bg-mb-red/15 text-white/85"}`}>
            <p className="flex items-center gap-1.5 font-medium text-white">
              {resultado.ok ? <Check className="size-4 text-[#4ade80]" aria-hidden /> : <AlertTriangle className="size-4 text-mb-red-light" aria-hidden />}
              {resultado.ok ? "Feito" : "Não foi executado"}
            </p>
            <p className="mt-1 text-[13px] text-white/70">{resultado.resumo}</p>
          </div>
        )}

        {proposta.ligacoes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {proposta.ligacoes.map((l) => (
              <Link key={`${l.href}-${l.rotulo}`} href={l.href}
                className="inline-flex max-w-full items-center gap-1 rounded-[4px] bg-white/[0.07] px-2 py-1 text-xs text-white/75 transition-colors hover:bg-white/[0.14] hover:text-white">
                <ExternalLink className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{l.rotulo}</span>
              </Link>
            ))}
          </div>
        )}

        {aEditar && aberta && (
          <div className="space-y-3 rounded-[var(--raio)] border border-white/10 bg-black/20 p-3">
            <p className="text-[13px] text-white/80">Mude os valores e reveja: o Organizador valida de novo e mostra o resultado antes de aprovar.</p>
            {json === null ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {campos.map((c) => (
                    <Campo key={c.caminho.join(".")} etiqueta={c.rotulo} className={c.longo ? "sm:col-span-2" : ""}>
                      {typeof c.valor === "boolean" ? (
                        <select value={c.valor ? "sim" : "nao"}
                          onChange={(e) => setRascunho((r) => comValor(r, c.caminho, e.target.value === "sim"))}
                          className="w-full rounded-[var(--raio)] border border-white/10 bg-black/25 px-3 py-2.5 text-[15px] text-white outline-none focus:border-mb-red">
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
                        </select>
                      ) : c.longo ? (
                        <Area rows={4} value={String(c.valor)} onChange={(e) => setRascunho((r) => comValor(r, c.caminho, e.target.value))} />
                      ) : (
                        <Input type={typeof c.valor === "number" ? "number" : "text"} value={String(c.valor)}
                          onChange={(e) => setRascunho((r) => comValor(r, c.caminho, typeof c.valor === "number" ? Number(e.target.value) : e.target.value))} />
                      )}
                    </Campo>
                  ))}
                </div>
                <button type="button" onClick={() => setJson(JSON.stringify(rascunho, null, 2))}
                  className="text-xs text-white/80 underline underline-offset-2 hover:text-white">
                  Editar tudo (listas, bilhetes, resultados) em JSON
                </button>
              </>
            ) : (
              <Campo etiqueta="Dados da proposta (JSON)">
                <Area rows={12} className="font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
              </Campo>
            )}
            {erroEdicao && <p role="alert" className="border-l-2 border-mb-red pl-3 text-sm text-mb-red-light">{erroEdicao}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Botao variante="fantasma" tamanho="sm" onClick={() => setAEditar(false)}>Cancelar</Botao>
              <Botao variante="secundario" tamanho="sm" onClick={rever} disabled={aRever}>
                {aRever ? "A rever…" : "Rever proposta"}
              </Botao>
            </div>
          </div>
        )}

        {aRejeitar && aberta && (
          <div className="space-y-2 rounded-[var(--raio)] border border-white/10 bg-black/20 p-3">
            <Campo etiqueta="Porquê? (opcional, ajuda o Organizador a corrigir)">
              <Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: o preço do VIP é 25 mil" />
            </Campo>
            <div className="flex justify-end gap-2">
              <Botao variante="fantasma" tamanho="sm" onClick={() => setARejeitar(false)}>Voltar</Botao>
              <Botao variante="secundario" tamanho="sm"
                onClick={() => { setARejeitar(false); aoDecidir({ decisao: "rejeitar", nota: nota.trim() || undefined }); }}>
                <X className="size-4" aria-hidden />Rejeitar{varias ? "" : " e continuar"}
              </Botao>
            </div>
          </div>
        )}
      </div>

      {aberta && !aEditar && !aRejeitar && (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.08] bg-black/[0.12] px-4 py-3">
          <Botao variante="fantasma" tamanho="sm" onClick={abrirEdicao} disabled={bloqueado}>
            <Pencil className="size-4" aria-hidden />Editar
          </Botao>
          <Botao variante="secundario" tamanho="sm" onClick={() => setARejeitar(true)} disabled={bloqueado}>
            <X className="size-4" aria-hidden />Rejeitar
          </Botao>
          <Botao variante={proposta.destrutiva ? "perigo" : "primario"} tamanho="sm" onClick={aprovar} disabled={bloqueado}>
            <Check className="size-4" aria-hidden />{proposta.destrutiva ? "Aprovar…" : "Aprovar"}
          </Botao>
        </footer>
      )}

      <Confirmar
        aberta={aConfirmar}
        aoFechar={() => setAConfirmar(false)}
        aoConfirmar={() => aoDecidir({ decisao: "aprovar", confirmado: true })}
        perigo
        titulo="Confirmar acção destrutiva"
        textoConfirmar="Sim, executar"
        mensagem={<>Vai executar «{proposta.titulo}». Esta acção não se desfaz.</>}
      />
    </section>
  );
}
