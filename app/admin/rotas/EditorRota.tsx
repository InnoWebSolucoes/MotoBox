"use client";

/* ============================================================
   MOTOBOX ADMIN — Rotas: o editor de uma rota
   Uma rota é um guia inteiro; para não ser uma parede de campos,
   o editor divide-se em partes (separadores), pela ordem em que
   aparecem na página. Em cima, o que falta resolver, com ligação
   para a parte certa.
   ============================================================ */

import { useState, type ReactNode } from "react";
import { PROVINCIAS } from "@/lib/provincias";
import { coordValida, type Rota } from "@/lib/rotas-tipos";
import type { EstadoEstrada } from "@/lib/rotas-estrada";
import { Aviso, CampoEndereco, Grupo, Interruptor, useAviso } from "@/components/admin/kit";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { Opcao, Valor } from "@/components/admin/editor/esquema";
import {
  ESQUEMA_APRESENTACAO, ESQUEMA_ESTRADA, ESQUEMA_FONTES, ESQUEMA_HORARIO, ESQUEMA_PONTO, esquemaPratico,
} from "./esquemas";
import { EditorFotografias } from "./Fotografias";
import { AbasPartes } from "./Partes";
import { EditorParagens, EditorTrocos, PainelMapa, estadoTracado, paragensDe, trocosDe, useRecalcular } from "./Itinerario";

type Parte = "apresentacao" | "fotografias" | "paragens" | "trocos" | "horario" | "pratico" | "pontos" | "estrada" | "fontes";

interface Problema {
  texto: string;
  parte: Parte;
}

const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

/** O que falta para a página da rota ficar completa. */
function problemas(r: Rota): Problema[] {
  const lista: Problema[] = [];
  const ps = paragensDe(r);
  const ts = trocosDe(r);
  if (!r.nome?.trim()) lista.push({ texto: "Falta o nome da rota.", parte: "apresentacao" });
  if (!r.resumo?.trim()) lista.push({ texto: "Falta o resumo (o texto da abertura e do Google).", parte: "apresentacao" });
  if (!arr(r.fotos).some((f) => f.url || f.arquivo)) {
    lista.push({ texto: "Sem fotografias: os cartões e a abertura ficam com a fotografia geral das rotas.", parte: "fotografias" });
  }
  if (ps.length < 2) lista.push({ texto: "Junte pelo menos duas paragens para haver mapa, itinerário e GPX.", parte: "paragens" });
  ps.forEach((p, i) => {
    if (!coordValida(p)) lista.push({ texto: `A paragem ${i + 1} (${p.nome || "sem nome"}) não tem coordenadas: fica fora do mapa.`, parte: "paragens" });
  });
  ts.forEach((t, i) => {
    if (!ps[t.de] || !ps[t.para]) lista.push({ texto: `O troço ${i + 1} aponta para uma paragem que já não existe.`, parte: "trocos" });
    else if (t.de === t.para) lista.push({ texto: `O troço ${i + 1} começa e acaba na mesma paragem: não aparece no site.`, parte: "trocos" });
  });
  if (ps.length >= 2 && !ts.length) lista.push({ texto: "Ainda não há troços: o itinerário fica vazio.", parte: "trocos" });
  if (ps.length >= 2 && ps.every(coordValida)) {
    const estado = estadoTracado(r);
    if (estado === "desactualizado") lista.push({ texto: "As paragens mudaram desde o último cálculo: recalcule o traçado.", parte: "paragens" });
    else if (estado === "sem") lista.push({ texto: "Ainda sem traçado calculado: carregue em \"Recalcular o traçado\".", parte: "paragens" });
    else if (ts.some((t) => !t.km)) lista.push({ texto: "Há troços sem distância: recalcule o traçado.", parte: "paragens" });
  }
  return lista;
}

