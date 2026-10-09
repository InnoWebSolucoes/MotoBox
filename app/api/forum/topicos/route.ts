import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual } from "@/lib/conta/sessao";
import { avatarDaConta, tabelaEmFalta } from "@/lib/forum/respostas";
import { lerDoc } from "@/lib/conteudo";
import { comPadrao, FORUM_PADRAO, type ConteudoForum } from "@/lib/conteudo/grupos/comunidade";
import {
  CORPO_MAX, CORPO_MIN, TITULO_MAX, TITULO_MIN, iniciaisDe, type MeuTopico,
} from "@/components/forum/tipos";
import { idAbertura } from "@/app/forum/_servidor/forum";
import { erro, identidade, verificarConta } from "../_comum";

/* ============================================================
   MOTOBOX — Tópicos abertos pelos membros

   POST { titulo, categoria, corpo }   abre um tópico
   GET                                 os tópicos de quem tem sessão

   Só com sessão, com a conta activa e o fórum aberto. O nome, a
   cor e o logótipo vêm da conta.

   Onde fica cada coisa (ver app/forum/_servidor/forum.ts):
   - a linha em `topicos`, com o resumo da mensagem em `excerto`;
   - a mensagem completa e a conta de quem abriu o tópico numa
     linha de `respostas_forum` com o id "op-<id do tópico>" (a
     mensagem de abertura). A página do tópico mostra-a como a
     mensagem original, não como resposta.
   Se a mensagem de abertura não se puder guardar, o tópico é
   apagado: nunca fica um tópico sem autor.

   Moderação (Gestão › Fórum › Página Fórum › Tópicos dos membros):
   com "Rever os tópicos antes de aparecerem" ligado, o tópico entra
   escondido (publicado = false) e a equipa mostra-o no painel.
   Travão: no máximo N tópicos por pessoa numa hora (3 por omissão).
   ============================================================ */

export const dynamic = "force-dynamic";

const SEM_TABELA = "Os tópicos dos membros ficam disponíveis depois de a base de dados ser actualizada.";

/** O resumo da lista: o início da mensagem, numa linha, cortado numa palavra. */
function resumo(texto: string, max = 280): string {
  const linha = texto.replace(/\s+/g, " ").trim();
  if (linha.length <= max) return linha;
  const corte = linha.slice(0, max);
  const espaco = corte.lastIndexOf(" ");
  return `${(espaco > max * 0.6 ? corte.slice(0, espaco) : corte).replace(/[\s.,;:!?-]+$/, "")}…`;
}

/** A data de hoje em Luanda (a coluna `criado` é só a data). */
const hojeLuanda = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Luanda" });

