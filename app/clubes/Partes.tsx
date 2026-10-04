import Link from "next/link";
import { Foto, Monograma, Seta } from "@/components/painel/kit";
import { localClube } from "@/lib/motobox";
import type { Clube } from "@/lib/types";
import { nomeTipo } from "./comum";

/* ============================================================
   MOTOBOX — Peças das páginas de clubes
   O cartão de clube é o do painel (components/painel/cartoes.tsx),
   com uma linha de apresentação por baixo do nome: o `resumo` do
   perfil alargado ou, sem perfil, a primeira frase da descrição.
   ============================================================ */

/** Primeira frase de um texto ("… família». Sai em raide …" → "… família»."). */
export const primeiraFrase = (texto: string) => texto.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý«])/)[0] ?? texto;

export function CartaoClube({ clube }: { clube: Clube }) {
  const linha = clube.resumo || primeiraFrase(clube.descricao);
  return (
    <Link href={`/clubes/${clube.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
      <div className="relative">
        <Foto nome={[clube.imagem, clube.slug]} className="aspect-[16/9]" largura={800} tamanhos="(max-width: 768px) 100vw, 33vw" />
        <Monograma nome={clube.nome} cor={clube.cor} className="absolute bottom-3 left-3 size-12 text-sm shadow-lg" />
      </div>
      <div className="flex flex-1 flex-col p-4 pt-5 md:p-5">
        <p className="text-[0.8125rem] text-white/60">
          <span className="text-mb-red-light">{nomeTipo(clube.tipo)}</span> · {localClube(clube)}
          {clube.fundacao ? ` · desde ${clube.fundacao}` : ""}
        </p>
        <h3 className="mt-2 text-xl font-semibold leading-snug tracking-tight">{clube.nome}</h3>
        {linha && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/70">{linha}</p>}
        {clube.actividades.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {clube.actividades.slice(0, 3).map((a) => (
              <li key={a} className="rounded-[4px] bg-white/7 px-2 py-1 text-xs text-white/75">
                {a}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex justify-end pt-6">
          <Seta className="size-3.5" />
        </div>
      </div>
    </Link>
  );
}
