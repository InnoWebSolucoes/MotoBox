import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays, Mail, MessagesSquare, Newspaper, Route, ShieldCheck, Store, Timer, Trophy, Users, BookOpen,
} from "lucide-react";
import { lerClubes, lerEventos, lerNoticias, lerPilotos } from "@/lib/supabase/publico";
import { classificacaoPilotos } from "@/lib/data";
import { doCampeonato, eComunidade, eProva } from "@/lib/desporto";
import { lerRedes } from "@/lib/redes";
import { artigoEmDestaque, diaMes, eventosFuturos } from "@/lib/motobox";
import { UBUNTU } from "@/lib/ubuntu";
import { Chip, FotoFundo, Logotipo, Moldura, Seta, ordem } from "@/components/painel/kit";
import { Tempo } from "@/components/painel/Tempo";
import { ContagemUbuntu } from "@/components/painel/ContagemUbuntu";
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
   Uma grelha de 16 colunas que enche o ecrã: o artigo em
   destaque no painel grande, os clubes, o desporto e os eventos
   por baixo; à direita as redes, o tempo, a contagem para o
   Ubuntu e as secções de serviço. No computador o painel nunca rola: a grelha
   aperta-se à altura do ecrã e, num ecrã baixo (variantes "baixo" e
   "mbaixo" em globals.css), os textos secundários encolhem ou saem.
   No telemóvel, os painéis empilham-se.
   ============================================================ */

