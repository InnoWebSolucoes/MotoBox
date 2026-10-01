import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, CloudSun, Route, Scale } from "lucide-react";
import { CHECKLIST_VIAGEM, CLIMA_POR_REGIAO, REGRAS_ESTRADA, ROTAS } from "@/lib/rotas";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Cabecalho, Seccao } from "@/components/painel/blocos";
import { Foto, Seta } from "@/components/painel/kit";

export const metadata: Metadata = {
  title: "Rotas",
  description:
    "Para onde ir de mota em Angola: Serra da Leba, Tundavala, Kalandula, Miradouro da Lua, Namibe e a costa. Estrada, piso, melhor época e cuidados, com fontes.",
};

export default function Rotas() {
  return (
    <PaginaInterior icone={<Route />}>
      <Abertura
        foto="banner-rotas"
        sobretitulo="Moto-turismo"
        titulo="Para onde ir de mota"
        texto="Da Serra da Leba às quedas de Kalandula: a estrada, o piso, a melhor época e os cuidados de cada destino. Tudo com as fontes à vista."
      />

      <Seccao>
        <h2 className="titulo-2">{ROTAS.length} rotas por Angola</h2>
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
          {ROTAS.map((r) => (
            <Link key={r.slug} href={`/rotas/${r.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
              <Foto nome={[r.slug, r.imagem]} className="aspect-[4/3]" largura={800} tamanhos="(max-width: 768px) 100vw, 33vw" />
              <div className="flex flex-1 flex-col p-4 pt-5 md:p-5">
                <p className="text-[0.8125rem] text-white/60">{r.regiao}</p>
                <h3 className="mt-1.5 text-xl font-semibold leading-snug tracking-tight">{r.nome}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{r.subtitulo}</p>
                <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-[0.8125rem] text-white/60">
                  <span>
                    {r.piso} · <span className="text-mb-red-light">{r.exigencia}</span>
                  </span>
                  <Seta className="size-3.5 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Seccao>

      <Seccao className="!pt-0">
        <Cabecalho
          icone={<CloudSun />}
          titulo="Quando ir"
          texto="A época seca é a mais fácil para viajar de mota. A chuva traz mais verde e mais caudal às quedas, mas também lama nas picadas."
        />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
          {CLIMA_POR_REGIAO.map((c) => (
            <div key={c.regiao} className="painel painel-escuro flex flex-col p-5">
              <h3 className="text-lg font-semibold leading-snug">{c.regiao}</h3>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-white/55">Seco</dt>
                  <dd className="mt-0.5">{c.seco}</dd>
                </div>
                <div>
                  <dt className="text-white/55">Chuva</dt>
                  <dd className="mt-0.5">{c.chuva}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-white/70">{c.nota}</p>
              <a href={c.fonte.url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-4 text-xs text-white/45 hover:text-white">
                Fonte: {c.fonte.nome}
              </a>
            </div>
          ))}
        </div>
      </Seccao>

      <Seccao className="!pt-0">
        <Cabecalho
          icone={<ClipboardList />}
          titulo="Planear uma viagem de mota"
          texto="Uma lista para rever antes de sair da cidade. Cada grupo diz de onde vem a informação."
        />
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
          {CHECKLIST_VIAGEM.map((g, i) => (
            <div key={g.grupo} className="painel painel-escuro flex flex-col p-6">
              <span aria-hidden className="grid size-9 place-items-center rounded-[4px] bg-mb-red text-sm font-semibold">
                {i + 1}
              </span>
              <h3 className="mt-6 text-lg font-semibold">{g.grupo}</h3>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-white/80">
                {g.itens.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-mb-red" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-5 text-xs text-white/45">
                Fontes:{" "}
                {g.fontes.map((f, j) => (
                  <span key={f.url}>
                    {j > 0 && ", "}
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                      {f.nome}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </Seccao>

      <Seccao className="!pt-0">
        <Cabecalho icone={<Scale />} titulo="Regras da estrada" texto="O que o Código de Estrada diz a quem viaja de mota." />
        <ol className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-3">
          {REGRAS_ESTRADA.map((r, i) => (
            <li key={i} className="painel painel-escuro flex min-h-44 flex-col p-6">
              <span aria-hidden className="text-4xl font-semibold text-mb-red-light">{i + 1}</span>
              <p className="mt-auto pt-6 text-[15px] leading-relaxed">{r.texto}</p>
              <a href={r.fonte.url} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs text-white/45 hover:text-white">
                {r.fonte.nome}
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs text-white/45">Fotografias ilustrativas. Informação verificada em Setembro de 2026.</p>
      </Seccao>
    </PaginaInterior>
  );
}
