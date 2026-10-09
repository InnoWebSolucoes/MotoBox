"use client";

/* ============================================================
   MOTOBOX ADMIN — Editor de um grupo de itens
   Lista à esquerda (procurar, reordenar, criar) e o item
   escolhido à direita, com o formulário do esquema. Usado nas
   rotas, nos perfis dos clubes, nas modalidades…

     <EditorGrupo
       grupo="rotas" nomeItem="rota" prefixoPagina="/rotas"
       campoChave="slug" esquema={ESQUEMA} novo={() => ({ … })}
       resumo={(d) => ({ titulo: d.nome, subtitulo: d.regiao })}
     />

   A chave de cada item é o seu endereço (ex.: /rotas/<chave>);
   com `campoChave`, a chave acompanha esse campo dos dados.
   ============================================================ */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { comBase } from "@/lib/base";
import { useAdmin, slugify } from "@/lib/admin/store";
import type { Documento, RespostaGrupo } from "@/lib/conteudo/tipos";
import { CHAVE_VALIDA } from "@/lib/conteudo/tipos";
import {
  AccaoIcone, Aviso, Botao, BotaoLigacao, Carregando, Confirmar, Etiqueta, Procura, Seta, Vazio, useAviso,
} from "../kit";
import { Formulario } from "./Formulario";
import { EtiquetaOrigem, useAvisoSaida } from "./EditorDoc";
import type { CampoEsquema, Valor } from "./esquema";

async function buscarGrupo<T>(grupo: string): Promise<RespostaGrupo<T>> {
  const r = await fetch(comBase(`/api/admin/conteudo?grupo=${encodeURIComponent(grupo)}`), { cache: "no-store" });
  const j = await r.json();
  if (!r.ok) throw new Error(j.erro ?? "Falha ao ler.");
  return j;
}

