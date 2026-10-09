"use client";

/* ============================================================
   MOTOBOX — Segurança: à chuva
   Um painel com chuva a cair (só quando se vê e sem movimento
   reduzido), o "2×" e a comparação seco / molhado: escolhe-se a
   velocidade e as barras crescem até aos metros da tabela.
   ============================================================ */

import { useRef, useState } from "react";
import { CloudRain } from "lucide-react";
import { Refs, preencher } from "./comum";
import { useEmVista } from "./ganchos";
import s from "../seguranca.module.css";

type Velocidade = { rotulo: string; reaccao: number; travagem: number };

export function Chuva({ numero, numeroTexto, numeroFonte, fonteRotulo, travagem, totalFontes, rotuloFonte }: {
  numero: string;
  numeroTexto: string;
  numeroFonte: string;
  fonteRotulo: string;
  travagem: {
    titulo: string;
    texto: string;
    velocidade: string;
    seco: string;
    molhado: string;
    reaccao: string;
    travar: string;
    noMinimo: string;
    velocidades: Velocidade[];
    nota: string;
    fontes: number[];
  };
  totalFontes: number;
  rotuloFonte: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEmVista(ref);
  const lista = travagem.velocidades.filter((v) => Number(v.reaccao) >= 0 && Number(v.travagem) > 0);
  const [escolha, setEscolha] = useState(() => Math.min(1, Math.max(0, lista.length - 1)));
  const v = lista[escolha];
  // A escala é a maior distância molhada da lista: ao mudar de velocidade, as barras crescem a sério.
  const maximo = Math.max(1, ...lista.map((x) => 2 * (Number(x.reaccao) + Number(x.travagem)))) * 1.08;
  const pct = (m: number) => `${(m / maximo) * 100}%`;
  // Só se escreve dentro da barra quando o texto cabe.
  const cabe = (m: number) => m / maximo > 0.14;
  const seco = v ? Number(v.reaccao) + Number(v.travagem) : 0;
  const molhado = seco * 2;

  return (
    <div ref={ref} className="relative isolate overflow-hidden rounded-[var(--raio)] bg-[linear-gradient(160deg,rgb(40_46_58/0.95),rgb(28_28_34/0.95))]">
      <div aria-hidden className={s.chuva} />
      <div className="relative grid gap-[var(--intervalo)] p-[var(--intervalo)] lg:grid-cols-[minmax(0,20rem)_1fr]">
        {/* O dobro */}
        <div className="flex min-h-56 flex-col rounded-[calc(var(--raio)-2px)] bg-mb-red p-6">
          <CloudRain aria-hidden className="size-7" />
          <span className="mt-auto pt-8 text-7xl font-semibold leading-none tracking-tight">{numero}</span>
          <span className="mt-3 text-[15px] leading-snug text-white">{numeroTexto}</span>
          <span className="mt-2 text-xs text-white/90">
            {fonteRotulo}: {numeroFonte}
          </span>
        </div>

        {/* Seco contra molhado */}
        <div className="rounded-[calc(var(--raio)-2px)] bg-black/30 p-5 backdrop-blur-[2px] md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="titulo-4">{travagem.titulo}</h3>
              <p className="mt-2 text-[15px] text-white/90">{travagem.texto}</p>
            </div>
            {lista.length > 1 && (
              <div role="group" aria-label={travagem.velocidade} className="flex gap-1 rounded-[var(--raio)] bg-black/35 p-1">
                {lista.map((x, i) => (
                  <button
                    key={`${x.rotulo}-${i}`}
                    type="button"
                    aria-pressed={i === escolha}
                    onClick={() => setEscolha(i)}
                    className="h-10 rounded-[4px] px-3 text-sm tabular-nums text-white transition-colors hover:bg-white/10 aria-pressed:bg-mb-red aria-pressed:font-semibold"
                  >
                    {x.rotulo}
                  </button>
                ))}
              </div>
            )}
          </div>

          {v && (
            <dl className="mt-8 space-y-6">
              <div>
                <dt className="flex items-baseline justify-between gap-3 text-sm text-white">
                  <span>{travagem.seco}</span>
                  <span className="text-xl font-semibold tabular-nums">{seco} m</span>
                </dt>
                <dd className={`${s.pista} ${s.cresce} mt-2`}>
                  <span
                    className={`${s.segmento} ${s.segmentoReagir}`}
                    style={{ left: 0, width: pct(Number(v.reaccao)) }}
                    title={`${v.reaccao} m ${travagem.reaccao}`}
                  >
                    {cabe(Number(v.reaccao)) && `${v.reaccao} m`}
                  </span>
                  <span
                    className={`${s.segmento} ${s.segmentoTravar}`}
                    style={{ left: pct(Number(v.reaccao)), width: pct(Number(v.travagem)) }}
                    title={`${v.travagem} m ${travagem.travar}`}
                  >
                    {cabe(Number(v.travagem)) && `${v.travagem} m`}
                  </span>
                </dd>
                <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/85">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="size-2.5 rounded-[2px] bg-white/30" />
                    {v.reaccao} m {travagem.reaccao}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="size-2.5 rounded-[2px] bg-white/55" />
                    {v.travagem} m {travagem.travar}
                  </span>
                </p>
              </div>
              <div>
                <dt className="flex items-baseline justify-between gap-3 text-sm text-white">
                  <span>{travagem.molhado}</span>
                  <span className="text-xl font-semibold tabular-nums">
                    <span className="mr-1.5 text-sm font-normal text-white/85">{travagem.noMinimo}</span>
                    {molhado} m
                  </span>
                </dt>
                <dd className={`${s.pista} ${s.cresce} mt-2`}>
                  <span className={`${s.segmento} ${s.segmentoMolhado}`} style={{ left: 0, width: pct(molhado) }}>
                    {cabe(molhado) && preencher("{m} m", { m: molhado })}
                  </span>
                  <span aria-hidden className={`${s.segmento} ${s.cauda}`} style={{ left: pct(molhado), width: "12%" }} />
                </dd>
              </div>
            </dl>
          )}

          <p className="mt-7 max-w-[70ch] text-xs leading-relaxed text-white/85">
            {travagem.nota}
            <Refs fontes={travagem.fontes} total={totalFontes} rotulo={rotuloFonte} />
          </p>
        </div>
      </div>
    </div>
  );
}
