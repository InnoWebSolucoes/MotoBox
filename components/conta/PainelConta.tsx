"use client";

/* ============================================================
   MOTOBOX — Área de membro: o painel
   O cabeçalho pessoal, os separadores e o conteúdo de cada um.
   Não lê nem guarda nada sozinho (excepto nas janelas de editar
   o perfil, os anúncios e a garagem): os dados e as acções vêm
   de app/conta/ContaClient.tsx, que trata da sessão e da API.
   ============================================================ */

import { useState } from "react";
import { Bike, Bell, Bookmark, Flag, LayoutDashboard, ShieldCheck, Tag } from "lucide-react";
import type { AnuncioGuardado } from "@/lib/conta/favoritos";
import type { Preferencias } from "@/lib/conta/preferencias";
import type { AbaConta, ConteudoConta } from "@/lib/conteudo/grupos/contas";
import type {
  AnuncioConta, ArtigoResumo, AvatarDados, ClubeResumo, DadosConta, EventoResumo, MotaGaragem, RotaSemana,
} from "./dados";
import { calcularNivel, type Contagens } from "./nivel";
import { TextosConta, type EstadoGravacao } from "./partes";
import { Cabecalho } from "./Cabecalho";
import { Resumo, type PassoPerfil } from "./Resumo";
import { FormAnuncio, SeparadorAnuncios } from "./Anuncios";
import { SeparadorGuardados } from "./Guardados";
import { SeparadorGaragem } from "./Garagem";
import { SeparadorNotificacoes, SeparadorPreferencias } from "./Preferencias";
import { SeparadorSeguranca } from "./Seguranca";
import { EditarPerfil, normalizarCor } from "./EditarPerfil";

export const ABAS: AbaConta[] = ["resumo", "anuncios", "guardados", "garagem", "preferencias", "notificacoes", "seguranca"];

const ICONES: Record<AbaConta, React.ReactNode> = {
  resumo: <LayoutDashboard />, anuncios: <Tag />, guardados: <Bookmark />, garagem: <Bike />,
  preferencias: <Flag />, notificacoes: <Bell />, seguranca: <ShieldCheck />,
};

export type RotaComProvincias = RotaSemana & { provincias: string[] };

export interface PropsPainel {
  textos: ConteudoConta;
  clubes: ClubeResumo[];
  artigos: ArtigoResumo[];
  eventos: EventoResumo[];
  /** Quantos eventos e provas estão para vir (a lista traz só os primeiros). */
  eventosTotal: number;
  rotas: RotaComProvincias[];
  semana: number;
  marketplaceAberto: boolean;

  dados: DadosConta;
  prefs: Preferencias;
  gravacao: EstadoGravacao;
  gravacaoClube: EstadoGravacao;
  favoritos: AnuncioGuardado[] | null;
  erroFavoritos: string | null;
  aRemoverFavorito: string[];
  artigosGuardados: string[];
  aMudarArtigo: string[];
  aSair: boolean;

  aba: AbaConta;
  irPara: (aba: AbaConta) => void;
  recarregar: () => Promise<void>;
  mudarPrefs: (p: Preferencias) => void;
  escolherClube: (slug: string) => void;
  removerFavorito: (a: AnuncioGuardado) => void;
  tentarFavoritos: () => void;
  alternarArtigo: (slug: string) => void;
  mudarGaragem: (g: MotaGaragem[]) => void;
  sair: () => void;
}

