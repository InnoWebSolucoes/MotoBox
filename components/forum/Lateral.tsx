/* ============================================================
   MOTOBOX — Fórum: quadros da coluna ao lado
   Sobre o fórum (com os números e o botão de criar tópico), os
   mais activos do mês, as categorias, os níveis, as regras e as
   ligações para o resto da comunidade. Todos os textos vêm de
   "paginas.forum" (Gestão › Fórum › Página Fórum).
   ============================================================ */

import Link from "next/link";
import type { ReactNode } from "react";
import { Award, PenSquare } from "lucide-react";
import { Icon } from "@/components/ui";
import { Seta } from "@/components/painel/kit";
import type { ConteudoForum } from "@/lib/conteudo/grupos/comunidade";
import { AvatarForum, MarcaNivel } from "./Autor";
import { textoSobre, type CategoriaCartao, type Contribuidor } from "./tipos";

const numero = (n: number) => n.toLocaleString("pt-PT");

export function Quadro({ titulo, children, id, className = "" }: { titulo?: ReactNode; children: ReactNode; id?: string; className?: string }) {
  return (
    <section className={`painel painel-escuro p-5 ${className}`} aria-labelledby={id}>
      {titulo && <h2 id={id} className="text-lg font-semibold leading-tight text-white">{titulo}</h2>}
      {children}
    </section>
  );
}

/** Botão vermelho largo "Criar tópico". */
export function BotaoCriar({ texto, categoria, className = "" }: { texto: string; categoria?: string; className?: string }) {
  return (
    <Link
      href={categoria ? `/forum/novo?categoria=${encodeURIComponent(categoria)}` : "/forum/novo"}
      className={`group inline-flex h-12 w-full items-center justify-between gap-4 rounded-[var(--raio)] bg-mb-red px-4 text-[15px] font-semibold text-white transition-colors hover:bg-mb-red-dark ${className}`}
    >
      <span className="inline-flex items-center gap-2.5">
        <PenSquare className="size-[18px]" aria-hidden />
        <span>{texto}</span>
      </span>
      <Seta className="size-3.5" />
    </Link>
  );
}

export function QuadroSobre({
  textos, totais, categoria,
}: {
  textos: ConteudoForum;
  totais: { topicos: number; respostas: number; membros: number };
  categoria?: string;
}) {
  const { lateral, numeros } = textos;
  return (
    <Quadro titulo={lateral.sobreTitulo} id="sobre-forum">
      {lateral.sobreTexto && <p className="mt-2 text-[15px] leading-relaxed text-white/90">{lateral.sobreTexto}</p>}
      {numeros.mostrar && (
        <dl className="mt-4 grid grid-cols-3 gap-[var(--intervalo)]">
          {[
            [totais.topicos, numeros.topicos],
            [totais.respostas, numeros.respostas],
            [totais.membros, numeros.membros],
          ].map(([n, rotulo]) => (
            <div key={String(rotulo)} className="flex flex-col-reverse rounded-[4px] bg-white/[0.07] px-2.5 py-2.5">
              <dt className="mt-1.5 text-[12px] leading-tight text-white/85">{rotulo}</dt>
              <dd className="text-xl font-semibold leading-none tabular-nums text-white">{numero(Number(n))}</dd>
            </div>
          ))}
        </dl>
      )}
      <BotaoCriar texto={lateral.criar} categoria={categoria} className="mt-4" />
    </Quadro>
  );
}

