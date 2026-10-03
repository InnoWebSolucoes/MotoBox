"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin/store";
import { formatDataCurta, formatKz } from "@/lib/data";
import {
  CabecalhoPagina, Painel, Ferramentas, Seleccao, Estatistica, Estado,
  Gaveta, Campo, Area, Interruptor, Confirmar, useAviso,
} from "@/components/admin/kit";
import { DOCUMENTOS_MOTA, moderacaoDe, precisaRevisao, type ItemVerificacao } from "@/lib/marketplace";
import type { ModeracaoAnuncio } from "@/lib/types";
import { comBase } from "@/lib/base";

/* ============================================================
   MOTOBOX ADMIN — Verificação de anúncios
   As motas chegam aqui antes de aparecerem no marketplace.
   A equipa confere o número de quadro e os documentos com o
   vendedor, e aprova ou recusa com um motivo que ele vê na conta.
   Qualquer anúncio pode ser aberto aqui (?anuncio=id) para ser
   retirado do site.
   ============================================================ */

const ROTULO: Record<ModeracaoAnuncio, string> = {
  pendente: "por rever", aprovado: "aprovado", rejeitado: "recusado",
};
const nomeDocumento = (id: string) => DOCUMENTOS_MOTA.find((d) => d.id === id)?.nome ?? id;

/** A fila, ou a frase a mostrar se não vier. */
async function lerFila(pedido?: string | null): Promise<{ itens: ItemVerificacao[]; aviso: string | null }> {
  const url = pedido ? `/api/admin/verificacoes?anuncio=${encodeURIComponent(pedido)}` : "/api/admin/verificacoes";
  try {
    const r = await fetch(comBase(url));
    const j = await r.json();
    if (!r.ok) return { itens: [], aviso: j.erro ?? `Erro ${r.status}` };
    return { itens: j.itens, aviso: j.aviso ?? null };
  } catch {
    return { itens: [], aviso: "Não foi possível contactar o servidor." };
  }
}

