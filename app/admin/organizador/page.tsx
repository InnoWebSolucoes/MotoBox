"use client";

/* ============================================================
   MOTOBOX ADMIN — Organizador IA
   A equipa cola o material que recebe (mensagens, cartazes,
   listas de preços, resultados, PDF, fotografias) ou pede
   mudanças ao que já existe, e o Claude devolve propostas:
   criar, alterar ou apagar registos. Cada proposta é revista
   aqui e guardada pelo mesmo caminho que os formulários do
   painel, por isso só fica marcada como guardada quando a base
   de dados confirma. Apagar pede sempre confirmação própria.
   ============================================================ */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAdmin, type ColeccaoNome } from "@/lib/admin/store";
import type { CampoAlterado, Proposta, ResultadoOrganizador } from "@/lib/admin/organizador";
import type { ResultadoCorrida, TipoBilhete } from "@/lib/types";
import { formatKz } from "@/lib/data";
import { FileUp, Sparkles, X } from "lucide-react";
import {
  Aviso, Botao, CabecalhoPagina, Painel, Campo, Input, Area, Seleccao, Confirmar, Etiqueta, Vazio, useAviso,
} from "@/components/admin/kit";
import { comBase } from "@/lib/base";

const CHAVE_RASCUNHO = "motobox-organizador-v1";

/** Tipos de ficheiro que o Claude lê directamente. */
const ACEITES = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
/** Tamanho máximo somado dos anexos, antes da codificação. */
const LIMITE_BYTES = 3 * 1024 * 1024;

const ROTULO: Record<string, { nome: string; novo: string; href?: string }> = {
  equipas: { nome: "Equipa", novo: "Nova equipa", href: "/admin/equipas" },
  pilotos: { nome: "Piloto", novo: "Novo piloto", href: "/admin/pilotos" },
  eventos: { nome: "Evento", novo: "Novo evento", href: "/admin/eventos" },
  bilhetes: { nome: "Bilhetes", novo: "Bilhetes para evento existente", href: "/admin/bilheteira" },
  corridas: { nome: "Resultado", novo: "Novo resultado", href: "/admin/corridas" },
  noticias: { nome: "Notícia", novo: "Nova notícia", href: "/admin/noticias" },
  patrocinadores: { nome: "Patrocinador", novo: "Novo patrocinador" },
  videos: { nome: "Vídeo", novo: "Novo vídeo" },
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

/** Nomes legíveis das chaves dos objectos (estatísticas, redes, recorde). */
const NOMES_CHAVES: Record<string, string> = {
  pontos: "Pontos", vitorias: "Vitórias", podios: "Pódios", poles: "Poles", corridas: "Corridas",
  melhorResultado: "Melhor resultado", titulos: "Títulos", instagram: "Instagram", facebook: "Facebook",
  piloto: "Piloto", tempo: "Tempo", ano: "Ano",
};

type Estado = "por-guardar" | "a-guardar" | "guardado" | "descartado";
/** Texto em edição de um campo de lista ou JSON, com o erro de leitura se houver. */
interface Rascunho { texto: string; erro?: string }
interface Cartao { proposta: Proposta; estado: Estado; erro?: string; rascunhos?: Record<string, Rascunho> }

interface Anexo { nome: string; tipo: string; dados: string; bytes: number }

type Opcao = { valor: string; nome: string };

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
  if (p.tipo === "alterar" || p.tipo === "apagar") return p.titulo;
  const r = p.registo as unknown as Record<string, unknown>;
  return String(r.titulo ?? r.nome ?? "");
}

/* ---------------- Leitura do que a equipa escreve ---------------- */

const lerLinhas = (t: string) => t.split("\n").map((l) => l.trim()).filter(Boolean);
const lerParagrafos = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

/** Lista em JSON (horários, bilhetes, resultados), com erros em português. */
function lerListaJson(tipo: CampoAlterado["tipo"]) {
  return (t: string): unknown => {
    let v: unknown;
    try { v = JSON.parse(t); } catch { throw new Error("JSON inválido: verifique aspas, vírgulas e parênteses."); }
    if (!Array.isArray(v)) throw new Error("Tem de ser uma lista, entre [ e ].");
    v.forEach((item, i) => {
      if (typeof item !== "object" || item === null) throw new Error(`O elemento ${i + 1} tem de ser um objecto, entre { e }.`);
      const o = item as Record<string, unknown>;
      if (tipo === "bilhetes" && (!o.nome || typeof o.preco !== "number")) {
        throw new Error(`O bilhete ${i + 1} precisa de "nome" e de "preco" em número.`);
      }
      if (tipo === "resultados" && (!o.piloto || typeof o.posicao !== "number")) {
        throw new Error(`O resultado ${i + 1} precisa de "piloto" e de "posicao" em número.`);
      }
    });
    return v;
  };
}

