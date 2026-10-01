"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/contexto";

/* ============================================================
   MOTOBOX — Botão de acção
   O único comando fixo do site, por baixo da moldura:
   na entrada abre o painel ("Explorar"), no painel volta à
   entrada ("Fechar"), em qualquer outra página regressa ao
   painel. No telemóvel é uma barra vermelha a toda a largura.
   ============================================================ */

type Estado = "explorar" | "fechar" | "voltar";

function estadoPara(caminho: string): Estado {
  if (caminho === "/") return "explorar";
  if (caminho === "/explorar") return "fechar";
  return "voltar";
}

const DESTINO: Record<Estado, string> = { explorar: "/explorar", fechar: "/", voltar: "/explorar" };
const ROTULO: Record<Estado, string> = {
  explorar: "Explorar a MotoBox",
  fechar: "Fechar o painel",
  voltar: "Voltar ao painel",
};

export function BarraAccao() {
  const caminho = usePathname();
  const estado = estadoPara(caminho);

  return (
    <>
      {/* Ligação de conta: no telemóvel fica no fim do conteúdo, por cima da barra. */}
      <div className="px-[var(--gutter)] pb-6 pt-5 text-right lg:hidden">
        <LigacaoConta />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 h-20 lg:relative lg:z-auto lg:flex lg:h-[var(--zona-accao)] lg:justify-center lg:pt-[15px]">
        <Link
          href={DESTINO[estado]}
          aria-label={ROTULO[estado]}
          data-estado={estado}
          className="group/accao flex h-full w-full items-center bg-mb-red px-5 text-[15px] text-white transition-colors duration-300 hover:bg-mb-red-dark lg:h-[50px] lg:w-[210px] lg:rounded-[var(--raio)]"
        >
          <span className="relative block h-[1.3em] w-full overflow-hidden">
            <Rotulo activo={estado === "explorar"} de={estado === "fechar" ? "baixo" : "cima"}>
              <span>Explorar</span>
              <IconeMenu />
            </Rotulo>
            <Rotulo activo={estado === "fechar"} de="baixo">
              <span>Fechar</span>
              <IconeFechar />
            </Rotulo>
            <Rotulo activo={estado === "voltar"} de="baixo" inicio>
              <IconeVoltar />
              <span>Voltar ao painel</span>
            </Rotulo>
          </span>
        </Link>
        <div className="absolute right-[var(--gutter)] top-[44px] hidden lg:block">
          <LigacaoConta />
        </div>
      </div>
    </>
  );
}

function Rotulo({
  activo,
  de,
  inicio = false,
  children,
}: {
  activo: boolean;
  de: "cima" | "baixo";
  inicio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={`absolute inset-0 flex items-center gap-x-6 transition-all duration-300 ease-in-out ${
        inicio ? "justify-start" : "justify-between"
      } ${activo ? "translate-y-0 opacity-100" : de === "cima" ? "-translate-y-full opacity-0" : "translate-y-full opacity-0"}`}
    >
      {children}
    </span>
  );
}

function LigacaoConta() {
  const { utilizador } = useAuth();
  const conta = Boolean(utilizador);
  return (
    <Link href={conta ? "/conta" : "/entrar"} className="sublinhado text-sm text-white">
      {conta ? "A minha conta" : "Entrar"}
    </Link>
  );
}

function IconeMenu() {
  return (
    <svg viewBox="0 0 17 12" className="h-3 w-[17px] shrink-0" aria-hidden>
      <path fill="currentColor" d="M.012 12v-1.5H17V12zm0-4.881v-1.5H17v1.5zm0-4.882V.74H17v1.498z" />
    </svg>
  );
}

function IconeFechar() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M1.755 14 .702 12.947 6.298 7.35.702 1.755 1.755.702 7.35 6.298 12.947.702 14 1.755 8.404 7.35 14 12.947 12.947 14 7.35 8.404z"
      />
    </svg>
  );
}

function IconeVoltar() {
  return (
    <span className="relative block size-3 shrink-0 overflow-hidden">
      <svg viewBox="0 0 13 13" className="absolute inset-0 size-3 transition-transform duration-300 group-hover/accao:-translate-x-full group-hover/accao:translate-y-full" aria-hidden>
        <path fill="currentColor" d="M13 1.4 3.4 11H12v2H0V1h2v8.6L11.6 0z" />
      </svg>
      <svg viewBox="0 0 13 13" className="absolute inset-0 size-3 translate-x-full -translate-y-full transition-transform duration-300 group-hover/accao:translate-x-0 group-hover/accao:translate-y-0" aria-hidden>
        <path fill="currentColor" d="M13 1.4 3.4 11H12v2H0V1h2v8.6L11.6 0z" />
      </svg>
    </span>
  );
}
