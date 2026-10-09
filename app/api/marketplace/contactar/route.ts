import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilizadorActual, perfilDe, type PerfilConta } from "@/lib/conta/sessao";
import { ID_ANUNCIO } from "@/lib/conta/favoritos";
import { avisarEquipa, emailDoModelo, enviarEmail, lerConfigEmails, urlSite } from "@/lib/email";

/* ============================================================
   MOTOBOX — Contactar o vendedor de um anúncio
   Só com sessão. O anúncio lê-se da base (publicado), nunca do
   que o navegador diz. Um vendedor com conta recebe a mensagem
   por email, com "responder para" o email de quem escreveu: o
   email do vendedor nunca chega ao comprador. Sem conta ligada
   (anúncios da equipa ou de demonstração), ou se o email não
   seguir, a mensagem entra em Mensagens no painel e segue por
   email para a equipa (Definições → Emails → Mensagens para
   vendedores sem conta), que a encaminha.
   ============================================================ */

export const dynamic = "force-dynamic";

const MINIMO = 10;
const MAXIMO = 2000;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/** Nome a mostrar ao vendedor: o do perfil, o da conta ou o início do email. */
function nomeDe(user: User, perfil: PerfilConta | null): string {
  const meta = typeof user.user_metadata?.nome === "string" ? user.user_metadata.nome.trim() : "";
  return (perfil?.nome?.trim() || meta || (user.email ?? "").split("@")[0] || "Um membro da MotoBox").slice(0, 80);
}

export async function POST(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Entre na sua conta para contactar o vendedor.", 401);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const anuncioId = typeof corpo.anuncioId === "string" ? corpo.anuncioId.trim() : "";
  const mensagem = typeof corpo.mensagem === "string"
    ? corpo.mensagem.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : "";
  if (!ID_ANUNCIO.test(anuncioId)) return erro("Anúncio desconhecido.");
  if (mensagem.length < MINIMO) return erro(`Escreva a sua mensagem (mín. ${MINIMO} caracteres).`);
  if (mensagem.length > MAXIMO) return erro(`A mensagem é demasiado longa (máx. ${MAXIMO} caracteres).`);

  const email = (user.email ?? "").toLowerCase();
  if (!email) return erro("A sua conta não tem email associado. Fale com a equipa MotoBox.");

  const db = supabaseAdmin();
  if (!db) return erro("De momento não é possível enviar mensagens. Tente mais tarde.", 503);

  const perfil = await perfilDe(user);
  if (perfil && ["suspenso", "banido"].includes(perfil.estado)) {
    return erro("A sua conta não pode contactar vendedores. Fale com a equipa MotoBox.", 403);
  }

  const { data: anuncio, error: erroAnuncio } = await db
    .from("anuncios").select("id, titulo, vendedor").eq("id", anuncioId).eq("publicado", true).maybeSingle();
  if (erroAnuncio) return erro("Não foi possível confirmar o anúncio. Tente mais tarde.", 500);
  if (!anuncio) return erro("Este anúncio já não está disponível.", 404);

  const vendedor = (anuncio.vendedor ?? {}) as { nome?: string; authId?: string };
  if (vendedor.authId && vendedor.authId === user.id) {
    return erro("Este anúncio é seu: não pode enviar-lhe mensagens.");
  }

  const titulo = String(anuncio.titulo ?? "Anúncio").replace(/\s+/g, " ").trim();
  const nome = nomeDe(user, perfil);
  const ligacao = `${urlSite()}/marketplace/${encodeURIComponent(anuncioId)}`;
  const cfg = await lerConfigEmails();
  const citacao = { rotulo: `Mensagem de ${nome} (${email}):`, texto: mensagem };

  /* ---------- Vendedor com conta: email directo ---------- */
  let falhaEmail: string | null = null;
  if (vendedor.authId) {
    const { data: conta } = await db.auth.admin.getUserById(vendedor.authId);
    const para = conta?.user?.email;
    if (para) {
      const corpoEmail = emailDoModelo(cfg, "vendedor", { comprador: nome, anuncio: titulo }, {
        url: ligacao, citacao, detalhes: [["Anúncio", titulo]],
      });
      const r = await enviarEmail({ para, ...corpoEmail, responderPara: email, tipo: "vendedor" }, cfg);
      if (r.ok) return NextResponse.json({ ok: true, via: "email" }, { status: 201 });
      falhaEmail = r.erro;
      console.error(`[marketplace/contactar] Email ao vendedor do anúncio ${anuncioId} falhou: ${falhaEmail}`);
    } else {
      falhaEmail = "A conta do vendedor já não existe ou não tem email.";
    }
  }

  /* ---------- Sem conta ligada, ou o email falhou: a equipa encaminha ---------- */
  const nota = falhaEmail
    ? ["", `Nota: o email ao vendedor (${vendedor.nome ?? "com conta"}) não seguiu: ${falhaEmail} Encaminhe esta mensagem.`]
    : [];
  const { error } = await db.from("mensagens").insert({
    id: `m-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    nome,
    email,
    telefone: null,
    assunto: `Interesse no anúncio: ${titulo}`.slice(0, 200),
    mensagem: [mensagem, "", `Anúncio: ${titulo}`, ligacao, `Vendedor: ${vendedor.nome ?? "sem nome"}`, ...nota].join("\n"),
  });
  if (error) console.error("[marketplace/contactar]", error.message);

  const paraEquipa = emailDoModelo(cfg, "marketplaceEquipa", { comprador: nome, anuncio: titulo, vendedor: vendedor.nome ?? "sem nome" }, {
    url: ligacao,
    citacao,
    detalhes: [
      ["Anúncio", titulo],
      ["Vendedor", vendedor.nome ?? "sem nome"],
      ...(falhaEmail ? [["Porque chega aqui", `O email ao vendedor não seguiu: ${falhaEmail}`] as [string, string]] : []),
    ],
  });
  const falhaEquipa = await avisarEquipa(cfg, "marketplace", { ...paraEquipa, responderPara: email, tipo: "marketplaceEquipa" });
  if (falhaEquipa) console.error(`[marketplace/contactar] aviso à equipa não seguiu: ${falhaEquipa}`);

  // Só falha quando a mensagem não ficou guardada nem seguiu por email.
  if (error && falhaEquipa) {
    return erro("Não foi possível enviar a mensagem. Tente de novo dentro de momentos.", 502);
  }

  return NextResponse.json({ ok: true, via: "equipa" }, { status: 201 });
}
