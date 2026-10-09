"use client";

/* ============================================================
   MOTOBOX ADMIN — Um documento longo, em partes
   O documento abre com o EditorDoc (gravar, desfazer, repor o
   original, ver no site) e o formulário divide-se em partes
   (abas): cada parte mostra só os campos dessa zona da página,
   mas tudo fica no mesmo documento e grava-se de uma vez.

   Usado em Entrada e painel › Geral e em Provas › Páginas do
   campeonato.
   ============================================================ */

import { useState, type ReactNode } from "react";
import { Abas, Campo, Painel, Seleccao } from "@/components/admin/kit";
import { EditorDoc } from "@/components/admin/editor/EditorDoc";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";

export interface ParteDoc {
  chave: string;
  nome: string;
  descricao?: ReactNode;
  esquema: CampoEsquema[];
}

const eObjecto = (v: unknown): v is Valor => typeof v === "object" && v !== null && !Array.isArray(v);

/** Os campos de um objecto do documento, sem caixa à volta (ex.: os textos de "prova"). */
export function dentro(chave: string, campos: CampoEsquema[]): CampoEsquema {
  return {
    tipo: "personalizado",
    chave,
    etiqueta: "",
    render: (v, mudar) => <Formulario esquema={campos} valor={eObjecto(v) ? v : {}} onChange={mudar} />,
  };
}

export function EditorPartes({
  chave, pagina, partes, icone, rotulo = "Partes da página",
}: {
  /** Chave do documento (ex.: "campeonato.calendario"). */
  chave: string;
  /** Página do site para o botão "Ver no site". */
  pagina?: string;
  partes: ParteDoc[];
  icone?: ReactNode;
  rotulo?: string;
}) {
  const [parte, setParte] = useState(partes[0]?.chave ?? "");
  const actual = partes.find((p) => p.chave === parte) ?? partes[0];

  return (
    <EditorDoc chave={chave} pagina={pagina}>
      {(dados, mudar) => (
        <div className="space-y-[var(--intervalo)]">
          {partes.length > 1 && (
            <>
              {/* No telemóvel, uma lista; nos ecrãs largos, as abas. */}
              <div className="md:hidden">
                <Campo etiqueta={rotulo}>
                  <Seleccao valor={actual.chave} onChange={setParte} opcoes={partes.map((p) => ({ valor: p.chave, nome: p.nome }))} />
                </Campo>
              </div>
              <div className="hidden md:block">
                <Abas abas={partes.map((p) => ({ chave: p.chave, nome: p.nome }))} activa={actual.chave} onChange={setParte} rotulo={rotulo} />
              </div>
            </>
          )}
          {actual && (
            <Painel titulo={actual.nome} descricao={actual.descricao} icone={icone}>
              <Formulario esquema={actual.esquema} valor={dados} onChange={mudar} />
            </Painel>
          )}
        </div>
      )}
    </EditorDoc>
  );
}
