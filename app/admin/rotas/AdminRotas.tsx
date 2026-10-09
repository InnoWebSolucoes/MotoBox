"use client";

/* ============================================================
   MOTOBOX ADMIN — Rotas
   Dois separadores:
   - Rotas: cada guia de viagem, do nome às paragens, ao traçado
     do GPX, ao estado da estrada e às fotografias;
   - Página Rotas (?aba=pagina): os textos de /rotas, os textos
     fixos da página de cada rota e o que é comum a todas.
   Os dois ficam montados (escondidos quando não estão à vista),
   para não se perder o que está por gravar ao trocar de separador.
   ============================================================ */

import { useEffect, useState } from "react";
import { Route } from "lucide-react";
import { comBase } from "@/lib/base";
import { CLIMA } from "@/lib/rotas-clima";
import { rotaVazia, type Rota } from "@/lib/rotas-tipos";
import type { ConteudoPaginaRotas } from "@/lib/rotas-pagina";
import { Abas, BotaoLigacao, CabecalhoPagina } from "@/components/admin/kit";
import { EditorGrupo } from "@/components/admin/editor/EditorGrupo";
import type { Opcao, Valor } from "@/components/admin/editor/esquema";
import { EditorRota } from "./EditorRota";
import { PaginaRotas } from "./PaginaRotas";

type Aba = "rotas" | "pagina";

const CIDADES_CODIGO: Opcao[] = Object.entries(CLIMA).map(([valor, c]) => ({ valor, nome: c.cidade }));

const cidadesDe = (d: Pick<ConteudoPaginaRotas, "CLIMA"> | null | undefined): Opcao[] | null => {
  const lista = Array.isArray(d?.CLIMA) ? d.CLIMA : [];
  const ops = lista.filter((c) => c?.chave).map((c) => ({ valor: c.chave, nome: c.cidade || c.chave }));
  return ops.length ? ops : null;
};

export function AdminRotas({ abaInicial }: { abaInicial: Aba }) {
  const [aba, setAba] = useState<Aba>(abaInicial);
  const [cidades, setCidades] = useState<Opcao[]>(CIDADES_CODIGO);

  // As cidades com tabela de clima vêm da página Rotas (podem ter sido editadas).
  useEffect(() => {
    let vivo = true;
    fetch(comBase("/api/admin/conteudo?chave=paginas.rotas"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const ops = cidadesDe(j?.dados);
        if (vivo && ops) setCidades(ops);
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  const mudarAba = (k: Aba) => {
    setAba(k);
    const url = new URL(window.location.href);
    if (k === "pagina") url.searchParams.set("aba", "pagina");
    else url.searchParams.delete("aba");
    window.history.replaceState(null, "", url.toString());
  };

  return (
    <>
      <CabecalhoPagina
        icone={<Route />}
        sobretitulo="Conteúdo"
        titulo="Rotas"
        descricao="Os guias de viagem de mota: paragens, troços, mapa e GPX, horário, combustível, onde comer e dormir, perigos, fotografias e o estado da estrada. Tudo o que gravar aparece no site no momento seguinte."
        accoes={<BotaoLigacao href="/rotas" externo variante="fantasma">Ver no site</BotaoLigacao>}
      />
      <div className="mb-[var(--intervalo)]">
        <Abas
          abas={[
            { chave: "rotas", nome: "Rotas" },
            { chave: "pagina", nome: "Página Rotas" },
          ]}
          activa={aba}
          onChange={mudarAba}
          rotulo="Separadores das rotas"
        />
      </div>

      <div hidden={aba !== "rotas"}>
        <EditorGrupo<Valor>
          grupo="rotas"
          nomeItem="rota"
          feminino
          campoChave="slug"
          prefixoPagina="/rotas"
          novo={() => rotaVazia() as unknown as Valor}
          resumo={(d) => ({
            titulo: String(d.nome ?? "") || "Rota sem nome",
            subtitulo: [d.regiao, d.epocaCurta].filter(Boolean).join(" · ") || undefined,
          })}
        >
          {(dados, mudar) => (
            <EditorRota rota={dados as unknown as Rota} mudar={(r) => mudar(r as unknown as Valor)} cidades={cidades} />
          )}
        </EditorGrupo>
      </div>

      <div hidden={aba !== "pagina"}>
        <PaginaRotas aoGravar={(d) => { const ops = cidadesDe(d); if (ops) setCidades(ops); }} />
      </div>
    </>
  );
}
