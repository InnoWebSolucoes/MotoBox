"use client";

/* ============================================================
   MOTOBOX ADMIN — Desporto: lista e ficha de uma colecção
   A forma comum às páginas Provas, Resultados, Pilotos e
   Equipas: números no topo, procura e filtros, a tabela, e a
   ficha completa numa gaveta lateral (formulário do esquema),
   com duplicar, apagar e "Ver no site".
   ============================================================ */

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useAdmin, slugify, type ColeccaoNome } from "@/lib/admin/store";
import {
  AccaoIcone, Aviso, Botao, BotaoLigacao, CabecalhoPagina, Cel, Confirmar, Etiqueta, Ferramentas, Gaveta,
  Linha, Painel, Procura, Seleccao, Tabela, Vazio, useAviso, usePaginacao,
} from "@/components/admin/kit";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Opcao, Valor } from "@/components/admin/editor/esquema";

export interface ColunaGestao<T> {
  cabecalho: string;
  celula: (item: T) => ReactNode;
  className?: string;
}

export interface FiltroGestao<T> {
  chave: string;
  etiqueta: string;
  opcoes: Opcao[];
  /** Valor do item para este filtro (por omissão, o campo com o mesmo nome). */
  valor?: (item: T) => string;
}

export interface ContextoFicha<T> {
  novo: boolean;
  /** O registo como está gravado (null num registo novo). */
  original: T | null;
  mudar: (campos: Partial<T>) => void;
}

