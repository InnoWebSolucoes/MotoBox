"use client";

/* ============================================================
   MOTOBOX — Área de conta
   Tudo o que aqui aparece vem da conta de quem tem sessão:
   perfil, bilhetes (encomendas com o email da conta),
   preferências, notificações e anúncios próprios. As
   preferências guardam-se sozinhas a cada clique, e o separador
   aberto fica no endereço (?aba=), para sobreviver a um reload.
   ============================================================ */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Logo, Placeholder, Retrato } from "@/components/Brand";
import { QRCode } from "@/components/QRCode";
import { Button, ButtonLink, Icon, Tag } from "@/components/ui";
import { formatData, formatKz } from "@/lib/data";
import { useAuth } from "@/lib/auth/contexto";
import {
  MARCAS, CANAIS_ACTIVOS, PREFERENCIAS_PADRAO,
  type Preferencias, type TipoNotificacao, type Canal,
} from "@/lib/conta/preferencias";
import type { AnuncioMarketplace, Equipa, Evento, Noticia, Piloto } from "@/lib/types";
import type { Encomenda } from "@/lib/admin/types";

type Aba = "resumo" | "bilhetes" | "preferencias" | "notificacoes" | "anuncios";

const ABAS: { id: Aba; label: string; icone: string }[] = [
  { id: "resumo", label: "Resumo", icone: "user" },
  { id: "bilhetes", label: "Bilhetes", icone: "ticket" },
  { id: "preferencias", label: "Preferências", icone: "settings" },
  { id: "notificacoes", label: "Notificações", icone: "bell" },
  { id: "anuncios", label: "Anúncios", icone: "tag" },
];

const PROVINCIAS = [
  "Luanda", "Benguela", "Huíla", "Huambo", "Namibe",
  "Cabinda", "Malanje", "Bengo", "Cuanza Sul",
];

interface PerfilConta {
  id: string; nome: string; email: string; telefone: string | null; provincia: string | null;
  avatar_cor: string; registado: string; verificado: boolean; newsletter: boolean; estado: string;
}

interface DadosConta {
  perfil: PerfilConta | null;
  email: string;
  preferencias: Preferencias;
  encomendas: Encomenda[];
  anuncios: AnuncioMarketplace[];
}

type EstadoGravacao = "parado" | "a-guardar" | "guardado" | "erro";

