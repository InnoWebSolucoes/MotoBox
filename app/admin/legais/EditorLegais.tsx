"use client";

/* ============================================================
   MOTOBOX ADMIN — Páginas legais
   Termos, privacidade, cookies e regulamento: cada página vive
   na tabela paginas_legais (título, descrição, secções com
   parágrafos, publicada ou não) e abre no site em /<endereço>.
   As alterações ficam num rascunho até carregar em Gravar.
   No separador "Textos comuns", o que se repete em todas elas
   (conteúdo editável "paginas.legais").
   ============================================================ */

import { useMemo, useState } from "react";
import { ExternalLink, FilePlus2, FileText, ListOrdered, Scale, Type } from "lucide-react";
import { useAdmin, slugify } from "@/lib/admin/store";
import type { PaginaLegal } from "@/lib/admin/types";
import { formatDataCurta } from "@/lib/data";
import {
  Area, Aviso, Botao, BotaoLigacao, CabecalhoPagina, Campo, CampoEndereco, Carregando, Confirmar, Estado,
  Etiqueta, Input, Interruptor, Painel, Vazio, useAviso,
} from "@/components/admin/kit";
import { EditorDoc, useAvisoSaida } from "@/components/admin/editor/EditorDoc";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema } from "@/components/admin/editor/esquema";
import { AbasEmLinhas } from "../paginas/_editor/partes";

export type AbaLegais = "documentos" | "textos";

/** Endereços que já são secções do site e não podem ser páginas legais. */
const RESERVADOS = new Set([
  "admin", "api", "artigos", "auth", "bilhetes", "calendario", "classificacao", "clubes", "conta", "contacto",
  "desporto", "entrar", "equipas", "eventos", "explorar", "forum", "marketplace", "newsletter", "noticias",
  "nova-palavra-passe", "patrocinadores", "pilotos", "resultados", "rotas", "seguranca", "sem-acesso", "sobre",
  "videos", "media-local", "marca",
]);

const hoje = () => new Date().toISOString().slice(0, 10);

const NOVA = (): PaginaLegal => ({
  slug: "",
  titulo: "",
  descricao: "",
  atualizado: hoje(),
  publicado: false,
  seccoes: [{ titulo: "1. ", corpo: [""] }],
});

/** Secções: título e parágrafos (separados por uma linha em branco). */
const ESQUEMA_SECCOES: CampoEsquema[] = [
  {
    tipo: "lista", chave: "seccoes", etiqueta: "Secções", nomeItem: "secção",
    ajuda: "Cada secção tem um título e o seu texto. A página mostra-as por esta ordem, com uma lista \"Nesta página\" ao lado.",
    resumo: (s) => String(s.titulo ?? ""),
    novo: () => ({ titulo: "", corpo: [""] }),
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título da secção", placeholder: "Ex.: 3. Dados que recolhemos" },
      {
        tipo: "personalizado", chave: "corpo", etiqueta: "Texto",
        render: (v, mudar) => {
          const paragrafos = Array.isArray(v) ? v.map((p) => (typeof p === "string" ? p : "")) : [];
          return (
            <Campo etiqueta="Texto" ajuda="Deixe uma linha em branco entre parágrafos.">
              <Area
                rows={Math.min(14, Math.max(4, paragrafos.join("\n\n").split("\n").length + 1))}
                value={paragrafos.join("\n\n")}
                onChange={(e) => mudar(e.target.value.split(/\n\s*\n/))}
              />
            </Campo>
          );
        },
      },
    ],
  },
];

const ESQUEMA_TEXTOS: CampoEsquema[] = [
  { tipo: "texto", chave: "sobretitulo", etiqueta: "Linha pequena por cima do título", largura: "meia", placeholder: "Documento legal" },
  { tipo: "texto", chave: "actualizacao", etiqueta: "Antes da data", largura: "meia", ajuda: "Lê-se \"Última atualização: 1 de Setembro de 2026\"." },
  { tipo: "texto", chave: "inicio", etiqueta: "Primeira ligação do caminho", largura: "meia", ajuda: "Leva à página inicial." },
  { tipo: "texto", chave: "nestaPagina", etiqueta: "Título da lista de secções", largura: "meia" },
  { tipo: "texto", chave: "outros", etiqueta: "Título da lista das outras páginas", largura: "meia" },
];

