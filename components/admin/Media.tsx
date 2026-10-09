"use client";

/* ============================================================
   MOTOBOX ADMIN — Imagens e vídeos
   - useMedia: a biblioteca (ficheiros carregados no Supabase
     Storage, bucket "media"), com carregar e apagar.
   - BibliotecaMedia: a grelha da biblioteca, com as fotografias
     do site (as chaves de lib/imagens.ts) num separador à parte.
   - CampoImagem: o campo de imagem (ou vídeo) dos formulários,
     com pré-visualização, carregar, escolher e colar endereço.
   ============================================================ */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { comBase } from "@/lib/base";
import { ARTIGOS, BANNERS, CENAS, POR_SLUG, RETRATOS, src as fotoSrc, urlLocal } from "@/lib/imagens";
import type { FicheiroMedia } from "@/lib/conteudo/tipos";
import { Abas, Aviso, Botao, CLASSE_CAMPO, Campo, Carregando, Vazio } from "./kit";

/* ---------------- Dados ---------------- */

async function lerBiblioteca(): Promise<{ ficheiros: FicheiroMedia[]; local: boolean }> {
  const r = await fetch(comBase("/api/admin/media"), { cache: "no-store" });
  const j = await r.json();
  if (!r.ok) throw new Error(j.erro ?? "Falha ao ler a biblioteca.");
  return { ficheiros: j.ficheiros, local: Boolean(j.local) };
}

export function useMedia() {
  const [ficheiros, setFicheiros] = useState<FicheiroMedia[] | null>(null);
  const [local, setLocal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() =>
    lerBiblioteca().then(
      (j) => { setFicheiros(j.ficheiros); setLocal(j.local); setErro(null); },
      (e) => { setErro(e instanceof Error ? e.message : "Falha ao ler a biblioteca."); setFicheiros([]); },
    ), []);

  useEffect(() => {
    let vivo = true;
    lerBiblioteca().then(
      (j) => { if (vivo) { setFicheiros(j.ficheiros); setLocal(j.local); } },
      (e) => { if (vivo) { setErro(e instanceof Error ? e.message : "Falha ao ler a biblioteca."); setFicheiros([]); } },
    );
    return () => { vivo = false; };
  }, []);

  /** Carrega um ficheiro e devolve-o (ou lança o erro, já em frase legível). */
  const carregar = useCallback(async (f: File): Promise<FicheiroMedia> => {
    const form = new FormData();
    form.append("ficheiro", f);
    const r = await fetch(comBase("/api/admin/media"), { method: "POST", body: form });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro ?? "Falha ao carregar o ficheiro.");
    setFicheiros((lista) => [j as FicheiroMedia, ...(lista ?? [])]);
    return j as FicheiroMedia;
  }, []);

  const apagar = useCallback(async (caminho: string) => {
    const r = await fetch(comBase(`/api/admin/media?caminho=${encodeURIComponent(caminho)}`), { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro ?? "Falha ao apagar.");
    setFicheiros((lista) => (lista ?? []).filter((f) => f.caminho !== caminho));
  }, []);

  return { ficheiros, local, erro, recarregar, carregar, apagar };
}

/** As fotografias que o site já usa, por chave (para escolher sem carregar nada). */
export const FOTOS_DO_SITE: { grupo: string; fotos: Record<string, string> }[] = [
  { grupo: "Cenas e locais", fotos: CENAS },
  { grupo: "Páginas e secções", fotos: Object.fromEntries(Object.keys(BANNERS).map((k) => [`banner-${k}`, BANNERS[k]])) },
  { grupo: "Artigos", fotos: ARTIGOS },
  { grupo: "Eventos, clubes e rotas", fotos: POR_SLUG },
  { grupo: "Pilotos", fotos: RETRATOS },
];

/** Endereço para pré-visualizar um valor de imagem (chave do site, endereço ou caminho local). */
export function previsualizacao(valor: string, largura = 600): string | null {
  if (!valor) return null;
  if (valor.startsWith("/")) return urlLocal(valor);
  return fotoSrc(valor, { w: largura });
}

const eVideo = (url: string) => /\.(mp4|webm)(\?|$)/i.test(url);

/* ---------------- Biblioteca ---------------- */

