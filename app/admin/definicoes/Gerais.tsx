"use client";

/* ============================================================
   MOTOBOX ADMIN — Definições › Geral
   Todos os campos da linha única `definicoes`: identidade,
   contactos, redes sociais, desporto e bilheteira, o que está
   aberto na comunidade, e o site (manutenção, cookies,
   analítica). As alterações ficam num rascunho até Gravar.
   Os emails (remetente, destinos, modelos) e os textos das
   contas estão nos separadores ao lado (Emails.tsx, Contas.tsx).
   ============================================================ */

import Link from "next/link";
import { useState } from "react";
import { BarChart3, Building2, Mail, Share2, Ticket, Users } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import type { Definicoes } from "@/lib/admin/types";
import {
  Area, Botao, Campo, Carregando, Etiqueta, Input, Interruptor, Painel, useAviso,
} from "@/components/admin/kit";
import { useAvisoSaida } from "@/components/admin/editor/EditorDoc";

type Chave = keyof Definicoes;

const URL_VALIDO = /^https?:\/\/\S+$/;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const REDES: { chave: Chave; nome: string; exemplo: string; ajuda?: string }[] = [
  {
    chave: "instagram", nome: "Instagram", exemplo: "https://www.instagram.com/…",
    ajuda: "Aparece no painel Explorar, na página Contacto e na página Sobre. Em branco, volta à conta de origem (@motobox_angola).",
  },
  { chave: "facebook", nome: "Facebook", exemplo: "https://www.facebook.com/…" },
  { chave: "youtube", nome: "YouTube", exemplo: "https://www.youtube.com/@…" },
  { chave: "linkedin", nome: "LinkedIn", exemplo: "https://www.linkedin.com/company/…" },
  {
    chave: "googleBusiness", nome: "Google (ficha no Google Maps)", exemplo: "https://maps.app.goo.gl/…",
    ajuda: "No perfil da MotoBox no Google, carregue em Partilhar e copie a ligação.",
  },
];

