import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { supabaseAdmin, supabaseAdminConfigurado } from "@/lib/supabase/server";
import { comBase } from "@/lib/base";
import type { FicheiroMedia } from "@/lib/conteudo/tipos";

/* ============================================================
   MOTOBOX — Biblioteca de imagens e vídeos (painel de gestão)
   Ficheiros no bucket público "media" do Supabase Storage,
   em media/imagens/… e media/videos/…. O acesso é verificado
   no proxy: só a equipa chega aqui.

   GET                       lista tudo, do mais recente para o mais antigo
   POST  (multipart)         ficheiro=<File>  → { url, caminho, … }
   DELETE ?caminho=…         apaga o ficheiro

   Sem Supabase (só em desenvolvimento), grava em public/media-local.
   ============================================================ */

export const dynamic = "force-dynamic";

const BUCKET = "media";
const IMAGENS = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"];
const VIDEOS = ["video/mp4", "video/webm"];
const MAX_IMAGEM = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

const local = () => !supabaseAdminConfigurado && process.env.NODE_ENV !== "production";
const PASTA_LOCAL = path.join(process.cwd(), "public", "media-local");

const erro = (mensagem: string, codigo = 400) => NextResponse.json({ erro: mensagem }, { status: codigo });

const limpar = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "ficheiro";

const tipoDe = (caminho: string): FicheiroMedia["tipo"] => (caminho.startsWith("videos/") ? "video" : "imagem");

function urlPublica(caminho: string): string {
  if (local()) return comBase(`/media-local/${caminho}`);
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${caminho}`;
}

export async function GET() {
  try {
    const ficheiros: FicheiroMedia[] = [];
    for (const pasta of ["imagens", "videos"] as const) {
      if (local()) {
        const dir = path.join(PASTA_LOCAL, pasta);
        const nomes = await fs.readdir(dir).catch(() => [] as string[]);
        for (const n of nomes) {
          const st = await fs.stat(path.join(dir, n));
          const caminho = `${pasta}/${n}`;
          ficheiros.push({ caminho, url: urlPublica(caminho), nome: n, tipo: tipoDe(caminho), tamanho: st.size, criado: st.mtime.toISOString() });
        }
        continue;
      }
      const db = supabaseAdmin();
      if (!db) return erro("Supabase não configurado.", 503);
      const { data, error } = await db.storage.from(BUCKET).list(pasta, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
      if (error) return erro(error.message, 500);
      for (const f of data ?? []) {
        if (!f.name || f.name.startsWith(".")) continue;
        const caminho = `${pasta}/${f.name}`;
        ficheiros.push({
          caminho, url: urlPublica(caminho), nome: f.name, tipo: tipoDe(caminho),
          tamanho: (f.metadata as { size?: number } | null)?.size, criado: f.created_at ?? undefined,
        });
      }
    }
    ficheiros.sort((a, b) => (b.criado ?? "").localeCompare(a.criado ?? ""));
    return NextResponse.json({ ficheiros, local: local() });
  } catch (e) {
    return erro(e instanceof Error ? e.message : "Falha ao ler a biblioteca.", 500);
  }
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try { form = await req.formData(); } catch { return erro("Envie o ficheiro num formulário (multipart)."); }
  const ficheiro = form.get("ficheiro");
  if (!(ficheiro instanceof File)) return erro("Falta o ficheiro.");

  const eImagem = IMAGENS.includes(ficheiro.type);
  const eVideo = VIDEOS.includes(ficheiro.type);
  if (!eImagem && !eVideo) return erro("Formato não aceite. Use JPG, PNG, WebP, AVIF, GIF ou SVG para imagens, e MP4 ou WebM para vídeos.");
  if (eImagem && ficheiro.size > MAX_IMAGEM) return erro("A imagem passa dos 10 MB. Reduza-a antes de a carregar.");
  if (eVideo && ficheiro.size > MAX_VIDEO) return erro("O vídeo passa dos 50 MB. Comprima-o antes de o carregar.");

  const ext = (ficheiro.name.match(/\.([a-z0-9]+)$/i)?.[1] ?? ficheiro.type.split("/")[1] ?? "bin").toLowerCase().replace("jpeg", "jpg").replace("svg+xml", "svg");
  const pasta = eVideo ? "videos" : "imagens";
  const caminho = `${pasta}/${Date.now()}-${limpar(ficheiro.name)}.${ext}`;
  const bytes = Buffer.from(await ficheiro.arrayBuffer());

  try {
    if (local()) {
      await fs.mkdir(path.join(PASTA_LOCAL, pasta), { recursive: true });
      await fs.writeFile(path.join(PASTA_LOCAL, caminho), bytes);
    } else {
      const db = supabaseAdmin();
      if (!db) return erro("Supabase não configurado.", 503);
      const { error } = await db.storage.from(BUCKET).upload(caminho, bytes, {
        contentType: ficheiro.type, cacheControl: "31536000", upsert: false,
      });
      if (error) return erro(error.message, 500);
    }
  } catch (e) {
    return erro(e instanceof Error ? e.message : "Falha ao carregar o ficheiro.", 500);
  }

  const resposta: FicheiroMedia = {
    caminho, url: urlPublica(caminho), nome: caminho.split("/")[1], tipo: eVideo ? "video" : "imagem",
    tamanho: ficheiro.size, criado: new Date().toISOString(),
  };
  return NextResponse.json(resposta, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const caminho = req.nextUrl.searchParams.get("caminho") ?? "";
  if (!/^(imagens|videos)\/[a-z0-9.-]+$/.test(caminho)) return erro("Caminho inválido.");
  try {
    if (local()) {
      await fs.rm(path.join(PASTA_LOCAL, caminho), { force: true });
    } else {
      const db = supabaseAdmin();
      if (!db) return erro("Supabase não configurado.", 503);
      const { error } = await db.storage.from(BUCKET).remove([caminho]);
      if (error) return erro(error.message, 500);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erro(e instanceof Error ? e.message : "Falha ao apagar.", 500);
  }
}
