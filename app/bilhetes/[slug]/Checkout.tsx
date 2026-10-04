"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Check, CreditCard, Landmark, Lock, Minus, Plus, Printer, QrCode, Smartphone, UserRound, type LucideIcon } from "lucide-react";
import { QRCode } from "@/components/QRCode";
import { useExigirSessao } from "@/components/SessaoObrigatoria";
import { BotaoMB, Seccao } from "@/components/painel/blocos";
import { Chip, Seta } from "@/components/painel/kit";
import { useAuth } from "@/lib/auth/contexto";
import { comBase } from "@/lib/base";
import { formatKz } from "@/lib/data";
import { eComunidade } from "@/lib/desporto";
import { intervaloDatas } from "@/lib/motobox";
import type { Evento, TipoBilhete } from "@/lib/types";
import { Etiqueta, LigacaoSeta } from "@/app/calendario/pecas";

/* Comissão que a MotoBox retém sobre cada bilhete vendido. */
const TAXA_MOTOBOX = 0.07;

type Passo = 1 | 2 | 3 | 4;

type Comprador = { nome: string; email: string; telefone: string; bi: string };

/* ---------- Compra guardada no navegador ----------
   A sessão é pedida entre os dados e o pagamento. Quem cria conta na janela
   confirma-a por email, e a ligação abre esta página de novo (em geral noutro
   separador). Para lá chegar com tudo como estava:
   · sessionStorage guarda a compra em curso (sobrevive a recarregar o separador);
   · localStorage guarda uma cópia só quando a janela abre (sem o BI), válida uma
     hora e apagada assim que é retomada ou a compra termina, para o separador
     da confirmação a encontrar.
   Nunca se guarda nada do pagamento. */

interface Rascunho {
  passo: 1 | 2;
  quantidades: Record<string, number>;
  comprador: Comprador;
  /** A janela de sessão abriu ao seguir para o pagamento: retomar logo que haja sessão. */
  aEntrar?: boolean;
  guardado: number;
}

const VALIDADE_COPIA_MS = 60 * 60 * 1000;
const chaveRascunho = (slug: string) => `motobox-checkout-${slug}`;

function lerGuardado(loja: Storage, slug: string): Partial<Rascunho> | null {
  try {
    const bruto = loja.getItem(chaveRascunho(slug));
    const v = bruto ? JSON.parse(bruto) : null;
    return v && typeof v === "object" ? (v as Partial<Rascunho>) : null;
  } catch {
    return null;
  }
}

/** Só o que faz sentido para este evento: tipos que existem, quantidades dentro dos limites. */
function limpar(v: Partial<Rascunho>, tipos: TipoBilhete[]): Omit<Rascunho, "guardado"> {
  const q = (v.quantidades ?? {}) as Record<string, unknown>;
  const quantidades = Object.fromEntries(tipos.map((t) => {
    const n = Math.trunc(Number(q[t.id]) || 0);
    return [t.id, Math.min(Math.max(0, n), Math.min(t.disponiveis, 10))];
  }));
  const c = (v.comprador ?? {}) as Record<string, unknown>;
  const campo = (k: keyof Comprador) => (typeof c[k] === "string" ? (c[k] as string).slice(0, 200) : "");
  const algum = Object.values(quantidades).some((n) => n > 0);
  return {
    passo: v.passo === 2 && algum ? 2 : 1,
    quantidades,
    comprador: { nome: campo("nome"), email: campo("email"), telefone: campo("telefone"), bi: campo("bi") },
    aEntrar: v.aEntrar === true,
  };
}

function lerRascunho(slug: string, tipos: TipoBilhete[]): Omit<Rascunho, "guardado"> | null {
  try {
    const doSeparador = lerGuardado(sessionStorage, slug);
    const copia = lerGuardado(localStorage, slug);
    const copiaValida = copia && Date.now() - Number(copia.guardado) < VALIDADE_COPIA_MS ? copia : null;
    const base = doSeparador ?? copiaValida;
    if (!base) return null;
    return { ...limpar(base, tipos), aEntrar: copiaValida?.aEntrar === true };
  } catch {
    return null;
  }
}

