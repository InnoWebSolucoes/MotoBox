import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, CloudSun, Route, Scale, Siren } from "lucide-react";
import { duracao, totais } from "@/lib/rotas-mapas";
import { lerPaginaRotas, lerRotas } from "@/lib/rotas-conteudo";
import { preencher } from "@/lib/rotas-pagina";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Cabecalho, Seccao } from "@/components/painel/blocos";
import { Chip, Seta } from "@/components/painel/kit";
import { QuadroRota } from "./FotoRota";
import { LinksFontes } from "./partes";

// As rotas e os textos vêm do conteúdo editável (painel de gestão).
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await lerPaginaRotas();
  return { title: seo.titulo, description: seo.descricao };
}

export default async function Rotas() {
  const [rotas, p] = await Promise.all([lerRotas(), lerPaginaRotas()]);
  const n = { n: rotas.length };

  return (
    <PaginaInterior icone={<Route />}>
      <Abertura
        foto={[p.abertura.foto, "banner-rotas"]}
        sobretitulo={p.abertura.sobretitulo}
        titulo={p.abertura.titulo}
        texto={preencher(p.abertura.texto, n)}
      />

      <Seccao>
        <h2 className="titulo-2">{preencher(p.lista.titulo, n)}</h2>
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
          {rotas.map((r) => {
            const t = totais(r);
            return (
              <Link key={r.slug} href={`/rotas/${r.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
                <QuadroRota foto={r.fotos[0]} className="aspect-[4/3]" tamanhos="(max-width: 768px) 100vw, 33vw" />
                <div className="flex flex-1 flex-col p-4 pt-5 md:p-5">
                  <p className="text-[0.8125rem] text-white/60">{r.regiao}</p>
                  <h3 className="mt-1.5 text-xl font-semibold leading-snug tracking-tight">{r.nome}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{r.subtitulo}</p>
                  <p className="mt-4 text-[0.8125rem] text-white/60 tabular-nums">
                    {t.km} km · {duracao(t.minMota)} a rodar · {r.dias} {r.dias > 1 ? "dias" : "dia"}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-4 pt-4 text-[0.8125rem] text-white/60">
                    <span>
                      {r.piso} · <span className="text-mb-red-light">{r.exigencia}</span>
                    </span>
                    <Seta className="size-3.5 text-white" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {p.lista.nota && <p className="mt-6 max-w-[90ch] text-xs leading-relaxed text-white/45">{p.lista.nota}</p>}
      </Seccao>

      <Seccao className="!pt-0">
        <Cabecalho icone={<CloudSun />} titulo={p.quandoIr.titulo} texto={p.quandoIr.texto || undefined} />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
          {p.CLIMA_POR_REGIAO.map((c, i) => (
            <div key={`${c.regiao}-${i}`} className="painel painel-escuro flex flex-col p-5">
              <h3 className="text-lg font-semibold leading-snug">{c.regiao}</h3>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-white/55">{p.quandoIr.seco}</dt>
                  <dd className="mt-0.5">{c.seco}</dd>
                </div>
                <div>
                  <dt className="text-white/55">{p.quandoIr.chuva}</dt>
                  <dd className="mt-0.5">{c.chuva}</dd>
                </div>
              </dl>
              {c.nota && <p className="mt-4 text-sm text-white/70">{c.nota}</p>}
              {c.fonte?.url && (
                <a href={c.fonte.url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-4 text-xs text-white/45 hover:text-white">
                  Fonte: {c.fonte.nome}
                </a>
              )}
            </div>
          ))}
        </div>
      </Seccao>

      <Seccao className="!pt-0">
        <Cabecalho icone={<ClipboardList />} titulo={p.planear.titulo} texto={p.planear.texto || undefined} />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
          {p.CHECKLIST_VIAGEM.map((g, i) => (
            <div key={`${g.grupo}-${i}`} className="painel painel-escuro flex flex-col p-6">
              <span aria-hidden className="grid size-9 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                {i + 1}
              </span>
              <h3 className="mt-6 text-lg font-semibold">{g.grupo}</h3>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-white/80">
                {g.itens.map((item, j) => (
                  <li key={`${j}-${item}`} className="flex gap-2.5">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-mb-red" />
                    {item}
                  </li>
                ))}
              </ul>
              {g.fontes.length > 0 && (
                <p className="mt-auto pt-5 text-xs text-white/45">
                  Fontes:{" "}
                  {g.fontes.map((f, j) => (
                    <span key={`${f.url}-${j}`}>
                      {j > 0 && ", "}
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                        {f.nome}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}

          <div className="painel painel-escuro flex flex-col p-6">
            <Chip>
              <Siren />
            </Chip>
            <h3 className="mt-6 text-lg font-semibold">{p.planear.emergencia}</h3>
            <ul className="mt-4 grid grid-cols-2 gap-[var(--intervalo)]">
              {p.EMERGENCIA.numeros.map((num, i) => (
                <li key={`${num.numero}-${i}`} className="rounded-[var(--raio)] bg-white/6 p-3">
                  <a href={`tel:${num.numero}`} className="text-3xl font-semibold tabular-nums tracking-tight hover:text-mb-red-light">
                    {num.numero}
                  </a>
                  <p className="mt-1 text-xs leading-snug text-white/65">{num.servico}</p>
                </li>
              ))}
            </ul>
            <LinksFontes fontes={p.EMERGENCIA.fontes} className="mt-auto pt-5" />
          </div>
        </div>
      </Seccao>

      <Seccao className="!pt-0">
        <Cabecalho icone={<Scale />} titulo={p.regras.titulo} texto={p.regras.texto || undefined} />
        <ol className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
          {p.REGRAS_ESTRADA.map((r, i) => (
            <li key={i} className="painel painel-escuro flex min-h-44 flex-col p-6">
              <span aria-hidden className="text-4xl font-semibold text-mb-red-light">{i + 1}</span>
              <p className="mt-auto pt-6 text-[15px] leading-relaxed">{r.texto}</p>
              {r.fonte?.url && (
                <a href={r.fonte.url} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs text-white/45 hover:text-white">
                  {r.fonte.nome}
                </a>
              )}
            </li>
          ))}
        </ol>
      </Seccao>

      <Seccao className="!pt-0">
        <div className="painel painel-escuro flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-lg font-semibold">{p.emGrupo.titulo}</p>
            <p className="mt-1 max-w-[56ch] text-sm leading-relaxed text-white/70">{p.emGrupo.texto}</p>
          </div>
          {p.emGrupo.botao && p.emGrupo.ligacao && (
            <BotaoMB href={p.emGrupo.ligacao} externo={/^https?:\/\//.test(p.emGrupo.ligacao)}>
              {p.emGrupo.botao}
            </BotaoMB>
          )}
        </div>
        {p.notaFinal && <p className="mt-6 text-xs text-white/45">{p.notaFinal}</p>}
      </Seccao>
    </PaginaInterior>
  );
}
