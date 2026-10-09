"use client";

/* ============================================================
   MOTOBOX ADMIN — Clubes e movimentos
   Um editor por clube que junta as duas metades da página
   /clubes/[slug]:
   - a ficha, na tabela `clubes` (nome, tipo, sede, fundação,
     descrição, actividades, encontros, imagens, cor, redes,
     contacto, fonte, destaque, publicação);
   - o perfil alargado, no conteúdo editável (grupo
     "clubes-perfis", chave = slug do clube).
   Os movimentos (tipo "Movimento", ex.: Lady Riders) têm a sua
   aba. A aba "Página Clubes" edita todos os textos fixos de
   /clubes e da página de cada clube ("paginas.clubes").
   ============================================================ */

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Plus, Star, Users } from "lucide-react";
import { useAdmin, slugify } from "@/lib/admin/store";
import { comBase } from "@/lib/base";
import type { Clube, TipoClube } from "@/lib/types";
import { PROVINCIAS } from "@/lib/provincias";
import { PERFIS_CLUBES } from "@/lib/clubes-perfis";
import type { Documento } from "@/lib/conteudo/tipos";
import {
  Abas, Area, Aviso, Botao, BotaoLigacao, CabecalhoPagina, Campo, CampoCor, CampoEndereco, Carregando, Confirmar,
  Estatistica, Etiqueta, Input, Interruptor, ListaTexto, Painel, Procura, Seleccao, Vazio, useAviso, usePaginacao,
} from "@/components/admin/kit";
import { CampoImagem } from "@/components/admin/Media";
import { EditorDoc, EtiquetaOrigem, useAvisoSaida } from "@/components/admin/editor/EditorDoc";
import { REDES_CLUBE, TIPOS_CLUBE, iniciaisClube, localClube, nomeTipo } from "@/app/clubes/comum";
import {
  BarraEditor, apagarItemConteudo, gravarItemConteudo, iguais, lerGrupoConteudo, useAbaNoEndereco,
} from "@/app/admin/noticias/_partilhado";
import { EditorPerfil, paraEdicao, paraGravar, perfilVazio, type Perfil } from "./EditorPerfil";
import { esquemaPaginaClubes } from "./esquemaPagina";

type ClubeAdmin = Clube & { publicado?: boolean };
type Aba = "clubes" | "movimentos" | "pagina";
type MapaPerfis = Map<string, Documento<unknown>>;

const publicado = (c: ClubeAdmin) => c.publicado !== false;
const eMovimento = (c: Pick<Clube, "tipo">) => c.tipo === "Movimento";
const temPerfilDeOrigem = (slug: string) => Object.prototype.hasOwnProperty.call(PERFIS_CLUBES, slug);

const AJUDA_REDES: Record<string, string> = {
  instagram: "Endereço completo ou só @utilizador.",
  facebook: "Endereço da página ou do grupo.",
  whatsapp: "Ligação wa.me ou o número com indicativo (+244…). Só se o clube o publicar.",
  site: "Endereço do site do clube.",
  tiktok: "Endereço completo ou só @utilizador.",
};

const clubeNovo = (movimento: boolean): ClubeAdmin => ({
  slug: "", nome: "", tipo: movimento ? "Movimento" : "Moto-turismo", provincia: "Luanda", cidade: "",
  descricao: "", actividades: [], encontros: "", logo: "", imagem: "", cor: "#e10600", redes: {},
  contacto: "", fonte: "", destaque: false, publicado: true,
});

async function lerPerfis(): Promise<MapaPerfis> {
  const r = await lerGrupoConteudo<unknown>("clubes-perfis");
  return new Map(r.itens.map((d) => [d.chave, d]));
}

/**
 * Enquanto a tabela `clubes` não existe na base de dados, a API responde
 * {emFalta: true}: o aviso diz à equipa o que falta fazer.
 */
