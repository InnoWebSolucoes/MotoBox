import type { Metadata } from "next";
import { ButtonLink, Icon, PageHero, Tag } from "@/components/ui";
import { patrocinadores } from "@/lib/data";

export const metadata: Metadata = {
  title: "Patrocinadores",
  description:
    "As marcas que apoiam o motociclismo angolano e tornam possível o campeonato nacional, as provas e a Motobox.",
};

const NIVEIS = [
  {
    id: "Principal" as const,
    titulo: "Patrocinadores principais",
    descricao: "As marcas que sustentam o campeonato nacional e o projecto Motobox.",
    cols: "sm:grid-cols-2",
    altura: "aspect-[16/7]",
  },
  {
    id: "Oficial" as const,
    titulo: "Parceiros oficiais",
    descricao: "Fornecedores e parceiros técnicos das provas do calendário.",
    cols: "sm:grid-cols-3",
    altura: "aspect-[16/9]",
  },
  {
    id: "Apoio" as const,
    titulo: "Apoios",
    descricao: "Marcas que apoiam iniciativas específicas da comunidade.",
    cols: "sm:grid-cols-3 lg:grid-cols-4",
    altura: "aspect-[16/10]",
  },
  {
    id: "Media" as const,
    titulo: "Parceiros de media",
    descricao: "Quem leva o motociclismo angolano à televisão e à rádio.",
    cols: "sm:grid-cols-3 lg:grid-cols-4",
    altura: "aspect-[16/10]",
  },
];

const VANTAGENS = [
  {
    icone: "eye",
    titulo: "Uma audiência dedicada",
    texto:
      "A comunidade motard angolana é pequena mas fiel. Quem chega à Motobox está a procurar exactamente o que a sua marca vende.",
  },
  {
    icone: "flag",
    titulo: "Presença nas provas",
    texto:
      "Visibilidade no circuito, no material da prova e na cobertura fotográfica e vídeo de cada evento do calendário.",
  },
  {
    icone: "heart",
    titulo: "Impacto real",
    texto:
      "O patrocínio financia formação de jovens pilotos, acções solidárias e a estrutura que mantém o desporto vivo em Angola.",
  },
];

export default function PatrocinadoresPage() {
  return (
    <>
      <PageHero
        eyebrow="Quem apoia"
        titulo="Patrocinadores"
        descricao="O motociclismo angolano existe porque há marcas que acreditam nele. Estas são as que estão connosco."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        {NIVEIS.map((nivel) => {
          const lista = patrocinadores.filter((p) => p.nivel === nivel.id);
          if (lista.length === 0) return null;

          return (
            <section key={nivel.id} className="mb-14 last:mb-0">
              <div className="mb-7">
                <div className="flex items-center gap-3">
                  <h2 className="title-xl text-2xl sm:text-3xl">{nivel.titulo}</h2>
                  <Tag tone={nivel.id === "Principal" ? "red" : "outline"}>{lista.length}</Tag>
                </div>
                <p className="mt-2 text-sm text-ink-400">{nivel.descricao}</p>
              </div>

              <div className={`grid gap-4 ${nivel.cols}`}>
                {lista.map((p) => (
                  <a
                    key={p.slug}
                    href={p.website}
                    target={p.website !== "#" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group card card-hover overflow-hidden"
                  >
                    {/* Bloco do logótipo */}
                    <div
                      className={`relative grid ${nivel.altura} place-items-center bg-ink-950 transition-colors group-hover:bg-ink-850`}
                    >
                      <div className="speed-lines absolute inset-0 opacity-20" aria-hidden />
                      <span
                        className={`relative font-display text-white/80 transition-colors group-hover:text-white ${
                          nivel.id === "Principal" ? "text-5xl" : "text-3xl"
                        }`}
                      >
                        {p.logo}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-display text-lg uppercase text-white group-hover:text-mb-red transition-colors">
                            {p.nome}
                          </h3>
                          <p className="mt-0.5 text-xs text-ink-600">{p.setor}</p>
                        </div>
                        <span className="shrink-0 text-[11px] text-ink-600">desde {p.desde}</span>
                      </div>
                      <p className="mt-3 text-sm text-ink-500 leading-relaxed">{p.descricao}</p>
                      {p.website !== "#" && (
                        <span className="mt-3 inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-widest text-mb-red">
                          Visitar
                          <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          );
        })}

        {/* Tornar-se patrocinador */}
        <section className="mt-16 relative overflow-hidden border border-ink-700 bg-ink-900">
          <div className="speed-lines absolute inset-0 opacity-25" aria-hidden />
          <div className="relative p-8 sm:p-12">
            <p className="eyebrow text-mb-red">Parcerias</p>
            <h2 className="title-xl mt-3 max-w-2xl text-3xl sm:text-4xl">
              Ponha a sua marca ao lado do motociclismo angolano
            </h2>
            <p className="mt-5 max-w-2xl text-base text-ink-300 leading-relaxed">
              A Motobox chega a milhares de motards em todo o país — nas provas, nas redes sociais e
              agora nesta plataforma. Temos pacotes de patrocínio para diferentes dimensões e
              orçamentos, do apoio pontual a uma prova até ao patrocínio principal da temporada.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {VANTAGENS.map((v) => (
                <div key={v.titulo}>
                  <span className="grid size-11 place-items-center bg-mb-red/10 text-mb-red">
                    <Icon name={v.icone} className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base uppercase text-white">{v.titulo}</h3>
                  <p className="mt-2 text-sm text-ink-500 leading-relaxed">{v.texto}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/contacto#parcerias" size="lg">
                Pedir apresentação
              </ButtonLink>
              <ButtonLink href="/contacto" variant="outline" size="lg">
                Falar connosco
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* Espaço publicitário */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            {
              t: "Publicidade no site",
              d: "Banners nas páginas de maior tráfego — calendário, resultados e classificação — com relatório mensal de impressões e cliques.",
            },
            {
              t: "Conteúdo patrocinado",
              d: "Artigos, vídeos e cobertura de eventos produzidos pela equipa da Motobox, identificados como conteúdo comercial.",
            },
          ].map((c) => (
            <div key={c.t} className="card p-6">
              <h3 className="font-display text-lg uppercase text-white">{c.t}</h3>
              <p className="mt-2.5 text-sm text-ink-500 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
