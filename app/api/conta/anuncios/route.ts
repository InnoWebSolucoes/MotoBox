import { NextResponse, after, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { paraBase, daBase } from "@/lib/supabase/mapeamento";
import { utilizadorActual, perfilDe } from "@/lib/conta/sessao";
import { notificarNovoAnuncio } from "@/lib/notificacoes";
import type { AnuncioMarketplace, VerificacaoAnuncio } from "@/lib/types";
import { ehProvincia } from "@/lib/provincias";
import {
  CATEGORIAS_ANUNCIO, ESTADOS_ARTIGO, QUADRO_VALIDO,
  ehDocumentoMota, moderacaoDe, normalizarQuadro, precisaRevisao,
} from "@/lib/marketplace";

/* ============================================================
   MOTOBOX — Anúncios publicados pelos utilizadores
   POST publica um anúncio em nome de quem tem sessão; PATCH e
   DELETE só actuam sobre anúncios dessa pessoa (vendedor.authId).
   Os campos aceites são uma lista fechada: o vendedor, as
   visualizações e a data são sempre definidos aqui.

   As motas não aparecem logo: ficam "pendente" (publicado=false)
   com a declaração do vendedor em verificacoes_anuncios, até a
   equipa as aprovar em /admin/verificacao.
   ============================================================ */

export const dynamic = "force-dynamic";

const MAXIMO_ACTIVOS = 20;

type Db = NonNullable<ReturnType<typeof supabaseAdmin>>;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

/** A migração do marketplace ainda não correu (coluna ou tabela em falta). */
const semMigracao = (e: { code?: string } | null) =>
  e?.code === "PGRST204" || e?.code === "PGRST205" || e?.code === "42P01" || e?.code === "42703";

const INDISPONIVEL = "Não foi possível enviar a mota para verificação. Tente de novo mais tarde.";

/** Valida e limpa os campos enviados pelo formulário. */
function campos(c: Record<string, unknown>): Partial<AnuncioMarketplace> | string {
  const titulo = typeof c.titulo === "string" ? c.titulo.trim() : "";
  if (titulo.length < 5 || titulo.length > 90) return "O título tem de ter entre 5 e 90 caracteres.";
  const preco = Number(c.preco);
  if (!Number.isFinite(preco) || preco < 0 || preco > 1_000_000_000) return "Preço inválido.";
  const categoria = String(c.categoria ?? "");
  if (!(CATEGORIAS_ANUNCIO as readonly string[]).includes(categoria)) return "Escolha uma categoria.";
  const estado = String(c.estado ?? "");
  if (!(ESTADOS_ARTIGO as readonly string[]).includes(estado)) return "Escolha o estado do artigo.";
  const provincia = String(c.provincia ?? "");
  if (!ehProvincia(provincia)) return "Escolha a província.";
  const descricao = typeof c.descricao === "string" ? c.descricao.trim() : "";
  if (descricao.length < 20 || descricao.length > 3000) return "A descrição tem de ter entre 20 e 3000 caracteres.";
  const marca = typeof c.marca === "string" ? c.marca.trim().slice(0, 40) : "";
  const modelo = typeof c.modelo === "string" ? c.modelo.trim().slice(0, 60) : "";
  const ano = Number(c.ano);
  const km = Number(c.quilometragem);

  return {
    titulo, preco: Math.round(preco), categoria: categoria as AnuncioMarketplace["categoria"],
    estado: estado as AnuncioMarketplace["estado"], provincia: provincia as AnuncioMarketplace["provincia"],
    descricao, marca, negociavel: Boolean(c.negociavel),
    ...(modelo ? { modelo } : {}),
    ...(Number.isInteger(ano) && ano > 1950 && ano <= new Date().getFullYear() + 1 ? { ano } : {}),
    ...(Number.isFinite(km) && km > 0 ? { quilometragem: Math.round(km) } : {}),
  };
}

type Declaracao = Pick<VerificacaoAnuncio, "numeroQuadro" | "matricula" | "documentos" | "emNomeProprio" | "observacoes">;

/** O que o vendedor de uma mota declara. Obrigatório sempre que a categoria é Motas. */
function declaracao(c: Record<string, unknown>): Declaracao | string {
  const v = (c.verificacao ?? {}) as Record<string, unknown>;
  const numeroQuadro = normalizarQuadro(typeof v.numeroQuadro === "string" ? v.numeroQuadro : "");
  if (!QUADRO_VALIDO.test(numeroQuadro)) {
    return "Indique o número de quadro da mota (entre 6 e 25 letras e algarismos).";
  }
  const matricula = typeof v.matricula === "string" ? v.matricula.trim().toUpperCase().slice(0, 15) : "";
  const documentos = Array.isArray(v.documentos) ? [...new Set(v.documentos.filter(ehDocumentoMota))] : [];
  if (documentos.length === 0) return "Indique que documentos tem da mota.";
  if (v.declaracao !== true) return "Confirme a declaração sobre a origem da mota.";
  const observacoes = typeof v.observacoes === "string" ? v.observacoes.trim().slice(0, 500) : "";
  return { numeroQuadro, matricula, documentos, emNomeProprio: Boolean(v.emNomeProprio), observacoes };
}

const linhaVerificacao = (anuncioId: string, authId: string, d: Declaracao) => ({
  anuncio_id: anuncioId, auth_id: authId,
  numero_quadro: d.numeroQuadro, matricula: d.matricula, documentos: d.documentos,
  em_nome_proprio: d.emNomeProprio, observacoes: d.observacoes,
  declaracao_em: new Date().toISOString(),
  // Uma declaração nova é revista de novo.
  revisto_por: null, revisto_em: null,
});

async function contexto() {
  const user = await utilizadorActual();
  if (!user) return { falha: erro("Sessão necessária.", 401) };
  const db = supabaseAdmin();
  if (!db) return { falha: erro("Base de dados indisponível.", 503) };
  const perfil = await perfilDe(user);
  if (!perfil) return { falha: erro("Perfil não encontrado.", 404) };
  if (["suspenso", "banido"].includes(perfil.estado)) {
    return { falha: erro("A sua conta não pode publicar anúncios. Contacte a Motobox.", 403) };
  }
  return { user, db, perfil };
}

/** O anúncio existe e pertence a quem tem sessão? Devolve a linha inteira. */
async function meu(db: Db, id: string, authId: string) {
  const { data } = await db.from("anuncios").select("*").eq("id", id).maybeSingle();
  return data && (data.vendedor as { authId?: string })?.authId === authId ? data : null;
}

/**
 * O selo de vendedor verificado é dado pela equipa e acompanha a
 * pessoa: se um anúncio seu já o tem, os novos nascem com ele.
 */
async function vendedorVerificado(db: Db, authId: string) {
  const { data } = await db.from("anuncios").select("id")
    .eq("vendedor->>authId", authId).eq("vendedor->>verificado", "true").limit(1);
  return (data?.length ?? 0) > 0;
}

function revalidar() {
  try { revalidatePath("/", "layout"); } catch { /* fora de contexto */ }
}

/** A declaração de uma mota, para o vendedor a rever ao editar. */
export async function GET(req: NextRequest) {
  const c = await contexto();
  if ("falha" in c) return c.falha;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!(await meu(c.db, id, c.user.id))) return erro("Anúncio não encontrado.", 404);

  const { data } = await c.db.from("verificacoes_anuncios")
    .select("numero_quadro, matricula, documentos, em_nome_proprio, observacoes")
    .eq("anuncio_id", id).maybeSingle();
  return NextResponse.json({
    verificacao: data && {
      numeroQuadro: data.numero_quadro, matricula: data.matricula, documentos: data.documentos,
      emNomeProprio: data.em_nome_proprio, observacoes: data.observacoes,
    },
  });
}

