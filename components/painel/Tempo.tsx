import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Moon, Sun,
} from "lucide-react";

/* ============================================================
   MOTOBOX — O tempo em Luanda
   Painel pequeno com o estado do céu e a temperatura, lido do
   Open-Meteo (gratuito, sem chave) e guardado em cache meia
   hora. Sem rede, fica só o nome da cidade.
   ============================================================ */

const LUANDA = { lat: -8.8383, lon: 13.2344 };

interface Leitura {
  temperatura: number;
  codigo: number;
  dia: boolean;
}

async function lerTempo(): Promise<Leitura | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LUANDA.lat}&longitude=${LUANDA.lon}` +
      `&current=temperature_2m,weather_code,is_day&timezone=Africa%2FLuanda`;
    const r = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const j = (await r.json()) as { current?: { temperature_2m: number; weather_code: number; is_day: number } };
    if (!j.current) return null;
    return { temperatura: Math.round(j.current.temperature_2m), codigo: j.current.weather_code, dia: j.current.is_day === 1 };
  } catch {
    return null;
  }
}

/** Códigos WMO do Open-Meteo, em português. */
function descrever(codigo: number, dia: boolean) {
  if (codigo === 0) return { texto: dia ? "Céu limpo" : "Noite limpa", Icone: dia ? Sun : Moon };
  if (codigo === 1 || codigo === 2) return { texto: "Pouco nublado", Icone: dia ? CloudSun : Cloud };
  if (codigo === 3) return { texto: "Céu nublado", Icone: Cloud };
  if (codigo === 45 || codigo === 48) return { texto: "Nevoeiro", Icone: CloudFog };
  if (codigo >= 51 && codigo <= 57) return { texto: "Chuvisco", Icone: CloudDrizzle };
  if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return { texto: "Chuva", Icone: CloudRain };
  if (codigo >= 95) return { texto: "Trovoada", Icone: CloudLightning };
  return { texto: "Tempo variável", Icone: CloudSun };
}

/** Conselho curto para quem vai sair de mota. */
function conselho(l: Leitura): string {
  if (l.codigo >= 51) return "Piso molhado: dobre a distância";
  if (l.temperatura >= 32) return "Calor: beba água antes de sair";
  if (!l.dia) return "À noite: viseira transparente";
  return "Bom tempo para rodar";
}

export async function Tempo({ className = "" }: { className?: string }) {
  const l = await lerTempo();
  const d = l ? descrever(l.codigo, l.dia) : null;

  return (
    <div className={`painel flex h-full w-full flex-col justify-center px-4 py-2 text-white xl:px-5 ${className}`}>
      <span className="block truncate text-[0.8125rem] leading-5 text-white/70">
        Luanda, Angola{l ? ` · ${conselho(l)}` : ""}
      </span>
      <div className="mt-0.5 flex items-center justify-between gap-x-3">
        <span className="min-w-0 truncate text-lg leading-7 sm:text-[1.375rem]">{d ? d.texto : "O tempo agora"}</span>
        {l && d && (
          <span className="inline-flex shrink-0 items-center gap-x-1.5 text-lg leading-7 sm:text-[1.375rem]">
            {l.temperatura}°C
            <d.Icone aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
        )}
      </div>
    </div>
  );
}
