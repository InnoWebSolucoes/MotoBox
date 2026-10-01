import Link from "next/link";
import { Compass } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { BotaoMB } from "@/components/painel/blocos";

export default function NaoEncontrada() {
  return (
    <PaginaInterior icone={<Compass />} rodape={false}>
      <div className="coluna flex min-h-full flex-col justify-center pb-16 pt-28">
        <p className="sobretitulo text-white/70">Erro 404</p>
        <h1 className="titulo-1 mt-4 max-w-[13ch]">Esta estrada não leva a lado nenhum</h1>
        <p className="texto-lead mt-6 max-w-[46ch] text-white/80">
          A página que procura não existe ou mudou de sítio. Volte ao painel e escolha outro caminho.
        </p>
        <div className="mt-10 flex flex-wrap gap-[var(--intervalo)]">
          <BotaoMB href="/explorar">Ir para o painel</BotaoMB>
          <BotaoMB href="/artigos" variante="escuro">Ler os artigos</BotaoMB>
        </div>
        <p className="mt-10 text-sm text-white/55">
          Procura uma página antiga de corridas ou classificações?{" "}
          <Link href="/eventos" className="sublinhado text-white">Os eventos estão aqui</Link>.
        </p>
      </div>
    </PaginaInterior>
  );
}
