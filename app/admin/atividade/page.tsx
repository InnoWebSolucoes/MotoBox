"use client";

/* ============================================================
   MOTOBOX ADMIN — Actividade
   O registo do que a equipa fez no painel: quem, o quê, em
   que secção e quando. Agrupado por dia, com procura e filtros.
   ============================================================ */

import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import {
  CabecalhoPagina, Estatistica, Etiqueta, Ferramentas, Painel, Procura, Seleccao, Vazio, usePaginacao,
} from "@/components/admin/kit";
import { Avatar } from "../moderacao/_comum/partes";
import { dataCurta } from "../moderacao/_comum/formato";

const hora = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const dia = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

export default function AdminAtividade() {
  const { estado } = useAdmin();
  const [procura, setProcura] = useState("");
  const [filtroEntidade, setFiltroEntidade] = useState("");
  const [filtroPessoa, setFiltroPessoa] = useState("");

  const entidades = useMemo(
    () => [...new Set(estado.atividade.map((a) => a.entidade))].sort().map((e) => ({ valor: e, nome: e })),
    [estado.atividade],
  );
  const pessoas = useMemo(
    () => [...new Set(estado.atividade.map((a) => a.utilizador))].sort().map((e) => ({ valor: e, nome: e })),
    [estado.atividade],
  );

  const filtrada = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.atividade
      .filter((a) => {
        if (filtroEntidade && a.entidade !== filtroEntidade) return false;
        if (filtroPessoa && a.utilizador !== filtroPessoa) return false;
        if (q && !`${a.utilizador} ${a.accao} ${a.entidade} ${a.detalhe}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.quando.localeCompare(a.quando));
  }, [estado.atividade, procura, filtroEntidade, filtroPessoa]);

  const { fatia, controlos } = usePaginacao(filtrada, 30);

  // A página actual, agrupada por dia.
  const porDia = useMemo(() => {
    const grupos: { dia: string; itens: typeof fatia }[] = [];
    for (const a of fatia) {
      const d = dia(a.quando);
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.dia === d) ultimo.itens.push(a);
      else grupos.push({ dia: d, itens: [a] });
    }
    return grupos;
  }, [fatia]);

  const ultima = estado.atividade.reduce<string | null>((m, a) => (!m || a.quando > m ? a.quando : m), null);

  return (
    <>
      <CabecalhoPagina
        titulo="Actividade"
        sobretitulo="Visão geral"
        icone={<Activity />}
        descricao="O registo do que a equipa fez no painel: quem mudou o quê, e quando. Guarda as últimas 200 acções."
      />

      <div className="mb-[var(--intervalo)] grid grid-cols-1 gap-[var(--intervalo)] sm:grid-cols-3">
        <Estatistica rotulo="Acções registadas" valor={estado.atividade.length} />
        <Estatistica rotulo="Pessoas da equipa" valor={pessoas.length} />
        <Estatistica rotulo="Última acção" valor={ultima ? dataCurta(ultima) : "—"} variacao={ultima ? hora(ultima) : undefined} />
      </div>

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Pessoa, acção ou detalhe…" />
          <Seleccao valor={filtroPessoa} onChange={setFiltroPessoa} aria-label="Pessoa"
            opcoes={[{ valor: "", nome: "Toda a equipa" }, ...pessoas]} className="sm:w-52" />
          <Seleccao valor={filtroEntidade} onChange={setFiltroEntidade} aria-label="Secção"
            opcoes={[{ valor: "", nome: "Todas as secções" }, ...entidades]} className="sm:w-52" />
        </Ferramentas>

        {fatia.length === 0 ? (
          <Vazio titulo="Sem actividade">
            {estado.atividade.length ? "Nenhuma acção corresponde aos filtros." : "As acções feitas no painel aparecem aqui."}
          </Vazio>
        ) : (
          <div className="space-y-6">
            {porDia.map((g) => (
              <section key={g.dia}>
                <h2 className="mb-2 text-sm font-medium text-white/80 first-letter:uppercase">{g.dia}</h2>
                <ol className="divide-y divide-white/[0.07] rounded-[var(--raio)] border border-white/[0.08] bg-black/[0.12]">
                  {g.itens.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                      <Avatar nome={a.utilizador} cor="#4a4a52" className="size-8 text-[11px]" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <span className="font-medium text-white">{a.utilizador}</span>
                          <span className="text-white/80">{a.accao.toLowerCase()}</span>
                          <Etiqueta>{a.entidade}</Etiqueta>
                        </p>
                        {a.detalhe && <p className="mt-0.5 text-sm text-white/70 [overflow-wrap:anywhere]">{a.detalhe}</p>}
                      </div>
                      <span className="shrink-0 pt-0.5 text-xs tabular-nums text-white/70">{hora(a.quando)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
        {controlos}
      </Painel>
    </>
  );
}
