import { NextResponse, after, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual, perfilDe } from "@/lib/conta/sessao";
import {
  avatarDaConta, corValida, respostaDaLinha, tabelaEmFalta, COLUNAS_PUBLICAS,
} from "@/lib/forum/respostas";
import { COR_PADRAO, RESPOSTA_MAX, RESPOSTA_MIN } from "@/lib/forum/tipos";
import { notificarRespostaForum } from "@/lib/notificacoes";

/* ============================================================
   MOTOBOX — Responder a um tópico do fórum
   Só com sessão, com a conta activa, o fórum aberto e o tópico
   publicado e não fechado. O nome, a cor e o logótipo vêm da
   conta: nunca do que o navegador diz sobre quem escreve.
   Depois de guardar, o tópico conta mais uma resposta e passa
   a mostrar quem respondeu por último, e quem já tinha respondido
   no tópico (com os avisos do fórum ligados) recebe um email.
   ============================================================ */

export const dynamic = "force-dynamic";

const SEM_TABELA = "As respostas do fórum ficam disponíveis depois de a base de dados ser actualizada.";

/** Travão para quem responde em rajada: no máximo 8 respostas em 10 minutos. */
const JANELA_MS = 10 * 60 * 1000;
const MAXIMO_NA_JANELA = 8;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/** Para comparar o email com `ilike` sem que "_" ou "%" funcionem como curingas. */
const literal = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function POST(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Entre na sua conta para responder.", 401);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const topicoId = typeof corpo.topicoId === "string" ? corpo.topicoId.trim() : "";
  // Mudanças de linha uniformes e sem mais de uma linha em branco seguida.
  const texto = typeof corpo.corpo === "string"
    ? corpo.corpo.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : "";

  if (!/^[\w-]{1,64}$/.test(topicoId)) return erro("Tópico desconhecido.");
  if (texto.length < RESPOSTA_MIN) return erro("Escreva a sua resposta antes de publicar.");
  if (texto.length > RESPOSTA_MAX) return erro(`A resposta pode ter no máximo ${RESPOSTA_MAX} caracteres.`);

  const db = supabaseAdmin();
  if (!db) return erro("De momento não é possível responder. Tente mais tarde.", 503);

  /* ---------- A conta pode escrever? ---------- */
  // A linha procura-se pela conta e também pelo email: uma suspensão feita no
  // painel antes de a conta estar ligada continua a valer.
  const email = (user.email ?? "").trim().toLowerCase();
  const [perfil, porEmail] = await Promise.all([
    perfilDe(user),
    email
      ? db.from("utilizadores").select("estado").ilike("email", literal(email)).limit(5)
      : Promise.resolve({ data: [] as { estado: string }[] }),
  ]);
  const estados = [perfil?.estado, ...((porEmail.data ?? []) as { estado: string }[]).map((l) => l.estado)];
  if (estados.some((e) => e === "suspenso" || e === "banido")) {
    return erro("A sua conta não pode publicar no fórum. Contacte a Motobox.", 403);
  }

  /* ---------- O fórum e o tópico aceitam respostas? ---------- */
  const [{ data: def }, { data: topico, error: erroTopico }] = await Promise.all([
    db.from("definicoes").select("forum_aberto").eq("id", 1).maybeSingle(),
    db.from("topicos").select("id, titulo, publicado, bloqueado, respostas").eq("id", topicoId).maybeSingle(),
  ]);
  if (def && def.forum_aberto === false) return erro("O fórum está fechado de momento.", 403);
  if (erroTopico) return erro("Não foi possível confirmar o tópico. Tente mais tarde.", 500);
  if (!topico || topico.publicado === false) return erro("Este tópico já não existe.", 404);
  if (topico.bloqueado) return erro("Este tópico está fechado e não aceita novas respostas.", 403);

  /* ---------- Respostas recentes da mesma pessoa ---------- */
  // Também é aqui que se percebe se a migração já correu.
  const desde = new Date(Date.now() - JANELA_MS).toISOString();
  const { data: recentes, error: erroRecentes } = await db
    .from("respostas_forum").select("corpo")
    .eq("autor_id", user.id).gte("criado_em", desde)
    .limit(MAXIMO_NA_JANELA);
  if (erroRecentes) {
    if (tabelaEmFalta(erroRecentes)) return erro(SEM_TABELA, 503);
    console.error("[forum/responder]", erroRecentes.message);
    return erro("Não foi possível publicar a resposta. Tente de novo.", 500);
  }
  // Um duplo clique, ou a mesma resposta enviada de dois separadores.
  if ((recentes ?? []).some((r) => r.corpo === texto)) return erro("Esta resposta já foi publicada.", 409);
  if ((recentes ?? []).length >= MAXIMO_NA_JANELA) {
    return erro("Está a responder muito depressa. Aguarde uns minutos e tente de novo.", 429);
  }

  /* ---------- Guardar ---------- */
  const nomeMeta = typeof user.user_metadata?.nome === "string" ? user.user_metadata.nome.trim() : "";
  const nome = (perfil?.nome?.trim() || nomeMeta || "Membro Motobox").slice(0, 80);
  const cor = corValida(perfil?.avatar_cor) ?? corValida(user.user_metadata?.avatarCor) ?? COR_PADRAO;

  const { data: criada, error: erroGuardar } = await db
    .from("respostas_forum")
    .insert({
      id: `r-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      topico_id: topicoId,
      autor_id: user.id,
      autor_nome: nome,
      autor_cor: cor,
      autor_avatar: avatarDaConta(user),
      corpo: texto,
      publicado: true,
    })
    .select(COLUNAS_PUBLICAS)
    .single();
  if (erroGuardar || !criada) {
    if (tabelaEmFalta(erroGuardar)) return erro(SEM_TABELA, 503);
    console.error("[forum/responder]", erroGuardar?.message);
    return erro("Não foi possível publicar a resposta. Tente de novo.", 500);
  }
  const resposta = respostaDaLinha(criada as Record<string, unknown>);

  /* ---------- Contagem e última resposta do tópico ---------- */
  // Só actualiza se ninguém mexeu na contagem entretanto; senão relê e repete.
  // A lista do fórum mostra `quando` tal como está, por isso vai por extenso
  // ("27 de setembro"); `em` guarda o instante exacto.
  const instante = new Date(resposta.criadoEm || Date.now());
  const ultima = {
    autor: nome,
    quando: instante.toLocaleDateString("pt-PT", { day: "numeric", month: "long", timeZone: "Africa/Luanda" }),
    em: instante.toISOString(),
  };
  let contagem = Number(topico.respostas) || 0;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const { data: feito, error } = await db
      .from("topicos")
      .update({ respostas: contagem + 1, ultima_resposta: ultima })
      .eq("id", topicoId).eq("respostas", contagem)
      .select("id");
    if (error) { console.error("[forum/responder] contagem:", error.message); break; }
    if (feito?.length) break;
    const { data: actual } = await db.from("topicos").select("respostas").eq("id", topicoId).maybeSingle();
    contagem = Number(actual?.respostas) || 0;
  }

  try {
    revalidatePath(`/forum/${topicoId}`);
    revalidatePath("/forum");
  } catch { /* fora de contexto */ }

  // Depois de responder ao navegador: avisa quem participa no tópico.
  after(() => notificarRespostaForum({
    topicoId, topicoTitulo: String(topico.titulo ?? "Tópico do fórum"), autorId: user.id, autorNome: nome, texto,
  }));

  return NextResponse.json({ resposta }, { status: 201 });
}
