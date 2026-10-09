import "server-only";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA: executar o que foi aprovado
   Corre as operações de um plano, pela ordem, com as mesmas
   funções que a API de administração usa. Cada operação feita
   fica no registo de actividade (tabela `atividade`) em nome de
   quem aprovou, e o site é revalidado no fim. Se uma operação
   falhar, as seguintes não correm e o resultado diz o que já
   ficou feito.
   ============================================================ */

import { randomUUID } from "node:crypto";
import type { RegistoAtividade } from "@/lib/admin/types";
import { escapar, primeiroNome } from "@/lib/email";
import { DOCS, GRUPOS } from "@/lib/conteudo/registo";
import { chaveItem, chaveLista, listaGravada, resolverGrupo } from "@/lib/conteudo/resolver";
import { NOMES, tituloDe } from "./campos";
import { ErroDados, type Repositorio } from "./repositorio";
import type { Op, Plano } from "./planos";
import type { Quem } from "./sessao";

export interface ResultadoExecucao {
  ok: boolean;
  feitas: string[];
  erro?: string;
}

/** Frase curta de uma operação, para o resultado e para a actividade. */
function descrever(op: Op): { accao: string; entidade: string; detalhe: string } {
  switch (op.tipo) {
    case "inserir": return { accao: "criou", entidade: NOMES[op.coleccao].um, detalhe: tituloDe(op.registo) };
    case "actualizar": return { accao: "editou", entidade: NOMES[op.coleccao].um, detalhe: op.nome };
    case "apagar": return { accao: "removeu", entidade: NOMES[op.coleccao].um, detalhe: op.nome };
    case "publicado": return { accao: op.publicado ? "publicou" : "escondeu", entidade: NOMES[op.coleccao].um, detalhe: op.nome };
    case "definicoes": return { accao: "atualizou", entidade: "Definições", detalhe: Object.keys(op.campos).join(", ") };
    case "conteudo-doc": return { accao: "editou", entidade: "Conteúdo", detalhe: op.titulo };
    case "conteudo-item": return { accao: "editou", entidade: `Conteúdo: ${GRUPOS.get(op.grupo)?.titulo ?? op.grupo}`, detalhe: op.titulo };
    case "conteudo-repor": return { accao: "repôs", entidade: "Conteúdo", detalhe: op.titulo };
    case "conteudo-item-repor": return { accao: op.retirar ? "retirou" : "repôs", entidade: `Conteúdo: ${GRUPOS.get(op.grupo)?.titulo ?? op.grupo}`, detalhe: op.titulo };
    case "responder": return { accao: "respondeu", entidade: "Mensagem", detalhe: `${op.assunto} (${op.para})` };
  }
}

const paragrafos = (texto: string) =>
  texto.trim().split(/\n{2,}/).map((p) => `<p style="margin:0 0 12px">${escapar(p).replace(/\n/g, "<br>")}</p>`).join("\n");

/** Envia a resposta a uma mensagem de contacto, como /api/admin/responder-mensagem. */
async function responder(repo: Repositorio, op: Extract<Op, { tipo: "responder" }>) {
  const m = (await repo.listar("mensagens")).find((x) => x.id === op.mensagemId);
  if (!m) throw new ErroDados("Esta mensagem já não existe.", 404);
  const cfg = await repo.configEmails();
  const primeiro = primeiroNome(m.nome);
  const assuntoOriginal = String(m.assunto || "A sua mensagem");
  const t = cfg.modelo("resposta", { assunto: assuntoOriginal });
  const assunto = /^re:/i.test(assuntoOriginal) ? assuntoOriginal : (t.assunto || `Re: ${assuntoOriginal}`);
  const assinatura = t.rodape || cfg.nomeSite;
  const original = String(m.mensagem ?? "");
  const html = `<!doctype html>
<html lang="pt-AO"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:560px;margin:0 auto;padding:24px 20px;font-family:Arial,Helvetica,sans-serif;color:#111111;font-size:15px;line-height:1.55">
<p style="margin:0 0 20px;font-weight:700;letter-spacing:1px">MOTOBOX <span style="color:#e10600">ANGOLA</span></p>
<p style="margin:0 0 12px">${escapar(primeiro ? `Olá, ${primeiro}.` : "Olá.")}</p>
${paragrafos(op.resposta)}
<p style="margin:20px 0 0">${escapar(assinatura).replace(/\n/g, "<br>")}</p>
<hr style="border:none;border-top:1px solid #dddddd;margin:24px 0 12px">
<p style="margin:0 0 6px;font-size:12px;color:#777777">A sua mensagem:</p>
<div style="font-size:13px;color:#555555;border-left:3px solid #dddddd;padding-left:12px">${paragrafos(original)}</div>
</div>
</body></html>`;
  const texto = [
    primeiro ? `Olá, ${primeiro}.` : "Olá.", "", op.resposta, "", assinatura, "", "-----", "A sua mensagem:", original,
  ].join("\n");
  const r = await repo.enviarEmail({ para: String(m.email), assunto, html, texto, tipo: "resposta" }, cfg);
  if (!r.ok) throw new ErroDados(`${r.erro} A resposta ficou por enviar.`, 502);
  await repo.actualizar("mensagens", op.mensagemId, { resposta: op.resposta, lida: true, respondidaEm: new Date().toISOString() });
}

