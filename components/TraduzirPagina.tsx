"use client";

/* ============================================================
   MOTOBOX — Tradução do texto fixo das páginas

   As páginas foram escritas com o português directo no JSX, e a
   maioria é renderizada no servidor. Este componente percorre os
   nós de texto quando o idioma é inglês e troca os que constam
   de `interfaceEn` e `conteudoEn`.

   Só toca em nós de texto: não lê nem escreve atributos, não
   altera a estrutura e não mexe em campos de formulário — o que
   o utilizador escreveu fica como está.

   É uma ponte para o texto que já existia. Texto novo deve usar
   `t("seccao.chave")`, que traduz na origem e não precisa disto.
   ============================================================ */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useIdioma } from "@/lib/i18n/contexto";
import { interfaceEn } from "@/lib/i18n/interface-en";
import { conteudoEn } from "@/lib/i18n/conteudo-en";

/** Marca os nós já tratados, para não os reprocessar a cada passagem. */
const TRATADO = "__mbTraduzido";

/**
 * Texto que vem colado a um número interpolado — "12 anúncios",
 * "24 800 visualizações", "4 min de leitura". O número fica em nó separado do
 * texto, por isso não há cadeia inteira para procurar na tabela.
 */
const PADROES: [RegExp, string][] = [
  [/^visualizações$/, "views"],
  [/^anúncio$/, "listing"],
  [/^anúncios$/, "listings"],
  [/^piloto$/, "rider"],
  [/^pilotos$/, "riders"],
  [/^prova$/, "race"],
  [/^provas$/, "races"],
  [/^tópico$/, "thread"],
  [/^tópicos$/, "threads"],
  [/^resposta$/, "reply"],
  [/^respostas$/, "replies"],
  [/^membro$/, "member"],
  [/^membros$/, "members"],
  [/^min de leitura$/, "min read"],
];

/**
 * Meses. As datas são formatadas no servidor, onde o idioma do visitante
 * ainda não é conhecido, por isso chegam sempre em português.
 */
const MESES: Record<string, string> = {
  janeiro: "January", fevereiro: "February", março: "March", abril: "April",
  maio: "May", junho: "June", julho: "July", agosto: "August",
  setembro: "September", outubro: "October", novembro: "November",
  dezembro: "December",
  jan: "Jan", fev: "Feb", mar: "Mar", abr: "Apr", mai: "May", jun: "Jun",
  jul: "Jul", ago: "Aug", set: "Sep", out: "Oct", nov: "Nov", dez: "Dec",
};

function porData(chave: string): string | undefined {
  // "08 de novembro de 2026" → "8 November 2026"; "10 de outubro" → "10 October"
  const longa = chave.match(/^(\d{1,2}) de ([a-zç]+)(?: de (\d{4}))?$/i);
  if (longa) {
    const mes = MESES[longa[2].toLowerCase()];
    if (mes) {
      return `${Number(longa[1])} ${mes}${longa[3] ? " " + longa[3] : ""}`;
    }
  }
  // "12 OUT" (formatDataCurta, em maiúsculas)
  const curta = chave.match(/^(\d{1,2})\s+([A-ZÇÃ]{3,4})$/);
  if (curta) {
    const mes = MESES[curta[2].toLowerCase()];
    if (mes) return `${curta[1]} ${mes.toUpperCase()}`;
  }
  return undefined;
}

function porPadrao(chave: string): string | undefined {
  const data = porData(chave);
  if (data) return data;

  for (const [re, en] of PADROES) if (re.test(chave)) return en;

  // O número interpolado parte o texto em vários nós. Conforme o sítio, o nó
  // com a palavra vem só com ela ("anúncios"), com o número colado
  // ("24 800 visualizações") ou com o resto do sufixo ("k visualizações").
  const m = chave.match(/^([\d\s.,]*k?)\s*(.+)$/);
  if (m && m[2] !== chave) {
    const palavra = porPadrao(m[2]);
    if (palavra) {
      const prefixo = m[1].trim();
      return prefixo ? `${prefixo} ${palavra}` : palavra;
    }
  }
  return undefined;
}

type NoMarcado = Text & { [TRATADO]?: string };

function traduzir(raiz: HTMLElement) {
  const it = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
    acceptNode(no) {
      const pai = no.parentElement;
      if (!pai) return NodeFilter.FILTER_REJECT;
      // Nada de script/style, e nada dentro de campos editáveis.
      const tag = pai.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") {
        return NodeFilter.FILTER_REJECT;
      }
      if (pai.isContentEditable) return NodeFilter.FILTER_REJECT;
      return no.textContent && no.textContent.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const nos: NoMarcado[] = [];
  let n: Node | null;
  while ((n = it.nextNode())) nos.push(n as NoMarcado);

  for (const no of nos) {
    const original = no[TRATADO] ?? no.textContent ?? "";
    const chave = original.trim();
    if (!chave) continue;

    const traduzido = interfaceEn[chave] ?? conteudoEn[chave] ?? porPadrao(chave);
    if (!traduzido) continue;

    // Guarda o original, para poder voltar a português sem recarregar.
    if (no[TRATADO] === undefined) no[TRATADO] = original;
    // Preserva o espaçamento à volta do texto.
    no.textContent = original.replace(chave, traduzido);
  }
}

function repor(raiz: HTMLElement) {
  const it = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = it.nextNode())) {
    const no = n as NoMarcado;
    if (no[TRATADO] !== undefined) {
      no.textContent = no[TRATADO];
      delete no[TRATADO];
    }
  }
}

export function TraduzirPagina() {
  const { idioma } = useIdioma();
  const caminho = usePathname();

  useEffect(() => {
    const raiz = document.body;
    if (idioma !== "en") {
      repor(raiz);
      return;
    }

    let aTraduzir = false;
    let agendado = 0;

    // Escrever nos nós dispara o próprio observador. Sem esta guarda, cada
    // tradução provocava outra passagem e o ciclo não fechava.
    const passagem = () => {
      agendado = 0;
      aTraduzir = true;
      try {
        traduzir(raiz);
      } finally {
        aTraduzir = false;
      }
    };

    passagem();

    // O React reescreve nós quando o estado muda (filtros, separadores,
    // paginação). Reaplicar depois dessas alterações mantém tudo traduzido.
    const obs = new MutationObserver(() => {
      if (aTraduzir || agendado) return;
      agendado = window.requestAnimationFrame(passagem);
    });
    obs.observe(raiz, { childList: true, subtree: true });

    return () => {
      obs.disconnect();
      if (agendado) cancelAnimationFrame(agendado);
    };
  }, [idioma, caminho]);

  return null;
}
