"use client";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA
   A equipa cola o material que recebe (mensagens, cartazes,
   listas de preços, resultados, PDF, fotografias) e o Claude
   devolve propostas de registos. Cada proposta é revista aqui
   e guardada pelo mesmo caminho que os formulários do painel,
   por isso só fica marcada como guardada quando a base de
   dados confirma.
   ============================================================ */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAdmin, type ColeccaoNome } from "@/lib/admin/store";
import type { Proposta, ResultadoOrganizador } from "@/lib/admin/organizador";
import { formatKz } from "@/lib/data";
import { CabecalhoPagina, Painel, Campo, Input, Area, useAviso } from "@/components/admin/kit";

const CHAVE_RASCUNHO = "motobox-organizador-v1";

/** Tipos de ficheiro que o Claude lê directamente. */
const ACEITES = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
/** Tamanho máximo somado dos anexos, antes da codificação. */
const LIMITE_BYTES = 3 * 1024 * 1024;

const ROTULO: Record<string, { nome: string; href: string }> = {
  equipas: { nome: "Equipa", href: "/admin/equipas" },
  pilotos: { nome: "Piloto", href: "/admin/pilotos" },
  eventos: { nome: "Evento", href: "/admin/eventos" },
  bilhetes: { nome: "Bilhetes", href: "/admin/bilheteira" },
  corridas: { nome: "Resultado", href: "/admin/corridas" },
  noticias: { nome: "Notícia", href: "/admin/noticias" },
  patrocinadores: { nome: "Patrocinador", href: "/admin/patrocinadores" },
  videos: { nome: "Vídeo", href: "/admin/videos" },
};

/** Campos de texto editáveis em cada cartão, pela ordem em que aparecem. */
const CAMPOS: Record<string, { chave: string; etiqueta: string; longo?: boolean; numero?: boolean; data?: boolean }[]> = {
  equipas: [
    { chave: "nome", etiqueta: "Nome" }, { chave: "base", etiqueta: "Base" },
    { chave: "chefe", etiqueta: "Chefe de equipa" }, { chave: "fundacao", etiqueta: "Fundação", numero: true },
    { chave: "descricao", etiqueta: "Descrição", longo: true },
  ],
  pilotos: [
    { chave: "nome", etiqueta: "Nome" }, { chave: "numero", etiqueta: "Número", numero: true },
    { chave: "equipa", etiqueta: "Equipa" }, { chave: "categoria", etiqueta: "Categoria" },
    { chave: "mota", etiqueta: "Mota" }, { chave: "idade", etiqueta: "Idade", numero: true },
    { chave: "bio", etiqueta: "Biografia", longo: true },
  ],
  eventos: [
    { chave: "titulo", etiqueta: "Título" }, { chave: "circuito", etiqueta: "Circuito" },
    { chave: "localidade", etiqueta: "Localidade" },
    { chave: "dataInicio", etiqueta: "Início", data: true }, { chave: "dataFim", etiqueta: "Fim", data: true },
    { chave: "resumo", etiqueta: "Resumo", longo: true },
  ],
  corridas: [
    { chave: "nome", etiqueta: "Nome" }, { chave: "categoria", etiqueta: "Categoria" },
    { chave: "data", etiqueta: "Data", data: true }, { chave: "circuito", etiqueta: "Circuito" },
  ],
  noticias: [
    { chave: "titulo", etiqueta: "Título" }, { chave: "data", etiqueta: "Data", data: true },
    { chave: "resumo", etiqueta: "Resumo", longo: true },
  ],
  patrocinadores: [
    { chave: "nome", etiqueta: "Nome" }, { chave: "setor", etiqueta: "Setor" },
    { chave: "website", etiqueta: "Website" }, { chave: "descricao", etiqueta: "Descrição", longo: true },
  ],
  videos: [
    { chave: "titulo", etiqueta: "Título" }, { chave: "data", etiqueta: "Data", data: true },
    { chave: "videoId", etiqueta: "ID do YouTube" }, { chave: "descricao", etiqueta: "Descrição", longo: true },
  ],
};

type Estado = "por-guardar" | "a-guardar" | "guardado" | "descartado";
interface Cartao { proposta: Proposta; estado: Estado; erro?: string }

interface Anexo { nome: string; tipo: string; dados: string; bytes: number }

function lerFicheiro(f: File): Promise<Anexo> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const url = String(leitor.result);
      resolve({ nome: f.name, tipo: f.type, dados: url.slice(url.indexOf(",") + 1), bytes: f.size });
    };
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(f);
  });
}

function titulo(p: Proposta): string {
  if (p.tipo === "bilhetes") return p.eventoTitulo;
  const r = p.registo as unknown as Record<string, unknown>;
  return String(r.titulo ?? r.nome ?? "");
}

