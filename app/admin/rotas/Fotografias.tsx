"use client";

/* ============================================================
   MOTOBOX ADMIN — Rotas: fotografias
   A primeira é a capa (abertura da página e cartões); as outras
   formam a galeria "Como é, ao vivo". Cada uma leva o crédito
   que a licença pede: autor, licença e ligação.
   ============================================================ */

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { origemFoto, urlFoto, type Foto, type Rota } from "@/lib/rotas-tipos";
import { AccaoIcone, Botao, Etiqueta, Seta } from "@/components/admin/kit";
import { CampoImagem } from "@/components/admin/Media";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";

const FOCOS = [
  { valor: "50% 20%", nome: "Em cima" },
  { valor: "50% 80%", nome: "Em baixo" },
  { valor: "20% 50%", nome: "À esquerda" },
  { valor: "80% 50%", nome: "À direita" },
];

/** Os campos de uma fotografia; um recorte afinado à mão aparece como "Ajuste próprio". */
const esquemaFoto = (foco?: string): CampoEsquema[] => [
  { tipo: "texto", chave: "local", etiqueta: "Legenda", ajuda: "O que a fotografia mostra. Aparece por baixo dela (e na abertura, antes do crédito)." },
  { tipo: "area", chave: "alt", etiqueta: "Descrição para quem não vê a imagem", linhas: 2, ajuda: "Lida em voz alta pelos leitores de ecrã. Descreva o que se vê." },
  { tipo: "texto", chave: "autor", etiqueta: "Autor", largura: "meia" },
  { tipo: "texto", chave: "licenca", etiqueta: "Licença", largura: "meia", placeholder: "Ex.: CC BY-SA 4.0" },
  { tipo: "url", chave: "licencaUrl", etiqueta: "Ligação da licença", largura: "meia", placeholder: "https://creativecommons.org/…" },
  { tipo: "url", chave: "pagina", etiqueta: "Página da fotografia", largura: "meia", ajuda: "Onde a fotografia foi publicada (o nome do autor leva lá)." },
  {
    tipo: "texto", chave: "origem", etiqueta: "Publicada em", largura: "meia", placeholder: "Ex.: Wikimedia Commons",
    ajuda: "Fecha o crédito. As fotografias do Wikimedia Commons dizem-no sozinhas.",
  },
  {
    tipo: "seleccao", chave: "foco", etiqueta: "Parte mais importante", largura: "meia", vazio: "O centro",
    ajuda: "Quando a fotografia é cortada (cartões, abertura), esta parte fica sempre à vista.",
    opcoes: foco && !FOCOS.some((f) => f.valor === foco) ? [...FOCOS, { valor: foco, nome: "Ajuste próprio" }] : FOCOS,
  },
];

const fotoNova = (): Foto => ({
  arquivo: "", largura: 0, altura: 0, pagina: "", autor: "", licenca: "", licencaUrl: "", alt: "", local: "", url: "",
});

/** A capa em miniatura, para os cartões dos clubes (campo `imagem`). */
const capaDe = (fotos: Foto[]) => (fotos[0] ? urlFoto(fotos[0], 960) : "");

export function EditorFotografias({ rota, mudar }: { rota: Rota; mudar: (r: Rota) => void }) {
  const fotos = Array.isArray(rota.fotos) ? rota.fotos : [];
  const [aberta, setAberta] = useState<number | null>(fotos.length ? 0 : null);

  const definir = (novas: Foto[]) => mudar({ ...rota, fotos: novas, imagem: capaDe(novas) });

  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= fotos.length) return;
    const v = [...fotos];
    [v[i], v[j]] = [v[j], v[i]];
    definir(v);
    setAberta((a) => (a === i ? j : a === j ? i : a));
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-relaxed text-white/75">
        A <strong className="text-white/80">primeira fotografia é a capa</strong>: fica na abertura da página e nos cartões das
        rotas. As outras formam a galeria. Pode carregar fotografias do computador, escolher da biblioteca ou colar o
        endereço de uma imagem (por exemplo, do Wikimedia Commons). Diga sempre quem a tirou e com que licença.
      </p>
      <ol className="space-y-[var(--intervalo)]">
        {fotos.map((f, i) => {
          const aberto = aberta === i;
          const endereco = f.url || urlFoto(f, 960);
          return (
            <li key={i} className="rounded-[var(--raio)] border border-white/10 bg-black/[0.18]">
              <div className="flex items-center gap-2 px-3 py-2">
                <button type="button" onClick={() => setAberta(aberto ? null : i)} aria-expanded={aberto}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-[4px] bg-black/40">
                    {endereco && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={endereco} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-white">{f.local || "Fotografia sem legenda"}</span>
                    <span className="block truncate text-xs text-white/70">
                      {[f.autor, f.licenca, origemFoto(f)].filter(Boolean).join(" · ") || "Sem crédito"}
                    </span>
                  </span>
                  {i === 0 && <span className="ml-auto shrink-0"><Etiqueta tom="vermelho">Capa</Etiqueta></span>}
                </button>
                <span className="flex shrink-0 gap-1">
                  <AccaoIcone titulo="Subir" onClick={() => mover(i, -1)}><Seta para="cima" /></AccaoIcone>
                  <AccaoIcone titulo="Descer" onClick={() => mover(i, 1)}><Seta para="baixo" /></AccaoIcone>
                  <AccaoIcone titulo="Apagar fotografia" tom="perigo" onClick={() => { definir(fotos.filter((_, j) => j !== i)); setAberta(null); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden>
                      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                    </svg>
                  </AccaoIcone>
                </span>
              </div>
              {aberto && (
                <div className="grid gap-5 border-t border-white/10 p-3 md:p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                  <CampoImagem
                    etiqueta={i === 0 ? "Fotografia de capa" : "Fotografia"}
                    formato="aspect-[4/3]"
                    valor={endereco}
                    onChange={(v) => {
                      if (v === endereco) return;
                      // Uma imagem nova deixa de ser o ficheiro do Commons que lá estava.
                      const nova: Foto = { ...f, url: v, arquivo: "", largura: 0, altura: 0 };
                      definir(fotos.map((x, j) => (j === i ? nova : x)));
                    }}
                  />
                  <Formulario
                    esquema={esquemaFoto(f.foco)}
                    valor={f as unknown as Valor}
                    onChange={(v) => {
                      const nova = { ...(v as unknown as Foto) };
                      if (!nova.foco) delete nova.foco;
                      // Sem "Publicada em", o crédito volta a dizê-lo sozinho (ex.: Wikimedia Commons).
                      if (!nova.origem) delete nova.origem;
                      definir(fotos.map((x, j) => (j === i ? nova : x)));
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <Botao onClick={() => { definir([...fotos, fotoNova()]); setAberta(fotos.length); }}>
        <ImagePlus className="size-4" aria-hidden /> Juntar fotografia
      </Botao>
    </div>
  );
}
