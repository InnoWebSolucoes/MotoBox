"use client";

import { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin/store";
import { CabecalhoPagina, Painel, Ferramentas, Procura, Seleccao, usePaginacao } from "@/components/admin/kit";

export default function AdminAtividade() {
  const { estado } = useAdmin();
  const [procura, setProcura] = useState("");
  const [filtroEntidade, setFiltroEntidade] = useState("");

  const entidades = useMemo(
    () => [...new Set(estado.atividade.map((a) => a.entidade))].map((e) => ({ valor: e, nome: e })),
    [estado.atividade],
  );

  const filtrada = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.atividade.filter((a) => {
      if (filtroEntidade && a.entidade !== filtroEntidade) return false;
      if (q && !`${a.utilizador} ${a.accao} ${a.entidade} ${a.detalhe}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [estado.atividade, procura, filtroEntidade]);

  const { fatia, controlos } = usePaginacao(filtrada, 25);

  const quando = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Atividade"
        descricao="Registo das ações realizadas no painel de gestão."
      />

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Utilizador, ação ou detalhe…" />
          <Seleccao valor={filtroEntidade} onChange={setFiltroEntidade} aria-label="Entidade"
            opcoes={[{ valor: "", nome: "Todas as entidades" }, ...entidades]}
            className="w-auto min-w-[170px]" />
        </Ferramentas>

        {fatia.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-500">Sem atividade registada.</p>
        ) : (
          <ol className="relative border-l border-ink-700 pl-5">
            {fatia.map((a) => (
              <li key={a.id} className="relative pb-5 last:pb-0">
                <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-mb-red" />
                <p className="text-sm text-ink-200">
                  <span className="text-white">{a.utilizador}</span> {a.accao}{" "}
                  <span className="border border-ink-700 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-ink-400">
                    {a.entidade}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-ink-400">{a.detalhe}</p>
                <p className="mt-0.5 text-xs text-ink-600">{quando(a.quando)}</p>
              </li>
            ))}
          </ol>
        )}
        {controlos}
      </Painel>
    </>
  );
}