function useTabelaEmFalta() {
  const [emFalta, setEmFalta] = useState(false);
  useEffect(() => {
    let vivo = true;
    fetch(comBase("/api/admin/clubes"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo && j?.emFalta) setEmFalta(true); })
      .catch(() => { /* sem rede: o painel já mostra o erro de sincronização */ });
    return () => { vivo = false; };
  }, []);
  return emFalta;
}

/* ---------------- Página ---------------- */

export function GestaoClubes({ abaInicial }: { abaInicial: Aba }) {
  const { estado } = useAdmin();
  const { mostrar, elemento } = useAviso();
  const emFalta = useTabelaEmFalta();
  const [aba, setAba] = useAbaNoEndereco<Aba>(abaInicial, "clubes");
  const [aberto, setAberto] = useState<{ original: string | null; inicial: ClubeAdmin } | null>(null);
  const [perfis, setPerfis] = useState<MapaPerfis | null>(null);
  const [erroPerfis, setErroPerfis] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    lerPerfis().then(
      (m) => { if (vivo) setPerfis(m); },
      (e) => { if (vivo) { setErroPerfis(e instanceof Error ? e.message : "Falha ao ler."); setPerfis(new Map()); } },
    );
    return () => { vivo = false; };
  }, []);

  const todos = estado.clubes as ClubeAdmin[];
  const clubes = todos.filter((c) => !eMovimento(c));
  const movimentos = todos.filter(eMovimento);

  if (aberto) {
    return (
      <>
        <EditorClube
          key={aberto.original ?? "novo"}
          original={aberto.original}
          inicial={aberto.inicial}
          perfis={perfis}
          aoMudarPerfis={setPerfis}
          mostrar={mostrar}
          aoFechar={() => setAberto(null)}
          aoMudarOriginal={(slug, c) => setAberto({ original: slug, inicial: c })}
        />
        {elemento}
      </>
    );
  }

  return (
    <>
      <CabecalhoPagina
        icone={<Users />}
        sobretitulo="Conteúdo"
        titulo="Clubes e movimentos"
        descricao="Os clubes de lazer e moto-turismo e os movimentos (como as Lady Riders): a ficha e o perfil alargado de cada um, e os textos da secção Clubes."
        accoes={
          <>
            <BotaoLigacao href="/clubes" externo variante="fantasma">
              <ExternalLink className="size-4" aria-hidden /> Ver no site
            </BotaoLigacao>
            {aba !== "pagina" && (
              <Botao variante="primario" onClick={() => setAberto({ original: null, inicial: clubeNovo(aba === "movimentos") })}>
                <Plus className="size-4" aria-hidden /> {aba === "movimentos" ? "Novo movimento" : "Novo clube"}
              </Botao>
            )}
          </>
        }
      />

      {emFalta && (
        <div className="mb-5">
          <Aviso tom="atencao" titulo="Falta criar a tabela dos clubes">
            A secção Clubes precisa de uma actualização da base de dados. No Supabase, abra SQL Editor → New query, cole o
            conteúdo do ficheiro supabase/migracao-2026-09-28.sql e carregue em Run. Até lá o site mostra os clubes de
            partida e não é possível guardar fichas aqui.
          </Aviso>
        </div>
      )}

      <div className="mb-5">
        <Abas
          rotulo="Secções de Clubes"
          abas={[
            { chave: "clubes", nome: "Clubes", contador: clubes.length },
            { chave: "movimentos", nome: "Movimentos", contador: movimentos.length },
            { chave: "pagina", nome: "Página Clubes" },
          ]}
          activa={aba}
          onChange={setAba}
        />
      </div>

      {erroPerfis && aba !== "pagina" && (
        <div className="mb-[var(--intervalo)]">
          <Aviso tom="atencao" titulo="Não foi possível ler os perfis alargados">{erroPerfis}</Aviso>
        </div>
      )}

      {aba === "pagina" ? (
        <PaginaClubes movimentos={movimentos} />
      ) : (
        <ListaClubes
          key={aba}
          clubes={aba === "movimentos" ? movimentos : clubes}
          movimento={aba === "movimentos"}
          perfis={perfis}
          aoAbrir={(c) => setAberto({ original: c.slug, inicial: c })}
        />
      )}
      {elemento}
    </>
  );
}

