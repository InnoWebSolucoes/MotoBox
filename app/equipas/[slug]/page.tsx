import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, ListOrdered, Shield, Trophy } from "lucide-react";
import { Icon } from "@/components/ui";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, Numeros, Seccao } from "@/components/painel/blocos";
import { Seta } from "@/components/painel/kit";
import { classificacaoEquipas } from "@/lib/data";
import { lerEquipa, lerEquipas, lerPilotos } from "@/lib/supabase/publico";
import { EmblemaEquipa, Ficha, LigacaoSeta, Posicao, fotoEquipa } from "@/app/calendario/pecas";
import { CartaoPiloto } from "@/app/pilotos/CartaoPiloto";
import { lerExtrasEquipas } from "@/app/desporto/dados";
import { preencher } from "@/lib/conteudo/grupos/geral";
import { lerTextosEquipas, lerTextosPilotos } from "@/lib/conteudo/ler-geral";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Equipas criadas depois do build são geradas no primeiro pedido
// (`dynamicParams` fica no valor por omissão, `true`).
export async function generateStaticParams() {
  const equipas = await lerEquipas();
  return equipas.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = await lerEquipa(slug);
  if (!e) return { title: (await lerTextosEquipas()).equipa.naoEncontrada };
  return { title: e.nome, description: e.descricao.slice(0, 155) };
}