function idYoutube(valor: string): string | undefined {
  const m = /(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/.exec(valor);
  return m?.[1];
}

const cortar = (s: string, n = 220) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

/** Valor actual ou proposto, em texto curto para ler de relance. */
function resumoValor(f: CampoAlterado, v: unknown): string {
  if (f.tipo === "booleano") return v ? "Sim" : "Não";
  if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return "vazio";
  switch (f.tipo) {
    case "data": return String(v).slice(0, 10);
    case "lista":
    case "ligacoes": return (v as unknown[]).join(", ");
    case "paragrafos": return cortar((v as unknown[]).join(" "));
    case "objeto":
      return Object.entries(v as Record<string, unknown>)
        .map(([k, x]) => `${NOMES_CHAVES[k] ?? k}: ${x === "" ? "vazio" : String(x)}`).join(" · ");
    case "bilhetes": return (v as TipoBilhete[]).map((b) => `${b.nome} ${formatKz(b.preco)}`).join(" · ");
    case "horarios":
      return (v as { dia: string; hora: string; sessao: string }[])
        .map((h) => [h.dia, h.hora, h.sessao].filter(Boolean).join(" ")).join(" · ");
    case "resultados": {
      const r = v as ResultadoCorrida[];
      return r.slice(0, 5).map((x) => `${x.posicao}.º ${x.piloto}`).join(" · ")
        + (r.length > 5 ? ` e mais ${r.length - 5}` : "");
    }
    default: return cortar(String(v));
  }
}

export default function OrganizadorPage() {
  const { estado, criar, atualizar, remover } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const entrada = useRef<HTMLInputElement>(null);

  const [texto, setTexto] = useState("");
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [aAnalisar, setAAnalisar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resumo, setResumo] = useState("");
  const [pendentes, setPendentes] = useState<{ texto: string; feito: boolean }[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  /** Passos para ligar o Organizador, quando falta a chave no servidor. */
  const [semChave, setSemChave] = useState<string | null>(null);

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

  // Mostra logo como ligar o Organizador, antes de alguém colar material.
  useEffect(() => {
    let activo = true;
    fetch(comBase("/api/admin/organizador"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { configurado?: boolean; instrucoes?: string | null } | null) => {
        if (activo && j && j.configurado === false) setSemChave(j.instrucoes ?? "Falta a variável ANTHROPIC_API_KEY no servidor.");
      })
      .catch(() => { /* sem ligação: o erro aparece ao organizar */ });
    return () => { activo = false; };
  }, []);

  const bytes = anexos.reduce((s, a) => s + a.bytes, 0);

  const ligacoes: Record<string, Opcao[]> = {
    equipas: estado.equipas.map((e) => ({ valor: e.slug, nome: e.nome })),
    eventos: estado.eventos.map((e) => ({ valor: e.slug, nome: e.titulo })),
    pilotos: estado.pilotos.map((p) => ({ valor: p.slug, nome: p.nome })),
  };

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
      const r = await fetch(comBase("/api/admin/organizador"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, ficheiros: anexos.map(({ nome, tipo, dados }) => ({ nome, tipo, dados })) }),
      });
      // Um corte por tempo no Vercel chega como página de erro, não como JSON.
      const j = await r.json().catch(() => ({
        erro: r.status === 504
          ? "A análise demorou demasiado. Divida o material em partes mais pequenas e tente de novo."
          : `Erro ${r.status}`,
      }));
      if (!r.ok) { setErro(String(j.erro ?? `Erro ${r.status}`)); return; }
      const d = j as ResultadoOrganizador;
      setResumo(d.resumo);
      setPendentes(d.pendentes.map((t) => ({ texto: t, feito: false })));
      setCartoes(d.propostas.map((p) => ({ proposta: p, estado: "por-guardar" })));
      setTexto(""); setAnexos([]);
      if (d.propostas.length === 0) mostrar("Nada para criar, alterar ou apagar neste material.");
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

  /** Novo valor de um campo de uma alteração. */
  const alterarCampo = (i: number, campo: string, depois: unknown) =>
    setCartoes((cs) => cs.map((c, j) => {
      if (j !== i || c.proposta.tipo !== "alterar") return c;
      let campos = c.proposta.campos.map((f) => (f.campo === campo ? { ...f, depois } : f));
      // O nome da equipa de um piloto acompanha a equipa escolhida.
      if (c.proposta.coleccao === "pilotos" && campo === "equipaSlug") {
        const nome = depois ? estado.equipas.find((e) => e.slug === depois)?.nome : "";
        if (nome !== undefined) campos = campos.map((f) => (f.campo === "equipa" ? { ...f, depois: nome } : f));
      }
      return { ...c, proposta: { ...c.proposta, campos } };
    }));

  /** Texto de um campo de lista ou JSON: guarda o que foi escrito e, se for válido, o valor. */
  const escreverCampo = (i: number, campo: string, texto: string, ler: (t: string) => unknown) => {
    let depois: unknown;
    let erroLeitura: string | undefined;
    try { depois = ler(texto); } catch (e) { erroLeitura = e instanceof Error ? e.message : "Valor inválido."; }
    setCartoes((cs) => cs.map((c, j) => {
      if (j !== i || c.proposta.tipo !== "alterar") return c;
      const campos = erroLeitura
        ? c.proposta.campos
        : c.proposta.campos.map((f) => (f.campo === campo ? { ...f, depois } : f));
      return {
        ...c,
        rascunhos: { ...c.rascunhos, [campo]: { texto, erro: erroLeitura } },
        proposta: { ...c.proposta, campos },
      };
    }));
  };

  const marcar = (i: number, e: Estado, erroTexto?: string) =>
    setCartoes((cs) => cs.map((c, j) => (j === i ? { ...c, estado: e, erro: erroTexto } : c)));

  const guardar = async (i: number): Promise<boolean> => {
    const c = cartoes[i];
    if (!c || c.estado === "guardado" || c.estado === "a-guardar") return true;
    const p = c.proposta;
    if (p.tipo === "alterar") {
      const invalido = p.campos.find((f) => c.rascunhos?.[f.campo]?.erro);
      if (invalido) {
        marcar(i, "por-guardar", `Corrija o campo ${invalido.etiqueta}: ${c.rascunhos?.[invalido.campo]?.erro}`);
        return false;
      }
    }
    marcar(i, "a-guardar");
    let falha: string | null;
    if (p.tipo === "bilhetes") {
      const actuais = estado.eventos.find((e) => e.slug === p.eventoSlug)?.bilhetes ?? [];
      falha = await atualizar("eventos", p.eventoSlug, { bilhetes: [...actuais, ...p.bilhetes] });
    } else if (p.tipo === "alterar") {
      falha = await atualizar(p.coleccao, p.slug, Object.fromEntries(p.campos.map((f) => [f.campo, f.depois])));
    } else if (p.tipo === "apagar") {
      falha = await remover(p.coleccao, p.slug);
    } else {
      falha = await criar(p.coleccao as ColeccaoNome, p.registo as unknown as Record<string, unknown>);
    }
    if (falha) { marcar(i, "por-guardar", falha); return false; }
    marcar(i, "guardado");
    return true;
  };

  // A ordem das propostas já põe as equipas antes dos pilotos que as
  // usam e as criações antes das alterações. As remoções ficam de
  // fora: cada uma pede confirmação no seu cartão.
  const emLote = (c: Cartao) => c.estado === "por-guardar" && c.proposta.tipo !== "apagar";
  const guardarTudo = async () => {
    let falhas = 0;
    for (let i = 0; i < cartoes.length; i++) {
      if (!emLote(cartoes[i])) continue;
      if (!(await guardar(i))) falhas++;
    }
    mostrar(falhas ? `${falhas} proposta(s) não foram guardadas. Veja o motivo em cada uma.` : "Tudo guardado.", falhas ? "erro" : "ok");
  };

  const porGuardar = cartoes.filter(emLote).length;
  const remocoesPorConfirmar = cartoes.filter((c) => c.estado === "por-guardar" && c.proposta.tipo === "apagar").length;

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
        sobretitulo="Visão geral"
        icone={<Sparkles />}
        descricao="Cole mensagens, cartazes, listas de preços ou resultados, ou peça mudanças ao que já está publicado. O Claude transforma tudo em propostas para criar, alterar ou apagar eventos, bilhetes, pilotos, equipas, resultados e artigos, prontas a rever e guardar."
      />

      {semChave && (
        <div className="mb-[var(--intervalo)]">
          <Aviso tom="atencao" titulo="O Organizador ainda não está ligado">{semChave}</Aviso>
        </div>
      )}

      {/* grid-cols-1 dá à coluna única largura mínima 0: sem isso, um título
          comprido de um cartão alargava a página inteira no telemóvel. */}
      <div className="grid grid-cols-1 gap-[var(--intervalo)] xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Painel titulo="Material" descricao="Texto solto, fotografias de cartazes ou PDF, ou o que quer mudar. Não precisa de estar arrumado.">
          <div className="space-y-4">
            <Area
              rows={12} value={texto} onChange={(e) => setTexto(e.target.value)}
              placeholder={"Exemplo:\nGP do Lubango dia 14 e 15 de Novembro na Tundavala. Bilhete geral 3 mil, bancada 7500, VIP 20 mil com almoço.\nNovo piloto: Mauro Kapita, 19 anos, #27, MX2, corre pela Tundavala MX numa Yamaha YZ250F.\n\nOu mudanças ao que já existe:\nO GP do Namibe passou para 17 e 18 de Outubro. O Nelson Kiala mudou-se para a Tundavala MX e já soma 230 pontos."}
            />

            <div>
              <input ref={entrada} type="file" accept={ACEITES} multiple className="hidden"
                onChange={(e) => { void juntar(e.target.files); e.target.value = ""; }} />
              <Botao onClick={() => entrada.current?.click()}>
                <FileUp className="size-4" aria-hidden />
                Anexar imagem ou PDF
              </Botao>
              {anexos.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {anexos.map((a, i) => (
                    <li key={`${a.nome}-${i}`} className="flex items-center gap-2 rounded-[var(--raio)] bg-black/20 px-3 py-2 text-xs text-white/75">
                      <span className="flex-1 truncate">{a.nome}</span>
                      <span className="tabular-nums text-white/45">{Math.ceil(a.bytes / 1024)} KB</span>
                      <button type="button" onClick={() => setAnexos((l) => l.filter((_, j) => j !== i))}
                        className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-white/60 hover:bg-mb-red hover:text-white" aria-label={`Remover ${a.nome}`}>
                        <X className="size-3" aria-hidden />Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {erro && <Aviso tom="erro">{erro}</Aviso>}

            <Botao variante="primario" tamanho="lg" className="w-full" onClick={analisar} disabled={aAnalisar}>
              <Sparkles className="size-4" aria-hidden />
              {aAnalisar ? "A analisar… pode demorar um minuto" : "Organizar com IA"}
            </Botao>
            <p className="text-xs leading-relaxed text-white/50">
              Nada é publicado sem a sua confirmação. As propostas aparecem ao lado para rever.
            </p>
          </div>
        </Painel>

        <div className="space-y-[var(--intervalo)]">
          {resumo && (
            <Painel titulo="O que foi encontrado"
              accoes={
                <div className="flex gap-2">
                  {porGuardar > 0 && (
                    <Botao variante="primario" tamanho="sm" onClick={guardarTudo}>
                      Guardar tudo ({porGuardar})
                    </Botao>
                  )}
                  <Botao variante="fantasma" tamanho="sm" onClick={limpar}>
                    Limpar
                  </Botao>
                </div>
              }>
              <p className="text-sm leading-relaxed text-white/75">{resumo}</p>
              {remocoesPorConfirmar > 0 && (
                <p className="mt-3 text-xs text-gold">
                  {remocoesPorConfirmar === 1 ? "Há 1 remoção" : `Há ${remocoesPorConfirmar} remoções`} por confirmar.
                  Não entram em Guardar tudo: confirme cada uma no seu cartão.
                </p>
              )}
            </Painel>
          )}

          {pendentes.length > 0 && (
            <Painel titulo="Tarefas pendentes" descricao="O que falta confirmar ou pedir antes de publicar."
              accoes={
                <Botao variante="fantasma" tamanho="sm" onClick={copiarPendentes}>
                  Copiar lista
                </Botao>
              }>
              <ul className="space-y-2">
                {pendentes.map((p, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-3 text-sm">
                      <input type="checkbox" checked={p.feito} className="mt-0.5 accent-mb-red"
                        onChange={() => setPendentes((l) => l.map((x, j) => (j === i ? { ...x, feito: !x.feito } : x)))} />
                      <span className={p.feito ? "text-white/35 line-through" : "text-white/85"}>{p.texto}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </Painel>
          )}

          {cartoes.map((c, i) => c.estado !== "descartado" && (
            <CartaoProposta key={i} cartao={c} ligacoes={ligacoes}
              aoAlterar={(campos) => alterar(i, campos)}
              aoAlterarCampo={(campo, depois) => alterarCampo(i, campo, depois)}
              aoEscreverCampo={(campo, t, ler) => escreverCampo(i, campo, t, ler)}
              aoGuardar={() => void guardar(i)}
              aoDescartar={() => marcar(i, "descartado")} />
          ))}

          {!resumo && !aAnalisar && (
            <Painel>
              <Vazio titulo="Ainda sem propostas">
                Depois de organizar o material, as propostas aparecem aqui, uma por cartão, para rever e guardar.
              </Vazio>
            </Painel>
          )}
        </div>
      </div>

      {elemento}
    </>
  );
}

function CartaoProposta({ cartao, ligacoes, aoAlterar, aoAlterarCampo, aoEscreverCampo, aoGuardar, aoDescartar }: {
  cartao: Cartao;
  ligacoes: Record<string, Opcao[]>;
  aoAlterar: (campos: Record<string, unknown>) => void;
  aoAlterarCampo: (campo: string, depois: unknown) => void;
  aoEscreverCampo: (campo: string, texto: string, ler: (t: string) => unknown) => void;
  aoGuardar: () => void;
  aoDescartar: () => void;
}) {
  const [confirmar, setConfirmar] = useState(false);
  const p = cartao.proposta;
  const chaveRotulo = p.tipo === "bilhetes" ? "bilhetes" : p.coleccao;
  const rotulo = ROTULO[chaveRotulo];
  const registo = p.tipo === "criar" ? (p.registo as unknown as Record<string, unknown>) : null;
  const guardado = cartao.estado === "guardado";
  const aGuardar = cartao.estado === "a-guardar";
  const apagar = p.tipo === "apagar";

  const etiqueta = p.tipo === "alterar" ? `Alterar ${rotulo.nome.toLowerCase()}`
    : apagar ? `Apagar ${rotulo.nome.toLowerCase()}`
    : rotulo.novo;

  let detalhes: ReactNode = null;
  if (p.tipo === "bilhetes") {
    detalhes = <ListaBilhetes bilhetes={p.bilhetes} titulo="Bilhetes a acrescentar" />;
  } else if (p.tipo === "alterar") {
    detalhes = (
      <div className="space-y-4">
        {p.campos.map((f) => (
          <CampoAlteracao key={f.campo} f={f} desactivado={guardado || aGuardar}
            rascunho={cartao.rascunhos?.[f.campo]} opcoesLigacao={ligacoes[f.alvo ?? ""] ?? []}
            aoMudar={(v) => aoAlterarCampo(f.campo, v)}
            aoEscrever={(t, ler) => aoEscreverCampo(f.campo, t, ler)} />
        ))}
      </div>
    );
  } else if (p.tipo === "criar" && p.coleccao === "eventos") {
    detalhes = <ListaBilhetes bilhetes={p.registo.bilhetes ?? []} titulo="Bilhetes" />;
  } else if (p.tipo === "criar" && p.coleccao === "corridas") {
    detalhes = (
      <p className="text-xs text-white/60">
        {p.registo.resultados.length} classificados{p.registo.vencedor ? ` · vencedor: ${p.registo.vencedor}` : ""}
      </p>
    );
  } else if (p.tipo === "criar" && p.coleccao === "noticias") {
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
        <div className="min-w-0 flex-1 basis-60">
          <p className="text-xs font-medium text-mb-red-light">{etiqueta}</p>
          <h3 className="mt-0.5 truncate text-lg font-semibold text-white">{titulo(p) || "Sem título"}</h3>
        </div>
        {guardado ? (
          apagar ? (
            <Etiqueta>Apagado</Etiqueta>
          ) : (
            rotulo.href ? (
              <Link href={rotulo.href} className="inline-flex items-center rounded-[4px] bg-ok/20 px-2 py-0.5 text-xs font-medium text-[#4ade80] hover:bg-ok/30">
                Guardado · abrir
              </Link>
            ) : (
              <Etiqueta tom="ok">Guardado</Etiqueta>
            )
          )
        ) : (
          <div className="flex gap-2">
            <Botao variante="fantasma" tamanho="sm" onClick={aoDescartar} disabled={aGuardar}>
              Descartar
            </Botao>
            <Botao variante={apagar ? "perigo" : "primario"} tamanho="sm" onClick={apagar ? () => setConfirmar(true) : aoGuardar} disabled={aGuardar}>
              {aGuardar ? (apagar ? "A apagar…" : "A guardar…") : apagar ? "Apagar…" : "Guardar"}
            </Botao>
          </div>
        )}
      </div>

      {(p.tipo === "alterar" || p.tipo === "apagar") && p.motivo && (
        <p className="mt-2 text-sm text-white/70">{p.motivo}</p>
      )}

      {cartao.erro && (
        <p role="alert" className="mt-3 border-l-2 border-mb-red pl-3 text-sm text-mb-red-light">{cartao.erro}</p>
      )}

      {p.avisos.length > 0 && !guardado && (
        <ul className="mt-3 space-y-1 border-l-2 border-gold/60 pl-3 text-xs text-gold">
          {p.avisos.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      )}

      {registo && p.tipo === "criar" && (
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

      {apagar && (
        <Confirmar aberta={confirmar} aoFechar={() => setConfirmar(false)} aoConfirmar={aoGuardar} perigo
          titulo={`Apagar ${rotulo.nome.toLowerCase()}`} textoConfirmar="Apagar"
          mensagem={`Vai apagar «${titulo(p)}» da plataforma. Esta acção não se desfaz.`} />
      )}
    </Painel>
  );
}

/** Um campo de uma alteração: o valor actual e o novo, editável. */
function CampoAlteracao({ f, desactivado, rascunho, opcoesLigacao, aoMudar, aoEscrever }: {
  f: CampoAlterado;
  desactivado: boolean;
  rascunho?: Rascunho;
  opcoesLigacao: Opcao[];
  aoMudar: (v: unknown) => void;
  aoEscrever: (texto: string, ler: (t: string) => unknown) => void;
}) {
  // Ligações mostram o nome (Kilamba Racing) em vez do slug.
  const nomeDe = (s: unknown) => opcoesLigacao.find((o) => o.valor === s)?.nome ?? s;
  const legivel = (x: unknown) =>
    f.tipo === "ligacao" && x ? nomeDe(x) : f.tipo === "ligacoes" && Array.isArray(x) ? x.map(nomeDe) : x;
  const antes = (
    <p className="mb-1.5 text-xs text-white/45">
      Antes: <span className="text-white/55 line-through decoration-white/30">{resumoValor(f, legivel(f.antes))}</span>
    </p>
  );

  // Objectos: uma caixa por chave (pontos, vitórias, Instagram...).
  if (f.tipo === "objeto") {
    const obj = (f.depois && typeof f.depois === "object" ? f.depois : {}) as Record<string, unknown>;
    return (
      <div className="border-t border-white/[0.08] pt-3">
        <p className="mb-1.5 text-[13px] font-medium text-white/75">{f.etiqueta}</p>
        {antes}
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(f.chaves ?? {}).map(([k, t]) => (
            <Campo key={k} etiqueta={NOMES_CHAVES[k] ?? k}>
              <Input disabled={desactivado} type={t === "numero" ? "number" : "text"} min={t === "numero" ? 0 : undefined}
                value={obj[k] === undefined || obj[k] === null ? "" : String(obj[k])}
                onChange={(e) => aoMudar({ ...obj, [k]: t === "numero" ? Number(e.target.value) : e.target.value })} />
            </Campo>
          ))}
        </div>
      </div>
    );
  }

  const v = f.depois;
  const textoDe = (x: unknown) => (x === null || x === undefined ? "" : String(x));
  let editor: ReactNode;
  switch (f.tipo) {
    case "longo":
      editor = <Area rows={4} disabled={desactivado} value={textoDe(v)} onChange={(e) => aoMudar(e.target.value)} />;
      break;
    case "data":
      editor = <Input type="date" disabled={desactivado} value={textoDe(v).slice(0, 10)} onChange={(e) => aoMudar(e.target.value)} />;
      break;
    case "numero":
      editor = (
        <Input type="number" min={0} disabled={desactivado} value={textoDe(v)}
          onChange={(e) => aoMudar(e.target.value === "" ? (f.opcional ? null : 0) : Number(e.target.value))} />
      );
      break;
    case "booleano":
      editor = (
        <Seleccao disabled={desactivado} valor={v ? "sim" : "nao"} onChange={(x) => aoMudar(x === "sim")}
          opcoes={[{ valor: "sim", nome: "Sim" }, { valor: "nao", nome: "Não" }]} />
      );
      break;
    case "opcao":
      editor = (
        <Seleccao disabled={desactivado} valor={textoDe(v)} onChange={aoMudar}
          opcoes={(f.opcoes ?? []).map((o) => ({ valor: o, nome: o }))} />
      );
      break;
    case "ligacao": {
      // Uma equipa criada nesta mesma análise ainda não está na lista.
      const opcoes = [{ valor: "", nome: "Nenhum" }, ...opcoesLigacao];
      if (v && !opcoes.some((o) => o.valor === v)) opcoes.push({ valor: String(v), nome: `${String(v)} (por guardar)` });
      editor = <Seleccao disabled={desactivado} valor={textoDe(v)} onChange={aoMudar} opcoes={opcoes} />;
      break;
    }
    case "lista":
    case "ligacoes":
      editor = (
        <Area rows={4} disabled={desactivado} value={rascunho?.texto ?? (Array.isArray(v) ? v.join("\n") : "")}
          onChange={(e) => aoEscrever(e.target.value, lerLinhas)} />
      );
      break;
    case "paragrafos":
      editor = (
        <Area rows={8} disabled={desactivado} value={rascunho?.texto ?? (Array.isArray(v) ? v.join("\n\n") : "")}
          onChange={(e) => aoEscrever(e.target.value, lerParagrafos)} />
      );
      break;
    case "horarios":
    case "bilhetes":
    case "resultados":
      editor = (
        <>
          <p className="mb-1.5 text-xs text-white/65">Depois: {resumoValor(f, v)}</p>
          <Area rows={8} disabled={desactivado} className="font-mono text-xs"
            value={rascunho?.texto ?? JSON.stringify(v, null, 2)}
            onChange={(e) => aoEscrever(e.target.value, lerListaJson(f.tipo))} />
        </>
      );
      break;
    case "youtube":
      editor = (
        <Input disabled={desactivado} value={textoDe(v)} placeholder="Endereço ou ID do YouTube"
          onChange={(e) => aoMudar(idYoutube(e.target.value) ?? e.target.value)} />
      );
      break;
    default:
      editor = <Input disabled={desactivado} value={textoDe(v)} onChange={(e) => aoMudar(e.target.value)} />;
  }

  const ajuda = f.tipo === "ligacoes" ? `Um endereço (slug) por linha. Fica: ${resumoValor(f, legivel(v))}.`
    : f.tipo === "lista" ? "Um por linha."
    : f.tipo === "paragrafos" ? "Parágrafos separados por uma linha em branco."
    : f.tipo === "horarios" || f.tipo === "bilhetes" || f.tipo === "resultados" ? "Lista completa, em JSON."
    : undefined;

  return (
    <div className="border-t border-white/[0.08] pt-3">
      <Campo etiqueta={f.etiqueta} ajuda={ajuda}>
        {antes}
        {editor}
      </Campo>
      {rascunho?.erro && <p role="alert" className="mt-1 text-xs text-mb-red-light">{rascunho.erro}</p>}
    </div>
  );
}

function ListaBilhetes({ bilhetes, titulo }: {
  bilhetes: { id: string; nome: string; preco: number; disponiveis: number }[];
  titulo: string;
}) {
  if (bilhetes.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-white/75">{titulo}</p>
      <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-[var(--raio)] border border-white/10 bg-black/[0.15]">
        {bilhetes.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="text-white">{b.nome}</span>
            <span className="tabular-nums text-white/65">
              {formatKz(b.preco)}{b.disponiveis ? ` · ${b.disponiveis} lugares` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
