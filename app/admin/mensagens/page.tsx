"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin/store";
import { formatDataCurta } from "@/lib/data";
import {
  CabecalhoPagina, Painel, Ferramentas, Procura, Seleccao, Estatistica,
  Gaveta, Campo, Area, useAviso, Confirmar,
} from "@/components/admin/kit";
import type { Mensagem } from "@/lib/admin/types";

export default function AdminMensagens() {
  const { estado, atualizar, remover, registar } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const [procura, setProcura] = useState("");
  const [vista, setVista] = useState("entrada");
  const [aberta, setAberta] = useState<Mensagem | null>(null);
  const [resposta, setResposta] = useState("");
  const [aApagar, setAApagar] = useState<Mensagem | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  const filtradas = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.mensagens
      .filter((m) => {
        if (vista === "entrada" && m.arquivada) return false;
        if (vista === "arquivo" && !m.arquivada) return false;
        if (vista === "porler" && (m.lida || m.arquivada)) return false;
        if (q && !`${m.nome} ${m.email} ${m.assunto} ${m.mensagem}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.recebido.localeCompare(a.recebido));
  }, [estado.mensagens, procura, vista]);

  const contagem = useMemo(() => ({
    porLer: estado.mensagens.filter((m) => !m.lida && !m.arquivada).length,
    entrada: estado.mensagens.filter((m) => !m.arquivada).length,
    arquivo: estado.mensagens.filter((m) => m.arquivada).length,
  }), [estado.mensagens]);

  const abrir = (m: Mensagem) => {
    setAberta(m);
    setResposta(m.resposta ?? "");
    if (!m.lida) atualizar("mensagens", m.id, { lida: true });
  };

  /** Só guarda o texto, sem enviar: serve de rascunho. */
  const guardarRascunho = async (m: Mensagem) => {
    const falha = await atualizar("mensagens", m.id, { resposta, lida: true });
    if (falha) { mostrar(falha, "erro"); return; }
    mostrar("Rascunho guardado. Ainda não foi enviado.");
    setAberta(null);
  };

  /** Envia a resposta por email a quem escreveu e depois guarda-a na mensagem. */
  const enviarResposta = async (m: Mensagem) => {
    if (resposta.trim().length < 2) { mostrar("Escreva a resposta antes de enviar.", "erro"); return; }
    setAEnviar(true);
    try {
      const r = await fetch("/api/admin/responder-mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, resposta }),
      });
      const j = await r.json().catch(() => ({ erro: `Erro ${r.status}` }));
      if (!r.ok) { mostrar(String(j.erro ?? `Erro ${r.status}`), "erro"); return; }
      const falha = await atualizar("mensagens", m.id, { resposta, lida: true, respondidaEm: j.enviadoEm });
      registar("respondeu por email", "Mensagem", m.assunto);
      mostrar(falha ? `Email enviado, mas a resposta não ficou guardada: ${falha}` : `Resposta enviada para ${m.email}.`, falha ? "erro" : "ok");
      setAberta(null);
    } catch {
      mostrar("Sem ligação ao servidor. A resposta não foi enviada.", "erro");
    } finally {
      setAEnviar(false);
    }
  };

  const arquivar = (m: Mensagem, valor: boolean) => {
    atualizar("mensagens", m.id, { arquivada: valor });
    mostrar(valor ? "Mensagem arquivada." : "Mensagem reposta na entrada.");
    setAberta(null);
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Mensagens"
        descricao="Pedidos recebidos pelo formulário de contacto do site."
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Estatistica rotulo="Por ler" valor={contagem.porLer} tom={contagem.porLer ? "red" : "neutral"} />
        <Estatistica rotulo="Caixa de entrada" valor={contagem.entrada} />
        <Estatistica rotulo="Arquivadas" valor={contagem.arquivo} />
      </div>

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Nome, assunto ou conteúdo…" />
          <Seleccao valor={vista} onChange={setVista} aria-label="Vista"
            opcoes={[
              { valor: "entrada", nome: "Caixa de entrada" },
              { valor: "porler", nome: "Por ler" },
              { valor: "arquivo", nome: "Arquivo" },
              { valor: "", nome: "Todas" },
            ]}
            className="w-auto min-w-[170px]" />
        </Ferramentas>

        {filtradas.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-500">Sem mensagens nesta vista.</p>
        ) : (
          <ul className="divide-y divide-ink-800">
            {filtradas.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => abrir(m)}
                  className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-ink-850">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${m.lida ? "bg-ink-700" : "bg-mb-red"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className={`truncate ${m.lida ? "text-ink-300" : "font-medium text-white"}`}>{m.nome}</p>
                      <p className="truncate text-xs text-ink-500">{m.email}</p>
                      <span className="ml-auto shrink-0 text-xs text-ink-500">{formatDataCurta(m.recebido)}</span>
                    </div>
                    <p className={`mt-0.5 truncate text-sm ${m.lida ? "text-ink-400" : "text-ink-200"}`}>{m.assunto}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">{m.mensagem}</p>
                    {m.respondidaEm
                      ? <p className="mt-1 text-[11px] text-ok">Respondida por email · {formatDataCurta(m.respondidaEm)}</p>
                      : m.resposta && <p className="mt-1 text-[11px] text-gold">Resposta por enviar</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Painel>

      <Gaveta
        aberta={aberta !== null}
        aoFechar={() => setAberta(null)}
        titulo={aberta?.assunto ?? ""}
        descricao={aberta ? `${aberta.nome} · ${aberta.email}` : undefined}
        largura="max-w-xl"
        rodape={aberta && (
          <>
            <button type="button" onClick={() => setAApagar(aberta)}
              className="mr-auto h-10 border border-ink-700 px-3 font-display text-xs uppercase tracking-wider text-ink-400 transition-colors hover:border-mb-red hover:text-white">
              Apagar
            </button>
            <button type="button" onClick={() => arquivar(aberta, !aberta.arquivada)}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-ink-800">
              {aberta.arquivada ? "Repor" : "Arquivar"}
            </button>
            <button type="button" onClick={() => void guardarRascunho(aberta)} disabled={aEnviar}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-ink-800 disabled:opacity-60">
              Guardar rascunho
            </button>
            <button type="button" onClick={() => void enviarResposta(aberta)} disabled={aEnviar}
              className="h-10 bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark disabled:opacity-60">
              {aEnviar ? "A enviar…" : aberta.respondidaEm ? "Enviar de novo" : "Enviar resposta"}
            </button>
          </>
        )}
      >
        {aberta && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 border border-ink-700 bg-ink-950 p-3 text-sm">
              <div><p className="text-[10px] uppercase tracking-widest text-ink-500">Recebida</p><p className="text-white">{formatDataCurta(aberta.recebido)}</p></div>
              {aberta.telefone && <div><p className="text-[10px] uppercase tracking-widest text-ink-500">Telefone</p><p className="text-white">{aberta.telefone}</p></div>}
            </div>

            <div className="border border-ink-700 bg-ink-950 p-3">
              <p className="mb-1.5 text-[10px] uppercase tracking-widest text-ink-500">Mensagem</p>
              <p className="whitespace-pre-wrap text-sm text-ink-200">{aberta.mensagem}</p>
            </div>

            {aberta.respondidaEm && (
              <p className="border-l-2 border-ok pl-3 text-sm text-ink-300">
                Resposta enviada para {aberta.email} em {formatDataCurta(aberta.respondidaEm)}.
              </p>
            )}

            <Campo etiqueta="Resposta"
              ajuda={`"Enviar resposta" manda este texto por email para ${aberta.email}, com a mensagem original citada. Se a pessoa responder, a resposta chega ao email de contacto das Definições.`}>
              <Area rows={6} value={resposta} onChange={(e) => setResposta(e.target.value)}
                placeholder="Escreva a resposta…" />
            </Campo>

            <a href={`mailto:${aberta.email}?subject=${encodeURIComponent(`Re: ${aberta.assunto}`)}&body=${encodeURIComponent(resposta)}`}
              className="inline-flex h-10 items-center border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red">
              Responder pelo meu programa de email
            </a>
          </div>
        )}
      </Gaveta>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={() => {
          if (aApagar) { remover("mensagens", aApagar.id); setAberta(null); mostrar("Mensagem apagada."); }
        }}
        titulo="Apagar mensagem"
        mensagem="A mensagem será removida permanentemente."
        textoConfirmar="Apagar"
        perigo
      />

      {elemento}
    </>
  );
}
