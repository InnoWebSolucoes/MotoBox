"use client";

import { useState } from "react";
import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, CampoEndereco, Input, Area, Seleccao } from "@/components/admin/kit";
import { slugify, useAdmin } from "@/lib/admin/store";
import { formatDataCurta } from "@/lib/data";
import { idYoutube } from "@/lib/youtube";
import type { Video } from "@/lib/types";
import { comBase } from "@/lib/base";

const CATEGORIAS = ["Highlights", "Entrevista", "Documentário", "Onboard", "Resumo"];
const op = (v: string[]) => v.map((x) => ({ valor: x, nome: x }));

interface Importado {
  videoId: string;
  titulo: string;
  canal: string;
  thumbnail: string;
  duracao: string | null;
  descricao: string | null;
}

/**
 * Colar a ligação do YouTube é o primeiro passo: o vídeo só se vê no
 * site com ela. Ao importar, o título, a miniatura, a duração e a
 * descrição vêm do YouTube; o que já estiver escrito não é apagado.
 */
function ImportarYoutube({ r, definir, novo }: {
  r: Video; definir: (campos: Partial<Video>) => void; novo: boolean;
}) {
  const [ligacao, setLigacao] = useState(r.videoId ? `https://youtu.be/${r.videoId}` : "");
  const [estado, setEstado] = useState<"parado" | "a-importar">("parado");
  const [erro, setErro] = useState<string | null>(null);
  const [canal, setCanal] = useState("");

  const importar = async (texto = ligacao) => {
    setErro(null);
    if (!idYoutube(texto)) {
      setErro("Isso não parece uma ligação do YouTube. Copie o endereço do vídeo (ex.: https://youtu.be/…).");
      return;
    }
    setEstado("a-importar");
    try {
      const resposta = await fetch(comBase(`/api/admin/youtube?url=${encodeURIComponent(texto)}`));
      const j = await resposta.json().catch(() => ({ erro: `Erro ${resposta.status}` }));
      if (!resposta.ok) { setErro(String(j.erro ?? `Erro ${resposta.status}`)); return; }
      const v = j as Importado;
      const titulo = r.titulo.trim() ? r.titulo : v.titulo;
      definir({
        videoId: v.videoId,
        thumbnail: v.thumbnail,
        titulo,
        ...(novo && !r.slug ? { slug: slugify(titulo) } : {}),
        ...(v.duracao && (!r.duracao || r.duracao === "0:00") ? { duracao: v.duracao } : {}),
        ...(v.descricao && !r.descricao.trim() ? { descricao: v.descricao.slice(0, 600) } : {}),
      });
      setCanal(v.canal);
    } catch {
      setErro("Não foi possível contactar o servidor. Verifique a ligação.");
    } finally {
      setEstado("parado");
    }
  };

  return (
    <div className="space-y-3 border border-ink-700 bg-ink-950 p-3">
      <Campo etiqueta="Ligação do YouTube" obrigatorio
        ajuda="Cole o endereço do vídeo. O título, a imagem e a duração preenchem-se sozinhos.">
        <div className="flex gap-2">
          <Input value={ligacao} placeholder="https://www.youtube.com/watch?v=…"
            onChange={(e) => setLigacao(e.target.value)}
            onPaste={(e) => {
              const colado = e.clipboardData.getData("text");
              if (idYoutube(colado)) { setLigacao(colado); void importar(colado); e.preventDefault(); }
            }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void importar(); } }} />
          <button type="button" onClick={() => void importar()} disabled={estado === "a-importar"}
            className="shrink-0 border border-ink-600 px-3 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red disabled:opacity-60">
            {estado === "a-importar" ? "A importar…" : "Importar"}
          </button>
        </div>
      </Campo>

      {erro && <p role="alert" className="border-l-2 border-mb-red pl-3 text-sm text-mb-red">{erro}</p>}

      {r.videoId ? (
        <div className="flex items-center gap-3">
          {r.thumbnail && (
            // Pré-visualização pequena no painel: um <img> simples chega.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.thumbnail} alt="" className="aspect-video w-32 shrink-0 object-cover" />
          )}
          <div className="min-w-0 text-xs">
            <p className="text-ok">Vídeo ligado ao YouTube</p>
            {canal && <p className="truncate text-ink-400">Canal: {canal}</p>}
            <a href={`https://www.youtube.com/watch?v=${r.videoId}`} target="_blank" rel="noopener noreferrer"
              className="text-ink-300 underline hover:text-white">
              Abrir no YouTube
            </a>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gold">Sem ligação do YouTube: o vídeo aparece no site mas não pode ser reproduzido.</p>
      )}
    </div>
  );
}

