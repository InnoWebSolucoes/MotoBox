"use client";

/* ============================================================
   MOTOBOX ADMIN — Definições › Contas
   - Documento "site.contas": os textos de /entrar, de
     /nova-palavra-passe e as frases do registo.
   - Contas por confirmar: quem criou conta e não confirmou o
     email (não consegue entrar). Daqui reenvia-se a ligação ou,
     sendo administrador, confirma-se a conta à mão.
   O interruptor "Criar conta" fica em Geral → Comunidade.
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { MailWarning, RefreshCw, UserRound } from "lucide-react";
import { comBase } from "@/lib/base";
import { useAdmin } from "@/lib/admin/store";
import { CONTAS_PADRAO, comPadraoContas } from "@/lib/conteudo/grupos/contas";
import { Aviso, Botao, Carregando, Confirmar, Etiqueta, Painel, useAviso } from "@/components/admin/kit";
import { EditorDoc } from "@/components/admin/editor/EditorDoc";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";

const ESQUEMA: CampoEsquema[] = [
  {
    tipo: "booleano", chave: "exigirConfirmacao", etiqueta: "Confirmar as contas por email",
    descricao: "Ligado: quem cria conta tem de abrir a ligação que chega por email antes de entrar. Desligado: a conta fica pronta logo e a pessoa entra de imediato (use enquanto o domínio de envio não estiver verificado, porque os emails não chegam).",
  },
  {
    tipo: "objecto", chave: "entrar", etiqueta: "Página Entrar (/entrar)",
    ajuda: "O quadro da fotografia, à esquerda, nos ecrãs largos. O formulário (entrar, criar conta, recuperar) tem os textos traduzidos do site.",
    campos: [
      { tipo: "texto", chave: "sobretitulo", etiqueta: "Linha pequena por cima do título", largura: "meia" },
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      { tipo: "area", chave: "texto", etiqueta: "Texto", linhas: 2 },
      {
        tipo: "area", chave: "registosFechados", etiqueta: "Aviso quando «Criar conta» está desligado", linhas: 2,
        ajuda: "Aparece por cima do formulário enquanto o interruptor «Criar conta» (Geral → Comunidade) estiver desligado.",
      },
      { tipo: "texto", chave: "seoTitulo", etiqueta: "Título no separador do navegador", largura: "meia" },
      { tipo: "texto", chave: "seoDescricao", etiqueta: "Descrição nas pesquisas", largura: "meia" },
    ],
  },
  {
    tipo: "objecto", chave: "novaPalavra", etiqueta: "Página Nova palavra-passe",
    ajuda: "Onde se chega pela ligação do email «Nova palavra-passe».",
    campos: [
      { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
      { tipo: "area", chave: "texto", etiqueta: "Texto por baixo do título", linhas: 2 },
      { tipo: "area", chave: "semSessao", etiqueta: "Quando a ligação já não vale", linhas: 3, ajuda: "A ligação expira ao fim de 1 hora e só se usa uma vez." },
      { tipo: "texto", chave: "sucesso", etiqueta: "Depois de gravar a nova palavra-passe" },
    ],
  },
  {
    tipo: "objecto", chave: "mensagens", etiqueta: "Respostas do registo",
    ajuda: "As frases que aparecem a vermelho no formulário de criar conta.",
    campos: [
      { tipo: "texto", chave: "registosFechados", etiqueta: "Com «Criar conta» desligado" },
      { tipo: "texto", chave: "contaExiste", etiqueta: "Quando o email já tem conta confirmada" },
      { tipo: "texto", chave: "emailNaoSeguiu", etiqueta: "Quando o email de confirmação não segue", ajuda: "Junta-se a explicação do erro a seguir." },
      { tipo: "texto", chave: "servicoIndisponivel", etiqueta: "Sem base de dados ou sem envio de emails" },
    ],
  },
];

/* ---------------- Contas por confirmar ---------------- */

interface ContaPendente { id: string; email: string; nome: string; criado: string; enviado: string | null }

const data = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" }) : "nunca";

