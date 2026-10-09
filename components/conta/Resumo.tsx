"use client";

/* ============================================================
   MOTOBOX — Área de membro: resumo
   A casa do membro: os números da conta, o que falta no perfil,
   "Para si" (o próximo evento com contagem decrescente, a rota
   da semana, o clube e os artigos dos seus interesses) e um
   relance dos anúncios, dos guardados, da garagem, do fórum e
   dos bilhetes.
   ============================================================ */

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Bike, Bookmark, CalendarDays, Check, Clock, Compass, MessagesSquare, Tag, Ticket } from "lucide-react";
import { Button, ButtonLink, Icon } from "@/components/ui";
import { FotoFundo, Monograma, Seta } from "@/components/painel/kit";
import { formatKz } from "@/lib/data";
import { diaMes, intervaloDatas } from "@/lib/motobox";
import type { AnuncioGuardado } from "@/lib/conta/favoritos";
import type { Encomenda } from "@/lib/admin/types";
import type { AbaConta } from "@/lib/conteudo/grupos/contas";
import {
  fimEvento, inicioEvento, nomeMota,
  type AnuncioConta, type ArtigoResumo, type ClubeResumo, type EventoResumo, type MotaGaragem, type ResumoForum, type RotaSemana,
} from "./dados";
import { LinhaAnuncio } from "./Anuncios";
import { CartaoArtigoConta, ListaAnunciosGuardados } from "./Guardados";
import { FotoMota } from "./Garagem";
import { LigacaoSeta, TituloBloco, campo, diaMesLongo, f, useAgora, useAgoraMinuto, useTextosConta } from "./partes";

/* ---------------- Números ---------------- */

function Numero({ icone, valor, rotulo, nota, onClick, href }: {
  icone: ReactNode; valor: number; rotulo: string; nota: string; onClick?: () => void; href?: string;
}) {
  const corpo = (
    <>
      <span className="flex items-start justify-between">
        <span aria-hidden className="chip-mb">{icone}</span>
        <Seta className="size-3.5 text-white" />
      </span>
      <span className="mt-6 block">
        <span className="block text-[2.5rem] font-semibold leading-none tracking-tight tabular-nums text-white lg:text-5xl">
          {valor.toLocaleString("pt-PT")}
        </span>
        <span className="mt-2 block text-[15px] text-white">{rotulo}</span>
        <span className="mt-0.5 block text-sm text-white/75">{nota}</span>
      </span>
    </>
  );
  const classes = "painel painel-escuro group flex min-h-44 flex-col justify-between p-5 text-left transition-colors hover:bg-near-black";
  return href ? <Link href={href} className={classes}>{corpo}</Link> : <button type="button" onClick={onClick} className={classes}>{corpo}</button>;
}

/* ---------------- Perfil por completar ---------------- */

export interface PassoPerfil {
  chave: "foto" | "provincia" | "telefone" | "clube" | "garagem" | "interesses";
  feito: boolean;
  accao: () => void;
}

