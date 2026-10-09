"use client";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA
   Conversa com o Claude, que faz no painel o que a equipa
   pede: consulta, prepara e propõe. As respostas chegam em
   streaming; o que o Organizador está a consultar aparece em
   linhas curtas; cada mudança chega como proposta, com o antes
   e o depois, para Aprovar, Rejeitar ou Editar. Só depois de
   aprovada é executada (e fica no registo de actividade).

   Sem a chave da API no servidor, a página mostra como ligar o
   Organizador; o resto do painel funciona normalmente.
   ============================================================ */

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  CheckCircle2, CircleAlert, ExternalLink, FileUp, KeyRound, Loader2, MessageSquarePlus, Paperclip, Send,
  ShieldCheck, Sparkles, Square, X,
} from "lucide-react";
import { Aviso, Botao, CabecalhoPagina, Carregando, Painel, Etiqueta } from "@/components/admin/kit";
import { useAuth } from "@/lib/auth/contexto";
import { comBase } from "@/lib/base";
import { PAPEIS } from "@/lib/admin/types";
import {
  PASSOS_LIGAR, SUGESTOES,
  type Anexo, type Decisao, type EstadoOrganizador, type EventoOrganizador, type Proposta,
} from "@/lib/admin/organizador/tipos";
import { novoIdItem, useConversa, type Conversa, type Item } from "./conversa";
import { CartaoProposta } from "./CartaoProposta";
import { Texto } from "./Texto";

const ACEITES = "image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/csv";
const LIMITE_BYTES = 3 * 1024 * 1024;

type Estado = { tipo: "a-verificar" } | { tipo: "pronto"; info: EstadoOrganizador } | { tipo: "falhou"; mensagem: string };

interface AnexoLocal extends Anexo { bytes: number }

function lerFicheiro(f: File): Promise<AnexoLocal> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const url = String(leitor.result);
      resolve({ nome: f.name, tipo: f.type || "application/octet-stream", dados: url.slice(url.indexOf(",") + 1), bytes: f.size });
    };
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(f);
  });
}

/* ---------------- Eventos do streaming → itens da conversa ---------------- */

function aplicarEvento(c: Conversa, e: EventoOrganizador): Conversa {
  const itens = [...c.itens];
  const ultimo = itens[itens.length - 1];
  switch (e.tipo) {
    case "texto":
      if (ultimo?.tipo === "resposta") itens[itens.length - 1] = { ...ultimo, texto: ultimo.texto + e.texto };
      else itens.push({ tipo: "resposta", id: novoIdItem("r"), texto: e.texto });
      return { ...c, itens };
    case "progresso":
      if (ultimo?.tipo === "progresso" && !e.novo) itens[itens.length - 1] = { ...ultimo, texto: ultimo.texto + e.texto };
      else itens.push({ tipo: "progresso", id: novoIdItem("g"), texto: e.texto });
      return { ...c, itens };
    case "ferramenta": {
      const i = itens.findIndex((x) => x.tipo === "ferramenta" && x.id === e.id);
      if (i >= 0) itens[i] = { ...(itens[i] as Extract<Item, { tipo: "ferramenta" }>), rotulo: e.rotulo };
      else itens.push({ tipo: "ferramenta", id: e.id, rotulo: e.rotulo, estado: "a-correr" });
      return { ...c, itens };
    }
    case "ferramenta-fim": {
      const i = itens.findIndex((x) => x.tipo === "ferramenta" && x.id === e.id);
      if (i >= 0) itens[i] = { ...(itens[i] as Extract<Item, { tipo: "ferramenta" }>), estado: e.ok ? "ok" : "erro", resumo: e.resumo };
      return { ...c, itens };
    }
    case "proposta": {
      // A linha "a preparar a proposta" dá lugar ao cartão.
      const semLinha = itens.filter((x) => !(x.tipo === "ferramenta" && x.id === e.proposta.id));
      return { ...c, itens: [...semLinha, { tipo: "proposta", id: e.proposta.id, proposta: e.proposta, estado: "pendente" }] };
    }
    case "executado": {
      const i = itens.findIndex((x) => x.tipo === "proposta" && x.id === e.id);
      if (i >= 0) {
        itens[i] = {
          ...(itens[i] as Extract<Item, { tipo: "proposta" }>),
          estado: e.ok ? "executada" : "falhou",
          resultado: { ok: e.ok, titulo: e.titulo, resumo: e.resumo, ligacoes: e.ligacoes },
        };
      }
      return { ...c, itens };
    }
    case "historico":
      return { ...c, historico: [...c.historico, ...e.mensagens] };
    case "erro":
      return { ...c, itens: [...itens, { tipo: "aviso", id: novoIdItem("e"), texto: e.mensagem, tom: "erro" }] };
    case "fim": {
      // Linhas de ferramenta que ficaram a meio já não vão terminar.
      const fechados = itens.map((x): Item => {
        if (x.tipo === "ferramenta" && x.estado === "a-correr") return { ...x, estado: "erro" };
        if (x.tipo === "proposta" && x.estado === "a-executar") return { ...x, estado: "falhou" };
        return x;
      });
      if (e.motivo === "limite") {
        fechados.push({ tipo: "aviso", id: novoIdItem("a"), tom: "info", texto: "O Organizador parou ao fim de várias voltas para não gastar demasiado. Escreva «continua» para seguir." });
      } else if (e.motivo === "cortado") {
        fechados.push({ tipo: "aviso", id: novoIdItem("a"), tom: "info", texto: "A resposta ficou cortada por ser demasiado longa. Peça para continuar ou divida o pedido." });
      }
      return { ...c, itens: fechados };
    }
  }
}

