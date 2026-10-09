import "server-only";

/* ============================================================
   MOTOBOX — Explorar: o que está "Em foco"
   Lê o conteúdo "site.contagem" (Gestão › Entrada e painel › Em
   foco), vai buscar o item escolhido aos dados (evento, prova,
   artigo, rota, anúncio, clube, modalidade, secção de segurança)
   e devolve o mosaico já pronto. O que a equipa escreveu à mão
   (título, linha, fotografia, ligação, data) manda sobre o que
   vem do item.

   Se o item deixou de existir (apagado ou despublicado), o mosaico
   não fica vazio: num evento ou numa prova passa ao próximo; nos
   outros tipos, ao primeiro da lista.
   ============================================================ */

import type { Clube, Evento, Noticia } from "@/lib/types";
import { lerAnuncios } from "@/lib/supabase/publico";
import { lerDoc } from "@/lib/conteudo";
import { FOCO_COM_DATA, fundir, type ConteudoEmFoco } from "@/lib/conteudo/grupos/site";
import { SEGURANCA_PADRAO } from "@/lib/conteudo/grupos/paginas";
import { lerRotas } from "@/lib/rotas-conteudo";
import { temImagem, urlCommons } from "@/lib/rotas-tipos";
import { lerModalidades } from "@/app/desporto/dados";
import { eComunidade, eProva, hrefEvento } from "@/lib/desporto";
import { eventosFuturos, intervaloDatas, localClube } from "@/lib/motobox";
import { formatKz } from "@/lib/data";
import { fotoDe } from "@/app/eventos/foto";
import type { Foco } from "@/components/painel/EmFoco";

/** O que vem do próprio item, antes do que a equipa escreveu por cima. */
type DoItem = Omit<Foco, "tipo" | "sobretitulo" | "accao" | "data" | "dataExtenso"> & {
  /** Início do evento, para a contagem. */
  inicio?: string;
};

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/** "31 de Janeiro" (sem o ano, que a contagem já diz quanto falta). */
const diaPorExtenso = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  return m && d ? `${d} de ${MESES[m - 1]}` : "";
};

/** Início de um evento com hora: a do campo, a da primeira sessão, ou a meia-noite de Luanda. */
function inicioDe(e: Evento): string {
  if (e.dataInicio.includes("T")) return e.dataInicio;
  const hora = e.horarios?.map((h) => h.hora.match(/^(\d{1,2})[:h](\d{2})/)).find(Boolean);
  const hh = hora ? hora[1].padStart(2, "0") : "00";
  const mm = hora ? hora[2] : "00";
  return `${e.dataInicio.slice(0, 10)}T${hh}:${mm}:00+01:00`;
}

const dataValida = (iso: string) => Boolean(iso) && !Number.isNaN(new Date(iso).getTime());

/** Data e hora por extenso, para leitores de ecrã. */
function dataExtenso(iso: string): string {
  const d = new Date(iso);
  const hora = new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" }).format(d);
  return `${intervaloDatas(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Luanda" }).format(d))}, às ${hora}`;
}

const texto = (v: unknown) => (typeof v === "string" ? v : v && typeof v === "object" && "pt" in v ? String((v as { pt: unknown }).pt ?? "") : "");

