"use client";

/* ============================================================
   MOTOBOX ADMIN — Perfil alargado de um clube
   O que a página /clubes/[slug] mostra para lá da ficha da base
   de dados: a linha de apresentação, o lema, a história, o
   percurso, os números, as viagens, os encontros, como aderir,
   o estilo, as motas e as fontes.

   Cada momento, número, viagem e "como aderir" pode apontar
   para uma das fontes do clube. No site guarda-se o número da
   fonte na lista; aqui escolhe-se a fonte pelo nome, e mudar a
   ordem ou apagar uma fonte acerta as ligações sozinho.
   ============================================================ */

import { ExternalLink, Plus, Trash2 } from "lucide-react";
import type { FonteClube, PerfilClube } from "@/lib/clubes-perfis";
import {
  AccaoIcone, Aviso, Botao, CLASSE_CAMPO, Campo, Etiqueta, Input, Interruptor, ListaTexto, Painel, Seleccao, Seta,
} from "@/components/admin/kit";
import { Formulario } from "@/components/admin/editor/Formulario";
import type { CampoEsquema, Valor } from "@/components/admin/editor/esquema";
import { EditorCorpo } from "@/app/admin/noticias/EditorCorpo";

/** O perfil como o painel o edita: todos os campos presentes, blocos desligados a null. */
export type Perfil = Omit<PerfilClube, "viagens" | "comoAderir" | "lema" | "estilo" | "motas" | "encontros" | "numeros"> & {
  lema: string;
  estilo: string;
  motas: string;
  encontros: string[];
  numeros: NonNullable<PerfilClube["numeros"]>;
  viagens: NonNullable<PerfilClube["viagens"]> | null;
  comoAderir: { passos: string[]; fonte?: number };
};

/** Perfil em branco, para um clube que ainda não o tem. */
export const perfilVazio = (): Perfil => ({
  resumo: "", lema: "", historia: [], destaques: [], viagens: null, encontros: [],
  comoAderir: { passos: [] }, estilo: "", motas: "", numeros: [], fontes: [],
});

/** Dados gravados (ou de origem) → perfil para editar. Mantém campos que o painel não conhece. */
export function paraEdicao(d: unknown): Perfil {
  const p = (d && typeof d === "object" ? d : {}) as Partial<PerfilClube> & Record<string, unknown>;
  return {
    ...p,
    resumo: p.resumo ?? "",
    lema: p.lema ?? "",
    historia: Array.isArray(p.historia) ? p.historia : [],
    destaques: Array.isArray(p.destaques) ? p.destaques : [],
    viagens: p.viagens ? { ...p.viagens, lista: p.viagens.lista ?? [] } : null,
    encontros: Array.isArray(p.encontros) ? p.encontros : [],
    comoAderir: { passos: p.comoAderir?.passos ?? [], fonte: p.comoAderir?.fonte },
    estilo: p.estilo ?? "",
    motas: p.motas ?? "",
    numeros: Array.isArray(p.numeros) ? p.numeros : [],
    fontes: Array.isArray(p.fontes) ? p.fontes : [],
  };
}

/** Perfil limpo para gravar: textos aparados, linhas vazias fora. */
export function paraGravar(p: Perfil): Perfil {
  const t = (s: string | undefined) => (s ?? "").trim();
  return {
    ...p,
    resumo: t(p.resumo),
    lema: t(p.lema),
    estilo: t(p.estilo),
    motas: t(p.motas),
    historia: p.historia.map((x) => x.trim()).filter(Boolean),
    destaques: p.destaques.filter((d) => t(d.titulo) || t(d.texto)).map((d) => ({ ...d, ano: t(d.ano) || undefined })),
    numeros: p.numeros.filter((n) => t(n.valor) || t(n.rotulo)),
    encontros: p.encontros.map(t).filter(Boolean),
    comoAderir: { ...p.comoAderir, passos: p.comoAderir.passos.map(t).filter(Boolean) },
    viagens: p.viagens ? { ...p.viagens, lista: p.viagens.lista.filter((v) => t(v.nome) || t(v.ano)) } : null,
    // As fontes ficam como estão (mesmo vazias): tirar uma mudava o número das que vêm depois.
    fontes: p.fontes.map((f) => ({ nome: t(f.nome), url: t(f.url) })),
  };
}

/* ---------------- Fontes ---------------- */

/** Aplica uma nova numeração das fontes a todas as ligações do perfil. */
function renumerar(p: Perfil, f: (i: number) => number | undefined): Perfil {
  const r = (i?: number) => (i === undefined ? undefined : f(i));
  return {
    ...p,
    destaques: p.destaques.map((d) => ({ ...d, fonte: r(d.fonte) })),
    numeros: p.numeros.map((n) => ({ ...n, fonte: r(n.fonte) })),
    viagens: p.viagens ? { ...p.viagens, fonte: r(p.viagens.fonte) } : null,
    comoAderir: { ...p.comoAderir, fonte: r(p.comoAderir.fonte) },
  };
}

