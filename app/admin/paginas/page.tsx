import { redirect } from "next/navigation";
import { DOCS } from "@/lib/conteudo/registo";
import { IndicePaginas } from "./_editor/Indice";
import { EditorPagina, EDITORES } from "./_editor/EditorPagina";
import { DESTINOS } from "./_editor/destinos";

/* ============================================================
   MOTOBOX ADMIN — Páginas
   Sem parâmetros: a lista de todas as páginas do site.
   Com ?doc=<chave>: o editor dessa página. Um documento que se
   edita noutra secção (ex.: a entrada de Clubes) segue para lá.
   ============================================================ */

export default async function AdminPaginas({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
  const { doc } = await searchParams;
  if (!doc) return <IndicePaginas />;

  const destino = DESTINOS[doc];
  if (destino && !EDITORES[doc] && !destino.href.startsWith("/admin/paginas")) redirect(destino.href);
  if (!DOCS.has(doc)) redirect("/admin/paginas");

  const def = DOCS.get(doc);
  return <EditorPagina key={doc} chave={doc} titulo={def?.titulo} pagina={def?.pagina} />;
}
