"use client";

/* ============================================================
   MOTOBOX — Área de conta
   Trata da sessão e da API; o desenho está em
   components/conta/PainelConta.tsx. Tudo o que aqui aparece vem
   da conta de quem tem sessão: perfil, clube, garagem, anúncios
   próprios e guardados, fórum, preferências e notificações. As
   preferências guardam-se sozinhas a cada clique, e o separador
   aberto fica no endereço (?aba=), para sobreviver a um reload.
   Os textos fixos editam-se em Definições → Área de membro.
   ============================================================ */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth/contexto";
import { PREFERENCIAS_PADRAO, type Preferencias } from "@/lib/conta/preferencias";
import type { AnuncioGuardado } from "@/lib/conta/favoritos";
import type { AbaConta, ConteudoConta } from "@/lib/conteudo/grupos/contas";
import { comBase } from "@/lib/base";
import { Seta } from "@/components/painel/kit";
import { pedir, type ArtigoResumo, type ClubeResumo, type DadosConta, type EventoResumo, type MotaGaragem } from "@/components/conta/dados";
import { ABAS, PainelConta, type RotaComProvincias } from "@/components/conta/PainelConta";
import type { EstadoGravacao } from "@/components/conta/partes";

/** Nomes antigos dos separadores, para as ligações que já andam por aí (emails, favoritos). */
const ALIAS: Record<string, AbaConta> = { perfil: "resumo", favoritos: "guardados", palavra: "seguranca" };

