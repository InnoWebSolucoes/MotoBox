"use client";

/* ============================================================
   MOTOBOX — Fórum: criar um tópico
   Título, categoria e mensagem. Pede sessão só ao carregar em
   publicar: sem ela abre-se a janela de entrar/criar conta e o
   texto fica onde estava (e guardado neste navegador, para
   sobreviver ao recarregar da confirmação da conta). Publicado,
   leva a pessoa ao tópico; se a equipa revê os tópicos antes de
   aparecerem, diz isso mesmo.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Icon } from "@/components/ui";
import { useExigirSessao } from "@/components/SessaoObrigatoria";
import { useAuth } from "@/lib/auth/contexto";
import { comBase } from "@/lib/base";
import type { ConteudoForum } from "@/lib/conteudo/grupos/comunidade";
import { CORPO_MAX, CORPO_MIN, TITULO_MAX, TITULO_MIN, textoSobre, type CategoriaCartao } from "./tipos";

const RASCUNHO = "motobox-topico-rascunho";

interface Rascunho { titulo?: string; categoria?: string; corpo?: string }

export function FormularioTopico({
  categorias, categoriaInicial, textos: t,
}: {
  categorias: (CategoriaCartao & { descricao?: string })[];
  categoriaInicial?: string;
  textos: ConteudoForum["novo"];
}) {
  const exigirSessao = useExigirSessao();
  const { utilizador, perfil } = useAuth();
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const campoTitulo = useRef<HTMLInputElement>(null);
  const campoCorpo = useRef<HTMLTextAreaElement>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<{ campo?: "titulo" | "categoria" | "corpo"; texto: string } | null>(null);
  const [enviado, setEnviado] = useState(false);

  // Os campos não são controlados: o rascunho entra directamente, sem desenhar duas vezes.
  useEffect(() => {
    let r: Rascunho | null = null;
    try { r = JSON.parse(localStorage.getItem(RASCUNHO) ?? "null"); } catch { /* indisponível */ }
    if (!r) return;
    if (r.titulo && campoTitulo.current && !campoTitulo.current.value) campoTitulo.current.value = r.titulo;
    if (r.corpo && campoCorpo.current && !campoCorpo.current.value) campoCorpo.current.value = r.corpo;
    if (r.categoria && !categoriaInicial) {
      const radio = form.current?.querySelector<HTMLInputElement>(`input[name="categoria"][value="${CSS.escape(r.categoria)}"]`);
      if (radio) radio.checked = true;
    }
  }, [categoriaInicial]);

  const ler = () => {
    const dados = new FormData(form.current ?? undefined);
    return {
      titulo: String(dados.get("titulo") ?? "").trim(),
      categoria: String(dados.get("categoria") ?? ""),
      corpo: String(dados.get("corpo") ?? "").trim(),
    };
  };

  const guardar = () => {
    try {
      const v = ler();
      if (v.titulo || v.corpo) localStorage.setItem(RASCUNHO, JSON.stringify(v));
      else localStorage.removeItem(RASCUNHO);
    } catch { /* indisponível */ }
  };

  async function enviar(v: ReturnType<typeof ler>) {
    setAEnviar(true);
    setErro(null);
    try {
      const r = await fetch(comBase("/api/forum/topicos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.id) {
        setErro({
          campo: j.campo,
          texto: r.status === 401
            ? "A sua sessão terminou. Entre de novo para publicar."
            : String(j.erro ?? `Erro ${r.status}. Tente de novo.`),
        });
        return;
      }
      try { localStorage.removeItem(RASCUNHO); } catch { /* indisponível */ }
      if (j.publicado) {
        router.push(`/forum/${encodeURIComponent(String(j.id))}`);
        router.refresh();
      } else {
        form.current?.reset();
        setEnviado(true);
      }
    } catch {
      setErro({ texto: "Sem ligação à internet. Tente de novo." });
    } finally {
      setAEnviar(false);
    }
  }

  const publicar = (e: React.FormEvent) => {
    e.preventDefault();
    if (aEnviar) return;
    const v = ler();
    if (v.titulo.length < TITULO_MIN) {
      setErro({ campo: "titulo", texto: `Escreva um título com pelo menos ${TITULO_MIN} caracteres.` });
      campoTitulo.current?.focus();
      return;
    }
    if (!v.categoria) {
      setErro({ campo: "categoria", texto: "Escolha a categoria do tópico." });
      form.current?.querySelector<HTMLInputElement>('input[name="categoria"]')?.focus();
      return;
    }
    if (v.corpo.length < CORPO_MIN) {
      setErro({ campo: "corpo", texto: "Conte um pouco mais na mensagem." });
      campoCorpo.current?.focus();
      return;
    }
    setErro(null);
    guardar();
    // Sem sessão abre a janela; depois de entrar, a pessoa volta a carregar em publicar.
    exigirSessao(() => void enviar(v), { motivo: "Para abrir um tópico no fórum precisa de sessão." });
  };

  if (enviado) {
    return (
      <div className="painel painel-escuro p-6 sm:p-8" role="status">
        <CheckCircle2 className="size-9 text-[#4ade80]" aria-hidden />
        <h2 className="titulo-4 mt-5 text-white">{t.aguardaTitulo}</h2>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-white/90">{t.aguardaTexto}</p>
        <Link href="/forum" className="mt-6 inline-flex text-[15px] font-semibold text-white">
          <span className="sublinhado">Voltar ao fórum</span>
        </Link>
      </div>
    );
  }

  const nomeMeta = utilizador?.user_metadata?.nome;
  const nome = perfil?.nome || (typeof nomeMeta === "string" ? nomeMeta : "") || utilizador?.email || "";
  const erroDe = (c: "titulo" | "categoria" | "corpo") => (erro?.campo === c ? erro.texto : null);
  const rotulo = "mb-2 block text-[15px] font-semibold text-white";
  const ajuda = "mt-1.5 text-[13px] text-white/80";

  return (
    <form ref={form} onSubmit={publicar} onInput={() => { guardar(); if (erro) setErro(null); }} noValidate
      className="painel painel-escuro grid gap-6 p-5 sm:p-7">
      <div>
        <label htmlFor="topico-titulo" className={rotulo}>{t.campoTitulo}</label>
        <input
          ref={campoTitulo}
          id="topico-titulo"
          name="titulo"
          maxLength={TITULO_MAX}
          autoComplete="off"
          placeholder={t.tituloPlaceholder}
          aria-invalid={Boolean(erroDe("titulo"))}
          aria-describedby="topico-titulo-ajuda"
          className="campo text-base placeholder:text-white/70"
        />
        <p id="topico-titulo-ajuda" className={erroDe("titulo") ? "mt-1.5 text-[13px] font-medium text-[#ff8a80]" : ajuda}>
          {erroDe("titulo") ?? t.tituloAjuda}
        </p>
      </div>

      <fieldset>
        <legend className={rotulo}>{t.campoCategoria}</legend>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <label
              key={c.slug}
              className="group relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-[4px] bg-white/8 pl-1.5 pr-3 text-sm text-white transition-colors hover:bg-white/15 has-[:checked]:bg-white has-[:checked]:text-[#141418] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-mb-red-light"
              title={c.descricao}
            >
              <input type="radio" name="categoria" value={c.slug} defaultChecked={c.slug === categoriaInicial} className="sr-only" />
              <span aria-hidden className="grid size-7 place-items-center rounded-[3px]" style={{ background: c.cor, color: textoSobre(c.cor) }}>
                <Icon name={c.icone} className="size-3.5" />
              </span>
              <span className="font-medium">{c.nome}</span>
            </label>
          ))}
        </div>
        {erroDe("categoria") && <p className="mt-2 text-[13px] font-medium text-[#ff8a80]">{erroDe("categoria")}</p>}
      </fieldset>

      <div>
        <label htmlFor="topico-corpo" className={rotulo}>{t.campoCorpo}</label>
        <textarea
          ref={campoCorpo}
          id="topico-corpo"
          name="corpo"
          rows={9}
          maxLength={CORPO_MAX}
          placeholder={t.corpoPlaceholder}
          aria-invalid={Boolean(erroDe("corpo"))}
          aria-describedby="topico-corpo-ajuda"
          className="campo resize-y text-base placeholder:text-white/70"
        />
        <p id="topico-corpo-ajuda" className={erroDe("corpo") ? "mt-1.5 text-[13px] font-medium text-[#ff8a80]" : ajuda}>
          {erroDe("corpo") ?? t.corpoAjuda}
        </p>
      </div>

      {erro && !erro.campo && (
        <p role="alert" className="rounded-[var(--raio)] bg-mb-red/20 px-4 py-3 text-sm font-medium text-white ring-1 ring-inset ring-mb-red/60">
          {erro.texto}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
        <p className="text-sm text-white/85" aria-live="polite">
          {utilizador ? (
            <>
              <span>{t.aPublicarComo}</span>{" "}
              <span className="font-semibold text-white">{nome}</span>
            </>
          ) : (
            <span>{t.semSessao}</span>
          )}
        </p>
        <button
          type="submit"
          disabled={aEnviar}
          className="inline-flex h-12 items-center gap-2.5 rounded-[var(--raio)] bg-mb-red px-6 text-[15px] font-semibold text-white transition-colors hover:bg-mb-red-dark disabled:opacity-70"
        >
          {aEnviar ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" aria-hidden />
              <span>{t.aPublicar}</span>
            </>
          ) : (
            <>
              <span>{t.publicar}</span>
              <Icon name="arrow" className="size-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
