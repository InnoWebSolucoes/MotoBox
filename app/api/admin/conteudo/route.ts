import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { DOCS, GRUPOS } from "@/lib/conteudo/registo";
import { apagarLinha, emModoLocal, gravarLinha, lerLinhasAdmin } from "@/lib/conteudo/servidor";
import { chaveItem, chaveLista, listaGravada, resolverDoc, resolverGrupo } from "@/lib/conteudo/resolver";
import { CHAVE_VALIDA } from "@/lib/conteudo/tipos";

/* ============================================================
   MOTOBOX — API do conteúdo editável (painel de gestão)
   O acesso é verificado no proxy: só a equipa chega aqui.

   GET    ?chave=paginas.sobre            um documento
   GET    ?grupo=rotas                    os itens de um grupo
   GET                                    o índice de tudo o que é editável
   PUT    { chave, dados, titulo? }       grava um documento
   PUT    { grupo, chave, dados, titulo?, chaveAnterior? }
                                          grava um item (cria se for novo;
                                          com chaveAnterior, muda-lhe a chave)
   PUT    { grupo, ordem: [chaves] }      grava a ordem do grupo
   DELETE ?chave=…                        documento volta ao de partida
   DELETE ?grupo=…&chave=…                tira o item do site
   DELETE ?grupo=…&chave=…&repor=1        item volta ao de partida
   ============================================================ */

export const dynamic = "force-dynamic";

const erro = (mensagem: string, codigo = 400) => NextResponse.json({ erro: mensagem }, { status: codigo });

function revalidar() {
  try { revalidatePath("/", "layout"); } catch { /* fora de contexto de pedido */ }
}

/** Título legível de um item a partir dos próprios dados. */
function tituloDe(dados: unknown, chave: string): string {
  if (dados && typeof dados === "object") {
    const d = dados as Record<string, unknown>;
    for (const c of ["nome", "titulo", "title"]) if (typeof d[c] === "string" && d[c]) return d[c] as string;
  }
  return chave;
}

async function linhas() {
  return lerLinhasAdmin();
}

/** Garante que a lista do grupo está gravada e devolve-a. */
async function listaDoGrupo(grupo: string, mapa: Awaited<ReturnType<typeof linhas>>): Promise<string[]> {
  const gravada = listaGravada(grupo, mapa);
  if (gravada) return gravada;
  return resolverGrupo(grupo, mapa).itens.map((i) => i.chave);
}

async function gravarLista(grupo: string, chaves: string[]) {
  const unicas = [...new Set(chaves)];
  await gravarLinha(chaveLista(grupo), `Lista: ${GRUPOS.get(grupo)?.titulo ?? grupo}`, { chaves: unicas }, "conteudo");
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const local = emModoLocal();
  try {
    const mapa = await linhas();
    const chave = p.get("chave");
    const grupo = p.get("grupo");

    if (chave) {
      if (!DOCS.has(chave)) return erro(`Documento desconhecido: ${chave}`, 404);
      return NextResponse.json({ ...resolverDoc(chave, mapa), local });
    }
    if (grupo) {
      if (!GRUPOS.has(grupo)) return erro(`Grupo desconhecido: ${grupo}`, 404);
      return NextResponse.json({ ...resolverGrupo(grupo, mapa), local });
    }

    return NextResponse.json({
      local,
      docs: [...DOCS.values()].map((d) => {
        const r = resolverDoc(d.chave, mapa);
        return { chave: d.chave, titulo: d.titulo, pagina: d.pagina, origem: r.origem, atualizado: r.atualizado };
      }),
      grupos: [...GRUPOS.values()].map((g) => {
        const r = resolverGrupo(g.grupo, mapa);
        return {
          grupo: g.grupo,
          titulo: g.titulo,
          total: r.itens.length,
          editados: r.itens.filter((i) => i.origem === "base").length,
          materializado: r.materializado,
        };
      }),
    });
  } catch (e) {
    return erro(e instanceof Error ? e.message : "Falha ao ler o conteúdo.", 500);
  }
}

export async function PUT(req: NextRequest) {
  let corpo: {
    chave?: string; grupo?: string; dados?: unknown; titulo?: string;
    ordem?: string[]; chaveAnterior?: string;
  };
  try { corpo = await req.json(); } catch { return erro("Corpo inválido."); }
  const { chave, grupo, dados, titulo, ordem, chaveAnterior } = corpo;

  try {
    // Ordem de um grupo
    if (grupo && Array.isArray(ordem)) {
      if (!GRUPOS.has(grupo)) return erro(`Grupo desconhecido: ${grupo}`, 404);
      if (!ordem.every((c) => typeof c === "string" && CHAVE_VALIDA.test(c))) return erro("Lista inválida.");
      await gravarLista(grupo, ordem);
      revalidar();
      return NextResponse.json({ ok: true });
    }

    if (dados === undefined) return erro("Faltam os dados.");

    // Item de um grupo
    if (grupo) {
      if (!GRUPOS.has(grupo)) return erro(`Grupo desconhecido: ${grupo}`, 404);
      if (!chave || !CHAVE_VALIDA.test(chave)) {
        return erro("O endereço só pode ter letras minúsculas, números e hífenes (ex.: serra-da-leba).");
      }
      const mapa = await linhas();
      let lista = await listaDoGrupo(grupo, mapa);
      if (chaveAnterior && chaveAnterior !== chave) {
        if (lista.includes(chave)) return erro("Já existe um item com este endereço. Escolha outro.", 409);
        lista = lista.map((c) => (c === chaveAnterior ? chave : c));
      }
      if (!lista.includes(chave)) lista = [...lista, chave];
      const atualizado = await gravarLinha(chaveItem(grupo, chave), titulo || tituloDe(dados, chave), dados, grupo);
      await gravarLista(grupo, lista);
      if (chaveAnterior && chaveAnterior !== chave) await apagarLinha(chaveItem(grupo, chaveAnterior));
      revalidar();
      return NextResponse.json({ ok: true, atualizado });
    }

    // Documento solto
    if (!chave || !DOCS.has(chave)) return erro(`Documento desconhecido: ${chave ?? ""}`, 404);
    const atualizado = await gravarLinha(chave, titulo || DOCS.get(chave)!.titulo, dados, "conteudo");
    revalidar();
    return NextResponse.json({ ok: true, atualizado });
  } catch (e) {
    return erro(e instanceof Error ? e.message : "Falha ao gravar.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const chave = p.get("chave");
  const grupo = p.get("grupo");
  const repor = p.get("repor") === "1";
  if (!chave) return erro("Falta a chave.");

  try {
    if (grupo) {
      if (!GRUPOS.has(grupo)) return erro(`Grupo desconhecido: ${grupo}`, 404);
      if (!repor) {
        const lista = await listaDoGrupo(grupo, await linhas());
        await gravarLista(grupo, lista.filter((c) => c !== chave));
      }
      await apagarLinha(chaveItem(grupo, chave));
    } else {
      if (!DOCS.has(chave)) return erro(`Documento desconhecido: ${chave}`, 404);
      await apagarLinha(chave);
    }
    revalidar();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erro(e instanceof Error ? e.message : "Falha ao apagar.", 500);
  }
}
