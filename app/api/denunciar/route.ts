import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual } from "@/lib/conta/sessao";
import { MOTIVOS_DENUNCIA } from "@/lib/denuncias";

/* ============================================================
   MOTOBOX — Denúncias feitas pelos visitantes
   Um anúncio ou um tópico do fórum pode ser denunciado por
   qualquer pessoa. A denúncia entra em Moderação no painel,
   onde a equipa vê o conteúdo e decide o que fazer.
   O título do alvo lê-se da base de dados: nunca se confia no
   que o navegador diz sobre o que está a ser denunciado.
   No fórum, a denúncia pode apontar a uma resposta: o alvo
   continua a ser o tópico e `resposta_id` diz qual delas.
   ============================================================ */

export const dynamic = "force-dynamic";

const ALVOS = {
  marketplace: { tabela: "anuncios", chave: "id", titulo: "titulo" },
  forum: { tabela: "topicos", chave: "id", titulo: "titulo" },
} as const;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

export async function POST(req: NextRequest) {
  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  // Campo escondido: só um robô o preenche. Finge que correu bem.
  if (typeof corpo.site === "string" && corpo.site.trim()) return NextResponse.json({ ok: true });

  const tipo = corpo.tipo as keyof typeof ALVOS;
  const alvoId = typeof corpo.alvoId === "string" ? corpo.alvoId.trim() : "";
  const respostaId = typeof corpo.respostaId === "string" ? corpo.respostaId.trim() : "";
  const motivo = typeof corpo.motivo === "string" ? corpo.motivo : "";
  const detalhe = typeof corpo.detalhe === "string" ? corpo.detalhe.trim().slice(0, 1000) : "";

  if (!(tipo in ALVOS)) return erro("Tipo de denúncia desconhecido.");
  if (!/^[\w-]{1,64}$/.test(alvoId)) return erro("Conteúdo desconhecido.");
  if (respostaId && (tipo !== "forum" || !/^[\w-]{1,64}$/.test(respostaId))) return erro("Conteúdo desconhecido.");
  if (!(MOTIVOS_DENUNCIA as readonly string[]).includes(motivo)) return erro("Escolha o motivo da denúncia.");
  if (motivo === "Outro motivo" && detalhe.length < 5) return erro("Explique em poucas palavras o que se passa.");

  const db = supabaseAdmin();
  if (!db) return erro("De momento não é possível enviar denúncias. Tente mais tarde.", 503);

  const alvo = ALVOS[tipo];
  const { data: registo, error: erroAlvo } = await db
    .from(alvo.tabela).select(alvo.titulo).eq(alvo.chave, alvoId).maybeSingle();
  if (erroAlvo) return erro("Não foi possível confirmar o conteúdo. Tente mais tarde.", 500);
  if (!registo) return erro("Este conteúdo já não existe.", 404);

  let alvoTitulo = String((registo as Record<string, unknown>)[alvo.titulo] ?? "");
  if (respostaId) {
    // A resposta tem de ser deste tópico; o título diz de quem é, como nos comentários.
    const { data: resposta, error: erroResposta } = await db
      .from("respostas_forum").select("topico_id, autor_nome").eq("id", respostaId).maybeSingle();
    if (erroResposta) return erro("Não foi possível confirmar o conteúdo. Tente mais tarde.", 500);
    if (!resposta || resposta.topico_id !== alvoId) return erro("Este conteúdo já não existe.", 404);
    alvoTitulo = `Resposta de ${resposta.autor_nome} em «${alvoTitulo}»`;
  }

  const user = await utilizadorActual();
  const nome = typeof user?.user_metadata?.nome === "string" ? user.user_metadata.nome.trim() : "";
  const denunciante = user ? `${nome || "Utilizador"} (${user.email})` : "Visitante sem sessão";

  const linha: Record<string, unknown> = {
    id: `d-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    tipo,
    alvo_id: alvoId,
    alvo_titulo: alvoTitulo,
    motivo,
    detalhe: detalhe || "Sem mais detalhes.",
    denunciante,
    estado: "pendente",
  };
  let { error } = await db.from("denuncias").insert(respostaId ? { ...linha, resposta_id: respostaId } : linha);
  // Antes da migração de 03/10 não há `resposta_id`: a denúncia entra na mesma,
  // apontada ao tópico, e o título já diz de quem é a resposta.
  if ((error?.code === "PGRST204" || error?.code === "42703") && respostaId) {
    ({ error } = await db.from("denuncias").insert(linha));
  }
  if (error) return erro("Não foi possível registar a denúncia. Tente mais tarde.", 500);

  return NextResponse.json({ ok: true }, { status: 201 });
}