function ContasPorConfirmar({ activa }: { activa: boolean }) {
  const { registar, estado } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const [contas, setContas] = useState<ContaPendente[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aConfirmar, setAConfirmar] = useState<ContaPendente | null>(null);
  const [pedido, setPedido] = useState(0);
  const [visto, setVisto] = useState(activa);
  if (activa && !visto) setVisto(true);

  useEffect(() => {
    if (!visto) return;
    let vivo = true;
    fetch(comBase("/api/admin/emails/contas"), { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!vivo) return;
        if (!r.ok) { setErro(String(j.erro ?? `Erro ${r.status}`)); setContas([]); return; }
        setContas(j.contas ?? []);
        setErro(null);
      })
      .catch(() => { if (vivo) { setErro("Sem ligação ao servidor."); setContas([]); } });
    return () => { vivo = false; };
  }, [visto, pedido]);

  const recarregar = useCallback(() => { setContas(null); setPedido((n) => n + 1); }, []);

  const agir = async (c: ContaPendente, accao: "reenviar" | "confirmar") => {
    setOcupado(c.id);
    try {
      const r = await fetch(comBase("/api/admin/emails/contas"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, accao }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { mostrar(String(j.erro ?? `Erro ${r.status}`), "erro"); return; }
      if (accao === "confirmar" || j.jaConfirmada) {
        registar("Confirmou à mão", "Conta", c.email);
        mostrar(`Conta confirmada: ${c.email} já pode entrar.`);
        setContas((l) => (l ?? []).filter((x) => x.id !== c.id));
      } else {
        registar("Reenviou a confirmação", "Conta", c.email);
        mostrar(`Ligação de confirmação enviada para ${c.email}.`);
      }
    } catch {
      mostrar("Sem ligação ao servidor.", "erro");
    } finally {
      setOcupado(null);
    }
  };

  return (
    <Painel
      titulo="Contas por confirmar"
      icone={<MailWarning />}
      descricao="Quem criou conta e ainda não abriu a ligação do email de confirmação: até lá não consegue entrar. Reenvie a ligação ou, se a pessoa não recebe emails, confirme a conta à mão (só administradores)."
      accoes={<Botao tamanho="sm" variante="fantasma" onClick={recarregar}><RefreshCw className="size-3.5" aria-hidden /> Actualizar</Botao>}
    >
      {!estado.definicoes.registosAbertos && (
        <div className="mb-4"><Aviso tom="atencao">«Criar conta» está desligado em Geral → Comunidade: ninguém consegue criar contas novas.</Aviso></div>
      )}
      {contas === null ? <Carregando /> : erro ? (
        <Aviso tom="erro" titulo="Não foi possível ler as contas">{erro}</Aviso>
      ) : contas.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/55">Não há contas por confirmar.</p>
      ) : (
        <ul className="divide-y divide-white/[0.07]">
          {contas.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{c.nome || c.email.split("@")[0]} <span className="text-white/55">· {c.email}</span></p>
                <p className="text-[13px] text-white/50">Criada a {data(c.criado)} · último email {data(c.enviado)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Etiqueta tom="ouro">Por confirmar</Etiqueta>
                <Botao tamanho="sm" onClick={() => void agir(c, "reenviar")} disabled={ocupado === c.id}>Reenviar confirmação</Botao>
                <Botao tamanho="sm" variante="ok" onClick={() => setAConfirmar(c)} disabled={ocupado === c.id}>Confirmar à mão</Botao>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Confirmar
        aberta={aConfirmar !== null}
        aoFechar={() => setAConfirmar(null)}
        aoConfirmar={() => { if (aConfirmar) void agir(aConfirmar, "confirmar"); }}
        titulo="Confirmar esta conta à mão?"
        mensagem={<>A conta de <strong className="text-white">{aConfirmar?.email}</strong> fica activa sem a pessoa abrir o email. Faça-o só se tiver a certeza de que o email é dela (por exemplo, falou com ela).</>}
        textoConfirmar="Confirmar a conta"
      />
      {elemento}
    </Painel>
  );
}

/* ---------------- Separador ---------------- */

export function DefinicoesContas({ activa = true, irPara }: { activa?: boolean; irPara: (aba: "geral" | "emails") => void }) {
  return (
    <div className="space-y-[var(--intervalo)]">
      <ContasPorConfirmar activa={activa} />
      <EditorDoc chave="site.contas" titulo="Contas (entrar e registar)" pagina="/entrar">
        {(dados, mudar) => (
          <Painel
            titulo="Textos das páginas de conta"
            icone={<UserRound />}
            descricao={<>Os emails de confirmação e de nova palavra-passe editam-se em <button type="button" className="sublinhado text-white/80 hover:text-white" onClick={() => irPara("emails")}>Emails</button> (grupo Contas).</>}
          >
            <Formulario esquema={ESQUEMA} valor={comPadraoContas(CONTAS_PADRAO, dados) as unknown as Valor} onChange={mudar} />
          </Painel>
        )}
      </EditorDoc>
    </div>
  );
}