function iniciais(n: string) {
  return n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const campo =
  "h-11 w-full bg-ink-950 px-3.5 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 outline-none transition-shadow focus:ring-2 focus:ring-mb-red";

export function ContaClient({
  eventos, pilotos, equipas, noticias,
}: {
  eventos: Evento[];
  pilotos: Piloto[];
  equipas: Equipa[];
  noticias: Noticia[];
}) {
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();
  const { utilizador, carregando, sair, recarregarPerfil } = useAuth();

  const pedida = parametros.get("aba");
  const aba: Aba = ABAS.some((a) => a.id === pedida) ? (pedida as Aba) : "resumo";
  const setAba = (a: Aba) => router.replace(`${caminho}?aba=${a}`, { scroll: false });

  const [dados, setDados] = useState<DadosConta | null>(null);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Preferencias>(PREFERENCIAS_PADRAO);
  const [gravacao, setGravacao] = useState<EstadoGravacao>("parado");
  const [editarPerfil, setEditarPerfil] = useState(false);
  const [formAnuncio, setFormAnuncio] = useState<AnuncioMarketplace | "novo" | null>(null);
  const [aSair, setASair] = useState(false);

  const aplicar = useCallback((r: { dados?: DadosConta; erro?: string }) => {
    if (r.erro) { setErroCarregar(r.erro); return; }
    setDados(r.dados!);
    setPrefs(r.dados!.preferencias);
    setErroCarregar(null);
  }, []);

  const carregar = useCallback(async () => aplicar(await lerConta()), [aplicar]);

  useEffect(() => {
    if (!utilizador) return;
    let vivo = true;
    lerConta().then((r) => { if (vivo) aplicar(r); });
    return () => { vivo = false; };
  }, [utilizador, aplicar]);

  /* ---------- Preferências: guardam-se sozinhas ---------- */
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mudarPrefs = (proximas: Preferencias) => {
    setPrefs(proximas);
    setGravacao("a-guardar");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      try {
        const r = await fetch("/api/conta", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferencias: proximas }),
        });
        setGravacao(r.ok ? "guardado" : "erro");
      } catch {
        setGravacao("erro");
      }
    }, 500);
  };
  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);

  const alternar = (chave: "pilotos" | "equipas" | "marcas", valor: string) => {
    const lista = prefs[chave];
    mudarPrefs({ ...prefs, [chave]: lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor] });
  };

  const terminarSessao = async () => {
    setASair(true);
    await sair();
    window.location.replace("/");
  };

  if (carregando || (utilizador && !dados && !erroCarregar)) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="card h-40 animate-pulse" />
        <div className="mt-6 h-12 animate-pulse rounded-full bg-ink-900" />
      </div>
    );
  }

  if (!utilizador || erroCarregar || !dados) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-sm text-ink-400">{erroCarregar ?? "Precisa de entrar para ver a sua conta."}</p>
        <ButtonLink href="/entrar?destino=/conta" className="mt-5">Entrar</ButtonLink>
      </div>
    );
  }

  const perfil = dados.perfil;
  const nome = perfil?.nome || dados.email;
  const bilhetes = dados.encomendas.filter((e) => e.estado !== "cancelado" && e.estado !== "reembolsado");
  const hoje = new Date().toISOString().slice(0, 10);
  const bilhetesComEvento = bilhetes.map((b) => ({ ...b, evento: eventos.find((e) => e.slug === b.eventoSlug) }));
  const validos = bilhetesComEvento.filter(
    (b) => b.estado === "pago" && (!b.evento || b.evento.dataFim >= hoje),
  );
  const anunciosActivos = dados.anuncios.length;

  // Notícias dos pilotos, equipas e marcas seguidos; sem nada seguido, as mais recentes.
  const termos = [
    ...pilotos.filter((p) => prefs.pilotos.includes(p.slug)).map((p) => p.nome),
    ...equipas.filter((e) => prefs.equipas.includes(e.slug)).map((e) => e.nome),
    ...prefs.marcas,
  ].map((t) => t.toLowerCase());
  const relevantes = termos.length
    ? noticias.filter((n) => termos.some((t) => `${n.titulo} ${n.resumo} ${n.tags.join(" ")}`.toLowerCase().includes(t)))
    : [];
  const feed = (relevantes.length ? relevantes : noticias).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Cabeçalho do perfil */}
      <header className="card overflow-hidden">
        <div className="relative h-28">
          <Placeholder nome="kilamba" className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>
        {/* `relative` põe esta faixa por cima da imagem, que está posicionada. */}
        <div className="relative flex flex-wrap items-end gap-5 px-6 pb-6 -mt-10">
          <span className="grid size-20 shrink-0 place-items-center rounded-full font-display text-2xl text-white ring-4 ring-ink-900"
            style={{ backgroundColor: perfil?.avatar_cor ?? "#e10600" }}>
            {iniciais(nome)}
          </span>
          <div className="min-w-0 flex-1 basis-56">
            <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl uppercase leading-tight text-white break-words">
              {nome}
              {perfil?.verificado && <Icon name="verified" className="size-5 shrink-0 text-ok" />}
            </h1>
            <p className="mt-0.5 text-sm text-ink-500 break-words">
              {dados.email}
              {perfil?.provincia ? ` · ${perfil.provincia}` : ""}
              {perfil?.registado ? ` · membro desde ${perfil.registado.slice(0, 4)}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditarPerfil(true)}>
              <Icon name="settings" className="size-4" />
              Editar perfil
            </Button>
            <Button variant="ghost" size="sm" onClick={terminarSessao} disabled={aSair}>
              <Icon name="logout" className="size-4" />
              {aSair ? "A sair…" : "Sair"}
            </Button>
          </div>
        </div>
      </header>

      {/* Abas */}
      <nav className="mt-6 flex gap-1 overflow-x-auto no-scrollbar border-b border-white/6">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            aria-pressed={aba === a.id}
            className="tab gap-2"
          >
            <Icon name={a.icone} className="size-4" />
            {a.label}
          </button>
        ))}
      </nav>

      <div className="py-8">
        {/* ---------- RESUMO ---------- */}
        {aba === "resumo" && (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { v: validos.length, l: "Bilhetes activos", i: "ticket", a: "bilhetes" as Aba },
                  { v: prefs.pilotos.length + prefs.equipas.length, l: "A seguir", i: "bell", a: "preferencias" as Aba },
                  { v: anunciosActivos, l: "Anúncios activos", i: "tag", a: "anuncios" as Aba },
                ].map((s) => (
                  <button key={s.l} onClick={() => setAba(s.a)} className="card card-hover p-5 text-left">
                    <span className="grid size-9 place-items-center rounded-full bg-mb-red/12 text-mb-red">
                      <Icon name={s.i} className="size-4.5" />
                    </span>
                    <p className="mt-3 font-display text-3xl text-white">{s.v}</p>
                    <p className="eyebrow mt-0.5 text-ink-600">{s.l}</p>
                  </button>
                ))}
              </div>

              {validos[0]?.evento && (
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="eyebrow text-mb-red">Próximo evento</h2>
                    <button onClick={() => setAba("bilhetes")} className="font-ui text-sm text-white transition-colors hover:text-mb-red">
                      Todos →
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-5">
                    <QRCode valor={validos[0].codigoQR || validos[0].referencia} size={110} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-xl uppercase leading-tight text-white">{validos[0].evento.titulo}</p>
                      <p className="mt-1.5 text-sm text-ink-400">
                        {validos[0].tipoBilheteNome} · {validos[0].quantidade}{" "}
                        {validos[0].quantidade === 1 ? "bilhete" : "bilhetes"}
                      </p>
                      <p className="mt-1 text-xs text-ink-600">
                        {formatData(validos[0].evento.dataInicio)} · {validos[0].evento.circuito}
                      </p>
                      <p className="mt-2 font-mono text-xs text-ink-500">{validos[0].referencia}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="card p-6">
                <h2 className="eyebrow text-mb-red mb-1">Para si</h2>
                <p className="text-xs text-ink-600 mb-5">
                  {relevantes.length
                    ? "Com base nos pilotos, equipas e marcas que segue."
                    : "As notícias mais recentes. Siga pilotos, equipas e marcas para personalizar."}
                </p>
                <div>
                  {feed.map((n) => (
                    <Link key={n.slug} href={`/noticias/${n.slug}`} className="group flex gap-3.5 border-b border-white/6 py-3 first:pt-0 last:border-0 last:pb-0">
                      <Placeholder nome={[n.slug, n.imagem]} className="media size-16 shrink-0" tamanhos="64px" />
                      <div className="min-w-0 flex-1">
                        <p className="eyebrow text-mb-red">{n.categoria}</p>
                        <p className="mt-1 text-sm text-white line-clamp-2 group-hover:text-mb-red transition-colors">{n.titulo}</p>
                        <p className="mt-1 text-[11px] text-ink-600">{formatData(n.data, { day: "2-digit", month: "short" })}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="card p-5">
                <h2 className="eyebrow text-mb-red mb-4">Pilotos que segue</h2>
                {prefs.pilotos.length === 0 && (
                  <p className="text-sm text-ink-500">Ainda não segue nenhum piloto.</p>
                )}
                <div className="space-y-3">
                  {pilotos.filter((p) => prefs.pilotos.includes(p.slug)).map((p) => (
                    <Link key={p.slug} href={`/pilotos/${p.slug}`} className="group flex items-center gap-3">
                      <Retrato nome={p.slug} iniciais={iniciais(p.nome)}
                        className="size-10 shrink-0 rounded-full [container-type:size]" tamanhos="40px" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white group-hover:text-mb-red transition-colors">{p.nome}</p>
                        <p className="truncate text-xs text-ink-600">{p.equipa}</p>
                      </div>
                      <span className="font-display text-sm text-white tabular-nums">{p.estatisticas.pontos}</span>
                    </Link>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setAba("preferencias")}>
                  Gerir
                </Button>
              </div>

              <div className="card p-5">
                <h2 className="eyebrow text-mb-red mb-3">Fórum</h2>
                <p className="text-sm text-ink-500">Tire dúvidas e partilhe com a comunidade motard.</p>
                <ButtonLink href="/forum" variant="outline" size="sm" className="mt-4 w-full">
                  Ir para o fórum
                </ButtonLink>
              </div>
            </aside>
          </div>
        )}

        {/* ---------- BILHETES ---------- */}
        {aba === "bilhetes" && (
          <div className="space-y-4">
            {bilhetesComEvento.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-sm text-ink-400">
                  Ainda não tem bilhetes associados a {dados.email}.
                </p>
              </div>
            )}
            {bilhetesComEvento.map((b) => {
              const usado = b.estado === "usado" || (b.evento ? b.evento.dataFim < hoje : false);
              const pago = b.estado === "pago" || b.estado === "usado";
              return (
                <article key={b.id} className={`card overflow-hidden ${usado ? "opacity-60" : ""}`}>
                  <div className="flex flex-col sm:flex-row">
                    <div className="min-w-0 flex-1 p-6">
                      <div className="flex items-center justify-between gap-3">
                        <Logo height={18} className="text-white" />
                        <Tag tone={pago && !usado ? "ok" : "neutral"}>
                          {!pago ? "A aguardar pagamento" : usado ? "Utilizado" : "Válido"}
                        </Tag>
                      </div>
                      <h2 className="mt-4 font-display text-xl uppercase leading-tight text-white">
                        {b.evento?.titulo ?? b.eventoTitulo}
                      </h2>
                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-3">
                        {[
                          ["Tipo", b.tipoBilheteNome],
                          ["Quantidade", `${b.quantidade}`],
                          ["Data", b.evento ? formatData(b.evento.dataInicio, { day: "2-digit", month: "short", year: "numeric" }) : ""],
                          ["Local", b.evento?.circuito ?? ""],
                          ["Total", formatKz(b.total)],
                          ["Comprado", formatData(b.criado, { day: "2-digit", month: "short" })],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <dt className="eyebrow text-ink-600">{k}</dt>
                            <dd className="mt-0.5 text-sm text-white">{v}</dd>
                          </div>
                        ))}
                      </dl>
                      {b.evento && (
                        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/6 pt-4">
                          <ButtonLink href={`/calendario/${b.evento.slug}`} variant="ghost" size="sm">Ver evento</ButtonLink>
                        </div>
                      )}
                    </div>
                    {pago && (
                      <div className="flex flex-col items-center justify-center gap-2.5 border-t-2 border-dashed border-ink-950 p-6 sm:border-l-2 sm:border-t-0">
                        <QRCode valor={b.codigoQR || b.referencia} size={140} />
                        <p className="font-mono text-[11px] text-ink-500">{b.referencia}</p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
            <div className="card p-6 text-center">
              <p className="text-sm text-ink-400">Quer ir a mais provas?</p>
              <ButtonLink href="/bilhetes" className="mt-3">
                <Icon name="ticket" className="size-4" />
                Ver bilhetes disponíveis
              </ButtonLink>
            </div>
          </div>
        )}

        {/* ---------- PREFERÊNCIAS ---------- */}
        {aba === "preferencias" && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-400 leading-relaxed">
                Escolha o que quer seguir. Usamos estas preferências para personalizar a página inicial,
                a newsletter e as notificações que recebe.
              </p>
              <EstadoGuardar estado={gravacao} />
            </div>

            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">Pilotos</h2>
              <p className="text-xs text-ink-600 mb-5">
                Receba aviso quando estes pilotos correm, pontuam ou sobem ao pódio.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {pilotos.map((p) => (
                  <Escolha key={p.slug} on={prefs.pilotos.includes(p.slug)} onClick={() => alternar("pilotos", p.slug)}>
                    <Retrato nome={p.slug} iniciais={iniciais(p.nome)}
                      className="size-9 shrink-0 rounded-full [container-type:size]" tamanhos="36px" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">{p.nome}</span>
                      <span className="block truncate text-[11px] text-ink-600">{p.categoria}</span>
                    </span>
                  </Escolha>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">Equipas e clubes</h2>
              <p className="text-xs text-ink-600 mb-5">Novidades, resultados e eventos das estruturas que segue.</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {equipas.map((e) => (
                  <Escolha key={e.slug} on={prefs.equipas.includes(e.slug)} onClick={() => alternar("equipas", e.slug)}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full font-display text-[10px] text-white" style={{ background: e.cor }}>
                      {e.logo}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">{e.nome}</span>
                      <span className="block truncate text-[11px] text-ink-600">{e.tipo}</span>
                    </span>
                  </Escolha>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">Marcas de interesse</h2>
              <p className="text-xs text-ink-600 mb-5">Avisamos quando surgirem anúncios ou notícias destas marcas.</p>
              <div className="flex flex-wrap gap-2">
                {MARCAS.map((m) => {
                  const on = prefs.marcas.includes(m);
                  return (
                    <button key={m} onClick={() => alternar("marcas", m)} aria-pressed={on}
                      className="chip">
                      {m}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ---------- NOTIFICAÇÕES ---------- */}
        {aba === "notificacoes" && (
          <div className="max-w-3xl space-y-6">
            <div className="flex justify-end"><EstadoGuardar estado={gravacao} /></div>
            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">O que quer receber</h2>
              <p className="text-xs text-ink-600 mb-5">Notificações personalizadas com base nas suas preferências.</p>
              <div className="divide-y divide-white/6">
                {(
                  [
                    ["resultados", "Resultados de corridas", "Quando os pilotos e equipas que segue terminam uma prova."],
                    ["calendario", "Calendário", "Novas provas no calendário."],
                    ["bilhetes", "Bilhetes", "Quando abre a venda de bilhetes para uma prova."],
                    ["marketplace", "Marketplace", "Novos anúncios das marcas que segue."],
                    ["forum", "Fórum", "Respostas aos seus tópicos e menções."],
                    ["newsletter", "Newsletter semanal", "Resumo da semana, às sextas-feiras."],
                  ] as [TipoNotificacao, string, string][]
                ).map(([k, titulo, desc]) => (
                  <label key={k} className="flex cursor-pointer items-start gap-4 py-4">
                    <input type="checkbox" checked={prefs.notificacoes[k]}
                      onChange={(e) => mudarPrefs({ ...prefs, notificacoes: { ...prefs.notificacoes, [k]: e.target.checked } })}
                      className="mt-1 size-4 shrink-0 accent-[#e10600]" />
                    <span className="min-w-0">
                      <span className="block font-display text-sm uppercase text-white">{titulo}</span>
                      <span className="mt-0.5 block text-xs text-ink-500">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-5">Como quer receber</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["email", "Email", "mail"],
                    ["push", "Notificação no telemóvel", "bell"],
                    ["whatsapp", "WhatsApp", "whatsapp"],
                  ] as [Canal, string, string][]
                ).map(([k, label, icone]) => {
                  const activo = CANAIS_ACTIVOS.includes(k);
                  const on = activo && prefs.canais[k];
                  return (
                    <button key={k} disabled={!activo}
                      onClick={() => mudarPrefs({ ...prefs, canais: { ...prefs.canais, [k]: !prefs.canais[k] } })}
                      aria-pressed={on}
                      className={`flex flex-col items-center gap-2.5 rounded-card p-5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        on ? "bg-mb-red/10 ring-2 ring-inset ring-mb-red/70" : "bg-ink-950 hover:bg-ink-800"
                      }`}>
                      <span className={`grid size-11 place-items-center rounded-full ${on ? "bg-mb-red/15 text-mb-red" : "bg-ink-800 text-ink-500"}`}>
                        <Icon name={icone} className="size-5" />
                      </span>
                      <span className="text-center text-xs text-white">{label}</span>
                      {!activo && <span className="text-[10px] uppercase tracking-widest text-ink-500">Brevemente</span>}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-ink-600">As notificações por email são enviadas para {dados.email}.</p>
            </section>
          </div>
        )}

        {/* ---------- ANÚNCIOS ---------- */}
        {aba === "anuncios" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl uppercase text-white">Os meus anúncios</h2>
                <p className="mt-1 text-sm text-ink-500">Gira os anúncios que publicou no marketplace.</p>
              </div>
              <Button size="lg" onClick={() => setFormAnuncio("novo")}>
                <Icon name="plus" className="size-4" />
                Publicar anúncio
              </Button>
            </div>

            {perfil?.verificado && (
              <div className="card bg-ok/8 p-5">
                <p className="flex items-center gap-2.5 text-sm text-ink-200">
                  <Icon name="verified" className="size-5 shrink-0 text-ok" />
                  <span>
                    <strong className="text-white">Conta verificada.</strong> Os seus anúncios aparecem
                    com o selo de vendedor verificado.
                  </span>
                </p>
              </div>
            )}

            {dados.anuncios.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-ink-400">Ainda não publicou nenhum anúncio.</p>
              </div>
            ) : (
              <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                {dados.anuncios.map((a) => (
                  <div key={a.id}>
                    <Link href={`/marketplace/${a.id}`} className="media relative block aspect-[4/3]">
                      <Placeholder nome={a.imagens[0] ?? a.categoria} className="absolute inset-0" />
                      <div className="absolute left-3 top-3"><Tag tone="ok">Activo</Tag></div>
                    </Link>
                    <div className="pt-3.5">
                      <h3 className="font-display text-sm uppercase leading-snug text-white line-clamp-2">{a.titulo}</h3>
                      <p className="mt-2 font-display text-lg text-white">{formatKz(a.preco)}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-600">
                        <Icon name="eye" className="size-3" />
                        {a.visualizacoes.toLocaleString("pt-PT")} visualizações
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="dark" size="sm" className="flex-1" onClick={() => setFormAnuncio(a)}>Editar</Button>
                        <TerminarAnuncio id={a.id} aoTerminar={carregar} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editarPerfil && (
        <EditarPerfil
          perfil={perfil}
          aoFechar={() => setEditarPerfil(false)}
          aoGuardar={async () => { setEditarPerfil(false); await Promise.all([carregar(), recarregarPerfil()]); }}
        />
      )}

      {formAnuncio && (
        <FormAnuncio
          anuncio={formAnuncio === "novo" ? null : formAnuncio}
          provinciaPadrao={perfil?.provincia ?? "Luanda"}
          aoFechar={() => setFormAnuncio(null)}
          aoGuardar={async () => { setFormAnuncio(null); await carregar(); }}
        />
      )}
    </div>
  );
}

/* ---------------- Peças ---------------- */

async function lerConta(): Promise<{ dados?: DadosConta; erro?: string }> {
  try {
    const r = await fetch("/api/conta", { cache: "no-store" });
    const j = await r.json();
    return r.ok ? { dados: j as DadosConta } : { erro: String(j.erro ?? `Erro ${r.status}`) };
  } catch {
    return { erro: "Não foi possível carregar a sua conta. Verifique a ligação." };
  }
}

function EstadoGuardar({ estado }: { estado: EstadoGravacao }) {
  if (estado === "parado") return <span className="text-xs text-ink-600">As alterações guardam-se automaticamente.</span>;
  const tom = estado === "erro" ? "text-mb-red" : estado === "guardado" ? "text-ok" : "text-ink-400";
  const texto = estado === "erro" ? "Não foi possível guardar. Tente de novo." : estado === "guardado" ? "Guardado" : "A guardar…";
  return <span role="status" className={`text-xs ${tom}`}>{texto}</span>;
}

function Escolha({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-3.5 text-left transition-colors ${
        on ? "bg-mb-red/12 ring-1 ring-inset ring-mb-red/60" : "bg-ink-950 hover:bg-ink-800"
      }`}>
      {children}
      <span className={`grid size-5 shrink-0 place-items-center rounded-full ${on ? "bg-mb-red text-white" : "border border-ink-600"}`}>
        {on && <Icon name="check" className="size-3" />}
      </span>
    </button>
  );
}