export function BibliotecaMedia({
  aoEscolher, tipo = "imagem", gerir = false,
}: {
  /** Com esta função, cada ficheiro tem o botão "Usar". */
  aoEscolher?: (valor: string) => void;
  tipo?: "imagem" | "video" | "todos";
  /** Mostra os botões de apagar (página da biblioteca). */
  gerir?: boolean;
}) {
  const { ficheiros, local, erro, carregar, apagar } = useMedia();
  const [aba, setAba] = useState<"carregados" | "site">("carregados");
  const [aCarregar, setACarregar] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [aApagar, setAApagar] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const lista = (ficheiros ?? []).filter((f) => tipo === "todos" || f.tipo === tipo);

  const aoCarregar = async (fs: FileList | null) => {
    if (!fs?.length) return;
    setACarregar(true);
    setFalha(null);
    try {
      for (const f of Array.from(fs)) {
        const novo = await carregar(f);
        if (aoEscolher && fs.length === 1) aoEscolher(novo.url);
      }
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setACarregar(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  const aceita = tipo === "video" ? "video/mp4,video/webm" : tipo === "imagem" ? "image/*" : "image/*,video/mp4,video/webm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {tipo !== "video" ? (
          <Abas
            abas={[
              { chave: "carregados", nome: "Carregados", contador: lista.length },
              { chave: "site", nome: "Fotografias do site" },
            ]}
            activa={aba}
            onChange={setAba}
            rotulo="Origem das imagens"
          />
        ) : <span />}
        <span>
          <input ref={entrada} type="file" accept={aceita} multiple={!aoEscolher} className="sr-only" id="media-carregar"
            onChange={(e) => aoCarregar(e.target.files)} />
          <Botao variante="primario" onClick={() => entrada.current?.click()} disabled={aCarregar}>
            {aCarregar ? "A carregar…" : tipo === "video" ? "Carregar vídeo" : "Carregar do computador"}
          </Botao>
        </span>
      </div>

      {local && (
        <Aviso tom="atencao">
          Modo local: sem base de dados, os ficheiros ficam em public/media-local neste computador.
        </Aviso>
      )}
      {(erro || falha) && <Aviso tom="erro">{falha ?? erro}</Aviso>}

      {aba === "carregados" || tipo === "video" ? (
        ficheiros === null ? (
          <Carregando />
        ) : lista.length === 0 ? (
          <Vazio titulo="Ainda não há ficheiros carregados">
            Carregue fotografias do computador (JPG, PNG ou WebP, até 10 MB) ou vídeos (MP4, até 50 MB).
          </Vazio>
        ) : (
          <ul className="grid grid-cols-2 gap-[var(--intervalo)] sm:grid-cols-3 lg:grid-cols-4">
            {lista.map((f) => (
              <li key={f.caminho} className="group relative overflow-hidden rounded-[var(--raio)] bg-black/30">
                <div className="aspect-[4/3]">
                  {f.tipo === "video" ? (
                    <video src={f.url} muted playsInline preload="metadata" className="size-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.url} alt="" loading="lazy" className="size-full object-cover" />
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="truncate text-xs text-white/60" title={f.nome}>{f.nome.replace(/^\d+-/, "")}</span>
                  <span className="flex shrink-0 gap-1">
                    {aoEscolher && <Botao tamanho="sm" variante="primario" onClick={() => aoEscolher(f.url)}>Usar</Botao>}
                    {gerir && (
                      <Botao tamanho="sm" variante="fantasma" onClick={() => navigator.clipboard?.writeText(f.url)}>Copiar</Botao>
                    )}
                    {gerir && (
                      aApagar === f.caminho ? (
                        <Botao tamanho="sm" variante="perigo" onClick={async () => {
                          try { await apagar(f.caminho); } catch (e) { setFalha(e instanceof Error ? e.message : "Falha ao apagar."); }
                          setAApagar(null);
                        }}>Confirmar</Botao>
                      ) : (
                        <Botao tamanho="sm" variante="fantasma" onClick={() => setAApagar(f.caminho)}>Apagar</Botao>
                      )
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-6">
          {FOTOS_DO_SITE.map((g) => (
            <div key={g.grupo}>
              <p className="mb-2 text-[13px] font-medium text-white/70">{g.grupo}</p>
              <ul className="grid grid-cols-3 gap-[var(--intervalo)] sm:grid-cols-4 lg:grid-cols-6">
                {Object.keys(g.fotos).map((chave) => (
                  <li key={chave}>
                    <button
                      type="button"
                      disabled={!aoEscolher}
                      onClick={() => aoEscolher?.(chave)}
                      title={chave}
                      className="group block w-full overflow-hidden rounded-[var(--raio)] bg-black/30 text-left disabled:cursor-default"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fotoSrc(chave, { w: 300 }) ?? ""} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" />
                      <span className="block truncate px-2 py-1.5 text-[11px] text-white/55">{chave}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Janela da biblioteca ---------------- */

export function JanelaBiblioteca({
  aberta, aoFechar, aoEscolher, tipo = "imagem",
}: {
  aberta: boolean; aoFechar: () => void; aoEscolher: (valor: string) => void; tipo?: "imagem" | "video";
}) {
  useEffect(() => {
    if (!aberta) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberta, aoFechar]);
  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={aoFechar} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Biblioteca de imagens"
        className="relative flex max-h-[88vh] w-full max-w-5xl flex-col rounded-[var(--raio)] border border-white/10 bg-[#2c2c33]/95 shadow-2xl backdrop-blur-xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-semibold">{tipo === "video" ? "Escolher um vídeo" : "Escolher uma imagem"}</h2>
          <Botao variante="fantasma" onClick={aoFechar}>Fechar</Botao>
        </header>
        <div className="overflow-y-auto p-5">
          <BibliotecaMedia tipo={tipo} aoEscolher={(v) => { aoEscolher(v); aoFechar(); }} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Campo de imagem ---------------- */

export function CampoImagem({
  etiqueta, valor, onChange, ajuda, tipo = "imagem", formato = "aspect-[16/9]", obrigatorio,
}: {
  etiqueta: string;
  /** Endereço (https://…), caminho do site (/videos/…) ou chave de lib/imagens.ts (ex.: "kilamba"). */
  valor: string;
  onChange: (v: string) => void;
  ajuda?: ReactNode;
  tipo?: "imagem" | "video";
  /** Proporção da pré-visualização (classe Tailwind). */
  formato?: string;
  obrigatorio?: boolean;
}) {
  const [janela, setJanela] = useState(false);
  const [aCarregar, setACarregar] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const { carregar } = useMediaCarregar();

  const url = tipo === "video" ? (valor ? (valor.startsWith("/") ? urlLocal(valor) : valor) : null) : previsualizacao(valor);

  const aoCarregar = async (f: File | undefined) => {
    if (!f) return;
    setACarregar(true);
    setFalha(null);
    try {
      onChange((await carregar(f)).url);
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setACarregar(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  return (
    <div className="min-w-0">
      <Campo etiqueta={etiqueta} obrigatorio={obrigatorio} ajuda={ajuda}>
        <span className="block overflow-hidden rounded-[var(--raio)] border border-white/10 bg-black/25">
          <span className={`relative block ${formato} max-h-64 w-full bg-black/30`}>
            {url ? (
              tipo === "video" || eVideo(url) ? (
                <video src={url} muted playsInline loop autoPlay className="absolute inset-0 size-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
              )
            ) : (
              <span className="absolute inset-0 grid place-items-center text-sm text-white/40">
                {tipo === "video" ? "Sem vídeo" : "Sem imagem"}
              </span>
            )}
          </span>
          <span className="flex flex-wrap gap-2 p-2">
            <input ref={entrada} type="file" className="sr-only" tabIndex={-1}
              accept={tipo === "video" ? "video/mp4,video/webm" : "image/*"}
              onChange={(e) => aoCarregar(e.target.files?.[0])} />
            <Botao tamanho="sm" variante="primario" onClick={() => entrada.current?.click()} disabled={aCarregar}>
              {aCarregar ? "A carregar…" : "Carregar"}
            </Botao>
            <Botao tamanho="sm" onClick={() => setJanela(true)}>Escolher da biblioteca</Botao>
            {valor && <Botao tamanho="sm" variante="fantasma" onClick={() => onChange("")}>Tirar</Botao>}
          </span>
        </span>
      </Campo>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder={tipo === "video" ? "https://… ou /videos/…" : "https://…, ou uma chave de fotografia do site (ex.: kilamba)"}
        aria-label={`${etiqueta}: endereço`}
        className={`${CLASSE_CAMPO} mt-2 text-[13px]`}
      />
      {falha && <p role="alert" className="mt-1.5 text-xs text-mb-red-light">{falha}</p>}
      <JanelaBiblioteca aberta={janela} aoFechar={() => setJanela(false)} aoEscolher={onChange} tipo={tipo} />
    </div>
  );
}

/** Só o carregar, sem ler a biblioteca inteira (para os campos de imagem). */
function useMediaCarregar() {
  const carregar = useCallback(async (f: File): Promise<FicheiroMedia> => {
    const form = new FormData();
    form.append("ficheiro", f);
    const r = await fetch(comBase("/api/admin/media"), { method: "POST", body: form });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro ?? "Falha ao carregar o ficheiro.");
    return j as FicheiroMedia;
  }, []);
  return { carregar };
}
