"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin, novoId } from "@/lib/admin/store";
import { useAuth } from "@/lib/auth/contexto";
import { formatDataCurta } from "@/lib/data";
import {
  CabecalhoPagina, Painel, Ferramentas, Procura, Seleccao, Estatistica,
  Tabela, Linha, Cel, AccaoIcone, Campo, Input, useAviso, usePaginacao, Confirmar,
  Interruptor, Gaveta,
} from "@/components/admin/kit";
import type { Subscritor } from "@/lib/admin/types";
import { comBase } from "@/lib/base";

const ORIGENS = ["rodapé", "faixa", "cartão", "checkout", "manual"];

/** Resposta de GET /api/admin/newsletter. */
interface InfoEnvio {
  assunto: string;
  html: string;
  semana: { inicio: string; fim: string; rotulo: string };
  vazio: boolean;
  seccoes: { noticias: number; eventos: number; corridas: number; pilotosNovos: number };
  destinatarios: number;
  automatico: { ligado: boolean; colunaExiste: boolean };
  ultimoEnvio: { quando: string; detalhe: string; utilizador: string } | null;
}

const botaoSecundario =
  "h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red disabled:opacity-50";
const botaoPrincipal =
  "h-10 bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark disabled:opacity-50";

const quandoLuanda = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    timeZone: "Africa/Luanda",
  });

/** Próxima segunda-feira às 08:00 UTC (09:00 em Luanda), a hora do cron. */
function proximoEnvio(): Date {
  const agora = new Date();
  const d = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate(), 8));
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7));
  if (d <= agora) d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

async function lerInfo(): Promise<{ info: InfoEnvio } | { erro: string }> {
  try {
    const r = await fetch(comBase("/api/admin/newsletter"), { cache: "no-store" });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) return { erro: String(j?.erro ?? `HTTP ${r.status}`) };
    return { info: j as InfoEnvio };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha de rede" };
  }
}

function conteudoSemana(s: InfoEnvio["seccoes"]): string {
  const p = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  return [
    p(s.noticias, "notícia", "notícias"),
    p(s.corridas, "resultado", "resultados"),
    p(s.eventos, "evento", "eventos"),
    p(s.pilotosNovos, "piloto novo", "pilotos novos"),
  ].join(" · ");
}

