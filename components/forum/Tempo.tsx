"use client";

import { useSyncExternalStore } from "react";
import { useIdioma } from "@/lib/i18n/contexto";

/* ============================================================
   MOTOBOX — "há 5 minutos"
   O servidor não sabe a que horas a página vai ser vista (fica em
   cache), por isso desenha a data e o navegador troca-a pelo tempo
   relativo, minuto a minuto. Uma data sem hora ("2026-09-27", os
   tópicos abertos no painel) mostra-se ao dia: "hoje", "ontem",
   "há 3 dias".
   ============================================================ */

const subscreverMinuto = (aviso: () => void) => {
  const id = window.setInterval(aviso, 30_000);
  return () => window.clearInterval(id);
};
const minutoActual = () => Math.floor(Date.now() / 60_000);
const semMinuto = () => null;

const DIA = 86_400_000;

/** Meia-noite de Luanda (UTC+1) de um instante, para contar dias de calendário. */
const diaLuanda = (ms: number) => Math.floor((ms + 3_600_000) / DIA);

function relativo(data: Date, soDia: boolean, agora: number, locale: string): string | null {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const dias = diaLuanda(agora) - diaLuanda(data.getTime());
  if (soDia || dias >= 1) {
    if (dias <= 0) return rtf.format(0, "day");
    if (dias < 7) return rtf.format(-dias, "day");
    if (dias < 35) return rtf.format(-Math.floor(dias / 7), "week");
    return null;
  }
  const segundos = Math.max(0, Math.round((agora - data.getTime()) / 1000));
  if (segundos < 60) return rtf.format(0, "second");
  if (segundos < 3600) return rtf.format(-Math.floor(segundos / 60), "minute");
  return rtf.format(-Math.floor(segundos / 3600), "hour");
}

export function Tempo({ iso, className }: { iso: string; className?: string }) {
  const { locale } = useIdioma();
  const minuto = useSyncExternalStore(subscreverMinuto, minutoActual, semMinuto);
  const soDia = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const data = new Date(soDia ? `${iso}T12:00:00+01:00` : iso);
  if (Number.isNaN(data.getTime())) return null;
  const absoluto = data.toLocaleDateString(locale, {
    day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Luanda",
  });
  const texto = (minuto !== null && relativo(data, soDia, minuto * 60_000, locale)) || absoluto;
  return <time dateTime={iso} title={absoluto} className={className}>{texto}</time>;
}
