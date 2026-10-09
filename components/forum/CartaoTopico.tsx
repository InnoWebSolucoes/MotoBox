/* ============================================================
   MOTOBOX — Fórum: cartão de tópico
   Como numa comunidade do Reddit, no desenho do painel: a coluna
   do voto à esquerda; por cima do título a categoria (com a sua
   cor), quem abriu e há quanto tempo; o resumo; e em baixo as
   respostas, as visualizações e, nos tópicos sem resposta, o
   convite para ser o primeiro. O título é a ligação e cobre o
   cartão inteiro; o voto e as outras ligações ficam por cima.
   Texto branco ou quase branco em tudo, para se ler bem.
   ============================================================ */

import Link from "next/link";
import { CheckCircle2, Eye, Lock, MessageSquare, Pin } from "lucide-react";
import { Icon } from "@/components/ui";
import type { ConteudoForum } from "@/lib/conteudo/grupos/comunidade";
import { AvatarForum, MarcaNivel } from "./Autor";
import { Tempo } from "./Tempo";
import { BotaoVoto } from "./Votos";
import { textoSobre, type CategoriaCartao, type TopicoCartao } from "./tipos";

const numero = (n: number) => n.toLocaleString("pt-PT");

export function ChipCategoria({ categoria, ligar = true }: { categoria: CategoriaCartao; ligar?: boolean }) {
  const conteudo = (
    <>
      <span
        aria-hidden
        className="grid size-5 shrink-0 place-items-center rounded-[3px]"
        style={{ background: categoria.cor, color: textoSobre(categoria.cor) }}
      >
        <Icon name={categoria.icone} className="size-3" />
      </span>
      <span className="truncate font-semibold text-white">{categoria.nome}</span>
    </>
  );
  return ligar ? (
    <Link
      href={`/forum?categoria=${encodeURIComponent(categoria.slug)}`}
      scroll={false}
      className="relative z-10 inline-flex min-w-0 items-center gap-1.5 hover:underline"
    >
      {conteudo}
    </Link>
  ) : (
    <span className="inline-flex min-w-0 items-center gap-1.5">{conteudo}</span>
  );
}

/** Marcas de estado: fixado, resolvido (a verde), fechado. */
export function MarcasEstado({
  topico: t, textos,
}: { topico: Pick<TopicoCartao, "fixado" | "resolvido" | "bloqueado">; textos: ConteudoForum["lista"] }) {
  return (
    <>
      {t.fixado && (
        <span className="inline-flex h-6 items-center gap-1 rounded-[3px] bg-mb-red px-2 text-xs font-semibold text-white">
          <Pin className="size-3" aria-hidden />
          <span>{textos.fixado}</span>
        </span>
      )}
      {t.resolvido && (
        <span className="inline-flex h-6 items-center gap-1 rounded-[3px] bg-[#16a34a]/25 px-2 text-xs font-semibold text-[#bbf7d0] ring-1 ring-inset ring-[#4ade80]/40">
          <CheckCircle2 className="size-3.5" aria-hidden />
          <span>{textos.resolvido}</span>
        </span>
      )}
      {t.bloqueado && (
        <span className="inline-flex h-6 items-center gap-1 rounded-[3px] bg-white/12 px-2 text-xs font-semibold text-white">
          <Lock className="size-3" aria-hidden />
          <span>{textos.fechado}</span>
        </span>
      )}
    </>
  );
}

