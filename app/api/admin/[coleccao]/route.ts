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

   O acesso é verificado no middleware: só a equipa com papel
   adequado chega a estas rotas, e o papel de leitor não escreve.
   ============================================================ */

export const dynamic = "force-dynamic";

const COLECCOES = new Set<string>([...Object.keys(TABELA), "definicoes"]);

/**
 * Colunas que apontam para outra tabela. Um valor vazio vindo do
 * formulário ("sem equipa", "sem evento") tem de chegar como null,
 * senão a chave estrangeira rejeita a escrita.
 */
const LIGACOES = new Set(["equipa_slug", "evento_slug", "categoria_slug"]);

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/** Traduz os erros do Postgres para frases que a equipa entenda. */
function erroDaBase(e: { code?: string; message: string; details?: string | null }) {
  const m = e.message;
  if (e.code === "23505") return erro("Já existe um registo com este endereço (slug) ou email. Escolha outro.", 409);
  if (e.code === "23503") return erro("A ligação escolhida (equipa, evento ou categoria) já não existe. Escolha outra.", 409);
  if (e.code === "23502") {
    const coluna = /column "([^"]+)"/.exec(m)?.[1];
    return erro(coluna ? `Falta preencher o campo obrigatório: ${coluna}.` : "Falta preencher um campo obrigatório.", 400);
  }
  if (e.code === "22007" || e.code === "22008") return erro("Uma das datas é inválida.", 400);
  if (e.code === "22P02") return erro("Um dos valores tem o formato errado (número ou data).", 400);
  return erro(m, 500);
}

/** Prepara uma linha para escrita: ligações vazias passam a null. */
function linhaPara(coleccao: ColeccaoNome, item: Record<string, unknown>) {
  const linha = paraBase(coleccao, item);
  for (const col of LIGACOES) {
    if (linha[col] === "") linha[col] = null;
  }
  return linha;
}

/**
 * Executa uma escrita e, se a base de dados ainda não tiver uma
 * coluna que a app já conhece (PGRST204), repete sem esse campo em
 * vez de perder o registo inteiro.
 */
async function escrever<R extends { error: { code?: string; message: string } | null }>(
  linha: Record<string, unknown>,
  operacao: (linha: Record<string, unknown>) => PromiseLike<R>,
): Promise<R> {
  let atual = { ...linha };
  for (let i = 0; i < 5; i++) {
    const r = await operacao(atual);
    const coluna = r.error?.code === "PGRST204"
      ? /'([^']+)' column/.exec(r.error.message)?.[1]
      : undefined;
    if (!coluna || !(coluna in atual)) return r;
    console.warn(`[api/admin] coluna em falta na base de dados, ignorada: ${coluna}`);
    atual = { ...atual };
    delete atual[coluna];
  }
  return operacao(atual);
}

function semConfiguracao() {
  return NextResponse.json(
    { erro: "Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY." },
    { status: 503 },
  );
}

/**
 * Qualquer escrita pode aparecer em várias páginas (um piloto novo
 * entra na classificação, na página inicial e na sua ficha), por isso
 * revalida-se o site público inteiro. As páginas são geradas de novo
 * na visita seguinte.
 */
function revalidar() {
  try { revalidatePath("/", "layout"); } catch { /* fora de contexto de pedido */ }
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
  if (error) return erroDaBase(error);
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

  const { data, error } = await escrever(linhaPara(coleccao, corpo), (linha) =>
    db.from(TABELA[coleccao]).insert(linha).select().single(),
  );

  if (error) return erroDaBase(error);
  revalidar();
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
    if (error) return erroDaBase(error);
    revalidar();
    return NextResponse.json({ ok: true });
  }

  if (!corpo.id) return erro("Falta o identificador do registo.");
  if (!corpo.campos) return erro("Faltam os campos a atualizar.");

  const id = corpo.id;
  const { data, error } = await escrever(linhaPara(coleccao, corpo.campos), (linha) =>
    db.from(TABELA[coleccao]).update(linha).eq(CHAVE_TABELA[coleccao], id).select(CHAVE_TABELA[coleccao]),
  );

  if (error) return erroDaBase(error);
  if (!data || data.length === 0) {
    return erro("Este registo já não existe na base de dados. Recarregue a página.", 404);
  }
  revalidar();
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

  if (error) return erroDaBase(error);
  revalidar();
  return NextResponse.json({ ok: true });
}
