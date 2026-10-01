import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays, Mail, MessagesSquare, Newspaper, Route, ShieldCheck, Star, Store, Users, BookOpen,
} from "lucide-react";
import { lerClubes, lerEventos, lerNoticias } from "@/lib/supabase/publico";
import { lerRedes } from "@/lib/redes";
import { artigoEmDestaque, clubeDoMes, diaMes, eventosFuturos, localClube } from "@/lib/motobox";
import { Chip, FotoFundo, Logotipo, Moldura, Seta, ordem } from "@/components/painel/kit";
import { Tempo } from "@/components/painel/Tempo";
import { Icon } from "@/components/ui";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explorar",
  description:
    "O painel da MotoBox: artigos, clubes de todo o país, eventos, rotas, segurança, marketplace e fórum, à distância de um toque.",
};

/* ============================================================
   MOTOBOX — Painel
   Uma grelha de 16 colunas que cabe no ecrã: o artigo em
   destaque no painel grande, os clubes, os eventos e a história
   por baixo; à direita as redes, o tempo, o clube do mês e as
   secções de serviço. No telemóvel, os painéis empilham-se.
   ============================================================ */

export default async function Painel() {
  const [artigos, clubes, eventos, redes] = await Promise.all([
    lerNoticias(), lerClubes(), lerEventos(), lerRedes(),
  ]);

  const destaque = artigoEmDestaque(artigos);
  const outros = artigos.filter((a) => a.slug !== destaque?.slug).slice(0, 3);
  const clube = clubeDoMes(clubes);
  const proximo = eventosFuturos(eventos)[0];
  const instagram = redes.find((r) => r.rede === "instagram");
  const provincias = new Set(clubes.map((c) => c.provincia).filter(Boolean)).size;

  return (
    <Moldura>
      <Logotipo />
      <h1 className="sr-only">Painel da MotoBox Angola</h1>

      <div className="grid grid-cols-[var(--tile)_var(--tile)_minmax(0,1fr)] gap-[var(--intervalo)] lg:h-full lg:grid-cols-[var(--tile)_repeat(15,minmax(0,1fr))] lg:grid-rows-[var(--tile)_minmax(0,1fr)_minmax(0,0.74fr)]">
        {/* ---------- Artigo em destaque ---------- */}
        <section
          aria-label="Artigos"
          className="painel recorte revelar group col-span-full h-[72svh] min-h-[30rem] lg:col-[1/12] lg:row-[1/3] lg:h-auto lg:min-h-0"
          style={ordem(0)}
        >
          {destaque ? (
            <>
              <FotoFundo nome={[destaque.slug, destaque.imagem]} veu="esquerda" prioridade tamanhos="(max-width: 1024px) 100vw, 70vw" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden />
              <Link
                href={`/artigos/${destaque.slug}`}
                aria-label={`Ler o artigo: ${destaque.titulo}`}
                className="absolute inset-0 z-10"
              />
              <span className="absolute right-4 top-4 z-20 md:right-5 md:top-5">
                <Chip><Newspaper /></Chip>
              </span>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-6 md:p-8 xl:pr-[21rem]">
                <p className="text-sm text-white/80">Artigo em destaque · {destaque.categoria}</p>
                <h2 className="titulo-3 mt-3 max-w-[20ch] text-balance">{destaque.titulo}</h2>
                <p className="mt-3 line-clamp-3 max-w-[50ch] text-sm leading-relaxed text-white/85 md:text-[15px]">
                  {destaque.resumo}
                </p>
                <Seta className="mt-5 size-5" />
              </div>

              {/* Mais artigos, por cima da fotografia */}
              <aside className="absolute bottom-0 right-0 z-20 hidden w-[20rem] p-5 xl:block">
                <div className="rounded-[var(--raio)] bg-black/60 p-4 backdrop-blur-md">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">Mais artigos</p>
                  <ul className="mt-3 divide-y divide-white/10">
                    {outros.map((a) => (
                      <li key={a.slug}>
                        <Link href={`/artigos/${a.slug}`} className="group/item block py-2.5">
                          <span className="block text-xs text-mb-red-light">{a.categoria}</span>
                          <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-white/90 transition-colors group-hover/item:text-white">
                            {a.titulo}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/artigos" className="mt-2 inline-flex items-center gap-2 text-sm text-white">
                    <span className="sublinhado">Todos os artigos</span>
                  </Link>
                </div>
              </aside>
            </>
          ) : (
            <PainelVazio href="/artigos" titulo="Artigos" icone={<Newspaper />} />
          )}
        </section>

        {/* ---------- Clubes ---------- */}
        <PainelFoto
          href="/clubes"
          foto="painel-clubes"
          icone={<Users />}
          titulo="Clubes"
          texto={`${clubes.length} clubes${provincias ? ` em ${provincias} províncias` : ""}, de todos os tipos de mota`}
          className="order-2 col-span-full h-64 lg:order-none lg:col-[1/6] lg:row-[3/4] lg:h-auto"
          i={1}
        />

        {/* ---------- Eventos ---------- */}
        <PainelFoto
          href={proximo ? `/eventos/${proximo.slug}` : "/eventos"}
          foto={proximo ? [proximo.slug, proximo.imagem] : "painel-eventos"}
          icone={<CalendarDays />}
          titulo="Eventos"
          texto={
            proximo
              ? `Próximo: ${proximo.titulo}, ${diaMes(proximo.dataInicio).dia} ${diaMes(proximo.dataInicio).mes}`
              : "Passeios, encontros e raides"
          }
          className="order-3 col-span-full h-64 lg:order-none lg:col-[6/9] lg:row-[3/4] lg:h-auto"
          i={2}
        />

        {/* ---------- Sobre ---------- */}
        <PainelFoto
          href="/sobre"
          foto="painel-sobre"
          icone={<BookOpen />}
          titulo="O que é a MotoBox?"
          texto="A nossa história"
          className="order-6 col-span-full h-64 lg:order-none lg:col-[9/12] lg:row-[3/4] lg:h-auto"
          i={3}
        />

        {/* ---------- Redes e tempo ---------- */}
        {instagram && (
          <a
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Seguir a MotoBox no Instagram"
            className="painel revelar order-7 flex h-[var(--tile)] items-center justify-center transition-colors hover:bg-black/70 lg:order-none lg:col-[12/13] lg:row-[1/2] lg:h-auto"
            style={ordem(4)}
          >
            <Icon name="instagram" className="size-6" />
          </a>
        )}
        <Link
          href="/contacto"
          aria-label="Falar com a MotoBox"
          className="painel revelar order-8 flex h-[var(--tile)] items-center justify-center transition-colors hover:bg-black/70 lg:order-none lg:col-[13/14] lg:row-[1/2] lg:h-auto"
          style={ordem(5)}
        >
          <Mail className="size-6" strokeWidth={1.6} aria-hidden />
        </Link>
        <div
          className={`revelar order-9 h-[var(--tile)] lg:order-none lg:col-[14/17] lg:row-[1/2] lg:h-auto ${instagram ? "" : "col-span-2"}`}
          style={ordem(6)}
        >
          <Tempo />
        </div>

        {/* ---------- Clube do mês ---------- */}
        {clube && (
          <Link
            href={`/clubes/${clube.slug}`}
            className="painel revelar group order-5 col-span-full flex h-[26rem] flex-col p-5 lg:order-none lg:col-[12/17] lg:row-[2/3] lg:h-auto"
            style={ordem(7)}
          >
            <FotoFundo nome={[clube.imagem, clube.slug]} veu="cima" tamanhos="(max-width: 1024px) 100vw, 30vw" />
            <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
            <div className="flex items-start justify-between gap-4">
              <p className="text-[15px]">Clube do mês</p>
              <Star className="size-5 fill-white" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="mt-6 text-lg leading-tight">{clube.nome}</p>
            <p className="mt-1 text-[0.8125rem] text-white/65">
              {clube.tipo === "Outro" ? "Convívio e solidariedade" : clube.tipo} · {localClube(clube)}
            </p>
            <span className="mt-auto inline-flex items-center gap-2 text-sm">
              <span className="sublinhado">Conhecer o clube</span>
              <Seta className="size-3" />
            </span>
          </Link>
        )}

        {/* ---------- Secções de serviço ---------- */}
        <div className="order-4 col-span-full grid grid-cols-2 gap-[var(--intervalo)] lg:order-none lg:col-[12/17] lg:row-[3/4] lg:grid-rows-2">
          <Ficha href="/rotas" icone={<Route />} titulo="Rotas" i={8} />
          <Ficha href="/seguranca" icone={<ShieldCheck />} titulo="Segurança" i={9} />
          <Ficha href="/marketplace" icone={<Store />} titulo="Marketplace" i={10} />
          <Ficha href="/forum" icone={<MessagesSquare />} titulo="Fórum" i={11} />
        </div>
      </div>
    </Moldura>
  );
}

/** Painel com fotografia, quadrado de ícone e título em cima à esquerda. */
function PainelFoto({
  href,
  foto,
  icone,
  titulo,
  texto,
  className,
  i,
}: {
  href: string;
  foto: string | (string | undefined)[];
  icone: ReactNode;
  titulo: string;
  texto?: string;
  className: string;
  i: number;
}) {
  return (
    <Link href={href} className={`painel revelar group flex flex-col p-6 ${className}`} style={ordem(i)}>
      <FotoFundo nome={foto} veu="cima" tamanhos="(max-width: 1024px) 100vw, 35vw" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/80 to-transparent" aria-hidden />
      <div className="flex items-start justify-between gap-4">
        <h2 className="titulo-4 max-w-[12ch]">{titulo}</h2>
        <Chip>{icone}</Chip>
      </div>
      <Seta className="mt-4 size-5" />
      {texto && <p className="mt-auto max-w-[34ch] text-sm leading-snug text-white/85">{texto}</p>}
    </Link>
  );
}

/** Ficha escura pequena: quadrado de ícone em cima, título e seta em baixo. */
function Ficha({ href, icone, titulo, i }: { href: string; icone: ReactNode; titulo: string; i: number }) {
  return (
    <Link
      href={href}
      className="painel painel-escuro revelar group flex h-36 flex-col p-4 transition-colors hover:bg-near-black lg:h-auto xl:p-5"
      style={ordem(i)}
    >
      <Chip className="self-end">{icone}</Chip>
      <span className="mt-auto text-[15px] font-semibold leading-tight">{titulo}</span>
      <Seta className="mt-2 size-3.5" />
    </Link>
  );
}

function PainelVazio({ href, titulo, icone }: { href: string; titulo: string; icone: ReactNode }) {
  return (
    <Link href={href} className="flex h-full flex-col justify-end p-8">
      <span className="absolute right-5 top-5"><Chip>{icone}</Chip></span>
      <h2 className="titulo-2">{titulo}</h2>
      <Seta className="mt-4 size-5" />
    </Link>
  );
}
