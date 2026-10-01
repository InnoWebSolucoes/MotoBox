import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { lerRedes } from "@/lib/redes";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Seccao } from "@/components/painel/blocos";
import { Chamada } from "@/components/painel/blocos";
import { Icon } from "@/components/ui";
import { ContactoClient } from "./ContactoClient";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Fale com a MotoBox Angola: registar um clube, divulgar um evento, enviar uma história ou propor uma parceria.",
};

export default async function Contacto({ searchParams }: { searchParams: Promise<{ assunto?: string }> }) {
  const { assunto } = await searchParams;
  const redes = (await lerRedes()).filter((r) => r.rede !== "whatsapp");
  const instagram = redes.find((r) => r.rede === "instagram");

  return (
    <PaginaInterior icone={<Mail />}>
      <header className="coluna pb-6 pt-28 lg:pt-32">
        <p className="sobretitulo surgir text-white/80">Fale connosco</p>
        <h1 className="titulo-1 surgir mt-4 max-w-[14ch]" style={{ ["--i" as string]: 1 }}>
          Contacto
        </h1>
        <p className="texto-lead surgir mt-6 max-w-[50ch] text-white/85" style={{ ["--i" as string]: 2 }}>
          Tem um clube para registar, um evento para divulgar ou uma história para contar? Escreva-nos. Lemos todas
          as mensagens.
        </p>
      </header>

      <Seccao className="!pt-6">
        <div className="grid gap-[var(--intervalo)] lg:grid-cols-[1.7fr_1fr]">
          <div className="painel painel-escuro p-6 md:p-10">
            <ContactoClient assunto={assunto} />
          </div>
          <div className="grid gap-[var(--intervalo)] content-start">
            {instagram && (
              <Chamada
                href={instagram.url}
                externo
                icone={<Icon name="instagram" />}
                titulo="Fale connosco também no Instagram"
              />
            )}
            {redes
              .filter((r) => r.rede !== "instagram")
              .map((r) => (
                <a
                  key={r.rede}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="painel painel-escuro flex items-center gap-4 p-5 transition-colors hover:bg-near-black"
                >
                  <Icon name={r.rede} className="size-5" />
                  <span>{r.nome}</span>
                </a>
              ))}
            <div className="painel painel-escuro p-5 text-sm leading-relaxed text-white/70">
              <p className="font-semibold text-white">Luanda, Angola</p>
              <p className="mt-1">A MotoBox é um projecto sem fins lucrativos, feito por e para a comunidade motard.</p>
            </div>
          </div>
        </div>
      </Seccao>
    </PaginaInterior>
  );
}
