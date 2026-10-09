import "server-only";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA: o agente
   Um ciclo de ferramentas com o Claude, em streaming: o texto
   e as notas de progresso seguem para o painel à medida que
   chegam; as ferramentas de leitura correm logo; as de escrita
   viram propostas e o ciclo pára até o administrador decidir.
   Ao decidir, o painel volta com as decisões, as aprovadas
   correm (ver executar.ts) e o ciclo continua com os resultados.

   A conversa vive no navegador e volta inteira em cada pedido.
   O histórico só cresce (nada é editado), para que os blocos de
   raciocínio e a cache do prompt continuem válidos.
   ============================================================ */

import Anthropic, { toFile } from "@anthropic-ai/sdk";
import type { Decisao, EventoOrganizador, MensagemHistorico, MotivoFim, Proposta, Anexo } from "./tipos";
import {
  NOMES_ESCRITA, definicoesFerramentas, eEscrita, lerComFerramenta, paraTextoResultado, planearComFerramenta,
  rotuloDe, rotuloInicial, validarEntrada,
} from "./ferramentas";
import { ErroFerramenta, assinar, type Contexto, type Plano } from "./planos";
import { executarPlano } from "./executar";
import { promptSistema } from "./sistema";

/** O modelo mais capaz para trabalho de agente (ver o guia da API do Claude). */
export const MODELO = "claude-opus-5-5";

/**
 * Betas em uso:
 * - server-side-fallback: se os filtros de segurança recusarem um pedido
 *   legítimo, outro modelo responde no mesmo pedido;
 * - thinking-display-updates: as notas de progresso entre ferramentas
 *   chegam como texto (o raciocínio continua escondido);
 * - thinking-binding-controls: se o histórico vier alterado, os blocos de
 *   raciocínio afectados são descartados em vez de o pedido falhar;
 * - context-management: resultados de leitura antigos saem do contexto
 *   quando a conversa fica grande, para o custo não disparar.
 */
const BETAS: Anthropic.Beta.AnthropicBeta[] = [
  "server-side-fallback-2026-07-01",
  "thinking-display-updates-2026-08-18",
  "thinking-binding-controls-2026-08-01",
  "context-management-2025-06-27",
];

/** Limites para manter o custo razoável. */
const MAX_ITERACOES = 10;
const MAX_TOKENS = 32_000;
const TENTATIVAS_JSON = 2;

export const chaveConfigurada = () => Boolean(process.env.ANTHROPIC_API_KEY);

/* ---------------- Erros ---------------- */

export class ErroOrganizador extends Error {
  constructor(mensagem: string, public codigo = 500) { super(mensagem); }
}

export const SEM_CHAVE =
  "O Organizador IA ainda não está ligado: falta a chave da API do Claude (ANTHROPIC_API_KEY) no servidor. " +
  "Crie a chave em console.anthropic.com, acrescente-a no Vercel (projecto moto-box-wc4x → Settings → Environment Variables) e faça Redeploy.";

