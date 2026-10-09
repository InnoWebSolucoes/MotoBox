"use client";

/* ============================================================
   MOTOBOX ADMIN — Definições › Emails
   - Estado do envio: se o serviço está ligado, o remetente, se o
     domínio está verificado na Resend, e o email de teste.
   - Documento "site.emails": quem assina, para onde vão as
     respostas, para onde vai cada tipo de mensagem e o texto de
     cada email que o site envia (assunto, título, texto, botão,
     rodapé), com pré-visualização.
   - Os últimos emails enviados, com o estado de entrega.
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, MailCheck, PenLine, RefreshCw, Send, Users } from "lucide-react";
import { comBase } from "@/lib/base";
import { useAdmin } from "@/lib/admin/store";
import { useAuth } from "@/lib/auth/contexto";
import {
  DESTINOS, EMAILS_PADRAO, ENDERECO_ENVIO, MODELOS, MODELOS_PADRAO, NOME_REMETENTE,
  comPadraoContas, preencherModelo,
  type ChaveModelo, type CampoModelo, type ConteudoEmails, type InfoModelo, type ModeloEmail,
} from "@/lib/conteudo/grupos/contas";
import {
  Area, Aviso, Botao, Campo, Carregando, Etiqueta, Input, Interruptor, Painel, Seleccao,
} from "@/components/admin/kit";
import { EditorDoc } from "@/components/admin/editor/EditorDoc";
import type { Valor } from "@/components/admin/editor/esquema";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** "a@x.ao, b@y" → os que não parecem emails. */
const invalidos = (v: string) => v.split(/[,;\s]+/).map((x) => x.trim()).filter((x) => x && !EMAIL_VALIDO.test(x));

/* ---------------- Estado (API) ---------------- */

interface EmailEnviado { id: string; para: string[]; de: string; assunto: string; criado: string; estado: string }

interface EstadoEnvio {
  configurado: boolean;
  remetente: string;
  enderecoEnvio: string;
  remetenteDoAmbiente: boolean;
  responderPara: string[];
  emailContacto: string;
  destinos: Record<string, string[]>;
  dominio: { nome: string; estado: string } | null;
  dominioErro?: string;
  emails: EmailEnviado[];
  emailsErro?: string;
}

function useEstadoEnvio(activo: boolean) {
  const [estado, setEstado] = useState<EstadoEnvio | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pedido, setPedido] = useState(0);
  /** Último pedido com resposta: enquanto for diferente do actual, está a ler. */
  const [lido, setLido] = useState(-1);

  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    fetch(comBase("/api/admin/emails"), { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!vivo) return;
        if (!r.ok) { setErro(String(j.erro ?? `Erro ${r.status}`)); return; }
        setEstado(j as EstadoEnvio);
        setErro(null);
      })
      .catch(() => { if (vivo) setErro("Sem ligação ao servidor."); })
      .finally(() => { if (vivo) setLido(pedido); });
    return () => { vivo = false; };
  }, [activo, pedido]);

  return { estado, erro, aLer: activo && lido !== pedido, recarregar: useCallback(() => setPedido((n) => n + 1), []) };
}

/* ---------------- Rótulos ---------------- */

const DOMINIO: Record<string, { texto: string; tom: "ok" | "ouro" | "vermelho" | "neutro" }> = {
  verified: { texto: "Verificado", tom: "ok" },
  pending: { texto: "À espera do DNS", tom: "ouro" },
  not_started: { texto: "Por verificar", tom: "ouro" },
  temporary_failure: { texto: "Falha temporária", tom: "ouro" },
  failed: { texto: "A verificação falhou", tom: "vermelho" },
  "em-falta": { texto: "Não existe na conta Resend", tom: "vermelho" },
  teste: { texto: "Remetente de teste (resend.dev)", tom: "vermelho" },
};

const ENTREGA: Record<string, { texto: string; tom: "ok" | "ouro" | "vermelho" | "neutro" }> = {
  delivered: { texto: "Entregue", tom: "ok" },
  opened: { texto: "Aberto", tom: "ok" },
  clicked: { texto: "Aberto (clicou)", tom: "ok" },
  sent: { texto: "Enviado", tom: "neutro" },
  queued: { texto: "Em fila", tom: "neutro" },
  scheduled: { texto: "Agendado", tom: "neutro" },
  delivery_delayed: { texto: "Atrasado", tom: "ouro" },
  bounced: { texto: "Devolvido", tom: "vermelho" },
  complained: { texto: "Marcado como spam", tom: "vermelho" },
  failed: { texto: "Falhou", tom: "vermelho" },
  canceled: { texto: "Cancelado", tom: "neutro" },
  suppressed: { texto: "Bloqueado (endereço suprimido)", tom: "vermelho" },
};

