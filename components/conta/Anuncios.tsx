"use client";

/* ============================================================
   MOTOBOX — Área de membro: os meus anúncios
   Cartões com o estado no marketplace, as visualizações, editar,
   partilhar e terminar; a linha compacta do resumo; e as janelas
   de publicar/editar e de terminar um anúncio.
   ============================================================ */

import Link from "next/link";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Placeholder } from "@/components/Brand";
import { Partilhar } from "@/components/Partilhar";
import { SeloVerificado } from "@/components/SeloVerificado";
import { Button, Icon } from "@/components/ui";
import { formatKz } from "@/lib/data";
import { MARCAS } from "@/lib/conta/preferencias";
import { PROVINCIAS } from "@/lib/provincias";
import type { AnuncioMarketplace } from "@/lib/types";
import { pedir, type AnuncioConta } from "./dados";
import { Janela, Rotulo, Vazio, campo, diaMesLongo, f, useTextosConta } from "./partes";

const botaoAccao =
  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--raio)] bg-white/10 px-3 text-sm text-white transition-colors hover:bg-white/20 disabled:opacity-50";

function Estado({ a }: { a: AnuncioConta }) {
  const t = useTextosConta().anuncios;
  const visivel = a.visivel !== false;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-medium leading-none ${
      visivel ? "bg-ok text-white" : "bg-gold text-black"
    }`}>
      <span aria-hidden className={`size-1.5 rounded-full ${visivel ? "bg-white" : "bg-black"}`} />
      {visivel ? t.activo : t.oculto}
    </span>
  );
}

/** Cartão de um anúncio próprio, no separador Anúncios. */
export function CartaoAnuncio({ a, aoEditar, aoTerminar }: {
  a: AnuncioConta; aoEditar: () => void; aoTerminar: () => Promise<void>;
}) {
  const t = useTextosConta().anuncios;
  return (
    <article className="painel painel-escuro flex flex-col p-[var(--intervalo)]">
      <Link href={`/marketplace/${a.id}`} className="group relative block aspect-[4/3] overflow-hidden rounded-[var(--raio)]">
        <Placeholder nome={a.imagens[0] ?? a.categoria} className="foto-painel absolute inset-0" tamanhos="(max-width: 768px) 100vw, 33vw" largura={800} />
        <span className="absolute left-3 top-3"><Estado a={a} /></span>
        <span className="sr-only">Abrir o anúncio</span>
      </Link>
      <div className="flex flex-1 flex-col p-4 pt-5">
        <p className="text-sm text-white/75">{[a.categoria, a.provincia].filter(Boolean).join(" · ")}</p>
        <h3 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug text-white">{a.titulo}</h3>
        <p className="mt-2 text-xl font-semibold tabular-nums text-white">
          {formatKz(a.preco)}
          {a.negociavel && <span className="ml-2 text-sm font-normal text-white/75">negociável</span>}
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="eye" className="size-4" />
            {f(t.visualizacoes, { n: a.visualizacoes ?? 0 })}
          </span>
          {a.publicado && <span>{f(t.publicado, { data: diaMesLongo(a.publicado) })}</span>}
        </p>
        {a.visivel === false && (
          <p className="mt-3 rounded-[var(--raio)] bg-gold/15 px-3 py-2 text-sm leading-snug text-[#ffd666]">{t.ocultoNota}</p>
        )}
        <div className="mt-auto flex gap-[var(--intervalo)] pt-5">
          <button type="button" onClick={aoEditar} className={botaoAccao}>
            <Pencil className="size-4" aria-hidden />
            {t.editar}
          </button>
          <Partilhar
            caminho={`/marketplace/${a.id}`}
            titulo={a.titulo}
            texto={`${a.titulo} · ${formatKz(a.preco)}`}
            rotulo={t.partilhar}
            className={botaoAccao}
          />
          <TerminarAnuncio id={a.id} titulo={a.titulo} aoTerminar={aoTerminar} className={botaoAccao} />
        </div>
      </div>
    </article>
  );
}

/** Linha compacta de um anúncio próprio, no resumo. */
export function LinhaAnuncio({ a }: { a: AnuncioConta }) {
  const t = useTextosConta().anuncios;
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Link href={`/marketplace/${a.id}`} className="group flex min-w-0 flex-1 items-center gap-3.5">
        <span className="relative block aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-[var(--raio)]">
          <Placeholder nome={a.imagens[0] ?? a.categoria} className="foto-painel absolute inset-0" tamanhos="80px" largura={300} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium text-white transition-colors group-hover:text-mb-red-light">{a.titulo}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
            <span className="tabular-nums text-white">{formatKz(a.preco)}</span>
            <span className="inline-flex items-center gap-1"><Icon name="eye" className="size-3.5" />{(a.visualizacoes ?? 0).toLocaleString("pt-PT")}</span>
            {a.visivel === false && <span className="text-[#ffd666]">{t.oculto}</span>}
          </span>
        </span>
      </Link>
      <Partilhar
        caminho={`/marketplace/${a.id}`}
        titulo={a.titulo}
        texto={`${a.titulo} · ${formatKz(a.preco)}`}
        rotulo={t.partilhar}
        conteudo={<><Icon name="share" className="size-4" /><span className="sr-only">{t.partilhar}</span></>}
        className="grid size-10 shrink-0 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white"
      />
    </li>
  );
}

/** O separador Anúncios inteiro. */
export function SeparadorAnuncios({ anuncios, verificado, marketplaceAberto, aoPublicar, aoEditar, aoMudar }: {
  anuncios: AnuncioConta[]; verificado: boolean; marketplaceAberto: boolean;
  aoPublicar: () => void; aoEditar: (a: AnuncioConta) => void; aoMudar: () => Promise<void>;
}) {
  const t = useTextosConta().anuncios;
  return (
    <div className="space-y-[var(--intervalo)]">
      <div className="painel painel-escuro flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <div className="min-w-0">
          <h2 className="titulo-4 text-white">{t.titulo}</h2>
          <p className="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-white/80">{t.texto}</p>
        </div>
        {marketplaceAberto && (
          <Button size="lg" onClick={aoPublicar}>
            <Icon name="plus" className="size-4" />
            {t.publicar}
          </Button>
        )}
      </div>

      {verificado && (
        <p className="painel painel-escuro flex items-center gap-3 px-5 py-4 text-[15px] text-white/90">
          <SeloVerificado tamanho={20} decorativo />
          {t.verificado}
        </p>
      )}

      {anuncios.length === 0 ? (
        <Vazio icone={<Icon name="tag" />} titulo={t.vazioTitulo} texto={t.vazioTexto}>
          {marketplaceAberto && (
            <Button onClick={aoPublicar}><Icon name="plus" className="size-4" />{t.publicar}</Button>
          )}
        </Vazio>
      ) : (
        <div className="grid gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-3">
          {anuncios.map((a) => (
            <CartaoAnuncio key={a.id} a={a} aoEditar={() => aoEditar(a)} aoTerminar={aoMudar} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Janelas ---------------- */

export function FormAnuncio({ anuncio, provinciaPadrao, aoFechar, aoGuardar }: {
  anuncio: AnuncioMarketplace | null; provinciaPadrao: string;
  aoFechar: () => void; aoGuardar: () => Promise<void>;
}) {
  const [v, setV] = useState({
    titulo: anuncio?.titulo ?? "", categoria: anuncio?.categoria ?? "Motas",
    preco: anuncio ? String(anuncio.preco) : "", negociavel: anuncio?.negociavel ?? false,
    marca: anuncio?.marca ?? "", modelo: anuncio?.modelo ?? "",
    ano: anuncio?.ano ? String(anuncio.ano) : "", quilometragem: anuncio?.quilometragem ? String(anuncio.quilometragem) : "",
    estado: anuncio?.estado ?? "Bom", provincia: anuncio?.provincia ?? provinciaPadrao, descricao: anuncio?.descricao ?? "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const def = (campos: Partial<typeof v>) => setV((x) => ({ ...x, ...campos }));

  const guardar = async () => {
    setAGuardar(true);
    const { erro: e } = anuncio
      ? await pedir(`/api/conta/anuncios?id=${encodeURIComponent(anuncio.id)}`, "PATCH", v)
      : await pedir("/api/conta/anuncios", "POST", v);
    setAGuardar(false);
    if (e) { setErro(e); return; }
    await aoGuardar();
  };

  return (
    <Janela titulo={anuncio ? "Editar anúncio" : "Publicar anúncio"} aoFechar={aoFechar} larga>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Rotulo texto="Título"><input className={campo} value={v.titulo} onChange={(e) => def({ titulo: e.target.value })} placeholder="Ex.: KTM 250 SX-F 2022, pronta a correr" maxLength={90} /></Rotulo>
        </div>
        <Rotulo texto="Categoria">
          <select className={campo} value={v.categoria} onChange={(e) => def({ categoria: e.target.value as typeof v.categoria })}>
            {["Motas", "Peças", "Equipamento", "Acessórios"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Rotulo>
        <Rotulo texto="Estado">
          <select className={campo} value={v.estado} onChange={(e) => def({ estado: e.target.value as typeof v.estado })}>
            {["Nova", "Como nova", "Muito bom", "Bom", "Para peças"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Rotulo>
        <Rotulo texto="Preço (Kz)"><input className={campo} inputMode="numeric" value={v.preco} onChange={(e) => def({ preco: e.target.value.replace(/[^\d]/g, "") })} /></Rotulo>
        <Rotulo texto="Província">
          <select className={campo} value={v.provincia} onChange={(e) => def({ provincia: e.target.value as typeof v.provincia })}>
            {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Rotulo>
        <Rotulo texto="Marca"><input className={campo} value={v.marca} onChange={(e) => def({ marca: e.target.value })} list="marcas-conta" maxLength={40} /></Rotulo>
        <datalist id="marcas-conta">{MARCAS.map((m) => <option key={m} value={m} />)}</datalist>
        <Rotulo texto="Modelo"><input className={campo} value={v.modelo} onChange={(e) => def({ modelo: e.target.value })} maxLength={60} /></Rotulo>
        <Rotulo texto="Ano"><input className={campo} inputMode="numeric" value={v.ano} onChange={(e) => def({ ano: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })} /></Rotulo>
        <Rotulo texto="Quilómetros"><input className={campo} inputMode="numeric" value={v.quilometragem} onChange={(e) => def({ quilometragem: e.target.value.replace(/[^\d]/g, "") })} /></Rotulo>
        <div className="sm:col-span-2">
          <Rotulo texto="Descrição">
            <textarea className={`${campo} h-32 py-2`} value={v.descricao} onChange={(e) => def({ descricao: e.target.value })} maxLength={3000}
              placeholder="Estado, revisões, o que inclui, onde se pode ver." />
          </Rotulo>
        </div>
        <label className="flex items-center gap-2.5 text-[15px] text-white/90 sm:col-span-2">
          <input type="checkbox" checked={v.negociavel} onChange={(e) => def({ negociavel: e.target.checked })} className="size-4 accent-[#e10600]" />
          Preço negociável
        </label>
      </div>
      <p className="mt-4 text-sm text-white/70">Por agora os anúncios são publicados sem fotografias.</p>
      {erro && <p role="alert" className="mt-3 text-sm text-mb-red-light">{erro}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
        <Button onClick={guardar} disabled={aGuardar}>{aGuardar ? "A guardar…" : anuncio ? "Guardar" : "Publicar"}</Button>
      </div>
    </Janela>
  );
}

function TerminarAnuncio({ id, titulo, aoTerminar, className }: {
  id: string; titulo: string; aoTerminar: () => Promise<void>; className: string;
}) {
  const t = useTextosConta().anuncios;
  const [confirmar, setConfirmar] = useState(false);
  const [aApagar, setAApagar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <>
      <button type="button" className={className} onClick={() => setConfirmar(true)}>
        <Icon name="close" className="size-4" />
        {t.terminar}
      </button>
      {confirmar && (
        <Janela titulo="Terminar anúncio" aoFechar={() => setConfirmar(false)}>
          <p className="text-[15px] leading-relaxed text-white/90">
            <strong className="text-white">{titulo}</strong> sai do marketplace e não pode ser recuperado. Continuar?
          </p>
          {erro && <p role="alert" className="mt-3 text-sm text-mb-red-light">{erro}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmar(false)}>Cancelar</Button>
            <Button disabled={aApagar} onClick={async () => {
              setAApagar(true);
              const { erro: e } = await pedir(`/api/conta/anuncios?id=${encodeURIComponent(id)}`, "DELETE");
              setAApagar(false);
              if (e) { setErro(e); return; }
              setConfirmar(false);
              await aoTerminar();
            }}>
              {aApagar ? "A terminar…" : "Terminar anúncio"}
            </Button>
          </div>
        </Janela>
      )}
    </>
  );
}
