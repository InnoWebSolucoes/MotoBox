import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabaseAdminConfigurado } from "@/lib/supabase/server";
import {
  TABELA, CHAVE_TABELA, listaDaBase, paraBase,
  definicoesDaBase, definicoesParaBase,
} from "@/lib/supabase/mapeamento";
import type { ColeccaoNome } from "@/lib/admin/store";

/* ============================================================
   MOTOBOX — API de administração
   Toda a escrita passa por aqui. A chave de service role vive
   apenas no servidor; o navegador nunca lhe toca.

   TODO(auth): proteger estas rotas quando a autenticação
   estiver ligada. Enquanto não existir, qualquer pedido a
   /api/admin é aceite — ver README.
   ============================================================ */

export const dynamic = "force-dynamic";

const COLECCOES = new Set<string>([...Object.keys(TABELA), "definicoes"]);

/** Caminhos públicos a revalidar quando cada coleção muda. */
const REVALIDAR: Record<string, string[]> = {
  eventos: ["/", "/calendario", "/bilhetes"],
  corridas: ["/resultados", "/classificacao"],
  pilotos: ["/pilotos", "/classificacao"],
  equipas: ["/equipas", "/classificacao"],
  noticias: ["/", "/noticias"],
  videos: ["/", "/videos"],
  patrocinadores: ["/patrocinadores"],
  anuncios: ["/marketplace"],
  topicos: ["/forum"],
  paginasLegais: ["/termos", "/privacidade", "/cookies", "/regulamento"],
  definicoes: ["/"],
};

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

function semConfiguracao() {
  return NextResponse.json(
    { erro: "Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY." },
    { status: 503 },
  );
}

function revalidar(coleccao: string) {
  for (const caminho of REVALIDAR[coleccao] ?? []) {
    try { revalidatePath(caminho); } catch { /* fora de contexto de pedido */ }
  }
}

async function validar(params: Promise<{ coleccao: string }>) {
  const { coleccao } = await params;
  if (!COLECCOES.has(coleccao)) return { erro: erro(`Coleção desconhecida: ${coleccao}`, 404) };
  if (!supabaseAdminConfigurado) return { erro: semConfiguracao() };
  const db = supabaseAdmin();
  if (!db) return { erro: semConfiguracao() };
  return { coleccao: coleccao as ColeccaoNome, db };
}

/* ---------------- GET: listar ---------------- */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ coleccao: string }> },
) {
  const v = await validar(params);
  if ("erro" in v) return v.erro;
  const { coleccao, db } = v;

  if (coleccao === ("definicoes" as ColeccaoNome)) {
    const { data, error } = await db.from("definicoes").select("*").eq("id", 1).maybeSingle();
    if (error) return erro(error.message, 500);
    return NextResponse.json({ dados: data ? definicoesDaBase(data) : null });
  }

  const { data, error } = await db.from(TABELA[coleccao]).select("*");
  if (error) return erro(error.message, 500);
  return NextResponse.json({ dados: listaDaBase(coleccao, data) });
}

/* ---------------- POST: criar ---------------- */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ coleccao: string }> },
) {
  const v = await validar(params);
  if ("erro" in v) return v.erro;
  const { coleccao, db } = v;

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }

  const { data, error } = await db
    .from(TABELA[coleccao])
    .insert(paraBase(coleccao, corpo))
    .select()
    .single();

  if (error) return erro(error.message, 500);
  revalidar(coleccao);
  return NextResponse.json({ dados: data }, { status: 201 });
}

/* ---------------- PATCH: atualizar ---------------- */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ coleccao: string }> },
) {
  const v = await validar(params);
  if ("erro" in v) return v.erro;
  const { coleccao, db } = v;

  let corpo: { id?: string; campos?: Record<string, unknown> };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }

  // Definições: linha única, sem identificador
  if (coleccao === ("definicoes" as ColeccaoNome)) {
    const campos = corpo.campos ?? (corpo as unknown as Record<string, unknown>);
    const { error } = await db
      .from("definicoes")
      .update(definicoesParaBase(campos))
      .eq("id", 1);
    if (error) return erro(error.message, 500);
    revalidar("definicoes");
    return NextResponse.json({ ok: true });
  }

  if (!corpo.id) return erro("Falta o identificador do registo.");
  if (!corpo.campos) return erro("Faltam os campos a atualizar.");

  const { error } = await db
    .from(TABELA[coleccao])
    .update(paraBase(coleccao, corpo.campos))
    .eq(CHAVE_TABELA[coleccao], corpo.id);

  if (error) return erro(error.message, 500);
  revalidar(coleccao);
  return NextResponse.json({ ok: true });
}

/* ---------------- DELETE: remover ---------------- */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ coleccao: string }> },
) {
  const v = await validar(params);
  if ("erro" in v) return v.erro;
  const { coleccao, db } = v;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return erro("Falta o parâmetro `id`.");

  const { error } = await db
    .from(TABELA[coleccao])
    .delete()
    .eq(CHAVE_TABELA[coleccao], id);

  if (error) return erro(error.message, 500);
  revalidar(coleccao);
  return NextResponse.json({ ok: true });
}
