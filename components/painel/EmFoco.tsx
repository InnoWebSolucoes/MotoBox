import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays, Newspaper, Route, ShieldCheck, Sparkles, Store, Timer, Trophy, Users,
} from "lucide-react";
import type { TipoFoco } from "@/lib/conteudo/grupos/site";
import { FotoFundo, Seta, ordem } from "./kit";
import { ContagemUbuntu, type UnidadesContagem } from "./ContagemUbuntu";

/* ============================================================
   MOTOBOX — Mosaico "Em foco" do painel Explorar
   Mostra o que a equipa pôs em foco (Gestão › Entrada e painel ›
   Em foco): um evento ou uma prova com a contagem decrescente, um
   artigo, uma rota, um anúncio com o preço, um clube, uma
   modalidade, uma secção do guia de segurança ou algo escrito à
   mão. A página resolve o item (app/explorar/foco.ts) e passa-o já
   pronto: fotografia, linha de cima, título, uma linha, ligação e,
   se houver, a data e o preço.

   No computador cabe sempre na sua célula da grelha: o título e a
   linha cortam-se a duas ou a uma linha nos ecrãs baixos.
   ============================================================ */

export interface Foco {
  tipo: TipoFoco;
  sobretitulo: string;
  titulo: string;
  linha: string;
  /** Fotografias por ordem de preferência (endereço ou chave de lib/imagens.ts). */
  foto: (string | undefined)[];
  href: string;
  /** Texto da ligação, em baixo. */
  accao: string;
  /** Data da contagem decrescente (só quando está ligada). */
  data?: string;
  /** A mesma data, por extenso, para quem usa leitor de ecrã. */
  dataExtenso?: string;
  /** Preço do anúncio, já escrito (ex.: "1 250 000 Kz"). */
  preco?: string;
  /** Linha pequena por baixo do preço (ex.: "Negociável"). */
  precoNota?: string;
}

const ICONES: Record<TipoFoco, ReactNode> = {
  evento: <CalendarDays />,
  prova: <Trophy />,
  artigo: <Newspaper />,
  rota: <Route />,
  anuncio: <Store />,
  clube: <Users />,
  modalidade: <Trophy />,
  seguranca: <ShieldCheck />,
  personalizado: <Sparkles />,
};

const externo = (href: string) => /^https?:\/\//i.test(href);

export function EmFoco({ foco, unidades, className = "", i }: {
  foco: Foco;
  unidades: UnidadesContagem;
  className?: string;
  i: number;
}) {
  const comContagem = Boolean(foco.data);
  const icone = comContagem ? <Timer /> : ICONES[foco.tipo];
  const classe = `painel revelar group flex flex-col p-5 [text-shadow:0_1px_10px_rgb(0_0_0/0.6)] mbaixo:p-4 ${className}`;
  const conteudo = (
    <>
      <FotoFundo nome={[...foco.foto, "passeios"]} veu="cima" tamanhos="(max-width: 1024px) 100vw, 30vw" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-gradient-to-t from-black/80 via-black/35 to-transparent" aria-hidden />
      {/* Sem contagem, o texto desce mais pela fotografia: um véu a mais por trás dele. */}
      {!comContagem && (
        <div className="absolute inset-x-0 top-0 -z-10 h-3/4 bg-gradient-to-b from-black/60 via-black/35 to-transparent" aria-hidden />
      )}
      <div className="flex items-start justify-between gap-4">
        <p className="line-clamp-1 text-[15px]">{foco.sobretitulo}</p>
        <span aria-hidden className="shrink-0 [&_svg]:size-5 [&_svg]:stroke-[1.6]">{icone}</span>
      </div>
      <h2
        className={`mt-6 text-lg font-normal leading-tight baixo:mt-3 ${
          comContagem ? "line-clamp-2 mbaixo:line-clamp-1" : "line-clamp-3 baixo:line-clamp-2"
        }`}
      >
        {foco.titulo}
      </h2>
      {foco.linha && (
        <p
          className={`mt-1 text-[0.8125rem] leading-snug text-white/90 ${
            comContagem ? "line-clamp-1" : "line-clamp-3 baixo:line-clamp-2 mbaixo:line-clamp-1"
          }`}
        >
          {foco.linha}
        </p>
      )}
      <div className="mt-auto pt-4 mbaixo:pt-2">
        {foco.data && (
          <>
            <ContagemUbuntu data={foco.data} unidades={unidades} />
            {foco.dataExtenso && <span className="sr-only">{foco.dataExtenso}</span>}
          </>
        )}
        {foco.preco && (
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[clamp(1.5rem,2.2vw,2.25rem)] font-bold leading-none tracking-tight tabular-nums mbaixo:text-2xl">
              {foco.preco}
            </span>
            {foco.precoNota && <span className="text-[0.8125rem] text-white/90">{foco.precoNota}</span>}
          </p>
        )}
        {foco.accao && (
          <span className={`mt-3 inline-flex items-center gap-2 text-sm ${comContagem ? "mbaixo:hidden" : ""}`}>
            <span className="sublinhado">{foco.accao}</span>
            <Seta className="size-3" />
          </span>
        )}
      </div>
    </>
  );

  return externo(foco.href) ? (
    <a href={foco.href} target="_blank" rel="noopener noreferrer" className={classe} style={ordem(i)}>
      {conteudo}
    </a>
  ) : (
    <Link href={foco.href} className={classe} style={ordem(i)}>
      {conteudo}
    </Link>
  );
}
