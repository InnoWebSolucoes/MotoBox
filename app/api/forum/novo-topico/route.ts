import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual } from "@/lib/conta/sessao";
import { autorDaConta } from "@/lib/forum/autor";
import { ajustarCategoria } from "@/lib/forum/contagens";
import {
  TOPICO_TEXTO_MAX, TOPICO_TEXTO_MIN, TOPICO_TITULO_MAX, TOPICO_TITULO_MIN,
} from "@/lib/forum/tipos";

/* ============================================================
   MOTOBOX — Abrir um tópico no fórum
   Só com sessão, com a conta activa e o fórum aberto. O tópico
   fica publicado logo: a moderação faz-se depois, pelas
   denúncias e pelo painel. O nome, a cor e as iniciais vêm da
   conta, como nas respostas.
   A mensagem de abertura guarda-se em `excerto`, o campo que a
   lista do fórum e a página do tópico já mostram. A categoria
   passa a contar mais um tópico e mais uma mensagem.
   ============================================================ */

export const dynamic = "force-dynamic";

const SEM_COLUNA = "Abrir tópicos fica disponível depois de a base de dados ser actualizada.";

/** Travão para quem abre tópicos em rajada: no máximo 3 por hora. */
const JANELA_MS = 60 * 60 * 1000;
const MAXIMO_NA_JANELA = 3;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/** Antes da migração de 03/10, `topicos` ainda não tem a coluna `autor_id`. */
function colunaEmFalta(e: { code?: string } | null | undefined): boolean {
  return e?.code === "42703" || e?.code === "PGRST204";
}

/** Iniciais para o círculo do autor, como nos tópicos de partida ("Bino_MX" → "BM"). */
function iniciais(nome: string): string {
  const partes = nome.split(/[\s_.-]+/).filter(Boolean).map((p) => Array.from(p));
  const letras = partes.length > 1
    ? `${partes[0][0]}${partes[1][0]}`
    : (partes[0] ?? []).slice(0, 2).join("");
  return (letras || "M").toUpperCase();
}

/** O dia de hoje em Luanda, no formato da coluna `criado` (AAAA-MM-DD). */
const hojeEmLuanda = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Luanda", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());

export async function POST(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Entre na sua conta para abrir um tópico.", 401);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  // O título numa linha só; a mensagem com as mudanças de linha uniformes
  // e sem mais de uma linha em branco seguida, como nas respostas.
  const titulo = typeof corpo.titulo === "string" ? corpo.titulo.replace(/\s+/g, " ").trim() : "";
  const categoriaSlug = typeof corpo.categoria === "string" ? corpo.categoria.trim() : "";
  const texto = typeof corpo.corpo === "string"
    ? corpo.corpo.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : "";

  if (titulo.length < TOPICO_TITULO_MIN) return erro(`O título precisa de pelo menos ${TOPICO_TITULO_MIN} caracteres.`);
  if (titulo.length > TOPICO_TITULO_MAX) return erro(`O título pode ter no máximo ${TOPICO_TITULO_MAX} caracteres.`);
  if (!/^[\w-]{1,64}$/.test(categoriaSlug)) return erro("Escolha a categoria do tópico.");
  if (texto.length < TOPICO_TEXTO_MIN) return erro(`Escreva a mensagem de abertura, com pelo menos ${TOPICO_TEXTO_MIN} caracteres.`);
  if (texto.length > TOPICO_TEXTO_MAX) return erro(`A mensagem pode ter no máximo ${TOPICO_TEXTO_MAX} caracteres.`);

  const db = supabaseAdmin();
  if (!db) return erro("De momento não é possível abrir tópicos. Tente mais tarde.", 503);

  /* ---------- A conta pode escrever? ---------- */
  const autor = await autorDaConta(db, user);
  if (autor.bloqueada) return erro("A sua conta não pode publicar no fórum. Contacte a Motobox.", 403);

  /* ---------- O fórum está aberto e a categoria existe? ---------- */
  const [{ data: def }, { data: categoria, error: erroCategoria }] = await Promise.all([
    db.from("definicoes").select("forum_aberto").eq("id", 1).maybeSingle(),
    db.from("categorias_forum").select("slug, nome").eq("slug", categoriaSlug).maybeSingle(),
  ]);
  if (def && def.forum_aberto === false) return erro("O fórum está fechado de momento.", 403);
  if (erroCategoria) return erro("Não foi possível confirmar a categoria. Tente mais tarde.", 500);
  if (!categoria) return erro("Escolha a categoria do tópico.");

  /* ---------- Tópicos recentes da mesma pessoa ---------- */
  // Também é aqui que se percebe se a migração já correu.
  const desde = new Date(Date.now() - JANELA_MS).toISOString();
  const { data: recentes, error: erroRecentes } = await db
    .from("topicos").select("titulo")
    .eq("autor_id", user.id).gte("criado_em", desde)
    .limit(MAXIMO_NA_JANELA);
  if (erroRecentes) {
    if (colunaEmFalta(erroRecentes)) return erro(SEM_COLUNA, 503);
    console.error("[forum/novo-topico]", erroRecentes.message);
    return erro("Não foi possível publicar o tópico. Tente de novo.", 500);
  }
  // Um duplo clique, ou o mesmo tópico enviado de dois separadores.
  const mesmoTitulo = titulo.toLocaleLowerCase("pt-PT");
  if ((recentes ?? []).some((t) => String(t.titulo).toLocaleLowerCase("pt-PT") === mesmoTitulo)) {
    return erro("Este tópico já foi publicado.", 409);
  }
  if ((recentes ?? []).length >= MAXIMO_NA_JANELA) {
    return erro("Já abriu vários tópicos na última hora. Aguarde um pouco e tente de novo.", 429);
  }

  /* ---------- Guardar ---------- */
  const id = `t-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const { error: erroGuardar } = await db.from("topicos").insert({
    id,
    titulo,
    categoria: categoria.nome,
    categoria_slug: categoria.slug,
    autor: autor.nome,
    autor_avatar: iniciais(autor.nome),
    avatar_cor: autor.cor,
    autor_id: user.id,
    criado: hojeEmLuanda(),
    respostas: 0,
    visualizacoes: 0,
    ultima_resposta: { autor: "", quando: "" },
    fixado: false,
    bloqueado: false,
    resolvido: false,
    excerto: texto,
    publicado: true,
  });
  if (erroGuardar) {
    if (colunaEmFalta(erroGuardar)) return erro(SEM_COLUNA, 503);
    console.error("[forum/novo-topico]", erroGuardar.message);
    return erro("Não foi possível publicar o tópico. Tente de novo.", 500);
  }

  /* ---------- Contadores da categoria ---------- */
  await ajustarCategoria(db, categoria.slug as string, { topicos: 1, mensagens: 1 });

  try {
    revalidatePath("/forum");
    revalidatePath(`/forum/${id}`);
  } catch { /* fora de contexto */ }

  return NextResponse.json({ id }, { status: 201 });
}
