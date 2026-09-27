import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Placeholder } from "@/components/Brand";
import { ButtonLink, Icon } from "@/components/ui";
import { lerClubes } from "@/lib/supabase/publico";
import { ROTAS } from "@/lib/rotas";
import { ClubesFiltrados, ListaClubes } from "./ClubesClient";
import { JuntarClube } from "./JuntarClube";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Clubes",
  description:
    "Clubes de mota de lazer e moto-turismo em Angola: grupos de passeio, Lady Riders, raides e viagens. Encontre um clube na sua província e as melhores rotas para ir de mota.",
};

export default async function ClubesPage() {
  const clubes = await lerClubes();
  const provincias = new Set(clubes.map((c) => c.provincia)).size;
  const rotas = ROTAS.slice(0, 4);

  const ladyRiders = (
    <section className="mt-16 grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]" aria-labelledby="lady-riders">
      <Placeholder
        nome="joana-ferraz"
        label="Fotografia ilustrativa: motociclista de capacete na estrada"
        className="media aspect-[16/10]"
        tamanhos="(max-width: 1024px) 100vw, 45vw"
      />
      <div>
        <p className="eyebrow text-mb-red">Lady Riders</p>
        <h2 id="lady-riders" className="title-xl mt-2 text-3xl sm:text-4xl">Elas também conduzem</h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-400">
          Há motociclistas angolanas a viajar juntas pelo país e além-fronteiras: as Ladies in 2 Wheels in
          Angola já rodaram até à Namíbia, ao Botswana e à África do Sul, com a filantropia na bagagem. E há
          clubes mistos presididos por mulheres, como o Anjos Bantu. Como elas dizem, «a lady rider é a
          motorista, não a pendura».
        </p>
        <Link
          href="/clubes?tipo=lady-riders"
          className="group mt-6 inline-flex items-center gap-3 font-ui text-base text-white transition-colors hover:text-ink-200"
        >
          Ver clubes Lady Riders
          <span aria-hidden className="grid size-9 place-items-center rounded-full bg-ink-800 transition-colors group-hover:bg-mb-red">
            <Icon name="arrow" className="size-4" />
          </span>
        </Link>
      </div>
    </section>
  );

  return (
    <>
      {/* ============ CABEÇALHO ============ */}
      <header className="relative overflow-hidden">
        <Placeholder nome="passeios" className="absolute inset-0" tamanhos="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/30" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-2xl rise">
            <p className="eyebrow text-mb-red">Lazer e turismo</p>
            <h1 className="title-xl mt-3 text-5xl sm:text-6xl lg:text-7xl">Clubes</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
              Quem anda de mota por gosto: grupos de passeio, raides pelo país, viagens aos países vizinhos e
              muita solidariedade pelo caminho. Sem pilotos nem pontos, só estrada.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#lista">
                Encontrar um clube
              </ButtonLink>
              <ButtonLink href="/clubes/rotas" variant="outline">
                <Icon name="map" className="size-4" />
                Rotas de moto-turismo
              </ButtonLink>
            </div>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
            {[
              { v: clubes.length, l: clubes.length === 1 ? "Clube" : "Clubes" },
              { v: provincias, l: provincias === 1 ? "Província" : "Províncias" },
              { v: ROTAS.length, l: "Rotas" },
            ].map((s) => (
              <div key={s.l}>
                <dd className="font-display text-3xl text-white tabular-nums">{s.v}</dd>
                <dt className="eyebrow mt-1 text-ink-500">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* ============ INTRODUÇÃO ============ */}
        <section className="mb-12 grid gap-6 border-b border-white/6 pb-12 lg:grid-cols-[1fr_1.4fr]" aria-label="Andar de mota por lazer em Angola">
          <h2 className="title-xl text-2xl sm:text-3xl">Andar de mota por lazer em Angola</h2>
          <div className="space-y-4 text-sm leading-relaxed text-ink-400 sm:text-base">
            <p>
              O movimento motard angolano ganhou forma no início dos anos 2000, com grupos de amigos que saíam
              juntos por Luanda. Em 2006, os Amigos da Picada saíram do país pela primeira vez, numa viagem em grupo
              até à Namíbia, e abriram caminho a uma ideia simples: conhecer Angola de mota.
            </p>
            <p>
              Hoje os clubes juntam saídas de domingo à volta das cidades, raides a Malanje, a Benguela ou ao
              Soyo, viagens além-fronteiras e acções solidárias em hospitais e comunidades. Em Julho
              de 2026, a primeira edição do Dia do Motard Angolano juntou clubes no Autódromo de Luanda.
            </p>
          </div>
        </section>

        {/* ============ FILTROS E LISTA ============ */}
        <Suspense fallback={<ListaClubes clubes={clubes} tipo={null} provincia={null} ladyRiders={ladyRiders} />}>
          <ClubesFiltrados clubes={clubes} ladyRiders={ladyRiders} />
        </Suspense>

        {/* ============ MOTO-TURISMO ============ */}
        <section className="mt-20 border-t border-white/6 pt-14" aria-labelledby="moto-turismo">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow mb-2 text-mb-red">Moto-turismo</p>
              <h2 id="moto-turismo" className="title-xl text-3xl sm:text-4xl">Para onde ir de mota</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                Da Serra da Leba às quedas de Kalandula: estrada, piso, melhor época e cuidados de cada destino, com
                as fontes à vista. E uma lista para planear a viagem.
              </p>
            </div>
            <Link
              href="/clubes/rotas"
              className="group inline-flex items-center gap-3 font-ui text-base text-white transition-colors hover:text-ink-200"
            >
              Todas as rotas
              <span aria-hidden className="grid size-9 place-items-center rounded-full bg-ink-800 transition-colors group-hover:bg-mb-red">
                <Icon name="arrow" className="size-4" />
              </span>
            </Link>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
            {rotas.map((r) => (
              <Link key={r.slug} href={`/clubes/rotas/${r.slug}`} className="group block">
                <Placeholder nome={r.imagem} className="media aspect-[4/3]" tamanhos="(max-width: 1024px) 50vw, 25vw" largura={800} />
                <p className="eyebrow mt-3 text-mb-red">{r.regiao}</p>
                <h3 className="mt-1.5 font-display text-base uppercase leading-tight text-white transition-colors group-hover:text-mb-red sm:text-lg">
                  {r.nome}
                </h3>
                <p className="mt-1 text-xs text-ink-500">{r.piso} · {r.exigencia}</p>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-ink-600">Fotografias ilustrativas.</p>
        </section>

        {/* ============ JUNTAR UM CLUBE ============ */}
        <section id="juntar" className="relative mt-20 scroll-mt-24 overflow-hidden rounded-card bg-ink-900 p-6 sm:p-10" aria-labelledby="juntar-titulo">
          <div className="speed-lines absolute inset-0 opacity-20" aria-hidden />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <p className="eyebrow text-mb-red">Falta o seu clube?</p>
              <h2 id="juntar-titulo" className="title-xl mt-3 text-3xl sm:text-4xl">Tem um clube? Junte-o à Motobox</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-400">
                Clube de passeio, grupo de Lady Riders, donos da mesma marca, amigos do todo-o-terreno: se sai de
                mota em grupo, queremos o seu clube aqui. A página é gratuita e mostra as vossas actividades e
                as redes, e os vossos passeios e encontros podem entrar na secção Eventos.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-ink-300">
                {[
                  "Página própria do clube, com as redes e o contacto",
                  "Os vossos passeios e encontros na secção Eventos",
                  "Envie o logótipo e fotografias vossas para a capa",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mb-red/15 text-mb-red">
                      <Icon name="check" className="size-3" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <JuntarClube />
          </div>
        </section>
      </div>
    </>
  );
}
