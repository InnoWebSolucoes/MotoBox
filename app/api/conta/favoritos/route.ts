import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual } from "@/lib/conta/sessao";
import {
  favoritosDe, ID_ANUNCIO, MAXIMO_FAVORITOS, type AnuncioGuardado,
} from "@/lib/conta/favoritos";

/* ============================================================
   MOTOBOX — Anúncios guardados de quem tem sessão
   GET devolve os ids guardados; com ?anuncios=1 devolve também
   os anúncios publicados correspondentes, pela ordem em que
   foram guardados. POST { id, guardar } guarda ou retira um
   anúncio e devolve a lista actualizada. A lista vive em
   user_metadata.favoritos e é escrita com o service role, sem
   mexer no resto dos metadados.
   ============================================================ */

export const dynamic = "force-dynamic";

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

export async function GET(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Sessão necessária.", 401);

  const ids = favoritosDe(user.user_metadata);
  if (new URL(req.url).searchParams.get("anuncios") !== "1") return NextResponse.json({ ids });
  if (ids.length === 0) return NextResponse.json({ ids, anuncios: [] });

  const db = supabaseAdmin();
  if (!db) return erro("Base de dados indisponível.", 503);

  // Só os publicados: um anúncio retirado pelo vendedor ou pela equipa deixa de aparecer.
  const { data, error } = await db
    .from("anuncios")
    .select("id, titulo, preco, negociavel, imagens, categoria, estado, provincia, vendedor")
    .in("id", ids)
    .eq("publicado", true);
  if (error) return erro("Não foi possível ler os anúncios guardados. Tente de novo.", 500);

  const porId = new Map<string, AnuncioGuardado>();
  for (const l of data ?? []) {
    const imagens = Array.isArray(l.imagens) ? l.imagens : [];
    porId.set(String(l.id), {
      id: String(l.id),
      titulo: String(l.titulo ?? ""),
      preco: Number(l.preco) || 0,
      negociavel: Boolean(l.negociavel),
      imagem: typeof imagens[0] === "string" ? imagens[0] : "",
      categoria: String(l.categoria ?? ""),
      estado: String(l.estado ?? ""),
      provincia: String(l.provincia ?? ""),
      verificado: Boolean((l.vendedor as { verificado?: unknown } | null)?.verificado),
    });
  }

  const anuncios = ids.map((id) => porId.get(id)).filter((a): a is AnuncioGuardado => Boolean(a));
  return NextResponse.json({ ids, anuncios });
}

export async function POST(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Entre na sua conta para guardar anúncios.", 401);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const id = typeof corpo.id === "string" ? corpo.id.trim() : "";
  if (!ID_ANUNCIO.test(id)) return erro("Anúncio desconhecido.");
  if (typeof corpo.guardar !== "boolean") return erro("Diga se quer guardar ou retirar o anúncio.");
  const guardar = corpo.guardar;

  let ids = favoritosDe(user.user_metadata);
  // Pedido repetido (dois separadores, duplo clique): nada a escrever.
  if (guardar === ids.includes(id)) return NextResponse.json({ ids });

  const db = supabaseAdmin();
  if (!db) return erro("Base de dados indisponível.", 503);

  if (guardar) {
    const { data: anuncio, error } = await db
      .from("anuncios").select("id").eq("id", id).eq("publicado", true).maybeSingle();
    if (error) return erro("Não foi possível confirmar o anúncio. Tente de novo.", 500);
    if (!anuncio) return erro("Este anúncio já não está disponível.", 404);

    if (ids.length >= MAXIMO_FAVORITOS) {
      // Antes de recusar, liberta o lugar dos anúncios que entretanto foram apagados.
      const { data: existentes } = await db.from("anuncios").select("id").in("id", ids);
      const vivos = new Set((existentes ?? []).map((l) => String(l.id)));
      ids = ids.filter((x) => vivos.has(x));
      if (ids.length >= MAXIMO_FAVORITOS) {
        return erro(`Já tem ${MAXIMO_FAVORITOS} anúncios guardados. Remova alguns na sua conta para guardar este.`, 409);
      }
    }
    ids = [id, ...ids];
  } else {
    ids = ids.filter((x) => x !== id);
  }

  const { error } = await db.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, favoritos: ids },
  });
  if (error) {
    console.error("[conta/favoritos]", error.message);
    return erro(guardar ? "Não foi possível guardar o anúncio. Tente de novo." : "Não foi possível retirar o anúncio. Tente de novo.", 500);
  }

  return NextResponse.json({ ids });
}
