"use client";

/* ============================================================
   MOTOBOX — Área de membro: a minha garagem
   As motas do membro (marca, modelo, ano, nome e fotografia),
   guardadas em /api/conta/garagem. A fotografia é reduzida no
   navegador antes de subir (1280 px, JPEG), para ficar leve.
   ============================================================ */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { Button, Icon } from "@/components/ui";
import { MARCAS } from "@/lib/conta/preferencias";
import { ANO_MINIMO, MAXIMO_MOTAS, anoMaximo, nomeMota, pedir, type MotaGaragem } from "./dados";
import { Janela, Rotulo, Vazio, campo, f, useTextosConta } from "./partes";

const TIPOS = ["image/jpeg", "image/png", "image/webp"];

/** Reduz a fotografia a 1280 px no lado maior, em JPEG. Sem suporte, segue a original. */
async function reduzir(ficheiro: File, maximo = 1280): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(ficheiro);
    const escala = Math.min(1, maximo / Math.max(bitmap.width, bitmap.height));
    const tela = document.createElement("canvas");
    tela.width = Math.round(bitmap.width * escala);
    tela.height = Math.round(bitmap.height * escala);
    tela.getContext("2d")?.drawImage(bitmap, 0, 0, tela.width, tela.height);
    bitmap.close();
    return await new Promise<Blob>((ok) => tela.toBlob((b) => ok(b ?? ficheiro), "image/jpeg", 0.85));
  } catch {
    return ficheiro;
  }
}

