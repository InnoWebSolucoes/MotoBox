"use client";

import { Fragment, useState } from "react";
import { Check } from "lucide-react";
import { comBase } from "@/lib/base";
import type { ConteudoContacto } from "@/lib/conteudo/grupos/paginas";

/* ============================================================
   MOTOBOX — Formulário de contacto
   Vai para /api/contacto, que guarda em Mensagens no painel.
   `site` é a armadilha para robôs. Um ?assunto= no endereço
   (vindo da página de um clube ou de eventos) já chega escrito.
   Os textos chegam por props (conteúdo editável "paginas.contacto").
   ============================================================ */

type Textos = ConteudoContacto["formulario"];

/** O assunto já escolhido quando a página abre (um ?assunto= vindo de um clube ou de um evento). */
function assuntoInicial(assuntos: Textos["assuntos"], texto?: string) {
  const existe = (id: string) => assuntos.some((a) => a.id === id);
  const primeiro = assuntos[0]?.id ?? "";
  // Sem pedido, o primeiro da lista; com pedido, o mais parecido, ou o último ("Outro assunto").
  if (!texto) return { id: existe("informacao") ? "informacao" : primeiro, extra: "" };
  const t = texto.toLowerCase();
  const outro = existe("outro") ? "outro" : (assuntos.at(-1)?.id ?? primeiro);
  if (t.includes("clube")) return { id: existe("clube") ? "clube" : outro, extra: texto };
  if (t.includes("evento")) return { id: existe("evento") ? "evento" : outro, extra: texto };
  return { id: outro, extra: texto };
}

/** "Obrigado, {nome}. … para {email}." com o email destacado. */
function Agradecimento({ modelo, nome, email }: { modelo: string; nome: string; email: string }) {
  const partes = modelo.replace(/\{nome\}/g, nome).split("{email}");
  return (
    <>
      {partes.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-white">{email}</span>}
          {p}
        </Fragment>
      ))}
    </>
  );
}

export function ContactoClient({ assunto: pedido, textos: x }: { assunto?: string; textos: Textos }) {
  const ASSUNTOS = x.assuntos;
  const inicio = assuntoInicial(ASSUNTOS, pedido);
  const [assunto, setAssunto] = useState(inicio.id);
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", organizacao: "",
    mensagem: inicio.extra ? `${inicio.extra}.\n\n` : "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<"parado" | "a-enviar" | "ok">("parado");
  const [site, setSite] = useState("");

  const mudar = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.nome.trim().length < 3) err.nome = x.erroNome;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) err.email = x.erroEmail;
    if (form.mensagem.trim().length < 10) err.mensagem = x.erroMensagem;
    setErros(err);
    if (Object.keys(err).length > 0) return;

    setEstado("a-enviar");
    try {
      const r = await fetch(comBase("/api/contacto"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assunto: inicio.extra && assunto === inicio.id ? inicio.extra : ASSUNTOS.find((a) => a.id === assunto)?.nome ?? assunto,
          site,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErros({ geral: String(j.erro ?? x.erroGeral) });
        setEstado("parado");
        return;
      }
      setEstado("ok");
    } catch {
      setErros({ geral: x.erroRede });
      setEstado("parado");
    }
  }

  if (estado === "ok") {
    return (
      <div className="flex min-h-96 flex-col justify-end" role="status">
        <span className="chip-mb chip-mb-lg" aria-hidden><Check /></span>
        <h2 className="titulo-3 mt-8">{x.sucessoTitulo}</h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75">
          <Agradecimento modelo={x.sucessoTexto} nome={form.nome.split(" ")[0]} email={form.email} />
        </p>
        <button
          type="button"
          onClick={() => {
            setEstado("parado");
            setForm({ nome: "", email: "", telefone: "", organizacao: "", mensagem: "" });
          }}
          className="mt-8 inline-flex h-12 w-fit items-center rounded-[var(--raio)] bg-white/10 px-5 text-sm transition-colors hover:bg-white/20"
        >
          {x.outra}
        </button>
      </div>
    );
  }

  const erro = (k: string) =>
    erros[k] ? <span className="mt-1.5 block text-xs text-mb-red-light">{erros[k]}</span> : null;
  const rotulo = "mb-2 block text-sm text-white/70";

  return (
    <form onSubmit={submeter} noValidate className="space-y-8">
      <fieldset>
        <legend className="mb-4 text-lg font-semibold">{x.assuntosTitulo}</legend>
        <div className="grid gap-[var(--intervalo)] sm:grid-cols-2">
          {ASSUNTOS.map((a) => (
            <label
              key={a.id}
              className={`flex cursor-pointer items-start gap-3 rounded-[var(--raio)] p-4 transition-colors ${
                assunto === a.id ? "bg-mb-red text-white" : "bg-white/6 hover:bg-white/10"
              }`}
            >
              <input
                type="radio"
                name="assunto"
                checked={assunto === a.id}
                onChange={() => setAssunto(a.id)}
                className="mt-1 size-4 shrink-0 accent-white"
              />
              <span className="min-w-0">
                <span className="block text-[15px] font-medium">{a.nome}</span>
                <span className={`mt-0.5 block text-xs ${assunto === a.id ? "text-white/85" : "text-white/55"}`}>{a.texto}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={rotulo}>{x.nome}</span>
          <input value={form.nome} onChange={mudar("nome")} className="campo" autoComplete="name" />
          {erro("nome")}
        </label>
        <label className="block">
          <span className={rotulo}>{x.email}</span>
          <input type="email" value={form.email} onChange={mudar("email")} className="campo" autoComplete="email" placeholder={x.emailExemplo} />
          {erro("email")}
        </label>
        <label className="block">
          <span className={rotulo}>{x.telefone} <span className="text-white/40">{x.opcional}</span></span>
          <input type="tel" value={form.telefone} onChange={mudar("telefone")} className="campo" autoComplete="tel" placeholder={x.telefoneExemplo} />
        </label>
        <label className="block">
          <span className={rotulo}>{x.organizacao} <span className="text-white/40">{x.opcional}</span></span>
          <input value={form.organizacao} onChange={mudar("organizacao")} className="campo" autoComplete="organization" />
        </label>
        <label className="block sm:col-span-2">
          <span className={rotulo}>{x.mensagem}</span>
          <textarea value={form.mensagem} onChange={mudar("mensagem")} rows={6} className="campo resize-y" />
          {erro("mensagem")}
        </label>
      </div>

      <input
        type="text" tabIndex={-1} autoComplete="off" aria-hidden value={site}
        onChange={(e) => setSite(e.target.value)} className="hidden" name="site"
      />

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={estado === "a-enviar"}
          className="group inline-flex h-14 min-w-56 items-center justify-between gap-6 rounded-[var(--raio)] bg-mb-red px-5 text-[15px] text-white transition-colors hover:bg-mb-red-dark disabled:opacity-60"
        >
          {estado === "a-enviar" ? x.aEnviar : x.enviar}
          <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
            <path fill="currentColor" d="M0 11.6 9.6 2H1V0h12v12h-2V3.4L1.4 13z" />
          </svg>
        </button>
        {erros.geral && <p className="text-sm text-mb-red-light" role="alert">{erros.geral}</p>}
      </div>
    </form>
  );
}
