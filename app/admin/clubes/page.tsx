"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PaginaRecurso } from "@/components/admin/Recurso";
import { Campo, CampoEndereco, Input, Area, Seleccao, ListaTexto, Interruptor } from "@/components/admin/kit";
import { slugify } from "@/lib/admin/store";
import { comBase } from "@/lib/base";
import type { Clube, TipoClube } from "@/lib/types";
import { PROVINCIAS, ehProvincia } from "@/lib/provincias";
import { REDES_CLUBE, TIPOS_CLUBE, localClube, nomeTipo } from "@/app/clubes/comum";

const op = (v: readonly string[]) => v.map((x) => ({ valor: x, nome: x }));
const OPCOES_TIPO = TIPOS_CLUBE.map((t) => ({ valor: t.tipo, nome: t.nome }));

const AJUDA_REDES: Record<string, string> = {
  instagram: "Endereço completo ou só @utilizador.",
  facebook: "Endereço da página ou do grupo.",
  whatsapp: "Ligação wa.me ou o número com indicativo (+244…). Só se o clube o publicar.",
  site: "Endereço do site do clube.",
  tiktok: "Endereço completo ou só @utilizador.",
};

/**
 * Enquanto a tabela `clubes` não existe, a API responde {emFalta: true}
 * e a lista vem vazia: o aviso diz à equipa o que falta fazer.
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

export default function AdminClubes() {
  const emFalta = useTabelaEmFalta();

  return (
    <>
      {emFalta && (
        <div role="alert" className="mb-6 border border-gold/40 bg-gold/10 px-4 py-3.5">
          <p className="font-display text-sm uppercase tracking-wider text-gold">Falta criar a tabela dos clubes</p>
          <p className="mt-1.5 text-sm text-ink-200">
            A secção Clubes precisa de uma actualização da base de dados. No Supabase, abra{" "}
            <span className="text-white">SQL Editor → New query</span>, cole o conteúdo do ficheiro{" "}
            <code className="bg-ink-950 px-1.5 py-0.5 text-xs text-white">supabase/migracao-2026-09-28.sql</code> e carregue
            em <span className="text-white">Run</span>. O ficheiro cria a tabela e junta os primeiros clubes. Até lá o site
            mostra os clubes de partida e não é possível guardar alterações aqui.
          </p>
        </div>
      )}

      <PaginaRecurso<Clube>
        coleccao="clubes"
        titulo="Clubes"
        descricao="Clubes de lazer e moto-turismo: Lady Riders, grupos de passeio, clubes de marca. Não têm pilotos nem pontos (as equipas de competição ficam em Equipas)."
        procuraEm={(c) => `${c.nome} ${c.cidade} ${c.provincia} ${c.tipo} ${c.actividades.join(" ")}`}
        ordenar={(a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)) || a.nome.localeCompare(b.nome)}
        filtros={[
          { chave: "tipo", etiqueta: "Tipo", opcoes: OPCOES_TIPO },
          { chave: "provincia", etiqueta: "Província", opcoes: op(PROVINCIAS) },
        ]}
        vazio={emFalta ? "Sem clubes enquanto a tabela não for criada." : "Ainda não há clubes. Carregue em Novo para juntar o primeiro."}
        accoesExtra={
          <Link
            href="/clubes"
            target="_blank"
            className="inline-flex h-10 items-center border border-ink-600 px-4 font-display text-xs uppercase tracking-wider text-white transition-colors hover:border-mb-red"
          >
            Ver no site
          </Link>
        }
        colunas={[
          {
            cabecalho: "Clube",
            celula: (c) => (
              <div className="flex items-center gap-2.5">
                <span className="size-8 shrink-0 rounded-full border border-ink-700" style={{ background: c.cor }} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{c.nome}</p>
                  <p className="truncate text-xs text-ink-500">/clubes/{c.slug}</p>
                </div>
              </div>
            ),
          },
          { cabecalho: "Tipo", celula: (c) => <span className="text-ink-300">{nomeTipo(c.tipo)}</span> },
          { cabecalho: "Local", celula: (c) => <span className="text-ink-400">{localClube(c)}</span> },
          { cabecalho: "Actividades", celula: (c) => <span className="tabular-nums text-ink-300">{c.actividades.length}</span> },
          {
            cabecalho: "Destaque",
            celula: (c) => (c.destaque ? <span className="text-gold">Sim</span> : <span className="text-ink-600">Não</span>),
          },
        ]}
        novoRegisto={() => ({
          slug: "", nome: "", tipo: "Moto-turismo", provincia: "Luanda", cidade: "",
          descricao: "", actividades: [], logo: "", cor: "#e10600", redes: {},
        }) as Clube}
        formulario={(r, definir, { novo }) => {
          const redes = (campos: Partial<Clube["redes"]>) =>
            definir({ redes: { ...r.redes, ...campos } } as Partial<Clube>);
          return (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Nome" obrigatorio>
                  <Input
                    value={r.nome}
                    onChange={(e) => definir({
                      nome: e.target.value,
                      slug: novo && r.slug === slugify(r.nome) ? slugify(e.target.value) : r.slug,
                    } as Partial<Clube>)}
                  />
                </Campo>
                <CampoEndereco prefixo="/clubes" novo={novo} valor={r.slug}
                  onChange={(slug) => definir({ slug } as Partial<Clube>)} />
                <Campo etiqueta="Tipo" ajuda="Lady Riders aparece no menu do site (Clubes → Lady Riders).">
                  <Seleccao valor={r.tipo} opcoes={OPCOES_TIPO}
                    onChange={(v) => definir({ tipo: v as TipoClube } as Partial<Clube>)} />
                </Campo>
                <Campo etiqueta="Província">
                  <Seleccao valor={r.provincia} opcoes={op(PROVINCIAS)}
                    onChange={(v) => { if (ehProvincia(v)) definir({ provincia: v } as Partial<Clube>); }} />
                </Campo>
                <Campo etiqueta="Cidade" ajuda="Onde o clube tem sede. Deixe vazio se o clube não a publica.">
                  <Input value={r.cidade} onChange={(e) => definir({ cidade: e.target.value } as Partial<Clube>)} />
                </Campo>
                <Campo etiqueta="Ano de fundação" ajuda="Só se o clube o indicar. Vazio não aparece no site.">
                  <Input
                    type="number" inputMode="numeric" min={1950} max={2100}
                    value={r.fundacao ?? ""}
                    // null, e não undefined, para que apagar o ano também o apague na base.
                    onChange={(e) => definir({ fundacao: e.target.value ? Number(e.target.value) : null } as unknown as Partial<Clube>)}
                  />
                </Campo>
              </div>

              <Campo etiqueta="Descrição" obrigatorio ajuda="O que o clube é e o que faz, em poucas frases.">
                <Area rows={5} value={r.descricao} onChange={(e) => definir({ descricao: e.target.value } as Partial<Clube>)} />
              </Campo>

              <ListaTexto
                etiqueta="Actividades"
                valores={r.actividades}
                placeholder="Ex.: Passeios de fim-de-semana"
                onChange={(v) => definir({ actividades: v } as Partial<Clube>)}
              />

              <Campo etiqueta="Onde e quando se encontram" ajuda="Texto livre. Ex.: Domingos às 7h, Marginal de Luanda. Vazio: o site diz que não há ponto fixo.">
                <Area rows={2} value={r.encontros ?? ""} onChange={(e) => definir({ encontros: e.target.value } as Partial<Clube>)} />
              </Campo>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Logótipo" ajuda="Endereço da imagem. Vazio: aparecem as iniciais sobre a cor do clube.">
                  <Input value={r.logo} placeholder="https://…" onChange={(e) => definir({ logo: e.target.value } as Partial<Clube>)} />
                </Campo>
                <Campo etiqueta="Fotografia de capa" ajuda="Endereço de uma fotografia do próprio clube. Vazio: capa desenhada com a cor.">
                  <Input value={r.imagem ?? ""} placeholder="https://…" onChange={(e) => definir({ imagem: e.target.value } as Partial<Clube>)} />
                </Campo>
                <Campo etiqueta="Cor do clube" ajuda="Usada na capa e no logótipo sem imagem.">
                  <div className="flex gap-2">
                    <input type="color" value={r.cor} aria-label="Cor"
                      onChange={(e) => definir({ cor: e.target.value } as Partial<Clube>)}
                      className="h-10 w-14 border border-ink-700 bg-ink-950" />
                    <Input value={r.cor} onChange={(e) => definir({ cor: e.target.value } as Partial<Clube>)} />
                  </div>
                </Campo>
                <Campo etiqueta="Contacto" ajuda="Email ou telefone que o clube publica. Aparece em Contactar o clube.">
                  <Input value={r.contacto ?? ""} onChange={(e) => definir({ contacto: e.target.value } as Partial<Clube>)} />
                </Campo>
              </div>

              <div className="border border-ink-700/60 p-3">
                <p className="mb-3 text-[11px] font-display uppercase tracking-widest text-ink-300">Redes sociais</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {REDES_CLUBE.map((rede) => (
                    <Campo key={rede.chave} etiqueta={rede.nome} ajuda={AJUDA_REDES[rede.chave]}>
                      <Input
                        value={r.redes?.[rede.chave] ?? ""}
                        onChange={(e) => redes({ [rede.chave]: e.target.value || undefined })}
                      />
                    </Campo>
                  ))}
                </div>
              </div>

              <Campo etiqueta="Fonte" ajuda="De onde veio a informação (endereços, um por linha). Não aparece no site.">
                <Area rows={3} value={r.fonte ?? ""} onChange={(e) => definir({ fonte: e.target.value } as Partial<Clube>)} />
              </Campo>

              <Interruptor
                activo={Boolean(r.destaque)}
                onChange={(v) => definir({ destaque: v } as Partial<Clube>)}
                etiqueta="Em destaque"
                descricao="Aparece em cartão grande no topo da página Clubes (no máximo três)."
              />
            </>
          );
        }}
      />
    </>
  );
}
