"use client";

/* ============================================================
   MOTOBOX ADMIN — Modalidades
   - Modalidades: a ficha de cada modalidade (nome, grupo,
     descrição, fotografia, disciplinas, categorias) e o guia
     completo da sua página, separador a separador.
   - Página Desporto (?aba=pagina): todos os textos fixos de
     /desporto e das páginas das modalidades, as federações e
     as definições do campeonato.
   ============================================================ */

import Link from "next/link";
import { Layers } from "lucide-react";
import { CabecalhoPagina } from "@/components/admin/kit";
import { EditorGrupo } from "@/components/admin/editor/EditorGrupo";
import type { Valor } from "@/components/admin/editor/esquema";
import { EditorModalidade, NOMES_GRUPO } from "./EditorGuia";
import { PaginaDesportoEditor } from "./PaginaDesporto";

const ABAS = [
  { chave: "modalidades", nome: "Modalidades", href: "/admin/modalidades" },
  { chave: "pagina", nome: "Página Desporto", href: "/admin/modalidades?aba=pagina" },
] as const;

/** Uma modalidade nova: a ficha em branco e o guia vazio (a página esconde as partes vazias). */
const novaModalidade = (): Valor => ({
  slug: "", nome: "", grupo: "outras", descricao: "", imagem: "", disciplinas: [], categorias: [],
  guia: {
    numeros: [], abertura: "", factos: [], formato: [], classes: [], maquinas: [], equipamento: [],
    angola: { intro: [], marcos: [], blocos: [] }, internacional: [], lusofonia: [],
    comecar: { passos: [], seguranca: [] }, fontes: [],
  },
});

export function Modalidades({ aba }: { aba: "modalidades" | "pagina" }) {
  return (
    <>
      <CabecalhoPagina
        sobretitulo="Desporto"
        titulo="Modalidades"
        icone={<Layers />}
        descricao={aba === "pagina"
          ? "Os textos da página Desporto e das páginas de cada modalidade, as federações e as definições do campeonato (categorias que pontuam, ordem das categorias)."
          : "Cada modalidade tem a sua página em Desporto, com a ficha (nome, fotografia, disciplinas do calendário) e o guia completo: o que é, classes, a cena em Angola, lá fora, como começar e as fontes."}
      />

      <nav aria-label="Secções de Modalidades" className="mb-[var(--intervalo)] flex flex-wrap gap-[var(--intervalo)]">
        {ABAS.map((a) => (
          <Link key={a.chave} href={a.href} aria-current={aba === a.chave ? "page" : undefined}
            className="pilula aria-[current=page]:bg-mb-red aria-[current=page]:text-white">
            {a.nome}
          </Link>
        ))}
      </nav>

      {aba === "pagina" ? (
        <PaginaDesportoEditor />
      ) : (
        <EditorGrupo
          grupo="modalidades"
          nomeItem="modalidade"
          feminino
          campoChave="slug"
          prefixoPagina="/desporto"
          novo={novaModalidade}
          resumo={(d) => ({
            titulo: String(d.nome ?? ""),
            subtitulo: [NOMES_GRUPO[String(d.grupo)] ?? "", Array.isArray(d.disciplinas) && d.disciplinas.length ? (d.disciplinas as string[]).join(", ") : "sem provas no calendário"]
              .filter(Boolean).join(" · "),
          })}
        >
          {(dados, mudar) => <EditorModalidade dados={dados} mudar={mudar} />}
        </EditorGrupo>
      )}
    </>
  );
}