const quando = (iso: string) => {
  const d = new Date(iso.replace(" ", "T"));
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" });
};

/* ---------------- Estado do envio e teste ---------------- */

function PainelEstado({ e, erro, aLer, recarregar }: {
  e: EstadoEnvio | null; erro: string | null; aLer: boolean; recarregar: () => void;
}) {
  const { utilizador } = useAuth();
  const { registar } = useAdmin();
  const [para, setPara] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);
  const destinoTeste = para || utilizador?.email || "";

  const enviarTeste = async () => {
    if (!EMAIL_VALIDO.test(destinoTeste.trim())) { setResultado({ ok: false, texto: "Escreva um endereço de email válido." }); return; }
    setAEnviar(true);
    setResultado(null);
    try {
      const r = await fetch(comBase("/api/admin/emails/teste"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ para: destinoTeste.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setResultado({ ok: false, texto: String(j.erro ?? `Erro ${r.status}`) }); return; }
      registar("Enviou um email de teste", "Emails", String(j.para));
      setResultado({ ok: true, texto: `A Resend aceitou o email para ${j.para}. Veja a caixa de entrada (e o spam) daqui a um minuto.` });
      window.setTimeout(recarregar, 2500);
    } catch {
      setResultado({ ok: false, texto: "Sem ligação ao servidor. O email não foi enviado." });
    } finally {
      setAEnviar(false);
    }
  };

  const dominio = e?.dominio ? DOMINIO[e.dominio.estado] ?? { texto: e.dominio.estado, tom: "neutro" as const } : null;
  const dominioMal = Boolean(e?.configurado && e.dominio && e.dominio.estado !== "verified");

  return (
    <Painel
      titulo="Estado do envio"
      icone={<MailCheck />}
      descricao="Os emails do site saem pela Resend. Sem o domínio de envio verificado, a Resend só entrega na caixa do dono da conta: mais ninguém recebe nada."
      accoes={<Botao tamanho="sm" variante="fantasma" onClick={recarregar} disabled={aLer}><RefreshCw className={`size-3.5 ${aLer ? "animate-spin" : ""}`} aria-hidden /> Actualizar</Botao>}
    >
      {erro && <Aviso tom="erro" titulo="Não foi possível ler o estado do envio">{erro}</Aviso>}
      {!e && !erro && <Carregando />}
      {e && (
        <div className="space-y-4">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-white/55">Serviço de email</dt>
            <dd className="flex flex-wrap items-center gap-2">
              {e.configurado ? <Etiqueta tom="ok">Ligado</Etiqueta> : (
                <><Etiqueta tom="vermelho">Desligado</Etiqueta><span className="text-xs text-white/60">falta a chave RESEND_API_KEY no servidor</span></>
              )}
            </dd>
            <dt className="text-white/55">Remetente</dt>
            <dd className="break-all text-white">{e.remetente}{e.remetenteDoAmbiente && <span className="ml-2 text-xs text-white/50">(endereço da variável RESEND_FROM)</span>}</dd>
            <dt className="text-white/55">Domínio de envio</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <span className="text-white">{e.dominio?.nome ?? e.enderecoEnvio.split("@")[1]}</span>
              {dominio && <Etiqueta tom={dominio.tom}>{dominio.texto}</Etiqueta>}
              {e.dominioErro && <span className="text-xs text-white/55">{e.dominioErro}</span>}
            </dd>
            <dt className="text-white/55">Respostas vão para</dt>
            <dd className="break-all text-white">{e.responderPara.join(", ") || <span className="text-mb-red-light">ninguém (falta o email da MotoBox)</span>}</dd>
          </dl>

          {!e.configurado && (
            <Aviso tom="erro" titulo="Os emails do site estão desligados">
              Falta a variável RESEND_API_KEY no servidor (Vercel → Settings → Environment Variables). Sem ela não sai nenhum email: nem a confirmação de conta, nem as mensagens para a equipa (que continuam a ficar em Mensagens).
            </Aviso>
          )}
          {dominioMal && (
            <Aviso tom="atencao" titulo="O domínio de envio ainda não está verificado">
              Enquanto não estiver verificado, ninguém recebe os emails do site: nem a confirmação de quem cria conta. Em resend.com/domains, abra {e.dominio?.nome} e copie os registos DNS (MX, TXT/SPF e DKIM) para o Cloudflare. Depois carregue em «Verify» na Resend e aqui em «Actualizar».
            </Aviso>
          )}
          {e.configurado && e.enderecoEnvio !== ENDERECO_ENVIO && !e.enderecoEnvio.endsWith(`@${ENDERECO_ENVIO.split("@")[1]}`) && (
            <Aviso tom="atencao" titulo="O remetente não usa o domínio de envio">
              A variável RESEND_FROM aponta para {e.enderecoEnvio}. Só endereços de um domínio verificado na Resend conseguem enviar para fora.
            </Aviso>
          )}

          <div className="rounded-[var(--raio)] bg-black/20 p-4">
            <p className="text-[15px] font-medium text-white">Enviar email de teste</p>
            <p className="mt-0.5 text-[13px] text-white/55">Segue com o remetente e os textos gravados. Use um endereço fora da equipa (um Gmail, por exemplo) para ter a certeza de que chega a qualquer pessoa.</p>
            <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(ev) => { ev.preventDefault(); void enviarTeste(); }}>
              <label className="min-w-0 flex-1">
                <span className="sr-only">Endereço para o email de teste</span>
                <Input type="email" value={para} placeholder={utilizador?.email ?? "nome@exemplo.com"} onChange={(ev) => setPara(ev.target.value)} />
              </label>
              <Botao type="submit" variante="primario" disabled={aEnviar}><Send className="size-4" aria-hidden /> {aEnviar ? "A enviar…" : "Enviar email de teste"}</Botao>
            </form>
            {resultado && <div className="mt-3"><Aviso tom={resultado.ok ? "ok" : "erro"}>{resultado.texto}</Aviso></div>}
          </div>
        </div>
      )}
    </Painel>
  );
}

