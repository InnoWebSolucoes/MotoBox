/* ============================================================
   MOTOBOX — Regras de apresentação partilhadas
   Pequenas decisões que várias páginas tomam da mesma maneira:
   que artigo vai para destaque, que clube é o do mês, que
   eventos ainda estão para vir.
   ============================================================ */

import type { Clube, Evento, Noticia } from "./types";

/** O artigo marcado como destaque mais recente; sem nenhum, o mais recente. */
export function artigoEmDestaque(artigos: Noticia[]): Noticia | undefined {
  return artigos.find((a) => a.destaque) ?? artigos[0];
}

/**
 * Clube do mês: roda pelos clubes em destaque, um por mês, para que o
 * painel mude sem ninguém ter de o lembrar. Sem destaques, roda por todos.
 */
export function clubeDoMes(clubes: Clube[], hoje = new Date()): Clube | undefined {
  const lista = clubes.filter((c) => c.destaque);
  const fonte = lista.length ? lista : clubes;
  if (!fonte.length) return undefined;
  const indice = (hoje.getFullYear() * 12 + hoje.getMonth()) % fonte.length;
  return fonte[indice];
}

const fimDoDia = (iso: string) => new Date(`${iso.slice(0, 10)}T23:59:59`).getTime();

/** Eventos que ainda não acabaram, do mais próximo para o mais distante. */
export function eventosFuturos(eventos: Evento[], agora = Date.now()): Evento[] {
  return eventos
    .filter((e) => e.estado !== "concluido" && fimDoDia(e.dataFim || e.dataInicio) >= agora)
    .sort((a, b) => +new Date(a.dataInicio) - +new Date(b.dataInicio));
}

/** Eventos já realizados, do mais recente para o mais antigo. */
export function eventosPassados(eventos: Evento[], agora = Date.now()): Evento[] {
  return eventos
    .filter((e) => e.estado === "concluido" || fimDoDia(e.dataFim || e.dataInicio) < agora)
    .sort((a, b) => +new Date(b.dataInicio) - +new Date(a.dataInicio));
}

/** Provas antigas (Motocross, Enduro...) aparecem todas como "Prova". */
export function tipoEvento(e: Evento): string {
  return ["Motocross", "Enduro", "Velocidade", "Rally"].includes(e.disciplina) ? "Prova" : e.disciplina;
}

/** "Lobito, Benguela", "Luanda" ou "Angola" quando a sede não é pública. */
export function localClube(c: Clube): string {
  if (c.cidade && c.provincia && c.cidade !== c.provincia) return `${c.cidade}, ${c.provincia}`;
  return c.provincia || c.cidade || "Angola";
}

/** Dia e mês curtos de uma data ISO, sem depender do fuso do servidor. */
export function diaMes(iso: string): { dia: string; mes: string } {
  const [, m, d] = iso.slice(0, 10).split("-");
  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return { dia: d ?? "", mes: MESES[Number(m) - 1] ?? "" };
}

/** "11 e 12 de Julho de 2026", "18 de Outubro de 2026" ou "27 a 29 de Novembro de 2026". */
export function intervaloDatas(inicio: string, fim?: string): string {
  const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const partes = (iso: string) => {
    const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
    return { a, m, d };
  };
  const i = partes(inicio);
  if (!fim || fim.slice(0, 10) === inicio.slice(0, 10)) return `${i.d} de ${MESES[i.m - 1]} de ${i.a}`;
  const f = partes(fim);
  if (i.m === f.m && i.a === f.a) {
    const ligacao = f.d - i.d === 1 ? "e" : "a";
    return `${i.d} ${ligacao} ${f.d} de ${MESES[i.m - 1]} de ${i.a}`;
  }
  return `${i.d} de ${MESES[i.m - 1]} a ${f.d} de ${MESES[f.m - 1]} de ${f.a}`;
}

/** Data de artigo por extenso: "15 de Julho de 2026". */
export function dataArtigo(iso: string): string {
  return intervaloDatas(iso);
}