export default function OrganizadorPage() {
  const { estado, criar, atualizar } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const entrada = useRef<HTMLInputElement>(null);

  const [texto, setTexto] = useState("");
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [aAnalisar, setAAnalisar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resumo, setResumo] = useState("");
  const [pendentes, setPendentes] = useState<{ texto: string; feito: boolean }[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);

  // Recupera a última análise, para não se perder ao mudar de página.
  // Só pode acontecer depois de montar: o localStorage não existe no
  // servidor e lê-lo durante a renderização quebraria a hidratação.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CHAVE_RASCUNHO);
      if (!guardado) return;
      const d = JSON.parse(guardado) as { resumo: string; pendentes: typeof pendentes; cartoes: Cartao[] };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResumo(d.resumo); setPendentes(d.pendentes); setCartoes(d.cartoes);
    } catch { /* sem armazenamento */ }
  }, []);

  useEffect(() => {
    try {
      if (cartoes.length === 0 && pendentes.length === 0) localStorage.removeItem(CHAVE_RASCUNHO);
      else localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ resumo, pendentes, cartoes }));
    } catch { /* sem armazenamento */ }
  }, [resumo, pendentes, cartoes]);

  const bytes = anexos.reduce((s, a) => s + a.bytes, 0);

  const juntar = async (lista: FileList | null) => {
    if (!lista) return;
    const novos = await Promise.all(Array.from(lista).map(lerFicheiro));
    const total = bytes + novos.reduce((s, a) => s + a.bytes, 0);
    if (total > LIMITE_BYTES) {
      mostrar("Os anexos passam de 3 MB. Envie menos ficheiros de cada vez.", "erro");
      return;
    }
    setAnexos((a) => [...a, ...novos]);
  };

  const analisar = async () => {
    if (!texto.trim() && anexos.length === 0) {
      mostrar("Cole algum texto ou anexe um ficheiro.", "erro");
      return;
    }
    setAAnalisar(true); setErro(null);
    try {
      const r = await fetch("/api/admin/organizador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, ficheiros: anexos.map(({ nome, tipo, dados }) => ({ nome, tipo, dados })) }),
      });
      const j = await r.json().catch(() => ({ erro: `Erro ${r.status}` }));
      if (!r.ok) { setErro(String(j.erro ?? `Erro ${r.status}`)); return; }
      const d = j as ResultadoOrganizador;
      setResumo(d.resumo);
      setPendentes(d.pendentes.map((t) => ({ texto: t, feito: false })));
      setCartoes(d.propostas.map((p) => ({ proposta: p, estado: "por-guardar" })));
      setTexto(""); setAnexos([]);
      if (d.propostas.length === 0) mostrar("Nada para criar neste material.");
    } catch {
      setErro("Não foi possível contactar o servidor. Verifique a ligação.");
    } finally {
      setAAnalisar(false);
    }
  };

  const alterar = (i: number, campos: Record<string, unknown>) =>
    setCartoes((cs) => cs.map((c, j) => {
      if (j !== i || c.proposta.tipo !== "criar") return c;
      return { ...c, proposta: { ...c.proposta, registo: { ...c.proposta.registo, ...campos } } as Proposta };
    }));

  const marcar = (i: number, e: Estado, erroTexto?: string) =>
    setCartoes((cs) => cs.map((c, j) => (j === i ? { ...c, estado: e, erro: erroTexto } : c)));

  const guardar = async (i: number): Promise<boolean> => {
    const c = cartoes[i];
    if (!c || c.estado === "guardado" || c.estado === "a-guardar") return true;
    marcar(i, "a-guardar");
    const p = c.proposta;
    let falha: string | null;
    if (p.tipo === "bilhetes") {
      const actuais = estado.eventos.find((e) => e.slug === p.eventoSlug)?.bilhetes ?? [];
      falha = await atualizar("eventos", p.eventoSlug, { bilhetes: [...actuais, ...p.bilhetes] });
    } else {
      falha = await criar(p.coleccao as ColeccaoNome, p.registo as unknown as Record<string, unknown>);
    }
    if (falha) { marcar(i, "por-guardar", falha); return false; }
    marcar(i, "guardado");
    return true;
  };

  // A ordem das propostas já põe as equipas antes dos pilotos que as usam.
  const guardarTudo = async () => {
    let falhas = 0;
    for (let i = 0; i < cartoes.length; i++) {
      if (cartoes[i].estado !== "por-guardar") continue;
      if (!(await guardar(i))) falhas++;
    }
    mostrar(falhas ? `${falhas} proposta(s) não foram guardadas. Veja o motivo em cada uma.` : "Tudo guardado.", falhas ? "erro" : "ok");
  };

  const porGuardar = cartoes.filter((c) => c.estado === "por-guardar").length;

  const limpar = () => { setResumo(""); setPendentes([]); setCartoes([]); };

  const copiarPendentes = async () => {
    const lista = pendentes.filter((p) => !p.feito).map((p) => `• ${p.texto}`).join("\n");
    try { await navigator.clipboard.writeText(lista); mostrar("Lista copiada."); }
    catch { mostrar("Não foi possível copiar.", "erro"); }
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Organizador IA"
        descricao="Cole mensagens, cartazes, listas de preços ou resultados. O Claude arruma tudo em eventos, bilhetes, pilotos, equipas e notícias prontos a rever e guardar."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Painel titulo="Material" descricao="Texto solto, fotografias de cartazes ou PDF. Não precisa de estar arrumado.">
          <div className="space-y-4">
            <Area
              rows={12} value={texto} onChange={(e) => setTexto(e.target.value)}
              placeholder={"Exemplo:\nGP do Lubango dia 14 e 15 de Novembro na Tundavala. Bilhete geral 3 mil, bancada 7500, VIP 20 mil com almoço.\nNovo piloto: Mauro Kapita, 19 anos, #27, MX2, corre pela Tundavala MX numa Yamaha YZ250F."}
            />

            <div>
              <input ref={entrada} type="file" accept={ACEITES} multiple className="hidden"
                onChange={(e) => { void juntar(e.target.files); e.target.value = ""; }} />
              <button type="button" onClick={() => entrada.current?.click()}
                className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-ink-800">
                Anexar imagem ou PDF
              </button>
              {anexos.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {anexos.map((a, i) => (
                    <li key={`${a.nome}-${i}`} className="flex items-center gap-2 border border-ink-700 px-3 py-2 text-xs text-ink-300">
                      <span className="flex-1 truncate">{a.nome}</span>
                      <span className="tabular-nums text-ink-500">{Math.ceil(a.bytes / 1024)} KB</span>
                      <button type="button" onClick={() => setAnexos((l) => l.filter((_, j) => j !== i))}
                        className="text-ink-400 hover:text-mb-red" aria-label={`Remover ${a.nome}`}>
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {erro && <p role="alert" className="border-l-2 border-mb-red pl-3 text-sm text-mb-red">{erro}</p>}

            <button type="button" onClick={analisar} disabled={aAnalisar}
              className="h-11 w-full bg-mb-red px-5 font-display text-sm uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark disabled:opacity-60">
              {aAnalisar ? "A analisar… pode demorar um minuto" : "Organizar com IA"}
            </button>
            <p className="text-xs text-ink-500">
              Nada é publicado sem a sua confirmação. As propostas aparecem ao lado para rever.
            </p>
          </div>
        </Painel>

        <div className="space-y-6">
          {resumo && (
            <Painel titulo="O que foi encontrado"
              accoes={
                <div className="flex gap-2">
                  {porGuardar > 0 && (
                    <button type="button" onClick={guardarTudo}
                      className="h-9 bg-mb-red px-4 font-display text-[11px] uppercase tracking-wider text-white hover:bg-mb-red-dark">
                      Guardar tudo ({porGuardar})
                    </button>
                  )}
                  <button type="button" onClick={limpar}
                    className="h-9 border border-ink-600 px-3 font-display text-[11px] uppercase tracking-wider text-ink-300 hover:text-white">
                    Limpar
                  </button>
                </div>
              }>
              <p className="text-sm leading-relaxed text-ink-300">{resumo}</p>
            </Painel>
          )}

          {pendentes.length > 0 && (
            <Painel titulo="Tarefas pendentes" descricao="O que falta confirmar ou pedir antes de publicar."
              accoes={
                <button type="button" onClick={copiarPendentes}
                  className="h-9 border border-ink-600 px-3 font-display text-[11px] uppercase tracking-wider text-ink-300 hover:text-white">
                  Copiar lista
                </button>
              }>
              <ul className="space-y-2">
                {pendentes.map((p, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-3 text-sm">
                      <input type="checkbox" checked={p.feito} className="mt-0.5 accent-mb-red"
                        onChange={() => setPendentes((l) => l.map((x, j) => (j === i ? { ...x, feito: !x.feito } : x)))} />
                      <span className={p.feito ? "text-ink-600 line-through" : "text-ink-200"}>{p.texto}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </Painel>
          )}

          {cartoes.map((c, i) => c.estado !== "descartado" && (
            <CartaoProposta key={i} cartao={c}
              aoAlterar={(campos) => alterar(i, campos)}
              aoGuardar={() => void guardar(i)}
              aoDescartar={() => marcar(i, "descartado")} />
          ))}

          {!resumo && !aAnalisar && (
            <Painel>
              <p className="py-10 text-center text-sm text-ink-500">
                As propostas aparecem aqui depois de organizar o material.
              </p>
            </Painel>
          )}
        </div>
      </div>

      {elemento}
    </>
  );
}

function CartaoProposta({ cartao, aoAlterar, aoGuardar, aoDescartar }: {
  cartao: Cartao;
  aoAlterar: (campos: Record<string, unknown>) => void;
  aoGuardar: () => void;
  aoDescartar: () => void;
}) {
  const p = cartao.proposta;
  const chaveRotulo = p.tipo === "bilhetes" ? "bilhetes" : p.coleccao;
  const rotulo = ROTULO[chaveRotulo];
  const registo = p.tipo === "criar" ? (p.registo as unknown as Record<string, unknown>) : null;
  const guardado = cartao.estado === "guardado";

  let detalhes: ReactNode = null;
  if (p.tipo === "bilhetes") {
    detalhes = <ListaBilhetes bilhetes={p.bilhetes} titulo="Bilhetes a acrescentar" />;
  } else if (p.coleccao === "eventos") {
    detalhes = <ListaBilhetes bilhetes={p.registo.bilhetes ?? []} titulo="Bilhetes" />;
  } else if (p.coleccao === "corridas") {
    detalhes = (
      <p className="text-xs text-ink-400">
        {p.registo.resultados.length} classificados{p.registo.vencedor ? ` · vencedor: ${p.registo.vencedor}` : ""}
      </p>
    );
  } else if (p.coleccao === "noticias") {
    detalhes = (
      <Campo etiqueta="Texto">
        <Area rows={6} disabled={guardado} value={p.registo.corpo.join("\n\n")}
          onChange={(e) => aoAlterar({ corpo: e.target.value.split(/\n{2,}/) })} />
      </Campo>
    );
  }

  return (
    <Painel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[10px] uppercase tracking-widest text-mb-red">
            {p.tipo === "bilhetes" ? "Bilhetes para evento existente" : `Novo ${rotulo.nome.toLowerCase()}`}
          </p>
          <h3 className="truncate font-display text-lg uppercase tracking-tight text-white">{titulo(p) || "Sem título"}</h3>
        </div>
        {guardado ? (
          <Link href={rotulo.href} className="border border-ok/40 bg-ok/15 px-2.5 py-1 font-display text-[10px] uppercase tracking-widest text-ok">
            Guardado · abrir
          </Link>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={aoDescartar} disabled={cartao.estado === "a-guardar"}
              className="h-9 border border-ink-600 px-3 font-display text-[11px] uppercase tracking-wider text-ink-300 hover:text-white">
              Descartar
            </button>
            <button type="button" onClick={aoGuardar} disabled={cartao.estado === "a-guardar"}
              className="h-9 bg-mb-red px-4 font-display text-[11px] uppercase tracking-wider text-white hover:bg-mb-red-dark disabled:opacity-60">
              {cartao.estado === "a-guardar" ? "A guardar…" : "Guardar"}
            </button>
          </div>
        )}
      </div>

      {cartao.erro && (
        <p role="alert" className="mt-3 border-l-2 border-mb-red pl-3 text-sm text-mb-red">{cartao.erro}</p>
      )}

      {p.avisos.length > 0 && !guardado && (
        <ul className="mt-3 space-y-1 border-l-2 border-gold/60 pl-3 text-xs text-gold">
          {p.avisos.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      )}

      {registo && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(CAMPOS[p.coleccao] ?? []).map((f) => (
            <Campo key={f.chave} etiqueta={f.etiqueta} className={f.longo ? "sm:col-span-2" : ""}>
              {f.longo ? (
                <Area rows={3} disabled={guardado} value={String(registo[f.chave] ?? "")}
                  onChange={(e) => aoAlterar({ [f.chave]: e.target.value })} />
              ) : (
                <Input disabled={guardado}
                  type={f.numero ? "number" : f.data ? "date" : "text"}
                  value={String(registo[f.chave] ?? "")}
                  onChange={(e) => aoAlterar({ [f.chave]: f.numero ? Number(e.target.value) : e.target.value })} />
              )}
            </Campo>
          ))}
        </div>
      )}

      {detalhes && <div className="mt-4">{detalhes}</div>}
    </Painel>
  );
}

function ListaBilhetes({ bilhetes, titulo }: {
  bilhetes: { id: string; nome: string; preco: number; disponiveis: number }[];
  titulo: string;
}) {
  if (bilhetes.length === 0) return null;
  return (
    <div>
      <p className="mb-2 font-display text-[10px] uppercase tracking-widest text-ink-500">{titulo}</p>
      <ul className="divide-y divide-ink-800 border border-ink-800">
        {bilhetes.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="text-white">{b.nome}</span>
            <span className="tabular-nums text-ink-300">
              {formatKz(b.preco)}{b.disponiveis ? ` · ${b.disponiveis} lugares` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