/** Frases claras para os erros da API do Claude. */
export function traduzirErro(e: unknown): ErroOrganizador {
  if (e instanceof ErroOrganizador) return e;
  if (e instanceof Anthropic.APIUserAbortError || (e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError"))) {
    return new ErroOrganizador("O pedido foi interrompido ou demorou demasiado. Tente de novo, com um pedido mais pequeno se for preciso.", 504);
  }
  if (e instanceof Anthropic.APIConnectionTimeoutError) {
    return new ErroOrganizador("O Claude demorou demasiado a responder. Tente de novo daqui a pouco.", 504);
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return new ErroOrganizador("Não foi possível contactar o serviço do Claude. Verifique a ligação e tente de novo.", 502);
  }
  if (e instanceof Anthropic.APIError) {
    if (e.type === "overloaded_error" || e.status === 529) {
      return new ErroOrganizador("O serviço do Claude está sobrecarregado neste momento. Tente daqui a alguns minutos.", 503);
    }
    if (e.type === "billing_error" || e.status === 402) {
      return new ErroOrganizador("A conta da Anthropic não tem crédito ou tem um problema de pagamento. Verifique em console.anthropic.com → Billing.", 402);
    }
    if (e instanceof Anthropic.AuthenticationError) {
      return new ErroOrganizador("A chave ANTHROPIC_API_KEY foi recusada. Crie uma chave nova em console.anthropic.com, substitua-a no Vercel (Settings → Environment Variables) e faça Redeploy.", 503);
    }
    if (e instanceof Anthropic.PermissionDeniedError) {
      return new ErroOrganizador("A chave da API não tem acesso a este modelo do Claude. Verifique a conta e o workspace em console.anthropic.com.", 503);
    }
    if (e instanceof Anthropic.NotFoundError) {
      return new ErroOrganizador(`O modelo ${MODELO} não está disponível para esta conta da Anthropic. Verifique a conta em console.anthropic.com.`, 503);
    }
    if (e instanceof Anthropic.RateLimitError) {
      return new ErroOrganizador("Demasiados pedidos ao Claude neste momento. Espere um minuto e tente de novo.", 429);
    }
    if (e instanceof Anthropic.BadRequestError) {
      const longo = /too long|too many tokens|context window/i.test(e.message);
      return new ErroOrganizador(longo
        ? "A conversa ficou demasiado longa. Comece uma nova conversa (botão «Nova conversa»)."
        : `O Claude recusou o pedido: ${e.message}. Se voltar a acontecer, comece uma nova conversa.`, 400);
    }
    if (e instanceof Anthropic.InternalServerError) {
      return new ErroOrganizador("O serviço do Claude falhou do lado deles. Tente de novo daqui a pouco.", 502);
    }
    return new ErroOrganizador(`O serviço do Claude respondeu com um erro (${e.status ?? "sem código"}). Tente de novo.`, 502);
  }
  console.error("[organizador] erro inesperado", e);
  return new ErroOrganizador("Falha inesperada no Organizador. Tente de novo.", 500);
}

/* ---------------- Histórico ---------------- */

type Bloco = Anthropic.Beta.BetaContentBlockParam;
type UsoFerramenta = Anthropic.Beta.BetaToolUseBlockParam;
type Resultado = Anthropic.Beta.BetaToolResultBlockParam;

const blocosDe = (m: MensagemHistorico): Bloco[] => (Array.isArray(m.content) ? (m.content as Bloco[]) : []);

export const usosDe = (m: MensagemHistorico | undefined): UsoFerramenta[] =>
  m && m.role === "assistant" ? blocosDe(m).filter((b): b is UsoFerramenta => b.type === "tool_use") : [];

/** Valida, sem ir ao pormenor, o histórico que vem do navegador. */
export function validarHistorico(h: unknown): MensagemHistorico[] {
  if (h === undefined || h === null) return [];
  if (!Array.isArray(h)) throw new ErroOrganizador("Histórico inválido.", 400);
  if (JSON.stringify(h).length > 3_000_000) {
    throw new ErroOrganizador("A conversa ficou demasiado longa. Comece uma nova conversa.", 413);
  }
  for (const m of h) {
    if (typeof m !== "object" || m === null) throw new ErroOrganizador("Histórico inválido.", 400);
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant" && role !== "system") throw new ErroOrganizador("Histórico inválido.", 400);
    if (typeof content !== "string" && !Array.isArray(content)) throw new ErroOrganizador("Histórico inválido.", 400);
  }
  if (h.length > 0 && (h[0] as MensagemHistorico).role !== "user") throw new ErroOrganizador("Histórico inválido.", 400);
  return h as MensagemHistorico[];
}

/**
 * Depois de uma recusa a meio, o modelo de recurso continua a resposta.
 * Os blocos de raciocínio e de ferramentas antes da última mudança de
 * modelo não voltam a ser enviados (regra da API).
 */
export function limparFallback(conteudo: Bloco[]): Bloco[] {
  const ultimo = conteudo.map((b) => b.type).lastIndexOf("fallback");
  if (ultimo < 0) return conteudo;
  const fora = new Set(["thinking", "redacted_thinking", "tool_use", "server_tool_use"]);
  return conteudo.filter((b, i) => i > ultimo || !fora.has(b.type));
}

/**
 * O que fica no histórico do navegador: nunca termina com uma
 * chamada a ferramenta sem resposta (a não ser à espera de
 * aprovação) nem com a mensagem de contexto sozinha. Um pedido de
 * texto sem nenhuma resposta não fica (o painel devolve o texto à
 * caixa); os resultados de decisões já executadas ficam sempre.
 */
export function aCometer(delta: MensagemHistorico[], motivo: MotivoFim, obrigatorias: number): MensagemHistorico[] {
  let fim = delta.length;
  while (fim > obrigatorias) {
    const m = delta[fim - 1];
    const pendente = usosDe(m).length > 0;
    if (pendente && motivo === "aguarda-aprovacao" && fim === delta.length) break;
    if (pendente || m.role === "system") { fim--; continue; }
    break;
  }
  const r = delta.slice(0, fim);
  if (obrigatorias === 0 && !r.some((m) => m.role === "assistant")) return [];
  return r;
}

/* ---------------- Anexos ---------------- */

const IMAGENS = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
const LIMITE_ANEXOS = 4_500_000;

/**
 * Anexos (cartazes, PDF, listas): sobem para a Files API da Anthropic
 * e a conversa guarda só o identificador, para o histórico no
 * navegador não crescer e os blocos continuarem iguais.
 */
export async function prepararAnexos(cliente: Anthropic, anexos: Anexo[] | undefined): Promise<Bloco[]> {
  if (!anexos?.length) return [];
  if (anexos.reduce((s, a) => s + (a.dados?.length ?? 0), 0) > LIMITE_ANEXOS) {
    throw new ErroOrganizador("Os anexos são demasiado grandes. Envie no máximo cerca de 3 MB de cada vez.", 413);
  }
  const blocos: Bloco[] = [];
  for (const a of anexos) {
    if (typeof a?.dados !== "string" || typeof a.tipo !== "string") continue;
    const nome = String(a.nome || "anexo").slice(0, 120);
    if (a.tipo === "text/plain" || a.tipo === "text/csv") {
      blocos.push({ type: "document", source: { type: "text", media_type: "text/plain", data: Buffer.from(a.dados, "base64").toString("utf8") }, title: nome });
      continue;
    }
    const pdf = a.tipo === "application/pdf";
    if (!pdf && !(IMAGENS as readonly string[]).includes(a.tipo)) {
      throw new ErroOrganizador(`O ficheiro ${nome} não é suportado. Use imagens (JPG, PNG, WebP, GIF), PDF ou texto.`, 400);
    }
    try {
      const f = await cliente.files.upload({
        file: await toFile(Buffer.from(a.dados, "base64"), nome, { type: a.tipo }),
        expires_in_seconds: 7 * 24 * 3600,
      });
      blocos.push(pdf
        ? { type: "document", source: { type: "file", file_id: f.id }, title: nome }
        : { type: "image", source: { type: "file", file_id: f.id } });
    } catch (e) {
      throw traduzirErro(e);
    }
  }
  return blocos;
}

/* ---------------- Ferramentas ---------------- */

const resultado = (id: string, texto: string, erro = false): Resultado => ({
  type: "tool_result", tool_use_id: id, content: texto, ...(erro ? { is_error: true } : {}),
});

function resumoLeitura(d: unknown): string {
  if (d && typeof d === "object") {
    const o = d as Record<string, unknown>;
    if (typeof o.encontrados === "number") return `${o.encontrados} encontrado(s)`;
    if (typeof o.totalRegistos === "number") return `${o.totalRegistos} resultado(s)`;
    if (typeof o.total === "number") return `${o.total} no total`;
  }
  return "Pronto";
}

export function propostaDe(id: string, nome: string, entrada: unknown, plano: Plano): Proposta {
  return {
    id, ferramenta: nome,
    entrada: (entrada && typeof entrada === "object" ? entrada : {}) as Record<string, unknown>,
    titulo: plano.titulo, motivo: plano.motivo, operacoes: plano.vista, avisos: plano.avisos,
    destrutiva: plano.destrutiva, ligacoes: plano.ligacoes, assinatura: assinar(plano),
  };
}

/** Corre as ferramentas de uma volta. As de escrita viram propostas. */
async function processarUsos(
  usos: UsoFerramenta[], ctx: Contexto, podeEscrever: boolean, emitir: (e: EventoOrganizador) => void,
): Promise<{ resultados: Resultado[]; propostas: Proposta[] }> {
  const propostas: Proposta[] = [];
  const resultados = await Promise.all(usos.map(async (uso): Promise<Resultado> => {
    const v = validarEntrada(uso.name, uso.input);
    if (!v.ok) {
      emitir({ tipo: "ferramenta-fim", id: uso.id, ok: false, resumo: "Pedido mal formado; o Organizador vai corrigir." });
      return resultado(uso.id, JSON.stringify({ erro: v.erro }), true);
    }
    emitir({ tipo: "ferramenta", id: uso.id, nome: uso.name, rotulo: rotuloDe(uso.name, v.dados) });
    try {
      if (eEscrita(uso.name)) {
        if (!podeEscrever) throw new ErroFerramenta("Este papel só pode consultar: não há mudanças possíveis.");
        const plano = await planearComFerramenta(uso.name, v.dados, ctx, uso.id);
        const proposta = propostaDe(uso.id, uso.name, v.dados, plano);
        propostas.push(proposta);
        emitir({ tipo: "proposta", proposta });
        emitir({ tipo: "ferramenta-fim", id: uso.id, ok: true, resumo: "Proposta pronta para aprovar" });
        return resultado(uso.id, "Proposta mostrada ao administrador; aguarda decisão.");
      }
      const dados = await lerComFerramenta(uso.name, v.dados, ctx);
      emitir({ tipo: "ferramenta-fim", id: uso.id, ok: true, resumo: resumoLeitura(dados) });
      return resultado(uso.id, paraTextoResultado(dados));
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : "Falha inesperada.";
      emitir({ tipo: "ferramenta-fim", id: uso.id, ok: false, resumo: mensagem });
      return resultado(uso.id, mensagem, true);
    }
  }));
  return { resultados, propostas };
}

/**
 * Resultados para as chamadas da última resposta, à espera de
 * decisão: as aprovadas executam (só se o plano for o mesmo que o
 * administrador viu), as rejeitadas e as sem decisão não. As de
 * leitura correm de novo. Chamado antes de abrir o streaming,
 * porque escreve na base de dados e revalida o site.
 */
export async function resolverDecisoes(
  ultimo: MensagemHistorico, decisoes: Decisao[], ctx: Contexto, podeEscrever: boolean,
): Promise<{ resultados: Resultado[]; eventos: EventoOrganizador[] }> {
  const eventos: EventoOrganizador[] = [];
  const resultados: Resultado[] = [];
  for (const uso of usosDe(ultimo)) {
    if (!eEscrita(uso.name)) {
      const v = validarEntrada(uso.name, uso.input);
      if (!v.ok) { resultados.push(resultado(uso.id, JSON.stringify({ erro: v.erro }), true)); continue; }
      try {
        resultados.push(resultado(uso.id, paraTextoResultado(await lerComFerramenta(uso.name, v.dados, ctx))));
      } catch (e) {
        resultados.push(resultado(uso.id, e instanceof Error ? e.message : "Falha.", true));
      }
      continue;
    }

    const d = decisoes.find((x) => x.id === uso.id);
    const editada = Boolean(d?.entrada);
    const v = validarEntrada(uso.name, d?.entrada ?? uso.input);
    if (!v.ok) { resultados.push(resultado(uso.id, JSON.stringify({ erro: v.erro }), true)); continue; }

    if (!d) {
      resultados.push(resultado(uso.id, "Não executado: o administrador continuou a conversa sem aprovar esta proposta. Nada foi feito."));
      continue;
    }
    if (d.decisao === "rejeitar") {
      resultados.push(resultado(uso.id, `Rejeitado pelo administrador. Nada foi feito.${d.nota ? ` Nota do administrador: ${d.nota}` : ""}`));
      continue;
    }

    let plano: Plano;
    try {
      if (!podeEscrever) throw new ErroFerramenta("O papel de quem aprovou não pode fazer mudanças.");
      plano = await planearComFerramenta(uso.name, v.dados, ctx, uso.id);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Falha ao preparar.";
      eventos.push({ tipo: "executado", id: uso.id, ok: false, titulo: "Não foi executado", resumo: m, ligacoes: [] });
      resultados.push(resultado(uso.id, `Não executado: ${m}`, true));
      continue;
    }
    const recusa = plano.destrutiva && !d.confirmado
      ? "falta a confirmação explícita do administrador para uma acção destrutiva."
      : d.assinatura !== assinar(plano)
        ? "os dados mudaram desde que a proposta foi mostrada. Volte a propor com os valores actuais."
        : null;
    if (recusa) {
      eventos.push({ tipo: "executado", id: uso.id, ok: false, titulo: plano.titulo, resumo: `Não foi executado: ${recusa}`, ligacoes: plano.ligacoes });
      resultados.push(resultado(uso.id, `Não executado: ${recusa}`, true));
      continue;
    }

    const r = await executarPlano(ctx.repo, ctx.quem, plano);
    const feito = r.feitas.length ? `Ficou feito: ${r.feitas.join("; ")}.` : "Nada foi feito.";
    const nota = editada ? ` O administrador editou a proposta antes de aprovar; a entrada final foi ${paraTextoResultado(v.dados, 3000)}.` : "";
    if (r.ok) {
      eventos.push({ tipo: "executado", id: uso.id, ok: true, titulo: plano.titulo, resumo: feito, ligacoes: plano.ligacoes });
      resultados.push(resultado(uso.id, `Executado. ${feito}${nota}`));
    } else {
      eventos.push({ tipo: "executado", id: uso.id, ok: false, titulo: plano.titulo, resumo: `${r.erro} ${feito}`, ligacoes: plano.ligacoes });
      resultados.push(resultado(uso.id, `Falhou: ${r.erro} ${feito}${nota}`, true));
    }
  }
  return { resultados, eventos };
}

/* ---------------- O ciclo ---------------- */

export interface OpcoesAgente {
  cliente: Anthropic;
  ctx: Contexto;
  podeEscrever: boolean;
  /** O histórico já guardado no navegador. */
  historico: MensagemHistorico[];
  /** As mensagens novas deste pedido (texto do administrador e contexto, ou resultados das decisões). */
  novas: MensagemHistorico[];
  emitir: (e: EventoOrganizador) => void;
  sinal: AbortSignal;
}

export interface FimAgente {
  delta: MensagemHistorico[];
  motivo: MotivoFim;
  erro?: ErroOrganizador;
}

export async function correrAgente(o: OpcoesAgente): Promise<FimAgente> {
  const { cliente, ctx, podeEscrever, historico, emitir, sinal } = o;
  const delta: MensagemHistorico[] = [...o.novas];
  const ferramentas = definicoesFerramentas(podeEscrever);
  const sistema = promptSistema();
  let falhasJson = 0;

  for (let volta = 0; volta < MAX_ITERACOES; volta++) {
    let final: Anthropic.Beta.BetaMessage;
    try {
      const stream = cliente.beta.messages.stream(
        {
          model: MODELO,
          max_tokens: MAX_TOKENS,
          betas: BETAS,
          // Se os filtros de segurança recusarem por engano, outro modelo continua.
          fallbacks: "default",
          // O raciocínio fica escondido; as notas de progresso chegam como texto.
          // Um bloco que não bata certo com o histórico é descartado em vez de falhar.
          thinking: { type: "adaptive", display: "updates", block_binding: { prefix_mismatch_behavior: "drop_block" } },
          output_config: { effort: "medium" },
          // Prompt e ferramentas em cache (fixos), e a conversa em cache automática.
          system: [{ type: "text", text: sistema, cache_control: { type: "ephemeral" } }],
          cache_control: { type: "ephemeral" },
          tools: ferramentas,
          context_management: {
            edits: [{
              type: "clear_tool_uses_20250919",
              trigger: { type: "input_tokens", value: 80_000 },
              keep: { type: "tool_uses", value: 6 },
              exclude_tools: NOMES_ESCRITA,
            }],
          },
          messages: [...historico, ...delta],
        },
        { signal: sinal },
      );

      let progressoAberto = false;
      for await (const ev of stream) {
        if (ev.type === "content_block_start") {
          progressoAberto = false;
          if (ev.content_block.type === "tool_use") {
            emitir({ tipo: "ferramenta", id: ev.content_block.id, nome: ev.content_block.name, rotulo: rotuloInicial(ev.content_block.name) });
          }
        } else if (ev.type === "content_block_delta") {
          if (ev.delta.type === "text_delta") {
            emitir({ tipo: "texto", texto: ev.delta.text });
          } else if (ev.delta.type === "thinking_delta" && ev.delta.thinking) {
            emitir({ tipo: "progresso", texto: ev.delta.thinking, novo: !progressoAberto });
            progressoAberto = true;
          }
        }
      }
      final = await stream.finalMessage();
      falhasJson = 0;
    } catch (e) {
      // Com eager_input_streaming, uma entrada de ferramenta que não é JSON
      // rejeita a volta: repete-se (só esse caso, e poucas vezes).
      if (!(e instanceof Anthropic.APIError) && !(e instanceof ErroOrganizador) && !sinal.aborted
        && e instanceof Anthropic.AnthropicError && falhasJson < TENTATIVAS_JSON) {
        falhasJson++;
        volta--;
        continue;
      }
      return { delta, motivo: "erro", erro: traduzirErro(e) };
    }

    if (final.stop_reason === "refusal") {
      // Recusa (também do modelo de recurso): a volta não fica no histórico.
      return {
        delta, motivo: "recusa",
        erro: new ErroOrganizador("O Claude não quis seguir com este pedido. Reformule-o ou divida-o em partes.", 422),
      };
    }

    const conteudo = limparFallback(final.content as unknown as Bloco[]);
    delta.push({ role: "assistant", content: conteudo });
    const usos = usosDe(delta[delta.length - 1]);

    if (final.stop_reason === "max_tokens" || final.stop_reason === "model_context_window_exceeded") {
      // Uma chamada cortada a meio não corre.
      if (usos.length) delta.pop();
      return { delta, motivo: "cortado" };
    }
    if (final.stop_reason === "pause_turn") continue;
    if (usos.length === 0) return { delta, motivo: "concluido" };

    const { resultados, propostas } = await processarUsos(usos, ctx, podeEscrever, emitir);
    if (propostas.length) return { delta, motivo: "aguarda-aprovacao" };
    delta.push({ role: "user", content: resultados });
    if (sinal.aborted) return { delta, motivo: "erro", erro: traduzirErro(new DOMException("abort", "AbortError")) };
  }

  // Limite de voltas: os resultados ficam, e o administrador pode pedir para continuar.
  return { delta, motivo: "limite" };
}
