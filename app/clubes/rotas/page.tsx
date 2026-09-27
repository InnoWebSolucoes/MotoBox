import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { Icon, Tag } from "@/components/ui";
import { CHECKLIST_VIAGEM, CLIMA_POR_REGIAO, REGRAS_ESTRADA, ROTAS, type Rota } from "@/lib/rotas";

export const metadata: Metadata = {
  title: "Rotas de moto-turismo",
  description:
    "Para onde ir de mota em Angola: Serra da Leba, Tundavala, Kalandula, Miradouro da Lua, Cabo Ledo, deserto do Namibe e costa de Benguela. Estrada, piso, melhor época e cuidados, com fontes.",
};

/** Cor discreta por exigência: informação, não alarme. */
const TOM_EXIGENCIA: Record<Rota["exigencia"], string> = {
  Tranquila: "bg-ok",
  Média: "bg-gold",
  Exigente: "bg-mb-red",
  Aventura: "bg-mb-red",
};

function Meta({ rota }: { rota: Rota }) {
  return (
    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-400">
      <div className="flex items-center gap-1.5">
        <dt className="sr-only">Piso</dt>
        <Icon name="map" className="size-3.5 text-ink-500" />
        <dd>{rota.piso}</dd>
      </div>
      <div className="flex items-center gap-1.5">
        <dt className="sr-only">Exigência</dt>
        <span aria-hidden className={`size-2 rounded-full ${TOM_EXIGENCIA[rota.exigencia]}`} />
        <dd>{rota.exigencia}</dd>
      </div>
      <div className="flex items-center gap-1.5">
        <dt className="sr-only">Partida</dt>
        <Icon name="pin" className="size-3.5 text-ink-500" />
        <dd>Desde {rota.partida}</dd>
      </div>
    </dl>
  );
}

export default function RotasPage() {
  const grandes = ROTAS.slice(0, 2);
  const resto = ROTAS.slice(2);

  return (
    <>
      {/* ============ CABEÇALHO ============ */}
      <header className="relative overflow-hidden">
        <Placeholder nome="fe350" className="absolute inset-0" tamanhos="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/25" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
          <Link href="/clubes" className="inline-flex items-center gap-2 font-ui text-sm text-ink-400 transition-colors hover:text-white">
            <span aria-hidden>←</span> Clubes
          </Link>
          <div className="mt-6 max-w-2xl rise">
            <p className="eyebrow text-mb-red">Moto-turismo</p>
            <h1 className="title-xl mt-3 text-5xl sm:text-6xl">Rotas de mota em Angola</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
              Da serra ao deserto, {ROTAS.length} destinos para ir de mota, com o piso, a melhor época e os cuidados de cada
              um. As fontes estão no fim de cada rota.
            </p>
          </div>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Nesta página">
            <a href="#rotas" className="chip h-9 px-4 text-sm">As rotas</a>
            <a href="#quando-ir" className="chip h-9 px-4 text-sm">Quando ir</a>
            <a href="#planear" className="chip h-9 px-4 text-sm">Planear a viagem</a>
          </nav>
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
                <Placeholder
                  nome={r.imagem}
                  className="absolute inset-0 -z-10 transition-transform duration-700 group-hover:scale-105"
                  tamanhos="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    <Tag tone="red">{String(i + 1).padStart(2, "0")}</Tag>
                    <Tag tone="outline">{r.regiao}</Tag>
                  </div>
                  <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] text-white sm:text-5xl">{r.nome}</h2>
                  <p className="mt-2 font-ui text-lg text-ink-200">{r.subtitulo}</p>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-300 line-clamp-2">{r.resumo}</p>
                  <Meta rota={r} />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {resto.map((r, i) => (
              <Link key={r.slug} href={`/clubes/rotas/${r.slug}`} className="group block">
                <div className="relative">
                  <Placeholder
                    nome={r.imagem}
                    className="media aspect-[16/10] transition-transform duration-700"
                    tamanhos="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    largura={900}
                  />
                  <span className="absolute left-4 top-3 font-display text-4xl leading-none text-white/85 [text-shadow:0_1px_10px_rgb(0_0_0/0.5)]">
                    {String(i + 3).padStart(2, "0")}
                  </span>
                </div>
                <p className="eyebrow mt-4 text-mb-red">{r.regiao}</p>
                <h2 className="mt-1.5 font-display text-2xl uppercase leading-tight text-white transition-colors group-hover:text-mb-red">
                  {r.nome}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-400 line-clamp-3">{r.resumo}</p>
                <Meta rota={r} />
              </Link>
            ))}
          </div>
          <p className="mt-8 text-[11px] text-ink-600">
            Fotografias ilustrativas, não dos próprios locais. Informação verificada em Setembro de 2026: estradas,
            preços e combustível mudam, por isso confirme sempre localmente antes de partir.
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
                      <td className="py-3.5 pr-4 font-medium text-white">{c.regiao}</td>
                      <td className="py-3.5 pr-4 text-ink-200">{c.seco}</td>
                      <td className="py-3.5 pr-4 text-ink-300">{c.chuva}</td>
                      <td className="py-3.5 text-xs text-ink-400">
                        {c.nota}{" "}
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
                <h3 className="font-display text-lg uppercase text-white">{g.grupo}</h3>
                <ul className="mt-3">
                  {g.itens.map((t) => (
                    <li key={t} className="flex items-start gap-3 border-b border-white/6 py-3 text-sm leading-relaxed text-ink-300 last:border-0">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mb-red/12 text-mb-red">
                        <Icon name="check" className="size-3" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-ink-600">
                  Fontes:{" "}
                  {g.fontes.map((f, i) => (
                    <span key={f.url}>
                      {i > 0 && ", "}
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="underline decoration-white/15 underline-offset-2 hover:text-ink-300">
                        {f.nome}
                      </a>
                    </span>
                  ))}
                </p>
              </div>
            ))}

            <div className="rounded-card bg-ink-900 p-6">
              <h3 className="font-display text-lg uppercase text-white">Regras da estrada</h3>
              <ul className="mt-3 space-y-3">
                {REGRAS_ESTRADA.map((r) => (
                  <li key={r.texto} className="text-sm leading-relaxed text-ink-300">{r.texto}</li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-ink-600">
                Fonte:{" "}
                <a href={REGRAS_ESTRADA[0].fonte.url} target="_blank" rel="noopener noreferrer" className="underline decoration-white/15 underline-offset-2 hover:text-ink-300">
                  {REGRAS_ESTRADA[0].fonte.nome}
                </a>
              </p>
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