/* ---------------- Modelos ---------------- */

const ROTULOS: Record<CampoModelo, { nome: string; area?: boolean; ajuda?: string }> = {
  assunto: { nome: "Assunto" },
  titulo: { nome: "Título", ajuda: "O título grande no topo da mensagem." },
  intro: { nome: "Texto", area: true, ajuda: "Uma linha em branco separa parágrafos." },
  botao: { nome: "Texto do botão" },
  rodape: { nome: "Nota no fim", area: true, ajuda: "Em letra pequena, depois de uma linha." },
};

/** Valores de exemplo para a pré-visualização. */
const EXEMPLOS: Record<string, string> = {
  nome: "Ana", email: "ana@exemplo.com", assunto: "Informações sobre o campeonato", clube: "Motards do Kwanza",
  titulo: "Capacete Shoei NXR2", referencia: "MB-7K2Q", alvo: "Honda CB500X 2021", tipo: "anúncio", motivo: "Burla ou fraude",
  comprador: "João Manuel", anuncio: "Honda CB500X 2021", vendedor: "Moto Center Luanda", evento: "Ubuntu 2027",
  quantidade: "2", total: "30 000 Kz", topico: "Melhor rota para o Lubango?", autor: "Paulo",
  corrida: "Prova de Benguela", prova: "Prova de Benguela (MX1), 12 de Outubro", marca: "Yamaha",
  semana: "28 de Setembro a 4 de Outubro",
};

