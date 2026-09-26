import { NextResponse, after, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { paraBase, daBase } from "@/lib/supabase/mapeamento";
import { utilizadorActual, perfilDe } from "@/lib/conta/sessao";
import { notificarNovoAnuncio } from "@/lib/notificacoes";
import type { AnuncioMarketplace } from "@/lib/types";

/* ============================================================
   MOTOBOX — Anúncios publicados pelos utilizadores
   POST publica um anúncio em nome de quem tem sessão; PATCH e
   DELETE só actuam sobre anúncios dessa pessoa (vendedor.authId).
   Os campos aceites são uma lista fechada: o vendedor, as
   visualizações e a data são sempre definidos aqui.
   ============================================================ */

export const dynamic = "force-dynamic";

const CATEGORIAS = ["Motas", "Peças", "Equipamento", "Acessórios"];
const ESTADOS = ["Nova", "Como nova", "Muito bom", "Bom", "Para peças"];
const PROVINCIAS = [
  "Luanda", "Benguela", "Huíla", "Huambo", "Namibe",
  "Cabinda", "Malanje", "Bengo", "Cuanza Sul",
];
const MAXIMO_ACTIVOS = 20;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/** Valida e limpa os campos enviados pelo formulário. */
function campos(c: Record<string, unknown>): Partial<AnuncioMarketplace> | string {
  const titulo = typeof c.titulo === "string" ? c.titulo.trim() : "";
  if (titulo.length < 5 || titulo.length > 90) return "O título tem de ter entre 5 e 90 caracteres.";
  const preco = Number(c.preco);
  if (!Number.isFinite(preco) || preco < 0 || preco > 1_000_000_000) return "Preço inválido.";
  const categoria = String(c.categoria ?? "");
  if (!CATEGORIAS.includes(categoria)) return "Escolha uma categoria.";
  const estado = String(c.estado ?? "");
  if (!ESTADOS.includes(estado)) return "Escolha o estado do artigo.";
  const provincia = String(c.provincia ?? "");
  if (!PROVINCIAS.includes(provincia)) return "Escolha a província.";
  const descricao = typeof c.descricao === "string" ? c.descricao.trim() : "";
  if (descricao.length < 20 || descricao.length > 3000) return "A descrição tem de ter entre 20 e 3000 caracteres.";
  const marca = typeof c.marca === "string" ? c.marca.trim().slice(0, 40) : "";
  const modelo = typeof c.modelo === "string" ? c.modelo.trim().slice(0, 60) : "";
  const ano = Number(c.ano);
  const km = Number(c.quilometragem);

  return {
    titulo, preco: Math.round(preco), categoria: categoria as AnuncioMarketplace["categoria"],
    estado: estado as AnuncioMarketplace["estado"], provincia: provincia as AnuncioMarketplace["provincia"],
    descricao, marca, negociavel: Boolean(c.negociavel),
    ...(modelo ? { modelo } : {}),
    ...(Number.isInteger(ano) && ano > 1950 && ano <= new Date().getFullYear() + 1 ? { ano } : {}),
    ...(Number.isFinite(km) && km > 0 ? { quilometragem: Math.round(km) } : {}),
  };
}

async function contexto() {
  const user = await utilizadorActual();
  if (!user) return { falha: erro("Sessão necessária.", 401) };
  const db = supabaseAdmin();
  if (!db) return { falha: erro("Base de dados indisponível.", 503) };
  const perfil = await perfilDe(user);
  if (!perfil) return { falha: erro("Perfil não encontrado.", 404) };
  if (["suspenso", "banido"].includes(perfil.estado)) {
    return { falha: erro("A sua conta não pode publicar anúncios. Contacte a Motobox.", 403) };
  }
  return { user, db, perfil };
}

/** O anúncio existe e pertence a quem tem sessão? */
async function meu(db: NonNullable<ReturnType<typeof supabaseAdmin>>, id: string, authId: string) {
  const { data } = await db.from("anuncios").select("id, vendedor").eq("id", id).maybeSingle();
  return data && (data.vendedor as { authId?: string })?.authId === authId ? data : null;
}

export async function POST(req: NextRequest) {
  const c = await contexto();
  if ("falha" in c) return c.falha;
  const { user, db, perfil } = c;

  const { data: def } = await db.from("definicoes").select("marketplace_aberto").eq("id", 1).maybeSingle();
  if (def && def.marketplace_aberto === false) return erro("O marketplace está fechado de momento.", 403);

  const { count } = await db.from("anuncios").select("id", { count: "exact", head: true })
    .eq("vendedor->>authId", user.id);
  if ((count ?? 0) >= MAXIMO_ACTIVOS) return erro(`Pode ter no máximo ${MAXIMO_ACTIVOS} anúncios activos.`, 429);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }
  const limpos = campos(corpo);
  if (typeof limpos === "string") return erro(limpos);

  const anuncio: AnuncioMarketplace = {
    id: `mkt-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    ...(limpos as Omit<AnuncioMarketplace, "id" | "imagens" | "vendedor" | "publicado" | "visualizacoes">),
    imagens: [],
    vendedor: {
      nome: perfil.nome, verificado: perfil.verificado,
      desde: Number(perfil.registado.slice(0, 4)) || new Date().getFullYear(),
      anuncios: (count ?? 0) + 1, avaliacao: 5, authId: user.id,
    },
    publicado: new Date().toISOString().slice(0, 10),
    visualizacoes: 0,
  };

  const { data, error } = await db.from("anuncios")
    .insert(paraBase("anuncios", anuncio as unknown as Record<string, unknown>))
    .select().single();
  if (error) return erro(error.message, 500);

  try { revalidatePath("/", "layout"); } catch { /* fora de contexto */ }
  // Avisa quem segue a marca, depois de responder.
  after(() => notificarNovoAnuncio(anuncio));
  return NextResponse.json({ dados: daBase<AnuncioMarketplace>("anuncios", data) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const c = await contexto();
  if ("falha" in c) return c.falha;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!(await meu(c.db, id, c.user.id))) return erro("Anúncio não encontrado.", 404);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }
  const limpos = campos(corpo);
  if (typeof limpos === "string") return erro(limpos);

  const { data, error } = await c.db.from("anuncios")
    .update(paraBase("anuncios", limpos as Record<string, unknown>))
    .eq("id", id).select().single();
  if (error) return erro(error.message, 500);

  try { revalidatePath("/", "layout"); } catch { /* fora de contexto */ }
  return NextResponse.json({ dados: daBase<AnuncioMarketplace>("anuncios", data) });
}

/** "Terminar" um anúncio: sai do marketplace de vez. */
export async function DELETE(req: NextRequest) {
  const c = await contexto();
  if ("falha" in c) return c.falha;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!(await meu(c.db, id, c.user.id))) return erro("Anúncio não encontrado.", 404);

  const { error } = await c.db.from("anuncios").delete().eq("id", id);
  if (error) return erro(error.message, 500);

  try { revalidatePath("/", "layout"); } catch { /* fora de contexto */ }
  return NextResponse.json({ ok: true });
}
