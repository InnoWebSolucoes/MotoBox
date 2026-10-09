"use client";

/* ============================================================
   MOTOBOX ADMIN — Mensagens
   O que chega pelo formulário de /contacto. Abrir marca como
   lida; a resposta segue por email (com a mensagem original
   citada) e fica guardada na mensagem. Arquivar tira-a da
   caixa de entrada sem a apagar.
   ============================================================ */

import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, Inbox, Mail, Phone, Send, Trash2 } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import {
  Abas, Area, Botao, CabecalhoPagina, Campo, Confirmar, Estatistica, Etiqueta, Ferramentas, Gaveta,
  Painel, Procura, Vazio, useAviso, usePaginacao,
} from "@/components/admin/kit";
import type { Mensagem } from "@/lib/admin/types";
import { comBase } from "@/lib/base";
import { dataCurta, dataHora, haQuanto } from "../moderacao/_comum/formato";
import { Avatar, Ficha } from "../moderacao/_comum/partes";

type Vista = "entrada" | "porler" | "arquivo" | "todas";

export default function AdminMensagens() {
  const { estado, atualizar, remover, registar } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const [procura, setProcura] = useState("");
  const [vista, setVista] = useState<Vista>("entrada");
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
  const { fatia, controlos } = usePaginacao(filtradas, 20);

  const contagem = useMemo(() => ({
    porLer: estado.mensagens.filter((m) => !m.lida && !m.arquivada).length,
    entrada: estado.mensagens.filter((m) => !m.arquivada).length,
    arquivo: estado.mensagens.filter((m) => m.arquivada).length,
    respondidas: estado.mensagens.filter((m) => m.respondidaEm).length,
  }), [estado.mensagens]);

  const abrir = (m: Mensagem) => {
    setAberta(m);
    setResposta(m.resposta ?? "");
    if (!m.lida) void atualizar("mensagens", m.id, { lida: true });
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
      const r = await fetch(comBase("/api/admin/responder-mensagem"), {
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

  const arquivar = async (m: Mensagem, valor: boolean) => {
    const falha = await atualizar("mensagens", m.id, { arquivada: valor });
    mostrar(falha ?? (valor ? "Mensagem arquivada." : "Mensagem reposta na caixa de entrada."), falha ? "erro" : "ok");
    if (!falha) setAberta(null);
  };

  const marcarLida = async (m: Mensagem, lida: boolean) => {
    const falha = await atualizar("mensagens", m.id, { lida });
    if (falha) mostrar(falha, "erro");
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Mensagens"
        sobretitulo="Comunidade"
        icone={<Mail />}
        descricao="O que chega pelo formulário de contacto do site. Responda daqui: a resposta segue por email para quem escreveu."
      />

      <div className="mb-[var(--intervalo)] grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
        <Estatistica rotulo="Por ler" valor={contagem.porLer} tom={contagem.porLer ? "red" : "neutral"} icone={<Inbox />} />
        <Estatistica rotulo="Na caixa de entrada" valor={contagem.entrada} icone={<Mail />} />
        <Estatistica rotulo="Respondidas por email" valor={contagem.respondidas} tom="ok" icone={<Send />} />
        <Estatistica rotulo="Arquivadas" valor={contagem.arquivo} icone={<Archive />} />
      </div>

      <Painel>
        <div className="mb-4">
          <Abas<Vista>
            rotulo="Pastas"
            activa={vista}
            onChange={setVista}
            abas={[
              { chave: "entrada", nome: "Caixa de entrada", contador: contagem.entrada },
              { chave: "porler", nome: "Por ler", contador: contagem.porLer },
              { chave: "arquivo", nome: "Arquivo", contador: contagem.arquivo },
              { chave: "todas", nome: "Todas", contador: estado.mensagens.length },
            ]}
          />
        </div>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Nome, email, assunto ou texto…" />
        </Ferramentas>

        {filtradas.length === 0 ? (
          <Vazio titulo={vista === "porler" ? "Não há mensagens por ler" : "Sem mensagens aqui"}>
            {procura ? "Nenhuma mensagem corresponde à procura." : "Quando alguém escrever pelo formulário de contacto, a mensagem aparece aqui."}
          </Vazio>
        ) : (
          <ul className="divide-y divide-white/[0.07]">
            {fatia.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => abrir(m)}
                  className="group flex w-full items-start gap-3 rounded-[var(--raio)] px-2 py-3.5 text-left transition-colors hover:bg-white/[0.05]">
                  <span className="relative">
                    <Avatar nome={m.nome} cor={m.lida ? "#4a4a52" : "#e10600"} />
                    {!m.lida && <span className="sr-only">Por ler</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className={`truncate ${m.lida ? "text-white/75" : "font-semibold text-white"}`}>{m.nome}</span>
                      <span className="truncate text-xs text-white/70">{m.email}</span>
                      <span className="ml-auto shrink-0 text-xs text-white/70">{haQuanto(m.recebido)}</span>
                    </span>
                    <span className={`mt-0.5 block truncate text-sm ${m.lida ? "text-white/80" : "text-white"}`}>{m.assunto || "Sem assunto"}</span>
                    <span className="mt-0.5 block truncate text-xs text-white/70">{m.mensagem}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {m.respondidaEm
                        ? <Etiqueta tom="ok">Respondida a {dataCurta(m.respondidaEm)}</Etiqueta>
                        : m.resposta ? <Etiqueta tom="ouro">Resposta por enviar</Etiqueta> : null}
                      {m.arquivada && vista === "todas" && <Etiqueta>Arquivada</Etiqueta>}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {controlos}
      </Painel>

      <Gaveta
        aberta={aberta !== null}
        aoFechar={() => setAberta(null)}
        titulo={aberta?.assunto || "Mensagem"}
        descricao={aberta ? `De ${aberta.nome} · ${aberta.email}` : undefined}
        largura="max-w-2xl"
        rodape={aberta && (
          <>
            <Botao variante="perigo" className="mr-auto" onClick={() => setAApagar(aberta)}>
              <Trash2 className="size-4" aria-hidden />Apagar
            </Botao>
            <Botao variante="fantasma" onClick={() => void arquivar(aberta, !aberta.arquivada)}>
              {aberta.arquivada ? <><ArchiveRestore className="size-4" aria-hidden />Repor na entrada</> : <><Archive className="size-4" aria-hidden />Arquivar</>}
            </Botao>
            <Botao variante="secundario" onClick={() => void guardarRascunho(aberta)} disabled={aEnviar}>
              Guardar rascunho
            </Botao>
            <Botao variante="primario" onClick={() => void enviarResposta(aberta)} disabled={aEnviar}>
              <Send className="size-4" aria-hidden />
              {aEnviar ? "A enviar…" : aberta.respondidaEm ? "Enviar de novo" : "Enviar resposta"}
            </Botao>
          </>
        )}
      >
        {aberta && (
          <div className="space-y-5">
            <Ficha linhas={[
              ["Recebida", dataHora(aberta.recebido) || aberta.recebido],
              ["Email", <a key="e" href={`mailto:${aberta.email}`} className="sublinhado">{aberta.email}</a>],
              ...(aberta.telefone ? [["Telefone", <a key="t" href={`tel:${aberta.telefone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1.5"><Phone className="size-3.5" aria-hidden /><span className="sublinhado">{aberta.telefone}</span></a>] as [string, React.ReactNode]] : []),
            ]} />

            <div>
              <p className="mb-1.5 text-[13px] font-medium text-white/75">Mensagem</p>
              <div className="rounded-[var(--raio)] border border-white/10 bg-black/[0.18] p-4">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/90 [overflow-wrap:anywhere]">{aberta.mensagem}</p>
              </div>
            </div>

            {aberta.respondidaEm && (
              <p className="border-l-2 border-ok pl-3 text-sm text-white/70">
                Resposta enviada para {aberta.email} a {dataHora(aberta.respondidaEm)}.
              </p>
            )}

            <Campo etiqueta="Resposta"
              ajuda={`«Enviar resposta» manda este texto por email para ${aberta.email}, com a mensagem original citada. Se a pessoa responder, a resposta chega ao email de contacto das Definições.`}>
              <Area rows={7} value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Escreva a resposta…" />
            </Campo>

            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${aberta.email}?subject=${encodeURIComponent(`Re: ${aberta.assunto}`)}&body=${encodeURIComponent(resposta)}`}
                className="inline-flex h-9 items-center gap-2 rounded-[var(--raio)] bg-white/10 px-3 text-[13px] text-white transition-colors hover:bg-white/[0.16]">
                <Mail className="size-4" aria-hidden />
                Responder pelo meu programa de email
              </a>
              <Botao tamanho="sm" variante="fantasma" onClick={() => { void marcarLida(aberta, false); setAberta(null); }}>
                Marcar como por ler
              </Botao>
            </div>
          </div>
        )}
      </Gaveta>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={async () => {
          if (!aApagar) return;
          const falha = await remover("mensagens", aApagar.id);
          if (!falha) setAberta(null);
          mostrar(falha ?? "Mensagem apagada.", falha ? "erro" : "ok");
        }}
        titulo="Apagar mensagem"
        mensagem="A mensagem é apagada de vez. Para a tirar só da caixa de entrada, arquive-a."
        textoConfirmar="Apagar"
        perigo
      />

      {elemento}
    </>
  );
}