/** Quantas partes do perfil apontam para a fonte `i`. */
function usosDaFonte(p: Perfil, i: number): number {
  return [
    ...p.destaques.map((d) => d.fonte),
    ...p.numeros.map((n) => n.fonte),
    p.viagens?.fonte,
    p.comoAderir.fonte,
  ].filter((x) => x === i).length;
}

const nomeCurto = (f: FonteClube) => (f.nome || f.url || "Fonte sem nome").split(":")[0];

/** Escolha da fonte de um facto, pelo nome. */
function SeleccaoFonte({ valor, fontes, onChange, etiqueta = "Fonte" }: {
  valor: unknown; fontes: FonteClube[]; onChange: (v: number | undefined) => void; etiqueta?: string;
}) {
  const actual = typeof valor === "number" && valor >= 0 && valor < fontes.length ? String(valor) : "";
  return (
    <Campo etiqueta={etiqueta} ajuda={fontes.length ? "Aparece como «Fonte: …» ao lado, e liga para a página da fonte." : "Junte primeiro as fontes do clube, no quadro «Fontes»."}>
      <Seleccao
        valor={actual}
        onChange={(v) => onChange(v === "" ? undefined : Number(v))}
        opcoes={[
          { valor: "", nome: "Sem fonte (não mostra ligação)" },
          ...fontes.map((f, i) => ({ valor: String(i), nome: `${i + 1}. ${nomeCurto(f)}` })),
        ]}
      />
    </Campo>
  );
}

