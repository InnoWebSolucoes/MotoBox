import "server-only";

/* ============================================================
   MOTOBOX — Área de conta: o que a página lê no servidor
   Os textos (documento "site.conta") e o conteúdo público que o
   painel do membro mostra (próximos eventos e provas, artigos,
   clubes e rotas), já resumido: o cliente recebe só o que usa.
   ============================================================ */

import { lerClubes, lerDefinicoes, lerEventos, lerNoticias } from "@/lib/supabase/publico";
import { lerRotas } from "@/lib/rotas-conteudo";
import { lerDoc } from "@/lib/conteudo";
import { CONTA_PADRAO, comPadraoContas, type ConteudoConta } from "@/lib/conteudo/grupos/contas";
import { eventosFuturos, localClube, tipoEvento } from "@/lib/motobox";
import { eProva, hrefEvento } from "@/lib/desporto";
import { duracao, totais } from "@/lib/rotas-mapas";
import { temImagem, urlCommons } from "@/lib/rotas-tipos";
import { fotoDe } from "@/app/eventos/foto";
import type { ArtigoResumo, ClubeResumo, EventoResumo } from "@/components/conta/dados";
import type { RotaComProvincias } from "@/components/conta/PainelConta";

/** Os textos da área de membro (Definições → Área de membro), por cima dos de partida. */
export async function lerTextosConta(): Promise<ConteudoConta> {
  return comPadraoContas(CONTA_PADRAO, await lerDoc<unknown>("site.conta").catch(() => null));
}

/** Semanas desde 1970, a mudar à segunda-feira (hora de Luanda): escolhe a rota da semana. */
function semanaActual(agora = Date.now()) {
  const DIA = 86_400_000;
  // 1/1/1970 foi uma quinta-feira: +3 dias põe a viragem à segunda; +1h é Luanda.
  return Math.floor((agora + 3 * DIA + 3_600_000) / (7 * DIA));
}

export async function lerConteudoConta() {
  const [clubes, noticias, eventos, rotas, definicoes, textos] = await Promise.all([
    lerClubes(), lerNoticias(), lerEventos(), lerRotas(), lerDefinicoes(), lerTextosConta(),
  ]);

  const futuros = eventosFuturos(eventos);
  const proximos: EventoResumo[] = futuros.slice(0, 6).map((e) => ({
    slug: e.slug,
    titulo: e.titulo,
    href: hrefEvento(e),
    prova: eProva(e.disciplina),
    tipo: eProva(e.disciplina) ? e.disciplina : tipoEvento(e),
    dataInicio: e.dataInicio,
    dataFim: e.dataFim,
    hora: e.horarios?.[0]?.hora,
    localidade: e.localidade,
    provincia: e.provincia,
    foto: fotoDe(e.slug, e.imagem),
  }));

  const artigos: ArtigoResumo[] = noticias.slice(0, 60).map((n) => ({
    slug: n.slug,
    titulo: n.titulo,
    resumo: n.resumo.length > 220 ? `${n.resumo.slice(0, 217).trimEnd()}…` : n.resumo,
    categoria: n.categoria,
    tags: n.tags ?? [],
    data: n.data,
    foto: fotoDe(n.slug, n.imagem),
    leitura: n.leitura,
  }));

  const listaClubes: ClubeResumo[] = clubes.map((c) => ({
    slug: c.slug,
    nome: c.nome,
    tipo: c.tipo === "Outro" ? "Convívio e solidariedade" : c.tipo,
    cor: c.cor,
    local: localClube(c),
    provincia: c.provincia,
    encontros: c.encontros,
    actividades: c.actividades.slice(0, 3),
    foto: [c.imagem, c.slug],
  }));

  // Todas as rotas, resumidas: a da semana escolhe-se no cliente, que sabe a província do membro.
  const listaRotas: RotaComProvincias[] = rotas.map((r) => {
    const t = totais(r);
    const foto = r.fotos.find(temImagem);
    return {
      slug: r.slug,
      nome: r.nome,
      subtitulo: r.subtitulo,
      regiao: r.regiao,
      km: t.km,
      duracao: duracao(t.minMota),
      dias: r.dias,
      piso: r.piso,
      exigencia: r.exigencia,
      foto: foto ? urlCommons(foto, 960) : "",
      fotoAlt: foto?.alt ?? "",
      perto: false,
      provincias: r.provincias,
    };
  });

  return {
    textos,
    clubes: listaClubes,
    artigos,
    eventos: proximos,
    eventosTotal: futuros.length,
    rotas: listaRotas,
    semana: semanaActual(),
    marketplaceAberto: definicoes.marketplaceAberto !== false,
  };
}
