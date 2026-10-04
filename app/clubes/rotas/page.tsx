import type { Metadata } from "next";
import Link from "next/link";
import { C } from "@/components/T";
import { Icon, Tag } from "@/components/ui";
import { CHECKLIST_VIAGEM, CLIMA_POR_REGIAO, EMERGENCIA, REGRAS_ESTRADA, ROTAS, type Rota } from "@/lib/rotas";
import { duracao, totais } from "@/lib/rotas-mapas";
import { FotoRota } from "./FotoRota";
import { CreditoFoto, LinksFontes, TOM_EXIGENCIA } from "./partes";

export const metadata: Metadata = {
  title: "Rotas de moto-turismo",
  description:
    "Para onde ir de mota em Angola: Serra da Leba, Tundavala, Kalandula, Miradouro da Lua, Cabo Ledo, deserto do Namibe e costa de Benguela. Mapa e GPX, troço a troço, combustível, onde dormir, horário e cuidados, com fontes.",
};

/** Quilómetros, tempo a rodar, dias e exigência: o que decide se a rota é para hoje. */
function Meta({ rota }: { rota: Rota }) {
  const t = totais(rota);
  return (
    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-300 tabular-nums">
      <div className="flex items-center gap-1.5">
        <dt className="sr-only">Distância</dt>
        <Icon name="map" className="size-3.5 text-ink-500" />
        <dd>{t.km} km</dd>
      </div>
      <div className="flex items-center gap-1.5">
        <dt className="sr-only">A rodar</dt>
        <Icon name="clock" className="size-3.5 text-ink-500" />
        <dd>{duracao(t.minMota)}</dd>
      </div>
      <div className="flex items-center gap-1.5">
        <dt className="sr-only">Dias</dt>
        <Icon name="calendar" className="size-3.5 text-ink-500" />
        <dd>
          {rota.dias} {rota.dias > 1 ? <span>dias</span> : <span>dia</span>}
        </dd>
      </div>
      <div className="flex items-center gap-1.5">
        <dt className="sr-only">Exigência</dt>
        <span aria-hidden className={`size-2 rounded-full ${TOM_EXIGENCIA[rota.exigencia]}`} />
        <dd>{rota.exigencia}</dd>
      </div>
    </dl>
  );
}