export function DefinicoesGerais({ irPara }: { irPara: (aba: "emails" | "contas") => void }) {
  const { estado, pronto, guardarDefinicoes } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const guardado = estado.definicoes;

  /** Só os campos mudados; o resto vem do que está gravado. */
  const [edicao, setEdicao] = useState<Partial<Definicoes>>({});
  const [aGravar, setAGravar] = useState(false);
  const d: Definicoes = { ...guardado, ...edicao };
  const mudados = (Object.keys(edicao) as Chave[]).filter((k) => edicao[k] !== guardado[k]);
  const sujo = mudados.length > 0;
  useAvisoSaida(sujo);

  const set = <K extends Chave>(k: K, v: Definicoes[K]) => setEdicao((e) => ({ ...e, [k]: v }));
  const texto = (k: Chave) => String(d[k] ?? "");

  const erros: Partial<Record<Chave, string>> = {};
  if (!d.nomeSite.trim()) erros.nomeSite = "O site precisa de um nome.";
  if (d.emailContacto && !EMAIL_VALIDO.test(d.emailContacto)) erros.emailContacto = "Este email não parece certo.";
  for (const r of REDES) {
    const v = texto(r.chave).trim();
    if (v && !URL_VALIDO.test(v)) erros[r.chave] = "A ligação tem de começar por https://";
  }
  if (!Number.isInteger(d.temporada) || d.temporada < 2000 || d.temporada > 2100) erros.temporada = "Um ano, por exemplo 2026.";
  if (!Number.isFinite(d.taxaMotobox) || d.taxaMotobox < 0 || d.taxaMotobox > 100) erros.taxaMotobox = "Entre 0 e 100.";
  const comErros = Object.keys(erros).length > 0;

  const gravar = async () => {
    if (comErros) { mostrar("Há campos por corrigir (a vermelho).", "erro"); return; }
    const campos = Object.fromEntries(mudados.map((k) => {
      const v = d[k];
      return [k, typeof v === "string" ? v.trim() : v];
    })) as Partial<Definicoes>;
    setAGravar(true);
    const falha = await guardarDefinicoes(campos);
    setAGravar(false);
    if (falha) { mostrar(falha, "erro"); return; }
    setEdicao({});
    mostrar("Definições gravadas.");
  };

  const erro = (k: Chave) => erros[k] ? <span className="text-mb-red-light">{erros[k]}</span> : undefined;
  const interruptor = (k: Chave, etiqueta: string, descricao: string) => (
    <Interruptor activo={Boolean(d[k])} etiqueta={etiqueta} descricao={descricao} onChange={(v) => set(k, v as never)} />
  );

  if (!pronto) return <Carregando />;

  const ligacaoAba = (aba: "emails" | "contas", texto: string) => (
    <button type="button" onClick={() => irPara(aba)} className="sublinhado text-white/80 hover:text-white">{texto}</button>
  );

  return (
    <>
      <div className="sticky top-[4.5rem] z-20 mb-[var(--intervalo)] flex flex-wrap items-center justify-between gap-3 rounded-[var(--raio)] bg-[#2c2c33]/90 px-3 py-2.5 shadow-lg backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {sujo ? (
            <Etiqueta tom="ouro">{mudados.length === 1 ? "1 alteração por gravar" : `${mudados.length} alterações por gravar`}</Etiqueta>
          ) : (
            <span className="text-white/75">Tudo gravado</span>
          )}
          {comErros && <Etiqueta tom="vermelho">Há campos por corrigir</Etiqueta>}
        </div>
        <div className="flex gap-2">
          <Botao variante="fantasma" disabled={!sujo} onClick={() => setEdicao({})}>Desfazer</Botao>
          <Botao variante="primario" disabled={!sujo || aGravar} onClick={gravar}>{aGravar ? "A gravar…" : "Gravar"}</Botao>
        </div>
      </div>

      <div className="grid items-start gap-[var(--intervalo)] xl:grid-cols-2">
        <Painel titulo="Identidade" icone={<Building2 />}>
          <div className="space-y-4">
            <Campo etiqueta="Nome do site" obrigatorio ajuda={erro("nomeSite") ?? "Assina os emails que a equipa envia a responder às mensagens de contacto."}>
              <Input value={d.nomeSite} onChange={(e) => set("nomeSite", e.target.value)} />
            </Campo>
            <Campo etiqueta="Descrição curta" ajuda="Uma frase sobre a MotoBox, guardada com as definições. O texto das páginas edita-se em Páginas.">
              <Area rows={2} value={d.descricao} onChange={(e) => set("descricao", e.target.value)} />
            </Campo>
          </div>
        </Painel>

        <Painel
          titulo="Contactos"
          icone={<Mail />}
          descricao={<>Os textos da página Contacto editam-se em <Link href="/admin/paginas?doc=paginas.contacto" className="sublinhado text-white/80">Páginas › Contacto</Link>. Para onde vai cada tipo de email edita-se em {ligacaoAba("emails", "Emails")}.</>}
        >
          <div className="space-y-4">
            <Campo etiqueta="Email da MotoBox" ajuda={erro("emailContacto") ?? "Tem de ser uma caixa de correio que a equipa lê. Recebe as mensagens do site (salvo outro endereço em Emails) e as respostas aos emails que o site envia."}>
              <Input type="email" value={d.emailContacto} placeholder="geral@…" onChange={(e) => set("emailContacto", e.target.value)} />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Telefone">
                <Input type="tel" value={d.telefone} placeholder="+244 …" onChange={(e) => set("telefone", e.target.value)} />
              </Campo>
              <Campo etiqueta="Morada">
                <Input value={d.morada} placeholder="Luanda, Angola" onChange={(e) => set("morada", e.target.value)} />
              </Campo>
            </div>
          </div>
        </Painel>

        <Painel
          titulo="Redes sociais"
          icone={<Share2 />}
          descricao="As ligações aparecem no painel Explorar e na página Contacto. Uma rede em branco não aparece."
          className="xl:row-span-2"
        >
          <div className="space-y-4">
            {REDES.map((r) => (
              <Campo key={r.chave} etiqueta={r.nome} ajuda={erro(r.chave) ?? r.ajuda}>
                <Input type="url" value={texto(r.chave)} placeholder={r.exemplo} onChange={(e) => set(r.chave, e.target.value as never)} />
              </Campo>
            ))}
          </div>
        </Painel>

        <Painel titulo="Desporto e bilheteira" icone={<Ticket />}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo etiqueta="Temporada" ajuda={erro("temporada") ?? "O ano da época em curso."}>
                <Input type="number" inputMode="numeric" min={2000} max={2100} step={1} value={Number.isFinite(d.temporada) ? d.temporada : ""}
                  onChange={(e) => set("temporada", e.target.value === "" ? NaN : Number(e.target.value))} />
              </Campo>
              <Campo etiqueta="Taxa da MotoBox (%)" ajuda={erro("taxaMotobox") ?? "Parte de cada bilhete vendido."}>
                <Input type="number" inputMode="decimal" min={0} max={100} step={0.5} value={Number.isFinite(d.taxaMotobox) ? d.taxaMotobox : ""}
                  onChange={(e) => set("taxaMotobox", e.target.value === "" ? NaN : Number(e.target.value))} />
              </Campo>
              <Campo etiqueta="Moeda" ajuda="Como se escrevem os preços.">
                <Input value={d.moeda} placeholder="Kz" onChange={(e) => set("moeda", e.target.value)} />
              </Campo>
            </div>
            {Number.isFinite(d.taxaMotobox) && (
              <p className="rounded-[var(--raio)] bg-black/20 px-4 py-3 text-[13px] text-white/70">
                Exemplo: num bilhete de 5 000 {d.moeda}, a MotoBox fica com{" "}
                <span className="font-semibold text-white">{((5000 * d.taxaMotobox) / 100).toLocaleString("pt-PT")} {d.moeda}</span>.
              </p>
            )}
            {interruptor("bilheteiraAberta", "Bilheteira aberta", "Fechada, ninguém compra bilhetes no site. Os eventos continuam a aparecer, com a venda fechada.")}
          </div>
        </Painel>

        <Painel titulo="Comunidade" icone={<Users />}>
          <div className="grid gap-2">
            {interruptor("registosAbertos", "Criar conta", "Desligado, ninguém consegue criar uma conta nova no site. Quem já tem conta continua a entrar.")}
            <p className="px-1 text-[13px] text-white/75">Os textos de Entrar e as contas por confirmar estão em {ligacaoAba("contas", "Contas")}.</p>
            {interruptor("marketplaceAberto", "Marketplace aberto", "Desligado, ninguém consegue publicar anúncios novos. Os anúncios publicados continuam à vista.")}
            {interruptor("forumAberto", "Fórum aberto", "Desligado, ninguém consegue responder aos tópicos do fórum. Os tópicos continuam à vista.")}
            {interruptor("newsletterAutomatica", "Newsletter automática", "Ligada, o resumo da semana segue sozinho por email para os subscritores.")}
          </div>
        </Painel>

        <Painel titulo="Site" icone={<BarChart3 />} className="xl:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid content-start gap-2">
              {interruptor("manutencao", "Modo de manutenção", "Os visitantes vêem uma página de manutenção (textos em Entrada e painel › Geral). A equipa com sessão iniciada continua a ver o site, com um aviso vermelho; o painel de gestão e a página de entrar funcionam sempre.")}
              {interruptor("cookieBanner", "Aviso de cookies", "Mostra o aviso de cookies a quem ainda não escolheu (textos em Entrada e painel › Geral). Desligado, ninguém pode aceitar cookies de estatística, por isso a analítica deixa de carregar para visitantes novos.")}
            </div>
            <Campo etiqueta="Código de analítica" ajuda="O código do Google Analytics (G-XXXXXXXXXX) ou do Google Tag Manager (GTM-XXXXXXX). Só carrega depois de o visitante aceitar cookies de estatística, e nunca no painel de gestão.">
              <Input value={d.analytics} placeholder="G-XXXXXXXXXX" onChange={(e) => set("analytics", e.target.value)} />
            </Campo>
          </div>
        </Painel>
      </div>

      {elemento}
    </>
  );
}
