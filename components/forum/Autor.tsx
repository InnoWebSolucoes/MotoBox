/* ============================================================
   MOTOBOX — Fórum: quem escreve
   O quadradinho (logótipo da conta, ou as iniciais sobre a cor
   da pessoa) e a marca de nível ao lado do nome. Sem estado:
   serve no servidor e no navegador.
   ============================================================ */

import { textoSobre } from "./tipos";

export function AvatarForum({
  nome, iniciais, cor, avatar, className = "size-9 text-xs",
}: { nome: string; iniciais?: string; cor: string; avatar?: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center overflow-hidden rounded-[4px] font-semibold ${className}`}
      style={{ background: cor, color: textoSobre(cor) }}
    >
      {avatar ? (
        // A imagem já vem reduzida do envio (máx. 512 px); a cor fica por trás de um PNG transparente.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
      ) : (
        (iniciais || nome.trim()[0] || "?").toUpperCase()
      )}
    </span>
  );
}

/** Marca de nível ("Motard"), da equipa ou de autor do tópico. */
export function MarcaNivel({ texto, tom = "nivel" }: { texto?: string; tom?: "nivel" | "equipa" | "autor" }) {
  if (!texto) return null;
  const cores = {
    nivel: "bg-white/12 text-white",
    equipa: "bg-mb-red text-white",
    autor: "bg-white text-[#141418]",
  }[tom];
  return (
    <span className={`inline-flex h-5 items-center rounded-[3px] px-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.06em] ${cores}`}>
      {texto}
    </span>
  );
}