export default async function EquipaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const equipa = await lerEquipa(slug);
  if (!equipa) notFound();

  const [equipas, pilotos, extras, textos, textosPilotos] = await Promise.all([
    lerEquipas(), lerPilotos(), lerExtrasEquipas(), lerTextosEquipas(), lerTextosPilotos(),
  ]);
  const t = textos.equipa;
  const seus = pilotos.filter((p) => p.equipaSlug === equipa.slug);
  const posicao = classificacaoEquipas(equipas).find((e) => e.slug === equipa.slug)?.posicao;
  const outras = equipas.filter((e) => e.tipo === equipa.tipo && e.slug !== equipa.slug).slice(0, 3);
  const redes = [
    equipa.redes.instagram && { nome: "Instagram", icone: "instagram", url: equipa.redes.instagram },
    equipa.redes.facebook && { nome: "Facebook", icone: "facebook", url: equipa.redes.facebook },
  ].filter((r): r is { nome: string; icone: string; url: string } => Boolean(r));

  // Primeira frase para a abertura; a descrição inteira segue no corpo.
  const [frase] = equipa.descricao.split(/(?<=\.)\s+/);

  return (
    <PaginaInterior icone={<Shield />}>
      <Abertura foto={fotoEquipa(equipa, extras[equipa.slug]?.foto)} sobretitulo={`${equipa.tipo} · ${equipa.base}`} titulo={equipa.nome} texto={frase}>
        <div className="flex flex-wrap items-center gap-3">
          {posicao && (
            <span
              className={`inline-flex h-12 items-center gap-2.5 rounded-[var(--raio)] px-4 text-sm ${
                posicao <= 3 ? "bg-mb-red" : "bg-black/65"
              }`}
            >
              <ListOrdered className="size-4" aria-hidden />
              {preencher(t.noCampeonato, { n: posicao })}
            </span>
          )}
          {equipa.estatisticas.titulos > 0 && (
            <span className="inline-flex h-12 items-center gap-2.5 rounded-[var(--raio)] bg-black/65 px-4 text-sm">
              <Trophy className="size-4" aria-hidden />
              {preencher(t.campea, { n: equipa.estatisticas.titulos })}
            </span>
          )}
          {redes.map((r) => (
            <a
              key={r.nome}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2.5 rounded-[var(--raio)] bg-black/65 px-4 text-sm text-white transition-colors hover:bg-mb-red"
            >
              <Icon name={r.icone} className="size-4" />
              {r.nome}
            </a>
          ))}
        </div>
      </Abertura>

      <Seccao>
        {equipa.estatisticas.pontos > 0 && (
          <Numeros
            className="mb-14"
            colunas={4}
            itens={[
              { valor: equipa.estatisticas.pontos, texto: t.numeros.pontos },
              { valor: equipa.estatisticas.vitorias, texto: t.numeros.vitorias },
              { valor: equipa.estatisticas.podios, texto: t.numeros.podios },
              { valor: equipa.estatisticas.titulos, texto: t.numeros.titulos },
            ].map((n) => ({ ...n, valor: <span className="tabular-nums">{n.valor}</span> }))}
          />
        )}

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <EmblemaEquipa logo={equipa.logo} cor={equipa.cor} className="size-16 text-xl" />
              <div>
                <p className="text-sm text-white/60">{equipa.tipo === "Equipa" ? t.sobreEquipa : t.sobreClube}</p>
                <h2 className="titulo-4 mt-1">{equipa.nome}</h2>
              </div>
            </div>
            <div className="prosa mt-8 max-w-[62ch]">
              <p>{equipa.descricao}</p>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-[var(--intervalo)] sm:grid-cols-4">
              {(
                [
                  ["base", t.dados.base, equipa.base],
                  ["fundacao", t.dados.fundacao, String(equipa.fundacao)],
                  ["responsavel", t.dados.responsavel, equipa.chefe],
                  ["membros", t.dados.membros, String(equipa.membros)],
                ] as const
              ).map(([id, k, v]) => (
                <div key={id} className="flex flex-col-reverse rounded-[var(--raio)] bg-white/5 p-4">
                  <dt className="mt-1 text-xs text-white/55">{k}</dt>
                  <dd className="text-[15px] font-medium leading-snug">{v}</dd>
                </div>
              ))}
            </dl>

            {seus.length > 0 && (
              <div className="mt-14">
                <h2 className="titulo-3">{t.pilotos}</h2>
                <div className="mt-8 grid gap-[var(--intervalo)] sm:grid-cols-2">
                  {seus.map((p) => (
                    <CartaoPiloto key={p.slug} piloto={p} cor={equipa.cor} textos={textosPilotos.cartao} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-[var(--intervalo)] self-start">
            <Ficha
              titulo={t.ficha.titulo}
              icone={<ClipboardList />}
              linhas={[
                [t.ficha.tipo, equipa.tipo],
                [t.ficha.provincia, equipa.provincia],
                [t.ficha.fundacao, String(equipa.fundacao)],
                [t.ficha.membros, String(equipa.membros)],
                [t.ficha.material, equipa.motas.join(", ")],
              ]}
            />

            {posicao && (
              <Ficha titulo={t.campeonato.titulo} icone={<ListOrdered />}>
                <div className="mt-4 flex items-center gap-4">
                  <Posicao posicao={posicao} className="size-14 text-2xl" />
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">
                      {equipa.estatisticas.pontos} <span className="text-sm font-normal text-white/55">{t.campeonato.pts}</span>
                    </p>
                    <p className="text-sm text-white/55">{t.campeonato.texto}</p>
                  </div>
                </div>
                <LigacaoSeta href="/classificacao" className="mt-5">
                  {t.campeonato.ligacao}
                </LigacaoSeta>
              </Ficha>
            )}

            {outras.length > 0 && (
              <Ficha titulo={equipa.tipo === "Equipa" ? t.outrasEquipas : t.outrosClubes} icone={<Shield />}>
                <ul className="mt-4 space-y-[var(--intervalo)]">
                  {outras.map((o) => (
                    <li key={o.slug}>
                      <Link
                        href={`/equipas/${o.slug}`}
                        className="group flex items-center gap-3 rounded-[var(--raio)] bg-white/5 p-[var(--intervalo)] pr-3 transition-colors hover:bg-white/10"
                      >
                        <EmblemaEquipa logo={o.logo} cor={o.cor} className="size-9 text-[10px]" />
                        <span className="min-w-0 flex-1 truncate text-sm">{o.nome}</span>
                        <Seta className="size-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Ficha>
            )}
          </aside>
        </div>
      </Seccao>

    </PaginaInterior>
  );
}
