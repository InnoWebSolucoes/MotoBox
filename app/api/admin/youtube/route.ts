import { NextResponse, type NextRequest } from "next/server";
import { idYoutube, miniaturaYoutube, formatarDuracao } from "@/lib/youtube";

/* ============================================================
   MOTOBOX — Importar vídeo do YouTube
   Recebe a ligação colada no painel e devolve o que o formulário
   precisa: id, título, canal, miniatura, duração e descrição.
   O título e a miniatura vêm do oEmbed público do YouTube; a
   duração e a descrição, da página do vídeo (melhor esforço: se
   o YouTube mudar a página, esses dois campos ficam por preencher
   à mão e o resto continua a funcionar). Não precisa de chave.
   ============================================================ */

export const dynamic = "force-dynamic";

const NAVEGADOR = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
};

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/** A miniatura grande não existe em todos os vídeos; a média existe sempre. */
async function melhorMiniatura(id: string): Promise<string> {
  const grande = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  try {
    const r = await fetch(grande, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    if (r.ok) return grande;
  } catch { /* fica a média */ }
  return miniaturaYoutube(id);
}

/** Duração e descrição, lidas do JSON embutido na página do vídeo. */
async function detalhesDaPagina(id: string): Promise<{ duracao?: string; descricao?: string }> {
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: NAVEGADOR, signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return {};
    const html = await r.text();
    const segundos = /"lengthSeconds":"(\d+)"/.exec(html)?.[1];
    const bruta = /"shortDescription":"((?:[^"\\]|\\.)*)"/.exec(html)?.[1];
    let descricao: string | undefined;
    if (bruta) {
      try { descricao = JSON.parse(`"${bruta}"`) as string; } catch { /* formato inesperado */ }
    }
    return {
      duracao: segundos ? formatarDuracao(Number(segundos)) : undefined,
      descricao: descricao?.trim() || undefined,
    };
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const ligacao = new URL(req.url).searchParams.get("url") ?? "";
  const id = idYoutube(ligacao);
  if (!id) return erro("Isso não parece uma ligação do YouTube. Copie o endereço do vídeo (ex.: https://youtu.be/…).");

  let oembed: { title?: string; author_name?: string };
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (r.status === 401 || r.status === 403 || r.status === 404) {
      return erro("O YouTube não encontrou este vídeo. Confirme que é público ou não listado, e não privado.", 404);
    }
    if (!r.ok) return erro(`O YouTube não respondeu (${r.status}). Tente de novo.`, 502);
    oembed = await r.json();
  } catch {
    return erro("Não foi possível contactar o YouTube. Verifique a ligação à internet.", 502);
  }

  const [thumbnail, pagina] = await Promise.all([melhorMiniatura(id), detalhesDaPagina(id)]);

  return NextResponse.json({
    videoId: id,
    titulo: oembed.title ?? "",
    canal: oembed.author_name ?? "",
    thumbnail,
    duracao: pagina.duracao ?? null,
    descricao: pagina.descricao ?? null,
  });
}
