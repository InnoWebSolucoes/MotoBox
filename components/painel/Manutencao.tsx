"use client";

/* ============================================================
   MOTOBOX — Página de manutenção
   O que os visitantes vêem com o modo de manutenção ligado
   (Gestão › Definições). Os textos editam-se em Gestão ›
   Entrada e painel › Geral. Quem é da equipa entra por aqui
   e continua a ver o site (ver Cenario).
   ============================================================ */

import Link from "next/link";
import { Wrench } from "lucide-react";
import { comValores } from "@/lib/textos";
import { PaginaInterior } from "./PaginaInterior";
import { useTextosGerais } from "./TextosGerais";

export function Manutencao({ email }: { email?: string }) {
  const { manutencao: m } = useTextosGerais();
  const precisaEmail = m.nota.includes("{email}");
  const nota = m.nota && (!precisaEmail || email) ? m.nota : "";

  return (
    <PaginaInterior icone={<Wrench />} rodape={false}>
      <div className="coluna flex min-h-full flex-col justify-center pb-16 pt-28">
        {m.sobretitulo && <p className="sobretitulo text-white/70">{m.sobretitulo}</p>}
        <h1 className="titulo-1 mt-4 max-w-[14ch]">{m.titulo}</h1>
        {m.texto && <p className="texto-lead mt-6 max-w-[46ch] text-white/80">{m.texto}</p>}
        {nota && (
          <p className="mt-10 text-sm text-white/75">
            {comValores(nota, {
              email: (
                <a href={`mailto:${email}`} className="sublinhado text-white">
                  {email}
                </a>
              ),
            })}
          </p>
        )}
        {m.equipa && (
          <p className="mt-4 text-sm">
            <Link href={`/entrar?destino=${encodeURIComponent("/admin")}`} className="sublinhado text-white/70 hover:text-white">
              {m.equipa}
            </Link>
          </p>
        )}
      </div>
    </PaginaInterior>
  );
}
