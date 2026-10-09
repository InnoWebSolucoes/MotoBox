"use client";

/* ============================================================
   MOTOBOX ADMIN — Painel
   O site num relance: o que precisa de resposta (mensagens,
   denúncias, anúncios, encomendas), os números de cada secção,
   os próximos eventos e provas com a próxima ronda do
   campeonato, o que a equipa fez por último e quantos textos do
   site já foram editados. No fim, atalhos para todas as secções.
   ============================================================ */

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ArrowUpRight, BadgeCheck, CalendarDays, Flag, Inbox, Mail, MessagesSquare, Newspaper, Receipt, Route,
  Send, ShieldAlert, Sparkles, Store, Trophy, UserCog, UserRound, Users,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import { useAuth } from "@/lib/auth/contexto";
import { comBase } from "@/lib/base";
import { eComunidade, hrefEvento } from "@/lib/desporto";
import { eventosFuturos } from "@/lib/motobox";
import type { Evento } from "@/lib/types";
import { NAVEGACAO } from "@/components/admin/Shell";
import { BotaoLigacao, CabecalhoPagina, Carregando, Estado, Etiqueta, Painel, Vazio } from "@/components/admin/kit";
import { dataCurta, dataHora, diasAte, haQuanto, numero } from "./moderacao/_comum/formato";

type Icone = ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;

/** Resposta de GET /api/admin/conteudo (o índice do conteúdo editável). */
interface Indice {
  local: boolean;
  docs: { chave: string; titulo: string; pagina?: string; origem: "base" | "codigo"; atualizado?: string }[];
  grupos: { grupo: string; titulo: string; total: number; editados: number }[];
}

/** Onde se edita cada documento e cada grupo do conteúdo. */
function ondeEditar(chave: string): string {
  const fixos: Record<string, string> = {
    "paginas.marketplace": "/admin/marketplace?aba=pagina",
    "paginas.forum": "/admin/forum?aba=pagina",
    "paginas.clubes": "/admin/clubes?aba=pagina",
    "paginas.rotas": "/admin/rotas?aba=pagina",
    "paginas.eventos": "/admin/eventos?aba=pagina",
    "paginas.artigos": "/admin/noticias?aba=pagina",
    "paginas.desporto": "/admin/modalidades?aba=pagina",
    rotas: "/admin/rotas",
    "clubes-perfis": "/admin/clubes",
    modalidades: "/admin/modalidades",
    "eventos-extra": "/admin/eventos",
  };
  if (fixos[chave]) return fixos[chave];
  if (chave.startsWith("site.")) return "/admin/site";
  return "/admin/paginas";
}

const SAUDACAO = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 19 ? "Boa tarde" : "Boa noite";
};

