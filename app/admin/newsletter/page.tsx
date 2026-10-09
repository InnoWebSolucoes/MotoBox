"use client";

/* ============================================================
   MOTOBOX ADMIN — Newsletter
   O resumo semanal (automático às segundas, pré-visualizar,
   enviar já) e a lista de subscritores (juntar, cancelar,
   apagar, exportar para CSV).
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, Plus, Send, Trash2, UserMinus, Users } from "lucide-react";
import { useAdmin, novoId } from "@/lib/admin/store";
import { useAuth } from "@/lib/auth/contexto";
import {
  Aviso, AccaoIcone, Botao, CabecalhoPagina, Campo, Cel, Confirmar, Estado, Estatistica, Ferramentas, Gaveta,
  Input, Interruptor, Linha, Painel, Procura, Seleccao, Tabela, useAviso, usePaginacao,
} from "@/components/admin/kit";
import type { Subscritor } from "@/lib/admin/types";
import { comBase } from "@/lib/base";
import { dataCurta } from "../moderacao/_comum/formato";

const ORIGENS: { valor: Subscritor["origem"]; nome: string }[] = [
  { valor: "rodapé", nome: "Rodapé do site" },
  { valor: "faixa", nome: "Faixa da newsletter" },
  { valor: "cartão", nome: "Cartão da newsletter" },
  { valor: "checkout", nome: "Compra de bilhetes" },
  { valor: "conta", nome: "Conta do site" },
  { valor: "manual", nome: "Juntado pela equipa" },
];
const nomeOrigem = (o: string) => ORIGENS.find((x) => x.valor === o)?.nome ?? o;

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

const quandoLuanda = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    timeZone: "Africa/Luanda",
  });

/** Próxima segunda-feira às 08:00 UTC (09:00 em Luanda), a hora do envio automático. */
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
    p(s.noticias, "artigo", "artigos"),
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
  // A data do próximo envio depende do relógio de quem vê: só depois de montar.
  const [proximo, setProximo] = useState<string | null>(null);

  const aplicarInfo = useCallback((r: Awaited<ReturnType<typeof lerInfo>>) => {
    if ("info" in r) { setInfo(r.info); setErroInfo(null); }
    else setErroInfo(/supabase não configurado/i.test(r.erro)
      ? "Sem base de dados nesta demonstração: o resumo só se prepara no site ligado."
      : r.erro);
  }, []);
  const carregarInfo = useCallback(() => lerInfo().then(aplicarInfo), [aplicarInfo]);

  useEffect(() => {
    let vivo = true;
    lerInfo().then((r) => { if (vivo) aplicarInfo(r); });
    const t = window.setTimeout(() => { if (vivo) setProximo(proximoEnvio().toISOString()); }, 0);
    return () => { vivo = false; window.clearTimeout(t); };
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

  /* ---------- Subscritores ---------- */
  const [procura, setProcura] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [aApagar, setAApagar] = useState<Subscritor | null>(null);

  const filtrados = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.subscritores
      .filter((s) => {
        if (filtroOrigem && s.origem !== filtroOrigem) return false;
        if (filtroEstado === "activos" && !s.ativo) return false;
        if (filtroEstado === "cancelados" && s.ativo) return false;
        if (q && !`${s.email} ${s.nome ?? ""}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.subscrito.localeCompare(a.subscrito));
  }, [estado.subscritores, procura, filtroOrigem, filtroEstado]);

  const { fatia, controlos } = usePaginacao(filtrados, 15);

  const activos = estado.subscritores.filter((s) => s.ativo).length;
  const esteMes = estado.subscritores.filter((s) => s.subscrito.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;

  const adicionar = async () => {
    const email = novoEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { mostrar("Escreva um email válido.", "erro"); return; }
    if (estado.subscritores.some((s) => s.email.toLowerCase() === email)) {
      mostrar("Esse email já está na lista.", "erro"); return;
    }
    const falha = await criar("subscritores", {
      id: novoId("s"), email, nome: novoNome.trim() || undefined,
      origem: "manual", subscrito: new Date().toISOString().slice(0, 10), ativo: true,
    } as unknown as Record<string, unknown>);
    if (falha) { mostrar(falha, "erro"); return; }
    setNovoEmail(""); setNovoNome("");
    mostrar("Subscritor juntado à lista.");
  };

  const alternarActivo = async (s: Subscritor) => {
    const falha = await atualizar("subscritores", s.id, { ativo: !s.ativo });
    mostrar(falha ?? (s.ativo ? `${s.email} deixa de receber a newsletter.` : `${s.email} volta a receber a newsletter.`), falha ? "erro" : "ok");
  };

  const exportar = () => {
    const csv = [
      ["Email", "Nome", "Origem", "Subscrito", "Activo"],
      ...filtrados.map((s) => [s.email, s.nome ?? "", nomeOrigem(s.origem), s.subscrito, s.ativo ? "Sim" : "Não"]),
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
        sobretitulo="Comunidade"
        icone={<Send />}
        descricao="O resumo semanal por email e a lista de quem o recebe."
        accoes={<Botao onClick={exportar}><Download className="size-4" aria-hidden />Exportar lista (CSV)</Botao>}
      />

      <div className="mb-[var(--intervalo)] grid grid-cols-1 gap-[var(--intervalo)] sm:grid-cols-3">
        <Estatistica rotulo="Recebem a newsletter" valor={activos} tom="ok" icone={<Users />}
          variacao={esteMes ? `${esteMes} subscreveram este mês` : undefined} />
        <Estatistica rotulo="Total na lista" valor={estado.subscritores.length} icone={<Send />} />
        <Estatistica rotulo="Cancelaram" valor={estado.subscritores.length - activos} icone={<UserMinus />} />
      </div>

      <Painel
        titulo="Resumo semanal"
        icone={<Send />}
        descricao="Os artigos, os resultados, os próximos eventos e os pilotos novos da semana, num só email."
        className="mb-[var(--intervalo)]"
        accoes={
          <>
            <Botao disabled={!info} onClick={() => { setAVer(true); void carregarInfo(); }}>
              <Eye className="size-4" aria-hidden />Pré-visualizar
            </Botao>
            <Botao variante="primario" disabled={aEnviar || !info} onClick={() => setAConfirmarEnvio(true)}>
              <Send className="size-4" aria-hidden />{aEnviar ? "A enviar…" : "Enviar agora"}
            </Botao>
          </>
        }
      >
        <div className="grid gap-[var(--intervalo)] lg:grid-cols-2">
          <div className="space-y-2">
            <Interruptor
              etiqueta="Enviar todas as semanas"
              descricao="Sai sozinho todas as segundas-feiras às 09:00 (hora de Luanda). Numa semana sem novidades, não sai."
              activo={automatica}
              disabled={colunaEmFalta}
              onChange={alternarAutomatico}
            />
            {colunaEmFalta && (
              <p className="text-xs leading-relaxed text-white/75">
                Para poder desligar, falta uma actualização da base de dados (supabase/migracao-2026-09.sql). Até lá, o envio fica ligado.
              </p>
            )}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 rounded-[var(--raio)] border border-white/10 bg-black/[0.15] px-4 py-3.5 text-sm">
            <dt className="text-white/75">Último envio</dt>
            <dd className="text-white">
              {ultimo ? (
                <>
                  <span className="first-letter:uppercase">{quandoLuanda(ultimo.quando)}</span>
                  <span className="block text-xs text-white/75">{ultimo.detalhe}{ultimo.utilizador ? ` · ${ultimo.utilizador}` : ""}</span>
                </>
              ) : (
                <span className="text-white/75">Ainda não saiu nenhuma.</span>
              )}
            </dd>
            <dt className="text-white/75">Próximo</dt>
            <dd className="text-white">
              {!automatica ? <span className="text-white/75">Desligado</span> : proximo ? quandoLuanda(proximo) : "…"}
            </dd>
            <dt className="text-white/75">Esta semana</dt>
            <dd className={info?.vazio ? "text-gold" : "text-white"}>
              {erroInfo ? (
                <span className="text-mb-red-light">{erroInfo}</span>
              ) : !info ? (
                <span className="text-white/75">A preparar…</span>
              ) : info.vazio ? (
                "Sem novidades por agora: se continuar assim, o envio é saltado."
              ) : (
                conteudoSemana(info.seccoes)
              )}
            </dd>
            <dt className="text-white/75">Para quem</dt>
            <dd className="tabular-nums text-white">{info ? info.destinatarios : activos} subscritores activos</dd>
          </dl>
        </div>

        <div className="mt-4">
          <Aviso tom="atencao">
            Enquanto não houver um domínio verificado no serviço de envio (Resend), os emails só chegam a motoboxweb@gmail.com.
            Os outros subscritores começam a receber quando o domínio estiver verificado.
          </Aviso>
        </div>
      </Painel>

      <Painel titulo="Juntar um subscritor" descricao="Para quem pediu para receber, por exemplo num evento." className="mb-[var(--intervalo)]">
        <div className="grid gap-3 sm:grid-cols-[2fr_2fr_auto]">
          <Campo etiqueta="Email">
            <Input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="nome@exemplo.com"
              onKeyDown={(e) => { if (e.key === "Enter") void adicionar(); }} />
          </Campo>
          <Campo etiqueta="Nome (opcional)">
            <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do subscritor" />
          </Campo>
          <div className="flex items-end">
            <Botao variante="primario" className="w-full sm:w-auto" onClick={() => void adicionar()}>
              <Plus className="size-4" aria-hidden />Juntar
            </Botao>
          </div>
        </div>
      </Painel>

      <Painel titulo="Subscritores">
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Email ou nome…" />
          <Seleccao valor={filtroEstado} onChange={setFiltroEstado} aria-label="Estado"
            opcoes={[{ valor: "", nome: "Activos e cancelados" }, { valor: "activos", nome: "Só activos" }, { valor: "cancelados", nome: "Só cancelados" }]}
            className="sm:w-52" />
          <Seleccao valor={filtroOrigem} onChange={setFiltroOrigem} aria-label="Onde subscreveu"
            opcoes={[{ valor: "", nome: "Todas as origens" }, ...ORIGENS]}
            className="sm:w-52" />
        </Ferramentas>

        <ul className="divide-y divide-white/[0.07] md:hidden">
          {fatia.length === 0 && <li className="py-10 text-center text-sm text-white/75">Nenhum subscritor corresponde aos filtros.</li>}
          {fatia.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{s.email}</p>
                <p className="truncate text-xs text-white/75">{[s.nome, nomeOrigem(s.origem), dataCurta(s.subscrito, true)].filter(Boolean).join(" · ")}</p>
              </div>
              <button type="button" onClick={() => void alternarActivo(s)} title={s.ativo ? "Cancelar a subscrição" : "Reactivar a subscrição"}>
                <Estado valor={s.ativo ? "ativo" : "arquivada"} rotulo={s.ativo ? "Activo" : "Cancelado"} />
              </button>
              <AccaoIcone titulo="Apagar da lista" tom="perigo" onClick={() => setAApagar(s)}>
                <Trash2 className="size-3.5" aria-hidden />
              </AccaoIcone>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
        <Tabela cabecalhos={["Email", "Nome", "Onde subscreveu", "Desde", "Estado", "Acções"]} vazio={fatia.length === 0}>
          {fatia.map((s) => (
            <Linha key={s.id}>
              <Cel className="text-white">{s.email}</Cel>
              <Cel className="text-white/70">{s.nome ?? ""}</Cel>
              <Cel className="text-white/80">{nomeOrigem(s.origem)}</Cel>
              <Cel className="whitespace-nowrap tabular-nums text-white/80">{dataCurta(s.subscrito, true)}</Cel>
              <Cel>
                <button type="button" onClick={() => void alternarActivo(s)} title={s.ativo ? "Cancelar a subscrição" : "Reactivar a subscrição"}>
                  <Estado valor={s.ativo ? "ativo" : "arquivada"} rotulo={s.ativo ? "Activo" : "Cancelado"} />
                </button>
              </Cel>
              <Cel className="w-px">
                <div className="flex justify-end gap-1.5">
                  <AccaoIcone titulo={s.ativo ? "Cancelar a subscrição" : "Reactivar a subscrição"} onClick={() => void alternarActivo(s)}>
                    <UserMinus className="size-3.5" aria-hidden />
                  </AccaoIcone>
                  <AccaoIcone titulo="Apagar da lista" tom="perigo" onClick={() => setAApagar(s)}>
                    <Trash2 className="size-3.5" aria-hidden />
                  </AccaoIcone>
                </div>
              </Cel>
            </Linha>
          ))}
        </Tabela>
        </div>
        {controlos}
      </Painel>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={async () => {
          if (!aApagar) return;
          const falha = await remover("subscritores", aApagar.id);
          mostrar(falha ?? "Subscritor apagado da lista.", falha ? "erro" : "ok");
        }}
        titulo="Apagar subscritor"
        mensagem="O contacto sai da lista de vez. Para só deixar de enviar, cancele a subscrição."
        textoConfirmar="Apagar"
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
            <Botao variante="fantasma" onClick={() => setAVer(false)}>Fechar</Botao>
            <Botao variante="primario" disabled={aEnviar || !info} onClick={() => setAConfirmarEnvio(true)}>
              <Send className="size-4" aria-hidden />Enviar agora
            </Botao>
          </>
        }
      >
        {info ? (
          <>
            <p className="text-sm leading-relaxed text-white/80">
              Com o conteúdo de hoje (semana de {info.semana.rotulo}). O envio de segunda-feira usa o conteúdo desse dia.
              {info.vazio && <span className="text-gold"> Esta semana ainda não há novidades: o envio automático seria saltado.</span>}
            </p>
            <iframe
              title="Pré-visualização do email da newsletter"
              // As ligações abrem noutro separador, sem sair do painel.
              srcDoc={info.html.replace("<head>", '<head><base target="_blank">')}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              className="h-[72vh] w-full rounded-[var(--raio)] border border-white/10 bg-white"
            />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-white/75">{erroInfo ?? "A preparar a pré-visualização…"}</p>
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