export default function AdminNewsletter() {
  const { estado, criar, atualizar, remover, guardarDefinicoes } = useAdmin();
  const { perfil } = useAuth();
  const { mostrar, elemento } = useAviso();

  /* ---------- Envio semanal ---------- */
  const [info, setInfo] = useState<InfoEnvio | null>(null);
  const [erroInfo, setErroInfo] = useState<string | null>(null);
  const [aVer, setAVer] = useState(false);
  const [aConfirmarEnvio, setAConfirmarEnvio] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);

  const aplicarInfo = useCallback((r: Awaited<ReturnType<typeof lerInfo>>) => {
    if ("info" in r) { setInfo(r.info); setErroInfo(null); }
    else setErroInfo(r.erro);
  }, []);
  const carregarInfo = useCallback(() => lerInfo().then(aplicarInfo), [aplicarInfo]);

  useEffect(() => {
    let vivo = true;
    lerInfo().then((r) => { if (vivo) aplicarInfo(r); });
    return () => { vivo = false; };
  }, [aplicarInfo]);

  const automatica = estado.definicoes.newsletterAutomatica !== false;
  const colunaEmFalta = info?.automatico.colunaExiste === false;

  // O registo do servidor é o mais fiel; a lista do painel serve de reserva.
  const ultimoLocal = useMemo(
    () => estado.atividade
      .filter((a) => a.entidade === "Newsletter" && a.accao === "enviou")
      .sort((a, b) => b.quando.localeCompare(a.quando))[0],
    [estado.atividade],
  );
  const ultimo = info?.ultimoEnvio ?? ultimoLocal ?? null;

  const alternarAutomatico = async (v: boolean) => {
    const falha = await guardarDefinicoes({ newsletterAutomatica: v });
    if (falha) mostrar(falha, "erro");
    else mostrar(v ? "Envio automático ligado." : "Envio automático desligado.");
  };

  const enviarAgora = async () => {
    setAEnviar(true);
    try {
      const r = await fetch(comBase("/api/admin/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utilizador: perfil?.nome ?? "" }),
      });
      const j = await r.json().catch(() => null) as { estado?: string; mensagem?: string; enviados?: number; destinatarios?: number } | null;
      if (j?.estado === "enviada") mostrar(`Newsletter enviada: ${j.enviados} de ${j.destinatarios} emails.`);
      else mostrar(j?.mensagem ?? `Falha no envio (HTTP ${r.status}).`, "erro");
      void carregarInfo();
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Falha de rede", "erro");
    } finally {
      setAEnviar(false);
    }
  };

  const [procura, setProcura] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [aApagar, setAApagar] = useState<Subscritor | null>(null);

  const filtrados = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.subscritores
      .filter((s) => {
        if (filtroOrigem && s.origem !== filtroOrigem) return false;
        if (q && !`${s.email} ${s.nome ?? ""}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.subscrito.localeCompare(a.subscrito));
  }, [estado.subscritores, procura, filtroOrigem]);

  const { fatia, controlos } = usePaginacao(filtrados, 15);

  const activos = estado.subscritores.filter((s) => s.ativo).length;

  const adicionar = async () => {
    const email = novoEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) { mostrar("Introduza um email válido.", "erro"); return; }
    if (estado.subscritores.some((s) => s.email.toLowerCase() === email)) {
      mostrar("Esse email já está subscrito.", "erro"); return;
    }
    const falha = await criar("subscritores", {
      id: novoId("s"), email, nome: novoNome.trim() || undefined,
      origem: "manual", subscrito: new Date().toISOString().slice(0, 10), ativo: true,
    } as unknown as Record<string, unknown>);
    if (falha) { mostrar(falha, "erro"); return; }
    setNovoEmail(""); setNovoNome("");
    mostrar("Subscritor adicionado.");
  };

  const exportar = () => {
    const csv = [
      ["Email", "Nome", "Origem", "Subscrito", "Ativo"],
      ...filtrados.map((s) => [s.email, s.nome ?? "", s.origem, s.subscrito, s.ativo ? "Sim" : "Não"]),
    ].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-motobox-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrar(`${filtrados.length} contactos exportados.`);
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Newsletter"
        descricao="Lista de subscritores e origem da subscrição."
        accoes={
          <button type="button" onClick={exportar}
            className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red">
            Exportar CSV
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Estatistica rotulo="Subscritores activos" valor={activos} tom="ok" />
        <Estatistica rotulo="Total de registos" valor={estado.subscritores.length} />
        <Estatistica rotulo="Cancelaram" valor={estado.subscritores.length - activos} />
      </div>

      <Painel
        titulo="Envio automático"
        descricao="Resumo semanal com as notícias, os resultados, os próximos eventos e os pilotos."
        className="mb-4"
        accoes={
          <>
            <button type="button" className={botaoSecundario} disabled={!info}
              onClick={() => { setAVer(true); void carregarInfo(); }}>
              Pré-visualizar
            </button>
            <button type="button" className={botaoPrincipal} disabled={aEnviar || !info}
              onClick={() => setAConfirmarEnvio(true)}>
              {aEnviar ? "A enviar…" : "Enviar agora"}
            </button>
          </>
        }
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <Interruptor
              etiqueta="Enviar todas as semanas"
              descricao="Todas as segundas-feiras às 09:00 (hora de Luanda)."
              activo={automatica}
              disabled={colunaEmFalta}
              onChange={alternarAutomatico}
            />
            {colunaEmFalta && (
              <p className="mt-1.5 text-[11px] text-ink-500">
                Para poder desligar, corra primeiro a migração <span className="text-ink-300">supabase/migracao-2026-09.sql</span> no Supabase. Até lá o envio fica ligado.
              </p>
            )}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border border-ink-700/60 bg-ink-950 px-3 py-3 text-sm">
            <dt className="text-[11px] font-display uppercase tracking-widest text-ink-400">Último envio</dt>
            <dd className="text-white">
              {ultimo ? (
                <>
                  <span className="first-letter:uppercase">{quandoLuanda(ultimo.quando)}</span>
                  <span className="block text-xs text-ink-400">{ultimo.detalhe}{ultimo.utilizador ? ` · ${ultimo.utilizador}` : ""}</span>
                </>
              ) : (
                <span className="text-ink-400">Ainda não saiu nenhuma.</span>
              )}
            </dd>
            <dt className="text-[11px] font-display uppercase tracking-widest text-ink-400">Próximo</dt>
            <dd className="text-white" suppressHydrationWarning>
              {automatica ? quandoLuanda(proximoEnvio().toISOString()) : <span className="text-ink-400">Desligado</span>}
            </dd>
            <dt className="text-[11px] font-display uppercase tracking-widest text-ink-400">Esta semana</dt>
            <dd className={info?.vazio ? "text-gold" : "text-white"}>
              {erroInfo ? (
                <span className="text-mb-red">{erroInfo}</span>
              ) : !info ? (
                <span className="text-ink-400">A preparar…</span>
              ) : info.vazio ? (
                "Sem novidades por agora: se continuar assim, o envio é saltado."
              ) : (
                conteudoSemana(info.seccoes)
              )}
            </dd>
            <dt className="text-[11px] font-display uppercase tracking-widest text-ink-400">Destinatários</dt>
            <dd className="tabular-nums text-white">{info ? info.destinatarios : activos} subscritores activos</dd>
          </dl>
        </div>

        <p className="mt-3 border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
          Enquanto não houver um domínio verificado na Resend, os emails só chegam a motoboxweb@gmail.com.
          Os restantes subscritores começam a receber quando o domínio estiver verificado.
        </p>
      </Painel>

      <Painel titulo="Juntar subscritor" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-[2fr_2fr_auto]">
          <Campo etiqueta="Email">
            <Input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="nome@exemplo.com"
              onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }} />
          </Campo>
          <Campo etiqueta="Nome (opcional)">
            <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do subscritor" />
          </Campo>
          <div className="flex items-end">
            <button type="button" onClick={adicionar}
              className="h-10 w-full bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark sm:w-auto">
              Juntar
            </button>
          </div>
        </div>
      </Painel>

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Email ou nome…" />
          <Seleccao valor={filtroOrigem} onChange={setFiltroOrigem} aria-label="Origem"
            opcoes={[{ valor: "", nome: "Todas as origens" }, ...ORIGENS.map((o) => ({ valor: o, nome: o }))]}
            className="w-auto min-w-[160px]" />
        </Ferramentas>

        <Tabela cabecalhos={["Email", "Nome", "Origem", "Subscrito", "Estado", "Ações"]} vazio={fatia.length === 0}>
          {fatia.map((s) => (
            <Linha key={s.id}>
              <Cel className="text-white">{s.email}</Cel>
              <Cel className="text-ink-300">{s.nome ?? ""}</Cel>
              <Cel className="text-ink-400">{s.origem}</Cel>
              <Cel className="tabular-nums text-ink-400">{formatDataCurta(s.subscrito)}</Cel>
              <Cel>
                <button type="button"
                  onClick={() => atualizar("subscritores", s.id, { ativo: !s.ativo })}
                  className={`border px-2 py-0.5 text-[10px] font-display uppercase tracking-widest transition-colors ${
                    s.ativo
                      ? "border-ok/30 bg-ok/15 text-ok hover:bg-ok hover:text-white"
                      : "border-ink-600 text-ink-400 hover:border-ok hover:text-ok"
                  }`}>
                  {s.ativo ? "Activo" : "Cancelado"}
                </button>
              </Cel>
              <Cel className="w-16">
                <AccaoIcone titulo="Apagar" tom="perigo" onClick={() => setAApagar(s)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </AccaoIcone>
              </Cel>
            </Linha>
          ))}
        </Tabela>
        {controlos}
      </Painel>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={() => {
          if (aApagar) { remover("subscritores", aApagar.id); mostrar("Subscritor removido."); }
        }}
        titulo="Remover subscritor"
        mensagem="O contacto será apagado da lista de newsletter."
        textoConfirmar="Remover"
        perigo
      />

      <Gaveta
        aberta={aVer}
        aoFechar={() => setAVer(false)}
        titulo="Pré-visualização"
        descricao={info ? `Assunto: ${info.assunto}` : undefined}
        largura="max-w-3xl"
        rodape={
          <>
            <button type="button" className={botaoSecundario} onClick={() => setAVer(false)}>Fechar</button>
            <button type="button" className={botaoPrincipal} disabled={aEnviar || !info}
              onClick={() => setAConfirmarEnvio(true)}>
              Enviar agora
            </button>
          </>
        }
      >
        {info ? (
          <>
            <p className="mb-3 text-xs text-ink-400">
              Com o conteúdo de hoje (semana de {info.semana.rotulo}). O envio de segunda-feira usa o conteúdo desse dia.
              {info.vazio && <span className="text-gold"> Esta semana ainda não há novidades: o envio automático seria saltado.</span>}
            </p>
            <iframe
              title="Pré-visualização do email da newsletter"
              // As ligações abrem noutro separador, sem sair do painel.
              srcDoc={info.html.replace("<head>", '<head><base target="_blank">')}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              className="h-[72vh] w-full border border-ink-700 bg-white"
            />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-ink-500">{erroInfo ?? "A preparar a pré-visualização…"}</p>
        )}
      </Gaveta>

      <Confirmar
        aberta={aConfirmarEnvio}
        aoFechar={() => setAConfirmarEnvio(false)}
        aoConfirmar={() => { void enviarAgora(); }}
        titulo="Enviar a newsletter agora"
        mensagem={`O resumo da semana de ${info?.semana.rotulo ?? ""} segue já para ${info?.destinatarios ?? activos} subscritores activos, mesmo que já tenha saído um envio esta semana. O envio automático de segunda-feira é saltado se for daqui a menos de 6 dias.`}
        textoConfirmar="Enviar agora"
      />

      {elemento}
    </>
  );
}
