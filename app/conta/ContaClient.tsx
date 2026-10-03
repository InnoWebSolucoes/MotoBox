"use client";

/* ============================================================
   MOTOBOX — Área de conta
   Tudo o que aqui aparece vem da conta de quem tem sessão:
   perfil, bilhetes (encomendas com o email da conta),
   preferências, notificações e anúncios próprios. As
   preferências guardam-se sozinhas a cada clique, e o separador
   aberto fica no endereço (?aba=), para sobreviver a um reload.
   ============================================================ */

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Logo, Placeholder, Retrato } from "@/components/Brand";
import { QRCode } from "@/components/QRCode";
import { SeloVerificado } from "@/components/SeloVerificado";
import { AnunciosGuardados } from "@/components/AnunciosGuardados";
import { Button, ButtonLink, Icon, Tag } from "@/components/ui";
import { formatData, formatKz } from "@/lib/data";
import { useAuth } from "@/lib/auth/contexto";
import {
  INTERESSES, MARCAS, CANAIS_ACTIVOS, PREFERENCIAS_PADRAO,
  type Preferencias, type TipoNotificacao, type Canal,
} from "@/lib/conta/preferencias";
import { iniciaisClube, localClube, nomeTipo } from "@/app/clubes/comum";
import type { AnuncioMarketplace, Clube, Equipa, Evento, Noticia, Piloto } from "@/lib/types";
import type { Encomenda } from "@/lib/admin/types";
import { RecortarAvatar, useTextosRecorte, type EstadoRecorte } from "./RecortarAvatar";
import { comBase } from "@/lib/base";
import { hrefEvento } from "@/lib/desporto";
import { PROVINCIAS } from "@/lib/provincias";
import {
  CATEGORIAS_ANUNCIO, DOCUMENTOS_MOTA, ESTADOS_ARTIGO, SLUG_TERMOS_MARKETPLACE,
  moderacaoDe, precisaRevisao,
} from "@/lib/marketplace";

type Aba = "resumo" | "bilhetes" | "preferencias" | "notificacoes" | "anuncios";

const ABAS: { id: Aba; label: string; icone: string }[] = [
  { id: "resumo", label: "Resumo", icone: "user" },
  { id: "bilhetes", label: "Bilhetes", icone: "ticket" },
  { id: "preferencias", label: "Preferências", icone: "settings" },
  { id: "notificacoes", label: "Notificações", icone: "bell" },
  { id: "anuncios", label: "Anúncios", icone: "tag" },
];


interface PerfilConta {
  id: string; nome: string; email: string; telefone: string | null; provincia: string | null;
  avatar_cor: string; registado: string; verificado: boolean; newsletter: boolean; estado: string;
}

/** Cor e logótipo da conta, já resolvidos pelo servidor. */
interface AvatarDados {
  cor: string;
  url: string | null;
}

interface DadosConta {
  perfil: PerfilConta | null;
  email: string;
  /** Opcional: uma resposta antiga da API ainda não o traz. */
  avatar?: AvatarDados;
  preferencias: Preferencias;
  encomendas: Encomenda[];
  anuncios: AnuncioMarketplace[];
}

type EstadoGravacao = "parado" | "a-guardar" | "guardado" | "erro";