export function ContaClient({
  textos, clubes, artigos, eventos, eventosTotal, rotas, semana, marketplaceAberto,
}: {
  textos: ConteudoConta;
  clubes: ClubeResumo[];
  artigos: ArtigoResumo[];
  eventos: EventoResumo[];
  eventosTotal: number;
  rotas: RotaComProvincias[];
  semana: number;
  marketplaceAberto: boolean;
}) {
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();
  const { utilizador, carregando, sair, recarregarPerfil } = useAuth();
  const uid = utilizador?.id;

  const pedida = parametros.get("aba") ?? "";
  const aba: AbaConta = (ABAS as string[]).includes(pedida) ? (pedida as AbaConta) : ALIAS[pedida] ?? "resumo";
  const irPara = (a: AbaConta) => router.replace(`${caminho}?aba=${a}`, { scroll: false });

  const [dados, setDados] = useState<DadosConta | null>(null);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Preferencias>(PREFERENCIAS_PADRAO);
  const [gravacao, setGravacao] = useState<EstadoGravacao>("parado");
  const [gravacaoClube, setGravacaoClube] = useState<EstadoGravacao>("parado");
  const [aSair, setASair] = useState(false);

  // Anúncios guardados: a lista fica marcada com a conta, para não passar de uma conta a outra.
  const [favoritos, setFavoritos] = useState<{ dono: string; lista: AnuncioGuardado[] } | null>(null);
  const [erroFavoritos, setErroFavoritos] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [aRemoverFavorito, setARemoverFavorito] = useState<string[]>([]);
  const [artigosGuardados, setArtigosGuardados] = useState<string[]>([]);
  const [aMudarArtigo, setAMudarArtigo] = useState<string[]>([]);
  /** Aviso curto em baixo do ecrã (um artigo que não se guardou, por exemplo). */
  const [aviso, setAviso] = useState<string | null>(null);
  useEffect(() => {
    if (!aviso) return;
    const id = window.setTimeout(() => setAviso(null), 5000);
    return () => window.clearTimeout(id);
  }, [aviso]);

  const aplicar = useCallback((r: { dados?: DadosConta; erro?: string }) => {
    if (r.erro || !r.dados) { setErroCarregar(r.erro ?? "Não foi possível carregar a sua conta."); return; }
    setDados(r.dados);
    setPrefs(r.dados.preferencias ?? PREFERENCIAS_PADRAO);
    setArtigosGuardados(r.dados.artigos ?? []);
    setErroCarregar(null);
  }, []);

  const recarregar = useCallback(async () => {
    const [r] = await Promise.all([lerConta(), recarregarPerfil()]);
    aplicar(r);
  }, [aplicar, recarregarPerfil]);

  useEffect(() => {
    if (!uid) return;
    let vivo = true;
    lerConta().then((r) => { if (vivo) aplicar(r); });
    return () => { vivo = false; };
  }, [uid, aplicar]);

  useEffect(() => {
    if (!uid) return;
    let vivo = true;
    pedir("/api/conta/favoritos?anuncios=1", "GET").then(({ erro, json }) => {
      if (!vivo) return;
      if (erro) { setErroFavoritos(erro); return; }
      setErroFavoritos(null);
      setFavoritos({ dono: uid, lista: Array.isArray(json.anuncios) ? (json.anuncios as AnuncioGuardado[]) : [] });
    });
    return () => { vivo = false; };
  }, [uid, tentativa]);

  /* ---------- Preferências: guardam-se sozinhas ---------- */
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mudarPrefs = (proximas: Preferencias) => {
    setPrefs(proximas);
    setGravacao("a-guardar");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      const { erro } = await pedir("/api/conta", "PATCH", { preferencias: proximas });
      setGravacao(erro ? "erro" : "guardado");
    }, 500);
  };
  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);

  /* ---------- Clube a que pertence ---------- */
  const escolherClube = async (slug: string) => {
    if (!dados) return;
    const antes = dados.clube ?? null;
    setDados({ ...dados, clube: slug || null });
    setGravacaoClube("a-guardar");
    const { erro } = await pedir("/api/conta", "PATCH", { clube: slug });
    if (erro) setDados((d) => (d ? { ...d, clube: antes } : d));
    setGravacaoClube(erro ? "erro" : "guardado");
  };

  /* ---------- Guardados ---------- */
  const removerFavorito = async (a: AnuncioGuardado) => {
    if (aRemoverFavorito.includes(a.id)) return;
    setARemoverFavorito((r) => [...r, a.id]);
    const { erro } = await pedir("/api/conta/favoritos", "POST", { id: a.id, guardar: false });
    setARemoverFavorito((r) => r.filter((x) => x !== a.id));
    if (erro) { setErroFavoritos(erro); return; }
    setFavoritos((f) => (f ? { ...f, lista: f.lista.filter((x) => x.id !== a.id) } : f));
  };

  const alternarArtigo = async (slug: string) => {
    if (aMudarArtigo.includes(slug)) return;
    const guardar = !artigosGuardados.includes(slug);
    setAMudarArtigo((l) => [...l, slug]);
    // Muda já no ecrã; volta atrás se o servidor recusar.
    setArtigosGuardados((l) => (guardar ? [slug, ...l] : l.filter((s) => s !== slug)));
    const { erro, json } = await pedir("/api/conta/artigos", "POST", { slug, guardar });
    setAMudarArtigo((l) => l.filter((s) => s !== slug));
    if (erro) {
      setArtigosGuardados((l) => (guardar ? l.filter((s) => s !== slug) : [slug, ...l]));
      setAviso(erro);
      return;
    }
    if (Array.isArray(json.slugs)) setArtigosGuardados(json.slugs as string[]);
  };

  const mudarGaragem = (garagem: MotaGaragem[]) => setDados((d) => (d ? { ...d, garagem } : d));

  const terminarSessao = async () => {
    setASair(true);
    await sair();
    window.location.replace(comBase("/"));
  };

  if (carregando || (utilizador && !dados && !erroCarregar)) return <Esqueleto />;

  if (!utilizador) return <SemSessao textos={textos} />;

  if (erroCarregar || !dados) {
    return (
      <div className="painel painel-escuro mx-auto max-w-xl p-8 text-center">
        <p role="alert" className="text-[15px] text-white">{erroCarregar}</p>
        <button type="button" onClick={() => void recarregar()}
          className="mt-5 inline-flex h-11 items-center rounded-[var(--raio)] bg-mb-red px-5 text-[15px] text-white hover:bg-mb-red-dark">
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <>
    <PainelConta
      textos={textos}
      clubes={clubes}
      artigos={artigos}
      eventos={eventos}
      eventosTotal={eventosTotal}
      rotas={rotas}
      semana={semana}
      marketplaceAberto={marketplaceAberto}
      dados={dados}
      prefs={prefs}
      gravacao={gravacao}
      gravacaoClube={gravacaoClube}
      favoritos={favoritos && favoritos.dono === uid ? favoritos.lista : null}
      erroFavoritos={erroFavoritos}
      aRemoverFavorito={aRemoverFavorito}
      artigosGuardados={artigosGuardados}
      aMudarArtigo={aMudarArtigo}
      aSair={aSair}
      aba={aba}
      irPara={irPara}
      recarregar={recarregar}
      mudarPrefs={mudarPrefs}
      escolherClube={(s) => void escolherClube(s)}
      removerFavorito={(a) => void removerFavorito(a)}
      tentarFavoritos={() => { setErroFavoritos(null); setTentativa((n) => n + 1); }}
      alternarArtigo={(s) => void alternarArtigo(s)}
      mudarGaragem={mudarGaragem}
      sair={() => void terminarSessao()}
    />
    <p role="status" aria-live="polite"
      className={aviso ? "fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-[var(--raio)] bg-ink-900 px-4 py-3 text-[15px] text-white shadow-2xl ring-1 ring-white/15 lg:bottom-28" : "sr-only"}>
      {aviso ?? ""}
    </p>
    </>
  );
}

