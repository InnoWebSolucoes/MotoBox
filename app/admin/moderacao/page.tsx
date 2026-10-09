"use client";

/* ============================================================
   MOTOBOX ADMIN — Moderação
   As denúncias que os visitantes fazem no site (anúncios,
   tópicos, perfis). Abre-se uma, vê-se o conteúdo tal como está,
   escolhe-se o que fazer (esconder, fechar, apagar, suspender) e
   resolve-se. As acções usam as mesmas escritas do resto do
   painel: só contam como feitas quando a base de dados confirma.
   ============================================================ */

import { useMemo, useState } from "react";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { useAdmin, type EstadoAdmin } from "@/lib/admin/store";
import { formatKz } from "@/lib/data";
import {
  Abas, Area, Aviso, Botao, CabecalhoPagina, Campo, Confirmar, Estado, Estatistica, Etiqueta,
  Ferramentas, Gaveta, Painel, Procura, Seleccao, Vazio, useAviso, usePaginacao,
} from "@/components/admin/kit";
import type { Denuncia, EstadoModeracao } from "@/lib/admin/types";
import { comBase } from "@/lib/base";
import { useVisibilidade, type TipoVisivel } from "./_comum/visibilidade";
import { dataCurta, haQuanto } from "./_comum/formato";

const TIPOS: { valor: Denuncia["tipo"]; nome: string }[] = [
  { valor: "forum", nome: "Fórum" },
  { valor: "marketplace", nome: "Marketplace" },
  { valor: "comentario", nome: "Comentário" },
  { valor: "perfil", nome: "Perfil" },
];
const nomeTipo = (t: string) => TIPOS.find((x) => x.valor === t)?.nome ?? t;
const ROTULO_ESTADO: Record<EstadoModeracao, string> = {
  pendente: "por resolver", aprovado: "resolvida", rejeitado: "arquivada",
};

/** Uma coisa que se pode fazer ao conteúdo denunciado. */
interface Accao {
  id: string;
  nome: string;
  descricao: string;
  /** Texto que fica no histórico da denúncia. */
  nota: string;
  perigo?: boolean;
  executar: () => Promise<string | null>;
}

interface Alvo {
  titulo: string;
  linhas: string[];
  href?: string;
  escondido?: boolean;
}

/**
 * Para cada tipo de denúncia, o que ela aponta e o que se pode fazer.
 * As acções usam as mesmas escritas do resto do painel, por isso só
 * contam como feitas quando a base de dados confirma.
 */