function PreVisualizacao({ m, info, site }: { m: ModeloEmail; info: InfoModelo; site: string }) {
  const v = { ...EXEMPLOS, site };
  const p = (s: string) => preencherModelo(s, v);
  const usa = (c: CampoModelo) => info.campos.includes(c);
  const paragrafos = usa("intro") ? p(m.intro).split(/\n\s*\n/).filter((x) => x.trim()) : [];
  return (
    <div className="overflow-hidden rounded-[var(--raio)] bg-white text-[#111]" aria-label="Pré-visualização do email">
      <div className="border-b border-black/10 bg-[#f4f4f6] px-4 py-2.5 text-[13px]">
        <p className="truncate"><span className="text-black/50">Assunto: </span><span className="font-semibold">{p(m.assunto) || "(sem assunto)"}</span></p>
      </div>
      <div className="px-5 py-5 font-[Arial,Helvetica,sans-serif] text-[14px] leading-relaxed">
        <p className="mb-4 text-[12px] font-bold tracking-wider">MOTOBOX <span className="text-[#e10600]">ANGOLA</span></p>
        {usa("titulo") && m.titulo && <p className="mb-3 text-[18px] font-bold leading-snug">{p(m.titulo)}</p>}
        {info.chave === "resposta" && <p className="mb-3 text-black/60">Olá, Ana. (O texto que a equipa escreve em Mensagens.)</p>}
        {paragrafos.map((x, i) => <p key={i} className="mb-2.5 whitespace-pre-line">{x}</p>)}
        {usa("botao") && m.botao && (
          <p className="my-4"><span className="inline-block rounded-full bg-[#e10600] px-4 py-2 text-[13px] font-bold text-white">{p(m.botao)}</span></p>
        )}
        {usa("rodape") && m.rodape && <p className="mt-4 border-t border-black/10 pt-3 text-[12px] text-black/55 whitespace-pre-line">{p(m.rodape)}</p>}
      </div>
    </div>
  );
}

