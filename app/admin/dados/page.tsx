"use client";

/* ============================================================
   MOTOBOX ADMIN — Dados
   A ligação à base de dados, as cópias de segurança (dos
   registos e dos textos do site), a importação e a reposição
   dos dados de demonstração.
   ============================================================ */

import { useRef, useState } from "react";
import { Database, Download, FileText, RefreshCw, RotateCcw, Sprout, Upload } from "lucide-react";
import { useAdmin, type ColeccaoNome } from "@/lib/admin/store";
import {
  Area, Aviso, Botao, CabecalhoPagina, Confirmar, Estatistica, Painel, useAviso,
} from "@/components/admin/kit";
import { comBase } from "@/lib/base";

/** As colecções que o site mostra, para a contagem (a cópia leva tudo). */
const COLECCOES: { chave: ColeccaoNome; nome: string }[] = [
  { chave: "noticias", nome: "Artigos" },
  { chave: "eventos", nome: "Eventos e provas" },
  { chave: "clubes", nome: "Clubes" },
  { chave: "corridas", nome: "Resultados" },
  { chave: "pilotos", nome: "Pilotos" },
  { chave: "equipas", nome: "Equipas" },
  { chave: "anuncios", nome: "Anúncios" },
  { chave: "topicos", nome: "Tópicos do fórum" },
  { chave: "categoriasForum", nome: "Categorias do fórum" },
  { chave: "utilizadores", nome: "Utilizadores" },
  { chave: "encomendas", nome: "Encomendas" },
  { chave: "denuncias", nome: "Denúncias" },
  { chave: "subscritores", nome: "Subscritores" },
  { chave: "mensagens", nome: "Mensagens" },
  { chave: "paginasLegais", nome: "Páginas legais" },
];

/* ---------------- Textos do site (conteúdo editável) ---------------- */

interface IndiceConteudo {
  docs: { chave: string; titulo: string; origem: "base" | "codigo" }[];
  grupos: { grupo: string; titulo: string; total: number; editados: number; materializado: boolean }[];
}

interface CopiaConteudo {
  tipo: "motobox-conteudo";
  versao: 1;
  exportado: string;
  docs: Record<string, { titulo: string; dados: unknown }>;
  grupos: Record<string, { ordem: string[] | null; itens: Record<string, { titulo: string; dados: unknown }> }>;
}

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(comBase(caminho), { cache: "no-store", ...init });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(String((j as { erro?: string }).erro ?? `Erro ${r.status}`));
  return j as T;
}

/** Só o que foi mudado no painel: o resto já está no código do site. */
async function exportarConteudo(): Promise<CopiaConteudo> {
  const indice = await pedir<IndiceConteudo>("/api/admin/conteudo");
  const copia: CopiaConteudo = { tipo: "motobox-conteudo", versao: 1, exportado: new Date().toISOString(), docs: {}, grupos: {} };
  for (const d of indice.docs.filter((x) => x.origem === "base")) {
    const doc = await pedir<{ titulo: string; dados: unknown }>(`/api/admin/conteudo?chave=${encodeURIComponent(d.chave)}`);
    copia.docs[d.chave] = { titulo: doc.titulo, dados: doc.dados };
  }
  for (const g of indice.grupos.filter((x) => x.editados > 0 || x.materializado)) {
    const r = await pedir<{ itens: { chave: string; titulo: string; dados: unknown; origem: string }[]; materializado: boolean }>(
      `/api/admin/conteudo?grupo=${encodeURIComponent(g.grupo)}`,
    );
    copia.grupos[g.grupo] = {
      ordem: r.materializado ? r.itens.map((i) => i.chave) : null,
      itens: Object.fromEntries(r.itens.filter((i) => i.origem === "base").map((i) => [i.chave, { titulo: i.titulo, dados: i.dados }])),
    };
  }
  return copia;
}

async function importarConteudo(c: CopiaConteudo): Promise<number> {
  let n = 0;
  const put = (corpo: unknown) => pedir("/api/admin/conteudo", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo),
  });
  for (const [chave, d] of Object.entries(c.docs ?? {})) { await put({ chave, titulo: d.titulo, dados: d.dados }); n++; }
  for (const [grupo, g] of Object.entries(c.grupos ?? {})) {
    for (const [chave, i] of Object.entries(g.itens ?? {})) { await put({ grupo, chave, titulo: i.titulo, dados: i.dados }); n++; }
    if (Array.isArray(g.ordem)) await put({ grupo, ordem: g.ordem });
  }
  return n;
}

const descarregar = (nome: string, texto: string) => {
  const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
};