function opcoesPara(
  d: Denuncia,
  estado: EstadoAdmin,
  atualizar: (c: "topicos" | "utilizadores", id: string, campos: Record<string, unknown>) => Promise<string | null>,
  remover: (c: "anuncios" | "topicos", id: string) => Promise<string | null>,
  visivel: (t: TipoVisivel, id: string) => boolean,
  mudarVisivel: (t: TipoVisivel, id: string, mostrar: boolean) => Promise<string | null>,
): { alvo: Alvo | null; accoes: Accao[]; aviso?: string } {
  if (d.tipo === "marketplace") {
    const a = estado.anuncios.find((x) => x.id === d.alvoId);
    if (!a) return { alvo: null, accoes: [], aviso: "Este anúncio já não existe no marketplace. Não há mais nada a fazer ao conteúdo." };
    const aVista = visivel("anuncios", a.id);
    return {
      alvo: {
        titulo: a.titulo,
        linhas: [`${formatKz(a.preco)} · ${a.provincia}`, `Vendedor: ${a.vendedor.nome}`, a.descricao],
        href: `/marketplace/${encodeURIComponent(a.id)}`,
        escondido: !aVista,
      },
      accoes: [
        ...(aVista ? [{
          id: "esconder-anuncio", nome: "Esconder o anúncio",
          descricao: "Sai do marketplace mas fica guardado: pode voltar a mostrá-lo em Marketplace.",
          nota: "Anúncio escondido do marketplace.",
          executar: () => mudarVisivel("anuncios", a.id, false),
        }] : []),
        {
          id: "apagar-anuncio", nome: "Apagar o anúncio", perigo: true,
          descricao: "Sai do marketplace de imediato. Não se pode desfazer.",
          nota: "Anúncio apagado do marketplace.",
          executar: () => remover("anuncios", a.id),
        },
      ],
    };
  }

  if (d.tipo === "forum") {
    const t = estado.topicos.find((x) => x.id === d.alvoId);
    if (!t) return { alvo: null, accoes: [], aviso: "Este tópico já não existe no fórum. Não há mais nada a fazer ao conteúdo." };
    const aVista = visivel("topicos", t.id);
    return {
      alvo: {
        titulo: t.titulo,
        linhas: [`${t.categoria} · por ${t.autor}`, t.excerto],
        href: `/forum/${encodeURIComponent(t.id)}`,
        escondido: !aVista,
      },
      accoes: [
        ...(t.bloqueado ? [] : [{
          id: "fechar-topico", nome: "Fechar o tópico",
          descricao: "Continua visível, mas deixa de aceitar respostas.",
          nota: "Tópico fechado a novas respostas.",
          executar: () => atualizar("topicos", t.id, { bloqueado: true }),
        }]),
        ...(aVista ? [{
          id: "esconder-topico", nome: "Esconder o tópico",
          descricao: "Sai do fórum mas fica guardado: pode voltar a mostrá-lo em Fórum.",
          nota: "Tópico escondido do fórum.",
          executar: () => mudarVisivel("topicos", t.id, false),
        }] : []),
        {
          id: "apagar-topico", nome: "Apagar o tópico", perigo: true,
          descricao: "Sai do fórum com todas as respostas. Não se pode desfazer.",
          nota: "Tópico apagado do fórum.",
          executar: () => remover("topicos", t.id),
        },
      ],
    };
  }

  if (d.tipo === "perfil") {
    const u = estado.utilizadores.find((x) => x.id === d.alvoId);
    if (!u) return { alvo: null, accoes: [], aviso: "Esta conta já não existe. Não há mais nada a fazer." };
    return {
      alvo: { titulo: u.nome, linhas: [u.email, `Estado actual: ${u.estado}`] },
      accoes: [
        ...(u.estado === "suspenso" ? [] : [{
          id: "suspender", nome: "Suspender a conta",
          descricao: "Bloqueio temporário. Pode reactivar-se em Utilizadores.",
          nota: "Conta suspensa.",
          executar: () => atualizar("utilizadores", u.id, { estado: "suspenso" }),
        }]),
        ...(u.estado === "banido" ? [] : [{
          id: "banir", nome: "Banir a conta", perigo: true,
          descricao: "Bloqueio definitivo por violação grave das regras.",
          nota: "Conta banida.",
          executar: () => atualizar("utilizadores", u.id, { estado: "banido" }),
        }]),
      ],
    };
  }

  return {
    alvo: null,
    accoes: [],
    aviso: "Os comentários ainda não se gerem pelo painel. Remova-o onde foi publicado e registe aqui o que fez.",
  };
}

type Vista = "pendente" | "aprovado" | "rejeitado" | "todas";