/** Províncias da rota, para a ligar aos clubes da mesma zona. */
function CampoProvincias({ valor, mudar }: { valor: string[]; mudar: (v: string[]) => void }) {
  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-[13px] font-medium text-white/75">Províncias por onde passa</span>
      <span className="-mt-0.5 mb-2 block text-xs leading-relaxed text-white/50">
        A página mostra os clubes destas províncias em &quot;Clubes na região&quot;.
      </span>
      <div className="flex flex-wrap gap-1.5">
        {PROVINCIAS.map((p) => {
          const activa = valor.includes(p);
          return (
            <button
              key={p} type="button" aria-pressed={activa}
              onClick={() => mudar(activa ? valor.filter((x) => x !== p) : [...valor, p])}
              className={`rounded-[4px] px-2.5 py-1.5 text-[13px] transition-colors ${activa ? "bg-mb-red text-white" : "bg-white/[0.07] text-white/70 hover:bg-white/[0.14] hover:text-white"}`}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EditorRota({
  rota, mudar, cidades,
}: {
  rota: Rota;
  mudar: (r: Rota) => void;
  /** Cidades com tabela de clima (da página Rotas). */
  cidades: Opcao[];
}) {
  const [parte, setParte] = useState<Parte>("apresentacao");
  const { mostrar, elemento } = useAviso();
  const { recalcular, aCalcular } = useRecalcular(rota, mudar, mostrar);
  const lista = problemas(rota);
  const valor = rota as unknown as Valor;
  const mudarValor = (v: Valor) => mudar(v as unknown as Rota);

  const abas: { chave: Parte; nome: string; contador?: number }[] = [
    { chave: "apresentacao", nome: "Apresentação" },
    { chave: "fotografias", nome: "Fotografias", contador: arr(rota.fotos).length },
    { chave: "paragens", nome: "Paragens e mapa", contador: paragensDe(rota).length },
    { chave: "trocos", nome: "Troços", contador: trocosDe(rota).length },
    { chave: "horario", nome: "Horário" },
    { chave: "pratico", nome: "Informação prática" },
    { chave: "pontos", nome: "Pontos de interesse", contador: arr(rota.pontos).length },
    { chave: "estrada", nome: "Estado da estrada" },
    { chave: "fontes", nome: "Fontes", contador: arr(rota.fontes).length },
  ];

  let corpo: ReactNode = null;
  switch (parte) {
    case "apresentacao":
      corpo = (
        <div className="space-y-5">
          <CampoEndereco valor={rota.slug ?? ""} onChange={(slug) => mudar({ ...rota, slug })} prefixo="/rotas" novo={false} />
          <Formulario esquema={ESQUEMA_APRESENTACAO} valor={valor} onChange={mudarValor} />
          <CampoProvincias valor={arr(rota.provincias)} mudar={(provincias) => mudar({ ...rota, provincias: provincias as Rota["provincias"] })} />
        </div>
      );
      break;
    case "fotografias":
      corpo = <EditorFotografias rota={rota} mudar={mudar} />;
      break;
    case "paragens":
      corpo = (
        <div className="space-y-5">
          <PainelMapa rota={rota} recalcular={recalcular} aCalcular={aCalcular} />
          <EditorParagens rota={rota} mudar={mudar} />
          <Grupo titulo="Altitudes da rota" descricao="Preenchem-se ao recalcular o traçado. Aparecem por baixo do mapa.">
            <Formulario
              esquema={[
                { tipo: "numero", chave: "min", etiqueta: "Altitude mínima (m)", largura: "meia" },
                { tipo: "numero", chave: "max", etiqueta: "Altitude máxima (m)", largura: "meia" },
                { tipo: "numero", chave: "subida", etiqueta: "Subida acumulada (m)", largura: "meia" },
                { tipo: "numero", chave: "descida", etiqueta: "Descida acumulada (m)", largura: "meia" },
              ]}
              valor={(rota.altimetria ?? {}) as unknown as Valor}
              onChange={(v) => mudar({ ...rota, altimetria: v as unknown as Rota["altimetria"] })}
            />
          </Grupo>
        </div>
      );
      break;
    case "trocos":
      corpo = (
        <div className="space-y-5">
          {estadoTracado(rota) !== "certo" && paragensDe(rota).length >= 2 && (
            <Aviso tom="atencao" titulo="Distâncias e tempos por calcular">
              Depois de acertar as paragens, carregue em &quot;Recalcular o traçado&quot; no separador &quot;Paragens e mapa&quot;:
              os quilómetros e minutos de cada troço preenchem-se sozinhos.
            </Aviso>
          )}
          <EditorTrocos rota={rota} mudar={mudar} />
        </div>
      );
      break;
    case "horario":
      corpo = <Formulario esquema={ESQUEMA_HORARIO} valor={valor} onChange={mudarValor} />;
      break;
    case "pratico":
      corpo = <Formulario esquema={esquemaPratico(cidades)} valor={valor} onChange={mudarValor} />;
      break;
    case "pontos":
      corpo = (
        <Formulario
          esquema={[{
            tipo: "lista", chave: "pontos", etiqueta: "Pontos de interesse", nomeItem: "ponto",
            ajuda: "Os cartões de \"Pontos de interesse\" (com ligação para o mapa) e os pontos do ficheiro GPX. Só aparecem os que têm coordenadas.",
            resumo: (p) => String(p.nome ?? ""),
            novo: () => ({ nome: "", _coord: {}, nota: "", fontes: [] }),
            campos: ESQUEMA_PONTO,
          }]}
          valor={{ pontos: arr(rota.pontos).map((p) => ({ ...p, _coord: { lat: p.lat, lng: p.lng } })) }}
          onChange={(v) => {
            const pontos = (Array.isArray(v.pontos) ? v.pontos : []) as Valor[];
            mudar({
              ...rota,
              pontos: pontos.map(({ _coord, ...resto }) => {
                const c = (_coord ?? {}) as { lat?: number; lng?: number };
                return { ...(resto as unknown as Rota["pontos"][number]), lat: c.lat as number, lng: c.lng as number };
              }),
            });
          }}
        />
      );
      break;
    case "estrada": {
      const estrada = rota.estrada ?? null;
      corpo = (
        <div className="space-y-5">
          <Interruptor
            etiqueta="Mostrar o estado da estrada"
            descricao={"O bloco \"Estado da estrada\" da página, com o que os motards contam de cada troço."}
            activo={Boolean(estrada)}
            onChange={(v) => mudar({ ...rota, estrada: v ? (estrada ?? { quando: "", relatos: [] }) : null })}
          />
          {estrada && (
            <Formulario
              esquema={ESQUEMA_ESTRADA}
              valor={estrada as unknown as Valor}
              onChange={(v) => mudar({ ...rota, estrada: v as unknown as EstadoEstrada })}
            />
          )}
        </div>
      );
      break;
    }
    case "fontes":
      corpo = <Formulario esquema={ESQUEMA_FONTES} valor={valor} onChange={mudarValor} />;
      break;
  }

  return (
    <div className="space-y-5">
      {lista.length > 0 && (
        <Aviso tom="atencao" titulo={lista.length === 1 ? "Falta resolver uma coisa" : `Faltam resolver ${lista.length} coisas`}>
          <ul className="mt-1 space-y-1">
            {lista.map((p) => (
              <li key={p.texto}>
                <button type="button" onClick={() => setParte(p.parte)} className="text-left underline decoration-white/25 underline-offset-2 hover:decoration-white">
                  {p.texto}
                </button>
              </li>
            ))}
          </ul>
        </Aviso>
      )}
      <AbasPartes abas={abas} activa={parte} onChange={setParte} rotulo="Partes da rota" />
      {corpo}
      {elemento}
    </div>
  );
}
