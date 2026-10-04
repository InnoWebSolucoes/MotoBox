import Link from "next/link";
import { lerNoticias } from "@/lib/supabase/publico";
import { Logotipo, Moldura, Seta } from "@/components/painel/kit";
import { Tempo } from "@/components/painel/Tempo";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

/* ============================================================
   MOTOBOX — Entrada
   O vídeo de fundo, a frase da casa e o botão "Explorar" que
   abre o painel. O artigo mais recente fica logo à mão.
   ============================================================ */

export default async function Entrada() {
  const [ultimo] = await lerNoticias();

  return (
    <Moldura className="flex min-h-[calc(100svh-var(--gutter)-11.25rem)] flex-col lg:min-h-0">
      <Logotipo />

      {/* Tempo em Luanda: ao lado do logótipo no telemóvel, à direita no computador */}
      <div className="ml-[calc(var(--tile)+var(--intervalo))] h-[var(--tile)] md:ml-auto md:w-[22rem] lg:w-[24rem]">
        <Tempo />
      </div>

      <div className="flex flex-1 items-center justify-center px-2 py-12 text-center">
        <div className="w-full min-w-0">
          <p className="sobretitulo brilho">MotoBox Angola</p>
          <h1 className="titulo-1 brilho mx-auto mt-5 max-w-[13ch] text-balance">
            A paixão anda sobre duas rodas
          </h1>
          <p className="brilho mx-auto mt-6 max-w-[46ch] text-[15px] leading-relaxed md:text-base">
            Histórias, clubes, passeios e segurança para quem anda de mota em Angola. Da scooter de
            todos os dias à moto de viagem, a comunidade motard num só lugar.
          </p>

          {ultimo && (
            <Link
              href={`/artigos/${ultimo.slug}`}
              className="surgir group mx-auto mt-10 inline-flex max-w-full items-center gap-3 rounded-[var(--raio)] bg-black/45 py-2 pl-2 pr-4 text-left text-sm backdrop-blur-md transition-colors hover:bg-black/65"
              style={{ ["--i" as string]: 6 }}
            >
              <span className="shrink-0 rounded-[4px] bg-mb-red px-2 py-1 text-xs text-white">Novo artigo</span>
              <span className="min-w-0 truncate text-white/90">{ultimo.titulo}</span>
              <Seta className="size-3" />
            </Link>
          )}
        </div>
      </div>
    </Moldura>
  );
}
