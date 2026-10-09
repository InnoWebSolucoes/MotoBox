import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { lerRedes } from "@/lib/redes";
import { lerDoc } from "@/lib/conteudo";
import { CONTACTO_PADRAO, type ConteudoContacto } from "@/lib/conteudo/grupos/paginas";
import { fundir } from "@/lib/conteudo/grupos/site";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Seccao } from "@/components/painel/blocos";
import { Chamada } from "@/components/painel/blocos";
import { Icon } from "@/components/ui";
import { ContactoClient } from "./ContactoClient";

/* O texto vive no conteúdo editável ("paginas.contacto", editado em
   Gestão › Páginas); o de partida está em lib/conteudo/grupos/paginas.ts.
   As redes vêm das Definições. */
async function lerContacto(): Promise<ConteudoContacto> {
  return fundir(CONTACTO_PADRAO, await lerDoc<ConteudoContacto>("paginas.contacto"));
}

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await lerContacto();
  return { title: seo.titulo, description: seo.descricao };
}

export default async function Contacto({ searchParams }: { searchParams: Promise<{ assunto?: string }> }) {
  const { assunto } = await searchParams;
  const [c, todas] = await Promise.all([lerContacto(), lerRedes()]);
  const redes = todas.filter((r) => r.rede !== "whatsapp");
  const instagram = redes.find((r) => r.rede === "instagram");

  return (
    <PaginaInterior icone={<Mail />}>
      <header className="coluna pb-6 pt-28 lg:pt-32">
        <p className="sobretitulo surgir text-white/80">{c.sobretitulo}</p>
        <h1 className="titulo-1 surgir mt-4 max-w-[14ch]" style={{ ["--i" as string]: 1 }}>
          {c.titulo}
        </h1>
        <p className="texto-lead surgir mt-6 max-w-[50ch] text-white/85" style={{ ["--i" as string]: 2 }}>
          {c.texto}
        </p>
      </header>

      <Seccao className="!pt-6">
        <div className="grid gap-[var(--intervalo)] lg:grid-cols-[1.7fr_1fr]">
          <div className="painel painel-escuro p-6 md:p-10">
            <ContactoClient assunto={assunto} textos={c.formulario} />
          </div>
          <div className="grid gap-[var(--intervalo)] content-start">
            {instagram && (
              <Chamada
                href={instagram.url}
                externo
                icone={<Icon name="instagram" />}
                titulo={c.instagramTitulo}
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
            {(c.local.titulo || c.local.texto) && (
              <div className="painel painel-escuro p-5 text-sm leading-relaxed text-white/70">
                {c.local.titulo && <p className="font-semibold text-white">{c.local.titulo}</p>}
                {c.local.texto && <p className="mt-1">{c.local.texto}</p>}
              </div>
            )}
          </div>
        </div>
      </Seccao>
    </PaginaInterior>
  );
}
