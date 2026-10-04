/* Peças partilhadas pela lista e pelo detalhe das rotas. */

import { C } from "@/components/T";
import { Icon } from "@/components/ui";
import type { Exigencia, FonteRota } from "@/lib/rotas";
import type { Foto } from "@/lib/rotas-fotos";

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
    <p className={`text-[11px] leading-relaxed text-ink-500 ${className}`}>
      <span>{fontes.length > 1 ? "Fontes:" : "Fonte:"}</span>{" "}
      {fontes.map((f, i) => (
        <span key={f.url + i}>
          {i > 0 && ", "}
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/15 underline-offset-2 transition-colors hover:text-ink-200"
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
      <span>Foto:</span>{" "}
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

/** Lista de verificação com o visto vermelho do site. */
export function ListaVisto({ itens }: { itens: string[] }) {
  return (
    <ul>
      {itens.map((t) => (
        <li key={t} className="flex items-start gap-3 border-b border-white/6 py-3 text-sm leading-relaxed text-ink-300 last:border-0">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mb-red/12 text-mb-red">
            <Icon name="check" className="size-3" />
          </span>
          <span>
            <C>{t}</C>
          </span>
        </li>
      ))}
    </ul>
  );
}