export function PainelConta(p: PropsPainel) {
  const { dados, textos: t } = p;
  const [editarPerfil, setEditarPerfil] = useState(false);
  const [formAnuncio, setFormAnuncio] = useState<AnuncioConta | "novo" | null>(null);

  const perfil = dados.perfil;
  const nome = perfil?.nome || dados.email.split("@")[0];
  const avatar: AvatarDados = {
    cor: normalizarCor(dados.avatar?.cor ?? perfil?.avatar_cor),
    url: dados.avatar?.url ?? null,
  };
  const garagem = dados.garagem ?? [];
  const forum = dados.forum ?? { respostas: 0, topicos: 0, recentes: [] };
  const clube = p.clubes.find((c) => c.slug === dados.clube) ?? null;
  const provincia = perfil?.provincia ?? null;

  // Rota da semana: roda pelas rotas da província do membro (se houver), uma por semana.
  const perto = provincia ? p.rotas.filter((r) => r.provincias.includes(provincia)) : [];
  const fonte = perto.length ? perto : p.rotas;
  const rota = fonte.length ? { ...fonte[p.semana % fonte.length], perto: perto.length > 0 } : null;

  const contagens: Contagens = {
    foto: avatar.url ? 1 : 0,
    provincia: provincia ? 1 : 0,
    telefone: perfil?.telefone ? 1 : 0,
    clube: clube ? 1 : 0,
    interesse: Math.min(10, p.prefs.clubes.length + p.prefs.marcas.length),
    anuncio: dados.anuncios.length,
    resposta: forum.respostas,
    topico: forum.topicos,
    mota: garagem.length,
    verificado: perfil?.verificado ? 1 : 0,
  };
  const nivel = calcularNivel(t, contagens);

  const abrirPerfil = () => setEditarPerfil(true);
  const passos: PassoPerfil[] = [
    { chave: "foto" as const, feito: Boolean(avatar.url), accao: abrirPerfil },
    ...(perfil ? [
      { chave: "provincia" as const, feito: Boolean(provincia), accao: abrirPerfil },
      { chave: "telefone" as const, feito: Boolean(perfil.telefone), accao: abrirPerfil },
    ] : []),
    { chave: "clube" as const, feito: Boolean(clube), accao: abrirPerfil },
    { chave: "garagem" as const, feito: garagem.length > 0, accao: () => p.irPara("garagem") },
    { chave: "interesses" as const, feito: p.prefs.clubes.length + p.prefs.marcas.length > 0, accao: () => p.irPara("preferencias") },
  ];

  // O que interessa ao membro, para escolher os artigos.
  const termos = [
    ...p.clubes.filter((c) => p.prefs.clubes.includes(c.slug)).map((c) => c.nome),
    ...p.prefs.marcas,
    ...(clube ? [clube.nome] : []),
    ...garagem.flatMap((m) => [m.marca, m.modelo]),
  ];

  const contadores: Partial<Record<AbaConta, number>> = {
    anuncios: dados.anuncios.length,
    guardados: (p.favoritos?.length ?? 0) + p.artigosGuardados.length,
    garagem: garagem.length,
  };

  const fotoFundo = [garagem.find((m) => m.foto)?.foto, ...(clube?.foto ?? []), "painel-clubes"];

  return (
    <TextosConta textos={t}>
      <div className="space-y-[var(--intervalo)]">
        <Cabecalho
          nome={nome}
          email={dados.email}
          avatar={avatar}
          verificado={Boolean(perfil?.verificado)}
          provincia={provincia}
          desde={perfil?.registado || dados.conta?.criado || null}
          foto={fotoFundo}
          nivel={nivel}
          contagens={contagens}
          marketplaceAberto={p.marketplaceAberto}
          aSair={p.aSair}
          aoEditarPerfil={abrirPerfil}
          aoPublicar={() => setFormAnuncio("novo")}
          aoSair={p.sair}
        />

        {/* Separadores: o aberto fica no endereço (?aba=). */}
        <nav aria-label="Partes da conta" className="painel painel-escuro no-scrollbar flex gap-1.5 overflow-x-auto p-[var(--intervalo)]">
          {ABAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => p.irPara(a)}
              aria-pressed={p.aba === a}
              aria-current={p.aba === a ? "page" : undefined}
              className="pilula h-11 gap-2 text-[15px] text-white [&_svg]:size-4"
            >
              {ICONES[a]}
              {t.abas[a]}
              {contadores[a] ? (
                <span className={`rounded-full px-1.5 text-xs tabular-nums ${p.aba === a ? "bg-white/25" : "bg-white/15"}`}>{contadores[a]}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="pt-[calc(var(--intervalo)*2)]">
          {p.aba === "resumo" && (
            <Resumo
              anuncios={dados.anuncios}
              favoritos={p.favoritos}
              erroFavoritos={p.erroFavoritos}
              aRemoverFavorito={p.aRemoverFavorito}
              aoRemoverFavorito={p.removerFavorito}
              aoTentarFavoritos={p.tentarFavoritos}
              artigos={p.artigos}
              artigosGuardados={p.artigosGuardados}
              aMudarArtigo={p.aMudarArtigo}
              aoMudarArtigo={p.alternarArtigo}
              termos={termos}
              eventos={p.eventos}
              eventosTotal={p.eventosTotal}
              rota={rota}
              provincia={provincia}
              clube={clube}
              clubes={p.clubes}
              aGuardarClube={p.gravacaoClube === "a-guardar"}
              aoEscolherClube={p.escolherClube}
              garagem={garagem}
              forum={forum}
              encomendas={dados.encomendas}
              passos={passos}
              marketplaceAberto={p.marketplaceAberto}
              irPara={p.irPara}
              aoPublicar={() => setFormAnuncio("novo")}
            />
          )}

          {p.aba === "anuncios" && (
            <SeparadorAnuncios
              anuncios={dados.anuncios}
              verificado={Boolean(perfil?.verificado)}
              marketplaceAberto={p.marketplaceAberto}
              aoPublicar={() => setFormAnuncio("novo")}
              aoEditar={(a) => setFormAnuncio(a)}
              aoMudar={p.recarregar}
            />
          )}

          {p.aba === "guardados" && (
            <SeparadorGuardados
              anuncios={p.favoritos}
              erroAnuncios={p.erroFavoritos}
              aRemover={p.aRemoverFavorito}
              aoRemoverAnuncio={p.removerFavorito}
              aoTentar={p.tentarFavoritos}
              artigos={p.artigos}
              artigosGuardados={p.artigosGuardados}
              aMudarArtigo={p.aMudarArtigo}
              aoMudarArtigo={p.alternarArtigo}
            />
          )}

          {p.aba === "garagem" && <SeparadorGaragem garagem={garagem} aoMudar={p.mudarGaragem} />}

          {p.aba === "preferencias" && (
            <SeparadorPreferencias
              prefs={p.prefs}
              clubes={p.clubes}
              clube={clube?.slug ?? null}
              gravacao={p.gravacao}
              gravacaoClube={p.gravacaoClube}
              aoMudar={p.mudarPrefs}
              aoMudarClube={p.escolherClube}
            />
          )}

          {p.aba === "notificacoes" && (
            <SeparadorNotificacoes prefs={p.prefs} email={dados.email} gravacao={p.gravacao} aoMudar={p.mudarPrefs} />
          )}

          {p.aba === "seguranca" && (
            <SeparadorSeguranca
              email={dados.email}
              provedor={dados.conta?.provedor ?? "email"}
              ultimaEntrada={dados.conta?.ultimaEntrada ?? null}
            />
          )}
        </div>
      </div>

      {editarPerfil && (
        <EditarPerfil
          perfil={perfil}
          avatar={avatar}
          nomeConta={nome}
          clube={clube?.slug ?? null}
          clubes={p.clubes}
          aoFechar={() => setEditarPerfil(false)}
          aoGuardar={async () => { setEditarPerfil(false); await p.recarregar(); }}
        />
      )}

      {formAnuncio && (
        <FormAnuncio
          anuncio={formAnuncio === "novo" ? null : formAnuncio}
          provinciaPadrao={provincia ?? "Luanda"}
          aoFechar={() => setFormAnuncio(null)}
          aoGuardar={async () => { setFormAnuncio(null); await p.recarregar(); }}
        />
      )}
    </TextosConta>
  );
}