function PerfilIncompleto({ passos }: { passos: PassoPerfil[] }) {
  const t = useTextosConta().perfil;
  const feitos = passos.filter((p) => p.feito).length;
  return (
    <section className="painel painel-escuro p-5 md:p-6" aria-labelledby="perfil-titulo">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-[62ch]">
          <h2 id="perfil-titulo" className="text-lg font-semibold leading-tight text-white">{t.titulo}</h2>
          <p className="mt-1 text-sm leading-relaxed text-white/80">{t.texto}</p>
        </div>
        <p className="text-sm tabular-nums text-white">{f(t.progresso, { feitos, total: passos.length })}</p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15" aria-hidden>
        <div className="h-full rounded-full bg-mb-red" style={{ width: `${(feitos / passos.length) * 100}%` }} />
      </div>
      <ul className="mt-5 grid gap-[var(--intervalo)] sm:grid-cols-2 lg:grid-cols-3">
        {passos.map((p) => (
          <li key={p.chave}>
            {p.feito ? (
              <span className="flex h-full items-center gap-3 rounded-[var(--raio)] bg-white/5 px-3.5 py-3 text-[15px] text-white/75">
                <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-ok text-white"><Check className="size-3.5" /></span>
                <span className="line-through decoration-white/40">{t[p.chave]}</span>
                <span className="sr-only">(feito)</span>
              </span>
            ) : (
              <button type="button" onClick={p.accao}
                className="group flex h-full w-full items-center gap-3 rounded-[var(--raio)] bg-white/10 px-3.5 py-3 text-left text-[15px] text-white transition-colors hover:bg-white/18">
                <span aria-hidden className="size-6 shrink-0 rounded-full border-2 border-white/50" />
                <span className="min-w-0 flex-1">{t[p.chave]}</span>
                <Seta para="direita" className="size-3 shrink-0" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- Próximo evento ---------------- */

function Contagem({ evento }: { evento: EventoResumo }) {
  const t = useTextosConta().paraSi;
  const agora = useAgora() * 1000;
  const inicio = inicioEvento(evento);
  if (agora && agora >= inicio && agora <= fimEvento(evento)) {
    return (
      <p className="mt-6 inline-flex items-center gap-2.5 rounded-[var(--raio)] bg-mb-red px-4 py-2.5 text-[15px] font-medium text-white">
        <span aria-hidden className="live-dot size-2.5 rounded-full bg-white" />
        {t.aDecorrer}
      </p>
    );
  }
  const falta = Math.max(0, inicio - agora);
  const partes: [number, string, string][] = [
    [Math.floor(falta / 86_400_000), t.dias, ""],
    [Math.floor(falta / 3_600_000) % 24, t.horas, ""],
    [Math.floor(falta / 60_000) % 60, t.minutos, ""],
    // Os segundos a mudar distraem: quem pede menos movimento não os vê.
    [Math.floor(falta / 1000) % 60, t.segundos, "motion-reduce:hidden"],
  ];
  return (
    <div className="mt-6 flex gap-[var(--intervalo)]" role="timer" aria-live="off"
      aria-label={agora ? `${partes[0][0]} ${t.dias}, ${partes[1][0]} ${t.horas}, ${partes[2][0]} ${t.minutos}` : undefined}>
      {partes.map(([v, rotulo, extra]) => (
        <span key={rotulo} className={`flex w-[4.5rem] flex-col items-center rounded-[var(--raio)] bg-black/55 px-2 py-3 backdrop-blur-md sm:w-20 ${extra}`}>
          <span className="text-3xl font-semibold leading-none tabular-nums text-white sm:text-4xl">
            {agora ? String(v).padStart(2, "0") : "–"}
          </span>
          <span className="mt-1.5 text-xs uppercase tracking-[0.14em] text-white/85">{rotulo}</span>
        </span>
      ))}
    </div>
  );
}

function ProximoEvento({ eventos, className = "" }: { eventos: EventoResumo[]; className?: string }) {
  const t = useTextosConta().paraSi;
  const [ev, ...resto] = eventos;

  if (!ev) {
    return (
      <article className={`painel painel-escuro flex flex-col justify-end p-6 md:p-8 ${className}`}>
        <span aria-hidden className="chip-mb chip-mb-lg"><CalendarDays /></span>
        <p className="mt-auto pt-12 text-sm text-white/80">{t.proximo}</p>
        <p className="mt-2 max-w-[44ch] text-lg leading-snug text-white">{t.semEventos}</p>
        <ButtonLink href="/eventos" className="mt-6 w-fit">{t.semEventosBotao}<Icon name="arrow" className="size-4" /></ButtonLink>
      </article>
    );
  }

  return (
    <article className={`painel isolate flex flex-col ${className}`}>
      <FotoFundo nome={ev.foto} veu="nenhum" tamanhos="(max-width: 1024px) 100vw, 66vw" />
      {/* Véu forte: o texto lê-se mesmo sobre um céu claro. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgb(26_26_32/0.97)] via-[rgb(26_26_32/0.82)] to-[rgb(26_26_32/0.64)]" />
      <div className="flex min-h-[24rem] flex-1 flex-col justify-end p-6 [text-shadow:0_1px_10px_rgb(0_0_0/0.5)] md:p-8 lg:min-h-[26rem]">
        <p className="sobretitulo text-white/90">{t.proximo}</p>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white">
          <span className={`rounded-[4px] px-2 py-1 text-xs font-medium ${ev.prova ? "bg-gold text-black" : "bg-mb-red text-white"}`}>
            {ev.prova ? t.prova : t.evento} · {ev.tipo}
          </span>
          <span>{ev.localidade}{ev.provincia && ev.provincia !== ev.localidade ? `, ${ev.provincia}` : ""}</span>
        </p>
        <h3 className="titulo-3 mt-3 max-w-[22ch] text-balance text-white [text-shadow:0_1px_14px_rgb(0_0_0/0.45)]">{ev.titulo}</h3>
        <p className="mt-2 text-[15px] text-white/90">
          {intervaloDatas(ev.dataInicio, ev.dataFim)}{ev.hora ? ` · ${ev.hora}` : ""}
        </p>
        <Contagem evento={ev} />
        <Link href={ev.href} className="group mt-6 inline-flex h-12 w-fit items-center gap-4 rounded-[var(--raio)] bg-white px-5 text-[15px] font-medium text-black transition-colors hover:bg-white/85">
          {t.verEvento}
          <Seta className="size-3.5" />
        </Link>
      </div>

      {resto.length > 0 && (
        <div className="border-t border-white/10 bg-[rgb(26_26_32/0.92)] p-[var(--intervalo)]">
          <p className="px-3 pb-2 pt-3 text-sm text-white/85">{t.agenda}</p>
          <ul className="grid gap-[var(--intervalo)] md:grid-cols-3">
            {resto.slice(0, 3).map((e) => {
              const { dia, mes } = diaMes(e.dataInicio);
              return (
                <li key={e.slug}>
                  <Link href={e.href} className="group flex h-full items-center gap-3 rounded-[var(--raio)] bg-white/6 p-2 pr-3 transition-colors hover:bg-white/12">
                    <span className={`flex w-12 shrink-0 flex-col items-center rounded-[4px] py-1.5 ${e.prova ? "bg-gold text-black" : "bg-mb-red text-white"}`}>
                      <span className="text-lg font-semibold leading-none">{dia}</span>
                      <span className="mt-0.5 text-[11px] uppercase tracking-[0.12em]">{mes}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-medium leading-snug text-white">{e.titulo}</span>
                      <span className="mt-0.5 block truncate text-xs text-white/80">{e.prova ? t.prova : e.tipo} · {e.localidade}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}

/* ---------------- Rota da semana ---------------- */

function FotoComons({ url, alt }: { url: string; alt: string }) {
  const [falhou, setFalhou] = useState(false);
  if (!url || falhou) return null;
  return <Image src={url} alt={alt} fill unoptimized sizes="(max-width: 1024px) 100vw, 33vw" onError={() => setFalhou(true)} className="foto-painel object-cover" />;
}

function RotaDaSemana({ rota, provincia }: { rota: RotaSemana | null; provincia: string | null }) {
  const t = useTextosConta().paraSi;
  if (!rota) return null;
  return (
    <Link href={`/rotas/${rota.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--raio)] bg-near-black">
        <FotoComons url={rota.foto} alt={rota.fotoAlt} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-[4px] bg-mb-red px-2 py-1 text-xs font-medium text-white">
          <Compass className="size-3.5" aria-hidden />
          {t.rota}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 pt-4">
        <p className="text-sm text-white/80">{rota.regiao}</p>
        <h3 className="mt-1 text-xl font-semibold leading-snug text-white">{rota.nome}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/80">{rota.subtitulo}</p>
        <p className="mt-3 text-sm tabular-nums text-white">
          {rota.km} km · {rota.duracao} · {rota.dias} {rota.dias > 1 ? "dias" : "dia"}
        </p>
        <p className="mt-0.5 text-sm text-white/80">{rota.piso} · <span className="text-mb-red-light">{rota.exigencia}</span></p>
        {rota.perto && provincia && <p className="mt-2 text-sm text-[#86efac]">{f(t.rotaPerto, { provincia })}</p>}
        <span className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm text-white">
          <span className="sublinhado">{t.verRota}</span>
          <Seta className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

/* ---------------- O meu clube ---------------- */

function MeuClube({ clube, clubes, aoEscolher, aGuardar }: {
  clube: ClubeResumo | null; clubes: ClubeResumo[]; aoEscolher: (slug: string) => void; aGuardar: boolean;
}) {
  const t = useTextosConta().paraSi;
  const [mudar, setMudar] = useState(false);

  const seletor = (
    <label className="mt-4 block">
      <span className="mb-1.5 block text-sm text-white/85">{t.escolherClube}</span>
      <select className={campo} value={clube?.slug ?? ""} disabled={aGuardar}
        onChange={(e) => { aoEscolher(e.target.value); setMudar(false); }}>
        <option value="">{t.semClubeOpcao}</option>
        {clubes.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
      </select>
    </label>
  );

  if (!clube) {
    return (
      <article className="painel painel-escuro flex flex-col p-5 md:p-6">
        <span aria-hidden className="chip-mb"><Icon name="flag" /></span>
        <h3 className="mt-5 text-lg font-semibold text-white">{t.semClube}</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/80">{t.semClubeTexto}</p>
        {seletor}
        <div className="mt-auto pt-4"><LigacaoSeta href="/clubes">{t.conhecerClubes}</LigacaoSeta></div>
      </article>
    );
  }

  return (
    <article className="painel painel-escuro flex flex-col p-5 md:p-6">
      <p className="text-sm text-white/80">{t.clube}</p>
      <div className="mt-3 flex items-center gap-3.5">
        <Monograma nome={clube.nome} cor={clube.cor} className="size-14 text-base" />
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug text-white">{clube.nome}</h3>
          <p className="text-sm text-white/80">{clube.tipo} · {clube.local}</p>
        </div>
      </div>
      {clube.encontros && (
        <p className="mt-4 flex gap-2 text-sm leading-snug text-white/90">
          <Clock className="mt-0.5 size-4 shrink-0 text-mb-red-light" aria-hidden />
          {clube.encontros}
        </p>
      )}
      {clube.actividades.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {clube.actividades.map((a) => <li key={a} className="rounded-[4px] bg-white/10 px-2 py-1 text-xs text-white/90">{a}</li>)}
        </ul>
      )}
      {mudar && seletor}
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <LigacaoSeta href={`/clubes/${clube.slug}`}>{t.verClube}</LigacaoSeta>
        {!mudar && (
          <button type="button" onClick={() => setMudar(true)} className="text-sm text-white/85 underline decoration-white/40 underline-offset-4 hover:text-white">
            {t.mudarClube}
          </button>
        )}
      </div>
    </article>
  );
}

/* ---------------- Relances ---------------- */

function Bloco({ titulo, accao, children, className = "" }: { titulo: ReactNode; accao?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`painel painel-escuro flex flex-col p-5 md:p-6 ${className}`}>
      <TituloBloco titulo={titulo} accao={accao} className="mb-4" />
      {children}
    </section>
  );
}

function Icone({ children }: { children: ReactNode }) {
  return <span aria-hidden className="mr-2 inline-grid size-7 place-items-center rounded-[4px] bg-mb-red align-[-6px] text-white [&_svg]:size-4">{children}</span>;
}

/* ---------------- Resumo ---------------- */

export interface PropsResumo {
  anuncios: AnuncioConta[];
  favoritos: AnuncioGuardado[] | null;
  erroFavoritos: string | null;
  aRemoverFavorito: string[];
  aoRemoverFavorito: (a: AnuncioGuardado) => void;
  aoTentarFavoritos: () => void;
  artigos: ArtigoResumo[];
  artigosGuardados: string[];
  aMudarArtigo: string[];
  aoMudarArtigo: (slug: string) => void;
  termos: string[];
  eventos: EventoResumo[];
  eventosTotal: number;
  rota: RotaSemana | null;
  provincia: string | null;
  clube: ClubeResumo | null;
  clubes: ClubeResumo[];
  aGuardarClube: boolean;
  aoEscolherClube: (slug: string) => void;
  garagem: MotaGaragem[];
  forum: ResumoForum;
  encomendas: Encomenda[];
  passos: PassoPerfil[];
  marketplaceAberto: boolean;
  irPara: (aba: AbaConta) => void;
  aoPublicar: () => void;
}

export function Resumo(p: PropsResumo) {
  const t = useTextosConta();
  const tn = t.numeros;
  const ps = t.paraSi;
  const agora = useAgoraMinuto();

  // Artigos dos interesses (clubes, marcas, clube próprio e motas da garagem); sem nenhum, os mais recentes.
  const termos = p.termos.map((x) => x.toLowerCase()).filter((x) => x.length > 2);
  const relevantes = termos.length
    ? p.artigos.filter((n) => termos.some((x) => `${n.titulo} ${n.resumo} ${n.tags.join(" ")}`.toLowerCase().includes(x)))
    : [];
  const feed = [...relevantes, ...p.artigos.filter((a) => !relevantes.includes(a))].slice(0, 4);

  const vistas = p.anuncios.reduce((s, a) => s + (a.visualizacoes ?? 0), 0);
  const proximo = p.eventos[0];
  // Dias de calendário em Luanda (UTC+1): às 07:00, um evento às 08:00 é "hoje".
  const diaLuanda = (ms: number) => Math.floor((ms + 3_600_000) / 86_400_000);
  const dias = proximo && agora ? Math.max(0, diaLuanda(inicioEvento(proximo)) - diaLuanda(agora)) : null;
  const notaEventos = !proximo ? tn.eventosNenhum : dias === null ? "" : dias === 0 ? tn.eventosHoje : dias === 1 ? tn.eventosAmanha : f(tn.eventosNota, { dias });
  const bilhetes = p.encomendas.filter((e) => e.estado !== "cancelado" && e.estado !== "reembolsado");
  const estadoBilhete: Record<string, string> = { pendente: ps.bilhetesPendente, pago: ps.bilhetesPago, usado: ps.bilhetesUsado };

  return (
    <div className="space-y-[var(--intervalo)]">
      {/* Os números da conta */}
      <div className="grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
        <Numero icone={<Tag />} valor={p.anuncios.length} rotulo={tn.anuncios} nota={p.anuncios.length ? f(tn.anunciosNota, { n: vistas }) : tn.anunciosZero} onClick={() => p.irPara("anuncios")} />
        <Numero icone={<Bookmark />} valor={(p.favoritos?.length ?? 0) + p.artigosGuardados.length} rotulo={tn.guardados}
          nota={(p.favoritos?.length ?? 0) + p.artigosGuardados.length
            ? f(tn.guardadosNota, { anuncios: p.favoritos?.length ?? 0, artigos: p.artigosGuardados.length })
            : tn.guardadosZero} onClick={() => p.irPara("guardados")} />
        <Numero icone={<MessagesSquare />} valor={p.forum.respostas + p.forum.topicos} rotulo={tn.forum}
          nota={p.forum.respostas + p.forum.topicos ? f(tn.forumNota, { respostas: p.forum.respostas, topicos: p.forum.topicos }) : tn.forumZero}
          href={p.forum.respostas + p.forum.topicos ? "/forum" : t.accoes.topicoLigacao || "/forum/novo"} />
        <Numero icone={<CalendarDays />} valor={p.eventosTotal} rotulo={tn.eventos} nota={notaEventos} href="/eventos" />
      </div>

      {p.passos.some((x) => !x.feito) && <PerfilIncompleto passos={p.passos} />}

      {/* Para si */}
      <section aria-labelledby="para-si" className="pt-6">
        <h2 id="para-si" className="titulo-3 mb-5 text-white">{ps.titulo}</h2>
        <div className="grid gap-[var(--intervalo)] lg:grid-cols-3">
          <ProximoEvento eventos={p.eventos} className="lg:col-span-2 lg:row-span-2" />
          {p.rota ? <RotaDaSemana rota={p.rota} provincia={p.provincia} /> : null}
          <MeuClube clube={p.clube} clubes={p.clubes} aoEscolher={p.aoEscolherClube} aGuardar={p.aGuardarClube} />
        </div>

        {feed.length > 0 && (
          <div className="mt-[var(--intervalo)]">
            <div className="painel painel-escuro p-5 md:p-6">
              <TituloBloco titulo={ps.artigos} texto={relevantes.length ? ps.artigosInteresses : ps.artigosRecentes}
                accao={<LigacaoSeta href="/artigos">{ps.verArtigos}</LigacaoSeta>} />
            </div>
            <div className="mt-[var(--intervalo)] grid gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-4">
              {feed.map((a, i) => (
                // No telemóvel ficam dois: a lista não se estende de mais.
                <CartaoArtigoConta key={a.slug} artigo={a} className={i >= 2 ? "max-sm:hidden" : ""} guardado={p.artigosGuardados.includes(a.slug)}
                  ocupado={p.aMudarArtigo.includes(a.slug)} aoGuardar={() => p.aoMudarArtigo(a.slug)} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bilhetes */}
      {bilhetes.length > 0 && (
        <Bloco titulo={<><Icone><Ticket /></Icone>{ps.bilhetes}</>} >
          <ul className="divide-y divide-white/10">
            {bilhetes.slice(0, 4).map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-white">{b.eventoTitulo}</span>
                  <span className="block text-sm text-white/80">{b.quantidade} × {b.tipoBilheteNome} · {formatKz(b.total)} · {b.referencia}</span>
                </span>
                <span className={`rounded-[4px] px-2 py-1 text-xs font-medium ${b.estado === "pago" ? "bg-ok text-white" : b.estado === "pendente" ? "bg-gold text-black" : "bg-white/15 text-white"}`}>
                  {estadoBilhete[b.estado] ?? b.estado}
                </span>
              </li>
            ))}
          </ul>
        </Bloco>
      )}

      {/* Anúncios e guardados */}
      <div className="grid gap-[var(--intervalo)] lg:grid-cols-2">
        <Bloco
          titulo={<><Icone><Tag /></Icone>{t.anuncios.titulo}</>}
          accao={p.anuncios.length > 0 ? <LigacaoSeta onClick={() => p.irPara("anuncios")}>{f(t.anuncios.verTodos, { n: p.anuncios.length })}</LigacaoSeta> : undefined}
        >
          {p.anuncios.length ? (
            <ul className="divide-y divide-white/10">
              {p.anuncios.slice(0, 3).map((a) => <LinhaAnuncio key={a.id} a={a} />)}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col">
              <p className="text-[15px] font-medium text-white">{t.anuncios.vazioTitulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/80">{t.anuncios.vazioTexto}</p>
              {p.marketplaceAberto && (
                <Button size="sm" className="mt-4 w-fit" onClick={p.aoPublicar}><Icon name="plus" className="size-4" />{t.anuncios.publicar}</Button>
              )}
            </div>
          )}
        </Bloco>

        <Bloco
          titulo={<><Icone><Bookmark /></Icone>{t.guardados.anuncios}</>}
          accao={p.favoritos?.length ? <LigacaoSeta onClick={() => p.irPara("guardados")}>{t.guardados.verTodos}</LigacaoSeta> : undefined}
        >
          <ListaAnunciosGuardados anuncios={p.favoritos} erro={p.erroFavoritos} aRemover={p.aRemoverFavorito}
            aoRemover={p.aoRemoverFavorito} aoTentar={p.aoTentarFavoritos} limite={3} />
        </Bloco>
      </div>

      {/* Garagem e fórum */}
      <div className="grid gap-[var(--intervalo)] lg:grid-cols-3">
        <Bloco
          className="lg:col-span-2"
          titulo={<><Icone><Bike /></Icone>{t.garagem.titulo}</>}
          accao={p.garagem.length > 0 ? <LigacaoSeta onClick={() => p.irPara("garagem")}>{t.guardados.verTodos}</LigacaoSeta> : undefined}
        >
          {p.garagem.length ? (
            <ul className="grid grid-cols-2 gap-[var(--intervalo)] sm:grid-cols-3">
              {p.garagem.slice(0, 3).map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => p.irPara("garagem")} className="group block w-full text-left">
                    <FotoMota mota={m} className="aspect-[4/3]" tamanhos="(max-width: 640px) 50vw, 20vw" />
                    <span className="mt-2 block truncate text-[15px] font-medium text-white">{m.apelido || `${m.marca} ${m.modelo}`}</span>
                    <span className="block truncate text-sm text-white/80">{m.apelido ? `${m.marca} ${m.modelo}` : ""}{m.ano ? `${m.apelido ? " · " : ""}${m.ano}` : ""}</span>
                    <span className="sr-only">{nomeMota(m)}</span>
                  </button>
                </li>
              ))}
              {p.garagem.length < 3 && (
                <li>
                  <button type="button" onClick={() => p.irPara("garagem")}
                    className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[var(--raio)] border-2 border-dashed border-white/25 text-[15px] text-white transition-colors hover:border-white/50 hover:bg-white/5">
                    <span aria-hidden className="grid size-10 place-items-center rounded-full bg-mb-red"><Icon name="plus" className="size-4" /></span>
                    {t.garagem.juntar}
                  </button>
                </li>
              )}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center">
              <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-[var(--raio)] bg-white/10 text-white"><Bike className="size-8" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-white">{t.garagem.vazioTitulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/80">{t.garagem.vazioTexto}</p>
              </div>
              <Button size="sm" variant="dark" onClick={() => p.irPara("garagem")}><Icon name="plus" className="size-4" />{t.garagem.juntar}</Button>
            </div>
          )}
        </Bloco>

        <Bloco titulo={<><Icone><MessagesSquare /></Icone>{ps.forum}</>}>
          {p.forum.recentes.length ? (
            <ul className="divide-y divide-white/10">
              {p.forum.recentes.map((r) => (
                <li key={`${r.tipo}-${r.topicoId}-${r.quando}`} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/forum/${r.topicoId}`} className="group block">
                    <span className="block text-sm text-white/80">{r.tipo === "topico" ? ps.forumTopico : ps.forumResposta} · {diaMesLongo(r.quando)}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[15px] font-medium leading-snug text-white transition-colors group-hover:text-mb-red-light">{r.titulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col">
              <p className="text-sm leading-relaxed text-white/85">{ps.forumVazio}</p>
              <ButtonLink href="/forum" variant="dark" size="sm" className="mt-4 w-fit">{ps.forumBotao}<Icon name="arrow" className="size-4" /></ButtonLink>
            </div>
          )}
        </Bloco>
      </div>
    </div>
  );
}
