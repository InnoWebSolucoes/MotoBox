"use client";

/* ============================================================
   MOTOBOX ADMIN — Equipas
   A ficha de cada equipa ou clube de Desporto: emblema e cor,
   base, responsável, membros, motas, palmarés, redes, a
   fotografia de capa e o plantel (os pilotos da equipa). Ao
   gravar, as fichas dos pilotos acompanham o plantel.
   ============================================================ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, UserPlus } from "lucide-react";
import { comBase } from "@/lib/base";
import { useAdmin } from "@/lib/admin/store";
import { Aviso, Botao, CampoEndereco, Estatistica, Etiqueta, Seleccao } from "@/components/admin/kit";
import { CampoImagem } from "@/components/admin/Media";
import type { CampoEsquema } from "@/components/admin/editor/esquema";
import type { Equipa, Piloto } from "@/lib/types";
import { OPCOES_PROVINCIAS, PilulaRemovivel, campoPublicado } from "../provas/_desporto/campos";
import { AvisoModoLocal, ListaGestao } from "../provas/_desporto/ListaGestao";
import { MiniRetrato } from "../pilotos/Pilotos";

type FotosEquipas = Record<string, { foto?: string }>;
/** A ficha no painel: a equipa e a fotografia de capa (que vive no conteúdo editável). */
type FichaEquipa = Equipa & { _foto?: string };

