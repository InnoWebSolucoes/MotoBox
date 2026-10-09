"use client";

/* ============================================================
   MOTOBOX ADMIN — Editor de um documento solto
   Lê, edita e grava um documento do conteúdo editável (ex.:
   "paginas.sobre"), com o esquema dos campos ou um editor
   próprio (children). Mostra se o texto é o de origem ou se
   já foi editado, avisa antes de sair com alterações por
   gravar, e permite repor o texto de origem.

     <EditorDoc chave="paginas.sobre" pagina="/sobre" esquema={ESQUEMA} />
   ============================================================ */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { comBase } from "@/lib/base";
import { useAdmin } from "@/lib/admin/store";
import type { RespostaDoc } from "@/lib/conteudo/tipos";
import { Aviso, Botao, BotaoLigacao, Carregando, Confirmar, Etiqueta, useAviso } from "../kit";
import { Formulario } from "./Formulario";
import type { CampoEsquema, Valor } from "./esquema";

async function buscarDoc<T>(chave: string): Promise<RespostaDoc<T>> {
  const r = await fetch(comBase(`/api/admin/conteudo?chave=${encodeURIComponent(chave)}`), { cache: "no-store" });
  const j = await r.json();
  if (!r.ok) throw new Error(j.erro ?? "Falha ao ler.");
  return j;
}

export const quando = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

/** Avisa o navegador antes de sair com alterações por gravar. */
export function useAvisoSaida(sujo: boolean) {
  useEffect(() => {
    if (!sujo) return;
    const f = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [sujo]);
}

/** Origem do conteúdo, em etiqueta. */
export function EtiquetaOrigem({ origem, atualizado }: { origem: "base" | "codigo"; atualizado?: string }) {
  return origem === "base" ? (
    <Etiqueta tom="ok">Editado {atualizado ? `a ${quando(atualizado)}` : ""}</Etiqueta>
  ) : (
    <Etiqueta>Texto de origem</Etiqueta>
  );
}

export function EditorDoc<T extends Valor = Valor>({
  chave, esquema, pagina, titulo, children, aoGravar,
}: {
  chave: string;
  esquema?: CampoEsquema[];
  /** Página do site onde o documento aparece (botão "Ver no site"). */
  pagina?: string;
  titulo?: string;
  /** Editor próprio, em vez do esquema (ou a seguir a ele). */
  children?: (dados: T, mudar: (d: T) => void) => ReactNode;
  aoGravar?: (dados: T) => void;
}) {
  const { registar } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const [doc, setDoc] = useState<RespostaDoc<T> | null>(null);
  const [rascunho, setRascunho] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aGravar, setAGravar] = useState(false);
  const [repor, setRepor] = useState(false);

  const aplicar = useCallback((j: RespostaDoc<T>) => {
    setDoc(j);
    setRascunho(structuredClone(j.dados ?? {}) as T);
    setErro(null);
  }, []);

  const ler = useCallback(() =>
    buscarDoc<T>(chave).then(aplicar, (e) => setErro(e instanceof Error ? e.message : "Falha ao ler.")),
  [chave, aplicar]);

  useEffect(() => {
    let vivo = true;
    buscarDoc<T>(chave).then(
      (j) => { if (vivo) aplicar(j); },
      (e) => { if (vivo) setErro(e instanceof Error ? e.message : "Falha ao ler."); },
    );
    return () => { vivo = false; };
  }, [chave, aplicar]);

  const sujo = useMemo(
    () => doc !== null && rascunho !== null && JSON.stringify(rascunho) !== JSON.stringify(doc.dados ?? {}),
    [doc, rascunho],
  );
  useAvisoSaida(sujo);

  const gravar = async () => {
    if (!rascunho) return;
    setAGravar(true);
    try {
      const r = await fetch(comBase("/api/admin/conteudo"), {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave, dados: rascunho, titulo }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro ?? "Falha ao gravar.");
      setDoc({ ...(doc as RespostaDoc<T>), dados: structuredClone(rascunho), origem: "base", atualizado: j.atualizado });
      registar("Editou", "Conteúdo", titulo ?? doc?.titulo ?? chave);
      mostrar("Gravado. O site já mostra as alterações.");
      aoGravar?.(rascunho);
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Falha ao gravar.", "erro");
    } finally {
      setAGravar(false);
    }
  };

  const reporOriginal = async () => {
    try {
      const r = await fetch(comBase(`/api/admin/conteudo?chave=${encodeURIComponent(chave)}`), { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro ?? "Falha ao repor.");
      registar("Repôs", "Conteúdo", titulo ?? doc?.titulo ?? chave);
      await ler();
      mostrar("Reposto o texto de origem.");
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Falha ao repor.", "erro");
    }
  };

  if (erro) return <Aviso tom="erro" titulo="Não foi possível abrir este conteúdo" accoes={<Botao onClick={ler}>Tentar outra vez</Botao>}>{erro}</Aviso>;
  if (!doc || !rascunho) return <Carregando />;

  return (
    <div className="space-y-5">
      {doc.local && (
        <Aviso tom="atencao" titulo="Modo local">
          Sem base de dados configurada: as gravações ficam num ficheiro deste computador (.conteudo-local.json).
        </Aviso>
      )}

      <div className="sticky top-[4.5rem] z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-[var(--raio)] bg-[#2c2c33]/90 px-3 py-2.5 shadow-lg backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <EtiquetaOrigem origem={doc.origem} atualizado={doc.atualizado} />
          {sujo && <Etiqueta tom="ouro">Alterações por gravar</Etiqueta>}
        </div>
        <div className="flex flex-wrap gap-2">
          {pagina && <BotaoLigacao href={pagina} externo variante="fantasma">Ver no site</BotaoLigacao>}
          {doc.origem === "base" && <Botao variante="fantasma" onClick={() => setRepor(true)}>Repor o original</Botao>}
          <Botao variante="fantasma" disabled={!sujo} onClick={() => setRascunho(structuredClone(doc.dados ?? {}) as T)}>Desfazer</Botao>
          <Botao variante="primario" disabled={!sujo || aGravar} onClick={gravar}>{aGravar ? "A gravar…" : "Gravar"}</Botao>
        </div>
      </div>

      {esquema && <Formulario esquema={esquema} valor={rascunho} onChange={(v) => setRascunho(v as T)} />}
      {children?.(rascunho, setRascunho)}

      <Confirmar
        aberta={repor} aoFechar={() => setRepor(false)} aoConfirmar={reporOriginal} perigo
        titulo="Repor o texto de origem?"
        mensagem="O site volta a mostrar o conteúdo original. As alterações gravadas neste conteúdo perdem-se."
        textoConfirmar="Repor"
      />
      {elemento}
    </div>
  );
}