function escrever(loja: "session" | "local", slug: string, r: Omit<Rascunho, "guardado"> | null) {
  try {
    const s = loja === "session" ? sessionStorage : localStorage;
    if (r) s.setItem(chaveRascunho(slug), JSON.stringify({ ...r, guardado: Date.now() }));
    else s.removeItem(chaveRascunho(slug));
  } catch { /* indisponível */ }
}

function errosDe(c: Comprador): Record<string, string> {
  const e: Record<string, string> = {};
  if (c.nome.trim().length < 3) e.nome = "Indique o nome completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) e.email = "Email inválido.";
  if (c.telefone.replace(/\D/g, "").length < 9) e.telefone = "Telefone inválido.";
  return e;
}

const semSubscricao = () => () => {};

type MetodoPagamento = "multicaixa" | "transferencia" | "cartao";

const METODOS: { id: MetodoPagamento; nome: string; desc: string; Icone: LucideIcon }[] = [
  {
    id: "multicaixa",
    nome: "Multicaixa Express",
    desc: "Confirme no telemóvel. Pagamento verificado automaticamente.",
    Icone: Smartphone,
  },
  {
    id: "transferencia",
    nome: "Transferência bancária",
    desc: "Receba o IBAN e a referência. Confirmação até 24 horas.",
    Icone: Landmark,
  },
  {
    id: "cartao",
    nome: "Cartão Visa / Mastercard",
    desc: "Pagamento imediato com cartão internacional.",
    Icone: CreditCard,
  },
]

function gerarCodigo(eventoSlug: string) {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  const pref = eventoSlug.slice(0, 3).toUpperCase();
  return `MBX-${pref}-${rnd}`;
}

export function Checkout({ evento }: { evento: Evento }) {
  // O rascunho só existe no navegador: o servidor desenha a compra vazia e, logo
  // depois de hidratar, a compra volta a montar-se já com o que ficou guardado.
  const noNavegador = useSyncExternalStore(semSubscricao, () => true, () => false);
  return <Compra key={noNavegador ? "navegador" : "servidor"} evento={evento} restaurar={noNavegador} />;
}