export function CartaoTopico({
  topico: t, textos,
}: {
  topico: TopicoCartao;
  textos: Pick<ConteudoForum, "lista" | "topico">;
}) {
  const tl = textos.lista;
  const tt = textos.topico;
  const semResposta = t.respostas === 0 && !t.bloqueado && !t.resolvido;
  return (
    <article
      className={`painel painel-escuro group relative flex gap-3 p-3 transition-shadow hover:ring-1 hover:ring-white/25 sm:gap-4 sm:p-4 ${
        t.resolvido ? "shadow-[inset_3px_0_0_#4ade80]" : ""
      }`}
    >
      {/* No computador o voto é uma coluna; no telemóvel vai para a linha de baixo, para o texto ter a largura toda. */}
      <div className="hidden shrink-0 self-start sm:block">
        <BotaoVoto id={t.id} total={t.votos} rotulo={tl.votar} rotuloRetirar={tl.retirarVoto} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-white/85">
          {t.categoria && <ChipCategoria categoria={t.categoria} />}
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <AvatarForum nome={t.autor.nome} iniciais={t.autor.iniciais} cor={t.autor.cor} avatar={t.autor.avatar} className="size-5 text-[9px]" />
            <span className="truncate text-white">{t.autor.nome}</span>
            <MarcaNivel texto={t.autor.nivel} tom={t.autor.equipa ? "equipa" : "nivel"} />
          </span>
          <Tempo iso={t.criado} className="text-white/80" />
        </div>

        <h3 className="mt-2 text-[17px] font-semibold leading-snug text-white sm:text-lg">
          <Link
            href={`/forum/${encodeURIComponent(t.id)}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[var(--raio)] focus-visible:after:ring-2 focus-visible:after:ring-mb-red-light group-hover:text-white"
          >
            {t.titulo}
          </Link>
        </h3>
        {(t.fixado || t.resolvido || t.bloqueado) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <MarcasEstado topico={t} textos={tl} />
          </div>
        )}
        {t.excerto && (
          <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-white/85">{t.excerto}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85">
          <BotaoVoto id={t.id} total={t.votos} rotulo={tl.votar} rotuloRetirar={tl.retirarVoto} forma="linha" className="sm:hidden" />
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="size-4" aria-hidden />
            <span className="font-semibold tabular-nums text-white">{numero(t.respostas)}</span>
            <span>{t.respostas === 1 ? tt.respostaSingular : tt.respostaPlural}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="size-4" aria-hidden />
            <span className="tabular-nums">{numero(t.visualizacoes)}</span>
            <span className="sr-only">{tt.visualizacoes}</span>
          </span>
          {semResposta && (
            <Link
              href={`/forum/${encodeURIComponent(t.id)}#responder`}
              className="relative z-10 inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-white px-3 text-[13px] font-semibold text-[#141418] transition-colors hover:bg-mb-red hover:text-white"
            >
              <Icon name="chat" className="size-3.5" />
              <span>{tl.primeiroResponder}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/** Cartão pequeno dos tópicos fixados pela equipa, por cima da lista. */
export function CartaoDestaque({ topico: t, textos }: { topico: TopicoCartao; textos: Pick<ConteudoForum, "lista" | "topico"> }) {
  return (
    <article className="painel painel-escuro group relative flex h-full flex-col p-4 transition-shadow hover:ring-1 hover:ring-white/25">
      <div className="flex items-center gap-2 text-[13px]">
        <span className="inline-flex h-6 items-center gap-1 rounded-[3px] bg-mb-red px-2 text-xs font-semibold text-white">
          <Pin className="size-3" aria-hidden />
          <span>{textos.lista.fixado}</span>
        </span>
        {t.categoria && <ChipCategoria categoria={t.categoria} ligar={false} />}
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug text-white">
        <Link
          href={`/forum/${encodeURIComponent(t.id)}`}
          className="outline-none after:absolute after:inset-0 after:rounded-[var(--raio)] focus-visible:after:ring-2 focus-visible:after:ring-mb-red-light"
        >
          {t.titulo}
        </Link>
      </h3>
      <p className="mt-auto flex flex-wrap items-center gap-x-2 pt-3 text-[13px] text-white/85">
        <span className="text-white">{t.autor.nome}</span>
        <span aria-hidden className="text-white/75">·</span>
        <span className="tabular-nums">{numero(t.respostas)}</span>
        <span>{t.respostas === 1 ? textos.topico.respostaSingular : textos.topico.respostaPlural}</span>
      </p>
    </article>
  );
}