export function QuadroContribuidores({ textos, lista }: { textos: ConteudoForum; lista: Contribuidor[] }) {
  const { lateral } = textos;
  return (
    <Quadro titulo={lateral.contribuidoresTitulo} id="mais-activos">
      {lateral.contribuidoresTexto && <p className="mt-1 text-[13px] text-white/85">{lateral.contribuidoresTexto}</p>}
      {lista.length === 0 ? (
        <p className="mt-4 rounded-[4px] bg-white/[0.07] p-3 text-sm leading-relaxed text-white/90">{lateral.contribuidoresVazio}</p>
      ) : (
        <ol className="mt-3 grid gap-1">
          {lista.map((c, i) => (
            <li key={c.chave} className="flex items-center gap-3 rounded-[4px] py-1.5">
              <span
                aria-hidden
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums ${
                  i === 0 ? "bg-gold text-[#141418]" : i === 1 ? "bg-silver text-[#141418]" : i === 2 ? "bg-bronze text-[#141418]" : "bg-white/12 text-white"
                }`}
              >
                {i + 1}
              </span>
              <AvatarForum nome={c.autor.nome} iniciais={c.autor.iniciais} cor={c.autor.cor} avatar={c.autor.avatar} className="size-8 text-[11px]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium leading-tight text-white">{c.autor.nome}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/85">
                  <span className="tabular-nums">{numero(c.contagem)}</span>
                  <span>{lateral.contribuicoes}</span>
                </span>
              </span>
              <MarcaNivel texto={c.autor.nivel} />
            </li>
          ))}
        </ol>
      )}
    </Quadro>
  );
}

export function QuadroCategorias({
  titulo, categorias, contar, activa,
}: {
  titulo: string;
  categorias: CategoriaCartao[];
  contar: (slug: string) => number;
  activa?: string;
}) {
  return (
    <Quadro titulo={titulo} id="categorias-forum">
      <ul className="mt-3 grid gap-0.5">
        {categorias.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/forum?categoria=${encodeURIComponent(c.slug)}`}
              scroll={false}
              aria-current={c.slug === activa ? "page" : undefined}
              className="group flex items-center gap-3 rounded-[4px] px-2 py-2 transition-colors hover:bg-white/10 aria-[current=page]:bg-white/12"
            >
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[4px]" style={{ background: c.cor, color: textoSobre(c.cor) }}>
                <Icon name={c.icone} className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-[15px] text-white">{c.nome}</span>
              <span className="rounded-[3px] bg-white/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-white">{contar(c.slug)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Quadro>
  );
}

export function QuadroNiveis({ textos }: { textos: ConteudoForum }) {
  const { niveis } = textos;
  if (!niveis.mostrar || niveis.lista.length === 0) return null;
  const lista = [...niveis.lista].sort((a, b) => (Number(a.minimo) || 0) - (Number(b.minimo) || 0));
  return (
    <Quadro titulo={<span className="inline-flex items-center gap-2"><Award className="size-5 text-gold" aria-hidden />{niveis.titulo}</span>} id="niveis-forum">
      {niveis.texto && <p className="mt-2 text-[13px] leading-relaxed text-white/85">{niveis.texto}</p>}
      <ol className="mt-3 grid gap-1.5">
        {lista.map((n) => (
          <li key={`${n.nome}-${n.minimo}`} className="flex items-center justify-between gap-3">
            <MarcaNivel texto={n.nome} />
            <span className="text-[13px] tabular-nums text-white/85">
              <span>{`${numero(Number(n.minimo) || 0)}+`}</span>{" "}
              <span>{niveis.pontos}</span>
            </span>
          </li>
        ))}
      </ol>
    </Quadro>
  );
}

export function QuadroRegras({ textos }: { textos: ConteudoForum }) {
  const { lateral } = textos;
  if (!lateral.regras.length && !lateral.regulamento) return null;
  return (
    <Quadro titulo={lateral.regrasTitulo} id="regras-forum">
      <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-white/90">
        {lateral.regras.map((r, i) => (
          <li key={`${i}-${r}`} className="flex gap-3">
            <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-[3px] bg-mb-red text-[11px] font-bold tabular-nums text-white">{i + 1}</span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
      {lateral.regulamento && (
        <Link href={lateral.regulamentoLigacao || "/regulamento"} className="mt-4 inline-flex text-sm font-medium text-white">
          <span className="sublinhado">{lateral.regulamento}</span>
        </Link>
      )}
    </Quadro>
  );
}

export function QuadroLigacoes({ textos }: { textos: ConteudoForum }) {
  const { lateral } = textos;
  const ligacoes = lateral.ligacoes.filter((l) => l?.texto && l?.ligacao);
  if (!ligacoes.length) return null;
  return (
    <Quadro titulo={lateral.ligacoesTitulo} id="ligacoes-forum">
      <ul className="mt-2 divide-y divide-white/10">
        {ligacoes.map((l) => {
          const externa = /^https?:\/\//.test(l.ligacao);
          const classes = "group flex items-center justify-between gap-3 py-2.5 text-[15px] text-white";
          const dentro = (<><span className="group-hover:underline">{l.texto}</span><Seta className="size-3" /></>);
          return (
            <li key={`${l.texto}-${l.ligacao}`}>
              {externa ? (
                <a href={l.ligacao} target="_blank" rel="noopener noreferrer" className={classes}>{dentro}</a>
              ) : (
                <Link href={l.ligacao} className={classes}>{dentro}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </Quadro>
  );
}
