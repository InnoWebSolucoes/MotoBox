"use client";

import Link from "next/link";

/* As duas partes de Provas: a lista das provas e os textos das páginas do campeonato. */

const ABAS = [
  { chave: "provas", nome: "Provas", href: "/admin/provas" },
  { chave: "paginas", nome: "Páginas do campeonato", href: "/admin/provas?aba=paginas" },
] as const;

export type AbaProvas = (typeof ABAS)[number]["chave"];

export function NavProvas({ activa }: { activa: AbaProvas }) {
  return (
    <nav aria-label="Secções de Provas" className="mb-[var(--intervalo)] flex flex-wrap gap-[var(--intervalo)]">
      {ABAS.map((a) => (
        <Link
          key={a.chave}
          href={a.href}
          aria-current={activa === a.chave ? "page" : undefined}
          className="pilula aria-[current=page]:bg-mb-red aria-[current=page]:text-white"
        >
          {a.nome}
        </Link>
      ))}
    </nav>
  );
}