/* ---------------- Lista ---------------- */

function ListaClubes({
  clubes, movimento, perfis, aoAbrir,
}: { clubes: ClubeAdmin[]; movimento: boolean; perfis: MapaPerfis | null; aoAbrir: (c: ClubeAdmin) => void }) {
  const [procura, setProcura] = useState("");
  const [tipo, setTipo] = useState("");
  const [provincia, setProvincia] = useState("");

  const filtrados = useMemo(() => {
    const q = procura.trim().toLowerCase();
    return clubes
      .filter((c) => {
        if (tipo && c.tipo !== tipo) return false;
        if (provincia && c.provincia !== provincia) return false;
        if (!q) return true;
        return `${c.nome} ${c.cidade} ${c.provincia} ${nomeTipo(c.tipo)} ${c.actividades.join(" ")} ${c.slug}`.toLowerCase().includes(q);
      })
      // Como no site: os destaques primeiro, depois por nome.
      .sort((a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)) || a.nome.localeCompare(b.nome));
  }, [clubes, procura, tipo, provincia]);

  const { fatia, controlos } = usePaginacao(filtrados, 15);
  const provinciasComClubes = [...new Set(clubes.map((c) => c.provincia).filter(Boolean))];
  const comPerfil = clubes.filter((c) => perfis?.has(c.slug)).length;
  const termo = movimento ? "movimentos" : "clubes";

  return (
    <div className="space-y-[var(--intervalo)]">
      <div className="grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
        <Estatistica rotulo={movimento ? "Movimentos no site" : "Clubes no site"} valor={clubes.filter(publicado).length} />
        <Estatistica rotulo="Em destaque" valor={clubes.filter((c) => c.destaque).length} tom="red" variacao="Aparecem primeiro na lista" />
        <Estatistica rotulo="Com perfil alargado" valor={perfis ? comPerfil : "…"} variacao={`de ${clubes.length} ${termo}`} />
        <Estatistica rotulo="Províncias" valor={provinciasComClubes.length} variacao="com sede publicada" />
      </div>

      <Painel>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Procura valor={procura} onChange={setProcura} placeholder={`Procurar ${termo} por nome, cidade ou actividade…`} />
          {!movimento && (
            <Seleccao
              aria-label="Tipo"
              className="sm:!w-auto sm:min-w-[12rem]"
              valor={tipo}
              onChange={setTipo}
              opcoes={[{ valor: "", nome: "Todos os tipos" }, ...TIPOS_CLUBE.filter((t) => t.tipo !== "Movimento").map((t) => ({ valor: t.tipo, nome: t.nome }))]}
            />
          )}
          <Seleccao
            aria-label="Província"
            className="sm:!w-auto sm:min-w-[11rem]"
            valor={provincia}
            onChange={setProvincia}
            opcoes={[{ valor: "", nome: "Todo o país" }, ...PROVINCIAS.map((p) => ({ valor: p, nome: p }))]}
          />
        </div>

        {fatia.length === 0 ? (
          <Vazio titulo={clubes.length ? "Nada corresponde aos filtros" : movimento ? "Ainda não há movimentos" : "Ainda não há clubes"}>
            {clubes.length
              ? "Mude a procura, o tipo ou a província."
              : movimento
                ? "Um movimento junta motards de vários clubes à volta de uma causa. Carregue em «Novo movimento»."
                : "Carregue em «Novo clube» para juntar o primeiro."}
          </Vazio>
        ) : (
          <ul className="grid gap-[var(--intervalo)] md:grid-cols-2 2xl:grid-cols-3">
            {fatia.map((c) => (
              <li key={c.slug}>
                <button
                  type="button" onClick={() => aoAbrir(c)}
                  className="flex h-full w-full items-start gap-3 rounded-[var(--raio)] bg-black/[0.18] p-3 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <span
                    aria-hidden
                    className="grid size-12 shrink-0 place-items-center rounded-[var(--raio)] text-sm font-semibold text-white"
                    style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(c.cor) ? c.cor : "#e10600" }}
                  >
                    {iniciaisClube(c.nome)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-white">{c.nome || "Sem nome"}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-white/75">
                      <span className="text-mb-red-light">{nomeTipo(c.tipo)}</span> · {localClube(c)}
                      {c.fundacao ? ` · desde ${c.fundacao}` : ""}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {!publicado(c) && <Etiqueta>Rascunho</Etiqueta>}
                      {c.destaque && <Etiqueta tom="vermelho"><Star className="size-3" aria-hidden /> Destaque</Etiqueta>}
                      {perfis && (perfis.has(c.slug)
                        ? <Etiqueta tom="ok">Perfil alargado</Etiqueta>
                        : <Etiqueta tom="ouro">Só a ficha</Etiqueta>)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {controlos}
      </Painel>
    </div>
  );
}

/* ---------------- Editor de um clube ---------------- */

type AbaEditor = "ficha" | "perfil";

function EditorClube({
  original, inicial, perfis, aoMudarPerfis, mostrar, aoFechar, aoMudarOriginal,
}: {
  original: string | null;
  inicial: ClubeAdmin;
  perfis: MapaPerfis | null;
  aoMudarPerfis: (m: MapaPerfis) => void;
  mostrar: (texto: string, tom?: "ok" | "erro") => void;
  aoFechar: () => void;
  aoMudarOriginal: (slug: string, c: ClubeAdmin) => void;
}) {
  const { estado, criar, atualizar, remover } = useAdmin();
  const novo = original === null;
  const [abaEditor, setAbaEditor] = useState<AbaEditor>("ficha");
  const [base, setBase] = useState<ClubeAdmin>(() => normalizar(inicial));
  const [r, setR] = useState<ClubeAdmin>(() => normalizar(inicial));

  const docPerfil = original ? perfis?.get(original) : undefined;
  const perfilGravado = docPerfil ? paraEdicao(docPerfil.dados) : null;
  const [perfilBase, setPerfilBase] = useState<Perfil | null>(perfilGravado);
  const [perfil, setPerfil] = useState<Perfil | null>(perfilGravado);
  // Os perfis chegam (ou mudam) depois de abrir: o editor acompanha-os enquanto ninguém mexer no perfil.
  const [perfisVistos, setPerfisVistos] = useState(perfis);
  if (perfis !== perfisVistos) {
    setPerfisVistos(perfis);
    if (iguais(perfil, perfilBase)) { setPerfil(perfilGravado); setPerfilBase(perfilGravado); }
  }

  const [aGravar, setAGravar] = useState(false);
  const [aApagar, setAApagar] = useState(false);
  const [aRepor, setARepor] = useState(false);

  const fichaSuja = !iguais(r, base);
  const perfilSujo = !iguais(perfil, perfilBase);
  const sujo = novo || fichaSuja || perfilSujo;
  const comTrabalho = sujo && (!novo || Boolean(r.nome.trim() || r.descricao.trim() || perfil));
  useAvisoSaida(comTrabalho);

  const movimento = eMovimento(r);
  const termo = movimento ? "movimento" : "clube";
  const definir = (campos: Partial<ClubeAdmin>) => setR((c) => ({ ...c, ...campos }));
  const mudarNome = (nome: string) =>
    definir({ nome, slug: novo && (r.slug === "" || r.slug === slugify(r.nome)) ? slugify(nome) : r.slug });

  const voltar = () => {
    if (comTrabalho && !window.confirm(`Há alterações por gravar neste ${termo}. Sair sem gravar?`)) return;
    aoFechar();
  };

  const recarregarPerfis = async () => {
    const m = await lerPerfis();
    aoMudarPerfis(m);
    return m;
  };

  const gravar = async () => {
    const redes = Object.fromEntries(
      Object.entries(r.redes ?? {}).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]).filter(([, v]) => v),
    ) as Clube["redes"];
    const final: ClubeAdmin = {
      ...r,
      nome: r.nome.trim(),
      slug: (r.slug || slugify(r.nome)).replace(/-+$/, ""),
      cidade: r.cidade.trim(),
      descricao: r.descricao.trim(),
      actividades: r.actividades.map((a) => a.trim()).filter(Boolean),
      encontros: (r.encontros ?? "").trim(),
      contacto: (r.contacto ?? "").trim(),
      redes,
    };
    if (!final.nome) return mostrar(`Escreva o nome do ${termo}.`, "erro");
    if (!final.slug) return mostrar("Falta o endereço da página.", "erro");
    if (!final.descricao) return mostrar(`Escreva a descrição do ${termo} (a ficha curta).`, "erro");
    if (final.slug !== original && estado.clubes.some((c) => c.slug === final.slug)) {
      return mostrar(`Já existe um clube com o endereço /clubes/${final.slug}. Mude o endereço.`, "erro");
    }

    setAGravar(true);
    const mudouEndereco = original !== null && original !== final.slug;
    if (novo || !iguais(final, base)) {
      const registo = final as unknown as Record<string, unknown>;
      const falha = original === null ? await criar("clubes", registo) : await atualizar("clubes", original, registo);
      if (falha) { setAGravar(false); return mostrar(falha, "erro"); }
    }

    // O perfil alargado (conteúdo editável) segue o clube: grava, muda de endereço ou sai.
    const tinhaPerfil = original !== null && Boolean(perfis?.has(original));
    let falhaPerfil: string | null = null;
    let perfilFinal = perfil;
    try {
      if (perfil) {
        if (perfilSujo || mudouEndereco || !tinhaPerfil) {
          perfilFinal = paraGravar(perfil);
          await gravarItemConteudo("clubes-perfis", final.slug, perfilFinal, final.nome, mudouEndereco && tinhaPerfil ? original : undefined);
        }
      } else if (tinhaPerfil && original) {
        await apagarItemConteudo("clubes-perfis", original);
      }
      if (perfilSujo || mudouEndereco || (perfil && !tinhaPerfil) || (!perfil && tinhaPerfil)) await recarregarPerfis();
    } catch (e) {
      falhaPerfil = e instanceof Error ? e.message : "Falha ao gravar.";
    }
    setAGravar(false);

    if (falhaPerfil) mostrar(`A ficha foi gravada, mas o perfil alargado não: ${falhaPerfil}`, "erro");
    else mostrar(novo ? `${movimento ? "Movimento" : "Clube"} criado.` : "Gravado. O site já mostra as alterações.");
    if (novo || mudouEndereco) aoMudarOriginal(final.slug, final);
    else {
      setBase(final); setR(final);
      if (!falhaPerfil) { setPerfil(perfilFinal); setPerfilBase(perfilFinal); }
    }
  };

  const apagar = async () => {
    if (!original) return;
    const falha = await remover("clubes", original);
    if (falha) return mostrar(falha, "erro");
    if (perfis?.has(original)) {
      try { await apagarItemConteudo("clubes-perfis", original); await recarregarPerfis(); } catch { /* o perfil fica sem clube que o mostre */ }
    }
    mostrar(`${movimento ? "Movimento" : "Clube"} apagado.`);
    aoFechar();
  };

  const reporPerfil = async () => {
    if (!original) return;
    try {
      await apagarItemConteudo("clubes-perfis", original, true);
      const m = await recarregarPerfis();
      const doc = m.get(original);
      const p = doc ? paraEdicao(doc.dados) : null;
      setPerfil(p); setPerfilBase(p);
      mostrar("O perfil voltou ao texto de origem.");
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "Falha ao repor.", "erro");
    }
  };

  const redes = (campos: Partial<Clube["redes"]>) => definir({ redes: { ...r.redes, ...campos } });
  const podeRepor = Boolean(original && docPerfil?.origem === "base" && temPerfilDeOrigem(original));

  return (
    <div className="space-y-[var(--intervalo)]">
      <BarraEditor
        aoVoltar={voltar}
        voltar={movimento ? "Movimentos" : "Clubes"}
        titulo={r.nome || (novo ? (movimento ? "Novo movimento" : "Novo clube") : "Sem nome")}
        etiquetas={
          <>
            {novo ? <Etiqueta tom="ouro">Por gravar</Etiqueta> : publicado(base) ? <Etiqueta tom="ok">No site</Etiqueta> : <Etiqueta>Rascunho</Etiqueta>}
            {!novo && sujo && <Etiqueta tom="ouro">Alterações por gravar</Etiqueta>}
          </>
        }
        accoes={
          <>
            {!novo && publicado(base) && <BotaoLigacao href={`/clubes/${original}`} externo variante="fantasma">Ver no site</BotaoLigacao>}
            {!novo && <Botao variante="fantasma" onClick={() => setAApagar(true)}>Apagar</Botao>}
            {!novo && (
              <Botao variante="fantasma" disabled={!sujo} onClick={() => { setR(base); setPerfil(perfilBase); }}>Desfazer</Botao>
            )}
            <Botao variante="primario" disabled={!sujo || aGravar} onClick={gravar}>
              {aGravar ? "A gravar…" : novo ? `Criar ${termo}` : "Gravar"}
            </Botao>
          </>
        }
      />

      <div>
        <Abas
          rotulo={`Partes do ${termo}`}
          activa={abaEditor}
          onChange={setAbaEditor}
          abas={[
            { chave: "ficha", nome: "Ficha" },
            { chave: "perfil", nome: "Perfil alargado" },
          ]}
        />
      </div>

      {abaEditor === "ficha" ? (
        <div className="grid items-start gap-[var(--intervalo)] xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="space-y-[var(--intervalo)]">
            <Painel titulo="Identificação">
              <div className="space-y-4">
                <Campo etiqueta="Nome" obrigatorio>
                  <Input value={r.nome} onChange={(e) => mudarNome(e.target.value)} className="text-lg font-semibold" />
                </Campo>
                <CampoEndereco prefixo="/clubes" novo={novo} valor={r.slug} onChange={(slug) => definir({ slug })} />
                <Campo
                  etiqueta="Tipo"
                  ajuda="«Movimento» não é um clube: junta motards de vários clubes à volta de uma causa, e aparece na secção Movimentos. «Lady Riders» aparece no menu do site."
                >
                  <Seleccao
                    valor={r.tipo}
                    opcoes={TIPOS_CLUBE.map((t) => ({ valor: t.tipo, nome: t.tipo === "Outro" ? "Convívio e solidariedade" : t.nome }))}
                    onChange={(v) => definir({ tipo: v as TipoClube })}
                  />
                </Campo>
              </div>
            </Painel>

            <Painel titulo="Apresentação">
              <div className="space-y-4">
                <Campo
                  etiqueta="Descrição" obrigatorio
                  ajuda={`O ${termo} em poucas frases. Aparece em «Em poucas palavras» na página e, sem perfil alargado, como a história.`}
                >
                  <Area rows={5} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value })} />
                </Campo>
                <ListaTexto
                  etiqueta="Actividades"
                  ajuda="Em «O que fazem» e nas pílulas do cartão (as três primeiras)."
                  valores={r.actividades}
                  placeholder="Ex.: Passeios de fim-de-semana"
                  onChange={(actividades) => definir({ actividades })}
                />
                <Campo
                  etiqueta="Onde e quando se encontram"
                  ajuda="Ex.: Domingos às 7h, Marginal de Luanda. Vazio e sem pormenores no perfil, a página diz que não há ponto fixo."
                >
                  <Area rows={2} value={r.encontros ?? ""} onChange={(e) => definir({ encontros: e.target.value })} />
                </Campo>
              </div>
            </Painel>

            <Painel titulo="Contactos e redes" descricao="As redes aparecem em botões no topo da página.">
              <div className="grid gap-4 sm:grid-cols-2">
                {REDES_CLUBE.map((rede) => (
                  <Campo key={rede.chave} etiqueta={rede.nome} ajuda={AJUDA_REDES[rede.chave]}>
                    <Input value={r.redes?.[rede.chave] ?? ""} onChange={(e) => redes({ [rede.chave]: e.target.value })} />
                  </Campo>
                ))}
                <Campo etiqueta="Contacto" ajuda={`Email que o ${termo} publica. Com ele aparece o botão «Contactar o ${termo}».`}>
                  <Input value={r.contacto ?? ""} onChange={(e) => definir({ contacto: e.target.value })} />
                </Campo>
              </div>
            </Painel>
          </div>

          <div className="space-y-[var(--intervalo)]">
            <Painel titulo="Sede e fundação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Província" ajuda="Vazia se a sede não é pública.">
                  <Seleccao
                    valor={r.provincia}
                    onChange={(v) => definir({ provincia: v as Clube["provincia"] })}
                    opcoes={[{ valor: "", nome: "Sem sede publicada" }, ...PROVINCIAS.map((p) => ({ valor: p, nome: p }))]}
                  />
                </Campo>
                <Campo etiqueta="Cidade" ajuda="Vazia se não é pública.">
                  <Input value={r.cidade} onChange={(e) => definir({ cidade: e.target.value })} />
                </Campo>
                <Campo etiqueta="Ano de fundação" ajuda="Só se o clube o indicar. Vazio: «fundação por confirmar».">
                  <Input
                    type="number" inputMode="numeric" min={1950} max={2100}
                    value={r.fundacao ?? ""}
                    // null, e não vazio, para apagar o ano também na base de dados.
                    onChange={(e) => definir({ fundacao: (e.target.value ? Number(e.target.value) : null) as unknown as number })}
                  />
                </Campo>
              </div>
            </Painel>

            <Painel titulo="Imagem e cor">
              <div className="space-y-4">
                <CampoImagem
                  etiqueta="Fotografia de capa"
                  valor={r.imagem ?? ""}
                  onChange={(imagem) => definir({ imagem })}
                  ajuda={`Em fundo no topo da página e no cartão do ${termo}. Vazio: uma fotografia ilustrativa.`}
                />
                <CampoCor
                  etiqueta={`Cor do ${termo}`}
                  valor={r.cor}
                  onChange={(cor) => definir({ cor })}
                  ajuda="O quadrado com as iniciais, no cartão e na página."
                />
                <CampoImagem
                  etiqueta="Logótipo"
                  formato="aspect-[2/1]"
                  valor={r.logo ?? ""}
                  onChange={(logo) => definir({ logo })}
                  ajuda="Fica guardado na ficha. Por agora o site mostra as iniciais sobre a cor, em vez do logótipo."
                />
              </div>
            </Painel>

            <Painel titulo="No site">
              <div className="space-y-3">
                <Interruptor
                  etiqueta="Publicado no site"
                  descricao={`Desligado, o ${termo} fica guardado mas não aparece a ninguém.`}
                  activo={publicado(r)}
                  onChange={(v) => definir({ publicado: v })}
                />
                <Interruptor
                  etiqueta="Em destaque"
                  descricao="Aparece primeiro na lista e entra na rotação do «clube do mês» no painel Explorar."
                  activo={Boolean(r.destaque)}
                  onChange={(v) => definir({ destaque: v })}
                />
              </div>
            </Painel>

            <Painel titulo="De onde veio a informação" descricao="Só para a equipa: não aparece no site.">
              <Campo etiqueta="Fontes da ficha" ajuda="Endereços, um por linha, para se poder confirmar os dados.">
                <Area rows={4} value={r.fonte ?? ""} onChange={(e) => definir({ fonte: e.target.value })} />
              </Campo>
            </Painel>
          </div>
        </div>
      ) : perfis === null ? (
        <Painel><Carregando texto="A carregar o perfil…" /></Painel>
      ) : perfil === null ? (
        <Painel>
          <Vazio
            titulo={`Este ${termo} ainda não tem perfil alargado`}
            accao={<Botao variante="primario" onClick={() => setPerfil(perfilVazio())}>Criar o perfil</Botao>}
          >
            Sem perfil, a página mostra só a ficha: a descrição como história e o que está em «Onde e quando se encontram». O perfil junta
            a linha de apresentação, o lema, a história, o percurso, os números, as viagens, como aderir e as fontes.
          </Vazio>
        </Painel>
      ) : (
        <div className="space-y-[var(--intervalo)]">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--raio)] bg-black/20 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
              {docPerfil ? <EtiquetaOrigem origem={docPerfil.origem} atualizado={docPerfil.atualizado} /> : <Etiqueta tom="ouro">Perfil novo, por gravar</Etiqueta>}
              {perfilSujo && docPerfil && <Etiqueta tom="ouro">Alterações por gravar</Etiqueta>}
            </div>
            <div className="flex flex-wrap gap-2">
              {podeRepor && <Botao tamanho="sm" variante="fantasma" onClick={() => setARepor(true)}>Repor o perfil de origem</Botao>}
              <Botao tamanho="sm" variante="fantasma" onClick={() => setPerfil(null)}>Tirar o perfil</Botao>
            </div>
          </div>
          <EditorPerfil perfil={perfil} onChange={setPerfil} movimento={movimento} />
        </div>
      )}

      <Confirmar
        aberta={aApagar} aoFechar={() => setAApagar(false)} aoConfirmar={apagar} perigo textoConfirmar="Apagar"
        titulo={`Apagar «${base.nome}»?`}
        mensagem={`O ${termo} sai do site e da lista, com o seu perfil alargado. Se só o quer esconder, desligue «Publicado no site».`}
      />
      <Confirmar
        aberta={aRepor} aoFechar={() => setARepor(false)} aoConfirmar={reporPerfil} perigo textoConfirmar="Repor"
        titulo="Repor o perfil de origem?"
        mensagem="O perfil volta ao texto com que o site foi lançado. As alterações gravadas no perfil perdem-se."
      />
    </div>
  );
}

