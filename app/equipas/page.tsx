import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Brand";
import { Icon, PageHero, Tag } from "@/components/ui";
import { equipas, pilotos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Equipas e Clubes",
  description:
    "As equipas de competição e os clubes motard de Angola — história, base, pilotos e palmarés.",
};

export default function EquipasPage() {
  const competicao = equipas.filter((e) => e.tipo === "Equipa");
  const clubes = equipas.filter((e) => e.tipo === "Clube");

  const grupos = [
    {
      titulo: "Equipas de competição",
      descricao: "As estruturas que disputam o Campeonato Nacional.",
      lista: competicao,
    },
    {
      titulo: "Clubes motard",
      descricao: "Comunidades de passeio, convívio e acção social por todo o país.",
      lista: clubes,
    },
  ];

  return (
    <>
      <PageHero
        imagem="equipas"
        eyebrow="Motociclismo angolano"
        titulo="Equipas e clubes"
        descricao="Quem move o motociclismo em Angola — das equipas de competição aos clubes que juntam centenas de motards todos os meses."
      >
        <div className="flex flex-wrap gap-8">
          {[
            { v: competicao.length, l: "Equipas" },
            { v: clubes.length, l: "Clubes" },
            { v: equipas.reduce((s, e) => s + e.membros, 0), l: "Membros" },
            { v: new Set(equipas.map((e) => e.provincia)).size, l: "Províncias" },
          ].map((s) => (
            <div key={s.l}>
              <p className="font-display text-3xl text-white">{s.v}</p>
              <p className="eyebrow mt-1 text-ink-500">{s.l}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {grupos.map((g) => (
          <section key={g.titulo} className="mb-14 last:mb-0">
            <div className="mb-7">
              <h2 className="title-xl text-3xl">{g.titulo}</h2>
              <p className="mt-2 text-sm text-ink-400">{g.descricao}</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {g.lista.map((e) => {
                const seus = pilotos.filter((p) => p.equipaSlug === e.slug);
                return (
                  <Link key={e.slug} href={`/equipas/${e.slug}`} className="group card card-hover overflow-hidden">
                    {/* Fotografia da equipa */}
                    <div className="relative aspect-[16/7]">
                      <Placeholder
                        nome={e.slug}
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                        tamanhos="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    {/* Faixa de cor */}
                    <div className="h-1.5" style={{ background: e.cor }} />

                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <span
                          className="grid size-14 shrink-0 place-items-center font-display text-lg text-white"
                          style={{ background: e.cor }}
                        >
                          {e.logo}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Tag tone="outline">{e.tipo}</Tag>
                            {e.estatisticas.titulos > 0 && (
                              <Tag tone="gold">
                                <Icon name="trophy" className="size-3" />
                                {e.estatisticas.titulos}× Campeã
                              </Tag>
                            )}
                          </div>
                          <h3 className="mt-2 font-display text-xl uppercase leading-tight text-white group-hover:text-mb-red transition-colors">
                            {e.nome}
                          </h3>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                            <Icon name="pin" className="size-3.5" />
                            {e.base} · desde {e.fundacao}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-ink-400 leading-relaxed line-clamp-3">
                        {e.descricao}
                      </p>

                      {/* Pilotos */}
                      {seus.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {seus.map((p) => (
                            <span
                              key={p.slug}
                              className="inline-flex items-center gap-1.5 border border-ink-700 px-2.5 py-1 text-xs text-ink-300"
                            >
                              <span className="font-display text-ink-500">{p.numero}</span>
                              {p.nome}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Estatísticas */}
                      <dl className="mt-5 grid grid-cols-4 divide-x divide-ink-800 border-t border-ink-800 pt-4">
                        {[
                          ["Membros", e.membros],
                          ["Pontos", e.estatisticas.pontos || "—"],
                          ["Vitórias", e.estatisticas.vitorias || "—"],
                          ["Pódios", e.estatisticas.podios || "—"],
                        ].map(([k, v]) => (
                          <div key={k as string} className="px-2 text-center first:pl-0">
                            <dd className="font-display text-base text-white tabular-nums">{v}</dd>
                            <dt className="eyebrow mt-0.5 text-ink-600">{k}</dt>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {/* Registar clube */}
        <section className="relative overflow-hidden border border-ink-700 bg-ink-900 p-8 sm:p-10">
          <div className="speed-lines absolute inset-0 opacity-25" aria-hidden />
          <div className="relative grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow text-mb-red">Falta o seu clube?</p>
              <h2 className="title-xl mt-3 text-2xl sm:text-3xl">Registe o seu clube na Motobox</h2>
              <p className="mt-4 max-w-xl text-sm text-ink-400 leading-relaxed">
                Se organiza passeios, treina pilotos ou junta motards na sua província, queremos o seu
                clube aqui. O registo é gratuito e dá direito a página própria, divulgação de eventos
                no calendário nacional e venda de bilhetes através da plataforma.
              </p>
            </div>
            <Link
              href="/contacto#parcerias"
              className="inline-flex h-13 items-center justify-center gap-2 bg-mb-red px-7 font-display text-sm uppercase tracking-wider text-white hover:bg-mb-red-dark transition-colors"
            >
              Registar clube
              <Icon name="arrow" className="size-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