export function EditorGrupo<T extends Valor = Valor>({
  grupo, nomeItem, esquema, novo, resumo, campoChave, prefixoPagina, children, permitirCriar = true,
  permitirApagar = true, chavesFixas, feminino = false,
}: {
  grupo: string;
  /** Ex.: "rota" → "Nova rota". */
  nomeItem: string;
  esquema?: CampoEsquema[];
  /** Dados de um item novo. */
  novo?: () => T;
  /** Texto da linha de cada item na lista. */
  resumo: (dados: T, chave: string) => { titulo: string; subtitulo?: string };
  /** Campo dos dados que é também a chave (ex.: "slug"). */
  campoChave?: string;
  /** Ex.: "/rotas" → botão "Ver no site" em /rotas/<chave>. */
  prefixoPagina?: string;
  /** Editor próprio do item (em vez do esquema, ou a seguir a ele). */
  children?: (dados: T, mudar: (d: T) => void, chave: string) => ReactNode;
  permitirCriar?: boolean;
  permitirApagar?: boolean;
  /** Chaves que existem fora deste grupo e não se escolhem à mão (ex.: os slugs dos clubes). */
  chavesFixas?: { chave: string; nome: string }[];
  /** Género do nome do item, para os textos ("uma rota", "um perfil"). */
  feminino?: boolean;
}) {
  const { registar } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const [resposta, setResposta] = useState<RespostaGrupo<T> | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<T | null>(null);
  const [chaveRascunho, setChaveRascunho] = useState("");
  const [eNovo, setENovo] = useState(false);
  const [procura, setProcura] = useState("");
  const [aGravar, setAGravar] = useState(false);
  const [aApagar, setAApagar] = useState(false);
  const [aRepor, setARepor] = useState(false);

  const ler = useCallback(async (): Promise<RespostaGrupo<T> | null> => {
    try {
      const j = await buscarGrupo<T>(grupo);
      setResposta(j);
      setErro(null);
      return j;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao ler.");
      return null;
    }
  }, [grupo]);

  useEffect(() => {
    let vivo = true;
    buscarGrupo<T>(grupo).then(
      (j) => { if (vivo) setResposta(j); },
      (e) => { if (vivo) setErro(e instanceof Error ? e.message : "Falha ao ler."); },
    );
    return () => { vivo = false; };
  }, [grupo]);

  const itens = useMemo(() => resposta?.itens ?? [], [resposta]);
  const actual: Documento<T> | undefined = itens.find((i) => i.chave === escolhido);

  const sujo = useMemo(() => {
    if (!rascunho) return false;
    if (eNovo) return true;
    return JSON.stringify(rascunho) !== JSON.stringify(actual?.dados ?? {}) || chaveRascunho !== escolhido;
  }, [rascunho, actual, eNovo, chaveRascunho, escolhido]);
  useAvisoSaida(sujo);

  const abrir = (d: Documento<T>) => {
    if (sujo && !window.confirm("Há alterações por gravar neste item. Sair sem gravar?")) return;
    setEscolhido(d.chave);
    setChaveRascunho(d.chave);
    setRascunho(structuredClone(d.dados ?? {}) as T);
    setENovo(false);
  };

  const criar = () => {
    if (sujo && !window.confirm("Há alterações por gravar neste item. Sair sem gravar?")) return;
    setEscolhido(null);
    setChaveRascunho("");
    setRascunho((novo ? novo() : {}) as T);
    setENovo(true);
  };

  /** Chave a gravar: o campo-chave dos dados, ou a escrita à mão. */
  const chaveFinal = (campoChave && rascunho ? String(rascunho[campoChave] ?? "") : chaveRascunho).trim();

  const mudarRascunho = (d: T) => {
    // Num item novo, o endereço nasce do nome enquanto ninguém o mexer.
    if (eNovo && campoChave) {
      const nome = String(d.nome ?? d.titulo ?? "");
      const antes = rascunho ? String(rascunho.nome ?? rascunho.titulo ?? "") : "";
      const chaveActual = String(d[campoChave] ?? "");
      if (nome !== antes && (chaveActual === "" || chaveActual === slugify(antes))) {
        d = { ...d, [campoChave]: slugify(nome) };
      }
    }
    setRascunho(d);
  };

  const gravar = async () => {
    if (!rascunho) return;
    const chave = chaveFinal;
    if (!chave || !CHAVE_VALIDA.test(chave)) {
      mostrar("O endereço só pode ter letras minúsculas, números e hífenes (ex.: serra-da-leba).", "erro");
      return;
    }
    if ((eNovo || chave !== escolhido) && itens.some((i) => i.chave === chave)) {
      mostrar("Já existe um item com este endereço. Escolha outro.", "erro");
      return;
    }
    setAGravar(true);
    try {
      const r = await fetch(comBase("/api/admin/conteudo"), {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grupo, chave, dados: rascunho,
          titulo: resumo(rascunho, chave).titulo,
          chaveAnterior: !eNovo && escolhido && escolhido !== chave ? escolhido : undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro ?? "Falha ao gravar.");
      registar(eNovo ? "Criou" : "Editou", nomeItem, resumo(rascunho, chave).titulo);
      const nova = await ler();
      const doc = nova?.itens.find((i) => i.chave === chave);
      if (doc) { setEscolhido(chave); setChaveRascunho(chave); setRascunho(structuredClone(doc.dados) as T); }
      setENovo(false);
      mostrar("Gravado. O site já mostra as alterações.");
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Falha ao gravar.", "erro");
    } finally {
      setAGravar(false);
    }
  };

  const apagar = async () => {
    if (!escolhido) return;
    try {
      const r = await fetch(comBase(`/api/admin/conteudo?grupo=${encodeURIComponent(grupo)}&chave=${encodeURIComponent(escolhido)}`), { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro ?? "Falha ao apagar.");
      registar("Apagou", nomeItem, actual?.titulo ?? escolhido);
      setEscolhido(null); setRascunho(null);
      await ler();
      mostrar("Apagado do site.");
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Falha ao apagar.", "erro");
    }
  };

  const repor = async () => {
    if (!escolhido) return;
    try {
      const r = await fetch(comBase(`/api/admin/conteudo?grupo=${encodeURIComponent(grupo)}&chave=${encodeURIComponent(escolhido)}&repor=1`), { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro ?? "Falha ao repor.");
      const nova = await ler();
      const doc = nova?.itens.find((i) => i.chave === escolhido);
      if (doc) setRascunho(structuredClone(doc.dados) as T);
      mostrar("Reposto o conteúdo de origem.");
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Falha ao repor.", "erro");
    }
  };

  const mover = async (chave: string, d: -1 | 1) => {
    const ordem = itens.map((i) => i.chave);
    const i = ordem.indexOf(chave);
    const j = i + d;
    if (i < 0 || j < 0 || j >= ordem.length) return;
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
    setResposta((r) => (r ? { ...r, itens: ordem.map((c) => r.itens.find((x) => x.chave === c)!) } : r));
    const r = await fetch(comBase("/api/admin/conteudo"), {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grupo, ordem }),
    });
    if (!r.ok) { mostrar("Falha ao gravar a ordem.", "erro"); ler(); }
  };

  if (erro) return <Aviso tom="erro" titulo="Não foi possível abrir esta lista" accoes={<Botao onClick={ler}>Tentar outra vez</Botao>}>{erro}</Aviso>;
  if (!resposta) return <Carregando />;

  const q = procura.trim().toLowerCase();
  const visiveis = itens.filter((i) => {
    if (!q) return true;
    const r = resumo(i.dados, i.chave);
    return `${r.titulo} ${r.subtitulo ?? ""} ${i.chave}`.toLowerCase().includes(q);
  });

  return (
    <div className="grid items-start gap-[var(--intervalo)] xl:grid-cols-[22rem_minmax(0,1fr)]">
      {/* ---------- Lista ---------- */}
      <aside className="painel painel-escuro p-4 xl:sticky xl:top-[4.5rem] xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">
        {resposta.local && (
          <div className="mb-3"><Aviso tom="atencao">Modo local: as gravações ficam neste computador.</Aviso></div>
        )}
        <div className="flex gap-2">
          <Procura valor={procura} onChange={setProcura} placeholder={`Procurar ${nomeItem}…`} />
          {permitirCriar && <Botao variante="primario" onClick={criar} aria-label={`Criar ${nomeItem}`}>+ {feminino ? "Nova" : "Novo"}</Botao>}
        </div>
        <ol className="mt-3 space-y-1">
          {visiveis.map((d) => {
            const r = resumo(d.dados, d.chave);
            const sel = d.chave === escolhido && !eNovo;
            return (
              <li key={d.chave} className={`flex items-center gap-1 rounded-[var(--raio)] pr-1 transition-colors ${sel ? "bg-mb-red/25" : "hover:bg-white/[0.06]"}`}>
                <button type="button" onClick={() => abrir(d)} aria-current={sel ? "true" : undefined}
                  className="min-w-0 flex-1 px-3 py-2.5 text-left">
                  <span className="block truncate text-sm font-medium text-white">{r.titulo || d.chave}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-white/50">
                    <span className="truncate">{r.subtitulo ?? d.chave}</span>
                    {d.origem === "base" && <span aria-label="editado" className="size-1.5 shrink-0 rounded-full bg-[#4ade80]" />}
                  </span>
                </button>
                {!q && (
                  <span className="flex shrink-0 flex-col">
                    <button type="button" aria-label={`Subir ${r.titulo}`} onClick={() => mover(d.chave, -1)} className="rounded p-0.5 text-white/40 hover:text-white"><Seta para="cima" /></button>
                    <button type="button" aria-label={`Descer ${r.titulo}`} onClick={() => mover(d.chave, 1)} className="rounded p-0.5 text-white/40 hover:text-white"><Seta para="baixo" /></button>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {visiveis.length === 0 && <p className="px-2 py-6 text-center text-sm text-white/50">Nada encontrado.</p>}
        <p className="mt-3 px-1 text-xs text-white/40">
          {itens.length} {itens.length === 1 ? nomeItem : `${nomeItem}s`} · as setas mudam a ordem no site
        </p>
      </aside>

      {/* ---------- Item ---------- */}
      <section className="min-w-0">
        {!rascunho ? (
          <div className="painel painel-escuro p-6">
            <Vazio titulo={`Escolha ${feminino ? "uma" : "um"} ${nomeItem} na lista`}
              accao={permitirCriar ? <Botao variante="primario" onClick={criar}>Criar {nomeItem}</Botao> : undefined}>
              Tudo o que gravar aparece no site no momento seguinte.
            </Vazio>
          </div>
        ) : (
          <div className="space-y-[var(--intervalo)]">
            <div className="painel painel-escuro sticky top-[4.5rem] z-20 flex flex-wrap items-center justify-between gap-3 !bg-[#2c2c33]/90 px-4 py-3 shadow-lg backdrop-blur-xl">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{resumo(rascunho, chaveFinal).titulo || (eNovo ? `${feminino ? "Nova" : "Novo"} ${nomeItem}` : chaveFinal)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {eNovo ? <Etiqueta tom="ouro">Por gravar</Etiqueta> : actual && <EtiquetaOrigem origem={actual.origem} atualizado={actual.atualizado} />}
                  {sujo && !eNovo && <Etiqueta tom="ouro">Alterações por gravar</Etiqueta>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {prefixoPagina && !eNovo && escolhido && (
                  <BotaoLigacao href={`${prefixoPagina}/${escolhido}`} externo variante="fantasma">Ver no site</BotaoLigacao>
                )}
                {!eNovo && actual?.origem === "base" && <Botao variante="fantasma" onClick={() => setARepor(true)}>Repor o original</Botao>}
                {!eNovo && permitirApagar && <Botao variante="fantasma" onClick={() => setAApagar(true)}>Apagar</Botao>}
                <Botao variante="fantasma" disabled={!sujo} onClick={() => (eNovo ? (setRascunho(null), setENovo(false)) : actual && abrir(actual))}>
                  {eNovo ? "Cancelar" : "Desfazer"}
                </Botao>
                <Botao variante="primario" disabled={!sujo || aGravar} onClick={gravar}>{aGravar ? "A gravar…" : "Gravar"}</Botao>
              </div>
            </div>

            <div className="painel painel-escuro space-y-5 p-5 md:p-6">
              {!campoChave && (
                chavesFixas ? (
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-medium text-white/75">Pertence a</span>
                    <select value={chaveRascunho} onChange={(e) => setChaveRascunho(e.target.value)} disabled={!eNovo}
                      className="w-full rounded-[var(--raio)] border border-white/10 bg-black/25 px-3 py-2.5 text-[15px] text-white outline-none focus:border-mb-red disabled:opacity-60">
                      <option value="" className="bg-[#2c2c33]">Escolher…</option>
                      {chavesFixas.filter((c) => !eNovo || !itens.some((i) => i.chave === c.chave)).map((c) => (
                        <option key={c.chave} value={c.chave} className="bg-[#2c2c33]">{c.nome}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-medium text-white/75">Endereço</span>
                    <span className="flex items-center rounded-[var(--raio)] border border-white/10 bg-black/25 focus-within:border-mb-red">
                      {prefixoPagina && <span className="shrink-0 pl-3 text-[15px] text-white/40">{prefixoPagina}/</span>}
                      <input value={chaveRascunho} onChange={(e) => setChaveRascunho(slugify(e.target.value))}
                        className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-[15px] text-white outline-none" />
                    </span>
                  </label>
                )
              )}
              {esquema && <Formulario esquema={esquema} valor={rascunho} onChange={(v) => mudarRascunho(v as T)} />}
              {children?.(rascunho, (d) => mudarRascunho(d), chaveFinal)}
            </div>
          </div>
        )}
      </section>

      <Confirmar
        aberta={aApagar} aoFechar={() => setAApagar(false)} aoConfirmar={apagar} perigo textoConfirmar="Apagar"
        titulo={`Apagar ${actual ? `"${resumo(actual.dados, actual.chave).titulo}"` : nomeItem}?`}
        mensagem={`Sai do site no momento seguinte. Esta acção não se desfaz no painel.`}
      />
      <Confirmar
        aberta={aRepor} aoFechar={() => setARepor(false)} aoConfirmar={repor} perigo textoConfirmar="Repor"
        titulo="Repor o conteúdo de origem?"
        mensagem="Este item volta ao conteúdo original. As alterações gravadas nele perdem-se."
      />
      {elemento}
    </div>
  );
}

/** Pequeno botão de acção (re-exportado para os editores próprios). */
export { AccaoIcone };
