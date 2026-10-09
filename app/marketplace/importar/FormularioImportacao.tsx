"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, Icon } from "@/components/ui";
import { useExigirSessao } from "@/components/SessaoObrigatoria";
import { useAuth } from "@/lib/auth/contexto";
import { useIdioma } from "@/lib/i18n/contexto";
import { comBase } from "@/lib/base";
import type { Bi, FORM as FORM_PADRAO } from "./conteudo";
import {
  CATEGORIAS_IMPORTACAO, MENSAGENS_ERRO, PROVINCIAS_ANGOLA, validarPedido, type CampoPedido,
} from "./opcoes";

/* ============================================================
   MOTOBOX — Formulário "Pedir importação"
   Qualquer pessoa preenche; enviar pede sessão (janela "Entre
   para continuar" na própria página). O rascunho fica neste
   navegador: quem cria conta volta pela ligação do email com a
   página recarregada e encontra tudo como deixou. Os textos
   chegam por props (conteúdo editável), nas duas línguas.
   ============================================================ */

type TextosForm = typeof FORM_PADRAO;

const RASCUNHO = "motobox-importacao-rascunho";

interface Campos {
  ligacao: string;
  titulo: string;
  categoria: string;
  quantidade: string;
  nome: string;
  email: string;
  telefone: string;
  provincia: string;
  notas: string;
}

const VAZIO: Campos = {
  ligacao: "", titulo: "", categoria: "peca", quantidade: "1",
  nome: "", email: "", telefone: "", provincia: "", notas: "",
};

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

export function FormularioImportacao({ textos }: { textos: TextosForm }) {
  // O servidor desenha o formulário vazio; no navegador, volta a montar-se com o rascunho.
  const noNavegador = useSyncExternalStore(semSubscricao, () => true, () => false);
  return <Formulario key={noNavegador ? "navegador" : "servidor"} restaurar={noNavegador} FORM={textos} />;
}

