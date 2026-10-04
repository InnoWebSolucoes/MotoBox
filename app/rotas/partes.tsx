/* Peças partilhadas pela lista e pelo detalhe das rotas, no estilo do painel. */

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { Exigencia, Facto, FonteRota, Lugar } from "@/lib/rotas";
import type { Foto } from "@/lib/rotas-fotos";
import { Chip } from "@/components/painel/kit";

/** Cor discreta por exigência: informação, não alarme. */
export const TOM_EXIGENCIA: Record<Exigencia, string> = {
  Tranquila: "bg-ok",
  Média: "bg-gold",
  Exigente: "bg-mb-red",
  Aventura: "bg-mb-red",
};

/** "Fonte: A, B" em letra pequena, com ligações. */
export function LinksFontes({ fontes, className = "" }: { fontes: FonteRota[]; className?: string }) {
  if (!fontes.length) return null;
  return (
    <p className={`text-xs leading-relaxed text-white/45 ${className}`}>
      {fontes.length > 1 ? "Fontes:" : "Fonte:"}{" "}
      {fontes.map((f, i) => (
        <span key={f.url + i}>
          {i > 0 && ", "}
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/15 underline-offset-2 transition-colors hover:text-white"
          >
            {f.nome}
          </a>
        </span>
      ))}
    </p>
  );
}

/** Crédito obrigatório das licenças Creative Commons: autor, licença e ligação. */
export function CreditoFoto({ foto, className = "" }: { foto: Foto; className?: string }) {
  return (
    <span className={className}>
      Foto:{" "}
      <a href={foto.pagina} target="_blank" rel="noopener noreferrer" className="underline decoration-white/20 underline-offset-2 hover:text-white">
        {foto.autor}
      </a>
      {" · "}
      <a href={foto.licencaUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-white/20 underline-offset-2 hover:text-white">
        {foto.licenca}
      </a>
      {" · Wikimedia Commons"}
    </span>
  );
}

/** Lista de verificação com o visto vermelho do painel. */
export function ListaVisto({ itens }: { itens: string[] }) {
  return (
    <ul>
      {itens.map((t) => (
        <li key={t} className="flex items-start gap-3 border-b border-white/8 py-3 text-[15px] leading-relaxed text-white/80 last:border-0">
          <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-[4px] bg-mb-red text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** Um facto com as fontes por baixo. */
export function ListaFactos({ itens }: { itens: Facto[] }) {
  return (
    <ul>
      {itens.map((f) => (
        <li key={f.texto} className="border-b border-white/8 py-3.5 first:pt-0 last:border-0 last:pb-0">
          <p className="text-sm leading-relaxed text-white/85">{f.texto}</p>
          <LinksFontes fontes={f.fontes} className="mt-1.5" />
        </li>
      ))}
    </ul>
  );
}

/** Restaurantes, alojamento e hospitais: nome, onde, nota e fontes. */
export function ListaLugares({ itens }: { itens: Lugar[] }) {
  return (
    <ul>
      {itens.map((l) => (
        <li key={l.nome + l.onde} className="border-b border-white/8 py-3.5 first:pt-0 last:border-0 last:pb-0">
          <p className="text-[15px] font-medium leading-snug text-white">{l.nome}</p>
          <p className="mt-0.5 text-[0.8125rem] text-white/55">{l.onde}</p>
          {l.nota && <p className="mt-1.5 text-sm leading-relaxed text-white/75">{l.nota}</p>}
          <LinksFontes fontes={l.fontes} className="mt-1.5" />
        </li>
      ))}
    </ul>
  );
}

/** Ficha escura com o quadrado de ícone vermelho e o título. */
export function Bloco({
  titulo,
  icone,
  children,
  className = "",
}: {
  titulo: ReactNode;
  icone: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`painel painel-escuro flex flex-col p-6 ${className}`}>
      <div className="flex items-center gap-3">
        <Chip>{icone}</Chip>
        <h3 className="text-lg font-semibold leading-snug">{titulo}</h3>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}
