"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { caminhoDaPagina } from "@/lib/base";
import { useAuth } from "@/lib/auth/contexto";
import { Fundo, type FundoVideo } from "./Fundo";
import { BarraAccao } from "./BarraAccao";
import { Manutencao } from "./Manutencao";
import { useTextosGerais } from "./TextosGerais";

/** Páginas que continuam abertas em manutenção: entrar, recuperar a palavra-passe e voltar do email. */
const ABERTAS_EM_MANUTENCAO = ["/entrar", "/nova-palavra-passe", "/auth", "/sem-acesso"];

const aberta = (caminho: string) => ABERTAS_EM_MANUTENCAO.some((p) => caminho === p || caminho.startsWith(`${p}/`));

/**
 * Cenário comum às páginas públicas: o vídeo de fundo por trás e o
 * botão de acção por baixo da moldura. O painel de gestão tem a sua
 * própria estrutura e fica de fora. `fundo` vem do layout (conteúdo
 * editável "site.entrada").
 *
 * Com o modo de manutenção ligado (Definições), os visitantes vêem a
 * página de manutenção em vez do site; a equipa com sessão iniciada
 * continua a ver tudo, com uma faixa a lembrar que o modo está ligado.
 * O painel de gestão, a API e as páginas de entrada não são afectados.
 */
export function Cenario({
  children, fundo, manutencao,
}: {
  children: ReactNode;
  fundo?: FundoVideo;
  /** Modo de manutenção (Definições) e o email de contacto para a página. */
  manutencao?: { activa: boolean; email?: string };
}) {
  const caminho = caminhoDaPagina(usePathname());
  const { equipa } = useAuth();
  const { manutencao: textos } = useTextosGerais();
  if (caminho === "/admin" || caminho.startsWith("/admin/")) return <>{children}</>;

  const emManutencao = Boolean(manutencao?.activa) && !aberta(caminho);
  const bloqueado = emManutencao && !equipa;

  return (
    <>
      <Fundo video={fundo?.video} poster={fundo?.poster} />
      {emManutencao && equipa && textos.avisoEquipa && (
        <p role="status" className="fixed inset-x-0 top-0 z-[80] bg-mb-red px-4 py-1.5 text-center text-xs text-white">
          {textos.avisoEquipa}
        </p>
      )}
      <div className="relative z-[1] flex min-h-dvh flex-col pb-24 lg:pb-0">
        <main id="conteudo" className="flex-1">
          {bloqueado ? <Manutencao email={manutencao?.email} /> : children}
        </main>
        {!bloqueado && <BarraAccao />}
      </div>
    </>
  );
}
