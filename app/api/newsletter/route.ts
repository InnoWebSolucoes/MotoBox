import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { EMAIL_VALIDO, escreverSubscritor, filtroEmail, normalizarEmail } from "@/lib/newsletter";
import { normalizarInteresses } from "@/lib/conta/preferencias";

/* ============================================================
   MOTOBOX — Subscrição pública da newsletter
   POST { email, nome?, interesses?, origem, website? }

   Escreve na tabela `subscritores` com o service role (a chave
   anónima não escreve). Um email que tinha cancelado volta a
   ficar activo; um email já activo fica como está, salvo os
   interesses. `website` é uma armadilha para robôs: invisível para
   pessoas, preenchido por quem enche formulários às cegas.

   `interesses` são ids de INTERESSES (lib/conta/preferencias).
   Quando vêm, substituem os anteriores (subscrever de novo é a
   forma de os mudar); quando não vêm (o rodapé não os mostra),
   ficam os que havia. Antes da migração de 3 de Outubro a coluna
   não existe e a subscrição faz-se sem eles.
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
  // Lista vazia é uma escolha ("tudo"); ausente é não mexer.
  const interesses = Array.isArray(corpo.interesses) ? normalizarInteresses(corpo.interesses) : undefined;
  const comInteresses = interesses ? { interesses } : {};

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
    // Já activo: só os interesses mudam. Voltou: reactiva e conta a partir de hoje.
    const campos: Record<string, unknown> = existente.ativo
      ? { ...comInteresses }
      : { ativo: true, subscrito: hojeLuanda(), ...comInteresses };
    if (!existente.ativo && nome && !existente.nome) campos.nome = nome;
    if (Object.keys(campos).length === 0) return ok();
    const falha = await escreverSubscritor(campos, (c) =>
      db.from("subscritores").update(c).eq("id", existente.id));
    if (falha) {
      console.error("[newsletter] falha ao actualizar subscritor:", falha.message);
      // Para quem já estava activo, a subscrição mantém-se: só os interesses ficaram por gravar.
      return existente.ativo ? ok() : erro("Não foi possível subscrever agora.", 500);
    }
    return ok();
  }

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const falha = await escreverSubscritor(
      { id: novoId(), email, nome: nome || null, origem, subscrito: hojeLuanda(), ativo: true, ...comInteresses },
      (c) => db.from("subscritores").insert(c),
    );
    if (!falha) return ok();
    if (falha.code !== "23505") {
      console.error("[newsletter] falha ao guardar subscritor:", falha.message);
      return erro("Não foi possível subscrever agora.", 500);
    }
    // Chave repetida: ou o mesmo email entrou entretanto (sucesso),
    // ou o id colidiu (tenta-se outro).
    const { data } = await procurar();
    if (data) return ok();
  }
  return erro("Não foi possível subscrever agora.", 500);
}
