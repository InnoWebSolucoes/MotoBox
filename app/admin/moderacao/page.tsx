"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin/store";
import { formatDataCurta } from "@/lib/data";
import {
  CabecalhoPagina, Painel, Ferramentas, Procura, Seleccao, Estatistica,
  Estado, Gaveta, Campo, Area, useAviso,
} from "@/components/admin/kit";
import type { Denuncia, EstadoModeracao } from "@/lib/admin/types";

const TIPOS = ["forum", "marketplace", "comentario", "perfil"];

export default function AdminModeracao() {
  const { estado, atualizar, registar } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const [procura, setProcura] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("pendente");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [aberta, setAberta] = useState<Denuncia | null>(null);
  const [resolucao, setResolucao] = useState("");

  const filtradas = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.denuncias
      .filter((d) => {
        if (filtroEstado && d.estado !== filtroEstado) return false;
        if (filtroTipo && d.tipo !== filtroTipo) return false;
        if (q && !`${d.alvoTitulo} ${d.motivo} ${d.denunciante} ${d.detalhe}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.criado.localeCompare(a.criado));
  }, [estado.denuncias, procura, filtroEstado, filtroTipo]);

  const contagem = useMemo(() => ({
    pendente: estado.denuncias.filter((d) => d.estado === "pendente").length,
    aprovado: estado.denuncias.filter((d) => d.estado === "aprovado").length,
    rejeitado: estado.denuncias.filter((d) => d.estado === "rejeitado").length,
  }), [estado.denuncias]);

  const resolver = (d: Denuncia, novo: EstadoModeracao, texto: string) => {
    atualizar("denuncias", d.id, { estado: novo, resolucao: texto || undefined });
    registar("moderou", "Denúncia", `${d.alvoTitulo} → ${novo}`);
    mostrar(novo === "aprovado" ? "Denúncia aceite e ação registada." : "Denúncia arquivada sem ação.");
    setAberta(null);
    setResolucao("");
  };

  const abrir = (d: Denuncia) => { setAberta(d); setResolucao(d.resolucao ?? ""); };

  return (
    <>
      <CabecalhoPagina
        titulo="Moderação"
        descricao="Denúncias de conteúdo do fórum, marketplace, comentários e perfis."
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Estatistica rotulo="Por resolver" valor={contagem.pendente} tom={contagem.pendente ? "red" : "neutral"} />
        <Estatistica rotulo="Com ação" valor={contagem.aprovado} tom="ok" />
        <Estatistica rotulo="Arquivadas" valor={contagem.rejeitado} />
      </div>

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Alvo, motivo ou denunciante…" />
          <Seleccao valor={filtroEstado} onChange={setFiltroEstado} aria-label="Estado"
            opcoes={[
              { valor: "", nome: "Todos os estados" },
              { valor: "pendente", nome: "Pendentes" },
              { valor: "aprovado", nome: "Com ação" },
              { valor: "rejeitado", nome: "Arquivadas" },
            ]}
            className="w-auto min-w-[160px]" />
          <Seleccao valor={filtroTipo} onChange={setFiltroTipo} aria-label="Tipo"
            opcoes={[{ valor: "", nome: "Todos os tipos" }, ...TIPOS.map((t) => ({ valor: t, nome: t }))]}
            className="w-auto min-w-[150px]" />
        </Ferramentas>

        {filtradas.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-500">
            Nada para moderar com estes filtros.
          </p>
        ) : (
          <ul className="space-y-3">
            {filtradas.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => abrir(d)}
                  className="w-full border border-ink-700 bg-ink-950 p-4 text-left transition-colors hover:border-ink-600">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="border border-ink-700 px-2 py-0.5 text-[10px] font-display uppercase tracking-widest text-ink-400">
                      {d.tipo}
                    </span>
                    <Estado valor={d.estado} />
                    <span className="ml-auto text-xs text-ink-500">{formatDataCurta(d.criado)}</span>
                  </div>
                  <p className="font-medium text-white">{d.alvoTitulo}</p>
                  <p className="mt-1 text-sm text-mb-red">{d.motivo}</p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink-400">{d.detalhe}</p>
                  <p className="mt-2 text-xs text-ink-500">Denunciado por {d.denunciante}</p>
                  {d.resolucao && (
                    <p className="mt-2 border-l-2 border-ok pl-2 text-xs text-ink-300">{d.resolucao}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Painel>

      <Gaveta
        aberta={aberta !== null}
        aoFechar={() => setAberta(null)}
        titulo="Resolver denúncia"
        descricao={aberta?.alvoTitulo}
        largura="max-w-lg"
        rodape={aberta && (
          <>
            <button type="button" onClick={() => resolver(aberta, "rejeitado", resolucao)}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-ink-800">
              Arquivar sem ação
            </button>
            <button type="button" onClick={() => resolver(aberta, "aprovado", resolucao)}
              className="h-10 bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark">
              Aplicar ação
            </button>
          </>
        )}
      >
        {aberta && (
          <div className="space-y-4">
            <dl className="divide-y divide-ink-800 border border-ink-700">
              {[
                ["Tipo", aberta.tipo],
                ["Alvo", aberta.alvoTitulo],
                ["Identificador", aberta.alvoId],
                ["Motivo", aberta.motivo],
                ["Denunciante", aberta.denunciante],
                ["Recebida", formatDataCurta(aberta.criado)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-3 py-2 text-sm">
                  <dt className="text-ink-400">{k}</dt>
                  <dd className="text-right text-white">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="border border-ink-700 bg-ink-950 p-3">
              <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-500">Detalhe</p>
              <p className="text-sm text-ink-200">{aberta.detalhe}</p>
            </div>

            <Campo etiqueta="Nota de resolução" ajuda="Fica registada no histórico de moderação.">
              <Area rows={3} value={resolucao} onChange={(e) => setResolucao(e.target.value)}
                placeholder="Ex.: Anúncio removido e vendedor notificado." />
            </Campo>
          </div>
        )}
      </Gaveta>

      {elemento}
    </>
  );
}
