"use client";

/* ============================================================
   MOTOBOX ADMIN — Páginas: a lista de tudo o que se escreve no
   site fora dos artigos, eventos e clubes. Cada documento diz
   se ainda tem o texto de origem ou se já foi editado, quando,
   e leva ao sítio onde se edita.
   ============================================================ */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, ExternalLink, Files, FileText, House, LayoutList } from "lucide-react";
import { comBase } from "@/lib/base";
import { Aviso, Botao, BotaoLigacao, CabecalhoPagina, Carregando, Etiqueta, Painel } from "@/components/admin/kit";
import { EtiquetaOrigem } from "@/components/admin/editor/EditorDoc";
import type { Origem } from "@/lib/conteudo/tipos";
import { DESTINOS_GRUPOS, destinoDe } from "./destinos";

interface LinhaDoc {
  chave: string;
  titulo: string;
  pagina?: string;
  origem: Origem;
  atualizado?: string;
}

interface LinhaGrupo {
  grupo: string;
  titulo: string;
  total: number;
  editados: number;
}

interface Indice {
  local: boolean;
  docs: LinhaDoc[];
  grupos: LinhaGrupo[];
}

async function lerIndice(): Promise<Indice> {
  const r = await fetch(comBase("/api/admin/conteudo"), { cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erro ?? "Falha ao ler as páginas.");
  return j as Indice;
}

const PAGINAS = ["paginas.sobre", "paginas.contacto", "paginas.seguranca", "paginas.marketplace-importar", "paginas.legais"];

export function IndicePaginas() {
  const [indice, setIndice] = useState<Indice | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const ler = useCallback(() => {
    setErro(null);
    lerIndice().then(setIndice, (e) => setErro(e instanceof Error ? e.message : "Falha ao ler as páginas."));
  }, []);

  useEffect(() => {
    let vivo = true;
    lerIndice().then(
      (j) => { if (vivo) setIndice(j); },
      (e) => { if (vivo) setErro(e instanceof Error ? e.message : "Falha ao ler as páginas."); },
    );
    return () => { vivo = false; };
  }, []);

  const cabecalho = (
    <CabecalhoPagina
      sobretitulo="Site"
      titulo="Páginas"
      icone={<FileText />}
      descricao="Os textos e as fotografias das páginas do site que não são artigos, eventos nem clubes. Enquanto ninguém mexer, cada página mostra o texto de origem; depois de gravar, o site mostra o novo."
    />
  );

  if (erro) {
    return (
      <>
        {cabecalho}
        <Aviso tom="erro" titulo="Não foi possível abrir a lista" accoes={<Botao onClick={ler}>Tentar outra vez</Botao>}>{erro}</Aviso>
      </>
    );
  }
  if (!indice) return <>{cabecalho}<Carregando /></>;

  const docs = indice.docs;
  const paginas = PAGINAS.map((c) => docs.find((d) => d.chave === c)).filter((d): d is LinhaDoc => Boolean(d));
  const site = docs.filter((d) => d.chave.startsWith("site."));
  const seccoes = docs.filter((d) => d.chave.startsWith("paginas.") && !PAGINAS.includes(d.chave));
  const outros = docs.filter((d) => !d.chave.startsWith("site.") && !d.chave.startsWith("paginas."));
  const editados = docs.filter((d) => d.origem === "base").length;

  return (
    <>
      {cabecalho}

      {indice.local && (
        <div className="mb-[var(--intervalo)]">
          <Aviso tom="atencao" titulo="Modo local">
            Sem base de dados configurada: as gravações ficam num ficheiro deste computador e não chegam ao site publicado.
          </Aviso>
        </div>
      )}

      <p className="mb-4 text-sm text-white/60">
        {docs.length} documentos · {editados === 0 ? "nenhum editado ainda" : `${editados} ${editados === 1 ? "editado" : "editados"}`}
      </p>

      <div className="grid gap-[var(--intervalo)]">
        <Grupo
          titulo="Páginas"
          icone={<FileText />}
          descricao="Editam-se aqui, com um formulário por partes da página."
          docs={paginas}
        />
        <Grupo
          titulo="Entrada e painel Explorar"
          icone={<House />}
          descricao="A página inicial, o vídeo de fundo e o painel Explorar."
          docs={site}
        />
        <Grupo
          titulo="Páginas das secções"
          icone={<LayoutList />}
          descricao="O topo e os textos fixos da página de cada secção. Editam-se dentro da secção, no separador Página."
          docs={seccoes}
        />
        {outros.length > 0 && <Grupo titulo="Outros textos" icone={<Files />} docs={outros} />}

        {indice.grupos.length > 0 && (
          <Painel
            titulo="Listas com página própria"
            descricao="Cada item destas listas tem a sua página no site. Editam-se na secção respectiva."
          >
            <ul className="grid gap-[var(--intervalo)] sm:grid-cols-2 xl:grid-cols-4">
              {indice.grupos.map((g) => {
                const d = DESTINOS_GRUPOS[g.grupo];
                const corpo = (
                  <>
                    <span className="block text-[15px] font-medium text-white">{g.titulo}</span>
                    <span className="mt-1 block text-[13px] text-white/55">
                      {g.total} {g.total === 1 ? "item" : "itens"} · {g.editados} {g.editados === 1 ? "editado" : "editados"}
                    </span>
                    {d && <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-white/75">Em {d.onde} <ChevronRight className="size-3.5" aria-hidden /></span>}
                  </>
                );
                return (
                  <li key={g.grupo}>
                    {d ? (
                      <Link href={d.href} className="block h-full rounded-[var(--raio)] bg-black/20 p-4 transition-colors hover:bg-white/[0.07]">{corpo}</Link>
                    ) : (
                      <div className="h-full rounded-[var(--raio)] bg-black/20 p-4">{corpo}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Painel>
        )}
      </div>
    </>
  );
}

function Grupo({ titulo, descricao, icone, docs }: {
  titulo: string; descricao?: string; icone: React.ReactNode; docs: LinhaDoc[];
}) {
  if (docs.length === 0) return null;
  return (
    <Painel titulo={titulo} descricao={descricao} icone={icone}>
      <ul className="divide-y divide-white/[0.07]">
        {docs.map((d) => {
          const destino = destinoDe(d.chave);
          const aqui = destino.onde === "Páginas";
          return (
            <li key={d.chave} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3.5 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1 basis-64">
                <Link href={destino.href} className="text-[15px] font-medium text-white hover:underline">{d.titulo}</Link>
                {destino.resumo && <p className="mt-0.5 text-[13px] leading-relaxed text-white/55">{destino.resumo}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <EtiquetaOrigem origem={d.origem} atualizado={d.atualizado} />
                  {!aqui && <Etiqueta>Edita-se em {destino.onde}</Etiqueta>}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {d.pagina && (
                  <BotaoLigacao href={d.pagina} externo variante="fantasma" tamanho="sm">
                    <ExternalLink className="size-3.5" aria-hidden /> Ver no site
                  </BotaoLigacao>
                )}
                <BotaoLigacao href={destino.href} variante={aqui ? "primario" : "secundario"} tamanho="sm">
                  {aqui ? "Editar" : `Abrir ${destino.onde}`}
                </BotaoLigacao>
              </div>
            </li>
          );
        })}
      </ul>
    </Painel>
  );
}