async function doItem(
  c: ConteudoEmFoco,
  dados: { eventos: Evento[]; artigos: Noticia[]; clubes: Clube[] },
): Promise<DoItem> {
  switch (c.tipo) {
    case "evento":
    case "prova": {
      const daLista = dados.eventos.filter((e) => (c.tipo === "prova" ? eProva(e.disciplina) : eComunidade(e.disciplina)));
      const e = dados.eventos.find((x) => x.slug === c.item) ?? eventosFuturos(daLista)[0] ?? daLista[0];
      if (!e) return { titulo: "", linha: "", foto: [], href: c.tipo === "prova" ? "/calendario" : "/eventos" };
      const onde = e.circuito || e.localidade;
      return {
        titulo: e.titulo,
        linha: [diaPorExtenso(e.dataInicio), onde].filter(Boolean).join(" · "),
        foto: fotoDe(e.slug, e.imagem),
        href: hrefEvento(e),
        inicio: inicioDe(e),
      };
    }
    case "artigo": {
      const a = dados.artigos.find((x) => x.slug === c.item) ?? dados.artigos[0];
      if (!a) return { titulo: "", linha: "", foto: [], href: "/artigos" };
      return { titulo: a.titulo, linha: a.resumo, foto: fotoDe(a.slug, a.imagem), href: `/artigos/${a.slug}` };
    }
    case "rota": {
      const rotas = await lerRotas();
      const r = rotas.find((x) => x.slug === c.item) ?? rotas[0];
      if (!r) return { titulo: "", linha: "", foto: [], href: "/rotas" };
      const capa = r.fotos?.find(temImagem);
      return {
        titulo: r.nome,
        linha: r.subtitulo || r.regiao,
        foto: [r.imagem, capa ? urlCommons(capa, 960) : undefined],
        href: `/rotas/${r.slug}`,
      };
    }
    case "anuncio": {
      const anuncios = await lerAnuncios();
      const a = anuncios.find((x) => x.id === c.item) ?? anuncios[0];
      if (!a) return { titulo: "", linha: "", foto: [], href: "/marketplace" };
      return {
        titulo: a.titulo,
        linha: [a.estado, a.provincia].filter(Boolean).join(" · "),
        foto: a.imagens ?? [],
        href: `/marketplace/${a.id}`,
        preco: formatKz(a.preco),
        precoNota: a.negociavel ? "Negociável" : undefined,
      };
    }
    case "clube": {
      const cl = dados.clubes.find((x) => x.slug === c.item) ?? dados.clubes[0];
      if (!cl) return { titulo: "", linha: "", foto: [], href: "/clubes" };
      const onde = localClube(cl);
      return {
        titulo: cl.nome,
        linha: cl.resumo || [cl.tipo, onde].filter(Boolean).join(" · ") || cl.descricao,
        foto: [cl.imagem, cl.slug],
        href: `/clubes/${cl.slug}`,
      };
    }
    case "modalidade": {
      const ms = await lerModalidades();
      const m = ms.find((x) => x.slug === c.item) ?? ms[0];
      if (!m) return { titulo: "", linha: "", foto: [], href: "/desporto" };
      return { titulo: m.nome, linha: m.descricao, foto: [m.imagem], href: `/desporto/${m.slug}` };
    }
    case "seguranca": {
      const s = fundir(SEGURANCA_PADRAO, await lerDoc<unknown>("paginas.seguranca"));
      const seccoes = Array.isArray(s.SECCOES) ? s.SECCOES : SEGURANCA_PADRAO.SECCOES;
      const sec = seccoes.find((x) => x.id === c.item) ?? seccoes[0];
      if (!sec) return { titulo: "", linha: "", foto: ["banner-seguranca"], href: "/seguranca" };
      const bloco = (s as Record<string, unknown>)[sec.id.toUpperCase()] as Record<string, unknown> | undefined;
      const fotos = s.FOTOS as Record<string, string | undefined>;
      return {
        titulo: texto(bloco?.titulo) || texto(sec.nome),
        linha: texto(bloco?.lead) || texto(bloco?.texto),
        foto: [fotos?.[sec.id], fotos?.abertura, "banner-seguranca"],
        href: `/seguranca#${sec.id}`,
      };
    }
    case "personalizado":
    default:
      return { titulo: "", linha: "", foto: [], href: "/explorar" };
  }
}

/** O mosaico "Em foco", pronto a desenhar. */
export async function resolverFoco(
  c: ConteudoEmFoco,
  dados: { eventos: Evento[]; artigos: Noticia[]; clubes: Clube[] },
): Promise<Foco> {
  const item = await doItem(c, dados).catch((): DoItem => ({ titulo: "", linha: "", foto: [], href: "/explorar" }));
  const auto = c.automaticos?.[c.tipo] ?? { sobretitulo: "", ligacao: "" };
  // A data: a escrita à mão, ou o início do evento; a contagem só nos tipos com data.
  const data = c.data || item.inicio || "";
  const contagem = c.activa && FOCO_COM_DATA.includes(c.tipo) && dataValida(data);
  return {
    tipo: c.tipo,
    sobretitulo: c.sobretitulo || auto.sobretitulo,
    titulo: c.titulo || item.titulo,
    linha: c.subtitulo || item.linha,
    foto: [c.foto || undefined, ...item.foto],
    href: c.ligacao || item.href,
    accao: c.textoLigacao || auto.ligacao,
    data: contagem ? data : undefined,
    dataExtenso: contagem ? dataExtenso(data) : undefined,
    preco: item.preco,
    precoNota: item.precoNota,
  };
}
