import Link from "next/link";
import { lerNoticias } from "@/lib/supabase/publico";
import { lerDoc } from "@/lib/conteudo";
import { ENTRADA_PADRAO, fundir, type ConteudoEntrada } from "@/lib/conteudo/grupos/site";
import { Logotipo, Moldura, Seta } from "@/components/painel/kit";
import { Tempo } from "@/components/painel/Tempo";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

/* ============================================================
   MOTOBOX — Entrada
   O vídeo de fundo, a frase da casa e o botão "Explorar" que
   abre o painel. O artigo mais recente fica logo à mão.
   Os textos vêm do conteúdo editável ("site.entrada", em
   Gestão › Entrada e painel).
   ============================================================ */

export default async function Entrada() {
  const [[ultimo], lido] = await Promise.all([lerNoticias(), lerDoc<ConteudoEntrada>("site.entrada")]);
  const e = fundir(ENTRADA_PADRAO, lido);

  return (
    <Moldura className="flex min-h-[calc(100svh-var(--gutter)-11.25rem)] flex-col lg:min-h-0">
      <Logotipo />

      {/* Tempo em Luanda: ao lado do logótipo no telemóvel, à direita no computador */}
      <div className="ml-[calc(var(--tile)+var(--intervalo))] h-[var(--tile)] md:ml-auto md:w-[22rem] lg:w-[24rem]">
        <Tempo />
      </div>

      <div className="flex flex-1 items-center justify-center px-2 py-12 text-center">
        <div className="w-full min-w-0">
          {e.sobretitulo && <p className="sobretitulo brilho">{e.sobretitulo}</p>}
          <h1 className="titulo-1 brilho mx-auto mt-5 max-w-[13ch] text-balance">{e.titulo}</h1>
          {e.texto && (
            <p className="brilho mx-auto mt-6 max-w-[46ch] text-[15px] leading-relaxed md:text-base">{e.texto}</p>
          )}

          {ultimo && e.mostrarArtigo && (
            <Link
              href={`/artigos/${ultimo.slug}`}
              className="surgir group mx-auto mt-10 inline-flex max-w-full items-center gap-3 rounded-[var(--raio)] bg-black/45 py-2 pl-2 pr-4 text-left text-sm backdrop-blur-md transition-colors hover:bg-black/65"
              style={{ ["--i" as string]: 6 }}
            >
              <span className="shrink-0 rounded-[4px] bg-mb-red px-2 py-1 text-xs text-white">{e.rotuloArtigo}</span>
              <span className="min-w-0 truncate text-white/90">{ultimo.titulo}</span>
              <Seta className="size-3" />
            </Link>
          )}
        </div>
      </div>
    </Moldura>
  );
}