export default function AdminModeracao() {
  const { estado, atualizar, remover } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const vis = useVisibilidade();

  const [procura, setProcura] = useState("");
  const [vista, setVista] = useState<Vista>("pendente");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [aberta, setAberta] = useState<Denuncia | null>(null);
  const [escolha, setEscolha] = useState<string>("nada");
  const [resolucao, setResolucao] = useState("");
  const [aAplicar, setAAplicar] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const filtradas = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return estado.denuncias
      .filter((d) => {
        if (vista !== "todas" && d.estado !== vista) return false;
        if (filtroTipo && d.tipo !== filtroTipo) return false;
        if (q && !`${d.alvoTitulo} ${d.motivo} ${d.denunciante} ${d.detalhe}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.criado.localeCompare(a.criado));
  }, [estado.denuncias, procura, vista, filtroTipo]);
  const { fatia, controlos } = usePaginacao(filtradas, 15);

  const contagem = useMemo(() => ({
    pendente: estado.denuncias.filter((d) => d.estado === "pendente").length,
    aprovado: estado.denuncias.filter((d) => d.estado === "aprovado").length,
    rejeitado: estado.denuncias.filter((d) => d.estado === "rejeitado").length,
  }), [estado.denuncias]);

  const opcoes = aberta
    ? opcoesPara(
        aberta, estado,
        (c, id, campos) => atualizar(c, id, campos),
        (c, id) => remover(c, id),
        vis.visivel, vis.mudar,
      )
    : null;
  const accao = opcoes?.accoes.find((a) => a.id === escolha) ?? null;

  const abrir = (d: Denuncia) => {
    setAberta(d);
    setEscolha("nada");
    setResolucao(d.resolucao ?? "");
  };

  const escolher = (id: string) => {
    setEscolha(id);
    const nova = opcoes?.accoes.find((a) => a.id === id);
    // A nota acompanha a acção escolhida, a não ser que já tenha sido escrita à mão.
    const notasAutomaticas = new Set(["", ...(opcoes?.accoes.map((a) => a.nota) ?? [])]);
    if (notasAutomaticas.has(resolucao.trim())) setResolucao(nova?.nota ?? "");
  };

  /** Marca a denúncia; se houver acção escolhida, faz primeiro a acção. */
  const resolver = async (d: Denuncia, novo: EstadoModeracao) => {
    setAAplicar(true);
    try {
      if (novo === "aprovado" && accao) {
        const falha = await accao.executar();
        if (falha) { mostrar(`A acção falhou: ${falha}`, "erro"); return; }
      }
      const texto = resolucao.trim() || (novo === "rejeitado" ? "Sem violação das regras." : "");
      const falha = await atualizar("denuncias", d.id, { estado: novo, resolucao: texto || undefined });
      if (falha) { mostrar(falha, "erro"); return; }
      mostrar(novo === "aprovado"
        ? (accao ? `${accao.nota} Denúncia resolvida.` : "Denúncia resolvida.")
        : "Denúncia arquivada sem acção.");
      setAberta(null);
    } finally {
      setAAplicar(false);
    }
  };

  const aplicar = () => {
    if (!aberta) return;
    if (accao?.perigo) { setConfirmar(true); return; }
    void resolver(aberta, "aprovado");
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Moderação"
        sobretitulo="Comunidade"
        icone={<ShieldAlert />}
        descricao="As denúncias que os visitantes fazem no site. Abra uma, veja o conteúdo, escolha o que fazer e resolva."
      />

      <div className="mb-[var(--intervalo)] grid grid-cols-1 gap-[var(--intervalo)] sm:grid-cols-3">
        <Estatistica rotulo="Por resolver" valor={contagem.pendente} tom={contagem.pendente ? "red" : "neutral"}
          variacao={contagem.pendente ? "À espera da equipa" : "Nada por resolver"} />
        <Estatistica rotulo="Resolvidas com acção" valor={contagem.aprovado} tom="ok" variacao="Conteúdo escondido, fechado ou apagado" />
        <Estatistica rotulo="Arquivadas sem acção" valor={contagem.rejeitado} variacao="Sem violação das regras" />
      </div>

      <Painel>
        <div className="mb-4">
          <Abas<Vista>
            rotulo="Estado das denúncias"
            activa={vista}
            onChange={setVista}
            abas={[
              { chave: "pendente", nome: "Por resolver", contador: contagem.pendente },
              { chave: "aprovado", nome: "Resolvidas", contador: contagem.aprovado },
              { chave: "rejeitado", nome: "Arquivadas", contador: contagem.rejeitado },
              { chave: "todas", nome: "Todas", contador: estado.denuncias.length },
            ]}
          />
        </div>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Conteúdo, motivo ou quem denunciou…" />
          <Seleccao valor={filtroTipo} onChange={setFiltroTipo} aria-label="Onde"
            opcoes={[{ valor: "", nome: "Todo o site" }, ...TIPOS]}
            className="sm:w-48" />
        </Ferramentas>

        {filtradas.length === 0 ? (
          <Vazio titulo={vista === "pendente" ? "Não há denúncias por resolver" : "Nada com estes filtros"}>
            {vista === "pendente" ? "Quando alguém denunciar um anúncio, um tópico ou um perfil, aparece aqui." : "Alargue os filtros."}
          </Vazio>
        ) : (
          <ul className="space-y-[var(--intervalo)]">
            {fatia.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => abrir(d)}
                  className="group w-full rounded-[var(--raio)] border border-white/[0.08] bg-black/[0.15] p-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.05]">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Etiqueta>{nomeTipo(d.tipo)}</Etiqueta>
                    <Estado valor={d.estado} rotulo={ROTULO_ESTADO[d.estado]} />
                    <span className="ml-auto text-xs text-white/70">{haQuanto(d.criado)}</span>
                  </div>
                  <p className="font-medium text-white">{d.alvoTitulo}</p>
                  <p className="mt-1 text-sm font-medium text-white/85">{d.motivo}</p>
                  {d.detalhe && <p className="mt-1.5 line-clamp-2 text-sm text-white/80">{d.detalhe}</p>}
                  <p className="mt-2 text-xs text-white/70">Denunciado por {d.denunciante}</p>
                  {d.resolucao && (
                    <p className="mt-2 border-l-2 border-ok pl-2 text-xs text-white/70">{d.resolucao}</p>
                  )}
                  {d.estado === "pendente" && (
                    <p className="mt-3 text-sm font-medium text-white group-hover:text-mb-red-light">Resolver →</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {controlos}
      </Painel>

      <Gaveta
        aberta={aberta !== null}
        aoFechar={() => setAberta(null)}
        titulo="Resolver denúncia"
        descricao={aberta ? `${nomeTipo(aberta.tipo)} · ${aberta.motivo}` : undefined}
        largura="max-w-xl"
        rodape={aberta && (
          <>
            <Botao variante="fantasma" onClick={() => void resolver(aberta, "rejeitado")} disabled={aAplicar}>
              Arquivar sem acção
            </Botao>
            <Botao variante="primario" onClick={aplicar} disabled={aAplicar}>
              {aAplicar ? "A aplicar…" : accao ? `${accao.nome} e resolver` : "Marcar como resolvida"}
            </Botao>
          </>
        )}
      >
        {aberta && opcoes && (
          <div className="space-y-5">
            {/* 1. O que foi denunciado e porquê */}
            <section>
              <p className="mb-1.5 text-[13px] font-medium text-white/75">A denúncia</p>
              <div className="rounded-[var(--raio)] border border-white/10 bg-black/[0.18] p-4 text-sm">
                <p className="text-white">{aberta.motivo}</p>
                {aberta.detalhe && <p className="mt-1 text-white/70">{aberta.detalhe}</p>}
                <p className="mt-2 text-xs text-white/70">
                  {aberta.denunciante} · {dataCurta(aberta.criado, true)}
                </p>
              </div>
            </section>

            {/* 2. O conteúdo, tal como está agora */}
            <section>
              <p className="mb-1.5 text-[13px] font-medium text-white/75">Conteúdo denunciado</p>
              {opcoes.alvo ? (
                <div className="rounded-[var(--raio)] border border-white/10 bg-black/[0.18] p-4 text-sm">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-white">
                    {opcoes.alvo.titulo}
                    {opcoes.alvo.escondido && <Estado valor="suspenso" rotulo="Escondido do site" />}
                  </p>
                  {opcoes.alvo.linhas.filter(Boolean).map((l, i) => (
                    <p key={i} className="mt-1 line-clamp-3 text-white/80">{l}</p>
                  ))}
                  {opcoes.alvo.href && !opcoes.alvo.escondido && (
                    <a href={comBase(opcoes.alvo.href)} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white">
                      <ExternalLink className="size-3.5" aria-hidden />
                      <span className="sublinhado">Abrir no site</span>
                    </a>
                  )}
                </div>
              ) : (
                <Aviso tom="atencao">{opcoes.aviso}</Aviso>
              )}
            </section>

            {/* 3. O que fazer */}
            {aberta.estado === "pendente" && opcoes.accoes.length > 0 && (
              <section>
                <p className="mb-1.5 text-[13px] font-medium text-white/75">O que fazer</p>
                <div className="space-y-[var(--intervalo)]" role="radiogroup" aria-label="Acção sobre o conteúdo">
                  {[{ id: "nada", nome: "Deixar o conteúdo como está", descricao: "Só regista a denúncia como resolvida.", perigo: false }, ...opcoes.accoes].map((a) => (
                    <label key={a.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-[var(--raio)] border p-3.5 transition-colors ${
                        escolha === a.id
                          ? (a.perigo ? "border-mb-red bg-mb-red/15" : "border-white/40 bg-white/[0.07]")
                          : "border-white/10 hover:border-white/25"
                      }`}>
                      <input type="radio" name="accao" checked={escolha === a.id} onChange={() => escolher(a.id)}
                        className="mt-1 accent-mb-red" />
                      <span>
                        <span className={`block text-sm ${a.perigo ? "text-mb-red-light" : "text-white"}`}>{a.nome}</span>
                        <span className="block text-xs leading-relaxed text-white/75">{a.descricao}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {aberta.estado !== "pendente" && (
              <p className="text-sm text-white/80">
                Já {ROTULO_ESTADO[aberta.estado]}{aberta.resolucao ? `: ${aberta.resolucao}` : "."} Pode mudar a nota e voltar a marcar.
              </p>
            )}

            <Campo etiqueta="Nota de resolução" ajuda="Fica no histórico da denúncia, só para a equipa. Preenche-se com a acção escolhida.">
              <Area rows={3} value={resolucao} onChange={(e) => setResolucao(e.target.value)}
                placeholder="Ex.: Anúncio escondido e vendedor avisado por telefone." />
            </Campo>
          </div>
        )}
      </Gaveta>

      <Confirmar
        aberta={confirmar}
        aoFechar={() => setConfirmar(false)}
        aoConfirmar={() => { if (aberta) void resolver(aberta, "aprovado"); }}
        titulo={accao?.nome ?? "Confirmar"}
        mensagem={`${accao?.descricao ?? ""} A denúncia fica resolvida.`}
        textoConfirmar={accao?.nome ?? "Confirmar"}
        perigo
      />

      {elemento}
    </>
  );
}
