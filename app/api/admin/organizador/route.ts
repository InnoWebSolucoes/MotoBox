import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  MODELO, SEM_CHAVE, ErroOrganizador, aCometer, chaveConfigurada, contextoDoPedido, correrAgente, criarContexto,
  ferramentaEscrita, planearComFerramenta, podeEscrever, prepararAnexos, propostaDe, quemPede,
  resolverDecisoes, traduzirErro, usosDe, validarEntrada, validarHistorico,
  type Decisao, type EstadoOrganizador, type EventoOrganizador, type MensagemHistorico, type PedidoOrganizador,
} from "@/lib/admin/organizador";

/* ============================================================
   MOTOBOX — API do Organizador IA
   GET   o estado: se a chave existe e o que quem pede pode fazer.
   POST  { accao: "conversar", historico, texto?, anexos?, decisoes? }
         responde em streaming (NDJSON, um evento por linha):
         texto, notas de progresso, ferramentas em uso, propostas,
         resultados das decisões e, no fim, as mensagens novas para
         o navegador juntar ao histórico.
   POST  { accao: "rever", id, ferramenta, entrada }
         volta a montar uma proposta editada no painel (nada grava).

   O acesso à rota é verificado no proxy (só a equipa); aqui
   lê-se o papel para saber se pode fazer mudanças. As decisões
   aprovadas executam antes de abrir o streaming.
   ============================================================ */

export const dynamic = "force-dynamic";
// Um pedido pode ter várias voltas de ferramentas.
export const maxDuration = 300;

/** Pára um pouco antes do limite do Vercel, para fechar com uma mensagem clara. */
const TEMPO_MAXIMO_MS = 285_000;
const LIMITE_CORPO = 9_000_000;

function erro(mensagem: string, codigo = 400) {
  return NextResponse.json({ erro: mensagem }, { status: codigo });
}

export async function GET() {
  const quem = await quemPede();
  if (!quem) return erro("Sem permissão para esta área.", 403);
  const ctx = await criarContexto(quem);
  const estado: EstadoOrganizador = {
    configurado: chaveConfigurada(),
    papel: quem.papel,
    podeEscrever: podeEscrever(quem),
    baseDados: ctx.repo.modo === "supabase",
    modelo: MODELO,
  };
  return NextResponse.json(estado);
}

export async function POST(req: NextRequest) {
  const quem = await quemPede();
  if (!quem) return erro("Sem permissão para esta área.", 403);
  if (!chaveConfigurada()) return erro(SEM_CHAVE, 503);
  if (Number(req.headers.get("content-length") ?? 0) > LIMITE_CORPO) {
    return erro("O pedido é demasiado grande. Envie anexos mais pequenos ou comece uma nova conversa.", 413);
  }

  let corpo: PedidoOrganizador;
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const ctx = await criarContexto(quem);
  const escrita = podeEscrever(quem);

  /* ---------- Rever uma proposta editada ---------- */
  if (corpo.accao === "rever") {
    if (!escrita) return erro("Este papel só pode consultar.", 403);
    if (!ferramentaEscrita(corpo.ferramenta)) return erro("Ferramenta desconhecida.");
    const v = validarEntrada(corpo.ferramenta, corpo.entrada);
    if (!v.ok) return erro(v.erro, 422);
    try {
      const plano = await planearComFerramenta(corpo.ferramenta, v.dados, ctx, String(corpo.id));
      return NextResponse.json({ proposta: propostaDe(String(corpo.id), corpo.ferramenta, v.dados, plano) });
    } catch (e) {
      return erro(e instanceof Error ? e.message : "Não foi possível rever a proposta.", 422);
    }
  }

  if (corpo.accao !== "conversar") return erro("Acção desconhecida.");

  /* ---------- Conversar ---------- */
  let historico: MensagemHistorico[];
  try { historico = validarHistorico(corpo.historico); } catch (e) {
    const x = traduzirErro(e);
    return erro(x.message, x.codigo);
  }
  const texto = typeof corpo.texto === "string" ? corpo.texto.trim().slice(0, 20_000) : "";
  const cliente = new Anthropic();

  // Anexos primeiro: se falharem, ainda nada foi executado.
  let anexos: Anthropic.Beta.BetaContentBlockParam[];
  try { anexos = await prepararAnexos(cliente, corpo.anexos); } catch (e) {
    const x = traduzirErro(e);
    return erro(x.message, x.codigo);
  }

  const ultimo = historico.at(-1);
  const pendentes = usosDe(ultimo).length > 0;
  if (!pendentes && !texto && anexos.length === 0) return erro("Escreva o que precisa.");

  // Decisões sobre as propostas pendentes: executam já, antes do streaming.
  const iniciais: EventoOrganizador[] = [];
  const novas: MensagemHistorico[] = [];
  let obrigatorias = 0;
  const pedido: Anthropic.Beta.BetaContentBlockParam[] = [
    ...anexos,
    ...(texto ? [{ type: "text" as const, text: texto }] : []),
  ];
  if (pendentes && ultimo) {
    const decisoes = Array.isArray(corpo.decisoes) ? (corpo.decisoes as Decisao[]) : [];
    const r = await resolverDecisoes(ultimo, decisoes, ctx, escrita);
    iniciais.push(...r.eventos);
    novas.push({ role: "user", content: [...r.resultados, ...pedido] });
    obrigatorias = 1;
  } else {
    novas.push({ role: "user", content: pedido });
    // Contexto do pedido (hoje, temporada, papel) como mensagem de sistema,
    // depois do pedido: o prompt de sistema fica igual e em cache.
    novas.push({
      role: "system",
      content: contextoDoPedido({ agora: new Date(), temporada: ctx.temporada, quem, podeEscrever: escrita, baseDados: ctx.repo.modo }),
    });
  }

  const sinal = AbortSignal.any([req.signal, AbortSignal.timeout(TEMPO_MAXIMO_MS)]);
  const codificador = new TextEncoder();

  const corpoResposta = new ReadableStream<Uint8Array>({
    async start(controlador) {
      let aberto = true;
      const emitir = (e: EventoOrganizador) => {
        if (!aberto) return;
        try { controlador.enqueue(codificador.encode(`${JSON.stringify(e)}\n`)); } catch { aberto = false; }
      };
      for (const e of iniciais) emitir(e);
      try {
        const fim = await correrAgente({ cliente, ctx, podeEscrever: escrita, historico, novas, emitir, sinal });
        emitir({ tipo: "historico", mensagens: aCometer(fim.delta, fim.motivo, obrigatorias) });
        if (fim.erro) emitir({ tipo: "erro", mensagem: fim.erro.message });
        emitir({ tipo: "fim", motivo: fim.motivo });
      } catch (e) {
        const x = e instanceof ErroOrganizador ? e : traduzirErro(e);
        emitir({ tipo: "historico", mensagens: aCometer(novas, "erro", obrigatorias) });
        emitir({ tipo: "erro", mensagem: x.message });
        emitir({ tipo: "fim", motivo: "erro" });
      } finally {
        aberto = false;
        try { controlador.close(); } catch { /* já fechado */ }
      }
    },
  });

  return new Response(corpoResposta, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

