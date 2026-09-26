import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { TABELA, listaDaBase } from "@/lib/supabase/mapeamento";
import {
  organizar, organizadorConfigurado, ErroOrganizador,
  type ColeccaoIA, type Contexto, type Ficheiro,
} from "@/lib/admin/organizador";
import { TEMPORADA } from "@/lib/data";
import type { Corrida, Equipa, Evento, Noticia, Patrocinador, Piloto, Video } from "@/lib/types";

/* ============================================================
   MOTOBOX — API do Organizador IA
   Recebe texto e ficheiros, junta o que já existe na base de
   dados (para o Claude ligar, alterar e não duplicar) e devolve
   as propostas. Não grava nada.
   ============================================================ */

export const dynamic = "force-dynamic";
// Uma análise com PDF e imagens pode demorar mais de um minuto.
export const maxDuration = 300;

/** Limite de ficheiros por pedido, em bytes já codificados em base64. */
const LIMITE_FICHEIROS = 4_000_000;

/** O que fazer quando falta a chave: é a única configuração necessária. */
const SEM_CHAVE =
  "O Organizador IA ainda não está ligado: falta a chave da API do Claude. " +
  "Para o ligar: 1) crie uma chave em console.anthropic.com, em Settings → API Keys; " +
  "2) no Vercel, abra o projecto em Settings → Environment Variables e acrescente ANTHROPIC_API_KEY com essa chave, " +
  "para Production e Preview; 3) em Deployments, faça Redeploy do último deployment para a chave passar a valer. " +
  "Em desenvolvimento, acrescente a mesma linha ao .env.local e reinicie o servidor.";

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

async function lerContexto(): Promise<Contexto> {
  const vazio: Contexto = {
    temporada: TEMPORADA, eventos: [], pilotos: [], equipas: [], corridas: [],
    noticias: [], patrocinadores: [], videos: [],
  };
  const db = supabaseAdmin();
  if (!db) return vazio;

  // Registos completos: o Claude precisa dos valores actuais para
  // encontrar o registo certo e propor alterações.
  const ler = (c: ColeccaoIA) => db.from(TABELA[c]).select("*");
  const r = await Promise.all([
    ler("eventos"), ler("pilotos"), ler("equipas"), ler("corridas"),
    ler("noticias"), ler("patrocinadores"), ler("videos"),
  ]);
  // Sem os registos existentes o Claude duplicaria tudo: é melhor parar.
  const falha = r.find((x) => x.error)?.error;
  if (falha) throw new ErroOrganizador(`Não foi possível ler os registos existentes: ${falha.message}`, 502);
  const [eventos, pilotos, equipas, corridas, noticias, patrocinadores, videos] = r;

  return {
    temporada: TEMPORADA,
    eventos: listaDaBase<Evento>("eventos", eventos.data),
    pilotos: listaDaBase<Piloto>("pilotos", pilotos.data),
    equipas: listaDaBase<Equipa>("equipas", equipas.data),
    corridas: listaDaBase<Corrida>("corridas", corridas.data),
    noticias: listaDaBase<Noticia>("noticias", noticias.data),
    patrocinadores: listaDaBase<Patrocinador>("patrocinadores", patrocinadores.data),
    videos: listaDaBase<Video>("videos", videos.data),
  };
}

/** Diz ao painel se o Organizador está ligado, para mostrar os passos antes de o usar. */
export async function GET() {
  return NextResponse.json({ configurado: organizadorConfigurado, instrucoes: organizadorConfigurado ? null : SEM_CHAVE });
}

export async function POST(req: NextRequest) {
  if (!organizadorConfigurado) return erro(SEM_CHAVE, 503);

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