/** Mesmo conteúdo? (para saber se há alterações por gravar). */
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function EditorLegais({ abaInicial }: { abaInicial: AbaLegais }) {
  const { estado, pronto, criar, atualizar, remover } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const lista = estado.paginasLegais;

  const [aba, setAba] = useState<AbaLegais>(abaInicial);
  const [pedida, setPedida] = useState(abaInicial);
  if (pedida !== abaInicial) {
    setPedida(abaInicial);
    setAba(abaInicial);
  }

  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  /** Rascunho com alterações; null = sem alterações (mostra o que está gravado). */
  const [edicao, setEdicao] = useState<PaginaLegal | null>(null);
  const [nova, setNova] = useState(false);
  const [dataHoje, setDataHoje] = useState(true);
  const [aGravar, setAGravar] = useState(false);
  const [aApagar, setAApagar] = useState(false);
  const [trocarPara, setTrocarPara] = useState<string | "nova" | null>(null);

  const slugActual = seleccionada && lista.some((p) => p.slug === seleccionada) ? seleccionada : lista[0]?.slug ?? null;
  const original = nova ? null : lista.find((p) => p.slug === slugActual) ?? null;
  const pagina = edicao ?? original;
  const sujo = nova || (edicao !== null && original !== null && !igual(edicao, original));
  useAvisoSaida(sujo);

  const erroEndereco = useMemo(() => {
    if (!nova || !pagina) return null;
    if (!pagina.slug) return "Falta o endereço da página.";
    if (RESERVADOS.has(pagina.slug)) return "Este endereço já é uma secção do site. Escolha outro.";
    if (lista.some((p) => p.slug === pagina.slug)) return "Já há uma página com este endereço.";
    return null;
  }, [nova, pagina, lista]);

  const mudar = (campos: Partial<PaginaLegal>) => {
    if (!pagina) return;
    setEdicao({ ...pagina, ...campos });
  };

  /** Abre outra página (ou uma nova), perguntando antes se houver alterações por gravar. */
  const abrir = (alvo: string | "nova") => {
    if (sujo && !(nova && alvo === "nova")) { setTrocarPara(alvo); return; }
    aplicarTroca(alvo);
  };
  const aplicarTroca = (alvo: string | "nova") => {
    setDataHoje(true);
    if (alvo === "nova") {
      setNova(true);
      setEdicao(NOVA());
    } else {
      setNova(false);
      setEdicao(null);
      setSeleccionada(alvo);
    }
  };

  const gravar = async () => {
    if (!pagina) return;
    if (!pagina.titulo.trim()) { mostrar("Falta o título da página.", "erro"); return; }
    if (erroEndereco) { mostrar(erroEndereco, "erro"); return; }
    const seccoes = pagina.seccoes
      .map((s) => ({ titulo: s.titulo.trim(), corpo: s.corpo.map((p) => p.trim()).filter(Boolean) }))
      .filter((s) => s.titulo || s.corpo.length);
    const dados: PaginaLegal = {
      ...pagina,
      titulo: pagina.titulo.trim(),
      descricao: pagina.descricao.trim(),
      seccoes,
      atualizado: dataHoje ? hoje() : pagina.atualizado || hoje(),
    };
    setAGravar(true);
    const falha = nova
      ? await criar("paginasLegais", dados as unknown as Record<string, unknown>)
      : await atualizar("paginasLegais", pagina.slug, {
          titulo: dados.titulo, descricao: dados.descricao, seccoes: dados.seccoes,
          publicado: dados.publicado, atualizado: dados.atualizado,
        } as Partial<Record<string, unknown>>);
    setAGravar(false);
    if (falha) { mostrar(falha, "erro"); return; }
    if (nova) { setNova(false); setSeleccionada(dados.slug); }
    setEdicao(null);
    setDataHoje(true);
    mostrar(nova ? "Página criada." : "Gravado. O site já mostra as alterações.");
  };

  const apagar = async () => {
    if (!original) return;
    const falha = await remover("paginasLegais", original.slug);
    if (falha) { mostrar(falha, "erro"); return; }
    setEdicao(null);
    setSeleccionada(lista.find((p) => p.slug !== original.slug)?.slug ?? null);
    mostrar("Página apagada.");
  };

  const descartar = () => {
    if (nova) { setNova(false); setEdicao(null); return; }
    setEdicao(null);
    setDataHoje(true);
  };

  const mudarAba = (k: AbaLegais) => {
    setAba(k);
    try { window.history.replaceState(null, "", `?aba=${k}`); } catch { /* indisponível */ }
  };

  return (
    <>
      <CabecalhoPagina
        sobretitulo="Site"
        titulo="Páginas legais"
        icone={<Scale />}
        descricao="Termos e condições, privacidade, cookies e o regulamento da comunidade. Cada página abre no site no seu próprio endereço (ex.: /termos)."
        accoes={aba === "documentos" && (
          <Botao variante="primario" onClick={() => abrir("nova")}>
            <FilePlus2 className="size-4" aria-hidden /> Nova página
          </Botao>
        )}
      />

      <div className="mb-5">
        <AbasEmLinhas
          abas={[
            { chave: "documentos", nome: "Páginas", contador: lista.length },
            { chave: "textos", nome: "Textos comuns" },
          ]}
          activa={aba}
          onChange={mudarAba}
          rotulo="Páginas legais"
        />
      </div>

      <div hidden={aba !== "documentos"}>
        {!pronto ? (
          <Carregando />
        ) : (
          <div className="grid items-start gap-[var(--intervalo)] lg:grid-cols-[18rem_minmax(0,1fr)]">
            {/* Lista das páginas */}
            <nav aria-label="Páginas legais" className="painel painel-escuro p-2 lg:sticky lg:top-[5.5rem]">
              <ul className="space-y-0.5">
                {nova && (
                  <li>
                    <span className="flex items-center gap-2 rounded-[var(--raio)] bg-mb-red px-3 py-2.5 text-sm text-white">
                      <FilePlus2 className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{pagina?.titulo || "Nova página"}</span>
                    </span>
                  </li>
                )}
                {lista.map((p) => {
                  const sel = !nova && p.slug === slugActual;
                  return (
                    <li key={p.slug}>
                      <button
                        type="button"
                        onClick={() => { if (!sel) abrir(p.slug); }}
                        aria-current={sel ? "page" : undefined}
                        className={`flex w-full items-start gap-2 rounded-[var(--raio)] px-3 py-2.5 text-left transition-colors ${
                          sel ? "bg-mb-red text-white" : "text-white/80 hover:bg-white/[0.07] hover:text-white"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{p.titulo}</span>
                          <span className={`block truncate text-xs ${sel ? "text-white/75" : "text-white/45"}`}>/{p.slug}</span>
                        </span>
                        {!p.publicado && <span className={`mt-0.5 shrink-0 text-[11px] ${sel ? "text-white/80" : "text-gold"}`}>Rascunho</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {lista.length === 0 && !nova && (
                <p className="px-3 py-6 text-center text-sm text-white/50">Ainda não há páginas legais.</p>
              )}
            </nav>

            {/* Editor */}
            {pagina ? (
              <div className="min-w-0 space-y-[var(--intervalo)]">
                <div className="sticky top-[4.5rem] z-20 flex flex-wrap items-center justify-between gap-3 rounded-[var(--raio)] bg-[#2c2c33]/90 px-3 py-2.5 shadow-lg backdrop-blur-xl">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {nova ? <Etiqueta tom="ouro">Página nova, ainda por criar</Etiqueta> : (
                      <>
                        <Estado valor={pagina.publicado ? "publicado" : "rascunho"} rotulo={pagina.publicado ? "Publicada" : "Rascunho"} />
                        {original && <span className="text-xs text-white/50">Actualizada a {formatDataCurta(original.atualizado)}</span>}
                      </>
                    )}
                    {sujo && !nova && <Etiqueta tom="ouro">Alterações por gravar</Etiqueta>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!nova && original?.publicado && (
                      <BotaoLigacao href={`/${original.slug}`} externo variante="fantasma">
                        <ExternalLink className="size-4" aria-hidden /> Ver no site
                      </BotaoLigacao>
                    )}
                    {!nova && <Botao variante="fantasma" onClick={() => setAApagar(true)}>Apagar</Botao>}
                    <Botao variante="fantasma" disabled={!sujo} onClick={descartar}>{nova ? "Cancelar" : "Desfazer"}</Botao>
                    <Botao variante="primario" disabled={!sujo || aGravar} onClick={gravar}>
                      {aGravar ? "A gravar…" : nova ? "Criar página" : "Gravar"}
                    </Botao>
                  </div>
                </div>

                <Painel titulo="Página" icone={<FileText />}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Campo etiqueta="Título" obrigatorio className="md:col-span-2">
                      <Input
                        value={pagina.titulo}
                        placeholder="Ex.: Política de Privacidade"
                        onChange={(e) => mudar(nova && pagina.slug === slugify(pagina.titulo)
                          ? { titulo: e.target.value, slug: slugify(e.target.value) }
                          : { titulo: e.target.value })}
                      />
                    </Campo>
                    <div className="md:col-span-2">
                      {nova ? (
                        <>
                          <CampoEndereco prefixo="" novo valor={pagina.slug} onChange={(slug) => mudar({ slug })} />
                          {erroEndereco && pagina.titulo && <p role="alert" className="mt-1.5 text-xs text-mb-red-light">{erroEndereco}</p>}
                        </>
                      ) : (
                        <Campo etiqueta="Endereço da página" ajuda="O endereço não muda depois de criada a página, para não partir as ligações já partilhadas.">
                          <Input value={`/${pagina.slug}`} disabled />
                        </Campo>
                      )}
                    </div>
                    <Campo etiqueta="Descrição" className="md:col-span-2" ajuda="Aparece por baixo do título, no topo da página, e nos resultados do Google.">
                      <Area rows={2} value={pagina.descricao} onChange={(e) => mudar({ descricao: e.target.value })} />
                    </Campo>
                    <div className="md:col-span-2">
                      <Interruptor
                        activo={pagina.publicado}
                        etiqueta="Página publicada"
                        descricao={"Desligada, a página deixa de abrir no site e sai da lista “Outros documentos” das outras páginas."}
                        onChange={(v) => mudar({ publicado: v })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Interruptor
                        activo={dataHoje}
                        etiqueta="Mudar a data para hoje ao gravar"
                        descricao={"A página mostra “Última atualização” com esta data. Desligue para uma correcção pequena que não muda o sentido do texto."}
                        onChange={setDataHoje}
                      />
                    </div>
                    {!dataHoje && (
                      <Campo etiqueta="Data da última actualização">
                        <Input type="date" value={pagina.atualizado.slice(0, 10)} onChange={(e) => mudar({ atualizado: e.target.value })} />
                      </Campo>
                    )}
                  </div>
                </Painel>

                <Painel titulo="Texto" icone={<ListOrdered />} descricao="Abra uma secção para a editar. As setas mudam a ordem.">
                  <Formulario
                    esquema={ESQUEMA_SECCOES}
                    valor={{ seccoes: pagina.seccoes }}
                    onChange={(v) => mudar({ seccoes: (v.seccoes as PaginaLegal["seccoes"]) ?? [] })}
                  />
                </Painel>
              </div>
            ) : (
              <Vazio titulo="Nenhuma página escolhida" accao={<Botao variante="primario" onClick={() => abrir("nova")}>Nova página</Botao>}>
                Escolha uma página na lista ou crie uma nova.
              </Vazio>
            )}
          </div>
        )}
      </div>

      <div hidden={aba !== "textos"}>
        <div className="mb-[var(--intervalo)]">
          <Aviso>Estes textos repetem-se em todas as páginas legais: a linha por cima do título, a data e as listas ao lado do texto.</Aviso>
        </div>
        <EditorDoc chave="paginas.legais" pagina="/termos">
          {(dados, mudarDoc) => (
            <Painel titulo="Textos comuns" icone={<Type />}>
              <Formulario esquema={ESQUEMA_TEXTOS} valor={dados} onChange={mudarDoc} />
            </Painel>
          )}
        </EditorDoc>
      </div>

      <Confirmar
        aberta={aApagar}
        aoFechar={() => setAApagar(false)}
        aoConfirmar={apagar}
        titulo="Apagar esta página?"
        mensagem={<>A página <strong className="text-white">{original?.titulo}</strong> deixa de existir no site e as ligações para ela deixam de funcionar. Para a esconder sem a perder, desligue antes &quot;Página publicada&quot;.</>}
        textoConfirmar="Apagar"
        perigo
      />
      <Confirmar
        aberta={trocarPara !== null}
        aoFechar={() => setTrocarPara(null)}
        aoConfirmar={() => { if (trocarPara) aplicarTroca(trocarPara); }}
        titulo="Deixar as alterações?"
        mensagem="Há alterações nesta página que ainda não foram gravadas. Se continuar, perdem-se."
        textoConfirmar="Deixar e continuar"
        perigo
      />
      {elemento}
    </>
  );
}
