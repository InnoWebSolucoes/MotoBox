import { NextResponse, after, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { daBase, listaDaBase } from "@/lib/supabase/mapeamento";
import { utilizadorActual } from "@/lib/conta/sessao";
import { notificarNovoAnuncio } from "@/lib/notificacoes";
import { enviarEmailUnico, modeloSimples, urlSite } from "@/lib/email";
import { moderacaoDe, type ItemVerificacao } from "@/lib/marketplace";
import type { AnuncioMarketplace, VerificacaoAnuncio } from "@/lib/types";

/* ============================================================
   MOTOBOX — Verificação de anúncios (painel)
   GET lista o que está por rever, os recusados e as motas já
   revistas, com a declaração do vendedor e o contacto dele.
   PATCH aprova ou recusa. O acesso ao painel é verificado no
   middleware; quem revê fica registado na declaração.
   ============================================================ */

export const dynamic = "force-dynamic";

/** Quantas motas já revistas se mostram no histórico. */
const HISTORICO = 40;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

const semMigracao = (e: { code?: string } | null) =>
  e?.code === "PGRST204" || e?.code === "PGRST205" || e?.code === "42P01" || e?.code === "42703";

const MIGRACAO = "Falta correr no Supabase a migração supabase/migracao-2026-10-03.sql.";

function daVerificacao(l: Record<string, unknown>): VerificacaoAnuncio {
  return {
    anuncioId: String(l.anuncio_id),
    numeroQuadro: String(l.numero_quadro ?? ""),
    matricula: String(l.matricula ?? ""),
    documentos: Array.isArray(l.documentos) ? (l.documentos as string[]) : [],
    emNomeProprio: Boolean(l.em_nome_proprio),
    observacoes: String(l.observacoes ?? ""),
    declaracaoEm: String(l.declaracao_em ?? ""),
    ...(l.revisto_por ? { revistoPor: String(l.revisto_por) } : {}),
    ...(l.revisto_em ? { revistoEm: String(l.revisto_em) } : {}),
    ...(l.nota_interna ? { notaInterna: String(l.nota_interna) } : {}),
  };
}

export async function GET(req: NextRequest) {
  // Um anúncio pedido pelo painel do Marketplace, mesmo aprovado e sem declaração.
  const pedido = new URL(req.url).searchParams.get("anuncio");
  const db = supabaseAdmin();
  if (!db) return erro("Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY.", 503);

  const [abertos, declaracoes] = await Promise.all([
    db.from("anuncios").select("*").neq("moderacao", "aprovado"),
    db.from("verificacoes_anuncios").select("*").order("declaracao_em", { ascending: false }),
  ]);
  if (semMigracao(abertos.error) || semMigracao(declaracoes.error)) {
    return NextResponse.json({ itens: [], emFalta: true, aviso: MIGRACAO });
  }
  if (abertos.error) return erro(abertos.error.message, 500);
  if (declaracoes.error) return erro(declaracoes.error.message, 500);

  const porAnuncio = new Map(declaracoes.data.map((l) => [String(l.anuncio_id), daVerificacao(l)]));

  // Motas já aprovadas entram no histórico; os abertos vêm todos.
  const idsAbertos = new Set(abertos.data.map((a) => String(a.id)));
  const revistos = declaracoes.data
    .map((l) => String(l.anuncio_id))
    .filter((id) => !idsAbertos.has(id))
    .slice(0, HISTORICO);
  if (pedido && !idsAbertos.has(pedido) && !revistos.includes(pedido)) revistos.push(pedido);
  const aprovados = revistos.length
    ? (await db.from("anuncios").select("*").in("id", revistos)).data ?? []
    : [];

  const anuncios = listaDaBase<AnuncioMarketplace>("anuncios", [...abertos.data, ...aprovados]);

  // Contacto de cada vendedor, numa só consulta.
  const authIds = [...new Set(anuncios.map((a) => a.vendedor.authId).filter((x): x is string => Boolean(x)))];
  const { data: perfis } = authIds.length
    ? await db.from("utilizadores").select("auth_id, email, telefone").in("auth_id", authIds)
    : { data: [] as { auth_id: string; email: string; telefone: string | null }[] };
  const contactos = new Map((perfis ?? []).map((p) => [String(p.auth_id), { email: p.email, telefone: p.telefone }]));

  // Quadros repetidos entre todas as declarações, não só as mostradas.
  const porQuadro = new Map<string, string[]>();
  for (const v of porAnuncio.values()) {
    porQuadro.set(v.numeroQuadro, [...(porQuadro.get(v.numeroQuadro) ?? []), v.anuncioId]);
  }
  const idsRepetidos = [...new Set([...porQuadro.values()].filter((ids) => ids.length > 1).flat())];
  const { data: linhasRepetidas } = idsRepetidos.length
    ? await db.from("anuncios").select("id, titulo, vendedor").in("id", idsRepetidos)
    : { data: [] as { id: string; titulo: string; vendedor: { nome?: string } }[] };
  const resumo = new Map((linhasRepetidas ?? []).map((l) => [String(l.id), {
    id: String(l.id), titulo: String(l.titulo), vendedor: String((l.vendedor as { nome?: string })?.nome ?? ""),
  }]));

  const itens: ItemVerificacao[] = anuncios.map((anuncio) => {
    const verificacao = porAnuncio.get(anuncio.id) ?? null;
    const repetidos = verificacao
      ? (porQuadro.get(verificacao.numeroQuadro) ?? [])
          .filter((id) => id !== anuncio.id)
          .map((id) => resumo.get(id) ?? { id, titulo: "(anúncio apagado)", vendedor: "" })
      : [];
    return {
      anuncio, verificacao, repetidos,
      contacto: anuncio.vendedor.authId ? contactos.get(anuncio.vendedor.authId) ?? null : null,
    };
  });

  return NextResponse.json({ itens });
}

export async function PATCH(req: NextRequest) {
  const db = supabaseAdmin();
  if (!db) return erro("Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY.", 503);
  const quem = await utilizadorActual();

  let corpo: {
    anuncioId?: string; accao?: "aprovar" | "recusar"; motivo?: string;
    documentosVistos?: boolean; identidadeConfirmada?: boolean; notaInterna?: string;
  };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }

  const id = corpo.anuncioId ?? "";
  const { data: linha, error: eLer } = await db.from("anuncios").select("*").eq("id", id).maybeSingle();
  if (semMigracao(eLer)) return erro(MIGRACAO, 503);
  if (!linha) return erro("Este anúncio já não existe. Recarregue a página.", 404);
  const anuncio = daBase<AnuncioMarketplace>("anuncios", linha);
  const estavaAprovado = moderacaoDe(anuncio) === "aprovado";

  const motivo = (corpo.motivo ?? "").trim().slice(0, 500);
  let alteracoes: Record<string, unknown>;
  if (corpo.accao === "aprovar") {
    alteracoes = {
      moderacao: "aprovado", publicado: true, motivo_moderacao: null,
      documentos_verificados: Boolean(corpo.documentosVistos),
      // Publicado é quando fica à vista, não quando foi submetido: assim
      // aparece no topo dos recentes e na newsletter dessa semana.
      ...(!estavaAprovado ? { publicado_em: new Date().toISOString().slice(0, 10) } : {}),
    };
  } else if (corpo.accao === "recusar") {
    if (motivo.length < 10) return erro("Explique ao vendedor porque o anúncio não foi aprovado (pelo menos 10 caracteres).");
    alteracoes = { moderacao: "rejeitado", publicado: false, motivo_moderacao: motivo, documentos_verificados: false };
  } else {
    return erro("Acção desconhecida.");
  }

  const { error } = await db.from("anuncios").update(alteracoes).eq("id", id);
  if (error) return erro(semMigracao(error) ? MIGRACAO : error.message, semMigracao(error) ? 503 : 500);

  // Quem reviu e quando, na declaração (se a houver: peças e equipamento não têm).
  await db.from("verificacoes_anuncios").update({
    revisto_por: quem?.email ?? "painel", revisto_em: new Date().toISOString(),
    nota_interna: (corpo.notaInterna ?? "").trim().slice(0, 1000),
  }).eq("anuncio_id", id);

  // A identidade é da pessoa, não do anúncio: o selo vai para todos os seus.
  const authId = anuncio.vendedor.authId;
  if (corpo.accao === "aprovar" && corpo.identidadeConfirmada && authId) {
    const { data: dele } = await db.from("anuncios").select("id, vendedor").eq("vendedor->>authId", authId);
    await Promise.all((dele ?? []).map((a) =>
      db.from("anuncios").update({ vendedor: { ...(a.vendedor as object), verificado: true } }).eq("id", a.id)));
  }

  try { revalidatePath("/", "layout"); } catch { /* fora de contexto */ }
  // Quem segue a marca só é avisado quando a mota fica à vista.
  if (corpo.accao === "aprovar" && !estavaAprovado) {
    after(() => notificarNovoAnuncio({ ...anuncio, moderacao: "aprovado" }));
  }
  // O vendedor sabe da decisão por email; na conta vê o mesmo estado.
  if (authId && (corpo.accao === "recusar" || !estavaAprovado)) {
    after(() => avisarVendedor(db, authId, anuncio, corpo.accao === "aprovar"
      ? { aprovado: true, documentos: Boolean(corpo.documentosVistos) }
      : { aprovado: false, motivo }));
  }
  return NextResponse.json({ ok: true });
}