export default function AdminVideos() {
  const { estado } = useAdmin();
  const eventos = estado.eventos.map((e) => ({ valor: e.titulo, nome: e.titulo }));

  return (
    <PaginaRecurso<Video>
      coleccao="videos"
      titulo="Vídeos"
      descricao="Cole a ligação do YouTube e o vídeo fica pronto a publicar."
      procuraEm={(v) => `${v.titulo} ${v.descricao} ${v.categoria} ${v.evento ?? ""}`}
      ordenar={(a, b) => b.data.localeCompare(a.data)}
      filtros={[{ chave: "categoria", etiqueta: "Categoria", opcoes: op(CATEGORIAS) }]}
      colunas={[
        {
          cabecalho: "Vídeo",
          celula: (v) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{v.titulo}</p>
              <p className="truncate text-xs text-ink-500">{v.evento ?? "Sem evento associado"}</p>
            </div>
          ),
        },
        {
          cabecalho: "YouTube",
          celula: (v) => v.videoId
            ? <span className="text-ok">Ligado</span>
            : <span className="text-gold">Sem ligação</span>,
        },
        { cabecalho: "Categoria", celula: (v) => <span className="text-ink-300">{v.categoria}</span> },
        { cabecalho: "Duração", celula: (v) => <span className="tabular-nums text-ink-400">{v.duracao}</span> },
        { cabecalho: "Data", celula: (v) => <span className="tabular-nums text-ink-400">{formatDataCurta(v.data)}</span> },
      ]}
      novoRegisto={() => ({
        slug: "", titulo: "", descricao: "", duracao: "0:00",
        data: new Date().toISOString().slice(0, 10), thumbnail: "",
        categoria: "Highlights", visualizacoes: 0,
      }) as Video}
      formulario={(r, definir, { novo }) => (
        <>
          <ImportarYoutube r={r} definir={definir} novo={novo} />
          <Campo etiqueta="Título" obrigatorio>
            <Input value={r.titulo}
              onChange={(e) => definir({ titulo: e.target.value, slug: novo && r.slug === slugify(r.titulo) ? slugify(e.target.value) : r.slug } as Partial<Video>)} />
          </Campo>
          <CampoEndereco prefixo="/videos" novo={novo} valor={r.slug}
            onChange={(slug) => definir({ slug } as Partial<Video>)} />
          <Campo etiqueta="Descrição">
            <Area rows={3} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value } as Partial<Video>)} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Categoria">
              <Seleccao valor={r.categoria} opcoes={op(CATEGORIAS)}
                onChange={(v) => definir({ categoria: v } as unknown as Partial<Video>)} />
            </Campo>
            <Campo etiqueta="Duração" ajuda="Vem do YouTube. Formato m:ss.">
              <Input value={r.duracao} onChange={(e) => definir({ duracao: e.target.value } as Partial<Video>)} />
            </Campo>
            <Campo etiqueta="Data">
              <Input type="date" value={r.data.slice(0, 10)} onChange={(e) => definir({ data: e.target.value } as Partial<Video>)} />
            </Campo>
            <Campo etiqueta="Visualizações" ajuda="Número mostrado no site.">
              <Input type="number" value={r.visualizacoes} onChange={(e) => definir({ visualizacoes: Number(e.target.value) } as Partial<Video>)} />
            </Campo>
          </div>
          <Campo etiqueta="Evento associado">
            <Seleccao valor={r.evento ?? ""} opcoes={[{ valor: "", nome: "Nenhum" }, ...eventos]}
              onChange={(v) => definir({ evento: v || undefined } as Partial<Video>)} />
          </Campo>
        </>
      )}
    />
  );
}