export async function POST(req: NextRequest) {
  const c = await contexto();
  if ("falha" in c) return c.falha;
  const { user, db, perfil } = c;

  const { data: def } = await db.from("definicoes").select("marketplace_aberto").eq("id", 1).maybeSingle();
  if (def && def.marketplace_aberto === false) return erro("O marketplace está fechado de momento.", 403);

  const { count } = await db.from("anuncios").select("id", { count: "exact", head: true })
    .eq("vendedor->>authId", user.id);
  if ((count ?? 0) >= MAXIMO_ACTIVOS) return erro(`Pode ter no máximo ${MAXIMO_ACTIVOS} anúncios activos.`, 429);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }
  const limpos = campos(corpo);
  if (typeof limpos === "string") return erro(limpos);
  if (corpo.aceitaTermos !== true) return erro("Aceite os Termos do Marketplace para publicar.");

  const emRevisao = precisaRevisao(String(limpos.categoria));
  let decl: Declaracao | null = null;
  if (emRevisao) {
    const d = declaracao(corpo);
    if (typeof d === "string") return erro(d);
    decl = d;
  }

  const anuncio: AnuncioMarketplace = {
    id: `mkt-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    ...(limpos as Omit<AnuncioMarketplace, "id" | "imagens" | "vendedor" | "publicado" | "visualizacoes">),
    imagens: [],
    vendedor: {
      nome: perfil.nome, verificado: await vendedorVerificado(db, user.id),
      desde: Number(perfil.registado.slice(0, 4)) || new Date().getFullYear(),
      anuncios: (count ?? 0) + 1, authId: user.id,
    },
    publicado: new Date().toISOString().slice(0, 10),
    visualizacoes: 0,
    // Sem a chave, a coluna fica no valor por omissão ("aprovado"), e o
    // anúncio grava mesmo antes de a migração correr.
    ...(emRevisao ? { moderacao: "pendente" as const } : {}),
  };

  const linha = paraBase("anuncios", anuncio as unknown as Record<string, unknown>);
  if (emRevisao) linha.publicado = false;

  const { data, error } = await db.from("anuncios").insert(linha).select().single();
  if (error) {
    if (emRevisao && semMigracao(error)) {
      console.error("[conta/anuncios] Falta a migração do marketplace:", error.message);
      return erro(INDISPONIVEL, 503);
    }
    return erro(error.message, 500);
  }

  if (decl) {
    const { error: e } = await db.from("verificacoes_anuncios").insert(linhaVerificacao(anuncio.id, user.id, decl));
    if (e) {
      // Uma mota sem declaração não pode ficar à espera de revisão.
      await db.from("anuncios").delete().eq("id", anuncio.id);
      console.error("[conta/anuncios] Falha ao guardar a declaração:", e.message);
      return erro(semMigracao(e) ? INDISPONIVEL : e.message, semMigracao(e) ? 503 : 500);
    }
    return NextResponse.json({ dados: daBase<AnuncioMarketplace>("anuncios", data), emRevisao: true }, { status: 201 });
  }

  revalidar();
  // Avisa quem segue a marca, depois de responder.
  after(() => notificarNovoAnuncio(anuncio));
  return NextResponse.json({ dados: daBase<AnuncioMarketplace>("anuncios", data), emRevisao: false }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const c = await contexto();
  if ("falha" in c) return c.falha;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const atual = await meu(c.db, id, c.user.id);
  if (!atual) return erro("Anúncio não encontrado.", 404);
  const antes = daBase<AnuncioMarketplace>("anuncios", atual);

  let corpo: Record<string, unknown>;
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }
  const limpos = campos(corpo);
  if (typeof limpos === "string") return erro(limpos);

  const mota = precisaRevisao(String(limpos.categoria));
  let decl: Declaracao | null = null;
  let mudouMota = false;
  if (mota) {
    const d = declaracao(corpo);
    if (typeof d === "string") return erro(d);
    decl = d;
    const { data: v } = await c.db.from("verificacoes_anuncios")
      .select("numero_quadro, matricula").eq("anuncio_id", id).maybeSingle();
    // Mudar o que identifica a mota é anunciar outra mota: volta à revisão.
    mudouMota = !v || !precisaRevisao(antes.categoria)
      || v.numero_quadro !== decl.numeroQuadro || v.matricula !== decl.matricula
      || antes.marca !== limpos.marca || (antes.modelo ?? "") !== (limpos.modelo ?? "")
      || antes.ano !== limpos.ano;
  }

  // Pendente continua pendente; recusado, ao ser corrigido, volta a ser revisto.
  const paraRevisao = moderacaoDe(antes) !== "aprovado" || mudouMota;
  const alteracoes = paraBase("anuncios", {
    ...limpos,
    ...(paraRevisao ? { moderacao: "pendente", documentosVerificados: false } : {}),
    // Deixou de ser uma mota: o selo dos documentos deixa de fazer sentido.
    ...(!mota && antes.documentosVerificados ? { documentosVerificados: false } : {}),
  } as Record<string, unknown>);
  if (paraRevisao) Object.assign(alteracoes, { publicado: false, motivo_moderacao: null });

  const { data, error } = await c.db.from("anuncios").update(alteracoes).eq("id", id).select().single();
  if (error) {
    if (semMigracao(error)) {
      console.error("[conta/anuncios] Falta a migração do marketplace:", error.message);
      return erro(INDISPONIVEL, 503);
    }
    return erro(error.message, 500);
  }

  if (decl) {
    // Sem revisão nova, a declaração já existe e o quadro não mudou:
    // actualizam-se só os pormenores, sem apagar quem a reviu.
    const { error: e } = paraRevisao
      ? await c.db.from("verificacoes_anuncios").upsert(linhaVerificacao(id, c.user.id, decl))
      : await c.db.from("verificacoes_anuncios").update({
          documentos: decl.documentos, em_nome_proprio: decl.emNomeProprio, observacoes: decl.observacoes,
        }).eq("anuncio_id", id);
    if (e) {
      console.error("[conta/anuncios] Falha ao guardar a declaração:", e.message);
      return erro(semMigracao(e) ? INDISPONIVEL : e.message, semMigracao(e) ? 503 : 500);
    }
  }

  // Um anúncio que estava à vista e passou a pendente tem de sair das páginas.
  if (!paraRevisao || moderacaoDe(antes) === "aprovado") revalidar();
  return NextResponse.json({ dados: daBase<AnuncioMarketplace>("anuncios", data), emRevisao: paraRevisao });
}

/** "Terminar" um anúncio: sai do marketplace de vez. */
export async function DELETE(req: NextRequest) {
  const c = await contexto();
  if ("falha" in c) return c.falha;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!(await meu(c.db, id, c.user.id))) return erro("Anúncio não encontrado.", 404);

  // A declaração da mota sai com ele (on delete cascade).
  const { error } = await c.db.from("anuncios").delete().eq("id", id);
  if (error) return erro(error.message, 500);

  revalidar();
  return NextResponse.json({ ok: true });
}
