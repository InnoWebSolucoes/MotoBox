"use client";

/* ============================================================
   MOTOBOX ADMIN — Página de recurso genérica
   Encapsula o padrão comum a todas as listagens: procura,
   filtros, tabela, criar/editar em gaveta e apagar com
   confirmação. Cada página fornece apenas as colunas e o
   formulário próprios.

   Opções acrescentadas (todas opcionais, as páginas antigas
   continuam a funcionar sem elas):
   - icone, sobretitulo: o cabeçalho com o quadrado vermelho;
   - topo: o que fica entre o cabeçalho e a lista (abas, números);
   - nomeItem/feminino: "Novo anúncio", "Editar anúncio"…;
   - filtrosRapidos: pílulas por cima da lista ("Por verificar");
   - accoesLinha: botões próprios em cada linha;
   - preparar: acerta ou valida o registo antes de gravar;
   - ligacaoSite: botão "Ver no site" na gaveta.

   useAbaUrl: a aba activa de uma página, guardada no endereço
   (?aba=pagina), para se poder ligar directamente a ela.
   ============================================================ */

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAdmin, chaveDe, slugify, type ColeccaoNome } from "@/lib/admin/store";
import {
  CabecalhoPagina, Painel, Ferramentas, Procura, Seleccao, Tabela, Linha, Cel,
  AccaoIcone, Gaveta, Confirmar, useAviso, usePaginacao, Botao, BotaoLigacao, Vazio,
} from "./kit";

export interface Coluna<T> {
  cabecalho: string;
  celula: (item: T) => ReactNode;
  className?: string;
}

export interface Filtro {
  chave: string;
  etiqueta: string;
  opcoes: { valor: string; nome: string }[];
}

/** Pílula de filtro por cima da lista, com a contagem. */
export interface FiltroRapido<T> {
  chave: string;
  nome: string;
  teste: (item: T) => boolean;
}

/**
 * Aba activa guardada no endereço (?aba=…). A primeira da lista é a de
 * partida e não aparece no endereço. A página que a usa tem de estar
 * dentro de <Suspense> (o Next pede-o para ler o endereço).
 */
export function useAbaUrl<K extends string>(validas: readonly K[]): [K, (k: K) => void] {
  const params = useSearchParams();
  const caminho = usePathname();
  const router = useRouter();
  const pedida = params.get("aba") as K | null;
  const activa = pedida && validas.includes(pedida) ? pedida : validas[0];
  const mudar = useCallback((k: K) => {
    const p = new URLSearchParams(params.toString());
    if (k === validas[0]) p.delete("aba");
    else p.set("aba", k);
    const q = p.toString();
    router.replace(q ? `${caminho}?${q}` : caminho, { scroll: false });
  }, [params, caminho, router, validas]);
  return [activa, mudar];
}