function Compra({ evento, restaurar }: { evento: Evento; restaurar: boolean }) {
  const tipos = evento.bilhetes!;
  const slug = evento.slug;
  const { utilizador, perfil } = useAuth();
  const exigirSessao = useExigirSessao();
  const [inicial] = useState(() => (restaurar ? lerRascunho(slug, tipos) : null));
  const [passo, setPasso] = useState<Passo>(inicial?.passo ?? 1);
  const [quantidades, setQuantidades] = useState<Record<string, number>>(
    inicial?.quantidades ?? Object.fromEntries(tipos.map((t) => [t.id, 0])),
  );
  const [comprador, setComprador] = useState<Comprador>(
    inicial?.comprador ?? { nome: "", email: "", telefone: "", bi: "" },
  );
  const [metodo, setMetodo] = useState<MetodoPagamento>("multicaixa");
  const [aVerificar, setAVerificar] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [codigos, setCodigos] = useState<{ id: string; tipo: string; codigo: string }[]>([]);
  /** Veio da confirmação da conta a meio da compra: segue para o pagamento quando a sessão chegar. */
  const [retomar, setRetomar] = useState(inicial?.aEntrar ?? false);

  const linhas = useMemo(
    () =>
      tipos
        .map((t) => ({ tipo: t, qtd: quantidades[t.id] ?? 0 }))
        .filter((l) => l.qtd > 0),
    [tipos, quantidades],
  );

  const subtotal = linhas.reduce((s, l) => s + l.tipo.preco * l.qtd, 0);
  const taxa = Math.round(subtotal * TAXA_MOTOBOX);
  const total = subtotal + taxa;
  const totalBilhetes = linhas.reduce((s, l) => s + l.qtd, 0);

  function alterarQtd(id: string, delta: number) {
    setQuantidades((q) => {
      const max = tipos.find((t) => t.id === id)!.disponiveis;
      const novo = Math.min(Math.max(0, (q[id] ?? 0) + delta), Math.min(max, 10));
      return { ...q, [id]: novo };
    });
  }

  function validarComprador() {
    const e = errosDe(comprador);
    setErros(e);
    return Object.keys(e).length === 0;
  }

  // A compra em curso fica no separador; ao chegar ao bilhete, apaga-se tudo.
  useEffect(() => {
    // A montagem do servidor dura um instante e vem vazia: não pode apagar o rascunho.
    if (!restaurar) return;
    if (passo === 4) {
      escrever("session", slug, null);
      escrever("local", slug, null);
      return;
    }
    const algo = totalBilhetes > 0 || Object.values(comprador).some((v) => v.trim());
    // No pagamento guarda-se o passo dos dados: nada do pagamento fica guardado.
    escrever("session", slug, algo ? { passo: passo === 1 ? 1 : 2, quantidades, comprador } : null);
  }, [restaurar, passo, quantidades, comprador, totalBilhetes, slug]);

  // A cópia para o separador da confirmação só serve uma vez e só durante uma hora.
  // Quem a apaga é quem a usa: o separador original também recebe a sessão (o
  // Supabase avisa os outros separadores) e, se a apagasse ao seguir, podia
  // fazê-lo antes de o separador da confirmação a ler.
  useEffect(() => {
    if (!restaurar) return;
    const copia = lerGuardado(localStorage, slug);
    const expirada = copia && !(Date.now() - Number(copia.guardado) < VALIDADE_COPIA_MS);
    if (inicial?.aEntrar || expirada) escrever("local", slug, null);
  }, [restaurar, inicial, slug]);

  // Chegou com a conta acabada de confirmar: a sessão aparece um instante depois
  // de a página abrir e a compra segue para o pagamento, como na janela.
  if (retomar && utilizador) {
    setRetomar(false);
    if (passo === 2 && totalBilhetes > 0 && Object.keys(errosDe(comprador)).length === 0) setPasso(3);
  }

  const emailConta = utilizador?.email ?? "";
  const nomeMeta = utilizador?.user_metadata?.nome;
  const nomeConta = perfil?.nome || (typeof nomeMeta === "string" ? nomeMeta : "");

  function irParaDados() {
    // Com sessão e o email ainda vazio, parte-se dos dados da conta; o que a
    // pessoa já escreveu nunca é substituído.
    if (emailConta && !comprador.email.trim()) {
      setComprador((c) => ({
        ...c,
        nome: c.nome.trim() ? c.nome : nomeConta,
        email: emailConta,
        telefone: c.telefone.trim() ? c.telefone : perfil?.telefone ?? "",
      }));
    }
    setPasso(2);
  }

  function irParaPagamento() {
    setPasso(3);
  }

  function seguirParaPagamento() {
    if (!validarComprador()) return;
    const jaTinhaSessao = exigirSessao(() => irParaPagamento(), {
      continuar: true,
      motivo: "Entre ou crie conta para concluir a compra. O que escolheu e escreveu fica tudo como está.",
    });
    // Sem sessão: se criar conta, a confirmação chega por email e abre esta página
    // de novo. Fica uma cópia para essa página retomar a compra onde estava
    // (sem o BI, que é opcional e o dado mais sensível).
    if (!jaTinhaSessao) {
      escrever("local", slug, { passo: 2, quantidades, comprador: { ...comprador, bi: "" }, aEntrar: true });
    }
  }

  async function pagar() {
    setAVerificar(true);
    // ATENÇÃO: o pagamento é simulado. Não há ligação a nenhum meio de pagamento,
    // os códigos são gerados aqui no navegador, nada fica gravado (nem em
    // `encomendas`, nem na conta do comprador) e não sai nenhum email. Por isso o
    // ecrã final só mostra os bilhetes e pede para os guardar. Quem ligar o
    // pagamento real trata das três coisas no servidor (pagamento, gravação da
    // encomenda, envio do bilhete) e só depois volta a prometer email e conta.
    await new Promise((r) => setTimeout(r, 2200));
    const emitidos = linhas.flatMap((l) =>
      Array.from({ length: l.qtd }, (_, i) => ({
        id: `${l.tipo.id}-${i}`,
        tipo: l.tipo.nome,
        codigo: gerarCodigo(evento.slug),
      })),
    );
    setCodigos(emitidos);
    setAVerificar(false);
    setPasso(4);
  }

  const passos = [
    { n: 1, label: "Bilhetes" },
    { n: 2, label: "Dados" },
    { n: 3, label: "Pagamento" },
    { n: 4, label: "Bilhete" },
  ];

  /** Botão principal do resumo: vermelho e largo, como o BotaoMB. */
  const botaoPrincipal =
    "group inline-flex h-14 w-full items-center justify-between gap-4 rounded-[var(--raio)] bg-mb-red px-5 text-[15px] text-white transition-colors hover:bg-mb-red-dark disabled:pointer-events-none disabled:opacity-40";
  const botaoVoltar =
    "inline-flex h-11 w-full items-center justify-center rounded-[var(--raio)] text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-40";

  return (
    <Seccao>
      <LigacaoSeta href="/bilhetes">Todos os bilhetes</LigacaoSeta>

      {/* Indicador de passos */}
      <ol className="mt-8 flex items-center gap-2 md:gap-3" aria-label="Progresso da compra">
        {passos.map((p, i) => {
          const activo = passo === p.n;
          const feito = passo > p.n;
          return (
            <li key={p.n} className={`flex items-center gap-2 md:gap-3 ${i < passos.length - 1 ? "flex-1" : ""}`}>
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-[4px] text-sm font-semibold tabular-nums transition-colors ${
                  feito ? "bg-white text-black" : activo ? "bg-mb-red text-white" : "bg-white/8 text-white/50"
                }`}
                aria-current={activo ? "step" : undefined}
              >
                {feito ? <Check className="size-4" aria-label="Concluído" /> : p.n}
              </span>
              <span className={`sr-only sm:not-sr-only sm:text-sm ${activo ? "text-white" : feito ? "text-white/75" : "text-white/45"}`}>
                {p.label}
              </span>
              {i < passos.length - 1 && (
                <span className={`h-px flex-1 ${feito ? "bg-white/60" : "bg-white/12"}`} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      <div className={`mt-10 grid gap-10 lg:items-start lg:gap-8 ${passo < 4 ? "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : ""}`}>
        {/* ---------- Coluna principal ---------- */}
        <div className="min-w-0">
          {/* PASSO 1 — escolher bilhetes */}
          {passo === 1 && (
            <section>
              <h2 className="titulo-4">Escolha os seus bilhetes</h2>
              <ul className="mt-6 grid gap-[var(--intervalo)]">
                {tipos.map((t) => {
                  const qtd = quantidades[t.id] ?? 0;
                  return (
                    <li
                      key={t.id}
                      className={`painel painel-escuro p-5 transition-shadow md:p-6 ${qtd > 0 ? "ring-2 ring-inset ring-mb-red" : ""}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div className="min-w-0 flex-1 basis-64">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{t.nome}</h3>
                            {t.destaque && <Etiqueta tom="vermelho">Mais procurado</Etiqueta>}
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-white/70">{t.descricao}</p>
                          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                            {t.beneficios.map((b) => (
                              <li key={b} className="inline-flex items-center gap-1.5 text-xs text-white/70">
                                <Check className="size-3.5 shrink-0 text-mb-red-light" aria-hidden />
                                {b}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-xs text-white/45">
                            <span className="tabular-nums">{t.disponiveis.toLocaleString("pt-PT")}</span> disponíveis · máx. 10 por compra
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-5 sm:flex-col sm:items-end sm:gap-3">
                          <p className="text-2xl font-semibold tabular-nums">{formatKz(t.preco)}</p>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => alterarQtd(t.id, -1)}
                              disabled={qtd === 0}
                              aria-label={`Menos um bilhete ${t.nome}`}
                              className="grid size-10 place-items-center rounded-[4px] bg-white/8 text-white transition-colors hover:bg-mb-red disabled:pointer-events-none disabled:opacity-30"
                            >
                              <Minus className="size-4" aria-hidden />
                            </button>
                            <span className="w-10 text-center text-lg font-semibold tabular-nums" aria-live="polite">
                              {qtd}
                            </span>
                            <button
                              type="button"
                              onClick={() => alterarQtd(t.id, 1)}
                              disabled={qtd >= Math.min(t.disponiveis, 10)}
                              aria-label={`Mais um bilhete ${t.nome}`}
                              className="grid size-10 place-items-center rounded-[4px] bg-white/8 text-white transition-colors hover:bg-mb-red disabled:pointer-events-none disabled:opacity-30"
                            >
                              <Plus className="size-4" aria-hidden />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* PASSO 2 — dados do comprador */}
          {passo === 2 && (
            <section>
              <h2 className="titulo-4">Os seus dados</h2>
              <div className="painel painel-escuro mt-6 space-y-5 p-6 md:p-8">
                {(
                  [
                    { k: "nome", label: "Nome completo", tipo: "text", ph: "Como aparece no seu BI", req: true },
                    { k: "email", label: "Email", tipo: "email", ph: "nome@exemplo.com", req: true },
                    { k: "telefone", label: "Telemóvel", tipo: "tel", ph: "+244 9xx xxx xxx", req: true },
                    { k: "bi", label: "Nº do BI (opcional)", tipo: "text", ph: "para validação à entrada", req: false },
                  ] as const
                ).map((c) => (
                  <div key={c.k}>
                    <label htmlFor={`f-${c.k}`} className="mb-2 block text-sm text-white/75">
                      {c.label} {c.req && <span className="text-mb-red-light">*</span>}
                    </label>
                    <input
                      id={`f-${c.k}`}
                      type={c.tipo}
                      value={comprador[c.k]}
                      onChange={(e) => {
                        setComprador({ ...comprador, [c.k]: e.target.value });
                        setErros((x) => ({ ...x, [c.k]: "" }));
                      }}
                      placeholder={c.ph}
                      aria-invalid={Boolean(erros[c.k])}
                      aria-describedby={erros[c.k] ? `erro-${c.k}` : undefined}
                      className={`campo ${erros[c.k] ? "!border-mb-red" : ""}`}
                    />
                    {erros[c.k] && (
                      <p id={`erro-${c.k}`} className="mt-1.5 text-xs text-mb-red-light">
                        {erros[c.k]}
                      </p>
                    )}
                  </div>
                ))}

                {emailConta && (
                  <p className="flex gap-2.5 text-sm leading-relaxed text-white/60">
                    <UserRound className="size-4 shrink-0 translate-y-0.5 text-white/45" aria-hidden />
                    <span>
                      <span>Sessão iniciada como</span> <span className="text-white">{emailConta}</span>
                    </span>
                  </p>
                )}

                <p className="flex gap-2.5 border-t border-white/8 pt-5 text-sm leading-relaxed text-white/60">
                  <Lock className="size-4 shrink-0 translate-y-0.5 text-white/45" aria-hidden />
                  Os seus dados servem apenas para emitir e validar o bilhete. Não são partilhados com terceiros.
                </p>
              </div>
            </section>
          )}

          {/* PASSO 3 — pagamento */}
          {passo === 3 && (
            <section>
              <h2 className="titulo-4">Método de pagamento</h2>
              <div className="mt-6 grid gap-[var(--intervalo)]">
                {METODOS.map((m) => (
                  <label
                    key={m.id}
                    className={`painel painel-escuro flex cursor-pointer items-start gap-4 p-5 transition-colors ${
                      metodo === m.id ? "ring-2 ring-inset ring-mb-red" : "hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodo"
                      checked={metodo === m.id}
                      onChange={() => setMetodo(m.id)}
                      className="mt-3 size-4 shrink-0 accent-[#e10600]"
                    />
                    <span className="grid size-10 shrink-0 place-items-center rounded-[4px] bg-white/8 text-mb-red-light">
                      <m.Icone className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{m.nome}</span>
                      <span className="mt-0.5 block text-sm text-white/60">{m.desc}</span>
                    </span>
                  </label>
                ))}
              </div>

              {/* Detalhe por método */}
              <div className="painel painel-escuro mt-[var(--intervalo)] p-6">
                {metodo === "multicaixa" && (
                  <>
                    <p className="mb-3 font-semibold">Multicaixa Express</p>
                    <p className="text-sm leading-relaxed text-white/70">
                      Ao confirmar, enviamos um pedido de pagamento para o número{" "}
                      <span className="text-white">{comprador.telefone || "que indicou"}</span>. Aprove no telemóvel e o
                      bilhete é emitido automaticamente.
                    </p>
                  </>
                )}
                {metodo === "transferencia" && (
                  <>
                    <p className="mb-3 font-semibold">Dados para transferência</p>
                    <dl className="divide-y divide-white/8 text-sm">
                      {[
                        ["Beneficiário", "MotoBox Angola"],
                        ["IBAN", "AO06 0000 0000 0000 0000 0000 0"],
                        ["Banco", "Banco Atlântico"],
                        ["Referência", `MBX-${evento.slug.slice(0, 6).toUpperCase()}`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                          <dt className="shrink-0 text-white/55">{k}</dt>
                          <dd className="min-w-0 break-words text-right font-mono text-white">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-4 text-xs text-white/50">
                      Envie o comprovativo para geral@motobox.ao. O bilhete é emitido após confirmação.
                    </p>
                  </>
                )}
                {metodo === "cartao" && (
                  <>
                    <p className="mb-3 font-semibold">Dados do cartão</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        placeholder="Número do cartão"
                        aria-label="Número do cartão"
                        inputMode="numeric"
                        autoComplete="off"
                        className="campo sm:col-span-2"
                      />
                      <input placeholder="MM / AA" aria-label="Validade (MM / AA)" inputMode="numeric" autoComplete="off" className="campo" />
                      <input placeholder="CVV" aria-label="CVV" inputMode="numeric" autoComplete="off" className="campo" />
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs text-white/50">
                      <Lock className="size-3.5" aria-hidden />
                      Ligação encriptada. A MotoBox não guarda dados de cartão.
                    </p>
                  </>
                )}
              </div>
            </section>
          )}

          {/* PASSO 4 — bilhetes emitidos */}
          {passo === 4 && (
            <section data-bilhetes className="max-w-4xl">
              {/* Ao imprimir, sai só esta secção, a preto sobre branco. */}
              <style>{`@media print {
                html, body { background: #fff !important; }
                body * { visibility: hidden !important; }
                [data-bilhetes], [data-bilhetes] * { visibility: visible !important; color: #000 !important; background: transparent !important; box-shadow: none !important; }
                [data-bilhetes] { position: absolute; inset: 0 auto auto 0; width: 100%; }
                [data-bilhetes] [data-nao-imprimir] { display: none !important; }
                [data-bilhetes] article { border: 1px solid #000; break-inside: avoid; }
                [data-bilhetes] [data-qr], [data-bilhetes] [data-qr] * { background: #fff !important; }
              }`}</style>

              <div className="painel painel-escuro flex flex-col items-start gap-5 p-6 md:p-8">
                <Chip grande>
                  <Check />
                </Chip>
                <div>
                  <h2 className="titulo-3">Pagamento confirmado</h2>
                  <p className="mt-3 text-[15px] text-white/75">
                    Emitimos {codigos.length} {codigos.length === 1 ? "bilhete" : "bilhetes"}.
                  </p>
                  {/* Nada é enviado nem gravado (ver `pagar`): esta página é a única cópia. */}
                  <p className="mt-1 text-[15px] text-white/75">Guarde ou imprima esta página agora: é a sua única cópia.</p>
                </div>
              </div>

              <div className="mt-[var(--intervalo)] grid gap-[var(--intervalo)]">
                {codigos.map((b) => (
                  <article key={b.id} className="painel painel-escuro grid sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0 p-6">
                      <div className="flex items-center justify-between gap-3">
                        <Image
                          src={comBase("/marca/mb-marca-480.png")}
                          alt="MotoBox"
                          width={480}
                          height={244}
                          unoptimized
                          className="w-14"
                        />
                        <Etiqueta tom="vermelho">{b.tipo}</Etiqueta>
                      </div>
                      <h3 className="mt-5 text-xl font-semibold leading-tight">{evento.titulo}</h3>
                      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
                        {[
                          ["Data", intervaloDatas(evento.dataInicio, evento.dataFim)],
                          ["Local", evento.circuito],
                          ["Portador", comprador.nome],
                          ["Código", b.codigo],
                        ].map(([k, v]) => (
                          <div key={k} className="min-w-0">
                            <dt className="text-xs text-white/50">{k}</dt>
                            <dd className={`mt-0.5 break-words text-sm ${k === "Código" ? "font-mono" : ""}`}>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div
                      data-qr
                      className="flex flex-col items-center justify-center gap-3 border-t border-dashed border-white/20 p-6 sm:border-l sm:border-t-0"
                    >
                      <QRCode valor={b.codigo} size={150} className="!rounded-[4px]" />
                      <p className="font-mono text-[11px] text-white/55">{b.codigo}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div data-nao-imprimir className="mt-8 flex flex-wrap gap-[var(--intervalo)]">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="group inline-flex h-14 w-full max-w-[20.5rem] items-center justify-between gap-6 rounded-[var(--raio)] bg-mb-red px-5 text-[15px] text-white transition-colors hover:bg-mb-red-dark"
                >
                  Guardar / imprimir
                  <Printer className="size-4" aria-hidden />
                </button>
                {eComunidade(evento.disciplina) ? (
                  <BotaoMB href="/eventos" variante="escuro">
                    Voltar aos eventos
                  </BotaoMB>
                ) : (
                  <BotaoMB href="/calendario" variante="escuro">
                    Voltar ao calendário
                  </BotaoMB>
                )}
              </div>

              <p className="mt-6 flex gap-2.5 text-sm leading-relaxed text-white/60">
                <QrCode className="size-4 shrink-0 translate-y-0.5 text-white/45" aria-hidden />
                Apresente o código QR à entrada, no telemóvel ou impresso. Cada código só pode ser validado uma vez.
              </p>
            </section>
          )}
        </div>

        {/* ---------- Resumo (barra lateral) ---------- */}
        {passo < 4 && (
          <aside className="lg:sticky lg:top-8">
            <div className="painel painel-escuro p-6">
              <h2 className="text-lg font-semibold">Resumo</h2>

              {linhas.length === 0 ? (
                <p className="py-6 text-sm text-white/50">Ainda não escolheu bilhetes.</p>
              ) : (
                <>
                  <ul className="mt-4 space-y-3">
                    {linhas.map((l) => (
                      <li key={l.tipo.id} className="flex justify-between gap-3 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate">{l.tipo.nome}</span>
                          <span className="text-xs tabular-nums text-white/50">
                            {l.qtd} × {formatKz(l.tipo.preco)}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums">{formatKz(l.tipo.preco * l.qtd)}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-5 space-y-2.5 border-t border-white/8 pt-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-white/55">Subtotal</dt>
                      <dd className="tabular-nums text-white/85">{formatKz(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-white/55">
                        Taxa de serviço
                        <span className="ml-1 text-xs text-white/40">({(TAXA_MOTOBOX * 100).toFixed(0)}%)</span>
                      </dt>
                      <dd className="tabular-nums text-white/85">{formatKz(taxa)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 border-t border-white/8 pt-3">
                      <dt className="font-semibold">Total</dt>
                      <dd className="text-2xl font-semibold tabular-nums">{formatKz(total)}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-xs leading-relaxed text-white/45">
                    A taxa de serviço sustenta a plataforma e é retida pela MotoBox. O restante reverte para o
                    organizador da prova.
                  </p>
                </>
              )}

              {/* Navegação */}
              <div className="mt-6 space-y-[var(--intervalo)]">
                {passo === 1 && (
                  <button type="button" className={botaoPrincipal} disabled={totalBilhetes === 0} onClick={irParaDados}>
                    Continuar
                    <Seta para="direita" className="size-3.5" />
                  </button>
                )}
                {passo === 2 && (
                  <>
                    <button type="button" className={botaoPrincipal} onClick={seguirParaPagamento}>
                      Ir para pagamento
                      <Seta para="direita" className="size-3.5" />
                    </button>
                    <button type="button" className={botaoVoltar} onClick={() => setPasso(1)}>
                      Voltar
                    </button>
                  </>
                )}
                {passo === 3 && (
                  <>
                    <button type="button" className={botaoPrincipal} disabled={aVerificar} onClick={pagar}>
                      {aVerificar ? (
                        <>
                          A verificar pagamento…
                          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                        </>
                      ) : (
                        <>
                          <span className="tabular-nums">Pagar {formatKz(total)}</span>
                          <Lock className="size-4" aria-hidden />
                        </>
                      )}
                    </button>
                    <button type="button" className={botaoVoltar} disabled={aVerificar} onClick={() => setPasso(2)}>
                      Voltar
                    </button>
                  </>
                )}
              </div>

              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/45">
                <Lock className="size-3.5" aria-hidden />
                Pagamento seguro · Bilhete digital imediato
              </p>
            </div>
          </aside>
        )}
      </div>
    </Seccao>
  );
}
