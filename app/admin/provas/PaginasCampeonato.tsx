"use client";

/* ============================================================
   MOTOBOX ADMIN — Provas › Páginas do campeonato
   Os textos fixos das páginas do campeonato: calendário,
   resultados, classificação, pilotos, equipas, bilhetes e a
   compra de bilhetes (com os meios de pagamento). Um documento
   por página, todos abertos ao mesmo tempo para nada se perder
   ao trocar de página antes de gravar. ?doc=<id> abre um deles.
   ============================================================ */

import { useState } from "react";
import { FileText, Flag } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import { Aviso, CabecalhoPagina, Campo, Seleccao } from "@/components/admin/kit";
import { EditorPartes } from "@/app/admin/site/EditorPartes";
import { DOCS_CAMPEONATO } from "./_paginas/esquemas";
import { NavProvas } from "./NavProvas";

export function PaginasCampeonato({ docInicial }: { docInicial?: string }) {
  const { estado } = useAdmin();
  const [doc, setDoc] = useState(() => DOCS_CAMPEONATO.find((d) => d.id === docInicial)?.id ?? DOCS_CAMPEONATO[0].id);
  const actual = DOCS_CAMPEONATO.find((d) => d.id === doc) ?? DOCS_CAMPEONATO[0];

  const mudar = (id: string) => {
    setDoc(id);
    // O endereço acompanha a página escolhida (para partilhar ou voltar a ela).
    try { window.history.replaceState(null, "", `?aba=paginas&doc=${id}`); } catch { /* indisponível */ }
  };

  return (
    <>
      <CabecalhoPagina
        sobretitulo="Desporto"
        titulo="Provas"
        icone={<Flag />}
        descricao="Os textos fixos das páginas do campeonato: títulos, textos de topo, etiquetas, botões, mensagens de lista vazia e notas. Sem nada gravado, o site mostra o texto de origem."
      />
      <NavProvas activa="paginas" />

      <div className="mb-[var(--intervalo)]">
        <Aviso tom="info" titulo="Temporada">
          Onde os textos dizem {"{ano}"}, o site escreve a temporada das Definições (agora {estado.definicoes.temporada}).
          Os dados de cada prova, piloto e equipa editam-se nas respectivas fichas.
        </Aviso>
      </div>

      <div className="mb-[var(--intervalo)] grid gap-[var(--intervalo)] md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-start">
        {/* Escolha da página: lista no computador, caixa de escolha no telemóvel */}
        <div className="md:hidden">
          <Campo etiqueta="Página">
            <Seleccao valor={actual.id} onChange={mudar} opcoes={DOCS_CAMPEONATO.map((d) => ({ valor: d.id, nome: d.nome }))} />
          </Campo>
        </div>
        <nav aria-label="Páginas do campeonato" className="painel painel-escuro hidden p-2 md:sticky md:top-24 md:block">
          <ul className="space-y-0.5">
            {DOCS_CAMPEONATO.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => mudar(d.id)}
                  aria-current={d.id === actual.id ? "page" : undefined}
                  className={`flex w-full flex-col items-start rounded-[var(--raio)] px-3 py-2.5 text-left transition-colors ${
                    d.id === actual.id ? "bg-mb-red text-white" : "text-white/80 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <span className="text-[14px] font-medium">{d.nome}</span>
                  <span className={`text-xs ${d.id === actual.id ? "text-white/80" : "text-white/70"}`}>{d.pagina}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <p className="mb-3 text-sm text-white/80">{actual.descricao}</p>
          {DOCS_CAMPEONATO.map((d) => (
            <div key={d.id} hidden={d.id !== actual.id}>
              <EditorPartes chave={d.chave} pagina={d.pagina} partes={d.partes} icone={<FileText />} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
