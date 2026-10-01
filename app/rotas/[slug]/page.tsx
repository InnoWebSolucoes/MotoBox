import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lightbulb, MapPin, Route } from "lucide-react";
import { ROTAS, lerRota } from "@/lib/rotas";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Cabecalho, Numeros, Seccao } from "@/components/painel/blocos";
import { Foto, Seta } from "@/components/painel/kit";

export function generateStaticParams() {
  return ROTAS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = lerRota(slug);
  if (!r) return { title: "Rota não encontrada" };
  return { title: `${r.nome}: rota de mota`, description: r.resumo };
}

export default async function RotaPagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rota = lerRota(slug);
  if (!rota) notFound();

  const outras = ROTAS.filter((r) => r.slug !== rota.slug).slice(0, 3);

  return (
    <PaginaInterior icone={<Route />}>
      <Abertura foto={[rota.slug, rota.imagem]} sobretitulo={rota.regiao} titulo={rota.nome} texto={rota.resumo} />

      <Seccao>
        <Numeros
          colunas={4}
          itens={[
            { valor: <span className="text-2xl lg:text-3xl">{rota.partida}</span>, texto: "ponto de partida" },
            { valor: <span className="text-2xl lg:text-3xl">{rota.piso}</span>, texto: "piso" },
            { valor: <span className="text-2xl lg:text-3xl">{rota.exigencia}</span>, texto: rota.exigenciaPorque },
            { valor: <span className="text-2xl lg:text-3xl">{rota.provincias.join(", ")}</span>, texto: "províncias" },
          ]}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div>
            <h2 className="titulo-3">{rota.subtitulo}</h2>
            <div className="prosa mt-6 max-w-[64ch]">
              {rota.descricao.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-8 rounded-[var(--raio)] bg-white/5 p-5 text-sm leading-relaxed text-white/80">
              <p className="font-semibold text-white">O piso</p>
              <p className="mt-1">{rota.pisoDetalhe}</p>
              <p className="mt-4 font-semibold text-white">Melhor época</p>
              <p className="mt-1">{rota.melhorEpoca}</p>
            </div>
          </div>

          <div className="space-y-[var(--intervalo)]">
            <div className="painel painel-escuro p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="size-5 text-mb-red-light" aria-hidden /> Distâncias
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/80">
                {rota.distancias.map((d) => (
                  <li key={d.texto}>
                    {d.texto}
                    {rota.fontes[d.fonte] && (
                      <a
                        href={rota.fontes[d.fonte].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1.5 text-xs text-white/45 hover:text-white"
                      >
                        [{d.fonte + 1}]
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="painel painel-escuro p-6">
              <h3 className="text-lg font-semibold">Destaques</h3>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-white/80">
                {rota.destaques.map((d) => (
                  <li key={d} className="flex gap-2.5">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-mb-red" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Seccao>

      <Seccao className="!pt-0">
        <Cabecalho icone={<Lightbulb />} titulo="Cuidados de quem já lá foi" />
        <ol className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2">
          {rota.dicas.map((d, i) => (
            <li key={i} className="painel painel-escuro flex gap-5 p-6">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                {i + 1}
              </span>
              <p className="text-[15px] leading-relaxed text-white/85">{d}</p>
            </li>
          ))}
        </ol>
      </Seccao>

      <Seccao className="!pt-0">
        <h2 className="titulo-4">Fontes</h2>
        <ol className="mt-5 grid gap-x-10 gap-y-2 text-sm text-white/65 md:grid-cols-2">
          {rota.fontes.map((f, i) => (
            <li key={f.url}>
              <span className="text-white/40">[{i + 1}]</span>{" "}
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {f.nome}
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-white/45">Fotografia ilustrativa.</p>
      </Seccao>

      <Seccao className="!pt-0">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="titulo-3">Outras rotas</h2>
          <Link href="/rotas" className="group inline-flex items-center gap-2 text-sm">
            <span className="sublinhado">Todas as rotas</span>
            <Seta className="size-3" />
          </Link>
        </div>
        <div className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-3">
          {outras.map((r) => (
            <Link key={r.slug} href={`/rotas/${r.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
              <Foto nome={[r.slug, r.imagem]} className="aspect-[4/3]" largura={700} tamanhos="(max-width: 768px) 100vw, 33vw" />
              <div className="flex items-end justify-between gap-4 p-4 md:p-5">
                <div>
                  <p className="text-[0.8125rem] text-white/60">{r.regiao}</p>
                  <h3 className="mt-1 text-lg font-semibold leading-snug">{r.nome}</h3>
                </div>
                <Seta className="mb-1 size-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </Seccao>
    </PaginaInterior>
  );
}