export function ListaGestao<T extends { slug: string }>({
  coleccao, itens, titulo, descricao, icone, nomeItem, feminino = false, campoNome, prefixoPagina, endereco, prepararFicha, soNoPainel = [],
  colunas, filtros = [], procuraEm, ordenar, esquema, novo, validar, preparar, depoisDeGravar, extraFicha,
  numeros, editarInicial, novoInicial, filtrosIniciais, aviso, porPagina = 15, larguraGaveta = "max-w-3xl",
  vazio,
}: {
  coleccao: ColeccaoNome;
  /** Os registos desta página (já filtrados: ex. só as provas). */
  itens: T[];
  titulo: string;
  descricao: ReactNode;
  icone: ReactNode;
  /** Ex.: "prova" → "Nova prova", "Apagar prova". */
  nomeItem: string;
  feminino?: boolean;
  /** Campo de onde nasce o endereço num registo novo. */
  campoNome: "titulo" | "nome";
  /** Ex.: "/calendario" → "Ver no site" em /calendario/<slug>. */
  prefixoPagina?: string;
  /** Endereço sugerido num registo novo (por omissão, a partir do nome). */
  endereco?: (r: T) => string;
  /** Junta à ficha, ao abrir, campos que vivem fora da tabela (ex.: a fotografia de capa de uma equipa). */
  prepararFicha?: (it: T) => T;
  /** Campos da ficha que não vão para a base de dados (tratados em `depoisDeGravar`). */
  soNoPainel?: string[];
  colunas: ColunaGestao<T>[];
  filtros?: FiltroGestao<T>[];
  procuraEm: (item: T) => string;
  ordenar?: (a: T, b: T) => number;
  esquema: (rascunho: T, ctx: ContextoFicha<T>) => CampoEsquema[];
  novo: () => T;
  /** Devolve a frase do erro, ou null quando o registo se pode gravar. */
  validar?: (r: T, ctx: { novo: boolean }) => string | null;
  /** Último acerto antes de gravar (ex.: o vencedor a partir da tabela). */
  preparar?: (r: T) => T;
  /** Acções a seguir à gravação (ex.: actualizar os pilotos de uma equipa). */
  depoisDeGravar?: (r: T, original: T | null) => Promise<void> | void;
  /** Conteúdo extra no fim da ficha (ex.: os resultados de uma prova). */
  extraFicha?: (r: T, ctx: ContextoFicha<T>) => ReactNode;
  /** Fichas de números no topo da página. */
  numeros?: ReactNode;
  /** Abre logo a ficha deste registo (de uma ligação de outra página). */
  editarInicial?: string;
  /** Abre logo um registo novo com estes campos. */
  novoInicial?: Partial<T>;
  filtrosIniciais?: Record<string, string>;
  aviso?: ReactNode;
  porPagina?: number;
  larguraGaveta?: string;
  vazio?: { titulo: string; texto: string };
}) {
  const { pronto, criar, atualizar, remover } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const [procura, setProcura] = useState("");
  const [activos, setActivos] = useState<Record<string, string>>(filtrosIniciais ?? {});
  const [rascunho, setRascunho] = useState<T | null>(null);
  const [original, setOriginal] = useState<T | null>(null);
  const [aGravar, setAGravar] = useState(false);
  const [aApagar, setAApagar] = useState<T | null>(null);
  const [aFechar, setAFechar] = useState(false);

  const novoTexto = feminino ? "Nova" : "Novo";
  const um = feminino ? "uma" : "um";

  const ficha = (it: T): T => (prepararFicha ? prepararFicha(it) : it);

  /* ---------- Abrir a partir de uma ligação (?editar=… / ?nova=…) ---------- */
  // Acerto durante o desenho: quando o painel acaba de carregar os dados, abre a ficha pedida.
  const [inicialFeito, setInicialFeito] = useState(false);
  if (!inicialFeito && pronto) {
    setInicialFeito(true);
    const alvo = editarInicial ? itens.find((i) => i.slug === editarInicial) : undefined;
    if (alvo) { const f = ficha(alvo); setOriginal(f); setRascunho(structuredClone(f)); }
    else if (novoInicial) { setOriginal(null); setRascunho({ ...novo(), ...novoInicial }); }
  }

  const filtrados = useMemo(() => {
    const q = procura.trim().toLowerCase();
    let lista = itens.filter((it) => {
      if (q && !procuraEm(it).toLowerCase().includes(q)) return false;
      for (const f of filtros) {
        const v = activos[f.chave];
        if (!v) continue;
        const valor = f.valor ? f.valor(it) : String((it as Record<string, unknown>)[f.chave] ?? "");
        if (valor !== v) return false;
      }
      return true;
    });
    if (ordenar) lista = [...lista].sort(ordenar);
    return lista;
  }, [itens, procura, activos, filtros, procuraEm, ordenar]);

  const { fatia, controlos } = usePaginacao(filtrados, porPagina);

  const eNovo = rascunho !== null && original === null;
  const sujo = rascunho !== null && (eNovo || JSON.stringify(rascunho) !== JSON.stringify(original));

  const abrir = (it: T) => { const f = ficha(it); setOriginal(f); setRascunho(structuredClone(f)); };
  const abrirNovo = () => { setOriginal(null); setRascunho(novo()); };
  const duplicar = (it: T) => {
    const base = slugify(`${it.slug}-copia`);
    let slug = base;
    for (let n = 2; itens.some((i) => i.slug === slug); n++) slug = `${base}-${n}`;
    const nomeAntes = String((it as Record<string, unknown>)[campoNome] ?? "");
    setOriginal(null);
    setRascunho({ ...structuredClone(it), slug, [campoNome]: `${nomeAntes} (cópia)` });
  };
  const fecharJa = useCallback(() => { setRascunho(null); setOriginal(null); setAFechar(false); }, []);
  // Com a pergunta "Sair sem gravar?" aberta, o Escape fecha só a pergunta.
  const fechar = useCallback(() => {
    if (aFechar) return;
    if (sujo) setAFechar(true); else fecharJa();
  }, [sujo, fecharJa, aFechar]);

  const enderecoDe = (r: T) => (endereco ? endereco(r) : slugify(String((r as Record<string, unknown>)[campoNome] ?? "")));

  const mudar = (campos: Partial<T>) => setRascunho((r) => {
    if (!r) return r;
    let prox = { ...r, ...campos };
    if (eNovo && (!r.slug || r.slug === enderecoDe(r)) && !("slug" in campos)) prox = { ...prox, slug: enderecoDe(prox) };
    return prox;
  });

  /** O formulário muda o objecto inteiro; num registo novo o endereço acompanha o nome. */
  const aoMudarFormulario = (v: Valor) => {
    setRascunho((r) => {
      if (!r) return r;
      let prox = v as unknown as T;
      if (eNovo) {
        const antes = enderecoDe(r);
        const agora = enderecoDe(prox);
        if (antes !== agora && (!r.slug || r.slug === antes) && prox.slug === r.slug) prox = { ...prox, slug: agora };
      }
      return prox;
    });
  };

  const gravar = async () => {
    if (!rascunho || aGravar) return;
    let registo = preparar ? preparar(rascunho) : rascunho;
    if (!registo.slug.trim()) registo = { ...registo, slug: enderecoDe(registo) };
    if (!registo.slug) { mostrar(`Escreva o ${campoNome === "titulo" ? "título" : "nome"} antes de gravar.`, "erro"); return; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(registo.slug)) {
      mostrar("O endereço só pode ter letras minúsculas, números e hífenes.", "erro");
      return;
    }
    const erro = validar?.(registo, { novo: eNovo });
    if (erro) { mostrar(erro, "erro"); return; }
    const outro = itens.some((i) => i.slug === registo.slug && i.slug !== original?.slug);
    if (outro) { mostrar(`Já existe ${um} ${nomeItem} com o endereço "${registo.slug}". Mude o endereço.`, "erro"); return; }

    setAGravar(true);
    const linha = { ...(registo as unknown as Record<string, unknown>) };
    for (const k of soNoPainel) delete linha[k];
    const falha = original
      ? await atualizar(coleccao, original.slug, linha)
      : await criar(coleccao, linha);
    if (falha) { setAGravar(false); mostrar(falha, "erro"); return; }
    try {
      await depoisDeGravar?.(registo, original);
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Gravado, mas falhou um passo seguinte.", "erro");
    }
    setAGravar(false);
    mostrar(original ? "Alterações gravadas." : `${nomeItem.charAt(0).toUpperCase() + nomeItem.slice(1)} ${feminino ? "criada" : "criado"}.`);
    fecharJa();
  };

  const ctx: ContextoFicha<T> | null = rascunho ? { novo: eNovo, original, mudar } : null;
  const nomeRascunho = rascunho ? String((rascunho as Record<string, unknown>)[campoNome] ?? "") : "";
  const filtrosActivos = procura || Object.values(activos).some(Boolean);

  return (
    <>
      <CabecalhoPagina
        sobretitulo="Desporto"
        titulo={titulo}
        descricao={descricao}
        icone={icone}
        accoes={
          <Botao variante="primario" onClick={abrirNovo}>
            <Plus className="size-4" aria-hidden /> {novoTexto} {nomeItem}
          </Botao>
        }
      />

      {aviso && <div className="mb-[var(--intervalo)]">{aviso}</div>}
      {numeros && <div className="mb-[var(--intervalo)]">{numeros}</div>}

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder={`Procurar ${nomeItem}…`} />
          {filtros.map((f) => (
            <Seleccao
              key={f.chave}
              valor={activos[f.chave] ?? ""}
              onChange={(v) => setActivos((a) => ({ ...a, [f.chave]: v }))}
              opcoes={[{ valor: "", nome: f.etiqueta }, ...f.opcoes]}
              className="!w-auto min-w-[11rem] max-w-full"
              aria-label={f.etiqueta}
            />
          ))}
          {filtrosActivos && (
            <Botao variante="fantasma" onClick={() => { setProcura(""); setActivos({}); }}>Limpar filtros</Botao>
          )}
        </Ferramentas>

        {itens.length === 0 && pronto ? (
          <Vazio titulo={vazio?.titulo ?? `Ainda não há ${nomeItem}s`} accao={<Botao variante="primario" onClick={abrirNovo}>{novoTexto} {nomeItem}</Botao>}>
            {vazio?.texto}
          </Vazio>
        ) : (
          <Tabela cabecalhos={[...colunas.map((c) => c.cabecalho), ""]} vazio={fatia.length === 0}>
            {fatia.map((it) => (
              <Linha key={it.slug} onClick={() => abrir(it)}>
                {colunas.map((c, i) => <Cel key={i} className={c.className}>{c.celula(it)}</Cel>)}
                <Cel className="w-[8.5rem]">
                  <div className="flex justify-end gap-1.5">
                    <AccaoIcone titulo={`Editar ${nomeItem}`} onClick={() => abrir(it)}><Pencil className="size-3.5" aria-hidden /></AccaoIcone>
                    <AccaoIcone titulo={`Duplicar ${nomeItem}`} onClick={() => duplicar(it)}><Copy className="size-3.5" aria-hidden /></AccaoIcone>
                    <AccaoIcone titulo={`Apagar ${nomeItem}`} tom="perigo" onClick={() => setAApagar(it)}><Trash2 className="size-3.5" aria-hidden /></AccaoIcone>
                  </div>
                </Cel>
              </Linha>
            ))}
          </Tabela>
        )}
        {controlos}
      </Painel>

      <Gaveta
        aberta={rascunho !== null}
        aoFechar={fechar}
        largura={larguraGaveta}
        titulo={eNovo ? (nomeRascunho || `${novoTexto} ${nomeItem}`) : nomeRascunho || nomeItem}
        descricao={
          <span className="flex flex-wrap items-center gap-2">
            {eNovo ? <Etiqueta tom="ouro">Por gravar</Etiqueta> : sujo ? <Etiqueta tom="ouro">Alterações por gravar</Etiqueta> : <Etiqueta>Gravado</Etiqueta>}
            {prefixoPagina && rascunho?.slug && !eNovo && <span className="text-white/70">{prefixoPagina}/{rascunho.slug}</span>}
          </span>
        }
        rodape={
          <>
            {prefixoPagina && original && (
              <BotaoLigacao href={`${prefixoPagina}/${original.slug}`} externo variante="fantasma" className="mr-auto">
                <ExternalLink className="size-4" aria-hidden /> Ver no site
              </BotaoLigacao>
            )}
            <Botao variante="fantasma" onClick={fechar}>{sujo ? "Cancelar" : "Fechar"}</Botao>
            <Botao variante="primario" onClick={gravar} disabled={aGravar || !sujo}>{aGravar ? "A gravar…" : "Gravar"}</Botao>
          </>
        }
      >
        {rascunho && ctx && (
          <div className="space-y-6">
            <Formulario esquema={esquema(rascunho, ctx)} valor={rascunho as unknown as Valor} onChange={aoMudarFormulario} />
            {extraFicha?.(rascunho, ctx)}
          </div>
        )}
      </Gaveta>

      <Confirmar
        aberta={aApagar !== null}
        aoFechar={() => setAApagar(null)}
        perigo
        textoConfirmar="Apagar"
        titulo={`Apagar ${aApagar ? `"${String((aApagar as Record<string, unknown>)[campoNome] ?? aApagar.slug)}"` : nomeItem}?`}
        mensagem={`Sai do site no momento seguinte e não se desfaz no painel. Para o esconder sem apagar, desligue "Publicado no site" na ficha.`}
        aoConfirmar={async () => {
          if (!aApagar) return;
          const falha = await remover(coleccao, aApagar.slug);
          mostrar(falha ?? "Apagado.", falha ? "erro" : "ok");
        }}
      />
      <Confirmar
        aberta={aFechar}
        aoFechar={() => setAFechar(false)}
        perigo
        textoConfirmar="Sair sem gravar"
        titulo="Sair sem gravar?"
        mensagem="As alterações desta ficha perdem-se."
        aoConfirmar={fecharJa}
      />
      {elemento}
    </>
  );
}

/** Aviso do modo local, igual em todas as páginas de Desporto. */
export function AvisoModoLocal() {
  const { origem } = useAdmin();
  if (origem !== "local") return null;
  return (
    <Aviso tom="atencao" titulo="Modo de demonstração">
      Sem base de dados ligada, as alterações ficam só neste navegador e o site público continua a mostrar os dados de origem.
    </Aviso>
  );
}