/* ---------------- Página ---------------- */

export default function OrganizadorPage() {
  const { perfil, utilizador } = useAuth();
  const [conversa, mudar] = useConversa(perfil?.id ?? utilizador?.id ?? "sessao");
  const [estado, setEstado] = useState<Estado>({ tipo: "a-verificar" });
  const [texto, setTexto] = useState("");
  const [anexos, setAnexos] = useState<AnexoLocal[]>([]);
  const [aCorrer, setACorrer] = useState(false);
  const [decisoes, setDecisoes] = useState<Record<string, Decisao>>({});
  const [avisoAnexos, setAvisoAnexos] = useState<string | null>(null);
  const controlo = useRef<AbortController | null>(null);
  const fim = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLTextAreaElement>(null);
  const entradaFicheiros = useRef<HTMLInputElement>(null);

  // Estado do Organizador (chave, papel). A resposta chega depois: não é setState síncrono.
  useEffect(() => {
    let vivo = true;
    fetch(comBase("/api/admin/organizador"), { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!vivo) return;
        if (r.ok && j) setEstado({ tipo: "pronto", info: j as EstadoOrganizador });
        else setEstado({ tipo: "falhou", mensagem: String(j?.erro ?? `Erro ${r.status}`) });
      })
      .catch(() => { if (vivo) setEstado({ tipo: "falhou", mensagem: "Não foi possível contactar o servidor." }); });
    // O rascunho da versão antiga do Organizador já não serve.
    try { localStorage.removeItem("motobox-organizador-v1"); } catch { /* indisponível */ }
    return () => { vivo = false; };
  }, []);

  // Acompanha o fim da conversa enquanto chegam respostas.
  const totalItens = conversa.itens.length;
  const ultimoTexto = conversa.itens[totalItens - 1];
  const tamanhoUltimo = ultimoTexto && "texto" in ultimoTexto ? ultimoTexto.texto.length : 0;
  useEffect(() => {
    if (!aCorrer) return;
    fim.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [aCorrer, totalItens, tamanhoUltimo]);

  const info = estado.tipo === "pronto" ? estado.info : null;
  const pendentes = conversa.itens.filter((x): x is Extract<Item, { tipo: "proposta" }> => x.tipo === "proposta" && (x.estado === "pendente" || x.estado === "decidida"));
  const varias = pendentes.length > 1;
  const decididas = pendentes.filter((p) => decisoes[p.id]).length;

  /** Envia um pedido (texto e/ou decisões) e lê a resposta em streaming. */
  const enviar = async (opcoes: { texto?: string; anexos?: AnexoLocal[]; decisoes?: Decisao[] }) => {
    const t = (opcoes.texto ?? "").trim();
    const lista = opcoes.anexos ?? [];
    const ds = opcoes.decisoes ?? [];
    if (aCorrer || (!t && lista.length === 0 && pendentes.length === 0)) return;

    const historico = conversa.historico;
    const idPedido = novoIdItem("p");
    const textoNovo = Boolean(t || lista.length);
    const porId = new Map(ds.map((d) => [d.id, d]));
    const idsPendentes = new Set(pendentes.map((p) => p.id));

    mudar((c) => ({
      ...c,
      itens: [
        ...c.itens.map((x): Item => {
          if (x.tipo !== "proposta" || (x.estado !== "pendente" && x.estado !== "decidida")) return x;
          const d = porId.get(x.id);
          if (!d) return { ...x, estado: "sem-decisao" };
          return { ...x, decisao: d, estado: d.decisao === "rejeitar" ? "rejeitada" : "a-executar" };
        }),
        ...(textoNovo ? [{ tipo: "pedido" as const, id: idPedido, texto: t, anexos: lista.map((a) => a.nome) }] : []),
      ],
    }));
    setDecisoes({});
    setACorrer(true);
    if (textoNovo) { setTexto(""); setAnexos([]); }

    const ctrl = new AbortController();
    controlo.current = ctrl;
    let recebeuHistorico = false;
    let comprometidas = 0;
    const devolverTexto = () => {
      // O pedido não ficou na conversa: o texto volta à caixa.
      if (!textoNovo || comprometidas > 0) return;
      mudar((c) => ({ ...c, itens: c.itens.filter((x) => x.id !== idPedido) }));
      setTexto(t);
      setAnexos(lista);
    };

    try {
      const r = await fetch(comBase("/api/admin/organizador"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accao: "conversar", historico, texto: t || undefined,
          anexos: lista.length ? lista.map(({ nome, tipo, dados }) => ({ nome, tipo, dados })) : undefined,
          decisoes: ds.length ? ds : undefined,
        }),
        signal: ctrl.signal,
      });
      if (!r.ok || !r.body) {
        const j = await r.json().catch(() => null);
        const mensagem = String(j?.erro ?? (r.status === 504 ? "O pedido demorou demasiado. Tente de novo." : `Erro ${r.status}`));
        if (r.status === 503 && /ANTHROPIC_API_KEY/.test(mensagem)) {
          setEstado((s) => (s.tipo === "pronto" ? { tipo: "pronto", info: { ...s.info, configurado: false } } : s));
        }
        // Recusado antes de começar: nada foi executado, as propostas voltam a estar por decidir.
        mudar((c) => ({
          ...c,
          itens: [...c.itens.map((x): Item => (x.tipo === "proposta" && idsPendentes.has(x.id) ? { ...x, estado: "pendente", decisao: undefined } : x)),
            { tipo: "aviso", id: novoIdItem("e"), tom: "erro", texto: mensagem }],
        }));
        devolverTexto();
        return;
      }
      const leitor = r.body.getReader();
      const descodificador = new TextDecoder();
      let resto = "";
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        resto += descodificador.decode(value, { stream: true });
        let i: number;
        while ((i = resto.indexOf("\n")) >= 0) {
          const linha = resto.slice(0, i).trim();
          resto = resto.slice(i + 1);
          if (!linha) continue;
          let e: EventoOrganizador;
          try { e = JSON.parse(linha) as EventoOrganizador; } catch { continue; }
          if (e.tipo === "historico") { recebeuHistorico = true; comprometidas = e.mensagens.length; }
          mudar((c) => aplicarEvento(c, e));
        }
      }
      if (!recebeuHistorico) {
        mudar((c) => ({ ...c, itens: [...c.itens, { tipo: "aviso", id: novoIdItem("e"), tom: "erro", texto: "A ligação caiu antes do fim. O que ficou a meio não conta para a conversa." }] }));
      }
      devolverTexto();
    } catch (e) {
      const parado = e instanceof DOMException && e.name === "AbortError";
      mudar((c) => ({
        ...c,
        itens: [...c.itens.map((x): Item => (x.tipo === "ferramenta" && x.estado === "a-correr" ? { ...x, estado: "erro" } : x)),
          { tipo: "aviso", id: novoIdItem("e"), tom: parado ? "info" : "erro", texto: parado ? "Parado. O que ficou a meio não conta para a conversa." : "Não foi possível contactar o servidor. Verifique a ligação." }],
      }));
      devolverTexto();
    } finally {
      controlo.current = null;
      setACorrer(false);
    }
  };

  const enviarTexto = () => void enviar({
    texto,
    anexos,
    decisoes: Object.values(decisoes).filter((d) => pendentes.some((p) => p.id === d.id)),
  });

  const decidir = (p: Proposta, d: { decisao: "aprovar" | "rejeitar"; confirmado?: boolean; nota?: string }, entradaEditada?: Record<string, unknown>) => {
    const decisao: Decisao = { id: p.id, ...d, assinatura: p.assinatura, ...(entradaEditada ? { entrada: entradaEditada } : {}) };
    if (!varias) { void enviar({ decisoes: [decisao] }); return; }
    setDecisoes((x) => ({ ...x, [p.id]: decisao }));
    mudar((c) => ({ ...c, itens: c.itens.map((x) => (x.tipo === "proposta" && x.id === p.id ? { ...x, estado: "decidida" } : x)) }));
  };

  const enviarDecisoes = () => {
    const ds = pendentes.map((p) => decisoes[p.id]).filter(Boolean) as Decisao[];
    void enviar({ decisoes: ds });
  };

  const aprovarTodas = () => {
    const ds: Record<string, Decisao> = { ...decisoes };
    for (const p of pendentes) {
      if (!ds[p.id] && !p.proposta.destrutiva) {
        ds[p.id] = { id: p.id, decisao: "aprovar", assinatura: p.proposta.assinatura, ...(p.editada ? { entrada: p.proposta.entrada } : {}) };
      }
    }
    setDecisoes(ds);
    mudar((c) => ({ ...c, itens: c.itens.map((x) => (x.tipo === "proposta" && ds[x.id] && x.estado === "pendente" ? { ...x, estado: "decidida" } : x)) }));
  };

  const rever = async (item: Extract<Item, { tipo: "proposta" }>, entrada: Record<string, unknown>): Promise<string | null> => {
    try {
      const r = await fetch(comBase("/api/admin/organizador"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accao: "rever", id: item.id, ferramenta: item.proposta.ferramenta, entrada }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.proposta) return String(j?.erro ?? `Erro ${r.status}`);
      const nova = j.proposta as Proposta;
      mudar((c) => ({ ...c, itens: c.itens.map((x) => (x.tipo === "proposta" && x.id === item.id ? { ...x, proposta: nova, editada: true, estado: "pendente" } : x)) }));
      setDecisoes((x) => { const y = { ...x }; delete y[item.id]; return y; });
      return null;
    } catch {
      return "Não foi possível contactar o servidor.";
    }
  };

  const novaConversa = () => {
    controlo.current?.abort();
    mudar(() => ({ historico: [], itens: [] }));
    setDecisoes({});
    setTexto("");
    setAnexos([]);
  };

  const juntarAnexos = async (ficheiros: FileList | null) => {
    if (!ficheiros?.length) return;
    const novos = await Promise.all(Array.from(ficheiros).map(lerFicheiro));
    const total = [...anexos, ...novos].reduce((s, a) => s + a.bytes, 0);
    if (total > LIMITE_BYTES) { setAvisoAnexos("Os anexos passam de 3 MB. Envie menos ficheiros de cada vez."); return; }
    setAvisoAnexos(null);
    setAnexos((a) => [...a, ...novos]);
  };

  const teclas = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviarTexto();
    }
  };

  const usarSugestao = (s: string) => {
    setTexto(s);
    caixa.current?.focus();
  };

  const papel = PAPEIS.find((p) => p.valor === info?.papel)?.nome ?? info?.papel ?? "";
  const vazia = conversa.itens.length === 0;

  return (
    <>
      <CabecalhoPagina
        titulo="Organizador IA"
        sobretitulo="Visão geral"
        icone={<Sparkles />}
        descricao="Peça o que precisa em português: criar um evento com bilhetes, publicar resultados, pôr algo em foco, responder a mensagens. O Organizador consulta os dados, prepara as mudanças e mostra-as para aprovar. Nada muda sem a sua aprovação."
        accoes={!vazia && info?.configurado ? (
          <Botao variante="secundario" onClick={novaConversa}>
            <MessageSquarePlus className="size-4" aria-hidden />Nova conversa
          </Botao>
        ) : undefined}
      />

      {estado.tipo === "a-verificar" && <Painel><Carregando texto="A ligar ao Organizador…" /></Painel>}
      {estado.tipo === "falhou" && <Aviso tom="erro" titulo="Não foi possível abrir o Organizador">{estado.mensagem}</Aviso>}
      {info && !info.configurado && <ComoLigar />}

      {info?.configurado && (
        <div className="grid grid-cols-1 gap-[var(--intervalo)] xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section aria-label="Conversa com o Organizador" className="painel painel-escuro flex min-h-[70vh] min-w-0 flex-col">
            <div className="flex-1 space-y-3 px-4 py-5 md:px-6" aria-live="polite" aria-busy={aCorrer}>
              {!info.baseDados && (
                <Aviso tom="atencao" titulo="Modo de demonstração">
                  Sem base de dados ligada: o Organizador consulta os dados de exemplo e nada pode ser gravado.
                </Aviso>
              )}
              {vazia ? (
                <Boas vindas={perfil?.nome?.split(/\s+/)[0]} usar={usarSugestao} podeEscrever={info.podeEscrever} />
              ) : (
                conversa.itens.map((item) => (
                  <ItemConversa key={item.id} item={item} bloqueado={aCorrer} varias={varias}
                    decisaoLocal={item.tipo === "proposta" ? decisoes[item.id]?.decisao : undefined}
                    aoDecidir={(d) => item.tipo === "proposta" && decidir(item.proposta, d, item.editada ? item.proposta.entrada : undefined)}
                    aoRever={(entrada) => (item.tipo === "proposta" ? rever(item, entrada) : Promise.resolve(null))} />
                ))
              )}
              {aCorrer && (
                <p role="status" className="flex items-center gap-2 text-sm text-white/75">
                  <Loader2 className="size-4 animate-spin text-mb-red-light" aria-hidden />A trabalhar…
                </p>
              )}
              <div ref={fim} />
            </div>

            <div className="sticky bottom-0 z-10 border-t border-white/[0.08] bg-[rgb(36_36_42/0.96)] px-4 py-3 backdrop-blur md:px-6">
              {varias && pendentes.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[var(--raio)] border border-white/10 bg-black/25 px-3 py-2">
                  <p className="text-sm text-white/75">
                    {pendentes.length} propostas à espera · <span className="tabular-nums">{decididas}</span> decididas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Botao tamanho="sm" variante="fantasma" onClick={aprovarTodas} disabled={aCorrer}>Aprovar as restantes</Botao>
                    <Botao tamanho="sm" variante="primario" onClick={enviarDecisoes} disabled={aCorrer || decididas === 0}>
                      Enviar decisões
                    </Botao>
                  </div>
                </div>
              )}
              {pendentes.length > 0 && !varias && (
                <p className="mb-2 text-xs text-white/75">Há uma proposta por decidir. Se escrever outra mensagem, fica por aprovar.</p>
              )}
              {anexos.length > 0 && (
                <ul className="mb-2 flex flex-wrap gap-1.5">
                  {anexos.map((a, i) => (
                    <li key={`${a.nome}-${i}`} className="inline-flex max-w-full items-center gap-1.5 rounded-[4px] bg-white/[0.08] px-2 py-1 text-xs text-white/80">
                      <Paperclip className="size-3 shrink-0" aria-hidden />
                      <span className="truncate">{a.nome}</span>
                      <button type="button" onClick={() => setAnexos((l) => l.filter((_, j) => j !== i))}
                        className="rounded-[3px] p-0.5 text-white/75 hover:bg-mb-red hover:text-white" aria-label={`Remover ${a.nome}`}>
                        <X className="size-3" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {avisoAnexos && <p role="alert" className="mb-2 text-xs text-mb-red-light">{avisoAnexos}</p>}
              <div className="flex items-end gap-2">
                <input ref={entradaFicheiros} type="file" accept={ACEITES} multiple className="hidden"
                  onChange={(e) => { void juntarAnexos(e.target.files); e.target.value = ""; }} />
                <Botao variante="fantasma" className="!px-3" onClick={() => entradaFicheiros.current?.click()} disabled={aCorrer}
                  aria-label="Anexar imagem, PDF ou texto" title="Anexar imagem, PDF ou texto">
                  <FileUp className="size-5" aria-hidden />
                </Botao>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Mensagem para o Organizador</span>
                  <textarea
                    ref={caixa} rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={teclas}
                    placeholder="Ex.: Cria o passeio de sábado à Barra do Kwanza, saída às 7h, entrada livre"
                    className="max-h-48 min-h-11 w-full resize-y rounded-[var(--raio)] border border-white/10 bg-black/30 px-3 py-2.5 text-[15px] leading-relaxed text-white outline-none placeholder:text-white/55 focus:border-mb-red"
                  />
                </label>
                {aCorrer ? (
                  <Botao variante="secundario" onClick={() => controlo.current?.abort()} aria-label="Parar">
                    <Square className="size-4" aria-hidden /><span className="hidden sm:inline">Parar</span>
                  </Botao>
                ) : (
                  <Botao variante="primario" onClick={enviarTexto} disabled={!texto.trim() && anexos.length === 0} aria-label="Enviar">
                    <Send className="size-4" aria-hidden /><span className="hidden sm:inline">Enviar</span>
                  </Botao>
                )}
              </div>
              <p className="mt-1.5 hidden text-[11px] text-white/70 sm:block">Enter envia · Shift+Enter muda de linha · a conversa fica só neste separador</p>
            </div>
          </section>

          <aside className="flex min-w-0 flex-col gap-[var(--intervalo)]">
            <Painel titulo="Pedidos rápidos" icone={<Sparkles />}>
              <ul className="space-y-1.5">
                {SUGESTOES.map((s) => (
                  <li key={s.titulo}>
                    <button type="button" onClick={() => usarSugestao(s.texto)} disabled={aCorrer}
                      className="w-full rounded-[var(--raio)] bg-white/[0.06] px-3 py-2.5 text-left text-sm text-white/85 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-50">
                      {s.titulo}
                    </button>
                  </li>
                ))}
              </ul>
            </Painel>
            <Painel titulo="Como funciona" icone={<ShieldCheck />}>
              <ul className="space-y-2 text-sm leading-relaxed text-white/70">
                <li>Consultar é imediato. Cada mudança chega como proposta, com o antes e o depois.</li>
                <li>Só é executada depois de carregar em <strong className="text-white">Aprovar</strong>. Apagar pede sempre confirmação.</li>
                <li>Tudo o que é executado fica na <Link href="/admin/atividade" className="text-mb-red-light underline underline-offset-2">Actividade</Link>, em seu nome.</li>
              </ul>
              {info.papel && (
                <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/75">
                  <Etiqueta>{papel}</Etiqueta>
                  {info.podeEscrever ? "pode aprovar mudanças" : "só consulta"}
                </p>
              )}
            </Painel>
          </aside>
        </div>
      )}
    </>
  );
}

/* ---------------- Peças ---------------- */

function Boas({ vindas, usar, podeEscrever }: { vindas?: string; usar: (s: string) => void; podeEscrever: boolean }) {
  return (
    <div className="mx-auto max-w-2xl py-6 text-center md:py-10">
      <span className="chip-mb chip-mb-lg mx-auto"><Sparkles aria-hidden /></span>
      <h2 className="mt-4 text-xl font-semibold text-white">{vindas ? `Olá, ${vindas}. ` : ""}Em que posso ajudar?</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/80">
        {podeEscrever
          ? "Diga o que precisa como diria a um colega. Eu consulto o painel, preparo as mudanças e mostro-as para aprovar."
          : "O seu papel permite consultar: posso procurar, resumir e explicar o que está no painel."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGESTOES.map((s) => (
          <button key={s.titulo} type="button" onClick={() => usar(s.texto)} className="pilula">{s.titulo}</button>
        ))}
      </div>
    </div>
  );
}

function ItemConversa({ item, bloqueado, varias, decisaoLocal, aoDecidir, aoRever }: {
  item: Item;
  bloqueado: boolean;
  varias: boolean;
  decisaoLocal?: "aprovar" | "rejeitar";
  aoDecidir: (d: { decisao: "aprovar" | "rejeitar"; confirmado?: boolean; nota?: string }) => void;
  aoRever: (entrada: Record<string, unknown>) => Promise<string | null>;
}) {
  switch (item.tipo) {
    case "pedido":
      return (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-[var(--raio)] bg-mb-red/[0.22] px-4 py-2.5 text-[15px] leading-relaxed text-white">
            {item.texto && <p className="whitespace-pre-wrap break-words">{item.texto}</p>}
            {item.anexos && item.anexos.length > 0 && (
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/70">
                {item.anexos.map((a) => <span key={a} className="inline-flex items-center gap-1"><Paperclip className="size-3" aria-hidden />{a}</span>)}
              </p>
            )}
          </div>
        </div>
      );
    case "resposta":
      return <div className="max-w-[92%]"><Texto texto={item.texto} /></div>;
    case "progresso":
      return <p className="border-l-2 border-white/15 pl-3 text-sm italic leading-relaxed text-white/75">{item.texto}</p>;
    case "ferramenta":
      return (
        <p className="flex items-start gap-2 text-[13px] text-white/80">
          {item.estado === "a-correr" ? <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-white/75" aria-hidden />
            : item.estado === "ok" ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#4ade80]" aria-hidden />
            : <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden />}
          <span className="min-w-0 break-words">
            {item.rotulo}{item.resumo && item.estado !== "a-correr" ? <span className="text-white/70"> · {item.resumo}</span> : null}
          </span>
        </p>
      );
    case "proposta":
      return (
        <CartaoProposta proposta={item.proposta} estado={item.estado} editada={item.editada} resultado={item.resultado}
          bloqueado={bloqueado} varias={varias} decisaoLocal={decisaoLocal} aoDecidir={aoDecidir} aoRever={aoRever} />
      );
    case "aviso":
      return <Aviso tom={item.tom === "erro" ? "erro" : "info"}>{item.texto}</Aviso>;
  }
}

function ComoLigar() {
  return (
    <div className="grid grid-cols-1 gap-[var(--intervalo)] xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Painel titulo="Como ligar o Organizador" icone={<KeyRound />}
        descricao="Falta a chave da API do Claude no servidor. São dois minutos e só se faz uma vez. O resto do painel continua a funcionar normalmente.">
        <ol className="space-y-4">
          {PASSOS_LIGAR.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold text-white tabular-nums">{i + 1}</span>
              <p className="min-w-0 pt-0.5 text-[15px] leading-relaxed text-white/80">{p}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 rounded-[var(--raio)] border border-white/10 bg-black/30 px-4 py-3">
          <p className="text-xs text-white/75">Nome da variável no Vercel</p>
          <p className="mt-1 break-all font-mono text-[15px] text-white">ANTHROPIC_API_KEY</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-[var(--raio)] bg-mb-red px-4 text-sm font-medium text-white hover:bg-mb-red-dark">
            <ExternalLink className="size-4" aria-hidden />Criar a chave<span className="sr-only"> (abre numa nova janela)</span>
          </a>
          <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-[var(--raio)] bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/[0.16]">
            <ExternalLink className="size-4" aria-hidden />Abrir o Vercel<span className="sr-only"> (abre numa nova janela)</span>
          </a>
        </div>
      </Painel>
      <Painel titulo="O que vai poder pedir" icone={<Sparkles />}>
        <ul className="space-y-2 text-sm leading-relaxed text-white/70">
          {SUGESTOES.map((s) => <li key={s.titulo} className="border-l-2 border-mb-red/60 pl-3">{s.titulo}</li>)}
          <li className="border-l-2 border-white/15 pl-3">E tudo o resto do painel: pilotos, equipas, clubes, artigos, páginas, definições, moderação.</li>
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-white/75">Cada mudança aparece para aprovar antes de ser feita.</p>
      </Painel>
    </div>
  );
}
