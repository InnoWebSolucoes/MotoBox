import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Trophy, Users } from "lucide-react";
import { PaginaInterior } from "@/components/painel/PaginaInterior";
import { Abertura, BotaoMB, CartaoNumerado, Numeros, Seccao } from "@/components/painel/blocos";
import { FotoFundo, Seta } from "@/components/painel/kit";
import { lerEquipas, lerPilotos } from "@/lib/supabase/publico";
import type { Equipa, Piloto } from "@/lib/types";
import { Aviso, EmblemaEquipa, Etiqueta, LigacaoSeta, fotoEquipa } from "@/app/calendario/pecas";
import { lerExtrasEquipas } from "@/app/desporto/dados";
import { EQUIPAS_PADRAO, preencher, type TextosEquipas } from "@/lib/conteudo/grupos/geral";
import { lerTextosEquipas } from "@/lib/conteudo/ler-geral";

// O Next exige um literal aqui, não aceita constante importada.
export const revalidate = 60;

// Os textos fixos editam-se no painel: Provas › Páginas do campeonato › Equipas.
export async function generateMetadata(): Promise<Metadata> {
  const t = await lerTextosEquipas();
  return { title: t.pesquisa.titulo, description: t.pesquisa.descricao };
}

export default async function EquipasPage() {
  const [equipas, pilotos, extras, t] = await Promise.all([lerEquipas(), lerPilotos(), lerExtrasEquipas(), lerTextosEquipas()]);
  const competicao = equipas.filter((e) => e.tipo === "Equipa");
  const clubes = equipas.filter((e) => e.tipo === "Clube");

  const grupos = [
    { chave: "competicao", titulo: t.competicao.titulo, descricao: t.competicao.texto, lista: competicao },
    { chave: "clubes", titulo: t.clubes.titulo, descricao: t.clubes.texto, lista: clubes },
  ];

  return (
    <PaginaInterior icone={<Shield />}>
      <Abertura
        compacta
        foto={t.foto}
        sobretitulo={t.sobretitulo}
        titulo={t.titulo}
        texto={t.texto}
      >
        {t.ligacaoClubes.texto && t.ligacaoClubes.href && (
          <LigacaoSeta href={t.ligacaoClubes.href} className="text-[15px]">
            {t.ligacaoClubes.texto}
          </LigacaoSeta>
        )}
      </Abertura>

      <Seccao>
        <Numeros
          colunas={4}
          itens={[
            { valor: competicao.length, texto: t.numeros.equipas },
            { valor: clubes.length, texto: t.numeros.clubes },
            { valor: equipas.reduce((s, e) => s + e.membros, 0), texto: t.numeros.membros },
            { valor: new Set(equipas.map((e) => e.provincia)).size, texto: t.numeros.provincias },
          ].map((n) => ({ ...n, valor: <span className="tabular-nums">{n.valor}</span> }))}
        />
      </Seccao>

      {equipas.length === 0 && (
        <Seccao className="!pt-0">
          <Aviso titulo={t.vazioTitulo} icone={<Shield />}>
            {t.vazioTexto}
          </Aviso>
        </Seccao>
      )}

      {grupos
        .filter((g) => g.lista.length > 0)
        .map((g) => (
          <Seccao key={g.chave} className="!pt-0">
            <h2 className="titulo-3">{g.titulo}</h2>
            {g.descricao && <p className="mt-3 text-[15px] text-white/65">{g.descricao}</p>}
            <div className="mt-8 grid gap-[var(--intervalo)] md:grid-cols-2">
              {g.lista.map((e) => (
                <CartaoEquipa
                  key={e.slug}
                  equipa={e}
                  capa={extras[e.slug]?.foto}
                  pilotos={pilotos.filter((p) => p.equipaSlug === e.slug)}
                  textos={t.cartao}
                />
              ))}
            </div>
          </Seccao>
        ))}

      {/* Registar clube */}
      {t.registar.mostrar && (
        <Seccao className="!pt-0">
          <CartaoNumerado
            numero={<Users className="size-5" aria-hidden />}
            sobretitulo={t.registar.sobretitulo}
            titulo={t.registar.titulo}
            foto={t.registar.foto}
          >
            {t.registar.texto}
            {t.registar.botao && (
              <span className="mt-6 block">
                <BotaoMB href={t.registar.ligacao || "/contacto#parcerias"}>{t.registar.botao}</BotaoMB>
              </span>
            )}
          </CartaoNumerado>
        </Seccao>
      )}
    </PaginaInterior>
  );
}

/** Cartão de equipa: fotografia com a cor da equipa a subir de baixo, plantel e números. */
function CartaoEquipa({
  equipa: e, pilotos, capa, textos: t = EQUIPAS_PADRAO().cartao,
}: { equipa: Equipa; pilotos: Piloto[]; capa?: string; textos?: TextosEquipas["cartao"] }) {
  return (
    <Link href={`/equipas/${e.slug}`} className="painel painel-escuro group flex flex-col p-[var(--intervalo)]">
      <div className="relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-[var(--raio)] p-5">
        <FotoFundo nome={fotoEquipa(e, capa)} veu="nenhum" largura={900} tamanhos="(max-width: 768px) 100vw, 45vw" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: `linear-gradient(to top, ${e.cor} 0%, color-mix(in srgb, ${e.cor} 60%, transparent) 28%, transparent 70%), linear-gradient(to top, rgb(0 0 0 / 0.35), transparent 60%)`,
          }}
        />
        <div className="flex items-end gap-4">
          <EmblemaEquipa logo={e.logo} cor={e.cor} className="size-14 text-base ring-2 ring-white/70" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Etiqueta tom="vidro">{e.tipo}</Etiqueta>
              {e.estatisticas.titulos > 0 && (
                <Etiqueta tom="vidro">
                  <Trophy className="size-3" aria-hidden />
                  {preencher(t.campea, { n: e.estatisticas.titulos })}
                </Etiqueta>
              )}
            </div>
            <h3 className="mt-2 text-2xl font-semibold leading-tight [text-shadow:0_1px_8px_rgb(0_0_0/0.35)]">{e.nome}</h3>
            <p className="mt-0.5 text-sm text-white/90">
              {preencher(t.desde, { base: e.base, ano: e.fundacao })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 pt-5 md:p-5">
        <p className="text-[15px] leading-relaxed text-white/70 line-clamp-3">{e.descricao}</p>

        {/* Pilotos */}
        {pilotos.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {pilotos.map((p) => (
              <li key={p.slug} className="inline-flex items-center gap-1.5 rounded-[4px] bg-white/7 px-2 py-1 text-xs text-white/80">
                <span className="tabular-nums text-white/45">{p.numero}</span>
                {p.nome}
              </li>
            ))}
          </ul>
        )}

        {/* Estatísticas */}
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <dl className="grid flex-1 grid-cols-4 gap-3 border-t border-white/8 pt-4">
            {(
              [
                ["membros", t.membros, e.membros],
                ["pontos", t.pontos, e.estatisticas.pontos],
                ["vitorias", t.vitorias, e.estatisticas.vitorias],
                ["podios", t.podios, e.estatisticas.podios],
              ] as const
            ).map(([id, k, v]) => (
              <div key={id} className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-white/50">{k}</dt>
                <dd className="text-xl font-semibold leading-none tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <Seta className="mb-1 size-3.5" />
        </div>
      </div>
    </Link>
  );
}
