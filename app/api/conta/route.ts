import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listaDaBase } from "@/lib/supabase/mapeamento";
import { utilizadorActual, perfilDe } from "@/lib/conta/sessao";
import { normalizarPreferencias } from "@/lib/conta/preferencias";
import type { AnuncioMarketplace } from "@/lib/types";
import type { Encomenda } from "@/lib/admin/types";
import { ehProvincia } from "@/lib/provincias";

/* ============================================================
   MOTOBOX — API da conta do utilizador
   GET devolve o perfil, as preferências, os bilhetes (as
   encomendas feitas com o email da conta) e os anúncios de quem
   tem sessão. PATCH altera apenas os campos permitidos do próprio
   perfil, a cor do avatar e as preferências. Papel, estado e
   verificação nunca passam por aqui. O logótipo tem rota própria
   (/api/conta/avatar).
   ============================================================ */

export const dynamic = "force-dynamic";


const COR_HEX = /^#[0-9a-f]{6}$/i;
const COR_PADRAO = "#e10600";

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/**
 * Logótipo guardado nos metadados, só se estiver na pasta da própria conta.
 * O user_metadata também pode ser escrito pelo próprio utilizador com a chave
 * pública, por isso um endereço qualquer não passa.
 */
function avatarDaConta(user: User): string | null {
  const url = user.user_metadata?.avatarUrl;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!base || typeof url !== "string") return null;
  return url.startsWith(`${base}/storage/v1/object/public/avatares/${user.id}/`) ? url : null;
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

  // Sem linha em `utilizadores`, a cor escolhida fica nos metadados (ver PATCH).
  const corMeta = user.user_metadata?.avatarCor;
  const cor = perfil?.avatar_cor
    ?? (typeof corMeta === "string" && COR_HEX.test(corMeta) ? corMeta : COR_PADRAO);

  return NextResponse.json({
    perfil,
    email: user.email,
    avatar: { cor, url: avatarDaConta(user) },
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

  let corpo: { perfil?: Record<string, unknown>; preferencias?: unknown; avatarCor?: unknown };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }

  let avatarCor: string | undefined;
  if (corpo.avatarCor !== undefined) {
    if (typeof corpo.avatarCor !== "string" || !COR_HEX.test(corpo.avatarCor)) {
      return erro("Cor inválida. Use o formato #rrggbb.");
    }
    avatarCor = corpo.avatarCor.toLowerCase();
  }

  const perfil = await perfilDe(user);
  // Só a cor sobrevive a uma conta sem linha em `utilizadores` (ver abaixo).
  if (!perfil && (corpo.perfil || corpo.preferencias !== undefined)) {
    return erro("Perfil não encontrado. Termine sessão e entre de novo.", 404);
  }

  /* ---------- Perfil: só nome, telefone e província ---------- */
  if (corpo.perfil && perfil) {
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
      if (p.provincia && !ehProvincia(p.provincia)) return erro("Província inválida.");
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

  /* ---------- Cor do avatar ---------- */
  // Vive em `utilizadores.avatar_cor`, que o painel e o site lêem. A linha
  // procura-se pela conta e, na falta dela, pelo email (só uma linha ainda sem
  // conta ligada, nunca a de outra pessoa). Uma conta sem linha nenhuma guarda
  // a cor nos metadados, para a escolha não se perder.
  if (avatarCor) {
    const email = (user.email ?? "").toLowerCase();
    const alvo = perfil
      ? db.from("utilizadores").update({ avatar_cor: avatarCor }).eq("id", perfil.id)
      : db.from("utilizadores").update({ avatar_cor: avatarCor }).eq("email", email).is("auth_id", null);
    const { data: linhas, error } = await alvo.select("id");
    if (error) return erro(error.message, 500);
    if (!linhas?.length) {
      const { error: falha } = await db.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, avatarCor },
      });
      if (falha) return erro(falha.message, 500);
    }
  }

  /* ---------- Preferências e newsletter ---------- */
  if (corpo.preferencias !== undefined && perfil) {
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
