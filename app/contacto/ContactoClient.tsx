"use client";

import { useState } from "react";
import { Button, Icon, PageHero } from "@/components/ui";
import { SOCIAIS } from "@/lib/data";
import type { LigacaoRede } from "@/lib/redes";
import { comBase } from "@/lib/base";

const ASSUNTOS = [
  { id: "informacao", label: "Pedido de informação", desc: "Dúvidas sobre provas, calendário ou bilhetes." },
  { id: "evento", label: "Divulgar um evento", desc: "Quer que a sua prova ou passeio entre no calendário." },
  { id: "parcerias", label: "Parcerias e patrocínios", desc: "Marcas, clubes organizadores e bilhética." },
  { id: "conteudo", label: "Enviar conteúdo", desc: "Fotografias, resultados ou uma história para publicar." },
  { id: "imprensa", label: "Imprensa", desc: "Pedidos de entrevista e material para media." },
  { id: "outro", label: "Outro assunto", desc: "Tudo o resto." },
];

export function ContactoClient({ redes }: { redes: LigacaoRede[] }) {
  const [assunto, setAssunto] = useState("informacao");
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", organizacao: "", mensagem: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<"idle" | "a-enviar" | "ok">("idle");
  // Armadilha para robôs: um campo que as pessoas não vêem.
  const [site, setSite] = useState("");

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.nome.trim().length < 3) err.nome = "Indique o seu nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) err.email = "Email inválido.";
    if (form.mensagem.trim().length < 10) err.mensagem = "Escreva a sua mensagem (mín. 10 caracteres).";
    setErros(err);
    if (Object.keys(err).length > 0) return;

    setEstado("a-enviar");
    try {
      const r = await fetch(comBase("/api/contacto"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assunto: ASSUNTOS.find((a) => a.id === assunto)?.label ?? assunto,
          site,
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

  return (
    <>
      <PageHero
        imagem="contacto"
        eyebrow="Fale connosco"
        titulo="Contacto"
        descricao="Tem uma dúvida, um evento para divulgar ou uma proposta de parceria? Escreva-nos. Respondemos a todas as mensagens."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          {/* Formulário */}
          <div id="parcerias" className="scroll-mt-24">
            {estado === "ok" ? (
              <div className="card p-10 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-ok/20 text-ok">
                  <Icon name="check" className="size-7" />
                </span>
                <h2 className="mt-5 title-xl text-2xl">Mensagem enviada</h2>
                <p className="mt-3 mx-auto max-w-md text-sm text-ink-400 leading-relaxed">
                  Obrigado por escrever à Motobox, {form.nome.split(" ")[0]}. Recebemos a sua mensagem
                  e respondemos para <span className="text-white">{form.email}</span> em até 48 horas
                  úteis.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
                    setEstado("idle");
                    setForm({ nome: "", email: "", telefone: "", organizacao: "", mensagem: "" });
                  }}
                >
                  Enviar outra mensagem
                </Button>
              </div>
            ) : (
              <form onSubmit={submeter} className="space-y-7">
                {/* Assunto */}
                <fieldset>
                  <legend className="eyebrow accent-bar text-white">Sobre o que nos escreve?</legend>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {ASSUNTOS.map((a) => (
                      <label
                        key={a.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-card p-4 transition-colors ${
                          assunto === a.id ? "bg-mb-red/10 ring-2 ring-inset ring-mb-red/70" : "bg-ink-900 hover:bg-ink-850"
                        }`}
                      >
                        <input
                          type="radio"
                          name="assunto"
                          checked={assunto === a.id}
                          onChange={() => setAssunto(a.id)}
                          className="mt-1 size-4 shrink-0 accent-[#e10600]"
                        />
                        <span className="min-w-0">
                          <span className="block font-display text-sm uppercase text-white">{a.label}</span>
                          <span className="mt-0.5 block text-xs text-ink-500">{a.desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Dados */}
                <fieldset>
                  <legend className="eyebrow accent-bar text-white">Os seus dados</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        { k: "nome", label: "Nome", tipo: "text", ph: "O seu nome completo", req: true },
                        { k: "email", label: "Email", tipo: "email", ph: "o.seu@email.ao", req: true },
                        { k: "telefone", label: "Telemóvel", tipo: "tel", ph: "+244 9xx xxx xxx", req: false },
                        {
                          k: "organizacao",
                          label: "Clube / Empresa",
                          tipo: "text",
                          ph: "opcional",
                          req: false,
                        },
                      ] as const
                    ).map((c) => (
                      <div key={c.k}>
                        <label htmlFor={`c-${c.k}`} className="eyebrow block text-ink-500 mb-2">
                          {c.label} {c.req && <span className="text-mb-red">*</span>}
                        </label>
                        <input
                          id={`c-${c.k}`}
                          type={c.tipo}
                          value={form[c.k]}
                          onChange={(e) => {
                            setForm({ ...form, [c.k]: e.target.value });
                            setErros((x) => ({ ...x, [c.k]: "" }));
                          }}
                          placeholder={c.ph}
                          aria-invalid={Boolean(erros[c.k])}
                          className={`h-12 w-full bg-ink-900 px-4 text-sm text-white ring-inset placeholder:text-ink-600 outline-none transition-shadow ${
                            erros[c.k] ? "ring-2 ring-mb-red" : "ring-1 ring-white/10 focus:ring-2 focus:ring-mb-red"
                          }`}
                        />
                        {erros[c.k] && <p className="mt-1.5 text-xs text-mb-red-light">{erros[c.k]}</p>}
                      </div>
                    ))}
                  </div>
                </fieldset>

                {/* Mensagem */}
                <fieldset>
                  <legend className="eyebrow accent-bar text-white">A sua mensagem</legend>
                  <textarea
                    id="c-mensagem"
                    rows={7}
                    value={form.mensagem}
                    onChange={(e) => {
                      setForm({ ...form, mensagem: e.target.value });
                      setErros((x) => ({ ...x, mensagem: "" }));
                    }}
                    placeholder="Conte-nos com o máximo de detalhe possível…"
                    aria-invalid={Boolean(erros.mensagem)}
                    aria-label="Mensagem"
                    className={`w-full resize-y rounded-card bg-ink-900 p-4 text-sm text-white ring-inset placeholder:text-ink-600 outline-none transition-shadow ${
                      erros.mensagem ? "ring-2 ring-mb-red" : "ring-1 ring-white/10 focus:ring-2 focus:ring-mb-red"
                    }`}
                  />
                  {erros.mensagem && (
                    <p className="mt-1.5 text-xs text-mb-red-light">{erros.mensagem}</p>
                  )}
                </fieldset>

                <input type="text" tabIndex={-1} autoComplete="off" value={site}
                  onChange={(e) => setSite(e.target.value)} className="hidden" aria-hidden />

                {erros.geral && (
                  <p role="alert" className="rounded-xl bg-mb-red/10 px-4 py-3 text-sm text-mb-red-light">{erros.geral}</p>
                )}

                <div className="flex flex-wrap items-center gap-5">
                  <Button type="submit" size="lg" disabled={estado === "a-enviar"}>
                    {estado === "a-enviar" ? "A enviar…" : "Enviar mensagem"}
                    {estado !== "a-enviar" && <Icon name="arrow" className="size-4" />}
                  </Button>
                  <p className="max-w-xs text-xs text-ink-600 leading-relaxed">
                    Os seus dados são usados apenas para responder a esta mensagem.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Contactos directos */}
          <aside className="space-y-4">
            <div className="card p-6">
              <h2 className="eyebrow text-mb-red mb-5">Contactos directos</h2>
              <div className="space-y-4">
                {[
                  { icone: "mail", t: "Email geral", v: SOCIAIS.email, href: `mailto:${SOCIAIS.email}` },
                  { icone: "whatsapp", t: "WhatsApp", v: SOCIAIS.telefone, href: SOCIAIS.whatsapp },
                  { icone: "pin", t: "Localização", v: "Luanda, Angola", href: null },
                ].map((c) => (
                  <div key={c.t} className="flex items-start gap-3.5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mb-red/12 text-mb-red">
                      <Icon name={c.icone} className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="eyebrow text-ink-600">{c.t}</p>
                      {c.href ? (
                        <a
                          href={c.href}
                          target={c.href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="mt-0.5 block truncate text-sm text-white hover:text-mb-red transition-colors"
                        >
                          {c.v}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm text-white">{c.v}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="eyebrow text-mb-red mb-4">Redes sociais</h2>
              <p className="text-sm text-ink-400 leading-relaxed">
                A forma mais rápida de falar connosco continua a ser o Instagram: é lá que estamos
                todos os dias.
              </p>
              <div className="mt-3">
                {redes.map((l) => ({ icone: l.rede, label: l.rede === "google" ? "Motobox no Google" : l.nome, href: l.url })).map((r) => (
                  <a
                    key={r.icone}
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 border-b border-white/6 py-3 last:border-0 last:pb-0"
                  >
                    <Icon name={r.icone} className="size-4.5 shrink-0 text-ink-400 group-hover:text-mb-red transition-colors" />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-200 group-hover:text-white transition-colors">{r.label}</span>
                    <Icon name="arrow" className="size-4 shrink-0 text-ink-600 transition-all group-hover:translate-x-1 group-hover:text-white" />
                  </a>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="eyebrow text-mb-red mb-3">Tempo de resposta</h2>
              <p className="text-sm text-ink-400 leading-relaxed">
                A Motobox é um projecto sem fins lucrativos gerido por poucas pessoas. Respondemos a
                todas as mensagens, normalmente em <span className="text-white">48 horas úteis</span>.
                Para assuntos urgentes relacionados com provas, use o WhatsApp.
              </p>
            </div>

            <div className="card bg-mb-red/8 p-6">
              <h2 className="eyebrow text-mb-red mb-3">Organiza uma prova?</h2>
              <p className="text-sm text-ink-300 leading-relaxed">
                Divulgamos gratuitamente no calendário nacional qualquer prova, passeio ou
                concentração em Angola. Basta enviar-nos a informação.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