export default async function Painel() {
  const [artigos, clubes, eventos, redes, pilotos] = await Promise.all([
    lerNoticias(), lerClubes(), lerEventos(), lerRedes(), lerPilotos(),
  ]);

  const destaque = artigoEmDestaque(artigos);
  const outros = artigos.filter((a) => a.slug !== destaque?.slug).slice(0, 3);
  // Eventos da comunidade no painel de Eventos; as provas vão para o Desporto.
  const proximo = eventosFuturos(eventos.filter((e) => eComunidade(e.disciplina)))[0];
  const proximaProva = eventosFuturos(eventos.filter((e) => eProva(e.disciplina)))[0];
  const lider = classificacaoPilotos(pilotos.filter(doCampeonato))[0];
  const instagram = redes.find((r) => r.rede === "instagram");
  const soClubes = clubes.filter((c) => c.tipo !== "Movimento");
  const provincias = new Set(soClubes.map((c) => c.provincia).filter(Boolean)).size;

  return (
    <Moldura>
      {/* Marca a página para globals.css tirar a rolagem no computador. */}
      <span data-painel-fixo hidden />
      <Logotipo />
      <h1 className="sr-only">Painel da MotoBox Angola</h1>

      <div className="grid grid-cols-[var(--tile)_var(--tile)_minmax(0,1fr)] gap-[var(--intervalo)] lg:h-full lg:grid-cols-[var(--tile)_repeat(15,minmax(0,1fr))] lg:grid-rows-[var(--tile)_minmax(0,1fr)_minmax(0,0.8fr)]">
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
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-6 md:p-8 xl:pr-[21rem] baixo:p-6 baixo:xl:pr-[19rem]">
                <p className="text-sm text-white/80">Artigo em destaque · {destaque.categoria}</p>
                <h2 className="titulo-3 mt-3 line-clamp-3 max-w-[20ch] text-balance baixo:mt-2 baixo:line-clamp-2 baixo:text-[1.75rem]">{destaque.titulo}</h2>
                <p className="mt-3 line-clamp-3 max-w-[50ch] text-sm leading-relaxed text-white/85 md:text-[15px] baixo:line-clamp-2 mbaixo:hidden">
                  {destaque.resumo}
                </p>
                <Seta className="mt-5 size-5 baixo:mt-3" />
              </div>

              {/* Mais artigos, por cima da fotografia */}
              <aside className="absolute bottom-0 right-0 z-20 hidden w-[20rem] p-5 xl:block baixo:w-[18rem] baixo:p-4">
                <div className="rounded-[var(--raio)] bg-black/60 p-4 backdrop-blur-md baixo:p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">Mais artigos</p>
                  <ul className="mt-3 divide-y divide-white/10">
                    {outros.map((a, n) => (
                      // Num ecrã baixo ficam dois artigos; num muito baixo, um.
                      <li key={a.slug} className={n === 2 ? "baixo:hidden" : n === 1 ? "mbaixo:hidden" : ""}>
                        <Link href={`/artigos/${a.slug}`} className="group/item block py-2.5 baixo:py-2">
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
          texto={`${soClubes.length} clubes${provincias ? ` em ${provincias} províncias` : ""}, de todos os tipos de mota`}
          className="order-2 col-span-full h-64 lg:order-none lg:col-[1/5] lg:row-[3/4] lg:h-auto"
          i={1}
        />

        {/* ---------- Desporto ---------- */}
        <PainelFoto
          href="/desporto"
          foto={["competicao", "kilamba"]}
          icone={<Trophy />}
          titulo="Desporto"
          texto={[
            lider ? `Campeonato Nacional: ${lider.nome} lidera com ${lider.estatisticas.pontos} pontos` : "Campeonato Nacional, pilotos e resultados",
            proximaProva ? `Próxima prova: ${proximaProva.titulo}, ${diaMes(proximaProva.dataInicio).dia} ${diaMes(proximaProva.dataInicio).mes}` : "",
          ].filter(Boolean).join(". ")}
          className="order-3 col-span-full h-64 lg:order-none lg:col-[5/9] lg:row-[3/4] lg:h-auto"
          i={2}
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
          className="order-4 col-span-full h-64 lg:order-none lg:col-[9/12] lg:row-[3/4] lg:h-auto"
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

        {/* ---------- Ubuntu 2027: contagem decrescente ---------- */}
        <Link
          href={`/eventos/${UBUNTU.slug}`}
          className="painel revelar group order-6 col-span-full flex min-h-[22rem] flex-col p-5 [text-shadow:0_1px_10px_rgb(0_0_0/0.55)] lg:order-none lg:col-[12/17] lg:row-[2/3] lg:min-h-0 mbaixo:p-4"
          style={ordem(7)}
        >
          <FotoFundo nome={[UBUNTU.slug, "passeios"]} veu="cima" tamanhos="(max-width: 1024px) 100vw, 30vw" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/75 to-transparent" aria-hidden />
          <div className="flex items-start justify-between gap-4">
            <p className="text-[15px]">{UBUNTU.nome}</p>
            <Timer className="size-5" strokeWidth={1.6} aria-hidden />
          </div>
          <p className="mt-6 text-lg leading-tight baixo:mt-3">Africa Ubuntu Breakfast Run</p>
          <p className="mt-1 text-[0.8125rem] text-white/80">31 de Janeiro · {UBUNTU.percurso}</p>
          <div className="mt-auto pt-4">
            <ContagemUbuntu data={UBUNTU.partida} />
            <span className="mt-3 inline-flex items-center gap-2 text-sm mbaixo:hidden">
              <span className="sublinhado">Ver o evento</span>
              <Seta className="size-3" />
            </span>
          </div>
        </Link>

        {/* ---------- Secções de serviço: três em cima, duas em baixo ---------- */}
        <div className="order-5 col-span-full grid grid-cols-6 gap-[var(--intervalo)] lg:order-none lg:col-[12/17] lg:row-[3/4] lg:grid-rows-2">
          <Ficha href="/rotas" icone={<Route />} titulo="Rotas" className="col-span-2" estreita i={8} />
          <Ficha href="/seguranca" icone={<ShieldCheck />} titulo="Segurança" className="col-span-2" estreita i={9} />
          <Ficha href="/sobre" icone={<BookOpen />} titulo="A MotoBox" className="col-span-2" estreita i={10} />
          <Ficha href="/marketplace" icone={<Store />} titulo="Marketplace" className="col-span-3" i={11} />
          <Ficha href="/forum" icone={<MessagesSquare />} titulo="Fórum" className="col-span-3" i={12} />
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
    <Link href={href} className={`painel revelar group flex flex-col p-6 baixo:p-5 mbaixo:p-4 ${className}`} style={ordem(i)}>
      <FotoFundo nome={foto} veu="cima" tamanhos="(max-width: 1024px) 100vw, 35vw" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/80 to-transparent" aria-hidden />
      <div className="flex items-start justify-between gap-4">
        <h2 className="titulo-4 max-w-[12ch]">{titulo}</h2>
        <Chip>{icone}</Chip>
      </div>
      <Seta className="mt-4 size-5 baixo:mt-2 mbaixo:hidden" />
      {texto && <p className="mt-auto line-clamp-3 max-w-[34ch] pt-2 text-sm leading-snug text-white/85 baixo:line-clamp-2">{texto}</p>}
    </Link>
  );
}

/**
 * Ficha escura pequena: quadrado de ícone em cima, título e seta numa só
 * linha em baixo, para caber inteira mesmo nas linhas mais baixas da grelha.
 */
function Ficha({ href, icone, titulo, className = "", estreita = false, i }: {
  href: string; icone: ReactNode; titulo: string; className?: string;
  /** Uma de três lado a lado: abaixo dos ecrãs largos (2xl) fica só com o título. */
  estreita?: boolean;
  i: number;
}) {
  return (
    <Link
      href={href}
      className={`painel painel-escuro revelar group @container flex h-32 min-w-0 flex-col justify-between gap-2 p-3 transition-colors hover:bg-near-black lg:h-auto 2xl:p-4 baixo:gap-1 baixo:p-3 mbaixo:p-2.5 ${className}`}
      style={ordem(i)}
    >
      <Chip className="self-end mbaixo:!size-7 mbaixo:[&_svg]:!size-4">{icone}</Chip>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-[15px] font-semibold leading-tight">{titulo}</span>
        {/* A seta só aparece quando a ficha tem largura para ela e para o título. */}
        <Seta className={`hidden size-3.5 shrink-0 @min-[6.25rem]:block ${estreita ? "max-2xl:!hidden" : ""}`} />
      </span>
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