async function lerConta(): Promise<{ dados?: DadosConta; erro?: string }> {
  try {
    const r = await fetch(comBase("/api/conta"), { cache: "no-store" });
    const j = await r.json();
    return r.ok ? { dados: j as DadosConta } : { erro: String(j.erro ?? `Erro ${r.status}`) };
  } catch {
    return { erro: "Não foi possível carregar a sua conta. Verifique a ligação." };
  }
}

/** A carregar: a forma do painel, a pulsar (parada para quem pede menos movimento). */
function Esqueleto() {
  const bloco = "painel painel-escuro animate-pulse motion-reduce:animate-none";
  return (
    <div className="space-y-[var(--intervalo)]" aria-busy="true" aria-label="A carregar a sua conta">
      <div className={`${bloco} h-80`} />
      <div className={`${bloco} h-14`} />
      <div className="grid grid-cols-2 gap-[var(--intervalo)] pt-2.5 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`${bloco} h-44`} />)}
      </div>
    </div>
  );
}

/** Sem sessão: o que a conta dá, e entrar ou criar conta. */
function SemSessao({ textos }: { textos: ConteudoConta }) {
  const t = textos.semSessao;
  const destino = encodeURIComponent("/conta");
  return (
    <section className="grid gap-[var(--intervalo)] lg:grid-cols-[1.3fr_1fr]">
      <div className="painel painel-escuro flex flex-col p-6 md:p-10">
        <span aria-hidden className="chip-mb chip-mb-lg"><UserRound /></span>
        <p className="sobretitulo mt-10 text-white/85">{t.sobretitulo}</p>
        <h1 className="titulo-2 mt-4 max-w-[18ch] text-balance text-white">{t.titulo}</h1>
        <p className="texto-lead mt-5 max-w-[48ch] text-white/90">{t.texto}</p>
        <div className="mt-8 flex flex-wrap gap-[var(--intervalo)]">
          <Link href={`/entrar?destino=${destino}`}
            className="group inline-flex h-14 items-center gap-6 rounded-[var(--raio)] bg-mb-red px-6 text-[15px] text-white transition-colors hover:bg-mb-red-dark">
            {t.entrar}
            <Seta className="size-4" />
          </Link>
          <Link href={`/entrar?modo=registar&destino=${destino}`}
            className="inline-flex h-14 items-center rounded-[var(--raio)] bg-white/12 px-6 text-[15px] text-white transition-colors hover:bg-white/20">
            {t.criar}
          </Link>
        </div>
      </div>
      <ul className="grid gap-[var(--intervalo)] sm:grid-cols-2 lg:grid-cols-1">
        {(Array.isArray(t.vantagens) ? t.vantagens : []).filter(Boolean).map((v) => (
          <li key={v} className="painel painel-escuro flex items-center gap-4 p-5 text-[15px] leading-snug text-white">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-mb-red"><Check className="size-4" /></span>
            {v}
          </li>
        ))}
      </ul>
    </section>
  );
}