async function lerFotos(): Promise<FotosEquipas> {
  const r = await fetch(comBase("/api/admin/conteudo?chave=desporto.equipas"), { cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erro ?? "Falha ao ler as fotografias das equipas.");
  return j.dados && typeof j.dados === "object" ? j.dados : {};
}

async function gravarFotos(fotos: FotosEquipas) {
  const r = await fetch(comBase("/api/admin/conteudo"), {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chave: "desporto.equipas", dados: fotos }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro ?? "A fotografia de capa não foi gravada.");
}

/** Emblema da equipa: a sigla sobre a cor, como no site. */
export function Emblema({ e, tamanho = "size-10 text-xs" }: { e: Pick<Equipa, "logo" | "cor" | "nome">; tamanho?: string }) {
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-[4px] font-semibold tracking-wide text-white ${tamanho}`}
      style={{ background: e.cor || "#3d3d47" }}>
      {e.logo || e.nome.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function Equipas({ editar }: { editar?: string }) {
  const { estado, atualizar } = useAdmin();
  const equipas = estado.equipas;
  const pilotos = estado.pilotos;
  const [fotos, setFotos] = useState<FotosEquipas>({});
  const [erroFotos, setErroFotos] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    lerFotos().then((f) => { if (vivo) setFotos(f); }, (e) => { if (vivo) setErroFotos(e instanceof Error ? e.message : String(e)); });
    return () => { vivo = false; };
  }, []);

  const doPlantel = (slug: string) => pilotos.filter((p) => p.equipaSlug === slug);

  const esquema = (r: FichaEquipa, ctx: { novo: boolean; original: FichaEquipa | null; mudar: (c: Partial<FichaEquipa>) => void }): CampoEsquema[] => [
    {
      tipo: "secao", titulo: "A equipa", campos: [
        { tipo: "texto", chave: "nome", etiqueta: "Nome", obrigatorio: true, largura: "meia" },
        {
          tipo: "seleccao", chave: "tipo", etiqueta: "Tipo", largura: "meia",
          opcoes: [{ valor: "Equipa", nome: "Equipa de competição" }, { valor: "Clube", nome: "Clube motard" }],
          ajuda: "As equipas entram na classificação de equipas e na página Desporto.",
        },
        {
          tipo: "personalizado", chave: "slug", etiqueta: "Endereço",
          render: (v, mudar) => <CampoEndereco prefixo="/equipas" novo={ctx.novo} valor={String(v ?? "")} onChange={mudar} />,
        },
        { tipo: "texto", chave: "logo", etiqueta: "Sigla do emblema", largura: "meia", placeholder: "KR",
          ajuda: "Duas a quatro letras, escritas sobre a cor da equipa." },
        { tipo: "cor", chave: "cor", etiqueta: "Cor da equipa", largura: "meia", ajuda: "Nos cartões, nas tabelas e nos retratos dos pilotos." },
        {
          tipo: "personalizado", chave: "_emblema", etiqueta: "Emblema",
          render: () => (
            <div className="flex items-center gap-3 rounded-[var(--raio)] bg-black/20 px-4 py-3">
              <Emblema e={r} tamanho="size-14 text-base" />
              <p className="text-[13px] text-white/60">Assim aparece o emblema no site.</p>
            </div>
          ),
        },
        campoPublicado("a equipa"),
      ],
    },
    {
      tipo: "secao", titulo: "Onde e quem", campos: [
        { tipo: "texto", chave: "base", etiqueta: "Base", largura: "meia", placeholder: "Kilamba Kiaxi, Luanda" },
        { tipo: "seleccao", chave: "provincia", etiqueta: "Província", largura: "meia", opcoes: OPCOES_PROVINCIAS },
        { tipo: "numero", chave: "fundacao", etiqueta: "Ano de fundação", min: 1900, passo: 1, largura: "meia" },
        { tipo: "texto", chave: "chefe", etiqueta: "Responsável", largura: "meia", placeholder: "Chefe de equipa" },
        { tipo: "numero", chave: "membros", etiqueta: "Membros", min: 0, passo: 1, largura: "meia",
          ajuda: "Toda a estrutura (mecânicos, staff, sócios), não só os pilotos." },
      ],
    },
    {
      tipo: "secao", titulo: "Apresentação", campos: [
        {
          tipo: "personalizado", chave: "_foto", etiqueta: "Fotografia de capa",
          render: (v, mudar) => (
            <CampoImagem
              etiqueta="Fotografia de capa" valor={String(v ?? "")} onChange={mudar}
              ajuda="Fundo do cartão em Equipas e do topo da página da equipa. Vazio, usa a fotografia da província."
            />
          ),
        },
        { tipo: "area", chave: "descricao", etiqueta: "Descrição", linhas: 6, ajuda: "A primeira frase aparece no topo da página da equipa." },
        { tipo: "lista-texto", chave: "motas", etiqueta: "Motas e material", placeholder: "KTM 450 SX-F" },
      ],
    },
    {
      tipo: "secao", titulo: "Plantel", descricao: "Os pilotos desta equipa. Ao gravar, a ficha de cada piloto passa a dizer esta equipa.", campos: [
        {
          tipo: "personalizado", chave: "pilotos", etiqueta: "Pilotos",
          render: (v, mudar) => (
            <Plantel
              valor={Array.isArray(v) ? (v as string[]) : []} mudar={mudar} pilotos={pilotos} equipa={r}
              ligados={ctx.original ? doPlantel(ctx.original.slug).map((p) => p.slug) : []}
            />
          ),
        },
      ],
    },
    {
      tipo: "objecto", chave: "estatisticas", etiqueta: "Palmarés", ajuda: "Os pontos ordenam a classificação de equipas.", campos: [
        { tipo: "numero", chave: "pontos", etiqueta: "Pontos", min: 0, largura: "meia" },
        { tipo: "numero", chave: "vitorias", etiqueta: "Vitórias", min: 0, passo: 1, largura: "meia" },
        { tipo: "numero", chave: "podios", etiqueta: "Pódios", min: 0, passo: 1, largura: "meia" },
        { tipo: "numero", chave: "titulos", etiqueta: "Títulos", min: 0, passo: 1, largura: "meia", ajuda: "Com 1 ou mais, o cartão mostra \"Campeã\"." },
      ],
    },
    {
      tipo: "objecto", chave: "redes", etiqueta: "Redes sociais", ajuda: "Endereços completos. Vazio, o botão não aparece.", campos: [
        { tipo: "url", chave: "instagram", etiqueta: "Instagram", largura: "meia" },
        { tipo: "url", chave: "facebook", etiqueta: "Facebook", largura: "meia" },
      ],
    },
  ];

  return (
    <ListaGestao<FichaEquipa>
      coleccao="equipas"
      itens={equipas}
      titulo="Equipas"
      descricao="As equipas de competição e os clubes de Desporto: emblema, cor, base, plantel, motas, palmarés e a fotografia de capa."
      icone={<Shield />}
      nomeItem="equipa"
      feminino
      campoNome="nome"
      prefixoPagina="/equipas"
      editarInicial={editar}
      prepararFicha={(e) => ({ ...e, _foto: fotos[e.slug]?.foto ?? "" })}
      soNoPainel={["_foto", "_emblema"]}
      aviso={
        <div className="space-y-[var(--intervalo)]">
          <AvisoModoLocal />
          {erroFotos && <Aviso tom="erro" titulo="As fotografias de capa não abriram">{erroFotos}</Aviso>}
        </div>
      }
      numeros={
        <div className="grid grid-cols-2 gap-[var(--intervalo)] lg:grid-cols-4">
          <Estatistica rotulo="Equipas de competição" valor={equipas.filter((e) => e.tipo === "Equipa").length} icone={<Shield />} />
          <Estatistica rotulo="Clubes" valor={equipas.filter((e) => e.tipo === "Clube").length} />
          <Estatistica rotulo="Membros" valor={equipas.reduce((s, e) => s + (Number(e.membros) || 0), 0)} />
          <Estatistica rotulo="Pilotos com equipa" valor={pilotos.filter((p) => p.equipaSlug).length} />
        </div>
      }
      procuraEm={(e) => `${e.nome} ${e.base} ${e.provincia} ${e.chefe} ${e.logo}`}
      ordenar={(a, b) => (a.tipo === b.tipo ? 0 : a.tipo === "Equipa" ? -1 : 1) || (b.estatisticas?.pontos ?? 0) - (a.estatisticas?.pontos ?? 0)}
      filtros={[
        { chave: "tipo", etiqueta: "Equipas e clubes", opcoes: [{ valor: "Equipa", nome: "Equipas" }, { valor: "Clube", nome: "Clubes" }] },
        { chave: "provincia", etiqueta: "Todas as províncias", opcoes: OPCOES_PROVINCIAS.filter((o) => equipas.some((e) => e.provincia === o.valor)) },
      ]}
      colunas={[
        {
          cabecalho: "Equipa",
          celula: (e) => (
            <div className="flex min-w-0 items-center gap-3">
              <Emblema e={e} />
              <span className="min-w-0">
                <span className="block max-w-[16rem] truncate font-medium text-white">{e.nome}</span>
                <span className="block max-w-[16rem] truncate text-xs text-white/50">{e.base}</span>
              </span>
            </div>
          ),
        },
        { cabecalho: "Tipo", celula: (e) => <Etiqueta tom={e.tipo === "Equipa" ? "vermelho" : "neutro"}>{e.tipo}</Etiqueta> },
        { cabecalho: "Pilotos", celula: (e) => <span className="tabular-nums text-white/70">{doPlantel(e.slug).length}</span> },
        { cabecalho: "Membros", celula: (e) => <span className="tabular-nums text-white/70">{e.membros}</span> },
        { cabecalho: "Pontos", celula: (e) => <span className="font-semibold tabular-nums">{e.estatisticas?.pontos ?? 0}</span> },
        { cabecalho: "Títulos", celula: (e) => <span className="tabular-nums text-white/70">{e.estatisticas?.titulos ?? 0}</span> },
      ]}
      novo={() => ({
        slug: "", nome: "", tipo: "Equipa", base: "", provincia: "Luanda", fundacao: new Date().getFullYear(),
        logo: "", cor: "#e10600", chefe: "", membros: 0, pilotos: [], descricao: "", motas: [],
        estatisticas: { pontos: 0, vitorias: 0, podios: 0, titulos: 0 }, redes: {}, _foto: "",
      }) as FichaEquipa}
      preparar={(r) => ({
        ...r,
        fundacao: Number(r.fundacao) || new Date().getFullYear(),
        membros: Number(r.membros) || 0,
        pilotos: Array.isArray(r.pilotos) ? r.pilotos : [],
        motas: Array.isArray(r.motas) ? r.motas : [],
        estatisticas: {
          pontos: Number(r.estatisticas?.pontos) || 0,
          vitorias: Number(r.estatisticas?.vitorias) || 0,
          podios: Number(r.estatisticas?.podios) || 0,
          titulos: Number(r.estatisticas?.titulos) || 0,
        },
        redes: r.redes ?? {},
      })}
      validar={(r) => (!r.nome?.trim() ? "Escreva o nome da equipa." : null)}
      depoisDeGravar={async (r, original) => {
        const antigo = original?.slug ?? r.slug;
        const plantel = new Set(r.pilotos);
        // 1. As fichas dos pilotos acompanham o plantel.
        for (const p of pilotos) {
          const dentro = plantel.has(p.slug);
          if (dentro && (p.equipaSlug !== r.slug || p.equipa !== r.nome)) {
            await atualizar("pilotos", p.slug, { equipaSlug: r.slug, equipa: r.nome });
          } else if (!dentro && (p.equipaSlug === antigo || p.equipaSlug === r.slug)) {
            await atualizar("pilotos", p.slug, { equipaSlug: "", equipa: "" });
          }
        }
        // 2. Um piloto só está num plantel: sai do das outras equipas.
        for (const e of equipas) {
          if (e.slug === antigo || e.slug === r.slug) continue;
          const lista = Array.isArray(e.pilotos) ? e.pilotos : [];
          const nova = lista.filter((s) => !plantel.has(s));
          if (nova.length !== lista.length) await atualizar("equipas", e.slug, { pilotos: nova });
        }
        // 3. A fotografia de capa (fora da tabela).
        const foto = (r._foto ?? "").trim();
        const antes = original?._foto ?? "";
        if (foto !== antes || antigo !== r.slug) {
          const novas = { ...fotos };
          delete novas[antigo];
          if (foto) novas[r.slug] = { foto };
          else delete novas[r.slug];
          await gravarFotos(novas);
          setFotos(novas);
        }
      }}
      esquema={esquema}
      vazio={{ titulo: "Ainda não há equipas", texto: "Crie a primeira equipa: aparece em Equipas, na classificação e nas fichas dos pilotos." }}
    />
  );
}

/** O plantel: os pilotos da equipa, com juntar e tirar. */
function Plantel({
  valor, mudar, pilotos, equipa, ligados,
}: {
  valor: string[]; mudar: (v: string[]) => void; pilotos: Piloto[]; equipa: FichaEquipa;
  /** Pilotos cuja ficha já diz esta equipa (o que o site mostra hoje). */
  ligados: string[];
}) {
  const [escolha, setEscolha] = useState("");
  const porSlug = new Map(pilotos.map((p) => [p.slug, p]));
  const foraDaLista = ligados.filter((s) => !valor.includes(s));
  const disponiveis = pilotos.filter((p) => !valor.includes(p.slug)).sort((a, b) => a.nome.localeCompare(b.nome));
  return (
    <div className="space-y-3">
      <p className="text-[13px] font-medium text-white/75">Pilotos <span className="ml-1 text-white/40">{valor.length}</span></p>
      {foraDaLista.length > 0 && (
        <Aviso tom="atencao" accoes={<Botao tamanho="sm" onClick={() => mudar([...valor, ...foraDaLista])}>Juntar ao plantel</Botao>}>
          {foraDaLista.map((s) => porSlug.get(s)?.nome ?? s).join(", ")} {foraDaLista.length === 1 ? "tem" : "têm"} esta equipa na ficha mas não {foraDaLista.length === 1 ? "está" : "estão"} no plantel.
        </Aviso>
      )}
      {valor.length === 0 ? (
        <p className="text-sm text-white/55">Sem pilotos no plantel.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {valor.map((s) => {
            const p = porSlug.get(s);
            return (
              <li key={s}>
                <PilulaRemovivel rotulo={`Tirar ${p?.nome ?? s} do plantel`} aoTirar={() => mudar(valor.filter((x) => x !== s))}>
                  <span className="inline-flex items-center gap-2">
                    {p && <MiniRetrato p={p} cor={equipa.cor} tamanho="size-6" />}
                    {p ? (
                      <Link href={`/admin/pilotos?editar=${encodeURIComponent(p.slug)}`} className="hover:underline">
                        <span className="tabular-nums text-white/45">#{p.numero}</span> {p.nome}
                      </Link>
                    ) : `${s} (ficha apagada)`}
                    {p && p.equipaSlug && p.equipaSlug !== equipa.slug && (
                      <span className="text-[11px] text-gold">sai de {p.equipa}</span>
                    )}
                  </span>
                </PilulaRemovivel>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex max-w-xl gap-2">
        <Seleccao
          valor={escolha} onChange={setEscolha} aria-label="Piloto a juntar"
          opcoes={[{ valor: "", nome: "Escolher piloto…" }, ...disponiveis.map((p) => ({
            valor: p.slug, nome: `#${p.numero} ${p.nome}${p.equipa ? ` · ${p.equipa}` : " · sem equipa"}`,
          }))]}
        />
        <Botao disabled={!escolha} onClick={() => { if (escolha) { mudar([...valor, escolha]); setEscolha(""); } }}>
          <UserPlus className="size-4" aria-hidden /> Juntar
        </Botao>
      </div>
    </div>
  );
}
