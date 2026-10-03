"use client";

import { useEffect, useState } from "react";
import { Confirmar, Estado } from "@/components/admin/kit";
import { formatDataCurta } from "@/lib/data";
import { apagarResposta, lerRespostasDoTopico, mudarVisibilidade } from "@/lib/forum/moderacao";
import type { EstadoTopico, RespostaAdmin } from "@/lib/forum/tipos";

/* ============================================================
   MOTOBOX ADMIN — Respostas de um tópico
   Na gaveta de edição do tópico: as respostas dos membros, também
   as escondidas, para esconder, voltar a mostrar ou apagar uma de
   cada vez. Cada mudança devolve a contagem do tópico já certa, e
   a página passa-a à tabela e ao formulário: guardar o tópico a
   seguir não repõe números antigos.
   ============================================================ */

interface Lista {
  topicoId: string;
  respostas: RespostaAdmin[];
  emFalta?: boolean;
  erro?: string;
}

const botao =
  "border border-ink-700 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-ink-400 transition-colors disabled:opacity-50";

export function RespostasTopico({
  topicoId, tituloTopico, aoMudarTopico, mostrar, registar,
}: {
  topicoId: string;
  tituloTopico: string;
  /** Contagem e última resposta do tópico, tal como ficaram na base de dados. */
  aoMudarTopico: (topicoId: string, estado: EstadoTopico) => void;
  mostrar: (texto: string, tom?: "ok" | "erro") => void;
  registar: (accao: string, entidade: string, detalhe: string) => void;
}) {
  const [lista, setLista] = useState<Lista | null>(null);
  const [aMudar, setAMudar] = useState<string | null>(null);
  const [aApagar, setAApagar] = useState<RespostaAdmin | null>(null);

  // Lê ao abrir. A leitura também traz a contagem actual do tópico, que um
  // membro pode ter mudado depois de o painel carregar.
  useEffect(() => {
    let vivo = true;
    void lerRespostasDoTopico(topicoId).then((r) => {
      if (!vivo) return;
      if (r.erro !== undefined) { setLista({ topicoId, respostas: [], erro: r.erro }); return; }
      setLista({ topicoId, respostas: r.dados.respostas, emFalta: r.dados.emFalta });
      if (r.dados.topico) aoMudarTopico(topicoId, r.dados.topico);
    });
    return () => { vivo = false; };
  }, [topicoId, aoMudarTopico]);

  const actual = lista?.topicoId === topicoId ? lista : null;
  const visiveis = actual?.respostas.filter((r) => r.publicado).length ?? 0;
  const onde = tituloTopico.trim() ? ` em «${tituloTopico.trim()}»` : "";

  async function alternar(r: RespostaAdmin) {
    setAMudar(r.id);
    const res = await mudarVisibilidade(r.id, !r.publicado);
    setAMudar(null);
    if (res.erro !== undefined) { mostrar(res.erro, "erro"); return; }
    setLista((l) => l && {
      ...l,
      respostas: l.respostas.map((x) => (x.id === r.id ? { ...x, publicado: !r.publicado } : x)),
    });
    if (res.dados.topico) aoMudarTopico(topicoId, res.dados.topico);
    registar(r.publicado ? "escondeu" : "voltou a mostrar", "Resposta do fórum", `${r.autorNome}${onde}`);
    mostrar(r.publicado ? "Resposta escondida do fórum." : "Resposta visível outra vez.");
  }

  async function apagar(r: RespostaAdmin) {
    setAMudar(r.id);
    const res = await apagarResposta(r.id);
    setAMudar(null);
    if (res.erro !== undefined) { mostrar(res.erro, "erro"); return; }
    setLista((l) => l && { ...l, respostas: l.respostas.filter((x) => x.id !== r.id) });
    if (res.dados.topico) aoMudarTopico(topicoId, res.dados.topico);
    registar("removeu", "Resposta do fórum", `${r.autorNome}${onde}`);
    mostrar("Resposta apagada.");
  }

  return (
    <section className="border-t border-ink-700/60 pt-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-display uppercase tracking-widest text-ink-300">Respostas dos membros</h3>
        {actual && actual.respostas.length > 0 && (
          <p className="text-[11px] text-ink-500">
            {visiveis} visíveis · {actual.respostas.length - visiveis} escondidas
          </p>
        )}
      </div>

      {!actual ? (
        <p className="text-sm text-ink-500">A carregar respostas…</p>
      ) : actual.erro ? (
        <p className="border-l-2 border-mb-red pl-3 text-sm text-ink-300">Não foi possível ler as respostas: {actual.erro}</p>
      ) : actual.emFalta ? (
        <p className="border-l-2 border-gold pl-3 text-sm text-ink-300">
          As respostas dos membros aparecem aqui depois de correr no Supabase a migração supabase/migracao-2026-09-27.sql.
        </p>
      ) : actual.respostas.length === 0 ? (
        <p className="text-sm text-ink-500">Ainda nenhum membro respondeu a este tópico.</p>
      ) : (
        <ul className="space-y-2">
          {actual.respostas.map((r) => (
            <li key={r.id}
              className={`border p-3 ${r.publicado ? "border-ink-700 bg-ink-950" : "border-dashed border-ink-700 bg-ink-950/40"}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="font-medium text-white">{r.autorNome}</span>
                <span className="text-ink-500">{formatDataCurta(r.criadoEm)}</span>
                {!r.publicado && <Estado valor="escondida" />}
              </div>
              {/* O texto inteiro, para decidir sem abrir o site; as longas rolam. */}
              <p className={`mt-1.5 max-h-40 overflow-y-auto whitespace-pre-line text-sm [overflow-wrap:anywhere] ${
                r.publicado ? "text-ink-200" : "text-ink-500"
              }`}>
                {r.corpo}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <button type="button" disabled={aMudar === r.id} onClick={() => void alternar(r)}
                  className={`${botao} hover:text-white`}>
                  {r.publicado ? "esconder" : "mostrar"}
                </button>
                <button type="button" disabled={aMudar === r.id} onClick={() => setAApagar(r)}
                  className={`${botao} hover:border-mb-red/40 hover:text-mb-red`}>
                  apagar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={() => { if (aApagar) void apagar(aApagar); }}
        titulo="Apagar resposta"
        mensagem="A resposta sai do tópico de vez. Para só a tirar de vista, esconda-a: pode voltar a mostrá-la."
        textoConfirmar="Apagar"
        perigo
      />
    </section>
  );
}
