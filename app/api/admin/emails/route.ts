import { NextResponse } from "next/server";
import {
  emailConfigurado, estadoDoDominio, lerConfigEmails, listarEmailsEnviados,
} from "@/lib/email";
import { DESTINOS } from "@/lib/conteudo/grupos/contas";

/* ============================================================
   MOTOBOX — Emails no painel (Definições → Emails)
   GET → como está o envio: se a chave existe, o remetente, o
         responder-para, para onde vai cada tipo de mensagem (já
         com o email da MotoBox como recurso), o estado do domínio
         na Resend e os últimos emails enviados, com o estado de
         entrega de cada um.
   Só a equipa chega aqui: o proxy protege /api/admin.
   ============================================================ */

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await lerConfigEmails();
  const configurado = emailConfigurado();
  const [dominio, lista] = configurado
    ? await Promise.all([estadoDoDominio(cfg.enderecoEnvio), listarEmailsEnviados(30)])
    : [null, null];

  return NextResponse.json({
    configurado,
    remetente: cfg.remetente,
    enderecoEnvio: cfg.enderecoEnvio,
    remetenteDoAmbiente: cfg.remetenteDoAmbiente,
    responderPara: cfg.responderPara,
    emailContacto: cfg.emailContacto,
    destinos: Object.fromEntries(DESTINOS.map((d) => [d.chave, cfg.destino(d.chave)])),
    dominio: dominio && "erro" in dominio ? null : dominio,
    dominioErro: dominio && "erro" in dominio ? dominio.erro : undefined,
    emails: lista && "emails" in lista ? lista.emails : [],
    emailsErro: lista && "erro" in lista ? lista.erro : undefined,
  });
}