export function PaginaRecurso<T extends object>({
  coleccao, titulo, descricao, colunas, filtros = [],
  procuraEm, formulario, vazio, novoRegisto, accoesExtra, porPagina = 12,
  ordenar,
  icone, sobretitulo, topo, nomeItem, feminino = false, filtrosRapidos, accoesLinha,
  preparar, ligacaoSite, tituloItem, larguraGaveta, permitirCriar = true, permitirApagar = true,
  mensagemApagar, procuraPlaceholder, filtroRapidoInicial = "",
}: {
  coleccao: ColeccaoNome;
  titulo: string;
  descricao?: ReactNode;
  colunas: Coluna<T>[];
  filtros?: Filtro[];
  /** Campos onde a procura textual actua */
  procuraEm: (item: T) => string;
  /**
   * Formulário de criação/edição; recebe o rascunho, um setter e se o
   * registo é novo (só aí o slug acompanha o nome automaticamente).
   */
  formulario: (rascunho: T, definir: (campos: Partial<T>) => void, contexto: { novo: boolean }) => ReactNode;
  /** Registo em branco para o botão "Novo" */
  novoRegisto: () => T;
  vazio?: string;
  accoesExtra?: ReactNode;
  porPagina?: number;
  ordenar?: (a: T, b: T) => number;
  /** Ícone do cabeçalho (quadrado vermelho). */
  icone?: ReactNode;
  sobretitulo?: string;
  /** Entre o cabeçalho e a lista: abas, números, interruptores. */
  topo?: ReactNode;
  /** Nome de um registo, em minúsculas (ex.: "anúncio"), para os títulos da gaveta e dos botões. */
  nomeItem?: string;
  /** Género de nomeItem ("Nova categoria"). */
  feminino?: boolean;
  /** Pílulas de filtro por cima da lista (a primeira, "Todos", é acrescentada sozinha). */
  filtrosRapidos?: FiltroRapido<T>[];
  /** Botões próprios de cada linha, antes de Editar e Apagar. */
  accoesLinha?: (item: T) => ReactNode;
  /** Acerta o registo antes de gravar; devolve um texto para recusar com esse aviso. */
  preparar?: (registo: T, contexto: { novo: boolean }) => T | string;
  /** Página pública do registo, para o botão "Ver no site". */
  ligacaoSite?: (item: T) => string | null | undefined;
  /** Nome do registo por baixo do título da gaveta. */
  tituloItem?: (item: T) => string;
  /** Largura da gaveta (classe Tailwind, ex.: "max-w-3xl"). */
  larguraGaveta?: string;
  permitirCriar?: boolean;
  permitirApagar?: boolean;
  /** Texto da confirmação ao apagar. */
  mensagemApagar?: ReactNode;
  procuraPlaceholder?: string;
  /** Pílula escolhida ao abrir a página (ex.: vinda do Painel com ?filtro=…). */
  filtroRapidoInicial?: string;
}) {
  const { estado, criar, atualizar, remover } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const chave = chaveDe(coleccao);

  const dados = estado[coleccao] as unknown as T[];
  const idDe = (it: T) => String((it as Record<string, unknown>)[chave] ?? "");

  const [procura, setProcura] = useState("");
  const [activos, setActivos] = useState<Record<string, string>>({});
  const [rapido, setRapido] = useState(filtroRapidoInicial);
  const [rascunho, setRascunho] = useState<T | null>(null);
  const [aEditar, setAEditar] = useState<string | null>(null);
  const [aApagar, setAApagar] = useState<T | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  const filtroRapido = filtrosRapidos?.find((f) => f.chave === rapido);

  const filtrados = useMemo(() => {
    const q = procura.trim().toLowerCase();
    let lista = dados.filter((it) => {
      if (filtroRapido && !filtroRapido.teste(it)) return false;
      if (q && !procuraEm(it).toLowerCase().includes(q)) return false;
      for (const [k, v] of Object.entries(activos)) {
        if (v && String((it as Record<string, unknown>)[k] ?? "") !== v) return false;
      }
      return true;
    });
    if (ordenar) lista = [...lista].sort(ordenar);
    return lista;
  }, [dados, procura, activos, procuraEm, ordenar, filtroRapido]);

  const { fatia, controlos } = usePaginacao(filtrados, porPagina);

  const nome = nomeItem ?? "registo";
  const novoNome = `${feminino ? "Nova" : "Novo"} ${nome}`;

  const abrirNovo = () => { setAEditar(null); setRascunho(novoRegisto()); };
  const abrirEdicao = (it: T) => { setAEditar(idDe(it)); setRascunho({ ...it }); };
  const fechar = useCallback(() => { setRascunho(null); setAEditar(null); }, []);

  const definir = (campos: Partial<T>) =>
    setRascunho((r) => (r ? { ...r, ...campos } : r));

  const guardar = async () => {
    if (!rascunho || aGuardar) return;
    let pronto = rascunho;
    if (preparar) {
      const r = preparar(rascunho, { novo: !aEditar });
      if (typeof r === "string") { mostrar(r, "erro"); return; }
      pronto = r;
    }
    let registo = pronto as Record<string, unknown>;
    // Endereço apagado num registo novo: volta a nascer do título ou do nome.
    if (chave === "slug" && !aEditar && !String(registo.slug ?? "").trim()) {
      registo = { ...registo, slug: slugify(String(registo.titulo ?? registo.nome ?? "")) };
    }
    const id = String(registo[chave] ?? "").trim();
    if (!id) { mostrar("Preencha o nome ou o título antes de guardar.", "erro"); return; }

    if (!aEditar && dados.some((it) => idDe(it) === id)) {
      mostrar(`Já existe uma página com o endereço "${id}". Mude o endereço da página.`, "erro");
      return;
    }

    // O formulário só fecha quando a base de dados confirma; se falhar,
    // fica aberto com o que foi escrito para se poder corrigir.
    setAGuardar(true);
    const falha = aEditar
      ? await atualizar(coleccao, aEditar, registo)
      : await criar(coleccao, registo);
    setAGuardar(false);

    if (falha) { mostrar(falha, "erro"); return; }
    mostrar(aEditar ? "Alterações guardadas. O site já mostra a versão nova." : `${novoNome.charAt(0).toUpperCase()}${novoNome.slice(1)} criado${feminino ? "a" : ""}.`);
    fechar();
  };

  const emEdicao = aEditar ? dados.find((it) => idDe(it) === aEditar) : undefined;
  const site = emEdicao && ligacaoSite ? ligacaoSite(emEdicao) : null;
  const descricaoGaveta = rascunho
    ? (aEditar
        ? (tituloItem ? tituloItem(rascunho) : aEditar)
        : "Preencha os campos e guarde. Os campos com * são obrigatórios.")
    : undefined;

  const temFiltros = procura || Object.values(activos).some(Boolean) || rapido;

  return (
    <>
      <CabecalhoPagina
        titulo={titulo}
        descricao={descricao}
        icone={icone}
        sobretitulo={sobretitulo}
        accoes={
          <>
            {accoesExtra}
            {permitirCriar && (
              <Botao variante="primario" onClick={abrirNovo}>
                <Plus className="size-4" aria-hidden />
                {nomeItem ? novoNome : "Novo"}
              </Botao>
            )}
          </>
        }
      />

      {topo && <div className="mb-[var(--intervalo)] space-y-[var(--intervalo)]">{topo}</div>}

      <Painel>
        {dados.length === 0 ? (
          <Vazio
            titulo={vazio ?? "Ainda não há nada aqui"}
            accao={permitirCriar ? <Botao variante="primario" onClick={abrirNovo}><Plus className="size-4" aria-hidden />{nomeItem ? novoNome : "Novo"}</Botao> : undefined}
          >
            {permitirCriar ? "Crie o primeiro para aparecer no site." : undefined}
          </Vazio>
        ) : (
          <>
            {filtrosRapidos && filtrosRapidos.length > 0 && (
              <div role="group" aria-label="Filtros rápidos" className="no-scrollbar -mx-1 mb-3 flex gap-[var(--intervalo)] overflow-x-auto px-1 pb-1">
                {[{ chave: "", nome: "Todos", teste: () => true } as FiltroRapido<T>, ...filtrosRapidos].map((f) => (
                  <button
                    key={f.chave || "todos"} type="button" aria-pressed={rapido === f.chave}
                    onClick={() => setRapido(f.chave)} className="pilula"
                  >
                    {f.nome}
                    <span className="tabular-nums opacity-70">{dados.filter(f.teste).length}</span>
                  </button>
                ))}
              </div>
            )}

            <Ferramentas>
              <Procura valor={procura} onChange={setProcura} placeholder={procuraPlaceholder} />
              {filtros.map((f) => (
                <Seleccao
                  key={f.chave}
                  valor={activos[f.chave] ?? ""}
                  onChange={(v) => setActivos((a) => ({ ...a, [f.chave]: v }))}
                  opcoes={[{ valor: "", nome: f.etiqueta }, ...f.opcoes]}
                  className="sm:w-52"
                  aria-label={f.etiqueta}
                />
              ))}
              {temFiltros && (
                <Botao variante="fantasma" onClick={() => { setProcura(""); setActivos({}); setRapido(""); }}>
                  Limpar filtros
                </Botao>
              )}
            </Ferramentas>

            {/* Telemóvel: um cartão por registo, sem tabela a deslizar de lado. */}
            {fatia.length === 0 ? (
              <p className="py-10 text-center text-sm text-white/50 md:hidden">Nenhum registo corresponde aos filtros.</p>
            ) : (
              <ul className="space-y-[var(--intervalo)] md:hidden">
                {fatia.map((it) => (
                  <li key={idDe(it)} className="rounded-[var(--raio)] border border-white/[0.08] bg-black/[0.15] p-3.5">
                    <button type="button" onClick={() => abrirEdicao(it)} className="block w-full min-w-0 text-left">
                      {colunas[0]?.celula(it)}
                    </button>
                    {colunas.length > 1 && (
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
                        {colunas.slice(1).map((c, i) => (
                          <div key={i} className="min-w-0">
                            <dt className="text-[11px] text-white/45">{c.cabecalho}</dt>
                            <dd className="mt-0.5 min-w-0 truncate">{c.celula(it)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <div className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-white/[0.07] pt-3">
                      {accoesLinha?.(it)}
                      <AccaoIcone titulo="Editar" onClick={() => abrirEdicao(it)}>
                        <Pencil className="size-3.5" aria-hidden />
                      </AccaoIcone>
                      {permitirApagar && (
                        <AccaoIcone titulo="Apagar" tom="perigo" onClick={() => setAApagar(it)}>
                          <Trash2 className="size-3.5" aria-hidden />
                        </AccaoIcone>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="hidden md:block">
              <Tabela
                cabecalhos={[...colunas.map((c) => c.cabecalho), "Acções"]}
                vazio={fatia.length === 0}
              >
                {fatia.map((it) => (
                  <Linha key={idDe(it)} onClick={() => abrirEdicao(it)}>
                    {colunas.map((c, i) => (
                      <Cel key={i} className={c.className}>{c.celula(it)}</Cel>
                    ))}
                    <Cel className="w-px">
                      <div className="flex justify-end gap-1.5">
                        {accoesLinha?.(it)}
                        <AccaoIcone titulo="Editar" onClick={() => abrirEdicao(it)}>
                          <Pencil className="size-3.5" aria-hidden />
                        </AccaoIcone>
                        {permitirApagar && (
                          <AccaoIcone titulo="Apagar" tom="perigo" onClick={() => setAApagar(it)}>
                            <Trash2 className="size-3.5" aria-hidden />
                          </AccaoIcone>
                        )}
                      </div>
                    </Cel>
                  </Linha>
                ))}
              </Tabela>
            </div>
            {controlos}
          </>
        )}
      </Painel>

      <Gaveta
        aberta={rascunho !== null}
        aoFechar={fechar}
        titulo={aEditar ? `Editar ${nomeItem ?? titulo.toLowerCase()}` : nomeItem ? novoNome : "Novo registo"}
        descricao={descricaoGaveta}
        largura={larguraGaveta}
        rodape={
          <>
            {aEditar && permitirApagar && emEdicao && (
              <Botao variante="perigo" className="mr-auto" onClick={() => setAApagar(emEdicao)}>
                <Trash2 className="size-4" aria-hidden />
                Apagar
              </Botao>
            )}
            {site && <BotaoLigacao href={site} externo variante="fantasma">Ver no site</BotaoLigacao>}
            <Botao variante="fantasma" onClick={fechar}>Cancelar</Botao>
            <Botao variante="primario" onClick={guardar} disabled={aGuardar}>
              {aGuardar ? "A guardar…" : "Guardar"}
            </Botao>
          </>
        }
      >
        {rascunho && <div className="space-y-4">{formulario(rascunho, definir, { novo: !aEditar })}</div>}
      </Gaveta>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        aoConfirmar={async () => {
          if (!aApagar) return;
          const id = idDe(aApagar);
          const falha = await remover(coleccao, id);
          mostrar(falha ?? "Apagado. Já não aparece no site.", falha ? "erro" : "ok");
          if (!falha && aEditar === id) fechar();
        }}
        titulo={nomeItem ? `Apagar ${nomeItem}` : "Apagar registo"}
        mensagem={mensagemApagar ?? "Esta acção é permanente e tira o registo do site. Pretende continuar?"}
        textoConfirmar="Apagar"
        perigo
      />

      {elemento}
    </>
  );
}
