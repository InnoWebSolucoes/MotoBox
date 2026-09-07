"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/admin/store";
import {
  CabecalhoPagina, Painel, Campo, Input, Area, Interruptor, useAviso,
} from "@/components/admin/kit";

export default function AdminDefinicoes() {
  const { estado, guardarDefinicoes } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const d = estado.definicoes;

  const [rascunho, setRascunho] = useState(d);
  const set = (campos: Partial<typeof d>) => setRascunho((r) => ({ ...r, ...campos }));

  const guardar = () => {
    guardarDefinicoes(rascunho);
    mostrar("Definições guardadas.");
  };

  // Interruptores aplicam-se de imediato — são controlos operacionais
  const alternar = (campos: Partial<typeof d>, texto: string) => {
    setRascunho((r) => ({ ...r, ...campos }));
    guardarDefinicoes(campos);
    mostrar(texto);
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Definições"
        descricao="Identidade do site, parâmetros comerciais e estado dos módulos."
        accoes={
          <button type="button" onClick={guardar}
            className="h-10 bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark">
            Guardar alterações
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel titulo="Identidade" descricao="Nome e descrição usados nos metadados do site.">
          <div className="space-y-4">
            <Campo etiqueta="Nome do site">
              <Input value={rascunho.nomeSite} onChange={(e) => set({ nomeSite: e.target.value })} />
            </Campo>
            <Campo etiqueta="Descrição">
              <Area rows={2} value={rascunho.descricao} onChange={(e) => set({ descricao: e.target.value })} />
            </Campo>
            <Campo etiqueta="Temporada activa" ajuda="Usada nas classificações e no calendário.">
              <Input type="number" value={rascunho.temporada}
                onChange={(e) => set({ temporada: Number(e.target.value) })} />
            </Campo>
          </div>
        </Painel>

        <Painel titulo="Contactos" descricao="Apresentados no rodapé e na página de contacto.">
          <div className="space-y-4">
            <Campo etiqueta="Email">
              <Input type="email" value={rascunho.emailContacto} onChange={(e) => set({ emailContacto: e.target.value })} />
            </Campo>
            <Campo etiqueta="Telefone">
              <Input value={rascunho.telefone} onChange={(e) => set({ telefone: e.target.value })} />
            </Campo>
            <Campo etiqueta="Morada">
              <Input value={rascunho.morada} onChange={(e) => set({ morada: e.target.value })} />
            </Campo>
          </div>
        </Painel>

        <Painel titulo="Comercial" descricao="Parâmetros da bilheteira e das comissões.">
          <div className="space-y-4">
            <Campo etiqueta="Taxa Motobox (%)" ajuda="Percentagem cobrada sobre cada bilhete vendido.">
              <Input type="number" min={0} max={100} step={0.5} value={rascunho.taxaMotobox}
                onChange={(e) => set({ taxaMotobox: Number(e.target.value) })} />
            </Campo>
            <Campo etiqueta="Moeda">
              <Input value={rascunho.moeda} onChange={(e) => set({ moeda: e.target.value })} />
            </Campo>
            <div className="border border-ink-700 bg-ink-950 p-3">
              <p className="text-xs text-ink-400">
                Exemplo: num bilhete de 5 000 {rascunho.moeda}, a comissão é de{" "}
                <span className="font-display text-gold">
                  {(5000 * rascunho.taxaMotobox / 100).toLocaleString("pt-PT")} {rascunho.moeda}
                </span>
                .
              </p>
            </div>
          </div>
        </Painel>

        <Painel titulo="Redes sociais">
          <div className="space-y-4">
            <Campo etiqueta="Instagram">
              <Input value={rascunho.instagram} onChange={(e) => set({ instagram: e.target.value })} />
            </Campo>
            <Campo etiqueta="Facebook">
              <Input value={rascunho.facebook} onChange={(e) => set({ facebook: e.target.value })} />
            </Campo>
            <Campo etiqueta="YouTube">
              <Input value={rascunho.youtube} placeholder="https://" onChange={(e) => set({ youtube: e.target.value })} />
            </Campo>
          </div>
        </Painel>

        <Painel titulo="Módulos" descricao="Ligar ou desligar áreas do site. Aplica-se de imediato."
          className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Interruptor activo={rascunho.bilheteiraAberta} etiqueta="Bilheteira aberta"
              descricao="Permite a compra de bilhetes online."
              onChange={(v) => alternar({ bilheteiraAberta: v }, v ? "Bilheteira aberta." : "Bilheteira fechada.")} />
            <Interruptor activo={rascunho.marketplaceAberto} etiqueta="Marketplace aberto"
              descricao="Permite publicar e consultar anúncios."
              onChange={(v) => alternar({ marketplaceAberto: v }, v ? "Marketplace aberto." : "Marketplace fechado.")} />
            <Interruptor activo={rascunho.forumAberto} etiqueta="Fórum aberto"
              descricao="Permite criar tópicos e responder."
              onChange={(v) => alternar({ forumAberto: v }, v ? "Fórum aberto." : "Fórum fechado.")} />
            <Interruptor activo={rascunho.registosAbertos} etiqueta="Registos abertos"
              descricao="Permite a criação de novas contas."
              onChange={(v) => alternar({ registosAbertos: v }, v ? "Registos abertos." : "Registos fechados.")} />
            <Interruptor activo={rascunho.cookieBanner} etiqueta="Banner de cookies"
              descricao="Mostra o pedido de consentimento aos visitantes."
              onChange={(v) => alternar({ cookieBanner: v }, v ? "Banner activo." : "Banner desligado.")} />
            <Interruptor activo={rascunho.manutencao} etiqueta="Modo de manutenção"
              descricao="Mostra um aviso de manutenção no site público."
              onChange={(v) => alternar({ manutencao: v }, v ? "Modo de manutenção activo." : "Modo de manutenção desligado.")} />
          </div>
        </Painel>

        <Painel titulo="Analítica" className="lg:col-span-2">
          <Campo etiqueta="Identificador de analítica"
            ajuda="Só é carregado depois de o visitante aceitar cookies analíticos.">
            <Input value={rascunho.analytics} placeholder="G-XXXXXXXXXX"
              onChange={(e) => set({ analytics: e.target.value })} />
          </Campo>
        </Painel>
      </div>

      {elemento}
    </>
  );
}