export default function PainelAdmin() {
  const { estado, pronto } = useAdmin();
  const { perfil } = useAuth();
  const [indice, setIndice] = useState<Indice | null>(null);
  const [erroIndice, setErroIndice] = useState(false);
  // Data e saudação só depois de montar: o servidor não sabe a hora de quem vê.
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(comBase("/api/admin/conteudo"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Indice) => { if (vivo) setIndice(j); })
      .catch(() => { if (vivo) setErroIndice(true); });
    const t = window.setTimeout(() => { if (vivo) setAgora(Date.now()); }, 0);
    return () => { vivo = false; window.clearTimeout(t); };
  }, []);

  /* ---------- O que precisa de atenção ---------- */
  const atencao = useMemo(() => ({
    mensagens: estado.mensagens.filter((m) => !m.lida && !m.arquivada).length,
    denuncias: estado.denuncias.filter((d) => d.estado === "pendente").length,
    anuncios: estado.anuncios.filter((a) => !a.vendedor.verificado).length,
    encomendas: estado.encomendas.filter((e) => e.estado === "pendente").length,
    contas: estado.utilizadores.filter((u) => u.estado === "pendente").length,
  }), [estado]);

  /* ---------- Números do site ---------- */
  const futuros = useMemo(() => (agora === null ? [] : eventosFuturos(estado.eventos, agora)), [estado.eventos, agora]);
  const provas = useMemo(() => estado.eventos.filter((e) => !eComunidade(e.disciplina)), [estado.eventos]);
  const proximaRonda = useMemo(
    () => futuros.find((e) => !eComunidade(e.disciplina) && (e.ronda ?? 0) > 0),
    [futuros],
  );
  const rotas = indice?.grupos.find((g) => g.grupo === "rotas");

  const numeros: { nome: string; valor: number | string; nota: string; href: string; icone: Icone }[] = [
    {
      nome: "Artigos", valor: estado.noticias.length, href: "/admin/noticias", icone: Newspaper,
      nota: estado.noticias.length ? `Último a ${dataCurta([...estado.noticias].sort((a, b) => b.data.localeCompare(a.data))[0].data)}` : "Nenhum publicado",
    },
    {
      nome: "Eventos", valor: estado.eventos.length - provas.length, href: "/admin/eventos", icone: CalendarDays,
      nota: `${futuros.filter((e) => eComunidade(e.disciplina)).length} por acontecer`,
    },
    {
      nome: "Provas", valor: provas.length, href: "/admin/provas", icone: Flag,
      nota: `${futuros.filter((e) => !eComunidade(e.disciplina)).length} por disputar`,
    },
    {
      nome: "Clubes", valor: estado.clubes.length, href: "/admin/clubes", icone: Users,
      nota: `${estado.clubes.filter((c) => c.destaque).length} em destaque`,
    },
    {
      nome: "Rotas", valor: rotas ? rotas.total : indice || erroIndice ? "—" : "…", href: "/admin/rotas", icone: Route,
      nota: rotas ? `${rotas.editados} editada${rotas.editados === 1 ? "" : "s"} no painel` : "Guias de estrada",
    },
    {
      nome: "Pilotos", valor: estado.pilotos.length, href: "/admin/pilotos", icone: UserRound,
      nota: `${estado.equipas.length} equipas`,
    },
    {
      nome: "Anúncios", valor: estado.anuncios.length, href: "/admin/marketplace", icone: Store,
      nota: `${estado.anuncios.length - atencao.anuncios} de vendedores verificados`,
    },
    {
      nome: "Tópicos do fórum", valor: estado.topicos.length, href: "/admin/forum", icone: MessagesSquare,
      nota: `${numero(estado.topicos.reduce((s, t) => s + (t.respostas || 0), 0))} respostas`,
    },
    {
      nome: "Subscritores", valor: estado.subscritores.filter((s) => s.ativo).length, href: "/admin/newsletter", icone: Send,
      nota: (() => {
        const n = estado.subscritores.length - estado.subscritores.filter((s) => s.ativo).length;
        return n === 0 ? "Ninguém cancelou" : `${n} ${n === 1 ? "cancelou" : "cancelaram"}`;
      })(),
    },
    {
      nome: "Utilizadores", valor: estado.utilizadores.length, href: "/admin/utilizadores", icone: UserCog,
      nota: `${estado.utilizadores.filter((u) => u.papel !== "leitor").length} da equipa`,
    },
  ];

  /* ---------- Por tratar: as mais antigas primeiro ---------- */
  const porTratar = useMemo(() => {
    const lista: { id: string; quando: string; titulo: string; detalhe: string; href: string; tipo: string; icone: Icone }[] = [];
    for (const m of estado.mensagens) {
      if (!m.lida && !m.arquivada) lista.push({ id: `m-${m.id}`, quando: m.recebido, titulo: m.assunto || "Sem assunto", detalhe: m.nome, href: "/admin/mensagens", tipo: "Mensagem", icone: Mail });
    }
    for (const d of estado.denuncias) {
      if (d.estado === "pendente") lista.push({ id: `d-${d.id}`, quando: d.criado, titulo: d.alvoTitulo, detalhe: d.motivo, href: "/admin/moderacao", tipo: "Denúncia", icone: ShieldAlert });
    }
    for (const e of estado.encomendas) {
      if (e.estado === "pendente") lista.push({ id: `e-${e.id}`, quando: e.criado, titulo: `${e.referencia} · ${e.eventoTitulo}`, detalhe: e.comprador.nome, href: "/admin/encomendas", tipo: "Encomenda", icone: Receipt });
    }
    return lista.sort((a, b) => b.quando.localeCompare(a.quando)).slice(0, 6);
  }, [estado.mensagens, estado.denuncias, estado.encomendas]);

  /* ---------- Textos do site ---------- */
  const textos = useMemo(() => {
    if (!indice) return null;
    const editados = indice.docs.filter((d) => d.origem === "base").length;
    const itens = indice.grupos.reduce((s, g) => s + g.total, 0);
    const itensEditados = indice.grupos.reduce((s, g) => s + g.editados, 0);
    const recentes = indice.docs
      .filter((d) => d.origem === "base")
      .sort((a, b) => (b.atualizado ?? "").localeCompare(a.atualizado ?? ""))
      .slice(0, 4);
    return { editados, total: indice.docs.length, itens, itensEditados, recentes };
  }, [indice]);

  const nome = perfil?.nome?.split(/\s+/)[0];

  return (
    <>
      <CabecalhoPagina
        sobretitulo={agora ? new Date(agora).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" }) : undefined}
        titulo={agora ? `${SAUDACAO()}${nome ? `, ${nome}` : ""}` : "Painel"}
        descricao="O site MotoBox num relance: o que precisa de resposta, os números de cada secção e o que vem a seguir."
        accoes={
          <>
            <BotaoLigacao href="/admin/organizador" variante="secundario"><Sparkles className="size-4" aria-hidden />Organizador IA</BotaoLigacao>
            <BotaoLigacao href="/" externo variante="primario">Ver o site<ArrowUpRight className="size-4" aria-hidden /></BotaoLigacao>
          </>
        }
      />

      {/* ---------- Precisa de atenção ---------- */}
      <section aria-labelledby="atencao" className="mb-[var(--intervalo)]">
        <h2 id="atencao" className="sr-only">Precisa de atenção</h2>
        <div className="grid grid-cols-2 gap-[var(--intervalo)] md:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
          <Alerta n={atencao.mensagens} pronto={pronto} href="/admin/mensagens" icone={Mail}
            um="mensagem por ler" varios="mensagens por ler" zero="Caixa de entrada em dia" />
          <Alerta n={atencao.denuncias} pronto={pronto} href="/admin/moderacao" icone={ShieldAlert}
            um="denúncia por resolver" varios="denúncias por resolver" zero="Sem denúncias por resolver" />
          <Alerta n={atencao.anuncios} pronto={pronto} href="/admin/marketplace?filtro=por-verificar" icone={BadgeCheck}
            um="anúncio de vendedor por verificar" varios="anúncios de vendedores por verificar" zero="Vendedores todos verificados" />
          <Alerta n={atencao.encomendas} pronto={pronto} href="/admin/encomendas" icone={Receipt}
            um="encomenda por confirmar" varios="encomendas por confirmar" zero="Encomendas todas confirmadas" />
          <Alerta n={atencao.contas} pronto={pronto} href="/admin/utilizadores" icone={UserCog}
            um="conta por aprovar" varios="contas por aprovar" zero="Sem contas por aprovar" />
        </div>
      </section>

      {/* ---------- Números ---------- */}
      <section aria-labelledby="numeros" className="painel painel-escuro mb-[var(--intervalo)]">
        <h2 id="numeros" className="sr-only">O site em números</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {numeros.map((n) => {
            const Ic = n.icone;
            return (
              <li key={n.nome} className="border-b border-r border-white/[0.06]">
                <Link href={n.href} className="group flex h-full flex-col p-4 transition-colors hover:bg-white/[0.05] md:p-5">
                  <span className="flex items-center justify-between gap-2 text-sm text-white/80">
                    {n.nome}
                    <Ic className="size-4 shrink-0 text-white/70 transition-colors group-hover:text-mb-red-light" aria-hidden />
                  </span>
                  <span className="mt-3 text-[1.85rem] font-semibold leading-none tabular-nums tracking-tight">
                    {pronto || typeof n.valor === "string" ? (typeof n.valor === "number" ? numero(n.valor) : n.valor) : "…"}
                  </span>
                  <span className="mt-2 truncate text-xs text-white/70">{n.nota}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-[var(--intervalo)] xl:grid-cols-3">
        {/* ---------- Próximos eventos e provas ---------- */}
        <Painel
          titulo="O que vem a seguir"
          descricao="Eventos e provas por acontecer, do mais próximo para o mais distante."
          icone={<CalendarDays />}
          className="xl:col-span-2"
          accoes={<BotaoLigacao href="/admin/provas" variante="fantasma" tamanho="sm">Provas</BotaoLigacao>}
        >
          {proximaRonda && <ProximaRonda evento={proximaRonda} agora={agora} />}
          {agora === null ? <Carregando /> : futuros.length === 0 ? (
            <Vazio titulo="Nada agendado">Crie um evento ou uma prova para aparecer no site.</Vazio>
          ) : (
            <ul className="divide-y divide-white/[0.07]">
              {futuros.filter((e) => e.slug !== proximaRonda?.slug).slice(0, 6).map((e) => (
                <LinhaEvento key={e.slug} e={e} />
              ))}
            </ul>
          )}
        </Painel>

        {/* ---------- Por tratar ---------- */}
        <Painel titulo="Por tratar" descricao="Mensagens, denúncias e encomendas à espera da equipa." icone={<Inbox />}>
          {!pronto ? <Carregando /> : porTratar.length === 0 ? (
            <Vazio titulo="Está tudo tratado">Não há mensagens por ler, denúncias nem encomendas pendentes.</Vazio>
          ) : (
            <ul className="space-y-[var(--intervalo)]">
              {porTratar.map((p) => {
                const Ic = p.icone;
                return (
                  <li key={p.id}>
                    <Link href={p.href} className="group flex items-start gap-3 rounded-[var(--raio)] bg-black/[0.15] p-3 transition-colors hover:bg-white/[0.07]">
                      <span className="grid size-8 shrink-0 place-items-center rounded-[4px] bg-white/[0.08] text-white/80 group-hover:bg-mb-red group-hover:text-white">
                        <Ic className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">{p.titulo}</span>
                        <span className="block truncate text-xs text-white/75">{p.tipo} · {p.detalhe} · {agora ? haQuanto(p.quando, agora) : dataCurta(p.quando)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Painel>

        {/* ---------- Actividade ---------- */}
        <Painel
          titulo="Actividade recente"
          descricao="O que a equipa mudou por último no painel."
          className="xl:col-span-2"
          accoes={<BotaoLigacao href="/admin/atividade" variante="fantasma" tamanho="sm">Ver tudo</BotaoLigacao>}
        >
          {estado.atividade.length === 0 ? (
            <Vazio titulo="Ainda sem actividade" />
          ) : (
            <ol className="divide-y divide-white/[0.07]">
              {estado.atividade.slice(0, 7).map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5 text-sm">
                  <span className="text-white">{a.utilizador}</span>
                  <span className="text-white/80">{a.accao.toLowerCase()}</span>
                  <Etiqueta>{a.entidade}</Etiqueta>
                  <span className="min-w-0 flex-1 basis-40 truncate text-white/75">{a.detalhe}</span>
                  <span className="shrink-0 text-xs tabular-nums text-white/70" suppressHydrationWarning>{dataHora(a.quando)}</span>
                </li>
              ))}
            </ol>
          )}
        </Painel>

        {/* ---------- Textos do site ---------- */}
        <Painel titulo="Textos do site" descricao="Páginas e guias que já foram mudados no painel." icone={<Newspaper />}>
          {!textos ? (
            erroIndice ? <p className="text-sm text-white/75">Não foi possível ler o estado dos textos.</p> : <Carregando />
          ) : (
            <div className="space-y-4">
              <Medidor rotulo="Páginas e blocos" editados={textos.editados} total={textos.total} />
              <Medidor rotulo="Rotas, perfis de clubes e modalidades" editados={textos.itensEditados} total={textos.itens} />
              {textos.recentes.length > 0 ? (
                <ul className="space-y-1 border-t border-white/[0.07] pt-3">
                  {textos.recentes.map((d) => (
                    <li key={d.chave}>
                      <Link href={ondeEditar(d.chave)} className="flex items-baseline justify-between gap-3 rounded-[4px] px-1 py-1 text-sm hover:bg-white/[0.06]">
                        <span className="truncate text-white/85">{d.titulo}</span>
                        <span className="shrink-0 text-xs text-white/70">{d.atualizado ? dataCurta(d.atualizado) : "Editado"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-white/[0.07] pt-3 text-sm text-white/75">
                  Tudo como no lançamento: nenhum texto foi mudado no painel.
                </p>
              )}
              {indice?.local && <p className="text-xs text-gold">Demonstração local: os textos gravam-se neste computador.</p>}
            </div>
          )}
        </Painel>
      </div>

      {/* ---------- Atalhos ---------- */}
      <section aria-labelledby="atalhos" className="mt-8">
        <h2 id="atalhos" className="titulo-4 mb-4">Todas as secções</h2>
        <div className="grid gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-4">
          {NAVEGACAO.map((g) => {
            const itens = g.itens.filter((i) => i.href !== "/admin");
            if (itens.length === 0) return null;
            return (
              <div key={g.grupo} className="painel painel-escuro p-4">
                <p className="mb-2 text-xs text-white/70">{g.grupo}</p>
                <ul className="space-y-0.5">
                  {itens.map((i) => {
                    const Ic = i.icone;
                    return (
                      <li key={i.href}>
                        <Link href={i.href} className="flex items-center gap-3 rounded-[var(--raio)] px-2 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white">
                          <Ic className="size-4 shrink-0 text-white/75" strokeWidth={1.8} aria-hidden />
                          {i.nome}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/** Mosaico de alerta: vermelho com número quando há algo a fazer, discreto quando não. */
function Alerta({ n, pronto, href, icone: Ic, um, varios, zero }: {
  n: number; pronto: boolean; href: string; icone: Icone; um: string; varios: string; zero: string;
}) {
  const activo = pronto && n > 0;
  return (
    <Link
      href={href}
      className={`painel group flex min-h-32 flex-col p-4 transition-colors md:p-5 ${
        activo ? "painel-escuro ring-1 ring-inset ring-mb-red/45 hover:bg-white/[0.06]" : "painel-escuro hover:bg-white/[0.06]"
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        {activo ? (
          <span className="chip-mb !size-8 [&_svg]:!size-4"><Ic aria-hidden /></span>
        ) : (
          <Ic className="size-5 text-white/70" aria-hidden />
        )}
        <ArrowUpRight className="size-4 text-white/70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden />
      </span>
      {activo ? (
        <span className="mt-auto pt-4">
          <span className="block text-[2rem] font-semibold leading-none tabular-nums">{n}</span>
          <span className="mt-1.5 block text-sm leading-snug text-white/80">{n === 1 ? um : varios}</span>
        </span>
      ) : (
        <span className="mt-auto pt-4 text-sm leading-snug text-white/80">{pronto ? zero : "A verificar…"}</span>
      )}
    </Link>
  );
}

/** A próxima ronda do Campeonato Nacional, em destaque. */
function ProximaRonda({ evento: e, agora }: { evento: Evento; agora: number | null }) {
  const dias = agora ? diasAte(e.dataInicio, agora) : null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-[var(--raio)] border border-mb-red/40 bg-mb-red/[0.12] p-4">
      <span className="chip-mb"><Trophy aria-hidden /></span>
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-xs text-mb-red-light">Próxima ronda do campeonato · Ronda {e.ronda}</p>
        <p className="mt-0.5 truncate text-lg font-semibold">{e.titulo}</p>
        <p className="truncate text-sm text-white/80">
          {dataCurta(e.dataInicio, true)} · {[e.circuito, e.localidade || e.provincia].filter(Boolean).join(", ")}
        </p>
      </div>
      <div className="text-right">
        {dias !== null && (
          <p className="text-2xl font-semibold tabular-nums leading-none">
            {dias <= 0 ? "Hoje" : dias === 1 ? "Amanhã" : `${dias} dias`}
          </p>
        )}
        <a href={comBase(hrefEvento(e))} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-xs text-white/70 hover:text-white">
          <span className="sublinhado">Ver no site</span>
        </a>
      </div>
    </div>
  );
}

function LinhaEvento({ e }: { e: Evento }) {
  const d = new Date(`${e.dataInicio.slice(0, 10)}T12:00:00`);
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const comunidade = eComunidade(e.disciplina);
  return (
    <li>
      <Link href={comunidade ? "/admin/eventos" : "/admin/provas"} className="group flex items-center gap-4 py-2.5">
        <span className="grid w-12 shrink-0 place-items-center rounded-[4px] bg-white/[0.07] py-1.5 text-center leading-none">
          <span className="text-lg font-semibold tabular-nums">{d.getDate()}</span>
          <span className="mt-0.5 text-[11px] text-white/75">{meses[d.getMonth()]}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] text-white group-hover:text-mb-red-light">{e.titulo}</span>
          <span className="block truncate text-xs text-white/75">
            {comunidade ? e.disciplina : `Prova · ${e.disciplina}${e.ronda ? ` · Ronda ${e.ronda}` : ""}`} · {[e.localidade, e.provincia].filter(Boolean).join(", ")}
          </span>
        </span>
        <span className="hidden sm:block"><Estado valor={e.estado} /></span>
      </Link>
    </li>
  );
}

function Medidor({ rotulo, editados, total }: { rotulo: string; editados: number; total: number }) {
  const pct = total ? Math.round((editados / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-white/75">{rotulo}</span>
        <span className="shrink-0 tabular-nums text-white/75">
          <span className="text-white">{editados}</span> de {total} editados
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={editados} aria-label={rotulo}>
        <div className="h-full rounded-full bg-mb-red" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-white/70">{total - editados} ainda com o texto original</p>
    </div>
  );
}