export default function RotasPage() {
  const grandes = ROTAS.slice(0, 2);
  const resto = ROTAS.slice(2);
  const capa = ROTAS[0].fotos[0];

  return (
    <>
      {/* ============ CABEÇALHO ============ */}
      <header className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <FotoRota foto={capa} tamanhos="100vw" largura={1920} prioridade />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/25" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-ink-950 to-transparent" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
          <Link href="/clubes" className="inline-flex items-center gap-2 font-ui text-sm text-ink-400 transition-colors hover:text-white">
            <span aria-hidden>←</span> Clubes
          </Link>
          <div className="mt-6 max-w-2xl rise">
            <p className="eyebrow text-mb-red">Moto-turismo</p>
            <h1 className="title-xl mt-3 text-5xl sm:text-6xl">Rotas de mota em Angola</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
              Da serra ao deserto, {ROTAS.length} rotas prontas a fazer: mapa e GPX, troço a troço com distâncias e tempos,
              horário, combustível, onde comer e dormir, documentos e perigos. As fontes estão em cada rota.
            </p>
          </div>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Nesta página">
            <a href="#rotas" className="chip h-9 px-4 text-sm">As rotas</a>
            <a href="#quando-ir" className="chip h-9 px-4 text-sm">Quando ir</a>
            <a href="#planear" className="chip h-9 px-4 text-sm">Planear a viagem</a>
          </nav>
          <p className="mt-10 text-[11px] text-ink-500">
            <C>{capa.local}</C>. <CreditoFoto foto={capa} />
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* ============ ROTAS ============ */}
        <section id="rotas" className="scroll-mt-24" aria-label="Rotas">
          {/* As duas primeiras em grande, título sobre a fotografia, como a manchete da F1 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {grandes.map((r, i) => (
              <Link
                key={r.slug}
                href={`/clubes/rotas/${r.slug}`}
                className="group relative isolate flex min-h-[380px] flex-col justify-end overflow-hidden rounded-card sm:min-h-[460px]"
              >
                <div className="absolute inset-0 -z-10 bg-ink-900">
                  <FotoRota
                    foto={r.fotos[0]}
                    tamanhos="(max-width: 1024px) 100vw, 50vw"
                    largura={1280}
                    className="transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    <Tag tone="red">{String(i + 1).padStart(2, "0")}</Tag>
                    <Tag tone="outline">{r.regiao}</Tag>
                  </div>
                  <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] text-white sm:text-5xl">{r.nome}</h2>
                  <p className="mt-2 font-ui text-lg text-ink-200">
                    <C>{r.subtitulo}</C>
                  </p>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-300 line-clamp-2">
                    <C>{r.resumo}</C>
                  </p>
                  <Meta rota={r} />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {resto.map((r, i) => (
              <Link key={r.slug} href={`/clubes/rotas/${r.slug}`} className="group block">
                <div className="media relative aspect-[16/10] bg-ink-900">
                  <FotoRota
                    foto={r.fotos[0]}
                    tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-3 font-display text-4xl leading-none text-white/85 [text-shadow:0_1px_10px_rgb(0_0_0/0.5)]">
                    {String(i + 3).padStart(2, "0")}
                  </span>
                </div>
                <p className="eyebrow mt-4 text-mb-red">{r.regiao}</p>
                <h2 className="mt-1.5 font-display text-2xl uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
                  {r.nome}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-400 line-clamp-3">
                  <C>{r.resumo}</C>
                </p>
                <Meta rota={r} />
              </Link>
            ))}
          </div>
          <p className="mt-8 text-[11px] leading-relaxed text-ink-600">
            Fotografias reais dos locais, com licença livre, do Wikimedia Commons: o autor e a licença estão em cada rota.
            Distâncias do OSRM sobre o OpenStreetMap; o tempo a rodar inclui uma margem para mota e não conta paragens.
            Informação verificada em Outubro de 2026: estradas, preços e combustível mudam, por isso confirme sempre
            localmente antes de partir.
          </p>
        </section>

        {/* ============ QUANDO IR ============ */}
        <section id="quando-ir" className="mt-20 scroll-mt-24 border-t border-white/6 pt-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <p className="eyebrow mb-2 text-mb-red">Quando ir</p>
              <h2 className="title-xl text-3xl sm:text-4xl">O cacimbo é a época da estrada</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-400">
                A estação seca, o cacimbo, vai mais ou menos de Maio a Setembro e é a época mais segura para as
                estradas de montanha e para as picadas. Traz muitas vezes nevoeiro de manhã, e Julho e Agosto são
                os meses mais frescos. As quedas de água, essas, têm mais caudal quando chove.
              </p>
            </div>
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="eyebrow py-3 pr-4 font-normal text-ink-500">Região</th>
                    <th className="eyebrow py-3 pr-4 font-normal text-ink-500">Seco</th>
                    <th className="eyebrow py-3 pr-4 font-normal text-ink-500">Chuva</th>
                    <th className="eyebrow py-3 font-normal text-ink-500">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {CLIMA_POR_REGIAO.map((c) => (
                    <tr key={c.regiao} className="border-b border-white/6 last:border-0">
                      <td className="py-3.5 pr-4 font-medium text-white">
                        <C>{c.regiao}</C>
                      </td>
                      <td className="py-3.5 pr-4 text-ink-200">
                        <C>{c.seco}</C>
                      </td>
                      <td className="py-3.5 pr-4 text-ink-300">
                        <C>{c.chuva}</C>
                      </td>
                      <td className="py-3.5 text-xs text-ink-400">
                        <C>{c.nota}</C>{" "}
                        <a href={c.fonte.url} target="_blank" rel="noopener noreferrer" className="text-ink-500 underline decoration-white/20 underline-offset-2 hover:text-white">
                          fonte
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============ PLANEAR ============ */}
        <section id="planear" className="mt-20 scroll-mt-24 border-t border-white/6 pt-14">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2 text-mb-red">Antes de sair</p>
            <h2 className="title-xl text-3xl sm:text-4xl">Planear uma viagem de mota</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-400">
              O essencial para uma viagem longa em Angola, com base no Código de Estrada e nos avisos de viagem
              oficiais.
            </p>
          </div>

          <div className="mt-10 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {CHECKLIST_VIAGEM.map((g) => (
              <div key={g.grupo}>
                <h3 className="font-display text-lg uppercase text-white">
                  <C>{g.grupo}</C>
                </h3>
                <ul className="mt-3">
                  {g.itens.map((t) => (
                    <li key={t} className="flex items-start gap-3 border-b border-white/6 py-3 text-sm leading-relaxed text-ink-300 last:border-0">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mb-red/12 text-mb-red">
                        <Icon name="check" className="size-3" />
                      </span>
                      <span>
                        <C>{t}</C>
                      </span>
                    </li>
                  ))}
                </ul>
                <LinksFontes fontes={g.fontes} className="mt-2" />
              </div>
            ))}

            <div className="rounded-card bg-ink-900 p-6">
              <h3 className="font-display text-lg uppercase text-white">Regras da estrada</h3>
              <ul className="mt-3 space-y-3">
                {REGRAS_ESTRADA.map((r) => (
                  <li key={r.texto} className="text-sm leading-relaxed text-ink-300">
                    <C>{r.texto}</C>
                  </li>
                ))}
              </ul>
              <LinksFontes fontes={[...new Map(REGRAS_ESTRADA.map((r) => [r.fonte.url, r.fonte])).values()]} className="mt-4" />
            </div>

            <div className="rounded-card bg-ink-900 p-6">
              <h3 className="font-display text-lg uppercase text-white">Números de emergência</h3>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {EMERGENCIA.numeros.map((n) => (
                  <li key={n.numero}>
                    <a href={`tel:${n.numero}`} className="font-display text-2xl text-white tabular-nums hover:text-mb-red">
                      {n.numero}
                    </a>
                    <p className="text-xs text-ink-400">
                      <C>{n.servico}</C>
                    </p>
                  </li>
                ))}
              </ul>
              <LinksFontes fontes={EMERGENCIA.fontes} className="mt-4" />
            </div>
          </div>
        </section>

        {/* ============ CLUBES ============ */}
        <section className="mt-20 flex flex-wrap items-center justify-between gap-6 rounded-card bg-ink-900 p-6 sm:p-10">
          <div className="max-w-xl">
            <h2 className="title-xl text-2xl sm:text-3xl">Melhor em grupo</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">
              Fora das cidades, viajar com mais motas é mais seguro. Os clubes de moto-turismo organizam passeios
              e raides a muitos destes destinos.
            </p>
          </div>
          <Link
            href="/clubes?tipo=moto-turismo"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-mb-red px-7 font-ui text-lg text-white transition-colors hover:bg-mb-red-dark"
          >
            Encontrar um clube
            <Icon name="arrow" className="size-4" />
          </Link>
        </section>
      </div>
    </>
  );
}