function normalizar(c: ClubeAdmin): ClubeAdmin {
  return {
    ...c,
    cidade: c.cidade ?? "", descricao: c.descricao ?? "", actividades: c.actividades ?? [], encontros: c.encontros ?? "",
    logo: c.logo ?? "", imagem: c.imagem ?? "", redes: c.redes ?? {}, contacto: c.contacto ?? "", fonte: c.fonte ?? "",
    destaque: Boolean(c.destaque), publicado: c.publicado !== false,
  };
}

/* ---------------- Página Clubes ---------------- */

function PaginaClubes({ movimentos }: { movimentos: ClubeAdmin[] }) {
  const [rotas, setRotas] = useState<{ valor: string; nome: string }[] | null>(null);
  useEffect(() => {
    let vivo = true;
    lerGrupoConteudo<{ nome?: string }>("rotas").then(
      (r) => { if (vivo) setRotas(r.itens.map((i) => ({ valor: i.chave, nome: String(i.dados?.nome ?? i.titulo) }))); },
      () => { if (vivo) setRotas([]); },
    );
    return () => { vivo = false; };
  }, []);

  const esquema = useMemo(
    () => esquemaPaginaClubes(movimentos.map((m) => ({ valor: m.slug, nome: m.nome })), rotas ?? []),
    [movimentos, rotas],
  );

  return <EditorDoc chave="paginas.clubes" pagina="/clubes" titulo="Clubes (página da secção)" esquema={esquema} />;
}
