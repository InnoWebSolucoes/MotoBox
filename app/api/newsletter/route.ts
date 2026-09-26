import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { EMAIL_VALIDO, filtroEmail, normalizarEmail } from "@/lib/newsletter";

/* ============================================================
   MOTOBOX — Subscrição pública da newsletter
   POST { email, nome?, interesses?, origem, website? }

   Escreve na tabela `subscritores` com o service role (a chave
   anónima não escreve). Um email já activo responde "ok" sem
   mexer em nada; um email que tinha cancelado volta a ficar
   activo. `website` é uma armadilha para robôs: invisível para
   pessoas, preenchido por quem enche formulários às cegas.

   Os interesses escolhidos ainda não são guardados: a tabela
   não tem coluna para eles.
   ============================================================ */

export const dynamic = "force-dynamic";

/** Variante do componente → valor guardado em `origem`. */
const ORIGENS: Record<string, string> = {
  faixa: "faixa",
  cartao: "cartão",
  "cartão": "cartão",
  rodape: "rodapé",
  "rodapé": "rodapé",
};

const ok = () => NextResponse.json({ ok: true });
const erro = (mensagem: string, codigo: number) =>
  NextResponse.json({ erro: mensagem }, { status: codigo });

/** Identificador ao estilo do painel (`s-xxxxxx`), com sufixo aleatório contra colisões. */
const novoId = () =>
  `s-${Date.now().toString(36).slice(-6)}${Math.random().toString(36).slice(2, 5)}`;

/** Data de hoje em Luanda (UTC+1). */
const hojeLuanda = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);

export async function POST(req: NextRequest) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return erro("Pedido inválido.", 400);
  }

  // Armadilha preenchida: finge sucesso e não guarda nada.
  if (typeof corpo.website === "string" && corpo.website.trim() !== "") return ok();

  const email = normalizarEmail(corpo.email);
  if (email.length > 254 || !EMAIL_VALIDO.test(email)) return erro("Introduza um email válido.", 400);

  const nome = typeof corpo.nome === "string" ? corpo.nome.trim().slice(0, 80) : "";
  const origem = ORIGENS[String(corpo.origem ?? "")] ?? "rodapé";

  const db = supabaseAdmin();
  if (!db) return erro("A newsletter está indisponível de momento.", 503);

  const { op, valor } = filtroEmail(email);
  const procurar = () => {
    const q = db.from("subscritores").select("id, ativo, nome");
    return (op === "eq" ? q.eq("email", valor) : q.ilike("email", valor)).limit(1).maybeSingle();
  };

  const { data: existente, error: erroLeitura } = await procurar();
  if (erroLeitura) {
    console.error("[newsletter] falha ao procurar subscritor:", erroLeitura.message);
    return erro("Não foi possível subscrever agora.", 500);
  }

  if (existente) {
    if (existente.ativo) return ok();
    // Voltou: reactiva e conta a partir de hoje.
    const campos: Record<string, unknown> = { ativo: true, subscrito: hojeLuanda() };
    if (nome && !existente.nome) campos.nome = nome;
    const { error } = await db.from("subscritores").update(campos).eq("id", existente.id);
    if (error) {
      console.error("[newsletter] falha ao reactivar subscritor:", error.message);
      return erro("Não foi possível subscrever agora.", 500);
    }
    return ok();
  }

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const { error } = await db.from("subscritores").insert({
      id: novoId(), email, nome: nome || null, origem, subscrito: hojeLuanda(), ativo: true,
    });
    if (!error) return ok();
    if (error.code !== "23505") {
      console.error("[newsletter] falha ao guardar subscritor:", error.message);
      return erro("Não foi possível subscrever agora.", 500);
    }
    // Chave repetida: ou o mesmo email entrou entretanto (sucesso),
    // ou o id colidiu (tenta-se outro).
    const { data } = await procurar();
    if (data) return ok();
  }
  return erro("Não foi possível subscrever agora.", 500);
}
