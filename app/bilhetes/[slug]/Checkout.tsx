"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Logo, Placeholder } from "@/components/Brand";
import { QRCode } from "@/components/QRCode";
import { useExigirSessao } from "@/components/SessaoObrigatoria";
import { Button, ButtonLink, Icon, Tag } from "@/components/ui";
import { useAuth } from "@/lib/auth/contexto";
import { formatData, formatKz } from "@/lib/data";
import type { Evento, TipoBilhete } from "@/lib/types";

/* Comissão que a Motobox retém sobre cada bilhete vendido. */
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

const METODOS: { id: MetodoPagamento; nome: string; desc: string; icone: string }[] = [
  {
    id: "multicaixa",
    nome: "Multicaixa Express",
    desc: "Confirme no telemóvel. Pagamento verificado automaticamente.",
    icone: "check",
  },
  {
    id: "transferencia",
    nome: "Transferência bancária",
    desc: "Receba o IBAN e a referência. Confirmação até 24 horas.",
    icone: "download",
  },
  {
    id: "cartao",
    nome: "Cartão Visa / Mastercard",
    desc: "Pagamento imediato com cartão internacional.",
    icone: "lock",
  },
];

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
    // Simulação do ciclo de verificação automática do pagamento.
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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* Cabeçalho do evento */}
      <Link
        href="/bilhetes"
        className="inline-flex items-center gap-2 font-ui text-sm text-ink-400 hover:text-white transition-colors"
      >
        <span aria-hidden>←</span> Todos os bilhetes
      </Link>

      <div className="mt-5 relative overflow-hidden rounded-card">
        <Placeholder nome={[evento.slug, evento.imagem]} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 to-ink-950/60" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            {evento.ronda && <Tag tone="red">Ronda {evento.ronda}</Tag>}
            <Tag tone="outline">{evento.disciplina}</Tag>
          </div>
          <h1 className="title-xl mt-3 text-2xl sm:text-4xl">{evento.titulo}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" className="size-4 text-mb-red" />
              {formatData(evento.dataInicio)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="pin" className="size-4 text-mb-red" />
              {evento.circuito}, {evento.provincia}
            </span>
          </p>
        </div>
      </div>

      {/* Indicador de passos */}
      <ol className="mt-8 flex items-center gap-1 sm:gap-2" aria-label="Progresso da compra">
        {passos.map((p, i) => {
          const activo = passo === p.n;
          const feito = passo > p.n;
          return (
            <li key={p.n} className="flex flex-1 items-center gap-1 sm:gap-2">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full font-display text-sm transition-colors ${
                  feito ? "bg-ok text-white" : activo ? "bg-mb-red text-white" : "bg-ink-800 text-ink-500"
                }`}
                aria-current={activo ? "step" : undefined}
              >
                {feito ? <Icon name="check" className="size-4" /> : p.n}
              </span>
              <span
                className={`hidden sm:block font-ui text-sm ${
                  activo ? "text-white" : feito ? "text-ink-300" : "text-ink-500"
                }`}
              >
                {p.label}
              </span>
              {i < passos.length - 1 && (
                <span className={`h-0.5 flex-1 rounded-full ${feito ? "bg-ok" : "bg-ink-800"}`} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* ---------- Coluna principal ---------- */}
        <div>
          {/* PASSO 1 — escolher bilhetes */}
          {passo === 1 && (
            <section className="space-y-3">
              <h2 className="eyebrow accent-bar text-white">Escolha os seus bilhetes</h2>
              {tipos.map((t) => {
                const qtd = quantidades[t.id] ?? 0;
                return (
                  <div
                    key={t.id}
                    className={`card p-5 transition-shadow ${
                      qtd > 0 ? "ring-2 ring-inset ring-mb-red/70" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg uppercase text-white">{t.nome}</h3>
                          {t.destaque && <Tag tone="red" className="!text-[9px]">Mais procurado</Tag>}
                        </div>
                        <p className="mt-1.5 text-sm text-ink-400">{t.descricao}</p>
                        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                          {t.beneficios.map((b) => (
                            <li key={b} className="inline-flex items-center gap-1.5 text-xs text-ink-400">
                              <Icon name="check" className="size-3.5 text-mb-red shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-[11px] text-ink-600">
                          {t.disponiveis.toLocaleString("pt-PT")} disponíveis · máx. 10 por compra
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-display text-2xl text-white">{formatKz(t.preco)}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => alterarQtd(t.id, -1)}
                            disabled={qtd === 0}
                            aria-label={`Menos um bilhete ${t.nome}`}
                            className="grid size-9 place-items-center rounded-full bg-ink-800 text-white transition-colors hover:bg-mb-red disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <span aria-hidden>−</span>
                          </button>
                          <span className="w-9 text-center font-display text-lg text-white tabular-nums">
                            {qtd}
                          </span>
                          <button
                            onClick={() => alterarQtd(t.id, 1)}
                            disabled={qtd >= Math.min(t.disponiveis, 10)}
                            aria-label={`Mais um bilhete ${t.nome}`}
                            className="grid size-9 place-items-center rounded-full bg-ink-800 text-white transition-colors hover:bg-mb-red disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Icon name="plus" className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* PASSO 2 — dados do comprador */}
          {passo === 2 && (
            <section>
              <h2 className="eyebrow accent-bar text-white">Os seus dados</h2>
              <div className="card p-6 space-y-4">
                {(
                  [
                    { k: "nome", label: "Nome completo", tipo: "text", ph: "Como aparece no seu BI", req: true },
                    { k: "email", label: "Email", tipo: "email", ph: "para receber o bilhete", req: true },
                    { k: "telefone", label: "Telemóvel", tipo: "tel", ph: "+244 9xx xxx xxx", req: true },
                    { k: "bi", label: "Nº do BI (opcional)", tipo: "text", ph: "para validação à entrada", req: false },
                  ] as const
                ).map((c) => (
                  <div key={c.k}>
                    <label htmlFor={`f-${c.k}`} className="eyebrow block text-ink-500 mb-2">
                      {c.label} {c.req && <span className="text-mb-red">*</span>}
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
                      className={`h-12 w-full bg-ink-950 px-4 text-sm text-white ring-inset placeholder:text-ink-600 outline-none transition-shadow ${
                        erros[c.k] ? "ring-2 ring-mb-red" : "ring-1 ring-white/10 focus:ring-2 focus:ring-mb-red"
                      }`}
                    />
                    {erros[c.k] && <p className="mt-1.5 text-xs text-mb-red-light">{erros[c.k]}</p>}
                  </div>
                ))}

                {emailConta && (
                  <p className="flex gap-2.5 text-xs text-ink-500 leading-relaxed">
                    <Icon name="user" className="size-4 shrink-0 text-ink-600" />
                    <span>
                      <span>Sessão iniciada como</span>{" "}
                      <span className="text-ink-200">{emailConta}</span>
                      {comprador.email.trim() && comprador.email.trim().toLowerCase() !== emailConta.toLowerCase() && (
                        <span className="block">O bilhete segue para o email indicado acima.</span>
                      )}
                    </span>
                  </p>
                )}

                <p className="flex gap-2.5 border-t border-white/6 pt-4 text-xs text-ink-500 leading-relaxed">
                  <Icon name="lock" className="size-4 shrink-0 text-ink-600" />
                  Os seus dados servem apenas para emitir e validar o bilhete. Não são partilhados com
                  terceiros.
                </p>
              </div>
            </section>
          )}

          {/* PASSO 3 — pagamento */}
          {passo === 3 && (
            <section>
              <h2 className="eyebrow accent-bar text-white">Método de pagamento</h2>
              <div className="space-y-3">
                {METODOS.map((m) => (
                  <label
                    key={m.id}
                    className={`card flex cursor-pointer items-start gap-4 p-5 transition-colors ${
                      metodo === m.id ? "ring-2 ring-inset ring-mb-red/70" : "card-hover"
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodo"
                      checked={metodo === m.id}
                      onChange={() => setMetodo(m.id)}
                      className="mt-1 size-4 shrink-0 accent-[#e10600]"
                    />
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-800 text-mb-red">
                      <Icon name={m.icone} className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-base uppercase text-white">{m.nome}</span>
                      <span className="mt-0.5 block text-sm text-ink-500">{m.desc}</span>
                    </span>
                  </label>
                ))}
              </div>

              {/* Detalhe por método */}
              <div className="card mt-4 p-5">
                {metodo === "multicaixa" && (
                  <>
                    <p className="eyebrow text-mb-red mb-3">Multicaixa Express</p>
                    <p className="text-sm text-ink-400 leading-relaxed">
                      Ao confirmar, enviamos um pedido de pagamento para o número{" "}
                      <span className="text-white">{comprador.telefone || "que indicou"}</span>. Aprove
                      no telemóvel e o bilhete é emitido automaticamente.
                    </p>
                  </>
                )}
                {metodo === "transferencia" && (
                  <>
                    <p className="eyebrow text-mb-red mb-3">Dados para transferência</p>
                    <dl className="space-y-2.5 text-sm">
                      {[
                        ["Beneficiário", "Motobox Angola"],
                        ["IBAN", "AO06 0000 0000 0000 0000 0000 0"],
                        ["Banco", "Banco Atlântico"],
                        ["Referência", `MBX-${evento.slug.slice(0, 6).toUpperCase()}`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 border-b border-white/6 pb-2.5 last:border-0">
                          <dt className="text-ink-500">{k}</dt>
                          <dd className="font-mono text-white text-right">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-4 text-xs text-ink-600">
                      Envie o comprovativo para geral@motobox.ao. O bilhete é emitido após confirmação.
                    </p>
                  </>
                )}
                {metodo === "cartao" && (
                  <>
                    <p className="eyebrow text-mb-red mb-3">Dados do cartão</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        placeholder="Número do cartão"
                        inputMode="numeric"
                        className="h-11 sm:col-span-2 bg-ink-950 px-4 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 focus:ring-2 focus:ring-mb-red outline-none"
                      />
                      <input
                        placeholder="MM / AA"
                        inputMode="numeric"
                        className="h-11 bg-ink-950 px-4 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 focus:ring-2 focus:ring-mb-red outline-none"
                      />
                      <input
                        placeholder="CVV"
                        inputMode="numeric"
                        className="h-11 bg-ink-950 px-4 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 focus:ring-2 focus:ring-mb-red outline-none"
                      />
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs text-ink-600">
                      <Icon name="lock" className="size-3.5" />
                      Ligação encriptada. A Motobox não guarda dados de cartão.
                    </p>
                  </>
                )}
              </div>
            </section>
          )}

          {/* PASSO 4 — bilhetes emitidos */}
          {passo === 4 && (
            <section>
              <div className="card bg-ok/8 p-6 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-ok/20 text-ok">
                  <Icon name="check" className="size-7" />
                </span>
                <h2 className="mt-4 title-xl text-2xl">Pagamento confirmado</h2>
                <p className="mt-2 text-sm text-ink-400">
                  Emitimos {codigos.length} {codigos.length === 1 ? "bilhete" : "bilhetes"} e enviámos
                  uma cópia para <span className="text-white">{comprador.email}</span>.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {codigos.map((b) => (
                  <article key={b.id} className="relative overflow-hidden rounded-card bg-ink-900">
                    {/* Recorte de bilhete */}
                    <div className="absolute left-0 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-950" aria-hidden />
                    <div className="absolute right-0 top-1/2 size-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-950" aria-hidden />

                    <div className="flex flex-col sm:flex-row">
                      <div className="min-w-0 flex-1 p-6">
                        <div className="flex items-center justify-between gap-3">
                          <Logo height={20} className="text-white" />
                          <Tag tone="red">{b.tipo}</Tag>
                        </div>
                        <h3 className="mt-4 font-display text-xl uppercase leading-tight text-white">
                          {evento.titulo}
                        </h3>
                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                          {[
                            ["Data", formatData(evento.dataInicio, { day: "2-digit", month: "short", year: "numeric" })],
                            ["Local", evento.circuito],
                            ["Portador", comprador.nome],
                            ["Código", b.codigo],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <dt className="eyebrow text-ink-600">{k}</dt>
                              <dd className={`mt-0.5 text-sm text-white ${k === "Código" ? "font-mono" : ""}`}>
                                {v}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      <div className="flex flex-col items-center justify-center gap-3 border-t-2 border-dashed border-ink-950 p-6 sm:border-l-2 sm:border-t-0">
                        <QRCode valor={b.codigo} size={150} />
                        <p className="font-mono text-[11px] text-ink-500">{b.codigo}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => window.print()}>
                  <Icon name="download" className="size-4" />
                  Guardar / imprimir
                </Button>
                <ButtonLink href="/conta" variant="dark">
                  Ver na minha conta
                </ButtonLink>
                <ButtonLink href="/calendario" variant="ghost">
                  Voltar ao calendário
                </ButtonLink>
              </div>

              <p className="mt-6 flex gap-2.5 text-xs text-ink-500 leading-relaxed">
                <Icon name="qr" className="size-4 shrink-0 text-ink-600" />
                Apresente o código QR à entrada, no telemóvel ou impresso. Cada código só pode ser
                validado uma vez.
              </p>
            </section>
          )}
        </div>

        {/* ---------- Resumo (barra lateral) ---------- */}
        {passo < 4 && (
          <aside className="lg:sticky lg:top-24">
            <div className="card p-5">
              <h2 className="eyebrow text-mb-red mb-4">Resumo</h2>

              {linhas.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-600">
                  Ainda não escolheu bilhetes.
                </p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {linhas.map((l) => (
                      <li key={l.tipo.id} className="flex justify-between gap-3 text-sm">
                        <span className="min-w-0">
                          <span className="block text-white truncate">{l.tipo.nome}</span>
                          <span className="text-xs text-ink-600">
                            {l.qtd} × {formatKz(l.tipo.preco)}
                          </span>
                        </span>
                        <span className="shrink-0 text-white tabular-nums">
                          {formatKz(l.tipo.preco * l.qtd)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-5 space-y-2.5 border-t border-white/6 pt-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink-500">Subtotal</dt>
                      <dd className="text-ink-200 tabular-nums">{formatKz(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-500">
                        Taxa de serviço
                        <span className="ml-1 text-xs text-ink-600">({(TAXA_MOTOBOX * 100).toFixed(0)}%)</span>
                      </dt>
                      <dd className="text-ink-200 tabular-nums">{formatKz(taxa)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-white/6 pt-3">
                      <dt className="font-display text-base uppercase text-white">Total</dt>
                      <dd className="font-display text-xl text-white tabular-nums">{formatKz(total)}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-[11px] text-ink-600 leading-relaxed">
                    A taxa de serviço sustenta a plataforma e é retida pela Motobox. O restante
                    reverte para o organizador da prova.
                  </p>
                </>
              )}

              {/* Navegação */}
              <div className="mt-5 space-y-2">
                {passo === 1 && (
                  <Button
                    className="w-full"
                    disabled={totalBilhetes === 0}
                    onClick={irParaDados}
                  >
                    Continuar
                    <Icon name="arrow" className="size-4" />
                  </Button>
                )}
                {passo === 2 && (
                  <>
                    <Button
                      className="w-full"
                      onClick={seguirParaPagamento}
                    >
                      Ir para pagamento
                      <Icon name="arrow" className="size-4" />
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setPasso(1)}>
                      Voltar
                    </Button>
                  </>
                )}
                {passo === 3 && (
                  <>
                    <Button className="w-full" disabled={aVerificar} onClick={pagar}>
                      {aVerificar ? (
                        <>
                          <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          A verificar pagamento…
                        </>
                      ) : (
                        <>
                          <Icon name="lock" className="size-4" />
                          Pagar {formatKz(total)}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      disabled={aVerificar}
                      onClick={() => setPasso(2)}
                    >
                      Voltar
                    </Button>
                  </>
                )}
              </div>

              <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-ink-600">
                <Icon name="lock" className="size-3.5" />
                Pagamento seguro · Bilhete digital imediato
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
