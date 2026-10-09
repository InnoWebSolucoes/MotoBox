"use client";

/* ============================================================
   MOTOBOX ADMIN — Editor de uma página do site
   Abre o documento pedido (?doc=paginas.sobre…) com o editor
   próprio, dividido em abas. Um documento sem editor próprio
   (algum que venha a ser acrescentado) abre num formulário
   automático, feito a partir do que lá está.
   ============================================================ */

import { ArrowLeft, BookOpen, FileText, Globe2, Mail, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { BotaoLigacao, CabecalhoPagina, Painel, Vazio } from "@/components/admin/kit";
import { EditorDoc } from "@/components/admin/editor/EditorDoc";
import { Formulario } from "@/components/admin/editor/Formulario";
import { FormularioPorAbas, inferirEsquema, type AbaEsquema } from "./partes";
import { ABAS_SOBRE } from "./sobre";
import { ABAS_CONTACTO } from "./contacto";
import { ABAS_SEGURANCA } from "./seguranca";
import { ABAS_IMPORTAR } from "./importar";

export interface DefEditor {
  titulo: string;
  descricao: string;
  pagina: string;
  icone: ReactNode;
  abas: AbaEsquema[];
}

/** As páginas editadas aqui (as entradas das secções editam-se em cada secção). */
export const EDITORES: Record<string, DefEditor> = {
  "paginas.sobre": {
    titulo: "Sobre",
    descricao: "A página \"O que é a MotoBox?\": história, números, equipa e o que o site oferece.",
    pagina: "/sobre",
    icone: <BookOpen />,
    abas: ABAS_SOBRE,
  },
  "paginas.contacto": {
    titulo: "Contacto",
    descricao: "O texto da página de contacto e todos os textos do formulário. As mensagens chegam a Mensagens.",
    pagina: "/contacto",
    icone: <Mail />,
    abas: ABAS_CONTACTO,
  },
  "paginas.seguranca": {
    titulo: "Segurança",
    descricao: "O guia de segurança completo, secção a secção, em português e em inglês.",
    pagina: "/seguranca",
    icone: <ShieldCheck />,
    abas: ABAS_SEGURANCA,
  },
  "paginas.marketplace-importar": {
    titulo: "Importar do estrangeiro",
    descricao: "O guia de importação do Marketplace e o formulário de pedido, em português e em inglês.",
    pagina: "/marketplace/importar",
    icone: <Globe2 />,
    abas: ABAS_IMPORTAR,
  },
};

export function EditorPagina({ chave, titulo, pagina }: { chave: string; titulo?: string; pagina?: string }) {
  const def = EDITORES[chave];
  const voltar = (
    <BotaoLigacao href="/admin/paginas" variante="fantasma">
      <ArrowLeft className="size-4" aria-hidden /> Todas as páginas
    </BotaoLigacao>
  );

  if (!def) {
    return (
      <>
        <CabecalhoPagina
          sobretitulo="Páginas"
          titulo={titulo ?? chave}
          descricao="Formulário feito a partir do conteúdo que está no site."
          icone={<FileText />}
          accoes={voltar}
        />
        <EditorDoc chave={chave} pagina={pagina}>
          {(dados, mudar) => {
            const esquema = inferirEsquema(dados);
            return esquema.length ? (
              <Painel>
                <Formulario esquema={esquema} valor={dados} onChange={mudar} />
              </Painel>
            ) : (
              <Vazio titulo="Ainda não há nada para editar aqui">
                Este conteúdo enche-se a partir de outra secção da gestão.
              </Vazio>
            );
          }}
        </EditorDoc>
      </>
    );
  }

  return (
    <>
      <CabecalhoPagina sobretitulo="Páginas" titulo={def.titulo} descricao={def.descricao} icone={def.icone} accoes={voltar} />
      <EditorDoc chave={chave} pagina={def.pagina}>
        {(dados, mudar) => <FormularioPorAbas abas={def.abas} valor={dados} mudar={mudar} />}
      </EditorDoc>
    </>
  );
}