function Formulario({ restaurar, FORM }: { restaurar: boolean; FORM: TextosForm }) {
  const { idioma } = useIdioma();
  const x = (v: Bi | undefined) => v?.[idioma] ?? "";
  const { perfil, utilizador } = useAuth();
  const exigirSessao = useExigirSessao();

  const [form, setForm] = useState<Campos>(() => (restaurar ? lerRascunho() : null) ?? VAZIO);
  const [erros, setErros] = useState<Partial<Record<CampoPedido | "geral", string>>>({});
  const [estado, setEstado] = useState<"idle" | "a-enviar" | "ok">("idle");
  const [site, setSite] = useState(""); // armadilha para robôs
  const [preenchido, setPreenchido] = useState(false);

  // Com sessão, o nome e o email da conta entram sozinhos nos campos vazios.
  const nomeConta = perfil?.nome ?? (typeof utilizador?.user_metadata?.nome === "string" ? utilizador.user_metadata.nome : "");
  const emailConta = perfil?.email ?? utilizador?.email ?? "";
  if (!preenchido && (nomeConta || emailConta)) {
    setPreenchido(true);
    setForm((f) => ({
      ...f,
      nome: f.nome || nomeConta,
      email: f.email || emailConta,
      telefone: f.telefone || perfil?.telefone || "",
    }));
  }

  // Guarda o rascunho a cada alteração (só no navegador, e só enquanto há algo escrito).
  useEffect(() => {
    if (!restaurar || estado === "ok") return;
    const algo = form.ligacao.trim() || form.titulo.trim() || form.notas.trim();
    guardarRascunho(algo ? form : null);
  }, [form, restaurar, estado]);

  const mudar = (k: keyof Campos, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErros((e) => ({ ...e, [k]: undefined, geral: undefined }));
  };

  function validar(): boolean {
    const { erros: e } = validarPedido({ ...form, quantidade: Number(form.quantidade) });
    const mensagens: Partial<Record<CampoPedido, string>> = {};
    for (const [campo, codigo] of Object.entries(e)) {
      if (codigo) mensagens[campo as CampoPedido] = MENSAGENS_ERRO[codigo][idioma];
    }
    setErros(mensagens);
    const primeiro = Object.keys(mensagens)[0];
    if (primeiro) document.getElementById(`imp-${primeiro}`)?.focus();
    return !primeiro;
  }

  async function enviar() {
    setEstado("a-enviar");
    try {
      const r = await fetch(comBase("/api/importacao"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantidade: Number(form.quantidade), site }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErros({ geral: String(j.erro ?? x(FORM.erroGeral)) });
        setEstado("idle");
        return;
      }
      guardarRascunho(null);
      setEstado("ok");
    } catch {
      setErros({ geral: x(FORM.semLigacao) });
      setEstado("idle");
    }
  }

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    // Sem sessão, abre a janela; ao entrar, o pedido segue sozinho.
    exigirSessao(() => void enviar(), { motivo: x(FORM.motivo), continuar: true });
  }

  if (estado === "ok") {
    return (
      <div className="rounded-card bg-ink-950 p-8 text-center sm:p-10" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-ok/20 text-ok">
          <Icon name="check" className="size-7" />
        </span>
        <h3 className="title-xl mt-5 text-2xl">{x(FORM.sucessoTitulo)}</h3>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-300 leading-relaxed">
          {x(FORM.sucessoTexto)
            .replace("{nome}", form.nome.split(" ")[0] ?? "")
            .replace("{email}", form.email)}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setForm((f) => ({ ...VAZIO, nome: f.nome, email: f.email, telefone: f.telefone, provincia: f.provincia }));
            setEstado("idle");
          }}
        >
          {x(FORM.outro)}
        </Button>
      </div>
    );
  }

  const campo = (k: CampoPedido) =>
    `w-full bg-ink-900 px-4 text-sm text-white ring-inset placeholder:text-ink-300 outline-none transition-shadow ${
      erros[k] ? "ring-2 ring-mb-red" : "ring-1 ring-white/10 focus:ring-2 focus:ring-mb-red"
    }`;
  const rotulo = "eyebrow mb-2 block text-ink-300";
  const erro = (k: CampoPedido) =>
    erros[k] ? <p id={`imp-${k}-erro`} className="mt-1.5 text-xs text-mb-red-light">{erros[k]}</p> : null;
  const ligar = (k: CampoPedido) => ({
    id: `imp-${k}`,
    "aria-invalid": Boolean(erros[k]),
    "aria-describedby": erros[k] ? `imp-${k}-erro` : undefined,
  });

  return (
    <form onSubmit={submeter} noValidate className="space-y-5 rounded-card bg-ink-950 p-6 sm:p-8">
      <div>
        <label htmlFor="imp-ligacao" className={rotulo}>
          {x(FORM.ligacao)} <span className="text-mb-red-light">*</span>
        </label>
        <input
          {...ligar("ligacao")}
          type="url"
          inputMode="url"
          autoComplete="off"
          value={form.ligacao}
          onChange={(e) => mudar("ligacao", e.target.value)}
          placeholder={x(FORM.ligacaoPh)}
          className={`h-12 ${campo("ligacao")}`}
        />
        {erro("ligacao")}
      </div>

      <div>
        <label htmlFor="imp-titulo" className={rotulo}>
          {x(FORM.titulo)} <span className="text-mb-red-light">*</span>
        </label>
        <input
          {...ligar("titulo")}
          type="text"
          maxLength={120}
          value={form.titulo}
          onChange={(e) => mudar("titulo", e.target.value)}
          placeholder={x(FORM.tituloPh)}
          className={`h-12 ${campo("titulo")}`}
        />
        {erro("titulo")}
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
        <div>
          <label htmlFor="imp-categoria" className={rotulo}>{x(FORM.categoria)}</label>
          <select
            {...ligar("categoria")}
            value={form.categoria}
            onChange={(e) => mudar("categoria", e.target.value)}
            className={`h-12 ${campo("categoria")}`}
          >
            {CATEGORIAS_IMPORTACAO.map((c) => (
              <option key={c.id} value={c.id}>{c[idioma]}</option>
            ))}
          </select>
          {erro("categoria")}
        </div>
        <div>
          <label htmlFor="imp-quantidade" className={rotulo}>{x(FORM.quantidade)}</label>
          <input
            {...ligar("quantidade")}
            type="number"
            min={1}
            max={50}
            step={1}
            inputMode="numeric"
            value={form.quantidade}
            onChange={(e) => mudar("quantidade", e.target.value)}
            className={`h-12 tabular-nums ${campo("quantidade")}`}
          />
          {erro("quantidade")}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="imp-nome" className={rotulo}>
            {x(FORM.nome)} <span className="text-mb-red-light">*</span>
          </label>
          <input
            {...ligar("nome")}
            type="text"
            autoComplete="name"
            value={form.nome}
            onChange={(e) => mudar("nome", e.target.value)}
            placeholder={x(FORM.nomePh)}
            className={`h-12 ${campo("nome")}`}
          />
          {erro("nome")}
        </div>
        <div>
          <label htmlFor="imp-email" className={rotulo}>
            {x(FORM.email)} <span className="text-mb-red-light">*</span>
          </label>
          <input
            {...ligar("email")}
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => mudar("email", e.target.value)}
            placeholder={x(FORM.emailPh)}
            className={`h-12 ${campo("email")}`}
          />
          {erro("email")}
        </div>
        <div>
          <label htmlFor="imp-telefone" className={rotulo}>
            {x(FORM.telefone)} <span className="normal-case tracking-normal text-ink-300">({x(FORM.opcional)})</span>
          </label>
          <input
            {...ligar("telefone")}
            type="tel"
            autoComplete="tel"
            value={form.telefone}
            onChange={(e) => mudar("telefone", e.target.value)}
            placeholder={x(FORM.telefonePh)}
            className={`h-12 ${campo("telefone")}`}
          />
          {erro("telefone")}
        </div>
        <div>
          <label htmlFor="imp-provincia" className={rotulo}>
            {x(FORM.provincia)} <span className="text-mb-red-light">*</span>
          </label>
          <select
            {...ligar("provincia")}
            value={form.provincia}
            onChange={(e) => mudar("provincia", e.target.value)}
            className={`h-12 ${campo("provincia")} ${form.provincia ? "" : "text-ink-300"}`}
          >
            <option value="">{x(FORM.escolha)}</option>
            {PROVINCIAS_ANGOLA.map((p) => (
              <option key={p} value={p} className="text-white">{p}</option>
            ))}
          </select>
          {erro("provincia")}
        </div>
      </div>

      <div>
        <label htmlFor="imp-notas" className={rotulo}>
          {x(FORM.notas)} <span className="normal-case tracking-normal text-ink-300">({x(FORM.opcional)})</span>
        </label>
        <textarea
          {...ligar("notas")}
          rows={4}
          maxLength={2000}
          value={form.notas}
          onChange={(e) => mudar("notas", e.target.value)}
          placeholder={x(FORM.notasPh)}
          className={`resize-y py-3 ${campo("notas")}`}
        />
        {erro("notas")}
      </div>

      <input type="text" tabIndex={-1} autoComplete="off" value={site}
        onChange={(e) => setSite(e.target.value)} className="hidden" aria-hidden />

      {erros.geral && (
        <p role="alert" className="rounded-xl bg-mb-red/10 px-4 py-3 text-sm text-mb-red-light">{erros.geral}</p>
      )}

      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={estado === "a-enviar"} className="sm:shrink-0">
          {estado === "a-enviar" ? x(FORM.aEnviar) : x(FORM.enviar)}
          {estado !== "a-enviar" && <Icon name="arrow" className="size-4" />}
        </Button>
        <p className="text-xs text-ink-300 leading-relaxed">
          {utilizador ? x(FORM.privacidade) : x(FORM.sessaoNota)}
        </p>
      </div>
    </form>
  );
}