function EditorFontes({ perfil, onChange }: { perfil: Perfil; onChange: (p: Perfil) => void }) {
  const fontes = perfil.fontes;
  const mudar = (i: number, campos: Partial<FonteClube>) =>
    onChange({ ...perfil, fontes: fontes.map((f, j) => (j === i ? { ...f, ...campos } : f)) });
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= fontes.length) return;
    const lista = [...fontes];
    [lista[i], lista[j]] = [lista[j], lista[i]];
    onChange(renumerar({ ...perfil, fontes: lista }, (k) => (k === i ? j : k === j ? i : k)));
  };
  const apagar = (i: number) => {
    const usos = usosDaFonte(perfil, i);
    if (usos && !window.confirm(`Esta fonte está ligada a ${usos} ${usos === 1 ? "facto" : "factos"} do perfil, que ficam sem fonte. Apagar?`)) return;
    onChange(renumerar({ ...perfil, fontes: fontes.filter((_, j) => j !== i) }, (k) => (k === i ? undefined : k > i ? k - 1 : k)));
  };

  return (
    <div className="space-y-[var(--intervalo)]">
      {fontes.length === 0 && (
        <p className="rounded-[var(--raio)] border border-dashed border-white/15 px-4 py-5 text-center text-sm text-white/75">
          Sem fontes. Sem elas, a página não mostra a lista de fontes nem as ligações ao lado dos factos.
        </p>
      )}
      <ol className="space-y-[var(--intervalo)]">
        {fontes.map((f, i) => {
          const usos = usosDaFonte(perfil, i);
          return (
            <li key={i} className="rounded-[var(--raio)] border border-white/10 bg-black/[0.18] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-[4px] bg-white/10 text-xs tabular-nums text-white/70">{i + 1}</span>
                  {usos > 0 ? <Etiqueta tom="ok">Ligada a {usos}</Etiqueta> : <Etiqueta>Só na lista</Etiqueta>}
                </span>
                <span className="flex gap-1">
                  {/^https?:\/\//.test(f.url) && (
                    <a href={f.url} target="_blank" rel="noopener noreferrer" title="Abrir a fonte" aria-label="Abrir a fonte"
                      className="inline-flex size-8 items-center justify-center rounded-[var(--raio)] bg-white/[0.06] text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                      <ExternalLink className="size-4" aria-hidden />
                    </a>
                  )}
                  <AccaoIcone titulo="Subir" onClick={() => mover(i, -1)}><Seta para="cima" /></AccaoIcone>
                  <AccaoIcone titulo="Descer" onClick={() => mover(i, 1)}><Seta para="baixo" /></AccaoIcone>
                  <AccaoIcone titulo="Apagar fonte" tom="perigo" onClick={() => apagar(i)}><Trash2 className="size-4" aria-hidden /></AccaoIcone>
                </span>
              </div>
              <div className="grid gap-2">
                <input
                  value={f.nome} onChange={(e) => mudar(i, { nome: e.target.value })}
                  placeholder="Quem publicou: título (data). Ex.: Jornal de Angola: Primeira edição… (Junho de 2026)"
                  aria-label={`Fonte ${i + 1}: nome`} className={`${CLASSE_CAMPO} text-sm`}
                />
                <input
                  type="url" value={f.url} onChange={(e) => mudar(i, { url: e.target.value })}
                  placeholder="https://…" aria-label={`Fonte ${i + 1}: endereço`} className={`${CLASSE_CAMPO} text-[13px]`}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <Botao onClick={() => onChange({ ...perfil, fontes: [...fontes, { nome: "", url: "" }] })}>
        <Plus className="size-4" aria-hidden /> Juntar fonte
      </Botao>
      <p className="text-xs leading-relaxed text-white/70">
        O texto antes dos dois pontos («Bikers of Africa», «Instagram») é o que aparece ao lado dos factos. O nome inteiro aparece na lista de fontes, no fim da página.
      </p>
    </div>
  );
}

/* ---------------- Editor ---------------- */

export function EditorPerfil({
  perfil, onChange, movimento,
}: {
  perfil: Perfil;
  onChange: (p: Perfil) => void;
  /** Um movimento, e não um clube (só muda os textos de ajuda). */
  movimento: boolean;
}) {
  const termo = movimento ? "movimento" : "clube";
  const fontes = perfil.fontes;
  const campoFonte = (chave = "fonte"): CampoEsquema => ({
    tipo: "personalizado", chave, etiqueta: "Fonte",
    render: (valor, mudar) => <SeleccaoFonte valor={valor} fontes={fontes} onChange={mudar} />,
  });

  const ESQUEMA_PERCURSO: CampoEsquema[] = [
    {
      tipo: "lista", chave: "destaques", etiqueta: "Momentos", nomeItem: "momento",
      ajuda: "Por ordem cronológica. Viagens, raides, acções solidárias, aniversários.",
      resumo: (d) => [d.ano, d.titulo].filter(Boolean).join(" · "),
      novo: () => ({ ano: "", titulo: "", texto: "" }),
      campos: [
        { tipo: "texto", chave: "ano", etiqueta: "Quando", placeholder: "Ex.: Agosto de 2006", ajuda: "Vazio: aparece «Sem data certa».", largura: "meia" },
        { tipo: "texto", chave: "titulo", etiqueta: "Título", largura: "meia" },
        { tipo: "area", chave: "texto", etiqueta: "O que aconteceu", linhas: 3 },
        campoFonte(),
      ],
    },
  ];

  const ESQUEMA_NUMEROS: CampoEsquema[] = [
    {
      tipo: "lista", chave: "numeros", etiqueta: "Quadros de números", nomeItem: "número",
      ajuda: `Só números publicados numa fonte. Aparecem em quadros ao lado da história do ${termo}.`,
      resumo: (n) => [n.valor, n.rotulo].filter(Boolean).join(" "),
      novo: () => ({ valor: "", rotulo: "" }),
      campos: [
        { tipo: "texto", chave: "valor", etiqueta: "Número", placeholder: "Ex.: 364", largura: "meia" },
        { tipo: "texto", chave: "rotulo", etiqueta: "O que conta", placeholder: "Ex.: associados em 2019", largura: "meia" },
        campoFonte(),
      ],
    },
  ];

  const ESQUEMA_VIAGENS: CampoEsquema[] = [
    { tipo: "texto", chave: "titulo", etiqueta: "Título da tabela", placeholder: "Ex.: As viagens internacionais" },
    { tipo: "area", chave: "nota", etiqueta: "Nota por baixo do título", linhas: 2 },
    campoFonte(),
    {
      tipo: "lista", chave: "lista", etiqueta: "Viagens", nomeItem: "viagem",
      resumo: (v) => [v.ano, v.nome].filter(Boolean).join(" · "),
      novo: () => ({ ano: "", nome: "", percurso: "", km: "" }),
      campos: [
        { tipo: "texto", chave: "ano", etiqueta: "Ano", largura: "meia" },
        { tipo: "texto", chave: "km", etiqueta: "Quilómetros", placeholder: "Ex.: 2655", ajuda: "Vazio: aparece «—».", largura: "meia" },
        { tipo: "texto", chave: "nome", etiqueta: "Nome da viagem", placeholder: "Ex.: Desafio ao Sul" },
        { tipo: "texto", chave: "percurso", etiqueta: "Percurso e países", placeholder: "Ex.: Luanda – Oshakati (Namíbia)" },
      ],
    },
  ];

  const definir = (campos: Partial<Perfil>) => onChange({ ...perfil, ...campos });

  return (
    <div className="grid items-start gap-[var(--intervalo)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="space-y-[var(--intervalo)]">
        <Painel titulo="Apresentação" descricao={`O que se lê primeiro sobre o ${termo}.`}>
          <div className="space-y-4">
            <Campo etiqueta="Linha de apresentação" ajuda={`Uma frase. Aparece no cartão do ${termo} em /clubes e por baixo do nome, no topo da página.`}>
              <textarea rows={2} value={perfil.resumo} onChange={(e) => definir({ resumo: e.target.value })} className={`${CLASSE_CAMPO} resize-y leading-relaxed`} />
            </Campo>
            <Campo etiqueta="Lema" ajuda="Aparece num cartão vermelho, entre aspas. Vazio: o cartão não aparece.">
              <Input value={perfil.lema} onChange={(e) => definir({ lema: e.target.value })} placeholder="Ex.: Faça sol ou faça chuva" />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Estilo" ajuda="Como andam: passeios curtos, viagens longas, trilhos…">
                <textarea rows={3} value={perfil.estilo} onChange={(e) => definir({ estilo: e.target.value })} className={`${CLASSE_CAMPO} resize-y leading-relaxed`} />
              </Campo>
              <Campo etiqueta="Motas" ajuda="Que motas se vêem no grupo.">
                <textarea rows={3} value={perfil.motas} onChange={(e) => definir({ motas: e.target.value })} className={`${CLASSE_CAMPO} resize-y leading-relaxed`} />
              </Campo>
            </div>
          </div>
        </Painel>

        <Painel titulo="A história" descricao={`Os parágrafos de «A história». Use «Citação» para uma frase dita por alguém do ${termo}. Sem história, a página mostra a descrição da ficha.`}>
          <EditorCorpo valor={perfil.historia} onChange={(historia) => definir({ historia })} tipos={["paragrafo", "citacao"]} />
        </Painel>

        <Painel titulo={`Percurso do ${termo}`} descricao="A cronologia em cartões, cada um com a sua data e, se houver, a sua fonte.">
          <Formulario esquema={ESQUEMA_PERCURSO} valor={perfil as unknown as Valor} onChange={(v) => onChange(v as unknown as Perfil)} />
        </Painel>

        <Painel titulo="Números">
          <Formulario esquema={ESQUEMA_NUMEROS} valor={perfil as unknown as Valor} onChange={(v) => onChange(v as unknown as Perfil)} />
        </Painel>

        <Painel titulo="Viagens" descricao={`Uma tabela com as viagens que o ${termo} publicou (ano, nome, percurso e quilómetros).`}>
          <div className="space-y-4">
            <Interruptor
              etiqueta="Mostrar a tabela de viagens"
              activo={perfil.viagens !== null}
              onChange={(v) => definir({ viagens: v ? { titulo: "Viagens publicadas", nota: "", lista: [] } : null })}
            />
            {perfil.viagens && (
              <Formulario
                esquema={ESQUEMA_VIAGENS}
                valor={perfil.viagens as unknown as Valor}
                onChange={(v) => definir({ viagens: v as unknown as Perfil["viagens"] })}
              />
            )}
          </div>
        </Painel>

        <Painel titulo="Encontros e adesão">
          <div className="space-y-5">
            <ListaTexto
              etiqueta="Onde e quando se encontram"
              ajuda="Pormenores que se juntam ao campo «Onde e quando se encontram» da ficha. Um por linha."
              valores={perfil.encontros}
              multilinha
              placeholder="Ex.: Café da Picada, um encontro social por mês"
              onChange={(encontros) => definir({ encontros })}
            />
            <ListaTexto
              etiqueta={movimento ? "Como fazer parte" : "Como entrar no clube"}
              ajuda="Os passos, por ordem. Com um só, aparece como frase. Sem nenhum, a página manda perguntar nas redes."
              valores={perfil.comoAderir.passos}
              multilinha
              placeholder="Ex.: Seguir o clube no Instagram e aparecer num encontro"
              onChange={(passos) => definir({ comoAderir: { ...perfil.comoAderir, passos } })}
            />
            <SeleccaoFonte
              etiqueta="Fonte dos passos"
              valor={perfil.comoAderir.fonte}
              fontes={fontes}
              onChange={(fonte) => definir({ comoAderir: { ...perfil.comoAderir, fonte } })}
            />
          </div>
        </Painel>
      </div>

      <div className="space-y-[var(--intervalo)] xl:sticky xl:top-[8.75rem] xl:max-h-[calc(100dvh-10rem)] xl:overflow-y-auto xl:rounded-[var(--raio)]">
        <Painel titulo="Fontes" descricao={`Reportagens e páginas públicas de onde vem a informação. Aparecem numeradas no fim da página do ${termo}.`}>
          <EditorFontes perfil={perfil} onChange={onChange} />
        </Painel>
        {fontes.length === 0 && perfil.destaques.length > 0 && (
          <Aviso tom="atencao">
            Sem fontes, a página diz que os momentos são «os que marcaram o {termo}», sem ligações para confirmar.
          </Aviso>
        )}
      </div>
    </div>
  );
}
