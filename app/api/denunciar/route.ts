import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual } from "@/lib/conta/sessao";
import { MOTIVOS_DENUNCIA } from "@/lib/denuncias";
import { avisarEquipa, emailDoModelo, lerConfigEmails, urlSite } from "@/lib/email";

/* ============================================================
   MOTOBOX — Denúncias feitas pelos visitantes
   Um anúncio ou um tópico do fórum pode ser denunciado por
   qualquer pessoa. A denúncia entra em Moderação no painel,
   onde a equipa vê o conteúdo e decide o que fazer, e segue um
   email para a equipa (Definições → Emails: denúncias de anúncios
   ou do fórum). Com sessão, "responder para" é quem denunciou.
   O título do alvo lê-se da base de dados: nunca se confia no
   que o navegador diz sobre o que está a ser denunciado.
   ============================================================ */

export const dynamic = "force-dynamic";

const ALVOS = {
  marketplace: { tabela: "anuncios", chave: "id", titulo: "titulo", nome: "anúncio", pagina: "/marketplace/", destino: "denunciasMarketplace" },
  forum: { tabela: "topicos", chave: "id", titulo: "titulo", nome: "tópico do fórum", pagina: "/forum/", destino: "moderacao" },
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
  const motivo = typeof corpo.motivo === "string" ? corpo.motivo : "";
  const detalhe = typeof corpo.detalhe === "string" ? corpo.detalhe.trim().slice(0, 1000) : "";

  if (!(tipo in ALVOS)) return erro("Tipo de denúncia desconhecido.");
  if (!/^[\w-]{1,64}$/.test(alvoId)) return erro("Conteúdo desconhecido.");
  if (!(MOTIVOS_DENUNCIA as readonly string[]).includes(motivo)) return erro("Escolha o motivo da denúncia.");
  if (motivo === "Outro motivo" && detalhe.length < 5) return erro("Explique em poucas palavras o que se passa.");

  const db = supabaseAdmin();
  if (!db) return erro("De momento não é possível enviar denúncias. Tente mais tarde.", 503);

  const alvo = ALVOS[tipo];
  const { data: registo, error: erroAlvo } = await db
    .from(alvo.tabela).select(alvo.titulo).eq(alvo.chave, alvoId).maybeSingle();
  if (erroAlvo) return erro("Não foi possível confirmar o conteúdo. Tente mais tarde.", 500);
  if (!registo) return erro("Este conteúdo já não existe.", 404);

  const user = await utilizadorActual();
  const nome = typeof user?.user_metadata?.nome === "string" ? user.user_metadata.nome.trim() : "";
  const denunciante = user ? `${nome || "Utilizador"} (${user.email})` : "Visitante sem sessão";

  const alvoTitulo = String((registo as Record<string, unknown>)[alvo.titulo] ?? "");
  const { error } = await db.from("denuncias").insert({
    id: `d-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    tipo,
    alvo_id: alvoId,
    alvo_titulo: alvoTitulo,
    motivo,
    detalhe: detalhe || "Sem mais detalhes.",
    denunciante,
    estado: "pendente",
  });
  if (error) return erro("Não foi possível registar a denúncia. Tente mais tarde.", 500);

  // A denúncia já está em Moderação: o email é um aviso a mais, e uma falha não a desfaz.
  const cfg = await lerConfigEmails();
  const base = urlSite();
  const aviso = emailDoModelo(cfg, "denuncia", { alvo: alvoTitulo || alvoId, tipo: alvo.nome, motivo }, {
    url: `${base}/admin/moderacao`,
    detalhes: [
      ["Conteúdo", alvoTitulo || alvoId],
      ["Endereço", `${base}${alvo.pagina}${encodeURIComponent(alvoId)}`],
      ["Motivo", motivo],
      ["Detalhe", detalhe || "Sem mais detalhes."],
      ["Quem denunciou", denunciante],
    ],
  });
  const falha = await avisarEquipa(cfg, alvo.destino, {
    ...aviso, responderPara: user?.email || null, tipo: "denuncia",
  });
  if (falha) console.error(`[denunciar] aviso à equipa não seguiu: ${falha}`);

  return NextResponse.json({ ok: true, equipaAvisada: !falha }, { status: 201 });
}