function iniciais(n: string) {
  return n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/* ---------- Avatar: cor e logótipo ---------- */

/** Cores prontas: todas seguram a inicial a branco e assentam no fundo escuro do site. */
const CORES_AVATAR = [
  "#e10600", "#c2410c", "#b45309", "#15803d", "#0f766e",
  "#0369a1", "#1d4ed8", "#6d28d9", "#be185d", "#475569",
];
const COR_PADRAO = "#e10600";
const COR_HEX = /^#[0-9a-f]{6}$/i;
const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
// A fotografia escolhida só serve para recortar: o que sobe é o recorte de
// 512 px (bem abaixo dos 2 MB do servidor). Fotografias de telemóvel passam.
const IMAGEM_MAX = 20 * 1024 * 1024;

const normalizarCor = (c: string | undefined) => (c && COR_HEX.test(c) ? c.toLowerCase() : COR_PADRAO);

async function enviarImagem(imagem: Blob): Promise<string | null> {
  const dados = new FormData();
  dados.append("ficheiro", imagem, `logotipo.${imagem.type.split("/")[1] ?? "jpg"}`);
  try {
    const r = await fetch(comBase("/api/conta/avatar"), { method: "POST", body: dados });
    if (r.ok) return null;
    const j = await r.json().catch(() => ({}));
    return String(j.erro ?? `Erro ${r.status}`);
  } catch {
    return "Não foi possível contactar o servidor.";
  }
}

/** Círculo da conta: o logótipo por cima da cor escolhida, ou a inicial sobre ela. */
function AvatarConta({ url, cor, nome, className = "" }: {
  url: string | null; cor: string; nome: string; className?: string;
}) {
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full font-display text-white ${className}`}
      style={{ backgroundColor: cor }}>
      {url ? (
        <Image src={url} alt="" fill sizes="112px" unoptimized={url.startsWith("blob:")} className="object-cover" />
      ) : (
        iniciais(nome)
      )}
    </span>
  );
}

const campo =
  "h-11 w-full bg-ink-950 px-3.5 text-sm text-white ring-1 ring-inset ring-white/10 placeholder:text-ink-600 outline-none transition-shadow focus:ring-2 focus:ring-mb-red";

export function ContaClient({
  eventos, pilotos, equipas, clubes, noticias,
}: {
  eventos: Evento[];
  pilotos: Piloto[];
  equipas: Equipa[];
  clubes: Clube[];
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
        const r = await fetch(comBase("/api/conta"), {
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

  const alternar = (
    chave: "interesses" | "clubes" | "provincias" | "pilotos" | "equipas" | "marcas",
    valor: string,
  ) => {
    const lista: readonly string[] = prefs[chave];
    mudarPrefs({ ...prefs, [chave]: lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor] });
  };

  const terminarSessao = async () => {
    setASair(true);
    await sair();
    window.location.replace(comBase("/"));
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
  const avatar: AvatarDados = {
    cor: normalizarCor(dados.avatar?.cor ?? perfil?.avatar_cor),
    url: dados.avatar?.url ?? null,
  };
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
          <button type="button" onClick={() => setEditarPerfil(true)} aria-label="Alterar logótipo e cor"
            title="Alterar logótipo e cor" className="group relative shrink-0 rounded-full">
            <AvatarConta url={avatar.url} cor={avatar.cor} nome={nome} className="size-20 text-2xl ring-4 ring-ink-900" />
            <span aria-hidden
              className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full bg-ink-800 text-ink-200 ring-4 ring-ink-900 transition-colors group-hover:bg-white group-hover:text-ink-950">
              <IconeCamara />
            </span>
          </button>
          <div className="min-w-0 flex-1 basis-56">
            <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl uppercase leading-tight text-white break-words">
              {nome}
              {perfil?.verificado && <SeloVerificado tamanho={20} rotulo="Conta verificada" />}
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
                          <ButtonLink href={hrefEvento(b.evento)} variant="ghost" size="sm">Ver evento</ButtonLink>
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
                Escolha o que lhe interessa. Usamos estas escolhas nos avisos que recebe por email, nos temas
                da newsletter semanal, se a subscrever, e nas notícias «Para si» do seu resumo.
              </p>
              <EstadoGuardar estado={gravacao} />
            </div>

            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">Interesses</h2>
              <p className="text-xs text-ink-600 mb-5">
                Os temas da sua newsletter semanal e dos avisos de passeios, encontros e acções solidárias.
                Sem nenhum escolhido, recebe tudo.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {INTERESSES.map((i) => (
                  <Escolha key={i.id} on={prefs.interesses.includes(i.id)} onClick={() => alternar("interesses", i.id)}>
                    <span className="min-w-0 flex-1 py-1 pl-2">
                      <span className="block text-sm text-white">{i.nome}</span>
                      <span className="block text-[11px] text-ink-600">{i.descricao}</span>
                    </span>
                  </Escolha>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">Clubes</h2>
              <p className="text-xs text-ink-600 mb-5">Avisamos por email sempre que um destes clubes organizar um evento.</p>
              {clubes.length === 0 ? (
                <p className="text-sm text-ink-500">Ainda não há clubes publicados.</p>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {clubes.map((c) => (
                    <Escolha key={c.slug} on={prefs.clubes.includes(c.slug)} onClick={() => alternar("clubes", c.slug)}>
                      <span className="grid size-9 shrink-0 place-items-center rounded-full font-display text-[10px] text-white" style={{ background: c.cor }}>
                        {iniciaisClube(c.nome)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">{c.nome}</span>
                        <span className="block truncate text-[11px] text-ink-600">{nomeTipo(c.tipo)} · {localClube(c)}</span>
                      </span>
                    </Escolha>
                  ))}
                </div>
              )}
            </section>

            <section className="card p-6">
              <h2 className="eyebrow text-mb-red mb-1">Províncias</h2>
              <p className="text-xs text-ink-600 mb-5">Avisamos dos eventos novos nestas províncias, dentro dos seus interesses.</p>
              <div className="flex flex-wrap gap-2">
                {PROVINCIAS.map((p) => {
                  const on = prefs.provincias.includes(p);
                  return (
                    <button key={p} onClick={() => alternar("provincias", p)} aria-pressed={on}
                      className="chip">
                      {p}
                    </button>
                  );
                })}
              </div>
            </section>

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
              <h2 className="eyebrow text-mb-red mb-1">Equipas</h2>
              <p className="text-xs text-ink-600 mb-5">Avisamos quando os pilotos destas equipas terminam uma prova.</p>
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
              <p className="text-xs text-ink-600 mb-5">
                Avisamos quando surgir um anúncio destas marcas no marketplace, se tiver esse aviso ligado em Notificações.
              </p>
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
                    ["calendario", "Calendário", "Todas as provas e eventos novos."],
                    ["bilhetes", "Bilhetes", "Quando abre a venda de bilhetes para um evento."],
                    ["marketplace", "Marketplace", "Novos anúncios das marcas que segue."],
                    ["newsletter", "Newsletter semanal", "Resumo da semana, às segundas-feiras."],
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

            <div className="card p-5">
              <p className="flex gap-2.5 text-sm text-ink-300 leading-relaxed">
                <SeloVerificado tamanho={20} decorativo className="mt-0.5 shrink-0" />
                <span>
                  <strong className="text-white">Motas passam por verificação.</strong> Antes de uma mota
                  aparecer no marketplace, a equipa Motobox confere o número de quadro e os documentos, e
                  pode contactá-lo para os ver. Peças e equipamento são publicados logo.
                </span>
              </p>
            </div>

            {dados.anuncios.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-ink-400">Ainda não publicou nenhum anúncio.</p>
              </div>
            ) : (
              <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                {dados.anuncios.map((a) => {
                  const moderacao = moderacaoDe(a);
                  const capa = (
                    <>
                      <Placeholder nome={a.imagens[0] ?? a.categoria} className="absolute inset-0" />
                      <div className="absolute left-3 top-3">
                        {moderacao === "aprovado" && <Tag tone="ok">Activo</Tag>}
                        {moderacao === "pendente" && <Tag tone="gold">Em verificação</Tag>}
                        {moderacao === "rejeitado" && <Tag tone="red">Não aprovado</Tag>}
                      </div>
                    </>
                  );
                  return (
                    <div key={a.id}>
                      {/* Só o que está aprovado tem página pública */}
                      {moderacao === "aprovado" ? (
                        <Link href={`/marketplace/${a.id}`} className="media relative block aspect-[4/3]">{capa}</Link>
                      ) : (
                        <div className="media relative aspect-[4/3]">{capa}</div>
                      )}
                      <div className="pt-3.5">
                        <h3 className="font-display text-sm uppercase leading-snug text-white line-clamp-2">{a.titulo}</h3>
                        <p className="mt-2 font-display text-lg text-white">{formatKz(a.preco)}</p>
                        {moderacao === "aprovado" && (
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-600">
                            <Icon name="eye" className="size-3" />
                            {a.visualizacoes.toLocaleString("pt-PT")} visualizações
                          </p>
                        )}
                        {moderacao === "pendente" && (
                          <p className="mt-1 text-xs text-ink-500">A equipa está a rever o anúncio. Avisamos quando ficar visível.</p>
                        )}
                        {moderacao === "rejeitado" && a.motivoModeracao && (
                          <p className="mt-2 border-l-2 border-mb-red pl-2.5 text-xs text-ink-300 leading-relaxed">
                            {a.motivoModeracao}
                          </p>
                        )}
                        <div className="mt-4 flex gap-2">
                          <Button variant="dark" size="sm" className="flex-1" onClick={() => setFormAnuncio(a)}>
                            {moderacao === "rejeitado" ? "Corrigir" : "Editar"}
                          </Button>
                          <TerminarAnuncio id={a.id} aoTerminar={carregar} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Anúncios de outras pessoas que guardou com o coração */}
            <section className="border-t border-white/6 pt-8">
              <h2 className="font-display text-xl uppercase text-white">Guardados</h2>
              <p className="mt-1 text-sm text-ink-500">Os anúncios que guardou no marketplace.</p>
              <AnunciosGuardados className="mt-5" />
            </section>
          </div>
        )}
      </div>

      {editarPerfil && (
        <EditarPerfil
          perfil={perfil}
          avatar={avatar}
          nomeConta={nome}
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
    const r = await fetch(comBase("/api/conta"), { cache: "no-store" });
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
    const r = await fetch(comBase(url), {
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

/**
 * O que fazer à imagem ao guardar: nada, pôr uma nova, ou tirá-la. A nova
 * guarda o ficheiro original e o enquadramento, para se poder voltar a ajustar.
 */
type EscolhaImagem =
  | { tipo: "manter" }
  | { tipo: "nova"; blob: Blob; preview: string; original: File; recorte: EstadoRecorte }
  | { tipo: "remover" };

function IconeCamara() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function EditarPerfil({ perfil, avatar, nomeConta, aoFechar, aoGuardar }: {
  perfil: PerfilConta | null; avatar: AvatarDados; nomeConta: string;
  aoFechar: () => void; aoGuardar: () => Promise<void>;
}) {
  const [nome, setNome] = useState(perfil?.nome ?? "");
  const [telefone, setTelefone] = useState(perfil?.telefone ?? "");
  const [provincia, setProvincia] = useState(perfil?.provincia ?? "");
  const [cor, setCor] = useState(avatar.cor);
  const [hex, setHex] = useState(avatar.cor);
  const [imagem, setImagem] = useState<EscolhaImagem>({ tipo: "manter" });
  const [erro, setErro] = useState<string | null>(null);
  const [erroImagem, setErroImagem] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  /** Imagem aberta no recorte (a janela mostra-o em vez do formulário). */
  const [recorte, setRecorte] = useState<{ original: File; inicial?: EstadoRecorte } | null>(null);
  const seletor = useRef<HTMLInputElement>(null);
  const secaoImagem = useRef<HTMLElement>(null);
  const voltarFoco = useRef(false);
  const tx = useTextosRecorte();

  // Ao sair do recorte, o foco volta aos botões da imagem em vez de cair no início da página.
  useEffect(() => {
    if (recorte || !voltarFoco.current) return;
    voltarFoco.current = false;
    secaoImagem.current?.querySelector<HTMLButtonElement>("[data-foco-imagem]")?.focus();
  }, [recorte]);

  // Liberta a pré-visualização anterior quando muda, e a última ao fechar.
  useEffect(() => () => {
    if (imagem.tipo === "nova") URL.revokeObjectURL(imagem.preview);
  }, [imagem]);

  const urlMostrada = imagem.tipo === "nova" ? imagem.preview : imagem.tipo === "remover" ? null : avatar.url;
  const personalizada = !CORES_AVATAR.includes(cor);

  const mudarCor = (c: string) => { setCor(c); setHex(c); };
  const escreverHex = (v: string) => {
    const valor = v.trim().startsWith("#") ? v.trim() : `#${v.trim()}`;
    setHex(v);
    if (COR_HEX.test(valor)) setCor(valor.toLowerCase());
  };

  const escolherFicheiro = (f: File | undefined) => {
    setErroImagem(null);
    if (!f) return;
    if (!TIPOS_IMAGEM.includes(f.type)) { setErroImagem("Use uma imagem JPG, PNG ou WebP."); return; }
    if (f.size > IMAGEM_MAX) { setErroImagem("A imagem tem mais de 20 MB."); return; }
    setRecorte({ original: f });
  };

  const fecharRecorte = () => { voltarFoco.current = true; setRecorte(null); };

  // O recorte já sai a 512 px: é esse que se mostra e se envia ao guardar.
  const aplicarRecorte = (blob: Blob, estado: EstadoRecorte) => {
    if (!recorte) return;
    setImagem({ tipo: "nova", blob, preview: URL.createObjectURL(blob), original: recorte.original, recorte: estado });
    fecharRecorte();
  };

  const guardar = async () => {
    setAGuardar(true);
    setErro(null);
    // Só vai o que mudou: uma conta sem linha em `utilizadores` pode mudar a cor
    // e o logótipo sem esbarrar na validação do nome.
    const corpo: Record<string, unknown> = {};
    if (nome !== (perfil?.nome ?? "") || telefone !== (perfil?.telefone ?? "") || provincia !== (perfil?.provincia ?? "")) {
      corpo.perfil = { nome, telefone, provincia };
    }
    if (cor !== avatar.cor) corpo.avatarCor = cor;

    let e: string | null = null;
    if (Object.keys(corpo).length > 0) e = await enviar("/api/conta", "PATCH", corpo);
    if (!e && imagem.tipo === "nova") e = await enviarImagem(imagem.blob);
    if (!e && imagem.tipo === "remover") e = await enviar("/api/conta/avatar", "DELETE", undefined);
    setAGuardar(false);
    if (e) { setErro(e); return; }
    await aoGuardar();
  };

  if (recorte) {
    // Esc, o fundo e o X fecham só o recorte: o que já se escreveu no perfil fica.
    return (
      <Janela titulo={tx.titulo} aoFechar={fecharRecorte}>
        <RecortarAvatar fonte={recorte.original} inicial={recorte.inicial} cor={cor}
          aoAplicar={aplicarRecorte} aoCancelar={fecharRecorte} />
      </Janela>
    );
  }

  return (
    <Janela titulo="Editar perfil" aoFechar={aoFechar}>
      {/* Logótipo e cor, com o resultado ao vivo no círculo grande */}
      <section ref={secaoImagem} aria-label="Logótipo e cor" className="mb-6 border-b border-white/6 pb-6">
        <div className="flex flex-wrap items-center gap-5">
          <AvatarConta url={urlMostrada} cor={cor} nome={nome || nomeConta} className="size-24 text-3xl" />
          <div className="min-w-0 flex-1 basis-44">
            <p className="font-display text-base uppercase text-white">Logótipo ou fotografia</p>
            <p className="mt-0.5 text-xs text-ink-500">JPG, PNG ou WebP, até 20 MB.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {imagem.tipo === "nova" && (
                <Button type="button" variant="dark" size="sm" data-foco-imagem
                  onClick={() => setRecorte({ original: imagem.original, inicial: imagem.recorte })}>
                  {tx.ajustar}
                </Button>
              )}
              <Button type="button" variant="dark" size="sm" data-foco-imagem={imagem.tipo === "nova" ? undefined : true}
                onClick={() => seletor.current?.click()}>
                {urlMostrada ? "Trocar imagem" : "Carregar imagem"}
              </Button>
              {urlMostrada && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImagem({ tipo: "remover" })}>
                  Remover
                </Button>
              )}
            </div>
            <input ref={seletor} type="file" accept={TIPOS_IMAGEM.join(",")} className="sr-only" tabIndex={-1} aria-hidden
              onChange={(e) => { escolherFicheiro(e.target.files?.[0]); e.target.value = ""; }} />
            {erroImagem && <p role="alert" className="mt-2 text-sm text-mb-red">{erroImagem}</p>}
          </div>
        </div>

        <p className="eyebrow mb-2.5 mt-6 text-ink-500">Cor</p>
        <div className="flex flex-wrap items-center gap-2.5">
          {CORES_AVATAR.map((c) => (
            <button key={c} type="button" onClick={() => mudarCor(c)} aria-pressed={cor === c} aria-label={`Cor ${c}`}
              className={`size-8 rounded-full transition-transform hover:scale-110 ${
                cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-ink-900" : ""
              }`}
              style={{ backgroundColor: c }} />
          ))}
          {/* Cor livre, para acertar com a do logótipo */}
          <label title="Cor personalizada"
            className={`relative size-8 cursor-pointer overflow-hidden rounded-full transition-transform hover:scale-110 ${
              personalizada ? "ring-2 ring-white ring-offset-2 ring-offset-ink-900" : ""
            }`}
            style={{
              background: personalizada
                ? cor
                : "conic-gradient(#e10600, #f59e0b, #22c55e, #0ea5e9, #6d28d9, #be185d, #e10600)",
            }}>
            <input type="color" value={cor} onChange={(e) => mudarCor(e.target.value.toLowerCase())}
              aria-label="Cor personalizada" className="absolute inset-0 size-full cursor-pointer opacity-0" />
          </label>
          <input value={hex} onChange={(e) => escreverHex(e.target.value)} maxLength={7} spellCheck={false}
            aria-label="Código da cor (#rrggbb)"
            className="h-8 w-24 bg-ink-950 px-3 font-mono text-xs uppercase text-white ring-1 ring-inset ring-white/10 outline-none focus:ring-2 focus:ring-mb-red" />
        </div>
        <p className="mt-3 text-xs text-ink-600">A cor aparece por trás do logótipo e quando não há imagem.</p>
      </section>

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
  // O que o vendedor de uma mota declara; só vai para o servidor se a categoria for Motas.
  const [v, setV] = useState({
    numeroQuadro: "", matricula: "", documentos: [] as string[],
    emNomeProprio: true, observacoes: "", declaracao: false,
  });
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const def = (campos: Partial<typeof f>) => setF((x) => ({ ...x, ...campos }));
  const defV = (campos: Partial<typeof v>) => setV((x) => ({ ...x, ...campos }));
  const mota = precisaRevisao(f.categoria);
  const moderacao = anuncio ? moderacaoDe(anuncio) : null;

  // Ao editar uma mota, traz a declaração que já fez.
  useEffect(() => {
    if (!anuncio || !precisaRevisao(anuncio.categoria)) return;
    let vivo = true;
    fetch(comBase(`/api/conta/anuncios?id=${encodeURIComponent(anuncio.id)}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo && j?.verificacao) setV((x) => ({ ...x, ...j.verificacao, declaracao: true })); })
      .catch(() => { /* fica em branco; o vendedor preenche de novo */ });
    return () => { vivo = false; };
  }, [anuncio]);

  const guardar = async () => {
    setAGuardar(true);
    const corpo = { ...f, aceitaTermos, ...(mota ? { verificacao: v } : {}) };
    const e = anuncio
      ? await enviar(`/api/conta/anuncios?id=${encodeURIComponent(anuncio.id)}`, "PATCH", corpo)
      : await enviar("/api/conta/anuncios", "POST", corpo);
    setAGuardar(false);
    if (e) { setErro(e); return; }
    await aoGuardar();
  };

  const textoBotao = aGuardar ? "A guardar…"
    : !anuncio ? (mota ? "Enviar para verificação" : "Publicar")
    : moderacao === "rejeitado" ? "Enviar de novo" : "Guardar";

  return (
    <Janela titulo={anuncio ? "Editar anúncio" : "Publicar anúncio"} aoFechar={aoFechar}>
      {anuncio?.motivoModeracao && moderacao === "rejeitado" && (
        <p className="mb-5 border-l-2 border-mb-red pl-3 text-sm text-ink-300 leading-relaxed">
          <strong className="block text-white">Porque não foi aprovado</strong>
          {anuncio.motivoModeracao}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Rotulo texto="Título"><input className={campo} value={f.titulo} onChange={(e) => def({ titulo: e.target.value })} placeholder="Ex.: KTM 250 SX-F 2022, pronta a correr" maxLength={90} /></Rotulo>
        </div>
        <Rotulo texto="Categoria">
          <select className={campo} value={f.categoria} onChange={(e) => def({ categoria: e.target.value as typeof f.categoria })}>
            {CATEGORIAS_ANUNCIO.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Rotulo>
        <Rotulo texto="Estado (novo ou usado)">
          <select className={campo} value={f.estado} onChange={(e) => def({ estado: e.target.value as typeof f.estado })}>
            {ESTADOS_ARTIGO.map((c) => <option key={c}>{c}</option>)}
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

      {/* Verificação: só para motas, antes de aparecerem no marketplace */}
      {mota && (
        <fieldset className="mt-6 border-t border-white/6 pt-5">
          <legend className="font-display text-sm uppercase tracking-tight text-white">Verificação da mota</legend>
          <p className="mt-1.5 text-xs text-ink-500 leading-relaxed">
            Antes de aparecer no marketplace, a equipa Motobox revê a mota e pode contactá-lo para ver os
            documentos. O número de quadro e a matrícula não são publicados.
          </p>
          {moderacao === "aprovado" && (
            <p className="mt-2 text-xs text-ink-500 leading-relaxed">
              Se mudar a marca, o modelo, o ano, o número de quadro ou a matrícula, a mota volta a ser verificada.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Rotulo texto="Número de quadro (chassi)">
              <input className={`${campo} font-mono uppercase`} value={v.numeroQuadro} maxLength={30}
                onChange={(e) => defV({ numeroQuadro: e.target.value })}
                placeholder="Gravado no quadro e no livrete" autoComplete="off" spellCheck={false} />
            </Rotulo>
            <Rotulo texto="Matrícula (se tiver)">
              <input className={`${campo} font-mono uppercase`} value={v.matricula} maxLength={15}
                onChange={(e) => defV({ matricula: e.target.value })} autoComplete="off" spellCheck={false} />
            </Rotulo>
          </div>
          <p className="eyebrow mb-2 mt-4 text-ink-500">Documentos que tem</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {DOCUMENTOS_MOTA.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm text-ink-300">
                <input type="checkbox" className="size-4 accent-[#e10600]"
                  checked={v.documentos.includes(d.id)}
                  onChange={(e) => defV({
                    documentos: e.target.checked ? [...v.documentos, d.id] : v.documentos.filter((x) => x !== d.id),
                  })} />
                {d.nome}
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-ink-300">
            <input type="checkbox" checked={v.emNomeProprio} onChange={(e) => defV({ emNomeProprio: e.target.checked })} className="size-4 accent-[#e10600]" />
            Os documentos estão em meu nome
          </label>
          <div className="mt-4">
            <Rotulo texto="Notas para a equipa (opcional)">
              <textarea className={`${campo} h-20 py-2`} value={v.observacoes} maxLength={500}
                onChange={(e) => defV({ observacoes: e.target.value })}
                placeholder="Ex.: os documentos estão em nome do meu pai, que autoriza a venda." />
            </Rotulo>
          </div>
          <label className="mt-4 flex items-start gap-2 text-sm text-ink-300 leading-relaxed">
            <input type="checkbox" checked={v.declaracao} onChange={(e) => defV({ declaracao: e.target.checked })} className="mt-0.5 size-4 shrink-0 accent-[#e10600]" />
            Declaro que a mota não é roubada, que a posso vender legalmente e que estes dados são verdadeiros.
          </label>
        </fieldset>
      )}

      <p className="mt-4 text-xs text-ink-600">Por agora os anúncios são publicados sem fotografias.</p>
      {!anuncio && (
        <label className="mt-4 flex items-start gap-2 text-sm text-ink-300 leading-relaxed">
          <input type="checkbox" checked={aceitaTermos} onChange={(e) => setAceitaTermos(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#e10600]" />
          <span>
            Li e aceito os{" "}
            <Link href={`/${SLUG_TERMOS_MARKETPLACE}`} target="_blank" className="text-white underline hover:text-mb-red">
              Termos do Marketplace
            </Link>
            .
          </span>
        </label>
      )}
      {erro && <p role="alert" className="mt-3 text-sm text-mb-red">{erro}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
        <Button onClick={guardar} disabled={aGuardar}>{textoBotao}</Button>
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
