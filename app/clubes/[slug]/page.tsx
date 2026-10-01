import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Mail, Users } from "lucide-react";
import { lerClube, lerClubes } from "@/lib/supabase/publico";
import { localClube } from "@/lib/motobox";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, CartaoNumerado, Numeros, Seccao } from "@/components/painel/blocos";
import { CartaoClube } from "@/components/painel/cartoes";
import { Monograma, Seta } from "@/components/painel/kit";
import { Icon } from "@/components/ui";
import { nomeTipo, redesDoClube } from "../comum";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export async function generateStaticParams() {
  const clubes = await lerClubes();
  return clubes.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await lerClube(slug);
  if (!c) return { title: "Clube não encontrado" };
  return {
    title: c.nome,
    description: c.descricao.slice(0, 160),
  };
}

export default async function ClubePagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clube = await lerClube(slug);
  if (!clube) notFound();

  const redes = redesDoClube(clube);
  const tipo = nomeTipo(clube.tipo);
  const outros = (await lerClubes())
    .filter((c) => c.slug !== clube.slug)
    .sort((a, b) => Number(b.tipo === clube.tipo) - Number(a.tipo === clube.tipo))
    .slice(0, 3);

  // Primeira frase para a abertura; a descrição inteira segue no corpo.
  const [frase] = clube.descricao.split(/(?<=\.)\s+/);

  return (
    <PaginaInterior icone={<Users />}>
      <Abertura
        foto={[clube.imagem, clube.slug]}
        sobretitulo={`${tipo} · ${localClube(clube)}`}
        titulo={clube.nome}
        texto={frase}
      >
        <div className="flex flex-wrap items-center gap-3">
          {redes.map((r) => (
            <a
              key={r.chave}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2.5 rounded-[var(--raio)] bg-black/50 px-4 text-sm text-white backdrop-blur-md transition-colors hover:bg-mb-red"
            >
              <Icon name={r.icone} className="size-4" />
              {r.nome}
            </a>
          ))}
        </div>
      </Abertura>

      <Seccao>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-4">
              <Monograma nome={clube.nome} cor={clube.cor} className="size-16 text-xl" />
              <div>
                <p className="text-sm text-white/60">Sobre o clube</p>
                <h2 className="titulo-4 mt-1">{clube.nome}</h2>
              </div>
            </div>
            <div className="prosa mt-8 max-w-[62ch]">
              <p>{clube.descricao}</p>
            </div>
            {clube.encontros && (
              <div className="mt-8 flex gap-4 rounded-[var(--raio)] bg-white/5 p-5">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-mb-red-light" aria-hidden />
                <div>
                  <p className="text-sm font-semibold">Quando se encontram</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{clube.encontros}</p>
                </div>
              </div>
            )}
          </div>

          <Numeros
            className="self-start"
            itens={[
              { valor: clube.fundacao ?? "?", texto: clube.fundacao ? "ano de fundação" : "fundação por confirmar" },
              { valor: <span className="text-2xl lg:text-3xl">{clube.provincia || "Angola"}</span>, texto: clube.cidade || "sede por confirmar" },
              { valor: <span className="text-2xl lg:text-3xl">{tipo}</span>, texto: "tipo de clube" },
              { valor: clube.actividades.length, texto: "actividades conhecidas" },
            ]}
          />
        </div>
      </Seccao>

      {clube.actividades.length > 0 && (
        <Seccao className="!pt-0">
          <h2 className="titulo-3">O que fazem</h2>
          <ol className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
            {clube.actividades.map((a, i) => (
              <li key={a} className="painel painel-escuro flex min-h-36 flex-col p-5">
                <span aria-hidden className="grid size-9 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                  {i + 1}
                </span>
                <span className="mt-auto pt-8 text-lg leading-snug">{a}</span>
              </li>
            ))}
          </ol>
        </Seccao>
      )}

      <Seccao className="!pt-0">
        <CartaoNumerado
          numero={<Mail className="size-5" aria-hidden />}
          sobretitulo="Esta página é sua?"
          titulo="Ajude-nos a completar a ficha"
        >
          A informação vem das páginas públicas do clube e a fotografia de capa é ilustrativa. Se faz parte do{" "}
          {clube.nome}, envie-nos o logótipo, fotografias vossas, a sede e as datas dos próximos passeios.
          <span className="mt-6 flex flex-wrap gap-[var(--intervalo)]">
            <BotaoMB href={`/contacto?assunto=${encodeURIComponent(`Actualizar o clube ${clube.nome}`)}`}>
              Falar com a MotoBox
            </BotaoMB>
            {clube.contacto && (
              <BotaoMB href={`mailto:${clube.contacto}`} externo variante="escuro">
                Contactar o clube
              </BotaoMB>
            )}
          </span>
        </CartaoNumerado>
      </Seccao>

      {outros.length > 0 && (
        <Seccao className="!pt-0">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="titulo-3">Outros clubes</h2>
            <Link href="/clubes" className="group inline-flex items-center gap-2 text-sm">
              <span className="sublinhado">Todos os clubes</span>
              <Seta className="size-3" />
            </Link>
          </div>
          <div className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
            {outros.map((c) => (
              <CartaoClube key={c.slug} clube={c} />
            ))}
          </div>
        </Seccao>
      )}
    </PaginaInterior>
  );
}
