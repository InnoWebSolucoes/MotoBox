import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listaDaBase } from "@/lib/supabase/mapeamento";
import {
  organizar, organizadorConfigurado, ErroOrganizador,
  type Contexto, type Ficheiro,
} from "@/lib/admin/organizador";
import { TEMPORADA } from "@/lib/data";
import type { Evento } from "@/lib/types";

/* ============================================================
   MOTOBOX — API do Organizador IA
   Recebe texto e ficheiros, junta o que já existe na base de
   dados (para o Claude ligar e não duplicar) e devolve as
   propostas. Não grava nada.
   ============================================================ */

export const dynamic = "force-dynamic";
// Uma análise com PDF e imagens pode demorar mais de um minuto.
export const maxDuration = 300;

/** Limite de ficheiros por pedido, em bytes já codificados em base64. */
const LIMITE_FICHEIROS = 4_000_000;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

async function lerContexto(): Promise<Contexto> {
  const vazio: Contexto = { temporada: TEMPORADA, equipas: [], eventos: [], pilotos: [], ocupados: {} };
  const db = supabaseAdmin();
  if (!db) return vazio;

  const [equipas, eventos, pilotos, corridas, noticias, patrocinadores, videos] = await Promise.all([
    db.from("equipas").select("slug, nome"),
    db.from("eventos").select("slug, titulo, data_inicio, bilhetes"),
    db.from("pilotos").select("slug, nome, equipa_slug"),
    db.from("corridas").select("slug"),
    db.from("noticias").select("slug"),
    db.from("patrocinadores").select("slug"),
    db.from("videos").select("slug"),
  ]);

  const slugs = (r: { data: { slug: string }[] | null }) => (r.data ?? []).map((l) => l.slug);
  const listaEventos = listaDaBase<Evento>("eventos", eventos.data ?? []);

  return {
    temporada: TEMPORADA,
    equipas: (equipas.data ?? []).map((e) => ({ slug: e.slug, nome: e.nome })),
    eventos: listaEventos.map((e) => ({
      slug: e.slug, titulo: e.titulo, dataInicio: e.dataInicio, bilhetes: e.bilhetes,
    })),
    pilotos: (pilotos.data ?? []).map((p) => ({
      slug: p.slug, nome: p.nome, equipaSlug: p.equipa_slug ?? undefined,
    })),
    ocupados: {
      equipas: slugs(equipas), eventos: slugs(eventos), pilotos: slugs(pilotos),
      corridas: slugs(corridas), noticias: slugs(noticias),
      patrocinadores: slugs(patrocinadores), videos: slugs(videos),
    },
  };
}

export async function POST(req: NextRequest) {
  if (!organizadorConfigurado) {
    return erro(
      "O Organizador IA ainda não está ligado. Falta a variável ANTHROPIC_API_KEY no servidor.",
      503,
    );
  }

  let corpo: { texto?: unknown; ficheiros?: unknown };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }

  const texto = typeof corpo.texto === "string" ? corpo.texto.trim() : "";
  const ficheiros = Array.isArray(corpo.ficheiros)
    ? (corpo.ficheiros as Ficheiro[]).filter(
        (f) => f && typeof f.dados === "string" && typeof f.tipo === "string",
      )
    : [];

  if (!texto && ficheiros.length === 0) {
    return erro("Cole algum texto ou anexe um ficheiro para organizar.");
  }
  if (ficheiros.reduce((s, f) => s + f.dados.length, 0) > LIMITE_FICHEIROS) {
    return erro("Os ficheiros são demasiado grandes. Envie no máximo cerca de 3 MB de cada vez.", 413);
  }

  try {
    const resultado = await organizar(texto, ficheiros, await lerContexto());
    return NextResponse.json(resultado);
  } catch (e) {
    if (e instanceof ErroOrganizador) return erro(e.message, e.codigo);
    console.error("[organizador]", e);
    return erro("Falha inesperada ao organizar. Tente de novo.", 500);
  }
}
