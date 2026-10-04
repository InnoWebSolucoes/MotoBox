import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, CloudSun, Route, Scale, Siren } from "lucide-react";
import { CHECKLIST_VIAGEM, CLIMA_POR_REGIAO, EMERGENCIA, REGRAS_ESTRADA, ROTAS } from "@/lib/rotas";
import { duracao, totais } from "@/lib/rotas-mapas";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, Cabecalho, Seccao } from "@/components/painel/blocos";
import { Chip, Seta } from "@/components/painel/kit";
import { QuadroRota } from "./FotoRota";
import { LinksFontes } from "./partes";

export const metadata: Metadata = {
  title: "Rotas",
  description:
    "Para onde ir de mota em Angola: Serra da Leba, Tundavala, Kalandula, Miradouro da Lua, Cabo Ledo, deserto do Namibe e costa de Benguela. Mapa e GPX, troço a troço, combustível, onde dormir, horário e cuidados, com fontes.",
};

export default function Rotas() {
  return (
    <PaginaInterior icone={<Route />}>
      <Abertura
        foto="banner-rotas"
        sobretitulo="Moto-turismo"
        titulo="Para onde ir de mota"
        texto={`Da serra ao deserto, ${ROTAS.length} rotas prontas a fazer: mapa e GPX, troço a troço com distâncias e tempos, horário, combustível, onde comer e dormir, documentos e perigos. Tudo com as fontes à vista.`}
      />

      <Seccao>
        <h2 className="titulo-2">{ROTAS.length} rotas por Angola</h2>
        <div className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
          {ROTAS.map((r) => {
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
        <p className="mt-6 max-w-[90ch] text-xs leading-relaxed text-white/45">
          Fotografias reais dos locais, com licença livre, do Wikimedia Commons: o autor e a licença estão em cada rota.
          Distâncias do OSRM sobre o OpenStreetMap; o tempo a rodar inclui uma margem para mota e não conta paragens.
        </p>
      </Seccao>

      <Seccao className="!pt-0">
        <Cabecalho
          icone={<CloudSun />}
          titulo="Quando ir"
          texto="A estação seca, o cacimbo, vai mais ou menos de Maio a Setembro e é a época mais segura para as estradas de montanha e para as picadas. Traz muitas vezes nevoeiro de manhã, e Julho e Agosto são os meses mais frescos. As quedas de água, essas, têm mais caudal quando chove."
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
          texto="O essencial para uma viagem longa em Angola, com base no Código de Estrada e nos avisos de viagem oficiais. Cada grupo diz de onde vem a informação."
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

          <div className="painel painel-escuro flex flex-col p-6">
            <Chip>
              <Siren />
            </Chip>
            <h3 className="mt-6 text-lg font-semibold">Números de emergência</h3>
            <ul className="mt-4 grid grid-cols-2 gap-[var(--intervalo)]">
              {EMERGENCIA.numeros.map((n) => (
                <li key={n.numero} className="rounded-[var(--raio)] bg-white/6 p-3">
                  <a href={`tel:${n.numero}`} className="text-3xl font-semibold tabular-nums tracking-tight hover:text-mb-red-light">
                    {n.numero}
                  </a>
                  <p className="mt-1 text-xs leading-snug text-white/65">{n.servico}</p>
                </li>
              ))}
            </ul>
            <LinksFontes fontes={EMERGENCIA.fontes} className="mt-auto pt-5" />
          </div>
        </div>
      </Seccao>

      <Seccao className="!pt-0">
        <Cabecalho icone={<Scale />} titulo="Regras da estrada" texto="O que o Código de Estrada diz a quem viaja de mota." />
        <ol className="mt-10 grid gap-[var(--intervalo)] md:grid-cols-2 xl:grid-cols-3">
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
      </Seccao>

      <Seccao className="!pt-0">
        <div className="painel painel-escuro flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-lg font-semibold">Melhor em grupo</p>
            <p className="mt-1 max-w-[56ch] text-sm leading-relaxed text-white/70">
              Fora das cidades, viajar com mais motas é mais seguro. Os clubes de moto-turismo organizam passeios e raides a
              muitos destes destinos.
            </p>
          </div>
          <BotaoMB href="/clubes?tipo=moto-turismo">Encontrar um clube</BotaoMB>
        </div>
        <p className="mt-6 text-xs text-white/45">
          Informação verificada em Outubro de 2026: estradas, preços e combustível mudam, por isso confirme sempre
          localmente antes de partir.
        </p>
      </Seccao>
    </PaginaInterior>
  );
}
