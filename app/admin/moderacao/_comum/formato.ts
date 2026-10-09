/* ============================================================
   MOTOBOX ADMIN — Datas e números nas páginas da comunidade
   ============================================================ */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "12 set 2026" (sem o ano quando é o deste ano). */
export function dataCurta(iso?: string, comAno?: boolean): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  const ano = d.getFullYear();
  const mostrarAno = comAno ?? ano !== new Date().getFullYear();
  return `${d.getDate()} ${MESES[d.getMonth()]}${mostrarAno ? ` ${ano}` : ""}`;
}

/** "12 set, 14:30". */
export function dataHora(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const h = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${dataCurta(iso)}, ${h}`;
}

/** "há 5 minutos", "há 3 dias", ou a data quando já passou mais de um mês. */
export function haQuanto(iso?: string, agora = Date.now()): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const s = Math.round((agora - t) / 1000);
  if (s < 0) return dataCurta(iso);
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} ${m === 1 ? "minuto" : "minutos"}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.floor(h / 24);
  if (d < 31) return `há ${d} ${d === 1 ? "dia" : "dias"}`;
  return dataCurta(iso);
}

/** Dias até uma data (0 = hoje, negativo = já passou). */
export function diasAte(iso: string, agora = Date.now()): number {
  const alvo = new Date(`${iso.slice(0, 10)}T00:00:00`).getTime();
  const hoje = new Date(new Date(agora).toDateString()).getTime();
  return Math.round((alvo - hoje) / 86_400_000);
}

export const numero = (n: number) => n.toLocaleString("pt-PT");

/** Iniciais de um nome, para os quadradinhos de avatar. */
export const iniciais = (nome: string) =>
  nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