export async function POST(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Entre na sua conta para abrir um tópico.", 401);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const titulo = typeof corpo.titulo === "string" ? corpo.titulo.replace(/\s+/g, " ").trim() : "";
  const categoriaSlug = typeof corpo.categoria === "string" ? corpo.categoria.trim() : "";
  // Mudanças de linha uniformes e sem mais de uma linha em branco seguida.
  const texto = typeof corpo.corpo === "string"
    ? corpo.corpo.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : "";

  if (titulo.length < TITULO_MIN) return erro(`Escreva um título com pelo menos ${TITULO_MIN} caracteres.`, 400, { campo: "titulo" });
  if (titulo.length > TITULO_MAX) return erro(`O título pode ter no máximo ${TITULO_MAX} caracteres.`, 400, { campo: "titulo" });
  if (!/^[\w-]{1,64}$/.test(categoriaSlug)) return erro("Escolha a categoria do tópico.", 400, { campo: "categoria" });
  if (texto.length < CORPO_MIN) return erro("Conte um pouco mais na mensagem.", 400, { campo: "corpo" });
  if (texto.length > CORPO_MAX) return erro(`A mensagem pode ter no máximo ${CORPO_MAX} caracteres.`, 400, { campo: "corpo" });

  const db = supabaseAdmin();
  if (!db) return erro("De momento não é possível abrir tópicos. Tente mais tarde.", 503);

  /* ---------- A conta pode escrever? ---------- */
  const { perfil, bloqueada } = await verificarConta(db, user);
  if (bloqueada) return erro("A sua conta não pode publicar no fórum. Contacte a Motobox.", 403);

  /* ---------- O fórum está aberto e a categoria existe? ---------- */
  const [{ data: def }, { data: cat, error: erroCat }, textos] = await Promise.all([
    db.from("definicoes").select("forum_aberto").eq("id", 1).maybeSingle(),
    db.from("categorias_forum").select("slug, nome").eq("slug", categoriaSlug).maybeSingle(),
    lerDoc<ConteudoForum>("paginas.forum").then((d) => comPadrao(d, FORUM_PADRAO)),
  ]);
  if (def && def.forum_aberto === false) return erro("O fórum está fechado de momento.", 403);
  if (erroCat) return erro("Não foi possível confirmar a categoria. Tente mais tarde.", 500);
  if (!cat) return erro("Esta categoria já não existe. Escolha outra.", 400, { campo: "categoria" });

  /* ---------- Tópicos recentes da mesma pessoa ---------- */
  const porHora = Math.max(1, Math.min(50, Math.round(Number(textos.moderacao.topicosPorHora) || 3)));
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentes, error: erroRecentes } = await db
    .from("respostas_forum").select("corpo")
    .eq("autor_id", user.id).like("id", "op-%").gte("criado_em", desde)
    .limit(porHora + 1);
  if (erroRecentes) {
    if (tabelaEmFalta(erroRecentes)) return erro(SEM_TABELA, 503);
    console.error("[forum/topicos]", erroRecentes.message);
    return erro("Não foi possível abrir o tópico. Tente de novo.", 500);
  }
  // Um duplo clique, ou o mesmo tópico enviado de dois separadores.
  if ((recentes ?? []).some((r) => r.corpo === texto)) return erro("Este tópico já foi publicado.", 409);
  if ((recentes ?? []).length >= porHora) {
    return erro("Já abriu vários tópicos na última hora. Aguarde um pouco e tente de novo.", 429);
  }

  /* ---------- Guardar ---------- */
  const { nome, cor } = identidade(user, perfil);
  const id = `t-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const publicado = !textos.moderacao.aprovarTopicos;

  const { error: erroTopico } = await db.from("topicos").insert({
    id,
    titulo,
    categoria: String(cat.nome ?? ""),
    categoria_slug: categoriaSlug,
    autor: nome,
    autor_avatar: iniciaisDe(nome),
    avatar_cor: cor,
    criado: hojeLuanda(),
    respostas: 0,
    visualizacoes: 0,
    ultima_resposta: { autor: "", quando: "" },
    fixado: false,
    bloqueado: false,
    resolvido: false,
    excerto: resumo(texto),
    publicado,
  });
  if (erroTopico) {
    console.error("[forum/topicos]", erroTopico.message);
    return erro("Não foi possível abrir o tópico. Tente de novo.", 500);
  }

  const { error: erroAbertura } = await db.from("respostas_forum").insert({
    id: idAbertura(id),
    topico_id: id,
    autor_id: user.id,
    autor_nome: nome,
    autor_cor: cor,
    autor_avatar: avatarDaConta(user),
    corpo: texto,
    publicado: true,
  });
  if (erroAbertura) {
    // Sem a mensagem de abertura o tópico ficava sem autor e sem texto: sai.
    await db.from("topicos").delete().eq("id", id);
    if (tabelaEmFalta(erroAbertura)) return erro(SEM_TABELA, 503);
    console.error("[forum/topicos] abertura:", erroAbertura.message);
    return erro("Não foi possível abrir o tópico. Tente de novo.", 500);
  }

  try {
    revalidatePath("/forum");
    revalidatePath(`/forum/${id}`);
  } catch { /* fora de contexto */ }

  return NextResponse.json({ id, publicado }, { status: 201 });
}

/** Os tópicos abertos por quem tem sessão (os escondidos também), os mais recentes primeiro. */
export async function GET() {
  const user = await utilizadorActual();
  if (!user) return erro("Sessão necessária.", 401);
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ topicos: [] });

  const { data: aberturas, error } = await db
    .from("respostas_forum").select("topico_id")
    .eq("autor_id", user.id).like("id", "op-%")
    .order("criado_em", { ascending: false }).limit(50);
  if (error) {
    if (!tabelaEmFalta(error)) console.error("[forum/topicos]", error.message);
    return NextResponse.json({ topicos: [] });
  }
  const ids = (aberturas ?? []).map((l) => String(l.topico_id));
  if (ids.length === 0) return NextResponse.json({ topicos: [] });

  const { data: linhas } = await db.from("topicos").select("id, titulo, respostas, publicado").in("id", ids);
  const porId = new Map((linhas ?? []).map((l) => [String(l.id), l]));
  const topicos: MeuTopico[] = ids.flatMap((tid) => {
    const l = porId.get(tid);
    return l ? [{ id: tid, titulo: String(l.titulo ?? ""), respostas: Number(l.respostas) || 0, publicado: l.publicado !== false }] : [];
  });
  return NextResponse.json({ topicos }, { headers: { "Cache-Control": "private, no-store" } });
}
