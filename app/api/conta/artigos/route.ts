import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual } from "@/lib/conta/sessao";
import { lerNoticias } from "@/lib/supabase/publico";
import { artigosDe, MAXIMO_ARTIGOS, SLUG } from "@/components/conta/dados";

/* ============================================================
   MOTOBOX — Artigos guardados de quem tem sessão
   GET devolve os slugs guardados. POST { slug, guardar } guarda
   ou retira um artigo e devolve a lista actualizada. A lista vive
   em user_metadata.artigos (os mais recentes primeiro) e é escrita
   com o service role, sem mexer no resto dos metadados.
   ============================================================ */

export const dynamic = "force-dynamic";

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

export async function GET() {
  const user = await utilizadorActual();
  if (!user) return erro("Sessão necessária.", 401);
  return NextResponse.json({ slugs: artigosDe(user.user_metadata) });
}

export async function POST(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Entre na sua conta para guardar artigos.", 401);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const slug = typeof corpo.slug === "string" ? corpo.slug.trim() : "";
  if (!SLUG.test(slug)) return erro("Artigo desconhecido.");
  if (typeof corpo.guardar !== "boolean") return erro("Diga se quer guardar ou retirar o artigo.");
  const guardar = corpo.guardar;

  let slugs = artigosDe(user.user_metadata);
  // Pedido repetido (dois separadores, duplo clique): nada a escrever.
  if (guardar === slugs.includes(slug)) return NextResponse.json({ slugs });

  if (guardar) {
    const noticias = await lerNoticias();
    if (!noticias.some((n) => n.slug === slug)) return erro("Este artigo já não está publicado.", 404);
    // Cheia: liberta primeiro o lugar dos artigos que entretanto saíram do site.
    if (slugs.length >= MAXIMO_ARTIGOS) {
      const vivos = new Set(noticias.map((n) => n.slug));
      slugs = slugs.filter((s) => vivos.has(s));
      if (slugs.length >= MAXIMO_ARTIGOS) {
        return erro(`Já tem ${MAXIMO_ARTIGOS} artigos guardados. Remova alguns para guardar este.`, 409);
      }
    }
    slugs = [slug, ...slugs];
  } else {
    slugs = slugs.filter((s) => s !== slug);
  }

  const db = supabaseAdmin();
  if (!db) return erro("Base de dados indisponível.", 503);
  const { error } = await db.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, artigos: slugs },
  });
  if (error) {
    console.error("[conta/artigos]", error.message);
    return erro(guardar ? "Não foi possível guardar o artigo. Tente de novo." : "Não foi possível retirar o artigo. Tente de novo.", 500);
  }
  return NextResponse.json({ slugs });
}