export default function AdminDados() {
  const { estado, exportar, importar, reiniciar, origem, recarregar, erroSync, registar } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const ficheiro = useRef<HTMLInputElement>(null);
  const ficheiroTextos = useRef<HTMLInputElement>(null);

  const [aReiniciar, setAReiniciar] = useState(false);
  const [colar, setColar] = useState("");
  const [aSemear, setASemear] = useState(false);
  const [semeando, setSemeando] = useState(false);
  const [textosOcupado, setTextosOcupado] = useState<"" | "exportar" | "importar">("");
  const [copiaTextos, setCopiaTextos] = useState<CopiaConteudo | null>(null);

  const semear = async () => {
    setSemeando(true);
    try {
      const r = await fetch(comBase("/api/admin/semear"), { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        mostrar("Base de dados preenchida com o conteúdo de demonstração.");
        await recarregar();
      } else {
        mostrar(String(j.erro ?? "Falha ao preencher."), "erro");
      }
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Falha de rede.", "erro");
    } finally {
      setSemeando(false);
    }
  };

  const descarregarRegistos = () => {
    descarregar(`motobox-dados-${new Date().toISOString().slice(0, 10)}.json`, exportar());
    mostrar("Cópia de segurança descarregada.");
  };

  const carregarFicheiro = async (f: File) => {
    const texto = await f.text();
    if (importar(texto)) mostrar("Dados importados.");
    else mostrar("Ficheiro inválido. Nada foi alterado.", "erro");
  };

  const importarColado = () => {
    if (!colar.trim()) { mostrar("Cole primeiro o conteúdo da cópia.", "erro"); return; }
    if (importar(colar)) { mostrar("Dados importados."); setColar(""); }
    else mostrar("O texto colado não é uma cópia válida. Nada foi alterado.", "erro");
  };

  const exportarTextos = async () => {
    setTextosOcupado("exportar");
    try {
      const c = await exportarConteudo();
      const n = Object.keys(c.docs).length + Object.values(c.grupos).reduce((s, g) => s + Object.keys(g.itens).length, 0);
      descarregar(`motobox-textos-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(c, null, 2));
      mostrar(n ? `${n} textos editados guardados no ficheiro.` : "Ainda não há textos editados: o ficheiro vai vazio.");
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Falha ao exportar.", "erro");
    } finally {
      setTextosOcupado("");
    }
  };

  const lerCopiaTextos = async (f: File) => {
    try {
      const c = JSON.parse(await f.text()) as CopiaConteudo;
      if (c?.tipo !== "motobox-conteudo") throw new Error();
      setCopiaTextos(c);
    } catch {
      mostrar("Este ficheiro não é uma cópia dos textos do site.", "erro");
    }
  };

  const importarTextos = async (c: CopiaConteudo) => {
    setTextosOcupado("importar");
    try {
      const n = await importarConteudo(c);
      registar("importou", "Conteúdo", `${n} textos do site`);
      mostrar(`${n} textos repostos a partir da cópia. O site já os mostra.`);
    } catch (e) {
      mostrar(e instanceof Error ? `A importação parou: ${e.message}` : "Falha ao importar.", "erro");
    } finally {
      setTextosOcupado("");
    }
  };

  const totalRegistos = COLECCOES.reduce((s, c) => s + (estado[c.chave] as unknown[]).length, 0);

  return (
    <>
      <CabecalhoPagina
        titulo="Dados"
        sobretitulo="Sistema"
        icone={<Database />}
        descricao="A ligação à base de dados, as cópias de segurança e a importação."
      />

      {/* Estado da ligação */}
      <div className="mb-[var(--intervalo)]">
        <Aviso
          tom={origem === "supabase" ? "ok" : "atencao"}
          titulo={origem === "supabase" ? "Ligado à base de dados" : origem === "local" ? "Modo local (sem base de dados)" : "A verificar a ligação…"}
          accoes={
            <>
              <Botao onClick={() => void recarregar()}><RefreshCw className="size-4" aria-hidden />Recarregar</Botao>
              {origem === "supabase" && (
                <Botao variante="primario" onClick={() => setASemear(true)} disabled={semeando}>
                  <Sprout className="size-4" aria-hidden />{semeando ? "A preencher…" : "Preencher com a demonstração"}
                </Botao>
              )}
            </>
          }
        >
          {origem === "supabase"
            ? "O que se muda no painel fica gravado na base de dados e aparece no site."
            : "O que se muda fica só neste navegador. Para ficar no site, o servidor precisa das chaves do Supabase."}
          {erroSync && <p className="mt-2 text-mb-red-light">{erroSync}</p>}
        </Aviso>
      </div>

      <div className="mb-[var(--intervalo)] grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
        <Estatistica rotulo="Registos" valor={totalRegistos.toLocaleString("pt-PT")} />
        <Estatistica rotulo="Colecções" valor={COLECCOES.length} />
        <Estatistica rotulo="Acções registadas" valor={estado.atividade.length} />
        <Estatistica rotulo="Onde vivem os dados"
          valor={origem === "supabase" ? "Supabase" : "Navegador"}
          tom={origem === "supabase" ? "ok" : "gold"}
          variacao={origem === "supabase" ? "Base de dados" : "Só neste computador"} />
      </div>

      <div className="grid gap-[var(--intervalo)] lg:grid-cols-2">
        <Painel titulo="Cópia dos registos" icone={<Download />}
          descricao="Artigos, eventos, provas, clubes, pilotos, anúncios, fórum, contas, encomendas e definições, num ficheiro.">
          <p className="mb-4 text-sm leading-relaxed text-white/60">
            Faça uma cópia antes de mudanças grandes, para poder voltar atrás.
          </p>
          <Botao variante="primario" onClick={descarregarRegistos}><Download className="size-4" aria-hidden />Descarregar cópia</Botao>
        </Painel>

        <Painel titulo="Importar registos" icone={<Upload />} descricao="Substitui os registos actuais pelos de uma cópia.">
          <p className="mb-4 text-sm leading-relaxed text-white/60">
            A importação troca o que está no painel pelo que está na cópia. Descarregue primeiro uma cópia do que existe agora.
          </p>
          <input ref={ficheiro} type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void carregarFicheiro(f); e.target.value = ""; }} />
          <Botao onClick={() => ficheiro.current?.click()}><Upload className="size-4" aria-hidden />Escolher ficheiro</Botao>
          <div className="mt-4">
            <Area rows={3} value={colar} onChange={(e) => setColar(e.target.value)} aria-label="Colar a cópia"
              placeholder="… ou cole aqui o conteúdo da cópia" />
            <Botao className="mt-2" variante="fantasma" onClick={importarColado}>Importar o texto colado</Botao>
          </div>
        </Painel>

        <Painel titulo="Cópia dos textos do site" icone={<FileText />} className="lg:col-span-2"
          descricao="Os textos e guias mudados no painel: entrada, páginas das secções, rotas, perfis dos clubes, modalidades…">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-2xl text-sm leading-relaxed text-white/60">
              Leva só o que foi editado (o resto é o texto original do site). Ao importar, os textos da cópia são gravados
              por cima dos actuais; os que não estão na cópia ficam como estão.
            </p>
            <div className="flex flex-wrap gap-2">
              <input ref={ficheiroTextos} type="file" accept="application/json" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void lerCopiaTextos(f); e.target.value = ""; }} />
              <Botao onClick={() => ficheiroTextos.current?.click()} disabled={textosOcupado !== ""}>
                <Upload className="size-4" aria-hidden />{textosOcupado === "importar" ? "A importar…" : "Importar textos"}
              </Botao>
              <Botao variante="primario" onClick={() => void exportarTextos()} disabled={textosOcupado !== ""}>
                <Download className="size-4" aria-hidden />{textosOcupado === "exportar" ? "A preparar…" : "Descarregar textos"}
              </Botao>
            </div>
          </div>
        </Painel>

        <Painel titulo="Registos por colecção" className="lg:col-span-2">
          <ul className="grid grid-cols-2 gap-[var(--intervalo)] sm:grid-cols-3 lg:grid-cols-5">
            {COLECCOES.map((c) => (
              <li key={c.chave} className="rounded-[var(--raio)] bg-black/[0.18] p-3.5">
                <p className="text-xl font-semibold tabular-nums">{(estado[c.chave] as unknown[]).length}</p>
                <p className="mt-0.5 text-xs text-white/55">{c.nome}</p>
              </li>
            ))}
          </ul>
        </Painel>

        <Painel titulo="Repor os dados de demonstração" icone={<RotateCcw />} className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-2xl text-sm leading-relaxed text-white/60">
              Deita fora as mudanças guardadas neste navegador e volta ao conteúdo de demonstração.
              Não mexe na base de dados nem nos textos do site. Não se pode desfazer.
            </p>
            <Botao variante="perigo" onClick={() => setAReiniciar(true)}><RotateCcw className="size-4" aria-hidden />Repor tudo</Botao>
          </div>
        </Painel>
      </div>

      <Confirmar
        aberta={aSemear}
        aoFechar={() => setASemear(false)}
        aoConfirmar={() => void semear()}
        titulo="Preencher com a demonstração"
        mensagem="Copia o conteúdo de demonstração para a base de dados. Os registos com o mesmo identificador são substituídos; nada fica em duplicado."
        textoConfirmar="Preencher"
      />

      <Confirmar
        aberta={copiaTextos !== null}
        aoFechar={() => setCopiaTextos(null)}
        aoConfirmar={() => { if (copiaTextos) void importarTextos(copiaTextos); }}
        titulo="Importar os textos da cópia"
        mensagem={copiaTextos ? `A cópia de ${new Date(copiaTextos.exportado).toLocaleDateString("pt-PT")} traz ${Object.keys(copiaTextos.docs ?? {}).length} páginas e ${Object.values(copiaTextos.grupos ?? {}).reduce((s, g) => s + Object.keys(g.itens ?? {}).length, 0)} itens (rotas, perfis, modalidades). Os textos actuais com o mesmo nome são substituídos.` : ""}
        textoConfirmar="Importar"
      />

      <Confirmar
        aberta={aReiniciar}
        aoFechar={() => setAReiniciar(false)}
        aoConfirmar={() => { reiniciar(); mostrar("Dados de demonstração repostos."); }}
        titulo="Repor os dados de demonstração"
        mensagem="Todas as mudanças guardadas neste navegador são descartadas e volta o conteúdo de demonstração."
        textoConfirmar="Repor tudo"
        perigo
      />

      {elemento}
    </>
  );
}
