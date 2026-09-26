import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listaDaBase } from "@/lib/supabase/mapeamento";
import { utilizadorActual, perfilDe } from "@/lib/conta/sessao";
import { normalizarPreferencias } from "@/lib/conta/preferencias";
import type { AnuncioMarketplace } from "@/lib/types";
import type { Encomenda } from "@/lib/admin/types";

/* ============================================================
   MOTOBOX — API da conta do utilizador
   GET devolve o perfil, as preferências, os bilhetes (as
   encomendas feitas com o email da conta) e os anúncios de quem
   tem sessão. PATCH altera apenas os campos permitidos do próprio
   perfil e as preferências. Papel, estado e verificação nunca
   passam por aqui.
   ============================================================ */

export const dynamic = "force-dynamic";

const PROVINCIAS = [
  "Luanda", "Benguela", "Huíla", "Huambo", "Namibe",
  "Cabinda", "Malanje", "Bengo", "Cuanza Sul",
];

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

export async function GET() {
  const user = await utilizadorActual();
  if (!user) return erro("Sessão necessária.", 401);
  const db = supabaseAdmin();
  if (!db) return erro("Base de dados indisponível.", 503);

  const [perfil, encomendas, anuncios] = await Promise.all([
    perfilDe(user),
    db.from("encomendas").select("*").eq("comprador->>email", (user.email ?? "").toLowerCase()),
    db.from("anuncios").select("*").eq("vendedor->>authId", user.id),
  ]);

  return NextResponse.json({
    perfil,
    email: user.email,
    preferencias: normalizarPreferencias(user.user_metadata?.preferencias),
    encomendas: listaDaBase<Encomenda>("encomendas", encomendas.data ?? []),
    anuncios: listaDaBase<AnuncioMarketplace>("anuncios", anuncios.data ?? []),
  });
}

export async function PATCH(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Sessão necessária.", 401);
  const db = supabaseAdmin();
  if (!db) return erro("Base de dados indisponível.", 503);

  let corpo: { perfil?: Record<string, unknown>; preferencias?: unknown };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }

  const perfil = await perfilDe(user);
  if (!perfil) return erro("Perfil não encontrado. Termine sessão e entre de novo.", 404);

  /* ---------- Perfil: só nome, telefone e província ---------- */
  if (corpo.perfil) {
    const p = corpo.perfil;
    const campos: Record<string, unknown> = {};
    if (typeof p.nome === "string") {
      const nome = p.nome.trim().replace(/\s+/g, " ");
      if (nome.length < 2 || nome.length > 80) return erro("O nome tem de ter entre 2 e 80 caracteres.");
      campos.nome = nome;
    }
    if (typeof p.telefone === "string") {
      const tel = p.telefone.trim();
      if (tel.length > 30) return erro("Telefone demasiado longo.");
      campos.telefone = tel || null;
    }
    if (typeof p.provincia === "string") {
      if (p.provincia && !PROVINCIAS.includes(p.provincia)) return erro("Província inválida.");
      campos.provincia = p.provincia || null;
    }
    if (Object.keys(campos).length > 0) {
      const { error } = await db.from("utilizadores").update(campos).eq("id", perfil.id);
      if (error) return erro(error.message, 500);
      if (campos.nome) {
        await db.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, nome: campos.nome },
        });
      }
    }
  }

  /* ---------- Preferências e newsletter ---------- */
  if (corpo.preferencias !== undefined) {
    const preferencias = normalizarPreferencias(corpo.preferencias);
    const { error } = await db.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, preferencias },
    });
    if (error) return erro(error.message, 500);

    const newsletter = preferencias.notificacoes.newsletter;
    if (newsletter !== perfil.newsletter) {
      await db.from("utilizadores").update({ newsletter }).eq("id", perfil.id);
    }
    // A lista da newsletter no painel é a tabela `subscritores`.
    const email = perfil.email.toLowerCase();
    const { data: sub } = await db.from("subscritores").select("id, ativo").eq("email", email).maybeSingle();
    if (sub && sub.ativo !== newsletter) {
      await db.from("subscritores").update({ ativo: newsletter }).eq("id", sub.id);
    } else if (!sub && newsletter) {
      await db.from("subscritores").insert({
        id: `s-${Date.now().toString(36)}`, email, nome: perfil.nome,
        origem: "conta", subscrito: new Date().toISOString().slice(0, 10), ativo: true,
      });
    }
  }

  return NextResponse.json({ ok: true, perfil: await perfilDe(user) });
}
