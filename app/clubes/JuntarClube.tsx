"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { comBase } from "@/lib/base";
import { PROVINCIAS } from "@/lib/provincias";
import { TIPOS_CLUBE } from "./comum";

/* ============================================================
   "Tem um clube? Junte-o à MotoBox"
   Segue pelo mesmo caminho do contacto (/api/contacto, que cai
   em Mensagens no painel), com assunto próprio para a equipa
   saber que é um clube a registar.
   ============================================================ */

export function JuntarClube() {
  const [form, setForm] = useState({
    clube: "", tipo: "Moto-turismo", provincia: "Luanda", redes: "",
    nome: "", email: "", telefone: "", mensagem: "",
  });
  const [site, setSite] = useState(""); // armadilha para robôs
  const [erros, setErros] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<"parado" | "a-enviar" | "ok">("parado");

  const mudar = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.clube.trim().length < 2) err.clube = "Indique o nome do clube.";
    if (form.nome.trim().length < 3) err.nome = "Indique o seu nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) err.email = "Email inválido.";
    setErros(err);
    if (Object.keys(err).length) return;

    // A mensagem leva os dados do clube arrumados, para a equipa criar a página no painel.
    const mensagem = [
      `Clube: ${form.clube.trim()}`,
      `Tipo: ${form.tipo}`,
      `Província: ${form.provincia}`,
      `Redes / site: ${form.redes.trim() || "(não indicado)"}`,
      "",
      form.mensagem.trim() || "Gostaríamos de ter o nosso clube na MotoBox.",
    ].join("\n");

    setEstado("a-enviar");
    try {
      const r = await fetch(comBase("/api/contacto"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome, email: form.email, telefone: form.telefone,
          organizacao: form.clube, assunto: "Registar um clube", mensagem, site,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErros({ geral: String(j.erro ?? "Não foi possível enviar. Tente de novo.") });
        setEstado("parado");
        return;
      }
      setEstado("ok");
    } catch {
      setErros({ geral: "Sem ligação à internet. Tente de novo." });
      setEstado("parado");
    }
  }

  if (estado === "ok") {
    return (
      <div className="flex min-h-72 flex-col justify-end" role="status">
        <span className="chip-mb chip-mb-lg" aria-hidden><Check /></span>
        <p className="titulo-4 mt-8">Pedido recebido</p>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75">
          Obrigado. A equipa da MotoBox vai confirmar os dados do {form.clube.trim() || "clube"} e responde
          para <span className="text-white">{form.email}</span>.
        </p>
      </div>
    );
  }

  const erro = (k: string) =>
    erros[k] ? <span className="mt-1.5 block text-xs text-mb-red-light">{erros[k]}</span> : null;
  const rotulo = "mb-2 block text-sm text-white/70";

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className={rotulo}>Nome do clube</span>
        <input value={form.clube} onChange={mudar("clube")} className="campo" placeholder="Ex.: Motards do Kwanza" autoComplete="organization" />
        {erro("clube")}
      </label>
      <label className="block">
        <span className={rotulo}>Tipo</span>
        <select value={form.tipo} onChange={mudar("tipo")} className="campo">
          {TIPOS_CLUBE.map((t) => (
            <option key={t.tipo} value={t.tipo}>{t.nome}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={rotulo}>Província</span>
        <select value={form.provincia} onChange={mudar("provincia")} className="campo">
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={rotulo}>Instagram, Facebook ou site</span>
        <input value={form.redes} onChange={mudar("redes")} className="campo" placeholder="@o_nosso_clube" />
      </label>
      <label className="block">
        <span className={rotulo}>O seu nome</span>
        <input value={form.nome} onChange={mudar("nome")} className="campo" autoComplete="name" />
        {erro("nome")}
      </label>
      <label className="block">
        <span className={rotulo}>Email</span>
        <input type="email" value={form.email} onChange={mudar("email")} className="campo" autoComplete="email" placeholder="o.seu@email.ao" />
        {erro("email")}
      </label>
      <label className="block sm:col-span-2">
        <span className={rotulo}>Sobre o clube <span className="text-white/40">(opcional)</span></span>
        <textarea
          value={form.mensagem}
          onChange={mudar("mensagem")}
          rows={3}
          className="campo resize-y"
          placeholder="O que fazem, onde se encontram, desde quando existem."
        />
      </label>
      {/* Campo que as pessoas não vêem: só um robô o preenche. */}
      <input
        type="text" tabIndex={-1} autoComplete="off" aria-hidden value={site}
        onChange={(e) => setSite(e.target.value)} className="hidden" name="site"
      />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={estado === "a-enviar"}
          className="group inline-flex h-14 min-w-56 items-center justify-between gap-6 rounded-[var(--raio)] bg-mb-red px-5 text-[15px] text-white transition-colors hover:bg-mb-red-dark disabled:opacity-60"
        >
          {estado === "a-enviar" ? "A enviar..." : "Enviar o clube"}
          <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
            <path fill="currentColor" d="M0 11.6 9.6 2H1V0h12v12h-2V3.4L1.4 13z" />
          </svg>
        </button>
        <p className="text-xs text-white/50">A equipa confirma os dados antes de publicar a página.</p>
      </div>
      {erros.geral && <p className="text-sm text-mb-red-light sm:col-span-2" role="alert">{erros.geral}</p>}
    </form>
  );
}
