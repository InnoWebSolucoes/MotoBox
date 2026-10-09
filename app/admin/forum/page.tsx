"use client";

/* ============================================================
   MOTOBOX ADMIN — Fórum
   Abas: Tópicos (fixar, fechar, resolvido, visível, e tudo o que
   a página do tópico mostra), Respostas dos membros (esconder ou
   apagar), Categorias (nome, descrição, ícone, cor) e Página
   Fórum (os textos fixos de /forum, de cada tópico e de
   /forum/novo, os níveis e as regras dos tópicos dos membros).

   Tópicos abertos pelos membros: a conta de quem o abriu e a
   mensagem completa ficam na "mensagem de abertura", a linha
   "op-<tópico>" das respostas (ver app/forum/_servidor/forum.ts).
   Os votos vivem no conteúdo editável ("forum-votos"). Ambos se
   lêem e se mexem em /admin/forum/extra.
   ============================================================ */

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowBigUp, CheckCircle2, ExternalLink, Eye, EyeOff, Lock, LockOpen, MessagesSquare, Pin, Trash2, UserRound,
} from "lucide-react";
import { PaginaRecurso, useAbaUrl } from "@/components/admin/Recurso";
import {
  Abas, AccaoIcone, Area, Aviso, Botao, CabecalhoPagina, Campo, CampoCor, Carregando, Confirmar,
  Estado, Etiqueta, Ferramentas, Grupo, Input, Interruptor, Painel, Procura, Seleccao, Vazio,
  useAviso, usePaginacao,
} from "@/components/admin/kit";
import { EditorDoc } from "@/components/admin/editor/EditorDoc";
import type { CampoEsquema } from "@/components/admin/editor/esquema";
import { Icon } from "@/components/ui";
import { useAdmin, novoId, slugify } from "@/lib/admin/store";
import { comBase } from "@/lib/base";
import type { CategoriaForum, TopicoForum } from "@/lib/types";
import { useVisibilidade } from "../moderacao/_comum/visibilidade";
import { Avatar, EscolhaIcone, Ficha } from "../moderacao/_comum/partes";
import { dataCurta, haQuanto, iniciais, numero } from "../moderacao/_comum/formato";

const ABAS = ["topicos", "respostas", "categorias", "pagina"] as const;
type Aba = (typeof ABAS)[number];
const DESCRICAO = "Os tópicos e as respostas da comunidade, as categorias e os textos das páginas do Fórum.";

/** Ícones que o site sabe desenhar nas categorias. */
const ICONES_CATEGORIA: { valor: string; nome: string }[] = [
  { valor: "map", nome: "Mapa (passeios)" }, { valor: "wrench", nome: "Chave (mecânica)" },
  { valor: "shield", nome: "Escudo (segurança)" }, { valor: "help", nome: "Ponto de interrogação (dúvidas)" },
  { valor: "flag", nome: "Bandeira (provas)" }, { valor: "chat", nome: "Balão de conversa" },
  { valor: "bike", nome: "Mota" }, { valor: "user", nome: "Pessoa" }, { valor: "calendar", nome: "Calendário" },
  { valor: "trophy", nome: "Taça" }, { valor: "tag", nome: "Etiqueta (compras)" }, { valor: "star", nome: "Estrela" },
  { valor: "heart", nome: "Coração" }, { valor: "fire", nome: "Chama" }, { valor: "pin", nome: "Alfinete (local)" },
  { valor: "bell", nome: "Sino (avisos)" }, { valor: "settings", nome: "Roda dentada" }, { valor: "trending", nome: "Tendência" },
];

export default function Pagina() {
  return (
    <Suspense fallback={<Carregando />}>
      <AdminForum />
    </Suspense>
  );
}

function AdminForum() {
  const [aba, setAba] = useAbaUrl(ABAS);
  const { estado } = useAdmin();
  const abas = (
    <Abas<Aba>
      rotulo="Partes do Fórum"
      abas={[
        { chave: "topicos", nome: "Tópicos", contador: estado.topicos.length },
        { chave: "respostas", nome: "Respostas" },
        { chave: "categorias", nome: "Categorias", contador: estado.categoriasForum.length },
        { chave: "pagina", nome: "Página Fórum" },
      ]}
      activa={aba}
      onChange={setAba}
    />
  );
  const cabecalho = <CabecalhoPagina titulo="Fórum" sobretitulo="Comunidade" descricao={DESCRICAO} icone={<MessagesSquare />} />;

  if (aba === "categorias") return <Categorias abas={abas} />;
  if (aba === "respostas") {
    return (<>{cabecalho}<div className="mb-[var(--intervalo)]">{abas}</div><Respostas /></>);
  }
  if (aba === "pagina") {
    return (
      <>
        {cabecalho}
        <div className="mb-[var(--intervalo)]">{abas}</div>
        <EditorDoc chave="paginas.forum" pagina="/forum" titulo="Fórum (página da secção)" esquema={ESQUEMA_PAGINA} />
      </>
    );
  }
  return <Topicos abas={abas} />;
}

/* ---------------- Autores e votos (/admin/forum/extra) ---------------- */

interface AutorMembro { nome: string; email?: string; utilizadorId?: string }
interface ExtraForum { votos: Record<string, number>; membros: Record<string, AutorMembro>; local?: boolean }

