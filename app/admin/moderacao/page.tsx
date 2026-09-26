"use client";

import { useMemo, useState } from "react";
import { useAdmin, type EstadoAdmin } from "@/lib/admin/store";
import { formatDataCurta, formatKz } from "@/lib/data";
import {
  CabecalhoPagina, Painel, Ferramentas, Procura, Seleccao, Estatistica,
  Estado, Gaveta, Campo, Area, Confirmar, useAviso,
} from "@/components/admin/kit";
import type { Denuncia, EstadoModeracao } from "@/lib/admin/types";

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
): { alvo: Alvo | null; accoes: Accao[]; aviso?: string } {
  if (d.tipo === "marketplace") {
    const a = estado.anuncios.find((x) => x.id === d.alvoId);
    if (!a) return { alvo: null, accoes: [], aviso: "Este anúncio já não existe no marketplace. Não há mais nada a fazer ao conteúdo." };
    return {
      alvo: {
        titulo: a.titulo,
        linhas: [`${formatKz(a.preco)} · ${a.provincia}`, `Vendedor: ${a.vendedor.nome}`, a.descricao],
        href: `/marketplace/${encodeURIComponent(a.id)}`,
      },
      accoes: [{
        id: "apagar-anuncio", nome: "Apagar o anúncio", perigo: true,
        descricao: "Sai do marketplace de imediato. Não se pode desfazer.",
        nota: "Anúncio apagado do marketplace.",
        executar: () => remover("anuncios", a.id),
      }],
    };
  }

  if (d.tipo === "forum") {
    const t = estado.topicos.find((x) => x.id === d.alvoId);
    if (!t) return { alvo: null, accoes: [], aviso: "Este tópico já não existe no fórum. Não há mais nada a fazer ao conteúdo." };
    return {
      alvo: {
        titulo: t.titulo,
        linhas: [`${t.categoria} · por ${t.autor}`, t.excerto],
        href: `/forum/${encodeURIComponent(t.id)}`,
      },
      accoes: [
        ...(t.bloqueado ? [] : [{
          id: "fechar-topico", nome: "Fechar o tópico",
          descricao: "Continua visível, mas deixa de aceitar respostas.",
          nota: "Tópico fechado a novas respostas.",
          executar: () => atualizar("topicos", t.id, { bloqueado: true }),
        }]),
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

export default function AdminModeracao() {
  const { estado, atualizar, remover } = useAdmin();
  const { mostrar, elemento } = useAviso();

  const [procura, setProcura] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("pendente");
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
        if (filtroEstado && d.estado !== filtroEstado) return false;
        if (filtroTipo && d.tipo !== filtroTipo) return false;
        if (q && !`${d.alvoTitulo} ${d.motivo} ${d.denunciante} ${d.detalhe}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.criado.localeCompare(a.criado));
  }, [estado.denuncias, procura, filtroEstado, filtroTipo]);

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
        descricao="Denúncias feitas pelos visitantes. Abra uma, veja o conteúdo, escolha o que fazer e resolva."
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Estatistica rotulo="Por resolver" valor={contagem.pendente} tom={contagem.pendente ? "red" : "neutral"} />
        <Estatistica rotulo="Resolvidas com acção" valor={contagem.aprovado} tom="ok" />
        <Estatistica rotulo="Arquivadas" valor={contagem.rejeitado} />
      </div>

      <Painel>
        <Ferramentas>
          <Procura valor={procura} onChange={setProcura} placeholder="Alvo, motivo ou denunciante…" />
          <Seleccao valor={filtroEstado} onChange={setFiltroEstado} aria-label="Estado"
            opcoes={[
              { valor: "", nome: "Todos os estados" },
              { valor: "pendente", nome: "Por resolver" },
              { valor: "aprovado", nome: "Resolvidas com acção" },
              { valor: "rejeitado", nome: "Arquivadas" },
            ]}
            className="w-auto min-w-[180px]" />
          <Seleccao valor={filtroTipo} onChange={setFiltroTipo} aria-label="Tipo"
            opcoes={[{ valor: "", nome: "Todos os tipos" }, ...TIPOS]}
            className="w-auto min-w-[150px]" />
        </Ferramentas>

        {filtradas.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-500">
            Nada para moderar com estes filtros.
          </p>
        ) : (
          <ul className="space-y-3">
            {filtradas.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => abrir(d)}
                  className="w-full border border-ink-700 bg-ink-950 p-4 text-left transition-colors hover:border-ink-600">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="border border-ink-700 px-2 py-0.5 text-[10px] font-display uppercase tracking-widest text-ink-400">
                      {nomeTipo(d.tipo)}
                    </span>
                    <Estado valor={d.estado} rotulo={ROTULO_ESTADO[d.estado]} />
                    <span className="ml-auto text-xs text-ink-500">{formatDataCurta(d.criado)}</span>
                  </div>
                  <p className="font-medium text-white">{d.alvoTitulo}</p>
                  <p className="mt-1 text-sm text-mb-red">{d.motivo}</p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink-400">{d.detalhe}</p>
                  <p className="mt-2 text-xs text-ink-500">Denunciado por {d.denunciante}</p>
                  {d.resolucao && (
                    <p className="mt-2 border-l-2 border-ok pl-2 text-xs text-ink-300">{d.resolucao}</p>
                  )}
                  {d.estado === "pendente" && (
                    <p className="mt-3 font-display text-[11px] uppercase tracking-wider text-white">Resolver →</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Painel>

      <Gaveta
        aberta={aberta !== null}
        aoFechar={() => setAberta(null)}
        titulo="Resolver denúncia"
        descricao={aberta ? `${nomeTipo(aberta.tipo)} · ${aberta.motivo}` : undefined}
        largura="max-w-xl"
        rodape={aberta && (
          <>
            <button type="button" onClick={() => void resolver(aberta, "rejeitado")} disabled={aAplicar}
              className="h-10 border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-ink-800 disabled:opacity-60">
              Arquivar sem acção
            </button>
            <button type="button" onClick={aplicar} disabled={aAplicar}
              className="h-10 bg-mb-red px-5 font-display text-xs uppercase tracking-wider text-white transition-colors hover:bg-mb-red-dark disabled:opacity-60">
              {aAplicar ? "A aplicar…" : accao ? `${accao.nome} e resolver` : "Marcar como resolvida"}
            </button>
          </>
        )}
      >
        {aberta && opcoes && (
          <div className="space-y-5">
            {/* 1. O que foi denunciado e porquê */}
            <section>
              <p className="mb-1.5 text-[10px] font-display uppercase tracking-widest text-ink-500">A denúncia</p>
              <div className="border border-ink-700 bg-ink-950 p-3 text-sm">
                <p className="text-white">{aberta.motivo}</p>
                <p className="mt-1 text-ink-300">{aberta.detalhe}</p>
                <p className="mt-2 text-xs text-ink-500">
                  {aberta.denunciante} · {formatDataCurta(aberta.criado)}
                </p>
              </div>
            </section>

            {/* 2. O conteúdo, tal como está agora */}
            <section>
              <p className="mb-1.5 text-[10px] font-display uppercase tracking-widest text-ink-500">Conteúdo denunciado</p>
              {opcoes.alvo ? (
                <div className="border border-ink-700 bg-ink-950 p-3 text-sm">
                  <p className="font-medium text-white">{opcoes.alvo.titulo}</p>
                  {opcoes.alvo.linhas.filter(Boolean).map((l, i) => (
                    <p key={i} className="mt-1 line-clamp-3 text-ink-400">{l}</p>
                  ))}
                  {opcoes.alvo.href && (
                    <a href={opcoes.alvo.href} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-white underline hover:text-mb-red">
                      Abrir no site
                    </a>
                  )}
                </div>
              ) : (
                <p className="border-l-2 border-gold pl-3 text-sm text-ink-300">{opcoes.aviso}</p>
              )}
            </section>

            {/* 3. O que fazer */}
            {aberta.estado === "pendente" && opcoes.accoes.length > 0 && (
              <section>
                <p className="mb-1.5 text-[10px] font-display uppercase tracking-widest text-ink-500">O que fazer</p>
                <div className="space-y-2" role="radiogroup" aria-label="Acção sobre o conteúdo">
                  {[{ id: "nada", nome: "Deixar o conteúdo como está", descricao: "Só regista a denúncia como resolvida.", perigo: false }, ...opcoes.accoes].map((a) => (
                    <label key={a.id}
                      className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors ${
                        escolha === a.id ? (a.perigo ? "border-mb-red bg-mb-red/10" : "border-white/40 bg-ink-850") : "border-ink-700 hover:border-ink-600"
                      }`}>
                      <input type="radio" name="accao" checked={escolha === a.id} onChange={() => escolher(a.id)}
                        className="mt-1 accent-mb-red" />
                      <span>
                        <span className={`block text-sm ${a.perigo ? "text-mb-red" : "text-white"}`}>{a.nome}</span>
                        <span className="block text-xs text-ink-400">{a.descricao}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {aberta.estado !== "pendente" && (
              <p className="text-sm text-ink-400">
                Já resolvida{aberta.resolucao ? `: ${aberta.resolucao}` : "."} Pode mudar a nota e voltar a marcar.
              </p>
            )}

            <Campo etiqueta="Nota de resolução" ajuda="Fica no histórico. Preenche-se com a acção escolhida.">
              <Area rows={3} value={resolucao} onChange={(e) => setResolucao(e.target.value)}
                placeholder="Ex.: Anúncio apagado e vendedor avisado por telefone." />
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
