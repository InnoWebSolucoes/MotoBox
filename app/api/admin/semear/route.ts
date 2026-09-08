import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseAdminConfigurado } from "@/lib/supabase/server";
import { paraBase, definicoesParaBase, TABELA } from "@/lib/supabase/mapeamento";
import {
  eventos, pilotos, equipas, corridas, noticias, videos,
  patrocinadores, anuncios, topicos, categoriasForum,
} from "@/lib/data";
import {
  utilizadoresSeed, encomendasSeed, denunciasSeed, subscritoresSeed,
  mensagensSeed, paginasLegaisSeed, definicoesSeed, atividadeSeed,
} from "@/lib/admin/seed";
import type { ColeccaoNome } from "@/lib/admin/store";

/* ============================================================
   MOTOBOX — Semear a base de dados
   Copia o conteúdo de demonstração de `lib/data.ts` e
   `lib/admin/seed.ts` para as tabelas do Supabase.

   Usa upsert: correr duas vezes não duplica registos.
   ============================================================ */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Tabelas com coluna booleana `publicado`. */
const COM_PUBLICADO = new Set<ColeccaoNome>([
  "eventos", "equipas", "pilotos", "corridas", "noticias",
  "videos", "patrocinadores", "topicos",
]);

/**
 * Valores por omissão para colunas NOT NULL cujo campo é
 * opcional nos tipos da aplicação.
 */
const OMISSOES: Partial<Record<ColeccaoNome, Record<string, unknown>>> = {
  eventos:   { bilhetes: [], horarios: [] },
  noticias:  { destaque: false, tags: [] },
  topicos:   { fixado: false, bloqueado: false, resolvido: false, ultima_resposta: {} },
  anuncios:  { imagens: [], vendedor: {} },
  equipas:   { pilotos: [], motas: [], estatisticas: {}, redes: {} },
  pilotos:   { estatisticas: {}, redes: {} },
  corridas:  { resultados: [] },
  utilizadores: { verificado: false, newsletter: false },
  denuncias: { estado: "pendente" },
  mensagens: { lida: false, arquivada: false },
  subscritores: { ativo: true },
};

/** Ordem respeita as chaves estrangeiras (equipas antes de pilotos). */
const LOTES: { coleccao: ColeccaoNome; itens: unknown[] }[] = [
  { coleccao: "equipas", itens: equipas },
  { coleccao: "pilotos", itens: pilotos },
  { coleccao: "eventos", itens: eventos },
  { coleccao: "corridas", itens: corridas },
  { coleccao: "noticias", itens: noticias },
  { coleccao: "videos", itens: videos },
  { coleccao: "patrocinadores", itens: patrocinadores },
  { coleccao: "categoriasForum", itens: categoriasForum },
  { coleccao: "topicos", itens: topicos },
  { coleccao: "anuncios", itens: anuncios },
  { coleccao: "utilizadores", itens: utilizadoresSeed },
  { coleccao: "encomendas", itens: encomendasSeed },
  { coleccao: "denuncias", itens: denunciasSeed },
  { coleccao: "subscritores", itens: subscritoresSeed },
  { coleccao: "mensagens", itens: mensagensSeed },
  { coleccao: "paginasLegais", itens: paginasLegaisSeed },
  { coleccao: "atividade", itens: atividadeSeed },
];

export async function POST() {
  if (!supabaseAdminConfigurado) {
    return NextResponse.json(
      { erro: "Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }
  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ erro: "Cliente indisponível." }, { status: 503 });
  }

  const resultado: Record<string, string> = {};
  let falhou = false;

  for (const { coleccao, itens } of LOTES) {
    const linhas = (itens as Record<string, unknown>[]).map((it) => {
      const base = paraBase(coleccao, it);

      // Só as tabelas de conteúdo público têm coluna `publicado`.
      // Em `anuncios` e `paginas_legais` o valor já vem dos dados.
      if (COM_PUBLICADO.has(coleccao) && base.publicado === undefined) {
        base.publicado = true;
      }

      // Campos opcionais nos tipos da app mas NOT NULL na base de
      // dados: preencher com o valor neutro quando faltam.
      for (const [col, valor] of Object.entries(OMISSOES[coleccao] ?? {})) {
        if (base[col] === undefined || base[col] === null) base[col] = valor;
      }

      return base;
    });

    const { error } = await db.from(TABELA[coleccao]).upsert(linhas);

    if (error) {
      resultado[coleccao] = `erro: ${error.message}`;
      falhou = true;
    } else {
      resultado[coleccao] = `${linhas.length} registos`;
    }
  }

  // Definições — linha única
  const { error: erroDef } = await db
    .from("definicoes")
    .upsert({ id: 1, ...definicoesParaBase(definicoesSeed as unknown as Record<string, unknown>) });

  resultado.definicoes = erroDef ? `erro: ${erroDef.message}` : "1 registo";
  if (erroDef) falhou = true;

  return NextResponse.json(
    { ok: !falhou, resultado },
    { status: falhou ? 207 : 200 },
  );
}