function useExtraForum() {
  const [extra, setExtra] = useState<ExtraForum>({ votos: {}, membros: {} });
  useEffect(() => {
    let vivo = true;
    fetch(comBase("/admin/forum/extra"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo && j) setExtra({ votos: j.votos ?? {}, membros: j.membros ?? {}, local: j.local }); })
      .catch(() => { /* sem ligação: sem autores nem votos */ });
    return () => { vivo = false; };
  }, []);

  /** Tira todos os votos de um tópico ou resposta. Devolve null quando correu bem. */
  const repor = useCallback(async (alvo: string): Promise<string | null> => {
    try {
      const r = await fetch(comBase(`/admin/forum/extra?alvo=${encodeURIComponent(alvo)}`), { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return String(j.erro ?? `Erro ${r.status}`);
      setExtra((e) => {
        const votos = { ...e.votos };
        delete votos[alvo];
        return { ...e, votos };
      });
      return null;
    } catch {
      return "Sem ligação ao servidor.";
    }
  }, []);
  return { extra, repor };
}

/* ---------------- Tópicos ---------------- */

function Topicos({ abas }: { abas: ReactNode }) {
  const { estado, atualizar, guardarDefinicoes, registar } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const vis = useVisibilidade();
  const { extra, repor } = useExtraForum();

  const tirarVotos = async (t: TopicoForum) => {
    const falha = await repor(t.id);
    if (!falha) registar("apagou", "Votos do fórum", `«${t.titulo}»`);
    mostrar(falha ?? "Os votos do tópico foram retirados.", falha ? "erro" : "ok");
  };

  const categorias = useMemo(
    () => estado.categoriasForum.map((c) => ({ valor: c.slug, nome: c.nome })),
    [estado.categoriasForum],
  );

  const alternar = async (t: TopicoForum, campo: "fixado" | "bloqueado" | "resolvido") => {
    const novo = !t[campo];
    const falha = await atualizar("topicos", t.id, { [campo]: novo });
    const textos = {
      fixado: novo ? "Tópico fixado no topo do Fórum." : "Tópico desafixado.",
      bloqueado: novo ? "Tópico fechado a novas respostas." : "Tópico reaberto a respostas.",
      resolvido: novo ? "Marcado como resolvido." : "Deixou de estar marcado como resolvido.",
    };
    mostrar(falha ?? textos[campo], falha ? "erro" : "ok");
  };

  const alternarVisivel = async (t: TopicoForum) => {
    const mostrarNoSite = !vis.visivel("topicos", t.id);
    const falha = await vis.mudar("topicos", t.id, mostrarNoSite);
    mostrar(falha ?? (mostrarNoSite ? "O tópico voltou a aparecer no Fórum." : "Tópico escondido do Fórum."), falha ? "erro" : "ok");
  };

  return (
    <>
      <PaginaRecurso<TopicoForum>
        coleccao="topicos"
        titulo="Fórum"
        sobretitulo="Comunidade"
        icone={<MessagesSquare />}
        descricao={DESCRICAO}
        nomeItem="tópico"
        vazio="Ainda não há tópicos"
        larguraGaveta="max-w-2xl"
        porPagina={15}
        procuraPlaceholder="Título, autor ou mensagem…"
        mensagemApagar="O tópico e todas as respostas saem do Fórum de vez. Para o tirar só por agora, esconda-o."
        topo={
          <>
            {abas}
            <div className="grid gap-[var(--intervalo)] lg:grid-cols-2">
              <div className="painel painel-escuro p-4">
                <Interruptor
                  activo={estado.definicoes.forumAberto}
                  etiqueta="Fórum aberto a respostas"
                  descricao="Desligado, ninguém pode responder; cada tópico mostra «Fórum fechado». Os tópicos continuam visíveis."
                  onChange={async (v) => {
                    const falha = await guardarDefinicoes({ forumAberto: v });
                    mostrar(falha ?? (v ? "Fórum aberto." : "Fórum fechado a respostas."), falha ? "erro" : "ok");
                  }}
                />
              </div>
              <Aviso titulo="Atalhos de cada linha">
                <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span><Pin className="inline size-3.5 align-[-2px]" aria-hidden /> fixar no topo</span>
                  <span><Lock className="inline size-3.5 align-[-2px]" aria-hidden /> fechar a respostas</span>
                  <span><CheckCircle2 className="inline size-3.5 align-[-2px]" aria-hidden /> resolvido</span>
                  <span><Eye className="inline size-3.5 align-[-2px]" aria-hidden /> mostrar ou esconder</span>
                </span>
              </Aviso>
            </div>
            <Aviso titulo="Tópicos abertos pelos membros">
              Os membros com sessão abrem tópicos em /forum/novo; aparecem aqui com a marca «Membro». Em
              Página Fórum › Tópicos dos membros pode pedir que fiquem escondidos até os rever: nesse caso
              chegam com o estado «Escondido» e aparecem no Fórum quando carregar no olho.
            </Aviso>
          </>
        }
        procuraEm={(t) => `${t.titulo} ${t.autor} ${t.excerto} ${t.categoria}`}
        ordenar={(a, b) => Number(Boolean(b.fixado)) - Number(Boolean(a.fixado)) || b.criado.localeCompare(a.criado)}
        filtrosRapidos={[
          { chave: "fixados", nome: "Fixados", teste: (t) => Boolean(t.fixado) },
          { chave: "fechados", nome: "Fechados", teste: (t) => Boolean(t.bloqueado) },
          { chave: "resolvidos", nome: "Resolvidos", teste: (t) => Boolean(t.resolvido) },
          { chave: "escondidos", nome: "Escondidos", teste: (t) => !vis.visivel("topicos", t.id) },
          { chave: "membros", nome: "Dos membros", teste: (t) => Boolean(extra.membros[t.id]) },
          { chave: "votados", nome: "Com votos", teste: (t) => (extra.votos[t.id] ?? 0) > 0 },
        ]}
        filtros={[{ chave: "categoriaSlug", etiqueta: "Todas as categorias", opcoes: categorias }]}
        colunas={[
          {
            cabecalho: "Tópico",
            celula: (t) => (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar cor={t.avatarCor} texto={t.autorAvatar} nome={t.autor} />
                <div className="min-w-0">
                  <p className="max-w-[20rem] truncate font-medium text-white">{t.titulo || "Sem título"}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-white/75">
                    <span>{t.autor} · {dataCurta(t.criado)}</span>
                    {extra.membros[t.id] && <span className="inline-flex items-center gap-1 text-white/80"><UserRound className="size-3" aria-hidden />Membro</span>}
                    {t.fixado && <span className="inline-flex items-center gap-1 text-mb-red-light"><Pin className="size-3" aria-hidden />Fixado</span>}
                    {t.bloqueado && <span className="inline-flex items-center gap-1"><Lock className="size-3" aria-hidden />Fechado</span>}
                    {t.resolvido && <span className="inline-flex items-center gap-1 text-[#4ade80]"><CheckCircle2 className="size-3" aria-hidden />Resolvido</span>}
                  </p>
                </div>
              </div>
            ),
          },
          { cabecalho: "Categoria", celula: (t) => <span className="block max-w-36 truncate text-white/70">{t.categoria || "Sem categoria"}</span> },
          {
            cabecalho: "Respostas",
            celula: (t) => (
              <span className="whitespace-nowrap tabular-nums text-white/70">
                {numero(t.respostas)}
                <span className="block text-xs text-white/70">{numero(t.visualizacoes)} vistas</span>
                {(extra.votos[t.id] ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-white/80">
                    <ArrowBigUp className="size-3.5" aria-hidden />{numero(extra.votos[t.id])} votos
                  </span>
                )}
              </span>
            ),
          },
          {
            cabecalho: "No site",
            celula: (t) => vis.visivel("topicos", t.id)
              ? <Estado valor="publicado" rotulo="Visível" />
              : <Estado valor="suspenso" rotulo="Escondido" />,
          },
        ]}
        accoesLinha={(t) => (
          <>
            <AccaoIcone titulo={t.fixado ? "Desafixar" : "Fixar no topo"} onClick={() => void alternar(t, "fixado")}>
              <Pin className={`size-3.5 ${t.fixado ? "text-mb-red-light" : ""}`} aria-hidden />
            </AccaoIcone>
            <AccaoIcone titulo={t.bloqueado ? "Reabrir a respostas" : "Fechar a respostas"} onClick={() => void alternar(t, "bloqueado")}>
              {t.bloqueado ? <Lock className="size-3.5 text-gold" aria-hidden /> : <LockOpen className="size-3.5" aria-hidden />}
            </AccaoIcone>
            <AccaoIcone titulo={t.resolvido ? "Tirar «resolvido»" : "Marcar resolvido"} tom="ok" onClick={() => void alternar(t, "resolvido")}>
              <CheckCircle2 className={`size-3.5 ${t.resolvido ? "text-[#4ade80]" : ""}`} aria-hidden />
            </AccaoIcone>
            <AccaoIcone titulo={vis.visivel("topicos", t.id) ? "Esconder do site" : "Mostrar no site"} onClick={() => void alternarVisivel(t)}>
              {vis.visivel("topicos", t.id) ? <Eye className="size-3.5" aria-hidden /> : <EyeOff className="size-3.5 text-gold" aria-hidden />}
            </AccaoIcone>
          </>
        )}
        ligacaoSite={(t) => `/forum/${encodeURIComponent(t.id)}`}
        tituloItem={(t) => t.titulo || "Tópico sem título"}
        novoRegisto={() => {
          const c = estado.categoriasForum[0];
          return {
            id: novoId("t"), titulo: "", categoria: c?.nome ?? "", categoriaSlug: c?.slug ?? "",
            autor: "Equipa MotoBox", autorAvatar: "MB", avatarCor: "#e10600",
            criado: new Date().toISOString().slice(0, 10), respostas: 0, visualizacoes: 0,
            ultimaResposta: { autor: "", quando: "" }, excerto: "",
          };
        }}
        preparar={(r) => {
          if (!r.titulo.trim()) return "Escreva o título do tópico.";
          if (!r.autor.trim()) return "Escreva o nome de quem abre o tópico.";
          const cat = estado.categoriasForum.find((c) => c.slug === r.categoriaSlug);
          return {
            ...r, titulo: r.titulo.trim(),
            categoria: cat?.nome ?? r.categoria,
            autorAvatar: (r.autorAvatar || iniciais(r.autor)).slice(0, 3).toUpperCase(),
          };
        }}
        formulario={(r, definir, { novo }) => (
          <>
            <Grupo titulo="O tópico" descricao="O título e a mensagem com que o tópico abre.">
              <Campo etiqueta="Título" obrigatorio>
                <Input value={r.titulo} onChange={(e) => definir({ titulo: e.target.value })} />
              </Campo>
              <Campo etiqueta="Categoria" ajuda="As pílulas de categorias do Fórum filtram por ela.">
                <Seleccao valor={r.categoriaSlug} opcoes={[{ valor: "", nome: "Sem categoria" }, ...categorias]}
                  onChange={(v) => definir({ categoriaSlug: v })} />
              </Campo>
              <Campo
                etiqueta={extra.membros[r.id] ? "Resumo" : "Mensagem de abertura"}
                ajuda={extra.membros[r.id]
                  ? "O resumo da lista do Fórum e do Google. A mensagem completa do membro está na aba Respostas, como «Mensagem de abertura»."
                  : "O texto do autor no topo da página do tópico. Também é o resumo que o Google mostra."}
              >
                <Area rows={6} value={r.excerto} onChange={(e) => definir({ excerto: e.target.value })} />
              </Campo>
            </Grupo>

            {!novo && (
              <Grupo
                titulo="Autor e votos"
                descricao={extra.membros[r.id]
                  ? "Aberto por um membro com sessão, em /forum/novo."
                  : "Aberto pela equipa, aqui no painel."}
              >
                <Ficha linhas={[
                  ...(extra.membros[r.id] ? [
                    ["Conta", extra.membros[r.id].nome || "—"] as [string, ReactNode],
                    ["Email", extra.membros[r.id].email || "—"] as [string, ReactNode],
                  ] : []),
                  ["Votos", numero(extra.votos[r.id] ?? 0)],
                ]} />
                <div className="flex flex-wrap gap-2">
                  {extra.membros[r.id] && (
                    <Link href={`/admin/forum?aba=respostas&topico=${encodeURIComponent(r.id)}`}
                      className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
                      <span className="sublinhado">Ver a mensagem de abertura e as respostas</span>
                    </Link>
                  )}
                  {(extra.votos[r.id] ?? 0) > 0 && (
                    <Botao tamanho="sm" onClick={() => void tirarVotos(r)}>
                      <ArrowBigUp className="size-4" aria-hidden />Tirar os votos
                    </Botao>
                  )}
                </div>
              </Grupo>
            )}

            <Grupo titulo="Quem abriu o tópico">
              <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                <Campo etiqueta="Nome" obrigatorio>
                  <Input value={r.autor} onChange={(e) => definir({ autor: e.target.value })} />
                </Campo>
                <Campo etiqueta="Iniciais" ajuda="No quadradinho.">
                  <Input value={r.autorAvatar} maxLength={3} placeholder={iniciais(r.autor)}
                    onChange={(e) => definir({ autorAvatar: e.target.value.toUpperCase() })} />
                </Campo>
              </div>
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <CampoCor etiqueta="Cor do quadradinho" valor={r.avatarCor} onChange={(v) => definir({ avatarCor: v })} />
                </div>
                <Avatar cor={r.avatarCor} texto={r.autorAvatar || iniciais(r.autor)} className="mb-0.5 size-11 text-sm" />
              </div>
            </Grupo>

            <Grupo titulo="Estado">
              <Interruptor activo={Boolean(r.fixado)} etiqueta="Fixado no topo"
                descricao="Aparece antes dos outros, com a marca «Fixado»." onChange={(v) => definir({ fixado: v })} />
              <Interruptor activo={Boolean(r.bloqueado)} etiqueta="Fechado a novas respostas"
                descricao="Continua visível, com «Tópico fechado» no lugar da caixa de resposta." onChange={(v) => definir({ bloqueado: v })} />
              <Interruptor activo={Boolean(r.resolvido)} etiqueta="Resolvido"
                descricao="Mostra a marca «Resolvido» (a dúvida já tem resposta)." onChange={(v) => definir({ resolvido: v })} />
              {!novo && (
                <Interruptor activo={vis.visivel("topicos", r.id)} etiqueta="Visível no site"
                  descricao="Desligado, o tópico sai do Fórum mas fica guardado aqui. Muda logo, sem precisar de guardar."
                  onChange={() => void alternarVisivel(r)} />
              )}
            </Grupo>

            <Grupo titulo="Números e datas">
              <div className="grid gap-4 sm:grid-cols-3">
                <Campo etiqueta="Data">
                  <Input type="date" value={r.criado.slice(0, 10)} onChange={(e) => definir({ criado: e.target.value })} />
                </Campo>
                <Campo etiqueta="Visualizações">
                  <Input type="number" min={0} value={r.visualizacoes} onChange={(e) => definir({ visualizacoes: Number(e.target.value) || 0 })} />
                </Campo>
                <Campo etiqueta="Respostas" ajuda="Acerta-se sozinho quando os membros respondem.">
                  <Input type="number" min={0} value={r.respostas} onChange={(e) => definir({ respostas: Number(e.target.value) || 0 })} />
                </Campo>
              </div>
              {r.ultimaResposta?.autor && (
                <Ficha linhas={[["Última resposta", `${r.ultimaResposta.autor}${r.ultimaResposta.quando ? `, ${r.ultimaResposta.quando}` : ""}`]]} />
              )}
            </Grupo>

            {!novo && (
              <Link href={`/admin/forum?aba=respostas&topico=${encodeURIComponent(r.id)}`}
                className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
                <span className="sublinhado">Ver as respostas dos membros a este tópico</span>
              </Link>
            )}
          </>
        )}
      />
      {elemento}
    </>
  );
}

/* ---------------- Respostas dos membros ---------------- */

interface Resposta {
  id: string; topicoId: string; autorNome: string; autorCor: string; corpo: string; criadoEm: string; publicado: boolean;
  /** A mensagem de abertura de um tópico aberto por um membro (linha "op-<tópico>"). */
  abertura?: boolean;
}

type Leitura = { estado: "a-ler" } | { estado: "sem-base" } | { estado: "erro"; erro: string }
  | { estado: "pronto"; respostas: Resposta[]; aviso?: string };

async function lerRespostas(): Promise<Leitura> {
  try {
    const r = await fetch(comBase("/admin/forum/respostas"), { cache: "no-store" });
    if (r.status === 503) return { estado: "sem-base" };
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) return { estado: "erro", erro: String(j?.erro ?? `Erro ${r.status}`) };
    return { estado: "pronto", respostas: j.respostas ?? [], aviso: j.aviso };
  } catch {
    return { estado: "erro", erro: "Sem ligação ao servidor." };
  }
}