export default function AdminVerificacao() {
  const { registar, recarregar } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const [itens, setItens] = useState<ItemVerificacao[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("pendente");
  const [aberto, setAberto] = useState<ItemVerificacao | null>(null);
  const [documentosVistos, setDocumentosVistos] = useState(false);
  const [identidade, setIdentidade] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [nota, setNota] = useState("");
  const [aAplicar, setAAplicar] = useState(false);
  const [confirmarSemDocumentos, setConfirmarSemDocumentos] = useState(false);

  const abrir = useCallback((i: ItemVerificacao) => {
    setAberto(i);
    setDocumentosVistos(Boolean(i.anuncio.documentosVerificados));
    setIdentidade(i.anuncio.vendedor.verificado);
    setMotivo(i.anuncio.motivoModeracao ?? "");
    setNota(i.verificacao?.notaInterna ?? "");
  }, []);

  const carregar = async () => {
    const r = await lerFila();
    setItens(r.itens);
    setAviso(r.aviso);
  };

  // Vindo do Marketplace com ?anuncio=, abre logo esse anúncio. Lido aqui,
  // e não com useSearchParams, para a página não precisar de Suspense.
  useEffect(() => {
    const pedido = new URLSearchParams(window.location.search).get("anuncio");
    let vivo = true;
    void lerFila(pedido).then((r) => {
      if (!vivo) return;
      setItens(r.itens);
      setAviso(r.aviso);
      const alvo = pedido ? r.itens.find((i) => i.anuncio.id === pedido) : undefined;
      if (alvo) { setFiltro(""); abrir(alvo); }
    });
    return () => { vivo = false; };
  }, [abrir]);

  const contagem = useMemo(() => {
    const por = (m: ModeracaoAnuncio) => (itens ?? []).filter((i) => moderacaoDe(i.anuncio) === m).length;
    return { pendente: por("pendente"), rejeitado: por("rejeitado"), aprovado: por("aprovado") };
  }, [itens]);

  const filtrados = useMemo(
    () => (itens ?? [])
      .filter((i) => !filtro || moderacaoDe(i.anuncio) === filtro)
      .sort((a, b) => (b.verificacao?.declaracaoEm ?? b.anuncio.publicado).localeCompare(a.verificacao?.declaracaoEm ?? a.anuncio.publicado)),
    [itens, filtro],
  );

  const decidir = async (accao: "aprovar" | "recusar") => {
    if (!aberto) return;
    setAAplicar(true);
    try {
      const r = await fetch(comBase("/api/admin/verificacoes"), {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anuncioId: aberto.anuncio.id, accao, motivo, notaInterna: nota,
          documentosVistos, identidadeConfirmada: identidade,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { mostrar(j.erro ?? `Erro ${r.status}`, "erro"); return; }
      registar(accao === "aprovar" ? "Aprovou" : "Recusou", "Anúncio", aberto.anuncio.titulo);
      mostrar(accao === "aprovar" ? "Anúncio aprovado e publicado." : "Anúncio recusado. O vendedor vê o motivo na conta.");
      setAberto(null);
      await Promise.all([carregar(), recarregar()]);
    } finally {
      setAAplicar(false);
    }
  };

  const aprovar = () => {
    if (aberto?.verificacao && !documentosVistos) { setConfirmarSemDocumentos(true); return; }
    void decidir("aprovar");
  };

  const a = aberto?.anuncio;
  const v = aberto?.verificacao;

  return (
    <>
      <CabecalhoPagina
        titulo="Verificação de anúncios"
        descricao="As motas só aparecem no marketplace depois de aprovadas aqui. Confira com o vendedor o número de quadro e os documentos antes de aprovar. Peças e equipamento publicam logo; um anúncio retirado do site aparece como recusado."
      />

      {aviso && <p className="mb-4 border-l-2 border-gold pl-3 text-sm text-ink-300">{aviso}</p>}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Estatistica rotulo="Por rever" valor={contagem.pendente} tom={contagem.pendente ? "red" : "neutral"} />
        <Estatistica rotulo="Recusados" valor={contagem.rejeitado} />
        <Estatistica rotulo="Motas aprovadas" valor={contagem.aprovado} tom="ok" />
      </div>

      <Painel>
        <Ferramentas>
          <Seleccao valor={filtro} onChange={setFiltro} aria-label="Estado"
            opcoes={[
              { valor: "pendente", nome: "Por rever" },
              { valor: "rejeitado", nome: "Recusados" },
              { valor: "aprovado", nome: "Aprovados" },
              { valor: "", nome: "Todos" },
            ]}
            className="w-auto min-w-[180px]" />
        </Ferramentas>

        {itens === null ? (
          <p className="py-12 text-center text-sm text-ink-500">A carregar…</p>
        ) : filtrados.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-500">
            {filtro === "pendente" ? "Nenhum anúncio à espera de verificação." : "Nada com este filtro."}
          </p>
        ) : (
          <ul className="space-y-3">
            {filtrados.map((i) => (
              <li key={i.anuncio.id}>
                <button type="button" onClick={() => abrir(i)}
                  className="w-full border border-ink-700 bg-ink-950 p-4 text-left transition-colors hover:border-ink-600">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="border border-ink-700 px-2 py-0.5 text-[10px] font-display uppercase tracking-widest text-ink-400">
                      {i.anuncio.categoria}
                    </span>
                    <Estado valor={moderacaoDe(i.anuncio)} rotulo={ROTULO[moderacaoDe(i.anuncio)]} />
                    {i.repetidos.length > 0 && <Estado valor="banido" rotulo="quadro repetido" />}
                    <span className="ml-auto text-xs text-ink-500">
                      {formatDataCurta(i.verificacao?.declaracaoEm ?? i.anuncio.publicado)}
                    </span>
                  </div>
                  <p className="font-medium text-white">{i.anuncio.titulo}</p>
                  <p className="mt-1 text-sm text-ink-400">
                    {formatKz(i.anuncio.preco)} · {i.anuncio.provincia} · {i.anuncio.vendedor.nome}
                  </p>
                  {i.verificacao && (
                    <p className="mt-1.5 font-mono text-xs text-ink-300">Quadro {i.verificacao.numeroQuadro}</p>
                  )}
                  {i.anuncio.motivoModeracao && moderacaoDe(i.anuncio) === "rejeitado" && (
                    <p className="mt-2 border-l-2 border-mb-red pl-2 text-xs text-ink-300">{i.anuncio.motivoModeracao}</p>
                  )}
                  {moderacaoDe(i.anuncio) === "pendente" && (
                    <p className="mt-3 font-display text-[11px] uppercase tracking-wider text-white">Rever →</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Painel>

      <Gaveta
        aberta={aberto !== null}
        aoFechar={() => setAberto(null)}
        titulo="Rever anúncio"
        descricao={a ? `${a.categoria} · ${ROTULO[moderacaoDe(a)]}` : undefined}
        largura="max-w-xl"
        rodape={a && (
          <>
            <button type="button" onClick={() => void decidir("recusar")} disabled={aAplicar}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red hover:bg-mb-red/10 disabled:opacity-60">
              {moderacaoDe(a) === "aprovado" ? "Retirar do site" : "Recusar"}
            </button>
            <button type="button" onClick={aprovar} disabled={aAplicar}
              className="h-10 bg-ok px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:brightness-110 disabled:opacity-60">
              {aAplicar ? "A aplicar…" : moderacaoDe(a) === "aprovado" ? "Guardar" : "Aprovar e publicar"}
            </button>
          </>
        )}
      >
        {a && aberto && (
          <div className="space-y-5">
            {/* 1. O anúncio */}
            <section>
              <p className="mb-1.5 text-[10px] font-display uppercase tracking-widest text-ink-500">O anúncio</p>
              <div className="border border-ink-700 bg-ink-950 p-3 text-sm">
                <p className="font-medium text-white">{a.titulo}</p>
                <p className="mt-1 text-ink-300">
                  {formatKz(a.preco)}{a.negociavel ? " (negociável)" : ""} · {a.provincia} · {a.estado}
                </p>
                <p className="mt-1 text-ink-400">
                  {[a.marca, a.modelo, a.ano, a.quilometragem !== undefined && `${a.quilometragem.toLocaleString("pt-PT")} km`]
                    .filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 line-clamp-4 whitespace-pre-line text-ink-400">{a.descricao}</p>
                {moderacaoDe(a) === "aprovado" && (
                  <a href={comBase(`/marketplace/${encodeURIComponent(a.id)}`)} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-white underline hover:text-mb-red">
                    Abrir no site
                  </a>
                )}
              </div>
            </section>

            {/* 2. Quem vende */}
            <section>
              <p className="mb-1.5 text-[10px] font-display uppercase tracking-widest text-ink-500">Vendedor</p>
              <div className="border border-ink-700 bg-ink-950 p-3 text-sm">
                <p className="text-white">{a.vendedor.nome} <span className="text-ink-500">· membro desde {a.vendedor.desde}</span></p>
                {aberto.contacto ? (
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-ink-300">
                    <a href={`mailto:${aberto.contacto.email}`} className="underline hover:text-white">{aberto.contacto.email}</a>
                    {aberto.contacto.telefone && (
                      <a href={`tel:${aberto.contacto.telefone.replace(/\s/g, "")}`} className="underline hover:text-white">
                        {aberto.contacto.telefone}
                      </a>
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-ink-500">Sem conta associada (anúncio criado no painel).</p>
                )}
              </div>
            </section>

            {/* 3. O que o vendedor declarou */}
            {v ? (
              <section>
                <p className="mb-1.5 text-[10px] font-display uppercase tracking-widest text-ink-500">Declaração do vendedor</p>
                <dl className="space-y-2 border border-ink-700 bg-ink-950 p-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Número de quadro</dt>
                    <dd className="font-mono text-white">{v.numeroQuadro}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Matrícula</dt>
                    <dd className="font-mono text-white">{v.matricula || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Documentos</dt>
                    <dd className="text-right text-white">{v.documentos.map(nomeDocumento).join(", ")}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Em nome do vendedor</dt>
                    <dd className={v.emNomeProprio ? "text-white" : "text-gold"}>{v.emNomeProprio ? "Sim" : "Não"}</dd>
                  </div>
                  {v.observacoes && <p className="border-t border-ink-700 pt-2 text-ink-300">{v.observacoes}</p>}
                  <p className="text-xs text-ink-500">
                    Declarado a {formatDataCurta(v.declaracaoEm)}
                    {v.revistoPor && v.revistoEm && ` · revisto por ${v.revistoPor} a ${formatDataCurta(v.revistoEm)}`}
                  </p>
                </dl>
                {aberto.repetidos.length > 0 && (
                  <div className="mt-2 border-l-2 border-mb-red pl-3 text-sm text-ink-300">
                    <p className="text-mb-red">Este número de quadro aparece noutros anúncios:</p>
                    <ul className="mt-1 space-y-0.5">
                      {aberto.repetidos.map((r) => (
                        <li key={r.id}>{r.titulo}{r.vendedor && <span className="text-ink-500"> · {r.vendedor}</span>}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!v.emNomeProprio && (
                  <p className="mt-2 border-l-2 border-gold pl-3 text-sm text-ink-300">
                    Os documentos não estão em nome de quem vende. Peça a autorização do titular.
                  </p>
                )}
              </section>
            ) : precisaRevisao(a.categoria) ? (
              <p className="border-l-2 border-gold pl-3 text-sm text-ink-300">
                Esta mota não tem declaração (foi publicada antes da verificação ou criada no painel).
              </p>
            ) : null}

            {/* 4. Decisão */}
            <section className="space-y-3">
              <p className="text-[10px] font-display uppercase tracking-widest text-ink-500">Decisão</p>
              {v && (
                <Interruptor activo={documentosVistos} onChange={setDocumentosVistos}
                  etiqueta="Vi os documentos"
                  descricao="Correspondem à mota e ao número de quadro. O anúncio mostra o selo «Documentação verificada»." />
              )}
              <Interruptor activo={identidade} onChange={setIdentidade}
                disabled={!a.vendedor.authId}
                etiqueta="Identidade do vendedor confirmada"
                descricao="O selo de vendedor verificado passa a aparecer em todos os anúncios desta pessoa." />
              <Campo etiqueta="Motivo para o vendedor" ajuda="Obrigatório para recusar ou retirar. O vendedor vê-o na conta e pode corrigir o anúncio.">
                <Area rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex.: Os documentos estão em nome de outra pessoa. Envie a autorização do titular." />
              </Campo>
              <Campo etiqueta="Nota interna" ajuda="Só a equipa vê. Ex.: documentos vistos por WhatsApp a 3/10.">
                <Area rows={2} value={nota} onChange={(e) => setNota(e.target.value)} />
              </Campo>
            </section>
          </div>
        )}
      </Gaveta>

      <Confirmar
        aberta={confirmarSemDocumentos}
        aoFechar={() => setConfirmarSemDocumentos(false)}
        aoConfirmar={() => void decidir("aprovar")}
        titulo="Aprovar sem ver os documentos?"
        mensagem="A mota fica publicada sem o selo «Documentação verificada». Só o faça se tiver outra razão para confiar no anúncio."
        textoConfirmar="Aprovar mesmo assim"
      />

      {elemento}
    </>
  );
}
