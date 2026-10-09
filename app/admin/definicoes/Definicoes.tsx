"use client";

/* ============================================================
   MOTOBOX ADMIN — Definições
   Três separadores, todos abertos ao mesmo tempo (nada se perde
   ao trocar antes de gravar):
   - Geral: a linha única `definicoes` (identidade, contactos,
     redes, bilheteira, comunidade, site);
   - Emails: remetente, para onde vai cada mensagem, o texto de
     cada email, o email de teste e os últimos emails enviados;
   - Contas: os textos de Entrar e da nova palavra-passe, e as
     contas que ainda não confirmaram o email.
   ============================================================ */

import { useState } from "react";
import { Mail, Settings, UserRound } from "lucide-react";
import { CabecalhoPagina } from "@/components/admin/kit";
import { AbasEmLinhas } from "../paginas/_editor/partes";
import { DefinicoesGerais } from "./Gerais";
import { DefinicoesEmails } from "./Emails";
import { DefinicoesContas } from "./Contas";

export type AbaDefinicoes = "geral" | "emails" | "contas";

const ABAS: { chave: AbaDefinicoes; nome: string }[] = [
  { chave: "geral", nome: "Geral" },
  { chave: "emails", nome: "Emails" },
  { chave: "contas", nome: "Contas" },
];

const CABECALHOS: Record<AbaDefinicoes, { icone: React.ReactNode; descricao: string }> = {
  geral: {
    icone: <Settings />,
    descricao: "O nome e os contactos da MotoBox, as redes sociais, a temporada e o que está aberto no site. Nada muda até carregar em Gravar.",
  },
  emails: {
    icone: <Mail />,
    descricao: "Quem assina os emails do site, para onde vai cada mensagem que chega à equipa e o texto de cada email. Envie um email de teste e veja o que já saiu.",
  },
  contas: {
    icone: <UserRound />,
    descricao: "Os textos das páginas de entrar, criar conta e nova palavra-passe, e as contas que ainda não confirmaram o email.",
  },
};

export function Definicoes({ abaInicial }: { abaInicial: AbaDefinicoes }) {
  const [aba, setAba] = useState<AbaDefinicoes>(abaInicial);
  // Uma ligação para outro separador (?aba=…) com a página já aberta.
  const [pedida, setPedida] = useState(abaInicial);
  if (pedida !== abaInicial) {
    setPedida(abaInicial);
    setAba(abaInicial);
  }

  const mudarAba = (k: AbaDefinicoes) => {
    setAba(k);
    try { window.history.replaceState(null, "", `?aba=${k}`); } catch { /* indisponível */ }
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <CabecalhoPagina sobretitulo="Sistema" titulo="Definições" icone={CABECALHOS[aba].icone} descricao={CABECALHOS[aba].descricao} />

      <div className="mb-5">
        <AbasEmLinhas abas={ABAS} activa={aba} onChange={mudarAba} rotulo="Partes das definições" />
      </div>

      <div hidden={aba !== "geral"}><DefinicoesGerais irPara={mudarAba} /></div>
      <div hidden={aba !== "emails"}><DefinicoesEmails activa={aba === "emails"} /></div>
      <div hidden={aba !== "contas"}><DefinicoesContas activa={aba === "contas"} irPara={mudarAba} /></div>
    </>
  );
}