/** Grava um item de um grupo, como o PUT de /api/admin/conteudo. */
async function gravarItem(repo: Repositorio, op: Extract<Op, { tipo: "conteudo-item" }>) {
  const mapa = await repo.conteudoLinhas();
  let lista = listaGravada(op.grupo, mapa) ?? resolverGrupo(op.grupo, mapa).itens.map((i) => i.chave);
  if (!lista.includes(op.item)) lista = [...lista, op.item];
  await repo.conteudoGravar(chaveItem(op.grupo, op.item), op.titulo, op.dados, op.grupo);
  await repo.conteudoGravar(chaveLista(op.grupo), `Lista: ${GRUPOS.get(op.grupo)?.titulo ?? op.grupo}`, { chaves: [...new Set(lista)] }, "conteudo");
}

/** Repõe ou retira um item de um grupo, como o DELETE de /api/admin/conteudo. */
async function reporItem(repo: Repositorio, op: Extract<Op, { tipo: "conteudo-item-repor" }>) {
  if (op.retirar) {
    const mapa = await repo.conteudoLinhas();
    const lista = listaGravada(op.grupo, mapa) ?? resolverGrupo(op.grupo, mapa).itens.map((i) => i.chave);
    await repo.conteudoGravar(chaveLista(op.grupo), `Lista: ${GRUPOS.get(op.grupo)?.titulo ?? op.grupo}`, { chaves: [...new Set(lista.filter((c) => c !== op.item))] }, "conteudo");
  }
  await repo.conteudoApagar(chaveItem(op.grupo, op.item));
}

async function correr(repo: Repositorio, op: Op): Promise<void> {
  switch (op.tipo) {
    case "inserir": {
      const registo = { ...op.registo };
      const agora = new Date().toISOString();
      for (const k of op.carimbos ?? []) if (!registo[k]) registo[k] = agora;
      await repo.inserir(op.coleccao, registo);
      return;
    }
    case "actualizar": return repo.actualizar(op.coleccao, op.id, op.campos);
    case "apagar": return repo.apagar(op.coleccao, op.id);
    case "publicado": return repo.definirPublicado(op.coleccao, op.id, op.publicado);
    case "definicoes": return repo.gravarDefinicoes(op.campos);
    case "conteudo-doc":
      await repo.conteudoGravar(op.chave, op.titulo || DOCS.get(op.chave)?.titulo || op.chave, op.dados, "conteudo");
      return;
    case "conteudo-item": return gravarItem(repo, op);
    case "conteudo-repor": return repo.conteudoApagar(op.chave);
    case "conteudo-item-repor": return reporItem(repo, op);
    case "responder": return responder(repo, op);
  }
}

/** Executa um plano aprovado. Nunca lança: devolve o que ficou feito e o erro, se houve. */
export async function executarPlano(repo: Repositorio, quem: Quem, plano: Plano): Promise<ResultadoExecucao> {
  if (!repo.podeGravar) {
    return { ok: false, feitas: [], erro: "Sem base de dados ligada (modo de demonstração): nada foi gravado." };
  }
  const feitas: string[] = [];
  const utilizador = `${quem.nome || "Equipa MotoBox"} (Organizador IA)`;
  try {
    for (const op of plano.ops) {
      await correr(repo, op);
      const d = descrever(op);
      feitas.push(`${d.accao} ${d.entidade.toLowerCase()} «${d.detalhe}»`);
      const linha: RegistoAtividade = {
        id: `a-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`,
        quando: new Date().toISOString(),
        utilizador, accao: d.accao, entidade: d.entidade, detalhe: d.detalhe,
      };
      await repo.registarAtividade(linha);
    }
    return { ok: true, feitas };
  } catch (e) {
    const erro = e instanceof Error ? e.message : "Falha inesperada.";
    console.error("[organizador] falha ao executar", e);
    return { ok: false, feitas, erro };
  } finally {
    if (feitas.length) repo.revalidar();
  }
}
