"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { comBase } from "@/lib/base";
import { PROVINCIAS } from "@/lib/provincias";
import { TIPOS_CLUBE } from "./comum";

/* ============================================================
   "Tem um clube? Junte-o à Motobox"
   Pequeno formulário que segue pelo mesmo caminho do contacto
   (/api/contacto → Mensagens no painel), com o assunto próprio
   para a equipa saber que é um clube a registar.
   ============================================================ */

const campo =
  "w-full rounded-[0.625rem] bg-ink-950 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-600 outline-none ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-mb-red";

export function JuntarClube() {
  const [form, setForm] = useState({
    clube: "", tipo: "Moto-turismo", provincia: "Luanda", redes: "",
    nome: "", email: "", telefone: "", mensagem: "",
  });
  const [site, setSite] = useState(""); // armadilha para robôs
  const [erros, setErros] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<"idle" | "a-enviar" | "ok">("idle");

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
      form.mensagem.trim() || "Gostaríamos de ter o nosso clube na Motobox.",
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
        setEstado("idle");
        return;
      }
      setEstado("ok");
    } catch {
      setErros({ geral: "Sem ligação à internet. Tente de novo." });
      setEstado("idle");
    }
  }

  if (estado === "ok") {
    return (
      <div className="rounded-card bg-ink-950/70 p-8 text-center" role="status">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-ok/20 text-ok">
          <Icon name="check" className="size-6" />
        </span>
        <p className="mt-4 font-display text-xl uppercase text-white">Pedido recebido</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-400">
          Obrigado. A equipa da Motobox vai confirmar os dados do {form.clube.trim() || "clube"} e responde
          para <span className="text-white">{form.email}</span>.
        </p>
      </div>
    );
  }

  const erro = (k: string) =>
    erros[k] ? <span className="mt-1 block text-xs text-mb-red">{erros[k]}</span> : null;

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="eyebrow mb-1.5 block text-ink-300">Nome do clube</span>
        <input value={form.clube} onChange={mudar("clube")} className={campo} placeholder="Ex.: Motards do Kwanza" autoComplete="organization" />
        {erro("clube")}
      </label>
      <label className="block">
        <span className="eyebrow mb-1.5 block text-ink-300">Tipo</span>
        <select value={form.tipo} onChange={mudar("tipo")} className={campo}>
          {TIPOS_CLUBE.map((t) => (
            <option key={t.tipo} value={t.tipo} className="bg-ink-900">{t.nome}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="eyebrow mb-1.5 block text-ink-300">Província</span>
        <select value={form.provincia} onChange={mudar("provincia")} className={campo}>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p} className="bg-ink-900">{p}</option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="eyebrow mb-1.5 block text-ink-300">Instagram, Facebook ou site</span>
        <input value={form.redes} onChange={mudar("redes")} className={campo} placeholder="@o_nosso_clube" />
      </label>
      <label className="block">
        <span className="eyebrow mb-1.5 block text-ink-300">O seu nome</span>
        <input value={form.nome} onChange={mudar("nome")} className={campo} autoComplete="name" />
        {erro("nome")}
      </label>
      <label className="block">
        <span className="eyebrow mb-1.5 block text-ink-300">Email</span>
        <input type="email" value={form.email} onChange={mudar("email")} className={campo} autoComplete="email" placeholder="o.seu@email.ao" />
        {erro("email")}
      </label>
      <label className="block sm:col-span-2">
        <span className="eyebrow mb-1.5 block text-ink-300">Sobre o clube <span className="normal-case tracking-normal text-ink-600">(opcional)</span></span>
        <textarea
          value={form.mensagem}
          onChange={mudar("mensagem")}
          rows={3}
          className={`${campo} resize-y`}
          placeholder="O que fazem, onde se encontram, desde quando existem."
        />
      </label>
      {/* Campo que as pessoas não vêem: só um robô o preenche. */}
      <input
        type="text" tabIndex={-1} autoComplete="off" aria-hidden value={site}
        onChange={(e) => setSite(e.target.value)} className="hidden" name="site"
      />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" disabled={estado === "a-enviar"}>
          {estado === "a-enviar" ? "A enviar…" : "Enviar o clube"}
          <Icon name="arrow" className="size-4" />
        </Button>
        <p className="text-xs text-ink-500">A equipa confirma os dados antes de publicar a página.</p>
      </div>
      {erros.geral && <p className="text-sm text-mb-red sm:col-span-2" role="alert">{erros.geral}</p>}
    </form>
  );
}