function Janela({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [aoFechar]);
  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/75" onClick={aoFechar} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={titulo}
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-ink-900 p-6 shadow-2xl shadow-black/60 ring-1 ring-white/5 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg uppercase tracking-tight text-white">{titulo}</h2>
          <button onClick={aoFechar} aria-label="Fechar" className="-mr-2 grid size-9 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/8 hover:text-white">
            <Icon name="close" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Rotulo({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block text-ink-500">{texto}</span>
      {children}
    </label>
  );
}

async function enviar(url: string, metodo: string, corpo: unknown): Promise<string | null> {
  try {
    const r = await fetch(url, {
      method: metodo, headers: { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    if (r.ok) return null;
    const j = await r.json().catch(() => ({}));
    return String(j.erro ?? `Erro ${r.status}`);
  } catch {
    return "Não foi possível contactar o servidor.";
  }
}

function EditarPerfil({ perfil, aoFechar, aoGuardar }: {
  perfil: PerfilConta | null; aoFechar: () => void; aoGuardar: () => Promise<void>;
}) {
  const [nome, setNome] = useState(perfil?.nome ?? "");
  const [telefone, setTelefone] = useState(perfil?.telefone ?? "");
  const [provincia, setProvincia] = useState(perfil?.provincia ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  const guardar = async () => {
    setAGuardar(true);
    const e = await enviar("/api/conta", "PATCH", { perfil: { nome, telefone, provincia } });
    setAGuardar(false);
    if (e) { setErro(e); return; }
    await aoGuardar();
  };

  return (
    <Janela titulo="Editar perfil" aoFechar={aoFechar}>
      <div className="space-y-4">
        <Rotulo texto="Nome"><input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} /></Rotulo>
        <Rotulo texto="Telefone"><input className={campo} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="+244 9xx xxx xxx" maxLength={30} /></Rotulo>
        <Rotulo texto="Província">
          <select className={campo} value={provincia} onChange={(e) => setProvincia(e.target.value)}>
            <option value="">Não indicada</option>
            {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Rotulo>
        {erro && <p role="alert" className="text-sm text-mb-red">{erro}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button onClick={guardar} disabled={aGuardar}>{aGuardar ? "A guardar…" : "Guardar"}</Button>
        </div>
      </div>
    </Janela>
  );
}

function FormAnuncio({ anuncio, provinciaPadrao, aoFechar, aoGuardar }: {
  anuncio: AnuncioMarketplace | null; provinciaPadrao: string;
  aoFechar: () => void; aoGuardar: () => Promise<void>;
}) {
  const [f, setF] = useState({
    titulo: anuncio?.titulo ?? "", categoria: anuncio?.categoria ?? "Motas",
    preco: anuncio ? String(anuncio.preco) : "", negociavel: anuncio?.negociavel ?? false,
    marca: anuncio?.marca ?? "", modelo: anuncio?.modelo ?? "",
    ano: anuncio?.ano ? String(anuncio.ano) : "", quilometragem: anuncio?.quilometragem ? String(anuncio.quilometragem) : "",
    estado: anuncio?.estado ?? "Bom", provincia: anuncio?.provincia ?? provinciaPadrao, descricao: anuncio?.descricao ?? "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const def = (campos: Partial<typeof f>) => setF((x) => ({ ...x, ...campos }));

  const guardar = async () => {
    setAGuardar(true);
    const e = anuncio
      ? await enviar(`/api/conta/anuncios?id=${encodeURIComponent(anuncio.id)}`, "PATCH", f)
      : await enviar("/api/conta/anuncios", "POST", f);
    setAGuardar(false);
    if (e) { setErro(e); return; }
    await aoGuardar();
  };

  return (
    <Janela titulo={anuncio ? "Editar anúncio" : "Publicar anúncio"} aoFechar={aoFechar}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Rotulo texto="Título"><input className={campo} value={f.titulo} onChange={(e) => def({ titulo: e.target.value })} placeholder="Ex.: KTM 250 SX-F 2022, pronta a correr" maxLength={90} /></Rotulo>
        </div>
        <Rotulo texto="Categoria">
          <select className={campo} value={f.categoria} onChange={(e) => def({ categoria: e.target.value as typeof f.categoria })}>
            {["Motas", "Peças", "Equipamento", "Acessórios"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Rotulo>
        <Rotulo texto="Estado">
          <select className={campo} value={f.estado} onChange={(e) => def({ estado: e.target.value as typeof f.estado })}>
            {["Nova", "Como nova", "Muito bom", "Bom", "Para peças"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Rotulo>
        <Rotulo texto="Preço (Kz)"><input className={campo} inputMode="numeric" value={f.preco} onChange={(e) => def({ preco: e.target.value.replace(/[^\d]/g, "") })} /></Rotulo>
        <Rotulo texto="Província">
          <select className={campo} value={f.provincia} onChange={(e) => def({ provincia: e.target.value as typeof f.provincia })}>
            {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Rotulo>
        <Rotulo texto="Marca"><input className={campo} value={f.marca} onChange={(e) => def({ marca: e.target.value })} list="marcas-conta" maxLength={40} /></Rotulo>
        <datalist id="marcas-conta">{MARCAS.map((m) => <option key={m} value={m} />)}</datalist>
        <Rotulo texto="Modelo"><input className={campo} value={f.modelo} onChange={(e) => def({ modelo: e.target.value })} maxLength={60} /></Rotulo>
        <Rotulo texto="Ano"><input className={campo} inputMode="numeric" value={f.ano} onChange={(e) => def({ ano: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })} /></Rotulo>
        <Rotulo texto="Quilómetros"><input className={campo} inputMode="numeric" value={f.quilometragem} onChange={(e) => def({ quilometragem: e.target.value.replace(/[^\d]/g, "") })} /></Rotulo>
        <div className="sm:col-span-2">
          <Rotulo texto="Descrição">
            <textarea className={`${campo} h-32 py-2`} value={f.descricao} onChange={(e) => def({ descricao: e.target.value })} maxLength={3000}
              placeholder="Estado, revisões, o que inclui, onde se pode ver." />
          </Rotulo>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-300 sm:col-span-2">
          <input type="checkbox" checked={f.negociavel} onChange={(e) => def({ negociavel: e.target.checked })} className="size-4 accent-[#e10600]" />
          Preço negociável
        </label>
      </div>
      <p className="mt-4 text-xs text-ink-600">Por agora os anúncios são publicados sem fotografias.</p>
      {erro && <p role="alert" className="mt-3 text-sm text-mb-red">{erro}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
        <Button onClick={guardar} disabled={aGuardar}>{aGuardar ? "A guardar…" : anuncio ? "Guardar" : "Publicar"}</Button>
      </div>
    </Janela>
  );
}

function TerminarAnuncio({ id, aoTerminar }: { id: string; aoTerminar: () => Promise<void> }) {
  const [confirmar, setConfirmar] = useState(false);
  const [aApagar, setAApagar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!confirmar) {
    return <Button variant="dark" size="sm" className="flex-1" onClick={() => setConfirmar(true)}>Terminar</Button>;
  }
  return (
    <Janela titulo="Terminar anúncio" aoFechar={() => setConfirmar(false)}>
      <p className="text-sm text-ink-300">O anúncio sai do marketplace e não pode ser recuperado. Continuar?</p>
      {erro && <p role="alert" className="mt-3 text-sm text-mb-red">{erro}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setConfirmar(false)}>Cancelar</Button>
        <Button disabled={aApagar} onClick={async () => {
          setAApagar(true);
          const e = await enviar(`/api/conta/anuncios?id=${encodeURIComponent(id)}`, "DELETE", undefined);
          setAApagar(false);
          if (e) { setErro(e); return; }
          setConfirmar(false);
          await aoTerminar();
        }}>
          {aApagar ? "A terminar…" : "Terminar anúncio"}
        </Button>
      </div>
    </Janela>
  );
}
