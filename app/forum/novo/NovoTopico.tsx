"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, Icon } from "@/components/ui";
import { useExigirSessao } from "@/components/SessaoObrigatoria";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";
import { interfaceEn } from "@/lib/i18n/interface-en";
import { comBase } from "@/lib/base";
import {
  TOPICO_TEXTO_MAX, TOPICO_TEXTO_MIN, TOPICO_TITULO_MAX, TOPICO_TITULO_MIN,
} from "@/lib/forum/tipos";

/* ============================================================
   MOTOBOX — Formulário "Novo tópico"
   Qualquer pessoa preenche; publicar pede sessão: sem ela, abre-se
   a janela de entrar/criar conta e, ao entrar, o tópico segue
   sozinho. O rascunho fica guardado neste navegador, para
   sobreviver ao recarregar que a confirmação da conta provoca.
   Publicado, a pessoa vai directa para a página do tópico.
   ============================================================ */

const RASCUNHO = "motobox-novo-topico";

interface Campos {
  titulo: string;
  categoria: string;
  corpo: string;
}
type CampoTopico = keyof Campos;

const VAZIO: Campos = { titulo: "", categoria: "", corpo: "" };

export interface CategoriaEscolha {
  slug: string;
  nome: string;
  descricao: string;
}

function lerRascunho(): Campos | null {
  try {
    const g = localStorage.getItem(RASCUNHO);
    if (!g) return null;
    const dados = JSON.parse(g) as Partial<Campos>;
    return { ...VAZIO, ...Object.fromEntries(Object.entries(dados).filter(([, v]) => typeof v === "string")) };
  } catch {
    return null;
  }
}

function guardarRascunho(c: Campos | null) {
  try {
    if (c) localStorage.setItem(RASCUNHO, JSON.stringify(c));
    else localStorage.removeItem(RASCUNHO);
  } catch { /* modo privado: o rascunho fica só na página */ }
}

const semSubscricao = () => () => {};

export function NovoTopico({ categorias }: { categorias: CategoriaEscolha[] }) {
  // O servidor desenha o formulário vazio; no navegador, volta a montar-se com o rascunho.
  const noNavegador = useSyncExternalStore(semSubscricao, () => true, () => false);
  return (
    <Formulario key={noNavegador ? "navegador" : "servidor"} restaurar={noNavegador} categorias={categorias} />
  );
}

