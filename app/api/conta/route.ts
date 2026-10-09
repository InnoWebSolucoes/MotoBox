import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listaDaBase } from "@/lib/supabase/mapeamento";
import { utilizadorActual, perfilDe } from "@/lib/conta/sessao";
import { normalizarPreferencias } from "@/lib/conta/preferencias";
import type { AnuncioMarketplace } from "@/lib/types";
import type { Encomenda } from "@/lib/admin/types";
import { ehProvincia } from "@/lib/provincias";
import { lerClubes } from "@/lib/supabase/publico";
import { tabelaEmFalta } from "@/lib/forum/respostas";
import { artigosDe, clubeDe, garagemDe, SLUG, type ResumoForum } from "@/components/conta/dados";

/* ============================================================
   MOTOBOX — API da conta do utilizador
   GET devolve o perfil, as preferências, os bilhetes (as
   encomendas feitas com o email da conta), os anúncios de quem
   tem sessão (com `visivel`: a equipa pode escondê-los), a
   participação no fórum, o clube, a garagem e os artigos
   guardados. PATCH altera apenas os campos permitidos do próprio
   perfil, a cor do avatar, as preferências e o clube. Papel,
   estado e verificação nunca passam por aqui. O logótipo, a
   garagem e os artigos guardados têm rotas próprias
   (/api/conta/avatar, /garagem, /artigos).
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

  const perfil = await perfilDe(user);
  const [encomendas, anuncios, forum] = await Promise.all([
    db.from("encomendas").select("*").eq("comprador->>email", (user.email ?? "").toLowerCase()),
    db.from("anuncios").select("*").eq("vendedor->>authId", user.id).order("publicado_em", { ascending: false }),
    resumoForum(db, user.id),
  ]);
  // A coluna booleana `publicado` não passa pelo mapeamento (ver daBase): vai à parte.
  const visivel = new Map((anuncios.data ?? []).map((l) => [String(l.id), l.publicado !== false]));

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
    anuncios: listaDaBase<AnuncioMarketplace>("anuncios", anuncios.data ?? [])
      .map((a) => ({ ...a, visivel: visivel.get(a.id) ?? true })),
    clube: clubeDe(user.user_metadata),
    garagem: garagemDe(user.user_metadata, user.id),
    artigos: artigosDe(user.user_metadata),
    forum,
    conta: {
      criado: user.created_at ?? null,
      ultimaEntrada: user.last_sign_in_at ?? null,
      provedor: typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : "email",
    },
  });
}

/**
 * Participação no fórum, pela conta. A mensagem de abertura de cada tópico
 * aberto por um membro é uma linha de `respostas_forum` com o id
 * "op-<id do tópico>" (ver app/api/forum/topicos): essas contam como tópicos,
 * as outras como respostas. Sem a tabela (antes da migração de 27/09), zero.
 */
async function resumoForum(db: NonNullable<ReturnType<typeof supabaseAdmin>>, authId: string): Promise<ResumoForum> {
  const [respostas, topicos] = await Promise.all([
    db.from("respostas_forum").select("topico_id, criado_em", { count: "exact" })
      .eq("autor_id", authId).eq("publicado", true).not("id", "like", "op-%")
      .order("criado_em", { ascending: false }).limit(5),
    db.from("respostas_forum").select("topico_id, criado_em", { count: "exact" })
      .eq("autor_id", authId).like("id", "op-%")
      .order("criado_em", { ascending: false }).limit(5),
  ]);
  for (const r of [respostas, topicos]) {
    if (r.error && !tabelaEmFalta(r.error)) console.error("[conta] Fórum:", r.error.message);
  }
  const linhasR = respostas.error ? [] : (respostas.data ?? []);
  const linhasT = topicos.error ? [] : (topicos.data ?? []);

  // Os títulos, só dos tópicos que estão no site (um tópico escondido pela equipa não aparece).
  const ids = [...new Set([...linhasR, ...linhasT].map((l) => String(l.topico_id)))];
  const titulos = new Map<string, string>();
  if (ids.length) {
    const { data } = await db.from("topicos").select("id, titulo").in("id", ids).eq("publicado", true);
    for (const t of data ?? []) titulos.set(String(t.id), String(t.titulo ?? ""));
  }
  const linha = (tipo: "resposta" | "topico") => (l: { topico_id: unknown; criado_em: unknown }) => ({
    tipo, topicoId: String(l.topico_id), titulo: titulos.get(String(l.topico_id)) ?? "", quando: String(l.criado_em ?? ""),
  });

  const recentes: ResumoForum["recentes"] = [...linhasR.map(linha("resposta")), ...linhasT.map(linha("topico"))]
    .filter((r) => r.titulo)
    .sort((a, b) => b.quando.localeCompare(a.quando))
    .slice(0, 4);

  return {
    respostas: respostas.error ? 0 : (respostas.count ?? linhasR.length),
    topicos: topicos.error ? 0 : (topicos.count ?? linhasT.length),
    recentes,
  };
}

export async function PATCH(req: NextRequest) {
  const user = await utilizadorActual();
  if (!user) return erro("Sessão necessária.", 401);
  const db = supabaseAdmin();
  if (!db) return erro("Base de dados indisponível.", 503);

  let corpo: { perfil?: Record<string, unknown>; preferencias?: unknown; avatarCor?: unknown; clube?: unknown };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }

  let avatarCor: string | undefined;
  if (corpo.avatarCor !== undefined) {
    if (typeof corpo.avatarCor !== "string" || !COR_HEX.test(corpo.avatarCor)) {
      return erro("Cor inválida. Use o formato #rrggbb.");
    }
    avatarCor = corpo.avatarCor.toLowerCase();
  }

  // Cada escrita nos metadados parte da anterior: dois campos mudados no mesmo
  // pedido não se apagam um ao outro.
  let meta: Record<string, unknown> = { ...user.user_metadata };

  /* ---------- Clube a que pertence ---------- */
  // Vive em user_metadata.clube (a tabela não tem coluna para ele). Vale
  // também para uma conta sem linha em `utilizadores`.
  if (corpo.clube !== undefined) {
    const slug = typeof corpo.clube === "string" ? corpo.clube.trim() : "";
    if (corpo.clube !== null && typeof corpo.clube !== "string") return erro("Clube inválido.");
    if (slug && (!SLUG.test(slug) || !(await lerClubes()).some((c) => c.slug === slug))) {
      return erro("Esse clube não existe.");
    }
    // `null` tira a chave dos metadados.
    const { error } = await db.auth.admin.updateUserById(user.id, {
      user_metadata: (meta = { ...meta, clube: slug || null }),
    });
    if (error) return erro(error.message, 500);
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
          user_metadata: (meta = { ...meta, nome: campos.nome }),
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
        user_metadata: (meta = { ...meta, avatarCor }),
      });
      if (falha) return erro(falha.message, 500);
    }
  }

  /* ---------- Preferências e newsletter ---------- */
  if (corpo.preferencias !== undefined && perfil) {
    const preferencias = normalizarPreferencias(corpo.preferencias);
    const { error } = await db.auth.admin.updateUserById(user.id, {
      user_metadata: (meta = { ...meta, preferencias }),
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