async function avisarVendedor(
  db: NonNullable<ReturnType<typeof supabaseAdmin>>,
  authId: string,
  anuncio: AnuncioMarketplace,
  decisao: { aprovado: true; documentos: boolean } | { aprovado: false; motivo: string },
) {
  const { data } = await db.auth.admin.getUserById(authId);
  const para = data?.user?.email;
  if (!para) return;

  const email = decisao.aprovado
    ? modeloSimples({
        titulo: "O seu anúncio está publicado",
        paragrafos: [
          `«${anuncio.titulo}» foi revisto pela equipa Motobox e já está no marketplace.`,
          ...(decisao.documentos ? ["O anúncio mostra o selo «Documentação verificada»."] : []),
        ],
        botao: { texto: "Ver o anúncio", url: `${urlSite()}/marketplace/${encodeURIComponent(anuncio.id)}` },
      })
    : modeloSimples({
        titulo: "O seu anúncio não foi aprovado",
        paragrafos: [
          `A equipa Motobox reviu «${anuncio.titulo}» e não o pôde publicar.`,
          `Motivo: ${decisao.motivo}`,
          "Pode corrigir o anúncio na sua conta. Ao guardar, volta a ser revisto.",
        ],
        botao: { texto: "Abrir os meus anúncios", url: `${urlSite()}/conta?aba=anuncios` },
      });

  const falha = await enviarEmailUnico({
    para,
    assunto: (decisao.aprovado ? `Publicado: ${anuncio.titulo}` : `Não aprovado: ${anuncio.titulo}`).slice(0, 150),
    html: email.html, texto: email.texto,
  });
  if (falha) console.error(`[admin/verificacoes] Email ao vendedor do anúncio ${anuncio.id} falhou: ${falha}`);
}