function Formulario({ restaurar, categorias }: { restaurar: boolean; categorias: CategoriaEscolha[] }) {
  const exigirSessao = useExigirSessao();
  const { utilizador, perfil } = useAuth();
  const { idioma } = useIdioma();

  const [form, setForm] = useState<Campos>(() => {
    const r = (restaurar ? lerRascunho() : null) ?? VAZIO;
    // Uma categoria que entretanto deixou de existir não fica escolhida.
    return categorias.some((c) => c.slug === r.categoria) ? r : { ...r, categoria: "" };
  });
  const [erros, setErros] = useState<Partial<Record<CampoTopico | "geral", string>>>({});
  const [aEnviar, setAEnviar] = useState(false);

  // Atributos não passam pelo TraduzirPagina (só texto): traduz-se aqui.
  const tr = (pt: string) => (idioma === "en" && interfaceEn[pt]) || pt;

  // Guarda o rascunho a cada alteração (só no navegador, e só enquanto há algo escrito).
  useEffect(() => {
    if (!restaurar) return;
    guardarRascunho(form.titulo.trim() || form.corpo.trim() ? form : null);
  }, [form, restaurar]);

  const mudar = (k: CampoTopico, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErros((e) => ({ ...e, [k]: undefined, geral: undefined }));
  };

  /** As mesmas regras da rota, para avisar antes de pedir sessão. */
  function validar(): boolean {
    const titulo = form.titulo.replace(/\s+/g, " ").trim();
    const corpo = form.corpo.trim();
    const e: Partial<Record<CampoTopico, string>> = {};
    if (titulo.length < TOPICO_TITULO_MIN) e.titulo = `O título precisa de pelo menos ${TOPICO_TITULO_MIN} caracteres.`;
    else if (titulo.length > TOPICO_TITULO_MAX) e.titulo = `O título pode ter no máximo ${TOPICO_TITULO_MAX} caracteres.`;
    if (!categorias.some((c) => c.slug === form.categoria)) e.categoria = "Escolha a categoria do tópico.";
    if (corpo.length < TOPICO_TEXTO_MIN) e.corpo = `Escreva a mensagem de abertura, com pelo menos ${TOPICO_TEXTO_MIN} caracteres.`;
    else if (corpo.length > TOPICO_TEXTO_MAX) e.corpo = `A mensagem pode ter no máximo ${TOPICO_TEXTO_MAX} caracteres.`;
    setErros(e);
    const primeiro = (["titulo", "categoria", "corpo"] as const).find((k) => e[k]);
    if (primeiro) document.getElementById(`novo-${primeiro}`)?.focus();
    return !primeiro;
  }

  async function enviar(c: Campos) {
    setAEnviar(true);
    setErros({});
    try {
      const r = await fetch(comBase("/api/forum/novo-topico"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: c.titulo, categoria: c.categoria, corpo: c.corpo }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || typeof j.id !== "string") {
        setErros({
          geral: r.status === 401
            ? "A sua sessão terminou. Entre de novo para publicar."
            : String(j.erro ?? `Erro ${r.status}. Tente de novo.`),
        });
        setAEnviar(false);
        return;
      }
      guardarRascunho(null);
      // Navegação completa: a lista do fórum que o navegador guardou ainda não tem o tópico.
      window.location.assign(comBase(`/forum/${encodeURIComponent(j.id)}`));
    } catch {
      setErros({ geral: "Sem ligação à internet. Tente de novo." });
      setAEnviar(false);
    }
  }

  const publicar = (e: React.FormEvent) => {
    e.preventDefault();
    if (aEnviar || !validar()) return;
    const campos = form;
    // Sem sessão abre a janela; depois de entrar, o tópico segue sozinho.
    exigirSessao(() => void enviar(campos), { motivo: "Para abrir um tópico precisa de sessão.", continuar: true });
  };

  const nomeMeta = utilizador?.user_metadata?.nome;
  const nome = perfil?.nome || (typeof nomeMeta === "string" ? nomeMeta : "") || utilizador?.email || "";
  const escolhida = categorias.find((c) => c.slug === form.categoria);

  const campo = (k: CampoTopico) =>
    `w-full bg-ink-900 text-base text-white ring-inset placeholder:text-ink-600 outline-none transition-shadow ${
      erros[k] ? "ring-2 ring-mb-red" : "ring-1 ring-white/10 focus:ring-2 focus:ring-mb-red"
    }`;
  const rotulo = "eyebrow mb-2.5 block text-ink-500";
  const erro = (k: CampoTopico) =>
    erros[k] ? <p id={`novo-${k}-erro`} className="mt-2 text-sm text-mb-red-light">{erros[k]}</p> : null;
  const ligar = (k: CampoTopico) => ({
    id: `novo-${k}`,
    "aria-invalid": Boolean(erros[k]),
    "aria-describedby": erros[k] ? `novo-${k}-erro` : undefined,
  });

  return (
    <form onSubmit={publicar} noValidate className="space-y-8">
      <div>
        <label htmlFor="novo-titulo" className={rotulo}>Título</label>
        <input
          {...ligar("titulo")}
          type="text"
          autoComplete="off"
          maxLength={TOPICO_TITULO_MAX}
          value={form.titulo}
          onChange={(e) => mudar("titulo", e.target.value)}
          placeholder={tr("Ex.: CRF 250 a falhar a quente, alguém já teve isto?")}
          className={`h-12 px-4 ${campo("titulo")}`}
        />
        {erro("titulo")}
      </div>

      <fieldset aria-describedby={erros.categoria ? "novo-categoria-erro" : undefined}>
        <legend className={rotulo}>Categoria</legend>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c, i) => (
            <button
              key={c.slug}
              id={i === 0 ? "novo-categoria" : undefined}
              type="button"
              aria-pressed={form.categoria === c.slug}
              onClick={() => mudar("categoria", c.slug)}
              className="chip h-9 text-sm"
            >
              {c.nome}
            </button>
          ))}
        </div>
        {escolhida?.descricao && <p className="mt-2.5 text-sm text-ink-500">{escolhida.descricao}</p>}
        {erro("categoria")}
      </fieldset>

      <div>
        <label htmlFor="novo-corpo" className={rotulo}>Mensagem</label>
        <textarea
          {...ligar("corpo")}
          rows={8}
          maxLength={TOPICO_TEXTO_MAX}
          value={form.corpo}
          onChange={(e) => mudar("corpo", e.target.value)}
          placeholder={tr("Conte o que ajuda quem vai responder: a mota, o que já tentou, quando acontece.")}
          className={`resize-y p-4 ${campo("corpo")}`}
        />
        {erro("corpo")}
      </div>

      {erros.geral && (
        <p role="alert" className="rounded-xl bg-mb-red/10 px-4 py-3 text-sm text-mb-red-light">{erros.geral}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-500">
          {utilizador ? (
            <>
              <span>A publicar como</span>{" "}
              <span className="text-white">{nome}</span>
            </>
          ) : (
            <span>Ao publicar, pedimos que entre ou crie conta.</span>
          )}
        </p>
        <Button type="submit" disabled={aEnviar}>
          {aEnviar ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
              <span>A publicar…</span>
            </>
          ) : (
            <>
              <span>Publicar tópico</span>
              <Icon name="arrow" className="size-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