/** Fotografia da mota, ou o desenho de uma mota com a marca por baixo. */
export function FotoMota({ mota, className = "", tamanhos = "(max-width: 768px) 100vw, 33vw" }: {
  mota: MotaGaragem; className?: string; tamanhos?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--raio)] bg-gradient-to-br from-ink-700 to-ink-950 ${className}`}>
      {mota.foto ? (
        <Image src={mota.foto} alt={nomeMota(mota)} fill sizes={tamanhos} unoptimized={mota.foto.startsWith("blob:")} className="foto-painel object-cover" />
      ) : (
        <div aria-hidden className="absolute inset-0 grid place-items-center text-white/70">
          <Icon name="bike" className="size-1/3" />
        </div>
      )}
    </div>
  );
}

function CartaoMota({ mota, aoEditar, aoRemover }: { mota: MotaGaragem; aoEditar: () => void; aoRemover: () => void }) {
  const t = useTextosConta().garagem;
  return (
    <article className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
      <FotoMota mota={mota} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col p-4 pt-5">
        <p className="text-sm text-mb-red-light">{mota.marca}</p>
        <h3 className="mt-1 text-xl font-semibold leading-snug text-white">{mota.apelido || mota.modelo}</h3>
        <p className="mt-1 text-[15px] text-white/80">
          {mota.apelido ? `${mota.marca} ${mota.modelo}` : mota.marca}
          {mota.ano ? ` · ${mota.ano}` : ""}
        </p>
        <div className="mt-auto flex gap-[var(--intervalo)] pt-5">
          <Button variant="dark" size="sm" className="flex-1" onClick={aoEditar}>
            <Pencil className="size-4" aria-hidden />{t.editar}
          </Button>
          <Button variant="dark" size="sm" className="flex-1" onClick={aoRemover}>
            <Icon name="close" className="size-4" />{t.remover}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function SeparadorGaragem({ garagem, aoMudar }: { garagem: MotaGaragem[]; aoMudar: (g: MotaGaragem[]) => void }) {
  const t = useTextosConta().garagem;
  const [form, setForm] = useState<MotaGaragem | "nova" | null>(null);
  const [aRemover, setARemover] = useState<MotaGaragem | null>(null);
  const cheia = garagem.length >= MAXIMO_MOTAS;

  return (
    <div className="space-y-[var(--intervalo)]">
      <div className="painel painel-escuro flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <div className="min-w-0">
          <h2 className="titulo-4 text-white">{t.titulo}</h2>
          <p className="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-white/80">{t.texto}</p>
        </div>
        {!cheia && garagem.length > 0 && (
          <Button size="lg" onClick={() => setForm("nova")}><Icon name="plus" className="size-4" />{t.juntar}</Button>
        )}
      </div>

      {garagem.length === 0 ? (
        <Vazio icone={<Icon name="bike" />} titulo={t.vazioTitulo} texto={t.vazioTexto}>
          <Button onClick={() => setForm("nova")}><Icon name="plus" className="size-4" />{t.juntar}</Button>
        </Vazio>
      ) : (
        <div className="grid gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-3">
          {garagem.map((m) => (
            <CartaoMota key={m.id} mota={m} aoEditar={() => setForm(m)} aoRemover={() => setARemover(m)} />
          ))}
          {!cheia && (
            <button type="button" onClick={() => setForm("nova")}
              className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-[var(--raio)] border-2 border-dashed border-white/25 p-6 text-white transition-colors hover:border-white/50 hover:bg-white/5">
              <span className="grid size-12 place-items-center rounded-full bg-mb-red"><Icon name="plus" className="size-5" /></span>
              <span className="text-base font-medium">{t.juntar}</span>
              <span className="text-sm text-white/75">{f(t.maximo, { n: MAXIMO_MOTAS })}</span>
            </button>
          )}
        </div>
      )}

      {form && (
        <FormMota mota={form === "nova" ? null : form} aoFechar={() => setForm(null)}
          aoGuardar={(g) => { setForm(null); aoMudar(g); }} />
      )}
      {aRemover && (
        <RemoverMota mota={aRemover} aoFechar={() => setARemover(null)}
          aoRemover={(g) => { setARemover(null); aoMudar(g); }} />
      )}
    </div>
  );
}

function FormMota({ mota, aoFechar, aoGuardar }: {
  mota: MotaGaragem | null; aoFechar: () => void; aoGuardar: (g: MotaGaragem[]) => void;
}) {
  const t = useTextosConta().garagem;
  const [v, setV] = useState({
    marca: mota?.marca ?? "", modelo: mota?.modelo ?? "",
    ano: mota?.ano ? String(mota.ano) : "", apelido: mota?.apelido ?? "",
  });
  const [foto, setFoto] = useState<{ blob: Blob; preview: string } | null>(null);
  const [tirarFoto, setTirarFoto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const seletor = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (foto) URL.revokeObjectURL(foto.preview); }, [foto]);

  const escolher = async (fich: File | undefined) => {
    setErro(null);
    if (!fich) return;
    if (!TIPOS.includes(fich.type)) { setErro("Use uma fotografia JPG, PNG ou WebP."); return; }
    const blob = await reduzir(fich);
    if (blob.size > 2 * 1024 * 1024) { setErro("A fotografia continua com mais de 2 MB. Escolha outra."); return; }
    setTirarFoto(false);
    setFoto({ blob, preview: URL.createObjectURL(blob) });
  };

  const guardar = async () => {
    setAGuardar(true);
    setErro(null);
    const r = await pedir("/api/conta/garagem", "PUT", { ...v, ano: v.ano || undefined, ...(mota ? { id: mota.id } : {}) });
    if (r.erro) { setAGuardar(false); setErro(r.erro); return; }
    let garagem = (r.json.garagem as MotaGaragem[]) ?? [];
    const id = String(r.json.id ?? mota?.id ?? "");
    if (foto && id) {
      const dados = new FormData();
      dados.append("id", id);
      dados.append("ficheiro", foto.blob, "mota.jpg");
      const rf = await pedir("/api/conta/garagem", "POST", dados);
      if (rf.erro) { setAGuardar(false); setErro(`A mota ficou guardada, mas a fotografia não: ${rf.erro}`); aoGuardar(garagem); return; }
      garagem = (rf.json.garagem as MotaGaragem[]) ?? garagem;
    } else if (tirarFoto && mota?.foto) {
      const rf = await pedir(`/api/conta/garagem?id=${encodeURIComponent(mota.id)}&foto=1`, "DELETE");
      if (!rf.erro) garagem = (rf.json.garagem as MotaGaragem[]) ?? garagem;
    }
    setAGuardar(false);
    aoGuardar(garagem);
  };

  const mostrada: MotaGaragem = {
    id: mota?.id ?? "m-nova", marca: v.marca || "Marca", modelo: v.modelo || "Modelo",
    foto: foto?.preview ?? (tirarFoto ? undefined : mota?.foto),
  };

  return (
    <Janela titulo={mota ? t.formEditar : t.formNova} aoFechar={aoFechar}>
      <div className="flex flex-wrap items-center gap-4">
        <FotoMota mota={mostrada} className="aspect-[4/3] w-40 shrink-0" tamanhos="160px" />
        <div className="min-w-0 flex-1 basis-40">
          <p className="text-base font-semibold text-white">{t.foto}</p>
          <p className="mt-0.5 text-sm text-white/70">{t.fotoAjuda}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="dark" size="sm" onClick={() => seletor.current?.click()}>
              {mostrada.foto ? "Trocar fotografia" : "Escolher fotografia"}
            </Button>
            {mostrada.foto && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setFoto(null); setTirarFoto(true); }}>Remover</Button>
            )}
          </div>
          <input ref={seletor} type="file" accept={TIPOS.join(",")} className="sr-only" tabIndex={-1} aria-hidden
            onChange={(e) => { void escolher(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Rotulo texto={t.marca}>
          <input className={campo} value={v.marca} onChange={(e) => setV({ ...v, marca: e.target.value })} list="marcas-garagem" maxLength={40} required />
        </Rotulo>
        <datalist id="marcas-garagem">{MARCAS.map((m) => <option key={m} value={m} />)}</datalist>
        <Rotulo texto={t.modelo}>
          <input className={campo} value={v.modelo} onChange={(e) => setV({ ...v, modelo: e.target.value })} maxLength={60} placeholder="Ex.: Africa Twin" required />
        </Rotulo>
        <Rotulo texto={t.ano}>
          <input className={campo} inputMode="numeric" value={v.ano} placeholder={String(anoMaximo() - 1)}
            onChange={(e) => setV({ ...v, ano: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })}
            aria-describedby="ano-ajuda" />
          <span id="ano-ajuda" className="sr-only">Entre {ANO_MINIMO} e {anoMaximo()}</span>
        </Rotulo>
        <Rotulo texto={t.apelido} ajuda={t.apelidoAjuda}>
          <input className={campo} value={v.apelido} onChange={(e) => setV({ ...v, apelido: e.target.value })} maxLength={40} />
        </Rotulo>
      </div>
      {erro && <p role="alert" className="mt-4 text-sm text-mb-red-light">{erro}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
        <Button onClick={guardar} disabled={aGuardar || !v.marca.trim() || !v.modelo.trim()}>{aGuardar ? "A guardar…" : "Guardar"}</Button>
      </div>
    </Janela>
  );
}

function RemoverMota({ mota, aoFechar, aoRemover }: {
  mota: MotaGaragem; aoFechar: () => void; aoRemover: (g: MotaGaragem[]) => void;
}) {
  const t = useTextosConta().garagem;
  const [aRemover, setARemover] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Janela titulo={t.remover} aoFechar={aoFechar}>
      <p className="text-[15px] leading-relaxed text-white/90">{f(t.confirmarRemover, { mota: nomeMota(mota) })}</p>
      {erro && <p role="alert" className="mt-3 text-sm text-mb-red-light">{erro}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
        <Button disabled={aRemover} onClick={async () => {
          setARemover(true);
          const r = await pedir(`/api/conta/garagem?id=${encodeURIComponent(mota.id)}`, "DELETE");
          setARemover(false);
          if (r.erro) { setErro(r.erro); return; }
          aoRemover((r.json.garagem as MotaGaragem[]) ?? []);
        }}>
          {aRemover ? "A remover…" : t.remover}
        </Button>
      </div>
    </Janela>
  );
}