function Respostas() {
  const { estado, registar } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const { extra, repor } = useExtraForum();
  // "Ver as respostas a este tópico" chega com ?topico=<id>.
  const topicoInicial = useSearchParams().get("topico") ?? "";
  const [leitura, setLeitura] = useState<Leitura>({ estado: "a-ler" });
  const [procura, setProcura] = useState("");
  const [topico, setTopico] = useState(topicoInicial);
  const [vista, setVista] = useState("");
  const [aApagar, setAApagar] = useState<Resposta | null>(null);

  useEffect(() => {
    let vivo = true;
    lerRespostas().then((l) => { if (vivo) setLeitura(l); });
    return () => { vivo = false; };
  }, []);

  const recarregar = useCallback(() => lerRespostas().then(setLeitura), []);

  const respostas = useMemo(() => (leitura.estado === "pronto" ? leitura.respostas : []), [leitura]);
  const tituloDe = useCallback((id: string) => estado.topicos.find((t) => t.id === id)?.titulo ?? "Tópico apagado", [estado.topicos]);

  const filtradas = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return respostas.filter((r) => {
      if (topico && r.topicoId !== topico) return false;
      if (vista === "visiveis" && !r.publicado) return false;
      if (vista === "escondidas" && r.publicado) return false;
      if (q && !`${r.autorNome} ${r.corpo}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [respostas, procura, topico, vista]);
  const { fatia, controlos } = usePaginacao(filtradas, 20);

  const mudarLocal = (id: string, f: (r: Resposta) => Resposta | null) =>
    setLeitura((l) => l.estado !== "pronto" ? l : {
      ...l, respostas: l.respostas.map((r) => (r.id === id ? f(r) : r)).filter((r): r is Resposta => r !== null),
    });

  const alternar = async (r: Resposta) => {
    const publicado = !r.publicado;
    mudarLocal(r.id, (x) => ({ ...x, publicado }));
    try {
      const resp = await fetch(comBase("/admin/forum/respostas"), {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, publicado }),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(String(j.erro ?? `Erro ${resp.status}`));
      registar(publicado ? "mostrou" : "escondeu", "Resposta do fórum", `${r.autorNome} em «${tituloDe(r.topicoId)}»`);
      mostrar(publicado ? "A resposta voltou a aparecer no tópico." : "Resposta escondida do tópico.");
    } catch (e) {
      mudarLocal(r.id, (x) => ({ ...x, publicado: r.publicado }));
      mostrar(e instanceof Error ? e.message : "Falha de rede.", "erro");
    }
  };

  const apagar = async (r: Resposta) => {
    try {
      const resp = await fetch(comBase(`/admin/forum/respostas?id=${encodeURIComponent(r.id)}`), { method: "DELETE" });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(String(j.erro ?? `Erro ${resp.status}`));
      mudarLocal(r.id, () => null);
      registar("apagou", r.abertura ? "Mensagem de abertura do fórum" : "Resposta do fórum", `${r.autorNome} em «${tituloDe(r.topicoId)}»`);
      mostrar(r.abertura ? "Mensagem de abertura apagada: o tópico fica com o resumo." : "Resposta apagada.");
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Falha de rede.", "erro");
    }
  };

  if (leitura.estado === "a-ler") return <Painel><Carregando texto="A ler as respostas…" /></Painel>;
  if (leitura.estado === "sem-base") {
    return (
      <Painel>
        <Vazio titulo="As respostas dos membros só existem com a base de dados ligada">
          Nesta demonstração local não há respostas para moderar. No site verdadeiro, cada resposta publicada
          aparece aqui, com os botões para a esconder ou apagar.
        </Vazio>
      </Painel>
    );
  }
  if (leitura.estado === "erro") {
    return <Aviso tom="erro" titulo="Não foi possível ler as respostas" accoes={<Botao onClick={() => void recarregar()}>Tentar outra vez</Botao>}>{leitura.erro}</Aviso>;
  }

  const escondidas = respostas.filter((r) => !r.publicado).length;

  return (
    <>
      {leitura.aviso && <div className="mb-[var(--intervalo)]"><Aviso tom="atencao">{leitura.aviso}</Aviso></div>}
      <Painel
        titulo="Respostas dos membros"
        descricao="As mais recentes primeiro. Esconder tira a resposta do tópico sem a apagar; pode voltar a mostrá-la."
        accoes={<Etiqueta tom={escondidas ? "ouro" : "neutro"}>{escondidas} escondida{escondidas === 1 ? "" : "s"}</Etiqueta>}
      >
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Autor ou texto da resposta…" />
          <Seleccao valor={topico} onChange={setTopico} aria-label="Tópico" className="sm:w-72"
            opcoes={[{ valor: "", nome: "Todos os tópicos" }, ...estado.topicos.map((t) => ({ valor: t.id, nome: t.titulo }))]} />
          <Seleccao valor={vista} onChange={setVista} aria-label="Estado" className="sm:w-56"
            opcoes={[{ valor: "", nome: "Visíveis e escondidas" }, { valor: "visiveis", nome: "Só visíveis" }, { valor: "escondidas", nome: "Só escondidas" }]} />
        </Ferramentas>

        {filtradas.length === 0 ? (
          <Vazio titulo={respostas.length ? "Nenhuma resposta com estes filtros" : "Ainda ninguém respondeu"}>
            {respostas.length ? "Alargue os filtros." : "Quando os membros responderem aos tópicos, as respostas aparecem aqui."}
          </Vazio>
        ) : (
          <ul className="space-y-[var(--intervalo)]">
            {fatia.map((r) => (
              <li key={r.id} className={`rounded-[var(--raio)] border border-white/[0.08] bg-black/[0.15] p-4 ${r.publicado ? "" : "opacity-70"}`}>
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar nome={r.autorNome} cor={r.autorCor} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-medium text-white">{r.autorNome}</span>
                      <span className="text-white/70">{haQuanto(r.criadoEm)}</span>
                      {r.abertura && <Etiqueta>Mensagem de abertura</Etiqueta>}
                      {!r.publicado && <Estado valor="suspenso" rotulo="Escondida" />}
                      {(extra.votos[r.id] ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-white/70">
                          <ArrowBigUp className="size-3.5" aria-hidden />{numero(extra.votos[r.id])}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/75">
                      em <span className="text-white/75">{tituloDe(r.topicoId)}</span>
                    </p>
                    <p className="mt-2 line-clamp-4 whitespace-pre-line text-[15px] leading-relaxed text-white/85 [overflow-wrap:anywhere]">{r.corpo}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <a href={comBase(`/forum/${encodeURIComponent(r.topicoId)}`)} target="_blank" rel="noopener noreferrer"
                      title="Ver o tópico no site" aria-label="Ver o tópico no site"
                      className="inline-flex size-8 items-center justify-center rounded-[var(--raio)] bg-white/[0.06] text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                    {(extra.votos[r.id] ?? 0) > 0 && (
                      <AccaoIcone titulo="Tirar os votos" onClick={() => {
                        void repor(r.id).then((falha) => {
                          if (!falha) registar("apagou", "Votos do fórum", `${r.autorNome} em «${tituloDe(r.topicoId)}»`);
                          mostrar(falha ?? "Os votos da resposta foram retirados.", falha ? "erro" : "ok");
                        });
                      }}>
                        <ArrowBigUp className="size-3.5" aria-hidden />
                      </AccaoIcone>
                    )}
                    <AccaoIcone titulo={r.publicado ? "Esconder do tópico" : "Mostrar no tópico"} onClick={() => void alternar(r)}>
                      {r.publicado ? <Eye className="size-3.5" aria-hidden /> : <EyeOff className="size-3.5 text-gold" aria-hidden />}
                    </AccaoIcone>
                    <AccaoIcone titulo="Apagar a resposta" tom="perigo" onClick={() => setAApagar(r)}>
                      <Trash2 className="size-3.5" aria-hidden />
                    </AccaoIcone>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {controlos}
      </Painel>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={() => { if (aApagar) void apagar(aApagar); }}
        titulo={aApagar?.abertura ? "Apagar a mensagem de abertura" : "Apagar a resposta"}
        mensagem={aApagar?.abertura
          ? "A mensagem completa do membro sai de vez e o tópico fica só com o resumo, sem a ligação à conta de quem o abriu. Para a tirar só por agora, esconda-a."
          : "A resposta sai do tópico de vez e não se pode recuperar. Para a tirar só por agora, esconda-a."}
        textoConfirmar="Apagar"
        perigo
      />
      {elemento}
    </>
  );
}

/* ---------------- Categorias ---------------- */

function Categorias({ abas }: { abas: ReactNode }) {
  const { estado } = useAdmin();
  const contar = (slug: string) => estado.topicos.filter((t) => t.categoriaSlug === slug).length;
  return (
    <PaginaRecurso<CategoriaForum>
      coleccao="categoriasForum"
      titulo="Fórum"
      sobretitulo="Comunidade"
      icone={<MessagesSquare />}
      descricao={DESCRICAO}
      nomeItem="categoria"
      feminino
      vazio="Ainda não há categorias"
      topo={abas}
      procuraEm={(c) => `${c.nome} ${c.descricao}`}
      mensagemApagar="A categoria sai do Fórum. Os tópicos que estavam nela continuam, mas ficam sem categoria."
      colunas={[
        {
          cabecalho: "Categoria",
          celula: (c) => (
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[4px] bg-white/[0.08] text-white">
                <Icon name={c.icone} className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{c.nome}</p>
                <p className="max-w-[28rem] truncate text-xs text-white/75">{c.descricao}</p>
              </div>
            </div>
          ),
        },
        { cabecalho: "Tópicos", celula: (c) => <span className="tabular-nums text-white/70">{contar(c.slug)}</span> },
        {
          cabecalho: "Cor",
          celula: (c) => (
            <span className="inline-flex items-center gap-2 text-xs text-white/75">
              <span className="size-4 rounded-[3px]" style={{ background: c.cor }} aria-hidden />{c.cor}
            </span>
          ),
        },
      ]}
      ligacaoSite={(c) => `/forum?categoria=${encodeURIComponent(c.slug)}`}
      tituloItem={(c) => c.nome}
      novoRegisto={() => ({ slug: "", nome: "", descricao: "", icone: "chat", topicos: 0, mensagens: 0, cor: "#e10600" })}
      preparar={(r, { novo }) => {
        if (!r.nome.trim()) return "Escreva o nome da categoria.";
        return { ...r, nome: r.nome.trim(), slug: novo ? slugify(r.slug || r.nome) : r.slug };
      }}
      formulario={(r, definir, { novo }) => (
        <>
          <Campo etiqueta="Nome" obrigatorio ajuda="A pílula do Fórum e a lista «Categorias» ao lado dos tópicos.">
            <Input value={r.nome} onChange={(e) => definir({ nome: e.target.value })} />
          </Campo>
          <Campo etiqueta="Descrição" ajuda="Aparece por cima da lista quando alguém escolhe a categoria.">
            <Area rows={2} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value })} />
          </Campo>
          <EscolhaIcone
            etiqueta="Ícone" valor={r.icone} onChange={(v) => definir({ icone: v })}
            opcoes={ICONES_CATEGORIA.map((i) => ({ ...i, icone: <Icon name={i.valor} className="size-[1.15rem]" /> }))}
            ajuda="O quadradinho na lista «Categorias»."
          />
          <CampoCor etiqueta="Cor" valor={r.cor} onChange={(v) => definir({ cor: v })}
            ajuda="O quadradinho da categoria nos cartões dos tópicos, na lista «Categorias» e ao criar um tópico. O ícone fica branco, ou escuro numa cor muito clara." />
          {novo ? (
            <Campo etiqueta="Endereço" ajuda="Preenche-se sozinho a partir do nome. Fica no endereço do filtro: /forum?categoria=…">
              <Input value={r.slug} placeholder={slugify(r.nome) || "gerado-a-partir-do-nome"}
                onChange={(e) => definir({ slug: slugify(e.target.value) })} />
            </Campo>
          ) : (
            <p className="text-xs leading-relaxed text-white/75">
              Endereço do filtro: <span className="text-white/75">/forum?categoria={r.slug}</span>. Não se muda depois de criada,
              para os tópicos não perderem a categoria.
            </p>
          )}
        </>
      )}
    />
  );
}

/* ---------------- Página Fórum (textos fixos) ---------------- */

const ESQUEMA_PAGINA: CampoEsquema[] = [
  {
    tipo: "objecto", chave: "abertura", etiqueta: "Abertura",
    ajuda: "A fotografia no topo de /forum, com o título, o texto e o botão vermelho.",
    campos: [
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Texto pequeno por cima do título", largura: "meia" },
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia", obrigatorio: true },
      { tipo: "area", chave: "texto", etiqueta: "Texto de apresentação", linhas: 3 },
      { tipo: "imagem", chave: "foto", etiqueta: "Fotografia de fundo", formato: "aspect-[21/9]" },
      { tipo: "texto", chave: "botao", etiqueta: "Texto do botão", largura: "meia", ajuda: "Vazio, o botão não aparece." },
      { tipo: "texto", chave: "botaoLigacao", etiqueta: "Para onde leva o botão", largura: "meia", ajuda: "Por omissão /forum/novo (criar tópico)." },
    ],
  },
  {
    tipo: "objecto", chave: "numeros", etiqueta: "Números do fórum",
    ajuda: "Ao lado do botão da abertura e no quadro «Sobre o fórum»: tópicos, respostas e membros activos.",
    campos: [
      { tipo: "booleano", chave: "mostrar", etiqueta: "Mostrar os números" },
      { tipo: "texto", chave: "topicos", etiqueta: "Depois do número de tópicos", largura: "meia" },
      { tipo: "texto", chave: "respostas", etiqueta: "Depois do número de respostas", largura: "meia" },
      { tipo: "texto", chave: "membros", etiqueta: "Depois do número de membros", largura: "meia" },
    ],
  },
  {
    tipo: "objecto", chave: "lista", etiqueta: "Lista de tópicos",
    ajuda: "O convite para criar, a ordem, a procura, as pílulas, os cartões dos tópicos e as mensagens das listas vazias.",
    campos: [
      { tipo: "secao", titulo: "Convite e ordem", campos: [
        { tipo: "texto", chave: "convite", etiqueta: "Convite por cima da lista", ajuda: "A caixa que leva a criar um tópico." },
        { tipo: "texto", chave: "criar", etiqueta: "Botão de criar tópico", largura: "meia" },
        { tipo: "texto", chave: "ordenar", etiqueta: "Nome da barra de ordem (leitores de ecrã)", largura: "meia" },
        { tipo: "texto", chave: "emAlta", etiqueta: "Ordem: em alta", largura: "meia", ajuda: "Votos e respostas recentes." },
        { tipo: "texto", chave: "novos", etiqueta: "Ordem: novos", largura: "meia" },
        { tipo: "texto", chave: "maisVotados", etiqueta: "Ordem: mais votados", largura: "meia" },
        { tipo: "texto", chave: "semResposta", etiqueta: "Ordem: sem resposta", largura: "meia" },
      ] },
      { tipo: "secao", titulo: "Procura e categorias", campos: [
        { tipo: "texto", chave: "procurar", etiqueta: "Caixa de procura vazia", largura: "meia" },
        { tipo: "texto", chave: "procurarBotao", etiqueta: "Botão de procurar (leitores de ecrã)", largura: "meia" },
        { tipo: "texto", chave: "resultadosPara", etiqueta: "Antes do que se procurou", largura: "meia", ajuda: "Ex.: Resultados para «capacete»" },
        { tipo: "texto", chave: "limpar", etiqueta: "Limpar a procura", largura: "meia" },
        { tipo: "texto", chave: "todas", etiqueta: "Pílula de todas as categorias", largura: "meia" },
        { tipo: "texto", chave: "destaques", etiqueta: "Título dos tópicos fixados", largura: "meia" },
      ] },
      { tipo: "secao", titulo: "Cartões dos tópicos", campos: [
        { tipo: "texto", chave: "fixado", etiqueta: "Marca de tópico fixado", largura: "meia" },
        { tipo: "texto", chave: "resolvido", etiqueta: "Marca de tópico resolvido", largura: "meia" },
        { tipo: "texto", chave: "fechado", etiqueta: "Marca de tópico fechado", largura: "meia" },
        { tipo: "texto", chave: "primeiroResponder", etiqueta: "Convite nos tópicos sem resposta", largura: "meia" },
        { tipo: "texto", chave: "votar", etiqueta: "Botão de voto num tópico (leitores de ecrã)", largura: "meia" },
        { tipo: "texto", chave: "votarResposta", etiqueta: "Botão de voto numa resposta (leitores de ecrã)", largura: "meia" },
        { tipo: "texto", chave: "retirarVoto", etiqueta: "Botão para retirar o voto", largura: "meia" },
        { tipo: "texto", chave: "votos", etiqueta: "Depois do número de votos", largura: "meia" },
        { tipo: "texto", chave: "verMais", etiqueta: "Botão no fim da lista", largura: "meia" },
      ] },
      { tipo: "secao", titulo: "Listas vazias", campos: [
        { tipo: "texto", chave: "vazioTitulo", etiqueta: "Categoria vazia: título", largura: "meia" },
        { tipo: "texto", chave: "vazioBotao", etiqueta: "Categoria vazia: botão", largura: "meia" },
        { tipo: "area", chave: "vazioTexto", etiqueta: "Categoria vazia: texto", linhas: 2 },
        { tipo: "texto", chave: "semRespostaVazioTitulo", etiqueta: "Nada sem resposta: título", largura: "meia" },
        { tipo: "texto", chave: "semRespostaVazioTexto", etiqueta: "Nada sem resposta: texto", largura: "meia" },
        { tipo: "texto", chave: "procuraVaziaTitulo", etiqueta: "Procura sem resultados: título", largura: "meia" },
        { tipo: "texto", chave: "procuraVaziaTexto", etiqueta: "Procura sem resultados: texto", largura: "meia" },
      ] },
    ],
  },
  {
    tipo: "objecto", chave: "lateral", etiqueta: "Coluna ao lado dos tópicos",
    ajuda: "Sobre o fórum, os meus tópicos, os mais activos do mês, as categorias, as regras e as ligações.",
    campos: [
      { tipo: "texto", chave: "sobreTitulo", etiqueta: "Sobre o fórum: título", largura: "meia" },
      { tipo: "texto", chave: "criar", etiqueta: "Botão de criar tópico", largura: "meia" },
      { tipo: "area", chave: "sobreTexto", etiqueta: "Sobre o fórum: texto", linhas: 3 },
      { tipo: "texto", chave: "meusTitulo", etiqueta: "Os meus tópicos: título", largura: "meia", ajuda: "Só aparece a quem tem sessão." },
      { tipo: "texto", chave: "meusVazio", etiqueta: "Os meus tópicos: ainda nenhum", largura: "meia" },
      { tipo: "texto", chave: "meusAguarda", etiqueta: "Marca de tópico à espera de aprovação", largura: "meia" },
      { tipo: "texto", chave: "contribuidoresTitulo", etiqueta: "Mais activos: título", largura: "meia" },
      { tipo: "texto", chave: "contribuidoresTexto", etiqueta: "Mais activos: texto pequeno", largura: "meia" },
      { tipo: "texto", chave: "contribuicoes", etiqueta: "Depois do número de contribuições", largura: "meia" },
      { tipo: "area", chave: "contribuidoresVazio", etiqueta: "Mais activos: ainda ninguém este mês", linhas: 2 },
      { tipo: "texto", chave: "categorias", etiqueta: "Título do quadro das categorias", largura: "meia" },
      { tipo: "texto", chave: "regrasTitulo", etiqueta: "Título das regras", largura: "meia" },
      { tipo: "lista-texto", chave: "regras", etiqueta: "Regras da casa", placeholder: "Nova regra", ajuda: "Numeradas pela ordem da lista. Aparecem também em cada tópico e ao criar um." },
      { tipo: "texto", chave: "regulamento", etiqueta: "Ligação ao regulamento", largura: "meia", ajuda: "Vazio, a ligação não aparece." },
      { tipo: "texto", chave: "regulamentoLigacao", etiqueta: "Para onde leva", largura: "meia", ajuda: "Ex.: /regulamento" },
      { tipo: "texto", chave: "ligacoesTitulo", etiqueta: "Ligações: título", ajuda: "O quadro que leva a outras partes da comunidade (clubes, eventos…)." },
      {
        tipo: "lista", chave: "ligacoes", etiqueta: "Ligações", nomeItem: "ligação",
        resumo: (l) => String(l.texto ?? ""), novo: () => ({ texto: "", ligacao: "/" }),
        campos: [
          { tipo: "texto", chave: "texto", etiqueta: "Texto", largura: "meia" },
          { tipo: "texto", chave: "ligacao", etiqueta: "Para onde leva", largura: "meia", ajuda: "Ex.: /clubes, /eventos" },
        ],
      },
    ],
  },
  {
    tipo: "objecto", chave: "niveis", etiqueta: "Níveis dos membros",
    ajuda: "A marca ao lado do nome de quem escreve. Cada resposta vale 1 ponto, cada tópico 3 e cada voto recebido 1.",
    campos: [
      { tipo: "booleano", chave: "mostrar", etiqueta: "Mostrar os níveis", descricao: "Desligado, não aparece nenhuma marca de nível nem o quadro dos níveis." },
      { tipo: "texto", chave: "titulo", etiqueta: "Título do quadro dos níveis", largura: "meia" },
      { tipo: "texto", chave: "pontos", etiqueta: "Depois do número de pontos", largura: "meia" },
      { tipo: "area", chave: "texto", etiqueta: "Como se sobe de nível", linhas: 2 },
      {
        tipo: "lista", chave: "lista", etiqueta: "Níveis", nomeItem: "nível",
        resumo: (n) => `${String(n.nome ?? "")} · desde ${Number(n.minimo) || 0} pontos`,
        novo: () => ({ nome: "", minimo: 0 }),
        campos: [
          { tipo: "texto", chave: "nome", etiqueta: "Nome", largura: "meia" },
          { tipo: "numero", chave: "minimo", etiqueta: "A partir de quantos pontos", largura: "meia", min: 0 },
        ],
      },
      { tipo: "texto", chave: "equipa", etiqueta: "Marca da equipa", largura: "meia", ajuda: "No lugar do nível, para quem fala pela MotoBox." },
      { tipo: "texto", chave: "autor", etiqueta: "Marca do autor do tópico nas respostas", largura: "meia" },
      { tipo: "lista-texto", chave: "nomesEquipa", etiqueta: "Nomes da equipa", placeholder: "Ex.: Equipa MotoBox", ajuda: "Quem escreve com um destes nomes leva a marca da equipa e não entra nos mais activos." },
    ],
  },
  {
    tipo: "objecto", chave: "topico", etiqueta: "Página de cada tópico",
    ajuda: "Os textos fixos de /forum/<tópico>.",
    campos: [
      { tipo: "texto", chave: "voltar", etiqueta: "Ligação de volta (no topo)", largura: "meia" },
      { tipo: "texto", chave: "autorDoTopico", etiqueta: "Por baixo do nome do autor", largura: "meia" },
      { tipo: "texto", chave: "visualizacoes", etiqueta: "Depois do número de visualizações", largura: "meia" },
      { tipo: "texto", chave: "reportar", etiqueta: "Botão para denunciar", largura: "meia" },
      { tipo: "texto", chave: "responder", etiqueta: "Botão de responder", largura: "meia" },
      { tipo: "texto", chave: "partilhar", etiqueta: "Botão de partilhar", largura: "meia" },
      { tipo: "texto", chave: "respostaSingular", etiqueta: "Contagem: uma resposta", largura: "meia", ajuda: "Ex.: 1 resposta" },
      { tipo: "texto", chave: "respostaPlural", etiqueta: "Contagem: várias respostas", largura: "meia", ajuda: "Ex.: 4 respostas" },
      { tipo: "texto", chave: "resolvidoTitulo", etiqueta: "Tópico resolvido: título", largura: "meia" },
      { tipo: "texto", chave: "resolvidoTexto", etiqueta: "Tópico resolvido: texto", largura: "meia" },
      { tipo: "texto", chave: "primeiroTitulo", etiqueta: "Sem respostas: título do convite", largura: "meia" },
      { tipo: "texto", chave: "primeiroBotao", etiqueta: "Sem respostas: botão", largura: "meia" },
      { tipo: "area", chave: "primeiroTexto", etiqueta: "Sem respostas: texto do convite", linhas: 2 },
      { tipo: "texto", chave: "semRespostas", etiqueta: "Sem respostas num tópico fechado" },
      { tipo: "texto", chave: "fechadoTitulo", etiqueta: "Tópico fechado: título", largura: "meia" },
      { tipo: "texto", chave: "fechadoTexto", etiqueta: "Tópico fechado: texto", largura: "meia" },
      { tipo: "texto", chave: "forumFechadoTitulo", etiqueta: "Fórum fechado: título", largura: "meia" },
      { tipo: "texto", chave: "forumFechadoTexto", etiqueta: "Fórum fechado: texto", largura: "meia" },
      { tipo: "texto", chave: "sobreTitulo", etiqueta: "Quadro ao lado: título", largura: "meia" },
      { tipo: "texto", chave: "participantes", etiqueta: "Depois do número de participantes", largura: "meia" },
      { tipo: "texto", chave: "criado", etiqueta: "Data de abertura", largura: "meia" },
      { tipo: "texto", chave: "ultimaActividade", etiqueta: "Última actividade", largura: "meia" },
      { tipo: "texto", chave: "criarTitulo", etiqueta: "Criar outro tópico: título", largura: "meia" },
      { tipo: "texto", chave: "criarTexto", etiqueta: "Criar outro tópico: texto", largura: "meia" },
      { tipo: "texto", chave: "relacionados", etiqueta: "Título dos tópicos relacionados" },
    ],
  },
  {
    tipo: "objecto", chave: "resposta", etiqueta: "Caixa de resposta",
    ajuda: "A caixa no fim de cada tópico, onde os membros respondem.",
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      { tipo: "texto", chave: "placeholder", etiqueta: "Texto dentro da caixa vazia", largura: "meia" },
      { tipo: "texto", chave: "publicar", etiqueta: "Botão de publicar", largura: "meia" },
      { tipo: "texto", chave: "aPublicar", etiqueta: "Botão enquanto publica", largura: "meia" },
      { tipo: "texto", chave: "publicada", etiqueta: "Depois de publicar", largura: "meia" },
      { tipo: "texto", chave: "aResponderComo", etiqueta: "Antes do nome de quem responde", largura: "meia" },
      { tipo: "texto", chave: "semSessao", etiqueta: "Para quem ainda não entrou" },
    ],
  },
  {
    tipo: "objecto", chave: "novo", etiqueta: "Criar tópico (/forum/novo)",
    ajuda: "A página onde os membros abrem um tópico: título, categoria e mensagem.",
    campos: [
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Texto pequeno por cima do título", largura: "meia" },
      { tipo: "texto", chave: "titulo", etiqueta: "Título da página", largura: "meia" },
      { tipo: "area", chave: "texto", etiqueta: "Texto de apresentação", linhas: 2 },
      { tipo: "texto", chave: "campoTitulo", etiqueta: "Campo do título", largura: "meia" },
      { tipo: "texto", chave: "tituloAjuda", etiqueta: "Ajuda do campo do título", largura: "meia" },
      { tipo: "texto", chave: "tituloPlaceholder", etiqueta: "Exemplo dentro do campo do título" },
      { tipo: "texto", chave: "campoCategoria", etiqueta: "Campo da categoria", largura: "meia" },
      { tipo: "texto", chave: "campoCorpo", etiqueta: "Campo da mensagem", largura: "meia" },
      { tipo: "texto", chave: "corpoPlaceholder", etiqueta: "Exemplo dentro do campo da mensagem", largura: "meia" },
      { tipo: "texto", chave: "corpoAjuda", etiqueta: "Ajuda do campo da mensagem", largura: "meia" },
      { tipo: "texto", chave: "publicar", etiqueta: "Botão de publicar", largura: "meia" },
      { tipo: "texto", chave: "aPublicar", etiqueta: "Botão enquanto publica", largura: "meia" },
      { tipo: "texto", chave: "aPublicarComo", etiqueta: "Antes do nome de quem publica", largura: "meia" },
      { tipo: "texto", chave: "semSessao", etiqueta: "Para quem ainda não entrou", largura: "meia" },
      { tipo: "texto", chave: "aguardaTitulo", etiqueta: "À espera de aprovação: título", largura: "meia" },
      { tipo: "texto", chave: "aguardaTexto", etiqueta: "À espera de aprovação: texto", largura: "meia" },
      { tipo: "texto", chave: "dicasTitulo", etiqueta: "Título das dicas", largura: "meia" },
      { tipo: "texto", chave: "seoTitulo", etiqueta: "Título no separador do navegador", largura: "meia" },
      { tipo: "lista-texto", chave: "dicas", etiqueta: "Dicas ao lado do formulário", placeholder: "Nova dica" },
      { tipo: "texto", chave: "fechadoTitulo", etiqueta: "Fórum fechado: título", largura: "meia" },
      { tipo: "texto", chave: "fechadoTexto", etiqueta: "Fórum fechado: texto", largura: "meia" },
    ],
  },
  {
    tipo: "objecto", chave: "moderacao", etiqueta: "Tópicos dos membros",
    ajuda: "Como funcionam os tópicos abertos pelos membros. Fechar o fórum inteiro faz-se no interruptor «Fórum aberto a respostas», na aba Tópicos.",
    campos: [
      {
        tipo: "booleano", chave: "aprovarTopicos", etiqueta: "Rever os tópicos antes de aparecerem",
        descricao: "Ligado, cada tópico novo chega escondido à aba Tópicos e só aparece no Fórum quando o mostrar (no olho).",
      },
      {
        tipo: "numero", chave: "topicosPorHora", etiqueta: "Máximo de tópicos por membro numa hora", min: 1, max: 50,
        ajuda: "Trava quem abre tópicos em série. As respostas têm o seu próprio travão (8 em 10 minutos).",
      },
    ],
  },
  {
    tipo: "objecto", chave: "seo", etiqueta: "Google e partilhas",
    ajuda: "O título do separador do navegador e o resumo que o Google e o WhatsApp mostram para /forum.",
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título" },
      { tipo: "area", chave: "descricao", etiqueta: "Resumo", linhas: 2, ajuda: "Cerca de 150 caracteres." },
    ],
  },
];
