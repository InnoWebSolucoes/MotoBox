"use client";

/* ============================================================
   MOTOBOX — Área de membro: segurança
   Mudar a palavra-passe (com a actual confirmada antes, excepto
   em contas que entraram pelo Google e ainda não têm uma) e
   terminar as sessões abertas noutros dispositivos ou em todos.
   ============================================================ */

import { useState } from "react";
import { CampoPalavraPasse } from "@/components/CampoPalavraPasse";
import { Button, Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth/contexto";
import { authConfigurada, supabaseNavegador } from "@/lib/auth/clientes";
import { comBase } from "@/lib/base";
import { Rotulo, TituloBloco, campo, diaMesLongo, f, useTextosConta } from "./partes";

/** "9 de Outubro de 2026 às 09:12", em hora de Luanda (UTC+1). */
function quando(iso: string | null | undefined): string {
  const ms = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms + 3_600_000);
  const hora = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return `${diaMesLongo(d.toISOString())} de ${d.getUTCFullYear()} às ${hora}`;
}

export function SeparadorSeguranca({ email, provedor, ultimaEntrada }: {
  email: string; provedor: string; ultimaEntrada: string | null;
}) {
  const t = useTextosConta().seguranca;
  const { entrar, definirPalavra, sair } = useAuth();
  const pedeActual = provedor === "email";

  const [actual, setActual] = useState("");
  const [nova, setNova] = useState("");
  const [repetida, setRepetida] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const [aviso, setAviso] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);

  const [aTerminar, setATerminar] = useState<"outras" | "todas" | null>(null);
  const [avisoSessoes, setAvisoSessoes] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);

  const mudarPalavra = async (e: React.FormEvent) => {
    e.preventDefault();
    setAviso(null);
    if (nova.length < 8) { setAviso({ tom: "erro", texto: t.curta }); return; }
    if (nova !== repetida) { setAviso({ tom: "erro", texto: t.naoCoincide }); return; }
    setAGuardar(true);
    if (pedeActual) {
      // Entrar de novo com a actual confirma-a (e deixa a sessão recente, como o Supabase pede).
      const falha = await entrar(email, actual);
      if (falha) { setAGuardar(false); setAviso({ tom: "erro", texto: /incorret/i.test(falha) ? t.actualErrada : falha }); return; }
    }
    const falha = await definirPalavra(nova);
    setAGuardar(false);
    if (falha) { setAviso({ tom: "erro", texto: falha }); return; }
    setActual(""); setNova(""); setRepetida("");
    setAviso({ tom: "ok", texto: t.sucesso });
  };

  const terminarOutras = async () => {
    setAvisoSessoes(null);
    if (!authConfigurada) { setAvisoSessoes({ tom: "erro", texto: "A autenticação ainda não está configurada." }); return; }
    setATerminar("outras");
    const { error } = await supabaseNavegador().auth.signOut({ scope: "others" });
    setATerminar(null);
    setAvisoSessoes(error ? { tom: "erro", texto: error.message } : { tom: "ok", texto: t.outrasFeito });
  };

  const terminarTodas = async () => {
    setATerminar("todas");
    await sair();
    window.location.replace(comBase("/"));
  };

  const caixaAviso = (a: { tom: "ok" | "erro"; texto: string }) => (
    <p role={a.tom === "erro" ? "alert" : "status"}
      className={`rounded-[var(--raio)] px-3.5 py-2.5 text-sm ${a.tom === "ok" ? "bg-ok/20 text-[#86efac]" : "bg-mb-red/20 text-[#ffb4ae]"}`}>
      {a.texto}
    </p>
  );

  return (
    <div className="grid gap-[var(--intervalo)] lg:grid-cols-[1.3fr_1fr] lg:items-start">
      <section className="painel painel-escuro p-5 md:p-6">
        <TituloBloco titulo={t.palavraTitulo} texto={t.palavraTexto} />
        {!pedeActual && <p className="mt-4 rounded-[var(--raio)] bg-white/8 px-3.5 py-2.5 text-sm text-white/90">{t.google}</p>}
        <form onSubmit={mudarPalavra} className="mt-5 space-y-4">
          {/* Para os gestores de palavras-passe saberem de que conta se trata. */}
          <input type="email" name="email" value={email} autoComplete="username" readOnly hidden />
          {pedeActual && (
            <Rotulo texto={t.actual}>
              <CampoPalavraPasse className={campo} value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" required />
            </Rotulo>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Rotulo texto={t.nova}>
              <CampoPalavraPasse className={campo} value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" minLength={8} required />
            </Rotulo>
            <Rotulo texto={t.confirmar}>
              <CampoPalavraPasse className={campo} value={repetida} onChange={(e) => setRepetida(e.target.value)} autoComplete="new-password" minLength={8} required />
            </Rotulo>
          </div>
          {aviso && caixaAviso(aviso)}
          <Button type="submit" disabled={aGuardar}>
            <Icon name="lock" className="size-4" />
            {aGuardar ? "A guardar…" : t.guardar}
          </Button>
        </form>
      </section>

      <div className="grid gap-[var(--intervalo)]">
        <section className="painel painel-escuro p-5 md:p-6">
          <TituloBloco titulo={t.sessoesTitulo} texto={t.sessoesTexto} />
          {ultimaEntrada && <p className="mt-3 text-sm text-white/80">{f(t.ultimaEntrada, { data: quando(ultimaEntrada) })}</p>}
          <div className="mt-5 flex flex-col gap-[var(--intervalo)]">
            <Button variant="dark" onClick={terminarOutras} disabled={aTerminar !== null} className="justify-start">
              <Icon name="shield" className="size-4" />
              {aTerminar === "outras" ? "A terminar…" : t.outras}
            </Button>
            <Button variant="dark" onClick={terminarTodas} disabled={aTerminar !== null} className="justify-start">
              <Icon name="logout" className="size-4" />
              {aTerminar === "todas" ? "A sair…" : t.todas}
            </Button>
          </div>
          {avisoSessoes && <div className="mt-4">{caixaAviso(avisoSessoes)}</div>}
        </section>

        <section className="painel painel-escuro p-5 md:p-6">
          <TituloBloco titulo={t.emailTitulo} />
          <p className="mt-2 break-words text-[15px] text-white">{email}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{t.emailTexto}</p>
        </section>
      </div>
    </div>
  );
}