function EditorModelos({ modelos, mudar, site }: {
  modelos: Record<ChaveModelo, ModeloEmail>; mudar: (m: Record<ChaveModelo, ModeloEmail>) => void; site: string;
}) {
  const [escolhido, setEscolhido] = useState<ChaveModelo>("contaConfirmar");
  const info = MODELOS.find((x) => x.chave === escolhido) ?? MODELOS[0];
  const m = modelos[escolhido];
  const grupos = useMemo(() => [...new Set(MODELOS.map((x) => x.grupo))], []);
  const alterado = (k: ChaveModelo) => JSON.stringify(modelos[k]) !== JSON.stringify(MODELOS_PADRAO[k]);
  const definir = (c: CampoModelo, v: string) => mudar({ ...modelos, [escolhido]: { ...m, [c]: v } });

  return (
    <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Lista (ecrã largo) ou selecção (telemóvel) */}
      <div className="lg:hidden">
        <Campo etiqueta="Email a editar">
          <Seleccao
            valor={escolhido}
            onChange={(v) => setEscolhido(v as ChaveModelo)}
            opcoes={MODELOS.map((x) => ({ valor: x.chave, nome: `${x.grupo} › ${x.nome}${alterado(x.chave) ? " (editado)" : ""}` }))}
          />
        </Campo>
      </div>
      <nav aria-label="Emails do site" className="hidden lg:block">
        {grupos.map((g) => (
          <div key={g} className="mb-3">
            <p className="mb-1 px-2 text-xs text-white/45">{g}</p>
            <ul className="grid gap-0.5">
              {MODELOS.filter((x) => x.grupo === g).map((x) => (
                <li key={x.chave}>
                  <button
                    type="button"
                    aria-current={x.chave === escolhido ? "true" : undefined}
                    onClick={() => setEscolhido(x.chave)}
                    className="flex w-full items-center justify-between gap-2 rounded-[var(--raio)] px-2.5 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white aria-[current=true]:bg-mb-red aria-[current=true]:text-white"
                  >
                    <span className="min-w-0 truncate">{x.nome}</span>
                    {alterado(x.chave) && <span className="size-1.5 shrink-0 rounded-full bg-gold" aria-label="editado" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[17px] font-semibold text-white">{info.nome}</p>
            <p className="mt-0.5 text-[13px] text-white/60"><span className="text-white/80">Para:</span> {info.para}</p>
            <p className="text-[13px] text-white/60"><span className="text-white/80">Quando:</span> {info.quando}</p>
          </div>
          {alterado(escolhido) && (
            <Botao tamanho="sm" variante="fantasma" onClick={() => mudar({ ...modelos, [escolhido]: { ...MODELOS_PADRAO[escolhido] } })}>
              Repor o texto de origem
            </Botao>
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4">
            {info.campos.map((c) => {
              const r = ROTULOS[c];
              const ajuda = c === "rodape" && escolhido === "resposta" ? "A assinatura, por baixo da resposta. {site} é o nome do site." : r.ajuda;
              return (
                <Campo key={c} etiqueta={c === "rodape" && escolhido === "resposta" ? "Assinatura" : r.nome} ajuda={ajuda} obrigatorio={c === "assunto"}>
                  {r.area
                    ? <Area rows={c === "intro" ? 5 : 3} value={m[c]} onChange={(ev) => definir(c, ev.target.value)} />
                    : <Input value={m[c]} onChange={(ev) => definir(c, ev.target.value)} />}
                </Campo>
              );
            })}
            {!m.assunto.trim() && <p className="text-xs text-mb-red-light">Sem assunto, o email segue com o nome do site como assunto.</p>}
            <div className="rounded-[var(--raio)] bg-black/20 px-4 py-3">
              <p className="text-[13px] font-medium text-white/80">Palavras que se trocam sozinhas</p>
              <ul className="mt-1.5 grid gap-1 text-[13px] text-white/60">
                {Object.entries(info.variaveis).map(([k, d]) => (
                  <li key={k}><code className="rounded bg-white/10 px-1.5 py-0.5 text-white">{`{${k}}`}</code> {d}</li>
                ))}
              </ul>
              {["contactoEquipa", "clubeEquipa", "importacaoEquipa", "denuncia", "vendedor", "marketplaceEquipa", "bilhetesEquipa", "bilhetesComprador"].includes(escolhido) && (
                <p className="mt-2 text-xs text-white/50">A mensagem de quem escreveu e os dados (nome, email, referência…) juntam-se sozinhos por baixo do texto.</p>
              )}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-white/75">Pré-visualização (com dados de exemplo)</p>
            <PreVisualizacao m={m} info={info} site={site} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Documento "site.emails" ---------------- */

function FormularioEmails({ dados, mudar, estado }: {
  dados: ConteudoEmails; mudar: (d: ConteudoEmails) => void; estado: EstadoEnvio | null;
}) {
  const { estado: admin } = useAdmin();
  const recurso = estado?.emailContacto || "";
  const nomeSite = admin.definicoes.nomeSite?.trim() || NOME_REMETENTE;
  const errosResponder = invalidos(dados.remetente.responderPara);

  return (
    <div className="space-y-[var(--intervalo)]">
      <Painel titulo="Quem assina" icone={<PenLine />} descricao="O nome que aparece como remetente e para onde vão as respostas aos emails do site.">
        <div className="grid gap-4 md:grid-cols-2">
          <Campo
            etiqueta="Nome do remetente"
            ajuda={<>Lê-se «{(dados.remetente.nome.trim() || NOME_REMETENTE)} &lt;{estado?.enderecoEnvio ?? ENDERECO_ENVIO}&gt;». O endereço é o do domínio verificado e não se muda aqui.</>}
          >
            <Input value={dados.remetente.nome} placeholder={NOME_REMETENTE} maxLength={70}
              onChange={(ev) => mudar({ ...dados, remetente: { ...dados.remetente, nome: ev.target.value } })} />
          </Campo>
          <Campo
            etiqueta="Respostas vão para"
            ajuda={errosResponder.length
              ? <span className="text-mb-red-light">Não parece um email: {errosResponder.join(", ")}</span>
              : recurso
                ? `Em branco, vão para o email da MotoBox (${recurso}). Quando a mensagem é de uma pessoa (contacto, marketplace), as respostas vão para essa pessoa.`
                : "Em branco, vão para o email da MotoBox (Geral → Contactos), que ainda não está preenchido."}
          >
            <Input type="email" value={dados.remetente.responderPara} placeholder={recurso || "geral@…"}
              onChange={(ev) => mudar({ ...dados, remetente: { ...dados.remetente, responderPara: ev.target.value } })} />
          </Campo>
        </div>
      </Painel>

      <Painel
        titulo="Para onde vão as mensagens"
        icone={<Inbox />}
        descricao="Cada mensagem que chega pelo site fica no painel e segue também por email para estes endereços. Pode pôr vários, separados por vírgulas. Em branco, vai para o email da MotoBox."
      >
        {!recurso && (
          <div className="mb-4"><Aviso tom="atencao">O email da MotoBox (Geral → Contactos) está vazio: os campos em branco não recebem nada por email.</Aviso></div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {DESTINOS.map((d) => {
            const v = dados.destinos[d.chave];
            const maus = invalidos(v);
            return (
              <Campo
                key={d.chave}
                etiqueta={d.nome}
                ajuda={maus.length ? <span className="text-mb-red-light">Não parece um email: {maus.join(", ")}</span> : d.ajuda}
              >
                <Input value={v} placeholder={recurso || "sem email: só fica no painel"}
                  onChange={(ev) => mudar({ ...dados, destinos: { ...dados.destinos, [d.chave]: ev.target.value } })} />
              </Campo>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/50">
          Estes endereços ficam guardados com o conteúdo do site, que é de leitura pública: use endereços da equipa, não pessoais.
        </p>
        <div className="mt-4">
          <Interruptor
            activo={dados.recibos}
            etiqueta="Enviar um recibo a quem escreve"
            descricao="Quem usa o contacto, o formulário de clubes ou pede uma importação recebe um email a dizer que a mensagem chegou (os textos estão em Recibos, em baixo)."
            onChange={(v) => mudar({ ...dados, recibos: v })}
          />
        </div>
      </Painel>

      <Painel titulo="Textos dos emails" icone={<Users />} descricao="O que cada email diz. As palavras entre chavetas trocam-se pelos valores de cada envio (o nome da pessoa, o anúncio, o evento…).">
        <EditorModelos modelos={dados.modelos} mudar={(modelos) => mudar({ ...dados, modelos })} site={nomeSite} />
      </Painel>
    </div>
  );
}

/* ---------------- Últimos emails ---------------- */

function UltimosEmails({ e, aLer, recarregar }: { e: EstadoEnvio | null; aLer: boolean; recarregar: () => void }) {
  return (
    <Painel
      titulo="Últimos emails enviados"
      icone={<Send />}
      descricao="O que saiu nos últimos dias, segundo a Resend, e se chegou. «Devolvido» quer dizer que o endereço não existe ou recusou."
      accoes={<Botao tamanho="sm" variante="fantasma" onClick={recarregar} disabled={aLer}><RefreshCw className={`size-3.5 ${aLer ? "animate-spin" : ""}`} aria-hidden /> Actualizar</Botao>}
    >
      {!e ? <Carregando /> : !e.configurado ? (
        <Aviso tom="info">Sem a chave da Resend no servidor não há emails enviados para mostrar.</Aviso>
      ) : e.emailsErro ? (
        <Aviso tom="atencao" titulo="Não foi possível ler a lista">{e.emailsErro}</Aviso>
      ) : e.emails.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/55">Ainda não saiu nenhum email.</p>
      ) : (
        <ul className="divide-y divide-white/[0.07]">
          {e.emails.map((m) => {
            const est = ENTREGA[m.estado] ?? { texto: m.estado, tom: "neutro" as const };
            return (
              <li key={m.id} className="grid gap-1 py-3 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                <span className="text-[13px] tabular-nums text-white/55">{quando(m.criado)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-white">{m.assunto || "(sem assunto)"}</span>
                  <span className="block truncate text-[13px] text-white/55">para {m.para.join(", ")}</span>
                </span>
                <span><Etiqueta tom={est.tom}>{est.texto}</Etiqueta></span>
              </li>
            );
          })}
        </ul>
      )}
    </Painel>
  );
}

/* ---------------- Separador ---------------- */

export function DefinicoesEmails({ activa = true }: { activa?: boolean }) {
  // Só se pergunta à Resend quando o separador é aberto.
  const [visto, setVisto] = useState(activa);
  if (activa && !visto) setVisto(true);
  const { estado, erro, aLer, recarregar } = useEstadoEnvio(visto);

  return (
    <div className="space-y-[var(--intervalo)]">
      <PainelEstado e={estado} erro={erro} aLer={aLer} recarregar={recarregar} />
      <EditorDoc chave="site.emails" titulo="Emails do site" aoGravar={recarregar}>
        {(dados, mudar) => (
          <FormularioEmails
            dados={comPadraoContas(EMAILS_PADRAO, dados)}
            mudar={(d) => mudar(d as unknown as Valor)}
            estado={estado}
          />
        )}
      </EditorDoc>
      <UltimosEmails e={estado} aLer={aLer} recarregar={recarregar} />
    </div>
  );
}
